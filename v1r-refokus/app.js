import { initHero } from './hero.js';
import { buildSections } from './sections.js';

const B = window.BITGO;
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const arrow = '<i><svg viewBox="0 0 14 14"><path d="M1 7h11M8 2.5 12.5 7 8 11.5"/></svg></i>';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap, ST = window.ScrollTrigger;
if (gsap && ST) gsap.registerPlugin(ST);

$('#skip').textContent = B.skip;

/* ---------- nav ---------- */
function buildNav() {
  const nav = $('#nav');
  nav.innerHTML = `
    <a class="logo" href="#top" aria-label="BitGo"><img src="../shared/assets/bitgo-logo.svg" alt="BitGo" width="88" height="30"></a>
    <ul class="menu">${B.menus.map((m, i) => `<li data-i="${i}"><button type="button" aria-haspopup="true">${esc(m.label)}</button></li>`).join('')}</ul>
    <div class="acts">
      <span class="lang">${esc(B.navActions.language)}</span>
      <a class="lnk" href="${B.navActions.login.href}">${esc(B.navActions.login.label)}</a>
      <a class="lnk" href="${B.navActions.signup.href}">${esc(B.navActions.signup.label)}</a>
      <a class="btn sm" href="#cta">${esc(B.navActions.connect)}${arrow}</a>
      <button class="burger" type="button" aria-label="Menu"></button>
    </div>`;
  const mega = el('div', 'dd');
  mega.innerHTML = B.menus.map((m, i) => `<div class="grid" data-i="${i}">${m.groups.map(g => `<div><h4>${esc(g.title)}</h4><ul class="${g.items.length > 8 ? 'cols' : ''}">${g.items.map(it => `<li><a href="${it.href}">${esc(it.label)}</a></li>`).join('')}</ul></div>`).join('')}</div>`).join('');
  document.body.appendChild(mega);
  let closeT;
  const open = i => {
    clearTimeout(closeT);
    mega.querySelectorAll('.grid').forEach(g => g.classList.toggle('on', +g.dataset.i === i));
    nav.querySelectorAll('.menu li').forEach(l => l.classList.toggle('open', +l.dataset.i === i));
    mega.classList.add('on'); nav.classList.add('solid');
  };
  const close = () => { closeT = setTimeout(() => { mega.classList.remove('on'); nav.querySelectorAll('.menu li').forEach(l => l.classList.remove('open')); sync(); }, 140); };
  nav.querySelectorAll('.menu li').forEach(l => { l.addEventListener('mouseenter', () => open(+l.dataset.i)); l.addEventListener('focusin', () => open(+l.dataset.i)); l.addEventListener('mouseleave', close); });
  mega.addEventListener('mouseenter', () => clearTimeout(closeT)); mega.addEventListener('mouseleave', close);
  nav.addEventListener('mouseleave', close);
  // phone panel
  const mp = el('div', 'mpanel');
  mp.innerHTML = B.menus.map(m => `<details><summary>${esc(m.label)}</summary>${m.groups.map(g => `<h4>${esc(g.title)}</h4>${g.items.map(it => `<a href="${it.href}">${esc(it.label)}</a>`).join('')}`).join('')}</details>`).join('') +
    `<a class="btn" href="#cta">${esc(B.navActions.connect)}${arrow}</a>`;
  document.body.appendChild(mp);
  nav.querySelector('.burger').addEventListener('click', () => { const on = mp.classList.toggle('on'); nav.classList.toggle('mopen', on); document.body.style.overflow = on ? 'hidden' : ''; sync(); });
  mp.addEventListener('click', e => { if (e.target.closest('a')) { mp.classList.remove('on'); nav.classList.remove('mopen'); document.body.style.overflow = ''; } });
  let lastY = 0;
  function sync() {
    const y = scrollY;
    nav.classList.toggle('solid', y > 40 || mega.classList.contains('on') || mp.classList.contains('on'));
    nav.classList.toggle('hide', y > lastY + 4 && y > 600 && !mega.classList.contains('on') && !mp.classList.contains('on'));
    if (y < lastY - 4) nav.classList.remove('hide');
    lastY = y;
  }
  addEventListener('scroll', sync, { passive: true }); sync();
}

/* ---------- hero ---------- */
function buildHero() {
  const h = B.hero;
  const hero = $('#hero');
  hero.innerHTML = `
    <div class="hero-track"><div class="hero-stage">
      <div class="fallback"></div>
      <canvas id="heroGL" aria-hidden="true"></canvas>
      <div class="vig"></div>
      <div class="hero-copy">
        <h1 aria-label="${esc(h.h1)}"><span class="rw" aria-hidden="true"><span>${h.words.map(w => `<span>${esc(w)}</span>`).join('')}</span></span><span class="rest">${esc(h.rest)}</span></h1>
        <div class="hero-side"><p>${esc(h.sub)}</p><a class="btn" href="#cta">${esc(h.cta)}${arrow}</a></div>
      </div>
    </div></div>`;
  const wheel = hero.querySelector('.rw > span');
  wheel.style.display = 'block';
  const n = h.words.length;
  if (gsap && !reduce) {
    // wheel: words + a copy of the first for a seamless loop
    const dup = wheel.children[0].cloneNode(true); dup.setAttribute('aria-hidden', 'true'); wheel.appendChild(dup);
    const loop = gsap.timeline({ repeat: -1, delay: 2.6 });
    for (let i = 1; i <= n; i++) {
      loop.to(wheel, { y: () => -(i * wheel.children[0].getBoundingClientRect().height), duration: .85, ease: 'power3.inOut' }, '+=1.8');
      if (i === n) loop.set(wheel, { y: 0 });
    }
  }
  const stage = hero.querySelector('.hero-stage');
  initHero($('#heroGL'), stage).then(api => {
    if (!api) return;
    stage.querySelector('.fallback').style.display = 'none';
    document.documentElement.classList.add('gl');
    if (ST && !reduce) ST.create({ trigger: '.hero-track', start: 'top top', end: 'bottom bottom', scrub: reduce ? false : .6, onUpdate: s => api.setScroll(s.progress) });
  }).catch(e => console.error('hero', e));
  if (gsap && ST && !reduce) {
    gsap.to('.hero-copy', { yPercent: -8, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero-track', start: '45% top', end: '80% top', scrub: true } });
  }
}

buildNav();
buildHero();
buildSections({ B, $, el, esc, arrow, gsap, ST, reduce });
