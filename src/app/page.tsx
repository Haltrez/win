import Link from 'next/link';
import { getGuides, getProviders, getSlots, getSlotsByProvider, getCasinos } from '@/lib/data';
import { getCategories, getCategorySlots } from '@/lib/categories';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/config';
import { SlotRail } from '@/components/SlotCard';
import { AffiliateDisclosure } from '@/components/Disclosure';
import { CasinoModule } from '@/components/CasinoModule';
import { ProviderLogo } from '@/components/ProviderLogo';

export const metadata = buildMetadata({
  title: `Demo Slots: Play ${Math.floor(getSlots().length / 50) * 50}+ Free Slot Demos (${SITE.year}) | ${SITE.name}`,
  absoluteTitle: true,
  description: `Play ${getSlots().length}+ demo slots free: official demos from Pragmatic Play, Hacksaw, Nolimit City and more, no sign-up. RTP, volatility and max win for every game. 18+.`,
  path: '/',
});

const QUICK: [string, string][] = [
  ['/best/best-slots', 'Top rated'],
  ['/best/new-slots', 'New releases'],
  ['/best/high-rtp-slots', 'High RTP'],
  ['/best/highest-max-win-slots', 'Biggest max wins'],
  ['/best/low-volatility-slots', 'Low volatility'],
  ['/best/megaways-slots', 'Megaways'],
  ['/new', 'New this week'],
  ['/slot-database', 'RTP database'],
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
        <h1>Free demo slots with honest, data-first reviews</h1>
        <p>
          Try {slots.length.toLocaleString()} slots in their official demo – no sign-up, no deposit – and check the numbers that matter: RTP,
          volatility, max win and how the bonus actually works.
        </p>
        <ul className="quick" aria-label="Popular lists">
          {QUICK.map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}
        </ul>
        <dl className="stat-strip">
          <div><dt>Games</dt><dd>{slots.length.toLocaleString()}</dd></div>
          <div><dt>Official demos</dt><dd>{slots.filter((x) => x.demoUrl).length.toLocaleString()}</dd></div>
          <div><dt>Studios</dt><dd>{providers.length}</dd></div>
        </dl>
      </section>

      <Section title="Top-rated slots" href="/best/best-slots" linkText="See all"><SlotRail slots={top} ranked label="Top-rated slots" /></Section>
      <Section title="New releases" href="/best/new-slots" linkText="All new slots"><SlotRail slots={newest} label="New releases" /></Section>
      <Section title="Biggest max wins" href="/best/highest-max-win-slots" linkText="Highest max wins"><SlotRail slots={maxWin} label="Biggest max wins" /></Section>
      <Section title="Highest RTP" href="/best/high-rtp-slots" linkText="All high RTP slots"><SlotRail slots={highRtp} label="Highest RTP slots" /></Section>

      <Section title="Providers" href="/providers" linkText="All providers">
        <ul className="logo-tiles">
          {providers.map(({ p, n }) => (
            <li key={p.slug}>
              <Link href={`/providers/${p.slug}`} aria-label={`${p.name} – ${n} slots`}>
                <ProviderLogo p={p} size="md" />
                <span className="logo-tile-meta">{p.name} <span className="count">{n}</span></span>
              </Link>
            </li>
          ))}
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

    </>
  );
}
