import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE } from '@/lib/config';
import { LOCALES, activeLocales, isLocale } from '@/lib/i18n';
import { DICT } from '@/lib/i18n-dict';

export const dynamicParams = false;
export function generateStaticParams() {
  return activeLocales().map((lang) => ({ lang }));
}

/** Header and footer for the translated sections (/es, /de, /sv). */
export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = DICT[lang];
  return (
    <div lang={lang}>
      <header className="site-header">
        <div className="container header-inner">
          <Link href={`/${lang}`} className="logo" aria-label={`${SITE.name} – ${t.home}`}>
            <svg className="logo-mark" width="26" height="26" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 9C32 9 15 29 15 40a17 17 0 0 0 34 0C49 29 32 9 32 9Z" fill="currentColor"/><circle cx="50" cy="15" r="3" fill="currentColor"/><circle cx="14" cy="18" r="2.2" fill="currentColor"/></svg>
            <span>Scatter <span className="logo-accent">Drop</span></span>
          </Link>
          <nav aria-label={t.langName} className="main-nav">
            <ul className="nav-desktop lang-nav">
              <li><Link href={`/${lang}`}>{t.slots}</Link></li>
              <li><Link href="/" hrefLang="en">{t.englishSite}</Link></li>
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" className="container">{children}</main>
      <footer className="site-footer">
        <div className="container">
          <p className="footer-legal">{t.footer.age} <a href="/responsible-gambling">{t.footer.rg}</a> · <a href="/affiliate-disclosure">{t.footer.disclosure}</a></p>
          <p className="muted small">© {SITE.year} {SITE.name} · {activeLocales().filter((l) => l !== lang).map((l, i) => <span key={l}>{i ? ' · ' : ''}<Link href={`/${l}`} hrefLang={l}>{DICT[l].langName}</Link></span>)} · <Link href="/" hrefLang="en">English</Link></p>
        </div>
      </footer>
    </div>
  );
}
