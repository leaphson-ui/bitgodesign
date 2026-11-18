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

// trust
$('#trustTitle').textContent = B.trust.title;
function reelRow(id, rev) {
  const row = $(id); const logos = rev ? [...B.trust.logos].reverse() : B.trust.logos;
  const set = logos.map(src => `<img src="${src}" alt="" loading="eager">`).join('');
  row.innerHTML = set + set + set; return row;
}
const reelA = reelRow('#reelA', false), reelB = reelRow('#reelB', true);

// badges
const badgeList = $('#badgeList');
const badgeEls = B.badges.map(b => { const l = el('li', '', esc(b.label)); badgeList.appendChild(l); return l; });
const badgeStick = $('#badgeStick'), badgeBar = $('#badgeBar'); let badgeIdx = -1;

// core
const coreTitle = $('#coreTitle'); coreTitle.innerHTML = B.core.title.map(t => `<span>${esc(t)}</span>`).join('');
const orbit = $('#orbit');
const cards = B.core.items.map(it => {
  const c = el('article', 'ocard', `<h3>${esc(it.title)}</h3><p class="short">${esc(it.short)}</p><div class="more"><p class="long">${esc(it.long)}</p><a class="go" href="${it.cta.href}">${esc(it.cta.label)}</a></div>`);
  orbit.appendChild(c); return c;
});

// established
$('#estTitle').textContent = B.established.title;
$('#estText').textContent = B.established.text;
const estCta = $('#estCta'); estCta.textContent = B.established.cta.label; estCta.href = B.established.cta.href;
const estGrid = $('#estGrid');
const tiles = B.established.logos.map(l => {
  const has = !!l.text;
  const t = el('div', 'tile' + (has ? ' has' : ''), `<img src="${l.image}" alt="${esc(l.name)}">` + (has ? `<p class="t-text">${esc(l.text)}</p><a class="t-link" href="${l.href}" aria-label="${esc(l.name)}"></a>` : ''));
  if (has) t.tabIndex = 0;
  estGrid.appendChild(t); return t;
});

// build
$('#buildTitle').textContent = B.build.title;
const frames = $('#frames');
const frameEls = B.build.cards.map((c, i) => {
  const f = el('article', 'frame'); f.style.setProperty('--i', i);
  f.innerHTML = `<div class="frame-copy"><h3>${esc(c.label)}</h3><p>${esc(c.text.replace('place-hold', 'place. Hold'))}</p><a class="btn btn-light" href="${c.cta.href}">${esc(c.cta.label)}</a></div><div class="frame-view"><canvas data-scene="${i}"></canvas></div>`;
  frames.appendChild(f); return f;
});

// support
$('#supTitle').textContent = B.support.title;
$('#supList').innerHTML = B.support.items.map(t => `<li class="rv">${esc(t)}</li>`).join('');
// dial
const dial = $('#dial'); let dialSvg = '';
for (let i = 0; i < 96; i++) {
  const a = i / 96 * Math.PI * 2, major = i % 4 === 0, r1 = 180, r0 = major ? 150 : 166;
  dialSvg += `<line class="${major ? 'tk' : 'tm'}" data-i="${i}" x1="${Math.sin(a) * r0}" y1="${-Math.cos(a) * r0}" x2="${Math.sin(a) * r1}" y2="${-Math.cos(a) * r1}" stroke="#1647DB" stroke-width="${major ? 3.4 : 1.6}" stroke-linecap="round" opacity="${major ? .9 : .35}"/>`;
}
dialSvg += `<circle r="120" fill="none" stroke="#1647DB" stroke-opacity=".18" stroke-width="1.5"/><g id="hand"><path d="M0 0 L0 -190 A190 190 0 0 0 -112 -153 Z" fill="#1647DB" fill-opacity=".12"/><line x1="0" y1="0" x2="0" y2="-190" stroke="#1647DB" stroke-width="3"/><circle cy="-190" r="8" fill="#1647DB"/></g>`;
dial.innerHTML = dialSvg;
const hand = $('#hand'); const ticks = [...dial.querySelectorAll('.tk,.tm')];

// own
const ownItems = B.own.items;
$('#ownHead').textContent = B.own.title;
$('#ownTicks').innerHTML = ownItems.map(() => '<li></li>').join('');
const ownTicks = [...$('#ownTicks').children];
$('#ownFallback').innerHTML = `<li><h2>${esc(B.own.title)}</h2></li>` + ownItems.map(i => `<li><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></li>`).join('');
const ownWord = $('#ownWord'), ownDesc = $('#ownDesc'); let ownShown = -1; let ownDescWords = [];

// spotlight
$('#spotTitle').textContent = B.spotlight.label;
const posterBg = [
  'conic-gradient(from 200deg at 30% 60%,#1647DB,#62D8FF,#0B1B6E,#7F6BFF,#1647DB)',
  'radial-gradient(60% 70% at 25% 30%,#62D8FF,transparent 60%),radial-gradient(70% 80% at 80% 80%,#1647DB,transparent 65%),#0A1650',
  'conic-gradient(from 20deg at 70% 40%,#0B1B6E,#1647DB,#9FB8FF,#1647DB,#0B1B6E)'
];
$('#spotList').innerHTML = B.spotlight.slides.map((s, i) => `<article class="spot-row rv"><a class="poster" href="${s.video}" aria-label="${esc(s.title)}" target="_blank" rel="noopener"><canvas data-poster="${i % 3}" width="960" height="540"></canvas><span class="play"></span></a><h3><a href="${s.video}" target="_blank" rel="noopener">${esc(s.title)}</a></h3></article>`).join('');

// latest
$('#latestTitle').textContent = B.latest.title;
const la = $('#latestAll'); la.textContent = B.latest.all.label; la.href = B.latest.all.href;
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
$('#posts').innerHTML = B.latest.posts.map(p => `<a class="post rv" href="${p.href}"><h3>${esc(p.title)}</h3><span class="arrow">${arrow}</span></a>`).join('');

// cta
$('#ctaTitle').innerHTML = B.cta.title.map(t => `<span>${esc(t)}</span>`).join('');
const ctaBtn = $('#ctaBtn'); ctaBtn.textContent = B.cta.button;
$('#cta').addEventListener('pointermove', e => { const r = $('#cta').getBoundingClientRect(); const L = $('#ctaLight'); L.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100) + '%'); L.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100) + '%'); });

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
document.querySelectorAll('.rv').forEach((e, i) => { e.style.transitionDelay = (e.parentElement.classList.contains('posts') || e.parentElement.tagName === 'UL') ? (Array.prototype.indexOf.call(e.parentElement.children, e) * 90) + 'ms' : ''; io.observe(e); });

/* ---------------- geometry cache ---------------- */
const heroEl = $('#top'), heroStick = $('#heroStick'), winEl = $('#win'), frameBox = $('#winFrame'), chrome = $('#winChrome'), winBg = $('#winBg'), heroHead = $('#heroHead'), content = $('#winContent');
const coreEl = $('#core'), coreStick = $('#coreStick'), ownEl = $('#own'), reelBox = $('.reel');
let G = {};
function measure() {
  const sy = scrollY; const top = e => e.getBoundingClientRect().top + sy;
  G = {
    W: innerWidth, H: innerHeight,
    hero: { top: top(heroEl), h: heroEl.offsetHeight },
    core: { top: top(coreEl), h: coreEl.offsetHeight },
    own: { top: top(ownEl), h: ownEl.offsetHeight },
    badges: { top: top($('#badges')), h: $('#badges').offsetHeight },
    trust: { top: top($('#trust')), h: $('#trust').offsetHeight },
    support: { top: top($('#support')), h: $('#support').offsetHeight },
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

/* ---------------- idle auto type ---------------- */
let idleStart = performance.now();

/* ---------------- hero ---------------- */
let terrain = null;
function updateHero() {
  const P = prog(G.hero); const W = G.W, H = G.H;
  const phone = W < 760;
  const L0 = phone ? 14 : W * .15;
  const T0 = phone ? Math.min(H * .6, G.headBottom + 18) : Math.max(G.headBottom + 36, H * .4);
  const B0 = phone ? 18 : H * .06;
  const Lb = phone ? 10 : W * .06, Tb = phone ? 92 : H * .14, Bb = phone ? 12 : H * .06;
  const g1 = easeIO(clamp(P / .16)), g2 = easeIO(clamp((P - .88) / .12));
  const L = lerp(lerp(L0, Lb, g1), 0, g2), T = lerp(lerp(T0, Tb, g1), 0, g2), Bt = lerp(lerp(B0, Bb, g1), 0, g2), R = lerp(lerp(phone ? 16 : 20, 26, g1), 0, g2);
  winEl.style.clipPath = `inset(${T}px ${L}px ${Bt}px ${L}px round ${R}px)`;
  frameBox.style.cssText = `left:${L}px;right:${L}px;top:${T}px;bottom:${Bt}px;border-radius:${R}px;opacity:${1 - smooth((g2 - .85) / .15)}`;
  chrome.style.top = T + 'px'; chrome.style.left = L + 'px'; chrome.style.right = L + 'px';
  const off = (T + 54 - Bt) / 2;
  content.style.transform = `translateY(${off}px)`;
  const stageF = clamp((P - .16) / .22, 0, 3);
  winBg.style.opacity = lerp(lerp(1, .8, smooth(stageF)), 1, g2);
  winBg.style.setProperty('--hx', (30 + P * 60) + '%'); winBg.style.setProperty('--hy', (20 + Math.sin(P * 9) * 15) + '%');
  const hh = clamp(P / .1);
  heroHead.style.opacity = 1 - hh; heroHead.style.transform = `translateY(${-hh * 60}px)`; heroHead.style.pointerEvents = hh > .8 ? 'none' : '';
  const age = (performance.now() - idleStart) / 1000;
  const idleF = reduced ? 1 : clamp((age - .4) / 1.6);
  typeInto(idle, idleText, idleF, true);
  idle.style.opacity = 1 - smooth((P - .08) / .08);
  let active = 0;
  stageEls.forEach((s, i) => {
    const s0 = .2 + i * .22, u = (P - s0) / .22;
    const vis = u >= 0 && (u <= 1 || i === 2);
    if (!vis) { s.st.style.opacity = 0; s._k = ''; if (s.w._k) { s.w._k = ''; } return; }
    active = i;
    const f = clamp(u / .3);
    typeInto(s.w, s.text, f, true);
    const n = s.spans.length;
    s.spans.forEach((sp, j) => blurWord(sp, (u - .28 - j * (.34 / n)) / .1));
    s.st.style.opacity = i === 2 ? 1 : 1 - smooth((u - .9) / .1);
  });
  [...winTabs.children].forEach((t, i) => t.classList.toggle('on', P >= .2 && i === active));
  heroStick.style.setProperty('--p', P);
  if (terrain) terrain.set(P, P < .2 ? 0 : clamp((P - .2) / .22, 0, 2.99));
}

/* ---------------- badges ---------------- */
function updateBadges() {
  const P = prog(G.badges); const x = P * badgeEls.length;
  badgeEls.forEach((e, i) => {
    const d = x - i - .5, v = clamp(2.4 - Math.abs(d) * 3.6);
    e.style.opacity = v; e.style.filter = v < 1 ? `blur(${((1 - v) * 22).toFixed(1)}px)` : 'none'; e.style.transform = `translateY(${(-d * 70).toFixed(1)}px)`;
  });
  const idx = Math.min(badgeEls.length - 1, Math.floor(x));
  if (idx !== badgeIdx) { badgeIdx = idx; badgeStick.dataset.i = idx; }
  badgeBar.style.transform = `scaleX(${P})`;
}

/* ---------------- core orbit ---------------- */
let activeCard = -1;
let mx = 0, my = 0, smx = 0, smy = 0;
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
function updateCore() {
  if (G.W <= 760) return;
  const P = prog(G.core); const W = G.W, H = G.H;
  const n = cards.length;
  const x = clamp((P - .06) / .86) * (n - 1);
  const fl = Math.floor(x), fr = x - fl;
  const xe = fl + smooth((fr - .2) / .6);
  const cx = W / 2 + smx * 30, cy = H * .585 + smy * 14;
  const rx = W * .37, ry = H * .125;
  let best = -2, bi = 0;
  const lead = clamp((.06 - P) / .06);
  cards.forEach((c, i) => {
    const th = (i - xe) * (Math.PI * 2 / n);
    const z = Math.cos(th), px = Math.sin(th);
    if (z > best) { best = z; bi = i; }
    const sc = .62 + .38 * (z + 1) / 2;
    const X = cx + px * rx, Y = cy + z * ry + (z > .7 ? 0 : 0);
    c.style.transform = `translate3d(${X - c.offsetWidth / 2}px,${Y - c.offsetHeight / 2}px,0) scale(${sc.toFixed(3)})`;
    c.style.zIndex = Math.round((z + 1) * 10) + (z > 0 ? 3 : 0);
    c.style.opacity = (.22 + .78 * (z + 1) / 2).toFixed(3);
    c.style.filter = z < 0 ? `blur(${((-z) * 3).toFixed(1)}px)` : 'none';
  });
  if (bi !== activeCard) { activeCard = bi; coreStick.style.setProperty('--gx', (20 + bi * 15) + '%'); coreStick.style.setProperty('--gy', (bi % 2 ? 62 : 38) + '%'); cards.forEach((c, i) => c.classList.toggle('active', i === bi)); }
  coreTitle.style.zIndex = 2;
  coreTitle.style.transform = `translate(${smx * -14}px,calc(-50% + ${smy * -8}px))`;
}

/* ---------------- established ---------------- */
function updateEst() {
  tiles.forEach((t, i) => {
    const r = t.getBoundingClientRect(); if (r.bottom < -200 || r.top > G.H + 200) return;
    const c = i % 4, d = (r.top + r.height / 2 - G.H / 2) / G.H;
    const sp = [.05, .12, .02, .16][c];
    t.style.transform = `translateY(${(d * -sp * 260).toFixed(1)}px)`;
  });
}

/* ---------------- build frames ---------------- */
function updateFrames() {
  if (G.W <= 860) return;
  frameEls.forEach((f, i) => {
    const nx = frameEls[i + 1]; if (!nx) return;
    const r = nx.getBoundingClientRect(); const stickTop = 88 + (i + 1) * 18;
    const t = clamp(1 - (r.top - stickTop) / (G.H * .75));
    f.style.transform = `scale(${(1 - t * .055).toFixed(4)})`;
    f.style.filter = `brightness(${(1 - t * .5).toFixed(3)})`;
  });
}

/* ---------------- support dial ---------------- */
function updateSupport() {
  const r = G.support; const p = clamp((scrollY + G.H - r.top) / (r.h + G.H));
  const a = p * 720 - 180;
  hand.setAttribute('transform', `rotate(${a})`);
  const idx = Math.floor((((a % 360) + 360) % 360) / 360 * 96);
  ticks.forEach((t, i) => { if (t.classList.contains('tk')) t.setAttribute('opacity', i === idx ? 1 : .55); });
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

/* ---------------- trust reel ---------------- */
function updateReel() {
  const t = G.trust; if (scrollY + G.H < t.top || scrollY > t.top + t.h) return;
  const s = scrollY - t.top;
  if (G.setA) reelA.style.transform = `translate3d(${-(((s * .35) % G.setA + G.setA) % G.setA)}px,0,0)`;
  if (G.setB) reelB.style.transform = `translate3d(${-G.setB + (((s * .35) % G.setB + G.setB) % G.setB)}px,0,0)`;
}

/* ---------------- loop ---------------- */
let lenis = null;
if (window.Lenis && !reduced) lenis = new Lenis({ lerp: .14, wheelMultiplier: 1 });
let lastY = -1;
function tick(t) {
  if (lenis) lenis.raf(t);
  smx = lerp(smx, mx, .06); smy = lerp(smy, my, .06);
  nav.classList.toggle('solid', scrollY > 40);
  const hv = scrollY < G.hero.top + G.hero.h;
  updateHero();
  updateReel();
  updateBadges();
  updateCore();
  updateEst();
  updateFrames();
  updateSupport();
  updateOwn();
  if (scenes) scenes.tick(t);
  requestAnimationFrame(tick);
}
function init() { measure(); updateHero(); }
addEventListener('resize', () => { measure(); matter && matter.resize(); terrain && terrain.resize(); });
addEventListener('load', () => { measure(); setTimeout(measure, 800); });
document.fonts && document.fonts.ready.then(measure);
measure(); requestAnimationFrame(tick);

/* ---------------- WebGL + canvas scenes (load lazily, text works without) ---------------- */
let matter = null, scenes = null;
import('./terrain.js').then(m => { terrain = m.initTerrain($('#terrain'), heroStick); }).catch(e => console.warn('terrain off', e));
import('./matter.js').then(m => { matter = m.initMatter($('#matter'), $('#ownStick')); }).catch(e => console.warn('matter off', e));
import('./scenes.js').then(m => { scenes = m.initScenes(document.querySelectorAll('.frame-view canvas'), B); }).catch(e => console.warn('scenes off', e));


/* ---------------- generated posters ---------------- */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function paintPoster(cv, kind) {
  const c = cv.getContext('2d'), w = cv.width, h = cv.height, r = rng(kind * 977 + 13);
  if (kind === 0) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a1450'); g.addColorStop(.55, '#3a5bdc'); g.addColorStop(1, '#a9c4ff');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const sun = c.createRadialGradient(w * .62, h * .5, 0, w * .62, h * .5, w * .4); sun.addColorStop(0, 'rgba(255,255,255,.95)'); sun.addColorStop(.25, 'rgba(180,220,255,.5)'); sun.addColorStop(1, 'rgba(98,216,255,0)');
    c.fillStyle = sun; c.fillRect(0, 0, w, h);
    for (let L = 0; L < 8; L++) {
      const base = h * (.45 + L * .08), amp = 30 + L * 18, f1 = r() * 5 + 3, f2 = r() * 9 + 7, ph = r() * 9;
      c.beginPath(); c.moveTo(0, h);
      const pts = [];
      for (let x = 0; x <= w; x += 6) { const t = x / w; const y = base - amp * (Math.abs(Math.sin(t * f1 + ph)) * .8 + .25 * Math.sin(t * f2 + ph * 2)); pts.push([x, y]); c.lineTo(x, y); }
      c.lineTo(w, h); c.closePath();
      const k = L / 7; c.fillStyle = `rgb(${Math.round(120 - 105 * k)},${Math.round(150 - 125 * k)},${Math.round(235 - 150 * k)})`; c.fill();
      c.strokeStyle = `rgba(150,230,255,${.55 - k * .35})`; c.lineWidth = 1.6; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.stroke();
    }
  } else if (kind === 1) {
    const g = c.createRadialGradient(w * .5, h * .5, 0, w * .5, h * .5, w * .6); g.addColorStop(0, '#12307f'); g.addColorStop(1, '#030818'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const N = 9000, R = h * .4, ay = .9, ax = .5; c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      const y = 1 - 2 * (i + .5) / N, rr = Math.sqrt(1 - y * y), a = i * 2.39996; const X = Math.cos(a) * rr, Y = y, Z = Math.sin(a) * rr;
      const x2 = X * Math.cos(ay) + Z * Math.sin(ay), z2 = -X * Math.sin(ay) + Z * Math.cos(ay), y3 = Y * Math.cos(ax) - z2 * Math.sin(ax), z3 = Y * Math.sin(ax) + z2 * Math.cos(ax);
      const al = z3 > 0 ? .25 + .6 * z3 : .06; c.fillStyle = `rgba(${90 + z3 * 120 | 0},${160 + z3 * 80 | 0},255,${al})`;
      c.fillRect(w * .58 + x2 * R, h * .5 - y3 * R, 2.2, 2.2);
    }
    c.lineWidth = 1.6;
    for (let k = 0; k < 8; k++) { const a0 = r() * 6.28, a1 = r() * 6.28; c.strokeStyle = 'rgba(98,216,255,.5)'; c.beginPath(); c.moveTo(w * .58 + Math.cos(a0) * R * .9, h * .5 + Math.sin(a0) * R * .9); c.quadraticCurveTo(w * .58, h * .5, w * .58 + Math.cos(a1) * R * .9, h * .5 + Math.sin(a1) * R * .9); c.stroke(); }
  } else {
    c.fillStyle = '#040a24'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 150; i++) for (let j = 0; j < 100; j++) {
      const u = i / 150 - .5, v = j / 100; const z = 1 + v * 2.6; const hgt = Math.sin(u * 9 + v * 6) * .22 + Math.sin(u * 17 - v * 4) * .1;
      const px = w * .5 + u * w * 1.65 / z, py = h * .3 + (1.3 + hgt) * h * .54 / z - 20;
      const t = (hgt + .3) / .6; c.fillStyle = `rgba(${40 + t * 70 | 0},${110 + t * 130 | 0},255,${.25 + .5 * (1 - v) + t * .2})`; c.fillRect(px, py, 2.4 / z + .8, 2.4 / z + .8);
    }
  }
}
document.querySelectorAll('canvas[data-poster]').forEach(cv => paintPoster(cv, +cv.dataset.poster));
