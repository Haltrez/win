import { SITE } from './config';
import { abs } from './seo';
import { fmtX } from './format';
import type { Author, Guide, Provider, Slot } from './types';

export type Crumb = { name: string; path: string };

export const organization = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE.url}/#organization`,
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/icon.svg`,
});

export const website = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE.url}/#website`,
  name: SITE.name,
  url: SITE.url,
  publisher: { '@id': `${SITE.url}/#organization` },
  potentialAction: { '@type': 'SearchAction', target: `${SITE.url}/slots?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
});

export const breadcrumbs = (items: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
});

export const faqPage = (faq: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

const authorNode = (a: Author) => ({ '@type': 'Organization', name: a.name, url: `${SITE.url}/about` });

/** Game + editorial Review. No AggregateRating (we have no user ratings) – avoids self-serving review issues. */
export const slotGame = (s: Slot, p: Provider, a: Author, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Game',
  '@id': `${abs(url)}#game`,
  name: s.name,
  url: abs(url),
  description: `${s.name} is an online slot by ${p.name} ${s.rtp != null ? ` with ${s.rtp}% RTP` : ''}${s.maxWin ? `${s.rtp != null ? ' and' : ' with'} a ${fmtX(s.maxWin)} max win` : ''}.`,
  ...(s.releaseDate ? { datePublished: s.releaseDate } : {}),
  ...(s.image ? { image: abs(s.image) } : {}),
  genre: ['Online slot', ...s.themes],
  gameItem: s.features.map((f) => ({ '@type': 'Thing', name: f.name })),
  author: { '@type': 'Organization', name: p.name, url: p.website },
  publisher: { '@type': 'Organization', name: p.name },
  audience: { '@type': 'PeopleAudience', suggestedMinAge: 18 },
  ...(s.rating
    ? {
        review: {
          '@type': 'Review',
          author: authorNode(a),
          publisher: { '@id': `${SITE.url}/#organization` },
          datePublished: s.updatedAt,
          reviewBody: s.review.split('\n')[0],
          reviewRating: { '@type': 'Rating', ratingValue: s.rating, bestRating: 10, worstRating: 1 },
          positiveNotes: { '@type': 'ItemList', itemListElement: s.pros.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x })) },
          negativeNotes: { '@type': 'ItemList', itemListElement: s.cons.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x })) },
        },
      }
    : {}),
});

export const itemList = (name: string, items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(it.path), name: it.name })),
});

export const article = (g: Guide, a: Author) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: g.title,
  description: g.description,
  datePublished: g.publishedAt,
  dateModified: g.updatedAt,
  author: authorNode(a),
  publisher: { '@id': `${SITE.url}/#organization` },
  mainEntityOfPage: abs(`/guides/${g.slug}`),
});
