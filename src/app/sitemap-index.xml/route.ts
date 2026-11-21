import { SITE } from '@/lib/config';
import sitemap, { SITEMAP_IDS } from '../sitemap';

/** Sitemap index at /sitemap.xml listing the split sitemaps, so one URL can be submitted to search engines. */
export const dynamic = 'force-static';

const day = (d: string | Date | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/** Latest lastmod inside a child sitemap, so crawlers know which files changed since their last read. */
async function latest(id: string): Promise<string> {
  const entries = await sitemap({ id: Promise.resolve(id) });
  return entries.reduce((m, e) => { const d = day(e.lastModified); return d > m ? d : m; }, '');
}

export async function GET() {
  const items = await Promise.all(SITEMAP_IDS.map(async (id) => {
    const lm = await latest(id);
    return `  <sitemap><loc>${SITE.url}/sitemap/${id}.xml</loc>${lm ? `<lastmod>${lm}</lastmod>` : ''}</sitemap>`;
  }));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join('\n')}
</sitemapindex>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
