import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

(function init() {
  const BG = window.BG || (window.BG = { coreP: 0, heroP: 0, active: -1 });
  const canvas = document.getElementById('gl');
  const stage = document.getElementById('stage');
  if (!canvas || !stage) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch (e) { return; }
  if (!renderer.getContext()) return;

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const sm = (a, b, x) => { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const LOWQ = /[?&]q=low/.test(location.search);
  renderer.setPixelRatio(LOWQ ? 0.5 : DPR);
  renderer.setClearColor(new THREE.Color().setRGB(0.0012, 0.0024, 0.0091, THREE.SRGBColorSpace), 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
  const P = new THREE.Vector3(0, 0, -78);

  /* ---------- rail: rectangular line tube along a curve ---------- */
  const railPts = [[-34, -18, 26], [-20, -8, 14], [-9, -13, 4], [3, -7, -6], [10, 2, -16], [4, 9, -28], [-6, 5, -40], [-2, -1, -52], [0, 0, -62], [0, 0, P.z]]
    .map(a => new THREE.Vector3(...a));
  const rail = new THREE.CatmullRomCurve3(railPts, false, 'catmullrom', 0.5);
  const N = 520;
  const frames = rail.computeFrenetFrames(N, false);
  const centers = [];
  for (let i = 0; i <= N; i++) centers.push(rail.getPoint(i / N));
  const HW = 1.55, HH = 0.9;
  const corner = (i, j, s) => {
    const sx = [-1, 1, 1, -1][j], sy = [-1, -1, 1, 1][j];
    return centers[i].clone().addScaledVector(frames.normals[i], sx * HW * s).addScaledVector(frames.binormals[i], sy * HH * s);
  };
  const pos = [], tt = [];
  const seg = (a, b, ua, ub) => { pos.push(a.x, a.y, a.z, b.x, b.y, b.z); tt.push(ua, ub); };
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N;
    for (let j = 0; j < 4; j++) seg(corner(i, j, 1), corner(i + 1, j, 1), u0, u1);
    if (i % 4 === 0) for (let j = 0; j < 4; j++) seg(corner(i, j, 1), corner(i, (j + 1) % 4, 1), u0, u0);
    if (i % 26 === 0) {
      for (let j = 0; j < 4; j++) { seg(corner(i, j, 1.28), corner(i, (j + 1) % 4, 1.28), u0, u0); seg(corner(i, j, 1), corner(i, j, 1.28), u0, u0); }
    }
  }
  const railGeo = new THREE.BufferGeometry();
  railGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  railGeo.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1));
  const railMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 1 }, uGain: { value: 1 } },
    vertexShader: `attribute float aT; varying float vT; varying float vD;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vD=-mv.z; vT=aT; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTime; uniform float uAlpha; uniform float uGain; varying float vT; varying float vD;
      void main(){
        float p=pow(max(0.0,sin(vT*46.0-uTime*1.3)),28.0);
        float q=pow(max(0.0,sin(vT*13.0-uTime*0.6+1.7)),10.0)*0.5;
        vec3 base=vec3(0.10,0.28,0.95);
        vec3 col=mix(base,vec3(0.82,0.9,1.0),clamp(p+q*0.6,0.0,1.0));
        float k=0.4+p*1.0+q*0.45+smoothstep(0.75,1.0,vT)*0.6;
        float fade=smoothstep(150.0,10.0,vD)*smoothstep(4.0,16.0,vD);
        gl_FragColor=vec4(col*k*fade*uAlpha*uGain,1.0);
      }`
  });
  const railMesh = new THREE.LineSegments(railGeo, railMat);
  scene.add(railMesh);

  /* packets: solid light riding the rail */
  const PK = 74;
  const pkGeo = new THREE.BoxGeometry(1, 1, 1);
  const pkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const packets = new THREE.InstancedMesh(pkGeo, pkMat, PK);
  packets.frustumCulled = false;
  const pk = [];
  const col = new THREE.Color();
  for (let i = 0; i < PK; i++) {
    const r = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, r2 = Math.abs(Math.sin(i * 78.233) * 12345.6) % 1, r3 = Math.abs(Math.sin(i * 3.7) * 9871.3) % 1;
    pk.push({ u: r, sp: 0.012 + r2 * 0.02, w: 0.5 + r3 * 1.4, h: 0.3 + r2 * 0.8, l: 0.5 + r * 3.2, lane: r3 - 0.5, lane2: r2 - 0.5 });
    col.setHSL(0.61 + r2 * 0.03, 0.9, 0.34 + r3 * 0.3);
    packets.setColorAt(i, col);
  }
  scene.add(packets);
  const _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

  /* ---------- flows: five curves converging on P ---------- */
  const flowGroup = new THREE.Group(); scene.add(flowGroup);
  let flows = [];
  const starts = [[-13, 6, -66], [-16, -1.5, -71], [-8, -7.5, -62], [2, 8, -70], [9.5, -6.5, -66]];
  const flowMatTpl = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uDraw: { value: 0 }, uBright: { value: 0.4 } },
    vertexShader: `varying float vU; varying float vD;
      void main(){ vU=uv.x; vec4 mv=modelViewMatrix*vec4(position,1.0); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTime; uniform float uDraw; uniform float uBright; varying float vU; varying float vD;
      void main(){
        if(vU>uDraw) discard;
        float head=smoothstep(uDraw-0.12,uDraw,vU);
        float p=pow(max(0.0,sin(vU*30.0-uTime*2.2)),14.0);
        vec3 c=mix(vec3(0.14,0.36,1.0),vec3(0.8,0.9,1.0),clamp(vU*vU*0.6+p*0.6+head*0.8,0.0,1.0));
        float k=uBright*(0.7+p*1.1+head*1.2+vU*0.25);
        gl_FragColor=vec4(c*k*smoothstep(160.0,8.0,vD),1.0);
      }`
  });
  function buildFlows() {
    flows.forEach(f => { f.mesh.geometry.dispose(); f.mesh.material.dispose(); flowGroup.remove(f.mesh); });
    flows = [];
    const asp = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const fx = clamp(asp / 1.6, 0.34, 1.25);
    starts.forEach((s, i) => {
      const S = new THREE.Vector3(s[0] * fx, s[1], s[2]);
      const d = P.clone().sub(S);
      const side = i % 2 ? -1 : 1;
      const c1 = S.clone().add(new THREE.Vector3(d.x * 0.55, side * 3.2, d.z * 0.12));
      const c2 = P.clone().add(new THREE.Vector3(-d.x * 0.18, -side * 2.4, 11));
      const curve = new THREE.CubicBezierCurve3(S, c1, c2, P);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 180, 0.04, 5, false), flowMatTpl());
      flowGroup.add(mesh);
      flows.push({ S, curve, mesh });
    });
  }

  /* convergence point */
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(160,190,255,.8)'); g.addColorStop(.5, 'rgba(40,90,255,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); return t;
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.position.copy(P); scene.add(glow);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  core.position.copy(P); scene.add(core);


  /* ---------- the world beyond the point: rail extension + one set piece per section ---------- */
  const post = new THREE.Group(); scene.add(post);
  const postMat = railMat.clone();      // separate alpha/gain from the hero rail
  const floorMat = railMat.clone(); floorMat.uniforms.uGain.value = 0.3;
  const ext = new THREE.CatmullRomCurve3([[0, 0, -78], [1, 0.5, -92], [6, 2, -112], [3, -1, -136], [-4, 1, -160], [-2, 3, -184], [5, 1, -208], [3, -1, -232], [0, 0, -258], [0, 0, -288]].map(a => new THREE.Vector3(...a)), false, 'catmullrom', 0.5);
  const lineMesh = (arr, tarr, mat) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(tarr, 1));
    const m = new THREE.LineSegments(g, mat); m.frustumCulled = false; post.add(m); return m;
  };
  function railLines(curve, n, hw, hh, uOff, uScale, tickEvery, mat) {
    const fr = curve.computeFrenetFrames(n, false), c = [];
    for (let i = 0; i <= n; i++) c.push(curve.getPoint(i / n));
    const cor = (i, j, s) => c[i].clone().addScaledVector(fr.normals[i], [-1, 1, 1, -1][j] * hw * s).addScaledVector(fr.binormals[i], [-1, -1, 1, 1][j] * hh * s);
    const A = [], Tt = [], sg = (a, b, u0, u1) => { A.push(a.x, a.y, a.z, b.x, b.y, b.z); Tt.push(uOff + u0 * uScale, uOff + u1 * uScale); };
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      for (let j = 0; j < 4; j++) sg(cor(i, j, 1), cor(i + 1, j, 1), u0, u1);
      if (i % tickEvery === 0) for (let j = 0; j < 4; j++) sg(cor(i, j, 1), cor(i, (j + 1) % 4, 1), u0, u0);
    }
    lineMesh(A, Tt, mat);
    return { c, fr };
  }
  const main = railLines(ext, 760, HW, HH, 0.0, 1.0, 4, postMat);
  const basisAt = u => { const t = ext.getTangentAt(u), r = new THREE.Vector3(0, 1, 0).cross(t).normalize(), up = t.clone().cross(r).normalize(); return { p: ext.getPointAt(u), t, r, up }; };

  // 1. established: portal frames the clients' network passes through
  (() => {
    const A = [], Tt = [];
    for (let k = 0; k < 11; k++) {
      const u = 0.05 + k * 0.0145, b = basisAt(u), s = 3.2 + k * 0.1, w = HW * s, h = HH * s * 1.25;
      const cs = [[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => b.p.clone().addScaledVector(b.r, x).addScaledVector(b.up, y));
      for (let j = 0; j < 4; j++) { const a = cs[j], c = cs[(j + 1) % 4]; A.push(a.x, a.y, a.z, c.x, c.y, c.z); Tt.push(u, u + 0.002 + j * 0.05); }
    }
    lineMesh(A, Tt, postMat);
  })();

  // 2. build: the rail splits into three branches
  const nodes = [];
  (() => {
    const u0 = 0.235, b = basisAt(u0);
    [[-1, -0.25], [0, 0.5], [1, -0.1]].forEach(([j, lift], i) => {
      const e = b.p.clone().addScaledVector(b.r, j * 21).addScaledVector(b.up, lift * 14).addScaledVector(b.t, 40);
      const cv = new THREE.CatmullRomCurve3([b.p.clone(), b.p.clone().addScaledVector(b.t, 9), b.p.clone().addScaledVector(b.t, 20).addScaledVector(b.r, j * 7).addScaledVector(b.up, lift * 4), e], false, 'catmullrom', 0.5);
      railLines(cv, 150, 0.95, 0.55, 0.23 + i * 0.1, 0.2, 5, postMat);
      nodes.push(e);
    });
  })();

  // 3. support: rings around the rail, a dial you travel through
  (() => {
    const A = [], Tt = [];
    for (let k = 0; k < 15; k++) {
      const u = 0.375 + k * 0.0125, b = basisAt(u), R = k % 5 === 0 ? 9.4 : 8, seg = 96;
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * 6.2832, a1 = (i + 1) / seg * 6.2832;
        const p0 = b.p.clone().addScaledVector(b.r, Math.cos(a0) * R).addScaledVector(b.up, Math.sin(a0) * R);
        const p1 = b.p.clone().addScaledVector(b.r, Math.cos(a1) * R).addScaledVector(b.up, Math.sin(a1) * R);
        A.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z); Tt.push(u + i * 0.0006, u + (i + 1) * 0.0006);
        if (k % 5 === 0 && i % 4 === 0) {
          const p2 = b.p.clone().addScaledVector(b.r, Math.cos(a0) * (R - 1.4)).addScaledVector(b.up, Math.sin(a0) * (R - 1.4));
          A.push(p0.x, p0.y, p0.z, p2.x, p2.y, p2.z); Tt.push(u + i * 0.0006, u + i * 0.0006);
        }
      }
    }
    lineMesh(A, Tt, postMat);
  })();

  // 4. own: a BitGo-blue surface standing in the world, lit by the rail
  const wallMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uFade: { value: 0 } }, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; uniform float uFade; varying vec2 vUv;
      void main(){
        vec2 g=abs(fract(vUv*vec2(26.0,15.0))-0.5);
        float ln=smoothstep(0.47,0.5,max(g.x,g.y));
        float edge=smoothstep(0.0,0.12,min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y)));
        float sweep=pow(max(0.0,sin(vUv.x*5.0-vUv.y*2.0-uTime*0.5)),8.0);
        vec3 base=mix(vec3(0.004,0.03,0.42),vec3(0.012,0.1,0.78),pow(vUv.y,1.4)*0.8+vUv.x*0.2);
        vec3 c=base*(0.55+0.45*edge)+vec3(0.1,0.22,0.6)*ln*0.5+vec3(0.12,0.2,0.5)*sweep*0.5+vec3(0.5,0.65,1.0)*(1.0-edge)*0.35;
        gl_FragColor=vec4(c*uFade*0.85,1.0);
      }`
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(42, 24), wallMat);
  (() => { const b = basisAt(0.59); wall.position.copy(b.p).addScaledVector(b.r, -27).addScaledVector(b.t, 14).addScaledVector(b.up, 2); wall.lookAt(b.p.clone().addScaledVector(b.t, -30).addScaledVector(b.r, -4)); post.add(wall); })();

  // 5. spotlight + latest: a skyline of line towers either side of the rail
  (() => {
    const A = [], Tt = [], rn = i => Math.abs(Math.sin(i * 91.17 + 3.1) * 43758.5453) % 1;
    for (let i = 0; i < 46; i++) {
      const u = 0.66 + (i >> 1) * 0.0105, side = i % 2 ? 1 : -1, b = basisAt(Math.min(0.99, u));
      const off = 15 + rn(i) * 16, w = 2 + rn(i + 50) * 3.4, d = 2 + rn(i + 99) * 3, h = 8 + rn(i + 7) * 30 * (1 - Math.abs(u - 0.8) * 1.2);
      const base = b.p.clone().addScaledVector(b.r, side * off).addScaledVector(b.up, -10);
      const P8 = [];
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, z]) => { P8.push(base.clone().addScaledVector(b.r, x * w).addScaledVector(b.t, z * d)); });
      for (let j = 0; j < 4; j++) {
        const a = P8[j], c = P8[(j + 1) % 4], up = a.clone().addScaledVector(b.up, h), up2 = c.clone().addScaledVector(b.up, h);
        A.push(a.x, a.y, a.z, up.x, up.y, up.z); Tt.push(u, u + h * 0.004);
        A.push(up.x, up.y, up.z, up2.x, up2.y, up2.z); Tt.push(u + h * 0.004, u + h * 0.004);
        for (let f = 1; f < h / 5; f++) { const q = a.clone().addScaledVector(b.up, f * 5), q2 = c.clone().addScaledVector(b.up, f * 5); A.push(q.x, q.y, q.z, q2.x, q2.y, q2.z); Tt.push(u + f * 0.02, u + f * 0.02); }
      }
    }
    lineMesh(A, Tt, postMat);
  })();

  // floor of light lines under the whole extension
  (() => {
    const A = [], Tt = [];
    for (let x = -80; x <= 80; x += 5) { A.push(x, -11, -80, x, -11, -300); Tt.push(0, 1); }
    for (let z = -80; z >= -300; z -= 5) { A.push(-80, -11, z, 80, -11, z); Tt.push((-z - 80) / 220, (-z - 80) / 220 + 0.2); }
    lineMesh(A, Tt, floorMat);
  })();

  // packets on the extension
  const PK2 = 80, pk2 = [];
  const pkMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const packets2 = new THREE.InstancedMesh(pkGeo, pkMat2, PK2); packets2.frustumCulled = false; post.add(packets2);
  for (let i = 0; i < PK2; i++) {
    const r = Math.abs(Math.sin(i * 17.31) * 43758.5453) % 1, r2 = Math.abs(Math.sin(i * 41.7) * 12345.6) % 1, r3 = Math.abs(Math.sin(i * 5.9) * 9871.3) % 1;
    pk2.push({ u: r, sp: 0.006 + r2 * 0.01, w: 0.5 + r3 * 1.2, h: 0.3 + r2 * 0.7, l: 0.8 + r * 3.4, lane: r3 - 0.5, lane2: r2 - 0.5 });
    col.setHSL(0.61 + r2 * 0.03, 0.9, 0.38 + r3 * 0.3); packets2.setColorAt(i, col);
  }
  // end node: the rail resolves into one light
  const endGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
  endGlow.position.copy(ext.getPointAt(1)); endGlow.scale.set(14, 14, 1); post.add(endGlow);
  nodes.forEach(n => { const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 })); g.position.copy(n); g.scale.set(4.5, 4.5, 1); post.add(g); });

  /* ---------- post: bloom + light rays from P ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.55, 0.32);
  composer.addPass(bloom);
  const rays = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uCenter: { value: new THREE.Vector2(0.6, 0.5) }, uStrength: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uCenter; uniform float uStrength; varying vec2 vUv;
      void main(){
        vec4 base=texture2D(tDiffuse,vUv);
        vec2 d=(uCenter-vUv)*(1.0/32.0)*0.85; vec2 c=vUv; float w=1.0; vec3 acc=vec3(0.0);
        for(int i=0;i<32;i++){ c+=d; vec3 s=texture2D(tDiffuse,c).rgb; float l=max(max(s.r,s.g),s.b); acc+=s*smoothstep(0.55,1.4,l)*w; w*=0.955; }
        gl_FragColor=vec4(base.rgb+acc*uStrength*0.022,1.0);
      }`
  });
  composer.addPass(rays);
  composer.addPass(new OutputPass());

  /* ---------- sizing ---------- */
  let W = 1, H = 1, shiftX = 0, shiftY = 0;
  function resize() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    renderer.setSize(W, H, false);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    composer.setPixelRatio(LOWQ ? 0.5 : DPR); composer.setSize(W, H);
    bloom.resolution.set(W / 2, H / 2);
    camera.aspect = W / H;
    const mobile = W / H < 0.9;
    shiftX = mobile ? 0 : 0.14; shiftY = mobile ? 0.13 : 0;
    camera.fov = mobile ? 52 : 40;
    camera.setViewOffset(W, H, -shiftX * W, shiftY * H, W, H);
    camera.updateProjectionMatrix();
    buildFlows();
  }
  resize();
  let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });

  /* ---------- camera path ---------- */
  const K0 = [new THREE.Vector3(-15, 6, 40), new THREE.Vector3(-10, -1, -8)];
  const K1 = [new THREE.Vector3(3, 2.5, 2), new THREE.Vector3(0, 0, -62)];
  const K2 = [new THREE.Vector3(0, 0, -41), P.clone()];
  const camPos = K0[0].clone(), camLook = K0[1].clone();
  const tgtPos = new THREE.Vector3(), tgtLook = new THREE.Vector3();
  function camTargets(hp, cp, t) {
    const a = sm(0, 0.55, hp), b = sm(0.5, 1, hp);
    tgtPos.copy(K0[0]).lerp(K1[0], a).lerp(K2[0], b);
    tgtLook.copy(K0[1]).lerp(K1[1], a).lerp(K2[1], b);
    tgtPos.z += -cp * 6; tgtPos.x += Math.sin(t * 0.2) * 0.4 * (1 - b * 0.7); tgtPos.y += Math.cos(t * 0.17) * 0.3;
    const pu = BG.postU || 0;
    if (pu > 0) {
      const w = sm(0, 0.03, pu), u = clamp(pu, 0, 1);
      const pp = ext.getPointAt(u), tn = ext.getTangentAt(u), la = ext.getPointAt(Math.min(1, u + 0.05));
      const side = W / H < 0.9 ? 0 : -5.5;
      _cp.copy(pp).addScaledVector(tn, -14); _cp.x += side + Math.sin(t * 0.2) * 0.3; _cp.y += 2.6;
      tgtPos.lerp(_cp, w); tgtLook.lerp(la, w);
    }
  }
  const _cp = new THREE.Vector3();

  /* ---------- labels ---------- */
  const labels = Array.from(document.querySelectorAll('.flow-label'));
  const ptEl = document.querySelector('.core-point');
  const v3 = new THREE.Vector3();
  function placeLabels(show) {
    const full = camera.projectionMatrix;
    labels.forEach((el, i) => {
      if (!show || !flows[i]) return;
      v3.copy(flows[i].S).project(camera);
      let x = (v3.x * 0.5 + 0.5) * W, y = (1 - (v3.y * 0.5 + 0.5)) * H;
      const w = el.offsetWidth || 120;
      x = clamp(x, 14, W - w - 14); y = W > 900 ? clamp(y, 100, H - 150) : clamp(y, H * 0.27, H * 0.6);
      if (W > 900 && x > W * 0.5 && y > H * 0.52) y = H * 0.52;
      el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translateY(-50%)`;
    });
    if (show && ptEl) {
      v3.copy(P).project(camera);
      const x = (v3.x * 0.5 + 0.5) * W, y = (1 - (v3.y * 0.5 + 0.5)) * H;
      ptEl.style.transform = `translate(${x.toFixed(1)}px,${(y + 120).toFixed(1)}px) translate(-50%,0)`;
      ptEl.style.left = '0'; ptEl.style.top = '0';
      rays.uniforms.uCenter.value.set(v3.x * 0.5 + 0.5, v3.y * 0.5 + 0.5);
    }
  }

  /* ---------- loop ---------- */
  let visible = true;
  const rm = !!BG.rm;
  const clock = new THREE.Clock();
  let T = rm ? 4 : 0, first = true, flowSmooth = flows.map(() => 0), connSm = 0, finSm = 0;

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, clock.getDelta());
    if (!rm) T += dt;
    const hp = BG.heroP || 0, cp = BG.coreP || 0;
    camTargets(hp, cp, T);
    const k = first || rm ? 1 : 1 - Math.exp(-dt * 6);
    camPos.lerp(tgtPos, k); camLook.lerp(tgtLook, k);
    camera.position.copy(camPos); camera.lookAt(camLook);
    camera.updateMatrixWorld();

    const pu = BG.postU || 0, gone = 1 - sm(0, 0.05, pu);
    railMat.uniforms.uTime.value = T; postMat.uniforms.uTime.value = T; floorMat.uniforms.uTime.value = T; wallMat.uniforms.uTime.value = T;
    const pf = sm(0, 0.06, pu); post.visible = pu > 0.001;
    postMat.uniforms.uAlpha.value = pf; floorMat.uniforms.uAlpha.value = pf; wallMat.uniforms.uFade.value = pf;
    for (let i = 0; i < PK2; i++) {
      const o = pk2[i], u = (o.u + T * o.sp) % 1, fi = Math.min(760, Math.floor(u * 760));
      const c = main.c[fi], nn = main.fr.normals[fi], bb = main.fr.binormals[fi], tn = main.fr.tangents[fi];
      _p.copy(c).addScaledVector(nn, o.lane * HW * 0.6).addScaledVector(bb, o.lane2 * HH * 0.5);
      _m.makeBasis(nn, bb, tn); _s.set(o.w, o.h, o.l); _m.scale(_s); _m.setPosition(_p);
      packets2.setMatrixAt(i, _m);
    }
    packets2.instanceMatrix.needsUpdate = true;
    const railFade = 1 - 0.82 * sm(0.55, 1, hp);
    railMat.uniforms.uAlpha.value = railFade;

    // packets
    for (let i = 0; i < PK; i++) {
      const o = pk[i];
      let u = (o.u + T * o.sp + hp * 0.05) % 1;
      const fi = Math.min(N - 1, Math.floor(u * N));
      const c = centers[fi], nn = frames.normals[fi], bb = frames.binormals[fi], tn = frames.tangents[fi];
      const squeeze = 1 - sm(0.9, 1, u) * 0.9;
      _p.copy(c).addScaledVector(nn, o.lane * (HW * 0.6)).addScaledVector(bb, o.lane2 * (HH * 0.5));
      _m.makeBasis(nn, bb, tn);
      _s.set(o.w * squeeze, o.h * squeeze, o.l * (0.6 + (1 - squeeze)));
      _m.scale(_s); _m.setPosition(_p);
      packets.setMatrixAt(i, _m);
    }
    packets.instanceMatrix.needsUpdate = true;
    pkMat.opacity = 0.62 * railFade * (1 - sm(0.55, 0.85, hp));

    // flows
    const act = BG.active, cpp = cp;
    let conn = 0;
    flows.forEach((f, i) => {
      const a = 0.06 + 0.16 * i;
      const draw = sm(a - 0.04, a + 0.12, cpp) * 1.02;
      const fin = sm(0.86, 0.97, cpp);
      const u = f.mesh.material.uniforms;
      u.uTime.value = T; u.uDraw.value = draw;
      const target = (act === i ? 1.25 : (act === -1 && cpp > 0.5 ? 0.7 : 0.55)) * gone;
      u.uBright.value += (target - u.uBright.value) * (rm ? 1 : 0.12);
      conn += clamp(draw, 0, 1);
    });
    flowGroup.visible = (cp > 0.01 || rm) && gone > 0.01;
    core.visible = gone > 0.01;
    conn /= 5; connSm += (conn - connSm) * 0.15;
    const fin = sm(0.86, 0.98, cp);
    // point glow
    const gs = 2.2 + connSm * 1.6 + fin * 0.2 + Math.sin(T * 2) * 0.2;
    glow.scale.set(gs, gs, 1); glow.material.opacity = (0.35 + connSm * 0.35) * gone;
    core.scale.setScalar(0.4 + connSm * 0.35 + fin * 0.25);
    rays.uniforms.uStrength.value = (0.15 + connSm * 0.45 + fin * 0.2) * (0.3 + 0.7 * sm(0.3, 1, hp)) * gone;
    bloom.strength = 0.45 + connSm * 0.2 + fin * 0.02; bloom.threshold = 0.32 + fin * 0.35;

    const showLabels = (cp > 0 && cp < 1) || rm;
    placeLabels(showLabels || hp > 0.9);
    composer.render();
    if (first) { first = false; document.documentElement.classList.add('gl-on'); }
  }
  frame();
})();
