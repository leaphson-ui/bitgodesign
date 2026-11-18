/* BitGo shared 2D scenes: the animated canvas scenes from the Cantor8 homepage (line), the Save homepage (dots), the
   Cantor8 24/7 grid (grid) and the homepage ASCII dissolve (ascii), as one library that any page or module places by name.

     <canvas data-scene="flowLanes" data-scene-opts='{"ins":["Cash","Crypto"],"hub":"Go Account","outs":["Hold","Send"]}'></canvas>
     Scenes.mount(root)            mounts every unmounted canvas[data-scene] under root (also runs once on DOMContentLoaded)
     Scenes.define(name, { kind, meaning, opts, draw })   opts are the defaults; draw(ctx, w, h, t, p, o, s)
     Scenes.has(name), Scenes.list(), Scenes.get(name)

   draw: t seconds; p 0..1 scroll draw-in (0 as the canvas enters the viewport bottom, 1 once its centre reaches 60% of the
   viewport); o the merged options; s per-canvas state. The library also keeps on s: s.dt (seconds since the last frame,
   at most 0.05), s.dpr, s.pal (colours for the tone), s.still (true for the one reduced-motion frame) and s.cv (the canvas).

   Tone (o.tone) names the GROUND, like .on-light in base.css: 'dark' (default: ink, deep or blue grounds, white and blue ink)
   or 'light' (paper or white grounds, navy and blue ink). Left out, a canvas inside .tone-paper gets 'light'.
   Labels are always options from the page's live copy. No scene carries product copy of its own.
   Reduced motion: one complete still frame (p = 1, t = 4, simulations warmed up first). ?still on the page URL forces it. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const sm = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ahash = (a, b, c) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const FONT = '"Inter Tight","Helvetica Neue",Arial,sans-serif';
  const DASH_SOFT = [3, 7], DASH_CAP = [6, 7], NODASH = [], DASH_FINE = [2, 4], DASH_DOT = [2, 2.5];
  const count = (v, d) => (Array.isArray(v) ? v.length : typeof v === 'number' ? Math.max(1, Math.round(v)) : d);
  const label = (v, i) => (Array.isArray(v) && typeof v[i] === 'string' ? v[i] : '');
  const XY = { x: 0, y: 0 };   // scratch point, reused by the helpers below

  /* ---------- palettes: o.tone names the ground ---------- */
  function palette(tone) {
    const L = tone === 'light';
    return {
      light: L,
      fg: L ? 'rgb(8,24,86)' : '#fff', fgRgb: L ? '8,24,86' : '255,255,255',   // line ink
      hi: L ? '#1647DB' : '#fff',                                                // what moves: packets, pulses, lit lines
      k: L ? 1.1 : 1,                                                            // line alpha scale (navy on paper reads a touch lighter)
      cy: L ? '0,140,230' : '98,216,255', wh: L ? '22,71,219' : '255,255,255', bl: L ? '90,130,255' : '110,170,255',   // Save's glow colours
      lane: L ? 'rgba(22,71,219,.3)' : 'rgba(120,165,255,.28)',
      beam: L ? '22,71,219' : '102,230,255',
      blend: L ? 'source-over' : 'lighter',
    };
  }
  function withSprites(P) {   // after the sprite helpers exist: every glow a scene uses, made once per tone
    P.cyS = `rgb(${P.cy})`; P.ringS = P.light ? 'rgb(22,71,219)' : 'rgb(120,165,255)';
    P.sCy = glow(P.cy, 0.95); P.sWh = glow(P.wh, 0.95); P.sBl = glow(P.bl, 0.95); P.sWhite = glow('255,255,255', 0.95); P.sBeam = strip(P.beam);
    P.sPulse = P.light ? core('rgba(22,71,219,.9)', 'rgba(77,120,255,.3)', 'rgba(77,120,255,0)') : core('rgba(255,255,255,.9)', 'rgba(180,210,255,.35)', 'rgba(22,71,219,0)');
    P.sCore = P.light ? core('rgba(22,71,219,1)', 'rgba(77,120,255,.7)', 'rgba(77,120,255,0)') : core('rgba(255,255,255,1)', 'rgba(98,216,255,.8)', 'rgba(22,71,219,0)');
    return P;
  }

  /* ---------- sprites, made once and reused: glow dots (Save's glowDot), beam strips ---------- */
  const SPR = new Map();
  function glow(rgb, a, mid = 0.35) {
    const key = 'g' + rgb + a + mid; let c = SPR.get(key); if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = 96;
    const x = c.getContext('2d'), g = x.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.25, `rgba(${rgb},${a * mid})`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 96, 96); SPR.set(key, c); return c;
  }
  function core(inner, mid, outer) {   // a 3-stop radial (Save's staking core, Cantor8's falling pulse)
    const key = 'c' + inner + mid + outer; let c = SPR.get(key); if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, inner); g.addColorStop(0.3, mid); g.addColorStop(1, outer);
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); SPR.set(key, c); return c;
  }
  function strip(rgb) {   // the beam's cross-section: Save's valley stream, 1 - smoothstep(0, .5, |x|)
    const key = 's' + rgb; let c = SPR.get(key); if (c) return c;
    c = document.createElement('canvas'); c.width = 64; c.height = 1;
    const x = c.getContext('2d'), d = x.createImageData(64, 1), [r, g, b] = rgb.split(',').map(Number);
    for (let i = 0; i < 64; i++) { const u = Math.abs((i + 0.5) / 32 - 1), a = 1 - sm(u); d.data[i * 4] = r; d.data[i * 4 + 1] = g; d.data[i * 4 + 2] = b; d.data[i * 4 + 3] = Math.round(a * 255); }
    x.putImageData(d, 0, 0); SPR.set(key, c); return c;
  }
  function dot(ctx, spr, x, y, r) { ctx.drawImage(spr, x - r * 4, y - r * 4, r * 8, r * 8); }
  // the light column from Save's terrain: widens toward the viewer, pulses travel down it (sin(z * .35 + t * 2.2))
  function beam(ctx, P, x, y0, y1, w0, w1, t, a, d) {
    const spr = P.sBeam, n = Math.max(12, Math.min(200, Math.round((y1 - y0) / 4))), sh = (y1 - y0) / n;
    const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = P.blend;
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n, wk = w0 + (w1 - w0) * u, pulse = 0.5 + 0.5 * Math.sin((u * (y1 - y0)) * 0.035 - t * 2.2);
      const ya = Math.round((y0 + k * sh) * d) / d, yb = Math.round((y0 + (k + 1) * sh) * d) / d;
      ctx.globalAlpha = a * (0.35 + 0.65 * pulse) * (P.light ? 0.55 : 1) * Math.min(1, u * 6);
      ctx.drawImage(spr, x - wk / 2, ya, wk, yb - ya);
    }
    ctx.globalCompositeOperation = op; ctx.globalAlpha = 1;
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }

  /* polyline paths with arc length, built on resize; along() writes into XY */
  function mkPath(pts) {
    const n = pts.length, X = new Float32Array(n), Y = new Float32Array(n), seg = new Float32Array(n - 1); let L = 0;
    for (let i = 0; i < n; i++) { X[i] = pts[i][0]; Y[i] = pts[i][1]; if (i) { seg[i - 1] = Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]); L += seg[i - 1]; } }
    const p2 = new Path2D(); for (let i = 0; i < n; i++) i ? p2.lineTo(X[i], Y[i]) : p2.moveTo(X[i], Y[i]);
    return { X, Y, seg, L, p2 };
  }
  function along(P, d) {
    d = clamp(d, 0, P.L);
    for (let i = 0; i < P.seg.length; i++) {
      if (d <= P.seg[i] || i === P.seg.length - 1) { const u = P.seg[i] ? d / P.seg[i] : 0; XY.x = P.X[i] + (P.X[i + 1] - P.X[i]) * u; XY.y = P.Y[i] + (P.Y[i + 1] - P.Y[i]) * u; return XY; }
      d -= P.seg[i];
    }
    return XY;
  }
  function bez(c, u) {   // c: Float32Array(8), cubic bezier p0..p3
    const v = 1 - u, a = v * v * v, b = 3 * v * v * u, d = 3 * v * u * u, e = u * u * u;
    XY.x = a * c[0] + b * c[2] + d * c[4] + e * c[6]; XY.y = a * c[1] + b * c[3] + d * c[5] + e * c[7]; return XY;
  }
  const FONTS = [];
  const font = (size, wt = 500) => FONTS[size * 1000 + wt] || (FONTS[size * 1000 + wt] = `${wt} ${size}px ${FONT}`);
  function labelText(ctx, P, txt, x, y, align, size, a, maxW) {
    if (!txt) return;
    ctx.font = font(size); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = P.fg; ctx.globalAlpha = a; maxW > 0 ? ctx.fillText(txt, x, y, maxW) : ctx.fillText(txt, x, y); ctx.globalAlpha = 1;
  }
  const labelSize = (w, h) => Math.round(clamp(Math.min(w, h) / 34, 11, 15));

  /* ================================================================================================================ */
  const defs = Object.create(null);
  const Scenes = window.Scenes = {
    define(name, def) { def.name = name; def.opts = def.opts || {}; defs[name] = def; return def; },
    has: (name) => !!defs[name],
    get: (name) => defs[name],
    list: () => Object.keys(defs),
    mount,
  };
  const define = Scenes.define;

  /* ---------------------------------------------- line (Cantor8) ---------------------------------------------- */

  // lanes spread around the hub: four lanes sit at -.3, -.16, .16, .3 of the height (Cantor8's Go Accounts)
  function spreadIn(n) {
    if (n <= 1) return [0];
    const half = n >> 1, out = [], f = (k) => (half === 1 ? 0.2 : 0.16 + 0.14 * k / (half - 1));
    for (let k = half - 1; k >= 0; k--) out.push(-f(k));
    if (n % 2) out.push(0);
    for (let k = 0; k < half; k++) out.push(f(k));
    return out;
  }
  function spreadOut(n) { if (n <= 1) return [0]; const A = clamp(0.07 * n, 0.2, 0.4), out = []; for (let i = 0; i < n; i++) out.push(-A + 2 * A * i / (n - 1)); return out; }

  define('flowLanes', {
    kind: 'line',
    meaning: 'Several inputs merge into one hub, then fan out to what you can do with it. Packets travel the lanes and the hub pulses each time one lands.',
    opts: { ins: 4, hub: '', outs: 4 },
    docs: { ins: 'Inputs: a number of lanes, or their labels. With labels, even lanes carry round coins and odd lanes square packets.', hub: 'Label under the hub box.', outs: 'Outputs: a number, or their labels.' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, dt = s.dt, ni = count(o.ins, 4), no = count(o.outs, 4);
      if (s.w !== w || s.h !== h) {
        s.w = w; s.h = h;
        const yc = h * 0.5, bx0 = w * 0.56, bx1 = w * 0.74;
        s.box = [bx0, yc - h * 0.13, bx1 - bx0, h * 0.26];
        s.lanes = spreadIn(ni).map((f) => { const y = yc + h * f; return mkPath([[0, y], [w * 0.2, y], [w * 0.2 + Math.abs(yc - y) * 0.7, yc], [bx0, yc]]); });
        s.outs = spreadOut(no).map((f) => { const y = yc + h * f; return mkPath([[bx1, yc], [w * 0.82, yc], [w * 0.82 + Math.abs(y - yc) * 0.6, y], [w, y]]); });
        s.all = new Path2D(); s.lanes.concat(s.outs).forEach((q) => s.all.addPath(q.p2));
        if (!s.pk) { s.pk = Array.from({ length: 40 }, () => ({ on: false, lane: 0, d: 0, out: -1, coin: false })); s.pulse = 0; s.spawn = 0; }
        s.fs = labelSize(w, h);
      }
      const g = sm(p * 1.25);
      ctx.lineWidth = 1; ctx.strokeStyle = P.fg; ctx.globalAlpha = 0.3 * P.k;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w * g + 1, h); ctx.clip(); ctx.stroke(s.all); ctx.restore();
      // the hub: an account box with three live balances
      s.pulse *= Math.pow(0.1, dt);
      const [bx, by, bw, bh] = s.box, ba = sm(p * 1.8 - 0.5);
      ctx.globalAlpha = 0.9 * ba; ctx.lineWidth = 1.2; ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = P.hi; ctx.globalAlpha = (0.1 + s.pulse * 0.35) * ba; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = P.fg; ctx.globalAlpha = 0.85 * ba;
      for (let i = 0; i < 3; i++) { const y = by + bh * (0.25 + i * 0.25), wv = (0.35 + 0.4 * Math.abs(Math.sin(t * 0.4 + i * 1.7))) * (bw - 24); ctx.fillRect(bx + 12, y - 2, wv, 4); }
      // packets
      if (p > 0.6) {
        s.spawn -= dt;
        if (s.spawn < 0) {
          s.spawn = rnd(0.25, 0.6);
          const k = s.pk.find((q) => !q.on);
          if (k) { k.on = true; k.lane = Math.floor(Math.random() * ni); k.d = 0; k.out = -1; k.coin = Array.isArray(o.ins) ? k.lane % 2 === 0 : Math.random() < 0.5; }
        }
      }
      const sp = Math.max(120, w * 0.3);
      ctx.fillStyle = P.hi; ctx.globalAlpha = 1;
      for (const k of s.pk) {
        if (!k.on) continue;
        k.d += sp * dt;
        let path = k.out < 0 ? s.lanes[k.lane] : s.outs[k.out];
        if (k.d >= path.L) {
          if (k.out < 0) { k.out = Math.floor(Math.random() * no); k.d = 0; s.pulse = 1; path = s.outs[k.out]; }
          else { k.on = false; continue; }
        }
        const q = along(path, k.d);
        if (k.coin) circ(ctx, q.x, q.y, 4.2); else ctx.fillRect(q.x - 4, q.y - 4, 8, 8);
      }
      // labels from the page
      const fs = s.fs;
      for (let i = 0; i < ni; i++) labelText(ctx, P, label(o.ins, i), 8, s.lanes[i].Y[0] - 9, 'left', fs, 0.82 * g, w * 0.3);
      for (let i = 0; i < no; i++) labelText(ctx, P, label(o.outs, i), w - 8, s.outs[i].Y[3] - 9, 'right', fs, 0.82 * g, w * 0.17);
      if (o.hub) labelText(ctx, P, String(o.hub), bx + bw / 2, by + bh + fs + 10, 'center', fs, 0.9 * ba, w * 0.32);
    },
  });

  define('barsNodes', {
    kind: 'line',
    meaning: 'One source sends rewards down into a row of stakes every epoch; the stakes grow, compound, then harvest and start again.',
    opts: { bars: 22, label: '' },
    docs: { bars: 'Number of bars in the histogram.', label: 'Label beside the source node.' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, dt = s.dt, M = Math.max(4, Math.round(o.bars) || 22);
      if (!s.target || s.target.length !== M) {
        s.target = new Float32Array(M); s.cur = new Float32Array(M);
        for (let i = 0; i < M; i++) { s.target[i] = 0.18 + 0.1 * Math.sin(i * 0.5); s.cur[i] = s.target[i]; }
        s.pips = Array.from({ length: 48 }, () => ({ on: false, i: 0, u: 0 })); s.ep = 0; s.flash = 0;
      }
      const tg = s.target, cur = s.cur;
      s.ep -= dt;
      const gap = w * 0.012, bw = (w - gap * (M + 1)) / M, base = h * 0.9, sx = w / 2, sy = h * 0.12;
      if (s.ep < 0 && p > 0.5) {
        s.ep = 0.5; s.flash = 1;
        for (let n = 0; n < 5; n++) { const k = s.pips.find((q) => !q.on); if (k) { k.on = true; k.i = Math.floor(Math.random() * M); k.u = 0; } }
      }
      s.flash *= Math.pow(0.05, dt);
      // the source
      const ga = sm(p * 2);
      ctx.strokeStyle = P.hi; ctx.lineWidth = 1.2; ctx.globalAlpha = ga; const q = 16 + s.flash * 5;
      ctx.strokeRect(sx - q / 2, sy - q / 2, q, q); ctx.fillStyle = P.hi; ctx.globalAlpha = (0.2 + s.flash * 0.7) * ga; ctx.fillRect(sx - q / 2, sy - q / 2, q, q);
      if (o.label) labelText(ctx, P, String(o.label), sx + 22, sy + 5, 'left', labelSize(w, h), 0.85 * ga, w / 2 - 30);
      let mx = 0;
      for (let i = 0; i < M; i++) { cur[i] += (tg[i] - cur[i]) * Math.min(1, dt * 5); mx = Math.max(mx, cur[i]); }
      const hmax = h * 0.7;
      for (let i = 0; i < M; i++) {
        const x = gap + i * (bw + gap), hh = cur[i] * hmax * sm(p * 1.6 - (i / M) * 0.5);
        ctx.fillStyle = P.fg; ctx.globalAlpha = (0.16 + cur[i] * 0.45) * P.k; ctx.fillRect(x, base - hh, bw, hh);
        ctx.fillStyle = P.hi; ctx.globalAlpha = 1; ctx.fillRect(x, base - hh, bw, 2);
      }
      ctx.lineWidth = 1;
      for (const k of s.pips) {
        if (!k.on) continue;
        k.u += dt * 1.5;
        const x1 = gap + k.i * (bw + gap) + bw / 2, y1 = base - cur[k.i] * hmax, u = Math.min(1, k.u), e = u * u;
        const x = sx + (x1 - sx) * e, y = sy + (y1 - sy) * e;
        ctx.fillStyle = P.hi; ctx.globalAlpha = 1; ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
        ctx.strokeStyle = P.fg; ctx.globalAlpha = 0.25 * P.k; line(ctx, sx, sy, x, y);
        if (u >= 1) { tg[k.i] += 0.045; k.on = false; }
      }
      if (mx > 0.97) for (let i = 0; i < M; i++) tg[i] = 0.14 + 0.1 * Math.random();
      ctx.fillStyle = P.fg; ctx.globalAlpha = 0.5 * P.k * ga; ctx.fillRect(0, base, w, 1); ctx.globalAlpha = 1;
    },
  });

  define('nodeMesh', {
    kind: 'line',
    meaning: 'A network of linked nodes. Two legs of a trade cross one link at the same moment, and both ends settle together.',
    opts: { nodes: 10, labels: [] },
    docs: { nodes: 'Number of nodes in the mesh.', labels: 'Optional labels, placed beside the first nodes.' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, dt = s.dt, N = clamp(Math.round(o.nodes) || 10, 3, 40);
      if (!s.nodes || s.nodes.length !== N) {
        s.nodes = []; s.edges = [];
        for (let i = 0; i < N; i++) s.nodes.push({ bx: 0.1 + 0.8 * ((i * 0.618) % 1), by: 0.12 + 0.76 * ((i * 0.382 + 0.17 * (i % 3)) % 1), ph: rnd(0, 6), ring: 0 });
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const d = Math.hypot(s.nodes[i].bx - s.nodes[j].bx, (s.nodes[i].by - s.nodes[j].by) * 0.7 * (0.62 / 0.76)); if (d < 0.36) s.edges.push(i, j); }
        if (!s.edges.length) for (let i = 1; i < N; i++) s.edges.push(i - 1, i);
        s.X = new Float32Array(N); s.Y = new Float32Array(N);
        s.sw = Array.from({ length: 12 }, () => ({ on: false, a: 0, b: 0, u: 0 })); s.next = 0;
      }
      const X = s.X, Y = s.Y, E = s.edges, hs = 5;
      for (let i = 0; i < N; i++) { const n = s.nodes[i]; X[i] = (n.bx + 0.012 * Math.sin(t * 0.4 + n.ph)) * w; Y[i] = (n.by + 0.016 * Math.cos(t * 0.33 + n.ph)) * h; }
      s.next -= dt;
      if (s.next < 0 && p > 0.5) { s.next = rnd(0.55, 1.1); const k = s.sw.find((q) => !q.on); if (k) { const e = Math.floor(Math.random() * (E.length / 2)) * 2; k.on = true; k.a = E[e]; k.b = E[e + 1]; k.u = 0; } }
      const g = sm(p * 1.4);
      // links stop at the node squares, so the squares stay open on any ground
      ctx.lineWidth = 1; ctx.strokeStyle = P.fg; ctx.globalAlpha = 0.22 * P.k * g;
      ctx.beginPath();
      for (let e = 0; e < E.length; e += 2) {
        const a = E[e], b = E[e + 1], dx = X[b] - X[a], dy = Y[b] - Y[a], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
        const cut = (hs + 1) / Math.max(Math.abs(ux), Math.abs(uy), 1e-3);
        if (L <= cut * 2) continue;
        ctx.moveTo(X[a] + ux * cut, Y[a] + uy * cut); ctx.lineTo(X[b] - ux * cut, Y[b] - uy * cut);
      }
      ctx.stroke();
      for (const k of s.sw) {
        if (!k.on) continue;
        k.u += dt * 0.9;
        const a = k.a, b = k.b, u = Math.min(1, k.u), e = u * u * (3 - 2 * u);
        ctx.strokeStyle = P.hi; ctx.globalAlpha = 0.9 * (1 - u * 0.5); ctx.lineWidth = 1.4;
        line(ctx, X[a], Y[a], X[a] + (X[b] - X[a]) * e, Y[a] + (Y[b] - Y[a]) * e);
        line(ctx, X[b], Y[b], X[b] + (X[a] - X[b]) * e, Y[b] + (Y[a] - Y[b]) * e);
        ctx.fillStyle = P.hi; ctx.globalAlpha = 1;
        ctx.fillRect(X[a] + (X[b] - X[a]) * e - 3.5, Y[a] + (Y[b] - Y[a]) * e - 3.5, 7, 7);
        circ(ctx, X[b] + (X[a] - X[b]) * e, Y[b] + (Y[a] - Y[b]) * e, 4);
        if (u >= 1) { s.nodes[a].ring = 1; s.nodes[b].ring = 1; k.on = false; }
      }
      ctx.lineWidth = 1.2; const fs = labelSize(w, h);
      for (let i = 0; i < N; i++) {
        const n = s.nodes[i], x = X[i], y = Y[i]; n.ring *= Math.pow(0.06, dt);
        ctx.strokeStyle = P.hi; ctx.globalAlpha = g; ctx.strokeRect(x - hs, y - hs, hs * 2, hs * 2);
        if (n.ring > 0.03) { const r = 8 + (1 - n.ring) * 34; ctx.globalAlpha = n.ring; ctx.strokeRect(x - r, y - r, r * 2, r * 2); }
        const lb = label(o.labels, i); if (lb) labelText(ctx, P, lb, x + 12, y + 4, 'left', fs, 0.82 * g, Math.max(40, w - x - 16));
      }
      ctx.globalAlpha = 1;
    },
  });

  // the five 'Own' line scenes keep their proportions: a box the width of the canvas, its height capped by the width
  const vbox = (w, h, r) => { const bh = Math.min(h, w * r); return [(h - bh) / 2, bh]; };

  define('lineArches', {
    kind: 'line',
    meaning: 'A colonnade of open arches drawn in by scroll. A light line reads every arch in turn: nothing is hidden.',
    opts: { count: 7 },
    docs: { count: 'Number of arches.' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, n = clamp(Math.round(o.count) || 7, 2, 16), [y0, bh] = vbox(w, h, 0.62);
      const x0 = w * 0.04, x1 = w * 0.96, sw = (x1 - x0) / n, yb = y0 + bh * 0.88, ya = y0 + bh * 0.42;
      const scan = x0 + ((t * 0.16) % 1.2) * (x1 - x0), st = 0.84 / n;
      ctx.strokeStyle = P.fg;
      for (let k = 0; k < n; k++) {
        const xl = x0 + k * sw + sw * 0.1, xr = x0 + (k + 1) * sw - sw * 0.1, cx = (xl + xr) / 2, r = (xr - xl) / 2;
        const lit = Math.max(0, 1 - Math.abs(scan - cx) / (sw * 1.6)), g = sm(p * 1.6 - k * st);
        ctx.globalAlpha = (0.3 + 0.7 * lit) * g; ctx.lineWidth = 1.2 + lit * 1.2;
        ctx.beginPath(); ctx.moveTo(xl, yb); ctx.lineTo(xl, ya); ctx.arc(cx, ya, r, Math.PI, 0); ctx.lineTo(xr, yb); ctx.stroke();
        ctx.globalAlpha = 0.14 * P.k * g; ctx.lineWidth = 1;
        for (let m = 1; m < 4; m++) line(ctx, cx - r * 0.55, yb - m * (yb - ya) * 0.22, cx + r * 0.55, yb - m * (yb - ya) * 0.22);
      }
      ctx.globalAlpha = 1; ctx.strokeStyle = P.hi; ctx.lineWidth = 1.6; line(ctx, x0, yb, x0 + (x1 - x0) * sm(p * 1.3), yb);
      ctx.strokeStyle = P.fg; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; line(ctx, scan, y0 + bh * 0.1, scan, yb);
      ctx.globalAlpha = 1;
    },
  });

  define('lineZigzag', {
    kind: 'line',
    meaning: 'A path that zigzags through middlemen. The middle hops fade and the line goes direct, end to end.',
    opts: { hops: 4, ends: [] },
    docs: { hops: 'Number of middle hops.', ends: 'Optional labels for the two ends: [from, to].' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, n = clamp(Math.round(o.hops) || 4, 1, 10), [y0, bh] = vbox(w, h, 0.6);
      if (s.w !== w || s.h !== h || !s.mid || s.mid.length !== n * 2) {
        s.w = w; s.h = h; s.mid = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) { const f = n === 1 ? 0.5 : 0.26 + 0.48 * i / (n - 1), yy = i % 2 ? 0.78 - 0.02 * ((i >> 1) % 2) : 0.2 + 0.04 * ((i >> 1) % 2); s.mid[i * 2] = w * f; s.mid[i * 2 + 1] = y0 + bh * yy; }
      }
      const c = Math.sin(t * 0.7) * 0.5 + 0.5, Ax = w * 0.06, Bx = w * 0.94, Y = y0 + bh * 0.5, g = sm(p * 1.5), M = s.mid;
      ctx.strokeStyle = P.fg; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.5 * (1 - c) * g * P.k;
      ctx.beginPath(); ctx.moveTo(Ax, Y); for (let i = 0; i < n; i++) ctx.lineTo(M[i * 2], M[i * 2 + 1]); ctx.lineTo(Bx, Y); ctx.stroke();
      ctx.globalAlpha = 0.2 * g * P.k; ctx.setLineDash(DASH_SOFT);
      for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(M[i * 2], M[i * 2 + 1], 16, 0, TAU); ctx.stroke(); }
      ctx.setLineDash(NODASH);
      ctx.fillStyle = P.fg; ctx.globalAlpha = 0.7 * (1 - c) * g; for (let i = 0; i < n; i++) circ(ctx, M[i * 2], M[i * 2 + 1], 4.5);
      ctx.strokeStyle = P.hi; ctx.globalAlpha = (0.3 + 0.7 * c) * g; ctx.lineWidth = 1.2 + c * 2;
      line(ctx, Ax, Y, Ax + (Bx - Ax) * sm(p * 1.4), Y);
      ctx.fillStyle = P.hi; ctx.globalAlpha = 1; circ(ctx, Ax, Y, 6); circ(ctx, Bx, Y, 6);
      circ(ctx, Ax + (Bx - Ax) * ((t * 0.45) % 1), Y, 4);
      const fs = labelSize(w, h);
      labelText(ctx, P, label(o.ends, 0), Ax, Y + fs + 16, 'left', fs, 0.82 * g, w * 0.4);
      labelText(ctx, P, label(o.ends, 1), Bx, Y + fs + 16, 'right', fs, 0.82 * g, w * 0.4);
    },
  });

  define('lineGlobe', {
    kind: 'line',
    meaning: 'A wireframe globe that never sleeps: routes arc across it and points keep moving along them, day and night.',
    opts: { routes: 5, lead: true },
    docs: { routes: 'Number of routes with a moving point.', lead: 'The line that runs in from the left edge to the globe.' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, cx = w * 0.5, cy = h * 0.5, R = Math.min(h * 0.44, w * 0.3), rot = t * 0.28, g = sm(p * 1.4), n = clamp(Math.round(o.routes) || 5, 1, 9);
      ctx.strokeStyle = P.fg; ctx.lineWidth = 1; ctx.globalAlpha = 0.45 * g * P.k;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      for (let k = 0; k < 6; k++) { const ang = rot + (k * Math.PI) / 6; ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(R * Math.cos(ang)) + 0.5, R, 0, 0, TAU); ctx.stroke(); }
      for (let l = -2; l <= 2; l++) { const la = (l * Math.PI) / 6, y = cy + R * Math.sin(la), ww = R * Math.cos(la); line(ctx, cx - ww, y, cx + ww, y); }
      ctx.fillStyle = P.hi; ctx.strokeStyle = P.fg;
      for (let i = 0; i < n; i++) {
        const a0 = i * 1.4, a1 = 0.35 - i * 0.18, b0 = i * 1.4 + 2.2, b1 = -0.25 + i * 0.12;
        ctx.globalAlpha = 0.5 * g * P.k; ctx.beginPath(); let started = false;
        for (let u = 0; u <= 1.001; u += 0.04) {
          const lon = a0 + (b0 - a0) * u + rot, lat = a1 + (b1 - a1) * u + Math.sin(u * Math.PI) * 0.35;
          if (Math.cos(lon) * Math.cos(lat) > 0) { const x = cx + R * Math.cos(lat) * Math.sin(lon), y = cy - R * Math.sin(lat); started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true; } else started = false;
        }
        ctx.stroke();
        const u = (t * 0.16 + i * 0.2) % 1, lon = a0 + (b0 - a0) * u + rot, lat = a1 + (b1 - a1) * u + Math.sin(u * Math.PI) * 0.35;
        if (Math.cos(lon) * Math.cos(lat) > 0) { ctx.globalAlpha = g; circ(ctx, cx + R * Math.cos(lat) * Math.sin(lon), cy - R * Math.sin(lat), 4); }
      }
      if (o.lead) { ctx.strokeStyle = P.hi; ctx.globalAlpha = g; ctx.lineWidth = 1.6; line(ctx, 0, cy, cx - R, cy); }
      ctx.globalAlpha = 1;
    },
  });

  define('lineSteps', {
    kind: 'line',
    meaning: 'Supply climbs in halving steps and rests against a fixed cap. A bright line keeps retracing the climb.',
    opts: { steps: 7, lead: true },
    docs: { steps: 'Number of halving steps.', lead: 'The line that runs in from the left edge to the first step.' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, n = clamp(Math.round(o.steps) || 7, 2, 14), [y0, bh] = vbox(w, h, 0.62);
      const x0 = w * 0.05, x1 = w * 0.95, yb = y0 + bh * 0.86, yc = y0 + bh * 0.16, sw = (x1 - x0) / n;
      const val = (e) => yb - (yb - yc) * (1 - Math.pow(0.5, e + 1));
      if (s.w !== w || s.h !== h || s.n !== n) {
        s.w = w; s.h = h; s.n = n; s.path = new Path2D();
        for (let e = 0; e < n; e++) { e ? s.path.lineTo(x0 + e * sw, val(e)) : s.path.moveTo(x0, val(0)); s.path.lineTo(x0 + (e + 1) * sw, val(e)); }
      }
      ctx.strokeStyle = P.fg; ctx.lineWidth = 1; ctx.globalAlpha = 0.45 * P.k; ctx.setLineDash(DASH_CAP); line(ctx, x0, yc, x1, yc); ctx.setLineDash(NODASH);
      ctx.globalAlpha = 0.12 * P.k; for (let e = 0; e <= n; e++) line(ctx, x0 + e * sw, yb, x0 + e * sw, yc + 8);
      const reach = x0 + Math.min(1, (t * 0.09) % 1.25) * (x1 - x0);
      ctx.globalAlpha = 0.25 * P.k; ctx.lineWidth = 1.2; ctx.stroke(s.path);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, reach, h); ctx.clip(); ctx.strokeStyle = P.hi; ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.stroke(s.path); ctx.restore();
      const e = Math.min(n - 1, Math.floor((reach - x0) / sw)); ctx.fillStyle = P.hi; ctx.globalAlpha = 1; circ(ctx, reach, val(e), 5);
      if (o.lead) { ctx.strokeStyle = P.hi; ctx.globalAlpha = sm(p * 1.4); ctx.lineWidth = 1.6; line(ctx, 0, val(0), x0, val(0)); }
      ctx.globalAlpha = 1;
    },
  });

  define('lineSkyline', {
    kind: 'line',
    meaning: 'One open outline climbs in setbacks to a spire, drawn upward again and again: building, layer on layer.',
    opts: { lead: true },
    docs: { lead: 'The ground line that runs in from the left edge.' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, cx = w * 0.5, hTot = Math.min(h * 0.8, w * 0.62), yb = (h + hTot) / 2, Wb = Math.min(w, hTot * 3.6);
      if (s.w !== w || s.h !== h) {
        s.w = w; s.h = h;
        const hw = [0.2, 0.2, 0.15, 0.15, 0.1, 0.1, 0.05, 0.05], ht = [0.18, 0.2, 0.14, 0.16, 0.1, 0.1, 0.06, 0.06];
        const pts = [[cx - hw[0] * Wb, yb]]; let y = yb;
        for (let k = 0; k < hw.length; k++) { y -= ht[k] * hTot / 0.98; pts.push([cx - hw[k] * Wb, y]); if (k + 1 < hw.length) pts.push([cx - hw[k + 1] * Wb, y]); }
        const top = pts[pts.length - 1];
        s.outline = new Path2D(); pts.forEach((q, i) => (i ? s.outline.lineTo(q[0], q[1]) : s.outline.moveTo(q[0], q[1])));
        pts.forEach((q, i) => (i ? s.outline.lineTo(2 * cx - q[0], q[1]) : s.outline.moveTo(2 * cx - q[0], q[1])));
        s.outline.moveTo(top[0], top[1]); s.outline.lineTo(2 * cx - top[0], top[1]);
        s.win = new Path2D();
        for (let m = 1; m < 8; m++) { const x = cx - hw[0] * Wb + (2 * hw[0] * Wb) * m / 8; s.win.moveTo(x, yb); s.win.lineTo(x, yb - hTot * 0.34); }
        for (let m = 1; m < 5; m++) { const x = cx - hw[3] * Wb + (2 * hw[3] * Wb) * m / 5; s.win.moveTo(x, yb - hTot * 0.34); s.win.lineTo(x, yb - hTot * 0.6); }
      }
      const cyc = (t * 0.3) % 1.6, up = Math.min(1, cyc / 1.1), fade = cyc > 1.3 ? 1 - (cyc - 1.3) / 0.3 : 1, reach = yb - hTot * sm(up);
      ctx.save(); ctx.beginPath(); ctx.rect(0, reach, w, h); ctx.clip();
      ctx.strokeStyle = P.hi; ctx.globalAlpha = 0.95 * fade; ctx.lineWidth = 1.6; ctx.stroke(s.outline);
      ctx.strokeStyle = P.fg; ctx.globalAlpha = 0.2 * fade * P.k; ctx.lineWidth = 1; ctx.stroke(s.win);
      ctx.restore();
      ctx.fillStyle = P.hi; ctx.globalAlpha = fade; circ(ctx, cx, reach, 3.5);
      ctx.strokeStyle = P.fg; ctx.globalAlpha = 0.4 * P.k; ctx.lineWidth = 1; line(ctx, w * 0.04, yb, w * 0.96, yb);
      if (o.lead) { ctx.strokeStyle = P.hi; ctx.globalAlpha = sm(p * 1.4); ctx.lineWidth = 1.6; line(ctx, 0, yb, w * 0.04, yb); }
      ctx.globalAlpha = 1;
    },
  });

  define('springStrings', {
    kind: 'line',
    meaning: 'Stacked tiers drawn as live strings. A value pulse drops through all of them; each tier rings as it passes, and the pointer pushes the strings like a hand.',
    opts: { labels: [], tiers: 6 },
    docs: { labels: 'Tier labels from the page, top to bottom (their number sets the tiers).', tiers: 'Number of tiers when there are no labels.' },
    still: 0.7,   // the pulse mid-fall, two tiers still ringing
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, NT = clamp(Array.isArray(o.labels) && o.labels.length ? o.labels.length : Math.round(o.tiers) || 6, 1, 12);
      if (s.w !== w || s.h !== h || !s.T || s.T.length !== NT) {
        s.w = w; s.h = h;
        const top = h * 0.14, bot = h * 0.86;
        s.lineX = w * 0.8; s.N = Math.ceil(w / 8) + 1; s.dx = w / (s.N - 1); s.bottom = bot;
        s.T = [];
        for (let i = 0; i < NT; i++) { const u = NT > 1 ? i / (NT - 1) : 0.5; s.T.push({ y: top + (bot - top) * (u * u * 0.38 + u * 0.62), d: new Float32Array(s.N), v: new Float32Array(s.N), A: 3 + (i % 3) * 2.2, f: 0.006 + i * 0.0011, ww: 0.5 + i * 0.13 }); }
        s.flash = new Float32Array(NT); s.prevY = -1;
        s.grad = ctx.createLinearGradient(-380, 0, 380, 0);
        s.grad.addColorStop(0, `rgba(${P.fgRgb},.26)`); s.grad.addColorStop(0.5, `rgba(${P.fgRgb},.9)`); s.grad.addColorStop(1, `rgba(${P.fgRgb},.26)`);
        s.pulseSpr = P.sPulse;
        if (!s.ptr) {
          s.ptr = { x: -999, y: -999, on: false };
          s.cv.addEventListener('pointermove', (e) => { const r = s.cv.getBoundingClientRect(); s.ptr.x = e.clientX - r.left; s.ptr.y = e.clientY - r.top; s.ptr.on = true; });
          s.cv.addEventListener('pointerleave', () => { s.ptr.on = false; });
        }
      }
      const T = s.T, N = s.N, dx = s.dx, lineX = s.lineX, fl = s.flash, ptr = s.ptr, dt = s.dt;
      const kick = (ti, x, amt) => { const tr = T[ti], c = Math.round(x / dx); for (let k = -6; k <= 6; k++) { const j = c + k; if (j > 0 && j < N - 1) tr.v[j] += amt * Math.exp(-(k * k) / 8); } };
      // value pulse
      const cyc = 3.1, tp = t % cyc, travel = 1.55; let py = -1;
      if (tp < travel && p > 0.5) { const u = tp / travel; py = (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)) * (s.bottom + 30); }
      if (py >= 0 && s.prevY >= 0) for (let i = 0; i < NT; i++) if (s.prevY < T[i].y && py >= T[i].y) { fl[i] = 1; kick(i, lineX, -520); }
      s.prevY = py;
      const sub = 2, hh = dt / sub;
      for (let st = 0; st < sub; st++) for (let i = 0; i < NT; i++) {
        const tr = T[i], d = tr.d, v = tr.v;
        for (let k = 1; k < N - 1; k++) {
          let a = (d[k - 1] + d[k + 1] - 2 * d[k]) * 1100 - d[k] * 3 - v[k] * 2.4;
          if (ptr.on) { const ddx = k * dx - ptr.x, ddy = tr.y + d[k] - ptr.y, dist = Math.hypot(ddx, ddy * 0.6); if (dist < 170) a += (ddy >= 0 ? 1 : -1) * Math.pow(1 - dist / 170, 1.7) * 5200; }
          v[k] += a * hh;
        }
        for (let k = 1; k < N - 1; k++) d[k] += v[k] * hh;
      }
      for (let i = 0; i < NT; i++) fl[i] *= Math.pow(0.12, dt);
      ctx.lineJoin = 'round';
      const fs = labelSize(w, h);
      for (let i = 0; i < NT; i++) {
        const tr = T[i], f = fl[i], ga = sm(p * 1.5 - i * 0.08);
        const gx = (((t * 0.11 + i * 0.19) % 1.3) - 0.15) * w;
        for (let pass = 0; pass < 3; pass++) {
          const off = pass === 0 ? 0 : pass === 1 ? 7 : -9, ph = pass * 1.7;
          ctx.save(); ctx.translate(gx, 0);
          if (pass === 0) { if (f > 0.05) { ctx.strokeStyle = P.fg; ctx.globalAlpha = (0.7 + 0.3 * f) * ga; } else { ctx.strokeStyle = s.grad; ctx.globalAlpha = ga; } ctx.lineWidth = 1 + f * 0.9; }
          else { ctx.strokeStyle = P.fg; ctx.globalAlpha = (0.16 + f * 0.14) * ga * P.k; ctx.lineWidth = 1; }
          ctx.beginPath();
          for (let k = 0; k < N; k++) {
            const x = k * dx, base = tr.A * Math.sin(x * tr.f * 3.1 - t * tr.ww + ph) + tr.A * 0.5 * Math.sin(x * tr.f * 7.3 + t * tr.ww * 1.7 + i + ph);
            const y = tr.y + off + base + tr.d[k] * (pass ? 0.8 : 1);
            k ? ctx.lineTo(x - gx, y) : ctx.moveTo(x - gx, y);
          }
          ctx.stroke(); ctx.restore();
        }
        // where the value line crosses the tier
        const ix = Math.round(lineX / dx), cy = tr.y + tr.d[ix] + tr.A * Math.sin(lineX * tr.f * 3.1 - t * tr.ww), q = 6 + f * 7;
        ctx.fillStyle = P.hi; ctx.globalAlpha = (0.55 + f * 0.45) * ga; ctx.fillRect(lineX - q / 2, cy - q / 2, q, q);
        if (f > 0.02) { ctx.strokeStyle = P.hi; ctx.globalAlpha = f * 0.7; ctx.lineWidth = 1; const r = 14 + (1 - f) * 90; ctx.strokeRect(lineX - r, cy - r * 0.18, r * 2, r * 0.36); }
        labelText(ctx, P, label(o.labels, i), w * 0.04, tr.y - 14, 'left', fs, 0.85 * ga, w * 0.7);
      }
      if (py >= 0) { ctx.globalAlpha = 1; ctx.drawImage(s.pulseSpr, lineX - 46, py - 46, 92, 92); }
      ctx.globalAlpha = 1;
    },
  });

  /* ---------------------------------------------- grid (Cantor8 24/7) ---------------------------------------------- */
  define('grid247', {
    kind: 'grid',
    meaning: 'Every hour of every day, lit: a 24 × 7 grid that is never dark. A sweep keeps passing through and lights the cells around it.',
    opts: { cols: 24, rows: 7, labels: [] },
    docs: { cols: 'Columns (hours).', rows: 'Rows (days).', labels: 'Optional: one label per row (left of the grid) or one per column (under it).' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, C = clamp(Math.round(o.cols) || 24, 2, 60), R = clamp(Math.round(o.rows) || 7, 1, 30);
      const L = Array.isArray(o.labels) ? o.labels : [], rowL = L.length === R, colL = !rowL && L.length === C;
      const fs = labelSize(w, h);
      if (s.w !== w || s.h !== h || s.C !== C || s.R !== R) {
        s.w = w; s.h = h; s.C = C; s.R = R; ctx.font = `500 ${fs}px ${FONT}`;
        s.lw = rowL ? Math.min(Math.round(w * 0.2), Math.ceil(Math.max(...L.map((x) => ctx.measureText(String(x)).width)))) + 14 : 0;
      }
      const pad = Math.round(w * 0.04), lw = s.lw + pad, lh = colL ? fs + 12 : 0;
      const gap = Math.max(4, (w - lw - pad) * 0.006), cw = (w - lw - pad - gap * (C - 1)) / C, ch = Math.min((h - lh - gap * (R - 1)) / R, cw);
      const gh = ch * R + gap * (R - 1), y0 = (h - lh - gh) / 2;
      const sweep = (t * 2.2) % (C + 6) - 3;
      ctx.fillStyle = P.fg;
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const k = c + r * 0.7, dd = Math.abs(k - sweep), tail = k < sweep ? Math.max(0, 1 - (sweep - k) / 6) : 0, near = Math.max(0, 1 - dd / 1.4);
        const tw = 0.5 + 0.5 * Math.sin(t * 0.9 + c * 1.3 + r * 2.1);
        ctx.globalAlpha = Math.min(1, 0.2 + 0.1 * tw + tail * 0.28 + near * 0.5) * sm(p * 1.6 - (c / C) * 0.6) * (P.light ? 0.9 : 1);
        ctx.fillRect(lw + c * (cw + gap), y0 + r * (ch + gap), cw, ch);
      }
      if (rowL) for (let r = 0; r < R; r++) labelText(ctx, P, String(L[r]), pad, y0 + r * (ch + gap) + ch / 2 + fs * 0.36, 'left', fs, 0.8 * sm(p * 2), s.lw - 14);
      if (colL) { const every = Math.max(1, Math.ceil((fs * 2.6) / (cw + gap))); for (let c = 0; c < C; c += every) labelText(ctx, P, String(L[c]), lw + c * (cw + gap) + cw / 2, y0 + gh + fs + 8, 'center', fs, 0.8 * sm(p * 2)); }
      ctx.globalAlpha = 1;
    },
  });

  /* ---------------------------------------------- dots (Save) ---------------------------------------------- */
  const spread01 = (n) => { if (n <= 1) return [0.5]; const A = Math.min(0.36, 0.09 * n), out = []; for (let i = 0; i < n; i++) out.push(0.5 - A + 2 * A * i / (n - 1)); return out; };

  define('dotFlow', {
    kind: 'dots',
    meaning: 'Glowing value flows in from several sources to one hub and out again to what it is used for.',
    opts: { ins: 2, hub: '', outs: 4, particles: 30, beam: true },
    docs: { ins: 'Sources: a number, or labels. Odd and even sources glow in two colours.', hub: 'Label inside the hub (it shrinks to fit). Without one, the hub shows a glowing core.', outs: 'Uses: a number, or labels.', particles: 'Dots in flight at once.', beam: 'The thin light column behind the hub.' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, ni = count(o.ins, 2), no = count(o.outs, 4);
      const hs = Math.min(w, h) * 0.15, cx = w / 2, cy = h / 2;
      if (s.w !== w || s.h !== h || s.d !== s.dpr) {
        s.w = w; s.h = h; s.d = s.dpr;
        const curve = (a0, a1, b0, b1) => { const dx = Math.abs(b0 - a0); return Float32Array.of(a0, a1, a0 + dx * 0.5, a1, b0 - dx * 0.5, b1, b0, b1); };
        s.src = spread01(ni).map((f) => [w * 0.1, h * f]); s.dst = spread01(no).map((f) => [w * 0.9, h * f]);
        s.cin = s.src.map((q, i) => curve(q[0], q[1], cx - hs, cy + hs * 0.8 * (ni > 1 ? i / (ni - 1) - 0.5 : 0)));
        s.cout = s.dst.map((q, i) => curve(cx + hs, cy + (i - (no - 1) / 2) * hs * 0.3, q[0], q[1]));
        s.lanes = new Path2D();
        s.cin.concat(s.cout).forEach((c) => { s.lanes.moveTo(c[0], c[1]); s.lanes.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]); });
        // the hub, with its 50px glow, drawn once into a sprite (a shadow blur every frame is the costly part)
        const pad = 64, d = s.dpr, hc = s.hub || (s.hub = document.createElement('canvas')), hx = hc.getContext('2d'), sz = hs * 2 + pad * 2;
        hc.width = Math.ceil(sz * d); hc.height = Math.ceil(sz * d); hx.setTransform(d, 0, 0, d, 0, 0);
        const hg = hx.createLinearGradient(pad, pad, pad + hs * 2, pad + hs * 2); hg.addColorStop(0, '#2F62F5'); hg.addColorStop(1, '#0F2FA8');
        hx.save(); hx.shadowColor = P.light ? 'rgba(22,71,219,.45)' : 'rgba(60,120,255,.8)'; hx.shadowBlur = 50 * d; hx.fillStyle = hg; rrect(hx, pad, pad, hs * 2, hs * 2, hs * 0.3); hx.fill(); hx.restore();
        hx.strokeStyle = 'rgba(255,255,255,.4)'; hx.lineWidth = 1.5; rrect(hx, pad, pad, hs * 2, hs * 2, hs * 0.3); hx.stroke();
        if (o.hub) {
          let f = Math.max(13, hs * 0.26); hx.font = `600 ${f}px ${FONT}`; const mw = hx.measureText(String(o.hub)).width; if (mw > hs * 1.7) f *= (hs * 1.7) / mw;
          hx.font = `600 ${Math.max(10, f)}px ${FONT}`; hx.fillStyle = '#fff'; hx.textAlign = 'center'; hx.textBaseline = 'middle'; hx.fillText(String(o.hub), pad + hs, pad + hs, hs * 1.8);
        }
        s.hubPad = pad;
        s.fs = labelSize(w, h);
      }
      const g = sm(p * 1.4), sc = 0.9 + 0.1 * g;
      if (o.beam) beam(ctx, P, cx, 0, h, 3, 6, t, 0.55 * g, s.dpr);
      ctx.lineWidth = 1.5; ctx.strokeStyle = P.lane; ctx.globalAlpha = g; ctx.stroke(s.lanes);
      // the hub
      const hr = (hs + s.hubPad) * sc;
      ctx.globalAlpha = g; ctx.drawImage(s.hub, cx - hr, cy - hr, hr * 2, hr * 2);
      if (!o.hub) { ctx.globalCompositeOperation = 'lighter'; dot(ctx, P.sWhite, cx, cy, hs * 0.11 * (1 + 0.08 * Math.sin(t * 3))); ctx.globalCompositeOperation = 'source-over'; }
      // the dots: half the trip in, half the trip out
      const N = Math.max(4, Math.round(o.particles) || 30), sA = P.sCy, sB = P.sWh;
      ctx.globalAlpha = sm(p * 1.5);
      for (let i = 0; i < N; i++) {
        const ph = (t * 0.18 + i / N) % 1, si = i % ni, di = (i * 3 + (i >> 2)) % no;
        const q = ph < 0.5 ? bez(s.cin[si], ph / 0.5) : bez(s.cout[di], (ph - 0.5) / 0.5);
        dot(ctx, si % 2 ? sB : sA, q.x, q.y, 3);
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < ni; i++) labelText(ctx, P, label(o.ins, i), s.src[i][0] - 6, s.src[i][1] - 22, 'left', s.fs, 0.85 * g, cx - hs - s.src[i][0]);
      for (let i = 0; i < no; i++) labelText(ctx, P, label(o.outs, i), s.dst[i][0] + 6, s.dst[i][1] - 22, 'right', s.fs, 0.85 * g, s.dst[i][0] - cx - hs);
    },
  });

  define('dotRings', {
    kind: 'dots',
    meaning: 'Orbits of glowing dots around one core, with waves rolling outward: stakes that keep growing, funnelled into a single beam of value.',
    opts: { rings: 6, beam: true },
    docs: { rings: 'Number of dot orbits.', beam: 'The light column from the core to the bottom edge.' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, cx = w / 2, cy = h / 2, R0 = Math.min(w, h) * 0.46, g = sm(p * 1.4), R = R0 * (0.6 + 0.4 * sm(p * 1.3)), nr = clamp(Math.round(o.rings) || 6, 2, 9);
      if (o.beam) beam(ctx, P, cx, cy, h, R0 * 0.1, R0 * 0.42, t, 0.75 * g, s.dpr);
      ctx.strokeStyle = P.cyS; ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) { const u = (t * 0.28 + k / 4) % 1; ctx.globalAlpha = (1 - u) * 0.5 * g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.15 + u * R * 0.9, 0, TAU); ctx.stroke(); }
      const sW = P.sWh, sB = P.sBl, step = 0.84 / nr;
      for (let q = 0; q < nr; q++) {
        const r = R * (0.28 + q * step);
        ctx.strokeStyle = P.ringS; ctx.globalAlpha = 0.22 * g; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
        const n = 7 + q * 5, sp = (q % 2 ? -1 : 1) * (0.12 + 0.05 * (6 - q));
        ctx.globalAlpha = g;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + t * sp + q, sz = 2.2 + 2.2 * (0.5 + 0.5 * Math.sin(t * 1.6 + i * 1.7 + q));
          dot(ctx, q % 3 === 0 ? sW : sB, cx + Math.cos(a) * r, cy + Math.sin(a) * r, sz);
        }
      }
      const cr = R * 0.22 * (1 + 0.06 * Math.sin(t * 3));
      ctx.globalAlpha = g;
      ctx.drawImage(P.sCore, cx - cr, cy - cr, cr * 2, cr * 2);
      ctx.globalAlpha = 1;
    },
  });

  // Save's settlement globe: a Fibonacci sphere of points, nodes and settlement arcs, precomputed once
  const GLOBE = (() => {
    const N = 3400, pts = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), a = i * 2.399963; pts[i * 3] = Math.cos(a) * r; pts[i * 3 + 1] = y; pts[i * 3 + 2] = Math.sin(a) * r; }
    const M = 18, nodes = new Float32Array(M * 3);
    for (let i = 0; i < M; i++) { const lat = Math.asin(Math.sin(i * 2.17) * 0.8), lon = i * 2.6; nodes[i * 3] = Math.cos(lat) * Math.cos(lon); nodes[i * 3 + 1] = Math.sin(lat); nodes[i * 3 + 2] = Math.cos(lat) * Math.sin(lon); }
    const arcs = [];
    for (let i = 0; i < M; i++) {
      const j = (i * 5 + 3) % M; if (i === j) continue;
      const a = [nodes[i * 3], nodes[i * 3 + 1], nodes[i * 3 + 2]], b = [nodes[j * 3], nodes[j * 3 + 1], nodes[j * 3 + 2]];
      const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), om = Math.acos(d), so = Math.sin(om) || 1, arc = new Float32Array(25 * 3);
      for (let k = 0; k <= 24; k++) { const u = k / 24, k1 = Math.sin((1 - u) * om) / so, k2 = Math.sin(u * om) / so, lift = 1 + Math.sin(u * Math.PI) * 0.09 * om; for (let c = 0; c < 3; c++) arc[k * 3 + c] = (a[c] * k1 + b[c] * k2) * lift; }
      arcs.push({ i, arc });
    }
    return { N, pts, M, nodes, arcs };
  })();

  define('dotGlobe', {
    kind: 'dots',
    meaning: 'A solid globe of points turning slowly, with settlement arcs between markets and value travelling along them.',
    opts: { arcs: 17, beam: true },
    docs: { arcs: 'Number of settlement arcs shown (up to 17).', beam: 'The light column under the globe.' },
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, cx = w / 2, cy = h / 2, R0 = Math.min(w, h) * 0.38, g = sm(p * 1.4), R = R0 * (0.85 + 0.15 * sm(p * 1.2));
      if (!s.px) {
        s.px = new Float32Array(GLOBE.N); s.py = new Float32Array(GLOBE.N); s.bk = new Uint8Array(GLOBE.N); s.cnt = new Int32Array(10); s.ord = new Uint16Array(GLOBE.N); s.st = new Int32Array(10);
        s.ap = new Float32Array(25 * 3);
        s.cols = [];
        for (let b = 0; b < 9; b++) { const z = (b + 0.5) / 9; s.cols.push(P.light ? `rgba(${110 - z * 100 | 0},${140 - z * 100 | 0},${230 - z * 60 | 0},${0.25 + 0.6 * z})` : `rgba(${120 + z * 100 | 0},${170 + z * 70 | 0},255,${0.25 + 0.6 * z})`); }
        s.cols.push('rgba(60,100,230,.08)');
      }
      if (s.w !== w || s.h !== h) { s.w = w; s.h = h; s.halo = ctx.createRadialGradient(cx, cy, R0 * 0.6, cx, cy, R0 * 1.35); s.halo.addColorStop(0, P.light ? 'rgba(22,71,219,.1)' : 'rgba(22,71,219,.42)'); s.halo.addColorStop(1, 'rgba(22,71,219,0)'); }
      const ay = t * 0.08, ax = 0.38, c1 = Math.cos(ay), s1 = Math.sin(ay), c2 = Math.cos(ax), s2 = Math.sin(ax);
      ctx.globalAlpha = g; ctx.fillStyle = s.halo; ctx.fillRect(0, 0, w, h);
      if (o.beam) beam(ctx, P, cx, cy, h, R0 * 0.05, R0 * 0.14, t, 0.6 * g, s.dpr);
      // points, sorted into ten colour buckets so each bucket is one fill
      const pts = GLOBE.pts, N = GLOBE.N, px = s.px, py = s.py, bk = s.bk, cnt = s.cnt, ord = s.ord, st = s.st;
      cnt.fill(0);
      for (let i = 0; i < N; i++) {
        const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
        const X = x * c1 + z * s1, Z = -x * s1 + z * c1, Y2 = y * c2 - Z * s2, Z2 = y * s2 + Z * c2;
        px[i] = cx + X * R; py[i] = cy - Y2 * R;
        const b = Z2 > 0 ? Math.min(8, (Z2 * 9) | 0) : 9; bk[i] = b; cnt[b]++;
      }
      st[0] = 0; for (let b = 1; b < 10; b++) st[b] = st[b - 1] + cnt[b - 1];
      for (let i = 0; i < N; i++) ord[st[bk[i]]++] = i;
      let k = 0;
      for (let b = 0; b < 10; b++) {
        ctx.fillStyle = s.cols[b]; ctx.beginPath();
        for (let e = k + cnt[b]; k < e; k++) { const i = ord[k]; ctx.rect(px[i], py[i], 2.2, 2.2); }
        ctx.fill();
      }
      // arcs and the value moving on them
      const ap = s.ap, sW = P.sWh, sC = P.sCy, na = clamp(Math.round(o.arcs) || 17, 0, GLOBE.arcs.length);
      ctx.lineWidth = 1.4;
      for (let a = 0; a < na; a++) {
        const A = GLOBE.arcs[a].arc, ii = GLOBE.arcs[a].i;
        ctx.beginPath();
        for (let q = 0; q <= 24; q++) {
          const x = A[q * 3], y = A[q * 3 + 1], z = A[q * 3 + 2], X = x * c1 + z * s1, Z = -x * s1 + z * c1;
          ap[q * 3] = cx + X * R; ap[q * 3 + 1] = cy - (y * c2 - Z * s2) * R; ap[q * 3 + 2] = y * s2 + Z * c2;
          q ? ctx.lineTo(ap[q * 3], ap[q * 3 + 1]) : ctx.moveTo(ap[q * 3], ap[q * 3 + 1]);
        }
        ctx.strokeStyle = P.cyS; ctx.globalAlpha = (ap[12 * 3 + 2] > -0.2 ? 0.55 : 0.12) * g; ctx.stroke();
        const u = (t * 0.2 + ii * 0.137) % 1, q = Math.floor(u * 24);
        if (ap[q * 3 + 2] > -0.2) { ctx.globalAlpha = g; dot(ctx, sW, ap[q * 3], ap[q * 3 + 1], 2.6); }
      }
      const nd = GLOBE.nodes; ctx.globalAlpha = g;
      for (let i = 0; i < GLOBE.M; i++) {
        const x = nd[i * 3], y = nd[i * 3 + 1], z = nd[i * 3 + 2], X = x * c1 + z * s1, Z = -x * s1 + z * c1, Z2 = y * s2 + Z * c2;
        if (Z2 > -0.1) dot(ctx, sC, cx + X * R, cy - (y * c2 - Z * s2) * R, 3);
      }
      ctx.globalAlpha = 1;
    },
  });

  define('dotRibbon', {
    kind: 'dots',
    meaning: 'A flowing ribbon made of thousands of dots, rippling and turning slowly in space: finance gone digital.',
    opts: { grid: 230 },
    docs: { grid: 'Most dots per side of the sheet (grid × grid). The scene uses fewer on small canvases, so the dots stay about 2.5px apart as in the original.' },
    draw(ctx, w, h, t, p, o, s) {
      // Save's plane shader on the CPU: y = .28 sin(1.3x + .8t) + .22 sin(1.7z - 1.1t), rotY(.18t) · rotX(.32), camera at z 15, fov 42.
      // Dots are splatted into a float buffer so overlaps add up (the bright folds), then drawn once with 'lighter' (or over, on paper).
      const P = s.pal, f = Math.min(h * 1.3, w * 1.2), sheet = 7.4 * f / 15;
      const G = clamp(Math.round(sheet / 2.5), 60, clamp(Math.round(o.grid) || 230, 60, 300)), NN = G * G;
      if (s.G !== G) { s.G = G; s.hs = new Float32Array(NN); for (let i = 0; i < NN; i++) s.hs[i] = ahash(i, 7, 3); s.sa = new Float32Array(G); s.sb = new Float32Array(G); }
      if (s.bw !== w || s.bh !== h) {
        s.bw = w; s.bh = h; s.acc = new Float32Array(w * h * 4);
        s.off = s.off || document.createElement('canvas'); s.off.width = w; s.off.height = h; s.octx = s.off.getContext('2d'); s.img = s.octx.createImageData(w, h);
        s.bb = [0, 0, w, h]; s.nb = [0, 0, 0, 0];
      }
      const acc = s.acc, hsh = s.hs, sa = s.sa, sb = s.sb, ob = s.bb, nb = s.nb, L = P.light;
      for (let y = ob[1]; y < ob[3]; y++) acc.fill(0, (y * w + ob[0]) * 4, (y * w + ob[2]) * 4);   // clear last frame's box only
      const cx = w / 2, cy = h / 2, ptK = Math.min(1, h / 900 + 0.3);
      const ay = t * 0.18, cY = Math.cos(ay), sY = Math.sin(ay), cX = Math.cos(0.32), sX = Math.sin(0.32);
      for (let i = 0; i < G; i++) { const q = ((i + 0.5) / G - 0.5) * 7.4; sa[i] = 0.28 * Math.sin(q * 1.3 + t * 0.8); sb[i] = 0.22 * Math.sin(q * 1.7 - t * 1.1); }
      const reveal = s.still ? 2 : p * 1.6, dens = Math.max(1, (sheet / G / 2.5) ** 2);   // a coarser grid than the original's: each dot carries more light
      let x0 = w, y0 = h, x1 = 0, y1 = 0;
      for (let i = 0; i < G; i++) {
        const X0 = ((i + 0.5) / G - 0.5) * 7.4, gate = reveal - ((i + 0.5) / G) * 0.6;
        if (gate <= 0) continue;
        const gs = gate < 1 ? sm(gate) : 2;
        for (let j = 0; j < G; j++) {
          const id = i * G + j, hv = hsh[id]; if (hv > gs) continue;
          const Z0 = ((j + 0.5) / G - 0.5) * 7.4, Y0 = sa[i] + sb[j];
          const yy = cX * Y0 - sX * Z0, z1 = sX * Y0 + cX * Z0, xx = cY * X0 + sY * z1, zz = -sY * X0 + cY * z1;
          const dz = 15 - zz, k = f / dz, px = cx + xx * k - 0.5, py = cy - yy * k - 0.5;
          const ix = px | 0, iy = py | 0; if (ix < 0 || iy < 0 || ix >= w - 1 || iy >= h - 1) continue;
          const vK = clamp(yy * 0.2 + 0.5), vD = clamp(0.5 + dz * 0.02), m = vK * vK, br = 0.65 + 0.8 * vD;
          const sz = (1.6 + 1.4 * hv) * (14 / dz) * ptK, wt = (0.35 + 0.5 * vD) * sz * sz * 0.3 * dens;   // the disc's alpha mass: smoothstep(.5, .1, d) over the point
          let r, g, b;
          if (L) { r = 0.09 + 0.03 * m; g = 0.2 + 0.12 * m; b = 0.75 + 0.1 * m; }
          else { r = (0.09 + 0.46 * m) * br; g = (0.28 + 0.64 * m) * br; b = (0.86 + 0.14 * m) * br; }
          const fx = px - ix, fy = py - iy, w00 = (1 - fx) * (1 - fy) * wt, w10 = fx * (1 - fy) * wt, w01 = (1 - fx) * fy * wt, w11 = fx * fy * wt;
          let o2 = (iy * w + ix) * 4;
          acc[o2] += r * w00; acc[o2 + 1] += g * w00; acc[o2 + 2] += b * w00; acc[o2 + 3] += w00; o2 += 4;
          acc[o2] += r * w10; acc[o2 + 1] += g * w10; acc[o2 + 2] += b * w10; acc[o2 + 3] += w10; o2 += w * 4 - 4;
          acc[o2] += r * w01; acc[o2 + 1] += g * w01; acc[o2 + 2] += b * w01; acc[o2 + 3] += w01; o2 += 4;
          acc[o2] += r * w11; acc[o2 + 1] += g * w11; acc[o2 + 2] += b * w11; acc[o2 + 3] += w11;
          if (ix < x0) x0 = ix; if (iy < y0) y0 = iy; if (ix + 2 > x1) x1 = ix + 2; if (iy + 2 > y1) y1 = iy + 2;
        }
      }
      nb[0] = x0; nb[1] = y0; nb[2] = Math.max(x0, x1); nb[3] = Math.max(y0, y1);
      // the region to write: this frame's box and last frame's (so last frame's dots are cleared from the image too)
      const rx0 = Math.min(ob[0], nb[0]), ry0 = Math.min(ob[1], nb[1]), rx1 = Math.max(ob[2], nb[2]), ry1 = Math.max(ob[3], nb[3]);
      const D = s.img.data;
      for (let y = ry0; y < ry1; y++) for (let x = rx0; x < rx1; x++) {
        const q = (y * w + x) * 4, R = acc[q], Gc = acc[q + 1], B = acc[q + 2], W = acc[q + 3];
        if (W <= 0.002) { D[q + 3] = 0; continue; }
        if (L) { const a = Math.min(1, W * 0.8); D[q] = (R / W) * 255; D[q + 1] = (Gc / W) * 255; D[q + 2] = (B / W) * 255; D[q + 3] = a * 255; }
        else { const mx = R > Gc ? (R > B ? R : B) : (Gc > B ? Gc : B), a = mx > 1 ? 1 : mx; D[q] = (R / a) * 255; D[q + 1] = (Gc / a) * 255; D[q + 2] = (B / a) * 255; D[q + 3] = a * 255; }
      }
      if (rx1 > rx0 && ry1 > ry0) s.octx.putImageData(s.img, 0, 0, rx0, ry0, rx1 - rx0, ry1 - ry0);
      ob[0] = nb[0]; ob[1] = nb[1]; ob[2] = nb[2]; ob[3] = nb[3];
      const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = L ? 'source-over' : 'lighter';
      ctx.drawImage(s.off, 0, 0, w, h);
      ctx.globalCompositeOperation = op;
    },
  });

  /* ------------------------------------- caasPlatform (Crypto-as-a-Service) ------------------------------------- */
  // One machine in a fixed axonometric view: world x runs with the flow, y is depth, z is height (one unit is L.k px).
  // Three tiers: the regulated base (a slab), BitGo (the policy plate, the custody vault, the insurance dome) and, on top,
  // the business's own platform (two onboarding gates, a white-label front end, three offerings). Users are the dots.
  const CX = Math.cos(0.21), CY = Math.sin(0.21), DX = Math.cos(0.68) * 0.8, DY = Math.sin(0.68) * 0.8;
  function isoP(L, x, y, z) { XY.x = L.ox + (x * CX + y * DX) * L.k; XY.y = L.oy + (x * CY - y * DY - z) * L.k; return XY; }
  const isoXY = (L, x, y, z) => { isoP(L, x, y, z); return [XY.x, XY.y]; };
  const flatM = (L, z) => [CX * L.k, CY * L.k, DX * L.k, -DY * L.k, L.ox, L.oy - z * L.k];                    // plane z: (x, y) to px
  const wallM = (L, x) => [DX * L.k, -DY * L.k, 0, -L.k, L.ox + x * CX * L.k, L.oy + x * CY * L.k];           // plane x: (y, z) to px
  function inPlane(m, fn, into) { const a = new Path2D(); fn(a); const b = into || new Path2D(); b.addPath(a, new DOMMatrix(m)); return b; }
  function rr2(p, x, y, w, h, r) { p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); }
  function poly(pts, p = new Path2D()) { pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); return p; }
  function rng(s) { s.rs = (Math.imul(s.rs, 1664525) + 1013904223) >>> 0; return s.rs / 4294967296; }
  const CA = { VIN: 0.42, VLN: 0.55, VST: 0.5, PAD: [0.85, 2.8, 0.7], N: 72, DIM: 0.2 };

  function caasLayout(ctx, s, w, h, o, fs) {
    const a = w / h, Lx = clamp(1.75 + 1.2 * a, 2.9, 4.9), Ly = 1.25, dz = clamp(1.02 - 0.12 * (a - 1), 0.82, 1.02), ym = Ly / 2;
    const L = s.L = { k: 1, ox: 0, oy: 0, Lx, Ly, Zt: dz * 2, Zm: dz, T: 0.12, m: 0.12, xK: 0.11 * Lx, xR: 0.27 * Lx, xD: 0.5 * Lx, xP: 0.82 * Lx,
      hs: 0.165, gy0: 0.3 * Ly, gy1: 0.7 * Ly, hg: 0.48, dy0: 0.25 * Ly, dy1: 0.75 * Ly, hd: 0.9, py: [0.84 * Ly, 0.5 * Ly, 0.16 * Ly], rI: 0.42, xA: Lx + 0.62, fs };
    // fit: the whole stack, with room for the labels the page passed (offerings on the right, policy and base on the left)
    ctx.font = font(fs);
    const tw = (v) => (v ? ctx.measureText(String(v)).width : 0);
    const wOff = [0, 1, 2].map((i) => tw(label(o.offers, i))), wPol = tw(label(o.guards, 0)), wBase = tw(o.base);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const box = (x, y, z) => { const X = x * CX + y * DX, Y = x * CY - y * DY - z; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; };
    for (const z of [L.Zt, L.Zm]) { box(0, 0, z); box(Lx, 0, z); box(Lx, Ly, z); box(0, Ly, z); }
    box(-L.m, -L.m, -L.T); box(Lx + L.m, -L.m, -L.T); box(Lx + L.m, Ly + L.m, -L.T); box(-L.m, Ly + L.m, 0);
    box(L.xD, L.dy0, L.Zt + L.hd); box(L.xD, L.dy1, L.Zt + L.hd); box(L.xA + 0.12, L.py[2], L.Zm);
    const padT = fs * (o.app ? 3 : 1.6) + 14, padB = 8; let padL = Math.max(8, w * 0.04), padR = Math.max(8, w * 0.03);
    for (let it = 0; it < 6; it++) {
      const aw = w - padL - padR, ah = h - padT - padB, k = Math.max(8, Math.min(aw / (x1 - x0), ah / (y1 - y0)));
      L.k = k; L.ox = padL - x0 * k + (aw - (x1 - x0) * k) / 2; L.oy = padT - y0 * k + (ah - (y1 - y0) * k) / 2;
      let oR = 0, oL = 0;
      const colX = Math.max(isoP(L, L.xP + L.hs, L.py[0] + L.hs, L.Zt).x, isoP(L, L.xP + L.hs, L.py[2] + L.hs, L.Zt).x) + 14;
      for (let i = 0; i < 3; i++) if (wOff[i]) oR = Math.max(oR, colX + wOff[i] - (w - 6));
      if (wPol) oL = Math.max(oL, 6 - (isoP(L, 0, 0, L.Zm).x - 12 - wPol));
      if (wBase) oL = Math.max(oL, 6 - (isoP(L, -L.m, -L.m, 0).x - 12 - wBase));
      if (oR < 0.5 && oL < 0.5) break;
      padR += Math.max(0, oR); padL += Math.max(0, oL);
    }
    const k = L.k, Zt = L.Zt, Zm = L.Zm, m = L.m, T = L.T, c = (x, y, z) => isoXY(L, x, y, z);
    const fT = L.fT = flatM(L, Zt), fM = L.fM = flatM(L, Zm), f0 = L.f0 = flatM(L, 0);
    L.dr = clamp(k / 46, 1.7, 3.1);
    // the regulated base: a slab with a fine grid
    const A0 = c(-m, -m, 0), B0 = c(Lx + m, -m, 0), C0 = c(Lx + m, Ly + m, 0), D0 = c(-m, Ly + m, 0), A1 = c(-m, -m, -T), B1 = c(Lx + m, -m, -T), C1 = c(Lx + m, Ly + m, -T);
    s.slabTop = poly([A0, B0, C0, D0]); s.slabFront = poly([A0, B0, B1, A1]); s.slabSide = poly([B0, C0, C1, B1]);
    s.slabEdge = new Path2D(); [s.slabTop, s.slabFront, s.slabSide].forEach((q) => s.slabEdge.addPath(q));
    L.gnx = Math.max(4, Math.round((Lx + 2 * m) / 0.3)); L.gny = Math.max(2, Math.round((Ly + 2 * m) / 0.3)); L.gs = (Lx + 2 * m) / L.gnx; L.gy = (Ly + 2 * m) / L.gny;
    s.slabGrid = inPlane(f0, (p) => { for (let i = 1; i < L.gnx; i++) { p.moveTo(-m + i * L.gs, -m); p.lineTo(-m + i * L.gs, Ly + m); } for (let j = 1; j < L.gny; j++) { p.moveTo(-m, -m + j * L.gy); p.lineTo(Lx + m, -m + j * L.gy); } });
    // two glass plates: BitGo, and the business's platform on top
    const plate = (z, th) => { const q = [c(0, 0, z), c(Lx, 0, z), c(Lx, Ly, z), c(0, Ly, z)], a2 = c(0, 0, z - th), b2 = c(Lx, 0, z - th), c2 = c(Lx, Ly, z - th), p = poly(q);
      p.moveTo(q[0][0], q[0][1]); p.lineTo(a2[0], a2[1]); p.lineTo(b2[0], b2[1]); p.lineTo(c2[0], c2[1]); p.lineTo(q[2][0], q[2][1]); p.moveTo(q[1][0], q[1][1]); p.lineTo(b2[0], b2[1]);
      return [poly(q), p]; };
    [s.faceM, s.plM] = plate(Zm, 0.05); [s.faceT, s.plT] = plate(Zt, 0.05);
    s.posts = new Path2D();
    for (const [x, y] of [[0, 0], [Lx, 0], [Lx, Ly], [0, Ly]]) { const a1 = c(x, y, Zt - 0.05), b1 = c(x, y, Zm), b2 = c(x, y, Zm - 0.05), d1 = c(x, y, 0); s.posts.moveTo(a1[0], a1[1]); s.posts.lineTo(b1[0], b1[1]); s.posts.moveTo(b2[0], b2[1]); s.posts.lineTo(d1[0], d1[1]); }
    // BitGo: the policy plate's rule grid, a checkpoint under each offering, settlement lanes into the vault, the way out
    const vx = L.xD, vy = ym, rI = L.rI;
    s.rules = new Path2D();
    for (let x = 0.12; x < Lx - 0.05; x += 0.2) for (let y = 0.12; y < Ly - 0.05; y += 0.2) { if (Math.hypot(x - vx, y - vy) < rI + 0.08) continue; const q = isoP(L, x, y, Zm); s.rules.rect(q.x - 0.8, q.y - 0.8, 1.6, 1.6); }
    s.ckS = L.py.map((y) => inPlane(fM, (p) => p.rect(L.xP - 0.1, y - 0.1, 0.2, 0.2)));
    s.ckX = L.py.map((y) => inPlane(fM, (p) => { p.moveTo(L.xP - 0.07, y - 0.07); p.lineTo(L.xP + 0.07, y + 0.07); p.moveTo(L.xP - 0.07, y + 0.07); p.lineTo(L.xP + 0.07, y - 0.07); }));
    s.stP = [0, 1].map((i) => isoPath(L, [[L.xP, L.py[i], Zm], [vx + rI + 0.22, L.py[i], Zm], [vx, vy, Zm]]));
    s.stP.push(isoPath(L, [[L.xP, L.py[2], Zm], [Lx, L.py[2], Zm], [L.xA - 0.075, L.py[2], Zm]]));
    L.stU = s.stP.map((q) => q.L / k);
    s.lanesM = new Path2D(); s.lanesM.addPath(s.stP[0].p2); s.lanesM.addPath(s.stP[1].p2);
    const e0 = c(L.xP + 0.1, L.py[2], Zm), e1 = c(Lx, L.py[2], Zm), e2 = c(L.xA - 0.075, L.py[2], Zm);
    s.lanesM.moveTo(e0[0], e0[1]); s.lanesM.lineTo(e1[0], e1[1]); s.exitP = new Path2D(); s.exitP.moveTo(e1[0], e1[1]); s.exitP.lineTo(e2[0], e2[1]);
    s.addr = inPlane(fM, (p) => { p.moveTo(L.xA + 0.075, L.py[2]); p.arc(L.xA, L.py[2], 0.075, 0, TAU); });
    s.drops = new Path2D(); L.py.forEach((y) => { const a1 = c(L.xP, y, Zt), b1 = c(L.xP, y, Zm + 0.1); s.drops.moveTo(a1[0], a1[1]); s.drops.lineTo(b1[0], b1[1]); });
    // the insurance dome over the vault: its true outline (the sphere's silhouette above the base, closed along the
    // front of the base ring), the base ring and one latitude
    s.dome = inPlane(fM, (p) => { p.moveTo(vx + rI, vy); p.arc(vx, vy, rI, 0, TAU); });
    const lat = Math.PI / 4; inPlane(flatM(L, Zm + rI * Math.sin(lat)), (p) => { const r = rI * Math.cos(lat); p.moveTo(vx + r, vy); p.arc(vx, vy, r, 0, TAU); }, s.dome);
    { const sa = Math.hypot(CX, DX), sb = (CX * CY - DX * DY) / sa, sc = Math.sqrt(CY * CY + DY * DY + 1 - sb * sb), C = c(vx, vy, Zm), R = rI * k, f0e = Math.atan2(DX, CX);
      s.domeO = new Path2D();
      for (let j = 0; j <= 32; j++) { const th = Math.PI + (j / 32) * Math.PI, x = C[0] + R * sa * Math.cos(th), y = C[1] + R * (sb * Math.cos(th) + sc * Math.sin(th)); j ? s.domeO.lineTo(x, y) : s.domeO.moveTo(x, y); }
      for (let j = 1; j <= 24; j++) { const ph = f0e - (j / 24) * Math.PI, q = isoP(L, vx + rI * Math.cos(ph), vy + rI * Math.sin(ph), Zm); s.domeO.lineTo(q.x, q.y); }
      s.domeO.closePath(); }
    // the business's platform: users arrive from the left edge, pass two gates, enter the front end, fan out to three pads
    s.inP = [0.12, 0.5, 0.88].map((f) => { const ye = f * Ly, xs = Math.min(-0.6, ((-12 - L.ox) / k - ye * DX) / CX); return isoPath(L, [[xs, ye, Zt], [-0.32, ye, Zt], [0.12, ym, Zt], [L.xD, ym, Zt]]); });
    L.rIn = s.inP.map((q) => q.L / k);
    s.lanesIn = new Path2D(); s.inP.forEach((q) => s.lanesIn.addPath(q.p2));
    const gate = (x) => inPlane(wallM(L, x), (p) => { p.moveTo(L.gy0, Zt); p.lineTo(L.gy0, Zt + L.hg); p.lineTo(L.gy1, Zt + L.hg); p.lineTo(L.gy1, Zt); });
    s.gK = gate(L.xK); s.gR0 = gate(L.xR - 0.05); s.gR1 = gate(L.xR + 0.05);
    for (const y of [L.gy0, L.gy1]) { const a1 = c(L.xR - 0.05, y, Zt + L.hg), b1 = c(L.xR + 0.05, y, Zt + L.hg); s.gR0.moveTo(a1[0], a1[1]); s.gR0.lineTo(b1[0], b1[1]); }
    const wD = wallM(L, L.xD), dv0 = Zt + 0.1, dv1 = Zt + L.hd, du0 = L.dy0, du1 = L.dy1;
    s.devF = inPlane(wD, (p) => rr2(p, du0, dv0, du1 - du0, dv1 - dv0, 0.06));
    s.devUI = inPlane(wD, (p) => {
      p.moveTo(du0 + 0.16, dv1 - 0.1); p.lineTo(du1 - 0.07, dv1 - 0.1);
      p.moveTo(du0 + 0.1, Zt); p.lineTo(du0 + 0.1, dv0); p.moveTo(du1 - 0.1, Zt); p.lineTo(du1 - 0.1, dv0);
      for (let i = 0; i < 3; i++) { const v = dv1 - 0.25 - i * 0.15; p.moveTo(du0 + 0.15, v); p.lineTo(du0 + 0.15 + 0.2 - i * 0.04, v); }
    });
    s.devLogo = inPlane(wD, (p) => { p.moveTo(du0 + 0.135, dv1 - 0.1); p.arc(du0 + 0.1, dv1 - 0.1, 0.035, 0, TAU); });   // an empty mark: the business's brand, not BitGo's
    s.devRow = [0, 1, 2].map((i) => { const v = dv1 - 0.25 - i * 0.15; return inPlane(wD, (p) => rr2(p, du0 + 0.06, v - 0.05, du1 - du0 - 0.12, 0.1, 0.03)); });
    s.lnP = L.py.map((y) => isoPath(L, [[L.xD + 0.02, ym, Zt], [L.xD + 0.28, ym, Zt], [L.xP - L.hs - 0.12, y, Zt], [L.xP - L.hs, y, Zt]]));
    L.lnU = s.lnP.map((q) => q.L / k);
    s.lanesT = new Path2D(); s.lnP.forEach((q) => s.lanesT.addPath(q.p2));
    s.pads = new Path2D(); L.py.forEach((y) => inPlane(fT, (p) => p.rect(L.xP - L.hs, y - L.hs, 2 * L.hs, 2 * L.hs), s.pads));
    const q8 = L.hs * 0.8;
    s.padTr = inPlane(fT, (p) => { const x = L.xP, y = L.py[0]; p.moveTo(x - q8, y - q8); p.lineTo(x + q8, y + q8); p.moveTo(x + q8, y - q8); p.lineTo(x - q8, y + q8); });
    s.padSt = inPlane(fT, (p) => { const x = L.xP, y = L.py[1], r = L.hs * 0.68; p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); });
    // anchors
    const v = c(vx, vy, Zm); L.vX = v[0]; L.vY = v[1]; L.spY0 = c(vx, vy, Zt)[1];
    let insX = 1e9, insY = 0; for (let j = 0; j < 32; j++) { const q = isoP(L, vx + rI * Math.cos((j / 32) * TAU), vy + rI * Math.sin((j / 32) * TAU), Zm + rI * 0.35); if (q.x < insX) { insX = q.x; insY = q.y; } }
    const off = L.py.map((y) => c(L.xP + L.hs, y + L.hs, Zt)), colX = Math.max(off[0][0], off[1][0], off[2][0]) + 14, offY = off.map((q) => q[1] + fs * 0.35);
    for (let i = 1; i < 3; i++) offY[i] = Math.max(offY[i], offY[i - 1] + fs * 1.3);   // back to front, never closer than a line
    const row = c(L.xD, L.dy1, dv1)[1] - 8;
    L.lab = { K: c(L.xK, ym, Zt + L.hg), R: c(L.xR, ym, Zt + L.hg), row, off, colX, offY, pol: c(0, 0, Zm), base: c(-m, -m, -T / 2), ins: [insX, insY], app: c(L.xD, ym, dv1) };
  }
  const isoPath = (L, pts) => mkPath(pts.map((q) => isoXY(L, q[0], q[1], q[2])));

  function caasInit(s, dens) {
    const N = CA.N, P = s.pal;
    s.rs = 20261117;
    s.ag = { st: new Int8Array(N), ent: new Uint8Array(N), off: new Uint8Array(N), r: new Float32Array(N), u: new Float32Array(N), hold: new Float32Array(N), fl: new Uint8Array(N), cf: new Float32Array(N), ord: new Int16Array(N) };
    s.rw = new Float32Array(14).fill(-1); s.rf = new Float32Array(3); s.ck = new Float32Array(3); s.ckx = new Float32Array(3);
    s.flK = 0; s.flR = 0; s.vp = 0; s.ap = 0; s.mt = 0; s.sp = 0; s.rwT = 0;
    s.em = new Float32Array([1, 1, 1, 1]); s.hl = new Float32Array(4);
    s.fillM = P.light ? 'rgba(22,71,219,.055)' : 'rgba(70,120,255,.1)'; s.fillT = P.light ? 'rgba(8,24,86,.035)' : 'rgba(255,255,255,.035)';
    for (let i = 0; i < 540; i++) caasSim(s, 1 / 30, dens);   // 18 s: the pipeline is full before the first frame
  }

  // the users: inbound (1), on a lane to an offering (2), at the offering (3), dropping to BitGo (4), at the policy check (5),
  // settling into the vault or out to the address (6), stopped by policy (7). fl bits: 1 held at KYC, 2 held at the ramp, 4 crypto, 8 to be stopped.
  function caasSim(s, dt, dens) {
    const L = s.L, A = s.ag, N = CA.N, rK = L.xD - L.xK, rR = L.xD - L.xR, gap = 0.1;
    s.sp -= dt;
    if (s.sp < 0) {
      s.sp = (0.3 + 0.42 * rng(s)) / dens;
      for (let i = 0; i < N; i++) if (!A.st[i]) {
        const e = Math.floor(rng(s) * 3), q = rng(s), off = q < 0.4 ? 0 : q < 0.74 ? 1 : 2;
        A.st[i] = 1; A.ent[i] = e; A.off[i] = off; A.r[i] = L.rIn[e] + 0.05; A.hold[i] = 0; A.cf[i] = 0; A.u[i] = 0;
        A.fl[i] = (rng(s) < 0.26 ? 1 : 0) | (rng(s) < 0.14 ? 2 : 0) | (rng(s) < (off === 2 ? 0.3 : 0.05) ? 8 : 0);
        break;
      }
    }
    // the inbound line, front first: nobody passes the user ahead, so a user held at a gate holds the line
    const ord = A.ord; let n = 0;
    for (let i = 0; i < N; i++) if (A.st[i] === 1) { let j = n++; while (j > 0 && A.r[ord[j - 1]] > A.r[i]) { ord[j] = ord[j - 1]; j--; } ord[j] = i; }
    let prev = -1;
    for (let q = 0; q < n; q++) {
      const i = ord[q]; let r = A.r[i];
      if (A.hold[i] > 0) A.hold[i] -= dt;
      else {
        let nr = r - CA.VIN * dt;
        if ((A.fl[i] & 1) && r > rK && nr <= rK) { nr = rK; A.hold[i] = 0.8 + 0.6 * rng(s); A.fl[i] &= ~1; }
        if ((A.fl[i] & 2) && r > rR + 0.05 && nr <= rR + 0.05) { nr = rR + 0.05; A.hold[i] = 0.4 + 0.3 * rng(s); A.fl[i] &= ~2; }
        if (prev >= 0) nr = Math.max(nr, prev + gap);
        r = Math.min(r, nr);
        if (!(A.fl[i] & 4) && r <= rR) { A.fl[i] |= 4; A.cf[i] = 1; s.flR = 1; }
      }
      A.cf[i] = Math.max(0, A.cf[i] - dt * 2);
      if (r <= 0) { A.st[i] = 2; A.u[i] = 0; s.rf[A.off[i]] = 1; r = 0; }
      A.r[i] = r; prev = r;
    }
    for (let i = 0; i < N; i++) {
      const st = A.st[i]; if (st < 2) continue;
      const off = A.off[i];
      if (st === 2) { A.u[i] += (dt * CA.VLN) / L.lnU[off]; if (A.u[i] >= 1) { A.st[i] = 3; A.u[i] = 0; } }
      else if (st === 3) { A.u[i] += dt / CA.PAD[off]; if (A.u[i] >= 1) { A.st[i] = 4; A.u[i] = 0; if (off === 0) s.mt = 1; } }
      else if (st === 4) { A.u[i] += dt / 0.55; if (A.u[i] >= 1) { A.st[i] = 5; A.u[i] = 0; s.ck[off] = 1; } }
      else if (st === 5) { A.u[i] += dt / 0.35; if (A.u[i] >= 1) { A.u[i] = 0; if (A.fl[i] & 8) { A.st[i] = 7; s.ckx[off] = 1; } else A.st[i] = 6; } }
      else if (st === 6) { A.u[i] += (dt * CA.VST) / L.stU[off]; if (A.u[i] >= 1) { A.st[i] = 0; if (off < 2) s.vp = 1; else s.ap = 1; } }
      else if (st === 7) { A.u[i] += dt / 1.2; if (A.u[i] >= 1) A.st[i] = 0; }
    }
    // staking rewards tick back to the front end
    s.rwT -= dt;
    if (s.rwT < 0) { s.rwT = 0.55; for (let j = 0; j < s.rw.length; j++) if (s.rw[j] < 0) { s.rw[j] = 0; break; } }
    for (let j = 0; j < s.rw.length; j++) if (s.rw[j] >= 0) { s.rw[j] += (dt * CA.VLN * 0.9) / L.lnU[1]; if (s.rw[j] >= 1) s.rw[j] = -1; }
    const f = Math.pow(0.06, dt);
    for (let j = 0; j < 3; j++) { s.rf[j] *= f; s.ck[j] *= f; s.ckx[j] *= Math.pow(0.3, dt); }
    s.flR *= f; s.vp *= f; s.ap *= Math.pow(0.12, dt); s.mt *= f;
  }

  // reduced motion: one frame that tells the whole story, staged on top of the warmed-up flow. A user held at Fast KYC with
  // two queued behind, one converting at the ramp, a trade matching, a row lit in the front end, a withdrawal stopped by policy.
  function caasStage(s) {
    const L = s.L, A = s.ag, N = CA.N, rK = L.xD - L.xK, rR = L.xD - L.xR;
    for (let i = 0; i < N; i++) if (A.st[i] === 1 && A.r[i] < rK + 0.45 && A.r[i] > rR - 0.25) A.st[i] = 0;
    for (let i = 0; i < N; i++) if (A.st[i] === 7 || (A.st[i] >= 4 && A.off[i] === 2)) A.st[i] = 0;
    const put = (i, st, off, r, u, fl, hold, cf) => { A.st[i] = st; A.off[i] = off; A.ent[i] = 1; A.r[i] = r; A.u[i] = u; A.fl[i] = fl; A.hold[i] = hold; A.cf[i] = cf; };
    put(N - 1, 1, 0, rK, 0, 0, 0.5, 0); put(N - 2, 1, 1, rK + 0.1, 0, 0, 0, 0); put(N - 3, 1, 2, rK + 0.2, 0, 0, 0, 0);
    put(N - 4, 1, 1, rR - 0.04, 0, 4, 0, 0.55);
    put(N - 5, 3, 0, 0, 0.97, 4, 0, 0); put(N - 6, 7, 2, 0, 0.3, 4 | 8, 0, 0);
    s.mt = 0.75; s.ckx[2] = 0.9; s.rf[0] = 0.7; s.flR = 0.6; s.vp = 0.45;
  }

  function caasAt(s, i) {   // a user's screen position (XY), or null while still off the canvas
    const L = s.L, A = s.ag, st = A.st[i], off = A.off[i], y = L.py[off], hs = L.hs, Zt = L.Zt;
    if (st === 1) { const q = s.inP[A.ent[i]], d = q.L - A.r[i] * L.k; return d < 0 ? null : along(q, d); }
    if (st === 2) { const q = s.lnP[off]; return along(q, A.u[i] * q.L); }
    if (st === 3) {
      const u = A.u[i];
      if (off !== 1) return isoP(L, L.xP - hs + hs * sm(u), y, Zt);   // trading: into the cross; withdraw: onto the pad
      const r = hs * 0.68;   // staking: onto the ring, a turn and a quarter locked, then into the core
      if (u < 0.12) return isoP(L, L.xP - hs + (hs - r) * (u / 0.12), y, Zt);
      if (u < 0.86) { const an = Math.PI + ((u - 0.12) / 0.74) * Math.PI * 2.5; return isoP(L, L.xP + Math.cos(an) * r, y + Math.sin(an) * r, Zt); }
      const v = (u - 0.86) / 0.14; return isoP(L, L.xP, y - r * (1 - v), Zt);
    }
    if (st === 4) { const u = A.u[i]; return isoP(L, L.xP, y, Zt - (Zt - L.Zm) * u * u); }
    if (st === 5) return isoP(L, L.xP, y, L.Zm);
    if (st === 6) { const q = s.stP[off]; return along(q, A.u[i] * q.L); }
    return isoP(L, L.xP, y, L.Zm + 0.16 * Math.sin(Math.min(1, A.u[i] * 1.6) * Math.PI));
  }

  define('caasPlatform', {
    kind: 'dots',
    meaning: "Crypto-as-a-Service as one layered machine. Users arrive as dots and pass two onboarding gates (some are held, fiat turns to crypto at the ramp), enter the business's own white-label front end and fan out to trading (two order streams cross and match), staking (value locks, rewards tick back) and withdrawals (value leaves to an outside address). Underneath, BitGo runs the whole time: every transfer drops through the policy plate (now and then one is stopped) into the insured custody vault, all on the regulated base. In a pinned list, the active item lights its layer: 0 the base, 1 onboarding, 2 the offerings, 3 custody, policy and insurance.",
    opts: { ins: [], offers: [], guards: [], app: '', base: '', users: 1 },
    docs: { ins: 'The two onboarding gates, in flow order: [KYC gate, ramp gate].', offers: 'The three offerings, back to front: [trading, staking, withdraw].', guards: 'BitGo underneath: [the policy plate, the insurance dome].', app: "Optional label over the business's own front end.", base: 'Optional label for the regulated base slab.', users: 'Arrival rate (1 = default, 0.3 to 3).' },
    still: 7.6,
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, fs = labelSize(w, h), dt = s.dt, dens = clamp(+o.users || 1, 0.3, 3);
      if (s.w !== w || s.h !== h) { s.w = w; s.h = h; caasLayout(ctx, s, w, h, o, fs); if (!s.ag) caasInit(s, dens); }
      const L = s.L, k = L.k, A = s.ag, Zt = L.Zt, Zm = L.Zm, Lx = L.Lx, Ly = L.Ly, dr = L.dr, N = CA.N;
      // a pinned list replays draw-in on every item change; this scene answers with the layer highlight instead
      let pp = p; if (s.pinChg != null && t - s.pinChg < 1.5 && s.pHold != null) pp = s.pHold; else s.pHold = p;
      if (dt > 0) caasSim(s, dt * clamp(k / 90, 0.75, 1), dens); else if (s.still) caasStage(s);
      const act = !s.still && s.active != null && s.active >= 0 ? s.active : -1, em = s.em, hl = s.hl, ke = s.still ? 1 : Math.min(1, dt * 5);
      for (let i = 0; i < 4; i++) { em[i] += ((act < 0 || act === i ? 1 : CA.DIM) - em[i]) * ke; hl[i] += ((act === i ? 1 : 0) - hl[i]) * ke; }
      const gB = sm(pp * 2.2), gM = sm(pp * 2.2 - 0.3), gT = sm(pp * 2.2 - 0.6), gD = sm(pp * 2 - 0.8);
      const e0 = em[0] * gB, e3 = em[3] * gM, e1 = em[1] * gT, e2 = em[2] * gT, eT = Math.max(em[1], em[2]) * gT, eP = (e3 + eT) / 2;
      const b0 = 1 + 0.7 * hl[0], b1 = 1 + 0.5 * hl[1], b2 = 1 + 0.5 * hl[2], b3 = 1 + 0.6 * hl[3], la = (P.light ? 0.4 : 0.32) * P.k;
      const blend = P.blend, fM = L.fM, fT = L.fT, f0 = L.f0;
      ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';

      // 1 the regulated base: a slab, its grid always partly lit
      ctx.fillStyle = P.fg; ctx.globalAlpha = 0.06 * e0; ctx.fill(s.slabFront); ctx.globalAlpha = 0.1 * e0; ctx.fill(s.slabSide); ctx.globalAlpha = 0.03 * e0 * b0; ctx.fill(s.slabTop);
      ctx.save(); ctx.transform(f0[0], f0[1], f0[2], f0[3], f0[4], f0[5]); ctx.fillStyle = P.ringS;
      { const sw = ((t * 1.6) % (L.gnx + 8)) - 4, ka = (P.light ? 0.16 : 0.24) * e0 * b0;   // always on: a sweep keeps passing through, as in the 24/7 grid
        for (let i = 0; i < L.gnx; i++) for (let j = 0; j < L.gny; j++) {
          const d = i + j * 0.7 - sw, a = (d < 0 ? Math.max(0, 1 + d / 5) : Math.max(0, 1 - d / 1.2)) * (0.6 + 0.4 * Math.sin(t * 0.9 + i * 1.3 + j * 2.1));
          if (a > 0.04) { ctx.globalAlpha = a * ka; ctx.fillRect(-L.m + i * L.gs + 0.01, -L.m + j * L.gy + 0.01, L.gs - 0.02, L.gy - 0.02); }
        } }
      ctx.restore();
      ctx.strokeStyle = P.fg; ctx.globalAlpha = la * 0.4 * e0 * b0; ctx.stroke(s.slabGrid); ctx.globalAlpha = la * 1.3 * e0 * b0; ctx.stroke(s.slabEdge);
      ctx.setLineDash(DASH_SOFT); ctx.globalAlpha = la * 0.8 * eP; ctx.stroke(s.posts); ctx.setLineDash(NODASH);

      // 2 BitGo: the policy plate
      ctx.fillStyle = s.fillM; ctx.globalAlpha = e3 * b3; ctx.fill(s.faceM);
      ctx.strokeStyle = P.fg; ctx.globalAlpha = la * 1.2 * e3 * b3; ctx.stroke(s.plM);
      ctx.fillStyle = P.fg; ctx.globalAlpha = (P.light ? 0.4 : 0.5) * e3; ctx.fill(s.rules);
      const xs = ((t * 0.11) % 1.25 - 0.1) * Lx;   // the rules scan across the plate
      if (xs > 0 && xs < Lx) { isoP(L, xs, 0, Zm); const sx = XY.x, sy = XY.y; isoP(L, xs, Ly, Zm); ctx.strokeStyle = P.hi; ctx.globalAlpha = 0.55 * e3 * Math.min(1, xs * 3, (Lx - xs) * 3); ctx.lineWidth = 1.2; line(ctx, sx, sy, XY.x, XY.y); ctx.lineWidth = 1; }
      ctx.strokeStyle = P.lane; ctx.lineWidth = 1.3; ctx.globalAlpha = e3; ctx.stroke(s.lanesM);
      ctx.globalAlpha = e2; ctx.setLineDash(DASH_SOFT); ctx.stroke(s.exitP); ctx.setLineDash(NODASH); ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const f = s.ck[i], x = s.ckx[i], near = Math.max(0, 1 - Math.abs(xs - L.xP) * 4);
        if (f > 0.02) { ctx.fillStyle = P.hi; ctx.globalAlpha = f * 0.4 * e3; ctx.fill(s.ckS[i]); }
        ctx.strokeStyle = P.hi; ctx.globalAlpha = Math.min(1, 0.5 + 0.5 * f + 0.4 * near) * e3 * (1 - 0.6 * x); ctx.lineWidth = 1.2; ctx.stroke(s.ckS[i]);
        if (x > 0.02) { ctx.strokeStyle = P.fg; ctx.globalAlpha = Math.min(1, x * 1.6) * e3; ctx.lineWidth = 1.6; ctx.stroke(s.ckX[i]); ctx.stroke(s.ckS[i]); }
        ctx.lineWidth = 1;
      }
      // the outside address
      ctx.strokeStyle = P.hi; ctx.globalAlpha = 0.9 * e2; ctx.lineWidth = 1.2; ctx.stroke(s.addr);
      if (s.ap > 0.02) { ctx.save(); ctx.transform(fM[0], fM[1], fM[2], fM[3], fM[4], fM[5]); ctx.beginPath(); ctx.arc(L.xA, L.py[2], 0.075 + (1 - s.ap) * 0.28, 0, TAU); ctx.restore(); ctx.globalAlpha = s.ap * e2; ctx.stroke(); }
      // the custody vault: a slow dial of nested squares around a core that brightens with every deposit
      const vx = L.xD, vy = Ly / 2;
      ctx.save(); ctx.transform(fM[0], fM[1], fM[2], fM[3], fM[4], fM[5]); ctx.beginPath();
      for (let j = 0; j < 2; j++) { const r = (0.11 + j * 0.09) * 1.414, rot = (j % 2 ? -1 : 1) * t * 0.22 + j * 0.4; for (let q = 0; q < 4; q++) { const an = rot + (q * Math.PI) / 2; q ? ctx.lineTo(vx + Math.cos(an) * r, vy + Math.sin(an) * r) : ctx.moveTo(vx + Math.cos(an) * r, vy + Math.sin(an) * r); } ctx.closePath(); }
      ctx.restore(); ctx.strokeStyle = P.ringS; ctx.globalAlpha = 0.8 * e3 * b3; ctx.lineWidth = 1.2; ctx.stroke(); ctx.lineWidth = 1;
      if (s.vp > 0.02) { ctx.save(); ctx.transform(fM[0], fM[1], fM[2], fM[3], fM[4], fM[5]); ctx.beginPath(); ctx.arc(vx, vy, 0.12 + (1 - s.vp) * 0.3, 0, TAU); ctx.restore(); ctx.strokeStyle = P.cyS; ctx.globalAlpha = s.vp * 0.8 * e3; ctx.stroke(); }
      // BitGo under the front end: a light column from the vault up to it
      beam(ctx, P, L.vX, L.spY0, L.vY, 2, k * 0.13, t, 0.5 * e3, s.dpr);

      // 3 the users and everything that glows, in one additive pass
      ctx.globalCompositeOperation = blend;
      const cr = k * 0.2 * (1 + 0.35 * s.vp + 0.05 * Math.sin(t * 2.2)); ctx.globalAlpha = e3 * b3 * 0.95; ctx.drawImage(P.sCore, L.vX - cr, L.vY - cr, cr * 2, cr * 2);
      const gd = gD;
      // trading: two order streams cross the pad and match in the middle
      { const x = L.xP, y = L.py[0], q = L.hs * 0.8, K = 3;
        for (let j = 0; j < K; j++) {
          const u = (t * 0.4 + j / K) % 1, a = Math.sin(u * Math.PI) * (u < 0.5 ? 1 : 0.35) * e2 * gd, d = (u - 0.5) * 2 * q;
          ctx.globalAlpha = a; isoP(L, x + d, y + d, Zt); dot(ctx, P.sCy, XY.x, XY.y, dr * 0.75); isoP(L, x - d, y + d, Zt); dot(ctx, P.sWh, XY.x, XY.y, dr * 0.75);
        } }
      // staking: locked value on its ring, a core, and rewards on their way back
      { const x = L.xP, y = L.py[1], r = L.hs * 0.68;
        ctx.globalAlpha = 0.9 * e2 * gd;
        for (let j = 0; j < 6; j++) { const an = t * 0.9 + (j * TAU) / 6; isoP(L, x + Math.cos(an) * r, y + Math.sin(an) * r, Zt); dot(ctx, P.sBl, XY.x, XY.y, dr * 0.7); }
        isoP(L, x, y, Zt); dot(ctx, P.sWh, XY.x, XY.y, dr * (0.9 + 0.2 * Math.sin(t * 3)));
        const q = s.lnP[1];
        for (let j = 0; j < s.rw.length; j++) if (s.rw[j] >= 0) { const u = s.rw[j]; ctx.globalAlpha = e2 * gd * Math.min(1, (1 - u) * 5, u * 8); along(q, q.L * (1 - u)); dot(ctx, P.sWh, XY.x, XY.y, dr * 0.5); }
      }
      // the users
      for (let i = 0; i < N; i++) {
        const st = A.st[i]; if (!st) continue;
        const q = caasAt(s, i); if (!q) continue;
        const crypto = A.fl[i] & 4;
        ctx.globalAlpha = (st === 1 ? e1 : st < 4 ? e2 : e3) * gd * (st === 7 ? 1 - A.u[i] : 1);
        if (st === 1 && !crypto) dot(ctx, P.sWh, q.x, q.y, dr * 1.05);
        else if (st === 7) dot(ctx, P.sWh, q.x, q.y, dr * 0.8);
        else dot(ctx, P.sCy, q.x, q.y, dr);
        if (st === 3 && A.off[i] === 0) { const u = sm(A.u[i]), qq = L.hs * 0.8 * (1 - u); isoP(L, L.xP + qq, L.py[0] - qq, Zt); dot(ctx, P.sWh, XY.x, XY.y, dr * 0.85); }   // the order it matches
      }
      ctx.globalCompositeOperation = 'source-over';
      // crisp marks: fiat is square, a held user rings, a conversion bursts, a stopped transfer shows its X above
      ctx.lineWidth = 1.2;
      let held = 0;
      for (let i = 0; i < N; i++) {
        const st = A.st[i]; if (st !== 1 && st !== 7) continue;
        const q = caasAt(s, i); if (!q) continue;
        const x = q.x, y = q.y;
        if (st === 7) { const a = (1 - A.u[i]) * e3 * gd, z = dr * 1.3; ctx.strokeStyle = P.fg; ctx.globalAlpha = a; line(ctx, x - z, y - z, x + z, y + z); line(ctx, x - z, y + z, x + z, y - z); continue; }
        if (!(A.fl[i] & 4)) { const z = dr * 0.55; ctx.fillStyle = P.fg; ctx.globalAlpha = 0.95 * e1 * gd; ctx.fillRect(x - z, y - z, z * 2, z * 2); }
        if (A.hold[i] > 0) { if (A.r[i] > (L.xD - L.xR) + 0.2) held = 1; ctx.strokeStyle = P.hi; ctx.globalAlpha = (0.55 + 0.45 * Math.sin(t * 9)) * e1 * gd; ctx.beginPath(); ctx.arc(x, y, dr * 2.6, 0, TAU); ctx.stroke(); }
        if (A.cf[i] > 0) { ctx.strokeStyle = P.cyS; ctx.globalAlpha = A.cf[i] * e1 * gd; ctx.beginPath(); ctx.arc(x, y, dr * (1.5 + (1 - A.cf[i]) * 5), 0, TAU); ctx.stroke(); }
      }
      s.flK += (held - s.flK) * ke;
      // matches on the trading pad
      { const a = (t * 1.2 + 0.5) % 1, m = Math.max((1 - a) * (1 - a) * 0.6, s.mt);
        if (m > 0.02) { const rr = s.mt > (1 - a) * (1 - a) * 0.6 ? 0.04 + (1 - s.mt) * 0.16 : 0.03 + a * 0.12; ctx.save(); ctx.transform(fT[0], fT[1], fT[2], fT[3], fT[4], fT[5]); ctx.beginPath(); ctx.arc(L.xP, L.py[0], rr, 0, TAU); ctx.restore(); ctx.strokeStyle = P.cyS; ctx.globalAlpha = m * e2 * gd; ctx.stroke(); } }
      ctx.lineWidth = 1;

      // 4 the business's platform, on top
      ctx.strokeStyle = P.fg; ctx.setLineDash(DASH_FINE); ctx.globalAlpha = la * 1.1 * e3; ctx.stroke(s.drops); ctx.setLineDash(NODASH);
      ctx.fillStyle = s.fillT; ctx.globalAlpha = eT; ctx.fill(s.faceT);
      ctx.strokeStyle = P.fg; ctx.globalAlpha = la * 1.2 * eT * Math.max(b1, b2); ctx.stroke(s.plT);
      ctx.strokeStyle = P.lane; ctx.lineWidth = 1.3; ctx.globalAlpha = e1 * b1; ctx.stroke(s.lanesIn); ctx.globalAlpha = e2 * b2; ctx.stroke(s.lanesT); ctx.lineWidth = 1;
      ctx.strokeStyle = P.fg; ctx.globalAlpha = la * 2 * e2 * b2; ctx.stroke(s.pads); ctx.globalAlpha = la * 1.3 * e2 * b2; ctx.stroke(s.padTr); ctx.stroke(s.padSt);
      // withdraw: chevrons march toward the way out
      ctx.save(); ctx.transform(fT[0], fT[1], fT[2], fT[3], fT[4], fT[5]); ctx.beginPath();
      for (let j = 0; j < 3; j++) { const u = (t * 0.6 + j / 3) % 1, x = L.xP - L.hs * 0.6 + u * L.hs * 1.1, y = L.py[2], c = L.hs * 0.4; ctx.moveTo(x - c * 0.6, y - c); ctx.lineTo(x, y); ctx.lineTo(x - c * 0.6, y + c); }
      ctx.restore(); ctx.strokeStyle = P.hi; ctx.globalAlpha = 0.85 * e2 * b2; ctx.lineWidth = 1.3; ctx.stroke(); ctx.lineWidth = 1;
      // the gates: Fast KYC scans (and holds), the ramp turns fiat into crypto
      ctx.lineWidth = 1.3; ctx.strokeStyle = P.fg; ctx.globalAlpha = Math.min(1, 0.75 * b1) * e1; ctx.stroke(s.gK); ctx.stroke(s.gR0);
      ctx.strokeStyle = P.cyS; ctx.globalAlpha = Math.min(1, (0.75 + 0.25 * s.flR) * b1) * e1; ctx.lineWidth = 1.3 + s.flR; ctx.stroke(s.gR1); ctx.lineWidth = 1;
      { const sv = Zt + L.hg * (0.5 + 0.42 * Math.sin(t * (2.4 + 2 * s.flK))); isoP(L, L.xK, L.gy0, sv); const ax = XY.x, ay = XY.y; isoP(L, L.xK, L.gy1, sv);
        ctx.strokeStyle = P.hi; ctx.globalAlpha = (0.5 + 0.5 * s.flK) * e1; ctx.lineWidth = 1.2 + s.flK; line(ctx, ax, ay, XY.x, XY.y); ctx.lineWidth = 1; }
      // the front end: a white-label app, its three rows answering the user who picks them
      ctx.fillStyle = P.hi; ctx.globalAlpha = (P.light ? 0.07 : 0.12) * e2 * b2; ctx.fill(s.devF);
      for (let i = 0; i < 3; i++) if (s.rf[i] > 0.02) { ctx.globalAlpha = s.rf[i] * 0.55 * e2; ctx.fill(s.devRow[i]); }
      ctx.strokeStyle = P.fg; ctx.globalAlpha = Math.min(1, 0.85 * b2) * e2; ctx.lineWidth = 1.3; ctx.stroke(s.devF); ctx.lineWidth = 1;
      ctx.globalAlpha = la * 1.8 * e2; ctx.stroke(s.devUI); for (let i = 0; i < 3; i++) ctx.stroke(s.devRow[i]);
      ctx.setLineDash(DASH_DOT); ctx.stroke(s.devLogo); ctx.setLineDash(NODASH);
      // the insurance dome, last, so it reads over the vault: a ring of meridians and one bright sweep
      ctx.fillStyle = P.cyS; ctx.globalAlpha = (P.light ? 0.05 : 0.07) * e3 * b3; ctx.fill(s.domeO);
      ctx.strokeStyle = P.cyS; ctx.globalAlpha = 0.25 * e3 * b3; ctx.stroke(s.dome); ctx.globalAlpha = 0.6 * e3 * b3; ctx.lineWidth = 1.2; ctx.stroke(s.domeO); ctx.lineWidth = 1;
      { const ph = (t * 0.5) % Math.PI, rI = L.rI; ctx.beginPath();
        for (let j = 0; j <= 16; j++) { const th = (j / 16) * Math.PI; isoP(L, vx + rI * Math.cos(th) * Math.cos(ph), vy + rI * Math.cos(th) * Math.sin(ph), Zm + rI * Math.sin(th)); j ? ctx.lineTo(XY.x, XY.y) : ctx.moveTo(XY.x, XY.y); }
        ctx.globalAlpha = 0.85 * Math.sin(ph) * e3 * b3; ctx.lineWidth = 1.4; ctx.stroke(); ctx.lineWidth = 1; }

      // labels, from the page
      const lb = L.lab, lf = L.fs, ins0 = label(o.ins, 0), ins1 = label(o.ins, 1);
      ctx.strokeStyle = P.fg; ctx.lineWidth = 1;
      if (ins0) { ctx.globalAlpha = la * 1.4 * e1; line(ctx, lb.K[0], lb.K[1] - 4, lb.K[0], lb.row + 4); labelText(ctx, P, ins0, lb.K[0] + 4, lb.row, 'right', lf, 0.88 * e1, lb.K[0] - 6); }
      if (ins1) { ctx.globalAlpha = la * 1.4 * e1; line(ctx, lb.R[0], lb.R[1] - 4, lb.R[0], lb.row + 4); labelText(ctx, P, ins1, lb.R[0] - 4, lb.row, 'left', lf, 0.88 * e1, w - lb.R[0] - 6); }
      for (let i = 0; i < 3; i++) {
        const tx = label(o.offers, i); if (!tx) continue;
        const q = lb.off[i], y = lb.offY[i] - lf * 0.35;
        ctx.globalAlpha = la * 1.4 * e2; ctx.beginPath(); ctx.moveTo(q[0] + 3, q[1]); ctx.lineTo(lb.colX - 12, y); ctx.lineTo(lb.colX - 5, y); ctx.stroke();
        labelText(ctx, P, tx, lb.colX, lb.offY[i], 'left', lf, 0.88 * e2, w - lb.colX - 4);
      }
      labelText(ctx, P, label(o.guards, 0), lb.pol[0] - 12, lb.pol[1] + lf * 0.35, 'right', lf, 0.88 * e3);
      labelText(ctx, P, label(o.guards, 1), lb.ins[0] - 10, lb.ins[1] + lf * 0.35, 'right', lf, 0.88 * e3);
      if (o.app) labelText(ctx, P, String(o.app), lb.app[0], lb.row - lf * 1.4, 'center', lf, 0.88 * e2);
      if (o.base) labelText(ctx, P, String(o.base), lb.base[0] - 12, lb.base[1] + lf * 0.35, 'right', lf, 0.88 * e0);
      ctx.globalAlpha = 1;
    },
  });
  /* ---------------------------------------------- ascii (homepage dissolve) ---------------------------------------------- */
  // after v3-refokus/gl.js drawDissolve: glyphs blitted from a pre-rendered atlas, one glyph and tone per cell, kept quiet:
  // large cells, one tone ramp, only inside the mark, most of the interior left to the light glyphs.
  const AG = ' .:-=+*#%@01·$x', AI = {}; [...AG].forEach((c, i) => (AI[c] = i));
  const ARAMP = [...'.:-=+*#%@'].map((c) => AI[c]);
  const RAMPS = {
    'blue-dark': ['#14309c', '#3a66ff', '#8eabff', '#d4e0ff', '#ffffff'],
    'money-dark': ['#04140a', '#0d5a2a', '#1fbf5b', '#7dffa8', '#e8fff0'],
    'blue-light': ['#dfe7ff', '#a9bfff', '#4d78ff', '#1647DB', '#0b2a99'],
    'money-light': ['#d6f2e1', '#8fdcae', '#1fbf5b', '#0d7a3a', '#04461f'],
  };
  const tones = (stops, n = 12) => { const st = stops.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))); return Array.from({ length: n }, (_, i) => { const q = i / (n - 1) * (st.length - 1), a = Math.min(Math.floor(q), st.length - 2), f = q - a; return `rgb(${st[a].map((v, k) => Math.round(v + (st[a + 1][k] - v) * f)).join(',')})`; }); };
  const SHIELD = 'M156.282 104.257C156.282 146.692 78.3938 183.634 78.3938 183.634C78.3938 183.634 0.50478 146.692 0.50478 104.257C0.50478 93.2381 0.509268 83.5104 0.513558 74.2098C0.522088 55.7192 0.52984 38.9167 0.5 17.0094C49.9579 -5.62206 106.836 -5.59857 156.282 17.0588V104.257Z';
  const BOUNDS = new Map();
  function pathBounds(d) {   // a path string's bounding box, found by drawing it and scanning the pixels
    if (BOUNDS.has(d)) return BOUNDS.get(d);
    const P2 = new Path2D(d), c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
    let res = null;
    for (const k of [1, 16]) {
      c.width = c.height = 1024; x.setTransform(k, 0, 0, k, 0, 0); x.fill(P2);
      const D = x.getImageData(0, 0, 1024, 1024).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let yy = 0; yy < 1024; yy++) for (let xx = 0; xx < 1024; xx++) if (D[(yy * 1024 + xx) * 4 + 3] > 20) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      if (x1 >= 0) { res = [x0 / k, y0 / k, (x1 - x0 + 1) / k, (y1 - y0 + 1) / k]; if (Math.max(res[2], res[3]) * k >= 64) break; }
    }
    BOUNDS.set(d, res); return res;
  }

  define('asciiMark', {
    kind: 'ascii',
    meaning: "A mark (a path or a short string such as $, 01 or 1:1) set in the homepage's ASCII glyph grid. It assembles from falling bits as it scrolls in, then rests with a slow scan line and a few flickering bits.",
    opts: { text: '', path: '', box: null, theme: 'blue', size: 0.72, cell: 0, density: 0.75 },
    docs: { text: 'A short string to rasterise (1 to 4 characters read best).', path: 'An SVG path d string. With neither text nor path, the BitGo shield.', box: 'Optional [x, y, w, h] of the path; found automatically when left out.', theme: "'blue', or 'money' (green tones and a falling $ stream).", size: 'Share of the shorter side the mark fills.', cell: 'Cell width in px (0: from the canvas size, 11 to 22px).', density: 'Share of interior cells that carry a glyph at rest (edges always do).' },
    still: 4,
    draw(ctx, w, h, t, p, o, s) {
      const P = s.pal, dpr = s.dpr, money = o.theme === 'money';
      if (s.w !== w || s.h !== h || s.d !== dpr) {   // (the library also clears s.w when web fonts finish loading)
        s.w = w; s.h = h; s.d = dpr;
        const cw = o.cell > 0 ? o.cell : Math.round(clamp(Math.min(w, h) / (o.text ? 34 : 28), 11, 22)), ch = Math.round(cw * 14 / 9);
        const cols = Math.floor(w / cw), rows = Math.floor(h / ch), ox = (w - cols * cw) / 2, oy = (h - rows * ch) / 2, SS = 4;
        Object.assign(s, { cw, ch, cols, rows, ox, oy });
        // the mask, four samples a side per cell
        const mc = s.mc || (s.mc = document.createElement('canvas')), mx = mc.getContext('2d', { willReadFrequently: true });
        mc.width = Math.max(1, cols * SS); mc.height = Math.max(1, rows * SS);
        mx.setTransform(SS / cw, 0, 0, SS / ch, -ox * SS / cw, -oy * SS / ch); mx.fillStyle = '#000';
        const size = clamp(+o.size || 0.72, 0.2, 1) * Math.min(w, h);
        if (o.text) {
          const txt = String(o.text); mx.font = `700 100px ${FONT}`; const m = mx.measureText(txt);
          const th = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) || 72, tw = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) || m.width;
          const k = Math.min(size / th, (w * 0.86) / tw), fsz = 100 * k;
          mx.font = `700 ${fsz}px ${FONT}`; mx.textAlign = 'left'; mx.textBaseline = 'alphabetic';
          mx.fillText(txt, w / 2 - (tw * k) / 2 + m.actualBoundingBoxLeft * k, h / 2 + (th * k) / 2 - m.actualBoundingBoxDescent * k);
        } else {
          const d = o.path || SHIELD, bb = Array.isArray(o.box) && o.box.length === 4 ? o.box : pathBounds(d);
          if (bb) {
            const k = Math.min(size / bb[3], (w * 0.86) / bb[2]);
            mx.save(); mx.translate(w / 2 - (bb[0] + bb[2] / 2) * k, h / 2 - (bb[1] + bb[3] / 2) * k); mx.scale(k, k); mx.fill(new Path2D(d)); mx.restore();
          }
        }
        const D = mx.getImageData(0, 0, mc.width, mc.height).data, n = cols * rows;
        s.inn = new Uint8Array(n); s.edge = new Uint8Array(n); s.S = new Float32Array(n);
        let r0 = 1e9, r1 = -1, c0 = 1e9, c1 = -1;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          let a = 0; for (let yy = 0; yy < SS; yy++) for (let xx = 0; xx < SS; xx++) a += D[(((r * SS + yy) * mc.width) + c * SS + xx) * 4 + 3];
          if (a / (SS * SS * 255) > 0.42) { s.inn[r * cols + c] = 1; if (r < r0) r0 = r; if (r > r1) r1 = r; if (c < c0) c0 = c; if (c > c1) c1 = c; }
        }
        Object.assign(s, { r0, r1, c0, c1 });
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const o2 = r * cols + c; if (!s.inn[o2]) continue;
          const out = (cc, rr) => cc < 0 || rr < 0 || cc >= cols || rr >= rows || !s.inn[rr * cols + cc];
          s.edge[o2] = out(c - 1, r) || out(c + 1, r) || out(c, r - 1) || out(c, r + 1) ? 1 : 0;
          const nx = (c - c0) / Math.max(1, c1 - c0), ny = (r - r0) / Math.max(1, r1 - r0);
          s.S[o2] = clamp(0.2 + 0.6 * (1 - ny * 0.65 - nx * 0.35) + 0.25 * ahash(c, r, 1));   // lit from the top left, like the shield's LDIR
        }
        // the glyph atlas: every glyph in 12 tones
        const tn = tones(RAMPS[(money ? 'money' : 'blue') + '-' + (P.light ? 'light' : 'dark')]);
        const aw = Math.round(cw * dpr), ah = Math.round(ch * dpr), at = s.atlas || (s.atlas = document.createElement('canvas')), ax = at.getContext('2d');
        at.width = AG.length * aw; at.height = tn.length * ah;
        ax.font = `500 ${Math.round(ch * 0.8 * dpr)}px ui-monospace,"JetBrains Mono",SFMono-Regular,Menlo,Consolas,monospace`; ax.textAlign = 'center'; ax.textBaseline = 'middle';
        tn.forEach((col, ci) => { ax.fillStyle = col; [...AG].forEach((gl, gi) => ax.fillText(gl, gi * aw + aw / 2, ci * ah + ah / 2 + dpr * 0.5)); });
        s.aw = aw; s.ah = ah; s.nt = tn.length;
      }
      if (s.r1 < 0) return;
      const { cw, ch, cols, ox, oy, r0, r1, c0, c1, inn, edge, S, atlas, aw, ah, nt } = s;
      const tick = Math.floor(t * 14), scanRow = r0 + ((t * 0.3) % 1) * (r1 - r0 + 8) - 4, midX = ox + ((c0 + c1) / 2 + 0.5) * cw, fall = h * 0.35;
      const dens = clamp(o.density == null ? 0.75 : +o.density), still = s.still;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let r = r0; r <= r1; r++) {
        const rowN = (r - r0) / Math.max(1, r1 - r0);
        for (let c = c0; c <= c1; c++) {
          const o2 = r * cols + c; if (!inn[o2]) continue;
          const sh = S[o2], ed = edge[o2], bit = ahash(c, r, tick) < 0.5 ? AI['0'] : AI['1'];
          const u = still || p >= 0.999 ? 1 : clamp((p - (0.04 + 0.36 * rowN + 0.08 * ahash(c, r, 7))) / 0.5);
          if (u <= 0) continue;
          let g = -1, tn = 0, al = 0, dx = 0, dy = 0;
          if (u < 1) {   // assembling, the homepage outro run backwards: bits fall in from above, churn, then settle behind a bright front
            const q = 1 - u, colSp = 0.55 + 0.9 * ahash(c, 0, 5);
            if (q < 0.1) { g = q < 0.05 ? AI['#'] : ARAMP[Math.round(sh * 7)]; tn = 1; }
            else if (q < 0.34) { g = ahash(c, r, tick) < (q - 0.1) * 2.4 ? bit : ARAMP[clamp(Math.round(sh * 7) + ((ahash(c, r, tick >> 1) * 3) | 0) - 1, 0, 8)]; tn = 0.45 + 0.5 * sh; }
            else if (q < 0.55) { g = bit; tn = (0.5 + 0.5 * sh) * (0.85 + 0.15 * Math.sin(t * 9 + c)); dx = (ahash(c, r, tick) - 0.5) * 1.5; }
            else { const k2 = (q - 0.55) / 0.45; g = q < 0.93 ? bit : AI['·']; tn = (0.5 + 0.5 * sh) * (1 - k2 * 0.5); dy = -Math.pow(k2, 1.7) * fall * colSp; dx = (ox + c * cw - midX) * k2 * 0.14 + Math.sin(t * 2 + c * 0.7) * 6 * k2; }
            al = q > 0.7 ? 1 - (q - 0.7) / 0.3 : 1;
          } else if (money) {   // Monetary Freedom: a $ stream falls down each column
            const head = r0 + ((t * 0.55 + ahash(c, 3, 11)) % 1) * (r1 - r0 + 10) - 5, dh = head - r, lit = dh >= 0 && dh < 6 ? 1 - dh / 6 : 0;
            if (!ed && lit < 0.2 && ahash(c, r, 5) > dens) continue;
            g = ed || lit > 0.5 ? AI['$'] : sh > 0.62 ? AI[':'] : AI['.'];   // the edges and the stream head carry the $; the interior stays light
            tn = ed ? Math.min(1, 0.62 + 0.25 * sh + 0.3 * lit) : Math.min(1, 0.28 + 0.4 * sh + 0.5 * lit); al = ed ? 0.95 : 0.6 + 0.35 * lit;
          } else {
            const shv = sh * (0.85 + 0.15 * Math.sin(t * 1.3 + c * 0.35 + r * 0.5)), band = Math.exp(-Math.pow((r - scanRow) / 1.6, 2));
            if (!ed && band < 0.3 && ahash(c, r, 5) > dens) continue;
            g = ed ? (ahash(c, r, 3) < 0.5 ? AI['#'] : AI['=']) : ARAMP[Math.min(6, Math.round(shv * 2.5) + (band > 0.4 ? 2 : 0))];
            tn = ed ? 0.85 + 0.15 * band : 0.3 + 0.4 * shv + 0.35 * band; al = ed ? 0.95 : 0.7 + 0.25 * band;
            if (ahash(c, r, Math.floor(t * 3)) < 0.035) { g = bit; tn = 0.95; }   // a few cells flicker as data
          }
          if (g < 0 || al < 0.01) continue;
          ctx.globalAlpha = al;
          const ti = clamp(Math.round(tn * (nt - 1)), 0, nt - 1);
          ctx.drawImage(atlas, g * aw, ti * ah, aw, ah, Math.round((ox + c * cw + dx) * dpr), Math.round((oy + r * ch + dy) * dpr), aw, ah);
        }
      }
      ctx.globalAlpha = 1; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
  });

  /* ================================================ mounting ================================================ */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STILL = reduce || /[?&]still\b/.test(location.search);
  const items = [];
  let running = false;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    for (const e of es) { const it = e.target.__scene; if (!it) continue; it.vis = e.isIntersecting; if (it.vis) { if (STILL) still(it); else start(); } }
  }, { rootMargin: '120px 0px' }) : null;
  const ro = STILL && 'ResizeObserver' in window ? new ResizeObserver((es) => es.forEach((e) => { const it = e.target.__scene; if (it && it.vis) still(it); })) : null;

  function toneOf(cv, user) {
    if (user === 'light' || user === 'dark') return user;
    return cv.closest('.tone-paper') ? 'light' : 'dark';
  }
  function mount(root = document) {
    const list = root.querySelectorAll ? root.querySelectorAll('canvas[data-scene]') : [];
    if (root.matches && root.matches('canvas[data-scene]')) mountOne(root);
    list.forEach(mountOne);
  }
  function mountOne(cv) {
    if (cv.__scene) return;
    const def = defs[cv.dataset.scene]; if (!def) return;   // unknown name: left for a later mount
    let user = {};
    const raw = cv.getAttribute('data-scene-opts');
    if (raw) { try { user = JSON.parse(raw) || {}; } catch (e) { console.warn('Scenes: bad data-scene-opts on', cv, e); user = {}; } }
    const o = Object.assign({}, def.opts, user);
    o.tone = toneOf(cv, user.tone);
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const s = { cv, pal: withSprites(palette(o.tone)), dt: 1 / 60, dpr: 1, still: false };
    const it = { cv, ctx, def, o, s, vis: false, p: 0, last: 0, w: 0, h: 0, dead: false };
    cv.__scene = it; items.push(it);
    if (io) io.observe(cv); else { it.vis = true; STILL ? still(it) : start(); }
    if (ro) ro.observe(cv);
  }
  function fit(it) {
    const r = it.cv.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h) return null;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (it.cv.width !== W || it.cv.height !== H) { it.cv.width = W; it.cv.height = H; }
    it.w = w; it.h = h; it.s.dpr = dpr;
    return r;
  }
  function run(it, t) {
    const { ctx, s } = it;
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, it.w, it.h);
    // a scene in a pinned list answers the list: each new item replays its draw-in (s.active holds the item index)
    if (it.pinEl === undefined) it.pinEl = it.cv.closest('.m-pin');
    let p = it.p; const g = it.pinEl && it.pinEl.__pin;
    if (g && !s.still) {
      if (g.active !== s.active) { if (g.active >= 0 && s.active != null && s.active >= 0) s.pinChg = t; s.active = g.active; }
      const u = clamp((t - (s.pinChg == null ? -9 : s.pinChg)) / 1.4);
      if (u < 1) p = Math.min(p, 0.12 + 0.88 * u * u * (3 - 2 * u));
    }
    try { it.def.draw(ctx, it.w, it.h, t, p, it.o, s); } catch (e) { it.dead = true; console.error('Scenes: ' + it.def.name + ' stopped', e); }
  }
  function still(it) {
    if (it.dead || !fit(it)) return;
    const T = it.def.still != null ? it.def.still : 4, s = it.s;
    it.p = 1;
    if (!s.warm) {   // simulations run a few seconds first, so the frame shows packets in flight
      s.warm = true; s.still = false; s.dt = 1 / 30;
      for (let k = 90; k > 0; k--) run(it, T - k / 30);
    }
    s.still = true; s.dt = 0; run(it, T);
  }
  function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
  function frame(now) {
    let any = false;
    const vh = window.innerHeight || 1;
    for (const it of items) {
      if (!it.vis || it.dead) continue;
      any = true;
      const r = fit(it); if (!r) continue;
      let dt = it.last ? (now - it.last) / 1000 : 1 / 60;
      if (dt > 0.25 || dt <= 0) dt = 1 / 60;   // back from a pause: one ordinary step, never a jump
      it.last = now; it.s.dt = Math.min(0.05, dt);
      const target = clamp((vh - r.top) / (vh * 0.4 + r.height / 2));
      it.p += (target - it.p) * Math.min(1, it.s.dt * 6);
      if (Math.abs(target - it.p) < 0.001) it.p = target;
      run(it, now / 1000);
    }
    for (const it of items) if (!it.vis) it.last = 0;
    if (any) requestAnimationFrame(frame); else running = false;
  }

  if (document.fonts) {   // labels, hub text and ASCII text masks are measured in the web font: rebuild once it arrives
    const refit = () => { for (const it of items) { it.s.w = -1; if (STILL) { it.s.warm = false; if (it.vis) still(it); } } };
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', refit);
    if (document.fonts.ready) document.fonts.ready.then(refit);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mount(document)); else mount(document);
})();
