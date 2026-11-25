import type { TrustFacts } from './types';

/** Facts a switching player compares: how long the casino has run, how fast it pays, what the bonus really costs. */
/** Pills: the years pill is marked with a leading '+' so the tile can style it as the positive one. */
export function trustPills(t: TrustFacts): string[] {
  const out: string[] = [];
  const y = t.since ? new Date().getFullYear() - t.since : 0;
  if (t.since) out.push(y >= 1 ? `+${y} year${y === 1 ? '' : 's'} running` : `+New in ${t.since}`);
  if (t.payout) out.push(t.payout);
  if (t.wagering) out.push(/^none/i.test(t.wagering) ? 'No wagering on bonus' : `Wagering ${t.wagering}`);
  if (t.regulator && out.length < 3) out.push(`${t.regulator} licensed`);
  return out.slice(0, 3);
}

/** One line for the pop-up. */
export function trustLine(t: TrustFacts): string {
  return trustPills(t).map((p) => p.replace(/^\+/, '')).join(' · ');
}
