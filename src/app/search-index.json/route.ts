import { getProvider, getSlots, slotUrl } from '@/lib/data';

export const dynamic = 'force-static';

export function GET() {
  const rows = getSlots().map((s) => ({ n: s.name, p: getProvider(s.provider)?.name ?? s.provider, u: slotUrl(s) }));
  return Response.json(rows, { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } });
}
