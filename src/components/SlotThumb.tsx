import Image from 'next/image';
import type { Slot } from '@/lib/types';

/** Deterministic gradient tile used until licensed provider artwork is added (slot.image). */
export function SlotThumb({ slot, priority = false, size = 'card' }: { slot: Slot; priority?: boolean; size?: 'card' | 'hero' }) {
  const w = size === 'hero' ? 640 : 320;
  const h = Math.round(w * 0.75);
  if (slot.image) return <Image src={slot.image} alt={`${slot.name} slot demo`} width={w} height={h} priority={priority} sizes={size === 'hero' ? '(max-width: 768px) 100vw, 640px' : '(max-width: 640px) 50vw, 240px'} className="thumb" />;
  let hash = 0;
  for (const c of slot.slug) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const h1 = hash % 360, h2 = (h1 + 40 + (hash % 80)) % 360;
  return (
    <div className="thumb thumb-gen" style={{ aspectRatio: '4 / 3', background: `linear-gradient(135deg,hsl(${h1} 60% 35%),hsl(${h2} 65% 22%))` }} role="img" aria-label={`${slot.name} slot`}>
      <span>{slot.name}</span>
    </div>
  );
}
