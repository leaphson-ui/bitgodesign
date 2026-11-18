/* A bitcoin ASIC miner in Antminer-class proportions: a long rectangular brushed-aluminium chassis, a large fan at
   each end behind a guard, cut vent slots in the sides with heat-sink fins and the glow of the hash boards visible
   through them, a power-supply block mounted on top with its cables, and a control panel (two Ethernet ports, status
   lights, reset) at one end. hash 0..1 spins the fans (never faster than one turn in 4 s), lights the boards in the
   slots and runs the status lights. */
import { THREE, mat, glow, deep, rbox, addMesh, inst, smoother, sm, lerp, disposeTree } from './_kit.js';
import { buildPiece } from './_shieldgeo.js';

export const meta = {
  name: 'rig-2', distance: 4.2, title: 'Rig 2',
  means: 'Miners: serious hardware, running hot and counted by the hash',
  pages: ['Miners', 'Mining Pools'],
  states: { hash: 'fans spin up, the hash boards glow in the vents, the lights run, 0..1' }
};

const L_ = 1.7, H = 0.62, W = 0.5;                  // chassis length (x), height (y), depth (z)
const FR = 0.235;                                     // fan opening radius

function slotPanel(w, h, slots, depth) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.lineTo(-w / 2, -h / 2);
  slots.forEach(([cx, cy, sw, sh]) => {
    const p = new THREE.Path(), r = sh / 2, x0 = cx - sw / 2 + r, x1 = cx + sw / 2 - r;
    p.moveTo(x0, cy - r); p.lineTo(x1, cy - r); p.absarc(x1, cy, r, -Math.PI / 2, Math.PI / 2, false); p.lineTo(x0, cy + r); p.absarc(x0, cy, r, Math.PI / 2, Math.PI * 1.5, false);
    s.holes.push(p);
  });
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 8 });
}

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.945); root.position.y = -0.12; object.add(root);
  const alu = deep.alu({ color: 0x95a3cf, roughness: 0.4 }), aluD = deep.alu({ color: 0x6a79ab, roughness: 0.42 }), ink = deep.ink(), body = deep.metal({ color: 0x14267c }), chrome = mat.chrome();
  const glows = [];
  const gl = o => { const m = glow(L, o); glows.push(m); return m; };

  /* shell: top, bottom, back panel, and the front panel with real vent slots */
  addMesh(root, rbox(L_, 0.03, W, 0.01, 2), alu, 0, H / 2 - 0.015, 0);
  addMesh(root, rbox(L_, 0.03, W, 0.01, 2), aluD, 0, -H / 2 + 0.015, 0);
  const back = addMesh(root, rbox(L_, H, 0.02, 0.008, 1), aluD, 0, 0, -W / 2 + 0.01);
  const rows = [0.205, 0.07, -0.07, -0.205], SLOT = { cx: -0.15, w: 1.2, h: 0.085 };
  const panelGeo = slotPanel(L_, H - 0.05, rows.map(y => [SLOT.cx, y, SLOT.w, SLOT.h]), 0.02);
  addMesh(root, panelGeo, alu, 0, 0, W / 2 - 0.02);
  // ribs on the top plate
  const ribs = []; for (let i = 0; i < 34; i++) ribs.push({ p: [-0.78 + i * 0.047, H / 2 + 0.001, 0.05] });
  inst(rbox(0.012, 0.006, 0.34, 0.002, 1), aluD, ribs, root);
  /* inside: a dark core, fin blocks and the glow of a hash board behind each slot */
  addMesh(root, new THREE.BoxGeometry(L_ - 0.1, H - 0.06, W - 0.06), ink, 0, 0, -0.01);
  const finItems = []; rows.forEach(y => { for (let i = 0; i < 38; i++) finItems.push({ p: [-0.73 + i * 0.0305, y, W / 2 - 0.085] }); });
  inst(new THREE.BoxGeometry(0.008, 0.07, 0.07), mat.metal({ color: 0x2a43b8, roughness: 0.4, emissiveIntensity: 0.05 }), finItems, root);
  const boardGlow = rows.map(y => addMesh(root, new THREE.BoxGeometry(1.16, 0.06, 0.004), gl({ opacity: 0.1 }), SLOT.cx, y, W / 2 - 0.1));

  /* end frames, guards and fans */
  const fans = [];
  const frameShape = new THREE.Shape(); frameShape.moveTo(-W / 2, -H / 2); frameShape.lineTo(W / 2, -H / 2); frameShape.lineTo(W / 2, H / 2); frameShape.lineTo(-W / 2, H / 2); frameShape.lineTo(-W / 2, -H / 2);
  const hole = new THREE.Path(); hole.absarc(0, 0, FR, 0, Math.PI * 2, true); frameShape.holes.push(hole);
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 40 });
  const bladeShape = new THREE.Shape(); bladeShape.moveTo(0.045, -0.035); bladeShape.quadraticCurveTo(0.17, -0.12, 0.225, -0.02); bladeShape.quadraticCurveTo(0.15, 0.045, 0.045, 0.035); bladeShape.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.012, bevelEnabled: false });
  [-1, 1].forEach(sx => {
    const g = new THREE.Group(); g.position.x = sx * (L_ / 2); g.rotation.y = sx * Math.PI / 2; root.add(g);     // local +z points out of the end
    addMesh(g, frameGeo, aluD, 0, 0, -0.065);
    addMesh(g, new THREE.CylinderGeometry(FR, FR, 0.14, 48, 1, true), ink, 0, 0, -0.1).rotation.x = Math.PI / 2;
    // guard: rings and radial spokes in front of the fan
    [FR - 0.01, 0.17, 0.115, 0.06].forEach((r, i) => addMesh(g, new THREE.TorusGeometry(r, i ? 0.006 : 0.012, 8, 56), i ? ink : chrome, 0, 0, 0.008));
    for (let i = 0; i < 12; i++) { const sp = addMesh(g, new THREE.BoxGeometry(FR * 2 - 0.02, 0.008, 0.008), ink, 0, 0, 0.008); sp.rotation.z = i / 12 * Math.PI; }
    // fan
    const rot = new THREE.Group(); rot.position.z = -0.03; g.add(rot);
    addMesh(rot, new THREE.CylinderGeometry(0.055, 0.055, 0.05, 24), body, 0, 0, 0).rotation.x = Math.PI / 2;
    for (let i = 0; i < 9; i++) { const b = addMesh(rot, bladeGeo, deep.metal({ color: 0x1a30a0 }), 0, 0, -0.006); b.rotation.z = i / 9 * Math.PI * 2; b.rotation.x = 0; }
    addMesh(g, rbox(0.02, 0.1, 0.012, 0.004), chrome, 0, 0, 0.01).visible = false;
    fans.push({ rot, dir: sx });
  });
  // chrome screws on each end frame corner
  const screws = []; [-1, 1].forEach(sx => [-1, 1].forEach(sy => [-1, 1].forEach(sz => screws.push({ p: [sx * (L_ / 2 + 0.002), sy * (H / 2 - 0.03), sz * (W / 2 - 0.03)], s: [0.5, 1, 1] }))));
  inst(new THREE.SphereGeometry(0.017, 10, 6), chrome, screws, root);

  /* control panel at the +x end of the front: two Ethernet ports, status lights, reset */
  const CX = 0.7, CP = new THREE.Group(); CP.position.set(CX, 0, W / 2); root.add(CP);
  addMesh(CP, rbox(0.26, 0.5, 0.014, 0.008, 2), ink, 0, 0, 0.002);
  [0.12, -0.04].forEach(y => {
    addMesh(CP, rbox(0.12, 0.09, 0.012, 0.006), chrome, -0.04, y, 0.012);
    addMesh(CP, new THREE.BoxGeometry(0.1, 0.07, 0.01), ink, -0.04, y, 0.016);
    const pins = []; for (let i = 0; i < 8; i++) pins.push({ p: [-0.04 - 0.035 + i * 0.01, y - 0.02, 0.022] });
    inst(new THREE.BoxGeometry(0.004, 0.02, 0.004), mat.chrome({ color: 0xd8b36a }), pins, CP);
  });
  addMesh(CP, new THREE.CylinderGeometry(0.02, 0.02, 0.012, 16), chrome, -0.04, -0.15, 0.012).rotation.x = Math.PI / 2;      // power inlet
  addMesh(CP, new THREE.CylinderGeometry(0.008, 0.008, 0.012, 10), ink, 0.07, -0.18, 0.014).rotation.x = Math.PI / 2;        // reset pin-hole
  const leds = [0, 1, 2, 3].map(i => { const m = gl({ opacity: 0.12 }); addMesh(CP, new THREE.CylinderGeometry(0.012, 0.012, 0.008, 12), m, 0.08, 0.17 - i * 0.04, 0.016).rotation.x = Math.PI / 2; return m; });
  addMesh(CP, new THREE.BoxGeometry(0.2, 0.012, 0.004), chrome, 0, 0.225, 0.011);
  const cs = []; [[-0.11, 0.22], [0.11, 0.22], [-0.11, -0.22], [0.11, -0.22]].forEach(([x, y]) => cs.push({ p: [x, y, 0.011], s: [1, 1, 0.5] }));
  inst(new THREE.SphereGeometry(0.012, 8, 6), chrome, cs, CP);

  /* power supply mounted on top, with its cables */
  const PSU = new THREE.Group(); PSU.position.set(-0.42, H / 2 + 0.115, 0.0); root.add(PSU);
  addMesh(PSU, rbox(0.74, 0.22, 0.42, 0.02, 3), body, 0, 0, 0);
  const sl = []; for (let i = 0; i < 14; i++) sl.push({ p: [-0.3 + i * 0.046, 0.0, 0.211] });
  inst(new THREE.BoxGeometry(0.018, 0.12, 0.006), ink, sl, PSU);
  addMesh(PSU, rbox(0.3, 0.05, 0.008, 0.004), ink, 0.17, 0.075, 0.213); addMesh(PSU, new THREE.BoxGeometry(0.16, 0.007, 0.004), gl({ opacity: 0.1 }), 0.17, 0.075, 0.219);
  const badge = addMesh(PSU, buildPiece([], 0, 0, 0.1), chrome, -0.3, 0.07, 0.216); badge.scale.setScalar(0.035);
  [-1, 1].forEach(s => addMesh(PSU, rbox(0.05, 0.03, 0.44, 0.008), chrome, s * 0.3, 0.12, 0));
  addMesh(PSU, rbox(0.3, 0.02, 0.03, 0.008), chrome, 0.0, 0.125, 0.0);
  [-0.15, 0.15].forEach(dz => {                       // a cable from the PSU's end down to the chassis top
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0.37, -0.02, dz), new THREE.Vector3(0.5, 0.0, dz * 1.2), new THREE.Vector3(0.58, 0.04 - 0.07, dz * 1.1), new THREE.Vector3(0.6, -0.11, dz)]);
    const tube = new THREE.TubeGeometry(c, 24, 0.016, 8, false); addMesh(PSU, tube, ink);
    addMesh(PSU, new THREE.CylinderGeometry(0.022, 0.022, 0.04, 12), chrome, 0.6, -0.12, dz);
  });
  // feet
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => addMesh(root, new THREE.CylinderGeometry(0.03, 0.034, 0.03, 14), ink, sx * 0.72, -H / 2 - 0.015, sz * 0.17)));

  let spin = 0;
  const st = smoother(2.0);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { hash: 0 }), h = s.hash;
      spin += s.dt * (0.12 + 1.38 * h);                // up to about 1.5 rad/s: one turn in a little over 4 s
      fans.forEach(f => { f.rot.rotation.z = f.dir * spin; });
      boardGlow.forEach((m, i) => { m.material.opacity = 0.1 + h * (0.6 + 0.2 * Math.sin(time * 0.9 + i * 0.8)); });
      leds.forEach((m, i) => { const ph = 0.5 + 0.5 * Math.sin(time * 1.2 - i * 0.9); m.opacity = 0.12 + h * (0.2 + 0.7 * ph * ph); });
      root.rotation.y = Math.sin(time * 0.3) * 0.05;
    },
    dispose() { disposeTree(object); }
  };
}
