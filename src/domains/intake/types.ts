import type { ItemType } from '@prisma/client';

export type ExtractedItemType = 'pallet' | 'trolley' | 'furniture' | 'loose' | 'carton' | 'unknown';
export type ExtractedService =
  | 'assembly'
  | 'rubbishRemoval'
  | 'stairsCarry'
  | 'tailgate'
  | 'placement'
  | 'siteInduction'
  | 'afterHours';

export interface ExtractedConsignment {
  customer: { name: string; confidence: number };
  pickupAddress: { value: string; confidence: number };
  deliveryAddress: { value: string; confidence: number };
  requestedPickupDate: { value: string | null; confidence: number };
  requestedDeliveryDate: { value: string | null; confidence: number };
  items: Array<{
    description: string;
    itemType: ExtractedItemType;
    quantity: number;
    widthMm: number | null;
    depthMm: number | null;
    heightMm: number | null;
    weightKgEach: number | null;
    stackable: boolean;
    specialHandling: string | null;
    confidence: number;
  }>;
  detectedServices: Array<{
    service: ExtractedService;
    sourceText: string;
    confidence: number;
  }>;
  specialInstructions: string | null;
  referenceNumbers: string[];
  overallConfidence: number;
  uncertainFields: string[];
}

export interface IntakeEmailInput {
  emailText: string;
  attachmentText?: string;
}

export interface DraftConsignmentResult {
  consignmentId: string;
  connoteNumber: string;
  status: 'DFT';
  isPotentialDuplicate: boolean;
  duplicateOfId?: string;
  extraction: ExtractedConsignment;
  uncertainFields: string[];
  freightSummary: {
    totalPS: number;
    totalM3: number;
    totalWeightKg: number;
  };
}
