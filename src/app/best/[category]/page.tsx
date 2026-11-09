import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategories, getCategory, getCategorySlots, isIndexable } from '@/lib/categories';
import { getCasinos, getGuide, getProvider, slotUrl } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { itemList } from '@/lib/schema';
import { fmtRtp, fmtX, VOLATILITY_LABEL } from '@/lib/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SlotGrid } from '@/components/SlotCard';
import { JsonLd } from '@/components/JsonLd';
import { FAQ } from '@/components/FAQ';
import { AffiliateDisclosure } from '@/components/Disclosure';
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
  const guides = (c.relatedGuides ?? []).map(getGuide).filter(Boolean);
  const providers = [...new Set(top.map((s) => s.provider))].slice(0, 8);
  return (
    <>
      <Breadcrumbs items={[{ name: 'Best slots', path: '/best' }, { name: c.title, path: `/best/${c.slug}` }]} />
      <h1>{c.title}</h1>
      <section className="prose"><p>{c.intro}</p>
        <p className="muted small">{slots.length} slots match this list. Rankings use our editorial review score and the published game data; they are not paid placements.</p>
      </section>

      {slots.length === 0 ? <p className="notice">No slots match this list yet – we add new reviews every week.</p> : (
        <>
          <SlotGrid slots={top.slice(0, 12)} ranked />
          <h2>Full comparison</h2>
          <div className="table-wrap">
            <table className="cmp">
              <thead><tr><th>#</th><th>Slot</th><th>Provider</th><th>RTP</th><th>Volatility</th><th>Max win</th></tr></thead>
              <tbody>
                {top.map((s, i) => (
                  <tr key={s.slug}><td>{i + 1}</td><td><Link href={slotUrl(s)}>{s.name}</Link></td><td><Link href={`/providers/${s.provider}`}>{getProvider(s.provider)?.name}</Link></td><td>{fmtRtp(s.rtp)}</td><td>{VOLATILITY_LABEL[s.volatility]}</td><td>{fmtX(s.maxWin)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2>Our top picks explained</h2>
          {top.slice(0, 5).map((s, i) => (
            <section key={s.slug} className="prose">
              <h3>{i + 1}. <Link href={slotUrl(s)}>{s.name}</Link> – {getProvider(s.provider)?.name}</h3>
              <p>{s.review.split('\n')[0]}</p>
              <p className="muted small">{fmtRtp(s.rtp)} RTP · {VOLATILITY_LABEL[s.volatility]} volatility · {fmtX(s.maxWin)} max win</p>
            </section>
          ))}
          <JsonLd data={itemList(c.title, top.map((s) => ({ name: s.name, path: slotUrl(s) })))} />
        </>
      )}

      <AffiliateDisclosure />
      <CasinoModule casinos={getCasinos()} title="Where to play these slots" context={`best:${c.slug}`} />

      {guides.length ? (<><h2>Learn more</h2><ul>{guides.map((g) => <li key={g!.slug}><Link href={`/guides/${g!.slug}`}>{g!.title}</Link></li>)}</ul></>) : null}
      {providers.length ? (<><h2>Providers in this list</h2><ul className="chips">{providers.map((p) => <li key={p}><Link href={`/providers/${p}`}>{getProvider(p)?.name}</Link></li>)}</ul></>) : null}
      {siblings.length ? (<><h2>Related lists</h2><ul className="chips">{siblings.map((x) => <li key={x.slug}><Link href={`/best/${x.slug}`}>{x.title}</Link></li>)}</ul></>) : null}
      <FAQ items={c.faq ?? []} />
    </>
  );
}
