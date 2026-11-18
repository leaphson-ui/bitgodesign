/* A premium bifold wallet: two deep-blue brushed-metal covers, a chrome hinge spine, an embossed BitGo shield on
   the front. Inside, thin glass cards sit in a slot: the keys and assets it holds.
   open 0..1: the covers unfold to about 140 degrees, then the cards fan up out of the slot one after another.
   cold 0..1: the cards frost over and their glow fades (hot wallet to cold wallet). */
import { THREE, mat, glow, rbox, addMesh, inst, smoother, sm, lerp, disposeTree } from './_kit.js';
import { buildPiece } from './_shieldgeo.js';

export const meta = {
  name: 'wallet', distance: 3.7, title: 'Wallet',
  means: 'Your keys and assets in one case: warm and ready, or frosted and cold',
  pages: ['Wallets', 'Hot and Cold', 'Self-Custody'],
  states: { open: 'covers unfold, then the cards fan out, 0..1', cold: 'cards frost over and the glow fades, 0..1' }
};

const CW = 0.78, CH = 1.1, CT = 0.05;       // cover width, height, thickness
const AX = 0.075;                           // the spine axis sits this far in front of the back cover

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(1.281); object.add(root);
  const metal = mat.metal({ emissiveIntensity: 0.04, color: 0x1f3aa6, roughness: 0.4, envMapIntensity: 0.75 }), chrome = mat.chrome(), ink = mat.ink({ clearcoat: 0.15, color: 0x050b2c });
  const lining = mat.ink({ clearcoat: 0.15, color: 0x0b1850, roughness: 0.55, metalness: 0.2 });

  const stitchGeo = new THREE.BoxGeometry(0.03, 0.007, 0.007);
  const stitches = (z, inset = 0.045) => {
    const it = [], w = CW / 2 - inset, h = CH / 2 - inset;
    const edge = (x0, y0, x1, y1) => { const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.05); for (let i = 0; i <= n; i++) { const t = i / n; it.push({ p: [CW / 2 + lerp(x0, x1, t), lerp(y0, y1, t), z], r: [0, 0, Math.atan2(y1 - y0, x1 - x0)] }); } };
    edge(-w, -h, w, -h); edge(w, -h, w, h); edge(w, h, -w, h); edge(-w + 0.0, h, -w, -h);
    return it;
  };

  /* back cover (fixed): holds the card slot */
  const back = new THREE.Group(); root.add(back);
  addMesh(back, rbox(CW, CH, CT, 0.016, 3), metal, CW / 2, 0, 0);
  addMesh(back, rbox(CW - 0.07, CH - 0.07, 0.01, 0.01), lining, CW / 2, 0, CT / 2 + 0.003);
  inst(stitchGeo, chrome, stitches(CT / 2 + 0.01), back);
  // card slot: a pocket flap in front of the cards, with side walls
  const PY0 = -0.5, CARD_H = 0.4, CARD_W = 0.56;
  addMesh(back, rbox(CARD_W + 0.1, 0.34, 0.012, 0.006), ink, CW / 2, PY0 + 0.17, 0.104);
  [-1, 1].forEach(s => addMesh(back, rbox(0.03, 0.34, 0.09, 0.006), ink, CW / 2 + s * (CARD_W / 2 + 0.035), PY0 + 0.17, 0.06));
  addMesh(back, rbox(CARD_W + 0.1, 0.02, 0.09, 0.006), ink, CW / 2, PY0 + 0.005, 0.06);
  // cards
  const frostRef = mat.frost();
  const cards = [0, 1, 2, 3].map(i => {
    const m = mat.glass({ thickness: 0.35 });
    const pivot = new THREE.Group(); pivot.position.set(CW / 2, PY0 + 0.03, 0.045 + i * 0.016); back.add(pivot);
    addMesh(pivot, rbox(CARD_W, CARD_H, 0.008, 0.003, 2), m, 0, CARD_H / 2, 0);
    const bar = addMesh(pivot, new THREE.BoxGeometry(CARD_W - 0.12, 0.012, 0.012), glow(L, { opacity: 0.8 }), 0, CARD_H - 0.045, 0.006);
    addMesh(pivot, rbox(0.07, 0.05, 0.004, 0.004), chrome, -CARD_W / 2 + 0.09, CARD_H * 0.55, 0.006);
    return { pivot, m, bar, i };
  });

  /* hinge spine along the left edge, on its own axis */
  const spine = new THREE.Group(); spine.position.set(0, 0, AX); root.add(spine);
  addMesh(spine, new THREE.CylinderGeometry(0.034, 0.034, CH - 0.04, 24), chrome);
  [0.36, 0, -0.36].forEach(y => { addMesh(spine, new THREE.CylinderGeometry(0.048, 0.048, 0.17, 28), chrome, 0, y, 0); addMesh(spine, new THREE.CylinderGeometry(0.02, 0.02, 0.18, 12), ink, 0, y, 0); });
  // the leaf plates that tie each cover to the spine
  [0.36, 0, -0.36].forEach(y => addMesh(back, rbox(0.13, 0.13, 0.012, 0.006), chrome, 0.065, y, CT / 2 + 0.002));

  /* front cover swings about the spine */
  const front = new THREE.Group(); front.position.set(0, 0, AX); root.add(front);
  addMesh(front, rbox(CW, CH, CT, 0.016, 3), metal, CW / 2, 0, AX);
  addMesh(front, rbox(CW - 0.07, CH - 0.07, 0.01, 0.01), lining, CW / 2, 0, AX - CT / 2 - 0.003);
  inst(stitchGeo, chrome, stitches(AX + CT / 2 + 0.01), front);
  [0.36, 0, -0.36].forEach(y => addMesh(front, rbox(0.13, 0.13, 0.012, 0.006), chrome, 0.065, y, AX + CT / 2 + 0.002));
  // embossed shield on the outer face: a bevelled chrome relief with a pressed ring around it
  const crest = addMesh(front, buildPiece([], 0, 0, 0.14), mat.chrome({ roughness: 0.22 }), CW / 2 + 0.03, 0.03, AX + CT / 2 + 0.012); crest.scale.setScalar(0.17);
  addMesh(front, new THREE.TorusGeometry(0.235, 0.008, 8, 64), chrome, CW / 2 + 0.03, 0.03, AX + CT / 2 + 0.004);
  // a clasp tab on the free edge
  addMesh(front, rbox(0.05, 0.16, 0.016, 0.008), chrome, CW - 0.02, 0, AX + CT / 2 + 0.006);

  const st = smoother(2.2);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { open: 0, cold: 0 }), e = sm(0, 0.6, s.open), cold = sm(0, 1, s.cold);
      front.rotation.y = -e * THREE.MathUtils.degToRad(140);
      root.position.x = lerp(-0.34, 0.0, e);
      root.rotation.y = lerp(-0.1, 0.12, e) + Math.sin(time * 0.35) * 0.04;
      cards.forEach(c => {
        const u = sm(0.5 + c.i * 0.09, 0.78 + c.i * 0.09, s.open);
        c.pivot.position.y = PY0 + 0.03 + u * (0.3 + c.i * 0.04);
        c.pivot.rotation.z = u * (c.i - 1.5) * -0.2;
        c.pivot.position.z = 0.045 + c.i * 0.016 + u * c.i * 0.012;
        const bob = Math.sin(time * 0.8 + c.i) * 0.004 * u; c.pivot.position.y += bob;
        const m = c.m;
        m.roughness = lerp(0.05, frostRef.roughness, cold); m.iridescence = lerp(0.45, frostRef.iridescence, cold); m.thickness = lerp(0.35, 0.7, cold);
        m.emissiveIntensity = (1 - cold) * (0.25 + 0.1 * Math.sin(time * 1.2 + c.i));
        c.bar.material.opacity = 0.8 * (1 - cold);
      });
    },
    dispose() { frostRef.dispose(); disposeTree(object); }
  };
}
