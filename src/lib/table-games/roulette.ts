import { randomInt } from './rng';

/**
 * European roulette – single zero, 37 pockets. Payouts are the standard "to one" odds:
 * straight 35:1, split 17:1, street 11:1, corner 8:1, line 5:1, dozen/column 2:1, even-money 1:1.
 * Every bet carries the same 2.70% house edge (1/37).
 */
export const ROULETTE_HOUSE_EDGE = 2.7;
/** Pocket order clockwise on a European wheel, starting at zero. */
export const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const pocketColor = (n: number): 'red' | 'black' | 'green' => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');

export type BetKind = 'straight' | 'split' | 'street' | 'corner' | 'line' | 'dozen' | 'column' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high';
export interface RouletteBet { id: string; kind: BetKind; numbers: number[]; amount: number; label: string }

/** "To one" payout for each bet type. */
export const PAYS: Record<BetKind, number> = { straight: 35, split: 17, street: 11, corner: 8, line: 5, dozen: 2, column: 2, red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1 };

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
/** Build a bet definition (numbers covered + label) from a kind and anchor. */
export function makeBet(kind: BetKind, anchor: number[] = []): Omit<RouletteBet, 'amount'> {
  const id = `${kind}:${anchor.join('-')}`;
  switch (kind) {
    case 'straight': return { id, kind, numbers: [anchor[0]], label: `Straight ${anchor[0]}` };
    case 'split': return { id, kind, numbers: anchor, label: `Split ${anchor.join('/')}` };
    case 'street': { const s = anchor[0]; return { id, kind, numbers: [s, s + 1, s + 2], label: `Street ${s}-${s + 2}` }; }
    case 'corner': { const s = anchor[0]; return { id, kind, numbers: [s, s + 1, s + 3, s + 4], label: `Corner ${s}/${s + 1}/${s + 3}/${s + 4}` }; }
    case 'line': { const s = anchor[0]; return { id, kind, numbers: range(s, s + 5), label: `Line ${s}-${s + 5}` }; }
    case 'dozen': { const d = anchor[0]; return { id, kind, numbers: range(d * 12 + 1, d * 12 + 12), label: ['1st 12', '2nd 12', '3rd 12'][d] }; }
    case 'column': { const c = anchor[0]; return { id, kind, numbers: range(0, 11).map((i) => i * 3 + c + 1), label: `Column ${c + 1}` }; }
    case 'red': return { id, kind, numbers: [...REDS], label: 'Red' };
    case 'black': return { id, kind, numbers: range(1, 36).filter((n) => !REDS.has(n)), label: 'Black' };
    case 'odd': return { id, kind, numbers: range(1, 36).filter((n) => n % 2 === 1), label: 'Odd' };
    case 'even': return { id, kind, numbers: range(1, 36).filter((n) => n % 2 === 0), label: 'Even' };
    case 'low': return { id, kind, numbers: range(1, 18), label: '1-18' };
    case 'high': return { id, kind, numbers: range(19, 36), label: '19-36' };
  }
}

export const spinWheel = (): number => WHEEL_ORDER[randomInt(WHEEL_ORDER.length)];

/** Total returned (stake + winnings) for a result. Losing bets return 0. */
export function settleBets(bets: RouletteBet[], result: number): { returned: number; wins: { bet: RouletteBet; payout: number }[] } {
  let returned = 0; const wins: { bet: RouletteBet; payout: number }[] = [];
  for (const b of bets) {
    if (b.numbers.includes(result)) { const payout = b.amount * (PAYS[b.kind] + 1); returned += payout; wins.push({ bet: b, payout }); }
  }
  return { returned, wins };
}

/** Expected return on a bet: identical for every bet on a single-zero wheel. */
export const expectedReturn = (kind: BetKind) => (makeBet(kind, kind === 'straight' ? [1] : kind === 'split' ? [1, 2] : kind === 'street' || kind === 'corner' || kind === 'line' ? [1] : [0]).numbers.length * (PAYS[kind] + 1)) / 37;
