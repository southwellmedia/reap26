# Reap Capital — LucidOS Deal Room Integration Guide

This file teaches developers and AI coding agents (Claude Code, Cursor,
etc.) how to embed LucidOS deal-room teasers on this website. Keep it at
the repo root as `LUCID-DEALROOM.md` and reference it from your agent's
own instructions file — e.g. add `@LUCID-DEALROOM.md` on its own line in
`CLAUDE.md` (Claude Code), or point to it from `AGENTS.md` / Cursor rules.

## What this is

LucidOS hosts the sponsor's fundraising deal rooms. Each raise can expose a
**public teaser tier** — marketing content only: headline, summary, cover
image, sponsor branding, target return metrics, funding progress, and an
interest form. **Documents, detailed financials, and the street address are
never served by this API** — they live behind LucidOS's invite-only investor
portal. The interest form is the bridge: a visitor submits, they become a
prospect in the sponsor's fundraising pipeline, and the sponsor follows up
with a portal invitation.

Two integration paths (both live off the same backend):

1. **Widget (fastest)** — one script tag renders the whole teaser in a
   LucidOS-served iframe. Zero build work, auto-themed, height-syncs itself.
2. **Headless JSON API** — fetch the teaser payload server-side and render
   fully custom UI. This guide is mostly about path 2.

## Path 1 — widget embed

```html
<script src="https://lucid.madstack.io/widget/dealroom/v1.js"
        data-raise="0e6da43a-4989-4dc2-8b92-2571bb182a4c" async></script>
```

- The iframe is inserted where the tag sits (block-level, max-width 960px,
  centered). Add `data-target="#some-selector"` to mount elsewhere, and
  `data-height="800"` to change the pre-load placeholder height.
- `window.LucidDealRoom.destroy()` unmounts it (SPA route changes).
- Framework path: `import { mountLucidDealRoom } from "@reap/cms-sdk/dealroom"`
  and call it with `{ raise, baseUrl, target }`.
- The widget only renders on domains in the sponsor's origin allowlist
  (configured in LucidOS; an empty allowlist allows all origins during
  testing). No API key involved anywhere.

## Path 2 — headless API

### Connection

- **Base URL**: `https://lucid.madstack.io/api/dealroom`
- **Auth**: send `x-api-key: <key>` on every GET (keys look like `drk_live_…`)
- **Env convention**: `DEALROOM_API_URL` (the base URL) and `DEALROOM_API_KEY`
- **CRITICAL — key handling**: the API key is a server-side secret shared by
  ALL of the sponsor's raises. Only call GET endpoints from server/build code
  (Astro frontmatter, server routes, getStaticProps). NEVER put the key in
  browser JavaScript. The ONE exception is the interest submit endpoint,
  which requires no key and is designed to be called from the browser.

### Endpoints

| Method + path | Returns |
|---|---|
| `GET /v1/raises` | `{ raises: RaiseSummary[] }` — every publicly visible raise. Build a deals index page from this; it's empty until the sponsor flips a raise to public. |
| `GET /v1/raises/{raiseId}` | `Teaser` — the full teaser payload (shapes below). 404 if the raise isn't public. |
| `POST /v1/raises/{raiseId}/interest` | `{ ok: true }` — interest form submission. **No API key.** Browser-safe. |

### Response shapes

```ts
interface RaiseSummary {
  id: string;                    // use as {raiseId} in the other endpoints
  name: string;
  status: "active" | "closed";   // closed = fully subscribed, render read-only
  headline: string | null;
  coverImageUrl: string | null;  // public CDN URL — hot-link it
  targetRaise: number | null;    // dollars
  minimumInvestment: number | null;
  closeDate: string | null;      // ISO date
  deal: {
    name: string | null;
    city: string | null;         // city/state only — street address is portal-only
    state: string | null;
    propertyType: string | null;
    unitCount: number | null;
  } | null;
}

interface Teaser {
  raise: {
    id: string;
    name: string;
    status: "active" | "closed";
    targetRaise: number | null;
    minimumInvestment: number | null;
    closeDate: string | null;
    distributionCadence: string | null;  // "monthly" | "quarterly" | "semi_annual" | "annual" | null
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
    summaryMd: string | null;     // MARKDOWN (GitHub-flavored) — render with a
                                  // markdown renderer, never as raw HTML
    coverImageUrl: string | null;
    videoUrl: string | null;      // raw YouTube/Vimeo URL — convert to the
                                  // embed form before iframing
    layout: "editorial" | "institutional" | "showcase";
    theme: "warm" | "modern" | "bold";
    accentColor: string | null;   // sponsor brand hex, overrides the theme accent
    hiddenZones: string[];        // zones the sponsor hid; respected server-side
                                  // (hidden fields arrive null) — no client work needed
  };
  sponsor: {
    name: string;
    logoUrl: string | null;
    bioMd: string | null;         // markdown
    primaryColor: string | null;
    accentColor: string | null;
  } | null;
  metrics: {
    targetIrr: number | null;           // decimal fraction: 0.15 = 15%.
    targetEquityMultiple: number | null; // 1.8 = 1.80×
    targetCashOnCash: number | null;     // decimal fraction
    holdPeriodYears: number | null;
  } | null;
  progress: {
    targetRaise: number | null;
    percentOfTarget: number | null; // 0–100, already rounded to 1 decimal
    committedCount: number;         // investors at soft-commit or beyond
  };
  interest: {
    enabled: boolean;               // false on closed raises — hide the form,
                                    // show a "fully subscribed" state instead
    recaptchaSiteKey: string | null; // non-null = a token is REQUIRED on submit
  };
}
```

Rendering conventions:

- **Percent fields** (`targetIrr`, `targetCashOnCash`) are decimal fractions —
  multiply by 100 for display when `Math.abs(v) <= 1`.
- **Money** is plain dollars (never cents). Format with
  `Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })`.
- **theme / accentColor** are the sponsor's presentation choices. Suggested
  palettes: warm `{ bg #faf6ee, accent #b89757, text #3a402f }`, modern
  `{ bg #fafafa, accent #1f2937, text #0f172a }`, bold (dark)
  `{ bg #0c1322, accent #d4a653, text #f1ecd9 }`. `accentColor` (when set)
  replaces the theme accent. You may also ignore all of this and use the
  site's own design system — the data is presentation-agnostic.
- **status "closed"**: render everything read-only with a "fully subscribed"
  treatment; `interest.enabled` is already false.
- Do NOT invent data the payload doesn't carry (no address, no documents, no
  per-investor amounts) — those are intentionally excluded for securities-law
  reasons. Never present the teaser as an offer to sell securities; a
  disclaimer line like "This is not an offer to sell securities" is prudent.

### Interest form (browser-side POST, no key)

```ts
const res = await fetch("https://lucid.madstack.io/api/dealroom/v1/raises/0e6da43a-4989-4dc2-8b92-2571bb182a4c/interest", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    fullName,                  // required, 1–200 chars
    email,                     // required, valid email
    phone,                     // optional
    investmentRange,           // optional free text, e.g. "$100k – $250k"
    message,                   // optional, ≤5000 chars
    recaptchaToken,            // required IFF teaser.interest.recaptchaSiteKey is set
    sourceUrl: location.href,  // optional attribution
  }),
});
// reCAPTCHA is currently NOT configured for this sponsor — omit recaptchaToken (but read teaser.interest.recaptchaSiteKey at runtime in case that changes).
// 201 { ok: true }  — ALWAYS this shape on success. The response never
// reveals whether the email was already a known prospect. Show a simple
// thank-you state; the sponsor follows up with portal access.
```

Error responses: `400` validation (`{ error, details? }`) or missing/failed
reCAPTCHA, `403` origin not in the sponsor's allowlist, `404` raise not
public, `429` rate-limited (max 5/hour per IP per raise — show "try again
later"). Duplicate submissions within ~10 minutes are silently acknowledged
with `{ ok: true }` and not reprocessed, so double-clicks are safe.

CORS: GETs allow any origin (the key is the gate — but keep them
server-side anyway). The interest POST echoes the sponsor's configured
origin allowlist; posting from a non-allowlisted origin fails in browsers.

### Typed client (no SDK install needed)

```ts
// src/lib/dealroom.ts
const BASE = process.env.DEALROOM_API_URL!;   // https://lucid.madstack.io/api/dealroom
const KEY = process.env.DEALROOM_API_KEY!;    // drk_live_…

async function dealroom<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { "x-api-key": KEY } });
  if (!res.ok) throw new Error(`Deal room API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const listRaises = () => dealroom<{ raises: RaiseSummary[] }>("/v1/raises");
export const getRaise = (id: string) => dealroom<Teaser>(`/v1/raises/${id}`);
```

Or install the workspace SDK if this repo has access to it:
`import { LucidDealRoomClient } from "@reap/cms-sdk/dealroom"`.

### Caching & freshness

Responses send `Cache-Control: public, max-age=0, must-revalidate` for
browsers plus `CDN-Cache-Control` (~60s) so only the CDN caches. SSR pages
therefore reflect sponsor edits (progress, copy, visibility) within a minute
or two automatically. If you statically build, rebuild on a schedule —
funding progress changes as investors commit. A raise can also disappear
(sponsor hides it or it closes): always handle 404 by removing the deal page
or showing a "no longer available" state, never by erroring.

### Errors (GET endpoints)

`401` missing/invalid/revoked key · `403` sponsor's LucidOS fundraising
subscription inactive · `404` raise not public (or not this org's). Error
bodies are `{ "error": "…" }`.

---

## How THIS site implements it (Reap Capital specifics)

- **Path chosen**: headless API (path 2), rendered with the site's own
  design system (`reap-home.css` grammar) — not the widget, not the LucidOS
  themes. The deal page is a standalone split-view experience (sticky olive
  identity sidebar + light reading column), same grammar as `/invest`.
- **Gated + unlisted (important)**: Reap accepts non-accredited investors
  (506(b) posture), so offerings are NOT publicly advertised: no nav link,
  `noindex` meta + `X-Robots-Tag` on every `/offerings` route, and an
  `OfferingsGate` self-certification interstitial (localStorage ack, 30
  days) on the index and deal pages. Deal links are shared with prospects
  through the `/invest` request-access flow. Do not add `/offerings` back
  to the nav or sitemap without confirming the compliance posture changed.
- **Client**: `src/lib/dealroom.ts`. Env vars `DEALROOM_API_URL` /
  `DEALROOM_API_KEY` are declared in `astro.config.mjs` (server-side; the
  key is a secret) and read via `astro:env/server`.
- **Pages**: `/offerings` (index, from `GET /v1/raises`) and
  `/offerings/[id]` (teaser detail, from `GET /v1/raises/{id}`). Both are
  **server-rendered** (`prerender = false`; the site uses the Vercel adapter
  with everything else prerendered) with a 60s CDN cache
  (`CDN-Cache-Control: s-maxage=60, stale-while-revalidate=300`), so sponsor
  edits and funding progress appear within a minute or two — no rebuild
  needed. A hidden/closed raise 404s to the site's 404 page.
- **Missing key / API failure**: `/offerings` never 500s — it falls back to
  the empty "no current offerings" state and logs a warning. The detail page
  404s when the raise is gone and only errors on genuine API failures.
- **Deploy note**: `DEALROOM_API_KEY` must be set in the Vercel project's
  environment variables (it is a runtime secret now, not just build-time).
- **Interest form**: `src/components/patterns/DealRoomInterestForm.astro`,
  posts from the browser straight to LucidOS (no key). If the sponsor later
  enables reCAPTCHA in LucidOS, submissions will start failing with 400 —
  the form component must then be extended to load reCAPTCHA and send
  `recaptchaToken`, and the site rebuilt.
- **Markdown** (`summaryMd`, `bioMd`) is rendered at build time with
  `marked`.
