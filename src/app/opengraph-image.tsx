import { ImageResponse } from 'next/og';
import { getSlots } from '@/lib/data';
import { DROP_MARK, OG, artUrl, ogFonts } from '@/lib/og';

/** Default share card (home and pages without their own): a wall of popular slot artwork with the logo centred. */
export const runtime = 'nodejs';
export const alt = 'Scatter Drop: free slot demos, blackjack and roulette';
export const size = { width: OG.w, height: OG.h };
export const contentType = 'image/png';
export const revalidate = 604800;

const PICKS = ['pragmatic-play/gates-of-olympus', 'pragmatic-play/sweet-bonanza', 'hacksaw-gaming/le-bandit', 'nolimit-city/san-quentin-xways', 'pragmatic-play/sugar-rush-1000', 'hacksaw-gaming/wanted-dead-or-a-wild', 'pragmatic-play/big-bass-bonanza', 'nolimit-city/mental', 'pragmatic-play/the-dog-house', 'hacksaw-gaming/le-zeus', 'pragmatic-play/starlight-princess', 'play-n-go/book-of-dead', 'nolimit-city/tombstone-rip', 'pragmatic-play/gates-of-olympus-1000', 'bgaming/elvis-frog-in-vegas'];

export default async function OGImage() {
  const slots = getSlots();
  const picks = PICKS.map((k) => slots.find((s) => `${s.provider}/${s.slug}` === k)).filter((s) => s?.image).slice(0, 15);
  const tiles = await Promise.all(picks.map((s) => artUrl(s!.image, 240, 180)));
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#0b0d12', fontFamily: 'Inter' }}>
        <div style={{ position: 'absolute', left: 0, top: -45, width: 1200, display: 'flex', flexWrap: 'wrap' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {tiles.map((t, i) => (t ? <img key={i} src={t} width={240} height={180} alt="" /> : <div key={i} style={{ display: 'flex', width: 240, height: 180, background: '#161a23' }} />))}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {tiles.slice(0, 5).map((t, i) => (t ? <img key={`r${i}`} src={t} width={240} height={180} alt="" /> : null))}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'rgba(11,13,18,.45)' }} />
        <div style={{ position: 'absolute', left: 315, top: 95, width: 570, height: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 32, background: 'rgba(11,13,18,.95)', border: '2px solid rgba(255,190,60,.45)', boxShadow: '0 30px 80px rgba(0,0,0,.7)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DROP_MARK} width={120} height={140} alt="" />
          <div style={{ display: 'flex', marginTop: 18, fontSize: 76, fontWeight: 800, fontFamily: 'Sora', color: '#fff' }}>Scatter<span style={{ color: '#ffb21a', marginLeft: 18 }}>Drop</span></div>
          <div style={{ display: 'flex', marginTop: 10, fontSize: 30, fontWeight: 600, color: '#e5e7eb' }}>{slots.length} free slot demos</div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts().catch(() => undefined) },
  );
}
