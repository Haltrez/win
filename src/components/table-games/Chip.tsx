/** Flat bet marker used on the roulette layout. */
const chipClass = (v: number) => (v >= 500 ? 'c500' : v >= 100 ? 'c100' : v >= 25 ? 'c25' : v >= 5 ? 'c5' : 'c1');
const short = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : String(v));

export function ChipStack({ amount, size }: { amount: number; size?: 'sm' | 'md' | 'lg' }) {
  if (amount <= 0) return null;
  return <span className="chip-stack" aria-label={`${amount} staked`}><span className={`chip ${chipClass(amount)}${size === 'lg' ? ' lg' : ''}`}>{short(amount)}</span></span>;
}
