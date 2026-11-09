import { SITE } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({ title: 'Terms of Use', description: `Terms of use for ${SITE.name}.`, path: '/terms' });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Terms', path: '/terms' }]} />
      <article className="prose">
        <h1>Terms of use</h1>
        <p className="notice">Template – have this reviewed by legal counsel before launch.</p>
        <p>{SITE.name} provides information about online slots for adults aged 18+ (or the legal age in your jurisdiction). Information is provided in good faith but game data can change; always check the in-game information screen.</p>
        <p>We do not offer gambling services; all games on this site are free demos played with virtual credits that have no cash value. You are responsible for ensuring online gambling content is appropriate where you live.</p>
        <p>Game names, logos and demos are the property of their respective providers and are used for review and informational purposes.</p>
      </article>
    </>
  );
}
