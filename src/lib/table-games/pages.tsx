import Link from 'next/link';
import type { ReactNode } from 'react';
import { BJ_HOUSE_EDGE, CHART_COLS, HARD, SOFT, PAIRS } from './blackjack';
import { ROULETTE_HOUSE_EDGE, PAYS } from './roulette';
import { BAC_HOUSE_EDGE } from './baccarat';
import { VP_HOUSE_EDGE, VP_RTP, VP_PAYTABLE } from './video-poker';
import { CH_HOUSE_EDGE, CH_ANTE_BONUS } from './casino-holdem';

export type GameKey = 'blackjack' | 'roulette' | 'baccarat' | 'video-poker' | 'casino-holdem';
export interface GamePage {
  slug: GameKey; name: string; short: string; h1: string; kicker: string;
  titles: string[]; description: string;
  /** House edge in % (best bet / optimal play) and the matching RTP line. */
  edge: number; edgeNote: string; rtp: string;
  facts: [string, string][];
  rules: ReactNode; strategy: ReactNode; faq: { q: string; a: string }[]; guides: string[];
  /** Short blurb for the hub card. */
  blurb: string;
  icon: ReactNode;
}

const pct = (n: number) => `${n.toFixed(2)}%`;
const Up = ({ n }: { n: number }) => <>{n === 11 ? 'A' : n}</>;

const BlackjackChart = () => {
  const rows = (table: Record<number, Record<number, string>>, label: (k: number) => string) => Object.keys(table).map(Number).map((k) => (
    <tr key={k}><th scope="row">{label(k)}</th>{CHART_COLS.map((c) => <td key={c} className={table[k][c]}>{table[k][c]}</td>)}</tr>
  ));
  return (
    <div className="table-wrap">
      <table className="bs-chart">
        <thead><tr><th scope="col">Your hand</th>{CHART_COLS.map((c) => <th key={c} scope="col">Dealer <Up n={c} /></th>)}</tr></thead>
        <tbody>
          <tr><th colSpan={11} scope="rowgroup">Hard totals</th></tr>
          {rows(Object.fromEntries(Object.entries(HARD).filter(([k]) => Number(k) >= 8 && Number(k) <= 17)), (k) => (k === 8 ? '8 or less' : k === 17 ? '17 or more' : String(k)))}
          <tr><th colSpan={11} scope="rowgroup">Soft totals (ace counted as 11)</th></tr>
          {rows(Object.fromEntries(Object.entries(SOFT).filter(([k]) => Number(k) >= 13)), (k) => `A,${k - 11}${k === 20 ? '' : ''}`)}
          <tr><th colSpan={11} scope="rowgroup">Pairs</th></tr>
          {rows(PAIRS, (k) => (k === 11 ? 'A,A' : `${k},${k}`))}
        </tbody>
      </table>
      <p className="bs-legend"><span><i style={{ background: '#7a1f2b' }} />H = Hit</span><span><i style={{ background: '#b8860b' }} />S = Stand</span><span><i style={{ background: '#1f6f9a' }} />D = Double (hit if not allowed)</span><span><i style={{ background: '#1f6f9a' }} />Ds = Double (stand if not allowed)</span><span><i style={{ background: '#1f8a4c' }} />P = Split</span></p>
    </div>
  );
};

const Icon = ({ d }: { d: ReactNode }) => <svg viewBox="0 0 100 100" aria-hidden>{d}</svg>;
const ICONS: Record<GameKey, ReactNode> = {
  blackjack: <Icon d={<><rect x="18" y="22" width="40" height="56" rx="6" fill="#fff" stroke="#c9c2ad" transform="rotate(-12 38 50)" /><text x="30" y="52" fontSize="26" fontWeight="800" fill="#c3202f" transform="rotate(-12 38 50)">A</text><rect x="44" y="24" width="40" height="56" rx="6" fill="#fff" stroke="#c9c2ad" transform="rotate(10 64 52)" /><text x="56" y="56" fontSize="26" fontWeight="800" fill="#15161a" transform="rotate(10 64 52)">K</text></>} />,
  roulette: <Icon d={<><circle cx="50" cy="50" r="46" fill="#5a3a16" /><circle cx="50" cy="50" r="40" fill="#e2b358" /><circle cx="50" cy="50" r="36" fill="#14161c" />{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M50 50 L${50 + 36 * Math.cos((i * 30 * Math.PI) / 180)} ${50 + 36 * Math.sin((i * 30 * Math.PI) / 180)} A36 36 0 0 1 ${50 + 36 * Math.cos(((i + 1) * 30 * Math.PI) / 180)} ${50 + 36 * Math.sin(((i + 1) * 30 * Math.PI) / 180)} Z`} fill={i % 2 ? '#b3152b' : '#14161c'} />)}<circle cx="50" cy="50" r="20" fill="#2a1c0a" stroke="#e2b358" strokeWidth="2" /><circle cx="50" cy="50" r="7" fill="#e2b358" /><circle cx="50" cy="19" r="4" fill="#fff" /></>} />,
  baccarat: <Icon d={<><rect x="12" y="30" width="34" height="48" rx="5" fill="#fff" stroke="#c9c2ad" /><text x="18" y="60" fontSize="22" fontWeight="800" fill="#15161a">9</text><rect x="54" y="30" width="34" height="48" rx="5" fill="#fff" stroke="#c9c2ad" /><text x="60" y="60" fontSize="22" fontWeight="800" fill="#c3202f">8</text><circle cx="50" cy="20" r="9" fill="#e2b358" /></>} />,
  'video-poker': <Icon d={<>{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={8 + i * 17} y={34 - (i === 2 ? 6 : 0)} width="15" height="24" rx="2.5" fill={i % 2 ? '#fff' : '#f4f1e8'} stroke="#c9c2ad" />)}<rect x="6" y="66" width="88" height="14" rx="4" fill="#14161c" stroke="#e2b358" /><text x="50" y="77" fontSize="9" fontWeight="800" fill="#e2b358" textAnchor="middle">JACKS OR BETTER</text></>} />,
  'casino-holdem': <Icon d={<>{[0, 1, 2].map((i) => <rect key={i} x={14 + i * 25} y="20" width="22" height="30" rx="3" fill="#fff" stroke="#c9c2ad" />)}<rect x="28" y="58" width="20" height="28" rx="3" fill="#fff" stroke="#c9c2ad" transform="rotate(-8 38 72)" /><rect x="50" y="58" width="20" height="28" rx="3" fill="#fff" stroke="#c9c2ad" transform="rotate(8 60 72)" /><circle cx="84" cy="74" r="9" fill="#c62828" stroke="#f3efe3" strokeWidth="2" strokeDasharray="4 3" /></>} />,
};

export const GAME_PAGES: Record<GameKey, GamePage> = {
  blackjack: {
    slug: 'blackjack', name: 'Blackjack', short: 'Blackjack', h1: 'Play Blackjack Free', kicker: 'Six-deck shoe · dealer stands on soft 17 · blackjack pays 3:2 · play money only',
    titles: ['Play Blackjack Free – 6-Deck Game with Basic Strategy Hints', 'Play Blackjack Free – 6-Deck, 3:2, Strategy Hints', 'Play Blackjack Free Online'],
    description: 'Play blackjack free with play money: a real 6-deck shoe, dealer stands on soft 17, 3:2 blackjack, splits and doubles. Turn on hints to see the basic strategy move for every hand.',
    edge: BJ_HOUSE_EDGE, edgeNote: 'with perfect basic strategy under these rules', rtp: `${(100 - BJ_HOUSE_EDGE).toFixed(2)}%`,
    facts: [['Decks', '6'], ['Dealer', 'Stands on soft 17'], ['Blackjack pays', '3 to 2'], ['Double', 'Any two cards, after splits too'], ['Split', 'Up to 3 hands'], ['Surrender', 'No']],
    blurb: 'The lowest house edge on the floor if you play the chart. Hints show the book move for every hand.',
    icon: ICONS.blackjack,
    rules: (
      <>
        <p>You and the dealer each get two cards; one dealer card stays face down. Cards 2–10 count face value, J/Q/K count 10 and an ace counts 1 or 11, whichever helps. The aim is to finish closer to 21 than the dealer without going over.</p>
        <ul>
          <li><strong>Hit</strong> takes another card, <strong>stand</strong> keeps your total. Go over 21 and you bust, losing the bet whatever the dealer does.</li>
          <li><strong>Double</strong> on any two cards: the bet doubles and you receive exactly one more card. Allowed after a split.</li>
          <li><strong>Split</strong> a pair (any two 10-value cards count) into two hands, each with its own bet. You can split again up to three hands. Split aces get one card each, and an ace plus a ten after a split is 21, not blackjack.</li>
          <li>The dealer draws to 16 and <strong>stands on every 17, including soft 17</strong> (A-6).</li>
          <li>A natural <strong>blackjack pays 3 to 2</strong>; a dealer blackjack beats everything except your blackjack, which pushes.</li>
          <li>No surrender, no insurance – both are left out so the table stays simple and the strategy chart stays short.</li>
        </ul>
        <p>The shoe holds six real decks shuffled with a cryptographic random number generator. It reshuffles when roughly a quarter of the cards remain, like a cut card on a live table. Nothing is weighted in either direction.</p>
      </>
    ),
    strategy: (
      <>
        <p>Basic strategy is the mathematically best decision for every hand against every dealer up-card when you are not counting cards. The chart below is the published multi-deck, stand-on-soft-17, double-after-split version – exactly the rules this table uses. With it the house edge is about {pct(BJ_HOUSE_EDGE)}; guessing typically costs 2% or more.</p>
        <BlackjackChart />
        <p>The pattern is easy to remember: stand on 17+, stand on 13–16 only against a 2–6, double 10 and 11 when the dealer is weaker, always split aces and 8s, never split 10s or 5s. Switch on <em>Show book move</em> above the table and the right button lights up with a one-line reason. Read the full walkthrough in our <Link href="/guides/blackjack-basic-strategy">blackjack basic strategy guide</Link>.</p>
      </>
    ),
    faq: [
      { q: 'Is this blackjack game really free?', a: 'Yes. You play with a 1,000-unit play-money balance that is stored only in your browser. Nothing can be won or lost, and there is no sign-up. You can reset the balance at any time.' },
      { q: 'What is the house edge of this blackjack table?', a: `About ${pct(BJ_HOUSE_EDGE)} with perfect basic strategy: six decks, dealer stands on soft 17, blackjack pays 3:2, double on any two cards including after a split, re-split to three hands, no surrender. That is among the lowest edges of any casino game.` },
      { q: 'Does the dealer hit or stand on soft 17 here?', a: 'The dealer stands on all 17s, including soft 17 (an ace and a six). That is the player-friendly rule; tables where the dealer hits soft 17 add about 0.2% to the house edge.' },
      { q: 'Are the cards really shuffled?', a: 'Yes. Six full decks are shuffled with the browser\'s cryptographic random number generator (crypto.getRandomValues) and dealt in order from a shoe that reshuffles when about a quarter of the cards are left. The game is not weighted for or against you.' },
      { q: 'What does "Show book move" do?', a: 'It highlights the basic strategy action for your current hand against the dealer\'s up-card and gives a one-line reason. Basic strategy is the best you can do without counting cards; following it keeps the house edge at its published minimum.' },
      { q: 'Can I count cards in this game?', a: 'You can practise: the shoe is dealt in order and shows how many cards remain. In a real casino, card counting is legal but casinos may ask counters to leave; online RNG games usually shuffle every hand, which makes counting useless there.' },
    ],
    guides: ['blackjack-basic-strategy', 'table-games-house-edge-compared'],
  },
  roulette: {
    slug: 'roulette', name: 'European Roulette', short: 'Roulette', h1: 'Free Roulette – European Single Zero', kicker: '37 pockets · full inside and outside layout · 2.70% house edge on every bet · play money only',
    titles: ['Free Roulette – Play European Single-Zero Roulette Online', 'Free Roulette – European Single Zero, No Sign-Up', 'Free Roulette Online'],
    description: 'Play free roulette on a European single-zero wheel: every inside and outside bet, correct 35:1 payouts, a real spinning wheel and no sign-up. See why every bet carries the same 2.70% house edge.',
    edge: ROULETTE_HOUSE_EDGE, edgeNote: 'on every bet (single zero)', rtp: `${(100 - ROULETTE_HOUSE_EDGE).toFixed(2)}%`,
    facts: [['Wheel', 'European, single zero'], ['Pockets', '37'], ['Straight up', '35 to 1'], ['Even money', '1 to 1'], ['La partage', 'No'], ['Bets', 'All inside & outside']],
    blurb: 'Single zero, real decelerating wheel, every bet from straight-up to the columns. Same 2.70% edge on all of them.',
    icon: ICONS.roulette,
    rules: (
      <>
        <p>Choose a chip value, place bets on the layout, then spin. The ball settles in one of 37 pockets (0–36) and every bet covering that number is paid at its fixed odds; all other chips are lost. The zero is green and counts for nothing except bets placed directly on it.</p>
        <div className="table-wrap"><table className="stats"><thead><tr><th>Bet</th><th>Covers</th><th>Pays</th></tr></thead><tbody>
          <tr><td>Straight up</td><td>1 number</td><td>{PAYS.straight} to 1</td></tr>
          <tr><td>Split</td><td>2 adjacent numbers</td><td>{PAYS.split} to 1</td></tr>
          <tr><td>Street</td><td>3 numbers in a row</td><td>{PAYS.street} to 1</td></tr>
          <tr><td>Corner</td><td>4 numbers in a square</td><td>{PAYS.corner} to 1</td></tr>
          <tr><td>Line</td><td>6 numbers in two rows</td><td>{PAYS.line} to 1</td></tr>
          <tr><td>Dozen / Column</td><td>12 numbers</td><td>{PAYS.dozen} to 1</td></tr>
          <tr><td>Red, black, odd, even, 1–18, 19–36</td><td>18 numbers</td><td>1 to 1</td></tr>
        </tbody></table></div>
        <p>Pick the inside bet type (straight, split, street, corner, line) with the selector above the layout, then tap a number. Outside bets are always a single tap. Undo removes the last chip, Rebet repeats your previous spin. This table has no la partage or en prison rule, so even-money bets lose in full on zero.</p>
      </>
    ),
    strategy: (
      <>
        <p>There is no strategy that beats roulette, and the maths shows why. Every bet is paid as if the wheel had 36 pockets, but it has 37. A straight-up number wins 1 in 37 and pays 35 to 1, so on average you get back 36/37 of your stake: a return of 97.30% and a house edge of {pct(ROULETTE_HOUSE_EDGE)}. Run the same sum for a dozen (12/37 × 3) or red (18/37 × 2) and you land on the same 97.30% every time.</p>
        <p>What you <em>can</em> choose is variance. Straight-up bets swing wildly; even-money bets grind. Betting systems such as the Martingale (double after each loss) change the shape of your results but not the average – they turn many small wins into a rare, large loss. If you want to play for a long time on a fixed budget, the book move is simply any even-money bet on a single-zero wheel, and avoiding American double-zero wheels, where the edge jumps to 5.26%. Our <Link href="/guides/table-games-house-edge-compared">house-edge comparison</Link> puts roulette next to the other table games.</p>
      </>
    ),
    faq: [
      { q: 'Is this free roulette game rigged?', a: 'No. Each spin picks one of the 37 pockets with the browser\'s cryptographic random number generator; the wheel animation simply decelerates to that result. Every pocket has exactly a 1-in-37 chance, in both directions.' },
      { q: 'What is the house edge in European roulette?', a: `${pct(ROULETTE_HOUSE_EDGE)} on every bet. Payouts assume 36 pockets while the wheel has 37, so the casino keeps 1/37 of all money wagered in the long run. American roulette, with a double zero, has a 5.26% edge.` },
      { q: 'Which roulette bet has the best odds?', a: 'They are all the same on a single-zero wheel: 97.30% return. Even-money bets (red/black, odd/even, 1–18/19–36) win most often, so they produce the smoothest results, but they do not improve the long-term return. Only tables with la partage or en prison lower the edge on even-money bets, to 1.35%.' },
      { q: 'Can a betting system like the Martingale win at roulette?', a: 'No. A system changes when you win and lose, not how much the wheel returns on average. Doubling after losses produces frequent small wins and occasional very large losses that cancel them out, and table limits stop the doubling anyway.' },
      { q: 'What is the difference between European and French roulette?', a: 'Both use a single zero. French roulette adds la partage (half your even-money stake back when zero hits) or en prison, which halves the house edge on those bets to 1.35%. The layout and payouts are otherwise the same.' },
    ],
    guides: ['table-games-house-edge-compared'],
  },
  baccarat: {
    slug: 'baccarat', name: 'Baccarat', short: 'Baccarat', h1: 'Free Baccarat Game – Punto Banco', kicker: 'Eight decks · standard third-card rules · Banker 0.95:1, Tie 8:1 · play money only',
    titles: ['Free Baccarat Game – Play Punto Banco Online, No Sign-Up', 'Free Baccarat Game – Punto Banco, 8 Decks', 'Free Baccarat Game Online'],
    description: 'Play a free baccarat game (Punto Banco) with eight real decks, the standard third-card tableau, Banker at 0.95:1 and Tie at 8:1. See the odds behind each bet and why Banker is the book move.',
    edge: BAC_HOUSE_EDGE.banker, edgeNote: 'on the Banker bet (Player 1.24%, Tie 14.36%)', rtp: `${(100 - BAC_HOUSE_EDGE.banker).toFixed(2)}% on Banker`,
    facts: [['Decks', '8'], ['Player pays', '1 to 1'], ['Banker pays', '0.95 to 1'], ['Tie pays', '8 to 1'], ['Third card', 'Standard tableau'], ['Decisions', 'None – bet only']],
    blurb: 'Pure odds: no decisions after the bet. Watch the third-card rules play out and learn why Banker is the best bet in the pit.',
    icon: ICONS.baccarat,
    rules: (
      <>
        <p>Baccarat is a comparison between two hands, Player and Banker. You bet on which will finish closer to 9, or on a Tie. Cards 2–9 count face value, tens and court cards count 0, aces count 1, and only the last digit of a total matters, so 7 + 8 = 15 counts as 5.</p>
        <ul>
          <li>Two cards each. A total of 8 or 9 is a <strong>natural</strong> and ends the coup at once.</li>
          <li>Otherwise the <strong>Player</strong> draws a third card on 0–5 and stands on 6–7.</li>
          <li>The <strong>Banker</strong> then follows the tableau: always draw on 0–2; on 3 draw unless the Player's third card was an 8; on 4 draw if it was 2–7; on 5 draw if it was 4–7; on 6 draw if it was 6–7; always stand on 7. If the Player stood, the Banker draws on 0–5 and stands on 6–7.</li>
          <li>Player wins pay 1 to 1. Banker wins pay 0.95 to 1 (a 5% commission, because the drawing rules favour the Banker). Tie pays 8 to 1, and Player/Banker bets push on a tie.</li>
        </ul>
        <p>Eight decks are shuffled with a cryptographic random number generator and dealt from a shoe that reshuffles when a quarter remains. Everything after your bet is automatic – there are no decisions to make.</p>
      </>
    ),
    strategy: (
      <>
        <p>Because the third-card rules are fixed, baccarat has no playing strategy – only a betting choice, and the numbers are clear. Over eight decks the Banker hand wins 45.86% of coups, the Player hand 44.62%, and 9.52% are ties. After the 5% commission the Banker bet keeps a house edge of {pct(BAC_HOUSE_EDGE.banker)}, Player {pct(BAC_HOUSE_EDGE.player)}, and Tie a hefty {pct(BAC_HOUSE_EDGE.tie)}.</p>
        <p>So the book move is always Banker. Switch on <em>Show book move</em> and the Banker spot is highlighted. Streaks on the bead road are just history: the shoe has no memory, and "following the shoe" or betting against a run changes nothing. Side bets and no-commission variants usually hide a bigger edge (a no-commission table paying 1:2 on Banker 6 has a 1.46% edge). See the <Link href="/guides/baccarat-odds-explained">baccarat odds guide</Link> for the full breakdown.</p>
      </>
    ),
    faq: [
      { q: 'Is Banker or Player the better bet in baccarat?', a: `Banker. Even after the 5% commission its house edge is ${pct(BAC_HOUSE_EDGE.banker)}, against ${pct(BAC_HOUSE_EDGE.player)} on Player. The Tie bet, at 8 to 1, has a ${pct(BAC_HOUSE_EDGE.tie)} edge and is the one to avoid.` },
      { q: 'Why does the Banker bet pay only 0.95 to 1?', a: 'The third-card rules let the Banker act last with knowledge of the Player\'s third card, so the Banker hand wins more often (45.9% vs 44.6%, ignoring ties). The 5% commission balances that advantage, leaving the casino a small edge on both bets.' },
      { q: 'Do I make any decisions in baccarat?', a: 'Only the bet. Whether a third card is drawn is decided by a fixed tableau that the game applies automatically. That is why baccarat strategy is purely about which bet you choose and how much you stake.' },
      { q: 'Does following streaks on the roadmap help?', a: 'No. Each coup is independent and the shoe has no memory. The roadmap is a record of what happened, not a forecast. It is shown here because it is part of the game\'s look and feel, not because it predicts anything.' },
      { q: 'Is this free baccarat game the same as in a casino?', a: 'The rules are the standard Punto Banco rules used in casinos worldwide: eight decks, the same third-card tableau, 1:1, 0.95:1 and 8:1 payouts. Only the money is different – you play with a 1,000-unit play balance that cannot be cashed out.' },
    ],
    guides: ['baccarat-odds-explained', 'table-games-house-edge-compared'],
  },
  'video-poker': {
    slug: 'video-poker', name: 'Jacks or Better Video Poker', short: 'Video poker', h1: 'Jacks or Better Free – 9/6 Video Poker', kicker: 'Full-pay 9/6 table · 99.54% with optimal play · hold/draw with strategy hints · play money only',
    titles: ['Jacks or Better Free – Play 9/6 Video Poker Online', 'Jacks or Better Free – 9/6 Full Pay Video Poker', 'Jacks or Better Free Online'],
    description: 'Play Jacks or Better free on the full-pay 9/6 table (99.54% return). Five coins, hold and draw, correct hand evaluation and a hint mode that shows the optimal hold for every deal.',
    edge: VP_HOUSE_EDGE, edgeNote: 'with optimal strategy at five coins', rtp: `${VP_RTP.toFixed(2)}%`,
    facts: [['Paytable', '9/6 full pay'], ['Return', `${VP_RTP.toFixed(2)}%`], ['Full house', '9 for 1'], ['Flush', '6 for 1'], ['Royal flush', '800 for 1 (5 coins)'], ['Minimum hand', 'Pair of Jacks']],
    blurb: 'The classic full-pay machine. Learn the hold strategy that gets you to 99.54%, one of the best returns in any casino.',
    icon: ICONS['video-poker'],
    rules: (
      <>
        <p>Jacks or Better is five-card draw against a paytable instead of other players. Choose a coin value; every hand bets five coins. You are dealt five cards from a freshly shuffled 52-card deck, tap the ones you want to <strong>hold</strong>, and <strong>draw</strong> replacements for the rest. The final hand is paid according to the table below – multiplied by the number of coins.</p>
        <div className="table-wrap"><table className="stats"><thead><tr><th>Hand</th><th>Pays (per coin)</th><th>At 5 coins</th></tr></thead><tbody>
          {VP_PAYTABLE.map((p) => <tr key={p.key}><td>{p.label}</td><td>{p.pays} for 1</td><td>{p.pays * 5}</td></tr>)}
        </tbody></table></div>
        <p>"9/6" refers to the full house and flush payouts – the two numbers that vary most between machines. A 9/6 table returns {VP_RTP.toFixed(2)}% with perfect play; an 8/5 version of the same game returns only 97.30%. The royal flush pays 800 for 1 only at five coins (250 for 1 at fewer), which is why max coins is the standard advice.</p>
      </>
    ),
    strategy: (
      <>
        <p>Video poker is one of the few casino games where decisions matter a lot. Optimal play comes down to ranking what you were dealt: hold the highest-ranked pattern and draw to it. Hint mode uses the standard ranked list, which gets within a few hundredths of a percent of the computer-perfect strategy.</p>
        <ol>
          <li>Royal flush, straight flush, four of a kind – hold</li>
          <li>Four to a royal flush (even breaking a flush or straight)</li>
          <li>Full house, flush, straight, three of a kind</li>
          <li>Four to a straight flush</li>
          <li>Two pair</li>
          <li>High pair (Jacks or better)</li>
          <li>Three to a royal flush</li>
          <li>Four to a flush</li>
          <li>Low pair</li>
          <li>Four to an outside straight</li>
          <li>Three to a straight flush with as many high cards as gaps</li>
          <li>Four to an inside straight with three high cards</li>
          <li>Two suited high cards</li>
          <li>Other three to a straight flush</li>
          <li>Unsuited J-Q-K</li>
          <li>Two unsuited high cards (keep the lowest two of three)</li>
          <li>Suited 10 with a J, Q or K</li>
          <li>One high card</li>
          <li>Draw five</li>
        </ol>
        <p>The counter-intuitive rules are the valuable ones: keep a low pair over a four-card straight draw, keep three to a royal over a four-card flush, and break a made flush for four to a royal. Our <Link href="/guides/jacks-or-better-strategy">Jacks or Better strategy guide</Link> explains each of them with the expected values.</p>
      </>
    ),
    faq: [
      { q: 'What does 9/6 mean in Jacks or Better?', a: 'The payouts for a full house (9 for 1) and a flush (6 for 1). These two numbers identify the "full pay" version of the game, which returns 99.54% with optimal play. Lower tables such as 8/5 (97.30%) or 7/5 (96.15%) look identical otherwise.' },
      { q: 'Is 99.54% the real return of this free game?', a: 'Yes, with optimal strategy and five coins bet. The deck is shuffled with a cryptographic random number generator and the paytable is the full-pay table, so the long-run return is the published 99.54%. Mistakes in your hold decisions lower it.' },
      { q: 'Why should I always bet five coins?', a: 'Because the royal flush pays 800 for 1 at five coins but only 250 for 1 at one to four coins. That difference is worth about 1.5% of return. If five coins is too much, lower the coin value instead of the coin count.' },
      { q: 'Should I keep a low pair or go for a straight?', a: 'Keep the low pair. A low pair (2s to 10s) returns about 0.82 coins per coin bet on average; four to an outside straight returns about 0.68. The pair turns into two pair, trips, a full house or quads often enough to be the better hold.' },
      { q: 'Does the hint mode play perfectly?', a: 'It uses the standard ranked-pattern strategy, which is what most expert players memorise. It gives up only about 0.08% against a computer-generated perfect strategy, and the hints explain the reasoning for each hold.' },
    ],
    guides: ['jacks-or-better-strategy', 'table-games-house-edge-compared'],
  },
  'casino-holdem': {
    slug: 'casino-holdem', name: "Casino Hold'em", short: "Casino Hold'em", h1: "Casino Hold'em Free – Play Against the Dealer", kicker: 'Ante, call 2× or fold · dealer qualifies with a pair of 4s · ante bonus up to 100:1 · play money only',
    titles: ["Casino Hold'em Free – Play Poker Against the Dealer Online", "Casino Hold'em Free – Ante, Call or Fold Poker", "Casino Hold'em Free Online"],
    description: "Play Casino Hold'em free: ante, see the flop, then call double or fold against the dealer. Standard rules, dealer qualifies with a pair of 4s, ante bonus paytable, and hints that show when folding is right.",
    edge: CH_HOUSE_EDGE, edgeNote: 'of the ante with optimal play (0.82% of total money bet)', rtp: `${(100 - CH_HOUSE_EDGE).toFixed(2)}% of the ante`,
    facts: [['Ante', 'Your choice'], ['Call bet', '2 × ante'], ['Dealer qualifies', 'Pair of 4s or better'], ['Ante bonus', 'Up to 100 to 1'], ['Call pays', '1 to 1'], ['Fold', 'Lose the ante']],
    blurb: "Texas hold'em against the house. Call with about 82% of your hands – hint mode shows the common fold cases.",
    icon: ICONS['casino-holdem'],
    rules: (
      <>
        <p>Casino Hold'em plays like Texas hold'em against the house with no bluffing. Place an <strong>ante</strong>. You and the dealer get two cards (the dealer's stay face down) and three community cards are turned over.</p>
        <ul>
          <li><strong>Fold</strong> and lose the ante, or <strong>call</strong> by betting exactly twice the ante. The turn and river are then dealt and the dealer's cards are revealed.</li>
          <li>Both sides make their best five-card hand from seven cards. The dealer <strong>qualifies</strong> with a pair of 4s or better.</li>
          <li>Dealer doesn't qualify: the ante is paid by the bonus table below and the call bet pushes.</li>
          <li>Dealer qualifies and you win: the ante is paid by the bonus table and the call bet pays 1 to 1. Ties push both bets; a losing hand loses both.</li>
        </ul>
        <div className="table-wrap"><table className="stats"><thead><tr><th>Your five-card hand</th><th>Ante pays</th></tr></thead><tbody>
          {CH_ANTE_BONUS.map((p) => <tr key={p.label}><td>{p.label}</td><td>{p.pays} to 1</td></tr>)}
        </tbody></table></div>
        <p>A fresh 52-card deck is shuffled with a cryptographic random number generator for every hand. With the paytable above and optimal play the house edge is {pct(CH_HOUSE_EDGE)} of the ante, or 0.82% of all money wagered once calls are counted.</p>
      </>
    ),
    strategy: (
      <>
        <p>The single decision is call or fold after the flop, and the maths says to call far more often than poker instinct suggests: roughly 82% of hands. Folding gives up the ante for certain, while calling risks two more units for a shot at the ante bonus plus a dealer that fails to qualify about a quarter of the time.</p>
        <ul>
          <li><strong>Always call</strong> with any pair or better – even when the pair is on the board – with four to a flush, with an open-ended straight draw, and with any ace-high or king-high hand.</li>
          <li><strong>Call</strong> with queen-high or jack-high unless the flop is three cards of one suit and you hold none of that suit.</li>
          <li><strong>Fold</strong> the rest: two low unpaired cards (10 or lower) that missed the flop with no flush or straight draw. That is the ~18% of hands where calling costs more than the ante you save.</li>
        </ul>
        <p>Hint mode applies these rules to the flop you see and highlights Call or Fold with the reason. The ante bonus is paid on your own hand only, so a big hand against a non-qualifying dealer still collects the full bonus. Compare the 2.16% edge with the other games in our <Link href="/guides/table-games-house-edge-compared">house-edge comparison</Link>.</p>
      </>
    ),
    faq: [
      { q: "How often should I fold in Casino Hold'em?", a: 'About 18% of the time, with optimal play. Fold only when both of your cards are 10 or lower, you have no pair, and there is no four-card flush or open-ended straight draw. Everything stronger – any pair, ace- or king-high, any real draw – is a call.' },
      { q: "What is the house edge in Casino Hold'em?", a: `${pct(CH_HOUSE_EDGE)} of the ante with the standard paytable (royal 100:1, straight flush 20:1, four of a kind 10:1, full house 3:1, flush 2:1, straight or less 1:1). Measured against all money bet including calls, the "element of risk" is 0.82%.` },
      { q: 'What does it mean when the dealer does not qualify?', a: 'The dealer needs at least a pair of 4s in their best five-card hand. If they fall short, you win the ante bet automatically at the bonus paytable odds and your call bet is returned as a push, regardless of your own hand.' },
      { q: 'Is the ante bonus paid if I lose the hand?', a: 'No. The ante bonus pays only when you win or the dealer fails to qualify. If the dealer qualifies and beats you, both the ante and the call bet are lost even if you hold a flush.' },
      { q: "Is Casino Hold'em the same as Texas hold'em?", a: 'The hand rankings and community cards are the same, but you play against the dealer, not other players, there is no bluffing, and the only decision is whether to call twice the ante after the flop. The dealer plays automatically by the qualifying rule.' },
    ],
    guides: ['table-games-house-edge-compared'],
  },
};
export const GAME_ORDER: GameKey[] = ['blackjack', 'roulette', 'baccarat', 'video-poker', 'casino-holdem'];
