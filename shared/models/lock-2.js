/* Padlock, second version: the body is built with real bores. Three glass layers: a front plate, a back plate and a
   middle layer with two vertical channels cut open at the top for the shackle legs. The legs are narrower than the
   channels, so the shackle never touches solid glass. locked 0..1: the shackle (lifted clear and swung open at 0)
   swings square first, and only then drops down its channels; the keyhole glows once it seats. */
import { THREE, mat, glow, deep, addMesh, inst, smoother, sm, lerp, disposeTree } from './_kit.js';
import { outlinePts } from './_shieldgeo.js';

export const meta = {
  name: 'lock-2', distance: 4.4, title: 'Lock 2',
  means: 'Locked by default: the shackle seats in the body, the keyhole lights, and nothing moves without approval',
  pages: ['Policies', 'Wallets', 'Qualified Custody'],
  states: { locked: 'the shackle swings square, drops into its bores and seats, 0..1' }
};

const MID = 0.3, PLATE = 0.07, DEPTH = MID + PLATE * 2;
const LEG = 0.36, LEG_R = 0.085, CH_HALF = 0.115;        // channel half-width > leg radius, depth MID/2 > leg radius

function keyholePts(cx, cy) {
  const pts = [], r = 0.13;
  for (let i = 0; i <= 24; i++) { const a = THREE.MathUtils.degToRad(-60 + (300 * i) / 24); pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
  pts.push(new THREE.Vector2(cx - 0.1, cy - 0.40), new THREE.Vector2(cx + 0.1, cy - 0.40));
  return pts;
}
const topY = (pts, x) => { let best = -9; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) { const y = a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x); if (y > best) best = y; } } return best; };

/* the outline with a channel notch (open at the top) cut at each leg */
function notched(out, yBottom) {
  let pts = out.map(p => p.clone());
  [LEG, -LEG].forEach(cx => {
    const xa = cx - CH_HALF, xb = cx + CH_HALF, yTopA = topY(pts, xa), yTopB = topY(pts, xb);
    const idx = []; pts.forEach((p, i) => { if (p.y > 0.4 && p.x > xa && p.x < xb) idx.push(i); });
    if (!idx.length) return;
    const first = idx[0], last = idx[idx.length - 1];
    const dir = pts[last].x < pts[first].x ? -1 : 1;                      // direction of travel along the top
    const ins = dir < 0 ? [new THREE.Vector2(xb, yTopB), new THREE.Vector2(xb, yBottom), new THREE.Vector2(xa, yBottom), new THREE.Vector2(xa, yTopA)]
      : [new THREE.Vector2(xa, yTopA), new THREE.Vector2(xa, yBottom), new THREE.Vector2(xb, yBottom), new THREE.Vector2(xb, yTopB)];
    pts = pts.slice(0, first).concat(ins, pts.slice(last + 1));
  });
  return pts;
}

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const S = 0.56, root = new THREE.Group(); root.scale.setScalar(S); object.add(root);
  const chrome = mat.chrome(), ink = deep.ink();
  const out = outlinePts();
  const yTop = topY(out, LEG);
  root.position.y = -0.3 * S;
  const KY = -0.06, BOTTOM = yTop - 0.7;                  // channel floor

  /* three glass layers */
  const glassMat = mat.glass({ thickness: 1.5 });
  const plateShape = () => { const s = new THREE.Shape(out.map(p => p.clone())); s.holes.push(new THREE.Path(keyholePts(0, KY))); return s; };
  const plateOpt = { depth: PLATE, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.035, bevelSegments: 4, curveSegments: 10 };
  const front = new THREE.ExtrudeGeometry(plateShape(), plateOpt); front.translate(0, 0, MID / 2);
  const back = new THREE.ExtrudeGeometry(plateShape(), plateOpt); back.rotateY(Math.PI); back.translate(0, 0, -MID / 2);
  const ms = new THREE.Shape(notched(out, BOTTOM)); ms.holes.push(new THREE.Path(keyholePts(0, KY)));
  const mid = new THREE.ExtrudeGeometry(ms, { depth: MID, bevelEnabled: false, curveSegments: 10 }); mid.translate(0, 0, -MID / 2);
  [front, back, mid].forEach(g => addMesh(root, g, glassMat));

  /* keyhole: dark plug in the middle layer behind a soft glow */
  const ks = new THREE.Shape(keyholePts(0, KY).map(p => p.clone()));
  const plug = new THREE.Mesh(new THREE.ExtrudeGeometry(ks, { depth: 0.04, bevelEnabled: false }), ink); plug.position.z = -MID / 2 + 0.0; root.add(plug);
  const keyGlow = addMesh(root, new THREE.ShapeGeometry(ks), glow(L, { opacity: 0 }), 0, 0, -MID / 2 + 0.045);
  const ring = new THREE.TorusGeometry(0.15, 0.014, 10, 40);
  addMesh(root, ring, chrome, 0, KY, DEPTH / 2 + 0.03); addMesh(root, ring, chrome, 0, KY, -DEPTH / 2 - 0.03);

  /* collars: hollow rings round each bore (inner radius clears the leg) */
  const collarProfile = [new THREE.Vector2(0.105, 0), new THREE.Vector2(0.17, 0), new THREE.Vector2(0.17, 0.09), new THREE.Vector2(0.15, 0.115), new THREE.Vector2(0.105, 0.115), new THREE.Vector2(0.105, 0)].reverse();
  const collarGeo = new THREE.LatheGeometry(collarProfile, 40); collarGeo.computeVertexNormals();
  [-LEG, LEG].forEach(x => addMesh(root, collarGeo, chrome, x, yTop - 0.01, 0));
  const rv = []; [[-0.66, 0.6], [0.66, 0.6], [-0.7, -0.15], [0.7, -0.15], [-0.38, -0.62], [0.38, -0.62]].forEach(([x, y]) => { rv.push({ p: [x, y, DEPTH / 2 + 0.03], s: [1, 1, 0.5] }, { p: [x, y, -DEPTH / 2 - 0.03], s: [1, 1, 0.5] }); });
  inst(new THREE.SphereGeometry(0.04, 14, 8), chrome, rv, root);

  /* shackle: two legs of different length, pivoting on the right one */
  const R = LEG, TOP = yTop + 0.38, BOT_R = yTop - 0.46, BOT_L = yTop - 0.6, pts = [];
  for (let i = 0; i <= 16; i++) pts.push(new THREE.Vector3(-R, lerp(BOT_L, TOP, i / 16), 0));
  for (let i = 1; i < 28; i++) { const a = Math.PI - (Math.PI * i) / 28; pts.push(new THREE.Vector3(Math.cos(a) * R, TOP + Math.sin(a) * R, 0)); }
  for (let i = 16; i >= 0; i--) pts.push(new THREE.Vector3(R, lerp(BOT_R, TOP, i / 16), 0));
  const shGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5), 160, LEG_R, 18, false);
  const pivot = new THREE.Group(); pivot.position.set(R, 0, 0); root.add(pivot);
  const shackle = addMesh(pivot, shGeo, chrome, -R, 0, 0);
  [new THREE.Vector3(-R, BOT_L, 0), new THREE.Vector3(R, BOT_R, 0)].forEach(p => addMesh(shackle, new THREE.SphereGeometry(LEG_R, 18, 12), chrome, p.x, p.y, p.z));
  // a groove ring on the long leg (rides inside its channel)
  addMesh(shackle, new THREE.TorusGeometry(LEG_R + 0.004, 0.012, 8, 24), chrome, -R, BOT_L + 0.14, 0).rotation.x = Math.PI / 2;

  /* lift needed so the long leg's tip clears the collar tops before any swing: tip at BOT_L + lift >= collar top */
  const CLEAR = (yTop + 0.115) - BOT_L + 0.06, SWING = 0.9;
  const st = smoother(2.4);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { locked: 0 }), k = s.locked;
      const turn = sm(0, 0.42, k), drop = sm(0.45, 0.92, k);
      pivot.position.y = CLEAR * (1 - drop);
      pivot.rotation.y = SWING * (1 - turn);
      const lit = sm(0.86, 1, k);
      keyGlow.material.opacity = lit * (0.7 + 0.2 * Math.sin(time * 1.2));
      glassMat.emissiveIntensity = lit * 0.2;
      root.rotation.y = Math.sin(time * 0.3) * 0.15;
    },
    dispose() { disposeTree(object); }
  };
}
