export type Volatility = 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high' | 'very-high';

/** Mechanic / feature tags. Category pages are built from these, so keep the vocabulary controlled. */
export type Mechanic =
  | 'megaways' | 'cluster-pays' | 'scatter-pays' | 'pay-anywhere' | 'ways' | 'paylines'
  | 'bonus-buy' | 'free-spins' | 'multipliers' | 'tumble' | 'sticky-wilds' | 'expanding-wilds'
  | 'walking-wilds' | 'hold-and-win' | 'xways' | 'xnudge' | 'xbomb' | 'cascades' | 'gamble'
  | 'progressive-multiplier' | 'expanding-symbols' | 'money-collect' | 'jackpot' | 'respins'
  | 'infectious-wilds' | 'reel-modifiers' | 'grid-expansion' | 'ante-bet';

export type Theme =
  | 'mythology' | 'egypt' | 'western' | 'fruit' | 'candy' | 'fishing' | 'animals' | 'horror'
  | 'adventure' | 'fantasy' | 'space' | 'classic' | 'asian' | 'crime' | 'pirates' | 'music'
  | 'irish' | 'dogs' | 'gems' | 'history' | 'sci-fi' | 'food';

export interface Slot {
  slug: string;
  name: string;
  provider: string; // provider slug
  /** Default (highest) published RTP in %. Operators may run lower configurations. */
  rtp: number;
  /** Other RTP configurations the provider offers operators. */
  rtpVariants?: number[];
  volatility: Volatility;
  /** Max win as a multiplier of the base stake. */
  maxWin: number;
  releaseDate: string; // ISO yyyy-mm-dd
  reels: string; // e.g. "6x5", "5x3"
  paylines: string; // e.g. "Pay anywhere", "20", "117,649 ways"
  minBet?: number;
  maxBet?: number;
  hitFrequency?: number; // %
  mechanics: Mechanic[];
  themes: Theme[];
  /** Human-readable feature list shown on the page. */
  features: { name: string; description: string }[];
  /** Short original editorial review (Markdown allowed). 120+ words recommended. */
  review: string;
  /** Notes from the reviewer's own demo session. Only rendered when present – never fabricated. */
  playNotes?: { spins: number; bonusTriggers?: number; bestWinX?: number; notes: string; testedOn: string };
  pros: string[];
  cons: string[];
  /** Official provider demo URL. MUST be on the provider's allowlisted demo domains. */
  demoUrl?: string | null;
  image?: string | null;
  /** Editorial score out of 10. */
  rating?: number;
  related?: string[]; // slot slugs (same or other providers)
  faq?: { q: string; a: string }[];
  /** Data provenance */
  sources?: string[];
  lastVerified?: string | null;
  verified?: boolean;
  updatedAt: string;
  author: string;
}

export interface Provider {
  slug: string;
  name: string;
  founded?: number;
  headquarters?: string;
  licenses: string[];
  website: string;
  /** Hostnames allowed for demo embeds from this provider (official demo servers only). */
  demoDomains: string[];
  description: string;
  signatureMechanics?: string[];
  tier: 1 | 2 | 3;
}

export interface Casino {
  slug: string;
  name: string;
  /** Licences held, e.g. "UKGC 00000", "MGA/B2C/000/0000". Verify before publishing. */
  licenses: string[];
  /** ISO-3166 alpha-2 countries where the operator is licensed AND you hold an affiliate agreement. */
  geos: string[];
  /** Affiliate tracking URLs per geo; "default" used when geo allowed but no specific link. */
  links: Record<string, string>;
  bonus: Record<string, string>; // per geo or "default"
  terms: string; // short significant terms – required for UK/compliance
  minDeposit?: string;
  wagering?: string;
  providers: string[]; // provider slugs available at the casino
  rating: number;
  pros: string[];
  placeholder?: boolean;
}

export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  sameAs?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: 'basics' | 'strategy' | 'mechanics' | 'responsible-gambling' | 'regional' | 'providers' | 'comparisons';
  author: string;
  publishedAt: string;
  updatedAt: string;
  faq?: { q: string; a: string }[];
  relatedCategories?: string[];
  relatedSlots?: string[];
  html: string;
  readingMinutes: number;
}

export interface CategoryDef {
  slug: string;
  title: string; // H1 (year appended automatically when `yearly`)
  metaTitle: string;
  metaDescription: string;
  intro: string;
  /** Selection rule */
  filter: (s: Slot) => boolean;
  sort?: (a: Slot, b: Slot) => number;
  yearly?: boolean;
  group: 'max-win' | 'volatility' | 'mechanics' | 'themes' | 'rtp' | 'release' | 'style';
  relatedGuides?: string[];
  faq?: { q: string; a: string }[];
}
