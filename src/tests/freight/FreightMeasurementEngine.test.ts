import { describe, it, expect } from 'vitest';
import {
  calculateItemPS,
  calculateConsignmentTotals,
  suggestVehicleType,
  PS_TO_M3_FACTOR,
} from '../../domains/freight/FreightMeasurementEngine';
import type { FreightItem } from '../../domains/freight/types';

// Helper to build a FreightItem with defaults
function item(overrides: Partial<FreightItem> & Pick<FreightItem, 'widthMm' | 'depthMm' | 'heightMm'>): FreightItem {
  return {
    quantity: 1,
    weightKgEach: 100,
    stackable: true,
    ...overrides,
  };
}

describe('FreightMeasurementEngine — calculateItemPS', () => {

  it('Standard pallet (1200×1200×1200mm, stackable) → 0.8 PS', () => {
    // heightFraction = 1200/1500 = 0.8, ceil(0.8*10)/10 = 0.8
    // baseArea = 1.2*1.2 = 1.44 m²
    // PS = 0.8 * (1.44/1.44) = 0.8
    const result = calculateItemPS(item({ widthMm: 1200, depthMm: 1200, heightMm: 1200 }));
    expect(result.palletSpaces).toBeCloseTo(0.8, 3);
    expect(result.m3).toBeCloseTo(1.2 * 1.2 * 1.2, 3);
    expect(result.isOverheight).toBe(false);
    expect(result.isOversized).toBe(false);
  });

  it('Full standard pallet (1200×1200×1500mm, stackable) → exactly 1.0 PS', () => {
    // heightFraction = 1500/1500 = 1.0
    // PS = 1.0 * 1.0 = 1.0
    const result = calculateItemPS(item({ widthMm: 1200, depthMm: 1200, heightMm: 1500 }));
    expect(result.palletSpaces).toBeCloseTo(1.0, 3);
    expect(result.m3).toBeCloseTo(2.16, 3);
    expect(result.isOverheight).toBe(false);
  });

  it('Overheight pallet (1200×1200×1800mm, stackable) → 1.2 PS', () => {
    // heightFraction = 1800/1500 = 1.2, ceil(1.2*10)/10 = 1.2
    // PS = 1.2 * 1.0 = 1.2
    const result = calculateItemPS(item({ widthMm: 1200, depthMm: 1200, heightMm: 1800 }));
    expect(result.palletSpaces).toBeCloseTo(1.2, 3);
    expect(result.isOverheight).toBe(true);
    expect(result.isOversized).toBe(false);
  });

  it('Overheight pallet (1200×1200×3000mm) → 2.0 PS', () => {
    // heightFraction = 3000/1500 = 2.0
    const result = calculateItemPS(item({ widthMm: 1200, depthMm: 1200, heightMm: 3000 }));
    expect(result.palletSpaces).toBeCloseTo(2.0, 3);
    expect(result.isOverheight).toBe(true);
  });

  it('Half-pallet (600×600×1200mm, stackable) → 0.2 PS', () => {
    // baseArea = 0.6*0.6 = 0.36 m²
    // heightFraction = 1200/1500 = 0.8
    // PS = 0.8 * (0.36/1.44) = 0.8 * 0.25 = 0.2
    const result = calculateItemPS(item({ widthMm: 600, depthMm: 600, heightMm: 1200 }));
    expect(result.palletSpaces).toBeCloseTo(0.2, 3);
    expect(result.isOversized).toBe(false);
  });

  it('Oversized pallet (1400×1600×1200mm, stackable) → isOversized flag', () => {
    // baseArea = 1.4*1.6 = 2.24 m² > 1.44
    const result = calculateItemPS(item({ widthMm: 1400, depthMm: 1600, heightMm: 1200 }));
    expect(result.isOversized).toBe(true);
    // PS = 0.8 * (2.24/1.44) ≈ 0.8 * 1.556 ≈ 1.244
    expect(result.palletSpaces).toBeGreaterThan(1.0);
  });

  it('Non-stackable item (1200×1200×800mm) → minimum 1 PS charged', () => {
    // rawPS = ceil(800/1500*10)/10 * (1.44/1.44) = 0.6 * 1 = 0.6
    // But non-stackable → min 1 PS
    const result = calculateItemPS(item({ widthMm: 1200, depthMm: 1200, heightMm: 800, stackable: false }));
    expect(result.palletSpaces).toBeCloseTo(1.0, 3);
    expect(result.chargeableM3).toBeCloseTo(PS_TO_M3_FACTOR, 3); // 2.16 m³
  });

  it('Non-stackable, large item where rawPS > 1 → uses rawPS (not capped at 1)', () => {
    // 1200×1200×2000mm non-stackable
    // rawPS = ceil(2000/1500*10)/10 = ceil(13.33)/10 = 1.4
    // since 1.4 > 1, max(1.4, 1) = 1.4
    const result = calculateItemPS(item({ widthMm: 1200, depthMm: 1200, heightMm: 2000, stackable: false }));
    expect(result.palletSpaces).toBeCloseTo(1.4, 3);
    expect(result.chargeableM3).toBeCloseTo(1.4 * PS_TO_M3_FACTOR, 2);
  });

  it('Non-stackable chargeableM3 uses dead space when item is small', () => {
    // 600×600×500mm non-stackable
    // actualM3 = 0.6*0.6*0.5 = 0.18 m³
    // rawPS = ceil(500/1500*10)/10 * (0.36/1.44) = 0.4 * 0.25 = 0.1
    // enforced min 1 PS → chargeableM3 = max(0.18, 1*2.16) = 2.16
    const result = calculateItemPS(item({ widthMm: 600, depthMm: 600, heightMm: 500, stackable: false }));
    expect(result.palletSpaces).toBeCloseTo(1.0, 3);
    expect(result.chargeableM3).toBeCloseTo(2.16, 3);
  });

  it('Double-stack scenario: 2 pallets stacked = 2× the single pallet PS', () => {
    // Each: 1200×1200×1200mm → 0.8 PS
    // Two stacked (passed as qty 2, stackable): total = 2 × 0.8 = 1.6 PS
    const singleResult = calculateItemPS(item({ widthMm: 1200, depthMm: 1200, heightMm: 1200 }));
    const summary = calculateConsignmentTotals([
      item({ widthMm: 1200, depthMm: 1200, heightMm: 1200, quantity: 2 }),
    ]);
    expect(summary.totalPS).toBeCloseTo(singleResult.palletSpaces * 2, 3);
  });

  it('m³ conversion: 1 PS = 2.16 m³', () => {
    // Full standard pallet: 1.2m × 1.2m × 1.5m = 2.16 m³
    const result = calculateItemPS(item({ widthMm: 1200, depthMm: 1200, heightMm: 1500 }));
    expect(result.m3).toBeCloseTo(2.16, 3);
    expect(result.palletSpaces).toBeCloseTo(1.0, 3);
  });

  it('Ceiling rounding: height just over a boundary gets bumped up', () => {
    // 1501mm → 1501/1500 = 1.000666... → ceil(10.006)/10 = 1.1 PS
    const result = calculateItemPS(item({ widthMm: 1200, depthMm: 1200, heightMm: 1501 }));
    expect(result.palletSpaces).toBeCloseTo(1.1, 3);
    expect(result.isOverheight).toBe(true);
  });

});

describe('FreightMeasurementEngine — calculateConsignmentTotals', () => {

  it('Single standard pallet → correct totals', () => {
    const items: FreightItem[] = [
      item({ widthMm: 1200, depthMm: 1200, heightMm: 1500, weightKgEach: 200, quantity: 1 }),
    ];
    const summary = calculateConsignmentTotals(items);
    expect(summary.totalPS).toBeCloseTo(1.0, 3);
    expect(summary.totalM3).toBeCloseTo(2.16, 3);
    expect(summary.totalWeightKg).toBe(200);
    expect(summary.itemCount).toBe(1);
    expect(summary.hasNonStackable).toBe(false);
  });

  it('Multiple items totals accumulate correctly', () => {
    const items: FreightItem[] = [
      item({ widthMm: 1200, depthMm: 1200, heightMm: 1500, weightKgEach: 200, quantity: 2 }),
      item({ widthMm: 1200, depthMm: 1200, heightMm: 1500, weightKgEach: 150, quantity: 3 }),
    ];
    const summary = calculateConsignmentTotals(items);
    expect(summary.totalPS).toBeCloseTo(5.0, 3);   // 2×1 + 3×1
    expect(summary.totalWeightKg).toBeCloseTo(850, 3); // 2×200 + 3×150
    expect(summary.itemCount).toBe(5);
  });

  it('Mixed stackable and non-stackable flags correctly', () => {
    const items: FreightItem[] = [
      item({ widthMm: 1200, depthMm: 1200, heightMm: 1500, stackable: true, quantity: 1 }),
      item({ widthMm: 800, depthMm: 800, heightMm: 600, stackable: false, quantity: 1 }),
    ];
    const summary = calculateConsignmentTotals(items);
    expect(summary.hasNonStackable).toBe(true);
    expect(summary.hasOverheight).toBe(false);
  });

  it('SVC7260 scenario: 100 office chairs', () => {
    // 100 office chairs: each 700×700×1200mm, 25kg, non-stackable (in cartons)
    // Per item: baseArea = 0.7*0.7 = 0.49 m²
    //   rawPS = ceil(1200/1500*10)/10 * (0.49/1.44) = 0.8 * 0.3403 ≈ 0.2722
    //   non-stackable → min(0.2722, 1) → 1 PS
    //   chargeableM3 = max(0.49*1.2, 1*2.16) = max(0.588, 2.16) = 2.16
    const chairs: FreightItem[] = [
      {
        widthMm: 700, depthMm: 700, heightMm: 1200,
        weightKgEach: 25, quantity: 100, stackable: false,
      },
    ];
    const summary = calculateConsignmentTotals(chairs);
    expect(summary.totalPS).toBeCloseTo(100, 1);
    expect(summary.totalWeightKg).toBe(2500);
    expect(summary.totalChargeableM3).toBeCloseTo(216, 1);
    expect(summary.hasNonStackable).toBe(true);
  });

});

describe('FreightMeasurementEngine — suggestVehicleType', () => {

  it('Small load (2 PS, 4 m³, 200 kg) → 3T Rigid fits', () => {
    const summary = {
      totalPS: 2, totalM3: 4, totalChargeableM3: 4, totalWeightKg: 200,
      itemCount: 1, hasNonStackable: false, hasOverheight: false, hasOversized: false,
    };
    const suggestions = suggestVehicleType(summary);
    const rigid3t = suggestions.find(s => s.vehicleType === '3T Rigid');
    expect(rigid3t?.fits).toBe(true);
  });

  it('Large load (50 PS, 140 m³, 30000 kg) → only B-Double fits', () => {
    const summary = {
      totalPS: 50, totalM3: 140, totalChargeableM3: 140, totalWeightKg: 30000,
      itemCount: 50, hasNonStackable: false, hasOverheight: false, hasOversized: false,
    };
    const suggestions = suggestVehicleType(summary);
    const fits = suggestions.filter(s => s.fits);
    expect(fits.length).toBe(1);
    expect(fits[0].vehicleType).toBe('B-Double');
  });

  it('Overweight load → fails weight check even if PS fits', () => {
    const summary = {
      totalPS: 2, totalM3: 5, totalChargeableM3: 5, totalWeightKg: 5000,
      itemCount: 2, hasNonStackable: false, hasOverheight: false, hasOversized: false,
    };
    const suggestions = suggestVehicleType(summary);
    const rigid3t = suggestions.find(s => s.vehicleType === '3T Rigid');
    expect(rigid3t?.fits).toBe(false);
    expect(rigid3t?.reason).toMatch(/weight/i);
  });

  it('Returns all vehicle types in the table', () => {
    const summary = {
      totalPS: 1, totalM3: 2, totalChargeableM3: 2, totalWeightKg: 100,
      itemCount: 1, hasNonStackable: false, hasOverheight: false, hasOversized: false,
    };
    const suggestions = suggestVehicleType(summary);
    expect(suggestions).toHaveLength(6);
    const types = suggestions.map(s => s.vehicleType);
    expect(types).toContain('3T Rigid');
    expect(types).toContain('B-Double');
    expect(types).toContain('Semi Trailer');
  });

  it('Includes reason string when vehicle does not fit', () => {
    const summary = {
      totalPS: 60, totalM3: 200, totalChargeableM3: 200, totalWeightKg: 50000,
      itemCount: 60, hasNonStackable: false, hasOverheight: false, hasOversized: false,
    };
    const suggestions = suggestVehicleType(summary);
    suggestions.filter(s => !s.fits).forEach(s => {
      expect(s.reason).toBeTruthy();
    });
  });

});
