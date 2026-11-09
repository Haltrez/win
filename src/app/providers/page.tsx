import Link from 'next/link';
import { getProviders, getSlotsByProvider } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SITE } from '@/lib/config';

export const metadata = buildMetadata({
  title: `Slot Providers (${SITE.year}) – Every Studio Reviewed`,
  description: 'Compare the top online slot providers – Pragmatic Play, Hacksaw Gaming, Nolimit City, Play\'n GO and more – with free demos of their best games.',
  path: '/providers',
});

export default function Providers() {
  const ps = getProviders();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Providers', path: '/providers' }]} />
      <h1>Slot providers</h1>
      <p className="muted">The studios behind the games, with their signature mechanics, licences and every slot we have reviewed.</p>
      <div className="cards-3">
        {ps.map((p) => (
          <article key={p.slug} className="info-card">
            <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}><Link href={`/providers/${p.slug}`}>{p.name}</Link></h2>
            <p className="muted small">{p.description.split('. ')[0]}.</p>
            <p className="small">{getSlotsByProvider(p.slug).length} slots reviewed{p.signatureMechanics?.length ? ` · Known for ${p.signatureMechanics.slice(0, 2).join(', ')}` : ''}</p>
          </article>
        ))}
      </div>
    </>
  );
}
