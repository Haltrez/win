import { SITE } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({ title: 'Contact', description: `Contact the ${SITE.name} team – corrections, partnerships and press.`, path: '/contact' });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Contact', path: '/contact' }]} />
      <article className="prose">
        <h1>Contact us</h1>
        <p>Corrections, press and partnership enquiries: <a href="mailto:editorial@scatterdrop.com">editorial@scatterdrop.com</a></p>
        <p>If you found an error in our slot data, include the slot name and the figure shown in the game&apos;s info screen – we aim to correct verified errors within 48 hours.</p>
        <p>If you need help with gambling, please contact one of the services on our <a href="/responsible-gambling">responsible gambling page</a>.</p>
      </article>
    </>
  );
}
