import { RG, SITE } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({ title: ['Responsible Gambling – Limits, Self-Exclusion & Support', 'Responsible Gambling – Limits & Support'], description: 'How to keep gambling safe: warning signs, deposit limits, self-exclusion schemes (GAMSTOP, Spelpaus, OASIS) and free, confidential support services.', path: '/responsible-gambling' });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Responsible gambling', path: '/responsible-gambling' }]} />
      <article className="prose">
        <h1>Responsible gambling</h1>
        <p>{SITE.name} exists to help people understand slots before they play – including the fact that, over time, every slot is designed to return less than you put in. Gambling should only ever be a paid-for form of entertainment.</p>
        <h2>Keep it safe</h2>
        <ul>
          <li>Decide on a budget before you start and never exceed it. Treat it as the cost of entertainment.</li>
          <li>Set deposit, loss and session-time limits in your casino account – licensed operators must offer them.</li>
          <li>Never chase losses or gamble to solve money problems.</li>
          <li>Don&apos;t gamble when stressed, upset or under the influence of alcohol.</li>
          <li>Use reality checks and take regular breaks.</li>
        </ul>
        <h2>Warning signs</h2>
        <ul>
          <li>Spending more money or time than you intended, or hiding it from others.</li>
          <li>Borrowing money or selling things to gamble.</li>
          <li>Feeling anxious, irritable or low when not gambling.</li>
          <li>Gambling to win back losses.</li>
        </ul>
        <h2>Self-exclusion and blocking</h2>
        <p>Self-exclusion schemes block you from licensed gambling sites for a period you choose. Gambling-block software (such as Gamban or BetBlocker) and bank gambling blocks add a further layer.</p>
        <h2>Free, confidential help</h2>
        <ul>{RG.resources.map((r) => <li key={r.url}><a href={r.url} rel="noopener" target="_blank">{r.name}</a></li>)}</ul>
        <h2>Under 18s</h2>
        <p>Gambling is for adults only. Our content is not intended for anyone under {RG.minAge} (or the legal age in their jurisdiction). Parents can use filtering tools such as Net Nanny or device-level parental controls.</p>
      </article>
    </>
  );
}
