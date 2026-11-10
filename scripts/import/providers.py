"""One adapter per provider: list_games() and fetch(key) -> normalised game dict.

Normalised game dict keys (None when the provider does not publish a value – never guess):
  provider, key, name, rtp, rtpVariants, rtpSource, volatility, volatilityRaw, maxWin, releaseDate,
  releaseDatePrecision, reels, winType, hitRate, bonusRate, demoUrl, image, imageBias, sources, text, skip
"""
from __future__ import annotations

import json
import re

from common import clean_name, fetch, int_x, meta, num, text_of

VOL_WORD = {
    'low': 'low', 'low-medium': 'medium-low', 'medium-low': 'medium-low', 'medium low': 'medium-low',
    'medium': 'medium', 'medium-high': 'medium-high', 'medium high': 'medium-high', 'high': 'high',
    'very high': 'very-high', 'very-high': 'very-high', 'extreme': 'very-high', 'insane': 'very-high',
}
VOL_5 = {1: 'low', 2: 'medium-low', 3: 'medium', 4: 'high', 5: 'very-high'}


def base(provider: str, key: str, name: str) -> dict:
    return {
        'provider': provider, 'key': key, 'name': clean_name(name), 'rtp': None, 'rtpVariants': [], 'rtpSource': None,
        'volatility': None, 'volatilityRaw': None, 'maxWin': None, 'releaseDate': None, 'releaseDatePrecision': None,
        'reels': None, 'winType': None, 'hitRate': None, 'bonusRate': None, 'demoUrl': None, 'image': None,
        'imageBias': 0.3, 'sources': [], 'text': '', 'skip': None,
    }


def sitemap_urls(url: str, pattern: str) -> list[tuple[str, str | None]]:
    xml = fetch(url)
    out = []
    for block in re.findall(r'<url>(.*?)</url>', xml, re.S):
        loc = re.search(r'<loc>([^<]+)</loc>', block)
        lm = re.search(r'<lastmod>([^<]+)</lastmod>', block)
        if loc and re.search(pattern, loc.group(1)):
            out.append((loc.group(1).strip(), lm.group(1)[:10] if lm else None))
    return out


# ------------------------------------------------------------------ Pragmatic Play
class Pragmatic:
    id = 'pragmatic-play'

    def list_games(self):
        idx = fetch('https://www.pragmaticplay.com/sitemap_index.xml')
        maps = re.findall(r'<loc>([^<]*games-sitemap\d*\.xml)</loc>', idx)
        games = []
        for m in maps:
            games += [(re.search(r'/games/([^/]+)/?$', u).group(1), u, lm) for u, lm in sitemap_urls(m, r'/en/games/[^/]+/?$')]
        return games

    def fetch(self, key):
        url = f'https://www.pragmaticplay.com/en/games/{key}/'
        page = fetch(url)
        t = text_of(page)
        title = meta(page, 'og:title') or key
        g = base(self.id, key, re.sub(r'\s*(Slot Demo|Slot|Videoslot)?\s*(\||by|from)?\s*Pragmatic Play.*$', '', title))
        sym = re.search(r'gameSymbol=([a-z0-9_]+)', page)
        if not sym:
            g['skip'] = 'no demo symbol (not a slot or not released)'
            return g
        g['rtp'] = num((re.search(r'RTP: \| ([\d.,]+)\s*%', t) or [None, None])[1])
        vol = re.search(r'Volatility: \| ([A-Za-z -]+?) \|', t)
        if vol:
            g['volatilityRaw'] = vol.group(1).strip()
            g['volatility'] = VOL_WORD.get(g['volatilityRaw'].lower())
        # Max win: only when every "Nx" max-win statement on the page agrees.
        wins = {int_x(x) for x in re.findall(r'max(?:imum)?\.? win(?: potential)?(?: of)?(?: up to)?:?\s*\|?\s*([\d,. ]+)\s*x', t, re.I)}
        wins = {w for w in wins if w and w >= 50}
        g['maxWin'] = wins.pop() if len(wins) == 1 else None
        img = meta(page, 'og:image') or ''
        d = re.search(r'/uploads/(\d{4})/(\d{2})/', img)
        if d:
            g['releaseDate'], g['releaseDatePrecision'] = f'{d.group(1)}-{d.group(2)}-01', 'month'
        g['demoUrl'] = f'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol={sym.group(1)}&lang=en&cur=USD&jurisdiction=99'
        g['image'] = f'https://common-static.ppgames.net/game_pic/rec/325/{sym.group(1)}.png'
        g['imageFallback'] = img or None
        g['imageBias'] = 0.5
        g['sources'] = [url]
        i = t.find('Back to Games')
        g['text'] = t[max(0, i):i + 3500]
        return g


# ------------------------------------------------------------------ BGaming
class BGaming:
    id = 'bgaming'

    def list_games(self):
        idx = fetch('https://bgaming.com/sitemap.xml')
        maps = [u for u in re.findall(r'<loc>([^<]+)</loc>', idx) if 'game' in u] or ['https://bgaming.com/sitemap.xml']
        out = []
        for m in maps:
            out += [(re.search(r'/games/([^/?#]+)', u).group(1), u, lm) for u, lm in sitemap_urls(m, r'/games/[^/]+/?$')]
        return out

    def fetch(self, key):
        url = f'https://bgaming.com/games/{key}'
        page = fetch(url)
        t = text_of(page)
        g = base(self.id, key, (meta(page, 'og:title') or key).split('|')[0])
        i = t.find('| Details |')
        seg = t[i + 11: i + 900] if i >= 0 else ''
        seg = seg.split('Real-Time')[0].split('PLAY DEMO')[0]
        tok = [x.strip() for x in seg.split('|') if x.strip()]
        keys = {'Game Type', 'Hit Rate', 'Lines', 'Max.multiplier', 'Volatility', 'Max Win', 'ID', 'RTP', 'Release Date', 'FS Rate', 'Bonus Rate'}
        d, cur = {}, None
        for x in tok:
            if x in keys:
                cur = x
                d[cur] = ''
            elif cur:
                d[cur] = (d[cur] + ' ' + x).strip()
        if d.get('Game Type', '').lower() not in ('slots', 'slot', ''):
            g['skip'] = f"not a slot ({d.get('Game Type')})"
        g['rtp'] = num(d.get('RTP'))
        g['volatilityRaw'] = d.get('Volatility')
        g['volatility'] = VOL_WORD.get((d.get('Volatility') or '').strip().lower())
        g['maxWin'] = int_x(d.get('Max.multiplier'))
        g['hitRate'] = num(d.get('Hit Rate'))
        g['bonusRate'] = num(d.get('FS Rate') or d.get('Bonus Rate'))
        if d.get('Lines'):
            g['winType'] = f"{d['Lines']} paylines" if re.fullmatch(r'\d+', d['Lines']) else d['Lines']
        if d.get('Release Date'):
            import datetime
            try:
                g['releaseDate'] = datetime.datetime.strptime(d['Release Date'], '%b %d, %Y').strftime('%Y-%m-%d')
                g['releaseDatePrecision'] = 'day'
            except ValueError:
                pass
        demo = re.search(r'https://demo\.bgaming-network\.com/play/([A-Za-z0-9_]+)/FUN', page)
        gid = d.get('ID') or (demo.group(1) if demo else None)
        if not gid:
            g['skip'] = g['skip'] or 'no demo ID'
        g['demoUrl'] = f'https://demo.bgaming-network.com/play/{gid}/FUN?server=demo' if gid else None
        g['image'] = meta(page, 'og:image')
        g['sources'] = [url]
        g['text'] = t[: max(i, 0)][-3500:] + t[i: i + 2500] if i >= 0 else t[:4000]
        return g


# ------------------------------------------------------------------ Hacksaw Gaming
class Hacksaw:
    id = 'hacksaw-gaming'

    def list_games(self):
        page = fetch('https://www.hacksawgaming.com/games')
        keys = sorted(set(re.findall(r'href="/games/([^"/?#]+)"', page)))
        return [(k, f'https://www.hacksawgaming.com/games/{k}', None) for k in keys]

    def fetch(self, key):
        url = f'https://www.hacksawgaming.com/games/{key}'
        page = fetch(url)
        t = text_of(page)
        title = re.search(r'<title>([^<|]+)', page)
        g = base(self.id, key, title.group(1) if title else key)
        gid = re.search(r'data-gameid="(\d+)"', page)
        if not gid:
            g['skip'] = 'no game id'
            return g
        gid = gid.group(1)
        gi = page.find('GAME DATA')
        gd = None
        if gi >= 0:
            seg = re.sub(r'<[^>]+>', '', page[gi + 9: gi + 4000])
            seg = re.sub(r'\s+', ' ', __import__('html').unescape(seg)).split('©')[0]
            gd = seg if 'Max win' in seg or 'RTP' in seg else None
        if gd:
            s = gd
            v = re.search(r'Volatility:\s*(\d)\s*/\s*5', s)
            if v:
                g['volatility'], g['volatilityRaw'] = VOL_5.get(int(v.group(1))), f'{v.group(1)}/5'
            w = re.search(r'Wintype:\s*(.+?)\s*(?=Max win|RTP|Volatility|$)', s)
            g['winType'] = w.group(1).strip() if w else None
            m = re.search(r'Max win:\s*([\d,. ]+)x', s)
            g['maxWin'] = int_x(m.group(1)) if m else None
            r = re.search(r'RTP:\s*([\d.;%\s]+)', s)
            if r:
                rtps = [float(x) for x in re.findall(r'\d+\.\d+', r.group(1))]
                if rtps:
                    g['rtp'], g['rtpVariants'], g['rtpSource'] = rtps[0], rtps[1:], 'provider'
        else:
            # No GAME DATA block: use the game's own description ("Maxwin: 10, 000x", "Volatility: 3/5").
            m = re.search(r'Maxwin: \| ([\d, ]+)x', t) or re.search(r'max win of ([\d, ]+) times', t, re.I)
            g['maxWin'] = int_x(m.group(1)) if m else None
            v = re.search(r'Volatility: \| (\d)\s*/\s*5', t)
            if v:
                g['volatility'], g['volatilityRaw'] = VOL_5.get(int(v.group(1))), f'{v.group(1)}/5'
        g['demoUrl'] = (f'https://static-live.hacksawgaming.com/{gid}/{{version}}/index.html?language=en&channel=desktop&gameid={gid}'
                        '&mode=2&token=demo&currency=EUR&partner=demo&env=https%3A%2F%2Frgs-demo.hacksawgaming.com%2Fapi'
                        '&realmoneyenv=https%3A%2F%2Frgs-demo.hacksawgaming.com%2Fapi')
        g['image'] = f'https://www-live.hacksawgaming.com/casino_thumbnails/{gid}.jpg'
        g['sources'] = [url]
        g['gameId'] = gid
        i = t.find(g['name'])
        g['text'] = t[max(0, i): i + 4000]
        if g['maxWin'] is None:
            g['skip'] = 'no official max win published'
        return g


# ------------------------------------------------------------------ Nolimit City
NLC_VOL = lambda x: None if x is None else 'medium' if x < 9.9 else 'high' if x < 17.3 else 'very-high'
NLC_LABEL = lambda x: None if x is None else 'Medium' if x < 9.9 else 'High' if x < 17.3 else 'Extreme' if x < 27.3 else 'Insane'


class Nolimit:
    id = 'nolimit-city'

    def list_games(self):
        idx = fetch('https://nolimitcity.com/sitemap.xml')
        maps = re.findall(r'<loc>([^<]+)</loc>', idx)
        out = []
        for m in maps:
            out += [(re.search(r'/games/([^/?#]+)', u).group(1), u, lm) for u, lm in sitemap_urls(m, r'/games/[^/]+/?$')]
        return out

    def fetch(self, key):
        url = f'https://nolimitcity.com/games/{key}'
        page = fetch(url)
        d = json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', page, re.S).group(1))
        q = d['props']['pageProps']['initialState']['cmsApi']['queries']
        gd = [v['data'] for v in q.values() if isinstance(v.get('data'), dict) and 'math' in v['data']][0]
        g = base(self.id, key, gd['name'])
        m = gd.get('math') or {}
        if gd.get('vertical') != 'slots' or not m.get('rtp'):
            g['skip'] = 'not a released slot with published maths'
        g['rtp'] = m.get('rtp')
        g['volatility'] = NLC_VOL(m.get('volatility'))
        g['volatilityRaw'] = NLC_LABEL(m.get('volatility'))
        g['maxWin'] = int_x(str(m.get('maxPayout') or ''))
        g['hitRate'] = round(100 / float(m['hitFrequency']), 2) if m.get('hitFrequency') else None
        g['releaseDate'] = (gd.get('releaseDate') or '')[:10] or None
        g['releaseDatePrecision'] = 'day' if g['releaseDate'] else None
        rr = (gd.get('information') or {}).get('rowsReels') or ''
        nums = re.findall(r'\d+', rr)
        if len(nums) >= 3 and 'up to' not in rr:
            g['reels'] = f'{len(nums)}x{nums[0]}' if len(set(nums)) == 1 else '-'.join(nums)
        g['xMechanics'] = [x['name'] for x in gd.get('xMechanics') or []]
        g['bonusBuy'] = bool(gd.get('hasBonusBuy'))
        g['demoUrl'] = f"https://demo.nolimitcdn.com/loader/game-loader.html?operator=FANPAGE_DEMO&game={gd['tableId']}&language=en&device=desktop"
        g['image'] = (gd.get('icon') or {}).get('url')
        g['sources'] = [url]
        feats = ' / '.join(f"{f['name']}: {re.sub(r'\s+', ' ', f.get('description') or '')}" for f in gd.get('features') or [] if 'Bonus Buy' not in f['name'])
        g['text'] = (gd.get('description') or '') + '\n' + feats[:3500]
        return g


# ------------------------------------------------------------------ Thunderkick
class Thunderkick:
    id = 'thunderkick'

    def list_games(self):
        return [(u.rstrip('/').rsplit('/', 1)[1], u, lm) for u, lm in sitemap_urls('https://www.thunderkick.com/games-sitemap.xml', r'/games/[^/]+/?$')]

    def fetch(self, key):
        import html as H
        url = f'https://www.thunderkick.com/games/{key}/'
        page = fetch(url)
        t = text_of(page)
        g = base(self.id, key, (re.search(r'<title>([^<]*)</title>', page) or [None, key])[1].replace(' - Thunderkick', ''))
        gd = t.find('| Game details')
        if gd < 0:
            g['skip'] = 'no public game details (client-area only)'
            return g
        parts = [p.strip() for p in t[gd + 15: t.find('| Share:', gd)].split('|') if p.strip()]
        kv = {parts[i].lower(): parts[i + 1] for i in range(0, len(parts) - 1, 2)}
        r = re.findall(r'\d+[.,]\d+|\d+', kv.get('rtp', ''))
        g['rtp'] = float(r[-1].replace(',', '.')) if r else None
        g['volatilityRaw'] = kv.get('volatility')
        g['volatility'] = VOL_WORD.get((kv.get('volatility') or '').lower())
        g['maxWin'] = int_x(kv.get('max exposure'))
        reels = kv.get('reels') or kv.get('rees')
        g['reels'] = f'{reels} reels' if reels and re.fullmatch(r'\d+', reels) else None
        for k, lab in [('pay lines', 'paylines'), ('paylines', 'paylines'), ('pay ways', 'ways'), ('connecting pay ways', 'connecting ways'), ('cluster pay', 'cluster')]:
            if k in kv:
                v = kv[k]
                cm = re.match(r'^(\d+)\s*(\+|or more)$', v)
                g['winType'] = f'Cluster pays ({cm.group(1)}+ symbols)' if cm else (f'{v} {lab}' if re.fullmatch(r'[\d ,]+', v) else v)
                break
        dm = re.search(r"data-play-game='([^']+)'", page)
        demo = json.loads(H.unescape(dm.group(1))).get('d') if dm else None
        g['demoUrl'] = H.unescape(demo) if demo and 'forfun.thunderkick.com' in demo else None
        g['image'] = meta(page, 'og:image')
        g['imageBias'] = 0.5
        g['sources'] = [url]
        pg = t.find('| Play Game | X |')
        g['text'] = t[pg + 16: gd] if pg > 0 else t[:3000]
        if 'heads will roll' in g['name'].lower() or 'crash' in g['text'].lower()[:400]:
            g['skip'] = 'not a slot'
        return g


ADAPTERS = {a.id: a for a in (Pragmatic(), BGaming(), Hacksaw(), Nolimit(), Thunderkick())}
