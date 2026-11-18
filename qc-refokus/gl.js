/* Qualified Custody: the homepage's fixed WebGL scene (metal light curtain + glass BitGo shield), retold for custody.
   The shield is three keys that close into one: they assemble in the hero, stand apart for Multi-Sig and MPC,
   freeze into one silvered piece for Cold Storage, glow whole for Insurance, and close again at the call to action.
   The canvas is never hidden or resized by scroll, so nothing can flash. */
import * as THREE from 'three';
import { createCurtain } from '../shared/system/curtain-gl.js';   // the shared curtain module
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { calmCurtain } from '../shared/system/calm.js';   // calmer curtain presets (?calm=1..3)
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { TAAPass, taaStep } from '../shared/system/taa.js';
import { wedgeSet, wholeGeo } from './shield.js';
import { buildKey } from './key.js';

const canvas = document.getElementById('gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

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

  /* ---------- the BitGo shield: whole, five pieces, three pieces ---------- */
  const gObj = new THREE.Group(); scene.add(gObj);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x9db8ff, metalness: 0, roughness: 0.05, transmission: 1, thickness: 1.2, ior: 1.52,
    attenuationColor: new THREE.Color(0x1238d8), attenuationDistance: 0.55, clearcoat: 1, clearcoatRoughness: 0.03,
    iridescence: 0.45, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 620], envMapIntensity: 1.8,
    emissive: new THREE.Color(0x2f63ff), emissiveIntensity: 0, specularIntensity: 1
  });
  const rnd = (i, s) => { const x = Math.sin(s * 91.7 + i * 12.3) * 43758.5; return x - Math.floor(x); };
  const makeSet = (geos) => geos.map((g, i) => {
    const mat = glass.clone(); mat.transparent = true;
    const mesh = new THREE.Mesh(g.geo, mat);
    const pivot = new THREE.Group(); pivot.add(mesh); pivot.visible = false; gObj.add(pivot);
    const dir = new THREE.Vector3(g.dir.x, g.dir.y, 0);
    return {
      pivot, mesh, dir, lift: 0, glow: 0, delay: i * 0.13,
      from: { p: dir.clone().multiplyScalar(5.5).add(new THREE.Vector3((rnd(i, 1) - .5) * 3, (rnd(i, 2) - .5) * 3, 3 + rnd(i, 3) * 4)), r: new THREE.Euler((rnd(i, 4) - .5) * 5, (rnd(i, 5) - .5) * 5, (rnd(i, 6) - .5) * 4) }
    };
  });
  const sets = {
    whole: makeSet([{ geo: wholeGeo(), dir: { x: 0, y: 0 } }]),
    three: makeSet(wedgeSet(3, Math.PI / 2 - Math.PI / 3))
  };
  let curSet = 'three';
  sets.three.forEach(p => { p.pivot.visible = true; });

  /* the key: three glass fragments (bow, shaft, bit) that take over from the shield in the accordion */
  const keyGroup = new THREE.Group(); keyGroup.visible = false; scene.add(keyGroup);
  const keyParts = buildKey().map((g, i) => {
    const mat = glass.clone(); mat.transparent = true; mat.opacity = 0;
    const mesh = new THREE.Mesh(g.geo, mat);
    const pivot = new THREE.Group(); pivot.add(mesh); keyGroup.add(pivot);
    return { pivot, mesh, dir: new THREE.Vector3(g.dir.x, g.dir.y, 0), spin: g.spin, glow: 0 };
  });

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

  /* ---------- section choreography ---------- */
  const IDS = ['hero', 'trust', 'badges', 'intro', 'keys', 'eco', 'guide', 'global', 'wallet', 'since', 'faq', 'latest', 'cta', 'news'];
  const EL = Object.fromEntries(IDS.map(i => [i, $(i)]));
  const SEE = IDS;   // every section is transparent: the curtain shows behind all of them
  const INK = new THREE.Color(0x03071a), INK2 = new THREE.Color(0x060d2e), BLUE = new THREE.Color(0x0e3bd0);
  const logos = () => [...document.querySelectorAll('#trust .mq-t img')];
  let logoEls = [];

  const base = { x: .2, y: .02, s: .3, expl: 0, glow: 0, dim: 1, N: 38, tilt: 0, yaw: 0, cy: 0, cz: -4.2, rz: 0, silver: 0, blue: 0, ry: 0, bg2: 0, speed: 1, frost: 0, key: 0, kx: 0, kglow: 0, vis: 1 };
  const KEYS = Object.keys(base);
  // each pose gives only what differs from base; `mode` decides which set of pieces is on show
  function poseFor(id, r, ctx) {
    const { m, active } = ctx;
    switch (id) {
      case 'hero': { const p = clamp(-r.top / H), sl = document.querySelector('#hero .mh-slot'), q = sl && sl.getBoundingClientRect();
        if (!q || !q.width) return { mode: p < .03 ? 'whole' : 'three', x: m ? 0 : .2, y: (m ? .18 : .02) + p * .22, s: m ? .34 : .3, dim: .9, expl: p * .9 };
        // centred in the hero slot like Self-Custody's key; 2.48 = the shield's height per unit of s, in viewport heights
        const s = Math.min(q.height / H / 2.48, q.width / H / 2.1) * .9;
        return { mode: p < .03 ? 'whole' : 'three', x: (q.left + q.width / 2) / W - .5, y: .5 - (q.top + q.height / 2) / H, s, dim: .9, expl: p * .9 }; }   // same pose as the homepage hero
      case 'trust': { const t = clamp((H * .55 - r.top) / r.height); return { mode: 'whole', x: lerp(-.36, .36, t) * (m ? .6 : 1), y: -.3, s: m ? .16 : .14, glow: 1, dim: .13, N: 64, tilt: -.5, cy: -1.2, cz: -3.6, ry: .9 }; }
      case 'badges': return { mode: 'whole', x: m ? 0 : .27, y: m ? .26 : .02, s: m ? .2 : .26, dim: .08, N: 16, yaw: .35, glow: .25, ry: -.6 };
      case 'intro': return { mode: 'three', x: 0, y: m ? .1 : .02, s: m ? .3 : .3, expl: .4, dim: .14, N: 30, glow: .15, ry: 0 };
      case 'keys': {
        const sx = m ? 0 : -.2, sy = m ? .22 : 0, ks = m ? .27 : .28;
        if (active === 0) return { mode: 'three', x: sx, y: sy, s: ks, key: 1, kx: 1, kglow: .9, dim: .3 };
        if (active === 1) return { mode: 'whole', x: sx, y: sy, s: ks, key: 1, kx: .08, dim: .3, frost: 1 };
        if (active === 2) return { mode: 'whole', x: sx, y: sy, s: ks, key: 1, kx: 0, kglow: 1, dim: .3 };
        return { mode: 'three', x: m ? 0 : -.14, y: sy, s: ks, key: 1, kx: .55, dim: .3 };
      }
      // after the accordion the key fades out, and nothing returns until Since 2013
      case 'eco': return { mode: 'whole', x: m ? 0 : -.2, y: m ? .22 : 0, s: m ? .27 : .28, key: 1, vis: 0, dim: .4, N: 26, blue: 1 };
      case 'guide': return { mode: 'whole', x: m ? .1 : .2, y: 0, s: m ? .3 : .34, key: 1, vis: 0, dim: .55, N: 34 };
      case 'since': return { mode: 'whole', x: 0, y: m ? -.05 : -.02, s: m ? .2 : .22, dim: .16, N: 60, silver: .35, glow: .2, ry: 0 };
      // Local Expertise, wallet, FAQs, The Latest: the curtain shows, the shield stays out of the way
      case 'global': case 'wallet': case 'faq': case 'latest': return { mode: 'whole', x: 0, y: 0, s: .0001, expl: 0, dim: .3 };
      case 'news': return { mode: 'whole', vis: 0, x: m ? 0 : .24, y: m ? .9 : .85, s: m ? .34 : .36, dim: .6, N: 90, blue: .55, tilt: -.45, cy: -1.3, cz: -3.4 };   // the shield rises away with the call to action
      case 'cta': { const t = clamp((H * .75 - r.top) / (r.height * .8)); return { mode: t > .985 ? 'whole' : 'three', x: m ? 0 : .24, y: m ? .22 : 0, s: m ? .34 : .36, expl: 1.2 * (1 - sm(0, 1, t)), dim: .4, N: 30, blue: 1, glow: .5 * sm(.7, 1, t) }; }
      default: return { mode: 'whole', x: 0, y: 0, s: .0001, expl: 0, dim: .3 };    // no pose given: shield out of the way
    }
  }

  const cur = Object.assign({}, base, { s: .3 });
  const ease = t => 1 - Math.pow(1 - t, 4);
  const back = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const t0 = performance.now(); let last = t0, lastR = 0;
  const dv = new THREE.Vector3(), tmpC = new THREE.Color();
  const sx = { x: 0, y: 0 };
  let pend = null, cT = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    if (needResize) doResize();
    if (soft && now - lastR < 900) return;
    lastR = now;
    const dt = Math.min(soft ? 0.5 : 0.05, (now - last) / 1000); last = now;
    const time = reduce ? 2.6 : (now - t0) / 1000;

    const rects = {}; let see = false;
    IDS.forEach(i => { rects[i] = EL[i].getBoundingClientRect(); });
    SEE.forEach(i => { const r = rects[i]; if (r.bottom > -20 && r.top < H + 20) see = true; });
    const aspect = W / H, visW = FOV_H * aspect, m = aspect < 0.9, Sunit = Math.min(FOV_H, visW * 0.95);
    const active = window.__keys ? window.__keys.active : -1;

    // blend poses by how much of the middle band of the screen each section holds
    const b0 = H * .4, b1 = H * .6; const acc = {}; KEYS.forEach(k => acc[k] = 0); let tw = 0; const modeW = {};
    IDS.forEach(id => {
      const r = rects[id]; const w = Math.max(0, Math.min(r.bottom, b1) - Math.max(r.top, b0)); if (w <= 0) return;
      const p = Object.assign({}, base, poseFor(id, r, { m, active }));
      KEYS.forEach(k => acc[k] += p[k] * w); tw += w; modeW[p.mode] = (modeW[p.mode] || 0) + w;
    });
    if (tw <= 0) { KEYS.forEach(k => acc[k] = cur[k]); tw = 1; modeW[curSet] = 1; }
    const tgt = {}; KEYS.forEach(k => tgt[k] = acc[k] / tw);
    let mode = Object.keys(modeW).sort((a, b) => modeW[b] - modeW[a])[0];
    // colour of the world behind everything
    
    const intro = reduce ? 99 : time;
    const introDone = intro > 3.2;
    if (!introDone) mode = 'three';
    if (mode !== curSet) {
      if (cur.expl < 0.02 && introDone) {      // pieces are back together: swap sets without a visible jump
        Object.values(sets).flat().forEach(p => { p.pivot.visible = false; });
        curSet = mode; sets[curSet].forEach(p => { p.pivot.visible = true; p.lift = 0; });
      } else tgt.expl = 0;
    }
    if (curSet === 'whole') tgt.expl = 0;

    const kk = see ? 1 - Math.exp(-dt * 3.4) : 1;
    KEYS.forEach(k => { if (k === 'expl') return; cur[k] = reduce ? tgt[k] : cur[k] + (tgt[k] - cur[k]) * kk; });
    // pieces coming apart or together: two chained smoothings give an S-curve, so they slide rather than snap (same as the homepage)
    const kEx = see ? 1 - Math.exp(-dt * 2.6) : 1;
    cur.expl1 = cur.expl1 === undefined ? cur.expl : cur.expl1;
    cur.expl1 = reduce ? tgt.expl : cur.expl1 + (tgt.expl - cur.expl1) * kEx;
    cur.expl = reduce ? tgt.expl : cur.expl + (cur.expl1 - cur.expl) * kEx;
    ptr.sx += (ptr.x - ptr.sx) * kk * .6; ptr.sy += (ptr.y - ptr.sy) * kk * .6;
    const expl = curSet === 'whole' ? 0 : cur.expl;

    if (!see) { return; }                                   // covered by opaque sections: poses are snapped, nothing drawn
    if (reduce && !dirty) return;
    dirty = false;

    gObj.position.set(cur.x * visW, cur.y * FOV_H, 0);
    const km = clamp(cur.key), ke = km * km * (3 - 2 * km), vv = clamp(cur.vis), ve = vv * vv * (3 - 2 * vv);
    gObj.scale.setScalar(Math.max(.0001, cur.s * Sunit * (1 - ke) * (.7 + .3 * ve)));
    gObj.visible = ke < .995 && ve > .01;
    gObj.rotation.y = Math.sin(time * 0.5) * 0.26 + ptr.sx * 0.35 + cur.ry * Math.sin(time * .3 + 1) * .5 + cur.ry * .3;
    gObj.rotation.x = ptr.sy * 0.2 + Math.sin(time * 0.37) * 0.05;
    gObj.rotation.z = Math.sin(time * 0.23) * 0.04;
    dimU.value = cur.dim; silverU.value = clamp(cur.silver);
    heightMat.uniforms.uN.value = cur.N;
    cT += dt * cur.speed;
    for (const pc of Object.values(sets).flat()) { pc.mesh.material.roughness = lerp(.05, .32, cur.frost); pc.mesh.material.iridescence = lerp(.45, .05, cur.frost); }
    bgCol.copy(INK).lerp(BLUE, clamp(cur.blue));
    curtain.position.set(ptr.sx * -0.5, cur.cy, cur.cz);
    curtain.rotation.set(cur.tilt, cur.yaw, cur.rz);

    keyGroup.visible = ke * ve > .005;
    if (keyGroup.visible) {
      keyGroup.position.set(cur.x * visW, cur.y * FOV_H, .4);
      keyGroup.scale.setScalar(Math.max(.0001, cur.s * Sunit * .74 * (.55 + .45 * ke) * (.7 + .3 * ve)));
      keyGroup.rotation.set(ptr.sy * .2 + Math.sin(time * .37) * .06, Math.sin(time * .45) * .38 + ptr.sx * .35 + (1 - ke) * 1.6, .3 + Math.sin(time * .23) * .04);
      keyParts.forEach((kp, i) => {
        const x = cur.kx, away = (1 - ke);
        kp.pivot.position.copy(kp.dir).multiplyScalar(x * .62 + away * 1.8);
        kp.pivot.position.z = away * 2.2 * (i - 1) + x * .25 * (i - 1);
        kp.pivot.rotation.set(kp.spin * .5 * x, kp.spin * .7 * x, kp.spin * x + away * kp.spin * 3);
        const g = cur.kglow * (.5 + .5 * Math.max(0, Math.sin(time * 1.3 - i * 2.09)));
        kp.glow += (g - kp.glow) * kk * 1.2;
        const mt = kp.mesh.material;
        mt.emissiveIntensity = kp.glow * .55; mt.opacity = ke * ve;
        mt.roughness = lerp(.05, .32, cur.frost); mt.iridescence = lerp(.45, .05, cur.frost);
        mt.attenuationDistance = lerp(.55, .3, clamp(kp.glow));
      });
    }
    const set = sets[curSet];
    set.forEach((pc, i) => {
      const u = curSet === 'three' ? clamp((intro - 0.15 - pc.delay) / 1.6) : 1;
      const e = sm(0, 1, u), eo = sm(0, 1, u), f = 1 - eo;   // intro assembly: ease in and out, no overshoot
      const lt = 0;
      pc.lift += (lt - pc.lift) * kk * 1.3;
      const gl = cur.glow * (curSet === 'whole' ? 1 : .6 + .4 * Math.max(0, Math.sin(time * 1.3 - i * 2.09)));
      pc.glow += (gl - pc.glow) * kk * 1.2;
      const spread = curSet === 'three' ? 1.5 : 0.9;
      dv.copy(pc.dir).multiplyScalar(expl * spread + pc.lift * 0.26);
      if (curSet === 'three') dv.y += (i - 1) * expl * .35;
      pc.pivot.position.copy(dv).addScaledVector(pc.from.p, f);
      pc.pivot.position.z += pc.lift * 0.55;
      pc.pivot.rotation.set(pc.from.r.x * f, pc.from.r.y * f, pc.from.r.z * f);
      pc.pivot.scale.setScalar(lerp(0.4, 1, e) * (1 + pc.lift * 0.05));
      pc.mesh.material.emissiveIntensity = pc.glow * 0.5;
      pc.mesh.material.opacity = (1 - ke) * ve;
      pc.mesh.material.attenuationDistance = lerp(0.55, 0.3, clamp(pc.glow));
    });

    // client logos: lit by the shield as it passes behind them
    const tr = rects.trust;
    if (tr.bottom > 0 && tr.top < H) {
      if (!logoEls.length) logoEls = logos();
      sx.x = (gObj.position.x / visW + .5) * W; sx.y = (.5 - gObj.position.y / FOV_H) * H;
      logoEls.forEach(img => {
        const r = img.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = (cx - sx.x) / (W * .2), dy = (cy - sx.y) / (H * .55);
        img.style.setProperty('--l', Math.exp(-(dx * dx + dy * dy)).toFixed(3));
      });
    }

    // never under the nav: keep the top of every object a clear gap below it, whatever the pose or the float
    const navTop = FOV_H / 2 - (84 + 36) / H * FOV_H, botEdge = -FOV_H / 2 + 24 / H * FOV_H;
    const keepClear = (o, half) => { if (!o || !o.visible) return; if (o.position.y + half > navTop) o.position.y = navTop - half; if (o.position.y - half < botEdge && half * 2 < navTop - botEdge) o.position.y = Math.max(o.position.y, botEdge + half); };
    keepClear(gObj, gObj.scale.x * (1.05 + (curSet === 'whole' ? 0 : cur.expl * 0.9)));
    if (typeof keyGroup !== 'undefined') keepClear(keyGroup, keyGroup.scale.x * 1.45);
    if (typeof walletGroup !== 'undefined') keepClear(walletGroup, walletGroup.scale.x * 1.05);
    if (typeof keys3Group !== 'undefined') keepClear(keys3Group, keys3Group.scale.x * 1.25);
    const f0 = performance.now();
    heightMat.uniforms.uT.value = reduce ? time : cT;
    renderer.setRenderTarget(heightRT); quad.material = heightMat; renderer.render(quadScene, ortho);
    renderer.setRenderTarget(normalRT); quad.material = normalMat; renderer.render(quadScene, ortho);
    renderer.setRenderTarget(null);
    if (taa) taaStep(taa, { camera, scene, W, H, dpr: DPR(), skip: taaSkip, drift: Math.abs(ptr.x - ptr.sx) + Math.abs(ptr.y - ptr.sy) > 0.004 });
    composer.render();
    window.__cost = Math.round(cost);
    cost = cost * 0.7 + (performance.now() - f0) * 0.3;
    if (cost > 220 && ++slow > 3) { slow = 0; if (bloom.enabled) bloom.enabled = false; else if (pr > 0.55) { pr = Math.max(0.55, pr - 0.2); needResize = true; W = 0; } }
  }
  requestAnimationFrame(frame);
  window.__glReady = true;
}
