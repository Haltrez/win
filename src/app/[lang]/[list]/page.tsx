import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategory, getCategorySlots } from '@/lib/categories';
import { getProvider, slotUrl } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { fmtRtp, fmtX } from '@/lib/format';
import { activeLocales, getSlotTranslation, isLocale, localeSlotUrl, type Locale } from '@/lib/i18n';
import { DICT } from '@/lib/i18n-dict';
import { getLists, listLanguages } from '@/lib/i18n-lists';
import { FAQ } from '@/components/FAQ';

type Params = { lang: string; list: string };
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return activeLocales().flatMap((lang) => getLists(lang).map((l) => ({ lang, list: l.slug })));
}

function load(lang: string, slug: string) {
  if (!isLocale(lang)) return null;
  const l = getLists(lang).find((x) => x.slug === slug);
  const c = l && getCategory(l.base);
  return l && c ? { lang: lang as Locale, l, c } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { lang, list } = await params;
  const d = load(lang, list);
  if (!d) return {};
  return buildMetadata({ title: [d.l.title], absoluteTitle: true, description: d.l.description, path: `/${d.lang}/${d.l.slug}`, languages: listLanguages(d.l.base), ogLocale: { es: 'es_ES', pt: 'pt_BR', de: 'de_DE', sv: 'sv_SE' }[d.lang] });
}

export default async function LocalList({ params }: { params: Promise<Params> }) {
  const { lang, list } = await params;
  const d = load(lang, list);
  if (!d) notFound();
  const t = DICT[d.lang];
  const slots = getCategorySlots(d.c).slice(0, 40);
  return (
    <>
      <nav aria-label="Breadcrumb" className="crumbs"><ol><li><Link href={`/${d.lang}`}>{t.home}</Link></li><li><span aria-current="page">{d.l.h1}</span></li></ol></nav>
      <h1>{d.l.h1}</h1>
      <p className="lead">{d.l.intro}</p>
      <ol className="lang-slot-list">
        {slots.map((s) => {
          const local = getSlotTranslation(d.lang, s.provider, s.slug);
          return (
            <li key={`${s.provider}/${s.slug}`}>
              <Link href={local ? localeSlotUrl(d.lang, s) : slotUrl(s)} {...(local ? {} : { hrefLang: 'en' })}>
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt="" width={240} height={180} loading="lazy" />
                ) : null}
                <span className="sc-name">{s.name}</span>
                <span className="muted small">{getProvider(s.provider)?.name} · {t.stats.rtp} {fmtRtp(s.rtp)}{s.volatility ? ` · ${t.vol[s.volatility] ?? ''}` : ''} · {fmtX(s.maxWin)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <FAQ items={d.l.faq} title={t.slot.faqH.replace('{name}', d.l.h1)} />
    </>
  );
}
