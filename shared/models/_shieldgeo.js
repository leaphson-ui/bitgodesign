/* The BitGo shield as solid glass. The outline comes from shared/assets/bitgo-logo.svg (the shield path,
   with its B cut-out and the two counters). Pieces are the same solid cut by half-planes, so any set of
   pieces closes back into the whole shield with no gaps. Built in code, nothing fetched. */
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const D = 'M156.282 104.257C156.282 146.692 78.3938 183.634 78.3938 183.634C78.3938 183.634 0.50478 146.692 0.50478 104.257C0.50478 93.2381 0.509268 83.5104 0.513558 74.2098C0.522088 55.7192 0.52984 38.9167 0.5 17.0094C49.9579 -5.62206 106.836 -5.59857 156.282 17.0588V104.257ZM72.3134 30.3623H62.2633V40.3298H52.2132V123.406H62.2633V133.376H72.3134V123.406H82.3636V133.376H92.4137V122.448C105.183 119.755 112.514 111.51 112.514 99.2681C112.514 90.7144 106.987 82.981 97.5309 80.5203C105.882 78.0597 110.672 70.9121 110.672 62.9443C110.672 51.6072 103.818 43.6576 92.4137 41.1626V30.3623H82.3636V40.3298H72.3134V30.3623ZM81.1969 53.3361C89.6709 53.3361 94.5834 57.2028 94.5834 63.7645C94.5834 70.3262 89.9165 74.193 82.0565 74.193H67.9332V53.3361H81.1969ZM82.1794 86.8477C91.6359 86.8477 96.4256 90.7144 96.4256 98.4479C96.4256 105.478 90.6534 109.814 81.3197 109.814H67.9332V86.8477H82.1794Z';

const SC = 2 / 184, CX = 78.4, CY = 91.8;           // shield height becomes 2 units
const tx = p => new THREE.Vector2((p.x - CX) * SC, -(p.y - CY) * SC);
const area = pts => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p.x * q.y - q.x * p.y; } return a / 2; };

function loops() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 542 184"><path d="${D}"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const subs = data.paths[0].subPaths;
  const res = subs.map(sp => {
    let pts = sp.getPoints(14).map(tx);
    pts = pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 1e-5);
    if (pts.length > 1 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-5) pts.pop();
    return pts;
  });
  // 0 outline (CCW), 1 B cut-out (CW), 2.. counters (CCW): the solid lies to the left of each loop
  return res.map((p, i) => { const ccw = area(p) > 0; const want = i === 1; return (ccw === !want) ? p : p.slice().reverse(); });
}

/* vertex normals for a loop, smoothed except at sharp corners */
function loopNormals(pts) {
  const n = pts.length, seg = [];
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; const t = new THREE.Vector2().subVectors(b, a).normalize(); seg.push(new THREE.Vector2(t.y, -t.x)); }
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = seg[(i + n - 1) % n], c = seg[i];
    const smooth = p.dot(c) > 0.82;
    const s = smooth ? p.clone().add(c).normalize() : c.clone();          // start of segment i
    const e0 = seg[(i + 1) % n], smoothE = c.dot(e0) > 0.82;
    const e = smoothE ? c.clone().add(e0).normalize() : c.clone();        // end of segment i
    out.push([s, e]);
  }
  return out;
}

const L = loops();
const LN = L.map(loopNormals);

/* a plane keeps points with n.p - off >= 0 */
export const wedgePlanes = (cx, cy, a0, a1) => [
  { nx: -Math.sin(a0), ny: Math.cos(a0), off: -Math.sin(a0) * cx + Math.cos(a0) * cy },
  { nx: Math.sin(a1), ny: -Math.cos(a1), off: Math.sin(a1) * cx - Math.cos(a1) * cy }
];

function clipPoly(poly, pl) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const fa = pl.nx * a.x + pl.ny * a.y - pl.off, fb = pl.nx * b.x + pl.ny * b.y - pl.off;
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) { const u = fa / (fa - fb); out.push(new THREE.Vector2(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u)); }
  }
  return out;
}

const tris = (() => {
  const out = [];
  const add = (contour, holes) => {
    const all = contour.concat(...holes);
    ShapeFaces(contour, holes).forEach(f => out.push([all[f[0]], all[f[1]], all[f[2]]]));
  };
  function ShapeFaces(c, h) { return THREE.ShapeUtils.triangulateShape(c.map(p => p.clone()), h.map(x => x.map(p => p.clone()))); }
  add(L[0], [L[1]]);
  for (let i = 2; i < L.length; i++) add(L[i], []);
  return out;
})();

export const DEPTH = 0.34;

/* build one piece: the shield clipped to the planes (empty list = the whole shield) */
export function buildPiece(planes, cx = 0, cy = 0, depth = DEPTH) {
  const pos = [], nor = [];
  const z1 = depth / 2, z0 = -depth / 2;
  const push = (p, z, n) => { pos.push(p[0], p[1], z); nor.push(n[0], n[1], n[2]); };
  // caps
  tris.forEach(t => {
    let poly = t.map(p => p.clone());
    planes.forEach(pl => { if (poly.length) poly = clipPoly(poly, pl); });
    if (poly.length < 3) return;
    for (let i = 1; i < poly.length - 1; i++) {
      let a = poly[0], b = poly[i], c = poly[i + 1];
      if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) < 0) [b, c] = [c, b];
      [a, b, c].forEach(p => push([p.x, p.y], z1, [0, 0, 1]));
      [a, c, b].forEach(p => push([p.x, p.y], z0, [0, 0, -1]));
    }
  });
  const quad = (A, B, nA, nB) => {
    push(A, z0, nA); push(B, z0, nB); push(B, z1, nB);
    push(A, z0, nA); push(B, z1, nB); push(A, z1, nA);
  };
  // outline walls
  L.forEach((pts, li) => {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      let t0 = 0, t1 = 1;
      for (const pl of planes) {
        const fa = pl.nx * a.x + pl.ny * a.y - pl.off, fb = pl.nx * b.x + pl.ny * b.y - pl.off;
        if (fa < 0 && fb < 0) { t1 = -1; break; }
        if (fa < 0) t0 = Math.max(t0, fa / (fa - fb));
        if (fb < 0) t1 = Math.min(t1, fa / (fa - fb));
      }
      if (t1 - t0 < 1e-6) continue;
      const [ns, ne] = LN[li][i];
      const lerpN = u => [ns.x + (ne.x - ns.x) * u, ns.y + (ne.y - ns.y) * u];
      const nrm = u => { const v = lerpN(u), l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l, 0]; };
      quad([a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0], [a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1], nrm(t0), nrm(t1));
    }
  });
  // cut faces along each plane
  planes.forEach((pl, k) => {
    const dir = { x: -pl.ny, y: pl.nx };
    const base = { x: pl.nx * pl.off, y: pl.ny * pl.off };       // the point of the line closest to the origin
    const ts = [];
    L.forEach(pts => {
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        const fa = pl.nx * a.x + pl.ny * a.y - pl.off, fb = pl.nx * b.x + pl.ny * b.y - pl.off;
        if ((fa >= 0) !== (fb >= 0)) { const u = fa / (fa - fb); const x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u; ts.push((x - base.x) * dir.x + (y - base.y) * dir.y); }
      }
    });
    ts.sort((p, q) => p - q);
    for (let j = 0; j + 1 < ts.length; j += 2) {
      let t0 = ts[j], t1 = ts[j + 1];
      planes.forEach((m, mi) => {
        if (mi === k) return;
        const g0 = m.nx * base.x + m.ny * base.y - m.off, gd = m.nx * dir.x + m.ny * dir.y;
        if (Math.abs(gd) < 1e-9) { if (g0 < 0) t1 = t0 - 1; return; }
        const tb = -g0 / gd;
        if (gd > 0) t0 = Math.max(t0, tb); else t1 = Math.min(t1, tb);
      });
      if (t1 - t0 < 1e-5) continue;
      const A = [base.x + dir.x * t0, base.y + dir.y * t0], B = [base.x + dir.x * t1, base.y + dir.y * t1];
      const nrm = [-pl.nx, -pl.ny, 0];
      // pick the winding whose normal points away from the piece
      const cr = (B[0] - A[0]) * 0 - (B[1] - A[1]) * 0; void cr;
      const tvx = B[0] - A[0], tvy = B[1] - A[1];
      const outward = tvy * nrm[0] - tvx * nrm[1];                 // (ty,-tx) . n
      if (outward >= 0) quad(A, B, nrm, nrm); else quad(B, A, nrm, nrm);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.translate(-cx, -cy, 0);
  return geo;
}

/* glyph centre in shield units (the optical centre of the B), where wedges meet */
export const HUB = { x: ((82.4 - CX) * SC), y: -((82.4 - CY) * SC) };

export function wedgeSet(n, start) {
  const out = [], span = Math.PI * 2 / n;
  for (let i = 0; i < n; i++) {
    const a0 = start + i * span, a1 = a0 + span;
    const planes = wedgePlanes(HUB.x, HUB.y, a0, a1);
    const mid = (a0 + a1) / 2;
    // planes pass through the hub: shift geometry so the hub is the origin of every piece
    const pl = planes.map(p => ({ ...p }));
    out.push({ geo: buildPiece(pl, 0, 0), dir: new THREE.Vector2(Math.cos(mid), Math.sin(mid)) });
  }
  return out;
}
export const wholeGeo = () => buildPiece([]);
export const outlinePts = () => loops()[0];
export const holeLoops = () => L.slice(1);
