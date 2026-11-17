"""Apply looked-up volatility / max win values (two independent sources or official) to slot JSON.

Usage: python3 scripts/apply-filled-stats.py result1.json [result2.json ...]
Only fills fields that are currently empty; never overwrites provider data.
"""
import json, sys, pathlib
from urllib.parse import urlparse

VOL = {'low': 'low', 'low-medium': 'medium-low', 'medium-low': 'medium-low', 'medium': 'medium',
       'medium-high': 'medium-high', 'high': 'high', 'very-high': 'very-high'}
OFFICIAL = {'pragmatic-play': 'pragmaticplay.com', 'hacksaw-gaming': 'hacksawgaming.com', 'bgaming': 'bgaming.com',
            'thunderkick': 'thunderkick.com', 'nolimit-city': 'nolimitcity.com', 'wazdan': 'wazdan.com'}

def official(provider, urls):
    dom = OFFICIAL.get(provider)
    return bool(dom) and any(dom in (urlparse(u).netloc or '') for u in urls or [])

root = pathlib.Path(__file__).resolve().parent.parent / 'content' / 'slots'
nv = nm = 0
for path in sys.argv[1:]:
    for r in json.load(open(path)):
        f = root / r['provider'] / f"{r['slug']}.json"
        if not f.exists():
            continue
        s = json.load(open(f))
        changed = False
        v = VOL.get((r.get('volatility') or '').lower())
        if v and not s.get('volatility'):
            s['volatility'] = v
            if not official(r['provider'], r.get('volatilitySources')):
                s['volatilitySource'] = 'third-party'
            changed = True; nv += 1
        mw = r.get('maxWin')
        if isinstance(mw, (int, float)) and mw >= 50 and not s.get('maxWin'):
            s['maxWin'] = int(mw)
            if not official(r['provider'], r.get('maxWinSources')):
                s['maxWinSource'] = 'third-party'
            changed = True; nm += 1
        if changed:
            f.write_text(json.dumps(s, indent=2, ensure_ascii=False) + '\n')
print(f'applied: {nv} volatility, {nm} max win')
