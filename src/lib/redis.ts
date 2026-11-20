/**
 * Minimal Upstash Redis REST client (Vercel → Storage → Upstash for Redis sets the env vars).
 * Shared by votes and affiliate click counters. When unconfigured, callers degrade silently.
 */
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.CLICKS_TOKEN_KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.CLICKS_TOKEN_KV_REST_API_TOKEN;

export const redisConfigured = () => Boolean(URL_ && TOKEN);

export async function redisPipeline(cmds: (string | number)[][]): Promise<unknown[]> {
  if (!URL_ || !TOKEN) throw new Error('redis not configured');
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return ((await r.json()) as { result: unknown }[]).map((x) => x.result);
}

/** HGETALL reply (flat [k, v, k, v]) → object of numbers. */
export function hashToCounts(raw: unknown): Record<string, number> {
  const a = (raw as string[] | null) ?? [];
  const o: Record<string, number> = {};
  for (let i = 0; i < a.length; i += 2) o[a[i]] = Number(a[i + 1]) || 0;
  return o;
}

export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
export const monthKey = (d = new Date()) => d.toISOString().slice(0, 7);

/**
 * Affiliate click counters (no personal data – country code only).
 *   clicks:d:<YYYY-MM-DD>            hash casino → clicks
 *   clicks:m:<YYYY-MM>               hash casino → clicks
 *   clicks:c:<casino>:m:<YYYY-MM>    hash "cc:<country>" | "src:<placement>" | "pos:<n>" | "slot:<provider/slug>" → clicks
 */
export function clickCommands(e: { casino: string; src: string; pos: string | null; slot: string | null; country: string }, now = new Date()) {
  const d = dayKey(now), m = monthKey(now);
  const per = `clicks:c:${e.casino}:m:${m}`;
  const cmds: (string | number)[][] = [
    ['HINCRBY', `clicks:d:${d}`, e.casino, 1],
    ['EXPIRE', `clicks:d:${d}`, 60 * 60 * 24 * 400],
    ['HINCRBY', `clicks:m:${m}`, e.casino, 1],
    ['HINCRBY', per, `cc:${e.country || 'unknown'}`, 1],
    ['HINCRBY', per, `src:${e.src || 'unknown'}`, 1],
  ];
  if (e.pos) cmds.push(['HINCRBY', per, `pos:${e.pos}`, 1]);
  if (e.slot) cmds.push(['HINCRBY', per, `slot:${e.slot}`, 1]);
  return cmds;
}
