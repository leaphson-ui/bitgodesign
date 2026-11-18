/* Lightning bolt, second version: the same thick bevelled glass bolt with a visible solid energy core, and nothing
   attached above or below. The energy is the bolt's own: a bright pulse travels down the core along its zigzag and a
   faint rim glow follows it. charge 0..1 builds the core from ember to white-blue and speeds the pulse. */
import { THREE, mat, glow, smoother, sm, lerp, addMesh, disposeTree } from './_kit.js';

export const meta = {
  name: 'bolt-2', distance: 4.4, title: 'Bolt 2',
  means: 'Instant payments: a charge that crosses the network before you blink',
  pages: ['Lightning Network', 'Payments'],
  states: { charge: 'the core builds from ember to full light and its pulse quickens, 0..1' }
};

const P = [[0.12, 1.0], [-0.42, -0.06], [-0.06, -0.06], [-0.24, -1.0], [0.44, 0.14], [0.08, 0.14], [0.36, 1.0]];

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.892); object.add(root);
  const shape = pts => new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));

  const outer = new THREE.ExtrudeGeometry(shape(P), { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045, bevelSegments: 5, curveSegments: 6 });
  outer.translate(0, 0, -0.15);
  const glassMat = mat.glass({ thickness: 0.8, attenuationDistance: 1.2 });
  addMesh(root, outer, glassMat);

  /* the core: the same bolt shrunk toward its middle, solid and emissive so it shows through the glass */
  const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
  const inner = P.map(p => [cx + (p[0] - cx) * 0.62, cy + (p[1] - cy) * 0.88]);
  const coreGeo = new THREE.ExtrudeGeometry(shape(inner), { depth: 0.14, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.022, bevelSegments: 3 });
  coreGeo.translate(0, 0, -0.07);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const uP = { value: 1 }, uK = { value: 0 };
  coreMat.onBeforeCompile = sh => {
    sh.uniforms.uP = uP; sh.uniforms.uK = uK;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vY;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvY = position.y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vY; uniform float uP; uniform float uK;')
      .replace('#include <opaque_fragment>', 'float d = (vY - uP) * 2.2; float pulse = exp(-d * d); outgoingLight *= 0.75 + (0.9 + 1.4 * uK) * pulse;\n#include <opaque_fragment>');
  };
  addMesh(root, coreGeo, coreMat);
  /* a thin rim of light around the core, in front of nothing: it reads as the bolt's own edge glow */
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(coreGeo, 40), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, toneMapped: false }));
  root.add(edge);

  const col = new THREE.Color(), ember = L ? new THREE.Color(0x3a5ce8) : new THREE.Color(0x6f94ff), hot = L ? new THREE.Color(0x1d3fe0) : new THREE.Color(0xe8f0ff);
  const st = smoother(2.4);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { charge: 0 }), c = s.charge;
      col.copy(ember).lerp(hot, c);
      coreMat.color.copy(col).multiplyScalar(1.5 + 1.8 * c);
      edge.material.color.copy(col).lerp(new THREE.Color(1, 1, 1), 0.4); edge.material.opacity = 0.3 + 0.4 * c;
      const sp = 0.16 + 0.12 * c; uP.value = 1.1 - ((time * sp) % 1) * 2.4; uK.value = c;
      glassMat.emissiveIntensity = c * 0.2; glassMat.attenuationDistance = lerp(1.2, 0.8, c);
      root.rotation.y = Math.sin(time * 0.35) * 0.3; root.rotation.x = Math.sin(time * 0.23) * 0.05;
    },
    dispose() { disposeTree(object); }
  };
}
