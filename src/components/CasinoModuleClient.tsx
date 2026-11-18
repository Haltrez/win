'use client';
import { useEffect, useState } from 'react';
import type { Casino } from '@/lib/types';
import { FEATURES } from '@/lib/config';
import { geoAllowed, geoExcluded } from '@/lib/geo-match';

/** Interface text; localised pages pass their own (see lib/i18n-dict.ts). */
export type CasinoLabels = { title?: string; getBonus: string; tc: string; checking: string; none: string; partners: string; disclosure: string; note: string; playResponsibly: string; code: string; copy: string; offshoreTitle: string; offshoreText: string; noPartner?: string };
const EN: CasinoLabels = {
  getBonus: 'Claim bonus', tc: '18+ | T&Cs apply', checking: 'Checking which casinos are available in your country…',
  none: "None of our casino partners accept players from your location, so we don't show offers here. You can still play every slot in free demo mode.",
  partners: 'Our partners', disclosure: 'Affiliate disclosure',
  note: "We may earn a commission from these links. Availability and bonuses depend on your country; check each casino's terms. Real-money play involves risk – you can lose your stake.",
  playResponsibly: 'Play responsibly', code: 'Code', copy: 'Copy promo code {code}',
  offshoreTitle: 'Notice: offshore casinos',
  offshoreText: "The casinos shown here are offshore operators licensed in Curaçao. They are not licensed in your country. Check your local law before playing. If you have self-excluded through a national scheme (such as Spelpaus, OASIS, RGIAJ or BetStop), these casinos do not check it – please don't play.",
  noPartner: "We don't have a licensed partner casino carrying this game yet. You can still play it in free demo mode on this page.",
};
/** Visitors from these countries see the offshore notice (our partners are not licensed there). */
// Switched off by the owner (Nov 2026). To show the notice again, list countries, e.g. ['ES', 'DE', 'SE', 'GR', 'CY'].
const OFFSHORE_COUNTRIES: string[] = [];

function readGeo(): string | null {
  const m = document.cookie.match(/(?:^|; )geo=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Geo-aware partner table. Filters to operators licensed for the visitor's country (cookie set by proxy.ts). */
export function CasinoModuleClient({ casinos, title, context, slotName, t }: { casinos: Casino[]; title: string; context: string; slotName?: string; t?: Partial<CasinoLabels> }) {
  const L = { ...EN, ...t };
  const [geo, setGeo] = useState<string | null>(null);
  const enabled = FEATURES.realMoney;
  const [ready, setReady] = useState(false);
  useEffect(() => { setGeo(readGeo()); setReady(true); }, []);
  const region = geo?.split('-')[0];
  // Offers are shown only once the visitor's country is known and a casino accepts it – never by default.
  const list = !FEATURES.geoFilter ? casinos.filter((c) => !geoExcluded(c.geos, region, geo)) : ready && geo ? casinos.filter((c) => geoAllowed(c.geos, region, geo)) : [];
  if (!enabled) return null;
  const bonusFor = (c: Casino) => (geo && c.bonus[geo]) || (region && c.bonus[region]) || c.bonus.default;
  const offerFor = (c: Casino) => (geo && c.offer?.[geo]) || (region && c.offer?.[region]) || c.offer?.default || { title: bonusFor(c) };

  return (
    <section className="casinos" aria-labelledby={`cas-${context}`}>
      <h2 id={`cas-${context}`}>{title}</h2>
      {casinos.length === 0 ? (
        <p className="muted">{L.noPartner}</p>
      ) : FEATURES.geoFilter && !ready ? (
        <p className="muted">{L.checking}</p>
      ) : list.length === 0 ? (
        <>
          <p className="muted">{geo ? L.none : "We couldn't detect your country, so we're not showing casino offers. You can still play every slot in free demo mode."}</p>
          <p className="muted small">{L.partners}: {casinos.map((c) => c.name).join(' · ')}. <a href="/affiliate-disclosure">{L.disclosure}</a></p>
        </>
      ) : (
        <>
        {region && OFFSHORE_COUNTRIES.includes(region) ? (
          <div className="notice offshore-notice" role="note"><strong>{L.offshoreTitle}</strong> {L.offshoreText}</div>
        ) : null}
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
                {c.promoCode ? <PromoCode code={c.promoCode} label={L.code} copyLabel={L.copy} /> : null}
                <a className="btn btn-primary casino-get" href={`/go/${c.slug}?src=${encodeURIComponent(context)}&pos=${i + 1}`} rel="sponsored nofollow noopener" target="_blank" data-event="affiliate_click">
                  {L.getBonus}
                </a>
                <p className="casino-tc">{L.tc}</p>
              </li>
            );
          })}
        </ol>
        </>
      )}
      <p className="muted small">
        {L.note} <a href="/responsible-gambling">{L.playResponsibly}</a>.
        {casinos.some((c) => c.placeholder) ? ' [Placeholder partners – replace in content/casinos.json before launch.]' : ''}
      </p>
    </section>
  );
}

/** Promo code with one-tap copy (falls back to plain text if the clipboard isn't available). */
function PromoCode({ code, label, copyLabel }: { code: string; label: string; copyLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="casino-code"
      aria-label={copyLabel.replace('{code}', code)}
      onClick={() => {
        try { navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); } catch {}
      }}
    >
      {label}: <strong>{code}</strong> <span aria-hidden>{copied ? '✓' : '⧉'}</span>
    </button>
  );
}
