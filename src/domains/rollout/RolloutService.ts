import {
  PrismaClient,
  RolloutProjectStatus,
  ConsignmentStatus,
  AuditEntityType,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../shared/db/client';
import { AuditLogService } from '../../shared/audit/AuditLogService';
import { Errors } from '../../shared/errors/AppError';
import { ConsignmentService } from '../consignment/ConsignmentService';
import type {
  CreateRolloutProjectInput,
  AddWaveInput,
  AddSiteInput,
  SiteProfitability,
  ProjectProfitabilityReport,
} from './types';

const EARLY_WARNING_THRESHOLD_PERCENT = 10; // 10% over quote triggers alert
const EARLY_WARNING_SITE_COUNT = 3;         // After 3 completed sites

let _projectCounter = 100;
function generateProjectCode(): string {
  return `RP-${String(++_projectCounter).padStart(5, '0')}`;
}

export class RolloutService {
  private readonly db: PrismaClient;
  private readonly audit: AuditLogService;
  private readonly consignmentService: ConsignmentService;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
    this.audit = new AuditLogService(db);
    this.consignmentService = new ConsignmentService(db);
  }

  /**
   * Create a new rollout project.
   */
  async createProject(input: CreateRolloutProjectInput, userId: string) {
    const projectCode = generateProjectCode();

    const project = await this.db.rolloutProject.create({
      data: {
        id: uuidv4(),
        projectCode,
        customerId: input.customerId,
        projectName: input.projectName,
        coordinatorId: input.coordinatorId,
        marginTargetPercent: input.marginTargetPercent ?? 20,
        startDate: input.startDate,
        endDate: input.endDate,
        status: RolloutProjectStatus.DRAFT,
      },
    });

    await this.audit.log({
      entityType: AuditEntityType.ROLLOUT_PROJECT,
      entityId: project.id,
      action: 'ROLLOUT_PROJECT_CREATED',
      newValue: { projectCode, projectName: input.projectName, customerId: input.customerId },
      userId,
    });

    return project;
  }

  /**
   * Add a wave to an existing rollout project.
   */
  async addWave(projectId: string, input: AddWaveInput, userId: string) {
    const project = await this.db.rolloutProject.findUnique({ where: { id: projectId } });
    if (!project) throw Errors.notFound('RolloutProject', projectId);

    // Check for duplicate wave number
    const existing = await this.db.rolloutWave.findFirst({
      where: { projectId, waveNumber: input.waveNumber },
    });
    if (existing) {
      throw Errors.conflict(
        `Wave ${input.waveNumber} already exists on project ${project.projectCode}`,
        { projectId, waveNumber: input.waveNumber }
      );
    }

    const wave = await this.db.rolloutWave.create({
      data: {
        id: uuidv4(),
        projectId,
        waveNumber: input.waveNumber,
        waveName: input.waveName,
        plannedDate: input.plannedDate,
      },
    });

    return wave;
  }

  /**
   * Add a site to a wave (creates a child consignment).
   */
  async addSite(projectId: string, waveId: string, input: AddSiteInput, userId: string) {
    const project = await this.db.rolloutProject.findUnique({
      where: { id: projectId },
    });
    if (!project) throw Errors.notFound('RolloutProject', projectId);

    const wave = await this.db.rolloutWave.findUnique({ where: { id: waveId } });
    if (!wave) throw Errors.notFound('RolloutWave', waveId);
    if (wave.projectId !== projectId) {
      throw Errors.validation('Wave does not belong to this project', { waveId, projectId });
    }

    // Create the consignment for this site
    const consignment = await this.consignmentService.createConsignment(
      {
        customerId: project.customerId,
        pickupAddress: input.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        pickupDate: input.pickupDate,
        deliveryDate: input.deliveryDate,
        quotedRevenueCents: input.quotedRevenueCents,
        rolloutProjectId: projectId,
        rolloutWaveId: waveId,
        items: input.items,
        specialInstructions: `Rollout project: ${project.projectCode}, Wave: ${wave.waveName}, Site: ${input.siteName}`,
      },
      userId
    );

    // Update wave site count + project totals
    await this.db.$transaction([
      this.db.rolloutWave.update({
        where: { id: waveId },
        data: { siteCount: { increment: 1 } },
      }),
      this.db.rolloutProject.update({
        where: { id: projectId },
        data: {
          totalSites: { increment: 1 },
          totalRevenueCents: { increment: input.quotedRevenueCents ?? 0 },
          totalM3: { increment: consignment.totalM3 },
        },
      }),
    ]);

    await this.audit.log({
      entityType: AuditEntityType.ROLLOUT_PROJECT,
      entityId: projectId,
      action: 'SITE_ADDED',
      newValue: {
        waveId,
        consignmentId: consignment.id,
        connoteNumber: consignment.connoteNumber,
        siteName: input.siteName,
      },
      userId,
    });

    return { project, wave, consignment };
  }

  /**
   * Get full profitability report for a rollout project.
   * Returns per-site breakdown sorted by margin ascending (worst sites first).
   * Triggers early-warning alert if warranted.
   */
  async getProjectProfitability(projectId: string): Promise<ProjectProfitabilityReport> {
    const project = await this.db.rolloutProject.findUnique({
      where: { id: projectId },
      include: {
        waves: { orderBy: { waveNumber: 'asc' } },
      },
    });

    if (!project) throw Errors.notFound('RolloutProject', projectId);

    // Get all consignments for this project with their tasks
    const consignments = await this.db.consignment.findMany({
      where: { rolloutProjectId: projectId },
      include: {
        tasks: true,
        rolloutWave: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const sites: SiteProfitability[] = consignments.map((c) => {
      const actualCostCents = c.tasks.reduce(
        (sum, t) => sum + (t.actualCostCents ?? 0),
        0
      );
      const revenueCents = c.quotedRevenueCents;
      const marginCents = revenueCents - actualCostCents;
      const marginPercent = revenueCents > 0 ? (marginCents / revenueCents) * 100 : 0;
      const completedTaskCount = c.tasks.filter(
        (t) => t.status === 'DONE' || t.status === 'FUTILE'
      ).length;

      return {
        consignmentId: c.id,
        connoteNumber: c.connoteNumber,
        deliveryAddress: c.deliveryAddress,
        waveNumber: c.rolloutWave?.waveNumber ?? 0,
        waveName: c.rolloutWave?.waveName ?? 'Unassigned',
        quotedRevenueCents: revenueCents,
        actualCostCents,
        marginCents,
        marginPercent: Math.round(marginPercent * 100) / 100,
        taskCount: c.tasks.length,
        completedTaskCount,
        status: c.status,
      };
    });

    // Sort by margin ascending (worst first)
    sites.sort((a, b) => a.marginPercent - b.marginPercent);

    const totalRevenueCents = sites.reduce((s, x) => s + x.quotedRevenueCents, 0);
    const totalCostCents = sites.reduce((s, x) => s + x.actualCostCents, 0);
    const marginCents = totalRevenueCents - totalCostCents;
    const marginPercent =
      totalRevenueCents > 0 ? (marginCents / totalRevenueCents) * 100 : 0;

    const completedSites = sites.filter(
      (s) => s.status === ConsignmentStatus.COMP || s.status === ConsignmentStatus.PARTDEL
    );

    // ─── Early warning alert ──────────────────────────────────────────────────
    let earlyWarningAlert: string | undefined;

    if (completedSites.length >= EARLY_WARNING_SITE_COUNT) {
      const avgActualCost =
        completedSites.reduce((s, x) => s + x.actualCostCents, 0) / completedSites.length;
      const avgQuotedRevenue =
        completedSites.reduce((s, x) => s + x.quotedRevenueCents, 0) / completedSites.length;

      // Cost vs revenue comparison (if cost > revenue * threshold)
      const overage =
        avgQuotedRevenue > 0
          ? ((avgActualCost - avgQuotedRevenue) / avgQuotedRevenue) * 100
          : 0;

      if (overage > EARLY_WARNING_THRESHOLD_PERCENT) {
        const overageRounded = Math.round(overage * 10) / 10;

        earlyWarningAlert = `Rollout ${project.projectCode}: trending unprofitable. Actual avg cost/site is ${overageRounded}% above quote after ${completedSites.length} sites.`;

        // Persist alert if not already created
        await this.upsertEarlyWarningAlert(projectId, earlyWarningAlert);
      }
    }

    return {
      projectId,
      projectCode: project.projectCode,
      projectName: project.projectName,
      totalRevenueCents,
      totalCostCents,
      marginCents,
      marginPercent: Math.round(marginPercent * 100) / 100,
      siteCount: sites.length,
      completedSiteCount: completedSites.length,
      targetMarginPercent: project.marginTargetPercent,
      sites,
      earlyWarningAlert,
    };
  }

  /**
   * List all sites for a project with per-site margin.
   */
  async getProjectSites(projectId: string) {
    const project = await this.db.rolloutProject.findUnique({ where: { id: projectId } });
    if (!project) throw Errors.notFound('RolloutProject', projectId);

    const consignments = await this.db.consignment.findMany({
      where: { rolloutProjectId: projectId },
      include: {
        tasks: { select: { actualCostCents: true } },
        rolloutWave: { select: { waveNumber: true, waveName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return consignments.map((c) => {
      const actualCostCents = c.tasks.reduce((s, t) => s + (t.actualCostCents ?? 0), 0);
      const marginCents = c.quotedRevenueCents - actualCostCents;
      const marginPercent =
        c.quotedRevenueCents > 0 ? (marginCents / c.quotedRevenueCents) * 100 : 0;

      return {
        consignmentId: c.id,
        connoteNumber: c.connoteNumber,
        deliveryAddress: c.deliveryAddress,
        waveNumber: c.rolloutWave?.waveNumber ?? null,
        waveName: c.rolloutWave?.waveName ?? null,
        status: c.status,
        quotedRevenueCents: c.quotedRevenueCents,
        actualCostCents,
        marginCents,
        marginPercent: Math.round(marginPercent * 100) / 100,
      };
    });
  }

  private async upsertEarlyWarningAlert(projectId: string, message: string): Promise<void> {
    const existing = await this.db.rolloutAlert.findFirst({
      where: {
        projectId,
        alertType: 'EARLY_WARNING_UNPROFITABLE',
        isRead: false,
      },
    });

    if (!existing) {
      await this.db.rolloutAlert.create({
        data: {
          id: uuidv4(),
          projectId,
          alertType: 'EARLY_WARNING_UNPROFITABLE',
          message,
        },
      });
    }
  }
}

export const rolloutService = new RolloutService();
