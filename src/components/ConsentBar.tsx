'use client';
import { useEffect, useState } from 'react';

/** Analytics consent for EEA/UK/CH visitors (and unknown countries). Two equal choices; the answer is remembered on this device. */
export function ConsentBar({ countries }: { countries: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let choice: string | null = null;
    try { choice = localStorage.getItem('ga_consent'); } catch { /* private mode */ }
    if (choice) return;
    const m = document.cookie.match(/(?:^|; )geo=([^;]+)/);
    const cc = m ? decodeURIComponent(m[1]).split('-')[0] : '';
    if (!cc || countries.split(',').includes(cc)) setShow(true);
  }, [countries]);
  if (!show) return null;
  const set = (v: 'granted' | 'denied') => {
    try { localStorage.setItem('ga_consent', v); } catch { /* private mode */ }
    (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.('consent', 'update', { analytics_storage: v });
    setShow(false);
  };
  return (
    <div className="consent" role="region" aria-label="Cookie choice">
      <p>We use Google Analytics cookies to count visits. No ads, no tracking across sites. <a href="/privacy">Privacy &amp; cookies</a></p>
      <div className="consent-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => set('denied')}>Decline</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => set('granted')}>Accept</button>
      </div>
    </div>
  );
}
