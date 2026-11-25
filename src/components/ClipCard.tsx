'use client';
import { useState } from 'react';
import type { Clip } from '@/lib/wins';

/** Streamer clip: nothing loads from YouTube/Twitch until the visitor presses play. Always credits the streamer. */
export function ClipCard({ clip, host, slotName, slotHref, realHref }: { clip: Clip; host: string; slotName?: string; slotHref?: string; realHref?: string }) {
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
        <span className="muted small">Video by <a href={clip.channelUrl} target="_blank" rel="noopener">{clip.streamer}</a>{clip.basis === 'permission' ? ', shown with permission' : ' on YouTube'}{clip.winX ? ` · ${clip.winX.toLocaleString('en-US')}x win` : ''}</span>
        {slotHref || realHref ? (
          <span className="clip-actions">
            {slotHref ? <a className="btn btn-ghost" href={slotHref}>Play {slotName ?? 'the'} demo free</a> : null}
            {realHref ? <a className="btn btn-primary" href={realHref} rel="sponsored nofollow noopener" target="_blank" data-event="affiliate_click">Play {slotName ?? 'it'} for real</a> : null}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
