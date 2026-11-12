import type { MetadataRoute } from 'next';
import { FEATURES, SITE } from '@/lib/config';
import { getGuides, getLetters, getProviders, getSlots, getSlotsByProvider, slotUrl } from '@/lib/data';
import { getCategories, getCategorySlots, isIndexable } from '@/lib/categories';

/** Split sitemaps by content type so indexing can be monitored per type in Search Console. */
export const SITEMAP_IDS = ['core', 'slots', 'providers', 'best', 'guides'] as const;

export async function generateSitemaps() {
  return SITEMAP_IDS.map((id) => ({ id }));
}

const u = (p: string) => `${SITE.url}${p}`;

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  const slots = getSlots();
  const latest = slots.reduce((m, s) => (s.updatedAt > m ? s.updatedAt : m), '2000-01-01');
  switch (id) {
    case 'slots':
      // At >45k slots, split this further by provider or chunk index (50k URL limit per file).
      return slots.map((s) => ({ url: u(slotUrl(s)), lastModified: s.updatedAt, changeFrequency: 'monthly', priority: 0.8, ...(s.image ? { images: [u(s.image)] } : {}) }));
    case 'providers':
      return getProviders().filter((p) => getSlotsByProvider(p.slug).length).map((p) => {
        const ps = getSlotsByProvider(p.slug);
        return { url: u(`/providers/${p.slug}`), lastModified: ps.reduce((m, s) => (s.updatedAt > m ? s.updatedAt : m), '2000-01-01'), changeFrequency: 'weekly', priority: 0.7 };
      });
    case 'best':
      return [
        ...getCategories().filter(isIndexable).map((c) => ({ url: u(`/best/${c.slug}`), lastModified: getCategorySlots(c).reduce((m, s) => (s.updatedAt > m ? s.updatedAt : m), '2000-01-01'), changeFrequency: 'weekly' as const, priority: 0.8 })),
        // Comparison pages are templated (noindex, follow) – kept out of the sitemap so they never count as thin content.
      ];
    case 'guides':
      return getGuides().map((g) => ({ url: u(`/guides/${g.slug}`), lastModified: g.updatedAt, changeFrequency: 'monthly', priority: 0.6 }));
    default:
      return [
        { url: u('/'), lastModified: latest, changeFrequency: 'daily', priority: 1 },
        ...['/slots', '/providers', '/best', '/guides', '/glossary', '/slot-database', '/biggest-slot-wins', '/new', '/widgets', '/tools', '/tools/slot-finder', '/tools/slot-cost-calculator', ...(FEATURES.realMoney ? ['/casinos'] : [])].map((p) => ({ url: u(p), lastModified: latest, changeFrequency: 'weekly' as const, priority: 0.7 })),
        ...getLetters().map((l) => ({ url: u(`/slots/a-z/${l}`), lastModified: latest, changeFrequency: 'weekly' as const, priority: 0.3 })),
        ...['/about', '/how-we-review', ...(FEATURES.realMoney ? ['/affiliate-disclosure'] : []), '/responsible-gambling', '/contact', '/privacy', '/terms'].map((p) => ({ url: u(p), changeFrequency: 'yearly' as const, priority: 0.2 })),
      ];
  }
}
