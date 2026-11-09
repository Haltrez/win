import type { Volatility } from './types';

export const fmtX = (n: number) => `${n.toLocaleString('en-US')}x`;
export const fmtRtp = (n: number) => `${n.toFixed(2)}%`;
export const year = (iso: string) => iso.slice(0, 4);
export const fmtDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : '')).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const VOLATILITY_LABEL: Record<Volatility, string> = {
  low: 'Low',
  'medium-low': 'Medium-low',
  medium: 'Medium',
  'medium-high': 'Medium-high',
  high: 'High',
  'very-high': 'Very high',
};
export const VOLATILITY_SCORE: Record<Volatility, number> = { low: 1, 'medium-low': 2, medium: 3, 'medium-high': 4, high: 5, 'very-high': 6 };

export const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Trim to a length on a word boundary – keeps meta descriptions under ~158 chars. */
export function clip(s: string, max = 158) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:–-]+$/, '') + '…';
}
