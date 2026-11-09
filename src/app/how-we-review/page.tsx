import { FEATURES, SITE } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = buildMetadata({ title: 'How We Review Slots – Editorial Policy', description: `Our slot review methodology: demo testing, data verification against provider game sheets, scoring criteria and update policy.`, path: '/how-we-review' });

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'How we review', path: '/how-we-review' }]} />
      <article className="prose">
        <h1>How we review slots</h1>
        <h2>1. Play the official demo</h2>
        <p>Every reviewed slot is played in the provider&apos;s official demo. Reviewers record the number of spins, bonus triggers and notable outcomes, which appear on the page as &quot;demo session&quot; notes. We are explicit that a demo session is a tiny sample and says nothing reliable about RTP.</p>
        <h2>2. Verify the numbers</h2>
        <p>RTP (including alternative RTP versions), volatility, max win, layout and release date are checked against the provider&apos;s game sheet or in-game help. Each slot page shows when the figures were last verified.</p>
        <h2>3. Score</h2>
        <p>Our 1–10 score weighs: gameplay and feature design (35%), bonus round quality (25%), mathematical transparency and RTP (20%), presentation and mobile experience (10%), and originality (10%). Max win alone never increases a score.</p>
        <h2>4. Write it ourselves</h2>
        <p>Reviews are written and edited by people who have played the game. We may use software tools for data checks and spelling, but every review is original, fact-checked and edited by our team. We never copy provider marketing text.</p>
        <h2>5. Keep it current</h2>
        <p>New releases are added weekly. Existing reviews are re-checked when a provider changes a game, releases a new RTP version, or a reader reports an error.</p>
        {FEATURES.realMoney ? <><h2>Casino reviews</h2>
        <p>Casinos must hold a licence for the visitor&apos;s region. We assess licence and complaint history, bonus terms (wagering, caps, game weighting), withdrawal speed, game library and responsible gambling tools.</p></> : null}
        <p className="muted small">{SITE.name} editorial standards are reviewed every six months.</p>
      </article>
    </>
  );
}
