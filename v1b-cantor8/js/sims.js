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

// ---- Own: one live scene per statement. A feed line enters from the left, like the follow line, and drives each scene.
function own(cv) {
  const ctx = cv.getContext('2d');
  let W, H, dpr;
  const build = () => ({ w: W, h: H, dpr } = fit(cv));
  build(); addEventListener('resize', build);
  const items = [...document.querySelectorAll('.oitem')];
  const lvl = new Float32Array(5);
  const hh = (n) => { const x = Math.sin(n * 127.1) * 43758.5; return x - Math.floor(x); };
  const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const sq = (x, y, s = 6) => ctx.fillRect(x - s / 2, y - s / 2, s, s);
  const feed = (t) => {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; line(0, H / 2, W * 0.14, H / 2);
    ctx.fillStyle = '#fff'; sq(((t * 0.45) % 1) * W * 0.14, H / 2, 6); sq(W * 0.14, H / 2, 9);
  };
  const scenes = [
    // Transparency: every row of the ledger is open; a scan reads them all
    (t) => {
      const scan = ((t * 0.22) % 1.15) * W;
      for (let r = 0; r < 9; r++) {
        const y = H * (0.2 + r * 0.075);
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1; line(W * 0.14, y, W * 0.94, y);
        for (let k = 0; k < 6; k++) {
          const x = W * (0.2 + 0.7 * hh(r * 7 + k)), lit = Math.max(0, 1 - Math.abs(scan - x) / (W * 0.2));
          ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.65 * lit})`; sq(x, y, 8 + lit * 6);
        }
      }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; line(scan, H * 0.14, scan, H * 0.86);
    },
    // Monetary freedom: the middle steps fade out and the line goes direct
    (t) => {
      const p = Math.sin(t * 0.7) * 0.5 + 0.5, A = [W * 0.2, H * 0.5], B = [W * 0.9, H * 0.5];
      const mid = [[0.38, 0.3], [0.54, 0.7], [0.7, 0.32]].map(([x, y]) => [W * x, H * y]);
      const path = [A, ...mid, B];
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - p)})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); path.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
      mid.forEach((q) => { ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - p)})`; sq(q[0], q[1], 14); });
      ctx.strokeStyle = `rgba(255,255,255,${0.3 + 0.7 * p})`; ctx.lineWidth = 1 + p * 2; line(A[0], A[1], B[0], B[1]);
      ctx.fillStyle = '#fff'; sq(A[0], A[1], 14); sq(B[0], B[1], 14);
      const u = (t * 0.5) % 1; sq(A[0] + (B[0] - A[0]) * u, A[1], 8);
    },
    // Borderless: a globe that never sleeps
    (t) => {
      const cx = W * 0.58, cy = H * 0.5, R = W * 0.34, rot = t * 0.28;
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      for (let k = 0; k < 6; k++) { const ang = rot + (k * Math.PI) / 6; ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(R * Math.cos(ang)) + 0.5, R, 0, 0, 7); ctx.stroke(); }
      for (let l = -2; l <= 2; l++) { const la = (l * Math.PI) / 6, y = cy + R * Math.sin(la), w = R * Math.cos(la); line(cx - w, y, cx + w, y); }
      const pr = (lon, lat) => { const L = lon + rot; return [cx + R * Math.cos(lat) * Math.sin(L), cy - R * Math.sin(lat), Math.cos(L) * Math.cos(lat)]; };
      for (let i = 0; i < 4; i++) {
        const u = (t * 0.18 + i * 0.25) % 1, a = [i * 1.6, 0.3 - i * 0.2], b = [i * 1.6 + 2.2, -0.2 + i * 0.15];
        const p = pr(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * 0.35);
        if (p[2] > 0) { ctx.fillStyle = '#fff'; sq(p[0], p[1], 8); }
      }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; line(W * 0.14, H / 2, cx - R, cy);
    },
    // Secure and scarce: supply climbs in halving steps and stops at the cap
    (t) => {
      const x0 = W * 0.14, x1 = W * 0.92, yb = H * 0.8, yc = H * 0.22, n = 6, sw = (x1 - x0) / n;
      const val = (e) => yb - (yb - yc) * (1 - Math.pow(0.5, e + 1));
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.setLineDash([6, 6]); line(x0, yc, x1, yc); ctx.setLineDash([]);
      const pts = [];
      for (let e = 0; e < n; e++) pts.push([x0 + e * sw, val(e)], [x0 + (e + 1) * sw, val(e)]);
      const reach = x0 + Math.min(1, (t * 0.1) % 1.25) * (x1 - x0);
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, reach, H); ctx.clip();
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      const e = Math.min(n - 1, Math.floor((reach - x0) / sw)); ctx.fillStyle = '#fff'; sq(reach, val(e), 10);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; line(W * 0.14, H / 2, x0, val(0)); ctx.strokeRect(x1 - 7, yc - 7, 14, 14);
    },
    // Innovation: blocks of the new stack snap into place
    (t) => {
      const s = W * 0.1, cx = W * 0.58, yb = H * 0.82, total = 15, cyc = (t * 1.3) % (total + 5), cnt = Math.floor(cyc), fr = cyc - cnt;
      let i = 0;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5 - r; c++, i++) {
        const x = cx + (c - (5 - r - 1) / 2) * (s + 6), y = yb - r * (s + 6) - s / 2;
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1; ctx.strokeRect(x - s / 2, y - s / 2, s, s);
        if (i < cnt) { ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.1 * r})`; ctx.fillRect(x - s / 2, y - s / 2, s, s); }
        else if (i === cnt && cnt < total) { const yy = y - (1 - fr * fr) * H * 0.4; ctx.fillStyle = '#fff'; ctx.fillRect(x - s / 2, yy - s / 2, s, s); }
      }
    }
  ];
  return (t, dt) => {
    const act = items.findIndex((e) => e.classList.contains('act'));
    for (let i = 0; i < 5; i++) lvl[i] += ((i === act ? 1 : 0) - lvl[i]) * Math.min(1, dt * 5);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { if (lvl[i] < 0.02) continue; ctx.globalAlpha = lvl[i]; feed(t); scenes[i](t); }
    ctx.globalAlpha = 1;
  };
}

export function initSims() {
  const o = document.getElementById('ownvis');
  if (o) { const fn = own(o); register(o, fn); if (reduced) fn(5, 0.016); }
  const makers = [accounts, staking, network];
  document.querySelectorAll('canvas[data-sim]').forEach((cv) => {
    const fn = makers[+cv.dataset.sim](cv);
    register(cv, fn);
    if (reduced) fn(5, 0.016);
  });
  const w = document.getElementById('week');
  if (w) { const fn = week(w); register(w, fn); if (reduced) fn(5, 0.016); }
}
