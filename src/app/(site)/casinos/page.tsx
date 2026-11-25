import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/config';
import { getCasinos } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/config';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CasinoModule } from '@/components/CasinoModule';

export const metadata = buildMetadata({ title: `Licensed Slot Casinos (${SITE.year}) – Bonuses Compared`, description: 'Compare licensed online casinos for slots: bonuses with full terms, wagering, licences and the providers each casino carries. 18+.', path: '/casinos' });

export default function Casinos() {
  if (!FEATURES.realMoney) notFound();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Casinos', path: '/casinos' }]} />
      <h1>Licensed casinos for slots</h1>
      <section className="prose">
        <p>We only list operators that hold a licence for your region and that we have an agreement with. Ranking is based on licensing, bonus fairness (wagering and caps), game selection, payment speed and responsible gambling tools – <Link href="/how-we-review">see our methodology</Link>. Bonuses always come with terms: read them before you deposit.</p>
      </section>
      <CasinoModule casinos={getCasinos()} title="Casinos available to you" context="casinos" />
      <section className="prose">
        <h2>Casinos by game</h2>
        <ul className="inline-links"><li><Link href="/casinos/blackjack">Best blackjack casinos</Link></li><li><Link href="/casinos/roulette">Best roulette casinos</Link></li><li><Link href="/casinos/baccarat">Best baccarat casinos</Link></li></ul>
        <h2 id="reviews">Why we list each casino</h2>
        <p>Facts below come from each operator&apos;s own site and the regulator&apos;s public register, checked on the date shown. Where we could not confirm something, it is left out rather than guessed.</p>
      </section>
      <section className="casino-reviews">
        {getCasinos().filter((c) => c.trust || c.cons?.length).map((c) => (
          <article key={c.slug} id={c.slug} className="casino-review">
            <h3>{c.name}</h3>
            <dl className="feature-list">
              {c.trust?.since ? <div><dt>Running since</dt><dd>{c.trust.since} ({new Date().getFullYear() - c.trust.since} years)</dd></div> : null}
              {c.trust?.payout ? <div><dt>Withdrawal time</dt><dd>{c.trust.payout}</dd></div> : null}
              {c.trust?.wagering ? <div><dt>Bonus wagering</dt><dd>{c.trust.wagering}</dd></div> : null}
              {c.trust?.minDeposit ? <div><dt>Min deposit</dt><dd>{c.trust.minDeposit}</dd></div> : null}
              {c.trust?.maxCashout ? <div><dt>Max bonus cashout</dt><dd>{c.trust.maxCashout}</dd></div> : null}
              {c.trust?.payments?.length ? <div><dt>Payments</dt><dd>{c.trust.payments.join(', ')}</dd></div> : null}
              {c.trust?.regulator ? <div><dt>Licence</dt><dd>{c.trust.regulator}</dd></div> : null}
              {c.trust?.support ? <div><dt>Support</dt><dd>{c.trust.support}</dd></div> : null}
              {c.pros?.length ? <div><dt>Good</dt><dd>{c.pros.join(' · ')}</dd></div> : null}
              {c.cons?.length ? <div><dt>Watch out for</dt><dd>{c.cons.join(' · ')}</dd></div> : null}
            </dl>
            {c.trust?.checked ? <p className="muted small">Checked {c.trust.checked}. Terms change – read them at the casino before you deposit.</p> : null}
          </article>
        ))}
      </section>
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
