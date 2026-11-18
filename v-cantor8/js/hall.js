import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { register, reduced } from './loop.js';

// A foundation hall lit like an architecture photograph: board-formed concrete piers, a perforated roof slab,
// one hard sun that throws real shadow-mapped light patches, dust, a polished floor, film grain.
// Everything is generated here: no textures, models or HDRs are fetched.

function noiseTex(size, { base = 120, octaves = 6, amp = 70, stripes = false, boards = false, seed = 1 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  x.fillStyle = `rgb(${base},${base},${base})`; x.fillRect(0, 0, size, size);
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let o = 0; o < octaves; o++) {
    const n = Math.max(2, size >> (octaves - o + 1)); const t = document.createElement('canvas'); t.width = t.height = n; const tx = t.getContext('2d');
    const id = tx.createImageData(n, n);
    for (let i = 0; i < n * n; i++) { const v = 128 + (rnd() - 0.5) * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    tx.putImageData(id, 0, 0);
    x.globalAlpha = (amp / 255) * (0.55 + o * 0.09); x.imageSmoothingEnabled = true; x.globalCompositeOperation = 'overlay';
    x.drawImage(t, 0, 0, size, size);
  }
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  if (stripes) for (let i = 0; i < 90; i++) { const px = rnd() * size, w = 1 + rnd() * 5; const g = x.createLinearGradient(0, 0, 0, size); const a = 0.03 + rnd() * 0.07; g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(rnd(), `rgba(0,0,0,0)`); g.addColorStop(1, `rgba(0,0,0,${a * 0.6})`); x.fillStyle = g; x.fillRect(px, 0, w, size); }
  if (boards) for (let y = 0; y < size; y += size / 4) { x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(0, y, size, 2); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, y + 2, size, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4;
  return t;
}

export function initHall() {
  const cv = document.getElementById('hall');
  const section = document.getElementById('core');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { document.documentElement.classList.add('no-gl'); return; }
  let soft = false;
  try { const gl = renderer.getContext(); const ex = gl.getExtension('WEBGL_debug_renderer_info'); soft = !/hq/.test(location.search) && ex && /swiftshader|llvmpipe|software/i.test(gl.getParameter(ex.UNMASKED_RENDERER_WEBGL)); } catch (e) {}
  renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; // sun and geometry never move, so the shadow map is rendered once renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const FOG = 0x060a1e;
  scene.background = new THREE.Color(FOG); scene.fog = new THREE.FogExp2(FOG, 0.011);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.4;

  const cam = new THREE.PerspectiveCamera(36, 1, 0.5, 260);

  // lights
  const sunDir = new THREE.Vector3(-0.42, -1, -0.3).normalize();
  const sun = new THREE.DirectionalLight(0xfff6e8, 7);
  sun.position.copy(sunDir).multiplyScalar(-90); sun.target.position.set(0, 0, -30);
  sun.castShadow = true; sun.shadow.mapSize.set(soft ? 1024 : 4096, soft ? 1024 : 4096);
  const sc = sun.shadow.camera; sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80; sc.near = 1; sc.far = 220;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0x5a80ff, 0x2a3a80, 1.1));

  const bounce = new THREE.DirectionalLight(0x8fb0ff, 0.9); bounce.position.set(6, -10, 8); scene.add(bounce);
  // materials
  const conc = noiseTex(1024, { base: 130, octaves: 8, amp: 20, stripes: true, boards: true, seed: 7 });
  const concB = noiseTex(1024, { base: 128, octaves: 8, amp: 50, boards: true, seed: 7 });
  const pierMat = new THREE.MeshStandardMaterial({ color: 0xbfc4d4, map: conc, bumpMap: concB, bumpScale: 0.7, roughness: 0.88, metalness: 0 });
  conc.repeat.set(1, 9); concB.repeat.set(1, 9);
  const slabTex = noiseTex(512, { base: 122, seed: 3, stripes: true });
  slabTex.repeat.set(1, 1);
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x9aa1b6, map: slabTex, roughness: 0.92 });
  const floorTex = noiseTex(512, { base: 120, octaves: 7, amp: 90, seed: 11 }); floorTex.repeat.set(24, 40);
  const floorR = noiseTex(512, { base: 90, octaves: 6, amp: 60, seed: 5 }); floorR.repeat.set(24, 40);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x6a77a8, map: floorTex, roughnessMap: floorR, roughness: 0.34, metalness: 0.0, envMapIntensity: 2.4 });

  // geometry
  const SP = 9, ROWS = 17, COLS = 8, HT = 24;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), floorMat); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const pierGeo = new RoundedBoxGeometry(2.4, HT, 2.4, 2, 0.08);
  const piers = new THREE.InstancedMesh(pierGeo, pierMat, ROWS * COLS); piers.castShadow = piers.receiveShadow = true;
  const m4 = new THREE.Matrix4(); let n = 0;
  const x0 = -(COLS - 1) / 2 * SP;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { m4.makeTranslation(x0 + c * SP, HT / 2, 12 - r * SP); piers.setMatrixAt(n++, m4); }
  scene.add(piers);

  // roof slab: one coffer per cell, some cells open to the sky
  const open = [];
  const rs = (i, j) => { const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); };
  const boxes = [];
  for (let r = -1; r < ROWS; r++) for (let c = -1; c < COLS; c++) {
    const cx = x0 + c * SP + SP / 2, cz = 12 - r * SP - SP / 2;
    const isOpen = rs(c, r) > 0.4;
    if (!isOpen) boxes.push([cx, cz, SP, SP]);
    else {
      const a = 5.6, f = (SP - a) / 2;
      boxes.push([cx, cz - (a / 2 + f / 2), SP, f], [cx, cz + (a / 2 + f / 2), SP, f], [cx - (a / 2 + f / 2), cz, f, a], [cx + (a / 2 + f / 2), cz, f, a]);
      open.push([cx, cz, a]);
    }
  }
  const slab = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 2.2, 1), slabMat, boxes.length); slab.castShadow = slab.receiveShadow = true;
  boxes.forEach((b, i) => { m4.makeScale(b[2] - 0.04, 1, b[3] - 0.04); m4.setPosition(b[0], HT + 1.1, b[1]); slab.setMatrixAt(i, m4); });
  scene.add(slab);

  // volumetric shafts: sheared prisms under each opening, additive, soft at the ends and at grazing angles
  const shaftMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color(0.62, 0.74, 1.0) } },
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ vY=position.y; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying float vY; varying vec3 vN; varying vec3 vV; varying vec3 vW; uniform float uTime; uniform vec3 uCol;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float nz(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){
        float fade = smoothstep(0.,0.18,vY) * (1.-smoothstep(0.55,1.,vY));
        float fr = pow(abs(dot(normalize(vN),normalize(vV))),1.4);
        float d = nz(vW.xz*0.35 + vec2(uTime*0.03, 0.)) * 0.6 + nz(vec2(vW.y*0.12 - uTime*0.05, vW.x*0.2))*0.4;
        float a = fade * fr * (0.10 + 0.16*d);
        gl_FragColor = vec4(uCol*a, a);
      }`
  });
  const tilt = new THREE.Vector3(sunDir.x / -sunDir.y, 0, sunDir.z / -sunDir.y);
  open.forEach(([cx, cz, a]) => {
    const g = new THREE.BoxGeometry(a, 1, a, 1, 8, 1); g.translate(0, 0.5, 0); // y runs 0..1 = roof to floor
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const u = pos.getY(i); pos.setX(i, pos.getX(i) + tilt.x * HT * u); pos.setZ(i, pos.getZ(i) + tilt.z * HT * u); }
    const sh = new THREE.Mesh(g, shaftMat);
    sh.position.set(cx, HT, cz); sh.scale.set(1, -HT, 1); sh.frustumCulled = false;
    scene.add(sh);
  });

  // dust
  const DN = 700; const dp = new Float32Array(DN * 3); const dsd = new Float32Array(DN);
  for (let i = 0; i < DN; i++) { dp[i * 3] = (Math.random() - 0.5) * 70; dp[i * 3 + 1] = Math.random() * 20; dp[i * 3 + 2] = 14 - Math.random() * 130; dsd[i] = Math.random() * 6.28; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xcfe0ff, size: 0.09, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  scene.add(dust);

  // sizing
  const size = () => {
    const r = cv.getBoundingClientRect(); const w = Math.max(2, r.width | 0), h = Math.max(2, r.height | 0);
    renderer.setPixelRatio(soft ? 0.6 : Math.min(devicePixelRatio || 1, 1.5)); renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.fov = w / h < 0.9 ? 58 : 44; cam.updateProjectionMatrix();
  };
  size(); addEventListener('resize', size);
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });

  const A = new THREE.Vector3(), Bv = new THREE.Vector3();
  let lastR = 0;
  const frame = (t) => {
    if (soft && t - lastR < 0.9 && lastR) return; lastR = t;
    const b = section.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.5 - b.top) / b.height));
    const e = p * p * (3 - 2 * p);
    mouse.sx += (mouse.x - mouse.sx) * 0.05; mouse.sy += (mouse.y - mouse.sy) * 0.05;
    // the camera walks the aisle between pier columns, lowering as it goes
    const z = 14 - e * 70, y = 2.4 - e * 0.7;
    cam.position.set(Math.sin(t * 0.13) * 0.25 + mouse.sx * 1.2, y + Math.sin(t * 0.21) * 0.05 - mouse.sy * 0.4, z);
    A.set(0.6 + 1.6 * (1 - e) + mouse.sx * 3, 7 - e * 2.2 - mouse.sy * 2, z - 30);
    cam.lookAt(A);
    shaftMat.uniforms.uTime.value = t;
    const pos = dust.geometry.attributes.position;
    for (let i = 0; i < DN; i++) { pos.setY(i, pos.getY(i) + Math.sin(t * 0.3 + dsd[i]) * 0.0016 - 0.0008); pos.setX(i, pos.getX(i) + Math.cos(t * 0.2 + dsd[i]) * 0.0012); if (pos.getY(i) < 0.2) pos.setY(i, 20); }
    pos.needsUpdate = true;
    const t0 = performance.now(); renderer.render(scene, cam); window.__hallMs = performance.now() - t0;
  };
  register(cv, frame);
  frame(2);
  addEventListener('scroll', () => { if (reduced) frame(2); }, { passive: true });
  cv.dataset.ready = '1';
}
