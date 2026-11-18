import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { getProvider, getSlots, slotUrl } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SlotFinder, type FinderSlot } from '@/components/SlotFinder';

export function generateMetadata() {
  return buildMetadata({
    title: ['Slot Finder: Which Slot Should I Play? (3 Quick Questions)', 'Slot Finder: Find Your Next Slot', 'Slot Finder'],
    description: `Answer three quick questions about volatility, features and theme and get matching slots from our ${getSlots().length}-game database, each with official RTP data and a free demo.`,
    path: '/tools/slot-finder',
  });
}

export default function FinderPage() {
  const slots: FinderSlot[] = getSlots().map((s) => ({
    n: s.name, u: slotUrl(s), p: getProvider(s.provider)?.name ?? s.provider, img: s.image ?? null, rtp: s.rtpSource === 'third-party' ? null : s.rtp,
    vol: s.volatility, mw: s.maxWin, m: s.mechanics, t: s.themes, r: s.rating ?? 0, demo: Boolean(s.demoUrl) && !s.demoLink && s.provider !== 'push-gaming',
  }));
  const themes = [...new Set(getSlots().flatMap((s) => s.themes))].sort();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Tools', path: '/tools' }, { name: 'Slot finder', path: '/tools/slot-finder' }]} />
      <h1>Slot finder</h1>
      <section className="prose"><p>Not sure what to play? Answer three quick questions and we&apos;ll match you with slots from our database. Every result has official data and a free demo, so you can try before you decide. New to the terms? See <Link href="/guides/slot-volatility-explained">volatility explained</Link>.</p></section>
      <SlotFinder slots={slots} themes={themes} />
    </>
  );
}
