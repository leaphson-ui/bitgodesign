/* Builds the page DOM from window.BITGO. Runs without any CDN so text is always present. */
(function () {
  var B = window.BITGO;
  var LOGO = '../shared/assets/bitgo-logo.svg';
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var words = function (s, cls) { return s.split(' ').map(function (w) { return '<span class="' + (cls || 'w') + '">' + esc(w) + '</span>'; }).join(' '); };
  var arrow = '<svg class="arr" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  /* ---------- nav ---------- */
  var nav = '<div class="nav-in">' +
    '<a class="nav-logo" href="' + B.BITGO + '" aria-label="BitGo"><img src="' + LOGO + '" alt="BitGo" width="108" height="37"></a>' +
    '<nav class="nav-menus" aria-label="Primary">' + B.menus.map(function (m) {
      return '<div class="mi"><button class="mi-b" aria-haspopup="true">' + esc(m.label) + '</button><div class="panel"><div class="panel-in">' +
        m.groups.map(function (g) {
          return '<div class="pg"><h4>' + esc(g.title) + '</h4><ul>' + g.items.map(function (i) { return '<li><a href="' + esc(i.href) + '">' + esc(i.label) + '</a></li>'; }).join('') + '</ul></div>';
        }).join('') + '</div></div></div>';
    }).join('') + '</nav>' +
    '<div class="nav-act"><span class="lang">' + esc(B.navActions.language) + '</span>' +
    '<a class="na-link" href="' + esc(B.navActions.signup.href) + '">' + esc(B.navActions.signup.label) + '</a>' +
    '<a class="na-link" href="' + esc(B.navActions.login.href) + '">' + esc(B.navActions.login.label) + '</a>' +
    '<a class="btn btn-sm" href="#cta">' + esc(B.navActions.connect) + '</a></div>' +
    '<button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i></button></div>' +
    '<div class="drawer"><div class="drawer-in">' + B.menus.map(function (m) {
      return '<details><summary>' + esc(m.label) + '</summary>' + m.groups.map(function (g) {
        return '<h4>' + esc(g.title) + '</h4><ul>' + g.items.map(function (i) { return '<li><a href="' + esc(i.href) + '">' + esc(i.label) + '</a></li>'; }).join('') + '</ul>';
      }).join('') + '</details>';
    }).join('') + '<div class="drawer-act"><a href="' + esc(B.navActions.login.href) + '">' + esc(B.navActions.login.label) + '</a><a href="' + esc(B.navActions.signup.href) + '">' + esc(B.navActions.signup.label) + '</a><a class="btn" href="#cta">' + esc(B.navActions.connect) + '</a></div></div></div>';
  document.getElementById('nav').innerHTML = nav;
  document.getElementById('skip').textContent = B.skip;

  /* ---------- sections ---------- */
  var H = B.hero, T = B.trust, C = B.core, E = B.established, BU = B.build, S = B.support, O = B.own, SP = B.spotlight, L = B.latest, CT = B.cta;
  var out = [];

  // stage = hero + trust + core share the WebGL canvas
  out.push('<div id="stage" class="stage">');

  out.push('<section id="hero" class="hero" data-theme="dark"><div class="hero-in">' +
    '<h1 class="h1"><span class="rot" aria-live="off">' + H.words.map(function (w, i) { return '<span class="rw' + (i === 0 ? ' on' : '') + '">' + esc(w) + '</span>'; }).join('') + '</span> <span class="h1-rest">' + esc(H.rest) + '</span></h1>' +
    '<div class="hero-side"><p class="lede dimwords">' + words(H.sub + ' Hold, trade, move, earn, issue and build on one stack.', 'dw') + '</p>' +
    '<a class="btn" href="#cta">' + esc(H.cta) + '</a></div>' +
    '<div class="hero-scroll" aria-hidden="true"><i></i></div></div></section>');

  var logos = T.logos.map(function (l) { return '<img src="' + esc(l) + '" alt="" height="34" loading="lazy">'; }).join('');
  out.push('<section id="trust" class="trust" data-theme="dark"><div class="wrap"><h2 class="h2 trust-h">' + esc(T.title) + '</h2></div>' +
    '<div class="marq"><div class="marq-row" data-dir="-1">' + logos + logos + '</div></div>' +
    '<div class="marq m2"><div class="marq-row" data-dir="1">' + logos + logos + '</div></div>' +
    '<div class="wrap badges">' + B.badges.map(function (b, i) { return '<div class="badge b' + i + '"><span class="bdot"></span><span class="btxt">' + esc(b.label) + '</span></div>'; }).join('') + '</div></section>');

  var xs = C.items;
  out.push('<section id="core" class="core" data-theme="dark"><div class="core-pin">' +
    '<h2 class="core-title">' + C.title.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join(' ') + '</h2>' +
    '<div class="flow-labels" aria-hidden="true">' + xs.map(function (x, i) { return '<div class="flow-label" data-i="' + i + '"><i></i><b>' + esc(x.title) + '</b></div>'; }).join('') + '</div>' +
    '<div class="core-copy">' + xs.map(function (x, i) {
      return '<article class="svc" data-i="' + i + '"><h3>' + esc(x.title) + '</h3><p class="short">' + esc(x.short) + '</p><p class="long">' + words(x.long) + '</p><a class="tlink" href="' + esc(x.cta.href) + '">' + esc(x.cta.label) + arrow + '</a></article>';
    }).join('') + '</div>' +
    '<div class="core-point"><img src="' + LOGO + '" alt="" width="150" height="51"><p class="core-fin">' + esc(H.sub) + '</p></div>' +
    '</div></section>');
  out.push('</div>');


  var pos = [[13, 24], [38, 9], [65, 12], [88, 30], [90, 70], [66, 90], [35, 88], [10, 68]];
  var lines = pos.map(function (p, i) {
    var mx = (p[0] + 50) / 2, my = (p[1] + 50) / 2, dx = 50 - p[0], dy = 50 - p[1];
    var cx = mx - dy * 0.22 * (i % 2 ? 1 : -1), cy = my + dx * 0.22 * (i % 2 ? 1 : -1);
    return '<path d="M' + p[0] + ' ' + p[1] + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' 50 50" class="nl"/><path d="M' + p[0] + ' ' + p[1] + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' 50 50" class="np" pathLength="100" style="animation-delay:-' + (i * 0.9).toFixed(1) + 's"/>';
  }).join('');
  out.push('<section id="established" class="est" data-theme="dark"><div class="est-glow" aria-hidden="true"></div><div class="wrap">' +
    '<div class="est-head"><h2 class="h2">' + esc(E.title) + '</h2><div class="est-side"><p class="est-p">' + esc(E.text) + '</p><a class="btn btn-w" href="' + esc(E.cta.href) + '">' + esc(E.cta.label) + '</a></div></div>' +
    '<div class="est-net"><svg class="est-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + lines + '</svg>' +
    '<div class="est-hub" aria-hidden="true"><img src="' + LOGO + '" alt="" width="120" height="41"></div>' +
    '<ul class="est-list">' + E.logos.map(function (l, i) {
      return '<li class="est-i' + (l.text ? ' has' : '') + (pos[i][1] > 60 ? ' up' : '') + '" style="left:' + pos[i][0] + '%;top:' + pos[i][1] + '%"><a href="' + esc(l.href || E.cta.href) + '"><span class="est-logo"><img src="' + esc(l.image) + '" alt="' + esc(l.name) + '" loading="lazy"></span>' +
        (l.text ? '<span class="est-t">' + esc(l.text) + '</span>' : '') + '</a></li>';
    }).join('') + '</ul></div></div></section>');


  var kinds = ['account', 'stake', 'network'];
  out.push('<section id="build" class="build" data-theme="dark"><div class="wrap"><h2 class="h2 build-h">' + esc(BU.title) + '</h2>' +
    '<div class="cards">' + BU.cards.map(function (c, i) {
      return '<article class="card c' + i + '"><canvas class="dia" data-kind="' + kinds[i] + '" aria-hidden="true"></canvas><div class="card-t"><h3>' + esc(c.label) + '</h3><p>' + esc(c.text) + '</p>' +
        '<a class="tlink" href="' + esc(c.cta.href) + '">' + esc(c.cta.label) + arrow + '</a></div></article>';
    }).join('') + '</div></div></section>');


  out.push('<section id="support" class="support" data-theme="dark"><div class="wrap sup-grid">' +
    '<div class="sup-head"><h2 class="h2">' + esc(S.title) + '</h2>' +
    '<ul class="sup-list">' + S.items.map(function (t, i) { return '<li data-i="' + i + '"><span class="sl-dot"></span>' + esc(t) + '</li>'; }).join('') + '</ul></div>' +
    '<div class="dial-wrap"><canvas id="dial" aria-hidden="true"></canvas><span class="sup-247">' + esc(S.label) + '</span></div></div></section>');

  out.push('<section id="own" class="own" data-theme="dark"><div class="wrap own-grid"><div class="own-head"><h2 class="h2">' + esc(O.title) + '</h2></div>' +
    '<div class="own-rail"><div class="rail" aria-hidden="true"><i class="rail-fill"></i></div><ol class="own-list">' + O.items.map(function (it, i) {
      return '<li class="own-i" data-i="' + i + '"><span class="own-node" aria-hidden="true"></span><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p></li>';
    }).join('') + '</ol></div></div></section>');

  var posters = ['p0', 'p1', 'p2'], stills = ['converge', 'rail', 'frames'];
  out.push('<section id="spotlight" class="spot" data-theme="dark"><div class="wrap"><h2 class="h2 spot-h">' + esc(SP.label) + '</h2><div class="spot-grid">' + SP.slides.map(function (s, i) {
    return '<a class="vid ' + posters[i] + '" href="' + esc(s.video) + '" target="_blank" rel="noopener"><span class="poster" aria-hidden="true"><canvas class="still" data-kind="' + stills[i] + '"></canvas><i class="pl"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5l12 7-12 7z" fill="currentColor"/></svg></i></span><span class="vt">' + esc(s.title) + '</span></a>';
  }).join('') + '</div></div></section>');

  out.push('<section id="latest" class="latest" data-theme="dark"><div class="wrap"><div class="lat-head"><h2 class="h2">' + esc(L.title) + '</h2><a class="tlink" href="' + esc(L.all.href) + '">' + esc(L.all.label) + arrow + '</a></div>' +
    '<ul class="posts">' + L.posts.map(function (p) { return '<li><a href="' + esc(p.href) + '"><span class="pt">' + esc(p.title) + '</span><span class="pgo">' + arrow + '</span></a></li>'; }).join('') + '</ul></div></section>');


  out.push('<section id="cta" class="cta" data-theme="dark"><div class="wrap"><div class="cta-panel"><canvas id="ctaflow" aria-hidden="true"></canvas><div class="cta-in"><h2 class="cta-h"><span>' + esc(CT.title[0]) + '</span> <em>' + esc(CT.title[1].split(' ')[0]) + '</em> <span>' + esc(CT.title[1].split(' ').slice(1).join(' ')) + '</span></h2>' +
    '<a class="btn btn-w btn-lg" href="https://www.bitgo.com/contact-us/">' + esc(CT.button) + '</a></div></div></div></section>');

  document.getElementById('main').innerHTML = out.join('');

  /* ---------- footer ---------- */
  var F = B.footer;
  document.getElementById('footer').innerHTML = '<div class="wrap foot">' +
    '<div class="foot-top"><img class="foot-logo" src="' + LOGO + '" alt="BitGo" width="150" height="51">' +
    '<form class="news" onsubmit="return false"><label for="em">' + esc(F.newsletter) + '</label><div class="news-r"><input id="em" type="email" placeholder="' + esc(F.email) + '" autocomplete="email"><button class="btn btn-w" type="submit">' + esc(F.subscribe) + '</button></div></form>' +
    '<ul class="soc">' + F.socials.map(function (s) { return '<li><a href="' + esc(s.href) + '">' + esc(s.label) + '</a></li>'; }).join('') + '</ul></div>' +
    '<div class="legal">' + F.legal.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
    '<p>' + esc(F.review) + ' <a href="' + esc(F.privacy.href) + '">' + esc(F.privacy.label) + '</a> ' + esc(F.and) + ' <a href="' + esc(F.disclaimers.href) + '">' + esc(F.disclaimers.label) + '</a>.</p>' +
    '<p>' + esc(F.screenReader) + '</p><p>' + esc(F.complaints) + '</p><p>' + esc(F.nmls) + '</p></div>' +
    '<div class="foot-b"><span>' + esc(F.choices) + '</span><span>' + esc(F.rights) + '</span></div></div>';
})();
