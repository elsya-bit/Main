import type { RolloutProjectStatus, RolloutWaveStatus, ChargeType } from '@prisma/client';

export interface CreateRolloutProjectInput {
  customerId: string;
  projectName: string;
  coordinatorId: string;
  startDate?: Date;
  endDate?: Date;
  marginTargetPercent?: number;
}

export interface AddWaveInput {
  waveNumber: number;
  waveName: string;
  plannedDate?: Date;
}

export interface AddSiteInput {
  siteName: string;
  deliveryAddress: string;
  pickupAddress: string;
  pickupDate?: Date;
  deliveryDate?: Date;
  quotedRevenueCents?: number;
  items: Array<{
    description: string;
    itemType?: string;
    quantity: number;
    widthMm?: number;
    depthMm?: number;
    heightMm?: number;
    weightKgEach?: number;
    stackable?: boolean;
  }>;
}

export interface SiteProfitability {
  consignmentId: string;
  connoteNumber: string;
  deliveryAddress: string;
  waveNumber: number;
  waveName: string;
  quotedRevenueCents: number;
  actualCostCents: number;
  marginCents: number;
  marginPercent: number;
  taskCount: number;
  completedTaskCount: number;
  status: string;
}

export interface ProjectProfitabilityReport {
  projectId: string;
  projectCode: string;
  projectName: string;
  totalRevenueCents: number;
  totalCostCents: number;
  marginCents: number;
  marginPercent: number;
  siteCount: number;
  completedSiteCount: number;
  targetMarginPercent: number;
  sites: SiteProfitability[]; // sorted by margin ascending (worst first)
  earlyWarningAlert?: string;
}
