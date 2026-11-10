import Link from 'next/link';
import { getCategories, getCategorySlots, isIndexable } from '@/lib/categories';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/config';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { CategoryDef } from '@/lib/types';

export const metadata = buildMetadata({
  title: [`Best Slots ${SITE.year} – Lists by Max Win, Volatility, RTP & Feature`, `Best Slots ${SITE.year} – Lists by Max Win, RTP & Feature`, `Best Slots ${SITE.year} – Ranked Lists`],
  description: 'Every slot list we publish: highest max win, high and low volatility, high RTP, Megaways, bonus buy, cluster pays, themes and new releases.',
  path: '/best',
});

const GROUPS: [CategoryDef['group'], string][] = [
  ['style', 'Top lists'], ['max-win', 'By max win'], ['volatility', 'By volatility'], ['rtp', 'By RTP'], ['mechanics', 'By mechanic & feature'], ['themes', 'By theme'], ['release', 'By release date'],
];

export default function Best() {
  const cats = getCategories();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Best slots', path: '/best' }]} />
      <h1>Best slots lists</h1>
      {GROUPS.map(([g, label]) => {
        const list = cats.filter((c) => c.group === g);
        if (!list.length) return null;
        return (
          <section key={g}>
            <h2>{label}</h2>
            <ul className="tiles">
              {list.map((c) => <li key={c.slug}><Link href={`/best/${c.slug}`}>{c.title.replace(/\s+\d{4}$/, '')}<span className="count">{getCategorySlots(c).length}</span></Link></li>)}
            </ul>
          </section>
        );
      })}
    </>
  );
}
