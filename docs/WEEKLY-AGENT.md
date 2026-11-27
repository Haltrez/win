# Weekly agent playbook

A scheduled Claude Code session runs this every **Monday morning (Europe/Riga)**. It is **fully automatic** (owner
decision, Nov 2026): when every check in step 4 passes, it publishes itself by pushing to the deploy branch, and Vercel
deploys. Only when a check fails does it fall back to a pull request for the owner, so nothing broken goes live.

Follow the steps in order. If a step fails, keep going with the others and explain the failure in the report.

## 0. Setup

```bash
git fetch origin claude/slots-demo-review-site-x1rmh3
git checkout -B weekly/$(date +%F) origin/claude/slots-demo-review-site-x1rmh3
npm ci
pip install Pillow   # only if `python3 -c "import PIL"` fails
```

The deploy branch is `claude/slots-demo-review-site-x1rmh3` (Vercel deploys every push to it).

### This week only (run of 23 Nov 2026) – DONE, applies no longer

The prepared branch already carries **12 guides** (4 US sweepstakes guides + 8 live casino game guides): merge it
first, as always, and **write no new guides in step 3** this week. Pace for the week: 12 prepared + ~10 Spanish +
**~25 slots max** – stop importing at 25. Still run steps 2, 3a, 3c, 3d, 3e, the quality gate, publish and report.
From the run of 30 Nov the normal 3-guide routine applies again.

### Prepared content branch (check every week)

If `origin/claude/next-week-content` exists and is not yet merged into the deploy branch
(`git merge-base --is-ancestor origin/claude/next-week-content HEAD` fails), merge it first:

```bash
git fetch origin claude/next-week-content
git merge --no-edit origin/claude/next-week-content
```

It holds slots and guides already written and checked (Nov 2026: 27 Wazdan slots + 3 guides = 30 pages). They count
towards this week's pace ceiling, so cap fresh imports at the remainder (~20 pages) and skip step 3 if the branch
already ticked guides in `content/topic-queue.md`. Re-run the quality gate after merging. Slots and guides in the
branch have `addedAt`/`publishedAt` dates set when they were prepared; set them to today's date before publishing.

## Publishing pace (owner rule, Nov 2026)

New domain: grow steadily, never in bursts. Hard ceiling for ALL new indexable pages combined (slots + guides + lists): **~50 per week**, and no single day above ~30. If the owner or another session already published this week, count those pages and fill only the remainder. Quality beats volume: every page needs official data and text written for that game – no templated or thin pages, no near-duplicates. If Search Console shows impressions falling after a batch, pause new pages for a week.

**Focus: smaller providers and less-known games** (Wazdan, Thunderkick's back catalogue, smaller BGaming titles) rather than more famous hits that every big site already covers – that's where a new site can rank.

## Weekly mix (owner rule, from 30 Nov 2026)

Depth over breadth. Each week: **~10 new slots** (step 1), **3 guides** (step 3), **2 decision pages** (step 3f),
**30 deepened reviews** (step 3a), ~10 Spanish pages (step 3c). New slots are the part to cut if time runs short;
deepening the most-visited reviews comes first.

## 1. New slots (target: ~10 per week – pick the best candidates, skip the rest for later weeks)

```bash
python3 scripts/import/discover.py --max 12   # 6 providers incl. Wazdan → up to ~70 candidates
```

Read `.import/candidates.json`. For every candidate decide **publish** or **skip**:

- **Skip** (add `"skip": "reason"` in reviews.json) when:
  - the title or theme is explicit, crude, or about a real atrocity or tragedy (brand safety). Also add it to `content/import-skip.json` with the reason.
  - it isn't really a slot (crash, dice, scratch, table game).
  - the official data looks broken (e.g. RTP outside 85–99%, max win of 0).
- **Near-duplicates** (e.g. "25 Coins x3000" next to "36 Coins x3000"): publish only if you can write a review that is genuinely different (grid size, features, jackpot, volatility); otherwise skip with reason "near-duplicate – needs distinct review" (do NOT add to import-skip.json, so it comes back later).
- **Publish**: write `.import/reviews.json` (format in `scripts/import/build.py`). For each game:
  - **Search wording (owner rule, from 16 Nov 2026 – the validator enforces the first three):** players search
    "<name> slot", "<name> demo", "play <name> free", "<name> free spins", "<name> bonus buy", "<name> rtp", "<name> max win".
    So: (1) the first sentence names the game, (2) call it a slot at least once ("<name> slot"), (3) mention the free demo,
    (4) name the provider, (5) use the plain words players use for the mechanics – "free spins", "bonus buy",
    "hold and win", "multipliers", "megaways" – alongside the provider's trademarked names. Still written like a player,
    never a keyword list: each phrase once, where it reads naturally.
  - **review**: two short paragraphs, 90–160 words, original wording. Describe the grid, what the main mechanic actually does, the bonus structure and who the game suits. Base everything on the candidate's `text` and official numbers. **Never invent features or numbers.** Mention RTP and volatility only when the provider publishes them. Don't copy marketing sentences.
  - **features**: exactly 3 `{name, description}` pairs, one sentence each.
  - **mechanics / themes**: only values from `src/lib/types.ts`.
  - `maxWin` / `volatility` overrides are allowed only with an `evidence` quote copied from the official page.
- Banned wording (the validator blocks it): guaranteed, risk-free, sure win, can't lose, easy money, get rich. Write "assured" or "always" for game rules instead.

```bash
python3 scripts/import/build.py
```

Then look at every new thumbnail in `public/thumbs/<provider>/<slug>.webp`. If one is badly cropped (title cut off),
re-run `make_thumb` from `scripts/import/common.py` with a different `ybias` (0 = keep top, 1 = keep bottom).

### Meta descriptions for new slots

For every slot you add, also add an entry to `content/slot-descriptions.json` (key `provider/slug`): one line, 110–158
characters, written like a regular player describing the game to a friend – casual, specific to that game's theme and
features, never a template. Include the word "demo" when the game has one. Any RTP or max-win figure must match the
official data exactly. No invented personal experiences ("I hit…", "my last session") and no promotional claims.
Run `python3 scripts/check-slot-descriptions.py` – it must report 0 problems.

## 2. Data re-check (drift)

```bash
python3 scripts/import/recheck.py --per-provider 15
```

- Apply clear, official changes: `python3 scripts/import/recheck.py --per-provider 15 --apply`. Use `--providers hacksaw-gaming --per-provider 200` to re-check one provider in full.
- If a changed number also appears in the review text (e.g. "rated 4 out of 5"), fix the wording by hand.
- Report "source unreachable / no official page" items in the PR; don't guess replacements.

## 3. Guides: 3 per week – 2 long-tail + 1 broad (owner rule, Nov 2026)

Write two topics from the "Long-tail first" section of `content/topic-queue.md` and one from "Broad topics". All three
count towards the weekly pace ceiling. If the long-tail section runs out,
add new specific topics to it first (from Search Console queries the owner shares, "X vs Y" pairs of sequels on the
site, and data lists only we have).

## 3d. Coming soon list (every week)

Update `content/upcoming.json` (shown as "Coming soon" on /new): slots announced by the studios we cover, with a
release date in the next ~6 weeks. Each entry: `{"name", "provider" (our provider slug), "releaseDate" (YYYY-MM-DD),
"source" (official provider page or press release URL), "note"?}`. Official announcements only – no rumours, no
dates from third-party sites. Remove entries once the game is released (and import it in step 1 if it qualifies).
Not a new page, so it doesn't count towards the pace.

## 3e. Fill missing volatility / max win (~50 slots per week until done)

Pick slots with `volatility` or `maxWin` = null. A value may be filled only when the provider publishes it, or when
**two independent slot databases agree exactly** (sites sharing one data feed, or owned by the same company, count as
one; SlotsLaunch and SlotsMate share a feed). Store third-party values with `"volatilitySource": "third-party"` /
`"maxWinSource": "third-party"` – the page then labels them. Any disagreement → leave null (the page hides the field).
Read individual pages only; skip any site with a bot check or 403. `scripts/apply-filled-stats.py` applies a results
file in the format it documents.

## 3a. Deepen the most-visited reviews (30 per week, 300–400 words each)

Take the next 30 entries from `content/deepen-queue.md` and expand each `review` to **300–400 words**. Pages ranking
for "[game] demo" usually carry this much; ours average ~76 words. Cover, in plain paragraphs:

- what the game is: name in the first sentence, "slot", the free demo, the provider (search-wording rule, step 1);
- how the base game and the bonus actually work: grid, pays, multipliers, how the free spins trigger and retrigger, bonus buy if any;
- the numbers: RTP (and the lower RTP versions if the provider publishes them), volatility, max win – only stored, sourced values;
- who it suits and who it doesn't (session length, bankroll swings), and how it compares with its sequels or siblings on the site (link them);
- one honest downside.

Facts come only from the slot's stored data and its official sources – never invent hit rates, "I played" stories or
win anecdotes. No casino names or bonus offers inside reviews. Update `pros`/`cons` if the longer text shows they're
thin. Set `updatedAt` to today, move the entry to "Done" in the queue file. Edits, not new pages: they don't count
towards the pace ceiling, and they go into the IndexNow list (step 6).

## 3f. Decision pages (2 per week)

Guides written for people who are choosing where to play – the searches that turn into deposits. Write two per week
from this list, top first, then add new ones to the "Decision pages" section of `content/topic-queue.md`:

1. No-wagering casino bonuses explained (what "no wagering" really means, how to check the terms, traps such as max-cashout caps)
2. Instant-withdrawal crypto casinos: how fast payouts actually work (network fees, confirmations, KYC triggers)
3. Online slots in Canada: what's legal by province, Ontario's separate market, how to check a licence
4. Online slots in South Africa: the legal position, payment methods, checking an operator
5. Rakeback vs welcome bonus: which is worth more for a slot player (worked examples with stated assumptions)
6. How to read bonus terms in 5 minutes (wagering, game weighting, max bet, max cashout, expiry)
7. Crypto vs card deposits at casinos: fees, speed, limits

Rules: same guide format and quality gate as step 3. Explain how to judge a casino – **don't name, rank or quote
casinos or their offers in the text**; the existing casino module on the page does that from `content/casinos.json`
(owner-controlled, never edited by this agent). Law and licensing facts only from the regulator's own site, with the
source linked and the check date stated. Always include the responsible-gambling paragraph and link. They count
towards the pace ceiling.

### Guide format (applies to all guides)

For each guide: take the next unchecked topic in its section of `content/topic-queue.md`. Long-tail guides: title = the exact search phrase, answer it in the first paragraph, 500–900 words. Broad guides: take the topic, write `content/guides/<slug>.md` (same front-matter as
existing guides; 600–1,000 words; link to 3+ real slot pages and 1–2 `/best/` lists that exist), then tick it in the
queue. Use only data that is on the site or on official provider pages. Add new topic ideas to the end of the queue
if you notice gaps.

## 3c. Spanish pages (from 23 Nov 2026, once `src/lib/i18n.ts` exists on the deploy branch)

Add **~10 Spanish game pages a week** (they count towards the pace ceiling). For each, write
`content/i18n/es/slots/<provider>/<slug>.json` with `description`, `review` and `features` translated from the English
slot. Rules:
- Pick popular games that have a demo and no Spanish page yet (Pragmatic Play, Hacksaw, Nolimit City, BGaming hits first).
- Neutral Latin American Spanish ("tragamonedas", "giros gratis", "compra de bono"); keep numbers exactly as the
  English data, in the same format (96.5%, 5,000x).
- `description` ≤158 characters, starting "Juega la demo de <name> gratis" and naming the main feature.
- `review`: a faithful, natural translation of the English review (same facts, nothing invented). Name the game in the
  first sentence and say "tragamonedas" at least once.
- No promise words ("garantizado", "sin riesgo", "dinero fácil").
- Build and check the page renders at `/es/slots/<provider>/<slug>`; it appears in `/sitemap/es.xml` automatically.
Other languages (pt, de, sv) are added only when the owner asks.

## 3b. Clips check

```bash
node scripts/check-clips.mjs   # removes nothing; lists YouTube clips that are gone or no longer embeddable
```

Delete any failing clip from `content/clips.json`. Only add clips that pass this check, come from the game studio's official channel or the creator's own channel (no compilation, casino or re-upload channels), and never download or re-upload video.

## 4. Quality gate (all must pass before publishing)

- `python3 scripts/check-slot-descriptions.py` reports 0 problems;

```bash
node scripts/validate-content.mjs          # must end with "No blocking errors"
npm run build
```

Then start the server (`npx next start -p 3123`) and check:
- every new slot page returns 200 and its demo launches:
  - Hacksaw: `curl -s -o /dev/null -w '%{http_code}' localhost:3123/api/demo/hacksaw-gaming/<slug>` → `302`
  - other providers: the `demoUrl` responds;
- no horizontal overflow at 375px on the home page, `/slots`, one new slot page and the new guide (Playwright).

## 5. Publish (automatic)

Commit with a clear message, e.g. `Weekly update YYYY-MM-DD: N new slots, G guides, M data fixes`.

**If every step-4 check passed:**
```bash
git fetch origin claude/slots-demo-review-site-x1rmh3
git rebase origin/claude/slots-demo-review-site-x1rmh3   # pick up anything the owner pushed this week
npm run build                                           # re-check after the rebase
git push origin HEAD:claude/slots-demo-review-site-x1rmh3
```
Plain fast-forward push only – never `--force`. If the rebase conflicts or the rebuilt site fails, don't push: use the fallback.

**Fallback (any check failed, rebase conflict, or anything you're unsure about):** push `weekly/YYYY-MM-DD` and open a PR
into `claude/slots-demo-review-site-x1rmh3` explaining what failed. Don't merge it – the owner decides.

## 6. After publishing

Wait until the new pages return 200 on https://www.scatterdrop.com (Vercel usually takes 1–3 minutes), then submit them:

```bash
node scripts/indexnow.mjs /new /slot-database /slots/<provider>/<slug> /guides/<slug> ...
```

## 7. Report

End the session with a short report (it is sent to the owner's phone): published or PR (with link); new slots (name ·
provider · RTP · max win); skipped candidates with reasons; data changes (old → new); new guides; reviews deepened (count + names); decision pages; anything that failed or
needs a human; 2–3 suggestions (outreach angles from new data, topic-queue ideas).

## Coverage notes

- Wazdan's demo launcher only runs on wazdan.com, so Wazdan slots get `demoLink` (opens the official page) instead of an embedded demo. Push Gaming works the same way. Never try to get around a provider's embedding rules.
- Candidate studios checked and why they're not imported yet: Quickspin (official demos, but RTP/max win only in PDF game sheets), Print Studios (demo didn't render in testing), Avatar UX and Endorphina (robots.txt disallows game pages), Habanero (robots.txt disallows game pages), Playson and Spinomenal (site refuses automated access), Big Time Gaming (blocks crawlers). Re-check occasionally; add an adapter in `scripts/import/providers.py` when one becomes viable.

## Rules that never change

- Official provider sources only. Respect robots.txt. A site that blocks crawlers (e.g. bigtimegaming.com) is skipped, never worked around.
- Don't scrape competitors (Bigwinboard, SlotCatalog, Casino.guru and similar) – no bulk crawling or copying text. Reading individual pages to confirm a missing value under step 3e is allowed.
- Never guess RTP, volatility or max win. If it isn't published and step 3e can't confirm it from two independent sources, store `null` (the page hides the field).
- Casino offers, affiliate links, real-money and geo settings (`content/casinos.json`, `FEATURES` in `src/lib/config.ts`, the casino/CTA components) are owner decisions: leave them exactly as they are – never switch them off, edit or add to them.
- Don't change layout, design or site config. Suggest such changes in the report instead.
- Only content (slots, guides, topic queue, import-skip list) is published automatically. Never force-push, never rewrite history, never merge someone else's PR.

## GEO (being cited by AI assistants)

- `/llms.txt` is generated at build from the data, so it updates itself. Do not hand-edit it.
- Every new guide opens with a two-sentence direct answer to the question in its title, before any heading. Figures in guides carry their source (provider sheet, regulator, or named study) in the sentence.
- Every new slot review keeps the "key facts" table first; prose never contradicts the table.
- Only bump a page's `updatedAt` when its content actually changes. Never bulk-touch dates.
