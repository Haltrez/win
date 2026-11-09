import Link from 'next/link';

export function AffiliateDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`disclosure${compact ? ' compact' : ''}`} aria-label="Affiliate disclosure">
      <strong>Advertiser disclosure:</strong> we may earn a commission when you sign up via casino links on this page. This never
      influences our reviews or ratings. <Link href="/affiliate-disclosure">Learn more</Link>. <span className="badge-18">18+</span>{' '}
      <Link href="/responsible-gambling">Play responsibly</Link>.
    </aside>
  );
}
