'use client';
import { useEffect, useRef, useState } from 'react';
import { track } from './Analytics';
import { FEATURES } from '@/lib/config';

export type CtaCasino = { slug: string; name: string; geos: string[]; bonus: Record<string, string>; terms: string };

const FIRST_AFTER = 90; // seconds of visible demo play before the first prompt
const EVERY = 90;        // seconds of visible play between prompts
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
 * Real-money prompt that pops up over a running demo (inside the demo frame, so it also shows in full screen).
 * Timing counts only visible play time; first after 90 s, then every 90 s, max 3 per visit. Never on page load.
 * "Keep playing", the ✕, a click on the backdrop or Esc closes the current prompt only. Only casinos licensed for the visitor's country (geo cookie) are offered; unknown country = no prompt.
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
      const geo = readGeo() || '';
      if (!casinos.length || (FEATURES.geoFilter && !geo)) return;
      const region = geo.split('-')[0];
      c = FEATURES.geoFilter ? casinos.find((x) => x.geos.includes(geo) || x.geos.includes(region)) : casinos[0];
      if (!c) return;
      bonus = (geo && c.bonus[geo]) || (region && c.bonus[region]) || c.bonus.default;
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

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShow(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show]);

  if (!casino || !show) return null;
  const { c, bonus } = casino;
  const close = () => { setShow(false); if (c.slug !== 'example') track('demo_cta_dismiss', { slot: slotKey }); };
  return (
    <div className="dcp" role="dialog" aria-modal="false" aria-label="Real-money offer" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="dcp-card">
        <button type="button" className="dcp-x" onClick={close} aria-label="Close offer">✕</button>
        <span className="dcp-eyebrow">Play {slotName} for real</span>
        <strong className="dcp-bonus">{bonus}</strong>
        <span className="dcp-casino">at {c.name}</span>
        <a className="btn btn-primary dcp-go" {...(c.slug === 'example' ? { href: '#', onClick: (e: React.MouseEvent) => e.preventDefault() } : { href: `/go/${c.slug}?src=demo-cta&slot=${encodeURIComponent(slotKey)}`, target: '_blank', 'data-event': 'affiliate_click' })} rel="sponsored nofollow noopener">
          Claim now <span aria-hidden>→</span>
        </a>
        <button type="button" className="dcp-keep" onClick={close}>Keep playing the demo</button>
        <span className="dcp-terms">{c.terms} <a href="/responsible-gambling">Play responsibly</a></span>
      </div>
    </div>
  );
}
