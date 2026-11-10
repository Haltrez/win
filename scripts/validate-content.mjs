#!/usr/bin/env node
/**
 * Content QA gate – runs before every build (npm run build).
 * Fails the build on errors; prints warnings for editorial follow-up.
 *  - required fields / value ranges / controlled vocab
 *  - unique slugs and unique <title> patterns
 *  - demo URLs must be on the provider's allowlisted official demo domains
 *  - related slugs must exist; provider must exist
 *  - review length + near-duplicate detection (anti-thin/anti-spam)
 *  - banned promotional language ("guaranteed", "risk-free", ...)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('content');
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const providers = JSON.parse(fs.readFileSync(path.join(ROOT, 'providers.json'), 'utf8'));
const pmap = new Map(providers.map((p) => [p.slug, p]));
const slots = [];
for (const prov of fs.readdirSync(path.join(ROOT, 'slots'))) {
  const dir = path.join(ROOT, 'slots', prov);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    try {
      const s = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      s.__file = `slots/${prov}/${f}`;
      if (s.provider !== prov) err(`${s.__file}: provider "${s.provider}" does not match folder "${prov}"`);
      if (`${s.slug}.json` !== f) err(`${s.__file}: slug "${s.slug}" does not match filename`);
      slots.push(s);
    } catch (e) { err(`slots/${prov}/${f}: invalid JSON – ${e.message}`); }
  }
}

const VOL = ['low', 'medium-low', 'medium', 'medium-high', 'high', 'very-high'];
const BANNED = /\b(guaranteed?|risk[- ]free|sure win|can'?t lose|always wins?|easy money|get rich)\b/i;
const slugSet = new Set();
const titles = new Set();
const shingles = [];

const shingle = (t) => { const w = t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean); const s = new Set(); for (let i = 0; i < w.length - 4; i++) s.add(w.slice(i, i + 5).join(' ')); return s; };
const jaccard = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };

for (const s of slots) {
  const at = s.__file;
  for (const k of ['slug', 'name', 'provider', 'mechanics', 'themes', 'features', 'review', 'pros', 'cons', 'updatedAt', 'author'])
    if (s[k] === undefined || s[k] === null || s[k] === '') err(`${at}: missing ${k}`);
  if (!('rtp' in s)) err(`${at}: rtp must be present (use null when not published)`);
  if (slugSet.has(s.slug)) err(`${at}: duplicate slug "${s.slug}" (slugs must be globally unique for comparisons/related links)`);
  slugSet.add(s.slug);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug)) err(`${at}: slug must be kebab-case`);
  const p = pmap.get(s.provider);
  if (!p) err(`${at}: unknown provider ${s.provider}`);
  if (s.rtp !== null && (typeof s.rtp !== 'number' || s.rtp < 80 || s.rtp > 99.9)) err(`${at}: rtp out of range (${s.rtp})`);
  if (s.rtpSource === 'third-party' && s.verified) err(`${at}: third-party RTP must not be marked verified`);
  // volatility / maxWin / releaseDate may be null when the provider doesn't publish them – never guess.
  if (s.volatility !== null && !VOL.includes(s.volatility)) err(`${at}: invalid volatility ${s.volatility} (use null if unpublished)`);
  if (s.maxWin !== null && !(s.maxWin > 0)) err(`${at}: maxWin must be > 0 or null`);
  if (s.releaseDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(s.releaseDate)) err(`${at}: releaseDate must be YYYY-MM-DD or null`);
  for (const k of ['volatility', 'maxWin', 'releaseDate']) if (!(k in s)) err(`${at}: ${k} must be present (null if unpublished)`);
  if (s.image && !/^https?:/.test(s.image) && !fs.existsSync(path.join('public', s.image))) err(`${at}: image ${s.image} not found in public/`);
  if (!s.image) warn(`${at}: no thumbnail`);
  if (s.demoUrl) {
    try {
      const host = new URL(s.demoUrl).hostname;
      if (new URL(s.demoUrl).protocol !== 'https:') err(`${at}: demoUrl must be https`);
      if (!p?.demoDomains.some((d) => host === d || host.endsWith('.' + d))) err(`${at}: demoUrl host ${host} is not an allowlisted official demo domain for ${s.provider}`);
    } catch { err(`${at}: demoUrl is not a valid URL`); }
  }
  if (s.demoLink) {
    try {
      const u = new URL(s.demoLink);
      if (u.protocol !== 'https:') err(`${at}: demoLink must be https`);
      if (!p?.demoDomains.some((d) => u.hostname === d || u.hostname.endsWith('.' + d))) err(`${at}: demoLink host ${u.hostname} is not an official domain for ${s.provider}`);
    } catch { err(`${at}: demoLink is not a valid URL`); }
  }
  const words = (s.review || '').split(/\s+/).length;
  if (words < 40) err(`${at}: review too short (${words} words)`);
  else if (words < 120) warn(`${at}: review is ${words} words – aim for 120+ before launch`);
  const allText = [s.review, ...(s.pros || []), ...(s.cons || []), ...(s.features || []).map((f) => f.description)].join(' ');
  if (BANNED.test(allText)) err(`${at}: contains prohibited promotional language: "${allText.match(BANNED)[0]}"`);
  if (!s.verified) warn(`${at}: data not yet verified against provider game sheet`);
  const title = `${s.name}|${s.provider}`;
  if (titles.has(title)) err(`${at}: duplicate title`);
  titles.add(title);
  shingles.push([at, shingle(s.review || '')]);
}
for (const s of slots) for (const r of s.related || []) if (!slugSet.has(r)) err(`${s.__file}: related slot "${r}" not found`);

for (let i = 0; i < shingles.length; i++)
  for (let j = i + 1; j < shingles.length; j++) {
    const sim = jaccard(shingles[i][1], shingles[j][1]);
    if (sim > 0.35) err(`Near-duplicate reviews (${(sim * 100).toFixed(0)}%): ${shingles[i][0]} ↔ ${shingles[j][0]}`);
  }

// Casinos
const casinos = JSON.parse(fs.readFileSync(path.join(ROOT, 'casinos.json'), 'utf8'));
for (const c of casinos) {
  if (!c.terms) err(`casinos/${c.slug}: significant terms are required`);
  if (!c.licenses?.length) err(`casinos/${c.slug}: at least one licence required`);
  if (!c.links?.default) err(`casinos/${c.slug}: links.default required`);
  if (BANNED.test(JSON.stringify(c.bonus))) err(`casinos/${c.slug}: prohibited language in bonus text`);
  if (c.placeholder) warn(`casinos/${c.slug}: PLACEHOLDER partner – replace with a real licensed operator before launch`);
}

// Comparisons
for (const [a, b] of JSON.parse(fs.readFileSync(path.join(ROOT, 'comparisons.json'), 'utf8')))
  for (const x of [a, b]) if (!slugSet.has(x)) err(`comparisons.json: unknown slot ${x}`);

// Guides
for (const f of fs.readdirSync(path.join(ROOT, 'guides')).filter((f) => f.endsWith('.md'))) {
  const t = fs.readFileSync(path.join(ROOT, 'guides', f), 'utf8');
  if (!/^---[\s\S]*?title:[\s\S]*?description:[\s\S]*?---/.test(t)) err(`guides/${f}: frontmatter needs title and description`);
  const body = t.replace(/^---[\s\S]*?---/, '');
  if (BANNED.test(body.replace(/no (guide|strategy)[^.]*guarantee[^.]*\./gi, ''))) warn(`guides/${f}: check wording – "${body.match(BANNED)[0]}"`);
}

const verbose = process.argv.includes('--verbose');
console.log(`Content check: ${slots.length} slots, ${providers.length} providers, ${casinos.length} casinos`);
if (warnings.length) {
  console.log(`⚠ ${warnings.length} warnings${verbose ? '' : ' (run with --verbose to list)'}`);
  if (verbose) warnings.forEach((w) => console.log('  - ' + w));
}
if (errors.length) {
  console.error(`✖ ${errors.length} errors:`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
console.log('✔ No blocking errors');
