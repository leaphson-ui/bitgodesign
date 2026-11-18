/* Custody Wallets, built from the v3 Refokus homepage and the Qualified Custody page.
   Copy comes word for word from window.CW (content-cw.js); client logos from window.BITGO; nav and footer from
   window.CHROME (chrome.js). WebGL lives in gl.js, so a GL failure never blocks this file. */
(function () {
  const B = window.BITGO, Q = window.CW;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const CONNECT = 'https://www.bitgo.com/connect-with-us/';
  const EB = '<i aria-hidden="true"></i>';
  if (!reduce) document.documentElement.classList.add('js');

  /* ---------- nav, mobile menu and footer: today's live bitgo.com chrome ---------- */
  renderChrome({ logoHref: '../v3-refokus/index.html' });
  const nav = $('#nav');

  /* ---------- hero: the homepage hero, with the wallet as the object (gl.js) ---------- */
  const H = Q.hero;
  $('#hero').innerHTML =
    `<div class="hero-copy wrap"><p class="eyebrow" data-rv>${EB}${H.eyebrow}</p>
    <h1><span class="rest-w">${H.h1}</span></h1>
    <div class="hero-row"><a class="btn" href="${CONNECT}">${H.cta}${arrow}</a></div></div>`;

  /* ---------- trust marquee (same logos and order as the live page) ---------- */
  const lg = B.trust.logos;
  const mqRow = (arr, rev) => `<div class="mq${rev ? ' rev' : ''}"><div class="mq-t">${[...arr, ...arr].map(s => `<img src="${s}" alt="" loading="lazy">`).join('')}</div></div>`;
  $('#trust').innerHTML = `<div class="wrap"><h2 data-rv>${Q.trustTitle}</h2></div>` + mqRow(lg, false) + mqRow([...lg].reverse(), true);

  /* ---------- best for: centred over the frosted wallet ---------- */
  const I = Q.intro;
  $('#intro').innerHTML = `<div class="wrap"><div class="intro-in"><p class="eyebrow" data-rv>${EB}${I.label}</p><h2 data-rv>${I.title}</h2><p class="lead" data-rv>${I.text}</p></div></div>`;

  /* ---------- key management: three keys held together in cold storage (gl.js) ---------- */
  const K = Q.keys;
  $('#keyman').innerHTML = `<div class="wrap"><div class="km-copy"><p class="eyebrow" data-rv>${EB}${K.label}</p><h2 class="big" data-rv>${K.title}</h2>${K.text.map(t => `<p class="lead" data-rv>${t}</p>`).join('')}</div></div>`;

  /* ---------- wallets designed for your business: the homepage Core module, unchanged; the wallet changes per step ---------- */
  const L = Q.list;
  $('#keys').innerHTML =
    `<div class="list-head wrap"><p class="eyebrow" data-rv>${EB}${L.label}</p><h2 class="big" data-rv>${L.title}</h2><p class="lead" data-rv>${L.text}</p></div>
    <div class="core-track" id="keysTrack" style="height:${L.items.length * 85 + 100}vh"><div class="core-sticky"><div class="core-shade" aria-hidden="true"></div><div class="wrap"><div class="core-panel">
      <div class="core-list">${L.items.map((it, i) => `<button data-i="${i}">${it.title}</button>`).join('')}</div>
      <div class="core-body">${L.items.map((it, i) => `<div class="core-item" data-i="${i}"><h3>${it.title}</h3><p class="lg">${it.text}</p></div>`).join('')}</div>
    </div></div></div></div>`;
  window.__keys = { active: -1 };
  const keysTrack = $('#keysTrack'), keyBtns = $$('#keys .core-list button'), keyItems = $$('#keys .core-item');
  const keyShade = $('#keys .core-shade'), keyPanel = $('#keys .core-panel');
  keyBtns.forEach(b => b.onclick = () => {
    const i = +b.dataset.i, top = keysTrack.getBoundingClientRect().top + scrollY, span = keysTrack.offsetHeight - innerHeight * 1.12;
    scrollTo({ top: top + span * ((i + .5) / L.items.length) });
  });
  function updateKeys() {
    const r = keysTrack.getBoundingClientRect(), span = keysTrack.offsetHeight - innerHeight * 1.12;
    const p = clamp(-r.top / span);
    const enter = sm(innerHeight * .95, innerHeight * .15, r.top), exit = sm(0, innerHeight * .3, r.bottom - innerHeight);
    keyShade.style.opacity = (enter * exit).toFixed(3);
    keyPanel.style.opacity = sm(0, innerHeight * .2, r.bottom - innerHeight).toFixed(3);
    const idx = r.top > innerHeight * .35 ? -1 : Math.min(L.items.length - 1, Math.floor(p * L.items.length));
    if (idx !== window.__keys.active) {
      window.__keys.active = idx;
      keyBtns.forEach((b, i) => b.classList.toggle('on', i === idx));
      keyItems.forEach((b, i) => b.classList.toggle('on', i === idx));
    }
  }

  /* ---------- numbers: the homepage credentials statement, lit line by line as you read ---------- */
  $('#stats').innerHTML = `<div class="wrap"><p class="stmt">${Q.stats.map(s => `<span><b>${s.value}</b> ${s.label}</span>`).join('')}</p></div>`;
  const stmtSpans = $$('#stats .stmt span');

  /* ---------- features: six controls on the blue band ---------- */
  const FE = Q.features;
  const FICONS = ['vault', 'support', 'compliance', 'lock', 'settlement', 'institutions'];   // from shared/icons
  $('#feats').innerHTML =
    `<div class="wrap"><div class="eco-head"><h2 class="big" data-rv>${FE.title}</h2></div>
    <div class="fcards">${FE.cards.map((c, i) => `<article class="fcrd c${i % 2}" data-rv style="--d:${(i % 3) * .08}s"><i class="fglow" aria-hidden="true"></i><i class="ico ico-lg ico-${FICONS[i]}${i % 2 ? ' light' : ''}" aria-hidden="true"></i><div class="fb"><p class="eyebrow sm${i % 2 ? ' light' : ''}">${EB}${c.label}</p><h3>${c.title}</h3></div></article>`).join('')}</div></div>`;

  /* ---------- clients: the live page's logo grid ---------- */
  const CL = Q.clients;
  $('#clients').innerHTML = `<div class="wrap"><h2 class="big" data-rv>${CL.title}</h2><div class="cl-grid">${CL.logos.map((s, i) => `<div class="cl" data-rv style="--d:${(i % 4) * .06}s"><img src="${s}" alt="" loading="lazy"></div>`).join('')}</div></div>`;

  /* ---------- FAQs (the QC module) ---------- */
  $('#faq').innerHTML =
    `<div class="wrap"><div class="faq-grid"><div class="faq-side"><h2 class="big">${Q.faqTitle}</h2></div>
    <div class="faq-list">${Q.faqs.map(f => `<details><summary><h3>${f.q}</h3><span class="pm" aria-hidden="true"></span></summary><div class="ans"><p>${f.a}</p></div></details>`).join('')}</div></div></div>`;

  /* ---------- entities note ---------- */
  const EN = Q.entities;
  $('#entities').innerHTML = `<div class="wrap"><div class="ent"><p>${EN.text}</p><a class="btn ghost" href="${EN.link.href}">${EN.link.label}${arrow}</a></div></div>`;

  /* ---------- cta ---------- */
  const CT = Q.cta;
  $('#cta').innerHTML = `<div class="cta-block"><h2>${CT.title.map(t => `<span>${t}</span>`).join('')}</h2><a class="btn" href="${CONNECT}">${CT.button}${arrow}</a></div>`;

  /* ---------- newsletter module ---------- */
  renderNewsModule($('#news'));

  /* ---------- reveals ---------- */
  requestAnimationFrame(() => setTimeout(() => $('#hero').classList.add('on'), 120));
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -4% 0px', threshold: 0.01 });
    $$('[data-rv]').forEach(el => io.observe(el));
    setTimeout(() => $$('[data-rv]:not(.in)').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('in'); }), 1500);
  }

  /* ---------- scroll ---------- */
  function onScroll() {
    nav.classList.toggle('solid', scrollY > 40);
    stmtSpans.forEach(s => {
      const r = s.getBoundingClientRect(), c = r.top + r.height / 2;
      s.style.setProperty('--o', (reduce ? .95 : lerp(.2, 1, sm(innerHeight * .98, innerHeight * .5, c))).toFixed(3));
    });
    updateKeys();
  }
  let tick = false;
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; onScroll(); }); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: .11, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
})();
