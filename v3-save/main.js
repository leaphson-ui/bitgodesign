const B = window.BITGO;
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- static content ---------------- */
$('#skip').textContent = B.skip;

// nav
const navMenus = $('#navMenus'), mega = $('#mega'), nav = $('#nav');
B.menus.forEach((m, i) => {
  const b = el('button', '', esc(m.label)); b.setAttribute('aria-expanded', 'false'); b.dataset.i = i; navMenus.appendChild(b);
});
const na = B.navActions;
$('#navActions').innerHTML = `<span class="lang">${esc(na.language)}</span><a class="login" href="${na.login.href}">${esc(na.login.label)}</a><a href="${na.signup.href}">${esc(na.signup.label)}</a><a class="connect" href="#cta">${esc(na.connect)}</a>`;
let openMenu = -1;
function showMega(i) {
  const btns = navMenus.children;
  [...btns].forEach((b, k) => b.setAttribute('aria-expanded', k === i ? 'true' : 'false'));
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
// mobile menu
const mm = $('#mobileMenu'), burger = $('#burger');
mm.innerHTML = B.menus.map(m => `<details><summary>${esc(m.label)}</summary>${m.groups.map(g => `<h4>${esc(g.title)}</h4>${g.items.map(it => `<a href="${it.href}">${esc(it.label)}</a>`).join('')}`).join('')}</details>`).join('') +
  `<div class="mm-actions"><a href="${na.login.href}">${esc(na.login.label)}</a><a href="${na.signup.href}">${esc(na.signup.label)}</a><a class="connect" href="#cta">${esc(na.connect)}</a></div>`;
burger.addEventListener('click', () => { const o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', o); mm.hidden = !o; nav.classList.toggle('open', o); });
mm.addEventListener('click', e => { if (e.target.closest('.mm-actions a')) { mm.hidden = true; burger.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); } });

// hero text
const rot = $('#rot');
B.hero.words.forEach((w, i) => { const s = el('i', i === 0 ? 'on' : '', esc(w)); rot.appendChild(s); });
// widest word sets the width reference
$('#heroRest').textContent = B.hero.rest;
$('#heroSub').textContent = B.hero.sub;
$('#heroCta').textContent = B.hero.cta;
rot.setAttribute('aria-label', B.hero.words[0]);
let rotI = 0;
if (!reduced) setInterval(() => {
  const k = rot.children; const cur = k[rotI]; rotI = (rotI + 1) % k.length; const nx = k[rotI];
  cur.className = 'off'; setTimeout(() => { cur.className = ''; }, 800); nx.className = 'on';
}, 2600);

// window stages
const stageData = [
  { word: B.hero.words[0], line: B.core.items[2].short },
  { word: B.hero.words[1], line: B.core.items[0].short },
  { word: B.hero.words[2], line: B.core.items[4].short },
];
const winTabs = $('#winTabs'); stageData.forEach(s => winTabs.appendChild(el('span', '', esc(s.word))));
const stagesEl = $('#stages');
const stageEls = stageData.map(s => {
  const st = el('div', 'stage'); const w = el('div', 'w-word'); w.setAttribute('aria-label', s.word);
  const l = el('p', 'w-line'); l.innerHTML = s.line.split(' ').map(x => `<span>${esc(x)}</span>`).join('');
  st.append(w, l); stagesEl.appendChild(st);
  return { st, w, l, spans: [...l.children], text: s.word };
});
const idle = $('#idle'); const idleText = B.hero.sub;


const views = [];           // { el, cfg } registered with the terrain once it loads
const addView = (el, cfg) => { views.push({ el, cfg }); return cfg; };
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// hero view (the whole hero box is a window onto the terrain)
const heroView = addView($('#heroStick'), { mode: 'fly', y: 4.2, pitch: 7.5, fov: 55, speed: 1.4, scroll: .04, s: 0 });

// trust
$('#trustTitle').textContent = B.trust.title;
function reelRow(id, rev) {
  const row = $(id); const logos = rev ? [...B.trust.logos].reverse() : B.trust.logos;
  const set = logos.map(src => `<img src="${src}" alt="" loading="eager">`).join('');
  row.innerHTML = set + set + set; return row;
}
const reelA = reelRow('#reelA', false), reelB = reelRow('#reelB', true);
addView($('#trustView'), { mode: 'fly', y: 9, pitch: 2.5, fov: 62, z0: 60, speed: 1, scroll: .05, sun: [-.6, .22, -1] });

// badges: survey markers on a plan view
const pinPos = [[7, 22], [30, 52], [53, 78]];
$('#badgeList').innerHTML = B.badges.map((b, i) => `<li style="--x:${pinPos[i][0]}%;--y:${pinPos[i][1]}%"><span class="dot"></span><b>${esc(b.label)}</b></li>`).join('');
$('#planLine').setAttribute('points', pinPos.map(p => p.join(',')).join(' '));
addView($('#planView'), { mode: 'plan', y: 46, fov: 55, fog: .55, z0: 120, speed: .9, scroll: .05, tint: [0, .03, .06] });

// core: strata, each layer a ridge cut
$('#coreTitle').innerHTML = B.core.title.map(t => `<span>${esc(t)}</span>`).join('');
const strataCols = [['#5B84FF', '#2148D6'], ['#4468F0', '#1738BA'], ['#3253E0', '#112B96'], ['#233FC2', '#0B2072'], ['#1A2FA0', '#070F44']];
function ridge(seed, amp) {
  const r = rng(seed * 7919 + 11), pts = []; let x = 0, y = amp * .6;
  while (x < 100) {
    y = Math.min(amp, Math.max(0, y + (r() - .5) * amp * 1.1));
    if (r() < .18) y = r() * amp * .25;
    pts.push(`${x.toFixed(1)}% ${y.toFixed(0)}px`); x += 2.2 + r() * 5;
  }
  return `polygon(${pts.join(',')},100% ${(amp * .5).toFixed(0)}px,100% 100%,0 100%)`;
}
$('#strata').innerHTML = B.core.items.map((it, i) => {
  const amp = 56 + (i * 37 % 41);
  return `<article class="stratum" style="--amp:${amp}px;--c1:${strataCols[i][0]};--c2:${strataCols[i][1]};clip-path:${ridge(i + 3, amp)}"><div class="st-in"><h3 class="rv">${esc(it.title)}</h3><div class="rv"><p class="short">${esc(it.short)}</p><p class="long">${esc(it.long)}</p></div><a class="go rv" href="${it.cta.href}">${esc(it.cta.label)}</a></div></article>`;
}).join('');

// established: stations on a panorama
$('#estTitle').textContent = B.established.title;
$('#estText').textContent = B.established.text;
const estCta = $('#estCta'); estCta.textContent = B.established.cta.label; estCta.href = B.established.cta.href;
const stPos = [[9, 62], [20.7, 30], [32.4, 66], [44.1, 28], [55.8, 64], [67.5, 32], [79.2, 62], [90.9, 30]];
$('#stations').innerHTML = B.established.logos.map((l, i) => {
  const p = stPos[i % 8], has = !!l.text;
  return `<div class="st${has ? ' has' : ''}${p[1] < 45 ? ' down' : ''}" style="--x:${p[0]}%;--y:${p[1]}%"><div class="plate"><img src="${l.image}" alt="${esc(l.name)}"></div>${has ? `<p class="pop">${esc(l.text)}</p><a href="${l.href}" aria-label="${esc(l.name)}"></a>` : ''}</div>`;
}).join('');
$('#estLine').setAttribute('points', stPos.slice(0, B.established.logos.length).map(p => p.join(',')).join(' '));
addView($('#estView'), { mode: 'fly', y: 5.5, pitch: 10, fov: 60, z0: 200, speed: 1.1, scroll: .05, sun: [.8, .3, -1] });

// build: three windows
const triCfg = [
  { mode: 'plan', y: 36, fog: .6, z0: 30, speed: 1.2, scroll: .05, tint: [0, .05, .1] },
  { mode: 'fly', y: 2.4, pitch: 3, fov: 58, z0: 90, speed: 1.3, scroll: .06, sun: [-.9, .2, -1] },
  { mode: 'fly', y: 15, pitch: 26, fov: 58, fog: .8, z0: 140, speed: 1.2, scroll: .05, tint: [.02, .06, .12] },
];
$('#tri').innerHTML = B.build.cards.map((c, i) => `<article class="tri-item"><div class="tview tri-view"><div class="sky-bg"></div><canvas class="scene" data-scene="${i}"></canvas></div><h3 class="rv">${esc(c.label)}</h3><p class="rv">${esc(c.text.replace('place-hold', 'place. Hold'))}</p><a class="btn btn-light rv" href="${c.cta.href}">${esc(c.cta.label)}</a></article>`).join('');
$('#buildTitle').textContent = B.build.title;
document.querySelectorAll('.tri-view').forEach((e, i) => addView(e, triCfg[i]));

// support: the sun goes round
$('#supTitle').textContent = B.support.title;
$('#supList').innerHTML = B.support.items.map(t => `<li class="rv">${esc(t)}</li>`).join('');
const supEl = $('#supView');
addView(supEl, { mode: 'fly', y: 5, pitch: 6, fov: 58, z0: 300, speed: 1, scroll: .05, sun: [0, .3, -1],
  onFrame(c, t, sy, r) {
    const a = (reduced ? 0 : t * .00007) + r.top / innerHeight * 1.1;
    const sunY = Math.cos(a) * .75 + .2;
    c.sun = [Math.sin(a) * 1.6, Math.max(sunY, .03), -1];
    supEl.style.setProperty('--night', clamp(.4 - sunY * 1.1, 0, 1).toFixed(3));
  } });

// own
const ownItems = B.own.items;
$('#ownHead').textContent = B.own.title;
$('#ownTicks').innerHTML = ownItems.map(() => '<li></li>').join('');
const ownTicks = [...$('#ownTicks').children];
$('#ownFallback').innerHTML = `<li><h2>${esc(B.own.title)}</h2></li>` + ownItems.map(i => `<li><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></li>`).join('');
const ownWord = $('#ownWord'), ownDesc = $('#ownDesc'); let ownShown = -1; let ownDescWords = [];



// spotlight: three windows
$('#spotTitle').textContent = B.spotlight.label;
const spotCfg = [
  { mode: 'fly', y: 3, pitch: 2.5, fov: 60, z0: 20, speed: 1.2, scroll: .05, sun: [0, .12, -1] },
  { mode: 'plan', y: 40, fog: .6, z0: 220, speed: 1, scroll: .05, tint: [.03, 0, .1] },
  { mode: 'fly', y: 11, pitch: 20, fov: 58, z0: 340, speed: 1.2, scroll: .05, sun: [.9, .35, -1] },
];
$('#spotList').innerHTML = B.spotlight.slides.map((s, i) => `<article class="sw"><a class="sw-link" href="${s.video}" aria-label="${esc(s.title)}" target="_blank" rel="noopener"><div class="sw-win"><div class="sw-chrome"><img src="../shared/assets/bitgo-logo.svg" alt="" width="58" height="20"><i></i></div><div class="tview sw-view nb-top"><div class="sky-bg"></div><span class="play"></span></div></div></a><h3 class="rv"><a href="${s.video}" target="_blank" rel="noopener">${esc(s.title)}</a></h3></article>`).join('');
document.querySelectorAll('.sw-view').forEach((e, i) => addView(e, spotCfg[i % 3]));

// latest: the window turns toward the story you point at
$('#latestTitle').textContent = B.latest.title;
const la = $('#latestAll'); la.textContent = B.latest.all.label; la.href = B.latest.all.href;
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
$('#posts').innerHTML = B.latest.posts.map(p => `<a class="post rv" href="${p.href}"><h3>${esc(p.title)}</h3><span class="arrow">${arrow}</span></a>`).join('');
const latestCfg = addView($('#latestView'), { mode: 'fly', y: 6, pitch: 9, fov: 58, z0: 400, speed: 1.1, scroll: .05, s: .3 });
$('#posts').addEventListener('pointerover', e => { const p = e.target.closest('.post'); if (p) latestCfg.s = .3 + [...p.parentElement.children].indexOf(p) * .8; });

// cta
$('#ctaTitle').innerHTML = B.cta.title.map(t => `<span>${esc(t)}</span>`).join('');
const ctaBtn = $('#ctaBtn'); ctaBtn.textContent = B.cta.button;
addView($('#cta'), { mode: 'fly', y: 5.5, pitch: 8, fov: 58, z0: 500, speed: 1.4, scroll: .04, tint: [-.05, .05, .15] });


// footer
const F = B.footer;
$('#footNews').textContent = F.newsletter;
$('#footEmailLabel').textContent = F.email; $('#footEmail').placeholder = F.email; $('#footSub').textContent = F.subscribe;
$('#socials').innerHTML = F.socials.map(s => `<li><a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('');
$('#footLinks').innerHTML = B.menus.map(m => m.groups.slice(0, 1).map(g => `<div><h4>${esc(m.label)}</h4>${g.items.slice(0, 7).map(it => `<a href="${it.href}">${esc(it.label)}</a>`).join('')}</div>`).join('')).join('');
$('#legal').innerHTML = F.legal.map(p => `<p>${esc(p)}</p>`).join('') + `<p>${esc(F.screenReader)}</p><p>${esc(F.complaints)}</p>`;
$('#footBottom').innerHTML = `<span>${esc(F.review)} <a href="${F.privacy.href}">${esc(F.privacy.label)}</a> ${esc(F.and)} <a href="${F.disclaimers.href}">${esc(F.disclaimers.label)}</a>.</span><span>${esc(F.nmls)}</span><a href="#">${esc(F.choices)}</a><span>${esc(F.rights)}</span>`;



/* ---------------- reveal on view ---------------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.rv').forEach(e => {
  const par = e.parentElement;
  e.style.transitionDelay = (par.classList.contains('posts') || par.tagName === 'UL') ? (Array.prototype.indexOf.call(par.children, e) * 90) + 'ms' : '';
  io.observe(e);
});

/* ---------------- geometry ---------------- */
const heroStick = $('#heroStick'), winEl = $('#win'), frameBox = $('#winFrame'), chrome = $('#winChrome'), winBg = $('#winBg'), heroHead = $('#heroHead'), content = $('#winContent');
const ownEl = $('#own'), trustEl = $('#trust');
let G = {};
function measure() {
  const sy = scrollY; const top = e => e.getBoundingClientRect().top + sy;
  G = {
    W: innerWidth, H: innerHeight,
    own: { top: top(ownEl), h: ownEl.offsetHeight },
    trust: { top: top(trustEl), h: trustEl.offsetHeight },
    setA: reelA.scrollWidth / 3, setB: reelB.scrollWidth / 3,
    headBottom: heroHead.getBoundingClientRect().bottom - heroStick.getBoundingClientRect().top,
  };
}
const prog = (o) => clamp((scrollY - o.top) / Math.max(1, o.h - G.H));

/* ---------------- typing helpers ---------------- */
function typeInto(e, text, f, caret) {
  const n = Math.round(text.length * clamp(f));
  const key = n + '|' + (caret ? 1 : 0);
  if (e._k === key) return; e._k = key;
  e.textContent = text.slice(0, n);
  if (caret) e.appendChild(el('span', 'caret' + (n < text.length && n > 0 ? ' nb' : '')));
}
function blurWord(s, t) { const v = clamp(t); s.style.opacity = v; s.style.filter = v < 1 ? `blur(${(1 - v) * 14}px)` : 'none'; s.style.transform = `translateY(${(1 - v) * 10}px)`; }



/* ---------------- hero: plays on load and on a timer, never on scroll ---------------- */
const t0 = performance.now();
const IDLE_T = 3.4, STAGE_T = 4.8;
let introDone = false;
function updateHero(now) {
  const W = G.W, H = heroStick.offsetHeight || G.H, phone = W < 760;
  const age = (now - t0) / 1000;
  const L1 = phone ? 14 : W * .08, T1 = phone ? Math.min(H * .6, G.headBottom + 18) : Math.max(G.headBottom + 36, H * .4), B1 = phone ? 18 : H * .07, R1 = phone ? 16 : 22;
  const e = reduced ? 1 : easeIO(clamp(age / 1.6));
  const L = lerp(L1 * 2.2, L1, e), T = lerp(T1 + 70, T1, e), Bt = lerp(B1 + 40, B1, e);
  winEl.style.clipPath = `inset(${T}px ${L}px ${Bt}px ${L}px round ${R1}px)`;
  frameBox.style.cssText = `left:${L}px;right:${L}px;top:${T}px;bottom:${Bt}px;border-radius:${R1}px;opacity:${smooth(age / .6)}`;
  chrome.style.top = T + 'px'; chrome.style.left = L + 'px'; chrome.style.right = L + 'px';
  content.style.transform = `translateY(${(T + 54 - Bt) / 2}px)`;
  winBg.style.setProperty('--hx', (30 + Math.sin(age * .12) * 30) + '%'); winBg.style.setProperty('--hy', (24 + Math.sin(age * .2) * 12) + '%');
  const idleF = reduced ? 1 : clamp((age - .5) / 1.8);
  typeInto(idle, idleText, idleF, true);
  let idx = -1, u = 0;
  if (!reduced && age >= IDLE_T) { const k = Math.floor((age - IDLE_T) / STAGE_T); idx = k % 3; u = ((age - IDLE_T) % STAGE_T) / STAGE_T; }
  idle.style.opacity = reduced ? 1 : 1 - smooth((age - (IDLE_T - .6)) / .6);
  stageEls.forEach((s, i) => {
    if (i !== idx) { s.st.style.opacity = 0; s._k = ''; s.w._k = ''; return; }
    typeInto(s.w, s.text, u / .18, true);
    const n = s.spans.length;
    s.spans.forEach((sp, j) => blurWord(sp, (u - .17 - j * (.3 / n)) / .07));
    s.st.style.opacity = 1 - smooth((u - .9) / .1);
  });
  [...winTabs.children].forEach((t, i) => t.classList.toggle('on', i === idx));
  heroView.s = idx < 0 ? 0 : idx + .6;
}

/* ---------------- reel ---------------- */
function updateReel(now) {
  const r = trustEl.getBoundingClientRect(); if (r.bottom < 0 || r.top > G.H) return;
  const s = -r.top + (reduced ? 0 : now * .02);
  if (G.setA) reelA.style.transform = `translate3d(${-(((s * .35) % G.setA + G.setA) % G.setA)}px,0,0)`;
  if (G.setB) reelB.style.transform = `translate3d(${-G.setB + (((s * .35) % G.setB + G.setB) % G.setB)}px,0,0)`;
}

/* ---------------- own ---------------- */
function updateOwn() {
  if (G.W <= 760) return;
  const P = prog(G.own); const n = ownItems.length;
  const x = clamp((P - .04) / .92) * n; const idx = Math.min(n - 1, Math.floor(x)); const u = x - idx;
  if (idx !== ownShown) {
    ownShown = idx; ownDesc.innerHTML = ownItems[idx].text.split(' ').map(w => `<span>${esc(w)}</span>`).join('');
    ownDescWords = [...ownDesc.children]; ownWord._k = '';
    ownTicks.forEach((t, i) => t.classList.toggle('on', i === idx));
  }
  typeInto(ownWord, ownItems[idx].title, u / .3, true);
  const m = ownDescWords.length;
  ownDescWords.forEach((s, j) => blurWord(s, (u - .28 - j * (.4 / m)) / .1));
  const fade = idx < n - 1 ? 1 - smooth((u - .92) / .08) : 1;
  $('#ownItem').style.opacity = fade;
  if (matter) matter.set(P * n);
}



/* ---------------- loop ---------------- */
let lenis = null;
if (window.Lenis && !reduced) lenis = new Lenis({ lerp: .12, wheelMultiplier: 1 });
let matter = null, scenes = null, terrain = null;
function tick(t) {
  if (lenis) lenis.raf(t);
  nav.classList.toggle('solid', scrollY > 40);
  if (scrollY < innerHeight * 1.3) updateHero(t);
  updateReel(t);
  updateOwn();
  if (terrain) terrain.frame(t, scrollY);
  if (scenes) scenes.tick(t);
  requestAnimationFrame(tick);
}
addEventListener('resize', () => { measure(); matter && matter.resize(); terrain && terrain.resize(); });
addEventListener('load', () => { measure(); setTimeout(measure, 800); });
document.fonts && document.fonts.ready.then(measure);
measure(); requestAnimationFrame(tick);

/* ---------------- WebGL + canvas scenes (load lazily, text works without) ---------------- */
import('./terrain.js').then(m => { terrain = m.initTerrain($('#terrain')); if (terrain) views.forEach(v => terrain.add(v.el, v.cfg)); }).catch(e => console.warn('terrain off', e));
import('./matter.js').then(m => { matter = m.initMatter($('#matter'), $('#ownStick')); }).catch(e => console.warn('matter off', e));
import('./scenes.js').then(m => { scenes = m.initScenes(document.querySelectorAll('.tri-view canvas.scene'), B); }).catch(e => console.warn('scenes off', e));
