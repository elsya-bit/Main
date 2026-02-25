export interface FreightItem {
  id?: string;
  description?: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  weightKgEach: number;
  quantity: number;
  stackable: boolean;
}

export interface PalletSpaceResult {
  palletSpaces: number;       // PS value for one item unit
  m3: number;                 // Actual cubic metres for one item unit
  chargeableM3: number;       // Chargeable m³ (accounts for non-stackable dead space)
  isOverheight: boolean;      // heightMm > 1500
  isOversized: boolean;       // baseArea > 1.44 m²
}

export interface ConsignmentFreightSummary {
  totalPS: number;
  totalM3: number;
  totalWeightKg: number;
  totalChargeableM3: number;
  itemCount: number;
  hasNonStackable: boolean;
  hasOverheight: boolean;
  hasOversized: boolean;
}

export interface VehicleCapacity {
  vehicleType: string;
  minPS: number;
  maxPS: number;
  minM3: number;
  maxM3: number;
  maxWeightKg: number;
}

export interface VehicleTypeSuggestion {
  vehicleType: string;
  fits: boolean;
  reason?: string;
  capacityPS: string;    // e.g. "4 PS"
  capacityM3: string;   // e.g. "15–18 m³"
  capacityKg: string;   // e.g. "3,000 kg"
}
