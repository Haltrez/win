'use client';
import Script from 'next/script';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { useReportWebVitals } from 'next/web-vitals';
import { useEffect } from 'react';

declare global {
  interface Window { plausible?: (e: string, o?: { props?: Record<string, string> }) => void; gtag?: (...a: unknown[]) => void }
}

const PLAUSIBLE = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const GA = process.env.NEXT_PUBLIC_GA4_ID;

export function track(event: string, props: Record<string, string> = {}) {
  window.plausible?.(event, { props });
  window.gtag?.('event', event, props);
}

/** Vercel Web Analytics (page views, visitors, top pages) + optional Plausible/GA4 + Core Web Vitals reporting + affiliate click tracking (delegated on [data-event]). */
export function Analytics() {
  useReportWebVitals((m) => {
    const body = JSON.stringify({ name: m.name, value: m.value, rating: m.rating, id: m.id, path: location.pathname });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/vitals', body);
    else fetch('/api/vitals', { method: 'POST', body, keepalive: true }).catch(() => {});
  });
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-event]');
      if (a) track(a.dataset.event!, { href: a.getAttribute('href') || '', page: location.pathname });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return (
    <>
      <VercelAnalytics />
      {PLAUSIBLE ? <Script src="https://plausible.io/js/script.outbound-links.js" data-domain={PLAUSIBLE} strategy="afterInteractive" /> : null}
      {GA ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA}',{anonymize_ip:true});`}</Script>
        </>
      ) : null}
    </>
  );
}
