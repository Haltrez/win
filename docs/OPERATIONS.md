# Operations: publishing, CMS, analytics, monitoring

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript**, fully static generation for all content pages (~215 pages today; a 5,000-slot catalogue builds in a few minutes).
- **Content:** Git-based JSON (slots, providers, casinos) and Markdown (guides) in `content/`. All reads go through `src/lib/data.ts`.
- **Dynamic bits:** `/go/[casino]` (affiliate redirects), `/api/vitals` (RUM), `proxy.ts` (geo cookie).
- **Hosting:** Vercel recommended (geo headers `x-vercel-ip-country` used out of the box). Cloudflare (`cf-ipcountry`) and CloudFront (`cloudfront-viewer-country`) headers are also supported.

## Adding content

| Task | How |
|---|---|
| New slot | Add `content/slots/<provider>/<slug>.json` (copy an existing file) or bulk import via CSV: `npm run import:slots -- file.csv` |
| New provider | Append to `content/providers.json`; add official demo hostnames to `demoDomains` |
| New guide | Add `content/guides/<slug>.md` with frontmatter (title, description, category, author, dates, relatedSlots, relatedCategories, faq) |
| New category | Add a rule in `src/lib/categories.ts` |
| New comparison | Append a pair to `content/comparisons.json` |
| Casino partner | Edit `content/casinos.json` – licence, geos, per-geo tracking links (`{clickid}` placeholder supported), bonus text and significant terms |

Always run `npm run validate -- --verbose` before committing. `npm run build` runs it automatically and fails on errors.

## Weekly release workflow (new slots)

1. **Mon:** pull provider release calendars / game sheets → CSV → `import:slots`.
2. **Mon–Wed:** demo sessions, reviews, fact-check (one PR per provider batch).
3. **CI:** validate + typecheck + build on every PR; preview deploy with `NEXT_PUBLIC_NOINDEX=1`.
4. **Merge → production deploy.** New slots appear in `/best/new-slots`, provider hubs, matching category pages and sitemaps automatically.
5. **Thu:** request indexing for the 5–10 most important new pages in Search Console; share on social.

## Moving to a headless CMS (when the team grows)

The git workflow scales to a few writers. For a larger team, plug in a headless CMS without touching templates:

- **Recommended:** Payload CMS or Sanity – structured schemas mirror `src/lib/types.ts` (Slot, Provider, Casino, Guide, Author).
- Replace the bodies of `getSlots()`, `getProviders()`, `getGuides()` etc. in `src/lib/data.ts` with CMS queries.
- Use **ISR**: add `export const revalidate = 86400` to slot/category pages and a CMS webhook calling `revalidatePath()` on publish, so new slots go live without a full rebuild.
- Keep `scripts/validate-content.mjs` logic as CMS validation rules (required fields, demo-domain allowlist, banned phrases, min review length).

## Analytics & conversion tracking

- Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (privacy-friendly, no consent banner needed in most EU setups) **or** `NEXT_PUBLIC_GA4_ID` (needs a consent banner – add a CMP such as Cookiebot/Usercentrics before enabling GA4 for EU/UK traffic).
- Client events: any element with `data-event` (all affiliate CTAs use `affiliate_click`) is tracked automatically.
- Server events: every `/go/` click is logged with casino, source template (`src`, e.g. `slot:gates-of-olympus`, `best:megaways-slots`), position, country and a `clickId`. Put `{clickid}` in partner tracking URLs to pass it as a sub-ID, then join with affiliate-network conversion reports for revenue per page/template.
- Forward events to a warehouse with `EVENTS_WEBHOOK_URL` (BigQuery, Logflare, Segment, PostHog…).
- Key reports: affiliate CTR by template & position, EPC by page, revenue by slot/provider/category, organic landing pages → clicks.

## Monitoring & error handling

- **Errors:** `error.tsx` and `global-error.tsx` boundaries; client errors beacon to `/api/vitals`. Add Sentry (`@sentry/nextjs`) for stack traces in production.
- **Web vitals:** RUM via `useReportWebVitals` → `/api/vitals`. Also watch the CrUX report in Search Console.
- **Uptime:** external check (Better Stack, UptimeRobot) on `/`, a slot page, `/sitemap/slots.xml` and `/go/<top-casino>` (expect 302).
- **Affiliate link health:** weekly script/cron hitting each partner link to catch dead offers (404/expired campaign).
- **SEO regressions:** Search Console coverage alerts; a CI check that `robots.txt` doesn't disallow `/` in production.
- **Security headers:** set in `next.config.ts` (HSTS, nosniff, frame options, referrer and permissions policy). Add a CSP once the analytics/demo domains are final (demo iframes need `frame-src` for provider demo hosts).

## Optional features roadmap

| Feature | Status | Notes |
|---|---|---|
| Favourites | ✅ local (no account) | `src/components/Favorites.tsx` – swap storage for an API when accounts launch |
| User accounts | Planned | Auth.js / Clerk + Postgres; sync favourites; must enforce 18+ declaration and GDPR deletion |
| Community big-win gallery | Planned | Requires moderation, proof (screenshot + casino), and editorial framing ("wins are rare; losses aren't posted"). Avoid glorifying wins – keep RG messaging prominent |
| Demo tournaments / leaderboards | Planned | Demo-credit only (no prizes of monetary value without legal review – prize promotions can be regulated as gambling). Needs accounts + anti-cheat |
| Bonus comparison tables | ✅ basic | `CasinoModule` – extend with wagering/max-cashout columns |
