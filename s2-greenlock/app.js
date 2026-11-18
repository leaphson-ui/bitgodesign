import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
} catch (e) { canvas.style.display = 'none'; }

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();

  /* ---------- generated environment: gradient dome + softboxes ---------- */
  function makeEnv() {
    const s = new THREE.Scene();
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(50, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: 'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: 'varying vec3 p;void main(){float h=p.y*.5+.5;vec3 bot=vec3(.05,.10,.34);vec3 mid=vec3(.55,.66,.90);vec3 top=vec3(.94,.96,1.);vec3 c=mix(bot,mid,smoothstep(0.,.42,h));c=mix(c,top,smoothstep(.42,.95,h));gl_FragColor=vec4(c,1.);}',
      })
    );
    s.add(dome);
    const box = (w, h, x, y, z, k, col) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
    };
    box(40, 9, -20, 26, 22, 7, 0xffffff);
    box(8, 40, 34, 8, 6, 5, 0xeaf0ff);
    box(30, 6, 10, -8, -34, 3, 0x7fa0ff);
    box(14, 14, -34, 0, -6, 2.2, 0xffffff);
    const pm = new THREE.PMREMGenerator(renderer);
    const t = pm.fromScene(s, 0.03).texture;
    pm.dispose();
    return t;
  }
  const env = makeEnv();
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-300, 600, 800); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9db8ff, 1.4); rim.position.set(500, -200, -300); scene.add(rim);

  const C = { ice: 0xdce7ff, sky: 0x8fb0ff, blue: 0x1647db, navy: 0x0b1a4a, white: 0xffffff };
  const glass = (color, op = 0.82, rough = 0.2, extra = {}) => new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18, transparent: true, opacity: op,
    envMap: env, envMapIntensity: 1.25, ior: 1.5, specularIntensity: 1, sheen: 0.2, sheenColor: new THREE.Color(0xbcd0ff), ...extra,
  });
  const rb = (w, h, d, r = 0.025) => new RoundedBoxGeometry(w, h, d, 4, r);
  const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };

  /* ---------- builders: each returns {group, fit, update(p, t, ptr)} ---------- */
  const ease = (x) => x * x * (3 - 2 * x);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const B = {};

  B.prime = () => { // order-book depth: slabs narrow toward the top
    const g = new THREE.Group();
    const w = [1, 0.84, 0.68, 0.52, 0.36], cols = [C.blue, 0x3a64e8, C.sky, 0xb5c8ff, C.ice];
    w.forEach((x, i) => g.add(mesh(rb(x, 0.13, 0.55, 0.03), glass(cols[i], i < 2 ? 0.92 : 0.8, 0.28), (x - 1) * -0.5 * 0 + (i % 2 ? 0.05 : -0.05), 0.4 - i * 0.19, 0)));
    return { group: g, fit: 0.85 };
  };
  B.eco = () => { // hub and satellites
    const g = new THREE.Group();
    g.add(mesh(new THREE.SphereGeometry(0.2, 48, 32), glass(C.blue, 0.95, 0.3)));
    const n = 7;
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399;
      const v = new THREE.Vector3(Math.cos(th) * r, y * 0.8, Math.sin(th) * r).multiplyScalar(0.46);
      g.add(mesh(new THREE.SphereGeometry(0.075 + (i % 3) * 0.015, 32, 24), glass(i % 2 ? C.ice : C.sky, 0.88, 0.2), v.x, v.y, v.z));
      const len = v.length() - 0.2;
      const cyl = mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 10), glass(C.white, 0.7, 0.2));
      cyl.position.copy(v.clone().multiplyScalar(0.5 + 0.2 / v.length() * 0.5));
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
      g.add(cyl);
    }
    return { group: g, fit: 1.0 };
  };
  B.stable = () => { // two equal stacks (1:1) joined by a beam
    const g = new THREE.Group();
    const cg = new THREE.CylinderGeometry(0.2, 0.2, 0.09, 48);
    for (let i = 0; i < 4; i++) {
      g.add(mesh(cg, glass(C.ice, 0.85, 0.25), -0.27, -0.3 + i * 0.105, 0));
      g.add(mesh(cg, glass(C.blue, 0.93, 0.3), 0.27, -0.3 + i * 0.105, 0));
    }
    g.add(mesh(rb(0.98, 0.05, 0.24, 0.02), glass(C.white, 0.8, 0.12), 0, 0.16, 0));
    return { group: g, fit: 1.0 };
  };
  B.wallet = () => { // key shares inside a vault box
    const g = new THREE.Group();
    g.add(mesh(rb(0.95, 0.65, 0.55, 0.06), glass(C.ice, 0.4, 0.15, { depthWrite: false }), 0, 0, 0));
    [[-0.26, -0.05, 0.2], [0, 0.03, 0.26], [0.26, -0.02, 0.16]].forEach(([x, y, h]) => g.add(mesh(rb(0.15, h + 0.12, 0.15, 0.03), glass(C.blue, 0.96, 0.25), x, y - 0.07, 0)));
    g.children[0].renderOrder = 2;
    return { group: g, fit: 0.95 };
  };
  B.caas = () => { // a module plugging into a base
    const g = new THREE.Group();
    g.add(mesh(rb(1, 0.1, 0.6, 0.03), glass(C.ice, 0.85, 0.2), 0, -0.25, 0));
    const hs = [0.2, 0.34, 0.16], xs = [-0.3, 0, 0.3], cs = [C.sky, C.blue, 0xb5c8ff];
    const blocks = xs.map((x, i) => { const b = mesh(rb(0.26, hs[i], 0.3, 0.03), glass(cs[i], 0.93, 0.25), x, -0.2 + hs[i] / 2, 0); g.add(b); return b; });
    return { group: g, fit: 0.95, update(p) { blocks[1].position.y = -0.2 + hs[1] / 2 + 0.34 * clamp(Math.abs(p) * 1.1, 0, 1); } };
  };
  B.cred = () => { // charter sheets with a seal
    const g = new THREE.Group();
    [[-0.1, C.sky, -0.14], [0, C.ice, 0], [0.1, C.white, 0.14]].forEach(([y, c, r]) => { const s = mesh(rb(0.95, 0.04, 0.68, 0.015), glass(c, 0.88, 0.15)); s.position.y = y - 0.08; s.rotation.y = r; g.add(s); });
    const t = mesh(new THREE.TorusGeometry(0.16, 0.035, 24, 64), glass(C.blue, 0.96, 0.25), 0, 0.08, 0.02); t.rotation.x = Math.PI / 2; g.add(t);
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 40), glass(C.ice, 0.9, 0.2), 0, 0.07, 0.02));
    g.rotation.order = 'YXZ';
    return { group: g, fit: 1.0 };
  };
  B.tiers = () => {
    const g = new THREE.Group();
    [[1.1, -0.32, -0.3, C.ice], [0.8, 0, 0, C.sky], [0.5, 0.32, 0.3, C.blue]].forEach(([w, y, x, c], i) => g.add(mesh(rb(w, 0.24, 0.7, 0.04), glass(c, i === 2 ? 0.95 : 0.84, 0.22), x * 0.5, y, 0)));
    g.add(mesh(rb(0.5, 0.24, 0.7, 0.04), glass(C.white, 0.5, 0.1, { depthWrite: false }), 0.25, 0.62, 0));
    return { group: g, fit: 0.95 };
  };
  B.ring = () => { // 24 hours
    const g = new THREE.Group();
    const bs = [];
    for (let i = 0; i < 24; i++) {
      const m = glass(C.ice, 0.88, 0.2);
      const b = mesh(rb(0.1, 0.2, 0.2, 0.03), m);
      const a = (i / 24) * Math.PI * 2;
      b.position.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0); b.rotation.z = a - Math.PI / 2 + Math.PI / 2;
      g.add(b); bs.push(b);
    }
    const base = new THREE.Color(C.ice), hot = new THREE.Color(C.blue);
    return { group: g, fit: 1.1, update(p) {
      const pos = ((p + 1) / 2) * 24;
      bs.forEach((b, i) => {
        let d = Math.abs(i - pos); d = Math.min(d, 24 - d);
        const k = clamp(1 - d / 5, 0, 1);
        b.material.color.copy(base).lerp(hot, ease(k));
        b.scale.set(1, 1 + 0.5 * ease(k), 1 + 0.5 * ease(k));
      });
    } };
  };
  B.blocks = () => {
    const g = new THREE.Group();
    const pos = [[-0.56, -0.3], [0, -0.3], [0.56, -0.3], [-0.28, 0.02], [0.28, 0.02]];
    const cols = [C.ice, C.sky, 0xb5c8ff, 0x3a64e8, C.blue];
    const bl = pos.map(([x, y], i) => { const b = mesh(rb(0.5, 0.3, 0.5, 0.04), glass(cols[i], 0.9, 0.22), x, y, 0); b.userData = { x, y, s: 0.001 }; g.add(b); return b; });
    return { group: g, fit: 0.85, update(p, t, ptr, ctx) {
      const step = ctx.ownStep;
      bl.forEach((b, i) => {
        const target = step > i ? 1 : 0.001;
        b.userData.s += (target - b.userData.s) * (reduce ? 1 : 0.07);
        const s = b.userData.s;
        b.scale.setScalar(s);
        b.position.set(b.userData.x, b.userData.y + (1 - s) * 0.35, 0);
        b.visible = s > 0.01;
      });
    } };
  };

  /* ---------- blades: folded layers fanning out, edge-feathered for depth of field ---------- */
  const bladeVS = 'attribute vec3 aBary;attribute vec3 aH;attribute vec3 aF;attribute float aShade;varying vec3 vB;varying vec3 vH;varying vec3 vF;varying float vS;varying vec2 vP;void main(){vB=aBary;vH=aH;vF=aF;vS=aShade;vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const bladeFS = `precision highp float;varying vec3 vB;varying vec3 vH;varying vec3 vF;varying float vS;varying vec2 vP;
  uniform vec3 uA;uniform vec3 uB;uniform float uBlur;uniform float uAlpha;uniform vec2 uRes;uniform vec2 uPivot;uniform float uMask;uniform float uLen;
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){
    vec3 d=vB*vH+(1.-vF)*1e5;
    float e=min(d.x,min(d.y,d.z));
    float a=smoothstep(0.,uBlur,e);
    vec2 w=vP+uPivot;
    float nx=w.x/uRes.x+.5;
    float m=1.;
    if(uMask>.5&&uMask<1.5)m=smoothstep(.18,.62,nx);
    if(uMask>1.5&&uMask<2.5)m=smoothstep(.22,.7,nx);
    if(uMask>2.5){float ny2=(vP.y+uPivot.y)/uRes.y+.5;m=smoothstep(0.,.2,nx)*smoothstep(1.,.8,nx)*smoothstep(0.,.3,ny2)*smoothstep(1.,.7,ny2);}
    if(uMask>.5&&uMask<2.5){float ny=(vP.y+uPivot.y)/uRes.y+.5;m*=1.-.85*smoothstep(.84,.97,ny);}
    float t=clamp(length(vP)/uLen,0.,1.);
    vec3 c=mix(uA,uB,t)*vS;
    c+= (h(gl_FragCoord.xy)-.5)*.035;
    gl_FragColor=vec4(c,a*uAlpha*m);
  }`;
  const hexv = (h) => new THREE.Color(h).convertSRGBToLinear ? new THREE.Vector3(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255) : null;

  const PAL = {
    hero: [
      { a: 0x16255a, b: 0x2a45a8, blur: 80 }, { a: 0x0b2a8f, b: 0x1647db, blur: 120 }, { a: 0x1647db, b: 0x4a72ec, blur: 60 },
      { a: 0x6f93f5, b: 0xa5bdfb, blur: 140 }, { a: 0xaebfff, b: 0xd2deff, blur: 100 }, { a: 0xdce7ff, b: 0xf4f7ff, blur: 160 },
    ],
    est: [
      { a: 0x0b2a8f, b: 0x1647db, blur: 70 }, { a: 0x3a64e8, b: 0x6f93f5, blur: 50 }, { a: 0xaebfff, b: 0xdce7ff, blur: 90 }, { a: 0xffffff, b: 0xeaf0ff, blur: 120 },
    ],
    cta: [
      { a: 0x0b2a8f, b: 0x0b1a5e, blur: 80 }, { a: 0x3a64e8, b: 0x6f93f5, blur: 60 }, { a: 0x8fb0ff, b: 0xc3d3ff, blur: 100 },
      { a: 0xdce7ff, b: 0xffffff, blur: 70 }, { a: 0x0b1a5e, b: 0x1647db, blur: 130 },
    ],
  };

  function makeBlades(kind) {
    const pal = PAL[kind];
    const group = new THREE.Group();
    const meshes = [];
    const cfg = {
      hero: { pivot: [0.93, -0.12], a0: 100, a1: 168, hw: 14, mask: 1, alpha: 0.9 },
      est: { pivot: [-0.02, -0.05], a0: 15, a1: 80, hw: 13, mask: 3, alpha: 0.7 },
      cta: { pivot: [0.97, -0.1], a0: 102, a1: 172, hw: 13, mask: 2, alpha: 0.85 },
    }[kind];
    let W = 0, H = 0;
    const uniforms = [];
    function build(w, h) {
      W = w; H = h;
      meshes.forEach((m) => { m.geometry.dispose(); group.remove(m); });
      meshes.length = 0; uniforms.length = 0;
      const P = new THREE.Vector2((cfg.pivot[0] - 0.5) * w, (cfg.pivot[1] - 0.5) * h);
      group.position.set(P.x - w * 0.0, P.y, 0);
      const L = Math.hypot(w, h) * 1.4;
      const n = pal.length;
      pal.forEach((p, k) => {
        const ang = THREE.MathUtils.degToRad(cfg.a0 + (cfg.a1 - cfg.a0) * (n === 1 ? 0 : k / (n - 1)));
        const hw = THREE.MathUtils.degToRad(cfg.hw * (0.8 + (k % 3) * 0.25));
        const dir = (a) => new THREE.Vector2(Math.cos(a), Math.sin(a));
        const A = dir(ang - hw).multiplyScalar(L), M = dir(ang + 0.02).multiplyScalar(L * 1.02), Bv = dir(ang + hw).multiplyScalar(L);
        const O = new THREE.Vector2(0, 0);
        const tris = [[O, A, M, 0.9, [1, 0, 1]], [O, M, Bv, 1.08, [1, 1, 0]]];
        const pos = [], bary = [], hh = [], ff = [], sh = [];
        tris.forEach(([p0, p1, p2, shade, feather]) => {
          const pts = [p0, p1, p2];
          pts.forEach((q) => pos.push(q.x, q.y, 0));
          const edgeLen = (a, b) => a.distanceTo(b);
          // altitude from vertex i to opposite edge: 2*area/len(opposite)
          const area = Math.abs((p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y)) / 2;
          const alt = [2 * area / edgeLen(p1, p2), 2 * area / edgeLen(p0, p2), 2 * area / edgeLen(p0, p1)];
          bary.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
          for (let i = 0; i < 3; i++) { hh.push(alt[0], alt[1], alt[2]); }
          // barycentric b_i is 0 on edge opposite vertex i; feather flags per edge (opposite v0, v1, v2)
          // edge opposite p0 is p1-p2 (outer far edge): never feather (beyond screen). p0-p1 and p0-p2 are side edges.
          const fl = [0, feather[0], feather[2]];
          for (let i = 0; i < 3; i++) ff.push(fl[0], fl[1], fl[2]);
          for (let i = 0; i < 3; i++) sh.push(shade);
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('aBary', new THREE.Float32BufferAttribute(bary, 3));
        geo.setAttribute('aH', new THREE.Float32BufferAttribute(hh, 3));
        geo.setAttribute('aF', new THREE.Float32BufferAttribute(ff, 3));
        geo.setAttribute('aShade', new THREE.Float32BufferAttribute(sh, 1));
        const mat = new THREE.ShaderMaterial({
          vertexShader: bladeVS, fragmentShader: bladeFS, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
          uniforms: {
            uA: { value: hexv(p.a) }, uB: { value: hexv(p.b) }, uBlur: { value: p.blur * Math.max(0.6, Math.min(1.4, w / 1400)) }, uAlpha: { value: cfg.alpha },
            uRes: { value: new THREE.Vector2(w, h) }, uPivot: { value: P.clone() }, uMask: { value: cfg.mask }, uLen: { value: L * 0.9 },
          },
        });
        const m = new THREE.Mesh(geo, mat);
        m.userData = { ang, k };
        m.renderOrder = k;
        group.add(m); meshes.push(m);
      });
    }
    return { group, fit: 0, blades: true, build, size: () => [W, H], update(p, t) {
      meshes.forEach((m, i) => {
        const breathe = reduce ? 0 : Math.sin(t * 0.00018 * (1 + i * 0.13) + i * 1.7) * 0.012;
        const spread = (i - (meshes.length - 1) / 2) * p * 0.045;
        m.rotation.z = breathe + spread - p * 0.05;
      });
    } };
  }

  /* ---------- registry ---------- */
  const items = [...document.querySelectorAll('[data-gl]')].map((el) => {
    const id = el.dataset.gl;
    const obj = id.startsWith('blades-') ? makeBlades(id.slice(7)) : B[id]();
    obj.group.visible = false;
    scene.add(obj.group);
    return { el, obj, vis: false, p: 0, rx: 0, ry: 0, blades: !!obj.blades };
  });
  const vio = new IntersectionObserver((es) => es.forEach((e) => { items.find((i) => i.el === e.target).vis = e.isIntersecting; }), { rootMargin: '120px' });
  items.forEach((i) => vio.observe(i.el));

  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 6000);
  cam.position.z = 3000;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { ptr.tx = (e.clientX / innerWidth - 0.5) * 2; ptr.ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });

  let vw = 0, vh = 0;
  const resize = () => { vw = innerWidth; vh = innerHeight; renderer.setSize(vw, vh, false); };
  addEventListener('resize', resize); resize();

  /* ---------- scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) { lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 0.9 }); }

  const ownItems = [...document.querySelectorAll('.oi')];
  const ctx = { ownStep: 0 };
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  function frame(t) {
    requestAnimationFrame(frame);
    if (!running) return;
    if (lenis) lenis.raf(t);
    ptr.x += (ptr.tx - ptr.x) * 0.05; ptr.y += (ptr.ty - ptr.y) * 0.05;

    // own section step
    const line = vh * 0.62;
    let step = 0;
    ownItems.forEach((o, i) => {
      const r = o.getBoundingClientRect();
      const on = r.top < line && r.bottom > vh * 0.2;
      o.classList.toggle('on', on || (innerWidth <= 800));
      if (r.top < line) step = i + 1;
    });
    ctx.ownStep = step;

    renderer.clear();
    renderer.setScissorTest(true);
    for (const it of items) {
      if (!it.vis) continue;
      const r = it.el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > vh) continue;
      const pRaw = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
      it.p += (pRaw - it.p) * (reduce ? 1 : 0.09);
      const o = it.obj;
      if (it.blades) {
        const [w, h] = o.size();
        if (Math.abs(w - r.width) > 1 || Math.abs(h - r.height) > 1) o.build(r.width, r.height);
      } else {
        const s = Math.min(r.width, r.height) * o.fit;
        o.group.scale.setScalar(s);
        it.rx += ((0.5 + it.p * 0.07 + ptr.y * 0.05) - it.rx) * 0.1;
        it.ry += ((-0.62 - it.p * 0.4 + ptr.x * 0.1) - it.ry) * 0.1;
        o.group.rotation.set(it.rx, it.ry, 0);
      }
      if (o.update) o.update(it.p, t, ptr, ctx);
      const x = Math.round(r.left), y = Math.round(vh - r.bottom), w = Math.round(r.width), h = Math.round(r.height);
      renderer.setViewport(x, y, w, h);
      renderer.setScissor(x, y, w, h);
      cam.left = -w / 2; cam.right = w / 2; cam.top = h / 2; cam.bottom = -h / 2; cam.updateProjectionMatrix();
      if (it.blades) o.group.position.set(o.group.position.x - 0, o.group.position.y, 0);
      o.group.visible = true;
      renderer.render(scene, cam);
      o.group.visible = false;
    }
    renderer.setScissorTest(false);
  }
  requestAnimationFrame(frame);
  window.__glReady = true;
}
