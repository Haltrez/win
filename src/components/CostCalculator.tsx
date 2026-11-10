'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export type CalcSlot = { n: string; p: string; u: string; rtp: number; v: number[] };
const money = (x: number) => (Math.abs(x) >= 100 ? x.toLocaleString('en-US', { maximumFractionDigits: 0 }) : x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

/** Expected cost of a session from RTP, stake and spins – with lower RTP versions side by side. */
export function CostCalculator({ slots }: { slots: CalcSlot[] }) {
  const [q, setQ] = useState('');
  const [slot, setSlot] = useState<CalcSlot | null>(null);
  const [rtp, setRtp] = useState(96);
  const [bet, setBet] = useState(1);
  const [spins, setSpins] = useState(500);
  const [cur, setCur] = useState('€');

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('slot');
    const s = id ? slots.find((x) => x.u === `/slots/${id}`) : null;
    if (s) { setSlot(s); setRtp(s.rtp); }
  }, [slots]);

  const res = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t.length < 2 ? [] : slots.filter((s) => s.n.toLowerCase().includes(t)).slice(0, 8);
  }, [q, slots]);

  const staked = Math.max(0, bet) * Math.max(0, spins);
  const rows = [rtp, ...(slot?.v ?? [])].map((r) => ({ r, cost: (staked * (100 - r)) / 100 }));
  const cost = rows[0].cost;

  return (
    <div className="calc">
      <div className="calc-form">
        <label className="wb-label" htmlFor="c-q">Slot (optional)</label>
        <div className="wb-search">
          <input id="c-q" type="search" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} placeholder={slot ? `${slot.n} – type to change` : 'Search a slot to use its official RTP…'} />
          {res.length ? (
            <ul className="hs-list" role="listbox">
              {res.map((s) => (
                <li key={s.u}><a href={s.u} onClick={(e) => { e.preventDefault(); setSlot(s); setRtp(s.rtp); setQ(''); }}><span className="hs-name">{s.n}</span><span className="hs-prov">{s.rtp.toFixed(2)}%</span></a></li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="calc-grid">
          <label>RTP (%)<input type="number" step="0.01" min={80} max={99.9} value={rtp} onChange={(e) => { setRtp(Number(e.target.value)); setSlot(null); }} /></label>
          <label>Bet per spin<span className="calc-cur"><select value={cur} onChange={(e) => setCur(e.target.value)} aria-label="Currency"><option>€</option><option>$</option><option>£</option></select><input type="number" step="0.1" min={0} value={bet} onChange={(e) => setBet(Number(e.target.value))} /></span></label>
          <label>Number of spins<input type="number" step="50" min={0} value={spins} onChange={(e) => setSpins(Number(e.target.value))} /></label>
        </div>
        <p className="muted small">A fast-paced player makes roughly 400–600 spins an hour.</p>
      </div>
      <div className="calc-out" aria-live="polite">
        <p className="calc-big">{cur}{money(cost)}</p>
        <p>expected cost of {spins.toLocaleString()} spins at {cur}{money(bet)}{slot ? <> on <Link href={slot.u}>{slot.n}</Link></> : null} (total staked {cur}{money(staked)}, RTP {rtp.toFixed(2)}%).</p>
        {rows.length > 1 ? (
          <>
            <h3>Same session on the casino&apos;s other RTP versions</h3>
            <table className="cmp"><thead><tr><th>RTP version</th><th>Expected cost</th></tr></thead>
              <tbody>{rows.map((x, i) => <tr key={x.r}><td>{x.r.toFixed(2)}%{i === 0 ? ' (default)' : ''}</td><td>{cur}{money(x.cost)}{i ? <span className="muted"> (+{cur}{money(x.cost - cost)})</span> : null}</td></tr>)}</tbody></table>
            <p className="muted small">The game looks identical in every version. Check the RTP in the game&apos;s info screen.</p>
          </>
        ) : null}
        <p className="muted small">This is a long-run average. Over one session the result can be far better or far worse, especially on high-volatility slots. Only play with money you can afford to lose.</p>
      </div>
    </div>
  );
}
