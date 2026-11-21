import type { Card } from './cards';
import { SUITS, RANKS, isRed } from './cards';

/**
 * Blackjack side bets (optional, settled right after the deal, before the main hand plays out).
 *  21+3: player's two cards + dealer up-card form a three-card poker hand.
 *  Perfect Pairs: player's first two cards are a pair – same suit, same colour, or mixed.
 * Paytables are the common six-deck ones; house edges below are computed exactly from the shoe composition.
 */
export type SideResult = { label: string; pays: number } | null;

export const PAY_21P3: { label: string; pays: number }[] = [
  { label: 'Suited three of a kind', pays: 100 }, { label: 'Straight flush', pays: 40 }, { label: 'Three of a kind', pays: 30 }, { label: 'Straight', pays: 10 }, { label: 'Flush', pays: 5 },
];
export const PAY_PP: { label: string; pays: number }[] = [
  { label: 'Perfect pair (same suit)', pays: 25 }, { label: 'Coloured pair (same colour)', pays: 12 }, { label: 'Mixed pair', pays: 6 },
];

const isStraight3 = (ranks: number[]) => {
  const r = [...ranks].sort((a, b) => a - b);
  if (new Set(r).size !== 3) return false;
  if (r[2] - r[0] === 2) return true;
  return r[0] === 2 && r[1] === 3 && r[2] === 14; // A-2-3
};

export function evaluate21p3(p1: Card, p2: Card, up: Card): SideResult {
  const cs = [p1, p2, up];
  const flush = cs.every((c) => c.suit === p1.suit);
  const trips = cs.every((c) => c.rank === p1.rank);
  const straight = isStraight3(cs.map((c) => c.rank));
  if (trips && flush) return PAY_21P3[0];
  if (straight && flush) return PAY_21P3[1];
  if (trips) return PAY_21P3[2];
  if (straight) return PAY_21P3[3];
  if (flush) return PAY_21P3[4];
  return null;
}

export function evaluatePerfectPairs(p1: Card, p2: Card): SideResult {
  if (p1.rank !== p2.rank) return null;
  if (p1.suit === p2.suit) return PAY_PP[0];
  if (isRed(p1.suit) === isRed(p2.suit)) return PAY_PP[1];
  return PAY_PP[2];
}

/** Exact house edge (%) by enumerating every card-type combination of an N-deck shoe, weighted by copies. */
export function edgePerfectPairs(decks: number): number {
  const n = decks * 52, copies = decks;
  // first card any; second card: same type (copies-1), same rank other suit same colour (copies), other colour (2*copies)
  const ev = (PAY_PP[0].pays + 1) * ((copies - 1) / (n - 1)) + (PAY_PP[1].pays + 1) * (copies / (n - 1)) + (PAY_PP[2].pays + 1) * ((2 * copies) / (n - 1)) - 1;
  return Math.round(-ev * 10000) / 100;
}
export function edge21p3(decks: number): number {
  const types: Card[] = []; for (const suit of SUITS) for (const rank of RANKS) types.push({ rank, suit });
  const c = decks, choose2 = (c * (c - 1)) / 2, choose3 = (c * (c - 1) * (c - 2)) / 6;
  let total = 0, ret = 0;
  for (let i = 0; i < 52; i++) for (let j = i; j < 52; j++) for (let k = j; k < 52; k++) {
    const w = i === j && j === k ? choose3 : i === j || j === k ? choose2 * c : c * c * c;
    if (!w) continue;
    total += w;
    const r = evaluate21p3(types[i], types[j], types[k]);
    if (r) ret += w * (r.pays + 1);
  }
  return Math.round((1 - ret / total) * 10000) / 100;
}
export const EDGE_21P3 = edge21p3(6);
export const EDGE_PP = edgePerfectPairs(6);
