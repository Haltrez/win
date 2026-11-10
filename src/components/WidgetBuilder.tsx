'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type Row = { n: string; p: string; u: string };
declare global { interface Window { ScatterDrop?: { refresh: () => void } } }

/** Pick a slot, preview the embeddable card and copy its code. */
export function WidgetBuilder({ site, initial }: { site: string; initial: { id: string; name: string } }) {
  const [idx, setIdx] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(initial);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [copied, setCopied] = useState(false);
  const preview = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/search-index.json').then((r) => r.json()).then(setIdx).catch(() => {});
    const id = new URLSearchParams(location.search).get('slot');
    if (id && /^[a-z0-9-]+\/[a-z0-9-]+$/.test(id)) setSel({ id, name: '' });
  }, []);
  useEffect(() => {
    if (!sel.name && idx.length) { const r = idx.find((x) => x.u === `/slots/${sel.id}`); if (r) setSel({ id: sel.id, name: r.n }); }
  }, [idx, sel]);

  const res = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t.length < 2 ? [] : idx.filter((r) => r.n.toLowerCase().includes(t)).slice(0, 8);
  }, [q, idx]);

  const url = `${site}/slots/${sel.id}`;
  const code = `<div class="scatterdrop-slot" data-slot="${sel.id}" data-theme="${theme}"><a href="${url}">${sel.name ? `Play ${sel.name} free demo` : 'Play the free demo'}</a></div>\n<script async src="${site}/embed.js"></script>`;

  // Re-render the live preview with the real embed script whenever the selection changes.
  useEffect(() => {
    const box = preview.current;
    if (!box) return;
    box.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'scatterdrop-slot'; el.dataset.slot = sel.id; el.dataset.theme = theme;
    const a = document.createElement('a'); a.href = url; a.textContent = sel.name ? `Play ${sel.name} free demo` : 'Play the free demo'; el.appendChild(a);
    box.appendChild(el);
    if (window.ScatterDrop) window.ScatterDrop.refresh();
    else if (!document.querySelector('script[data-sd-embed]')) {
      const s = document.createElement('script'); s.src = '/embed.js'; s.async = true; s.dataset.sdEmbed = '1'; document.body.appendChild(s);
    }
  }, [sel.id, sel.name, theme, url]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* select manually */ }
  };

  return (
    <div className="wb">
      <div className="wb-controls">
        <label className="wb-label" htmlFor="wb-q">1. Choose a slot</label>
        <div className="wb-search">
          <input id="wb-q" type="search" placeholder={sel.name ? `Selected: ${sel.name} – type to change` : 'Search slots…'} value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          {res.length ? (
            <ul className="hs-list" role="listbox">
              {res.map((r) => (
                <li key={r.u}><a href={r.u} onClick={(e) => { e.preventDefault(); setSel({ id: r.u.replace('/slots/', ''), name: r.n }); setQ(''); }}><span className="hs-name">{r.n}</span><span className="hs-prov">{r.p}</span></a></li>
              ))}
            </ul>
          ) : null}
        </div>
        <span className="wb-label">2. Pick a style</span>
        <div className="wb-theme" role="radiogroup" aria-label="Card style">
          {(['dark', 'light'] as const).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={theme === t} className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}>{t === 'dark' ? 'Dark' : 'Light'}</button>
          ))}
        </div>
        <label className="wb-label" htmlFor="wb-code">3. Copy the code into your page</label>
        <textarea id="wb-code" readOnly value={code} rows={5} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn-primary" onClick={copy}>{copied ? 'Copied ✓' : 'Copy code'}</button>
      </div>
      <div className="wb-preview">
        <span className="wb-label">Preview</span>
        <div ref={preview} />
      </div>
    </div>
  );
}
