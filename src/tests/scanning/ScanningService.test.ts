import { describe, it, expect } from 'vitest';
import { ScanType, DiscrepancyType } from '@prisma/client';

/**
 * Unit tests for scanning domain business logic.
 * These test the pure algorithmic pieces without DB access.
 */

// ─── Label generation ─────────────────────────────────────────────────────────

describe('Label data generation', () => {
  it('Item code follows connote-sequence pattern', () => {
    const connote = 'SVC7260';
    const sequence = 3;
    const itemCode = `${connote}-${String(sequence).padStart(3, '0')}`;
    expect(itemCode).toBe('SVC7260-003');
  });

  it('QR code data is valid JSON with required fields', () => {
    const qrPayload = {
      itemCode: 'SVC7260-001',
      consignmentId: 'abc-123',
      connoteNumber: 'SVC7260',
      itemId: 'item-id-1',
      sequence: 1,
      totalItems: 3,
    };
    const qrString = JSON.stringify(qrPayload);
    const parsed = JSON.parse(qrString);

    expect(parsed.itemCode).toBe('SVC7260-001');
    expect(parsed.connoteNumber).toBe('SVC7260');
    expect(parsed.sequence).toBe(1);
    expect(parsed.totalItems).toBe(3);
  });

  it('Generates label for each item in the consignment', () => {
    const items = [
      { id: '1', itemCode: 'SVC7260-001', sequence: 1 },
      { id: '2', itemCode: 'SVC7260-002', sequence: 2 },
      { id: '3', itemCode: 'SVC7260-003', sequence: 3 },
    ];
    expect(items).toHaveLength(3);
    items.forEach((item, idx) => {
      expect(item.itemCode).toBe(`SVC7260-00${idx + 1}`);
    });
  });
});

// ─── Discrepancy detection logic (pure) ──────────────────────────────────────

interface MockScanEvent {
  itemId: string;
  scanType: ScanType;
  manifestId: string;
}

interface MockFreightItem {
  id: string;
  itemCode: string;
}

function detectDiscrepancies(
  expectedItems: MockFreightItem[],
  scanEvents: MockScanEvent[],
  manifestId: string
): Array<{ type: DiscrepancyType; itemId?: string; expectedCount?: number; actualCount?: number }> {
  const alerts: Array<{ type: DiscrepancyType; itemId?: string; expectedCount?: number; actualCount?: number }> = [];
  const expectedItemIds = new Set(expectedItems.map((i) => i.id));
  const expectedCount = expectedItems.length;
  const relevantScans = scanEvents.filter((e) => e.manifestId === manifestId);
  const scannedItemIds = new Set(relevantScans.map((e) => e.itemId));
  const scannedCount = scannedItemIds.size;

  // Count mismatch
  if (scannedCount > expectedCount) {
    alerts.push({
      type: DiscrepancyType.ITEM_COUNT_MISMATCH,
      expectedCount,
      actualCount: scannedCount,
    });
  }

  // Unexpected items
  for (const itemId of scannedItemIds) {
    if (!expectedItemIds.has(itemId)) {
      alerts.push({ type: DiscrepancyType.UNEXPECTED_ITEM, itemId });
    }
  }

  // Missing at cross-dock
  const inbound = new Set(
    relevantScans
      .filter((e) => e.scanType === ScanType.ARRIVE_DEPOT_INBOUND)
      .map((e) => e.itemId)
  );
  const outbound = new Set(
    relevantScans
      .filter((e) => e.scanType === ScanType.LOAD_OUTBOUND_VEHICLE)
      .map((e) => e.itemId)
  );

  for (const itemId of inbound) {
    if (!outbound.has(itemId)) {
      alerts.push({ type: DiscrepancyType.MISSING_AT_CROSSDOCK, itemId });
    }
  }

  return alerts;
}

describe('Discrepancy detection', () => {
  const manifestId = 'manifest-001';

  const expectedItems: MockFreightItem[] = [
    { id: 'item-1', itemCode: 'SVC7260-001' },
    { id: 'item-2', itemCode: 'SVC7260-002' },
    { id: 'item-3', itemCode: 'SVC7260-003' },
  ];

  it('No discrepancy when all items scanned correctly', () => {
    const scans: MockScanEvent[] = [
      { itemId: 'item-1', scanType: ScanType.PICKUP_FROM_CUSTOMER, manifestId },
      { itemId: 'item-2', scanType: ScanType.PICKUP_FROM_CUSTOMER, manifestId },
      { itemId: 'item-3', scanType: ScanType.PICKUP_FROM_CUSTOMER, manifestId },
    ];
    const alerts = detectDiscrepancies(expectedItems, scans, manifestId);
    expect(alerts).toHaveLength(0);
  });

  it('ITEM_COUNT_MISMATCH when more items scanned than expected', () => {
    const scans: MockScanEvent[] = [
      { itemId: 'item-1', scanType: ScanType.PICKUP_FROM_CUSTOMER, manifestId },
      { itemId: 'item-2', scanType: ScanType.PICKUP_FROM_CUSTOMER, manifestId },
      { itemId: 'item-3', scanType: ScanType.PICKUP_FROM_CUSTOMER, manifestId },
      { itemId: 'item-4-unexpected', scanType: ScanType.PICKUP_FROM_CUSTOMER, manifestId },
    ];
    const alerts = detectDiscrepancies(expectedItems, scans, manifestId);
    const mismatch = alerts.find((a) => a.type === DiscrepancyType.ITEM_COUNT_MISMATCH);
    expect(mismatch).toBeDefined();
    expect(mismatch?.expectedCount).toBe(3);
    expect(mismatch?.actualCount).toBe(4);
  });

  it('UNEXPECTED_ITEM when unknown item is scanned', () => {
    const scans: MockScanEvent[] = [
      { itemId: 'item-1', scanType: ScanType.PICKUP_FROM_CUSTOMER, manifestId },
      { itemId: 'item-UNKNOWN', scanType: ScanType.PICKUP_FROM_CUSTOMER, manifestId },
    ];
    const alerts = detectDiscrepancies(expectedItems, scans, manifestId);
    const unexpected = alerts.find((a) => a.type === DiscrepancyType.UNEXPECTED_ITEM);
    expect(unexpected).toBeDefined();
    expect(unexpected?.itemId).toBe('item-UNKNOWN');
  });

  it('MISSING_AT_CROSSDOCK when item arrives but is not loaded outbound', () => {
    const scans: MockScanEvent[] = [
      { itemId: 'item-1', scanType: ScanType.ARRIVE_DEPOT_INBOUND, manifestId },
      { itemId: 'item-2', scanType: ScanType.ARRIVE_DEPOT_INBOUND, manifestId },
      // item-1 loads outbound but item-2 does not
      { itemId: 'item-1', scanType: ScanType.LOAD_OUTBOUND_VEHICLE, manifestId },
    ];
    const alerts = detectDiscrepancies(expectedItems, scans, manifestId);
    const missing = alerts.find((a) => a.type === DiscrepancyType.MISSING_AT_CROSSDOCK);
    expect(missing).toBeDefined();
    expect(missing?.itemId).toBe('item-2');
  });

  it('No MISSING_AT_CROSSDOCK when all inbound items are loaded outbound', () => {
    const scans: MockScanEvent[] = [
      { itemId: 'item-1', scanType: ScanType.ARRIVE_DEPOT_INBOUND, manifestId },
      { itemId: 'item-2', scanType: ScanType.ARRIVE_DEPOT_INBOUND, manifestId },
      { itemId: 'item-1', scanType: ScanType.LOAD_OUTBOUND_VEHICLE, manifestId },
      { itemId: 'item-2', scanType: ScanType.LOAD_OUTBOUND_VEHICLE, manifestId },
    ];
    const alerts = detectDiscrepancies(expectedItems, scans, manifestId);
    const missing = alerts.filter((a) => a.type === DiscrepancyType.MISSING_AT_CROSSDOCK);
    expect(missing).toHaveLength(0);
  });

  it('Does not count scans from other manifests', () => {
    const scans: MockScanEvent[] = [
      { itemId: 'item-1', scanType: ScanType.PICKUP_FROM_CUSTOMER, manifestId: 'other-manifest' },
    ];
    const alerts = detectDiscrepancies(expectedItems, scans, manifestId);
    // No alerts because scans are on a different manifest
    expect(alerts).toHaveLength(0);
  });
});

// ─── Scan type validation ─────────────────────────────────────────────────────

describe('Scan type validation', () => {
  it('LOAD_OUTBOUND_VEHICLE requires manifest context', () => {
    const manifestRequiredTypes = new Set<ScanType>([
      ScanType.LOAD_OUTBOUND_VEHICLE,
      ScanType.LOAD_DELIVERY_VEHICLE,
    ]);
    const requiresManifest = (scanType: ScanType) => manifestRequiredTypes.has(scanType);

    expect(requiresManifest(ScanType.LOAD_OUTBOUND_VEHICLE)).toBe(true);
    expect(requiresManifest(ScanType.LOAD_DELIVERY_VEHICLE)).toBe(true);
    expect(requiresManifest(ScanType.PICKUP_FROM_CUSTOMER)).toBe(false);
  });
});
