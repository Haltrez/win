import type { Metadata } from 'next';
import { SITE } from './config';
import { clip, fmtRtp, fmtX, VOLATILITY_LABEL, year } from './format';
import type { Provider, Slot } from './types';

export const abs = (p: string) => `${SITE.url}${p === '/' ? '' : p}`;

interface MetaInput {
  title: string;
  description: string;
  path: string;
  /** When true, title is used verbatim (no " | Site" suffix). */
  absoluteTitle?: boolean;
  noindex?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
}

export function buildMetadata(m: MetaInput): Metadata {
  const url = abs(m.path);
  const noindex = m.noindex || SITE.noindex;
  const ogImage = m.image ?? `${SITE.url}/opengraph-image`;
  return {
    title: m.absoluteTitle ? { absolute: m.title } : m.title,
    description: clip(m.description),
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: {
      title: m.title,
      description: clip(m.description, 200),
      url,
      siteName: SITE.name,
      type: m.type ?? 'website',
      locale: 'en_GB',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      ...(m.type === 'article' ? { publishedTime: m.publishedTime, modifiedTime: m.modifiedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title: m.title, description: clip(m.description, 200), site: SITE.twitter },
  };
}

/** "[Slot Name] Demo & Review – [Max Win]x Max Win | [Provider] ([Year])" */
export function slotTitle(s: Slot, p: Provider) {
  const y = year(s.releaseDate);
  const hook = s.maxWin ? `${fmtX(s.maxWin)} Max Win` : `${fmtRtp(s.rtp)} RTP`;
  return `${s.name} Demo & Review – ${hook} | ${p.name}${y ? ` (${y})` : ''}`;
}

/** Unique, data-driven meta description: RTP, volatility, max win + value prop. Optional parts are added only while they fit. */
export function slotDescription(s: Slot, p: Provider) {
  const vol = s.volatility ? VOLATILITY_LABEL[s.volatility].toLowerCase() : null;
  const feature = s.features[0]?.name.toLowerCase();
  const facts = [`${fmtRtp(s.rtp)} RTP`, vol ? `${vol} volatility` : null, s.maxWin ? `${fmtX(s.maxWin)} max win` : null].filter(Boolean) as string[];
  const list = facts.length > 1 ? `${facts.slice(0, -1).join(', ')} and ${facts[facts.length - 1]}` : facts[0];
  let d = `Play the free ${s.name} demo by ${p.name}: ${list}.`;
  const tails = [feature ? ` See how the ${feature} feature works. Honest review, no sign-up.` : '', ' Honest review, no sign-up.', ' No sign-up needed.', ''];
  d += tails.find((t) => t && (d + t).length <= 158) ?? '';
  return clip(d);
}

export function providerTitle(p: Provider, count: number) {
  return `${p.name} Slots – ${count} Free Demos & Reviews (${SITE.year})`;
}
export function providerDescription(p: Provider, count: number) {
  return `Browse ${count} ${p.name} slots with free demos, RTP, volatility and max win data. Compare their best games and signature mechanics${p.signatureMechanics?.length ? ` like ${p.signatureMechanics.slice(0, 2).join(' and ')}` : ''}.`;
}
