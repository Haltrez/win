#!/usr/bin/env python3
"""Turn discovered candidates + agent-written reviews into slot pages and thumbnails.

  python3 scripts/import/build.py                         # uses .import/candidates.json + .import/reviews.json

reviews.json format (keyed by candidate slug):
{
  "le-example": {
    "review": "Two or three short paragraphs, 90-160 words, written from the official data and description.",
    "features": [{"name": "Feature", "description": "One sentence."}, ...3 items],
    "mechanics": ["paylines", "free-spins"],     # from src/lib/types.ts Mechanic
    "themes": ["western"],                       # from src/lib/types.ts Theme
    "maxWin": 5000, "evidence": "quote from the official page"   # optional override, evidence required
    "skip": "optional reason – do not publish (e.g. brand-safety)"
  }
}
"""
from __future__ import annotations

import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import CONTENT, ROOT, make_thumb, vocab  # noqa: E402

IMPORT = os.path.join(ROOT, '.import')
XMECH = {'xNudge®': 'xnudge', 'xWays®': 'xways', 'xBomb®': 'xbomb', 'xBet®': 'ante-bet', 'Infectious xWays®': 'infectious-wilds'}
NAMES = {'pragmatic-play': 'Pragmatic Play', 'bgaming': 'BGaming', 'hacksaw-gaming': 'Hacksaw Gaming', 'nolimit-city': 'Nolimit City', 'thunderkick': 'Thunderkick'}


def fx(n):
    return f'{n:,}x'


def pros_cons(s, prov):
    P, C = [], []
    r, v, mw = s['rtp'], s['volatility'], s['maxWin']
    if r and r >= 97: P.append(f'Excellent {r:.2f}% RTP – among the highest published')
    elif r and r >= 96.5: P.append(f'Above-average {r:.2f}% RTP')
    if mw and mw >= 15000: P.append(f'Very high {fx(mw)} win ceiling')
    elif mw and mw >= 10000: P.append(f'High {fx(mw)} win ceiling')
    elif mw and mw >= 5000: P.append(f'Solid {fx(mw)} win ceiling')
    if v in ('low', 'medium-low', 'medium'): P.append('Lower volatility suits longer, steadier sessions')
    if 'hold-and-win' in s['mechanics'] or 'jackpot' in s['mechanics']: P.append('Second route to big wins via respins or jackpots')
    if s.get('demoUrl'): P.append('Full game playable in the official free demo')
    if r is None: C.append(f"{prov} doesn't publish the RTP outside the game – check the info screen")
    elif r < 95: C.append(f'Below-average {r:.2f}% published RTP')
    elif r < 96: C.append(f'Slightly below-average {r:.2f}% RTP')
    if s.get('rtpVariants'): C.append(f"Casinos can run versions as low as {min(s['rtpVariants']):.2f}% RTP")
    if v == 'very-high': C.append('Very high volatility – long dry spells are normal')
    elif v == 'high': C.append('High volatility makes sessions swingy')
    elif v is None: C.append(f"{prov} doesn't publish a volatility rating for this game")
    if mw and mw < 2500: C.append(f'Modest {fx(mw)} max win')
    if 'bonus-buy' in s['mechanics']: C.append('Bonus buy is costly and banned in some markets (e.g. Great Britain)')
    C.append('Short-session results can differ widely from the long-term average')
    return P[:3] or ["Data taken from the provider's own game page"], C[:3]


def main():
    cands = {g['slug']: g for g in json.load(open(os.path.join(IMPORT, 'candidates.json')))}
    reviews = json.load(open(os.path.join(IMPORT, 'reviews.json')))
    MECH, THEME = vocab()
    today = datetime.date.today().isoformat()
    wrote, problems = [], []
    for slug, rv in reviews.items():
        g = cands.get(slug)
        if not g:
            problems.append(f'{slug}: no candidate with this slug')
            continue
        if rv.get('skip'):
            continue
        mech = list(dict.fromkeys(rv.get('mechanics', [])))
        for x in g.get('xMechanics', []):
            if XMECH.get(x) and XMECH[x] not in mech: mech.append(XMECH[x])
        if g.get('bonusBuy') and 'bonus-buy' not in mech: mech.append('bonus-buy')
        bad = [m for m in mech if m not in MECH] + [t for t in rv.get('themes', []) if t not in THEME]
        if bad:
            problems.append(f'{slug}: unknown mechanics/themes {bad}')
            continue
        prov = NAMES.get(g['provider'], g['provider'])
        s = {'slug': slug, 'name': g['name'], 'provider': g['provider'], 'rtp': g['rtp']}
        if g.get('rtpSource') == 'third-party': s['rtpSource'] = 'third-party'
        if g.get('rtpVariants'): s['rtpVariants'] = g['rtpVariants']
        # Overrides are allowed only with a verbatim quote from the official source as evidence.
        for k in ('maxWin', 'volatility'):
            if k in rv and not rv.get('evidence'):
                problems.append(f'{slug}: override of {k} needs an "evidence" quote from the official page')
        if problems and problems[-1].startswith(slug):
            continue
        s.update({'volatility': rv.get('volatility', g['volatility']), 'maxWin': rv.get('maxWin', g['maxWin']), 'releaseDate': g['releaseDate']})
        if g['releaseDate']: s['releaseDatePrecision'] = g['releaseDatePrecision'] or 'day'
        for k in ('reels', 'winType', 'hitRate', 'bonusRate'):
            if g.get(k): s[k] = g[k]
        s.update({'mechanics': mech, 'themes': rv.get('themes', []), 'features': rv['features'], 'review': rv['review'].strip()})
        s['demoUrl'] = g['demoUrl']
        P, C = pros_cons(s, prov)
        s['pros'], s['cons'] = P, C
        try:
            s['image'] = make_thumb(g['image'], g['provider'], slug, g.get('imageBias', 0.3))
        except Exception as e:
            if g.get('imageFallback'):
                s['image'] = make_thumb(g['imageFallback'], g['provider'], slug, 0.5)
            else:
                problems.append(f'{slug}: thumbnail failed ({e})')
        s.update({'related': [], 'sources': g['sources'], 'verified': True, 'lastVerified': today, 'updatedAt': today, 'addedAt': today, 'author': 'editorial-team'})
        d = os.path.join(CONTENT, g['provider'])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, f'{slug}.json'), 'w') as f:
            json.dump(s, f, indent=2, ensure_ascii=False)
            f.write('\n')
        wrote.append(f"{g['provider']}/{slug}")
    print(f'wrote {len(wrote)} slots')
    for w in wrote: print('  +', w)
    for p in problems: print('  !', p)
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
