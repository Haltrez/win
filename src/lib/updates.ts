import { getGuides, getProvider, getSlots, slotUrl } from './data';
import type { Guide, Slot } from './types';

/** Batches larger than this are the initial site launch, shown as a summary instead of a full list. */
export const LAUNCH_BATCH = 150;
export const LAUNCH_DATE = '2026-11-09';

export type Update = { date: string; slots: Slot[]; guides: Guide[] };

/** Site updates grouped by date (slots by addedAt, guides by publishedAt), newest first. */
export function getUpdates(): Update[] {
  const by = new Map<string, Update>();
  const at = (d: string) => by.get(d) ?? (by.set(d, { date: d, slots: [], guides: [] }), by.get(d)!);
  for (const s of getSlots()) at(s.addedAt ?? LAUNCH_DATE).slots.push(s);
  for (const g of getGuides()) at(g.publishedAt.slice(0, 10)).guides.push(g);
  return [...by.values()]
    .map((u) => ({ ...u, slots: u.slots.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name)) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export type FeedItem = { title: string; path: string; date: string; description: string; image?: string | null };

/** Latest additions for the RSS feed: guides and slots, newest first, launch batch excluded once newer items exist. */
export function feedItems(limit = 50): FeedItem[] {
  const items: FeedItem[] = [];
  for (const u of getUpdates()) {
    for (const g of u.guides) items.push({ title: g.title, path: `/guides/${g.slug}`, date: u.date, description: g.description });
    if (u.slots.length > LAUNCH_BATCH && items.length) continue;
    for (const s of u.slots) {
      const p = getProvider(s.provider)?.name ?? s.provider;
      const facts = [s.rtp != null ? `${s.rtp.toFixed(2)}% RTP` : null, s.maxWin ? `${s.maxWin.toLocaleString('en-US')}x max win` : null].filter(Boolean).join(', ');
      const first = s.review.split(/(?<=\.)\s/)[0];
      items.push({ title: `${s.name} (${p}) – free demo & review`, path: slotUrl(s), date: u.date, description: `${first}${facts ? ` ${facts}.` : ''}`, image: s.image });
    }
  }
  return items.slice(0, limit);
}
