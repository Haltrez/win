import Link from 'next/link';
import { SITE } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({ title: 'Affiliate Disclosure', description: `How ${SITE.name} makes money, and why commercial relationships never affect our slot reviews or scores.`, path: '/affiliate-disclosure' });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Affiliate disclosure', path: '/affiliate-disclosure' }]} />
      <article className="prose">
        <h1>Affiliate disclosure</h1>
        <p>{SITE.name} is free to use. We earn money through affiliate partnerships: when you click a casino link marked &quot;Play for real money&quot;, &quot;Visit casino&quot; or similar and then register or deposit, the casino may pay us a commission. This costs you nothing extra.</p>
        <h2>What this does not affect</h2>
        <ul>
          <li><strong>Slot reviews and scores.</strong> Slots are scored on gameplay, features and transparency. Providers cannot pay for a score.</li>
          <li><strong>Slot data.</strong> RTP, volatility and max win figures come from provider game sheets.</li>
          <li><strong>Lists.</strong> &quot;Best of&quot; slot lists are generated from game data and editorial scores, never from payments.</li>
        </ul>
        <h2>What it can affect</h2>
        <p>We only list casinos we have commercial agreements with, and commercial terms may affect the order in casino comparison tables. Every listed casino must hold a valid licence for the visitor&apos;s region and offer responsible gambling tools.</p>
        <h2>Link labelling</h2>
        <p>Affiliate links are marked with <code>rel=&quot;sponsored&quot;</code> and routed via <code>/go/</code> URLs. We never use fake countdown timers, &quot;guaranteed win&quot; claims or other pressure tactics.</p>
        <p><Link href="/how-we-review">How we review slots and casinos →</Link></p>
      </article>
    </>
  );
}
