// Core services: five glass layers, each inlaid with one letter of the wordmark. The active layer slides out of the stack.
import * as THREE from 'three';
import { makeEnvironment, loadLockup } from './gl-common.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const roundedRect = (w, h, r) => {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return s;
};

export async function initStack(canvas, host) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(renderer); scene.environmentIntensity = 1.2;
  const camera = new THREE.PerspectiveCamera(26, 1, .1, 100);
  camera.position.set(0, 4.8, 14); camera.lookAt(0, .1, 0);

  const letters = (await loadLockup('../shared/assets/bitgo-logo.svg', { depth: 10, bt: 4, bs: 3 })).filter(p => p.name !== 'shield');
  const order = ['B', 'i', 't', 'G', 'o'];
  const mats = [
    new THREE.MeshPhysicalMaterial({ color: '#dfe8ff', roughness: .06, transmission: 1, thickness: 1.2, ior: 1.5, attenuationColor: new THREE.Color('#6a8cff'), attenuationDistance: 3, clearcoat: 1, envMapIntensity: 1.8, iridescence: .5 }),
    new THREE.MeshPhysicalMaterial({ color: '#0a1230', roughness: .12, metalness: .2, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 2.2 }),
    new THREE.MeshPhysicalMaterial({ color: '#f4f7ff', roughness: .35, transmission: .85, thickness: 1.5, ior: 1.45, attenuationColor: new THREE.Color('#9db6ff'), attenuationDistance: 4, clearcoat: .6, clearcoatRoughness: .25, envMapIntensity: 1.4 }),
    new THREE.MeshPhysicalMaterial({ color: '#1647DB', roughness: .18, metalness: .1, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.8, iridescence: .3 }),
    new THREE.MeshPhysicalMaterial({ color: '#cfd8ee', roughness: .22, metalness: .85, clearcoat: .5, envMapIntensity: 2.4 })
  ];
  const inlayMat = (dark) => new THREE.MeshPhysicalMaterial({ color: dark ? '#1647DB' : '#ffffff', emissive: dark ? '#1647DB' : '#2a56ee', emissiveIntensity: dark ? .35 : .5, roughness: .2, clearcoat: 1, envMapIntensity: 1.4 });

  const stack = new THREE.Group(); scene.add(stack);
  const W = 5.2, T = .34, GAP = .78;
  const layers = order.map((nm, i) => {
    const g = new THREE.Group();
    const geo = new THREE.ExtrudeGeometry(roundedRect(W * (1 - i * .035), W * (1 - i * .035), .7), { depth: T, bevelEnabled: true, bevelThickness: .09, bevelSize: .09, bevelOffset: -.09, bevelSegments: 8, curveSegments: 20 });
    geo.rotateX(-Math.PI / 2); geo.translate(0, -T / 2, 0);
    const slab = new THREE.Mesh(geo, mats[i]); g.add(slab);
    const L = letters.find(l => l.name === nm);
    const lg = L.geo.clone();
    const s = (W * .46) / Math.max(L.size.x, L.size.y);
    const inlay = new THREE.Mesh(lg, inlayMat(i === 0 || i === 2 || i === 4));
    inlay.scale.set(s, -s, s); // flip svg y at object level
    inlay.rotation.x = -Math.PI / 2;
    inlay.position.y = T / 2 + .03;
    g.add(inlay);
    g.userData = { i, x: 0, y: 0, lift: 0, glow: 0 };
    stack.add(g);
    return { g, slab, inlay };
  });

  // light column through the stack: the strand motif standing up
  const rods = new THREE.Group();
  for (let k = 0; k < 9; k++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, GAP * 5 + 1.6, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(k % 3 === 0 ? '#e6efff' : '#3a6bff').multiplyScalar(2.2) }));
    const a = k / 9 * Math.PI * 2; m.position.set(Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4 - 2.8); rods.add(m);
  }
  scene.add(rods);
  const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec2 vUv; void main(){ float d=length((vUv-.5)*vec2(1.,1.5)); float a=exp(-d*d*16.)*.5; gl_FragColor=vec4(.09,.28,.86,a); }'
  }));
  glowPlane.position.set(0, 0, -4); glowPlane.renderOrder = -5; scene.add(glowPlane);

  let active = 0, vis = true, resizeW = 0, resizeH = 0;
  const cur = layers.map(() => ({ x: 0, y: 0, rz: 0, glow: 0 }));
  const resize = () => {
    const r = host.getBoundingClientRect(); resizeW = Math.max(2, r.width); resizeH = Math.max(2, r.height);
    renderer.setSize(resizeW, resizeH, false); camera.aspect = resizeW / resizeH;
    camera.fov = resizeW / resizeH < .9 ? 36 : 26; camera.updateProjectionMatrix();
  };
  resize(); new ResizeObserver(resize).observe(host);
  new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(host);
  let spin = 0, last = performance.now(), nextOk = 0, slow = 0, q = 1;
  const maxDpr = Math.min(devicePixelRatio || 1, 2);
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!vis || now < nextOk) { last = now; return; }
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    const k = 1 - Math.pow(.0005, dt);
    layers.forEach((L, i) => {
      const tY = (2 - i) * GAP * (i === active ? 1 : 1) * 1 + (i === active ? .0 : 0);
      const tx = i === active ? 1.0 : 0, ty = tY + (i === active ? .22 : 0), tglow = i === active ? 1 : 0;
      const c = cur[i];
      c.x += (tx - c.x) * k; c.y += (ty - c.y) * k; c.glow += (tglow - c.glow) * k;
      L.g.position.set(c.x, c.y, 0);
      L.inlay.material.emissiveIntensity = .22 + c.glow * 1.1;
    });
    spin += ((reduce ? 0 : .22) * dt);
    stack.rotation.y = -0.62 + Math.sin(spin) * .22;
    rods.rotation.y = stack.rotation.y * .5;
    const r0 = performance.now();
    renderer.render(scene, camera);
    const cost = performance.now() - r0;
    if (cost > 70) slow++; else if (cost < 25) slow = Math.max(0, slow - 1);
    if (slow > 3 && q > .5) { q -= .15; renderer.setPixelRatio(maxDpr * q); renderer.setSize(resizeW, resizeH, false); slow = 0; }
    nextOk = now + Math.min(250, cost * 1.2);
  };
  requestAnimationFrame(frame);
  return { setActive: (i) => { active = clamp(i, 0, 4); } };
}
