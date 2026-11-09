import Link from 'next/link';
import { getLetters as letters, getProviders, getSlots, getSlotsByProvider } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SlotGrid } from '@/components/SlotCard';
import { SlotSearch } from '@/components/SlotSearch';


export const metadata = buildMetadata({
  title: 'All Slots – Free Demos, RTP & Max Win Database',
  description: `Search ${getSlots().length}+ online slots with free official demos. Filter by provider or browse A–Z and compare RTP, volatility and max win.`,
  path: '/slots',
});

export default function SlotsIndex() {
  const slots = getSlots();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Slots', path: '/slots' }]} />
      <h1>All slots</h1>
      <p className="muted">{slots.length.toLocaleString()} slots reviewed, each with official demo, RTP, volatility and max win.</p>
      <SlotSearch />
      <h2>Browse A–Z</h2>
      <ul className="chips">{letters().map((l) => <li key={l}><Link href={`/slots/a-z/${l}`}>{l.toUpperCase()}</Link></li>)}</ul>
      <h2>By provider</h2>
      <ul className="chips">
        {getProviders().filter((p) => getSlotsByProvider(p.slug).length).map((p) => <li key={p.slug}><Link href={`/providers/${p.slug}`}>{p.name}</Link></li>)}
      </ul>
      <h2>Latest additions</h2>
      <SlotGrid slots={slots.slice(0, 24)} />
    </>
  );
}
