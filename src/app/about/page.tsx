import Link from 'next/link';
import { SITE } from '@/lib/config';
import { getAuthors } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({ title: `About ${SITE.name}`, description: `${SITE.name} is an independent slot demo and review site. Learn who we are and how we work.`, path: '/about' });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'About', path: '/about' }]} />
      <article className="prose">
        <h1>About {SITE.name}</h1>
        <p>{SITE.name} is an independent slot information site. We publish free official demos and honest, data-led reviews so players can understand a game – its RTP, volatility, max win and features – before deciding whether to play it for real.</p>
        <p>We are not a casino and do not take bets. See our <Link href="/affiliate-disclosure">affiliate disclosure</Link> and <Link href="/how-we-review">editorial policy</Link>.</p>
        <h2>Our team</h2>
        {getAuthors().map((a) => (<div key={a.slug}><h3>{a.name}</h3><p className="muted">{a.role}</p><p>{a.bio}</p></div>))}
      </article>
    </>
  );
}
