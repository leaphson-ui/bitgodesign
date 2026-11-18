import { register, fit, reduced } from './loop.js';

const rnd = (a, b) => a + Math.random() * (b - a);

// ---- helpers
function pathLen(pts) { let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; } return { L, seg }; }
function along(pts, meta, s) {
  s = Math.max(0, Math.min(meta.L, s));
  for (let i = 0; i < meta.seg.length; i++) {
    if (s <= meta.seg[i] || i === meta.seg.length - 1) { const u = meta.seg[i] ? s / meta.seg[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; }
    s -= meta.seg[i];
  }
  return pts[pts.length - 1];
}
function strokePts(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }

// ---- 0: Go Accounts. Cash and crypto lanes merge into one account, then fan out to what you do with it.
function accounts(cv) {
  const ctx = cv.getContext('2d');
  let W, H, dpr, lanes, outs, boxR, packets = [], pulse = 0, acc = 0;
  const build = () => {
    ({ w: W, h: H, dpr } = fit(cv));
    const yc = H * 0.4, bx0 = W * 0.56, bx1 = W * 0.74;
    boxR = [bx0, yc - H * 0.13, bx1 - bx0, H * 0.26];
    lanes = [0.1, 0.24, 0.56, 0.7].map((f) => {
      const y = H * f;
      const pts = [[0, y], [W * 0.2, y], [W * 0.2 + Math.abs(yc - y) * 0.7, yc + (y < yc ? -1 : 1) * 0 + (yc - y) * 0.0], [bx0, yc]];
      pts[2][1] = yc; return pts;
    });
    outs = [0.12, 0.3, 0.5, 0.68].map((f) => [[bx1, yc], [W * 0.82, yc], [W * 0.82 + Math.abs(H * f - yc) * 0.6, H * f], [W, H * f]]);
    lanes.forEach((p) => (p.m = pathLen(p))); outs.forEach((p) => (p.m = pathLen(p)));
  };
  build(); addEventListener('resize', build);
  let spawnT = 0;
  return (t, dt) => {
    spawnT -= dt;
    if (spawnT < 0) { spawnT = rnd(0.25, 0.6); packets.push({ lane: Math.floor(Math.random() * 4), s: 0, out: -1, coin: Math.random() < 0.5 }); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.3)';
    lanes.forEach((p) => strokePts(ctx, p)); outs.forEach((p) => strokePts(ctx, p));
    // the account
    pulse *= Math.pow(0.1, dt);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; ctx.strokeRect(boxR[0], boxR[1], boxR[2], boxR[3]);
    ctx.fillStyle = `rgba(255,255,255,${0.1 + pulse * 0.35})`; ctx.fillRect(boxR[0], boxR[1], boxR[2], boxR[3]);
    for (let i = 0; i < 3; i++) {
      const y = boxR[1] + boxR[3] * (0.25 + i * 0.25); const wv = (0.35 + 0.4 * Math.abs(Math.sin(t * 0.4 + i * 1.7))) * (boxR[2] - 24);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(boxR[0] + 12, y - 2, wv, 4);
    }
    const sp = Math.max(120, W * 0.3);
    for (let i = packets.length - 1; i >= 0; i--) {
      const k = packets[i]; k.s += sp * dt;
      const path = k.out < 0 ? lanes[k.lane] : outs[k.out];
      if (k.s >= path.m.L) {
        if (k.out < 0) { k.out = Math.floor(Math.random() * 4); k.s = 0; pulse = 1; acc++; }
        else { packets.splice(i, 1); continue; }
      }
      const [x, y] = along(path, path.m, k.s);
      ctx.fillStyle = '#fff';
      if (k.coin) { ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 7); ctx.fill(); } else ctx.fillRect(x - 4, y - 4, 8, 8);
    }
  };
}

// ---- 1: Staking. Epochs add rewards to stakes; the stakes compound, then harvest and start again.
function staking(cv) {
  const ctx = cv.getContext('2d');
  let W, H, dpr; const M = 22; const target = new Float32Array(M), cur = new Float32Array(M);
  let pips = [], ep = 0, flash = 0;
  for (let i = 0; i < M; i++) { target[i] = 0.18 + 0.1 * Math.sin(i * 0.5); cur[i] = target[i]; }
  const build = () => ({ w: W, h: H, dpr } = fit(cv));
  build(); addEventListener('resize', build);
  return (t, dt) => {
    ep -= dt;
    const gap = W * 0.012, bw = (W - gap * (M + 1)) / M, base = H * 0.9, sx = W / 2, sy = H * 0.12;
    if (ep < 0) {
      ep = 0.5; flash = 1;
      for (let n = 0; n < 5; n++) { const i = Math.floor(Math.random() * M); pips.push({ i, u: 0, x0: sx, y0: sy }); }
    }
    flash *= Math.pow(0.05, dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    // the one click
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; const s = 16 + flash * 5;
    ctx.strokeRect(sx - s / 2, sy - s / 2, s, s); ctx.fillStyle = `rgba(255,255,255,${0.2 + flash * 0.7})`; ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
    let mx = 0;
    for (let i = 0; i < M; i++) { cur[i] += (target[i] - cur[i]) * Math.min(1, dt * 5); mx = Math.max(mx, cur[i]); }
    const hmax = H * 0.7;
    ctx.beginPath();
    for (let i = 0; i < M; i++) {
      const x = gap + i * (bw + gap), h = cur[i] * hmax;
      ctx.fillStyle = `rgba(255,255,255,${0.16 + cur[i] * 0.45})`; ctx.fillRect(x, base - h, bw, h);
      ctx.fillStyle = '#fff'; ctx.fillRect(x, base - h, bw, 2);
    }
    for (let i = pips.length - 1; i >= 0; i--) {
      const p = pips[i]; p.u += dt * 1.5;
      const x1 = gap + p.i * (bw + gap) + bw / 2, y1 = base - cur[p.i] * hmax;
      const u = Math.min(1, p.u), e = u * u;
      const x = p.x0 + (x1 - p.x0) * e, y = p.y0 + (y1 - p.y0) * e;
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(p.x0, p.y0); ctx.lineTo(x, y); ctx.stroke();
      if (u >= 1) { target[p.i] += 0.045; pips.splice(i, 1); }
    }
    if (mx > 0.97) for (let i = 0; i < M; i++) target[i] = 0.14 + 0.1 * Math.random();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(0, base, W, 1);
  };
}

// ---- 2: Go Network. Two legs of a trade cross the network at the same moment and both ends settle together.
function network(cv) {
  const ctx = cv.getContext('2d');
  let W, H, dpr; const nodes = []; const edges = [];
  for (let i = 0; i < 10; i++) nodes.push({ bx: 0.1 + 0.8 * ((i * 0.618) % 1), by: 0.14 + 0.62 * ((i * 0.382 + 0.17 * (i % 3)) % 1), ph: rnd(0, 6), ring: 0 });
  for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) { const d = Math.hypot(nodes[i].bx - nodes[j].bx, (nodes[i].by - nodes[j].by) * 0.7); if (d < 0.36) edges.push([i, j]); }
  const build = () => ({ w: W, h: H, dpr } = fit(cv));
  build(); addEventListener('resize', build);
  let swaps = [], nextT = 0;
  const pos = (n, t) => [(n.bx + 0.012 * Math.sin(t * 0.4 + n.ph)) * W, (n.by + 0.016 * Math.cos(t * 0.33 + n.ph)) * H];
  return (t, dt) => {
    nextT -= dt;
    if (nextT < 0) { nextT = rnd(0.55, 1.1); swaps.push({ e: edges[Math.floor(Math.random() * edges.length)], u: 0 }); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.22)';
    edges.forEach(([a, b]) => { const A = pos(nodes[a], t), Bp = pos(nodes[b], t); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(Bp[0], Bp[1]); ctx.stroke(); });
    for (let i = swaps.length - 1; i >= 0; i--) {
      const s = swaps[i]; s.u += dt * 0.9;
      const [a, b] = s.e, A = pos(nodes[a], t), Bp = pos(nodes[b], t);
      const u = Math.min(1, s.u), e = u * u * (3 - 2 * u);
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - u * 0.5)})`; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(A[0] + (Bp[0] - A[0]) * e, A[1] + (Bp[1] - A[1]) * e); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(Bp[0], Bp[1]); ctx.lineTo(Bp[0] + (A[0] - Bp[0]) * e, Bp[1] + (A[1] - Bp[1]) * e); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(A[0] + (Bp[0] - A[0]) * e - 3.5, A[1] + (Bp[1] - A[1]) * e - 3.5, 7, 7);
      ctx.beginPath(); ctx.arc(Bp[0] + (A[0] - Bp[0]) * e, Bp[1] + (A[1] - Bp[1]) * e, 4, 0, 7); ctx.fill();
      if (u >= 1) { nodes[a].ring = 1; nodes[b].ring = 1; swaps.splice(i, 1); }
    }
    ctx.lineWidth = 1.2;
    nodes.forEach((n) => {
      const [x, y] = pos(n, t); n.ring *= Math.pow(0.06, dt);
      ctx.fillStyle = '#1647DB'; ctx.strokeStyle = '#fff'; ctx.fillRect(x - 5, y - 5, 10, 10); ctx.strokeRect(x - 5, y - 5, 10, 10);
      if (n.ring > 0.03) { const r = 8 + (1 - n.ring) * 34; ctx.strokeStyle = `rgba(255,255,255,${n.ring})`; ctx.strokeRect(x - r, y - r, r * 2, r * 2); }
    });
  };
}

// ---- Support: 24 hours by 7 days, every square lit; a sweep keeps passing through.
function week(cv) {
  const ctx = cv.getContext('2d');
  let W, H, dpr;
  const build = () => ({ w: W, h: H, dpr } = fit(cv));
  build(); addEventListener('resize', build);
  const C = 24, R = 7;
  return (t) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const gap = Math.max(4, W * 0.006), cw = (W - gap * (C - 1)) / C, ch = (H - gap * (R - 1)) / R;
    const sweep = (t * 2.2) % (C + 6) - 3;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const dd = Math.abs(c + r * 0.7 - sweep); const tail = c + r * 0.7 < sweep ? Math.max(0, 1 - (sweep - c - r * 0.7) / 6) : 0;
      const near = Math.max(0, 1 - dd / 1.4);
      const tw = 0.5 + 0.5 * Math.sin(t * 0.9 + c * 1.3 + r * 2.1);
      const a = 0.2 + 0.1 * tw + tail * 0.28 + near * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a)})`;
      ctx.fillRect(c * (cw + gap), r * (ch + gap), cw, ch);
    }
  };
}

// ---- Own: one open line scene per statement. No frames and no boxes: only lines, arcs and points that
// belong to the same world as the follow line. Each scene draws itself in as it scrolls into view.
function own(cv, idx) {
  const ctx = cv.getContext('2d');
  let W, H, dpr;
  const build = () => ({ w: W, h: H, dpr } = fit(cv));
  build(); addEventListener('resize', build);
  const hh = (n) => { const x = Math.sin(n * 127.1) * 43758.5; return x - Math.floor(x); };
  const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const dot = (x, y, r = 4) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const poly = (pts) => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); };
  const sm = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
  const soft = 'rgba(255,255,255,.28)';
  let prog = 0;
  const scenes = [
    // Transparency: a colonnade of open arches. A light line reads every one of them.
    (t, p) => {
      const n = 7, x0 = W * 0.04, x1 = W * 0.96, sw = (x1 - x0) / n, yb = H * 0.88, ya = H * 0.42;
      const scan = x0 + ((t * 0.16) % 1.2) * (x1 - x0);
      for (let k = 0; k < n; k++) {
        const xl = x0 + k * sw + sw * 0.1, xr = x0 + (k + 1) * sw - sw * 0.1, cx = (xl + xr) / 2, r = (xr - xl) / 2;
        const lit = Math.max(0, 1 - Math.abs(scan - cx) / (sw * 1.6)), g = sm(p * 1.6 - k * 0.12);
        ctx.strokeStyle = `rgba(255,255,255,${(0.3 + 0.7 * lit) * g})`; ctx.lineWidth = 1.2 + lit * 1.2;
        ctx.beginPath(); ctx.moveTo(xl, yb); ctx.lineTo(xl, ya); ctx.arc(cx, ya, r, Math.PI, 0); ctx.lineTo(xr, yb); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.14 * g})`; ctx.lineWidth = 1;
        for (let m = 1; m < 4; m++) line(cx - r * 0.55, yb - m * (yb - ya) * 0.22, cx + r * 0.55, yb - m * (yb - ya) * 0.22);
      }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; line(x0, yb, x0 + (x1 - x0) * sm(p * 1.3), yb);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; line(scan, H * 0.1, scan, yb);
    },
    // Monetary freedom: the middle hops fade and the line goes direct.
    (t, p) => {
      const c = Math.sin(t * 0.7) * 0.5 + 0.5, A = [W * 0.06, H * 0.5], B = [W * 0.94, H * 0.5];
      const mid = [[0.26, 0.2], [0.42, 0.78], [0.58, 0.24], [0.74, 0.76]].map(([x, y]) => [W * x, H * y]);
      const path = [A, ...mid, B], g = sm(p * 1.5);
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - c) * g})`; ctx.lineWidth = 1.2; poly(path);
      ctx.strokeStyle = `rgba(255,255,255,${0.2 * g})`; ctx.setLineDash([3, 7]);
      mid.forEach((q) => { ctx.beginPath(); ctx.arc(q[0], q[1], 16, 0, 7); ctx.stroke(); }); ctx.setLineDash([]);
      ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - c) * g})`; mid.forEach((q) => dot(q[0], q[1], 4.5));
      ctx.strokeStyle = `rgba(255,255,255,${(0.3 + 0.7 * c) * g})`; ctx.lineWidth = 1.2 + c * 2;
      line(A[0], A[1], A[0] + (B[0] - A[0]) * sm(p * 1.4), B[1]);
      ctx.fillStyle = '#fff'; dot(A[0], A[1], 6); dot(B[0], B[1], 6);
      dot(A[0] + (B[0] - A[0]) * ((t * 0.45) % 1), A[1], 4);
    },
    // Borderless: a globe that never sleeps.
    (t, p) => {
      const cx = W * 0.5, cy = H * 0.5, R = Math.min(H * 0.44, W * 0.3), rot = t * 0.28, g = sm(p * 1.4);
      ctx.strokeStyle = `rgba(255,255,255,${0.45 * g})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      for (let k = 0; k < 6; k++) { const ang = rot + (k * Math.PI) / 6; ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(R * Math.cos(ang)) + 0.5, R, 0, 0, 7); ctx.stroke(); }
      for (let l = -2; l <= 2; l++) { const la = (l * Math.PI) / 6, y = cy + R * Math.sin(la), w = R * Math.cos(la); line(cx - w, y, cx + w, y); }
      const pr = (lon, lat) => { const L = lon + rot; return [cx + R * Math.cos(lat) * Math.sin(L), cy - R * Math.sin(lat), Math.cos(L) * Math.cos(lat)]; };
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 5; i++) {
        const a = [i * 1.4, 0.35 - i * 0.18], b = [i * 1.4 + 2.2, -0.25 + i * 0.12];
        ctx.beginPath(); let started = false;
        for (let u = 0; u <= 1.001; u += 0.04) {
          const q = pr(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * 0.35);
          if (q[2] > 0) { started ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); started = true; } else started = false;
        }
        ctx.stroke();
        const u = (t * 0.16 + i * 0.2) % 1, q = pr(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * 0.35);
        if (q[2] > 0) dot(q[0], q[1], 4);
      }
      ctx.strokeStyle = `rgba(255,255,255,${g})`; ctx.lineWidth = 1.6; line(0, cy, cx - R, cy);
    },
    // Secure and scarce: supply climbs in halving steps and rests against the cap.
    (t, p) => {
      const x0 = W * 0.05, x1 = W * 0.95, yb = H * 0.86, yc = H * 0.16, n = 7, sw = (x1 - x0) / n;
      const val = (e) => yb - (yb - yc) * (1 - Math.pow(0.5, e + 1));
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1; ctx.setLineDash([6, 7]); line(x0, yc, x1, yc); ctx.setLineDash([]);
      for (let e = 0; e <= n; e++) { ctx.strokeStyle = 'rgba(255,255,255,.12)'; line(x0 + e * sw, yb, x0 + e * sw, yc + 8); }
      const pts = [];
      for (let e = 0; e < n; e++) pts.push([x0 + e * sw, val(e)], [x0 + (e + 1) * sw, val(e)]);
      const reach = x0 + Math.min(1, (t * 0.09) % 1.25) * (x1 - x0);
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.2; poly(pts);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, reach, H); ctx.clip(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; poly(pts); ctx.restore();
      const e = Math.min(n - 1, Math.floor((reach - x0) / sw)); ctx.fillStyle = '#fff'; dot(reach, val(e), 5);
      ctx.strokeStyle = `rgba(255,255,255,${sm(p * 1.4)})`; ctx.lineWidth = 1.6; line(0, val(0), x0, val(0));
    },
    // Innovation: one open outline climbs in setbacks, with a spire at the top.
    (t, p) => {
      const cx = W * 0.5, yb = H * 0.9, hTot = H * 0.8;
      const hw = [0.2, 0.2, 0.15, 0.15, 0.1, 0.1, 0.05, 0.05], ht = [0.18, 0.2, 0.14, 0.16, 0.1, 0.1, 0.06, 0.06];
      const cyc = (t * 0.3) % 1.6, up = Math.min(1, cyc / 1.1), fade = cyc > 1.3 ? 1 - (cyc - 1.3) / 0.3 : 1;
      const pts = [[cx - hw[0] * W, yb]]; let y = yb;
      for (let k = 0; k < hw.length; k++) { y -= ht[k] * hTot / 0.98; pts.push([cx - hw[k] * W, y]); if (k + 1 < hw.length) pts.push([cx - hw[k + 1] * W, y]); }
      const left = pts, right = pts.map(([x, yy]) => [2 * cx - x, yy]);
      const total = hTot * 1.0, reach = yb - total * sm(up);
      ctx.save(); ctx.beginPath(); ctx.rect(0, reach, W, H); ctx.clip();
      ctx.strokeStyle = `rgba(255,255,255,${0.95 * fade})`; ctx.lineWidth = 1.6; poly(left); poly(right);
      const top = left[left.length - 1]; line(top[0], top[1], top[0] + 2 * (cx - top[0]), top[1]);
      ctx.strokeStyle = `rgba(255,255,255,${0.2 * fade})`; ctx.lineWidth = 1;
      for (let m = 1; m < 8; m++) { const x = cx - hw[0] * W + (2 * hw[0] * W) * m / 8; line(x, yb, x, yb - hTot * 0.34); }
      for (let m = 1; m < 5; m++) { const x = cx - hw[3] * W + (2 * hw[3] * W) * m / 5; line(x, yb - hTot * 0.34, x, yb - hTot * 0.6); }
      ctx.restore();
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * fade})`; line(cx, yb - hTot * 1.02, cx, yb - hTot * 1.02 - 0);
      ctx.fillStyle = '#fff'; ctx.globalAlpha = fade; dot(cx, reach, 3.5); ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1; line(W * 0.04, yb, W * 0.96, yb);
      ctx.strokeStyle = `rgba(255,255,255,${sm(p * 1.4)})`; ctx.lineWidth = 1.6; line(0, yb, W * 0.04, yb);
    }
  ];
  return (t, dt) => {
    const r = cv.getBoundingClientRect(), vh = innerHeight;
    const target = Math.max(0, Math.min(1, (vh * 0.95 - r.top) / (vh * 0.5)));
    prog += (target - prog) * Math.min(1, (dt || 0.016) * 6);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    scenes[idx](t, reduced ? 1 : prog);
  };
}

export function initSims() {
  document.querySelectorAll('canvas[data-own]').forEach((cv) => { const fn = own(cv, +cv.dataset.own); register(cv, fn); if (reduced) fn(5, 0.016); });
  const makers = [accounts, staking, network];
  document.querySelectorAll('canvas[data-sim]').forEach((cv) => {
    const fn = makers[+cv.dataset.sim](cv);
    register(cv, fn);
    if (reduced) fn(5, 0.016);
  });
  const w = document.getElementById('week');
  if (w) { const fn = week(w); register(w, fn); if (reduced) fn(5, 0.016); }
}
