/* The BitGo shield as solid glass, built from the logo's own outline (B cut-out and counters included).
   split 0..1 breaks it into 3 or 5 wedge pieces that meet at the heart of the B. */
import { THREE, mat, glow, smoother, sm, lerp, disposeTree } from './_kit.js';
import { wedgeSet, HUB } from './_shieldgeo.js';

export const meta = {
  name: 'shield', distance: 5.2, title: 'Shield',
  means: 'One security perimeter, built from shares that fit back together',
  pages: ['Home', 'Platform', 'Wallets'],
  states: { split: 'the shield separates into wedge pieces, 0..1' },
  options: { pieces: '3 | 5 (default 5)' }
};

export function create(opts = {}) {
  const L = !!opts.light, n = opts.pieces === 3 ? 3 : 5;
  const object = new THREE.Group();
  const root = new THREE.Group(); object.add(root);
  const S = 0.781; root.scale.setScalar(S);
  const set = wedgeSet(n, n === 3 ? Math.PI / 2 + 0.2 : Math.PI / 2 + 0.1);
  const mats = [];
  const pcs = set.map((g, i) => {
    const m = mat.glass(); mats.push(m);
    const mesh = new THREE.Mesh(g.geo, m);
    const pivot = new THREE.Group(); pivot.position.set(HUB.x, HUB.y, 0); pivot.add(mesh); root.add(pivot);
    return { pivot, mesh, m, dir: new THREE.Vector3(g.dir.x, g.dir.y, 0), i };
  });
  // a faint light line along the hub of the pieces appears as they part
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 12), glow(L, { opacity: 0 }));
  core.position.set(HUB.x, HUB.y, 0); root.add(core);
  const st = smoother(3.5);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { split: 0 });
      const e = sm(0, 1, s.split);
      pcs.forEach((p, i) => {
        const ph = i * (n === 3 ? 2.09 : 1.26);
        p.pivot.position.set(HUB.x, HUB.y, 0).addScaledVector(p.dir, e * 0.34 + Math.sin(time * 0.5 + ph) * 0.012 * e);
        p.pivot.position.z = e * 0.12 * (i % 2 ? 1 : -1);
        p.pivot.rotation.set(Math.sin(time * 0.4 + ph) * 0.04 * e + e * 0.1 * (i % 2 ? 1 : -1), e * 0.16 * (i % 3 - 1), e * 0.1 * (i % 2 ? 1 : -1));
        p.m.emissiveIntensity = e * 0.35 * (0.6 + 0.4 * Math.sin(time * 1.3 - ph));
        p.m.attenuationDistance = lerp(0.55, 0.32, e * 0.5);
      });
      core.material.opacity = e * 0.5; core.scale.setScalar(0.5 + e);
      root.rotation.y = Math.sin(time * 0.35) * 0.22; root.rotation.x = Math.sin(time * 0.27) * 0.05;
    },
    dispose() { disposeTree(object); }
  };
}
