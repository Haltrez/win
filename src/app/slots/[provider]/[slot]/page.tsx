import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { getAuthor, getCasinosForProvider, getComparisons, getGuides, getProvider, getRelatedSlots, getSlot, getSlots, slotUrl } from '@/lib/data';
import { getCategoriesForSlot } from '@/lib/categories';
import { buildMetadata, slotDescription, slotTitle } from '@/lib/seo';
import { slotGame } from '@/lib/schema';
import { fmtDate, fmtRelease, fmtRtp, fmtX, VOLATILITY_LABEL, volScore } from '@/lib/format';
import type { Slot } from '@/lib/types';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { DemoEmbed } from '@/components/DemoEmbed';
import { StatsTable } from '@/components/StatsTable';
import { AffiliateDisclosure } from '@/components/Disclosure';
import { CasinoModule } from '@/components/CasinoModule';
import { SlotGrid } from '@/components/SlotCard';
import { FAQ } from '@/components/FAQ';
import { FavoriteButton } from '@/components/Favorites';

type Params = { provider: string; slot: string };
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getSlots().map((s) => ({ provider: s.provider, slot: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { provider, slot } = await params;
  const s = getSlot(provider, slot);
  const p = getProvider(provider);
  if (!s || !p) return {};
  return buildMetadata({ title: slotTitle(s, p), absoluteTitle: true, description: slotDescription(s, p), path: slotUrl(s), type: 'article', modifiedTime: s.updatedAt, publishedTime: s.releaseDate ?? undefined });
}

function volatilityNote(s: Slot) {
  if (!s.volatility) return `The provider hasn't published an official volatility rating for ${s.name}, so we don't label it. Judge it from the demo: if wins are rare but bonus rounds carry most of the value, treat it as a higher-variance game and size your stake accordingly.`;
  const v = volScore(s.volatility);
  if (v >= 6) return `${s.name} is a very high volatility slot. Most sessions will be dominated by small wins and dead spins, with the bulk of its return concentrated in rare bonus rounds. A short session can easily lose its whole budget without a meaningful hit – try it in demo first and only play for real with a fixed budget you're comfortable losing.`;
  if (v >= 5) return `${s.name} is a high volatility slot: expect longer stretches between meaningful wins and larger swings in your balance than on a medium-volatility game. The bonus round carries much of the game's value.`;
  if (v >= 3) return `${s.name} sits in the medium volatility range, so wins arrive more regularly than on high-variance games but are usually smaller. It suits longer sessions at a steady stake.`;
  return `${s.name} is a low volatility slot with frequent small wins${s.maxWin ? ` and a modest ${fmtX(s.maxWin)} cap` : ''}. It won't produce huge hits, but your balance usually moves more slowly.`;
}

function autoFaq(s: Slot, providerName: string) {
  const f = [
    { q: `What is the RTP of ${s.name}?`, a: `The highest published RTP of ${s.name} is ${fmtRtp(s.rtp)}.${s.rtpVariants?.length ? ` ${providerName} also offers casinos versions at ${s.rtpVariants.map(fmtRtp).join(', ')}, so check the game's info screen to see which one you are playing.` : ' Casinos may be able to configure a lower RTP – always check the in-game info screen.'}` },
    ...(s.maxWin ? [{ q: `What is the max win on ${s.name}?`, a: `${s.name} has a maximum win of ${fmtX(s.maxWin)} your stake. Max wins are extremely rare and should not be expected in normal play.` }] : []),
    ...(s.volatility ? [{ q: `Is ${s.name} high volatility?`, a: `${s.name} is rated ${VOLATILITY_LABEL[s.volatility].toLowerCase()} volatility by ${providerName}. ${volScore(s.volatility) >= 5 ? 'Wins are less frequent but can be larger.' : 'Wins tend to be more frequent but smaller.'}` }] : []),
    { q: `Can I play ${s.name} for free?`, a: s.demoUrl ? `Yes. You can play the official ${s.name} demo on this page with play money – no sign-up or deposit required.` : `We only embed official demos. The ${s.name} demo will appear on this page once ${providerName} makes it available for our region.` },
    { q: `Does ${s.name} have a bonus buy?`, a: s.mechanics.includes('bonus-buy') ? `Yes, ${s.name} includes a bonus buy option in markets where it is permitted. It is not available in Great Britain and some other regulated markets. Buying the bonus does not improve your odds.` : `No, ${s.name} does not offer a bonus buy. The bonus has to be triggered naturally.` },
  ];
  return [...f, ...(s.faq ?? [])];
}

export default async function SlotPage({ params }: { params: Promise<Params> }) {
  const { provider, slot } = await params;
  const s = getSlot(provider, slot);
  const p = getProvider(provider);
  if (!s || !p) notFound();
  const url = slotUrl(s);
  const author = getAuthor(s.author);
  const casinos = getCasinosForProvider(p.slug);
  const related = getRelatedSlots(s);
  const cats = getCategoriesForSlot(s);
  const comparisons = getComparisons().filter((c) => c.a.slug === s.slug || c.b.slug === s.slug);
  const guides = getGuides().filter((g) => g.relatedSlots?.includes(s.slug) || ['rtp-explained', 'slot-volatility-explained', 'how-max-win-works'].includes(g.slug)).slice(0, 4);
  const reviewHtml = marked.parse(s.review, { async: false }) as string;

  return (
    <>
      <Breadcrumbs items={[{ name: 'Slots', path: '/slots' }, { name: p.name, path: `/providers/${p.slug}` }, { name: s.name, path: url }]} />
      <h1>{s.name} Demo &amp; Review</h1>
      <p className="muted">
        By <Link href={`/providers/${p.slug}`}>{p.name}</Link>{s.releaseDate ? ` · Released ${fmtRelease(s)}` : ''} · Reviewed by <Link href="/about">{author.name}</Link> · Updated {fmtDate(s.updatedAt)}
      </p>
      <AffiliateDisclosure compact />

      <div className="slot-hero">
        <div>
          <DemoEmbed name={s.name} url={s.demoUrl} providerName={p.name} launchPath={`/api/demo/${s.provider}/${s.slug}`} />
          <p className="muted small">Demo mode uses virtual credits and is for entertainment and learning only. Demo results do not predict real-money results.</p>
        </div>
        <aside className="side-card" aria-label={`${s.name} key facts`}>
          {s.rating ? <p><span className="score">{s.rating.toFixed(1)}</span><span className="muted">/10 our score</span></p> : null}
          <StatsTable slot={s} provider={p} />
          <div className="cta-stack">
            {casinos[0] ? (
              <a className="btn btn-primary" href={`/go/${casinos[0].slug}?src=slot-hero&slot=${s.slug}`} rel="sponsored nofollow noopener" target="_blank" data-event="affiliate_click">
                Play {s.name} for real money
              </a>
            ) : null}
            <FavoriteButton id={`${s.provider}/${s.slug}`} name={s.name} url={url} />
            <p className="muted small">18+ · Real-money play involves risk. <Link href="/responsible-gambling">Set limits</Link>.</p>
          </div>
        </aside>
      </div>

      <section className="prose" aria-labelledby="review-h">
        <h2 id="review-h">{s.name} review</h2>
        <div dangerouslySetInnerHTML={{ __html: reviewHtml }} />

        {s.playNotes ? (
          <div className="notice">
            <strong>From our demo session ({fmtDate(s.playNotes.testedOn)}):</strong> {s.playNotes.spins.toLocaleString()} spins
            {s.playNotes.bonusTriggers != null ? `, ${s.playNotes.bonusTriggers} bonus triggers` : ''}
            {s.playNotes.bestWinX != null ? `, best win ${fmtX(s.playNotes.bestWinX)}` : ''}. {s.playNotes.notes}
            <br /><span className="muted small">A single demo session is a tiny sample and does not reflect the game&apos;s long-term RTP.</span>
          </div>
        ) : null}

        <h2>Features and bonus rounds</h2>
        <dl className="feature-list">
          {s.features.map((f) => (<div key={f.name}><dt>{f.name}</dt><dd>{f.description}</dd></div>))}
        </dl>

        <h2>{s.name} RTP, volatility and max win</h2>
        <p>
          <strong>RTP:</strong> the default return to player is {fmtRtp(s.rtp)}, meaning that over a very large number of spins the game is designed to
          pay back around {s.rtp.toFixed(1)} units for every 100 wagered. {s.rtpVariants?.length ? `It is also offered at ${s.rtpVariants.map(fmtRtp).join(', ')} – a casino running the lowest version keeps noticeably more of every bet.` : 'Some casinos may run a lower configuration; the info screen inside the game shows the exact figure.'}{' '}
          <Link href="/guides/rtp-explained">How RTP works</Link>.
        </p>
        <p><strong>Volatility:</strong> {volatilityNote(s)} <Link href="/guides/slot-volatility-explained">Volatility explained</Link>.</p>
        <p>
          <strong>Max win:</strong>{' '}
          {s.maxWin ? <>the maximum payout is {fmtX(s.maxWin)} the stake.</> : <>{p.name} doesn&apos;t publish a max win figure for {s.name} on its website; the paytable inside the demo shows any win cap.</>}{' '}
          <Link href="/guides/how-max-win-works">What max win really means</Link>.
        </p>

        <div className="proscons">
          <div className="pros"><h3>Pros</h3><ul>{s.pros.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div className="cons"><h3>Cons</h3><ul>{s.cons.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </div>
      </section>

      <CasinoModule casinos={casinos} title={`Best casinos to play ${s.name}`} context={`slot:${s.slug}`} slotName={s.name} />

      {cats.length ? (
        <>
          <h2>Find similar slots</h2>
          <ul className="chips">{cats.map((c) => <li key={c.slug}><Link href={`/best/${c.slug}`}>{c.title}</Link></li>)}</ul>
        </>
      ) : null}

      {comparisons.length ? (
        <>
          <h2>Comparisons</h2>
          <ul>{comparisons.map((c) => <li key={c.slug}><Link href={`/compare/${c.slug}`}>{c.a.name} vs {c.b.name}</Link></li>)}</ul>
        </>
      ) : null}

      <h2>Slots like {s.name}</h2>
      <SlotGrid slots={related} />

      <h2>More from {p.name}</h2>
      <p>{p.description.split('. ').slice(0, 2).join('. ')}. <Link href={`/providers/${p.slug}`}>All {p.name} slots →</Link></p>

      {guides.length ? (
        <>
          <h2>Helpful guides</h2>
          <ul>{guides.map((g) => <li key={g.slug}><Link href={`/guides/${g.slug}`}>{g.title}</Link></li>)}</ul>
        </>
      ) : null}

      <FAQ items={autoFaq(s, p.name)} title={`${s.name} FAQ`} />

      <p className="muted small">
        Data sources: {(s.sources ?? []).join('; ') || 'provider game sheet'}.{' '}
        {s.verified && s.lastVerified ? `Figures last verified ${fmtDate(s.lastVerified)}.` : 'Figures pending editorial verification.'} Spotted an error? <Link href="/contact">Tell us</Link>.
      </p>
      <JsonLd data={slotGame(s, p, author, url)} />
    </>
  );
}
