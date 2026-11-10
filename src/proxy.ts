import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_HOST = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://scatterdrop.com').host.replace(/^www\./, '');

/**
 * 1. Any host other than the canonical domain (e.g. *.vercel.app deployments and previews) is sent
 *    `X-Robots-Tag: noindex` so search engines never index a duplicate copy of the site.
 * 2. When real-money features are on, sets a `geo` cookie (ISO country, plus region for CA/US e.g. "CA-ON")
 *    from the edge's IP geolocation header so casino listings can be filtered by licence.
 * Pages remain fully static; this only adds a header / cookie.
 */
export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const host = (req.headers.get('host') || '').toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '');
  if (host && host !== CANONICAL_HOST && host !== 'localhost' && host !== '127.0.0.1') res.headers.set('X-Robots-Tag', 'noindex, nofollow');

  if (process.env.NEXT_PUBLIC_REAL_MONEY !== '1') return res; // geo only needed for casino listings
  const country = (req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '').toUpperCase();
  if (!country || country === 'XX') return res;
  const region = req.headers.get('x-vercel-ip-country-region');
  const geo = (country === 'CA' || country === 'US') && region ? `${country}-${region}` : country;
  if (req.cookies.get('geo')?.value !== geo) res.cookies.set('geo', geo, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 6 });
  return res;
}

export const config = {
  matcher: ['/((?!_next/|api/|go/|icon.svg|favicon.ico|search-index.json).*)'],
};
