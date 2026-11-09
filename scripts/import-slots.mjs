#!/usr/bin/env node
/**
 * Bulk import / update slots from CSV (e.g. a provider's game sheet export or your data team's spreadsheet).
 *
 *   npm run import:slots -- data/new-releases.csv [--overwrite]
 *
 * CSV columns (header row required):
 *   slug,name,provider,rtp,rtpVariants,volatility,maxWin,releaseDate,reels,paylines,mechanics,themes,demoUrl
 * List columns (rtpVariants, mechanics, themes) are pipe-separated: "tumble|multipliers|free-spins".
 *
 * Creates content/slots/<provider>/<slug>.json with editorial fields stubbed (review, pros, cons, features).
 * Existing files keep their editorial content; only data fields are updated (unless --overwrite).
 * Stubbed reviews intentionally fail validation, so nothing publishes until an editor writes the review.
 */
import fs from 'node:fs';
import path from 'node:path';

const [file, ...flags] = process.argv.slice(2);
if (!file) { console.error('Usage: npm run import:slots -- <file.csv> [--overwrite]'); process.exit(1); }
const overwrite = flags.includes('--overwrite');

function parseCsv(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const list = (v) => (v ? v.split('|').map((x) => x.trim()).filter(Boolean) : []);
const today = new Date().toISOString().slice(0, 10);
let created = 0, updated = 0;
for (const r of parseCsv(fs.readFileSync(file, 'utf8'))) {
  const dir = path.join('content', 'slots', r.provider);
  fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, `${r.slug}.json`);
  const data = {
    slug: r.slug, name: r.name, provider: r.provider, rtp: Number(r.rtp),
    ...(r.rtpVariants ? { rtpVariants: list(r.rtpVariants).map(Number) } : {}),
    volatility: r.volatility, maxWin: Number(r.maxWin), releaseDate: r.releaseDate, reels: r.reels, paylines: r.paylines,
    mechanics: list(r.mechanics), themes: list(r.themes), demoUrl: r.demoUrl || null,
  };
  if (fs.existsSync(fp) && !overwrite) {
    const cur = JSON.parse(fs.readFileSync(fp, 'utf8'));
    fs.writeFileSync(fp, JSON.stringify({ ...cur, ...data, updatedAt: today }, null, 2) + '\n');
    updated++;
  } else {
    fs.writeFileSync(fp, JSON.stringify({ ...data, features: [], review: 'TODO: original review after demo play.', pros: [], cons: [], related: [], image: null, sources: ['Provider game sheet'], verified: false, lastVerified: null, updatedAt: today, author: 'editorial-team' }, null, 2) + '\n');
    created++;
  }
}
console.log(`Imported: ${created} created, ${updated} updated. Run "npm run validate -- --verbose" next.`);
