# Content plan

Volume targets and how to hit them without publishing thin or AI-spam pages.

| Content type | Launch | 6 months | 12–18 months | Route |
|---|---|---|---|---|
| Slot pages | 1,500–3,000 | 3,500 | 5,000+ | `/slots/[provider]/[slot]` |
| Provider hubs | 40–60 | 80 | 120 | `/providers/[provider]` |
| Category / list pages | 60–75 (indexable once ≥6 slots) | 90 | 120 | `/best/[category]` |
| Guides & articles | 80–100 | 130 | 150+ | `/guides/[slug]` |
| Comparisons ("X vs Y") | 50 | 150 | 300 | `/compare/[a]-vs-[b]` |
| A–Z index pages | 27 | 27 | 27 | `/slots/a-z/[letter]` |

The repository ships the architecture, templates and a **seed set** (39 slots, 18 providers, 9 guides, 15 comparisons, ~73 category definitions). Volume comes from the content pipeline below. Every content file must pass `npm run validate` before it can be built.

---

## 1. Slot pages (1,500–3,000 at launch)

### Prioritisation (which slots first)

Work in waves. Each wave goes through the pipeline in §1.3.

| Wave | Slots | Selection rule | Why |
|---|---|---|---|
| 1 | 300 | Top 15 providers × their 20 most-searched titles (Ahrefs/Semrush "[slot] demo" + "[slot] slot" volume) | Highest demand, fastest long-tail wins |
| 2 | 700 | All releases from the last 24 months for tier-1 providers | Fresh demand, less competition |
| 3 | 1,000 | Remaining catalogue of tier-1 providers + top 10 titles of tier-2/3 providers | Topical completeness ("every Pragmatic slot") |
| 4 | 1,000+ | Long tail, older titles, smaller studios | Completeness, internal-link mass |
| Ongoing | 15–30/week | Every new release from tier-1/2 providers within 72 hours of launch | Win "[new slot] demo" before competitors |

### Minimum standard per slot page (enforced by `scripts/validate-content.mjs`)

- Verified data: RTP (+ alternative RTP versions), volatility, max win, release date, layout, ways/lines – checked against the provider game sheet; `verified: true` and `lastVerified` set.
- Official demo URL on the provider's allowlisted demo domain (`providers.json → demoDomains`).
- Review: **≥120 words** of original writing (target 250–400 for top-1,000 slots). Near-duplicate reviews (>35% 5-gram overlap) fail the build.
- `features[]` with plain-English explanations; `pros`/`cons` (2–3 each).
- `playNotes` from a real demo session (spins, bonus triggers, best win, observation). **Never invent these** – the template only renders them when present.
- Banned phrases ("guaranteed", "risk-free", "sure win", …) fail the build.

Everything else on the page – stats table, RTP/volatility/max-win explanations, auto-FAQ, related slots, category links, casino module, schema – is generated from the data, so a writer's job is the review, features and play notes.

### Pipeline & throughput

1. **Data import** – `npm run import:slots -- wave1.csv` creates JSON stubs from provider game sheets (CSV). Stubs fail validation until reviewed, so nothing half-done ships.
2. **Demo session** – reviewer plays 200–500 demo spins (+ bonus buy in demo where available), records `playNotes`.
3. **Write** – review, features, pros/cons. AI tools may assist with drafting structure, but every review must contain the reviewer's own observations and be edited by a human.
4. **Fact-check** – second person verifies numbers, sets `verified`.
5. **Merge** – PR → CI validate → build → deploy.

Throughput guide: an experienced writer produces 8–12 standard slot reviews/day (150–250 words + data check). **1,500 slots ≈ 150 writer-days** – e.g. 5 writers × 6 weeks. Budget for an editor at 1 per 4 writers.

---

## 2. Provider hubs (40–60)

All tier-1/2 studios at launch, plus every provider with ≥5 reviewed slots. Each hub needs a 200–400 word original description (history, licences, signature mechanics, what their maths "feels" like). Hubs with 0 slots are automatically `noindex`.

Launch list (add to `content/providers.json`): Pragmatic Play, Hacksaw Gaming, Nolimit City, Play'n GO, Push Gaming, Relax Gaming, Big Time Gaming, NetEnt, Red Tiger, ELK Studios, Thunderkick, Quickspin, Blueprint Gaming, Yggdrasil, Games Global, AvatarUX, Print Studios, BGaming, Evolution (slots), Playtech, Microgaming legacy studios (Just For The Win, Stormcraft, Pulse 8, Gold Coin Studios, Fortune Factory, Alchemy Gaming), Nolimit-adjacent studios (Bullshark Games), Backseat Gaming, Peter & Sons, ReelPlay, Fantasma, Kalamba, Gamomat, Merkur, Bally Wulff, Wazdan, Booming Games, Endorphina, Spinomenal, Habanero, Betsoft, iSoftBet, Stakelogic, Swintt, 4ThePlayer, Light & Wonder, IGT, Jili, PG Soft, Hölle Games, Octoplay, Gaming Corps, Slotmill, Bigpot, Popiplay, Lady Luck Games, Spinberry.

---

## 3. Category / list pages (60–75 at launch)

Defined as rules in `src/lib/categories.ts` – they fill automatically as slots are added. A page becomes indexable (and enters the sitemap) only once it has `SITE.minCategorySize` (6) slots. Each high-value list should also get a hand-written intro (300–600 words) and FAQ via the `intro`/`faq` fields.

Currently defined (~73):

- **Top lists (4):** best slots [year], new slots, popular high-variance bonus slots, simple slots for beginners
- **Max win (7):** highest max win [year], 5,000x+, 10,000x+, 20,000x+, 50,000x+, 100,000x+, low max win
- **Volatility (4):** high, very high/extreme, medium, low
- **RTP (3):** high RTP 96.5%+, 97%+, multiple RTP versions
- **Release (2 + per-year):** retro (pre-2016), slots released in [YYYY] for every year in the catalogue
- **Mechanics (21):** Megaways, bonus buy, cluster pays, pay anywhere, tumbling/cascading, sticky wilds, hold & win, money collect, multipliers, progressive multipliers, book (expanding symbol), expanding wilds, walking/moving wilds, xWays/xNudge/xBomb, expanding grid, jackpot, respins, gamble feature, ante bet, free spins, random modifiers
- **Themes (22):** mythology, Egyptian, western, fruit, candy, fishing, animal, horror, adventure, fantasy, space, classic, Asian, crime/heist, music, gems, sci-fi, dog, food, historical, pirate, Irish

Next additions (months 2–6): Christmas/Halloween/Easter seasonal slots (publish 6 weeks before season), Greek gods vs Norse, low-stakes slots (needs `minBet`), high-roller slots (`maxBet`), slots with highest hit frequency (`hitFrequency`), branded slots, provider × mechanic intersections ("Pragmatic Play Megaways slots", "Hacksaw bonus buy slots") and provider × year ("best Hacksaw slots 2026").

---

## 4. Guides & articles (80–150)

9 are written. The remaining plan, grouped by cluster. Each article links to ≥3 slot pages and ≥2 list pages, and every list page links back to its supporting guides (`relatedGuides`).

### Cluster A – Slot fundamentals (20)
1. ✅ How online slots work
2. ✅ RTP explained
3. ✅ How to check a slot's RTP at your casino
4. ✅ Slot volatility explained
5. ✅ How max win works
6. Hit frequency explained
7. What is a slot RNG and how is it tested?
8. Paylines vs ways vs cluster pays vs pay anywhere
9. Wild symbols: every type explained
10. Scatter symbols and how bonuses trigger
11. Slot multipliers explained
12. What are slot "features"? A glossary of 60 terms
13. Demo mode vs real money: what's the same and what isn't
14. Why the same slot pays differently at different casinos
15. Slot certification: GLI, BMM, eCOGRA and iTech Labs
16. What is a slot game sheet (PAR sheet)?
17. Are online slots rigged? How regulation works
18. Bonus round odds: why "due" is a myth
19. How progressive jackpots work
20. Fixed jackpots vs progressive jackpots

### Cluster B – Mechanics explained (25)
21. ✅ What is Megaways?
22. ✅ Cluster pays explained
23. ✅ Bonus buy explained
24. Ante bet explained
25. Tumble / cascade / avalanche mechanics
26. Sticky wilds explained
27. Hold and win / cash collect explained
28. Money collect (fishing slot) mechanics explained
29. Book slots and expanding symbols
30. xWays, xNudge, xBomb, xSplit: Nolimit City mechanics guide
31. Hacksaw's multi-tier bonus buys explained
32. Progressive vs persistent multipliers
33. Grid-expansion slots explained
34. Infinity Reels explained
35. Splitz / Gigablox / PopWins explained
36. Super bonus / "enhanced" free spins explained
37. Mystery symbols explained
38. Respin features explained
39. Gamble features: how they work and why they're restricted
40. Jackpot King, Daily Drops and network jackpots
41. Feature drop pricing explained
42. Bonus hunt culture: what it is and the risks
43. Streamer "big wins": why they're not representative
44. Turbo/quick spin and autoplay rules by country
45. Slot game design: how studios build maths models

### Cluster C – Bankroll, risk and responsible play (15)
46. ✅ Bankroll management for slots
47. Setting deposit and loss limits (step-by-step for major casinos)
48. Self-exclusion schemes by country (GAMSTOP, Spelpaus, OASIS, ROFUS…)
49. Gambling blocking software compared
50. Signs of problem gambling
51. Why chasing losses doesn't work
52. Martingale and other betting systems: why they fail on slots
53. Wagering requirements explained
54. How to read bonus terms
55. Free spins bonuses: what's actually free?
56. Cashback vs deposit bonus: which is better value?
57. How to verify a casino licence
58. Slot taxes: are winnings taxable? (by country)
59. Stake limits in UK online slots (rules explained)
60. Responsible gambling tools compared by regulator

### Cluster D – Best slots by country / regulation (20)
61. Best slots in the UK [year] (UKGC rules: no bonus buy, stake limits)
62. Best slots in Canada / Ontario [year]
63. Best slots in Ireland
64. Best slots in New Zealand
65. Best slots in Finland
66. Best slots in Norway
67. Best slots in Sweden
68. Best slots in Germany (5-second spin rule, €1 cap)
69. Best slots in the Netherlands
70. Best slots in Denmark
71. Best slots in Spain
72. Best slots in Italy
73. Best slots in Austria
74. Best slots in Switzerland
75. Best slots in New Jersey
76. Best slots in Pennsylvania
77. Best slots in Michigan
78. Best slots in Australia (information only – online casinos restricted)
79. Best slots in India (legal-status overview)
80. Online slot legality: country-by-country overview

### Cluster E – Provider deep dives (20)
81–100. "[Provider] slots guide: best games, RTP and mechanics" for the top 20 studios (each targets "[provider] slots", "best [provider] slots").

### Cluster F – Comparisons & roundups (25)
101. Gates of Olympus series ranked
102. Big Bass series: every game ranked
103. Money Train series ranked
104. Book slots ranked
105. Sweet Bonanza vs Sugar Rush vs Fruit Party
106. Best Megaways slots by RTP
107. Best Hacksaw slots for beginners
108. Most volatile slots ever made
109. Highest RTP slots by provider
110. Best slots with no bonus buy (UK-friendly)
111. Best slots for low stakes
112. Best slots for long sessions
113. Best new slots this month (monthly, evergreen URL updated)
114. Best slots of [year] (annual)
115. Best Christmas slots
116. Best Halloween slots
117. Best Egyptian slots ranked
118. Best Greek mythology slots
119. Best Western slots
120. Best fishing slots
121. Best candy slots
122. Best horror slots
123. Best 5x3 classic slots
124. Best cluster pays slots of all time
125. Best slots by hit frequency

### Cluster G – Data studies (digital PR / link magnets) (10)
126. The average RTP of 3,000 slots (by provider, year, volatility)
127. Max wins are getting bigger: 10 years of max-win inflation
128. How many slots offer reduced-RTP versions? A study
129. Slot release volume by provider, per year
130. Most common slot themes 2015–[year]
131. Bonus buy price vs RTP across 1,000 games
132. Which providers publish volatility honestly?
133. The "1000" re-release trend analysed
134. Slot theme seasonality (Google Trends + releases)
135. Annual "State of Slots" report

Publishing cadence: 12–15 articles/month for the first 6 months (≈80 by month 6), then 6–8/month.

---

## 5. Comparison pages (50 at launch)

Add pairs to `content/comparisons.json`. Prioritise: (1) sequel vs original ("X vs X 1000"), (2) series siblings, (3) clones across providers, (4) pairs with "[a] vs [b]" search volume. Generated verdicts are data-driven; add a hand-written paragraph for the top 50.

## 6. Update cadence

| Task | Frequency |
|---|---|
| New releases (data + review + demo) | Weekly (Mon–Thu), within 72h of launch |
| "New slots" list | Automatic on deploy |
| Year rollover in titles | Automatic (`SITE.year`), check January 1 |
| Re-verify top-500 slot data | Quarterly |
| Re-verify casino offers / terms | Monthly (weekly for top 3 partners) |
| Refresh "best of [year]" intros | Quarterly |
| Content pruning (pages with 0 clicks in 12 months) | Twice a year – improve, merge (301) or noindex |
