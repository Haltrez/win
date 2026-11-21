import type { Card } from './cards';
import { Shoe } from './cards';

/**
 * Punto Banco baccarat – 8 decks, standard third-card tableau.
 * Player 1:1 · Banker 0.95:1 (5% commission) · Tie 8:1 (Player/Banker bets push on a tie).
 * House edge (8 decks): Banker 1.06%, Player 1.24%, Tie 14.36%.
 */
export const BAC_RULES = { decks: 8, bankerPays: 0.95, tiePays: 8 } as const;
export const BAC_HOUSE_EDGE = { banker: 1.06, player: 1.24, tie: 14.36 } as const;

export type BacBet = 'player' | 'banker' | 'tie';
export interface BacResult { player: Card[]; banker: Card[]; playerTotal: number; bankerTotal: number; winner: BacBet; natural: boolean }

/** Aces count 1, tens and court cards 0, everything else its pip value. */
export const bacValue = (c: Card) => (c.rank === 14 ? 1 : c.rank >= 10 ? 0 : c.rank);
export const bacTotal = (cards: Card[]) => cards.reduce((t, c) => t + bacValue(c), 0) % 10;

/** Does the banker draw a third card? `third` is the player's third-card value, or null when the player stood. */
export function bankerDraws(bankerTotal: number, third: number | null): boolean {
  if (bankerTotal >= 7) return false;
  if (third === null) return bankerTotal <= 5;
  if (bankerTotal <= 2) return true;
  if (bankerTotal === 3) return third !== 8;
  if (bankerTotal === 4) return third >= 2 && third <= 7;
  if (bankerTotal === 5) return third >= 4 && third <= 7;
  return third === 6 || third === 7; // banker 6
}

/** Play out a coup from an ordered list of cards (P, B, P, B, then third cards as needed). */
export function playCoup(draw: () => Card): BacResult {
  // deal order is Player, Banker, Player, Banker
  const p1 = draw(), b1 = draw(), p2 = draw(), b2 = draw();
  const P = [p1, p2], B = [b1, b2];
  let pt = bacTotal(P), bt = bacTotal(B);
  const natural = pt >= 8 || bt >= 8;
  if (!natural) {
    let third: number | null = null;
    if (pt <= 5) { const c = draw(); P.push(c); third = bacValue(c); pt = bacTotal(P); }
    if (bankerDraws(bt, third)) { B.push(draw()); bt = bacTotal(B); }
  }
  const winner: BacBet = pt > bt ? 'player' : bt > pt ? 'banker' : 'tie';
  return { player: P, banker: B, playerTotal: pt, bankerTotal: bt, winner, natural };
}

export function dealCoup(shoe: Shoe): BacResult {
  if (shoe.needsShuffle) shoe.reshuffle();
  return playCoup(() => shoe.draw());
}

/** Total returned for the stakes placed. */
export function settleBaccarat(bets: Record<BacBet, number>, winner: BacBet): number {
  let r = 0;
  if (winner === 'tie') { r += bets.player + bets.banker + bets.tie * (1 + BAC_RULES.tiePays); }
  else if (winner === 'player') r += bets.player * 2;
  else r += bets.banker * (1 + BAC_RULES.bankerPays);
  return r;
}
