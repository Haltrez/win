import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLetters as letters, getSlots, slotLetter as key } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SlotGrid } from '@/components/SlotCard';


export const dynamicParams = false;
export function generateStaticParams() {
  return letters().map((letter) => ({ letter }));
}
export async function generateMetadata({ params }: { params: Promise<{ letter: string }> }) {
  const { letter } = await params;
  const L = letter.toUpperCase();
  return buildMetadata({ title: `Slots Starting With ${L} – Free Demos A–Z`, description: `Every slot beginning with ${L} in our database, with free demo, RTP, volatility and max win.`, path: `/slots/a-z/${letter}` });
}
export default async function Page({ params }: { params: Promise<{ letter: string }> }) {
  const { letter } = await params;
  const list = getSlots().filter((s) => key(s.name) === letter).sort((a, b) => a.name.localeCompare(b.name));
  if (!list.length) notFound();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Slots', path: '/slots' }, { name: `A–Z: ${letter.toUpperCase()}`, path: `/slots/a-z/${letter}` }]} />
      <h1>Slots starting with {letter.toUpperCase()}</h1>
      <ul className="chips">{letters().map((l) => <li key={l}><Link href={`/slots/a-z/${l}`} aria-current={l === letter ? 'page' : undefined}>{l.toUpperCase()}</Link></li>)}</ul>
      <SlotGrid slots={list} />
    </>
  );
}
