import { SITE } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactForm } from '@/components/ContactForm';

export const metadata = buildMetadata({ title: 'Contact', description: `Contact the ${SITE.name} team about data corrections, missing slots, partnerships or press. Send us a message through the form.`, path: '/contact' });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Contact', path: '/contact' }]} />
      <article className="prose">
        <h1>Contact us</h1>
        <p>Corrections, press and partnership enquiries – send us a message below. If you found an error in our slot data, include the slot name and the figure shown in the game&apos;s info screen; we aim to correct verified errors within 48 hours.</p>
        <ContactForm />
        <p>If you need help with gambling, please contact one of the services on our <a href="/responsible-gambling">responsible gambling page</a>.</p>
      </article>
    </>
  );
}
