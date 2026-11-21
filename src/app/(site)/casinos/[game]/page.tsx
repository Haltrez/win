import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/config';
import { getCasinos } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/config';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CasinoModule } from '@/components/CasinoModule';
import { FAQ } from '@/components/FAQ';

/** "Best casinos for <table game>" pages: high-intent searches with a natural home next to our free tables. */
const GAMES = {
  blackjack: {
    name: 'Blackjack', free: '/table-games/blackjack', guide: '/guides/blackjack-basic-strategy', guideLabel: 'Blackjack basic strategy',
    title: `Best Blackjack Casinos ${SITE.year}: Real Money Blackjack Online`,
    description: 'Where to play blackjack for real money: the casinos we work with, filtered to your country, with what to check first – rules, side bets, live tables and limits. 18+.',
    intro: 'Blackjack is the table game where your decisions matter most, which also makes it the one where the casino\'s rules matter most. Before you deposit anywhere, practise on our free table with the "show book move" hint on, then check the points below at the casino you pick.',
    checks: [
      ['Blackjack pays 3:2, not 6:5', 'A 6:5 table roughly quadruples the house edge on the same game. Every casino shows the payout on the table or in the rules – skip any 6:5 table.'],
      ['Dealer stands on soft 17', 'S17 is better for you than H17 (dealer hits soft 17). Both exist online; the rules panel says which.'],
      ['Double after split, re-splitting', 'More options for you mean a lower edge. Our free table uses double after split and up to three hands per seat.'],
      ['Side bets are optional', '21+3 and Perfect Pairs carry a much higher house edge than the main hand. Fun occasionally; never a strategy.'],
      ['Live dealer tables', 'Most of our partners run live blackjack from Evolution or Pragmatic Play Live. Live tables are real-money only; the RNG versions often have a demo.'],
    ],
    faq: [
      { q: 'Which casino is best for blackjack?', a: 'For most players: one that pays 3:2, stands on soft 17, allows double after split, and offers both RNG and live tables. The casinos listed above are the ones we work with that accept players in your country; check the table rules at each before you play.' },
      { q: 'Can I practise blackjack before playing for real?', a: 'Yes – our free blackjack table uses six decks, dealer stands on soft 17 and pays 3:2, with a hint mode that shows the basic-strategy play for every hand. No sign-up.' },
      { q: 'Does basic strategy work online?', a: 'Yes. Basic strategy is the mathematically best play for each hand against each dealer upcard given the table rules. It doesn\'t beat the house edge, but it keeps it as low as the rules allow.' },
    ],
  },
  roulette: {
    name: 'Roulette', free: '/table-games/roulette', guide: '/guides/table-games-house-edge-compared', guideLabel: 'Table games house edge compared',
    title: `Best Roulette Casinos ${SITE.year}: European & Live Roulette Online`,
    description: 'Where to play roulette for real money: the casinos we work with, filtered to your country, plus what to check – single zero, live tables, bet limits and rules like La Partage. 18+.',
    intro: 'Roulette has no strategy that changes the odds, so the only thing that matters is which wheel you sit at. Single-zero (European or French) roulette is the game to look for; the double-zero American wheel nearly doubles the house edge for the same bets. Try our free European table first, then check these points at the casino.',
    checks: [
      ['Single zero only', 'European roulette has 37 pockets; American has 38 with a double zero. Same payouts, almost twice the edge on American – always pick the single-zero table.'],
      ['La Partage or En Prison', 'French rules that return half (or hold) an even-money bet when zero hits. Where offered, they cut the edge on red/black, odd/even and high/low in half.'],
      ['Live roulette', 'Live tables from Evolution and Pragmatic Play Live are the most popular format online; Lightning-style variants add multipliers but reduce the straight-up payout.'],
      ['Bet limits', 'Check the minimum and maximum per spot before you sit down, especially if you like covering many numbers.'],
      ['Automatic and speed roulette', 'Faster rounds mean more spins per hour and more exposure to the edge. Set a session budget before you start.'],
    ],
    faq: [
      { q: 'Which casino is best for roulette?', a: 'One with single-zero tables (European or French), ideally with La Partage on even-money bets, and live dealers if you want them. All the casinos above accept players in your country; pick the table, not the casino.' },
      { q: 'Is there a roulette strategy that works?', a: 'No betting system changes the house edge; every spin is independent. The only real choices are the wheel (single zero) and the rules (La Partage). Our free table lets you try any system with play money and see.' },
      { q: 'Can I play roulette for free first?', a: 'Yes – our free European roulette has the full betting layout and a real spinning wheel, no sign-up.' },
    ],
  },
  baccarat: {
    name: 'Baccarat', free: '/table-games/baccarat', guide: '/guides/baccarat-odds-explained', guideLabel: 'Baccarat odds explained',
    title: `Best Baccarat Casinos ${SITE.year}: Real Money Baccarat Online`,
    description: 'Where to play baccarat for real money: the casinos we work with, filtered to your country, and what to check – Banker commission, Tie payout, live Punto Banco and limits. 18+.',
    intro: 'Baccarat is the simplest table game to play well: bet Banker, avoid the Tie, and the rest is luck. Our free Punto Banco table uses eight decks and the standard third-card rules. Before you play for real, check these points at the casino you choose.',
    checks: [
      ['Banker commission', 'Standard is 5% on Banker wins (Banker pays 0.95:1). "No-commission" baccarat replaces it with a reduced payout on a Banker 6, which is usually worse for you.'],
      ['Tie pays 8:1 or 9:1', '9:1 is better, but the Tie bet is still the weakest on the table by far. Treat it as a side bet.'],
      ['Side bets', 'Pairs, Dragon bonus and similar bets carry a high house edge. Optional, never a plan.'],
      ['Live baccarat', 'Live Punto Banco and Speed Baccarat from Evolution and Pragmatic Play Live are the standard online. Squeeze tables are slower and more atmospheric, with the same odds.'],
      ['Bet limits', 'Baccarat tables range from low-limit to VIP; check the range before you sit down.'],
    ],
    faq: [
      { q: 'Which casino is best for baccarat?', a: 'One offering standard 5%-commission Banker bets, a 9:1 Tie, and live tables if you want them. The casinos above are the ones we work with that accept players in your country.' },
      { q: 'What is the best bet in baccarat?', a: 'Banker. Even after the 5% commission it has the lowest house edge on the table. Player is close behind; Tie is far worse.' },
      { q: 'Can I try baccarat for free?', a: 'Yes – our free baccarat table deals eight decks with the standard rules, no sign-up.' },
    ],
  },
} as const;

type Params = { game: string };
export const dynamicParams = false;
export function generateStaticParams(): Params[] { return Object.keys(GAMES).map((game) => ({ game })); }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { game } = await params;
  const g = GAMES[game as keyof typeof GAMES];
  if (!g) return {};
  return buildMetadata({ title: g.title, description: g.description, path: `/casinos/${game}` });
}

export default async function CasinosForGame({ params }: { params: Promise<Params> }) {
  const { game } = await params;
  const g = GAMES[game as keyof typeof GAMES];
  if (!g || !FEATURES.realMoney) notFound();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Casinos', path: '/casinos' }, { name: g.name, path: `/casinos/${game}` }]} />
      <h1>Best {g.name.toLowerCase()} casinos {SITE.year}</h1>
      <section className="prose">
        <p>{g.intro}</p>
        <p><Link className="btn btn-ghost" href={g.free}>Play {g.name.toLowerCase()} free first →</Link></p>
      </section>
      <CasinoModule casinos={getCasinos()} title={`Play ${g.name.toLowerCase()} for real money`} context={`casinos:${game}`} />
      <section className="prose">
        <h2>What to check before you deposit</h2>
        <dl className="feature-list">
          {g.checks.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <p>Read more: <Link href={g.guide}>{g.guideLabel}</Link> · <Link href="/table-games">All free table games</Link></p>
      </section>
      <FAQ items={[...g.faq]} />
      <p className="notice small">18+. Real-money play involves risk – you can lose your stake. Set deposit limits before you play and <Link href="/responsible-gambling">play responsibly</Link>.</p>
    </>
  );
}
