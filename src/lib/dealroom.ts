/**
 * LucidOS deal-room API client — see LUCID-DEALROOM.md at the repo root.
 *
 * Server/build-time only: the API key is a secret shared by every raise, so
 * these functions must never be imported into client-side code. The one
 * browser-safe endpoint (interest POST) needs no key and is handled by
 * DealRoomInterestForm.astro.
 *
 * Pages are statically built, so a fetch failure here would take down the
 * whole deploy. listPublicRaises() therefore degrades to an empty list with
 * a logged warning — the offerings pages render their empty state instead.
 */
import { DEALROOM_API_URL, DEALROOM_API_KEY } from 'astro:env/server';

export interface RaiseSummary {
  id: string;
  name: string;
  status: 'active' | 'closed';
  headline: string | null;
  coverImageUrl: string | null;
  targetRaise: number | null;
  minimumInvestment: number | null;
  closeDate: string | null;
  deal: {
    name: string | null;
    city: string | null;
    state: string | null;
    propertyType: string | null;
    unitCount: number | null;
  } | null;
}

export interface Teaser {
  raise: {
    id: string;
    name: string;
    status: 'active' | 'closed';
    targetRaise: number | null;
    minimumInvestment: number | null;
    closeDate: string | null;
    distributionCadence: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | null;
  };
  deal: {
    name: string | null;
    city: string | null;
    state: string | null;
    propertyType: string | null;
    unitCount: number | null;
    yearBuilt: number | null;
    squareFootage: number | null;
    holdPeriodYears: number | null;
  } | null;
  dealRoom: {
    headline: string | null;
    summaryMd: string | null;
    coverImageUrl: string | null;
    videoUrl: string | null;
    layout: 'editorial' | 'institutional' | 'showcase';
    theme: 'warm' | 'modern' | 'bold';
    accentColor: string | null;
    hiddenZones: string[];
  };
  sponsor: {
    name: string;
    logoUrl: string | null;
    bioMd: string | null;
    primaryColor: string | null;
    accentColor: string | null;
  } | null;
  metrics: {
    targetIrr: number | null;
    targetEquityMultiple: number | null;
    targetCashOnCash: number | null;
    holdPeriodYears: number | null;
  } | null;
  progress: {
    targetRaise: number | null;
    percentOfTarget: number | null;
    committedCount: number;
  };
  interest: {
    enabled: boolean;
    recaptchaSiteKey: string | null;
  };
}

export const DEALROOM_BASE_URL = DEALROOM_API_URL;

const configured = Boolean(DEALROOM_API_KEY);

async function dealroom<T>(path: string): Promise<T> {
  const res = await fetch(`${DEALROOM_API_URL}${path}`, {
    headers: { 'x-api-key': DEALROOM_API_KEY ?? '' },
  });
  if (!res.ok) {
    throw new Error(`Deal room API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/**
 * All publicly visible raises, or [] when the key isn't configured or the
 * API is unreachable (build keeps going; offerings pages show empty state).
 */
export async function listPublicRaises(): Promise<RaiseSummary[]> {
  if (!configured) {
    console.warn('[dealroom] DEALROOM_API_KEY not set — building /offerings with no raises.');
    return [];
  }
  try {
    const { raises } = await dealroom<{ raises: RaiseSummary[] }>('/v1/raises');
    return raises;
  } catch (error) {
    console.warn('[dealroom] Failed to list raises — building /offerings with no raises.', error);
    return [];
  }
}

/** Full teaser for one raise, or null if it is no longer public (404). */
export async function getTeaser(raiseId: string): Promise<Teaser | null> {
  try {
    return await dealroom<Teaser>(`/v1/raises/${raiseId}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Deal room API 404')) return null;
    throw error;
  }
}

/* ----------------------------------------------------------------------------
 * Display formatting — API conventions documented in LUCID-DEALROOM.md
 * ------------------------------------------------------------------------- */

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatMoney = (v: number | null): string | null => (v === null ? null : usd.format(v));

/** Decimal fractions (0.15) and pre-scaled values (15) both → "15%". */
export function formatPercent(v: number | null): string | null {
  if (v === null) return null;
  const pct = Math.abs(v) <= 1 ? v * 100 : v;
  return `${Number(pct.toFixed(1))}%`;
}

export const formatMultiple = (v: number | null): string | null =>
  v === null ? null : `${v.toFixed(2)}×`;

const CADENCE_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
};

export const cadenceLabel = (v: string | null): string | null =>
  v === null ? null : (CADENCE_LABELS[v] ?? v);

export function formatCloseDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function locationLabel(
  deal: { city: string | null; state: string | null } | null
): string | null {
  if (!deal) return null;
  return [deal.city, deal.state].filter(Boolean).join(', ') || null;
}

/** Raw YouTube/Vimeo URL → embeddable iframe src, or null if unrecognized. */
export function toEmbedUrl(videoUrl: string | null): string | null {
  if (!videoUrl) return null;
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch' && url.searchParams.get('v')) {
        return `https://www.youtube-nocookie.com/embed/${url.searchParams.get('v')}`;
      }
      const shorts = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/);
      if (shorts) return `https://www.youtube-nocookie.com/embed/${shorts[1]}`;
    }
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (host === 'vimeo.com') {
      const id = url.pathname.match(/^\/(\d+)/);
      if (id) return `https://player.vimeo.com/video/${id[1]}`;
    }
    if (host === 'player.vimeo.com') return videoUrl;
  } catch {
    return null;
  }
  return null;
}
