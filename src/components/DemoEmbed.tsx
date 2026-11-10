'use client';
import { useEffect, useRef, useState } from 'react';
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
  // Full screen: the real Fullscreen API where it exists (Android, desktop); iPhone Safari only allows it for <video>,
  // so there we expand the game to fill the viewport instead ("fake" full screen) with a close button.
  const [fs, setFs] = useState<'off' | 'real' | 'fake'>('off');
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement && fs === 'real') setFs('off'); };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => { document.removeEventListener('fullscreenchange', onChange); document.removeEventListener('webkitfullscreenchange', onChange); };
  }, [fs]);
  useEffect(() => {
    if (fs !== 'fake') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFs('off'); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [fs]);
  const fullscreen = async () => {
    const el = box.current as (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void }) | null;
    if (!el) return;
    if (fs !== 'off') {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setFs('off');
      return;
    }
    try {
      if (el.requestFullscreen && document.fullscreenEnabled) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else throw new Error('unsupported');
      setFs('real');
      // Phones: prefer landscape for games (ignored where not allowed).
      (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape').catch(() => {});
    } catch {
      setFs('fake');
    }
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
    <div className={`demo${on ? ' playing' : ''}${fs === 'fake' ? ' demo-fake-fs' : ''}`} ref={box}>
      {on ? (
        <>
        <iframe src={src ?? undefined} title={`${name} free demo by ${providerName}`} allow="fullscreen; autoplay" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock" />
        <button className="demo-fs" onClick={fullscreen} aria-label={fs === 'off' ? `Play ${name} full screen` : 'Exit full screen'}>{fs === 'off' ? '⤢ Full screen' : '✕'}</button>
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
