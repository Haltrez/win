import Link from 'next/link';
import type { Slot } from '@/lib/types';
import { slotUrl, getProvider } from '@/lib/data';
import { fmtRtp, volLabel } from '@/lib/format';
import { SlotThumb } from './SlotThumb';

/** Compact card: the whole card is one link; volatility sits on the image, key numbers on one line. */
export function SlotCard({ slot, rank }: { slot: Slot; rank?: number }) {
  const p = getProvider(slot.provider);
  const stats = [slot.rtp != null ? `${fmtRtp(slot.rtp)} RTP` : null, slot.maxWin ? `${slot.maxWin.toLocaleString('en-US')}x` : null].filter(Boolean);
  return (
    <article className="slot-card">
      <Link href={slotUrl(slot)} className="slot-card-link">
        <div className="slot-card-media">
          <SlotThumb slot={slot} />
          {rank ? <span className="rank">#{rank}</span> : null}
          {slot.volatility ? <span className={`vol-badge vol-${slot.volatility}`}>{volLabel(slot.volatility)}</span> : null}
        </div>
        <h3>{slot.name}</h3>
        <p className="slot-card-meta">
          <span className="prov">{p?.name}</span>
          {stats.length ? <span className="stats">{stats.join(' · ')}</span> : null}
        </p>
      </Link>
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

/** One horizontally scrolling row – never leaves half-empty rows, at any screen width. */
export function SlotRail({ slots, ranked = false, label }: { slots: Slot[]; ranked?: boolean; label?: string }) {
  return (
    <div className="slot-rail" role="list" aria-label={label}>
      {slots.map((s, i) => (
        <div role="listitem" key={`${s.provider}/${s.slug}`}>
          <SlotCard slot={s} rank={ranked ? i + 1 : undefined} />
        </div>
      ))}
    </div>
  );
}
