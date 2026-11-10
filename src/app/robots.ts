import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/config';
import { SITEMAP_IDS } from './sitemap';

export default function robots(): MetadataRoute.Robots {
  if (SITE.noindex) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/go/', '/api/', '/favorites'] }],
    sitemap: [`${SITE.url}/sitemap.xml`, ...SITEMAP_IDS.map((id) => `${SITE.url}/sitemap/${id}.xml`)],
    host: SITE.url,
  };
}
