import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FAQ } from '@/components/FAQ';
import { GAME_PAGES, GAME_ORDER } from '@/lib/table-games/pages';
import { getGuides } from '@/lib/data';

export const metadata = buildMetadata({
  title: ['Free Table Games: Blackjack, Roulette, Baccarat, Video Poker', 'Free Table Games – Blackjack, Roulette & More', 'Free Table Games'],
  description: 'Play five free casino table games with play money and no sign-up: blackjack, European roulette, baccarat, Jacks or Better video poker and Casino Hold\'em. Real odds, strategy hints and the house edge of each game compared.',
  path: '/table-games',
});

const FAQS = [
  { q: 'Are these table games free to play?', a: 'Yes. Every game runs in your browser with a 1,000-unit play-money balance that is saved on your device. There is no sign-up, no deposit and nothing to win or lose. You can reset the balance at any time.' },
  { q: 'Are the odds the same as in a real casino?', a: 'Yes. Each game uses real shuffled decks or a 37-pocket wheel driven by a cryptographic random number generator, with the standard rules and payouts shown on its page. The published house edge for those rules is what you get – nothing is adjusted in either direction.' },
  { q: 'Which casino table game has the lowest house edge?', a: 'Blackjack played with basic strategy (about 0.41% under the rules here) and full-pay Jacks or Better video poker (0.46%) are the lowest. Baccarat\'s Banker bet is 1.06%, Casino Hold\'em 2.16% of the ante, and European roulette 2.70% on every bet.' },
  { q: 'What does "Show book move" do?', a: 'It highlights the mathematically correct action for the situation in front of you – basic strategy in blackjack, the optimal hold in video poker, call or fold in Casino Hold\'em – with a one-line reason. In roulette and baccarat it reminds you that no move changes the odds and points to the best-edge bet.' },
  { q: 'Can I play these games for real money?', a: 'Not here. Each game page lists partner casinos that offer the real-money version, shown according to your country. Real-money play involves risk and is for adults only.' },
];

export default function TableGamesHub() {
  const guides = ['blackjack-basic-strategy', 'baccarat-odds-explained', 'jacks-or-better-strategy', 'table-games-house-edge-compared'].map((s) => getGuides().find((g) => g.slug === s)).filter(Boolean);
  return (
    <>
      <Breadcrumbs items={[{ name: 'Table games', path: '/table-games' }]} />
      <h1 className="tg-h1">Free table games</h1>
      <p className="lede">Five classic casino table games you can play free, with play money and no sign-up. Real shuffled decks, a real spinning wheel, the standard rules and payouts – and a hint mode that shows the mathematically correct play while you learn.</p>
      <ul className="tg-grid">
        {GAME_ORDER.map((k) => { const g = GAME_PAGES[k]; return (
          <li key={k}>
            <Link href={`/table-games/${g.slug}`} className="tg-card">
              <div className="tg-card-art">{g.icon}</div>
              <div className="tg-card-body">
                <span className="tg-card-title">{g.name}</span>
                <span className="tg-card-edge">House edge {g.edge.toFixed(2)}%</span>
                <p className="tg-card-desc">{g.blurb}</p>
                <span className="tg-card-cta">Play free →</span>
              </div>
            </Link>
          </li>
        ); })}
      </ul>

      <section aria-labelledby="cmp-h">
        <h2 id="cmp-h">House edge compared</h2>
        <p className="muted">The house edge is the share of every bet the casino keeps in the long run. Lower is better for you. These are the published figures for the rules used on our tables, assuming the best bet or optimal play.</p>
        <div className="table-wrap">
          <table className="cmp">
            <thead><tr><th>Game</th><th>Best bet / play</th><th>House edge</th><th>RTP</th><th>Skill matters?</th></tr></thead>
            <tbody>
              <tr><td><Link href="/table-games/blackjack">Blackjack</Link></td><td>Basic strategy, 6 decks, S17, 3:2</td><td>{GAME_PAGES.blackjack.edge.toFixed(2)}%</td><td>{GAME_PAGES.blackjack.rtp}</td><td>Yes – every decision</td></tr>
              <tr><td><Link href="/table-games/video-poker">Jacks or Better 9/6</Link></td><td>Optimal holds, 5 coins</td><td>{GAME_PAGES['video-poker'].edge.toFixed(2)}%</td><td>{GAME_PAGES['video-poker'].rtp}</td><td>Yes – every hold</td></tr>
              <tr><td><Link href="/table-games/baccarat">Baccarat</Link></td><td>Banker bet</td><td>{GAME_PAGES.baccarat.edge.toFixed(2)}%</td><td>98.94%</td><td>No – bet choice only</td></tr>
              <tr><td><Link href="/table-games/casino-holdem">Casino Hold&apos;em</Link></td><td>Call ~82% of hands</td><td>{GAME_PAGES['casino-holdem'].edge.toFixed(2)}% of ante</td><td>97.84%</td><td>Yes – call or fold</td></tr>
              <tr><td><Link href="/table-games/roulette">European roulette</Link></td><td>Any bet</td><td>{GAME_PAGES.roulette.edge.toFixed(2)}%</td><td>{GAME_PAGES.roulette.rtp}</td><td>No</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">For comparison, most video slots return 94–97% (a 3–6% house edge); see our <Link href="/best/high-rtp-slots">high-RTP slots list</Link>. American double-zero roulette has a 5.26% edge, and the baccarat Tie bet 14.36%.</p>
      </section>

      <section className="prose" aria-labelledby="why-h">
        <h2 id="why-h">Why play table games for free first</h2>
        <p>Table games reward knowing the rules. In blackjack the difference between guessing and following the basic strategy chart is about 2% of every bet; in video poker a wrong hold can cost far more. Playing with play money lets you learn the decisions, get a feel for the swings and see the house edge at work before any real money is involved.</p>
        <p>Every game here is an original implementation of the public rules. The cards are shuffled and the wheel is spun with a cryptographic random number generator, the payouts are the standard ones, and the balance is play money that lives only in your browser. Switch on <strong>Show book move</strong> to see the mathematically correct play for each situation, then try to beat it without the hints.</p>
      </section>

      {guides.length ? (<section aria-labelledby="g-h"><h2 id="g-h">Strategy guides</h2><ul className="inline-links">{guides.map((g) => <li key={g!.slug}><Link href={`/guides/${g!.slug}`}>{g!.title}</Link></li>)}</ul></section>) : null}

      <FAQ items={FAQS} title="Table games FAQ" />
      <p className="notice small"><span className="badge-18">18+</span> Free play with play money – nothing can be won or lost. Casino games are games of chance; no strategy removes the house edge. <Link href="/responsible-gambling">Play responsibly</Link>.</p>
    </>
  );
}
