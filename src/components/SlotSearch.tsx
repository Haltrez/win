'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Row = { n: string; p: string; u: string };
/** Client-side search over a static index (/search-index.json), fetched lazily on first focus. */
export function SlotSearch() {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState<Row[] | null>(null);
  const load = () => { if (!idx) fetch('/search-index.json').then((r) => r.json()).then(setIdx).catch(() => setIdx([])); };
  useEffect(() => {
    const init = new URLSearchParams(location.search).get('q');
    if (init) { setQ(init); load(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const res = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!idx || t.length < 2) return [];
    return idx.filter((r) => r.n.toLowerCase().includes(t) || r.p.toLowerCase().includes(t)).slice(0, 12);
  }, [q, idx]);
  return (
    <div role="search">
      <form className="search" action="/slots" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="slot-q" className="sr-only">Search slots</label>
        <input id="slot-q" name="q" type="search" placeholder="Search slots or providers…" value={q} onFocus={load} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </form>
      {res.length > 0 && (
        <ul className="search-results">
          {res.map((r) => <li key={r.u}><Link href={r.u}>{r.n}</Link> <span className="muted small">· {r.p}</span></li>)}
        </ul>
      )}
    </div>
  );
}
