# Weekly agent playbook

A scheduled Claude Code session runs this every **Monday morning (Europe/Riga)**. It never publishes directly:
it opens **one pull request** for the owner to review and merge. Merging deploys to Vercel.

Follow the steps in order. If a step fails, keep going with the others and explain the failure in the PR.

## 0. Setup

```bash
git fetch origin claude/slots-demo-review-site-x1rmh3
git checkout -B weekly/$(date +%F) origin/claude/slots-demo-review-site-x1rmh3
npm ci
pip install Pillow   # only if `python3 -c "import PIL"` fails
```

The PR base branch is `claude/slots-demo-review-site-x1rmh3` (the branch Vercel deploys).

## 1. New slots (target: 8–20 per week)

```bash
python3 scripts/import/discover.py --max 6
```

Read `.import/candidates.json`. For every candidate decide **publish** or **skip**:

- **Skip** (add `"skip": "reason"` in reviews.json) when:
  - the title or theme is explicit, crude, or about a real atrocity or tragedy (brand safety). Also add it to `content/import-skip.json` with the reason.
  - it isn't really a slot (crash, dice, scratch, table game).
  - the official data looks broken (e.g. RTP outside 85–99%, max win of 0).
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

## 2. Data re-check (drift)

```bash
python3 scripts/import/recheck.py --per-provider 15
```

- Apply clear, official changes: `python3 scripts/import/recheck.py --per-provider 15 --apply`. Use `--providers hacksaw-gaming --per-provider 200` to re-check one provider in full.
- If a changed number also appears in the review text (e.g. "rated 4 out of 5"), fix the wording by hand.
- Report "source unreachable / no official page" items in the PR; don't guess replacements.

## 3. One new guide or article

Take the first unchecked topic in `content/topic-queue.md`, write `content/guides/<slug>.md` (same front-matter as
existing guides; 600–1,000 words; link to 3+ real slot pages and 1–2 `/best/` lists that exist), then tick it in the
queue. Use only data that is on the site or on official provider pages. Add new topic ideas to the end of the queue
if you notice gaps.

## 4. Quality gate (all must pass before opening the PR)

```bash
node scripts/validate-content.mjs          # must end with "No blocking errors"
npm run build
```

Then start the server (`npx next start -p 3123`) and check:
- every new slot page returns 200 and its demo launches:
  - Hacksaw: `curl -s -o /dev/null -w '%{http_code}' localhost:3123/api/demo/hacksaw-gaming/<slug>` → `302`
  - other providers: the `demoUrl` responds;
- no horizontal overflow at 375px on the home page, `/slots`, one new slot page and the new guide (Playwright).

## 5. Pull request

Commit with a clear message and push `weekly/YYYY-MM-DD`, then open a PR into `claude/slots-demo-review-site-x1rmh3`
titled `Weekly update YYYY-MM-DD: N new slots, 1 guide, M data fixes`. In the body:
- new slots (name · provider · RTP · max win), and skipped candidates with reasons;
- data changes from the re-check (old → new);
- the new guide;
- anything that failed or needs a human (blocked sites, unreachable sources, layout issues);
- 2–3 suggestions for the owner (e.g. outreach angles from new data, ideas for the topic queue).

End the PR body with the attribution line given in the session instructions.

## 6. After the owner merges

New pages can be pushed to Bing/IndexNow straight away (the owner or a later run can do this once the PR is live):

```bash
node scripts/indexnow.mjs /new /slot-database /slots/<provider>/<slug> /guides/<slug> ...
```

## Rules that never change

- Official provider sources only. Respect robots.txt. A site that blocks crawlers (e.g. bigtimegaming.com) is skipped, never worked around.
- Don't scrape competitors (Bigwinboard, SlotCatalog, Casino.guru and similar).
- Never guess RTP, volatility or max win. If it isn't published, store `null` ("Not published").
- Real-money features stay off (`NEXT_PUBLIC_REAL_MONEY` unset). Don't add casino links or affiliate content.
- Don't change layout, design or site config in the weekly PR. Suggest such changes in the PR body instead.
- No PR merges, force-pushes or pushes to the deploy branch. The owner merges.
