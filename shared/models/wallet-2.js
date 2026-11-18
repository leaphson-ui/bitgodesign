/* A slim leather bifold, second version: landscape panels in dark grain leather with a blue sheen, stitched edges,
   a flush chrome edge trim and a soft rolled spine; no hinges, no book proportions. Inside: stepped card pockets
   holding glass cards, and a bill pocket. A small chrome shield badge on the front.
   open 0..1: the wallet opens flat, then the cards slide up out of their pockets one after another.
   cold 0..1: the cards frost over and their glow fades (hot wallet to cold wallet). */
import { THREE, mat, glow, deep, rbox, addMesh, inst, smoother, sm, lerp, disposeTree } from './_kit.js';
import { buildPiece } from './_shieldgeo.js';

export const meta = {
  name: 'wallet-2', distance: 4.3, title: 'Wallet 2',
  means: 'Your keys and assets in one slim case: warm and ready, or frosted and cold',
  pages: ['Wallets', 'Hot and Cold', 'Self-Custody'],
  states: { open: 'the wallet opens flat, then the cards slide out, 0..1', cold: 'cards frost over and the glow fades, 0..1' }
};

const PW = 0.98, PH = 0.74, T = 0.032;            // one panel: width, height, thickness
const AX = 0.05;                                   // spine axis height above the back panel's centre plane

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(1.170); object.add(root);
  const leather = deep.leather(), lining = deep.leather({ color: 0x060b24, sheenColor: new THREE.Color(0x1f3fb5) });
  const chrome = mat.chrome({ roughness: 0.2 }), trimM = mat.chrome({ color: 0x7f8fc0, roughness: 0.22 }), brushed = deep.alu({ roughness: 0.3 });
  const stitchGeo = new THREE.BoxGeometry(0.026, 0.006, 0.006), stitchMat = new THREE.MeshStandardMaterial({ color: 0x4a68d8, roughness: 0.5, emissive: 0x2a4de0, emissiveIntensity: 0.2 });

  const stitchRect = (w, h, z, inset = 0.035, skip = null) => {
    const it = [], hw = w / 2 - inset, hh = h / 2 - inset;
    const edge = (x0, y0, x1, y1) => { const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.04); for (let i = 0; i <= n; i++) { const t = i / n; it.push({ p: [lerp(x0, x1, t), lerp(y0, y1, t), z], r: [0, 0, Math.atan2(y1 - y0, x1 - x0)] }); } };
    edge(-hw, -hh, hw, -hh); edge(hw, -hh, hw, hh); edge(hw, hh, -hw, hh); edge(-hw, hh, -hw, -hh);
    return it;
  };
  const trim = (g, z) => {              // chrome edge trim: four thin bars around the panel rim
    addMesh(g, rbox(PW, 0.012, T + 0.006, 0.004, 1), trimM, 0, PH / 2, z); addMesh(g, rbox(PW, 0.012, T + 0.006, 0.004, 1), trimM, 0, -PH / 2, z);
    addMesh(g, rbox(0.012, PH, T + 0.006, 0.004, 1), trimM, PW / 2, 0, z); addMesh(g, rbox(0.012, PH, T + 0.006, 0.004, 1), trimM, -PW / 2, 0, z);
  };
  const panelGeo = rbox(PW, PH, T, 0.03, 4);

  /* back panel (fixed): card pockets on its inner face */
  const back = new THREE.Group(); root.add(back);
  const bp = new THREE.Group(); bp.position.x = PW / 2; back.add(bp);
  addMesh(bp, panelGeo, leather); trim(bp, 0);
  addMesh(bp, rbox(PW - 0.06, PH - 0.06, 0.008, 0.02, 2), lining, 0, 0, T / 2 + 0.002);
  inst(stitchGeo, stitchMat, stitchRect(PW, PH, T / 2 + 0.008), bp);
  // cards sit in three stepped pockets (leather strips), each strip a little shorter than the one behind
  const CW = 0.66, CH = 0.34, rows = [0.18, 0.05, -0.08, -0.21];
  const frostRef = mat.frost();
  const cards = rows.map((y, i) => {
    const m = mat.glass({ thickness: 0.35 });
    const pivot = new THREE.Group(); pivot.position.set(-0.08, y - 0.19, T / 2 + 0.008 + i * 0.006); bp.add(pivot);
    addMesh(pivot, rbox(CW, CH, 0.006, 0.014, 2), m, 0, CH / 2, 0);
    const bar = addMesh(pivot, new THREE.BoxGeometry(CW - 0.14, 0.008, 0.008), glow(L, { opacity: 0.85 }), 0, CH - 0.04, 0.005);
    addMesh(pivot, rbox(0.06, 0.045, 0.004, 0.004), chrome, -CW / 2 + 0.08, CH * 0.5, 0.005);
    const strip = addMesh(bp, rbox(CW + 0.1, 0.17, 0.008, 0.012, 2), leather, -0.08, y - 0.12, T / 2 + 0.012 + i * 0.006 + 0.008);
    inst(stitchGeo, stitchMat, Array.from({ length: 14 }, (_, k) => ({ p: [-0.08 - CW / 2 + 0.04 + k * 0.047, y - 0.045, T / 2 + 0.019 + i * 0.006 + 0.008] })), bp);
    return { pivot, m, bar, i, y0: y - 0.19 };
  });
  // the soft spine: a rolled leather bead
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, PH - 0.02, 20), leather); spine.position.set(0, 0, AX); root.add(spine);

  /* front panel swings about the spine, opening flat */
  const front = new THREE.Group(); front.position.set(0, 0, AX); root.add(front);
  const fp = new THREE.Group(); fp.position.set(PW / 2, 0, AX * 1.0); front.add(fp);
  addMesh(fp, panelGeo, leather); trim(fp, 0);
  addMesh(fp, rbox(PW - 0.06, PH - 0.06, 0.008, 0.02, 2), lining, 0, 0, -T / 2 - 0.002);
  inst(stitchGeo, stitchMat, stitchRect(PW, PH, T / 2 + 0.008), fp);
  inst(stitchGeo, stitchMat, stitchRect(PW, PH, -T / 2 - 0.008), fp);
  // the badge on the outer face and a metal tab clasp on the free edge
  const badge = addMesh(fp, buildPiece([], 0, 0, 0.08), chrome, PW / 2 - 0.2, -PH / 2 + 0.17, T / 2 + 0.012); badge.scale.setScalar(0.07);
  addMesh(fp, rbox(0.04, 0.2, 0.022, 0.008, 2), brushed, PW / 2 - 0.004, 0, T / 2 + 0.002);
  // inside of the front: a bill pocket and an ID window (a glass pane)
  addMesh(fp, rbox(PW - 0.12, 0.34, 0.01, 0.015, 2), leather, 0, -0.17, -T / 2 - 0.012);
  addMesh(fp, rbox(0.5, 0.28, 0.008, 0.02, 2), mat.glass({ thickness: 0.3 }), -0.1, 0.17, -T / 2 - 0.012);
  inst(stitchGeo, stitchMat, Array.from({ length: 20 }, (_, k) => ({ p: [-PW / 2 + 0.1 + k * 0.04, -0.0, -T / 2 - 0.02] })), fp);

  const st = smoother(2.2);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { open: 0, cold: 0 }), o = sm(0, 0.55, s.open), cold = sm(0, 1, s.cold);
      front.rotation.y = -o * THREE.MathUtils.degToRad(176);
      root.position.x = lerp(-PW / 2, 0.0, o);
      root.rotation.x = lerp(-0.04, -0.32, o); root.rotation.y = lerp(0.18, 0.0, o) + Math.sin(time * 0.3) * 0.03;
      root.position.y = Math.sin(time * 0.5) * 0.01;
      cards.forEach(c => {
        const u = sm(0.5 + c.i * 0.1, 0.8 + c.i * 0.1, s.open);
        c.pivot.position.y = c.y0 + u * (0.16 + 0.03 * c.i);
        c.pivot.rotation.z = u * (c.i - 1.5) * -0.08;
        const m = c.m;
        m.roughness = lerp(0.05, frostRef.roughness, cold); m.iridescence = lerp(0.45, frostRef.iridescence, cold); m.thickness = lerp(0.35, 0.7, cold);
        m.emissiveIntensity = (1 - cold) * (0.25 + 0.1 * Math.sin(time * 1.2 + c.i));
        c.bar.material.opacity = 0.85 * (1 - cold);
      });
    },
    dispose() { frostRef.dispose(); disposeTree(object); }
  };
}
