'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export type FinderSlot = { n: string; u: string; p: string; img: string | null; rtp: number | null; vol: string | null; mw: number | null; m: string[]; t: string[]; r: number; demo: boolean };

const SWING: Record<string, { label: string; vols: string[] }> = {
  any: { label: 'No preference', vols: [] },
  steady: { label: 'Steady – frequent smaller wins', vols: ['low', 'medium-low', 'medium'] },
  balanced: { label: 'Balanced', vols: ['medium-high', 'high'] },
  big: { label: 'Big swings – rare but huge wins', vols: ['very-high'] },
};
const FEATURE: Record<string, { label: string; m: string[] }> = {
  any: { label: 'Surprise me', m: [] },
  fs: { label: 'Free spins with multipliers', m: ['free-spins'] },
  hold: { label: 'Hold & win / jackpots', m: ['hold-and-win', 'jackpot', 'money-collect'] },
  ways: { label: 'Megaways & ways', m: ['megaways', 'ways', 'xways'] },
  cluster: { label: 'Cluster & pay-anywhere tumbles', m: ['cluster-pays', 'pay-anywhere', 'tumble', 'cascades'] },
  simple: { label: 'Classic & simple', m: [] },
};
const VOL: Record<string, string> = { low: 'Low', 'medium-low': 'Medium-low', medium: 'Medium', 'medium-high': 'Medium-high', high: 'High', 'very-high': 'Very high' };

/** Three questions -> matching slots from the database, best rated first. */
export function SlotFinder({ slots, themes }: { slots: FinderSlot[]; themes: string[] }) {
  const [swing, setSwing] = useState('any');
  const [feat, setFeat] = useState('any');
  const [theme, setTheme] = useState('');
  const [highRtp, setHighRtp] = useState(false);
  const [demoOnly, setDemoOnly] = useState(true);

  const list = useMemo(() => {
    const vols = SWING[swing].vols, ms = FEATURE[feat].m;
    return slots.filter((s) =>
      (!vols.length || (s.vol && vols.includes(s.vol))) &&
      (feat === 'simple' ? s.m.length <= 3 && !s.m.some((x) => ['megaways', 'cluster-pays', 'hold-and-win', 'bonus-buy'].includes(x)) : !ms.length || s.m.some((x) => ms.includes(x))) &&
      (!theme || s.t.includes(theme)) && (!highRtp || (s.rtp ?? 0) >= 96.5) && (!demoOnly || s.demo),
    ).sort((a, b) => b.r - a.r || (b.rtp ?? 0) - (a.rtp ?? 0)).slice(0, 12);
  }, [slots, swing, feat, theme, highRtp, demoOnly]);

  return (
    <div className="finder">
      <fieldset className="finder-q"><legend>1. How do you like your wins?</legend>
        <div className="finder-opts">{Object.entries(SWING).map(([k, v]) => <button key={k} type="button" aria-pressed={swing === k} className={swing === k ? 'on' : ''} onClick={() => setSwing(k)}>{v.label}</button>)}</div>
      </fieldset>
      <fieldset className="finder-q"><legend>2. Favourite kind of feature?</legend>
        <div className="finder-opts">{Object.entries(FEATURE).map(([k, v]) => <button key={k} type="button" aria-pressed={feat === k} className={feat === k ? 'on' : ''} onClick={() => setFeat(k)}>{v.label}</button>)}</div>
      </fieldset>
      <fieldset className="finder-q"><legend>3. Theme and extras</legend>
        <div className="finder-extra">
          <select value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="Theme"><option value="">Any theme</option>{themes.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1).replace('-', ' ')}</option>)}</select>
          <label><input type="checkbox" checked={highRtp} onChange={(e) => setHighRtp(e.target.checked)} /> RTP 96.5% or higher</label>
          <label><input type="checkbox" checked={demoOnly} onChange={(e) => setDemoOnly(e.target.checked)} /> Playable demo on this site</label>
        </div>
      </fieldset>
      <h2 className="finder-h">{list.length ? `Your top ${list.length} matches` : 'No exact matches – try loosening a filter'}</h2>
      <ul className="finder-results">
        {list.map((s) => (
          <li key={s.u}>
            <Link href={s.u}>
              {s.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.img} alt="" width={160} height={120} loading="lazy" />
              ) : <span className="finder-noimg" />}
              <span className="finder-name">{s.n}</span>
              <span className="finder-meta">{s.p} · {s.rtp != null ? `${s.rtp.toFixed(2)}% RTP` : 'RTP n/p'}{s.vol ? ` · ${VOL[s.vol]}` : ''}{s.mw ? ` · ${s.mw.toLocaleString('en-US')}x` : ''}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
