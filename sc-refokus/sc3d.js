/* Self-Custody 3D: two small, contained scenes instead of one object following the page.
   1. Hero: one glass key, posed at an angle, floating gently and leaning toward the pointer.
   2. Key management: the three keys. Hot: all three stand ready. Cold: the two keys you hold sink into a frosted
      offline block, while BitGo's platform key stays out. Driven by the Hot / Cold tabs, not by scroll. */
import * as THREE from 'three';
import { makeEnv, setupRenderer, mat } from '../shared/models/materials.js';
import { create as createKey } from '../shared/models/key.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

function stage(canvas, build) {
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  setupRenderer(renderer); renderer.setClearColor(0, 0);
  const scene = new THREE.Scene(); scene.environment = makeEnv(renderer, 'dark');
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50); camera.position.set(0, 0, 5.2);
  const key = new THREE.DirectionalLight(0xffffff, 0.7); key.position.set(-3, 4, 5); scene.add(key);
  const tick = build(scene, camera);
  let vis = false;
  const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width) return; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '10% 0px' }).observe(canvas);
  resize();
  let last = performance.now(); const t0 = last;
  const frame = now => {
    requestAnimationFrame(frame);
    if (!vis) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
    tick(reduce ? 3 : (now - t0) / 1000, dt);
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
}

/* 1. hero key */
stage(document.getElementById('hero3d'), (scene, camera) => {
  camera.position.set(0, 0, 4.6);
  const k = createKey({}); const g = new THREE.Group(); g.add(k.object); g.scale.setScalar(1.25); scene.add(g);
  return (t) => {
    g.rotation.set(0.08 + ptr.sy * 0.12, -0.55 + Math.sin(t * 0.22) * 0.18 + ptr.sx * 0.25, -0.5 + Math.sin(t * 0.17) * 0.04);
    g.position.y = Math.sin(t * 0.35) * 0.05;
    k.update(t, { split: 0 });
  };
});

/* 2. the three keys: hot (all ready) or cold (your two keys offline in a frosted block) */
stage(document.getElementById('keys3d'), (scene) => {
  const keys = [0, 1, 2].map(() => { const k = createKey({}); const g = new THREE.Group(); g.add(k.object); g.scale.setScalar(0.62); scene.add(g); return { k, g }; });
  const HOT = [[-0.95, 0.15, 0, -0.18], [0, 0.22, 0.25, 0], [1.05, 0.1, -0.1, 0.2]];        // x, y, z, tilt
  const COLD = [[-0.42, -0.62, 0, 1.5708], [0.42, -0.62, 0, 1.5708], [1.15, 0.45, -0.1, 0.22]];
  const block = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.0, 1, 1, 1), mat.frost({ roughness: 0.42, thickness: 2, attenuationDistance: 1.4 }));
  block.position.set(0, -0.62, 0); scene.add(block);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(block.geometry), new THREE.LineBasicMaterial({ color: 0x9bb6ff, transparent: true, opacity: 0.5 }));
  block.add(edge);
  let m = 0;                                                                    // 0 hot, 1 cold (damped)
  return (t, dt) => {
    const target = window.__sc ? window.__sc.mode : 0;
    m += (target - m) * (1 - Math.exp(-dt * 2.4));
    keys.forEach(({ k, g }, i) => {
      const a = HOT[i], b = COLD[i];
      g.position.set(a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m + Math.sin(t * 0.4 + i) * 0.03 * (1 - m), a[2] + (b[2] - a[2]) * m);
      g.rotation.set(0, Math.sin(t * 0.25 + i) * 0.12, a[3] + (b[3] - a[3]) * m);
      k.update(t, { split: 0 });
    });
    block.scale.setScalar(0.001 + m * 0.999); block.material.opacity = 1;
    edge.material.opacity = 0.5 * m;
    scene.rotation.y = ptr.sx * 0.15 + Math.sin(t * 0.15) * 0.08;
    scene.rotation.x = 0.12 + ptr.sy * 0.08;
  };
});
