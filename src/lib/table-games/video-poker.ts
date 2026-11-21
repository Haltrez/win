import type { Card } from './cards';
import { freshDeck } from './cards';
import { shuffle } from './rng';
import { evaluate5, type HandCategory } from './poker';

/**
 * Jacks or Better video poker, 9/6 "full pay" table. Per-coin payouts; the royal pays 800 per coin at 5 coins
 * (4,000 coins) which is what gives the published 99.54% return with optimal play.
 */
export const VP_HOUSE_EDGE = 0.46;
export const VP_RTP = 99.54;
export const COINS = 5;
export type VpCategory = Exclude<HandCategory, 'high-card' | 'pair'> | 'jacks-or-better' | 'nothing';
export const VP_PAYTABLE: { key: VpCategory; label: string; pays: number }[] = [
  { key: 'royal-flush', label: 'Royal flush', pays: 800 },
  { key: 'straight-flush', label: 'Straight flush', pays: 50 },
  { key: 'four-of-a-kind', label: 'Four of a kind', pays: 25 },
  { key: 'full-house', label: 'Full house', pays: 9 },
  { key: 'flush', label: 'Flush', pays: 6 },
  { key: 'straight', label: 'Straight', pays: 4 },
  { key: 'three-of-a-kind', label: 'Three of a kind', pays: 3 },
  { key: 'two-pair', label: 'Two pair', pays: 2 },
  { key: 'jacks-or-better', label: 'Jacks or Better', pays: 1 },
];

export function classify(cards: Card[]): VpCategory {
  const r = evaluate5(cards);
  if (r.category === 'pair') return r.kickers[0] >= 11 ? 'jacks-or-better' : 'nothing';
  if (r.category === 'high-card') return 'nothing';
  return r.category;
}
/** Per-coin payout; multiply by coins bet. Royal at max coins pays 800 (otherwise 250). */
export function vpPayout(cards: Card[], coins = COINS): number {
  const cat = classify(cards);
  const row = VP_PAYTABLE.find((p) => p.key === cat);
  if (!row) return 0;
  if (cat === 'royal-flush' && coins < COINS) return 250 * coins;
  return row.pays * coins;
}

export function vpDeal(): { deck: Card[]; hand: Card[] } {
  const deck = shuffle(freshDeck());
  return { hand: deck.splice(0, 5), deck };
}
export function vpDraw(deck: Card[], hand: Card[], held: boolean[]): Card[] {
  return hand.map((c, i) => (held[i] ? c : deck.shift()!));
}

/* ------------------------------------------------------------- hold strategy (standard ranked-pattern list) */
export interface VpAdvice { hold: boolean[]; rule: string; }
const isHigh = (c: Card) => c.rank >= 11;
const combos = <T,>(arr: T[], k: number): T[][] => {
  const out: T[][] = [];
  const rec = (start: number, acc: T[]) => { if (acc.length === k) { out.push(acc); return; } for (let i = start; i < arr.length; i++) rec(i + 1, [...acc, arr[i]]); };
  rec(0, []); return out;
};
const mask = (hand: Card[], keep: Card[]) => hand.map((c) => keep.includes(c));
const ROYAL = new Set([10, 11, 12, 13, 14]);
/** Does this set of distinct ranks fit inside some 5-card straight window? Returns the number of windows (outs). */
function straightWindows(ranks: number[]): number {
  const rs = [...new Set(ranks)];
  if (rs.length !== ranks.length) return 0;
  let n = 0;
  for (let hi = 5; hi <= 14; hi++) {
    const win = hi === 5 ? [14, 2, 3, 4, 5] : [hi - 4, hi - 3, hi - 2, hi - 1, hi];
    if (rs.every((r) => win.includes(r))) n++;
  }
  return n;
}

export function vpStrategy(hand: Card[]): VpAdvice {
  const cat = classify(hand);
  const byRank = new Map<number, Card[]>();
  for (const c of hand) byRank.set(c.rank, [...(byRank.get(c.rank) ?? []), c]);
  const groups = [...byRank.values()].sort((a, b) => b.length - a.length || b[0].rank - a[0].rank);
  const suited4 = combos(hand, 4).filter((cs) => cs.every((c) => c.suit === cs[0].suit));
  const suited3 = combos(hand, 3).filter((cs) => cs.every((c) => c.suit === cs[0].suit));

  // 1. Pat royal, straight flush, four of a kind
  if (cat === 'royal-flush' || cat === 'straight-flush') return { hold: [true, true, true, true, true], rule: 'Made hand: hold everything.' };
  if (cat === 'four-of-a-kind') return { hold: mask(hand, groups[0]), rule: 'Four of a kind: hold the four (the fifth card cannot improve it).' };
  // 2. Four to a royal flush
  const royal4 = suited4.find((cs) => cs.every((c) => ROYAL.has(c.rank)));
  if (royal4) return { hold: mask(hand, royal4), rule: 'Four to a royal flush beats any made flush or straight: one card from 800x.' };
  // 3. Pat full house, flush, straight, three of a kind
  if (cat === 'full-house' || cat === 'flush' || cat === 'straight') return { hold: [true, true, true, true, true], rule: 'Made hand: hold everything.' };
  if (cat === 'three-of-a-kind') return { hold: mask(hand, groups[0]), rule: 'Three of a kind: hold the trips and draw two for a full house or quads.' };
  // 4. Four to a straight flush
  const sf4 = suited4.find((cs) => straightWindows(cs.map((c) => c.rank)) > 0);
  if (sf4) return { hold: mask(hand, sf4), rule: 'Four to a straight flush: the straight-flush and flush outs beat a low pair.' };
  // 5. Two pair
  if (cat === 'two-pair') return { hold: mask(hand, [...groups[0], ...groups[1]]), rule: 'Two pair: hold both pairs and draw for the full house.' };
  // 6. High pair
  if (cat === 'jacks-or-better') return { hold: mask(hand, groups[0]), rule: 'High pair (Jacks or better): already a paying hand, draw three.' };
  // 7. Three to a royal flush
  const royal3 = suited3.find((cs) => cs.every((c) => ROYAL.has(c.rank)));
  if (royal3) return { hold: mask(hand, royal3), rule: 'Three to a royal flush: worth more than a four-card flush draw.' };
  // 8. Four to a flush
  if (suited4.length) return { hold: mask(hand, suited4[0]), rule: 'Four to a flush: 9 outs to a 6x flush.' };
  // 9. Low pair
  if (groups[0].length === 2) return { hold: mask(hand, groups[0]), rule: 'Low pair: it beats drawing to a straight – trips and two pair come often enough.' };
  // 10. Four to an outside straight
  const ranks4 = combos(hand, 4).filter((cs) => new Set(cs.map((c) => c.rank)).size === 4);
  const outside4 = ranks4.find((cs) => { const r = cs.map((c) => c.rank).sort((a, b) => a - b); return r[3] - r[0] === 3 && r[0] !== 2 && r[3] !== 14; });
  if (outside4) return { hold: mask(hand, outside4), rule: 'Four to an outside straight: 8 outs to a 4x straight.' };
  // Three to a straight flush, graded the standard way: type 1 (high cards ≥ gaps), type 3 (two gaps and no high
  // card, ace-low, or 2-3-4), type 2 (the rest).
  const sfType = (cs: Card[]) => {
    let r: number[] = cs.map((c) => c.rank).sort((a, b) => a - b);
    // an ace that only fits the wheel (A-2-3-4-5) counts as 1 and the draw is "ace-low"
    const aceLow = r[2] === 14 && r[1] <= 5;
    if (aceLow) r = [1, r[0], r[1]];
    const gaps = r[2] - r[0] - 2;
    const highs = cs.filter(isHigh).length;
    if (aceLow || (r[0] === 2 && r[1] === 3 && r[2] === 4)) return 3;
    if (highs >= gaps) return 1;
    if (gaps >= 2 && highs === 0) return 3;
    return 2;
  };
  const sf3s = suited3.filter((cs) => straightWindows(cs.map((c) => c.rank)) > 0);
  // 11. Three to a straight flush, type 1
  const sf3a = sf3s.find((cs) => sfType(cs) === 1);
  if (sf3a) return { hold: mask(hand, sf3a), rule: 'Three to a straight flush with high cards: a live draw to several paying hands.' };
  // 12. Four to an inside straight with three or more high cards (J-Q-K-A type)
  const inside4High = ranks4.find((cs) => straightWindows(cs.map((c) => c.rank)) > 0 && cs.filter(isHigh).length >= 3);
  if (inside4High) return { hold: mask(hand, inside4High), rule: 'Inside straight draw with three high cards: the high pairs make it worth keeping.' };
  // 13. Two suited high cards
  const suitedHigh2 = combos(hand.filter(isHigh), 2).find((cs) => cs[0].suit === cs[1].suit);
  if (suitedHigh2) return { hold: mask(hand, suitedHigh2), rule: 'Two suited high cards: keep the royal and high-pair chances together.' };
  // 14. Three to a straight flush, type 2
  const sf3b = sf3s.find((cs) => sfType(cs) === 2);
  if (sf3b) return { hold: mask(hand, sf3b), rule: 'Three to a straight flush: better than drawing to unsuited high cards.' };
  // 15. Unsuited J-Q-K
  const highs = hand.filter(isHigh).sort((a, b) => a.rank - b.rank);
  if (highs.length === 3 && highs[0].rank === 11 && highs[2].rank === 13) return { hold: mask(hand, highs), rule: 'Unsuited J-Q-K: three high cards that also keep an open straight draw.' };
  // 16. Two unsuited high cards (the lowest two when there are three)
  if (highs.length >= 2) return { hold: mask(hand, highs.slice(0, 2)), rule: highs.length > 2 ? 'Three unsuited high cards: keep the lowest two – they pair just as well and leave more straights.' : 'Two unsuited high cards: draw three for a high pair.' };
  // 17. Suited 10 + high card
  const tenHigh = combos(hand, 2).find((cs) => cs[0].suit === cs[1].suit && cs.some((c) => c.rank === 10) && cs.some(isHigh));
  if (tenHigh) return { hold: mask(hand, tenHigh), rule: 'Suited 10 and a high card: keeps a thin royal chance alive.' };
  // 18. One high card
  if (highs.length === 1) return { hold: mask(hand, highs), rule: 'One high card: hold it and draw four.' };
  // 19. Three to a straight flush, type 3
  const sf3c = sf3s[0];
  if (sf3c) return { hold: mask(hand, sf3c), rule: 'Weak three to a straight flush: still better than five new cards.' };
  return { hold: [false, false, false, false, false], rule: 'Nothing worth keeping: draw five new cards.' };
}
