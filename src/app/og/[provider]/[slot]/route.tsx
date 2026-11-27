import { ImageResponse } from 'next/og';
import { getProvider, getSlot } from '@/lib/data';
import { fmtRtp, fmtX } from '@/lib/format';
import { OG, OG_HEADERS, artUrl, ogFonts } from '@/lib/og';

/** 1200x630 share card per slot: the official artwork centred (inside Google's square crop) over a blurred copy. */
export const runtime = 'nodejs';
export const dynamicParams = true;
export const revalidate = 604800;
export function generateStaticParams() {
  return [];
}

export async function GET(_req: Request, { params }: { params: Promise<{ provider: string; slot: string }> }) {
  const { provider, slot } = await params;
  const s = getSlot(provider, slot);
  if (!s) return new Response('Not found', { status: 404 });
  const p = getProvider(s.provider);
  const [art, bg] = await Promise.all([artUrl(s.image, 600, 450), artUrl(s.image, 1200, 630, 28)]);
  const facts = [s.rtp != null ? `RTP ${fmtRtp(s.rtp)}` : '', s.maxWin ? `${fmtX(s.maxWin)} max win` : ''].filter(Boolean).join('  ·  ');

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#0b0d12', color: '#fff', fontFamily: 'Inter' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {bg ? <img src={bg} width={OG.w} height={OG.h} style={{ position: 'absolute', left: 0, top: 0 }} alt="" /> : null}
        <div style={{ position: 'absolute', left: 300, top: 28, width: 600, height: 450, display: 'flex', borderRadius: 26, overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,.65)', border: '2px solid rgba(255,255,255,.14)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {art ? <img src={art} width={600} height={450} alt="" /> : <div style={{ display: 'flex', width: 600, height: 450, background: '#1f2937', alignItems: 'center', justifyContent: 'center', fontSize: 56, fontWeight: 800, fontFamily: 'Sora' }}>{s.name}</div>}
        </div>
        <div style={{ position: 'absolute', left: 300, top: 498, width: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', padding: '12px 26px', borderRadius: 999, background: 'rgba(11,13,18,.88)', border: '1px solid rgba(255,190,60,.45)', fontSize: 30, fontWeight: 800, fontFamily: 'Sora', color: '#ffc23a' }}>{facts || `${p?.name ?? ''} slot`}</div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 22, color: '#e5e7eb', fontWeight: 600 }}>Free demo · scatterdrop.com</div>
        </div>
      </div>
    ),
    { width: OG.w, height: OG.h, headers: OG_HEADERS, fonts: await ogFonts().catch(() => undefined) },
  );
}
