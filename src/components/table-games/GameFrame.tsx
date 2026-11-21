'use client';
import type { ReactNode } from 'react';
import type { CtaCasino } from '../DemoCta';
import { TableCta } from './TableCta';
import { fmtMoney, type Stats } from './useBankroll';

export interface Bank { balance: number; stats: Stats; reset: () => void; topUp: () => void; sessionStart: number }

/**
 * Chrome shared by every table game: play-money balance, "Show book move" toggle, reset, the felt table,
 * the hint line, controls, the stats panel and the 18+ line. The real-money prompt floats over the felt.
 */
export function GameFrame({ game, title, casinos, bank, hint, setHint, advice, children, controls, aside, busy }: {
  game: string; title: string; casinos: CtaCasino[]; bank: Bank; hint: boolean; setHint: (v: boolean) => void;
  /** The current book move, shown under the table when hint mode is on. */
  advice?: { move: string; reason: string } | null;
  children: ReactNode; controls?: ReactNode; aside?: ReactNode; busy?: boolean;
}) {
  const { stats } = bank;
  const rate = stats.hands ? Math.round((stats.wins / stats.hands) * 100) : 0;
  return (
    <section className="tg" aria-label={`${title} – free play`}>
      <div className="tg-top">
        <div className="tg-balance" aria-live="polite">
          <span className="tg-balance-label">Play money</span>
          <strong className="tg-balance-amt">{fmtMoney(bank.balance)}</strong>
        </div>
        <div className="tg-top-actions">
          <label className="tg-switch">
            <input type="checkbox" checked={hint} onChange={(e) => setHint(e.target.checked)} />
            <span className="tg-switch-track" aria-hidden><span className="tg-switch-knob" /></span>
            <span className="tg-switch-text">Show book move</span>
          </label>
          <button type="button" className="tg-reset" onClick={() => { if (window.confirm('Reset your play-money balance to 1,000 and clear the stats?')) bank.reset(); }} disabled={busy}>Reset</button>
        </div>
      </div>

      <div className={`tg-table tg-${game}`}>
        <div className="tg-felt">
          <div className="tg-vignette" aria-hidden />
          {children}
          {bank.balance <= 0 && !busy ? (
            <div className="tg-broke" role="status">
              <p>Out of play money. It costs nothing to refill.</p>
              <button type="button" className="btn btn-primary" onClick={bank.topUp}>Refill 1,000</button>
            </div>
          ) : null}
        </div>
        <TableCta casinos={casinos} game={game} streak={stats.streak} balance={bank.balance} sessionStart={bank.sessionStart} hands={stats.hands} />
      </div>

      {hint ? (
        <div className={`tg-hint${advice ? ' has' : ''}`} role="status" aria-live="polite">
          <span className="tg-hint-label">Book move</span>
          {advice ? <><strong>{advice.move}</strong><span className="tg-hint-text">{advice.reason}</span></> : <span className="tg-hint-text">Place a bet to see the mathematically correct play for the situation.</span>}
        </div>
      ) : null}

      {controls ? <div className="tg-controls">{controls}</div> : null}
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
