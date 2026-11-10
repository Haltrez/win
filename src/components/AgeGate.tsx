'use client';
import { useEffect, useRef } from 'react';

const KEY = 'age_ok';

/**
 * Runs inline before first paint (see layout): marks <html data-age="ok"> for visitors who already confirmed,
 * so the server-rendered gate is hidden by CSS without a flash. New visitors see the gate immediately.
 */
export const AGE_GATE_BOOT = `try{if(document.cookie.indexOf('${KEY}=1')>-1||localStorage.getItem('${KEY}')==='1')document.documentElement.dataset.age='ok'}catch(e){}`;

/**
 * 18+ confirmation, rendered in the HTML (not after hydration) so it paints immediately.
 * Page content stays in the DOM and crawlable; data-nosnippet keeps the gate text out of search snippets.
 * Declining routes to a help page.
 */
export function AgeGate() {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (document.documentElement.dataset.age !== 'ok') btn.current?.focus();
  }, []);
  const accept = () => {
    document.cookie = `${KEY}=1; max-age=${60 * 60 * 24 * 90}; path=/; samesite=lax`;
    try { localStorage.setItem(KEY, '1'); } catch {}
    document.documentElement.dataset.age = 'ok';
  };
  return (
    <div className="agegate" role="dialog" aria-modal="true" aria-labelledby="ag-h" data-nosnippet="">
      <div className="agegate-box">
        <p className="badge-18 big">18+</p>
        <h2 id="ag-h">Are you 18 or older?</h2>
        <p>This site contains information about casino slot games. You must be 18 or over (or the legal gambling age in your country, if higher) to continue.</p>
        <div className="agegate-actions">
          <button ref={btn} className="btn btn-primary" onClick={accept}>I am 18 or older</button>
          <a className="btn btn-ghost" href="https://www.gamblingtherapy.org/" rel="noopener">I am under 18</a>
        </div>
        <p className="muted small">Gambling can be addictive. Please play responsibly.</p>
      </div>
    </div>
  );
}
