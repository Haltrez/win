'use client';
import { useRef, useState } from 'react';

/**
 * Click-to-load facade for official provider demos. The iframe (often several MB of game assets)
 * is only requested after an explicit click, which keeps LCP/INP/CLS unaffected on page load.
 * URLs are validated against the provider's allowlisted demo domains at build time (scripts/validate-content.mjs).
 */
export function DemoEmbed({ name, url, providerName, launchPath, image }: { name: string; url?: string | null; providerName: string; launchPath: string; image?: string }) {
  const [on, setOn] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const fullscreen = () => {
    const el = box.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else el.webkitRequestFullscreen?.();
  };
  const start = () => {
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    // Templated URLs ({version}, {uuid}) are resolved server-side; plain official URLs load directly.
    if (url && url.includes('{')) setSrc(`${launchPath}${mobile ? '?channel=mobile' : ''}`);
    else if (url) setSrc(mobile ? url.replace('channel=desktop', 'channel=mobile') : url);
    setOn(true);
  };
  if (!url)
    return (
      <div className="demo demo-empty">
        <p><strong>Official {name} demo coming soon.</strong></p>
        <p className="muted small">We only embed official demos supplied by {providerName}. Some providers restrict demos in certain countries (for example Great Britain requires age verification).</p>
      </div>
    );
  return (
    <div className={`demo${on ? ' playing' : ''}`} ref={box}>
      {on ? (
        <>
        <iframe src={src ?? undefined} title={`${name} free demo by ${providerName}`} allow="fullscreen; autoplay" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock" />
        <button className="demo-fs" onClick={fullscreen} aria-label={`Play ${name} full screen`}>⤢ Full screen</button>
        </>
      ) : (
        <button className="demo-facade" onClick={start} aria-label={`Play the free ${name} demo`}>
          {image ? <span className="demo-bg" style={{ backgroundImage: `url(${image})` }} aria-hidden /> : null}
          <span className="demo-stage">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="demo-art" src={image} alt="" width={480} height={360} />
            ) : null}
            <span className="demo-cta"><span className="demo-play" aria-hidden /> Play free demo</span>
          </span>
        </button>
      )}
    </div>
  );
}
