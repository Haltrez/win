import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { FEATURES, SITE } from '@/lib/config';
import { getAuthor, getCasinosForProvider, getComparisons, getGuides, getProvider, getRelatedSlots, getSeries, seriesLabel, getSlot, getSlots, getSlotsByProvider, slotUrl } from '@/lib/data';
import { getCategoriesForSlot } from '@/lib/categories';
import { abs, buildMetadata, hasDemo, slotDescription, slotTitle } from '@/lib/seo';
import { slotGame } from '@/lib/schema';
import { fmtDate, fmtRelease, fmtRtp, fmtX, VOLATILITY_LABEL, volScore } from '@/lib/format';
import type { Slot } from '@/lib/types';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { VoteButtons } from '@/components/VoteButtons';
import { DemoEmbed } from '@/components/DemoEmbed';
import { StatsTable } from '@/components/StatsTable';
import { CasinoModule } from '@/components/CasinoModule';
import { SlotRail } from '@/components/SlotCard';
import { ClipCard } from '@/components/ClipCard';
import { BestCasinoButton } from '@/components/BestCasinoButton';
import { getClipsForSlot } from '@/lib/wins';
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
  return buildMetadata({ title: slotTitle(s, p), absoluteTitle: true, description: slotDescription(s, p), path: slotUrl(s), type: 'article', modifiedTime: s.updatedAt, publishedTime: s.releaseDate ?? undefined, image: abs(`/og/${s.provider}/${s.slug}`), imageAlt: `${s.name} by ${p.name}: RTP, volatility and max win` });
}

function volatilityNote(s: Slot) {
  if (!s.volatility) return `The provider hasn't published an official volatility rating for ${s.name}, so we don't label it. Judge it from the demo: if wins are rare but bonus rounds carry most of the value, treat it as a higher-variance game and size your stake accordingly.`;
  const v = volScore(s.volatility);
  if (v >= 6) return `${s.name} is a very high volatility slot. Most sessions will be dominated by small wins and dead spins, with the bulk of its return concentrated in rare bonus rounds. A short session can easily lose its whole budget without a meaningful hit – the demo is the safest way to see how swingy it really is.`;
  if (v >= 5) return `${s.name} is a high volatility slot: expect longer stretches between meaningful wins and larger swings in your balance than on a medium-volatility game. The bonus round carries much of the game's value.`;
  if (v >= 3) return `${s.name} sits in the medium volatility range, so wins arrive more regularly than on high-variance games but are usually smaller. It suits longer sessions at a steady stake.`;
  return `${s.name} is a low volatility slot with frequent small wins${s.maxWin ? ` and a modest ${fmtX(s.maxWin)} cap` : ''}. It won't produce huge hits, but your balance usually moves more slowly.`;
}

/** Guides matched to this slot's mechanics first, then the core RTP / volatility / max-win guides. */
const MECH_GUIDE: [(s: Slot) => boolean, string][] = [
  [(s) => /super scatter/i.test(s.name), 'super-scatter-slots-explained'],
  [(s) => s.provider === 'hacksaw-gaming' && /^le /i.test(s.name), 'hacksaw-le-series-explained'],
  [(s) => s.provider === 'wazdan', 'wazdan-slots-explained'],
  [(s) => s.mechanics.some((m) => ['xnudge', 'xways', 'xbomb'].includes(m)), 'nolimit-city-x-mechanics-explained'],
  [(s) => s.provider === 'hacksaw-gaming' && /duel/i.test(s.review + s.features.map((f) => f.name).join(' ')), 'duelreels-explained'],
  [(s) => s.mechanics.includes('hold-and-win'), 'hold-and-win-explained'],
  [(s) => s.mechanics.includes('megaways'), 'what-is-megaways'],
  [(s) => s.mechanics.includes('cluster-pays'), 'cluster-pays-explained'],
  [(s) => s.mechanics.some((m) => ['tumble', 'cascades'].includes(m)), 'tumbling-reels-explained'],
  [(s) => s.mechanics.some((m) => ['sticky-wilds', 'respins', 'walking-wilds'].includes(m)), 'sticky-wilds-and-respins-explained'],
  [(s) => s.mechanics.includes('bonus-buy'), 'bonus-buy-explained'],
  [(s) => !!s.hitRate, 'hit-frequency-explained'],
  [(s) => s.mechanics.includes('free-spins'), 'free-spins-explained'],
  [(s) => (s.maxWin ?? 0) >= 20000, 'slot-max-win-inflation'],
];
function pickGuides(s: Slot) {
  const all = getGuides();
  const want = [
    ...all.filter((g) => g.relatedSlots?.includes(s.slug)).map((g) => g.slug),
    ...MECH_GUIDE.filter(([f]) => f(s)).map(([, g]) => g),
    'rtp-explained', 'slot-volatility-explained', 'how-max-win-works',
  ];
  return [...new Set(want)].map((slug) => all.find((g) => g.slug === slug)).filter(Boolean).slice(0, 5) as ReturnType<typeof getGuides>;
}

function autoFaq(s: Slot, providerName: string) {
  const f = [
    { q: `What is the RTP of ${s.name}?`, a: s.rtp == null ? `${providerName} has not published an RTP for ${s.name}, and we don't guess. The in-game info screen shows the exact RTP of the version a casino is running.` : `The ${s.rtpSource === 'third-party' ? 'RTP reported by independent slot databases' : 'highest published RTP'} of ${s.name} is ${fmtRtp(s.rtp)}.${s.rtpSource === 'third-party' ? ` ${providerName} has not confirmed this figure, so check the in-game info screen.` : ''}${s.rtpVariants?.length ? ` ${providerName} also offers casinos versions at ${s.rtpVariants.map(fmtRtp).join(', ')}, so check the game's info screen to see which one you are playing.` : ' Casinos may be able to configure a lower RTP – always check the in-game info screen.'}` },
    ...(s.maxWin ? [{ q: `What is the max win on ${s.name}?`, a: `${s.name} has a maximum win of ${fmtX(s.maxWin)} your stake. Max wins are extremely rare and should not be expected in normal play.` }] : []),
    ...(s.volatility ? [{ q: `Is ${s.name} high volatility?`, a: `${s.name} is rated ${VOLATILITY_LABEL[s.volatility].toLowerCase()} volatility by ${providerName}. ${volScore(s.volatility) >= 5 ? 'Wins are less frequent but can be larger.' : 'Wins tend to be more frequent but smaller.'}` }] : []),
    { q: `Can I play the ${s.name} demo for free?`, a: s.demoLink ? `Yes. ${providerName} offers a free ${s.name} demo on its official website; the Play button on this page opens it. No sign-up or deposit is needed.` : s.demoUrl ? `Yes. You can play the official ${s.name} demo on this page with play money – no sign-up, download or deposit required.` : `Not yet. We only offer official demos, and ${providerName} doesn't currently provide one we can show for ${s.name}. The review and data on this page are still based on ${providerName}'s official information.` },
    ...(s.demoUrl || s.demoLink ? [
      { q: `Is the ${s.name} demo the same as the real game?`, a: `Yes. The demo is ${providerName}'s own game with the same reels, features and paytable; only the balance is play money. One difference to know: casinos can sometimes run a different RTP version than the demo, so check the info screen when playing for real.` },
      { q: `Can I play the ${s.name} demo on mobile?`, a: `Yes. The ${s.name} demo runs in your phone's browser on iPhone and Android with nothing to install.${s.demoUrl && !s.demoLink ? ' Tap Full screen for the best view.' : ''}` },
    ] : []),
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
  const series = getSeries(s);
  const related = getRelatedSlots(s).filter((r) => !series.some((x) => x.slug === r.slug));
  const moreFromProvider = getSlotsByProvider(p.slug).filter((x) => x.slug !== s.slug && !series.some((y) => y.slug === x.slug) && !related.some((y) => y.slug === x.slug)).slice(0, 10);
  const cats = getCategoriesForSlot(s);
  const comparisons = getComparisons().filter((c) => c.a.slug === s.slug || c.b.slug === s.slug);
  const guides = pickGuides(s);
  const reviewHtml = marked.parse(s.review, { async: false }) as string;
  const demo = hasDemo(s);
  const clips = getClipsForSlot(s.provider, s.slug);

  return (
    <>
      <Breadcrumbs items={[{ name: 'Slots', path: '/slots' }, { name: p.name, path: `/providers/${p.slug}` }, { name: s.name, path: url }]} />
      <h1 className="slot-h1">
        {s.name}
        <span className="slot-kicker">{demo ? <> Demo · free play &amp; review</> : <> Slot review</>} · {p.name}</span>
      </h1>

      <div className="slot-hero">
        <div>
          <DemoEmbed name={s.name} url={s.demoUrl} providerName={p.name} launchPath={`/api/demo/${s.provider}/${s.slug}`} externalUrl={s.demoLink ?? (s.provider === 'push-gaming' && s.demoUrl ? `https://www.pushgaming.com/games/play/${s.slug}.html` : undefined)} image={s.image ?? undefined}
            cta={FEATURES.realMoney && casinos.length ? { slotKey: `${s.provider}/${s.slug}`, casinos: casinos.map((c) => ({ slug: c.slug, name: c.name, geos: c.geos, bonus: c.bonus, terms: c.terms })) } : undefined} />
        </div>
        <aside className="side-card" aria-label={`${s.name} key facts`}>
          {s.rating ? <p><span className="score">{s.rating.toFixed(1)}</span><span className="muted">/10 our score</span></p> : null}
          {process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL ? <VoteButtons id={`${s.provider}/${s.slug}`} name={s.name} /> : null}
          <StatsTable slot={s} provider={p} />
          <div className="cta-stack">
            {FEATURES.realMoney && casinos.length ? <BestCasinoButton casinos={casinos.map((c) => ({ slug: c.slug, name: c.name, geos: c.geos }))} label="Play now" src="slot-hero" slot={`${s.provider}/${s.slug}`} /> : null}
            <FavoriteButton id={`${s.provider}/${s.slug}`} name={s.name} url={url} />
          </div>
        </aside>
      </div>

      <CasinoModule casinos={casinos} title="Ready to play for real?" context={`slot:${s.slug}`} slotName={s.name} />

      <div className="section-head"><h2>Play next: slots like {s.name}</h2><Link href={`/providers/${p.slug}`}>All {p.name} slots →</Link></div>
      <SlotRail slots={related} label={`Slots like ${s.name}`} />

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

        {demo ? (
          <>
            <h2>How to play the {s.name} demo</h2>
            <ol>
              <li>{s.demoUrl && !s.demoLink && s.provider !== 'push-gaming' ? <>Press <strong>Play free demo</strong> at the top of this page. The official {p.name} game loads here, with no sign-up, download or deposit.</> : <>Press <strong>Play free demo on {p.name}</strong> at the top of this page. The official demo opens on the {p.name} website in a new tab, with no sign-up or deposit.</>}</li>
              <li>You start with a play-money balance. Set a stake you would use for real, so the demo shows you realistic swings{s.volatility ? <> for a {VOLATILITY_LABEL[s.volatility].toLowerCase()}-volatility slot</> : null}.</li>
              <li>Play long enough to see the main feature{s.features[0] ? <> – look out for <strong>{s.features[0].name}</strong>{s.features[1] ? <> and <strong>{s.features[1].name}</strong></> : null}</> : null}.{s.mechanics.includes('bonus-buy') ? ' The demo also lets you try the bonus buy with play money, which is the cheapest way to see what the bonus round is really like.' : ''}</li>
              <li>On a phone, tap <strong>Full screen</strong> and turn the phone sideways for the best view.</li>
            </ol>
            <p className="muted small">The {s.name} demo is the provider&apos;s own game with the same features and paytable as the real-money version; only the balance is play money, so demo wins can&apos;t be withdrawn.</p>
          </>
        ) : null}

        {clips.length ? (
          <>
            <h2>{s.name} big win videos</h2>
            <p className="muted small">Played through YouTube and credited to each channel. Streamers often bet large amounts; wins like these are rare. <Link href="/biggest-slot-wins">More verified big wins</Link>.</p>
            <div className="clips">{clips.map((c) => <ClipCard key={c.id} clip={c} host={new URL(SITE.url).hostname} />)}</div>
          </>
        ) : null}

        <h2>Features and bonus rounds</h2>
        <dl className="feature-list">
          {s.features.map((f) => (<div key={f.name}><dt>{f.name}</dt><dd>{f.description}</dd></div>))}
        </dl>

        <h2>{s.name} RTP, volatility and max win</h2>
        <p>
          <strong>RTP:</strong>{' '}
          {s.rtp == null ? (
            <>{p.name} does not publish an RTP for {s.name} outside the game, and we don&apos;t publish unconfirmed numbers. Open the info screen inside the game to see the RTP of the version you are playing.{' '}</>
          ) : (<>the {s.rtpSource === 'third-party' ? 'return to player reported by independent slot databases' : 'default return to player'} is {fmtRtp(s.rtp)}, meaning that over a very large number of spins the game is designed to
          pay back around {s.rtp.toFixed(1)} units for every 100 wagered. {s.rtpSource === 'third-party' ? `${p.name} has not published this figure itself, so treat it as unconfirmed. ` : ''}{s.rtpVariants?.length ? `It is also offered at ${s.rtpVariants.map(fmtRtp).join(', ')} – a casino running the lowest version keeps noticeably more of every bet.` : 'Some casinos may run a lower configuration; the info screen inside the game shows the exact figure.'}{' '}</>)}
          <Link href="/guides/rtp-explained">How RTP works</Link>.{s.rtp != null && s.rtpSource !== 'third-party' ? <> <Link href={`/tools/slot-cost-calculator?slot=${s.provider}/${s.slug}`}>See what {fmtRtp(s.rtp)} RTP costs per session</Link>.</> : null}
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



      <h2>Explore more</h2>
      <div className="link-groups">
        {series.length ? (
          <section>
            <h3>{seriesLabel(s)} series</h3>
            <ul className="inline-links">{series.map((x) => <li key={x.slug}><Link href={slotUrl(x)}>{x.name}</Link></li>)}</ul>
          </section>
        ) : null}
        {comparisons.length ? (
          <section>
            <h3>Compare</h3>
            <ul className="inline-links">{comparisons.slice(0, 6).map((c) => <li key={c.slug}><Link href={`/compare/${c.slug}`}>{c.a.slug === s.slug ? `vs ${c.b.name}` : `vs ${c.a.name}`}</Link></li>)}</ul>
          </section>
        ) : null}
        {cats.length ? (
          <section>
            <h3>Featured in</h3>
            <ul className="inline-links">{cats.slice(0, 6).map((c) => <li key={c.slug}><Link href={`/best/${c.slug}`}>{c.title.replace(/\s+\d{4}$/, '')}</Link></li>)}</ul>
          </section>
        ) : null}
        {moreFromProvider.length ? (
          <section>
            <h3>More from {p.name}</h3>
            <ul className="inline-links">{moreFromProvider.slice(0, 8).map((x) => <li key={x.slug}><Link href={slotUrl(x)}>{x.name}</Link></li>)}</ul>
          </section>
        ) : null}
        {guides.length ? (
          <section>
            <h3>Guides</h3>
            <ul className="inline-links">{guides.map((g) => <li key={g.slug}><Link href={`/guides/${g.slug}`}>{g.title.split(/[:(]/)[0].trim()}</Link></li>)}</ul>
          </section>
        ) : null}
      </div>

      <FAQ items={autoFaq(s, p.name)} title={`${s.name} FAQ`} />

      <p className="muted small">
        Data sources: {(s.sources ?? []).join('; ') || 'provider game sheet'}.{' '}
        {s.verified && s.lastVerified ? `Figures last verified ${fmtDate(s.lastVerified)}.` : 'Figures pending editorial verification.'} Spotted an error? <Link href="/contact">Tell us</Link>.
      </p>
      <JsonLd data={slotGame(s, p, author, url)} />
    </>
  );
}
