/* A round bank-vault door: thick ring frame, a door on heavy hinges, twelve radial locking bolts, a spoked
   handle wheel around a combination dial with a glass BitGo shield. open 0..1: the wheel turns, the bolts
   draw back, then the door swings out and the deposit wall behind it lights. */
import { THREE, mat, glow, lathe, latheZ, rbox, addMesh, inst, smoother, sm, lerp, disposeTree } from './_kit.js';
import { buildPiece } from './_shieldgeo.js';

export const meta = {
  name: 'vault', title: 'Vault',
  means: 'Assets sit behind a real door: bolted, hinged, opened only by the right hands',
  pages: ['Custody', 'Cold Storage', 'Qualified Custody'],
  states: { open: 'wheel turns, bolts retract, door swings open, 0..1' }
};

export function create(opts = {}) {
  const L = !!opts.light, hi = opts.quality !== 'low', seg = hi ? 72 : 40;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.8); object.add(root);
  const bodyMat = mat.metal({ emissiveIntensity: 0.04, color: 0x2240b0, roughness: 0.36, envMapIntensity: 0.7 }), frameMat = mat.metal({ emissiveIntensity: 0.04, color: 0x182b86, roughness: 0.42, envMapIntensity: 0.7 });
  const chrome = mat.chrome(), ink = mat.ink({ clearcoat: 0.15, color: 0x050b2c });

  /* ---- ring frame (axis = z) ---- */
  const frame = addMesh(root, latheZ([[1.0, -0.17], [1.0, 0.1, 0.04], [0.93, 0.17, 0.03], [0.85, 0.16, 0.012], [0.85, 0.1, 0.012], [0.78, 0.1, 0.012], [0.78, -0.17]], seg), frameMat);
  // chrome lip around the opening and a bolt-head ring on the frame face
  addMesh(root, new THREE.TorusGeometry(0.79, 0.012, 10, seg), chrome, 0, 0, 0.1);
  const heads = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + 0.2; heads.push({ p: [Math.cos(a) * 0.89, Math.sin(a) * 0.89, 0.17], s: [1, 1, 0.55] }); }
  inst(new THREE.SphereGeometry(0.026, 12, 8), chrome, heads, root);
  // the lamp on top of the frame
  addMesh(root, rbox(0.17, 0.07, 0.05, 0.015), chrome, 0, 0.94, 0.15);
  const lamp = addMesh(root, new THREE.BoxGeometry(0.11, 0.032, 0.012), glow(L, { opacity: 0.25 }), 0, 0.94, 0.178);

  /* ---- interior: a tube, a back wall of deposit boxes, a glow ---- */
  const tube = addMesh(root, lathe([[0.77, 0.12], [0.77, -0.9]], seg), mat.ink({ clearcoat: 0.15, color: 0x07123c, side: THREE.BackSide }));
  tube.rotation.x = Math.PI / 2;
  addMesh(root, new THREE.CircleGeometry(0.77, seg), mat.ink({ clearcoat: 0.15, color: 0x060e32 }), 0, 0, -0.9);
  const boxes = [];
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
    const x = (c - 3) * 0.2, y = (r - 3) * 0.2; if (Math.hypot(x, y) > 0.68) continue;
    boxes.push({ p: [x, y, -0.84], s: [1, 1, 1] });
  }
  inst(rbox(0.17, 0.17, 0.12, 0.012), mat.metal({ emissiveIntensity: 0.04, color: 0x1c2f86, roughness: 0.4 }), boxes, root);
  inst(rbox(0.07, 0.014, 0.014, 0.005), chrome, boxes.map(b => ({ p: [b.p[0], b.p[1] - 0.045, -0.77] })), root);
  const back = addMesh(root, new THREE.CircleGeometry(0.7, seg), glow(L, { opacity: 0 }), 0, 0, -0.775);

  /* ---- hinges, on the frame side ---- */
  const HX = -0.84, HZ = 0.06;
  [0.5, 0, -0.5].forEach(y => {
    addMesh(root, new THREE.CylinderGeometry(0.05, 0.05, 0.2, 20), chrome, HX, y, HZ + 0.02);
    addMesh(root, rbox(0.14, 0.18, 0.03, 0.01), frameMat, HX - 0.1, y, HZ - 0.04);
    addMesh(root, new THREE.SphereGeometry(0.035, 12, 8), chrome, HX - 0.1, y + 0.05, HZ - 0.02);
  });

  /* ---- the door, hinged on the left ---- */
  const hinge = new THREE.Group(); hinge.position.set(HX, 0, HZ); root.add(hinge);
  const door = new THREE.Group(); door.position.set(-HX, 0, -HZ + 0.0); hinge.add(door);
  const doorFace = latheZ([[0, -0.12], [0.72, -0.12], [0.72, 0.08, 0.012], [0.68, 0.11, 0.012], [0.655, 0.11], [0.645, 0.07, 0.01], [0.485, 0.07], [0.475, 0.09, 0.01], [0.46, 0.09], [0.45, 0.07], [0.2, 0.07], [0.18, 0.1, 0.01], [0.15, 0.13, 0.02], [0, 0.13]], seg);
  addMesh(door, doorFace, bodyMat);
  addMesh(door, new THREE.TorusGeometry(0.4, 0.012, 8, seg), chrome, 0, 0, 0.075);
  // rivets on the rim band
  const riv = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; riv.push({ p: [Math.cos(a) * 0.675, Math.sin(a) * 0.675, 0.11], s: [1, 1, 0.5] }); }
  inst(new THREE.SphereGeometry(0.016, 10, 6), chrome, riv, door);
  // bolts and the bolt carriers that slide in the track on the door face
  const bolts = [], carriers = [], N = 12;
  const boltGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.22, 20); boltGeo.rotateZ(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(0.03, 0.036, 0.03, 20); capGeo.rotateZ(Math.PI / 2);
  const carGeo = rbox(0.15, 0.07, 0.035, 0.012);
  for (let i = 0; i < N; i++) {
    const g = new THREE.Group(); g.rotation.z = i / N * Math.PI * 2; door.add(g);
    const b = addMesh(g, boltGeo, chrome, 0, 0, -0.02); addMesh(b, capGeo, bodyMat, 0.12, 0, 0);
    const c = addMesh(g, carGeo, bodyMat, 0, 0, 0.088); addMesh(c, new THREE.BoxGeometry(0.09, 0.012, 0.006), chrome, 0, 0, 0.02);
    bolts.push(b); carriers.push(c);
    // dark slot under each carrier
    addMesh(g, new THREE.BoxGeometry(0.22, 0.02, 0.004), ink, 0.575, 0, 0.074);
  }
  // wheel: hub, six spokes, ball ends, around a dial with a glass shield
  const wheel = new THREE.Group(); wheel.position.z = 0.13; door.add(wheel);
  addMesh(wheel, latheZ([[0, 0], [0.135, 0], [0.135, 0.03, 0.01], [0.115, 0.06, 0.01], [0, 0.06]], 48), chrome);
  const spokeGeo = new THREE.CylinderGeometry(0.02, 0.026, 0.3, 14); spokeGeo.rotateZ(Math.PI / 2); spokeGeo.translate(0.27, 0, 0.03);
  const ballGeo = new THREE.SphereGeometry(0.05, 20, 14);
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); g.rotation.z = i / 6 * Math.PI * 2; wheel.add(g);
    addMesh(g, spokeGeo, chrome); addMesh(g, ballGeo, chrome, 0.45, 0, 0.03);
    addMesh(g, new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), bodyMat, 0.16, 0, 0.03).rotation.x = Math.PI / 2;
  }
  const dial = addMesh(door, latheZ([[0, 0], [0.1, 0], [0.1, 0.03, 0.01], [0.085, 0.05, 0.01], [0, 0.05]], 48), ink, 0, 0, 0.19);
  const ticks = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; ticks.push({ p: [Math.cos(a) * 0.092, Math.sin(a) * 0.092, 0.222], r: [0, 0, a], s: [i % 5 ? 0.5 : 1, 1, 1] }); }
  const tickGeo = new THREE.BoxGeometry(0.022, 0.004, 0.004);
  const tk = inst(tickGeo, chrome, ticks, door);
  const crest = addMesh(door, buildPiece([], 0, 0, 0.12), mat.glass({ thickness: 0.4 }), 0, 0.005, 0.24); crest.scale.setScalar(0.052);

  const st = smoother(2.6);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { open: 0 }), o = s.open;
      const wheelT = sm(0, 0.38, o), boltT = sm(0.2, 0.5, o), swing = sm(0.5, 1, o);
      wheel.rotation.z = -wheelT * Math.PI * 1.1;
      dial.rotation.z = wheelT * 0.8; tk.rotation.z = wheelT * 0.8;
      bolts.forEach(b => { b.position.x = lerp(0.7, 0.55, boltT); });
      carriers.forEach(c => { c.position.x = lerp(0.62, 0.52, boltT); });
      hinge.rotation.y = -swing * 1.22;
      back.material.opacity = sm(0.55, 1, o) * 0.55;
      lamp.material.opacity = 0.25 + 0.75 * sm(0.3, 0.9, o) * (0.85 + 0.15 * Math.sin(time * 1.5));
      root.rotation.y = 0; root.position.x = swing * 0.12;
    },
    dispose() { disposeTree(object); }
  };
}
