'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import { Shoe } from '@/lib/table-games/cards';
import * as BAC from '@/lib/table-games/baccarat';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame } from './GameFrame';
import { PlayingCard, CardSlot } from './PlayingCard';
import { Chip, ChipStack, CHIP_VALUES } from './Chip';

type Bets = Record<BAC.BacBet, number>;
const ZERO: Bets = { player: 0, banker: 0, tie: 0 };
const LABEL: Record<BAC.BacBet, string> = { player: 'Player', banker: 'Banker', tie: 'Tie' };

export default function Baccarat({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('baccarat');
  const [hint, setHint] = useState(false);
  const shoeRef = useRef<Shoe | null>(null);
  const shoe = () => (shoeRef.current ??= new Shoe(BAC.BAC_RULES.decks));
  const [chip, setChip] = useState(25);
  const [bets, setBets] = useState<Bets>(ZERO);
  const [lastBets, setLastBets] = useState<Bets>(ZERO);
  const [coup, setCoup] = useState<BAC.BacResult | null>(null);
  const [shown, setShown] = useState(0); // cards revealed so far (deal order P1 B1 P2 B2 P3 B3)
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ winner: BAC.BacBet; net: number } | null>(null);
  const [road, setRoad] = useState<BAC.BacBet[]>([]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const total = bets.player + bets.banker + bets.tie;
  const add = (k: BAC.BacBet) => { if (busy || total + chip > bank.balance) return; setBets((b) => ({ ...b, [k]: b[k] + chip })); setOutcome(null); };

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
      setOutcome({ winner: r.winner, net: returned - total });
      setRoad((x) => [r.winner, ...x].slice(0, 24));
      setBets(ZERO); setBusy(false);
    }, 350 + order.length * 420 + 300));
  };
  const advice = useMemo(() => ({ move: 'Banker', reason: 'Nothing you do changes the odds – the cards follow a fixed tableau. Banker has the lowest house edge (1.06%), Player 1.24%, Tie 14.4%.' }), []);

  const vis = coup ? visible(coup, shown) : { P: [], B: [] };
  const done = coup && shown >= orderOf(coup).length;

  const controls = (
    <>
      <div className="tg-chips" role="group" aria-label="Chip value">{CHIP_VALUES.map((v) => <Chip key={v} value={v} selected={chip === v} onClick={() => setChip(v)} label={`Bet with ${v} chips`} />)}</div>
      <div className="tg-actions">
        <button type="button" className="tg-btn ghost" onClick={() => setBets(ZERO)} disabled={!total || busy}>Clear</button>
        <button type="button" className="tg-btn ghost" onClick={() => { const t = lastBets.player + lastBets.banker + lastBets.tie; if (t && t <= bank.balance) setBets(lastBets); }} disabled={busy || total > 0 || !(lastBets.player + lastBets.banker + lastBets.tie)}>Rebet</button>
        <button type="button" className="tg-btn primary big" onClick={deal} disabled={!total || busy || total > bank.balance}>{busy ? 'Dealing…' : `Deal · ${fmtMoney(total)}`}</button>
      </div>
    </>
  );

  return (
    <GameFrame game="baccarat" title="Baccarat" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice} controls={controls} busy={busy}>
      <div className="bac">
        <div className="bac-rules" aria-hidden>Punto Banco · 8 decks · Banker pays 0.95:1 · Tie pays 8:1</div>
        <div className="bac-hands">
          {(['P', 'B'] as const).map((side) => {
            const cards = side === 'P' ? vis.P : vis.B;
            const full = coup ? (side === 'P' ? coup.player : coup.banker) : [];
            const total = cards.length ? BAC.bacTotal(cards) : null;
            const winner = done && outcome ? (outcome.winner === (side === 'P' ? 'player' : 'banker')) : false;
            return (
              <div key={side} className={`bac-side ${side === 'P' ? 'player' : 'banker'}${winner ? ' winner' : ''}`}>
                <div className="hand-label">{side === 'P' ? 'Player' : 'Banker'}{total !== null ? <b className="total">{total}</b> : null}</div>
                <div className="hand-cards">
                  {full.length === 0 ? <><CardSlot /><CardSlot /></> : full.map((c, i) => <PlayingCard key={i} card={c} faceDown={i >= cards.length} dealIndex={0} className={i === 2 ? 'third' : ''} />)}
                </div>
              </div>
            );
          })}
        </div>
        <div className={`bac-outcome${outcome ? ' show' : ''}`} role="status" aria-live="polite">
          {outcome ? <><b>{outcome.winner === 'tie' ? 'Tie' : `${LABEL[outcome.winner]} wins`}{coup?.natural ? ' – natural' : ''}</b><span>{outcome.net > 0 ? `+${fmtMoney(outcome.net)}` : outcome.net < 0 ? `${fmtMoney(outcome.net)}` : 'Push'}</span></> : busy ? <span>Cards coming…</span> : <span>Place a bet on Player, Banker or Tie</span>}
        </div>
        <div className="bac-bets" role="group" aria-label="Bets">
          {(['player', 'tie', 'banker'] as BAC.BacBet[]).map((k) => (
            <button key={k} type="button" className={`bac-spot ${k}${hint && k === 'banker' ? ' book' : ''}${outcome?.winner === k ? ' hit' : ''}`} onClick={() => add(k)} disabled={busy}>
              <span className="bac-spot-name">{LABEL[k]}</span>
              <span className="bac-spot-pays">{k === 'player' ? 'pays 1:1' : k === 'banker' ? 'pays 0.95:1' : 'pays 8:1'}</span>
              {bets[k] ? <ChipStack amount={bets[k]} /> : <span className="bet-spot" />}
            </button>
          ))}
        </div>
        {road.length ? <ol className="bac-road" aria-label="Previous results">{road.map((w, i) => <li key={i} className={w} title={LABEL[w]}>{w[0].toUpperCase()}</li>)}</ol> : null}
      </div>
    </GameFrame>
  );
}

/** Deal order for the reveal animation: P1 B1 P2 B2 [P3] [B3]. */
function orderOf(r: BAC.BacResult): ('P' | 'B')[] { const o: ('P' | 'B')[] = ['P', 'B', 'P', 'B']; if (r.player.length === 3) o.push('P'); if (r.banker.length === 3) o.push('B'); return o; }
function visible(r: BAC.BacResult, shown: number) {
  const o = orderOf(r).slice(0, shown); const p = o.filter((x) => x === 'P').length, b = o.filter((x) => x === 'B').length;
  return { P: r.player.slice(0, p), B: r.banker.slice(0, b) };
}
