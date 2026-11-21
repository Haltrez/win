'use client';
import { useMemo, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import type { Card } from '@/lib/table-games/cards';
import * as VP from '@/lib/table-games/video-poker';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame } from './GameFrame';
import { PlayingCard, CardSlot } from './PlayingCard';
import { Chip, ChipStack, CHIP_VALUES } from './Chip';

const NONE = [false, false, false, false, false];
type Spot = 'main' | 'side';
type Bets = Record<Spot, number>;
const NO_BETS: Bets = { main: 0, side: 0 };

export default function VideoPoker({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('video-poker');
  const [hint, setHint] = useState(false);
  const [chip, setChip] = useState(5);
  const [bets, setBets] = useState<Bets>({ main: 5, side: 0 });
  const [lastBets, setLastBets] = useState<Bets>({ main: 5, side: 0 });
  const [phase, setPhase] = useState<'bet' | 'hold' | 'done'>('bet');
  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>(NONE);
  const [result, setResult] = useState<{ cat: VP.VpCategory; pay: number } | null>(null);
  const [sideRes, setSideRes] = useState<{ label: string; win: number } | 'lose' | null>(null);
  const [drawn, setDrawn] = useState<boolean[]>(NONE);
  const total = bets.main + bets.side;
  const inBet = phase === 'bet';

  const addChip = (k: Spot) => { if (!inBet || total + chip > bank.balance) return; setBets((b) => ({ ...b, [k]: b[k] + chip })); };
  const deal = () => {
    if (bets.main <= 0 || total > bank.balance) return;
    bank.stake(total); setLastBets(bets);
    const d = VP.vpDeal();
    // The side bet is settled on the dealt five cards, before any hold.
    if (bets.side) {
      const r = VP.vpSideResult(d.hand);
      if (r) { bank.stake(-bets.side * (r.pays + 1)); setSideRes({ label: r.label, win: bets.side * r.pays }); } else setSideRes('lose');
    } else setSideRes(null);
    setHand(d.hand); setDeck(d.deck); setHeld(NONE); setDrawn(NONE); setResult(null); setPhase('hold');
  };
  const draw = () => {
    if (phase !== 'hold') return;
    const final = VP.vpDraw([...deck], hand, held);
    const pay = VP.vpPayout(final, VP.COINS) / VP.COINS * bets.main; // paid at the max-coin rate (royal 800× the bet)
    setDrawn(held.map((h) => !h));
    setHand(final); setResult({ cat: VP.classify(final), pay }); setPhase('done');
    const sideNet = sideRes && sideRes !== 'lose' ? sideRes.win : sideRes === 'lose' ? -bets.side : 0;
    bank.settle(pay, pay - bets.main + sideNet);
  };
  const again = () => { setPhase('bet'); setHand([]); setResult(null); setSideRes(null); const t = lastBets.main + lastBets.side; setBets(t <= bank.balance ? lastBets : { main: Math.min(lastBets.main, Math.floor(bank.balance)), side: 0 }); };
  const advice = useMemo(() => {
    if (inBet) return { hold: NONE, rule: 'Main bet only: the dealt-hand bonus pays big on rare pat hands and loses on all the others, so it costs far more over time than the main game played well.', move: 'Main bet only' };
    if (phase !== 'hold') return null;
    const a = VP.vpStrategy(hand);
    return { ...a, move: a.hold.some(Boolean) ? `Hold ${hand.filter((_, i) => a.hold[i]).map(cardName).join(', ')}` : 'Draw five' };
  }, [phase, hand, inBet]);
  const live = phase !== 'bet' && hand.length === 5 ? VP.classify(hand) : null;
  const liveRow = live ? VP.VP_PAYTABLE.find((p) => p.key === live) : null;

  const controls = inBet ? (
    <>
      <div className="tg-chips" role="group" aria-label="Chip value">
        {CHIP_VALUES.map((v) => <Chip key={v} value={v} selected={chip === v} onClick={() => setChip(v)} label={`Bet with ${v} chips`} />)}
        <button type="button" className="tg-btn ghost" onClick={() => setBets(NO_BETS)} disabled={total === 0}>Clear</button>
      </div>
      <button type="button" className="tg-btn primary big" onClick={deal} disabled={bets.main <= 0 || total > bank.balance}>Deal · {fmtMoney(total)}</button>
    </>
  ) : phase === 'hold' ? (
    <div className="tg-actions">
      {hint && advice ? <button type="button" className="tg-btn book" onClick={() => setHeld(advice.hold)}>Hold the book cards</button> : null}
      <button type="button" className="tg-btn primary big" onClick={draw}>Draw</button>
    </div>
  ) : (
    <button type="button" className="tg-btn primary big" onClick={again}>New hand</button>
  );

  const aside = (
    <div className="cols-2 vp-tables">
      <table className="vp-pay" aria-label="9/6 Jacks or Better paytable">
        <thead><tr><th>Hand</th><th>Pays</th></tr></thead>
        <tbody>{VP.VP_PAYTABLE.map((p) => <tr key={p.key} className={live === p.key ? 'hit' : ''}><th>{p.label}</th><td>{p.pays} × bet</td></tr>)}</tbody>
      </table>
      <table className="vp-pay" aria-label="Dealt hand bonus paytable">
        <thead><tr><th>Dealt hand bonus (on the deal)</th><th>Pays</th></tr></thead>
        <tbody>{VP.VP_SIDE_PAYTABLE.map((p) => <tr key={p.label} className={sideRes && sideRes !== 'lose' && sideRes.label === p.label ? 'hit' : ''}><th>{p.label}</th><td>{p.pays.toLocaleString('en-US')} to 1</td></tr>)}</tbody>
      </table>
    </div>
  );

  return (
    <GameFrame game="video-poker" title="Jacks or Better video poker" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice ? { move: advice.move, reason: advice.rule } : null} controls={controls} aside={aside}>
      <div className="vp">
        <div className="vp-screen">
          <div className="vp-status" role="status" aria-live="polite">
            {inBet ? <span>9/6 Jacks or Better · full pay</span> : phase === 'hold' ? <span>{liveRow ? <b>{liveRow.label}</b> : 'Tap the cards to hold'}{liveRow ? ' – hold or draw' : ''}</span> : result && result.pay > 0 ? <span className="win"><b>{VP.VP_PAYTABLE.find((p) => p.key === result.cat)?.label}</b> · wins {fmtMoney(result.pay)}</span> : <span>No pair of Jacks or better – try again</span>}
          </div>
          <div className="vp-cards">
            {hand.length === 0 ? Array.from({ length: 5 }, (_, i) => <CardSlot key={i} />) : hand.map((c, i) => (
              <PlayingCard key={`${c.rank}${c.suit}${i}`} card={c} held={phase === 'hold' && held[i]} dealIndex={drawn[i] || phase === 'hold' && !result ? i : 0} className={hint && advice?.hold[i] && phase === 'hold' ? 'book' : ''} onClick={phase === 'hold' ? () => setHeld((h) => h.map((x, j) => (j === i ? !x : x))) : undefined} label={`${cardName(c)}${held[i] ? ' (held)' : ''}`} />
            ))}
          </div>
          <div className="vp-meta"><span>Royal flush pays 800 × bet</span><span>{phase === 'done' && result ? `Won ${fmtMoney(result.pay)}` : bets.main ? `Max win ${fmtMoney(800 * bets.main)}` : ''}</span></div>
        </div>
        <div className="bj-spots vp-spots" role="group" aria-label="Bet spots">
          <button type="button" className={`bj-spot main${hint && inBet ? ' book' : ''}`} onClick={() => addChip('main')} disabled={!inBet} aria-label={`Main bet: ${fmtMoney(bets.main)}`}>
            <span className="bj-spot-name">Main bet</span><span className="bj-spot-sub">9/6 Jacks or Better</span>
            {bets.main ? <ChipStack amount={bets.main} /> : <span className="bet-spot" />}
          </button>
          <button type="button" className={`bj-spot side${hint && inBet ? ' nobook' : ''}`} onClick={() => addChip('side')} disabled={!inBet} aria-label={`Dealt hand bonus: ${fmtMoney(bets.side)}`}>
            <span className="bj-spot-name">Dealt hand bonus</span><span className="bj-spot-sub">up to 20,000:1</span>
            {bets.side ? <ChipStack amount={bets.side} /> : <span className="bet-spot" />}
            {sideRes === 'lose' ? <span className="bj-spot-res lose">No win</span> : sideRes ? <span className="bj-spot-res win">{sideRes.label.split(',')[0]} · +{fmtMoney(sideRes.win)}</span> : null}
          </button>
        </div>
      </div>
    </GameFrame>
  );
}

const cardName = (c: Card) => `${({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as Record<number, string>)[c.rank] ?? c.rank}${({ S: '♠', H: '♥', D: '♦', C: '♣' })[c.suit]}`;
