#!/usr/bin/env node
/** Re-checks every YouTube clip in content/clips.json against YouTube oEmbed: still public and embeddable? */
import fs from 'node:fs';
const clips = JSON.parse(fs.readFileSync('content/clips.json', 'utf8')).filter((c) => c.platform === 'youtube');
let bad = 0;
for (const c of clips) {
  const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${c.videoId}&format=json`);
  if (!r.ok) { bad++; console.log(`✖ ${c.id}: HTTP ${r.status} – removed, private or embedding disabled. Delete it from clips.json.`); continue; }
  const d = await r.json();
  console.log(`✔ ${c.id}: ${d.author_name} – ${d.title}`);
}
process.exit(bad ? 1 : 0);
