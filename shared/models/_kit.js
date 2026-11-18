/* Shared helpers for the model files (not a model itself). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, glow } from './materials.js';
export { THREE, mat, glow, mergeGeometries };

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sm = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const rng = (seed = 1) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* rounded box with the model's usual small bevel */
export const rbox = (w, h, d, r = 0.012, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));

/* polyline [[x,y,r?],...] with rounded corners (r = corner radius at that point) */
export function rprofile(pts, steps = 3) {
  const out = [];
  pts.forEach((p, i) => {
    const r = p[2] || 0;
    if (!r || i === 0 || i === pts.length - 1) { out.push(new THREE.Vector2(p[0], p[1])); return; }
    const a = new THREE.Vector2(pts[i - 1][0], pts[i - 1][1]), c = new THREE.Vector2(p[0], p[1]), b = new THREE.Vector2(pts[i + 1][0], pts[i + 1][1]);
    const d1 = a.clone().sub(c), d2 = b.clone().sub(c);
    const rr = Math.min(r, d1.length() * 0.49, d2.length() * 0.49);
    const p0 = c.clone().add(d1.normalize().multiplyScalar(rr)), p1 = c.clone().add(d2.normalize().multiplyScalar(rr));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, u = 1 - t;
      out.push(new THREE.Vector2(u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, u * u * p0.y + 2 * u * t * c.y + t * t * p1.y));
    }
  });
  return out;
}
/* surface of revolution about +Y from a rounded profile, flat faces stay flat */
export function lathe(pts, seg = 72, steps = 3) {
  const g = new THREE.LatheGeometry(rprofile(pts, steps), seg);
  return toCreasedNormals(g, 0.9);
}
/* lathe turned to face +Z (a disc whose front looks at the camera) */
export const latheZ = (pts, seg, steps) => { const g = lathe(pts, seg, steps); g.rotateX(Math.PI / 2); return g; };

export const creased = (g, a = 0.75) => toCreasedNormals(g, a);

export function addMesh(parent, geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); parent.add(m); return m;
}
/* InstancedMesh from [{p:[x,y,z], r:[x,y,z]?, s:[x,y,z]|n?}] */
export function inst(geo, material, items, parent) {
  const im = new THREE.InstancedMesh(geo, material, items.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  items.forEach((it, i) => {
    p.set(...it.p); e.set(...(it.r || [0, 0, 0])); q.setFromEuler(e);
    if (typeof it.s === 'number') s.setScalar(it.s); else s.set(...(it.s || [1, 1, 1]));
    m.compose(p, q, s); im.setMatrixAt(i, m);
  });
  im.instanceMatrix.needsUpdate = true;
  if (parent) parent.add(im);
  return im;
}
export function setInst(im, i, p, r, s) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(r || [0, 0, 0])));
  const sc = typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...(s || [1, 1, 1]));
  m.compose(new THREE.Vector3(...p), q, sc); im.setMatrixAt(i, m); im.instanceMatrix.needsUpdate = true;
}

/* frame-rate independent smoothing of the named states */
export function smoother(k = 4) {
  const cur = {}; let last = null;
  return (time, state, defaults = {}) => {
    const dt = last == null ? 1 : clamp(time - last, 0, 0.1); last = time;
    const out = {};
    for (const key in defaults) {
      const tgt = state[key] != null ? state[key] : defaults[key];
      cur[key] = cur[key] == null ? tgt : cur[key] + (tgt - cur[key]) * (1 - Math.exp(-dt * k));
      out[key] = cur[key];
    }
    out.dt = dt;
    return out;
  };
}

export function disposeTree(obj) {
  const seenG = new Set(), seenM = new Set();
  obj.traverse(o => {
    if (o.geometry && !seenG.has(o.geometry)) { seenG.add(o.geometry); o.geometry.dispose(); }
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    ms.forEach(m => { if (!seenM.has(m)) { seenM.add(m); m.dispose(); } });
    if (o.isInstancedMesh) o.dispose();
  });
}

/* triangle count of an object tree (instances included) */
export function triCount(obj) {
  let n = 0;
  obj.traverse(o => {
    if (!o.geometry) return;
    const g = o.geometry, c = (g.index ? g.index.count : g.attributes.position.count) / 3;
    n += c * (o.isInstancedMesh ? o.count : 1);
  });
  return Math.round(n);
}

/* Deeper grade for the second-generation models: darker, glossier metals so highlights carry the form. */
export const deep = {
  metal: (o = {}) => mat.metal(Object.assign({ color: 0x0f1d66, roughness: 0.26, envMapIntensity: 1.25, clearcoat: 0.7, clearcoatRoughness: 0.12, emissiveIntensity: 0.0 }, o)),
  ink: (o = {}) => mat.ink(Object.assign({ color: 0x040822, roughness: 0.22, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.4 }, o)),
  /* brushed aluminium with a cold blue cast */
  alu: (o = {}) => mat.chrome(Object.assign({ color: 0xbdc9ee, roughness: 0.34, clearcoat: 0.3, clearcoatRoughness: 0.25, envMapIntensity: 1.2 }, o)),
  /* dark leather: low sheen, blue rim light, fine grain from a generated bump map */
  leather: (o = {}) => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256);
    let s = 3; for (let i = 0; i < d.data.length; i += 4) { s = (s * 16807) % 2147483647; const v = 90 + (s % 120); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5);
    return new THREE.MeshPhysicalMaterial(Object.assign({ color: 0x050920, roughness: 0.48, metalness: 0, bumpMap: t, bumpScale: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.4, sheen: 0.7, sheenColor: new THREE.Color(0x2b4cd0), sheenRoughness: 0.45, envMapIntensity: 0.65 }, o));
  }
};
