'use client';
import { useEffect, useState } from 'react';
import { FEATURES } from '@/lib/config';
import { geoAllowed, geoExcluded } from '@/lib/geo-match';

type C = { slug: string; name: string; logo: string; logoLight?: boolean; geos: string[] };
const readGeo = () => { const m = document.cookie.match(/(?:^|; )geo=([^;]+)/); return m ? decodeURIComponent(m[1]) : null; };

/** "Play for real" row: up to three casino logos available in the visitor's country, next to the demo. */
export function PlayForRealLogos({ casinos, slot, label = 'Play for real at', note = '18+ | Play responsibly' }: { casinos: C[]; slot: string; label?: string; note?: string }) {
  const [list, setList] = useState<C[]>([]);
  useEffect(() => {
    const geo = readGeo();
    const country = geo?.split('-')[0];
    const ok = FEATURES.geoFilter ? casinos.filter((c) => geo && geoAllowed(c.geos, country, geo)) : casinos.filter((c) => !geoExcluded(c.geos, country, geo));
    setList(ok.slice(0, 3));
  }, [casinos]);
  if (list.length < 2) return null;
  return (
    <div className="pfr">
      <p className="pfr-label">{label}</p>
      <ul className="pfr-logos">
        {list.map((c, i) => (
          <li key={c.slug}>
            <a href={`/go/${c.slug}?src=slot-logos&pos=${i + 1}&slot=${encodeURIComponent(slot)}`} target="_blank" rel="sponsored nofollow noopener" data-event="affiliate_click" aria-label={`Play at ${c.name}`} className={c.logoLight ? 'light' : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.logo} alt={`${c.name} logo`} loading="lazy" />
            </a>
          </li>
        ))}
      </ul>
      <p className="pfr-note">{note}</p>
    </div>
  );
}
