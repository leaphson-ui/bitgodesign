// Builds the page DOM from window.BITGO. Plain script, no WebGL, so text always renders.
(function () {
  const B = window.BITGO, e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const LOGO = '../shared/assets/bitgo-logo.svg';
  const arrow = '<svg class="arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const link = (o, cls = '') => `<a class="${cls}" href="${e(o.href)}">${e(o.label)}</a>`;

  const nav = `
  <header class="nav" id="nav">
    <a class="brand" href="#top" aria-label="BitGo home"><img src="${LOGO}" alt="BitGo" width="108" height="37"></a>
    <nav class="menus" id="menus" aria-label="Main">
      ${B.menus.map(m => `
      <div class="menu">
        <button type="button" aria-expanded="false">${e(m.label)}</button>
        <div class="panel"><div class="panel-in">
          ${m.groups.map(g => `<div class="grp"><h3>${e(g.title)}</h3><ul${g.items.length > 8 ? ' class="two"' : ''}>${g.items.map(i => `<li><a href="${e(i.href)}">${e(i.label)}</a></li>`).join('')}</ul></div>`).join('')}
        </div></div>
      </div>`).join('')}
    </nav>
    <div class="nav-actions">
      <span class="lang">${e(B.navActions.language)}</span>
      ${link(B.navActions.login, 'tl')}
      ${link(B.navActions.signup, 'tl')}
      <a class="btn sm" href="#cta">${e(B.navActions.connect)}</a>
    </div>
    <button class="burger" id="burger" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
  </header>`;

  const hero = `
  <section id="hero" class="hero" data-nav="light" data-pin="hero">
    <div class="pin">
      <div class="stage hero-stage" data-stage="vault,desk,tower" data-ground="0"></div>
      <div class="hero-copy">
        <h1 aria-label="${e(B.hero.h1)}">
          <span class="rot" aria-hidden="true">${B.hero.words.map((w, i) => `<span class="w" data-i="${i}">${e(w)}</span>`).join('')}</span>
          <span class="rest" aria-hidden="true">${e(B.hero.rest)}</span>
        </h1>
        <div class="hero-foot">
          <p class="sub">${e(B.hero.sub)}</p>
          <a class="btn" href="#cta">${e(B.hero.cta)}</a>
        </div>
      </div>
    </div>
  </section>`;

  const row = (arr) => arr.map(l => `<img src="${e(l)}" alt="">`).join('');
  const trust = `
  <section id="trust" class="trust" data-nav="light">
    <div class="trust-top wrap">
      <h2>${e(B.trust.title)}</h2>
      <div class="stage trust-stage" data-stage="bank" data-ground="0"></div>
    </div>
    <div class="logo-rows" aria-label="Clients">
      <div class="logo-row" data-dir="-1"><div class="track">${row(B.trust.logos)}${row(B.trust.logos)}</div></div>
      <div class="logo-row" data-dir="1"><div class="track">${row(B.trust.logos.slice().reverse())}${row(B.trust.logos.slice().reverse())}</div></div>
    </div>
  </section>`;

  const badges = `
  <section id="badges" class="badges" data-nav="dark">
    <div class="wrap">
      ${B.badges.map((b, i) => `<p class="badge b${i}">${e(b.label)}</p>`).join('')}
    </div>
  </section>`;

  const core = `
  <section id="core" class="core" data-nav="dark" data-pin="core">
    <div class="pin">
      <div class="wrap core-grid">
        <div class="core-left">
          <h2>${B.core.title.map(t => `<span>${e(t)}</span>`).join(' ')}</h2>
          <ul class="svc" id="svc">
            ${B.core.items.map((it, i) => `
            <li class="${i === 0 ? 'on' : ''}" data-i="${i}">
              <button type="button" class="svc-h"><span class="svc-t">${e(it.title)}</span><span class="svc-s">${e(it.short)}</span></button>
              <div class="svc-b"><div><p>${e(it.long)}</p>${link(it.cta, 'more')}</div></div>
            </li>`).join('')}
          </ul>
        </div>
        <div class="stage core-stage" data-stage="safe" data-ground="1"></div>
      </div>
    </div>
  </section>`;

  const est = B.established;
  const established = `
  <section id="established" class="est" data-nav="light">
    <div class="wrap">
      <div class="est-head">
        <h2>${e(est.title)}</h2>
        <div class="est-side"><p>${e(est.text)}</p>${link(est.cta, 'btn ghost')}</div>
      </div>
      <ul class="tiles">
        ${est.logos.map(l => `
        <li class="tile${l.text ? ' has' : ''}" tabindex="0">
          <img src="${e(l.image)}" alt="${e(l.name)}">
          ${l.text ? `<a class="hov" href="${e(l.href)}"><span>${e(l.text)}</span>${arrow}</a>` : ''}
        </li>`).join('')}
      </ul>
    </div>
    <div class="stage est-stage" data-stage="viaduct" data-ground="0"></div>
  </section>`;

  const build = B.build;
  const buildS = `
  <section id="build" class="build" data-nav="light">
    <div class="wrap build-grid">
      <div class="build-left">
        <h2>${e(build.title)}</h2>
        <ul class="steps">
          ${build.cards.map((c, i) => `
          <li style="--k:${i}"><h3>${e(c.label)}</h3><p>${e(c.text)}</p><a class="more" href="${e(c.cta.href)}">${e(c.cta.label)}${arrow}</a></li>`).join('')}
        </ul>
      </div>
      <div class="stage build-stage" data-stage="bridge" data-ground="0"></div>
    </div>
  </section>`;

  const sup = B.support;
  const support = `
  <section id="support" class="support" data-nav="light">
    <div class="wrap">
      <h2>${e(sup.label)}</h2>
      <p class="sup-lead">${e(sup.title)}</p>
      <div class="stage sup-stage" data-stage="clock" data-ground="0"></div>
      <ul class="sup-list">${sup.items.map(t => `<li>${e(t)}</li>`).join('')}</ul>
    </div>
  </section>`;

  const own = B.own;
  const ownS = `
  <section id="own" class="own" data-nav="light">
    <div class="wrap own-grid">
      <div class="stage own-stage" data-stage="globe" data-ground="0"></div>
      <div class="own-right">
        <h2>${e(own.title)}</h2>
        <ul class="own-list">${own.items.map(i => `<li><h3>${e(i.title)}</h3><p>${e(i.text)}</p></li>`).join('')}</ul>
      </div>
    </div>
  </section>`;

  const sp = B.spotlight;
  const spotlight = `
  <section id="spotlight" class="spot" data-nav="dark">
    <div class="wrap">
      <h2>${e(sp.label)}</h2>
      <div class="stage spot-stage" data-stage="camera" data-ground="1"></div>
      <ul class="slats">
        ${sp.slides.map((s, i) => `
        <li style="--k:${i}"><a href="${e(s.video)}" target="_blank" rel="noopener">
          <span class="frame"><canvas aria-hidden="true"></canvas><span class="play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span></span>
          <span class="cap">${e(s.title)}</span></a></li>`).join('')}
      </ul>
    </div>
  </section>`;

  const lt = B.latest;
  const latest = `
  <section id="latest" class="latest" data-nav="light">
    <div class="wrap">
      <div class="latest-head"><h2>${e(lt.title)}</h2><div class="stage latest-stage" data-stage="news" data-ground="0"></div></div>
      <ul class="posts">${lt.posts.map(p => `<li><a href="${e(p.href)}"><span>${e(p.title)}</span>${arrow}</a></li>`).join('')}</ul>
      <p class="all">${link(lt.all, 'btn ghost')}</p>
    </div>
  </section>`;

  const cta = `
  <section id="cta" class="cta" data-nav="dark">
    <div class="wrap">
      <h2>${B.cta.title.map(t => `<span>${e(t)}</span>`).join(' ')}</h2>
      <a class="btn white" href="https://www.bitgo.com/contact-us/">${e(B.cta.button)}</a>
    </div>
    <div class="stage cta-stage" data-stage="skyline" data-ground="1"></div>
  </section>`;

  const f = B.footer;
  const footer = `
  <footer class="foot" data-nav="dark">
    <div class="wrap">
      <div class="foot-top">
        <img class="foot-logo" src="${LOGO}" alt="BitGo" width="150" height="51">
        <form class="news" onsubmit="return false">
          <label for="nl">${e(f.newsletter)}</label>
          <div class="nl-row"><input id="nl" type="email" placeholder="${e(f.email)}" autocomplete="email"><button class="btn white" type="submit">${e(f.subscribe)}</button></div>
        </form>
        <ul class="socials">${f.socials.map(s => `<li><a href="${e(s.href)}">${e(s.label)}</a></li>`).join('')}</ul>
      </div>
      <div class="legal">
        ${f.legal.map(p => `<p>${e(p)}</p>`).join('')}
        <p>${e(f.review)} <a href="${e(f.privacy.href)}">${e(f.privacy.label)}</a> ${e(f.and)} <a href="${e(f.disclaimers.href)}">${e(f.disclaimers.label)}</a>.</p>
        <p>${e(f.screenReader)}</p>
        <p>${e(f.complaints)}</p>
        <p>${e(f.nmls)} · <a href="${e(f.privacy.href)}">${e(f.choices)}</a> · ${e(f.rights)}</p>
      </div>
    </div>
  </footer>`;

  document.getElementById('app').innerHTML =
    `<a class="skip" href="#hero">${e(B.skip)}</a>` + nav + '<main id="top">' + hero + trust + badges + core + established + buildS + support + ownS + spotlight + latest + cta + '</main>' + footer;
})();
