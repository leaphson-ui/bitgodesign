import { reduced } from './loop.js';
import { initHero } from './hero.js';
import { initSims } from './sims.js';
import { initSeams } from './seams.js';
import { initTrace } from './trace.js';

const B = window.BITGO;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const logo = '../shared/assets/bitgo-logo.svg';
const arrow = '<svg class="arr" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13L13 3M5 3h8v8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

function nav() {
  const menus = B.menus.map((m, i) => `
    <li class="mi" data-i="${i}">
      <button type="button" aria-expanded="false">${m.label}<svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>
      <div class="mega g${m.groups.length}">
        ${m.groups.map((g) => `<div class="mg"><h4>${g.title}</h4><ul>${g.items.map((it) => `<li><a href="${it.href}">${it.label}</a></li>`).join('')}</ul></div>`).join('')}
      </div>
    </li>`).join('');
  const mob = B.menus.map((m) => `
    <details><summary>${m.label}</summary>
      ${m.groups.map((g) => `<h4>${g.title}</h4><ul>${g.items.map((it) => `<li><a href="${it.href}">${it.label}</a></li>`).join('')}</ul>`).join('')}
    </details>`).join('');
  const a = B.navActions;
  return `
  <nav class="nav" aria-label="Main">
    <a class="brand" href="${B.BITGO}"><img src="${logo}" alt="BitGo" width="108" height="37"></a>
    <ul class="menu">${menus}</ul>
    <div class="acts">
      <span class="lang">${a.language}</span>
      <a class="txt" href="${a.login.href}">${a.login.label}</a>
      <a class="pill ghost" href="${a.signup.href}">${a.signup.label}</a>
      <a class="pill solid" href="#connect">${a.connect}</a>
      <button class="burger" type="button" aria-label="Menu" aria-expanded="false"><i></i><i></i></button>
    </div>
    <div class="mob" hidden>${mob}
      <div class="mob-a"><a class="pill ghost" href="${a.login.href}">${a.login.label}</a><a class="pill ghost" href="${a.signup.href}">${a.signup.label}</a><a class="pill solid" href="#connect">${a.connect}</a></div>
    </div>
  </nav>`;
}

function hero() {
  const h = B.hero;
  const tiers = ['Hold', 'Trade', 'Move', 'Earn', 'Issue', 'Build'];
  return `
  <header class="hero" id="hero">
    <canvas id="heroCanvas" aria-hidden="true"></canvas>
    ${tiers.map((t) => `<span class="tier" aria-hidden="true">${t}</span>`).join('')}
    <div class="hero-copy">
      <h1><span class="words" aria-label="${h.words.join(', ')}">${h.words.map((w, i) => `<span class="w${i === 0 ? ' on' : ''}">${w}</span>`).join('')}</span> <span class="rest">${h.rest}</span></h1>
      <div class="hero-row"><p>${h.sub}</p><a class="pill solid big" href="#connect">${h.cta}</a></div>
    </div>
  </header>`;
}

function trust() {
  const logos = B.trust.logos;
  const row = (arr) => `<div class="lrow"><div class="ltrack">${[...arr, ...arr].map((s) => `<span class="lt"><img src="${s}" alt="" loading="lazy"></span>`).join('')}</div></div>`;
  return `
  <section class="trust">
    <h2 class="rv">${B.trust.title.replace('trusted ', 'trusted<br>')}</h2>
    <div class="lrows">${row(logos.slice(0, 7))}${row(logos.slice(7))}</div>
    <div class="badges">${B.badges.map((b) => `<div class="badge rv"><span>${b.label}</span></div>`).join('')}</div>
  </section>`;
}

function core() {
  const c = B.core;
  return `
  <section class="core" id="core">
    <div class="stage"><canvas id="hall" aria-hidden="true"></canvas><div class="scrim"></div><div class="grain"></div></div>
    <div class="core-in">
      <h2 class="rv">${c.title.map((t) => `<span>${t}</span>`).join('')}</h2>
      <div class="rows">
        ${c.items.map((it) => `
        <article class="crow" tabindex="0">
          <span class="nd"></span>
          <h3>${it.title}</h3>
          <p class="short">${it.short}</p>
          <div class="more"><div><p>${it.long}</p><a class="lnk" href="${it.cta.href}">${it.cta.label}${arrow}</a></div></div>
        </article>`).join('')}
      </div>
    </div>
  </section>`;
}

function established() {
  const e = B.established;
  return `
  <section class="est">
    <div class="est-head">
      <h2 class="rv">${e.title}</h2>
      <p class="rv">${e.text}</p>
      <a class="pill solid" href="${e.cta.href}">${e.cta.label}${arrow}</a>
    </div>
    <div class="est-grid">
      ${e.logos.map((l) => `
      <a class="tile${l.text ? ' has' : ''}" href="${l.href || e.cta.href}" ${l.text ? '' : 'tabindex="-1"'}>
        <img src="${l.image}" alt="${l.name}" loading="lazy">
        ${l.text ? `<span class="tx">${l.text}</span>` : ''}
      </a>`).join('')}
    </div>
  </section>`;
}

function build() {
  const b = B.build;
  return `
  <section class="build">
    <h2 class="rv">${b.title}</h2>
    <div class="cards">
      ${b.cards.map((c, i) => `
      <article class="card c${i}">
        <canvas data-sim="${i}" aria-hidden="true"></canvas>
        <div class="ct"><h3>${c.label}</h3><p>${c.text}</p><a class="lnk" href="${c.cta.href}">${c.cta.label}${arrow}</a></div>
      </article>`).join('')}
    </div>
  </section>`;
}

function support() {
  const s = B.support;
  return `
  <section class="sup">
    <div class="sup-head">
      <h2 class="rv"><b>${s.label}</b>${s.title}</h2>
    </div>
    <canvas id="week" aria-hidden="true"></canvas>
    <ul class="sup-list">${s.items.map((t) => `<li class="sitem rv"><span class="nd"></span>${t}</li>`).join('')}</ul>
  </section>`;
}

function own() {
  const o = B.own;
  return `
  <section class="own">
    <h2 class="rv">${o.title}</h2>
    <div class="own-list">
      ${o.items.map((it, i) => `<article class="oitem"><div class="ot rv"><span class="nd"></span><h3>${it.title}</h3><p>${it.text}</p></div><canvas data-own="${i}" aria-hidden="true"></canvas></article>`).join('')}
    </div>
  </section>`;
}

function spotlight() {
  const s = B.spotlight;
  const frames = [
    'radial-gradient(60% 90% at 78% 8%, #9bb9ff 0%, rgba(22,71,219,0) 62%), linear-gradient(160deg,#1647DB,#07124a 70%)',
    'conic-gradient(from 210deg at 22% 92%, #0b1a63 0deg, #1647DB 70deg, #8fb0ff 100deg, #0b1a63 130deg, #04050E 360deg)',
    'linear-gradient(100deg,#04050E 0 28%, #1647DB 28% 46%, #0b1a63 46% 62%, #7fa5ff 62% 64%, #04050E 64%)'
  ];
  return `
  <section class="spot">
    <h2 class="rv">${s.label}</h2>
    <div class="spots">
      ${s.slides.map((v, i) => `
      <a class="sp" href="${v.video}" target="_blank" rel="noopener">
        <span class="frame" style="background:${frames[i]}"><canvas class="pc" data-own="${[2, 0, 1][i]}" aria-hidden="true"></canvas><i class="gr"></i><span class="play"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span></span>
        <h3>${v.title}</h3>
      </a>`).join('')}
    </div>
  </section>`;
}

function latest() {
  const l = B.latest;
  return `
  <section class="latest">
    <div class="lat-head"><h2 class="rv">${l.title}</h2><a class="pill ghost" href="${l.all.href}">${l.all.label}${arrow}</a></div>
    <div class="posts">
      ${l.posts.map((p) => `<a class="post rv" href="${p.href}"><h3>${p.title}</h3>${arrow}</a>`).join('')}
    </div>
  </section>`;
}

function cta() {
  const c = B.cta;
  return `
  <section class="cta" id="connect">
    <h2 class="rv">${c.title.map((t) => `<span>${t}</span>`).join('')}</h2>
    <a class="pill solid big" href="#connect">${c.button}</a>
  </section>`;
}

function footer() {
  const f = B.footer;
  return `
  <footer class="foot">
    <div class="foot-top">
      <img src="${logo}" alt="BitGo" width="140" height="48">
      <form class="news" onsubmit="return false">
        <label for="em">${f.newsletter}</label>
        <div><input id="em" type="email" placeholder="${f.email}" autocomplete="email"><button class="pill solid" type="submit">${f.subscribe}</button></div>
      </form>
      <ul class="soc">${f.socials.map((s) => `<li><a href="${s.href}">${s.label}</a></li>`).join('')}</ul>
    </div>
    <div class="legal">
      ${f.legal.map((p) => `<p>${p}</p>`).join('')}
      <p>${f.review} <a href="${f.privacy.href}">${f.privacy.label}</a> ${f.and} <a href="${f.disclaimers.href}">${f.disclaimers.label}</a>.</p>
      <p>${f.screenReader}</p>
      <p>${f.complaints}</p>
      <p>${f.nmls} · <a href="#">${f.choices}</a> · ${f.rights}</p>
    </div>
  </footer>`;
}

const wipe = (from, to) => `<div class="seam" style="--a:${from};--b:${to}" aria-hidden="true"><i class="fill"></i><i class="head"></i></div>`;
const BLUE = '#1647DB', INK = '#04050E';

$('#app').innerHTML = nav() + `<main id="main">`
  + hero() + trust() + wipe(BLUE, INK) + core() + wipe(INK, BLUE) + established() + wipe(BLUE, INK)
  + build() + wipe(INK, BLUE) + support() + wipe(BLUE, INK) + own() + spotlight() + latest() + wipe(INK, BLUE) + cta()
  + `</main>` + footer();

// ---- nav behaviour
const navEl = $('.nav');
$$('.mi').forEach((li) => {
  const btn = $('button', li);
  const open = (v) => { li.classList.toggle('open', v); btn.setAttribute('aria-expanded', v); };
  li.addEventListener('mouseenter', () => { $$('.mi.open').forEach((o) => o !== li && o.classList.remove('open')); open(true); });
  li.addEventListener('mouseleave', () => open(false));
  btn.addEventListener('click', () => open(!li.classList.contains('open')));
  li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) open(false); });
});
const burger = $('.burger'), mob = $('.mob');
burger.addEventListener('click', () => {
  const v = mob.hidden; mob.hidden = !v; navEl.classList.toggle('mopen', v); burger.setAttribute('aria-expanded', v);
});
addEventListener('scroll', () => navEl.classList.toggle('stuck', scrollY > 40), { passive: true });

// ---- smooth scroll
let lenis = null;
if (window.Lenis && !reduced) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); const t = id.length > 1 && $(id);
    if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -20 }); }
  }));
}

// ---- reveals
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.rv').forEach((el) => io.observe(el));

// ---- hero rotating word
{
  const ws = $$('.words .w'); let i = 0;
  if (!reduced) setInterval(() => {
    ws[i].classList.remove('on'); ws[i].classList.add('out');
    const prev = ws[i]; setTimeout(() => prev.classList.remove('out'), 800);
    i = (i + 1) % ws.length; ws[i].classList.add('on');
    window.dispatchEvent(new CustomEvent('hero-word', { detail: i }));
  }, 2800);
}

// ---- core rows: active row follows the scroll centre
{
  const rows = $$('.crow');
  const upd = () => {
    const mid = innerHeight * 0.52; let best = null, bd = 1e9;
    rows.forEach((r) => { const b = r.getBoundingClientRect(); const d = Math.abs(b.top + Math.min(b.height, 160) / 2 - mid); if (d < bd) { bd = d; best = r; } });
    rows.forEach((r) => r.classList.toggle('act', r === best && bd < innerHeight * 0.45));
  };
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  rows.forEach((r) => { r.addEventListener('focus', () => { rows.forEach((x) => x.classList.remove('act')); r.classList.add('act'); }); });
}
// ---- logo rows drift with scroll
{
  const tracks = $$('.ltrack');
  const sec = $('.trust');
  const upd = () => {
    const b = sec.getBoundingClientRect(); const p = (innerHeight - b.top);
    tracks.forEach((t, i) => { const half = t.scrollWidth / 2; const off = (p * 0.35) % half; t.style.transform = `translate3d(${i ? off - half : -off}px,0,0)`; });
  };
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
}

initHero();
initSims();
initSeams();
initTrace();
import('./hall.js').then((m) => m.initHall()).catch((e) => { console.warn('hall unavailable', e); document.documentElement.classList.add('no-gl'); });
