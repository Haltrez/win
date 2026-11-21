'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Play-money bankroll + session stats, persisted per game in localStorage (wrapped in try/catch for private mode). */
export const START_BALANCE = 1000;
export interface Stats { hands: number; wins: number; losses: number; pushes: number; net: number; streak: number }
const EMPTY: Stats = { hands: 0, wins: 0, losses: 0, pushes: 0, net: 0, streak: 0 };
const key = (game: string) => `tg:${game}`;

function load(game: string): { balance: number; stats: Stats } {
  try {
    const raw = localStorage.getItem(key(game));
    if (raw) { const j = JSON.parse(raw); if (typeof j.balance === 'number' && j.stats) return { balance: j.balance, stats: { ...EMPTY, ...j.stats } }; }
  } catch { /* unavailable */ }
  return { balance: START_BALANCE, stats: EMPTY };
}

export function useBankroll(game: string) {
  const [balance, setBalance] = useState(START_BALANCE);
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [ready, setReady] = useState(false);
  /** Balance when this page was opened – the "hot streak" prompt compares against it. */
  const sessionStart = useRef(START_BALANCE);
  useEffect(() => { const l = load(game); setBalance(l.balance); setStats(l.stats); sessionStart.current = l.balance; setReady(true); }, [game]);
  useEffect(() => { if (!ready) return; try { localStorage.setItem(key(game), JSON.stringify({ balance, stats })); } catch { /* ignore */ } }, [balance, stats, game, ready]);

  /** Take a stake off the table balance. */
  const stake = useCallback((amount: number) => setBalance((b) => Math.round((b - amount) * 100) / 100), []);
  /** Return money to the balance (stake + winnings) and record the hand. `net` is returned minus staked. */
  const settle = useCallback((returned: number, net: number) => {
    setBalance((b) => Math.round((b + returned) * 100) / 100);
    setStats((s) => ({
      hands: s.hands + 1,
      wins: s.wins + (net > 0 ? 1 : 0), losses: s.losses + (net < 0 ? 1 : 0), pushes: s.pushes + (net === 0 ? 1 : 0),
      net: Math.round((s.net + net) * 100) / 100,
      streak: net > 0 ? Math.max(0, s.streak) + 1 : net < 0 ? Math.min(0, s.streak) - 1 : s.streak,
    }));
  }, []);
  const reset = useCallback(() => { setBalance(START_BALANCE); setStats(EMPTY); sessionStart.current = START_BALANCE; }, []);
  /** Broke and nothing on the table: offer a top-up without wiping stats. */
  const topUp = useCallback(() => { setBalance(START_BALANCE); sessionStart.current = START_BALANCE; }, []);
  return { balance, stats, stake, settle, reset, topUp, ready, sessionStart: sessionStart.current };
}

export const fmtMoney = (n: number) => (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
