import Link from 'next/link';
import { NAV, SITE } from '@/lib/config';

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo" aria-label={`${SITE.name} home`}>
          <svg className="logo-mark" width="26" height="26" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 9C32 9 15 29 15 40a17 17 0 0 0 34 0C49 29 32 9 32 9Z" fill="currentColor"/><circle cx="50" cy="15" r="3" fill="currentColor"/><circle cx="14" cy="18" r="2.2" fill="currentColor"/></svg>
          <span>Scatter <span className="logo-accent">Drop</span></span>
        </Link>
        <nav aria-label="Main" className="main-nav">
          <details className="nav-mobile">
            <summary aria-label="Open menu">Menu</summary>
            <ul>{NAV.map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}<li><Link href="/favorites">Favourites</Link></li></ul>
          </details>
          <ul className="nav-desktop">
            {NAV.map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}
            <li><Link href="/favorites" aria-label="Your favourite slots">♥</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
