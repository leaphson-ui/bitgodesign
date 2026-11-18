// Core stack: five plates, five finishes, one per core service. Active plate lifts and turns BitGo blue.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeEnv, BLUE } from './sculpt.js';

function heightCanvas(draw, size = 1024) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, size, size);
  draw(x, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
const noise = (x, s, n, a, w, h) => {
  for (let i = 0; i < n; i++) {
    const v = 128 + (Math.random() - 0.5) * 255 * a;
    x.fillStyle = `rgb(${v},${v},${v})`;
    x.fillRect(Math.random() * s, Math.random() * s, w, h);
  }
};
const FINISH = [
  // polished glass
  { base: 0x06080d, metal: 0.85, rough: 0.07, cc: 1, ccr: 0.04, bump: null },
  // frosted
  { base: 0x14181f, metal: 0.25, rough: 0.58, cc: 0, ccr: 0.5, bump: (x, s) => noise(x, s, 90000, 0.7, 2, 2), bs: 0.5 },
  // fluted
  { base: 0x080b12, metal: 0.8, rough: 0.2, cc: 1, ccr: 0.1, bs: 3.2, bump: (x, s) => {
    for (let i = 0; i < 48; i++) {
      const g = x.createLinearGradient(i * s / 48, 0, (i + 1) * s / 48, 0);
      g.addColorStop(0, '#202020'); g.addColorStop(0.5, '#f0f0f0'); g.addColorStop(1, '#202020');
      x.fillStyle = g; x.fillRect(i * s / 48, 0, s / 48 + 1, s);
    } } },
  // brushed
  { base: 0x0b0e15, metal: 0.95, rough: 0.34, cc: 0, ccr: 0.3, bs: 0.9, bump: (x, s) => noise(x, s, 26000, 0.9, 420, 1.2) },
  // wide diagonal flutes
  { base: 0x070a10, metal: 0.8, rough: 0.22, cc: 1, ccr: 0.12, bs: 2.4, bump: (x, s) => {
    x.save(); x.translate(s / 2, s / 2); x.rotate(Math.PI / 4); x.translate(-s, -s);
    for (let i = 0; i < 30; i++) {
      const w = s * 2 / 30, g = x.createLinearGradient(i * w, 0, (i + 1) * w, 0);
      g.addColorStop(0, '#303030'); g.addColorStop(0.5, '#e8e8e8'); g.addColorStop(1, '#303030');
      x.fillStyle = g; x.fillRect(i * w, 0, w + 1, s * 2);
    } x.restore(); } },
];

export function createStack(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  scene.environment = makeEnv(renderer, 'dark');
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 100);
  const group = new THREE.Group(); scene.add(group);
  const geo = new RoundedBoxGeometry(4.2, 0.16, 4.2, 4, 0.045);
  const blue = new THREE.Color(BLUE);
  const plates = FINISH.map((f, i) => {
    const bump = f.bump ? heightCanvas(f.bump) : null;
    if (bump && i === 2) bump.repeat.set(1, 1);
    const m = new THREE.MeshPhysicalMaterial({ color: f.base, metalness: f.metal, roughness: f.rough, clearcoat: f.cc, clearcoatRoughness: f.ccr, bumpMap: bump, bumpScale: f.bs || 0, envMapIntensity: 0.8 });
    const mesh = new THREE.Mesh(geo, m); group.add(mesh);
    return { mesh, m, fm: f.metal, base: new THREE.Color(f.base), a: 0, ta: 0, lift: 0 };
  });
  let explode = 0, active = 0, running = false, raf = 0, w = 1, h = 1, px = 0, py = 0, t0 = performance.now();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  addEventListener('pointermove', (e) => { px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; }, { passive: true });
  function resize() {
    const r = canvas.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const dist = w / h < 0.9 ? 40 : 29; camera.position.set(0, dist * 0.42, dist); camera.lookAt(0, 0.2, 0); camera.updateProjectionMatrix();
  }
  function frame(now) {
    const t = (now - t0) / 1000;
    plates.forEach((p, i) => {
      p.a += (p.ta - p.a) * 0.08; p.lift += ((p.ta ? 1 : 0) - p.lift) * 0.08;
      p.m.color.copy(p.base).lerp(blue, p.a * 0.92); p.m.metalness += ((p.ta ? 0.3 : p.fm) - p.m.metalness) * 0.1;
      p.m.emissive.copy(blue).multiplyScalar(p.a * 0.05);
      const y = (2 - i) * (0.38 + explode * 1.15) + p.lift * 0.5 * explode;
      p.mesh.position.y = y;
    });
    group.rotation.y = -0.78 + (reduced ? 0 : Math.sin(t * 0.25) * 0.08) + px * 0.35 + explode * 0.25;
    group.rotation.x = py * 0.06;
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }
  return {
    resize,
    setActive(i) { active = i; plates.forEach((p, k) => (p.ta = k === i ? 1 : 0)); },
    setExplode(v) { explode = v; },
    start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    once() { frame(performance.now()); },
  };
}
