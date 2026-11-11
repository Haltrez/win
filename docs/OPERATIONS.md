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

## Official demo sources

Demo links are set per slot in `demoUrl` and must be on the provider's `demoDomains` allowlist (`content/providers.json`). Links with `{version}` or `{uuid}` are completed at launch time by `/api/demo/[provider]/[slot]`.

| Provider | Status | URL pattern / how to find the game code |
|---|---|---|
| Pragmatic Play | ✅ live | `https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=<symbol>&lang=en&cur=USD&jurisdiction=99`. Check a symbol: request the URL and read `gname=` in the redirect. |
| Play'n GO | ✅ live | `https://released.playngonetwork.com/casino/ContainerLauncher?pid=2&gid=<gid>&lang=en_GB&practice=1&channel=desktop&demo=2`. The `gid` is in the "Play demo" link on playngo.com/games/<game>. |
| Hacksaw Gaming | ✅ wired, verify from a normal connection | `https://static-live.hacksawgaming.com/<gameId>/{version}/index.html?…&mode=2&token=demo&partner=demo…`. `gameId` = `data-gameid` on hacksawgaming.com/games/<game>; `{version}` is read from `<gameId>/version.json`. Hacksaw's demo server blocks datacenter IPs. |
| BGaming | ✅ live | `https://demo.bgaming-network.com/play/<ID>/FUN?server=demo`. The ID is shown under "ID" in the details table on bgaming.com/games/<game>. |
| Push Gaming | ✅ wired, verify from a normal connection | `https://player.eu.demo.pushgaming.com/mesh/b2c/igp/pg-com/launch?mode=DEMO&…&rgsGameId=<id>&token={uuid}`. `rgsGameId` is in the base64 `gameUrl` on pushgaming.com/games/play/<game>.html. Region-restricted by visitor IP. |
| Nolimit City | ✅ live | `https://demo.nolimitcdn.com/loader/game-loader.html?operator=FANPAGE_DEMO&game=<tableId>&language=en&device=desktop`. `tableId` is in the page data of nolimitcity.com/games/<slug> (the same loader their own site uses through `nolimit.js` with `environment: "demo"`). |
| Thunderkick | ✅ live | `https://forfun.thunderkick.com/gamelauncher/play/generic?device=desktop&gameId=<id>&operatorId=2&playMode=demo`, from the `data-play-game` attribute of the "Play Game" button on thunderkick.com/games/<slug>/. A few new titles only point to a QA host (`ext-qa-gameservice…`); those are left without a demo until they move to `forfun`. |
| NetEnt, Big Time Gaming, Red Tiger (Evolution) | ❌ needs partner access | games.evolution.com has no open demo launcher. Request demo access through Evolution's affiliate/partner team. |
| Relax Gaming, Blueprint, others | ❌ needs partner access | No public demo links on their sites. Request through your affiliate manager or an aggregator that licenses demo embeds. |

Slots without `demoUrl` show "Official demo coming soon". Never embed demos from third-party mirror sites.

## Thumbnails

Slot thumbnails live in `public/thumbs/<provider>/<slug>.webp` (480×360, 4:3 WebP). They are made from each provider's official game artwork (Pragmatic Play game CDN art, BGaming covers, Hacksaw catalogue thumbnails, Nolimit City icons, Thunderkick banners, Play'n GO logo over hero art). Art close to 4:3 is cropped full-bleed; very tall or wide art is fitted onto a blurred copy of itself, and transparent edges are flattened onto the art's own colours. Providers publish this artwork for promotion, but confirm image usage terms in your affiliate or provider agreements before launch.

## Data provenance for imported slots

- **BGaming:** RTP, volatility, max multiplier, release date, hit rate and FS rate come from the details table on each bgaming.com game page.
- **Hacksaw Gaming:** volatility (1–5 scale), win type, max win and all RTP versions come from the "Game data" block on hacksawgaming.com. Only games that publish this block were imported.
- **Nolimit City:** RTP, max payout, hit frequency, release date, layout and features come from the game data on nolimitcity.com/games/<slug>. Nolimit publishes volatility as a number (standard deviation); we convert it with the same thresholds their site uses for its labels (<9.9 Medium, 9.9–17.3 High, 17.3–27.3 Extreme, ≥27.3 Insane) and map Extreme/Insane to `very-high`. Hit rate is stored as "1 in N" (100 ÷ hit frequency). A few titles were left out for brand-safety reasons (explicit or real-atrocity themes) – see `SKIP` lists in the import scripts if you want them.
- **Thunderkick:** RTP, reels, paylines/ways, volatility label and max exposure come from the "Game details" box on thunderkick.com/games/<slug>/. Several recent titles publish a ~94% RTP and we show that figure as published. Games whose details page is behind the client-area login were skipped; three older titles publish a numeric volatility instead of a label, so their volatility is `null`.
- **Hacksaw Gaming (games without a "Game data" block):** max win, layout and win type come from Hacksaw's game page and the public in-game rules; volatility is filled only where Hacksaw states it (e.g. "Volatility: 3/5"), otherwise `null`. Hacksaw doesn't publish RTP for these games outside the game, so `rtp` is `null` ("Not published") unless **two independent third-party databases agree to the hundredth** (currently gambling.com + slotslaunch.com). Those slots carry `rtpSource: "third-party"`, list both URLs in `sources`, stay `verified: false`, and show a "not confirmed by the provider" note on the page. Re-check these against the in-game info screen when you have a partner demo account.
- **Pragmatic Play:** RTP and descriptions come from pragmaticplay.com; max win comes from the provider's description or the game's own intro/paytable text, and is left blank where the two disagree. Pragmatic doesn't publish volatility or exact release dates on its site, so volatility is `null` (shown as "Not published") and release dates are month-level (from the official artwork upload date).
- Editorial scores (`rating`) are only set for slots our team has reviewed in depth; imported slots have no score until then.

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

## Starz Partners (BitStarz, Cashy) – agreed setup, not live yet

- Deal: 40% of net gaming revenue, monthly, no negative carryover, EUR. Promo code requested: SCATTERDROP.
- Operator's restricted countries (never show offers): US, GR, GB, ES, FR, NL, IL, LT, SK, BE, AO, AL, IQ, JM, UG, PK, IR, PA, LB, ZW, MU, NI, YE, CF, CI, SD, LR, SY, KY, SO, CG, RU, CZ, RS, CU, PT, GE, HU, UA, EE, BG, LV, LI, PL, RO, CW, CY, BR.
- Owner-approved allowlist for `geos` (offers shown only here):
  `CA-AB, CA-BC, CA-MB, CA-NB, CA-NL, CA-NS, CA-NT, CA-NU, CA-PE, CA-QC, CA-SK, CA-YT` (Canada without Ontario),
  `NZ, IE, FI, NO, AT, JP, IN, ZA, MX, AR, CL, UY, EC, CR`.
- Deliberately left out although not on the operator's list: DE, SE, DK, IT, CH, AU, CA-ON, CO, PE (local rules against promoting casinos without a local licence).
- Still needed from the owner before switching on: both tracking links, one logo per brand, bonus wording and terms.
- To go live: replace the placeholder entries in `content/casinos.json`, then set `NEXT_PUBLIC_REAL_MONEY=1` in Vercel and redeploy.

## 7Bit Partners (7Bit Casino) – researched, not agreed yet

- Source: 7bitcasino.com/terms-and-conditions, clause 3.4 (checked 2026-11-11). Long restricted list; notable countries NOT on it:
  Canada, Australia, New Zealand, Germany, Austria, Switzerland, Ireland, Italy, Denmark, Finland, Norway, Luxembourg, Malta, Slovenia, Brazil, India, South Africa, Russia, Kazakhstan.
- Differs from Starz: 7Bit restricts Japan, Mexico, Argentina, Chile, Uruguay, Ecuador, Costa Rica, Singapore, Hong Kong; Starz restricts Brazil, Russia.
- Suggested allowlist if the owner joins: `CA-*` without Ontario, `NZ, IE, FI, NO, AT, IN, ZA` (same caution as Starz: leave out DE, SE, DK, IT, CH, AU, CA-ON, BR).
- Not confirmed: affiliate programme's own country rules (7bitpartners.com refuses automated access), bonus-restricted countries (separate Bonus Terms), commission plan, other brands in the programme.

### 7Bit Casino – entry added (2026-11-11), offers still off

- `content/casinos.json`: 7Bit with tracking link, official logo, welcome pack wording and terms taken from 7bitcasino.com/bonus-terms (35x wagering, 14 days, $20 minimum). Rating 0 = no score shown.
- Shown only in: Canada without Ontario, NZ, IE, FI, NO, AT, IN, ZA. 
- The three placeholder casinos were removed. BitStarz, Cashy and Mirax still need tracking links, logos (BitStarz logo saved) and terms.

### Mirax Casino – entry added (2026-11-11), offers still off

- Same programme as 7Bit (7Bit Partners). Tracking link, official logo, welcome package and terms from miraxcasino.com/bonus-terms-and-conditions (35x, 14 days, min 0.00028 BTC, free-spin winnings capped at 0.0014 BTC).
- Restricted-country list (terms, effective 15.06.2026) is identical to 7Bit's. Mirax also bars some countries from ALL promotions, including Finland, so FI is left out.
- Shown only in: Canada without Ontario, NZ, IE, NO, AT, IN, ZA. Ireland, India and South Africa cannot get Mirax no-deposit offers (the deposit welcome package is fine).
- Licence: the terms refer to Curaçao law but state no licence number; confirm before relying on it.

### BitStarz – entry added (2026-11-11), offers still off
- Tracking link https://bzstarz2.com/bgjlng4de (taken from the banner script the panel issues; it 302s to gotobitstarz.com with our stag). We never embed the panel's banner scripts.
- Licence and operator from bitstarz.com/terms 1.2; 40x wagering and 180 FS schedule from bitstarz.com/bonus-terms-and-conditions.
- Countries: the agreed Starz allowlist.

### Cashy – pending
- Tracking link https://gocashy.com/bbbnmct7k (from the banner script; 302s to cashyglobal.com with our stag).
- Logo received from the owner: public/casinos/cashy.png (dark artwork, use `"logoLight": true`).
- Not added yet: cashy.com and cashyglobal.com refuse automated access, so the offer terms must come from the owner/marketing kit. Banner offer: 100% up to $3,000.

- Cashy studios: owner confirmed Cashy carries all 12 studios on the site (2026-11-11).
