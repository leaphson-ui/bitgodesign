/* Qualified Custody, built from the v3 Refokus homepage. DOM, scroll choreography and 2D canvas art.
   Copy comes word for word from window.QC (content-qc.js); nav, client logos and footer from window.BITGO.
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

  /* ---------- nav (same as the homepage) ---------- */
  const A = B.navActions;
  $('#skip').textContent = B.skip;
  $('#nav').innerHTML =
    `<a class="logo" href="../v3-refokus/index.html" aria-label="BitGo"><img src="${LOGO}" alt="BitGo" width="77" height="26"></a>
    <nav class="menus" aria-label="Primary">${B.menus.map(m =>
      `<div class="mi"><button aria-expanded="false">${m.label}</button><div class="mega">${m.groups.map(g =>
        `<div class="mg"><h4>${g.title}</h4><ul>${g.items.map(i => `<li><a href="${i.href}">${i.label}</a></li>`).join('')}</ul></div>`).join('')}</div></div>`).join('')}</nav>
    <div class="acts"><span class="lang">${A.language}</span><a class="lnk" href="${A.login.href}">${A.login.label}</a><a class="lnk" href="${A.signup.href}">${A.signup.label}</a><a class="btn" href="${CONNECT}">${A.connect}</a><button class="burger" aria-label="Menu"><i></i><i></i></button></div>`;
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

  /* ---------- hero: the homepage hero module (rotating word), with the live QC words ---------- */
  const H = Q.hero;
  const split = w => [...w].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join('');
  $('#hero').innerHTML =
    `<div class="hero-copy wrap"><p class="eyebrow" data-rv><i aria-hidden="true"></i>${H.eyebrow}</p>
    <h1 aria-label="${H.h1}"><span class="rot" aria-hidden="true">${H.words.map(w => `<span class="rw">${split(w)}</span>`).join('')}</span><span class="rest" aria-hidden="true">${H.rest}</span></h1>
    <div class="hero-row"><a class="btn" href="${CONNECT}">${H.cta}${arrow}</a><p>${H.sub}</p></div></div>`;
  const rws = $$('.rw');
  let cur = 0;
  rws[0].classList.add('on');
  setInterval(() => {
    if (document.hidden) return;
    const prev = rws[cur]; cur = (cur + 1) % rws.length;
    prev.classList.remove('on'); prev.classList.add('out');
    setTimeout(() => prev.classList.remove('out'), 1100);
    rws[cur].classList.add('on');
  }, 2800);

  /* ---------- trust marquee (same logos and order as the live page) ---------- */
  const lg = B.trust.logos;
  const mqRow = (arr, rev) => `<div class="mq${rev ? ' rev' : ''}"><div class="mq-t">${[...arr, ...arr].map(s => `<img src="${s}" alt="" loading="lazy">`).join('')}</div></div>`;
  $('#trust').innerHTML = `<div class="wrap"><h2 data-rv>${Q.trustTitle}</h2></div>` + mqRow(lg, false) + mqRow([...lg].reverse(), true);

  /* ---------- credentials statement ---------- */
  $('#badges').innerHTML = `<div class="wrap"><p class="stmt">${Q.badges.map(b => `<span>${b.replace(/BTGO$/, '<b>BTGO</b>')}</span>`).join('')}</p></div>`;
  const stmtSpans = $$('.stmt span');

  /* ---------- intro ---------- */
  const I = Q.intro;
  $('#intro').innerHTML = `<div class="wrap"><div class="intro-in"><p class="eyebrow" data-rv><i aria-hidden="true"></i>${I.label}</p><h2 data-rv>${I.title}</h2><p class="lead" data-rv>${I.text}</p></div></div>`;

  /* ---------- the three protections: pinned, one screen per step, the shield changes with each ---------- */
  const F = Q.features;
  $('#keys').innerHTML =
    `<div class="core-track" id="keysTrack" style="height:${F.length * 90 + 112}vh"><div class="core-sticky"><div class="core-shade" aria-hidden="true"></div><div class="wrap"><div class="core-panel">
      <div class="core-list">${F.map((it, i) => `<button data-i="${i}">${it.title}</button>`).join('')}</div>
      <div class="core-body">${F.map((it, i) => `<div class="core-item" data-i="${i}"><h3>${it.title}</h3><p class="sh">${it.short}</p><p class="lg">${it.text}</p>${i === F.length - 1 ? `<a class="btn" href="${Q.featuresCta.href}">${Q.featuresCta.label}${arrow}</a>` : ''}</div>`).join('')}</div>
    </div></div></div></div>`;
  window.__keys = { active: -1 };
  const keysTrack = $('#keysTrack'), keyBtns = $$('#keys .core-list button'), keyItems = $$('#keys .core-item');
  const keyShade = $('#keys .core-shade'), keyPanel = $('#keys .core-panel');
  keyBtns.forEach(b => b.onclick = () => {
    const i = +b.dataset.i, top = keysTrack.getBoundingClientRect().top + scrollY, span = keysTrack.offsetHeight - innerHeight * 1.12;
    scrollTo({ top: top + span * ((i + .5) / F.length) });
  });
  function updateKeys() {
    const r = keysTrack.getBoundingClientRect(), span = keysTrack.offsetHeight - innerHeight * 1.12;
    const p = clamp(-r.top / span);
    // the shade lives inside the pinned frame: it fades in as the pin starts and is gone before the pin lets go
    const enter = sm(innerHeight * .95, innerHeight * .15, r.top), exit = sm(0, innerHeight * .3, r.bottom - innerHeight);
    keyShade.style.opacity = (enter * exit).toFixed(3);
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
    `<div class="wrap"><div class="eco-head"><h2 class="big" data-rv>${E.title}</h2><p class="lead" data-rv>${E.text}</p></div>
    <div class="ecards">${E.cards.map((c, i) =>
      `<a class="ecard c${i}" href="${c.href}" data-rv style="--d:${(i % 2) * .08}s"><canvas data-art="${i}" aria-hidden="true"></canvas><div class="et"><p class="eyebrow sm${i === 1 || i === 2 ? ' light' : ''}"><i aria-hidden="true"></i>${c.label}</p><h3>${c.title}</h3><span class="lnk">${c.link}${arrow}</span></div></a>`).join('')}</div></div>`;

  /* ---------- guide: a frosted glass panel over the shield ---------- */
  const G = Q.guide;
  $('#guide').innerHTML = `<div class="wrap"><div class="glass-panel" data-rv><h2>${G.title.map(t => `<span>${t}</span>`).join('')}</h2><a class="btn" href="${G.cta.href}">${G.cta.label}${arrow}</a></div></div>`;

  /* ---------- global access ---------- */
  const GL = Q.global;
  $('#global').innerHTML =
    `<div class="wrap"><div class="gl-grid"><div class="gl-copy"><p class="eyebrow" data-rv><i aria-hidden="true"></i>${GL.label}</p><h2 class="big" data-rv>${GL.title}</h2>${GL.text.map(t => `<p class="lead" data-rv>${t}</p>`).join('')}<a class="btn ghost" href="${GL.cta.href}" data-rv>${GL.cta.label}${arrow}</a></div>
    <div class="gl-art"><canvas data-art="globe" aria-hidden="true"></canvas></div></div></div>`;

  /* ---------- custody wallets: light studio, the shield closes as you arrive ---------- */
  const WL = Q.wallet;
  $('#wallet').innerHTML =
    `<div class="wrap"><div class="wl-grid"><div class="wl-art"><canvas id="wallet3d" aria-hidden="true"></canvas></div>
    <div class="wl-copy"><p class="eyebrow light" data-rv><i aria-hidden="true"></i>${WL.label}</p><h2 class="big" data-rv>${WL.title}</h2><p class="lead" data-rv>${WL.text}</p><a class="btn" href="${WL.cta.href}" data-rv>${WL.cta.label}${arrow}</a></div></div></div>`;
  window.__wallet = { p: 0 };

  /* ---------- since 2013: words light up as you read down ---------- */
  $('#since').innerHTML = `<div class="wrap"><p class="since-t">${Q.statement.split(' ').map(w => `<span>${w}</span>`).join(' ')}</p></div>`;
  const sinceWords = $$('.since-t span');

  /* ---------- FAQs ---------- */
  $('#faq').innerHTML =
    `<div class="wrap"><div class="faq-grid"><div class="faq-side"><h2 class="big">${Q.faqTitle}</h2></div>
    <div class="faq-list">${Q.faqs.map(f => `<details><summary><h3>${f.q}</h3><span class="pm" aria-hidden="true"></span></summary><div class="ans"><p>${f.a}</p></div></details>`).join('')}</div></div></div>`;

  /* ---------- latest ---------- */
  const L = Q.latest;
  $('#latest').innerHTML =
    `<div class="wrap"><div class="lat-top"><h2 class="big" data-rv>${L.title}</h2><a class="btn ghost" href="${L.all.href}">${L.all.label}${arrow}</a></div>
    <div>${L.posts.map(p => `<a class="post" href="${p.href}" data-rv><h3>${p.title}</h3><span class="go">${arrow}</span></a>`).join('')}</div></div>`;

  /* ---------- cta ---------- */
  const CT = Q.cta;
  $('#cta').innerHTML = `<div class="cta-block"><h2>${CT.title.map(t => `<span>${t}</span>`).join('')}</h2><a class="btn" href="${CONNECT}">${CT.button}${arrow}</a></div>`;

  /* ---------- newsletter module (the footer's newsletter copy, given its own stage) ---------- */
  const FT = B.footer;
  const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  $('#news').innerHTML =
    `<div class="wrap"><div class="news-in"><h2 data-rv>${FT.newsletter}</h2>
    <form class="nl2" data-rv novalidate><input type="email" placeholder="${FT.email}" aria-label="${FT.email}" autocomplete="email"><button class="btn" type="submit"><span>${FT.subscribe}</span><b class="ar">${arrow}</b><b class="ok">${check}</b></button></form></div></div>`;
  const nl2 = $('.nl2');
  nl2.addEventListener('submit', e => { e.preventDefault(); const inp = $('input', nl2); if (inp.value.includes('@')) nl2.classList.add('done'); else { nl2.classList.remove('shake'); void nl2.offsetWidth; nl2.classList.add('shake'); inp.focus(); } });

  /* ---------- footer (the homepage footer; the newsletter now has its own module above) ---------- */
  $('#footer').innerHTML =
    `<div class="wrap"><div class="foot-top">
    <div class="soc">${FT.socials.map(s => `<a href="${s.href}" target="_blank" rel="noopener">${s.label}</a>`).join('')}</div></div>
    <div class="foot-logo"><img src="${LOGO}" alt="BitGo"></div>
    <div class="legal">${FT.legal.map(p => `<p>${p}</p>`).join('')}<p>${FT.complaints}</p><p>${FT.screenReader}</p>
    <p class="links"><span>${FT.review} <a href="${FT.privacy.href}">${FT.privacy.label}</a> ${FT.and} <a href="${FT.disclaimers.href}">${FT.disclaimers.label}</a>.</span><span>${FT.nmls}</span><span>${FT.choices}</span><span>&copy; ${FT.rights}</span></p></div></div>`;

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
    stmtSpans.forEach(s => {
      const r = s.getBoundingClientRect(), c = r.top + r.height / 2;
      s.style.setProperty('--o', (reduce ? .95 : lerp(.2, 1, sm(innerHeight * .98, innerHeight * .5, c))).toFixed(3));
    });
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
})();
