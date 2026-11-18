(function () {
  'use strict';
  const B = window.BITGO;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const E = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const arrow = '<svg class="arr" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M10.5 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const LOGO = '../shared/assets/bitgo-logo.svg';

  /* ---------------- NAV ---------------- */
  $('#skip').textContent = B.skip;
  function menuHTML() {
    return B.menus.map(m => `<div class="mi"><button class="mb" aria-haspopup="true" aria-expanded="false">${E(m.label)}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="panel"><div class="panel-in">${m.groups.map(g => `<div class="pg"><h3>${E(g.title)}</h3><ul class="${g.items.length > 10 ? 'two' : ''}">${g.items.map(i => `<li><a href="${i.href}">${E(i.label)}</a></li>`).join('')}</ul></div>`).join('')}</div></div></div>`).join('');
  }
  const NA = B.navActions;
  $('#nav').innerHTML = `<div class="nav-in">
    <a class="logo" href="#top" aria-label="BitGo"><img src="${LOGO}" alt="BitGo"></a>
    <nav class="menus" aria-label="Primary">${menuHTML()}</nav>
    <div class="acts"><button class="lang" type="button">${E(NA.language)}</button><a class="tl" href="${NA.signup.href}">${E(NA.signup.label)}</a><a class="tl" href="${NA.login.href}">${E(NA.login.label)}</a><a class="btn sm" href="${B.BITGO}/contact-us/">${E(NA.connect)}</a></div>
    <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i></button>
  </div>
  <div class="mob">${B.menus.map(m => `<details><summary>${E(m.label)}</summary>${m.groups.map(g => `<h3>${E(g.title)}</h3><ul>${g.items.map(i => `<li><a href="${i.href}">${E(i.label)}</a></li>`).join('')}</ul>`).join('')}</details>`).join('')}
    <div class="mob-acts"><a class="btn" href="${B.BITGO}/contact-us/">${E(NA.connect)}</a><a class="tl" href="${NA.signup.href}">${E(NA.signup.label)}</a><a class="tl" href="${NA.login.href}">${E(NA.login.label)}</a></div></div>`;
  const nav = $('#nav');
  $$('.mi').forEach(mi => {
    const b = $('.mb', mi);
    b.addEventListener('click', () => { const o = mi.classList.toggle('open'); b.setAttribute('aria-expanded', o); $$('.mi').forEach(x => { if (x !== mi) { x.classList.remove('open'); $('.mb', x).setAttribute('aria-expanded', 'false'); } }); });
    mi.addEventListener('mouseenter', () => b.setAttribute('aria-expanded', 'true'));
    mi.addEventListener('mouseleave', () => { b.setAttribute('aria-expanded', mi.classList.contains('open')); });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.mi')) $$('.mi.open').forEach(x => x.classList.remove('open')); });
  $('.burger').addEventListener('click', e => { const o = nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });

  /* ---------------- HERO ---------------- */
  const H = B.hero;
  const VERBS = ['Hold', 'Trade', 'Move', 'Earn', 'Issue', 'Build'];
  const PHASES = [
    { word: H.words[0], verbs: [0], lines: ['Qualified custody and self-custody.', 'Hot and cold wallets.', 'MPC, multisig and policies.'] },
    { word: H.words[1], verbs: [1, 2, 3], lines: ['Prime, electronic and OTC trading. Financing and collateral management.', 'Settlement and the Go Network.', 'Staking, restaking and DeFi.'] },
    { word: H.words[2], verbs: [4, 5], lines: ['Stablecoins, tokenization and real-world assets.', 'The platform, Crypto-as-a-Service and Express.', 'REST API, JavaScript SDK, WebSocket and FIX.'] }
  ];
  const RANGES = [[0.2, 0.4], [0.4, 0.6], [0.6, 1.0]];
  $('#hero').innerHTML = `<div class="hero-track" id="heroTrack"><div class="hero-stage" id="stage">
    <div class="hero-fallback"></div><canvas id="terrain" aria-hidden="true"></canvas>
    <div class="hero-head" id="heroHead"><h1><span class="rot" id="rot">${H.words.map((w, i) => `<span class="rw${i === 0 ? ' on' : ''}">${E(w)}</span>`).join('')}</span><span class="h1rest">${E(H.rest)}</span></h1>
      <div class="hero-cta"><a class="btn lg" href="${B.BITGO}/contact-us/">${E(H.cta)}</a><a class="btn lg ghost" href="${NA.signup.href}">${E(NA.signup.label)}</a></div></div>
    <div class="win" id="win">
      <div class="win-bar" id="winBar"><i></i><i></i><i></i><span>bitgo.com</span></div>
      <div class="win-body">
        <aside class="rail" aria-hidden="true">${VERBS.map((v, i) => `<div class="rvb" data-v="${i}"><b></b>${v}</div>`).join('')}</aside>
        <div class="win-main" id="winMain">
          <canvas id="wf" aria-hidden="true"></canvas>
          <p class="idle" id="idle"><span id="idleT"></span><u class="caret"></u></p>
          ${PHASES.map((ph, i) => `<div class="ph" data-i="${i}"><div class="pw" aria-label="${ph.word}"><span class="pwt">${ph.word}</span><u class="caret"></u></div><div class="pl">${ph.lines.map(l => `<p class="ln">${E(l)}</p>`).join('')}</div></div>`).join('')}
          <ol class="steps" id="steps">${H.words.map(w => `<li><span>${E(w)}</span><i></i></li>`).join('')}</ol>
        </div>
      </div>
    </div></div></div>`;
  const track = $('#heroTrack'), stage = $('#stage'), win = $('#win'), head = $('#heroHead'), winBar = $('#winBar');
  const phEls = $$('.ph'), rv = $$('.rvb'), stepEls = $$('#steps li'), idle = $('#idle');
  const canvasT = $('#terrain');
  const sub = H.sub;
  let idleN = 0;
  function typeIdle() { if (idleN <= sub.length) { $('#idleT').textContent = sub.slice(0, idleN++); setTimeout(typeIdle, 42); } }
  setTimeout(typeIdle, 500);
  // rotating word
  const rws = $$('.rw'); let ri = 0;
  if (!reduced) setInterval(() => { rws[ri].classList.remove('on'); rws[ri].classList.add('out'); const o = rws[ri]; setTimeout(() => o.classList.remove('out'), 700); ri = (ri + 1) % rws.length; rws[ri].classList.add('on'); }, 2300);

  let gl = null;
  try { gl = reduced ? null : window.BitGoTerrain.init(canvasT); } catch (e) { gl = null; }
  if (!gl) canvasT.style.display = 'none'; else stage.classList.add('gl');
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = 0.5 - e.clientY / innerHeight; }, { passive: true });
  let winOnce = false, lastW = 0, curPh = -1, heroVis = true, glFull = false, lastGL = 0;
  let headBottom = 300, navH = 72;
  function measure() { navH = nav.offsetHeight; const r = head.getBoundingClientRect(); headBottom = r.bottom - stage.getBoundingClientRect().top; }
  measure();
  addEventListener('resize', () => { measure(); });
  document.fonts && document.fonts.ready.then(measure);
  const mixc = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
  let heroP = 0;
  function heroUpdate(p) {
    const vw = innerWidth, vh = innerHeight;
    const g = ease(clamp(p / 0.2));
    const pad = Math.max(14, vw * 0.04);
    const startTop = Math.min(headBottom + 26, vh * 0.66);
    const top = lerp(startTop, navH, g), side = lerp(pad, 0, g), bot = lerp(Math.max(14, pad * 0.7), 0, g);
    win.style.cssText = `top:${top}px;left:${side}px;right:${side}px;bottom:${bot}px;border-radius:${lerp(18, 0, g)}px;background-color:rgba(${mixc([6, 14, 44, 0.8], [22, 71, 219, 1], g).map((v, i) => i < 3 ? Math.round(v) : v.toFixed(3)).join(',')})`;
    win.style.setProperty('--g', g.toFixed(3));
    win.style.backdropFilter = win.style.webkitBackdropFilter = g > 0.25 ? 'none' : 'blur(14px)';
    winBar.style.height = lerp(46, 0, clamp(g * 1.6 - 0.2)) + 'px';
    winBar.style.opacity = 1 - clamp(g * 1.5 - 0.1);
    head.style.opacity = 1 - clamp(p / 0.1); head.style.transform = `translateY(${-g * 80}px)`; head.style.pointerEvents = p > 0.06 ? 'none' : '';
    idle.style.opacity = 1 - clamp((p - 0.03) / 0.1);
    idle.style.filter = `blur(${clamp((p - 0.03) / 0.1) * 12}px)`;
    let activeV = new Set(), activeP = -1;
    phEls.forEach((el, i) => {
      const [a, b] = RANGES[i]; const t = (p - a) / (b - a);
      const on = t >= 0 && (t <= 1 || i === 2);
      el.style.visibility = on ? 'visible' : 'hidden';
      if (!on) return;
      activeP = i; PHASES[i].verbs.forEach(v => activeV.add(v));
      const word = PHASES[i].word; const k = Math.floor(clamp(t / 0.26) * word.length + 0.001);
      $('.pwt', el).textContent = word.slice(0, k);
      $('.pw .caret', el).style.opacity = (k < word.length || Math.floor(performance.now() / 500) % 2 === 0) ? 1 : 0;
      $$('.ln', el).forEach((ln, j) => { const s = clamp((t - (0.3 + j * 0.09)) / 0.16); ln.style.opacity = s; ln.style.filter = `blur(${(1 - s) * 16}px)`; ln.style.transform = `translateY(${(1 - s) * 16}px)`; });
      const ex = i === 2 ? 0 : clamp((t - 0.86) / 0.14);
      el.style.opacity = 1 - ex; el.style.filter = `blur(${ex * 14}px)`; el.style.transform = `translateY(${-ex * 26}px)`;
    });
    rv.forEach((el, i) => el.classList.toggle('on', activeV.has(i)));
    stepEls.forEach((el, i) => { const [a, b] = RANGES[i]; const t = clamp((p - a) / (b - a)); $('i', el).style.transform = `scaleX(${i === 2 ? clamp((p - a) / 0.2) : t})`; el.classList.toggle('on', activeP === i); });
    glFull = g > 0.995; curPh = activeP;
  }

  /* ---------------- TRUST ---------------- */
  const T = B.trust;
  const spots = [[10, 6], [36, 14], [62, 4], [86, 12], [22, 34], [50, 40], [76, 33], [8, 58], [34, 64], [62, 60], [88, 56], [22, 84], [50, 88], [78, 82]];
  $('#trust').innerHTML = `<div class="wrap trust-in"><h2 class="t-h">${E(T.title)}</h2>
    <div class="cloud" id="cloud">${T.logos.map((src, i) => { const d = [0.55, 1, 0.75, 1.25, 0.9, 0.6, 1.1, 0.8, 1.3, 0.65, 1, 0.7, 1.2, 0.85][i]; return `<div class="lgo" data-r="${d}" style="--x:${spots[i][0]}%;--y:${spots[i][1]}%;--s:${(0.78 + d * 0.28).toFixed(2)};--o:${(0.55 + d * 0.3).toFixed(2)}"><img src="${src}" alt="" loading="lazy"></div>`; }).join('')}</div></div>`;

  /* ---------------- BADGES ---------------- */
  const bl = B.badges.map(b => b.label);
  const strip = n => Array.from({ length: n }, () => bl.map(l => `<span class="bt">${E(l)}</span><span class="bd"></span>`).join('')).join('');
  $('#badges').innerHTML = `<div class="b-row r1"><div class="b-in" id="b1">${strip(5)}</div></div><div class="b-row r2" aria-hidden="true"><div class="b-in" id="b2">${strip(5)}</div></div>`;

  /* ---------------- CORE ---------------- */
  const C = B.core;
  const cardPos = [[-0.45, -0.10], [0.45, 0.12], [-0.44, 0.14], [0.46, -0.14], [-0.45, 0.02]];
  const chipPos = [[-0.27, -0.32], [0.25, 0.36], [-0.40, 0.22], [0.38, -0.30], [-0.12, 0.42], [0.15, -0.42]];
  $('#core').innerHTML = `<div class="core-track" id="coreTrack"><div class="core-stage" id="coreStage">
    <div class="core-glow"></div>
    <h2 class="core-s" id="coreS">${C.title.map(E).join(' ')}</h2>
    ${C.items.map((it, i) => `<article class="fi card" data-k="c" data-i="${i}"><h3>${E(it.title)}</h3><p class="sh">${E(it.short)}</p><p class="lo">${E(it.long)}</p><a class="more" href="${it.cta.href}">${E(it.cta.label)}${arrow}</a></article>`).join('')}
    ${VERBS.map((v, i) => `<div class="fi chip" data-k="p" data-i="${i}" aria-hidden="true">${v}</div>`).join('')}
    ${Array.from({ length: 46 }, (_, i) => `<i class="fi dust" data-k="d" data-i="${i}" aria-hidden="true"></i>`).join('')}
  </div></div>`;
  const coreTrack = $('#coreTrack'), coreStage = $('#coreStage'), coreS = $('#coreS');
  const fi = $$('.fi', coreStage).map(el => {
    const i = +el.dataset.i, card = el.dataset.k === 'c';
    if (el.dataset.k === 'd') { const r = rng(300 + i); const s = 3 + r() * 7; el.style.width = el.style.height = s + 'px'; return { el, card: false, dust: true, x: (r() - 0.5) * 1.5, y: (r() - 0.5) * 1.1, z: r() * 4600, ph: r() * 6 }; }
    return { el, card, x: (card ? cardPos[i] : chipPos[i])[0], y: (card ? cardPos[i] : chipPos[i])[1], z: card ? 620 + i * 940 : 240 + i * 800 + (i % 2) * 260, ph: i * 1.7 };
  });
  const ZTOT = 4750;
  let coreS_s = 0, flyOn = false;
  function setFly() { flyOn = !reduced && innerWidth >= 900; coreStage.classList.toggle('flat', !flyOn); if (!flyOn) { fi.forEach(f => { f.el.style.cssText = ''; }); coreS.style.cssText = ''; } }
  setFly(); addEventListener('resize', setFly);
  function coreUpdate(now) {
    if (!flyOn) return;
    const r = coreTrack.getBoundingClientRect();
    if (r.bottom < -100 || r.top > innerHeight + 100) return;
    const total = r.height - innerHeight; const s = clamp(-r.top / total);
    coreS_s += (s - coreS_s) * 0.16;
    const cz = coreS_s * ZTOT, w = coreStage.clientWidth, h = coreStage.clientHeight;
    for (const f of fi) {
      const d = f.z - cz;
      let op = clamp((2800 - d) / 700) * clamp((d - 70) / 300); if (f.dust) op *= 0.7;
      const blur = f.dust ? 0 : clamp((d - 1500) / 1500) * 7 + clamp((260 - d) / 260) * 8;
      const wob = Math.sin(now * 0.0007 + f.ph) * 10;
      f.el.style.transform = `translate(-50%,-50%) translate3d(${f.x * w}px,${f.y * h + wob}px,${-d}px)`;
      f.el.style.opacity = op.toFixed(3);
      f.el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none';
      f.el.style.zIndex = d < 1100 ? 12 : 1;
      f.el.style.pointerEvents = (!f.dust && op > 0.7) ? 'auto' : 'none';
      f.el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
    }
    const fade = clamp((coreS_s - 0.9) / 0.1);
    coreS.style.transform = `translate(-50%,-50%) scale(${1 + coreS_s * 0.1 + fade * 0.2})`;
    coreS.style.opacity = 1 - fade * 0.85;
  }

  /* ---------------- ESTABLISHED ---------------- */
  const X = B.established;
  $('#established').innerHTML = `<div class="grain"></div><div class="wrap est-in"><div class="est-copy"><h2>${E(X.title)}</h2><p>${E(X.text)}</p><a class="btn lg light" href="${X.cta.href}">${E(X.cta.label)}</a></div>
    <ul class="tiles">${X.logos.map((l, i) => `<li class="tile${l.text ? ' has' : ''}" ${l.text ? 'tabindex="0"' : ''}><img src="${l.image}" alt="${E(l.name)}" loading="lazy">${l.text ? `<div class="tx"><p>${E(l.text)}</p><a href="${l.href}">${E(l.name)}${arrow}</a></div>` : ''}</li>`).join('')}</ul></div>`;

  /* ---------------- BUILD ---------------- */
  const BD = B.build;
  $('#build').innerHTML = `<div class="wrap"><h2 class="b-h">${E(BD.title)}</h2>
    ${BD.cards.map((c, i) => `<article class="prod p${i}"><div class="pcopy"><h3>${E(c.label)}</h3><p>${E(c.text)}</p><a class="more" href="${c.cta.href}">${E(c.cta.label)}${arrow}</a></div>
      <div class="pwin"><div class="pbar"><i></i><i></i><i></i><span>${E(c.label)}</span></div><canvas class="pc" data-k="${i}" aria-hidden="true"></canvas></div></article>`).join('')}</div>`;

  /* ---------------- SUPPORT ---------------- */
  const S = B.support;
  const sl = S.label.split(' ');
  $('#support').innerHTML = `<div class="wrap sup-in"><div class="sup-copy"><h2>${E(S.title)}</h2><ul class="sup-list">${S.items.map(t => `<li>${E(t)}</li>`).join('')}</ul></div>
    <div class="ring-wrap"><canvas id="ring" aria-hidden="true"></canvas><div class="ring-c"><b>${E(sl[0])}</b><span>${E(sl.slice(1).join(' '))}</span></div></div></div>`;

  /* ---------------- OWN ---------------- */
  const O = B.own;
  $('#own').innerHTML = `<div class="own-in"><div class="own-bg"><canvas id="flow" aria-hidden="true"></canvas></div><div class="own-left"><h2>${E(O.title)}</h2></div>
    <ol class="own-list">${O.items.map((it, i) => `<li class="oi${i === 0 ? ' on' : ''}"><h3>${E(it.title)}</h3><p>${E(it.text)}</p></li>`).join('')}</ol></div>`;

  /* ---------------- SPOTLIGHT ---------------- */
  const SP = B.spotlight;
  $('#spot').innerHTML = `<div class="wrap"><div class="sp-head"><h2>${E(SP.label)}</h2><div class="sp-nav"><button type="button" aria-label="Previous" data-d="-1">${arrow}</button><button type="button" aria-label="Next" data-d="1">${arrow}</button></div></div></div>
    <div class="sp-row" id="spRow">${SP.slides.map((s, i) => `<a class="sp-card" href="${s.video}" target="_blank" rel="noopener"><div class="sp-frame"><canvas class="poster" data-k="${i}" width="960" height="540" aria-hidden="true"></canvas><span class="play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span></div><h3>${E(s.title)}</h3></a>`).join('')}</div>`;
  $$('.sp-nav button').forEach(b => b.addEventListener('click', () => { const r = $('#spRow'); r.scrollBy({ left: +b.dataset.d * Math.min(r.clientWidth * 0.7, 900), behavior: 'smooth' }); }));

  /* ---------------- LATEST ---------------- */
  const L = B.latest;
  $('#latest').innerHTML = `<div class="wrap"><div class="la-head"><h2>${E(L.title)}</h2><a class="btn lg ghost" href="${L.all.href}">${E(L.all.label)}</a></div>
    <ul class="posts">${L.posts.map(p => `<li><a href="${p.href}"><span class="pt">${E(p.title)}</span>${arrow}</a></li>`).join('')}</ul></div>`;

  /* ---------------- CTA ---------------- */
  const CT = B.cta;
  $('#cta').innerHTML = `<div class="ridges" id="ridges" aria-hidden="true">${[0, 1, 2, 3, 4].map(i => `<canvas data-i="${i}"></canvas>`).join('')}</div>
    <div class="wrap cta-in"><h2>${CT.title.map(E).join('<br>')}</h2><a class="btn xl light" href="${B.BITGO}/contact-us/">${E(CT.button)}</a></div>`;

  /* ---------------- FOOTER ---------------- */
  const F = B.footer;
  const cols = []; B.menus.forEach(m => m.groups.forEach(g => { if (['Wallet Services', 'Financial Services', 'Protocol Solutions', 'Infrastructure', 'By Segment', 'Essentials', 'Discover'].includes(g.title)) cols.push(g); }));
  $('#foot').innerHTML = `<div class="wrap">
    <div class="f-top"><div class="f-brand"><img src="${LOGO}" alt="BitGo"><p>${E(F.newsletter)}</p>
      <form class="nl" onsubmit="return false"><input type="email" placeholder="${E(F.email)}" aria-label="${E(F.email)}"><button class="btn" type="submit">${E(F.subscribe)}</button></form>
      <ul class="soc">${F.socials.map(s => `<li><a href="${s.href}">${E(s.label)}</a></li>`).join('')}</ul></div>
      <div class="f-cols">${cols.map(g => `<div><h4>${E(g.title)}</h4><ul>${g.items.slice(0, 8).map(i => `<li><a href="${i.href}">${E(i.label)}</a></li>`).join('')}</ul></div>`).join('')}</div></div>
    <div class="legal">${F.legal.map(t => `<p>${E(t)}</p>`).join('')}<p>${E(F.complaints)}</p><p>${E(F.screenReader)}</p>
      <p>${E(F.review)} <a href="${F.privacy.href}">${E(F.privacy.label)}</a> ${E(F.and)} <a href="${F.disclaimers.href}">${E(F.disclaimers.label)}</a>. ${E(F.nmls)}. <a href="${F.privacy.href}">${E(F.choices)}</a>. ${E(F.rights)}</p></div></div>`;

  /* ---------------- CANVAS HELPERS ---------------- */
  function fit(c) {
    const w = c.clientWidth, h = c.clientHeight; if (!w || !h) return false;
    const d = Math.min(DPR, 1.5); const W = Math.round(w * d), Hh = Math.round(h * d);
    if (c.width !== W || c.height !== Hh) { c.width = W; c.height = Hh; }
    return d;
  }
  const vis = new Map(); const once = new WeakSet();
  const want = c => { if (!vis.get(c)) return false; if (!reduced) return true; if (once.has(c)) return false; once.add(c); return true; };
  const io = new IntersectionObserver(es => es.forEach(e => vis.set(e.target, e.isIntersecting)), { rootMargin: '120px' });

  /* --- product canvases --- */
  const pcs = $$('.pc'); pcs.forEach(c => io.observe(c));
  const acc = { tr: [], next: 0, rows: [0.62, 0.35, 0.8, 0.5, 0.28], tgt: [0.62, 0.35, 0.8, 0.5, 0.28] };
  const tint = ['#7fa1ff', '#c9d7ff', '#4f7dff', '#a7c0ff', '#e8eeff'];
  function rrect(x, c, y, w, h, r) { x.beginPath(); x.moveTo(c + r, y); x.arcTo(c + w, y, c + w, y + h, r); x.arcTo(c + w, y + h, c, y + h, r); x.arcTo(c, y + h, c, y, r); x.arcTo(c, y, c + w, y, r); x.closePath(); }
  function drawAccounts(c, t, ctx) {
    const W = c.width, Hh = c.height, u = Hh / 560;
    ctx.fillStyle = '#060d2e'; ctx.fillRect(0, 0, W, Hh);
    const g = ctx.createRadialGradient(W * 0.8, 0, 0, W * 0.8, 0, W * 0.8); g.addColorStop(0, 'rgba(22,71,219,.45)'); g.addColorStop(1, 'rgba(22,71,219,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
    const n = 5, pad = 40 * u, rh = (Hh - pad * 2) / n, gap = 14 * u;
    if (t > acc.next) { const a = Math.floor(Math.random() * n); let b = Math.floor(Math.random() * n); if (b === a) b = (b + 1) % n; acc.tr.push({ a, b, t0: t, dur: 1.6 }); acc.next = t + 1.5; const amt = 0.12 + Math.random() * 0.12; acc.tgt[a] = clamp(acc.tgt[a] - amt, 0.12, 1); acc.tgt[b] = clamp(acc.tgt[b] + amt, 0.12, 1); }
    for (let i = 0; i < n; i++) acc.rows[i] += (acc.tgt[i] - acc.rows[i]) * 0.02;
    const bx = W * 0.24, bw = W * 0.5;
    for (let i = 0; i < n; i++) {
      const y = pad + i * rh;
      ctx.fillStyle = 'rgba(255,255,255,.045)'; rrect(ctx, pad, y, W - pad * 2, rh - gap, 16 * u); ctx.fill();
      ctx.fillStyle = tint[i]; ctx.beginPath(); ctx.arc(pad + 38 * u, y + (rh - gap) / 2, 17 * u, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(6,13,46,.55)'; ctx.beginPath(); ctx.arc(pad + 38 * u, y + (rh - gap) / 2, 7 * u, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.08)'; rrect(ctx, bx, y + (rh - gap) / 2 - 7 * u, bw, 14 * u, 7 * u); ctx.fill();
      ctx.fillStyle = '#1647DB'; rrect(ctx, bx, y + (rh - gap) / 2 - 7 * u, Math.max(14 * u, bw * acc.rows[i]), 14 * u, 7 * u); ctx.fill();
      ctx.fillStyle = 'rgba(232,238,255,.9)'; rrect(ctx, bx, y + (rh - gap) / 2 - 7 * u, Math.max(14 * u, bw * acc.rows[i]) * 0.35, 14 * u, 7 * u); ctx.fill();
      [0, 1, 2, 3].forEach(k => { ctx.fillStyle = k === 0 ? 'rgba(22,71,219,.9)' : 'rgba(255,255,255,.12)'; rrect(ctx, W - pad - (4 - k) * 58 * u - 16 * u, y + (rh - gap) / 2 - 11 * u, 48 * u, 22 * u, 11 * u); ctx.fill(); });
    }
    acc.tr = acc.tr.filter(o => t - o.t0 < o.dur);
    acc.tr.forEach(o => {
      const k = ease(clamp((t - o.t0) / o.dur)); const ya = pad + o.a * rh + (rh - gap) / 2, yb = pad + o.b * rh + (rh - gap) / 2;
      const x0 = bx + bw * 0.5, x1 = W - pad - 120 * u; const mx = lerp(x0, x1, k) + Math.sin(k * Math.PI) * 60 * u; const my = lerp(ya, yb, k);
      const gl2 = ctx.createRadialGradient(mx, my, 0, mx, my, 30 * u); gl2.addColorStop(0, 'rgba(201,215,255,.95)'); gl2.addColorStop(1, 'rgba(22,71,219,0)'); ctx.fillStyle = gl2; ctx.beginPath(); ctx.arc(mx, my, 30 * u, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx, my, 6 * u, 0, 7); ctx.fill();
    });
  }
  function drawStaking(c, t, ctx) {
    const W = c.width, Hh = c.height, u = Hh / 560;
    const bg = ctx.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#040a28'); bg.addColorStop(1, '#0a1c6b'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, Hh);
    const N = 44, pad = 36 * u, bw = (W - pad * 2) / N, floor = Hh - 40 * u; const tops = [];
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1), curve = 0.1 + 0.66 * Math.pow(x, 1.7), pulse = 0.05 * Math.sin(t * 1.1 - x * 9) * (0.4 + x);
      const h = (curve + pulse) * (floor - 30 * u), px = pad + i * bw, y = floor - h; tops.push([px + bw * 0.4, y]);
      const g = ctx.createLinearGradient(0, y, 0, floor); g.addColorStop(0, 'rgba(120,160,255,.95)'); g.addColorStop(0.25, 'rgba(22,71,219,.9)'); g.addColorStop(1, 'rgba(22,71,219,.12)');
      ctx.fillStyle = g; rrect(ctx, px, y, bw * 0.8, h, Math.min(bw * 0.4, 8 * u)); ctx.fill();
      ctx.fillStyle = 'rgba(232,238,255,.95)'; rrect(ctx, px, y, bw * 0.8, 3.5 * u, 2 * u); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(232,238,255,.55)'; ctx.lineWidth = 1.6 * u; ctx.beginPath(); tops.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] - 14 * u) : ctx.moveTo(p[0], p[1] - 14 * u)); ctx.stroke();
    const r = rng(7);
    for (let i = 0; i < 46; i++) { const k = (r() * (N - 4) + 2) | 0, sp = 0.12 + r() * 0.2, ph = r(); const f = (t * sp + ph) % 1; const tp = tops[k]; const yy = tp[1] - f * Hh * 0.45; ctx.fillStyle = `rgba(232,238,255,${Math.sin(f * Math.PI) * 0.85})`; ctx.beginPath(); ctx.arc(tp[0] + Math.sin(t * 2 + i) * 5 * u, yy, (1.2 + r() * 1.8) * u, 0, 7); ctx.fill(); }
  }
  const net = (() => {
    const r = rng(21), nodes = []; while (nodes.length < 17) { const p = [0.07 + r() * 0.86, 0.1 + r() * 0.8]; if (nodes.every(q => Math.hypot((q[0] - p[0]) * 1.7, q[1] - p[1]) > 0.15)) nodes.push(p); }
    const edges = []; nodes.forEach((a, i) => { nodes.map((b, j) => [j, Math.hypot((a[0] - b[0]) * 1.7, a[1] - b[1])]).filter(o => o[0] !== i).sort((x, y) => x[1] - y[1]).slice(0, 3).forEach(o => { if (!edges.some(e => (e[0] === i && e[1] === o[0]) || (e[1] === i && e[0] === o[0]))) edges.push([i, o[0]]); }); });
    return { nodes, edges, pk: Array.from({ length: 16 }, (_, i) => ({ e: i % edges.length, k: r(), dir: r() < 0.5 ? 1 : -1, sp: 0.18 + r() * 0.22 })), fl: new Array(nodes.length).fill(0), last: 0 };
  })();
  function drawNetwork(c, t, ctx) {
    const W = c.width, Hh = c.height, u = Hh / 560; const dt = clamp(t - net.last, 0, 0.1); net.last = t;
    const bg = ctx.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, W * 0.7); bg.addColorStop(0, '#0c2a9e'); bg.addColorStop(1, '#040a26'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, Hh);
    const P = n => [net.nodes[n][0] * W, net.nodes[n][1] * Hh];
    ctx.lineWidth = 1.3 * u; ctx.strokeStyle = 'rgba(127,161,255,.28)';
    net.edges.forEach(e => { const a = P(e[0]), b = P(e[1]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });
    net.pk.forEach(p => {
      p.k += p.sp * dt * p.dir; const e = net.edges[p.e];
      if (p.k > 1 || p.k < 0) { const arr = p.k > 1 ? e[1] : e[0]; net.fl[arr] = 1; const opts = net.edges.map((x, i) => [x, i]).filter(o => o[0][0] === arr || o[0][1] === arr); const pick = opts[(Math.random() * opts.length) | 0]; p.e = pick[1]; p.dir = pick[0][0] === arr ? 1 : -1; p.k = p.dir === 1 ? 0 : 1; }
      const a = P(net.edges[p.e][0]), b = P(net.edges[p.e][1]); const x = lerp(a[0], b[0], p.k), y = lerp(a[1], b[1], p.k);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 22 * u); g.addColorStop(0, 'rgba(232,238,255,.9)'); g.addColorStop(1, 'rgba(127,161,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 22 * u, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3.4 * u, 0, 7); ctx.fill();
    });
    net.nodes.forEach((n, i) => {
      const [x, y] = P(i); net.fl[i] = Math.max(0, net.fl[i] - dt * 1.6); const hub = i % 5 === 0; const r0 = (hub ? 13 : 8) * u;
      ctx.fillStyle = '#071146'; ctx.beginPath(); ctx.arc(x, y, r0 + 3 * u, 0, 7); ctx.fill();
      ctx.lineWidth = 2 * u; ctx.strokeStyle = `rgba(${127 + net.fl[i] * 100 | 0},${161 + net.fl[i] * 70 | 0},255,${0.7 + net.fl[i] * 0.3})`; ctx.beginPath(); ctx.arc(x, y, r0 + net.fl[i] * 7 * u, 0, 7); ctx.stroke();
      if (hub) { ctx.fillStyle = '#1647DB'; ctx.beginPath(); ctx.arc(x, y, r0 * 0.55, 0, 7); ctx.fill(); }
    });
  }
  const prodDraw = [drawAccounts, drawStaking, drawNetwork];
  const pctx = pcs.map(c => c.getContext('2d'));

  /* --- window ridgelines (echo of the terrain, drawn in the platform window) --- */
  const wf = $('#wf'), wctx = wf.getContext('2d');
  function drawWin(t, g, ph) {
    const d = fit(wf); if (!d) return; const W = wf.width, Hh = wf.height, ctx = wctx; ctx.clearRect(0, 0, W, Hh);
    if (g < 0.02) return; ctx.globalAlpha = clamp(g * 1.6);
    const bg = mixc([6, 14, 44], [22, 71, 219], g).map(Math.round); const fillc = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
    const n = 30, mul = 1 + Math.max(0, ph) * 0.3, bx = ((t * 0.07) % 1.5) - 0.25;
    for (let k = 0; k < n; k++) {
      const f = k / (n - 1), y0 = Hh * (0.34 + 0.86 * f), amp = Hh * (0.03 + 0.1 * f) * mul;
      ctx.beginPath(); ctx.moveTo(0, Hh + 4);
      for (let x = 0; x <= W + 12; x += 12) {
        const u = x / W, a = u * 3.4 + k * 0.045;
        const r = Math.sin(a * 2 + t * 0.22 + k * 0.1) + 0.6 * Math.sin(a * 5.1 - t * 0.4 + k * 0.2) + 0.3 * Math.sin(a * 11 + t * 0.6);
        const bump = Math.exp(-Math.pow((u - bx) * 5, 2)) * Hh * 0.09 * (0.4 + f);
        ctx.lineTo(x, y0 - amp * r * 0.6 - bump);
      }
      ctx.lineTo(W + 12, Hh + 4); ctx.closePath(); ctx.fillStyle = fillc; ctx.fill();
      ctx.strokeStyle = `rgba(${170 + f * 60 | 0},${196 + f * 40 | 0},255,${0.07 + 0.55 * f * f})`; ctx.lineWidth = (1 + f * 1.4) * d; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* --- support ring: 168 bars = 7 days x 24 hours, projected on a tilted plane --- */
  const ring = $('#ring'); io.observe(ring); const rctx = ring.getContext('2d');
  const ringNoise = rng(5); const rn = Array.from({ length: 168 }, () => [ringNoise() * 6.28, 0.3 + ringNoise() * 0.9, ringNoise()]);
  function drawRing(t) {
    const d = fit(ring); if (!d) return; const W = ring.width, Hh = ring.height, ctx = rctx; ctx.clearRect(0, 0, W, Hh);
    const cx = W * 0.5, cy = Hh * 0.66, R = Math.min(W * 0.47, Hh * 0.92), tilt = 0.34;
    const gl3 = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.1); gl3.addColorStop(0, 'rgba(22,71,219,.55)'); gl3.addColorStop(0.6, 'rgba(22,71,219,.12)'); gl3.addColorStop(1, 'rgba(22,71,219,0)');
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, tilt * 1.6); ctx.translate(-cx, -cy); ctx.fillStyle = gl3; ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, 7); ctx.fill(); ctx.restore();
    const now = new Date(); const cur = ((now.getDay() + 6) % 7) * 24 + now.getHours() + now.getMinutes() / 60;
    const sweep = t * 0.5; const bars = [];
    for (let i = 0; i < 168; i++) {
      const a = i / 168 * 6.2832 - 1.5708 + t * 0.02; const x = Math.cos(a), z = Math.sin(a);
      let da = Math.abs(((a - sweep) % 6.2832 + 9.4248) % 6.2832 - 3.1416); const sw = Math.exp(-da * da * 6);
      const idl = 0.5 + 0.5 * Math.sin(t * rn[i][1] + rn[i][0]);
      const isCur = Math.abs(i - cur) < 0.5; const hgt = (0.1 + idl * 0.16 + sw * 0.5 + (isCur ? 0.45 : 0) + (i % 24 === 0 ? 0.12 : 0)) * R * 0.95;
      bars.push({ x, z, hgt: hgt * (0.62 + 0.38 * (z + 1) / 2), sw, isCur, big: i % 24 === 0 });
    }
    bars.sort((p, q) => p.z - q.z);
    for (const b of bars) {
      const sc = 0.78 + (b.z + 1) * 0.22; const sx = cx + b.x * R * sc, sy = cy + b.z * R * tilt * sc; const hh = b.hgt * sc;
      const al = 0.28 + (b.z + 1) * 0.3 + b.sw * 0.5;
      ctx.lineWidth = (b.big ? 3.2 : 2.2) * d * sc * (1 + b.sw * 0.5); ctx.lineCap = 'round';
      ctx.strokeStyle = b.isCur ? '#fff' : `rgba(${130 + b.sw * 110 | 0},${165 + b.sw * 80 | 0},255,${Math.min(al, 1)})`;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - hh); ctx.stroke();
      if (b.sw > 0.45 || b.isCur) { ctx.fillStyle = 'rgba(232,238,255,.9)'; ctx.beginPath(); ctx.arc(sx, sy - hh, 3 * d * sc, 0, 7); ctx.fill(); }
    }
  }

  /* --- own: flowing particle ribbons --- */
  const flow = $('#flow'); io.observe(flow); const fctx = flow.getContext('2d');
  const fr = rng(11); const parts = Array.from({ length: 4200 }, () => ({ r: (fr() * 7) | 0, s: fr(), v: 0.6 + fr() * 0.8, o: fr() * 2 - 1, z: 0.6 + fr() * 1.6 }));
  const fs = { f: 1.4, a: 0.12, sp: 0.04, hue: 0, i: -1 };
  const fT = [[1.2, 0.1, 0.035], [2.2, 0.14, 0.05], [3.4, 0.09, 0.08], [1.7, 0.2, 0.03], [2.8, 0.16, 0.06]];
  let lastF = 0;
  function drawFlow(t) {
    const d = fit(flow); if (!d) return; const W = flow.width, Hh = flow.height, ctx = fctx; const dt = clamp(t - lastF, 0, 0.1); lastF = t;
    const tg = fT[Math.max(0, fs.i)]; fs.f += (tg[0] - fs.f) * 0.03; fs.a += (tg[1] - fs.a) * 0.03; fs.sp += (tg[2] - fs.sp) * 0.03;
    ctx.clearRect(0, 0, W, Hh);
    for (const p of parts) {
      p.s += fs.sp * p.v * dt * 3; if (p.s > 1) p.s -= 1;
      const x = p.s * W * 1.1 - W * 0.05; const base = Hh * (0.3 + p.r * 0.095);
      const y = base + Math.sin(p.s * 6.28 * fs.f + p.r * 1.3 + t * 0.3) * Hh * fs.a + p.o * Hh * 0.008 * (1 + p.r * 0.2);
      const al = Math.sin(p.s * 3.1416) * (0.35 + p.z * 0.25);
      ctx.fillStyle = p.r % 3 === 0 ? `rgba(22,71,219,${al})` : p.r % 3 === 1 ? `rgba(8,24,110,${al * 0.8})` : `rgba(76,120,255,${al})`;
      ctx.fillRect(x, y, p.z * d * 1.5, p.z * d * 1.5);
    }
  }

  /* --- spotlight posters: grainy light fields (no landscape) --- */
  const palettes = [['#030a2c', '#1647DB', '#8fb0ff', '#e8eeff'], ['#0a0830', '#4a3ae0', '#b8a8ff', '#f3eeff'], ['#021630', '#0f7be0', '#7fe0ff', '#e6faff']];
  $$('.poster').forEach(c => {
    const k = +c.dataset.k, p = palettes[k % 3], ctx = c.getContext('2d'), W = c.width, Hh = c.height, r = rng(31 + k * 17);
    ctx.fillStyle = p[0]; ctx.fillRect(0, 0, W, Hh);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const x = W * (0.1 + r() * 0.8), y = Hh * (0.1 + r() * 0.8), rad = W * (0.25 + r() * 0.3); const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const col = i % 2 ? p[1] : p[2]; g.addColorStop(0, col + (i % 2 ? 'cc' : '88')); g.addColorStop(1, col + '00'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
    }
    const cx = W * (0.3 + r() * 0.4), cy = Hh * (0.35 + r() * 0.3);
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, Hh * 0.5); core.addColorStop(0, p[3]); core.addColorStop(0.12, p[2] + 'cc'); core.addColorStop(1, p[2] + '00'); ctx.fillStyle = core; ctx.fillRect(0, 0, W, Hh);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.5 + r());
    for (let i = 0; i < 6; i++) { const len = W * (0.5 + r() * 0.6), off = (r() - 0.5) * Hh * 0.35; const g = ctx.createLinearGradient(-len, 0, len, 0); g.addColorStop(0, p[3] + '00'); g.addColorStop(0.5, p[3] + '55'); g.addColorStop(1, p[3] + '00'); ctx.fillStyle = g; ctx.fillRect(-len, off, len * 2, 1 + r() * 3); }
    ctx.restore(); ctx.globalCompositeOperation = 'source-over';
    const vg = ctx.createRadialGradient(W / 2, Hh / 2, Hh * 0.3, W / 2, Hh / 2, W * 0.7); vg.addColorStop(0, 'rgba(2,6,30,0)'); vg.addColorStop(1, 'rgba(2,6,30,.65)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, Hh);
    const gr = rng(900 + k); const img = ctx.getImageData(0, 0, W, Hh), dd = img.data; for (let i = 0; i < dd.length; i += 4) { const n = (gr() - 0.5) * 30; dd[i] += n; dd[i + 1] += n; dd[i + 2] += n; } ctx.putImageData(img, 0, 0);
  });

  /* --- CTA ridges --- */
  const rcs = $$('#ridges canvas');
  function drawRidges() {
    rcs.forEach((c, i) => {
      const w = c.clientWidth, h = c.clientHeight; if (!w) return; c.width = w; c.height = h; const ctx = c.getContext('2d'), r = rng(90 + i * 13), f = i / (rcs.length - 1);
      const ph = r() * 9, base = h * (0.28 + f * 0.62), amp = h * (0.13 + f * 0.04);
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) { const n = Math.sin(x / w * (2.4 + i * 0.7) + ph) * amp + Math.sin(x / w * (7 + i * 2) + ph * 2) * amp * 0.38 + Math.abs(Math.sin(x / w * (15 + i * 3) + ph)) * amp * 0.22; ctx.lineTo(x, base - n); }
      ctx.lineTo(w, h); ctx.closePath();
      const g = ctx.createLinearGradient(0, base - amp * 1.6, 0, h); const a = [[232, 238, 255, 0.2], [157, 184, 255, 0.28], [60, 104, 238, 0.55], [14, 44, 160, 0.8], [4, 10, 40, 0.95]][i];
      g.addColorStop(0, `rgba(${a[0]},${a[1]},${a[2]},${a[3]})`); g.addColorStop(1, `rgba(${a[0] * 0.3 | 0},${a[1] * 0.3 | 0},${a[2] * 0.6 + 20 | 0},${Math.min(1, a[3] + 0.1)})`); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = `rgba(232,238,255,${0.5 - f * 0.4})`; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = 0; x <= w; x += 6) { const n = Math.sin(x / w * (2.4 + i * 0.7) + ph) * amp + Math.sin(x / w * (7 + i * 2) + ph * 2) * amp * 0.38 + Math.abs(Math.sin(x / w * (15 + i * 3) + ph)) * amp * 0.22; x ? ctx.lineTo(x, base - n) : ctx.moveTo(x, base - n); } ctx.stroke();
    });
  }
  drawRidges(); let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawRidges, 200); });

  /* ---------------- reveal on enter ---------------- */
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: 0.15 });
  $$('.tile, .prod .pcopy, .prod .pwin, .posts li, .sup-list li, .b-h, .t-h, .est-copy, .la-head, .sp-card, .cta-in').forEach(el => { el.classList.add('rv'); rio.observe(el); });

  const latestEl = $('#latest');
  latestEl.addEventListener('pointermove', e => { const r = latestEl.getBoundingClientRect(); latestEl.style.setProperty('--mx', (e.clientX - r.left) + 'px'); latestEl.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });

  /* ---------------- main loop ---------------- */
  const trust = $('#trust'), badges = $('#badges'), own = $('#own'), ownItems = $$('.oi'), b1 = $('#b1'), b2 = $('#b2'), cloudLg = $$('.lgo'), ridgesEl = $('#ridges'), cta = $('#cta');
  let scrollY = 0, hp = 0, startT = performance.now();
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  function rel(el) { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height)); }
  let lastNow = 0, avgDt = 16, glGap = 55;
  function frame(now) {
    const t = (now - startT) / 1000;
    if (lastNow) { avgDt += (Math.min(now - lastNow, 500) - avgDt) * 0.1; glGap = clamp(avgDt * 2.5, 55, 450); } lastNow = now;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    // hero
    const tr = track.getBoundingClientRect(); const hv = tr.bottom > 0 && tr.top < innerHeight; heroVis = hv;
    if (hv) {
      const target = clamp(-tr.top / (tr.height - innerHeight)); hp += (target - hp) * (reduced ? 1 : 0.2); if (Math.abs(target - hp) < 0.0005) hp = target;
      heroUpdate(reduced ? 1 : hp);
      if (reduced) { if (!winOnce) { winOnce = true; drawWin(2, 1, 2); } } else if (hp > 0.015 && (now - lastW > 40)) { lastW = now; drawWin(t, ease(clamp(hp / 0.2)), curPh); }
      if (gl && !glFull && now - lastGL > glGap) { lastGL = now; gl.draw(t, hp * 7, mouse.x, mouse.y); }
    }
    coreUpdate(now);
    // trust parallax
    const tp = rel(trust);
    if (!reduced && tp > 0 && tp < 1) cloudLg.forEach(l => { l.style.transform = `translate3d(0,${(0.5 - tp) * 260 * parseFloat(l.dataset.r)}px,0)`; });
    // badges marquee
    const bp = reduced ? 0.2 : rel(badges); b1.style.transform = `translate3d(${-bp * 2400}px,0,0)`; b2.style.transform = `translate3d(${-6000 + bp * 2400}px,0,0)`;
    // canvases
    pcs.forEach((c, i) => { if (want(c)) { if (fit(c)) prodDraw[i](c, reduced ? 6 : t, pctx[i]); } });
    if (want(ring)) drawRing(reduced ? 3 : t);
    if (want(flow)) {
      const mid = innerHeight * 0.5; let best = 0, bd = 1e9; ownItems.forEach((el, i) => { const r = el.getBoundingClientRect(); const dd = Math.abs(r.top + r.height / 2 - mid); if (dd < bd) { bd = dd; best = i; } });
      if (fs.i !== best) { fs.i = best; ownItems.forEach((el, i) => el.classList.toggle('on', i === best)); }
      drawFlow(t);
    }
    // cta parallax
    const cr = cta.getBoundingClientRect(); if (!reduced && cr.top < innerHeight && cr.bottom > 0) { const k = clamp((innerHeight - cr.top) / (innerHeight + cr.height)); rcs.forEach((c, i) => { c.style.transform = `translate3d(${(mouse.x * (i + 1) * -14).toFixed(1)}px,${((0.5 - k) * (4 - i) * 46).toFixed(1)}px,0)`; }); }
    requestAnimationFrame(frame);
  }
  if (reduced) { document.documentElement.classList.add('rm'); }
  requestAnimationFrame(frame);
})();
