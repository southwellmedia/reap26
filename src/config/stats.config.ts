/**
 * Canonical firm statistics — single source of truth.
 *
 * Values verified against reapcapital.com (homepage stats + about-page bio).
 * Every number shown anywhere on the site must come from here so the copy
 * can never contradict itself. Update here and every surface follows.
 */
export const firmStats = {
  /** Average IRR to investors since inception */
  avgIrr: '34.25%',
  /** Assets under management */
  aum: '$250M',
  /** Total value of sponsored purchases, as it appears in running copy */
  sponsoredValueCopy: 'over $278m',
  /** Multifamily units sponsored since inception */
  unitsSponsored: '2,366',
  /** Self-storage units purchased */
  selfStorageUnits: '262',
  /** Closed transactions */
  transactions: '21',
  /** First transaction year (firm founded 2017) */
  transactionsSinceYear: '2018',
  /** Investments taken full cycle (acquired, executed, sold) */
  fullCycle: '6',
  /** Year founded */
  founded: '2017',
} as const;

export const CONTACT = {
  email: 'info@reapcap.com',
  phone: '1-866-REAP-123',
  phoneHref: 'tel:+18667327123',
  address: '12770 Merit Dr. Suite 850, Dallas, TX 75251',
} as const;

export const PERFORMANCE_DISCLOSURE =
  'Past performance is not indicative of future results.';
