import { after, NextRequest, NextResponse } from 'next/server';
import { clickCommands, redisConfigured, redisPipeline } from '@/lib/redis';
import { getCasino } from '@/lib/data';
import { FEATURES } from '@/lib/config';
import { geoAllowed, geoExcluded } from '@/lib/geo-match';
import { blockedCommands, gateClick } from '@/lib/bot-gate';
import { CLICK_COOKIE, clickTokenValid } from '@/lib/click-token';

/**
 * Affiliate redirect: /go/[casino]?src=slot:gates-of-olympus&pos=1
 * - Resolves the tracking link for the visitor's country (only for geos where the operator is licensed).
 * - Visitors outside licensed geos are sent to /casinos instead of an unlicensed offer.
 * - Logs the click server-side (conversion tracking) and appends a click id when the link has {clickid}.
 * Excluded from indexing via robots.txt + X-Robots-Tag (next.config.ts).
 */
export const dynamic = 'force-dynamic';

function countryOf(req: NextRequest) {
  return (
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    req.headers.get('cloudfront-viewer-country') ||
    req.cookies.get('geo')?.value ||
    ''
  ).toUpperCase();
}

function interstitial(name: string, path: string): NextResponse {
  const esc = (x: string) => x.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] as string));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Continue to ${esc(name)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d1117;color:#e6edf3;font:16px/1.5 system-ui,sans-serif}main{max-width:420px;padding:32px;text-align:center}h1{font-size:22px;margin:0 0 8px}p{color:#9aa4b2;margin:0 0 20px}button{font:inherit;font-weight:700;padding:14px 28px;border:0;border-radius:10px;background:#f5c518;color:#1a1400;cursor:pointer}small{display:block;margin-top:16px;color:#6b7684}</style></head>
<body><main><h1>Continue to ${esc(name)}</h1><p>You are leaving Scatter Drop for a partner casino. 18+ only. Please gamble responsibly.</p>
<form method="post" action="${esc(path)}"><button type="submit">Continue to ${esc(name)}</button></form><small><a href="/" style="color:#6b7684">Back to Scatter Drop</a></small></main></body></html>`;
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ casino: string }> }) { return handle(req, ctx, false); }
/** The interstitial's Continue button posts back here: a form submission is a deliberate human action. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ casino: string }> }) { return handle(req, ctx, true); }

async function handle(req: NextRequest, { params }: { params: Promise<{ casino: string }> }, confirmed: boolean) {
  if (!FEATURES.realMoney) return new NextResponse('Not found', { status: 404 });
  const { casino: slug } = await params;
  const c = getCasino(slug);
  if (!c) return NextResponse.redirect(new URL('/casinos', req.url), 302);

  // Bots and scripted fetchers never reach the partner (see lib/bot-gate.ts); their attempts are counted for the owner's report.
  const gate = await gateClick(req);
  if (!gate.ok) {
    if (redisConfigured()) after(() => redisPipeline(blockedCommands(gate.reason, c.slug)).catch(() => {}));
    return new NextResponse(gate.status === 429 ? 'Too many requests' : 'Forbidden', { status: gate.status, headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } });
  }
  // No human-click signal (set by the page when a person presses the link): show a one-button confirm page
  // instead of forwarding. Harvested links and headless crawlers stop here; a real visitor clicks once more.
  if (!confirmed && !clickTokenValid(req.cookies.get(CLICK_COOKIE)?.value)) {
    if (redisConfigured()) after(() => redisPipeline(blockedCommands('no-click', c.slug)).catch(() => {}));
    return interstitial(c.name, req.nextUrl.pathname + req.nextUrl.search);
  }

  const country = countryOf(req);
  const region = req.headers.get('x-vercel-ip-country-region');
  const geoKey = region && c.geos.includes(`${country}-${region}`) ? `${country}-${region}` : country;
  // Unknown country = not allowed: we never send a visitor to an offer unless their country is on the casino's list.
  const allowed = FEATURES.geoFilter || c.geos.includes('@strict') ? geoAllowed(c.geos, country, region) : !geoExcluded(c.geos, country, region);
  if (!allowed) return NextResponse.redirect(new URL('/casinos?unavailable=1', req.url), 302);

  const clickId = crypto.randomUUID();
  const target = (c.links[geoKey] || c.links[country] || c.links.default).replace('{clickid}', clickId);
  const src = req.nextUrl.searchParams.get('src') ?? '';
  const event = { type: 'affiliate_click', casino: c.slug, src, pos: req.nextUrl.searchParams.get('pos'), slot: req.nextUrl.searchParams.get('slot'), country, clickId, ts: new Date().toISOString(), referer: req.headers.get('referer') };
  console.log(JSON.stringify(event));
  // Durable counters for partner reports (no personal data). Runs after the redirect is sent.
  if (redisConfigured()) after(() => redisPipeline(clickCommands({ casino: c.slug, src, pos: event.pos, slot: event.slot, country })).catch(() => {}));
  if (process.env.EVENTS_WEBHOOK_URL) {
    fetch(process.env.EVENTS_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(event) }).catch(() => {});
  }
  const res = NextResponse.redirect(target, 302);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');
  return res;
}
