'use client';
import { useEffect, useState } from 'react';
import { FEATURES } from '@/lib/config';

type C = { slug: string; name: string; geos: string[] };
const readGeo = () => { const m = document.cookie.match(/(?:^|; )geo=([^;]+)/); return m ? decodeURIComponent(m[1]) : null; };

/** One-tap real-money button: goes straight to the top casino that accepts the visitor's country. Hidden elsewhere. */
export function BestCasinoButton({ casinos, label, src, slot }: { casinos: C[]; label: string; src: string; slot?: string }) {
  const [c, setC] = useState<C | null>(null);
  useEffect(() => {
    if (!FEATURES.geoFilter) { setC(casinos[0] ?? null); return; }
    const geo = readGeo();
    if (!geo) return;
    const region = geo.split('-')[0];
    setC(casinos.find((x) => x.geos.includes(geo) || x.geos.includes(region)) ?? null);
  }, [casinos]);
  if (!c) return null;
  return (
    <a className="btn btn-primary btn-lg best-casino" href={`/go/${c.slug}?src=${encodeURIComponent(src)}${slot ? `&slot=${encodeURIComponent(slot)}` : ''}`} target="_blank" rel="sponsored nofollow noopener" data-event="affiliate_click">
      <span>{label} <span aria-hidden>→</span></span>
      <span className="best-casino-sub">at {c.name} · 18+</span>
    </a>
  );
}
