'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import { Shoe } from '@/lib/table-games/cards';
import * as BJ from '@/lib/table-games/blackjack';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame } from './GameFrame';
import { PlayingCard, CardSlot } from './PlayingCard';
import { Chip, ChipStack, CHIP_VALUES } from './Chip';

const RESULT_LABEL = { win: 'Win', lose: 'Lose', push: 'Push', blackjack: 'Blackjack!' } as const;

export default function Blackjack({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('blackjack');
  const [hint, setHint] = useState(false);
  const shoeRef = useRef<Shoe | null>(null);
  const shoe = () => (shoeRef.current ??= new Shoe(BJ.BJ_RULES.decks));
  const [bet, setBet] = useState(25);
  const [st, setSt] = useState<BJ.BjState>(BJ.initialBjState());
  const [revealed, setRevealed] = useState(1);
  const [settling, setSettling] = useState(false);
  const [shoeLeft, setShoeLeft] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const inBet = st.phase === 'bet';
  const playing = st.phase === 'player';
  const active = st.hands[st.active];

  // Dealer reveal pacing: flip the hole card, then each drawn card, then pay out.
  useEffect(() => {
    if (st.phase !== 'settled') return;
    setSettling(true);
    const n = st.dealer.length;
    const stepMs = 450;
    for (let i = 2; i <= n; i++) timers.current.push(window.setTimeout(() => setRevealed(i), (i - 1) * stepMs));
    timers.current.push(window.setTimeout(() => { bank.settle(st.returned, st.returned - st.staked); setSettling(false); }, n * stepMs + 150));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.phase]);

  const deal = () => {
    if (bet <= 0 || bet > bank.balance) return;
    const sh = shoe();
    bank.stake(bet);
    setRevealed(1);
    const s = BJ.deal(sh, bet);
    setShoeLeft(sh.remaining);
    setSt(s);
  };
  const act = (a: BJ.BjAction) => {
    if (!playing || settling) return;
    const sh = shoe();
    if ((a === 'double' || a === 'split') && active.bet > bank.balance) return;
    if (a === 'double' || a === 'split') bank.stake(active.bet);
    const next = a === 'hit' ? BJ.hit(sh, st) : a === 'stand' ? BJ.stand(sh, st) : a === 'double' ? BJ.double(sh, st) : BJ.split(sh, st);
    setShoeLeft(sh.remaining);
    setSt(next);
  };
  const newHand = () => { setSt(BJ.initialBjState()); setRevealed(1); if (bet > bank.balance) setBet(Math.min(bet, Math.max(0, Math.floor(bank.balance)))); };

  const advice = useMemo(() => {
    if (!playing || !active) return null;
    const a = BJ.basicStrategy(active.cards, st.dealer[0], { canSplit: BJ.canSplit(st), canDouble: BJ.canDouble(st) });
    return { action: a.action, move: a.action[0].toUpperCase() + a.action.slice(1), reason: a.reason };
  }, [st, playing, active]);

  const dealerShown = st.phase === 'player' ? st.dealer.slice(0, 1) : st.dealer.slice(0, revealed);
  const dealerTotal = st.phase === 'settled' && revealed >= st.dealer.length ? BJ.handValue(st.dealer) : null;
  const canAfford = (x: number) => x <= bank.balance;

  const controls = inBet ? (
    <>
      <div className="tg-chips" role="group" aria-label="Bet size">
        {CHIP_VALUES.map((v) => <Chip key={v} value={v} onClick={() => setBet((b) => Math.min(b + v, Math.floor(bank.balance)))} disabled={bet + v > bank.balance} label={`Add ${v} to bet`} />)}
        <button type="button" className="tg-btn ghost" onClick={() => setBet(0)} disabled={bet === 0}>Clear</button>
      </div>
      <button type="button" className="tg-btn primary big" onClick={deal} disabled={bet <= 0 || bet > bank.balance}>Deal · {fmtMoney(bet)}</button>
    </>
  ) : st.phase === 'settled' ? (
    <button type="button" className="tg-btn primary big" onClick={newHand} disabled={settling}>{settling ? 'Dealer…' : 'New hand'}</button>
  ) : (
    <div className="tg-actions" role="group" aria-label="Actions">
      {(['hit', 'stand', 'double', 'split'] as BJ.BjAction[]).map((a) => {
        const ok = a === 'hit' ? BJ.canHit(st) : a === 'stand' ? true : a === 'double' ? BJ.canDouble(st) && canAfford(active.bet) : BJ.canSplit(st) && canAfford(active.bet);
        return <button key={a} type="button" className={`tg-btn${hint && advice?.action === a ? ' book' : ''}`} onClick={() => act(a)} disabled={!ok || settling}>{a[0].toUpperCase() + a.slice(1)}</button>;
      })}
    </div>
  );

  return (
    <GameFrame game="blackjack" title="Blackjack" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice ? { move: advice.move, reason: advice.reason } : null} controls={controls} busy={settling}>
      <div className="bj">
        <div className="bj-rules" aria-hidden>Blackjack pays 3 to 2 · Dealer stands on soft 17 · 6 decks</div>
        <div className="bj-dealer">
          <div className="hand-label">Dealer{dealerTotal ? <b className="total">{dealerTotal.total > 21 ? 'Bust' : dealerTotal.total}</b> : st.dealer.length ? <b className="total">{BJ.handValue(dealerShown).total}</b> : null}</div>
          <div className="hand-cards">
            {st.dealer.length === 0 ? <><CardSlot /><CardSlot /></> : st.dealer.map((c, i) => (i < dealerShown.length || i === 1 ? <PlayingCard key={i} card={c} faceDown={i === 1 && revealed < 2} dealIndex={i === 1 ? 3 : i === 0 ? 1 : 0} /> : null))}
          </div>
        </div>
        <div className="bj-centre" aria-hidden>{shoeLeft != null ? <span className="bj-shoe">Shoe: {shoeLeft} cards left</span> : <span className="bj-shoe">Place your bet</span>}</div>
        <div className={`bj-player hands-${Math.max(1, st.hands.length)}`}>
          {st.hands.length === 0 ? (
            <div className="bj-hand">
              <div className="hand-cards"><CardSlot /><CardSlot /></div>
              <div className="hand-bet">{bet > 0 ? <ChipStack amount={bet} /> : <span className="bet-spot" />}</div>
            </div>
          ) : st.hands.map((h, i) => {
            const v = BJ.handValue(h.cards);
            const showResult = st.phase === 'settled' && !settling && h.result;
            return (
              <div key={i} className={`bj-hand${playing && i === st.active ? ' active' : ''}${showResult ? ` res-${h.result}` : ''}`}>
                <div className="hand-label">{st.hands.length > 1 ? `Hand ${i + 1}` : 'You'}<b className="total">{v.total > 21 ? 'Bust' : BJ.isBlackjack(h.cards) && !h.fromSplit ? 'BJ' : `${v.soft && v.total <= 21 ? 'soft ' : ''}${v.total}`}</b></div>
                <div className="hand-cards">{h.cards.map((c, j) => <PlayingCard key={j} card={c} dealIndex={st.hands.length === 1 && h.cards.length <= 2 ? j * 2 : 0} />)}</div>
                <div className="hand-bet"><ChipStack amount={h.bet} />{showResult ? <span className={`hand-result ${h.result}`}>{RESULT_LABEL[h.result!]}{h.payout && h.payout > h.bet ? ` +${fmtMoney(h.payout - h.bet)}` : ''}</span> : null}</div>
              </div>
            );
          })}
        </div>
      </div>
    </GameFrame>
  );
}
