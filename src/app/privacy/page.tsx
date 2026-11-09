import { SITE } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({ title: 'Privacy & Cookie Policy', description: `How ${SITE.name} handles data and cookies.`, path: '/privacy' });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Privacy', path: '/privacy' }]} />
      <article className="prose">
        <h1>Privacy &amp; cookie policy</h1>
        <p className="notice">Template – have this reviewed by a qualified privacy professional for your jurisdictions (GDPR/UK GDPR, ePrivacy, CCPA) before launch.</p>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Essential cookies:</strong> <code>age_ok</code> (age confirmation, 90 days) and <code>geo</code> (country code derived from your IP by our hosting provider, used to show casinos licensed for your region; session).</li>
          <li><strong>Favourites:</strong> stored only in your browser&apos;s local storage.</li>
          <li><strong>Analytics:</strong> privacy-friendly, aggregated page and click statistics. If Google Analytics is enabled it runs only after consent where required.</li>
          <li><strong>Affiliate clicks:</strong> when you click a casino link we log the casino, page and an anonymous click ID so partners can attribute referrals. We do not pass your name or email.</li>
        </ul>
        <h2>Your rights</h2>
        <p>You can request access to or deletion of personal data we hold by contacting us. You can clear cookies and local storage in your browser at any time.</p>
        <h2>Embedded demos</h2>
        <p>Game demos are served by the game provider in an iframe only after you click play. The provider&apos;s own privacy policy applies to that content.</p>
      </article>
    </>
  );
}
