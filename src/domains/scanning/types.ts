import type { ScanType, DiscrepancyType, DiscrepancyStatus } from '@prisma/client';

export interface ScanEventInput {
  itemId: string;
  scanType: ScanType;
  lat?: number;
  lng?: number;
  userId: string;
  manifestId?: string;
  conditionNote?: string;
  photoUrl?: string;
}

export interface LabelData {
  itemId: string;
  itemCode: string;        // e.g. SVC7260-001
  connoteNumber: string;
  description: string;
  sequence: number;
  quantity: number;
  qrCodeData: string;      // JSON string for QR code
  widthMm: number | null;
  depthMm: number | null;
  heightMm: number | null;
  weightKgEach: number | null;
  stackable: boolean;
  specialHandling: string | null;
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
}

export interface CustodyChainEntry {
  scanEventId: string;
  itemId: string;
  itemCode: string;
  scanType: ScanType;
  scannedAt: Date;
  latitude: number | null;
  longitude: number | null;
  userId: string;
  manifestId: string | null;
  conditionNote: string | null;
  photoUrl: string | null;
}

export interface DiscrepancyAlert {
  id: string;
  manifestId: string;
  discrepancyType: DiscrepancyType;
  status: DiscrepancyStatus;
  description: string;
  itemId: string | null;
  expectedCount: number | null;
  actualCount: number | null;
  createdAt: Date;
}
