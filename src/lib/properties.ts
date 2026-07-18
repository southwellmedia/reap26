/**
 * Track-record presentation helpers — shared by the homepage portfolio
 * section, /track-record, and the case-study pages so the ledger copy is
 * derived identically everywhere. Frontmatter `indexMeta`/`indexFigure`
 * override the derivation for published strings that structured fields
 * can't reproduce ("1031 Exchange", "Acquired 2022").
 */
import type { CollectionEntry } from 'astro:content';

export type Property = CollectionEntry<'properties'>;

export function statusLabel(p: Property): string {
  return p.data.status === 'active' ? 'Active' : 'Full Cycle';
}

/** Ledger middle column — "Arlington, TX · 288 Units" */
export function ledgerMeta(p: Property): string {
  if (p.data.indexMeta) return p.data.indexMeta;
  return p.data.units ? `${p.data.location} · ${p.data.units} Units` : p.data.location;
}

/** Ledger right column — "Active · Target IRR 21.64%" / "Full Cycle · 1.86x Multiple" */
export function ledgerFigure(p: Property): string {
  if (p.data.indexFigure) return p.data.indexFigure;
  if (p.data.status === 'active' && p.data.targetIrr) {
    return `Active · Target IRR ${p.data.targetIrr}`;
  }
  if (p.data.status === 'full-cycle' && p.data.equityMultiple) {
    return `Full Cycle · ${p.data.equityMultiple} Multiple`;
  }
  return statusLabel(p);
}

export function byOrder(a: Property, b: Property): number {
  return a.data.order - b.data.order;
}

/** Actives first (by order), then full-cycle (by order) — track-record ledger */
export function byStatusThenOrder(a: Property, b: Property): number {
  if (a.data.status !== b.data.status) {
    return a.data.status === 'active' ? -1 : 1;
  }
  return byOrder(a, b);
}
