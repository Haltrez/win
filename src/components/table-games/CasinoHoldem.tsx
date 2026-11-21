'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import * as CH from '@/lib/table-games/casino-holdem';
import { CATEGORY_LABEL } from '@/lib/table-games/poker';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame, BetInput, Payout } from './GameFrame';
import { PlayingCard, CardSlot } from './PlayingCard';

const ORDER = { p0: 0, d0: 1, p1: 2, d1: 3, b0: 4, b1: 5, b2: 6 } as const;

export default function CasinoHoldem({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('casino-holdem');
  const [hint, setHint] = useState(false);
  const [ante, setAnte] = useState(10);
  const [st, setSt] = useState<CH.ChState | null>(null);
  const [reveal, setReveal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dealt, setDealt] = useState(7);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const deal = () => {
    if (ante <= 0 || ante * 3 > bank.balance) return;
    bank.stake(ante); setReveal(0);
    setSt(CH.chDeal(ante));
    setDealt(0); setBusy(true);
    for (let i = 1; i <= 7; i++) timers.current.push(window.setTimeout(() => setDealt(i), i * 260));
    timers.current.push(window.setTimeout(() => setBusy(false), 7 * 260 + 100));
  };
  const dealtYet = (k: keyof typeof ORDER) => dealt > ORDER[k];
  const finish = (next: CH.ChState, staked: number) => {
    setBusy(true); setSt(next);
    const steps = next.result!.outcome === 'fold' ? [3] : [1, 2, 3];
    steps.forEach((r, i) => timers.current.push(window.setTimeout(() => setReveal(r), 350 + i * 500)));
    timers.current.push(window.setTimeout(() => { bank.settle(next.result!.returned, next.result!.returned - staked); setBusy(false); }, 350 + steps.length * 500 + 250));
  };
  const call = () => { if (!st || st.phase !== 'decide' || busy || ante * 2 > bank.balance) return; bank.stake(ante * 2); finish(CH.chCall(st), ante * 3); };
  const fold = () => { if (!st || st.phase !== 'decide' || busy) return; finish(CH.chFold(st), ante); };
  const newHand = () => { setSt(null); setReveal(0); };

  const advice = useMemo(() => (st && st.phase === 'decide' && dealt >= 7 ? CH.chStrategy(st.player, st.board) : null), [st, dealt]);
  const deciding = st?.phase === 'decide';
  const settled = st?.phase === 'settled' && reveal >= 3 && !busy;
  const r = st?.result;

  const panel = (
    <>
      <BetInput label="Ante" value={ante} onChange={setAnte} max={Math.floor(bank.balance / 3)} disabled={!!st} note="call costs 2× ante" />
      {!st ? <button type="button" className="tg-bet" onClick={deal} disabled={ante <= 0 || ante * 3 > bank.balance}>Deal</button>
        : deciding ? (
          <div className="tg-actions">
            <button type="button" className={`tg-act danger${hint && advice?.action === 'fold' ? ' book' : ''}`} onClick={fold} disabled={busy}>Fold</button>
            <button type="button" className={`tg-act primary${hint && advice?.action === 'call' ? ' book' : ''}`} onClick={call} disabled={busy || ante * 2 > bank.balance}>Call {fmtMoney(ante * 2)}</button>
          </div>
        ) : <button type="button" className="tg-bet" onClick={newHand} disabled={busy}>{busy ? 'Dealer…' : 'New hand'}</button>}
    </>
  );
  const aside = (
    <table className="ch-pay" aria-label="Ante bonus paytable"><thead><tr><th>Your hand</th><th>Ante pays</th></tr></thead>
      <tbody>{CH.CH_ANTE_BONUS.map((p) => <tr key={p.label} className={settled && r && p.cats.includes(r.playerRank.category) && r.outcome !== 'lose' && r.outcome !== 'fold' ? 'hit' : ''}><th>{p.label}</th><td>{p.pays}:1</td></tr>)}</tbody></table>
  );
  const outcomeText = () => {
    if (!r || !settled) return null;
    const you = CATEGORY_LABEL[r.playerRank.category], dl = CATEGORY_LABEL[r.dealerRank.category];
    switch (r.outcome) {
      case 'fold': return <><b>Folded</b><span>Ante lost ({fmtMoney(st!.ante)}). Dealer had {dl.toLowerCase()}.</span></>;
      case 'no-qualify': return <><b>Dealer doesn&apos;t qualify</b><span>Ante pays {CH.anteBonusPays(r.playerRank.category)}:1 on your {you.toLowerCase()}, call pushes</span></>;
      case 'win': return <><b>You win</b><span>{you} beats {dl.toLowerCase()}</span></>;
      case 'push': return <><b>Push</b><span>Both {you.toLowerCase()} – stakes returned</span></>;
      default: return <><b>Dealer wins</b><span>{dl} beats your {you.toLowerCase()}</span></>;
    }
  };
  const net = settled && r ? r.returned - (r.outcome === 'fold' ? st!.ante : st!.ante * 3) : null;

  return (
    <GameFrame game="casino-holdem" title="Casino Hold'em" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice ? { move: advice.action === 'call' ? 'Call' : 'Fold', reason: advice.reason } : null} panel={panel} aside={aside} busy={busy}>
      <div className="ch">
        <div className="ch-dealer">
          <div className="hand-label">Dealer{settled && r ? <b className={`total${r.dealerQualifies || r.outcome === 'fold' ? '' : ' push'}`}>{r.dealerQualifies || r.outcome === 'fold' ? CATEGORY_LABEL[r.dealerRank.category] : 'No qualify'}</b> : null}</div>
          <div className="hand-cards">{!st ? <><CardSlot /><CardSlot /></> : st.dealer.map((c, i) => (dealtYet(i === 0 ? 'd0' : 'd1') ? <PlayingCard key={i} card={c} faceDown={reveal < 3} /> : <CardSlot key={i} />))}</div>
        </div>
        <div className="ch-board">
          <div className="hand-label">Community cards</div>
          <div className="hand-cards">
            {!st ? Array.from({ length: 5 }, (_, i) => <CardSlot key={i} />) : <>
              {st.board.slice(0, 3).map((c, i) => (dealtYet(i === 0 ? 'b0' : i === 1 ? 'b1' : 'b2') ? <PlayingCard key={i} card={c} /> : <CardSlot key={i} />))}
              {st.board[3] ? <PlayingCard card={st.board[3]} faceDown={reveal < 1} /> : <CardSlot />}
              {st.board[4] ? <PlayingCard card={st.board[4]} faceDown={reveal < 2} /> : <CardSlot />}
            </>}
          </div>
        </div>
        <div className="ch-player">
          <div className="hand-label">You{st && dealt >= 7 ? <b className="total">{CATEGORY_LABEL[(st.phase === 'settled' && reveal >= 2 ? st.result!.playerRank : CH.chFold(st).result!.playerRank).category]}</b> : null}</div>
          <div className="hand-cards">{!st ? <><CardSlot /><CardSlot /></> : st.player.map((c, i) => (dealtYet(i === 0 ? 'p0' : 'p1') ? <PlayingCard key={i} card={c} /> : <CardSlot key={i} />))}</div>
          <div className="ch-bets"><span className="bet-pill">Ante <b>{fmtMoney(st?.ante ?? ante)}</b></span><span className="bet-pill">Call <b>{st?.call ? fmtMoney(st.call) : '–'}</b></span></div>
        </div>
        <div className={`ch-outcome${settled ? ' show' : ''}${settled && r && (r.outcome === 'win' || r.outcome === 'no-qualify') ? ' won' : ''}`} role="status" aria-live="polite">
          {settled ? outcomeText() : deciding && dealt < 7 ? <span>Dealing…</span> : deciding ? <span>Call (2× ante) or fold</span> : busy ? <span>Turn and river…</span> : <span>Dealer qualifies with a pair of 4s or better · ante bonus up to 100:1</span>}
        </div>

        {net !== null && net >= 0 ? <Payout net={net} mult={net > 0 ? r!.returned / (st!.ante * 3) : undefined} /> : null}
      </div>
    </GameFrame>
  );
}
