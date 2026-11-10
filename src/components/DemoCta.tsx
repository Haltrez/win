'use client';
import { useEffect, useRef, useState } from 'react';
import { track } from './Analytics';

export type CtaCasino = { slug: string; name: string; geos: string[]; bonus: Record<string, string>; terms: string };

const FIRST_AFTER = 120; // seconds of visible demo play before the first prompt
const EVERY = 120;       // seconds of visible play between prompts
const MAX_PER_VISIT = 3; // across all games in one browser session
const K_COUNT = 'demoCtaShown';
/** Test mode (?cta-test in the URL): example casino, first prompt after 10 s, then every 20 s. Never shown to normal visitors. */
const TEST_CASINO: CtaCasino = { slug: 'example', name: 'Example Casino (test)', geos: [], bonus: { default: 'Example bonus text – your real offer appears here' }, terms: '18+. Example terms – real significant terms appear here.' };
export const isCtaTest = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('cta-test');

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
 * Timing counts only visible play time; first after 2 min, then every 2 min, max 3 per visit; "Not now" closes the
 * current prompt only. Only casinos licensed for the visitor's country (geo cookie) are offered; unknown country = no prompt.
 */
export function DemoCta({ casinos, slotName, slotKey }: { casinos: CtaCasino[]; slotName: string; slotKey: string }) {
  const [casino, setCasino] = useState<{ c: CtaCasino; bonus: string } | null>(null);
  const [show, setShow] = useState(false);
  const played = useRef(0);
  const next = useRef(FIRST_AFTER);

  useEffect(() => {
    const test = isCtaTest();
    let c: CtaCasino | undefined;
    let bonus = '';
    if (test) {
      c = TEST_CASINO;
      bonus = TEST_CASINO.bonus.default;
      next.current = 10;
    } else {
      const geo = readGeo();
      if (!geo || !casinos.length) return;
      const region = geo.split('-')[0];
      c = casinos.find((x) => x.geos.includes(geo) || x.geos.includes(region));
      if (!c) return;
      bonus = c.bonus[geo] || c.bonus[region] || c.bonus.default;
    }
    const cc = c;
    setCasino({ c: cc, bonus });
    const every = test ? 20 : EVERY;
    const countKey = test ? `${K_COUNT}Test` : K_COUNT;

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Number(ss.get(countKey) || 0) >= MAX_PER_VISIT) return;
      played.current += 1;
      if (played.current >= next.current) {
        next.current = played.current + every;
        ss.set(countKey, String(Number(ss.get(countKey) || 0) + 1));
        setShow(true);
        if (!test) track('demo_cta_view', { slot: slotKey, casino: cc.slug });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [casinos, slotKey]);

  if (!casino || !show) return null;
  const { c, bonus } = casino;
  return (
    <aside className="demo-cta-card" role="complementary" aria-label="Real-money offer">
      <div className="dcc-text">
        <span className="dcc-eyebrow">Real-money offer · 18+</span>
        <strong className="dcc-title">Enjoying {slotName}? Play it for real at {c.name}</strong>
        <span className="dcc-bonus">{bonus}</span>
        <span className="dcc-terms">{c.terms} · <a href="/responsible-gambling">Play responsibly</a></span>
      </div>
      <div className="dcc-actions">
        <a className="btn btn-primary" {...(c.slug === 'example' ? { href: '#', onClick: (e: React.MouseEvent) => e.preventDefault() } : { href: `/go/${c.slug}?src=demo-cta&slot=${encodeURIComponent(slotKey)}`, target: '_blank', 'data-event': 'affiliate_click' })} rel="sponsored nofollow noopener">
          Play for real <span aria-hidden>→</span>
        </a>
        <button type="button" className="btn btn-ghost" onClick={() => { setShow(false); if (c.slug !== 'example') track('demo_cta_dismiss', { slot: slotKey }); }}>
          Not now
        </button>
      </div>
    </aside>
  );
}
