export {
  calculateItemPS,
  calculateConsignmentTotals,
  suggestVehicleType,
  VEHICLE_CAPACITIES,
  PS_TO_M3_FACTOR,
  STANDARD_BASE_AREA_M2,
  MAX_STANDARD_HEIGHT_MM,
} from './FreightMeasurementEngine';

export type {
  FreightItem,
  PalletSpaceResult,
  ConsignmentFreightSummary,
  VehicleCapacity,
  VehicleTypeSuggestion,
} from './types';
