#!/usr/bin/env python3
"""Re-check official data for slots already on the site and report differences (data drift).

  python3 scripts/import/recheck.py --per-provider 15          # oldest lastVerified first
  python3 scripts/import/recheck.py --per-provider 15 --apply  # also write the changes + bump lastVerified

Only RTP, RTP variants, volatility, max win and demo availability are compared. With --apply, provider values
replace ours and lastVerified/updatedAt are set to today; slots whose source page is gone are only reported.
Review text is never changed automatically – if a number in the review text changed, fix the wording by hand.
"""
from __future__ import annotations

import argparse
import datetime
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import CONTENT, ROOT  # noqa: E402
from providers import ADAPTERS  # noqa: E402

KEY_FROM_SOURCE = {
    'pragmatic-play': r'pragmaticplay\.com/en/games/([^/]+)',
    'bgaming': r'bgaming\.com/games/([^/?#]+)',
    'hacksaw-gaming': r'hacksawgaming\.com/games/([^/?#]+)',
    'nolimit-city': r'nolimitcity\.com/games/([^/?#]+)',
    'thunderkick': r'thunderkick\.com/games/([^/?#]+)',
}
FIELDS = ('rtp', 'rtpVariants', 'volatility', 'maxWin')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--per-provider', type=int, default=15)
    ap.add_argument('--apply', action='store_true')
    a = ap.parse_args()
    today = datetime.date.today().isoformat()
    report = []
    for pid, pat in KEY_FROM_SOURCE.items():
        files = glob.glob(os.path.join(CONTENT, pid, '*.json'))
        slots = sorted((json.load(open(f)) | {'_f': f} for f in files), key=lambda s: s.get('lastVerified') or '0000')
        for s in slots[: a.per_provider]:
            m = next((re.search(pat, u) for u in s.get('sources', []) if re.search(pat, u)), None)
            key = m.group(1) if m else s['slug']  # seed slots without an official source: try the slug
            try:
                g = ADAPTERS[pid].fetch(key)
                if g.get('skip') and not m:
                    report.append(f'? {pid}/{s["slug"]}: no official page found under /{key} – find the right URL by hand')
                    continue
            except Exception as e:
                report.append(f'? {pid}/{s["slug"]}: source unreachable ({e})')
                continue
            diffs = {}
            for k in FIELDS:
                new = g.get(k) if k != 'rtpVariants' else (g.get(k) or None)
                old = s.get(k) if k != 'rtpVariants' else (s.get(k) or None)
                # Hacksaw: keep third-party RTP labelled as such unless Hacksaw now publishes one
                if k == 'rtp' and new is None and s.get('rtpSource') == 'third-party':
                    continue
                if new is None and old is not None and k in ('volatility', 'maxWin', 'rtpVariants'):
                    continue  # provider page no longer states it – don't delete our sourced value silently
                if new != old:
                    diffs[k] = (old, new)
            if bool(g.get('demoUrl')) != bool(s.get('demoUrl')) and pid != 'hacksaw-gaming':
                diffs['demo'] = (bool(s.get('demoUrl')), bool(g.get('demoUrl')))
            if diffs:
                report.append(f'≠ {pid}/{s["slug"]}: ' + ', '.join(f'{k} {o} → {n}' for k, (o, n) in diffs.items()))
            if a.apply:
                f = s.pop('_f')
                for k, (o, n) in diffs.items():
                    if k in FIELDS:
                        if k == 'rtpVariants':
                            s.pop('rtpVariants', None) if not n else s.__setitem__('rtpVariants', n)
                        else:
                            s[k] = n
                        if k == 'rtp' and n is not None and g.get('rtpSource') == 'provider':
                            s.pop('rtpSource', None)
                            s['verified'] = True
                if not m and g.get('sources'):
                    s['sources'] = g['sources']  # seed slot now verified against the official page
                    s['verified'] = s.get('rtpSource') != 'third-party'
                s['lastVerified'] = today
                if diffs:
                    s['updatedAt'] = today
                with open(f, 'w') as fh:
                    json.dump(s, fh, indent=2, ensure_ascii=False)
                    fh.write('\n')
    print('\n'.join(report) or 'no differences found')


if __name__ == '__main__':
    main()
