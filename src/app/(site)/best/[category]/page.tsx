import Link from 'next/link';
import { insightFaq, insightSentences, listInsights } from '@/lib/insights';

import { notFound } from 'next/navigation';
import { getCategories, getCategory, getCategorySlots, isIndexable } from '@/lib/categories';
import { listLanguages } from '@/lib/i18n-lists';
import { getCasinos, getGuide, getGuides, getProvider, slotUrl } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { itemList } from '@/lib/schema';
import { fmtRtp, fmtX, volLabel } from '@/lib/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SlotGrid } from '@/components/SlotCard';
import { JsonLd } from '@/components/JsonLd';
import { FAQ } from '@/components/FAQ';
import { CasinoModule } from '@/components/CasinoModule';

type P = { category: string };
export const dynamicParams = false;
export function generateStaticParams(): P[] {
  return getCategories().map((c) => ({ category: c.slug }));
}
export async function generateMetadata({ params }: { params: Promise<P> }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return {};
  const langs = listLanguages(c.slug);
  return buildMetadata({ title: c.metaTitle, description: c.metaDescription, path: `/best/${c.slug}`, noindex: !isIndexable(c), ...(Object.keys(langs).length > 2 ? { languages: langs } : {}) });
}

export default async function CategoryPage({ params }: { params: Promise<P> }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  const slots = getCategorySlots(c);
  const top = slots.slice(0, 50);
  const siblings = getCategories().filter((x) => x.group === c.group && x.slug !== c.slug && isIndexable(x)).slice(0, 12);
  // Hand-picked guides first, then any guide that names this list in its relatedCategories.
  const guides = [...new Set([...(c.relatedGuides ?? []), ...getGuides().filter((g) => g.relatedCategories?.includes(c.slug)).map((g) => g.slug)])]
    .map(getGuide).filter(Boolean).slice(0, 6);
  const providers = [...new Set(top.map((s) => s.provider))].slice(0, 8);
  const noun = c.title.replace(/\s*\d{4}$/, '').replace(/^Best\s+/, '').replace(/^(Slots?)\b/, (m) => m.toLowerCase());
  const KEEP = new Set(['Megaways', 'Egyptian', 'Irish', 'Asian-Themed', 'Wild', 'West', 'RTP']);
  const nounLc = noun.split(' ').map((w) => (/^\(?[A-Z][a-z]+(-[A-Za-z]+)?[,)]?$/.test(w) && !KEEP.has(w.replace(/[(,)]/g, '')) ? w.toLowerCase() : w)).join(' ');
  const one = /^slots\b/.test(nounLc) ? nounLc.replace(/^slots/, 'slot') : nounLc.replace(/slots\b/, 'slot');
  const ins = listInsights(slots);
  const facts = insightSentences(ins, nounLc);
  // Bonus buy list: extra answers for "best RTP bonus buy slots" and "free bonus buy slots" searches.
  const isBuy = c.slug === 'bonus-buy-slots';
  const bestRtpBuys = isBuy ? [...slots].filter((s) => s.rtp != null && s.rtpSource !== 'third-party').sort((a, b) => b.rtp! - a.rtp!).slice(0, 10) : [];
  const buyFaq = isBuy ? [
    { q: 'Can I play bonus buy slots for free?', a: `Yes. Every slot in this list has a free demo, and most official demos include the bonus buy button, so you can buy the feature with play money and see what it pays. No sign-up or deposit is needed.` },
    ...(bestRtpBuys.length ? [{ q: 'Which bonus buy slots have the best RTP?', a: `By published RTP, the highest in our list are ${bestRtpBuys.slice(0, 3).map((s) => `${s.name} (${fmtRtp(s.rtp)})`).join(', ')}. Casinos can run lower RTP versions, so check the game's info screen.` }] : []),
  ] : [];
  const faq = [...(c.faq ?? []), ...buyFaq, ...insightFaq(ins, nounLc, one)].filter((f, i, a) => a.findIndex((x) => x.q === f.q) === i);
  return (
    <>
      <Breadcrumbs items={[{ name: 'Best slots', path: '/best' }, { name: c.title, path: `/best/${c.slug}` }]} />
      <h1>{c.title}</h1>
      <section className="prose"><p>{c.intro}</p>
        <p className="muted small">{slots.length} slots match this list. Rankings use our editorial review score and the published game data; they are not paid placements.</p>
      </section>

      {slots.length === 0 ? <p className="notice">No slots match this list yet – we add new reviews every week.</p> : (
        <>
          <h2 className="sr-only">Top {Math.min(12, top.length)} picks</h2>
          <SlotGrid slots={top.slice(0, 12)} ranked />
          {facts.length ? <section className="facts-box"><h3>At a glance</h3><p>{facts.join(' ')}</p></section> : null}
          <h2>Full comparison</h2>
          <div className="table-wrap">
            <table className="cmp">
              <thead><tr><th>#</th><th>Slot</th><th>Provider</th><th>RTP</th><th>Volatility</th><th>Max win</th></tr></thead>
              <tbody>
                {top.map((s, i) => (
                  <tr key={s.slug}><td>{i + 1}</td><td><Link href={slotUrl(s)}>{s.name}</Link></td><td><Link href={`/providers/${s.provider}`}>{getProvider(s.provider)?.name}</Link></td><td>{fmtRtp(s.rtp)}</td><td>{volLabel(s.volatility)}</td><td>{fmtX(s.maxWin)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {isBuy ? (
            <>
              <h2>How to play bonus buy slots for free</h2>
              <section className="prose">
                <ol>
                  <li>Pick any slot from the list above and open its page – every game here has a free demo.</li>
                  <li>Start the demo. You get a play-money balance; no sign-up, no deposit.</li>
                  <li>Press the game&apos;s <strong>Buy bonus</strong> (or <strong>Buy feature</strong>) button. The price is shown as a multiple of your stake, often 100x.</li>
                  <li>Repeat a few times. The bought bonus pays very differently from round to round – the demo shows you how often it pays back its price, without risking real money.</li>
                </ol>
                <p>Bonus buys are not offered in every market (they are banned in Great Britain, for example), and buying the bonus doesn&apos;t improve your long-term RTP. <Link href="/guides/bonus-buy-explained">How bonus buys work</Link> · <Link href="/guides/bonus-buy-vs-natural-bonus">Bonus buy vs natural bonus</Link></p>
              </section>
              {bestRtpBuys.length ? (
                <>
                  <h2>Best RTP bonus buy slots</h2>
                  <p className="muted small">Highest provider-published default RTP among the bonus buy slots we list.</p>
                  <div className="table-wrap">
                    <table className="cmp">
                      <thead><tr><th>#</th><th>Slot</th><th>Provider</th><th>RTP</th><th>Max win</th></tr></thead>
                      <tbody>
                        {bestRtpBuys.map((s, i) => (
                          <tr key={s.slug}><td>{i + 1}</td><td><Link href={slotUrl(s)}>{s.name}</Link></td><td><Link href={`/providers/${s.provider}`}>{getProvider(s.provider)?.name}</Link></td><td>{fmtRtp(s.rtp)}</td><td>{fmtX(s.maxWin)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </>
          ) : null}
          <h2>Our top picks explained</h2>
          {top.slice(0, 5).map((s, i) => (
            <section key={s.slug} className="prose">
              <h3>{i + 1}. <Link href={slotUrl(s)}>{s.name}</Link> – {getProvider(s.provider)?.name}</h3>
              <p>{s.review.split('\n')[0]}</p>
              <p className="muted small">{[s.rtp != null ? `${fmtRtp(s.rtp)} RTP` : null, s.volatility ? `${volLabel(s.volatility)} volatility` : null, s.maxWin ? `${fmtX(s.maxWin)} max win` : null].filter(Boolean).join(' · ')}</p>
            </section>
          ))}
          <JsonLd data={itemList(c.title, top.map((s) => ({ name: s.name, path: slotUrl(s) })))} />
        </>
      )}

      <CasinoModule casinos={getCasinos()} title="Where to play these slots" context={`best:${c.slug}`} />

      {guides.length || providers.length || siblings.length ? (
        <>
          <h2>Explore more</h2>
          <div className="link-groups">
            {siblings.length ? <section><h3>Related lists</h3><ul className="inline-links">{siblings.slice(0, 8).map((x) => <li key={x.slug}><Link href={`/best/${x.slug}`}>{x.title.replace(/\s+\d{4}$/, '')}</Link></li>)}</ul></section> : null}
            {providers.length ? <section><h3>Providers in this list</h3><ul className="inline-links">{providers.map((p) => <li key={p}><Link href={`/providers/${p}`}>{getProvider(p)?.name}</Link></li>)}</ul></section> : null}
            {guides.length ? <section><h3>Guides</h3><ul className="inline-links">{guides.map((g) => <li key={g!.slug}><Link href={`/guides/${g!.slug}`}>{g!.title.split(/[:(]/)[0].trim()}</Link></li>)}</ul></section> : null}
          </div>
        </>
      ) : null}
      <FAQ items={faq} />
    </>
  );
}
