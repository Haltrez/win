import { NextRequest } from 'next/server';

/** Receives Core Web Vitals + client error beacons. Forwards to EVENTS_WEBHOOK_URL if configured. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = JSON.parse(await req.text()); } catch { return new Response(null, { status: 400 }); }
  const event = { type: 'web_vital', ...(body as object), ua: req.headers.get('user-agent'), ts: new Date().toISOString() };
  console.log(JSON.stringify(event));
  if (process.env.EVENTS_WEBHOOK_URL) {
    fetch(process.env.EVENTS_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(event) }).catch(() => {});
  }
  return new Response(null, { status: 204 });
}
