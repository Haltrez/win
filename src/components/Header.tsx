import Link from 'next/link';
import { NAV, SITE } from '@/lib/config';

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo" aria-label={`${SITE.name} home`}>
          <span className="logo-mark" aria-hidden>◆</span> {SITE.name}
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
