'use client';
import { useMemo, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import type { Card } from '@/lib/table-games/cards';
import * as VP from '@/lib/table-games/video-poker';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame, BetInput, Payout } from './GameFrame';
import { PlayingCard, CardSlot } from './PlayingCard';

const NONE = [false, false, false, false, false];

export default function VideoPoker({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('video-poker');
  const [hint, setHint] = useState(false);
  const [bet, setBet] = useState(5);
  const [side, setSide] = useState(0);
  const [phase, setPhase] = useState<'bet' | 'hold' | 'done'>('bet');
  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>(NONE);
  const [result, setResult] = useState<{ cat: VP.VpCategory; pay: number } | null>(null);
  const [sideRes, setSideRes] = useState<{ label: string; win: number } | 'lose' | null>(null);
  const [drawn, setDrawn] = useState<boolean[]>(NONE);
  const total = bet + side;
  const inBet = phase === 'bet';

  const deal = () => {
    if (bet <= 0 || total > bank.balance) return;
    bank.stake(total);
    const d = VP.vpDeal();
    if (side) {
      const r = VP.vpSideResult(d.hand);
      if (r) { bank.stake(-side * (r.pays + 1)); setSideRes({ label: r.label, win: side * r.pays }); } else setSideRes('lose');
    } else setSideRes(null);
    setHand(d.hand); setDeck(d.deck); setHeld(NONE); setDrawn(NONE); setResult(null); setPhase('hold');
  };
  const draw = () => {
    if (phase !== 'hold') return;
    const final = VP.vpDraw([...deck], hand, held);
    const pay = (VP.vpPayout(final, VP.COINS) / VP.COINS) * bet;
    setDrawn(held.map((h) => !h));
    setHand(final); setResult({ cat: VP.classify(final), pay }); setPhase('done');
    const sideNet = sideRes && sideRes !== 'lose' ? sideRes.win : sideRes === 'lose' ? -side : 0;
    bank.settle(pay, pay - bet + sideNet);
  };
  const again = () => { setPhase('bet'); setHand([]); setResult(null); setSideRes(null); if (total > bank.balance) { setSide(0); setBet(Math.min(bet, Math.floor(bank.balance))); } };
  const advice = useMemo(() => {
    if (inBet) return { hold: NONE, rule: 'Main bet only: the dealt-hand bonus pays big on rare pat hands and loses on all the others, so it costs far more over time than the main game played well.', move: 'Main bet only' };
    if (phase !== 'hold') return null;
    const a = VP.vpStrategy(hand);
    return { ...a, move: a.hold.some(Boolean) ? `Hold ${hand.filter((_, i) => a.hold[i]).map(cardName).join(', ')}` : 'Draw five' };
  }, [phase, hand, inBet]);
  const live = phase !== 'bet' && hand.length === 5 ? VP.classify(hand) : null;
  const liveRow = live ? VP.VP_PAYTABLE.find((p) => p.key === live) : null;

  const panel = (
    <>
      <BetInput label="Bet amount" value={bet} onChange={setBet} max={bank.balance} disabled={!inBet} />
      <BetInput label="Dealt hand bonus" value={side} onChange={setSide} max={bank.balance} disabled={!inBet} note="up to 20,000:1" />
      {inBet ? <button type="button" className={`tg-bet${hint ? ' book' : ''}`} onClick={deal} disabled={bet <= 0 || total > bank.balance}>Deal</button>
        : phase === 'hold' ? <>{hint && advice ? <button type="button" className="tg-bet secondary book" onClick={() => setHeld(advice.hold)}>Hold the book cards</button> : null}<button type="button" className="tg-bet" onClick={draw}>Draw</button></>
        : <button type="button" className="tg-bet" onClick={again}>New hand</button>}
    </>
  );

  const aside = (
    <div className="cols-2 vp-tables">
      <table className="vp-pay" aria-label="9/6 Jacks or Better paytable"><thead><tr><th>Hand</th><th>Pays</th></tr></thead>
        <tbody>{VP.VP_PAYTABLE.map((p) => <tr key={p.key} className={live === p.key ? 'hit' : ''}><th>{p.label}</th><td>{p.pays} × bet</td></tr>)}</tbody></table>
      <table className="vp-pay" aria-label="Dealt hand bonus paytable"><thead><tr><th>Dealt hand bonus (on the deal)</th><th>Pays</th></tr></thead>
        <tbody>{VP.VP_SIDE_PAYTABLE.map((p) => <tr key={p.label} className={sideRes && sideRes !== 'lose' && sideRes.label === p.label ? 'hit' : ''}><th>{p.label}</th><td>{p.pays.toLocaleString('en-US')} to 1</td></tr>)}</tbody></table>
    </div>
  );

  return (
    <GameFrame game="video-poker" title="Jacks or Better video poker" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice ? { move: advice.move, reason: advice.rule } : null} panel={panel} aside={aside}>
      <div className="vp">
        <div className="vp-status" role="status" aria-live="polite">
          {inBet ? <span>9/6 Jacks or Better · full pay · royal pays 800 × bet</span> : phase === 'hold' ? <span>{liveRow ? <b>{liveRow.label}</b> : 'Tap the cards to hold'}{liveRow ? ' – hold or draw' : ''}</span> : result && result.pay > 0 ? <span className="win"><b>{VP.VP_PAYTABLE.find((p) => p.key === result.cat)?.label}</b></span> : <span>No pair of Jacks or better</span>}
        </div>
        <div className="vp-cards">
          {hand.length === 0 ? Array.from({ length: 5 }, (_, i) => <CardSlot key={i} />) : hand.map((c, i) => (
            <PlayingCard key={`${c.rank}${c.suit}${i}`} card={c} held={phase === 'hold' && held[i]} dealIndex={drawn[i] || (phase === 'hold' && !result) ? i : 0} className={hint && advice?.hold[i] && phase === 'hold' ? 'book' : ''} onClick={phase === 'hold' ? () => setHeld((h) => h.map((x, j) => (j === i ? !x : x))) : undefined} label={`${cardName(c)}${held[i] ? ' (held)' : ''}`} />
          ))}
        </div>
        <div className="vp-meta"><span className="bet-pill">Bet <b>{fmtMoney(bet)}</b></span>{side ? <span className={`result-tag vp-side-res${sideRes && sideRes !== 'lose' ? ' win' : sideRes === 'lose' ? ' lose' : ''}`}>Bonus {fmtMoney(side)}{sideRes === 'lose' ? ' · no win' : sideRes ? ` · ${sideRes.label.split(',')[0]} +${fmtMoney(sideRes.win)}` : ''}</span> : <span className="bet-pill">Max win <b>{fmtMoney(800 * bet)}</b></span>}</div>
        {phase === 'done' && result && result.pay > 0 ? <Payout net={result.pay - bet} mult={result.pay / bet} /> : null}
      </div>
    </GameFrame>
  );
}

const cardName = (c: Card) => `${({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as Record<number, string>)[c.rank] ?? c.rank}${({ S: '♠', H: '♥', D: '♦', C: '♣' })[c.suit]}`;
