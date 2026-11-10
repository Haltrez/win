import type { Volatility } from './types';

export const NOT_PUBLISHED = 'Not published';
export const fmtX = (n: number | null | undefined) => (n == null ? NOT_PUBLISHED : `${n.toLocaleString('en-US')}x`);
export const fmtRtp = (n: number | null | undefined) => (n == null ? NOT_PUBLISHED : `${n.toFixed(2)}%`);
export const year = (iso: string | null | undefined) => (iso ? iso.slice(0, 4) : '');
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
/** 0 when the provider hasn't published volatility. */
export const volScore = (v: Volatility | null | undefined) => (v ? VOLATILITY_SCORE[v] : 0);
export const volLabel = (v: Volatility | null | undefined) => (v ? VOLATILITY_LABEL[v] : NOT_PUBLISHED);
/** Release date respecting precision: "13 February 2021", "March 2023" or "Not published". */
export function fmtRelease(s: { releaseDate: string | null; releaseDatePrecision?: 'day' | 'month' }) {
  if (!s.releaseDate) return NOT_PUBLISHED;
  if (s.releaseDatePrecision === 'month')
    return new Date(s.releaseDate + 'T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return fmtDate(s.releaseDate);
}
export const releaseKey = (s: { releaseDate: string | null }) => s.releaseDate ?? '0000-00-00';

export const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Trim to a length on a word boundary – keeps meta descriptions under ~158 chars. */
export function clip(s: string, max = 158) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:–-]+$/, '') + '…';
}
