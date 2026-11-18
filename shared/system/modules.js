/* BitGo design system: page modules (render functions). Copy always comes in from the page's content file.
   Modules.split(el, { eyebrow, title, text: [], cta: {label, href, style}, side: 'right'|'left', visual: {model, fit, partner} })
   visual may instead be { ui } (a product UI art), { scene, opts } (a 2D scene from scenes.js: line, dots, 24/7 grid, ascii)
   or { logo: src | [src, ...], alt } (the real mark(s) the live section shows, e.g. an issuer's logo), alone or with a scene behind.
   { image: src, alt } shows the live section's own picture (a report cover, a real product screen); { video: src, poster, alt } its
   own product loop (muted, looping; a still poster frame under reduced motion).
   logoAt: 'top' stacks the logo above its scene instead of over it (for a busy scene such as the 24/7 grid).
   Composition (so a visual never just floats): visual.frame 'panel' (an ink surface with a blue glow) or 'glass' (frosted);
   visual.backdrop { scene, opts } draws a scene behind the visual's main content (a UI art, a logo, a cover);
   visual.cover { eyebrow, title } is a typographic report cover set from the section's own copy (no live images);
   layout 'wide' centres the copy over a full-width stage. (No overlap layout: two cards overlapping read badly, user 2026-11-18.)
   A 3D model is drawn on the page's WebGL canvas behind the page, so it never goes in a frame (the panel would hide it):
   frames hold product screens, scenes, covers and logos; models keep the open ground.
   The visual is a 3D slot drawn by the page's gl.js (data-model), centred in its half. */
(function () {
  // a live picture or product loop (video: muted, looping, inline; reduced motion shows the poster or first frame, no autoplay)
  const media = m => m.video ? `<video src="${m.video}"${m.poster ? ` poster="${m.poster}"` : ''} muted loop playsinline preload="metadata"${matchMedia('(prefers-reduced-motion: reduce)').matches ? '' : ' autoplay'} aria-label="${m.alt || ''}"></video>` : `<img src="${m.image}" alt="${m.alt || ''}" loading="lazy">`;
  // a 2D scene slot (scenes.js mounts it: Page.finish loads scenes.js when a page has one)
  const sceneCanvas = (name, opts) => `<canvas class="m-scene" data-scene="${name}"${opts ? ` data-scene-opts='${JSON.stringify(opts).replace(/'/g, '&#39;')}'` : ''} aria-hidden="true"></canvas>`;

  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const EB = '<i aria-hidden="true"></i>';
  window.Modules = {
    split(el, o) {
      el.classList.add('m-split'); if (o.side === 'left') el.classList.add('left');
      if (o.layout === 'wide') el.classList.add('m-wide');   // wide: the copy centred over a full-width stage (the overlap layout was rejected 2026-11-18)
      const v = o.visual || {};
      const cover = c => `<div class="m-cover"><div class="mcv-in"><span class="mcv-mark"></span><span class="mcv-eb">${c.eyebrow || ''}</span><span class="mcv-title">${c.title}</span><span class="mcv-rule"></span></div></div>`;
      const frame = v.frame ? ` frame-${v.frame}` : '';
      if (o.visual == null) el.classList.add('m-novis');   // no visual given (null or left out): the copy centres, never an empty half. visual: {} keeps the open half on purpose (Qualified Custody's closing 50/50)
      el.innerHTML = `<div class="wrap"><div class="m-in">
        <div class="m-copy">${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}<h2 data-rv>${o.title}</h2>
          ${(o.text || []).map(t => `<p class="lead" data-rv>${t}</p>`).join('')}
          ${o.list ? `<ul class="m-list">${o.list.map((t, i) => `<li class="lead" data-rv style="--d:${(i * .06).toFixed(2)}s">${t}</li>`).join('')}</ul>` : ''}
          ${o.cta ? `<a class="btn ${o.cta.style || 'white'}" href="${o.cta.href}" data-rv>${o.cta.label}${arrow}</a>` : ''}</div>
        <div class="m-vis${v.logoAt === 'top' ? ' logo-top' : ''}${frame}">${v.backdrop ? sceneCanvas(v.backdrop.scene, v.backdrop.opts).replace('class="m-scene"', 'class="m-scene m-backdrop"') : ''}${v.cover ? cover(v.cover) : ''}${v.html || ''}${v.scene ? sceneCanvas(v.scene, v.opts) : ''}${v.image ? `<div class="m-img"><img src="${v.image}" alt="${v.alt || ''}" loading="lazy"></div>` : ''}${v.video ? `<div class="m-img">${media({ video: v.video, poster: v.poster, alt: v.alt })}</div>` : ''}${v.logo ? `<div class="m-logo">${[].concat(v.logo).map(s => `<img src="${s}" alt="${v.alt || ''}">`).join('')}</div>` : ''}${v.ui ? `<div class="mc-ui" data-mc-ui="${v.ui}" aria-hidden="true"></div>` : ''}${v.model ? `<div class="slot" data-model="${v.model}" data-fit="${v.fit || 0.9}" data-align="center"${v.partner ? ` data-partner="${v.partner}"` : ''} aria-hidden="true"></div>` : ''}</div>
      </div></div>`;
      if (v.ui && UI[v.ui]) UI[v.ui](el.querySelector('.mc-ui'));
    }
  };


  /* ---------- 3x multicard: the homepage "Architect the new economy" module (Go Accounts / Staking / Go Network),
     shared by every page. Centred headline; three stacked cards (dark, light, dark), text + live art, alternating sides. ---------- */
  const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const ARTS = {
    goaccount(ctx, w, h, t) { // cash and crypto in one stack: layers fan out, then snap into one
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
    staking(ctx, w, h, t) { // staking: rewards radiating outward from a stake, rings with travelling beads
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
    gonetwork(ctx, w, h, t) { // Go Network: institutions on a ring, value hops between them through the network core
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

  /* Self-Custody arts: drawn with the homepage arts' code and language (iso plates, rings with beads, the hub ring) */
  Object.assign(ARTS, {
    /* security and control: your two keys sign, BitGo's platform key co-signs only within your policy */
    cosign(ctx, w, h, t) {
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .34, hub = R * .3;
      const node = i => { const a = -Math.PI / 2 + i / 3 * Math.PI * 2; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; };
      const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(R * 1.3, w / 2, h / 2)); g0.addColorStop(0, 'rgba(60,100,255,.22)'); g0.addColorStop(1, 'rgba(60,100,255,0)');
      ctx.fillStyle = g0; ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const [x, y] = node(i); ctx.strokeStyle = 'rgba(140,170,255,.2)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, cy); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(140,170,255,.16)'; ctx.setLineDash([2, 7]); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, hub * 1.9, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      const period = 5.4, ph = (t / period) % 1;
      const legs = [[0, sm(.05, .38, ph)], [1, sm(.14, .47, ph)]], co = sm(.55, .85, ph), fade = 1 - sm(.9, 1, ph);
      const lit = [0, 0, 0];
      const trail = (P, Q, u0, u1, a) => {
        const x0 = P[0] + (Q[0] - P[0]) * Math.max(0, u0), y0 = P[1] + (Q[1] - P[1]) * Math.max(0, u0), x1 = P[0] + (Q[0] - P[0]) * u1, y1 = P[1] + (Q[1] - P[1]) * u1;
        const gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(120,160,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${a})`);
        ctx.strokeStyle = gr; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        const q = ctx.createRadialGradient(x1, y1, 0, x1, y1, 18); q.addColorStop(0, `rgba(255,255,255,${.95 * a})`); q.addColorStop(1, 'rgba(90,130,255,0)');
        ctx.fillStyle = q; ctx.beginPath(); ctx.arc(x1, y1, 18, 0, 7); ctx.fill();
      };
      legs.forEach(([i, u]) => { lit[i] = Math.max(lit[i], 1 - sm(0, .5, u)); if (u > 0 && u < 1) trail(node(i), [cx, cy], u - .45, u, fade); });
      if (co > 0 && co < 1) trail([cx, cy], node(2), co - .45, co, fade);
      lit[2] = sm(.8, .86, ph) * (1 - sm(.9, 1, ph));
      const pulse = .5 + .5 * Math.sin(t * 1.6), ok = sm(.42, .5, ph) * fade;
      const cg = ctx.createRadialGradient(cx, cy, hub * .4, cx, cy, hub * 2.6); cg.addColorStop(0, `rgba(60,110,255,${.4 + ok * .3})`); cg.addColorStop(1, 'rgba(60,110,255,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, hub * 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#1647DB'; ctx.beginPath(); ctx.arc(cx, cy, hub, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${(.5 + pulse * .3).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, hub + 8 + pulse * 5, 0, 7); ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); const ss = hub * 1.2 / 184; ctx.scale(ss, ss); ctx.translate(-78.4, -91.8); ctx.fillStyle = '#fff'; ctx.fill(SHIELD, 'evenodd'); ctx.restore();
      for (let i = 0; i < 3; i++) {
        const [x, y] = node(i), r = Math.max(10, R * .1), l = lit[i];
        if (l > 0.01) { const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 4); gl.addColorStop(0, `rgba(110,150,255,${(.55 * l).toFixed(2)})`); gl.addColorStop(1, 'rgba(110,150,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#060d2e'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = l > .05 ? `rgba(255,255,255,${(.6 + l * .4).toFixed(2)})` : 'rgba(170,195,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
        ctx.fillStyle = i === 2 ? '#4d78ff' : (l > .05 ? '#fff' : 'rgba(170,195,255,.85)'); ctx.beginPath(); ctx.arc(x, y, r * .34, 0, 7); ctx.fill();
      }
    },
    /* compliant wallet architecture: the homepage plate stack, with one plate held in place by a location pin */
    residency(ctx, w, h, t) {
      const n = 7, W = Math.min(w * .52, h * .75), T = W * .06, G = T * 2.1;
      const m = sm(.25, .75, .5 + .5 * Math.sin(t * .55));
      const cx = w / 2, cy = h / 2 + G * 2.2;
      for (let i = n - 1; i >= 0; i--) {
        const off = Math.sin(t * .9 + i * .75) * W * .3 * (1 - m) * (i % 2 ? 1 : -1);
        const y = cy - (i - (n - 1) / 2) * G - (1 - m) * Math.cos(i + t * .4) * G * .9;
        const held = i === 3;
        iso(ctx, held ? cx : cx + off, y, W, T, held ? ['#0b2a99', '#091f75', '#1647DB'] : ['#9fb4ee', '#7f98de', '#eaf0ff']);
        if (held) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); const hw = W * .36, hh = W * .18; ctx.moveTo(cx, y - hh + 4); ctx.lineTo(cx + hw, y); ctx.lineTo(cx, y + hh - 4); ctx.lineTo(cx - hw, y); ctx.closePath(); ctx.stroke(); }
      }
      const py = cy - (3 - (n - 1) / 2) * G;
      ctx.strokeStyle = 'rgba(22,71,219,.5)'; ctx.setLineDash([2, 6]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx, py + W * .28); ctx.lineTo(cx, h * .94); ctx.stroke(); ctx.setLineDash([]);
      const pr = 7 + Math.sin(t * 1.6) * 1.5; ctx.fillStyle = '#1647DB'; ctx.beginPath(); ctx.arc(cx, h * .94, pr, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(22,71,219,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, h * .94, pr + 8 + (t * 8 % 14), 0, 7); ctx.stroke();
    },
    /* flexible configurations: hot and cold, side by side. Rings with beads (the staking art): warm and quick on the
       left, frosted and slow on the right, value moving between them */
    hotcold(ctx, w, h, t) {
      const R = Math.min(w * .22, h * .38), cyy = h / 2, L = [w * .3, cyy], Rt = [w * .7, cyy];
      const rings = (c, speed, rgb, alpha, K) => {
        for (let k = 0; k < K; k++) {
          const ph = (t * speed + k / K) % 1, r = R * ph, a = Math.pow(1 - ph, 1.3);
          ctx.strokeStyle = `rgba(${rgb},${(.1 + a * alpha).toFixed(3)})`; ctx.lineWidth = 1 + a * 2.6; ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, 7); ctx.stroke();
          const dots = 3 + Math.round(ph * 16);
          for (let d = 0; d < dots; d++) { const an = d / dots * 6.2832 + t * speed * 2 * (k % 2 ? 1 : -1); ctx.fillStyle = `rgba(${rgb},${(.25 + a * .6).toFixed(3)})`; ctx.beginPath(); ctx.arc(c[0] + Math.cos(an) * r, c[1] + Math.sin(an) * r, 1.2 + a * 2.6, 0, 7); ctx.fill(); }
        }
      };
      ctx.lineCap = 'round';
      rings(L, .16, '120,160,255', .85, 6);
      rings(Rt, .05, '210,222,255', .6, 6);
      const hub = (c, fill, ring) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(c[0], c[1], 15, 0, 7); ctx.fill(); ctx.strokeStyle = ring; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(c[0], c[1], 15, 0, 7); ctx.stroke(); };
      hub(L, '#1647DB', 'rgba(255,255,255,.7)'); hub(Rt, '#dfe7fb', 'rgba(255,255,255,.9)');
      const u = (t * .22) % 1, x = L[0] + (Rt[0] - L[0]) * u, y = cyy - Math.sin(u * Math.PI) * R * .5;
      const q = ctx.createRadialGradient(x, y, 0, x, y, 16); q.addColorStop(0, `rgba(255,255,255,${(.9 * Math.sin(u * Math.PI)).toFixed(2)})`); q.addColorStop(1, 'rgba(90,130,255,0)');
      ctx.fillStyle = q; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill();
    }
  });

  /* Self-Custody card imagery: real HTML/CSS product-UI fragments (Stripe-style), not canvas, so the type is crisp DOM text.
     Each UI[name](el) builds its panels at a fixed design size, fits them with one transform: scale() (no will-change),
     and drives the animation from an eased timeline in a requestAnimationFrame loop that only runs while on screen.
     With reduced motion it draws one finished state and never loops. Styles: shared/system/modules.css (.m-multi .mc-ui). */
  const UI = {};
  const cl = v => Math.min(1, Math.max(0, v));
  const pop = p => { const k = 1.70158; p = cl(p) - 1; return 1 + (k + 1) * p * p * p + k * p * p; };
  const B = (x, y, w, h, cls, inner, k) => `<div class="${cls}"${k ? ` data-k="${k}"` : ''} style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${inner || ''}</div>`;
  const T = (x, y, txt, fs, o = {}) => { const al = o.al || 'l', W = 260, left = al === 'l' ? x : al === 'r' ? x - W : x - W / 2; return `<span class="ut ${o.c || ''}"${o.k ? ` data-k="${o.k}"` : ''} style="left:${left}px;top:${Math.round(y - fs * .6)}px;width:${W}px;font-size:${fs}px;${o.w ? `font-weight:${o.w};` : ''}text-align:${al === 'l' ? 'left' : al === 'r' ? 'right' : 'center'}">${txt}</span>`; };
  const hr = (x, y, w) => B(x, y, w, 1, 'hr');
  const CK = (k, x, y, d) => `<span class="ck" data-k="${k}" style="left:${x}px;top:${y}px;width:${d}px;height:${d}px"><i class="rg"></i><svg class="fl" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12"/><path d="M7.2 12.4l3.3 3.3 6.4-6.9"/></svg><svg class="sp" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.9"/></svg></span>`;
  const TICK = '<svg class="tk" viewBox="0 0 12 12"><path d="M1.5 6.4l3 3L10.5 3"/></svg>';
  const setCk = (n, p, wt, t) => { n.children[0].style.opacity = 1 - cl(p); const f = n.children[1]; f.style.opacity = cl(p * 2.2); f.style.transform = `scale(${(.55 + .45 * pop(p)).toFixed(3)})`; const s = n.children[2]; s.style.opacity = wt || 0; s.style.transform = `rotate(${(t * 5).toFixed(3)}rad)`; };
  const setTx = (n, s) => { if (n.__s !== s) { n.textContent = s; n.__s = s; } };
  const mountUI = (el, VW, VH, html, tick) => {
    el.innerHTML = `<div class="ui-stage" style="width:${VW}px;height:${VH}px">${html}</div>`;
    const st = el.firstChild, R = {}; let vis = false, raf = 0;
    el.querySelectorAll('[data-k]').forEach(n => { R[n.dataset.k] = n; });
    const fit = () => { const r = el.getBoundingClientRect(); st.style.transform = `translate(-50%,-50%) scale(${Math.min(r.width / VW * .94, r.height / VH * .94, 1.15).toFixed(4)})`; };
    const t0 = performance.now(), frame = () => tick(R, reduce ? 3.2 : (performance.now() - t0) / 1000);
    const run = () => { frame(); raf = vis && !reduce ? requestAnimationFrame(run) : 0; };
    new ResizeObserver(fit).observe(el);
    new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis && !raf && !reduce) run(); }, { rootMargin: '10% 0px' }).observe(el);
    fit(); frame();
  };

  /* security and control: a withdrawal collects its signatures, the policy rules pass, the status flips to Approved */
  UI.scSecurity = el => {
    const sg = [['User key', 'Signed on your device', 'U'], ['Backup key', 'Held offline by you', 'B'], ['BitGo co-sign', 'Applied when policy passes', 'G']];
    const card = B(0, 14, 340, 330, 'u-p',
      T(24, 34, 'Withdrawal', 12.5, { w: 600, c: 'm' }) +
      `<div class="pill" data-k="pill" style="right:24px;top:21px;height:26px"><i class="b0"></i><i class="b1"></i><span class="l0 m">Pending</span><span class="l1 a">${TICK}Approved</span></div>` +
      T(24, 80, '25.00 BTC', 32, { w: 600, c: 'k' }) + T(24, 108, 'To bc1q8f2…k29x &nbsp;·&nbsp; Treasury wallet', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      sg.map(([n, sub, ch], i) => { const y = 140 + i * 52 + 26; return B(25, y - 15, 30, 30, 'av', ch, 'av' + i) + T(64, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(64, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 290, y - 10, 20); }).join('') +
      T(24, 308, 'Signatures', 12, { c: 'm' }) + B(100, 305, 150, 6, 'bar', '<i data-k="barf"></i>') + T(304, 308, '0 of 3', 12, { w: 600, c: 'k', al: 'r', k: 'cnt' }));
    const pol = B(316, 180, 254, 210, 'u-p',
      T(22, 30, 'Policy', 13.5, { w: 600, c: 'k' }) + T(232, 30, 'Treasury', 12, { c: 'm', al: 'r' }) + hr(22, 50, 210) +
      [['Daily limit', '25.00 of 50.00 BTC'], ['Whitelist only', 'Address approved'], ['2 approvers required', 'Requirement met']].map(([n, sub], i) => { const y = 60 + i * 46 + 23; return T(22, y - 8, n, 13, { w: 600, c: 'k' }) + T(22, y + 9, sub, 12, { c: 'm' }) + CK('p' + i, 214, y - 9.5, 19); }).join(''));
    mountUI(el, 570, 410, card + pol, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .9, a - .7, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      const s1 = f(.9, 1.5), s2 = f(2, 2.6), s3 = f(5.2, 5.8), ok = f(6.3, 6.9), pc = [f(3, 3.5), f(3.6, 4.1), f(4.2, 4.7)];
      [[s1, wait(.9, 1.5)], [s2, wait(2, 2.6)], [s3, wait(5.2, 5.8)]].forEach(([p, wt], i) => { setCk(R['c' + i], p, wt, t); R['av' + i].classList.toggle('on', p > .5); });
      pc.forEach((p, i) => setCk(R['p' + i], p, 0, t));
      const pl = R.pill; pl.style.width = (76 + 20 * ok).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - ok; pl.children[2].style.opacity = 1 - ok; pl.children[1].style.opacity = ok; pl.children[3].style.opacity = ok;
      const cnt = s1 + s2 + s3; R.barf.style.width = (cnt / 3 * 100).toFixed(2) + '%'; setTx(R.cnt, `${Math.floor(cnt + .5)} of 3`);
    });
  };

  /* compliant wallet architecture: custody location settings. The selection moves between jurisdictions, the data
     residency card and its Compliant pill follow, and a dotted map fragment lights the matching area. */
  UI.scCompliance = el => {
    const rows = [['US', 'United States', 'Virginia'], ['EU', 'European Union', 'Frankfurt'], ['UK', 'United Kingdom', 'London'], ['SG', 'Singapore', 'Asia Pacific'], ['AE', 'United Arab Emirates', 'Dubai'], ['CH', 'Switzerland', 'Zurich']];
    const spots = [[392, 160], [520, 70], [450, 40], [540, 190], [420, 230], [370, 80]], N = 6, S = 2.4, dots = [];
    for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) { const v = Math.sin(i * .55 + 1) + Math.sin(j * .6) + Math.sin((i + j) * .31) - ((i - 12) ** 2 + (j - 10) ** 2) / 70; if (v >= .15) dots.push([i * 10.5, j * 10.5]); }
    const map = `<svg class="map" style="left:336px;top:2px" width="256" height="256" viewBox="0 0 256 256">${dots.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.1"/>`).join('')}</svg>`;
    const list = B(0, 26, 350, 350, 'u-p',
      T(24, 32, 'Custody location', 15, { w: 600, c: 'k' }) + T(24, 54, 'Choose where your wallet keys are held.', 12.5, { c: 'm' }) + hr(24, 72, 302) + B(12, 82, 326, 40, 'hl', '', 'hl') +
      rows.map(([c, n], i) => { const ry = 82 + i * 44; return B(26, ry + 7, 28, 26, 'chip', c, 'ch' + i) + T(66, ry + 20, n, 14, { c: 'nm', k: 'nm' + i }) + B(310, ry + 12, 16, 16, 'rad', '<i></i>', 'rd' + i); }).join(''));
    const res = B(296, 236, 284, 150, 'u-p',
      T(22, 30, 'Data residency', 12.5, { w: 600, c: 'm' }) +
      `<div class="pill" data-k="pill" style="right:22px;top:17px;height:26px"><i class="b0"></i><i class="b1"></i><span class="l0 m">Verifying</span><span class="l1 a">${TICK}Compliant</span></div>` +
      T(22, 70, '', 24, { w: 600, c: 'k', k: 'r0' }) + T(22, 94, '', 12.5, { c: 'm', k: 's0' }) + T(22, 70, '', 24, { w: 600, c: 'k', k: 'r1' }) + T(22, 94, '', 12.5, { c: 'm', k: 's1' }) +
      hr(22, 108, 240) + T(22, 129, 'Keys and signing held in region', 12, { c: 'nm' }) + CK('rc', 254, 121, 16));
    mountUI(el, 580, 410, map + list + res, (R, t) => {
      if (reduce) t = 4.44;
      const k = Math.floor(t / S) % N, k2 = (k + 1) % N, fr = (t / S) % 1, m = sm(.1, .4, fr), pos = k + (k2 - k) * m, ver = sm(.1, .2, fr) * (1 - sm(.55, .7, fr)), comp = 1 - ver;
      R.hl.style.transform = `translateY(${(pos * 44).toFixed(2)}px)`;
      rows.forEach((_, i) => { const a = cl(1 - Math.abs(pos - i)), on = a > .5; R['ch' + i].classList.toggle('on', on); R['nm' + i].classList.toggle('sel', on); R['rd' + i].firstChild.style.opacity = a; R['rd' + i].classList.toggle('on', a > .02); });
      const pl = R.pill; pl.style.width = (86 + 14 * comp).toFixed(2) + 'px'; pl.children[0].style.opacity = ver; pl.children[2].style.opacity = ver; pl.children[1].style.opacity = comp; pl.children[3].style.opacity = comp;
      const a0 = 1 - sm(.1, .3, fr), a1 = sm(.2, .4, fr);
      setTx(R.r0, rows[k][2]); setTx(R.s0, rows[k][1]); setTx(R.r1, rows[k2][2]); setTx(R.s1, rows[k2][1]);
      R.r0.style.opacity = R.s0.style.opacity = a0; R.r1.style.opacity = R.s1.style.opacity = a1;
      setCk(R.rc, comp, 0, t);
      const ax = spots[k][0] + (spots[k2][0] - spots[k][0]) * m - 336, ay = spots[k][1] + (spots[k2][1] - spots[k][1]) * m - 2, cs = R.__dots || (R.__dots = [...el.querySelectorAll('.map circle')]);
      cs.forEach((c, i) => { const a = cl(1 - Math.hypot(dots[i][0] - ax, dots[i][1] - ay) / 62), q = a > .02 ? a : 0; if (c.__a !== q) { c.__a = q; if (q) { c.setAttribute('fill', `rgba(22,71,219,${(.2 + q * .75).toFixed(3)})`); c.setAttribute('r', (2.1 + q * 1.6).toFixed(2)); } else { c.removeAttribute('fill'); c.setAttribute('r', '2.1'); } } });
    });
  };

  /* flexible configurations: an API call creates a wallet, the app list picks up the new row, and one wallet is
     switched between hot and cold. */
  UI.scConfig = el => {
    const L = [[['POST ', 'kw'], ['/v2/btc/wallet', 'st']], [['{', 'pn']], [['  "label"', 'ky'], [': ', 'pn'], ['"Treasury"', 'st'], [',', 'pn']], [['  "type"', 'ky'], [': ', 'pn'], ['"cold"', 'st']], [['}', 'pn']]];
    const segs = []; let total = 0;
    const code = L.map((ln, li) => `<div class="cl" style="top:${50 + li * 22}px">${ln.map(([s, c]) => { segs.push({ s, li }); total += s.length; return `<span class="${c}"></span>`; }).join('')}<i class="cr"></i></div>`).join('');
    const api = B(0, 8, 340, 202, 'u-p dk',
      '<i class="wd" style="left:18px"></i><i class="wd" style="left:32px"></i><i class="wd" style="left:46px"></i>' + T(318, 24, 'Create wallet', 12, { al: 'r', c: 'dm' }) + code +
      `<div class="resp" data-k="resp" style="left:22px;top:163px;height:22px">${CK('rk', 8, 4, 14)}<span>201 Created</span></div>` + T(318, 174, 'wal_8f3a…', 12, { al: 'r', c: 'dm mono', k: 'wid' }));
    const rowsD = [['Treasury', 'BTC  ·  25.00', 0, 1], ['Operations', 'BTC  ·  12.40', 1], ['Settlement', 'ETH  ·  84.10', 0], ['Reserve', 'BTC  ·  310.00', 0], ['Payouts', 'USDC  ·  9,200', 1]];
    const rowH = rowsD.map(([n, sub, hv], i) => `<div class="wr" data-k="w${i}" style="left:0;width:408px;height:48px"><i class="fl" data-k="f${i}"></i><div class="ic" data-k="ic${i}"><b></b></div>` + T(68, 13, n, 13.5, { w: 600, c: 'k' }) + T(68, 29, sub, 12, { c: 'm' }) +
      `<div class="tg"><span class="th" data-k="th${i}">Hot</span><span class="tc" data-k="tc${i}">Cold</span></div><div class="sw"><i class="on" data-k="sw${i}"></i><b data-k="kn${i}"></b></div><div class="rl"></div></div>`).join('');
    const app = B(150, 190, 410, 252, 'u-p',
      T(24, 30, 'Wallets', 14.5, { w: 600, c: 'k' }) + '<div class="tabs"><span class="sel">All</span><span>Hot</span><span>Cold</span></div>' + hr(24, 52, 362) + `<div class="wl">${rowH}</div>`);
    mountUI(el, 560, 446, api + app, (R, t) => {
      if (reduce) t = 9;
      const P = 14, tt = t % P, ins = sm(4.4, 5.3, tt) * (1 - sm(12.4, 13.3, tt)), hot = 1 - sm(7, 7.8, tt) + sm(10.5, 11.3, tt), RH = 48;
      let n = Math.floor(total * cl((tt - .6) / 3) * (1 - cl((tt - 12.4) / .8))); const key = n; let cline = 0;
      if (R.__n !== key) { R.__n = key; let r = n; const sp = el.querySelectorAll('.cl > span'); segs.forEach((g, i) => { const cut = g.s.slice(0, Math.max(0, Math.min(g.s.length, r))); r -= g.s.length; if (cut) cline = g.li; if (sp[i].textContent !== cut) sp[i].textContent = cut; }); el.querySelectorAll('.cl > i').forEach((c, i) => { c.style.display = i === cline ? '' : 'none'; }); }
      el.querySelectorAll('.cl > i').forEach(c => { c.style.opacity = reduce ? 0 : (Math.sin(t * 5) > -.3 ? 1 : 0); });
      const rc = sm(3.9, 4.4, tt) * (1 - sm(12.2, 12.6, tt)); R.resp.style.opacity = rc; R.wid.style.opacity = rc * .6; setCk(R.rk, 1, 0, t);
      rowsD.forEach((r, i) => {
        const isNew = i === 0, hv = i === 2 ? hot : r[2], a = isNew ? cl(ins * 1.5) : 1, w = R['w' + i];
        w.style.transform = `translateY(${(((isNew ? ins - 1 : i - 1 + ins) * RH) + 6).toFixed(2)}px)`; w.style.opacity = a;
        R['f' + i].style.opacity = isNew ? sm(5.2, 5.4, tt) * (1 - sm(6.6, 7.6, tt)) * (1 - sm(12.4, 13.3, tt)) : 0;
        R['ic' + i].classList.toggle('hot', hv > .5); R['th' + i].style.opacity = hv; R['tc' + i].style.opacity = 1 - hv; R['sw' + i].style.opacity = hv; R['kn' + i].style.transform = `translateX(${(18 * hv).toFixed(2)}px)`;
      });
    });
  };

  /* Key Management diagrams: who holds which key, and where. The same bones in two configurations:
     hot (your keys online, BitGo's policy check gates the countersign) and cold (your keys inside an offline air gap,
     only a half-signed transaction is uploaded). Same HTML/CSS language and rules as the card mockups above. */
  const KEYSVG = '<svg viewBox="0 0 24 24"><circle cx="7.5" cy="12" r="3.8"/><path d="M11.3 12H21M17.5 12v3.2M20.8 12v2.4"/></svg>';
  const LOCKSVG = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9.5" rx="2.4"/><path d="M8.2 11V8.2a3.8 3.8 0 017.6 0V11"/></svg>';
  const keyDiagram = cold => el => {
    const chip = (x, y, k, name, subA, subB, who, right, extra) => B(x, y, 218, 58, 'kc', B(12, 13, 32, 32, 'ki ' + who, extra || '', 'ki' + k) + T(54, 21, name, 13.5, { w: 600, c: 'k' }) +
      T(54, 40, subA, 12, { c: 'm', k: 'sa' + k }) + (subB ? T(54, 40, subB, 12, { c: 'a', k: 'sb' + k }) : '') + right, 'kc' + k);
    const gate = cold ? ['Upload', 'Half-signed tx', 'Received', '<svg viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/></svg>'] : ['Policy check', 'Limits · whitelist', 'Passed', '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/><circle cx="9" cy="7" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="8" cy="17" r="1.6"/></svg>'];
    const left = B(0, 20, 250, 196, 'u-p yours',
      T(22, 33, 'Your keys', 12.5, { w: 600, c: 'dm2' }) +
      `<span class="bdg ${cold ? 'cd' : 'hot'}">${cold ? LOCKSVG + 'Offline' : '<i></i>Online'}</span>` +
      chip(16, 52, 0, 'Client Key', 'Held by you', cold ? 'Half-signed' : 'Signed', 'you', CK('c0', 188, 20, 18), cold ? `<span class="lk">${LOCKSVG}</span>` + KEYSVG : KEYSVG) +
      chip(16, 122, 1, 'Backup Key', cold ? 'Held offline' : 'Held by you', '', 'you', T(206, 29, 'Standby', 12, { c: 'm', al: 'r' }), cold ? `<span class="lk">${LOCKSVG}</span>` + KEYSVG : KEYSVG));
    const right = B(340, 20, 250, 196, 'u-p',
      T(22, 33, 'BitGo', 12.5, { w: 600, c: 'm' }) +
      chip(16, 52, 2, gate[0], gate[1], gate[2], 'gt', CK('c2', 188, 20, 18), gate[3]) +
      chip(16, 122, 3, 'Platform Key', 'Held by BitGo', 'Countersigned', 'bg', CK('c3', 188, 20, 18), KEYSVG));
    const bc = B(340, 290, 250, 72, 'u-p', B(16, 20, 32, 32, 'ki bc', '<svg viewBox="0 0 24 24"><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/></svg>') + T(60, 29, 'Broadcast', 13.5, { w: 600, c: 'k' }) + T(60, 48, 'Waiting', 12, { c: 'm', k: 'sa4' }) + T(60, 48, 'Sent to network', 12, { c: 'a', k: 'sb4' }) + CK('c4', 212, 26, 20), 'bcp');
    const lines = `<svg class="kl" width="590" height="372" viewBox="0 0 590 372"><path class="bs${cold ? ' ds' : ''}" id="p1" d="M250 101H340"/><path class="bs" id="p2" d="M465 216V290"/><path class="pg" data-k="pg2" pathLength="1" d="M465 216V290"/>${cold ? '' : '<path class="pg" data-k="pg1" pathLength="1" d="M250 101H340"/>'}</svg>`;
    const mv = `<div class="mv" data-k="mv"><span data-k="mvt">Signed</span></div>`;
    /* bolder: no floating captions or legend; the only labels sit on the connector they name */
    const note = cold ? T(295, 84, 'Air gap', 12.5, { w: 600, c: 'dm2', al: 'c' }) + T(295, 126, 'Upload', 12.5, { w: 600, c: 'a2', al: 'c', k: 'upl' }) : '';
    const TL = cold ? { sign: [.5, 1.2], t1: [1.6, 3.2], gate: [3.6, 4.1], plat: [4.5, 5.0], t2: [5.3, 6.4], bc: [6.4, 6.9] } : { sign: [.5, 1.2], t1: [1.4, 2.6], gate: [3.5, 4.0], plat: [4.6, 5.1], t2: [5.3, 6.4], bc: [6.4, 6.9] };
    mountUI(el, 590, 372, lines + left + right + bc + note + mv, (R, t) => {
      if (reduce) t = 7.5;
      const tt = t % 9, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off), e = (a, b) => sm(a, b, tt), S = k => TL[k];
      const sg = f(...S('sign')), gt = f(...S('gate')), pl = f(...S('plat')), bcv = f(...S('bc'));
      const sp = (a, b) => sm(a - .1, a, tt) * (1 - sm(b, b + .2, tt)) * (1 - off);
      setCk(R.c0, sg, 0, t); setCk(R.c2, gt, sp(S('t1')[1], S('gate')[0] - .15), t); setCk(R.c3, pl, 0, t); setCk(R.c4, bcv, 0, t);
      const sub = (k, p) => { R['sa' + k].style.opacity = cl(1 - p * 2); if (R['sb' + k]) R['sb' + k].style.opacity = cl(p * 2 - 1); }; /* old label fully out before the new one comes in, so the two never overlap */
      sub(0, sg); sub(2, gt); sub(3, pl); sub(4, bcv);
      R.kc0.classList.toggle('act', tt > S('sign')[0] - .3 && sg < .9 && off < .5); R.kc2.classList.toggle('act', tt > S('t1')[1] - .1 && gt < .9 && off < .5);
      R.kc3.classList.toggle('act', tt > S('gate')[1] - .1 && pl < .9 && off < .5); R.kc1.classList.remove('act');
      if (R.pg1) R.pg1.style.strokeDashoffset = (1 - f(...S('t1'))).toFixed(4);
      R.pg2.style.strokeDashoffset = (1 - f(...S('t2'))).toFixed(4);
      const P1 = R.mv.__p1 || (R.mv.__p1 = el.querySelector('#p1')), P2 = R.mv.__p2 || (R.mv.__p2 = el.querySelector('#p2'));
      const a1 = e(...S('t1')), a2 = e(...S('t2')), v1 = sm(S('t1')[0] - .05, S('t1')[0] + .15, tt) * (1 - sm(S('t1')[1] - .15, S('t1')[1], tt)), v2 = sm(S('t2')[0] - .05, S('t2')[0] + .15, tt) * (1 - sm(S('t2')[1] - .15, S('t2')[1], tt));
      const second = tt > (S('t1')[1] + S('t2')[0]) / 2, path = second ? P2 : P1, u = second ? a2 : a1, pt = path.getPointAtLength(path.getTotalLength() * u);
      R.mv.style.transform = `translate(${pt.x.toFixed(2)}px,${pt.y.toFixed(2)}px) translate(-50%,-50%)`; R.mv.style.opacity = Math.max(v1, v2) * (1 - off);
      setTx(R.mvt, second ? 'Co-signed' : (cold ? 'Half-signed' : 'Signed'));
      if (R.upl) R.upl.style.opacity = v1;
    });
  };
  UI.scHot = keyDiagram(false);
  UI.scCold = keyDiagram(true);

  /* Go Network ("Settlement and payment infrastructure without borders"): a cross-border settlement clears live between two
     counterparties, while the network ticker below shows settlements across regions. Same product-UI language as the other cards. */
  UI.goNetwork = el => {
    const ep = (x, k, code, name, city) => B(x, 132, 144, 56, 'ep', B(12, 12, 32, 32, 'av', code, 'ea' + k) + T(54, 22, name, 13.5, { w: 600, c: 'k' }) + T(54, 40, city, 12, { c: 'm' }), 'ep' + k);
    const card = B(0, 10, 360, 252, 'u-p',
      T(24, 34, 'Settlement', 12.5, { w: 600, c: 'm' }) +
      `<div class="pill" data-k="pill" style="right:24px;top:21px;height:26px;width:84px"><i class="b0"></i><i class="b1"></i><span class="l0 m">Pending</span><span class="l1 a">${TICK}Settled</span></div>` +
      T(24, 82, '250.00 BTC', 32, { w: 600, c: 'k' }) + T(24, 110, 'Off-exchange · no prefunding', 12.5, { c: 'm' }) +
      ep(24, 0, 'NY', 'Exchange', 'New York') + ep(192, 1, 'SG', 'Fund', 'Singapore') +
      '<svg class="gn-ar" viewBox="0 0 24 24" style="left:168px;top:148px;width:24px;height:24px"><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/></svg>' +
      T(24, 212, 'Network settlement', 12, { c: 'm' }) + T(336, 212, '0.0s', 12, { w: 600, c: 'k', al: 'r', k: 'tm' }) +
      B(24, 226, 312, 6, 'bar', '<i data-k="barf"></i>'));
    const RT = [['LDN', 'NYC', 'USDC 4.2M'], ['SGP', 'ZRH', 'BTC 120.0'], ['HKG', 'LDN', 'ETH 3,400'], ['NYC', 'SGP', 'USDT 9.8M'], ['ZRH', 'HKG', 'BTC 64.5'], ['NYC', 'LDN', 'USDC 1.1M']];
    const rows = RT.map(([a, b, amt], i) => `<div class="wr" data-k="t${i}" style="width:360px;height:38px">` + T(22, 19, `${a} → ${b}`, 13, { w: 600, c: 'wt' }) + T(150, 19, amt, 13, { c: 'dm mono' }) +
      `<span class="gn-ok" style="left:262px;top:9px">${TICK}Settled</span></div>`).join('');
    const tick = B(200, 278, 360, 160, 'u-p dk', T(22, 28, 'Go Network', 12, { w: 600, c: 'dm' }) + B(0, 46, 360, 114, 'gn-clip', rows));
    mountUI(el, 560, 440, card + tick, (R, t) => {
      if (reduce) t = 6;
      const P = 8, tt = t % P, off = sm(7.2, 7.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const go = f(.6, 2.2), ok = f(2.2, 2.6);
      R.ep0.classList.toggle('act', tt > .3 && tt < 2.4 && off < .5); R.ep1.classList.toggle('act', tt > 2.2 && off < .5);
      R.ea0.classList.toggle('on', tt > .3 && off < .5); R.ea1.classList.toggle('on', tt > 2.2 && off < .5);
      R.barf.style.width = (go * 100).toFixed(2) + '%'; setTx(R.tm, (go * .8).toFixed(1) + 's');
      const pl = R.pill; pl.style.width = (78 + 14 * ok).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - ok; pl.children[2].style.opacity = 1 - ok; pl.children[1].style.opacity = ok; pl.children[3].style.opacity = ok;
      // ticker: a new settlement slides in at the top every 1.3s, the list moves down, the oldest drops out of view
      const sp = 1.3, n = RT.length, step = reduce ? 0 : t / sp, base = Math.floor(step), fr = reduce ? 1 : sm(0, .35, step - base);
      RT.forEach((r, i) => { const slot = ((i - base) % n + n) % n, y = (slot - 1 + fr) * 38; const w = R['t' + i]; w.style.transform = `translateY(${y.toFixed(2)}px)`; w.style.opacity = slot === 0 ? fr : slot >= 3 ? Math.max(0, 1 - (slot - 3 + fr)) : 1; });
    });
  };

  /* API Access: a request creates a receive address for an end user, and the new address joins the list.
     Same bold language as the key diagrams: solid panels, one glowing connector, no floating captions. */
  UI.scApi = el => {
    const L = [[['POST ', 'kw'], ['/v2/btc/wallet/:id/address', 'st']], [['{', 'pn']], [['  "label"', 'ky'], [': ', 'pn'], ['"user_4821"', 'st']], [['}', 'pn']]];
    const segs = []; let total = 0;
    const code = L.map((ln, li) => `<div class="cl" style="top:${58 + li * 24}px">${ln.map(([s, c]) => { segs.push({ s, li }); total += s.length; return `<span class="${c}"></span>`; }).join('')}<i class="cr"></i></div>`).join('');
    const api = B(0, 20, 290, 196, 'u-p dk',
      '<i class="wd" style="left:18px"></i><i class="wd" style="left:32px"></i><i class="wd" style="left:46px"></i>' + T(272, 24, 'Create address', 12, { al: 'r', c: 'dm' }) + code +
      `<div class="resp" data-k="resp" style="left:22px;top:158px;height:22px">${CK('rk', 8, 4, 14)}<span>200 OK</span></div>`);
    const D = [['U8', 'user_4821', 'bc1q9x…7h2k'], ['U7', 'user_4820', 'bc1qm4…f0ad'], ['U6', 'user_4819', 'bc1qz2…k8wu'], ['U5', 'user_4818', 'bc1q7t…3nps']];
    const rows = D.map(([a, n, ad], i) => `<div class="wr" data-k="r${i}" style="width:218px;height:52px">` + B(0, 0, 218, 52, 'kc',
      B(12, 11, 30, 30, 'av' + (i === 0 ? ' on' : ''), a) + T(52, 20, n, 13.5, { w: 600, c: 'k' }) + T(52, 38, ad, 12, { c: 'm mono' }) +
      (i === 0 ? '<span class="bdg hot" data-k="nb" style="right:10px;top:14px"><i></i>New</span>' : ''), 'rc' + i) + '</div>').join('');
    const list = B(340, 20, 250, 300, 'u-p',
      T(22, 33, 'Receive addresses', 12.5, { w: 600, c: 'm' }) + T(228, 33, '1,283', 12.5, { w: 600, c: 'a', al: 'r', k: 'cnt' }) +
      B(16, 54, 218, 230, 'wl2', rows));
    const lines = '<svg class="kl" width="590" height="372" viewBox="0 0 590 372"><path class="bs" d="M290 101H340"/><path class="pg" data-k="pg" pathLength="1" d="M290 101H340"/></svg>';
    mountUI(el, 590, 340, lines + api + list, (R, t) => {
      if (reduce) t = 7.5;
      const tt = t % 9, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const n = Math.floor(total * cl((tt - .4) / 2.2) * (1 - off)); let cline = 0;
      if (R.__n !== n) {
        R.__n = n; let r = n; const sp = el.querySelectorAll('.cl > span');
        segs.forEach((g, i) => { const cut = g.s.slice(0, Math.max(0, Math.min(g.s.length, r))); r -= g.s.length; if (cut) cline = g.li; if (sp[i].textContent !== cut) sp[i].textContent = cut; });
        el.querySelectorAll('.cl > i').forEach((c, i) => { c.style.display = i === cline ? '' : 'none'; });
      }
      el.querySelectorAll('.cl > i').forEach(c => { c.style.opacity = reduce ? 0 : (Math.sin(t * 5) > -.3 ? 1 : 0); });
      const rc = f(2.7, 3.1); R.resp.style.opacity = rc; setCk(R.rk, rc, 0, t);
      R.pg.style.strokeDashoffset = (1 - f(3.1, 3.7)).toFixed(4);
      const ins = f(3.7, 4.5);
      D.forEach((d, i) => { const y = i === 0 ? (ins - 1) * 58 : (i - 1 + ins) * 58; R['r' + i].style.transform = `translateY(${y.toFixed(2)}px)`; R['r' + i].style.opacity = i === 0 ? cl(ins * 1.6) : 1; });
      R.rc0.classList.toggle('act', tt > 3.9 && tt < 6.6 && off < .5); R.nb.style.opacity = ins;
      setTx(R.cnt, ins > .5 ? '1,284' : '1,283');
    });
  };

  /* In-app: hot and cold wallets side by side in the app; you move funds from hot to cold and both balances update */
  UI.scApp = el => {
    const tile = (x, dark, name, badge, k, bal) => B(x, 20, 250, 150, 'u-p' + (dark ? ' yours' : ''),
      T(22, 33, name, 12.5, { w: 600, c: dark ? 'dm2' : 'm' }) + badge +
      T(22, 98, bal, 34, { w: 600, c: dark ? 'wt' : 'k', k: 'b' + k }) + T(22, 130, 'BTC', 12.5, { w: 600, c: dark ? 'dm2' : 'm' }));
    const hot = tile(0, false, 'Operations', '<span class="bdg hot"><i></i>Hot</span>', 0, '12.40');
    const cold = tile(340, true, 'Treasury', `<span class="bdg cd">${LOCKSVG}Cold</span>`, 1, '25.00');
    const TICKW = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-8.5"/></svg>';
    const bar = B(0, 214, 590, 96, 'u-p',
      T(22, 40, 'Move funds', 13.5, { w: 600, c: 'k' }) + T(22, 62, 'Operations → Treasury', 12, { c: 'm' }) +
      B(226, 26, 176, 44, 'kc', T(16, 23, '5.00 BTC', 15, { w: 600, c: 'k' }), 'amt') +
      B(418, 26, 150, 44, 'cbtn', `<span data-k="l0">Confirm</span><span data-k="l1">${TICKW}Moved</span>`, 'cb'));
    const lines = '<svg class="kl" width="590" height="372" viewBox="0 0 590 372"><path class="bs" id="pm" d="M250 95H340"/><path class="pg" data-k="pg" pathLength="1" d="M250 95H340"/></svg>';
    const mv = '<div class="mv" data-k="mv"><span>5.00 BTC</span></div>';
    mountUI(el, 590, 330, lines + hot + cold + bar + mv, (R, t) => {
      if (reduce) t = 7.5;
      const tt = t % 9, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      R.amt.classList.toggle('act', tt > .5 && tt < 2.2 && off < .5);
      const press = sm(1.8, 1.95, tt) * (1 - sm(1.95, 2.15, tt)); R.cb.style.transform = `scale(${(1 - press * .05).toFixed(3)})`;
      const mvp = f(2.2, 3.4), done = f(3.4, 3.7);
      R.pg.style.strokeDashoffset = (1 - mvp).toFixed(4);
      const P = R.mv.__p || (R.mv.__p = el.querySelector('#pm')), pt = P.getPointAtLength(P.getTotalLength() * sm(2.2, 3.4, tt));
      R.mv.style.transform = `translate(${pt.x.toFixed(2)}px,${pt.y.toFixed(2)}px) translate(-50%,-50%)`;
      R.mv.style.opacity = sm(2.1, 2.3, tt) * (1 - sm(3.3, 3.5, tt)) * (1 - off);
      const moved = sm(2.4, 3.4, tt) * (1 - off);
      setTx(R.b0, (12.40 - 5 * moved).toFixed(2)); setTx(R.b1, (25.00 + 5 * moved).toFixed(2));
      R.l0.style.opacity = cl(1 - done * 2); R.l1.style.opacity = cl(done * 2 - 1);
    });
  };

  /* Decode rotation (Modules.hero, rotate:{style:'decode'}): ported from bitgo.com's RotatingTitle, same timings and dot sampling, dot
     colours for the blue curtain. Each new word is revealed left to right behind a band of dots that settle into the letters. */
  const decodeWord = el => {
    const wrap = el.parentElement, txt = el.firstChild; if (!wrap || !txt) return () => {};
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), rg = document.createRange(); rg.selectNodeContents(txt);
    const tb = rg.getBoundingClientRect(), wb = wrap.getBoundingClientRect();
    const stops = Array.from({ length: txt.textContent.length }, (_, k) => (rg.setStart(txt, k), rg.setEnd(txt, k + 1), rg.getBoundingClientRect().right - tb.left));
    rg.selectNodeContents(txt);
    const left0 = el.getBoundingClientRect().left, ow = el.offsetWidth, dpr = Math.min(2, devicePixelRatio || 1), w = Math.ceil(tb.width), h = Math.ceil(tb.height);
    if (!w || !h) return () => {};
    const sc = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); if (!sc) return () => {};
    sc.canvas.width = w; sc.canvas.height = h; sc.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`; sc.letterSpacing = cs.letterSpacing; sc.textBaseline = 'alphabetic';
    const mt = sc.measureText(el.textContent), asc = mt.fontBoundingBoxAscent, desc = mt.fontBoundingBoxDescent, base = asc + (tb.height - asc - desc) / 2;
    sc.fillText(el.textContent, 0, base);
    const px = sc.getImageData(0, 0, w, h).data, step = Math.max(3, Math.round(fs / 16)), dots = [];
    for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) if (px[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 110) dots.push({ x, y });
    const cv = document.createElement('canvas'), c = cv.getContext('2d'); if (!c) return () => {};
    cv.setAttribute('aria-hidden', 'true'); cv.width = w * dpr; cv.height = h * dpr;
    Object.assign(cv.style, { height: `${h}px`, left: `${tb.left - wb.left}px`, pointerEvents: 'none', position: 'absolute', top: `${tb.top - wb.top}px`, width: `${w}px`, maxWidth: 'none' });   // the reset caps canvases at 100% of a 0-wide parent
    wrap.append(cv); c.scale(dpr, dpr);
    const grad = c.createLinearGradient(0, 0, w, 0); grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#9fbaff');
    const band = w * .22, t0 = performance.now(); let raf = 0;
    const stop = () => { cancelAnimationFrame(raf); el.style.clipPath = ''; cv.remove(); };
    const tick = now => {
      const p = Math.min(1, (now - t0) / 900), edge = p * (w + band), done = stops.reduce((a, s) => s <= edge - band ? s : a, 0), right = Math.max(0, ow - (tb.left - left0 + done));
      el.style.clipPath = p < 1 ? `inset(-0.5em ${right}px -0.5em -0.5em)` : '';
      c.clearRect(0, 0, w, h); c.fillStyle = grad;
      for (const d of dots) { const k = edge - d.x; if (k < 0 || d.x < done) continue; const f = Math.max(0, 1 - k / (w * .25)); c.globalAlpha = .55 + .45 * f; c.beginPath(); c.arc(d.x, d.y, step * (.28 + .12 * f), 0, Math.PI * 2); c.fill(); }
      p < 1 ? raf = requestAnimationFrame(tick) : stop();
    };
    el.style.clipPath = 'inset(0 100% 0 0)'; raf = requestAnimationFrame(tick); return stop;
  };

  /* Hero ("Primary hero"): Modules.hero(el, { eyebrow, title, words: [...], rest, head, lead, cta: {label, href}, model, fit, align, label, rotate })
     title, or words + rest for a rotating first word, or head + words for a rotating last word (rise style). model puts a 3D slot (data-model) on the right for the page's gl.js;
     without one the slot is still there, so a page's own 3D can read its box.
     rotate: { style: 'rise' | 'decode', first, every }. 'rise' (default) is Qualified Custody's: each letter rises in. 'decode' is the
     homepage's: the new word is drawn in by a band of dots (decodeWord), the heading is larger, and the section clips its overflow.
     first is the wait before the first change (ms, default 1000), every the time between changes (ms, default 2300).
     label is the h1's aria-label (decode only; the rise style builds its own). */
  window.Modules.hero = function (el, o) {
    el.classList.remove('hero'); el.classList.add('m-hero');   // the page's old hero rules stop matching; only the module styles it
    if (o.words && o.rotate && o.rotate.style === 'decode') {
      el.classList.add('mh-decode');
      el.innerHTML = `<div class="wrap mh-wrap"><div class="mh-copy">${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}<h1 aria-label="${o.label || o.words[0] + ' ' + o.rest}"><span class="words-wrapper" aria-hidden="true"><span class="words">${o.words.map((w, i) => `<span class="${i === 0 ? 'current' : i === 1 ? 'next' : ''}">${w}</span>`).join('')}</span></span><span class="rest" aria-hidden="true">${o.rest}</span></h1>${o.lead ? `<p class="lead mh-lead">${o.lead}</p>` : ''}${o.cta ? `<div class="mh-row"><a class="btn white" href="${o.cta.href}">${o.cta.label}${arrow}</a></div>` : ''}</div></div>`;
      const words = [...el.querySelectorAll('.words > span')], useDecode = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      let cur = 0, stopFx = () => {}, seen = true;
      new IntersectionObserver(es => { seen = es.some(e => e.isIntersecting); }).observe(el);
      const next = () => {
        if (!seen) return;
        const n = (cur + 1) % words.length, nn = (n + 1) % words.length;
        words[cur].classList.remove('current'); words[n].classList.remove('next'); words[n].classList.add('current'); words[nn].classList.add('next');
        cur = n; stopFx(); if (useDecode && !document.hidden) stopFx = decodeWord(words[cur]);
      };
      setTimeout(() => { next(); setInterval(next, o.rotate.every || 2300); }, o.rotate.first || 1000);
      return;
    }
    const chars = w => [...w].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join('');
    const rot = o.words ? `<span class="rot" aria-hidden="true">${o.words.map(w => `<span class="rw">${chars(w)}</span>`).join('')}</span>` : '';
    const h1 = o.words && o.head   // head: a trailing rotation, the fixed words first and the rotating word on the last line
      ? `<h1 aria-label="${o.label || o.head + ' ' + o.words[0]}"><span class="rest" aria-hidden="true">${o.head}</span>${rot}</h1>`
      : o.words
      ? `<h1 aria-label="${o.label || o.words[0] + ' ' + o.rest}">${rot}<span class="rest" aria-hidden="true">${o.rest}</span></h1>`
      : `<h1 data-rv>${o.title}</h1>`;
    const slot = o.model ? `<div class="slot mh-slot" data-model="${o.model}" data-fit="${o.fit || 1}" data-align="${o.align || 'center'}" aria-hidden="true"></div>` : '<div class="mh-slot" aria-hidden="true"></div>';
    el.innerHTML = `<div class="wrap mh-wrap">${slot}<div class="mh-copy">${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}${h1}${o.lead ? `<p class="lead mh-lead" data-rv>${o.lead}</p>` : ''}${o.cta ? `<div class="mh-row" data-rv><a class="btn white" href="${o.cta.href}">${o.cta.label}${arrow}</a></div>` : ''}</div></div>`;
    if (o.words) {
      const rws = el.querySelectorAll('.rw'); let cur = 0; rws[0].classList.add('on');
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => {
        if (document.hidden) return;
        const prev = rws[cur]; cur = (cur + 1) % rws.length;
        prev.classList.remove('on'); prev.classList.add('out'); setTimeout(() => prev.classList.remove('out'), 1100);
        rws[cur].classList.add('on');
      }, 2800);
    }
  };

  /* CTA banner: Modules.banner(el, { title: [line, line], em: [...], cta: {label, href}, panel, scene })
     panel (default true): the glass panel. panel:false is the closing call to action: the title and one white button sit on the
     open scene, left on the page margin. scene:true (with panel:false) is for a page that draws a 3D object beside it: the title
     keeps clear of the right half, and on phones the section is tall with the copy at the bottom. */
  window.Modules.banner = function (el, o) {
    el.classList.add('m-banner');
    const it = t => [].concat(o.em || []).reduce((s, p) => s.includes(p) ? s.replace(p, '<em>' + p + '</em>') : s, t);
    const lines = o.title.map(t => `<span>${it(t)}</span>`).join('');
    const btn = o.cta ? `<a class="btn white" href="${o.cta.href}"${o.panel === false ? ' data-rv' : ''}>${o.cta.label}${arrow}</a>` : '';
    if (o.panel === false) {
      el.classList.add('mb-open'); if (o.scene) el.classList.add('mb-scene');
      el.innerHTML = `<div class="wrap"><div class="mb-in"><h2 data-rv>${lines}</h2>${btn}</div></div>`;
      return;
    }
    el.innerHTML = `<div class="wrap"><div class="mb-panel" data-rv><h2>${lines}</h2>${btn}</div></div>`;
  };

  /* FAQ: Modules.faq(el, { title, items: [{ q, a }] }). A heading beside a column of question-and-answer disclosures. */
  window.Modules.faq = function (el, o) {
    el.classList.add('m-faq');
    // links option: [{ label, href }]; each label found inside an answer becomes a link in place (live answers carry inline links)
    const link = t => (o.links || []).reduce((x, l) => x.includes(l.label) ? x.replace(l.label, `<a href="${l.href}">${l.label}</a>`) : x, t);
    el.innerHTML = `<div class="wrap"><div class="faq-grid"><div class="faq-side">${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}<h2 class="big">${o.title}</h2>${o.note ? `<p class="faq-note">${o.note}</p>` : ''}</div>
      <div class="faq-list">${o.items.map(f => `<details><summary><h3>${f.q}</h3><span class="pm" aria-hidden="true"></span></summary><div class="ans">${[].concat(f.a).map(x => `<p>${link(x)}</p>`).join('')}</div></details>`).join('')}</div></div></div>`;
  };

  /* The Latest: Modules.latest(el, { title, all: {label, href}, posts: [{ title, href }], hover })
     hover: 'boxes' is the homepage version: ruled rows with side padding that fill with a grid of glass boxes on hover. */
  window.Modules.latest = function (el, o) {
    el.classList.add('m-latest'); if (o.hover === 'boxes') el.classList.add('boxes');
    const boxes = o.hover === 'boxes' ? `<span class="hov-boxes" aria-hidden="true">${Array.from({ length: 64 }, () => `<i style="--d:${(Math.random() * .35).toFixed(2)}s"></i>`).join('')}</span>` : '';
    el.innerHTML = `<div class="wrap"><div class="lat-top"><h2 class="big" data-rv>${o.title}</h2><a class="btn ghost" href="${o.all.href}">${o.all.label}${arrow}</a></div>
      <div>${o.posts.map(p => `<a class="post" href="${p.href}" data-rv><h3>${p.title}</h3><span class="go">${arrow}</span>${boxes}</a>`).join('')}</div></div>`;
  };

  /* Statement: Modules.statement(el, { lines: [{ text, em }] }). One giant sentence per line; the words in `em` are set in blue.
     Each line lights up as it scrolls to the middle of the screen (all lit under reduced motion). */
  window.Modules.statement = function (el, o) {
    el.classList.add('m-statement');
    const lk = (t, l) => l.link && t.includes(l.link.text) ? t.replace(l.link.text, `<a href="${l.link.href}">${l.link.text}</a>`) : t;   // link: a live link inside the sentence
    const line = l => `<span>${lk(l.em && l.text.includes(l.em) ? l.text.replace(l.em, '<b>' + l.em + '</b>') : l.text, l)}</span>`;
    el.innerHTML = `<div class="wrap"><p class="stmt">${o.lines.map(line).join('')}</p></div>`;
    const spans = [...el.querySelectorAll('.stmt span')], reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp01 = v => Math.min(1, Math.max(0, v)), sm = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
    const light = () => spans.forEach(s => {
      const r = s.getBoundingClientRect(), c = r.top + r.height / 2;
      s.style.setProperty('--o', (reduce ? .95 : .2 + .8 * sm(innerHeight * .98, innerHeight * .5, c)).toFixed(3));
    });
    let tick = false;
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; light(); }); } }, { passive: true });
    addEventListener('resize', light); light();
  };

  /* Logo strip: Modules.logos(el, { title, logos: [src, ...] }) */
  window.Modules.logos = function (el, o) {
    el.classList.add('m-logos');
    // headline option: when the live section heads the logos with a full section headline, it renders as the shared
    // headline (same size as every other section headline), not as the logo strip's small title
    if (o.headline) {
      const row2 = (arr, rev) => `<div class="mq${rev ? ' rev' : ''}"><div class="mq-t">${[...arr, ...arr].map(s2 => `<img src="${s2}" alt="" loading="lazy">`).join('')}</div></div>`;
      el.classList.add('lg-head');
      el.innerHTML = `<div class="wrap">${Modules.headline({ eyebrow: o.eyebrow, title: o.title, text: o.text })}</div>` + row2(o.logos, false) + row2([...o.logos].reverse(), true);
      return;
    }
    const row = (arr, rev) => `<div class="mq${rev ? ' rev' : ''}"><div class="mq-t">${[...arr, ...arr].map(s => `<img src="${s}" alt="" loading="lazy">`).join('')}</div></div>`;
    el.innerHTML = `<div class="wrap"><h2 data-rv>${o.title}</h2></div>` + row(o.logos, false) + row([...o.logos].reverse(), true);
  };

  /* 3x multicard: Modules.multicard(el, { eyebrow, title, text, cards: [{ title, text, cta, art, tone }] })
     art names a product UI art (UI registries), a canvas art (ARTS) or a 2D scene (scenes.js); scene + opts places a scene explicitly;
     image or video (+ poster, alt) shows the card's own live picture or product loop.
     tone names the card surface: 'ink' (near-black), 'paper' (light, blue button) or 'deep' (dark navy). Left out, the cards run
     ink, paper, deep by position, which is the approved look. */
  window.Modules.multicard = function (el, o) {
    el.classList.add('m-multi');
    el.innerHTML = `<div class="wrap"><div class="mc-head">${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}<h2 class="big" data-rv>${o.title}</h2>${o.text ? `<p class="lead" data-rv>${o.text}</p>` : ''}${o.cta ? `<a class="btn white mc-cta" href="${o.cta.href}" data-rv>${o.cta.label}${arrow}</a>` : ''}</div>
      <div class="bcards">${o.cards.map((c, i) => `<article class="bcard c${i} tone-${c.tone || ['ink', 'paper', 'deep'][i % 3]}${i === 1 ? ' rtl' : ''}${!(c.image || c.video || c.scene || c.art) ? ' no-vis' : ''}" style="--k:${i}">${c.href && !c.cta ? `<a class="bc-link" href="${c.href}" aria-label="${String(c.title).replace(/"/g, '')}"></a>` : ''}<div class="bt"><div>${c.label ? `<p class="bc-label">${c.label}</p>` : ''}<h3>${c.title}</h3><p>${c.text}</p></div>${c.cta ? `<a class="btn" href="${c.cta.href}">${c.cta.label}${arrow}</a>` : ''}</div>${!(c.image || c.video || c.scene || c.art) ? '' : c.image || c.video ? `<div class="mc-media" aria-hidden="true">${media(c)}</div>` : c.scene ? sceneCanvas(c.scene, c.opts) : UI[c.art] ? `<div class="mc-ui" data-mc-ui="${c.art}" aria-hidden="true"></div>` : ARTS[c.art] ? `<canvas data-mc-art="${c.art}" aria-hidden="true"></canvas>` : sceneCanvas(c.art, c.opts)}</article>`).join('')}</div></div>`;
    el.querySelectorAll('.mc-ui').forEach(d => UI[d.dataset.mcUi](d));
    el.querySelectorAll('canvas[data-mc-art]').forEach(cv => { const a = ARTS[cv.dataset.mcArt]; if (a) loop(cv, (ctx, w, h, t) => a(ctx, w, h, t, cv)); });
  };

  /* Pinned list ("List with image"): a sticky 50/50. A visual (the page's 3D object) holds one side while a list of items on the other
     lights up one at a time as you scroll.
     Modules.pinned(el, { mode, title, items, visual, side, expose, trackId, perItem })
       mode 'swap'   (Core Services): a full-screen opener (title is an array of lines, the 2nd set in serif italic), then a track as tall as
                     the items need (perItem vh each, plus one screen). A pinned panel holds a clickable list and one explainer at a time that
                     cross-fades. Items: { title, short, long, cta: {label, href} }. The active item follows scroll progress through the track.
       mode 'scroll' (Own): a centred headline (title is a string), then the items scroll past while the visual stays pinned beside them.
                     Items: { title, text }. The active item is the one nearest the middle of the screen; the first lights as soon as the
                     section is well in view.
       side          'left' (default: visual left, list right) or 'right'. Phones stack them.
       visual        Optional HTML placed in the visual slot (the page's gl.js draws the 3D object there).
       expose        Name of the window object the module keeps up to date for the page's 3D: window[expose] = { active } (swap) or
                     { active, count } (scroll). active is -1 before the first item.
       trackId       swap only: id of the track element. perItem swap only: vh per item (default 45).
     The visual slot also carries the old class names the homepage's gl.js reads: core-vis and core-sticky (swap), own-vis and own-stack (scroll). */
  window.Modules.pinned = function (el, o) {
    const swap = o.mode !== 'scroll', n = o.items.length, vis = o.visual || '';
    const pinState = g => { el.__pin = g; return g; };   // the stage reads el.__pin: the slot's model answers the active item
    el.classList.add('m-pin', swap ? 'mp-swap' : 'mp-scroll'); if (o.side === 'right') el.classList.add('right');
    const clamp01 = v => Math.min(1, Math.max(0, v)), cta = c => c ? `<a class="btn white" href="${c.href}">${c.label}${arrow}</a>` : '';
    let G;
    if (swap) {
      G = pinState(window[o.expose || '__pin'] = { active: -1, count: n });
      el.innerHTML =
        `<div class="mp-head"><div class="wrap">${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}<h2>${o.title.map((t, i) => `<span${i === 1 ? ' class="acc"' : ''}>${t}</span>`).join('')}</h2>${o.text ? `<p class="lead mp-lead">${o.text}</p>` : ''}</div></div>
        <div class="mp-track"${o.trackId ? ` id="${o.trackId}"` : ''} style="height:${n * (o.perItem || 45) + 100}vh"><div class="mp-sticky core-sticky"><div class="wrap"><div class="mp-vis core-vis" aria-hidden="true">${vis}</div><div class="mp-panel">
          <div class="mp-list">${o.items.map((it, i) => `<button data-i="${i}">${it.title}</button>`).join('')}</div>
          <div class="mp-body">${o.items.map((it, i) => `<div class="mp-item" data-i="${i}"><h3>${it.title}</h3>${it.short ? `<p class="mp-short">${it.short}</p>` : ''}${it.long ? `<p class="mp-long">${it.long}</p>` : ''}${it.points ? `<dl class="mp-pts">${it.points.map(x => `<div><dt>${x.label}</dt><dd>${x.text}</dd></div>`).join('')}</dl>` : ''}${cta(it.cta)}</div>`).join('')}</div>
        </div></div></div></div>`;
    } else {
      G = pinState(window[o.expose || '__pin'] = { active: -1, count: n });
      el.innerHTML =
        `<div class="wrap">${o.eyebrow ? `<div class="mp-eb">${Parts.eyebrow(o.eyebrow)}</div>` : ''}<h2 class="big mp-title" data-rv>${o.title}</h2>${o.text ? `<p class="lead mp-lead" data-rv>${o.text}</p>` : ''}<div class="mp-grid"><div class="mp-copy">
        <div class="mp-items"${o.tail ? ` style="padding-bottom:${o.tail}"` : ''}>${o.items.map((it, i) => `<div class="mp-item" data-i="${i}"><h3>${it.title}</h3>${it.text ? `<p>${it.text}</p>` : ''}${cta(it.cta)}</div>`).join('')}</div></div>
        <div class="mp-vis own-vis"><div class="mp-stack own-stack">${vis}</div></div></div></div>`;
    }
    const items = [...el.querySelectorAll('.mp-item')], btns = [...el.querySelectorAll('.mp-list button')], track = el.querySelector('.mp-track');
    const light = idx => { G.active = idx; btns.forEach((b, i) => b.classList.toggle('on', i === idx)); items.forEach((b, i) => b.classList.toggle('on', i === idx)); };
    let update;
    if (swap) {
      // with sub-points (points), the explainer box grows to its tallest item (items are stacked absolutely), so the
      // longer items never spill out. Swaps without points keep the approved box (Home's Core Services is unchanged).
      const body = o.items.some(it => it.points) && el.querySelector('.mp-body'), fitBody = () => { if (!body) return; body.style.minHeight = ''; const m = Math.max(...items.map(it => it.offsetHeight)); if (m > body.offsetHeight) body.style.minHeight = m + 'px'; };
      fitBody(); addEventListener('resize', fitBody); if (document.fonts) document.fonts.ready.then(fitBody);
      btns.forEach(b => b.onclick = () => {
        const i = +b.dataset.i, top = track.getBoundingClientRect().top + scrollY, span = track.offsetHeight - innerHeight;
        scrollTo({ top: top + span * ((i + .5) / n) });
      });
      update = () => {
        const r = track.getBoundingClientRect(), span = track.offsetHeight - innerHeight, p = clamp01(-r.top / span);
        const idx = r.top > innerHeight * .35 ? -1 : Math.min(n - 1, Math.floor(p * n));
        if (idx !== G.active) light(idx);
      };
    } else {
      update = () => {
        const mid = innerHeight * .52 + (innerWidth < 900 ? 70 : 0);
        let best = -1, bd = 1e9;
        items.forEach((e, i) => { const r = e.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
        const secR = el.getBoundingClientRect();
        if (secR.top > innerHeight * .6 || secR.bottom < innerHeight * .4) best = secR.top > 0 ? -1 : n - 1;   // the first piece lights as soon as the section is well into view
        G.active = best;
        items.forEach((e, i) => e.classList.toggle('on', i === best));
      };
    }
    let tick = false;
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; update(); }); } }, { passive: true });
    addEventListener('resize', update); update(); requestAnimationFrame(update);
  };

  /* Logo card lockup: Modules.lockup(el, { title, text, cta: {label, href}, rows: [{ href, image, name, text }], logos: [{ image, name }] })
     A centred headline with a lead and a button, then ruled rows (a client's logo, one sentence, an arrow; the row fills with glass boxes on
     hover), then a free-standing strip of plain logos. Homepage "Established". */
  /* Report: Modules.report(el, { eyebrow, title, text: [], cta: { label, href }, side: 'right'|'left', edition })
     The custom module for every report, guide and white-paper section (2026-11-18): the copy on an ink panel beside a
     typographic edition of the report itself, set from the section's own title (never the live site's cover image).
     As the section scrolls in, the book turns toward you, its pages fan and a light glints across the cover.
     edition: the small line on the cover (defaults to the eyebrow, else 'Report'). backdrop: { scene, opts } behind the panel
     (default: a slow dot ribbon flowing through it, so the panel is never a flat field). */
  window.Modules.report = function (el, o) {
    el.classList.add('m-report'); if (o.side === 'left') el.classList.add('left');
    const ed = o.edition || o.eyebrow || 'Report';
    el.innerHTML = `<div class="wrap"><div class="rp-panel">
      <div class="rp-copy">${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}<h2 class="rp-title" data-rv>${o.title}</h2>${[].concat(o.text || []).map(t => `<p class="lead" data-rv>${t}</p>`).join('')}${o.cta ? `<a class="btn white" href="${o.cta.href}" data-rv>${o.cta.label}${arrow}</a>` : ''}</div>
      <canvas class="m-scene rp-bg" data-scene="${(o.backdrop && o.backdrop.scene) || 'dotRibbon'}" data-scene-opts='${JSON.stringify((o.backdrop && o.backdrop.opts) || {})}' aria-hidden="true"></canvas>
      <div class="rp-stage" aria-hidden="true"><div class="rp-book"><span class="rp-sheet s3"></span><span class="rp-sheet s2"></span><span class="rp-sheet s1"></span>
        <div class="rp-cover"><span class="rp-mark"></span><span class="rp-ed">${ed}</span><span class="rp-name">${o.title}</span><span class="rp-rule"></span><span class="rp-glint"></span></div></div></div>
    </div></div>`;
    const book = el.querySelector('.rp-book');
    const set = () => { const r = el.getBoundingClientRect(); const v = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.9 + r.height * 0.35))); book.style.setProperty('--p', (1 - Math.pow(1 - v, 3)).toFixed(3)); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { book.style.setProperty('--p', 1); return; }
    let tick = false; addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; set(); }); } }, { passive: true }); addEventListener('resize', set); set();
  };

  window.Modules.scene = sceneCanvas;   // a scene slot's markup, for a pinned list's visual: Modules.scene('flowLanes', { ins, hub, outs })

  window.Modules.lockup = function (el, o) {
    el.classList.add('m-lockup'); if (o.wrap) el.classList.add('ml-wrap');   // wrap: a long lead wraps (Home's is one line)
    const boxes = () => `<span class="hov-boxes" aria-hidden="true">${Array.from({ length: 64 }, () => `<i style="--d:${(Math.random() * .35).toFixed(2)}s"></i>`).join('')}</span>`;
    el.innerHTML =
      `<div class="wrap"><div class="ml-top"><div>${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}<h2 class="big" data-rv>${o.title}</h2>${o.text ? `<p class="lead" data-rv>${o.text}</p>` : ''}${o.cta ? `<a class="btn white" href="${o.cta.href}" data-rv>${o.cta.label}${arrow}</a>` : ''}</div></div>
      <div class="ml-rows">${(o.rows || []).map(l => { const tag = l.href ? 'a' : 'div';   // rows without an image show their name in its place; rows without a link are not links
        return `<${tag} class="ml-row${l.href ? '' : ' no-link'}"${l.href ? ` href="${l.href}"` : ''}${l.href && l.go ? ` aria-label="${l.name} - ${l.go}" title="${l.go}"` : ''} data-rv>${l.image ? `<img src="${l.image}" alt="${l.name}">` : `<div class="ml-nm">${l.label ? `<p class="ml-label">${l.label}</p>` : ''}<h3 class="ml-name">${l.name}</h3></div>`}<p>${l.text}</p>${l.href ? `<span class="ml-go">${arrow}</span>` : '<span></span>'}${boxes()}</${tag}>`; }).join('')}</div>
      <div class="ml-logos">${(o.logos || []).map(l => `<img src="${l.image}" alt="${l.name}" loading="lazy" data-rv>`).join('')}</div></div>`;
  };

  /* Video card carousel: Modules.videos(el, { title, slides: [{ title, video }], art: ['stripes' | 'rings' | 'rays', ...] })
     A headline over a row of tall video cards. Each card is a link that opens its video in a new tab: a moving still, a play button
     and a title at the foot. Three cards fill the row; phones stack them. art picks each card's still (default stripes, rings, rays in turn). */
  window.Modules.videos = function (el, o) {
    el.classList.add('m-videos');
    const play = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>', arts = o.art || ['stripes', 'rings', 'rays'];
    el.innerHTML = `<div class="wrap"><h2 class="big" data-rv>${o.title}</h2><div class="mv-tiles">${o.slides.map((s, i) =>
      `<a class="mv-tile mv-${arts[i % arts.length]}" href="${s.video}" target="_blank" rel="noopener" data-rv style="--d:${i * .1}s"><span class="mv-art"></span><span class="mv-play">${play}</span><h3>${s.title}</h3></a>`).join('')}</div></div>`;
  };

  /* Product-UI diagram on its own: Modules.ui(el, name) mounts UI[name] into el (same mount and fit as in a 50/50 or card).
     Needs an .m-split or .m-multi ancestor for the styles. Returns false for an unknown name. Modules.ui.names lists them. */
  /* Headline ("Section headline"): the 3x multicard's centred head on its own. Returns markup for a page to place.
     Modules.headline({ eyebrow, title, text }) */
  window.Modules.headline = o => `<div class="mc-head m-headline">${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}<h2 class="big" data-rv>${o.title}</h2>${o.text ? `<p class="lead" data-rv>${o.text}</p>` : ''}</div>`;

  /* ---------- Product-page modules (2026-11-17 night). Each maps one of BitGo's CMS components (see PLAYBOOK.md). ---------- */

  /* Section headline on its own ("headline" component when nothing follows it directly).
     Modules.section(el, { eyebrow, title, text, cta }) */
  window.Modules.section = function (el, o) {
    el.classList.add('m-section');
    el.innerHTML = `<div class="wrap">${Modules.headline(o)}${o.cta ? `<div class="ms-cta" data-rv><a class="btn white" href="${o.cta.href}">${o.cta.label}${arrow}</a>${o.cta2 ? `<a class="btn ghost" href="${o.cta2.href}">${o.cta2.label}${arrow}</a>` : ''}</div>` : ''}</div>`;   // cta2: a second, ghost button
  };

  /* Text list ("list" component): an intro beside titled rows, in the FAQ's two-column layout.
     Modules.textlist(el, { eyebrow, title, text, items: [{ title, text }], numbered, side: 'right' | 'left' })
     side is where the rows sit (live 'list--right' = rows on the right, the default). */
  window.Modules.textlist = function (el, o) {
    el.classList.add('m-textlist'); if (o.side === 'left') el.classList.add('rows-left');
    const n = i => o.numbered ? `<span class="tl-n">${String(i + 1).padStart(2, '0')}</span>` : '';
    const head = `${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}<h2 class="big" data-rv>${o.title}</h2>${o.text ? `<p class="lead" data-rv>${o.text}</p>` : ''}`;
    const rows = `<div class="tl-rows">${o.items.map((it, i) => `<div class="tl-row" data-rv style="--d:${(i * .05).toFixed(2)}s">${n(i)}<div><h3>${it.title}</h3>${it.text ? `<p>${it.text}</p>` : ''}</div></div>`).join('')}</div>`;
    el.innerHTML = `<div class="wrap"><div class="tl-grid"><div class="tl-side">${head}</div>${rows}</div></div>`;
  };

  /* Fine print (the entity disclosure line some pages end with). Modules.fineprint(el, { text, link: { label, href } })
     If the link label appears in the text, it is linked in place. */
  window.Modules.fineprint = function (el, o) {
    el.classList.add('m-fineprint');
    let t = o.text;
    if (o.link) t = t.includes(o.link.label) ? t.replace(o.link.label, `<a href="${o.link.href}">${o.link.label}</a>`) : `${t} <a href="${o.link.href}">${o.link.label}</a>`;
    el.innerHTML = `<div class="wrap"><p data-rv>${t}</p></div>`;
  };

  /* Accordion ("accordion" component, the handoff's Accordion feature list): numbered chapters, one open at a time
     (the first opens by default). Each row: title, a short subheading and the body, with an optional link.
     Modules.accordion(el, { eyebrow, title, text, items: [{ title, sub, text, cta }] }) */
  window.Modules.accordion = function (el, o) {
    el.classList.add('m-accordion');
    el.innerHTML = `<div class="wrap">${o.title ? Modules.headline({ eyebrow: o.eyebrow, title: o.title, text: o.text }) : ''}
      <div class="ac-list">${o.items.map((it, i) => `<details${i === 0 ? ' open' : ''}><summary><span class="ac-n">${String(i + 1).padStart(2, '0')}</span><h3>${it.title}</h3><span class="pm" aria-hidden="true"></span></summary>
        <div class="ac-body">${it.sub ? `<p class="ac-sub">${it.sub}</p>` : ''}${it.text ? `<p class="ac-t">${it.text}</p>` : ''}${it.cta ? `<a class="btn white" href="${it.cta.href}">${it.cta.label}${arrow}</a>` : ''}</div></details>`).join('')}</div></div>`;
    const ds = [...el.querySelectorAll('details')];
    ds.forEach(d => d.addEventListener('toggle', () => { if (d.open) ds.forEach(x => { if (x !== d) x.open = false; }); }));
  };

  /* Quote and quote carousel ("quote", "quoteCarousel"): the quote set large, its source beneath. With more than one quote,
     a quiet stepper (01 / 03, previous, next) and a slow crossfade every 8s; nothing moves on its own under reduced motion.
     Modules.quote(el, { quotes: [{ text, cite, logo, logoAlt }] }); logo: the speaker's company mark, as live shows it above the quote */
  window.Modules.quote = function (el, o) {
    el.classList.add('m-quote');
    const q = o.quotes, many = q.length > 1, pad = i => String(i + 1).padStart(2, '0');
    el.innerHTML = `<div class="wrap"><div class="qt-stage">${q.map((x, i) => `<figure class="qt${i === 0 ? ' on' : ''}"${i ? ' aria-hidden="true"' : ''}>${x.logo ? `<img class="qt-logo" src="${x.logo}" alt="${x.logoAlt || ''}">` : ''}<blockquote>${x.text}</blockquote>${x.cite ? `<figcaption>${x.cite}</figcaption>` : ''}</figure>`).join('')}</div>
      ${many ? `<div class="qt-nav"><span class="qt-i">01 / ${pad(q.length - 1)}</span><button class="qt-b prev" aria-label="Previous quote">${arrow}</button><button class="qt-b next" aria-label="Next quote">${arrow}</button></div>` : ''}</div>`;
    if (!many) return;
    const fs = [...el.querySelectorAll('.qt')], ix = el.querySelector('.qt-i'); let cur = 0, timer = 0;
    const stage = el.querySelector('.qt-stage'), fit = () => { stage.style.minHeight = Math.max(...fs.map(f => f.scrollHeight)) + 'px'; };
    const go = n => { fs[cur].classList.remove('on'); fs[cur].setAttribute('aria-hidden', 'true'); cur = (n + fs.length) % fs.length; fs[cur].classList.add('on'); fs[cur].removeAttribute('aria-hidden'); ix.textContent = `${pad(cur)} / ${pad(fs.length - 1)}`; };
    const auto = () => { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => { if (!document.hidden) go(cur + 1); }, 8000); };
    el.querySelector('.prev').onclick = () => { go(cur - 1); auto(); }; el.querySelector('.next').onclick = () => { go(cur + 1); auto(); };
    addEventListener('resize', fit); fit(); setTimeout(fit, 600); auto();
  };

  /* Standalone text ("standaloneText"): editorial copy on its own, centred, one or more paragraphs at reading width.
     Modules.prose(el, { eyebrow, title, text: [ ... ] }) */
  window.Modules.prose = function (el, o) {
    el.classList.add('m-prose');
    el.innerHTML = `<div class="wrap"><div class="pr-in">${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}${o.title ? `<h2 class="big" data-rv>${o.title}</h2>` : ''}${[].concat(o.text || []).map(t => `<p data-rv>${t}</p>`).join('')}</div></div>`;
  };

  window.Modules.ui = function (el, name) {
    if (!UI[name]) return false;
    el.classList.add('mc-ui'); el.dataset.mcUi = name; el.setAttribute('aria-hidden', 'true');
    UI[name](el); return true;
  };
  Object.defineProperty(window.Modules.ui, 'names', { get: () => Object.keys(UI) });   // live: includes arts registered later (ui-arts.js, shared/arts/*.js)
  // the UI-art kit, for arts kept in their own file (shared/system/ui-arts.js registers into the same registry)
  window.Modules.uiKit = { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, pop, arrow, reduce };
})();
