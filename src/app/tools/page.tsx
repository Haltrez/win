import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({
  title: ['Free Slot Tools: Finder, Cost Calculator, RTP Database & Widget', 'Free Slot Tools', 'Slot Tools'],
  description: 'Free tools for slot players and publishers: find a slot that suits you, see what RTP costs per session, browse every slot by RTP, and embed slot cards on your site.',
  path: '/tools',
});

const TOOLS: [string, string, string][] = [
  ['/tools/slot-finder', 'Slot finder', 'Three quick questions about volatility, features and theme – get matching slots with free demos.'],
  ['/tools/slot-cost-calculator', 'Slot cost calculator', 'Turn RTP into money: the expected cost of a session, and how much more a lower RTP version costs.'],
  ['/slot-database', 'Slot RTP database', 'Every slot in one sortable table with official RTP, volatility and max win. CSV download.'],
  ['/widgets', 'Slot widget for your site', 'Embed a slot card with official stats and a free-demo button on your blog or stream page.'],
  ['/compare', 'Slot comparisons', 'Side-by-side comparisons of popular slots and their sequels.'],
];

export default function ToolsPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Tools', path: '/tools' }]} />
      <h1>Free slot tools</h1>
      <div className="cards-3">
        {TOOLS.map(([href, name, desc]) => (
          <article key={href} className="info-card"><h2 className="h3"><Link href={href}>{name}</Link></h2><p className="muted small">{desc}</p></article>
        ))}
      </div>
    </>
  );
}
