/** Casino chip with denomination. Colours follow the common US scheme; drawn purely in CSS. */
export const CHIP_VALUES = [1, 5, 25, 100, 500] as const;
const COLOR: Record<number, string> = { 1: 'c1', 5: 'c5', 25: 'c25', 100: 'c100', 500: 'c500' };
const chipClass = (v: number) => COLOR[v] ?? (v >= 500 ? 'c500' : v >= 100 ? 'c100' : v >= 25 ? 'c25' : v >= 5 ? 'c5' : 'c1');

export function Chip({ value, size = 'md', selected, onClick, disabled, label }: { value: number; size?: 'sm' | 'md' | 'lg'; selected?: boolean; onClick?: () => void; disabled?: boolean; label?: string }) {
  const cls = `chip ${chipClass(value)} ${size}${selected ? ' on' : ''}`;
  const txt = value >= 1000 ? `${value / 1000}k` : String(value);
  if (onClick) return <button type="button" className={cls} onClick={onClick} disabled={disabled} aria-pressed={selected} aria-label={label ?? `${value} chip`}><span>{txt}</span></button>;
  return <span className={cls} aria-hidden><span>{txt}</span></span>;
}

/** Break an amount into chips (largest first) and draw them as a small stack with the total on top. */
export function ChipStack({ amount, size = 'sm' }: { amount: number; size?: 'sm' | 'md' }) {
  if (amount <= 0) return null;
  const chips: number[] = []; let left = amount;
  for (const v of [...CHIP_VALUES].reverse()) while (left >= v && chips.length < 6) { chips.push(v); left -= v; }
  return (
    <span className={`chip-stack ${size}`} aria-label={`${amount} staked`}>
      {chips.map((v, i) => <span key={i} className={`chip ${chipClass(v)} ${size}`} style={{ transform: `translateY(${-i * 3}px)` }} aria-hidden><span>{i === chips.length - 1 ? (amount >= 1000 ? `${(amount / 1000).toFixed(amount % 1000 ? 1 : 0)}k` : amount) : ''}</span></span>)}
    </span>
  );
}
