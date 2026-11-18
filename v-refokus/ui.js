/* BitGo homepage, refokus-family build. DOM, scroll choreography and 2D canvas art.
   WebGL (hero + core object) lives in gl.js so a GL failure never blocks this file. */
(function () {
  const B = window.BITGO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const LOGO = '../shared/assets/bitgo-logo.svg';
  if (!reduce) document.documentElement.classList.add('js');

  /* ---------- nav ---------- */
  const A = B.navActions;
  $('#skip').textContent = B.skip;
  $('#nav').innerHTML =
    `<a class="logo" href="#top" aria-label="BitGo"><img src="${LOGO}" alt="BitGo" width="77" height="26"></a>
    <nav class="menus" aria-label="Primary">${B.menus.map(m =>
      `<div class="mi"><button aria-expanded="false">${m.label}</button><div class="mega">${m.groups.map(g =>
        `<div class="mg"><h4>${g.title}</h4><ul>${g.items.map(i => `<li><a href="${i.href}">${i.label}</a></li>`).join('')}</ul></div>`).join('')}</div></div>`).join('')}</nav>
    <div class="acts"><span class="lang">${A.language}</span><a class="lnk" href="${A.login.href}">${A.login.label}</a><a class="lnk" href="${A.signup.href}">${A.signup.label}</a><a class="btn" href="#cta">${A.connect}</a><button class="burger" aria-label="Menu"><i></i><i></i></button></div>`;
  const mob = document.createElement('div');
  mob.className = 'mobile';
  mob.innerHTML = B.menus.map(m => `<details><summary>${m.label}</summary>${m.groups.map(g => `<h4>${g.title}</h4><ul>${g.items.map(i => `<li><a href="${i.href}">${i.label}</a></li>`).join('')}</ul>`).join('')}</details>`).join('') +
    `<a class="btn" href="${A.signup.href}">${A.signup.label}</a> <a class="btn ghost" href="${A.login.href}">${A.login.label}</a>`;
  document.body.appendChild(mob);
  const nav = $('#nav');
  $('.burger').onclick = () => { const o = !mob.classList.contains('open'); mob.classList.toggle('open', o); nav.classList.toggle('mopen', o); };
  mob.addEventListener('click', e => { if (e.target.closest('a')) { mob.classList.remove('open'); nav.classList.remove('mopen'); } });
  $$('.mi').forEach(mi => {
    const btn = $('button', mi);
    const set = o => { $$('.mi').forEach(x => { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); }); if (o) { mi.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); } };
    mi.addEventListener('mouseenter', () => matchMedia('(hover:hover)').matches && set(true));
    btn.addEventListener('click', () => set(!mi.classList.contains('open')));
  });
  nav.addEventListener('mouseleave', () => $$('.mi').forEach(x => x.classList.remove('open')));
  addEventListener('keydown', e => e.key === 'Escape' && $$('.mi').forEach(x => x.classList.remove('open')));

  /* ---------- hero (copy only; the object is in gl.js) ---------- */
  const H = B.hero;
  const split = w => [...w].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join('');
  $('#hero').innerHTML =
    `<div class="hero-copy wrap"><h1 aria-label="${H.h1}"><span class="rot" aria-hidden="true">${H.words.map(w => `<span class="rw">${split(w)}</span>`).join('')}</span><span class="rest" aria-hidden="true">${H.rest}</span></h1>
    <div class="hero-row"><a class="btn" href="#cta">${H.cta}${arrow}</a><p>${H.sub}</p></div></div>`;
  const rws = $$('.rw');
  let cur = 0;
  const show = i => { rws.forEach((r, k) => { r.classList.toggle('on', k === i); r.classList.toggle('out', k !== i && r.classList.contains('on-was')); }); };
  rws[0].classList.add('on');
  setInterval(() => {
    if (document.hidden) return;
    const prev = rws[cur]; cur = (cur + 1) % rws.length;
    prev.classList.remove('on'); prev.classList.add('out');
    setTimeout(() => prev.classList.remove('out'), 1100);
    rws[cur].classList.add('on');
  }, 2800);

  /* ---------- trust marquee ---------- */
  const lg = B.trust.logos;
  const mqRow = (arr, rev) => `<div class="mq${rev ? ' rev' : ''}"><div class="mq-t">${[...arr, ...arr].map(s => `<img src="${s}" alt="" loading="lazy">`).join('')}</div></div>`;
  $('#trust').innerHTML = `<div class="wrap"><h2 data-rv>${B.trust.title}</h2></div>` + mqRow(lg, false) + mqRow([...lg].reverse(), true);

  /* ---------- badges statement ---------- */
  $('#badges').innerHTML = `<div class="wrap"><p class="stmt">${B.badges.map(b => `<span>${b.label.replace(/^(NYSE LISTED:|OCC|Founded)/, '$1')}</span>`).join('')}</p></div>`;
  const stmtSpans = $$('.stmt span');
  stmtSpans[0].innerHTML = 'NYSE listed: <b>BTGO</b>';
  stmtSpans[1].textContent = 'OCC federally chartered';
  stmtSpans[2].textContent = 'Founded in 2013';

  /* ---------- core ---------- */
  const C = B.core;
  $('#core').innerHTML =
    `<div class="core-head"><div class="wrap"><h2>${C.title.map(t => `<span>${t}</span>`).join('')}</h2></div></div>
    <div class="core-track" id="coreTrack" style="height:${C.items.length * 80 + 100}vh"><div class="core-sticky"><div class="wrap"><div class="core-panel">
      <div class="core-list">${C.items.map((it, i) => `<button data-i="${i}">${it.title}</button>`).join('')}</div>
      <div class="core-body">${C.items.map((it, i) => `<div class="core-item" data-i="${i}"><h3>${it.title}</h3><p class="sh">${it.short}</p><p class="lg">${it.long}</p><a class="btn" href="${it.cta.href}">${it.cta.label}${arrow}</a></div>`).join('')}</div>
    </div></div></div></div>`;
  window.__core = { active: -1 };
  const coreTrack = $('#coreTrack'), coreBtns = $$('.core-list button'), coreItems = $$('.core-item');
  coreBtns.forEach(b => b.onclick = () => {
    const i = +b.dataset.i, r = coreTrack.getBoundingClientRect(), top = r.top + scrollY;
    const span = coreTrack.offsetHeight - innerHeight;
    scrollTo({ top: top + span * ((i + .5) / C.items.length) });
  });
  function updateCore() {
    const r = coreTrack.getBoundingClientRect(), span = coreTrack.offsetHeight - innerHeight;
    const p = clamp(-r.top / span);
    const idx = r.top > innerHeight * .35 ? -1 : Math.min(C.items.length - 1, Math.floor(p * C.items.length));
    if (idx !== window.__core.active) {
      window.__core.active = idx;
      coreBtns.forEach((b, i) => b.classList.toggle('on', i === idx));
      coreItems.forEach((b, i) => b.classList.toggle('on', i === idx));
    }
  }

  /* ---------- established ---------- */
  const E = B.established;
  const withText = E.logos.filter(l => l.text), plain = E.logos.filter(l => !l.text);
  $('#established').innerHTML =
    `<div class="wrap"><div class="est-top"><div><h2 class="big" data-rv>${E.title}</h2><p class="lead" data-rv>${E.text}</p></div></div>
    <div class="rows">${withText.map(l => `<a class="row" href="${l.href}" data-rv><img src="${l.image}" alt="${l.name}"><p>${l.text}</p><span class="go">${arrow}</span></a>`).join('')}</div>
    <div class="est-logos">${plain.map(l => `<img src="${l.image}" alt="${l.name}" loading="lazy" data-rv>`).join('')}</div>
    <div class="est-cta"><a class="btn" href="${E.cta.href}">${E.cta.label}${arrow}</a></div></div>`;

  /* ---------- build ---------- */
  const BD = B.build;
  $('#build').innerHTML =
    `<div class="wrap"><h2 class="big" data-rv>${BD.title}</h2><div class="bcards">${BD.cards.map((c, i) =>
      `<article class="bcard c${i}${i === 1 ? ' rtl' : ''}" style="--k:${i}"><div class="bt"><div><h3>${c.label}</h3><p>${c.text}</p></div><a class="btn" href="${c.cta.href}">${c.cta.label}${arrow}</a></div><canvas data-art="${i}" aria-hidden="true"></canvas></article>`).join('')}</div></div>`;

  /* ---------- support ---------- */
  const S = B.support;
  $('#support').innerHTML =
    `<div class="wrap"><div class="sup-grid"><div><p class="sup-lab" data-rv>${S.label}</p><h2 class="big" data-rv>${S.title}</h2></div>
    <ul class="sup-list">${S.items.map((t, i) => `<li data-rv style="--d:${i * .07}s">${t}</li>`).join('')}</ul></div></div>
    <div class="sup-bars"><canvas data-art="bars" aria-hidden="true"></canvas></div>`;

  /* ---------- own ---------- */
  const O = B.own;
  const SL = O.items.length;
  $('#own').innerHTML =
    `<div class="wrap"><div class="own-grid"><div class="own-left"><h2 class="big">${O.title}</h2><div class="own-stack"><canvas id="own3d" aria-hidden="true"></canvas></div></div>
    <div class="own-items">${O.items.map((it, i) => `<div class="own-item" data-i="${i}"><h3>${it.title}</h3><p>${it.text}</p></div>`).join('')}</div></div></div>`;
  const ownItems = $$('.own-item');
  window.__own = { active: -1, count: SL };
  function updateOwn() {
    const mid = innerHeight * .52 + (innerWidth < 900 ? 70 : 0);
    let best = -1, bd = 1e9;
    ownItems.forEach((el, i) => { const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
    const secR = $('#own').getBoundingClientRect();
    if (secR.top > innerHeight * .5 || secR.bottom < innerHeight * .4) best = secR.top > 0 ? -1 : SL - 1;
    window.__own.active = best;
    ownItems.forEach((el, i) => el.classList.toggle('on', i === best));
  }

  /* ---------- spotlight ---------- */
  const SP = B.spotlight;
  const play = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  $('#spotlight').innerHTML =
    `<div class="wrap"><h2 class="big" data-rv>${SP.label}</h2><div class="tiles">${SP.slides.map((s, i) =>
      `<a class="tile t${i}" href="${s.video}" target="_blank" rel="noopener" data-rv style="--d:${i * .1}s"><span class="art"></span><span class="play">${play}</span><h3>${s.title}</h3></a>`).join('')}</div></div>`;

  /* ---------- latest ---------- */
  const L = B.latest;
  $('#latest').innerHTML =
    `<div class="wrap"><div class="lat-top"><h2 class="big" data-rv>${L.title}</h2><a class="btn ghost" href="${L.all.href}">${L.all.label}${arrow}</a></div>
    <div>${L.posts.map(p => `<a class="post" href="${p.href}" data-rv><h3>${p.title}</h3><span class="go">${arrow}</span></a>`).join('')}</div></div>`;

  /* ---------- cta ---------- */
  const CT = B.cta;
  $('#cta').innerHTML = `<div class="cta-block"><canvas data-art="cta" aria-hidden="true"></canvas><h2>${CT.title.map(t => `<span>${t}</span>`).join('')}</h2><a class="btn" href="${A.signup.href}">${CT.button}${arrow}</a></div>`;

  /* ---------- footer ---------- */
  const F = B.footer;
  $('#footer').innerHTML =
    `<div class="wrap"><div class="foot-top"><div><h3>${F.newsletter}</h3><form class="nl" onsubmit="return false"><input type="email" placeholder="${F.email}" aria-label="${F.email}"><button class="btn" type="submit">${F.subscribe}</button></form></div>
    <div class="soc">${F.socials.map(s => `<a href="${s.href}" target="_blank" rel="noopener">${s.label}</a>`).join('')}</div></div>
    <div class="foot-logo"><img src="${LOGO}" alt="BitGo"></div>
    <div class="legal">${F.legal.map(p => `<p>${p}</p>`).join('')}<p>${F.complaints}</p><p>${F.screenReader}</p>
    <p class="links"><span>${F.review} <a href="${F.privacy.href}">${F.privacy.label}</a> ${F.and} <a href="${F.disclaimers.href}">${F.disclaimers.label}</a>.</span><span>${F.nmls}</span><span>${F.choices}</span><span>&copy; ${F.rights}</span></p></div></div>`;

  /* ---------- reveals ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -4% 0px', threshold: 0.01 });
    $$('[data-rv]').forEach(el => io.observe(el));
    setTimeout(() => $$('[data-rv]:not(.in)').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('in'); }), 1500);
  }

  /* ---------- scroll ---------- */
  function onScroll() {
    nav.classList.toggle('solid', scrollY > 40);
    stmtSpans.forEach(s => {
      const r = s.getBoundingClientRect(), c = r.top + r.height / 2;
      s.style.setProperty('--o', (reduce ? .95 : lerp(.2, 1, sm(innerHeight * .98, innerHeight * .5, c))).toFixed(3));
    });
    updateCore(); updateOwn();
  }
  let tick = false;
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; onScroll(); }); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  $('a.logo').addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0 }); });

  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: .11, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ---------- 2D canvas art ---------- */
  const DPR = () => Math.min(devicePixelRatio || 1, 2);
  function loop(cv, draw) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, vis = false, raf = 0;
    const fit = () => { const r = cv.getBoundingClientRect(); const d = DPR(); w = r.width; h = r.height; cv.width = Math.max(1, Math.round(w * d)); cv.height = Math.max(1, Math.round(h * d)); ctx.setTransform(d, 0, 0, d, 0, 0); if (reduce || !vis) frame(); };
    const t0 = performance.now();
    const frame = () => { ctx.clearRect(0, 0, w, h); draw(ctx, w, h, reduce ? 3.2 : (performance.now() - t0) / 1000, cv); };
    const run = () => { frame(); raf = vis && !reduce ? requestAnimationFrame(run) : 0; };
    new ResizeObserver(fit).observe(cv);
    new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis && !raf) run(); }, { rootMargin: '10% 0px' }).observe(cv);
    fit(); frame();
  }
  const iso = (ctx, cx, cy, W, T, cols) => {
    const hw = W / 2, hh = W / 4;
    ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.moveTo(cx - hw, cy); ctx.lineTo(cx, cy + hh); ctx.lineTo(cx, cy + hh + T); ctx.lineTo(cx - hw, cy + T); ctx.fill();
    ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.moveTo(cx, cy + hh); ctx.lineTo(cx + hw, cy); ctx.lineTo(cx + hw, cy + T); ctx.lineTo(cx, cy + hh + T); ctx.fill();
    ctx.fillStyle = cols[2]; ctx.beginPath(); ctx.moveTo(cx, cy - hh); ctx.lineTo(cx + hw, cy); ctx.lineTo(cx, cy + hh); ctx.lineTo(cx - hw, cy); ctx.fill();
  };
  const arts = {
    0(ctx, w, h, t) { // cash and crypto in one stack: layers fan out, then snap into one
      const n = 9, W = Math.min(w * .52, h * .75), T = W * .06, G = T * 2.1;
      const m = sm(.25, .75, .5 + .5 * Math.sin(t * .55));
      const cx = w / 2, cy = h / 2 + G * 2.2;
      for (let i = n - 1; i >= 0; i--) {
        const off = Math.sin(t * .9 + i * .75) * W * .34 * (1 - m) * (i % 2 ? 1 : -1);
        const y = cy - (i - (n - 1) / 2) * G - (1 - m) * Math.cos(i + t * .4) * G * .9;
        const cash = i % 2 === 0;
        iso(ctx, cx + off, y, W, T, cash ? ['#9fb4ee', '#7f98de', '#eaf0ff'] : ['#0b2a99', '#091f75', '#1647DB']);
        if (!cash) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); const hw = W * .36, hh = W * .18; ctx.moveTo(cx + off, y - hh + 4); ctx.lineTo(cx + off + hw, y); ctx.lineTo(cx + off, y + hh - 4); ctx.lineTo(cx + off - hw, y); ctx.closePath(); ctx.stroke(); }
      }
    },
    1(ctx, w, h, t) { // rewards radiating outward from a stake
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .47, K = 7;
      for (let k = 0; k < K; k++) {
        const ph = (t * .1 + k / K) % 1, r = R * ph, a = Math.pow(1 - ph, 1.3);
        ctx.strokeStyle = `rgba(22,71,219,${(.15 + a * .8).toFixed(3)})`; ctx.lineWidth = 1.5 + a * 3;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
        const dots = 4 + Math.round(ph * 26);
        ctx.fillStyle = `rgba(3,7,26,${(.2 + a * .8).toFixed(3)})`;
        for (let d = 0; d < dots; d++) { const an = d / dots * 6.2832 + t * (.25 - ph * .18) * (k % 2 ? 1 : -1); ctx.beginPath(); ctx.arc(cx + Math.cos(an) * r, cy + Math.sin(an) * r, 1.5 + a * 3.5, 0, 7); ctx.fill(); }
      }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70); g.addColorStop(0, 'rgba(22,71,219,.6)'); g.addColorStop(1, 'rgba(22,71,219,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 80, cy - 80, 160, 160);
      ctx.fillStyle = '#1647DB'; ctx.beginPath(); ctx.arc(cx, cy, 17 + Math.sin(t * 2) * 2, 0, 7); ctx.fill();
    },
    2(ctx, w, h, t) { // settlement without borders: arcs and packets over a turning globe
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .4, rot = t * .16, tilt = .42;
      const P = (la, lo, k = 1) => { const x = Math.cos(la) * Math.sin(lo + rot), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo + rot); const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt); return [cx + x * R * k, cy - y2 * R * k, z2]; };
      const line = (pts, c) => { ctx.beginPath(); let pen = false; pts.forEach(p => { if (p[2] < -.02) { pen = false; return; } pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; }); ctx.strokeStyle = c; ctx.stroke(); };
      ctx.lineWidth = 1;
      for (let la = -60; la <= 60; la += 30) line(Array.from({ length: 73 }, (_, i) => P(la * Math.PI / 180, i / 72 * 6.2832)), 'rgba(120,150,255,.28)');
      for (let lo = 0; lo < 360; lo += 30) line(Array.from({ length: 49 }, (_, i) => P((i / 48 - .5) * Math.PI, lo * Math.PI / 180)), 'rgba(120,150,255,.28)');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.strokeStyle = 'rgba(160,185,255,.5)'; ctx.stroke();
      const N = 14, nodes = Array.from({ length: N }, (_, i) => [Math.sin(i * 2.3) * 1.0, i * 2.4]);
      for (let i = 0; i < N; i++) {
        const a = nodes[i], b = nodes[(i + 4) % N];
        const pts = Array.from({ length: 33 }, (_, s) => { const u = s / 32; const la = lerp(a[0], b[0], u), lo = lerp(a[1], b[1], u); return P(la, lo, 1 + .28 * Math.sin(u * Math.PI)); });
        ctx.lineWidth = 1.4; line(pts, 'rgba(110,150,255,.55)');
        const ph = (t * .22 + i * .13) % 1, q = pts[Math.floor(ph * 32)];
        if (q[2] > 0) { const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 16); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(77,120,255,0)'); ctx.fillStyle = g; ctx.fillRect(q[0] - 16, q[1] - 16, 32, 32); }
      }
      nodes.forEach(n => { const p = P(n[0], n[1]); if (p[2] > 0) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, 7); ctx.fill(); } });
    },
    bars(ctx, w, h, t) { // 24 hours, one light sweeping across
      const n = 24, pitch = w / n, bw = pitch * .5, s = (t * .075) % 1;
      for (let i = 0; i < n; i++) {
        const x = pitch * (i + .5), u = (i + .5) / n;
        const base = .34 + .58 * (.5 + .5 * Math.sin(i * .5 + 1.1)) * (.55 + .45 * Math.sin(u * Math.PI));
        let d = Math.abs(u - s); d = Math.min(d, 1 - d);
        const lit = Math.exp(-d * d / .0035);
        const bh = h * base * (1 + lit * .06);
        const g = ctx.createLinearGradient(0, h - bh, 0, h);
        g.addColorStop(0, `rgba(${lerp(40, 190, lit) | 0},${lerp(90, 210, lit) | 0},255,${(.55 + lit * .45).toFixed(2)})`); g.addColorStop(1, 'rgba(22,71,219,.12)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(x - bw / 2, h - bh, bw, bh + 40, [bw / 2, bw / 2, 0, 0]); ctx.fill();
      }
    },
    cta(ctx, w, h, t, cv) { // the curtain returns from the bottom
      const r = cv.getBoundingClientRect();
      const rise = reduce ? 1 : sm(innerHeight * 1.0, innerHeight * .25, r.top + r.height * .5);
      const n = Math.max(22, Math.round(w / 30)), pitch = w / n, bw = pitch * .5;
      for (let i = 0; i < n; i++) {
        const u = (i + .5) / n;
        const wave = .5 + .5 * Math.sin(i * .21 + t * .55) * Math.sin(i * .07 - t * .3 + 1);
        const arch = .55 + .45 * Math.sin(u * Math.PI);
        const bh = h * (.1 + .5 * wave * arch) * rise;
        const x = pitch * (i + .5);
        const g = ctx.createLinearGradient(0, h - bh, 0, h);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.35, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,.95)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(x - bw / 2, h - bh, bw, bh + 30, [bw / 2, bw / 2, 0, 0]); ctx.fill();
      }
    }
  };
  $$('canvas[data-art]').forEach(cv => {
    const k = cv.dataset.art;
    loop(cv, (ctx, w, h, t, c) => arts[k](ctx, w, h, t, c));
  });
})();
