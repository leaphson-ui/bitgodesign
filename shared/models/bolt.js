/* A lightning bolt cast in thick bevelled glass with a solid energy core burning inside it, held between two chrome
   terminals. charge 0..1 brings the core up from a dull ember to white-blue, runs rings of light off the terminals
   and warms the glass. Lightning Network: payments at the speed of light. */
import { THREE, mat, glow, lathe, smoother, sm, lerp, addMesh, disposeTree } from './_kit.js';

export const meta = {
  name: 'bolt', title: 'Bolt',
  means: 'Instant payments: a charge that crosses the network before you blink',
  pages: ['Lightning Network', 'Payments'],
  states: { charge: 'the core builds from ember to full light and the terminals ring, 0..1' }
};

const P = [[0.12, 1.0], [-0.42, -0.06], [-0.06, -0.06], [-0.24, -1.0], [0.44, 0.14], [0.08, 0.14], [0.36, 1.0]];

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.672); root.rotation.z = 0.0; object.add(root);
  const chrome = mat.chrome(), dark = mat.metal({ emissiveIntensity: 0.04, color: 0x142570, roughness: 0.4 });

  const shape = pts => new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const outer = new THREE.ExtrudeGeometry(shape(P), { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045, bevelSegments: 5, curveSegments: 6 });
  outer.translate(0, 0, -0.15);
  const glassMat = mat.glass({ thickness: 1.2 });
  addMesh(root, outer, glassMat);
  // the core: the same bolt, shrunk toward its middle, solid and emissive (opaque so it shows through the glass)
  const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
  const inner = P.map(p => [cx + (p[0] - cx) * 0.66, cy + (p[1] - cy) * 0.86]);
  const coreGeo = new THREE.ExtrudeGeometry(shape(inner), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 3 });
  coreGeo.translate(0, 0, -0.06);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  addMesh(root, coreGeo, coreMat);

  /* terminals top and bottom, with rings that pulse out of them */
  const term = (y, dir) => {
    addMesh(root, lathe([[0, 0], [0.2, 0, 0.015], [0.2, 0.06 * dir, 0.015], [0.12, 0.12 * dir, 0.02], [0.12, 0.2 * dir, 0.015], [0, 0.2 * dir]], 48, 3), dark, 0.2 * (dir > 0 ? 0.6 : -0.45), y, 0);
    addMesh(root, new THREE.TorusGeometry(0.125, 0.014, 8, 40), chrome, 0.2 * (dir > 0 ? 0.6 : -0.45), y + 0.1 * dir, 0).rotation.x = Math.PI / 2;
  };
  term(1.04, 1); term(-1.04, -1);
  const rings = [0, 1, 2, 3].map(i => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 6, 48), glow(L, { opacity: 0 })); m.rotation.x = Math.PI / 2; root.add(m);
    return { m, i, top: i % 2 === 0 };
  });
  const col = new THREE.Color(), ember = L ? new THREE.Color(0x3a63e6) : new THREE.Color(0x2a49c4), hot = L ? new THREE.Color(0x1d3fe0) : new THREE.Color(0xe8f0ff);

  const st = smoother(2.4);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { charge: 0 }), c = s.charge;
      col.copy(ember).lerp(hot, c); const flick = 0.92 + 0.08 * Math.sin(time * 1.5);
      coreMat.color.copy(col).multiplyScalar((0.55 + 0.9 * c) * flick);
      glassMat.emissiveIntensity = c * 0.28; glassMat.attenuationDistance = lerp(0.55, 0.38, c);
      rings.forEach(r => {
        const u = ((time * 0.28 * (0.3 + c) + r.i * 0.25) % 1 + 1) % 1;
        const x = 0.2 * (r.top ? 0.6 : -0.45), y = r.top ? 1.14 + u * 0.35 : -1.14 - u * 0.35;
        r.m.position.set(x, y, 0); r.m.scale.setScalar(1 + u * 0.8);
        r.m.material.opacity = c * (1 - u) * 0.8;
      });
      root.rotation.y = Math.sin(time * 0.35) * 0.3; root.rotation.x = Math.sin(time * 0.23) * 0.05;
    },
    dispose() { disposeTree(object); }
  };
}
