import {
  FreightItem,
  PalletSpaceResult,
  ConsignmentFreightSummary,
  VehicleCapacity,
  VehicleTypeSuggestion,
} from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

/** One standard pallet space = 1.2m × 1.2m × 1.5m = 2.16 m³ */
export const PS_TO_M3_FACTOR = 2.16;

/** Standard pallet base area in m² (1200mm × 1200mm) */
export const STANDARD_BASE_AREA_M2 = 1.44;

/** Max height for a standard pallet space in mm */
export const MAX_STANDARD_HEIGHT_MM = 1500;

/**
 * Vehicle capacity table — matches spec exactly.
 * minPS/maxPS are the operational range (we use maxPS as the threshold).
 */
export const VEHICLE_CAPACITIES: VehicleCapacity[] = [
  { vehicleType: '3T Rigid',             minPS: 0,  maxPS: 4,  minM3: 15,  maxM3: 18,  maxWeightKg: 3000 },
  { vehicleType: '6T Rigid',             minPS: 4,  maxPS: 10, minM3: 28,  maxM3: 35,  maxWeightKg: 6000 },
  { vehicleType: '8T Rigid (tailgate)',  minPS: 8,  maxPS: 12, minM3: 35,  maxM3: 40,  maxWeightKg: 8000 },
  { vehicleType: '12T Rigid',            minPS: 10, maxPS: 16, minM3: 45,  maxM3: 50,  maxWeightKg: 12000 },
  { vehicleType: 'Semi Trailer',         minPS: 14, maxPS: 26, minM3: 70,  maxM3: 85,  maxWeightKg: 22500 },
  { vehicleType: 'B-Double',             minPS: 22, maxPS: 52, minM3: 130, maxM3: 150, maxWeightKg: 40500 },
];

// ─── Core Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate pallet space metrics for a single freight item (one unit).
 *
 * Formula (from spec):
 *   baseAreaM2 = (widthMm / 1000) * (depthMm / 1000)
 *   PS = CEIL(heightMm / 1500 * 10) / 10 * (baseAreaM2 / 1.44)
 *
 * Non-stackable items: charged a minimum of 1 full PS (dead space above counts).
 */
export function calculateItemPS(item: FreightItem): PalletSpaceResult {
  const { widthMm, depthMm, heightMm, stackable } = item;

  const baseAreaM2 = (widthMm / 1000) * (depthMm / 1000);
  const actualM3 = baseAreaM2 * (heightMm / 1000);

  const isOverheight = heightMm > MAX_STANDARD_HEIGHT_MM;
  const isOversized = baseAreaM2 > STANDARD_BASE_AREA_M2;

  // PS formula: ceil to 1 decimal place on the height fraction
  const heightFraction = heightMm / MAX_STANDARD_HEIGHT_MM;
  const heightRounded = Math.ceil(heightFraction * 10) / 10;
  const rawPS = heightRounded * (baseAreaM2 / STANDARD_BASE_AREA_M2);

  // Non-stackable: minimum 1 full PS (dead space above item is charged)
  const palletSpaces = !stackable ? Math.max(rawPS, 1) : rawPS;

  // Chargeable m³:
  // - Stackable: actual m³
  // - Non-stackable: max(actual m³, 2.16 m³ per PS) — dead space costs money
  const chargeableM3 = !stackable
    ? Math.max(actualM3, palletSpaces * PS_TO_M3_FACTOR)
    : actualM3;

  return {
    palletSpaces: Math.round(palletSpaces * 1000) / 1000,
    m3: Math.round(actualM3 * 1000) / 1000,
    chargeableM3: Math.round(chargeableM3 * 1000) / 1000,
    isOverheight,
    isOversized,
  };
}

/**
 * Calculate totals across an entire consignment (all items × their quantities).
 */
export function calculateConsignmentTotals(
  items: FreightItem[]
): ConsignmentFreightSummary {
  let totalPS = 0;
  let totalM3 = 0;
  let totalWeightKg = 0;
  let totalChargeableM3 = 0;
  let itemCount = 0;
  let hasNonStackable = false;
  let hasOverheight = false;
  let hasOversized = false;

  for (const item of items) {
    const result = calculateItemPS(item);
    const qty = item.quantity;

    totalPS += result.palletSpaces * qty;
    totalM3 += result.m3 * qty;
    totalChargeableM3 += result.chargeableM3 * qty;
    totalWeightKg += item.weightKgEach * qty;
    itemCount += qty;

    if (!item.stackable) hasNonStackable = true;
    if (result.isOverheight) hasOverheight = true;
    if (result.isOversized) hasOversized = true;
  }

  return {
    totalPS: Math.round(totalPS * 1000) / 1000,
    totalM3: Math.round(totalM3 * 1000) / 1000,
    totalWeightKg: Math.round(totalWeightKg * 1000) / 1000,
    totalChargeableM3: Math.round(totalChargeableM3 * 1000) / 1000,
    itemCount,
    hasNonStackable,
    hasOverheight,
    hasOversized,
  };
}

/**
 * Suggest appropriate vehicle types for a given consignment summary.
 * Returns all vehicles in the capacity table, each annotated with whether
 * the consignment fits (meets ALL three constraints: PS, m³, weight).
 */
export function suggestVehicleType(
  summary: ConsignmentFreightSummary
): VehicleTypeSuggestion[] {
  return VEHICLE_CAPACITIES.map((cap) => {
    const psOk = summary.totalPS <= cap.maxPS;
    const m3Ok = summary.totalChargeableM3 <= cap.maxM3;
    const weightOk = summary.totalWeightKg <= cap.maxWeightKg;
    const fits = psOk && m3Ok && weightOk;

    const reasons: string[] = [];
    if (!psOk) reasons.push(`exceeds ${cap.maxPS} PS (load is ${summary.totalPS.toFixed(2)} PS)`);
    if (!m3Ok) reasons.push(`exceeds ${cap.maxM3} m³ (load is ${summary.totalChargeableM3.toFixed(2)} m³)`);
    if (!weightOk) reasons.push(`exceeds ${cap.maxWeightKg.toLocaleString()} kg weight limit (load is ${summary.totalWeightKg.toLocaleString()} kg)`);

    const psRange = cap.minPS === cap.maxPS
      ? `${cap.maxPS} PS`
      : `${cap.minPS}–${cap.maxPS} PS`;

    return {
      vehicleType: cap.vehicleType,
      fits,
      reason: fits ? undefined : `Load ${reasons.join('; ')}`,
      capacityPS: psRange,
      capacityM3: `${cap.minM3}–${cap.maxM3} m³`,
      capacityKg: `${cap.maxWeightKg.toLocaleString()} kg`,
    };
  });
}
