'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { fmtRtp, fmtX, VOLATILITY_LABEL, VOLATILITY_SCORE } from '@/lib/format';
import type { Volatility } from '@/lib/types';

export type DbRow = { name: string; url: string; provider: string; providerName: string; rtp: number | null; vol: Volatility | null; maxWin: number | null; released: string | null; variants: number };
type Key = 'name' | 'providerName' | 'rtp' | 'vol' | 'maxWin' | 'released';

const COLS: { key: Key; label: string; num?: boolean }[] = [
  { key: 'name', label: 'Slot' },
  { key: 'providerName', label: 'Provider' },
  { key: 'rtp', label: 'RTP', num: true },
  { key: 'vol', label: 'Volatility', num: true },
  { key: 'maxWin', label: 'Max win', num: true },
  { key: 'released', label: 'Released', num: true },
];
const val = (r: DbRow, k: Key) => (k === 'vol' ? (r.vol ? VOLATILITY_SCORE[r.vol] : null) : r[k]);

/** Sortable, filterable table of every slot. All rows are server-rendered, so the full list is crawlable. */
export function SlotDatabase({ rows, providers }: { rows: DbRow[]; providers: { slug: string; name: string }[] }) {
  const [q, setQ] = useState('');
  const [prov, setProv] = useState('');
  const [vol, setVol] = useState('');
  const [minRtp, setMinRtp] = useState(0);
  const [sort, setSort] = useState<{ k: Key; dir: 1 | -1 }>({ k: 'rtp', dir: -1 });

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = rows.filter((r) =>
      (!t || r.name.toLowerCase().includes(t)) && (!prov || r.provider === prov) && (!vol || r.vol === vol) && (!minRtp || (r.rtp ?? 0) >= minRtp));
    return out.sort((a, b) => {
      const x = val(a, sort.k), y = val(b, sort.k);
      if (x == null && y == null) return a.name.localeCompare(b.name);
      if (x == null) return 1; // "Not published" always last
      if (y == null) return -1;
      const c = typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number);
      return c * sort.dir || a.name.localeCompare(b.name);
    });
  }, [rows, q, prov, vol, minRtp, sort]);

  const click = (k: Key) => setSort((s) => (s.k === k ? { k, dir: (s.dir * -1) as 1 | -1 } : { k, dir: k === 'name' || k === 'providerName' ? 1 : -1 }));
  const reset = () => { setQ(''); setProv(''); setVol(''); setMinRtp(0); };

  return (
    <div className="db">
      <div className="db-filters" role="group" aria-label="Filter slots">
        <input type="search" placeholder="Filter by name…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter by slot name" />
        <select value={prov} onChange={(e) => setProv(e.target.value)} aria-label="Provider">
          <option value="">All providers</option>
          {providers.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
        </select>
        <select value={vol} onChange={(e) => setVol(e.target.value)} aria-label="Volatility">
          <option value="">Any volatility</option>
          {(Object.keys(VOLATILITY_LABEL) as Volatility[]).map((v) => <option key={v} value={v}>{VOLATILITY_LABEL[v]}</option>)}
        </select>
        <select value={minRtp} onChange={(e) => setMinRtp(Number(e.target.value))} aria-label="Minimum RTP">
          <option value={0}>Any RTP</option>
          <option value={96}>RTP 96%+</option>
          <option value={96.5}>RTP 96.5%+</option>
          <option value={97}>RTP 97%+</option>
        </select>
      </div>
      <p className="db-count muted small">
        Showing {list.length.toLocaleString()} of {rows.length.toLocaleString()} slots
        {list.length !== rows.length ? <> · <button type="button" className="linklike" onClick={reset}>Clear filters</button></> : null}
      </p>
      <div className="table-wrap db-wrap">
        <table className="cmp db-table">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key} aria-sort={sort.k === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={c.num ? 'num' : undefined}>
                  <button type="button" onClick={() => click(c.key)}>{c.label}{sort.k === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.url}>
                <td><Link href={r.url}>{r.name}</Link></td>
                <td>{r.providerName}</td>
                <td className="num">{fmtRtp(r.rtp)}{r.variants ? <span className="db-var" title="Casinos can run lower RTP versions"> *</span> : null}</td>
                <td className="num">{r.vol ? VOLATILITY_LABEL[r.vol] : '–'}</td>
                <td className="num">{r.maxWin ? fmtX(r.maxWin) : '–'}</td>
                <td className="num">{r.released ? r.released.slice(0, 4) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
