import type { Card, Rank } from './cards';

/** Standard poker hand categories, low to high. */
export type HandCategory = 'high-card' | 'pair' | 'two-pair' | 'three-of-a-kind' | 'straight' | 'flush' | 'full-house' | 'four-of-a-kind' | 'straight-flush' | 'royal-flush';
export const CATEGORY_ORDER: HandCategory[] = ['high-card', 'pair', 'two-pair', 'three-of-a-kind', 'straight', 'flush', 'full-house', 'four-of-a-kind', 'straight-flush', 'royal-flush'];
export const CATEGORY_LABEL: Record<HandCategory, string> = { 'high-card': 'High card', pair: 'Pair', 'two-pair': 'Two pair', 'three-of-a-kind': 'Three of a kind', straight: 'Straight', flush: 'Flush', 'full-house': 'Full house', 'four-of-a-kind': 'Four of a kind', 'straight-flush': 'Straight flush', 'royal-flush': 'Royal flush' };

export interface HandRank { category: HandCategory; /** Comparable score: higher wins. */ score: number; /** Ranks ordered by importance (for display). */ kickers: Rank[] }

/** Evaluate exactly five cards. */
export function evaluate5(cards: Card[]): HandRank {
  if (cards.length !== 5) throw new Error('evaluate5 needs 5 cards');
  const counts = new Map<Rank, number>();
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  // group by count desc, then rank desc
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every((c) => c.suit === cards[0].suit);
  const ranks = [...counts.keys()].sort((a, b) => b - a);
  let straightHigh = 0;
  if (ranks.length === 5) {
    if (ranks[0] - ranks[4] === 4) straightHigh = ranks[0];
    else if (ranks[0] === 14 && ranks[1] === 5 && ranks[4] === 2) straightHigh = 5; // wheel A-2-3-4-5
  }
  let category: HandCategory; let kickers: Rank[];
  if (straightHigh && flush) { category = straightHigh === 14 ? 'royal-flush' : 'straight-flush'; kickers = [straightHigh as Rank]; }
  else if (groups[0][1] === 4) { category = 'four-of-a-kind'; kickers = [groups[0][0], groups[1][0]]; }
  else if (groups[0][1] === 3 && groups[1][1] === 2) { category = 'full-house'; kickers = [groups[0][0], groups[1][0]]; }
  else if (flush) { category = 'flush'; kickers = ranks; }
  else if (straightHigh) { category = 'straight'; kickers = [straightHigh as Rank]; }
  else if (groups[0][1] === 3) { category = 'three-of-a-kind'; kickers = groups.map((g) => g[0]); }
  else if (groups[0][1] === 2 && groups[1][1] === 2) { category = 'two-pair'; kickers = groups.map((g) => g[0]); }
  else if (groups[0][1] === 2) { category = 'pair'; kickers = groups.map((g) => g[0]); }
  else { category = 'high-card'; kickers = ranks; }
  let score = CATEGORY_ORDER.indexOf(category);
  for (const k of kickers) score = score * 16 + k;
  for (let i = kickers.length; i < 5; i++) score *= 16; // normalise length so scores compare across categories
  return { category, score, kickers };
}

/** Best five-card hand from 5–7 cards. */
export function evaluateBest(cards: Card[]): HandRank {
  if (cards.length === 5) return evaluate5(cards);
  let best: HandRank | null = null;
  const n = cards.length;
  for (let a = 0; a < n - 4; a++) for (let b = a + 1; b < n - 3; b++) for (let c = b + 1; c < n - 2; c++) for (let d = c + 1; d < n - 1; d++) for (let e = d + 1; e < n; e++) {
    const r = evaluate5([cards[a], cards[b], cards[c], cards[d], cards[e]]);
    if (!best || r.score > best.score) best = r;
  }
  return best!;
}
