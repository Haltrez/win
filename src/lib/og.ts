import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { SITE } from './config';

/**
 * Share-card helpers. Cards are 1200x630; Google often shows a 1:1 crop from the centre, so everything that matters
 * sits inside the central 630x630 square (x 285..915). The sides only carry blurred artwork.
 */
export const OG = { w: 1200, h: 630, cx0: 285, cx1: 915 } as const;
export const OG_HEADERS = { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' };

async function readArt(image: string): Promise<Buffer> {
  // public/ is served by the CDN, not bundled with functions: fetch over HTTP, local disk as fallback.
  try {
    const r = await fetch(`${SITE.url}${image}`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(String(r.status));
    return Buffer.from(await r.arrayBuffer());
  } catch {
    return fs.readFile(path.join(process.cwd(), 'public', image));
  }
}

/** Slot artwork as a PNG data URL (satori can't decode webp). `blur` > 0 gives a soft background version. */
export async function artUrl(image: string | null | undefined, w: number, h: number, blur = 0): Promise<string | null> {
  if (!image) return null;
  try {
    let img = sharp(await readArt(image)).resize(w, h, { fit: 'cover' });
    if (blur) img = img.blur(blur).modulate({ brightness: 0.55 });
    const buf = blur ? await img.jpeg({ quality: 70 }).toBuffer() : await img.png().toBuffer();
    return `data:image/${blur ? 'jpeg' : 'png'};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

/** The drop mark, for the centre of the home card. */
export const DROP_MARK = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="9 6 46 54"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd83d"/><stop offset=".55" stop-color="#ffa41c"/><stop offset="1" stop-color="#ff5a1f"/></linearGradient></defs><path d="M32 9C32 9 15 29 15 40a17 17 0 0 0 34 0C49 29 32 9 32 9Z" fill="url(#g)"/><ellipse cx="25" cy="34" rx="3.2" ry="6" fill="#fff" opacity=".28" transform="rotate(25 25 34)"/><circle cx="50" cy="15" r="3" fill="#ffc23a"/><circle cx="14" cy="18" r="2.2" fill="#ffc23a"/></svg>').toString('base64')}`;

/** Brand fonts for share cards (Sora 800 for headings, Inter 600 for text), loaded once per instance. */
let fontCache: Promise<{ name: string; data: ArrayBuffer; weight: 600 | 800; style: 'normal' }[]> | null = null;
export function ogFonts() {
  fontCache ??= Promise.all(
    ([['Sora', 'Sora-ExtraBold.ttf', 800], ['Inter', 'Inter-SemiBold.ttf', 600]] as const).map(async ([name, file, weight]) => {
      const buf = await readArt(`/fonts/${file}`);
      return { name, data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, weight, style: 'normal' as const };
    }),
  ).catch((e) => { fontCache = null; throw e; });
  return fontCache;
}
