'use client';
import { useEffect, useRef, useState } from 'react';
import { track } from '../Analytics';
import { FEATURES } from '@/lib/config';
import { geoAllowed, geoExcluded } from '@/lib/geo-match';
import { isCtaTest, type CtaCasino } from '../DemoCta';

const HOT_STREAK = 3;          // wins in a row
const HOT_BALANCE = 1.3;       // balance ≥ 130% of what the session started with
const GAME_NAME: Record<string, string> = { blackjack: 'blackjack', roulette: 'roulette', baccarat: 'baccarat', 'video-poker': 'video poker', 'casino-holdem': "Casino Hold'em" };
const FALLBACK_AFTER = 120;    // seconds of visible play before the timed prompt (only if no streak prompt yet)
const MIN_GAP = 180;           // seconds between prompts
const K_LAST = 'tgCtaLast';

const ss = { get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } } };
const readGeo = () => { const m = document.cookie.match(/(?:^|; )geo=([^;]+)/); return m ? decodeURIComponent(m[1]) : null; };

/**
 * "Test your luck for real" prompt over a table game. Shows on a hot streak (3 wins in a row, or the balance up 30%+
 * since the page opened) or, failing that, once after ~2 minutes of play. At most one prompt per 3 minutes, closable,
 * and it never blocks the table (the backdrop lets clicks through). Same casino selection and geo rules as the slot
 * demo pop-up; sweepstakes brands keep their own button text and no "bonus" wording.
 */
export function TableCta({ casinos, game, streak, balance, sessionStart, hands }: { casinos: CtaCasino[]; game: string; streak: number; balance: number; sessionStart: number; hands: number }) {
  const [pick, setPick] = useState<{ c: CtaCasino; title: string; sub?: string } | null>(null);
  const [show, setShow] = useState(false);
  const played = useRef(0);
  const shownAny = useRef(false);
  const lastShown = useRef<number>(Number(ss.get(K_LAST) || 0));

  useEffect(() => {
    if (!FEATURES.realMoney || !casinos.length) return;
    const geo = readGeo() || '';
    if (FEATURES.geoFilter && !geo) return;
    const region = geo.split('-')[0];
    const c = FEATURES.geoFilter ? casinos.find((x) => geoAllowed(x.geos, region, geo)) : casinos.find((x) => !geoExcluded(x.geos, region, geo));
    if (!c) return;
    const offer = (geo && c.offer?.[geo]) || (region && c.offer?.[region]) || c.offer?.default;
    const bonus = (geo && c.bonus[geo]) || (region && c.bonus[region]) || c.bonus.default;
    setPick({ c, title: offer?.title ?? bonus, sub: offer?.sub });
  }, [casinos]);

  /** ?cta-test in the URL (same switch as the slot pop-up): timed prompt after 5 s, one per 10 s. Never for normal visitors. */
  const test = typeof window !== 'undefined' && isCtaTest();
  const open = (why: string) => {
    const now = Date.now() / 1000;
    if (now - lastShown.current < (test ? 10 : MIN_GAP)) return;
    lastShown.current = now; ss.set(K_LAST, String(now)); shownAny.current = true;
    setShow(true);
    if (pick) track('demo_cta_view', { slot: `table-${game}`, casino: pick.c.slug, why });
  };

  // (a) hot streak
  useEffect(() => {
    if (!pick || hands === 0) return;
    if (streak >= HOT_STREAK || (balance >= sessionStart * HOT_BALANCE && balance > sessionStart)) open(streak >= HOT_STREAK ? 'streak' : 'up');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak, balance, hands, pick]);

  // (b) timed fallback after ~120 s of visible play, once, only if nothing has shown yet
  useEffect(() => {
    if (!pick) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || hands === 0) return;
      played.current += 1;
      if (played.current >= (test ? 5 : FALLBACK_AFTER) && !shownAny.current) open('timer');
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick, hands > 0]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShow(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show]);

  if (!pick || !show) return null;
  const { c, title, sub } = pick;
  const close = () => { setShow(false); track('demo_cta_dismiss', { slot: `table-${game}` }); };
  return (
    <div className="dcp tg-dcp" role="dialog" aria-modal="false" aria-label={c.sweeps ? 'Play for free offer' : 'Real-money offer'}>
      <div className="dcp-card">
        <button type="button" className="dcp-x" onClick={close} aria-label="Close offer">✕</button>
        {c.badge ? <span className="dcp-ribbon">{c.badge}</span> : null}
        <span className="dcp-eyebrow">{c.sweeps ? `Play ${GAME_NAME[game] ?? game} for free at ${c.name}` : `Play ${GAME_NAME[game] ?? game} at ${c.name}`}</span>
        {c.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={`dcp-logo${c.logoLight ? ' light' : ''}`} src={c.logo} alt={c.name} width={200} height={60} />
        ) : <strong className="dcp-name">{c.name}</strong>}
        <strong className="dcp-bonus">{title}</strong>
        {sub ? <span className="dcp-sub">{sub}</span> : null}
        <a className="btn btn-primary dcp-go" href={`/go/${c.slug}?src=table-${game}`} target="_blank" rel="sponsored nofollow noopener" data-event="affiliate_click">{c.cta ?? 'Claim now'}</a>
        <span className="dcp-terms">{c.terms} <a href="/responsible-gambling">Play responsibly</a></span>
        <button type="button" className="dcp-keep" onClick={close}>Keep playing for free</button>
      </div>
    </div>
  );
}
