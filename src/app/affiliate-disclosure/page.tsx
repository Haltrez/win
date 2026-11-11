import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/config';
import { SITE } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getCasinos } from '@/lib/data';

export const metadata = buildMetadata({ title: 'Affiliate Disclosure', description: `How ${SITE.name} makes money, and why commercial relationships never affect our slot reviews or scores.`, path: '/affiliate-disclosure' });

export default function Page() {
  if (!FEATURES.realMoney) notFound();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Affiliate disclosure', path: '/affiliate-disclosure' }]} />
      <article className="prose">
        <h1>Affiliate disclosure</h1>
        <p>{SITE.name} is free to use. We earn money through affiliate partnerships: when you click a casino link marked &quot;Play for real money&quot;, &quot;Visit casino&quot; or similar and then register or deposit, the casino may pay us a commission. This costs you nothing extra.</p>
        <h2>Our casino partners</h2>
        <p>We currently have affiliate agreements with the casinos below. This list is shown to every visitor. Offers and links are shown only to visitors from countries where each casino accepts players; in other countries we show no casino offers.</p>
        <ul className="partner-list">
          {getCasinos().map((c) => (
            <li key={c.slug}>
              {c.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={`casino-logo${c.logoLight ? ' casino-logo-light' : ''}`} src={c.logo} alt="" width={120} height={32} loading="lazy" />
              ) : null}
              <strong>{c.name}</strong>
            </li>
          ))}
        </ul>
        <h2>What this does not affect</h2>
        <ul>
          <li><strong>Slot reviews and scores.</strong> Slots are scored on gameplay, features and transparency. Providers cannot pay for a score.</li>
          <li><strong>Slot data.</strong> RTP, volatility and max win figures come from provider game sheets.</li>
          <li><strong>Lists.</strong> &quot;Best of&quot; slot lists are generated from game data and editorial scores, never from payments.</li>
        </ul>
        <h2>What it can affect</h2>
        <p>We only list casinos we have commercial agreements with, and commercial terms may affect the order in casino comparison tables. We only show a casino to visitors from countries where it accepts players, and we link our responsible gambling resources next to every offer.</p>
        <h2>Link labelling</h2>
        <p>Affiliate links are marked with <code>rel=&quot;sponsored&quot;</code> and routed via <code>/go/</code> URLs. We never use fake countdown timers, &quot;guaranteed win&quot; claims or other pressure tactics.</p>
        <p><Link href="/how-we-review">How we review slots and casinos →</Link></p>
      </article>
    </>
  );
}
