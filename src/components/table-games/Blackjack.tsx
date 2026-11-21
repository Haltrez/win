'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import { Shoe } from '@/lib/table-games/cards';
import * as BJ from '@/lib/table-games/blackjack';
import { evaluate21p3, evaluatePerfectPairs, type SideResult } from '@/lib/table-games/blackjack-side';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame } from './GameFrame';
import { PlayingCard, CardSlot } from './PlayingCard';
import { Chip, ChipStack, CHIP_VALUES } from './Chip';

const RESULT_LABEL = { win: 'Win', lose: 'Lose', push: 'Push', blackjack: 'Blackjack!' } as const;
type Spot = 'main' | 'p21' | 'pp';
type Bets = Record<Spot, number>;
const NO_BETS: Bets = { main: 0, p21: 0, pp: 0 };
const SPOTS: { k: Spot; name: string; sub: string }[] = [{ k: 'p21', name: '21+3', sub: 'up to 100:1' }, { k: 'main', name: 'Main bet', sub: 'blackjack 3:2' }, { k: 'pp', name: 'Perfect Pairs', sub: 'up to 25:1' }];

export default function Blackjack({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('blackjack');
  const [hint, setHint] = useState(false);
  const shoeRef = useRef<Shoe | null>(null);
  const shoe = () => (shoeRef.current ??= new Shoe(BJ.BJ_RULES.decks));
  const [chip, setChip] = useState(25);
  const [bets, setBets] = useState<Bets>({ ...NO_BETS, main: 25 });
  const [lastBets, setLastBets] = useState<Bets>({ ...NO_BETS, main: 25 });
  const [st, setSt] = useState<BJ.BjState>(BJ.initialBjState());
  const [seats, setSeats] = useState(1);
  type SeatSide = { p21: SideResult | 'lose' | null; pp: SideResult | 'lose' | null };
  const [sideRes, setSideRes] = useState<{ seats: SeatSide[]; net: number }>({ seats: [], net: 0 });
  const [revealed, setRevealed] = useState(1);
  const [settling, setSettling] = useState(false);
  const [shoeLeft, setShoeLeft] = useState<number | null>(null);
  /** Cards of the opening deal shown so far (seat 1, seat 2…, dealer, then the second round) – the deal is animated one card at a time. */
  const [dealt, setDealt] = useState(0);
  const [dealing, setDealing] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const inBet = st.phase === 'bet';
  const playing = st.phase === 'player';
  const active = st.hands[st.active];
  const perSeat = bets.main + bets.p21 + bets.pp;
  const total = perSeat * seats;

  // Dealer reveal pacing: flip the hole card, then each drawn card, then pay out (side bets were paid at the deal).
  useEffect(() => {
    if (st.phase !== 'settled' || dealing) return;
    setSettling(true);
    const n = st.dealer.length;
    const stepMs = 450;
    for (let i = 2; i <= n; i++) timers.current.push(window.setTimeout(() => setRevealed(i), (i - 1) * stepMs));
    timers.current.push(window.setTimeout(() => { bank.settle(st.returned, st.returned - st.staked + sideRes.net); setSettling(false); }, n * stepMs + 150));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.phase, dealing]);

  const addChip = (k: Spot) => { if (!inBet || total + chip > bank.balance) return; setBets((b) => ({ ...b, [k]: b[k] + chip })); };
  const deal = () => {
    if (bets.main <= 0 || total > bank.balance) return;
    const sh = shoe();
    bank.stake(total);
    setLastBets(bets);
    setRevealed(1);
    const s = BJ.dealSeats(sh, Array.from({ length: seats }, () => bets.main));
    // Side bets resolve at once, per seat, on that seat's two cards and the dealer's up-card.
    let payout = 0;
    const perSeatRes: SeatSide[] = s.hands.map((h) => {
      const [c1, c2] = h.cards;
      const r21 = bets.p21 ? evaluate21p3(c1, c2, s.dealer[0]) : null, rpp = bets.pp ? evaluatePerfectPairs(c1, c2) : null;
      payout += (r21 ? bets.p21 * (r21.pays + 1) : 0) + (rpp ? bets.pp * (rpp.pays + 1) : 0);
      return { p21: bets.p21 ? r21 ?? 'lose' : null, pp: bets.pp ? rpp ?? 'lose' : null };
    });
    if (payout) bank.stake(-payout);
    setSideRes({ seats: perSeatRes, net: payout - (bets.p21 + bets.pp) * seats });
    setShoeLeft(sh.remaining);
    const n = seats * 2 + 2, step = 260;
    setDealt(0); setDealing(true);
    for (let i = 1; i <= n; i++) timers.current.push(window.setTimeout(() => setDealt(i), i * step));
    timers.current.push(window.setTimeout(() => setDealing(false), n * step + 150));
    setSt(s);
  };
  /** Is this opening card on the table yet? Later cards (hits, splits) always are. */
  const shown = (seat: number, j: number) => !dealing || j >= 2 || j * (seats + 1) + seat < dealt;
  const dealerShownYet = (i: number) => !dealing || i >= 2 || i * (seats + 1) + seats < dealt;
  const act = (a: BJ.BjAction) => {
    if (!playing || settling || dealing) return;
    const sh = shoe();
    if ((a === 'double' || a === 'split') && active.bet > bank.balance) return;
    if (a === 'double' || a === 'split') bank.stake(active.bet);
    const next = a === 'hit' ? BJ.hit(sh, st) : a === 'stand' ? BJ.stand(sh, st) : a === 'double' ? BJ.double(sh, st) : BJ.split(sh, st);
    setShoeLeft(sh.remaining);
    setSt(next);
  };
  const newHand = () => {
    setSt(BJ.initialBjState()); setRevealed(1); setSideRes({ seats: [], net: 0 });
    const t = (lastBets.main + lastBets.p21 + lastBets.pp) * seats;
    setBets(t <= bank.balance ? lastBets : { ...NO_BETS, main: Math.min(lastBets.main, Math.max(0, Math.floor(bank.balance))) });
  };

  const advice = useMemo(() => {
    if (inBet) return { action: null, move: 'Main bet only', reason: 'Side bets pay big on rare hands and lose on all the others, so they cost far more over time than the main hand played with basic strategy.' };
    if (!playing || !active || dealing) return null;
    const a = BJ.basicStrategy(active.cards, st.dealer[0], { canSplit: BJ.canSplit(st), canDouble: BJ.canDouble(st) });
    return { action: a.action as BJ.BjAction | null, move: a.action[0].toUpperCase() + a.action.slice(1), reason: a.reason };
  }, [st, playing, active, inBet, dealing]);

  const dealerShown = (st.phase === 'player' || dealing ? st.dealer.slice(0, 1) : st.dealer.slice(0, revealed)).filter((_, i) => dealerShownYet(i));
  const dealerTotal = st.phase === 'settled' && !dealing && revealed >= st.dealer.length ? BJ.handValue(st.dealer) : null;
  const canAfford = (x: number) => x <= bank.balance;

  const controls = inBet ? (
    <>
      <div className="tg-chips" role="group" aria-label="Chip value">
        {CHIP_VALUES.map((v) => <Chip key={v} value={v} selected={chip === v} onClick={() => setChip(v)} label={`Bet with ${v} chips`} />)}
        <button type="button" className="tg-btn ghost" onClick={() => setBets(NO_BETS)} disabled={total === 0}>Clear</button>
        <span className="bj-seats" role="group" aria-label="Number of hands">
          <span className="bj-seats-label">Hands</span>
          {[1, 2, 3].map((n) => <button key={n} type="button" className={`bj-seat-btn${seats === n ? ' on' : ''}`} aria-pressed={seats === n} onClick={() => setSeats(n)}>{n}</button>)}
        </span>
      </div>
      <button type="button" className="tg-btn primary big" onClick={deal} disabled={bets.main <= 0 || total > bank.balance}>Deal · {fmtMoney(total)}</button>
    </>
  ) : st.phase === 'settled' ? (
    <button type="button" className="tg-btn primary big" onClick={newHand} disabled={settling || dealing}>{settling || dealing ? 'Dealer…' : 'New hand'}</button>
  ) : (
    <div className="tg-actions" role="group" aria-label="Actions">
      {(['hit', 'stand', 'double', 'split'] as BJ.BjAction[]).map((a) => {
        const ok = a === 'hit' ? BJ.canHit(st) : a === 'stand' ? true : a === 'double' ? BJ.canDouble(st) && canAfford(active.bet) : BJ.canSplit(st) && canAfford(active.bet);
        return <button key={a} type="button" className={`tg-btn${hint && advice?.action === a ? ' book' : ''}`} onClick={() => act(a)} disabled={!ok || settling || dealing}>{a[0].toUpperCase() + a.slice(1)}</button>;
      })}
    </div>
  );

  const sideBadges = (seat: number) => {
    const r = sideRes.seats[seat]; if (!r || dealing) return null;
    const one = (k: 'p21' | 'pp', name: string) => { const x = r[k]; if (!x) return null; return x === 'lose' ? <span key={k} className="bj-side-res lose">{name}: no win</span> : <span key={k} className="bj-side-res win">{name}: {x.label} +{fmtMoney(bets[k] * x.pays)}</span>; };
    return <div className="bj-side-results">{one('p21', '21+3')}{one('pp', 'Pairs')}</div>;
  };
  const seatList = Array.from({ length: st.hands.length ? Math.max(...st.hands.map((h) => h.seat)) + 1 : seats }, (_, i) => i);

  return (
    <GameFrame game="blackjack" title="Blackjack" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice ? { move: advice.move, reason: advice.reason } : null} controls={controls} busy={settling || dealing}>
      <div className="bj">
        <div className="bj-rules" aria-hidden>Blackjack pays 3 to 2 · Dealer stands on soft 17 · 6 decks</div>
        <div className="bj-dealer">
          <div className="hand-label">Dealer{dealerTotal ? <b className="total">{dealerTotal.total > 21 ? 'Bust' : dealerTotal.total}</b> : st.dealer.length ? <b className="total">{BJ.handValue(dealerShown).total}</b> : null}</div>
          <div className="hand-cards">
            {st.dealer.length === 0 ? <><CardSlot /><CardSlot /></> : st.dealer.map((c, i) => (!dealerShownYet(i) ? <CardSlot key={i} /> : i < dealerShown.length || i === 1 ? <PlayingCard key={i} card={c} faceDown={i === 1 && (revealed < 2 || dealing)} /> : null))}
          </div>
        </div>
        <div className="bj-centre" aria-hidden>{dealing ? <span className="bj-shoe">Dealing…</span> : shoeLeft != null ? <span className="bj-shoe">Shoe: {shoeLeft} cards left</span> : <span className="bj-shoe">Place your bets</span>}</div>
        <div className={`bj-player seats-${seatList.length} hands-${Math.max(1, st.hands.length)}`}>
          {seatList.map((seat) => {
            const hs = st.hands.filter((h) => h.seat === seat);
            return (
              <div key={seat} className="bj-seat">
                <div className="bj-seat-hands">
                  {hs.length === 0 ? (
                    <div className="bj-hand"><div className="hand-label">{seatList.length > 1 ? `Hand ${seat + 1}` : 'You'}</div><div className="hand-cards"><CardSlot /><CardSlot /></div></div>
                  ) : hs.map((h) => {
                    const i = st.hands.indexOf(h);
                    const v = BJ.handValue(h.cards);
                    const showResult = st.phase === 'settled' && !settling && h.result;
                    return (
                      <div key={i} className={`bj-hand${playing && i === st.active ? ' active' : ''}${showResult ? ` res-${h.result}` : ''}`}>
                        <div className="hand-label">{hs.length > 1 ? `${seatList.length > 1 ? `H${seat + 1}` : 'Hand'} ${hs.indexOf(h) + 1}` : seatList.length > 1 ? `Hand ${seat + 1}` : 'You'}{shown(seat, 1) ? <b className="total">{v.total > 21 ? 'Bust' : BJ.isBlackjack(h.cards) && !h.fromSplit ? 'BJ' : `${v.soft && v.total <= 21 ? 'soft ' : ''}${v.total}`}</b> : null}</div>
                        <div className="hand-cards">{h.cards.map((c, j) => (shown(seat, j) ? <PlayingCard key={j} card={c} /> : <CardSlot key={j} />))}</div>
                        <div className="hand-bet"><ChipStack amount={h.bet} />{showResult ? <span className={`hand-result ${h.result}`}>{RESULT_LABEL[h.result!]}{h.payout && h.payout > h.bet ? ` +${fmtMoney(h.payout - h.bet)}` : ''}</span> : null}</div>
                      </div>
                    );
                  })}
                </div>
                {sideBadges(seat)}
              </div>
            );
          })}
        </div>
        <div className="bj-spots" role="group" aria-label="Bet spots">
          {SPOTS.map((s) => (
            <button key={s.k} type="button" className={`bj-spot ${s.k}${hint && inBet && s.k === 'main' ? ' book' : ''}${hint && inBet && s.k !== 'main' ? ' nobook' : ''}`} onClick={() => addChip(s.k)} disabled={!inBet} aria-label={`${s.name}: ${fmtMoney(bets[s.k])}`}>
              <span className="bj-spot-name">{s.name}</span>
              <span className="bj-spot-sub">{s.sub}</span>
              {bets[s.k] ? <ChipStack amount={bets[s.k]} /> : <span className="bet-spot" />}
              {seats > 1 && bets[s.k] ? <span className="bj-spot-x">× {seats} hands</span> : null}
            </button>
          ))}
        </div>
      </div>
    </GameFrame>
  );
}
