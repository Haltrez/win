import { getProvider, getSlots, slotUrl } from '@/lib/data';
import { SITE } from '@/lib/config';

export const dynamic = 'force-static';

const esc = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV export of the slot database (source: official provider data). */
export function GET() {
  const head = ['slot', 'provider', 'rtp', 'rtp_versions', 'volatility', 'max_win_x', 'release_date', 'url'];
  const lines = getSlots().map((s) =>
    [s.name, getProvider(s.provider)?.name ?? s.provider, s.rtp, (s.rtpVariants ?? []).join(';'), s.volatility, s.maxWin, s.releaseDate, `${SITE.url}${slotUrl(s)}`].map(esc).join(','));
  const body = `${head.join(',')}\n${lines.join('\n')}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'inline; filename="scatterdrop-slot-database.csv"' } });
}
