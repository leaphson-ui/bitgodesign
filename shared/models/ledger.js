/* A chain of ledger blocks: metal plates with glass caps, ruled with light like ledger lines, each hooked to the
   last by a chrome link. grow 0..1 extends the chain: a new block drops in, its link engages, and a pulse of
   light passes down the chain to it. The record that only ever grows, for tokenization and real-world assets. */
import { THREE, mat, glow, rbox, addMesh, inst, smoother, sm, lerp, clamp, rng, disposeTree } from './_kit.js';

export const meta = {
  name: 'ledger', distance: 4.7, title: 'Ledger',
  means: 'Every asset on one chain of records, each block locked to the one before',
  pages: ['Tokenization', 'Real-World Assets', 'Attestations'],
  states: { grow: 'new blocks drop in and link on, 0..1' }
};

const N = 5, W = 0.34, H = 0.15, STEP = [0.45, 0.07, -0.1];

export function create(opts = {}) {
  const L = !!opts.light;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(1.1); root.rotation.y = -0.12; object.add(root);
  const metal = mat.metal({ emissiveIntensity: 0.04, color: 0x2240b0, roughness: 0.36, envMapIntensity: 0.75 }), dark = mat.metal({ emissiveIntensity: 0.04, color: 0x142570, roughness: 0.45, envMapIntensity: 0.6 });
  const chrome = mat.chrome(), ink = mat.ink({ clearcoat: 0.15, color: 0x050b2c, roughness: 0.6, envMapIntensity: 0.3 });
  const rand = rng(9);
  const bodyGeo = rbox(W, H, W, 0.016, 3), plateGeo = rbox(W - 0.03, 0.012, W - 0.03, 0.004), capGeo = rbox(W - 0.05, 0.03, W - 0.05, 0.01, 2);
  const labelGeo = rbox(0.17, 0.045, 0.01, 0.004), rivetGeo = new THREE.SphereGeometry(0.009, 8, 6);
  const brGeo = rbox(0.05, 0.02, 0.012, 0.003, 1);
  const barGeo = new THREE.BoxGeometry(1, 0.003, 0.012);

  const blocks = [];
  for (let i = 0; i < N; i++) {
    const g = new THREE.Group(); root.add(g);
    addMesh(g, bodyGeo, i % 2 ? metal : dark);
    addMesh(g, plateGeo, chrome, 0, H / 2 + 0.003, 0);
    const capMat = mat.glass({ thickness: 0.3 });
    addMesh(g, capGeo, capMat, 0, H / 2 + 0.024, 0);
    // ledger lines on top of the glass
    const lm = glow(L, { opacity: 0.55 });
    const bars = []; for (let r = 0; r < 5; r++) bars.push({ p: [(rand() - 0.5) * 0.04, H / 2 + 0.041, -0.095 + r * 0.047], s: [0.08 + rand() * 0.13, 1, 1] });
    inst(barGeo, lm, bars, g);
    // front label plate and rivets
    addMesh(g, labelGeo, ink, 0, -0.005, W / 2 + 0.002);
    inst(rivetGeo, chrome, [[-0.11, 0.02], [0.11, 0.02], [-0.11, -0.03], [0.11, -0.03]].map(p => ({ p: [p[0], p[1], W / 2 + 0.006], s: [1, 1, 0.6] })), g);
    // corner brackets
    inst(brGeo, chrome, [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ({ p: [a * (W / 2 - 0.005), -H / 2 + 0.02, b * (W / 2 + 0.002)], s: [1, 1, 1] })), g);
    const link = new THREE.Group(); root.add(link);
    if (i < N - 1) {
      addMesh(link, new THREE.CylinderGeometry(0.016, 0.016, 0.2, 12), chrome).rotation.z = Math.PI / 2;
      [-1, 1].forEach(s => { const t = addMesh(link, new THREE.TorusGeometry(0.04, 0.012, 8, 20), chrome, s * 0.05, 0, 0); t.rotation.y = Math.PI / 2; });
    }
    blocks.push({ g, link, capMat, lm, i });
  }
  const base = (i) => new THREE.Vector3((i - (N - 1) / 2) * STEP[0], (i - (N - 1) / 2) * STEP[1], (i - (N - 1) / 2) * STEP[2]);
  // a pulse bead that rides the links
  const bead = addMesh(root, new THREE.SphereGeometry(0.022, 10, 8), glow(L), 0, 0, 0);
  const st = smoother(2.0), cen = new THREE.Vector3();
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { grow: 0 }), n = 2 + (N - 2) * s.grow;
      let newest = 0;
      cen.copy(base(0)).add(base(n - 1)).multiplyScalar(-0.5); root.position.x = cen.x; root.position.y = cen.y; root.position.z = cen.z;
      blocks.forEach(b => {
        const u = clamp(n - b.i), e = sm(0, 1, u), p = base(b.i);
        b.g.visible = u > 0.001;
        b.g.position.set(p.x, p.y + (1 - e) * 0.55 + Math.sin(time * 0.6 + b.i) * 0.004, p.z);
        b.g.scale.setScalar(lerp(0.85, 1, e));
        b.g.rotation.y = (1 - e) * 0.5;
        const nxt = clamp(n - (b.i + 1));
        b.link.visible = b.i < N - 1 && nxt > 0.3;
        const lp = base(b.i), lq = base(b.i + 1 < N ? b.i + 1 : b.i);
        b.link.position.set((lp.x + lq.x) / 2 + 0.0, (lp.y + lq.y) / 2, (lp.z + lq.z) / 2);
        b.link.scale.setScalar(sm(0.3, 1, nxt));
        if (u > 0.01) newest = b.i;
        b.lm.opacity = 0.35 + 0.35 * Math.sin(time * 1.1 + b.i * 0.8);
      });
      blocks.forEach(b => { b.capMat.emissiveIntensity = (b.i === Math.floor(n - 1e-3)) ? 0.45 : 0.06; });
      // pulse travelling along the chain to the newest block, looping
      const span = Math.max(1, newest), ph = (time * 0.18) % 1, f = ph * span, i0 = Math.min(Math.floor(f), newest - 1 < 0 ? 0 : newest - 1), a = base(i0), c = base(Math.min(i0 + 1, N - 1));
      bead.position.lerpVectors(a, c, clamp(f - i0)); bead.position.y += H / 2 + 0.05; bead.visible = newest > 0;
    },
    dispose() { disposeTree(object); }
  };
}
