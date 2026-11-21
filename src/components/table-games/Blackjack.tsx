'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import { Shoe } from '@/lib/table-games/cards';
import * as BJ from '@/lib/table-games/blackjack';
import { evaluate21p3, evaluatePerfectPairs, type SideResult } from '@/lib/table-games/blackjack-side';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame, BetInput, Payout } from './GameFrame';
import { PlayingCard, CardSlot } from './PlayingCard';

const RESULT_LABEL = { win: 'Win', lose: 'Lose', push: 'Push', blackjack: 'Blackjack' } as const;
type Bets = { main: number; p21: number; pp: number };
type SeatSide = { p21: SideResult | 'lose' | null; pp: SideResult | 'lose' | null };

export default function Blackjack({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('blackjack');
  const [hint, setHint] = useState(false);
  const shoeRef = useRef<Shoe | null>(null);
  const shoe = () => (shoeRef.current ??= new Shoe(BJ.BJ_RULES.decks));
  const [bets, setBets] = useState<Bets>({ main: 10, p21: 0, pp: 0 });
  const [seats, setSeats] = useState(1);
  const [st, setSt] = useState<BJ.BjState>(BJ.initialBjState());
  const [sideRes, setSideRes] = useState<{ seats: SeatSide[]; net: number }>({ seats: [], net: 0 });
  const [revealed, setRevealed] = useState(1);
  const [settling, setSettling] = useState(false);
  const [shoeLeft, setShoeLeft] = useState<number | null>(null);
  const [dealt, setDealt] = useState(0);
  const [dealing, setDealing] = useState(false);
  const [payout, setPayout] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const inBet = st.phase === 'bet';
  const playing = st.phase === 'player';
  const active = st.hands[st.active];
  const perSeat = bets.main + bets.p21 + bets.pp;
  const total = perSeat * seats;

  useEffect(() => {
    if (st.phase !== 'settled' || dealing) return;
    setSettling(true);
    const n = st.dealer.length, stepMs = 450;
    for (let i = 2; i <= n; i++) timers.current.push(window.setTimeout(() => setRevealed(i), (i - 1) * stepMs));
    timers.current.push(window.setTimeout(() => { bank.settle(st.returned, st.returned - st.staked + sideRes.net); setPayout(st.returned - st.staked); setSettling(false); }, n * stepMs + 150));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.phase, dealing]);

  const deal = () => {
    if (bets.main <= 0 || total > bank.balance) return;
    const sh = shoe();
    bank.stake(total); setRevealed(1); setPayout(null);
    const s = BJ.dealSeats(sh, Array.from({ length: seats }, () => bets.main));
    let won = 0;
    const perSeatRes: SeatSide[] = s.hands.map((h) => {
      const [c1, c2] = h.cards;
      const r21 = bets.p21 ? evaluate21p3(c1, c2, s.dealer[0]) : null, rpp = bets.pp ? evaluatePerfectPairs(c1, c2) : null;
      won += (r21 ? bets.p21 * (r21.pays + 1) : 0) + (rpp ? bets.pp * (rpp.pays + 1) : 0);
      return { p21: bets.p21 ? r21 ?? 'lose' : null, pp: bets.pp ? rpp ?? 'lose' : null };
    });
    if (won) bank.stake(-won);
    setSideRes({ seats: perSeatRes, net: won - (bets.p21 + bets.pp) * seats });
    setShoeLeft(sh.remaining);
    const n = seats * 2 + 2, step = 260;
    setDealt(0); setDealing(true);
    for (let i = 1; i <= n; i++) timers.current.push(window.setTimeout(() => setDealt(i), i * step));
    timers.current.push(window.setTimeout(() => setDealing(false), n * step + 150));
    setSt(s);
  };
  const shown = (seat: number, j: number) => !dealing || j >= 2 || j * (seats + 1) + seat < dealt;
  const dealerShownYet = (i: number) => !dealing || i >= 2 || i * (seats + 1) + seats < dealt;
  const act = (a: BJ.BjAction) => {
    if (!playing || settling || dealing) return;
    const sh = shoe();
    if ((a === 'double' || a === 'split') && active.bet > bank.balance) return;
    if (a === 'double' || a === 'split') bank.stake(active.bet);
    const next = a === 'hit' ? BJ.hit(sh, st) : a === 'stand' ? BJ.stand(sh, st) : a === 'double' ? BJ.double(sh, st) : BJ.split(sh, st);
    setShoeLeft(sh.remaining); setSt(next);
  };
  const newHand = () => { setSt(BJ.initialBjState()); setRevealed(1); setSideRes({ seats: [], net: 0 }); setPayout(null); };

  const advice = useMemo(() => {
    if (inBet) return { action: null, move: 'Main bet only', reason: 'Side bets pay big on rare hands and lose on all the others, so they cost far more over time than the main hand played with basic strategy.' };
    if (!playing || !active || dealing) return null;
    const a = BJ.basicStrategy(active.cards, st.dealer[0], { canSplit: BJ.canSplit(st), canDouble: BJ.canDouble(st) });
    return { action: a.action as BJ.BjAction | null, move: a.action[0].toUpperCase() + a.action.slice(1), reason: a.reason };
  }, [st, playing, active, inBet, dealing]);

  const dealerShown = (st.phase === 'player' || dealing ? st.dealer.slice(0, 1) : st.dealer.slice(0, revealed)).filter((_, i) => dealerShownYet(i));
  const dealerTotal = st.phase === 'settled' && !dealing && revealed >= st.dealer.length ? BJ.handValue(st.dealer) : null;
  const canAfford = (x: number) => x <= bank.balance;
  const bal = bank.balance;

  const panel = inBet ? (
    <>
      <BetInput label="Bet amount" value={bets.main} onChange={(v) => setBets((b) => ({ ...b, main: v }))} max={bal} />
      <div className="tg-field"><div className="tg-field-head"><span>Hands</span></div>
        <div className="tg-seg" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }} role="group" aria-label="Number of hands">{[1, 2, 3].map((n) => <button key={n} type="button" className={`bj-seat-btn${seats === n ? ' on' : ''}`} aria-pressed={seats === n} onClick={() => setSeats(n)}>{n}</button>)}</div>
      </div>
      <div className="tg-row">
        <BetInput label="21+3" value={bets.p21} onChange={(v) => setBets((b) => ({ ...b, p21: v }))} max={bal} />
        <BetInput label="Perfect Pairs" value={bets.pp} onChange={(v) => setBets((b) => ({ ...b, pp: v }))} max={bal} />
      </div>
      <p className="tg-small">Total bet {fmtMoney(total)}{seats > 1 ? ` (${fmtMoney(perSeat)} × ${seats} hands)` : ''}</p>
      <button type="button" className={`tg-bet${hint ? ' book' : ''}`} onClick={deal} disabled={bets.main <= 0 || total > bal}>Bet</button>
    </>
  ) : st.phase === 'settled' ? (
    <>
      <BetInput label="Bet amount" value={bets.main} onChange={() => {}} max={bal} disabled />
      <button type="button" className="tg-bet" onClick={newHand} disabled={settling || dealing}>{settling || dealing ? 'Dealer…' : 'New hand'}</button>
    </>
  ) : (
    <>
      <BetInput label="Bet amount" value={bets.main} onChange={() => {}} max={bal} disabled />
      <div className="tg-actions" role="group" aria-label="Actions">
        {(['hit', 'stand', 'split', 'double'] as BJ.BjAction[]).map((a) => {
          const ok = a === 'hit' ? BJ.canHit(st) : a === 'stand' ? true : a === 'double' ? BJ.canDouble(st) && canAfford(active.bet) : BJ.canSplit(st) && canAfford(active.bet);
          return <button key={a} type="button" className={`tg-act${hint && advice?.action === a ? ' book' : ''}`} onClick={() => act(a)} disabled={!ok || settling || dealing}>{a[0].toUpperCase() + a.slice(1)}</button>;
        })}
      </div>
    </>
  );

  const sideBadges = (seat: number) => {
    const r = sideRes.seats[seat]; if (!r || dealing) return null;
    const one = (k: 'p21' | 'pp', name: string) => { const x = r[k]; if (!x) return null; return x === 'lose' ? <span key={k} className="result-tag lose">{name}: no win</span> : <span key={k} className="result-tag win">{name}: {x.label} +{fmtMoney(bets[k] * x.pays)}</span>; };
    return <div className="bj-side-results">{one('p21', '21+3')}{one('pp', 'Pairs')}</div>;
  };
  const seatList = Array.from({ length: st.hands.length ? Math.max(...st.hands.map((h) => h.seat)) + 1 : seats }, (_, i) => i);

  return (
    <GameFrame game="blackjack" title="Blackjack" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice ? { move: advice.move, reason: advice.reason } : null} panel={panel} busy={settling || dealing}>
      <div className="bj">
        <div className="bj-dealer">
          <div className="hand-label">Dealer{dealerTotal ? <b className={`total${dealerTotal.total > 21 ? ' bust' : ''}`}>{dealerTotal.total > 21 ? 'Bust' : dealerTotal.total}</b> : dealerShown.length ? <b className="total">{BJ.handValue(dealerShown).total}</b> : null}</div>
          <div className="hand-cards">
            {st.dealer.length === 0 ? <><CardSlot /><CardSlot /></> : st.dealer.map((c, i) => (!dealerShownYet(i) ? <CardSlot key={i} /> : i < dealerShown.length || i === 1 ? <PlayingCard key={i} card={c} faceDown={i === 1 && (revealed < 2 || dealing)} /> : null))}
          </div>
        </div>
        <div className="bj-centre"><span className="bj-shoe">{dealing ? 'Dealing…' : shoeLeft != null ? `Shoe: ${shoeLeft} cards left` : 'Blackjack pays 3 to 2 · dealer stands on soft 17 · 6 decks'}</span></div>
        <div className={`bj-player seats-${seatList.length} hands-${Math.max(1, st.hands.length)}`}>
          {seatList.map((seat) => {
            const hs = st.hands.filter((h) => h.seat === seat);
            return (
              <div key={seat} className="bj-seat">
                <div className="bj-seat-hands">
                  {hs.length === 0 ? (
                    <div className="bj-hand"><div className="hand-label">{seatList.length > 1 ? `Hand ${seat + 1}` : 'You'}</div><div className="hand-cards"><CardSlot /><CardSlot /></div><div className="hand-bet">{bets.main ? <span className="bet-pill">Bet <b>{fmtMoney(bets.main)}</b></span> : null}</div></div>
                  ) : hs.map((h) => {
                    const i = st.hands.indexOf(h);
                    const v = BJ.handValue(h.cards);
                    const showResult = st.phase === 'settled' && !settling && h.result;
                    const cls = v.total > 21 ? ' bust' : showResult ? (h.result === 'win' || h.result === 'blackjack' ? ' win' : h.result === 'push' ? ' push' : ' lose') : '';
                    return (
                      <div key={i} className={`bj-hand${playing && i === st.active ? ' active' : ''}`}>
                        <div className="hand-label">{hs.length > 1 ? `${seatList.length > 1 ? `H${seat + 1}` : 'Hand'} ${hs.indexOf(h) + 1}` : seatList.length > 1 ? `Hand ${seat + 1}` : 'You'}{shown(seat, 1) ? <b className={`total${cls}`}>{v.total > 21 ? 'Bust' : BJ.isBlackjack(h.cards) && !h.fromSplit ? 'Blackjack' : `${v.soft && v.total <= 21 ? 'soft ' : ''}${v.total}`}</b> : null}</div>
                        <div className="hand-cards">{h.cards.map((c, j) => (shown(seat, j) ? <PlayingCard key={j} card={c} /> : <CardSlot key={j} />))}</div>
                        <div className="hand-bet"><span className="bet-pill">Bet <b>{fmtMoney(h.bet)}</b></span>{showResult ? <span className={`result-tag ${h.result === 'blackjack' ? 'win' : h.result}`}>{RESULT_LABEL[h.result!]}{h.payout && h.payout > h.bet ? ` +${fmtMoney(h.payout - h.bet)}` : ''}</span> : null}</div>
                      </div>
                    );
                  })}
                </div>
                {sideBadges(seat)}
              </div>
            );
          })}
        </div>
        {payout !== null && !settling ? <Payout net={payout} mult={payout > 0 ? (st.returned) / st.staked : undefined} /> : null}
      </div>
    </GameFrame>
  );
}
