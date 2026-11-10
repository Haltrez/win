"""Shared helpers for the provider importers (see docs/WEEKLY-AGENT.md).

Rules baked in here:
- Only official provider sources. robots.txt is checked before every host is fetched.
- Polite: one request at a time per host with a short delay.
- Never guess numbers: parsers return None when a value is not published.
"""
from __future__ import annotations

import glob
import html
import io
import json
import os
import re
import time
import urllib.parse
import urllib.request
import urllib.robotparser
from functools import lru_cache

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CONTENT = os.path.join(ROOT, 'content', 'slots')
THUMBS = os.path.join(ROOT, 'public', 'thumbs')
UA = 'Mozilla/5.0 (compatible; ScatterDropImporter/1.0; +https://scatterdrop.com/about)'
ROBOT_AGENTS = ('ClaudeBot', 'ScatterDropImporter', '*')
DELAY = 0.7
_last: dict[str, float] = {}


class Blocked(Exception):
    """robots.txt disallows this URL – never work around it."""


@lru_cache(maxsize=64)
def _robots(origin: str) -> urllib.robotparser.RobotFileParser | None:
    rp = urllib.robotparser.RobotFileParser()
    try:
        req = urllib.request.Request(origin + '/robots.txt', headers={'User-Agent': UA})
        body = urllib.request.urlopen(req, timeout=20).read().decode('utf-8', 'ignore')
        rp.parse(body.splitlines())
        return rp
    except Exception:
        return None  # no robots.txt (or unreachable) -> allowed


def allowed(url: str) -> bool:
    p = urllib.parse.urlsplit(url)
    rp = _robots(f'{p.scheme}://{p.netloc}')
    return rp is None or all(rp.can_fetch(a, url) for a in ROBOT_AGENTS)


def fetch(url: str, binary: bool = False, timeout: int = 40):
    if not allowed(url):
        raise Blocked(url)
    host = urllib.parse.urlsplit(url).netloc
    wait = DELAY - (time.time() - _last.get(host, 0))
    if wait > 0:
        time.sleep(wait)
    req = urllib.request.Request(urllib.parse.quote(url, safe=':/%?=&~+#,;@!$\'()*'), headers={'User-Agent': UA, 'Accept-Language': 'en'})
    data = urllib.request.urlopen(req, timeout=timeout).read()
    _last[host] = time.time()
    return data if binary else data.decode('utf-8', 'ignore')


def text_of(page: str) -> str:
    """Visible text with ' | ' between blocks – easy to regex."""
    s = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', '', page, flags=re.S)
    t = html.unescape(re.sub(r'<[^>]+>', ' | ', s))
    return re.sub(r'(\s*\|\s*)+', ' | ', re.sub(r'[ \t\r\n]+', ' ', t))


def meta(page: str, prop: str) -> str | None:
    m = re.search(r'<meta[^>]+(?:property|name)="' + re.escape(prop) + r'"[^>]+content="([^"]*)"', page)
    return html.unescape(m.group(1)) if m else None


def clean_name(n: str) -> str:
    n = html.unescape(n)
    n = re.sub(r'[™®]', '', n)
    n = re.sub(r'\s*[|–-]\s*(Pragmatic Play|Hacksaw Gaming|BGaming|Thunderkick|Nolimit City)\s*$', '', n)
    n = re.sub(r'^(Play|Try)\s+', '', n)
    n = re.sub(r'\s+(Slot|Slots|Online Slot|Slot Game|Demo)$', '', n, flags=re.I)
    n = re.sub(r'\s+', ' ', n).strip()
    return n


def slugify(n: str) -> str:
    s = n.lower().replace('&', ' and ').replace('’', '').replace("'", '')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def norm(n: str) -> str:
    return re.sub(r'[^a-z0-9]', '', clean_name(n).lower().replace('&', 'and'))


def num(s: str | None) -> float | None:
    if not s:
        return None
    m = re.search(r'\d+(?:[.,]\d+)?', s.replace(' ', ''))
    return float(m.group(0).replace(',', '.')) if m else None


def int_x(s: str | None) -> int | None:
    """'10,000x' / 'x 15000' / '25 000X' -> int."""
    if not s:
        return None
    d = re.sub(r'[^\d]', '', s)
    return int(d) if d else None


def existing() -> dict:
    """Index of slots already on the site: by slug and by (provider, normalised name)."""
    by_slug, by_name = {}, {}
    for f in glob.glob(os.path.join(CONTENT, '*', '*.json')):
        s = json.load(open(f))
        by_slug[s['slug']] = s
        by_name[(s['provider'], norm(s['name']))] = s
    return {'slug': by_slug, 'name': by_name}


def vocab() -> tuple[set[str], set[str]]:
    """Allowed mechanics and themes, read from src/lib/types.ts (single source of truth)."""
    src = open(os.path.join(ROOT, 'src', 'lib', 'types.ts')).read()
    def union(name):
        m = re.search(r'export type ' + name + r' =(.*?);', src, re.S)
        return set(re.findall(r"'([a-z0-9-]+)'", m.group(1)))
    return union('Mechanic'), union('Theme')


# ---------------------------------------------------------------- thumbnails
W, H = 480, 360  # 4:3 cards


def make_thumb(image_url: str, provider: str, slug: str, ybias: float = 0.3) -> str:
    """Download official art and write public/thumbs/<provider>/<slug>.webp (480x360).
    Near-4:3 art is cropped full-bleed; square art is cropped with a top bias (titles sit low);
    very tall/wide art is fitted onto a blurred copy of itself. Transparency is flattened onto the art's own colours."""
    from PIL import Image, ImageEnhance, ImageFilter, ImageStat

    im = Image.open(io.BytesIO(fetch(image_url, binary=True))).convert('RGBA')
    if im.getextrema()[3][0] < 255:
        avg = tuple(int(c * 0.45) for c in ImageStat.Stat(im.convert('RGB'), mask=im.split()[3]).mean)
        base = Image.new('RGB', im.size, avg)
        base.paste(im.convert('RGB'), (0, 0), im.split()[3])
        im = base
    else:
        im = im.convert('RGB')

    def cover(img, yb=0.5):
        r = max(W / img.width, H / img.height)
        img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
        x = (img.width - W) // 2
        y = round((img.height - H) * yb)
        return img.crop((x, y, x + W, y + H))

    a, t = im.width / im.height, W / H
    if 0.85 * t <= a <= 1.45 * t:
        out = cover(im)
    elif 0.9 <= a < 0.85 * t:
        out = cover(im, ybias)
    else:
        bg = ImageEnhance.Brightness(cover(im).filter(ImageFilter.GaussianBlur(20))).enhance(0.5)
        r = min(W / im.width, H / im.height)
        fg = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        bg.paste(fg, ((W - fg.width) // 2, (H - fg.height) // 2))
        out = bg
    d = os.path.join(THUMBS, provider)
    os.makedirs(d, exist_ok=True)
    out.save(os.path.join(d, f'{slug}.webp'), 'WEBP', quality=80, method=6)
    return f'/thumbs/{provider}/{slug}.webp'
