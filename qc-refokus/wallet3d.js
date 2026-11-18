/* Custody Wallets: the three keys from the hero close into one glass shield as the section arrives.
   Light studio environment (soft boxes plus dark flags) so glass reads on the pale section. */
import * as THREE from 'three';
import { wedgeSet } from './shield.js';

const canvas = document.getElementById('wallet3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
try { if (canvas) start(); } catch (e) { console.warn('own3d unavailable', e); }

function start() {
  const wrap = document.getElementById('wallet');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = 0.7;
  const scene = new THREE.Scene();
  scene.background = null;   // no ground of its own: the curtain shows through (normalized 50/50)
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 8);

  /* environment: pale studio with dark flags and blue cards for contrast */
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc9d6f7).multiplyScalar(0.9), side: THREE.BackSide })));
  const card = (w, h, col, k, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
  card(30, 12, 0xffffff, 5, [0, 18, 6]);
  card(8, 30, 0xffffff, 6, [-16, 2, 10]);
  card(5, 30, 0xffffff, 7, [17, 0, 8]);
  [-62, -38, -14, 14, 38, 62].forEach((d, i) => { const a = THREE.MathUtils.degToRad(d); card(1.4 + (i % 3) * .7, 40, i % 2 ? 0x06103a : 0x1647db, i % 2 ? 1 : 2.4, [Math.sin(a) * 20, 0, Math.cos(a) * 20]); });
  card(40, 8, 0x0a1a66, 1.2, [0, -18, 6]);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, 0.03).texture; pm.dispose();

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xdfe9ff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 1.3, ior: 1.52,
    attenuationColor: new THREE.Color(0x1647db), attenuationDistance: 0.6, clearcoat: 1, clearcoatRoughness: 0.03,
    iridescence: 0.35, iridescenceIOR: 1.3, envMapIntensity: 1.5, emissive: new THREE.Color(0x2f63ff), emissiveIntensity: 0
  });
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xf4f7ff, metalness: 1, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4, emissive: new THREE.Color(0x2f63ff), emissiveIntensity: 0 });
  const N = 3;
  const group = new THREE.Group(); scene.add(group);
  const pieces = wedgeSet(N, Math.PI / 2 - Math.PI / N).map((g, i) => {
    const mesh = new THREE.Mesh(g.geo, glass.clone());
    const pivot = new THREE.Group(); pivot.add(mesh); group.add(pivot);
    const dir = new THREE.Vector3(g.dir.x, g.dir.y, 0);
    const rn = s => { const x = Math.sin(s * 91.7 + i * 12.3) * 43758.5; return x - Math.floor(x); };
    return { pivot, mesh, dir, bar: false, v: 0, glow: 0, rot: new THREE.Euler((rn(1) - .5) * 4, (rn(2) - .5) * 4, (rn(3) - .5) * 3), off: dir.clone().multiplyScalar(4).add(new THREE.Vector3(0, -1.5, -2)) };
  });
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(-3, 4, 6); scene.add(key);

  let W = 0, H = 0, vis = false, dirty = true;
  const resize = () => {
    const r = canvas.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2);
    if (!r.width) return; W = r.width; H = r.height;
    renderer.setPixelRatio(d); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); dirty = true;
  };
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '10% 0px' }).observe(wrap);
  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  resize();
  const ease = t => 1 - Math.pow(1 - t, 3);
  const clamp01 = v => Math.min(1, Math.max(0, v));
  let last = performance.now();
  const soft = (() => { try { const g = renderer.getContext(), e = g.getExtension('WEBGL_debug_renderer_info'); return e && /swiftshader|llvmpipe|software/i.test(g.getParameter(e.UNMASKED_RENDERER_WEBGL)); } catch (e) { return false; } })();
  let lastR = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!vis || (reduce && !dirty)) { last = now; return; }
    if (soft && now - lastR < 1200) return;
    lastR = now; dirty = false;
    const dt = Math.min(soft ? 0.5 : 0.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * 3.2);
    const wp = window.__wallet ? window.__wallet.p : 1;
    const time = now / 1000;
    pieces.forEach((p, i) => {
      const target = reduce ? 1 : clamp01((wp - .18 - i * .14) / .3);
      p.v += (target - p.v) * (reduce ? 1 : k);
      const f = 1 - ease(Math.min(1, p.v));
      p.pivot.position.copy(p.off).multiplyScalar(f);
      p.pivot.rotation.set(p.rot.x * f, p.rot.y * f, p.rot.z * f);
      p.pivot.scale.setScalar(0.001 + (1 - 0.001) * Math.min(1, p.v * 1.4));
      const isNew = wp > .72 ? 1 : 0;
      p.glow += (isNew - p.glow) * k;
      p.mesh.material.emissiveIntensity = p.glow * 0.28;
    });
    group.rotation.y = Math.sin(time * 0.45) * 0.32 - 0.12;
    group.rotation.x = Math.sin(time * 0.31) * 0.08 + 0.06;
    group.scale.setScalar(1.7);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
