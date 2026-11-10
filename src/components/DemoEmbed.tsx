'use client';
import { useRef, useState } from 'react';
import { DemoCta, isCtaTest, type CtaCasino } from './DemoCta';

/**
 * Click-to-load facade for official provider demos. The iframe (often several MB of game assets)
 * is only requested after an explicit click, which keeps LCP/INP/CLS unaffected on page load.
 * URLs are validated against the provider's allowlisted demo domains at build time (scripts/validate-content.mjs).
 */
export function DemoEmbed({ name, url, providerName, launchPath, image, cta, externalUrl }: { externalUrl?: string; name: string; url?: string | null; providerName: string; launchPath: string; image?: string; cta?: { casinos: CtaCasino[]; slotKey: string } }) {
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
  if (!url && !externalUrl)
    return (
      <div className="demo demo-empty">
        {image ? <span className="demo-bg" style={{ backgroundImage: `url(${image})` }} aria-hidden /> : null}
        <span className="demo-stage">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="demo-art" src={image} alt={`${name} slot by ${providerName}`} width={480} height={360} />
          ) : null}
          <span className="demo-note">
            <strong>No free demo from {providerName} yet</strong>
            <span>We only embed official demos. Read the review below or try a similar slot.</span>
          </span>
        </span>
      </div>
    );
  return (
    <>
    <div className={`demo${on ? ' playing' : ''}`} ref={box}>
      {on ? (
        <>
        <iframe src={src ?? undefined} title={`${name} free demo by ${providerName}`} allow="fullscreen; autoplay" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock" />
        <button className="demo-fs" onClick={fullscreen} aria-label={`Play ${name} full screen`}>⤢ Full screen</button>
        </>
      ) : (
        externalUrl ? (
          <a className="demo-facade" href={externalUrl} target="_blank" rel="noopener" aria-label={`Play the free ${name} demo on ${providerName}'s website`}>
          {image ? <span className="demo-bg" style={{ backgroundImage: `url(${image})` }} aria-hidden /> : null}
          <span className="demo-stage">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="demo-art" src={image} alt={`${name} slot by ${providerName}`} width={480} height={360} />
            ) : null}
            <span className="demo-cta"><span className="demo-play" aria-hidden /> Play free demo on {providerName}</span>
          </span>
          </a>
        ) : (
        <button className="demo-facade" onClick={start} aria-label={`Play the free ${name} demo`}>
          {image ? <span className="demo-bg" style={{ backgroundImage: `url(${image})` }} aria-hidden /> : null}
          <span className="demo-stage">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="demo-art" src={image} alt={`${name} slot by ${providerName}`} width={480} height={360} />
            ) : null}
            <span className="demo-cta"><span className="demo-play" aria-hidden /> Play free demo</span>
          </span>
        </button>
        )
      )}
    </div>
    {on && (cta?.casinos.length || isCtaTest()) ? <DemoCta casinos={cta?.casinos ?? []} slotName={name} slotKey={cta?.slotKey ?? name} /> : null}
    </>
  );
}
