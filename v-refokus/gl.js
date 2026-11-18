/* One WebGL context for the hero and the pinned Core section.
   Pipeline family from the reference: height RT -> normal RT -> metal plane with displacement,
   plus a physical-material subject, an env built in code, and a composer. All rewritten for BitGo. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

try { start(); } catch (e) { console.warn('WebGL unavailable', e); }

function start() {
  const heroEl = document.getElementById('hero');
  const coreEl = document.getElementById('core');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  let pr = 1, cost = 0, slow = 0;
  let soft = false;
  try { const gl0 = renderer.getContext(), ext = gl0.getExtension('WEBGL_debug_renderer_info'); soft = ext && /swiftshader|llvmpipe|software/i.test(gl0.getParameter(ext.UNMASKED_RENDERER_WEBGL)); } catch (e) {}
  if (soft) pr = 0.5;
  const DPR = () => Math.min(devicePixelRatio || 1, 1.5, pr);
  renderer.setPixelRatio(DPR());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = 0.5;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03071a);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  const FOV_H = 2 * 9 * Math.tan(THREE.MathUtils.degToRad(35 / 2));

  /* ---------- generated environment: strips and softboxes, no image ---------- */
  function makeEnv() {
    const env = new THREE.Scene();
    const sph = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ color: 0x02061a, side: THREE.BackSide }));
    env.add(sph);
    const panel = (w, h, col, k, pos) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); return m;
    };
    const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    for (let i = 0; i < 26; i++) {           // tall strips fanning around the front hemisphere
      const az = THREE.MathUtils.degToRad(-84 + i * (168 / 25));
      const r = 22;
      const c = i % 5 === 0 ? 0xffffff : i % 3 === 0 ? 0x7fa8ff : 0x2f63ff;
      panel(0.35 + rnd() * 1.1, 50, c, 3 + rnd() * 9, [Math.sin(az) * r, 0, Math.cos(az) * r]);
    }
    for (let i = 0; i < 12; i++) {           // rim strips behind, for glass edges
      const az = THREE.MathUtils.degToRad(100 + i * 14);
      panel(0.6 + rnd(), 50, i % 2 ? 0xffffff : 0x4d78ff, 4 + rnd() * 6, [Math.sin(az) * 22, 0, Math.cos(az) * 22]);
    }
    panel(34, 14, 0xdfe9ff, 2.6, [0, 22, 6]);   // top softbox
    panel(14, 30, 0x1647db, 3.2, [-26, 2, 4]);  // blue wash left
    panel(10, 26, 0xffffff, 3.4, [24, 0, 8]);   // key strip right
    panel(30, 6, 0x1647db, 2.2, [0, -20, 8]);   // floor glow
    const pm = new THREE.PMREMGenerator(renderer);
    const tex = pm.fromScene(env, 0.03).texture;
    pm.dispose();
    return tex;
  }
  scene.environment = makeEnv();

  /* ---------- curtain: height RT -> normal RT -> metal plane ---------- */
  const RTW = 1024, RTH = 512;
  const rtOpt = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  const heightRT = new THREE.WebGLRenderTarget(RTW, RTH, rtOpt);
  const normalRT = new THREE.WebGLRenderTarget(RTW, RTH, rtOpt);
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
        float w = mix(.2,.5,r1);
        float off = (r2-.5)*.2;
        float d = abs(f-off)/w;
        float ridge = pow(cos(clamp(d,0.,1.)*1.5708), 1.4);
        float amp = .5 + .5*vn(vec2(id*.8, vUv.y*2.2 - uT*.12 + r3*10.));
        float arch = .6 + .4*sin(vUv.x*3.14159);
        float hg = ridge*amp*arch;
        float sp = .12 + r1*.22;
        float ph = fract(vUv.y*.9 - uT*sp*(r2>.5?1.:-1.) + r3);
        float pulse = smoothstep(0.,.04,ph)*(1.-smoothstep(.04,.22,ph));
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
        vec3 n = normalize(vec3(-(r-l)*uS, -(u-d)*uS*.5, 1.));
        gl_FragColor = vec4(n*.5+.5, 1.); }`
  });
  const quad = new THREE.Mesh(quadGeo, heightMat);
  const quadScene = new THREE.Scene(); quadScene.add(quad);
  const dimU = { value: 1 };
  const curtainMat = new THREE.MeshPhysicalMaterial({
    color: 0x4a6fe0, metalness: 1, roughness: 0.24, envMapIntensity: 0.5,
    displacementMap: heightRT.texture, displacementScale: 1.0, displacementBias: -0.5,
    normalMap: normalRT.texture, normalScale: new THREE.Vector2(1.3, 1.3),
    emissive: new THREE.Color(0.1, 0.34, 1.0), emissiveMap: heightRT.texture, emissiveIntensity: 0.6
  });
  curtainMat.onBeforeCompile = sh => {
    sh.uniforms.uDim = dimU;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDim;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n vec2 q = vEmissiveMapUv-.5; float vg = 1.-smoothstep(.22,.82,length(q*vec2(1.,1.2))); gl_FragColor.rgb *= uDim*mix(.38,1.,vg);');
  };
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(31, 18, 300, 24), curtainMat);
  curtain.position.set(0, 0, -4.2);
  scene.add(curtain);

  /* ---------- the G, built from six analytic pieces ---------- */
  const gObj = new THREE.Group(); scene.add(gObj);
  const EX = { depth: 0.36, bevelEnabled: true, bevelThickness: 0.11, bevelSize: 0.1, bevelOffset: -0.1, bevelSegments: 12, curveSegments: 56 };
  const arcShape = (r0, r1, a0, a1) => { const s = new THREE.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true); s.closePath(); return s; };
  const barShape = (x0, y0, x1, y1, r) => { const s = new THREE.Shape(); s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1); s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0); return s; };
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x9db8ff, metalness: 0, roughness: 0.05, transmission: 1, thickness: 1.2, ior: 1.52,
    attenuationColor: new THREE.Color(0x1238d8), attenuationDistance: 0.55, clearcoat: 1, clearcoatRoughness: 0.03,
    iridescence: 0.45, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 620], envMapIntensity: 1.8,
    emissive: new THREE.Color(0x2f63ff), emissiveIntensity: 0, specularIntensity: 1
  });
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xeaf0ff, metalness: 1, roughness: 0.09, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, emissive: new THREE.Color(0x2f63ff), emissiveIntensity: 0 });
  const A0 = THREE.MathUtils.degToRad(55), SPAN = THREE.MathUtils.degToRad(305), GAP = 0.03, NARC = 5;
  const pieces = [];
  for (let i = 0; i < NARC + 1; i++) {
    const isBar = i === NARC;
    let geo, dir;
    if (!isBar) {
      const a0 = A0 + i * SPAN / NARC + GAP, a1 = A0 + (i + 1) * SPAN / NARC - GAP;
      geo = new THREE.ExtrudeGeometry(arcShape(0.64, 1.0, a0, a1), EX);
      const mid = (a0 + a1) / 2; dir = new THREE.Vector3(Math.cos(mid), Math.sin(mid), 0);
    } else {
      geo = new THREE.ExtrudeGeometry(barShape(0.16, 0.05, 1.0, 0.33, 0.1), EX);
      dir = new THREE.Vector3(0.75, 0.66, 0);
    }
    geo.translate(0, 0, -EX.depth / 2);
    const mesh = new THREE.Mesh(geo, (isBar ? chrome : glass).clone());
    const pivot = new THREE.Group(); pivot.add(mesh); gObj.add(pivot);
    const rnd = (s) => { const x = Math.sin(s * 91.7 + i * 12.3) * 43758.5; return x - Math.floor(x); };
    pieces.push({
      pivot, mesh, dir, isBar,
      from: { p: dir.clone().multiplyScalar(5.5).add(new THREE.Vector3((rnd(1) - .5) * 3, (rnd(2) - .5) * 3, 3 + rnd(3) * 4)), r: new THREE.Euler((rnd(4) - .5) * 5, (rnd(5) - .5) * 5, (rnd(6) - .5) * 4), s: 0.4 },
      lift: 0, glow: 0, delay: i * 0.13
    });
  }

  /* lights on top of the env: a cool key and a blue kicker */
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 4, 6); scene.add(key);
  const kick = new THREE.PointLight(0x4d78ff, 90, 20, 2); kick.position.set(4, -2, 3); scene.add(kick);

  /* ---------- post ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // bloom turns a single Inf/NaN pixel into a black block, so scrub them first
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c.rgb)) || any(isinf(c.rgb))) c = vec4(0.,0.,0.,1.); c.rgb = min(c.rgb, vec3(12.)); gl_FragColor = c; }'
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.5, 0.9);
  bloom.enabled = !soft && !window.__nb;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let W = 0, H = 0, dirty = true;
  const resize = (force) => {
    const w = innerWidth, h = innerHeight;
    if (!force && w === W && Math.abs(h - H) < 140) return;
    W = w; H = h;
    renderer.setPixelRatio(DPR()); renderer.setSize(w, h, false);
    composer.setPixelRatio(DPR()); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  };
  addEventListener('resize', () => resize());
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; dirty = true; }, { passive: true });
  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  resize(true);

  /* ---------- state ---------- */
  const cur = { x: 0, y: 0, s: 1, dim: 1, ry: 0, rx: 0, rz: 0, expl: 0 };
  const ease = t => 1 - Math.pow(1 - t, 4);
  const back = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const t0 = performance.now(); let last = t0;
  const vis = { hero: true, core: false };
  new IntersectionObserver(es => es.forEach(e => { vis[e.target === heroEl ? 'hero' : 'core'] = e.isIntersecting; }), { rootMargin: '10% 0px' }).observe(heroEl);
  new IntersectionObserver(es => es.forEach(e => { vis.core = e.isIntersecting; }), { rootMargin: '10% 0px' }).observe(coreEl);
  const dv = new THREE.Vector3();

  let lastR = 0, lastKey = '';
  function frame(now) {
    requestAnimationFrame(frame);
    const on = vis.hero || vis.core;
    canvas.classList.toggle('on', on);
    if (!on) { last = now; return; }
    if (soft && now - lastR < 900) return;
    lastR = now;
    if (reduce && !dirty) return;
    dirty = false;
    const dt = Math.min(soft ? 0.5 : 0.05, (now - last) / 1000); last = now;
    const time = reduce ? 2.4 : (now - t0) / 1000;
    const k = 1 - Math.exp(-dt * 4.2);

    const aspect = W / H, visW = FOV_H * aspect, mobile = aspect < 0.9;
    const hr = heroEl.getBoundingClientRect();
    const heroOn = hr.bottom > 0 && hr.top < H;
    const mode = heroOn ? 'hero' : 'core';
    const rg = heroOn ? hr : coreEl.getBoundingClientRect();
    const key = Math.round(rg.top) + ':' + Math.round(rg.bottom) + ':' + H;
    if (key !== lastKey) {
      lastKey = key;
      const t = rg.top, b = rg.bottom, ft = t > 2 ? 260 : 0, fb = b < H - 2 ? 260 : 0;
      const m = `linear-gradient(to bottom, transparent ${t}px, #000 ${Math.max(t + ft, 0)}px, #000 ${b - fb}px, transparent ${b}px)`;
      canvas.style.maskImage = m; canvas.style.webkitMaskImage = m;
    }
    const active = window.__core ? window.__core.active : -1;
    let tx, ty, ts, tdim, tex = 0, trz = 0;
    if (mode === 'hero') {
      const p = clamp(-hr.top / H);
      tx = mobile ? 0 : visW * 0.2; ty = (mobile ? FOV_H * 0.18 : FOV_H * 0.02) + p * FOV_H * 0.22;
      ts = mobile ? visW * 0.34 : FOV_H * 0.3; tdim = 1; tex = p * 0.9;
    } else if (active < 0) {
      tx = mobile ? 0 : visW * 0.2; ty = mobile ? FOV_H * 0.2 : 0; ts = mobile ? visW * 0.32 : FOV_H * 0.27; tdim = 0.42; tex = 0.15;
    } else {
      tx = mobile ? 0 : -visW * 0.17; ty = mobile ? FOV_H * 0.2 : 0; ts = mobile ? visW * 0.3 : FOV_H * 0.26; tdim = 0.4; tex = 0.1;
    }
    if (reduce) { cur.x = tx; cur.y = ty; cur.s = ts; cur.dim = tdim; cur.expl = tex; } else {
      cur.x += (tx - cur.x) * k; cur.y += (ty - cur.y) * k; cur.s += (ts - cur.s) * k; cur.dim += (tdim - cur.dim) * k; cur.expl += (tex - cur.expl) * k;
    }
    ptr.sx += (ptr.x - ptr.sx) * k * .6; ptr.sy += (ptr.y - ptr.sy) * k * .6;

    gObj.position.set(cur.x, cur.y, 0);
    gObj.scale.setScalar(cur.s);
    gObj.rotation.y = Math.sin(time * 0.5) * 0.26 + ptr.sx * 0.35 + (mode === 'hero' ? 0 : Math.sin(time * .3) * .08);
    gObj.rotation.x = ptr.sy * 0.2 + Math.sin(time * 0.37) * 0.05;
    gObj.rotation.z = Math.sin(time * 0.23) * 0.04;
    dimU.value = cur.dim;
    curtain.position.x = ptr.sx * -0.5;

    // pieces: intro assembly (time based, done by ~2.4s), explode on scroll, lift on the active service
    const intro = reduce ? 99 : time;
    pieces.forEach((pc, i) => {
      const u = clamp((intro - 0.15 - pc.delay) / 1.5);
      const e = back(u > 0 ? u : 0), eo = ease(u);
      const f = 1 - eo;
      const lt = mode === 'core' && active >= 0 && i === active ? 1 : 0;
      pc.lift += (lt - pc.lift) * k * 1.3;
      const gl = mode === 'core' && active >= 0 ? (i === active ? 1 : 0) : 0;
      pc.glow += (gl - pc.glow) * k * 1.2;
      dv.copy(pc.dir).multiplyScalar(cur.expl * 0.9 + pc.lift * 0.26);
      pc.pivot.position.copy(dv).add(new THREE.Vector3().copy(pc.from.p).multiplyScalar(f));
      pc.pivot.position.z += pc.lift * 0.55;
      pc.pivot.rotation.set(pc.from.r.x * f, pc.from.r.y * f, pc.from.r.z * f);
      pc.pivot.scale.setScalar(THREE.MathUtils.lerp(pc.from.s, 1, e) * (1 + pc.lift * 0.05));
      pc.mesh.material.emissiveIntensity = pc.glow * 0.55;
      if (!pc.isBar) pc.mesh.material.attenuationDistance = THREE.MathUtils.lerp(0.55, 0.3, pc.glow);
    });

    const f0 = performance.now();
    heightMat.uniforms.uT.value = time;
    renderer.setRenderTarget(heightRT); quad.material = heightMat; renderer.render(quadScene, ortho);
    renderer.setRenderTarget(normalRT); quad.material = normalMat; renderer.render(quadScene, ortho);
    renderer.setRenderTarget(null);
    composer.render();
    window.__cost = Math.round(cost);
    cost = cost * 0.7 + (performance.now() - f0) * 0.3;
    if (cost > 220 && ++slow > 3) { slow = 0; if (bloom.enabled) bloom.enabled = false; else if (pr > 0.55) { pr = Math.max(0.55, pr - 0.2); resize(true); } }
  }
  requestAnimationFrame(frame);
  window.__glReady = true;
}
