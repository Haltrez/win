'use client';
import { useEffect, useRef, useState } from 'react';
import { track } from './Analytics';

export type CtaCasino = { slug: string; name: string; geos: string[]; bonus: Record<string, string>; terms: string };

const FIRST_AFTER = 120; // seconds of visible demo play before the first prompt
const EVERY = 120;       // seconds of visible play between prompts
const MAX_PER_VISIT = 3; // across all games in one browser session
const K_COUNT = 'demoCtaShown';
const K_OFF = 'demoCtaOff';

const ss = {
  get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } },
};
function readGeo(): string | null {
  const m = document.cookie.match(/(?:^|; )geo=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Real-money prompt shown next to (below) a running demo – never over the game.
 * Timing counts only visible play time; first after 2 min, then every 2 min, max 3 per visit; "Not now" stops it
 * for the visit. Only casinos licensed for the visitor's country (geo cookie) are offered; unknown country = no prompt.
 */
export function DemoCta({ casinos, slotName, slotKey }: { casinos: CtaCasino[]; slotName: string; slotKey: string }) {
  const [casino, setCasino] = useState<{ c: CtaCasino; bonus: string } | null>(null);
  const [show, setShow] = useState(false);
  const played = useRef(0);
  const next = useRef(FIRST_AFTER);

  useEffect(() => {
    const geo = readGeo();
    if (!geo || !casinos.length) return;
    const region = geo.split('-')[0];
    const c = casinos.find((x) => x.geos.includes(geo) || x.geos.includes(region));
    if (!c) return;
    setCasino({ c, bonus: c.bonus[geo] || c.bonus[region] || c.bonus.default });

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (ss.get(K_OFF) === '1' || Number(ss.get(K_COUNT) || 0) >= MAX_PER_VISIT) return;
      played.current += 1;
      if (played.current >= next.current) {
        next.current = played.current + EVERY;
        ss.set(K_COUNT, String(Number(ss.get(K_COUNT) || 0) + 1));
        setShow(true);
        track('demo_cta_view', { slot: slotKey, casino: c.slug });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [casinos, slotKey]);

  if (!casino || !show) return null;
  const { c, bonus } = casino;
  return (
    <aside className="demo-cta-card" role="complementary" aria-label="Real-money offer">
      <div className="dcc-text">
        <strong>Enjoying {slotName}? Play it for real at {c.name}</strong>
        <span className="dcc-bonus">{bonus}</span>
        <span className="dcc-terms">{c.terms} · <a href="/responsible-gambling">Play responsibly</a></span>
      </div>
      <div className="dcc-actions">
        <a className="btn btn-primary" href={`/go/${c.slug}?src=demo-cta&slot=${encodeURIComponent(slotKey)}`} rel="sponsored nofollow noopener" target="_blank" data-event="affiliate_click">
          Play for real
        </a>
        <button type="button" className="btn btn-ghost" onClick={() => { ss.set(K_OFF, '1'); setShow(false); track('demo_cta_dismiss', { slot: slotKey }); }}>
          Not now
        </button>
      </div>
    </aside>
  );
}
