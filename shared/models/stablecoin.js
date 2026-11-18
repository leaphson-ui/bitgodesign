/* Dollars becoming fully backed digital tokens. A banded stack of stylised paper notes (not a copy of any real
   note) sits beside an empty spot. tokenize 0..1: notes peel off the top one after another, turn from paper into
   glass in the air, fold down into a thick glass token with a $ relief and land on a growing token stack:
   one token per note, 1:1. At 1 about half of the notes have become tokens. */
import { THREE, mat, glow, lathe, rbox, addMesh, inst, smoother, sm, lerp, clamp, disposeTree } from './_kit.js';

export const meta = {
  name: 'stablecoin', distance: 4.1, title: 'Stablecoin',
  means: 'Every token is one dollar, held and backed one for one',
  pages: ['Stablecoins', 'Mint', 'GENIUS Act'],
  states: { tokenize: 'notes lift, turn to glass and land as tokens, 0..1' }
};

const N = 12, M = 6;                       // notes in the stack, notes that become tokens
const BW = 0.78, BD = 0.34, BT = 0.007, PITCH = 0.02;   // note width, depth, thickness, spacing in the stack
const BX = -0.5, TX = 0.52, Y0 = 0.07;     // stack centres (x) and the resting height
const TR = 0.17, TH = 0.085;               // token radius, height

/* the stylised note face: ice paper, a thin BitGo-blue border band, quiet guilloche rings */
function noteCanvas() {
  const c = document.createElement('canvas'); c.width = 768; c.height = 336; const x = c.getContext('2d');
  x.fillStyle = '#f1f6ff'; x.fillRect(0, 0, 768, 336);
  x.strokeStyle = 'rgba(22,71,219,0.13)'; x.lineWidth = 1.5;
  for (let r = 20; r < 330; r += 7) { x.beginPath(); x.ellipse(384, 168, r * 1.6, r * 0.62, 0, 0, Math.PI * 2); x.stroke(); }
  x.strokeStyle = '#1647db'; x.lineWidth = 14; x.strokeRect(14, 14, 740, 308);
  x.lineWidth = 2.5; x.strokeRect(36, 36, 696, 264);
  x.fillStyle = '#1647db'; [[70, 76], [698, 76], [70, 262], [698, 262]].forEach(([px, py]) => { x.font = 'bold 34px Georgia, serif'; x.textAlign = 'center'; x.fillText('$', px, py + 10); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/* a $ built from a tube along an S curve and a bar, flat enough to read as raised ink or a relief */
function dollarGeo(h = 1, r = 0.03) {
  const S = [[0.85, 0.62], [0.5, 0.92], [-0.15, 0.92], [-0.6, 0.55], [-0.35, 0.12], [0.3, -0.08], [0.72, -0.5], [0.4, -0.9], [-0.2, -0.95], [-0.85, -0.62]].map(p => new THREE.Vector3(p[0] * 0.5, p[1] * 0.5, 0));
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(S, false, 'centripetal'), 48, r, 8, false);
  const bar = new THREE.CylinderGeometry(r * 0.7, r * 0.7, 1.35 * h * 0.5 * 2 / 2, 8); bar.translate(0, 0, 0);
  const g = new THREE.BufferGeometry(); const parts = [tube, bar].map(p => p.toNonIndexed());
  const pos = [], nor = []; parts.forEach(p => { pos.push(...p.attributes.position.array); nor.push(...p.attributes.normal.array); });
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.scale(h, h, 1); return g;
}

/* a paper slab with gently bowed edges */
function paperGeo(w, d, t) {
  const g = new THREE.BoxGeometry(w, t, d, 16, 1, 6), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) / (w / 2), v = p.getZ(i) / (d / 2); p.setY(i, p.getY(i) + 0.012 * (Math.pow(Math.abs(u), 4) + 0.6 * Math.pow(Math.abs(v), 4))); }
  g.computeVertexNormals(); return g;
}
function printGeo(w, d, t) {
  const g = new THREE.PlaneGeometry(w - 0.004, d - 0.004, 16, 6); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) / (w / 2), v = p.getZ(i) / (d / 2); p.setY(i, t / 2 + 0.0005 + 0.012 * (Math.pow(Math.abs(u), 4) + 0.6 * Math.pow(Math.abs(v), 4))); }
  g.computeVertexNormals(); return g;
}

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.931); object.add(root);
  const ink = mat.ink({ color: 0x050b2c }), chrome = mat.chrome();
  const paperSide = new THREE.MeshStandardMaterial({ color: 0xe6edfb, roughness: 0.9, emissive: 0xc9d8ff, emissiveIntensity: 0.22 });
  const faceTex = noteCanvas();
  const paperTop = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.8, emissive: 0xffffff, emissiveMap: faceTex, emissiveIntensity: 0.3 });
  const dolMat = new THREE.MeshStandardMaterial({ color: 0x1647db, roughness: 0.35, metalness: 0.2 });
  const slabGeo = paperGeo(BW, BD, BT), prGeo = printGeo(BW, BD, BT), dGeo = dollarGeo(0.2, 0.011);

  /* the base: a dark ledger slab with a light rule that grows as tokens are issued */
  addMesh(root, rbox(2.0, 0.05, 0.78, 0.014, 3), ink, 0, -0.005, 0);
  const rule = addMesh(root, new THREE.BoxGeometry(1, 0.006, 0.012), glow(L, { opacity: 0.85 }), 0, 0.022, 0.31);
  const tokRing = addMesh(root, new THREE.TorusGeometry(TR + 0.06, 0.008, 8, 48), glow(L, { opacity: 0 }), TX, 0.022, 0); tokRing.rotation.x = Math.PI / 2;

  /* the notes: each is its own sheet so the layers show on the side of the stack */
  const notes = [];
  for (let i = 0; i < N; i++) {
    const j = N - 1 - i, conv = j < M;                  // j counts from the top; the top M convert
    const g = new THREE.Group(); root.add(g);
    const sm1 = conv ? paperSide.clone() : paperSide, st1 = conv ? paperTop.clone() : paperTop, dm = conv ? dolMat.clone() : dolMat;
    if (conv) [sm1, st1, dm].forEach(m => { m.transparent = true; });
    addMesh(g, slabGeo, sm1); addMesh(g, prGeo, st1);
    const dol = conv ? addMesh(g, dGeo, dm, 0, BT / 2 + 0.0035, 0) : null; if (dol) { dol.rotation.x = -Math.PI / 2; dol.scale.z = 0.3; }
    if (i === N - 1 && !conv) addMesh(g, dGeo, dm, 0, BT / 2 + 0.004, 0).rotation.x = -Math.PI / 2;
    const rest = new THREE.Vector3(BX + Math.sin(i * 1.7) * 0.006, Y0 + i * PITCH, Math.cos(i * 2.3) * 0.006);
    g.position.copy(rest); g.rotation.y = Math.sin(i * 2.9) * 0.012;
    notes.push({ g, rest, j, conv, mats: [sm1, st1, dm], restRotY: g.rotation.y });
  }
  // the paper strap: four thin panels around the middle of the stack
  const sh = N * PITCH + 0.01, sy = Y0 + (N - 1) * PITCH / 2, bandMat = new THREE.MeshStandardMaterial({ color: 0x1647db, roughness: 0.7 });
  [[0.1, sh, 0.004, BX, sy, BD / 2 + 0.014], [0.1, sh, 0.004, BX, sy, -BD / 2 - 0.014]].forEach(([w, h, d, x, y, z]) => addMesh(root, new THREE.BoxGeometry(w, h, d), bandMat, x, y, z));
  [[0.1, 0.004, BD + 0.032, BX, Y0 + (N - 1) * PITCH + 0.012, 0], [0.1, 0.004, BD + 0.032, BX, Y0 - 0.012, 0]].forEach(([w, h, d, x, y, z]) => addMesh(root, new THREE.BoxGeometry(w, h, d), bandMat, x, y, z));
  addMesh(root, new THREE.BoxGeometry(0.1, 0.007, 0.002), new THREE.MeshStandardMaterial({ color: 0xf1f6ff, roughness: 0.6 }), BX, sy, BD / 2 + 0.0166);

  /* the tokens: thick glass discs with a chrome rim and a raised $ */
  const tokGeo = lathe([[0, -TH / 2], [TR, -TH / 2, 0.012], [TR, TH / 2, 0.012], [TR - 0.03, TH / 2 + 0.006, 0.01], [TR - 0.05, TH / 2 - 0.002], [0, TH / 2 - 0.002]], 40, 3);
  const rimGeo = new THREE.TorusGeometry(TR - 0.012, 0.009, 8, 48); rimGeo.rotateX(Math.PI / 2);
  const relGeo = dollarGeo(0.19, 0.012); relGeo.rotateX(-Math.PI / 2);
  const tokens = [];
  for (let k = 0; k < M; k++) {
    const g = new THREE.Group(); g.visible = false; root.add(g);
    const gm = mat.glass({ thickness: 0.5 });
    addMesh(g, tokGeo, gm); addMesh(g, rimGeo, chrome, 0, TH / 2 - 0.004, 0);
    const rel = addMesh(g, relGeo, chrome, 0, TH / 2 + 0.002, 0); rel.scale.set(1, 0.5, 1);
    tokens.push({ g, gm, k, land: new THREE.Vector3(TX, 0.03 + TH / 2 + k * (TH + 0.008), 0) });
  }

  const st = smoother(2.2);
  const ease = t => t * t * (3 - 2 * t);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { tokenize: 0 }), t = s.tokenize;
      const w = 0.42, stag = (1 - w) / (M - 1);
      let landed = 0;
      notes.forEach(n => {
        if (!n.conv) return;
        const u = clamp((t - n.j * stag) / w), lift = sm(0, 0.3, u) * (1 - sm(0.6, 1, u)), x = sm(0.2, 0.95, u), tok = tokens[n.j];
        const fade = 1 - sm(0.3, 0.6, u), shrink = lerp(1, 0.22, sm(0.28, 0.62, u));
        n.g.visible = fade > 0.01;
        n.mats.forEach(m => { m.opacity = fade; });
        const arc = Math.sin(Math.PI * sm(0.05, 0.95, u)) * 0.5;
        n.g.position.set(lerp(n.rest.x, tok.land.x, ease(x)), lerp(n.rest.y, tok.land.y, sm(0.55, 1, u)) + lift * 0.28 + arc * 0.4, lerp(n.rest.z, 0, x));
        n.g.rotation.set(-lift * 0.25 * (1 - x), n.restRotY * (1 - x) + sm(0.3, 0.6, u) * 0.6, 0);
        n.g.scale.set(shrink, 1, shrink);
        // the glass token appears as the paper goes, then drops onto its stack
        tok.g.visible = u > 0.28;
        const grow = sm(0.28, 0.66, u), flash = Math.sin(Math.PI * sm(0.3, 0.7, u));
        tok.g.position.copy(n.g.position); tok.g.scale.setScalar(lerp(0.3, 1, grow));
        tok.g.rotation.set(lerp(0.9, 0, sm(0.3, 0.85, u)), time * 0 + sm(0.28, 1, u) * 0.0, lerp(0.3, 0, sm(0.4, 0.9, u)));
        tok.gm.emissiveIntensity = flash * 0.9 + (u >= 1 ? 0.1 : 0);
        if (u >= 1) landed++;
      });
      const rw = Math.max(0.0001, 0.18 + (TX - BX - 0.2) * sm(0, 0.9, t)); rule.scale.x = rw; rule.position.x = BX + 0.09 + (rw - 0.18) / 2;
      tokRing.material.opacity = 0.7 * sm(0.05, 0.4, t) * (0.7 + 0.3 * Math.sin(time * 1.5));
    },
    dispose() { faceTex.dispose(); disposeTree(object); }
  };
}
