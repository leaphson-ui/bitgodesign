/* Eight validator nodes on a track around a glass core, tied to it by spokes. Each node is a hex-prism machine
   with a glass cap, a chrome collar and a status light. rewards 0..1 sends pulses out along the spokes; each node
   flashes as its pulse arrives and the pulse carries on round the track. Staking: the core pays the ring. */
import { THREE, mat, glow, lathe, rbox, addMesh, inst, smoother, sm, lerp, clamp, disposeTree } from './_kit.js';

export const meta = {
  name: 'validators', distance: 4.0, title: 'Validators',
  means: 'Staking: independent nodes secure the network, and rewards flow back out from the core',
  pages: ['Staking', 'Validators', 'Rewards'],
  states: { rewards: 'reward pulses run from the core out to the nodes, 0..1' }
};

const NODES = 8, RR = 0.74;

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(1.02); root.position.y = -0.1; object.add(root);
  const metal = mat.metal({ emissiveIntensity: 0.04, color: 0x2240b0, roughness: 0.36, envMapIntensity: 0.75 }), dark = mat.metal({ emissiveIntensity: 0.04, color: 0x142570, roughness: 0.45, envMapIntensity: 0.6 });
  const chrome = mat.chrome(), ink = mat.ink({ clearcoat: 0.15, color: 0x050b2c, roughness: 0.6, envMapIntensity: 0.3 });

  /* the track: a bevelled ring with a groove carrying a light rail */
  addMesh(root, lathe([[RR - 0.1, 0], [RR - 0.1, 0.05, 0.015], [RR + 0.1, 0.05, 0.015], [RR + 0.1, 0]], 96, 3), dark, 0, -0.05, 0);
  addMesh(root, lathe([[RR - 0.04, 0.05], [RR - 0.04, 0.045], [RR + 0.04, 0.045], [RR + 0.04, 0.05]], 96, 1), ink, 0, -0.049, 0);
  const rail = addMesh(root, new THREE.TorusGeometry(RR, 0.006, 6, 120), glow(L, { opacity: 0.35 }), 0, 0.0025, 0); rail.rotation.x = Math.PI / 2;
  addMesh(root, new THREE.TorusGeometry(RR + 0.1, 0.012, 8, 96), chrome, 0, 0.0, 0).rotation.x = Math.PI / 2;

  /* core: plinth, glass drum, chrome bands, cap */
  addMesh(root, lathe([[0, 0], [0.3, 0, 0.015], [0.3, 0.07, 0.015], [0.25, 0.1, 0.02], [0, 0.1]], 64, 3), metal, 0, -0.05, 0);
  const coreGlass = mat.glass({ thickness: 0.5 });
  addMesh(root, lathe([[0, 0], [0.19, 0, 0.012], [0.19, 0.3, 0.02], [0.14, 0.34, 0.02], [0, 0.34]], 64, 3), coreGlass, 0, 0.05, 0);
  [0.05, 0.26, 0.37].forEach(y => addMesh(root, new THREE.TorusGeometry(0.2, 0.014, 8, 48), chrome, 0, y, 0).rotation.x = Math.PI / 2);
  addMesh(root, lathe([[0, 0], [0.12, 0, 0.01], [0.1, 0.05, 0.015], [0, 0.07]], 40, 2), chrome, 0, 0.39, 0);
  const coreGlow = addMesh(root, new THREE.SphereGeometry(0.06, 16, 12), glow(L, { opacity: 0.9 }), 0, 0.46, 0);

  /* spokes and nodes */
  const hexGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.12, 6), capGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.05, 6);
  const spokeGeo = rbox(RR - 0.4, 0.03, 0.04, 0.008, 2), railGeo = new THREE.BoxGeometry(RR - 0.42, 0.003, 0.008);
  const nodes = [], pulseGeo = new THREE.SphereGeometry(0.022, 10, 8), pulseMat = glow(L);
  for (let i = 0; i < NODES; i++) {
    const a = i / NODES * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const g = new THREE.Group(); g.rotation.y = -a; root.add(g);                   // local +x points along the spoke
    const sp = addMesh(g, spokeGeo, dark, 0.3 + (RR - 0.4) / 2, -0.015, 0);
    addMesh(g, railGeo, glow(L, { opacity: 0.4 }), 0.3 + (RR - 0.4) / 2 + 0.01, 0.003, 0);
    const node = new THREE.Group(); node.position.set(RR, 0, 0); g.add(node);
    addMesh(node, hexGeo, metal, 0, 0.01, 0);
    const capM = mat.glass({ thickness: 0.3 });
    addMesh(node, capGeo, capM, 0, 0.095, 0);
    addMesh(node, new THREE.TorusGeometry(0.1, 0.01, 8, 6), chrome, 0, 0.07, 0).rotation.x = Math.PI / 2;
    const led = addMesh(node, new THREE.SphereGeometry(0.014, 8, 6), glow(L, { opacity: 0.4 }), 0.1, 0.0, 0.0);
    const flash = addMesh(node, new THREE.RingGeometry(0.15, 0.165, 40), glow(L, { opacity: 0 }), 0, 0.125, 0); flash.rotation.x = -Math.PI / 2;
    const p = new THREE.Mesh(pulseGeo, pulseMat); root.add(p);
    const p2 = new THREE.Mesh(pulseGeo, pulseMat); root.add(p2);
    nodes.push({ g, a, capM, led, flash, p, p2, off: i * 0.37 });
  }
  const st = smoother(2.2);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { rewards: 0 }), r = s.rewards;
      coreGlow.scale.setScalar(1 + 0.2 * Math.sin(time * 1.4) + r * 0.4);
      coreGlass.emissiveIntensity = 0.05 + r * 0.35;
      rail.material.opacity = 0.3 + 0.4 * r;
      nodes.forEach(n => {
        const period = 6 - 2 * r, u = ((time / period + n.off) % 1 + 1) % 1;
        const act = 0.15 + 0.85 * r;
        const out = clamp(u / 0.55), arrive = sm(0.5, 0.62, u) * (1 - sm(0.62, 0.9, u));
        // pulse out along the spoke
        n.p.visible = u < 0.55 && r > 0.02; n.p.position.set(Math.cos(n.a) * lerp(0.3, RR, out), 0.012, Math.sin(n.a) * lerp(0.3, RR, out)); n.p.scale.setScalar(act * (0.5 + 0.8 * Math.sin(Math.PI * out)));
        // and on round the track to the next node
        const t2 = clamp((u - 0.55) / 0.45), a2 = n.a + t2 * (Math.PI * 2 / NODES);
        n.p2.visible = u >= 0.55 && r > 0.02; n.p2.position.set(Math.cos(a2) * (RR + 0.0), 0.01, Math.sin(a2) * RR); n.p2.scale.setScalar(act * (0.8 - 0.4 * t2));
        n.capM.emissiveIntensity = arrive * r * 0.9 + 0.05;
        n.led.material.opacity = 0.3 + 0.6 * arrive * r;
        n.flash.material.opacity = arrive * r * 0.9; n.flash.scale.setScalar(0.8 + 0.5 * (1 - arrive));
      });
      root.rotation.y = Math.sin(time * 0.2) * 0.1;
    },
    dispose() { disposeTree(object); }
  };
}
