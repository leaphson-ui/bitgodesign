import { Studio, VIEWS } from './sculpt.js';
import { createStack } from './stack.js';

const B = window.BITGO;
const LOGO = '../shared/assets/bitgo-logo.svg';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('rm');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const AR = '<svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M14 6l6 6-6 6"/></svg>';
const ext = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M8 6h10v10"/></svg>';
const pillA = (label, href, cls = 'pill-blue') => `<a class="pill ${cls}" href="${href}">${esc(label)}${AR}</a>`;

/* ---------- build DOM from live copy ---------- */
document.querySelector('.skip').textContent = B.skip;

const menuHTML = (m) => `<div class="mega" data-m="${m.label}" style="--cols:${m.groups.length}">${m.groups.map((g) => `<div class="grp${g.items.length > 9 ? ' wide' : ''}"><h4>${esc(g.title)}</h4><ul>${g.items.map((i) => `<li><a href="${i.href}">${esc(i.label)}</a></li>`).join('')}</ul></div>`).join('')}</div>`;
document.getElementById('nav').innerHTML = `
<div class="nav-in">
  <a class="nav-logo" href="#" aria-label="BitGo"><img src="${LOGO}" alt="BitGo" width="542" height="184"></a>
  <nav class="menus" aria-label="Main">${B.menus.map((m, i) => `<div class="menu" data-i="${i}"><button aria-expanded="false">${esc(m.label)}<i></i></button></div>`).join('')}</nav>
  <div class="nav-act"><span class="lang">${esc(B.navActions.language)}</span><a class="lnk" href="${B.navActions.signup.href}">${esc(B.navActions.signup.label)}</a><a class="lnk" href="${B.navActions.login.href}">${esc(B.navActions.login.label)}</a><a class="pill pill-blue" href="#cta">${esc(B.navActions.connect)}</a><button class="burger" aria-label="Menu"></button></div>
</div>${B.menus.map(menuHTML).join('')}`;
document.getElementById('mobileMenu').innerHTML = B.menus.map((m) => `<details><summary>${esc(m.label)}</summary><div>${m.groups.map((g) => `<h4>${esc(g.title)}</h4><ul>${g.items.map((i) => `<li><a href="${i.href}">${esc(i.label)}</a></li>`).join('')}</ul>`).join('')}</div></details>`).join('')
  + `<div style="display:flex;gap:10px;margin-top:30px;flex-wrap:wrap"><a class="pill pill-line" href="${B.navActions.signup.href}">${esc(B.navActions.signup.label)}</a><a class="pill pill-line" href="${B.navActions.login.href}">${esc(B.navActions.login.label)}</a></div>`;

const H = B.hero;
const marqRow = (logos) => `<div class="marq"><div class="marq-row">${logos.map((l) => `<img src="${l}" alt="" loading="lazy">`).join('')}</div><div class="marq-row" aria-hidden="true">${logos.map((l) => `<img src="${l}" alt="" loading="lazy">`).join('')}</div></div>`;
const half = Math.ceil(B.trust.logos.length / 2);
const bl = B.badges.map((b) => b.label);
// badge lines: split each badge across two staggered lines
const badgeLines = [['NYSE LISTED:', 'BTGO'], ['OCC FEDERALLY', 'CHARTERED'], ['FOUNDED', 'IN 2013']];
const plain = (s) => s.charAt(0) + s.slice(1).toLowerCase();

const stillCv = (view, w = 1600, h = 1000, cls = '') => `<canvas class="${cls}" data-still="${view}" data-w="${w}" data-h="${h}" aria-hidden="true"></canvas>`;

document.getElementById('main').innerHTML = `
<section class="hero" id="hero">
  <div class="hero-pin">
    <div class="hero-fallback"></div><canvas id="heroCanvas" aria-hidden="true"></canvas><div class="hero-shade"></div>
    <h1 class="hero-h1 d" aria-label="${esc(H.h1)}">
      <span class="ln l1"><span class="rot">${H.words.map((w) => `<span>${esc(w)}</span>`).join('')}</span></span>
      <span class="ln l2">${H.rest.split(' ').slice(0, 2).map((w) => `<span>${esc(w)}</span>`).join(' ')}</span>
      <span class="ln l3">${esc(H.rest.split(' ')[2])}</span>
      <span class="ln l4">${esc(H.rest.split(' ')[3])}</span>
    </h1>
    <div class="hero-foot wrap"><p class="hero-sub">${esc(H.sub)}</p>${pillA(H.cta, '#cta', 'pill-blue')}</div>
    <div class="scrollcue"></div>
  </div>
</section>

<section class="trust" id="trust">
  <div class="wrap"><h2 class="rv">${esc(B.trust.title)}</h2></div>
  ${marqRow(B.trust.logos.slice(0, half))}${marqRow(B.trust.logos.slice(half))}
</section>

<section class="badges grain" id="badges">
  ${stillCv('badges', 1600, 1200)}
  <div class="wrap d">
    ${badgeLines.map((p, i) => `<span class="b${i % 1 === 0 ? '' : ''}">${p[0]}</span><span class="b r">${p[1]}</span>`).join('')}
  </div>
  <h2 class="sr" style="position:absolute;left:-9999px">${bl.map(esc).join(', ')}</h2>
</section>

<section class="core" id="core">
  <div class="wrap core-head"><h2 class="d">${B.core.title.map((t) => `<span>${esc(t)}</span>`).join('')}</h2></div>
  <div class="core-track" id="coreTrack"><div class="core-pin"><div class="wrap">
    <div class="stack-cv"><canvas id="stackCanvas" aria-hidden="true"></canvas></div>
    <div class="acc" id="acc">${B.core.items.map((it, i) => `
      <div class="acc-i${i === 0 ? ' open' : ''}" data-i="${i}">
        <button class="acc-b" aria-expanded="${i === 0}"><h3>${esc(it.title)}</h3><span class="x"></span></button>
        <div class="acc-p"><div><p class="s">${esc(it.short)}</p><p class="l">${esc(it.long)}</p>${pillA(it.cta.label, it.cta.href, 'pill-blue')}</div></div>
      </div>`).join('')}</div>
  </div></div></div>
</section>

<section class="est" id="established">
  <div class="wrap">
    <div class="est-top"><h2 class="d rv">${esc(B.established.title)}</h2><div class="rv"><p>${esc(B.established.text)}</p>${pillA(B.established.cta.label, B.established.cta.href, 'pill-blue')}</div></div>
    <div class="est-row rv" id="estRow">${B.established.logos.map((l) => `
      <${l.text ? 'a href="' + l.href + '"' : 'div'} class="tile${l.text ? ' t' : ''}" ${l.text ? '' : 'aria-label="' + esc(l.name) + '"'}>
        <img src="${l.image}" alt="${esc(l.name)}" loading="lazy">${l.text ? `<p class="tx">${esc(l.text)}</p>` : '<span></span>'}
      </${l.text ? 'a' : 'div'}>`).join('')}</div>
  </div>
</section>

<section class="build" id="build"><div class="wrap">
  <h2 class="d">${B.build.title.split(' ').reduce((a, w, i) => { (i < 1 ? a[0] : i < 3 ? a[1] : a[2]).push(w); return a; }, [[], [], []]).map((l) => `<span>${esc(l.join(' '))}</span>`).join('')}</h2>
  ${B.build.cards.map((c, i) => `
  <article class="bld">
    <div class="bld-img rv">${stillCv('build' + (i + 1), 1600, 1100)}</div>
    <div class="bld-tx rv"><h3 class="d">${esc(c.label)}</h3><p>${esc(c.text)}</p>${pillA(c.cta.label, c.cta.href, 'pill-white')}</div>
  </article>`).join('')}
</div></section>

<section class="support" id="support">
  ${stillCv('support', 1800, 1100)}
  <div class="wrap">
    <h2 class="d">24/7<br><em>${esc(B.support.label.replace('24/7 ', ''))}</em></h2>
    <p class="sub rv">${esc(B.support.title)}</p>
    <ul class="sup-l">${B.support.items.map((t) => `<li class="rv">${esc(t)}</li>`).join('')}</ul>
  </div>
</section>

<section class="own" id="own"><div class="wrap own-g">
  <h2 class="d">${esc(B.own.title)}</h2>
  <div class="own-l">${B.own.items.map((it) => `<div class="own-r"><h3 class="d">${esc(it.title)}</h3><p>${esc(it.text)}</p></div>`).join('')}</div>
</div></section>

<section class="spot" id="spotlight">
  <div class="wrap spot-top"><h2 class="d">${esc(B.spotlight.label)}</h2><div class="arrows"><button aria-label="Previous" data-d="-1">${AR.replace('class="ar"', 'style="width:22px;transform:scaleX(-1)"')}</button><button aria-label="Next" data-d="1">${AR.replace('class="ar"', 'style="width:22px"')}</button></div></div>
  <div class="spot-track" id="track">${B.spotlight.slides.map((s, i) => `
    <a class="vid" href="${s.video}" target="_blank" rel="noopener">${stillCv('spot' + (i + 1), 1400, 900)}<span class="play"><svg viewBox="0 0 20 20" fill="#fff"><path d="M3 1.5v17l15-8.5z"/></svg></span><h3 class="d" style="text-transform:none;letter-spacing:-.02em;line-height:1.06">${esc(s.title)}</h3></a>`).join('')}</div>
</section>

<section class="latest" id="latest"><div class="wrap">
  <div class="latest-top"><h2 class="d">${esc(B.latest.title)}</h2>${pillA(B.latest.all.label, B.latest.all.href, 'pill-blue')}</div>
  <div class="posts">${B.latest.posts.map((p) => `<a class="post" href="${p.href}"><span>${esc(p.title)}</span>${ext}</a>`).join('')}</div>
</div></section>

<section class="cta grain" id="cta">
  ${stillCv('cta', 1800, 1100)}
  <div class="wrap"><h2 class="d">${B.cta.title.map((t) => `<span>${esc(t)}</span>`).join('')}</h2>${pillA(B.cta.button, B.BITGO, 'pill-blue')}</div>
</section>`;

const F = B.footer;
const colLinks = B.menus.slice(0, 4).flatMap((m) => m.groups.slice(0, 2)).slice(0, 5);
document.getElementById('footer').innerHTML = `<div class="wrap">
  <div class="foot-top">
    <div class="foot-news"><a class="foot-logo" href="#"><img src="${LOGO}" alt="BitGo"></a><p>${esc(F.newsletter)}</p>
      <form class="news" onsubmit="return false"><input type="email" placeholder="${esc(F.email)}" aria-label="${esc(F.email)}"><button class="pill pill-white" type="submit">${esc(F.subscribe)}</button></form>
      <div class="soc">${F.socials.map((s) => `<a href="${s.href}" rel="noopener">${esc(s.label)}</a>`).join('')}</div></div>
    <div class="foot-cols">${colLinks.map((g) => `<div><h4>${esc(g.title)}</h4>${g.items.slice(0, 6).map((i) => `<a href="${i.href}">${esc(i.label)}</a>`).join('')}</div>`).join('')}</div>
  </div>
  <div class="legal">${F.legal.map((p) => `<p>${esc(p)}</p>`).join('')}
    <p>${esc(F.complaints)}</p><p>${esc(F.screenReader)}</p>
    <div class="legal-b"><span>${esc(F.review)} <a href="${F.privacy.href}">${esc(F.privacy.label)}</a> ${esc(F.and)} <a href="${F.disclaimers.href}">${esc(F.disclaimers.label)}</a></span><span>${esc(F.nmls)}</span><span>${esc(F.choices)}</span><span>${esc(F.rights)}</span></div>
  </div></div>`;

/* ---------- nav ---------- */
const nav = document.getElementById('nav');
const openMenu = (i) => {
  nav.querySelectorAll('.menu').forEach((m) => { const on = +m.dataset.i === i; m.classList.toggle('open', on); m.querySelector('button').setAttribute('aria-expanded', on); });
  nav.querySelectorAll('.mega').forEach((m, k) => (m.style.display = k === i ? 'grid' : 'none'));
};
nav.querySelectorAll('.menu').forEach((m) => {
  const i = +m.dataset.i;
  m.addEventListener('mouseenter', () => matchMedia('(hover:hover)').matches && openMenu(i));
  m.querySelector('button').addEventListener('click', () => openMenu(m.classList.contains('open') ? -1 : i));
});
nav.addEventListener('mouseleave', () => openMenu(-1));
document.addEventListener('keydown', (e) => e.key === 'Escape' && openMenu(-1));
document.addEventListener('click', (e) => { if (!nav.contains(e.target)) openMenu(-1); });
nav.querySelector('.burger').addEventListener('click', () => nav.classList.toggle('m-open'));
document.getElementById('mobileMenu').addEventListener('click', (e) => e.target.closest('a') && nav.classList.remove('m-open'));
openMenu(-1);

/* ---------- scroll engine ---------- */
gsap.registerPlugin(ScrollTrigger);
let lenis = null, vel = 0;
if (!reduced && window.Lenis) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
  lenis.on('scroll', (e) => { ScrollTrigger.update(); vel = e.velocity; });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href'); if (id.length < 2) return;
  const el = document.querySelector(id); if (!el) return; e.preventDefault();
  lenis ? lenis.scrollTo(el) : el.scrollIntoView();
}));

/* hero rotating word */
{
  const words = [...document.querySelectorAll('.rot > span')];
  words.forEach((w, i) => gsap.set(w, { yPercent: i ? 110 : 0 }));
  let cur = 0;
  if (!reduced) setInterval(() => {
    const nx = (cur + 1) % words.length;
    gsap.to(words[cur], { yPercent: -110, duration: 0.9, ease: 'power4.inOut' });
    gsap.fromTo(words[nx], { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'power4.inOut' });
    cur = nx;
  }, 2600);
}

let heroP = 0;
ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (s) => (heroP = s.progress) });
if (!reduced) {
  const dirs = [-1, 1, -1, 1];
  document.querySelectorAll('.hero-h1 .ln').forEach((ln, i) => {
    gsap.to(ln, { xPercent: dirs[i] * (10 + i * 5), ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: '70% top', scrub: true } });
  });
  gsap.to('.hero-h1', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: '55% top', end: '85% top', scrub: true } });
  gsap.to('.hero-foot, .scrollcue', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: '8% top', end: '25% top', scrub: true } });

  // marquees: drift plus scroll velocity
  const rows = [...document.querySelectorAll('.marq')];
  const pos = rows.map(() => 0);
  gsap.ticker.add((t, dt) => {
    rows.forEach((r, i) => {
      const w = r.firstElementChild.offsetWidth, dir = i % 2 ? 1 : -1;
      pos[i] += dir * (0.05 + Math.abs(vel) * 0.02) * dt;
      if (pos[i] < -w) pos[i] += w; if (pos[i] > 0) pos[i] -= w;
      r.style.transform = `translate3d(${pos[i]}px,0,0)`;
    });
  });

  // badges
  document.querySelectorAll('.badges .b').forEach((b, i) => {
    gsap.fromTo(b, { xPercent: i % 2 ? 14 : -14, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: b, start: 'top 96%', end: 'top 55%', scrub: 0.6 } });
  });
  // generic reveal
  ScrollTrigger.batch('.rv', { start: 'top 92%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.09, ease: 'power3.out' }) });
  // still parallax
  document.querySelectorAll('.bld-img canvas').forEach((c) => gsap.fromTo(c, { yPercent: -5, scale: 1 }, { yPercent: 5, scale: 1.04, ease: 'none', scrollTrigger: { trigger: c.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  ['support', 'cta', 'badges'].forEach((id) => gsap.fromTo(`#${id} > canvas`, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: `#${id}`, start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.utils.toArray('.build h2 span, .core-head h2 span, .cta h2 span, .est h2').forEach((s, i) => gsap.from(s, { yPercent: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 90%', once: true } }));
} else {
  document.querySelectorAll('.rv').forEach((e) => (e.style.opacity = 1, e.style.transform = 'none'));
}

/* own rows */
{
  const rows = [...document.querySelectorAll('.own-r')];
  const pick = () => {
    const mid = innerHeight * 0.5; let best = -1, bd = 1e9;
    rows.forEach((r, i) => { const b = r.getBoundingClientRect(); const d = Math.abs((b.top + b.bottom) / 2 - mid); if (d < bd && b.top < innerHeight && b.bottom > 0) { bd = d; best = i; } });
    rows.forEach((r, i) => r.classList.toggle('on', i === best));
  };
  ScrollTrigger.create({ trigger: '.own-l', start: 'top bottom', end: 'bottom top', onUpdate: pick, onRefresh: pick });
}

/* established tiles */
{
  const tiles = [...document.querySelectorAll('.tile.t')];
  tiles[0] && tiles[0].classList.add('on');
  tiles.forEach((t) => t.addEventListener('mouseenter', () => { tiles.forEach((o) => o.classList.toggle('on', o === t)); }));
  tiles.forEach((t) => t.addEventListener('focus', () => { tiles.forEach((o) => o.classList.toggle('on', o === t)); }));
}

/* spotlight arrows */
document.querySelectorAll('.arrows button').forEach((b) => b.addEventListener('click', () => {
  const tr = document.getElementById('track'); tr.scrollBy({ left: +b.dataset.d * tr.querySelector('.vid').offsetWidth * 0.9, behavior: 'smooth' });
}));

/* ---------- 3D: stack ---------- */
let stack = null, stackIdx = -1;
const items = [...document.querySelectorAll('.acc-i')];
function setAcc(i, fromScroll) {
  if (i === stackIdx) return; stackIdx = i;
  items.forEach((it, k) => { it.classList.toggle('open', k === i); it.querySelector('.acc-b').setAttribute('aria-expanded', k === i); });
  stack && stack.setActive(i);
}
items.forEach((it, i) => it.querySelector('.acc-b').addEventListener('click', () => setAcc(i)));
const desktopCore = matchMedia('(min-width: 901px)');
ScrollTrigger.create({
  trigger: '#coreTrack', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: (s) => {
    if (!desktopCore.matches) return;
    setAcc(Math.min(items.length - 1, Math.floor(s.progress * items.length * 0.98)), true);
  },
});
const explodeVal = { v: 0 };
try {
  stack = createStack(document.getElementById('stackCanvas'));
  stack.setActive(0); stackIdx = 0;
  stack.resize(); addEventListener('resize', () => stack.resize());
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? stack.start() : stack.stop())), { rootMargin: '100px' });
  io.observe(document.querySelector('.stack-cv'));
  ScrollTrigger.create({ trigger: '#core', start: 'top 70%', end: 'top 10%', scrub: true, onUpdate: (s) => stack.setExplode(s.progress) });
  if (reduced) { stack.setExplode(1); }
} catch (e) { console.warn('stack unavailable', e); }

/* ---------- 3D: hero ---------- */
let hero = null;
function startHero() {
  const cv = document.getElementById('heroCanvas');
  try {
    hero = new Studio(cv);
    hero.setView(VIEWS.hero);
    const fit = () => {
      const r = cv.getBoundingClientRect();
      let dpr = Math.min(devicePixelRatio || 1, 2);
      while (dpr > 1 && r.width * r.height * dpr * dpr > 3.2e6) dpr -= 0.25;
      hero.renderer.setPixelRatio(dpr);
      hero.size(r.width, r.height);
    };
    fit(); addEventListener('resize', fit);
    let mx = 0, my = 0, sx = 0, sy = 0, vis = true;
    addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
    new IntersectionObserver((es) => (vis = es[0].isIntersecting)).observe(document.getElementById('hero'));
    const base = VIEWS.hero;
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (!vis) return;
      const t = now / 1000, p = heroP;
      sx += (mx - sx) * 0.05; sy += (my - sy) * 0.05;
      const m = hero.mesh;
      m.rotation.set(base.rot[0] + p * 0.5 + sy * 0.15, base.rot[1] + (reduced ? 0 : t * 0.035) + p * 1.9 + sx * 0.3, base.rot[2] - p * 0.4);
      hero.camera.position.set(sx * 0.6, base.cam[1] + p * 2.2 - sy * 0.4, (base.cam[2] - p * 4.6) * (hero.camera.aspect < 1 ? 1.7 : 1));
      hero.camera.lookAt(0, p * 0.4, 0);
      hero.draw(reduced ? 1 : t, 1.05 - p * 0.28 + (1 - Math.min(1, t / 2.5)) * -0.4);
    };
    requestAnimationFrame(tick);
    cv.classList.add('on');
  } catch (e) { console.warn('hero webgl unavailable', e); }
}
startHero();

/* ---------- stills: one offscreen renderer, many fluted crops ---------- */
function runStills() {
  const targets = [...document.querySelectorAll('canvas[data-still]')];
  if (!targets.length) return;
  let st;
  try { st = new Studio(document.createElement('canvas'), { dpr: 1 }); } catch (e) { console.warn('stills unavailable'); return; }
  const queue = targets.slice();
  const next = () => {
    const c = queue.shift();
    if (!c) { st.dispose(); return; }
    const v = VIEWS[c.dataset.still]; const w = +c.dataset.w, h = +c.dataset.h;
    try {
      st.setView(v); st.size(w, h); st.draw(3.7, 1.0);
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(st.canvas, 0, 0);
      c.style.opacity = 0; c.style.transition = 'opacity 1.2s';
      requestAnimationFrame(() => (c.style.opacity = 1));
    } catch (e) { console.warn('still failed', c.dataset.still, e); }
    setTimeout(next, 120);
  };
  setTimeout(next, 600);
}
runStills();

addEventListener('load', () => ScrollTrigger.refresh());
document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
