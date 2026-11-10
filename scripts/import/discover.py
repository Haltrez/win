#!/usr/bin/env python3
"""Find games on official provider sites that are not on Scatter Drop yet, and save their official data.

  python3 scripts/import/discover.py                      # all providers, up to 8 new games each
  python3 scripts/import/discover.py --providers hacksaw-gaming,bgaming --max 5

Writes .import/candidates.json (gitignored). Games that can't be imported (no official max win, not a slot,
not released, robots-blocked …) are recorded in content/import-skip.json so they are not re-fetched every week.
Remove an entry from that file to have it checked again.
"""
from __future__ import annotations

import argparse
import re
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import ROOT, Blocked, existing, norm, slugify  # noqa: E402
from providers import ADAPTERS  # noqa: E402

SKIP_FILE = os.path.join(ROOT, 'content', 'import-skip.json')
OUT_DIR = os.path.join(ROOT, '.import')


# Marketing-style page titles that some providers use for game pages ("X - Free Demo & Slot Review", "X by BGaming").
NAME_NOISE = [
    r'\s*[-–|:]\s*free demo.*$', r'\s+slot review.*$', r'\s+(slot\s+)?free demo$', r'\s+by bgaming$',
    r"^open .*? in bgaming's\s+", r'\s*\((?:demo|game sheet)[^)]*\)$',
]


def clean_name(name: str) -> str:
    out = name
    for pat in NAME_NOISE:
        out = re.sub(pat, '', out, flags=re.I).strip()
    return out or name


def demo_key(url: str | None) -> str | None:
    """Provider-side game identity from a demo URL, used to catch renamed duplicates.
    Keeps the path and game-identifying query params; drops session/locale params."""
    if not url:
        return None
    from urllib.parse import parse_qsl, urlsplit
    u = urlsplit(url.lower())
    volatile = {'token', 'lang', 'language', 'cur', 'currency', 'jurisdiction', 'channel', 'device', 'server', 'lobbyurl', 'ccycode', 'country', 'mode', 'practice', 'demo', 'operator', 'pid'}
    q = sorted((k, v) for k, v in parse_qsl(u.query) if k not in volatile)
    return f"{u.netloc}{u.path.rstrip('/')}?{q}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--providers', default=','.join(ADAPTERS))
    ap.add_argument('--max', type=int, default=8, help='max new games per provider')
    ap.add_argument('--out', default=os.path.join(OUT_DIR, 'candidates.json'))
    a = ap.parse_args()

    today = datetime.date.today().isoformat()
    skip = json.load(open(SKIP_FILE)) if os.path.exists(SKIP_FILE) else {}
    idx = existing()
    have_slugs = set(idx['slug'])
    have_demos = {demo_key(x.get('demoUrl')) for x in idx['slug'].values()} - {None}
    found, report = [], {}

    for pid in [p.strip() for p in a.providers.split(',') if p.strip()]:
        ad = ADAPTERS[pid]
        skipped = skip.setdefault(pid, {})
        have = {n for (p, n) in idx['name'] if p == pid}
        try:
            games = ad.list_games()
        except Blocked as e:
            report[pid] = f'robots.txt blocks {e} – provider skipped'
            continue
        except Exception as e:  # site change / outage – report, don't crash the run
            report[pid] = f'listing failed: {e}'
            continue
        # newest first when the sitemap has lastmod
        games.sort(key=lambda g: g[2] or '', reverse=True)
        new = [g for g in games if g[0] not in skipped and slugify(g[0]) not in have_slugs and norm(g[0].replace('-', ' ')) not in have]
        got, checked = 0, 0
        for key, url, _ in new:
            if got >= a.max or checked >= a.max * 4:
                break
            checked += 1
            try:
                g = ad.fetch(key)
            except Blocked:
                skipped[key] = {'reason': 'robots.txt disallows', 'checked': today}
                continue
            except Exception as e:
                print(f'  ! {pid}/{key}: {e}', file=sys.stderr)
                continue
            g['name'] = clean_name(g['name'])
            if demo_key(g.get('demoUrl')) in have_demos:
                skipped[key] = {'reason': 'already on site (same official demo)', 'checked': today}
                continue
            if norm(g['name']) in have or slugify(g['name']) in have_slugs:
                skipped[key] = {'reason': 'already on site (name match)', 'checked': today}
                continue
            if g['releaseDate'] and g['releaseDate'] > today:
                continue  # not released yet – check again next week
            if g['skip']:
                skipped[key] = {'reason': g['skip'], 'checked': today}
                continue
            slug = slugify(g['name'])
            g['slug'] = slug if slug not in have_slugs else f"{slug}-{pid.split('-')[0]}"
            found.append(g)
            have_slugs.add(g['slug'])
            got += 1
        report[pid] = f'{len(games)} listed, {len(new)} not on site, {got} new candidates'

    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    json.dump(found, open(a.out, 'w'), indent=1, ensure_ascii=False)
    json.dump(skip, open(SKIP_FILE, 'w'), indent=1, ensure_ascii=False, sort_keys=True)
    for k, v in report.items():
        print(f'{k}: {v}')
    print(f'\n{len(found)} candidates -> {os.path.relpath(a.out, ROOT)}')
    for g in found:
        print(f"  {g['provider']}/{g['slug']}: {g['name']} | RTP {g['rtp']} | vol {g['volatilityRaw']} | max {g['maxWin']} | {g['releaseDate']}")


if __name__ == '__main__':
    main()
