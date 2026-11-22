import type { NextRequest } from 'next/server';
import { dayKey, redisConfigured, redisPipeline } from './redis';

/**
 * Keeps automated traffic off affiliate links. Scrapers that follow every <a href> on the site would
 * otherwise register as "clicks" at the partner, which pollutes their stats and risks the account.
 * Only a real browser navigation (a person clicking) is redirected; everything else gets a plain 403/429.
 * No personal data is stored: the per-visitor rate limit uses a salted hash of the IP that expires in an hour.
 */
const BOT_UA = /bot|crawl|spider|slurp|curl\/|wget|python|httpclient|headless|phantom|scrapy|go-http|java\/|okhttp|axios|node-fetch|undici|libwww|lwp|dataprovider|facebookexternalhit|preview|monitor|validator|fetch\b|http_request|^$/i;

export type GateResult = { ok: true } | { ok: false; status: 403 | 429; reason: string };

async function ipHash(req: NextRequest): Promise<string> {
  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '').split(',')[0].trim() || 'none';
  const salt = process.env.CLICKS_TOKEN || 'go';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(buf)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Limit: clicks per visitor per hour across all casinos. A person comparing offers stays well under it. */
const PER_HOUR = 12;

export async function gateClick(req: NextRequest): Promise<GateResult> {
  const ua = req.headers.get('user-agent') || '';
  if (BOT_UA.test(ua)) return { ok: false, status: 403, reason: 'ua' };
  // Browsers navigating from a click send an HTML Accept header; scripted fetchers typically send */*.
  const accept = req.headers.get('accept') || '';
  if (!accept.includes('text/html')) return { ok: false, status: 403, reason: 'accept' };
  // Modern browsers mark a top-level navigation; a request that claims a browser UA but lacks it is scripted.
  const dest = req.headers.get('sec-fetch-dest');
  if (dest && dest !== 'document') return { ok: false, status: 403, reason: 'fetch-dest' };
  if (!redisConfigured()) return { ok: true };
  try {
    const key = `rl:go:${await ipHash(req)}`;
    const [n] = await redisPipeline([['INCR', key], ['EXPIRE', key, 3600]]);
    if (Number(n) > PER_HOUR) return { ok: false, status: 429, reason: 'rate' };
  } catch { /* redis down: let the click through */ }
  return { ok: true };
}

/** Counter for the owner's report: clicks:blocked:d:<day> hash reason → n. */
export function blockedCommands(reason: string, casino: string, now = new Date()): (string | number)[][] {
  const k = `clicks:blocked:d:${dayKey(now)}`;
  return [['HINCRBY', k, reason, 1], ['HINCRBY', k, `casino:${casino}`, 1], ['EXPIRE', k, 60 * 60 * 24 * 400]];
}
