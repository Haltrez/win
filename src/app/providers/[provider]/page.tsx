import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCasinosForProvider, getProvider, getProviders, getSlotsByProvider, slotUrl } from '@/lib/data';
import { getCategories, getCategorySlots, isIndexable } from '@/lib/categories';
import { buildMetadata, providerDescription, providerTitle } from '@/lib/seo';
import { itemList } from '@/lib/schema';
import { fmtRtp, fmtX } from '@/lib/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SlotGrid } from '@/components/SlotCard';
import { JsonLd } from '@/components/JsonLd';
import { AffiliateDisclosure } from '@/components/Disclosure';
import { CasinoModule } from '@/components/CasinoModule';
import { FAQ } from '@/components/FAQ';

type P = { provider: string };
export const dynamicParams = false;
export function generateStaticParams(): P[] {
  return getProviders().map((p) => ({ provider: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<P> }) {
  const { provider } = await params;
  const p = getProvider(provider);
  if (!p) return {};
  const n = getSlotsByProvider(p.slug).length;
  return buildMetadata({ title: providerTitle(p, n), absoluteTitle: true, description: providerDescription(p, n), path: `/providers/${p.slug}`, noindex: n === 0 });
}

export default async function ProviderPage({ params }: { params: Promise<P> }) {
  const { provider } = await params;
  const p = getProvider(provider);
  if (!p) notFound();
  const slots = getSlotsByProvider(p.slug);
  const byRating = [...slots].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const newest = slots.slice(0, 8);
  const biggest = [...slots].sort((a, b) => b.maxWin - a.maxWin)[0];
  const avgRtp = slots.length ? slots.reduce((t, s) => t + s.rtp, 0) / slots.length : 0;
  const cats = getCategories().filter((c) => isIndexable(c) && getCategorySlots(c).some((s) => s.provider === p.slug) && c.group !== 'release').slice(0, 10);
  const faq = slots.length
    ? [
        { q: `What is the best ${p.name} slot?`, a: `Based on our reviews, ${byRating[0].name} is currently the highest-rated ${p.name} slot on ${'our site'}, scoring ${byRating[0].rating ?? '–'}/10.` },
        { q: `Which ${p.name} slot has the highest max win?`, a: `${biggest.name} has the highest max win among the ${p.name} slots we have reviewed, at ${fmtX(biggest.maxWin)} the stake.` },
        { q: `What is the average RTP of ${p.name} slots?`, a: `Across the ${slots.length} ${p.name} slots we have reviewed, the average default RTP is ${fmtRtp(avgRtp)}. Many casinos run lower RTP configurations, so check the game info screen.` },
        { q: `Is ${p.name} licensed?`, a: `${p.name} holds licences or approvals including ${p.licenses.join(', ')}.` },
      ]
    : [];
  return (
    <>
      <Breadcrumbs items={[{ name: 'Providers', path: '/providers' }, { name: p.name, path: `/providers/${p.slug}` }]} />
      <h1>{p.name} slots</h1>
      <p className="muted">{slots.length} slots reviewed{p.founded ? ` · Founded ${p.founded}` : ''}{p.headquarters ? ` · ${p.headquarters}` : ''} · Licences: {p.licenses.join(', ')}</p>
      <section className="prose"><p>{p.description}</p>
        {p.signatureMechanics?.length ? <p><strong>Signature mechanics:</strong> {p.signatureMechanics.join(', ')}.</p> : null}
      </section>
      {slots.length ? (
        <>
          <h2>Best {p.name} slots</h2>
          <SlotGrid slots={byRating.slice(0, 12)} ranked />
          <h2>Newest {p.name} releases</h2>
          <SlotGrid slots={newest} />
          <h2>All {p.name} slots</h2>
          <div className="table-wrap">
            <table className="cmp">
              <thead><tr><th>Slot</th><th>RTP</th><th>Volatility</th><th>Max win</th><th>Released</th></tr></thead>
              <tbody>{slots.map((s) => (<tr key={s.slug}><td><Link href={slotUrl(s)}>{s.name}</Link></td><td>{fmtRtp(s.rtp)}</td><td>{s.volatility}</td><td>{fmtX(s.maxWin)}</td><td>{s.releaseDate.slice(0, 4)}</td></tr>))}</tbody>
            </table>
          </div>
          <JsonLd data={itemList(`${p.name} slots`, byRating.map((s) => ({ name: s.name, path: slotUrl(s) })))} />
        </>
      ) : (
        <p className="notice">Reviews for {p.name} slots are on the way. In the meantime, browse <Link href="/best/new-slots">new releases</Link>.</p>
      )}
      {cats.length ? (<><h2>{p.name} slots by type</h2><ul className="chips">{cats.map((c) => <li key={c.slug}><Link href={`/best/${c.slug}`}>{c.title}</Link></li>)}</ul></>) : null}
      <AffiliateDisclosure />
      <CasinoModule casinos={getCasinosForProvider(p.slug)} title={`Casinos with ${p.name} slots`} context={`provider:${p.slug}`} />
      <FAQ items={faq} title={`${p.name} FAQ`} />
    </>
  );
}
