/* A charter: a sheet of ice-white paper with a blue double border and ruled text, floating on a dark board with
   chrome corners. A scalloped metal seal with a glass BitGo shield and a two-tailed ribbon is pressed on.
   sealed 0..1: the seal comes down and stamps, the ribbon unfurls, and the border lights: licensed and attested. */
import { THREE, mat, glow, rbox, addMesh, inst, lathe, creased, smoother, sm, lerp, clamp, disposeTree } from './_kit.js';
import { buildPiece } from './_shieldgeo.js';

export const meta = {
  name: 'charter', title: 'Charter',
  means: 'Licensed, chartered and attested: the paper behind the platform',
  pages: ['Trust Charter', 'Compliance', 'GENIUS Act'],
  states: { sealed: 'the seal stamps down and the ribbon unfurls, 0..1' }
};

const PW = 0.86, PH = 1.14;

function paperTexture() {
  const c = document.createElement('canvas'); c.width = 600; c.height = 796; const x = c.getContext('2d');
  x.fillStyle = '#f2f6ff'; x.fillRect(0, 0, 600, 796);
  x.strokeStyle = '#1647db'; x.lineWidth = 12; x.strokeRect(20, 20, 560, 756); x.lineWidth = 2.5; x.strokeRect(42, 42, 516, 712);
  x.strokeStyle = 'rgba(22,71,219,0.35)'; x.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(60 + i * 4, 70); x.lineTo(540 - i * 4, 70); x.stroke(); }
  x.fillStyle = '#1647db'; x.font = 'bold 46px Georgia, serif'; x.textAlign = 'center'; x.fillText('CHARTER', 300, 150);
  x.fillStyle = 'rgba(22,71,219,0.45)'; x.font = '20px Georgia, serif'; x.fillText('OF TRUST AND CUSTODY', 300, 188);
  x.fillStyle = 'rgba(20,40,110,0.28)';
  for (let r = 0; r < 12; r++) { const w = 420 - ((r * 53) % 90); x.fillRect(90, 240 + r * 26, r % 5 === 4 ? w * 0.6 : w, 7); }
  x.fillRect(90, 650, 160, 3); x.fillRect(350, 650, 160, 3);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(1.092); root.rotation.z = 0.04; object.add(root);
  const chrome = mat.chrome(), dark = mat.metal({ emissiveIntensity: 0.04, color: 0x142570, roughness: 0.45, envMapIntensity: 0.6 }), ink = mat.ink({ clearcoat: 0.15, color: 0x050b2c, roughness: 0.6, envMapIntensity: 0.3 });
  const tex = paperTexture();

  /* board and corners */
  addMesh(root, rbox(PW + 0.2, PH + 0.2, 0.05, 0.02, 3), dark, 0, 0, -0.05);
  addMesh(root, rbox(PW + 0.06, PH + 0.06, 0.012, 0.008), ink, 0, 0, -0.02);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
    const g = new THREE.Group(); g.position.set(a * (PW / 2 + 0.07), b * (PH / 2 + 0.07), 0.0); root.add(g);
    addMesh(g, rbox(0.11, 0.025, 0.03, 0.006), chrome, -a * 0.03, 0, 0); addMesh(g, rbox(0.025, 0.11, 0.03, 0.006), chrome, 0, -b * 0.03, 0);
  });
  /* paper: slightly bowed */
  const pg = new THREE.PlaneGeometry(PW, PH, 16, 20), pp = pg.attributes.position;
  for (let i = 0; i < pp.count; i++) { const u = pp.getX(i) / (PW / 2), v = pp.getY(i) / (PH / 2); pp.setZ(i, 0.012 * (Math.pow(Math.abs(u), 3) + 0.5 * Math.pow(Math.abs(v), 3))); }
  pg.computeVertexNormals();
  const paper = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3, side: THREE.DoubleSide });
  addMesh(root, pg, paper, 0, 0, 0);
  const edge = addMesh(root, new THREE.PlaneGeometry(PW - 0.03, PH - 0.03), glow(L, { opacity: 0 }), 0, 0, 0.0); edge.visible = false;
  // light rule along the border
  const bw = 0.006, bm = glow(L, { opacity: 0 });
  [[PW - 0.08, bw, 0, PH / 2 - 0.04], [PW - 0.08, bw, 0, -PH / 2 + 0.04], [bw, PH - 0.08, PW / 2 - 0.04, 0], [bw, PH - 0.08, -PW / 2 + 0.04, 0]].forEach(([w, h, x, y]) => addMesh(root, new THREE.PlaneGeometry(w, h), bm, x, y, 0.014));

  /* seal: scalloped metal disc, raised ring, glass shield, ribbons */
  const seal = new THREE.Group(); seal.position.set(0, -0.3, 0); root.add(seal);
  const SR = 0.17, pts = [], n = 28 * 4;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = SR * (1 + 0.07 * Math.cos(a * 28)); pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
  const sg = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2 });
  addMesh(seal, creased(sg, 0.6), mat.metal({ emissiveIntensity: 0.04, color: 0x2c4cc4, roughness: 0.28, envMapIntensity: 1 }), 0, 0, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(SR * 0.78, 0.01, 8, 56), chrome); ring.position.z = 0.047; seal.add(ring);
  const crest = addMesh(seal, buildPiece([], 0, 0, 0.14), mat.glass({ thickness: 0.4 }), 0, 0.005, 0.058); crest.scale.setScalar(0.065);
  const rib = [-1, 1].map(s => {
    const g = new THREE.PlaneGeometry(0.1, 0.42, 3, 14); g.translate(0, -0.21, 0);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x1647db, roughness: 0.45, side: THREE.DoubleSide, emissive: 0x0a2a9a, emissiveIntensity: 0.3 }));
    m.position.set(s * 0.05, -SR * 0.6, -0.012); m.rotation.z = s * 0.14; root.add(m); seal.add(m);
    return { m, s, base: g.attributes.position.array.slice() };
  });

  const st = smoother(2.2);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { sealed: 0 }), k = s.sealed;
      const drop = sm(0, 0.45, k), press = sm(0.42, 0.55, k), unf = sm(0.5, 1, k);
      seal.position.z = (1 - drop) * 0.6 - press * 0.01 + 0.012; seal.position.y = -0.3 + (1 - drop) * 0.25;
      seal.rotation.z = (1 - drop) * 0.3; seal.scale.setScalar(lerp(1.15, 1, drop));
      bm.opacity = sm(0.5, 0.9, k) * 0.85;
      rib.forEach(r => {
        const pos = r.m.geometry.attributes.position, b = r.base;
        r.m.scale.y = Math.max(0.001, unf);
        for (let i = 0; i < pos.count; i++) { const y = -b[i * 3 + 1] / 0.42; pos.setZ(i, Math.sin(time * 0.9 + y * 3 + r.s) * 0.018 * y * unf + y * 0.02); }
        pos.needsUpdate = true; r.m.geometry.computeVertexNormals();
      });
      root.rotation.y = Math.sin(time * 0.3) * 0.08;
    },
    dispose() { tex.dispose(); disposeTree(object); }
  };
}
