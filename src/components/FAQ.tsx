import { JsonLd } from './JsonLd';
import { faqPage } from '@/lib/schema';

export function FAQ({ items, title = 'Frequently asked questions' }: { items: { q: string; a: string }[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section className="faq" aria-labelledby="faq-h">
      <h2 id="faq-h">{title}</h2>
      {items.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
      <JsonLd data={faqPage(items)} />
    </section>
  );
}
