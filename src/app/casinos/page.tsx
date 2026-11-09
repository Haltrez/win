import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/config';
import { getCasinos } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/config';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { AffiliateDisclosure } from '@/components/Disclosure';
import { CasinoModule } from '@/components/CasinoModule';

export const metadata = buildMetadata({ title: `Licensed Slot Casinos (${SITE.year}) – Bonuses Compared`, description: 'Compare licensed online casinos for slots: bonuses with full terms, wagering, licences and the providers each casino carries. 18+.', path: '/casinos' });

export default function Casinos() {
  if (!FEATURES.realMoney) notFound();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Casinos', path: '/casinos' }]} />
      <h1>Licensed casinos for slots</h1>
      <AffiliateDisclosure />
      <section className="prose">
        <p>We only list operators that hold a licence for your region and that we have an agreement with. Ranking is based on licensing, bonus fairness (wagering and caps), game selection, payment speed and responsible gambling tools – <Link href="/how-we-review">see our methodology</Link>. Bonuses always come with terms: read them before you deposit.</p>
      </section>
      <CasinoModule casinos={getCasinos()} title="Casinos available to you" context="casinos" />
      <section className="prose">
        <h2>Before you sign up</h2>
        <ul>
          <li>Check the licence number on the casino&apos;s footer against the regulator&apos;s public register.</li>
          <li>Wagering requirements decide how much you must bet before withdrawing bonus winnings – lower is better.</li>
          <li>Set deposit, loss and time limits as soon as you register. All licensed operators must offer them.</li>
          <li>Never deposit money you need for bills or essentials, and never chase losses.</li>
        </ul>
      </section>
    </>
  );
}
