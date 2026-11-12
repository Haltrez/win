'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type BrowserRow = { n: string; u: string; p: string; ps: string; img?: string; rtp: number | null; mw: number | null; v: string | null; vl: string | null; rel: string };

const SORTS = { newest: 'Newest', rtp: 'Highest RTP', maxwin: 'Biggest max win', az: 'A–Z' } as const;
type SortKey = keyof typeof SORTS;
const PAGE = 30;

/** One compact toolbar (provider, volatility, sort) over a single grid – replaces rows of filter chips. */
export function SlotBrowser({ rows, providers, vols }: { rows: BrowserRow[]; providers: { slug: string; name: string }[]; vols: { key: string; label: string }[] }) {
  const [prov, setProv] = useState('');
  const [vol, setVol] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [shown, setShown] = useState(PAGE);
  const list = useMemo(() => {
    const f = rows.filter((r) => (!prov || r.ps === prov) && (!vol || r.v === vol));
    const by: Record<SortKey, (a: BrowserRow, b: BrowserRow) => number> = {
      newest: (a, b) => b.rel.localeCompare(a.rel),
      rtp: (a, b) => (b.rtp ?? 0) - (a.rtp ?? 0),
      maxwin: (a, b) => (b.mw ?? 0) - (a.mw ?? 0),
      az: (a, b) => a.n.localeCompare(b.n),
    };
    return [...f].sort(by[sort]);
  }, [rows, prov, vol, sort]);
  const reset = () => setShown(PAGE);
  return (
    <div>
      <div className="toolbar" role="group" aria-label="Filter slots">
        <label>
          <span className="sr-only">Provider</span>
          <select value={prov} onChange={(e) => { setProv(e.target.value); reset(); }}>
            <option value="">All providers</option>
            {providers.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Volatility</span>
          <select value={vol} onChange={(e) => { setVol(e.target.value); reset(); }}>
            <option value="">Any volatility</option>
            {vols.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => { setSort(e.target.value as SortKey); reset(); }}>
            {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <span className="muted small toolbar-count">{list.length} slots</span>
      </div>
      <div className="slot-grid">
        {list.slice(0, shown).map((r) => (
          <article key={r.u} className="slot-card">
            <Link href={r.u} className="slot-card-link">
              <div className="slot-card-media">
                {r.img ? <Image src={r.img} alt={`${r.n} slot`} width={320} height={240} sizes="(max-width: 640px) 50vw, 240px" className="thumb" /> : <div className="thumb thumb-gen" style={{ aspectRatio: '4 / 3', background: '#334' }}><span>{r.n}</span></div>}
                {r.vl ? <span className={`vol-badge vol-${r.v}`}>{r.vl}</span> : null}
              </div>
              <p className="sc-name">{r.n}</p>
              <p className="slot-card-meta">
                <span className="prov">{r.p}</span>
                <span className="stats">{[r.rtp != null ? `${r.rtp.toFixed(2)}% RTP` : null, r.mw ? `${r.mw.toLocaleString('en-US')}x` : null].filter(Boolean).join(' · ')}</span>
              </p>
            </Link>
          </article>
        ))}
      </div>
      {shown < list.length ? (
        <p className="center"><button type="button" className="btn" onClick={() => setShown((n) => n + PAGE)}>Show more ({list.length - shown} left)</button></p>
      ) : null}
    </div>
  );
}
