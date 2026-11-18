/* A suspension-bridge span: two tapered H-towers on piers, a glass deck on a truss, main cables with hangers,
   side spans to anchorage blocks. flow 0..1 sends light pulses along the cables and streaks across the deck:
   value crossing from one side to the other, settlement across the Go Network. */
import { THREE, mat, glow, rbox, addMesh, inst, smoother, sm, lerp, clamp, disposeTree } from './_kit.js';

export const meta = {
  name: 'bridge', distance: 4.3, title: 'Bridge',
  means: 'Settlement that crosses institutions without waiting: value moves over a span built to carry it',
  pages: ['Settlement', 'Go Network', 'Trading'],
  states: { flow: 'light pulses cross the cables and deck, 0..1' }
};

const TX = 0.55, TOP = 0.6, AXN = 1.0, ZS = 0.13;       // tower x, cable height at the tower, anchorage x, cable z

/* cable height along x (main span sags, side spans fall to the anchorage) */
const cableY = x => {
  const a = Math.abs(x);
  if (a <= TX) return 0.1 + (TOP - 0.1) * Math.pow(x / TX, 2);
  return 0.02 + (TOP - 0.02) * Math.pow(clamp((AXN - a) / (AXN - TX)), 1.35);
};

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.731); root.position.y = -0.04; object.add(root);
  const metal = mat.metal({ emissiveIntensity: 0.04, color: 0x2240b0, roughness: 0.38, envMapIntensity: 0.7 }), dark = mat.metal({ emissiveIntensity: 0.04, color: 0x142570, roughness: 0.45, envMapIntensity: 0.6 });
  const chrome = mat.chrome({ roughness: 0.1 }), ink = mat.ink({ clearcoat: 0.15, color: 0x050b2c, roughness: 0.65, envMapIntensity: 0.3 });

  /* water: a dark slab with a few faint light rules */
  addMesh(root, rbox(2.3, 0.04, 0.95, 0.012, 2), ink, 0, -0.52, 0);
  const rules = []; for (let i = 0; i < 7; i++) rules.push({ p: [-0.9 + i * 0.3, -0.495, ((i * 37) % 7 - 3) * 0.12], s: [0.18 + (i % 3) * 0.06, 1, 1] });
  inst(new THREE.BoxGeometry(1, 0.002, 0.006), glow(L, { opacity: 0.35 }), rules, root);

  /* deck: glass slab, edge rails, a truss beneath */
  addMesh(root, rbox(2.0, 0.04, 0.3, 0.008, 2), mat.glass({ thickness: 0.4 }), 0, 0, 0);
  [-1, 1].forEach(s => {
    addMesh(root, rbox(2.0, 0.012, 0.012, 0.004, 1), chrome, 0, 0.035, s * 0.145);
    addMesh(root, rbox(2.0, 0.014, 0.014, 0.004, 1), metal, 0, -0.03, s * 0.135);
    addMesh(root, rbox(2.0, 0.014, 0.014, 0.004, 1), metal, 0, -0.11, s * 0.135);
  });
  const diag = []; for (let i = 0; i < 50; i++) [-1, 1].forEach(s => diag.push({ p: [-0.98 + i * 0.04, -0.07, s * 0.135], r: [0, 0, (i % 2 ? 1 : -1) * 0.82] }));
  inst(new THREE.BoxGeometry(0.008, 0.115, 0.008), metal, diag, root);
  const posts = []; for (let i = 0; i <= 50; i++) [-1, 1].forEach(s => posts.push({ p: [-1 + i * 0.04, 0.0, s * 0.145] }));
  // lamp posts every 0.2
  const lamps = []; for (let i = 0; i <= 10; i++) [-1, 1].forEach(s => lamps.push({ p: [-1 + i * 0.2, 0.065, s * 0.145] }));
  inst(new THREE.CylinderGeometry(0.004, 0.004, 0.055, 6), chrome, lamps, root);
  inst(new THREE.SphereGeometry(0.01, 8, 6), glow(L, { opacity: 0.85 }), lamps.map(l => ({ p: [l.p[0], l.p[1] + 0.03, l.p[2]] })), root);
  const dashes = []; for (let i = 0; i < 20; i++) dashes.push({ p: [-0.95 + i * 0.1, 0.0215, 0] });
  inst(new THREE.BoxGeometry(0.05, 0.002, 0.008), glow(L, { opacity: 0.35 }), dashes, root);

  /* towers: two tapered legs, cross-beams, caps, and the pier down to the water */
  [-1, 1].forEach(sx => {
    [-1, 1].forEach(sz => {
      const leg = new THREE.CylinderGeometry(0.03, 0.045, TOP + 0.14, 4, 1); leg.rotateY(Math.PI / 4);
      addMesh(root, leg, metal, sx * TX, (TOP + 0.14) / 2 - 0.14 + 0.0, sz * ZS);
    });
    [0.18, 0.42].forEach(y => addMesh(root, rbox(0.04, 0.03, 0.27 + 0.0, 0.008), dark, sx * TX, y, 0));
    addMesh(root, rbox(0.08, 0.04, 0.3, 0.01), chrome, sx * TX, TOP + 0.03, 0);
    addMesh(root, new THREE.BoxGeometry(0.0, 0, 0), chrome);   // placeholder to keep indices stable
    addMesh(root, new THREE.SphereGeometry(0.012, 10, 8), glow(L, { opacity: 0.9 }), sx * TX, TOP + 0.06, 0);
    addMesh(root, rbox(0.17, 0.4, 0.34, 0.012, 2), dark, sx * TX, -0.33, 0);
    // an X brace between the legs
    [-1, 1].forEach(d => { const b = addMesh(root, new THREE.BoxGeometry(0.012, 0.014, 0.33), metal, sx * TX, 0.3, 0); b.rotation.x = d * 0.42; b.scale.z = 0.9; });
  });
  // anchorages and approach roads
  [-1, 1].forEach(sx => addMesh(root, rbox(0.14, 0.22, 0.34, 0.012, 2), dark, sx * 1.04, -0.09, 0));

  /* cables: chrome tubes following the profile, hangers dropping to the deck */
  const cablePts = z => { const p = []; for (let i = 0; i <= 120; i++) { const x = -AXN + (2 * AXN * i) / 120; p.push(new THREE.Vector3(x, cableY(x), z)); } return p; };
  const paths = [-1, 1].map(s => cablePts(s * ZS));
  paths.forEach(p => addMesh(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 160, 0.0085, 8, false), chrome));
  const hang = []; paths.forEach((p, k) => { for (let i = 3; i <= 117; i += 3) { const x = p[i].x; if (Math.abs(Math.abs(x) - TX) < 0.02) continue; const y = p[i].y, h = y - 0.02; hang.push({ p: [x, 0.02 + h / 2, p[i].z], s: [1, h, 1] }); } });
  inst(new THREE.CylinderGeometry(0.0025, 0.0025, 1, 5), chrome, hang, root);

  /* flow: pulses on the cables and streaks on the deck */
  const pulseGeo = new THREE.SphereGeometry(0.02, 10, 8), pulseMat = glow(L);
  const pulses = []; paths.forEach((p, pi) => { for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(pulseGeo, pulseMat); root.add(m); pulses.push({ m, p, off: i / 12 + pi * 0.04, dir: pi ? -1 : 1, i }); } });
  const streakGeo = new THREE.BoxGeometry(0.14, 0.006, 0.018);
  const streaks = []; for (let i = 0; i < 10; i++) { const lane = i % 2 ? 1 : -1, m = new THREE.Mesh(streakGeo, pulseMat); root.add(m); streaks.push({ m, lane, off: i / 10 }); }
  const pt = new THREE.Vector3();

  const st = smoother(2.2);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { flow: 0 }), f = s.flow, speed = 0.05 + 0.17 * f;
      pulses.forEach(q => {
        const live = q.i / 12 < 0.18 + 0.82 * f;
        q.m.visible = live;
        if (!live) return;
        let u = ((time * speed * q.dir + q.off) % 1 + 1) % 1;
        const pts = q.p, fi = u * 120, i0 = Math.floor(fi), i1 = Math.min(120, i0 + 1);
        pt.copy(pts[i0]).lerp(pts[i1], fi - i0);
        q.m.position.copy(pt); q.m.scale.setScalar(0.6 + 0.8 * Math.sin(Math.PI * u));
      });
      streaks.forEach(q => {
        const live = (q.off < 0.2 + 0.8 * f);
        q.m.visible = live;
        const u = ((time * speed * q.lane + q.off) % 1 + 1) % 1;
        q.m.position.set(-0.96 + u * 1.92, 0.025, q.lane * 0.05);
        q.m.scale.x = 0.6 + f;
      });
      root.rotation.y = Math.sin(time * 0.3) * 0.03;
    },
    dispose() { disposeTree(object); }
  };
}
