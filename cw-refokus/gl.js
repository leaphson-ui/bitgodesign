/* Custody Wallets: the homepage's fixed WebGL scene (metal light curtain + glass BitGo shield) with two library
   models. The wallet leads the hero, sweeps behind the client logos, frosts for long-term holdings and opens and
   closes through the four steps; three glass keys stand together in cold storage for Key management; the shield
   returns for the closing call to action. The canvas is never hidden or resized by scroll, so nothing can flash. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { calmCurtain } from '../shared/system/calm.js';   // calmer curtain presets (?calm=1..3)
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { TAAPass, taaStep } from '../shared/system/taa.js';
import { wedgeSet, wholeGeo } from './shield.js';
import { buildKey } from './key.js';
import { create as createSafe } from '../shared/models/custody-safe.js';
import { create as createLibKey } from '../shared/models/key.js';

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
  const bgCol = new THREE.Color(0x03071a);
  scene.background = bgCol;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  const FOV_H = 2 * 9 * Math.tan(THREE.MathUtils.degToRad(35 / 2));

  /* ---------- generated environment: strips and softboxes, no image ---------- */
  function makeEnv() {
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ color: 0x02061a, side: THREE.BackSide })));
    const panel = (w, h, col, k, pos) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
    };
    const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    for (let i = 0; i < 26; i++) {
      const az = THREE.MathUtils.degToRad(-84 + i * (168 / 25)), r = 22;
      const c = i % 5 === 0 ? 0xffffff : i % 3 === 0 ? 0x7fa8ff : 0x2f63ff;
      panel(0.35 + rnd() * 1.1, 50, c, 3 + rnd() * 9, [Math.sin(az) * r, 0, Math.cos(az) * r]);
    }
    for (let i = 0; i < 12; i++) {
      const az = THREE.MathUtils.degToRad(100 + i * 14);
      panel(0.6 + rnd(), 50, i % 2 ? 0xffffff : 0x4d78ff, 4 + rnd() * 6, [Math.sin(az) * 22, 0, Math.cos(az) * 22]);
    }
    panel(34, 14, 0xc6d4ff, 1.8, [0, 22, 6]);
    panel(14, 30, 0x1647db, 3.2, [-26, 2, 4]);
    panel(10, 26, 0xe2e9ff, 2.4, [24, 0, 8]);
    panel(30, 6, 0x1647db, 2.2, [0, -20, 8]);
    const pm = new THREE.PMREMGenerator(renderer);
    const tex = pm.fromScene(env, 0.03).texture;
    pm.dispose();
    return tex;
  }
  scene.environment = makeEnv();

  /* ---------- curtain: height RT -> normal RT -> metal plane (higher resolution, analytic ridge profile) ---------- */
  const RTW = soft ? 1024 : 2048, RTH = soft ? 512 : 1024;
  const rtOpt = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  const heightRT = new THREE.WebGLRenderTarget(RTW, RTH, rtOpt);
  const normalRT = new THREE.WebGLRenderTarget(RTW, RTH, rtOpt);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  heightRT.texture.anisotropy = maxAniso; normalRT.texture.anisotropy = maxAniso;
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const vsh = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const heightMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uN: { value: 38 } }, vertexShader: vsh,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform float uT; uniform float uN;
      float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        float a=h11(i.x+i.y*57.), b=h11(i.x+1.+i.y*57.), c=h11(i.x+(i.y+1.)*57.), d=h11(i.x+1.+(i.y+1.)*57.);
        return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
      void main(){
        float x = vUv.x*uN; float id = floor(x); float f = fract(x)-.5;
        float r1=h11(id+1.7), r2=h11(id*3.1+9.2), r3=h11(id*7.7+4.4);
        float w = mix(.24,.5,r1);
        float off = (r2-.5)*.16;
        float d = abs(f-off)/w;
        float c = clamp(d,0.,1.);
        float ridge = 0.5+0.5*cos(c*3.14159);       // smooth cosine profile, zero slope at both ends
        ridge = ridge*ridge*(3.-2.*ridge);
        float amp = .5 + .5*vn(vec2(id*.8, vUv.y*2.2 - uT*.12 + r3*10.));
        float arch = .6 + .4*sin(vUv.x*3.14159);
        float hg = ridge*amp*arch;
        float sp = .12 + r1*.22;
        float ph = fract(vUv.y*.9 - uT*sp*(r2>.5?1.:-1.) + r3);
        float pulse = smoothstep(0.,.08,ph)*(1.-smoothstep(.08,.3,ph));
        pulse *= step(.5, r1*.5+r2*.5+.12)*ridge*ridge;
        gl_FragColor = vec4(hg, hg*.5+pulse*.8, hg*.9+pulse*1.3, 1.);
      }`
  });
  const normalMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: heightRT.texture }, uS: { value: 7 } }, vertexShader: vsh,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D uMap; uniform float uS;
      void main(){ vec2 e = vec2(1./${RTW}.,1./${RTH}.);
        float l=texture2D(uMap,vUv-vec2(e.x,0.)).r, r=texture2D(uMap,vUv+vec2(e.x,0.)).r;
        float d=texture2D(uMap,vUv-vec2(0.,e.y)).r, u=texture2D(uMap,vUv+vec2(0.,e.y)).r;
        vec3 n = normalize(vec3(-(r-l)*uS*.5, -(u-d)*uS*.25, 1.));
        gl_FragColor = vec4(n*.5+.5, 1.); }`
  });
  const quad = new THREE.Mesh(quadGeo, heightMat);
  const quadScene = new THREE.Scene(); quadScene.add(quad);
  const dimU = { value: 1 }, silverU = { value: 0 };
  const curtainMat = new THREE.MeshPhysicalMaterial({
    color: 0x2c4cc4, metalness: 1, roughness: 0.3, envMapIntensity: 0.38,
    displacementMap: heightRT.texture, displacementScale: 1.0, displacementBias: -0.5,
    normalMap: normalRT.texture, normalScale: new THREE.Vector2(1.3, 1.3),
    emissive: new THREE.Color(0.06, 0.22, 0.86), emissiveMap: heightRT.texture, emissiveIntensity: 0.34
  });
  curtainMat.onBeforeCompile = sh => {
    sh.uniforms.uDim = dimU; sh.uniforms.uSilver = silverU;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDim; uniform float uSilver;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n vec2 q = vEmissiveMapUv-.5; float vg = 1.-smoothstep(.22,.82,length(q*vec2(1.,1.2))); float lu = dot(gl_FragColor.rgb, vec3(.3,.45,.25)); gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(lu)*vec3(.82,.9,1.1), uSilver*.7); gl_FragColor.rgb *= uDim*mix(.38,1.,vg);');
  };
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(31, 18, soft ? 400 : 1100, soft ? 30 : 56), curtainMat);
  curtain.position.set(0, 0, -4.2);
  scene.add(curtain);

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
  /* library models: the wallet, and three whole keys (client, backup, platform) */
  const wallet = createSafe({});   // the custody safe: three keys held offline in cold storage
  const walletGroup = new THREE.Group(); walletGroup.add(wallet.object); walletGroup.visible = false; scene.add(walletGroup);
  const keys3 = [0, 1, 2].map(() => createLibKey({}));
  const keys3Group = new THREE.Group(); keys3Group.visible = false; scene.add(keys3Group);
  keys3.forEach((k, i) => { const g = new THREE.Group(); g.add(k.object); g.position.set((i - 1) * 0.66, (1 - Math.abs(i - 1)) * 0.12, (1 - Math.abs(i - 1)) * 0.2); g.rotation.z = (i - 1) * -0.2; keys3Group.add(g); });
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
  const IDS = ['hero', 'trust', 'intro', 'keyman', 'keys', 'stats', 'feats', 'clients', 'faq', 'entities', 'cta', 'news'];
  const EL = Object.fromEntries(IDS.map(i => [i, $(i)]));
  const SEE = ['hero', 'trust', 'intro', 'keyman', 'keys', 'stats', 'feats', 'cta', 'news'];   // sections with no opaque background
  const INK = new THREE.Color(0x03071a), INK2 = new THREE.Color(0x060d2e), BLUE = new THREE.Color(0x0e3bd0);
  const logos = () => [...document.querySelectorAll('#trust .mq-t img')];
  let logoEls = [];

  const base = { x: .2, y: .02, s: .3, expl: 0, glow: 0, dim: 1, N: 38, tilt: 0, yaw: 0, cy: 0, cz: -4.2, rz: 0, silver: 0, blue: 0, ry: 0, bg2: 0, speed: 1, frost: 0, key: 0, kx: 0, kglow: 0, vis: 1, wal: 0, wopen: 0, wcold: 0, wlift: 0, k3: 0 };
  const KEYS = Object.keys(base);
  // each pose gives only what differs from base; `mode` decides which set of pieces is on show
  function poseFor(id, r, ctx) {
    const { m, active } = ctx;
    switch (id) {
      case 'hero': { const p = clamp(-r.top / H); return { mode: 'whole', wal: 1, x: m ? 0 : .22, y: (m ? .18 : .02) + p * .22, s: m ? .34 : .3, wopen: p * .3, wcold: .2, dim: .9 }; }
      case 'trust': { const t = clamp((H * .55 - r.top) / r.height); return { mode: 'whole', wal: 1, x: lerp(-.36, .36, t) * (m ? .6 : 1), y: -.3, s: m ? .16 : .14, glow: 1, dim: .13, N: 64, tilt: -.5, cy: -1.2, cz: -3.6, ry: .9 }; }
      case 'intro': return { mode: 'whole', wal: 1, x: 0, y: m ? -.3 : -.33, s: m ? .22 : .22, wcold: 1, dim: .14, N: 30 };
      case 'keyman': return { mode: 'whole', wal: 1, x: m ? 0 : .25, y: m ? .26 : 0, s: m ? .28 : .32, wopen: .8, wcold: .65, dim: .12, N: 70, silver: 1, speed: .12 };
      case 'keys': {
        const sx = m ? 0 : -.2, sy = m ? .22 : 0, ks = m ? .27 : .3;
        if (active === 0) return { mode: 'whole', wal: 1, x: sx, y: sy, s: ks, wopen: .5, dim: .2, N: 42 };
        if (active === 1) return { mode: 'whole', wal: 1, x: sx, y: sy, s: ks, wopen: 1, wlift: 1, glow: .4, dim: .26, N: 36 };
        if (active === 2) return { mode: 'whole', wal: 1, x: sx, y: sy, s: ks, wopen: 1, wlift: .45, wcold: .55, dim: .16, N: 56, silver: .45, speed: .4 };
        if (active === 3) return { mode: 'whole', wal: 1, x: sx, y: sy, s: ks, wopen: 0, wcold: .3, glow: .8, dim: .34, N: 30, blue: .3 };
        return { mode: 'whole', wal: 1, x: m ? 0 : .27, y: m ? .26 : 0, s: m ? .24 : .28, dim: .2, N: 40 };     // beside the heading, not behind it
      }
      case 'stats': return { mode: 'whole', wal: 1, x: m ? 0 : .3, y: m ? .26 : .02, s: m ? .18 : .22, dim: .08, N: 16, yaw: .35 };
      case 'feats': return { mode: 'whole', wal: 1, vis: 0, x: m ? 0 : .3, y: .02, s: .22, dim: .4, N: 26, blue: 1 };
      case 'news': return { mode: 'whole', vis: 0, x: m ? 0 : .24, y: m ? .9 : .85, s: m ? .34 : .36, dim: .6, N: 90, blue: .55, tilt: -.45, cy: -1.3, cz: -3.4 };   // the shield rises away with the call to action
      case 'cta': { const t = clamp((H * .75 - r.top) / (r.height * .8)); return { mode: t > .985 ? 'whole' : 'three', x: m ? 0 : .24, y: m ? .22 : 0, s: m ? .34 : .36, expl: 1.2 * (1 - sm(0, 1, t)), dim: .4, N: 30, blue: 1, glow: .5 * sm(.7, 1, t) }; }
      default: return { mode: 'whole', x: 0, y: 0, s: .0001, expl: 0, dim: .3 };    // covered by an opaque section
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
    KEYS.forEach(k => { cur[k] = reduce ? tgt[k] : cur[k] + (tgt[k] - cur[k]) * kk; });
    ptr.sx += (ptr.x - ptr.sx) * kk * .6; ptr.sy += (ptr.y - ptr.sy) * kk * .6;
    const expl = curSet === 'whole' ? 0 : cur.expl;

    if (!see) { return; }                                   // covered by opaque sections: poses are snapped, nothing drawn
    if (reduce && !dirty) return;
    dirty = false;

    gObj.position.set(cur.x * visW, cur.y * FOV_H, 0);
    const km = clamp(cur.key), ke = km * km * (3 - 2 * km), vv = clamp(cur.vis), ve = vv * vv * (3 - 2 * vv);
    const ew = x => { const c = clamp(x); return c * c * (3 - 2 * c); };
    const we = ew(cur.wal), k3e = ew(cur.k3), sw = clamp(1 - ke - we - k3e);
    gObj.scale.setScalar(Math.max(.0001, cur.s * Sunit * sw * (.7 + .3 * ve)));
    gObj.visible = sw > .005 && ve > .01;
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

    // the wallet and the three keys follow the same pose, and grow or shrink in as they take over
    const sway = Math.sin(time * 0.5) * 0.26 + ptr.sx * 0.35;
    walletGroup.visible = we * ve > .005;
    if (walletGroup.visible) {
      walletGroup.position.set(cur.x * visW, cur.y * FOV_H, .2);
      walletGroup.scale.setScalar(Math.max(.0001, cur.s * Sunit * 0.95 * we * (.6 + .4 * ve)));
      walletGroup.rotation.set(0.1 + ptr.sy * 0.12 + Math.sin(time * .37) * .03, 0.42 + sway * 0.6, Math.sin(time * .23) * .02);
      wallet.update(reduce ? 3 : time, { open: clamp(cur.wopen), cold: clamp(cur.wcold), lift: clamp(cur.wlift) });
    }
    keys3Group.visible = k3e * ve > .005;
    if (keys3Group.visible) {
      keys3Group.position.set(cur.x * visW, cur.y * FOV_H, .2);
      keys3Group.scale.setScalar(Math.max(.0001, cur.s * Sunit * 0.62 * k3e * (.6 + .4 * ve)));
      keys3Group.rotation.set(ptr.sy * .15 + Math.sin(time * .37) * .05, sway * 0.6, 0.12);
      keys3.forEach(k => k.update(reduce ? 3 : time, { split: 0 }));
    }
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
      const e = back(u > 0 ? u : 0), eo = ease(u), f = 1 - eo;
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
      pc.mesh.material.opacity = Math.min(1, sw * 1.5) * ve;
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
