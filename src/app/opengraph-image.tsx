import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/config';

export const alt = `${SITE.name} – free slot demos and reviews`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: 'linear-gradient(135deg,#0d1117,#1a2230)', color: '#e8edf4' }}>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#f5b82e' }}>{SITE.name}</div>
        <div style={{ display: 'flex', fontSize: 40, marginTop: 20 }}>{SITE.tagline}</div>
        <div style={{ display: 'flex', fontSize: 28, marginTop: 40, color: '#9aa7b8' }}>18+ · Play responsibly</div>
      </div>
    ),
    size,
  );
}
