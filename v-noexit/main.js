(function () {
  const B = window.BITGO;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');
  if (reduce) document.documentElement.classList.add('reduce');

  const arrow = '<svg class="arr" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
  const split = (t) => esc(t).split(' ').map((w) => '<span class="w"><span>' + w + '</span></span>').join(' ');
  const lines = (arr) => arr.map((l) => '<span class="ln">' + split(l) + '</span>').join('');

  /* ---------- nav ---------- */
  $('#skip').textContent = B.skip;
  const logo = '<a class="logo" href="#hero" aria-label="BitGo"><img src="../shared/assets/bitgo-logo.svg" alt="BitGo" width="108" height="37"></a>';
  const menus = B.menus.map((m, i) => `
    <div class="menu" data-i="${i}">
      <button class="menu-btn" aria-expanded="false" aria-controls="panel-${i}">${esc(m.label)}</button>
      <div class="panel" id="panel-${i}">
        <div class="panel-in">${m.groups.map((g) => `
          <div class="grp"><h3>${esc(g.title)}</h3><ul>${g.items.map((it) => `<li><a href="${esc(it.href)}">${esc(it.label)}</a></li>`).join('')}</ul></div>`).join('')}
        </div>
      </div>
    </div>`).join('');
  const mobile = B.menus.map((m) => `
    <details><summary>${esc(m.label)}</summary>${m.groups.map((g) => `<h3>${esc(g.title)}</h3><ul>${g.items.map((it) => `<li><a href="${esc(it.href)}">${esc(it.label)}</a></li>`).join('')}</ul>`).join('')}</details>`).join('');
  $('#nav').innerHTML = `
    <div class="nav-in">
      ${logo}
      <nav class="menus" aria-label="Primary">${menus}</nav>
      <div class="actions">
        <span class="lang">${esc(B.navActions.language)}</span>
        <a class="a-link" href="${esc(B.navActions.signup.href)}">${esc(B.navActions.signup.label)}</a>
        <a class="a-link" href="${esc(B.navActions.login.href)}">${esc(B.navActions.login.label)}</a>
        <a class="btn btn-sm" href="#cta">${esc(B.navActions.connect)}</a>
      </div>
      <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i></button>
    </div>
    <div class="mobile" id="mobile">${mobile}
      <div class="m-act"><a href="${esc(B.navActions.signup.href)}">${esc(B.navActions.signup.label)}</a><a href="${esc(B.navActions.login.href)}">${esc(B.navActions.login.label)}</a><a class="btn" href="#cta">${esc(B.navActions.connect)}</a></div>
    </div>`;
  const nav = $('#nav');
  const closeMenus = () => { $$('.menu', nav).forEach((m) => { m.classList.remove('open'); $('.menu-btn', m).setAttribute('aria-expanded', 'false'); }); };
  $$('.menu', nav).forEach((m) => {
    const btn = $('.menu-btn', m);
    const open = () => { closeMenus(); m.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); };
    btn.addEventListener('click', () => (m.classList.contains('open') ? closeMenus() : open()));
    m.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover)').matches) open(); });
    m.addEventListener('mouseleave', () => { if (matchMedia('(hover:hover)').matches) closeMenus(); });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });
  const burger = $('.burger', nav);
  burger.addEventListener('click', () => {
    const o = nav.classList.toggle('mopen');
    burger.setAttribute('aria-expanded', o);
  });
  $$('#mobile a', nav).forEach((a) => a.addEventListener('click', () => nav.classList.remove('mopen')));

  /* ---------- hero ---------- */
  $('#hero').innerHTML = `
    <div class="wrap hero-in">
      <h1 class="h1" aria-label="${esc(B.hero.h1)}">
        <span class="rot" aria-hidden="true">${B.hero.words.map((w, i) => `<span class="rw${i === 0 ? ' on' : ''}">${esc(w)}</span>`).join('')}</span>
        <span class="rest" aria-hidden="true">${lines((() => { const w = B.hero.rest.split(' '); const m = Math.ceil(w.length / 2); return [w.slice(0, m).join(' '), w.slice(m).join(' ')]; })())}</span>
      </h1>
      <p class="sub">${esc(B.hero.sub)}</p>
      <a class="btn" href="#cta">${esc(B.hero.cta)}</a>
    </div>`;

  /* ---------- trust ---------- */
  const tl = B.trust.logos.map((s) => `<img src="${esc(s)}" alt="">`).join('');
  $('#trust').innerHTML = `
    <div class="wrap"><h2 class="h3 reveal" data-split>${split(B.trust.title)}</h2></div>
    <div class="marq" aria-hidden="false"><div class="track">${tl}${tl}</div></div>`;

  /* ---------- badges ---------- */
  $('#badges').innerHTML = `<div class="wrap">${B.badges.map((b, i) => `<p class="badge b${i} reveal" data-split>${split(b.label)}</p>`).join('')}</div>`;

  /* ---------- core ---------- */
  const core = B.core;
  $('#core').innerHTML = `
    <div class="stick">
      <div class="wrap core-in">
        <h2 class="h2 reveal" data-split>${lines(core.title)}</h2>
        <ol class="clist">${core.items.map((it, i) => `
          <li class="ci${i === 0 ? ' on' : ''}" data-i="${i}"><button type="button"><span class="ct">${esc(it.title)}</span><span class="cs">${esc(it.short)}</span></button></li>`).join('')}
        </ol>
        <div class="cdetail">${core.items.map((it, i) => `
          <div class="cd${i === 0 ? ' on' : ''}" data-i="${i}"><p>${esc(it.long)}</p><a class="more" href="${esc(it.cta.href)}">${esc(it.cta.label)} ${arrow}</a></div>`).join('')}
        </div>
      </div>
    </div>`;

  /* ---------- established ---------- */
  const est = B.established;
  $('#established').innerHTML = `
    <div class="wrap est-in">
      <div class="est-head">
        <h2 class="h2 reveal" data-split>${split(est.title)}</h2>
        <p class="lead reveal" data-split>${split(est.text)}</p>
        <a class="btn" href="${esc(est.cta.href)}">${esc(est.cta.label)}</a>
      </div>
      <ul class="est-logos">${est.logos.map((l, i) => {
        const inner = `<img src="${esc(l.image)}" alt="${esc(l.name)}">${l.text ? `<span class="tip">${esc(l.text)}</span>` : ''}`;
        return `<li class="el e${i}">${l.href ? `<a href="${esc(l.href)}">${inner}</a>` : `<div class="plain" tabindex="0">${inner}</div>`}</li>`;
      }).join('')}</ul>
    </div>`;

  /* ---------- build ---------- */
  const bd = B.build;
  $('#build').innerHTML = `
    <div class="wrap">
      <h2 class="h2 reveal" data-split>${split(bd.title)}</h2>
      <div class="pillars">${bd.cards.map((c) => `
        <article class="pil"><h3>${esc(c.label)}</h3><p>${esc(c.text)}</p><a class="more" href="${esc(c.cta.href)}">${esc(c.cta.label)} ${arrow}</a></article>`).join('')}
      </div>
    </div>`;

  /* ---------- support ---------- */
  $('#support').innerHTML = `
    <div class="wrap">
      <h2 class="h1b reveal" data-split>${split(B.support.label)}</h2>
      <p class="lead reveal" data-split>${split(B.support.title)}</p>
      <ul class="hours">${B.support.items.map((t, i) => `<li class="hr q${i}">${esc(t)}</li>`).join('')}</ul>
    </div>`;

  /* ---------- own ---------- */
  $('#own').innerHTML = `
    <div class="wrap">
      <h2 class="h2 reveal" data-split>${split(B.own.title)}</h2>
      <div class="own-list">${B.own.items.map((it, i) => `
        <article class="oi o${i}"><h3 class="reveal" data-split>${split(it.title)}</h3><p>${esc(it.text)}</p></article>`).join('')}
      </div>
    </div>`;

  /* ---------- spotlight ---------- */
  $('#spotlight').innerHTML = `
    <div class="wrap">
      <h2 class="h2 reveal" data-split>${split(B.spotlight.label)}</h2>
      <div class="clips">${B.spotlight.slides.map((s, i) => `
        <a class="clip c${i}" href="${esc(s.video)}" target="_blank" rel="noopener"><span class="play" aria-hidden="true"></span><span class="ctitle">${esc(s.title)}</span></a>`).join('')}
      </div>
    </div>`;

  /* ---------- latest ---------- */
  $('#latest').innerHTML = `
    <div class="wrap">
      <div class="lat-head"><h2 class="h2 reveal" data-split>${split(B.latest.title)}</h2><a class="more" href="${esc(B.latest.all.href)}">${esc(B.latest.all.label)} ${arrow}</a></div>
      <ul class="posts">${B.latest.posts.map((p) => `<li><a href="${esc(p.href)}"><span>${esc(p.title)}</span><b aria-hidden="true">${arrow}</b></a></li>`).join('')}</ul>
    </div>`;

  /* ---------- cta ---------- */
  $('#cta').innerHTML = `
    <div class="wrap cta-in">
      <h2 class="h1b reveal" data-split>${lines(B.cta.title)}</h2>
      <a class="btn btn-lg" href="${esc(B.BITGO)}">${esc(B.cta.button)}</a>
    </div>`;

  /* ---------- footer ---------- */
  const F = B.footer;
  $('#footer').innerHTML = `
    <div class="wrap">
      <div class="f-top">
        <form class="news" onsubmit="return false"><label for="em">${esc(F.newsletter)}</label>
          <div class="nrow"><input id="em" type="email" placeholder="${esc(F.email)}" autocomplete="email"><button class="btn btn-sm" type="submit">${esc(F.subscribe)}</button></div></form>
        <ul class="socials">${F.socials.map((s) => `<li><a href="${esc(s.href)}">${esc(s.label)}</a></li>`).join('')}</ul>
      </div>
      <div class="f-links">${B.menus.map((m) => m.groups.map((g) => `<div><h4>${esc(m.label)}: ${esc(g.title)}</h4><ul>${g.items.slice(0, 7).map((it) => `<li><a href="${esc(it.href)}">${esc(it.label)}</a></li>`).join('')}</ul></div>`).join('')).join('')}</div>
      <div class="legal">${F.legal.map((t) => `<p>${esc(t)}</p>`).join('')}
        <p>${esc(F.review)} <a href="${esc(F.privacy.href)}">${esc(F.privacy.label)}</a> ${esc(F.and)} <a href="${esc(F.disclaimers.href)}">${esc(F.disclaimers.label)}</a>.</p>
        <p>${esc(F.screenReader)}</p><p>${esc(F.complaints)}</p>
        <p>${esc(F.nmls)} &nbsp;|&nbsp; ${esc(F.choices)} &nbsp;|&nbsp; ${esc(F.rights)}</p></div>
    </div>`;

  /* ---------- word reveal ---------- */
  $$('[data-split] .w').forEach((w, i) => {
    const p = w.closest('[data-split]');
    const idx = $$('.w', p).indexOf(w);
    w.style.setProperty('--d', Math.min(idx * 45, 650) + 'ms');
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
    $$('.hero .ln, .hero .rot').forEach((el) => el.classList.add('in'));
  } else {
    $$('.reveal, .hero .ln, .hero .rot').forEach((el) => el.classList.add('in'));
  }
  $$('.hero .ln').forEach((el) => el.classList.add('reveal-now'));
  $$('.hero .ln').forEach((el) => $$('.w', el).forEach((w, i) => w.style.setProperty('--d', 300 + i * 90 + 'ms')));
  requestAnimationFrame(() => document.documentElement.classList.add('ready'));

  /* ---------- hero word rotation (exposed to the light engine) ---------- */
  const rws = $$('.rw');
  window.__heroWord = 0;
  if (!reduce) {
    setInterval(() => {
      rws[window.__heroWord].classList.remove('on');
      window.__heroWord = (window.__heroWord + 1) % rws.length;
      rws[window.__heroWord].classList.add('on');
    }, 3600);
  }

  /* ---------- core scroll chapter ---------- */
  const coreEl = $('#core');
  const ci = $$('.ci', coreEl), cd = $$('.cd', coreEl);
  const setCore = (k) => { ci.forEach((e, i) => e.classList.toggle('on', i === k)); cd.forEach((e, i) => e.classList.toggle('on', i === k)); };
  ci.forEach((li, i) => $('button', li).addEventListener('click', () => {
    const r = coreEl.getBoundingClientRect();
    const total = r.height - innerHeight;
    window.scrollTo({ top: scrollY + r.top + total * ((i + 0.5) / ci.length) - 1 + 0, behavior: 'smooth' });
  }));
  window.__coreProgress = 0;
  window.__coreTick = () => {
    const r = coreEl.getBoundingClientRect();
    const total = Math.max(1, r.height - innerHeight);
    const p = Math.min(1, Math.max(0, -r.top / total));
    window.__coreProgress = p;
    setCore(Math.min(ci.length - 1, Math.floor(p * ci.length)));
  };
  addEventListener('scroll', window.__coreTick, { passive: true });
  window.__coreTick();
})();
