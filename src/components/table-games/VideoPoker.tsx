'use client';
import { useMemo, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import type { Card } from '@/lib/table-games/cards';
import * as VP from '@/lib/table-games/video-poker';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame } from './GameFrame';
import { PlayingCard, CardSlot } from './PlayingCard';
import { Chip } from './Chip';

const DENOMS = [1, 5, 25] as const;
const NONE = [false, false, false, false, false];

export default function VideoPoker({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('video-poker');
  const [hint, setHint] = useState(false);
  const [denom, setDenom] = useState<number>(1);
  const [phase, setPhase] = useState<'bet' | 'hold' | 'done'>('bet');
  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>(NONE);
  const [result, setResult] = useState<{ cat: VP.VpCategory; pay: number } | null>(null);
  const [drawn, setDrawn] = useState<boolean[]>(NONE);
  const bet = denom * VP.COINS;

  const deal = () => {
    if (bet > bank.balance) return;
    bank.stake(bet);
    const d = VP.vpDeal();
    setHand(d.hand); setDeck(d.deck); setHeld(NONE); setDrawn(NONE); setResult(null); setPhase('hold');
  };
  const draw = () => {
    if (phase !== 'hold') return;
    const final = VP.vpDraw([...deck], hand, held);
    const pay = VP.vpPayout(final, VP.COINS) * denom;
    setDrawn(held.map((h) => !h));
    setHand(final); setResult({ cat: VP.classify(final), pay }); setPhase('done');
    bank.settle(pay, pay - bet);
  };
  const advice = useMemo(() => (phase === 'hold' ? VP.vpStrategy(hand) : null), [phase, hand]);
  const live = phase !== 'bet' && hand.length === 5 ? VP.classify(hand) : null;
  const liveRow = live ? VP.VP_PAYTABLE.find((p) => p.key === live) : null;

  const controls = phase === 'bet' ? (
    <>
      <div className="tg-chips" role="group" aria-label="Coin value">{DENOMS.map((v) => <Chip key={v} value={v} selected={denom === v} onClick={() => setDenom(v)} label={`${v} per coin`} />)}<span className="tg-chips-note">× 5 coins = <b>{fmtMoney(bet)}</b> per hand</span></div>
      <button type="button" className="tg-btn primary big" onClick={deal} disabled={bet > bank.balance}>Deal · {fmtMoney(bet)}</button>
    </>
  ) : phase === 'hold' ? (
    <div className="tg-actions">
      {hint && advice ? <button type="button" className="tg-btn book" onClick={() => setHeld(advice.hold)}>Hold the book cards</button> : null}
      <button type="button" className="tg-btn primary big" onClick={draw}>Draw</button>
    </div>
  ) : (
    <button type="button" className="tg-btn primary big" onClick={deal} disabled={bet > bank.balance}>Deal again · {fmtMoney(bet)}</button>
  );

  const aside = (
    <table className="vp-pay" aria-label="9/6 Jacks or Better paytable">
      <thead><tr><th>Hand</th>{[1, 2, 3, 4, 5].map((c) => <th key={c} className={c === 5 ? 'on' : ''}>{c}</th>)}</tr></thead>
      <tbody>{VP.VP_PAYTABLE.map((p) => (
        <tr key={p.key} className={live === p.key ? 'hit' : ''}><th>{p.label}</th>{[1, 2, 3, 4, 5].map((c) => <td key={c} className={c === 5 ? 'on' : ''}>{p.key === 'royal-flush' && c < 5 ? 250 * c : p.pays * c}</td>)}</tr>
      ))}</tbody>
    </table>
  );

  return (
    <GameFrame game="video-poker" title="Jacks or Better video poker" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice ? { move: advice.hold.some(Boolean) ? `Hold ${hand.filter((_, i) => advice.hold[i]).map(cardName).join(', ')}` : 'Draw five', reason: advice.rule } : null} controls={controls} aside={aside}>
      <div className="vp">
        <div className="vp-screen">
          <div className="vp-status" role="status" aria-live="polite">
            {phase === 'bet' ? <span>9/6 Jacks or Better · full-pay table · 5 coins</span> : phase === 'hold' ? <span>{liveRow ? <b>{liveRow.label}</b> : 'Tap the cards to hold'}{liveRow ? ' – hold or draw' : ''}</span> : result && result.pay > 0 ? <span className="win"><b>{VP.VP_PAYTABLE.find((p) => p.key === result.cat)?.label}</b> · wins {fmtMoney(result.pay)}</span> : <span>No pair of Jacks or better – try again</span>}
          </div>
          <div className="vp-cards">
            {hand.length === 0 ? Array.from({ length: 5 }, (_, i) => <CardSlot key={i} />) : hand.map((c, i) => (
              <PlayingCard key={`${c.rank}${c.suit}${i}`} card={c} held={phase === 'hold' && held[i]} dealIndex={drawn[i] || phase === 'hold' && !result ? i : 0} className={hint && advice?.hold[i] && phase === 'hold' ? 'book' : ''} onClick={phase === 'hold' ? () => setHeld((h) => h.map((x, j) => (j === i ? !x : x))) : undefined} label={`${cardName(c)}${held[i] ? ' (held)' : ''}`} />
            ))}
          </div>
          <div className="vp-meta"><span>Bet {VP.COINS} coins · {fmtMoney(denom)} each</span><span>{phase === 'done' && result ? `Won ${fmtMoney(result.pay)}` : `Max win ${fmtMoney(800 * VP.COINS * denom)}`}</span></div>
        </div>
      </div>
    </GameFrame>
  );
}

const cardName = (c: Card) => `${({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as Record<number, string>)[c.rank] ?? c.rank}${({ S: '♠', H: '♥', D: '♦', C: '♣' })[c.suit]}`;
