import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FAQ } from '@/components/FAQ';
import { GAME_PAGES, GAME_ORDER } from '@/lib/table-games/pages';
import { getGuides } from '@/lib/data';

export const metadata = buildMetadata({
  title: ['Free Table Games: Blackjack, Roulette, Baccarat, Video Poker', 'Free Table Games – Blackjack, Roulette & More', 'Free Table Games'],
  description: 'Play five free casino table games with play money and no sign-up: blackjack, European roulette, baccarat, Jacks or Better video poker and Casino Hold\'em. Real cards, real wheel, strategy hints and the rules of each game explained.',
  path: '/table-games',
});

const FAQS = [
  { q: 'Are these table games free to play?', a: 'Yes. Every game runs in your browser with a 1,000-unit play-money balance that is saved on your device. There is no sign-up, no deposit and nothing to win or lose. You can reset the balance at any time.' },
  { q: 'Are the cards and the wheel fair?', a: 'Yes. Each game uses real shuffled decks or a 37-pocket wheel driven by a cryptographic random number generator, with the standard rules and payouts shown on its page. Nothing is adjusted in either direction.' },
  { q: 'Which table game should I start with?', a: 'Blackjack if you want decisions to matter: the hint mode teaches basic strategy as you play. Roulette or baccarat if you want to place a bet and watch – there are no decisions after the bet. Video poker and Casino Hold\'em sit in between.' },
  { q: 'What does "Show book move" do?', a: 'It highlights the mathematically correct action for the situation in front of you – basic strategy in blackjack, the optimal hold in video poker, call or fold in Casino Hold\'em – with a one-line reason. In roulette and baccarat it reminds you that no move changes the odds and points to the best-edge bet.' },
  { q: 'Can I play these games for real money?', a: 'Not here. Each game page lists partner casinos that offer the real-money version, shown according to your country. Real-money play involves risk and is for adults only.' },
];

export default function TableGamesHub() {
  const guides = ['blackjack-basic-strategy', 'baccarat-odds-explained', 'jacks-or-better-strategy'].map((s) => getGuides().find((g) => g.slug === s)).filter(Boolean);
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
                <span className="tg-card-edge">{g.tag}</span>
                <p className="tg-card-desc">{g.blurb}</p>
                <span className="tg-card-cta">Play free →</span>
              </div>
            </Link>
          </li>
        ); })}
      </ul>

      <section aria-labelledby="cmp-h">
        <h2 id="cmp-h">The five games at a glance</h2>
        <div className="table-wrap">
          <table className="cmp">
            <thead><tr><th>Game</th><th>Rules on our table</th><th>Decisions</th><th>Hint mode shows</th></tr></thead>
            <tbody>
              <tr><td><Link href="/table-games/blackjack">Blackjack</Link></td><td>6 decks, dealer stands on soft 17, 3:2, 1–3 hands</td><td>Hit, stand, double, split</td><td>Full basic strategy</td></tr>
              <tr><td><Link href="/table-games/video-poker">Jacks or Better 9/6</Link></td><td>Full-pay table, 5 coins</td><td>Which cards to hold</td><td>Optimal hold</td></tr>
              <tr><td><Link href="/table-games/baccarat">Baccarat</Link></td><td>8 decks, Banker 0.95:1, Tie 8:1</td><td>Bet choice only</td><td>Best bet (Banker)</td></tr>
              <tr><td><Link href="/table-games/casino-holdem">Casino Hold&apos;em</Link></td><td>Ante, call 2×, dealer qualifies on 4s</td><td>Call or fold</td><td>When to fold</td></tr>
              <tr><td><Link href="/table-games/roulette">European roulette</Link></td><td>Single zero, 35:1 straight up</td><td>Bet choice only</td><td>Smoothest bets</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="prose" aria-labelledby="why-h">
        <h2 id="why-h">Why play table games for free first</h2>
        <p>Table games reward knowing the rules. In blackjack, following the basic strategy chart instead of guessing changes your results on every hand; in video poker a wrong hold can cost far more. Playing with play money lets you learn the decisions and get a feel for the swings before any real money is involved.</p>
        <p>Every game here is an original implementation of the public rules. The cards are shuffled and the wheel is spun with a cryptographic random number generator, the payouts are the standard ones, and the balance is play money that lives only in your browser. Switch on <strong>Show book move</strong> to see the mathematically correct play for each situation, then try to beat it without the hints.</p>
      </section>

      {guides.length ? (<section aria-labelledby="g-h"><h2 id="g-h">Strategy guides</h2><ul className="inline-links">{guides.map((g) => <li key={g!.slug}><Link href={`/guides/${g!.slug}`}>{g!.title}</Link></li>)}</ul></section>) : null}

      <FAQ items={FAQS} title="Table games FAQ" />
      <p className="notice small"><span className="badge-18">18+</span> Free play with play money – nothing can be won or lost. Casino games are games of chance; the cards and the wheel decide every hand. <Link href="/responsible-gambling">Play responsibly</Link>.</p>
    </>
  );
}
