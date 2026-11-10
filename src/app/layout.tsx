import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter, Sora } from 'next/font/google';
import { SITE } from '@/lib/config';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AgeGate, AGE_GATE_BOOT } from '@/components/AgeGate';
import { Analytics } from '@/components/Analytics';
import { JsonLd } from '@/components/JsonLd';
import { organization, website } from '@/lib/schema';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} – Free Slot Demos & Reviews`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  robots: SITE.noindex ? { index: false, follow: false } : undefined,
  formatDetection: { telephone: false },
};

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'optional' });
const display = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap' });

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0d1117' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: AGE_GATE_BOOT }} />
        <link rel="alternate" type="application/rss+xml" title={`${SITE.name} – new slots and guides`} href="/feed.xml" />
        <a href="#main" className="skip">Skip to content</a>
        <Header />
        <main id="main" className="container">{children}</main>
        <Footer />
        <AgeGate />
        <Analytics />
        <JsonLd data={[organization(), website()]} />
      </body>
    </html>
  );
}
