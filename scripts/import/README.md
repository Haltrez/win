# Provider importers

Python 3 + Pillow (`pip install Pillow`). Run from the repo root. Used by the weekly agent – see
[docs/WEEKLY-AGENT.md](../../docs/WEEKLY-AGENT.md).

| Script | What it does |
|---|---|
| `discover.py` | Lists each provider's official catalogue, finds games not on the site yet, fetches their official data into `.import/candidates.json`. Unimportable games go to `content/import-skip.json` with a reason. |
| `build.py` | Combines `.import/candidates.json` with agent-written `.import/reviews.json` into `content/slots/<provider>/<slug>.json` and `public/thumbs/<provider>/<slug>.webp`. |
| `recheck.py` | Re-fetches official data for the slots verified longest ago and reports differences; `--apply` writes them. |
| `providers.py` | One adapter per provider (Pragmatic Play, BGaming, Hacksaw Gaming, Nolimit City, Thunderkick). |
| `common.py` | Polite fetching with robots.txt checks, parsing helpers, thumbnail generator. |

Rules enforced in code: official sources only, robots.txt respected (a blocked provider is skipped, never worked
around), one request at a time with a delay, and values the provider doesn't publish stay `null`.
