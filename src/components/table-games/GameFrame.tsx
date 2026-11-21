'use client';
import type { ReactNode } from 'react';
import type { CtaCasino } from '../DemoCta';
import { TableCta } from './TableCta';
import { fmtMoney, type Stats } from './useBankroll';

export interface Bank { balance: number; stats: Stats; reset: () => void; topUp: () => void; sessionStart: number; refunded?: number }

/** Bet amount field: typed value with ½ / 2× / Max helpers, clamped to the balance. */
export function BetInput({ label, value, onChange, max, disabled, note }: { label: string; value: number; onChange: (v: number) => void; max: number; disabled?: boolean; note?: string }) {
  const set = (v: number) => onChange(Math.max(0, Math.min(Math.floor(v * 100) / 100, Math.floor(max * 100) / 100)));
  return (
    <div className="tg-field">
      <div className="tg-field-head"><span>{label}</span>{note ? <span>{note}</span> : null}</div>
      <div className="tg-input">
        <input type="number" inputMode="decimal" min={0} step="any" value={value} disabled={disabled} aria-label={label} onChange={(e) => set(Number(e.target.value) || 0)} />
        <button type="button" onClick={() => set(value / 2)} disabled={disabled || value <= 0} aria-label={`Halve ${label}`}>½</button>
        <button type="button" onClick={() => set(value ? value * 2 : 1)} disabled={disabled || value * 2 > max} aria-label={`Double ${label}`}>2×</button>
        <button type="button" onClick={() => set(max)} disabled={disabled || value >= max} aria-label={`Max ${label}`}>Max</button>
      </div>
    </div>
  );
}

/**
 * Payout badge shown over the stage when a round settles. `net` is the whole round including side bets, so it
 * always matches what the balance did; `detail` breaks it down when more than one bet was involved.
 */
export function Payout({ net, mult, detail }: { net: number; mult?: number; detail?: string }) {
  const cls = net > 0 ? '' : net === 0 ? ' push' : ' lose';
  return (
    <div className={`payout${cls}`} role="status">
      {net > 0 ? (mult ? `${mult.toFixed(2)}×` : 'Win') : net === 0 ? 'Push' : 'Lost'}
      <span>{net > 0 ? `+${fmtMoney(net)}` : net === 0 ? 'bet returned' : `−${fmtMoney(-net)}`}</span>
      {detail ? <span className="payout-detail">{detail}</span> : null}
    </div>
  );
}

/**
 * Layout shared by every table game: a control panel (bets, options, the one big action button, the book-move
 * switch and the hint) beside a dark stage where the cards or wheel live. Stats and the 18+ line sit underneath.
 */
export function GameFrame({ game, title, casinos, bank, hint, setHint, advice, panel, children, aside, busy }: {
  game: string; title: string; casinos: CtaCasino[]; bank: Bank; hint: boolean; setHint: (v: boolean) => void;
  advice?: { move: string; reason: string } | null; panel: ReactNode; children: ReactNode; aside?: ReactNode; busy?: boolean;
}) {
  const { stats } = bank;
  const rate = stats.hands ? Math.round((stats.wins / stats.hands) * 100) : 0;
  return (
    <section className="tg" aria-label={`${title} – free play`}>
      <div className="tg-layout">
        <div className="tg-panel">
          {panel}
          <label className="tg-switch">
            <input type="checkbox" checked={hint} onChange={(e) => setHint(e.target.checked)} />
            <span className="tg-switch-track" aria-hidden><span className="tg-switch-knob" /></span>
            <span className="tg-switch-text">Show book move</span>
          </label>
          {hint ? (
            <div className="tg-hint" role="status" aria-live="polite">
              <span className="tg-hint-label">Book move</span>
              {advice ? <><strong>{advice.move}</strong><span>{advice.reason}</span></> : <span>Place a bet to see the mathematically correct play for the situation.</span>}
            </div>
          ) : null}
        </div>
        <div className={`tg-stage tg-${game}`}>
          <div className="tg-stage-top">
            <div className="tg-balance" aria-live="polite"><span className="tg-balance-label">Play money</span><strong className="tg-balance-amt">{fmtMoney(bank.balance)}</strong></div>
            <button type="button" className="tg-reset" onClick={() => { if (window.confirm('Reset your play-money balance to 1,000 and clear the stats?')) bank.reset(); }} disabled={busy}>Reset</button>
          </div>
          <div className="tg-stage-body">
            {bank.refunded ? <p className="tg-refund" role="status">A round was left unfinished last time, so its {fmtMoney(bank.refunded)} bet was returned to your balance.</p> : null}
            {children}
            {bank.balance <= 0 && !busy ? (
              <div className="tg-broke" role="status"><p>Out of play money. It costs nothing to refill.</p><button type="button" className="tg-bet" onClick={bank.topUp}>Refill 1,000</button></div>
            ) : null}
          </div>
          <TableCta casinos={casinos} game={game} streak={stats.streak} balance={bank.balance} sessionStart={bank.sessionStart} hands={stats.hands} />
        </div>
      </div>
      {aside}
      <dl className="tg-stats">
        <div><dt>Hands</dt><dd>{stats.hands.toLocaleString('en-US')}</dd></div>
        <div><dt>Win rate</dt><dd>{stats.hands ? `${rate}%` : '–'}</dd></div>
        <div><dt>Net</dt><dd className={stats.net > 0 ? 'up' : stats.net < 0 ? 'down' : ''}>{stats.net > 0 ? '+' : ''}{fmtMoney(stats.net)}</dd></div>
        <div><dt>Streak</dt><dd>{stats.streak > 0 ? `W${stats.streak}` : stats.streak < 0 ? `L${-stats.streak}` : '–'}</dd></div>
      </dl>
      <p className="tg-rg"><span className="badge-18">18+</span> Play money only – nothing can be won or lost here. Gambling can be addictive; <a href="/responsible-gambling">play responsibly</a>.</p>
    </section>
  );
}
