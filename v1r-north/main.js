import { initHero, initStack, initLayer, initSilk } from './gl.js';

const B = window.BITGO;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lines = (arr) => arr.map((l) => `<span class="ln">${esc(l)}</span>`).join('');

/* ---------- build the DOM from the live copy ---------- */
function build() {
  const na = B.navActions;
  $('#navLinks').innerHTML = B.menus.map((m) => `
    <div class="nav-item"><button type="button" aria-expanded="false">${esc(m.label)}</button>
      <div class="panel">${m.groups.map((g) => `<div class="grp${g.items.length > 9 ? ' long' : ''}"><h4>${esc(g.title)}</h4><ul>${g.items.map((i) => `<li><a href="${esc(i.href)}">${esc(i.label)}</a></li>`).join('')}</ul></div>`).join('')}</div>
    </div>`).join('');
  $('#navActions').innerHTML = `<span class="lang">${esc(na.language)}</span>
    <a class="pill pill-ghost" href="${esc(na.signup.href)}">${esc(na.signup.label)}</a>
    <a class="pill pill-ghost" href="${esc(na.login.href)}">${esc(na.login.label)}</a>
    <a class="pill pill-blue" href="#cta">${esc(na.connect)}</a>`;

  const h = B.hero;
  $('#rot').innerHTML = h.words.map((w, i) => `<span class="${i === 0 ? 'on' : ''}">${esc(w)}</span>`).join('');
  $('#heroSub').textContent = h.sub; $('#heroCta').textContent = h.cta;

  $('#trustTitle').textContent = B.trust.title;
  const logos = B.trust.logos.map((s) => `<img src="${s}" alt="" loading="eager">`).join('');
  $('#marqueeTrack').innerHTML = logos + logos + logos;
  $('#badgesRow').innerHTML = B.badges.map((b) => `<div class="badge frame rv">${esc(b.label)}</div>`).join('');

  $('#coreTitle').innerHTML = lines(B.core.title);
  $('#coreList').innerHTML = B.core.items.map((it, i) => `
    <div class="core-row${i === 0 ? ' active' : ''}" data-i="${i}">
      <button type="button" aria-expanded="${i === 0}"><h3>${esc(it.title)}</h3><p class="short">${esc(it.short)}</p></button>
      <div class="more"><div><p class="long">${esc(it.long)}</p><a class="pill pill-blue" href="${esc(it.cta.href)}">${esc(it.cta.label)}</a></div></div>
    </div>`).join('');

  const e = B.established;
  $('#estTitle').innerHTML = ['The most', 'trusted', 'solution', 'in crypto'].map((l) => `<span class="ln">${l}</span>`).join('');
  $('#estText').textContent = e.text;
  const ec = $('#estCta'); ec.textContent = e.cta.label; ec.href = e.cta.href;
  $('#estLogos').innerHTML = e.logos.map((l) => `
    <div class="est-cell frame rv${l.text ? ' has' : ''}" ${l.text ? 'tabindex="0"' : ''} style="--d:${(Math.random() * 0.25).toFixed(2)}s">
      <img src="${l.image}" alt="${esc(l.name)}">${l.text ? `<div class="tx">${esc(l.text)}</div>` : ''}</div>`).join('');

  $('#buildTitle').innerHTML = lines(['Architect', 'the new economy']);
  const fix = (s) => s.replace('place-hold', 'place. Hold');
  $('#layers').innerHTML = B.build.cards.map((c, i) => `
    <article class="layer">
      <div class="layer-art frame rv"><canvas data-mode="${i}" aria-hidden="true"></canvas></div>
      <div class="layer-row"><h3 class="rv">${esc(c.label)}</h3><div class="rv"><p>${esc(fix(c.text))}</p><a class="pill pill-ink" href="${esc(c.cta.href)}">${esc(c.cta.label)}</a></div></div>
    </article>`).join('');

  const s = B.support;
  $('#supLabel').textContent = s.label; $('#supTitle').textContent = s.title;
  $('#supList').innerHTML = s.items.map((t, i) => `<li class="rv" style="--d:${i * 0.07}s">${esc(t)}</li>`).join('');

  $('#ownTitle').textContent = B.own.title;
  $('#ownList').innerHTML = B.own.items.map((it, i) => `<div class="own-row rv" style="--i:${i}"><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div>`).join('');

  $('#spotTitle').textContent = B.spotlight.label;
  $('#spotGrid').innerHTML = B.spotlight.slides.map((v, i) => `
    <a class="vid rv" href="${esc(v.video)}" target="_blank" rel="noopener" style="--d:${i * 0.1}s">
      <div class="vid-art">${spotArt(i)}<span class="vid-play"><i></i>Watch</span></div><h3>${esc(v.title)}</h3></a>`).join('');

  $('#latestTitle').textContent = B.latest.title;
  const la = $('#latestAll'); la.textContent = B.latest.all.label; la.href = B.latest.all.href;
  $('#posts').innerHTML = B.latest.posts.map((p) => `<li class="post rv"><a href="${esc(p.href)}"><h3>${esc(p.title)}</h3><span class="arr"></span></a></li>`).join('');

  $('#ctaTitle').innerHTML = lines(B.cta.title); $('#ctaBtn').textContent = B.cta.button;

  const f = B.footer;
  $('#newsLabel').textContent = f.newsletter; $('#email').placeholder = f.email; $('#newsBtn').textContent = f.subscribe;
  $('#socials').innerHTML = f.socials.map((x) => `<li><a href="${esc(x.href)}">${esc(x.label)}</a></li>`).join('');
  $('#legal').innerHTML = f.legal.map((p) => `<p>${esc(p)}</p>`).join('') + `<p>${esc(f.screenReader)}</p><p>${esc(f.complaints)}</p>`;
  $('#footLinks').innerHTML = `<span>${esc(f.review)} <a href="${esc(f.privacy.href)}">${esc(f.privacy.label)}</a> ${esc(f.and)} <a href="${esc(f.disclaimers.href)}">${esc(f.disclaimers.label)}</a></span><span>${esc(f.nmls)}</span><a href="#">${esc(f.choices)}</a><span>${esc(f.rights)}</span>`;

  // corner ticks on every frame
  $$('.frame').forEach((el) => { ['tl', 'tr', 'bl', 'br'].forEach((c) => { const i = document.createElement('i'); i.className = 't ' + c; el.appendChild(i); }); });
  $('#news').addEventListener('submit', (ev) => ev.preventDefault());
}

/* generated spotlight art: three distinct light studies, grain from an SVG filter */
function spotArt(i) {
  const id = 'g' + i;
  const grain = `<filter id="n${i}"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .22 0"/></filter>`;
  const grainRect = `<rect width="400" height="500" filter="url(#n${i})" style="mix-blend-mode:overlay"/>`;
  if (i === 0) { // arcs rising from a baseline
    const arcs = [0, 1, 2, 3, 4, 5, 6].map((k) => `<circle cx="200" cy="560" r="${90 + k * 46}" fill="none" stroke="${k % 3 === 0 ? '#6f92ff' : '#1647DB'}" stroke-width="${k % 3 === 0 ? 3 : 22}" opacity="${0.95 - k * 0.1}"/>`).join('');
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="${id}" cx="50%" cy="100%" r="90%"><stop offset="0" stop-color="#2a5cf5"/><stop offset=".6" stop-color="#0a1a52"/><stop offset="1" stop-color="#05060a"/></radialGradient>${grain}</defs><rect width="400" height="500" fill="url(#${id})"/>${arcs}${grainRect}</svg>`;
  }
  if (i === 1) { // slanted beams
    const beams = [0, 1, 2, 3, 4].map((k) => `<rect x="${-80 + k * 92}" y="-60" width="${26 + k * 10}" height="700" fill="${k === 3 ? '#1647DB' : '#0f1830'}" transform="rotate(24 200 250)" opacity="${k === 3 ? 1 : 0.9}"/>`).join('');
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0d14"/><stop offset="1" stop-color="#1d3a9a"/></linearGradient>${grain}</defs><rect width="400" height="500" fill="url(#${id})"/>${beams}<rect x="0" y="330" width="400" height="170" fill="#05060a" opacity=".55"/>${grainRect}</svg>`;
  }
  const sq = [0, 1, 2, 3, 4, 5, 6].map((k) => `<rect x="${200 - 160 + k * 18}" y="${150 - 40 + k * 18}" width="${320 - k * 36}" height="${320 - k * 36}" rx="${34 - k * 3}" fill="none" stroke="${k === 6 ? '#6f92ff' : '#2a5cf5'}" stroke-width="${k % 2 ? 3 : 14}" opacity="${0.35 + k * 0.1}" transform="rotate(${-18 + k * 6} 200 310)"/>`).join('');
  return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="${id}" cx="50%" cy="62%" r="75%"><stop offset="0" stop-color="#1647DB"/><stop offset=".55" stop-color="#081448"/><stop offset="1" stop-color="#04050a"/></radialGradient>${grain}</defs><rect width="400" height="500" fill="url(#${id})"/>${sq}${grainRect}</svg>`;
}

build();

/* ---------- nav ---------- */
const nav = $('#nav');
$$('.nav-item > button').forEach((b) => b.addEventListener('click', () => {
  const it = b.parentElement; const was = it.classList.contains('open');
  $$('.nav-item').forEach((x) => x.classList.remove('open')); if (!was) it.classList.add('open');
  b.setAttribute('aria-expanded', String(!was));
}));
document.addEventListener('click', (e) => { if (!e.target.closest('.nav-item')) $$('.nav-item').forEach((x) => x.classList.remove('open')); });
$('#burger').addEventListener('click', () => {
  const o = nav.classList.toggle('menu-open'); $('#burger').setAttribute('aria-expanded', String(o));
});
$$('#navLinks a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('menu-open')));
const navSections = $$('[data-nav]');
function navTheme() {
  let theme = 'dark';
  for (const s of navSections) { const r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) { theme = s.dataset.nav; break; } }
  nav.classList.toggle('light', theme === 'light' && !nav.classList.contains('menu-open'));
  nav.classList.toggle('scrolled', scrollY > 60);
}

/* ---------- hero word rotation ---------- */
{
  const ws = $$('#rot span'); let k = 0;
  if (!reduce) setInterval(() => {
    const cur = ws[k]; k = (k + 1) % ws.length; const nx = ws[k];
    cur.classList.remove('on'); cur.classList.add('out');
    nx.style.transition = 'none'; nx.classList.remove('out'); nx.getBoundingClientRect(); nx.style.transition = '';
    nx.classList.add('on');
    setTimeout(() => { cur.style.transition = 'none'; cur.classList.remove('out'); cur.getBoundingClientRect(); cur.style.transition = ''; }, 950);
  }, 2600);
  // ghost the longest word so the slot never changes width
  const longest = [...B.hero.words].sort((a, b) => b.length - a.length)[0];
  $('#rot').insertAdjacentHTML('beforeend', `<span aria-hidden="true" style="visibility:hidden;transform:none">${esc(longest)}</span>`);
}

/* ---------- reveals ---------- */
{
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  $$('.rv').forEach((el) => io.observe(el));
}

/* ---------- clock (support) ---------- */
{
  const svg = $('#clock'); let h = '';
  h += `<defs><radialGradient id="ck" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#1647DB" stop-opacity=".45"/><stop offset="1" stop-color="#1647DB" stop-opacity="0"/></radialGradient></defs><circle cx="300" cy="300" r="290" fill="url(#ck)"/>`;
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2, big = i % 6 === 0, r1 = big ? 232 : 252, r2 = 282;
    h += `<line x1="${300 + Math.sin(a) * r1}" y1="${300 - Math.cos(a) * r1}" x2="${300 + Math.sin(a) * r2}" y2="${300 - Math.cos(a) * r2}" stroke="${big ? '#fff' : '#7a86a6'}" stroke-width="${big ? 4 : 2}" stroke-linecap="round"/>`;
  }
  h += `<circle cx="300" cy="300" r="214" fill="none" stroke="rgba(255,255,255,.18)"/>`;
  h += `<g id="arm"><line x1="300" y1="300" x2="300" y2="40" stroke="#6f92ff" stroke-width="3" stroke-linecap="round"/><circle cx="300" cy="40" r="9" fill="#6f92ff"/></g>`;
  svg.innerHTML = h;
}

/* ---------- scroll engine: Lenis + GSAP ---------- */
let lenis = null;
const gsap = window.gsap, ST = window.ScrollTrigger;
if (gsap && ST) {
  gsap.registerPlugin(ST);
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  if (!reduce) {
    const hero = '#hero';
    const sc = (trigger, start = 'top bottom', end = 'bottom top') => ({ trigger, start, end, scrub: 0.6 });
    gsap.to('.hero-h1 .l1', { xPercent: -4, scrollTrigger: sc(hero, 'top top') });
    gsap.to('.hero-h1 .l2', { xPercent: 7, scrollTrigger: sc(hero, 'top top') });
    gsap.to('.hero-h1 .l3', { xPercent: -6, scrollTrigger: sc(hero, 'top top') });
    gsap.to('.hero-h1 .l4', { xPercent: -5, scrollTrigger: sc(hero, 'top top') });
    gsap.fromTo('.est-h .ln:nth-child(1)', { xPercent: -5 }, { xPercent: 4, scrollTrigger: sc('#est') });
    gsap.fromTo('.est-h .ln:nth-child(2)', { xPercent: 6 }, { xPercent: -3, scrollTrigger: sc('#est') });
    gsap.fromTo('.est-h .ln:nth-child(3)', { xPercent: -3 }, { xPercent: 5, scrollTrigger: sc('#est') });
    gsap.fromTo('.est-h .ln:nth-child(4)', { xPercent: 7 }, { xPercent: -4, scrollTrigger: sc('#est') });
    gsap.fromTo('.build-h .ln:nth-child(2)', { xPercent: 4 }, { xPercent: -3, scrollTrigger: sc('#build') });
    gsap.fromTo('.cta-h .ln:nth-child(2)', { xPercent: 4 }, { xPercent: -4, scrollTrigger: sc('#cta') });
    gsap.fromTo('#arm', { rotation: 0, svgOrigin: '300 300' }, { rotation: 360, svgOrigin: '300 300', ease: 'none', scrollTrigger: sc('#support') });
    $$('.own-row').forEach((r) => gsap.fromTo(r, { x: 0 }, { x: () => -24, ease: 'none', scrollTrigger: sc(r) }));
  }
}

/* marquee driven by time plus scroll velocity */
const track = $('#marqueeTrack'); let mq = 0, lastY = scrollY, vel = 0;
function marquee(dt) {
  const y = scrollY; vel += ((y - lastY) - vel) * 0.1; lastY = y;
  const third = track.scrollWidth / 3; if (!third) return;
  mq -= (reduce ? 0 : 0.6 + Math.abs(vel) * 0.35) * (dt * 60);
  if (mq <= -third) mq += third;
  track.style.transform = `translate3d(${mq}px,0,0)`;
}

/* ---------- WebGL scenes ---------- */
const tasks = [];
const hero = initHero($('#hero'), $('#heroGL'));
if (hero) tasks.push({ ...wrap(hero), scene: hero, hero: true });
const stack = initStack($('#core'), $('#stackGL'));
if (stack) tasks.push({ scene: stack, el: $('.core-sticky') });
const silk = initSilk($('#estGL'));
if (silk) tasks.push({ scene: silk, el: $('#est') });
$$('.layer-art canvas').forEach((c) => { const s = initLayer(c, +c.dataset.mode); if (s) tasks.push({ scene: s, el: c, layer: true }); });
function wrap(h) { return { el: h.el }; }
if (!tasks.length) document.documentElement.classList.add('nogl');
tasks.forEach((t) => {
  t.vis = t.hero === true;
  new IntersectionObserver((es) => { t.vis = es[0].isIntersecting; }, { rootMargin: '120px' }).observe(t.el);
});

/* core accordion: click, or the row nearest the viewport centre while scrolling */
{
  const rows = $$('.core-row'); let cur = 0;
  const set = (i, user) => {
    if (i === cur && !user) return; cur = i;
    rows.forEach((r, k) => { r.classList.toggle('active', k === i); r.querySelector('button').setAttribute('aria-expanded', String(k === i)); });
    if (stack) stack.setActive(i === undefined ? 0 : [1, 3, 2, 0, 4][i]);
  };
  // stack order bottom to top: Wallet, Prime, Stablecoins, Ecosystem, Crypto-as-a-Service
  rows.forEach((r, i) => r.querySelector('button').addEventListener('click', () => set(i, true)));
  const mid = () => {
    const c = innerHeight * 0.5; let best = 0, bd = 1e9;
    rows.forEach((r, i) => { const b = r.getBoundingClientRect(); const d = Math.abs((b.top + 90) - c * 0.9); if (d < bd) { bd = d; best = i; } });
    const sec = $('#core').getBoundingClientRect();
    if (sec.top < innerHeight * 0.6 && sec.bottom > innerHeight * 0.3) set(best);
  };
  window.addEventListener('scroll', mid, { passive: true });
  set(0, true);
}

/* ---------- master loop ---------- */
let t0 = performance.now(), last = t0, slow = 0, fc = 0;
const rotEl = $('#rot');
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const t = (now - t0) / 1000, y = scrollY;
  navTheme(); marquee(dt);
  if (stack) {
    const r = $('#core').getBoundingClientRect();
    const prog = Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height * 0.8)));
    stack.state.explode = reduce ? 1 : prog;
  }
  // quality governor: when frames get slow, render fewer canvases per frame (staggered)
  slow += ((dt) - slow) * 0.1;
  rotEl.classList.toggle('notrans', slow > 0.06);
  const skip = slow > 0.09 ? 5 : slow > 0.05 ? 3 : slow > 0.03 ? 2 : 1;
  fc++;
  let ti = 0;
  for (const k of tasks) {
    if (!k.vis) continue;
    ti++;
    if (skip > 1 && ((fc + ti) % skip) !== 0) continue;
    let sp = 0;
    if (k.layer || k.scene === silk) { const r = k.el.getBoundingClientRect(); sp = (innerHeight - r.top) / (innerHeight + r.height); }
    k.scene.draw(t, y, reduce, sp, dt);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
