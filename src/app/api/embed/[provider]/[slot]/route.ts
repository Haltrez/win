import { getProvider, getSlot, getSlots, slotUrl } from '@/lib/data';
import { SITE } from '@/lib/config';
import { fmtRtp, fmtX, volLabel } from '@/lib/format';

/** Public JSON for the embeddable slot card (public/embed.js). Static per slot, CORS-open. */
export const dynamic = 'force-static';
export function generateStaticParams() {
  return getSlots().map((s) => ({ provider: s.provider, slot: s.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ provider: string; slot: string }> }) {
  const { provider, slot } = await params;
  const s = getSlot(provider, slot);
  const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600, s-maxage=86400' };
  if (!s) return Response.json({ error: 'not found' }, { status: 404, headers });
  return Response.json(
    {
      name: s.name,
      provider: getProvider(s.provider)?.name ?? s.provider,
      url: `${SITE.url}${slotUrl(s)}`,
      image: s.image ? `${SITE.url}${s.image}` : null,
      rtp: fmtRtp(s.rtp),
      volatility: volLabel(s.volatility),
      maxWin: fmtX(s.maxWin),
      demo: Boolean(s.demoUrl),
      site: { name: SITE.name, url: SITE.url },
    },
    { headers },
  );
}
