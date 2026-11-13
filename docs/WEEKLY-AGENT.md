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

## 1. New slots (target: 25–45 per week, within the pace ceiling)

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

## 3. One new guide or article

Long-tail first (SEO avalanche, owner rule): take the first unchecked topic in the "Long-tail first" section of `content/topic-queue.md`; only when it is empty move to "Broad topics". Title = the exact search phrase, answer it in the first paragraph. Otherwise: take the first unchecked topic in `content/topic-queue.md`, write `content/guides/<slug>.md` (same front-matter as
existing guides; 600–1,000 words; link to 3+ real slot pages and 1–2 `/best/` lists that exist), then tick it in the
queue. Use only data that is on the site or on official provider pages. Add new topic ideas to the end of the queue
if you notice gaps.

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
provider · RTP · max win); skipped candidates with reasons; data changes (old → new); new guides; anything that failed or
needs a human; 2–3 suggestions (outreach angles from new data, topic-queue ideas).

## Coverage notes

- Wazdan's demo launcher only runs on wazdan.com, so Wazdan slots get `demoLink` (opens the official page) instead of an embedded demo. Push Gaming works the same way. Never try to get around a provider's embedding rules.
- Candidate studios checked and why they're not imported yet: Quickspin (official demos, but RTP/max win only in PDF game sheets), Print Studios (demo didn't render in testing), Avatar UX and Endorphina (robots.txt disallows game pages), Habanero (robots.txt disallows game pages), Playson and Spinomenal (site refuses automated access), Big Time Gaming (blocks crawlers). Re-check occasionally; add an adapter in `scripts/import/providers.py` when one becomes viable.

## Rules that never change

- Official provider sources only. Respect robots.txt. A site that blocks crawlers (e.g. bigtimegaming.com) is skipped, never worked around.
- Don't scrape competitors (Bigwinboard, SlotCatalog, Casino.guru and similar).
- Never guess RTP, volatility or max win. If it isn't published, store `null` ("Not published").
- Casino offers, affiliate links, real-money and geo settings (`content/casinos.json`, `FEATURES` in `src/lib/config.ts`, the casino/CTA components) are owner decisions: leave them exactly as they are – never switch them off, edit or add to them.
- Don't change layout, design or site config. Suggest such changes in the report instead.
- Only content (slots, guides, topic queue, import-skip list) is published automatically. Never force-push, never rewrite history, never merge someone else's PR.
