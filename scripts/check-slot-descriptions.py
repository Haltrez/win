#!/usr/bin/env python3
"""Check content/slot-descriptions.json: length, 'demo' keyword, numbers match official data, no invented experiences."""
import json, glob, re, sys
D = json.load(open('content/slot-descriptions.json'))
S = {}
for f in glob.glob('content/slots/*/*.json'):
    s = json.load(open(f)); S[f"{s['provider']}/{s['slug']}"] = s
BANNED = re.compile(r"\b(guaranteed?|risk[- ]free|sure win|can'?t lose|always wins?|easy money|get rich)\b", re.I)
FAKE = re.compile(r"\b(I|we) (hit|won|landed|got|lost|bagged|scored|cashed)\b|\bmy (last|best|first) (session|spin|win|bonus)\b|\blast night\b", re.I)
bad = 0
seen = {}
for k, d in D.items():
    s = S.get(k); probs = []
    if not s: probs.append('unknown slot')
    else:
        if not (110 <= len(d) <= 158): probs.append(f'length {len(d)}')
        has_demo = bool(s.get('demoUrl') or s.get('demoLink') or s.get('externalUrl'))
        if has_demo and 'demo' not in d.lower(): probs.append("no 'demo'")
        for m in re.findall(r'(\d+(?:\.\d+)?)%', d):
            if s.get('rtp') is None or abs(float(m) - s['rtp']) > 0.001: probs.append(f'RTP {m}% != {s.get("rtp")}')
        for m in re.findall(r'(\d[\d,]*)x\b', d):
            v = int(m.replace(',', ''))
            if v != s.get('maxWin') and not re.search(re.escape(m) + 'x', json.dumps(s)): probs.append(f'{m}x not in data (max {s.get("maxWin")})')
    if BANNED.search(d): probs.append('banned phrase')
    if FAKE.search(d): probs.append('invented experience')
    if d in seen: probs.append(f'duplicate of {seen[d]}')
    seen[d] = k
    if probs: bad += 1; print(f'{k}: {"; ".join(probs)} | {d}')
print(f'{len(D)} descriptions, {bad} with problems, {len(S) - len(D)} slots still without one')
sys.exit(1 if bad else 0)
