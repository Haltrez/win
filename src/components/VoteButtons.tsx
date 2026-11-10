'use client';
import { useEffect, useState } from 'react';

type State = { up: number; down: number; mine: 'up' | 'down' | null };

const Thumb = ({ down = false }: { down?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={down ? { transform: 'rotate(180deg)' } : undefined}>
    <path fill="currentColor" d="M2 21h3V9H2v12Zm19.6-10.3c-.3-.4-.8-.7-1.4-.7H14l1-4.6c.1-.5 0-1-.4-1.4L13.8 3 7.6 9.2c-.4.4-.6.9-.6 1.4V19c0 1.1.9 2 2 2h8.2c.8 0 1.5-.5 1.8-1.2l3-7c.2-.4.2-.8 0-1.2l-.4-.9Z" />
  </svg>
);

/** Like / dislike for a slot. Real votes only, one per device (changeable). Hidden if the vote store isn't configured. */
export function VoteButtons({ id, name }: { id: string; name: string }) {
  const [s, setS] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`/api/votes?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setS({ up: d.up, down: d.down, mine: d.mine }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [id]);
  if (!s) return null;

  const cast = async (v: 'up' | 'down') => {
    if (busy) return;
    const next = s.mine === v ? 'none' : v;
    // optimistic update
    const o = { ...s };
    if (o.mine) o[o.mine] = Math.max(0, o[o.mine] - 1);
    if (next !== 'none') o[next] += 1;
    o.mine = next === 'none' ? null : next;
    setS(o);
    setBusy(true);
    try {
      const r = await fetch('/api/votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, vote: next }) });
      if (r.ok) { const d = await r.json(); setS({ up: d.up, down: d.down, mine: d.mine }); }
    } catch { /* keep optimistic state */ } finally { setBusy(false); }
  };
  const total = s.up + s.down;
  return (
    <div className="votes" role="group" aria-label={`Rate ${name}`}>
      <span className="votes-label">{total ? `${Math.round((s.up / total) * 100)}% of ${total.toLocaleString()} players like it` : 'Did you like it?'}</span>
      <div className="votes-btns">
        <button type="button" className={`vote${s.mine === 'up' ? ' on up' : ''}`} aria-pressed={s.mine === 'up'} onClick={() => cast('up')} aria-label={`Like ${name}`}>
          <Thumb /> <span>{s.up.toLocaleString()}</span>
        </button>
        <button type="button" className={`vote${s.mine === 'down' ? ' on down' : ''}`} aria-pressed={s.mine === 'down'} onClick={() => cast('down')} aria-label={`Dislike ${name}`}>
          <Thumb down /> <span>{s.down.toLocaleString()}</span>
        </button>
      </div>
    </div>
  );
}
