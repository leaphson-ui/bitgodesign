/* A 3D order-book depth chart: stepped bid bars (deep-blue metal) climbing to the left and stepped ask bars
   (glass) climbing to the right, a valley at the mid price with a light blade standing in it, on a ruled ledger
   base. depth 0..1 fills the book: bars rise from the outside in, and the spread narrows as the book thickens. */
import { THREE, mat, glow, rbox, addMesh, inst, smoother, sm, lerp, clamp, rng, disposeTree } from './_kit.js';

export const meta = {
  name: 'depth', distance: 4.3, title: 'Depth',
  means: 'Deep liquidity on both sides: a tight spread and room to trade size',
  pages: ['Trading', 'Prime', 'Liquidity'],
  states: { depth: 'the book fills from the outside in and the spread tightens, 0..1' }
};

const NB = 22, BW = 0.046, BD = 0.56;

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.856); root.position.y = -0.2; object.add(root);
  const dark = mat.metal({ emissiveIntensity: 0.04, color: 0x142570, roughness: 0.45, envMapIntensity: 0.6 }), chrome = mat.chrome(), ink = mat.ink({ clearcoat: 0.15, color: 0x050b2c, roughness: 0.6, envMapIntensity: 0.3 });
  const rand = rng(21);

  /* base with ruled lines */
  addMesh(root, rbox(2.1, 0.06, 0.86, 0.016, 3), dark, 0, -0.03, 0);
  addMesh(root, rbox(2.0, 0.012, 0.76, 0.006), ink, 0, 0.004, 0);
  const rules = []; for (let i = 0; i < 5; i++) rules.push({ p: [0, 0.011, -0.3 + i * 0.15] });
  inst(new THREE.BoxGeometry(1.94, 0.002, 0.004), glow(L, { opacity: 0.3 }), rules, root);

  /* bars: heights are cumulative volume, so they climb away from the middle */
  const hOf = i => 0.1 + 0.95 * Math.pow(i / (NB - 1), 1.7) + (rand() - 0.5) * 0.025;
  const H = []; for (let i = 0; i < NB; i++) H.push(hOf(i));
  const barGeo = rbox(BW * 0.9, 1, BD, 0.008, 1);
  const bids = new THREE.InstancedMesh(barGeo, mat.metal({ emissiveIntensity: 0.04, color: 0x2240b0, roughness: 0.34, envMapIntensity: 0.8 }), NB);
  const asks = new THREE.InstancedMesh(barGeo, mat.glass({ thickness: 0.4 }), NB);
  const capGeo = new THREE.BoxGeometry(BW * 0.9, 0.006, BD * 0.9);
  const bidCaps = new THREE.InstancedMesh(capGeo, glow(L, { opacity: 0.85 }), NB), askCaps = new THREE.InstancedMesh(capGeo, glow(L, { opacity: 0.85 }), NB);
  root.add(bids, asks, bidCaps, askCaps);
  const blade = addMesh(root, new THREE.BoxGeometry(0.012, 1.1, 0.76), glow(L, { opacity: 0.3 }), 0, 0.55, 0);
  addMesh(root, rbox(0.04, 0.03, 0.8, 0.008), chrome, 0, 0.015, 0);
  addMesh(root, rbox(0.03, 0.04, 0.03, 0.008), chrome, 0, 1.11, 0.38);
  addMesh(root, rbox(0.03, 0.04, 0.03, 0.008), chrome, 0, 1.11, -0.38);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), tmp = new THREE.Vector3(), one = new THREE.Vector3();
  const st = smoother(2.2);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { depth: 0 }), d = s.depth;
      const gap = lerp(0.12, 0.04, d);
      for (let i = 0; i < NB; i++) {
        // outside bars rise first; the inner ones settle last
        const rise = sm(0, 1, clamp(d * 1.8 - (1 - i / (NB - 1)) * 0.8 + 0.25));
        const wob = 1 + 0.015 * Math.sin(time * 0.9 + i * 0.7);
        const h = Math.max(0.004, (0.03 + (H[i] - 0.03) * rise) * wob), x = gap + i * BW;
        [[bids, bidCaps, -1], [asks, askCaps, 1]].forEach(([mesh, cap, sgn]) => {
          const hh = sgn < 0 ? h : h * (0.94 + 0.08 * Math.sin(i * 1.3));
          m4.compose(tmp.set(sgn * x, hh / 2, 0), q, one.set(1, hh, 1)); mesh.setMatrixAt(i, m4);
          m4.compose(tmp.set(sgn * x, hh + 0.004, 0), q, one.set(1, 1, 1)); cap.setMatrixAt(i, m4);
        });
      }
      [bids, asks, bidCaps, askCaps].forEach(m => { m.instanceMatrix.needsUpdate = true; });
      blade.material.opacity = 0.15 + 0.3 * d + 0.08 * Math.sin(time * 1.4);
      root.rotation.y = Math.sin(time * 0.3) * 0.05;
    },
    dispose() { disposeTree(object); }
  };
}
