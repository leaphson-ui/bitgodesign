/* Partner logo in glass: any single-colour SVG mark (data/partners.js) extruded as thick bevelled glass, in the same
   glass as the homepage shield. State `in` (0..1): the mark rises and turns into place once. */
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { mat } from './materials.js';
import { PARTNERS } from './data/partners.js';

export const meta = {
  name: 'logo3d', title: 'Partner logo in glass',
  means: 'A partner or integration, shown as its own mark in BitGo glass',
  pages: ['Self-Custody: WalletConnect', 'any partnership announcement'],
  states: { in: 'the mark rises and turns into place, 0..1' }
};

export function create(opts = {}) {
  const P = PARTNERS[opts.partner || 'walletconnect'];
  const [, , vw, vh] = P.viewBox.split(/\s+/).map(Number);
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${P.viewBox}"><path d="${P.d}" fill-rule="${P.rule || 'nonzero'}"/></svg>`);
  const shapes = data.paths.flatMap(p => SVGLoader.createShapes(p));
  const depth = Math.max(vw, vh) * (P.depth || 0.16);   // a mark made of many small shapes reads better thinner (P.depth)
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: depth * 0.18, bevelSize: Math.max(vw, vh) * 0.012, bevelSegments: 5, curveSegments: 24 });
  geo.computeBoundingBox(); const bb = geo.boundingBox, c = new THREE.Vector3(); bb.getCenter(c);
  geo.translate(-c.x, -c.y, -c.z); geo.scale(1, -1, 1);                       // SVG y points down
  geo.computeVertexNormals();
  const size = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y);
  const glass = mat.glass({ color: new THREE.Color(0xc4d4ff), roughness: 0.09, clearcoatRoughness: 0.1, thickness: 1.6, attenuationDistance: 1.1, envMapIntensity: 2.6, iridescence: 0.55 });   // gloss slightly soft: razor-sharp highlights on the thin bevels alias into grain
  const mesh = new THREE.Mesh(geo, glass);
  mesh.scale.setScalar(1.9 / size);
  const object = new THREE.Group(); object.add(mesh);
  return {
    object,
    update(time, state = {}) {
      const p = state.in ?? 1, e = 1 - Math.pow(1 - p, 3);
      mesh.position.y = (1 - e) * -0.35;
      mesh.rotation.set((1 - e) * 0.5, (1 - e) * -0.9 + Math.sin(time * 0.3) * 0.05, 0);
      glass.emissiveIntensity = 0.12 * e;
    },
    dispose() { geo.dispose(); glass.dispose(); }
  };
}
