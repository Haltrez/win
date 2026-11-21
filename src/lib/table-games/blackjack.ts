import type { Card } from './cards';
import { Shoe } from './cards';

/**
 * Blackjack – house rules used on /table-games/blackjack:
 *  6-deck shoe · dealer stands on soft 17 · blackjack pays 3:2 · double on any two cards · split up to 3 hands
 *  (two re-splits) · double after split allowed · split aces receive one card · no surrender · no insurance.
 *  Basic strategy below is the published multi-deck S17/DAS/no-surrender chart.
 */
export const BJ_RULES = { decks: 6, dealerStandsSoft17: true, blackjackPays: 1.5, maxHands: 3, doubleAfterSplit: true, surrender: false } as const;
/** Published house edge for these rules with perfect basic strategy (Wizard of Odds rule calculator). */
export const BJ_HOUSE_EDGE = 0.41;

export type BjAction = 'hit' | 'stand' | 'double' | 'split';

export interface BjHand { cards: Card[]; bet: number; done: boolean; doubled: boolean; fromSplit: boolean; result?: 'win' | 'lose' | 'push' | 'blackjack'; payout?: number }
export interface BjState {
  phase: 'bet' | 'player' | 'dealer' | 'settled';
  hands: BjHand[];
  active: number;
  dealer: Card[];
  /** Total returned to the player at settlement (stakes + winnings). */
  returned: number;
  /** Total staked this round (initial bets + doubles + splits). */
  staked: number;
}

/** Hard/soft value. `soft` is true when an ace is counted as 11. */
export function handValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0, aces = 0;
  for (const c of cards) { if (c.rank === 14) { aces++; total += 11; } else total += Math.min(c.rank, 10); }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return { total, soft: aces > 0 };
}
export const isBlackjack = (cards: Card[]) => cards.length === 2 && handValue(cards).total === 21;
export const isBust = (cards: Card[]) => handValue(cards).total > 21;
const bjVal = (c: Card) => (c.rank === 14 ? 11 : Math.min(c.rank, 10));

export const initialBjState = (): BjState => ({ phase: 'bet', hands: [], active: 0, dealer: [], returned: 0, staked: 0 });

export function deal(shoe: Shoe, bet: number): BjState {
  if (shoe.needsShuffle) shoe.reshuffle();
  const player = [shoe.draw()], dealer = [shoe.draw()];
  player.push(shoe.draw()); dealer.push(shoe.draw());
  const s: BjState = { phase: 'player', hands: [{ cards: player, bet, done: false, doubled: false, fromSplit: false }], active: 0, dealer, returned: 0, staked: bet };
  // Naturals end the round at once (dealer peeks; with a dealer blackjack the hand is a push).
  if (isBlackjack(player) || isBlackjack(dealer)) { s.hands[0].done = true; return finish(shoe, s); }
  return s;
}

export function canDouble(s: BjState, i = s.active) { const h = s.hands[i]; return s.phase === 'player' && !h.done && h.cards.length === 2 && (!h.fromSplit || BJ_RULES.doubleAfterSplit) && !(h.fromSplit && h.cards[0].rank === 14); }
export function canSplit(s: BjState, i = s.active) {
  const h = s.hands[i];
  return s.phase === 'player' && !h.done && h.cards.length === 2 && bjVal(h.cards[0]) === bjVal(h.cards[1]) && s.hands.length < BJ_RULES.maxHands && !(h.fromSplit && h.cards[0].rank === 14);
}
export function canHit(s: BjState, i = s.active) { const h = s.hands[i]; return s.phase === 'player' && !h.done && !(h.fromSplit && h.cards[0].rank === 14 && h.cards.length === 2); }

const clone = (s: BjState): BjState => ({ ...s, hands: s.hands.map((h) => ({ ...h, cards: [...h.cards] })), dealer: [...s.dealer] });

/** Move to the next unfinished hand, or to the dealer. */
function advance(shoe: Shoe, s: BjState): BjState {
  const next = s.hands.findIndex((h, i) => i > s.active && !h.done);
  if (next >= 0) {
    s.active = next;
    // a split hand with one card draws its second now
    if (s.hands[next].cards.length === 1) s.hands[next].cards.push(shoe.draw());
    // split aces: one card and done
    if (s.hands[next].fromSplit && s.hands[next].cards[0].rank === 14) { s.hands[next].done = true; return advance(shoe, s); }
    if (handValue(s.hands[next].cards).total === 21) { s.hands[next].done = true; return advance(shoe, s); }
    return s;
  }
  return finish(shoe, s);
}

export function hit(shoe: Shoe, st: BjState): BjState {
  if (!canHit(st)) return st;
  const s = clone(st); const h = s.hands[s.active];
  h.cards.push(shoe.draw());
  const v = handValue(h.cards).total;
  if (v >= 21) { h.done = true; return advance(shoe, s); }
  return s;
}
export function stand(shoe: Shoe, st: BjState): BjState {
  if (st.phase !== 'player') return st;
  const s = clone(st); s.hands[s.active].done = true;
  return advance(shoe, s);
}
export function double(shoe: Shoe, st: BjState): BjState {
  if (!canDouble(st)) return st;
  const s = clone(st); const h = s.hands[s.active];
  s.staked += h.bet; h.bet *= 2; h.doubled = true; h.cards.push(shoe.draw()); h.done = true;
  return advance(shoe, s);
}
export function split(shoe: Shoe, st: BjState): BjState {
  if (!canSplit(st)) return st;
  const s = clone(st); const h = s.hands[s.active];
  const second: BjHand = { cards: [h.cards.pop()!], bet: h.bet, done: false, doubled: false, fromSplit: true };
  h.fromSplit = true; s.staked += h.bet;
  s.hands.splice(s.active + 1, 0, second);
  h.cards.push(shoe.draw());
  if (h.cards[0].rank === 14) { h.done = true; return advance(shoe, s); } // split aces: one card each
  if (handValue(h.cards).total === 21) { h.done = true; return advance(shoe, s); }
  return s;
}

/** Dealer draws to 17 (stands on soft 17), then every hand is settled. */
function finish(shoe: Shoe, s: BjState): BjState {
  s.phase = 'dealer';
  const anyLive = s.hands.some((h) => !isBust(h.cards) && !isBlackjack(h.cards));
  if (anyLive) {
    for (;;) {
      const v = handValue(s.dealer);
      if (v.total > 17 || (v.total === 17 && (BJ_RULES.dealerStandsSoft17 || !v.soft))) break;
      s.dealer.push(shoe.draw());
    }
  }
  return settle(s);
}

export function settle(s: BjState): BjState {
  const d = handValue(s.dealer).total, dBj = isBlackjack(s.dealer);
  let returned = 0;
  for (const h of s.hands) {
    const p = handValue(h.cards).total;
    const pBj = isBlackjack(h.cards) && !h.fromSplit;
    let payout = 0;
    if (p > 21) h.result = 'lose';
    else if (pBj && dBj) { h.result = 'push'; payout = h.bet; }
    else if (pBj) { h.result = 'blackjack'; payout = h.bet * (1 + BJ_RULES.blackjackPays); }
    else if (dBj) h.result = 'lose';
    else if (d > 21 || p > d) { h.result = 'win'; payout = h.bet * 2; }
    else if (p === d) { h.result = 'push'; payout = h.bet; }
    else h.result = 'lose';
    h.payout = payout; returned += payout; h.done = true;
  }
  s.returned = returned; s.phase = 'settled';
  return s;
}

/* ------------------------------------------------------------------ basic strategy (6 decks, S17, DAS, no surrender) */
type Row = Record<number, 'H' | 'S' | 'D' | 'Ds' | 'P'>; // keyed by dealer up-card value 2..11
const row = (s: string): Row => { const o: Row = {}; const parts = s.split(' '); for (let i = 0; i < 10; i++) o[i + 2] = parts[i] as Row[number]; return o; };
/** dealer: 2  3  4  5  6  7  8  9  10 A */
export const HARD: Record<number, Row> = {
  5: row('H H H H H H H H H H'), 6: row('H H H H H H H H H H'), 7: row('H H H H H H H H H H'), 8: row('H H H H H H H H H H'),
  9: row('H D D D D H H H H H'), 10: row('D D D D D D D D H H'), 11: row('D D D D D D D D D H'),
  12: row('H H S S S H H H H H'), 13: row('S S S S S H H H H H'), 14: row('S S S S S H H H H H'), 15: row('S S S S S H H H H H'), 16: row('S S S S S H H H H H'),
  17: row('S S S S S S S S S S'), 18: row('S S S S S S S S S S'), 19: row('S S S S S S S S S S'), 20: row('S S S S S S S S S S'), 21: row('S S S S S S S S S S'),
};
/** Soft totals keyed by the non-ace part (A,2 = 13 … A,9 = 20). */
export const SOFT: Record<number, Row> = {
  12: row('H H H H H H H H H H'), 13: row('H H H D D H H H H H'), 14: row('H H H D D H H H H H'), 15: row('H H D D D H H H H H'), 16: row('H H D D D H H H H H'),
  17: row('H D D D D H H H H H'), 18: row('S Ds Ds Ds Ds S S H H H'), 19: row('S S S S S S S S S S'), 20: row('S S S S S S S S S S'),
};
/** Pairs keyed by the card value (11 = aces). */
export const PAIRS: Record<number, Row> = {
  2: row('P P P P P P H H H H'), 3: row('P P P P P P H H H H'), 4: row('H H H P P H H H H H'), 5: row('D D D D D D D D H H'),
  6: row('P P P P P H H H H H'), 7: row('P P P P P P H H H H'), 8: row('P P P P P P P P P P'), 9: row('P P P P P S P P S S'),
  10: row('S S S S S S S S S S'), 11: row('P P P P P P P P P P'),
};

export interface BjAdvice { action: BjAction; reason: string; }
/** The book move for the active hand. Falls back correctly when a double/split is not available. */
export function basicStrategy(hand: Card[], dealerUp: Card, opts: { canSplit: boolean; canDouble: boolean }): BjAdvice {
  const up = bjVal(dealerUp);
  const upTxt = up === 11 ? 'an ace' : `a ${up}`;
  const v = handValue(hand);
  if (hand.length === 2 && bjVal(hand[0]) === bjVal(hand[1]) && opts.canSplit) {
    const code = PAIRS[bjVal(hand[0])][up];
    if (code === 'P') return { action: 'split', reason: bjVal(hand[0]) === 11 ? 'Always split aces: two strong starts beat one awkward 12.' : bjVal(hand[0]) === 8 ? 'Always split 8s: 16 is the worst total, two 8s are not.' : `Split ${hand[0].rank === 10 ? '10s' : bjVal(hand[0]) + 's'} against ${upTxt}: the dealer is weak here, so play two hands.` };
  }
  const table = v.soft ? SOFT : HARD;
  const key = v.soft ? v.total : Math.max(5, Math.min(21, v.total));
  const code = table[key]?.[up] ?? 'S';
  const label = v.soft ? `soft ${v.total}` : `hard ${v.total}`;
  if (code === 'D' || code === 'Ds') {
    if (opts.canDouble) return { action: 'double', reason: `Double ${label} against ${upTxt}: you are the favourite, so get more money on the table.` };
    return code === 'Ds' ? { action: 'stand', reason: `Can't double now, so stand on ${label}.` } : { action: 'hit', reason: `Can't double now, so hit ${label} against ${upTxt}.` };
  }
  if (code === 'H') return { action: 'hit', reason: up >= 7 ? `Hit ${label}: the dealer's ${upTxt} is strong, standing loses more often.` : `Hit ${label}: too low to stand, the dealer busts often but not often enough.` };
  return { action: 'stand', reason: up >= 2 && up <= 6 && !v.soft && v.total <= 16 ? `Stand on ${label}: the dealer shows ${upTxt} and busts around 40% of the time.` : `Stand on ${label}: drawing busts too often to help.` };
}

/** Full chart rows for the strategy table on the page. */
export const CHART_COLS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const CHART_CODE_LABEL = { H: 'Hit', S: 'Stand', D: 'Double', Ds: 'Double, else stand', P: 'Split' } as const;
