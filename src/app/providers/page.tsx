import Link from 'next/link';
import Image from 'next/image';
import { getProviders, getSlotsByProvider } from '@/lib/data';
import { getCategories, getCategorySlots } from '@/lib/categories';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ProviderLogo } from '@/components/ProviderLogo';
import { SITE } from '@/lib/config';
import { fmtRtp, fmtX } from '@/lib/format';

export const metadata = buildMetadata({
  title: [`Slot Providers (${SITE.year}) – Every Studio Reviewed`, 'Slot Providers – Every Studio Reviewed'],
  description: "Compare the slot studios behind the games – Pragmatic Play, BGaming, Nolimit City, Thunderkick, Hacksaw Gaming, Play'n GO and more – with free demos, average RTP and their biggest games.",
  path: '/providers',
});

export default function Providers() {
  const best = getCategorySlots(getCategories().find((c) => c.slug === 'best-slots')!);
  const ps = getProviders()
    .map((p) => {
      const slots = getSlotsByProvider(p.slug);
      const rtp = slots.filter((s) => s.rtp != null);
      const top = best.filter((s) => s.provider === p.slug).slice(0, 4);
      const maxWin = slots.reduce((m, s) => Math.max(m, s.maxWin ?? 0), 0);
      return { p, n: slots.length, avg: rtp.length ? rtp.reduce((t, s) => t + s.rtp!, 0) / rtp.length : null, top, maxWin };
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  return (
    <>
      <Breadcrumbs items={[{ name: 'Providers', path: '/providers' }]} />
      <h1>Slot providers</h1>
      <p className="lede">{ps.length} studios, {ps.reduce((t, x) => t + x.n, 0)} games – every one with its official free demo.</p>
      <ul className="provider-grid">
        {ps.map(({ p, n, avg, top, maxWin }) => (
          <li key={p.slug}>
            <Link href={`/providers/${p.slug}`} className="provider-card">
              <ProviderLogo p={p} size="lg" />
              <span className="provider-body">
                <span className="provider-name">{p.name}</span>
                <span className="provider-meta">
                  <span><b>{n}</b> games</span>
                  {avg ? <span><b>{fmtRtp(avg)}</b> avg RTP</span> : null}
                  {maxWin ? <span>up to <b>{fmtX(maxWin)}</b></span> : null}
                </span>
                {top.length ? (
                  <span className="provider-strip" aria-hidden>
                    {top.map((s) => s.image ? <Image key={s.slug} src={s.image} alt="" width={96} height={72} sizes="72px" /> : null)}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
