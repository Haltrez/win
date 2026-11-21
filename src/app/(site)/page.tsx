import Link from 'next/link';
import { RecentSlots } from '@/components/RecentSlots';
import { getGuides, getProviders, getSlots, getSlotsByProvider, getCasinos } from '@/lib/data';
import { getCategories, getCategorySlots } from '@/lib/categories';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/config';
import { SlotRail } from '@/components/SlotCard';
import { CasinoModule } from '@/components/CasinoModule';
import { ProviderLogo } from '@/components/ProviderLogo';

export const metadata = buildMetadata({
  title: `Free Slots, Blackjack & Roulette: ${Math.floor(getSlots().length / 10) * 10}+ Demos (${SITE.year}) | ${SITE.name}`,
  absoluteTitle: true,
  description: `Play ${Math.floor(getSlots().length / 10) * 10}+ official slot demos plus free blackjack, roulette, baccarat and video poker, no sign-up. RTP, max win and basic strategy for every game. 18+.`,
  path: '/',
});

const QUICK: [string, string, string][] = [
  ['/best/best-slots', 'Top rated', '★'],
  ['/best/new-slots', 'New', '✦'],
  ['/best/high-rtp-slots', 'High RTP', '%'],
  ['/best/highest-max-win-slots', 'Max wins', '⚡'],
  ['/best/megaways-slots', 'Megaways', '▦'],
  ['/biggest-slot-wins', 'Big wins', '🏆'],
  ['/table-games/blackjack', 'Blackjack', '♠'],
  ['/table-games/roulette', 'Roulette', '◎'],
  ['/guides/crazy-time-explained', 'Live game shows', '▶'],
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
        <h1>Play free: {slots.length.toLocaleString()} slot demos, blackjack, roulette and more</h1>
        <p>
          Official slot demos and our own free table games – no sign-up, no deposit – with the numbers that matter: RTP, volatility, max win,
          basic strategy and how every bonus actually works. Then, when you&apos;re ready, the casinos we trust for real play.
        </p>
        <p className="hero-cta">
          <form action="/random" method="get" className="random-form"><button type="submit" className="btn btn-primary btn-lg"><span className="demo-play" aria-hidden /> Random demo</button></form>
          <Link className="btn btn-ghost btn-lg" href="/tools/slot-finder">Find my slot</Link>
        </p>
        <ul className="quick" aria-label="Popular lists">
          {QUICK.map(([href, label, icon]) => <li key={href}><Link href={href}><span className="quick-ico" aria-hidden>{icon}</span>{label}</Link></li>)}
        </ul>
        <dl className="stat-strip">
          <div><dt>Games</dt><dd>{slots.length.toLocaleString()}</dd></div>
          <div><dt>Demos</dt><dd>{slots.filter((x) => x.demoUrl).length.toLocaleString()}</dd></div>
          <div><dt>Studios</dt><dd>{providers.length}</dd></div>
        </dl>
      </section>

      <RecentSlots />
      <section className="ways" aria-label="Three ways to play">
        <Link href="/slots" className="way"><span className="way-k">Slot demos</span><strong>{slots.length.toLocaleString()} official demos</strong><span className="muted small">Same maths as the real game, play money only.</span></Link>
        <Link href="/table-games" className="way"><span className="way-k">Table games</span><strong>Blackjack, roulette, baccarat, video poker, hold&apos;em</strong><span className="muted small">Our own free tables with a &quot;show book move&quot; hint mode.</span></Link>
        <Link href="/casinos" className="way"><span className="way-k">Play for real</span><strong>Casinos we work with</strong><span className="muted small">Filtered to the ones that accept players in your country.</span></Link>
      </section>
      <Section title="Top-rated slots" href="/best/best-slots" linkText="See all"><SlotRail slots={top} ranked label="Top-rated slots" /></Section>
      <CasinoModule casinos={getCasinos()} title="Top casino bonuses" context="home" />
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
