// Procedural shapes -> same-count dense point clouds (positions + normals), sorted by height.
import * as T from 'three';

const PI = Math.PI;
function rngFor(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const _q = new T.Quaternion(), _e = new T.Euler();
function mat(p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  _e.set(r[0], r[1], r[2]); _q.setFromEuler(_e);
  return new T.Matrix4().compose(new T.Vector3(p[0], p[1], p[2]), _q.clone(), new T.Vector3(s[0], s[1], s[2]));
}

class Acc {
  constructor() { this.P = []; this.N = []; this.W = []; this.G = null; }
  add(geo, m = new T.Matrix4(), w = 1) {
    if (this.G) m = this.G.clone().multiply(m);
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.attributes.normal) g.computeVertexNormals();
    const pa = g.attributes.position, na = g.attributes.normal;
    const nm = new T.Matrix3().getNormalMatrix(m);
    const v = new T.Vector3(), n = new T.Vector3();
    for (let i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(m);
      n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize();
      this.P.push(v.x, v.y, v.z); this.N.push(n.x, n.y, n.z);
      if (i % 3 === 0) this.W.push(w);
    }
    geo.dispose();
  }
  box(sz, p, r, w = 1) { this.add(new T.BoxGeometry(sz[0], sz[1], sz[2]), mat(p, r), w); }
  cyl(rt, rb, h, p, r, seg = 24, open = false, w = 1) { this.add(new T.CylinderGeometry(rt, rb, h, seg, 1, open), mat(p, r), w); }
  tor(R, t, p, r, rs = 10, ts = 64, w = 1) { this.add(new T.TorusGeometry(R, t, rs, ts), mat(p, r), w); }
  sph(r, p, s, w = 1, seg = 20) { this.add(new T.SphereGeometry(r, seg, seg * 0.7 | 0), mat(p, [0, 0, 0], s || [1, 1, 1]), w); }
  strut(a, b, r = 0.05, w = 4, seg = 5) {
    const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), L = d.length();
    if (L < 1e-5) return;
    const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
    const m = new T.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new T.Vector3(1, 1, 1));
    this.add(new T.CylinderGeometry(r, r, L, seg, 1, false), m, w);
  }
}

function sample(acc, N, seed, opts = {}) {
  const rnd = rngFor(seed);
  const P = acc.P, Nn = acc.N, Tn = P.length / 9;
  const cum = new Float64Array(Tn);
  let tot = 0;
  for (let i = 0; i < Tn; i++) {
    const o = i * 9;
    const ax = P[o + 3] - P[o], ay = P[o + 4] - P[o + 1], az = P[o + 5] - P[o + 2];
    const bx = P[o + 6] - P[o], by = P[o + 7] - P[o + 1], bz = P[o + 8] - P[o + 2];
    const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
    tot += 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz) * acc.W[i];
    cum[i] = tot;
  }
  const pos = new Float32Array(N * 3), nor = new Float32Array(N * 3);
  for (let k = 0; k < N; k++) {
    const r = rnd() * tot;
    let lo = 0, hi = Tn - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < r) lo = mid + 1; else hi = mid; }
    const o = lo * 9;
    let u = rnd(), v = rnd();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    for (let c = 0; c < 3; c++) {
      pos[k * 3 + c] = P[o + c] * w + P[o + 3 + c] * u + P[o + 6 + c] * v;
      nor[k * 3 + c] = Nn[o + c] * w + Nn[o + 3 + c] * u + Nn[o + 6 + c] * v;
    }
    const l = Math.hypot(nor[k * 3], nor[k * 3 + 1], nor[k * 3 + 2]) || 1;
    nor[k * 3] /= l; nor[k * 3 + 1] /= l; nor[k * 3 + 2] /= l;
  }
  // normalise: centre on bbox, scale so the 97th percentile distance is 1
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let k = 0; k < N; k++) for (let c = 0; c < 3; c++) { const x = pos[k * 3 + c]; if (x < mn[c]) mn[c] = x; if (x > mx[c]) mx[c] = x; }
  const cen = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2 + (opts.yShift || 0), (mn[2] + mx[2]) / 2];
  const ds = new Float32Array(N);
  for (let k = 0; k < N; k++) ds[k] = Math.hypot(pos[k * 3] - cen[0], pos[k * 3 + 1] - cen[1], pos[k * 3 + 2] - cen[2]);
  const sorted = Array.from(ds).sort((a, b) => a - b);
  const sc = 1 / sorted[Math.floor(N * (opts.pct || 0.97))];
  for (let k = 0; k < N; k++) for (let c = 0; c < 3; c++) pos[k * 3 + c] = (pos[k * 3 + c] - cen[c]) * sc;
  // noisy edges: jitter along normal and sideways, a few dust points thrown outward
  for (let k = 0; k < N; k++) {
    const nx = nor[k * 3], ny = nor[k * 3 + 1], nz = nor[k * 3 + 2];
    const jn = (rnd() - 0.5) * 0.010;
    const dust = rnd() < 0.05 ? Math.pow(rnd(), 2) * 0.09 : 0;
    pos[k * 3] += nx * (jn + dust) + (rnd() - 0.5) * 0.006;
    pos[k * 3 + 1] += ny * (jn + dust) + (rnd() - 0.5) * 0.006;
    pos[k * 3 + 2] += nz * (jn + dust) + (rnd() - 0.5) * 0.006;
  }
  // order by height so the morph is a coherent wipe
  const idx = new Uint32Array(N); for (let i = 0; i < N; i++) idx[i] = i;
  const key = new Float32Array(N); for (let i = 0; i < N; i++) key[i] = pos[i * 3 + 1] + pos[i * 3] * 0.12;
  idx.sort((a, b) => key[a] - key[b]);
  const p2 = new Float32Array(N * 3), n2 = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const j = idx[i];
    p2[i * 3] = pos[j * 3]; p2[i * 3 + 1] = pos[j * 3 + 1]; p2[i * 3 + 2] = pos[j * 3 + 2];
    n2[i * 3] = nor[j * 3]; n2[i * 3 + 1] = nor[j * 3 + 1]; n2[i * 3 + 2] = nor[j * 3 + 2];
  }
  return { pos: p2, nor: n2 };
}

// ---- noise for terrain ----
function vnoise(seed) {
  const h = (x, y) => { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seed * 1013; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
  };
}

// ---- gear helper ----
function gearPoly(teeth, rTip, rRoot, phase = 0) {
  const pts = [], step = 2 * PI / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = phase + i * step;
    const q = [[rRoot, -0.30], [rTip, -0.14], [rTip, 0.14], [rRoot, 0.30]];
    for (const [r, f] of q) pts.push(new T.Vector2(Math.cos(a + f * step) * r, Math.sin(a + f * step) * r));
  }
  return pts;
}
function gearGeo(teeth, rTip, rRoot, holeR, depth, phase = 0) {
  const s = new T.Shape(gearPoly(teeth, rTip, rRoot, phase));
  if (holeR > 0) { const h = new T.Path(); h.absarc(0, 0, holeR, 0, PI * 2, true); s.holes.push(h); }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  return g;
}

const SHAPES = {};

SHAPES.vault = () => {
  const A = new Acc(), Z = [PI / 2, 0, 0];
  A.add(new T.TorusGeometry(3.1, 0.58, 26, 120), mat([0, 0, 0]));
  A.add(new T.TorusGeometry(3.95, 0.2, 12, 120), mat([0, 0, -0.2]));
  for (let k = 0; k < 20; k++) { const a = k / 20 * PI * 2; A.cyl(0.17, 0.17, 0.3, [3.1 * Math.cos(a), 3.1 * Math.sin(a), 0.62], Z, 12); }
  A.cyl(2.8, 2.8, 1.0, [0, 0, 0.3], Z, 72, false, 2);
  A.tor(2.6, 0.15, [0, 0, 0.82], [0, 0, 0], 10, 96);
  A.tor(1.9, 0.07, [0, 0, 0.82], [0, 0, 0], 8, 80);
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * PI * 2;
    A.cyl(0.24, 0.24, 0.36, [2.25 * Math.cos(a), 2.25 * Math.sin(a), 0.98], Z, 16);
    A.cyl(0.13, 0.13, 0.22, [2.25 * Math.cos(a), 2.25 * Math.sin(a), 1.2], Z, 10);
  }
  for (let k = 0; k < 10; k++) { const a = (k + 0.5) / 10 * PI * 2; A.box([0.62, 0.42, 0.55], [2.95 * Math.cos(a), 2.95 * Math.sin(a), 0.3], [0, 0, a]); }
  A.cyl(0.9, 1.0, 0.55, [0, 0, 1.2], Z, 40);
  A.tor(0.92, 0.08, [0, 0, 1.5], [0, 0, 0], 8, 48);
  A.cyl(0.55, 0.55, 0.3, [0, 0, 1.6], Z, 32);
  A.tor(0.55, 0.04, [0, 0, 1.78], [0, 0, 0], 6, 40);
  for (let k = 0; k < 24; k++) { const a = k / 24 * PI * 2; A.box([0.05, 0.12, 0.05], [0.4 * Math.cos(a), 0.4 * Math.sin(a), 1.78], [0, 0, a]); }
  A.tor(1.5, 0.11, [0, 0, 1.9], [0, 0, 0], 10, 64);
  for (let k = 0; k < 3; k++) { const a = k * PI / 3 + 0.2; A.cyl(0.085, 0.085, 3.0, [0, 0, 1.9], [0, 0, a]); }
  A.cyl(0.26, 0.3, 0.8, [0, 0, 1.55], Z, 16);
  for (let k = 0; k < 6; k++) { const a = k * PI / 3 + 0.2; A.sph(0.2, [1.9 * Math.cos(a), 1.9 * Math.sin(a), 1.9]); }
  for (const y of [-1.9, 0, 1.9]) { A.box([0.75, 1.05, 1.0], [-3.55, y, 0.25]); A.cyl(0.14, 0.14, 1.3, [-3.9, y, 0.25], [0, 0, 0], 10); }
  A.box([1.0, 0.7, 0.6], [3.5, 0, 0.2]);
  return A;
};

SHAPES.gears = () => {
  const A = new Acc(), Z = [PI / 2, 0, 0];
  const train = [
    // teeth, x, y, z, phase
    [24, 0, 0, 0.0, 0.0], [14, 3.57, 1.3, 0.12, 0.0], [20, 6.36, -0.65, 0.0, 0.1], [10, -2.6, 2.19, 0.12, 0.2], [30, -3.1, -4.42, 0.06, 0.05], [12, -6.3, 0.1, 0.0, 0.3],
  ];
  for (const [t, x, y, z, ph] of train) {
    const r = t * 0.1, dep = 0.55 + r * 0.12;
    const shp = new T.Shape(gearPoly(t, r + 0.17, r - 0.21, ph));
    const hub = new T.Path(); hub.absarc(0, 0, 0.32, 0, PI * 2, true); shp.holes.push(hub);
    if (r > 1.3) { const nh = r > 2.2 ? 6 : 5; for (let k = 0; k < nh; k++) { const a = k / nh * PI * 2 + ph, h = new T.Path(); h.absarc(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.2, 0, PI * 2, true); shp.holes.push(h); } }
    const g = new T.ExtrudeGeometry(shp, { depth: dep, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, -dep / 2);
    A.add(g, mat([x, y, z]));
    A.cyl(0.55, 0.55, dep + 0.5, [x, y, z], Z, 20);
    A.cyl(0.26, 0.26, dep + 2.4, [x, y, z - 0.3], Z, 14);
    A.cyl(0.42, 0.42, 0.18, [x, y, z + dep / 2 + 0.55], Z, 14);
    if (r > 1.3) A.tor(r * 0.86, 0.05, [x, y, z + dep / 2], [0, 0, 0], 6, 48, 1.5);
  }
  // support bar and brackets
  A.box([17, 0.45, 0.5], [-0.5, -6.6, -1.35]);
  for (const [x, y] of train.map((g) => [g[1], g[2]])) A.strut([x, y, -1.3], [x, Math.max(-6.4, y - 0.1), -1.3], 0.1, 2, 8);
  return A;
};

SHAPES.crane = () => {
  const A = new Acc();
  const W = 0.6, H = 10;
  const legs = [[-W, -W], [W, -W], [W, W], [-W, W]];
  for (const [x, z] of legs) A.strut([x, 0, z], [x, H, z], 0.075, 3);
  for (let y = 0; y < H; y += 1.0) {
    for (let i = 0; i < 4; i++) {
      const a = legs[i], b = legs[(i + 1) % 4];
      A.strut([a[0], y, a[1]], [b[0], y, b[1]], 0.045, 3);
      const flip = ((y | 0) + i) % 2 === 0;
      A.strut([flip ? a[0] : b[0], y, flip ? a[1] : b[1]], [flip ? b[0] : a[0], y + 1.0, flip ? b[1] : a[1]], 0.04, 3);
    }
  }
  A.box([3.6, 0.8, 3.6], [0, -0.4, 0]);
  for (const x of [-1.2, 1.2]) A.box([0.9, 0.55, 3.0], [x, 0.25, 0]);
  // slewing unit, cab
  A.box([1.5, 0.5, 1.5], [0, H + 0.25, 0]);
  A.box([1.1, 1.0, 1.0], [0.95, H + 0.9, 0.95]);
  A.box([1.5, 0.5, 1.2], [0, H + 0.75, 0]);
  // jib (triangular lattice) +x, counter jib -x
  const jy = H + 1.15;
  const jib = (x0, x1) => {
    const ch = [[0, 0.5], [0.4, -0.2], [-0.4, -0.2]];
    for (const [z, y] of ch) A.strut([x0, jy + y, z], [x1, jy + y, z], 0.06, 3);
  };
  jib(0, 9.2); jib(0, -3.6);
  const step = 0.8;
  for (let x = -3.6; x < 9.2; x += step) {
    const x2 = x + step;
    A.strut([x, jy + 0.5, 0], [x, jy - 0.2, 0.4], 0.04, 3);
    A.strut([x, jy + 0.5, 0], [x, jy - 0.2, -0.4], 0.04, 3);
    A.strut([x, jy - 0.2, 0.4], [x, jy - 0.2, -0.4], 0.035, 3);
    A.strut([x, jy + 0.5, 0], [x2, jy - 0.2, 0.4], 0.035, 3);
    A.strut([x, jy - 0.2, -0.4], [x2, jy + 0.5, 0], 0.035, 3);
  }
  for (let i = 0; i < 3; i++) A.box([0.8, 0.62, 1.0], [-3.0 + i * 0.0, jy - 0.2 + i * 0.64 - 0.0, 0]);
  // A-frame and pendants
  const apex = [0, H + 3.3, 0];
  A.strut([-0.4, jy + 0.5, 0], apex, 0.07, 4); A.strut([0.4, jy + 0.5, 0], apex, 0.07, 4);
  A.strut(apex, [4.6, jy + 0.5, 0], 0.03, 5); A.strut(apex, [8.9, jy + 0.5, 0], 0.03, 5);
  A.strut(apex, [-3.3, jy + 0.5, 0], 0.035, 5);
  A.sph(0.14, apex);
  // trolley, hook line, hook block, load
  const tx = 6.3;
  A.box([0.7, 0.3, 0.9], [tx, jy - 0.5, 0]);
  A.strut([tx, jy - 0.55, 0], [tx, H - 3.4, 0], 0.03, 5);
  A.box([0.5, 0.45, 0.4], [tx, H - 3.65, 0]);
  A.cyl(0.1, 0.1, 0.4, [tx, H - 4.1, 0], [0, 0, 0], 8);
  const ly = H - 5.6;
  for (const z of [-0.5, 0, 0.5]) A.box([2.8, 0.2, 0.3], [tx, ly + (z === 0 ? 0.2 : 0), z * 0.9], [0, 0.04, 0]);
  for (const sx of [-1.2, 1.2]) A.strut([tx, H - 4.2, 0], [tx + sx, ly + 0.15, 0.2], 0.022, 5), A.strut([tx, H - 4.2, 0], [tx + sx, ly + 0.15, -0.2], 0.022, 5);
  return A;
};

SHAPES.skyline = () => {
  const A = new Acc(), rnd = rngFor(7), ns = vnoise(3);
  const n = 11, cell = 1.5;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (rnd() < 0.08) continue;
    const x = (i - n / 2 + 0.5) * cell, z = (j - n / 2 + 0.5) * cell;
    const d = Math.hypot(x, z) / (n * cell * 0.5);
    const hh = 0.5 + Math.pow(ns(i * 0.55, j * 0.55), 2.2) * 7.5 * (1.25 - d * 0.8) + rnd() * 0.8;
    const w = 0.85 + rnd() * 0.4, dd = 0.85 + rnd() * 0.4;
    A.box([w, hh, dd], [x, hh / 2, z]);
    if (rnd() < 0.55 && hh > 2) { const h2 = hh * (0.25 + rnd() * 0.35); A.box([w * 0.66, h2, dd * 0.66], [x, hh + h2 / 2, z]); if (rnd() < 0.4) A.cyl(0.03, 0.04, 1.2 + rnd() * 1.2, [x, hh + h2 + 0.7, z], [0, 0, 0], 5, false, 3); }
    if (rnd() < 0.3) A.box([w * 1.1, 0.1, dd * 1.1], [x, hh * 0.5, z]);
  }
  A.box([n * cell + 1, 0.22, n * cell + 1], [0, -0.11, 0]);
  return A;
};

SHAPES.stack = () => {
  const A = new Acc();
  const rr = (w, d, r) => { const s = new T.Shape(); const x = -w / 2, y = -d / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const widths = [7.4, 6.5, 5.6, 4.7, 3.8], rnd = rngFor(11);
  widths.forEach((w, i) => {
    const y = i * 1.15, tw = i * 0.2, d = w * 0.78;
    const g = new T.ExtrudeGeometry(rr(w, d, 0.5), { depth: 0.55, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 6 });
    g.rotateX(-PI / 2);
    A.add(g, mat([0, y, 0], [0, tw, 0]));
    const m = mat([0, y + 0.62, 0], [0, tw, 0]);
    const cols = Math.floor(w / 0.85) - 1, rows = Math.floor(d / 0.85) - 1;
    for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) {
      if (rnd() < 0.35) continue;
      const bx = (a - (cols - 1) / 2) * 0.85, bz = (b - (rows - 1) / 2) * 0.85, hh = 0.1 + rnd() * 0.2;
      const gg = new T.BoxGeometry(0.55, hh, 0.55); gg.translate(bx, hh / 2 - 0.1, bz);
      A.add(gg, m, 1);
    }
    for (let a = 0; a < 7; a++) { const gg = new T.BoxGeometry(0.4, 0.09, 0.12); gg.translate((a - 3) * 0.55 * (w / 6), 0.25, d / 2 + 0.02); A.add(gg, mat([0, y, 0], [0, tw, 0])); }
  });
  for (const [x, z] of [[-1.4, -1], [1.4, -1], [1.4, 1], [-1.4, 1]]) A.strut([x, -0.2, z], [x, 4.6 + 0.9, z], 0.12, 2, 10);
  return A;
};

SHAPES.bridge = () => {
  const A = new Acc();
  const L = 9.5, tx = 5.2, th = 5.6;
  A.box([L * 2, 0.24, 1.3], [0, 0, 0]);
  for (const z of [-0.62, 0.62]) { A.box([L * 2, 0.38, 0.1], [0, -0.3, z]); A.box([L * 2, 0.07, 0.05], [0, 0.45, z], [0, 0, 0], 3); }
  for (let x = -L; x < L; x += 0.9) { A.strut([x, -0.25, -0.62], [x + 0.9, -0.25, 0.62], 0.03, 3); }
  for (const s of [-1, 1]) {
    const X = s * tx;
    for (const z of [-0.78, 0.78]) A.box([0.4, th + 1.6, 0.36], [X, th / 2 - 0.8, z]);
    for (const y of [1.9, 3.7, th - 0.1]) A.box([0.3, 0.3, 1.9], [X, y, 0]);
    A.box([0.9, 1.5, 2.3], [X, -1.4, 0]);
    A.box([0.8, 1.1, 1.8], [s * (L + 0.3), -0.6, 0]);
  }
  const yc = (x) => {
    const ax = Math.abs(x);
    if (ax <= tx) return 0.9 + (th - 0.15 - 0.9) * Math.pow(ax / tx, 2);
    const t = (ax - tx) / (L - tx); return (th - 0.15) * (1 - t) + 0.5 * t - Math.sin(t * PI) * -0.5;
  };
  for (const z of [-0.78, 0.78]) {
    const pts = []; for (let x = -L; x <= L + 0.001; x += 0.5) pts.push(new T.Vector3(x, yc(x), z));
    A.add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 160, 0.075, 6), new T.Matrix4(), 3);
    for (let x = -L + 0.6; x < L; x += 0.5) { if (Math.abs(Math.abs(x) - tx) < 0.25) continue; A.strut([x, yc(x), z], [x, 0.1, z], 0.022, 5); }
  }
  A.box([L * 2.4, 0.1, 5], [0, -2.25, 0]);
  return A;
};

SHAPES.dome = () => {
  const A = new Acc();
  const prof = [], top = 4.6;
  for (let i = 0; i <= 40; i++) { const t = i / 40, th = t * 1.5; prof.push(new T.Vector2(3.0 * Math.cos(th) + 0.001, 2.6 + top * Math.sin(th) * (1 - 0.18 * t))); }
  A.add(new T.LatheGeometry(prof, 96), mat(), 1);
  for (let k = 0; k < 16; k++) {
    const a = k / 16 * PI * 2, pts = [];
    for (let i = 0; i <= 28; i++) { const t = i / 28 * 0.985, th = t * 1.5; const r = 3.0 * Math.cos(th) + 0.08; pts.push(new T.Vector3(Math.cos(a) * r, 2.6 + top * Math.sin(th) * (1 - 0.18 * t) + 0.02, Math.sin(a) * r)); }
    A.add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.07, 6), new T.Matrix4(), 3);
  }
  A.cyl(3.15, 3.25, 2.3, [0, 1.45, 0], [0, 0, 0], 72);
  A.tor(3.2, 0.15, [0, 2.65, 0], [PI / 2, 0, 0], 8, 72);
  A.tor(3.3, 0.12, [0, 0.35, 0], [PI / 2, 0, 0], 8, 72);
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * PI * 2;
    A.cyl(0.13, 0.13, 2.1, [3.38 * Math.cos(a), 1.5, 3.38 * Math.sin(a)], [0, 0, 0], 8, false, 2);
    if (k % 2 === 0) A.box([0.5, 1.1, 0.16], [3.2 * Math.cos(a), 1.5, 3.2 * Math.sin(a)], [0, -a + PI / 2, 0]);
  }
  A.cyl(4.1, 4.3, 0.4, [0, 0.0, 0], [0, 0, 0], 72); A.cyl(4.9, 5.1, 0.4, [0, -0.38, 0], [0, 0, 0], 72); A.cyl(5.7, 5.9, 0.4, [0, -0.76, 0], [0, 0, 0], 72);
  const ly = 2.6 + top * Math.sin(1.5) * (0.82) - 0.05;
  A.cyl(0.62, 0.7, 1.4, [0, ly + 0.7, 0], [0, 0, 0], 28);
  for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; A.strut([0.6 * Math.cos(a), ly + 0.05, 0.6 * Math.sin(a)], [0.6 * Math.cos(a), ly + 1.4, 0.6 * Math.sin(a)], 0.045, 3); }
  A.cyl(0.0, 0.8, 0.7, [0, ly + 1.75, 0], [0, 0, 0], 24);
  A.strut([0, ly + 2.0, 0], [0, ly + 3.0, 0], 0.04, 5); A.sph(0.16, [0, ly + 2.2, 0]);
  return A;
};

SHAPES.lighthouse = () => {
  const A = new Acc();
  const prof = []; for (let i = 0; i <= 20; i++) { const t = i / 20; prof.push(new T.Vector2(1.55 - 0.62 * t - 0.06 * Math.sin(t * PI), t * 7.2)); }
  A.add(new T.LatheGeometry(prof, 72));
  for (const y of [1.2, 3.0, 4.8]) { const r0 = 1.55 - 0.62 * (y / 7.2); A.cyl(r0 - 0.1, r0 - 0.04, 0.95, [0, y + 0.4, 0], [0, 0, 0], 48, false, 1); A.tor(r0 - 0.06, 0.04, [0, y + 0.88, 0], [PI / 2, 0, 0], 6, 48, 2); }
  A.cyl(1.55, 1.1, 0.3, [0, 7.3, 0], [0, 0, 0], 48);
  A.cyl(1.5, 1.5, 0.12, [0, 7.5, 0], [0, 0, 0], 48);
  A.tor(1.42, 0.045, [0, 8.15, 0], [PI / 2, 0, 0], 6, 64, 3);
  for (let k = 0; k < 24; k++) { const a = k / 24 * PI * 2; A.strut([1.42 * Math.cos(a), 7.55, 1.42 * Math.sin(a)], [1.42 * Math.cos(a), 8.15, 1.42 * Math.sin(a)], 0.03, 3); }
  const ly = 7.7;
  A.cyl(0.9, 0.9, 0.12, [0, ly, 0], [0, 0, 0], 32);
  for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2; A.strut([0.82 * Math.cos(a), ly, 0.82 * Math.sin(a)], [0.82 * Math.cos(a), ly + 1.35, 0.82 * Math.sin(a)], 0.05, 4); }
  A.cyl(0.9, 0.9, 0.12, [0, ly + 1.38, 0], [0, 0, 0], 32);
  A.cyl(0.38, 0.38, 0.8, [0, ly + 0.7, 0], [0, 0, 0], 20, false, 2);
  A.tor(0.38, 0.05, [0, ly + 0.7, 0], [PI / 2, 0, 0], 6, 24, 2);
  A.cyl(0.02, 1.05, 0.95, [0, ly + 1.95, 0], [0, 0, 0], 32);
  A.sph(0.14, [0, ly + 2.5, 0]); A.strut([0, ly + 2.5, 0], [0, ly + 3.0, 0], 0.03, 5);
  A.box([0.5, 0.95, 0.2], [0, 0.5, 1.5]);
  for (const y of [2.4, 4.2, 6.0]) A.box([0.22, 0.45, 0.1], [0, y, 1.5 - (y / 7.2) * 0.5]);
  A.box([2.4, 1.2, 1.9], [-2.7, 0.6, 0.4]); A.box([2.7, 0.18, 2.2], [-2.7, 1.3, 0.4]); A.box([0.5, 0.9, 0.5], [-3.2, 1.8, 0.4]);
  // rock
  const rg = new T.SphereGeometry(3.6, 64, 36); const ns = vnoise(5), p = rg.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + 0.18 * (ns(x * 0.8 + 9, z * 0.8) - 0.5) * 2 + 0.1 * (ns(x * 2.2, z * 2.2 + 4) - 0.5) * 2; p.setXYZ(i, x * f, y * f * 0.3, z * f); }
  rg.computeVertexNormals(); A.add(rg, mat([-0.2, -0.45, 0]));
  // beam
  A.add(new T.ConeGeometry(1.9, 12, 48, 1, true), mat([6.0 + 0.5, ly + 0.7, 0], [0, 0, PI / 2]), 0.13);
  return A;
};

SHAPES.terrain = () => {
  const A = new Acc(), n1 = vnoise(21), n2 = vnoise(77);
  const g = new T.PlaneGeometry(17, 17, 210, 210); g.rotateX(-PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), z = p.getZ(i);
    { const u = x / 8.5, v = z / 8.5; x = 8.5 * u * Math.sqrt(Math.max(0, 1 - v * v / 2)); z = 8.5 * v * Math.sqrt(Math.max(0, 1 - u * u / 2)); p.setX(i, x); p.setZ(i, z); }
    let h = 0, a = 1, f = 0.22;
    for (let o = 0; o < 5; o++) { const r = 1 - Math.abs(n1(x * f + 3.3, z * f + 1.1) * 2 - 1); h += a * r * r; a *= 0.5; f *= 2.05; }
    h += 0.5 * n2(x * 0.15, z * 0.15);
    const e = Math.max(0, 1 - Math.hypot(x, z) / 11.5);
    p.setY(i, h * 3.1 * (0.5 + 0.5 * e));
  }
  g.computeVertexNormals();
  A.add(g);
  return A;
};

SHAPES.lamp = () => {
  const A = new Acc(), Z = [PI / 2, 0, 0], X = [0, 0, PI / 2];
  // yoke, clamp and stage bar (fixed)
  for (const s of [-1, 1]) { A.box([0.22, 2.7, 0.6], [s * 1.75, 1.35, 0]); A.cyl(0.34, 0.34, 0.3, [s * 1.95, 0, 0], X, 20); A.cyl(0.14, 0.14, 0.7, [s * 2.3, 0, 0], X, 10); }
  A.box([4.0, 0.3, 0.7], [0, 2.7, 0]);
  A.cyl(0.42, 0.42, 0.9, [0, 3.15, 0], [0, 0, 0], 20);
  A.cyl(0.3, 0.3, 0.5, [0, 3.7, 0], X, 16); A.cyl(0.24, 0.24, 11, [0, 3.7, 0], X, 20);
  A.box([0.5, 0.2, 0.9], [0, 2.9, 0]);
  A.G = mat([0, 0, 0], [0.42, 0, 0]);
  A.cyl(1.3, 1.3, 2.9, [0, 0, -0.1], Z, 56);
  A.cyl(1.0, 1.25, 0.7, [0, 0, -1.9], Z, 40);
  A.cyl(0.5, 0.5, 0.5, [0, 0, -2.4], Z, 20);
  for (let k = 0; k < 8; k++) A.tor(1.31, 0.075, [0, 0, -1.3 + k * 0.28], [0, 0, 0], 8, 56, 1.4);
  A.tor(1.3, 0.2, [0, 0, 1.35], [0, 0, 0], 10, 56);
  A.cyl(1.12, 1.12, 0.1, [0, 0, 1.25], Z, 40, false, 1.5);
  A.tor(1.1, 0.06, [0, 0, 1.4], [0, 0, 0], 8, 48);
  for (const [px, py, rx, ry] of [[0, 1.75, -0.6, 0], [0, -1.75, 0.6, 0], [1.75, 0, 0, 0.6], [-1.75, 0, 0, -0.6]]) {
    const vert = px === 0;
    A.box(vert ? [2.1, 0.07, 1.1] : [0.07, 2.1, 1.1], [px, py, 1.95], vert ? [rx, 0, 0] : [0, ry, 0]);
    A.box(vert ? [2.1, 0.2, 0.07] : [0.2, 2.1, 0.07], [px, py * 1.06, 2.5], vert ? [rx, 0, 0] : [0, ry, 0]);
  }
  A.add(new T.ConeGeometry(2.7, 9, 56, 1, true), mat([0, 0, 1.4 + 4.5], [-PI / 2, 0, 0]), 0.1);
  A.G = null;
  return A;
};

SHAPES.arch = () => {
  const A = new Acc();
  const n = 17, ri = 3.0, ro = 4.3, d = 1.7;
  for (let k = 0; k < n; k++) {
    const a0 = PI * k / n, a1 = PI * (k + 1) / n, key = k === (n - 1) / 2;
    const sh = new T.Shape(), g = 0.012, ex = key ? 0.35 : 0;
    const pt = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
    const P = [pt(ri - (key ? 0.25 : 0), a0 + g), pt(ro + ex, a0 + g), pt(ro + ex, a1 - g), pt(ri - (key ? 0.25 : 0), a1 - g)];
    sh.moveTo(P[0][0], P[0][1]); for (let i = 1; i < 4; i++) sh.lineTo(P[i][0], P[i][1]);
    const geo = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }); geo.translate(0, 0, -d / 2);
    A.add(geo, mat([0, 4.5, 0]));
  }
  for (const s of [-1, 1]) {
    for (let c = 0; c < 9; c++) {
      A.box([2.4 + (c % 2) * 0.3, 0.5, d], [s * (3.65 + 0.9 + (c % 2) * 0.15), 0.25 + c * 0.5, 0]);
      A.box([2.0, 0.5, d], [s * (6.2 + (c % 2) * 0.3), 0.25 + c * 0.5, 0]);
    }
  }
  A.box([18, 0.5, 3.4], [0, -0.25, 0]); A.box([16, 0.4, 2.8], [0, -0.7, 0]);
  A.box([1.6, 0.2, d + 0.3], [0, 8.95, 0]);
  return A;
};

SHAPES.ribbon = () => {
  const A = new Acc();
  const R = 5;
  for (let r = 0; r < R; r++) {
    const ph = r * 0.5, wd = 0.55 + (r % 3) * 0.18;
    const nu = 220, nv = 6, pos = [], idx = [];
    const c = (u) => new T.Vector3((u - 0.5) * 18, Math.sin(u * 4.2 + ph) * 1.4 + (r - 2) * 0.55, Math.cos(u * 2.6 + ph * 1.4) * 1.3 + (r - 2) * 0.5);
    for (let i = 0; i <= nu; i++) {
      const u = i / nu, P = c(u), Tn = c(u + 0.002).sub(c(u - 0.002)).normalize();
      let B0 = new T.Vector3().crossVectors(Tn, new T.Vector3(0, 1, 0)); if (B0.length() < 0.2) B0 = new T.Vector3(0, 0, 1); B0.normalize();
      const N0 = new T.Vector3().crossVectors(Tn, B0), tau = u * 3.6 + ph * 1.2;
      const B = B0.clone().multiplyScalar(Math.cos(tau)).add(N0.multiplyScalar(Math.sin(tau)));
      for (let j = 0; j <= nv; j++) { const v = (j / nv * 2 - 1) * wd; pos.push(P.x + B.x * v, P.y + B.y * v, P.z + B.z * v); }
    }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + 1, c2 = a + nv + 1, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    A.add(g);
  }
  return A;
};

SHAPES.gate = () => {
  const A = new Acc();
  for (let k = 0; k < 6; k++) {
    const z = -k * 3.4, wob = (k % 2 ? 0.03 : -0.02);
    for (const s of [-1, 1]) {
      A.box([1.2, 6.2, 1.4], [s * 2.55, 3.1, z], [0, wob, 0]);
      for (let f = -1; f <= 1; f++) A.box([0.18, 5.8, 0.1], [s * 2.55 + f * 0.33, 3.1, z + 0.72], [0, wob, 0], 1);
      A.box([1.5, 0.3, 1.7], [s * 2.55, 0.15, z]);
    }
    A.box([6.9, 1.1, 1.7], [0, 6.75, z], [0, 0, wob]);
    A.box([7.3, 0.2, 1.9], [0, 7.4, z]);
  }
  A.box([9, 0.24, 24], [0, -0.12, -8.5]);
  for (let k = 0; k < 3; k++) A.box([8 - k * 0.0, 0.2, 1.2], [0, k * 0.2 - 0.2, 2.4 + (2 - k) * 1.0]);
  for (const x of [-1.2, 0, 1.2]) A.box([0.08, 0.02, 24], [x, 0.01, -8.5]);
  return A;
};

const cache = {};
export function buildShape(name, N) {
  const key = name + N;
  if (cache[key]) return cache[key];
  const acc = SHAPES[name]();
  const seed = [...name].reduce((s, c) => s * 31 + c.charCodeAt(0), 7);
  const out = sample(acc, N, seed, { pct: name === 'lighthouse' ? 0.9 : 0.97 });
  cache[key] = out;
  return out;
}
export const SHAPE_NAMES = Object.keys(SHAPES);
