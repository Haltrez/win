import { NextRequest, NextResponse } from 'next/server';
import { getProvider, getSlot } from '@/lib/data';

/**
 * Resolves official demo URLs that need a value filled in at launch time, then redirects the iframe to them:
 *  - {version}: current build of a Hacksaw game, read from the provider's own version.json
 *  - {uuid}:    fresh anonymous demo session token (Push Gaming)
 * Only URLs stored in our content and on the provider's allowlisted demo domains are ever served (no open redirect).
 */
export const dynamic = 'force-dynamic';

const versionCache = new Map<string, { v: string; at: number }>();
async function currentVersion(base: string) {
  const hit = versionCache.get(base);
  if (hit && Date.now() - hit.at < 60 * 60 * 1000) return hit.v;
  const res = await fetch(`${base}/version.json`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`version.json ${res.status}`);
  const { version } = (await res.json()) as { version: string };
  versionCache.set(base, { v: version, at: Date.now() });
  return version;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string; slot: string }> }) {
  const { provider, slot } = await params;
  const s = getSlot(provider, slot);
  const p = getProvider(provider);
  if (!s?.demoUrl || !p) return new NextResponse('Demo not available', { status: 404 });

  let url = s.demoUrl;
  try {
    if (url.includes('{version}')) url = url.replace('{version}', await currentVersion(url.split('/{version}/')[0]));
  } catch {
    return new NextResponse('Demo temporarily unavailable', { status: 502 });
  }
  url = url.replace('{uuid}', crypto.randomUUID());
  if (req.nextUrl.searchParams.get('channel') === 'mobile') url = url.replace('channel=desktop', 'channel=mobile');

  const host = new URL(url).hostname;
  if (!p.demoDomains.some((d) => host === d || host.endsWith('.' + d))) return new NextResponse('Forbidden', { status: 403 });

  const res = NextResponse.redirect(url, 302);
  res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}
