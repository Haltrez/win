import { HREFLANG, activeLocales, type Locale } from './i18n';

/**
 * Translated list pages. Each one reuses an English list's selection and ranking (`base` = /best/<slug>),
 * with its own local-language URL, title, intro and FAQ written for local searches.
 */
export type LocalList = { slug: string; base: string; title: string; h1: string; description: string; intro: string; faq: { q: string; a: string }[] };

export const LISTS: Partial<Record<Locale, LocalList[]>> = {
  es: [
    { slug: 'tragamonedas-gratis', base: 'best-slots', title: 'Tragamonedas gratis: las mejores demos sin registro',
      h1: 'Tragamonedas gratis: las mejores demos para jugar sin registro',
      description: 'Juega gratis las mejores tragamonedas (tragaperras) online en modo demo, sin registro ni descarga. Compara RTP, volatilidad y ganancia máxima.',
      intro: 'Las mejores tragamonedas online que puedes jugar gratis en modo demo: el juego oficial de cada proveedor, con saldo ficticio, sin registro, sin descarga y sin depósito. Ordenamos la lista por nuestra puntuación y mostramos el RTP, la volatilidad y la ganancia máxima publicados de cada juego.',
      faq: [
        { q: '¿Puedo jugar tragamonedas gratis sin registrarme?', a: 'Sí. Todas las demos de esta lista se juegan con saldo ficticio, sin cuenta, sin descarga y sin depósito.' },
        { q: '¿Las tragamonedas gratis son iguales a las de dinero real?', a: 'La demo oficial usa las mismas funciones y la misma tabla de pagos que la versión con dinero real; solo el saldo es ficticio, así que las ganancias no se pueden retirar.' },
        { q: '¿Se puede ganar dinero real con una demo?', a: 'No. Las demos son para probar los juegos gratis; las ganancias de la demo no tienen valor real.' },
      ] },
    { slug: 'tragamonedas-giros-gratis', base: 'free-spins-slots', title: 'Tragamonedas con giros gratis: demos y funciones',
      h1: 'Tragamonedas con giros gratis (free spins)',
      description: 'Tragamonedas con giros gratis que puedes probar en demo: cómo se activan los free spins, multiplicadores y reactivaciones. RTP y ganancia máxima de cada juego.',
      intro: 'Tragamonedas cuya ronda de giros gratis (free spins) es la función principal. En la mayoría se activan con 3 o 4 scatters, y durante la ronda suelen aparecer multiplicadores, comodines fijos o reactivaciones. Prueba cada bono gratis en modo demo antes de jugar con dinero real.',
      faq: [
        { q: '¿Cómo se consiguen giros gratis en una tragamonedas?', a: 'Normalmente con 3 o 4 símbolos scatter en un mismo giro. Algunos juegos dan más giros por cada scatter extra, y muchos permiten reactivar la ronda.' },
        { q: '¿Los giros gratis de la demo son iguales a los reales?', a: 'Sí, la demo oficial usa las mismas reglas; solo cambia que el saldo es ficticio.' },
      ] },
    { slug: 'tragamonedas-compra-de-bono', base: 'bonus-buy-slots', title: 'Tragamonedas con compra de bono (bonus buy) gratis',
      h1: 'Tragamonedas con compra de bono (bonus buy)',
      description: 'Tragamonedas con compra de bono que puedes probar gratis en demo: cuánto cuesta comprar el bono, qué cambia y qué no. RTP y ganancia máxima.',
      intro: 'En estas tragamonedas puedes pagar un precio fijo (normalmente unas 80 a 100 veces tu apuesta) para ir directo al bono. En la mayoría de las demos oficiales puedes probar la compra de bono con saldo ficticio y ver cuánto paga de verdad un bono comprado. Comprar el bono no mejora tus probabilidades, y en algunos países no está permitido.',
      faq: [
        { q: '¿Qué es la compra de bono en una tragamonedas?', a: 'Es la opción de pagar un precio fijo, un múltiplo de tu apuesta, para empezar el bono al instante en lugar de esperar a que se active.' },
        { q: '¿Comprar el bono mejora las probabilidades?', a: 'No. El precio está calculado para que el bono medio valga aproximadamente lo mismo, menos la ventaja de la casa. Lo que cambia es la rapidez y la variación.' },
      ] },
    { slug: 'tragamonedas-alto-rtp', base: 'high-rtp-slots', title: 'Tragamonedas con alto RTP (96.5%+): demos gratis',
      h1: 'Tragamonedas con alto RTP (96.5% o más)',
      description: 'Las tragamonedas con mayor RTP publicado (96.5% o más), con demo gratis. Qué significa el RTP y por qué conviene revisar la versión del casino.',
      intro: 'Tragamonedas cuyo RTP publicado más alto es de 96.5% o más. El RTP es la parte de lo apostado que el juego devuelve a lo largo de muchísimos giros. Los casinos pueden usar versiones con un RTP más bajo del mismo juego, así que revisa siempre la pantalla de información antes de jugar.',
      faq: [
        { q: '¿Qué es el RTP en las tragamonedas?', a: 'Es el porcentaje teórico que un juego devuelve de lo apostado a largo plazo. Un RTP de 96.5% significa unas 96.50 de cada 100 apostadas a lo largo de millones de giros.' },
        { q: '¿Un RTP alto significa que voy a ganar?', a: 'No. El RTP describe el largo plazo; una sesión concreta puede salir muy por encima o por debajo.' },
      ] },
    { slug: 'tragamonedas-megaways', base: 'megaways-slots', title: 'Tragamonedas Megaways gratis: demos y RTP',
      h1: 'Tragamonedas Megaways gratis',
      description: 'Juega gratis tragamonedas Megaways en demo: hasta 117,649 formas de ganar, cascadas y giros gratis. RTP, volatilidad y ganancia máxima de cada juego.',
      intro: 'Las tragamonedas Megaways cambian el número de símbolos en cada rodillo en cada giro, con hasta 117,649 formas de ganar. Casi todas combinan cascadas con giros gratis y multiplicadores. Pruébalas gratis en modo demo.',
      faq: [{ q: '¿Qué significa Megaways?', a: 'Es una mecánica en la que cada rodillo muestra un número distinto de símbolos en cada giro, así que las formas de ganar cambian constantemente, hasta 117,649.' }] },
    { slug: 'tragamonedas-hold-and-win', base: 'hold-and-win-slots', title: 'Tragamonedas Hold and Win (mantener y ganar) gratis',
      h1: 'Tragamonedas Hold and Win (mantener y ganar)',
      description: 'Tragamonedas Hold and Win con demo gratis: monedas que se quedan fijas, respins y botes Mini, Major y Grand. RTP y ganancia máxima.',
      intro: 'En las tragamonedas Hold and Win, las monedas que caen se quedan fijas y te dan respins para conseguir más; llenar la cuadrícula suele dar el bote mayor. Prueba gratis cómo funcionan en modo demo.',
      faq: [{ q: '¿Cómo funciona el Hold and Win?', a: 'Al caer suficientes monedas empieza una ronda de respins: cada moneda nueva se queda fija y reinicia los respins. Al final se pagan todos los valores y, en muchos juegos, llenar la cuadrícula da el bote Grand.' }] },
    { slug: 'tragamonedas-volatilidad-baja', base: 'low-volatility-slots', title: 'Tragamonedas de baja volatilidad: demos gratis',
      h1: 'Tragamonedas de baja volatilidad',
      description: 'Tragamonedas de baja volatilidad con demo gratis: premios pequeños y frecuentes para sesiones largas. RTP y ganancia máxima de cada juego.',
      intro: 'Las tragamonedas de baja volatilidad pagan premios pequeños con más frecuencia. Las grandes ganancias son raras y los topes son más bajos, pero el saldo suele moverse más despacio. Ideales para sesiones largas en modo demo.',
      faq: [{ q: '¿Qué es la volatilidad de una tragamonedas?', a: 'Indica cómo llegan los premios: a menudo y pequeños (baja) o rara vez y grandes (alta). No cambia el RTP.' }] },
  ],
};

export const getLists = (lang: Locale) => LISTS[lang] ?? [];

/** Every language version of an English list (/best/<base>), for hreflang. */
export function listLanguages(base: string) {
  const out: Record<string, string> = { en: `/best/${base}`, 'x-default': `/best/${base}` };
  for (const l of activeLocales()) {
    const m = (LISTS[l] ?? []).find((x) => x.base === base);
    if (m) out[HREFLANG[l]] = `/${l}/${m.slug}`;
  }
  return out;
}

