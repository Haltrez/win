import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Like / dislike votes for slots – no login.
 * Storage: Upstash Redis REST (Vercel → Storage → Upstash for Redis). Reads KV_REST_API_URL / KV_REST_API_TOKEN
 * (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). Without them the API answers 503 and the buttons hide.
 *
 * Keys:  votes:<provider>/<slug>          hash { up, down }   – public counts
 *        voter:<provider>/<slug>:<hash>   'up' | 'down'        – one vote per voter per slot (changeable)
 *        rl:<hash>                        counter, 1h TTL      – rate limit
 * A voter is a salted hash of IP + user agent; raw IPs are never stored.
 */
export const dynamic = 'force-dynamic';

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SALT = process.env.VOTE_SALT || 'scatterdrop-votes';
const ID = /^[a-z0-9-]{2,60}\/[a-z0-9-]{1,120}$/;
const RATE = 60; // votes per voter per hour

async function redis(cmds: (string | number)[][]): Promise<unknown[]> {
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return ((await r.json()) as { result: unknown }[]).map((x) => x.result);
}

const counts = (raw: unknown) => {
  const a = (raw as string[] | null) ?? [];
  const o: Record<string, number> = {};
  for (let i = 0; i < a.length; i += 2) o[a[i]] = Number(a[i + 1]) || 0;
  return { up: Math.max(0, o.up ?? 0), down: Math.max(0, o.down ?? 0) };
};

function voter(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(`${SALT}|${ip}|${req.headers.get('user-agent') || ''}`).digest('hex').slice(0, 32);
}

export async function GET(req: NextRequest) {
  if (!URL_ || !TOKEN) return NextResponse.json({ error: 'votes not configured' }, { status: 503 });
  const id = req.nextUrl.searchParams.get('id') || '';
  if (!ID.test(id)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  try {
    const [c, mine] = await redis([['HGETALL', `votes:${id}`], ['GET', `voter:${id}:${voter(req)}`]]);
    return NextResponse.json({ ...counts(c), mine: mine ?? null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  if (!URL_ || !TOKEN) return NextResponse.json({ error: 'votes not configured' }, { status: 503 });
  let body: { id?: string; vote?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }
  const id = body.id || '';
  const vote = body.vote === 'up' || body.vote === 'down' ? body.vote : body.vote === 'none' ? 'none' : null;
  if (!ID.test(id) || !vote) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const v = voter(req);
  try {
    const [n] = await redis([['INCR', `rl:${v}`], ['EXPIRE', `rl:${v}`, 3600, 'NX']]);
    if (Number(n) > RATE) return NextResponse.json({ error: 'slow down' }, { status: 429 });
    const key = `voter:${id}:${v}`;
    const [prev] = await redis([['GET', key]]);
    const cmds: (string | number)[][] = [];
    if (prev === vote || (prev == null && vote === 'none')) {
      // nothing changes
    } else {
      if (prev === 'up' || prev === 'down') cmds.push(['HINCRBY', `votes:${id}`, prev, -1]);
      if (vote === 'none') cmds.push(['DEL', key]);
      else cmds.push(['HINCRBY', `votes:${id}`, vote, 1], ['SET', key, vote, 'EX', 60 * 60 * 24 * 365]);
    }
    cmds.push(['HGETALL', `votes:${id}`]);
    const res = await redis(cmds);
    return NextResponse.json({ ...counts(res[res.length - 1]), mine: vote === 'none' ? null : vote }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
