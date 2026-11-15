import Link from 'next/link';
import { ProviderLogo } from '@/components/ProviderLogo';
import { insightFaq, insightSentences, listInsights } from '@/lib/insights';
import { notFound } from 'next/navigation';
import { getCasinosForProvider, getGuides, getProvider, getProviders, getSlotsByProvider, slotUrl } from '@/lib/data';
import { getCategories, getCategorySlots, isIndexable } from '@/lib/categories';
import { buildMetadata, providerDescription, providerTitle } from '@/lib/seo';
import { itemList } from '@/lib/schema';
import { fmtRtp, fmtX, volLabel, year } from '@/lib/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SlotGrid } from '@/components/SlotCard';
import { JsonLd } from '@/components/JsonLd';
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
  const rated = byRating.filter((s) => s.rating);
  const topMaxWin = [...slots].filter((s) => s.maxWin).sort((a, b) => b.maxWin! - a.maxWin!).slice(0, 8);
  const newest = slots.slice(0, 8);
  const biggest = [...slots].filter((s) => s.maxWin).sort((a, b) => b.maxWin! - a.maxWin!)[0];
  const withRtp = slots.filter((s) => s.rtp != null);
  const avgRtp = withRtp.length ? withRtp.reduce((t, s) => t + s.rtp!, 0) / withRtp.length : 0;
  const cats = getCategories().filter((c) => isIndexable(c) && getCategorySlots(c).some((s) => s.provider === p.slug) && c.group !== 'release').slice(0, 10);
  // Guides that link to this provider or its games, most references first.
  const guides = getGuides()
    .map((g) => ({ g, n: (g.html.match(new RegExp(`/providers/${p.slug}"|/slots/${p.slug}/`, 'g')) || []).length }))
    .filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 6).map((x) => x.g);
  const faq = slots.length
    ? [
        { q: `What is the best ${p.name} slot?`, a: rated[0] ? `Based on our reviews, ${rated[0].name} is currently the highest-rated ${p.name} slot on our site, scoring ${rated[0].rating}/10.` : `We haven't scored ${p.name} slots yet. Popular picks include ${byRating.slice(0, 3).map((s) => s.name).join(', ')} – try them in demo and compare their RTP, volatility and max win below.` },
        ...(biggest ? [{ q: `Which ${p.name} slot has the highest max win?`, a: `${biggest.name} has the highest published max win among the ${p.name} slots we have reviewed, at ${fmtX(biggest.maxWin)} the stake.` }] : []),
        { q: `What is the average RTP of ${p.name} slots?`, a: `Across the ${withRtp.length} ${p.name} slots we list with a published RTP, the average default RTP is ${fmtRtp(avgRtp)}. Many casinos run lower RTP configurations, so check the game info screen.` },
        { q: `Is ${p.name} licensed?`, a: `${p.name} holds licences or approvals including ${p.licenses.join(', ')}.` },
      ]
    : [];
  const ins = listInsights(slots);
  const facts = insightSentences(ins, `${p.name} slots`, { showProviders: false });
  for (const f of insightFaq(ins, `${p.name} slots`, `${p.name} slot`)) if (!/biggest max win|provider makes/.test(f.q)) faq.push(f);
  return (
    <>
      <Breadcrumbs items={[{ name: 'Providers', path: '/providers' }, { name: p.name, path: `/providers/${p.slug}` }]} />
      <div className="provider-head">
        <ProviderLogo p={p} size="md" />
        <h1>{p.name} demo slots</h1>
      </div>
      <p className="muted">{slots.length} slots reviewed{p.founded ? ` · Founded ${p.founded}` : ''}{p.headquarters ? ` · ${p.headquarters}` : ''} · Licences: {p.licenses.join(', ')}</p>
      <section className="prose"><p>{p.description}</p>
        {p.signatureMechanics?.length ? <p><strong>Signature mechanics:</strong> {p.signatureMechanics.join(', ')}.</p> : null}
        {facts.length ? <><h2>{p.name} slots at a glance</h2><p>{facts.join(' ')}</p></> : null}
      </section>
      {slots.length ? (
        <>
          {rated.length >= 3 ? (
            <>
              <h2>Best {p.name} slots</h2>
              <p className="muted small">Ranked by our editorial score.</p>
              <SlotGrid slots={rated.slice(0, 12)} ranked />
            </>
          ) : null}
          {topMaxWin.length ? (
            <>
              <h2>{p.name} slots with the biggest max wins</h2>
              <SlotGrid slots={topMaxWin} />
            </>
          ) : null}
          <h2>Newest {p.name} releases</h2>
          <SlotGrid slots={newest} />
          <h2>All {p.name} slots</h2>
          <div className="table-wrap">
            <table className="cmp">
              <thead><tr><th>Slot</th><th>RTP</th><th>Volatility</th><th>Max win</th><th>Released</th></tr></thead>
              <tbody>{slots.map((s) => (<tr key={s.slug}><td><Link href={slotUrl(s)}>{s.name}</Link></td><td>{fmtRtp(s.rtp)}</td><td>{volLabel(s.volatility)}</td><td>{fmtX(s.maxWin)}</td><td>{year(s.releaseDate) || '–'}</td></tr>))}</tbody>
            </table>
          </div>
          <JsonLd data={itemList(`${p.name} slots`, byRating.map((s) => ({ name: s.name, path: slotUrl(s) })))} />
        </>
      ) : (
        <p className="notice">Reviews for {p.name} slots are on the way. In the meantime, browse <Link href="/best/new-slots">new releases</Link>.</p>
      )}
      {guides.length ? (<><h2>Guides featuring {p.name}</h2><ul className="inline-links">{guides.map((g) => <li key={g.slug}><Link href={`/guides/${g.slug}`}>{g.title.split(/[:(]/)[0].trim()}</Link></li>)}</ul></>) : null}
      {cats.length ? (<><h2>{p.name} slots by type</h2><ul className="inline-links">{cats.map((c) => <li key={c.slug}><Link href={`/best/${c.slug}`}>{c.title.replace(/\s+\d{4}$/, '')}</Link></li>)}</ul></>) : null}
      <CasinoModule casinos={getCasinosForProvider(p.slug)} title={`Casinos with ${p.name} slots`} context={`provider:${p.slug}`} />
      <FAQ items={faq} title={`${p.name} FAQ`} />
    </>
  );
}
