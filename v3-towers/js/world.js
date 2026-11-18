import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as X from './tex.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SHOTS, PALS, TX, TZ, TH } from './shots.js';

// One scene, one camera path. Old-school financial district: black-steel towers, a warm lobby pavilion,
// a stone colonnade avenue, five towers, a sun-shafted bank hall, a vault, a lit tower with a trading floor,
// a night street with a ticker, and a blue tower that the camera climbs into dawn.
// All geometry and textures are generated here.

const BLUE = 0x1647DB;
const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc3 = new THREE.Vector3(), eu = new THREE.Euler();
let rs = 42; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
const R = (a, b) => a + rnd() * (b - a);
const col = (h) => new THREE.Color(h);

export function createWorld(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  let soft = false;
  try { const gl = renderer.getContext(); const ex = gl.getExtension('WEBGL_debug_renderer_info'); soft = !/hq/.test(location.search) && ex && /swiftshader|llvmpipe|software/i.test(gl.getParameter(ex.UNMASKED_RENDERER_WEBGL)); } catch (e) {}
  renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x5b78cb, 0.004);
  const cam = new THREE.PerspectiveCamera(46, 1, 0.4, 1700);
  const U = { uTime: { value: 0 }, uLit: { value: 0.7 } };

  // ---------- sky ----------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { uTop: { value: col(BLUE) }, uHor: { value: col('#86a3ea') }, uWarm: { value: col('#ffb680') }, uWarmAmt: { value: .5 }, uStars: { value: 0 }, uTime: U.uTime },
    vertexShader: `varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vD; uniform vec3 uTop,uHor,uWarm; uniform float uWarmAmt,uStars,uTime;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float nz(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){
        vec3 d=normalize(vD); float y=max(d.y,0.);
        vec3 c=mix(uHor,uTop,pow(y,.5));
        float front=max(dot(normalize(d.xz+1e-4),vec2(.35,-.94)),0.);
        c=mix(c,uWarm,uWarmAmt*exp(-y*5.5)*(.25+.75*pow(front,2.)));
        vec2 cp=d.xz/(y+.35)*1.6+vec2(uTime*.004,0.);
        float cl=nz(cp*vec2(1.2,3.5))*.6+nz(cp*vec2(2.5,7.))*.4; cl=smoothstep(.5,.95,cl)*smoothstep(.04,.3,y);
        c+=cl*.07*(uWarm*.7+.3)*(1.-uStars);
        if(uStars>0.){ vec2 g=floor(d.xz/(y+.2)*140.); float s=step(.9965,h(g)); c+=s*uStars*smoothstep(.1,.4,y)*vec3(.8,.9,1.); }
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

  // ---------- environment for glass: a blue sky dome, warm sun, dark skyline slabs ----------
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vD; void main(){ vec3 d=normalize(vD); float h=d.y;
      vec3 top=vec3(.012,.09,.75)*1.5, hor=vec3(.7,.8,1.)*1.7, low=vec3(.01,.012,.02);
      vec3 c = h>0. ? mix(hor,top,pow(h,.45)) : mix(hor*.12,low,pow(-h,.4));
      c+=vec3(3.2,2.2,1.3)*pow(max(dot(d,normalize(vec3(.55,.3,.6))),0.),30.); gl_FragColor=vec4(c,1.); }`,
  })));
  const dk = new THREE.MeshBasicMaterial({ color: 0x020306 });
  for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + R(-.1, .1); const hh = R(10, 46); const b = new THREE.Mesh(new THREE.BoxGeometry(R(6, 14), hh, R(6, 14)), dk); b.position.set(Math.cos(a) * 52, hh / 2 - 6, Math.sin(a) * 52); envScene.add(b); }
  const envTex = pm.fromScene(envScene, 0.015).texture;
  const envMats = []; // [material, factor]
  const withEnv = (m, k = 1) => { m.envMap = envTex; m.envMapIntensity = k; envMats.push([m, k]); return m; };

  // ---------- lights ----------
  const sunDir = new THREE.Vector3(-0.5, -0.72, -0.3).normalize();
  const sun = new THREE.DirectionalLight(0xffd6aa, 3.6);
  const SC = new THREE.Vector3(0, 0, -190);
  sun.position.copy(SC).addScaledVector(sunDir, -330); sun.target.position.copy(SC);
  sun.castShadow = true; sun.shadow.mapSize.set(soft ? 1024 : 4096, soft ? 1024 : 4096);
  const sc = sun.shadow.camera; sc.left = -170; sc.right = 170; sc.top = 170; sc.bottom = -170; sc.near = 10; sc.far = 720;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.06; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0x6f93ff, 0x1c2240, .75); scene.add(hemi);
  const L1 = new THREE.PointLight(0xffd7a8, 0, 70, 2), L2 = new THREE.PointLight(0xffb870, 0, 110, 2); scene.add(L1, L2);

  // ---------- materials ----------
  const stoneT = X.ashlar();
  const stoneMat = withEnv(new THREE.MeshStandardMaterial({ color: 0xc8c7c4, map: stoneT.map, bumpMap: stoneT.bump, bumpScale: 1.4, roughness: .85 }), .5);
  const fluteMat = withEnv(new THREE.MeshStandardMaterial({ color: 0xc8c7c4, map: X.rep(X.flutes(), 1, 4), roughness: .8 }), .5);
  const concT = X.concrete();
  const concMat = withEnv(new THREE.MeshStandardMaterial({ color: 0xa4a7b2, map: concT, roughness: .92 }), .4);
  const bronzeMat = withEnv(new THREE.MeshStandardMaterial({ color: 0x55575d, metalness: .9, roughness: .38 }), 1.0);
  const darkSteel = withEnv(new THREE.MeshStandardMaterial({ color: 0x1b1e26, metalness: .8, roughness: .42 }), 1);
  const steelPlate = X.steelPlate();
  const steelMat = withEnv(new THREE.MeshStandardMaterial({ color: 0xb4bac6, map: steelPlate, metalness: .95, roughness: .3 }), 1);
  const asphT = X.asphalt();
  const paveT = X.pavers();
  const mk = (t, x, y) => X.rep(t, x, y);
  const blueMat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: X.blueEnamel(), toneMapped: false });

  // facade materials: pane grid, reflective glass, lit windows that breathe slowly
  const facadeMat = (kind, hi) => {
    const f = X.facade(kind);
    const m = withEnv(new THREE.MeshStandardMaterial({ map: f.map, roughnessMap: f.rm, metalnessMap: f.rm, metalness: 1, roughness: 1, emissive: 0xffffff, emissiveMap: f.em }), kind === 'stone' ? .5 : 1.6);
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = U.uTime; sh.uniforms.uLit = U.uLit; sh.uniforms.uHi = hi || { value: 0 };
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uLit; uniform float uHi;')
        .replace('#include <emissivemap_fragment>', `
          vec4 em = texture2D(emissiveMap, vEmissiveMapUv);
          float tw = 0.7 + 0.3*sin(uTime*0.3 + em.g*70.);
          float lit = max(em.r, uHi*0.4*step(0.01, em.g));
          vec3 wc = mix(vec3(0.92,0.88,0.82), vec3(0.8,0.86,0.98), step(0.5, em.b));
          totalEmissiveRadiance = wc * lit * tw * uLit * 1.5 * (1.0 + uHi*1.6);`);
    };
    return m;
  };
  const baseFacade = {}; const fm = (k) => baseFacade[k] || (baseFacade[k] = facadeMat(k));

  // ---------- geometry helpers ----------
  function wbox(w, h, d, s = 4) {
    const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dm = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dm[f][0] / s, uv.getY(i) * dm[f][1] / s); }
    return g;
  }
  const constUV = (g) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.002, 0.002); return g; };
  function fb(cx, y0, cz, w, h, d) { // facade box: UV in whole panes so the grid stays square
    const g = new THREE.BoxGeometry(w, h, d); g.translate(cx, y0 + h / 2, cz);
    const uv = g.attributes.uv; const nx = Math.max(1, Math.round(d / X.PANE_W)), nz = Math.max(1, Math.round(w / X.PANE_W)), ny = Math.max(1, Math.round(h / X.PANE_H));
    const ou = Math.floor(rnd() * 16) / 16, ov = Math.floor(rnd() * 16) / 16;
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
      const i = f * 4 + k, u = uv.getX(i), v = uv.getY(i);
      if (f < 2) uv.setXY(i, ou + u * nx / 16, ov + v * ny / 16);
      else if (f > 3) uv.setXY(i, ou + u * nz / 16, ov + v * ny / 16);
      else uv.setXY(i, 0.002, 0.002);
    }
    return g;
  }
  const beacons = [];
  function tower(push, kind, x, z, w, d, h, o = {}) {
    let y = 0;
    if (o.lift) {
      const L = o.lift;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) push('steel', fb(x + sx * (w / 2 - 2.6), 0, z + sz * (d / 2 - 2.6), 5, L, 5));
      push('steel', fb(x, L - 1.2, z, w, 1.2, d)); y = L;
    }
    const segs = o.segs || [[1, .58], [.8, .24], [.6, .12]]; let sw = 1;
    segs.forEach(([s, fr], i) => {
      const hh = h * fr, ww = w * s, dd = d * s;
      push(kind, fb(x, y, z, ww, hh, dd)); y += hh;
      push('steel', fb(x, y, z, ww + 1.4, 1.1, dd + 1.4)); y += 1.1;
    });
    const sp = o.spire ?? h * .1;
    if (sp > 0) {
      const n = o.spires || 1;
      for (let i = 0; i < n; i++) { const g = new THREE.CylinderGeometry(.12, .55, sp * (1 - i * .22), 8); g.translate(x + (n > 1 ? (i - (n - 1) / 2) * w * .16 : 0), y + sp * (1 - i * .22) / 2, z); push('steel', constUV(g)); }
      if (h > 110) beacons.push([x, y + sp, z]);
    }
    return y;
  }

  // ---------- ground and paving ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2600, 3000), withEnv(new THREE.MeshStandardMaterial({ color: 0xffffff, map: mk(asphT, 400, 460), roughness: .62 }), .5));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -300); ground.receiveShadow = true; scene.add(ground);
  const paveMat = withEnv(new THREE.MeshStandardMaterial({ color: 0xb9b0a2, map: paveT, roughness: .7 }), .3);
  function floorRect(x0, x1, z0, z1, mat, rx = 3, y = .04) {
    const w = x1 - x0, d = z0 - z1; const m = mat === paveMat ? mat.clone() : mat; if (mat === paveMat) { m.map = mk(paveT, w / rx, d / rx); m.envMap = envTex; envMats.push([m, .3]); }
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); g.rotation.x = -Math.PI / 2; g.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); g.receiveShadow = true; return g;
  }
  const zones = [];
  const zone = (g, c, r) => { scene.add(g); zones.push([g, new THREE.Vector3(...c), r]); return g; };
  function inst(geo, mat, list, cast, recv) {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((a, i) => { qq.setFromEuler(eu.set(a[7] || 0, a[6] || 0, 0)); m4.compose(v3.set(a[0], a[1], a[2]), qq, sc3.set(a[3] ?? 1, a[4] ?? 1, a[5] ?? 1)); im.setMatrixAt(i, m4); });
    im.instanceMatrix.needsUpdate = true; im.castShadow = !!cast; im.receiveShadow = !!recv; return im;
  }
  const merged = (arr, mat, cast, recv) => { const m = new THREE.Mesh(mergeGeometries(arr), mat); m.castShadow = !!cast; m.receiveShadow = !!recv; return m; };

  // lamps + glow
  const glowTex = X.glow();
  function glowPts(pos, color, size, op = 1) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos.flat(), 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex, color, size, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false }));
    p.frustumCulled = false; return p;
  }
  const lampGeo = (() => { const a = new THREE.CylinderGeometry(.1, .14, 7, 8); a.translate(0, 3.5, 0); const b = new THREE.SphereGeometry(.38, 10, 8); b.translate(0, 7.3, 0); return mergeGeometries([a, b]); })();
  const lampBulbPos = [];
  function lamps(xs, z0, z1, step, mat) { const list = []; for (const x of xs) for (let z = z0; z > z1; z -= step) { list.push([x, 0, z]); lampBulbPos.push([x, 7.3, z]); } scene.add(inst(lampGeo, mat, list)); }

  // ======================= ZONE 1: hero plaza, lobby pavilion, black towers =======================
  const gHero = new THREE.Group();
  { const pushes = []; const push = (k, g) => pushes.push([k, g]);
    tower(push, 'steel', 0, -36, 32, 44, 200, { lift: 14, segs: [[1, .6], [.84, .22], [.62, .1]] });
    tower(push, 'steel', -66, -36, 28, 30, 190, { segs: [[1, .62], [.8, .2], [.58, .08]] });
    tower(push, 'steel', 68, -46, 30, 34, 238, { segs: [[1, .66], [.78, .18], [.52, .08]] });
    tower(push, 'bronze', -100, -92, 30, 30, 150);
    tower(push, 'lit', 98, -100, 34, 30, 170);
    tower(push, 'steel', 20, -118, 26, 26, 150, {});
    for (const k of ['steel', 'bronze', 'lit']) { const arr = pushes.filter((p) => p[0] === k).map((p) => p[1]); if (arr.length) gHero.add(merged(arr, fm(k))); }
  }
  // pavilion: black steel frame, warm coffered ceiling, polished granite, bronze columns
  { const PX = 24, PZ0 = 28, PZ1 = -14, PH = 9;
    const gr = X.checker('#14161c', '#262932', false);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(48, 42), withEnv(new THREE.MeshStandardMaterial({ color: 0xffffff, map: mk(gr, 4, 3.5), roughness: .22 }), 1.4));
    fl.rotation.x = -Math.PI / 2; fl.position.set(0, .05, 7); fl.receiveShadow = true; gHero.add(fl);
    const cf = X.coffer(4);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1a1308, map: mk(cf.map, 4, 3.5), emissive: 0xffffff, emissiveMap: mk(cf.em, 4, 3.5), emissiveIntensity: 1.7, roughness: .7 });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(48, 42), ceilMat); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, PH, 7); gHero.add(ceil);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(49.6, 1.6, 43.6), darkSteel); roof.position.set(0, PH + .8 + .2, 7); gHero.add(roof);
    const cols = []; for (let z = PZ0; z >= PZ1 - .1; z -= 4.2) { cols.push([-PX, PH / 2, z, .7, PH, .7], [PX, PH / 2, z, .7, PH, .7]); }
    for (let x = -PX + 2; x < PX - 1; x += 4) cols.push([x, PH / 2, PZ0, .7, PH, .7]);
    gHero.add(inst(new THREE.BoxGeometry(1, 1, 1), darkSteel, cols));
    const bc = []; for (const x of [-10, 10]) for (const z of [20, 10, 0, -10]) bc.push([x, PH / 2, z, .5, PH, .5]);
    const cg = new THREE.CylinderGeometry(1, 1.1, 1, 20); gHero.add(inst(cg, bronzeMat, bc.map((a) => [a[0], a[1], a[2], 1, PH, 1])));
    const glass = new THREE.MeshStandardMaterial({ color: 0x0a1226, metalness: .9, roughness: .05, transparent: true, opacity: .26, depthWrite: false });
    withEnv(glass, 2);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(42, PH), glass); p.rotation.y = -sx * Math.PI / 2; p.position.set(sx * (PX - .1), PH / 2, 7); gHero.add(p); }
    // tower underside (the lifted tower), same warm ceiling
    const uc = new THREE.Mesh(new THREE.PlaneGeometry(32, 44), ceilMat); uc.rotation.x = Math.PI / 2; uc.position.set(0, 12.7, -36); gHero.add(uc);
    const ufl = floorRect(-24, 24, -14, -58, paveMat, 3); gHero.add(ufl);
  }
  gHero.add(floorRect(-80, 80, 110, 28, paveMat, 3)); gHero.add(floorRect(-80, -24, 28, -60, paveMat, 3)); gHero.add(floorRect(24, 80, 28, -60, paveMat, 3));
  zone(gHero, [0, 40, -20], 520);

  // ======================= ZONE 2: colonnade avenue =======================
  const gAve = new THREE.Group();
  { const bw = 40, xs = [[-1], [1]];
    const colList = [], capList = [], baseList = [], entab = [], bld = [];
    const zs = [-58, -82, -106, -130, -150];
    const hs = { '-1': [62, 48, 78, 56], '1': [52, 80, 58, 70] };
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const z0 = zs[i], z1 = zs[i + 1], zc = (z0 + z1) / 2, dz = z0 - z1, H = hs[side][i];
        const g = new THREE.Group();
        const xc = side * (24 + bw / 2);
        const geoms = { stone: [], steel: [] }; const push = (k, ge) => geoms[k].push(ge);
        tower(push, 'stone', xc, zc, bw, dz - .6, H, { segs: [[1, .64], [.8, .2], [.6, .1]], spire: i % 2 ? 0 : 5 });
        gAve.add(merged(geoms.stone, fm('stone'), true, true)); gAve.add(merged(geoms.steel, fm('steel'), true, true));
        // entablature + porch ceiling
        const ex = side * 20.2;
        const ent = new THREE.Mesh(wbox(9.4, 3.6, dz - .6, 4), stoneMat); ent.position.set(ex, 17 + 1.8, zc); ent.castShadow = ent.receiveShadow = true; gAve.add(ent);
        const cfm = X.coffer(4); const pc = new THREE.Mesh(new THREE.PlaneGeometry(8.4, dz - .6), new THREE.MeshStandardMaterial({ color: 0x20180c, map: mk(cfm.map, 8.4 / 12, (dz - .6) / 12), emissive: 0xffffff, emissiveMap: mk(cfm.em, 8.4 / 12, (dz - .6) / 12), emissiveIntensity: .7, roughness: .8 }));
        pc.rotation.x = Math.PI / 2; pc.position.set(side * 20, 17, zc); gAve.add(pc);
        // porch floor
        gAve.add(floorRect(Math.min(side * 15, side * 24), Math.max(side * 15, side * 24), z0, z1, paveMat, 3, .12));
      }
      for (let z = -60.6; z > -149; z -= 5.2) { colList.push([side * 16, 8.5, z, 1, 17, 1]); capList.push([side * 16, 17.5, z, 2.8, 1, 2.8]); baseList.push([side * 16, .6, z, 2.7, 1.2, 2.7]); }
    }
    const cyl = new THREE.CylinderGeometry(.92, 1.02, 1, 20, 1); // uv u wraps once, v along height
    gAve.add(inst(cyl, fluteMat, colList, true, true));
    gAve.add(inst(wbox(1, 1, 1, 2), stoneMat, capList, true, true)); gAve.add(inst(wbox(1, 1, 1, 2), stoneMat, baseList, true, true));
    // road side kerbs and lamp posts
    gAve.add(floorRect(-140, -13, -58, -150, paveMat, 3, .03)); gAve.add(floorRect(13, 140, -58, -150, paveMat, 3, .03));
    lamps([-13, 13], -64, -150, 14, darkSteel);
  }
  zone(gAve, [0, 20, -104], 460);

  // ======================= ZONE 3: plaza and five towers =======================
  const gCore = new THREE.Group(); const coreHi = [], coreMats = [], coreCrowns = [];
  { const specs = [
      ['steel', 26, 26, TH[0], { segs: [[1, .62], [.8, .2], [.56, .1]], spire: 22 }],
      ['bronze', 34, 30, TH[1], { segs: [[1, .5], [.82, .25], [.64, .13], [.4, .07]], spire: 16, spires: 3 }],
      ['blue', 40, 42, TH[2], { lift: 14, segs: [[1, .66], [.78, .2], [.5, .08]], spire: 18 }],
      ['stone', 36, 36, TH[3], { segs: [[1, .5], [.84, .26], [.66, .14], [.4, .06]], spire: 8 }],
      ['steel', 20, 20, TH[4], { segs: [[1, .82], [.7, .1]], spire: 40 }],
    ];
    specs.forEach(([kind, w, d, h, o], i) => {
      const hi = { value: 0 }; coreHi.push(hi); const mat = facadeMat(kind, hi); coreMats.push(mat);
      const arr = [], arr2 = []; const top = tower((k, g) => (k === kind ? arr : arr2).push(g), kind, TX[i], TZ, w, d, h, o);
      gCore.add(merged(arr, mat, true, false)); if (arr2.length) gCore.add(merged(arr2, fm('steel'), true, false));
      const cm = new THREE.MeshBasicMaterial({ color: 0xffe3b0 }); coreCrowns.push(cm);
      const c = new THREE.Mesh(new THREE.BoxGeometry(w * .3, 1.4, d * .3), cm); c.position.set(TX[i], top - (o.spire || 0) - 0.5, TZ); gCore.add(c);
    });
    gCore.add(floorRect(-140, 140, -150, -210, paveMat, 3)); gCore.add(floorRect(-140, -26, -210, -250, paveMat, 3)); gCore.add(floorRect(26, 140, -210, -250, paveMat, 3)); gCore.add(floorRect(-26, 26, -205, -255, paveMat, 3));
    // fountain-free plaza: low planters/benches in stone for scale
    const bl = []; for (let i = -4; i <= 4; i++) { bl.push([i * 18, .5, -178, 8, 1, 1.2]); }
    gCore.add(inst(wbox(1, 1, 1, 2), stoneMat, bl, true, true));
    lamps([-34, -12, 12, 34], -160, -200, 20, darkSteel);
  }
  zone(gCore, [0, 80, -226], 520);

  // ======================= ZONE 4: the bank hall =======================
  const gHall = new THREE.Group(); const open = [];
  const HX = 26, HZ0 = -255, HZ1 = -325, HT = 24;
  { const wall = (cx, cy, cz, w, h, d) => { const m = new THREE.Mesh(wbox(w, h, d, 4), stoneMat); m.position.set(cx, cy, cz); m.castShadow = m.receiveShadow = true; gHall.add(m); return m; };
    wall(-HX - 1, 13.1, (HZ0 + HZ1) / 2, 2, 26.2, 70); wall(HX + 1, 13.1, (HZ0 + HZ1) / 2, 2, 26.2, 70);
    // front wall with a tall opening
    wall(-17.5, 13.1, HZ0 + 1, 21, 26.2, 2); wall(17.5, 13.1, HZ0 + 1, 21, 26.2, 2);
    wall(0, 21.6, HZ0 + 1, 14, 9.2, 2);
    // back wall around the vault opening (12 x 12)
    wall(-17, 13.1, HZ1 - 1, 22, 26.2, 2); wall(17, 13.1, HZ1 - 1, 22, 26.2, 2); wall(0, 19.1, HZ1 - 1, 12, 14.2, 2);
    // floor: black and cream marble
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(52, 70), withEnv(new THREE.MeshStandardMaterial({ color: 0x8c8e94, map: mk(concT, 3, 4), roughness: .42 }), .7));
    fl.rotation.x = -Math.PI / 2; fl.position.set(0, .05, (HZ0 + HZ1) / 2); fl.receiveShadow = true; gHall.add(fl);
    // roof slab with openings
    const cw = 52 / 6, rh = 70 / 8; const hrs = (i, j) => { const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); };
    const boxes = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) {
      const cx = -HX + c * cw + cw / 2, cz = HZ0 - r * rh - rh / 2; const isOpen = hrs(c + 3, r + 1) > .42 && r > 0;
      if (!isOpen) boxes.push([cx, cz, cw, rh]);
      else { const a = 5.4, fx = (cw - a) / 2, fz = (rh - a) / 2; boxes.push([cx, cz - (a / 2 + fz / 2), cw, fz], [cx, cz + (a / 2 + fz / 2), cw, fz], [cx - (a / 2 + fx / 2), cz, fx, a], [cx + (a / 2 + fx / 2), cz, fx, a]); open.push([cx, cz, a]); }
    }
    const slab = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 2.2, 1), concMat, boxes.length);
    boxes.forEach((b, i) => { m4.makeScale(b[2] - .04, 1, b[3] - .04); m4.setPosition(b[0], HT + 1.1, b[1]); slab.setMatrixAt(i, m4); }); slab.castShadow = slab.receiveShadow = true; gHall.add(slab);
    // piers
    const piers = [], caps = [], bases = [];
    for (let r = 1; r < 8; r++) for (const k of [1, 2, 4, 5]) { const x = -HX + k * cw, z = HZ0 - r * rh; piers.push([x, 11.5, z]); caps.push([x, 23.2, z]); bases.push([x, .6, z]); }
    gHall.add(inst(wbox(2.4, 23, 2.4, 4), stoneMat, piers, true, true)); gHall.add(inst(wbox(3.4, 1.6, 3.4, 4), stoneMat, caps, true, true)); gHall.add(inst(wbox(3.2, 1.2, 3.2, 4), stoneMat, bases, true, true));
    // teller counters and bronze grilles along both walls
    const counters = [], bars = [], rails = [];
    for (const s of [-1, 1]) { counters.push([s * 21.5, .6, (HZ0 + HZ1) / 2 - 2, 2.2, 1.2, 56]); rails.push([s * 21.5, 4.0, (HZ0 + HZ1) / 2 - 2, .12, .14, 56], [s * 21.5, 1.35, (HZ0 + HZ1) / 2 - 2, .3, .1, 56]); for (let z = HZ0 - 6; z > HZ1 + 6; z -= .42) bars.push([s * 21.5, 2.7, z, 1, 1, 1]); }
    /* v3: no teller counters or grilles */
    gHall.add(inst(new THREE.BoxGeometry(.05, 2.5, .05), bronzeMat, bars, true, true));
    // sun shafts under each opening (sheared prisms, additive)
    const shaftMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      uniforms: { uTime: U.uTime, uCol: { value: new THREE.Color(1.0, .78, .55) }, uAmt: { value: 1 } },
      vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main(){ vY=position.y; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying float vY; varying vec3 vN; varying vec3 vV; varying vec3 vW; uniform float uTime,uAmt; uniform vec3 uCol;
        float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float nz(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
        void main(){
          float fade=smoothstep(0.,.14,vY)*(1.-smoothstep(.5,1.,vY));
          float fr=pow(abs(dot(normalize(vN),normalize(vV))),1.4);
          float d=nz(vW.xz*.35+vec2(uTime*.03,0.))*.6+nz(vec2(vW.y*.12-uTime*.05,vW.x*.2))*.4;
          float a=fade*fr*(.09+.15*d)*uAmt; gl_FragColor=vec4(uCol*a,a); }`,
    });
    const tilt = new THREE.Vector3(sunDir.x / -sunDir.y, 0, sunDir.z / -sunDir.y);
    open.forEach(([cx, cz, a]) => {
      const g = new THREE.BoxGeometry(a, 1, a, 1, 8, 1); g.translate(0, .5, 0); const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) { const u = pos.getY(i); pos.setX(i, pos.getX(i) + tilt.x * HT * u); pos.setZ(i, pos.getZ(i) + tilt.z * HT * u); }
      const sh = new THREE.Mesh(g, shaftMat); sh.position.set(cx, HT, cz); sh.scale.set(1, -HT, 1); sh.frustumCulled = false; gHall.add(sh);
    });
    shaftMat.userData.hall = true; scene.userData.shaft = shaftMat;
    // dust
    const DN = 600, dp = new Float32Array(DN * 3), dsd = new Float32Array(DN);
    for (let i = 0; i < DN; i++) { dp[i * 3] = R(-HX, HX); dp[i * 3 + 1] = R(0, 22); dp[i * 3 + 2] = R(HZ1, HZ0); dsd[i] = R(0, 6.28); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffe2bc, size: .09, transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    gHall.add(dust); gHall.userData.dust = [dust, dsd];
  }
  zone(gHall, [0, 10, -290], 420);

  // ======================= ZONE 5: the vault, and the alley behind it =======================
  const gVault = new THREE.Group(); let doorPivot, wheel; let logoPlane;
  { const Z0 = -327, Z1 = -358;
    // frame plate with a round hole, door
    const sh = new THREE.Shape(); sh.moveTo(-8, 0); sh.lineTo(8, 0); sh.lineTo(8, 14); sh.lineTo(-8, 14); sh.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 6.5, 5.0, 0, Math.PI * 2, true); sh.holes.push(hole);
    const fg = new THREE.ExtrudeGeometry(sh, { depth: .8, bevelEnabled: false, curveSegments: 48 });
    const frame = new THREE.Mesh(fg, withEnv(new THREE.MeshStandardMaterial({ color: 0x5c616d, map: steelPlate, metalness: .8, roughness: .4 }), 1)); frame.position.set(0, 0, -325); gVault.add(frame);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.1, .28, 14, 72), bronzeMat); ring.position.set(0, 6.5, -324.15); /* v3: no bronze ring */
    doorPivot = new THREE.Group(); doorPivot.position.set(-6, 6.5, -323.4); doorPivot.visible = false; gVault.add(doorPivot);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(5.45, 5.45, 1.4, 72).rotateX(Math.PI / 2), steelMat); disc.position.x = 6; doorPivot.add(disc);
    for (const r of [4.5, 3.2]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, .12, 10, 72), bronzeMat); t.position.set(6, 0, .72); doorPivot.add(t); }
    const bolts = new THREE.InstancedMesh(new THREE.CylinderGeometry(.24, .24, .8, 12), bronzeMat, 24);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; qq.setFromEuler(eu.set(0, 0, a + Math.PI / 2)); m4.compose(v3.set(6 + Math.cos(a) * 5.7, Math.sin(a) * 5.7, 0), qq, sc3.set(1, 1, 1)); bolts.setMatrixAt(i, m4); }
    doorPivot.add(bolts);
    wheel = new THREE.Group(); wheel.position.set(6, 0, .9); doorPivot.add(wheel);
    wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .8, 24).rotateX(Math.PI / 2), bronzeMat));
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(1.8, .13, 10, 48), bronzeMat));
    for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.22, 4.0, .22), bronzeMat); sp.rotation.z = i / 6 * Math.PI; wheel.add(sp); const kn = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 10), bronzeMat); kn.position.set(Math.sin(i / 6 * Math.PI) * 2.0, Math.cos(i / 6 * Math.PI) * 2.0, 0); wheel.add(kn); const kn2 = kn.clone(); kn2.position.multiplyScalar(-1); wheel.add(kn2); }
    const dial = new THREE.Mesh(new THREE.TorusGeometry(.9, .09, 10, 40), bronzeMat); dial.position.set(6, 3.3, .75); doorPivot.add(dial);
    // chamber
    const cfl = new THREE.Mesh(new THREE.PlaneGeometry(18, 31), withEnv(new THREE.MeshStandardMaterial({ color: 0x7a7f8a, map: mk(steelPlate, 4, 7), roughness: .3, metalness: .6 }), 1)); cfl.rotation.x = -Math.PI / 2; cfl.position.set(0, .05, (Z0 + Z1) / 2); gVault.add(cfl);
    const cc = new THREE.Mesh(new THREE.PlaneGeometry(18, 31), concMat); cc.rotation.x = Math.PI / 2; cc.position.set(0, 14.2, (Z0 + Z1) / 2); gVault.add(cc);
    for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(2, 14.4, 31), concMat); w.position.set(s * 10, 7.2, (Z0 + Z1) / 2); gVault.add(w); }
    const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.6, .8, 2.2) });
    const strips = []; for (let z = Z0 - 3; z > Z1 + 1; z -= 4.5) strips.push([0, 14.0, z, 1, 1, 1]); gVault.add(inst(new THREE.BoxGeometry(14, .12, .5), lampMat, strips));
    // safe deposit boxes
    const boxes = [], dots = []; const cols = [new THREE.Color(0x9a6c3c), new THREE.Color(0x6b7280), new THREE.Color(0x57606e), new THREE.Color(0x8a6a45)];
    const bgeo = new THREE.BoxGeometry(.26, .8, 1), dgeo = new THREE.BoxGeometry(.06, .12, .12);
    const bm = withEnv(new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: .85, roughness: .38 }), .8);
    const idx = []; for (const s of [-1, 1]) for (let z = Z0 - 1.2; z > Z1 + .8; z -= 1.04) for (let y = .5; y < 13.6; y += .9) { boxes.push([s * 8.88, y, z]); dots.push([s * 8.74, y, z]); }
    const bi = new THREE.InstancedMesh(bgeo, bm, boxes.length), di = new THREE.InstancedMesh(dgeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(.3, .6, 3) }), boxes.length);
    boxes.forEach((b, i) => { m4.makeTranslation(b[0], b[1], b[2]); bi.setMatrixAt(i, m4); bi.setColorAt(i, cols[Math.floor(rnd() * 4)]); m4.makeTranslation(dots[i][0], dots[i][1], dots[i][2]); di.setMatrixAt(i, m4); });
    /* v3: no safe-deposit boxes */
    // blue enamel end wall with an arch opening
    const bw = (cx, cy, w, h) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.4), blueMat); m.position.set(cx, cy, Z1 - .2); gVault.add(m); };
    bw(-6.5, 7.2, 5, 14.4); bw(6.5, 7.2, 5, 14.4); bw(0, 12.2, 8, 4.4);
    logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.17), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, opacity: 0 })); logoPlane.position.set(0, 12.2, Z1 + .55); /* v3: no logo sign */
    X.logoCanvasTex((t) => { logoPlane.material.map = t; logoPlane.material.opacity = 1; logoPlane.material.needsUpdate = true; });
    // back of the vault block (outer face) + alley
    gVault.add(floorRect(-14, 14, -358, -378, paveMat, 3));
  }
  zone(gVault, [0, 20, -350], 460);

  // ======================= ZONE 6: the lit tower, trading floor =======================
  const gTower = new THREE.Group(); let screenMat, boardMat, vidMat;
  { const TX0 = 34, TZ0 = -372, TZ1 = -462, FL = 114, CE = 132;
    const arr = { lit: [], steel: [] };
    arr.lit.push(fb(0, 0, (TZ0 + TZ1) / 2, TX0 * 2, 112, 90));
    // side wings forming the alley walls
    arr.lit.push(fb(-26, 0, -360, 28, 90, 30), fb(26, 0, -360, 28, 90, 30));
    arr.lit.push(fb(0, CE + 2, (TZ0 + TZ1) / 2, TX0 * 2, 126, 90));
    arr.steel.push(fb(0, CE + 128, (TZ0 + TZ1) / 2, 50, 10, 70)); // crown slab
    gTower.add(merged(arr.lit, facadeMat('lit'), false, false));
    const sp = new THREE.CylinderGeometry(.3, 1.2, 36, 8); sp.translate(0, CE + 128 + 5 + 18, (TZ0 + TZ1) / 2); constUV(sp);
    gTower.add(merged([...arr.steel, sp], fm('steel')));
    beacons.push([0, CE + 128 + 5 + 36, (TZ0 + TZ1) / 2]);
    // open storey: slab, ceiling, columns
    const slabF = new THREE.Mesh(new THREE.BoxGeometry(TX0 * 2, 2, 90), withEnv(new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: .25, metalness: .3 }), 1.2)); slabF.position.set(0, FL - 1, (TZ0 + TZ1) / 2); gTower.add(slabF);
    const ceilT = new THREE.Mesh(new THREE.BoxGeometry(TX0 * 2, 2, 90), concMat); ceilT.position.set(0, CE + 1, (TZ0 + TZ1) / 2); gTower.add(ceilT);
    const cl = []; for (const x of [-34, -17, 17, 34]) for (let z = -378; z > -462; z -= 15) cl.push([x, (FL + CE) / 2, z, 1.6, CE - FL, 1.6]);
    gTower.add(inst(new THREE.BoxGeometry(1, 1, 1), darkSteel, cl));
    const lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.45, 1.2) }); const lb = []; for (let z = -382; z > -460; z -= 9) for (const x of [-22, 0, 22]) lb.push([x, CE - .1, z, 1, 1, 1]);
    gTower.add(inst(new THREE.BoxGeometry(14, .12, 1.2), lampM, lb));
    // desks and screens
    const desks = [], scr = []; const dgeo = new THREE.BoxGeometry(4.6, .9, 1.5);
    for (let z = -390; z > -448; z -= 6) for (const sx of [-1, 1]) for (const dx of [7, 13, 19, 25, 31]) { desks.push([sx * dx, FL + .45, z]); for (const o of [-1.2, 1.2]) scr.push([sx * dx + o, FL + 1.55, z - .2]); }
    /* v3: no desks */
    screenMat = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; varying float vS; void main(){ vUv=uv; vec4 p=instanceMatrix*vec4(position,1.); vS=fract(sin(dot(instanceMatrix[3].xz,vec2(12.9,78.2)))*43758.5); gl_Position=projectionMatrix*modelViewMatrix*p; }`,
      fragmentShader: `varying vec2 vUv; varying float vS; uniform float uTime;
        float h(float n){ return fract(sin(n*91.3)*43758.5); }
        void main(){ float cl=floor(vUv.x*20.); float t=floor(uTime*.35+vS*9.); float b=h(cl+vS*17.+t*.37); float hg=.18+.6*b; float body=step(vUv.y,hg)*step(.1,vUv.y);
          vec3 c=vec3(.01,.025,.07); c+=body*mix(vec3(.1,.45,1.),vec3(1.,.6,.18),step(.55,h(cl*1.7+vS*3.+t))); c+=.04*step(.9,sin(vUv.y*70.));
          float e=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)); c*=smoothstep(0.,.05,e)*.8+.2;
          gl_FragColor=vec4(c*.85,1.); 
#include <colorspace_fragment>
}` });
    const si = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.1, .65), screenMat, scr.length); scr.forEach((a, i) => { m4.makeTranslation(a[0], a[1], a[2]); si.setMatrixAt(i, m4); }); si.frustumCulled = false; /* v3: no screens */
    // board and three screens at the end of the floor
    boardMat = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec2 vUv; uniform float uTime;
        float h(float n){ return fract(sin(n*91.3)*43758.5); }
        void main(){ vec2 u=vUv; float x=u.x*60.+uTime*.6; float y=.5+.18*sin(x*.35)+.1*sin(x*.9+2.)+.05*sin(x*2.3);
          vec3 c=vec3(.02,.06,.22); float g=step(.96,fract(u.x*30.))+step(.94,fract(u.y*8.)); c+=.05*g;
          c+=vec3(.08,.2,.7)*smoothstep(y,y-.5,u.y)*step(u.y,y)*.7; c+=vec3(.9,.95,1.)*smoothstep(.012,0.,abs(u.y-y))*1.2;
          float cl=floor(u.x*60.); float b=h(cl+floor(uTime*.2)); c+=step(u.y,.14*b+.04)*vec3(.9,.55,.2)*.5;
          gl_FragColor=vec4(c*.8,1.); 
#include <colorspace_fragment>
}` });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(58, 13), boardMat); board.position.set(0, 124, TZ1 + .2); /* v3: no board */
    vidMat = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec2 vUv; uniform float uTime;
        void main(){ vec2 u=vUv; vec3 c=mix(vec3(.04,.1,.38),vec3(.09,.28,.95),u.y*.8+.1*sin(u.x*4.+uTime*.3)); c+=.06*sin(u.x*30.+uTime*.5)*u.y;
          vec2 p=(u-.5)*vec2(1.78,1.); float tri=step(abs(p.y),.16-(p.x+.1)*.55)*step(-.1,p.x)*step(p.x,.2); c=mix(c,vec3(1.),tri*.9);
          float e=min(min(u.x,1.-u.x),min(u.y,1.-u.y)); c*=smoothstep(0.,.03,e); gl_FragColor=vec4(c*.8,1.); 
#include <colorspace_fragment>
}` });
    for (const x of [-15, 0, 15]) { const f = new THREE.Mesh(new THREE.BoxGeometry(11.8, 6.9, .3), bronzeMat); /* v3: no video frames */ }
    // light from the street: warm uplighting on the facade is added through the lit windows
  }
  zone(gTower, [0, 120, -420], 520);

  // ======================= ZONE 7: night street, ticker, blue tower =======================
  const gStreet = new THREE.Group(); let tickMats = [];
  { const geoms = { steel: [], bronze: [], stone: [], lit: [], blue: [] }; const push = (k, g) => geoms[k].push(g);
    const kinds = ['steel', 'bronze', 'stone', 'lit', 'steel', 'stone'];
    for (const side of [-1, 1]) for (let i = 0; i < 10; i++) {
      const z = -484 - i * 21, w = R(26, 38), h = R(70, 170); const k = kinds[(i + (side > 0 ? 2 : 0)) % kinds.length];
      tower(push, k, side * (14 + w / 2), z, w, 20, h, { segs: k === 'stone' ? [[1, .6], [.8, .24], [.6, .12]] : [[1, .7], [.8, .2]], spire: h > 130 ? 10 : 0 });
    }
    tower(push, 'blue', 0, -722, 72, 44, 300, { segs: [[1, .72], [.8, .18], [.56, .06]], spire: 30 });
    for (const k of Object.keys(geoms)) if (geoms[k].length) gStreet.add(merged(geoms[k], fm(k)));
    gStreet.add(floorRect(-60, 60, -470, -700, paveMat, 3, .04));
    const road = new THREE.Mesh(new THREE.PlaneGeometry(28, 240), withEnv(new THREE.MeshStandardMaterial({ color: 0xffffff, map: mk(asphT, 5, 40), roughness: .35 }), 1)); road.rotation.x = -Math.PI / 2; road.position.set(0, .07, -590); gStreet.add(road);
    // shop fronts
    const sf = X.shopfront(); const sfm = new THREE.MeshBasicMaterial({ map: mk(sf, 1.7, 1), color: new THREE.Color(.8, .75, .7) });
    for (const side of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(210, 4.4), sfm); p.rotation.y = side * Math.PI / 2 * -1 + (side > 0 ? 0 : Math.PI); p.position.set(side * 14.05, 2.5, -590); p.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; /* v3: no shopfronts */ }
    // lit bands
    for (const side of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.4, .3, 210), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, .8, .45) })); b.position.set(side * 14.1, 5, -590); /* v3: no lit bands */ }
  }
  zone(gStreet, [0, 80, -620], 520);

  // ticker bands (texture built after fonts load)
  const tickerGroup = new THREE.Group(); tickerGroup.visible = false; gStreet.add(tickerGroup);
  function buildTicker(lines) {
    tickerGroup.clear(); tickMats = []; const t = X.ticker(lines);
    for (const side of [-1, 1]) {
      const m = new THREE.ShaderMaterial({ transparent: false, uniforms: { map: { value: t }, uOff: { value: side > 0 ? .3 : 0 }, uRep: { value: 1.6 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `varying vec2 vUv; uniform sampler2D map; uniform float uOff,uRep;
          void main(){ vec2 cells=vec2(1700.,16.); vec2 c=vUv*cells; vec2 f=fract(c)-.5; float dotm=smoothstep(.5,.22,length(f));
            vec2 s=vec2((floor(c.x)+.5)/cells.x*uRep+uOff,(floor(c.y)+.5)/cells.y); float v=texture2D(map,s).r;
            vec3 on=vec3(1.0,.62,.2)*1.25; vec3 col=mix(vec3(.012,.008,.005),on,v)*dotm; gl_FragColor=vec4(col,1.); 
#include <colorspace_fragment>
}` });
      m.userData.side = side; tickMats.push(m);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(210, 2.2), m); p.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; p.position.set(side * 14.12, 11, -590); tickerGroup.add(p);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(.3, 2.8, 210.4), darkSteel); fr.position.set(side * 14.2, 11, -590); tickerGroup.add(fr);
    }
  }

  // ======================= filler skyline =======================
  { rs = 91; const KO = [[-72, 72, -70, 160], [-64, 64, -150, -70], [-135, 135, -345, -150], [-62, 62, -470, -345], [-52, 52, -770, -470]];
    const geoms = { steel: [], bronze: [], stone: [], lit: [], blue: [] }; const push = (k, g) => geoms[k].push(g);
    const kinds = ['steel', 'steel', 'bronze', 'stone', 'lit', 'steel', 'stone', 'blue'];
    let n = 0;
    for (let z = 170; z > -900 && n < 400; z -= R(26, 44)) for (const side of [-1, 1]) for (let row = 0; row < 3; row++) {
      const w = R(20, 40), d = R(20, 36), x = side * (60 + row * 52 + R(0, 30) + w / 2), zz = z + R(-8, 8);
      if (KO.some(([x0, x1, z0, z1]) => x + w / 2 > x0 && x - w / 2 < x1 && zz + d / 2 > z0 && zz - d / 2 < z1)) continue;
      const h = R(50, 230) * (1 - row * .12); const k = kinds[Math.floor(rnd() * kinds.length)];
      tower(push, k, x, zz, w, d, h, { segs: rnd() < .5 ? [[1, .7], [.76, .2]] : [[1, .55], [.8, .25], [.6, .1]], spire: h > 150 && rnd() < .5 ? R(6, 18) : 0 }); n++;
    }
    for (const k of Object.keys(geoms)) if (geoms[k].length) scene.add(merged(geoms[k], fm(k)));
  }

  // ---------- point glows: lamps, beacons ----------
  /* v3: no lamp glows */
  /* v3: no beacons */

  // ---------- shadow casters in the hero plaza need nothing: sun is baked once ----------
  renderer.shadowMap.needsUpdate = true;

  // ======================= camera path =======================
  const posCurve = new THREE.CatmullRomCurve3(SHOTS.map((s) => new THREE.Vector3(...s.pos)), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(SHOTS.map((s) => new THREE.Vector3(...s.look)), false, 'centripetal');
  const pals = {}; for (const [k, p] of Object.entries(PALS)) pals[k] = { ...p, top: col(p.top), hor: col(p.hor), warm: col(p.warm), fog: col(p.fog), sunCol: col(p.sunCol), hemiS: col(p.hemiS), hemiG: col(p.hemiG), camCol: col(p.camCol), aheadCol: col(p.aheadCol) };
  const P = { ...pals.dusk, top: pals.dusk.top.clone(), hor: pals.dusk.hor.clone(), warm: pals.dusk.warm.clone(), fog: pals.dusk.fog.clone(), sunCol: pals.dusk.sunCol.clone(), hemiS: pals.dusk.hemiS.clone(), hemiG: pals.dusk.hemiG.clone(), camCol: pals.dusk.camCol.clone(), aheadCol: pals.dusk.aheadCol.clone() };
  const NUM = ['warmAmt', 'stars', 'fogD', 'sun', 'hemi', 'exp', 'env', 'lit', 'camI', 'aheadI', 'aheadD'], COL = ['top', 'hor', 'warm', 'fog', 'sunCol', 'hemiS', 'hemiG', 'camCol', 'aheadCol'];
  function palMix(a, b, u) { for (const k of NUM) P[k] = a[k] + (b[k] - a[k]) * u; for (const k of COL) P[k].copy(a[k]).lerp(b[k], u); }

  let anchors = SHOTS.map((_, i) => i * 1000), Tc = 0, Tt = 0, first = true, coreTarget = -1, hoverCore = -1, door = 0, lastT = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });
  const size = () => {
    const w = Math.max(2, innerWidth), h = Math.max(2, innerHeight);
    renderer.setPixelRatio(soft ? .6 : Math.min(devicePixelRatio || 1, w < 800 ? 1.5 : 1.75)); renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.fov = w / h < .8 ? 70 : w / h < 1.2 ? 56 : 46; cam.updateProjectionMatrix();
  };
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uSat: { value: .4 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uSat; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        float l = dot(c, vec3(.2126,.7152,.0722));
        c = mix(vec3(l), c, uSat);
        c *= vec3(.97,.985,1.03);                       // a cool, even cast
        c = pow(max(c, 0.) * .62, vec3(1.14));            // darker, a little more contrast (ACES runs after this)
        vec2 q = vUv - .5; c *= 1. - .55 * dot(q, q) * 1.6; // vignette
        c += (h(vUv * 1000. + fract(uTime) * 61.) - .5) * .045; // grain
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  composer.addPass(grade); composer.addPass(new OutputPass());
  const size2 = size;
  const sizeAll = () => { size2(); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(Math.max(2, innerWidth), Math.max(2, innerHeight)); };
  sizeAll(); addEventListener('resize', sizeAll);

  const pos = new THREE.Vector3(), look = new THREE.Vector3(), fwd = new THREE.Vector3();
  function frame(a, t, dt) {
    // locate scroll anchor between shots
    const n = SHOTS.length; let i = 0; while (i < n - 2 && a >= anchors[i + 1]) i++;
    const span = Math.max(1, anchors[i + 1] - anchors[i]); const u = Math.min(1, Math.max(0, (a - anchors[i]) / span));
    Tt = i + u;
    if (first || reduced) { Tc = Tt; first = false; } else Tc += (Tt - Tc) * (1 - Math.exp(-dt * 3.6));
    const ci = Math.min(n - 2, Math.max(0, Math.floor(Tc))), cu = Tc - ci;
    const tp = Math.min(1, Math.max(0, Tc / (n - 1)));
    posCurve.getPoint(tp, pos); lookCurve.getPoint(tp, look);
    const A = SHOTS[ci], B = SHOTS[ci + 1] || A;
    mouse.sx += (mouse.x - mouse.sx) * .04; mouse.sy += (mouse.y - mouse.sy) * .04;
    cam.position.set(pos.x + mouse.sx * 1.2 + Math.sin(t * .13) * .12, pos.y - mouse.sy * .3 + Math.sin(t * .21) * .04, pos.z);
    cam.lookAt(look.x + mouse.sx * 3, look.y - mouse.sy * 2, look.z);
    // palette
    const pu = cu * cu * (3 - 2 * cu); palMix(pals[A.pal], pals[B.pal], pu);
    door = (A.door ?? 0) + ((B.door ?? 0) - (A.door ?? 0)) * cu;
    scene.fog.color.copy(P.fog); scene.fog.density = P.fogD;
    skyMat.uniforms.uTop.value.copy(P.top); skyMat.uniforms.uHor.value.copy(P.hor); skyMat.uniforms.uWarm.value.copy(P.warm); skyMat.uniforms.uWarmAmt.value = P.warmAmt; skyMat.uniforms.uStars.value = P.stars;
    sky.position.copy(cam.position);
    renderer.toneMappingExposure = P.exp; U.uLit.value = P.lit; U.uTime.value = t;
    sun.intensity = P.sun; sun.color.copy(P.sunCol); hemi.intensity = P.hemi; hemi.color.copy(P.hemiS); hemi.groundColor.copy(P.hemiG);
    for (const [m, k] of envMats) m.envMapIntensity = k * P.env;
    cam.getWorldDirection(fwd);
    L1.position.copy(cam.position).add(v3.set(0, 1.6, 0)); L1.intensity = P.camI; L1.color.copy(P.camCol);
    L2.position.copy(cam.position).addScaledVector(fwd, P.aheadD).add(v3.set(0, 3, 0)); L2.intensity = P.aheadI; L2.color.copy(P.aheadCol);
    // door
    doorPivot.rotation.y = -door * 1.9; wheel.rotation.z = door * Math.PI * 2.2;
    // visibility by distance
    for (const [g, c, r] of zones) g.visible = cam.position.distanceTo(c) < r;
    // core highlight
    const want = hoverCore >= 0 ? hoverCore : coreTarget;
    coreHi.forEach((h, k) => { const tg = k === want ? 1 : 0; h.value += (tg - h.value) * (1 - Math.exp(-dt * 3)); coreCrowns[k].color.setRGB(1 + h.value * 2, .89 + h.value * 1.2, .69 + h.value * .8); });
    // hall dust
    if (gHall.visible) { const [d, sd] = gHall.userData.dust; const p = d.geometry.attributes.position; for (let k = 0; k < sd.length; k++) { p.setY(k, p.getY(k) + Math.sin(t * .3 + sd[k]) * .0016 - .0008); p.setX(k, p.getX(k) + Math.cos(t * .2 + sd[k]) * .0012); if (p.getY(k) < .2) p.setY(k, 22); } p.needsUpdate = true; }
    tickMats.forEach((m) => { m.uniforms.uOff.value = (m.userData.side > 0 ? 0.3 : 0) + t * .004 * (m.userData.side > 0 ? 1 : 1); });
    grade.uniforms.uTime.value = t; composer.render();
  }
  return {
    frame, buildTicker, size,
    setAnchors: (a) => { anchors = a; }, setCore: (i) => { coreTarget = i; }, hoverCore: (i) => { hoverCore = i; },
    soft,
  };
}
