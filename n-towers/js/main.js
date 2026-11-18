import { createWorld } from './world.js';
import { SHOTS } from './shots.js';

const B = window.BITGO;
const LOGO = '../shared/assets/bitgo-logo.svg';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ARROW = '<svg class="arr" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 11 11 3M5 3h6v6" stroke="currentColor" stroke-width="1.5"/></svg>';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const a = (href, label, cls = '') => `<a class="${cls}" href="${href}">${label}</a>`;
const ext = (href, label, cls = '') => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label}</a>`;

// ---------- build the page from the live copy ----------
function nav() {
  const menus = B.menus.map((m, i) => `
    <li class="mi"><button type="button" aria-expanded="false" data-i="${i}">${m.label}<svg viewBox="0 0 10 6" aria-hidden="true"><path d="m1 1 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>
      <div class="panel ${m.groups.length > 2 ? 'wide' : ''}">${m.groups.map((g) => `<div class="grp"><h4>${esc(g.title)}</h4><ul>${g.items.map((it) => `<li>${ext(it.href, esc(it.label))}</li>`).join('')}</ul></div>`).join('')}</div></li>`).join('');
  const mob = B.menus.map((m) => `<details><summary>${m.label}</summary>${m.groups.map((g) => `<h4>${esc(g.title)}</h4><ul>${g.items.map((it) => `<li>${ext(it.href, esc(it.label))}</li>`).join('')}</ul>`).join('')}</details>`).join('');
  return `<header class="nav" id="nav"><div class="nav-in">
    <a class="brand" href="#hero" aria-label="BitGo"><img src="${LOGO}" alt="BitGo" width="108" height="37"></a>
    <ul class="menu">${menus}</ul>
    <div class="acts"><span class="lang">${esc(B.navActions.language)}</span>${ext(B.navActions.login.href, B.navActions.login.label, 'tl')}${ext(B.navActions.signup.href, B.navActions.signup.label, 'tl')}${a('#cta', B.navActions.connect, 'btn sm')}<button class="burger" type="button" aria-label="Menu" aria-expanded="false"><i></i><i></i></button></div>
    </div><nav class="mob" aria-label="Menu">${mob}<div class="mob-acts">${ext(B.navActions.login.href, B.navActions.login.label, 'tl')}${ext(B.navActions.signup.href, B.navActions.signup.label, 'tl')}</div></nav></header>`;
}
const hero = () => `<section id="hero" class="sec"><div class="hero-in blk">
  <h1 aria-label="${esc(B.hero.h1)}"><span class="rot" aria-hidden="true">${B.hero.words.map((w, i) => `<span class="${i ? '' : 'on'}">${w}</span>`).join('')}</span><span class="rest" aria-hidden="true">${esc(B.hero.rest)}</span></h1>
  <p class="sub">${esc(B.hero.sub)}</p>${a('#cta', esc(B.hero.cta), 'btn')}</div></section>`;
const trust = () => `<section id="trust" class="sec"><div class="blk wide"><h2>${esc(B.trust.title)}</h2>
  <ul class="dir">${B.trust.logos.map((l) => `<li><img src="${l}" alt="" loading="lazy"></li>`).join('')}</ul></div></section>`;
const badges = () => `<section id="badges" class="sec"><ul class="plaque">${B.badges.map((b) => `<li>${esc(b.label)}</li>`).join('')}</ul></section>`;
const core = () => `<section id="core" class="sec"><div class="blk core-h"><h2>${B.core.title.map(esc).join('<br>')}</h2></div>
  ${B.core.items.map((it, i) => `<article id="core-${i}" class="it blk" data-i="${i}"><h3>${esc(it.title)}</h3><p class="lead">${esc(it.short)}</p><p>${esc(it.long)}</p>${ext(it.cta.href, esc(it.cta.label) + ARROW, 'lnk')}</article>`).join('')}</section>`;
const established = () => `<section id="established" class="sec"><div class="est">
  <div class="blk"><h2>${esc(B.established.title)}</h2><p class="lead">${esc(B.established.text)}</p>${ext(B.established.cta.href, esc(B.established.cta.label) + ARROW, 'btn')}</div>
  <ul class="tiles">${B.established.logos.map((l) => `<li class="${l.text ? 'has' : ''}" tabindex="0"><img src="${l.image}" alt="${esc(l.name)}" loading="lazy">${l.text ? `<div class="tx"><p>${esc(l.text)}</p>${ext(l.href, 'Learn more' + ARROW, 'lnk')}</div>` : ''}</li>`).join('')}</ul></div></section>`;
const build = () => `<section id="build" class="sec"><div class="blk bh"><h2>${esc(B.build.title)}</h2></div>
  ${B.build.cards.map((c, i) => `<article id="build-${i}" class="card"><div class="box"><h3>${esc(c.label)}</h3><p>${esc(c.text)}</p>${ext(c.cta.href, esc(c.cta.label) + ARROW, 'lnk')}</div></article>`).join('')}</section>`;
const support = () => `<section id="support" class="sec"><div class="blk sh"><h2>${esc(B.support.label)}</h2><p class="lead">${esc(B.support.title)}</p></div>
  <ul class="rows">${B.support.items.map((t) => `<li class="blk"><span>${esc(t)}</span></li>`).join('')}</ul></section>`;
const own = () => `<section id="own" class="sec"><div class="blk oh"><h2>${esc(B.own.title)}</h2></div>
  <ul class="own-l">${B.own.items.map((it) => `<li class="blk"><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></li>`).join('')}</ul></section>`;
const spotlight = () => `<section id="spotlight" class="sec"><div class="blk"><h2>${esc(B.spotlight.label)}</h2></div>
  <ul class="vids">${B.spotlight.slides.map((s, i) => `<li>${ext(s.video, `<span class="poster p${i}"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M19 15l15 9-15 9z" fill="currentColor"/></svg></span><span class="cap">${esc(s.title)}</span>`, 'vid')}</li>`).join('')}</ul></section>`;
const latest = () => `<section id="latest" class="sec"><div class="blk"><h2>${esc(B.latest.title)}</h2></div>
  <ul class="posts">${B.latest.posts.map((p) => `<li>${ext(p.href, `<span>${esc(p.title)}</span>${ARROW}`, 'post')}</li>`).join('')}</ul>
  <div class="blk">${ext(B.latest.all.href, esc(B.latest.all.label) + ARROW, 'btn ghost')}</div></section>`;
const cta = () => `<section id="cta" class="sec"><div class="cta-in"><h2>${B.cta.title.map(esc).join('<br>')}</h2>${a(B.BITGO + '/contact-us/', esc(B.cta.button), 'btn big')}</div></section>`;
const footer = () => { const f = B.footer; return `<footer id="footer"><div class="foot-in">
  <div class="fl"><img src="${LOGO}" alt="BitGo" width="120" height="41"><form class="nl" onsubmit="return false"><label for="em">${esc(f.newsletter)}</label><div class="nlr"><input id="em" type="email" placeholder="${esc(f.email)}" autocomplete="email"><button class="btn sm" type="submit">${esc(f.subscribe)}</button></div></form>
  <ul class="soc">${f.socials.map((s) => `<li>${ext(s.href, esc(s.label))}</li>`).join('')}</ul></div>
  <div class="fr">${f.legal.map((p) => `<p>${esc(p)}</p>`).join('')}<p>${esc(f.review)} ${ext(f.privacy.href, esc(f.privacy.label), 'u')} ${esc(f.and)} ${ext(f.disclaimers.href, esc(f.disclaimers.label), 'u')}.</p><p>${esc(f.screenReader)}</p><p>${esc(f.complaints)}</p><p>${esc(f.nmls)} · ${esc(f.choices)} · ${esc(f.rights)}</p></div></div></footer>`; };

document.getElementById('app').innerHTML = nav() + '<main id="main">' + [hero, trust, badges, core, established, build, support, own, spotlight, latest, cta].map((f) => f()).join('') + '</main>' + footer();

// ---------- nav behaviour ----------
const navEl = document.getElementById('nav');
const closeAll = () => navEl.querySelectorAll('.mi.open').forEach((li) => { li.classList.remove('open'); li.querySelector('button').setAttribute('aria-expanded', 'false'); });
navEl.querySelectorAll('.mi > button').forEach((b) => b.addEventListener('click', (e) => { const li = b.parentElement; const was = li.classList.contains('open'); closeAll(); if (!was) { li.classList.add('open'); b.setAttribute('aria-expanded', 'true'); } e.stopPropagation(); }));
document.addEventListener('click', (e) => { if (!navEl.contains(e.target)) closeAll(); });
navEl.querySelector('.burger').addEventListener('click', (e) => { const o = navEl.classList.toggle('mobopen'); e.currentTarget.setAttribute('aria-expanded', o); });
const onScroll = () => { navEl.classList.toggle('stuck', scrollY > 40); };
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// rotating hero word
{ const ws = [...document.querySelectorAll('.rot span')]; let i = 0; if (!reduced) setInterval(() => { ws[i].classList.remove('on'); ws[i].classList.add('out'); const p = ws[i]; setTimeout(() => p.classList.remove('out'), 900); i = (i + 1) % ws.length; ws[i].classList.add('on'); }, 3000); }

// ---------- 3D world ----------
const canvas = document.getElementById('world');
const world = createWorld(canvas);
if (!world) document.documentElement.classList.add('no-gl');

// grain tile
{ const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'); const id = x.createImageData(160, 160); for (let i = 0; i < 160 * 160; i++) { const v = 128 + (Math.random() - .5) * 180; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; } x.putImageData(id, 0, 0); document.getElementById('fx').style.setProperty('--grain', `url(${c.toDataURL()})`); }

// anchors: the page Y where each shot is reached (measured at viewport centre)
function anchors() {
  const out = []; let last = -1;
  for (const s of SHOTS) {
    const el = document.getElementById(s.at.replace('#', '')); if (!el) { out.push(last + 1); last++; continue; }
    const r = el.getBoundingClientRect(); let y = r.top + scrollY + s.p * r.height;
    if (y <= last) y = last + 1; out.push(y); last = y;
  }
  return out;
}
const refresh = () => { if (world) world.setAnchors(anchors()); };
refresh(); addEventListener('resize', refresh); addEventListener('load', refresh);
new ResizeObserver(refresh).observe(document.body);
document.fonts.ready.then(() => { refresh(); if (world) world.buildTicker(B.latest.posts.map((p) => p.title)); });

// core: the active tower follows the item nearest the middle of the screen
const items = [...document.querySelectorAll('#core .it')];
items.forEach((it, i) => { it.addEventListener('pointerenter', () => world && world.hoverCore(i)); it.addEventListener('pointerleave', () => world && world.hoverCore(-1)); });
function coreActive() {
  const mid = innerHeight / 2; let best = -1, bd = 1e9;
  items.forEach((it, i) => { const r = it.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
  const sec = document.getElementById('core').getBoundingClientRect(); const inside = sec.top < mid && sec.bottom > mid;
  const idx = inside ? best : -1; items.forEach((it, i) => it.classList.toggle('on', i === idx)); if (world) world.setCore(idx);
}
addEventListener('scroll', coreActive, { passive: true }); coreActive();

// reveal rows as they enter
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  document.querySelectorAll('.rows li, .own-l li, .posts li, .vids li, .card .box, .plaque li, .tiles li, .dir li').forEach((el) => { el.classList.add('rv'); io.observe(el); });
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (world) world.frame(scrollY + innerHeight * .5, now / 1000, dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
