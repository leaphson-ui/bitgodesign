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

/* ---------- extra helpers (keep-predicates: return true to keep the point) ---------- */
const fr = x => x - Math.floor(x);
function tube(c, u0, u1, rad) { // thin round cable along a curve c(u) -> [x,y,z], tangent roughly in the xy plane
  const e = 1e-3;
  return param((u, v, p) => {
    const q = c(u), a = c(u + e), b = c(u - e), tx = a[0] - b[0], ty = a[1] - b[1], l = Math.hypot(tx, ty) || 1;
    const nx = -ty / l, ny = tx / l, cv = Math.cos(v) * rad, sv = Math.sin(v) * rad;
    p[0] = q[0] + nx * cv; p[1] = q[1] + ny * cv; p[2] = q[2] + sv;
  }, u0, u1, 0, TAU);
}
// a building block with a window grid cut into its four sides (windows are gaps in the dots)
function block(sc, x, z, hw, hd, y0, h, o = {}) {
  const pu = o.pu || .075, pv = o.pv || .1, wf = o.wf || .5, hf = o.hf || .55;
  sc.add(box(hw, h / 2, hd, q => {
    if (q[4] < -.5) return false;
    if (q[4] > .5) return true;
    const u = Math.abs(q[5]) > .5 ? q[0] : q[2], v = q[1] + h / 2;
    if (v < .05 || v > h - .04) return true;
    return !(fr(u / pu) < wf && fr(v / pv) < hf);
  }), { pos: [x, y0 + h / 2, z], w: o.w || 1 });
  return y0 + h;
}

const F = {};

/* ---------- BANK: a neoclassical facade, columns, pediment, steps ---------- */
F.bank = () => {
  const sc = new Scene();
  [[1.95, .9], [1.78, .8], [1.62, .72]].forEach(([hx, hz], i) => sc.add(box(hx, .05, hz), { pos: [0, .05 + i * .1, 0], w: .8 }));
  const y0 = .3, H = 1.5;
  sc.add(box(1.22, H / 2, .3, o => {
    if (o[4] > .5) return true; if (o[4] < -.5) return false;
    if (o[5] > .5) { const x = o[0], y = o[1] + H / 2; if (Math.abs(x) < .2 && y < 1.05) return false; if (Math.abs(Math.abs(x) - .7) < .13 && y > .35 && y < 1.15) return false; if (Math.abs(x) < .24 && Math.abs(y - 1.18) < .05) return false; }
    return true;
  }), { pos: [0, y0 + H / 2, -.2], w: 1.1 });
  for (let i = 0; i < 6; i++) { // fluted columns with bases and capitals
    const x = -1.0 + i * .4;
    sc.add(cyl(.085, H, { caps: false }), { pos: [x, y0 + H / 2, .5], w: 1.3 });
    sc.add(box(.125, .03, .125), { pos: [x, y0 + .03, .5] }); sc.add(box(.13, .035, .13), { pos: [x, y0 + H - .035, .5] });
    sc.add(box(.1, .04, .1), { pos: [x, y0 + H + .045, .5] });
  }
  const yt = y0 + H + .09;
  sc.add(box(1.28, .09, .62), { pos: [0, yt + .09, .26] });
  sc.add(box(1.3, .04, .66), { pos: [0, yt + .22, .27] });
  for (let i = 0; i < 26; i++) sc.add(box(.022, .025, .025), { pos: [-1.2 + i * .096, yt + .165, .6] });
  const pyb = yt + .24, ph = .42;
  sc.add(box(1.3, ph / 2, .3, o => { const t = (o[1] + ph / 2) / ph; return o[4] < .5 && t <= 1 - Math.abs(o[0]) / 1.3 + .01; }), { pos: [0, pyb + ph / 2, .24], w: 1.2 });
  const sa = Math.atan(ph / 1.3), L = Math.hypot(1.3, ph) / 2;
  for (const s of [-1, 1]) sc.add(box(L, .025, .32), { pos: [s * .65, pyb + ph / 2 + .01, .24], rot: [0, 0, -s * sa] });
  sc.add(disc(0, .09, 1), { pos: [0, pyb + .24, .56], rot: [PI / 2, 0, 0], w: .5 });
  for (const s of [-1, 1]) {
    block(sc, s * 1.58, -.05, .42, .42, .3, 1.08, { pu: .11, pv: .2, wf: .5, hf: .6 });
    sc.add(box(.46, .03, .46), { pos: [s * 1.58, .3 + 1.08 + .03, -.05] });
  }
  return { sc, rot: [.1, -.42, 0] };
};

/* ---------- DESK: a trading desk, three screens of candles, keyboard, ticker ---------- */
F.desk = () => {
  const sc = new Scene();
  sc.add(box(1.7, .035, .7), { pos: [0, .78, 0] });
  for (const s of [-1, 1]) sc.add(box(.035, .39, .64), { pos: [s * 1.62, .39, 0] });
  sc.add(box(1.6, .22, .02), { pos: [0, .52, -.5] });
  const chart = seed => o => {
    const x = o[0], y = o[1], c = Math.floor((x + .34) / .052), cx = -.34 + (c + .5) * .052;
    const mid = .05 * Math.sin(c * .55 + seed) + .04 * Math.sin(c * 1.3 + seed * 2) - .02, h = .018 + .03 * fr(Math.sin(c * 12.9 + seed) * 43758.5);
    if (x > .24) return fr(y / .04 + seed) < .5 && y > -.16 && y < .17 && fr(x / .018) < .8;
    if (Math.abs(x - cx) < .016 && Math.abs(y - mid) < h) return true;
    if (Math.abs(x - cx) < .004 && Math.abs(y - mid) < h * 2.1) return true;
    return Math.abs(y + .185) < .004 || Math.abs(x + .35) < .004;
  };
  [-1, 0, 1].forEach((k, i) => {
    const x = k * .86, yaw = -k * .24, z = k === 0 ? -.12 : -.02, y = 1.38;
    const R = [0, yaw, 0], at = (dx, dy, dz) => [x + dx * Math.cos(yaw) + dz * Math.sin(yaw), y + dy, z - dx * Math.sin(yaw) + dz * Math.cos(yaw)];
    sc.add(box(.4, .27, .02, o => o[5] < .5 || Math.abs(o[0]) > .36 || Math.abs(o[1]) > .23), { pos: at(0, 0, 0), rot: R, w: 1.4 });
    sc.add(box(.35, .225, .01, o => o[5] > .5 && chart(i * 2.3 + 1)(o)), { pos: at(0, 0, .014), rot: R, w: 1.6 });
    sc.add(box(.4, .27, .018, o => o[5] < -.5), { pos: at(0, 0, -.03), rot: R, w: .5 });
    sc.add(box(.03, .15, .03), { pos: at(0, -.2, -.05), rot: R }); sc.add(box(.14, .012, .11), { pos: at(0, -.28, -.02), rot: R });
  });
  sc.add(box(.4, .012, .1, o => o[4] < .5 || (fr(o[0] / .034) > .15 && fr(o[2] / .04) > .2)), { pos: [-.15, .815, .26], w: 2 });
  sc.add(box(.045, .012, .06), { pos: [.4, .815, .26] });
  sc.add(box(1.5, .05, .018, o => o[5] < .5 || fr(o[0] / .09 + fr(Math.sin(Math.floor(o[0] / .09) * 7.7) * 99)) < .6), { pos: [0, 2.1, -.2], w: 1.5 });
  for (const s of [-1, 1]) sc.add(box(.012, .3, .012), { pos: [s * 1.5, 1.93, -.2] });
  sc.add(box(.03, .13, .03), { pos: [1.2, .88, -.15] }); sc.add(box(.12, .015, .09), { pos: [1.2, .81, -.15] });
  sc.add(box(.2, .018, .018), { pos: [1.28, 1.07, -.15], rot: [0, 0, .3] });
  sc.add(box(.32, .04, .3), { pos: [0, .5, .85] }); sc.add(box(.3, .25, .035), { pos: [0, .78, 1.0] });
  sc.add(cyl(.035, .38), { pos: [0, .28, .85] }); sc.add(box(.3, .02, .03), { pos: [0, .08, .85] }); sc.add(box(.03, .02, .3), { pos: [0, .08, .85] });
  return { sc, rot: [.26, -.34, 0] };
};

/* ---------- SAFE: a wall of safe-deposit boxes, one row per service ---------- */
F.safe = () => {
  const sc = new Scene(), cols = 7, rows = 5, cw = .36, rh = .27;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c - (cols - 1) / 2) * cw, y = (rows - 1 - r) * rh, g = r;
    sc.add(box(.158, .108, .03), { pos: [x, y, 0], group: g, w: 1.6 });
    sc.add(box(.158, .108, .03, o => o[5] > .5 && (Math.abs(o[0]) > .13 || Math.abs(o[1]) > .08)), { pos: [x, y, .02], group: g, w: 1.2 });
    sc.add(torus(.022, .008), { pos: [x - .07, y, .045], rot: [PI / 2, 0, 0], group: g, w: 2 });
    sc.add(box(.014, .014, .02), { pos: [x - .07, y, .05], group: g, w: 2 });
    sc.add(box(.05, .008, .02), { pos: [x + .06, y + .03, .05], group: g, w: 2 });
    sc.add(box(.035, .018, .006), { pos: [x + .06, y - .045, .045], group: g, w: 1.4 });
  }
  const W = cols * cw / 2 + .06, H = rows * rh / 2 + .08, cy = (rows - 1) * rh / 2;
  for (const s of [-1, 1]) { sc.add(box(.07, H, .09), { pos: [s * W, cy, 0], group: 9 }); sc.add(box(W, .07, .09), { pos: [0, cy + s * H, 0], group: 9 }); }
  sc.add(box(W + .1, .02, .12), { pos: [0, cy - H - .05, .03], group: 9 });
  return { sc, rot: [.08, -.38, 0], groups: 5 };
};

/* ---------- BRIDGE: a cable-stayed bridge, one tall pylon and a fan of stays (settlement) ---------- */
F.bridge = () => {
  const sc = new Scene(), PX = -.5, PH = 2.2, DY = .32, LEAN = Math.atan(.36 / PH);
  for (const s of [-1, 1]) {
    sc.add(box(.1, Math.hypot(.36, PH) / 2, .08), { pos: [PX, PH / 2, s * .18], rot: [-s * LEAN, 0, 0], w: 1.6 });
    sc.add(box(.07, .018, .34 * (1 - s * 0) ), { pos: [PX, .9 + (s + 1) * .0, 0], w: .01 });
  }
  for (const y of [.75, 1.35]) sc.add(box(.075, .035, .36 * (1 - y / PH) + .02), { pos: [PX, y, 0], w: 1.2 });
  sc.add(box(.13, .05, .12), { pos: [PX, PH + .02, 0] });
  sc.add(box(.01, .2, .01), { pos: [PX, PH + .15, 0], w: 4 });
  sc.add(box(.3, .08, .6), { pos: [PX, .0, 0] });
  sc.add(box(2.6, .03, .56), { pos: [.2, DY, 0], w: 1.5 });
  for (const s of [-1, 1]) { sc.add(box(2.6, .015, .015), { pos: [.2, DY + .13, s * .27] }); sc.add(box(2.6, .05, .015), { pos: [.2, DY - .05, s * .22] }); }
  for (const x of [-2.4, 2.8]) sc.add(box(.18, .16, .6), { pos: [x, .1, 0] });
  for (const cz of [-1, 1]) for (const side of [-1, 1]) for (let k = 0; k < 11; k++) {
    const ya = PH - .08 - k * .095, xe = PX + side * (.32 + k * (side > 0 ? .2 : .15)), ye = DY + .03;
    sc.add(tube(u => [PX + (xe - PX) * u, ya + (ye - ya) * u, cz * (.03 + .24 * u)], 0, 1, .007), { w: 1.2 });
  }
  return { sc, rot: [.1, -.42, 0] };
};

/* ---------- CLOCK: a station clock on a pole, 24 hour marks ---------- */
F.clock = () => {
  const sc = new Scene(), Zr = [PI / 2, 0, 0], R = 1;
  sc.add(torus(R, .075), { rot: Zr, w: 1.4 }); sc.add(torus(R * .92, .02), { pos: [0, 0, .03], rot: Zr });
  sc.add(disc(0, R * .95, 1), { pos: [0, 0, -.03], rot: Zr, w: .22 });
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU, major = i % 6 === 0, rr = major ? .78 : .84, hl = major ? .1 : .055;
    sc.add(box(major ? .035 : .018, hl, .035), { pos: [Math.cos(a) * rr, Math.sin(a) * rr, .02], rot: [0, 0, a - PI / 2], w: major ? 1.6 : 1 });
  }
  const hand = (len, w, a, z) => sc.add(box(w, len / 2, .03), { pos: [Math.cos(a) * len / 2, Math.sin(a) * len / 2, z], rot: [0, 0, a - PI / 2], w: 2 });
  hand(.52, .03, 2.2, .06); hand(.8, .02, .7, .09); hand(.8, .008, -.9, .11);
  sc.add(sphere(.07), { pos: [0, 0, .08], w: 2 });
  sc.add(box(.07, .55, .06), { pos: [0, -1.4, -.02] });
  sc.add(cyl(.06, 1.2), { pos: [0, -2.1, -.02] }); sc.add(cyl(.12, .1), { pos: [0, -1.55, -.02] });
  sc.add(cyl(.2, .1), { pos: [0, -2.75, -.02] }); sc.add(cyl(.3, .06), { pos: [0, -2.83, -.02] });
  sc.add(box(.3, .03, .03), { pos: [0, 1.15, -.02] }); sc.add(sphere(.06), { pos: [0, 1.25, -.02] });
  return { sc, rot: [.04, -.5, 0] };
};

/* ---------- CAMERA: a film camera on a tripod with two reels ---------- */
F.camera = () => {
  const sc = new Scene(), Zr = [PI / 2, 0, 0], Xr = [0, 0, PI / 2];
  sc.add(box(.7, .3, .2, o => o[4] > -.5), { pos: [0, 0, 0], w: 1.3 });
  sc.add(box(.5, .06, .17), { pos: [-.05, .34, 0] });
  for (const x of [-.36, .36]) {
    const y = .74, R = .33;
    sc.add(torus(R, .03), { pos: [x, y, .09], rot: Zr }); sc.add(torus(R, .03), { pos: [x, y, -.09], rot: Zr });
    sc.add(cyl(R, .18, { caps: false }), { pos: [x, y, 0], rot: Zr, w: .5 });
    sc.add(cyl(.09, .26), { pos: [x, y, 0], rot: Zr }); sc.add(sphere(.045), { pos: [x, y, .13] });
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + .3; sc.add(box(.03, .12, .03), { pos: [x + Math.cos(a) * .2, y + Math.sin(a) * .2, .09], rot: [0, 0, a - PI / 2], w: 1.6 }); sc.add(box(.03, .12, .03), { pos: [x + Math.cos(a) * .2, y + Math.sin(a) * .2, -.09], rot: [0, 0, a - PI / 2], w: 1.2 }); }
    sc.add(box(.05, .2, .1), { pos: [x, .45, 0] });
  }
  sc.add(cyl(.17, .4), { pos: [.55, 0, 0], rot: Xr }); sc.add(cyl(.24, .24), { pos: [.85, 0, 0], rot: Xr });
  sc.add(cyl(.3, .22, { caps: false }), { pos: [1.05, 0, 0], rot: Xr }); sc.add(torus(.2, .02), { pos: [.74, 0, 0], rot: [0, 0, 0] });
  sc.add(box(.14, .12, .1), { pos: [-.5, .0, .0] }); sc.add(box(.16, .08, .1), { pos: [-.82, .06, 0] });
  sc.add(box(.5, .05, .3), { pos: [0, -.3, 0] }); sc.add(cyl(.05, .3), { pos: [0, -.48, 0] }); sc.add(cyl(.12, .06), { pos: [0, -.66, 0] });
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + .4, dx = Math.cos(a), dz = Math.sin(a), L = 1.7;
    sc.add(box(.025, L / 2, .025), { pos: [dx * .4, -.66 - L / 2 + .1, dz * .4], rot: [-dz * .26, 0, dx * .26] });
    sc.add(box(.06, .02, .08), { pos: [dx * .72, -.66 - L + .1, dz * .72] });
  }
  return { sc, rot: [.14, -.5, 0] };
};

/* ---------- NEWS: a stack of broadsheets and a rolled paper (the latest) ---------- */
F.news = () => {
  const sc = new Scene();
  const page = (k, yaw, x, z) => {
    const y = .06 + k * .13;
    sc.add(box(.95, .06, .7, o => {
      if (o[4] < .5) return true;
      if (k !== 3) return true;
      const u = o[0], v = o[2];
      if (v < -.52) return (v < -.6 ? fr(u / .12) > .1 : true);
      if (v < -.4) return fr(u / .02) < .75;
      if (u > .45 && u < .88 && v > -.35 && v < -.05) return true;
      const col = Math.floor((u + .88) / .29);
      if (fr((u + .88) / .29) > .86) return false;
      return v > -.34 && fr(v / .042 + col * .3) < .55 && !(u > .45 && v < 0.0);
    }), { pos: [x, y, z], rot: [0, yaw, 0], w: 1.2 });
  };
  page(0, .12, .04, .02); page(1, -.1, -.03, 0); page(2, .16, .05, -.02); page(3, -.04, 0, 0);
  sc.add(box(.97, .07, .02), { pos: [0, .24, .0], w: .5 });
  sc.add(cyl(.1, 1.0, { caps: true }), { pos: [.1, .12, .62], rot: [0, 0, PI / 2 - .04] });
  sc.add(box(.04, .11, .104), { pos: [.1, .12, .62], w: 1.4 });
  return { sc, rot: [.62, -.32, 0] };
};

/* ---------- SKYLINE: a front-on city silhouette with setbacks, crowns and spires ---------- */
F.skyline = () => {
  const sc = new Scene();
  const tiers = (x, z, hw, hd, y0, list, o) => { let y = y0; for (const [k, h] of list) { y = block(sc, x, z, hw * k, hd * k, y, h, o); } return y; };
  const spire = (x, z, y, h, w) => sc.add(box(w, h / 2, w), { pos: [x, y + h / 2, z], w: 5 });
  const B = [
    // front row
    [-3.1, 0, .28, .26, [[1, 1.0]], null],
    [-2.6, 0, .3, .3, [[1, 1.1], [.8, .5]], null],
    [-2.05, 0, .24, .3, [[1, 1.5]], 'tank'],
    [-1.4, 0, .44, .44, [[1, 1.5], [.72, .5], [.5, .35], [.26, .3]], 'spireL'],
    [-.62, 0, .3, .3, [[1, 1.75], [.82, .2]], null],
    [.15, 0, .3, .3, [[1, 1.9], [.82, .4], [.64, .3], [.48, .25], [.32, .2], [.2, .15]], 'spireM'],
    [.9, 0, .32, .3, [[1, 1.4]], null],
    [1.5, 0, .25, .3, [[1, 1.8], [.7, .3]], 'spireS'],
    [2.1, 0, .32, .3, [[1, 1.15], [.8, .4]], 'tank'],
    [2.7, 0, .24, .28, [[1, 1.55], [.7, .25]], 'spireS'],
    [3.2, 0, .22, .25, [[1, .85]], null],
    // back row, shorter detail and thinner
    [-2.8, -.7, .26, .26, [[1, 1.7]], null], [-1.9, -.7, .28, .26, [[1, 1.3], [.7, .4]], null], [-.2, -.7, .26, .26, [[1, 2.2], [.7, .35]], 'spireS'],
    [.62, -.7, .28, .26, [[1, 1.6]], null], [1.9, -.7, .26, .26, [[1, 1.6]], null], [2.4, -.7, .24, .26, [[1, 1.2]], null],
  ];
  B.forEach(([x, z, hw, hd, list, top], i) => {
    const y = tiers(x, z, hw, hd, 0, list, { pu: .07 + (i % 3) * .01, pv: .1 + (i % 2) * .02, w: z < -.1 ? .8 : 1 });
    const last = list[list.length - 1][0];
    if (top === 'spireL') spire(x, z, y, .9, .018 * 1.4);
    if (top === 'spireM') { spire(x, z, y, .75, .016); sc.add(box(.14 * hw / .3, .08, .14 * hw / .3), { pos: [x, y + .04, z], w: 1.5 }); }
    if (top === 'spireS') spire(x, z, y, .35, .012);
    if (top === 'tank') { sc.add(cyl(.07, .16), { pos: [x + .08, y + .12, z] }); sc.add(box(.01, .06, .01), { pos: [x + .08, y + .03, z] }); sc.add(lathe([[.075, .0], [0, .06]]), { pos: [x + .08, y + .2, z] }); }
    void last;
  });
  sc.add(box(3.5, .02, .95, o => o[4] > .5), { pos: [0, -.02, -.3], w: .2 });
  return { sc, rot: [.07, .12, 0] };
};

export const NAMES = ['vault', 'desk', 'tower', 'bank', 'safe', 'viaduct', 'bridge', 'clock', 'globe', 'camera', 'news', 'skyline'];

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
