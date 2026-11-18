// Builds the page DOM from window.BITGO (live copy). Real DOM text.
const B = window.BITGO;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const LOGO = '../shared/assets/bitgo-logo.svg';
const arrow = '<svg class="arr" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M10.5 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function nav() {
  const menus = B.menus.map((m, i) => `
    <li class="mi"><button class="mb" aria-expanded="false" aria-controls="mp${i}">${esc(m.label)}</button>
      <div class="mp" id="mp${i}"><div class="mpi">${m.groups.map((g) => `
        <div class="mg${g.items.length > 12 ? ' long' : ''}"><h3>${esc(g.title)}</h3><ul>${g.items.map((it) => `<li><a href="${it.href}">${esc(it.label)}</a></li>`).join('')}</ul></div>`).join('')}</div></div></li>`).join('');
  const a = B.navActions;
  return `
  <header class="nav" id="nav">
    <a class="skip" href="#main">${esc(B.skip)}</a>
    <div class="pill pill-l"><a class="logo" href="${B.BITGO}" aria-label="BitGo"><img src="${LOGO}" alt="BitGo" width="108" height="37"></a>
      <ul class="menus">${menus}</ul></div>
    <div class="pill pill-r"><span class="lang">${esc(a.language)}</span><a href="${a.login.href}" class="lnk">${esc(a.login.label)}</a><a href="${a.signup.href}" class="lnk">${esc(a.signup.label)}</a><a href="#cta" class="pbtn">${esc(a.connect)}</a>
      <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i></button></div>
    <div class="mobile-menu" id="mm">${B.menus.map((m) => `<details><summary>${esc(m.label)}</summary>${m.groups.map((g) => `<h4>${esc(g.title)}</h4><ul>${g.items.map((it) => `<li><a href="${it.href}">${esc(it.label)}</a></li>`).join('')}</ul>`).join('')}</details>`).join('')}
      <div class="mm-act"><a href="${a.login.href}">${esc(a.login.label)}</a><a href="${a.signup.href}">${esc(a.signup.label)}</a></div></div>
  </header>`;
}

function hero() {
  const h = B.hero;
  return `
  <section class="hero light" id="hero" data-scene="vault">
    <div class="hero-pin"><div class="hero-copy">
      <h1 aria-label="${esc(h.h1)}"><span class="words" aria-hidden="true">${h.words.map((w, i) => `<span class="w${i ? '' : ' on'}">${esc(w)}</span>`).join('')}</span><span class="rest" aria-hidden="true">${esc(h.rest)}</span></h1>
      <p class="sub">${esc(h.sub)}</p>
      <a class="btn" href="#cta">${esc(h.cta)}${arrow}</a>
    </div></div>
  </section>`;
}

function trust() {
  return `
  <section class="sec blue trust" id="trust" data-scene="skyline"><div class="wrap">
    <h2 class="xl rv">${esc(B.trust.title)}</h2>
    <ul class="logos">${B.trust.logos.map((l) => `<li class="rv"><img src="${l}" alt="" loading="lazy"></li>`).join('')}</ul>
  </div></section>`;
}

function badges() {
  return `
  <section class="sec light badges" id="badges" data-scene="skyline2"><div class="wrap">
    <ul>${B.badges.map((b) => `<li class="rv"><span>${esc(b.label)}</span></li>`).join('')}</ul>
  </div></section>`;
}

function core() {
  const c = B.core;
  return `
  <section class="sec blue core" id="core" data-scene="stack"><div class="wrap core-grid">
    <h2 class="xl rv">${c.title.map((t) => `<span>${esc(t)}</span>`).join(' ')}</h2>
    <ol class="svc">${c.items.map((it) => `
      <li class="rv"><h3>${esc(it.title)}</h3><p class="short">${esc(it.short)}</p><p class="long">${esc(it.long)}</p><a class="tl" href="${it.cta.href}">${esc(it.cta.label)}${arrow}</a></li>`).join('')}</ol>
  </div></section>`;
}

function established() {
  const e = B.established;
  return `
  <section class="sec light est" id="established" data-scene="bridge"><div class="wrap">
    <div class="est-head"><h2 class="xl rv">${esc(e.title)}</h2><div class="est-side rv"><p>${esc(e.text)}</p><a class="btn" href="${e.cta.href}">${esc(e.cta.label)}${arrow}</a></div></div>
    <ul class="tiles">${e.logos.map((l) => `
      <li class="rv"><${l.href ? 'a href="' + l.href + '"' : 'div'} class="tile"><img src="${l.image}" alt="${esc(l.name)}" loading="lazy">${l.text ? `<span class="tt">${esc(l.text)}</span>` : ''}</${l.href ? 'a' : 'div'}></li>`).join('')}</ul>
  </div></section>`;
}

function build() {
  const b = B.build;
  return `
  <section class="sec light build" id="build" data-scene="dome"><div class="wrap">
    <h2 class="xl rv">${esc(b.title)}</h2>
    <ul class="rows">${b.cards.map((c) => `
      <li class="rv"><a href="${c.cta.href}"><span class="rt">${esc(c.label)}</span><span class="rp">${esc(c.text)}</span><span class="ra">${arrow}</span></a></li>`).join('')}</ul>
  </div></section>`;
}

function support() {
  const s = B.support;
  return `
  <section class="sec light support" id="support" data-scene="lighthouse"><div class="wrap sup-grid">
    <div class="sup-l"></div>
    <div class="sup-r"><h2 class="lg rv">${esc(s.label)}</h2><p class="lead rv">${esc(s.title)}</p>
    <ul>${s.items.map((i) => `<li class="rv">${esc(i)}</li>`).join('')}</ul></div>
  </div></section>`;
}

function own() {
  const o = B.own;
  return `
  <section class="sec blue own" id="own" data-scene="terrain"><div class="wrap">
    <h2 class="xl rv">${esc(o.title)}</h2>
    <ul class="own-items">${o.items.map((i) => `<li class="rv"><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></li>`).join('')}</ul>
  </div></section>`;
}

function spotlight() {
  const s = B.spotlight;
  return `
  <section class="sec light spot" id="spotlight" data-scene="iris"><div class="wrap">
    <h2 class="lg rv">${esc(s.label)}</h2>
    <ul class="clips">${s.slides.map((c) => `<li class="rv"><a href="${c.video}" target="_blank" rel="noopener"><span class="ct">${esc(c.title)}</span><span class="play">${arrow}</span></a></li>`).join('')}</ul>
  </div></section>`;
}

function latest() {
  const l = B.latest;
  return `
  <section class="sec light latest" id="latest" data-scene="ribbon"><div class="wrap">
    <div class="lat-head"><h2 class="xl rv">${esc(l.title)}</h2><a class="btn rv" href="${l.all.href}">${esc(l.all.label)}${arrow}</a></div>
    <ul class="posts">${l.posts.map((p) => `<li class="rv"><a href="${p.href}">${esc(p.title)}${arrow}</a></li>`).join('')}</ul>
  </div></section>`;
}

function cta() {
  const c = B.cta;
  return `
  <section class="sec blue cta" id="cta" data-scene="gate"><div class="wrap">
    <h2 class="xxl rv">${c.title.map((t) => `<span>${esc(t)}</span>`).join(' ')}</h2>
    <a class="btn btn-w rv" href="https://www.bitgo.com/contact-us/">${esc(c.button)}${arrow}</a>
  </div></section>`;
}

function footer() {
  const f = B.footer;
  return `
  <footer class="foot dark" id="footer"><div class="wrap">
    <div class="foot-top">
      <img class="foot-logo" src="${LOGO}" alt="BitGo" width="162" height="55">
      <form class="news" onsubmit="return false"><label for="em">${esc(f.newsletter)}</label><div class="nrow"><input id="em" type="email" placeholder="${esc(f.email)}" autocomplete="email"><button type="submit">${esc(f.subscribe)}</button></div></form>
      <ul class="soc">${f.socials.map((s) => `<li><a href="${s.href}">${esc(s.label)}</a></li>`).join('')}</ul>
    </div>
    <div class="legal">${f.legal.map((p) => `<p>${esc(p)}</p>`).join('')}
      <p>${esc(f.review)} <a href="${f.privacy.href}">${esc(f.privacy.label)}</a> ${esc(f.and)} <a href="${f.disclaimers.href}">${esc(f.disclaimers.label)}</a>.</p>
      <p>${esc(f.screenReader)}</p><p>${esc(f.complaints)}</p></div>
    <div class="foot-bot"><span>${esc(f.nmls)}</span><span>${esc(f.choices)}</span><span>${esc(f.rights)}</span></div>
  </div></footer>`;
}

export function buildPage() {
  document.getElementById('app').innerHTML = nav() + '<main id="main">' + hero() + trust() + badges() + core() + established() + build() + support() + own() + spotlight() + latest() + cta() + '</main>' + footer();
  // menus
  const mbs = [...document.querySelectorAll('.mb')];
  const closeAll = () => mbs.forEach((b) => { b.setAttribute('aria-expanded', 'false'); b.parentElement.classList.remove('open'); });
  mbs.forEach((b) => {
    b.addEventListener('click', (e) => { const o = b.getAttribute('aria-expanded') === 'true'; closeAll(); if (!o) { b.setAttribute('aria-expanded', 'true'); b.parentElement.classList.add('open'); } e.stopPropagation(); });
    b.parentElement.addEventListener('mouseenter', () => { closeAll(); b.setAttribute('aria-expanded', 'true'); b.parentElement.classList.add('open'); });
  });
  document.getElementById('nav').addEventListener('mouseleave', closeAll);
  document.addEventListener('click', closeAll);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeAll());
  const bg = document.querySelector('.burger');
  bg.addEventListener('click', () => { const o = bg.getAttribute('aria-expanded') === 'true'; bg.setAttribute('aria-expanded', String(!o)); document.getElementById('nav').classList.toggle('mm-open', !o); });
  // reveal
  const els = [...document.querySelectorAll('.rv')];
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-rv');
    const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -6% 0px' });
    els.forEach((el, i) => { el.style.transitionDelay = ((i % 5) * 70) + 'ms'; io.observe(el); });
  }
}
