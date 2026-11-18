// Hero scene: the BitGo lockup as six glass pieces that arrive from scatter, settle, then drift apart on scroll.
import * as THREE from 'three';
import { makeEnvironment, makeCurtainMaterial, loadLockup } from './gl-common.js';

const ease = {
  out: t => 1 - Math.pow(1 - t, 4),
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  back: t => { const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
};
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export async function initHero(canvas, host, opts = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1.6, 1, 200);
  camera.position.set(0, 0, 30);
  scene.environment = makeEnvironment(renderer);
  scene.environmentIntensity = 1.1;

  // curtain plane, sized to fill the view at its distance
  const curtainMat = makeCurtainMaterial({ seed: 3, density: 30, intensity: 1.0 });
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), curtainMat);
  curtain.position.z = -14; curtain.renderOrder = -10; curtain.frustumCulled = false;
  scene.add(curtain);

  // lights for sparkle on the bevels
  const key = new THREE.PointLight('#bcd0ff', 900, 0, 2); key.position.set(-8, 7, 12); scene.add(key);
  const rim = new THREE.PointLight('#2a5bff', 700, 0, 2); rim.position.set(10, -5, 6); scene.add(rim);

  const pieces = await loadLockup('../shared/assets/bitgo-logo.svg');
  const group = new THREE.Group();
  group.scale.set(1, -1, 1);            // flip at object level so winding stays right under transmission
  const root = new THREE.Group(); root.add(group); scene.add(root);

  const glass = new THREE.MeshPhysicalMaterial({
    color: '#e4ecff', metalness: 0, roughness: 0.08,
    transmission: 1, thickness: 24, ior: 1.5,
    attenuationColor: new THREE.Color('#2a56f0'), attenuationDistance: 40,
    clearcoat: 1, clearcoatRoughness: 0.03,
    iridescence: 0.5, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 520],
    specularIntensity: 1, envMapIntensity: 1.9, dispersion: 0.5,
    emissive: new THREE.Color('#1a45d8'), emissiveIntensity: 0.12
  });
  const enamel = new THREE.MeshPhysicalMaterial({
    color: '#1647DB', metalness: 0.15, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04,
    iridescence: 0.3, envMapIntensity: 1.4, sheen: 0.5, sheenColor: new THREE.Color('#7da2ff')
  });
  const dense = new THREE.MeshPhysicalMaterial({
    color: '#dfe8ff', metalness: 0, roughness: 0.06, transmission: 1, thickness: 40, ior: 1.55,
    attenuationColor: new THREE.Color('#2a5bff'), attenuationDistance: 36,
    clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 0.45, envMapIntensity: 1.8,
    emissive: new THREE.Color('#1647DB'), emissiveIntensity: 0.3
  });

  const meshes = pieces.map((p) => {
    const mat = p.name === 'shield' ? dense : (p.name === 'B' || p.name === 'G') ? glass : glass;
    const m = new THREE.Mesh(p.geo, mat);
    group.add(m);
    return { ...p, mesh: m };
  });
  // the ₿ lives inside the shield, which stays in the lockup as the mark, so we keep one enamel accent piece:
  // a thin enamel backplate behind the shield so the cutout reads as blue light
  const back = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), copy() {} };

  // layout: desktop lockup in one row, phone stacks the shield over the word
  const lettersC = (() => {
    const L = meshes.filter(m => m.name !== 'shield');
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    L.forEach(m => { x0 = Math.min(x0, m.center.x - m.size.x / 2); x1 = Math.max(x1, m.center.x + m.size.x / 2); y0 = Math.min(y0, m.center.y - m.size.y / 2); y1 = Math.max(y1, m.center.y + m.size.y / 2); });
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  })();
  const LOCK = { cx: 271, cy: 92 };
  let layout = 'wide';
  const rest = new Map();
  const setLayout = (mode) => {
    layout = mode;
    meshes.forEach(m => {
      if (mode === 'wide') rest.set(m, new THREE.Vector3(m.center.x - LOCK.cx, m.center.y - LOCK.cy, 0));
      else if (m.name === 'shield') rest.set(m, new THREE.Vector3(0, -128, 0));
      else rest.set(m, new THREE.Vector3(m.center.x - lettersC.cx, m.center.y - lettersC.cy + 96, 0));
    });
  };
  setLayout('wide');

  // choreography data per piece: scattered start and exploded end
  const rnd = (i, k) => { const s = Math.sin(i * 91.7 + k * 17.3) * 43758.5; return s - Math.floor(s) - .5; };
  const order = { shield: 0, B: 1, i: 2, t: 3, G: 4, o: 5 };
  meshes.forEach((m, i) => {
    m.start = new THREE.Vector3(rnd(i, 1) * 900, rnd(i, 2) * 700, -500 - Math.abs(rnd(i, 3)) * 900);
    m.startRot = new THREE.Euler(rnd(i, 4) * 5, rnd(i, 5) * 6, rnd(i, 6) * 4);
    m.end = new THREE.Vector3(rnd(i, 7) * 360, (i % 2 ? 1 : -1) * (120 + Math.abs(rnd(i, 8)) * 180), (order[m.name] - 2.5) * 260);
    m.endRot = new THREE.Euler(rnd(i, 9) * 1.6, rnd(i, 10) * 2.4 + (i % 2 ? .8 : -.8), rnd(i, 11) * 1.2);
    m.delay = order[m.name] * 0.16;
  });

  let scrollP = 0, introT = reduce ? 1 : 0, t0 = null;
  const ptr = new THREE.Vector2(.5, .5), ptrS = new THREE.Vector2(.5, .5);
  addEventListener('pointermove', e => { ptr.set(e.clientX / innerWidth, e.clientY / innerHeight); }, { passive: true });

  let W = 0, H = 0, unit = 0.01;
  const resize = () => {
    const r = host.getBoundingClientRect();
    W = Math.max(2, r.width); H = Math.max(2, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - curtain.position.z);
    curtain.scale.set(visH * camera.aspect, visH, 1);
    curtainMat.uniforms.uAspect.value = camera.aspect;
    const visHObj = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visHObj * camera.aspect;
    const narrow = W < 760;
    if (narrow && layout !== 'tall') setLayout('tall'); else if (!narrow && layout !== 'wide') setLayout('wide');
    const frac = narrow ? 0.72 : Math.min(0.68, 0.56 + 600 / W * .1);
    unit = narrow ? (visW * frac) / lettersC.w : (visW * frac) / 542;
    root.userData.yShift = narrow ? visHObj * 0.15 : visHObj * 0.13;
  };
  resize();
  new ResizeObserver(resize).observe(host);

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(host);

  const tmpE = new THREE.Euler(), tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion();
  let last = performance.now(), nextOk = 0, slow = 0, q = 1;
  const maxDpr = Math.min(devicePixelRatio || 1, 2);
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!visible && !document.hidden) { last = now; return; }
    if (now < nextOk) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (t0 === null) t0 = now;
    if (!reduce) introT = (now - t0) / 1000;
    const time = now / 1000;
    ptrS.lerp(ptr, 1 - Math.pow(0.001, dt));
    curtainMat.uniforms.uTime.value = reduce ? 0 : time;
    curtainMat.uniforms.uPtr.value.set(ptrS.x, 1 - ptrS.y);

    const sp = ease.io(clamp(scrollP * 1.3));
    meshes.forEach((m) => {
      const a = ease.out(clamp((introT - 0.2 - m.delay) / 1.7));
      const p = rest.get(m);
      // intro: scattered -> home
      m.mesh.position.set(
        THREE.MathUtils.lerp(m.start.x, p.x, a), THREE.MathUtils.lerp(m.start.y, p.y, a), THREE.MathUtils.lerp(m.start.z, p.z, a));
      tmpQ.setFromEuler(tmpE.set(m.startRot.x * (1 - a), m.startRot.y * (1 - a), m.startRot.z * (1 - a)));
      // scroll: home -> exploded
      const sA = ease.io(clamp(sp * 1.15 - order[m.name] * 0.03));
      m.mesh.position.x += m.end.x * sA; m.mesh.position.y += m.end.y * sA; m.mesh.position.z += m.end.z * sA;
      tmpQ2.setFromEuler(tmpE.set(m.endRot.x * sA, m.endRot.y * sA, m.endRot.z * sA));
      m.mesh.quaternion.copy(tmpQ).multiply(tmpQ2);
      // a slow float once settled
      const fl = a * (1 - sA);
      m.mesh.position.y += Math.sin(time * .7 + order[m.name]) * 4 * fl;
      if (m.name === 'shield') { back.position.copy(m.mesh.position); back.position.z -= 14; back.quaternion.copy(m.mesh.quaternion); }
    });
    root.scale.setScalar(unit * (1 - sp * .18));
    root.position.y = root.userData.yShift + sp * 0.8;
    root.rotation.y = (ptrS.x - .5) * 0.5 + Math.sin(time * .25) * .04;
    root.rotation.x = (ptrS.y - .5) * 0.28;
    key.position.x = -8 + (ptrS.x - .5) * 10;
    const r0 = performance.now();
    renderer.render(scene, camera);
    const cost = performance.now() - r0;
    // adaptive resolution: software or weak GPUs drop pixel ratio; always leave the browser some idle time
    if (cost > 70) slow++; else if (cost < 25) slow = Math.max(0, slow - 1);
    if (slow > 3 && q > 0.45) { q -= 0.15; renderer.setPixelRatio(maxDpr * q); renderer.setSize(W, H, false); slow = 0; }
    nextOk = now + Math.min(250, cost * 1.2);
  };
  requestAnimationFrame(frame);

  return {
    setScroll: (p) => { scrollP = p; },
    ready: true
  };
}
