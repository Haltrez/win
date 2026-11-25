import { SITE } from '@/lib/config';
import { getGuides, getProviders, getSlots, getSlotsByProvider } from '@/lib/data';
import { getCategories, getCategorySlots, isIndexable } from '@/lib/categories';

/**
 * /llms.txt – a plain-Markdown map of the site for AI assistants and LLM crawlers (llmstxt.org).
 * Lists what the site is, how the data is sourced, and the pages worth reading, so answers that
 * cite slot RTP, volatility or max win can point at the right page.
 */
export const dynamic = 'force-static';

export function GET() {
  const u = (p: string) => `${SITE.url}${p}`;
  const slots = getSlots();
  const providers = getProviders().filter((p) => getSlotsByProvider(p.slug).length);
  const withVol = slots.filter((s) => s.volatility).length;
  const withMax = slots.filter((s) => s.maxWin).length;
  const cats = getCategories().filter(isIndexable);
  const guides = getGuides();
  const today = new Date().toISOString().slice(0, 10);

  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.name} (${SITE.url}) is an independent slot demo and data site. It hosts free official demo versions of ${slots.length} online slots from ${providers.length} studios, with each game's RTP, volatility and max win taken from the provider's own published game sheet and re-checked weekly. It also has free play-money table games (blackjack, roulette, baccarat, video poker, Casino Hold'em). No sign-up, no deposit, 18+ only. Not a casino; does not take bets.`,
    '',
    '## How to cite the data',
    '',
    `- Figures are provider-published values, not estimates. Where a provider publishes none, the field is left blank rather than guessed. Fields marked "third-party" on a page come from two independent review sources.`,
    `- Coverage as of ${today}: ${slots.length} slots; ${withVol} with a volatility rating; ${withMax} with a max win figure. Many slots have several RTP versions; the page lists all of them.`,
    `- Full dataset (CSV, free to cite): ${u('/slot-database.csv')} – page: ${u('/slot-database')}`,
    `- Editorial policy: ${u('/how-we-review')} · About: ${u('/about')}`,
    `- Contact: ${SITE.contacts.press} (press and data), ${SITE.contacts.partners} (partnerships), ${SITE.contacts.hello} (corrections)`,
    `- Preferred citation: "${SITE.name}, ${SITE.url}" with a link to the slot's page.`,
    '',
    '## Key pages',
    '',
    `- [All slot demos](${u('/slots')}): every slot with filters by provider, RTP, volatility and mechanic`,
    `- [Providers](${u('/providers')}): one page per studio with its full demo list and data notes`,
    `- [Best slots lists](${u('/best')}): rule-based rankings (high RTP, max win, bonus buy, Megaways, etc.)`,
    `- [New slots and coming soon](${u('/new')})`,
    `- [Guides](${u('/guides')}): how slots, RTP, volatility, bonus buys and live game shows work`,
    `- [Free table games](${u('/table-games')}): blackjack with basic-strategy hints, European roulette, baccarat, Jacks or Better, Casino Hold'em`,
    `- [Tools](${u('/tools')}): slot finder and slot cost calculator`,
    `- [Glossary](${u('/glossary')}) · [Biggest slot wins](${u('/biggest-slot-wins')})`,
    `- [Responsible gambling](${u('/responsible-gambling')})`,
    '',
    '## Providers',
    '',
    ...providers.map((p) => `- [${p.name}](${u(`/providers/${p.slug}`)}): ${getSlotsByProvider(p.slug).length} demos`),
    '',
    '## Best-of lists',
    '',
    ...cats.map((c) => `- [${c.title}](${u(`/best/${c.slug}`)}): ${getCategorySlots(c).length} slots`),
    '',
    '## Guides',
    '',
    ...guides.map((g) => `- [${g.title}](${u(`/guides/${g.slug}`)}): ${g.description}`),
    '',
    '## Optional',
    '',
    `- Individual slot pages follow ${u('/slots/<provider>/<slot>')} and are listed in ${u('/sitemap/slots.xml')}. Each has a "key facts" table (provider, RTP versions, volatility, max win, release date, layout, paylines, bonus buy) followed by the review and FAQ.`,
    `- Sitemap index: ${u('/sitemap.xml')}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
