/**
 * Localised sections: /es, /de, /sv. English stays at the root.
 * A page only exists in a language when a translation file exists for it
 * (content/i18n/<lang>/slots/<provider>/<slug>.json), so nothing is machine-generated at build time.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Slot } from './types';

export const LOCALES = ['es', 'de', 'sv'] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (x: string): x is Locale => (LOCALES as readonly string[]).includes(x);

/** hreflang codes: Spanish targets Spain and Latin America, so it stays language-only. */
export const HREFLANG: Record<Locale, string> = { es: 'es', de: 'de', sv: 'sv' };

/** Countries where our current (Curaçao-licensed) partners are offshore operators: show the offshore warning there. */
export const OFFSHORE_WARNING_COUNTRIES: Record<string, Locale> = { ES: 'es', DE: 'de', SE: 'sv' };

export type SlotTranslation = {
  /** Optional search title; falls back to the template. */
  title?: string;
  description: string;
  review: string;
  features: { name: string; description: string }[];
};

const ROOT = path.join(process.cwd(), 'content', 'i18n');
const cache = new Map<string, SlotTranslation | null>();

export function getSlotTranslation(lang: Locale, provider: string, slug: string): SlotTranslation | null {
  const key = `${lang}/${provider}/${slug}`;
  if (cache.has(key)) return cache.get(key)!;
  const f = path.join(ROOT, lang, 'slots', provider, `${slug}.json`);
  const v = fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')) as SlotTranslation) : null;
  cache.set(key, v);
  return v;
}

/** Every [provider, slug] translated into `lang`. */
export function translatedSlots(lang: Locale): { provider: string; slug: string }[] {
  const dir = path.join(ROOT, lang, 'slots');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((p) =>
    fs.readdirSync(path.join(dir, p)).filter((f) => f.endsWith('.json')).map((f) => ({ provider: p, slug: f.replace(/\.json$/, '') })),
  );
}

/** Languages with at least one translated page. Other languages don't get any URLs (no empty pages). */
export const activeLocales = (): Locale[] => LOCALES.filter((l) => translatedSlots(l).length > 0);

/** Languages this slot is available in (for hreflang on the English page). */
export function slotLanguages(s: Pick<Slot, 'provider' | 'slug'>): Locale[] {
  return LOCALES.filter((l) => getSlotTranslation(l, s.provider, s.slug));
}

export const localeSlotUrl = (lang: Locale, s: Pick<Slot, 'provider' | 'slug'>) => `/${lang}/slots/${s.provider}/${s.slug}`;
