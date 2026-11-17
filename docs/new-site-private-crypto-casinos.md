# Private Crypto Casinos – Site Plan & Design Spec

Working name: **shh** (e.g. shhcasinos.com – check availability; any short, brand-safe domain works).
Status: plan only. Built as its own repo + Vercel project, separate from Scatter Drop.

---

## 1. Concept

A privacy-first guide to **no-KYC and low-KYC crypto casinos**: which ones let you play without uploading ID, how fast they pay out, which coins they take, and how to buy crypto and deposit safely.

**Who it's for:** adults who want gambling kept off their bank statements and out of data-broker databases, and who prefer crypto for speed and privacy.

**Brand promise:** *Straight answers on privacy.* We say exactly what each casino asks for, when, and what "anonymous" really means on a public blockchain. No hype, no fake wins.

**Voice:** calm, technical, direct. Short sentences. "You" not "players". Never shouty, no "🔥 BEST 🔥", no countdown timers.

---

## 2. Ground rules (what we publish and what we don't)

Publish:
- Honest KYC facts per casino: no ID at sign-up, when ID *can* still be requested (withdrawal thresholds, AML checks, "source of funds"), and what happened to users who were asked.
- Crypto how-to guides: buying, wallets, deposits, withdrawals, fees, privacy hygiene.
- Each casino's **VPN and restricted-country rules exactly as its terms state them**, with the warning that breaking them usually means **voided winnings and a closed account**.
- Responsible-gambling tools on every casino page (deposit limits, cool-off, self-exclusion at that casino).

Don't publish:
- "How to play with a VPN" / "casinos that work with VPN" / geo-block bypass guides.
- "Casinos not on GamStop / OASIS / Spelpaus" or any page aimed at people who self-excluded.
- Claims that crypto gambling is untraceable or "100% anonymous" (it isn't – see §7.6).
- Fake user reviews, invented win stories, invented bonus terms.
- Content aimed at under-18s or countries where the partner says it doesn't accept players.

These rules are what keep the site rankable (Google YMYL quality), keep affiliate programs happy, and keep the owner out of trouble.

---

## 3. Design system – dark privacy theme

### 3.1 Mood
Late-night terminal meets private bank. Near-black surfaces, one cold accent, mono details for "data". Subtle, not hacker-cliché (no Matrix rain, no green-on-black walls of text).

### 3.2 Colour tokens

```css
:root {
  --bg:          #07080B;  /* page */
  --surface:     #0E1015;  /* cards */
  --surface-2:   #151821;  /* raised / hover */
  --line:        #1F2330;  /* borders, dividers */
  --text:        #E7E9EE;
  --text-dim:    #9AA1B2;
  --text-faint:  #5F6676;
  --accent:      #7CF5C8;  /* mint – primary actions, "verified" */
  --accent-ink:  #04140E;  /* text on accent */
  --warn:        #F5C46B;  /* "KYC on request", caveats */
  --danger:      #FF6B6B;  /* "full KYC", blocked */
  --violet:      #9B8CFF;  /* secondary highlight, links on hover */
  --radius:      14px;
  --shadow:      0 0 0 1px var(--line), 0 12px 40px rgba(0,0,0,.45);
}
```

Light mode: not offered at launch (dark is the brand). Contrast: all text ≥ 4.5:1 on its surface.

### 3.3 Type
- Headings: **Space Grotesk** 600 (tight, technical).
- Body: **Inter** 400/500, 17px, line-height 1.65.
- Data (coins, fees, times, addresses): **JetBrains Mono** 500, slightly smaller, `--text-dim`.
- Load from Google Fonts with `display=swap`; subset Latin.

### 3.4 Motifs
- **Redaction bar**: hero headline has one word "redacted" with a black bar that reveals on hover (e.g. "Play without ███████ your ID").
- **Privacy meter**: 5-segment bar on each casino card (●●●●○) = our KYC score.
- **Mono metadata strip** under titles: `KYC: none at signup · Payout: ~10 min · Coins: BTC ETH USDT SOL LTC`.
- Faint 1px grid background on hero only. No stock photos of cash or people.
- Icons: Lucide (lock, eye-off, shield, zap, wallet).

### 3.5 Key components
| Component | Contents |
|---|---|
| **Casino card** | Logo (light version), privacy meter, KYC badge (`No KYC` mint / `KYC on request` amber / `Full KYC` red), coins row (mono chips), payout speed, welcome offer, promo code (tap to copy), "Visit" button, "Read review" link, `18+ · T&Cs apply` |
| **Comparison table** | Sticky first column; sortable by privacy score, payout speed, min deposit; collapses to cards < 640px |
| **Fact box** (reviews) | Licence, KYC policy (sign-up / withdrawal / triggers), VPN rule per T&Cs, restricted countries, coins, min deposit, withdrawal limits, last checked date |
| **Steps** (guides) | Numbered, each with a mono "what you need" line; renders HowTo schema |
| **Caveat callout** | Amber left border: "Heads-up: …" for honest warnings |
| **Disclosure bar** | Thin top bar: "We earn commission from some casinos. It never changes our scores." |

### 3.6 Performance
Static pages, < 100 KB JS on content pages, logos as WebP/SVG at 2× display size, Lighthouse 95+ on mobile. Same stack as Scatter Drop (Next.js App Router, static generation from JSON/Markdown) so pipelines and checks can be reused.

---

## 4. Site structure (launch ≈ 30 pages)

```
/                                   Home – best no-KYC crypto casinos (ranked table + intro + FAQ)
/no-kyc-casinos                     Pillar: what no-KYC means, full ranked list
/reviews/[casino]                   One per partner (KoalaBet, BitStarz, 7Bit, Mirax, PlayAmo, Cashy, CosmoBet…)
/best/[list]                        bitcoin-casinos, usdt-casinos, solana-casinos, ethereum-casinos,
                                    litecoin-casinos, instant-withdrawal-casinos, low-minimum-deposit-casinos,
                                    crypto-casinos-with-free-spins
/guides/how-to-buy-crypto           (§7.1)
/guides/crypto-wallet-for-gambling  (§7.2)
/guides/how-to-deposit-crypto       (§7.3)
/guides/how-to-withdraw-crypto      (§7.4)
/guides/cheapest-coin-to-deposit    (§7.5 – fees compared)
/guides/is-crypto-gambling-anonymous (§7.6)
/guides/what-is-kyc-at-casinos
/guides/usdt-trc20-vs-erc20
/guides/provably-fair-explained
/guides/crypto-gambling-taxes       (general, "check your country")
/responsible-gambling               Limits, self-exclusion at casinos, help lines
/how-we-rate                        Scoring method (E-E-A-T)
/about, /contact, /affiliate-disclosure, /privacy
```

Internal linking: every review → its coin lists + deposit guide; every guide → 3 relevant reviews + pillar; home → everything top-level.

---

## 5. SEO plan

### 5.1 Keyword clusters (launch targets)
| Cluster | Example searches | Page |
|---|---|---|
| No-KYC core | no kyc casino, no verification casino, crypto casino without id | /, /no-kyc-casinos |
| Coin | usdt casino, solana casino, litecoin casino, trc20 casino | /best/[coin]-casinos |
| Speed | instant withdrawal crypto casino, fast payout bitcoin casino | /best/instant-withdrawal-casinos |
| Brand | koalabet review, koalabet bonus code, 7bit casino kyc | /reviews/[casino] |
| How-to | how to buy usdt, how to deposit crypto at casino, best wallet for casino | /guides/* |
| Privacy questions | is crypto gambling anonymous, do crypto casinos report to bank | /guides/is-crypto-gambling-anonymous |

Start with **brand + coin + how-to** (winnable long-tail); the broad "no kyc casino" head term comes later.

### 5.2 On-page templates
- **Title** (≤ 60 chars): `{Casino} Review {Year}: KYC, Payouts & Bonus` · `Best {Coin} Casinos {Year}: No-KYC Picks` · `How to Buy {Coin} for Casino Deposits (Step by Step)`
- **Meta description** (≤ 155): lead with the answer + one number ("Withdrawals in ~10 min, no ID at sign-up…").
- **H1** = the search phrase in natural wording; first sentence answers it.
- **Last checked** date visible on every review and list (and `dateModified` in schema).
- FAQ block (4–6 real questions) on every list and review.

### 5.3 Structured data
- `Organization` + `WebSite` (sitewide).
- `ItemList` on lists (casinos in ranked order).
- `HowTo` on step guides; `FAQPage` where FAQs exist.
- `Article` on guides with author + `dateModified`.
- Do **not** use `Review`/`AggregateRating` stars for casinos (Google ignores/penalises self-serving gambling review stars).

### 5.4 Technical
- Canonical URLs, XML sitemap (split by type), `robots.txt`, IndexNow on publish.
- Clean outbound affiliate links via `/go/[casino]` (302, `rel="sponsored nofollow"`), `/go/` disallowed in robots.
- Per-casino country exclusions handled like Scatter Drop (`geos` with `!XX`), US excluded where partners don't accept it.
- No intrusive interstitials; age gate as a light banner, not a wall.
- hreflang later (es / pt / de) once English ranks.

### 5.5 E-E-A-T
- `/how-we-rate` explains the privacy score (KYC at sign-up 40%, KYC triggers 20%, payout speed 20%, coin choice 10%, licence/terms clarity 10%).
- Real author bio (pen name fine), "last checked" dates, sources linked (casino T&Cs pages).
- Honest negatives in every review ("Cons" section is mandatory).

---

## 6. Casino review template

1. **Verdict** (2–3 sentences, the answer first) + privacy meter + mono metadata strip.
2. **Fact box** (§3.5) – every field sourced from the casino's own T&Cs/FAQ, with "last checked" date.
3. **KYC in practice** – what's needed to sign up, deposit, withdraw; thresholds; what triggers checks.
4. **VPN & country rules** – quoted/summarised from T&Cs + the warning: breaking them can void winnings.
5. **Deposits & withdrawals** – coins, networks, minimums, fees, real payout times (only if verified).
6. **Bonus** – offer + promo code; no wagering details unless the partner wants them shown.
7. **Games & providers.**
8. **Pros / Cons** (both mandatory).
9. **Responsible gambling tools** at this casino.
10. **FAQ.**

---

## 7. Guide outlines

### 7.1 How to buy crypto for casino deposits
1. Pick a coin (link 7.5): USDT on TRC20 or LTC for low fees; BTC if the casino favours it.
2. Buy on a regulated exchange or app (they **will** ask for ID – that's the exchange, not the casino).
3. Alternative ways people buy: bank card in a wallet app, P2P – with honest pros/cons and scam warnings.
4. Move it to your own wallet before depositing (why: casinos' deposit addresses + exchange rules).
5. Common mistakes: wrong network, minimum amounts, fees eating small deposits.

### 7.2 Choosing a wallet
Self-custody vs exchange wallet, mobile wallets that support TRC20/SOL/LTC, seed phrase safety, using a separate wallet just for gambling (cleaner records, easier budgeting).

### 7.3 How to deposit crypto at a casino (step by step, HowTo schema)
Copy address → match coin **and network** → send test amount → confirmations → credited. Screens described generically; "what you need" line per step.

### 7.4 How to withdraw
Network choice, minimums, typical times, when withdrawals trigger checks, sending back to your own wallet then to exchange.

### 7.5 Cheapest coin to deposit
Table: coin · network · typical fee range · speed · notes. Updated monthly; "fees change, check before sending".

### 7.6 Is crypto gambling anonymous? (the trust page)
Honest answer: **private, not anonymous.** Exchanges keep ID records; blockchains are public; a no-KYC casino means the *casino* doesn't hold your ID, and gambling doesn't show on your bank statement as a casino payment. Practical privacy hygiene: separate wallet, don't reuse addresses, keep records for taxes. This page earns links and trust.

---

## 8. Monetisation

- Partners at launch: KoalaBet, BitStarz, 7Bit, Mirax, PlayAmo, Cashy (+ CosmoBet if signed) – reuse existing tracking links and promo codes.
- Paid placements (featured #1, list sponsorship) labelled **"Featured"**; ranking tables stay score-based so the site stays credible.
- Track clicks per casino/page/position from day one (same `/go` logging as Scatter Drop) for renewal reports.

---

## 8a. VPN content & VPN referrals

VPNs fit the privacy brand and pay well (VPN affiliate programs typically pay per sale or recurring %). The angle is **general privacy**, not getting around casino or country restrictions.

**Publish (with VPN referral links):**
- `/guides/best-vpn-for-privacy` – compared on no-logs audits, jurisdiction, kill switch, crypto payment accepted, price.
- `/guides/vpn-and-crypto-privacy` – hiding your browsing from your ISP and network, protecting exchange and wallet logins on public Wi-Fi, paying for a VPN with crypto.
- `/guides/private-browsing-setup` – browser, VPN, separate email, 2FA, wallet hygiene: the full privacy stack.
- VPN mentions inside the crypto guides (§7) where they genuinely help, e.g. "logging into your exchange on hotel Wi-Fi".

**Casino pages:** each review keeps the factual "VPN & country rules" field from the casino's T&Cs, plus this standard disclaimer:

> **VPN notice:** A VPN protects your privacy online, but it doesn't change where you're allowed to gamble. Most casinos' terms forbid using a VPN to access them from a restricted country, and they can close the account and keep the winnings if they detect it. Only play where online gambling is legal for you.

**Don't publish:** "casinos that work with VPN" lists, "how to play [casino] from [blocked country]" guides, or VPN links placed on casino pages as a way in. Those are geo-block bypass guides even with a disclaimer, and they send readers into voided withdrawals.

## 9. Launch checklist

1. Register domain; create empty GitHub repo (e.g. `haltrez/shh`); connect to Vercel.
2. Build design system + templates (§3, §6).
3. Write and fact-check 7 reviews, 8 lists, 10 guides, trust pages (≈ 30 pages).
4. Validate: titles/descriptions length, schema, links, mobile 375px, Lighthouse.
5. Submit sitemap in Search Console; IndexNow; request indexing for home + pillar + top 8 pages.
6. Weekly after launch: 2 guides + 1–2 reviews/lists, monthly fact re-check of every casino ("last checked" dates).
