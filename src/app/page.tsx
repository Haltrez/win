import Link from 'next/link';
import { getGuides, getProviders, getSlots, getSlotsByProvider, getCasinos } from '@/lib/data';
import { getCategories, getCategorySlots, isIndexable } from '@/lib/categories';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/config';
import { SlotGrid } from '@/components/SlotCard';
import { AffiliateDisclosure } from '@/components/Disclosure';
import { CasinoModule } from '@/components/CasinoModule';
import { SlotSearch } from '@/components/SlotSearch';

export const metadata = buildMetadata({
  title: `Free Slot Demos & Honest Slot Reviews (${SITE.year}) | ${SITE.name}`,
  absoluteTitle: true,
  description: `Play ${getSlots().length}+ free slot demos from official providers. Compare RTP, volatility and max win, and read independent reviews before you play. 18+.`,
  path: '/',
});

export default function Home() {
  const slots = getSlots();
  const newest = slots.slice(0, 8);
  const top = getCategorySlots(getCategories().find((c) => c.slug === 'best-slots')!).slice(0, 8);
  const maxWin = getCategorySlots(getCategories().find((c) => c.slug === 'highest-max-win-slots')!).slice(0, 4);
  const providers = getProviders().filter((p) => getSlotsByProvider(p.slug).length > 0);
  const cats = getCategories().filter(isIndexable);
  const guides = getGuides().slice(0, 6);
  return (
    <>
      <section className="hero">
        <h1>Free slot demos with honest, data-first reviews</h1>
        <p>
          Try {slots.length.toLocaleString()} slots in their official demo – no sign-up, no deposit – and check the numbers that matter before you
          ever play for real: RTP, volatility, max win and how the bonus actually works.
        </p>
        <SlotSearch />
        <ul className="chips" aria-label="Popular lists">
          {cats.slice(0, 10).map((c) => <li key={c.slug}><Link href={`/best/${c.slug}`}>{c.title.replace(/^Best /, '')}</Link></li>)}
        </ul>
      </section>

      <h2>Top-rated slots</h2>
      <SlotGrid slots={top} ranked />
      <p><Link href="/best/best-slots">See all top-rated slots →</Link></p>

      <h2>New slot releases</h2>
      <SlotGrid slots={newest} />
      <p><Link href="/best/new-slots">All new slots →</Link></p>

      <h2>Biggest max wins</h2>
      <SlotGrid slots={maxWin} />
      <p><Link href="/best/highest-max-win-slots">Highest max win slots →</Link></p>

      <h2>Browse by provider</h2>
      <ul className="chips">
        {providers.map((p) => <li key={p.slug}><Link href={`/providers/${p.slug}`}>{p.name} ({getSlotsByProvider(p.slug).length})</Link></li>)}
      </ul>

      <AffiliateDisclosure />
      <CasinoModule casinos={getCasinos()} title="Licensed casinos we recommend" context="home" />

      <h2>Learn how slots really work</h2>
      <div className="cards-3">
        {guides.map((g) => (
          <article key={g.slug} className="info-card">
            <h3><Link href={`/guides/${g.slug}`}>{g.title}</Link></h3>
            <p className="muted small">{g.description}</p>
          </article>
        ))}
      </div>

      <h2>Why trust {SITE.name}?</h2>
      <div className="cards-3">
        <div className="info-card"><h3>Official demos only</h3><p className="muted small">Every demo is served by the game provider itself – the same maths as the real-money game, with play money.</p></div>
        <div className="info-card"><h3>Verified numbers</h3><p className="muted small">RTP, volatility and max win are checked against provider game sheets, and we tell you when casinos may run lower RTP versions.</p></div>
        <div className="info-card"><h3>No hype</h3><p className="muted small">We never promise wins. Slots are games of chance and every review includes honest notes on volatility and risk.</p></div>
      </div>
    </>
  );
}
