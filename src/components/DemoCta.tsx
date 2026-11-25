'use client';
import { useEffect, useRef, useState } from 'react';
import { track } from './Analytics';
import { FEATURES } from '@/lib/config';
import { geoAllowed, geoExcluded } from '@/lib/geo-match';
import type { TrustFacts } from '@/lib/types';
import { trustLine } from '@/lib/trust';

export type CtaCasino = { slug: string; name: string; geos: string[]; bonus: Record<string, string>; terms: string; cta?: string; sweeps?: boolean; logo?: string; logoLight?: boolean; badge?: string; offer?: Record<string, { title: string; sub?: string }>; trust?: TrustFacts };

const FIRST_AFTER = 90; // seconds of visible demo play before the first prompt
const EVERY = 90;        // seconds of visible play between prompts
const FAST_COUNT = 3;    // the first 3 prompts in a visit come every EVERY seconds…
const LATER_EVERY = 300; // …after that, one every 5 minutes of play
const K_COUNT = 'demoCtaShown';
/** Test mode (?cta-test in the URL): example casino, first prompt after 10 s, then every 20 s (40 s after the third). Never shown to normal visitors. */
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
 * Timing counts only visible play time; first after 90 s, then every 90 s for the first 3 in a visit, then every 5 min.
 * Never on page load.
 * "Keep playing", the ✕, a click on the backdrop or Esc closes the current prompt only. Only casinos licensed for the visitor's country (geo cookie) are offered; unknown country = no prompt.
 */
export type CtaLabels = { eyebrowSwitch?: string; eyebrow: string; at: string; claim: string; keep: string; label: string; close: string; playResponsibly: string; why?: string };
const CTA_EN: CtaLabels = { eyebrow: 'Like {name}? Play it for real', at: 'at {casino}', claim: 'Claim now', keep: 'Keep playing the demo', label: 'Real-money offer', close: 'Close offer', playResponsibly: 'Play responsibly', why: 'Why we list it', eyebrowSwitch: 'Looking for a better casino?' };

export function DemoCta({ casinos, slotName, slotKey, t }: { casinos: CtaCasino[]; slotName: string; slotKey: string; t?: Partial<CtaLabels> }) {
  const L = { ...CTA_EN, ...t };
  const [casino, setCasino] = useState<{ c: CtaCasino; bonus: string; offer?: { title: string; sub?: string } } | null>(null);
  const [show, setShow] = useState(false);
  const [intent, setIntent] = useState<'demo' | 'switch'>('demo');
  const played = useRef(0);
  const next = useRef(FIRST_AFTER);

  useEffect(() => {
    // Landing page tells us why they came: casino/guide pages = looking to switch; a game page = here for the demo.
    try { const l = sessionStorage.getItem('sdland') || ''; if (/^\/(casinos|best\/|guides\/)/.test(l) && !/^\/best\/[a-z0-9-]*slots/.test(l)) setIntent('switch'); } catch {}
    const test = isCtaTest();
    let c: CtaCasino | undefined;
    let bonus = '';
    if (test) {
      // ?cta-test shows the real first casino after 10 s (or the placeholder when none is passed)
      c = casinos[0] ?? TEST_CASINO;
      bonus = c.bonus.default;
      next.current = 10;
    } else {
      const geo = readGeo() || '';
      if (!casinos.length || (FEATURES.geoFilter && !geo)) return;
      const region = geo.split('-')[0];
      c = FEATURES.geoFilter ? casinos.find((x) => geoAllowed(x.geos, region, geo)) : casinos.find((x) => !geoExcluded(x.geos, region, geo));
      if (!c) return;
      bonus = (geo && c.bonus[geo]) || (region && c.bonus[region]) || c.bonus.default;
    }
    const cc = c;
    const geo2 = test ? '' : (readGeo() || ''); const region2 = geo2.split('-')[0];
    const offer = (geo2 && cc.offer?.[geo2]) || (region2 && cc.offer?.[region2]) || cc.offer?.default;
    setCasino({ c: cc, bonus, offer });
    const every = test ? 20 : EVERY;
    const countKey = test ? `${K_COUNT}Test` : K_COUNT;
    if (!test && Number(ss.get(countKey) || 0) >= FAST_COUNT) next.current = LATER_EVERY;

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      played.current += 1;
      if (played.current >= next.current) {
        const shown = Number(ss.get(countKey) || 0) + 1;
        ss.set(countKey, String(shown));
        next.current = played.current + (shown >= FAST_COUNT ? (test ? 40 : LATER_EVERY) : every);
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
  const { c, bonus, offer } = casino;
  const close = () => { setShow(false); if (c.slug !== 'example') track('demo_cta_dismiss', { slot: slotKey }); };
  return (
    <div className="dcp" role="dialog" aria-modal="false" aria-label={L.label} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="dcp-card">
        <button type="button" className="dcp-x" onClick={close} aria-label={L.close}>✕</button>
        {c.badge ? <span className="dcp-ribbon">{c.badge}</span> : null}
        {!c.sweeps ? <span className="dcp-eyebrow">{(intent === 'switch' && L.eyebrowSwitch ? L.eyebrowSwitch : L.eyebrow).replace('{name}', slotName)}</span> : null}
        {c.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={`dcp-logo${c.logoLight ? ' light' : ''}`} src={c.logo} alt={c.name} width={200} height={60} />
        ) : <strong className="dcp-name">{c.name}</strong>}
        <strong className="dcp-bonus">{offer ? offer.title : bonus}</strong>
        {offer?.sub ? <span className="dcp-sub">{offer.sub}</span> : null}
        {c.trust ? <span className="dcp-trust">{trustLine(c.trust)} · <a href={`/casinos#${c.slug}`} target="_blank" rel="noopener">{L.why}</a></span> : null}
        <a className="btn btn-primary dcp-go" {...(c.slug === 'example' ? { href: '#', onClick: (e: React.MouseEvent) => e.preventDefault() } : { href: `/go/${c.slug}?src=demo-cta&slot=${encodeURIComponent(slotKey)}`, target: '_blank', 'data-event': 'affiliate_click' })} rel="sponsored nofollow noopener">
          {c.cta ?? L.claim}
        </a>
        <span className="dcp-terms">{c.terms} <a href="/responsible-gambling">{L.playResponsibly}</a></span>
      </div>
    </div>
  );
}
