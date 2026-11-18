import { Field } from './field.js';

const B = window.BITGO;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mobile = () => innerWidth < 760;
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const ARROW_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M8 6h10v10"/></svg>';
const LOGO = '../shared/assets/bitgo-logo.svg';
if (reduced) document.documentElement.classList.add('rm');

/* ============ nav ============ */
$('#skip').textContent = B.skip;
$('#navin').innerHTML = `
  <a class="nav-logo" href="${B.BITGO}" aria-label="BitGo"><img src="${LOGO}" alt="BitGo" width="108" height="37"></a>
  <ul class="menus">${B.menus.map((m) => `
    <li><button aria-haspopup="true">${esc(m.label)}</button>
      <div class="mega">${m.groups.map((g) => `<div><h4>${esc(g.title)}</h4>${g.items.map((i) => `<a href="${i.href}">${esc(i.label)}</a>`).join('')}</div>`).join('')}</div></li>`).join('')}
  </ul>
  <div class="nav-act">
    <span class="lang">${esc(B.navActions.language)}</span>
    <a class="login" href="${B.navActions.signup.href}">${esc(B.navActions.signup.label)}</a>
    <a class="login" href="${B.navActions.login.href}">${esc(B.navActions.login.label)}</a>
    <a class="btn btn-blue" href="#connect">${esc(B.navActions.connect)}</a>
  </div>
  <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><i></i></button>`;
$('#drawer').innerHTML = B.menus.map((m) => `<details><summary>${esc(m.label)}</summary>${m.groups.map((g) => `<h4>${esc(g.title)}</h4>${g.items.map((i) => `<a class="i" href="${i.href}">${esc(i.label)}</a>`).join('')}`).join('')}</details>`).join('') +
  `<div class="row"><a class="btn btn-ghost" href="${B.navActions.login.href}">${esc(B.navActions.login.label)}</a><a class="btn btn-blue" href="#connect">${esc(B.navActions.connect)}</a></div>`;
$('#burger').addEventListener('click', (e) => {
  const o = $('#drawer').classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', o);
});
const nav = $('#nav');
const onNav = () => nav.classList.toggle('solid', scrollY > 40);
addEventListener('scroll', onNav, { passive: true }); onNav();

/* ============ page ============ */
const H = B.hero;
const split = (t) => t.split(' ').map((w) => `<span class="w"><i>${esc(w)}</i></span>`).join(' ');
const splitScrub = (t) => t.split(' ').map((w) => `<span class="sw">${esc(w)}</span>`).join(' ');
const logoRow = (arr) => [...arr, ...arr].map((l) => `<div class="lg"><img src="${l}" alt=""></div>`).join('');
$('#main').innerHTML = `
<section class="hero" id="hero"><div class="wrap">
  <div class="hero-grid">
    <h1 data-quiet="0.85" data-split><span class="rot" id="rot">${H.words.map((w) => `<span>${esc(w)}</span>`).join('')}</span><span class="rest">${split(H.rest)}</span></h1>
    <div class="hero-side" data-quiet="0.6"><p data-fade>${esc(H.sub)}</p><a class="btn btn-blue" href="#connect" data-fade>${esc(H.cta)} ${ARROW}</a></div>
  </div>
</div></section>

<section class="trust" id="trust">
  <div class="wrap"><h2 data-split data-quiet="0.5">${split(B.trust.title)}</h2></div>
  <div class="marq" id="marq" data-quiet="0.55">
    <div class="marq-row" data-dir="-1">${logoRow(B.trust.logos.slice(0, 7))}</div>
    <div class="marq-row" data-dir="1">${logoRow(B.trust.logos.slice(7))}</div>
  </div>
  <div class="wrap"><div class="badges" data-quiet="0.5">${B.badges.map((b) => `<p data-fade>${esc(b.label)}</p>`).join('')}</div></div>
</section>

<section class="core" id="core"><div class="wrap">
  <div class="core-head" data-quiet="0.8"><h2 data-scrub>${splitScrub(B.core.title.join(' '))}</h2></div>
  <div class="pviz" aria-hidden="true">${B.core.items.map(() => '<div class="pslot"></div>').join('')}</div>
  <div class="svc-row" id="svcrow">${B.core.items.map((s, i) => `
    <article class="svc" data-i="${i}" tabindex="0">
      <h3>${esc(s.title)}</h3>
      <p class="sh">${esc(s.short)}</p>
      <p class="lo">${esc(s.long)}</p>
      <a class="more" href="${s.cta.href}">${esc(s.cta.label)} ${ARROW}</a>
    </article>`).join('')}</div>
</div></section>

<section class="est" id="est">
  <div class="wrap est-grid">
    <div class="est-text" data-quiet="0.75"><h2 data-split>${split(B.established.title)}</h2>
      <p class="lead" data-fade>${esc(B.established.text)}</p>
      <a class="btn btn-blue" href="${B.established.cta.href}" data-fade>${esc(B.established.cta.label)} ${ARROW}</a></div>
    <div class="tiles" data-quiet="0.6">${B.established.logos.map((l) => `
      <${l.href ? `a href="${l.href}"` : 'div'} class="tile ${l.text ? 'has' : ''}" data-fade><img src="${l.image}" alt="${esc(l.name)}">${l.text ? `<span class="tx">${esc(l.text)}</span>` : ''}</${l.href ? 'a' : 'div'}>`).join('')}
    </div>
  </div>
  <div class="sky-anchor" id="sky"></div><div class="sky-pad"></div>
</section>

<section class="build" id="build">
  <div class="globe-anchor" id="globe"></div>
  <div class="wrap build-grid">
    <div class="build-list" data-quiet="0.5">
      <h2 data-split>${split(B.build.title)}</h2>
      <div class="bl">${B.build.cards.map((c, i) => `
        <article class="bc" data-i="${i}"><h3>${esc(c.label)}</h3><p>${esc(c.text)}</p><a class="more" href="${c.cta.href}">${esc(c.cta.label)} ${ARROW}</a></article>`).join('')}</div>
    </div>
    <div></div>
  </div>
</section>

<section class="support" id="support">
  <div class="wrap sup-grid">
    <div data-quiet="0.5"><h2 data-split>${split(B.support.title)}</h2>
      <ul class="sp-list">${B.support.items.map((i) => `<li data-fade>${esc(i)}</li>`).join('')}</ul></div>
    <div class="dial-wrap"><div class="dial-anchor" id="dial"></div>
      <div class="dial-mid" data-quiet="0.75"><b>24/7</b><span>${esc(B.support.label.replace('24/7 ', ''))}</span></div></div>
  </div>
</section>

<section class="own" id="own">
  <div class="own-anchor" id="ownA"></div>
  <div class="wrap own-grid">
    <div data-quiet="0.5"><h2 data-split>${split(B.own.title)}</h2>
      <ul class="ol" id="ol">${B.own.items.map((it, i) => `<li data-i="${i}"><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></li>`).join('')}</ul></div>
    <div></div>
  </div>
</section>

<section class="spot" id="spot"><div class="wrap">
  <h2 data-split data-quiet="0.5">${split(B.spotlight.label)}</h2>
  <div class="vids">${B.spotlight.slides.map((s, i) => `
    <a class="vid" data-i="${i}" href="${s.video}" target="_blank" rel="noopener"><div class="dslot"></div><h3 data-quiet="0.7"><span>${esc(s.title)}</span>${ARROW_UP}</h3></a>`).join('')}</div>
</div></section>

<section class="latest" id="latest"><div class="wrap">
  <div class="lt-head"><h2 data-split>${split(B.latest.title)}</h2><a class="btn btn-ghost" href="${B.latest.all.href}">${esc(B.latest.all.label)} ${ARROW}</a></div>
  <div class="posts" data-quiet="0.6">${B.latest.posts.map((p) => `<a class="post" href="${p.href}" data-fade><span>${esc(p.title)}</span>${ARROW_UP}</a>`).join('')}</div>
</div></section>

<section class="cta" id="connect"><div class="wrap">
  <div class="logo-anchor" id="logoA"></div>
  <h2 data-split data-quiet="0.8">${B.cta.title.map((l) => split(l)).join('<br>')}</h2>
  <a class="btn btn-white" href="#connect">${esc(B.cta.button)} ${ARROW}</a>
</div></section>`;

/* ============ footer ============ */
(function () {
  const F = B.footer;
  const col = (m) => `<div><h4>${esc(m.label)}</h4>${m.groups.flatMap((g) => g.items).slice(0, 8).map((i) => `<a href="${i.href}">${esc(i.label)}</a>`).join('')}</div>`;
  $('#foot').innerHTML = `<div class="wrap">
    <div class="ft-top">
      <div><img src="${LOGO}" alt="BitGo" width="150" height="51"><p>${esc(F.newsletter)}</p>
        <form class="nl" onsubmit="return false"><input type="email" placeholder="${esc(F.email)}" aria-label="${esc(F.email)}"><button class="btn btn-blue" type="submit">${esc(F.subscribe)}</button></form></div>
      <div class="ft-cols">${B.menus.map(col).join('')}<div><h4>Social</h4>${F.socials.map((s) => `<a href="${s.href}">${esc(s.label)}</a>`).join('')}</div></div>
    </div>
    <div class="ft-legal">${F.legal.map((l) => `<p>${esc(l)}</p>`).join('')}
      <p>${esc(F.review)} <a href="${F.privacy.href}">${esc(F.privacy.label)}</a> ${esc(F.and)} <a href="${F.disclaimers.href}">${esc(F.disclaimers.label)}</a>.</p>
      <p>${esc(F.screenReader)}</p><p>${esc(F.complaints)}</p></div>
    <div class="ft-bot"><span>${esc(F.nmls)}</span><span>${esc(F.choices)}</span><span>${esc(F.rights)}</span></div></div>`;
})();

/* ============ reveals ============ */
const revealEls = $$('[data-split],[data-fade]');
if (reduced || !('IntersectionObserver' in window)) revealEls.forEach((e) => e.classList.add('in'));
else {
  $$('[data-split]').forEach((el) => $$('.w i', el).forEach((w, i) => { w.style.transitionDelay = (i * 0.07) + 's'; }));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach((e) => io.observe(e));
}
/* hero words in on load */
requestAnimationFrame(() => setTimeout(() => $('.hero h1').classList.add('in'), 250));

/* rotating word */
(function () {
  const words = $$('#rot span');
  if (reduced || words.length < 2) return;
  let i = 0;
  const tr = 'transform .9s cubic-bezier(.65,0,.2,1), opacity .9s';
  words.forEach((w, k) => { w.style.transition = tr; w.style.transform = k ? 'translateY(110%)' : 'none'; });
  setInterval(() => {
    const cur = words[i], nxt = words[(i + 1) % words.length];
    nxt.style.transition = 'none'; nxt.style.transform = 'translateY(110%)'; void nxt.offsetWidth; nxt.style.transition = tr;
    cur.style.transform = 'translateY(-110%)'; nxt.style.transform = 'none';
    i = (i + 1) % words.length;
  }, 2800);
})();

/* ============ interactions that steer the field ============ */
const act = { pillars: 0, ribbons: 0, aperture: 0, arcs: 1.05 };
const hovered = { svc: -1, own: -1, vid: -1, bc: -1 };
const svcs = $$('.svc'), ols = $$('#ol li'), vids = $$('.vid'), bcs = $$('.bc');
svcs.forEach((el, i) => { el.addEventListener('pointerenter', () => hovered.svc = i); el.addEventListener('pointerleave', () => hovered.svc = -1); el.addEventListener('focus', () => hovered.svc = i); el.addEventListener('blur', () => hovered.svc = -1); });
ols.forEach((el, i) => { el.addEventListener('pointerenter', () => hovered.own = i); el.addEventListener('pointerleave', () => hovered.own = -1); });
vids.forEach((el, i) => { el.addEventListener('pointerenter', () => hovered.vid = i); el.addEventListener('pointerleave', () => hovered.vid = -1); el.addEventListener('focus', () => hovered.vid = i); el.addEventListener('blur', () => hovered.vid = -1); });
bcs.forEach((el, i) => { el.addEventListener('pointerenter', () => hovered.bc = i); el.addEventListener('pointerleave', () => hovered.bc = -1); });
const nearest = (els, y = innerHeight * 0.5) => {
  let best = 0, bd = 1e9;
  els.forEach((el, i) => { const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - y); if (d < bd) { bd = d; best = i; } });
  return best;
};

/* ============ field ============ */
const canvas = $('#gl');
let field = null;
try {
  field = new Field(canvas, {
    reduced, mobile: mobile(), logo: LOGO,
    sections: [
      { el: $('#hero'), form: 0, amp: 1, calm: 0 },
      { el: $('#trust'), form: 0, amp: 0.7, calm: 0.45 },
      { el: $('#core'), form: 1, amp: 1 },
      { el: $('#est'), form: 2, amp: 1 },
      { el: $('#build'), form: 3, amp: 1 },
      { el: $('#support'), form: 4, amp: 1 },
      { el: $('#own'), form: 5, amp: 1 },
      { el: $('#spot'), form: 6, amp: 1 },
      { el: $('#latest'), form: 0, amp: 0.65, calm: 0.5 },
      { el: $('#connect'), form: 7, amp: 1 }
    ],
    anchors: { core: $$('.pslot'), sky: $('#sky'), globe: $('#globe'), dial: $('#dial'), own: $('#ownA'), disc: $$('.dslot'), logo: $('#logoA') },
    blue: [$('#own'), $('#connect')],
    quiet: $$('[data-quiet]')
  });
} catch (e) { console.warn(e); }
if (!field || !field.ok) canvas.style.display = 'none';
else { field.act = act; window.__field = field; }
addEventListener('resize', () => field && field.ok && field.resize());

/* ============ one loop: lenis, field, scroll visuals ============ */
let lenis = null;
if (!reduced && window.Lenis) {
  try { lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true }); } catch (e) { lenis = null; }
}
const marq = $$('.marq-row'), marqEl = $('#marq');
const scrubs = $$('[data-scrub]');
let last = performance.now(), visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });
function tick(now) {
  requestAnimationFrame(tick);
  if (!visible) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (lenis) lenis.raf(now);
  const H = innerHeight;
  // reads
  const mr = marqEl.getBoundingClientRect();
  const sr = scrubs.map((el) => el.getBoundingClientRect());
  // steering
  const t = now / 1000;
  act.pillars = hovered.svc >= 0 ? hovered.svc : Math.floor(t / 3.6) % 5;
  act.ribbons = hovered.own >= 0 ? hovered.own : nearest(ols, H * 0.5);
  act.aperture = hovered.vid >= 0 ? hovered.vid : Math.floor(t / 3.6) % 3;
  const bi = hovered.bc >= 0 ? hovered.bc : nearest(bcs, H * 0.55);
  act.arcs = [0.3, 0.62, 1.05][bi];
  svcs.forEach((el, i) => el.classList.toggle('on', i === act.pillars));
  ols.forEach((el, i) => el.classList.toggle('on', i === act.ribbons));
  bcs.forEach((el, i) => el.classList.toggle('on', i === bi));
  // writes
  const p = clamp(1 - (mr.top + mr.height / 2) / (H + mr.height), 0, 1.2);
  if (!reduced) marq.forEach((row) => {
    const dir = +row.dataset.dir, half = row.scrollWidth / 2;
    row.style.transform = `translate3d(${(dir < 0 ? -p * half * 0.8 : -half * 0.8 + p * half * 0.8).toFixed(1)}px,0,0)`;
  });
  scrubs.forEach((el, k) => {
    const r = sr[k]; const ws = el.children;
    const q = reduced ? 1 : clamp((H * 0.88 - r.top) / (H * 0.5 + r.height * 0.6));
    const n = ws.length;
    for (let i = 0; i < n; i++) { const a = clamp(q * (n + 4) - i); ws[i].style.opacity = (0.18 + 0.82 * a).toFixed(3); }
  });
  if (field && field.ok) field.frame(dt, t);
}
requestAnimationFrame(tick);

/* anchor links */
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href'); if (id.length < 2) return;
  const t = $(id); if (!t) return;
  e.preventDefault();
  $('#drawer').classList.remove('open');
  if (lenis) lenis.scrollTo(t, { duration: 1.6 }); else t.scrollIntoView();
}));
