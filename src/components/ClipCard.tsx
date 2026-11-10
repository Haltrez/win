'use client';
import { useState } from 'react';
import type { Clip } from '@/lib/wins';

/** Streamer clip: nothing loads from YouTube/Twitch until the visitor presses play. Always credits the streamer. */
export function ClipCard({ clip, host }: { clip: Clip; host: string }) {
  const [on, setOn] = useState(false);
  const src = clip.platform === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${clip.videoId}?autoplay=1&rel=0`
    : `https://clips.twitch.tv/embed?clip=${clip.videoId}&parent=${host}&autoplay=true`;
  return (
    <figure className="clip">
      <div className="clip-frame">
        {on ? (
          <iframe src={src} title={clip.title} allow="autoplay; encrypted-media; fullscreen" allowFullScreen loading="lazy" />
        ) : (
          <button type="button" className="clip-play" onClick={() => setOn(true)} aria-label={`Play clip: ${clip.title}`}
            style={clip.platform === 'youtube' ? { backgroundImage: `url(https://i.ytimg.com/vi/${clip.videoId}/hqdefault.jpg)` } : undefined}>
            <span className="demo-cta"><span className="demo-play" aria-hidden /> Watch clip</span>
          </button>
        )}
      </div>
      <figcaption>
        <strong>{clip.title}</strong>
        <span className="muted small">Clip by <a href={clip.channelUrl} target="_blank" rel="noopener">{clip.streamer}</a>, shown with permission{clip.winX ? ` · ${clip.winX.toLocaleString('en-US')}x win` : ''}</span>
      </figcaption>
    </figure>
  );
}
