import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* One rail, one camera. Scroll position maps to distance d along the rail; every stop in the DOM
   carries a d value (data-d) and the world builds that stop's idea around that distance. */
(function () {
  const canvas = document.getElementById('gl');
  if (!canvas) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); } catch (e) { return; }
  if (!renderer.getContext()) return;

  const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const sm = (a, b, x) => { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const bump = (x, a, b, c, d) => sm(a, b, x) * (1 - sm(c, d, x));
  const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const Y = V(0, 1, 0);

  const NAVY = new THREE.Color('#040818'), BLUE = new THREE.Color('#1647DB');
  const bgCol = new THREE.Color(), clearCol = new THREE.Color();
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x040818, 28, 170);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 700);

  /* ---------- the path: integrated heading, one unit per step, so arc length is exact ---------- */
  const LEN = 1700, LOOP0 = 865, LOOP1 = 1000;
  const P = [], F = [];
  {
    let x = 0, y = 0, z = 0, th = 0;
    const loopRate = (Math.PI * 2) / (LOOP1 - LOOP0 - 10);
    for (let s = 0; s <= LEN + 2; s++) {
      const lw = sm(LOOP0, LOOP0 + 10, s) * (1 - sm(LOOP1 - 10, LOOP1, s));
      const meander = 0.0042 * Math.sin(s * 0.0105) + 0.003 * Math.sin(s * 0.0243 + 1.3) + 0.011 * Math.sin(s * 0.034) * (1 - sm(120, 230, s));
      th += meander * (1 - lw) + loopRate * lw;
      const ph = clamp(0.04 * Math.sin(s * 0.008 + 0.5) + lw * 0.055 - y * 0.0035, -0.12, 0.12);
      const f = V(Math.sin(th) * Math.cos(ph), Math.sin(ph), -Math.cos(th) * Math.cos(ph));
      P.push(V(x, y, z)); F.push(f);
      x += f.x; y += f.y; z += f.z;
    }
  }
  const FR = { p: V(0, 0, 0), f: V(0, 0, -1), r: V(1, 0, 0), u: V(0, 1, 0) };
  function at(s, o) {
    o = o || FR;
    s = clamp(s, 0, LEN - 0.01);
    const i = Math.floor(s), t = s - i;
    o.p.lerpVectors(P[i], P[i + 1], t);
    o.f.lerpVectors(F[i], F[i + 1], t).normalize();
    o.r.crossVectors(o.f, Y).normalize();
    o.u.crossVectors(o.r, o.f);
    return o;
  }
  const mk = () => ({ p: V(0, 0, 0), f: V(0, 0, 1), r: V(1, 0, 0), u: V(0, 1, 0) });
  // point at distance s, lateral x (right), vertical y
  const pt = (s, x, y, o) => { o = o || mk(); at(s, o); return o.p.clone().addScaledVector(o.r, x).addScaledVector(o.u, y); };

  /* ---------- line builder: one additive line material for the rail and every drawn form ---------- */
  const ID_RAIL = 30, ID_STATIC = 31;
  const COL = { blue: [0.09, 0.27, 0.95], sky: [0.3, 0.52, 1], white: [0.78, 0.88, 1], ice: [0.55, 0.72, 1] };
  function LB() { this.p = []; this.t = []; this.s = []; this.i = []; this.c = []; this.k = []; this.n = 0; this.v0 = 0; this.id = ID_STATIC; }
  LB.prototype.begin = function (id) { this.id = id; this.v0 = this.t.length; this.n = 0; };
  LB.prototype.seg = function (a, b, col, k, sa, sb) {
    this.p.push(a.x, a.y, a.z, b.x, b.y, b.z);
    this.t.push(this.n, this.n);
    const d = this.n * 0.45; this.n++;
    this.s.push(sa === undefined ? d : sa, sb === undefined ? d : sb);
    this.i.push(this.id, this.id);
    this.c.push(col[0], col[1], col[2], col[0], col[1], col[2]);
    this.k.push(k, k);
  };
  LB.prototype.end = function () { const n = Math.max(1, this.n); for (let j = this.v0; j < this.t.length; j++) this.t[j] /= n; };
  LB.prototype.poly = function (pts, close, col, k) { for (let i = 0; i < pts.length - (close ? 0 : 1); i++) this.seg(pts[i], pts[(i + 1) % pts.length], col, k); };
  const lb = new LB();

  // square-section line tube between sample arrays
  function tube(cp, rr, uu, hw, hh, col, k, ringEvery, ss) {
    const n = cp.length;
    const cn = (i, j, sc) => { const sx = [-1, 1, 1, -1][j], sy = [-1, -1, 1, 1][j]; return cp[i].clone().addScaledVector(rr[i], sx * hw * sc).addScaledVector(uu[i], sy * hh * sc); };
    let prev = [0, 1, 2, 3].map(j => cn(0, j, 1));
    for (let i = 1; i < n; i++) {
      const cur = [0, 1, 2, 3].map(j => cn(i, j, 1));
      const s0 = ss ? ss[i - 1] : undefined, s1 = ss ? ss[i] : undefined;
      for (let j = 0; j < 4; j++) lb.seg(prev[j], cur[j], col, k, s0, s1);
      if (i % ringEvery === 0) for (let j = 0; j < 4; j++) lb.seg(cur[j], cur[(j + 1) % 4], col, k * 0.8, s1, s1);
      prev = cur;
    }
  }

  /* main rail */
  const HW = 3.0, HH = 1.7;
  {
    const cp = [], rr = [], uu = [], ss = [];
    const o = mk();
    for (let s = 0; s <= LEN; s += 0.5) { at(s, o); cp.push(o.p.clone()); rr.push(o.r.clone()); uu.push(o.u.clone()); ss.push(s); }
    lb.begin(ID_RAIL);
    tube(cp, rr, uu, HW, HH, COL.blue, 1, 4, ss);
    // heavier ring with spokes every 20 units
    for (let s = 10; s < LEN; s += 20) {
      at(s, o);
      const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(a => o.p.clone().addScaledVector(o.r, a[0] * HW * 1.3).addScaledVector(o.u, a[1] * HH * 1.3));
      const c0 = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(a => o.p.clone().addScaledVector(o.r, a[0] * HW).addScaledVector(o.u, a[1] * HH));
      for (let j = 0; j < 4; j++) { lb.seg(c[j], c[(j + 1) % 4], COL.sky, 0.9, s, s); lb.seg(c0[j], c[j], COL.sky, 0.9, s, s); }
    }
    lb.end();
  }

  /* ---------- feature table: draw progress per id, driven by camera distance ---------- */
  const PR = new Float32Array(32).fill(0); PR[ID_RAIL] = 1; PR[ID_STATIC] = 1;
  const PRR = []; // [id, d0, d1]
  const prog = (id, a, b) => PRR.push([id, a, b]);

  /* core: five flows join the rail, converge on the BitGo point */
  const CORE0 = 360, CORE_STEP = 45, PT_S = 612;
  const flows = [];
  for (let k = 0; k < 5; k++) {
    const aD = CORE0 + k * CORE_STEP, J = aD + 36, side = k % 2 === 0 ? 1 : -1;
    const o = mk(); at(J - 34, o);
    const S0 = pt(J - 34, side * 27, (k % 3 - 1) * 3.5 + 1, o);
    const E = pt(J + 20, 0, 0);
    const fw = at(J, mk()).f;
    const curve = new THREE.CubicBezierCurve3(S0, S0.clone().addScaledVector(fw, 22), E.clone().addScaledVector(fw, -22).addScaledVector(at(J, mk()).r, side * 5), E);
    const cp = curve.getPoints(110), rr = [], uu = [], ss = [];
    const q = mk();
    cp.forEach((p, i) => { at(J - 34 + 54 * (i / 110), q); rr.push(q.r.clone()); uu.push(q.u.clone()); ss.push(i * 0.9); });
    lb.begin(k); tube(cp, rr, uu, 0.7, 0.45, COL.sky, 1.5, 3, ss); lb.end();
    prog(k, aD - 40, aD + 6);
    flows.push({ curve, id: k });
  }

  /* build: rail splits in three */
  const BR = 715;
  const branchPt = (s, sign, o) => { const l = 17 * sm(0, 50, s - BR) * sign; return pt(s, l, sign * 2.2 * sm(0, 50, s - BR), o); };
  const branches = [];
  [-1, 1].forEach((sign, bi) => {
    const cp = [], rr = [], uu = [], ss = [], o = mk(), q = mk();
    for (let s = BR; s <= BR + 160; s += 0.8) { cp.push(branchPt(s, sign, o)); at(s, q); rr.push(q.r.clone()); uu.push(q.u.clone()); ss.push(s); }
    lb.begin(5 + bi); tube(cp, rr, uu, 1.0, 0.6, COL.sky, 1.05, 4, ss); lb.end();
    prog(5 + bi, BR - 14, BR + 52);
    branches.push({ sign, cp });
  });

  const basis = (s, lx, ly) => { const o = mk(); at(s, o); return { o, T: (x, y, z) => o.p.clone().addScaledVector(o.r, lx + x).addScaledVector(o.u, ly + y).addScaledVector(o.f, z) }; };
  const rectLoop = (T, cx, cy, hw, hh, z, col, k) => lb.poly([T(cx - hw, cy - hh, z), T(cx + hw, cy - hh, z), T(cx + hw, cy + hh, z), T(cx - hw, cy + hh, z)], true, col, k);
  const boxEdges = (T, cx, cy, cz, hx, hy, hz, col, k) => {
    const c = [];
    for (let i = 0; i < 8; i++) c.push(T(cx + (i & 1 ? hx : -hx), cy + (i & 2 ? hy : -hy), cz + (i & 4 ? hz : -hz)));
    [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(e => lb.seg(c[e[0]], c[e[1]], col, k));
  };
  const circle = (T, cx, cy, cz, rad, n, col, k, a0, a1, plane) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n), c = Math.cos(a) * rad, s = Math.sin(a) * rad;
      pts.push(plane === 'xz' ? T(cx + c, cy, cz + s) : plane === 'yz' ? T(cx, cy + c, cz + s) : T(cx + c, cy + s, cz));
    }
    lb.poly(pts, false, col, k);
  };

  // Go Accounts: a stack of cards
  const FA = basis(BR + 52, -17, 2.2);
  lb.begin(7);
  for (let i = 0; i < 5; i++) {
    const z = i * 2.2, sh = i * 0.5;
    rectLoop(FA.T, 0, sh, 4.6, 2.9, z, i === 0 ? COL.white : COL.sky, i === 0 ? 1.3 : 1);
  }
  lb.poly([FA.T(-3.6, 0.9, 0), FA.T(-1.2, 0.9, 0)], false, COL.white, 1.2);
  lb.poly([FA.T(-3.6, -0.4, 0), FA.T(3.2, -0.4, 0)], false, COL.ice, 1);
  lb.poly([FA.T(-3.6, -1.4, 0), FA.T(1.4, -1.4, 0)], false, COL.ice, 1);
  rectLoop(FA.T, 2.9, 1.5, 0.9, 0.6, 0, COL.white, 1.2);
  lb.end(); prog(7, BR - 20, BR + 40);
  // Staking: bars climbing either side of the rail
  const FB = basis(BR + 90, 0, 0);
  lb.begin(8);
  for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 9; i++) {
    const hgt = 0.6 + i * 0.75, z = -14 + i * 3.6, x = side * (5.6 + (i % 2) * 0.8);
    boxEdges(FB.T, x, -2.2 + hgt / 2, z, 0.5, hgt / 2, 0.5, i > 6 ? COL.white : COL.sky, 1 + i * 0.03);
  }
  const top = []; for (let i = 0; i < 9; i++) top.push(FB.T(5.9, -2.2 + 0.6 + i * 0.75, -14 + i * 3.6));
  lb.poly(top, false, COL.white, 1.1);
  lb.end(); prog(8, BR + 10, BR + 62);
  // Go Network: ring of nodes joined in a mesh
  const FC = basis(BR + 128, 17, -2.2);
  lb.begin(9);
  {
    const nodes = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3; nodes.push([Math.cos(a) * 5, Math.sin(a) * 4.2]); }
    for (let i = 0; i < 10; i++) for (const d of [1, 3, 4]) { const j = (i + d) % 10; lb.seg(FC.T(nodes[i][0], nodes[i][1], 0), FC.T(nodes[j][0], nodes[j][1], 0), COL.sky, 0.85); }
    for (let i = 0; i < 10; i++) { lb.seg(FC.T(nodes[i][0], nodes[i][1], 0), FC.T(0, 0, 0), COL.ice, 0.7); boxEdges(FC.T, nodes[i][0], nodes[i][1], 0, 0.45, 0.45, 0.45, COL.white, 1.2); }
    boxEdges(FC.T, 0, 0, 0, 0.9, 0.9, 0.9, COL.white, 1.4);
  }
  lb.end(); prog(9, BR + 40, BR + 100);

  /* support: 24 hour circuit, a dial the rail runs around */
  const LC = V(0, 0, 0); let LR = 0;
  { let n = 0; for (let s = LOOP0 + 12; s <= LOOP1 - 12; s += 4) { LC.add(P[s]); n++; } LC.multiplyScalar(1 / n);
    for (let s = LOOP0 + 12; s <= LOOP1 - 12; s += 4) LR += Math.hypot(P[s].x - LC.x, P[s].z - LC.z); LR /= n; }
  lb.begin(15);
  {
    const ring = (rad, y, col, k) => { const pts = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2; pts.push(V(LC.x + Math.cos(a) * rad, LC.y + y, LC.z + Math.sin(a) * rad)); } lb.poly(pts, false, col, k); };
    ring(LR - 2.6, 0, COL.sky, 0.9); ring(3.2, 0, COL.white, 1.1); ring(LR * 0.55, 0, COL.blue, 0.7);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), major = i % 6 === 0;
      lb.seg(V(LC.x + c * 3.2, LC.y, LC.z + s * 3.2), V(LC.x + c * (LR - 2.6), LC.y, LC.z + s * (LR - 2.6)), major ? COL.sky : COL.blue, major ? 0.95 : 0.5);
      const o = mk(); const sIdx = LOOP0 + 12 + (i / 24) * (LOOP1 - LOOP0 - 24); at(sIdx, o);
      const len = major ? 4.2 : 1.8;
      lb.seg(o.p.clone().addScaledVector(o.u, HH * 1.1), o.p.clone().addScaledVector(o.u, HH * 1.1 + len), major ? COL.white : COL.ice, major ? 1.5 : 1);
      lb.seg(o.p.clone().addScaledVector(o.u, -HH * 1.1), o.p.clone().addScaledVector(o.u, -HH * 1.1 - len * 0.6), COL.ice, 0.8);
    }
    for (let i = 0; i <= 30; i++) lb.seg(V(LC.x, LC.y - 30 + i * 2, LC.z), V(LC.x, LC.y - 30 + i * 2 + 1.4, LC.z), COL.white, 1 + (1 - Math.abs(i - 15) / 15));
  }
  lb.end(); prog(15, 835, 905);

  /* own: five stations */
  const OWN0 = 1075, OWN_STEP = 45;
  const ownLook = [];
  for (let k = 0; k < 5; k++) {
    const aD = OWN0 + k * OWN_STEP, sS = aD + 26, lat = (k % 2 === 0 ? 1 : -1) * 11.5, ly = 1.5;
    const G = basis(sS, lat, ly), R0 = basis(sS - 6, 0, 0);
    lb.begin(10 + k);
    rectLoop(R0.T, 0, 0, 5.4, 3.5, 0, COL.sky, 1.1); rectLoop(R0.T, 0, 0, 6.2, 4.1, 0, COL.blue, 0.8);
    lb.seg(R0.T(0, 0, 0), G.T(0, -ly, 0), COL.blue, 0.5);
    if (k === 0) { // transparency: nested glass cubes
      boxEdges(G.T, 0, 0, 0, 4.6, 4.6, 4.6, COL.white, 1.1); boxEdges(G.T, 0, 0, 0, 3, 3, 3, COL.sky, 1); boxEdges(G.T, 0, 0, 0, 1.4, 1.4, 1.4, COL.white, 1.4);
      for (let i = -3; i <= 3; i++) lb.seg(G.T(-4.6, i * 1.3, 0), G.T(4.6, i * 1.3, 0), COL.ice, 0.45);
    } else if (k === 1) { // monetary freedom: a ring with the gap opened
      circle(G.T, 0, 0, 0, 4.8, 54, COL.white, 1.2, 0.5, Math.PI * 2 - 0.5, 'xy'); circle(G.T, 0, 0, 0, 3.2, 40, COL.sky, 1, 0.5, Math.PI * 2 - 0.5, 'xy');
      for (let i = 0; i < 5; i++) { const a = 0.15 - i * 0.07; lb.seg(G.T(5.2 + i * 1.3, Math.sin(a) * 2, 0), G.T(5.9 + i * 1.3, Math.sin(a) * 2.4, 0), COL.white, 1.2); }
      for (let i = 0; i < 5; i++) lb.seg(G.T(5.2 + i * 1.3, -Math.sin(0.15 - i * 0.07) * 2, 0), G.T(5.9 + i * 1.3, -Math.sin(0.15 - i * 0.07) * 2.4, 0), COL.white, 1.2);
    } else if (k === 2) { // borderless: globe
      for (let i = -3; i <= 3; i++) { const h = i * 1.2, r = Math.sqrt(Math.max(0, 4.8 * 4.8 - h * h)); circle(G.T, 0, h, 0, r, 40, i === 0 ? COL.white : COL.sky, i === 0 ? 1.3 : 0.9, 0, Math.PI * 2, 'xz'); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI; const pts = []; for (let j = 0; j <= 28; j++) { const b = j / 28 * Math.PI * 2; pts.push(G.T(Math.cos(a) * Math.cos(b) * 4.8, Math.sin(b) * 4.8, Math.sin(a) * Math.cos(b) * 4.8)); } lb.poly(pts, false, COL.sky, 0.8); }
      circle(G.T, 0, 0, 0, 6.6, 60, COL.white, 1.2, 0, Math.PI * 2, 'yz');
    } else if (k === 3) { // secure and scarce: a faceted crystal
      const t = (1 + Math.sqrt(5)) / 2, vs = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
      const es = []; for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) { const d = Math.hypot(vs[i][0] - vs[j][0], vs[i][1] - vs[j][1], vs[i][2] - vs[j][2]); if (Math.abs(d - 2) < 0.01) es.push([i, j]); }
      [[2.6, COL.white, 1.2], [1.4, COL.sky, 1], [0.55, COL.white, 1.5]].forEach(a => es.forEach(e => lb.seg(G.T(vs[e[0]][0] * a[0], vs[e[0]][1] * a[0], vs[e[0]][2] * a[0]), G.T(vs[e[1]][0] * a[0], vs[e[1]][1] * a[0], vs[e[1]][2] * a[0]), a[1], a[2])));
    } else { // innovation: blocks stacking up
      let n = 0;
      for (let row = 0; row < 5; row++) for (let i = 0; i < 5 - row; i++) { boxEdges(G.T, (i - (4 - row) / 2) * 2.1, -3.4 + row * 2.1, 0, 0.95, 0.95, 0.95, row > 2 ? COL.white : COL.sky, 1 + row * 0.1); n++; }
      boxEdges(G.T, 0, 3.4, 0, 0.6, 0.6, 0.6, COL.white, 1.5);
    }
    lb.end();
    prog(10 + k, aD - 44, aD + 8);
    ownLook.push({ a: aD, pos: G.T(0, 0, 0) });
  }

  /* spotlight: three screens; latest: arches, one per post */
  lb.begin(16);
  [[-9, 1330, 14], [10.5, 1345, -12], [-8, 1360, 12]].forEach((a, i) => {
    const G = basis(a[1] + 12, a[0], 1.5), yaw = a[2] * Math.PI / 180;
    const T = (x, y, z) => G.T(x * Math.cos(yaw) + z * Math.sin(yaw), y, -x * Math.sin(yaw) + z * Math.cos(yaw));
    rectLoop(T, 0, 0, 7.2, 4.1, 0, COL.white, 1.1); rectLoop(T, 0, 0, 7.8, 4.6, 0, COL.blue, 0.8);
    for (let j = -3; j <= 3; j++) lb.seg(T(-7.2, j * 1.0, 0), T(7.2, j * 1.0, 0), COL.sky, 0.28);
    lb.poly([T(-1, 1.5, 0), T(2, 0, 0), T(-1, -1.5, 0)], true, COL.white, 1.3);
  });
  lb.end(); prog(16, 1280, 1330);
  lb.begin(17);
  for (let i = 0; i < 4; i++) { const G = basis(1380 + i * 11, 0, 0); rectLoop(G.T, 0, 0, 5.2 + i * 0.5, 3.4 + i * 0.3, 0, COL.sky, 1.0 - i * 0.05); rectLoop(G.T, 0, 0, 5.9 + i * 0.5, 4 + i * 0.3, 0, COL.blue, 0.8); }
  lb.end(); prog(17, 1330, 1375);

  /* arrival: a tall gate, then frames receding into light */
  const GATE_S = 1470;
  lb.begin(18);
  for (let i = 0; i < 38; i++) { const s = GATE_S + 6 + i * 3.4, G = basis(s, 0, 0), sc = 1 - i * 0.012; rectLoop(G.T, 0, 0, 10.5 * sc, 6.4 * sc, 0, i % 3 === 0 ? COL.white : COL.ice, 0.9); }
  lb.end(); prog(18, 1395, 1445);
  // blue slabs lining the corridor: static trim
  lb.begin(ID_STATIC);
  const SLAB0 = 648, SLAB_N = 14, SLAB_STEP = 6;
  for (let i = 0; i < SLAB_N; i++) { const G = basis(SLAB0 + i * SLAB_STEP, 0, 0); rectLoop(G.T, 0, 0, 7.3, 4.5, 0, COL.white, 0.7); }
  lb.end();

  /* trust: link lines from the rail to each logo signal */
  const LOGO_S0 = 84, LOGO_STEP = 8;
  const logoPos = [];
  lb.begin(19);
  for (let i = 0; i < 14; i++) {
    const s = LOGO_S0 + i * LOGO_STEP, ang = (rnd(i + 3) - 0.5) * 1.5, rad = 8 + rnd(i) * 3.5;
    const side = i < 2 ? 1 : (i % 2 ? -1 : 1), x = side * (5 + Math.abs(Math.sin(ang)) * 2.4 + (i % 3) * 0.8), y = (i % 3 === 0 ? -1 : 1) * (1 + rnd(i + 9) * 2.4);
    logoPos.push({ s, x, y, pos: pt(s, x, y) });
    lb.seg(pt(s, Math.sign(x) * HW, y * 0.3), pt(s, x - Math.sign(x) * 2, y), COL.sky, 0.8);
  }
  lb.end(); prog(19, 40, 120);

  /* ---------- geometry + material ---------- */
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lb.p, 3));
  lineGeo.setAttribute('aT', new THREE.Float32BufferAttribute(lb.t, 1));
  lineGeo.setAttribute('aS', new THREE.Float32BufferAttribute(lb.s, 1));
  lineGeo.setAttribute('aId', new THREE.Float32BufferAttribute(lb.i, 1));
  lineGeo.setAttribute('aC', new THREE.Float32BufferAttribute(lb.c, 3));
  lineGeo.setAttribute('aK', new THREE.Float32BufferAttribute(lb.k, 1));
  const lineMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uProg: { value: PR }, uGain: { value: 1 }, uBlue: { value: 0 } },
    vertexShader: `attribute float aT; attribute float aS; attribute float aId; attribute vec3 aC; attribute float aK;
      uniform float uProg[32]; varying float vT; varying float vS; varying float vP; varying float vD; varying vec3 vC; varying float vK; varying float vId;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vD=-mv.z; vT=aT; vS=aS; vC=aC; vK=aK; vId=aId; vP=uProg[int(aId+0.5)]; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTime; uniform float uGain; uniform float uBlue; varying float vT; varying float vS; varying float vP; varying float vD; varying vec3 vC; varying float vK; varying float vId;
      void main(){
        if(vT>vP+0.0001) discard;
        float rail=step(29.5,vId)*step(vId,30.5);
        float head=(1.0-step(0.999,vP))*smoothstep(vP-0.09,vP,vT);
        float p=pow(max(0.0,sin(vS*0.3-uTime*2.4)),22.0);
        float q=pow(max(0.0,sin(vS*0.085-uTime*0.9+1.7)),9.0)*0.5;
        vec3 col=mix(vC,vec3(0.82,0.9,1.0),clamp(p*0.85+q*0.35+head,0.0,1.0));
        float k=vK*(0.42+p*1.0+q*0.4+head*1.6);
        k*=1.0+rail*0.5*smoothstep(PTS,PTS+26.0,vS);
        float fade=smoothstep(190.0,14.0,vD)*smoothstep(0.5,3.0,vD);
        gl_FragColor=vec4(col*k*fade*uGain,1.0);
      }`.replace(/PTS/g, PT_S.toFixed(1))
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  lines.frustumCulled = false;
  scene.add(lines);

  /* ---------- light packets riding the rail (camera-relative window) ---------- */
  const PK = 120, WIN = 170;
  const pkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const packets = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), pkMat, PK);
  packets.frustumCulled = false;
  const pk = [];
  for (let i = 0; i < PK; i++) pk.push({ u: rnd(i), sp: 5 + rnd(i + 5) * 9, w: 0.1 + rnd(i + 7) * 0.26, h: 0.08 + rnd(i + 9) * 0.18, l: 0.6 + rnd(i + 2) * 2.4, lx: rnd(i + 11) - 0.5, ly: rnd(i + 13) - 0.5, tint: 0.45 + rnd(i + 17) * 0.5 });
  const col = new THREE.Color();
  for (let i = 0; i < PK; i++) packets.setColorAt(i, col.setRGB(1, 1, 1));
  scene.add(packets);

  /* extra packets on flows, branches, network, dial */
  const EX = [];
  flows.forEach((f, k) => { for (let i = 0; i < 9; i++) EX.push({ fn: (u, o) => f.curve.getPoint(u, o), gate: () => PR[f.id] > 0.98 ? 1 : PR[f.id] * 0.0, drawId: f.id, u: i / 9, sp: 0.12 + rnd(i + k) * 0.05, w: 0.28, l: 1.7 }); });
  branches.forEach((b, bi) => { for (let i = 0; i < 9; i++) EX.push({ fn: (u, o) => { const j = Math.min(b.cp.length - 1, Math.floor(u * (b.cp.length - 1))); return o.copy(b.cp[j]); }, drawId: 5 + bi, u: i / 9, sp: 0.07 + rnd(i) * 0.03, w: 0.4, l: 2.2 }); });
  {
    const FN = basis(BR + 128, 17, -2.2);
    for (let i = 0; i < 6; i++) EX.push({ fn: (u, o) => { const a = u * Math.PI * 2 + 0.3; return o.copy(FN.T(Math.cos(a) * 5, Math.sin(a) * 4.2, 0)); }, drawId: 9, u: i / 6, sp: 0.1, w: 0.4, l: 0.8 });
    const FS = basis(BR + 90, 0, 0);
    for (let i = 0; i < 6; i++) EX.push({ fn: (u, o) => o.copy(FS.T((i % 2 ? 1 : -1) * 5.9, -1.6 + u * 6.2, -14 + u * 32)), drawId: 8, u: i / 6, sp: 0.08, w: 0.4, l: 1.4 });
  }
  for (let i = 0; i < 10; i++) EX.push({ fn: (u, o) => { const a = u * Math.PI * 2 + i; return o.set(LC.x + Math.cos(a) * (3.4 + (LR - 6) * ((i % 5) / 5 + 0.1)), LC.y, LC.z + Math.sin(a) * (3.4 + (LR - 6) * ((i % 5) / 5 + 0.1))); }, drawId: 15, u: i / 10, sp: 0.03 + (i % 5) * 0.006, w: 0.4, l: 0.6 });
  const XP = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), pkMat, EX.length);
  XP.frustumCulled = false;
  for (let i = 0; i < EX.length; i++) XP.setColorAt(i, col.setRGB(1, 1, 1));
  scene.add(XP);

  /* the BitGo point */
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.16, 'rgba(170,196,255,.78)'); g.addColorStop(.5, 'rgba(40,90,255,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  })();
  const spriteMat = (o) => new THREE.SpriteMaterial(Object.assign({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }, o));
  const PTV = pt(PT_S, 0, 0);
  const ptGlow = new THREE.Sprite(spriteMat({})); ptGlow.position.copy(PTV); scene.add(ptGlow);
  const ptCore = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })); ptCore.position.copy(PTV); scene.add(ptCore);
  const ptRing = []; for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(2 + i * 1.6, 0.04, 6, 64), new THREE.MeshBasicMaterial({ color: 0x8fb0ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); r.position.copy(PTV); at(PT_S); r.lookAt(PTV.clone().add(FR.f)); scene.add(r); ptRing.push(r); }
  const horizon = new THREE.Sprite(spriteMat({ opacity: 0.2 })); scene.add(horizon);
  const dialGlow = new THREE.Sprite(spriteMat({ opacity: 0.55 })); dialGlow.position.copy(LC); dialGlow.scale.set(9, 9, 1); scene.add(dialGlow);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.16), new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  scene.add(hand);

  /* gates: badges and arrival */
  const gateMat = () => new THREE.MeshBasicMaterial({ color: 0xaecbff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const gates = [];
  const makeGate = (s, hw, hh, bar) => {
    const m = gateMat(), g = new THREE.Group(), o = mk(); at(s, o);
    const bx = new THREE.BoxGeometry(1, 1, 1);
    [[0, hh, hw * 2 + bar, bar], [0, -hh, hw * 2 + bar, bar], [-hw, 0, bar, hh * 2], [hw, 0, bar, hh * 2]].forEach(a => { const b = new THREE.Mesh(bx, m); b.position.set(a[0], a[1], 0); b.scale.set(a[2], a[3], bar); g.add(b); });
    const mat4 = new THREE.Matrix4().makeBasis(o.r, o.u, o.f.clone().negate());
    g.quaternion.setFromRotationMatrix(mat4); g.position.copy(o.p);
    scene.add(g); gates.push({ s, m, hw }); return g;
  };
  [190, 230, 270].forEach(d => makeGate(d + 22, 6.4, 3.9, 0.3));
  makeGate(GATE_S, 11, 6.6, 0.7);
  // second, wider echo behind each badge gate
  [190, 230, 270].forEach(d => makeGate(d + 22 + 2.2, 7.4, 4.6, 0.12));

  /* blue slabs: the deliberate surface, a vaulted corridor in BitGo blue */
  const slabShape = new THREE.Shape();
  slabShape.moveTo(-90, -50); slabShape.lineTo(90, -50); slabShape.lineTo(90, 50); slabShape.lineTo(-90, 50); slabShape.lineTo(-90, -50);
  { const h = new THREE.Path(); h.moveTo(-7.3, -4.5); h.lineTo(-7.3, 4.5); h.lineTo(7.3, 4.5); h.lineTo(7.3, -4.5); h.lineTo(-7.3, -4.5); slabShape.holes.push(h); }
  const slabGeo = new THREE.ShapeGeometry(slabShape);
  const slabs = new THREE.Group(); scene.add(slabs);
  for (let i = 0; i < SLAB_N; i++) {
    const o = mk(); at(SLAB0 + i * SLAB_STEP, o);
    const m = new THREE.Mesh(slabGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? 0x0c2b9c : 0x1038b8, side: THREE.DoubleSide, fog: true }));
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(o.r, o.u, o.f.clone().negate())); m.position.copy(o.p);
    slabs.add(m);
  }

  /* trust logos as lit signals (sprites, drawn from the real client logo files) */
  const logoSprites = [];
  const logoSrc = (window.BITGO && window.BITGO.trust.logos) || [];
  logoSrc.forEach((src, i) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 192; const x = c.getContext('2d');
      const iw = img.naturalWidth || 300, ih = img.naturalHeight || 80, sc = Math.min(440 / iw, 130 / ih);
      x.drawImage(img, (512 - iw * sc) / 2, (192 - ih * sc) / 2, iw * sc, ih * sc);
      if (i !== 13) { x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 192); }
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, color: 0xb6ccff });
      const sp = new THREE.Sprite(m); const L = logoPos[i]; if (!L) return;
      sp.position.copy(L.pos); const w = 7.5; sp.scale.set(w, w * 192 / 512, 1); scene.add(sp);
      logoSprites[i] = { sp, m, s: L.s };
    };
    img.src = src;
  });

  /* dust: light motes along the whole journey, keeps every frame textured */
  {
    const N = 7000, pos = new Float32Array(N * 3), sz = new Float32Array(N), o = mk();
    for (let i = 0; i < N; i++) {
      const s = rnd(i * 3) * (LEN - 20), a = rnd(i * 3 + 1) * Math.PI * 2, r = 5 + Math.pow(rnd(i * 3 + 2), 0.7) * 34;
      at(s, o); const p = o.p.clone().addScaledVector(o.r, Math.cos(a) * r * 1.5).addScaledVector(o.u, Math.sin(a) * r * 0.8);
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; sz[i] = 0.5 + rnd(i * 7) * 1.5;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSz', new THREE.BufferAttribute(sz, 1));
    const dm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPx: { value: 1 }, uGain: { value: 1 } },
      vertexShader: `attribute float aSz; uniform float uPx; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); float d=-mv.z; vA=smoothstep(180.0,30.0,d)*smoothstep(1.0,8.0,d); gl_PointSize=clamp(aSz*70.0/max(d,1.0),1.0,3.5)*uPx; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform float uGain; varying float vA; void main(){ vec2 c=gl_PointCoord-0.5; float a=smoothstep(0.5,0.0,length(c)); gl_FragColor=vec4(vec3(0.35,0.55,1.0)*a*vA*0.55*uGain,1.0); }`
    });
    const pts = new THREE.Points(g, dm); pts.frustumCulled = false; scene.add(pts); scene.userData.dust = dm;
  }

  /* ---------- post ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.6, 0.34);
  composer.addPass(bloom);
  const rays = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uCenter: { value: new THREE.Vector2(0.5, 0.5) }, uStrength: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uCenter; uniform float uStrength; varying vec2 vUv;
      void main(){
        vec4 base=texture2D(tDiffuse,vUv);
        vec2 d=(uCenter-vUv)*(1.0/18.0)*0.85; vec2 c=vUv; float w=1.0; vec3 acc=vec3(0.0);
        for(int i=0;i<18;i++){ c+=d; vec3 s=texture2D(tDiffuse,c).rgb; float l=max(max(s.r,s.g),s.b); acc+=s*smoothstep(0.55,1.4,l)*w; w*=0.94; }
        gl_FragColor=vec4(base.rgb+acc*uStrength*0.03,1.0);
      }`
  });
  rays.enabled = false;
  composer.addPass(rays);
  composer.addPass(new OutputPass());

  /* ---------- sizing ---------- */
  let W = 1, H = 1, mobile = false;
  function resize() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    let pr = Math.min(window.devicePixelRatio || 1, 2);
    while (W * H * pr * pr > 5.2e6 && pr > 1) pr -= 0.25;
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    composer.setPixelRatio(pr); composer.setSize(W, H);
    bloom.resolution.set(W / 2, H / 2);
    mobile = W / H < 0.9;
    camera.aspect = W / H; camera.fov = mobile ? 62 : 50;
    scene.userData.dust.uniforms.uPx.value = pr;
    measure();
  }

  /* ---------- scroll -> distance along the rail ---------- */
  let AY = [], AD = [], SIDE = [];
  function measure() {
    const els = Array.prototype.slice.call(document.querySelectorAll('[data-d]'));
    const arr = els.map(e => { const r = e.getBoundingClientRect(); return [r.top + window.scrollY + r.height / 2, +e.dataset.d, e.dataset.side || 'C']; }).sort((a, b) => a[0] - b[0]);
    const endY = Math.max(arr.length ? arr[arr.length - 1][0] + 10 : 10, document.documentElement.scrollHeight - H / 2);
    arr.push([endY, 1494, 'C']);
    AY = arr.map(a => a[0]); AD = arr.map(a => a[1]);
    SIDE = arr.map(a => a[2] === 'L' ? 1 : a[2] === 'R' ? -1 : 0);
  }
  function dAt(y) {
    if (y <= AY[0]) return AD[0];
    for (let i = 0; i < AY.length - 1; i++) if (y < AY[i + 1]) return AD[i] + (AD[i + 1] - AD[i]) * (y - AY[i]) / Math.max(1, AY[i + 1] - AY[i]);
    return AD[AD.length - 1];
  }
  function sideAt(d) {
    if (d <= AD[0]) return SIDE[0];
    for (let i = 0; i < AD.length - 1; i++) if (d < AD[i + 1]) return SIDE[i] + (SIDE[i + 1] - SIDE[i]) * sm(AD[i], AD[i + 1], d);
    return SIDE[SIDE.length - 1];
  }

  /* keyframe curves along d */
  const kf = (t, d) => { if (d <= t[0][0]) return t[0][1]; for (let i = 0; i < t.length - 1; i++) if (d < t[i + 1][0]) return t[i][1] + (t[i + 1][1] - t[i][1]) * sm(t[i][0], t[i + 1][0], d); return t[t.length - 1][1]; };
  const OY = [[0, 6.5], [30, 6], [78, 0.6], [300, 0.55], [350, 3.4], [600, 3.4], [630, 0.8], [708, 0.8], [730, 3.2], [845, 3.2], [875, 7.5], [990, 7.5], [1025, 2.4], [1295, 2.4], [1325, 1.3], [1470, 0.9], [1700, 0.9]];
  const OX = [[0, -8], [30, -7], [78, 0], [850, 0], [885, 2.6], [985, 2.6], [1015, 0], [1700, 0]];
  const LEAD = [[0, 30], [40, 28], [80, 18], [850, 18], [885, 16], [985, 16], [1015, 20], [1700, 20]];
  const looks = [];
  [735, 775, 815].forEach((a, i) => looks.push({ a, pos: [FA, FB, FC][i].T(0, 0, 0), w: 0.8, lead: 26 }));
  ownLook.forEach(o => looks.push({ a: o.a, pos: o.pos, w: 0.55, lead: 26 }));

  /* ---------- loop ---------- */
  const camPos = V(0, 0, 0), camLook = V(0, 0, 0), tgtLook = V(0, 0, 0);
  const o1 = mk(), o2 = mk(), _m = new THREE.Matrix4(), _s = V(0, 0, 0), _p = V(0, 0, 0), _q = V(0, 0, 0), _t = V(0, 0, 0), _r = V(0, 0, 0), _u = V(0, 0, 0);
  let dT = 0, dS = 0, vel = 0, T = rm ? 6 : 0, first = true, shift = 0, ptStr = 0;
  const clock = new THREE.Clock();
  const dust = scene.userData.dust;

  window.__rail = { camera, logoSprites, logoPos, composer, bloom, rays, scene, renderer, lines, packets, XP };
  resize();
  window.addEventListener('resize', () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 120); });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if ('ResizeObserver' in window) new ResizeObserver(() => measure()).observe(document.body);

  function placeFlowCamera() { /* kept inline in frame() */ }

  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden || window.__freeze) return;
    const dt = Math.min(0.05, clock.getDelta());
    if (!rm) T += dt;
    dT = dAt(window.scrollY + H / 2);
    if (first || rm) { dS = dT; vel = 0; }
    else {
      const vt = clamp((dT - dS) * 2.6, -150, 150);
      vel += (vt - vel) * (1 - Math.exp(-dt * 5));
      dS += vel * dt;
    }
    const d = dS;

    // draw progress for each form
    for (let i = 0; i < PRR.length; i++) { const r = PRR[i]; PR[r[0]] = sm(r[1], r[2], d); }

    // background: navy, BitGo blue through the established vault and the arrival
    const blue = Math.max(bump(d, 620, 646, 670, 708), sm(1392, 1446, d));
    bgCol.copy(NAVY).lerp(BLUE, blue);
    renderer.setClearColor(clearCol.setRGB(bgCol.r, bgCol.g, bgCol.b, THREE.SRGBColorSpace), 1);
    scene.fog.color.copy(bgCol); scene.fog.near = 20 - blue * 4; scene.fog.far = 70 + 100 * sm(606, 640, d) + blue * 20;
    lineMat.uniforms.uTime.value = T; lineMat.uniforms.uGain.value = 1 - 0.42 * blue; dust.uniforms.uGain.value = 1 - 0.3 * blue;

    // camera
    const oy = kf(OY, d), ox = kf(OX, d), lead = kf(LEAD, d);
    at(d, o1); at(d + lead, o2);
    camPos.copy(o1.p).addScaledVector(o1.r, ox).addScaledVector(o1.u, oy);
    camPos.addScaledVector(o1.r, Math.sin(T * 0.23) * 0.22).addScaledVector(o1.u, Math.cos(T * 0.19) * 0.14);
    tgtLook.copy(o2.p).addScaledVector(o2.u, oy * 0.22).addScaledVector(o2.r, ox * 0.4);
    for (let i = 0; i < looks.length; i++) {
      const L = looks[i], w = L.w * bump(d, L.a - 24, L.a - 2, L.a + 14, L.a + 34);
      if (w > 0.001) tgtLook.lerp(L.pos, w);
    }
    if (first || rm) camLook.copy(tgtLook); else camLook.lerp(tgtLook, 1 - Math.exp(-dt * 3.2));
    camera.position.copy(camPos); camera.lookAt(camLook); camera.updateMatrixWorld();
    const sTarget = mobile ? 0 : sideAt(d) * 0.13;
    shift += (sTarget - shift) * (first || rm ? 1 : 1 - Math.exp(-dt * 2.4));
    camera.setViewOffset(W, H, -shift * W, mobile ? 0.14 * H : 0, W, H);
    camera.updateProjectionMatrix();

    // packets
    const ref = d - 14;
    for (let i = 0; i < PK; i++) {
      const o = pk[i];
      let s = ref + ((o.u * WIN + T * o.sp - ref) % WIN + WIN) % WIN;
      at(s, o2);
      const dist = s - d, fade = sm(WIN - 10, 40, dist) * sm(5, 18, dist);
      const boost = 1 + 1.4 * bump(d, 1370, 1385, 1420, 1440);
      _p.copy(o2.p).addScaledVector(o2.r, o.lx * HW * 1.3).addScaledVector(o2.u, o.ly * HH * 1.2);
      _m.makeBasis(o2.r, o2.u, o2.f); _s.set(o.w * fade, o.h * fade, o.l * boost * (0.4 + 0.6 * fade)); _m.scale(_s); _m.setPosition(_p);
      packets.setMatrixAt(i, _m);
      packets.setColorAt(i, col.setRGB(0.22 + o.tint * 0.22, 0.4 + o.tint * 0.28, 1).multiplyScalar(0.5 * fade * (1 - 0.35 * blue)));
    }
    packets.instanceMatrix.needsUpdate = true; packets.instanceColor.needsUpdate = true;

    for (let i = 0; i < EX.length; i++) {
      const e = EX[i], vis = sm(0.2, 0.9, PR[e.drawId]);
      const u = ((e.u + T * e.sp) % 1 + 1) % 1;
      e.fn(u, _p); e.fn((u + 0.012) % 1, _q); _t.subVectors(_q, _p);
      if (_t.lengthSq() < 1e-6) _t.set(0, 0, 1); _t.normalize();
      _r.crossVectors(_t, Y); if (_r.lengthSq() < 1e-4) _r.set(1, 0, 0); _r.normalize(); _u.crossVectors(_r, _t);
      const dd = _p.distanceTo(camPos), f = vis * sm(160, 50, dd) * sm(1.5, 6, dd);
      _m.makeBasis(_r, _u, _t); _s.set(e.w * f, e.w * f, e.l * f); _m.scale(_s); _m.setPosition(_p);
      XP.setMatrixAt(i, _m);
      XP.setColorAt(i, col.setRGB(0.34, 0.55, 1).multiplyScalar(0.8 * f * (1 - 0.3 * blue)));
    }
    XP.instanceMatrix.needsUpdate = true; XP.instanceColor.needsUpdate = true;

    // BitGo point
    const pd = PT_S - d, near = sm(5, 16, pd) * sm(-6, 2, pd);
    const conv = sm(CORE0 + 120, PT_S - 20, d);
    ptGlow.scale.setScalar((4 + conv * 4) * near + 0.001); ptGlow.material.opacity = (0.2 + conv * 0.4) * near;
    ptCore.scale.setScalar((0.45 + conv * 0.45) * near + 0.001);
    ptRing.forEach((r, i) => { r.scale.setScalar(near * (0.9 + 0.08 * Math.sin(T * 1.3 + i * 2)) + 0.001); r.material.opacity = 0.42 * near * conv; });
    // rays: only while the point is ahead and well in frame
    _p.copy(PTV).project(camera);
    const inFrame = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1 ? 1 : 0;
    ptStr += ((0.35 * conv * near * inFrame) - ptStr) * (rm ? 1 : 0.08);
    rays.enabled = ptStr > 0.01; rays.uniforms.uStrength.value = ptStr;
    rays.uniforms.uCenter.value.set(_p.x * 0.5 + 0.5, _p.y * 0.5 + 0.5);
    for (let i = 0; i < gates.length; i++) {
      const g = gates[i], gd = g.s - d, lit = 0.1 + 0.36 * (1 - sm(4, 52, Math.abs(gd))) * (gd > -6 ? 1 : sm(-30, -6, gd));
      g.m.opacity = lit * (1 - 0.25 * blue);
    }
    // dial
    at(d + 40, o2);
    const dl = bump(d, 820, 880, 990, 1040);
    dialGlow.material.opacity = 0.28 * dl; dialGlow.visible = dl > 0.01;
    const ha = T * 0.5;
    hand.visible = dl > 0.01; hand.scale.set(LR - 5.8, 1, 1); hand.position.set(LC.x + Math.cos(ha) * (LR - 5.8) / 2 + Math.cos(ha) * 3.2, LC.y, LC.z + Math.sin(ha) * (LR - 5.8) / 2 + Math.sin(ha) * 3.2); hand.rotation.y = -ha; hand.material.opacity = 0.7 * dl * PR[15];
    // horizon glow ahead of the camera
    at(d + 135, o2); horizon.position.copy(o2.p); horizon.scale.setScalar(52); horizon.material.opacity = 0.16 * (1 - 0.7 * blue);
    // slabs only matter near the vault
    slabs.visible = d > 596 && d < 790;
    // trust logos: a signal lights as the camera approaches, and passes
    for (let i = 0; i < logoSprites.length; i++) {
      const L = logoSprites[i]; if (!L) continue;
      const ld = L.s - d, v = sm(72, 34, ld) * sm(1, 9, ld);
      L.m.opacity = v * 0.9; L.sp.visible = v > 0.01;
      L.sp.scale.set(7.5 * (0.85 + 0.15 * v), 7.5 * 0.375 * (0.85 + 0.15 * v), 1);
    }
    bloom.strength = 0.5 + 0.2 * conv * near;
    composer.render();
    if (first) { first = false; document.documentElement.classList.add('gl-on'); }
  }
  frame();
})();
