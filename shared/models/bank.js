/* A classical bank facade: stepped base, six fluted columns with bases and capitals, an entablature with
   triglyph frieze and dentils, and a pediment holding a glass BitGo shield. Doors and windows sit behind the
   portico. lit 0..1 brings the windows, door and the shield alive: the institution opening for the day. */
import { THREE, mat, glow, lathe, rbox, addMesh, inst, creased, smoother, sm, disposeTree } from './_kit.js';
import { buildPiece } from './_shieldgeo.js';

export const meta = {
  name: 'bank', title: 'Bank',
  means: 'A chartered institution: regulated, established, open for business',
  pages: ['Trust Charter', 'Institutions', 'Qualified Custody'],
  states: { lit: 'windows, door and the shield light up, 0..1' }
};

function flutedColumn(R, H, flutes = 16) {
  const pts = [], n = flutes * 5;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = R * (1 - 0.055 * (0.5 + 0.5 * Math.cos(a * flutes))); pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: H, bevelEnabled: false, steps: 1 });
  g.rotateX(-Math.PI / 2); return creased(g, 0.6);
}

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.736); root.position.y = -0.02; object.add(root);
  const stone = mat.metal({ emissiveIntensity: 0.04, color: 0x3350c4, roughness: 0.55, envMapIntensity: 0.6, clearcoat: 0.1, emissiveIntensity: 0.03 });
  const stone2 = mat.metal({ emissiveIntensity: 0.04, color: 0x23399c, roughness: 0.6, envMapIntensity: 0.55, clearcoat: 0.1, emissiveIntensity: 0.03 });
  const chrome = mat.chrome(), ink = mat.ink({ clearcoat: 0.15, color: 0x050b2c, roughness: 0.7, envMapIntensity: 0.25 });
  const glows = [];
  const gl = (o) => { const m = glow(L, o); glows.push(m); return m; };
  const Y0 = -0.72;

  /* steps */
  [[1.96, 0.05, 0.9], [1.84, 0.05, 0.78], [1.72, 0.05, 0.66]].forEach(([w, h, d], i) => addMesh(root, rbox(w, h, d, 0.01), i % 2 ? stone2 : stone, 0, Y0 + 0.025 + i * 0.05, d / 2 - 0.45 + 0.15));
  const SY = Y0 + 0.15;                         // top of the stylobate
  addMesh(root, rbox(1.66, 0.05, 0.62, 0.01), stone2, 0, SY + 0.025, 0.03);
  const base0 = SY + 0.05;

  /* building behind the portico: cella wall, pilasters, side wings */
  addMesh(root, rbox(1.5, 0.98, 0.06, 0.01), stone2, 0, base0 + 0.49, -0.22);
  addMesh(root, rbox(1.62, 0.98, 0.5, 0.01), ink, 0, base0 + 0.49, -0.52);
  [-1, 1].forEach(s => addMesh(root, rbox(0.07, 0.9, 0.04, 0.01), stone, s * 0.72, base0 + 0.45, -0.185));
  // door: frame, two leaves, transom
  const DX = 0, DH = 0.5;
  addMesh(root, rbox(0.34, DH + 0.04, 0.05, 0.01), chrome, DX, base0 + DH / 2, -0.19);
  [-1, 1].forEach(s => { addMesh(root, rbox(0.14, DH - 0.04, 0.03, 0.01), ink, DX + s * 0.075, base0 + (DH - 0.04) / 2, -0.17); addMesh(root, new THREE.BoxGeometry(0.01, DH - 0.12, 0.006), gl({ opacity: 0.05 }), DX + s * 0.075, base0 + (DH - 0.04) / 2, -0.152); addMesh(root, new THREE.CylinderGeometry(0.01, 0.01, 0.08, 10), chrome, DX + s * 0.018, base0 + DH * 0.45, -0.145); });
  addMesh(root, rbox(0.3, 0.1, 0.026, 0.008), mat.glass({ thickness: 0.5 }), DX, base0 + DH + 0.09, -0.185);
  // windows between the columns: glass panes, ink reveals, light muntins in front
  [-0.56, -0.3, 0.3, 0.56].forEach(x => {
    addMesh(root, rbox(0.16, 0.42, 0.045, 0.01), chrome, x, base0 + 0.52, -0.195);
    addMesh(root, rbox(0.13, 0.39, 0.03, 0.008), mat.glass({ thickness: 0.5 }), x, base0 + 0.52, -0.178);
    addMesh(root, new THREE.BoxGeometry(0.135, 0.008, 0.006), gl({ opacity: 0.05 }), x, base0 + 0.52, -0.158);
    addMesh(root, new THREE.BoxGeometry(0.008, 0.39, 0.006), gl({ opacity: 0.05 }), x, base0 + 0.52, -0.158);
    addMesh(root, rbox(0.2, 0.03, 0.06, 0.008), stone, x, base0 + 0.27, -0.185);
  });

  /* columns: instanced fluted shafts with bases and capitals */
  const R = 0.06, CH = 0.74, xs = [-0.72, -0.43, -0.145, 0.145, 0.43, 0.72].map(x => x * 0.98);
  const shaft = flutedColumn(R, CH);
  const baseG = lathe([[0, 0], [R * 1.5, 0, 0.004], [R * 1.5, 0.025, 0.006], [R * 1.2, 0.04, 0.008], [R * 1.28, 0.055, 0.008], [R * 1.05, 0.06], [0, 0.06]], 32, 2);
  const capG = lathe([[0, 0], [R * 1.1, 0], [R * 1.1, 0.01, 0.006], [R * 1.5, 0.06, 0.02], [R * 1.5, 0.08], [0, 0.08]], 32, 2);
  const abG = rbox(R * 3.4, 0.03, R * 3.4, 0.006);
  const ZC = 0.18;
  const cols = xs.map(x => ({ p: [x, base0 + 0.06, ZC] }));
  inst(shaft, stone, cols, root).position.y = 0;
  inst(baseG, stone2, xs.map(x => ({ p: [x, base0, ZC] })), root);
  inst(capG, stone2, xs.map(x => ({ p: [x, base0 + 0.06 + CH, ZC] })), root);
  inst(abG, stone, xs.map(x => ({ p: [x, base0 + 0.06 + CH + 0.095, ZC] })), root);

  /* entablature */
  const ET = base0 + 0.06 + CH + 0.11;          // underside of the architrave
  addMesh(root, rbox(1.66, 0.075, 0.54, 0.008), stone, 0, ET + 0.0375, 0.1);
  addMesh(root, new THREE.BoxGeometry(1.64, 0.012, 0.5), stone2, 0, ET + 0.081, 0.1);
  addMesh(root, rbox(1.68, 0.1, 0.54, 0.008), stone2, 0, ET + 0.137, 0.1);
  const tri = []; for (let i = 0; i < 17; i++) tri.push({ p: [-0.74 + i * 0.0925, ET + 0.137, 0.375], s: [1, 1, 1] });
  inst(new THREE.BoxGeometry(0.03, 0.082, 0.008), stone, tri, root);
  const den = []; for (let i = 0; i < 40; i++) den.push({ p: [-0.8 + i * 0.041, ET + 0.2, 0.385] });
  inst(new THREE.BoxGeometry(0.02, 0.022, 0.03), stone, den, root);
  addMesh(root, rbox(1.76, 0.05, 0.62, 0.01), stone, 0, ET + 0.236, 0.1);

  /* pediment: extruded triangle, a recessed tympanum, raking mouldings, the glass shield */
  const PY = ET + 0.261, PW = 1.76, PH = 0.34;
  const tshape = new THREE.Shape([new THREE.Vector2(-PW / 2, 0), new THREE.Vector2(PW / 2, 0), new THREE.Vector2(0, PH)]);
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tshape, { depth: 0.54, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }), stone);
  ped.position.set(0, PY, 0.1 - 0.27); root.add(ped);
  const ts = PW * 0.84, th = PH * 0.78, tym = new THREE.Shape([new THREE.Vector2(-ts / 2, 0), new THREE.Vector2(ts / 2, 0), new THREE.Vector2(0, th)]);
  const tymM = new THREE.Mesh(new THREE.ExtrudeGeometry(tym, { depth: 0.01, bevelEnabled: false }), ink);
  tymM.position.set(0, PY + 0.012, 0.1 + 0.27 + 0.006); root.add(tymM);
  const rake = Math.atan2(PH, PW / 2), rl = Math.hypot(PH, PW / 2);
  [-1, 1].forEach(s => { const r = addMesh(root, rbox(rl, 0.03, 0.6, 0.008), stone2, s * PW / 4, PY + PH / 2 + 0.012, 0.1); r.rotation.z = -s * rake; });
  const crest = addMesh(root, buildPiece([], 0, 0, 0.2), mat.glass({ thickness: 0.8 }), 0, PY + 0.17, 0.1 + 0.27 + 0.03); crest.scale.setScalar(0.1);
  const crestHalo = addMesh(root, new THREE.RingGeometry(0.115, 0.125, 48), gl({ opacity: 0.05 }), 0, PY + 0.17, 0.1 + 0.27 + 0.025);
  // acroteria on the apex and the ends
  [[0, PY + PH + 0.03], [-PW / 2 + 0.02, PY + 0.03], [PW / 2 - 0.02, PY + 0.03]].forEach(([x, y]) => addMesh(root, lathe([[0, 0], [0.04, 0, 0.01], [0.025, 0.04, 0.01], [0.035, 0.07, 0.01], [0, 0.08]], 20, 2), stone2, x, y - 0.02, 0.1));
  // a light line along the lowest step
  const edge = addMesh(root, new THREE.BoxGeometry(1.7, 0.006, 0.006), gl({ opacity: 0.05 }), 0, Y0 + 0.157, 0.41);
  // plaques at the front: the building's name plate on the frieze
  addMesh(root, rbox(0.3, 0.04, 0.012, 0.006), chrome, 0, ET + 0.137, 0.385 + 0.006);

  const st = smoother(2.4);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { lit: 0 }), k = sm(0, 1, s.lit);
      glows.forEach((m, i) => { m.opacity = 0.05 + k * (0.75 + 0.1 * Math.sin(time * 1.3 + i * 0.9)); });
      root.rotation.y = Math.sin(time * 0.3) * 0.03;
    },
    dispose() { disposeTree(object); }
  };
}
