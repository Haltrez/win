import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLetters as letters, getSlots, slotLetter as key } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SlotGrid } from '@/components/SlotCard';
import { insightSentences, listInsights } from '@/lib/insights';


export const dynamicParams = false;
export function generateStaticParams() {
  return letters().map((letter) => ({ letter }));
}
export async function generateMetadata({ params }: { params: Promise<{ letter: string }> }) {
  const { letter } = await params;
  const L = letter === '0-9' ? '0–9' : letter.toUpperCase();
  const list = getSlots().filter((s) => key(s.name) === letter).sort((a, b) => a.name.localeCompare(b.name));
  const ex = list.slice(0, 3).map((s) => s.name).join(', ');
  return buildMetadata({
    title: [`Slots Starting With ${L} – ${list.length} Free Demos A–Z`, `Slots Starting With ${L} – Free Demos A–Z`],
    description: `Browse ${list.length} slot${list.length === 1 ? '' : 's'} starting with ${L}${ex ? `, including ${ex}` : ''}. Every game has a free demo plus RTP, volatility and max win data.`,
    path: `/slots/a-z/${letter}`,
  });
}
export default async function Page({ params }: { params: Promise<{ letter: string }> }) {
  const { letter } = await params;
  const list = getSlots().filter((s) => key(s.name) === letter).sort((a, b) => a.name.localeCompare(b.name));
  if (!list.length) notFound();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Slots', path: '/slots' }, { name: `A–Z: ${letter.toUpperCase()}`, path: `/slots/a-z/${letter}` }]} />
      <h1>Slots starting with {letter.toUpperCase()}</h1>
      <section className="prose"><p>{insightSentences(listInsights(list), `slots starting with ${letter.toUpperCase()}`).join(' ')}</p></section>
      <ul className="chips">{letters().map((l) => <li key={l}><Link href={`/slots/a-z/${l}`} aria-current={l === letter ? 'page' : undefined}>{l.toUpperCase()}</Link></li>)}</ul>
      <SlotGrid slots={list} />
    </>
  );
}
