/**
 * Human-click signal for affiliate links. A tiny inline script sets a short-lived cookie the moment a
 * person presses a /go/ link; the redirect route only forwards to the partner when the cookie is present.
 * Scrapers that harvest hrefs from the HTML (even in a headless browser) never fire the click, so they
 * land on a "continue" page instead of the partner. No personal data: the cookie holds only a timestamp.
 */
export const CLICK_COOKIE = 'sdgo';
/** Max age of the click signal, in seconds. A person opens the link within this window. */
export const CLICK_MAX_AGE = 120;

export const CLICK_TOKEN_BOOT = `(function(){function m(e){var a=e.target&&e.target.closest&&e.target.closest('a[href^="/go/"]');if(!a)return;if(e.isTrusted===false)return;document.cookie='${CLICK_COOKIE}='+Date.now().toString(36)+';path=/go;max-age=${CLICK_MAX_AGE};SameSite=Lax';}
document.addEventListener('pointerdown',m,true);document.addEventListener('keydown',function(e){if(e.key==='Enter')m(e)},true);document.addEventListener('click',m,true);})();`;

/** True when the cookie holds a timestamp younger than CLICK_MAX_AGE seconds. */
export function clickTokenValid(value: string | undefined): boolean {
  if (!value) return false;
  const t = parseInt(value, 36);
  if (!Number.isFinite(t)) return false;
  const age = (Date.now() - t) / 1000;
  return age >= -5 && age <= CLICK_MAX_AGE;
}
