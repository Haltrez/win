/**
 * Feature switches. realMoney=false hides every casino listing, real-money CTA, affiliate disclosure,
 * the /casinos, /go and /affiliate-disclosure routes and their sitemap entries. Flip to true when
 * licensed partners are in place.
 */
export const FEATURES = {
  realMoney: process.env.NEXT_PUBLIC_REAL_MONEY === '1',
} as const;

export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Scatter Drop',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://scatterdrop.com').replace(/\/$/, ''),
  tagline: 'Free slot demos, honest reviews and verified slot data',
  description:
    'Play free slot demos from official providers and read independent reviews with RTP, volatility and max win data. No sign-up, no deposit, 18+ only.',
  locale: 'en',
  /** X/Twitter handle for twitter:site, e.g. "@scatterdrop". Left empty until the account exists. */
  twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE || undefined,
  noindex: process.env.NEXT_PUBLIC_NOINDEX === '1',
  /** Minimum slots before a category page is indexable (thin-content guard). */
  minCategorySize: 6,
  /** Year used in "best X slots [year]" titles. Computed at build time. */
  year: new Date().getFullYear(),
} as const;

export const RG = {
  minAge: 18,
  resources: [
    { name: 'BeGambleAware (UK)', url: 'https://www.begambleaware.org/' },
    { name: 'GAMSTOP self-exclusion (UK)', url: 'https://www.gamstop.co.uk/' },
    { name: 'GamCare helpline (UK)', url: 'https://www.gamcare.org.uk/' },
    { name: 'Gamblers Anonymous', url: 'https://www.gamblersanonymous.org/' },
    { name: '1-800-GAMBLER (US)', url: 'https://www.1800gambler.net/' },
    { name: 'Spelpaus self-exclusion (SE)', url: 'https://www.spelpaus.se/' },
    { name: 'OASIS self-exclusion (DE)', url: 'https://www.oasis-spielerschutz.de/' },
    { name: 'ConnexOntario (CA-ON)', url: 'https://www.connexontario.ca/' },
    { name: 'Gambling Help Online (AU)', url: 'https://www.gamblinghelponline.org.au/' },
    { name: 'Gambling Therapy (international)', url: 'https://www.gamblingtherapy.org/' },
  ],
} as const;

const ALL_NAV = [
  { href: '/slots', label: 'Slots' },
  { href: '/providers', label: 'Providers' },
  { href: '/best', label: 'Best Slots' },
  { href: '/best/new-slots', label: 'New Releases' },
  { href: '/guides', label: 'Guides' },
  { href: '/casinos', label: 'Casinos', realMoney: true },
] as const;

export const NAV = ALL_NAV.filter((n) => !('realMoney' in n) || FEATURES.realMoney);
