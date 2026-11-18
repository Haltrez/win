import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/config';
import { getSlot } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FAQ } from '@/components/FAQ';
import { WidgetBuilder } from '@/components/WidgetBuilder';

export const metadata = buildMetadata({
  title: ['Free Slot Widget: Embed Slot Demos & RTP on Your Site', 'Free Slot Demo Widget for Websites', 'Free Slot Widget'],
  description: 'Add a free slot card to your blog, stream page or forum: game art, official RTP, volatility and max win, with a button to the free demo. One line of code, no sign-up.',
  path: '/widgets',
});

export default function WidgetsPage() {
  const d = getSlot('hacksaw-gaming', 'le-bandit');
  const faq = [
    { q: 'Is the widget free?', a: 'Yes. No sign-up, no API key and no limits. Paste the code wherever you can add HTML.' },
    { q: 'Does it slow my page down?', a: 'No. The script is small, loads asynchronously and only fetches a few hundred bytes of data per card. The game itself never loads on your page – the button opens the free demo on Scatter Drop.' },
    { q: 'Where does the data come from?', a: "RTP, volatility and max win come from each provider's official game page and update automatically when we re-check the data every week." },
    { q: 'Can I use it on a casino or gambling site?', a: 'Yes, but the card always shows an 18+ notice and links to a free demo, not to a real-money casino.' },
  ];
  return (
    <>
      <Breadcrumbs items={[{ name: 'Free slot widget', path: '/widgets' }]} />
      <h1>Free slot widget for your site</h1>
      <section className="prose">
        <p>
          Show any of our slots on your blog, stream page or forum post: the game art, its official RTP, volatility and max win, and a button to play the free demo.
          Data updates automatically every week. Works in WordPress (Custom HTML block), Ghost, Webflow, Notion embeds and any page where you can paste HTML.
        </p>
      </section>
      <WidgetBuilder site={SITE.url} initial={{ id: 'hacksaw-gaming/le-bandit', name: d?.name ?? 'Le Bandit' }} />
      <section className="prose">
        <h2>Good to know</h2>
        <ul>
          <li>The code includes a normal link to the slot&apos;s page, so readers can still reach the demo if scripts are blocked.</li>
          <li>You can add several cards on one page; include the script line once.</li>
          <li>Prefer a full list? Link to our <Link href="/slot-database">slot RTP database</Link> or download it as CSV.</li>
        </ul>
      </section>
      <FAQ items={faq} title="Widget FAQ" />
    </>
  );
}
