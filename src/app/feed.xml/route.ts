import { SITE } from '@/lib/config';
import { feedItems } from '@/lib/updates';

export const dynamic = 'force-static';

const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rfc = (d: string) => new Date(`${d}T09:00:00Z`).toUTCString();

/** RSS 2.0 feed of new slots and guides. */
export function GET() {
  const items = feedItems();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>${x(SITE.name)} – new slots and guides</title>
  <link>${SITE.url}/new</link>
  <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>New slot demos, reviews and guides added to ${x(SITE.name)} every week.</description>
  <language>en</language>
  ${items[0] ? `<lastBuildDate>${rfc(items[0].date)}</lastBuildDate>` : ''}
${items.map((i) => `  <item>
    <title>${x(i.title)}</title>
    <link>${SITE.url}${i.path}</link>
    <guid isPermaLink="true">${SITE.url}${i.path}</guid>
    <pubDate>${rfc(i.date)}</pubDate>
    <description>${x(i.description)}</description>${i.image ? `\n    <media:content url="${SITE.url}${i.image}" medium="image" type="image/webp"/>` : ''}
  </item>`).join('\n')}
</channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
