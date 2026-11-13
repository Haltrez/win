import type { CategoryDef, Mechanic, Slot, Theme } from './types';
import { SITE } from './config';
import { releaseKey, volScore } from './format';
import { getSlots } from './data';

/**
 * Category ("best of" / list) pages are rule-based: each definition is a filter over slot data,
 * so pages grow automatically as the catalogue grows. Pages with fewer than SITE.minCategorySize
 * slots are rendered but set to noindex and excluded from the sitemap (thin-content guard).
 */
const mw = (s: Slot) => s.maxWin ?? 0;
const byRating = (a: Slot, b: Slot) => (b.rating ?? 0) - (a.rating ?? 0) || mw(b) - mw(a) || releaseKey(b).localeCompare(releaseKey(a));
const byMaxWin = (a: Slot, b: Slot) => mw(b) - mw(a);
const byRtp = (a: Slot, b: Slot) => (b.rtp ?? 0) - (a.rtp ?? 0);
const byNewest = (a: Slot, b: Slot) => releaseKey(b).localeCompare(releaseKey(a));
const has = (m: Mechanic) => (s: Slot) => s.mechanics.includes(m);
const theme = (t: Theme) => (s: Slot) => s.themes.includes(t);

type Def = Omit<CategoryDef, 'metaTitle' | 'metaDescription'> & { metaTitle?: string; metaDescription?: string; kw: string };

const mech: [Mechanic | Mechanic[], string, string, string, string[]?][] = [
  ['megaways', 'megaways-slots', 'Megaways Slots', 'Megaways slots change the number of symbols on each reel every spin, creating up to 117,649 (or more) ways to win. The format was invented by Big Time Gaming and licensed to many other studios.', ['what-is-megaways']],
  ['bonus-buy', 'bonus-buy-slots', 'Bonus Buy Slots', 'Bonus buy (feature buy) slots let you pay a fixed multiple of your stake to go straight to the bonus round. Almost every game below has a free demo, and most official demos let you try the bonus buy with play money, so you can see what a bought bonus really pays before risking anything. Bonus buys are banned in some markets, including Great Britain, and they do not change the long-term RTP in your favour.', ['bonus-buy-explained']],
  ['cluster-pays', 'cluster-pays-slots', 'Cluster Pays Slots', 'Cluster pays slots award wins for groups of matching symbols touching horizontally or vertically, instead of paylines.', ['cluster-pays-explained']],
  ['pay-anywhere', 'pay-anywhere-slots', 'Pay Anywhere Slots', 'Pay-anywhere (scatter pays) slots pay when enough matching symbols land anywhere on the grid – no lines or adjacency needed.'],
  [['tumble', 'cascades'], 'tumbling-reels-slots', 'Tumbling & Cascading Reels Slots', 'In tumbling or cascading slots, winning symbols disappear and new ones drop in, allowing several wins from a single paid spin.'],
  ['sticky-wilds', 'sticky-wilds-slots', 'Sticky Wilds Slots', 'Sticky wilds stay in place for several spins – usually throughout a free spins round – which can build towards big line wins.'],
  ['hold-and-win', 'hold-and-win-slots', 'Hold and Win Slots', 'Hold and win (or "cash collect respins") slots lock bonus symbols in place and reset a respin counter each time a new one lands.'],
  ['money-collect', 'money-collect-slots', 'Money Collect Slots', 'Collect slots feature cash-value symbols that are gathered by a collector symbol – the fishing slots popularised by Fishin\' Frenzy and Big Bass Bonanza are the best-known examples.'],
  ['multipliers', 'multiplier-slots', 'Slots with Multipliers', 'These slots feature multipliers that boost wins – from wild multipliers to grid spots and persistent bonus multipliers.'],
  ['progressive-multiplier', 'progressive-multiplier-slots', 'Slots with Progressive Multipliers', 'Progressive multiplier slots increase a win multiplier after each cascade or win during a feature, often without resetting.'],
  ['expanding-symbols', 'book-slots', 'Book Slots (Expanding Symbols)', 'Book slots pick a special expanding symbol before free spins; it expands to cover whole reels during the bonus. Book of Dead defined the genre.'],
  ['expanding-wilds', 'expanding-wilds-slots', 'Expanding Wilds Slots', 'Expanding wilds grow to cover an entire reel, often with a respin or multiplier attached.'],
  ['walking-wilds', 'moving-wilds-slots', 'Moving & Walking Wilds Slots', 'Wilds that move across the grid between spins or cascades, creating new wins as they go.'],
  [['xways', 'xnudge', 'xbomb'], 'nolimit-x-mechanics-slots', 'xWays, xNudge & xBomb Slots', 'Slots using Nolimit City\'s proprietary x-mechanics, known for extreme volatility.'],
  ['grid-expansion', 'expanding-grid-slots', 'Expanding Grid Slots', 'Slots where rows or reels unlock during play, increasing the number of ways to win.'],
  ['jackpot', 'jackpot-slots', 'Jackpot Slots', 'Slots with fixed or progressive jackpots in addition to regular line or cluster wins.'],
  ['respins', 'respin-slots', 'Respin Slots', 'Respin features re-spin some or all reels for free when a trigger lands.'],
  ['gamble', 'gamble-feature-slots', 'Slots with a Gamble Feature', 'Slots with an optional gamble step. Gamble features can lose a win entirely; many regulators restrict them.'],
  ['ante-bet', 'ante-bet-slots', 'Ante Bet Slots', 'Ante bet slots let you increase your stake to raise the chance of triggering free spins. It raises the cost of every spin.'],
  ['free-spins', 'free-spins-slots', 'Slots with Free Spins Bonus Rounds', 'Slots with a free spins round – still the most common bonus feature in online slots.'],
  ['reel-modifiers', 'random-modifier-slots', 'Slots with Random Modifiers', 'Slots with random features that can trigger on any spin to transform symbols, add wilds or reshape the grid.'],
];

const themes: [Theme, string, string][] = [
  ['mythology', 'mythology-slots', 'Mythology Slots'], ['egypt', 'egyptian-slots', 'Egyptian Slots'], ['western', 'western-slots', 'Wild West Slots'],
  ['fruit', 'fruit-slots', 'Fruit Slots'], ['candy', 'candy-slots', 'Candy & Sweets Slots'], ['fishing', 'fishing-slots', 'Fishing Slots'],
  ['animals', 'animal-slots', 'Animal Slots'], ['horror', 'horror-slots', 'Horror Slots'], ['adventure', 'adventure-slots', 'Adventure Slots'],
  ['fantasy', 'fantasy-slots', 'Fantasy Slots'], ['space', 'space-slots', 'Space Slots'], ['classic', 'classic-slots', 'Classic Slots'],
  ['asian', 'asian-themed-slots', 'Asian-Themed Slots'], ['crime', 'crime-heist-slots', 'Crime & Heist Slots'], ['music', 'music-slots', 'Music Slots'],
  ['gems', 'gem-slots', 'Gem & Jewel Slots'], ['sci-fi', 'sci-fi-slots', 'Sci-Fi Slots'], ['dogs', 'dog-slots', 'Dog Slots'], ['food', 'food-slots', 'Food Slots'],
  ['history', 'historical-slots', 'Historical Slots'], ['pirates', 'pirate-slots', 'Pirate Slots'], ['irish', 'irish-slots', 'Irish & Lucky Slots'],
];

function defs(): Def[] {
  const out: Def[] = [
    // ---- Max win
    { slug: 'highest-max-win-slots', title: 'Highest Max Win Slots', kw: 'highest max win slots', group: 'max-win', yearly: true, intro: 'The slots with the biggest maximum win potential, ranked by max win multiplier. A high max win usually comes with very high volatility – the cap is a theoretical ceiling that most players will never reach.', filter: (s) => mw(s) >= 10000, sort: byMaxWin, relatedGuides: ['how-max-win-works', 'slot-max-win-inflation', 'slot-volatility-explained'],
      faq: [{ q: 'What is a max win in slots?', a: 'The max win is the largest payout a slot allows on a single spin or bonus round, expressed as a multiple of your stake. If a slot has a 10,000x max win and you bet €1, the most you can win from one round is €10,000.' }, { q: 'Does a higher max win mean a better slot?', a: 'Not necessarily. Higher max wins usually mean higher volatility: wins are less frequent and most sessions end with smaller results. Choose based on how much variance you are comfortable with.' }] },
    { slug: '5000x-max-win-slots', title: 'Slots with 5,000x+ Max Win', kw: '5000x max win slots', group: 'max-win', intro: 'Slots where the maximum win is at least 5,000 times the stake.', filter: (s) => mw(s) >= 5000, sort: byMaxWin, relatedGuides: ['how-max-win-works'] },
    { slug: '10000x-max-win-slots', title: 'Slots with 10,000x+ Max Win', kw: '10000x max win slots', group: 'max-win', intro: 'Slots that can pay 10,000x your stake or more on a single round.', filter: (s) => mw(s) >= 10000, sort: byMaxWin, relatedGuides: ['how-max-win-works', 'slot-max-win-inflation'] },
    { slug: '20000x-max-win-slots', title: 'Slots with 20,000x+ Max Win', kw: '20000x max win slots', group: 'max-win', intro: 'Slots with a max win of 20,000x or more.', filter: (s) => mw(s) >= 20000, sort: byMaxWin, relatedGuides: ['how-max-win-works', 'slot-max-win-inflation'] },
    { slug: '50000x-max-win-slots', title: 'Slots with 50,000x+ Max Win', kw: '50000x max win slots', group: 'max-win', intro: 'Slots with a max win of 50,000x or more – almost always extremely volatile.', filter: (s) => mw(s) >= 50000, sort: byMaxWin, relatedGuides: ['how-max-win-works', 'slot-max-win-inflation'] },
    { slug: '100000x-max-win-slots', title: 'Slots with 100,000x+ Max Win', kw: '100000x max win slots', group: 'max-win', intro: 'The six-figure club: slots advertising 100,000x or more.', filter: (s) => mw(s) >= 100000, sort: byMaxWin, relatedGuides: ['how-max-win-works', 'slot-max-win-inflation'] },
    { slug: 'low-max-win-slots', title: 'Low Max Win Slots (Under 2,500x)', kw: 'low max win slots', group: 'max-win', intro: 'Slots with modest caps. These often pay more frequently and are gentler on a bankroll.', filter: (s) => s.maxWin != null && s.maxWin < 2500, sort: byRating },
    // ---- Volatility
    { slug: 'high-volatility-slots', title: 'Best High Volatility Slots', kw: 'high volatility slots', group: 'volatility', yearly: true, intro: 'High volatility slots pay less often but can pay much more when they do. Expect long losing stretches – these games suit players who set a strict budget and treat big hits as rare.', filter: (s) => volScore(s.volatility) >= 5, sort: byRating, relatedGuides: ['slot-volatility-explained', 'bankroll-management-for-slots'],
      faq: [{ q: 'What does high volatility mean in slots?', a: 'High volatility means a slot\'s returns are concentrated in fewer, larger wins. You will see more non-winning spins and bigger swings in your balance than on a low volatility slot with the same RTP.' }] },
    { slug: 'very-high-volatility-slots', title: 'Extreme (Very High) Volatility Slots', kw: 'extreme volatility slots', group: 'volatility', yearly: true, intro: 'The most volatile slots available – usually from studios like Nolimit City and Hacksaw Gaming.', filter: (s) => s.volatility === 'very-high', sort: byMaxWin, relatedGuides: ['slot-volatility-explained'] },
    { slug: 'medium-volatility-slots', title: 'Best Medium Volatility Slots', kw: 'medium volatility slots', group: 'volatility', yearly: true, intro: 'Medium volatility slots balance win frequency and win size – a good middle ground for longer sessions.', filter: (s) => ['medium', 'medium-low', 'medium-high'].includes(s.volatility ?? ''), sort: byRating, relatedGuides: ['slot-volatility-explained'] },
    { slug: 'low-volatility-slots', title: 'Best Low Volatility Slots', kw: 'low volatility slots', group: 'volatility', yearly: true, intro: 'Low volatility slots pay small wins frequently. Big wins are rare and max wins are lower, but your balance tends to move more slowly.', filter: (s) => s.volatility != null && volScore(s.volatility) <= 2, sort: byRating, relatedGuides: ['slot-volatility-explained'] },
    // ---- RTP
    { slug: 'high-rtp-slots', title: 'High RTP Slots (96.5%+)', kw: 'high rtp slots', group: 'rtp', yearly: true, intro: 'Slots whose highest published RTP configuration is 96.5% or more. Casinos can choose lower RTP versions of the same game, so always check the info screen before you play.', filter: (s) => (s.rtp ?? 0) >= 96.5, sort: byRtp, relatedGuides: ['rtp-explained'],
      faq: [{ q: 'Does a higher RTP mean I will win?', a: 'No. RTP is a long-term theoretical average measured over millions of spins. In any single session the result can be very different, especially on high volatility slots.' }] },
    { slug: '97-rtp-slots', title: 'Slots with 97% RTP or Higher', kw: '97% rtp slots', group: 'rtp', intro: 'The rare slots with a default RTP of 97% or above.', filter: (s) => (s.rtp ?? 0) >= 97, sort: byRtp, relatedGuides: ['rtp-explained'] },
    { slug: 'variable-rtp-slots', title: 'Slots with Multiple RTP Versions', kw: 'slots with different rtp', group: 'rtp', intro: 'These slots are offered to casinos in several RTP configurations. The same game can return noticeably less at one casino than another.', filter: (s) => (s.rtpVariants?.length ?? 0) > 0, sort: byRtp, relatedGuides: ['rtp-explained', 'how-to-check-slot-rtp'] },
    // ---- Release
    { slug: 'new-slots', title: 'New Slot Releases', kw: 'new slots', group: 'release', intro: 'The latest slot releases we have reviewed, newest first. We add new games every week.', filter: () => true, sort: byNewest },
    { slug: 'best-slots', title: 'Best Online Slots', kw: 'best online slots', group: 'style', yearly: true, intro: 'Our highest-rated slots across every provider, based on gameplay, features, fairness of the maths and how they hold up across repeated demo sessions.', filter: () => true, sort: byRating, relatedGuides: ['how-we-review-slots'] },
    { slug: 'classic-retro-slots', title: 'Retro Slots (Released Before 2016)', kw: 'old classic slots', group: 'release', intro: 'Slots that defined the online era and are still worth playing.', filter: (s) => s.releaseDate != null && s.releaseDate < '2016-01-01', sort: byRating },
    { slug: 'streamer-favourite-slots', title: 'Popular High-Variance Bonus Slots', kw: 'popular bonus slots', group: 'style', intro: 'High-variance slots with multi-stage bonus rounds that are popular in the slot community. Popularity says nothing about your odds.', filter: (s) => volScore(s.volatility) >= 5 && mw(s) >= 10000 && s.mechanics.includes('free-spins'), sort: byRating },
    { slug: 'simple-slots-for-beginners', title: 'Simple Slots for Beginners', kw: 'easy slots for beginners', group: 'style', intro: 'Slots with straightforward rules and one or two features – ideal for learning in demo mode.', filter: (s) => s.mechanics.length <= 4, sort: byRating, relatedGuides: ['how-slots-work'] },
  ];
  // ---- Popular game series (searched by name)
  const byName = (re: RegExp, prov?: string) => (s: Slot) => re.test(s.name) && (!prov || s.provider === prov);
  const series: [string, string, string, string, (s: Slot) => boolean][] = [
    ['super-scatter-slots', 'Super Scatter Slots', 'super scatter slots', 'Pragmatic Play\'s Super Scatter editions add a special scatter that pays an instant prize – up to 50,000x when four land – whenever it helps trigger the bonus.', byName(/super scatter/i)],
    ['big-bass-slots', 'Big Bass Slots – Every Edition', 'big bass slots', 'Every Big Bass game we cover: the fishing series where a fisherman wild collects fish money symbols in free spins, with retriggers that raise the win multiplier.', byName(/big bass/i)],
    ['pragmatic-1000-slots', 'Pragmatic Play 1000 Editions', 'pragmatic 1000 slots', 'The "1000" editions of Pragmatic Play hits raise multiplier caps (often to 1,000x) and max wins compared with the originals, with the same core gameplay.', byName(/\b(1000|2500)\b/, 'pragmatic-play')],
    ['dog-house-slots', 'The Dog House Slots – Every Edition', 'dog house slots', 'Every Dog House game: Pragmatic Play\'s dog-themed series built on multiplier wilds that stay sticky in free spins.', byName(/dog house/i)],
    ['gates-of-olympus-slots', 'Gates of Olympus Slots – Every Edition', 'gates of olympus slots', 'Every Gates of Olympus version, from the 2021 original to the 1000, 2500 and Super Scatter editions – all pay-anywhere tumble slots with Zeus\'s multipliers.', byName(/gates of olympus/i)],
    ['sweet-bonanza-slots', 'Sweet Bonanza Slots – Every Edition', 'sweet bonanza slots', 'Every Sweet Bonanza version: the candy pay-anywhere series with tumbles and multiplier bombs in free spins.', byName(/sweet bonanza/i)],
    ['hacksaw-le-series-slots', 'Hacksaw "Le" Series Slots (Smokey)', 'hacksaw le slots', 'Every game in Hacksaw Gaming\'s "Le" series starring Smokey the raccoon, from Le Bandit onwards – mostly cluster games with golden squares, rainbows and coins.', byName(/^Le /, 'hacksaw-gaming')],
  ];
  for (const [slug, title, kw, intro, filter] of series) out.push({ slug, title, kw, group: 'style', intro, filter, sort: byRating });
  for (const [m, slug, title, intro, guides] of mech) {
    const ms = Array.isArray(m) ? m : [m];
    out.push({ slug, title: `Best ${title}`, kw: title.toLowerCase(), group: 'mechanics', yearly: true, intro, filter: (s) => ms.some((x) => s.mechanics.includes(x)), sort: byRating, relatedGuides: guides });
  }
  for (const [t, slug, title] of themes) {
    out.push({ slug, title: `Best ${title}`, kw: title.toLowerCase(), group: 'themes', yearly: true, intro: `Our pick of the best ${title.toLowerCase()} from every major studio, with free demos and full stats.`, filter: theme(t), sort: byRating });
  }
  // Release-year lists generated from data
  const years = [...new Set(getSlots().filter((s) => s.releaseDate).map((s) => s.releaseDate!.slice(0, 4)))].sort().reverse();
  for (const y of years) {
    out.push({ slug: `slots-released-in-${y}`, title: `Best Slots Released in ${y}`, kw: `best slots ${y}`, group: 'release', intro: `The best slots released in ${y}, ranked by our review score.`, filter: (s) => !!s.releaseDate?.startsWith(y), sort: byRating });
  }
  return out;
}

let _cats: CategoryDef[] | null = null;
export function getCategories(): CategoryDef[] {
  if (_cats) return _cats;
  _cats = defs().map((d) => {
    const y = d.yearly ? ` ${SITE.year}` : '';
    // Search-intent overrides for lists Search Console shows us ranking for.
    if (d.slug === 'bonus-buy-slots') {
      const n = getSlots().filter(d.filter).length;
      d = {
        ...d,
        metaTitle: `Bonus Buy Slots${y}: Free Demo Play`,
        metaDescription: `Compare ${n} bonus buy slots by RTP, volatility and max win, and try the feature buy free in demo mode with play money. No sign-up, 18+.`,
      };
    }
    return {
      ...d,
      title: d.title + y,
      metaTitle: d.metaTitle ? [d.metaTitle] : [`${d.title}${y} – Free Demos, RTP & Max Win`, `${d.title}${y} – Free Demos & RTP`, `${d.title}${y} – Free Demos`, `${d.title}${y}`],
      metaDescription:
        d.metaDescription ??
        `${d.title}${y}: play free demos and compare RTP, volatility and max win for every game. Independent reviews, 18+.`,
    };
  });
  return _cats;
}
export const getCategory = (slug: string) => getCategories().find((c) => c.slug === slug);
export function getCategorySlots(c: CategoryDef): Slot[] {
  return getSlots().filter(c.filter).sort(c.sort ?? byRating);
}
export const isIndexable = (c: CategoryDef) => getCategorySlots(c).length >= SITE.minCategorySize;
/** Categories a slot belongs to (for internal linking from slot pages). */
export function getCategoriesForSlot(s: Slot, limit = 8): CategoryDef[] {
  return getCategories().filter((c) => c.filter(s) && isIndexable(c) && !['new-slots', 'best-slots', 'free-spins-slots'].includes(c.slug)).slice(0, limit);
}
