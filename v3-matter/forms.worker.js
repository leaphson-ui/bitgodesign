/* Builds every point-body form off the main thread. Each form = N points (x,y,z,accent). */
const N = 230 * 230;
let seed = 7;
function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const PI = Math.PI, TAU = PI * 2, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt;
const R = (a, b) => a + (b - a) * rnd();
function acos(x) { return Math.acos(Math.max(-1, Math.min(1, x))); }

let parts = [], stack = [];
function xfPoint(p, T) {
  let x = p[0], y = p[1], z = p[2], t;
  if (T.rx) { const c = cos(T.rx), s = sin(T.rx); t = y * c - z * s; z = y * s + z * c; y = t; }
  if (T.ry) { const c = cos(T.ry), s = sin(T.ry); t = x * c + z * s; z = -x * s + z * c; x = t; }
  if (T.rz) { const c = cos(T.rz), s = sin(T.rz); t = x * c - y * s; y = x * s + y * c; x = t; }
  if (T.t) { x += T.t[0]; y += T.t[1]; z += T.t[2]; }
  p[0] = x; p[1] = y; p[2] = z; return p;
}
function add(area, f, o) {
  o = o || {};
  parts.push({ w: area * (o.d || 1), f, w1: o.w, T: stack.slice(), rej: o.rej });
}
function grp(T, fn) { stack.unshift(T); fn(); stack.shift(); }
const EW = .05;
function box(cx, cy, cz, sx, sy, sz, o) {
  o = o || {}; const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const ax = sy * sz, ay = sx * sz, az = sx * sy, tot = 2 * (ax + ay + az);
  const f = () => {
    let u = R(-1, 1), v = R(-1, 1), acc = false;
    if (rnd() < .2) { if (rnd() < .5) u = u < 0 ? -1 : 1; else v = v < 0 ? -1 : 1; acc = true; }
    const r = rnd() * tot; let p;
    if (r < 2 * ax) { const s = r < ax ? 1 : -1; p = [s * hx, v * hy, u * hz]; if (!acc && ((1 - Math.abs(v)) * hy < EW || (1 - Math.abs(u)) * hz < EW)) acc = true; }
    else if (r < 2 * ax + 2 * ay) { const s = r < 2 * ax + ay ? 1 : -1; p = [u * hx, s * hy, v * hz]; if (!acc && ((1 - Math.abs(u)) * hx < EW || (1 - Math.abs(v)) * hz < EW)) acc = true; }
    else { const s = r < 2 * ax + 2 * ay + az ? 1 : -1; p = [u * hx, v * hy, s * hz]; if (!acc && ((1 - Math.abs(u)) * hx < EW || (1 - Math.abs(v)) * hy < EW)) acc = true; }
    p[0] += cx; p[1] += cy; p[2] += cz; p[3] = acc ? .9 : R(.2, .38); return p;
  };
  add(tot, f, o);
}
function cyl(cx, cy, cz, r, h, axis, o) {
  o = o || {}; const lat = TAU * r * h, cap = o.nocap ? 0 : 2 * PI * r * r, tot = lat + cap;
  const f = () => {
    let p, acc = false;
    if (rnd() * tot < lat) { const a = R(0, TAU); let y = R(-h / 2, h / 2); if (rnd() < .16) { y = y < 0 ? -h / 2 : h / 2; acc = true; } p = [r * cos(a), y, r * sin(a)]; if (o.flute && sin(a * o.flute) > .86) acc = true; }
    else { const a = R(0, TAU), rr = r * sqrt(rnd()); p = [rr * cos(a), rnd() < .5 ? h / 2 : -h / 2, rr * sin(a)]; if (rr > r * .9) acc = true; }
    if (axis === 'x') p = [p[1], p[0], p[2]]; else if (axis === 'z') p = [p[0], p[2], p[1]];
    p[0] += cx; p[1] += cy; p[2] += cz; p[3] = acc ? .9 : R(.2, .38); return p;
  };
  add(tot, f, o);
}
function torus(cx, cy, cz, Rr, r, axis, o) {
  o = o || {}; const tot = 4 * PI * PI * Rr * r;
  const f = () => { const a = R(0, TAU), b = R(0, TAU); let p = [(Rr + r * cos(b)) * cos(a), r * sin(b), (Rr + r * cos(b)) * sin(a)];
    if (axis === 'z') p = [p[0], p[2], p[1]]; else if (axis === 'x') p = [p[1], p[0], p[2]];
    p[0] += cx; p[1] += cy; p[2] += cz; p[3] = o.w != null ? o.w : .55 + .3 * cos(b); return p; };
  add(tot, f, o);
}
function sph(cx, cy, cz, r, o) {
  o = o || {}; const tot = 4 * PI * r * r;
  const f = () => { const z = R(-1, 1), a = R(0, TAU), s = sqrt(1 - z * z); const p = [r * s * cos(a), r * z, r * s * sin(a)]; p[0] += cx; p[1] += cy; p[2] += cz;
    p[3] = o.w != null ? o.w : (o.lines ? (Math.abs(sin(a * 9)) < .09 || Math.abs(sin(z * 6.5)) < .09 ? .85 : .25) : R(.25, .5)); return p; };
  add(tot, f, o);
}
function ball(cx, cy, cz, r, o) {
  o = o || {}; const tot = 4 * PI * r * r * 1.4;
  const f = () => { const z = R(-1, 1), a = R(0, TAU), s = sqrt(1 - z * z), rr = r * (.55 + .45 * Math.cbrt(rnd())); const p = [rr * s * cos(a) + cx, rr * z + cy, rr * s * sin(a) + cz]; p[3] = Math.min(.8, .2 + (z + 1) * .3 + rnd() * .2); return p; };
  add(tot, f, o);
}
function cone(cx, cy, cz, r, h, o) {
  o = o || {}; const sl = sqrt(r * r + h * h), tot = PI * r * sl;
  const f = () => { const t = Math.sqrt(rnd()), a = R(0, TAU), rr = r * t; const p = [rr * cos(a) + cx, cy + h * (1 - t) - h / 2, rr * sin(a) + cz]; p[3] = o.w != null ? o.w : (t > .93 ? .9 : R(.2, .4)); return p; };
  add(tot, f, o);
}
function tri(cx, cy, cz, w, h, o) {
  o = o || {}; const tot = w * h / 2;
  const f = () => { const b = 1 - sqrt(rnd()); const p = [cx + (rnd() - .5) * w * (1 - b), cy + b * h, cz, 0]; p[3] = (b > .93 || (1 - b) * w < .12 || Math.abs(Math.abs(p[0] - cx) - (1 - b) * w / 2) < .08) ? .9 : R(.2, .35); return p; };
  add(tot, f, o);
}
function tube(a, b, r, o) {
  o = o || {}; const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1e-6;
  const d = [dx / L, dy / L, dz / L]; let u = Math.abs(d[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
  let n1 = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]]; const m = Math.hypot(...n1); n1 = n1.map(v => v / m);
  const n2 = [d[1] * n1[2] - d[2] * n1[1], d[2] * n1[0] - d[0] * n1[2], d[0] * n1[1] - d[1] * n1[0]];
  const tot = TAU * r * L;
  const f = () => { const t = rnd(), th = R(0, TAU), c = cos(th) * r, s = sin(th) * r; return [a[0] + dx * t + n1[0] * c + n2[0] * s, a[1] + dy * t + n1[1] * c + n2[1] * s, a[2] + dz * t + n1[2] * c + n2[2] * s, o.w != null ? o.w : .8]; };
  add(tot, f, o);
}
function curve(fn, t0, t1, r, o) {
  o = o || {}; let L = 0, prev = fn(t0); for (let i = 1; i <= 40; i++) { const q = fn(t0 + (t1 - t0) * i / 40); L += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]); prev = q; }
  const rf = typeof r === 'function' ? r : () => r; const rm = rf(.5);
  const tot = TAU * rm * L;
  const f = () => { const t = rnd(), tt = t0 + (t1 - t0) * t, p = fn(tt), q = fn(tt + (t1 - t0) * .004); let d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]]; const l = Math.hypot(...d) || 1; d = d.map(v => v / l);
    const u = Math.abs(d[1]) < .9 ? [0, 1, 0] : [1, 0, 0]; let n1 = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]]; const m = Math.hypot(...n1) || 1; n1 = n1.map(v => v / m);
    const n2 = [d[1] * n1[2] - d[2] * n1[1], d[2] * n1[0] - d[0] * n1[2], d[0] * n1[1] - d[1] * n1[0]]; const th = R(0, TAU), rr = rf(t), c = cos(th) * rr, s = sin(th) * rr;
    return [p[0] + n1[0] * c + n2[0] * s, p[1] + n1[1] * c + n2[1] * s, p[2] + n1[2] * c + n2[2] * s, o.w != null ? o.w : .8]; };
  add(tot, f, o);
}
function plane(cx, cy, cz, sx, sz, hf, o) {
  o = o || {}; const tot = sx * sz;
  const f = () => { const x = R(-sx / 2, sx / 2), z = R(-sz / 2, sz / 2), y = hf(x, z); return [cx + x, cy + y, cz + z, o.w != null ? o.w : Math.max(.15, Math.min(.85, .35 + y * (o.k || 2)))]; };
  add(tot, f, o);
}

/* ---------- forms ---------- */
function vault() {
  box(0, 3.1, 0, 7, .9, 1.3); box(0, -3.1, 0, 7, .9, 1.3); box(-3.1, 0, 0, .9, 5.3, 1.3); box(3.1, 0, 0, .9, 5.3, 1.3);
  cyl(0, 0, .35, 2.35, .55, 'z'); torus(0, 0, .65, 2.35, .14, 'z'); torus(0, 0, .7, 1.55, .09, 'z');
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; cyl(1.95 * cos(a), 1.95 * sin(a), .75, .13, .22, 'z', { d: 1.6 }); }
  cyl(0, 0, 1.0, .4, .5, 'z', { d: 1.4 });
  for (let i = 0; i < 3; i++) { const a = PI / 2 + i / 3 * TAU, e = [1.2 * cos(a), 1.2 * sin(a), 1.05]; tube([0, 0, 1.05], e, .09, { w: .85 }); sph(e[0], e[1], e[2], .2, { w: .85, d: 1.4 }); }
  cyl(-3.1, 1.6, .85, .2, .9, 'y', { d: 1.4 }); cyl(-3.1, -1.6, .85, .2, .9, 'y', { d: 1.4 });
  box(2.6, 0, .6, .5, .9, .3, { d: 1.6 });
}
function desk() {
  box(0, -1.2, 0, 9, .25, 3.2); box(-4.2, -2.6, 0, .3, 2.6, 2.8); box(4.2, -2.6, 0, .3, 2.6, 2.8);
  const mon = (w, h, cn) => { box(0, 0, 0, w, h, .16); for (let i = 0; i < cn; i++) { const x = -w / 2 + .35 + i * (w - .7) / (cn - 1), ch = R(.25, h * .55), up = rnd() < .55; box(x, -h / 2 + .3 + ch / 2 + R(0, .4), .14, .13, ch, .08, { d: 2.2, w: up ? .95 : .55 }); } };
  grp({ t: [0, 1.6, -.5] }, () => mon(3.8, 2.4, 16)); box(0, -.1, -.5, .3, 1.5, .3); box(0, -.9, -.5, 1.2, .1, .8);
  grp({ ry: .55, t: [-3.9, 1.4, .1] }, () => mon(3, 2, 11)); grp({ ry: -.55, t: [3.9, 1.4, .1] }, () => mon(3, 2, 11));
  box(-3.9, -.15, .1, .25, 1.3, .25); box(3.9, -.15, .1, .25, 1.3, .25);
  box(0, -1.02, 1.0, 3, .1, 1);
  box(0, -2.1, 3.4, 2, .3, 2); box(0, -.7, 4.3, 2, 2.3, .3); cyl(0, -3.2, 3.4, .15, 2, 'y'); torus(0, -4.2, 3.4, 1.1, .07, 'y');
}
function tower() {
  const tiers = [[3.6, 5, 3.2], [3.1, 3, 2.8], [2.6, 2.6, 2.4], [2.1, 2, 2]]; let y = 0;
  tiers.forEach(([w, h, d]) => { box(0, y + h / 2, 0, w, h, d); for (let k = .6; k < h; k += .55) box(0, y + k, d / 2 + .02, w - .12, .07, .02, { d: 2, w: .75 }); y += h; });
  const top = y;
  [[-.8, -.8], [.8, -.8], [-.8, .8], [.8, .8]].forEach(([a, b]) => box(a, top + 1.7, b, .14, 3.4, .14, { d: 1.8 }));
  for (let k = 0; k < 3; k++) box(0, top + .2 + k * 1.2, 0, 1.8, .1, 1.8, { d: 1.2 });
  box(0, top + 4.8, 0, .22, 5, .22); box(1.4, top + 6.3, 0, 5, .16, .22); box(-1.4, top + 6.3, 0, 1.6, .16, .22);
  box(-2.0, top + 6.0, 0, .55, .5, .4, { d: 1.6 }); tube([2.6, top + 6.2, 0], [2.6, top + 3.2, 0], .03, { w: .9 }); box(2.6, top + 3.1, 0, .5, .2, .3, { d: 1.6 });
  tube([0, top + 8, 0], [3.5, top + 6.3, 0], .025); tube([0, top + 8, 0], [-2.1, top + 6.3, 0], .025);
  box(-3.8, 3, -.4, 2, 6, 2.2); box(4.0, 4, -.6, 2.2, 8, 2.4); box(-6, 1.8, -1, 2, 3.6, 2); box(6.3, 2.2, -1, 2, 4.4, 2, { d: .8 });
  for (let k = .6; k < 6; k += .6) box(-3.8, k, .72, 1.8, .07, .02, { d: 2, w: .7 }); for (let k = .6; k < 8; k += .6) box(4.0, k, .62, 2, .07, .02, { d: 2, w: .7 });
  box(0, -.12, 0, 15, .24, 5, { d: .5 });
}
function bridge() {
  box(0, 0, 0, 14, .28, 1.3);
  const yc = x => { const ax = Math.abs(x); return ax > 3.3 ? 5.2 - Math.pow(ax - 3.3, 2) * (4.8 / 10.24) : 1.0 + 4.2 * Math.pow(x / 3.3, 2); };
  [-3.3, 3.3].forEach(tx => { [-.55, .55].forEach(z => box(tx, 2.3, z, .4, 5.2, .4)); [1.2, 2.9, 4.5].forEach(h => box(tx, h, 0, .3, .26, 1.4, { d: 1.5 })); box(tx, 5.35, 0, .5, .3, 1.5);
    [-.55, .55].forEach(z => { box(tx, 4.6, z, .5, 2.5, .08, { d: 1.2 }); }); box(tx, -1.5, 0, 1.3, 3.2, 1.7, { d: .8 }); });
  [-.55, .55].forEach(z => curve(x => [x, yc(x), z], -7, 7, .04, { w: .95 }));
  for (let x = -6.6; x <= 6.6; x += .42) { if (Math.abs(Math.abs(x) - 3.3) < .25) continue; [-.55, .55].forEach(z => tube([x, .14, z], [x, yc(x), z], .015, { w: .6 })); }
  plane(0, -1.7, 0, 15, 5, (x, z) => .13 * sin(x * 1.7 + z * 2.2) + .07 * sin(x * 3.1 - z * 1.3), { d: .5, k: 4 });
  box(-7.8, -.4, 0, 2.2, 1.6, 1.8, { d: .7 }); box(7.8, -.4, 0, 2.2, 1.6, 1.8, { d: .7 });
}
function bank() {
  box(0, -3.8, 0, 10.4, .4, 3.2); box(0, -3.4, 0, 9.8, .4, 2.8); box(0, -3.0, 0, 9.2, .4, 2.4);
  box(0, -.3, -.8, 8.2, 5.0, .3, { d: .8 });
  for (let i = 0; i < 6; i++) { const x = -3.5 + i * 1.4; cyl(x, -.5, .6, .34, 4.6, 'y', { flute: 14, nocap: true }); box(x, 1.95, .6, .95, .22, .95, { d: 1.4 }); box(x, -2.8, .6, .95, .22, .95, { d: 1.4 }); }
  box(0, 2.25, 0, 9.2, .6, 2.2); box(0, 2.9, 0, 9.4, .3, 2.3, { d: 1.2 });
  tri(0, 3.05, 1.0, 9.6, 2.0); tri(0, 3.05, -.2, 9.6, 2.0, { d: .7 });
  sph(0, 4.0, 1.1, .4, { lines: true, d: 1.4 });
  box(0, -1.6, 0, 1.5, 2.9, .1, { d: 1.4 });
}
function book() {
  for (let i = 0; i < 2; i++) for (let k = 0; k < 24; k++) { const h = 4.2 * Math.exp(-k * .1) * R(.7, 1) + .35; box((i ? 1 : -1) * (.3 + k * .3), h / 2 - 2, 0, .22, h, .8, { d: 1.2 }); }
  box(0, -2.1, 0, 15, .18, 1.4, { d: .8 });
  tube([0, -2, 0], [0, 3.6, 0], .06, { w: 1 }); sph(0, 3.7, 0, .16, { w: .95, d: 2 });
  curve(x => [x * 7, -2 + 3.9 * Math.exp(-Math.abs(x) * 2.2) + .08 * sin(x * 22), .5], -1, 1, .03, { w: .9 });
}
function hub() {
  sph(0, 0, 0, 1.1, { lines: true, d: 1.5 }); sph(0, 0, 0, .4, { w: .95, d: 2 });
  const pos = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU * 1.618, b = acos(-.85 + i * .19), rr = R(2.6, 3.4); pos.push([rr * sin(b) * cos(a), rr * cos(b), rr * sin(b) * sin(a)]); }
  pos.forEach((p, i) => { const r = R(.3, .55); sph(p[0], p[1], p[2], r, { lines: i % 2 == 0 }); tube([0, 0, 0], p, .035, { w: .8 });
    if (i % 3 == 0) { const q = [p[0] * 1.35 + R(-.4, .4), p[1] * 1.3, p[2] * 1.35 + R(-.4, .4)]; sph(q[0], q[1], q[2], .2, { w: .8, d: 1.5 }); tube(p, q, .025, { w: .7 }); } });
  torus(0, 0, 0, 3.1, .03, 'y', { w: .8 }); torus(0, 0, 0, 3.7, .03, 'z', { w: .6 });
}
function coins() {
  const stacks = [[-2.8, 13], [0, 8], [2.8, 5]];
  stacks.forEach(([x, n]) => { for (let i = 0; i < n; i++) cyl(x, -3 + i * .3, 0, 1.1, .2, 'y', { d: 1.1 }); });
  grp({ rx: .35, rz: -.25, t: [-2.8, 4.1, .4] }, () => { cyl(0, 0, 0, 1.1, .2, 'y', { d: 1.4 }); torus(0, .12, 0, .62, .04, 'y', { w: .95 }); });
  grp({ rx: 1.1, t: [1.6, -2.35, 2.4] }, () => { cyl(0, 0, 0, .95, .2, 'y'); torus(0, .12, 0, .5, .04, 'y', { w: .95 }); });
  plane(0, -3.25, 0, 10, 4, () => 0, { d: .4, w: .25 });
}
function key() {
  grp({ rz: .55 }, () => {
    torus(-3.4, 0, 0, 1.3, .2, 'z', { d: 1.3 }); torus(-3.4, 0, 0, 1.3, .06, 'z', { w: .95, d: .8 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3; sph(-3.4 + 2.05 * cos(a), 2.05 * sin(a), 0, .12, { w: .9, d: 1.6 }); }
    cyl(1.1, 0, 0, .26, 6, 'x'); torus(-1.4, 0, 0, .4, .12, 'x', { w: .85 });
    [[2.2, .9], [2.85, .6], [3.5, 1.1], [4.1, .5]].forEach(([x, h]) => box(x, -.25 - h / 2, 0, .34, h, .5, { d: 1.2 }));
    box(4.1, 0, 0, .3, .54, .54, { d: 1.2 });
  });
}
function phone() {
  box(0, 0, 0, 3.2, 6.4, .45, { d: 1.2 }); box(0, 2.6, .24, .8, .12, .04, { w: .8, d: 2 });
  box(0, 1.5, .26, 2.6, 1.0, .08, { d: 1.4 }); box(0, .05, .26, 2.6, 1.5, .08, { d: 1.4 });
  for (let i = 0; i < 9; i++) box(-1 + i * .25, -.4 + R(0, .3), .33, .1, R(.3, 1.0), .05, { d: 2.4, w: .9 });
  box(0, -1.9, .26, 2.6, .9, .08, { d: 1.4 });
  grp({ ry: -.45, t: [3.4, 1.6, 1.8] }, () => { box(0, 0, 0, 1.7, 1.7, .14, { d: 1.2 }); torus(0, 0, .1, .5, .07, 'z', { w: .95 }); });
  grp({ ry: .4, t: [-3.5, -.4, 2.2] }, () => { box(0, 0, 0, 1.7, 1.7, .14, { d: 1.2 }); for (let i = 0; i < 4; i++) box(-.5 + i * .33, -.2 + (.3 + i * .22) / 2 - .3, .1, .16, .3 + i * .22, .05, { w: .95, d: 2 }); });
  grp({ ry: -.3, t: [3.1, -2.2, 2.4] }, () => { box(0, 0, 0, 1.7, 1.7, .14, { d: 1.2 }); tube([-.5, .25, .1], [.5, .25, .1], .05, { w: .95 }); tube([.5, -.25, .1], [-.5, -.25, .1], .05, { w: .95 }); });
}
function skyline() {
  const specials = [-2.4, 1.6, -5.6]; let x = -9;
  while (x < 9.4) { const w = R(.7, 1.3); if (!specials.some(s => Math.abs(s - (x + w / 2)) < 1.2)) { const h = R(2.2, 6.2); const z = rnd() < .5 ? 0 : -1.3; box(x + w / 2, h / 2 - 3, z, w, h, 1.2, { d: z ? .7 : 1 }); if (!z) for (let k = .55; k < h; k += .5) box(x + w / 2, k - 3, .61, w - .1, .06, .02, { d: 2.2, w: .65 }); } x += w + .12; }
  let b = -3; const sx = -2.4; [[1.7, 4.6], [1.25, 1.1], [.85, 1.0], [.5, .8]].forEach(([w, h]) => { box(sx, b + h / 2, 0, w, h, w, { d: 1.2 }); for (let k = .5; k < h; k += .45) box(sx, b + k, w / 2 + .01, w - .1, .06, .02, { d: 2.4, w: .7 }); b += h; });
  tube([sx, b, 0], [sx, b + 2, 0], .05, { w: .95 });
  const cx = 1.6; box(cx, -3 + 2.9, 0, 1.2, 5.8, 1.2, { d: 1.2 }); for (let k = .5; k < 5.8; k += .45) box(cx, -3 + k, .61, 1.1, .06, .02, { d: 2.4, w: .7 });
  [[.62, .5], [.5, .45], [.38, .4], [.26, .4]].forEach(([r, h], i) => cyl(cx, 3.0 + i * .42, 0, r, h, 'y', { flute: 8, d: 1.4 })); tube([cx, 4.6, 0], [cx, 6.2, 0], .035, { w: .95 });
  const wx = -5.6; box(wx, .3, 0, 1.4, 6.6, 1.4, { d: 1.2 }); box(wx, 3.9, 0, 1.0, 1.0, 1.0); tube([wx, 4.4, 0], [wx, 7.4, 0], .04, { w: .95 }); for (let k = .5; k < 6.6; k += .45) box(wx, -3 + k, .71, 1.3, .06, .02, { d: 2.4, w: .7 });
  plane(0, -3.1, .3, 19, 3.5, (x, z) => .05 * sin(x * 2 + z * 3), { d: .6, w: .3 });
}
function lockers() {
  const cols = 5, rows = 4, cw = 1.5, ch = 1.15;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const x = (c - 2) * (cw + .12), y = (r - 1.5) * (ch + .12), open = c == 3 && r == 2;
    if (open) { grp({ t: [x, y, 1.4] }, () => { box(0, 0, 0, cw, ch, .12, { d: 1.2 }); box(0, 0, -.7, cw - .1, .08, 1.4, { d: .8 }); box(-cw / 2 + .05, 0, -.7, .08, ch - .1, 1.4, { d: .6 }); box(cw / 2 - .05, 0, -.7, .08, ch - .1, 1.4, { d: .6 }); for (let i = 0; i < 3; i++) box(0, -.2 + i * .1, -.5 - i * .1, .8, .06, .4, { w: .95, d: 2 }); }); box(x, y, -.3, cw, ch, .12, { d: .4 }); }
    else { box(x, y, 0, cw, ch, .5); box(x + cw * .3, y, .26, .3, .1, .08, { w: .9, d: 2 }); sph(x - cw * .25, y + .15, .27, .06, { w: .9, d: 3 }); }
  }
  box(0, 0, -.5, 9.2, 6.2, .3, { d: .6 });
}
function tree() {
  curve(t => [.25 * sin(t * 3), -3 + t * 3.6, .1 * sin(t * 2)], 0, 1, t => .5 * (1 - t * .7) + .08, { d: 1.2 });
  const br = [[-1.6, 2.2, .2], [1.7, 2.4, -.3], [0, 3.0, 0], [-.6, 2.0, 1.3], [.9, 1.9, 1.3]];
  br.forEach((e, i) => { const s = [0, .3 + i * .15, 0]; curve(t => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t + Math.sin(t * PI) * .5, s[2] + (e[2] - s[2]) * t], 0, 1, t => .16 * (1 - t) + .03); });
  [[-1.8, 2.7, .2, 1.5], [1.8, 2.9, -.3, 1.6], [0, 3.7, 0, 1.7], [-.7, 2.5, 1.4, 1.2], [1, 2.4, 1.4, 1.2], [0, 2.6, -1, 1.3]].forEach(([x, y, z, r]) => ball(x, y, z, r, { d: 1.3 }));
  for (let i = 1; i <= 5; i++) torus(0, -3.05, 0, i * .75, .025, 'y', { w: .75, d: 1.2 });
}
function ship() {
  [[0, 9.6, 2.2], [.3, 10.2, 2.7], [.6, 10.6, 3.0]].forEach(([y, l, w], i) => box(0, y - 1.5 + i * .01, 0, l, .35, w, { d: 1.2 }));
  tri(5.6, -1.5, 0, 1.4, .9, { d: .6 }); box(4.7, -.6, 0, 1.0, .5, 2.4, { d: .8 });
  const cols = [-4, -2.8, -1.6, -.4, .8, 2];
  cols.forEach((x, i) => { for (let k = 0; k < 2 + (i % 3); k++) for (const z of [-.6, .6]) box(x, -1.1 + k * .55, z, 1.05, .5, .95, { d: 1.2 }); });
  box(-5, .2, 0, 1.1, 2.6, 2.2); for (let k = 0; k < 4; k++) box(-5, .2 + k * .5, 1.12, .95, .08, .02, { w: .8, d: 2 });
  tube([-5, 1.5, 0], [-5, 2.6, 0], .04, { w: .9 });
  box(4.3, 1.5, 0, .22, 4.4, .22); box(5.6, 3.6, 0, 3, .15, .22); tube([5.6, 3.5, 0], [5.6, 2.3, 0], .025, { w: .9 });
  plane(0, -1.8, 0, 16, 6, (x, z) => .16 * sin(x * 1.4 + z * 1.2) + .08 * sin(x * 2.9 - z * 2.1), { d: .6, k: 3 });
}
function clock() {
  torus(0, 0, 0, 3.0, .17, 'z', { d: 1.2 }); torus(0, 0, 0, 3.55, .05, 'z', { w: .7 });
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, big = i % 6 == 0; grp({ rz: -a }, () => box(0, 2.55, 0, big ? .2 : .1, big ? .6 : .32, .12, { d: 1.6, w: big ? .9 : undefined })); }
  cyl(0, 0, -.05, 2.9, .08, 'z', { d: .35 });
  box(0, .9, .22, .22, 1.8, .1, { w: .97, d: 2.2 }); box(0, 1.35, .34, .13, 2.7, .08, { w: .99, d: 2.2 }); sph(0, 0, .3, .22, { w: .95, d: 2 });
}
function chain() {
  for (let i = 0; i < 5; i++) { const x = -5.2 + i * 2.6, y = .9 * sin(i * 1.1), s = 1.7; grp({ ry: i % 2 ? .35 : -.35, t: [x, y, 0] }, () => { box(0, 0, 0, s, s, s); box(0, 0, 0, s * .45, s * .45, s * .45, { d: .8 }); for (let k = 0; k < 4; k++) box(-.5 + k * .33, .5, s / 2 + .02, .1, .12 + rnd() * .3, .02, { d: 2, w: .8 }); }); if (i < 4) { const nx = x + 2.6, ny = .9 * sin((i + 1) * 1.1); tube([x + .95, y, 0], [nx - .95, ny, 0], .06, { w: .95 }); } }
}
function padlock() {
  const rej = p => { const dx = p[0], dy = p[1] + .9; return p[2] > .5 && ((dx * dx + dy * dy < .12) || (Math.abs(dx) < .1 && dy < 0 && dy > -.9)); };
  box(0, -.9, 0, 4.2, 3.4, 1.5, { rej, d: 1.2 }); torus(0, -.9, .76, .5, .05, 'z', { w: .9 });
  curve(a => [1.3 * cos(a), .8 + 1.3 * sin(a) + .9, 0], 0, PI, .24, { d: 1.3 }); tube([-1.3, 1.7, 0], [-1.3, .8, 0], .24, { w: .5 }); tube([1.3, 1.7, 0], [1.3, 1.1, 0], .24, { w: .5 });
}
function armillary() {
  torus(0, 0, 0, 3, .06, 'y', { w: .85, d: 1.5 }); grp({ rx: 1.1 }, () => torus(0, 0, 0, 3, .06, 'y', { w: .85, d: 1.5 })); grp({ rz: 1.1 }, () => torus(0, 0, 0, 3, .06, 'y', { w: .85, d: 1.5 })); torus(0, 0, 0, 3, .06, 'z', { w: .85, d: 1.5 });
  torus(0, 0, 0, 3.6, .035, 'y', { w: .55 }); sph(0, 0, 0, 1.0, { lines: true, d: 1.5 });
  [[3, 0, 0], [0, 3, 0], [-2.1, 0, 2.1], [0, -2.1, 2.1]].forEach(p => sph(p[0], p[1], p[2], .2, { w: .95, d: 2 }));
}
function ingots() {
  const rows = [5, 4, 3, 2, 1];
  rows.forEach((n, r) => { for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 2.25, y = -3 + r * .75; for (const z of (r == 0 ? [-.6, .6] : [0])) { box(x, y, z, 2.0, .55, 1.0, { d: 1.2 }); box(x, y + .3, z, 1.6, .1, .65, { d: 1.6, w: .55 }); } } });
}
function rocket() {
  grp({ rz: -.5 }, () => {
    cyl(0, 0, 0, .85, 3.8, 'y', { d: 1.1 }); cone(0, 2.8, 0, .85, 1.9, { d: 1.1 });
    torus(0, .8, .86, .36, .08, 'z', { w: .95 }); torus(0, -1, 0, .86, .05, 'y', { w: .85 }); torus(0, 0, 0, .86, .05, 'y', { w: .85 });
    box(1.15, -1.7, 0, .2, 1.8, 1.0, { d: 1.2 }); box(-1.15, -1.7, 0, .2, 1.8, 1.0, { d: 1.2 }); box(0, -1.7, 1.15, 1.0, 1.8, .2, { d: 1.2 }); box(0, -1.7, -1.15, 1.0, 1.8, .2, { d: 1.2 });
    cone(0, -3.7, 0, .6, 2.2, { w: .92, d: 1.5 }); cone(0, -3.2, 0, .3, 1.5, { w: .9, d: 1 });
  });
  for (let i = 0; i < 14; i++) sph(R(-4, 4), R(-4, 3), R(-1, 1.5), .06, { w: .9, d: 2 });
}
function reel() {
  const rej = p => { if (Math.abs(p[2]) < .24) return false; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, dx = p[0] - 1.65 * cos(a), dy = p[1] - 1.65 * sin(a); if (dx * dx + dy * dy < .55) return true; } return p[0] * p[0] + p[1] * p[1] < .12; };
  cyl(0, 0, 0, 3, .5, 'z', { rej, d: 1.2 }); torus(0, 0, .26, 3, .06, 'z', { w: .9 }); torus(0, 0, .26, .6, .05, 'z', { w: .9 });
  cyl(0, 0, 0, .45, .7, 'z', { nocap: true, d: 1 });
  const path = t => [2.4 + t * 5.0, -2.2 - Math.sin(t * PI * .5) * 1.3 + t * .4, 0];
  const f = () => { const t = rnd(), p = path(t), e = rnd() < .2; const z = e ? (rnd() < .5 ? -.55 : .55) : R(-.55, .55); const sp = Math.abs(((t * 22) % 1) - .5) < .17 && Math.abs(z) > .35 && Math.abs(z) < .5; if (sp) return [p[0], p[1] + .02, z, .9]; return [p[0], p[1] + R(-.02, .02), z, e ? .9 : R(.2, .35)]; };
  add(6, f, { d: 1.3 });
}
function news() {
  grp({ rx: -.95, ry: -.3 }, () => {
    for (let i = 0; i < 7; i++) grp({ ry: i * .08, t: [0, i * .22 - 1.2, 0] }, () => box(0, 0, 0, 4.4, .1, 5.6));
    grp({ ry: .56, t: [0, 1.0 + .13, 0] }, () => {
      box(0, .06, -2.1, 3.6, .04, .5, { d: 2, w: .9 }); box(-.9, .06, -.2, 1.5, .04, 1.6, { d: 1.4, w: .6 });
      for (let c = 0; c < 2; c++) for (let l = 0; l < 7; l++) box(.5 + c * 1.2, .06, -1 + l * .45, 1.0, .03, .1, { d: 2.4, w: .65 });
      for (let l = 0; l < 4; l++) box(-.9, .06, .9 + l * .3, 1.8, .03, .08, { d: 2, w: .6 });
    });
  });
}
function sea() {
  plane(0, -1.2, 0, 17, 8, (x, z) => .3 * sin(Math.hypot(x * .8, z * 1.2 + 2) * 2.1) + .12 * sin(x * 1.3 + z), { d: 1.2, k: 3 });
  cyl(0, 1.2, -3.8, 2.0, .06, 'z', { d: 1.2 }); torus(0, 1.2, -3.8, 2.0, .05, 'z', { w: .9 });
  for (let i = 0; i < 5; i++) tube([-2.4 + i * 1.2, -.9, -3.6], [-2.4 + i * 1.2, .1 - Math.abs(i - 2) * .1, -3.6], .02, { w: .4 });
}
// 0 vault 1 desk 2 tower 3 bridge 4 bank 5 book 6 hub 7 coins 8 key 9 phone 10 skyline 11 lockers 12 tree 13 ship 14 clock 15 chain 16 padlock 17 armillary 18 ingots 19 rocket 20 reel 21 news 22 sea
const BUILD = [vault, desk, tower, bridge, bank, book, hub, coins, key, phone, skyline, lockers, tree, ship, clock, chain, padlock, armillary, ingots, rocket, reel, news, sea];
const WIDTH_AR = [1.15, 1.5, 1.2, 1.9, 1.5, 1.8, 1.2, 1.3, 1.9, 1.1, 2.4, 1.2, 1.2, 2.0, 1.2, 1.9, 1.2, 1.2, 1.5, 1.2, 1.6, 1.2, 2.2];
const HGT = [3.25, 3.25, 3.4, 3.1, 3.2, 3.0, 3.2, 3.2, 3.3, 3.3, 3.0, 3.1, 3.3, 3.0, 3.3, 3.1, 3.2, 3.3, 3.1, 3.4, 3.1, 3.1, 3.0];

function make(idx) {
  parts = []; stack = []; seed = 1000 + idx * 7919; BUILD[idx]();
  let tw = 0; parts.forEach(p => tw += p.w);
  const pts = new Float32Array(N * 4); let k = 0; const items = [];
  parts.forEach((p, pi) => {
    let n = Math.max(2, Math.round(N * p.w / tw)); if (pi == parts.length - 1) n = N - k; if (n < 0) n = 0;
    for (let i = 0; i < n && k < N; i++) {
      let q, tries = 0; do { q = p.f(); tries++; } while (p.rej && p.rej(q) && tries < 30);
      const w = q[3]; for (const T of p.T) xfPoint(q, T);
      q[3] = p.w1 != null ? p.w1 : w;
      items.push(q); k++;
    }
  });
  while (items.length < N) items.push(items[(rnd() * items.length) | 0].slice());
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (const q of items) for (let a = 0; a < 3; a++) { if (q[a] < mn[a]) mn[a] = q[a]; if (q[a] > mx[a]) mx[a] = q[a]; }
  const c = [0, 1, 2].map(a => (mn[a] + mx[a]) / 2), hx = (mx[0] - mn[0]) / 2, hy = (mx[1] - mn[1]) / 2;
  const s = HGT[idx] / Math.max(hy, hx / WIDTH_AR[idx]);
  for (const q of items) q.key = Math.floor((q[1] - c[1]) * s * 2.2) * 100 + (Math.atan2(q[2] - c[2], q[0] - c[0]) + PI) * 12;
  items.sort((a, b) => a.key - b.key);
  items.forEach((q, i) => { pts[i * 4] = (q[0] - c[0]) * s; pts[i * 4 + 1] = (q[1] - c[1]) * s; pts[i * 4 + 2] = (q[2] - c[2]) * s; pts[i * 4 + 3] = q[3]; });
  return pts;
}
onmessage = e => {
  for (const i of e.data.order) { const p = make(i); postMessage({ i, p }, [p.buffer]); }
};
