'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/** Phone menu: full-width panel, closes on navigation, outside tap and Escape. */
export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="nav-mobile" ref={ref}>
      <button className="nav-toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
        <span aria-hidden>{open ? '✕' : '☰'}</span> Menu
      </button>
      <nav id="mobile-menu" className={`nav-panel${open ? ' open' : ''}`} aria-label="Mobile">
        <ul>
          {items.map((n) => (
            <li key={n.href}><Link href={n.href} aria-current={pathname === n.href ? 'page' : undefined}>{n.label}</Link></li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
