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
  const list = !FEATURES.geoFilter ? casinos : ready && geo ? casinos.filter((c) => c.geos.includes(geo) || (region && c.geos.includes(region))) : [];
  if (!enabled) return null;
  const bonusFor = (c: Casino) => (geo && c.bonus[geo]) || (region && c.bonus[region]) || c.bonus.default;
  const offerFor = (c: Casino) => (geo && c.offer?.[geo]) || (region && c.offer?.[region]) || c.offer?.default || { title: bonusFor(c) };

  return (
    <section className="casinos" aria-labelledby={`cas-${context}`}>
      <h2 id={`cas-${context}`}>{title}</h2>
      {casinos.length === 0 ? (
        <p className="muted">We don&apos;t have a licensed partner casino carrying this game yet. You can still play it in free demo mode on this page.</p>
      ) : FEATURES.geoFilter && !ready ? (
        <p className="muted">Checking which casinos are available in your country…</p>
      ) : list.length === 0 ? (
        <>
          <p className="muted">{geo ? "None of our casino partners accept players from your location, so we don't show offers here." : "We couldn't detect your country, so we're not showing casino offers."} You can still play every slot in free demo mode.</p>
          <p className="muted small">Our partners: {casinos.map((c) => c.name).join(' · ')}. <a href="/affiliate-disclosure">Affiliate disclosure</a></p>
        </>
      ) : (
        <ol className="casino-grid">
          {list.map((c, i) => {
            const o = offerFor(c);
            return (
              <li key={c.slug} className="casino-tile">
                {c.badge ? <span className="casino-ribbon">{c.badge}</span> : null}
                <div className={`casino-tile-logo${c.logoLight ? ' light' : ''}`}>
                  {c.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logo} alt={`${c.name} logo`} width={160} height={48} />
                  ) : <strong>{c.name}</strong>}
                </div>
                <p className="casino-offer">{o.title}</p>
                {o.sub ? <p className="casino-offer-sub">{o.sub}</p> : null}
                <a className="btn btn-primary casino-get" href={`/go/${c.slug}?src=${encodeURIComponent(context)}&pos=${i + 1}`} rel="sponsored nofollow noopener" target="_blank" data-event="affiliate_click">
                  Get bonus
                </a>
                <p className="casino-tc">18+ | T&amp;Cs apply</p>
              </li>
            );
          })}
        </ol>
      )}
      <p className="muted small">
        Casino availability and bonuses depend on your country; check each casino&apos;s terms. Real-money play involves risk – you can lose your stake. <a href="/responsible-gambling">Play responsibly</a>.
        {casinos.some((c) => c.placeholder) ? ' [Placeholder partners – replace in content/casinos.json before launch.]' : ''}
      </p>
    </section>
  );
}
