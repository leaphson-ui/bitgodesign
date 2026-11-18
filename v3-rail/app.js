/* Builds the page DOM from window.BITGO. Every [data-d] block is a stop on the rail (d = distance along it). */
(function () {
  var B = window.BITGO;
  var LOGO = '../shared/assets/bitgo-logo.svg';
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var arrow = '<svg class="arr" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- nav ---------- */
  document.getElementById('nav').innerHTML = '<div class="nav-in">' +
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
  document.getElementById('skip').textContent = B.skip;

  /* ---------- sections ---------- */
  var H = B.hero, T = B.trust, C = B.core, E = B.established, BU = B.build, S = B.support, O = B.own, SP = B.spotlight, L = B.latest, CT = B.cta;
  var out = [];
  // stop(d, side, vh, inner, cls, attrs): one block on the rail
  var stop = function (d, side, vh, inner, cls, extra) {
    return '<div class="stop s' + side + (cls ? ' ' + cls : '') + '" data-d="' + d + '" data-side="' + side + '" style="min-height:' + vh + 'vh"' + (extra || '') + '><div class="wrap"><div class="txt">' + inner + '</div></div></div>';
  };
  var space = function (d, side, vh) { return '<div class="stop space" data-d="' + d + '" data-side="' + side + '" style="min-height:' + vh + 'vh" aria-hidden="true"></div>'; };

  out.push('<section id="hero" class="sec">' + stop(0, 'L', 100,
    '<h1 class="h1"><span class="rot" aria-live="off">' + H.words.map(function (w, i) { return '<span class="rw' + (i === 0 ? ' on' : '') + '">' + esc(w) + '</span>'; }).join('') + '</span> <span class="h1-rest">' + esc(H.rest) + '</span></h1>' +
    '<p class="lede">' + esc(H.sub) + ' Hold, trade, move, earn, issue and build on one stack.</p>' +
    '<a class="btn" href="#cta">' + esc(H.cta) + '</a>', 'hero-s') + '</section>');

  out.push('<section id="trust" class="sec">' + stop(70, 'L', 60, '<h2 class="h2">' + esc(T.title) + '</h2>') + space(150, 'L', 45) + '</section>');

  out.push('<section id="badges" class="sec">' + B.badges.map(function (b, i) {
    return stop(190 + i * 40, i === 1 ? 'R' : 'L', 55, '<p class="badge-t">' + esc(b.label) + '</p>', 'badge');
  }).join('') + '</section>');

  out.push('<section id="core" class="sec">' + stop(315, 'L', 70, '<h2 class="h2">' + C.title.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join(' ') + '</h2>') +
    C.items.map(function (x, i) {
      return stop(360 + i * 45, i % 2 ? 'R' : 'L', 66, '<h3 class="h3">' + esc(x.title) + '</h3><p class="short">' + esc(x.short) + '</p><p class="long">' + esc(x.long) + '</p><a class="tlink" href="' + esc(x.cta.href) + '">' + esc(x.cta.label) + arrow + '</a>', 'svc');
    }).join('') +
    stop(585, 'L', 70, '<img class="pt-logo" src="' + LOGO + '" alt="" width="150" height="51"><p class="h2 pt-p">' + esc(H.sub) + '</p>', 'pt') + '</section>');

  out.push('<section id="established" class="sec">' + stop(640, 'L', 130,
    '<h2 class="h2">' + esc(E.title) + '</h2><p class="est-p">' + esc(E.text) + '</p><a class="btn btn-w" href="' + esc(E.cta.href) + '">' + esc(E.cta.label) + '</a>' +
    '<ul class="est-list">' + E.logos.map(function (l) {
      return '<li class="est-i' + (l.text ? ' has' : '') + '"><a href="' + esc(l.href || E.cta.href) + '"><span class="est-logo"><img src="' + esc(l.image) + '" alt="' + esc(l.name) + '" loading="lazy"></span>' +
        (l.text ? '<span class="est-t">' + esc(l.text) + '</span>' : '') + '</a></li>';
    }).join('') + '</ul>', 'est blue') + '</section>');

  var sidesB = ['R', 'L', 'L'];
  out.push('<section id="build" class="sec">' + stop(695, 'L', 55, '<h2 class="h2">' + esc(BU.title) + '</h2>') +
    BU.cards.map(function (c, i) {
      return stop(735 + i * 40, sidesB[i], 70, '<h3 class="h3">' + esc(c.label) + '</h3><p class="short">' + esc(c.text) + '</p><a class="tlink" href="' + esc(c.cta.href) + '">' + esc(c.cta.label) + arrow + '</a>', 'card');
    }).join('') + '</section>');

  out.push('<section id="support" class="sec">' + stop(855, 'L', 55, '<h2 class="h2">' + esc(S.title) + '</h2><p class="sup-247">' + esc(S.label) + '</p>') +
    S.items.map(function (t, i) { return stop(885 + i * 25, i % 2 ? 'L' : 'R', 40, '<p class="sup-i">' + esc(t) + '</p>', 'supi'); }).join('') + '</section>');

  out.push('<section id="own" class="sec">' + stop(1030, 'L', 55, '<h2 class="h2">' + esc(O.title) + '</h2>') +
    O.items.map(function (it, i) { return stop(1075 + i * 45, i % 2 ? 'R' : 'L', 66, '<h3 class="h3">' + esc(it.title) + '</h3><p class="long">' + esc(it.text) + '</p>', 'own-i'); }).join('') + '</section>');

  out.push('<section id="spotlight" class="sec">' + stop(1310, 'C', 110, '<h2 class="h2">' + esc(SP.label) + '</h2><div class="spot-grid">' + SP.slides.map(function (s, i) {
    return '<a class="vid v' + i + '" href="' + esc(s.video) + '" target="_blank" rel="noopener"><span class="poster" aria-hidden="true"><i class="pl"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5l12 7-12 7z" fill="currentColor"/></svg></i></span><span class="vt">' + esc(s.title) + '</span></a>';
  }).join('') + '</div>', 'wide') + '</section>');

  out.push('<section id="latest" class="sec">' + stop(1370, 'R', 100, '<div class="lat-head"><h2 class="h2">' + esc(L.title) + '</h2><a class="tlink" href="' + esc(L.all.href) + '">' + esc(L.all.label) + arrow + '</a></div>' +
    '<ul class="posts">' + L.posts.map(function (p) { return '<li><a href="' + esc(p.href) + '"><span class="pt">' + esc(p.title) + '</span><span class="pgo">' + arrow + '</span></a></li>'; }).join('') + '</ul>', 'wide') + '</section>');

  out.push('<section id="cta" class="sec">' + stop(1430, 'L', 110,
    '<h2 class="cta-h"><span>' + esc(CT.title[0]) + '</span> <em>' + esc(CT.title[1]) + '</em></h2><a class="btn btn-w btn-lg" href="https://www.bitgo.com/contact-us/">' + esc(CT.button) + '</a>', 'blue cta-s') + '</section>');

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

  /* ---------- ui ---------- */
  var nav = $('#nav');
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('.burger').addEventListener('click', function () { var o = nav.classList.toggle('open'); this.setAttribute('aria-expanded', o); });
  $$('.drawer a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); }); });
  var onScr = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScr, { passive: true }); onScr();

  var ws = $$('.rw');
  if (ws.length > 1 && !rm) {
    var i = 0;
    setInterval(function () {
      var cur = ws[i], nx = ws[(i + 1) % ws.length];
      cur.classList.remove('on'); cur.classList.add('out'); nx.classList.add('on');
      setTimeout(function () { cur.style.transition = 'none'; cur.classList.remove('out'); void cur.offsetWidth; cur.style.transition = ''; }, 900);
      i = (i + 1) % ws.length;
    }, 2600);
  }

  /* each block fades in as it nears the middle of the screen */
  if ('IntersectionObserver' in window && !rm) {
    document.documentElement.classList.add('fx');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('in', e.isIntersecting); });
    }, { rootMargin: '-8% 0px -8% 0px', threshold: 0 });
    $$('.stop:not(.space) .txt').forEach(function (t) { io.observe(t); });
  } else $$('.txt').forEach(function (t) { t.classList.add('in'); });
})();
