import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCasinos, getComparisons, getProvider, slotUrl } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { fmtRelease, fmtRtp, fmtX, volLabel, volScore } from '@/lib/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FAQ } from '@/components/FAQ';
import { SlotGrid } from '@/components/SlotCard';
import { CasinoModule } from '@/components/CasinoModule';

type P = { pair: string };
export const dynamicParams = false;
export function generateStaticParams(): P[] { return getComparisons().map((c) => ({ pair: c.slug })); }
export async function generateMetadata({ params }: { params: Promise<P> }) {
  const { pair } = await params;
  const c = getComparisons().find((x) => x.slug === pair);
  if (!c) return {};
  return buildMetadata({
    title: [`${c.a.name} vs ${c.b.name} – RTP, Volatility & Max Win Compared`, `${c.a.name} vs ${c.b.name} – RTP & Max Win Compared`, `${c.a.name} vs ${c.b.name}: Which Slot Is Better?`, `${c.a.name} vs ${c.b.name} Slot Comparison`, `${c.a.name} vs ${c.b.name}`],
    description: `${c.a.name} (${c.a.rtp != null ? `${fmtRtp(c.a.rtp)}, ` : ''}${fmtX(c.a.maxWin)}) vs ${c.b.name} (${c.b.rtp != null ? `${fmtRtp(c.b.rtp)}, ` : ''}${fmtX(c.b.maxWin)}): features, volatility and which slot suits you. Free demos of both.`,
    path: `/compare/${c.slug}`,
  });
}

export default async function ComparePage({ params }: { params: Promise<P> }) {
  const { pair } = await params;
  const c = getComparisons().find((x) => x.slug === pair);
  if (!c) notFound();
  const { a, b } = c;
  const rows: [string, string, string][] = [
    ['Provider', getProvider(a.provider)!.name, getProvider(b.provider)!.name],
    ['RTP', fmtRtp(a.rtp), fmtRtp(b.rtp)],
    ['Volatility', volLabel(a.volatility), volLabel(b.volatility)],
    ['Max win', fmtX(a.maxWin), fmtX(b.maxWin)],
    ['Layout', a.reels ?? '–', b.reels ?? '–'],
    ['Paylines / ways', a.paylines ?? a.winType ?? '–', b.paylines ?? b.winType ?? '–'],
    ['Release date', fmtRelease(a), fmtRelease(b)],
    ['Bonus buy', a.mechanics.includes('bonus-buy') ? 'Yes' : 'No', b.mechanics.includes('bonus-buy') ? 'Yes' : 'No'],
    ['Our score', a.rating ? `${a.rating}/10` : '–', b.rating ? `${b.rating}/10` : '–'],
  ];
  const higherRtp = a.rtp == null || b.rtp == null || a.rtp === b.rtp ? null : a.rtp > b.rtp ? a : b;
  const swingier = !a.volatility || !b.volatility || volScore(a.volatility) === volScore(b.volatility) ? null : volScore(a.volatility) > volScore(b.volatility) ? a : b;
  const bigger = a.maxWin == null || b.maxWin == null || a.maxWin === b.maxWin ? null : a.maxWin > b.maxWin ? a : b;
  const verdict = [
    higherRtp ? `${higherRtp.name} has the higher default RTP (${fmtRtp(higherRtp.rtp)}), though the gap matters only over very long play.` : a.rtp == null || b.rtp == null ? 'An RTP comparison is not possible because one of the games has no published RTP.' : 'Both games share the same default RTP.',
    swingier ? `${swingier.name} is the more volatile game – expect bigger swings and longer dry spells.` : 'Both are rated with the same volatility.',
    bigger ? `${bigger.name} offers the bigger max win at ${fmtX(bigger.maxWin)}.` : 'Both share the same max win cap.',
  ];
  return (
    <>
      <Breadcrumbs items={[{ name: 'Compare', path: '/compare' }, { name: `${a.name} vs ${b.name}`, path: `/compare/${c.slug}` }]} />
      <h1>{a.name} vs {b.name}</h1>
      <div className="table-wrap">
        <table className="cmp">
          <thead><tr><th></th><th><Link href={slotUrl(a)}>{a.name}</Link></th><th><Link href={slotUrl(b)}>{b.name}</Link></th></tr></thead>
          <tbody>{rows.map(([k, x, y]) => <tr key={k}><th scope="row">{k}</th><td>{x}</td><td>{y}</td></tr>)}</tbody>
        </table>
      </div>
      <section className="prose">
        <h2>Verdict</h2>
        <ul>{verdict.map((v) => <li key={v}>{v}</li>)}</ul>
        <p>Neither game is &quot;better&quot; in terms of your chances – choose the one whose features and volatility fit how you like to play, and try both demos first.</p>
        <h2>{a.name} in brief</h2><p>{a.review.split('\n')[0]}</p>
        <h2>{b.name} in brief</h2><p>{b.review.split('\n')[0]}</p>
        <h2>Features compared</h2>
        <div className="cols-2">
          {[a, b].map((x) => (
            <div key={x.slug}>
              <h3>{x.name}</h3>
              <ul>{x.features.map((f) => <li key={f.name}><strong>{f.name}:</strong> {f.description}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>
      <SlotGrid slots={[a, b]} />
      <CasinoModule casinos={getCasinos()} title="Where to play both" context={`compare:${c.slug}`} />
      <FAQ items={[{ q: `Which has the higher RTP, ${a.name} or ${b.name}?`, a: verdict[0] }, { q: `Which pays more, ${a.name} or ${b.name}?`, a: `${verdict[2]} Max wins are rare and not a realistic expectation for any session.` }]} />
    </>
  );
}
