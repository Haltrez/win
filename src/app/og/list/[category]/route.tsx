import { ImageResponse } from 'next/og';
import { getCategories, getCategory, getCategorySlots, isIndexable } from '@/lib/categories';
import { OG, OG_HEADERS, artUrl, ogFonts } from '@/lib/og';

/** 1200x630 share card per best-of list: the list's top four slots as a 2x2 collage, centred, with a short label. */
export const runtime = 'nodejs';
export const revalidate = 604800;
export const dynamicParams = true;
export function generateStaticParams() {
  return getCategories().filter(isIndexable).map((c) => ({ category: c.slug }));
}

const LABELS: Record<string, string> = {
  'high-rtp-slots': '96.5%+ RTP',
  '97-rtp-slots': '97%+ RTP',
  'highest-max-win-slots': 'Biggest max wins',
  'best-slots': 'Top-rated slots',
  'new-slots': 'New slots',
};
export const listLabel = (slug: string, title: string) => LABELS[slug] ?? title.replace(/^Slots with /i, '').replace(/^Best /i, '').replace(/ \d{4}$/, '');

export async function GET(_req: Request, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return new Response('Not found', { status: 404 });
  const top = getCategorySlots(c).filter((s) => s.image).slice(0, 4);
  const [bg, ...tiles] = await Promise.all([artUrl(top[0]?.image, 1200, 630, 30), ...top.map((s) => artUrl(s.image, 292, 219))]);
  const label = listLabel(c.slug, c.title);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#0b0d12', color: '#fff', fontFamily: 'Inter' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {bg ? <img src={bg} width={OG.w} height={OG.h} style={{ position: 'absolute', left: 0, top: 0 }} alt="" /> : null}
        <div style={{ position: 'absolute', left: 304, top: 28, width: 592, height: 450, display: 'flex', flexWrap: 'wrap', gap: 8, padding: 0 }}>
          {tiles.map((t, i) => (
            <div key={i} style={{ display: 'flex', width: 292, height: 219, borderRadius: 18, overflow: 'hidden', border: '2px solid rgba(255,255,255,.14)', boxShadow: '0 12px 36px rgba(0,0,0,.55)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {t ? <img src={t} width={292} height={219} alt="" /> : <div style={{ display: 'flex', width: 292, height: 219, background: '#1f2937' }} />}
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 300, top: 498, width: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', padding: '12px 28px', borderRadius: 999, background: 'rgba(11,13,18,.9)', border: '1px solid rgba(255,190,60,.45)', fontSize: label.length > 22 ? 28 : 34, fontWeight: 800, fontFamily: 'Sora', color: '#ffc23a' }}>{label}</div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 22, color: '#e5e7eb', fontWeight: 600 }}>{getCategorySlots(c).length} slots ranked · scatterdrop.com</div>
        </div>
      </div>
    ),
    { width: OG.w, height: OG.h, headers: OG_HEADERS, fonts: await ogFonts().catch(() => undefined) },
  );
}
