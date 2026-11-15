import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { buildMetadata, abs } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { SITE } from '@/lib/config';

type Term = { term: string; def: string; link?: string };
const terms = (): Term[] =>
  (JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'glossary.json'), 'utf8')) as Term[]).sort((a, b) => a.term.localeCompare(b.term));
const id = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const metadata = buildMetadata({
  title: ['Slot Glossary – Every Slot Term Explained (A–Z)', 'Slot Glossary – Slot Terms Explained A–Z', 'Slot Glossary'],
  description: 'Plain-English definitions of slot terms: RTP, volatility, hit frequency, Megaways, cluster pays, hold and win, xNudge, xWays, DuelReels, bonus buy and more.',
  path: '/glossary',
});

export default function GlossaryPage() {
  const list = terms();
  const letters = [...new Set(list.map((t) => t.term[0].toUpperCase()))];
  return (
    <>
      <Breadcrumbs items={[{ name: 'Guides', path: '/guides' }, { name: 'Slot glossary', path: '/glossary' }]} />
      <h1>Slot glossary</h1>
      <section className="prose">
        <p>Short, plain-English definitions of the terms you&apos;ll see in slot reviews and paytables. Each entry links to a longer guide or a list of slots that use the feature.</p>
      </section>
      <nav className="az-bar" aria-label="Jump to letter">{letters.map((l) => <a key={l} href={`#${l}`}>{l}</a>)}</nav>
      <dl className="feature-list glossary">
        {list.map((t, i) => (
          <div key={t.term} id={i === list.findIndex((x) => x.term[0].toUpperCase() === t.term[0].toUpperCase()) ? t.term[0].toUpperCase() : undefined}>
            <dt id={id(t.term)}>{t.term}</dt>
            <dd>{t.def}{t.link ? <> <Link href={t.link}>Learn more →</Link></> : null}</dd>
          </div>
        ))}
      </dl>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'DefinedTermSet',
          '@id': `${abs('/glossary')}#terms`,
          name: `${SITE.name} slot glossary`,
          url: abs('/glossary'),
          hasDefinedTerm: list.map((t) => ({ '@type': 'DefinedTerm', name: t.term, description: t.def, url: `${abs('/glossary')}#${id(t.term)}` })),
        }}
      />
    </>
  );
}
