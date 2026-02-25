import { PrismaClient, ConsignmentStatus, ItemType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../shared/db/client';
import { callClaudeJSON } from '../../shared/claude/client';
import { AuditLogService } from '../../shared/audit/AuditLogService';
import { AppError, Errors } from '../../shared/errors/AppError';
import { calculateConsignmentTotals } from '../freight/FreightMeasurementEngine';
import { buildExtractionPrompt } from './ExtractionPrompt';
import type {
  IntakeEmailInput,
  ExtractedConsignment,
  DraftConsignmentResult,
  ExtractedItemType,
} from './types';

const DUPLICATE_WINDOW_HOURS = 48;
const LOW_CONFIDENCE_THRESHOLD = 0.7;

function mapItemType(extracted: ExtractedItemType): ItemType {
  const map: Record<ExtractedItemType, ItemType> = {
    pallet: ItemType.PALLET,
    trolley: ItemType.TROLLEY,
    furniture: ItemType.FURNITURE,
    loose: ItemType.LOOSE,
    carton: ItemType.CARTON,
    unknown: ItemType.UNKNOWN,
  };
  return map[extracted] ?? ItemType.UNKNOWN;
}

/** Generate connote number: SVC + epoch-based 4-digit suffix */
let connoteCounter = 1000;
function generateConnoteNumber(): string {
  const num = ++connoteCounter;
  return `SVC${num}`;
}

export class IntakeService {
  private readonly db: PrismaClient;
  private readonly audit: AuditLogService;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
    this.audit = new AuditLogService(db);
  }

  /**
   * Process an inbound email: extract consignment data via Claude,
   * create a draft consignment, detect duplicates.
   */
  async processEmail(
    input: IntakeEmailInput,
    userId: string = 'system'
  ): Promise<DraftConsignmentResult> {
    const prompt = buildExtractionPrompt(input.emailText, input.attachmentText);

    // Call Claude to extract structured data
    const extraction = await callClaudeJSON<ExtractedConsignment>(prompt, {
      systemPrompt:
        'You are a logistics data extraction assistant. Return only valid JSON with no markdown fences.',
      maxTokens: 2048,
    });

    // Compute uncertain fields (confidence < threshold)
    const uncertainFields = this.collectUncertainFields(extraction);

    // Look up or stub the customer
    let customer = await this.db.customer.findFirst({
      where: {
        name: {
          contains: extraction.customer.name,
          mode: 'insensitive',
        },
      },
    });

    if (!customer) {
      customer = await this.db.customer.create({
        data: {
          id: uuidv4(),
          name: extraction.customer.name,
          code: extraction.customer.name.toUpperCase().replace(/\s+/g, '_').slice(0, 20),
        },
      });
    }

    // Check for duplicates: same customer + similar route, created within 48h
    const duplicateWindow = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000);
    const potentialDuplicate = await this.db.consignment.findFirst({
      where: {
        customerId: customer.id,
        pickupAddress: {
          contains: extraction.pickupAddress.value.split(',')[0].trim(),
          mode: 'insensitive',
        },
        deliveryAddress: {
          contains: extraction.deliveryAddress.value.split(',')[0].trim(),
          mode: 'insensitive',
        },
        createdAt: { gte: duplicateWindow },
        status: { not: ConsignmentStatus.DFT },
      },
      orderBy: { createdAt: 'desc' },
    });

    const connoteNumber = generateConnoteNumber();

    // Build freight items for calculation
    const freightItems = extraction.items.map((it) => ({
      widthMm: it.widthMm ?? 1200,
      depthMm: it.depthMm ?? 1200,
      heightMm: it.heightMm ?? 1200,
      weightKgEach: it.weightKgEach ?? 50,
      quantity: it.quantity,
      stackable: it.stackable,
    }));

    const freightSummary = calculateConsignmentTotals(freightItems);

    // Create the consignment with all items
    const consignment = await this.db.consignment.create({
      data: {
        id: uuidv4(),
        connoteNumber,
        status: ConsignmentStatus.DFT,
        customerId: customer.id,
        pickupAddress: extraction.pickupAddress.value,
        deliveryAddress: extraction.deliveryAddress.value,
        pickupDate: extraction.requestedPickupDate.value
          ? new Date(extraction.requestedPickupDate.value)
          : null,
        deliveryDate: extraction.requestedDeliveryDate.value
          ? new Date(extraction.requestedDeliveryDate.value)
          : null,
        totalPS: freightSummary.totalPS,
        totalM3: freightSummary.totalM3,
        totalWeightKg: freightSummary.totalWeightKg,
        isPotentialDuplicate: !!potentialDuplicate,
        duplicateOfId: potentialDuplicate?.id ?? null,
        specialInstructions: extraction.specialInstructions,
        referenceNumbers: extraction.referenceNumbers,
        items: {
          create: extraction.items.map((it, idx) => {
            const psResult = calculateConsignmentTotals([
              {
                widthMm: it.widthMm ?? 1200,
                depthMm: it.depthMm ?? 1200,
                heightMm: it.heightMm ?? 1200,
                weightKgEach: it.weightKgEach ?? 50,
                quantity: 1,
                stackable: it.stackable,
              },
            ]);
            return {
              id: uuidv4(),
              description: it.description,
              itemType: mapItemType(it.itemType),
              quantity: it.quantity,
              widthMm: it.widthMm,
              depthMm: it.depthMm,
              heightMm: it.heightMm,
              weightKgEach: it.weightKgEach,
              stackable: it.stackable,
              specialHandling: it.specialHandling,
              palletSpaces: psResult.totalPS,
              m3: psResult.totalM3,
              chargeableM3: psResult.totalChargeableM3,
              isOverheight: psResult.hasOverheight,
              isOversized: psResult.hasOversized,
              itemCode: `${connoteNumber}-${String(idx + 1).padStart(3, '0')}`,
              sequence: idx + 1,
            };
          }),
        },
      },
    });

    // Write audit log
    await this.audit.log({
      entityType: 'CONSIGNMENT',
      entityId: consignment.id,
      action: 'INTAKE_EMAIL_PROCESSED',
      newValue: {
        connoteNumber,
        customerId: customer.id,
        status: 'DFT',
        isPotentialDuplicate: !!potentialDuplicate,
        overallConfidence: extraction.overallConfidence,
        uncertainFields,
      },
      userId,
      consignmentId: consignment.id,
    });

    return {
      consignmentId: consignment.id,
      connoteNumber,
      status: 'DFT',
      isPotentialDuplicate: !!potentialDuplicate,
      duplicateOfId: potentialDuplicate?.id,
      extraction,
      uncertainFields,
      freightSummary: {
        totalPS: freightSummary.totalPS,
        totalM3: freightSummary.totalM3,
        totalWeightKg: freightSummary.totalWeightKg,
      },
    };
  }

  /**
   * Confirm a draft consignment → moves to BOOK status.
   */
  async confirmDraft(
    consignmentId: string,
    userId: string
  ): Promise<{ consignmentId: string; connoteNumber: string; status: ConsignmentStatus }> {
    const consignment = await this.db.consignment.findUnique({
      where: { id: consignmentId },
    });

    if (!consignment) {
      throw Errors.notFound('Consignment', consignmentId);
    }

    if (consignment.status !== ConsignmentStatus.DFT) {
      throw Errors.conflict(
        `Consignment ${consignment.connoteNumber} is not in DFT status (current: ${consignment.status})`,
        { consignmentId, status: consignment.status }
      );
    }

    const previous = { status: consignment.status };

    const updated = await this.db.consignment.update({
      where: { id: consignmentId },
      data: { status: ConsignmentStatus.BOOK },
    });

    await this.audit.log({
      entityType: 'CONSIGNMENT',
      entityId: consignmentId,
      action: 'DRAFT_CONFIRMED',
      previousValue: previous,
      newValue: { status: ConsignmentStatus.BOOK },
      userId,
      consignmentId,
    });

    return {
      consignmentId: updated.id,
      connoteNumber: updated.connoteNumber,
      status: updated.status,
    };
  }

  /** Collect fields where confidence falls below threshold */
  private collectUncertainFields(extraction: ExtractedConsignment): string[] {
    const fields: string[] = [];

    if (extraction.customer.confidence < LOW_CONFIDENCE_THRESHOLD) fields.push('customer');
    if (extraction.pickupAddress.confidence < LOW_CONFIDENCE_THRESHOLD) fields.push('pickupAddress');
    if (extraction.deliveryAddress.confidence < LOW_CONFIDENCE_THRESHOLD) fields.push('deliveryAddress');
    if (extraction.requestedPickupDate.confidence < LOW_CONFIDENCE_THRESHOLD) fields.push('requestedPickupDate');
    if (extraction.requestedDeliveryDate.confidence < LOW_CONFIDENCE_THRESHOLD) fields.push('requestedDeliveryDate');

    extraction.items.forEach((it, idx) => {
      if (it.confidence < LOW_CONFIDENCE_THRESHOLD) fields.push(`items[${idx}]`);
    });

    // Merge with what Claude already identified
    const merged = [...new Set([...fields, ...(extraction.uncertainFields ?? [])])];
    return merged;
  }
}

export const intakeService = new IntakeService();
