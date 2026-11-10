import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { getProvider, getSlots, slotUrl } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FAQ } from '@/components/FAQ';
import { JsonLd } from '@/components/JsonLd';
import { abs } from '@/lib/seo';
import { CostCalculator, type CalcSlot } from '@/components/CostCalculator';

export const metadata = buildMetadata({
  title: ['Slot Cost Calculator: What Does RTP Cost You per Session?', 'Slot RTP Cost Calculator', 'Slot Cost Calculator'],
  description: 'Turn a slot\'s RTP into money: enter your bet and spins to see the expected cost of a session, and how much more the same session costs on a lower RTP version.',
  path: '/tools/slot-cost-calculator',
});

export default function CalculatorPage() {
  const slots: CalcSlot[] = getSlots().filter((s) => s.rtp != null && s.rtpSource !== 'third-party')
    .map((s) => ({ n: s.name, p: getProvider(s.provider)?.name ?? s.provider, u: slotUrl(s), rtp: s.rtp!, v: s.rtpVariants ?? [] }));
  const faq = [
    { q: 'How is the expected cost calculated?', a: 'Expected cost = bet × spins × (100% − RTP). A 96% RTP slot keeps 4% of everything you stake over the long run, so 500 spins at €1 cost €20 on average.' },
    { q: 'Why is my real result different?', a: 'RTP is an average over millions of spins. In a single session volatility dominates: you can win much more or lose much more than the expected cost. The calculator shows what the game costs on average, not what will happen.' },
    { q: 'Why compare RTP versions?', a: 'Many providers offer the same game at several RTP settings and casinos choose which one to run. On a long session, a lower version can cost two or three times as much for exactly the same game.' },
  ];
  return (
    <>
      <Breadcrumbs items={[{ name: 'Tools', path: '/tools' }, { name: 'Slot cost calculator', path: '/tools/slot-cost-calculator' }]} />
      <h1>Slot cost calculator</h1>
      <section className="prose"><p>RTP is easier to understand in money. Pick a slot (or type an RTP), set your bet and number of spins, and see what the session costs on average. Read more in our <Link href="/guides/rtp-explained">RTP guide</Link>.</p></section>
      <CostCalculator slots={slots} />
      <FAQ items={faq} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Slot cost calculator', url: abs('/tools/slot-cost-calculator'), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' } }} />
    </>
  );
}
