'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Play-money bankroll + session stats, persisted per game in localStorage (wrapped in try/catch for private mode). */
export const START_BALANCE = 1000;
export interface Stats { hands: number; wins: number; losses: number; pushes: number; net: number; streak: number }
const EMPTY: Stats = { hands: 0, wins: 0, losses: 0, pushes: 0, net: 0, streak: 0 };
const key = (game: string) => `tg:${game}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Load the saved balance. `pending` is money that was taken off the balance for a round that never settled
 * (the page was closed or refreshed mid-hand): it is refunded here so a bet can never silently disappear.
 */
function load(game: string): { balance: number; stats: Stats; refunded: number } {
  try {
    const raw = localStorage.getItem(key(game));
    if (raw) {
      const j = JSON.parse(raw);
      if (typeof j.balance === 'number' && j.stats) {
        const pending = typeof j.pending === 'number' && j.pending > 0 ? j.pending : 0;
        return { balance: round2(j.balance + pending), stats: { ...EMPTY, ...j.stats }, refunded: pending };
      }
    }
  } catch { /* unavailable */ }
  return { balance: START_BALANCE, stats: EMPTY, refunded: 0 };
}

export function useBankroll(game: string) {
  const [balance, setBalance] = useState(START_BALANCE);
  const [stats, setStats] = useState<Stats>(EMPTY);
  /** Money currently on the table (bets taken but not yet settled). */
  const [pending, setPending] = useState(0);
  const [ready, setReady] = useState(false);
  const [refunded, setRefunded] = useState(0);
  /** Balance when this page was opened – the "hot streak" prompt compares against it. */
  const sessionStart = useRef(START_BALANCE);
  useEffect(() => { const l = load(game); setBalance(l.balance); setStats(l.stats); setRefunded(l.refunded); sessionStart.current = l.balance; setReady(true); }, [game]);
  useEffect(() => { if (!ready) return; try { localStorage.setItem(key(game), JSON.stringify({ balance, stats, pending })); } catch { /* ignore */ } }, [balance, stats, pending, game, ready]);

  /** Take a bet off the balance and put it on the table. */
  const stake = useCallback((amount: number) => { setBalance((b) => round2(b - amount)); setPending((p) => round2(p + amount)); }, []);
  /** Pay out something that is settled at once (a side bet won on the deal) without touching the table money. */
  const credit = useCallback((amount: number) => setBalance((b) => round2(b + amount)), []);
  /** Return money to the balance (bets + winnings), clear the table and record the round. `net` is the whole round's result. */
  const settle = useCallback((returned: number, net: number) => {
    setBalance((b) => round2(b + returned));
    setPending(0);
    setStats((s) => ({
      hands: s.hands + 1,
      wins: s.wins + (net > 0 ? 1 : 0), losses: s.losses + (net < 0 ? 1 : 0), pushes: s.pushes + (net === 0 ? 1 : 0),
      net: round2(s.net + net),
      streak: net > 0 ? Math.max(0, s.streak) + 1 : net < 0 ? Math.min(0, s.streak) - 1 : s.streak,
    }));
  }, []);
  const reset = useCallback(() => { setBalance(START_BALANCE); setStats(EMPTY); setPending(0); sessionStart.current = START_BALANCE; }, []);
  /** Broke and nothing on the table: offer a top-up without wiping stats. */
  const topUp = useCallback(() => { setBalance(START_BALANCE); sessionStart.current = START_BALANCE; }, []);
  return { balance, stats, stake, credit, settle, reset, topUp, ready, refunded, sessionStart: sessionStart.current };
}

export const fmtMoney = (n: number) => (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
/** "+12.50" / "−5" / "0" */
export const fmtNet = (n: number) => (n > 0 ? `+${fmtMoney(n)}` : n < 0 ? `−${fmtMoney(-n)}` : '0');
