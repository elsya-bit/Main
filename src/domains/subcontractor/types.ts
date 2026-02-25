import type { SubcontractorJobStatus, EscalationLevel } from '@prisma/client';

export interface AssignSubcontractorInput {
  consignmentId: string;
  subcontractorId: string;
  expectedDeliveryAt: Date;
  customerId?: string;
}

export interface SubbieTokenUpdatePayload {
  token: string;
  status: SubcontractorJobStatus;
  deliveryTime?: Date;
  podPhotoUrl?: string;
  notes?: string;
}

export interface SubcontractorJobStatusResult {
  jobId: string;
  consignmentId: string;
  status: SubcontractorJobStatus;
  escalationLevel: EscalationLevel;
  lastUpdateAt: Date | null;
  expectedDeliveryAt: Date;
  deliveredAt: Date | null;
  deliveryNotes: string | null;
  podPhotoUrl: string | null;
}

export interface ParsedSubcontractorEmail {
  jobReference: string | null;
  status: SubcontractorJobStatus | null;
  deliveryTime: Date | null;
  notes: string | null;
  confidence: number;
}
