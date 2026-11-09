'use client';
import { useEffect, useState } from 'react';

const KEY = 'age_ok';
/**
 * 18+ confirmation. Content stays in the server-rendered HTML (crawlable, no CLS for bots);
 * the overlay is only shown client-side until the visitor confirms. Declining routes to a help page.
 */
export function AgeGate() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!document.cookie.includes(`${KEY}=1`) && localStorage.getItem(KEY) !== '1') setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  const accept = () => {
    document.cookie = `${KEY}=1; max-age=${60 * 60 * 24 * 90}; path=/; samesite=lax`;
    try { localStorage.setItem(KEY, '1'); } catch {}
    setShow(false);
  };
  return (
    <div className="agegate" role="dialog" aria-modal="true" aria-labelledby="ag-h">
      <div className="agegate-box">
        <p className="badge-18 big">18+</p>
        <h2 id="ag-h">Are you 18 or older?</h2>
        <p>This site contains information about gambling products and links to licensed casinos. You must be 18 or over (or the legal gambling age in your country, if higher) to continue.</p>
        <div className="agegate-actions">
          <button className="btn btn-primary" onClick={accept} autoFocus>I am 18 or older</button>
          <a className="btn btn-ghost" href="https://www.gamblingtherapy.org/" rel="noopener">I am under 18</a>
        </div>
        <p className="muted small">Gambling can be addictive. Please play responsibly.</p>
      </div>
    </div>
  );
}
