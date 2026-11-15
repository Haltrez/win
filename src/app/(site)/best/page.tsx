import Link from 'next/link';
import Image from 'next/image';
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

const FEATURED: [string, string][] = [
  ['best-slots', 'Our highest-rated games across every studio'],
  ['new-slots', 'Fresh releases, updated every week'],
  ['high-rtp-slots', 'Games that pay back 96.5% or more'],
  ['highest-max-win-slots', 'The biggest ceilings – 10,000x and up'],
  ['low-volatility-slots', 'Frequent, smaller wins for long sessions'],
  ['megaways-slots', 'Changing reels, up to 117,649 ways'],
];
const short = (t: string) => t.replace(/\s+\d{4}$/, '').replace(/^Best /, '');

function Row({ title, items }: { title: string; items: CategoryDef[] }) {
  if (!items.length) return null;
  return (
    <div className="seg-row">
      <span className="seg-label">{title}</span>
      <ul className="seg">{items.map((c) => <li key={c.slug}><Link href={`/best/${c.slug}`}>{c.group === 'release' ? (c.title.match(/\d{4}/)?.[0] ?? short(c.title)) : short(c.title).replace(/^Slots with /, '').replace(/ Slots$/, '')}</Link></li>)}</ul>
    </div>
  );
}

export default function Best() {
  const cats = getCategories().filter(isIndexable);
  const by = (g: CategoryDef['group']) => cats.filter((c) => c.group === g);
  const featured = FEATURED.map(([slug, tag]) => ({ c: cats.find((x) => x.slug === slug), tag })).filter((x) => x.c) as { c: CategoryDef; tag: string }[];
  const used = new Set(featured.map((x) => x.c.slug));
  const seenArt = new Set<string>();
  const card = (c: CategoryDef) => {
    // a different game's art on every card: the best-ranked slot in the list not shown on an earlier card
    const list = getCategorySlots(c).filter((s) => s.image);
    const top = list.find((s) => !seenArt.has(s.slug)) ?? list[0];
    if (top) seenArt.add(top.slug);
    return (
      <li key={c.slug}>
        <Link href={`/best/${c.slug}`} className="list-card">
          {top?.image ? <Image src={top.image} alt="" width={240} height={180} sizes="(max-width: 640px) 45vw, 200px" /> : null}
          <span className="list-card-title">{short(c.title)}</span>
          <span className="list-card-count">{getCategorySlots(c).length} games</span>
        </Link>
      </li>
    );
  };
  return (
    <>
      <Breadcrumbs items={[{ name: 'Best slots', path: '/best' }]} />
      <h1>Best slots</h1>
      <p className="lede">Ranked lists built from official game data – pick what matters to you.</p>

      <ul className="feature-lists">
        {featured.map(({ c, tag }) => {
          const art = getCategorySlots(c).filter((s) => s.image).slice(0, 3);
          return (
            <li key={c.slug}>
              <Link href={`/best/${c.slug}`} className="feature-list-card">
                <span className="collage" aria-hidden>{art.map((s) => <Image key={s.slug} src={s.image!} alt="" width={240} height={180} sizes="(max-width: 640px) 30vw, 140px" />)}</span>
                <span className="fl-body">
                  <span className="fl-title">{c.slug === 'best-slots' ? 'Top rated' : short(c.title)}</span>
                  <span className="fl-tag">{tag}</span>
                  <span className="fl-count">{getCategorySlots(c).length} games →</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className="seg-block" aria-label="Quick filters">
        <Row title="Max win" items={by('max-win').filter((c) => !used.has(c.slug))} />
        <Row title="Volatility" items={by('volatility').filter((c) => !used.has(c.slug))} />
        <Row title="RTP" items={by('rtp').filter((c) => !used.has(c.slug))} />
        <Row title="Release" items={by('release').filter((c) => !used.has(c.slug))} />
      </section>

      <h2>By feature</h2>
      <ul className="list-cards">{by('mechanics').filter((c) => !used.has(c.slug)).map(card)}</ul>

      <h2>By theme</h2>
      <ul className="list-cards">{by('themes').map(card)}</ul>

      {by('style').filter((c) => !used.has(c.slug)).length ? (
        <>
          <h2>More lists</h2>
          <ul className="list-cards">{by('style').filter((c) => !used.has(c.slug)).map(card)}</ul>
        </>
      ) : null}
    </>
  );
}
