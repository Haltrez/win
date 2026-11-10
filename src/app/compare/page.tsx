import Link from 'next/link';
import { getComparisons } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({ title: ['Slot Comparisons – Head-to-Head RTP, Volatility & Max Win', 'Slot Comparisons – RTP, Volatility & Max Win Head-to-Head', 'Slot Comparisons – Head-to-Head RTP & Max Win'], description: 'Side-by-side comparisons of popular slots: RTP, volatility, max win, features and which one suits your play style.', path: '/compare' });

export default function Compare() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Compare', path: '/compare' }]} />
      <h1>Slot comparisons</h1>
      <p className="muted">{getComparisons().length} head-to-head comparisons of RTP, volatility, max win and features.</p>
      <ul className="tiles tiles-wide">{getComparisons().map((c) => <li key={c.slug}><Link href={`/compare/${c.slug}`}>{c.a.name} <span className="count">vs</span> {c.b.name}</Link></li>)}</ul>
    </>
  );
}
