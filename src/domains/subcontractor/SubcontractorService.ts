import {
  PrismaClient,
  SubcontractorJobStatus,
  EscalationLevel,
  AuditEntityType,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import prisma from '../../shared/db/client';
import { AuditLogService } from '../../shared/audit/AuditLogService';
import { Errors } from '../../shared/errors/AppError';
import { callClaudeJSON } from '../../shared/claude/client';
import { getQueue, QUEUE_NAMES } from '../../shared/queue/bullmq';
import type {
  AssignSubcontractorInput,
  SubbieTokenUpdatePayload,
  SubcontractorJobStatusResult,
  ParsedSubcontractorEmail,
} from './types';

const TOKEN_VALID_HOURS = 72;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Escalation delays in milliseconds
const ESCALATION_DELAYS = {
  LEVEL1_MS: 1 * 60 * 60 * 1000,   // +1 hour
  LEVEL2_MS: 4 * 60 * 60 * 1000,   // +4 hours
  LEVEL3_MS: 24 * 60 * 60 * 1000,  // +24 hours
};

export class SubcontractorService {
  private readonly db: PrismaClient;
  private readonly audit: AuditLogService;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
    this.audit = new AuditLogService(db);
  }

  /**
   * Assign a subcontractor to a consignment.
   * - Creates subcontractor job
   * - Generates a signed JWT token (valid 72h) for the subbie link
   * - Schedules three escalation BullMQ jobs
   */
  async assignSubcontractor(input: AssignSubcontractorInput, userId: string) {
    const consignment = await this.db.consignment.findUnique({
      where: { id: input.consignmentId },
    });
    if (!consignment) throw Errors.notFound('Consignment', input.consignmentId);

    const subcontractor = await this.db.subcontractor.findUnique({
      where: { id: input.subcontractorId },
    });
    if (!subcontractor) throw Errors.notFound('Subcontractor', input.subcontractorId);

    const jobId = uuidv4();
    const tokenExpiresAt = new Date(Date.now() + TOKEN_VALID_HOURS * 60 * 60 * 1000);

    // Generate signed JWT token
    const signedToken = jwt.sign(
      {
        jobId,
        consignmentId: input.consignmentId,
        subcontractorId: input.subcontractorId,
        purpose: 'subbie-status-update',
      },
      JWT_SECRET,
      { expiresIn: `${TOKEN_VALID_HOURS}h` }
    );

    // Schedule escalation jobs
    const escalationQueue = getQueue(QUEUE_NAMES.SUBCONTRACTOR_ESCALATION);

    const job1 = await escalationQueue.add(
      'escalation-level1',
      {
        jobId,
        consignmentId: input.consignmentId,
        level: 'LEVEL1',
        expectedDeliveryAt: input.expectedDeliveryAt.toISOString(),
      },
      {
        delay: ESCALATION_DELAYS.LEVEL1_MS,
        jobId: `esc1-${jobId}`,
        removeOnComplete: true,
      }
    );

    const job2 = await escalationQueue.add(
      'escalation-level2',
      {
        jobId,
        consignmentId: input.consignmentId,
        level: 'LEVEL2',
      },
      {
        delay: ESCALATION_DELAYS.LEVEL2_MS,
        jobId: `esc2-${jobId}`,
        removeOnComplete: true,
      }
    );

    const job3 = await escalationQueue.add(
      'escalation-level3',
      {
        jobId,
        consignmentId: input.consignmentId,
        level: 'LEVEL3',
      },
      {
        delay: ESCALATION_DELAYS.LEVEL3_MS,
        jobId: `esc3-${jobId}`,
        removeOnComplete: true,
      }
    );

    const subbieJob = await this.db.subcontractorJob.create({
      data: {
        id: jobId,
        consignmentId: input.consignmentId,
        subcontractorId: input.subcontractorId,
        customerId: input.customerId,
        status: SubcontractorJobStatus.ASSIGNED,
        escalationLevel: EscalationLevel.NONE,
        signedToken,
        tokenExpiresAt,
        expectedDeliveryAt: input.expectedDeliveryAt,
        escalationJob1Id: job1.id,
        escalationJob2Id: job2.id,
        escalationJob3Id: job3.id,
      },
    });

    await this.audit.log({
      entityType: AuditEntityType.SUBCONTRACTOR_JOB,
      entityId: jobId,
      action: 'SUBCONTRACTOR_ASSIGNED',
      newValue: {
        subcontractorId: input.subcontractorId,
        consignmentId: input.consignmentId,
        expectedDeliveryAt: input.expectedDeliveryAt,
      },
      userId,
    });

    const subbieLink = `${process.env.APP_URL ?? 'https://tms.snapes.com.au'}/subbie/update?token=${signedToken}`;

    return {
      jobId,
      subbieLink,
      tokenExpiresAt,
      signedToken,
    };
  }

  /**
   * Process a status update from a subcontractor via their signed token link.
   * Validates token, records status, cancels pending escalations if delivered.
   */
  async processSubbieTokenUpdate(
    token: string,
    updatePayload: Omit<SubbieTokenUpdatePayload, 'token'>
  ) {
    // Validate JWT
    let decoded: { jobId: string; consignmentId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as typeof decoded;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) throw Errors.tokenExpired();
      throw Errors.tokenInvalid();
    }

    const job = await this.db.subcontractorJob.findUnique({
      where: { id: decoded.jobId },
    });

    if (!job) throw Errors.notFound('SubcontractorJob', decoded.jobId);

    // Check token matches DB record (prevents reuse of revoked tokens)
    if (job.signedToken !== token) throw Errors.tokenInvalid();
    if (new Date() > job.tokenExpiresAt) throw Errors.tokenExpired();

    // Record status update
    await this.db.subcontractorStatusUpdate.create({
      data: {
        id: uuidv4(),
        jobId: job.id,
        status: updatePayload.status,
        notes: updatePayload.notes,
        podPhotoUrl: updatePayload.podPhotoUrl,
        deliveryTime: updatePayload.deliveryTime,
        source: 'TOKEN_LINK',
      },
    });

    const isDelivered =
      updatePayload.status === SubcontractorJobStatus.DELIVERED ||
      updatePayload.status === SubcontractorJobStatus.FUTILE;

    // Cancel pending escalations if job is complete
    if (isDelivered) {
      await this.cancelEscalations(job);
    }

    const updatedJob = await this.db.subcontractorJob.update({
      where: { id: job.id },
      data: {
        status: updatePayload.status,
        lastUpdateAt: new Date(),
        deliveredAt: isDelivered ? (updatePayload.deliveryTime ?? new Date()) : undefined,
        deliveryNotes: updatePayload.notes,
        podPhotoUrl: updatePayload.podPhotoUrl,
        escalationLevel: isDelivered ? EscalationLevel.NONE : job.escalationLevel,
      },
    });

    await this.audit.log({
      entityType: AuditEntityType.SUBCONTRACTOR_JOB,
      entityId: job.id,
      action: 'STATUS_UPDATE_RECEIVED',
      previousValue: { status: job.status },
      newValue: { status: updatePayload.status, source: 'TOKEN_LINK' },
      userId: 'subcontractor',
    });

    return updatedJob;
  }

  /**
   * Get the current status of a subcontractor job for a consignment.
   */
  async getSubcontractorJobStatus(consignmentId: string): Promise<SubcontractorJobStatusResult> {
    const job = await this.db.subcontractorJob.findUnique({
      where: { consignmentId },
    });

    if (!job) throw Errors.notFound('SubcontractorJob', consignmentId);

    return {
      jobId: job.id,
      consignmentId: job.consignmentId,
      status: job.status,
      escalationLevel: job.escalationLevel,
      lastUpdateAt: job.lastUpdateAt,
      expectedDeliveryAt: job.expectedDeliveryAt,
      deliveredAt: job.deliveredAt,
      deliveryNotes: job.deliveryNotes,
      podPhotoUrl: job.podPhotoUrl,
    };
  }

  /**
   * Manual status update by Snapes staff on subcontractor's behalf.
   */
  async manualUpdate(
    jobId: string,
    updatePayload: {
      status: SubcontractorJobStatus;
      deliveryTime?: Date;
      podPhotoUrl?: string;
      notes?: string;
    },
    userId: string
  ) {
    const job = await this.db.subcontractorJob.findUnique({ where: { id: jobId } });
    if (!job) throw Errors.notFound('SubcontractorJob', jobId);

    await this.db.subcontractorStatusUpdate.create({
      data: {
        id: uuidv4(),
        jobId: job.id,
        status: updatePayload.status,
        notes: updatePayload.notes,
        podPhotoUrl: updatePayload.podPhotoUrl,
        deliveryTime: updatePayload.deliveryTime,
        source: 'MANUAL',
        recordedBy: userId,
      },
    });

    const isDelivered =
      updatePayload.status === SubcontractorJobStatus.DELIVERED ||
      updatePayload.status === SubcontractorJobStatus.FUTILE;

    if (isDelivered) {
      await this.cancelEscalations(job);
    }

    const updated = await this.db.subcontractorJob.update({
      where: { id: jobId },
      data: {
        status: updatePayload.status,
        lastUpdateAt: new Date(),
        deliveredAt: isDelivered ? (updatePayload.deliveryTime ?? new Date()) : undefined,
        deliveryNotes: updatePayload.notes,
        podPhotoUrl: updatePayload.podPhotoUrl,
      },
    });

    await this.audit.log({
      entityType: AuditEntityType.SUBCONTRACTOR_JOB,
      entityId: jobId,
      action: 'MANUAL_STATUS_UPDATE',
      previousValue: { status: job.status },
      newValue: { status: updatePayload.status },
      userId,
    });

    return updated;
  }

  /**
   * Parse a status email from a subcontractor using Claude.
   */
  async parseSubcontractorEmail(emailText: string): Promise<ParsedSubcontractorEmail> {
    const prompt = `You are a logistics operations assistant for Snapes Project Logistics.

Parse the following email from a subcontractor and extract the delivery status information.
Return ONLY a valid JSON object with no markdown fences.

JSON schema:
{
  "jobReference": string | null,      // job number, consignment number, or reference from email
  "status": "ASSIGNED" | "ACKNOWLEDGED" | "PICKUP_COMPLETE" | "IN_TRANSIT" | "DELIVERED" | "FUTILE" | "UNKNOWN_STATUS" | null,
  "deliveryTime": string | null,       // ISO 8601 datetime if mentioned
  "notes": string | null,              // any relevant notes about the delivery
  "confidence": number                 // 0.0 to 1.0
}

Status mapping rules:
- "picked up", "collected", "at depot" → PICKUP_COMPLETE
- "on the way", "en route", "in transit", "out for delivery" → IN_TRANSIT
- "delivered", "POD", "signed", "completed" → DELIVERED
- "unable to deliver", "no access", "not home", "futile" → FUTILE
- If job couldn't be done for any reason → FUTILE

Email:
${emailText}

Return ONLY the JSON object. No markdown fences.`;

    try {
      const result = await callClaudeJSON<ParsedSubcontractorEmail>(prompt, {
        maxTokens: 512,
      });

      // Parse deliveryTime string to Date if present
      if (result.deliveryTime && typeof result.deliveryTime === 'string') {
        const parsed = new Date(result.deliveryTime);
        result.deliveryTime = isNaN(parsed.getTime()) ? null : parsed;
      }

      return result;
    } catch {
      return {
        jobReference: null,
        status: null,
        deliveryTime: null,
        notes: null,
        confidence: 0,
      };
    }
  }

  /**
   * Handle escalation processing (called by BullMQ worker).
   */
  async processEscalation(
    jobId: string,
    level: 'LEVEL1' | 'LEVEL2' | 'LEVEL3'
  ): Promise<void> {
    const job = await this.db.subcontractorJob.findUnique({
      where: { id: jobId },
      include: { subcontractor: true },
    });

    if (!job) return; // Job may have been deleted/completed

    // Skip if already delivered
    if (
      job.status === SubcontractorJobStatus.DELIVERED ||
      job.status === SubcontractorJobStatus.FUTILE
    ) {
      return;
    }

    const deliveryTimeStr = job.expectedDeliveryAt.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });

    if (level === 'LEVEL1') {
      // Notify dispatcher
      await this.db.notification.create({
        data: {
          id: uuidv4(),
          userId: 'dispatcher',
          subject: `Subcontractor Update Overdue — Job ${jobId}`,
          body: `Job ${jobId} expected delivered by ${deliveryTimeStr}. No update received from subcontractor ${job.subcontractor.name}.`,
          channel: 'INTERNAL',
          relatedType: 'SUBCONTRACTOR_JOB',
          relatedId: jobId,
        },
      });

      await this.db.subcontractorJob.update({
        where: { id: jobId },
        data: { escalationLevel: EscalationLevel.DISPATCHER },
      });
    } else if (level === 'LEVEL2') {
      // Escalate to ops manager
      await this.db.notification.create({
        data: {
          id: uuidv4(),
          userId: 'ops-manager',
          subject: `ESCALATED: Subcontractor Job ${jobId} — 4 hours overdue`,
          body: `Job ${jobId} from subcontractor ${job.subcontractor.name} has not been updated in 4+ hours. Expected delivery: ${deliveryTimeStr}. Immediate follow-up required.`,
          channel: 'INTERNAL',
          relatedType: 'SUBCONTRACTOR_JOB',
          relatedId: jobId,
        },
      });

      await this.db.subcontractorJob.update({
        where: { id: jobId },
        data: { escalationLevel: EscalationLevel.MANAGER },
      });
    } else if (level === 'LEVEL3') {
      // Auto-email subcontractor + set UNKNOWN_STATUS
      await this.db.notification.create({
        data: {
          id: uuidv4(),
          userId: job.subcontractor.email,
          subject: `Status Request — Job ${jobId}`,
          body: `Dear ${job.subcontractor.name},\n\nWe have not received any status update for job ${jobId} (expected delivery: ${deliveryTimeStr}).\n\nPlease update us immediately on the status of this delivery.\n\nSnapes Project Logistics Operations Team`,
          channel: 'EMAIL',
          relatedType: 'SUBCONTRACTOR_JOB',
          relatedId: jobId,
        },
      });

      await this.db.subcontractorJob.update({
        where: { id: jobId },
        data: {
          status: SubcontractorJobStatus.UNKNOWN_STATUS,
          escalationLevel: EscalationLevel.AUTO_EMAIL_SENT,
        },
      });
    }
  }

  private async cancelEscalations(job: {
    id: string;
    escalationJob1Id: string | null;
    escalationJob2Id: string | null;
    escalationJob3Id: string | null;
  }): Promise<void> {
    const escalationQueue = getQueue(QUEUE_NAMES.SUBCONTRACTOR_ESCALATION);

    const jobIds = [
      job.escalationJob1Id ? `esc1-${job.id}` : null,
      job.escalationJob2Id ? `esc2-${job.id}` : null,
      job.escalationJob3Id ? `esc3-${job.id}` : null,
    ].filter(Boolean) as string[];

    await Promise.allSettled(
      jobIds.map((id) =>
        escalationQueue.remove(id).catch(() => {
          // Job may have already run or been removed — this is acceptable
        })
      )
    );

    // Clear job IDs from DB
    await this.db.subcontractorJob.update({
      where: { id: job.id },
      data: {
        escalationJob1Id: null,
        escalationJob2Id: null,
        escalationJob3Id: null,
      },
    });
  }
}

export const subcontractorService = new SubcontractorService();
