/* A padlock that is BitGo's own: the body is the shield outline extruded thick in glass, with a keyhole cut
   into it, a chrome shackle and small chrome hardware. locked 0..1: the shackle drops, swings square and seats
   in the collars, then the keyhole glows blue. Calm and damped, no spinning. */
import { THREE, mat, glow, rbox, addMesh, inst, smoother, sm, lerp, disposeTree } from './_kit.js';
import { outlinePts } from './_shieldgeo.js';

export const meta = {
  name: 'lock', title: 'Lock',
  means: 'Locked by default: the shackle seats, the keyhole lights, and nothing moves without approval',
  pages: ['Policies', 'Wallets', 'Qualified Custody'],
  states: { locked: 'the shackle drops into the body and seats, the keyhole glows, 0..1' }
};

const DEPTH = 0.42;

function keyholePts(cx, cy) {
  const pts = [], r = 0.13;
  for (let i = 0; i <= 24; i++) { const a = THREE.MathUtils.degToRad(-60 + (300 * i) / 24); pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
  pts.push(new THREE.Vector2(cx - 0.1, cy - 0.40), new THREE.Vector2(cx + 0.1, cy - 0.40));
  return pts;
}

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const S = 0.544, root = new THREE.Group(); root.scale.setScalar(S); object.add(root);
  const chrome = mat.chrome(), ink = mat.ink({ clearcoat: 0.15, color: 0x040a28 });
  const out = outlinePts();
  let yTop = -9; out.forEach(p => { if (Math.abs(Math.abs(p.x) - 0.36) < 0.05 && p.y > yTop) yTop = p.y; });
  root.position.y = -0.3 * S;

  /* body: shield outline, thick bevelled glass, keyhole through it */
  const KY = -0.06;
  const shape = new THREE.Shape(out.map(p => p.clone()));
  shape.holes.push(new THREE.Path(keyholePts(0, KY)));
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 5, curveSegments: 10 });
  bodyGeo.translate(0, 0, -DEPTH / 2);
  const bodyMat = mat.glass({ thickness: 1.5 });
  addMesh(root, bodyGeo, bodyMat);
  // the keyhole recess: a dark plug behind a soft glow
  const kShape = new THREE.Shape(keyholePts(0, KY).map(p => p.clone()));
  const plug = new THREE.Mesh(new THREE.ExtrudeGeometry(kShape, { depth: 0.04, bevelEnabled: false }), ink);
  plug.position.z = -0.1; root.add(plug);
  const keyGlow = addMesh(root, new THREE.ShapeGeometry(kShape), glow(L, { opacity: 0 }), 0, 0, -0.055);
  // keyhole escutcheon: chrome ring round the hole on both faces
  const ring = new THREE.TorusGeometry(0.15, 0.014, 10, 40);
  addMesh(root, ring, chrome, 0, KY, DEPTH / 2 + 0.05);
  addMesh(root, ring, chrome, 0, KY, -DEPTH / 2 - 0.05);

  /* collars where the shackle enters the top of the body */
  const LEG = 0.36;
  [-LEG, LEG].forEach(x => {
    const c = addMesh(root, new THREE.CylinderGeometry(0.15, 0.17, 0.1, 32), chrome, x, yTop + 0.02, 0);
    addMesh(root, new THREE.TorusGeometry(0.15, 0.014, 8, 32), chrome, x, yTop + 0.075, 0).rotation.x = Math.PI / 2;
    addMesh(root, new THREE.CylinderGeometry(0.11, 0.11, 0.012, 24), ink, x, yTop + 0.072, 0);
  });
  // rivets round the face
  const rv = []; [[-0.66, 0.6], [0.66, 0.6], [-0.7, -0.15], [0.7, -0.15], [-0.38, -0.62], [0.38, -0.62]].forEach(([x, y]) => {
    rv.push({ p: [x, y, DEPTH / 2 + 0.05], s: [1, 1, 0.5] }, { p: [x, y, -DEPTH / 2 - 0.05], s: [1, 1, 0.5] });
  });
  inst(new THREE.SphereGeometry(0.04, 14, 8), chrome, rv, root);

  /* shackle: a thick chrome U, pivoting on its right leg */
  const R = 0.36, TOP = yTop + 0.34, BOT = yTop - 0.42, pts = [];
  for (let i = 0; i <= 16; i++) pts.push(new THREE.Vector3(-R, lerp(BOT - 0.14, TOP, i / 16), 0));   // left leg is longer
  for (let i = 1; i < 28; i++) { const a = Math.PI - (Math.PI * i) / 28; pts.push(new THREE.Vector3(Math.cos(a) * R, TOP + Math.sin(a) * R, 0)); }
  for (let i = 16; i >= 0; i--) pts.push(new THREE.Vector3(R, lerp(BOT, TOP, i / 16), 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const shGeo = new THREE.TubeGeometry(curve, 160, 0.085, 18, false);
  const pivot = new THREE.Group(); pivot.position.set(R, 0, 0); root.add(pivot);
  const shackle = addMesh(pivot, shGeo, chrome, -R, 0, 0);
  [new THREE.Vector3(-R, BOT - 0.14, 0), new THREE.Vector3(R, BOT, 0)].forEach(p => addMesh(shackle, new THREE.SphereGeometry(0.085, 18, 12), chrome, p.x, p.y, p.z));
  // a notch ring on the long leg
  addMesh(shackle, new THREE.TorusGeometry(0.088, 0.016, 8, 24), chrome, -R, yTop - 0.2, 0).rotation.x = Math.PI / 2;

  const st = smoother(2.4);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { locked: 0 }), k = s.locked;
      const drop = sm(0.25, 0.85, k), turn = sm(0, 0.4, k);
      pivot.position.y = lerp(0.36, 0, drop) + Math.sin(time * 0.9) * 0.008 * (1 - drop);
      pivot.rotation.y = lerp(0.7, 0, turn);
      const lit = sm(0.8, 1, k);
      keyGlow.material.opacity = lit * (0.7 + 0.2 * Math.sin(time * 1.4));
      bodyMat.emissiveIntensity = lit * 0.22;
      root.rotation.y = Math.sin(time * 0.35) * 0.18;
    },
    dispose() { disposeTree(object); }
  };
}
