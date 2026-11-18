import { initScene } from './scene.js';

const B = window.BITGO;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const arrow = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 10h13M11 4.5 16.5 10 11 15.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>';
const lines = t => (Array.isArray(t) ? t : [t]);

/* ---------- light states: one per place on the page ---------- */
const BASE = { cx: 0, lx: 0, ly: -0.1, r1: .09, g1: .27, b1: .95, r2: .72, g2: .3, b2: 1, int: 1, gap: .1, slab: 1.1, top: 2.2, asym: 0, step: .5, fin: 0, lintel: 3, ringR: .55, ringI: .6, rays: 1, flood: 0, shatter: 0, tilt: 0 };
const S = o => Object.assign({}, BASE, o);
const ST = {
  hero0: S({ cx: .46, ly: -.12, gap: .11, ringR: .52, ringI: .75, step: .6 }),
  hero1: S({ cx: .40, lx: .16, ly: -.02, gap: .2, ringR: .66, ringI: .85, r1: .2, g1: .55, b1: 1, r2: .3, g2: .9, b2: 1, step: .9, lintel: .5 }),
  hero2: S({ cx: .44, ly: .12, gap: .07, slab: .7, ringR: .4, ringI: .9, r1: .3, g1: .3, b1: 1, r2: 1, g2: .35, b2: .85, fin: .55, step: .3 }),
  trust: S({ cx: .1, lx: .78, ly: -.38, gap: .5, slab: .5, top: .55, asym: -.2, ringR: .28, ringI: .4, int: .8, r1: .45, g1: .6, b1: 1, fin: .3, step: 0 }),
  badges: S({ cx: 0, ly: .38, gap: .85, slab: .5, top: .2, lintel: .72, ringR: .95, ringI: 1, int: .9, step: 0 }),
  core0: S({ cx: -.3, lx: .3, ly: -.05, gap: .06, step: 1, fin: 0, r1: .5, g1: .72, b1: 1, r2: .8, g2: .8, b2: 1, ringR: .4, ringI: .5 }),
  core1: S({ cx: .35, ly: -.1, gap: .28, slab: .32, fin: .85, step: .2, r1: .5, g1: .3, b1: 1, r2: 1, g2: .4, b2: .9, ringR: .62, ringI: .7, top: 1.0 }),
  core2: S({ cx: -.2, ly: .05, gap: .24, slab: .9, lintel: .38, r1: .1, g1: .8, b1: .95, r2: .4, g2: 1, b2: .8, ringR: .76, ringI: .9, step: 0 }),
  core3: S({ cx: .42, ly: -.15, gap: .03, slab: 1.4, top: 2.4, r1: .06, g1: .22, b1: 1, ringR: .3, ringI: .35, rays: 1.7, int: 1.1, step: .2 }),
  core4: S({ cx: -.1, lx: .1, ly: -.05, gap: .14, tilt: .32, r1: .95, g1: .62, b1: 1, r2: 1, g2: .4, b2: .9, ringR: .85, ringI: 1.1, step: .8, int: 1.05 }),
  established: S({ cx: 0, ly: -.2, r1: .086, g1: .278, b1: .859, gap: 1.7, slab: .3, top: -.2, flood: 1, int: 1.15, ringR: .9, ringI: .7, step: 0, rays: .8 }),
  build: S({ cx: 0, ly: .95, gap: .66, slab: .3, fin: 1.1, top: 1.2, r1: .25, g1: .5, b1: 1, rays: 1.5, ringR: .5, ringI: .4, step: 0 }),
  support: S({ cx: .62, ly: .02, gap: .5, slab: .14, top: .1, ringR: .86, ringI: 1.25, int: .85, r1: .12, g1: .3, b1: 1, step: 0, rays: .6 }),
  own0: S({ cx: -.4, ly: -.2, gap: .4, slab: .8, top: 1.3, int: .55, r1: .3, g1: .3, b1: .95, ringR: .3, ringI: .3, shatter: 0 }),
  own1: S({ cx: -.2, ly: -.1, gap: .35, slab: .8, top: 1.3, int: .6, r1: .45, g1: .3, b1: 1, ringR: .5, ringI: .5, shatter: .05 }),
  own2: S({ cx: 0, ly: 0, gap: .3, slab: .8, top: 1.3, int: .7, r1: .6, g1: .3, b1: 1, r2: 1, g2: .4, b2: .8, ringR: .7, ringI: .8, shatter: .12 }),
  own3: S({ cx: .2, ly: .1, gap: .3, slab: .8, top: 1.3, int: .8, r1: .75, g1: .4, b1: 1, r2: 1, g2: .5, b2: .9, ringR: .85, ringI: 1, shatter: .22 }),
  own4: S({ cx: .1, ly: .05, gap: .4, slab: .8, top: 1.3, int: .95, r1: .6, g1: .65, b1: 1, ringR: 1, ringI: 1.1, shatter: .4 }),
  spotlight: S({ cx: 0, ly: -.5, gap: .9, slab: .5, top: .1, ringR: .2, ringI: .2, rays: .5, int: .75, r1: .1, g1: .55, b1: 1, step: 0, fin: .35 }),
  latest: S({ cx: -.6, lx: -.5, ly: -.3, gap: .35, slab: .6, top: .9, int: .55, fin: .6, ringR: .35, ringI: .25, r1: .12, g1: .3, b1: .95, step: .4 }),
  cta: S({ cx: 0, ly: .0, gap: 1.2, slab: .5, top: .3, r1: .1, g1: .33, b1: 1, flood: .9, int: 1.7, ringR: 1.15, ringI: 1.3, step: 1, rays: 1.6, lintel: 3 }),
  footer: S({ cx: 0, ly: -.55, gap: .24, slab: .8, top: .3, int: .3, fin: .4, ringR: .3, ringI: .15, step: 0 })
};

/* ---------- markup ---------- */
function navHTML() {
  const menus = B.menus.map((m, i) => `
    <li class="mi" data-i="${i}">
      <button class="mb" aria-expanded="false" aria-controls="mp${i}">${esc(m.label)}</button>
      <div class="mp" id="mp${i}"><div class="mp-in">${m.groups.map(g => `
        <div class="mg"><h3>${esc(g.title)}</h3><ul>${g.items.map(it => `<li><a href="${esc(it.href)}">${esc(it.label)}</a></li>`).join('')}</ul></div>`).join('')}
      </div></div>
    </li>`).join('');
  const a = B.navActions;
  return `<div class="nav-in">
    <a class="logo" href="${B.BITGO}" aria-label="BitGo"><img src="../shared/assets/bitgo-logo.svg" alt="BitGo" width="108" height="37"></a>
    <ul class="menus">${menus}</ul>
    <div class="nav-act">
      <span class="lang">${esc(a.language)}</span>
      <a class="plain" href="${esc(a.signup.href)}">${esc(a.signup.label)}</a>
      <a class="plain" href="${esc(a.login.href)}">${esc(a.login.label)}</a>
      <a class="btn sm" href="#cta">${esc(a.connect)}</a>
    </div>
    <button class="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
  </div>`;
}

function heroHTML() {
  const h = B.hero;
  return `<section class="hero" id="hero" data-anchor="hero0">
    <div class="wrap hero-in">
      <h1 aria-label="${esc(h.h1)}">
        <span class="hw-stack" aria-hidden="true">${h.words.map((w, i) => `<span class="hw${i === 0 ? ' on' : ''}" data-i="${i}">${esc(w)}</span>`).join('')}</span>
        <span class="hr" aria-hidden="true" data-split>${esc(h.rest)}</span>
      </h1>
      <p class="hero-sub" data-split>${esc(h.sub)}</p>
      <a class="btn" href="#cta">${esc(h.cta)} ${arrow}</a>
    </div>
  </section>`;
}

function trustHTML() {
  return `<section class="trust" id="trust" data-anchor="trust">
    <div class="wrap">
      <h2 class="h2" data-split>${esc(B.trust.title)}</h2>
      <ul class="tlogos">${B.trust.logos.map((l, i) => `<li><img src="${esc(l)}" alt="" loading="lazy"></li>`).join('')}</ul>
    </div>
  </section>`;
}

function badgesHTML() {
  const v = ['ring', 'beam', 'rise'];
  return `<section class="badges" id="badges" data-anchor="badges">
    <div class="wrap bd-grid">${B.badges.map((b, i) => {
      const [a, ...rest] = b.label.split(/:\s*/);
      return `<div class="glass bd bd-${v[i]}"><span class="bd-fx" aria-hidden="true"></span><p class="bd-t">${esc(b.label)}</p></div>`;
    }).join('')}</div>
  </section>`;
}

function coreHTML() {
  const c = B.core;
  return `<section class="core" id="core">
    <div class="wrap core-head" data-anchor="core0">
      <h2 class="h1" data-split>${lines(c.title).map(esc).join(' <br> ')}</h2>
    </div>
    <div class="wrap core-grid">
      <ol class="core-idx" aria-hidden="true">${c.items.map((it, i) => `<li data-i="${i}">${esc(it.title)}</li>`).join('')}</ol>
      <div class="core-steps">${c.items.map((it, i) => `
        <article class="step" data-i="${i}" data-anchor="core${i}">
          <h3 class="h2" data-split>${esc(it.title)}</h3>
          <p class="lead">${esc(it.short)}</p>
          <p class="body">${esc(it.long)}</p>
          <a class="link" href="${esc(it.cta.href)}">${esc(it.cta.label)} ${arrow}</a>
        </article>`).join('')}
      </div>
    </div>
  </section>`;
}

function establishedHTML() {
  const e = B.established;
  return `<section class="est" id="established" data-anchor="established">
    <div class="wrap">
      <div class="est-head">
        <h2 class="h1" data-split>${esc(e.title)}</h2>
        <div class="est-side"><p class="lead">${esc(e.text)}</p><a class="btn light" href="${esc(e.cta.href)}">${esc(e.cta.label)} ${arrow}</a></div>
      </div>
      <ul class="est-grid">${e.logos.map(l => `
        <li class="est-c${l.text ? ' has' : ''}">
          ${l.href ? `<a href="${esc(l.href)}" aria-label="${esc(l.name)}">` : '<div>'}
            <img src="${esc(l.image)}" alt="${esc(l.name)}" loading="lazy">
            ${l.text ? `<span class="est-t">${esc(l.text)}</span>` : ''}
          ${l.href ? '</a>' : '</div>'}
        </li>`).join('')}
      </ul>
    </div>
  </section>`;
}

function buildHTML() {
  const b = B.build;
  const v = ['beam', 'rise', 'prism'];
  return `<section class="build" id="build" data-anchor="build">
    <div class="wrap">
      <h2 class="h1" data-split>${esc(b.title)}</h2>
      <div class="bc-row">${b.cards.map((c, i) => `
        <a class="glass bc bc-${v[i]}" href="${esc(c.cta.href)}">
          <span class="bc-fx" aria-hidden="true"></span>
          <span class="bc-txt"><h3 class="h3">${esc(c.label)}</h3><p>${esc(c.text.replace('place-hold', 'place: hold'))}</p><span class="link">${esc(c.cta.label)} ${arrow}</span></span>
        </a>`).join('')}
      </div>
    </div>
  </section>`;
}

function supportHTML() {
  const s = B.support;
  return `<section class="support" id="support" data-anchor="support">
    <div class="wrap sup-grid">
      <div>
        <h2 class="mega" data-split>${esc(s.label)}</h2>
        <p class="lead sup-lead">${esc(s.title)}</p>
        <ul class="sup-list">${s.items.map(t => `<li data-split>${esc(t)}</li>`).join('')}</ul>
      </div>
    </div>
  </section>`;
}

function ownHTML() {
  const o = B.own;
  return `<section class="own" id="own">
    <div class="own-track">
      <div class="own-stage">
        <div class="wrap own-in">
          <h2 class="own-h" data-split>${esc(o.title)}</h2>
          <div class="own-items">${o.items.map((it, i) => `
            <div class="own-it" data-i="${i}"><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function spotlightHTML() {
  const s = B.spotlight;
  const ang = [-8, 0, 12];
  return `<section class="spot" id="spotlight" data-anchor="spotlight">
    <div class="wrap">
      <h2 class="h1" data-split>${esc(s.label)}</h2>
      <div class="sp-row">${s.slides.map((sl, i) => `
        <a class="sp" href="${esc(sl.video)}" target="_blank" rel="noopener" style="--a:${ang[i]}deg;--k:${i}">
          <span class="sp-screen" aria-hidden="true"><span class="sp-flare"></span><span class="sp-play"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span></span>
          <span class="sp-t">${esc(sl.title)}</span>
        </a>`).join('')}
      </div>
    </div>
  </section>`;
}

function latestHTML() {
  const l = B.latest;
  return `<section class="latest" id="latest" data-anchor="latest">
    <div class="wrap">
      <div class="lt-head"><h2 class="h1" data-split>${esc(l.title)}</h2><a class="link" href="${esc(l.all.href)}">${esc(l.all.label)} ${arrow}</a></div>
      <ul class="lt-list">${l.posts.map(p => `<li class="lt-r"><a href="${esc(p.href)}"><span>${esc(p.title)}</span>${arrow}</a></li>`).join('')}</ul>
    </div>
  </section>`;
}

function ctaHTML() {
  const c = B.cta;
  return `<section class="cta" id="cta" data-anchor="cta">
    <div class="wrap">
      <h2 class="mega c" data-split>${lines(c.title).map(esc).join(' ')}</h2>
      <a class="btn big" href="${B.BITGO}/contact-us/">${esc(c.button)} ${arrow}</a>
    </div>
  </section>`;
}

function footerHTML() {
  const f = B.footer;
  const cols = B.menus[0].groups.map(g => `<div><h4>${esc(g.title)}</h4><ul>${g.items.slice(0, 6).map(i => `<li><a href="${esc(i.href)}">${esc(i.label)}</a></li>`).join('')}</ul></div>`).join('');
  return `<div class="wrap foot-in" data-anchor="footer">
    <div class="foot-top">
      <div class="nl"><img src="../shared/assets/bitgo-logo.svg" alt="BitGo" width="120" height="41">
        <p class="lead">${esc(f.newsletter)}</p>
        <form class="nl-f" onsubmit="return false"><label class="sr" for="em">${esc(f.email)}</label><input id="em" type="email" placeholder="${esc(f.email)}" autocomplete="email"><button class="btn" type="submit">${esc(f.subscribe)}</button></form>
        <ul class="soc">${f.socials.map(s => `<li><a href="${esc(s.href)}">${esc(s.label)}</a></li>`).join('')}</ul>
      </div>
      <div class="fcols">${cols}</div>
    </div>
    <div class="legal">${f.legal.map(t => `<p>${esc(t)}</p>`).join('')}
      <p>${esc(f.review)} <a href="${esc(f.privacy.href)}">${esc(f.privacy.label)}</a> ${esc(f.and)} <a href="${esc(f.disclaimers.href)}">${esc(f.disclaimers.label)}</a>.</p>
      <p>${esc(f.complaints)}</p><p>${esc(f.screenReader)}</p><p>${esc(f.nmls)}</p>
      <p><a href="${esc(f.choices.href || f.privacy.href)}">${esc(f.choices.label || f.choices)}</a> &nbsp; ${esc(f.rights)}</p>
    </div>
  </div>`;
}

$('#nav').innerHTML = navHTML();
$('#main').innerHTML = [heroHTML(), trustHTML(), badgesHTML(), coreHTML(), establishedHTML(), buildHTML(), supportHTML(), ownHTML(), spotlightHTML(), latestHTML(), ctaHTML()].join('');
$('#footer').innerHTML = footerHTML();

/* ---------- word-by-word blur reveal ---------- */
function split(el) {
  const walk = n => {
    [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(' '); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.append(s);
        });
        n.replaceChild(frag, c);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
    });
  };
  walk(el);
  $$('.w', el).forEach((w, i) => w.style.setProperty('--i', i));
}
$$('[data-split]').forEach(split);
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2, rootMargin: '0px 0px -8% 0px' });
$$('[data-split]').forEach(el => reduce ? el.classList.add('in') : io.observe(el));
['.lead', '.body', '.link', '.btn', '.glass', '.est-c', '.tlogos li', '.sp', '.lt-r', '.sup-list li', '.step .link'].forEach(sel => $$(sel).forEach(el => { if (!el.closest('.nav') && !el.hasAttribute('data-split')) { el.classList.add('fade'); reduce ? el.classList.add('in') : io.observe(el); } }));

/* ---------- nav ---------- */
const nav = $('#nav');
$$('.mi').forEach(li => {
  const btn = $('.mb', li);
  const set = o => { li.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
  btn.addEventListener('click', () => { const o = !li.classList.contains('open'); $$('.mi').forEach(x => { x.classList.remove('open'); $('.mb', x).setAttribute('aria-expanded', false); }); set(o); });
  li.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover) and (min-width:1000px)').matches) { $$('.mi').forEach(x => x.classList.remove('open')); set(true); } });
  li.addEventListener('mouseleave', () => { if (matchMedia('(hover:hover) and (min-width:1000px)').matches) set(false); });
});
addEventListener('keydown', e => { if (e.key === 'Escape') $$('.mi').forEach(x => x.classList.remove('open')); });
$('.burger').addEventListener('click', e => { const o = nav.classList.toggle('mob'); e.currentTarget.setAttribute('aria-expanded', o); });
const scrollNav = () => nav.classList.toggle('solid', scrollY > 30);

/* ---------- hero word ---------- */
let heroIdx = 0;
const words = $$('.hw');
if (!reduce) setInterval(() => {
  words[heroIdx].classList.remove('on'); words[heroIdx].classList.add('off');
  const old = words[heroIdx]; setTimeout(() => old.classList.remove('off'), 900);
  heroIdx = (heroIdx + 1) % words.length;
  words[heroIdx].classList.add('on');
  if (heroIdx === 2 && scene) scene.glitchBurst(.55);
}, 3600);

/* ---------- pointer glow on glass ---------- */
$$('.glass, .lt-r, .est-c').forEach(el => el.addEventListener('pointermove', e => {
  const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true }));

/* ---------- scene + anchors ---------- */
const scene = initScene($('#light'));
const KEYS = scene ? scene.KEYS : [];
const anchors = [];
function gather() {
  anchors.length = 0;
  const sy = scrollY;
  const add = (el, name, y) => anchors.push({ y: y ?? (el.getBoundingClientRect().top + sy + el.offsetHeight / 2), st: ST[name] });
  $$('[data-anchor]').forEach(el => {
    const n = el.dataset.anchor;
    if (n === 'footer') add(el, 'footer');
    else add(el, n);
  });
  const tr = $('.own-track'); const h = tr.offsetHeight - innerHeight, top = tr.getBoundingClientRect().top + sy;
  for (let i = 0; i < 5; i++) anchors.push({ y: top + h * (i + .5) / 5 + innerHeight / 2, st: ST['own' + i] });
  anchors.sort((a, b) => a.y - b.y);
}
function smooth(t) { return t * t * (3 - 2 * t); }
function targetFor(c) {
  const t = {};
  let a = anchors[0], b = anchors[0], u = 0;
  if (c <= anchors[0].y) { a = b = anchors[0]; }
  else if (c >= anchors[anchors.length - 1].y) { a = b = anchors[anchors.length - 1]; }
  else for (let i = 0; i < anchors.length - 1; i++) if (c >= anchors[i].y && c <= anchors[i + 1].y) { a = anchors[i]; b = anchors[i + 1]; u = (c - a.y) / Math.max(1, b.y - a.y); break; }
  u = smooth(Math.min(1, Math.max(0, (u - .22) / .56)));
  for (const k of KEYS) t[k] = a.st[k] + (b.st[k] - a.st[k]) * u;
  return t;
}
function heroMix(t) {
  // the rotating word shifts the light while the hero is on screen
  const w = Math.max(0, 1 - scrollY / (innerHeight * .8));
  if (w <= 0) return t;
  const h = ST['hero' + heroIdx];
  for (const k of KEYS) t[k] = t[k] + (h[k] - ST.hero0[k]) * w;
  return t;
}

/* ---------- scroll-driven pieces ---------- */
const own = { track: $('.own-track'), items: $$('.own-it'), last: -1, head: $('.own-h') };
const coreIdx = $$('.core-idx li'), steps = $$('.step');
const logos = $$('.tlogos li'); const trustSec = $('#trust');
let vis = true;
let lastGlitchOwn = -1;
function update(now) {
  scrollNav();
  const vh = innerHeight, c = scrollY + vh / 2;
  if (scene) scene.setTarget(heroMix(targetFor(c)));

  // own: stage progress
  const tr = own.track.getBoundingClientRect();
  const prog = Math.min(.9999, Math.max(0, -tr.top / (own.track.offsetHeight - vh)));
  const idx = Math.floor(prog * 5);
  if (idx !== own.last) {
    own.items.forEach((el, i) => { el.classList.toggle('on', i === idx); el.classList.toggle('past', i < idx); });
    if (own.last !== -1 && idx === 4 && lastGlitchOwn !== 4 && scene) { scene.glitchBurst(.9); }
    lastGlitchOwn = idx; own.last = idx;
  }
  own.head.classList.toggle('dim', idx > 0);

  // core: active step
  let best = 0, bd = 1e9;
  steps.forEach((s, i) => { const r = s.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - vh / 2); if (d < bd) { bd = d; best = i; } });
  coreIdx.forEach((li, i) => li.classList.toggle('on', i === best));
  steps.forEach((s, i) => s.classList.toggle('act', i === best));

  // trust: a sweep of light crosses the logos
  const tb = trustSec.getBoundingClientRect();
  if (tb.bottom > 0 && tb.top < vh) {
    const p = (vh - tb.top) / (vh + tb.height);
    const sweep = (reduce ? .5 : ((now / 9000) % 1)) * 1.4 - .2 + (p - .5) * .6;
    logos.forEach(li => {
      const r = li.getBoundingClientRect(); const x = (r.left + r.width / 2) / innerWidth;
      const lit = Math.exp(-Math.pow((x - sweep) / .16, 2));
      li.style.setProperty('--lit', lit.toFixed(3));
    });
  }
}
function loop(now) { requestAnimationFrame(loop); if (!document.hidden) update(now); }
gather();
new ResizeObserver(() => gather()).observe(document.body);
addEventListener('load', gather); document.fonts && document.fonts.ready.then(gather);
requestAnimationFrame(loop);
