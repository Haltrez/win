import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProvider, getSlot } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { fmtRtp, fmtX } from '@/lib/format';
import { HREFLANG, activeLocales, isLocale, localeSlotUrl, translatedSlots } from '@/lib/i18n';
import { DICT } from '@/lib/i18n-dict';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = DICT[lang];
  return buildMetadata({
    title: [t.homeTitle], absoluteTitle: true, description: t.homeIntro, path: `/${lang}`,
    languages: { en: '/', 'x-default': '/', ...Object.fromEntries(activeLocales().map((l) => [HREFLANG[l], `/${l}`])) },
    ogLocale: { es: 'es_ES', pt: 'pt_BR', de: 'de_DE', sv: 'sv_SE' }[lang],
  });
}

export default async function LangHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = DICT[lang];
  const slots = translatedSlots(lang).map((x) => getSlot(x.provider, x.slug)).filter((s) => s != null);
  return (
    <>
      <section className="hero">
        <h1>{t.homeH1}</h1>
        <p className="lead">{t.homeIntro}</p>
      </section>
      <h2>{t.homeListH}</h2>
      {slots.length ? (
        <ul className="lang-slot-list">
          {slots.map((s) => (
            <li key={`${s.provider}/${s.slug}`}>
              <Link href={localeSlotUrl(lang, s)}>
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt="" width={240} height={180} loading="lazy" />
                ) : null}
                <span className="sc-name">{s.name}</span>
                <span className="muted small">{getProvider(s.provider)?.name} · {fmtRtp(s.rtp)} · {fmtX(s.maxWin)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
