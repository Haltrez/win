import Link from 'next/link';
import { getGuides } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({ title: ['Slot Guides – RTP, Volatility, Max Win & Bankroll Explained', 'Slot Guides – RTP, Volatility & Mechanics Explained', 'Slot Guides – RTP, Volatility & Max Win Explained'], description: 'Plain-English guides to how online slots work: RTP, volatility, hit frequency, max win, bonus buys, Megaways, cluster pays, hold and win and bankroll management.', path: '/guides' });

const LABEL: Record<string, string> = { basics: 'Slot basics', mechanics: 'Mechanics explained', strategy: 'Bankroll & strategy', 'responsible-gambling': 'Responsible gambling', regional: 'By country', providers: 'Providers', comparisons: 'Comparisons' };

export default function Guides() {
  const gs = getGuides();
  const groups = [...new Set(gs.map((g) => g.category))];
  return (
    <>
      <Breadcrumbs items={[{ name: 'Guides', path: '/guides' }]} />
      <h1>Slot guides</h1>
      <section className="prose"><p>{gs.length} plain-English guides to how online slots work – from RTP, volatility and hit frequency to studio mechanics like Megaways, xNudge and DuelReels. New to a term? Check the <Link href="/glossary">slot glossary</Link>.</p></section>
      {groups.map((cat) => (
        <section key={cat}>
          <h2>{LABEL[cat] ?? cat}</h2>
          <div className="cards-3">
            {gs.filter((g) => g.category === cat).map((g) => (
              <article key={g.slug} className="info-card"><h3><Link href={`/guides/${g.slug}`}>{g.title}</Link></h3><p className="muted small">{g.description}</p><p className="muted small">{g.readingMinutes} min read</p></article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
