import { SITE } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactForm } from '@/components/ContactForm';

export const metadata = buildMetadata({ title: 'Contact', description: `Contact the ${SITE.name} team about data corrections, missing slots, partnerships or press. Email partners@, press@ or hello@scatterdrop.com, or use the form.`, path: '/contact' });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Contact', path: '/contact' }]} />
      <article className="prose">
        <h1>Contact us</h1>
        <p>Corrections, press and partnership enquiries – send us a message below. If you found an error in our slot data, include the slot name and the figure shown in the game&apos;s info screen; we aim to correct verified errors within 48 hours.</p>
        <h2>Email us</h2>
        <dl className="feature-list contact-emails">
          <div><dt>Partnerships &amp; advertising</dt><dd><a href={`mailto:${SITE.contacts.partners}`}>{SITE.contacts.partners}</a></dd></div>
          <div><dt>Press &amp; data requests</dt><dd><a href={`mailto:${SITE.contacts.press}`}>{SITE.contacts.press}</a></dd></div>
          <div><dt>Everything else, including corrections</dt><dd><a href={`mailto:${SITE.contacts.hello}`}>{SITE.contacts.hello}</a></dd></div>
        </dl>
        <h2>Or send a message</h2>
        <ContactForm />
        <p>If you need help with gambling, please contact one of the services on our <a href="/responsible-gambling">responsible gambling page</a>.</p>
      </article>
    </>
  );
}
