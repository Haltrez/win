import type { Metadata } from 'next';
import { SITE } from './config';
import { clip, fmtRtp, fmtX, VOLATILITY_LABEL, year } from './format';
import type { Provider, Slot } from './types';

export const abs = (p: string) => `${SITE.url}${p === '/' ? '' : p}`;

/** Google shows roughly 60 characters (~580px) of a title. */
export const TITLE_MAX = 60;
const SUFFIX = ` | ${SITE.name}`;

/**
 * Pick the most descriptive title that fits in search results.
 * Tries each candidate with the site-name suffix, then without it, then falls back to the shortest.
 */
export function fitTitle(candidates: string[], allowSuffix = true): { title: string; absolute: boolean } {
  const c = candidates.filter(Boolean);
  if (allowSuffix) for (const t of c) if ((t + SUFFIX).length <= TITLE_MAX) return { title: t, absolute: false };
  for (const t of c) if (t.length <= TITLE_MAX) return { title: t, absolute: true };
  return { title: [...c].sort((a, b) => a.length - b.length)[0], absolute: true };
}

interface MetaInput {
  /** A single title, or candidates from most to least descriptive – the first that fits is used. */
  title: string | string[];
  description: string;
  path: string;
  /** When true, title is used verbatim (no " | Site" suffix). */
  absoluteTitle?: boolean;
  noindex?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
  imageSize?: [number, number];
  imageAlt?: string;
}

export function buildMetadata(m: MetaInput): Metadata {
  const url = abs(m.path);
  const noindex = m.noindex || SITE.noindex;
  const fit = fitTitle(Array.isArray(m.title) ? m.title : [m.title], !m.absoluteTitle);
  const title = fit.title;
  const ogImage = m.image ?? `${SITE.url}/opengraph-image`;
  return {
    title: fit.absolute ? { absolute: title } : title,
    description: clip(m.description),
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: {
      title,
      description: clip(m.description, 200),
      url,
      siteName: SITE.name,
      type: m.type ?? 'website',
      locale: 'en_GB',
      images: [{ url: ogImage, width: m.imageSize?.[0] ?? 1200, height: m.imageSize?.[1] ?? 630, ...(m.imageAlt ? { alt: m.imageAlt } : {}) }],
      ...(m.type === 'article' ? { publishedTime: m.publishedTime, modifiedTime: m.modifiedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title, images: [ogImage], description: clip(m.description, 200), site: SITE.twitter },
  };
}

/** Slot title candidates, most descriptive first: "[Slot] Slot Demo & Review – [Max Win] | [Provider] ([Year])". */
export function slotTitle(s: Slot, p: Provider): string[] {
  const y = year(s.releaseDate);
  const hook = s.maxWin ? `${fmtX(s.maxWin)} Max Win` : s.rtp != null ? `${fmtRtp(s.rtp)} RTP` : 'Free Play';
  const yr = y ? ` (${y})` : '';
  return [
    `${s.name} Slot Demo & Review – ${hook} | ${p.name}${yr}`,
    `${s.name} Demo & Review – ${hook} | ${p.name}${yr}`,
    `${s.name} Demo & Review – ${hook} | ${p.name}`,
    `${s.name} Demo – ${hook} | ${p.name}`,
    `${s.name} Slot Demo & Review – ${hook}`,
    `${s.name} Demo & Review – ${hook}`,
    `${s.name} Demo – ${hook}`,
    `${s.name} Slot Demo & Review`,
    `${s.name} Demo`,
  ];
}

/** Unique, data-driven meta description: RTP, volatility, max win + value prop. Optional parts are added only while they fit. */
export function slotDescription(s: Slot, p: Provider) {
  const vol = s.volatility ? VOLATILITY_LABEL[s.volatility].toLowerCase() : null;
  const feature = s.features[0]?.name.toLowerCase();
  const facts = [s.rtp != null ? `${fmtRtp(s.rtp)} RTP` : null, vol ? `${vol} volatility` : null, s.maxWin ? `${fmtX(s.maxWin)} max win` : null].filter(Boolean) as string[];
  const list = facts.length > 1 ? `${facts.slice(0, -1).join(', ')} and ${facts[facts.length - 1]}` : facts[0];
  let d = `Play the free ${s.name} demo by ${p.name}: ${list}.`;
  const tails = [feature ? ` See how the ${feature} feature works. Honest review, no sign-up.` : '', ' Honest review, no sign-up.', ' No sign-up needed.', ''];
  d += tails.find((t) => t && (d + t).length <= 158) ?? '';
  return clip(d);
}

export function providerTitle(p: Provider, count: number): string[] {
  return [`${p.name} Slots – ${count} Free Demos & Reviews (${SITE.year})`, `${p.name} Slots – ${count} Free Demos (${SITE.year})`, `${p.name} Slots – Free Demos & Reviews`, `${p.name} Slots`];
}
export function providerDescription(p: Provider, count: number) {
  return `Browse ${count} ${p.name} slots with free demos, RTP, volatility and max win data. Compare their best games and signature mechanics${p.signatureMechanics?.length ? ` like ${p.signatureMechanics.slice(0, 2).join(' and ')}` : ''}.`;
}
