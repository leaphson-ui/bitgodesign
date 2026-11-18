/* The shared page shell for product pages: what every page does before and after its modules render.
   Page.start() renders the shared nav and footer; Page.finish() adds scroll reveals, the solid nav on scroll, smooth
   scrolling (Lenis) and Title Case headings. Pages never copy these. (Self-Custody and the homepage still carry their
   own copies of the same few lines; new pages use this.) */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/page\.js(\?.*)?$/, '');   // shared/system/
  // 2D scenes (line, dots, 24/7 grid, ascii): load scenes.js once when the page places one, then mount every slot
  const scenes = () => {
    if (!document.querySelector('[data-scene]')) return;
    if (window.Scenes) return window.Scenes.mount(document);
    if (!document.getElementById('scenes-css')) { const l = document.createElement('link'); l.id = 'scenes-css'; l.rel = 'stylesheet'; l.href = BASE + 'scenes.css'; document.head.appendChild(l); }
    const sc = document.createElement('script'); sc.src = BASE + 'scenes.js'; sc.onload = () => window.Scenes && window.Scenes.mount(document); document.head.appendChild(sc);
  };
  if (!reduce) document.documentElement.classList.add('js');
  window.Page = {
    CONNECT: 'https://www.bitgo.com/connect-with-us/',
    start(o = {}) { renderChrome({ logoHref: o.logoHref || '../v3-refokus/index.html' }); },
    finish() {
      const $$ = s => [...document.querySelectorAll(s)], nav = document.getElementById('nav');
      if (!reduce && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -4% 0px', threshold: 0.01 });
        $$('[data-rv]').forEach(el => io.observe(el));
        setTimeout(() => $$('[data-rv]:not(.in)').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('in'); }), 1500);
      }
      if (nav) addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });
      if (!reduce && window.Lenis) {
        const lenis = new Lenis({ lerp: .11, smoothWheel: true });
        const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
      Parts.titleize(document.querySelector('main') || document.body, { eyebrows: true });   // headings and eyebrows in Title Case (shared rule)
      scenes();
    }
  };
})();
