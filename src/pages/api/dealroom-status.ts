/**
 * GET /api/dealroom-status — minimal signal for the homepage offer modal.
 * The homepage is prerendered, so it can't know at build time whether a
 * raise is currently open; the modal asks this on-demand route instead.
 * Returns only { active, raiseId } — no deal specifics leave the server
 * (the offerings pages themselves are gated and noindexed), and the API
 * key never reaches the browser.
 */
import type { APIRoute } from 'astro';
import { listPublicRaises } from '@/lib/dealroom';

export const prerender = false;

export const GET: APIRoute = async () => {
  const raises = await listPublicRaises();
  const active = raises.find((raise) => raise.status === 'active');
  return new Response(JSON.stringify({ active: Boolean(active), raiseId: active?.id ?? null }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
};
