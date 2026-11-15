import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { FEATURES } from '@/lib/config';
import { getCasinosForProvider, getProvider, getSlot, slotUrl } from '@/lib/data';
import { abs, buildMetadata, hasDemo } from '@/lib/seo';
import { fmtRelease, fmtRtp, fmtX } from '@/lib/format';
import { HREFLANG, LOCALES, getSlotTranslation, isLocale, localeSlotUrl, slotLanguages, translatedSlots, type Locale } from '@/lib/i18n';
import { DICT, f } from '@/lib/i18n-dict';
import { JsonLd } from '@/components/JsonLd';
import { DemoEmbed } from '@/components/DemoEmbed';
import { CasinoModule } from '@/components/CasinoModule';
import { FAQ } from '@/components/FAQ';

type Params = { lang: string; provider: string; slot: string };
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return LOCALES.flatMap((lang) => translatedSlots(lang).map((s) => ({ lang, provider: s.provider, slot: s.slug })));
}

const OG_LOCALE: Record<Locale, string> = { es: 'es_ES', pt: 'pt_BR', de: 'de_DE', sv: 'sv_SE' };

function load(lang: string, provider: string, slot: string) {
  if (!isLocale(lang)) return null;
  const s = getSlot(provider, slot);
  const p = getProvider(provider);
  const tr = getSlotTranslation(lang, provider, slot);
  if (!s || !p || !tr) return null;
  return { lang, s, p, tr, t: DICT[lang] };
}

/** Every language version of a slot page, for hreflang. */
function languages(s: { provider: string; slug: string }) {
  const out: Record<string, string> = { en: slotUrl(s as never), 'x-default': slotUrl(s as never) };
  for (const l of slotLanguages(s)) out[HREFLANG[l]] = localeSlotUrl(l, s);
  return out;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { lang, provider, slot } = await params;
  const d = load(lang, provider, slot);
  if (!d) return {};
  const { s, p, tr, t } = d;
  const title = tr.title ?? f(t.titleTemplate, { name: s.name, rtp: s.rtp != null ? fmtRtp(s.rtp) : '–', max: s.maxWin ? fmtX(s.maxWin) : '–' });
  return buildMetadata({
    title: [title, `${s.name} – ${t.kicker}`], absoluteTitle: true,
    description: tr.description || f(t.descTemplate, { name: s.name, provider: p.name }),
    path: localeSlotUrl(d.lang, s), type: 'article', modifiedTime: s.updatedAt,
    image: abs(`/og/${s.provider}/${s.slug}`), languages: languages(s), ogLocale: OG_LOCALE[d.lang],
  });
}

export default async function LocalSlotPage({ params }: { params: Promise<Params> }) {
  const { lang, provider, slot } = await params;
  const d = load(lang, provider, slot);
  if (!d) notFound();
  const { s, p, tr, t } = d;
  const casinos = getCasinosForProvider(p.slug);
  const demo = hasDemo(s);
  const vol = s.volatility ? t.vol[s.volatility] ?? s.volatility : null;
  const others = translatedSlots(d.lang).filter((x) => !(x.provider === s.provider && x.slug === s.slug)).slice(0, 12)
    .map((x) => getSlot(x.provider, x.slug)).filter(Boolean);
  const faq = [
    ...(s.rtp != null ? [{ q: f(t.faq.rtpQ, { name: s.name }), a: f(t.faq.rtpA, { name: s.name, x: fmtRtp(s.rtp) }) }] : []),
    ...(s.maxWin ? [{ q: f(t.faq.maxQ, { name: s.name }), a: f(t.faq.maxA, { name: s.name, x: fmtX(s.maxWin) }) }] : []),
    ...(vol ? [{ q: f(t.faq.volQ, { name: s.name }), a: f(t.faq.volA, { name: s.name, provider: p.name, x: vol.toLowerCase() }) }] : []),
    ...(demo ? [{ q: f(t.faq.demoQ, { name: s.name }), a: f(t.faq.demoA, { name: s.name }) }] : []),
    { q: f(t.faq.buyQ, { name: s.name }), a: f(s.mechanics.includes('bonus-buy') ? t.faq.buyYes : t.faq.buyNo, { name: s.name }) },
  ];
  const rows: [string, string][] = [
    [t.stats.provider, p.name], [t.stats.rtp, fmtRtp(s.rtp)], [t.stats.volatility, vol ?? '–'], [t.stats.maxWin, fmtX(s.maxWin)],
    [t.stats.release, fmtRelease(s)],
    ...(s.reels ? [[t.stats.layout, s.reels] as [string, string]] : []),
    ...(s.paylines || s.winType ? [[t.stats.lines, String(s.paylines ?? s.winType)] as [string, string]] : []),
    ...(s.hitRate ? [[t.stats.hitRate, f(t.stats.hitRateVal, { n: s.hitRate })] as [string, string]] : []),
    ...(s.bonusRate ? [[t.stats.bonusFreq, f(t.stats.bonusFreqVal, { n: Math.round(s.bonusRate) })] as [string, string]] : []),
    [t.stats.bonusBuy, s.mechanics.includes('bonus-buy') ? t.stats.bonusBuyYes : t.stats.no],
  ];
  const crumbs = [{ name: t.home, path: `/${d.lang}` }, { name: s.name, path: localeSlotUrl(d.lang, s) }];

  return (
    <>
      <nav aria-label="Breadcrumb" className="crumbs"><ol>{crumbs.map((c, i) => <li key={c.path}>{i < crumbs.length - 1 ? <Link href={c.path}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}</li>)}</ol></nav>
      <h1 className="slot-h1">{s.name}<span className="slot-kicker"> {t.kicker} · {p.name}</span></h1>
      <p className="muted small"><Link href={slotUrl(s)} hrefLang="en">{t.slot.readEnglish}</Link></p>

      <div className="slot-hero">
        <div>
          <DemoEmbed name={s.name} url={s.demoUrl} providerName={p.name} launchPath={`/api/demo/${s.provider}/${s.slug}`} lang={d.lang}
            externalUrl={s.demoLink ?? (s.provider === 'push-gaming' && s.demoUrl ? `https://www.pushgaming.com/games/play/${s.slug}.html` : undefined)} image={s.image ?? undefined}
            t={t.demo} ctaT={{ ...t.cta, playResponsibly: t.casino.playResponsibly }}
            cta={FEATURES.realMoney && casinos.length ? { slotKey: `${s.provider}/${s.slug}`, casinos: casinos.map((c) => ({ slug: c.slug, name: c.name, geos: c.geos, bonus: c.bonus, terms: c.terms })) } : undefined} />
        </div>
        <aside className="side-card" aria-label={s.name}>
          <dl className="stat-tiles">{rows.slice(0, 4).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <details className="stats-more"><summary>{t.stats.allDetails}</summary>
            <table className="stats"><tbody>{rows.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table>
          </details>
        </aside>
      </div>

      <CasinoModule casinos={casinos} title={t.casino.title} context={`${d.lang}-slot:${s.slug}`} slotName={s.name} t={t.casino} />

      <section className="prose">
        <h2>{f(t.slot.reviewH, { name: s.name })}</h2>
        <div dangerouslySetInnerHTML={{ __html: marked.parse(tr.review, { async: false }) as string }} />

        {demo ? (
          <>
            <h2>{f(t.slot.howToH, { name: s.name })}</h2>
            <ol>{t.slot.howTo.map((x) => <li key={x}>{f(x, { name: s.name, provider: p.name })}</li>)}</ol>
            <p className="muted small">{f(t.slot.howToNote, { name: s.name })}</p>
          </>
        ) : null}

        {tr.features.length ? (
          <>
            <h2>{f(t.slot.featuresH, { name: s.name })}</h2>
            <dl className="feature-list">{tr.features.map((x) => <div key={x.name}><dt>{x.name}</dt><dd>{x.description}</dd></div>)}</dl>
          </>
        ) : null}

        <h2>{f(t.slot.numbersH, { name: s.name })}</h2>
        {s.rtp != null ? <p>{f(t.slot.rtpText, { x: fmtRtp(s.rtp) })} {t.slot.rtpVersions}</p> : null}
        {vol ? <p>{f(t.slot.volText, { x: vol.toLowerCase() })}</p> : null}
        {s.maxWin ? <p>{f(t.slot.maxText, { x: fmtX(s.maxWin) })}</p> : null}
      </section>

      <FAQ items={faq} title={f(t.slot.faqH, { name: s.name })} />

      {others.length ? (
        <section>
          <h2>{t.slot.relatedH}</h2>
          <ul className="inline-links">{others.map((o) => <li key={`${o!.provider}/${o!.slug}`}><Link href={localeSlotUrl(d.lang, o!)}>{o!.name}</Link></li>)}</ul>
        </section>
      ) : null}

      <JsonLd data={[{ '@context': 'https://schema.org', '@type': 'VideoGame', name: s.name, url: abs(localeSlotUrl(d.lang, s)), inLanguage: d.lang, description: tr.description, gamePlatform: 'Web browser', author: { '@type': 'Organization', name: p.name }, ...(s.image ? { image: abs(s.image) } : {}) }]} />
    </>
  );
}
