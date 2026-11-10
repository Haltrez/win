'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Row = { n: string; p: string; u: string };
let cache: Row[] | null = null;

const Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);

/**
 * Site-wide search in the header. Desktop: inline field with a dropdown. Phone: icon that opens a full-width bar.
 * Uses the same static /search-index.json as the page search, fetched on first focus. Arrow keys + Enter, Esc closes.
 */
export function HeaderSearch() {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState<Row[] | null>(cache);
  const [open, setOpen] = useState(false); // dropdown
  const [bar, setBar] = useState(false); // phone bar
  const [sel, setSel] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const load = () => {
    if (idx) return;
    fetch('/search-index.json').then((r) => r.json()).then((d: Row[]) => { cache = d; setIdx(d); }).catch(() => setIdx([]));
  };
  useEffect(() => { setOpen(false); setBar(false); setQ(''); }, [pathname]);
  useEffect(() => {
    const onDown = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) { setOpen(false); setBar(false); } };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);
  useEffect(() => { if (bar) input.current?.focus(); }, [bar]);
  // Search links (/slots?q=…, e.g. from Google's sitelinks search box) open with results showing.
  useEffect(() => {
    const init = new URLSearchParams(location.search).get('q');
    if (!init) return;
    setQ(init); load(); setOpen(true);
    if (window.matchMedia('(max-width: 859px)').matches) setBar(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const res = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!idx || t.length < 2) return [];
    const starts = idx.filter((r) => r.n.toLowerCase().startsWith(t));
    const rest = idx.filter((r) => !r.n.toLowerCase().startsWith(t) && (r.n.toLowerCase().includes(t) || r.p.toLowerCase().includes(t)));
    return [...starts, ...rest].slice(0, 8);
  }, [q, idx]);
  useEffect(() => setSel(0), [q]);

  const go = (u: string) => { setOpen(false); setBar(false); setQ(''); router.push(u); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, res.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Escape') { setOpen(false); setBar(false); input.current?.blur(); }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (res[sel]) go(res[sel].u);
    else if (q.trim()) go(`/slots?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className={`hs${bar ? ' hs-bar' : ''}`} ref={box} role="search">
      <button type="button" className="hs-toggle" aria-label="Search slots" aria-expanded={bar} onClick={() => setBar((b) => !b)}>
        <Icon />
      </button>
      <form className="hs-form" action="/slots" onSubmit={submit}>
        <span className="hs-icon"><Icon /></span>
        <label htmlFor="hs-q" className="sr-only">Search slots or providers</label>
        <input
          id="hs-q" ref={input} name="q" type="search" placeholder="Search slots or providers…" autoComplete="off"
          value={q} onFocus={() => { load(); setOpen(true); }} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onKeyDown={onKey}
          role="combobox" aria-expanded={open && res.length > 0} aria-controls="hs-list" aria-autocomplete="list"
        />
      </form>
      {open && q.trim().length >= 2 && (
        <ul id="hs-list" className="hs-list" role="listbox">
          {res.length ? res.map((r, i) => (
            <li key={r.u} role="option" aria-selected={i === sel}>
              <a href={r.u} className={i === sel ? 'on' : undefined} onMouseEnter={() => setSel(i)} onClick={(e) => { e.preventDefault(); go(r.u); }}>
                <span className="hs-name">{r.n}</span><span className="hs-prov">{r.p}</span>
              </a>
            </li>
          )) : <li className="hs-empty">{idx ? 'No slots found' : 'Loading…'}</li>}
        </ul>
      )}
    </div>
  );
}
