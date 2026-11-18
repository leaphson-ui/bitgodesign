/* Coin, second version: one slow, believable strike. A blank disc rests on a dark minting tray. mint 0..1:
   the blank slides under the die (0 to .3), the die descends slowly and strikes once (.3 to .58) as the shield
   rises out of the face with a soft flash and a ring of light across the tray, the die rises away (.58 to .8),
   and the finished coin lifts and turns to show its face (.8 to 1). No pins, no loose parts. */
import { THREE, mat, glow, deep, lathe, addMesh, inst, creased, smoother, sm, lerp, clamp, disposeTree } from './_kit.js';
import { buildPiece } from './_shieldgeo.js';

export const meta = {
  name: 'coin-2', distance: 4.3, title: 'Coin 2',
  means: 'Tokens are minted, not drawn: struck from reserves, one at a time',
  pages: ['Stablecoins', 'Mint', 'Tokenization'],
  states: { mint: 'the blank slides under the die, one strike, the shield appears and the coin lifts, 0..1' }
};

const R = 0.5, T = 0.1, TEETH = 80;

function reededDisc() {
  const pts = [], n = TEETH * 3;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, c = 0.5 + 0.5 * Math.cos(a * TEETH), r = R * (1 - 0.014 * c); pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: T, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); return creased(g, 0.5);
}

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.720); root.position.y = -0.22; object.add(root);
  const body = deep.metal({ color: 0x1a35a8 }), chrome = mat.chrome(), ink = deep.ink();

  /* tray: a dark slab with a groove the blank rides in */
  addMesh(root, new THREE.BoxGeometry(2.0, 0.07, 0.9), ink, 0, -0.035, 0).geometry.translate(0, 0, 0);
  addMesh(root, new THREE.BoxGeometry(1.9, 0.01, 0.62), deep.metal({ color: 0x0b1550 }), 0, 0.002, 0);
  [-1, 1].forEach(s => addMesh(root, new THREE.BoxGeometry(1.9, 0.03, 0.025), chrome, 0, 0.012, s * 0.33));
  const dots = []; for (let i = 0; i < 10; i++) dots.push({ p: [-0.86 + i * 0.19, 0.008, 0] });
  inst(new THREE.BoxGeometry(0.07, 0.003, 0.012), glow(L, { opacity: 0.35 }), dots, root);

  /* the coin */
  const coin = new THREE.Group(); root.add(coin);
  const discGeo = reededDisc();
  addMesh(coin, discGeo, body);
  const top = new THREE.Group(); top.position.y = T; coin.add(top);
  addMesh(top, lathe([[R - 0.07, 0], [R - 0.07, 0.01, 0.005], [R - 0.015, 0.01, 0.006], [R - 0.015, 0]], 80, 2), chrome);
  const beads = []; for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2; beads.push({ p: [Math.cos(a) * (R - 0.1), 0.01, Math.sin(a) * (R - 0.1)], s: [1, 0.6, 1] }); }
  inst(new THREE.SphereGeometry(0.014, 6, 4), chrome, beads, top);
  const relGeo = buildPiece([], 0, 0, 0.1); relGeo.rotateX(-Math.PI / 2);
  const gm = mat.glass({ thickness: 0.5 });
  const rel = addMesh(top, relGeo, gm); rel.position.y = 0.002;

  /* the die: a heavy chrome head under a dark housing, bolted, no pins */
  const die = new THREE.Group(); root.add(die);
  addMesh(die, lathe([[0, 0], [R * 0.98, 0, 0.012], [R * 0.98, 0.1, 0.02], [R * 0.78, 0.15, 0.04], [0, 0.15]], 80, 2), chrome);
  addMesh(die, lathe([[0, 0.14], [R * 0.78, 0.14, 0.02], [R * 0.78, 0.46, 0.03], [R * 0.5, 0.52, 0.04], [0, 0.52]], 80, 2), deep.metal({ color: 0x142a8a }), 0, 0, 0);
  const bolts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; bolts.push({ p: [Math.cos(a) * R * 0.88, 0.1, Math.sin(a) * R * 0.88] }); }
  inst(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10), chrome, bolts, die);
  addMesh(die, new THREE.TorusGeometry(R * 0.78, 0.012, 8, 64), chrome, 0, 0.3, 0).rotation.x = Math.PI / 2;
  /* strike light: a flash disc under the die and a ring that spreads on the tray */
  const flash = addMesh(root, new THREE.CircleGeometry(R * 0.9, 64), glow(L, { opacity: 0 }), 0, T + 0.014, 0); flash.rotation.x = -Math.PI / 2;
  const wave = addMesh(root, new THREE.RingGeometry(0.97, 1.0, 96), glow(L, { opacity: 0 }), 0, 0.012, 0); wave.rotation.x = -Math.PI / 2;

  const ease = t => t * t * (3 - 2 * t);
  const st = smoother(2.0);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { mint: 0 }), m = s.mint;
      const slide = ease(clamp(m / 0.3)), strike = ease(clamp((m - 0.3) / 0.28)), rise = ease(clamp((m - 0.58) / 0.22)), present = ease(clamp((m - 0.8) / 0.2));
      const clear = 0.48;
      die.position.y = (T + 0.002) + clear * (1 - Math.pow(strike, 2.2)) + clear * rise;
      coin.position.set(lerp(-0.56, 0, slide), 0, 0);
      rel.scale.set(0.3, 0.3 * Math.max(0.001, sm(0.56, 0.66, m)), 0.3);   // the shield rises out of the blank at the strike
      const f = Math.sin(Math.PI * clamp((m - 0.55) / 0.2));
      gm.emissiveIntensity = f * 1.0; flash.material.opacity = f * 0.55;
      wave.material.opacity = f * 0.7; wave.scale.setScalar(0.3 + clamp((m - 0.56) / 0.3) * 1.5);
      coin.position.y = present * 0.15 + Math.sin(time * 0.8) * 0.008 * present;
      coin.rotation.x = present * 0.85; coin.rotation.y = Math.sin(time * 0.3) * 0.04 * present;
      coin.position.z = present * 0.62;
      root.rotation.y = Math.sin(time * 0.25) * 0.06;
    },
    dispose() { disposeTree(object); }
  };
}
