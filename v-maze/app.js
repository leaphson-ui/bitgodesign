import { Terrain, register, still } from './terrain.js';
import { SvcMorph } from './morph.js';

const B = window.BITGO;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const ARROW_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M8 6h10v10"/></svg>';
const LOGO = '../shared/assets/bitgo-logo.svg';
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mobile = () => innerWidth < 760;

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

/* ============ page markup ============ */
const hatch = (cls = '') => `<div class="hatch ${cls}" aria-hidden="true"></div>`;
const H = B.hero;
const main = $('#main');
main.innerHTML = `
<section class="hero" id="hero">
  <div class="hero-stage"><canvas id="c-hero"></canvas><div class="tags" id="tags"></div></div>
  <div class="hero-bottom"></div>
  <div class="wrap hero-copy">
    <h1><span class="rot" id="rot" aria-live="off">${H.words.map((w) => `<span>${esc(w)}</span>`).join('')}</span>${esc(H.rest)}</h1>
    <p class="sub">${esc(H.sub)}</p>
    <div class="cta"><a class="btn btn-blue" href="#connect">${esc(H.cta)} ${ARROW}</a></div>
  </div>
</section>
${hatch('thick')}
<section class="trust"><div class="wrap">
  <h2 data-fade>${esc(B.trust.title)}</h2></div>
  <div class="marq" id="marq">
    <div class="marq-row" data-dir="-1">${[...B.trust.logos.slice(0, 7), ...B.trust.logos.slice(0, 7)].map((l) => `<div class="lg"><img src="${l}" alt=""></div>`).join('')}</div>
    <div class="marq-row" data-dir="1">${[...B.trust.logos.slice(7), ...B.trust.logos.slice(7)].map((l) => `<div class="lg"><img src="${l}" alt=""></div>`).join('')}</div>
  </div>
</section>
<section class="badges"><div class="wrap">${B.badges.map((b) => `<p data-fade>${esc(b.label)}</p>`).join('')}</div></section>
${hatch('thick')}

<section class="statement" id="statement">
  <div class="st-stick">
    <div class="st-bg"></div>
    <div class="st-wave"><canvas id="c-wave"></canvas></div>
    <div class="wrap st-text">
      <span class="ln l1">${esc(B.core.title[0])}</span>
      <span class="ln l2">${esc(B.core.title[1])}</span>
      <span class="ln l3" id="l3">${B.core.items.map((i) => i.title).join(", ")}.</span>
    </div>
  </div>
</section>
${hatch('thick')}
<section class="core" id="core"><div class="wrap core-grid">
  <div class="core-vis" aria-hidden="true"><canvas id="c-svc"></canvas></div>
  <div class="svc-list">${B.core.items.map((s) => `
    <article class="svc">
      <h3>${esc(s.title)}</h3>
      <p class="sh">${esc(s.short)}</p>
      <p class="lo">${esc(s.long)}</p>
      <a class="more" href="${s.cta.href}">${esc(s.cta.label)} ${ARROW}</a>
    </article>`).join('')}</div>
</div></section>
${hatch()}
<section class="est"><div class="wrap est-grid">
  <div><h2 data-fade>${esc(B.established.title)}</h2><p>${esc(B.established.text)}</p>
    <a class="btn btn-blue" href="${B.established.cta.href}">${esc(B.established.cta.label)} ${ARROW}</a></div>
  <div class="tiles">${B.established.logos.map((l) => `
    <${l.href ? `a href="${l.href}"` : 'div'} class="tile ${l.text ? 'has' : ''}" data-fade><img src="${l.image}" alt="${esc(l.name)}">${l.text ? `<span class="tx">${esc(l.text)}</span>` : ''}</${l.href ? 'a' : 'div'}>`).join('')}
  </div>
</div></section>
${hatch('light')}
<section class="build"><div class="wrap">
  <h2 data-fade>${esc(B.build.title)}</h2>
  <div class="ui-shell"><div class="ui" id="ui">
    <aside class="ui-side"><img src="${LOGO}" alt=""><span class="it act">${esc(B.build.cards[0].label)}</span><span class="it">Cash</span><span class="it">Crypto</span></aside>
    <div class="ui-main">
      <div class="ui-top"><b>${esc(B.build.cards[0].label)}</b></div>
      <div class="card"><h5>Go Account</h5>
        <svg class="spark" viewBox="0 0 600 220" preserveAspectRatio="none"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C74FF" stop-opacity=".55"/><stop offset="1" stop-color="#4C74FF" stop-opacity="0"/></linearGradient></defs>
        <path class="f" d="M0 180 C60 170 90 120 150 130 S250 190 310 120 S420 40 470 70 S560 30 600 20 L600 220 L0 220Z"/>
        <path class="s" d="M0 180 C60 170 90 120 150 130 S250 190 310 120 S420 40 470 70 S560 30 600 20"/></svg></div>
      <div class="card"><h5>Cash and crypto in one place</h5><div class="rows">
        ${[['Hold', 82], ['Send', 58], ['Trade', 70], ['Finance', 34]].map(([n, w]) => `<div class="arow"><i></i><span>${n}</span><div class="bar"><u data-w="${w}"></u></div></div>`).join('')}
      </div></div>
    </div></div>
    <div class="feat">${B.build.cards.map((c) => `
      <article data-fade><h3>${esc(c.label)}</h3><p>${esc(c.text)}</p>
        <a class="more" href="${c.cta.href}">${esc(c.cta.label)} ${ARROW}</a></article>`).join('')}</div>
  </div>
</div></section>
${hatch('thick')}
<section class="support"><div class="wrap sp-grid">
  <div><h2 data-fade>${esc(B.support.title)}</h2>
    <ul class="sp-list">${B.support.items.map((i) => `<li data-fade>${esc(i)}</li>`).join('')}</ul></div>
  <div class="dial" id="dial"><svg viewBox="-300 -300 600 600" id="dialsvg"></svg><div class="mid"><b>24/7</b><span>${esc(B.support.label.replace('24/7 ', ''))}</span></div></div>
</div></section>

<section class="own" id="own"><div class="own-pin" id="ownpin"><div class="own-t"><canvas id="c-own"></canvas></div><div class="rail" id="rail">
  <div class="own-head"><h2>${esc(B.own.title)}</h2></div>
  ${B.own.items.map((it, i) => `<article class="pn" style="--bx:${[-30, 20, -10, 30, -40][i]}%;--by:${[-60, -30, -70, -50, -20][i]}%;--bc:${['rgba(22,71,219,.95)', 'rgba(60,110,255,.8)', 'rgba(22,71,219,.9)', 'rgba(90,130,255,.7)', 'rgba(22,71,219,.95)'][i]}"><div><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div></article>`).join('')}
</div></div></section>

<section class="spot"><div class="wrap">
  <h2 data-fade>${esc(B.spotlight.label)}</h2>
  <div class="vids">${B.spotlight.slides.map((s, i) => `
    <a class="vid" href="${s.video}" target="_blank" rel="noopener" data-fade><div class="th"><img class="ps" alt=""><i style="--g:${[
      'radial-gradient(60% 60% at 25% 20%,#5C85FF,transparent 60%),radial-gradient(70% 70% at 90% 100%,#0A2486,transparent 70%),#1647DB',
      'radial-gradient(60% 60% at 80% 10%,#8FA9FF,transparent 60%),radial-gradient(70% 70% at 10% 100%,#0B2C9A,transparent 70%),#0E2F9E',
      'radial-gradient(60% 60% at 40% 90%,#3C66F5,transparent 60%),radial-gradient(70% 70% at 90% 0%,#0A1E70,transparent 70%),#0B1B55'][i]}"></i><span class="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg></span></div>
      <h3>${esc(s.title)}</h3></a>`).join('')}</div>
</div></section>

<section class="latest"><div class="wrap">
  <div class="lt-head"><h2 data-fade>${esc(B.latest.title)}</h2><a class="btn btn-ghost" href="${B.latest.all.href}">${esc(B.latest.all.label)} ${ARROW}</a></div>
  <div class="posts">${B.latest.posts.map((p) => `<a class="post" href="${p.href}" data-fade><span>${esc(p.title)}</span>${ARROW_UP}</a>`).join('')}</div>
</div></section>

<section class="cta-sec" id="connect">
  <div class="st-bg"></div><div class="cta-t"><canvas id="c-cta"></canvas></div>
  <div class="wrap cta-in"><h2>${B.cta.title.map(esc).join('<br>')}</h2><a class="btn btn-white" href="#connect">${esc(B.cta.button)} ${ARROW}</a></div>
</section>`;

function FEAT_ART(i) {
  const ang = [135, 45, 90][i], c = ['#1647DB', '#3C66F5', '#8FA9FF'][i];
  return `<div class="hx" style="--a:${ang}deg;--c:${c}"></div>`;
}

/* ============ GSAP setup ============ */
const gsap = window.gsap, ST = window.ScrollTrigger;
if (gsap && ST) gsap.registerPlugin(ST);
const hasGsap = !!(gsap && ST);

/* scroll-driven dividers and marquee */
const hatches = $$('.hatch'), marq = $$('.marq-row');
function onScrollVisuals() {
  const y = scrollY;
  hatches.forEach((h, i) => h.style.setProperty('--hx', `${Math.round(y * (i % 2 ? -0.25 : 0.25))}px`));
  const m = $('#marq');
  if (m) {
    const r = m.getBoundingClientRect();
    const p = clamp(1 - (r.top + r.height / 2) / (innerHeight + r.height) , 0, 1.2);
    marq.forEach((row) => {
      const dir = +row.dataset.dir, half = row.scrollWidth / 2;
      const x = dir < 0 ? -p * half * 0.8 : -half * 0.8 + p * half * 0.8;
      row.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    });
  }
}
if (!reduced) { addEventListener('scroll', onScrollVisuals, { passive: true }); }
onScrollVisuals();

/* fade-ins */
if (hasGsap && !reduced) {
  $$('[data-fade]').forEach((el) => {
    gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
}

/* ============ hero terrain + tags ============ */
const heroCanvas = $('#c-hero');
const heroHost = heroCanvas.parentElement;
const tagDefs = [
  { t: 'Qualified custody', x: -2, z: -5.5, dx: -30, dy: 130 },
  { t: 'Prime trading', x: 5, z: -13, dx: 40, dy: -120 },
  { t: 'Settlement', x: 0.5, z: -21, dx: -30, dy: -90 },
  { t: 'Staking', x: 8, z: -6, dx: -30, dy: 110 },
  { t: 'Stablecoin issuance', x: 9, z: -17, dx: -30, dy: -130 },
  { t: 'Lightning payments', x: 1.5, z: -10, dx: -40, dy: -100 },
  { t: 'Developer platform', x: 3, z: -2, dx: 60, dy: 90 }
];
let heroT = null;
const pins = [];
function buildTags() {
  const holder = $('#tags');
  tagDefs.forEach((d, i) => {
    const el = document.createElement('div');
    el.className = 'pin';
    el.innerHTML = `<div class="ln"></div><div class="dot"></div><div class="lb">${esc(d.t)}</div>`;
    holder.appendChild(el);
    pins.push({ el, d, ln: el.firstChild, lb: el.lastChild });
  });
}
buildTags();
function placeTags() {
  if (!heroT || !heroT.ok) return;
  const W = heroT.W, Hh = heroT.H, m = W < 760;
  const sc = clamp(W / 1600, 0.55, 1.35);
  pins.forEach((p, i) => {
    const hide = m && i > 2;
    p.el.style.display = hide ? 'none' : '';
    const q = heroT.project(p.d.x, p.d.z);
    const vis = !q.behind && q.x > 10 && q.x < W - 10 && q.y > (m ? 460 : 70) && q.y < Hh - 10;
    p.el.style.opacity = vis ? clamp((heroT.intro - 0.55 - i * 0.04) * 4) : 0;
    p.el.style.transform = `translate3d(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px,0)`;
    let dx = p.d.dx * sc, dy = p.d.dy * sc;
    if (m) { dx *= 0.6; dy *= 0.6; }
    const lw = p.lb.offsetWidth, lh = p.lb.offsetHeight;
    let lx = dx + (dx < 0 ? -lw : 0);
    const ly = dy - lh / 2;
    lx = clamp(q.x + lx, 8, W - lw - 8) - q.x;
    const ex = clamp(0, lx, lx + lw), ey = clamp(0, ly, ly + lh);
    const len = Math.hypot(ex, ey), ang = Math.atan2(ey, ex);
    p.ln.style.width = len + 'px';
    p.ln.style.transform = `rotate(${ang}rad)`;
    p.lb.style.transform = `translate(${lx}px,${ly}px)`;
  });
}
try {
  heroT = new Terrain(heroCanvas, {
    cols: mobile() ? 400 : 780, rows: mobile() ? 230 : 380, w: 44, z0: 8, z1: -28, amp: 3.8, freq: 0.1, ridge: 0.7, rise: 2.6, seed: 11,
    lo: '#0A2BA8', hi: '#C9D7FF', accent: '#FFFFFF', fov: 24, cam: [0, 15, 31], look: [0, 3.2, -6],
    camEnd: [0, 22, 25], lookEnd: [0, 2, -8], fog: [26, 62], alpha: 0.34, contour: 0.3, pointScale: 1.5,
    maskX: [0.1, 0.5, 1.1, 1.2], maskY: [0.05, 0.2, 1.2, 1.3], shift: [0.17, 0.0], shiftMobile: [0, 0.2], introSec: 2.6
  });
  if (heroT.ok) {
    heroT.onFrame = () => {
      const r = $('#hero').getBoundingClientRect();
      heroT.progress = clamp(-r.top / r.height);
      placeTags();
    };
    register(heroT, reduced);
    if (reduced) { placeTags(); addEventListener('scroll', () => { const r = $('#hero').getBoundingClientRect(); heroT.progress = clamp(-r.top / r.height); heroT.renderOnce(); placeTags(); }, { passive: true }); }
    // pulses from the pins, one at a time
    let pi = 0;
    setInterval(() => { if (!heroT.visible) return; const d = tagDefs[pi++ % tagDefs.length]; heroT.firePulse(d.x, d.z); }, 1500);
    pins.forEach((p) => { p.el.style.pointerEvents = 'none'; });
  }
} catch (e) { console.warn(e); }
if (!heroT || !heroT.ok) $('.tags').style.display = 'none';

/* rotating word */
(function () {
  const words = $$('#rot span');
  if (reduced || !hasGsap || words.length < 2) return;
  let i = 0;
  gsap.set(words.slice(1), { yPercent: 105, opacity: 1 });
  setInterval(() => {
    const cur = words[i], nxt = words[(i + 1) % words.length];
    gsap.set(nxt, { yPercent: 70, opacity: 0 });
    gsap.to(cur, { yPercent: -70, opacity: 0, duration: 0.7, ease: 'power3.inOut' });
    gsap.to(nxt, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.inOut' });
    i = (i + 1) % words.length;
  }, 2600);
})();

/* ============ statement (sticky scrub) ============ */
let waveT = null;
(function () {
  const sec = $('#statement');
  const l1 = $('.l1', sec), l2 = $('.l2', sec), l3 = $('#l3');
  // split l3 into words
  const words = l3.textContent.split(' ');
  l3.innerHTML = words.map((w) => `<span class="w">${esc(w)} </span>`).join('');
  const ws = $$('.w', l3);
  const cv = $('#c-wave');
  try {
    waveT = new Terrain(cv, {
      cols: mobile() ? 480 : 900, rows: mobile() ? 120 : 170, w: 66, z0: 8, z1: -22, amp: 1.7, freq: 0.1, ridge: 0.25, rise: 0.3, seed: 29,
      lo: '#7C9CFF', hi: '#FFFFFF', accent: '#FFFFFF', fov: 24, cam: [0, 8, 30], look: [0, 5.5, -6],
      fog: [22, 60], alpha: 0.4, contour: 0.25, pointScale: 1.4, maskY: [0.56, 0.74, 1.2, 1.3], hover: true, introSec: 2
    });
    if (waveT.ok) {
      waveT.o.introOverride = 0;
      register(waveT, reduced);
      waveT.onFrame = () => {};
    }
  } catch (e) { console.warn(e); }
  const set = (p) => {
    const a = clamp(p / 0.15 + 0.4), b = clamp((p - 0.08) / 0.2), c = clamp((p - 0.45) / 0.45);
    const e = (t) => 1 - Math.pow(1 - t, 3);
    l1.style.opacity = e(a); l1.style.transform = `translateY(${(1 - e(a)) * 40}px)`;
    l2.style.opacity = e(b); l2.style.transform = `translateY(${(1 - e(b)) * 40}px)`;
    const n = ws.length;
    ws.forEach((w, i) => { const t = clamp(c * (n + 3) - i); w.style.opacity = (0.2 + 0.8 * t).toFixed(3); });
    if (waveT && waveT.ok) {
      waveT.o.introOverride = clamp(p / 0.35);
      waveT.progress = clamp((p - 0.1) / 0.9);
      waveT.mat.uniforms.uAlpha.value = waveT.o.alpha * (1 - 0.8 * clamp((p - 0.88) / 0.12));
      if (reduced || !waveT.visible) waveT.renderOnce();
    }
  };
  const upd = () => { const r = sec.getBoundingClientRect(); set(clamp(-r.top / (r.height - innerHeight))); };
  if (!reduced) { addEventListener('scroll', upd, { passive: true }); upd(); } else { set(1); }
})();

/* ============ services visual: one particle body morphing between five forms ============ */
(function () {
  const cv = $('#c-svc'), items = $$('.svc');
  const morph = new SvcMorph(cv);
  let active = -1;
  const setActive = () => {
    const mid = innerHeight * 0.5;
    let best = 0, bd = 1e9;
    items.forEach((el, i) => { const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
    items.forEach((el, i) => el.classList.toggle('on', i === best));
    if (best !== active) { active = best; morph.go(best); if (reduced) morph.draw(0); }
  };
  addEventListener('scroll', setActive, { passive: true }); setActive();
  addEventListener('resize', () => morph.resize());
  if (reduced) { morph.m = 1; morph.draw(0); return; }
  let last = performance.now();
  const loop = (ts) => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    if (morph.ok && morph.visible) morph.draw(dt);
  };
  requestAnimationFrame(loop);
})();

/* ============ build UI card ============ */
(function () {
  const ui = $('#ui');
  const go = () => {
    const s = $('.spark .s', ui);
    if (s) { s.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(.2,.8,.2,1)'; s.style.strokeDashoffset = 0; }
    $$('.arow .bar u', ui).forEach((u, i) => { u.style.transition = `width 1.6s ${i * 0.15}s cubic-bezier(.2,.8,.2,1)`; u.style.width = u.dataset.w + '%'; });
  };
  new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { go(); o.disconnect(); } }, { threshold: 0.35 }).observe(ui);
  if (hasGsap && !reduced) {
    gsap.fromTo(ui, { y: 80, rotateX: 8, transformPerspective: 1600 }, { y: -20, rotateX: 0, ease: 'none', scrollTrigger: { trigger: ui, start: 'top bottom', end: 'center center', scrub: true } });
  }
})();

/* ============ 24/7 dial ============ */
(function () {
  const svg = $('#dialsvg'), N = 96, ticks = [];
  let html = '<circle r="292" fill="none" stroke="rgba(255,255,255,.1)"/><circle r="214" fill="none" stroke="rgba(255,255,255,.08)"/>';
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2, big = i % 4 === 0, r1 = 292, r0 = big ? 244 : 262;
    html += `<line data-i="${i}" x1="${Math.cos(a) * r0}" y1="${Math.sin(a) * r0}" x2="${Math.cos(a) * r1}" y2="${Math.sin(a) * r1}" stroke="#fff" stroke-width="${big ? 3 : 2}" stroke-linecap="round" opacity=".18"/>`;
  }
  html += '<g id="hand"><line x1="0" y1="-214" x2="0" y2="-292" stroke="#7C9CFF" stroke-width="2"/><circle cx="0" cy="-292" r="10" fill="#1647DB" stroke="#fff" stroke-width="2"/></g>';
  svg.innerHTML = html;
  $$('line[data-i]', svg).forEach((l) => ticks.push(l));
  const hand = $('#hand', svg), dial = $('#dial');
  let vis = false;
  new IntersectionObserver((e) => { vis = e[0].isIntersecting; }, { rootMargin: '50px' }).observe(dial);
  const upd = () => {
    const r = dial.getBoundingClientRect();
    const p = clamp(1 - (r.top + r.height / 2 - innerHeight * 0.15) / (innerHeight * 1.1), 0, 1);
    const ang = p * 360 * 1.0 + 8;
    hand.setAttribute('transform', `rotate(${ang})`);
    const cur = ((ang % 360) / 360) * N;
    ticks.forEach((l, i) => { let d = cur - i; if (d < 0) d += N; const o = d < 40 ? 0.95 - d * 0.02 : 0.16; l.setAttribute('opacity', o.toFixed(2)); l.setAttribute('stroke', d < 3 ? '#9DB3FF' : '#fff'); });
  };
  addEventListener('scroll', () => { if (vis) upd(); }, { passive: true }); upd();
})();

/* ============ own rail ============ */
let ownT = null;
(function () {
  const sec = $('#own'), rail = $('#rail'), pin = $('#ownpin');
  try {
    ownT = new Terrain($('#c-own'), {
      cols: mobile() ? 420 : 820, rows: mobile() ? 110 : 150, w: 70, z0: 8, z1: -24, amp: 3.0, freq: 0.09, ridge: 0.5, rise: 1.2, seed: 77,
      lo: '#2F58E6', hi: '#A9BDFF', accent: '#FFFFFF', fov: 24, cam: [-14, 9, 30], look: [-14, 1.5, -6], camEnd: [14, 9, 30], lookEnd: [14, 1.5, -6],
      fog: [22, 60], alpha: 0.55, contour: 0.3, pointScale: 1.4, maskY: [0.0, 0.3, 1.2, 1.3], hover: false, introSec: 2
    });
    if (ownT.ok) register(ownT, reduced);
  } catch (e) { console.warn(e); }
  if (reduced || !hasGsap) { sec.classList.add('static'); return; }
  const mm = gsap.matchMedia();
  const dist = () => Math.max(0, rail.scrollWidth - innerWidth + 40);
  gsap.to(rail, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: pin, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: (s) => { pin.style.setProperty('--ox', (20 + s.progress * 70) + '%'); if (ownT && ownT.ok) ownT.progress = s.progress; } }
  });
})();

/* ============ cta terrain ============ */
let ctaT = null;
(function () {
  const cv = $('#c-cta');
  try {
    ctaT = new Terrain(cv, {
      cols: mobile() ? 340 : 560, rows: mobile() ? 170 : 260, w: 52, z0: 8, z1: -26, amp: 2.6, freq: 0.1, ridge: 0.5, rise: 2.0, seed: 53,
      lo: '#8FA9FF', hi: '#FFFFFF', accent: '#FFFFFF', fov: 24, cam: [0, 13, 32], look: [0, 0, -6], camEnd: [0, 16, 30], lookEnd: [0, 0, -6],
      fog: [24, 62], alpha: 0.4, contour: 0.3, pointScale: 1.45, maskX: [0, 0.0, 1, 1], maskY: [0.0, 0.3, 1.1, 1.2], introSec: 2.4
    });
    if (ctaT.ok) {
      ctaT.onFrame = () => { const r = $('#connect').getBoundingClientRect(); ctaT.progress = clamp(1 - r.bottom / (innerHeight + r.height)); };
      register(ctaT, reduced);
    }
  } catch (e) { console.warn(e); }
})();

/* ============ spotlight posters: three generated terrain stills ============ */
(function () {
  const sec = $('.spot'), imgs = $$('.ps', sec);
  const common = { cols: mobile() ? 360 : 560, rows: mobile() ? 190 : 300, w: 44, z0: 8, z1: -28, lo: '#9DB3FF', hi: '#FFFFFF', accent: '#FFFFFF', fov: 24, fog: [24, 64], alpha: 0.5, contour: 0.3, pointScale: 1.5, maskX: [0, 0, 1, 1], maskY: [0, 0.12, 1.1, 1.2] };
  const cfg = [
    { amp: 3.8, freq: 0.1, ridge: 0.85, rise: 2.4, seed: 5, cam: [-9, 12, 30], look: [0, 3, -6] },
    { amp: 3.4, freq: 0.12, ridge: 0.35, rise: 1.2, seed: 19, cam: [0, 22, 24], look: [0, 1, -8], fog: [20, 70] },
    { amp: 3.2, freq: 0.08, ridge: 0.6, rise: 3.4, seed: 41, cam: [11, 5.5, 30], look: [0, 3, -8] }
  ];
  let done = false;
  const make = () => {
    if (done) return; done = true;
    cfg.forEach((c, i) => { try { const u = still(Object.assign({}, common, c), 900, 560); if (u) imgs[i].src = u; } catch (e) { console.warn(e); } });
  };
  new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { make(); o.disconnect(); } }, { rootMargin: '600px' }).observe(sec);
})();

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

/* ============ resize ============ */
let rz;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => { [heroT, waveT, ctaT, ownT].forEach((t) => t && t.ok && t.resize()); placeTags(); if (hasGsap) ST.refresh(); }, 150);
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { placeTags(); hasGsap && ST.refresh(); });
