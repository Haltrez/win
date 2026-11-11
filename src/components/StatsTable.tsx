import Link from 'next/link';
import type { Provider, Slot } from '@/lib/types';
import { fmtRelease, fmtRtp, fmtX, volLabel } from '@/lib/format';

export function StatsTable({ slot, provider }: { slot: Slot; provider: Provider }) {
  const rows: [string, React.ReactNode][] = [
    ['Provider', <Link key="p" href={`/providers/${provider.slug}`}>{provider.name}</Link>],
    ['RTP', <>{fmtRtp(slot.rtp)}{slot.rtpSource === 'third-party' ? <span className="muted small"> (third-party figure, not confirmed by the provider)</span> : null}{slot.rtpVariants?.length ? <span className="muted small"> (also {slot.rtpVariants.map(fmtRtp).join(', ')})</span> : null}</>],
    ['Volatility', volLabel(slot.volatility)],
    ['Max win', fmtX(slot.maxWin)],
    ['Release date', fmtRelease(slot)],
    ...(slot.reels ? [['Layout', slot.reels] as [string, string]] : []),
    ...(slot.paylines || slot.winType ? [['Paylines / ways', (slot.paylines ?? slot.winType)!] as [string, string]] : []),
    ...(slot.hitRate ? [['Hit rate', `1 in ${slot.hitRate} spins`] as [string, string]] : []),
    ...(slot.bonusRate ? [['Bonus frequency', `About 1 in ${Math.round(slot.bonusRate)} spins`] as [string, string]] : []),
    ...(slot.hitFrequency ? [['Hit frequency', `${slot.hitFrequency}%`] as [string, string]] : []),
    ...(slot.minBet != null && slot.maxBet != null ? [['Bet range', `${slot.minBet} – ${slot.maxBet}`] as [string, string]] : []),
    ['Bonus buy', slot.mechanics.includes('bonus-buy') ? 'Yes (not available in all markets)' : 'No'],
  ];
  const tiles: [string, string][] = [['RTP', fmtRtp(slot.rtp)], ['Volatility', volLabel(slot.volatility)], ['Max win', fmtX(slot.maxWin)], ['Provider', provider.name]];
  return (
    <>
    <dl className="stat-tiles">{tiles.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    <details className="stats-more"><summary>All game details</summary>
    <table className="stats">
      <caption className="sr-only">{slot.name} key facts</caption>
      <tbody>{rows.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody>
    </table>
    </details>
    </>
  );
}
