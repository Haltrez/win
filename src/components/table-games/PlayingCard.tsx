import type { Card } from '@/lib/table-games/cards';
import { RANK_LABEL, SUIT_LABEL, isRed } from '@/lib/table-games/cards';

/** Pip layout per rank (x,y in a 0–100 box; `r` = rotated 180°). */
const PIPS: Record<number, [number, number, boolean?][]> = {
  2: [[50, 20], [50, 80, true]],
  3: [[50, 20], [50, 50], [50, 80, true]],
  4: [[30, 20], [70, 20], [30, 80, true], [70, 80, true]],
  5: [[30, 20], [70, 20], [50, 50], [30, 80, true], [70, 80, true]],
  6: [[30, 20], [70, 20], [30, 50], [70, 50], [30, 80, true], [70, 80, true]],
  7: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [30, 80, true], [70, 80, true]],
  8: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [50, 65, true], [30, 80, true], [70, 80, true]],
  9: [[30, 20], [70, 20], [30, 40], [70, 40], [50, 50], [30, 60, true], [70, 60, true], [30, 80, true], [70, 80, true]],
  10: [[30, 20], [70, 20], [50, 30], [30, 40], [70, 40], [30, 60, true], [70, 60, true], [50, 70, true], [30, 80, true], [70, 80, true]],
};

/**
 * A playing card drawn entirely with HTML/SVG – no third-party images. `faceDown` shows the patterned back;
 * toggling it flips the card (CSS 3D transform). `dealIndex` staggers the deal-in animation.
 */
export function PlayingCard({ card, faceDown = false, dealIndex = 0, held, dim, onClick, label, className = '' }: { card?: Card | null; faceDown?: boolean; dealIndex?: number; held?: boolean; dim?: boolean; onClick?: () => void; label?: string; className?: string }) {
  const face = card && !faceDown;
  const red = card ? isRed(card.suit) : false;
  const inner = (
    <div className={`pc${face ? ' up' : ' down'}${held ? ' held' : ''}${dim ? ' dim' : ''} ${className}`} style={{ animationDelay: `${dealIndex * 120}ms` }} aria-label={card && !faceDown ? `${RANK_LABEL[card.rank]} of ${({ S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' })[card.suit]}` : 'face-down card'} role="img">
      <div className="pc-inner">
        <div className="pc-back" aria-hidden><div className="pc-back-pattern" /></div>
        {card ? (
          <div className={`pc-face${red ? ' red' : ''}`} aria-hidden>
            <span className="pc-corner tl"><b>{RANK_LABEL[card.rank]}</b><i>{SUIT_LABEL[card.suit]}</i></span>
            <span className="pc-corner br"><b>{RANK_LABEL[card.rank]}</b><i>{SUIT_LABEL[card.suit]}</i></span>
            {card.rank <= 10 ? (
              <svg className="pc-pips" viewBox="0 0 100 140" aria-hidden>
                {PIPS[card.rank].map(([x, y, r], i) => (
                  <text key={i} x={x} y={y * 1.4} fontSize="24" textAnchor="middle" dominantBaseline="central" transform={r ? `rotate(180 ${x} ${y * 1.4})` : undefined}>{SUIT_LABEL[card.suit]}</text>
                ))}
              </svg>
            ) : (
              <div className="pc-court">
                <svg viewBox="0 0 100 140" aria-hidden>
                  <rect x="18" y="22" width="64" height="96" rx="6" className="pc-court-frame" />
                  {card.rank === 14 ? (
                    <text x="50" y="72" fontSize="54" textAnchor="middle" dominantBaseline="central">{SUIT_LABEL[card.suit]}</text>
                  ) : (
                    <>
                      <text x="50" y="62" fontSize="46" textAnchor="middle" dominantBaseline="central" className="pc-court-letter">{RANK_LABEL[card.rank]}</text>
                      <text x="50" y="98" fontSize="22" textAnchor="middle" dominantBaseline="central">{SUIT_LABEL[card.suit]}</text>
                      <path d="M30 30 h40 M30 110 h40" className="pc-court-line" />
                    </>
                  )}
                </svg>
              </div>
            )}
          </div>
        ) : null}
      </div>
      {held ? <span className="pc-held">HELD</span> : null}
    </div>
  );
  if (onClick) return <button type="button" className="pc-btn" onClick={onClick} aria-pressed={held} aria-label={label}>{inner}</button>;
  return inner;
}

/** Empty card slot (dashed outline) used before a deal. */
export const CardSlot = () => <div className="pc slot" aria-hidden />;
