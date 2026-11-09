import { NextRequest, NextResponse } from 'next/server';

/**
 * Sets a `geo` cookie (ISO country, plus region for CA/US e.g. "CA-ON") from the edge's IP geolocation header.
 * Client components read it to show only casinos licensed for the visitor's location.
 * Pages remain fully static; this only adds a cookie.
 */
export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const country = (req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '').toUpperCase();
  if (!country || country === 'XX') return res;
  const region = req.headers.get('x-vercel-ip-country-region');
  const geo = (country === 'CA' || country === 'US') && region ? `${country}-${region}` : country;
  if (req.cookies.get('geo')?.value !== geo) res.cookies.set('geo', geo, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 6 });
  return res;
}

export const config = {
  matcher: ['/((?!_next/|api/|go/|icon.svg|favicon.ico|sitemap|robots.txt|search-index.json).*)'],
};
