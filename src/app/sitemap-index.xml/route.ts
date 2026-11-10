import { SITE } from '@/lib/config';
import { SITEMAP_IDS } from '../sitemap';

/** Sitemap index at /sitemap.xml listing the split sitemaps, so one URL can be submitted to search engines. */
export const dynamic = 'force-static';

export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_IDS.map((id) => `  <sitemap><loc>${SITE.url}/sitemap/${id}.xml</loc></sitemap>`).join('\n')}
</sitemapindex>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
