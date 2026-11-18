// Scroll-driven page behaviour that does not need WebGL: nav theme, hero words, logo rows, core stack, menus.
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const nav = $('#nav'), hero = $('#hero'), words = $$('.hero .w'), core = $('#core'), svc = $$('#svc > li');
  const rows = $$('.logo-row'), badges = $$('.badge');
  const mq = matchMedia('(min-width: 901px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let coreIdx = 0;

  function setCore(i) {
    if (i === coreIdx && svc[i].classList.contains('on')) return;
    coreIdx = i; document.body.dataset.core = i;
    svc.forEach((li, k) => li.classList.toggle('on', k === i));
  }
  svc.forEach((li, i) => $('.svc-h', li).addEventListener('click', () => {
    if (mq.matches && core) {
      const T = core.getBoundingClientRect().top + scrollY, trav = core.offsetHeight - innerHeight;
      scrollTo({ top: T + (i + .5) / svc.length * trav, behavior: reduced ? 'auto' : 'smooth' });
    } else setCore(i);
  }));
  document.body.dataset.core = 0;

  function update() {
    const vh = innerHeight, sy = scrollY;
    // nav theme from the section under the bar
    let theme = 'light';
    for (const s of $$('[data-nav]')) { const r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) { theme = s.dataset.nav; break; } }
    nav.classList.toggle('dark', theme === 'dark'); nav.classList.toggle('scrolled', sy > 24);
    // hero words
    if (hero) {
      const trav = hero.offsetHeight - vh, p = clamp(sy / trav), pos = p * 2;
      words.forEach((w, i) => { const off = i - pos; w.style.transform = `translateY(${off * 55}%)`; w.style.opacity = clamp(1 - Math.abs(off) * 2.4); });
      hero.style.setProperty('--hp', p.toFixed(3));
    }
    // logo rows
    rows.forEach(r => {
      const tr = $('.track', r), half = tr.scrollWidth / 2; if (!half) return;
      const d = +r.dataset.dir, m = (sy * .45) % half;
      tr.style.transform = `translate3d(${d < 0 ? -m : -(half - m)}px,0,0)`;
    });
    // badges
    badges.forEach((b, i) => {
      const r = b.getBoundingClientRect(), p = clamp((vh * .92 - r.top) / (vh * .42));
      b.style.opacity = p; b.style.transform = `translate3d(${(1 - p) * 8}vw,0,0)`;
    });
    // core: active service from scroll
    if (core && mq.matches) {
      const r = core.getBoundingClientRect(), trav = core.offsetHeight - vh;
      if (r.top <= 0 && r.bottom >= vh) setCore(Math.min(svc.length - 1, Math.floor(clamp(-r.top / trav, 0, .999) * svc.length)));
      else if (r.top > 0) setCore(0); else setCore(svc.length - 1);
    }
  }
  let tick = false;
  const req = () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; update(); }); } };
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req);
  addEventListener('load', req); document.fonts && document.fonts.ready.then(req);
  update();

  // reveal on enter
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('main h2, .steps li, .own-list li, .posts li, .slats li, .sup-list li, .tile, .cta .btn, .est-side').forEach(el => { el.classList.add('rv'); io.observe(el); });
  }

  // menus
  const menus = $$('.menu');
  menus.forEach(m => {
    const b = $('button', m);
    b.addEventListener('click', () => { const o = !m.classList.contains('open'); menus.forEach(x => { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); }); m.classList.toggle('open', o); b.setAttribute('aria-expanded', o); });
    m.addEventListener('mouseenter', () => { if (mq.matches) { menus.forEach(x => x.classList.remove('open')); m.classList.add('open'); b.setAttribute('aria-expanded', 'true'); } });
    m.addEventListener('mouseleave', () => { if (mq.matches) { m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } });
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') menus.forEach(m => m.classList.remove('open')); });
  document.addEventListener('click', e => { if (!e.target.closest('.menu')) menus.forEach(m => m.classList.remove('open')); });
  const burger = $('#burger');
  burger.addEventListener('click', () => { const o = !nav.classList.contains('open-m'); nav.classList.toggle('open-m', o); burger.setAttribute('aria-expanded', o); });
  $$('.nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open-m')));
})();
