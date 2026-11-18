// Procedural point-cloud forms. Every form samples N points (area weighted over a list of parts),
// is normalised to +-1, thickened into a thin crust, and sorted so that point i of one form sits
// near point i of the next (top to bottom, then by angle). No models are loaded.
const PI = Math.PI, TAU = PI * 2;

export function rng32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// R = Rx * Ry * Rz (z first, then y, then x)
function rotM(rx, ry, rz) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  return [cy * cz, -cy * sz, sy,
    cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy,
    sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy];
}

/* ---------- samplers: {area, fn(r,o)}; o = [x,y,z,nx,ny,nz]; fn may return false to reject ---------- */
function box(hx, hy, hz, reject) {
  const a = [8 * hy * hz, 8 * hx * hz, 8 * hx * hy];
  const tot = a[0] + a[1] + a[2];
  return {
    area: tot, fn(r, o) {
      let u = r() * tot, ax = 0;
      if (u > a[0]) { u -= a[0]; ax = 1; if (u > a[1]) ax = 2; }
      const s = r() < .5 ? -1 : 1, p = r() * 2 - 1, q = r() * 2 - 1;
      if (ax === 0) { o[0] = s * hx; o[1] = p * hy; o[2] = q * hz; o[3] = s; o[4] = 0; o[5] = 0; }
      else if (ax === 1) { o[0] = p * hx; o[1] = s * hy; o[2] = q * hz; o[3] = 0; o[4] = s; o[5] = 0; }
      else { o[0] = p * hx; o[1] = q * hy; o[2] = s * hz; o[3] = 0; o[4] = 0; o[5] = s; }
      return reject ? !reject(o) : true;
    }
  };
}
function cyl(R, h, opt = {}) { // axis y, centred
  const caps = opt.caps !== false, inward = !!opt.inward;
  const sa = TAU * R * h, ca = caps ? 2 * PI * R * R : 0, tot = sa + ca;
  return {
    area: tot, fn(r, o) {
      const t = r() * TAU;
      if (r() * tot < sa) {
        o[0] = R * Math.cos(t); o[1] = (r() - .5) * h; o[2] = R * Math.sin(t);
        const k = inward ? -1 : 1; o[3] = k * Math.cos(t); o[4] = 0; o[5] = k * Math.sin(t);
      } else {
        const rr = R * Math.sqrt(r()), s = r() < .5 ? -1 : 1;
        o[0] = rr * Math.cos(t); o[1] = s * h / 2; o[2] = rr * Math.sin(t); o[3] = 0; o[4] = s; o[5] = 0;
      }
    }
  };
}
function disc(rin, rout, ny = 1, reject) { // plane at y=0
  return {
    area: PI * (rout * rout - rin * rin), fn(r, o) {
      const t = r() * TAU, rr = Math.sqrt(rin * rin + r() * (rout * rout - rin * rin));
      o[0] = rr * Math.cos(t); o[1] = 0; o[2] = rr * Math.sin(t); o[3] = 0; o[4] = ny; o[5] = 0;
      return reject ? !reject(o) : true;
    }
  };
}
function torus(R, r0) {
  return {
    area: 4 * PI * PI * R * r0, fn(r, o) {
      for (; ;) {
        const th = r() * TAU, ph = r() * TAU;
        if (r() * (R + r0) > R + r0 * Math.cos(ph)) continue;
        const c = Math.cos(ph), s = Math.sin(ph);
        o[0] = (R + r0 * c) * Math.cos(th); o[1] = r0 * s; o[2] = (R + r0 * c) * Math.sin(th);
        o[3] = c * Math.cos(th); o[4] = s; o[5] = c * Math.sin(th); return true;
      }
    }
  };
}
function sphere(R, reject, w = 1) {
  return {
    area: 4 * PI * R * R * w, fn(r, o) {
      const u = r() * 2 - 1, t = r() * TAU, s = Math.sqrt(1 - u * u);
      const nx = s * Math.cos(t), ny = u, nz = s * Math.sin(t);
      o[0] = nx * R; o[1] = ny * R; o[2] = nz * R; o[3] = nx; o[4] = ny; o[5] = nz;
      return reject ? !reject(o) : true;
    }
  };
}
function lathe(prof) { // prof [[r,y],...] traversed so outward normal = (dy,-dr)
  const seg = [], cum = []; let tot = 0;
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    const len = Math.hypot(r1 - r0, y1 - y0); tot += PI * (r0 + r1) * len + 1e-4; cum.push(tot); seg.push([r0, y0, r1, y1, len]);
  }
  return {
    area: tot, fn(r, o) {
      const x = r() * tot; let k = 0; while (k < cum.length - 1 && cum[k] < x) k++;
      const [r0, y0, r1, y1, len] = seg[k];
      const t = r(), rr = r0 + (r1 - r0) * t, y = y0 + (y1 - y0) * t, a = r() * TAU;
      const nr = (y1 - y0) / (len || 1), ny = -(r1 - r0) / (len || 1);
      o[0] = rr * Math.cos(a); o[1] = y; o[2] = rr * Math.sin(a); o[3] = nr * Math.cos(a); o[4] = ny; o[5] = nr * Math.sin(a);
    }
  };
}
function param(f, u0, u1, v0, v1, flip = 1) { // generic surface, numeric normals, area-corrected
  const e = 1e-3, P = [0, 0, 0], A = [0, 0, 0], B = [0, 0, 0], C = [0, 0, 0], D = [0, 0, 0];
  const elem = (u, v) => {
    f(u + e, v, A); f(u - e, v, B); f(u, v + e, C); f(u, v - e, D);
    const ux = A[0] - B[0], uy = A[1] - B[1], uz = A[2] - B[2], vx = C[0] - D[0], vy = C[1] - D[1], vz = C[2] - D[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    return [nx, ny, nz, Math.hypot(nx, ny, nz)];
  };
  let mx = 0, sum = 0; const G = 28;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const el = elem(u0 + (u1 - u0) * (i + .5) / G, v0 + (v1 - v0) * (j + .5) / G)[3]; mx = Math.max(mx, el); sum += el;
  }
  const area = sum / (G * G) / (4 * e * e) * (u1 - u0) * (v1 - v0);
  return {
    area, fn(r, o) {
      const u = u0 + r() * (u1 - u0), v = v0 + r() * (v1 - v0), el = elem(u, v);
      if (r() * mx > el[3]) return false;
      f(u, v, P); o[0] = P[0]; o[1] = P[1]; o[2] = P[2];
      const l = el[3] || 1; o[3] = flip * el[0] / l; o[4] = flip * el[1] / l; o[5] = flip * el[2] / l; return true;
    }
  };
}

class Scene {
  constructor() { this.items = []; }
  add(s, { pos = [0, 0, 0], rot = [0, 0, 0], group = 0, w = 1 } = {}) {
    this.items.push({ s, M: rotM(rot[0], rot[1], rot[2]), pos, group, area: s.area * w }); return this;
  }
}

function noise3(x, y, z) { // value noise
  const h = (a, b, c) => { let n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return n - Math.floor(n); };
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const s = t => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(h(xi, yi, zi), h(xi + 1, yi, zi), u), L(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v),
    L(L(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), L(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v), w);
}
const fbm = (x, y, z) => noise3(x, y, z) * .55 + noise3(x * 2.1, y * 2.1, z * 2.1) * .3 + noise3(x * 4.3, y * 4.3, z * 4.3) * .15;

/* ---------- forms ---------- */
const F = {};

// SECURE: a vault door, front on, with bolt ring, hinges, spoked wheel and dial
F.vault = () => {
  const sc = new Scene(), Z = [PI / 2, 0, 0]; // lathe/cyl axis y -> z
  sc.add(lathe([[0, 0], [1.5, 0], [1.5, .4], [1.34, .44], [1.34, .6], [0, .6]]), { rot: Z, w: .5 }); // door slab (axis z after rot)
  sc.add(torus(1.0, .09), { pos: [0, 0, .62], rot: Z });                              // bolt ring
  sc.add(torus(1.28, .05), { pos: [0, 0, .58], rot: Z });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; // bolts around rim
    sc.add(cyl(.06, .34), { pos: [Math.cos(a) * 1.5, Math.sin(a) * 1.5, .2], rot: [0, 0, a + PI / 2] }); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + .13; // rivets
    sc.add(sphere(.055, null, 1), { pos: [Math.cos(a) * 1.22, Math.sin(a) * 1.22, .62] }); }
  sc.add(cyl(.46, .22), { pos: [0, 0, .72], rot: Z });                                // hub
  sc.add(cyl(.3, .12), { pos: [0, 0, .86], rot: Z });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .4; // spokes
    sc.add(cyl(.045, 1.05), { pos: [Math.cos(a) * .72, Math.sin(a) * .72, .78], rot: [0, 0, a - PI / 2] });
    sc.add(sphere(.1), { pos: [Math.cos(a) * 1.26, Math.sin(a) * 1.26, .78] }); }
  sc.add(torus(1.26, .055), { pos: [0, 0, .78], rot: Z });                            // wheel rim
  for (let i = 0; i < 3; i++) { const y = (i - 1) * .95; // hinges on the left
    sc.add(cyl(.17, .55), { pos: [-1.62, y, .15] });
    sc.add(box(.14, .14, .08), { pos: [-1.5, y, .35] }); }
  sc.add(box(1.9, .12, .6), { pos: [0, -1.7, .1], w: .5 });                                  // door frame base
  return { sc, rot: [.12, -.55, 0] };
};

// OPERATE: three meshing gears with hubs, spokes' lightening holes and a bracket plate
F.gears = () => {
  const sc = new Scene(), Z = [PI / 2, 0, 0];
  const gear = (R, n, ph, cx, cy, t, grp) => {
    const depth = R * .16, root = R - depth;
    const rad = a => root + depth * (() => { const s = Math.cos(n * (a - ph)); const x = Math.min(1, Math.max(0, (s + .35) / .7)); return x * x * (3 - 2 * x); })();
    const rin = R * .16, hubR = R * .3;
    const holes = []; const nh = n > 12 ? 6 : 5;
    for (let k = 0; k < nh; k++) { const a = k / nh * TAU + ph * .3; holes.push([Math.cos(a) * R * .6, Math.sin(a) * R * .6]); }
    const hr = R * .17;
    const face = (s) => ({
      area: PI * R * R * .9, fn(r, o) {
        const a = r() * TAU, rm = rad(a), q = Math.sqrt(rin * rin + r() * (rm * rm - rin * rin));
        const x = q * Math.cos(a), y = q * Math.sin(a);
        for (const h of holes) if ((x - h[0]) ** 2 + (y - h[1]) ** 2 < hr * hr) return false;
        if (q < hubR) return false;
        o[0] = x; o[1] = y; o[2] = s * t / 2; o[3] = 0; o[4] = 0; o[5] = s;
      }
    });
    const wall = {
      area: TAU * R * 1.1 * t, fn(r, o) {
        const a = r() * TAU, rm = rad(a), e = .002, r1 = rad(a + e), r0 = rad(a - e);
        const tx = r1 * Math.cos(a + e) - r0 * Math.cos(a - e), ty = r1 * Math.sin(a + e) - r0 * Math.sin(a - e), l = Math.hypot(tx, ty);
        o[0] = rm * Math.cos(a); o[1] = rm * Math.sin(a); o[2] = (r() - .5) * t; o[3] = ty / l; o[4] = -tx / l; o[5] = 0;
      }
    };
    const P = [cx, cy, 0];
    sc.add(face(1), { pos: P, group: grp }); sc.add(face(-1), { pos: P, group: grp }); sc.add(wall, { pos: P, group: grp });
    sc.add(cyl(hubR, t + .14), { pos: [cx, cy, 0], rot: Z });                         // hub boss (axis z)
    sc.add(cyl(rin, t + .14, { inward: true, caps: false }), { pos: [cx, cy, 0], rot: Z });
    sc.add(disc(rin, hubR, 1), { pos: [cx, cy, t / 2 + .07], rot: Z });
    sc.add(disc(rin, hubR, -1), { pos: [cx, cy, -t / 2 - .07], rot: Z });
    for (const h of holes) sc.add(cyl(hr, t, { inward: true, caps: false }), { pos: [cx + h[0], cy + h[1], 0], rot: Z });
    sc.add(cyl(rin * .75, t + .7), { pos: [cx, cy, 0], rot: Z });                     // axle through
  };
  const R1 = 1.15, R2 = .78, R3 = .56, n1 = 20, n2 = 14, n3 = 10, T = .27;
  const a12 = .62, ph1 = a12; const c2 = [Math.cos(a12) * (R1 + R2 - .17), Math.sin(a12) * (R1 + R2 - .17)];
  const ph2 = a12 + PI - PI / n2;
  const want = -.55, k = Math.round((want - ph2) / (TAU / n2)); const a23 = ph2 + k * TAU / n2;
  const c3 = [c2[0] + Math.cos(a23) * (R2 + R3 - .12), c2[1] + Math.sin(a23) * (R2 + R3 - .12)];
  const ph3 = a23 + PI - PI / n3;
  gear(R1, n1, ph1, 0, 0, T, 0); gear(R2, n2, ph2, c2[0], c2[1], T, 0); gear(R3, n3, ph3, c3[0], c3[1], T, 0);
  // back bracket plate and standoffs
  sc.add(box(1.4, 1.25, .04), { pos: [.75, .1, -.62], w: .25 });
  for (const [x, y] of [[-.9, 1.3], [2.4, 1.3], [-.9, -1.1], [2.4, -1.1]]) { sc.add(cyl(.09, .5), { pos: [x, y, -.38], rot: Z }); sc.add(cyl(.14, .06), { pos: [x, y, -.07 + .02], rot: Z }); }
  return { sc, rot: [.2, -.22, 0] };
};

// BUILD: a tower under construction, floors enclosed lower down, crane on top
F.tower = () => {
  const sc = new Scene(); const W = 1.0, dy = .62, nf = 7, H = dy * nf;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) sc.add(box(.09, H / 2, .09), { pos: [sx * W, H / 2, sz * W] });
  sc.add(box(.35, H / 2, .35), { pos: [0, H / 2, 0] });                               // core shaft
  for (let f = 0; f <= nf; f++) {
    const y = f * dy;
    for (const s of [-1, 1]) { sc.add(box(W, .05, .05), { pos: [0, y, s * W] }); sc.add(box(.05, .05, W), { pos: [s * W, y, 0] }); }
    if (f >= 1 && f <= 5) sc.add(box(W, .035, W), { pos: [0, y, 0] }, 1.2);           // floor slab
    if (f < nf && f < 5) { // glazed panels on lower floors
      for (const s of [-1, 1]) { sc.add(box(W - .09, dy / 2 - .03, .02), { pos: [0, y + dy / 2, s * W] }); sc.add(box(.02, dy / 2 - .03, W - .09), { pos: [s * W, y + dy / 2, 0] }); }
    } else if (f < nf) { // bare braces up high
      for (const s of [-1, 1]) {
        const L = Math.hypot(2 * W, dy); const a = Math.atan2(dy, 2 * W) * (f % 2 ? 1 : -1);
        sc.add(box(L / 2, .03, .03), { pos: [0, y + dy / 2, s * W], rot: [0, 0, a] });
        sc.add(box(.03, .03, L / 2), { pos: [s * W, y + dy / 2, 0], rot: [0, PI / 2, a] }); }
    }
  }
  const T = H;                                                                         // crane
  sc.add(box(.07, .8, .07), { pos: [-.5, T + .8, -.5] }); sc.add(box(.07, .8, .07), { pos: [-.5, T + .8, -.28] });
  sc.add(box(.07, .8, .07), { pos: [-.28, T + .8, -.5] }); sc.add(box(.07, .8, .07), { pos: [-.28, T + .8, -.28] });
  sc.add(box(1.9, .09, .12), { pos: [.75, T + 1.62, -.39] });                         // jib
  sc.add(box(.6, .1, .14), { pos: [-.95, T + 1.62, -.39] });                          // counter jib
  sc.add(box(.2, .22, .2), { pos: [-1.35, T + 1.4, -.39] });                          // counterweight
  sc.add(box(.015, .45, .015), { pos: [1.5, T + 1.35, -.39] });                       // cable
  sc.add(box(.14, .1, .14), { pos: [1.5, T + .85, -.39] });
  sc.add(box(.22, .1, .22), { pos: [0, T + .04, 0] });
  sc.add(box(1.5, .07, 1.5), { pos: [0, -.04, 0] }, 1.2);                              // base plinth
  return { sc, rot: [.2, -.55, 0] };
};

// TRUST: a tree-ring slab (years of growth)
F.rings = () => {
  const sc = new Scene(), R = 1, T = .36, nr = 13;
  const top = (s) => ({
    area: PI * R * R * 1.3, fn(r, o) {
      const a = r() * TAU, rad = Math.sqrt(r()) * R;
      if (((a + .4) % (TAU / 3)) < .05 * (1.1 - rad * .5)) return false;                 // radial checks
      const wob = .06 * Math.sin(a * 3 + rad * 5) + .035 * Math.sin(a * 7 + 1);
      const ph = TAU * nr * (rad + wob), c = Math.cos(ph);
      if (r() > .05 + .95 * Math.pow(.5 + .5 * c, 1.6)) return false;                                    // dense ridges, sparse grooves
      const sl = -.03 * TAU * nr * Math.sin(ph) * .5;
      const nx = -sl * Math.cos(a), nz = -sl * Math.sin(a), l = Math.hypot(nx, 1, nz);
      o[0] = rad * Math.cos(a); o[1] = s * (T / 2 + .03 * c * (s > 0 ? 1 : 0)); o[2] = rad * Math.sin(a);
      o[3] = nx / l * s; o[4] = s / l; o[5] = nz / l * s;
    }
  });
  sc.add(top(1)); sc.add(top(-1), { w: .5 });
  sc.add(cyl(R, T, { caps: false }), { w: 1.6 });
  sc.add(cyl(R * 1.04, T * .7, { caps: false }), { w: .6 });                          // bark ruff
  sc.add(disc(0, .09, 1), { pos: [0, T / 2 + .03, 0], w: 3 });                         // pith
  return { sc, rot: [1.05, .35, .2] };
};

// CORE: five stacked slabs, like floors or strata, one per service (group 0..4)
F.stack = () => {
  const sc = new Scene(), th = .15, gap = .17;
  const sl = [[1.25, 1.0, .0], [1.0, 1.15, .14], [1.15, .85, -.12], [.9, .9, .2], [.75, .7, -.08]]; // [hx, hz, yaw]
  sl.forEach(([hx, hz, yaw], k) => {
    const mid = k * (2 * th + gap) + th, top = mid + th, g = k, R = [0, yaw, 0];
    sc.add(box(hx, th, hz), { pos: [0, mid, 0], rot: R, group: g });
    const at = (x, y, z) => { const c = Math.cos(yaw), s = Math.sin(yaw); return [x * c + z * s, y, -x * s + z * c]; };
    if (k === 0) for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) sc.add(box(.1, th + .06, .1), { pos: at(a * (hx - .1), mid, b * (hz - .1)), rot: R, group: g });
    if (k === 1) for (let i = 0; i < 9; i++) sc.add(box(.045, .09, hz - .06), { pos: at(-hx + .2 + i * (2 * hx - .4) / 8, top + .09, 0), rot: R, group: g });
    if (k === 2) for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) sc.add(box(.14, .1 + ((i * 3 + j) % 3) * .05, .14), { pos: at(-hx * .6 + i * hx * .4, top + .1, -hz * .5 + j * hz * .5), rot: R, group: g });
    if (k === 3) { sc.add(box(hx * .6, .09, hz * .6), { pos: at(0, top + .09, 0), rot: R, group: g }); sc.add(box(hx * .3, .09, hz * .3), { pos: at(0, top + .27, 0), rot: R, group: g }); }
    if (k === 4) { sc.add(box(hx * .55, .16, hz * .55), { pos: at(0, top + .16, 0), rot: R, group: g }); sc.add(box(hx * .6, .03, hz * .6), { pos: at(0, top + .35, 0), rot: R, group: g }); }
  });
  return { sc, rot: [.3, .5, 0], groups: 5 };
};

// ESTABLISHED: a long stone viaduct
F.viaduct = () => {
  const sc = new Scene(), n = 6, sp = 1.0, pw = .3, rr = .5, H = 1.35, D = .36, W = n * sp + (n + 1) * pw;
  const cx = i => pw + sp / 2 + i * (sp + pw);
  const inOpen = (x, y) => { for (let i = 0; i < n; i++) if ((x - cx(i)) ** 2 + y * y < rr * rr) return true; return false; };
  const facade = s => ({
    area: W * H - n * PI * rr * rr / 2, fn(r, o) {
      const x = r() * W, y = r() * H; if (inOpen(x, y)) return false;
      // masonry courses: skip a thin line every .12
      if (((y / .12) % 1) < .07 && r() < .8) return false;
      o[0] = x - W / 2; o[1] = y; o[2] = s * D; o[3] = 0; o[4] = 0; o[5] = s;
    }
  });
  sc.add(facade(1)); sc.add(facade(-1));
  for (let i = 0; i < n; i++) {
    sc.add(param((u, v, p) => { p[0] = cx(i) - W / 2 + rr * Math.cos(u); p[1] = rr * Math.sin(u); p[2] = v; }, 0, PI, -D, D, -1));
    sc.add(param((u, v, p) => { p[0] = cx(i) - W / 2 + (rr + .09) * Math.cos(u); p[1] = (rr + .09) * Math.sin(u); p[2] = D + .02 * v; }, 0, PI, 0, 1));
    sc.add(box(.18, .06, D + .02), { pos: [cx(i) - W / 2, rr + .08, 0], w: .2 });
  }
  sc.add(box(W / 2 + .02, .05, D + .04), { pos: [0, H - .15, 0] });                    // string course
  sc.add(box(W / 2, .06, D), { pos: [0, H, 0], w: 1 });                                // deck
  for (const s of [-1, 1]) sc.add(box(W / 2, .14, .04), { pos: [0, H + .14, s * (D - .04)] }); // parapets
  for (let i = 0; i <= n; i++) sc.add(box(.07, .2, .07), { pos: [-W / 2 + .02 + i * (W - .04) / n, H + .2, D - .05] });
  sc.add(box(W / 2 + .1, .08, D + .15), { pos: [0, -.06, 0] });                        // footing
  return { sc, rot: [.16, -.2, 0] };
};

// BUILD (architect): a stepped ziggurat with stairs and a temple
F.ziggurat = () => {
  const sc = new Scene(), nt = 6, th = .32;
  for (let i = 0; i < nt; i++) {
    const h = 1.6 - .24 * i, hn = 1.6 - .24 * (i + 1), y = i * th + th / 2;
    sc.add(box(h, th / 2, h, o => o[4] < 0 || (o[4] > 0 && Math.abs(o[0]) < hn && Math.abs(o[2]) < hn && i < nt - 1)));
    // cornice
    sc.add(box(h + .03, .025, h + .03), { pos: [0, y + th / 2 - .02, 0], w: .5 });
  }
  // fix: boxes above are centred at origin; shift them
  sc.items.forEach((it, idx) => { });
  for (let j = 0; j < nt; j++) {
    const h = 1.6 - .24 * j;
    sc.add(box(.22, .16 * (j + 1), .13), { pos: [0, .16 * (j + 1), h + .13] });
    for (const s of [-1, 1]) sc.add(box(.04, .07 * (j + 1) + .08, .13), { pos: [s * .26, .07 * (j + 1) + .08 + .16 * j * .5, h + .13] });
  }
  const top = nt * th;
  sc.add(box(.5, .26, .5), { pos: [0, top + .26, 0] }); sc.add(box(.66, .05, .66), { pos: [0, top + .55, 0] });
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) sc.add(cyl(.05, .52), { pos: [a * .55, top + .27, b * .55] });
  // lift each tier into place
  sc.items.slice(0, nt * 2).forEach((it, k) => { const i = k >> 1; it.pos = [0, i * th + th / 2, 0]; });
  return { sc, rot: [.38, .62, 0] };
};

// 24/7: a Mobius strip (no start, no end)
F.mobius = () => {
  const sc = new Scene(), R = 1.25, w = .5;
  sc.add(param((u, v, p) => { const c = R + v * Math.cos(u / 2); p[0] = c * Math.cos(u); p[1] = c * Math.sin(u); p[2] = v * Math.sin(u / 2); }, 0, TAU, -w, w));
  for (const s of [-1, 1]) sc.add(cyl(.012, 1), { w: 0 });
  return { sc, rot: [1.1, .3, .45] };
};

// OWN: a globe, land denser than sea, graticule on top
F.globe = () => {
  const sc = new Scene(), sd = 3.7;
  const land = (x, y, z) => fbm(x * 1.7 + sd, y * 1.7, z * 1.7) > .53;
  sc.add({
    area: 4 * PI * 1.2, fn(r, o) {
      const u = r() * 2 - 1, t = r() * TAU, s = Math.sqrt(1 - u * u), x = s * Math.cos(t), y = u, z = s * Math.sin(t);
      const L = land(x, y, z); if (!L && r() > .22) return false;
      const k = L ? 1.03 : 1;
      o[0] = x * k; o[1] = y * k; o[2] = z * k; o[3] = x; o[4] = y; o[5] = z;
    }
  });
  sc.add({
    area: 4 * PI * .55, fn(r, o) { // graticule every 15 deg
      let x, y, z;
      if (r() < .5) { const lon = Math.floor(r() * 24) * PI / 12, lat = Math.asin(r() * 2 - 1); x = Math.cos(lat) * Math.cos(lon); z = Math.cos(lat) * Math.sin(lon); y = Math.sin(lat); }
      else { const lat = (Math.floor(r() * 11) - 5) * PI / 12, lon = r() * TAU; x = Math.cos(lat) * Math.cos(lon); z = Math.cos(lat) * Math.sin(lon); y = Math.sin(lat); }
      o[0] = x * 1.045; o[1] = y * 1.045; o[2] = z * 1.045; o[3] = x; o[4] = y; o[5] = z;
    }
  });
  sc.add(torus(1.16, .016), { rot: [.0, 0, .0], w: 1 });
  return { sc, rot: [.3, .5, .38] };
};

// SPOTLIGHT: a cine lens, with ribbed focus and aperture rings and a deep hood
F.lens = () => {
  const sc = new Scene();
  const rib = (R, y, h, n, w) => { for (let i = 0; i < n; i++) { const a = i / n * TAU; sc.add(box(w, h / 2, .05), { pos: [Math.cos(a) * (R + .02), y, Math.sin(a) * (R + .02)], rot: [0, -a, 0] }); } };
  sc.add(cyl(1.18, .12), { pos: [0, 0, 0] });
  sc.add(cyl(1.0, .84), { pos: [0, .5, 0] });
  sc.add(cyl(1.12, .6), { pos: [0, 1.1, 0] }); rib(1.12, 1.1, .6, 56, .03);
  sc.add(cyl(1.06, .2), { pos: [0, 1.55, 0] }); rib(1.06, 1.55, .2, 30, .035);
  sc.add(cyl(.96, .7), { pos: [0, 2.0, 0] });
  sc.add(cyl(1.28, .7, { caps: false }), { pos: [0, 2.7, 0] });
  sc.add(cyl(1.12, .7, { caps: false, inward: true }), { pos: [0, 2.7, 0] });
  sc.add(disc(1.12, 1.28, 1), { pos: [0, 3.05, 0] });
  sc.add(lathe([[.95, 2.5], [.62, 2.34], [.3, 2.24], [0, 2.2]]));
  sc.add(torus(.72, .045), { pos: [0, 2.42, 0] }); sc.add(torus(.4, .04), { pos: [0, 2.3, 0] });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; sc.add(box(.5, .01, .16), { pos: [Math.cos(a) * .66, 2.44, Math.sin(a) * .66], rot: [0, -a + .5, 0] }); }
  sc.add(box(.32, .24, .26), { pos: [0, 1.2, 1.3] }); sc.add(box(.9, .05, .42), { pos: [0, 1.2, 1.58] });
  return { sc, rot: [.2, .5, 1.3] };
};

// LATEST: a long twisting ticker ribbon
F.ribbon = () => {
  const sc = new Scene();
  sc.add(param((u, v, p) => {
    const x = (u - .5) * 5, cy = .5 * Math.sin(1.5 * x), cz = .4 * Math.cos(1.1 * x + .6);
    const ph = 1.5 * x + .5; p[0] = x; p[1] = cy + Math.cos(ph) * v; p[2] = cz + Math.sin(ph) * v;
  }, 0, 1, -.4, .4));
  for (const s of [-1, 1]) sc.add(param((u, v, p) => {
    const x = (u - .5) * 5, cy = .5 * Math.sin(1.5 * x), cz = .4 * Math.cos(1.1 * x + .6);
    const ph = 1.5 * x + .5, vv = s * .4; p[0] = x; p[1] = cy + Math.cos(ph) * vv; p[2] = cz + Math.sin(ph) * vv + v * .3;
  }, 0, 1, -.02, .02), { w: 4 });
  return { sc, rot: [.3, -.25, 0] };
};

// CTA: a city of columns, the stack that stands underneath
F.city = () => {
  const sc = new Scene(), nx = 13, nz = 8, s = .3;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = (i - (nx - 1) / 2) * s, z = (j - (nz - 1) / 2) * s;
    const d = Math.hypot(x / 2.0, z / 1.3);
    const n = fbm(i * .42 + 9, j * .42, 3);
    const h = .2 + Math.max(0, 3.2 * Math.pow(n, 1.7) * (1.35 - d)) + (((i * 7 + j * 13) % 5 === 0) ? .35 : 0);
    const hw = .105 + ((i + j) % 3) * .012;
    sc.add(box(hw, h / 2, hw, o => o[4] < 0), { pos: [x, h / 2, z] });
    if (h > .9) { sc.add(box(hw * .62, .16, hw * .62), { pos: [x, h + .16, z] }); sc.add(box(.012, .22, .012), { pos: [x, h + .46, z] }); }
    if (h > 1.6) sc.add(box(hw * 1.1, .03, hw * 1.1), { pos: [x, h * .62, z] });
  }
  sc.add(disc(0, 3.4, 1, o => Math.abs(o[0]) > 2.3 || Math.abs(o[2]) > 1.6), { pos: [0, 0, 0], w: .18 });
  return { sc, rot: [.1, .32, 0] };
};

export const NAMES = ['vault', 'gears', 'tower', 'rings', 'stack', 'viaduct', 'ziggurat', 'mobius', 'globe', 'lens', 'ribbon', 'city'];

/* ---------- sampling ---------- */
export function buildShape(name, N, seed = 1) {
  const { sc, rot, groups } = F[name](); const r = rng32(seed * 7919 + name.length * 131);
  const cum = []; let tot = 0; for (const it of sc.items) { tot += it.area; cum.push(tot); }
  const G = rotM(rot[0], rot[1], rot[2]);
  const P = new Float32Array(N * 3), Nn = new Float32Array(N * 3), Gr = new Float32Array(N), o = new Float32Array(6);
  for (let i = 0; i < N; i++) {
    let it;
    for (; ;) {
      const x = r() * tot; let lo = 0, hi = cum.length - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < x) lo = m + 1; else hi = m; }
      it = sc.items[lo]; if (it.s.fn(r, o) !== false) break;
    }
    const M = it.M, [px, py, pz] = it.pos;
    const x = M[0] * o[0] + M[1] * o[1] + M[2] * o[2] + px, y = M[3] * o[0] + M[4] * o[1] + M[5] * o[2] + py, z = M[6] * o[0] + M[7] * o[1] + M[8] * o[2] + pz;
    const nx = M[0] * o[3] + M[1] * o[4] + M[2] * o[5], ny = M[3] * o[3] + M[4] * o[4] + M[5] * o[5], nz = M[6] * o[3] + M[7] * o[4] + M[8] * o[5];
    P[i * 3] = G[0] * x + G[1] * y + G[2] * z; P[i * 3 + 1] = G[3] * x + G[4] * y + G[5] * z; P[i * 3 + 2] = G[6] * x + G[7] * y + G[8] * z;
    const mx = G[0] * nx + G[1] * ny + G[2] * nz, my = G[3] * nx + G[4] * ny + G[5] * nz, mz = G[6] * nx + G[7] * ny + G[8] * nz, l = Math.hypot(mx, my, mz) || 1;
    Nn[i * 3] = mx / l; Nn[i * 3 + 1] = my / l; Nn[i * 3 + 2] = mz / l; Gr[i] = it.group;
  }
  // normalise to +-1
  let mn = [1e9, 1e9, 1e9], mxv = [-1e9, -1e9, -1e9];
  for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) { const v = P[i * 3 + k]; if (v < mn[k]) mn[k] = v; if (v > mxv[k]) mxv[k] = v; }
  const c = [0, 1, 2].map(k => (mn[k] + mxv[k]) / 2), h = [0, 1, 2].map(k => (mxv[k] - mn[k]) / 2), K = 1 / Math.max(h[0], h[1], h[2]);
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 3; k++) P[i * 3 + k] = (P[i * 3 + k] - c[k]) * K;
    // thin crust: most points sink inward a little, a few drift out as dust; plus fine noise
    const u = r(); let d;
    if (u < .62) d = -Math.pow(r(), 2) * .045; else if (u < .94) d = (r() - .5) * .006; else d = Math.pow(r(), 2) * .07;
    const g = (r() + r() + r() - 1.5) * .004;
    for (let k = 0; k < 3; k++) P[i * 3 + k] += Nn[i * 3 + k] * (d + g) + (r() - .5) * .003;
  }
  // sort: top to bottom, then angle, so index i keeps its place between forms
  const key = new Uint16Array(N), cnt = new Uint32Array(4097);
  for (let i = 0; i < N; i++) {
    const yb = Math.min(63, Math.max(0, Math.floor((1 - (P[i * 3 + 1] / (h[1] * K) * .5 + .5)) * 63.99)));
    const ang = Math.atan2(P[i * 3 + 2], P[i * 3]), ab = Math.min(63, Math.floor((ang / TAU + .5) * 64));
    key[i] = yb * 64 + ab; cnt[key[i] + 1]++;
  }
  for (let i = 0; i < 4096; i++) cnt[i + 1] += cnt[i];
  const order = new Uint32Array(N); for (let i = 0; i < N; i++) order[cnt[key[i]]++] = i;
  const P2 = new Float32Array(N * 3), N2 = new Float32Array(N * 3), G2 = new Float32Array(N);
  for (let j = 0; j < N; j++) { const i = order[j]; P2.set(P.subarray(i * 3, i * 3 + 3), j * 3); N2.set(Nn.subarray(i * 3, i * 3 + 3), j * 3); G2[j] = Gr[i]; }
  return { name, pos: P2, nrm: N2, grp: G2, hw: h[0] * K, hh: h[1] * K, groups: groups || 0 };
}
