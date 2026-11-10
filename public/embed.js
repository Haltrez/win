/*! Scatter Drop slot card – https://www.scatterdrop.com/widgets
 * Usage:
 *   <div class="scatterdrop-slot" data-slot="hacksaw-gaming/le-bandit" data-theme="dark">
 *     <a href="https://www.scatterdrop.com/slots/hacksaw-gaming/le-bandit">Play Le Bandit free demo</a>
 *   </div>
 *   <script async src="https://www.scatterdrop.com/embed.js"></script>
 * The link inside the div stays as-is if this script can't load.
 */
(function () {
  var BASE = 'https://www.scatterdrop.com';
  try { var cs = document.currentScript; if (cs && cs.src) BASE = new URL(cs.src).origin; } catch (e) {}
  var CSS =
    ':host{all:initial;display:block;max-width:360px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.c{border-radius:14px;overflow:hidden;border:1px solid var(--l);background:var(--b);color:var(--t);box-shadow:0 6px 24px rgba(0,0,0,.12)}' +
    '.light{--b:#fff;--t:#111827;--m:#6b7280;--l:#e5e7eb;--s:#f3f4f6}.dark{--b:#111827;--t:#f9fafb;--m:#9ca3af;--l:#1f2937;--s:#1f2937}' +
    '.img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;background:var(--s)}' +
    '.body{padding:12px 14px 14px}.n{font-weight:800;font-size:17px;line-height:1.25;margin:0}.p{color:var(--m);font-size:13px;margin:2px 0 10px}' +
    '.st{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 12px}.st div{background:var(--s);border-radius:8px;padding:6px 8px}' +
    '.st dt{font-size:11px;color:var(--m);text-transform:uppercase;letter-spacing:.04em}.st dd{margin:2px 0 0;font-weight:700;font-size:14px}' +
    '::slotted(a){display:block!important;text-align:center!important;padding:10px 12px!important;border-radius:10px!important;background:#f5b82e!important;color:#111!important;font-weight:800!important;font-size:15px!important;text-decoration:none!important}' +
    '.f{display:block;margin-top:8px;text-align:center;font-size:11px;color:var(--m)}';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render(el) {
    if (el.__sd) return; el.__sd = 1;
    var id = (el.getAttribute('data-slot') || '').trim();
    if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(id) || !el.attachShadow) return;
    var a = el.querySelector('a');
    fetch(BASE + '/api/embed/' + id).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d) return;
      if (!a) { a = document.createElement('a'); a.href = d.url; el.appendChild(a); }
      if (!a.textContent.trim()) a.textContent = d.demo ? 'Play ' + d.name + ' free demo' : 'Read the ' + d.name + ' review';
      a.target = '_blank'; a.rel = 'noopener';
      var theme = el.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      var root = el.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' + CSS + '</style><div class="c ' + theme + '">' +
        (d.image ? '<img class="img" src="' + esc(d.image) + '" alt="' + esc(d.name) + ' slot" loading="lazy" width="480" height="360">' : '') +
        '<div class="body"><p class="n">' + esc(d.name) + '</p><p class="p">' + esc(d.provider) + '</p>' +
        '<dl class="st"><div><dt>RTP</dt><dd>' + esc(d.rtp) + '</dd></div><div><dt>Volatility</dt><dd>' + esc(d.volatility) + '</dd></div><div><dt>Max win</dt><dd>' + esc(d.maxWin) + '</dd></div></dl>' +
        '<slot></slot><span class="f">18+ · Data by ' + esc(d.site.name) + '</span></div></div>';
    }).catch(function () {});
  }
  function scan() { var els = document.querySelectorAll('.scatterdrop-slot'); for (var i = 0; i < els.length; i++) render(els[i]); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  window.ScatterDrop = { refresh: scan };
})();
