import type { ConsignmentStatus, TaskType, TaskStatus } from '@prisma/client';

export interface CreateConsignmentInput {
  customerId: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate?: Date;
  deliveryDate?: Date;
  specialInstructions?: string;
  referenceNumbers?: string[];
  quotedRevenueCents?: number;
  rolloutProjectId?: string;
  rolloutWaveId?: string;
  items: Array<{
    description: string;
    itemType?: string;
    quantity: number;
    widthMm?: number;
    depthMm?: number;
    heightMm?: number;
    weightKgEach?: number;
    stackable?: boolean;
    specialHandling?: string;
  }>;
}

export interface AddTaskInput {
  taskType: TaskType;
  manifestId?: string;
  estimatedCostCents?: number;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  sequence?: number;
  notes?: string;
}

export interface TaskChainEntry {
  taskId: string;
  taskType: TaskType;
  status: TaskStatus;
  manifestId: string | null;
  manifestCode: string | null;
  manifestPlannedDate: Date | null;
  sequence: number;
  assignedDriverId: string | null;
  assignedVehicleId: string | null;
  estimatedCostCents: number | null;
  actualCostCents: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
}

export interface ReassignManifestDriverInput {
  manifestId: string;
  newDriverId: string;
  userId: string;
}
