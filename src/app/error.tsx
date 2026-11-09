'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Report to monitoring endpoint (same sink as web vitals). Swap for Sentry if preferred.
    const body = JSON.stringify({ type: 'error', message: error.message, digest: error.digest, path: location.pathname });
    navigator.sendBeacon?.('/api/vitals', body);
  }, [error]);
  return (
    <section className="prose">
      <h1>Something went wrong</h1>
      <p>Sorry – this page failed to load. Please try again.</p>
      <button className="btn btn-primary" onClick={reset}>Try again</button>
    </section>
  );
}
