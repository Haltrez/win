import Link from 'next/link';
import { buildMetadata, abs } from '@/lib/seo';
import { SITE } from '@/lib/config';
import { getBigWins, getClips } from '@/lib/wins';
import { getSlot } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { FAQ } from '@/components/FAQ';
import { ClipCard } from '@/components/ClipCard';

const UPDATED = '2026-11-10';

export const metadata = buildMetadata({
  title: ['Biggest Slot Wins Ever: The Record Jackpots, Verified', 'Biggest Slot Wins Ever (Verified)', 'Biggest Slot Wins Ever'],
  description: 'The biggest slot wins ever recorded, each checked against Guinness World Records, press releases or news reports: from the $39.7 million Megabucks hit to the €19.4 million online record.',
  path: '/biggest-slot-wins',
  type: 'article',
  publishedTime: UPDATED,
  modifiedTime: UPDATED,
});

export default function BiggestWinsPage() {
  const wins = getBigWins();
  const clips = getClips();
  const host = new URL(SITE.url).hostname;
  const faq = [
    { q: 'What is the biggest slot win ever?', a: 'The largest slot win on record is $39,713,982, won on a Megabucks machine at the Excalibur in Las Vegas on 21 March 2003. Guinness World Records lists it as the largest slot machine win.' },
    { q: 'What is the biggest online slot win ever?', a: 'The largest online slot jackpot we could verify is €19,430,723, won on Absolootly Mad: Mega Moolah at Napoleon Sports & Casino in Belgium in April 2021.' },
    { q: 'Why are all the record wins on progressive jackpot slots?', a: 'A progressive jackpot takes a small slice of every bet from every player on the network and adds it to one prize. That pool can grow for months, far beyond what a normal slot can pay. Regular slots have a fixed max win, usually between 5,000x and 150,000x the bet.' },
    { q: 'Can I win a jackpot playing a demo?', a: 'No. Demos use play money, so nothing won in a demo can be withdrawn. Demos are for learning how a game works before deciding whether to play it.' },
  ];
  return (
    <>
      <Breadcrumbs items={[{ name: 'Guides', path: '/guides' }, { name: 'Biggest slot wins ever', path: '/biggest-slot-wins' }]} />
      <h1>Biggest slot wins ever</h1>
      <section className="prose">
        <p>
          These are the largest slot wins we could verify. Every entry links to its sources: Guinness World Records, the casino&apos;s or game maker&apos;s own press release, or news reports from the time.
          We left out wins we couldn&apos;t confirm, and nothing on this page is invented or embellished.
        </p>
        <div className="notice">
          <strong>Read this first.</strong> Every win below is a progressive jackpot, funded by a slice of the bets of everyone who played and lost. This is a handful of wins across more than twenty years.
          Nobody can make one happen by betting bigger or playing longer, and chasing a jackpot is the fastest way to lose more than you planned. If gambling stops being fun, see our <Link href="/responsible-gambling">responsible gambling page</Link>. 18+.
        </div>

        <div className="table-wrap">
          <table className="cmp">
            <thead><tr><th>#</th><th>Win</th><th>Game</th><th>Where</th><th>Year</th></tr></thead>
            <tbody>{wins.map((w, i) => (<tr key={w.id}><td>{i + 1}</td><td><a href={`#${w.id}`}>{w.amountShort}</a></td><td>{w.game}</td><td>{w.type === 'online' ? 'Online' : 'Casino'}</td><td>{w.sortDate.slice(0, 4)}</td></tr>))}</tbody>
          </table>
        </div>
        <p className="muted small">Amounts are in the currency they were paid in, so the list isn&apos;t converted to one currency. Last checked {UPDATED}.</p>

        {wins.map((w, i) => (
          <article key={w.id} id={w.id} className="win">
            <h2>{i + 1}. {w.amount} on {w.game}</h2>
            <dl className="win-facts">
              <div><dt>Where</dt><dd>{w.where}</dd></div>
              <div><dt>When</dt><dd>{w.date}</dd></div>
              <div><dt>Bet</dt><dd>{w.stake}</dd></div>
              <div><dt>Game by</dt><dd>{w.maker}</dd></div>
            </dl>
            <p>{w.story}</p>
            <p className="muted small">Sources: {w.sources.map((s, j) => <span key={s.url}>{j ? ' · ' : ''}<a href={s.url} target="_blank" rel="noopener nofollow">{s.name}</a></span>)}</p>
          </article>
        ))}

        <h2>What these wins have in common</h2>
        <ul>
          <li><strong>All are progressive jackpots.</strong> The prize comes from a pool that every player on the network pays into, not from the game&apos;s normal paytable.</li>
          <li><strong>The bets were small.</strong> Where the stake is known it was modest: a 25p spin, a €15 spin, about $100 in a machine. Betting more does not make a jackpot more likely to hit for you.</li>
          <li><strong>Jackpot slots pay less the rest of the time.</strong> Part of every bet goes to the jackpot pool, so the return from ordinary spins is lower than on a regular slot. Our <Link href="/tools/slot-cost-calculator">slot cost calculator</Link> shows what a session costs on average at any RTP.</li>
          <li><strong>Regular slots have a ceiling.</strong> A slot&apos;s <Link href="/guides/how-max-win-works">max win</Link> is a fixed multiple of the bet. See the <Link href="/best/highest-max-win-slots">slots with the highest max wins</Link> on this site, all playable as free demos.</li>
        </ul>

        <h2 id="streamer-wins">Streamer big wins</h2>
        {clips.length ? (
          <>
            <p>Real clips from slot streamers, shown with their permission and credited to their channels. Streamers often play with very large stakes and sometimes with money provided by a casino, so these are entertainment, not a guide to what to expect.</p>
            <div className="clips">{clips.map((c) => <ClipCard key={c.id} clip={c} host={host} />)}</div>
          </>
        ) : (
          <p>We only show streamer clips with the streamer&apos;s permission and a credit to their channel, and we haven&apos;t published any yet.</p>
        )}
        <div className="notice">
          <strong>Slot streamer?</strong> Send us a link to your clip through the <Link href="/contact">contact page</Link>. If we feature it, we credit and link your channel, and link the clip from the game&apos;s demo page.
        </div>
      </section>
      <FAQ items={faq} />
      <JsonLd
        data={{
          '@context': 'https://schema.org', '@type': 'Article', headline: 'Biggest slot wins ever: the record jackpots, verified', url: abs('/biggest-slot-wins'),
          datePublished: UPDATED, dateModified: UPDATED, author: { '@type': 'Organization', name: SITE.name, url: SITE.url }, publisher: { '@id': `${SITE.url}/#organization` },
          citation: wins.flatMap((w) => w.sources.map((s) => s.url)),
        }}
      />
    </>
  );
}
