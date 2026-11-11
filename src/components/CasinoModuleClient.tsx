'use client';
import { useEffect, useState } from 'react';
import type { Casino } from '@/lib/types';
import { FEATURES } from '@/lib/config';

function readGeo(): string | null {
  const m = document.cookie.match(/(?:^|; )geo=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Geo-aware partner table. Filters to operators licensed for the visitor's country (cookie set by proxy.ts). */
export function CasinoModuleClient({ casinos, title, context, slotName }: { casinos: Casino[]; title: string; context: string; slotName?: string }) {
  const [geo, setGeo] = useState<string | null>(null);
  const enabled = FEATURES.realMoney;
  const [ready, setReady] = useState(false);
  useEffect(() => { setGeo(readGeo()); setReady(true); }, []);
  const region = geo?.split('-')[0];
  // Offers are shown only once the visitor's country is known and a casino accepts it – never by default.
  const list = ready && geo ? casinos.filter((c) => c.geos.includes(geo) || (region && c.geos.includes(region))) : [];
  if (!enabled) return null;
  const bonusFor = (c: Casino) => (geo && c.bonus[geo]) || (region && c.bonus[region]) || c.bonus.default;

  return (
    <section className="casinos" aria-labelledby={`cas-${context}`}>
      <h2 id={`cas-${context}`}>{title}</h2>
      {casinos.length === 0 ? (
        <p className="muted">We don&apos;t have a licensed partner casino carrying this game yet. You can still play it in free demo mode on this page.</p>
      ) : !ready ? (
        <p className="muted">Checking which casinos are available in your country…</p>
      ) : list.length === 0 ? (
        <p className="muted">{geo ? "We don't currently list a casino for your location." : "We couldn't detect your country, so we're not showing casino offers."} You can still play every slot in free demo mode.</p>
      ) : (
        <ol className="casino-list">
          {list.map((c, i) => (
            <li key={c.slug} className="casino-row">
              <div className="casino-name">
                <span className="rank">{i + 1}</span>
                <div>
                  {c.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="casino-logo" src={c.logo} alt={`${c.name} logo`} width={120} height={32} loading="lazy" />
                  ) : null}
                  <strong>{c.name}</strong>
                  <div className="muted small">{c.licenses.join(' · ')}</div>
                </div>
              </div>
              <div className="casino-bonus">
                <div>{bonusFor(c)}</div>
                <div className="tcs">{c.terms}</div>
              </div>
              <div className="casino-cta">
                <a className="btn btn-primary" href={`/go/${c.slug}?src=${encodeURIComponent(context)}&pos=${i + 1}`} rel="sponsored nofollow noopener" target="_blank" data-event="affiliate_click">
                  {slotName ? `Play ${slotName} for real` : 'Visit casino'}
                </a>
                {c.rating ? <span className="muted small">Score {c.rating.toFixed(1)}/10</span> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="muted small">
        18+. Offers and availability depend on your location. Real-money play involves risk – you can lose your stake. Set limits before you play.
        {casinos.some((c) => c.placeholder) ? ' [Placeholder partners – replace in content/casinos.json before launch.]' : ''}
      </p>
    </section>
  );
}
