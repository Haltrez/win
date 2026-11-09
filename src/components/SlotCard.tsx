import Link from 'next/link';
import type { Slot } from '@/lib/types';
import { slotUrl, getProvider } from '@/lib/data';
import { fmtRtp, volLabel } from '@/lib/format';
import { SlotThumb } from './SlotThumb';

export function SlotCard({ slot, rank }: { slot: Slot; rank?: number }) {
  const p = getProvider(slot.provider);
  return (
    <article className="slot-card">
      <Link href={slotUrl(slot)} className="slot-card-link">
        <SlotThumb slot={slot} />
        {rank ? <span className="rank">#{rank}</span> : null}
        <h3>{slot.name}</h3>
      </Link>
      <p className="muted small"><Link href={`/providers/${slot.provider}`}>{p?.name}</Link></p>
      <dl className="mini-stats">
        <div><dt>RTP</dt><dd>{fmtRtp(slot.rtp)}</dd></div>
        <div><dt>Max win</dt><dd>{slot.maxWin ? `${slot.maxWin.toLocaleString('en-US')}x` : '–'}</dd></div>
        <div><dt>Volatility</dt><dd>{slot.volatility ? volLabel(slot.volatility) : '–'}</dd></div>
      </dl>
    </article>
  );
}

export function SlotGrid({ slots, ranked = false }: { slots: Slot[]; ranked?: boolean }) {
  return (
    <div className="slot-grid">
      {slots.map((s, i) => <SlotCard key={`${s.provider}/${s.slug}`} slot={s} rank={ranked ? i + 1 : undefined} />)}
    </div>
  );
}
