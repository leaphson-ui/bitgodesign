/* A bitcoin mining ASIC unit: a blue-metal chassis with a ribbed heat-sink block on top, two caged fans on the
   front, a glass label plate with the BitGo shield, side vents, handles and a status strip. hash 0..1 spins the fans
   up (slowly, never faster than one turn in four seconds), lights the strip and warms the heat fins. */
import { THREE, mat, glow, rbox, lathe, addMesh, inst, smoother, sm, lerp, disposeTree } from './_kit.js';
import { buildPiece } from './_shieldgeo.js';

export const meta = {
  name: 'rig', distance: 3.8, title: 'Rig',
  means: 'Miners: serious hardware, running hot and counted by the hash',
  pages: ['Miners', 'Mining Pools'],
  states: { hash: 'fans spin up, the strip lights and the fins warm, 0..1' }
};

const FZ = 0.42;

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(1.012); root.position.y = -0.12; object.add(root);
  const metal = mat.metal({ emissiveIntensity: 0.04, color: 0x2240b0, roughness: 0.36, envMapIntensity: 0.75 }), dark = mat.metal({ emissiveIntensity: 0.04, color: 0x142570, roughness: 0.45, envMapIntensity: 0.6 });
  const chrome = mat.chrome(), ink = mat.ink({ clearcoat: 0.15, color: 0x040a28, roughness: 0.55, envMapIntensity: 0.3 });

  addMesh(root, rbox(1.5, 0.5, 0.84, 0.02, 3), metal, 0, 0, 0);
  addMesh(root, rbox(1.54, 0.46, 0.04, 0.012, 2), dark, 0, 0, FZ);
  /* heat-sink fins on top */
  const finMat = mat.metal({ emissiveIntensity: 0.04, color: 0x1f3aa8, roughness: 0.35, envMapIntensity: 0.7, emissive: new THREE.Color(0.2, 0.4, 1) });
  const fins = []; for (let i = 0; i < 38; i++) fins.push({ p: [-0.69 + i * 0.0373, 0.34, -0.02] });
  const finIM = inst(rbox(0.014, 0.18, 0.78, 0.003, 1), finMat, fins, root);
  addMesh(root, rbox(1.46, 0.03, 0.8, 0.008), dark, 0, 0.255, -0.02);
  addMesh(root, rbox(1.46, 0.025, 0.82, 0.008), dark, 0, 0.44, -0.02);
  /* handles and side vents */
  [-1, 1].forEach(s => {
    [0.2, -0.2].forEach(z => addMesh(root, new THREE.CylinderGeometry(0.016, 0.016, 0.07, 10), chrome, s * 0.79, 0.12, z).rotation.z = Math.PI / 2);
    addMesh(root, new THREE.CylinderGeometry(0.02, 0.02, 0.5, 12), chrome, s * 0.83, 0.12, 0).rotation.x = Math.PI / 2;
    const sl = []; for (let i = 0; i < 12; i++) sl.push({ p: [s * 0.752, -0.1, -0.33 + i * 0.06] });
    inst(new THREE.BoxGeometry(0.006, 0.2, 0.026), ink, sl, root);
  });
  /* fans */
  const fans = [];
  [-0.36, 0.36].forEach(x => {
    const g = new THREE.Group(); g.position.set(x, -0.02, FZ + 0.02); root.add(g);
    addMesh(g, lathe([[0, 0], [0.31, 0, 0.01], [0.31, -0.02, 0.01], [0, -0.02]], 40, 2), ink, 0, 0, -0.0).rotation.x = Math.PI / 2;
    // guard: concentric rings and spokes
    [0.29, 0.2, 0.11].forEach(r => addMesh(g, new THREE.TorusGeometry(r, r === 0.29 ? 0.016 : 0.01, 8, 48), dark, 0, 0, 0.05));
    for (let i = 0; i < 8; i++) { const sp = addMesh(g, new THREE.BoxGeometry(0.28, 0.012, 0.012), dark, 0, 0, 0.05); sp.rotation.z = i / 8 * Math.PI; }
    const rot = new THREE.Group(); rot.position.z = 0.0; g.add(rot);
    addMesh(rot, new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20), metal, 0, 0, 0.0).rotation.x = Math.PI / 2;
    const bladeShape = new THREE.Shape(); bladeShape.moveTo(0.04, -0.03); bladeShape.quadraticCurveTo(0.16, -0.1, 0.27, -0.02); bladeShape.quadraticCurveTo(0.17, 0.04, 0.04, 0.03); bladeShape.closePath();
    const bg = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.008, bevelEnabled: false });
    for (let i = 0; i < 7; i++) { const b = addMesh(rot, bg, dark); b.rotation.z = i / 7 * Math.PI * 2; b.rotation.x = 0.0; b.position.z = -0.004; }
    fans.push(rot);
  });
  /* label plate (glass over ink) and status strip, in front of the glass for the glow */
  addMesh(root, rbox(0.5, 0.12, 0.012, 0.006), ink, 0, 0.19, FZ + 0.025);
  addMesh(root, rbox(0.56, 0.16, 0.02, 0.008), mat.glass({ thickness: 0.3 }), 0, 0.19, FZ + 0.045);
  const crest = addMesh(root, buildPiece([], 0, 0, 0.1), chrome, -0.18, 0.19, FZ + 0.062); crest.scale.setScalar(0.04);
  const strip = addMesh(root, new THREE.BoxGeometry(0.3, 0.012, 0.006), glow(L, { opacity: 0.2 }), 0.1, 0.19, FZ + 0.062);
  const leds = [0, 1, 2, 3, 4].map(i => { const m = glow(L, { opacity: 0.15 }); addMesh(root, new THREE.CylinderGeometry(0.012, 0.012, 0.006, 12), m, 0.2 + i * 0.04, 0.215, FZ + 0.064).rotation.x = Math.PI / 2; return m; });
  const base = addMesh(root, new THREE.BoxGeometry(1.3, 0.008, 0.01), glow(L, { opacity: 0.15 }), 0, -0.255, FZ + 0.03);

  let spin = 0;
  const st = smoother(2.0), warm = new THREE.Color(), c0 = new THREE.Color(0.1, 0.25, 0.9), c1 = new THREE.Color(0.9, 0.95, 1.0);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { hash: 0 }), h = s.hash;
      spin += s.dt * (0.05 + 0.2) * (h * 2 * Math.PI) * 0.9 + s.dt * 0.15;     // up to about one turn in 4 s
      fans.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * spin; });
      warm.copy(c0).lerp(c1, h * 0.6); finMat.emissive.copy(warm); finMat.emissiveIntensity = 0.08 + 0.6 * h;
      strip.material.opacity = 0.2 + 0.7 * h; base.material.opacity = 0.15 + 0.6 * h;
      leds.forEach((m, i) => { const ph = 0.5 + 0.5 * Math.sin(time * 1.2 - i * 0.8); m.opacity = 0.15 + h * (0.2 + 0.7 * ph * ph); });
      root.rotation.y = Math.sin(time * 0.3) * 0.05;
    },
    dispose() { disposeTree(object); }
  };
}
