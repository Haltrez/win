import Link from 'next/link';
import { getLetters as letters, getProviders, getSlots, getSlotsByProvider } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SlotBrowser, type BrowserRow } from '@/components/SlotBrowser';
import { VOLATILITY_LABEL, releaseKey } from '@/lib/format';
import type { Volatility } from '@/lib/types';
import { SlotSearch } from '@/components/SlotSearch';


export const metadata = buildMetadata({
  title: [`Free Slot Demos – ${getSlots().length}+ Slots with RTP & Max Win`, 'All Slots – Free Demos, RTP & Max Win Database', 'All Slots – Free Demos & RTP'],
  description: `Search ${getSlots().length}+ online slots with free official demos. Filter by provider or browse A–Z and compare RTP, volatility and max win.`,
  path: '/slots',
});

export default function SlotsIndex() {
  const slots = getSlots();
  const providers = getProviders().filter((p) => getSlotsByProvider(p.slug).length).map((p) => ({ slug: p.slug, name: p.name }));
  const names = Object.fromEntries(providers.map((p) => [p.slug, p.name]));
  const rows: BrowserRow[] = slots.map((s) => ({
    n: s.name, u: `/slots/${s.provider}/${s.slug}`, p: names[s.provider] ?? s.provider, ps: s.provider, img: s.image ?? undefined,
    rtp: s.rtp, mw: s.maxWin, v: s.volatility, vl: s.volatility ? VOLATILITY_LABEL[s.volatility] : null, rel: releaseKey(s),
  }));
  const vols = (Object.keys(VOLATILITY_LABEL) as Volatility[]).filter((v) => slots.some((s) => s.volatility === v)).map((v) => ({ key: v, label: VOLATILITY_LABEL[v] }));
  return (
    <>
      <Breadcrumbs items={[{ name: 'Slots', path: '/slots' }]} />
      <h1>All slots</h1>
      <p className="muted">{slots.length.toLocaleString()} slots with official free demos, RTP, volatility and max win.</p>
      <SlotSearch />
      <nav aria-label="Browse A–Z" className="az-bar">
        {letters().map((l) => <Link key={l} href={`/slots/a-z/${l}`}>{l.toUpperCase()}</Link>)}
      </nav>
      <SlotBrowser rows={rows} providers={providers} vols={vols} />
    </>
  );
}
