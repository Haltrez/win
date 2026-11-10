import Link from 'next/link';
import { getGuides, getProviders, getSlots, getSlotsByProvider, getCasinos } from '@/lib/data';
import { getCategories, getCategorySlots } from '@/lib/categories';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/config';
import { SlotRail } from '@/components/SlotCard';
import { AffiliateDisclosure } from '@/components/Disclosure';
import { CasinoModule } from '@/components/CasinoModule';
import { SlotSearch } from '@/components/SlotSearch';

export const metadata = buildMetadata({
  title: `Free Slot Demos & Honest Slot Reviews (${SITE.year}) | ${SITE.name}`,
  absoluteTitle: true,
  description: `Play ${getSlots().length}+ free slot demos from official providers. Compare RTP, volatility and max win, and read independent reviews before you play. 18+.`,
  path: '/',
});

const QUICK: [string, string][] = [
  ['/best/best-slots', 'Top rated'],
  ['/best/new-slots', 'New releases'],
  ['/best/high-rtp-slots', 'High RTP'],
  ['/best/highest-max-win-slots', 'Biggest max wins'],
  ['/best/low-volatility-slots', 'Low volatility'],
  ['/best/megaways-slots', 'Megaways'],
];

function Section({ title, href, linkText, children }: { title: string; href: string; linkText: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="section-head"><h2>{title}</h2><Link href={href}>{linkText} →</Link></div>
      {children}
    </section>
  );
}

export default function Home() {
  const slots = getSlots();
  const newest = slots.slice(0, 10);
  const top = getCategorySlots(getCategories().find((c) => c.slug === 'best-slots')!).slice(0, 10);
  const maxWin = getCategorySlots(getCategories().find((c) => c.slug === 'highest-max-win-slots')!).slice(0, 10);
  const highRtp = getCategorySlots(getCategories().find((c) => c.slug === 'high-rtp-slots')!).slice(0, 10);
  const providers = getProviders().map((p) => ({ p, n: getSlotsByProvider(p.slug).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const guides = ['how-slots-work', 'rtp-explained', 'slot-volatility-explained'].map((g) => getGuides().find((x) => x.slug === g)).filter(Boolean);
  return (
    <>
      <section className="hero">
        <h1>Free slot demos with honest, data-first reviews</h1>
        <p>
          Try {slots.length.toLocaleString()} slots in their official demo – no sign-up, no deposit – and check the numbers that matter: RTP,
          volatility, max win and how the bonus actually works.
        </p>
        <SlotSearch />
        <ul className="quick" aria-label="Popular lists">
          {QUICK.map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}
        </ul>
      </section>

      <Section title="Top-rated slots" href="/best/best-slots" linkText="See all"><SlotRail slots={top} ranked label="Top-rated slots" /></Section>
      <Section title="New releases" href="/best/new-slots" linkText="All new slots"><SlotRail slots={newest} label="New releases" /></Section>
      <Section title="Biggest max wins" href="/best/highest-max-win-slots" linkText="Highest max wins"><SlotRail slots={maxWin} label="Biggest max wins" /></Section>
      <Section title="Highest RTP" href="/best/high-rtp-slots" linkText="All high RTP slots"><SlotRail slots={highRtp} label="Highest RTP slots" /></Section>

      <Section title="Providers" href="/providers" linkText="All providers">
        <ul className="tiles">
          {providers.map(({ p, n }) => <li key={p.slug}><Link href={`/providers/${p.slug}`}>{p.name}<span className="count">{n}</span></Link></li>)}
        </ul>
      </Section>

      <AffiliateDisclosure />
      <CasinoModule casinos={getCasinos()} title="Licensed casinos we recommend" context="home" />

      <Section title="Learn how slots work" href="/guides" linkText="All guides">
        <div className="cards-3">
          {guides.map((g) => (
            <article key={g!.slug} className="info-card">
              <h3><Link href={`/guides/${g!.slug}`}>{g!.title}</Link></h3>
              <p className="muted small">{g!.description}</p>
            </article>
          ))}
        </div>
      </Section>

      <section>
        <h2>Why trust {SITE.name}?</h2>
        <div className="cards-3">
          <div className="info-card"><h3>Official demos only</h3><p className="muted small">Every demo is served by the game provider itself – with play-money credits.</p></div>
          <div className="info-card"><h3>Verified numbers</h3><p className="muted small">RTP, volatility and max win come from provider game sheets, and we tell you when a game is offered in lower RTP versions.</p></div>
          <div className="info-card"><h3>No hype</h3><p className="muted small">We never promise wins. Slots are games of chance and every review includes honest notes on volatility and risk.</p></div>
        </div>
      </section>
    </>
  );
}
