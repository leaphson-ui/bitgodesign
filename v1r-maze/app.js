import { ParticleTerrain, fbm, vnoise } from './terrain.js';

const B = window.BITGO;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const ARR = '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 9L9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
const btn = (label, href = '#cta', cls = '') => `<a class="btn ${cls}" href="${href}"><span>${esc(label)}</span><i>${ARR}</i><b></b><b></b><b></b><b></b></a>`;

/* ---------- markup ---------- */
const menus = B.menus.map((m, i) => `
  <li class="nav__item"><button class="nav__top" aria-expanded="false" aria-controls="m${i}">${esc(m.label)}<svg viewBox="0 0 10 6" width="10" height="6"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>
  <div class="mega" id="m${i}"><div class="mega__in">${m.groups.map(g => `
    <div class="mega__g ${g.items.length > 14 ? 'mega__g--wide' : ''}"><h3>${esc(g.title)}</h3><ul>${g.items.map(x => `<li><a href="${x.href}">${esc(x.label)}</a></li>`).join('')}</ul></div>`).join('')}</div></div></li>`).join('');

const heroTags = [
  ['Qualified custody', 2, -5, 34], ['Prime and OTC trading', 4, -3, 62], ['Go Network settlement', 4, -9, 62],
  ['Staking', 6, -5, 34], ['Stablecoin issuance', 6, -9, 34], ['REST API and SDK', 8, -11, 34],
];

const core = B.core;
const svc = core.items.map((s, i) => `
  <li class="svc__row ${i === 0 ? 'is-open' : ''}">
    <button class="svc__head" aria-expanded="${i === 0}" aria-controls="sv${i}"><span class="svc__t">${esc(s.title)}</span><span class="svc__s">${esc(s.short)}</span><span class="svc__x" aria-hidden="true"></span></button>
    <div class="svc__body" id="sv${i}"><div><p>${esc(s.long)}</p><a class="link" href="${s.cta.href}">${esc(s.cta.label)} ${ARR}</a></div></div>
  </li>`).join('');

const est = B.established;
const estTiles = est.logos.map(l => `
  <li class="tile ${l.text ? 'tile--t' : ''}" ${l.text ? 'tabindex="0"' : ''}><img src="${l.image}" alt="${esc(l.name)}" loading="lazy">${l.text ? `<p>${esc(l.text)}</p>` : ''}</li>`).join('');

const buildArt = [
  `<svg viewBox="0 0 240 180" class="art art--acct" aria-hidden="true"><g class="a-l a-l1"><rect x="30" y="92" width="180" height="46" rx="10"/><rect x="46" y="108" width="54" height="6" rx="3" class="f"/></g><g class="a-l a-l2"><rect x="30" y="62" width="180" height="46" rx="10"/><circle cx="62" cy="85" r="9" class="f"/><rect x="82" y="80" width="70" height="6" rx="3" class="f"/></g><g class="a-l a-l3"><rect x="30" y="32" width="180" height="46" rx="10"/><rect x="46" y="52" width="84" height="6" rx="3" class="f"/></g></svg>`,
  `<svg viewBox="0 0 240 180" class="art art--stake" aria-hidden="true"><g class="rings"><circle cx="120" cy="100" r="22"/><circle cx="120" cy="100" r="44"/><circle cx="120" cy="100" r="66"/><circle cx="120" cy="100" r="88"/></g><path class="grow" d="M30 150 C70 148 80 110 120 104 S190 60 214 34" fill="none"/><circle class="dot" cx="214" cy="34" r="5"/></svg>`,
  `<svg viewBox="0 0 240 180" class="art art--net" aria-hidden="true"><g class="edges"><path d="M40 50L120 90L200 40"/><path d="M40 140L120 90L200 130"/><path d="M40 50L40 140"/><path d="M200 40L200 130"/><path d="M40 50L200 130"/><path d="M40 140L200 40"/></g><g class="nodes"><circle cx="40" cy="50" r="7"/><circle cx="200" cy="40" r="7"/><circle cx="40" cy="140" r="7"/><circle cx="200" cy="130" r="7"/><circle cx="120" cy="90" r="11" class="hub"/></g><circle r="3.5" class="pkt"><animateMotion dur="3.2s" repeatCount="indefinite" path="M40 50L120 90L200 130"/></circle><circle r="3.5" class="pkt"><animateMotion dur="4.1s" repeatCount="indefinite" path="M200 40L120 90L40 140"/></circle></svg>`,
];
const bcards = B.build.cards.map((c, i) => `
  <article class="bcard">${buildArt[i]}<h3>${esc(c.label)}</h3><p>${esc(c.text)}</p><a class="link" href="${c.cta.href}">${esc(c.cta.label)} ${ARR}</a></article>`).join('');

const sp = B.spotlight.slides.map((s, i) => `
  <a class="vid vid--${i}" href="${s.video}" target="_blank" rel="noopener"><span class="vid__bg"></span><span class="vid__play"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg></span><span class="vid__t">${esc(s.title)}</span></a>`).join('');

const ticks = Array.from({ length: 48 }, (_, i) => { const a = i / 48 * Math.PI * 2, big = i % 2 === 0, r1 = 150, r2 = big ? 128 : 138; return `<line x1="${(180 + Math.sin(a) * r1).toFixed(1)}" y1="${(180 - Math.cos(a) * r1).toFixed(1)}" x2="${(180 + Math.sin(a) * r2).toFixed(1)}" y2="${(180 - Math.cos(a) * r2).toFixed(1)}"/>`; }).join('');

document.getElementById('app').innerHTML = `
<header class="nav" id="nav"><div class="wrap nav__in">
  <a class="nav__logo" href="#top" aria-label="BitGo"><img src="../shared/assets/bitgo-logo.svg" alt="BitGo" width="108" height="37"></a>
  <ul class="nav__menu">${menus}</ul>
  <div class="nav__act"><span class="nav__lang">${esc(B.navActions.language)}</span><a class="nav__log" href="${B.navActions.login.href}">${esc(B.navActions.login.label)}</a><a class="nav__sign" href="${B.navActions.signup.href}">${esc(B.navActions.signup.label)}</a>${btn(B.navActions.connect, '#cta', 'btn--s')}</div>
  <button class="nav__burger" aria-label="Menu" aria-expanded="false"><i></i><i></i></button>
</div>
<div class="drawer" id="drawer">${B.menus.map(m => `<details><summary>${esc(m.label)}</summary>${m.groups.map(g => `<h4>${esc(g.title)}</h4>${g.items.map(x => `<a href="${x.href}">${esc(x.label)}</a>`).join('')}`).join('')}</details>`).join('')}
  <div class="drawer__act"><a href="${B.navActions.login.href}">${esc(B.navActions.login.label)}</a><a href="${B.navActions.signup.href}">${esc(B.navActions.signup.label)}</a>${btn(B.navActions.connect)}</div></div>
</header>

<main id="main">
<section class="hero" id="top">
  <canvas class="hero__cv" id="heroCv" aria-hidden="true"></canvas>
  <div class="hero__tags" id="heroTags" aria-hidden="true">${heroTags.map(t => `<div class="tag" style="--h:${t[3]}px"><span class="tag__dot"></span><span class="tag__ln"></span><span class="tag__lb">${esc(t[0])}</span></div>`).join('')}</div>
  <div class="wrap hero__in">
    <h1 class="hero__h"><span class="rot" aria-label="${B.hero.words.join(', ')}">${B.hero.words.map((w, i) => `<span class="rot__w ${i === 0 ? 'on' : ''}">${esc(w)}</span>`).join('')}</span><span class="hero__rest">${esc(B.hero.rest)}</span></h1>
    <p class="hero__sub">${esc(B.hero.sub)}</p>
    ${btn(B.hero.cta)}
  </div>
</section>

<section class="trust"><div class="wrap">
  <h2 class="trust__h">${esc(B.trust.title)}</h2>
  <ul class="trust__logos">${B.trust.logos.map(l => `<li><img src="${l}" alt="" loading="lazy"></li>`).join('')}</ul>
</div></section>

<section class="badges hatch hatch--blue" aria-label="Credentials"><div class="wrap badges__in">${B.badges.map(b => `<span class="badge">${esc(b.label)}</span>`).join('')}</div></section>

<section class="core" id="core">
  <div class="core__stage" id="coreStage">
    <canvas class="core__cv" id="coreCv" aria-hidden="true"></canvas>
    <div class="wrap core__in">
      <h2 class="stmt"><span class="stmt__l stmt__l1"><span>${esc(core.title[0])}</span></span><span class="stmt__l stmt__l2" id="stmt2">${core.title[1].split(' ').map(w => `<span class="w">${esc(w)}</span>`).join(' ')}</span></h2>
    </div>
  </div>
  <div class="wrap svc"><ul class="svc__list">${svc}</ul></div>
</section>

<section class="est"><div class="hatch hatch--navy"></div><div class="wrap">
  <div class="est__top"><h2>${esc(est.title)}</h2><div><p>${esc(est.text)}</p>${btn(est.cta.label, est.cta.href)}</div></div>
  <ul class="est__grid">${estTiles}</ul>
</div></section>

<section class="build"><div class="wrap">
  <h2>${esc(B.build.title)}</h2>
  <div class="bpanel"><b class="c c1"></b><b class="c c2"></b><b class="c c3"></b><b class="c c4"></b>${bcards}</div>
</div></section>

<section class="sup" id="sup"><div class="wrap sup__in">
  <div class="clock"><svg viewBox="0 0 360 360" aria-hidden="true"><circle cx="180" cy="180" r="170" class="ring"/><g class="ticks">${ticks}</g><g class="hand" id="hand"><line x1="180" y1="110" x2="180" y2="40"/><circle cx="180" cy="40" r="6"/></g><circle cx="180" cy="180" r="5" class="hub"/></svg><span class="clock__t">${esc(B.support.label)}</span></div>
  <div class="sup__txt"><h2>${esc(B.support.title)}</h2><ul>${B.support.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
</div></section>

<section class="own" id="own"><div class="wrap own__in">
  <div class="own__l"><h2>${esc(B.own.title)}</h2></div>
  <ol class="own__list">${B.own.items.map(x => `<li><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></li>`).join('')}</ol>
</div></section>

<section class="spot"><div class="hatch hatch--navy"></div><div class="wrap">
  <h2>${esc(B.spotlight.label)}</h2><div class="spot__grid">${sp}</div>
</div></section>

<section class="latest"><div class="wrap">
  <div class="latest__top"><h2>${esc(B.latest.title)}</h2><a class="link" href="${B.latest.all.href}">${esc(B.latest.all.label)} ${ARR}</a></div>
  <ul class="posts">${B.latest.posts.map(p => `<li><a href="${p.href}"><span>${esc(p.title)}</span><i>${ARR}</i></a></li>`).join('')}</ul>
</div></section>

<section class="cta" id="cta">
  <canvas class="cta__cv" id="ctaCv" aria-hidden="true"></canvas>
  <div class="wrap cta__in"><h2>${B.cta.title.map(esc).join('<br>')}</h2>${btn(B.cta.button, B.BITGO + '/contact-us/', 'btn--w')}</div>
</section>
</main>

<footer class="foot"><div class="hatch hatch--navy"></div><div class="wrap">
  <div class="foot__top">
    <div><img src="../shared/assets/bitgo-logo.svg" alt="BitGo" width="120" height="41"><p class="foot__nl">${esc(B.footer.newsletter)}</p>
      <form class="foot__form" onsubmit="return false"><input type="email" placeholder="${esc(B.footer.email)}" aria-label="${esc(B.footer.email)}"><button>${esc(B.footer.subscribe)}</button></form></div>
    <ul class="foot__soc">${B.footer.socials.map(s => `<li><a href="${s.href}">${esc(s.label)}</a></li>`).join('')}</ul>
  </div>
  <div class="foot__legal">${B.footer.legal.map(p => `<p>${esc(p)}</p>`).join('')}
    <p>${esc(B.footer.review)} <a href="${B.footer.privacy.href}">${esc(B.footer.privacy.label)}</a> ${esc(B.footer.and)} <a href="${B.footer.disclaimers.href}">${esc(B.footer.disclaimers.label)}</a>.</p>
    <p>${esc(B.footer.screenReader)}</p><p>${esc(B.footer.complaints)}</p></div>
  <div class="foot__bar"><span>${esc(B.footer.nmls)}</span><span>${esc(B.footer.choices)}</span><span>${esc(B.footer.rights)}</span></div>
</div></footer>`;

document.querySelector('.skip').textContent = B.skip;

/* ---------- nav ---------- */
const nav = document.getElementById('nav');
document.querySelectorAll('.nav__top').forEach(b => {
  const li = b.parentElement;
  const open = v => { document.querySelectorAll('.nav__item').forEach(x => { x.classList.remove('open'); x.firstElementChild.setAttribute('aria-expanded', 'false'); }); if (v) { li.classList.add('open'); b.setAttribute('aria-expanded', 'true'); } };
  li.addEventListener('mouseenter', () => open(true));
  li.addEventListener('mouseleave', () => open(false));
  b.addEventListener('click', () => open(!li.classList.contains('open')));
});
const burger = document.querySelector('.nav__burger');
burger.addEventListener('click', () => { const o = nav.classList.toggle('drawer-open'); burger.setAttribute('aria-expanded', o); });
addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });

/* ---------- hero word rotation ---------- */
const words = [...document.querySelectorAll('.rot__w')];
let wi = 0;
if (!reduce) setInterval(() => { const p = words[wi]; p.classList.remove('on'); p.classList.add('out'); setTimeout(() => { p.style.transition = 'none'; p.classList.remove('out'); void p.offsetWidth; p.style.transition = ''; }, 800); wi = (wi + 1) % words.length; words[wi].classList.add('on'); }, 2800);

/* ---------- services accordion ---------- */
document.querySelectorAll('.svc__head').forEach(h => h.addEventListener('click', () => {
  const row = h.parentElement, was = row.classList.contains('is-open');
  document.querySelectorAll('.svc__row').forEach(r => { r.classList.remove('is-open'); r.firstElementChild.setAttribute('aria-expanded', 'false'); });
  if (!was) { row.classList.add('is-open'); h.setAttribute('aria-expanded', 'true'); }
  window.ScrollTrigger && ScrollTrigger.refresh();
}));

/* ---------- terrains ---------- */
const heroFn = (x, z) => {
  const wx = x + (vnoise(x * 0.16 + 3, z * 0.16) - 0.5) * 4.5, wz = z + (vnoise(x * 0.16, z * 0.16 + 9) - 0.5) * 4.5;
  const r = 1 - Math.abs(2 * fbm(wx * 0.24, wz * 0.24, 4) - 1);
  const base = Math.pow(r, 2.4) * 3.2;
  const detail = (fbm(x * 0.9, z * 0.9, 3) - 0.5) * 0.35;
  const bowl = -0.5 * Math.exp(-Math.pow((x + 0.8) / 3.2, 2)) * Math.exp(-Math.pow((z + 1.0) / 7, 2));
  return base + detail + bowl;
};
const coreFn = (x, z) => {
  const w = vnoise(x * 0.12, z * 0.12) * 5;
  return 0.55 * Math.sin(x * 0.42 + w + z * 0.25) + 0.3 * Math.sin(x * 0.9 - z * 0.5 + w * 1.4) * Math.exp(-Math.abs(z + 8) / 20) + (fbm(x * 0.5, z * 0.5, 3) - 0.5) * 0.35;
};
const ctaFn = (x, y) => {
  const f = Math.sin(x * 0.32 + Math.sin(y * 0.22) * 1.8) * 1.6 + Math.sin(x * 0.75 - y * 0.35) * 0.45;
  return f + (fbm(x * 0.4, y * 0.4, 3) - 0.5) * 0.9;
};

const mobile = innerWidth < 760;
const make = (id, o) => { const c = document.getElementById(id); try { const t = new ParticleTerrain(c, o); if (t.failed) { c.style.display = 'none'; return null; } return t; } catch (e) { console.warn(e); c.style.display = 'none'; return null; } };

const hero = make('heroCv', {
  nu: mobile ? 420 : 760, nv: mobile ? 260 : 440, u0: -12, u1: 12, v0: 1.0, v1: -20, vPow: 1.7, fn: heroFn, hMin: -0.4, hMax: 3.1, fov: 44,
  cam: [-1.0, 2.9, 3.6], target: [1.2, 0.2, -5.5], low: '#0a2380', mid: '#2a5cff', high: '#ffffff', light: [0.55, 0.7, 0.25], lightGain: 1.6,
  fog: [12, 26], size: 1.4, pulse: 1, pulseCol: '#5f8bff', static: reduce,
});
const coreT = make('coreCv', {
  nu: mobile ? 360 : 640, nv: mobile ? 150 : 240, u0: -20, u1: 20, v0: -0.6, v1: -22, vPow: 1.8, fn: coreFn, hMin: -0.9, hMax: 1.0, fov: 40,
  cam: [0, 1.8, 3.4], target: [0, -0.35, -3], low: '#0b2c9e', mid: '#6f96ff', high: '#ffffff', light: [0.3, 0.8, 0.5], lightGain: 1.2,
  fog: [9, 26], size: 1.3, static: reduce,
});
const ctaT = make('ctaCv', {
  nu: mobile ? 260 : 520, nv: mobile ? 160 : 320, u0: -16, u1: 16, v0: -9, v1: 9, mode: 'wall', fn: ctaFn, hMin: -2.2, hMax: 2.2, fov: 42,
  cam: [0, 0, 12], target: [0, 0, 0], low: '#0d34b4', mid: '#2a5af0', high: '#8fb0ff', light: [0.5, 0.5, 0.8], lightGain: 1.45,
  fog: [20, 40], size: 2.1, static: reduce,
});

/* hero tags */
const tagEls = [...document.querySelectorAll('.tag')];
let heroFade = 1;
const placeTags = () => {
  if (!hero) return;
  tagEls.forEach((el, i) => {
    const t = heroTags[i], p = hero.project(t[1], t[2]);
    const inside = p.ok && p.x > Math.max(30, hero.w * (hero.w < 700 ? 0.05 : 0.5)) && p.x < hero.w - 90 && p.y > (hero.w < 700 ? 70 : 130) && p.y < hero.h - 40;
    el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    el.style.opacity = inside ? heroFade : 0;
  });
};
window.__hero = hero;
if (hero) hero.onFrame = placeTags;
else document.getElementById('heroTags').style.display = 'none';

/* ---------- scroll choreography ---------- */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const heroEl = document.querySelector('.hero');

  if (hero && !reduce) {
    ScrollTrigger.create({
      trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: s => {
        const p = s.progress;
        hero.cam.pos.set(-0.6 + p * 1.2, 1.9 - p * 0.55, 3.4 - p * 3.0);
        hero.cam.target.set(0.4 + p * 0.6, 0.5 - p * 0.2, -6 - p * 1.5);
        heroFade = Math.max(0, 1 - p * 2.2);
      },
    });
  }

  // statement: pin, line 1 reveal, line 2 word fill, wave rising
  const stage = document.getElementById('coreStage');
  const w = [...document.querySelectorAll('#stmt2 .w')];
  if (reduce) {
    if (coreT) { coreT.rise = 1; }
  } else {
    gsap.set('.stmt__l1 > span', { yPercent: 110 });
    gsap.set(w, { opacity: 0.14 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: '+=240%', pin: true, scrub: 0.6 } });
    const wave = { r: 0.15 };
    tl.to(wave, { r: 1, duration: 4, ease: 'none', onUpdate: () => { if (coreT) { const q = (wave.r - 0.15) / 0.85; coreT.rise = wave.r; coreT.cam.pos.set(q * 2 - 1, 1.8 - q * 0.3, 3.4); coreT.cam.target.set(q * 1.2 - 0.6, -0.35, -3); } } }, 0)
      .to('.stmt__l1 > span', { yPercent: 0, duration: 1, ease: 'power3.out' }, 0.2)
      .to(w, { opacity: 1, duration: 0.5, stagger: 0.45, ease: 'none' }, 1.3);
  }
  if (coreT) coreT.rise = reduce ? 1 : 0.15;

  // CTA fabric folds as it enters
  if (ctaT && !reduce) {
    ScrollTrigger.create({ trigger: '#cta', start: 'top bottom', end: 'bottom bottom', scrub: true, onUpdate: s => { ctaT.rise = 0.25 + s.progress * 0.75; ctaT.cam.pos.x = (s.progress - 0.5) * 4; } });
  }

  // support clock hand
  if (!reduce) {
    gsap.to('#hand', { rotation: 360, svgOrigin: '180 180', ease: 'none', scrollTrigger: { trigger: '#sup', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  // own: items light up
  const items = gsap.utils.toArray('.own__list li');
  items.forEach(li => {
    ScrollTrigger.create({ trigger: li, start: 'top 62%', end: 'bottom 38%', toggleClass: { targets: li, className: 'lit' } });
  });
  gsap.utils.toArray('.hatch').forEach(h => {
    if (!reduce) gsap.fromTo(h, { backgroundPositionX: 0 }, { backgroundPositionX: 160, ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // simple reveals
  if (!reduce) gsap.utils.toArray('.est__top, .bpanel, .sup__txt, .spot__grid, .posts, .trust__logos').forEach(el => {
    gsap.from(el, { y: 36, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}
if (reduce) { document.querySelectorAll('.own__list li').forEach(l => l.classList.add('lit')); }
