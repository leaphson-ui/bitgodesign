/* Self-Custody: the homepage world (fixed metal light curtain, glass and blue light) behind every section, but no
   object chases you. Each 3D object lives in its own section slot, scrolls with the page like content, plays its
   moment once as it arrives (the key assembles, the wallet opens, the lock seats, the shield closes), then rests.
   The key-management keys answer the Hot / Cold tabs instead of the scroll. */
import * as THREE from 'three';
import { createCurtain } from '../shared/system/curtain-gl.js';   // the shared curtain module
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { calmCurtain } from '../shared/system/calm.js';   // calmer curtain presets (?calm=1..3)
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { TAAPass, taaStep } from '../shared/system/taa.js';   // temporal smoothing for glass highlight edges
import { mat } from '../shared/models/materials.js';
import { create as createKey } from '../shared/models/key.js';
import { create as createShield } from '../shared/models/shield.js';
import { create as createWallet } from '../shared/models/wallet-2.js';
import { create as createHsm } from '../shared/models/hsm.js';
import { create as createLock } from '../shared/models/lock-2.js';
import { create as createLogo } from '../shared/models/logo3d.js';

const canvas = document.getElementById('gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => 1 - Math.pow(1 - clamp(t), 3);

try { start(); } catch (e) { console.warn('WebGL unavailable', e); }

function start() {
  const $ = id => document.getElementById(id);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  let pr = 1, cost = 0, slow = 0, soft = false;
  try { const gl0 = renderer.getContext(), ext = gl0.getExtension('WEBGL_debug_renderer_info'); soft = ext && /swiftshader|llvmpipe|software/i.test(gl0.getParameter(ext.UNMASKED_RENDERER_WEBGL)); } catch (e) {}
  if (soft) pr = 0.5;
  const DPR = () => Math.min(devicePixelRatio || 1, 1.5, pr);
  renderer.setPixelRatio(DPR());
  renderer.toneMapping = THREE.NeutralToneMapping; // ACES bent bright blue toward violet
  renderer.toneMappingExposure = 0.9;
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  const FOV_H = 2 * 9 * Math.tan(THREE.MathUtils.degToRad(35 / 2));

  /* ---------- the curtain: the shared module (shared/system/curtain-gl.js) ---------- */
  const { bgCol, heightRT, normalRT, ortho, heightMat, normalMat, quad, quadScene, dimU, silverU, curtainMat, curtain } = createCurtain({ renderer, scene, soft });

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 4, 6); scene.add(key);
  const kick = new THREE.PointLight(0x4d78ff, 90, 20, 2); kick.position.set(4, -2, 3); scene.add(kick);

  /* ---------- post: multisampled composer target (smooth edges), NaN scrub, bloom ---------- */
  const mkRT = (w, h) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: soft ? 0 : 4 });
  const composer = new EffectComposer(renderer, mkRT(2, 2));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c.rgb)) || any(isinf(c.rgb))) c = vec4(0.,0.,0.,1.); c.rgb = min(c.rgb, vec3(12.)); gl_FragColor = c; }'
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.5, 0.92);
  calmCurtain(curtainMat, bloom, scene);
  bloom.enabled = !soft && !window.__nb;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const taa = soft ? null : new TAAPass(), taaSkip = new Set([curtain]);   // temporal smoothing: clean glass highlight edges (shared/system/taa.js)
  if (taa) composer.addPass(taa);

  let W = 0, H = 0, needResize = true;
  const doResize = () => {
    needResize = false;
    const w = innerWidth, h = innerHeight;
    if (w === W && Math.abs(h - H) < 140) return;      // mobile toolbars change the height; ignore that
    W = w; H = h;
    renderer.setPixelRatio(DPR()); renderer.setSize(w, h, false);
    composer.setPixelRatio(DPR()); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  };
  let dirty = true;
  addEventListener('resize', () => { needResize = true; });
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; dirty = true; }, { passive: true });
  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  doResize();
  document.documentElement.classList.add('gl');


  /* ---------- the curtain's look per section (it changes mood, it never moves an object) ---------- */
  const SECS = ['hero', 'trust', 'wc', 'why', 'kman', 'guide', 'rows', 'latest', 'faq', 'cta', 'news'].map(id => [id, document.getElementById(id)]);
  // one curtain colour for the whole page (the hero's); below the hero it is the same colour, a little less bright
  const LOOK = {
    hero: { dim: 0.95, N: 38, blue: 0, tilt: 0, cy: 0, cz: -4.2, silver: 0 },
    guide: { dim: 0.6, N: 34, blue: 0, tilt: 0, cy: 0, cz: -4.2, silver: 0 },
    cta: { dim: 0.55, N: 30, blue: 1, tilt: 0, cy: 0, cz: -4.2, silver: 0 },
    news: { dim: 0.6, N: 90, blue: 0.55, tilt: -0.45, cy: -1.3, cz: -3.4, silver: 0 },
    kman: { dim: 0.28, N: 64, blue: 0, tilt: 0, cy: 0, cz: -4.2, silver: 0.5 },
    def: { dim: 0.3, N: 48, blue: 0, tilt: 0, cy: 0, cz: -4.2, silver: 0 }
  };
  const look = Object.assign({}, LOOK.hero);
  const INK = new THREE.Color(0x03071a), BLUE = new THREE.Color(0x0e3bd0);

  /* ---------- the section objects ---------- */
  const keys3 = () => {
    const object = new THREE.Group();
    const ks = [0, 1, 2].map(() => { const k = createKey({}); const g = new THREE.Group(); g.add(k.object); g.scale.setScalar(0.42); object.add(g); return { k, g }; });
    const HOT = [[-0.62, 0.1, 0, -0.18], [0, 0.15, 0.2, 0], [0.66, 0.06, -0.1, 0.2]], COLD = [[-0.28, -0.42, 0, 1.5708], [0.28, -0.42, 0, 1.5708], [0.74, 0.3, -0.1, 0.22]];
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 0.66), mat.frost({ roughness: 0.42, thickness: 2, attenuationDistance: 1.4 }));
    block.position.set(0, -0.42, 0); object.add(block);
    let m = 0;
    return { object, update(t, s, dt) {
      m += ((window.__sc ? window.__sc.mode : 0) - m) * (1 - Math.exp(-dt * 2.4));
      ks.forEach(({ k, g }, i) => { const a = HOT[i], b = COLD[i]; g.position.set(lerp(a[0], b[0], m), lerp(a[1], b[1], m) + Math.sin(t * 0.4 + i) * 0.02 * (1 - m), lerp(a[2], b[2], m)); g.rotation.set(0, Math.sin(t * 0.25 + i) * 0.1, lerp(a[3], b[3], m)); k.update(t, { split: 0 }); });
      block.scale.setScalar(0.001 + m * 0.999);
    } };
  };
  const MAKE = {
    key: () => {
      const m = createKey({});
      // the hero key gets the homepage shield's glass: clearer, brighter reflections, a faint iridescent edge
      m.object.traverse(o => { if (o.isMesh && o.material && o.material.transmission) Object.assign(o.material, { color: new THREE.Color(0xc4d4ff), roughness: 0.07, thickness: 1.6, attenuationDistance: 1.1, envMapIntensity: 2.2, iridescence: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 }); });
      return { object: m.object, update: (t, p) => m.update(t, { split: 1 - p }), yaw: -0.62, roll: -0.58 };
    },
    'wallet-2': () => { const m = createWallet({}); return { object: m.object, update: (t, p) => m.update(t, { open: p * 0.85 }), yaw: -0.35 }; },
    hsm: () => { const m = createHsm({}); return { object: m.object, update: (t, p) => m.update(t, { active: p }), yaw: -0.4 }; },
    'lock-2': () => { const m = createLock({}); return { object: m.object, update: (t, p) => m.update(t, { locked: p }), yaw: -0.3 }; },
    shield: () => { const m = createShield({ pieces: 3 }); return { object: m.object, update: (t, p) => m.update(t, { split: 1 - p }), yaw: -0.2 }; },
    keys3: () => { const m = keys3(); return { object: m.object, update: m.update, yaw: -0.15 }; },
    logo3d: (el) => { const m = createLogo({ partner: el.dataset.partner }); return { object: m.object, update: (t, p) => m.update(t, { in: p }), yaw: -0.28 }; }
  };
  const slots = [...document.querySelectorAll('[data-model]')].map((el, i) => {
    const m = MAKE[el.dataset.model](el); const g = new THREE.Group(); g.add(m.object); g.visible = false; scene.add(g);
    // measure the assembled object once, so a right-aligned object can put its right edge on the page margin
    m.update(0, 1, 0.016); const size = new THREE.Box3().setFromObject(m.object).getSize(new THREE.Vector3());
    return { el, m, g, born: -1, fit: +(el.dataset.fit || 0.9), i, align: el.dataset.align || '', hw: size.x / 2, hh: size.y / 2, dx: 0 };
  });

  const box3 = new THREE.Box3(), v3 = new THREE.Vector3();
  const t0 = performance.now(); let last = t0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    if (needResize) doResize();
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const time = reduce ? 3 : (now - t0) / 1000;
    const visW = FOV_H * (W / H);
    ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;

    // the curtain follows whichever section holds the middle of the screen
    let best = 'def', bd = 1e9;
    SECS.forEach(([id, el]) => { if (!el) return; const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - H / 2); if (r.top < H / 2 && r.bottom > H / 2 && d < bd) { bd = d; best = LOOK[id] ? id : 'def'; } });
    const tgt = LOOK[best], kk = 1 - Math.exp(-dt * 2.2);
    Object.keys(look).forEach(k => { look[k] += (tgt[k] - look[k]) * kk; });
    dimU.value = look.dim; silverU.value = look.silver; heightMat.uniforms.uN.value = look.N;
    bgCol.copy(INK).lerp(BLUE, clamp(look.blue));
    curtain.position.set(ptr.sx * -0.5, look.cy, look.cz); curtain.rotation.set(look.tilt, 0, 0);

    // each object sits in its slot (it scrolls with the page), plays its moment once, then rests
    slots.forEach(s => {
      const r = s.el.getBoundingClientRect();
      s.g.visible = r.bottom > 0 && r.top < H && r.width > 0;
      if (!s.g.visible) return;
      if (s.born < 0 && r.top < H * 0.78) s.born = time;
      const p = reduce ? 1 : s.born < 0 ? 0 : ease((time - s.born) / 2.6);
      // size the object so its real height fills the slot, then place it (right-aligned slots: right edge on the margin)
      const sc = Math.max(0.0001, Math.min(r.height / H * FOV_H / (2 * s.hh), r.width / W * visW / (2 * s.hw)) * s.fit);
      s.g.scale.setScalar(sc);
      s.g.position.set(((r.left + r.width / 2) / W - 0.5) * visW, (0.5 - (r.top + r.height / 2) / H) * FOV_H, 0);
      s.g.rotation.set(0.08 + ptr.sy * 0.06, (s.m.yaw || 0) + Math.sin(time * 0.2 + s.i) * 0.08 + ptr.sx * 0.12, s.m.roll || 0);
      s.m.update(time, p, dt);
      if (s.align) {            // centre the object as it is actually drawn (after rotation) in its slot
        s.g.position.x += s.dx; s.g.updateMatrixWorld(true);
        if ((s.n = (s.n || 0) + 1) % 6 === 1) {            // the true drawn edge: project the visible vertices themselves
          let maxX = -1e9, minX = 1e9;
          s.g.traverse(o => {
            if (!o.isMesh || !o.visible || !o.geometry.attributes.position) return;
            const pa = o.geometry.attributes.position;
            for (let k = 0; k < pa.count; k += 3) { v3.fromBufferAttribute(pa, k).applyMatrix4(o.matrixWorld).project(camera); const px = (v3.x + 1) / 2 * W; if (px > maxX) maxX = px; if (px < minX) minX = px; }
          });
          s.err = ((s.align === 'right' ? r.right - maxX : (r.left + r.width / 2) - (minX + maxX) / 2)) / W * visW;
        }
        s.dx += (s.err || 0) * 0.3; s.err = (s.err || 0) * 0.7;
      }
    });

    heightMat.uniforms.uT.value = time;
    renderer.setRenderTarget(heightRT); quad.material = heightMat; renderer.render(quadScene, ortho);
    renderer.setRenderTarget(normalRT); quad.material = normalMat; renderer.render(quadScene, ortho);
    renderer.setRenderTarget(null);
    if (taa) taaStep(taa, { camera, scene, W, H, dpr: DPR(), skip: taaSkip, drift: Math.abs(ptr.x - ptr.sx) + Math.abs(ptr.y - ptr.sy) > 0.004 });
    composer.render();
  }
  requestAnimationFrame(frame);
  window.__glReady = true;
}
