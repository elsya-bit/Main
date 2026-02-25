import { PrismaClient, ScanType, DiscrepancyType, DiscrepancyStatus, AuditEntityType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../shared/db/client';
import { AuditLogService } from '../../shared/audit/AuditLogService';
import { Errors } from '../../shared/errors/AppError';
import type { ScanEventInput, LabelData, CustodyChainEntry, DiscrepancyAlert } from './types';

export class ScanningService {
  private readonly db: PrismaClient;
  private readonly audit: AuditLogService;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
    this.audit = new AuditLogService(db);
  }

  /**
   * Record a scan event. After recording, run discrepancy detection.
   *
   * Scenario 19 enforcement: if scanType is LOAD_OUTBOUND_VEHICLE or
   * LOAD_DELIVERY_VEHICLE, validate item belongs to a consignment
   * assigned to that manifest.
   */
  async recordScan(input: ScanEventInput): Promise<{ scanEventId: string }> {
    const item = await this.db.freightItem.findUnique({
      where: { id: input.itemId },
      include: { consignment: { include: { manifests: true } } },
    });

    if (!item) throw Errors.notFound('FreightItem', input.itemId);

    // Scenario 19: validate outbound scan
    if (
      input.manifestId &&
      (input.scanType === ScanType.LOAD_OUTBOUND_VEHICLE ||
        input.scanType === ScanType.LOAD_DELIVERY_VEHICLE)
    ) {
      await this.validateOutboundScan(input.itemId, input.manifestId);
    }

    const scanEvent = await this.db.scanEvent.create({
      data: {
        id: uuidv4(),
        itemId: input.itemId,
        consignmentId: item.consignmentId,
        manifestId: input.manifestId,
        scanType: input.scanType,
        latitude: input.lat,
        longitude: input.lng,
        userId: input.userId,
        conditionNote: input.conditionNote,
        photoUrl: input.photoUrl,
        scannedAt: new Date(),
      },
    });

    // Run discrepancy detection after each scan if manifest is provided
    if (input.manifestId) {
      await this.detectDiscrepancies(input.manifestId, item.consignmentId);
    }

    return { scanEventId: scanEvent.id };
  }

  /**
   * Scenario 19: Validate that an item's consignment is assigned to the manifest
   * before loading it onto an outbound vehicle.
   */
  async validateOutboundScan(itemId: string, manifestId: string): Promise<void> {
    const item = await this.db.freightItem.findUnique({
      where: { id: itemId },
      include: {
        consignment: {
          include: {
            tasks: { where: { manifestId } },
          },
        },
      },
    });

    if (!item) throw Errors.notFound('FreightItem', itemId);

    // Check if there are any tasks linking this consignment to the manifest
    const hasTaskOnManifest = item.consignment.tasks.length > 0;

    if (!hasTaskOnManifest) {
      throw Errors.conflict(
        `Item ${item.itemCode} (consignment ${item.consignment.connoteNumber}) is not assigned to manifest ${manifestId}. Cannot load onto this vehicle.`,
        {
          itemId,
          itemCode: item.itemCode,
          connoteNumber: item.consignment.connoteNumber,
          manifestId,
        }
      );
    }
  }

  /**
   * Scenario 20: Validate a container load — sum weights of all scanned items,
   * throw if over the container's weight limit.
   */
  async validateContainerLoad(
    containerId: string,
    maxWeightKg: number
  ): Promise<{ totalWeightKg: number; isOverLimit: boolean }> {
    // Get all items scanned onto this manifest/container
    const scanEvents = await this.db.scanEvent.findMany({
      where: {
        manifestId: containerId,
        scanType: { in: [ScanType.LOAD_OUTBOUND_VEHICLE, ScanType.LOAD_DELIVERY_VEHICLE] },
      },
      include: {
        item: { select: { weightKgEach: true, quantity: true } },
      },
      distinct: ['itemId'],
    });

    const totalWeightKg = scanEvents.reduce((sum, ev) => {
      const weight = (ev.item.weightKgEach ?? 0) * ev.item.quantity;
      return sum + weight;
    }, 0);

    if (totalWeightKg > maxWeightKg) {
      throw Errors.validation(
        `Container load ${totalWeightKg.toFixed(1)} kg exceeds limit of ${maxWeightKg} kg`,
        { totalWeightKg, maxWeightKg, overage: totalWeightKg - maxWeightKg }
      );
    }

    return { totalWeightKg, isOverLimit: false };
  }

  /**
   * Get full chain of custody for a consignment in chronological order.
   */
  async getChainOfCustody(consignmentId: string): Promise<CustodyChainEntry[]> {
    const consignment = await this.db.consignment.findUnique({
      where: { id: consignmentId },
    });
    if (!consignment) throw Errors.notFound('Consignment', consignmentId);

    const events = await this.db.scanEvent.findMany({
      where: { consignmentId },
      include: { item: { select: { itemCode: true } } },
      orderBy: { scannedAt: 'asc' },
    });

    return events.map((ev) => ({
      scanEventId: ev.id,
      itemId: ev.itemId,
      itemCode: ev.item.itemCode,
      scanType: ev.scanType,
      scannedAt: ev.scannedAt,
      latitude: ev.latitude,
      longitude: ev.longitude,
      userId: ev.userId,
      manifestId: ev.manifestId,
      conditionNote: ev.conditionNote,
      photoUrl: ev.photoUrl,
    }));
  }

  /**
   * Get all active discrepancy alerts for a manifest.
   */
  async getDiscrepancies(manifestId: string): Promise<DiscrepancyAlert[]> {
    const discrepancies = await this.db.discrepancy.findMany({
      where: { manifestId, status: DiscrepancyStatus.OPEN },
      orderBy: { createdAt: 'desc' },
    });

    return discrepancies.map((d) => ({
      id: d.id,
      manifestId: d.manifestId,
      discrepancyType: d.discrepancyType,
      status: d.status,
      description: d.description,
      itemId: d.itemId,
      expectedCount: d.expectedCount,
      actualCount: d.actualCount,
      createdAt: d.createdAt,
    }));
  }

  /**
   * Generate label data for all items in a consignment.
   * Does NOT generate images — returns the data payload for label generation.
   */
  async generateLabelData(consignmentId: string): Promise<LabelData[]> {
    const consignment = await this.db.consignment.findUnique({
      where: { id: consignmentId },
      include: {
        items: { orderBy: { sequence: 'asc' } },
        customer: true,
      },
    });

    if (!consignment) throw Errors.notFound('Consignment', consignmentId);

    return consignment.items.map((item) => {
      const qrPayload = {
        itemCode: item.itemCode,
        consignmentId: consignment.id,
        connoteNumber: consignment.connoteNumber,
        itemId: item.id,
        sequence: item.sequence,
        totalItems: consignment.items.length,
      };

      return {
        itemId: item.id,
        itemCode: item.itemCode,
        connoteNumber: consignment.connoteNumber,
        description: item.description,
        sequence: item.sequence,
        quantity: item.quantity,
        qrCodeData: JSON.stringify(qrPayload),
        widthMm: item.widthMm,
        depthMm: item.depthMm,
        heightMm: item.heightMm,
        weightKgEach: item.weightKgEach,
        stackable: item.stackable,
        specialHandling: item.specialHandling,
        pickupAddress: consignment.pickupAddress,
        deliveryAddress: consignment.deliveryAddress,
        customerName: consignment.customer.name,
      };
    });
  }

  /**
   * Run discrepancy detection after a scan batch.
   * Checks for: count mismatches, missing at cross-dock, wrong destination, unexpected items.
   */
  async detectDiscrepancies(manifestId: string, consignmentId: string): Promise<void> {
    const consignment = await this.db.consignment.findUnique({
      where: { id: consignmentId },
      include: { items: true },
    });

    if (!consignment) return;

    const manifest = await this.db.manifest.findUnique({ where: { id: manifestId } });
    if (!manifest) return;

    const expectedItemIds = new Set(consignment.items.map((i) => i.id));
    const expectedCount = consignment.items.length;

    // Get all scan events for this consignment on this manifest
    const scanEvents = await this.db.scanEvent.findMany({
      where: { consignmentId, manifestId },
      orderBy: { scannedAt: 'asc' },
    });

    const scannedItemIds = new Set(scanEvents.map((e) => e.itemId));
    const scannedCount = scannedItemIds.size;

    // ─── ITEM_COUNT_MISMATCH ─────────────────────────────────────────────────
    if (scannedCount > expectedCount) {
      await this.upsertDiscrepancy(manifestId, {
        type: DiscrepancyType.ITEM_COUNT_MISMATCH,
        description: `Expected ${expectedCount} items for consignment ${consignment.connoteNumber}, but ${scannedCount} unique items were scanned on manifest ${manifest.manifestCode}.`,
        expectedCount,
        actualCount: scannedCount,
      });
    }

    // ─── UNEXPECTED_ITEM ────────────────────────────────────────────────────
    for (const ev of scanEvents) {
      if (!expectedItemIds.has(ev.itemId)) {
        await this.upsertDiscrepancy(manifestId, {
          type: DiscrepancyType.UNEXPECTED_ITEM,
          itemId: ev.itemId,
          description: `Item ${ev.itemId} scanned on manifest ${manifest.manifestCode} but does not belong to consignment ${consignment.connoteNumber}.`,
        });
      }
    }

    // ─── WRONG_DESTINATION ─────────────────────────────────────────────────
    // Check if any item was scanned at DELIVERED_TO_CUSTOMER at a location
    // that doesn't match the consignment's delivery address (basic check via manifest)
    const deliveryScans = scanEvents.filter(
      (e) => e.scanType === ScanType.DELIVERED_TO_CUSTOMER
    );
    // Wrong destination is enforced at scan time via validateOutboundScan
    // Additional check: if LOAD_DELIVERY_VEHICLE scan has no matching task on this manifest
    for (const ev of deliveryScans) {
      if (!expectedItemIds.has(ev.itemId)) {
        await this.upsertDiscrepancy(manifestId, {
          type: DiscrepancyType.WRONG_DESTINATION,
          itemId: ev.itemId,
          description: `Item ${ev.itemId} was delivered but does not belong to consignment ${consignment.connoteNumber}. Possible wrong destination.`,
        });
      }
    }

    // ─── MISSING_AT_CROSSDOCK ───────────────────────────────────────────────
    const inboundScans = new Set(
      scanEvents
        .filter((e) => e.scanType === ScanType.ARRIVE_DEPOT_INBOUND)
        .map((e) => e.itemId)
    );
    const outboundScans = new Set(
      scanEvents
        .filter((e) => e.scanType === ScanType.LOAD_OUTBOUND_VEHICLE)
        .map((e) => e.itemId)
    );

    for (const itemId of inboundScans) {
      if (!outboundScans.has(itemId)) {
        const item = consignment.items.find((i) => i.id === itemId);
        await this.upsertDiscrepancy(manifestId, {
          type: DiscrepancyType.MISSING_AT_CROSSDOCK,
          itemId,
          description: `Item ${item?.itemCode ?? itemId} arrived at depot (inbound scan) but was never scanned for outbound. Possible missing at cross-dock.`,
        });
      }
    }
  }

  private async upsertDiscrepancy(
    manifestId: string,
    data: {
      type: DiscrepancyType;
      description: string;
      itemId?: string;
      expectedCount?: number;
      actualCount?: number;
    }
  ): Promise<void> {
    // Only create if one doesn't already exist for this type+item
    const existing = await this.db.discrepancy.findFirst({
      where: {
        manifestId,
        discrepancyType: data.type,
        itemId: data.itemId ?? null,
        status: DiscrepancyStatus.OPEN,
      },
    });

    if (!existing) {
      await this.db.discrepancy.create({
        data: {
          id: uuidv4(),
          manifestId,
          discrepancyType: data.type,
          status: DiscrepancyStatus.OPEN,
          description: data.description,
          itemId: data.itemId,
          expectedCount: data.expectedCount,
          actualCount: data.actualCount,
        },
      });
    }
  }
}

export const scanningService = new ScanningService();
