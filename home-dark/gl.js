/* One fixed WebGL scene for the whole page: a metal light curtain (height RT -> normal RT -> displaced metal plane)
   and one glass BitGo shield that changes job per section: whole in the hero, sweeping behind the client logos,
   five pieces for the Core services, three for Build, back to one at the closing call to action.
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
import { create as createOrbitGlobe } from '../shared/models/orbit-globe.js';   // 24/7 Support

const canvas = document.getElementById('gl');
// overlay for the end-of-'Innovation' dissolve: the finished shield breaks up into drifting 0s and 1s (drawn in 2D, above the 3D, below the page)
const dz = document.createElement('canvas'); dz.setAttribute('aria-hidden', 'true');
dz.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0';
canvas.after(dz); const dg = dz.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };   // smootherstep: slower start and finish

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
  const { bgCol, heightRT, normalRT, ortho, heightMat, normalMat, quad, quadScene, dimU, silverU, paleU, curtainMat, curtain } = createCurtain({ renderer, scene, soft });
  // the hero's curtain in black (home-dark): the same curtain as dark satin, its folds caught in soft grey light; the
  // closing curtain keeps the blue. hb (0..1) blends the material, by how much of the hero is on screen
  const CUR0 = { c: curtainMat.color.clone(), e: curtainMat.emissive.clone(), ei: curtainMat.emissiveIntensity, env: curtainMat.envMapIntensity };
  const CURB = { c: new THREE.Color(0x0d0e11), e: new THREE.Color(0, 0, 0), ei: 0, env: 0.5 };   // near-black metal; its folds catch neutral light (silver mode)

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
    const mesh = new THREE.Mesh(g.geo, glass.clone());
    const pivot = new THREE.Group(); pivot.add(mesh); pivot.visible = false; gObj.add(pivot);
    const dir = new THREE.Vector3(g.dir.x, g.dir.y, 0);
    return {
      pivot, mesh, dir, lift: 0, glow: 0, delay: i * 0.13,
      from: { p: dir.clone().multiplyScalar(5.5).add(new THREE.Vector3((rnd(i, 1) - .5) * 3, (rnd(i, 2) - .5) * 3, 3 + rnd(i, 3) * 4)), r: new THREE.Euler((rnd(i, 4) - .5) * 5, (rnd(i, 5) - .5) * 5, (rnd(i, 6) - .5) * 4) }
    };
  });
  const sets = {
    whole: makeSet([{ geo: wholeGeo(), dir: { x: 0, y: 0 } }]),
    five: makeSet(wedgeSet(5, Math.PI / 2 - Math.PI / 5)),
    three: makeSet(wedgeSet(3, Math.PI / 2 - Math.PI / 3))
  };
  let curSet = 'five';
  sets.five.forEach(p => { p.pivot.visible = true; });

  /* core glow: "Technology at our core." A light at the heart of the split shield, shown only in the Core section;
     it fades in as the shield splits and fades out as you scroll on to the next module */
  const coreG = new THREE.Group(); gObj.add(coreG);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x7fa2ff, toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
  const coreShield = new THREE.Mesh(wholeGeo(), coreMat);    // the shield's own shape, lit from inside: it shows through the seams
  coreShield.scale.set(.94, .94, .45);
  const coreLight = new THREE.PointLight(0x4d78ff, 0, 0, 2);
  coreG.add(coreShield, coreLight); coreG.visible = false;

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
  const IDS = ['hero', 'trust', 'badges', 'core', 'established', 'build', 'support', 'own', 'spotlight', 'latest', 'cta', 'news', 'footer'];
  const EL = Object.fromEntries(IDS.map(i => [i, $(i)]));
  const SEE = IDS;   // one world: the curtain shows behind every section (pale behind 'The future of finance')
  const PAPER = new THREE.Color(0x6f86e6), INK = new THREE.Color(0x03071a), INK2 = new THREE.Color(0x060d2e), BLUE = new THREE.Color(0x0e3bd0), BLACK = new THREE.Color(0x000000);
  const heroEl = document.getElementById('hero'), closeEl = document.getElementById('cta');
  // hero play (home-dark): click the shield and it breaks apart into its pieces, then comes back together; drag it and it
  // follows the cursor and spins, then springs home with its momentum. Only on the shield itself (a ray against its
  // geometry), only while the hero holds the screen, and never over a link or button.
  const play = { burstAt: -99, drag: false, px: 0, py: 0, x0: 0, y0: 0, tx: 0, ty: 0, sx: 0, sy: 0, moved: 0 };   // tx/ty: the tilt target (-1..1), sx/sy: smoothed
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), nowS = () => performance.now() / 1000;
  const heroOn = () => { const r = heroEl && heroEl.getBoundingClientRect(); return !!r && r.bottom > innerHeight * .55; };
  const hitShield = (x, y) => { if (!sets || !sets[curSet]) return false; ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(sets[curSet].filter(p => p.pivot.visible).map(p => p.mesh), false).length > 0; };
  addEventListener('pointerdown', e => {
    if (reduce || e.button !== 0 || !heroOn() || e.target.closest('a,button,input,select,textarea,label,[role=button]')) return;
    if (!hitShield(e.clientX, e.clientY)) return;
    play.drag = true; play.px = play.x0 = e.clientX; play.py = play.y0 = e.clientY; play.moved = 0;
    e.preventDefault(); document.documentElement.style.cursor = 'grabbing';
  }, { passive: false });
  addEventListener('pointermove', e => {
    if (play.drag) {
      const dx = e.clientX - play.px, dy = e.clientY - play.py; play.px = e.clientX; play.py = e.clientY; play.moved += Math.abs(dx) + Math.abs(dy);
      // drag: the same subtle tilt the hover used to give (at most ~20 degrees across, ~11 up and down), never a free spin
      play.tx = clamp((e.clientX - play.x0) / (innerWidth * .35), -1, 1); play.ty = clamp((e.clientY - play.y0) / (innerHeight * .35), -1, 1); dirty = true; return;
    }
    if (e.pointerType === 'mouse' && heroOn() && !e.target.closest('a,button')) document.documentElement.style.cursor = hitShield(e.clientX, e.clientY) ? 'grab' : '';
  }, { passive: true });
  addEventListener('pointerup', () => {
    if (!play.drag) return; play.drag = false; play.tx = play.ty = 0; document.documentElement.style.cursor = '';   // let go: it eases back
    if (play.moved < 6) play.burstAt = nowS();   // a click, not a drag: break apart
  }, { passive: true });
  const logos = () => [...document.querySelectorAll('#trust .mq-t img')];
  let logoEls = [];

  const base = { fade: 1, lock: 0, exit: 0, land: 0, build: 0, fit: 0, pale: 0, core: 0, x: .2, y: .02, s: .3, expl: 0, glow: 0, dim: 1, N: 38, tilt: 0, yaw: 0, cy: 0, cz: -4.2, rz: 0, silver: 0, blue: 0, ry: 0, bg2: 0 };
  const KEYS = Object.keys(base);
  // each pose gives only what differs from base; `mode` decides which set of pieces is on show
  // Support -> 'The future of finance': the shield moves the whole time you scroll, from the Support column (once Support is
  // centred) to the pinned 3D spot of the next section, arriving exactly when that spot pins. Progress is linear in scroll.
  // Hero -> logos -> badges -> core column: one path tied to the scroll. The shield stays whole and visible, eases into the badges
  // spot (badges centred on screen), then eases on into the core column, arriving exactly as that column pins.
  const coreHasPinned = () => { const tr = document.getElementById('coreTrack'); return !tr || tr.getBoundingClientRect().top <= 0; };
  function chain(m) {
    const sy = scrollY, bR = EL.badges.getBoundingClientRect(), tr = document.getElementById('coreTrack');
    const b = Math.max(1, bR.top + sy + bR.height / 2 - H / 2), c = Math.max(b + 1, tr.getBoundingClientRect().top + sy);
    const cv = document.querySelector('.core-vis'), cq = cv && cv.getBoundingClientRect();
    const tx = m || !cq || !cq.width ? 0 : (cq.left + cq.width / 2) / W - .5, off = cq && cq.height ? .5 - (cq.top + cq.height / 2) / H : 0;
    const P0 = { x: m ? 0 : .2, y: m ? .18 : .02, s: m ? .34 : .3, dim: .9, N: 38, glow: 0, ry: 0, yaw: 0, expl: 0 };
    const P1 = { x: m ? 0 : .27, y: m ? .26 : .02, s: m ? .2 : .26, dim: .3, N: 16, glow: .25, ry: -.6, yaw: .35, expl: 0 };
    const hd = document.querySelector('#core h2'), hR = hd && hd.getBoundingClientRect();
    const h = hR ? Math.min(c - 1, Math.max(b + 1, hR.top + sy + hR.height / 2 - H / 2)) : (b + c) / 2;   // scroll where 'Technology at Our Core' is centred
    const PH = { x: m ? 0 : .2, y: m ? .2 : 0, s: m ? .32 : .27, dim: .3, N: 40, glow: .25, ry: 0, yaw: 0, expl: .15 };   // to the right of the heading, open
    const P2 = { x: tx, y: (m ? .2 : -.05),   /* where the column will be once pinned, not where it is now: no dive */ s: m ? .3 : .26, dim: .3, N: 40, glow: 0, ry: 0, yaw: 0, expl: .1 };
    const mix = (A, B, t) => { const o = {}; for (const k in A) o[k] = lerp(A[k], B[k], t); return o; };
    if (sy <= b) return Object.assign(mix(P0, P1, ss(0, 1, sy / b)), { mode: 'whole', lock: 1 });
    if (sy <= h) { const t = ss(0, 1, clamp((sy - b) / (h - b))); return Object.assign(mix(P1, PH, t), { mode: t > .02 ? 'five' : 'whole', lock: 1, core: 1 }); }
    const t = ss(0, 1, clamp((sy - h) / (c - h)));   // then on into the column, arriving as it pins
    return Object.assign(mix(PH, P2, t), { mode: 'five', lock: 1, core: 1, fit: t });
  }
  function afterCore(m, id) {
    // after Crypto-as-a-Service the shield stays with its column and scrolls away with it; once gone it waits, hidden,
    // in Support's spot and grows in there when Support arrives (no travelling across the screen)
    const cv = document.querySelector('.core-vis'), cq = cv && cv.getBoundingClientRect();
    if (cq && cq.width) {
      if (cq.bottom > 0) { if (coreGone) { coreGone = false; snapNow = true; } }   // scrolled back up to the column: rejoin it unseen
      else if (!coreGone && offscreen(cur)) coreGone = true;                          // left with the column: from now on it waits for Support
    }
    if ((id === 'established' || id === 'build') && cq && cq.width && !coreGone) return { mode: 'five', core: 1, lock: 1, fit: 1, exit: 1, x: m ? 0 : (cq.left + cq.width / 2) / W - .5, y: (m ? .2 : -.05) + .5 - (cq.top + cq.height / 2) / H, s: m ? .3 : .26, dim: .3, expl: .1, N: 40 };
    // gone off the top: it is moved, unseen, to Support's spot and rides up with that section, as if it had waited there all along
    return ownAnchor() || { mode: 'whole', x: 0, y: -2, s: .0001, fade: 0, dim: .3 };   // waits, invisible, in the next section's spot
  }
  // Support -> 'The future of finance': no flight across the page. The Support shield rides with its section and scrolls off;
  // once it is out of view the shield is moved, unseen, into the 3D spot of the next section, which brings it up from below.
  // It splits apart as that spot rises, and each item brings its piece home as you reach it. Everything follows the scroll.
  // 0 while 'Innovation' (the last item) is centred, 1 once it has scrolled most of the way up
  const dissolveP = () => { const its = document.querySelectorAll('#own .mp-item'), last = its[its.length - 1]; if (!last) return 0;
    const r = last.getBoundingClientRect(); return clamp((H * .5 - (r.top + r.height / 2)) / (H * .6)); };   // 0 as 'Innovation' passes the middle, 1 once it is past the top
  function ownAnchor() {
    const st = document.querySelector('#own .own-stack'), v = document.querySelector('#own .own-vis');
    if (!st || !v) return null;
    const q = st.getBoundingClientRect(), g = v.getBoundingClientRect().top;
    const split = g <= 0 ? 1 : ss(0, 1, clamp((H - q.top) / (H - q.top + g)));   // 0 as the spot enters, 1 as it pins
    // level with the first item ('Transparency') as it comes up; it stops where the 3D spot pins and waits there while the items pass
    // ...and at the end it is level with the last item ('Innovation') and rides up with it while it dissolves
    const its = document.querySelectorAll('#own .mp-item'), ir = its[0] && its[0].getBoundingClientRect(), lr = its.length && its[its.length - 1].getBoundingClientRect();
    const pinC = q.top + q.height / 2 - Math.max(0, g);
    const pinFix = q.top + q.height / 2 - g;   // the pinned spot, even after the column starts to scroll away
    const c = ir ? Math.max(ir.top + ir.height / 2, Math.min(pinFix, lr.top + lr.height / 2)) : q.top + q.height / 2;   // at the end: level with 'Innovation', riding up with it while it dissolves
    const fade = Math.min(ss(0, 1, clamp((H * 1.05 - c) / (H * .45))), 1 - ss(.04, .5, dissolveP()));   // fades in under the headline; dissolves after 'Innovation'
    const dp = dissolveP();
    return { mode: 'five', build: 1, lock: 1, fade, land: split, glow: .3 + 1.1 * Math.sin(Math.PI * clamp(dp * 2.4)), exit: q.top < 90 ? 1 : 0, x: (q.left + q.width / 2) / W - .5, y: .5 - c / H, s: .42 * q.height / H, expl: 0, dim: .3, N: 38 };
  }
  let coreGone = false, snapNow = false;
  const offscreen = o => Math.abs(o.y) > .5 + o.s * 1.25;
  function journey(m) {
    const from = { mode: 'whole', lock: 1, x: m ? 0 : .2, y: m ? .26 : 0, s: m ? .2 : .26, dim: .3, N: 24, glow: .5, ry: -.4 };
    const sr = EL.support.getBoundingClientRect(), v = document.querySelector('#own .own-vis'), st = document.querySelector('#own .own-stack');
    if (!v || !st) return { t: 0, from, pose: from };
    const a = H / 2 - (sr.top + sr.height / 2), g = v.getBoundingClientRect().top;
    const t = a <= 0 ? 0 : g <= 0 ? 1 : clamp(a / (a + g)), e = ss(0, 1, t), q = st.getBoundingClientRect();
    const to = { x: (q.left + q.width / 2) / W - .5, y: .5 - (q.top + q.height / 2 - Math.max(0, g)) / H, s: .42 * q.height / H };   // the spot's pinned place: no dive
    const pose = Object.assign({}, from, { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e), s: lerp(from.s, to.s, e), glow: lerp(.5, .3, e), ry: lerp(-.4, 0, e), N: lerp(24, 38, e) });
    return { t, from, pose };
  }
  function poseFor(id, r, ctx) {
    const { m, active } = ctx;
    switch (id) {
      case 'hero': case 'trust': case 'badges': return chain(m);
      case 'core': {
        if (!coreHasPinned()) return chain(m);
        const cv = document.querySelector('.core-vis'), cq = cv && cv.getBoundingClientRect();   // centred in the 50/50 visual column
        const tx = m || !cq || !cq.width ? 0 : (cq.left + cq.width / 2) / W - .5, ty = m ? .2 : -.05;   // a touch below centre
        const off = cq && cq.height ? .5 - (cq.top + cq.height / 2) / H : 0;   // 0 while the column is pinned; follows it before and after
        // on the way in the shield travels with the scroll from its heading pose into the column, arriving exactly as the column pins
        const tr = document.getElementById('coreTrack'), q = tr ? tr.getBoundingClientRect() : null;
        const t = q ? sm(0, 1, clamp((H - q.top) / H)) : 1;
        return { mode: 'five', core: 1, lock: 1, fit: t, exit: off > .01 ? 1 : 0, x: lerp(m ? 0 : .2, tx, t), y: lerp(m ? .2 : 0, ty + Math.max(0, off), t), s: lerp(m ? .32 : .27, m ? .3 : .26, t), dim: .3, expl: lerp(.15, .1, t), N: 40 };
      }
      case 'established': case 'build': return afterCore(m, id);
      case 'support': return afterCore(m, 'support');   // Support has its own UI art: no shield here
      case 'cta': { const t = clamp((H * .75 - r.top) / (r.height * .8)); return { mode: t > .985 ? 'whole' : 'five', x: m ? 0 : .24, y: m ? .22 : 0, s: m ? .22 : .22, expl: 1.2 * (1 - sm(0, 1, t)), dim: .55, N: 30, silver: 0, blue: 1, glow: .5 * sm(.7, 1, t) }; }   // same as the Self-Custody closing CTA
      case 'news': return { mode: 'whole', x: 0, y: 0, s: .0001, expl: 0, dim: .6, N: 90, blue: .55, tilt: -.45, cy: -1.3, cz: -3.4 };   // same curtain as the Self-Custody newsletter
      case 'own': return afterCore(m, 'own');
      case 'spotlight': {   // after Innovation the finished shield leaves with its column: it rides up and off screen, no shrinking in place
        const st = document.querySelector('#own .own-stack'), q = st && st.getBoundingClientRect();
        const oa = ownAnchor(); if (q && q.bottom > 0 && oa) return oa;   // same place as in 'own', so there is no jump between the two
        if (q && q.bottom > 0) return { mode: 'five', build: 1, lock: 1, land: 1, exit: 1, fade: 1 - ss(.08, .6, dissolveP()), x: (q.left + q.width / 2) / W - .5, y: .5 - (q.top + q.height / 2) / H, s: .42 * q.height / H, expl: 0, glow: .3, dim: .3, N: 38 };
        return { mode: 'whole', x: 0, y: .9, s: .0001, expl: 0, dim: .3 };
      }
      default: return { mode: 'whole', x: 0, y: 0, s: .0001, expl: 0, dim: .3 };    // covered by an opaque section
    }
  }

  const cur = Object.assign({}, base, { s: .3 });
  const ease = t => 1 - Math.pow(1 - t, 4);
  const back = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const t0 = performance.now(); let last = t0, lastR = 0;
  const dv = new THREE.Vector3(), tmpC = new THREE.Color(), fitBox = new THREE.Box3(), fitV = new THREE.Vector3();
  const sx = { x: 0, y: 0 };
  let pend = null;

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
    const active = window.__core ? window.__core.active : -1;

    // blend poses by how much of the middle band of the screen each section holds
    const b0 = H * .4, b1 = H * .6; const acc = {}; KEYS.forEach(k => acc[k] = 0); let tw = 0; const modeW = {}; let px = 0, py = 0, pl = 0, pw = 0;
    IDS.forEach(id => {
      const r = rects[id]; const w = Math.max(0, Math.min(r.bottom, b1) - Math.max(r.top, b0)); if (w <= 0) return;
      const p = Object.assign({}, base, poseFor(id, r, { m, active }));
      KEYS.forEach(k => acc[k] += p[k] * w); tw += w; modeW[p.mode] = (modeW[p.mode] || 0) + w;
      if (p.s > .01) { px += p.x * w; py += p.y * w; pl += p.lock * w; pw += w; }   // only shown poses decide where the shield is
    });
    if (tw <= 0) { KEYS.forEach(k => acc[k] = cur[k]); tw = 1; modeW[curSet] = 1; }
    const tgt = {}; KEYS.forEach(k => tgt[k] = acc[k] / tw);
    if (pw > 0) { tgt.x = px / pw; tgt.y = py / pw; tgt.lock = pl / pw; }
    let mode = Object.keys(modeW).sort((a, b) => modeW[b] - modeW[a])[0];
    // colour of the world behind everything
    
    const intro = 99;   // home-dark: no load intro (the five pieces flying in and locking together); the shield is simply there
    const introDone = intro > 3.2;
    if (!introDone) mode = 'five';
    if (nowS() - play.burstAt < 2.6 && heroOn()) { mode = 'five'; tgt.expl = 1.15; }   // clicked: the pieces fly apart for a moment, then the normal pose brings them home
    if (mode !== curSet) {
      if (cur.expl < 0.003 && introDone) {      // pieces are back together: swap sets without a visible jump
        Object.values(sets).flat().forEach(p => { p.pivot.visible = false; });
        curSet = mode; sets[curSet].forEach(p => { p.pivot.visible = true; p.lift = 0; });
      } else tgt.expl = 0;
    }
    if (curSet === 'whole') tgt.expl = 0;

    const kk = see ? 1 - Math.exp(-dt * 3.4) : 1;
    const kOut = see ? 1 - Math.exp(-dt * 14) : 1;   // a shield leaving (shrinking to nothing) goes fast, so it never lingers while you scroll on
    const parked = tgt.exit > .5 && tgt.core > .5;   // left behind by the core section: pinned to the page, no lag
    // anchored poses (lock) follow the scroll exactly, so a fast scroll never leaves the shield behind its spot;
    // a shrunk shield jumps to its next spot instead of flying there, and a shrinking one holds still (no shooting across)
    const off = o => Math.abs(o.y) > .5 + o.s * 1.25;   // the shield's whole outline is past the edge
    if (!reduce && off(cur) && off(tgt)) { cur.x = tgt.x; cur.y = tgt.y; cur.x1 = tgt.x; cur.y1 = tgt.y; cur.expl = cur.expl1 = tgt.expl; }   // unseen: jump straight to the next spot
    if (snapNow) { snapNow = false; if (!reduce) { cur.x = cur.x1 = tgt.x; cur.y = cur.y1 = tgt.y; } }
    const kLock = lerp(kk, see ? 1 - Math.exp(-dt * 11) : 1, clamp(tgt.lock)),   /* anchored: a short glide (~0.15s) that soaks up wheel steps but never trails far */ tiny = cur.s < .012, going = tgt.s < .012;
    KEYS.forEach(k => {
      if (k === 'expl') return;
      if (reduce) { cur[k] = tgt[k]; return; }
      if (k === 'x' || k === 'y') {
        const k1 = k + '1'; if (cur[k1] === undefined || tiny) cur[k1] = tgt[k];
        if (tiny) cur[k] = tgt[k]; else if (!going) { cur[k1] += (tgt[k] - cur[k1]) * kLock; cur[k] += (cur[k1] - cur[k]) * kLock; }   // chained: eases in and out
        return; }
      if (k === 'fade') { cur.fade += (tgt.fade - cur.fade) * (tgt.fade < cur.fade ? kOut : kLock); return; }
      if (k === 's') { cur.s += (tgt.s - cur.s) * (tgt.s < cur.s * .5 ? kOut : cur.s < .05 ? kk : kLock); return; }
      cur[k] += (tgt[k] - cur[k]) * kk;
    });
    // pieces coming apart or together: two chained smoothings give an S-curve (eases in and out), so they slide rather than snap
    const ke = see ? 1 - Math.exp(-dt * 2.6) : 1;
    cur.expl1 = cur.expl1 === undefined ? cur.expl : cur.expl1;
    cur.expl1 = reduce ? tgt.expl : cur.expl1 + (tgt.expl - cur.expl1) * ke;
    cur.expl = reduce ? tgt.expl : cur.expl + (cur.expl1 - cur.expl) * ke;
    if (Math.abs(tgt.expl - cur.expl) < .004 && Math.abs(tgt.expl - cur.expl1) < .004) cur.expl = cur.expl1 = tgt.expl;   // settle the tail so pieces finish closing
    ptr.sx += (ptr.x - ptr.sx) * kk * .6; ptr.sy += (ptr.y - ptr.sy) * kk * .6;
    const expl = curSet === 'whole' ? 0 : cur.expl;
    window.__shieldDbg = { cur, tgt, set: curSet, pieces: sets[curSet].map(p => +(p.b === undefined ? 1 : p.b).toFixed(3)), lift: sets[curSet].map(p => +p.lift.toFixed(2)), active, parked };   // read by the landing test

    if (!see) { return; }                                   // covered by opaque sections: poses are snapped, nothing drawn
    if (reduce && !dirty) return;
    dirty = false;

    // drag: the offset springs home and the spin unwinds once released (momentum first)
    { const kt = 1 - Math.exp(-dt * 4); play.sx += (play.tx - play.sx) * kt; play.sy += (play.ty - play.sy) * kt; }   // the tilt glides, as the hover did
    gObj.position.set(cur.x * visW, cur.y * FOV_H, 0);   // the shield stays where it is; only its direction turns
    gObj.scale.setScalar(Math.max(.0001, cur.s * Sunit));
    gObj.rotation.y = Math.sin(time * 0.5) * 0.26 + cur.ry * Math.sin(time * .3 + 1) * .5 + cur.ry * .3;   // no hover-follow (home-dark): the shield turns only when you drag it
    gObj.rotation.x = Math.sin(time * 0.37) * 0.05;
    gObj.rotation.z = Math.sin(time * 0.23) * 0.04;
    gObj.rotation.y += play.sx * 0.35; gObj.rotation.x += play.sy * 0.2;   // the drag's subtle tilt (the old hover amounts)
    // dark exploration: the curtain shows only while the hero or the closing section is on screen; between, pure black
    // and the bitgo.com starfield (starfield.js) fades in
    const hrR = heroEl ? heroEl.getBoundingClientRect() : null, ctR = closeEl ? closeEl.getBoundingClientRect() : null, vh = innerHeight;
    const cv = Math.max(hrR ? clamp((hrR.bottom - vh * 0.3) / (vh * 0.45)) : 0, ctR ? clamp((vh * 0.7 - ctR.top) / (vh * 0.45)) : 0);
    const hb = 1 - (ctR ? clamp((vh * 0.7 - ctR.top) / (vh * 0.45)) : 0);   // the curtain is black everywhere it shows, except the close (blue again)
    curtainMat.color.copy(CUR0.c).lerp(CURB.c, hb); curtainMat.emissive.copy(CUR0.e).lerp(CURB.e, hb);
    curtainMat.emissiveIntensity = CUR0.ei + (CURB.ei - CUR0.ei) * hb; curtainMat.envMapIntensity = CUR0.env + (CURB.env - CUR0.env) * hb;   // full while the hero holds the screen or the close has arrived; black between
    if (window.Starfield) window.Starfield.opacity((1 - cv).toFixed(3));
    dimU.value = cur.dim * cv; silverU.value = Math.max(clamp(cur.silver), hb); paleU.value = clamp(cur.pale);   // silver strips the blue from the hero curtain
    heightMat.uniforms.uN.value = cur.N;
    bgCol.copy(INK).lerp(BLUE, clamp(cur.blue)).lerp(PAPER, clamp(cur.pale)).lerp(BLACK, Math.max(1 - cv, hb));   // black behind the hero too
    curtain.position.set(ptr.sx * -0.5, cur.cy, cur.cz);
    curtain.rotation.set(cur.tilt, cur.yaw, cur.rz);

    const set = sets[curSet];
    set.forEach((pc, i) => {
      // 'The future of finance': piece i is in place once item i is active; the rest wait out of frame
      const own = cur.build > .01 && curSet === 'five';
      // each piece slides home at a steady pace (about 1.1s) on an ease-in-out path, instead of a fast-start magnet pull
      // apart = how far the shield has split (scroll) less how far item i has brought its piece home (scroll)
      // each item clicks its piece home: once item i is active, piece i slides in at a steady pace (about 1.1s), easing in and out
      const hTo = cur.land > .98 && window.__own && window.__own.active >= i ? 1 : 0,   /* fully open until it pins, then item by item */ hStep = see ? dt / 1.1 : 1;
      pc.hl = pc.hl === undefined || reduce ? hTo : pc.hl + Math.max(-hStep, Math.min(hStep, hTo - pc.hl));
      const aTo = own ? clamp(cur.land) * (1 - sm(0, 1, pc.hl)) : 0;
      pc.ghost = own && !reduce ? clamp(cur.land) * (1 - sm(0, 1, pc.hl)) : 0;   // how far this piece has 'gone digital' (ASCII)
      pc.money = own && !reduce && PIECE_THEME[i] ? sm(0, 1, pc.hl) : 0;          // Monetary Freedom: comes home as green $ instead of glass
      pc.ap = pc.ap === undefined ? aTo : reduce ? aTo : pc.ap + (aTo - pc.ap) * kLock;
      pc.b = 1 - pc.ap;
      const u = curSet === 'five' ? clamp((intro - 0.15 - pc.delay) / 1.5) : 1, apart = own ? 1 - pc.b : 0;
      const e = sm(0, 1, u), eo = sm(0, 1, u), f = 1 - eo;   // intro assembly: ease in and out, no overshoot
      const lt = curSet === 'five' && active >= 0 && (ctxCore(rects.core) || parked) && i === active ? 1 : 0;   // parked: the last lit piece stays as it was
      pc.lift += (lt - pc.lift) * kk * 1.3;
      const gl = lt ? 1 : cur.glow * (curSet === 'whole' ? 1 : .6);
      pc.glow += (gl - pc.glow) * kk * 1.2;
      const spread = curSet === 'three' ? 1.5 : 0.9;
      dv.copy(pc.dir).multiplyScalar(expl * spread + pc.lift * 0.26);
      if (curSet === 'three') dv.y += (i - 1) * expl * .35;
      pc.pivot.position.copy(dv).addScaledVector(pc.from.p, f).addScaledVector(pc.dir, apart * .26);   // pieces not yet earned wait a short way out, in the shield's own plane
      pc.pivot.position.z += pc.lift * 0.55;
      pc.pivot.rotation.set(pc.from.r.x * f, pc.from.r.y * f, pc.from.r.z * f);   // no tilt: pieces slide straight out and back
      pc.pivot.scale.setScalar(lerp(0.4, 1, e) * (1 + pc.lift * 0.05));
      // the glow breathes: it swells to full and fades all the way out (to clear glass), one slow cycle every 3.2s
      const breath = reduce ? 1 : .5 - .5 * Math.cos(time * Math.PI * 2 / 3.2), gp = pc.glow * lerp(breath, 1, clamp(pc.lift));   // the lit (open) piece keeps a steady glow
      pc.mesh.material.emissiveIntensity = gp * 0.5;
      const fd = clamp(cur.fade) * (1 - Math.max(pc.ghost || 0, pc.money || 0)), mt = pc.mesh.material, tr = fd < .995;
      if (mt.transparent !== tr) { mt.transparent = tr; mt.needsUpdate = true; }
      mt.opacity = fd; pc.pivot.visible = fd > .005;
      pc.mesh.material.attenuationDistance = lerp(0.55, 0.3, clamp(gp));
    });

    // fit: center what is actually visible (the split, lifted pieces) on the target column, not the object's origin
    if (cur.fit > .01) {
      gObj.updateMatrixWorld(true); fitBox.setFromObject(gObj); fitBox.getCenter(fitV); fitV.project(camera);
      const want = cur.x * 2, have = fitV.x;   // both in normalized screen units (-1..1)
      gObj.position.x += (want - have) * .5 * visW * clamp(cur.fit);
    }

    // core glow (Core section only): pulses gently; fades with the pose blend as the next section takes over
    const cg = curSet === 'five' && introDone ? clamp(cur.core) : 0;
    coreG.visible = cg > .01;
    if (coreG.visible) {
      const pulse = 1 + Math.sin(time * 2.2) * .08;
      coreMat.opacity = cg * (.75 + .25 * (pulse - .92) / .16); coreMat.color.setRGB(.55 * 1.7, .72 * 1.7, 1.9);   // white-blue, above 1 so the bloom makes the seams glow
      coreLight.intensity = cg * 6 * pulse;
    }

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
    if (cur.exit < .5 && clamp(tgt.lock) < .5) keepClear(gObj, gObj.scale.x * (1.05 + (curSet === 'whole' ? 0 : cur.expl * 0.9)));   // leaving with its section: it may slide up behind the nav and off screen
    if (typeof keyGroup !== 'undefined') keepClear(keyGroup, keyGroup.scale.x * 1.45);
    if (typeof walletGroup !== 'undefined') keepClear(walletGroup, walletGroup.scale.x * 1.05);
    if (typeof keys3Group !== 'undefined') keepClear(keys3Group, keys3Group.scale.x * 1.25);
    drawDissolve(dissolveP(), time);
    placeSlots(time, dt, visW);
    const f0 = performance.now();
    heightMat.uniforms.uT.value = time;
    renderer.setRenderTarget(heightRT); quad.material = heightMat; renderer.render(quadScene, ortho);
    renderer.setRenderTarget(normalRT); quad.material = normalMat; renderer.render(quadScene, ortho);
    renderer.setRenderTarget(null);
    if (taa) taaStep(taa, { camera, scene, W, H, dpr: DPR(), skip: taaSkip, drift: Math.abs(ptr.x - ptr.sx) + Math.abs(ptr.y - ptr.sy) > 0.004 });
    composer.render();
    window.__cost = Math.round(cost);
    cost = cost * 0.7 + (performance.now() - f0) * 0.3;
    if (cost > 220 && ++slow > 3) { slow = 0; if (bloom.enabled) bloom.enabled = false; else if (pr > 0.55) { pr = Math.max(0.55, pr - 0.2); needResize = true; W = 0; } }
  }
  const ctxCore = r => r.top < H * .5 && r.bottom > H * .3;

  // model slots (same contract as Self-Custody): each object sits in its slot and scrolls with the page.
  // Support: the orbit globe arrives with its rings tipped open and they close onto the sphere.
  const MAKE = { 'orbit-globe': () => { const m = createOrbitGlobe({}); return { object: m.object, update: (t, p) => m.update(t, { open: 1 - p }), yaw: -0.25 }; } };
  const slots = [...document.querySelectorAll('[data-model]')].filter(el => MAKE[el.dataset.model]).map((el, i) => {
    const m = MAKE[el.dataset.model](el), g = new THREE.Group(); g.add(m.object); g.visible = false; scene.add(g);
    m.update(0, 1); const size = new THREE.Box3().setFromObject(m.object).getSize(new THREE.Vector3());
    return { el, m, g, born: -1, fit: +(el.dataset.fit || 0.9), i, hw: size.x / 2, hh: size.y / 2 };
  });
  const easeS = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
  function placeSlots(time, dt, visW) {
    slots.forEach(s => {
      const r = s.el.getBoundingClientRect();
      s.g.visible = r.bottom > 0 && r.top < H && r.width > 0;
      if (!s.g.visible) return;
      if (s.born < 0 && r.top < H * .78) s.born = time;
      const p = reduce ? 1 : s.born < 0 ? 0 : easeS((time - s.born) / 2.6);
      const sc = Math.max(.0001, Math.min(r.height / H * FOV_H / (2 * s.hh), r.width / W * visW / (2 * s.hw)) * s.fit);
      s.g.scale.setScalar(sc);
      s.g.position.set(((r.left + r.width / 2) / W - .5) * visW, (.5 - (r.top + r.height / 2) / H) * FOV_H, 0);
      s.g.rotation.set(.08 + ptr.sy * .06, s.m.yaw + Math.sin(time * .2 + s.i) * .08 + ptr.sx * .12, 0);
      s.m.update(time, p, dt);
    });
  }

  // ASCII, after the engine in assets/js/ascii.js: a fixed character grid over the screen, glyphs blitted from a pre-rendered
  // atlas, one glyph and tone per cell. The shield pieces are rasterised on the CPU into that grid (projected triangles,
  // depth-tested, shaded by how they face the light), so each ghost has its piece's real shape. Kept quiet on purpose:
  // small glyphs, one blue-white ramp, only inside the pieces.
  const AG = " .:-=+*#%@01·$x", AI = Object.fromEntries([...AG].map((g, i) => [g, i]));
  const ARAMP = [...(".:-=+*#%@")].map(g => AI[g]);
  const ATONES = (() => { const st = ['#14309c', '#3a66ff', '#8eabff', '#d4e0ff', '#ffffff'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))), n = 12;
    return Array.from({ length: n }, (_, i) => { const p = i / (n - 1) * (st.length - 1), a = Math.min(Math.floor(p), st.length - 2), f = p - a; return `rgb(${st[a].map((v, k) => Math.round(v + (st[a + 1][k] - v) * f)).join(',')})`; }); })();
  const GTONES = (() => { const st = ['#04140a', '#0d5a2a', '#1fbf5b', '#7dffa8', '#e8fff0'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))), n = 12;
    return Array.from({ length: n }, (_, i) => { const p = i / (n - 1) * (st.length - 1), a = Math.min(Math.floor(p), st.length - 2), f = p - a; return `rgb(${st[a].map((v, k) => Math.round(v + (st[a + 1][k] - v) * f)).join(',')})`; }); })();   // green, from assets/js/ascii.js
  const PIECE_THEME = { 1: 'money' };   // item 1, 'Monetary Freedom'
  const BORDER_ITEM = 2; let bdr = 0;     // item 2, 'Borderless': the shield's outline dissolves
  const LOCK_ITEM = 3; let lockT = -9, lastAct = -1;   // item 3, 'Secure and Scarce': a hash ring sweeps over as the shield locks together
  const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const CW = 9, CH = 14;   // cell size in css px (small, so it reads as texture, not as text)
  let atlas = null, atlasK = 0, dzOn = false, gcols = 0, grows = 0, zb = null, shd = null, own_ = null;
  const ahash = (a, b, c) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function buildAtlas(k) {
    const a = document.createElement('canvas'), cw = Math.round(CW * k), ch = Math.round(CH * k);
    a.width = AG.length * cw; a.height = (ATONES.length + GTONES.length) * ch;
    const x = a.getContext('2d'); x.font = `500 ${Math.round(12.5 * k)}px ui-monospace,"JetBrains Mono",SFMono-Regular,Menlo,Consolas,monospace`; x.textAlign = 'center'; x.textBaseline = 'middle';
    [...ATONES, ...GTONES].forEach((c, ci) => { x.fillStyle = c; [...AG].forEach((g, gi) => x.fillText(g, gi * cw + cw / 2, ci * ch + ch / 2 + k * .5)); });
    atlas = a; atlasK = k;
  }
  const LDIR = new THREE.Vector3(-.35, .55, .76).normalize(), aV = new THREE.Vector3(), aN = new THREE.Vector3(), aE1 = new THREE.Vector3(), aE2 = new THREE.Vector3();
  // rasterise one piece into the grid (cell units); keeps the nearest surface per cell, with its shade and piece index
  function rasterPiece(pc, k) {
    const geo = pc.mesh.geometry, pos = geo.attributes.position, n = pos.count, M = pc.mesh.matrixWorld;
    if (!pc._w || pc._w.length !== n * 3) { pc._w = new Float32Array(n * 3); pc._s = new Float32Array(n * 3); }
    const w = pc._w, sc = pc._s;
    for (let v = 0; v < n; v++) {
      aV.fromBufferAttribute(pos, v).applyMatrix4(M); w[v * 3] = aV.x; w[v * 3 + 1] = aV.y; w[v * 3 + 2] = aV.z;
      aV.project(camera); sc[v * 3] = (aV.x + 1) / 2 * innerWidth / CW; sc[v * 3 + 1] = (1 - aV.y) / 2 * innerHeight / CH; sc[v * 3 + 2] = aV.z;
    }
    const idx = geo.index, tris = idx ? idx.count / 3 : n / 3, cp = camera.position;
    for (let t = 0; t < tris; t++) {
      const a = idx ? idx.getX(t * 3) : t * 3, b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      aE1.set(w[b * 3] - w[a * 3], w[b * 3 + 1] - w[a * 3 + 1], w[b * 3 + 2] - w[a * 3 + 2]);
      aE2.set(w[c * 3] - w[a * 3], w[c * 3 + 1] - w[a * 3 + 1], w[c * 3 + 2] - w[a * 3 + 2]);
      aN.crossVectors(aE1, aE2); const L = aN.length(); if (L < 1e-12) continue; aN.multiplyScalar(1 / L);
      if (aN.x * (cp.x - w[a * 3]) + aN.y * (cp.y - w[a * 3 + 1]) + aN.z * (cp.z - w[a * 3 + 2]) <= 0) continue;   // facing away
      if (hd_path) {   // the hero burn needs the whole silhouette in css px: the triangles facing the camera, one winding so they union (the B hole is filled later)
        const ax = sc[a * 3] * CW, ay = sc[a * 3 + 1] * CH, bx = sc[b * 3] * CW, by = sc[b * 3 + 1] * CH, qx = sc[c * 3] * CW, qy = sc[c * 3 + 1] * CH;
        const ar = (bx - ax) * (qy - ay) - (qx - ax) * (by - ay);
        if (Math.abs(ar) > 1e-6) { hd_path.moveTo(ax, ay); if (ar > 0) { hd_path.lineTo(bx, by); hd_path.lineTo(qx, qy); } else { hd_path.lineTo(qx, qy); hd_path.lineTo(bx, by); } hd_path.closePath(); }
      }
      const shade = .18 + .82 * Math.max(0, aN.dot(LDIR));
      const x0 = sc[a * 3], y0 = sc[a * 3 + 1], z0 = sc[a * 3 + 2], x1 = sc[b * 3], y1 = sc[b * 3 + 1], z1 = sc[b * 3 + 2], x2 = sc[c * 3], y2 = sc[c * 3 + 1], z2 = sc[c * 3 + 2];
      const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0); if (Math.abs(area) < 1e-9) continue;
      const cx0 = Math.max(0, Math.floor(Math.min(x0, x1, x2))), cx1 = Math.min(gcols - 1, Math.ceil(Math.max(x0, x1, x2)));
      const cy0 = Math.max(0, Math.floor(Math.min(y0, y1, y2))), cy1 = Math.min(grows - 1, Math.ceil(Math.max(y0, y1, y2)));
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const px = cx + .5, py = cy + .5;
        const w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) / area, w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) / area, w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * z0 + w1 * z1 + w2 * z2, o = cy * gcols + cx;
        if (z < zb[o]) { zb[o] = z; shd[o] = shade; own_[o] = k; }
      }
    }
  }
  function drawDissolve(p, t) {
    const set = sets[curSet], act = window.__own ? window.__own.active : -1;
    const bOn = !reduce && curSet === 'five' && cur.build > .5 && act === BORDER_ITEM && p <= 0;
    const dtb = Math.min(.05, Math.max(0, t - (drawDissolve.lt ?? t))); drawDissolve.lt = t;
    bdr += ((bOn ? 1 : 0) - bdr) * (1 - Math.exp(-dtb * 3));   // eases in and out over about a second
    if (act === LOCK_ITEM && lastAct !== LOCK_ITEM && cur.build > .5 && !reduce) lockT = t; lastAct = act;
    const lockS = (t - lockT) / 1.8, lockOn = lockS >= 0 && lockS < 1 && curSet === 'five' && p <= 0;
    const ghosts = curSet === 'five' && set.some(pc => (pc.ghost || 0) > .01 || (pc.money || 0) > .01), diss = !reduce && p > 0 && p < 1 && cur.s > .02;
    // the hero shield's digital outline (home-dark): on while the hero holds the screen, fading as it scrolls away
    const hR = heroEl ? heroEl.getBoundingClientRect() : null, heroA = reduce || !hR ? 0 : clamp((hR.bottom - innerHeight * .3) / (innerHeight * .45));
    if (!ghosts && !diss && bdr < .01 && !lockOn && heroA < .02) { if (dzOn) { dg.setTransform(1, 0, 0, 1, 0, 0); dg.clearRect(0, 0, dz.width, dz.height); dzOn = false; } return; }
    const dpr = Math.min(2, devicePixelRatio || 1), cw0 = Math.round(innerWidth * dpr), ch0 = Math.round(innerHeight * dpr);
    if (dz.width !== cw0 || dz.height !== ch0) { dz.width = cw0; dz.height = ch0; }
    if (!atlas || atlasK !== dpr) buildAtlas(dpr);
    const C = Math.ceil(innerWidth / CW), R = Math.ceil(innerHeight / CH);
    if (C !== gcols || R !== grows) { gcols = C; grows = R; zb = new Float32Array(C * R); shd = new Float32Array(C * R); own_ = new Int8Array(C * R); }
    zb.fill(1e9); own_.fill(-1);
    gObj.updateMatrixWorld(true);
    hd_path = heroA > .02 && !diss ? new Path2D() : null;
    set.forEach((pc, k) => rasterPiece(pc, k));   // every piece: seams, outlines and the lock ring need the whole shield
    // rows of each piece, and the whole shield's extent and middle
    const pr0 = [], pr1 = []; let r0 = 1e9, r1 = -1, c0 = 1e9, c1 = -1, sxm = 0, sym = 0, nn = 0;
    for (let o = 0; o < own_.length; o++) { const k = own_[o]; if (k < 0) continue; const r = (o / gcols) | 0, c = o % gcols;
      pr0[k] = Math.min(pr0[k] ?? 1e9, r); pr1[k] = Math.max(pr1[k] ?? -1, r); if (r < r0) r0 = r; if (r > r1) r1 = r; if (c < c0) c0 = c; if (c > c1) c1 = c; sxm += c; sym += r; nn++; }
    dzOn = true; dg.setTransform(1, 0, 0, 1, 0, 0); dg.clearRect(0, 0, dz.width, dz.height);
    if (r1 < 0) return;
    const mcx = sxm / nn, mcy = sym / nn, midX = (mcx + .5) * CW;
    const aw = Math.round(CW * dpr), ah = Math.round(CH * dpr), tick = Math.floor(t * 14), scanRow = r0 + ((t * .3) % 1) * (r1 - r0 + 8) - 4;
    const isEdge = (cx, cy, k) => { for (const [ax, ay] of NB) { const c2 = cx + ax, r2 = cy + ay; if (c2 < 0 || r2 < 0 || c2 >= gcols || r2 >= grows || own_[r2 * gcols + c2] !== k) return true; } return false; };
    const bit = (cx, cy, s2) => ahash(cx, cy, s2) < .5 ? AI['0'] : AI['1'];
    for (let o = 0; o < own_.length; o++) {
      const k = own_[o]; if (k < 0) continue;
      const cx = o % gcols, cy = (o / gcols) | 0, S = shd[o], pc = set[k], edge = isEdge(cx, cy, k);
      const vl = (cy - pr0[k]) / Math.max(1, pr1[k] - pr0[k]);   // row within its own piece, 0 top .. 1 bottom
      let g = -1, tn = 0, al = 0, dx = 0, dy = 0, green = false;
      const qd = diss ? clamp((p - (.02 + .45 * (cy - r0) / Math.max(1, r1 - r0) + .08 * ahash(cx, cy, 7))) / .45) : 0;
      if (qd > 0) {   // the outro, top to bottom: a bright line turns the glass to ASCII, it churns into bits, hums, then breaks away in columns
        const q = qd, colSp = .55 + .9 * ahash(cx, 0, 5); green = (pc.money || 0) > .01;
        if (q < .1) { g = q < .05 ? AI['#'] : ARAMP[Math.round(S * 7)]; tn = 1; }
        else if (q < .34) { g = ahash(cx, cy, tick) < (q - .1) * 2.4 ? bit(cx, cy, tick + 1) : ARAMP[Math.max(0, Math.min(8, Math.round(S * 7) + ((ahash(cx, cy, tick >> 1) * 3) | 0) - 1))]; tn = .45 + .5 * S; }
        else if (q < .55) { g = bit(cx, cy, tick); tn = (.5 + .5 * S) * (.85 + .15 * Math.sin(t * 9 + cx)); dx = (ahash(cx, cy, tick) - .5) * 1.5; }
        else { const k2 = (q - .55) / .45; g = q < .93 ? bit(cx, cy, tick) : AI['·']; tn = (.5 + .5 * S) * (1 - k2 * .5);
          dy = -Math.pow(k2, 1.7) * 220 * colSp; dx = (cx * CW - midX) * k2 * .14 + Math.sin(t * 2 + cx * .7) * 6 * k2; }
        al = Math.min(1, q * 14) * (q > .7 ? 1 - (q - .7) / .3 : 1);
      } else if (p >= 1) { continue;   // dissolved: nothing left
      } else if ((pc.money || 0) > (pc.ghost || 0)) {   // Monetary Freedom: green, filling from the top as it comes home, a $ stream falling down each column
        const mo = pc.money;
        if (vl <= mo + .02) {
          green = true;
          const head = pr0[k] + ((t * .55 + ahash(cx, 3, 11)) % 1) * (pr1[k] - pr0[k] + 10) - 5, dh = head - cy, lit = dh >= 0 && dh < 6 ? 1 - dh / 6 : 0;
          g = edge || lit > .5 || S > .3 ? AI['$'] : AI[':'];
          tn = Math.min(1, .28 + .45 * S + .45 * lit + (edge ? .2 : 0)); al = 1;
          if (Math.abs(vl - mo) < .05 && mo < .98) { g = AI['$']; tn = 1; }   // the fill front
        }
      } else {   // a piece that has 'gone digital': fills from the bottom as it splits, clears from the top as it comes home
        const gh = pc.ghost || 0;
        if (gh > .01 && vl >= 1 - gh - .02) {
          const sh = S * (.85 + .15 * Math.sin(t * 1.3 + cx * .35 + cy * .5)), band = Math.exp(-Math.pow((cy - scanRow) / 1.6, 2));
          g = edge ? (ahash(cx, cy, 3) < .5 ? AI['#'] : AI['=']) : ARAMP[Math.min(6, Math.round(sh * 5) + (band > .4 ? 2 : 0))];
          tn = edge ? .8 : .36 + .4 * sh + .35 * band; al = .95;
          if (ahash(cx, cy, Math.floor(t * 3)) < .035) { g = bit(cx, cy, tick); tn = .95; }    // a few cells flicker as data
          if (Math.abs(vl - (1 - gh)) < .04 && gh < .98) { g = AI['#']; tn = 1; }             // the moving edge
        }
      }
      if (lockOn && qd <= 0) {   // Secure and Scarce: a hash ring sweeps out over the whole shield as the pieces lock together
        const d = Math.hypot((cx - mcx) / Math.max(1, (c1 - c0) / 2), (cy - mcy) / Math.max(1, (r1 - r0) / 2)) / 1.2;
        const band = Math.exp(-Math.pow((d - lockS * 1.15) / .07, 2)) * (1 - lockS * .6);
        if (band > .08 && band > al) { g = AI['#']; tn = .55 + .45 * band; al = band; green = false; }
      }
      if (g < 0 || al < .01) continue;
      dg.globalAlpha = al;
      const ti = Math.max(0, Math.min(ATONES.length - 1, Math.round(tn * (ATONES.length - 1)))) + (green ? ATONES.length : 0);
      dg.drawImage(atlas, g * aw, ti * ah, aw, ah, Math.round((cx * CW + dx) * dpr), Math.round((cy * CH + dy) * dpr), aw, ah);
    }
    // Borderless: the shield's outer border breaks up (flickering gaps) and sheds glyphs that curl away as they drift out
    if (bdr > .01) {
      const empty = (c, r) => c < 0 || r < 0 || c >= gcols || r >= grows || own_[r * gcols + c] < 0;
      for (let o = 0; o < own_.length; o++) {
        if (own_[o] < 0) continue;
        const cx = o % gcols, cy = (o / gcols) | 0;
        if (!(empty(cx - 1, cy) || empty(cx + 1, cy) || empty(cx, cy - 1) || empty(cx, cy + 1))) continue;
        let nx = (cx - mcx) * CW, ny = (cy - mcy) * CH; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
        if (ahash(cx, cy, Math.floor(t * 4)) > .22 * bdr) {
          dg.globalAlpha = bdr * .85;
          const bg = [AI['+'], AI['x'], AI['*']][(ahash(cx, cy, Math.floor(t * 2)) * 3) | 0];
          dg.drawImage(atlas, bg * aw, 10 * ah, aw, ah, Math.round(cx * CW * dpr), Math.round(cy * CH * dpr), aw, ah);
        }
        for (let k2 = 0; k2 < 3; k2++) {
          const ph = (t * (.26 + .12 * k2) + ahash(cx, cy, 21 + k2)) % 1, dist = ph * (40 + 60 * ahash(cx, cy, 31 + k2));
          const ang = Math.sin(t * .8 + cx * .3 + cy * .2 + k2) * .7 * ph, rx = nx * Math.cos(ang) - ny * Math.sin(ang), ry = nx * Math.sin(ang) + ny * Math.cos(ang);
          const gch = ph < .25 ? AI['x'] : ph < .5 ? AI['+'] : ph < .75 ? AI['-'] : AI['.'];
          dg.globalAlpha = bdr * (1 - ph) * .8;
          dg.drawImage(atlas, gch * aw, Math.round((1 - ph) * 10) * ah, aw, ah, Math.round((cx * CW + rx * dist) * dpr), Math.round((cy * CH + ry * dist) * dpr), aw, ah);
        }
      }
    }
    // Hero (home-dark): a burning rim, no characters. The glow is blurred from the shield's true silhouette, so it follows
    // the outline at any tilt; the silhouette is then cut out of it, so the shield's face and fine lines stay clean.
    // A slow wave of light runs down the edge, and soft sparks rise off it.
    if (heroA > .02 && !diss && hd_path) {
      const Q = .25, lw = Math.ceil(innerWidth * Q), lh = Math.ceil(innerHeight * Q);
      if (!hd_m) { hd_m = document.createElement('canvas'); hd_c = document.createElement('canvas'); hd_h = document.createElement('canvas'); hd_b = document.createElement('canvas'); hd_t = document.createElement('canvas'); hd_g = document.createElement('canvas'); }
      for (const c of [hd_m, hd_c, hd_h, hd_b]) if (c.width !== lw || c.height !== lh) { c.width = lw; c.height = lh; }
      if (hd_g.width !== dz.width || hd_g.height !== dz.height) { hd_g.width = dz.width; hd_g.height = dz.height; }
      // the B is a hole through the glass: fill it, so the burn follows only the outer edge and never lights the B
      const G = gcols, Rr = grows, N = G * Rr;
      if (!hd_ext || hd_ext.length !== N) { hd_ext = new Uint8Array(N); hd_q = new Int32Array(N); }
      const ext = hd_ext, qq = hd_q; ext.fill(0); let qh = 0, qt = 0;
      const seed = o => { if (!ext[o] && own_[o] < 0) { ext[o] = 1; qq[qt++] = o; } };
      for (let c = 0; c < G; c++) { seed(c); seed((Rr - 1) * G + c); } for (let r = 0; r < Rr; r++) { seed(r * G); seed(r * G + G - 1); }
      while (qh < qt) { const o = qq[qh++], c = o % G, r = (o / G) | 0; if (c > 0) seed(o - 1); if (c < G - 1) seed(o + 1); if (r > 0) seed(o - G); if (r < Rr - 1) seed(o + G); }
      const solid = new Path2D(hd_path);
      for (let o = 0; o < N; o++) if (own_[o] < 0 && !ext[o]) { const c = o % G, r = (o / G) | 0; solid.rect((c - 1) * CW, (r - 1) * CH, 3 * CW, 3 * CH); }
      const mx = hd_m.getContext('2d'); mx.setTransform(1, 0, 0, 1, 0, 0); mx.clearRect(0, 0, lw, lh); mx.setTransform(Q, 0, 0, Q, 0, 0); mx.fillStyle = '#fff'; mx.fill(solid); mx.setTransform(1, 0, 0, 1, 0, 0);
      const tint = (cv, blur, col) => {   // the silhouette, blurred and coloured (low res, so it is cheap)
        const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, lw, lh);
        if ('filter' in x) { x.filter = `blur(${blur}px)`; x.drawImage(hd_m, 0, 0); x.filter = 'none'; }
        else {   // no canvas filter (older Safari): shrink, then grow back in two smooth steps, which reads as a blur without steps
          const s = Math.max(2, Math.round(blur * 1.6)), tw = Math.max(1, Math.ceil(lw / s)), th = Math.max(1, Math.ceil(lh / s)), mw = tw * 2, mh = th * 2;
          if (!hd_t2) hd_t2 = document.createElement('canvas');
          if (hd_t.width !== tw || hd_t.height !== th) { hd_t.width = tw; hd_t.height = th; } if (hd_t2.width !== mw || hd_t2.height !== mh) { hd_t2.width = mw; hd_t2.height = mh; }
          const tx = hd_t.getContext('2d'), t2 = hd_t2.getContext('2d'); tx.imageSmoothingEnabled = t2.imageSmoothingEnabled = x.imageSmoothingEnabled = true;
          tx.clearRect(0, 0, tw, th); tx.drawImage(hd_m, 0, 0, tw, th); t2.clearRect(0, 0, mw, mh); t2.drawImage(hd_t, 0, 0, mw, mh); x.drawImage(hd_t2, 0, 0, lw, lh); }
        x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, lw, lh); x.globalCompositeOperation = 'source-over';
      };
      tint(hd_c, 1.6, 'rgb(170,200,255)');   // the burn: tight and bright, hugging the outline
      tint(hd_h, 5, 'rgb(46,96,255)');       // the halo: wide and deep blue
      const scanY = (r0 + ((t * .2) % 1) * (r1 - r0 + 14) - 7) * CH * Q, sw = 6 * CH * Q, bx = hd_b.getContext('2d');   // the wave of light
      bx.setTransform(1, 0, 0, 1, 0, 0); bx.globalCompositeOperation = 'source-over'; bx.clearRect(0, 0, lw, lh); bx.drawImage(hd_c, 0, 0);
      const bgr = bx.createLinearGradient(0, scanY - sw, 0, scanY + sw); bgr.addColorStop(0, 'rgba(255,255,255,0)'); bgr.addColorStop(.5, '#fff'); bgr.addColorStop(1, 'rgba(255,255,255,0)');
      bx.globalCompositeOperation = 'destination-in'; bx.fillStyle = bgr; bx.fillRect(0, 0, lw, lh); bx.globalCompositeOperation = 'source-over';
      const gx = hd_g.getContext('2d'), W = hd_g.width, H = hd_g.height, pulse = .9 + .1 * Math.sin(t * 2.3);
      gx.setTransform(1, 0, 0, 1, 0, 0); gx.globalCompositeOperation = 'source-over'; gx.globalAlpha = 1; gx.clearRect(0, 0, W, H); gx.imageSmoothingEnabled = true; gx.globalCompositeOperation = 'lighter';
      gx.globalAlpha = .55 * pulse * heroA; gx.drawImage(hd_h, 0, 0, W, H);
      gx.globalAlpha = .75 * pulse * heroA; gx.drawImage(hd_c, 0, 0, W, H);
      gx.globalAlpha = .7 * heroA; gx.drawImage(hd_b, 0, 0, W, H);
      // sparks: from the cells just outside the shield, soft points rise and die
      const dist = hd_dist && hd_dist.length === N ? hd_dist : (hd_dist = new Uint8Array(N));
      for (let o = 0; o < N; o++) dist[o] = own_[o] >= 0 || !ext[o] ? 0 : 9;
      for (let pass = 0; pass < 4; pass++) for (let o = 0; o < dist.length; o++) { if (dist[o] === 0) continue; const c = o % G, r = (o / G) | 0; let m = dist[o];
        if (c > 0) m = Math.min(m, dist[o - 1] + 1); if (c < G - 1) m = Math.min(m, dist[o + 1] + 1); if (r > 0) m = Math.min(m, dist[o - G] + 1); if (r < Rr - 1) m = Math.min(m, dist[o + G] + 1); dist[o] = m; }
      if (!hd_glow) {   // one soft light sprite
        hd_glow = document.createElement('canvas'); hd_glow.width = hd_glow.height = 64; const sx = hd_glow.getContext('2d'), gr = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, 'rgba(225,236,255,1)'); gr.addColorStop(.22, 'rgba(120,165,255,.75)'); gr.addColorStop(.55, 'rgba(46,96,255,.25)'); gr.addColorStop(1, 'rgba(20,48,156,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
      }
      for (let o = 0; o < dist.length; o++) {
        const d = dist[o]; if (d < 1 || d > 4 || ahash(o % G, (o / G) | 0, 57) >= .1 / d) continue;
        const cx = o % G, cy = (o / G) | 0, life = (t * (.3 + .25 * ahash(cx, cy, 59)) + ahash(cx, cy, 61)) % 1;
        const a = (1 - life) * Math.min(1, life * 5) * (.55 / d) * heroA; if (a < .006) continue;
        const x = (cx + .5) * CW + Math.sin(t * 1.7 + cy) * 3 * life, y = (cy + .5) * CH - life * CH * 3.2, s2 = CW * (1.3 - .7 * life) * dpr;
        gx.globalAlpha = Math.min(1, a); gx.drawImage(hd_glow, x * dpr - s2 / 2, y * dpr - s2 / 2, s2, s2);
      }
      // keep the shield's face clear: cut the true silhouette out of the glow
      gx.globalAlpha = 1; gx.globalCompositeOperation = 'destination-out'; gx.setTransform(dpr, 0, 0, dpr, 0, 0); gx.fillStyle = '#000'; gx.fill(solid);
      gx.setTransform(1, 0, 0, 1, 0, 0); gx.globalCompositeOperation = 'source-over';
      const op = dg.globalCompositeOperation; dg.globalCompositeOperation = 'lighter'; dg.globalAlpha = 1; dg.drawImage(hd_g, 0, 0); dg.globalCompositeOperation = op;
    }
    dg.globalAlpha = 1;
  }
  let hd_dist = null, hd_glow = null, hd_path = null, hd_ext = null, hd_q = null, hd_m = null, hd_c = null, hd_h = null, hd_b = null, hd_t = null, hd_t2 = null, hd_g = null;
  requestAnimationFrame(frame);
  window.__glReady = true;
}
