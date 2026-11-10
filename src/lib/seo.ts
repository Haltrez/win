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

/** True when visitors can actually play the demo (embedded here, or on the provider's official page). */
export const hasDemo = (s: Pick<Slot, 'demoUrl' | 'demoLink'>) => Boolean(s.demoUrl || s.demoLink);

/**
 * Slot title candidates, longest first. Pages with a playable demo lead with the exact search phrase
 * "[Slot] Demo"; pages without one are titled as reviews so the title never promises a demo we don't have.
 */
export function slotTitle(s: Slot, p: Provider): string[] {
  const hook = s.maxWin ? `${fmtX(s.maxWin)} Max Win` : s.rtp != null ? `${fmtRtp(s.rtp)} RTP` : null;
  const rtp = s.rtp != null && s.maxWin ? `${fmtRtp(s.rtp)} RTP` : null;
  if (!hasDemo(s))
    return [
      ...(hook ? [`${s.name} Slot Review – ${hook} | ${p.name}`, `${s.name} Slot Review – ${hook}`, `${s.name} Review – ${hook}`] : []),
      `${s.name} Slot Review | ${p.name}`,
      `${s.name} Slot Review`,
    ];
  return [
    ...(hook && rtp ? [`${s.name} Demo – Play Free | ${rtp}, ${hook}`] : []),
    ...(hook ? [`${s.name} Demo – Play Free Slot | ${hook}`, `${s.name} Demo – Play Free | ${hook}`] : []),
    `${s.name} Demo – Play Free Slot by ${p.name}`,
    `${s.name} Demo – Play Free Slot`,
    `${s.name} Demo – Play Free`,
    `${s.name} Demo`,
  ];
}

/** Unique, data-driven meta description. Leads with "[Slot] demo" when one is playable. Optional parts are added only while they fit. */
export function slotDescription(s: Slot, p: Provider) {
  const vol = s.volatility ? VOLATILITY_LABEL[s.volatility].toLowerCase() : null;
  const feature = s.features[0]?.name.toLowerCase();
  const facts = [s.rtp != null ? `${fmtRtp(s.rtp)} RTP` : null, vol ? `${vol} volatility` : null, s.maxWin ? `${fmtX(s.maxWin)} max win` : null].filter(Boolean) as string[];
  const list = facts.length > 1 ? `${facts.slice(0, -1).join(', ')} and ${facts[facts.length - 1]}` : facts[0];
  if (!hasDemo(s)) return clip(`${s.name} by ${p.name} reviewed${list ? `: ${list}` : ''}.${feature ? ` How the ${feature} feature works, pros and cons.` : ' Features, pros and cons.'}`);
  let d = `${s.name} demo: play the ${p.name} slot free${s.demoUrl && s.provider !== 'push-gaming' ? ', no sign-up or download' : ` on the official ${p.name} site`}.${list ? ` ${list[0].toUpperCase()}${list.slice(1)}.` : ''}`;
  const tails = [feature ? ` See how the ${feature} feature works, plus our honest review.` : '', ' Plus our honest review.', ''];
  d += tails.find((t) => t && (d + t).length <= 158) ?? '';
  return clip(d);
}

export function providerTitle(p: Provider, count: number): string[] {
  return [`${p.name} Demo Slots – Play ${count} Free Demos (${SITE.year})`, `${p.name} Demo Slots – ${count} Free Demos`, `${p.name} Demo Slots – Free Play`, `${p.name} Demo Slots`];
}
export function providerDescription(p: Provider, count: number) {
  return `Play ${count} ${p.name} demo slots free, with RTP, volatility and max win data. Compare their best games and signature mechanics${p.signatureMechanics?.length ? ` like ${p.signatureMechanics.slice(0, 2).join(' and ')}` : ''}.`;
}
