import { ImageResponse } from 'next/og';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getProvider, getSlot } from '@/lib/data';
import { fmtRtp, fmtX, volLabel } from '@/lib/format';
import { SITE } from '@/lib/config';

/** 1200x630 share card per slot (art + RTP / volatility / max win). Built on first request, then cached. */
export const runtime = 'nodejs';
export const dynamicParams = true;
export const revalidate = 604800;
export function generateStaticParams() {
  return [];
}

async function artDataUrl(image: string | null | undefined, origin: string) {
  if (!image) return null;
  try {
    // public/ is served by the CDN, not bundled with functions: fetch the art over HTTP, local disk as fallback.
    let buf: Buffer;
    try {
      const r = await fetch(`${origin}${image}`, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) throw new Error(String(r.status));
      buf = Buffer.from(await r.arrayBuffer());
    } catch {
      buf = await fs.readFile(path.join(process.cwd(), 'public', image));
    }
    const png = await sharp(buf).resize(720, 540, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ provider: string; slot: string }> }) {
  const { provider, slot } = await params;
  const s = getSlot(provider, slot);
  if (!s) return new Response('Not found', { status: 404 });
  const p = getProvider(s.provider);
  const art = await artDataUrl(s.image, SITE.url);
  const stats: [string, string][] = [['RTP', fmtRtp(s.rtp)], ['Volatility', volLabel(s.volatility)], ['Max win', fmtX(s.maxWin)]];
  const nameSize = s.name.length > 26 ? 52 : s.name.length > 18 ? 62 : 72;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #0b0f17 0%, #161d2b 100%)', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 600, padding: 40 }}>
          {art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} width={520} height={390} style={{ borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} alt="" />
          ) : (
            <div style={{ width: 520, height: 390, borderRadius: 24, background: '#1f2937' }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '40px 56px 40px 8px' }}>
          <div style={{ fontSize: 26, color: '#f5b82e', fontWeight: 700, letterSpacing: 1 }}>{(p?.name ?? s.provider).toUpperCase()}</div>
          <div style={{ fontSize: nameSize, fontWeight: 800, lineHeight: 1.05, marginTop: 10 }}>{s.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 32, gap: 12 }}>
            {stats.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,.07)', borderRadius: 14, padding: '12px 20px' }}>
                <span style={{ fontSize: 24, color: '#9ca3af' }}>{k}</span>
                <span style={{ fontSize: 30, fontWeight: 800 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: 30, fontSize: 24, color: '#d1d5db' }}>
            <span style={{ color: '#f5b82e', fontWeight: 800, marginRight: 10 }}>Scatter Drop</span>· Free demo & review
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' } },
  );
}
