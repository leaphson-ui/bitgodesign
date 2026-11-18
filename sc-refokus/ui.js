/* Self-Custody: the calmer product-page template. No 3D following the scroll: one posed hero object, one signature
   module (key management: hot vs cold), and content-led sections. Copy word for word from window.SC (content-sc.js). */
(function () {
  const B = window.BITGO, Q = window.SC;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const CONNECT = 'https://www.bitgo.com/connect-with-us/';
  const EB = '<i aria-hidden="true"></i>';
  if (!reduce) document.documentElement.classList.add('js');

  renderChrome({ logoHref: '../v3-refokus/index.html' });
  const nav = $('#nav');

  /* hero: copy left, one posed glass key right (sc3d.js) */
  const H = Q.hero;
  Modules.hero($('#hero'), { eyebrow: H.eyebrow, title: H.h1, cta: { label: H.cta, href: CONNECT }, model: 'key', fit: 1, align: 'center' });   // the shared hero

  /* client logos */
  const lg = B.trust.logos;
  Modules.logos($('#trust'), { title: Q.trustTitle, logos: lg });

  /* WalletConnect: the 50/50 module (shared/system/modules.js), with the WalletConnect mark in glass */
  Modules.split($('#wc'), { title: Q.wc.title, cta: Q.wc.cta, side: 'right', visual: { model: 'logo3d', partner: 'walletconnect', fit: 0.78 } });

  /* why self-custody: the 3-column multicard module (shared/system), headline centred */
  const W = Q.why;
  Modules.multicard($('#why'), { eyebrow: W.label, title: W.title, text: W.text, cards: W.cards.map((c, i) => ({ title: c.title, text: c.text, art: ['scSecurity', 'scCompliance', 'scConfig'][i] })) });

  /* key management: two 50/50 modules (shared/system) with UI diagrams of who holds which key. #kman stays the wrapper, gl.js keys the curtain look off it */
  const K = Q.keys;
  $('#kman').innerHTML = '<div id="km-hot"></div><div id="km-cold"></div>';
  [['#km-hot', 'right', 'scHot'], ['#km-cold', 'left', 'scCold']].forEach(([sel, side, ui], i) => Modules.split($(sel), { eyebrow: K[i].label, title: K[i].title, text: K[i].text, cta: K[i].cta, side, visual: { ui } }));
  window.__sc = { mode: 0 };

  /* guide banner */
  const G = Q.guide;
  Modules.banner($('#guide'), { title: G.title, em: ['Crypto Custody', 'vs. Self-Custody'], cta: G.cta });

  /* API access and in-app: two calm rows */
  const RM = ['hsm', 'lock-2'];
  /* API Access and In-app: a pair of 50/50 modules (shared/system), the second mirrored, like Key Management */
  $('#rows').innerHTML = '<div id="row-api"></div><div id="row-app"></div>';
  [['#row-api', 'right', 'scApi'], ['#row-app', 'left', 'scApp']].forEach(([sel, side, ui], i) => { const F = Q.features[i]; Modules.split($(sel), { eyebrow: F.label, title: F.title, text: [F.text], cta: F.cta, side, visual: { ui } }); });

  /* latest, FAQs, closing call to action and newsletter: the shared modules (shared/system/modules.js) */
  const L = Q.latest;
  Modules.latest($('#latest'), { title: L.title, all: L.all, posts: L.posts });
  Modules.faq($('#faq'), { title: Q.faqTitle, items: Q.faqs });
  const CT = Q.cta;
  Modules.banner($('#cta'), { title: CT.title, cta: { label: CT.button, href: CONNECT }, panel: false });   // closing CTA: the banner without its panel
  renderNewsModule($('#news'));

  /* reveals */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -4% 0px', threshold: 0.01 });
    $$('[data-rv]').forEach(el => io.observe(el));
    setTimeout(() => $$('[data-rv]:not(.in)').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('in'); }), 1500);
  }
  addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });
  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: .11, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  Parts.titleize(document.querySelector('main') || document.body);   // headings in Title Case (shared rule)
})();
