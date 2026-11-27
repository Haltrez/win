'use client';
import Script from 'next/script';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { track as vercelTrack } from '@vercel/analytics';
import { useReportWebVitals } from 'next/web-vitals';
import { useEffect } from 'react';
import { SITE } from '@/lib/config';
import { ConsentBar } from './ConsentBar';

declare global {
  interface Window { plausible?: (e: string, o?: { props?: Record<string, string> }) => void; gtag?: (...a: unknown[]) => void }
}

const PLAUSIBLE = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const GA = SITE.ga4;
/** EEA, UK and Switzerland: analytics cookies only after consent. Elsewhere GA runs by default. */
const CONSENT_COUNTRIES = 'AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IE,IT,LV,LT,LU,MT,NL,PL,PT,RO,SK,SI,ES,SE,IS,LI,NO,GB,CH';

export function track(event: string, props: Record<string, string> = {}) {
  // Vercel custom events (Pro plan): affiliate clicks broken down by casino and placement, next to visitor numbers.
  try {
    const p: Record<string, string> = { ...props };
    if (p.href?.startsWith('/go/')) {
      const u = new URL(p.href, location.origin);
      p.casino = u.pathname.split('/')[2] ?? '';
      p.placement = u.searchParams.get('src') ?? '';
      delete p.href;
    }
    for (const k of Object.keys(p)) p[k] = String(p[k]).slice(0, 200);
    vercelTrack(event, p);
  } catch { /* analytics must never break a click */ }
  window.plausible?.(event, { props });
  window.gtag?.('event', event, props);
}

/** GA's 180 KB script loads on the first scroll/tap/key or 4 s after page load (commands queue in dataLayer meanwhile), so it stays off the critical path.
 * Vercel Web Analytics (page views, visitors, top pages) + optional Plausible/GA4 + Core Web Vitals reporting + affiliate click tracking (delegated on [data-event]). */
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
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;
var cc=(document.cookie.match(/(?:^|; )geo=([^;]+)/)||[])[1]||'';cc=decodeURIComponent(cc).split('-')[0];
var need='${CONSENT_COUNTRIES}'.split(',').indexOf(cc)>-1||!cc;var choice=null;try{choice=localStorage.getItem('ga_consent')}catch(e){}
var ok=choice==='granted'||(!need&&choice!=='denied');
gtag('consent','default',{analytics_storage:ok?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
gtag('js',new Date());gtag('config','${GA}',{anonymize_ip:true});
var gaEv=['pointerdown','keydown','scroll','touchstart'];function gaLoad(){if(window.__gaLoaded)return;window.__gaLoaded=1;gaEv.forEach(function(e){removeEventListener(e,gaLoad)});
var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${GA}';document.head.appendChild(s)}
gaEv.forEach(function(e){addEventListener(e,gaLoad,{passive:true})});
function gaLater(){setTimeout(gaLoad,4000)}if(document.readyState==='complete')gaLater();else addEventListener('load',gaLater);`}</Script>
          <ConsentBar countries={CONSENT_COUNTRIES} />
        </>
      ) : null}
    </>
  );
}
