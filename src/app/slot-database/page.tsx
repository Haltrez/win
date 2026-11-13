import Link from 'next/link';
import { buildMetadata, abs } from '@/lib/seo';
import { getProvider, getProviders, getSlots, slotUrl } from '@/lib/data';
import { SITE } from '@/lib/config';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { FAQ } from '@/components/FAQ';
import { SlotDatabase, type DbRow } from '@/components/SlotDatabase';

const rows = (): DbRow[] =>
  getSlots().map((s) => ({
    name: s.name, url: slotUrl(s), provider: s.provider, providerName: getProvider(s.provider)?.name ?? s.provider,
    rtp: s.rtp, vol: s.volatility, maxWin: s.maxWin, released: s.releaseDate, variants: s.rtpVariants?.length ?? 0,
  }));

export function generateMetadata() {
  const n = getSlots().length;
  return buildMetadata({
    title: [`Slot RTP Database: ${n} Slots by RTP, Volatility & Max Win`, `Slot RTP List: ${n} Slots Compared`, 'Slot RTP Database'],
    description: `Check the RTP of ${n} online slots: a sortable list with official RTP, volatility, max win and release year. Filter by provider. Free CSV download.`,
    path: '/slot-database',
  });
}

export default function SlotDatabasePage() {
  const all = rows();
  const withRtp = all.filter((r) => r.rtp != null);
  const updated = getSlots().reduce((m, s) => (s.updatedAt > m ? s.updatedAt : m), '2000-01-01');
  const providers = getProviders().filter((p) => all.some((r) => r.provider === p.slug)).map((p) => ({ slug: p.slug, name: p.name }));
  const faq = [
    { q: 'Where does the RTP data come from?', a: `Every RTP, volatility rating and max win comes from the provider's own game page or game sheet. When a provider doesn't publish a figure we show "Not published" instead of guessing. ${withRtp.length} of ${all.length} slots have an official RTP.` },
    { q: 'What does the * next to an RTP mean?', a: 'The provider offers the game in more than one RTP version, and casinos choose which one to run. We list the default or highest version; open the game\'s info screen to see the version you are playing.' },
    { q: 'Can I use this data?', a: 'Yes. Download the CSV and use it with a link back to this page as the source.' },
  ];
  return (
    <>
      <Breadcrumbs items={[{ name: 'Slots', path: '/slots' }, { name: 'Slot RTP database', path: '/slot-database' }]} />
      <h1>Slot RTP database</h1>
      <section className="prose">
        <p>
          Every slot on {SITE.name} in one table: {all.length.toLocaleString()} games with their official <Link href="/guides/rtp-explained">RTP</Link>,{' '}
          <Link href="/guides/slot-volatility-explained">volatility</Link>, <Link href="/guides/how-max-win-works">max win</Link> and release year.
          Click a column to sort, or filter by provider, volatility and RTP. For a provider-by-provider summary, see our{' '}
          <Link href="/guides/average-slot-rtp-by-provider">average RTP by provider</Link> analysis.
        </p>
        <p className="muted small">
          Data from official provider sources, updated weekly (last update {updated}). <a href="/slot-database.csv" download>Download as CSV</a>.
        </p>
      </section>
      <SlotDatabase rows={all} providers={providers} />
      <FAQ items={faq} title="About this data" />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: 'Online slot RTP, volatility and max win database',
          description: `Official RTP, volatility, max win and release dates for ${all.length} online slots from ${providers.length} providers, collected from provider game pages.`,
          url: abs('/slot-database'),
          creator: { '@type': 'Organization', name: SITE.name, url: SITE.url },
          dateModified: updated,
          license: 'https://creativecommons.org/licenses/by/4.0/',
          isAccessibleForFree: true,
          keywords: ['slot RTP', 'return to player', 'slot volatility', 'max win', 'online slots'],
          variableMeasured: ['RTP', 'Volatility', 'Max win', 'Release date'],
          distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: abs('/slot-database.csv') }],
        }}
      />
    </>
  );
}
