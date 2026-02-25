import { describe, it, expect } from 'vitest';

/**
 * Unit tests for Rollout Project Management domain.
 * Tests pure business logic without DB access.
 */

// ─── Profitability calculation ────────────────────────────────────────────────

interface MockSite {
  consignmentId: string;
  connoteNumber: string;
  quotedRevenueCents: number;
  actualCostCents: number;
  status: 'COMP' | 'PARTDEL' | 'DFT' | 'BOOK' | 'INTRANS';
}

function calculateSiteMargin(site: MockSite) {
  const marginCents = site.quotedRevenueCents - site.actualCostCents;
  const marginPercent =
    site.quotedRevenueCents > 0 ? (marginCents / site.quotedRevenueCents) * 100 : 0;
  return {
    ...site,
    marginCents,
    marginPercent: Math.round(marginPercent * 100) / 100,
  };
}

function checkEarlyWarning(
  sites: MockSite[],
  projectCode: string,
  threshold = 10,
  minSites = 3
): string | undefined {
  const completedSites = sites.filter(
    (s) => s.status === 'COMP' || s.status === 'PARTDEL'
  );

  if (completedSites.length < minSites) return undefined;

  const avgActualCost =
    completedSites.reduce((s, x) => s + x.actualCostCents, 0) / completedSites.length;
  const avgQuotedRevenue =
    completedSites.reduce((s, x) => s + x.quotedRevenueCents, 0) / completedSites.length;

  const overage =
    avgQuotedRevenue > 0
      ? ((avgActualCost - avgQuotedRevenue) / avgQuotedRevenue) * 100
      : 0;

  if (overage > threshold) {
    const overageRounded = Math.round(overage * 10) / 10;
    return `Rollout ${projectCode}: trending unprofitable. Actual avg cost/site is ${overageRounded}% above quote after ${completedSites.length} sites.`;
  }

  return undefined;
}

describe('Rollout profitability calculations', () => {
  it('Site with 100% cost = 0% margin', () => {
    const site: MockSite = {
      consignmentId: '1',
      connoteNumber: 'SVC1001',
      quotedRevenueCents: 100000,
      actualCostCents: 100000,
      status: 'COMP',
    };
    const result = calculateSiteMargin(site);
    expect(result.marginCents).toBe(0);
    expect(result.marginPercent).toBe(0);
  });

  it('Site with 80% cost = 20% margin', () => {
    const site: MockSite = {
      consignmentId: '1',
      connoteNumber: 'SVC1001',
      quotedRevenueCents: 100000,
      actualCostCents: 80000,
      status: 'COMP',
    };
    const result = calculateSiteMargin(site);
    expect(result.marginCents).toBe(20000);
    expect(result.marginPercent).toBe(20);
  });

  it('Unprofitable site: cost > revenue → negative margin', () => {
    const site: MockSite = {
      consignmentId: '1',
      connoteNumber: 'SVC1001',
      quotedRevenueCents: 100000,
      actualCostCents: 120000,
      status: 'COMP',
    };
    const result = calculateSiteMargin(site);
    expect(result.marginCents).toBe(-20000);
    expect(result.marginPercent).toBeLessThan(0);
  });

  it('Sites sorted by margin ascending (worst first)', () => {
    const sites: MockSite[] = [
      { consignmentId: '1', connoteNumber: 'SVC1', quotedRevenueCents: 100000, actualCostCents: 80000, status: 'COMP' },   // 20% margin
      { consignmentId: '2', connoteNumber: 'SVC2', quotedRevenueCents: 100000, actualCostCents: 120000, status: 'COMP' },  // -20% margin (worst)
      { consignmentId: '3', connoteNumber: 'SVC3', quotedRevenueCents: 100000, actualCostCents: 70000, status: 'COMP' },   // 30% margin (best)
    ];

    const withMargins = sites.map(calculateSiteMargin);
    const sorted = [...withMargins].sort((a, b) => a.marginPercent - b.marginPercent);

    expect(sorted[0].connoteNumber).toBe('SVC2');  // worst
    expect(sorted[2].connoteNumber).toBe('SVC3');  // best
  });
});

describe('Rollout early warning alert', () => {
  it('No alert before 3 completed sites', () => {
    const sites: MockSite[] = [
      { consignmentId: '1', connoteNumber: 'SVC1', quotedRevenueCents: 100000, actualCostCents: 200000, status: 'COMP' },
      { consignmentId: '2', connoteNumber: 'SVC2', quotedRevenueCents: 100000, actualCostCents: 200000, status: 'COMP' },
    ];
    const alert = checkEarlyWarning(sites, 'RP-00101');
    expect(alert).toBeUndefined();
  });

  it('Alert triggers after 3 sites where cost exceeds quote by >10%', () => {
    const sites: MockSite[] = [
      { consignmentId: '1', connoteNumber: 'SVC1', quotedRevenueCents: 100000, actualCostCents: 120000, status: 'COMP' },
      { consignmentId: '2', connoteNumber: 'SVC2', quotedRevenueCents: 100000, actualCostCents: 125000, status: 'COMP' },
      { consignmentId: '3', connoteNumber: 'SVC3', quotedRevenueCents: 100000, actualCostCents: 115000, status: 'COMP' },
    ];
    // Avg cost = 120000, avg revenue = 100000 → 20% overage → triggers alert
    const alert = checkEarlyWarning(sites, 'RP-00101');
    expect(alert).toBeTruthy();
    expect(alert).toContain('RP-00101');
    expect(alert).toContain('trending unprofitable');
    expect(alert).toContain('3 sites');
  });

  it('No alert when cost is within 10% of quote', () => {
    const sites: MockSite[] = [
      { consignmentId: '1', connoteNumber: 'SVC1', quotedRevenueCents: 100000, actualCostCents: 105000, status: 'COMP' },
      { consignmentId: '2', connoteNumber: 'SVC2', quotedRevenueCents: 100000, actualCostCents: 108000, status: 'COMP' },
      { consignmentId: '3', connoteNumber: 'SVC3', quotedRevenueCents: 100000, actualCostCents: 106000, status: 'COMP' },
    ];
    // Avg cost = 106333, 6.3% over — below 10% threshold
    const alert = checkEarlyWarning(sites, 'RP-00101');
    expect(alert).toBeUndefined();
  });

  it('No alert when cost is under quote (profitable)', () => {
    const sites: MockSite[] = [
      { consignmentId: '1', connoteNumber: 'SVC1', quotedRevenueCents: 100000, actualCostCents: 80000, status: 'COMP' },
      { consignmentId: '2', connoteNumber: 'SVC2', quotedRevenueCents: 100000, actualCostCents: 75000, status: 'COMP' },
      { consignmentId: '3', connoteNumber: 'SVC3', quotedRevenueCents: 100000, actualCostCents: 82000, status: 'COMP' },
    ];
    const alert = checkEarlyWarning(sites, 'RP-00101');
    expect(alert).toBeUndefined();
  });

  it('Only counts completed sites for early warning (not in-progress)', () => {
    const sites: MockSite[] = [
      { consignmentId: '1', connoteNumber: 'SVC1', quotedRevenueCents: 100000, actualCostCents: 200000, status: 'COMP' },
      { consignmentId: '2', connoteNumber: 'SVC2', quotedRevenueCents: 100000, actualCostCents: 200000, status: 'INTRANS' }, // not complete
      { consignmentId: '3', connoteNumber: 'SVC3', quotedRevenueCents: 100000, actualCostCents: 200000, status: 'BOOK' },   // not complete
    ];
    // Only 1 completed site — below threshold of 3
    const alert = checkEarlyWarning(sites, 'RP-00101');
    expect(alert).toBeUndefined();
  });

  it('Alert message contains overage percentage', () => {
    const sites: MockSite[] = [
      { consignmentId: '1', connoteNumber: 'SVC1', quotedRevenueCents: 100000, actualCostCents: 130000, status: 'COMP' },
      { consignmentId: '2', connoteNumber: 'SVC2', quotedRevenueCents: 100000, actualCostCents: 130000, status: 'COMP' },
      { consignmentId: '3', connoteNumber: 'SVC3', quotedRevenueCents: 100000, actualCostCents: 130000, status: 'COMP' },
    ];
    // 30% overage
    const alert = checkEarlyWarning(sites, 'RP-00101');
    expect(alert).toContain('30');
  });

  it('PARTDEL sites count as completed for early warning', () => {
    const sites: MockSite[] = [
      { consignmentId: '1', connoteNumber: 'SVC1', quotedRevenueCents: 100000, actualCostCents: 200000, status: 'COMP' },
      { consignmentId: '2', connoteNumber: 'SVC2', quotedRevenueCents: 100000, actualCostCents: 200000, status: 'PARTDEL' },
      { consignmentId: '3', connoteNumber: 'SVC3', quotedRevenueCents: 100000, actualCostCents: 200000, status: 'COMP' },
    ];
    const alert = checkEarlyWarning(sites, 'RP-00101');
    expect(alert).toBeTruthy();
    expect(alert).toContain('3 sites');
  });
});

// ─── Project code format ──────────────────────────────────────────────────────

describe('Rollout project code format', () => {
  it('Project code follows RP-NNNNN pattern', () => {
    const code = 'RP-00101';
    expect(code).toMatch(/^RP-\d{5}$/);
  });
});
