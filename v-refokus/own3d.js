/* Own: the G from the hero, built one piece at a time as each idea arrives.
   Light studio environment (soft boxes plus dark flags) so glass and chrome read on the pale section. */
import * as THREE from 'three';

const canvas = document.getElementById('own3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
try { if (canvas) start(); } catch (e) { console.warn('own3d unavailable', e); }

function start() {
  const wrap = document.getElementById('own');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = 0.7;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f7ff);
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
  const EX = { depth: 0.36, bevelEnabled: true, bevelThickness: 0.11, bevelSize: 0.1, bevelOffset: -0.1, bevelSegments: 10, curveSegments: 48 };
  const arcShape = (r0, r1, a0, a1) => { const s = new THREE.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true); s.closePath(); return s; };
  const barShape = (x0, y0, x1, y1, r) => { const s = new THREE.Shape(); s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1); s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0); return s; };
  const A0 = THREE.MathUtils.degToRad(55), SPAN = THREE.MathUtils.degToRad(305), GAP = 0.03, N = 5;
  const group = new THREE.Group(); scene.add(group);
  const pieces = [];
  for (let i = 0; i <= N; i++) {
    const bar = i === N;
    let geo, dir;
    if (!bar) {
      const a0 = A0 + i * SPAN / N + GAP, a1 = A0 + (i + 1) * SPAN / N - GAP;
      geo = new THREE.ExtrudeGeometry(arcShape(0.64, 1.0, a0, a1), EX);
      const mid = (a0 + a1) / 2; dir = new THREE.Vector3(Math.cos(mid), Math.sin(mid), 0);
    } else {
      geo = new THREE.ExtrudeGeometry(barShape(0.16, 0.05, 1.0, 0.33, 0.1), EX);
      dir = new THREE.Vector3(0.75, 0.66, 0);
    }
    geo.translate(0, 0, -EX.depth / 2);
    const mesh = new THREE.Mesh(geo, (bar ? chrome : glass).clone());
    const pivot = new THREE.Group(); pivot.add(mesh); group.add(pivot);
    const rn = s => { const x = Math.sin(s * 91.7 + i * 12.3) * 43758.5; return x - Math.floor(x); };
    pieces.push({ pivot, mesh, dir, bar, v: 0, glow: 0, rot: new THREE.Euler((rn(1) - .5) * 4, (rn(2) - .5) * 4, (rn(3) - .5) * 3), off: dir.clone().multiplyScalar(4).add(new THREE.Vector3(0, -1.5, -2)) });
  }
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
    const act = window.__own ? window.__own.active : -1;
    const time = now / 1000;
    pieces.forEach((p, i) => {
      const target = reduce ? (i <= act || (p.bar && act >= N - 1) ? 1 : 0) : (p.bar ? (act >= N - 1 ? 1 : 0) : (i <= act ? 1 : 0));
      p.v += (target - p.v) * (reduce ? 1 : k);
      const f = 1 - ease(Math.min(1, p.v));
      p.pivot.position.copy(p.off).multiplyScalar(f);
      p.pivot.rotation.set(p.rot.x * f, p.rot.y * f, p.rot.z * f);
      p.pivot.scale.setScalar(0.001 + (1 - 0.001) * Math.min(1, p.v * 1.4));
      const isNew = (p.bar ? act >= N - 1 : i === act) ? 1 : 0;
      p.glow += (isNew - p.glow) * k;
      p.mesh.material.emissiveIntensity = p.glow * 0.4;
    });
    group.rotation.y = Math.sin(time * 0.45) * 0.32 - 0.12;
    group.rotation.x = Math.sin(time * 0.31) * 0.08 + 0.06;
    group.scale.setScalar(1.62);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
