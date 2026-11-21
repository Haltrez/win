import Link from 'next/link';
import { Breadcrumbs } from '../Breadcrumbs';
import { FAQ } from '../FAQ';
import { CasinoModule } from '../CasinoModule';
import { JsonLd } from '../JsonLd';
import { TableGame } from './TableGame';
import type { CtaCasino } from '../DemoCta';
import { getCasinosFileOrder, getGuides } from '@/lib/data';
import { FEATURES, SITE } from '@/lib/config';
import { abs } from '@/lib/seo';
import { GAME_PAGES, GAME_ORDER, type GameKey } from '@/lib/table-games/pages';

/** Casinos for the table games: every casino in content/casinos.json order, trimmed to the pop-up's fields. */
export function tableGameCasinos(): CtaCasino[] {
  if (!FEATURES.realMoney) return [];
  return getCasinosFileOrder().map((c) => ({ slug: c.slug, name: c.name, geos: c.geos, bonus: c.bonus, terms: c.terms, cta: c.cta, sweeps: c.sweeps, logo: c.logo, logoLight: c.logoLight, badge: c.badge, offer: c.offer }));
}

export function TableGamePage({ game }: { game: GameKey }) {
  const g = GAME_PAGES[game];
  const path = `/table-games/${g.slug}`;
  const guides = g.guides.map((s) => getGuides().find((x) => x.slug === s)).filter(Boolean);
  const others = GAME_ORDER.filter((k) => k !== game).map((k) => GAME_PAGES[k]);
  const schema = {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: `${g.name} (free play)`, url: abs(path), description: g.description, genre: ['Casino table game', g.short], gamePlatform: 'Web browser', applicationCategory: 'Game', operatingSystem: 'Any', playMode: 'SinglePlayer', isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', description: `Free ${g.name} game` },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url }, audience: { '@type': 'PeopleAudience', suggestedMinAge: 18 },
  };
  return (
    <>
      <Breadcrumbs items={[{ name: 'Table games', path: '/table-games' }, { name: g.short, path }]} />
      <h1 className="tg-h1">{g.h1}</h1>
      <span className="tg-kicker">{g.kicker}</span>
      <TableGame game={game} casinos={tableGameCasinos()} />

      <section aria-labelledby="facts-h">
        <h2 id="facts-h">Table rules at a glance</h2>
        <dl className="tg-facts">{g.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <p className="muted">Standard casino rules and payouts. The cards are shuffled and the wheel is spun with a cryptographic random number generator – nothing is tilted either way, and over a short session anything can happen.</p>
      </section>

      <section className="prose" aria-labelledby="rules-h"><h2 id="rules-h">{g.short} rules on this table</h2>{g.rules}</section>
      <section className="prose" aria-labelledby="strat-h"><h2 id="strat-h">{g.short} strategy</h2>{g.strategy}</section>

      {guides.length ? (<section aria-labelledby="guides-h"><h2 id="guides-h">Read next</h2><ul className="inline-links">{guides.map((x) => <li key={x!.slug}><Link href={`/guides/${x!.slug}`}>{x!.title}</Link></li>)}</ul></section>) : null}

      <FAQ items={g.faq} title={`${g.short} FAQ`} />

      <CasinoModule casinos={getCasinosFileOrder()} title={`Play ${g.short.toLowerCase()} for real money`} context={`table:${g.slug}`} />

      <section aria-labelledby="more-h"><h2 id="more-h">More free table games</h2>
        <ul className="inline-links">{others.map((o) => <li key={o.slug}><Link href={`/table-games/${o.slug}`}>{o.name}</Link></li>)}<li><Link href="/table-games">All table games</Link></li></ul>
      </section>
      <p className="notice small"><span className="badge-18">18+</span> This is a free game with play money; nothing can be won or lost. Casino games are games of chance – the cards and the wheel decide every hand. <Link href="/responsible-gambling">Play responsibly</Link>.</p>
      <JsonLd data={schema} />
    </>
  );
}
