import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

/** English site chrome. Localised sections (/es, /de, /sv) have their own layout in app/[lang]. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="container">{children}</main>
      <Footer />
    </>
  );
}
