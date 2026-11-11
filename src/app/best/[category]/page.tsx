import Link from 'next/link';
import { insightFaq, insightSentences, listInsights } from '@/lib/insights';

import { notFound } from 'next/navigation';
import { getCategories, getCategory, getCategorySlots, isIndexable } from '@/lib/categories';
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
  return buildMetadata({ title: c.metaTitle, description: c.metaDescription, path: `/best/${c.slug}`, noindex: !isIndexable(c) });
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
  const faq = [...(c.faq ?? []), ...insightFaq(ins, nounLc, one)].filter((f, i, a) => a.findIndex((x) => x.q === f.q) === i);
  return (
    <>
      <Breadcrumbs items={[{ name: 'Best slots', path: '/best' }, { name: c.title, path: `/best/${c.slug}` }]} />
      <h1>{c.title}</h1>
      <section className="prose"><p>{c.intro}</p>
        {facts.length ? <p>{facts.join(' ')}</p> : null}
        <p className="muted small">{slots.length} slots match this list. Rankings use our editorial review score and the published game data; they are not paid placements.</p>
      </section>

      {slots.length === 0 ? <p className="notice">No slots match this list yet – we add new reviews every week.</p> : (
        <>
          <h2 className="sr-only">Top {Math.min(12, top.length)} picks</h2>
          <SlotGrid slots={top.slice(0, 12)} ranked />
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
