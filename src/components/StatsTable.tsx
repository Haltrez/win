import Link from 'next/link';
import type { Provider, Slot } from '@/lib/types';
import { fmtDate, fmtRtp, fmtX, VOLATILITY_LABEL } from '@/lib/format';

export function StatsTable({ slot, provider }: { slot: Slot; provider: Provider }) {
  const rows: [string, React.ReactNode][] = [
    ['Provider', <Link key="p" href={`/providers/${provider.slug}`}>{provider.name}</Link>],
    ['RTP', <>{fmtRtp(slot.rtp)}{slot.rtpVariants?.length ? <span className="muted small"> (also {slot.rtpVariants.map(fmtRtp).join(', ')})</span> : null}</>],
    ['Volatility', VOLATILITY_LABEL[slot.volatility]],
    ['Max win', fmtX(slot.maxWin)],
    ['Release date', fmtDate(slot.releaseDate)],
    ['Layout', slot.reels],
    ['Paylines / ways', slot.paylines],
    ...(slot.hitFrequency ? [['Hit frequency', `${slot.hitFrequency}%`] as [string, string]] : []),
    ...(slot.minBet != null && slot.maxBet != null ? [['Bet range', `${slot.minBet} – ${slot.maxBet}`] as [string, string]] : []),
    ['Bonus buy', slot.mechanics.includes('bonus-buy') ? 'Yes (not available in all markets)' : 'No'],
  ];
  return (
    <table className="stats">
      <caption className="sr-only">{slot.name} key facts</caption>
      <tbody>{rows.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody>
    </table>
  );
}
