import { NextRequest, NextResponse } from 'next/server';

/** Shows the country/region the site detects for you (for testing VPN locations). */
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') || null;
  const region = req.headers.get('x-vercel-ip-country-region') || null;
  const city = req.headers.get('x-vercel-ip-city');
  return NextResponse.json(
    { country, region, city: city ? decodeURIComponent(city) : null, siteUses: country && region && (country === 'CA' || country === 'US') ? `${country}-${region}` : country },
    { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );
}
