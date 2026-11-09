'use client';
import { useEffect, useState } from 'react';
import type { Casino } from '@/lib/types';

function readGeo(): string | null {
  const m = document.cookie.match(/(?:^|; )geo=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Geo-aware partner table. Filters to operators licensed for the visitor's country (cookie set by proxy.ts). */
export function CasinoModule({ casinos, title, context, slotName }: { casinos: Casino[]; title: string; context: string; slotName?: string }) {
  const [geo, setGeo] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setGeo(readGeo()); setReady(true); }, []);
  const region = geo?.split('-')[0];
  const list = !ready || !geo ? casinos : casinos.filter((c) => c.geos.includes(geo) || (region && c.geos.includes(region)));
  const bonusFor = (c: Casino) => (geo && c.bonus[geo]) || (region && c.bonus[region]) || c.bonus.default;

  return (
    <section className="casinos" aria-labelledby={`cas-${context}`}>
      <h2 id={`cas-${context}`}>{title}</h2>
      {ready && geo && list.length === 0 ? (
        <p className="muted">We don&apos;t currently list licensed casinos for your location. You can still play every slot in free demo mode.</p>
      ) : (
        <ol className="casino-list">
          {list.map((c, i) => (
            <li key={c.slug} className="casino-row">
              <div className="casino-name">
                <span className="rank">{i + 1}</span>
                <div>
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
                <span className="muted small">Score {c.rating.toFixed(1)}/10</span>
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
