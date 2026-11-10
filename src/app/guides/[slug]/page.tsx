import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAuthor, getGuide, getGuides, getSlotBySlug } from '@/lib/data';
import { getCategory } from '@/lib/categories';
import { buildMetadata } from '@/lib/seo';
import { article } from '@/lib/schema';
import { fmtDate } from '@/lib/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { FAQ } from '@/components/FAQ';
import { SlotGrid } from '@/components/SlotCard';
import type { Slot } from '@/lib/types';

type P = { slug: string };
export const dynamicParams = false;
export function generateStaticParams(): P[] { return getGuides().map((g) => ({ slug: g.slug })); }
export async function generateMetadata({ params }: { params: Promise<P> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return buildMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}`, type: 'article', publishedTime: g.publishedAt, modifiedTime: g.updatedAt });
}

export default async function GuidePage({ params }: { params: Promise<P> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const a = getAuthor(g.author);
  const slots = (g.relatedSlots ?? []).map(getSlotBySlug).filter(Boolean) as Slot[];
  const cats = (g.relatedCategories ?? []).map(getCategory).filter(Boolean);
  const more = getGuides().filter((x) => x.slug !== g.slug && x.category === g.category).slice(0, 4);
  return (
    <>
      <Breadcrumbs items={[{ name: 'Guides', path: '/guides' }, { name: g.title, path: `/guides/${g.slug}` }]} />
      <article className="prose">
        <h1>{g.title}</h1>
        <p className="muted small">By <Link href="/about">{a.name}</Link> · Updated {fmtDate(g.updatedAt)} · {g.readingMinutes} min read</p>
        <div dangerouslySetInnerHTML={{ __html: g.html }} />
      </article>
      {slots.length ? (<><h2>Slots mentioned in this guide</h2><SlotGrid slots={slots} /></>) : null}
      {cats.length ? (<><h2>Related slot lists</h2><ul className="inline-links">{cats.map((c) => <li key={c!.slug}><Link href={`/best/${c!.slug}`}>{c!.title.replace(/\s+\d{4}$/, '')}</Link></li>)}</ul></>) : null}
      <FAQ items={g.faq ?? []} />
      {more.length ? (<><h2>More guides</h2><ul>{more.map((m) => <li key={m.slug}><Link href={`/guides/${m.slug}`}>{m.title}</Link></li>)}</ul></>) : null}
      <p className="notice small">Slots are games of chance. No guide or strategy can change a slot&apos;s RTP or guarantee a win. 18+ – <Link href="/responsible-gambling">play responsibly</Link>.</p>
      <JsonLd data={article(g, a)} />
    </>
  );
}
