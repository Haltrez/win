'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import { Shoe } from '@/lib/table-games/cards';
import * as BAC from '@/lib/table-games/baccarat';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame, BetInput, Payout } from './GameFrame';
import { PlayingCard, CardSlot } from './PlayingCard';

type Bets = Record<BAC.BacBet, number>;
const ZERO: Bets = { player: 0, banker: 0, tie: 0 };
const LABEL: Record<BAC.BacBet, string> = { player: 'Player', banker: 'Banker', tie: 'Tie' };

export default function Baccarat({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('baccarat');
  const [hint, setHint] = useState(false);
  const shoeRef = useRef<Shoe | null>(null);
  const shoe = () => (shoeRef.current ??= new Shoe(BAC.BAC_RULES.decks));
  const [amount, setAmount] = useState(10);
  const [bets, setBets] = useState<Bets>(ZERO);
  const [lastBets, setLastBets] = useState<Bets>(ZERO);
  const [coup, setCoup] = useState<BAC.BacResult | null>(null);
  const [shown, setShown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ winner: BAC.BacBet; net: number; staked: number; returned: number } | null>(null);
  const [road, setRoad] = useState<BAC.BacBet[]>([]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const total = bets.player + bets.banker + bets.tie;
  const add = (k: BAC.BacBet) => { if (busy || amount <= 0 || total + amount > bank.balance) return; setBets((b) => ({ ...b, [k]: b[k] + amount })); setOutcome(null); };
  const deal = () => {
    if (!total || busy || total > bank.balance) return;
    const sh = shoe();
    bank.stake(total); setLastBets(bets); setBusy(true); setOutcome(null); setShown(0);
    const r = BAC.dealCoup(sh);
    setCoup(r);
    const order = orderOf(r);
    order.forEach((_, i) => timers.current.push(window.setTimeout(() => setShown(i + 1), 350 + i * 420)));
    timers.current.push(window.setTimeout(() => {
      const returned = BAC.settleBaccarat(bets, r.winner);
      bank.settle(returned, returned - total);
      setOutcome({ winner: r.winner, net: returned - total, staked: total, returned });
      setRoad((x) => [r.winner, ...x].slice(0, 24));
      setBets(ZERO); setBusy(false);
    }, 350 + order.length * 420 + 300));
  };
  const advice = useMemo(() => ({ move: 'Banker', reason: 'Nothing you do changes the odds – the cards follow a fixed tableau. Banker is the best bet, Player is close behind, and Tie is the one to avoid.' }), []);
  const vis = coup ? visible(coup, shown) : { P: [], B: [] };
  const done = coup && shown >= orderOf(coup).length;
  const lastTotal = lastBets.player + lastBets.banker + lastBets.tie;

  const panel = (
    <>
      <BetInput label="Bet amount" value={amount} onChange={setAmount} max={bank.balance} disabled={busy} note="tap a spot to place" />
      <div className="tg-actions">
        <button type="button" className="tg-act" onClick={() => setBets(ZERO)} disabled={!total || busy}>Clear</button>
        <button type="button" className="tg-act" onClick={() => { if (lastTotal && lastTotal <= bank.balance) setBets(lastBets); }} disabled={busy || total > 0 || !lastTotal}>Rebet</button>
      </div>
      <p className="tg-small">Total bet {fmtMoney(total)}</p>
      <button type="button" className="tg-bet" onClick={deal} disabled={!total || busy || total > bank.balance}>{busy ? 'Dealing…' : 'Deal'}</button>
    </>
  );

  return (
    <GameFrame game="baccarat" title="Baccarat" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice} panel={panel} busy={busy}>
      <div className="bac">
        <div className="bac-hands">
          {(['P', 'B'] as const).map((side) => {
            const cards = side === 'P' ? vis.P : vis.B;
            const full = coup ? (side === 'P' ? coup.player : coup.banker) : [];
            const t = cards.length ? BAC.bacTotal(cards) : null;
            const winner = done && outcome ? outcome.winner === (side === 'P' ? 'player' : 'banker') : false;
            return (
              <div key={side} className={`bac-side ${side === 'P' ? 'player' : 'banker'}${winner ? ' winner' : ''}`}>
                <div className="hand-label">{side === 'P' ? 'Player' : 'Banker'}{t !== null ? <b className="total">{t}</b> : null}</div>
                <div className="hand-cards">{full.length === 0 ? <><CardSlot /><CardSlot /></> : full.map((c, i) => <PlayingCard key={i} card={c} faceDown={i >= cards.length} className={i === 2 ? 'third' : ''} />)}</div>
              </div>
            );
          })}
        </div>
        <div className="bac-bets" role="group" aria-label="Bets">
          {(['player', 'tie', 'banker'] as BAC.BacBet[]).map((k) => (
            <button key={k} type="button" className={`tg-spot bac-spot ${k}${hint && k === 'banker' ? ' book' : ''}${outcome?.winner === k ? ' hit' : ''}${bets[k] ? ' on' : ''}`} onClick={() => add(k)} disabled={busy} aria-label={`${LABEL[k]}: ${fmtMoney(bets[k])}`}>
              <span className="tg-spot-name">{LABEL[k]}</span>
              <span className="tg-spot-sub">{k === 'player' ? 'pays 1:1' : k === 'banker' ? 'pays 0.95:1' : 'pays 8:1'}</span>
              <span className="bet-pill">{bets[k] ? <b>{fmtMoney(bets[k])}</b> : '–'}</span>
            </button>
          ))}
        </div>
        <div className={`bac-outcome${outcome ? ' show' : ''}`} role="status" aria-live="polite">
          {outcome ? <><b>{outcome.winner === 'tie' ? 'Tie' : `${LABEL[outcome.winner]} wins`}{coup?.natural ? ' – natural' : ''}</b><span>{outcome.net > 0 ? `+${fmtMoney(outcome.net)}` : outcome.net < 0 ? fmtMoney(outcome.net) : 'Push'}</span></> : busy ? <span>Cards coming…</span> : <span>Punto Banco · 8 decks · Banker pays 0.95:1 · Tie pays 8:1</span>}
        </div>
        {road.length ? <ol className="bac-road" aria-label="Previous results">{road.map((w, i) => <li key={i} className={w} title={LABEL[w]}>{w[0].toUpperCase()}</li>)}</ol> : null}
        {outcome && !busy && outcome.net >= 0 ? <Payout net={outcome.net} mult={outcome.net > 0 ? outcome.returned / outcome.staked : undefined} /> : null}
      </div>
    </GameFrame>
  );
}

function orderOf(r: BAC.BacResult): ('P' | 'B')[] { const o: ('P' | 'B')[] = ['P', 'B', 'P', 'B']; if (r.player.length === 3) o.push('P'); if (r.banker.length === 3) o.push('B'); return o; }
function visible(r: BAC.BacResult, shown: number) {
  const o = orderOf(r).slice(0, shown); const p = o.filter((x) => x === 'P').length, b = o.filter((x) => x === 'B').length;
  return { P: r.player.slice(0, p), B: r.banker.slice(0, b) };
}
