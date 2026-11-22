import { NextRequest, NextResponse } from 'next/server';
import { getCasinos } from '@/lib/data';
import { dayKey, hashToCounts, monthKey, redisConfigured, redisPipeline } from '@/lib/redis';

/**
 * Owner-only affiliate click report (for partner renewals and rate negotiations).
 * GET /api/clicks?token=<CLICKS_TOKEN>[&month=YYYY-MM]
 * Requires CLICKS_TOKEN (any long random string) and the Redis env vars; answers 404 otherwise.
 */
export const dynamic = 'force-dynamic';

const top = (o: Record<string, number>, prefix: string, n = 10) =>
  Object.entries(o)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, v]) => [k.slice(prefix.length), v] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

export async function GET(req: NextRequest) {
  const want = process.env.CLICKS_TOKEN;
  if (!want || !redisConfigured()) return new NextResponse('Not found', { status: 404 });
  if (req.nextUrl.searchParams.get('token') !== want) return new NextResponse('Not found', { status: 404 });
  const month = /^\d{4}-\d{2}$/.test(req.nextUrl.searchParams.get('month') || '') ? req.nextUrl.searchParams.get('month')! : monthKey();
  const casinos = getCasinos().map((c) => c.slug);
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) days.push(dayKey(new Date(Date.now() - i * 86400000)));

  const cmds: (string | number)[][] = [
    ['HGETALL', `clicks:m:${month}`],
    ...casinos.map((c) => ['HGETALL', `clicks:c:${c}:m:${month}`]),
    ...days.map((d) => ['HGETALL', `clicks:d:${d}`]),
    ...days.map((d) => ['HGETALL', `clicks:blocked:d:${d}`]),
  ];
  const res = await redisPipeline(cmds);
  const monthTotals = hashToCounts(res[0]);
  const perCasino = Object.fromEntries(
    casinos.map((c, i) => {
      const h = hashToCounts(res[1 + i]);
      return [c, { clicks: monthTotals[c] ?? 0, countries: top(h, 'cc:'), placements: top(h, 'src:'), positions: top(h, 'pos:', 5), slots: top(h, 'slot:') }];
    }),
  );
  const daily = days.map((d, i) => ({ day: d, ...hashToCounts(res[1 + casinos.length + i]) }));
  const blocked = days.map((d, i) => ({ day: d, ...hashToCounts(res[1 + casinos.length + days.length + i]) })).filter((x) => Object.keys(x).length > 1);
  return NextResponse.json({ month, total: Object.values(monthTotals).reduce((a, b) => a + b, 0), casinos: perCasino, daily, blocked }, { headers: { 'Cache-Control': 'no-store' } });
}
