'use client';
import { useEffect, useRef, useState } from 'react';
import { DemoCta, isCtaTest, type CtaCasino, type CtaLabels } from './DemoCta';
import { rememberSlot } from './RecentSlots';
import { track } from './Analytics';

/**
 * Click-to-load facade for official provider demos. The iframe (often several MB of game assets)
 * is only requested after an explicit click, which keeps LCP/INP/CLS unaffected on page load.
 * URLs are validated against the provider's allowlisted demo domains at build time (scripts/validate-content.mjs).
 */
/** Interface text; localised pages pass their own (see lib/i18n-dict.ts). */
export type DemoLabels = { play: string; playOn: string; playNamed: string; fullscreen: string; exitFs: string; noDemoTitle: string; noDemoText: string; artAlt: string; iframeTitle: string };
const DEMO_EN: DemoLabels = { play: 'Play free demo', playOn: 'Play free demo on {provider}', playNamed: 'Play {name} demo', fullscreen: '⤢ Full screen', exitFs: 'Exit full screen', noDemoTitle: 'No free demo from {provider} yet', noDemoText: 'We only embed official demos. Read the review below or try a similar slot.', artAlt: '{name} slot by {provider}', iframeTitle: '{name} free demo by {provider}' };

export function DemoEmbed({ name, url, providerName, launchPath, image, cta, externalUrl, t, ctaT, lang }: { t?: Partial<DemoLabels>; ctaT?: Partial<CtaLabels>; lang?: string; externalUrl?: string; name: string; url?: string | null; providerName: string; launchPath: string; image?: string; cta?: { casinos: CtaCasino[]; slotKey: string } }) {
  const L = { ...DEMO_EN, ...t };
  const fill = (s: string) => s.replace('{name}', name).replace('{provider}', providerName);
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
  const remember = () => rememberSlot({ u: launchPath.replace('/api/demo/', '/slots/'), n: name, p: providerName, img: image });
  // Phones: once the Play button scrolls out of view, keep a slim Play bar at the bottom of the screen.
  const [away, setAway] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el || on || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setAway(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [on]);
  const start = () => {
    remember();
    track('demo_play', { slot: cta?.slotKey ?? name });
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    // Templated URLs ({version}, {uuid}) are resolved server-side; plain official URLs load directly.
    const q = new URLSearchParams();
    if (mobile) q.set('channel', 'mobile');
    if (lang) q.set('lang', lang);
    const withLang = (u: string) => (lang ? u.replace(/([?&](?:language|lang)=)en\b/i, `$1${lang}`) : u);
    if (url && url.includes('{')) setSrc(`${launchPath}${q.size ? `?${q}` : ''}`);
    else if (url) setSrc(withLang(mobile ? url.replace('channel=desktop', 'channel=mobile') : url));
    setOn(true);
  };
  if (!url && !externalUrl)
    return (
      <div className="demo demo-empty">
        {image ? <span className="demo-bg" style={{ backgroundImage: `url(${image})` }} aria-hidden /> : null}
        <span className="demo-stage">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="demo-art" src={image} alt={fill(L.artAlt)} width={480} height={360} />
          ) : null}
          <span className="demo-note">
            <strong>{fill(L.noDemoTitle)}</strong>
            <span>{L.noDemoText}</span>
          </span>
        </span>
      </div>
    );
  return (
    <>
    <div className={`demo${on ? ' playing' : ''}${fs === 'fake' ? ' demo-fake-fs' : ''}`} ref={box}>
      {on ? (
        <>
        <iframe src={src ?? undefined} title={fill(L.iframeTitle)} allow="fullscreen; autoplay" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock" />
        <button className="demo-fs" onClick={fullscreen} aria-label={fs === 'off' ? L.fullscreen.replace('⤢ ', '') : L.exitFs}>{fs === 'off' ? L.fullscreen : '✕'}</button>
        {cta?.casinos.length || isCtaTest() ? <DemoCta casinos={cta?.casinos ?? []} slotName={name} slotKey={cta?.slotKey ?? name} t={ctaT} /> : null}
        </>
      ) : (
        externalUrl ? (
          <a className="demo-facade" href={externalUrl} target="_blank" rel="noopener" onClick={remember} aria-label={fill(L.playOn)}>
          {image ? <span className="demo-bg" style={{ backgroundImage: `url(${image})` }} aria-hidden /> : null}
          <span className="demo-stage">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="demo-art" src={image} alt={fill(L.artAlt)} width={480} height={360} />
            ) : null}
            <span className="demo-cta"><span className="demo-play" aria-hidden /> {fill(L.playOn)}</span>
          </span>
          </a>
        ) : (
        <button className="demo-facade" onClick={start} aria-label={fill(L.playNamed)}>
          {image ? <span className="demo-bg" style={{ backgroundImage: `url(${image})` }} aria-hidden /> : null}
          <span className="demo-stage">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="demo-art" src={image} alt={fill(L.artAlt)} width={480} height={360} />
            ) : null}
            <span className="demo-cta"><span className="demo-play" aria-hidden /> {L.play}</span>
          </span>
        </button>
        )
      )}
    </div>
    {!on && away ? (
      externalUrl
        ? <a className="play-bar" href={externalUrl} target="_blank" rel="noopener" onClick={remember}><span className="demo-play" aria-hidden /> {fill(L.playNamed)}</a>
        : <button type="button" className="play-bar" onClick={() => { box.current?.scrollIntoView({ block: 'center' }); start(); }}><span className="demo-play" aria-hidden /> {fill(L.playNamed)}</button>
    ) : null}
    </>
  );
}
