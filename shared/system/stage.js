/* The shared WebGL stage for product pages (built from Self-Custody's gl.js, which it reproduces).
   The homepage world: the fixed light curtain behind every section (shared curtain-gl.js, calm.js), bloom, TAA, and
   3D objects that sit in their section slots ([data-model] elements written by the modules), scroll with the page like
   content, play their moment once as they arrive, then rest. Objects never follow the scroll or sit under the nav.

   A page's gl.js is config only:
     import { startStage } from '../shared/system/stage.js';
     startStage({ looks: { cta: { blue: 1 } } });      // optional: curtain look per section id (merged over the defaults)
   Models load by name from shared/models/<name>.js. Each model's "moment" drives its one named state (MOMENT below).
   opts.make: { name: el => ({ object, update(time, p, dt), yaw, roll }) } adds a page's own object, for its one
   signature moment (see PLAYBOOK.md); everything else comes from the model library. */
import * as THREE from 'three';
import { createCurtain } from './curtain-gl.js';
import { calmCurtain } from './calm.js';
import { TAAPass, taaStep } from './taa.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - clamp(t), 3);

// how each model plays its moment as it arrives (p goes 0..1 once): [state, map p -> state value], plus its resting turn
const MOMENT = {
  key: { state: 'split', f: p => 1 - p, yaw: -0.62, roll: -0.58, glass: true },   // the three shares join into one key
  shield: { state: 'split', f: p => 1 - p, yaw: -0.2, opts: { pieces: 3 } },     // the wedges close into the shield
  'orbit-globe': { state: 'open', f: p => 1 - p, yaw: -0.25 },                   // the rings close onto the sphere
  'wallet-2': { state: 'open', f: p => p * 0.85, yaw: -0.35 },
  wallet: { state: 'open', f: p => p * 0.85, yaw: -0.35 },
  hsm: { yaw: -0.4 }, 'lock-2': { yaw: -0.3 }, lock: { yaw: -0.3 }, logo3d: { state: 'in', yaw: -0.28 }
};
const DEF_LOOKS = {
  hero: { dim: 0.95, N: 38, blue: 0, tilt: 0, cy: 0, cz: -4.2, silver: 0 },
  cta: { dim: 0.55, N: 30, blue: 1, tilt: 0, cy: 0, cz: -4.2, silver: 0 },
  news: { dim: 0.6, N: 90, blue: 0.55, tilt: -0.45, cy: -1.3, cz: -3.4, silver: 0 },
  def: { dim: 0.3, N: 48, blue: 0, tilt: 0, cy: 0, cz: -4.2, silver: 0 }
};

export function startStage(opts = {}) {
  try { return run(opts); } catch (e) { console.warn('WebGL unavailable', e); }
}

async function run(opts) {
  const canvas = document.getElementById('gl');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  let pr = 1, soft = false;
  try { const gl0 = renderer.getContext(), ext = gl0.getExtension('WEBGL_debug_renderer_info'); soft = ext && /swiftshader|llvmpipe|software/i.test(gl0.getParameter(ext.UNMASKED_RENDERER_WEBGL)); } catch (e) {}
  if (soft) pr = 0.5;
  const DPR = () => Math.min(devicePixelRatio || 1, 1.5, pr);
  renderer.setPixelRatio(DPR());
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.9;
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  const FOV_H = 2 * 9 * Math.tan(THREE.MathUtils.degToRad(35 / 2));
  const { bgCol, heightRT, normalRT, ortho, heightMat, normalMat, quad, quadScene, dimU, silverU, curtainMat, curtain } = createCurtain({ renderer, scene, soft });
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 4, 6); scene.add(key);
  const kick = new THREE.PointLight(0x4d78ff, 90, 20, 2); kick.position.set(4, -2, 3); scene.add(kick);

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
  const taa = soft ? null : new TAAPass(), taaSkip = new Set([curtain]);
  if (taa) composer.addPass(taa);

  let W = 0, H = 0, needResize = true, dirty = true;
  const doResize = () => {
    needResize = false;
    const w = innerWidth, h = innerHeight;
    if (w === W && Math.abs(h - H) < 140) return;
    W = w; H = h;
    renderer.setPixelRatio(DPR()); renderer.setSize(w, h, false);
    composer.setPixelRatio(DPR()); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  };
  addEventListener('resize', () => { needResize = true; });
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; dirty = true; }, { passive: true });
  doResize();
  document.documentElement.classList.add('gl');

  // the curtain's look per section: it changes mood with the section in the middle of the screen, it never moves an object
  const LOOK = {}; Object.keys(DEF_LOOKS).forEach(k => { LOOK[k] = Object.assign({}, DEF_LOOKS[k]); });
  Object.entries(opts.looks || {}).forEach(([k, v]) => { LOOK[k] = Object.assign({}, LOOK[k] || DEF_LOOKS.def, v); });
  const SECS = [...document.querySelectorAll('main > section[id]')].map(el => [el.id, el]);
  const look = Object.assign({}, LOOK.hero);
  const INK = new THREE.Color(0x03071a), BLUE = new THREE.Color(0x0e3bd0);

  // the section objects: every [data-model] slot gets its model from the library (or a page's own maker)
  const slotEls = [...document.querySelectorAll('[data-model]')];
  const slots = (await Promise.all(slotEls.map(async (el, i) => {
    const name = el.dataset.model;
    let m;
    if (opts.make && opts.make[name]) m = opts.make[name](el);
    else {
      let mod; try { mod = await import(`../models/${name}.js`); } catch (e) { console.warn('model not found:', name); return null; }
      const mo = MOMENT[name] || {}, state = mo.state || Object.keys((mod.meta && mod.meta.states) || {})[0], f = mo.f || (p => p);
      const made = mod.create(Object.assign({ partner: el.dataset.partner }, mo.opts || {}));
      if (mo.glass) made.object.traverse(o => { if (o.isMesh && o.material && o.material.transmission) Object.assign(o.material, { color: new THREE.Color(0xc4d4ff), roughness: 0.07, thickness: 1.6, attenuationDistance: 1.1, envMapIntensity: 2.2, iridescence: 0.35 }); });
      m = { object: made.object, update: (t, p, dt) => made.update(t, state ? { [state]: f(p) } : {}, dt), set: state ? (t, v, dt) => made.update(t, { [state]: v }, dt) : null, rest: f(1), yaw: mo.yaw ?? -0.3, roll: mo.roll || 0 };
    }
    const g = new THREE.Group(); g.add(m.object); g.visible = false; scene.add(g);
    m.update(0, 1, 0.016); const size = new THREE.Box3().setFromObject(m.object).getSize(new THREE.Vector3());
    const pinEl = el.closest('.m-pin');   // a slot in a pinned list: its model answers the list (see frame)
    return { el, m, g, born: -1, fit: +(el.dataset.fit || 0.9), i, align: el.dataset.align || '', hw: Math.max(1e-3, size.x / 2), hh: Math.max(1e-3, size.y / 2), dx: 0, pinEl, act: -1, chg: -9, yawP: 0 };
  }))).filter(Boolean);

  const v3 = new THREE.Vector3();
  const t0 = performance.now(); let last = t0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    if (needResize) doResize();
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const time = reduce ? 3 : (now - t0) / 1000;
    const visW = FOV_H * (W / H);
    ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;

    let best = 'def', bd = 1e9;
    SECS.forEach(([id, el]) => { const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - H / 2); if (r.top < H / 2 && r.bottom > H / 2 && d < bd) { bd = d; best = LOOK[id] ? id : 'def'; } });
    const tgt = LOOK[best], kk = 1 - Math.exp(-dt * 2.2);
    Object.keys(look).forEach(k => { look[k] += (tgt[k] - look[k]) * kk; });
    dimU.value = look.dim; silverU.value = look.silver; heightMat.uniforms.uN.value = look.N;
    bgCol.copy(INK).lerp(BLUE, clamp(look.blue));
    curtain.position.set(ptr.sx * -0.5, look.cy, look.cz); curtain.rotation.set(look.tilt, 0, 0);

    slots.forEach(s => {
      const r = s.el.getBoundingClientRect();
      s.g.visible = r.bottom > 0 && r.top < H && r.width > 0;
      if (!s.g.visible) return;
      if (s.born < 0 && r.top < H * 0.78) s.born = time;
      let p = reduce ? 1 : s.born < 0 ? 0 : ease((time - s.born) / 2.6);
      // pinned list (the homepage's cracked-shield story): as the list advances, the model's own state steps from barely
      // begun to fully transformed, item by item (the shield splits, the ledger grows block by block, the towers light
      // floor by floor), eased between items, and the model turns to each item's own angle
      const pin = s.pinEl && s.pinEl.__pin;
      let story = false;
      if (pin && !reduce) {
        const n = Math.max(1, pin.count || 1), k = pin.active;
        const tgt = k < 0 ? 0 : ((n > 1 ? k / (n - 1) : 0.5) - 0.5) * 1.2;
        s.yawP += (tgt - s.yawP) * (1 - Math.exp(-dt * 2.6));
        if (s.m.set && k >= 0) {
          if (s.pinV == null) s.pinV = s.m.rest;
          const v = n > 1 ? 0.15 + 0.85 * k / (n - 1) : 1;
          s.pinV += (v - s.pinV) * (1 - Math.exp(-dt * 2.2)); story = true;
        }
      }
      const sc = Math.max(0.0001, Math.min(r.height / H * FOV_H / (2 * s.hh), r.width / W * visW / (2 * s.hw)) * s.fit);
      s.g.scale.setScalar(sc);
      s.g.position.set(((r.left + r.width / 2) / W - 0.5) * visW, (0.5 - (r.top + r.height / 2) / H) * FOV_H, 0);
      s.g.rotation.set(0.08 + ptr.sy * 0.06, (s.m.yaw || 0) + s.yawP + Math.sin(time * 0.2 + s.i) * 0.08 + ptr.sx * 0.12, s.m.roll || 0);
      if (story) s.m.set(time, s.pinV, dt); else s.m.update(time, p, dt);
      if (s.align) {   // centre the object as it is actually drawn (after rotation) in its slot
        s.g.position.x += s.dx; s.g.updateMatrixWorld(true);
        if ((s.n = (s.n || 0) + 1) % 6 === 1) {
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
