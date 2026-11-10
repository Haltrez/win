import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import type { Author, Casino, Guide, Provider, Slot } from './types';
import { releaseKey } from './format';

/**
 * File-based content layer. All reads happen at build time (pages are statically generated),
 * so the public site has no database dependency. To move to a headless CMS (Sanity, Payload,
 * Strapi, Contentful) replace the bodies of these functions – every page consumes only this API.
 */
const ROOT = path.join(process.cwd(), 'content');
const cache = new Map<string, unknown>();
function memo<T>(key: string, fn: () => T): T {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key) as T;
}
const readJson = <T,>(p: string): T => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')) as T;

export const getProviders = () =>
  memo('providers', () => readJson<Provider[]>('providers.json').sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name)));
export const getProvider = (slug: string) => getProviders().find((p) => p.slug === slug);

export const getSlots = () =>
  memo('slots', () => {
    const dir = path.join(ROOT, 'slots');
    const out: Slot[] = [];
    for (const prov of fs.readdirSync(dir)) {
      const pdir = path.join(dir, prov);
      if (!fs.statSync(pdir).isDirectory()) continue;
      for (const f of fs.readdirSync(pdir)) if (f.endsWith('.json')) out.push(JSON.parse(fs.readFileSync(path.join(pdir, f), 'utf8')));
    }
    return out.sort((a, b) => releaseKey(b).localeCompare(releaseKey(a)) || a.name.localeCompare(b.name));
  });
export const getSlot = (provider: string, slug: string) => getSlots().find((s) => s.provider === provider && s.slug === slug);
export const getSlotBySlug = (slug: string) => getSlots().find((s) => s.slug === slug);
export const getSlotsByProvider = (provider: string) => getSlots().filter((s) => s.provider === provider);

export const getCasinos = () => memo('casinos', () => readJson<Casino[]>('casinos.json').sort((a, b) => b.rating - a.rating));
export const getCasino = (slug: string) => getCasinos().find((c) => c.slug === slug);
/** Casinos that carry the given provider – used by "best casinos for this slot" modules. */
export const getCasinosForProvider = (provider: string) => getCasinos().filter((c) => c.providers.includes(provider));

export const getAuthors = () => memo('authors', () => readJson<Author[]>('authors.json'));
export const getAuthor = (slug: string) => getAuthors().find((a) => a.slug === slug) ?? getAuthors()[0];

/** Family rules for series that share a brand rather than a name stem. */
const FAMILY: [RegExp, string, string?][] = [
  [/^le /i, 'le-smokey', 'hacksaw-gaming'],
  [/^big bass/i, 'big-bass', 'pragmatic-play'],
  [/^tombstone/i, 'tombstone', 'nolimit-city'],
  [/^(donny|danny dollar)/i, 'cash-kings', 'hacksaw-gaming'],
  [/^(the )?wildos/i, 'wildos', 'thunderkick'],
];

/** Normalised series key: strips sequel numbers, editions and subtitles ("Mental II" → "mental"). */
export function seriesKey(s: Pick<Slot, 'name' | 'provider'>): string | null {
  for (const [re, key, prov] of FAMILY) if (re.test(s.name) && (!prov || prov === s.provider)) return key;
  let b = s.name.toLowerCase().replace(/[®™]/g, '').replace(/^epic\s+/, '').replace(/\s*[:\-–]\s.*$/, '');
  b = b.replace(/\b(ii|iii|iv|\d{1,4}|reborn|deluxe|megaways|super|dice|xmas|christmas edition|hold\s*&\s*win|hold and win|xnudge|xways|xbomb|xsplit|xpays|scratch|ultra|extreme|returns|rising|unleashed|power nudge)\b.*$/, '').trim();
  return b.length >= 4 ? `${s.provider}:${b}` : null;
}

const FAMILY_LABEL: Record<string, string> = { 'le-smokey': "Hacksaw's \"Le\" (Smokey)", 'big-bass': 'Big Bass', tombstone: 'Tombstone', 'cash-kings': 'Cash Kings', wildos: 'Wildos' };
/** Human-readable series name: the family label, or the shortest member name without sequel suffixes. */
export function seriesLabel(slot: Slot): string {
  const k = seriesKey(slot);
  if (k && FAMILY_LABEL[k]) return FAMILY_LABEL[k];
  const all = [slot, ...getSeries(slot)].sort((a, b) => a.name.length - b.name.length);
  return all[0].name.replace(/[®™]/g, '').replace(/\s*[:\-–]\s.*$/, '').replace(/\s+(II|III|\d+)$/, '').trim();
}

/** Other slots in the same series, oldest first. */
export function getSeries(slot: Slot): Slot[] {
  const k = seriesKey(slot);
  if (!k) return [];
  const groups = memo('series', () => {
    const m = new Map<string, Slot[]>();
    for (const s of getSlots()) { const key = seriesKey(s); if (key) m.set(key, [...(m.get(key) ?? []), s]); }
    return m;
  });
  return (groups.get(k) ?? []).filter((s) => s.slug !== slot.slug).sort((a, b) => releaseKey(a).localeCompare(releaseKey(b)) || a.name.length - b.name.length);
}

/** Curated pairs from comparisons.json plus automatic "original vs sequel" pairs for every series. */
export const getComparisons = () =>
  memo('comparisons', () => {
    const manual = readJson<[string, string][]>('comparisons.json');
    const seen = new Set(manual.map(([a, b]) => [a, b].sort().join('|')));
    const auto: [string, string][] = [];
    const done = new Set<string>();
    for (const s of getSlots()) {
      const k = seriesKey(s);
      if (!k || done.has(k)) continue;
      done.add(k);
      const fam = [s, ...getSeries(s)].sort((a, b) => releaseKey(a).localeCompare(releaseKey(b)) || a.name.length - b.name.length);
      if (fam.length < 2) continue;
      const [orig, ...rest] = fam;
      for (const o of rest.slice(0, 6)) {
        const key = [orig.slug, o.slug].sort().join('|');
        if (!seen.has(key)) { seen.add(key); auto.push([orig.slug, o.slug]); }
      }
    }
    return [...manual, ...auto]
      .map(([a, b]) => ({ slug: `${a}-vs-${b}`, a: getSlotBySlug(a)!, b: getSlotBySlug(b)! }))
      .filter((c) => c.a && c.b);
  });

const isoDate = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

export const getGuides = () =>
  memo('guides', () => {
    const dir = path.join(ROOT, 'guides');
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
        const words = content.split(/\s+/).length;
        return {
          ...(data as Omit<Guide, 'html' | 'readingMinutes' | 'slug'>),
          slug: f.replace(/\.md$/, ''),
          html: marked.parse(content, { async: false }) as string,
          readingMinutes: Math.max(1, Math.round(words / 230)),
          publishedAt: isoDate(data.publishedAt),
          updatedAt: isoDate(data.updatedAt),
        } as Guide;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });
export const getGuide = (slug: string) => getGuides().find((g) => g.slug === slug);

/** Related slots: explicit editorial picks first, then a similarity score on mechanics/themes/provider/volatility. */
export function getRelatedSlots(slot: Slot, limit = 6): Slot[] {
  const all = getSlots();
  const picked = (slot.related ?? []).map(getSlotBySlug).filter(Boolean) as Slot[];
  const scored = all
    .filter((s) => s.slug !== slot.slug && !picked.includes(s))
    .map((s) => {
      let score = 0;
      score += s.mechanics.filter((m) => slot.mechanics.includes(m)).length;
      score += s.themes.filter((t) => slot.themes.includes(t)).length * 2;
      if (s.provider === slot.provider) score += 2;
      if (s.volatility && s.volatility === slot.volatility) score += 1;
      return { s, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
  return [...picked, ...scored].slice(0, limit);
}

export function slotUrl(s: Pick<Slot, 'provider' | 'slug'>) {
  return `/slots/${s.provider}/${s.slug}`;
}

export const slotLetter = (name: string) => (/^[a-z]/i.test(name) ? name[0].toLowerCase() : '0-9');
export const getLetters = () => [...new Set(getSlots().map((s) => slotLetter(s.name)))].sort();
