import { shuffle } from './rng';

export type Suit = 'S' | 'H' | 'D' | 'C';
/** 2–10 = pip value, 11 = Jack, 12 = Queen, 13 = King, 14 = Ace. */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export interface Card { rank: Rank; suit: Suit; }

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const RANK_LABEL: Record<Rank, string> = { 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
export const SUIT_LABEL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const isRed = (s: Suit) => s === 'H' || s === 'D';
export const cardId = (c: Card) => `${RANK_LABEL[c.rank]}${c.suit}`;

/** Parse "AS", "10H", "KD" into a card (used by tests and strategy tables). */
export function parseCard(s: string): Card {
  const m = /^(10|[2-9]|[JQKA])([SHDC])$/.exec(s.toUpperCase());
  if (!m) throw new Error(`bad card ${s}`);
  const r = m[1];
  const rank = (r === 'A' ? 14 : r === 'K' ? 13 : r === 'Q' ? 12 : r === 'J' ? 11 : Number(r)) as Rank;
  return { rank, suit: m[2] as Suit };
}
export const parseCards = (s: string): Card[] => s.trim().split(/\s+/).map(parseCard);

export function freshDeck(): Card[] {
  const d: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) d.push({ rank, suit });
  return d;
}

/**
 * A dealing shoe of N decks. Cards are drawn from the top; when fewer than `cutCard` remain the shoe reports
 * `needsShuffle` and the game reshuffles between hands (exactly like a live table's cut card).
 */
export class Shoe {
  private cards: Card[] = [];
  readonly decks: number;
  readonly cutCard: number;
  constructor(decks: number, cutCardFraction = 0.25) {
    this.decks = decks;
    this.cutCard = Math.floor(decks * 52 * cutCardFraction);
    this.reshuffle();
  }
  reshuffle() {
    const all: Card[] = [];
    for (let i = 0; i < this.decks; i++) all.push(...freshDeck());
    this.cards = shuffle(all);
  }
  get remaining() { return this.cards.length; }
  get needsShuffle() { return this.cards.length <= this.cutCard; }
  draw(): Card {
    if (!this.cards.length) this.reshuffle();
    return this.cards.pop()!;
  }
}
