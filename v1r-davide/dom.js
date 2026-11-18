// Builds the page DOM from window.BITGO. Returns nothing; writes into #app.
const B = window.BITGO;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LOGO = '../shared/assets/bitgo-logo.svg';
const arrow = '<svg class="arr" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9h12M10 4l5 5-5 5"/></svg>';
const wipe = (to, mode) => `<div class="wipe" data-to="${to}" data-mode="${mode}" style="background:var(--from)" aria-hidden="true"></div>`;

const diagrams = [
`<svg class="diag" viewBox="0 0 400 300" aria-hidden="true">
  <circle class="dr" pathLength="1" cx="150" cy="140" r="96"/><circle class="dr" pathLength="1" cx="250" cy="140" r="96"/>
  <circle class="dr soft" pathLength="1" cx="200" cy="140" r="62"/>
  <path class="dr" pathLength="1" d="M60 140a140 140 0 0 1 280 0"/>
  <g stroke="#fff" stroke-width="1.6"><line x1="200" y1="140" x2="200" y2="62" style="transform-origin:200px 140px;animation:needle 9s ease-in-out infinite"/></g>
  <circle class="fill" cx="200" cy="140" r="6"/>
  <path class="dr" pathLength="1" d="M40 280h320"/>
  <path class="dr" pathLength="1" d="M70 280v-30M110 280v-48M150 280v-26M190 280v-64M230 280v-40M270 280v-78M310 280v-54"/>
</svg>`,
`<svg class="diag" viewBox="0 0 400 300" aria-hidden="true">
  <path class="dr soft" pathLength="1" d="M20 280h360M20 280V20"/>
  <path class="dr soft" pathLength="1" d="M20 250C120 245 210 215 380 150"/>
  <path class="dr soft" pathLength="1" d="M20 262C130 250 230 190 380 100"/>
  <path class="dr" pathLength="1" d="M20 272C140 250 240 170 380 36"/>
  <path class="dr" pathLength="1" d="M100 280v-22M180 280v-60M260 280v-116M340 280v-198"/>
  <circle class="fill" r="7"><animateMotion dur="6s" repeatCount="indefinite" path="M20 272C140 250 240 170 380 36"/></circle>
  <circle r="14" stroke="#fff" fill="none"><animateMotion dur="6s" repeatCount="indefinite" path="M20 272C140 250 240 170 380 36"/></circle>
</svg>`,
`<svg class="diag" viewBox="0 0 400 300" aria-hidden="true">
  <g class="net">
    <path class="dr" pathLength="1" d="M200 150L70 60M200 150L330 60M200 150L40 170M200 150L360 170M200 150L110 262M200 150L290 262M200 150L200 24"/>
    <path class="dr soft" pathLength="1" d="M70 60L200 24L330 60L360 170L290 262L110 262L40 170Z"/>
    <circle class="fill" cx="70" cy="60" r="7"/><circle class="fill" cx="330" cy="60" r="7"/><circle class="fill" cx="40" cy="170" r="7"/>
    <circle class="fill" cx="360" cy="170" r="7"/><circle class="fill" cx="110" cy="262" r="7"/><circle class="fill" cx="290" cy="262" r="7"/><circle class="fill" cx="200" cy="24" r="7"/>
    <circle class="dr" pathLength="1" cx="200" cy="150" r="26"/><circle class="fill" cx="200" cy="150" r="10"/>
    <circle class="fill" r="4"><animateMotion dur="3.2s" repeatCount="indefinite" path="M70 60L200 150"/></circle>
    <circle class="fill" r="4"><animateMotion dur="2.6s" begin="-1s" repeatCount="indefinite" path="M200 150L360 170"/></circle>
    <circle class="fill" r="4"><animateMotion dur="3.8s" begin="-2s" repeatCount="indefinite" path="M110 262L200 150"/></circle>
    <circle class="fill" r="4"><animateMotion dur="3s" begin="-.5s" repeatCount="indefinite" path="M200 150L330 60"/></circle>
  </g>
</svg>`];

const play = '<svg width="26" height="26" viewBox="0 0 26 26" fill="currentColor"><path d="M8 4l15 9-15 9z"/></svg>';
const blobs = [
  ['#1647DB', '#7aa2ff', '#0a1a55'], ['#4d7cff', '#1647DB', '#06112e'], ['#7aa2ff', '#1647DB', '#0b1d63']
];

export function build() {
  const nav = `<header class="nav" id="nav"><div class="wrap nav-in">
    <a class="logo" href="#top" aria-label="BitGo"><img src="${LOGO}" alt="BitGo" width="88" height="30"></a>
    <ul class="menu">${B.menus.map(m => `<li><button type="button" aria-expanded="false">${esc(m.label)}</button>
      <div class="drop"><div class="wrap">${m.groups.map(g => `<div><h4>${esc(g.title)}</h4>${g.items.map(i => `<a href="${i.href}">${esc(i.label)}</a>`).join('')}</div>`).join('')}</div></div></li>`).join('')}</ul>
    <div class="nav-actions"><span class="lang">${esc(B.navActions.language)}</span>
      <a class="link" href="${B.navActions.signup.href}">${esc(B.navActions.signup.label)}</a>
      <a class="link" href="${B.navActions.login.href}">${esc(B.navActions.login.label)}</a>
      <a class="btn" href="#contact">${esc(B.navActions.connect)}</a></div>
    <button class="burger" id="burger" aria-label="Menu"><span></span><span></span></button>
  </div></header>`;

  const h = B.hero;
  const hero = `<section class="hero" id="top" data-theme="dark"><canvas id="c-hero"></canvas>
    <div class="hero-copy"><div class="wrap">
      <h1 aria-label="${esc(h.h1)}"><span class="rot" aria-hidden="true">${h.words.map((w, i) => `<span class="${i ? '' : 'on'}">${esc(w)}</span>`).join('')}</span><span aria-hidden="true">${esc(h.rest)}</span></h1>
      <div class="hero-side"><p>${esc(h.sub)}</p><a class="btn" href="#contact">${esc(h.cta)} ${arrow}</a></div>
    </div></div></section>`;

  const t = B.trust;
  const logos = t.logos.map(l => `<img src="${l}" alt="" loading="lazy">`).join('');
  const rail = (cls) => `<div class="rail ${cls}"><div class="rail-track">${logos}${logos}</div></div>`;
  const trust = `<section class="trust s-blue" data-theme="blue"><div class="wrap"><h2 class="big" data-words>${esc(t.title)}</h2></div>
    ${rail('')}${rail('rev')}</section>
    <section class="badges s-blue" data-theme="blue"><div class="wrap">${B.badges.map(b => `<div class="badge" data-badge><span>${esc(b.label)}</span><i class="ln"></i></div>`).join('')}</div></section>`;

  const c = B.core;
  const core = `<section class="core" id="core" data-theme="dark"><div class="core-stick">
    <canvas id="c-core"></canvas>
    <h2 class="core-head" data-core-head>${esc(c.title.join(' '))}</h2>
    <div class="core-list" role="tablist">${c.items.map((it, i) => `<button type="button" data-i="${i}">${esc(it.title)}</button>`).join('')}</div>
    ${c.items.map((it, i) => `<div class="core-item" data-i="${i}"><h3>${esc(it.title)}</h3><p class="sh">${esc(it.short)}</p><p class="lg" data-lg>${esc(it.long)}</p><a class="btn" href="${it.cta.href}">${esc(it.cta.label)} ${arrow}</a></div>`).join('')}
    ${c.items.map((it, i) => `<span class="core-lab" data-i="${i}" aria-hidden="true">${esc(it.title)}</span>`).join('')}
    <img class="core-logo" src="${LOGO}" alt="">
  </div></section>`;

  const e = B.established;
  const est = `<section class="est" data-theme="dark"><div class="wrap">
    <div class="est-top"><h2 class="big" data-words>${esc(e.title)}</h2><div><p>${esc(e.text)}</p><a class="btn" href="${e.cta.href}">${esc(e.cta.label)} ${arrow}</a></div></div>
    <div>${e.logos.map(l => `<a class="row ${l.text ? '' : 'nohov'}" href="${l.href || e.cta.href}"><img src="${l.image}" alt="${esc(l.name)}"><p>${esc(l.text || '')}</p><span class="go">${arrow}</span>
      <span class="tiles" aria-hidden="true">${Array.from({ length: 64 }, () => `<i style="--d:${(Math.random() * .35).toFixed(2)}s"></i>`).join('')}</span></a>`).join('')}</div>
  </div></section>`;

  const bd = B.build;
  const build = `<section class="build" data-theme="ice"><div class="wrap">
    <h2 class="big" data-words>${esc(bd.title)}</h2>
    <div class="cards">${bd.cards.map((cd, i) => `<article class="card rv">${diagrams[i]}<h3>${esc(cd.label)}</h3><p>${esc(cd.text)}</p><div><a class="btn white" href="${cd.cta.href}">${esc(cd.cta.label)} ${arrow}</a></div></article>`).join('')}</div>
  </div></section>`;

  const s = B.support;
  const support = `<section class="support" data-theme="dark"><div class="wrap sup-grid">
    <div><h2 class="big">${esc(s.label.replace(' Support', ''))}</h2><p class="lead" data-words>${esc(s.title)}</p>
      <ul class="sup-items">${s.items.map((it, i) => `<li style="--d:${i * .4}s">${esc(it)}</li>`).join('')}</ul></div>
    <div class="clock"><canvas id="c-clock"></canvas></div>
  </div></section>`;

  const o = B.own;
  const own = `<section class="own" data-theme="blue"><canvas id="c-own" aria-hidden="true"></canvas><div class="wrap own-grid">
    <div class="own-title"><h2 class="big" data-words>${esc(o.title)}</h2></div>
    <div class="own-items">${o.items.map(it => `<div class="own-item" data-own><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div>`).join('')}</div>
  </div></section>`;

  const sp = B.spotlight;
  const spot = `<section class="spot" data-theme="dark"><div class="wrap"><h2 class="big" data-words>${esc(sp.label)}</h2>
    <div class="vids">${sp.slides.map((v, i) => { const b = blobs[i]; return `<a class="vid rv" href="${v.video}" target="_blank" rel="noopener"><div class="poster" style="background:${b[2]}">
      <i class="blob" style="width:70%;height:70%;left:${[-10, 30, 5][i]}%;top:${[30, -10, 20][i]}%;background:${b[0]}"></i>
      <i class="blob" style="width:50%;height:50%;right:${[0, -8, 10][i]}%;bottom:${[-6, 10, -4][i]}%;background:${b[1]};animation-delay:-5s"></i>
      <span class="play">${play}</span></div><h3>${esc(v.title)}</h3></a>`; }).join('')}</div></div></section>`;

  const l = B.latest;
  const latest = `<section class="latest" data-theme="ice"><div class="wrap">
    <div class="lat-top"><h2 class="big" data-words>${esc(l.title)}</h2><a class="btn" href="${l.all.href}">${esc(l.all.label)} ${arrow}</a></div>
    <div>${l.posts.map(p => `<a class="post rv" href="${p.href}"><span>${esc(p.title)}</span><i class="go">${arrow}</i></a>`).join('')}</div>
  </div></section>`;

  const ct = B.cta;
  const cta = `<section class="cta" id="contact" data-theme="blue"><canvas id="c-cta" aria-hidden="true"></canvas><div class="wrap">
    <h2 class="big">${esc(ct.title[0])}<br><b>${esc(ct.title[1])}</b></h2>
    <a class="btn white" href="#">${esc(ct.button)} ${arrow}</a></div></section>`;

  const f = B.footer;
  const foot = `<footer class="foot" data-theme="dark"><div class="wrap">
    <div class="foot-top"><p>${esc(f.newsletter)}</p><form class="nl" onsubmit="return false"><input type="email" placeholder="${esc(f.email)}" aria-label="${esc(f.email)}"><button class="btn" type="submit">${esc(f.subscribe)}</button></form></div>
    <div class="socials">${f.socials.map(x => `<a href="${x.href}">${esc(x.label)}</a>`).join('')}</div>
    <div class="legal">${f.legal.map(x => `<p>${esc(x)}</p>`).join('')}
      <p>${esc(f.review)} <a href="${f.privacy.href}">${esc(f.privacy.label)}</a> ${esc(f.and)} <a href="${f.disclaimers.href}">${esc(f.disclaimers.label)}</a>.</p>
      <p>${esc(f.screenReader)}</p><p>${esc(f.complaints)}</p><p>${esc(f.nmls)} &middot; ${esc(f.choices)} &middot; ${esc(f.rights)}</p></div>
  </div></footer>`;

  // Wipe strips sit between sections; data-from is set from the section above.
  document.getElementById('app').innerHTML = nav + `<main id="main">` +
    hero + wipe('blue', 'rand') + trust + wipe('navy', 'diag') + core + est + wipe('ice', 'cols') + build +
    wipe('navy', 'rand') + support + wipe('blue', 'diag') + own + wipe('navy', 'cols') + spot +
    wipe('ice', 'rand') + latest + wipe('blue', 'diag') + cta + `</main>` + foot;
}
