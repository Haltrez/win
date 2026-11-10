import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { fmtDate } from '@/lib/format';
import { getUpdates, LAUNCH_BATCH } from '@/lib/updates';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SlotGrid } from '@/components/SlotCard';

export function generateMetadata() {
  const u = getUpdates()[0];
  return buildMetadata({
    title: ['New This Week: Latest Slots & Guides Added', 'New Slots This Week', 'New This Week'],
    description: `What's new on Scatter Drop: ${u ? `${u.slots.length} slots and ${u.guides.length} guide${u.guides.length === 1 ? '' : 's'} added on ${fmtDate(u.date)}` : 'the latest slots and guides'}, each with an official free demo and verified data. Updated every week.`,
    path: '/new',
  });
}

export default function NewPage() {
  const updates = getUpdates();
  return (
    <>
      <Breadcrumbs items={[{ name: 'New this week', path: '/new' }]} />
      <h1>New this week</h1>
      <section className="prose">
        <p>
          Every week we add new slots from the providers&apos; official game lists, re-check existing data and publish a new guide. This page lists each update.
          Follow along with the <a href="/feed.xml">RSS feed</a>, or see games by release date in <Link href="/best/new-slots">new slot releases</Link>.
        </p>
      </section>
      {updates.map((u, i) => (
        <section key={u.date} className="update" aria-labelledby={`u-${u.date}`}>
          <h2 id={`u-${u.date}`}>
            {i === 0 ? 'Latest update' : 'Update'} · <time dateTime={u.date}>{fmtDate(u.date)}</time>
          </h2>
          {u.slots.length > LAUNCH_BATCH ? (
            <p>
              Site launch: {u.slots.length.toLocaleString()} slots added. <Link href="/slots">Browse all slots →</Link>
            </p>
          ) : (
            <>
              {u.guides.length ? (
                <ul className="update-guides">
                  {u.guides.map((g) => <li key={g.slug}><span className="tag">New guide</span> <Link href={`/guides/${g.slug}`}>{g.title}</Link></li>)}
                </ul>
              ) : null}
              {u.slots.length ? (
                <>
                  <p className="muted small">{u.slots.length} new slot{u.slots.length === 1 ? '' : 's'}</p>
                  <SlotGrid slots={u.slots} />
                </>
              ) : null}
            </>
          )}
        </section>
      ))}
    </>
  );
}
