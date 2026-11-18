/* BitGo homepage v4: v3 with today's live nav and footer (chrome.js). DOM, scroll choreography and 2D canvas art.
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

  /* ---------- nav, mobile menu and footer: today's live bitgo.com chrome (chrome.js, shared/chrome-2026-11-16.js) ---------- */
  renderChrome({ logoHref: '#top', newsletterInFooter: true, aiRef: 'https%3A%2F%2Fwww.bitgo.com%2F' });
  const nav = $('#nav');
  const A = B.navActions;

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
    `<div class="core-head"><div class="wrap"><h2>${C.title.map((t, i) => `<span${i === 1 ? ' class="acc"' : ''}>${t}</span>`).join('')}</h2></div></div>
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
    <ul class="sup-list">${S.items.map((t, i) => `<li data-rv style="--d:${i * .07}s">${t}</li>`).join('')}</ul></div></div>`;

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
  $('#cta').innerHTML = `<div class="cta-block"><h2>${CT.title.map(t => `<span>${t}</span>`).join('')}</h2><a class="btn" href="${A.signup.href}">${CT.button}${arrow}</a></div>`;

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
  const SHIELD = new Path2D('M156.282 104.257C156.282 146.692 78.3938 183.634 78.3938 183.634C78.3938 183.634 0.50478 146.692 0.50478 104.257C0.50478 93.2381 0.509268 83.5104 0.513558 74.2098C0.522088 55.7192 0.52984 38.9167 0.5 17.0094C49.9579 -5.62206 106.836 -5.59857 156.282 17.0588V104.257ZM72.3134 30.3623H62.2633V40.3298H52.2132V123.406H62.2633V133.376H72.3134V123.406H82.3636V133.376H92.4137V122.448C105.183 119.755 112.514 111.51 112.514 99.2681C112.514 90.7144 106.987 82.981 97.5309 80.5203C105.882 78.0597 110.672 70.9121 110.672 62.9443C110.672 51.6072 103.818 43.6576 92.4137 41.1626V30.3623H82.3636V40.3298H72.3134V30.3623ZM81.1969 53.3361C89.6709 53.3361 94.5834 57.2028 94.5834 63.7645C94.5834 70.3262 89.9165 74.193 82.0565 74.193H67.9332V53.3361H81.1969ZM82.1794 86.8477C91.6359 86.8477 96.4256 90.7144 96.4256 98.4479C96.4256 105.478 90.6534 109.814 81.3197 109.814H67.9332V86.8477H82.1794Z');
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
    1(ctx, w, h, t) { // staking: rewards radiating outward from a stake, rings with travelling beads
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .47, K = 7;
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      halo.addColorStop(0, 'rgba(22,71,219,.22)'); halo.addColorStop(1, 'rgba(22,71,219,0)');
      ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      for (let k = 0; k < K; k++) {
        const ph = (t * .1 + k / K) % 1, r = R * ph, a = Math.pow(1 - ph, 1.3);
        ctx.strokeStyle = `rgba(22,71,219,${(.12 + a * .78).toFixed(3)})`; ctx.lineWidth = 1.2 + a * 3.2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
        const dots = 4 + Math.round(ph * 26);
        for (let d = 0; d < dots; d++) {
          const an = d / dots * 6.2832 + t * (.25 - ph * .18) * (k % 2 ? 1 : -1), x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r, rad = 1.4 + a * 3.6;
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 3.2);
          g.addColorStop(0, `rgba(22,71,219,${(.3 + a * .5).toFixed(3)})`); g.addColorStop(1, 'rgba(22,71,219,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad * 3.2, 0, 7); ctx.fill();
          ctx.fillStyle = `rgba(3,7,26,${(.3 + a * .7).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
        }
      }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90); g.addColorStop(0, 'rgba(22,71,219,.7)'); g.addColorStop(1, 'rgba(22,71,219,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 100, cy - 100, 200, 200);
      ctx.fillStyle = '#1647DB'; ctx.beginPath(); ctx.arc(cx, cy, 17 + Math.sin(t * 2) * 2, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 17 + Math.sin(t * 2) * 2, 0, 7); ctx.stroke();
    },
    2(ctx, w, h, t) { // Go Network: institutions on a ring, value hops between them through the network core
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .36, N = 8, hub = R * .26;
      const node = i => { const a = -Math.PI / 2 + i / N * Math.PI * 2; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; };
      const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.3); g0.addColorStop(0, 'rgba(60,100,255,.22)'); g0.addColorStop(1, 'rgba(60,100,255,0)');
      ctx.fillStyle = g0; ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 0; i < N; i++) { const [x, y] = node(i); ctx.strokeStyle = 'rgba(140,170,255,.2)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, cy); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(140,170,255,.16)'; ctx.setLineDash([2, 7]); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      const recv = new Array(N).fill(0), send = new Array(N).fill(0);
      for (let k = 0; k < 3; k++) {
        const period = 5.4, tt = t / period + k / 3, cyc = Math.floor(tt), ph = tt - cyc;
        const a = (cyc * 3 + k * 5 + 1) % N, b = (a + 2 + ((cyc + k) % 4)) % N; if (a === b) continue;
        const A = node(a), B = node(b);
        const leg1 = sm(.05, .42, ph), leg2 = sm(.5, .86, ph), fade = 1 - sm(.9, 1, ph);
        send[a] = Math.max(send[a], 1 - sm(0, .45, ph)); recv[b] = Math.max(recv[b], sm(.84, .9, ph) * (1 - sm(.92, 1, ph)));
        const trail = (P, Q, u0, u1) => {
          const x0 = P[0] + (Q[0] - P[0]) * Math.max(0, u0), y0 = P[1] + (Q[1] - P[1]) * Math.max(0, u0), x1 = P[0] + (Q[0] - P[0]) * u1, y1 = P[1] + (Q[1] - P[1]) * u1;
          const gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(120,160,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${fade})`);
          ctx.strokeStyle = gr; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          const q = ctx.createRadialGradient(x1, y1, 0, x1, y1, 18); q.addColorStop(0, `rgba(255,255,255,${.95 * fade})`); q.addColorStop(1, 'rgba(90,130,255,0)');
          ctx.fillStyle = q; ctx.beginPath(); ctx.arc(x1, y1, 18, 0, 7); ctx.fill();
        };
        if (leg1 > 0 && leg1 < 1) trail(A, [cx, cy], leg1 - .45, leg1);
        else if (leg2 > 0 && leg2 < 1) trail([cx, cy], B, leg2 - .45, leg2);
      }
      const pulse = .5 + .5 * Math.sin(t * 1.6);
      const cg = ctx.createRadialGradient(cx, cy, hub * .4, cx, cy, hub * 2.6); cg.addColorStop(0, 'rgba(60,110,255,.55)'); cg.addColorStop(1, 'rgba(60,110,255,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, hub * 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#1647DB'; ctx.beginPath(); ctx.arc(cx, cy, hub, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${(.5 + pulse * .3).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, hub + 8 + pulse * 5, 0, 7); ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); const ss = hub * 1.2 / 184; ctx.scale(ss, ss); ctx.translate(-78.4, -91.8); ctx.fillStyle = '#fff'; ctx.fill(SHIELD, 'evenodd'); ctx.restore();
      for (let i = 0; i < N; i++) {
        const [x, y] = node(i), r = Math.max(9, R * .075), lit = Math.max(send[i], recv[i]);
        if (lit > 0.01) { const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 4); gl.addColorStop(0, `rgba(110,150,255,${(.55 * lit).toFixed(2)})`); gl.addColorStop(1, 'rgba(110,150,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#060d2e'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = lit > .05 ? `rgba(255,255,255,${(.6 + lit * .4).toFixed(2)})` : 'rgba(170,195,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
        ctx.fillStyle = lit > .05 ? '#fff' : 'rgba(170,195,255,.85)'; ctx.beginPath(); ctx.arc(x, y, r * .32, 0, 7); ctx.fill();
        if (recv[i] > .01) { ctx.strokeStyle = `rgba(255,255,255,${(.8 * (1 - recv[i])).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r + (1 - recv[i]) * 24, 0, 7); ctx.stroke(); }
      }
    }
  };
  $$('canvas[data-art]').forEach(cv => {
    const k = cv.dataset.art;
    loop(cv, (ctx, w, h, t, c) => arts[k](ctx, w, h, t, c));
  });
})();
