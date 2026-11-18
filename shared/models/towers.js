/* A cluster of seven glass office towers on a plaza podium: glass curtain walls over dark cores, chrome corner
   mullions, floor bands that light up, and crowns that differ (spire, slanted roof, setbacks, helipad, dome).
   lit 0..1 lights the floors from the ground up, tower by tower: an enterprise or treasury switching on. */
import { THREE, mat, glow, lathe, rbox, addMesh, inst, rng, smoother, sm, clamp, lerp, disposeTree } from './_kit.js';

export const meta = {
  name: 'towers', title: 'Towers',
  means: 'Enterprises and treasuries: whole companies, held on one platform',
  pages: ['Enterprises', 'Treasury', 'Institutions'],
  states: { lit: 'floors light up from the ground, tower by tower, 0..1' }
};

const FLOOR = 0.052;

export function create(opts = {}) {
  const L = !!opts.light, hi = opts.quality !== 'low';
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.704); root.position.y = -0.08; object.add(root);
  const chrome = mat.chrome({ roughness: 0.12 }), ink = mat.ink({ clearcoat: 0.15, color: 0x060d33, roughness: 0.5, envMapIntensity: 0.4 });
  const metal = mat.metal({ emissiveIntensity: 0.04, color: 0x2240b0, roughness: 0.4, envMapIntensity: 0.6 });
  const glass = mat.glass({ thickness: 0.35, attenuationDistance: 0.4 });
  const PY = -0.56, rand = rng(5);
  const bands = [];                                  // {tower, y, k}

  /* podium and plaza */
  addMesh(root, rbox(1.96, 0.08, 1.46, 0.02, 3), metal, 0, PY - 0.04, 0);
  addMesh(root, rbox(1.84, 0.02, 1.34, 0.008), ink, 0, PY + 0.005, 0);
  const plaza = []; for (let i = 0; i < 9; i++) plaza.push({ p: [-0.8 + i * 0.2, PY + 0.017, 0.0] });
  const plazaGlow = glow(L, { opacity: 0.35 });
  inst(new THREE.BoxGeometry(0.006, 0.002, 1.3), plazaGlow, plaza, root);
  addMesh(root, rbox(0.9, 0.012, 0.22, 0.004), chrome, 0.05, PY + 0.018, 0.57);   // the entrance walk

  let tid = 0;
  const addTower = (x, z, w, d, h, crown, tiers = null) => {
    const t = tid++, g = new THREE.Group(); g.position.set(x, PY, z); root.add(g);
    const sections = tiers || [{ w, d, h }];
    let y = 0;
    sections.forEach((s, si) => {
      addMesh(g, rbox(s.w, s.h, s.d, 0.006), ink, 0, y + s.h / 2, 0);
      addMesh(g, rbox(s.w + 0.016, s.h - 0.01, s.d + 0.016, 0.01, 2), glass, 0, y + s.h / 2, 0);
      // corner mullions
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => addMesh(g, rbox(0.012, s.h, 0.012, 0.004, 1), chrome, a * (s.w / 2 + 0.008), y + s.h / 2, b * (s.d / 2 + 0.008)));
      // floor bands (outside the glass so the light is seen)
      const n = Math.floor(s.h / FLOOR);
      for (let f = 1; f <= n; f++) bands.push({ t, y: PY + y + f * FLOOR - 0.01, w: s.w + 0.024, d: s.d + 0.024, frac: (y + f * FLOOR) / 1.4, r: rand() });
      // a cap on each tier
      addMesh(g, rbox(s.w + 0.03, 0.02, s.d + 0.03, 0.006), metal, 0, y + s.h + 0.01, 0);
      y += s.h + 0.02;
    });
    crown(g, y);
    return g;
  };
  const spire = (g, y, h, r) => { addMesh(g, new THREE.CylinderGeometry(r, r * 2, h, 10), chrome, 0, y + h / 2, 0); addMesh(g, new THREE.SphereGeometry(r * 1.8, 10, 8), glow(L, { opacity: 0.9 }), 0, y + h, 0); };
  const slant = (g, y, w, d, h) => {
    const sh = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(d / 2, h), new THREE.Vector2(-d / 2, h * 0.25)]);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1 });
    geo.translate(0, 0, -w / 2); geo.rotateY(Math.PI / 2); addMesh(g, geo, metal, 0, y, 0);
  };

  addTower(0, -0.04, 0.34, 0.34, 0, (g, y) => { addMesh(g, rbox(0.2, 0.1, 0.2, 0.008), metal, 0, y + 0.05, 0); spire(g, y + 0.1, 0.34, 0.008); },
    [{ w: 0.34, d: 0.34, h: 0.9 }, { w: 0.28, d: 0.28, h: 0.28 }, { w: 0.22, d: 0.22, h: 0.2 }]);
  addTower(-0.4, 0.14, 0.3, 0.3, 1.0, (g, y) => slant(g, y, 0.3, 0.3, 0.16));
  addTower(0.4, 0.1, 0.28, 0.3, 0, (g, y) => { spire(g, y, 0.14, 0.006); }, [{ w: 0.28, d: 0.3, h: 0.56 }, { w: 0.22, d: 0.24, h: 0.3 }, { w: 0.16, d: 0.18, h: 0.22 }]);
  addTower(-0.2, -0.4, 0.26, 0.26, 0.8, (g, y) => { addMesh(g, rbox(0.1, 0.05, 0.1, 0.006), metal, -0.05, y + 0.025, 0.04); const r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.006, 6, 28), glow(L, { opacity: 0.8 })); r.rotation.x = Math.PI / 2; r.position.set(0.04, y + 0.016, -0.04); g.add(r); });
  addTower(0.26, -0.4, 0.3, 0.26, 0.68, (g, y) => { const d = new THREE.Mesh(lathe([[0, 0], [0.12, 0, 0.006], [0.1, 0.05, 0.02], [0.05, 0.1, 0.02], [0, 0.12]], 28, 2), glass); d.position.y = y; g.add(d); });
  addTower(-0.7, -0.22, 0.2, 0.22, 0.52, (g, y) => { addMesh(g, rbox(0.22, 0.03, 0.24, 0.006), chrome, 0, y + 0.015, 0); });
  addTower(0.7, -0.24, 0.2, 0.24, 0.46, (g, y) => { spire(g, y, 0.12, 0.005); });

  /* floor bands as one instanced mesh, coloured per floor */
  const bandGeo = new THREE.BoxGeometry(1, 0.009, 1);
  const bandMat = glow(L, { opacity: L ? 0.95 : 0.8, color: 0xffffff });
  const im = new THREE.InstancedMesh(bandGeo, bandMat, bands.length);
  const pos = [[-0.4, 0.14], [0, -0.04], [0.4, 0.1], [-0.2, -0.4], [0.26, -0.4], [-0.7, -0.22], [0.7, -0.24]];
  // towers were created in a different order than listed above: look the position up from the bands' tower id
  const order = [[0, -0.04], [-0.4, 0.14], [0.4, 0.1], [-0.2, -0.4], [0.26, -0.4], [-0.7, -0.22], [0.7, -0.24]];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  bands.forEach((b, i) => { m4.compose(new THREE.Vector3(order[b.t][0], b.y, order[b.t][1]), q, new THREE.Vector3(b.w, 1, b.d)); im.setMatrixAt(i, m4); });
  im.instanceMatrix.needsUpdate = true; root.add(im);
  const col = new THREE.Color(), off = L ? new THREE.Color(0x0a1c70) : new THREE.Color(0x0a1c58), on = L ? new THREE.Color(0x1647db) : new THREE.Color(0xa9c4ff);
  bandMat.depthWrite = false;

  const st = smoother(1.8);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { lit: 0 }), k = s.lit;
      bands.forEach((b, i) => {
        // each tower starts a little later; floors light from the bottom up with a per-floor jitter
        const start = b.t * 0.08, v = clamp((k * 1.5 - start - b.frac * 0.6 - b.r * 0.15) * 4);
        const fl = 0.85 + 0.15 * Math.sin(time * 0.7 + b.r * 40);
        col.copy(off).lerp(on, v * fl); im.setColorAt(i, col);
      });
      im.instanceColor.needsUpdate = true;
      plazaGlow.opacity = 0.2 + 0.5 * k;
      root.rotation.y = Math.sin(time * 0.3) * 0.04;
    },
    dispose() { disposeTree(object); }
  };
}
