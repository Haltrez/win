# Compliance checklist

> Not legal advice. Have a gambling-regulatory lawyer review the site for each target market before launch (UKGC/CAP Code & ASA, Ontario AGCO, Spelinspektionen, GGL Germany, Dutch KSA, etc.).

## Implemented in the codebase

- [x] **Age gate (18+)** on first visit – cookie + localStorage, "under 18" exit to Gambling Therapy (`AgeGate.tsx`). Content stays crawlable.
- [x] **Affiliate disclosure** on every page with casino links (`AffiliateDisclosure`), plus a full `/affiliate-disclosure` page.
- [x] **Responsible gambling footer** on every page: message, 18+ badge, links to BeGambleAware, GAMSTOP, GamCare, GA, 1-800-GAMBLER, Spelpaus, OASIS, ConnexOntario, Gambling Help Online, Gambling Therapy; full `/responsible-gambling` page.
- [x] **Affiliate links** use `rel="sponsored nofollow noopener"` and are routed via `/go/` (noindex).
- [x] **Geo-targeting:** casinos are only shown/redirected for countries in their `geos` list; visitors elsewhere are sent to `/casinos?unavailable=1` instead of an unlicensed offer.
- [x] **Significant terms** displayed under every bonus (required by UK CAP Code); validator fails the build if a casino has no terms or licence.
- [x] **Banned language check:** "guaranteed", "risk-free", "sure win", "can't lose", "easy money", "get rich" fail the build.
- [x] **Honest framing:** volatility warnings on every slot page, "max wins are rare", "demo results don't predict real results", "no strategy changes RTP", bonus buy cost/risk explained, lower-RTP versions disclosed.
- [x] **Official demos only:** demo URLs must match provider-allowlisted domains (validator). Facade means nothing loads without a click.
- [x] **No dark patterns:** no countdown timers, no fake scarcity, no pop-ups pushing deposits, no pre-ticked anything.
- [x] **No fabricated ratings:** no AggregateRating schema, no invented play notes.

## Before launch

- [ ] Replace placeholder casinos in `content/casinos.json` with real, licensed operators; verify licence numbers on regulator registers.
- [ ] Confirm each partner's permitted geos match both their licences **and** your affiliate agreement.
- [ ] Register as an affiliate where required (e.g. some US states require vendor registration; Ontario requires affiliates to be registered with AGCO).
- [ ] Market-specific rules:
  - **UK:** no bonus-buy promotion to UK users, CAP/BCAP code for ads, "BeGambleAware.org" in offers, no appeal to under-25s in imagery/tone.
  - **Ontario:** no inducements/bonus advertising outside operator sites (bonus text must be hidden for CA-ON – use per-geo `bonus` values without offers).
  - **Germany:** €1 stake cap, no bonus buy, no autoplay; promote only GGL-whitelisted operators.
  - **Netherlands:** strict untargeted-advertising rules; consider excluding NL from casino modules entirely.
  - **US:** state-by-state; only list operators licensed in the visitor's state (proxy sets `US-XX` geo).
- [ ] Verify provider terms for embedding demos (some require approval or restrict certain geos – e.g. UK age-verification requirements for free-play).
- [ ] Image licensing: only use provider press-kit assets with permission.
- [ ] Privacy policy, cookie consent (if using GA4/ads), terms – legal review of the templates in `/privacy` and `/terms`.
- [ ] Add a real contact address and company details (some regulators require affiliate identity disclosure).
