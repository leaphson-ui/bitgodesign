/* A hardware security module as a 2U rack unit between two rack posts: brushed blue-metal chassis, a glass front
   over a recessed display, vents, keypad, status lights, handles and ear screws. active 0..1 lights the display,
   runs the status lights and brings the glass and the edge strip alive. */
import { THREE, mat, glow, rbox, addMesh, inst, smoother, sm, lerp, disposeTree } from './_kit.js';
import { buildPiece } from './_shieldgeo.js';

export const meta = {
  name: 'hsm', distance: 4.1, title: 'HSM',
  means: 'Keys are made and used inside tamper-proof hardware, and never leave it',
  pages: ['Security', 'Key Management', 'Infrastructure'],
  states: { active: 'display, status lights and edge strip come alive, 0..1' }
};

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.819); root.position.y = 0.04; object.add(root);
  const metal = mat.metal({ emissiveIntensity: 0.04, color: 0x2240b0, roughness: 0.36, envMapIntensity: 0.75 });
  const dark = mat.metal({ emissiveIntensity: 0.04, color: 0x142570, roughness: 0.45, envMapIntensity: 0.6 });
  const chrome = mat.chrome(), ink = mat.ink({ clearcoat: 0.15, color: 0x040a28 });
  const FZ = 0.5;

  /* rack posts with hole pattern */
  [-1, 1].forEach(s => {
    addMesh(root, rbox(0.07, 0.86, 0.07, 0.012), dark, s * 0.972, 0, FZ - 0.05);
    const holes = []; for (let i = -3; i <= 3; i++) holes.push({ p: [s * 0.972, i * 0.115, FZ - 0.0128], s: [1, 1, 1] });
    inst(new THREE.BoxGeometry(0.026, 0.044, 0.004), ink, holes, root);
  });

  /* chassis, front plate, rack ears */
  addMesh(root, rbox(1.7, 0.32, 0.95, 0.018, 3), metal, 0, 0, 0);
  addMesh(root, rbox(1.86, 0.34, 0.032, 0.012, 3), metal, 0, 0, FZ - 0.003);
  [-1, 1].forEach(s => [0.1, -0.1].forEach(y => {
    addMesh(root, new THREE.BoxGeometry(0.034, 0.05, 0.006), ink, s * 0.895, y, FZ + 0.0145);
    addMesh(root, new THREE.CylinderGeometry(0.014, 0.014, 0.012, 14), chrome, s * 0.895, y, FZ + 0.02).rotation.x = Math.PI / 2;
  }));
  // handles
  [-1, 1].forEach(s => {
    const x = s * 0.8; addMesh(root, new THREE.CylinderGeometry(0.014, 0.014, 0.07, 12), chrome, x, 0.1, FZ + 0.045).rotation.x = Math.PI / 2;
    addMesh(root, new THREE.CylinderGeometry(0.014, 0.014, 0.07, 12), chrome, x, -0.1, FZ + 0.045).rotation.x = Math.PI / 2;
    addMesh(root, new THREE.CylinderGeometry(0.018, 0.018, 0.2, 16), chrome, x, 0, FZ + 0.08);
  });

  /* glass front over the recessed display */
  addMesh(root, rbox(1.12, 0.25, 0.012, 0.01), ink, 0.0, 0, FZ + 0.006);
  const glassMat = mat.glass({ thickness: 0.35 });
  addMesh(root, rbox(1.16, 0.27, 0.026, 0.012, 3), glassMat, 0, 0, FZ + 0.022);
  addMesh(root, new THREE.BoxGeometry(1.14, 0.006, 0.006), chrome, 0, 0.138, FZ + 0.03);
  addMesh(root, new THREE.BoxGeometry(1.14, 0.006, 0.006), chrome, 0, -0.138, FZ + 0.03);
  // display and its text lines
  addMesh(root, rbox(0.46, 0.13, 0.008, 0.005), mat.ink({ clearcoat: 0.15, color: 0x02061a, roughness: 0.15 }), -0.15, 0.03, FZ + 0.038);
  const lineMat = glow(L, { opacity: 0 });
  const lines = [[0.34, 0.036], [0.26, 0.012], [0.3, -0.012], [0.18, -0.036]].map(([w, y], i) => ({ p: [-0.15 - (0.34 - w) / 2 - 0.0, 0.03 + y, FZ + 0.0415], s: [w, 1, 1] }));
  inst(new THREE.BoxGeometry(1, 0.007, 0.002), lineMat, lines, root);
  // status lights
  const leds = []; for (let i = 0; i < 6; i++) {
    const m = glow(L, { opacity: 0.1 }); const d = addMesh(root, new THREE.CylinderGeometry(0.012, 0.012, 0.006, 14), m, 0.17 + i * 0.05, 0.05, FZ + 0.0405); d.rotation.x = Math.PI / 2; leds.push(m);
    addMesh(root, new THREE.TorusGeometry(0.014, 0.003, 6, 16), chrome, 0.17 + i * 0.05, 0.05, FZ + 0.0395);
  }
  // shield badge under the glass
  const badge = addMesh(root, buildPiece([], 0, 0, 0.1), mat.chrome({ roughness: 0.2 }), -0.5, 0.0, FZ + 0.04); badge.scale.setScalar(0.055);
  // vent slots (left) and keypad + card slot (right)
  const vents = []; for (let i = 0; i < 9; i++) vents.push({ p: [-0.84 + i * 0.026, 0, FZ + 0.0135] });
  inst(new THREE.BoxGeometry(0.012, 0.2, 0.004), ink, vents, root);
  // vents on the right side too, but the keypad sits there
  const keys = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) keys.push({ p: [0.72 + c * 0.05, 0.065 - r * 0.05, FZ + 0.02] });
  inst(rbox(0.034, 0.034, 0.012, 0.006), chrome, keys, root);
  addMesh(root, rbox(0.17, 0.2, 0.006, 0.004), ink, 0.77, 0.0, FZ + 0.0165);
  addMesh(root, rbox(0.14, 0.012, 0.012, 0.004), ink, 0.77, -0.115, FZ + 0.02);
  // the edge light strip
  const strip = addMesh(root, new THREE.BoxGeometry(1.4, 0.008, 0.01), glow(L, { opacity: 0.1 }), 0, -0.158, FZ + 0.04);

  /* lid ridges and rear perforation */
  const ridges = []; for (let i = 0; i < 30; i++) ridges.push({ p: [-0.8 + i * 0.0552, 0.165, -0.12] });
  inst(rbox(0.012, 0.006, 0.6, 0.003), dark, ridges, root);
  const perf = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 22; c++) perf.push({ p: [-0.77 + c * 0.0735, 0.1662, -0.36 - r * 0.04] });
  inst(new THREE.BoxGeometry(0.04, 0.003, 0.02), ink, perf, root);

  /* neighbours: vented blanking plates above and below */
  [0.265, -0.265].forEach(y => {
    addMesh(root, rbox(1.86, 0.16, 0.032, 0.01, 2), dark, 0, y, FZ - 0.003);
    const sl = []; for (let i = 0; i < 40; i++) sl.push({ p: [-0.78 + i * 0.04, y, FZ + 0.0135] });
    inst(new THREE.BoxGeometry(0.018, 0.09, 0.004), ink, sl, root);
  });

  const st = smoother(2.6);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { active: 0 }), a = s.active;
      lineMat.opacity = a * (0.7 + 0.15 * Math.sin(time * 1.2));
      leds.forEach((m, i) => { const ph = 0.5 + 0.5 * Math.sin(time * 1.2 - i * 0.7); m.opacity = 0.1 + a * (0.25 + 0.7 * ph * ph); });
      strip.material.opacity = 0.1 + a * (0.65 + 0.2 * Math.sin(time * 1.2));
      glassMat.emissiveIntensity = a * 0.18;
      root.rotation.y = Math.sin(time * 0.3) * 0.05;
    },
    dispose() { disposeTree(object); }
  };
}
