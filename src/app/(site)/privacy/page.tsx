import { FEATURES, SITE } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({ title: 'Privacy & Cookie Policy', description: `How ${SITE.name} handles your data: the cookies we set, what stays in your browser, anonymous votes, analytics, affiliate clicks and the contact form.`, path: '/privacy' });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Privacy', path: '/privacy' }]} />
      <article className="prose">
        <h1>Privacy &amp; cookie policy</h1>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Essential cookies:</strong> <code>age_ok</code> (age confirmation, 90 days){FEATURES.realMoney ? <> and <code>geo</code> (country code derived from your IP by our hosting provider, used to show casinos licensed for your region; 6 hours)</> : null}.</li>
          <li><strong>Favourites and recently viewed slots:</strong> stored only in your browser&apos;s local storage. They never leave your device.</li>
          <li><strong>Like / dislike votes:</strong> to allow one vote per slot we store a salted, one-way hash of your IP address and browser user agent with your vote. Raw IP addresses are never stored.</li>
          <li><strong>Contact form:</strong> messages you send (and the name and email you enter) are delivered to us through the form service Web3Forms and used only to reply to you.</li>
          <li><strong>Analytics:</strong> aggregated page and click statistics from Vercel Analytics (no cookies), and Google Analytics 4 with IP anonymisation. Google Analytics sets the cookies <code>_ga</code> and <code>_ga_*</code> (up to 2 years) only after you accept in the EEA, UK and Switzerland; elsewhere it runs by default. We do not use advertising features. Your choice is stored in this browser (<code>ga_consent</code>); clear it to see the choice again.</li>
          {FEATURES.realMoney ? <li><strong>Affiliate clicks:</strong> when you click a casino link we log the casino, page and an anonymous click ID so partners can attribute referrals. We do not pass your name or email.</li> : null}
        </ul>
        <h2>Your rights</h2>
        <p>You can request access to or deletion of personal data we hold through our <a href="/contact">contact form</a>. You can clear cookies and local storage in your browser at any time.</p>
        <h2>Embedded demos</h2>
        <p>Game demos are served by the game provider in an iframe only after you click play. The provider&apos;s own privacy policy applies to that content.</p>
      </article>
    </>
  );
}
