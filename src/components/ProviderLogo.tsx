/* eslint-disable @next/next/no-img-element */
import type { Provider } from '@/lib/types';

/** Official provider logo on a dark plate (works in light and dark theme). Falls back to the name as a wordmark. */
export function ProviderLogo({ p, size = 'md' }: { p: Provider; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`logo-plate logo-${size}`}>
      {p.logo ? <img src={p.logo} alt={`${p.name} logo`} loading="lazy" style={p.logoInvert ? { filter: 'invert(1)' } : undefined} /> : <span className="logo-word">{p.name}</span>}
    </span>
  );
}
