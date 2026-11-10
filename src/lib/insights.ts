import { getProvider, slotUrl } from './data';
import { fmtRtp, fmtX, releaseKey, VOLATILITY_LABEL } from './format';
import type { Slot, Volatility } from './types';

/**
 * Data-driven summaries for list pages (categories, providers).
 * Every sentence is computed from the slots on the page, so each page gets unique, accurate copy
 * that updates itself as the catalogue changes.
 */
export interface ListInsights {
  count: number;
  providers: { slug: string; name: string; n: number }[];
  withRtp: number;
  avgRtp: number | null;
  topRtp: Slot | null;
  lowRtp: Slot | null;
  topMaxWin: Slot | null;
  minMaxWin: Slot | null;
  newest: Slot | null;
  demos: number;
  volMix: { v: Volatility; n: number }[];
  bonusBuy: number;
}

export function listInsights(slots: Slot[]): ListInsights {
  const byProv = new Map<string, number>();
  for (const s of slots) byProv.set(s.provider, (byProv.get(s.provider) ?? 0) + 1);
  const providers = [...byProv.entries()].sort((a, b) => b[1] - a[1]).map(([slug, n]) => ({ slug, name: getProvider(slug)?.name ?? slug, n }));
  const rtp = slots.filter((s) => s.rtp != null);
  const mw = slots.filter((s) => s.maxWin);
  const dated = slots.filter((s) => s.releaseDate);
  const vol = new Map<Volatility, number>();
  for (const s of slots) if (s.volatility) vol.set(s.volatility, (vol.get(s.volatility) ?? 0) + 1);
  return {
    count: slots.length,
    providers,
    withRtp: rtp.length,
    avgRtp: rtp.length ? rtp.reduce((t, s) => t + s.rtp!, 0) / rtp.length : null,
    topRtp: rtp.length ? rtp.reduce((m, s) => (s.rtp! > m.rtp! ? s : m)) : null,
    lowRtp: rtp.length ? rtp.reduce((m, s) => (s.rtp! < m.rtp! ? s : m)) : null,
    topMaxWin: mw.length ? mw.reduce((m, s) => (s.maxWin! > m.maxWin! ? s : m)) : null,
    minMaxWin: mw.length ? mw.reduce((m, s) => (s.maxWin! < m.maxWin! ? s : m)) : null,
    newest: dated.length ? dated.reduce((m, s) => (releaseKey(s) > releaseKey(m) ? s : m)) : null,
    demos: slots.filter((s) => s.demoUrl).length,
    volMix: [...vol.entries()].sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ v, n })),
    bonusBuy: slots.filter((s) => s.mechanics.includes('bonus-buy')).length,
  };
}

const pct = (n: number, d: number) => `${Math.round((n / d) * 100)}%`;
const listNames = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '');

export type Sentence = { text: string; links?: { label: string; href: string }[] };

/** Plain-English summary paragraphs. `noun` is e.g. "megaways slots" or "Nolimit City slots". */
export function insightSentences(i: ListInsights, noun: string, opts: { showProviders?: boolean } = {}): string[] {
  if (!i.count) return [];
  const out: string[] = [];
  if (opts.showProviders !== false && i.providers.length > 1) {
    const top = i.providers.slice(0, 3).map((p) => `${p.name} (${p.n})`);
    out.push(`We currently list ${i.count} ${noun} from ${i.providers.length} studios, led by ${listNames(top)}.`);
  } else {
    out.push(`We currently list ${i.count} ${noun}${i.demos ? `, ${i.demos === i.count ? 'all' : i.demos} with an official free demo` : ''}.`);
  }
  if (i.avgRtp != null && i.topRtp && i.lowRtp) {
    out.push(
      `Across the ${i.withRtp} games with a published RTP, the average is ${fmtRtp(i.avgRtp)}. ${i.topRtp.name} has the highest at ${fmtRtp(i.topRtp.rtp)}${i.lowRtp.slug !== i.topRtp.slug ? `, while ${i.lowRtp.name} is lowest at ${fmtRtp(i.lowRtp.rtp)}` : ''}.`,
    );
  }
  if (i.topMaxWin) {
    out.push(
      i.minMaxWin && i.minMaxWin.slug !== i.topMaxWin.slug
        ? `Max wins range from ${fmtX(i.minMaxWin.maxWin)} up to ${fmtX(i.topMaxWin.maxWin)} on ${i.topMaxWin.name}.`
        : `The biggest published max win here is ${fmtX(i.topMaxWin.maxWin)} on ${i.topMaxWin.name}.`,
    );
  }
  const rated = i.volMix.reduce((t, x) => t + x.n, 0);
  if (rated >= 3) {
    const mix = i.volMix.slice(0, 3).map((x) => `${VOLATILITY_LABEL[x.v].toLowerCase()} (${pct(x.n, rated)})`);
    out.push(`Of the ${rated} games with a provider volatility rating, the most common ratings are ${listNames(mix)}.`);
  }
  if (i.bonusBuy && i.count >= 5) out.push(`${i.bonusBuy} of them (${pct(i.bonusBuy, i.count)}) offer a bonus buy where it is legal.`);
  return out;
}

/** Auto FAQ for a list page. `noun` is plural ("cluster pays slots"), `one` singular ("cluster pays slot"). */
export function insightFaq(i: ListInsights, noun: string, one: string): { q: string; a: string }[] {
  if (!i.count) return [];
  const f: { q: string; a: string }[] = [];
  if (i.topRtp) f.push({ q: `Which ${one} has the highest RTP?`, a: `${i.topRtp.name} by ${getProvider(i.topRtp.provider)?.name} has the highest published RTP in this list at ${fmtRtp(i.topRtp.rtp)}. Casinos can run lower RTP versions, so check the in-game info screen.` });
  if (i.topMaxWin) f.push({ q: `Which ${one} has the biggest max win?`, a: `${i.topMaxWin.name} has the biggest published max win here at ${fmtX(i.topMaxWin.maxWin)} your stake. Wins of that size are extremely rare.` });
  if (i.providers.length > 1) f.push({ q: `Which provider makes the most ${noun}?`, a: `${i.providers[0].name} has the most games in this list (${i.providers[0].n} of ${i.count}), followed by ${i.providers[1].name} (${i.providers[1].n}).` });
  if (i.newest) f.push({ q: `What is the newest ${one}?`, a: `The most recent release in this list is ${i.newest.name} by ${getProvider(i.newest.provider)?.name}.` });
  f.push({ q: `Can I play ${noun} for free?`, a: i.demos ? `Yes. ${i.demos === i.count ? 'Every game' : `${i.demos} of the ${i.count} games`} in this list can be played in the provider's official demo with play money – no sign-up or deposit needed.` : `We only embed official demos; demos for these games will appear once the provider makes them available.` });
  return f;
}

export const insightLinks = (i: ListInsights) =>
  [i.topRtp, i.topMaxWin, i.newest].filter(Boolean).map((s) => ({ label: s!.name, href: slotUrl(s!) }));
