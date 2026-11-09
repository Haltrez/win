# SpinVault – slots demo & review site

Production-ready Next.js architecture for a slot demo and review site built for long-term organic SEO and compliant affiliate monetisation.

- **Static-first Next.js 16** (App Router, React 19, TypeScript), Core Web Vitals-friendly (no web fonts, click-to-load demos, minimal client JS)
- **Templates:** homepage, slot page, provider hub, category/"best of" page, guide, comparison, casino listing, A–Z index, compliance pages
- **SEO:** pattern-based unique titles/meta, canonical URLs, Game/Review/FAQ/Breadcrumb/ItemList/Article schema, split sitemaps, robots, automatic internal linking, thin-content noindex guard
- **Compliance:** 18+ age gate, affiliate disclosure, RG footer with self-exclusion links, geo-filtered casinos, banned-language build check
- **Content pipeline:** JSON/Markdown content with a validation gate (`npm run validate`) and CSV bulk import

## Quick start

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_SITE_URL etc.
npm run dev                  # http://localhost:3000
npm run build && npm start   # production (build runs content validation first)
```

## Structure

```
content/
  slots/<provider>/<slug>.json   one file per slot (data + original review)
  providers.json                 provider hubs + allowlisted official demo domains
  casinos.json                   affiliate partners (PLACEHOLDERS – replace before launch)
  guides/*.md                    articles (frontmatter + Markdown)
  comparisons.json               "X vs Y" pairs
  authors.json
src/
  app/                           routes (see below)
  components/                    UI (AgeGate, DemoEmbed, CasinoModule, SlotCard, FAQ, …)
  lib/
    data.ts                      content layer (swap for a headless CMS here)
    categories.ts                rule-based category definitions (~73)
    seo.ts                       title/meta builders, buildMetadata()
    schema.ts                    JSON-LD builders
  proxy.ts                       sets geo cookie for casino geo-targeting
scripts/
  validate-content.mjs           content QA gate (runs before build)
  import-slots.mjs               CSV → slot JSON stubs
docs/                            strategy & operations
```

| Route | Template |
|---|---|
| `/` | Homepage |
| `/slots`, `/slots/a-z/[letter]` | Slot database, search, A–Z |
| `/slots/[provider]/[slot]` | **Slot page** |
| `/providers`, `/providers/[provider]` | **Provider hub** |
| `/best`, `/best/[category]` | **Category / list pages** |
| `/guides`, `/guides/[slug]` | Guides |
| `/compare`, `/compare/[a]-vs-[b]` | Comparisons |
| `/casinos` | Casino comparison |
| `/go/[casino]` | Geo-aware affiliate redirect + click logging |
| `/sitemap/[type].xml`, `/robots.txt` | SEO |

## Docs

- [SEO strategy & technical config](docs/SEO-STRATEGY.md)
- [Content plan & volume targets](docs/CONTENT-PLAN.md)
- [Link building plan](docs/LINK-BUILDING.md)
- [Operations: publishing, CMS, analytics, monitoring](docs/OPERATIONS.md)
- [Compliance checklist](docs/COMPLIANCE.md)

## Status of seed content

The repository ships **39 seed slots**, 18 providers, 9 guides and 15 comparisons to exercise every template. Seed slot figures (RTP, max win, release dates) are drawn from public information but are marked `verified: false` – **verify every figure against the provider's game sheet before launch**. Casino partners are placeholders. Demo URLs are empty until you obtain official demo links from each provider (the validator only accepts allowlisted provider domains).
