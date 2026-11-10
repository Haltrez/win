#!/usr/bin/env node
/**
 * Submit URLs to IndexNow (Bing, Yandex, Seznam, Naver …; Bing also feeds ChatGPT search & DuckDuckGo).
 *
 *   node scripts/indexnow.mjs                 # every URL in the live sitemaps
 *   node scripts/indexnow.mjs /slots/x/y ...  # specific paths (e.g. this week's new pages)
 *
 * The key file public/<key>.txt must be live on the site first (it is deployed with the site).
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.scatterdrop.com').replace(/\/$/, '');
const host = new URL(SITE).host;
const keyFile = fs.readdirSync(path.join(process.cwd(), 'public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('No IndexNow key file (public/<32 hex>.txt) found');
const key = keyFile.replace('.txt', '');

async function sitemapUrls() {
  const ids = ['core', 'slots', 'providers', 'best', 'guides'];
  const out = [];
  for (const id of ids) {
    const xml = await (await fetch(`${SITE}/sitemap/${id}.xml`)).text();
    out.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return out;
}

const args = process.argv.slice(2);
const urls = args.length ? args.map((p) => (p.startsWith('http') ? p : SITE + p)) : await sitemapUrls();
for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `${SITE}/${keyFile}`, urlList: batch }),
  });
  console.log(`IndexNow: submitted ${batch.length} URLs → HTTP ${r.status} ${r.status === 200 || r.status === 202 ? '(accepted)' : await r.text()}`);
}
