/* A glass key whose bow is the BitGo shield outline (with a shield-shaped opening).
   split 0..1 breaks it into three shares (bow, shaft, bit) that drift apart: multi-signature. */
import { THREE, mat, smoother, sm, lerp, disposeTree, creased } from './_kit.js';
import { outlinePts } from './_shieldgeo.js';

export const meta = {
  name: 'key', distance: 5.0, title: 'Key',
  means: 'No single key opens it: three shares, three holders',
  pages: ['Multi-Sig', 'Cold Storage', 'Wallets'],
  states: { split: 'the key divides into three shares, 0..1' }
};

const DEPTH = 0.26;
const EXT = { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 4, curveSegments: 10 };
const centred = g => { g.translate(0, 0, -DEPTH / 2); g.computeVertexNormals(); return g; };

function buildKey() {
  const out = outlinePts();
  const BOW_S = 0.62, HOLE_S = 0.34, BOW_Y = 0.7;
  const bow = new THREE.Shape(out.map(p => new THREE.Vector2(p.x * BOW_S, p.y * BOW_S + BOW_Y)));
  bow.holes.push(new THREE.Path(out.slice().reverse().map(p => new THREE.Vector2(p.x * HOLE_S, p.y * HOLE_S + BOW_Y + 0.06))));
  const shaft = new THREE.Shape(); const sw = 0.095, top = 0.32, bot = -1.32;
  shaft.moveTo(-sw, top); shaft.lineTo(sw, top); shaft.lineTo(sw, bot + 0.05);
  shaft.quadraticCurveTo(sw, bot, sw - 0.05, bot); shaft.lineTo(-sw + 0.05, bot);
  shaft.quadraticCurveTo(-sw, bot, -sw, bot + 0.05); shaft.lineTo(-sw, top);
  const bit = new THREE.Shape();
  const pts = [[0.07, -0.7], [0.46, -0.7], [0.46, -0.85], [0.33, -0.85], [0.33, -0.95], [0.46, -0.95], [0.46, -1.12], [0.27, -1.12], [0.27, -1.22], [0.07, -1.22]];
  bit.moveTo(...pts[0]); pts.slice(1).forEach(p => bit.lineTo(...p)); bit.closePath();
  const parts = [
    { geo: new THREE.ExtrudeGeometry(bow, EXT), dir: { x: 0, y: 1 }, spin: 0.28 },
    { geo: new THREE.ExtrudeGeometry(shaft, EXT), dir: { x: -1, y: -0.15 }, spin: -0.35 },
    { geo: new THREE.ExtrudeGeometry(bit, EXT), dir: { x: 1, y: -0.55 }, spin: 0.42 }
  ];
  parts.forEach(p => { centred(p.geo); p.geo.translate(0, 0.03, 0); });
  return parts;
}

export function create(opts = {}) {
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.644); root.rotation.z = 0.5; object.add(root);
  const parts = buildKey().map((g, i) => {
    const m = mat.glass();
    const mesh = new THREE.Mesh(g.geo, m);
    const pivot = new THREE.Group(); pivot.add(mesh); root.add(pivot);
    return { pivot, m, dir: new THREE.Vector3(g.dir.x, g.dir.y, 0), spin: g.spin };
  });
  const st = smoother(3.5);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { split: 0 }), x = sm(0, 1, s.split);
      root.rotation.y = Math.sin(time * 0.45) * 0.38; root.rotation.x = Math.sin(time * 0.3) * 0.06;
      parts.forEach((p, i) => {
        p.pivot.position.copy(p.dir).multiplyScalar(x * 0.62);
        p.pivot.position.z = x * 0.25 * (i - 1);
        p.pivot.rotation.set(p.spin * 0.5 * x, p.spin * 0.7 * x, p.spin * x);
        const g = x * (0.5 + 0.5 * Math.max(0, Math.sin(time * 1.3 - i * 2.09)));
        p.m.emissiveIntensity = g * 0.55; p.m.attenuationDistance = lerp(0.55, 0.3, g);
      });
    },
    dispose() { disposeTree(object); }
  };
}
