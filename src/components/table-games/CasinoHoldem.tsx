'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import * as CH from '@/lib/table-games/casino-holdem';
import { CATEGORY_LABEL } from '@/lib/table-games/poker';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame } from './GameFrame';
import { PlayingCard, CardSlot } from './PlayingCard';
import { Chip, ChipStack, CHIP_VALUES } from './Chip';

export default function CasinoHoldem({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('casino-holdem');
  const [hint, setHint] = useState(false);
  const [ante, setAnte] = useState(10);
  const [st, setSt] = useState<CH.ChState | null>(null);
  const [reveal, setReveal] = useState(0); // 0 none · 1 turn · 2 river · 3 dealer
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const deal = () => {
    if (ante <= 0 || ante * 3 > bank.balance) return;
    bank.stake(ante); setReveal(0);
    setSt(CH.chDeal(ante));
  };
  const finish = (next: CH.ChState, staked: number) => {
    setBusy(true); setSt(next);
    const steps = next.result!.outcome === 'fold' ? [3] : [1, 2, 3];
    steps.forEach((r, i) => timers.current.push(window.setTimeout(() => setReveal(r), 350 + i * 500)));
    timers.current.push(window.setTimeout(() => { bank.settle(next.result!.returned, next.result!.returned - staked); setBusy(false); }, 350 + steps.length * 500 + 250));
  };
  const call = () => { if (!st || st.phase !== 'decide' || busy || ante * 2 > bank.balance) return; bank.stake(ante * 2); finish(CH.chCall(st), ante * 3); };
  const fold = () => { if (!st || st.phase !== 'decide' || busy) return; finish(CH.chFold(st), ante); };
  const newHand = () => { setSt(null); setReveal(0); };

  const advice = useMemo(() => (st && st.phase === 'decide' ? CH.chStrategy(st.player, st.board) : null), [st]);
  const deciding = st?.phase === 'decide';
  const settled = st?.phase === 'settled' && reveal >= 3 && !busy;
  const r = st?.result;

  const controls = !st ? (
    <>
      <div className="tg-chips" role="group" aria-label="Ante">{CHIP_VALUES.map((v) => <Chip key={v} value={v} onClick={() => setAnte((a) => Math.min(a + v, Math.floor(bank.balance / 3)))} disabled={(ante + v) * 3 > bank.balance} label={`Add ${v} to ante`} />)}<button type="button" className="tg-btn ghost" onClick={() => setAnte(0)} disabled={!ante}>Clear</button></div>
      <button type="button" className="tg-btn primary big" onClick={deal} disabled={ante <= 0 || ante * 3 > bank.balance}>Deal · ante {fmtMoney(ante)}</button>
    </>
  ) : deciding ? (
    <div className="tg-actions">
      <button type="button" className={`tg-btn${hint && advice?.action === 'fold' ? ' book' : ''}`} onClick={fold} disabled={busy}>Fold</button>
      <button type="button" className={`tg-btn primary big${hint && advice?.action === 'call' ? ' book' : ''}`} onClick={call} disabled={busy || ante * 2 > bank.balance}>Call · {fmtMoney(ante * 2)}</button>
    </div>
  ) : (
    <button type="button" className="tg-btn primary big" onClick={newHand} disabled={busy}>{busy ? 'Dealer…' : 'New hand'}</button>
  );

  const aside = (
    <table className="ch-pay" aria-label="Ante bonus paytable">
      <thead><tr><th>Your hand</th><th>Ante pays</th></tr></thead>
      <tbody>{CH.CH_ANTE_BONUS.map((p) => <tr key={p.label} className={settled && r && p.cats.includes(r.playerRank.category) && r.outcome !== 'lose' && r.outcome !== 'fold' ? 'hit' : ''}><th>{p.label}</th><td>{p.pays}:1</td></tr>)}</tbody>
    </table>
  );

  const outcomeText = () => {
    if (!r || !settled) return null;
    const you = CATEGORY_LABEL[r.playerRank.category], dl = CATEGORY_LABEL[r.dealerRank.category];
    switch (r.outcome) {
      case 'fold': return <><b>Folded</b><span>Ante lost ({fmtMoney(st!.ante)}). Dealer had {dl.toLowerCase()}.</span></>;
      case 'no-qualify': return <><b>Dealer doesn&apos;t qualify</b><span>Ante pays {CH.anteBonusPays(r.playerRank.category)}:1 on your {you.toLowerCase()}, call pushes · +{fmtMoney(r.returned - st!.ante * 3)}</span></>;
      case 'win': return <><b>You win</b><span>{you} beats {dl.toLowerCase()} · +{fmtMoney(r.returned - st!.ante * 3)}</span></>;
      case 'push': return <><b>Push</b><span>Both {you.toLowerCase()} – stakes returned</span></>;
      default: return <><b>Dealer wins</b><span>{dl} beats your {you.toLowerCase()} · −{fmtMoney(st!.ante * 3)}</span></>;
    }
  };

  return (
    <GameFrame game="casino-holdem" title="Casino Hold'em" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice ? { move: advice.action === 'call' ? 'Call' : 'Fold', reason: advice.reason } : null} controls={controls} aside={aside} busy={busy}>
      <div className="ch">
        <div className="ch-dealer">
          <div className="hand-label">Dealer{settled && r ? <b className="total">{r.dealerQualifies || r.outcome === 'fold' ? CATEGORY_LABEL[r.dealerRank.category] : 'No qualify'}</b> : null}</div>
          <div className="hand-cards">{!st ? <><CardSlot /><CardSlot /></> : st.dealer.map((c, i) => <PlayingCard key={i} card={c} faceDown={reveal < 3} dealIndex={i + 2} />)}</div>
        </div>
        <div className="ch-board">
          <div className="hand-label">Community cards</div>
          <div className="hand-cards">
            {!st ? Array.from({ length: 5 }, (_, i) => <CardSlot key={i} />) : <>
              {st.board.slice(0, 3).map((c, i) => <PlayingCard key={i} card={c} dealIndex={i + 4} />)}
              {st.board[3] ? <PlayingCard card={st.board[3]} faceDown={reveal < 1} /> : <CardSlot />}
              {st.board[4] ? <PlayingCard card={st.board[4]} faceDown={reveal < 2} /> : <CardSlot />}
            </>}
          </div>
        </div>
        <div className={`ch-outcome${settled ? ' show' : ''}${settled && r && (r.outcome === 'win' || r.outcome === 'no-qualify') ? ' won' : ''}`} role="status" aria-live="polite">
          {settled ? outcomeText() : deciding ? <span>Call (2× ante) or fold</span> : busy ? <span>Turn and river…</span> : <span>Dealer qualifies with a pair of 4s or better</span>}
        </div>
        <div className="ch-player">
          <div className="hand-label">You{st ? <b className="total">{CATEGORY_LABEL[(st.phase === 'settled' && reveal >= 2 ? st.result!.playerRank : CH.chFold(st).result!.playerRank).category]}</b> : null}</div>
          <div className="hand-cards">{!st ? <><CardSlot /><CardSlot /></> : st.player.map((c, i) => <PlayingCard key={i} card={c} dealIndex={i} />)}</div>
          <div className="ch-bets">
            <div className="ch-bet"><span>Ante</span>{(st?.ante ?? ante) > 0 ? <ChipStack amount={st?.ante ?? ante} /> : <span className="bet-spot" />}</div>
            <div className="ch-bet"><span>Call</span>{st?.call ? <ChipStack amount={st.call} /> : <span className="bet-spot" />}</div>
          </div>
        </div>
      </div>
    </GameFrame>
  );
}
