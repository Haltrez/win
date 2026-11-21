import type { Card, Suit } from '@/lib/table-games/cards';
import { RANK_LABEL, isRed } from '@/lib/table-games/cards';

/**
 * The Scatter Drop deck. Every card is an inline SVG: suit symbols are vector paths (never font glyphs, so
 * they can't fall back to emoji or tofu on phones), ranks use the site's display font, court cards carry an
 * original crown/tiara/plume motif, aces carry the droplet mark, and the back is the brand lattice.
 * `faceDown` shows the back; toggling it flips the card (CSS 3D). `dealIndex` staggers the deal-in.
 */
const SUIT_PATH: Record<Suit, string> = {
  S: 'M50 6C50 6 18 38 18 58c0 11 8 19 18 19 5 0 10-2 14-7-1 8-4 14-9 18h18c-5-4-8-10-9-18 4 5 9 7 14 7 10 0 18-8 18-19C82 38 50 6 50 6z',
  H: 'M50 92C50 92 10 62 10 36 10 22 21 11 34 11c7 0 13 4 16 9 3-5 9-9 16-9 13 0 24 11 24 25 0 26-40 56-40 56z',
  D: 'M50 4L92 50 50 96 8 50z',
  C: 'M50 8a17 17 0 1 1-.1 0zM30 38a17 17 0 1 1-.1 0zM70 38a17 17 0 1 1-.1 0zM50 54c-1 12-4 22-10 30h20c-6-8-9-18-10-30z',
};
const SUIT_NAME: Record<Suit, string> = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };
const DROP = 'M32 9C32 9 15 29 15 40a17 17 0 0 0 34 0C49 29 32 9 32 9Z';
const GOLD = '#c9a24e';

/** Pip positions (x, y in the 100×140 face; `r` = rotated) for 2–10. */
const PIPS: Record<number, [number, number, boolean?][]> = {
  2: [[50, 32], [50, 108, true]],
  3: [[50, 32], [50, 70], [50, 108, true]],
  4: [[33, 32], [67, 32], [33, 108, true], [67, 108, true]],
  5: [[33, 32], [67, 32], [50, 70], [33, 108, true], [67, 108, true]],
  6: [[33, 32], [67, 32], [33, 70], [67, 70], [33, 108, true], [67, 108, true]],
  7: [[33, 32], [67, 32], [50, 51], [33, 70], [67, 70], [33, 108, true], [67, 108, true]],
  8: [[33, 32], [67, 32], [50, 51], [33, 70], [67, 70], [50, 89, true], [33, 108, true], [67, 108, true]],
  9: [[33, 30], [67, 30], [33, 57], [67, 57], [50, 70], [33, 83, true], [67, 83, true], [33, 110, true], [67, 110, true]],
  10: [[33, 30], [67, 30], [50, 44], [33, 57], [67, 57], [33, 83, true], [67, 83, true], [50, 96, true], [33, 110, true], [67, 110, true]],
};

const Pip = ({ suit, x, y, size, rot }: { suit: Suit; x: number; y: number; size: number; rot?: boolean }) => (
  <path d={SUIT_PATH[suit]} transform={`translate(${x} ${y}) ${rot ? 'rotate(180)' : ''} scale(${size / 100}) translate(-50 -50)`} />
);

function CourtArt({ rank, suit, color }: { rank: 11 | 12 | 13; suit: Suit; color: string }) {
  return (
    <g>
      <rect x="17" y="24" width="66" height="92" rx="6" fill={color} opacity=".08" />
      <rect x="17" y="24" width="66" height="92" rx="6" fill="none" stroke={GOLD} strokeWidth="1.6" />
      <path d="M17 30 L83 110" stroke={color} strokeOpacity=".07" strokeWidth="12" />
      <rect x="21" y="28" width="58" height="84" rx="4" fill="none" stroke={GOLD} strokeWidth=".6" opacity=".7" />
      {rank === 13 ? <path d="M36 54 L40 38 L50 48 L60 38 L64 54 Z" fill={GOLD} /> : rank === 12 ? <><path d="M36 54 Q50 32 64 54 Z" fill={GOLD} /><circle cx="40" cy="47" r="2.4" fill={color} /><circle cx="50" cy="41" r="2.6" fill={color} /><circle cx="60" cy="47" r="2.4" fill={color} /></> : <path d="M50 36c-11 4-14 14-7 21 2-8 6-13 7-21zm0 0c11 4 14 14 7 21-2-8-6-13-7-21z" fill={GOLD} />}
      <text x="50" y="86" fontSize="40" fontWeight="800" textAnchor="middle" dominantBaseline="middle" fill={color} fontFamily="var(--font-display, var(--font))">{RANK_LABEL[rank]}</text>
      <path d="M26 104 h48" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />
      <Pip suit={suit} x={26} y={33} size={10} /><Pip suit={suit} x={74} y={107} size={10} rot />
    </g>
  );
}

export function PlayingCard({ card, faceDown = false, dealIndex = 0, held, dim, onClick, label, className = '' }: { card?: Card | null; faceDown?: boolean; dealIndex?: number; held?: boolean; dim?: boolean; onClick?: () => void; label?: string; className?: string }) {
  const face = card && !faceDown;
  const color = card ? (isRed(card.suit) ? '#d9203b' : '#1b2430') : '#1b2430';
  const inner = (
    <div className={`pc${face ? ' up' : ' down'}${held ? ' held' : ''}${dim ? ' dim' : ''} ${className}`} style={{ animationDelay: `${dealIndex * 160}ms` }} aria-label={card && !faceDown ? `${RANK_LABEL[card.rank]} of ${SUIT_NAME[card.suit]}` : 'face-down card'} role="img">
      <div className="pc-inner">
        <svg className="pc-back" viewBox="0 0 100 140" aria-hidden>
          <defs>
            <pattern id="sd-lattice" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 5h10M5 0v10" stroke={GOLD} strokeOpacity=".28" strokeWidth="1" /></pattern>
            <radialGradient id="sd-back-glow" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor="#1c2a44" /><stop offset="100%" stopColor="#0b1220" /></radialGradient>
          </defs>
          <rect width="100" height="140" rx="8" fill="#f3efe4" />
          <rect x="4" y="4" width="92" height="132" rx="6" fill="url(#sd-back-glow)" />
          <rect x="4" y="4" width="92" height="132" rx="6" fill="url(#sd-lattice)" />
          <rect x="8" y="8" width="84" height="124" rx="4" fill="none" stroke={GOLD} strokeWidth="1.2" />
          <circle cx="50" cy="70" r="19" fill="#0b1220" stroke={GOLD} strokeWidth="1.4" />
          <path d={DROP} transform="translate(34 54) scale(.5)" fill={GOLD} />
          <circle cx="56" cy="60" r="1.6" fill={GOLD} /><circle cx="41" cy="62" r="1.1" fill={GOLD} />
        </svg>
        {card ? (
          <svg className="pc-face" viewBox="0 0 100 140" aria-hidden style={{ color }}>
            <defs><linearGradient id="sd-paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#f3f1ea" /></linearGradient></defs>
            <rect width="100" height="140" rx="8" fill="url(#sd-paper)" />
            <rect x=".75" y=".75" width="98.5" height="138.5" rx="7.5" fill="none" stroke="#d9d3c3" strokeWidth="1.5" />
            <g fill="currentColor">
              <text x="7" y="7" fontSize={card.rank === 10 ? 17 : 20} fontWeight="800" dominantBaseline="hanging" fontFamily="var(--font-display, var(--font))" letterSpacing="-1">{RANK_LABEL[card.rank]}</text>
              <Pip suit={card.suit} x={14} y={36} size={13} />
              <g transform="rotate(180 50 70)">
                <text x="7" y="7" fontSize={card.rank === 10 ? 17 : 20} fontWeight="800" dominantBaseline="hanging" fontFamily="var(--font-display, var(--font))" letterSpacing="-1">{RANK_LABEL[card.rank]}</text>
                <Pip suit={card.suit} x={14} y={36} size={13} />
              </g>
              {card.rank <= 10 ? PIPS[card.rank].map(([x, y, r], i) => <Pip key={i} suit={card.suit} x={x} y={y} size={20} rot={r} />)
                : card.rank === 14 ? <><Pip suit={card.suit} x={50} y={66} size={46} /><path d={DROP} transform="translate(43.5 100) scale(.2)" fill={GOLD} /></>
                : <CourtArt rank={card.rank as 11 | 12 | 13} suit={card.suit} color={color} />}
            </g>
          </svg>
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
