# SEO strategy & technical configuration

## Positioning

Win long-tail, high-intent "[slot] demo / review / RTP / max win" queries first (low competition, thousands of them), then use the topical authority and internal links from 2,000+ slot pages to climb into category keywords ("best high volatility slots 2026", "megaways slots") and provider keywords ("hacksaw slots").

## URL structure

| Page | URL | Primary keyword pattern |
|---|---|---|
| Slot | `/slots/[provider]/[slot]` | [slot] demo, [slot] review, [slot] RTP, [slot] max win |
| Provider hub | `/providers/[provider]` | [provider] slots, best [provider] slots |
| Category | `/best/[category]` | best [type] slots [year] |
| Guide | `/guides/[slug]` | informational ("what is rtp in slots") |
| Comparison | `/compare/[a]-vs-[b]` | [a] vs [b] |
| A–Z | `/slots/a-z/[letter]` | crawl path, not a ranking target |

`/slots/[provider]` 308-redirects to `/providers/[provider]` (one canonical hub). Legacy patterns (`/slot/…`, `/provider/…`, `/category/…`) are 301'd in `next.config.ts`. Slugs are lowercase kebab-case and never change once published – if they must, add a redirect.

## Titles & meta (src/lib/seo.ts)

- **Slot:** `[Slot] Demo & Review – [Max Win]x Max Win | [Provider] ([Year])` (absolute title, no site suffix).
- **Slot meta:** `Play the free [Slot] demo by [Provider]: [RTP] RTP, [volatility] volatility and [max]x max win. See how the [feature] feature works. Honest review, no sign-up.` – optional tails are only appended if they fit in 158 characters, so descriptions are never truncated mid-phrase. The first feature name makes each description unique even for sibling games.
- **Category:** `Best [Type] Slots [Year] – Free Demos, RTP & Max Win` with year computed at build time.
- **Provider:** `[Provider] Slots – [N] Free Demos & Reviews ([Year])`.
- Every page sets a self-referencing canonical, OpenGraph and Twitter cards.

## Structured data (src/lib/schema.ts)

| Page | Schema |
|---|---|
| All | Organization, WebSite (+SearchAction) |
| Slot | Game (+ editorial Review with Rating, positiveNotes/negativeNotes), BreadcrumbList, FAQPage |
| Category | ItemList, BreadcrumbList, FAQPage (when FAQ defined) |
| Provider | ItemList, BreadcrumbList, FAQPage |
| Guide | Article, BreadcrumbList, FAQPage |

Notes: we deliberately emit **no AggregateRating** (we have no user ratings – fabricating one violates Google's guidelines). FAQPage rich results are currently limited by Google to authoritative government/health sites, so FAQ markup is kept for semantic clarity and other engines, not for SERP features.

## Indexation control

- Category pages with fewer than 6 slots → `noindex, follow` and excluded from sitemaps (prevents thin pages; they flip to indexable automatically as content grows).
- Providers with 0 slots → `noindex`.
- `/go/*` (affiliate redirects), `/api/*`, `/favorites` → disallowed in robots.txt, `X-Robots-Tag: noindex`.
- Staging/preview: set `NEXT_PUBLIC_NOINDEX=1` → whole site noindex + robots disallow.
- Split sitemaps (`/sitemap/{core,slots,providers,best,guides}.xml`) with real `lastModified` dates from content, all listed in robots.txt. Submit each in Search Console to monitor indexation per content type. Split `slots` further when it passes ~45k URLs.

## Internal linking (automatic)

- Slot → provider hub, 6 related slots (editorial picks + similarity on mechanics/themes/provider/volatility), up to 8 category pages it qualifies for, comparisons it appears in, core guides.
- Category → top 50 slots (grid + comparison table), providers in the list, sibling categories in the same group, supporting guides.
- Provider → every slot (table), best/newest grids, category pages containing its slots.
- Guide → related slots and categories from frontmatter.
- Footer → top providers, indexable categories, core guides. A–Z pages guarantee every slot is ≤3 clicks from home.

## Core Web Vitals

- All content pages are statically generated (SSG) – HTML served from the CDN, TTFB ≈ edge latency.
- System font stack (no web-font download, no FOIT/CLS).
- Demo iframes use a **click-to-load facade** – the multi-MB game is never loaded on page view.
- Images: `next/image` with AVIF/WebP and explicit dimensions; generated gradient tiles until licensed artwork is added.
- Age gate is client-only overlay; content is in the HTML (no content-hiding for crawlers, no layout shift).
- Minimal client JS: only AgeGate, search, favourites, casino geo filter, demo facade and analytics are client components.
- Real-user vitals are beaconed to `/api/vitals` (forward to BigQuery/Logflare via `EVENTS_WEBHOOK_URL`). Targets: LCP < 2.0s, INP < 150ms, CLS < 0.05 at p75.

## Keyword targeting checklist per slot page

- H1: `[Slot] Demo & Review`
- H2s: `[Slot] review`, `Features and bonus rounds`, `[Slot] RTP, volatility and max win`, `Best casinos to play [Slot]`, `Slots like [Slot]`, `[Slot] FAQ`
- Auto-FAQ answers "[slot] RTP", "[slot] max win", "is [slot] high volatility", "[slot] free play", "[slot] bonus buy".

## E-E-A-T

- Visible author/team, `How we review` methodology page with scoring weights, `lastVerified` dates and data sources on every slot page, corrections contact.
- Real demo-session notes (`playNotes`) – first-hand experience is the strongest differentiator against scraped/AI sites.
- Recommended next step: individual reviewer profiles (`content/authors.json` supports `sameAs`) with real bylines and author pages.

## Measurement

Search Console (per-sitemap indexation, queries by URL pattern), rank tracking on 300 "[slot] demo" terms + 50 category terms, GA4/Plausible for engagement, `/go` click logs for affiliate CTR by template/position (`src`, `pos` parameters).
