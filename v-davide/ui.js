/* DOM choreography: smooth scroll, pins, wipes, diagrams. Shares state with scene.js through window.BG. */
(function () {
  var BG = window.BG = { coreP: 0, heroP: 0, active: -1, rm: false };
  var rm = BG.rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rm) document.documentElement.classList.add('rm');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };
  var sm = function (a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* nav drawer + theme */
  var nav = $('#nav');
  $('.burger').addEventListener('click', function () {
    var o = nav.classList.toggle('open'); this.setAttribute('aria-expanded', o);
  });
  $$('.drawer a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); }); });

  var onScr = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScr, { passive: true }); onScr();

  /* rotating hero word */
  (function () {
    var ws = $$('.rw'); if (ws.length < 2 || rm) return;
    var i = 0;
    setInterval(function () {
      var cur = ws[i], nx = ws[(i + 1) % ws.length];
      cur.classList.remove('on'); cur.classList.add('out'); nx.classList.add('on');
      setTimeout(function () { cur.style.transition = 'none'; cur.classList.remove('out'); void cur.offsetWidth; cur.style.transition = ''; }, 900);
      i = (i + 1) % ws.length;
    }, 2600);
  })();

  /* est glow follows pointer */
  var est = $('#established');
  est.addEventListener('pointermove', function (e) {
    var r = est.getBoundingClientRect();
    est.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    est.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  });

  /* badges reveal */
  if ('IntersectionObserver' in window) {
    var bo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var b = e.target; setTimeout(function () { b.classList.add('in'); }, +b.dataset.d || 0); bo.unobserve(b); } });
    }, { threshold: 0.4 });
    $$('.badge').forEach(function (b, i) { b.dataset.d = i * 260; bo.observe(b); });
  } else $$('.badge').forEach(function (b) { b.classList.add('in'); });

  /* ---------- visible-only canvas animation helper ---------- */
  function liveCanvas(cv, draw) {
    var ctx = cv.getContext('2d'), vis = false, w = 0, h = 0;
    function size() {
      var r = cv.getBoundingClientRect(); w = Math.max(10, r.width); h = Math.max(10, r.height);
      cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
    }
    size(); window.addEventListener('resize', size);
    var io = new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { rootMargin: '80px' });
    io.observe(cv);
    var t0 = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      if (!vis) return;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h, rm ? 2.2 : (now - t0) / 1000);
    }
    requestAnimationFrame(loop);
    if (rm) { setTimeout(function () { vis = true; }, 50); }
  }
  function bez(a, b, c, t) { var u = 1 - t; return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]; }
  function glowDot(ctx, x, y, r, col) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 0.55; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  function pulses(ctx, a, b, c, t, n, speed, col, r, off) {
    for (var k = 0; k < n; k++) {
      var u = ((t * speed + k / n + (off || 0)) % 1);
      for (var s = 6; s >= 0; s--) { var p = bez(a, b, c, Math.max(0, u - s * 0.012)); ctx.globalAlpha = (1 - s / 7) * 0.5; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], r * (1 - s / 9), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1; var q = bez(a, b, c, u); glowDot(ctx, q[0], q[1], r, col);
    }
  }
  function strokeBez(ctx, a, b, c, col, lw) { ctx.strokeStyle = col; ctx.lineWidth = lw || 1.2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]); ctx.stroke(); }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* ---------- build cards ---------- */
  var diagrams = {
    account: function (ctx, w, h, t) {
      var W = '#fff', Wd = 'rgba(255,255,255,.3)';
      var bx = w * .36, by = h * .3, bw = w * .3, bh = h * .4;
      var src = [[w * .08, h * .27], [w * .08, h * .73]], out = [[w * .93, h * .2], [w * .93, h * .5], [w * .93, h * .8]];
      src.forEach(function (s, i) { var e = [bx, h * (i ? .58 : .42)], m = [(s[0] + e[0]) / 2, s[1]]; strokeBez(ctx, s, m, e, Wd); pulses(ctx, s, m, e, t, 2, .28, W, 2.6, i * .31); glowDot(ctx, s[0], s[1], 5, W); });
      out.forEach(function (o, i) { var s = [bx + bw, h * (.4 + i * .1)], m = [(s[0] + o[0]) / 2 + 10, o[1]]; strokeBez(ctx, s, m, o, Wd); pulses(ctx, s, m, o, t, 1, .22 + i * .05, W, 2.6, i * .37); ctx.strokeStyle = W; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(o[0], o[1], 6, 0, 7); ctx.stroke(); });
      ctx.strokeStyle = W; ctx.lineWidth = 1.5; rr(ctx, bx, by, bw, bh, 16); ctx.stroke();
      var l1 = .45 + .3 * Math.sin(t * .8), l2 = .5 + .3 * Math.sin(t * .6 + 2);
      ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, bx + 16, by + bh * .3, (bw - 32) * l1, 10, 5); ctx.fill();
      ctx.fillStyle = 'rgba(170,200,255,.9)'; rr(ctx, bx + 16, by + bh * .6, (bw - 32) * l2, 10, 5); ctx.fill();
      ctx.strokeStyle = Wd; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx + 16, by + bh * .3 + 5); ctx.lineTo(bx + bw - 16, by + bh * .3 + 5); ctx.moveTo(bx + 16, by + bh * .6 + 5); ctx.lineTo(bx + bw - 16, by + bh * .6 + 5); ctx.stroke();
    },
    stake: function (ctx, w, h, t) {
      var cx = w / 2, cy = h / 2, R = Math.min(w, h) * .38, N = 30, cyc = (t % 7) / 7;
      var head = cyc * 1.25 * N;
      for (var i = 0; i < N; i++) {
        var a = i / N * 6.2832 - 1.5708, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        var lit = clamp(head - i, 0, 6) / 6, on = i < head;
        ctx.fillStyle = on ? 'rgba(157,184,255,' + (.5 + .5 * (1 - lit)) + ')' : 'rgba(255,255,255,.18)';
        ctx.beginPath(); ctx.arc(x, y, on ? 4.5 : 3, 0, 7); ctx.fill();
        if (on && lit > .01 && lit < 1) glowDot(ctx, x, y, 4, '#9DB8FF');
        if (on) { ctx.strokeStyle = 'rgba(157,184,255,.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx + Math.cos(a) * R * .62, cy + Math.sin(a) * R * .62); ctx.stroke(); }
      }
      var gw = R * 1.1, gh = R * .8, gx = cx - gw / 2, gy = cy - gh / 2 + 8, prog = clamp(cyc * 1.2, 0, 1);
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); var steps = 9;
      for (var s = 0; s <= steps; s++) { var u = s / steps; if (u > prog) break; var px = gx + u * gw, py = gy + gh - Math.pow(u, 1.5) * gh * .95; if (s === 0) ctx.moveTo(px, py); else { ctx.lineTo(px, gy + gh - Math.pow((s - 1) / steps, 1.5) * gh * .95); ctx.lineTo(px, py); } }
      ctx.stroke();
      var ex = gx + Math.min(prog, 1) * gw; glowDot(ctx, ex, gy + gh - Math.pow(Math.min(prog, 1), 1.5) * gh * .95, 4, '#fff');
      var rip = (t % 7); if (rip < 1) { ctx.strokeStyle = 'rgba(255,255,255,' + (1 - rip) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R * (.2 + rip * .9), 0, 7); ctx.stroke(); }
    },
    network: function (ctx, w, h, t) {
      var B = '#1647DB', Bd = 'rgba(22,71,219,.25)';
      var L = [[w * .12, h * .22], [w * .2, h * .5], [w * .12, h * .78]], Rr = [[w * .88, h * .22], [w * .8, h * .5], [w * .88, h * .78]];
      ctx.strokeStyle = 'rgba(7,16,46,.28)'; ctx.setLineDash([4, 7]); ctx.lineWidth = 1;
      [.42, .58].forEach(function (f) { ctx.beginPath(); ctx.moveTo(w * f, h * .08); ctx.lineTo(w * f, h * .92); ctx.stroke(); }); ctx.setLineDash([]);
      var pairs = [[0, 1], [1, 0], [2, 2], [1, 1], [0, 2], [2, 0]];
      pairs.forEach(function (p, k) {
        var a = L[p[0]], c = Rr[p[1]], m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 + (k % 2 ? -1 : 1) * 40];
        strokeBez(ctx, a, m, c, Bd);
        var u = (t * .35 + k * .17) % 1;
        if (u > .85) { var f = (u - .85) / .15; ctx.strokeStyle = 'rgba(22,71,219,' + (1 - f) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(c[0], c[1], 8 + f * 22, 0, 7); ctx.stroke(); }
        pulses(ctx, a, m, c, t, 1, .35, B, 3, k * .17);
      });
      L.concat(Rr).forEach(function (n) { ctx.fillStyle = '#fff'; ctx.strokeStyle = B; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(n[0], n[1], 8, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = B; ctx.beginPath(); ctx.arc(n[0], n[1], 3, 0, 7); ctx.fill(); });
    }
  };
  $$('.dia').forEach(function (cv) { liveCanvas(cv, diagrams[cv.dataset.kind]); });

  /* ---------- support dial ---------- */
  var dial = $('#dial'), supItems = $$('.sup-list li'), supP = 0, curSup = -1;
  if (dial) liveCanvas(dial, function (ctx, w, h, t) {
    var cx = w / 2, cy = h / 2, R = w * .47, TAU = 6.2832, ang = (supP * 2.2 + t * .09) * TAU;
    var a0 = ((ang % TAU) + TAU) % TAU, idx = Math.floor(a0 / (TAU / 5));
    if (idx !== curSup) { curSup = idx; supItems.forEach(function (li, i) { li.classList.toggle('cur', i === idx); }); }
    var i, a;
    for (i = 0; i < 7; i++) { a = -1.5708 + i / 7 * TAU; var lit = ((a0 / TAU * 7) | 0) === i;
      ctx.strokeStyle = lit ? '#4F7BFF' : 'rgba(157,184,255,.28)'; ctx.lineWidth = lit ? 9 : 5; ctx.beginPath(); ctx.arc(cx, cy, R, a + .05, a + TAU / 7 - .05); ctx.stroke(); }
    for (i = 0; i < 120; i++) { a = i / 120 * TAU - 1.5708; var big = i % 5 === 0, r1 = R * (big ? .78 : .81), r2 = R * .86;
      var d = Math.abs(((i / 120 * TAU - a0 + 3 * TAU) % TAU) - 0); var near = clamp(1 - d / .5, 0, 1);
      ctx.strokeStyle = 'rgba(234,240,255,' + (.2 + near * .7) + ')'; ctx.lineWidth = big ? 1.6 : 1; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke(); }
    for (i = 0; i < 5; i++) { a = -1.5708 + i / 5 * TAU; var on = i === idx;
      ctx.strokeStyle = on ? '#fff' : 'rgba(157,184,255,.35)'; ctx.lineWidth = on ? 3 : 1.4; ctx.beginPath(); ctx.arc(cx, cy, R * .66, a + .06, a + TAU / 5 - .06); ctx.stroke();
      if (on) { ctx.fillStyle = 'rgba(22,71,219,.35)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R * .66, a + .06, a + TAU / 5 - .06); ctx.closePath(); ctx.fill(); } }
    var ha = a0 - 1.5708; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ha) * R * .44, cy + Math.sin(ha) * R * .44); ctx.lineTo(cx + Math.cos(ha) * R * .92, cy + Math.sin(ha) * R * .92); ctx.stroke();
    glowDot(ctx, cx + Math.cos(ha) * R * .92, cy + Math.sin(ha) * R * .92, 5, '#fff');
  });

  /* ---------- CTA converging flows ---------- */
  var cf = $('#ctaflow');
  if (cf) {
    var cfW = 0, cfH = 0, tgt = [0, 0];
    var cfBtn = $('#cta .btn');
    var fl = [];
    liveCanvas(cf, function (ctx, w, h, t) {
      var r = cf.getBoundingClientRect(), br = cfBtn.getBoundingClientRect();
      tgt = [br.left + br.width / 2 - r.left, br.top + br.height / 2 - r.top];
      var starts = [[-.02, .12], [-.02, .45], [-.02, .86], [.3, 1.03], [.7, 1.03], [1.02, .8], [1.02, .4], [.62, -.03], [.22, -.03]];
      starts.forEach(function (s, i) {
        var a = [s[0] * w, s[1] * h], c = tgt, m = [a[0] + (c[0] - a[0]) * .25, c[1] + (a[1] - c[1]) * .15 * (i % 2 ? 1 : -1) + (i % 2 ? 90 : -90)];
        strokeBez(ctx, a, m, c, 'rgba(255,255,255,.12)', 1.2);
        pulses(ctx, a, m, c, t, 1, .1 + (i % 4) * .02, '#fff', 2.4, i * .13);
      });
      glowDot(ctx, tgt[0], tgt[1], 4, '#fff');
    });
  }


  /* ---------- spotlight stills ---------- */
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  var stillDraw = {
    converge: function (ctx, w, h) {
      var R = rnd(11), px = w * .64, py = h * .5, i;
      for (i = 0; i < 16; i++) {
        var side = i % 4, sx = side === 0 ? -5 : side === 1 ? w + 5 : R() * w, sy = side === 2 ? -5 : side === 3 ? h + 5 : R() * h;
        var mx = (sx + px) / 2 + (R() - .5) * w * .4, my = (sy + py) / 2 + (R() - .5) * h * .5;
        ctx.strokeStyle = 'rgba(255,255,255,' + (.18 + R() * .4) + ')'; ctx.lineWidth = 1 + R() * 1.2;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(mx, my, px, py); ctx.stroke();
        var t = .25 + R() * .6, q = bez([sx, sy], [mx, my], [px, py], t); glowDot(ctx, q[0], q[1], 2.2, '#fff');
      }
      var g = ctx.createRadialGradient(px, py, 0, px, py, h * .55); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.12, 'rgba(190,210,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); glowDot(ctx, px, py, 7, '#fff');
    },
    rail: function (ctx, w, h) {
      var vx = w * .56, vy = h * .42, i, n = 26;
      for (i = n; i >= 1; i--) {
        var u = Math.pow(i / n, 2.3), hw = w * .62 * u, hh = h * .5 * u, cx = vx + (1 - u) * w * .14 * Math.sin(i * .35) - u * w * .06, cy = vy + u * h * .06;
        ctx.strokeStyle = 'rgba(157,190,255,' + (.12 + (1 - u) * .5) + ')'; ctx.lineWidth = 1; ctx.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2);
      }
      ctx.strokeStyle = 'rgba(157,190,255,.35)';
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) { ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + s[0] * w * .62, vy + h * .02 + s[1] * h * .5); ctx.stroke(); });
      var R = rnd(5); for (i = 0; i < 7; i++) { var uu = Math.pow(.15 + R() * .7, 2.3), bw = w * .2 * uu + 3, bh = h * .12 * uu + 2, bx = vx + (R() - .5) * w * .5 * uu, by = vy + (R() - .5) * h * .3 * uu; ctx.fillStyle = 'rgba(150,185,255,' + (.35 + R() * .5) + ')'; ctx.shadowColor = '#7FA3FF'; ctx.shadowBlur = 14; ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh); }
      ctx.shadowBlur = 0; glowDot(ctx, vx, vy, 4, '#fff');
    },
    frames: function (ctx, w, h) {
      var cx = w * .5, cy = h * .5, i, N = 18;
      for (i = N; i >= 1; i--) {
        var s = Math.min(w, h) * .05 * i * .62, a = i * .105;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.strokeStyle = 'rgba(255,255,255,' + (.7 - i / N * .55) + ')'; ctx.lineWidth = 1.1; ctx.strokeRect(-s * 1.3, -s * .75, s * 2.6, s * 1.5);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 1.3, -s * .75, 2.2, 0, 7); ctx.fill(); ctx.restore();
      }
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * .3); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(120,160,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
  };
  function paintStills() {
    $$('.still').forEach(function (cv) {
      var r = cv.getBoundingClientRect(); if (r.width < 4) return; var w = r.width, h = r.height;
      cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
      var ctx = cv.getContext('2d'); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); stillDraw[cv.dataset.kind](ctx, w, h);
    });
  }
  paintStills(); window.addEventListener('resize', paintStills); window.addEventListener('load', paintStills);

  /* ---------- tile wipes ---------- */
  function hex(c) { c = c.replace('#', ''); return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)]; }
  function mix(a, b, t) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }).join(',') + ')'; }
  var wipes = $$('.wipe').map(function (el) {
    var cv = $('canvas', el), ctx = cv.getContext('2d'), A = hex(el.dataset.from), Bc = hex(el.dataset.to);
    var o = { el: el, p: 0, tiles: [], w: 0, h: 0, vis: false, last: -1 };
    function size() {
      o.w = window.innerWidth; o.h = Math.round(window.innerHeight * (window.innerWidth < 900 ? 0.4 : 0.6)); cv.width = o.w; cv.height = o.h;
      var cols = o.w < 700 ? 6 : o.w > 1900 ? 18 : 14, s = Math.ceil(o.w / cols), rows = Math.ceil(o.h / s);
      o.s = s; o.cols = cols; o.rows = rows; o.tiles = [];
      var seed = 7 + o.cols * 3;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        seed = (seed * 9301 + 49297) % 233280;
        o.tiles.push((c / cols) * .5 + (r / rows) * .28 + (seed / 233280) * .22);
      }
      o.last = -1;
    }
    o.draw = function () {
      if (o.p === o.last) return; o.last = o.p;
      ctx.fillStyle = mix(A, Bc, 0); ctx.fillRect(0, 0, o.w, o.h);
      var mid = mix(A, Bc, .5).replace('rgb', 'rgba').replace(')', ',1)');
      var lum = function (c) { return c[0] * .3 + c[1] * .59 + c[2] * .11; }, DK = lum(A) < lum(Bc) ? A : Bc;
      var M = [Math.round(DK[0] * .75), Math.round(DK[1] * .75), Math.round(DK[2] * .75)];
      var k = 0;
      for (var r = 0; r < o.rows; r++) for (var c = 0; c < o.cols; c++, k++) {
        var d = o.tiles[k], l = clamp((o.p * 1.3 - d * .65) / .35, 0, 1), x = c * o.s, y = r * o.s;
        if (l <= 0) continue;
        if (l >= 1) { ctx.fillStyle = mix(A, Bc, 1); ctx.fillRect(x, y, o.s + 1, o.s + 1); continue; }
        ctx.fillStyle = 'rgb(' + M.join(',') + ')'; ctx.fillRect(x, y, o.s, o.s);
        var f = l < .5 ? 1 - l * 2 : (l - .5) * 2, wd = (o.s - 4) * f;
        ctx.fillStyle = mix(A, Bc, l < .5 ? 0 : 1); ctx.fillRect(x + (o.s - wd) / 2, y + 2, wd, o.s - 4);
      }
    };
    size(); window.addEventListener('resize', size);
    return o;
  });
  var themeOf = { '#040818': 'dark', '#050B22': 'dark', '#1647DB': 'blue', '#EDF1FA': 'light' };
  function wipeFrame() { wipes.forEach(function (o) { o.draw(); }); }

  /* ---------- core pin logic ---------- */
  var svcs = $$('.svc'), labels = $$('.flow-label'), point = $('.core-point');
  svcs.forEach(function (s) { s._w = $$('.w', s); });
  function setCore(p) {
    BG.coreP = p;
    var A0 = .06, SPAN = .16, act = -1;
    svcs.forEach(function (s, k) {
      var lp = (p - (A0 + SPAN * k)) / SPAN, op = sm(0, .1, lp) * (1 - sm(.9, 1, lp));
      if (k === 4) op = sm(0, .1, lp) * (1 - sm(.88, 1, lp));
      s.style.opacity = op; s.style.transform = 'translateY(' + ((1 - sm(0, .1, lp)) * 24) + 'px)';
      s.classList.toggle('cur', lp >= 0 && lp < 1);
      if (lp >= 0 && lp < 1) act = k;
      var n = s._w.length, wp = clamp((lp - .06) / .66, 0, 1);
      s._w.forEach(function (w, i) { w.style.opacity = (.2 + .8 * clamp(wp * (n + 4) - i, 0, 1)).toFixed(2); });
      var on = lp > -.2;
      labels[k].classList.toggle('on', on); labels[k].classList.toggle('cur', lp >= 0 && lp < 1);
    });
    BG.active = act;
    var fin = sm(.86, .97, p);
    point.style.opacity = fin;
    BG.fin = fin;
  }
  window.__setCore = setCore;

  if (!hasGsap) { return; }
  gsap.registerPlugin(ScrollTrigger);
  var lenis = null;
  if (!rm && window.Lenis) {
    lenis = new Lenis({ lerp: .1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { var t = document.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t); } });
    });
  }

  /* hero progress: top of hero -> top of core */
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', endTrigger: '#core', end: 'top top', scrub: true,
    onUpdate: function (s) { BG.heroP = s.progress; }
  });
  // dim words light up
  var dws = $$('.dw'), lit0 = 5;
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: '+=55%', scrub: true,
    onUpdate: function (s) { var n = lit0 + s.progress * (dws.length - lit0); dws.forEach(function (w, i) { w.classList.toggle('lit', i < n); }); }
  });
  dws.forEach(function (w, i) { if (i < lit0) w.classList.add('lit'); });

  /* marquees */
  $$('.marq-row').forEach(function (r) {
    var dir = +r.dataset.dir;
    gsap.fromTo(r, { xPercent: dir < 0 ? 0 : -42 }, { xPercent: dir < 0 ? -42 : 0, ease: 'none', scrollTrigger: { trigger: '#trust', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* core pin */
  if (!rm) {
    ScrollTrigger.create({
      trigger: '#core', start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * (window.innerWidth < 900 ? 4.4 : 4.8)); },
      pin: true, scrub: true, anticipatePin: 1,
      onUpdate: function (s) { setCore(s.progress); }
    });
    setCore(0);
  } else { setCore(1); svcs.forEach(function (s) { s.style.opacity = 1; s.style.transform = 'none'; }); BG.heroP = 1; }

  /* wipes */
  wipes.forEach(function (o) {
    ScrollTrigger.create({
      trigger: o.el, start: 'top 92%', end: 'bottom 72%', scrub: true,
      onUpdate: function (s) {
        o.p = Math.round(s.progress * 400) / 400; o.draw();
        nav.setAttribute('data-theme', themeOf[o.el.dataset[s.progress > .5 ? 'to' : 'from']] || 'dark');
      },
      onRefresh: function (s) { o.p = s.progress; o.last = -1; o.draw(); }
    });
    o.draw();
  });
  window.addEventListener('resize', function () { wipes.forEach(function (o) { o.last = -1; o.draw(); }); });

  /* nav theme per section */
  $$('section[data-theme]').forEach(function (s) {
    ScrollTrigger.create({ trigger: s, start: 'top 40px', end: 'bottom 40px', onToggle: function (self) { if (self.isActive) nav.setAttribute('data-theme', s.dataset.theme); } });
  });

  /* support dial scroll */
  ScrollTrigger.create({ trigger: '#support', start: 'top bottom', end: 'bottom top', scrub: true, onUpdate: function (s) { supP = s.progress; } });

  /* own rail */
  var items = $$('.own-i'), fill = $('.rail-fill'), railEl = $('.rail');
  ScrollTrigger.create({
    trigger: '.own-rail', start: 'top bottom', end: 'bottom top', scrub: true,
    onUpdate: function () {
      var rr = railEl.getBoundingClientRect(), line = window.innerHeight * .58;
      var f = clamp((line - rr.top) / rr.height, 0, 1);
      fill.style.transform = 'scaleY(' + f + ')';
      var cur = -1;
      items.forEach(function (it, i) { var b = it.getBoundingClientRect(); var d = line > b.top + 40; it.classList.toggle('done', d && i < items.length); if (d) cur = i; });
      items.forEach(function (it, i) { it.classList.toggle('cur', i === cur); });
    }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
