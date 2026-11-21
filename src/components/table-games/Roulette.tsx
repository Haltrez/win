'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CtaCasino } from '../DemoCta';
import * as RL from '@/lib/table-games/roulette';
import { useBankroll, fmtMoney } from './useBankroll';
import { GameFrame, BetInput, Payout } from './GameFrame';
import { ChipStack } from './Chip';

type Mode = 'straight' | 'split' | 'street' | 'corner' | 'line';
const MODES: { k: Mode; label: string; pays: string }[] = [{ k: 'straight', label: 'Straight', pays: '35:1' }, { k: 'split', label: 'Split', pays: '17:1' }, { k: 'street', label: 'Street', pays: '11:1' }, { k: 'corner', label: 'Corner', pays: '8:1' }, { k: 'line', label: 'Line', pays: '5:1' }];
const STEP = 360 / 37;
const SPIN_MS = 4400;
const EVEN_MONEY: RL.BetKind[] = ['low', 'even', 'red', 'black', 'odd', 'high'];

/* ---- wheel geometry */
const polar = (r: number, deg: number) => { const a = ((deg - 90) * Math.PI) / 180; return [200 + r * Math.cos(a), 200 + r * Math.sin(a)]; };
const wedge = (i: number, r1: number, r2: number) => {
  const a0 = i * STEP - STEP / 2, a1 = i * STEP + STEP / 2;
  const [x0, y0] = polar(r2, a0), [x1, y1] = polar(r2, a1), [x2, y2] = polar(r1, a1), [x3, y3] = polar(r1, a0);
  return `M${x0} ${y0} A${r2} ${r2} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r1} ${r1} 0 0 0 ${x3} ${y3} Z`;
};
const FILL = { red: '#b3152b', black: '#14161c', green: '#0e7a44' };

function Wheel({ rot, ballRot, ballR, spinning, result }: { rot: number; ballRot: number; ballR: number; spinning: boolean; result: number | null }) {
  return (
    <div className={`rw${spinning ? ' spinning' : ''}`} style={{ ['--rot' as string]: `${rot}deg`, ['--ball' as string]: `${ballRot}deg`, ['--ball-r' as string]: `${ballR}px` }}>
      <svg viewBox="0 0 400 400" className="rw-svg" aria-hidden>
        <defs>
          <radialGradient id="rw-rim" cx="50%" cy="50%" r="50%"><stop offset="88%" stopColor="#5a3a12" /><stop offset="93%" stopColor="#e2b358" /><stop offset="97%" stopColor="#8a5a1a" /><stop offset="100%" stopColor="#3d2608" /></radialGradient>
          <radialGradient id="rw-cone" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor="#3a2a16" /><stop offset="60%" stopColor="#1b140a" /><stop offset="100%" stopColor="#0d0906" /></radialGradient>
          <radialGradient id="rw-hub" cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor="#fff1c2" /><stop offset="40%" stopColor="#e2b358" /><stop offset="100%" stopColor="#7a4e14" /></radialGradient>
          <radialGradient id="rw-ball" cx="35%" cy="30%" r="70%"><stop offset="0%" stopColor="#ffffff" /><stop offset="60%" stopColor="#d9dde3" /><stop offset="100%" stopColor="#7d858f" /></radialGradient>
        </defs>
        <circle cx="200" cy="200" r="198" fill="url(#rw-rim)" />
        <g className="rw-rotor">
          <circle cx="200" cy="200" r="178" fill="#0b0a08" />
          {RL.WHEEL_ORDER.map((n, i) => <path key={n} d={wedge(i, 128, 176)} fill={FILL[RL.pocketColor(n)]} stroke="#e2b358" strokeWidth="0.8" className={result === n && !spinning ? 'rw-hit' : undefined} />)}
          {RL.WHEEL_ORDER.map((n, i) => { const [x, y] = polar(161, i * STEP); return <text key={n} x={x} y={y} fontSize="13" fontWeight="700" fill="#fff" textAnchor="middle" dominantBaseline="central" transform={`rotate(${i * STEP} ${x} ${y})`}>{n}</text>; })}
          <circle cx="200" cy="200" r="128" fill="url(#rw-cone)" stroke="#e2b358" strokeWidth="2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const [x1, y1] = polar(40, a), [x2, y2] = polar(118, a); return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e2b358" strokeWidth="3" strokeLinecap="round" opacity=".85" />; })}
          <circle cx="200" cy="200" r="34" fill="url(#rw-hub)" />
          <circle cx="200" cy="200" r="10" fill="#3d2608" />
        </g>
      </svg>
      <div className="rw-ball-orbit" aria-hidden><span className="rw-ball" /></div>
      <div className="rw-pointer" aria-hidden />
    </div>
  );
}

export default function Roulette({ casinos }: { casinos: CtaCasino[] }) {
  const bank = useBankroll('roulette');
  const [hint, setHint] = useState(false);
  const [chip, setChip] = useState(5);
  const bal = bank.balance;
  const [mode, setMode] = useState<Mode>('straight');
  const [bets, setBets] = useState<RL.RouletteBet[]>([]);
  const [lastBets, setLastBets] = useState<RL.RouletteBet[]>([]);
  const [splitFrom, setSplitFrom] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rot, setRot] = useState(0);
  const [ballRot, setBallRot] = useState(0);
  const [ballR, setBallR] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [last, setLast] = useState<{ n: number; won: number; staked: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const wheelW = useRef(260);
  const wheelEl = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = wheelEl.current; if (!el) return; const ro = new ResizeObserver(() => { wheelW.current = el.clientWidth; setBallR((r) => (r === 0 ? el.clientWidth * 0.455 : r)); }); ro.observe(el); return () => ro.disconnect(); }, []);

  const total = bets.reduce((t, b) => t + b.amount, 0);
  const add = (def: Omit<RL.RouletteBet, 'amount'>) => {
    if (spinning) return;
    if (chip <= 0 || total + chip > bank.balance) return;
    setBets((bs) => { const i = bs.findIndex((b) => b.id === def.id); if (i >= 0) { const c = [...bs]; c[i] = { ...c[i], amount: c[i].amount + chip }; return c; } return [...bs, { ...def, amount: chip }]; });
    setLast(null);
  };
  const onNumber = (n: number) => {
    if (n === 0) { if (mode === 'split' && splitFrom !== null && splitFrom <= 3) { add(RL.makeBet('split', [0, splitFrom])); setSplitFrom(null); return; } add(RL.makeBet('straight', [0])); return; }
    const row = Math.floor((n - 1) / 3), col = (n - 1) % 3; // row 0..11, col 0..2
    if (mode === 'straight') add(RL.makeBet('straight', [n]));
    else if (mode === 'street') add(RL.makeBet('street', [row * 3 + 1]));
    else if (mode === 'line') add(RL.makeBet('line', [(row === 11 ? 10 : row) * 3 + 1]));
    else if (mode === 'corner') { const r = row === 11 ? 10 : row, c = col === 2 ? 1 : col; add(RL.makeBet('corner', [r * 3 + c + 1])); }
    else if (mode === 'split') {
      if (splitFrom === null) { setSplitFrom(n); return; }
      if (splitFrom === 0) { if (n <= 3) add(RL.makeBet('split', [0, n])); setSplitFrom(null); return; }
      const adj = Math.abs(splitFrom - n) === 3 || (Math.abs(splitFrom - n) === 1 && Math.floor((splitFrom - 1) / 3) === row);
      if (adj) { add(RL.makeBet('split', [Math.min(splitFrom, n), Math.max(splitFrom, n)])); setSplitFrom(null); } else setSplitFrom(n);
    }
  };
  const splitNeighbours = (n: number) => (splitFrom === null ? false : splitFrom === 0 ? n >= 1 && n <= 3 : n === 0 ? splitFrom <= 3 : Math.abs(splitFrom - n) === 3 || (Math.abs(splitFrom - n) === 1 && Math.floor((splitFrom - 1) / 3) === Math.floor((n - 1) / 3)));

  const spin = () => {
    if (!bets.length || spinning || total > bank.balance) return;
    const result = RL.spinWheel();
    const k = RL.WHEEL_ORDER.indexOf(result);
    const base = ((rot % 360) + 360) % 360;
    const targetMod = (360 - k * STEP) % 360;
    const newRot = rot + 5 * 360 + ((targetMod - base + 360) % 360);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    bank.stake(total);
    setLastBets(bets);
    setSpinning(true); setLast(null); setSplitFrom(null);
    setRot(newRot);
    setBallRot(ballRot - 4 * 360);
    setBallR(wheelW.current * 0.38);
    const ms = reduced ? 400 : SPIN_MS;
    timer.current = window.setTimeout(() => {
      const { returned } = RL.settleBets(bets, result);
      bank.settle(returned, returned - total);
      setHistory((h) => [result, ...h].slice(0, 12));
      setLast({ n: result, won: returned, staked: total });
      setBets([]);
      setSpinning(false);
      setBallR(wheelW.current * 0.455);
    }, ms);
  };
  const result = last?.n ?? history[0] ?? null;

  const advice = useMemo(() => ({ move: 'Any even-money bet – or any bet at all', reason: 'No bet on a single-zero wheel is better than another in the long run, and no pattern or system changes that. Red/black, odd/even and 1-18/19-36 win most often, so they give the smoothest ride.' }), []);

  const chipOn = (id: string) => bets.find((b) => b.id === id)?.amount ?? 0;
  const anchorChip = (n: number) => bets.filter((b) => b.numbers[0] === n && b.kind !== 'straight' && !EVEN_MONEY.includes(b.kind) && b.kind !== 'dozen' && b.kind !== 'column');
  const won = last && last.won >= last.staked;

  const panel = (
    <>
      <BetInput label="Chip value" value={chip} onChange={setChip} max={bal} disabled={spinning} note="tap the layout to place" />
      <div className="tg-field"><div className="tg-field-head"><span>Inside bet type</span></div>
        <div className="tg-seg" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }} role="tablist" aria-label="Inside bet type">
          {MODES.map((m) => <button key={m.k} type="button" role="tab" aria-selected={mode === m.k} className={`rl-mode${mode === m.k ? ' on' : ''}`} onClick={() => { setMode(m.k); setSplitFrom(null); }}>{m.label}<small>{m.pays}</small></button>)}
        </div>
      </div>
      <div className="tg-actions" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <button type="button" className="tg-act" onClick={() => setBets((b) => b.slice(0, -1))} disabled={!bets.length || spinning}>Undo</button>
        <button type="button" className="tg-act" onClick={() => setBets([])} disabled={!bets.length || spinning}>Clear</button>
        <button type="button" className="tg-act" onClick={() => { if (lastBets.reduce((t, b) => t + b.amount, 0) <= bal) setBets(lastBets); }} disabled={!lastBets.length || spinning || !!bets.length}>Rebet</button>
      </div>
      <p className="tg-small">Total stake {fmtMoney(total)}</p>
      <button type="button" className="tg-bet" onClick={spin} disabled={!bets.length || spinning || total > bal}>{spinning ? 'Spinning…' : 'Spin'}</button>
    </>
  );

  return (
    <GameFrame game="roulette" title="European roulette" casinos={casinos} bank={bank} hint={hint} setHint={setHint} advice={advice} panel={panel} busy={spinning}>
      <div className="rl">
        <div className="rl-wheel-col">
          <div ref={wheelEl} className="rl-wheel-wrap"><Wheel rot={rot} ballRot={ballRot} ballR={ballR} spinning={spinning} result={result} /></div>
          <div className={`rl-result${last ? ' show' : ''}${won ? ' won' : ''}`} role="status" aria-live="polite">
            {last ? <><span className={`rl-num ${RL.pocketColor(last.n)}`}>{last.n}</span><span>{last.won > last.staked ? `You win +${fmtMoney(last.won - last.staked)}` : won ? 'Break even' : `No luck – ${fmtMoney(last.staked)} lost`}</span></> : spinning ? <span>No more bets…</span> : <span>Place your bets</span>}
          </div>
          {last && last.won > last.staked ? <Payout net={last.won - last.staked} mult={last.won / last.staked} /> : null}
          {history.length ? <ol className="rl-history" aria-label="Previous results">{history.map((n, i) => <li key={i} className={RL.pocketColor(n)}>{n}</li>)}</ol> : null}
        </div>
        <div className="rl-board-col">
          {mode === 'split' ? <p className="rl-help">{splitFrom === null ? 'Tap the first number, then a neighbour.' : `Now tap a number next to ${splitFrom}.`}</p> : mode === 'corner' ? <p className="rl-help">Tap the top-left number of the four.</p> : mode === 'line' ? <p className="rl-help">Tap a number: covers its row and the next.</p> : mode === 'street' ? <p className="rl-help">Tap a number: covers its row of three.</p> : <p className="rl-help">Tap a number or an outside bet.</p>}
          <div className={`rl-board${hint ? ' hinting' : ''}`} role="group" aria-label="Betting layout">
            <button type="button" className={`rl-cell zero${splitNeighbours(0) ? ' adj' : ''}${splitFrom === 0 ? ' from' : ''}`} onClick={() => onNumber(0)} disabled={spinning}><span>0</span>{chipOn('straight:0') ? <ChipStack amount={chipOn('straight:0')} /> : null}</button>
            {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
              const extra = anchorChip(n);
              return (
                <button key={n} type="button" className={`rl-cell num ${RL.pocketColor(n)}${splitNeighbours(n) ? ' adj' : ''}${splitFrom === n ? ' from' : ''}${result === n && !spinning && last ? ' hit' : ''}`} onClick={() => onNumber(n)} disabled={spinning} aria-label={`${n} ${RL.pocketColor(n)}`}>
                  <span>{n}</span>
                  {chipOn(`straight:${n}`) ? <ChipStack amount={chipOn(`straight:${n}`)} /> : null}
                  {extra.length ? <span className="rl-tag">{extra.map((b) => `${b.kind === 'split' ? 'SPL' : b.kind === 'street' ? 'STR' : b.kind === 'corner' ? 'COR' : 'LINE'} ${fmtMoney(b.amount)}`).join(' · ')}</span> : null}
                </button>
              );
            })}
            {[0, 1, 2].map((c) => <button key={c} type="button" className="rl-cell col" onClick={() => add(RL.makeBet('column', [c]))} disabled={spinning}><span>2:1</span>{chipOn(`column:${c}`) ? <ChipStack amount={chipOn(`column:${c}`)} /> : null}</button>)}
            {[0, 1, 2].map((d) => <button key={d} type="button" className={`rl-cell dz dz${d}`} onClick={() => add(RL.makeBet('dozen', [d]))} disabled={spinning}><span>{['1st 12', '2nd 12', '3rd 12'][d]}</span>{chipOn(`dozen:${d}`) ? <ChipStack amount={chipOn(`dozen:${d}`)} /> : null}</button>)}
            {EVEN_MONEY.map((k, i) => { const def = RL.makeBet(k); return <button key={k} type="button" className={`rl-cell em em${i} ${k}${hint ? ' book' : ''}`} onClick={() => add(def)} disabled={spinning}><span>{k === 'red' ? '◆' : k === 'black' ? '◆' : def.label}</span>{chipOn(def.id) ? <ChipStack amount={chipOn(def.id)} /> : null}</button>; })}
          </div>
          {bets.length ? <ul className="rl-bets" aria-label="Your bets">{bets.map((b) => <li key={b.id}>{b.label} <b>{fmtMoney(b.amount)}</b> <small>pays {RL.PAYS[b.kind]}:1</small></li>)}</ul> : null}
        </div>
      </div>
    </GameFrame>
  );
}
