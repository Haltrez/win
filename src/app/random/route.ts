import { NextResponse } from 'next/server';
import { getSlots, slotUrl } from '@/lib/data';

/** "Random demo" button: sends the visitor to a random slot that has a demo playable on this site. */
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const pool = getSlots().filter((s) => s.demoUrl && !s.demoLink && s.provider !== 'push-gaming');
  const s = pool[Math.floor(Math.random() * pool.length)];
  const res = NextResponse.redirect(new URL(slotUrl(s), req.url), 302);
  res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
