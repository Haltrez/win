'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const KEY = 'recent_slots';
export type Recent = { u: string; n: string; p: string; img?: string };
const read = (): Recent[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };

/** Remember a demo the visitor started (this device only, newest first, max 12). */
export function rememberSlot(r: Recent) {
  try { localStorage.setItem(KEY, JSON.stringify([r, ...read().filter((x) => x.u !== r.u)].slice(0, 12))); } catch { /* private mode */ }
}

/** "Continue playing" rail – only rendered for visitors who have played a demo here before. */
export function RecentSlots({ exclude }: { exclude?: string }) {
  const [list, setList] = useState<Recent[]>([]);
  useEffect(() => setList(read().filter((x) => x.u !== exclude)), [exclude]);
  if (!list.length) return null;
  return (
    <section aria-labelledby="recent-h">
      <div className="section-head"><h2 id="recent-h">Continue playing</h2></div>
      <div className="slot-rail recent-rail" role="list">
        {list.map((r) => (
          <div role="listitem" key={r.u}>
            <article className="slot-card">
              <Link href={r.u} className="slot-card-link">
                <div className="slot-card-media">
                  {r.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="thumb" src={r.img} alt={`${r.n} slot demo`} width={240} height={180} loading="lazy" />
                  ) : <span className="finder-noimg" />}
                  <span className="card-play" aria-hidden><span className="card-play-btn"><i /> Play demo</span></span>
                </div>
                <h3>{r.n}</h3>
                <p className="slot-card-meta"><span className="prov">{r.p}</span></p>
              </Link>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
