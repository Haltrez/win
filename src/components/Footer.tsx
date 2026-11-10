import Link from 'next/link';
import { FEATURES, RG, SITE } from '@/lib/config';
import { getProviders } from '@/lib/data';
import { getCategories, isIndexable } from '@/lib/categories';

export function Footer() {
  const providers = getProviders().slice(0, 8);
  const cats = getCategories().filter(isIndexable).slice(0, 8);
  return (
    <footer className="site-footer">
      <div className="container">
        <section className="rg-banner" aria-labelledby="rg-h">
          <h2 id="rg-h"><span className="badge-18">{RG.minAge}+</span> Play responsibly</h2>
          <p>
            Gambling should be entertainment, not a way to make money. Only gamble with money you can afford to lose, set deposit
            and time limits, and take breaks. If gambling stops being fun, use self-exclusion and talk to a support service.
          </p>
          <ul className="rg-links">
            {RG.resources.map((r) => (
              <li key={r.url}><a href={r.url} target="_blank" rel="noopener">{r.name}</a></li>
            ))}
          </ul>
        </section>
        <div className="footer-cols">
          <div>
            <h3>Providers</h3>
            <ul>{providers.map((p) => <li key={p.slug}><Link href={`/providers/${p.slug}`}>{p.name} slots</Link></li>)}</ul>
          </div>
          <div>
            <h3>Best slots</h3>
            <ul>{cats.map((c) => <li key={c.slug}><Link href={`/best/${c.slug}`}>{c.title}</Link></li>)}</ul>
          </div>
          <div>
            <h3>Guides</h3>
            <ul>
              <li><Link href="/guides/rtp-explained">RTP explained</Link></li>
              <li><Link href="/glossary">Slot glossary</Link></li>
              <li><Link href="/guides/slot-volatility-explained">Volatility guide</Link></li>
              <li><Link href="/guides/how-max-win-works">How max win works</Link></li>
              <li><Link href="/guides/bankroll-management-for-slots">Bankroll management</Link></li>
              <li><Link href="/compare">Slot comparisons</Link></li>
            </ul>
          </div>
          <div>
            <h3>{SITE.name}</h3>
            <ul>
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/how-we-review">How we review</Link></li>
              {FEATURES.realMoney ? <li><Link href="/affiliate-disclosure">Affiliate disclosure</Link></li> : null}
              <li><Link href="/responsible-gambling">Responsible gambling</Link></li>
              <li><Link href="/privacy">Privacy &amp; cookies</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
        <p className="legal">
          {SITE.name} is an independent information site. We do not operate gambling services and you cannot gamble for real money on this
          site. Demos use play money only.{FEATURES.realMoney ? ' Some links are affiliate links: we may earn a commission if you sign up with a casino, at no extra cost to you – this never affects our review scores.' : ''} Online gambling is restricted or illegal in some jurisdictions; check
          your local laws. You must be {RG.minAge}+ (or the legal age in your country, if higher) to gamble.
        </p>
        <p className="legal">© {new Date().getFullYear()} {SITE.name}. Game names and trademarks belong to their respective owners.</p>
      </div>
    </footer>
  );
}
