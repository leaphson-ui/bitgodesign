/* Custody safe: BitGo holds all three keys (client, backup, platform) offline, in cold storage.
   A glass safe in a dark blue-metal frame with chrome hardware; inside, three glass keys hang on a chrome rack.
   States (each 0..1):
     open : the bolts draw back and the wheel turns, then the glass door swings open
     cold : the glass frosts over and the inner light cools (cold storage)
     lift : the three keys rise off the rack (funds put to work) */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mat } from './materials.js';
import { create as createKey } from './key.js';

export const meta = {
  name: 'custody-safe',
  title: 'Custody safe',
  means: 'All three keys held offline in cold storage, behind bank-grade hardware',
  pages: ['Custody Wallets', 'Qualified Custody', 'Cold Storage'],
  states: { open: 'bolts draw back, wheel turns, door swings open', cold: 'glass frosts over', lift: 'the three keys rise off the rack' },
  distance: 4.2
};

const W = 1.08, H = 1.22, D = 0.92, T = 0.075;            // body width, height, depth, frame bar thickness
const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

export function create(opts = {}) {
  const light = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.92); object.add(root);
  const geos = [], mats = [];
  const G = g => (geos.push(g), g), M = m => (mats.push(m), m);

  const frame = M(mat.metal({ color: light ? 0x1b2f8f : 0x16246a, roughness: 0.34, envMapIntensity: 1.1, emissiveIntensity: 0.05, clearcoat: 0.7 }));
  const chrome = M(mat.chrome({ envMapIntensity: 1.6 }));
  const ink = M(mat.ink({ color: 0x060c2c, roughness: 0.4 }));
  const glass = M(new THREE.MeshPhysicalMaterial({
    color: 0xc9d7ff, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.14, clearcoat: 1, clearcoatRoughness: 0.03,
    envMapIntensity: 1.7, depthWrite: false, side: THREE.DoubleSide, iridescence: 0.25, iridescenceIOR: 1.3
  }));
  const add = (geo, m, x, y, z, parent = root) => { const mesh = new THREE.Mesh(G(geo), m); mesh.position.set(x, y, z); parent.add(mesh); return mesh; };

  /* frame: twelve bevelled bars along the edges, chrome caps on the corners */
  const bar = (w, h, d) => new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.3);
  const hx = W / 2, hy = H / 2, hz = D / 2;
  for (const y of [-hy, hy]) for (const z of [-hz, hz]) add(bar(W + T, T, T), frame, 0, y, z);
  for (const x of [-hx, hx]) for (const z of [-hz, hz]) add(bar(T, H, T), frame, x, 0, z);
  for (const x of [-hx, hx]) for (const y of [-hy, hy]) add(bar(T, T, D), frame, x, y, 0);
  const cap = G(new RoundedBoxGeometry(T * 1.5, T * 1.5, T * 1.5, 3, T * 0.4));
  for (const x of [-hx, hx]) for (const y of [-hy, hy]) for (const z of [-hz, hz]) { const c = new THREE.Mesh(cap, chrome); c.position.set(x, y, z); root.add(c); }
  /* feet and a solid floor plate the rack stands on */
  for (const x of [-hx + 0.08, hx - 0.08]) for (const z of [-hz + 0.08, hz - 0.08]) add(new THREE.CylinderGeometry(0.045, 0.055, 0.07, 24), chrome, x, -hy - 0.07, z);
  add(new RoundedBoxGeometry(W - 0.02, 0.05, D - 0.02, 2, 0.015), ink, 0, -hy + 0.04, 0);

  /* glass walls: back, sides, top (the door is its own glass) */
  const pane = (w, h) => new THREE.PlaneGeometry(w, h);
  add(pane(W, H), glass, 0, 0, -hz);
  const sideL = add(pane(D, H), glass, -hx, 0, 0); sideL.rotation.y = Math.PI / 2;
  const sideR = add(pane(D, H), glass, hx, 0, 0); sideR.rotation.y = -Math.PI / 2;
  const top = add(pane(W, D), glass, 0, hy, 0); top.rotation.x = Math.PI / 2;

  /* the inner light: a soft backlight that silhouettes the keys; cools when cold */
  const back = M(mat.light({ color: 0x4d78ff, opacity: 0.0 }));
  const glowPlane = add(new THREE.PlaneGeometry(W * 0.86, H * 0.8), back, 0, 0.02, -hz + 0.03);

  /* the rack and the three keys (client, backup, platform) */
  add(new THREE.CylinderGeometry(0.018, 0.018, W * 0.78, 20), chrome, 0, 0.36, -0.05).rotation.z = Math.PI / 2;
  for (const x of [-W * 0.39, W * 0.39]) add(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 20), chrome, x, 0.36, -0.05).rotation.z = Math.PI / 2;
  const keys = [-0.3, 0, 0.3].map((x, i) => {
    const k = createKey({ light });
    const g = new THREE.Group(); g.add(k.object); g.scale.setScalar(0.34); g.position.set(x, 0.02, -0.05); g.rotation.z = (i - 1) * 0.04;
    root.add(g);
    const hook = add(new THREE.TorusGeometry(0.03, 0.007, 10, 28), chrome, x, 0.33, -0.05);
    return { k, g, x, hook, phase: i * 0.7 };
  });

  /* the door: glass in a frame, hinged on the left, with a chrome wheel, a dial and three bolts */
  const door = new THREE.Group(); door.position.set(-hx, 0, hz + 0.01); root.add(door);
  const dW = W - 0.01, dH = H - 0.01;
  const leaf = new THREE.Group(); leaf.position.x = dW / 2; door.add(leaf);
  add(pane(dW * 0.86, dH * 0.86), glass, 0, 0, 0.012, leaf);
  for (const y of [-dH / 2 + 0.05, dH / 2 - 0.05]) add(bar(dW - 0.02, 0.09, 0.05), frame, 0, y, 0.012, leaf);
  for (const x of [-dW / 2 + 0.05, dW / 2 - 0.05]) add(bar(0.09, dH - 0.02, 0.05), frame, x, 0, 0.012, leaf);
  for (const y of [-0.38, 0.38]) add(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 20), chrome, -dW / 2 + 0.01, y, 0.0, leaf);
  const wheel = new THREE.Group(); wheel.position.set(dW * 0.24, -0.02, 0.07); leaf.add(wheel);
  add(new THREE.TorusGeometry(0.13, 0.017, 16, 64), chrome, 0, 0, 0, wheel);
  for (let i = 0; i < 4; i++) { const s = add(new THREE.CylinderGeometry(0.011, 0.011, 0.24, 12), chrome, 0, 0, 0, wheel); s.rotation.z = i * Math.PI / 4; }
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 24), chrome, 0, 0, 0, wheel).rotation.x = Math.PI / 2;
  const dial = add(new THREE.TorusGeometry(0.05, 0.008, 10, 40), chrome, -dW * 0.2, 0.3, 0.06, leaf);
  const dialGlow = M(mat.light({ color: 0x9bb6ff, opacity: 0 }));
  add(new THREE.CircleGeometry(0.04, 32), dialGlow, -dW * 0.2, 0.3, 0.062, leaf);
  const bolts = [-0.32, 0, 0.32].map(y => add(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 16), chrome, dW / 2 + 0.03, y, 0.012, leaf));
  bolts.forEach(b => { b.rotation.z = Math.PI / 2; });
  void dial;

  return {
    object,
    update(time, state = {}) {
      const open = state.open ?? 0, cold = state.cold ?? 0, lift = state.lift ?? 0;
      const draw = sm(0, 0.35, open), swing = sm(0.35, 1, open);
      bolts.forEach(b => { b.position.x = dW / 2 + 0.03 - draw * 0.1; });
      wheel.rotation.z = -draw * Math.PI * 0.9;
      door.rotation.y = -swing * 1.75;
      glass.roughness = 0.06 + cold * 0.34; glass.opacity = 0.14 + cold * 0.3; glass.iridescence = 0.25 * (1 - cold);
      glass.color.setHex(0xc9d7ff).lerp(new THREE.Color(0xeef3ff), cold);
      back.opacity = (light ? 0.25 : 0.38) * (0.55 + 0.45 * Math.sin(time * 0.6) * 0.5 + 0.5 * cold);
      back.color.setHex(0x4d78ff).lerp(new THREE.Color(0xbfd2ff), cold);
      dialGlow.opacity = 0.25 + 0.6 * (1 - draw) * (0.6 + 0.4 * Math.sin(time * 0.9));
      keys.forEach(({ k, g, phase }) => {
        const up = sm(phase * 0.2, 0.75 + phase * 0.2, lift);
        g.position.y = 0.02 + up * 0.38 + Math.sin(time * 0.5 + phase) * 0.008;
        g.position.z = -0.05 + up * 0.22;
        g.rotation.y = up * 0.35 * (phase - 0.7);
        k.update(time, { split: 0 });
      });
    },
    dispose() {
      geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose());
      keys.forEach(({ k }) => k.dispose && k.dispose());
    }
  };
}
