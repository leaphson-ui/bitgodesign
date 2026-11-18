const B = window.BITGO;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const arrow = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 10h11M10.5 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// stage attributes: form index, x (-1 left .. 1 right), y, scale, opacity
const S = (f, x, y, s, o) => `data-form="${f}" data-x="${x}" data-y="${y}" data-s="${s}" data-o="${o}"`;

$('#skip').textContent = B.skip;

/* ---------------- nav ---------------- */
const navMenus = $('#navMenus'), mega = $('#mega'), nav = $('#nav');
B.menus.forEach((m, i) => { const b = document.createElement('button'); b.textContent = m.label; b.setAttribute('aria-expanded', 'false'); b.dataset.i = i; navMenus.appendChild(b); });
const na = B.navActions;
$('#navActions').innerHTML = `<span class="lang">${esc(na.language)}</span><a class="login" href="${na.login.href}">${esc(na.login.label)}</a><a href="${na.signup.href}">${esc(na.signup.label)}</a><a class="connect" href="#cta">${esc(na.connect)}</a>`;
let openMenu = -1;
function showMega(i) {
  [...navMenus.children].forEach((b, k) => b.setAttribute('aria-expanded', k === i ? 'true' : 'false'));
  if (i < 0) { mega.hidden = true; nav.classList.remove('open'); openMenu = -1; return; }
  const m = B.menus[i];
  mega.className = 'mega' + (m.groups.length === 2 || m.groups.some(g => g.items.length > 12) ? ' wide' : '');
  mega.innerHTML = m.groups.map(g => `<div><h4>${esc(g.title)}</h4><ul class="cols">${g.items.map(it => `<li><a href="${it.href}">${esc(it.label)}</a></li>`).join('')}</ul></div>`).join('');
  mega.hidden = false; nav.classList.add('open'); openMenu = i;
}
navMenus.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showMega(openMenu === +b.dataset.i ? -1 : +b.dataset.i); });
navMenus.addEventListener('mouseover', e => { const b = e.target.closest('button'); if (b && matchMedia('(hover:hover)').matches) showMega(+b.dataset.i); });
nav.addEventListener('mouseleave', () => showMega(-1));
document.addEventListener('keydown', e => { if (e.key === 'Escape') showMega(-1); });
const mm = $('#mobileMenu'), burger = $('#burger');
mm.innerHTML = B.menus.map(m => `<details><summary>${esc(m.label)}</summary>${m.groups.map(g => `<h4>${esc(g.title)}</h4>${g.items.map(it => `<a href="${it.href}">${esc(it.label)}</a>`).join('')}`).join('')}</details>`).join('') +
  `<div class="mm-actions"><a href="${na.login.href}">${esc(na.login.label)}</a><a href="${na.signup.href}">${esc(na.signup.label)}</a><a class="connect" href="#cta">${esc(na.connect)}</a></div>`;
burger.addEventListener('click', () => { const o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', o); mm.hidden = !o; nav.classList.toggle('open', o); });
mm.addEventListener('click', e => { if (e.target.closest('.mm-actions a')) { mm.hidden = true; burger.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); } });

/* ---------------- sections ---------------- */
const logoRow = B.trust.logos.map(l => `<img src="${l}" alt="">`).join('');
const core = B.core.items;
const coreStages = [
  { f: 5, x: .5, y: 0, s: 1.15, o: 1, side: '' },
  { f: 6, x: -.5, y: 0, s: 1.15, o: 1, side: 'r' },
  { f: 7, x: .64, y: .0, s: 1.4, o: .95, side: '' },
  { f: 8, x: -.5, y: 0, s: 1.35, o: 1, side: 'r' },
  { f: 9, x: .5, y: 0, s: 1.2, o: 1, side: '' },
];
const buildStages = [
  { f: 11, x: .5, y: 0, s: 1.2, o: 1, side: '' },
  { f: 12, x: -.5, y: 0, s: 1.25, o: 1, side: 'r' },
  { f: 13, x: .3, y: -.05, s: 1.15, o: .95, side: '' },
];
const ownStages = [15, 16, 17, 18, 19];
const ownS = [1.15, 1.1, 1.2, 1.15, 1.1];

$('#main').innerHTML = `
<section class="hero" id="top">
  <div class="blk hero-blk" id="heroBlk" ${S(0, .56, .02, 1.05, 1)}>
    <div class="hero-text">
      <h1 class="h1"><span class="rot" id="rot" aria-live="off"><span id="rotW"></span><i class="caret"></i></span> <span class="rest">${esc(B.hero.rest)}</span></h1>
      <p class="hero-sub">${esc(B.hero.sub)}</p>
      <a class="btn btn-blue" href="#cta">${esc(B.hero.cta)}</a>
    </div>
  </div>
</section>

<section class="trust" id="trust">
  <div class="blk trust-blk" ${S(3, .1, .1, 1.15, .85)}>
    <h2 class="rv h2">${esc(B.trust.title)}</h2>
  </div>
  <div class="marquee" aria-label="Clients"><div class="marquee-track"><div>${logoRow}</div><div aria-hidden="true">${logoRow}</div></div></div>
</section>

<section class="badges" id="badges">
  <div class="blk badge-blk" ${S(4, .54, 0, 1.05, 1)}>
    <ul class="badge-panel rv">${B.badges.map(b => `<li>${esc(b.label)}</li>`).join('')}</ul>
  </div>
</section>

<section class="core" id="core">
  <div class="blk core-head" ${S(4, -.55, 0, 1.0, .9)}>
    <h2 class="rv h2 big right">${B.core.title.map(esc).join('<br>')}</h2>
  </div>
  ${core.map((c, i) => `
  <article class="blk item ${coreStages[i].side}" ${S(coreStages[i].f, coreStages[i].x, coreStages[i].y, coreStages[i].s, coreStages[i].o)}>
    <div class="item-text rv">
      <h3>${esc(c.title)}</h3>
      <p class="short">${esc(c.short)}</p>
      <p class="long">${esc(c.long)}</p>
      <a class="btn btn-blue" href="${c.cta.href}">${esc(c.cta.label)} ${arrow}</a>
    </div>
  </article>`).join('')}
</section>

<section class="est" id="est">
  <div class="blk est-a" ${S(10, .22, -.12, 1.0, .95)}>
    <div class="est-text rv">
      <h2 class="h2">${esc(B.established.title)}</h2>
      <p class="lede">${esc(B.established.text)}</p>
      <a class="btn btn-line" href="${B.established.cta.href}">${esc(B.established.cta.label)} ${arrow}</a>
    </div>
  </div>
  <div class="blk est-b" ${S(10, 0, .0, 1.3, .42)}>
    <ul class="tiles">${B.established.logos.map(l => `<li class="tile${l.text ? ' has' : ''}" ${l.text ? 'tabindex="0"' : ''}><img src="${l.image}" alt="${esc(l.name)}" loading="lazy">${l.text ? `<p>${esc(l.text)}</p>` : ''}</li>`).join('')}</ul>
  </div>
</section>

<section class="build" id="build">
  <div class="blk build-head" ${S(2, .5, 0, .95, 1)}>
    <h2 class="rv h2 big">${esc(B.build.title)}</h2>
  </div>
  ${B.build.cards.map((c, i) => `
  <article class="blk item ${buildStages[i].side}" ${S(buildStages[i].f, buildStages[i].x, buildStages[i].y, buildStages[i].s, buildStages[i].o)}>
    <div class="item-text rv">
      <h3>${esc(c.label)}</h3>
      <p class="short">${esc(c.text.replace('place-hold', 'place: hold'))}</p>
      <a class="btn btn-blue" href="${c.cta.href}">${esc(c.cta.label)} ${arrow}</a>
    </div>
  </article>`).join('')}
</section>

<section class="support" id="support">
  <div class="blk support-blk r" ${S(14, -.52, 0, 1.4, 1)}>
    <div class="support-text">
      <p class="support-tag rv">${esc(B.support.label)}</p>
      <h2 class="rv h2">${esc(B.support.title)}</h2>
      <ul class="support-list">${B.support.items.map(t => `<li class="rv">${esc(t)}</li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="own" id="own">
  <div class="own-sticky"><h2 class="rv own-head">${esc(B.own.title)}</h2></div>
  <div class="blk own-head-blk" ${S(14, .5, 0, 1.2, 1)}></div>
  ${B.own.items.map((it, i) => `
  <article class="blk own-item" data-own="${i}" ${S(ownStages[i], .5, 0, ownS[i], 1)}>
    <div class="own-text">
      <p class="own-word" aria-label="${esc(it.title)}"></p>
      <p class="own-desc">${it.text.split(' ').map(w => `<span>${esc(w)}</span>`).join(' ')}</p>
    </div>
  </article>`).join('')}
</section>

<section class="spot" id="spot">
  <div class="blk spot-blk" ${S(20, .55, .14, 1.0, 1)}>
    <h2 class="rv h2">${esc(B.spotlight.label)}</h2>
  </div>
  <div class="vids">${B.spotlight.slides.map(s => `<a class="vid rv" href="${s.video}" target="_blank" rel="noopener"><span class="play" aria-hidden="true"></span><span class="vt">${esc(s.title)}</span></a>`).join('')}</div>
</section>

<section class="latest" id="latest">
  <div class="blk latest-blk r" ${S(21, -.52, 0, 1.15, 1)}>
    <div class="latest-text">
      <div class="latest-head"><h2 class="rv h2">${esc(B.latest.title)}</h2><a class="btn btn-line" href="${B.latest.all.href}">${esc(B.latest.all.label)} ${arrow}</a></div>
      <div class="posts">${B.latest.posts.map(p => `<a class="post rv" href="${p.href}"><span>${esc(p.title)}</span>${arrow}</a>`).join('')}</div>
    </div>
  </div>
</section>

<section class="cta" id="cta" ${S(22, 0, 0, 1.6, .5)}>
  <h2 class="cta-title">${B.cta.title.map(esc).join('<br>')}</h2>
  <a class="btn btn-white" href="#">${esc(B.cta.button)} ${arrow}</a>
</section>`;

const F = B.footer;
$('#foot').setAttribute('data-form', '22'); $('#foot').dataset.x = 0; $('#foot').dataset.y = .45; $('#foot').dataset.s = 1.1; $('#foot').dataset.o = .2;
$('#foot').innerHTML = `
  <div class="foot-top">
    <div class="foot-news">
      <img src="../shared/assets/bitgo-logo.svg" alt="BitGo" width="150" height="51">
      <p>${esc(F.newsletter)}</p>
      <form class="foot-form" onsubmit="return false"><label class="sr" for="footEmail">${esc(F.email)}</label><input id="footEmail" type="email" autocomplete="email" placeholder="${esc(F.email)}"><button class="btn btn-blue" type="submit">${esc(F.subscribe)}</button></form>
      <ul class="socials">${F.socials.map(s => `<li><a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>
    </div>
    <div class="foot-links">${B.menus.slice(0, 4).map(m => `<div><h4>${esc(m.label)}</h4><ul>${m.groups[0].items.slice(0, 6).map(it => `<li><a href="${it.href}">${esc(it.label)}</a></li>`).join('')}</ul></div>`).join('')}</div>
  </div>
  <div class="legal">${F.legal.map(p => `<p>${esc(p)}</p>`).join('')}<p>${esc(F.review)} <a href="${F.privacy.href}">${esc(F.privacy.label)}</a> ${esc(F.and)} <a href="${F.disclaimers.href}">${esc(F.disclaimers.label)}</a>.</p><p>${esc(F.screenReader)}</p><p>${esc(F.complaints)}</p></div>
  <div class="foot-bottom"><span>${esc(F.nmls)}</span><span>${esc(F.choices)}</span><span>${esc(F.rights)}</span></div>`;

/* ---------------- reveal ---------------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.rv').forEach(e => io.observe(e));

/* ---------------- hero word ---------------- */
const rotW = $('#rotW'), words = B.hero.words; let wi = 0, typing = false;
rotW.textContent = words[0];
const heroBlk = $('#heroBlk');
function setWord(next) {
  heroBlk.dataset.form = next; // vault, desk, tower follow the word
  if (reduced) { rotW.textContent = words[next]; return; }
  typing = true; const from = rotW.textContent, to = words[next]; let i = from.length;
  const erase = () => { if (i > 0) { rotW.textContent = from.slice(0, --i); setTimeout(erase, 34); } else { let j = 0; const type = () => { rotW.textContent = to.slice(0, ++j); if (j < to.length) setTimeout(type, 70); else typing = false; }; setTimeout(type, 140); } };
  erase();
}
setInterval(() => { if (document.hidden) return; wi = (wi + 1) % words.length; setWord(wi); }, 5200);

/* ---------------- own: scrubbed typing ---------------- */
const ownItems = $$('.own-item').map((el, i) => ({ el, word: $('.own-word', el), spans: $$('.own-desc span', el), title: B.own.items[i].title }));
const ownWrap = $('#own'), ticks = $('#ticks');
ticks.innerHTML = ownItems.map(() => '<li></li>').join(''); const tickEls = [...ticks.children];
function updateOwn() {
  const vh = innerHeight;
  ownItems.forEach((o, i) => {
    const r = o.el.getBoundingClientRect();
    const u = reduced ? 1 : clamp((vh * .88 - r.top) / (vh * .5));
    const n = Math.round(o.title.length * clamp(u / .35));
    const txt = o.title.slice(0, n); if (o.word._t !== txt) { o.word._t = txt; o.word.innerHTML = esc(txt) + '<i class="caret"></i>'; }
    const m = o.spans.length;
    o.spans.forEach((s, j) => { const v = reduced ? 1 : clamp((u - .3 - j * (.4 / m)) / .12); s.style.opacity = v; s.style.filter = v < 1 ? `blur(${((1 - v) * 10).toFixed(1)}px)` : 'none'; });
  });
  const r = ownWrap.getBoundingClientRect(); ticks.classList.toggle('on', r.top < vh * .5 && r.bottom > vh * .5);
}

/* ---------------- stages: choose the form for what is on screen ---------------- */
const stages = $$('[data-form]');
let current = null;
function stageNow() {
  const mid = innerHeight * .5; let best = null, bd = 1e9;
  for (const el of stages) { const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) return el; const d = Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid)); if (d < bd) { bd = d; best = el; } }
  return best;
}
let matter = null;
function applyStage() {
  const el = stageNow(); if (!el) return;
  const narrow = innerWidth < 800;
  const d = el.dataset; let x = +d.x, y = +d.y, s = +d.s, o = +d.o;
  if (narrow) { x = 0; y = .36; o = Math.min(o, .6); }
  matter && matter.set({ form: +d.form, x, y, s, o });
  const oi = ownItems.findIndex(o2 => o2.el === el); tickEls.forEach((t, i) => t.classList.toggle('on', i === oi));
}

/* ---------------- loop ---------------- */
let lastY = -1;
function tick() {
  const y = scrollY; nav.classList.toggle('stuck', y > 30);
  applyStage(); updateOwn(); matter && matter.scroll(y);
  requestAnimationFrame(tick);
}
import('./matter.js').then(m => { matter = m.initMatter($('#matter')); if (matter) document.documentElement.classList.add('gl'); addEventListener('resize', () => matter && matter.resize()); }).catch(e => console.warn('matter off', e));
requestAnimationFrame(tick);
