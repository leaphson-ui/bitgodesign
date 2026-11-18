/* Qualified Custody, built from the v3 Refokus homepage. DOM, scroll choreography and 2D canvas art.
   Copy comes word for word from window.QC (content-qc.js); client logos from window.BITGO; nav and footer from window.CHROME (chrome.js).
   WebGL lives in gl.js and wallet3d.js, so a GL failure never blocks this file. */
(function () {
  const B = window.BITGO, Q = window.QC;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const LOGO = '../shared/assets/bitgo-logo.svg';
  const CONNECT = 'https://www.bitgo.com/connect-with-us/';
  if (!reduce) document.documentElement.classList.add('js');

  /* ---------- nav, mobile menu and footer: today's live bitgo.com chrome (chrome.js) ---------- */
  renderChrome({ logoHref: '../v3-refokus/index.html' });
  const nav = $('#nav');

  /* ---------- hero: the homepage hero module (rotating word), with the live QC words ---------- */
  const H = Q.hero;
  Modules.hero($('#hero'), { eyebrow: H.eyebrow, words: H.words, rest: H.rest, label: H.h1, lead: H.sub, cta: { label: H.cta, href: CONNECT } });   // the shared hero; QC's shield reads the slot box

  /* ---------- trust marquee (same logos and order as the live page) ---------- */
  const lg = B.trust.logos;
  Modules.logos($('#trust'), { title: Q.trustTitle, logos: lg });   // the shared logo strip

  /* ---------- credentials statement: the shared Statement module ---------- */
  Modules.statement($('#badges'), { lines: [{ text: 'NYSE Listed: BTGO', em: 'BTGO' }, { text: 'OCC Federally Chartered', em: 'OCC' }, { text: 'Founded in 2013', em: '2013' }] });

  /* ---------- intro ---------- */
  const I = Q.intro;
  $('#intro').innerHTML = `<div class="wrap"><div class="intro-in">${Parts.eyebrow(I.label)}<h2 data-rv>${I.title}</h2><p class="lead" data-rv>${I.text}</p></div></div>`;

  /* ---------- the three protections: pinned, one screen per step, the shield changes with each ---------- */
  const F = Q.features;
  $('#keys').innerHTML =
    `<div class="core-track" id="keysTrack" style="height:${F.length * 90 + 112}vh"><div class="core-sticky"><div class="wrap"><div class="core-panel">
      <div class="core-list">${F.map((it, i) => `<button data-i="${i}">${it.title}</button>`).join('')}</div>
      <div class="core-body">${F.map((it, i) => `<div class="core-item" data-i="${i}"><h3>${it.title}</h3><p class="sh">${it.short}</p><p class="lg">${it.text}</p>${i === F.length - 1 ? `<a class="btn white" href="${Q.featuresCta.href}">${Q.featuresCta.label}${arrow}</a>` : ''}</div>`).join('')}</div>
    </div></div></div></div>`;
  window.__keys = { active: -1 };
  const keysTrack = $('#keysTrack'), keyBtns = $$('#keys .core-list button'), keyItems = $$('#keys .core-item');
  const keyPanel = $('#keys .core-panel');
  keyBtns.forEach(b => b.onclick = () => {
    const i = +b.dataset.i, top = keysTrack.getBoundingClientRect().top + scrollY, span = keysTrack.offsetHeight - innerHeight * 1.12;
    scrollTo({ top: top + span * ((i + .5) / F.length) });
  });
  function updateKeys() {
    const r = keysTrack.getBoundingClientRect(), span = keysTrack.offsetHeight - innerHeight * 1.12;
    const p = clamp(-r.top / span);
    keyPanel.style.opacity = sm(0, innerHeight * .2, r.bottom - innerHeight).toFixed(3);
    const idx = r.top > innerHeight * .35 ? -1 : Math.min(F.length - 1, Math.floor(p * F.length));
    if (idx !== window.__keys.active) {
      window.__keys.active = idx;
      keyBtns.forEach((b, i) => b.classList.toggle('on', i === idx));
      keyItems.forEach((b, i) => b.classList.toggle('on', i === idx));
    }
  }

  /* ---------- ecosystem: four live cards on the blue band ---------- */
  const E = Q.eco;
  $('#eco').innerHTML =
    `<div class="wrap">${Modules.headline({ title: E.title, text: E.text })}
    <div class="ecards">${E.cards.map((c, i) =>
      `<a class="ecard c${i}" href="${c.href}" data-rv style="--d:${(i % 2) * .08}s"><canvas data-art="${i}" aria-hidden="true"></canvas><div class="et">${Parts.eyebrow(c.label, { light: i === 1 || i === 2, rv: false })}<h3>${c.title}</h3><span class="lnk">${c.link}${arrow}</span></div></a>`).join('')}</div></div>`;

  /* ---------- guide: a frosted glass panel over the shield ---------- */
  const G = Q.guide;
  Modules.banner($('#guide'), { title: G.title, em: ['Qualified Custody'], cta: G.cta });   // the shared CTA banner

  /* ---------- global access ---------- */
  const GL = Q.global;
  Modules.split($('#global'), { eyebrow: GL.label, title: GL.title, text: GL.text, cta: GL.cta, side: 'right', visual: { html: '<canvas id="globe3d" aria-hidden="true"></canvas>' } });

  /* ---------- custody wallets: 50/50, wallet left ---------- */
  const WL = Q.wallet;
  Modules.split($('#wallet'), { eyebrow: WL.label, title: WL.title, text: [WL.text], cta: WL.cta, side: 'left', visual: { html: '<canvas id="wallet3d" aria-hidden="true"></canvas>' } });
  window.__wallet = { p: 0 };

  /* ---------- since 2013: words light up as you read down ---------- */
  $('#since').innerHTML = `<div class="wrap"><p class="since-t">${Q.statement.split(' ').map(w => `<span>${w}</span>`).join(' ')}</p></div>`;
  const sinceWords = $$('.since-t span');

  /* ---------- FAQs and latest: the shared modules ---------- */
  Modules.faq($('#faq'), { title: Q.faqTitle, items: Q.faqs });
  const L = Q.latest;
  Modules.latest($('#latest'), { title: L.title, all: L.all, posts: L.posts });

  /* ---------- cta ---------- */
  const CT = Q.cta;
  Modules.split($('#cta'), { title: CT.title.join(' '), cta: { label: CT.button, href: CONNECT }, side: 'right', visual: {} });   // closing CTA as a 50/50

  /* ---------- newsletter module (the live footer's newsletter, given its own stage) ---------- */
  renderNewsModule($('#news'));

  /* ---------- reveals ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -4% 0px', threshold: 0.01 });
    $$('[data-rv]').forEach(el => io.observe(el));
    setTimeout(() => $$('[data-rv]:not(.in)').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('in'); }), 1500);
  }

  /* ---------- scroll ---------- */
  const wl = $('#wallet');
  function onScroll() {
    nav.classList.toggle('solid', scrollY > 40);
    sinceWords.forEach(s => {
      const r = s.getBoundingClientRect(), c = r.top + r.height / 2 + r.left / innerWidth * 60;
      s.style.setProperty('--o', (reduce ? 1 : lerp(.18, 1, sm(innerHeight * .86, innerHeight * .5, c))).toFixed(3));
    });
    const wr = wl.getBoundingClientRect();
    window.__wallet.p = clamp((innerHeight - wr.top) / (innerHeight * 1.1));
    updateKeys();
  }
  let tick = false;
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; onScroll(); }); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

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
  const shieldAt = (ctx, x, y, size, col) => { ctx.save(); ctx.translate(x, y); const s = size / 184; ctx.scale(s, s); ctx.translate(-78.4, -91.8); ctx.fillStyle = col; ctx.fill(SHIELD, 'evenodd'); ctx.restore(); };

  const arts = {
    0(ctx, w, h, t) { // Trade (dark): a live depth book; bids and asks meet at the price, fills flash across it
      const mid = w / 2, base = h * .86, top = h * .16, N = 26;
      const drift = Math.sin(t * .35) * w * .015;
      const g0 = ctx.createRadialGradient(mid, base, 0, mid, base, w * .7); g0.addColorStop(0, 'rgba(60,100,255,.22)'); g0.addColorStop(1, 'rgba(60,100,255,0)');
      ctx.fillStyle = g0; ctx.fillRect(0, 0, w, h);
      const side = s => {
        ctx.beginPath(); ctx.moveTo(mid + drift, base);
        let cum = 0, py = base;
        for (let i = 0; i <= N; i++) {
          const x = mid + drift + s * (i / N) * (w * .46);
          cum += .5 + .5 * Math.sin(i * 1.7 + (s > 0 ? 2 : 0) + t * .6 + Math.sin(i * .9 + t * .25) * 1.4);
          const y = base - Math.min(base - top, cum / N * (base - top) * 1.55);
          ctx.lineTo(x, py); ctx.lineTo(x, y); py = y;      // stepped, like a real depth book
        }
        ctx.lineTo(mid + drift + s * w * .46, base); ctx.closePath();
        const gr = ctx.createLinearGradient(0, top, 0, base);
        gr.addColorStop(0, s < 0 ? 'rgba(77,120,255,.85)' : 'rgba(234,240,255,.75)'); gr.addColorStop(1, s < 0 ? 'rgba(22,71,219,.15)' : 'rgba(150,175,255,.08)');
        ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = s < 0 ? 'rgba(140,170,255,.95)' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.stroke();
      };
      side(-1); side(1);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.moveTo(mid + drift, top - 10); ctx.lineTo(mid + drift, base); ctx.stroke(); ctx.setLineDash([]);
      for (let k = 0; k < 4; k++) {
        const ph = (t * .45 + k / 4) % 1, y = lerp(base - 10, top + 10, (k * .37 + Math.floor(t * .45 + k / 4) * .21) % 1);
        const a = Math.sin(ph * Math.PI), len = w * .12 * a;
        const gr = ctx.createLinearGradient(mid + drift - len, y, mid + drift + len, y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, `rgba(255,255,255,${(.9 * a).toFixed(2)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = gr; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(mid + drift - len, y); ctx.lineTo(mid + drift + len, y); ctx.stroke();
      }
      const q = ctx.createRadialGradient(mid + drift, top, 0, mid + drift, top, 26); q.addColorStop(0, 'rgba(255,255,255,.9)'); q.addColorStop(1, 'rgba(90,130,255,0)');
      ctx.fillStyle = q; ctx.beginPath(); ctx.arc(mid + drift, top, 26, 0, 7); ctx.fill();
    },
    1(ctx, w, h, t) { // Stake (light): rewards radiating outward from a stake, rings with travelling beads
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
          ctx.fillStyle = `rgba(3,7,26,${(.3 + a * .7).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
        }
      }
      ctx.fillStyle = '#1647DB'; ctx.beginPath(); ctx.arc(cx, cy, 20 + Math.sin(t * 2) * 2, 0, 7); ctx.fill();
      shieldAt(ctx, cx, cy, 22, '#fff');
    },
    2(ctx, w, h, t) { // Finance (light): collateral on one side, capital on the other, a beam that keeps them in balance
      const cx = w / 2, by = h * .78, W = Math.min(w * .26, h * .42), T = W * .1, G = T * 1.9;
      const tilt = Math.sin(t * .5) * .06;
      const lx = cx - w * .22, rx = cx + w * .22;
      const ly = by + Math.sin(tilt) * w * .22, ry = by - Math.sin(tilt) * w * .22;
      ctx.strokeStyle = 'rgba(3,7,26,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, by + 10); ctx.lineTo(cx - 26, h * .95); ctx.lineTo(cx + 26, h * .95); ctx.closePath(); ctx.stroke();
      const nL = 6, nR = 4 + Math.round(1 + Math.sin(t * .5));
      for (let i = 0; i < nL; i++) iso(ctx, lx, ly - i * G - T, W, T, ['#0b2a99', '#091f75', '#1647DB']);
      for (let i = 0; i < nR; i++) iso(ctx, rx, ry - i * G - T, W, T, ['#9fb4ee', '#7f98de', '#eaf0ff']);
      ctx.strokeStyle = 'rgba(3,7,26,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, ly + W * .25 + T + 4); ctx.lineTo(rx, ry + W * .25 + T + 4); ctx.stroke();
      ctx.fillStyle = '#03071a'; ctx.beginPath(); ctx.arc(cx, by + W * .25 + T + 4 + (ly - ry) * 0, 5, 0, 7); ctx.fill();
      // capital moving across, both ways
      for (let k = 0; k < 5; k++) {
        const ph = (t * .22 + k / 5) % 1, dir = k % 2 ? 1 : -1, u = dir > 0 ? ph : 1 - ph;
        const x = lerp(lx, rx, u), y = lerp(ly - nL * G - W * .2, ry - nR * G - W * .2, u) - Math.sin(u * Math.PI) * h * .14;
        const a = Math.sin(ph * Math.PI);
        ctx.fillStyle = dir > 0 ? `rgba(22,71,219,${(.85 * a).toFixed(2)})` : `rgba(3,7,26,${(.6 * a).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(x, y, 4 + a * 3, 0, 7); ctx.fill();
      }
    },
    3(ctx, w, h, t) { // Settle (dark): institutions on a ring, value hops between them through the network core
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .36, N = 8, hub = R * .26;
      const node = i => { const a = -Math.PI / 2 + i / N * Math.PI * 2; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; };
      const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.3); g0.addColorStop(0, 'rgba(60,100,255,.22)'); g0.addColorStop(1, 'rgba(60,100,255,0)');
      ctx.fillStyle = g0; ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      for (let i = 0; i < N; i++) { const [x, y] = node(i); ctx.strokeStyle = 'rgba(140,170,255,.2)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, cy); ctx.stroke(); }
      const recv = new Array(N).fill(0), send = new Array(N).fill(0);
      for (let k = 0; k < 3; k++) {
        const period = 5.4, tt = t / period + k / 3, cyc = Math.floor(tt), ph = tt - cyc;
        const a = (cyc * 3 + k * 5 + 1) % N, b = (a + 2 + ((cyc + k) % 4)) % N; if (a === b) continue;
        const P = node(a), Qn = node(b);
        const leg1 = sm(.05, .42, ph), leg2 = sm(.5, .86, ph), fade = 1 - sm(.9, 1, ph);
        send[a] = Math.max(send[a], 1 - sm(0, .45, ph)); recv[b] = Math.max(recv[b], sm(.84, .9, ph) * (1 - sm(.92, 1, ph)));
        const trail = (S, D, u0, u1) => {
          const x0 = S[0] + (D[0] - S[0]) * Math.max(0, u0), y0 = S[1] + (D[1] - S[1]) * Math.max(0, u0), x1 = S[0] + (D[0] - S[0]) * u1, y1 = S[1] + (D[1] - S[1]) * u1;
          const gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(120,160,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${fade})`);
          ctx.strokeStyle = gr; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        };
        if (leg1 > 0 && leg1 < 1) trail(P, [cx, cy], leg1 - .45, leg1);
        else if (leg2 > 0 && leg2 < 1) trail([cx, cy], Qn, leg2 - .45, leg2);
      }
      ctx.fillStyle = '#1647DB'; ctx.beginPath(); ctx.arc(cx, cy, hub, 0, 7); ctx.fill();
      shieldAt(ctx, cx, cy, hub * 1.2, '#fff');
      for (let i = 0; i < N; i++) {
        const [x, y] = node(i), r = Math.max(8, R * .075), lit = Math.max(send[i], recv[i]);
        ctx.fillStyle = '#060d2e'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = lit > .05 ? `rgba(255,255,255,${(.6 + lit * .4).toFixed(2)})` : 'rgba(170,195,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
        ctx.fillStyle = lit > .05 ? '#fff' : 'rgba(170,195,255,.85)'; ctx.beginPath(); ctx.arc(x, y, r * .32, 0, 7); ctx.fill();
      }
    },
    globe(ctx, w, h, t) { // Global Access: a turning globe, the five regions BitGo serves lit and joined to one custody core
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .42, rot = t * .12 - 1.2, tiltX = .38;
      const proj = (lat, lon) => {
        const la = lat * Math.PI / 180, lo = lon * Math.PI / 180 + rot;
        let x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
        const y2 = y * Math.cos(tiltX) - z * Math.sin(tiltX), z2 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
        return [cx + x * R, cy - y2 * R, z2];
      };
      const halo = ctx.createRadialGradient(cx, cy, R * .6, cx, cy, R * 1.35); halo.addColorStop(0, 'rgba(22,71,219,.0)'); halo.addColorStop(.75, 'rgba(60,110,255,.38)'); halo.addColorStop(1, 'rgba(22,71,219,0)');
      ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
      const body = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R); body.addColorStop(0, '#2a56c8'); body.addColorStop(.55, '#0f2a78'); body.addColorStop(1, '#040a24');
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.lineWidth = 1;
      const line = pts => { ctx.beginPath(); let on = false; pts.forEach(([x, y, z]) => { if (z > 0) { on ? ctx.lineTo(x, y) : ctx.moveTo(x, y); on = true; } else on = false; }); ctx.stroke(); };
      ctx.strokeStyle = 'rgba(170,195,255,.3)';
      for (let lat = -60; lat <= 60; lat += 30) line(Array.from({ length: 73 }, (_, i) => proj(lat, i * 5)));
      for (let lon = 0; lon < 360; lon += 30) line(Array.from({ length: 37 }, (_, i) => proj(-90 + i * 5, lon)));
      const regions = [[40, -100], [50, 10], [25, 50], [30, 5], [10, 110]];
      const core = proj(48, 8);
      const pts = regions.map(([a, b]) => proj(a, b));
      pts.forEach((p, i) => {
        if (p[2] <= 0 || core[2] <= 0) return;
        const mx = (p[0] + core[0]) / 2, my = (p[1] + core[1]) / 2 - R * .22;
        const ph = (t * .3 + i * .21) % 1;
        ctx.strokeStyle = 'rgba(140,170,255,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(core[0], core[1]); ctx.quadraticCurveTo(mx, my, p[0], p[1]); ctx.stroke();
        const u = ph, bx = (1 - u) * (1 - u) * core[0] + 2 * (1 - u) * u * mx + u * u * p[0], byy = (1 - u) * (1 - u) * core[1] + 2 * (1 - u) * u * my + u * u * p[1];
        ctx.fillStyle = `rgba(255,255,255,${(.9 * Math.sin(u * Math.PI)).toFixed(2)})`; ctx.beginPath(); ctx.arc(bx, byy, 2.6, 0, 7); ctx.fill();
      });
      pts.forEach(([x, y, z], i) => {
        if (z <= 0) return;
        const a = Math.min(1, z * 2.2), pulse = .5 + .5 * Math.sin(t * 1.4 + i);
        const gl = ctx.createRadialGradient(x, y, 0, x, y, 22); gl.addColorStop(0, `rgba(110,150,255,${(.55 * a).toFixed(2)})`); gl.addColorStop(1, 'rgba(110,150,255,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${(.6 * a * (1 - pulse)).toFixed(2)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 8 + pulse * 14, 0, 7); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
      });
      if (core[2] > 0) { ctx.fillStyle = '#1647DB'; ctx.beginPath(); ctx.arc(core[0], core[1], 15, 0, 7); ctx.fill(); shieldAt(ctx, core[0], core[1], 17, '#fff'); }
      const rim = ctx.createRadialGradient(cx, cy, R * .92, cx, cy, R); rim.addColorStop(0, 'rgba(120,160,255,0)'); rim.addColorStop(1, 'rgba(120,160,255,.45)');
      ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    }
  };
  $$('canvas[data-art]').forEach(cv => {
    const k = cv.dataset.art;
    loop(cv, (ctx, w, h, t, c) => arts[k](ctx, w, h, t, c));
  });
  Parts.titleize(document.querySelector('main') || document.body);   // headings in Title Case (shared rule)
})();
