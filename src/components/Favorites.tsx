'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const KEY = 'fav_slots';
type Fav = { id: string; name: string; url: string };
const read = (): Fav[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const write = (f: Fav[]) => { try { localStorage.setItem(KEY, JSON.stringify(f)); } catch {} };

/** Lightweight favourites (no account needed). Swap for an authenticated API when user accounts launch. */
export function FavoriteButton({ id, name, url }: Fav) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(read().some((f) => f.id === id)), [id]);
  const toggle = () => {
    const cur = read();
    const next = cur.some((f) => f.id === id) ? cur.filter((f) => f.id !== id) : [...cur, { id, name, url }];
    write(next);
    setOn(!on);
  };
  return (
    <button className={`btn btn-ghost fav${on ? ' on' : ''}`} onClick={toggle} aria-pressed={on}>
      {on ? '♥ Saved' : '♡ Save to favourites'}
    </button>
  );
}

export function FavoritesList() {
  const [favs, setFavs] = useState<Fav[] | null>(null);
  useEffect(() => setFavs(read()), []);
  if (favs === null) return <p className="muted">Loading…</p>;
  if (!favs.length) return <p>You haven&apos;t saved any slots yet. Use the <strong>Save to favourites</strong> button on any slot page.</p>;
  return (
    <ul className="fav-list">
      {favs.map((f) => (
        <li key={f.id}>
          <Link href={f.url}>{f.name}</Link>{' '}
          <button className="link-btn" onClick={() => { const n = favs.filter((x) => x.id !== f.id); write(n); setFavs(n); }}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
