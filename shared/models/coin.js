/* A minted token: a thick blue-metal disc with a reeded edge, a beaded rim and the BitGo shield in glass relief.
   opts.count (default 3) makes a neat stack. mint 0..1 works a striking press: the die and collar come down,
   press (the shield rises out of the blank face with a flash), lift away, and the top coin lifts off the stack. */
import { THREE, mat, glow, lathe, addMesh, inst, creased, smoother, sm, lerp, disposeTree } from './_kit.js';
import { buildPiece } from './_shieldgeo.js';

export const meta = {
  name: 'coin', distance: 4.4, title: 'Coin',
  means: 'Tokens are minted, not drawn: struck from reserves, one at a time',
  pages: ['Stablecoins', 'Mint', 'Tokenization'],
  states: { mint: 'the press strikes the shield into the top coin, then it lifts, 0..1' },
  options: { count: 'coins in the stack, 1 to 8 (default 3)' }
};

const R = 0.8, T = 0.14, TEETH = 96;

function reededDisc() {
  const pts = [], n = TEETH * 3;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, c = 0.5 + 0.5 * Math.cos(a * TEETH); pts.push(new THREE.Vector2(Math.cos(a) * R * (1 - 0.012 * c), Math.sin(a) * R * (1 - 0.012 * c))); }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: T, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); g.translate(0, 0, 0); return creased(g, 0.5);
}

export function create(opts = {}) {
  const L = !!opts.light, count = Math.max(1, Math.min(8, opts.count | 0 || 3));
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.92); object.add(root);
  const body = mat.metal({ emissiveIntensity: 0.04, color: 0x2240b0, roughness: 0.33, envMapIntensity: 0.8 }), chrome = mat.chrome();
  const discGeo = reededDisc();
  const rimGeo = lathe([[R - 0.1, 0], [R - 0.1, 0.012, 0.006], [R - 0.02, 0.012, 0.008], [R - 0.02, 0]], 96, 2);
  const faceGeo = lathe([[0, 0], [R - 0.1, 0], [R - 0.1, -0.0]], 8, 1);
  const beadItems = []; for (let i = 0; i < 56; i++) { const a = i / 56 * Math.PI * 2; beadItems.push({ p: [Math.cos(a) * (R - 0.15), 0.012, Math.sin(a) * (R - 0.15)], s: [1, 0.6, 1] }); }
  const beadGeo = new THREE.SphereGeometry(0.018, 6, 4);
  const reliefGeo = buildPiece([], 0, 0, 0.1); reliefGeo.rotateX(-Math.PI / 2);   // lies flat, front facing up
  const ringGeo = lathe([[R - 0.2, 0], [R - 0.2, 0.004], [R - 0.19, 0.004], [R - 0.19, 0]], 96, 1);

  const stack = new THREE.Group(); root.add(stack);
  const coins = [];
  for (let i = 0; i < count; i++) {
    const g = new THREE.Group(); g.position.y = i * (T + 0.004); g.rotation.y = i * 0.11; stack.add(g);
    addMesh(g, discGeo, body);
    const top = new THREE.Group(); top.position.y = T; g.add(top);
    addMesh(top, rimGeo, chrome);
    addMesh(top, ringGeo, chrome);
    inst(beadGeo, chrome, beadItems, top);
    const gm = mat.glass({ thickness: 0.5 });
    const rel = addMesh(top, reliefGeo, gm, 0, 0.0, 0); rel.scale.setScalar(0.36); rel.position.y = 0.002;
    coins.push({ g, rel, gm, isTop: i === count - 1 });
  }
  const H = count * (T + 0.004);
  root.position.y = -(H + 0.45) / 2 + 0.02;

  /* the press: a die head, a collar ring and guide rods, over the top coin */
  const press = new THREE.Group(); root.add(press);
  addMesh(press, lathe([[0, 0], [R * 0.94, 0, 0.012], [R * 0.94, 0.1, 0.02], [R * 0.84, 0.13, 0.02], [0, 0.13]], 96, 2), chrome);
  const collar = addMesh(press, lathe([[R + 0.012, -0.13], [R + 0.07, -0.13, 0.012], [R + 0.07, 0.0, 0.012], [R + 0.012, 0.0, 0.01], [R + 0.012, -0.13]], 96, 2), mat.metal({ emissiveIntensity: 0.04, color: 0x1b2f8a, roughness: 0.3 }));
  [0, 1, 2].forEach(i => { const a = i / 3 * Math.PI * 2 + 0.5; addMesh(press, new THREE.CylinderGeometry(0.02, 0.02, 0.3, 12), chrome, Math.cos(a) * R * 0.55, 0.27, Math.sin(a) * R * 0.55); });
  addMesh(press, new THREE.CylinderGeometry(0.11, 0.14, 0.06, 20), body, 0, 0.16, 0);
  const flash = addMesh(root, new THREE.RingGeometry(R - 0.24, R - 0.18, 96), glow(L, { opacity: 0 }), 0, 0, 0); flash.rotation.x = -Math.PI / 2;
  const topY = (count - 1) * (T + 0.004) + T;

  const st = smoother(2.2);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { mint: 0 }), m = s.mint;
      const down = sm(0, 0.4, m), press1 = sm(0.38, 0.5, m), up = sm(0.52, 0.88, m), lift = sm(0.68, 1, m);
      press.position.y = topY + (1 - down) * 0.5 + up * 0.5 - press1 * 0.012 + 0.014;
      press.rotation.y = 0;
      coins.forEach((c, i) => {
        if (!c.isTop) { c.rel.scale.set(0.36, 0.36, 0.36); return; }
        c.rel.scale.set(0.36, 0.36 * lerp(0.02, 1, press1), 0.36);
        c.gm.emissiveIntensity = Math.sin(Math.PI * clampf(press1 * (1 - up) * 1.4)) * 1.2;
        c.g.position.y = i * (T + 0.004) + lift * 0.3 + Math.sin(time * 0.9) * 0.01 * lift;
        c.g.rotation.x = lift * 0.55; c.g.rotation.y = i * 0.11 + lift * 0.5 + Math.sin(time * 0.3) * 0.03;
        c.g.position.z = lift * 0.0;
      });
      flash.position.y = topY + 0.02; flash.material.opacity = Math.sin(Math.PI * clampf((m - 0.38) / 0.3)) * 0.9;
      press.visible = m < 0.99 || true;
      stack.rotation.y = Math.sin(time * 0.25) * 0.05;
    },
    dispose() { disposeTree(object); }
  };
}
const clampf = v => Math.min(1, Math.max(0, v));
