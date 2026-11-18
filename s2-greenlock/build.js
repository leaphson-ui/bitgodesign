/* Builds the page DOM from window.BITGO (live copy). */
(function () {
  const B = window.BITGO;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const arrow = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 11 11 3M5 3h6v6"/></svg>';
  const LOGO = '../shared/assets/bitgo-logo.svg';

  /* nav */
  const menus = B.menus.map((m) => `<li><button type="button" aria-expanded="false">${esc(m.label)}</button><div class="panel"><div class="panel-in">${m.groups.map((g) => `<div><h4>${esc(g.title)}</h4><ul>${g.items.map((i) => `<li><a href="${i.href}">${esc(i.label)}</a></li>`).join('')}</ul></div>`).join('')}</div></div></li>`).join('');
  $('#nav').innerHTML = `<div class="nav-in"><a class="nav-logo" href="${B.BITGO}"><img src="${LOGO}" alt="BitGo" width="71" height="24"></a><ul class="nav-menus">${menus}</ul><div class="nav-act"><span class="lang">${esc(B.navActions.language)}</span><a class="login" href="${B.navActions.signup.href}">${esc(B.navActions.signup.label)}</a><a class="login" href="${B.navActions.login.href}">${esc(B.navActions.login.label)}</a><a class="btn" href="#cta">${esc(B.navActions.connect)}</a><button class="burger" type="button" aria-label="Menu"><span></span><span></span></button></div></div>`;
  $('#skip').textContent = B.skip;

  const layers = [['Hold', '#0b1630'], ['Trade', '#0b2a8f'], ['Move', '#1647DB'], ['Earn', '#6f93f5'], ['Issue', '#aebfff'], ['Build', '#dce7ff']];
  const serviceGL = ['prime', 'eco', 'stable', 'wallet', 'caas'];
  const own = B.own;
  const spot = B.spotlight;

  const marqueeImgs = B.trust.logos.map((l) => `<img src="${l}" alt="" loading="lazy">`).join('');

  $('#main').innerHTML = `
<section class="hero" id="top">
  <div class="hero-fx" data-gl="blades-hero"></div>
  <div class="wrap">
    <h1 class="h-display"><span class="word" id="word" aria-live="polite"><span>${esc(B.hero.words[0])}</span></span><span class="rest">${esc(B.hero.rest)}</span></h1>
    <p class="hero-sub">${esc(B.hero.sub)}</p>
    <div class="hero-cta"><a class="btn" href="#cta">${esc(B.hero.cta)}</a></div>
    <ul class="layers">${layers.map((l) => `<li><i style="background:${l[1]};box-shadow:0 0 0 1px rgba(11,22,48,.18)"></i>${l[0]}</li>`).join('')}</ul>
  </div>
</section>

<section class="trust">
  <div class="wrap"><h2 class="rv">${esc(B.trust.title)}</h2></div>
  <div class="marq"><div class="marq-t">${marqueeImgs}${marqueeImgs}</div></div>
</section>

<section class="badges">
  <div class="wrap">
    <div class="cred" data-gl="cred"></div>
    <ul class="badge-list">${B.badges.map((b) => `<li class="rv">${esc(b.label)}</li>`).join('')}</ul>
  </div>
</section>

<section class="core" id="core">
  <div class="wrap">
    <h2 class="h-sec core-head rv">${B.core.title.map(esc).join('<br>')}</h2>
    ${B.core.items.map((it, i) => `<article class="svc rv"><h3 class="h-row">${esc(it.title)}</h3><div class="gl-box" data-gl="${serviceGL[i]}"></div><div><p class="short">${esc(it.short)}</p><p class="long">${esc(it.long)}</p><a class="link" href="${it.cta.href}">${esc(it.cta.label)} ${arrow}</a></div></article>`).join('')}
  </div>
</section>

<section class="est" id="est">
  <div class="wrap">
    <div class="est-l">
      <h2 class="h-sec rv">${esc(B.established.title)}</h2>
      <p class="lead rv">${esc(B.established.text)}</p>
      <div class="rv"><a class="btn light" href="${B.established.cta.href}">${esc(B.established.cta.label)}</a></div>
      <div class="est-fx" data-gl="blades-est"></div>
    </div>
    <div class="est-logos">${B.established.logos.map((l) => `<div class="rv"><img src="${l.image}" alt="${esc(l.name)}">${l.text ? `<p>${esc(l.text)}</p>` : ''}</div>`).join('')}</div>
  </div>
</section>

<section class="build" id="build">
  <div class="wrap">
    <div>
      <h2 class="h-sec rv">${esc(B.build.title)}</h2>
      ${B.build.cards.map((c) => `<div class="bi rv"><h3 class="h-row">${esc(c.label)}</h3><a class="link" href="${c.cta.href}">${esc(c.cta.label)} ${arrow}</a><p>${esc(c.text)}</p></div>`).join('')}
    </div>
    <div class="build-gl" data-gl="tiers"></div>
  </div>
</section>

<section class="support" id="support">
  <div class="wrap">
    <h2 class="h-sec rv">${esc(B.support.title)}</h2>
    <div class="ring" data-gl="ring" role="img" aria-label="24 hour ring"></div>
    <ul class="sup-list">${B.support.items.map((s) => `<li class="rv">${esc(s)}</li>`).join('')}</ul>
  </div>
</section>

<section class="own" id="own">
  <div class="wrap">
    <div class="own-l"><div class="own-stick"><h2 class="h-sec rv">${esc(own.title)}</h2><div class="own-gl" data-gl="blocks"></div></div></div>
    <div class="own-r">${own.items.map((o) => `<div class="oi"><h3 class="h-row">${esc(o.title)}</h3><p>${esc(o.text)}</p></div>`).join('')}</div>
  </div>
</section>

<section class="spot" id="spot">
  <div class="wrap">
    <h2 class="h-sec rv">${esc(spot.label)}</h2>
    ${spot.slides.map((s, i) => `<a class="sp rv" href="${s.video}" target="_blank" rel="noopener"><div class="thumb t${i}"><span class="play"></span></div><h3 class="h-row">${esc(s.title)}</h3><span class="link">Watch ${arrow}</span></a>`).join('')}
  </div>
</section>

<section class="latest" id="latest">
  <div class="wrap">
    <div class="top"><h2 class="h-sec rv">${esc(B.latest.title)}</h2><a class="link" href="${B.latest.all.href}">${esc(B.latest.all.label)} ${arrow}</a></div>
    ${B.latest.posts.map((p) => `<a class="post rv" href="${p.href}"><h3 class="h-row">${esc(p.title)}</h3><span class="arr">${arrow}</span></a>`).join('')}
  </div>
</section>

<section class="cta" id="cta">
  <div class="cta-fx" data-gl="blades-cta"></div>
  <div class="wrap">
    <h2 class="h-display rv">${B.cta.title.map(esc).join('<br>')}</h2>
    <a class="btn light rv" href="#">${esc(B.cta.button)}</a>
  </div>
</section>`;

  const f = B.footer;
  $('#foot').innerHTML = `<div class="foot-in">
  <div class="foot-top"><img src="${LOGO}" alt="BitGo" width="71" height="26">
    <form class="news" onsubmit="return false"><p>${esc(f.newsletter)}</p><input type="email" placeholder="${esc(f.email)}" aria-label="${esc(f.email)}"><button class="btn" type="submit">${esc(f.subscribe)}</button></form></div>
  <div class="soc">${f.socials.map((s) => `<a href="${s.href}">${esc(s.label)}</a>`).join('')}</div>
  <div class="legal">${f.legal.map((p) => `<p>${esc(p)}</p>`).join('')}
    <p>${esc(f.review)} <a href="${f.privacy.href}">${esc(f.privacy.label)}</a> ${esc(f.and)} <a href="${f.disclaimers.href}">${esc(f.disclaimers.label)}</a>.</p>
    <p>${esc(f.screenReader)}</p><p>${esc(f.complaints)}</p>
    <p class="nm">${esc(f.nmls)} &middot; ${esc(f.choices)} &middot; ${esc(f.rights)}</p></div></div>`;

  /* nav behaviour */
  const nav = $('#nav');
  const onS = () => nav.classList.toggle('solid', scrollY > 30);
  addEventListener('scroll', onS, { passive: true }); onS();
  nav.querySelectorAll('.nav-menus>li').forEach((li) => {
    const b = li.querySelector('button');
    const set = (o) => { li.classList.toggle('open', o); b.setAttribute('aria-expanded', o); };
    b.addEventListener('click', () => { const o = !li.classList.contains('open'); nav.querySelectorAll('.nav-menus>li').forEach((x) => x.classList.remove('open')); set(o); });
    li.addEventListener('mouseenter', () => { if (innerWidth > 1000) { nav.querySelectorAll('.nav-menus>li').forEach((x) => x.classList.remove('open')); set(true); } });
    li.addEventListener('mouseleave', () => { if (innerWidth > 1000) set(false); });
  });
  nav.querySelector('.burger').addEventListener('click', () => nav.classList.toggle('menu-open'));

  /* reveal */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach((e) => io.observe(e));

  /* rotating word: old leaves fully, then new enters */
  const wordEl = $('#word');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let i = 0;
    setInterval(() => {
      const cur = wordEl.firstElementChild;
      cur.classList.add('out');
      setTimeout(() => {
        i = (i + 1) % B.hero.words.length;
        const n = document.createElement('span');
        n.textContent = B.hero.words[i]; n.className = 'pre';
        wordEl.replaceChildren(n);
        void n.offsetWidth;
        n.classList.remove('pre');
      }, 650);
    }, 3200);
  }
})();
