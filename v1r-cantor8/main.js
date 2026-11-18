(function () {
  const B = window.BITGO;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- content ---------- */
  // nav
  const menus = $('#navMenus');
  B.menus.forEach(m => {
    const d = el('div');
    const b = el('button', '', esc(m.label)); b.setAttribute('aria-haspopup', 'true');
    const mg = el('div', 'mega');
    m.groups.forEach(g => {
      const c = el('div', 'col'); c.innerHTML = '<h4>' + esc(g.title) + '</h4>';
      const inner = el('div'); if (g.items.length > 10) inner.style.columns = 2, inner.style.columnGap = '28px';
      g.items.forEach(i => inner.appendChild(el('a', '', esc(i.label))).href = i.href);
      c.appendChild(inner); mg.appendChild(c);
    });
    d.append(b, mg); menus.appendChild(d);
    d.addEventListener('mouseenter', () => { $$('.open', menus).forEach(x => x.classList.remove('open')); d.classList.add('open'); });
    d.addEventListener('mouseleave', () => d.classList.remove('open'));
    b.addEventListener('click', () => { const o = d.classList.contains('open'); $$('.open', menus).forEach(x => x.classList.remove('open')); if (!o) d.classList.add('open'); });
  });
  const na = B.navActions, acts = $('#navActions');
  acts.innerHTML = '<span class="lang">' + esc(na.language) + '</span><a class="pill line" href="' + na.login.href + '">' + esc(na.login.label) + '</a><a class="pill fill" href="' + na.signup.href + '">' + esc(na.signup.label) + '</a><a class="pill fill" href="#cta">' + esc(na.connect) + '</a>';
  const panel = $('#navPanel');
  panel.innerHTML = B.menus.map(m => '<a href="#">' + esc(m.label) + '</a>').join('') + '<div class="sm"><a href="' + na.signup.href + '">' + esc(na.signup.label) + '</a><a href="' + na.login.href + '">' + esc(na.login.label) + '</a><a href="#cta">' + esc(na.connect) + '</a></div>';
  const nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', () => { const o = nav.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', o); });
  panel.addEventListener('click', e => { if (e.target.closest('a')) nav.classList.remove('menu-open'); });

  // hero
  const h = B.hero;
  const h1 = $('#heroH1');
  h1.setAttribute('aria-label', h.h1);
  h1.innerHTML = '<span class="word-stack" aria-hidden="true">' + h.words.map((w, i) => '<b' + (i ? '' : ' class="on"') + '>' + esc(w) + '</b>').join('') + '</span><span class="hero-rest" aria-hidden="true">' + esc(h.rest) + '</span>';
  $('#heroSub').textContent = h.sub;
  $('#heroCta span').textContent = h.cta;
  (function () {
    const ws = $$('.word-stack b'); let i = 0;
    if (reduce) return;
    setInterval(() => { ws[i].className = 'off'; i = (i + 1) % ws.length; ws.forEach((w, k) => { if (k !== i && !w.classList.contains('off')) w.className = ''; }); ws[i].className = 'on'; setTimeout(() => ws.forEach((w, k) => k !== i && w.classList.contains('off') && (w.className = '')), 900); }, 2800);
  })();

  // trust
  $('#trustTitle').textContent = B.trust.title;
  B.trust.logos.forEach(src => { const t = el('div', 'tile'); t.dataset.hit = ''; const im = el('img'); im.src = src; im.alt = ''; im.loading = 'lazy'; t.appendChild(im); $('#trustGrid').appendChild(t); });
  // badges
  B.badges.forEach(b => { const li = el('li', '', esc(b.label)); li.dataset.hit = ''; $('#badgeRow').appendChild(li); });
  // core
  $('#coreTitle').innerHTML = B.core.title.map(t => '<span>' + esc(t) + '</span>').join('');
  B.core.items.forEach((it, i) => {
    const r = el('article', 'crow' + (i === 0 ? ' open' : ''));
    r.innerHTML = '<span class="dot"></span><div class="crow-main"><h3>' + esc(it.title) + '</h3><p class="short">' + esc(it.short) + '</p><button class="tog" aria-label="Toggle ' + esc(it.title) + '" aria-expanded="' + (i === 0) + '"></button></div><div class="crow-more"><div><p>' + esc(it.long) + '</p><a href="' + it.cta.href + '">' + esc(it.cta.label) + '</a></div></div><span class="crow-line"></span>';
    r.addEventListener('click', e => { if (e.target.closest('a')) return; const o = !r.classList.contains('open'); $$('.crow.open').forEach(x => { x.classList.remove('open'); $('.tog', x).setAttribute('aria-expanded', 'false'); }); if (o) { r.classList.add('open'); $('.tog', r).setAttribute('aria-expanded', 'true'); } setTimeout(buildLine, 700); });
    $('#coreRows').appendChild(r);
  });
  // established
  const E = B.established;
  $('#estabTitle').textContent = E.title; $('#estabText').textContent = E.text;
  $('#estabCta span').textContent = E.cta.label; $('#estabCta').href = E.cta.href;
  E.logos.forEach(l => {
    const t = el(l.text ? 'a' : 'div', 'etile'); if (l.text) { t.href = l.href; }
    t.innerHTML = '<img src="' + l.image + '" alt="' + esc(l.name) + '">' + (l.text ? '<div class="ov">' + esc(l.text) + '</div>' : '');
    $('#estabTiles').appendChild(t);
  });
  // build
  $('#buildTitle').textContent = B.build.title;
  B.build.cards.forEach((c, i) => {
    const a = el('a', 'bcard'); a.href = c.cta.href;
    a.innerHTML = '<canvas data-live="' + ['accounts', 'staking', 'network'][i] + '" aria-hidden="true"></canvas><h3>' + esc(c.label) + '</h3><p>' + esc(c.text) + '</p><span class="more">' + esc(c.cta.label) + ' <span aria-hidden="true">&#8599;</span></span>';
    $('#buildCards').appendChild(a);
  });
  // support
  $('#supportLabel').textContent = B.support.label; $('#supportTitle').textContent = B.support.title;
  B.support.items.forEach(t => $('#supportList').appendChild(el('li', '', esc(t))));
  // own
  $('#ownTitle').textContent = B.own.title;
  B.own.items.forEach(it => $('#ownList').appendChild(el('li', '', '<h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p>')));
  // spotlight
  $('#spotTitle').textContent = B.spotlight.label;
  B.spotlight.slides.forEach((s, i) => {
    const a = el('a', 'sframe'); a.href = s.video; a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = '<div class="pic"><canvas data-live="aurora" data-i="' + i + '" aria-hidden="true"></canvas><span class="play" aria-hidden="true"></span></div><h3>' + esc(s.title) + '</h3>';
    $('#spotRow').appendChild(a);
  });
  // latest
  $('#latestTitle').textContent = B.latest.title; $('#latestAll span').textContent = B.latest.all.label; $('#latestAll').href = B.latest.all.href;
  B.latest.posts.forEach(p => $('#latestList').appendChild(el('li', '', '<a href="' + p.href + '"><span>' + esc(p.title) + '</span><i aria-hidden="true">&#8599;</i></a>')));
  // cta
  $('#ctaTitle').innerHTML = B.cta.title.map(t => '<span>' + esc(t) + '</span>').join('');
  $('#ctaBtn span').textContent = B.cta.button;
  // footer
  const F = B.footer;
  $('#newsLabel').textContent = F.newsletter; $('#newsEmail').placeholder = F.email; $('#newsBtn').textContent = F.subscribe;
  F.socials.forEach(s => { const li = el('li'); const a = el('a', '', esc(s.label)); a.href = s.href; li.appendChild(a); $('#socials').appendChild(li); });
  $('#legal').innerHTML = F.legal.map(p => '<p>' + esc(p) + '</p>').join('') + '<p>' + esc(F.screenReader) + '</p><p>' + esc(F.complaints) + '</p>';
  $('#footLinks').innerHTML = '<span>' + esc(F.review) + '</span><a href="' + F.privacy.href + '">' + esc(F.privacy.label) + '</a><span>' + esc(F.and) + '</span><a href="' + F.disclaimers.href + '">' + esc(F.disclaimers.label) + '</a><a href="#">' + esc(F.choices) + '</a><span>' + esc(F.nmls) + '</span><span>&copy;2026 BitGo, Inc. ' + esc(F.rights) + '</span>';

  /* ---------- reveals ---------- */
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.reveal').forEach(e => rio.observe(e));
  $$('.crow,.tile,.etile,.bcard,.sframe,.own-list li,.support-list li,.latest-list li').forEach((e, i) => { if (!e.dataset.hit && !e.classList.contains('reveal')) { e.classList.add('reveal'); e.style.transitionDelay = (i % 4) * 70 + 'ms'; rio.observe(e); } });
  // tile .reveal would fight transforms on etile even; keep as is.

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) { lenis = new Lenis({ lerp: 0.1, smoothWheel: true }); }

  /* ---------- follow line ---------- */
  const svg = $('#vline'), vTrack = $('#vTrack'), vGlow = $('#vGlow'), vLive = $('#vLive'), vHead = $('#vHead'), vHalo = $('#vHalo');
  const vBT = $('#vBranchTracks'), vB = $('#vBranches'), vPk = $('#vPackets');
  const NS = 'http://www.w3.org/2000/svg';
  let segs = [], polyTotal = 0, pathLen = 1, startY = 0, branches = [], hitEls = [], packets = [], W = 0, docH = 0;
  const abs = e => { const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, r: r.right + scrollX, b: r.bottom + scrollY, cy: r.top + scrollY + r.height / 2 }; };

  function roundedPath(pts, r) {
    // drop duplicates and collinear points
    const p = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const a = p[p.length - 1]; if (Math.abs(pts[i][0] - a[0]) < 0.5 && Math.abs(pts[i][1] - a[1]) < 0.5) continue; p.push(pts[i]); }
    let d = 'M' + p[0][0] + ' ' + p[0][1];
    for (let i = 1; i < p.length - 1; i++) {
      const a = p[i - 1], b = p[i], c = p[i + 1];
      const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
      const rr = Math.min(r, l1 / 2, l2 / 2);
      const ax = b[0] - (b[0] - a[0]) / l1 * rr, ay = b[1] - (b[1] - a[1]) / l1 * rr;
      const cx = b[0] + (c[0] - b[0]) / l2 * rr, cy = b[1] + (c[1] - b[1]) / l2 * rr;
      d += 'L' + ax + ' ' + ay + 'Q' + b[0] + ' ' + b[1] + ' ' + cx + ' ' + cy;
    }
    const l = p[p.length - 1]; d += 'L' + l[0] + ' ' + l[1];
    return { d, p };
  }

  function buildLine() {
    W = document.documentElement.clientWidth; docH = Math.ceil(abs($('#footer')).b);
    const vh = innerHeight, phone = W < 760;
    svg.setAttribute('width', W); svg.setAttribute('height', docH); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + docH);
    svg.style.width = W + 'px'; svg.style.height = docH + 'px';
    const gut = phone ? 12 : Math.round(clamp(W * 0.022, 18, 52));
    const L = gut, R = phone ? gut : W - gut;
    const wipes = $$('.wipe').map(abs);
    const mid = i => wipes[i].y + wipes[i].h * 0.5;
    const badge = abs($('#badgeRow li'));
    const build = abs($('#build')), spot = abs($('#spot')), btn = abs($('#ctaBtn'));
    const P = [];
    const add = (x, y) => P.push([x, y]);
    add(R, Math.max(140, vh * 0.2));
    add(R, badge.cy); add(L, badge.cy);
    add(L, mid(0) + 0);
    add(L, mid(1)); add(R, mid(1));
    add(R, build.y + 36); add(L, build.y + 36);
    add(L, mid(2)); add(R, mid(2));
    add(R, spot.y + 36); add(L, spot.y + 36);
    add(L, mid(3)); add(R, mid(3));
    add(R, btn.cy);
    add(phone ? btn.x - 6 : btn.r + 6, btn.cy);
    startY = P[0][1];
    const rp = roundedPath(P, phone ? 14 : 30);
    vTrack.setAttribute('d', rp.d); vGlow.setAttribute('d', rp.d); vLive.setAttribute('d', rp.d);
    pathLen = vLive.getTotalLength();
    // segments + scroll cursor (see NOTES: horizontal runs consume extra scroll)
    segs = []; polyTotal = 0; let c = startY;
    for (let i = 1; i < rp.p.length; i++) {
      const a = rp.p[i - 1], b = rp.p[i], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      let c1;
      if (Math.abs(dy) > Math.abs(dx)) c1 = Math.max(b[1], c + dy * 0.35); else c1 = c + Math.min(len * 0.55, 520);
      segs.push({ c0: c, c1, cum: polyTotal, len });
      polyTotal += len; c = c1;
    }
    // branches at core rows
    vBT.innerHTML = ''; vB.innerHTML = ''; branches = [];
    const wrap = $('#core .wrap');
    const padL = parseFloat(getComputedStyle(wrap).paddingLeft);
    $$('.crow').forEach(row => {
      const t = abs($('h3', row)), rr = abs(row);
      const fs = parseFloat(getComputedStyle($('h3', row)).fontSize);
      const y = t.y + fs * 0.52;
      const dx = phone ? rr.x - 24 : rr.x - padL * 0.32;
      const dot = $('.dot', row); dot.style.left = (dx - rr.x) + 'px'; dot.style.top = (y - rr.y - 7) + 'px';
      const d = 'M' + L + ' ' + y + 'H' + dx;
      const t1 = document.createElementNS(NS, 'path'); t1.setAttribute('d', d); t1.setAttribute('class', 'bt'); vBT.appendChild(t1);
      const t2 = document.createElementNS(NS, 'path'); t2.setAttribute('d', d); t2.setAttribute('class', 'bl'); vB.appendChild(t2);
      const len = Math.max(1, dx - L); t2.style.strokeDasharray = len + ' ' + len; t2.style.strokeDashoffset = len;
      branches.push({ y, len, path: t2, row, dot, x0: L, x1: dx });
    });
    // hit elements
    hitEls = $$('[data-hit]').map(e => ({ e, cy: abs(e).cy }));
    packets = packets.length ? packets : Array.from({ length: 7 }, (_, i) => ({ k: Math.random() }));
    if (!svg.dataset.ready) { svg.dataset.ready = 1; for (let i = 0; i < 7; i++) { const c = document.createElementNS(NS, 'circle'); c.setAttribute('class', 'pk'); c.setAttribute('r', 2.4); vPk.appendChild(c); } }
    update(0, true);
  }

  let curU = null, lastT = performance.now();
  function headFrac(u) {
    if (u <= segs[0].c0) return 0;
    for (const s of segs) { if (u <= s.c1) { const f = (u - s.c0) / Math.max(1e-3, s.c1 - s.c0); return (s.cum + f * s.len) / polyTotal; } }
    return 1;
  }
  let frac = 0, headY = 0;
  function update(dt, snap) {
    if (!segs.length) return;
    const target = scrollY + innerHeight * 0.64;
    curU = curU == null || snap ? target : lerp(curU, target, 1 - Math.pow(0.0008, dt));
    frac = headFrac(curU);
    const len = frac * pathLen;
    vLive.style.strokeDasharray = len + ' ' + (pathLen + 10); vGlow.style.strokeDasharray = len + ' ' + (pathLen + 10);
    const pt = vLive.getPointAtLength(len);
    headY = pt.y;
    vHead.setAttribute('cx', pt.x); vHead.setAttribute('cy', pt.y); vHalo.setAttribute('cx', pt.x); vHalo.setAttribute('cy', pt.y);
    const hv = frac > 0.002 && frac < 0.999 ? 1 : (frac >= 0.999 ? 1 : 0);
    vHead.style.opacity = vHalo.style.opacity = hv;
    // packets
    const pk = $$('circle', vPk); const tw = Math.min(len, 1100);
    pk.forEach((c, i) => {
      const o = packets[i]; if (!reduce) o.k = (o.k + dt * (0.12 + i * 0.015)) % 1;
      const s = len - tw * (1 - o.k);
      if (s <= 0 || tw < 10) { c.style.opacity = 0; return; }
      const p = vLive.getPointAtLength(s); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.style.opacity = (0.15 + 0.85 * o.k).toFixed(2);
    });
    // branches
    branches.forEach(b => {
      const f = clamp((headY - b.y) / 160, 0, 1);
      b.path.style.strokeDashoffset = b.len * (1 - f);
      const on = f > 0.97; if (on !== b.on) { b.on = on; b.row.classList.toggle('hit', on); }
    });
    hitEls.forEach(h => { if (h.e.classList.contains('crow')) return; const on = headY > h.cy && frac > 0.001 && (h.e.id !== 'ctaBtn' || frac > 0.995); if (on !== h.on) { h.on = on; h.e.classList.toggle('hit', on); } });
  }

  /* ---------- pixel wipes ---------- */
  const hash = (a, b, s) => { let n = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
  const wipes = $$('.wipe').map(w => {
    const c = $('canvas', w), o = { w, c, ctx: c.getContext('2d'), from: w.dataset.from, to: w.dataset.to, seed: +w.dataset.seed, last: -9, vis: true };
    return o;
  });
  function sizeWipes() {
    wipes.forEach(o => {
      const W = document.documentElement.clientWidth, cols = W < 760 ? 10 : 24, cell = Math.ceil(W / cols), rows = W < 760 ? 5 : 6;
      const dpr = Math.min(devicePixelRatio, 2);
      o.cols = cols; o.cell = cell; o.rows = rows; o.W = W; o.H = cell * rows;
      o.c.width = W * dpr; o.c.height = o.H * dpr; o.c.style.height = o.H + 'px'; o.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // blocks: some 2x2 merges for variety in cell size
      const used = {}, blocks = [];
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        if (used[r + '_' + q]) continue;
        let s = 1;
        if (r > 0 && r < rows - 2 && q < cols - 1 && hash(q, r, o.seed + 9) < 0.2 && !used[r + '_' + (q + 1)] && !used[(r + 1) + '_' + q]) { s = 2; used[r + '_' + (q + 1)] = used[(r + 1) + '_' + q] = used[(r + 1) + '_' + (q + 1)] = 1; }
        used[r + '_' + q] = 1;
        blocks.push({ q, r, s, h: hash(q, r, o.seed), ry: (r + s / 2) / rows });
      }
      o.blocks = blocks; o.last = -9;
    });
  }
  function drawWipe(o, p) {
    const ctx = o.ctx, cell = o.cell;
    ctx.fillStyle = o.from; ctx.fillRect(0, 0, o.W, o.H);
    const accent = o.from === '#1647DB' ? '#5b8dff' : '#5b8dff', mid = o.from === '#1647DB' ? '#0c2a9c' : '#0b1b70';
    o.blocks.forEach(b => {
      let v = 0.42 * b.h + 0.46 * (1 - b.ry) + 0.12 * (b.q / o.cols);
      let col = null;
      if (b.r === o.rows - 1) col = o.to;
      else if (b.r === 0) col = null;
      else if (v < p - 0.11) col = o.to;
      else if (v < p - 0.045) col = accent;
      else if (v < p + 0.03) col = mid;
      if (col) { ctx.fillStyle = col; ctx.fillRect(b.q * cell, b.r * cell, b.s * cell + 0.5, b.s * cell + 0.5); }
    });
    ctx.fillStyle = o.to; ctx.fillRect(0, (o.rows - 1) * cell, o.W, cell + 1);
  }
  function updateWipes() {
    const vh = innerHeight;
    wipes.forEach(o => {
      const r = o.w.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const t = reduce ? 1 : clamp((vh * 0.95 - r.top) / (vh * 0.72), 0, 1);
      const p = lerp(-0.14, 1.16, t);
      if (Math.abs(p - o.last) > 0.004) { o.last = p; drawWipe(o, p); }
    });
  }

  /* ---------- live 2D line systems ---------- */
  const lives = [];
  function reg(c, fn) {
    const o = { c, ctx: c.getContext('2d'), fn, vis: false, w: 0, h: 0 };
    o.size = () => { const dpr = Math.min(devicePixelRatio, 2); o.w = c.clientWidth; o.h = c.clientHeight; c.width = Math.max(1, o.w * dpr); c.height = Math.max(1, o.h * dpr); o.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    o.size(); lives.push(o);
    new IntersectionObserver(es => es.forEach(e => o.vis = e.isIntersecting), { rootMargin: '80px' }).observe(c);
  }
  function polyAt(poly, s) {
    for (let i = 1; i < poly.length; i++) {
      const a = poly[i - 1], b = poly[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (s <= l) { const f = l ? s / l : 0; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
      s -= l;
    }
    return poly[poly.length - 1];
  }
  const polyLen = poly => poly.reduce((s, p, i) => i ? s + Math.hypot(p[0] - poly[i - 1][0], p[1] - poly[i - 1][1]) : 0, 0);
  const stroke = (ctx, poly, a, w) => { ctx.beginPath(); poly.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.stroke(); };
  const dot = (ctx, x, y, r, a) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = 'rgba(255,255,255,' + a + ')'; ctx.fill(); };

  const draw = {
    accounts(o, t) {
      const { ctx, w, h } = o; ctx.clearRect(0, 0, w, h);
      const n = 6, trunkY = h * 0.5, nodeX = w * 0.8; let arrive = 0;
      for (let i = 0; i < n; i++) {
        const y = h * (0.14 + 0.72 * i / (n - 1)), xm = w * (0.3 + 0.05 * Math.abs(i - 2.5));
        const poly = [[0, y], [xm, y], [xm, trunkY], [nodeX - 26, trunkY]], L = polyLen(poly);
        stroke(ctx, poly, 0.32, 1.2);
        for (let k = 0; k < 2; k++) {
          const f = ((t * (0.16 + i * 0.012) + i * 0.17 + k * 0.5) % 1), p = polyAt(poly, f * L);
          dot(ctx, p[0], p[1], 3, 0.95); const q = polyAt(poly, Math.max(0, f * L - 22)); stroke(ctx, [q, p], 0.5, 1.6);
          if (f > 0.93) arrive += (f - 0.93) / 0.07;
        }
      }
      const s = 22 + Math.min(arrive, 3) * 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.6; ctx.strokeRect(nodeX - 26, trunkY - 26, 52, 52);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.18 + Math.min(arrive, 3) * 0.12) + ')'; ctx.fillRect(nodeX - s / 2, trunkY - s / 2, s, s);
      stroke(ctx, [[nodeX + 26, trunkY], [w, trunkY]], 0.5, 1.2);
    },
    staking(o, t) {
      const { ctx, w, h } = o; ctx.clearRect(0, 0, w, h);
      const steps = 6, rates = [0.55, 0.78, 1];
      rates.forEach((rt, li) => {
        const poly = [[w * 0.06, h * 0.9]];
        for (let j = 0; j < steps; j++) {
          const x1 = w * (0.06 + 0.88 * (j + 1) / steps), yP = poly[poly.length - 1][1];
          const yN = h * 0.9 - (h * 0.72 * rt) * Math.pow((j + 1) / steps, 1.25);
          poly.push([x1 - w * 0.88 / steps * 0.42, yP]); poly.push([x1 - w * 0.88 / steps * 0.42, yN]); poly.push([x1, yN]);
        }
        const L = polyLen(poly); stroke(ctx, poly, li === 2 ? 0.7 : 0.28, li === 2 ? 1.8 : 1.2);
        for (let k = 0; k < 2; k++) { const f = (t * 0.11 + li * 0.27 + k * 0.5) % 1, p = polyAt(poly, f * L); dot(ctx, p[0], p[1], li === 2 ? 3.4 : 2.4, 0.95); }
        if (li === 2) for (let j = 1; j <= steps; j++) {
          const f = (t * 0.45 - j * 0.28) % 1.6; if (f > 0 && f < 1) { const x = poly[j * 3][0], y = poly[j * 3][1]; ctx.beginPath(); ctx.arc(x, y, 4 + f * 26, 0, 7); ctx.strokeStyle = 'rgba(255,255,255,' + 0.6 * (1 - f) + ')'; ctx.lineWidth = 1.2; ctx.stroke(); }
        }
      });
      stroke(ctx, [[w * 0.06, h * 0.9], [w * 0.94, h * 0.9]], 0.3, 1.2);
    },
    network(o, t) {
      const { ctx, w, h } = o; ctx.clearRect(0, 0, w, h);
      const N = [[.14, .24], [.38, .14], [.7, .2], [.86, .46], [.6, .52], [.3, .5], [.18, .8], [.5, .84], [.82, .8]].map(p => [p[0] * w, p[1] * h]);
      const E = [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [5, 0], [5, 6], [4, 7], [7, 6], [3, 8], [8, 7], [2, 4]];
      const elbow = (a, b) => [N[a], [N[b][0], N[a][1]], N[b]];
      E.forEach(e => stroke(ctx, elbow(e[0], e[1]), 0.26, 1.2));
      const pulse = new Array(N.length).fill(0);
      for (let k = 0; k < 8; k++) {
        const e = E[(k * 5 + Math.floor(t * 0.35 + k * 1.7)) % E.length], dur = 2.6, f = ((t * 0.38 + k * 0.37) % 1);
        const rev = (Math.floor(t * 0.38 + k * 0.37) + k) % 2, poly = rev ? elbow(e[1], e[0]) : elbow(e[0], e[1]), L = polyLen(poly);
        const p = polyAt(poly, f * L); dot(ctx, p[0], p[1], 3, 0.95); const q = polyAt(poly, Math.max(0, f * L - 26)); stroke(ctx, [q, p], 0.5, 1.6);
        if (f > 0.9) pulse[rev ? e[0] : e[1]] = Math.max(pulse[rev ? e[0] : e[1]], (f - 0.9) * 10);
      }
      N.forEach((n, i) => { ctx.beginPath(); ctx.arc(n[0], n[1], 7 + pulse[i] * 7, 0, 7); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = 'rgba(6,21,83,1)'; ctx.fill(); ctx.stroke(); dot(ctx, n[0], n[1], 2.4, 1); });
    },
    support(o, t) {
      const { ctx, w, h } = o; ctx.clearRect(0, 0, w, h);
      const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], x0 = w * 0.07, x1 = w * 0.98, segs = 24;
      const cur = x0 + ((t * 0.07) % 1.15) * (x1 - x0);
      ctx.font = '500 ' + Math.max(12, w * 0.024) + 'px "Hanken Grotesk",sans-serif'; ctx.textBaseline = 'middle';
      days.forEach((d, r) => {
        const y = h * (0.1 + 0.8 * r / 6); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillText(d, 0, y);
        const sw = (x1 - x0) / segs;
        for (let s = 0; s < segs; s++) {
          const xa = x0 + s * sw + 2, xb = x0 + (s + 1) * sw - 2, past = cur - xb;
          const a = past > 0 ? Math.max(0.22, 0.95 - past / (w * 0.7)) : 0.14;
          ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.strokeStyle = 'rgba(141,179,255,' + a + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
        }
      });
      const g = ctx.createLinearGradient(cur - 40, 0, cur, 0); g.addColorStop(0, 'rgba(141,179,255,0)'); g.addColorStop(1, 'rgba(141,179,255,.22)');
      ctx.fillStyle = g; ctx.fillRect(cur - 40, 0, 40, h);
      stroke(ctx, [[cur, 0], [cur, h]], 0.9, 1.6);
    },
    aurora(o, t) {
      const { ctx, w, h } = o, i = +o.c.dataset.i || 0; ctx.globalCompositeOperation = 'source-over';
      const bg = [['#06103a', '#123bb8'], ['#0a1a55', '#2a62ee'], ['#05102f', '#0e2f93']][i];
      const g0 = ctx.createLinearGradient(0, 0, w, h); g0.addColorStop(0, bg[0]); g0.addColorStop(1, bg[1]); ctx.fillStyle = g0; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 4; k++) {
        const x = w * (0.5 + 0.38 * Math.sin(t * 0.18 + k * 1.9 + i)), y = h * (0.5 + 0.34 * Math.cos(t * 0.14 + k * 2.3 + i * 2)), r = Math.max(w, h) * (0.35 + 0.1 * k);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + [[120, 170, 255], [60, 110, 255], [190, 215, 255], [30, 70, 230]][k] + ',' + (0.3 - k * 0.03) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      ctx.globalCompositeOperation = 'source-over';
      const ph = (t * 0.2 + i * 0.3) % 1.4, poly = [[0, h * 0.78], [w * 0.34, h * 0.78], [w * 0.34, h * 0.5], [w * 0.7, h * 0.5], [w * 0.7, h * 0.3], [w, h * 0.3]];
      stroke(ctx, poly, 0.22, 1.2); const L = polyLen(poly); const p = polyAt(poly, clamp(ph, 0, 1) * L); dot(ctx, p[0], p[1], 3, 0.9);
    }
  };
  $$('canvas[data-live]').forEach(c => reg(c, draw[c.dataset.live]));
  reg($('#supportCanvas'), draw.support);

  /* ---------- main loop ---------- */
  let navLast = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (lenis) lenis.raf(now);
    update(dt);
    updateWipes();
    lives.forEach(o => { if (o.vis) { if (!o.w) o.size(); o.fn(o, reduce ? 6 : now / 1000); } });
    const y = scrollY; nav.classList.toggle('solid', y > 60); nav.classList.toggle('hide', y > navLast + 4 && y > 500 && !nav.classList.contains('menu-open') ? true : (y < navLast - 4 ? false : nav.classList.contains('hide'))); navLast = y;
    requestAnimationFrame(frame);
  }
  function rebuild() { sizeWipes(); lives.forEach(o => o.size()); buildLine(); updateWipes(); }
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(rebuild, 120); });
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(rebuild, 150); }).observe(document.body);
  sizeWipes(); buildLine();
  document.fonts && document.fonts.ready.then(rebuild);
  addEventListener('load', () => { rebuild(); setTimeout(rebuild, 800); });
  $$('img').forEach(i => i.addEventListener('load', () => { clearTimeout(rt); rt = setTimeout(rebuild, 150); }));
  requestAnimationFrame(frame);
  window.__scroll = () => scrollY;
})();
