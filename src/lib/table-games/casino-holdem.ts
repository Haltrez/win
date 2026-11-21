import type { Card } from './cards';
import { freshDeck } from './cards';
import { shuffle } from './rng';
import { evaluateBest, type HandCategory, type HandRank } from './poker';

/**
 * Casino Hold'em – standard rules: ante, then call (2× ante) or fold after the flop. Dealer qualifies with a pair
 * of 4s or better. The ante pays by the paytable below whenever the player wins or the dealer fails to qualify;
 * the call bet pays 1:1 when the player beats a qualified dealer. Ties push.
 */
export const CH_HOUSE_EDGE = 2.16; // of the ante, with optimal play (element of risk 0.82%)
export const CH_ANTE_BONUS: { label: string; cats: HandCategory[]; pays: number }[] = [
  { label: 'Royal flush', cats: ['royal-flush'], pays: 100 },
  { label: 'Straight flush', cats: ['straight-flush'], pays: 20 },
  { label: 'Four of a kind', cats: ['four-of-a-kind'], pays: 10 },
  { label: 'Full house', cats: ['full-house'], pays: 3 },
  { label: 'Flush', cats: ['flush'], pays: 2 },
  { label: 'Straight or lower', cats: ['straight', 'three-of-a-kind', 'two-pair', 'pair', 'high-card'], pays: 1 },
];
export const anteBonusPays = (cat: HandCategory) => CH_ANTE_BONUS.find((r) => r.cats.includes(cat))!.pays;

export interface ChState {
  phase: 'bet' | 'decide' | 'settled';
  ante: number; call: number;
  player: Card[]; dealer: Card[]; board: Card[];
  deck: Card[];
  result?: { playerRank: HandRank; dealerRank: HandRank; dealerQualifies: boolean; outcome: 'fold' | 'win' | 'lose' | 'push' | 'no-qualify'; returned: number };
}

/** Dealer needs a pair of 4s or better: a pair whose rank ≥ 4, or anything above a pair. */
export function dealerQualifies(r: HandRank): boolean {
  if (r.category === 'high-card') return false;
  if (r.category === 'pair') return r.kickers[0] >= 4;
  return true;
}

export function chDeal(ante: number): ChState {
  const deck = shuffle(freshDeck());
  const player = [deck.pop()!, deck.pop()!];
  const dealer = [deck.pop()!, deck.pop()!];
  const board = [deck.pop()!, deck.pop()!, deck.pop()!];
  return { phase: 'decide', ante, call: 0, player, dealer, board, deck };
}

export function chFold(s: ChState): ChState {
  const playerRank = evaluateBest([...s.player, ...s.board]);
  const dealerRank = evaluateBest([...s.dealer, ...s.board]);
  return { ...s, phase: 'settled', result: { playerRank, dealerRank, dealerQualifies: false, outcome: 'fold', returned: 0 } };
}

export function chCall(s: ChState): ChState {
  const deck = [...s.deck]; const board = [...s.board, deck.pop()!, deck.pop()!];
  const call = s.ante * 2;
  const playerRank = evaluateBest([...s.player, ...board]);
  const dealerRank = evaluateBest([...s.dealer, ...board]);
  const q = dealerQualifies(dealerRank);
  const bonus = anteBonusPays(playerRank.category);
  let outcome: NonNullable<ChState['result']>['outcome']; let returned = 0;
  if (!q) { outcome = 'no-qualify'; returned = s.ante * (1 + bonus) + call; }
  else if (playerRank.score > dealerRank.score) { outcome = 'win'; returned = s.ante * (1 + bonus) + call * 2; }
  else if (playerRank.score === dealerRank.score) { outcome = 'push'; returned = s.ante + call; }
  else { outcome = 'lose'; returned = 0; }
  return { ...s, phase: 'settled', deck, board, call, result: { playerRank, dealerRank, dealerQualifies: q, outcome, returned } };
}

/* ------------------------------------------------------------------- strategy: call ~82% of hands, fold ~18% */
export interface ChAdvice { action: 'call' | 'fold'; reason: string; }
/**
 * Standard published guidance: call with any pair or better, any ace- or king-high, any four to a flush or
 * open-ended straight draw, and queen/jack-high unless the flop is single-suited and you hold none of that suit.
 * Fold the rest – two low unpaired cards that missed the flop with no draw (~18% of hands).
 */
export function chStrategy(player: Card[], flop: Card[]): ChAdvice {
  const five = [...player, ...flop];
  const r = evaluateBest(five);
  if (r.category !== 'high-card') return { action: 'call', reason: `${r.category === 'pair' ? 'A pair' : 'A made hand'} on the flop: always call, even when the pair is on the board.` };
  const suits = new Map<string, number>(); for (const c of five) suits.set(c.suit, (suits.get(c.suit) ?? 0) + 1);
  if ([...suits.values()].some((n) => n >= 4)) return { action: 'call', reason: 'Four to a flush: too many outs to fold.' };
  const ranks = [...new Set(five.map((c) => c.rank))].sort((a, b) => a - b);
  for (let i = 0; i + 3 < ranks.length; i++) if (ranks[i + 3] - ranks[i] === 3 && ranks[i] > 2 && ranks[i + 3] < 14) return { action: 'call', reason: 'Open-ended straight draw: eight outs, call.' };
  const hi = Math.max(player[0].rank, player[1].rank);
  if (hi >= 13) return { action: 'call', reason: `${hi === 14 ? 'Ace' : 'King'}-high: a high card in hand beats the dealer often enough to call.` };
  const flopSuited = new Set(flop.map((c) => c.suit)).size === 1;
  const haveSuit = flopSuited && player.some((c) => c.suit === flop[0].suit);
  if (hi >= 11) {
    if (flopSuited && !haveSuit) return { action: 'fold', reason: `${hi === 12 ? 'Queen' : 'Jack'}-high, but the flop is one suit and you hold none of it: the dealer's flush chances tip this to a fold.` };
    return { action: 'call', reason: `${hi === 12 ? 'Queen' : 'Jack'}-high with no draw is marginal, but the ante bonus and dealer non-qualifies make calling right.` };
  }
  return { action: 'fold', reason: 'Two low cards that missed the flop with no draw: this is one of the ~18% of hands to fold.' };
}
