/**
 * Canonical firm statistics — single source of truth.
 *
 * Every number shown anywhere on the site must come from here so the copy can
 * never contradict itself ("numbers persuade" only when they reconcile).
 * Update values here and every surface follows.
 */
export const firmStats = {
  /** Average realized IRR to investors since inception */
  avgIrr: '34.25%',
  /** Assets under management */
  aum: '$226M',
  /** AUM as it appears in running copy */
  aumCopy: 'over $226m',
  /** Multifamily units sponsored since inception */
  unitsSponsored: '1,927',
  /** Closed transactions */
  transactions: '20',
  /** First transaction year (firm founded 2017) */
  transactionsSinceYear: '2018',
  /** Investments taken full cycle (acquired, executed, sold) */
  fullCycle: '6',
  /** Year founded */
  founded: '2017',
} as const;

export const PERFORMANCE_DISCLOSURE =
  'Past performance is not indicative of future results.';
