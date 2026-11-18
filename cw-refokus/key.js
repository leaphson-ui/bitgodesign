/* A glass key in three fragments for the Multi-Sig / Cold Storage / Insurance steps.
   The bow is the BitGo shield outline (with a shield-shaped opening), so the key reads as BitGo's own.
   Fragments: bow, shaft, bit. Each has a direction it drifts apart along when the key splits into shares. */
import * as THREE from 'three';
import { outlinePts } from './shield.js';

const DEPTH = 0.26;
const EXT = { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 4, curveSegments: 10 };

function centred(geo) { geo.translate(0, 0, -DEPTH / 2); geo.computeVertexNormals(); return geo; }

export function buildKey() {
  const out = outlinePts();
  const BOW_S = 0.62, HOLE_S = 0.34, BOW_Y = 0.7;
  const bow = new THREE.Shape(out.map(p => new THREE.Vector2(p.x * BOW_S, p.y * BOW_S + BOW_Y)));
  const hole = new THREE.Path(out.slice().reverse().map(p => new THREE.Vector2(p.x * HOLE_S, p.y * HOLE_S + BOW_Y + 0.06)));
  bow.holes.push(hole);

  const shaft = new THREE.Shape();
  const sw = 0.095, top = 0.32, bot = -1.32;
  shaft.moveTo(-sw, top); shaft.lineTo(sw, top); shaft.lineTo(sw, bot + 0.05);
  shaft.quadraticCurveTo(sw, bot, sw - 0.05, bot); shaft.lineTo(-sw + 0.05, bot);
  shaft.quadraticCurveTo(-sw, bot, -sw, bot + 0.05); shaft.lineTo(-sw, top);

  const bit = new THREE.Shape();
  const pts = [[0.07, -0.7], [0.46, -0.7], [0.46, -0.85], [0.33, -0.85], [0.33, -0.95], [0.46, -0.95], [0.46, -1.12], [0.27, -1.12], [0.27, -1.22], [0.07, -1.22]];
  bit.moveTo(...pts[0]); pts.slice(1).forEach(p => bit.lineTo(...p)); bit.closePath();

  const shift = 0.03;   // centre the whole key vertically
  const parts = [
    { geo: new THREE.ExtrudeGeometry(bow, EXT), dir: { x: 0, y: 1 }, spin: 0.28 },
    { geo: new THREE.ExtrudeGeometry(shaft, EXT), dir: { x: -1, y: -0.15 }, spin: -0.35 },
    { geo: new THREE.ExtrudeGeometry(bit, EXT), dir: { x: 1, y: -0.55 }, spin: 0.42 }
  ];
  parts.forEach(p => { centred(p.geo); p.geo.translate(0, shift, 0); });
  return parts;
}
