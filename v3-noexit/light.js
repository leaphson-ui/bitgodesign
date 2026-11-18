/* Real 3D stone hall (three.js) lit by off-axis light, with depth-based volumetric shafts, prismatic halo and grain in one post pass. */
(function () {
  const canvas = document.getElementById('light');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fail = () => document.documentElement.classList.add('nogl');
  Promise.all([
    import('three'),
    import('three/addons/geometries/RoundedBoxGeometry.js'),
  ]).then(([THREE, RB]) => { try { init(THREE, RB.RoundedBoxGeometry); } catch (e) { console.error(e); fail(); } })
    .catch((e) => { console.error(e); fail(); });

  function init(THREE, RoundedBoxGeometry) {
    const gl2 = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl2) { fail(); return; }
    const renderer = new THREE.WebGLRenderer({ canvas, context: gl2 });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    /* ---------- tileable procedural noise (for stone detail maps) ---------- */
    const PERM = new Uint8Array(512);
    { const p = new Uint8Array(256); for (let i = 0; i < 256; i++) p[i] = i; let s = 1337;
      for (let i = 255; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); const t = p[i]; p[i] = p[j]; p[j] = t; }
      for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]; }
    const lat = (x, y, seed) => PERM[(PERM[(x & 255) + seed & 255] + y) & 255] / 255;
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    function vnoise(x, y, px, py, seed) {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px, y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
      const u = fade(xf), v = fade(yf);
      const a = lat(x0, y0, seed), b = lat(x1, y0, seed), c = lat(x0, y1, seed), d = lat(x1, y1, seed);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    // u,v in 0..1 ; fx,fy lattice frequencies (integers keep it tileable)
    function fbm(u, v, fx, fy, oct, seed) {
      let s = 0, a = 0.5, n = 0;
      for (let i = 0; i < oct; i++) { s += a * vnoise(u * fx, v * fy, fx, fy, seed + i * 31); n += a; fx *= 2; fy *= 2; a *= 0.5; }
      return s / n;
    }
    const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

    /* kind: 'stone' (fluted shafts, vertical chisel), 'ashlar' (courses with joints), 'floor' (polished slabs) */
    async function makeStone(kind, N) {
      let tk = performance.now(); const yieldNow = async () => { if (performance.now() - tk > 7) { await new Promise((r) => setTimeout(r, 4)); tk = performance.now(); } };
      const H = new Float32Array(N * N), alb = new Uint8Array(N * N * 4), rgh = new Uint8Array(N * N * 4);
      for (let y = 0; y < N; y++) {
        await yieldNow();
        for (let x = 0; x < N; x++) {
          const u = x / N, v = y / N, i = y * N + x;
          let h = 0.5 * fbm(u, v, 4, 4, 5, 3);
          const chisel = kind === 'stone' ? fbm(u, v, 48, 4, 3, 91) : kind === 'ashlar' ? fbm(u, v, 24, 24, 3, 91) : fbm(u, v, 64, 64, 2, 91);
          h += (kind === 'floor' ? 0.04 : 0.12) * chisel;
          const p = fbm(u, v, 28, 28, 3, 7);
          const pit = sstep(0.64, 0.76, p) * (kind === 'floor' ? 0.12 : 0.42);
          h -= pit;
          h += 0.02 * vnoise(u * 96, v * 96, 96, 96, 55);
          const rv = Math.abs(2 * fbm(u, v, 3, 3, 3, 13) - 1);
          const vein = Math.pow(1 - rv, 14);
          let groove = 0, joint = 0, tone = 0;
          if (kind === 'ashlar' || kind === 'floor') {
            const rows = kind === 'ashlar' ? 4 : 2, cols = kind === 'ashlar' ? 2 : 2;
            const rr = v * rows, ri = Math.floor(rr), rf = rr - ri;
            const off = kind === 'ashlar' ? (ri % 2) * 0.5 : 0;
            const cc = (u * cols + off), ci = Math.floor(cc), cf = cc - ci;
            const wob = 0.0025 * (vnoise(u * 90, v * 90, 90, 90, 5) - 0.5);
            const dj = Math.min(rf, 1 - rf, kind === 'ashlar' ? cf * 0.5 : cf, kind === 'ashlar' ? (1 - cf) * 0.5 : 1 - cf) + wob * rows;
            const w = kind === 'ashlar' ? 0.013 : 0.008;
            joint = 1 - sstep(w * 0.45, w, dj);
            groove = joint * 0.9;
            // chipped arris along the joint
            h -= sstep(w * 3, w, dj) * (0.08 + 0.12 * vnoise(u * 140, v * 140, 140, 140, 41));
            tone = (lat(ci + (ri * 7), ri, 5) - 0.5) * 0.16;
          }
          h -= groove * 0.7;
          H[i] = h;
          // albedo (sRGB bytes), warm limestone with cool veins
          const broad = fbm(u, v, 3, 3, 4, 21);
          let g = 0.50 + (broad - 0.5) * 0.22 + (kind === 'floor' ? -0.12 : 0) + tone * 0.6;
          g -= pit * 0.22; g -= vein * 0.1; g -= joint * 0.3; g += (chisel - 0.5) * 0.09;
          g += (vnoise(u * 96, v * 96, 96, 96, 55) - 0.5) * 0.05;
          const warm = 0.03 * (broad - 0.5);
          alb[i * 4] = Math.max(0, Math.min(255, (g + 0.035 + warm) * 255));
          alb[i * 4 + 1] = Math.max(0, Math.min(255, (g + 0.012) * 255));
          alb[i * 4 + 2] = Math.max(0, Math.min(255, (g - 0.02 - vein * 0.06) * 255));
          alb[i * 4 + 3] = 255;
          let r = (kind === 'floor' ? 0.36 : 0.72) + (chisel - 0.5) * 0.4 + pit * 0.5 + joint * 0.25 - vein * 0.1;
          if (kind === 'floor') r += (vnoise(u * 300, v * 6, 300, 6, 63) - 0.5) * 0.28; // faint scratches
          r = Math.max(kind === 'floor' ? 0.3 : 0.55, Math.min(1, r)); const rb = r * 255;
          rgh[i * 4] = 255; rgh[i * 4 + 1] = rb; rgh[i * 4 + 2] = 0; rgh[i * 4 + 3] = 255;
        }
      }
      // normal map from height (wrapped Sobel)
      const nm = new Uint8Array(N * N * 4), str = kind === 'floor' ? 1.2 : 2.4;
      const hh = (x, y) => H[((y + N) % N) * N + ((x + N) % N)];
      for (let y = 0; y < N; y++) { await yieldNow(); for (let x = 0; x < N; x++) {
        const dx = (hh(x + 1, y - 1) + 2 * hh(x + 1, y) + hh(x + 1, y + 1)) - (hh(x - 1, y - 1) + 2 * hh(x - 1, y) + hh(x - 1, y + 1));
        const dy = (hh(x - 1, y + 1) + 2 * hh(x, y + 1) + hh(x + 1, y + 1)) - (hh(x - 1, y - 1) + 2 * hh(x, y - 1) + hh(x + 1, y - 1));
        let nx = -dx * str, ny = dy * str, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        const i = (y * N + x) * 4;
        nm[i] = (nx * 0.5 + 0.5) * 255; nm[i + 1] = (ny * 0.5 + 0.5) * 255; nm[i + 2] = (nz * 0.5 + 0.5) * 255; nm[i + 3] = 255;
      } }
      const mk = (data, srgb) => {
        const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
        t.generateMipmaps = true; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
      };
      return { map: mk(alb, true), normalMap: mk(nm, false), roughnessMap: mk(rgh, false) };
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.3, 140);

    /* materials are created with placeholder colour first; textures arrive after first paint so the page never blocks */
    const mats = {
      stone: new THREE.MeshStandardMaterial({ color: 0x777b88, roughness: 0.8, metalness: 0 }),
      ashlar: new THREE.MeshStandardMaterial({ color: 0x70747f, roughness: 0.82, metalness: 0 }),
      floor: new THREE.MeshStandardMaterial({ color: 0x555867, roughness: 0.5, metalness: 0 }),
    };
    async function dress() {
      const set = (m, t, ns) => { m.map = t.map; m.normalMap = t.normalMap; m.roughnessMap = t.roughnessMap; m.normalScale.set(ns, ns); m.color.set(0xffffff); m.needsUpdate = true; };
      set(mats.stone, await makeStone('stone', 1024), 0.6); mats.stone.color.set(0xd9dce8); mats.stone.roughness = 1;
      set(mats.ashlar, await makeStone('ashlar', 1024), 0.7); mats.ashlar.color.set(0xd0d3de);
      set(mats.floor, await makeStone('floor', 512), 0.9); mats.floor.color.set(0xb4b8c8);
    }

    /* ---------- architecture ---------- */
    function boxUV(geo, s, ox, oy) {
      const P = geo.attributes.position, Nn = geo.attributes.normal, uv = new Float32Array(P.count * 2);
      for (let i = 0; i < P.count; i++) {
        const nx = Math.abs(Nn.getX(i)), ny = Math.abs(Nn.getY(i)), nz = Math.abs(Nn.getZ(i));
        let a, b;
        if (nx >= ny && nx >= nz) { a = P.getZ(i); b = P.getY(i); } else if (ny >= nz) { a = P.getX(i); b = P.getZ(i); } else { a = P.getX(i); b = P.getY(i); }
        uv[i * 2] = a * s + ox; uv[i * 2 + 1] = b * s + oy;
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      return geo;
    }
    const world = new THREE.Group(); scene.add(world);
    let seedOff = 0;
    function block(w, h, d, x, y, z, mat, rad) {
      const g = new RoundedBoxGeometry(w, h, d, 3, rad == null ? 0.05 : rad);
      boxUV(g, 0.5, (seedOff = (seedOff + 0.37) % 1), (seedOff * 0.61) % 1);
      const m = new THREE.Mesh(g, mat); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; world.add(m); return m;
    }
    function shaftGeo(R, Hh, flutes, depth) {
      const g = new THREE.CylinderGeometry(R * 0.86, R, Hh, 384, 40, true);
      const P = g.attributes.position, Nn = g.attributes.normal;
      const rad = (th, t) => {
        const base = (R * 0.86 + (R - R * 0.86) * (1 - t)) * (1 + 0.012 * Math.sin(t * Math.PI)); // taper + entasis
        const u = Math.abs(Math.cos(th * flutes * 0.5));
        const fade = sstep(0.0, 0.035, t) * (1 - sstep(0.965, 1, t));
        return base * (1 - depth * sstep(0.0, 0.95, u) * (0.15 + 0.85 * fade));
      };
      const pos = (th, t) => { const r = rad(th, t); return [Math.cos(th) * r, t * Hh, Math.sin(th) * r]; };
      const e = 0.0007;
      for (let i = 0; i < P.count; i++) {
        const y = P.getY(i), th = Math.atan2(P.getZ(i), P.getX(i)), t = (y + Hh / 2) / Hh;
        const p = pos(th, t); P.setXYZ(i, p[0], y, p[2]);
        const a = pos(th + e, t), b = pos(th - e, t), c = pos(th, Math.min(1, t + e)), d = pos(th, Math.max(0, t - e));
        const tu = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], tv = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
        // outward normal = tv x tu (tu runs counter-clockwise seen from above in x,z with z toward the viewer)
        let nx = tv[1] * tu[2] - tv[2] * tu[1], ny = tv[2] * tu[0] - tv[0] * tu[2], nz = tv[0] * tu[1] - tv[1] * tu[0];
        const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        if (nx * p[0] + nz * p[2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
        Nn.setXYZ(i, nx, ny, nz);
      }
      const uvA = g.attributes.uv;
      for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uvA.getX(i) * 2.2, uvA.getY(i) * Hh * 0.5);
      return g;
    }
    const SHAFT = shaftGeo(0.72, 7.4, 16, 0.03);
    const BASE = (() => {
      const pts = [[0, 0], [1.05, 0], [1.1, 0.04], [1.1, 0.12], [1.04, 0.17], [0.9, 0.2], [0.86, 0.26], [0.9, 0.31], [1.0, 0.34], [1.0, 0.4], [0.94, 0.44], [0.78, 0.46], [0, 0.46]];
      const g = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), 96); g.computeVertexNormals();
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.2, uv.getY(i) * 0.9); return g; })();
    const CAP = (() => {
      const pts = [[0, 0], [0.7, 0], [0.74, 0.03], [0.8, 0.07], [0.9, 0.14], [1.02, 0.22], [1.1, 0.3], [1.14, 0.36], [0, 0.36]];
      const g = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), 96); g.computeVertexNormals();
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.2, uv.getY(i) * 0.9); return g; })();
    const COLS = 13, SP = 3.4, ROWZ = [0, -7.6];
    const Y0 = 0.95, BASEH = 0.46, SHAFTH = 7.4, CAPH = 0.36, ABH = 0.2;
    const TOP = Y0 + BASEH + SHAFTH + CAPH + ABH; // top of abaci
    function column(x, z) {
      const b = new THREE.Mesh(BASE, mats.stone); b.position.set(x, Y0, z); b.castShadow = b.receiveShadow = true; b.rotation.y = x; world.add(b);
      const s = new THREE.Mesh(SHAFT, mats.stone); s.position.set(x, Y0 + BASEH + SHAFTH / 2, z); s.castShadow = s.receiveShadow = true; s.rotation.y = x * 0.7 + z; world.add(s);
      const c = new THREE.Mesh(CAP, mats.stone); c.position.set(x, Y0 + BASEH + SHAFTH, z); c.castShadow = c.receiveShadow = true; world.add(c);
      block(2.55, ABH, 2.55, x, Y0 + BASEH + SHAFTH + CAPH, z, mats.stone, 0.04);
    }
    const XS = []; for (let i = 0; i < COLS; i++) XS.push((i - (COLS - 1) / 2) * SP);
    const HALF = (COLS - 1) / 2 * SP + 2.6;
    // stepped platform
    block(HALF * 2 + 6, 0.32, 17, 0, 0.0, -3.4, mats.ashlar, 0.05);
    block(HALF * 2 + 3.6, 0.32, 15.2, 0, 0.32, -3.4, mats.ashlar, 0.05);
    block(HALF * 2 + 1.2, 0.31, 13.4, 0, 0.64, -3.4, mats.ashlar, 0.05);
    ROWZ.forEach((z) => XS.forEach((x) => column(x, z)));
    // entablature along both rows, cross beams, frieze with triglyphs, cornice
    ROWZ.forEach((z, r) => {
      block(HALF * 2 + 0.4, 1.0, 2.6, 0, TOP, z, mats.ashlar, 0.05);
      block(HALF * 2 + 0.4, 1.05, 2.1, 0, TOP + 1.0, z, mats.stone, 0.03);
      if (r === 0) {
        XS.forEach((x) => { for (let k = -1; k <= 1; k++) block(0.2, 0.9, 0.2, x + k * 0.36, TOP + 1.07, z + 1.07, mats.stone, 0.03); });
        XS.slice(0, -1).forEach((x) => { const xm = x + SP / 2; for (let k = -1; k <= 1; k++) block(0.2, 0.9, 0.2, xm + k * 0.36, TOP + 1.07, z + 1.07, mats.stone, 0.03); });
        block(HALF * 2 + 1.2, 0.28, 3.4, 0, TOP + 2.05, z, mats.ashlar, 0.04);
        block(HALF * 2 + 1.6, 0.34, 3.9, 0, TOP + 2.33, z + 0.25, mats.stone, 0.06);
      }
    });
    XS.forEach((x) => block(1.5, 1.0, ROWZ[0] - ROWZ[1] - 0.8, x, TOP, (ROWZ[0] + ROWZ[1]) / 2, mats.ashlar, 0.05));
    // a distant third row of stout piers, so the light behind has depth to pass through
    for (let i = 0; i < 9; i++) block(1.9, 9.5, 1.9, (i - 4) * 5.2, 0.0, -24, mats.ashlar, 0.06);
    block(52, 1.2, 2.6, 0, 9.5, -24, mats.ashlar, 0.05);
    // floor
    { const g = new THREE.PlaneGeometry(260, 260); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 260 / 6, uv.getY(i) * 260 / 6);
      const f = new THREE.Mesh(g, mats.floor); f.position.y = -0.02; f.receiveShadow = true; world.add(f); }

    /* ---------- lights ---------- */
    const hemi = new THREE.HemisphereLight(0x6f86ff, 0x05060c, 0.16); scene.add(hemi);
    const spot = new THREE.SpotLight(0xffffff, 40, 0, 0.95, 1, 0); // decay 0
    spot.castShadow = true; spot.shadow.mapSize.set(4096, 4096); spot.shadow.camera.near = 2; spot.shadow.camera.far = 90; spot.shadow.bias = -0.0012; spot.shadow.normalBias = 0.14; spot.shadow.radius = 5;
    scene.add(spot, spot.target);
    const rake = new THREE.DirectionalLight(0xffffff, 1); scene.add(rake, rake.target);
    rake.castShadow = false;

    // dim generated environment so the stone and floor pick up soft sky-colour specular
    const pm = new THREE.PMREMGenerator(renderer);
    { const es = new THREE.Scene(); es.background = new THREE.Color(0x03040a);
      const mkp = (w, h, c, p, r) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); es.add(m); };
      mkp(30, 6, 0x88a0ff, [0, 14, -10]); mkp(6, 20, 0x4a62ff, [-16, 4, 2]); mkp(12, 4, 0xb8c8ff, [12, 3, -16]);
      scene.environment = pm.fromScene(es, 0.04).texture; scene.environmentIntensity = 0.5; }

    /* ---------- post: one pass with volumetric shafts, haze, halo, flood, tonemap, grain ---------- */
    let W = innerWidth, H = innerHeight, scale = 1;
    const depthTex = new THREE.DepthTexture(2, 2); depthTex.type = THREE.UnsignedIntType;
    const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4, depthTexture: depthTex, depthBuffer: true });
    const post = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: {
        tC: { value: rt.texture }, tD: { value: depthTex }, uRes: { value: new THREE.Vector2(2, 2) }, uT: { value: 0 },
        uL: { value: new THREE.Vector2(1.2, 0.3) }, uLV: { value: 1 }, uI: { value: 0.7 }, uTint: { value: new THREE.Vector3(0.4, 0.6, 1) },
        uFlood: { value: 0 }, uFog: { value: 0.03 }, uRing: { value: new THREE.Vector2(0.2, 0) }, uExp: { value: 1 }, uNF: { value: new THREE.Vector2(0.3, 140) },
      },
      vertexShader: 'varying vec2 v; void main(){ v=uv; gl_Position=vec4(position.xy,0.,1.); }',
      fragmentShader: `
precision highp float;
varying vec2 v; uniform sampler2D tC, tD; uniform vec2 uRes, uL, uRing, uNF; uniform float uT, uLV, uI, uFlood, uFog, uExp; uniform vec3 uTint;
float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float n2(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float lin(float d){ return 2.*uNF.x*uNF.y/(uNF.y+uNF.x-(2.*d-1.)*(uNF.y-uNF.x)); }
vec2 asp(vec2 p){ return vec2(p.x*uRes.x/uRes.y, p.y); }
float glow(vec2 uv){ float d=length(asp(uv-uL)); return exp(-d*3.4)*.55+exp(-d*11.)*.5+.06/(1.+d*d*30.); }
void main(){
  vec2 uv=v;
  vec2 ctr=uv-.5;
  float ca=.0004*smoothstep(.25,.55,length(ctr));
  vec4 c0=texture2D(tC,uv);
  vec3 col=vec3(texture2D(tC,uv-ctr*ca).r,c0.g,texture2D(tC,uv+ctr*ca).b);
  float cov=c0.a;
  { vec2 px=1./uRes; vec3 nb=(texture2D(tC,uv+vec2(px.x,0.)).rgb+texture2D(tC,uv-vec2(px.x,0.)).rgb+texture2D(tC,uv+vec2(0.,px.y)).rgb+texture2D(tC,uv-vec2(0.,px.y)).rgb)*.25; col=min(col,nb*1.25+.01); }
  float dp=texture2D(tD,uv).r;
  float dist=dp>.99995?uNF.y:lin(dp);
  float g=glow(uv)*uLV;
  vec3 blue=vec3(.008,.063,.716);
  /* sky: dim gradient, glow around the off-axis source; flood turns it BitGo blue */
  {
    vec3 sk=vec3(.004,.007,.02)+uTint*g*uI*.55;
    vec3 bf=blue*(.34+.5*smoothstep(1.,.0,uv.y*.9))+uTint*g*uI*.18;
    col+=mix(sk,bf,uFlood)*(1.-cov);
  }
  /* volumetric shafts: gather sky glow along the ray toward the source, blocked by stone */
  float jit=h21(gl_FragCoord.xy+fract(uT)*37.);
  vec3 sh=vec3(0.); float acc=0.;
  for(int i=0;i<36;i++){
    float t=(float(i)+jit)/36.;
    vec2 s=mix(uv,uL,t*.97);
    float m=1.-texture2D(tC,clamp(s,0.,1.)).a;
    acc+=m*glow(s)*(1.-t*.55);
  }
  acc/=36.;
  float rn=.75+.5*n2(vec2(atan(uv.y-uL.y,uv.x-uL.x)*14.,uT*.03));
  vec3 shaft=uTint*acc*rn*uI*1.15*uLV;
  /* haze by distance, tinted by the light */
  float fg=1.-exp(-dist*uFog);
  vec3 hz=mix(vec3(.006,.01,.03),blue*.5,uFlood)+uTint*g*uI*.22;
  col=mix(col,hz*cov,fg);
  col+=shaft*mix(1.,.8,uFlood);
  /* prismatic halo, three radii */
  if(uRing.y>.001){
    vec2 d=asp(uv-uL); float r=length(d); float an=atan(d.y,d.x);
    float w=.02+.05*uRing.x; float wob=1.+.02*sin(an*3.+uT*.15)+.03*n2(vec2(an*4.,2.));
    vec3 rg=vec3(exp(-pow((r-uRing.x*wob*.95)/w,2.)),exp(-pow((r-uRing.x*wob)/w,2.)),exp(-pow((r-uRing.x*wob*1.05)/w,2.)));
    vec3 ring=rg.x*vec3(1.,.3,.55)+rg.y*vec3(.5,.72,1.)+rg.z*vec3(.4,.3,1.);
    col+=ring*uRing.y*smoothstep(.3,.62,length(uL-.5))*(.5+.8*n2(vec2(an*5.,uT*.06)))*.28*uLV;
  }
  col*=uExp;
  vec3 t=1.-exp(-col*1.25);
  t=pow(t,vec3(1./2.2));
  t=min(t,vec3(.92));
  /* grain: heavier in the light, stepped */
  float lum=dot(t,vec3(.33));
  float fr=floor(uT*18.);
  float g1=h21(gl_FragCoord.xy+fr*17.3)-.5, g2=h21(floor(gl_FragCoord.xy*.5)+fr*5.1)-.5;
  t+=(g1*.6+g2*.5)*(.02+.07*smoothstep(.02,.6,lum));
  t*=1.-.42*dot(ctr,ctr)*1.6*(1.-uFlood*.5);
  t+=(h21(gl_FragCoord.xy*1.7)-.5)/255.;
  gl_FragColor=vec4(clamp(t,0.,1.),1.);
}`,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); quad.frustumCulled = false;
    const pscene = new THREE.Scene(); pscene.add(quad); const pcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    function resize() {
      W = innerWidth; H = innerHeight;
      const dpr = Math.min(Math.min(devicePixelRatio || 1, 2), 1500 / Math.max(W, H)) * scale;
      const w = Math.max(2, Math.round(W * dpr)), h = Math.max(2, Math.round(H * dpr));
      renderer.setPixelRatio(1); renderer.setSize(w, h, false);
      canvas.style.width = '100%'; canvas.style.height = '100%';
      rt.setSize(w, h); post.uniforms.uRes.value.set(w, h);
      camera.aspect = W / H; camera.updateProjectionMatrix();
    }

    /* ---------- keyframes: one per section ---------- */
    const BLUE = [0.3, 0.52, 1.0], CYAN = [0.3, 0.74, 1.0], VIOLET = [0.55, 0.42, 1.0], PALE = [0.62, 0.7, 1.0], DEEP = [0.16, 0.34, 0.98];
    // cam, look, fov, lightpos, lightI(spot), rakeI, rake pos, tint, flood, fog, ringR, ringA, post intensity, exposure
    function K(o) { return Object.assign({ cam: [0, 3, 14], look: [0, 5, 0], fov: 42, lp: [0, 6, -30], si: 40, ri: 0.8, rp: [20, 4, 10], tint: BLUE, flood: 0, fog: 0.016, ring: 0.2, ringA: 0, pi: 0.7, ex: 1 }, o); }
    const KEYS = [
      /* hero: low, along the colonnade, source low and far right behind the stone */
      K({ cam: [-12, 1.7, 14], look: [-1, 5.4, -6], fov: 46, lp: [58, 4, -18], si: 36, ri: 0.7, rp: [24, 2, -8], tint: BLUE, fog: 0.015, pi: 0.78 }),
      /* trust: rises and drifts down the row */
      K({ cam: [-26, 8.5, 26], look: [0, 5, -4], fov: 40, lp: [62, 6, -20], si: 32, ri: 0.6, rp: [26, 4, 2], tint: CYAN, fog: 0.016, pi: 0.7 }),
      /* badges: between the columns, halo off to the side */
      K({ cam: [-1.7, 2.1, 9], look: [3, 5.6, -8], fov: 48, lp: [-24, 12, -34], si: 30, ri: 0.8, rp: [-22, 8, 2], tint: VIOLET, ring: 0.17, ringA: 0.8, fog: 0.017, pi: 0.74 }),
      /* core: close to the shafts, BitGo blue flood */
      K({ cam: [-4.8, 2.2, 7.4], look: [-0.2, 4.9, 0], fov: 50, lp: [-26, 8, -30], si: 32, ri: 0.8, rp: [-18, 3, 10], tint: [0.7, 0.8, 1.0], flood: 1, fog: 0.012, pi: 0.7 }),
      /* established: side-on along the steps and the plinth */
      K({ cam: [18, 1.6, 7], look: [-2, 3.6, -1], fov: 46, lp: [-20, 3, -40], si: 32, ri: 0.6, rp: [-26, 3, 6], tint: PALE, ring: 0.14, ringA: 0.5, fog: 0.017, pi: 0.7 }),
      /* build: three columns frontal, light behind them */
      K({ cam: [0.4, 2.0, 12], look: [0.4, 5.5, 0], fov: 48, lp: [30, 4, -30], si: 34, ri: 0.6, rp: [20, 3, 14], tint: DEEP, fog: 0.015, pi: 0.7 }),
      /* support: light low on the horizon, shadows raking the floor */
      K({ cam: [6, 0.45, 6], look: [-10, 1.2, -10], fov: 52, lp: [-62, 1.8, -20], si: 38, ri: 0.8, rp: [-28, 1.4, -6], tint: CYAN, fog: 0.017, pi: 0.78 }),
      /* own: looking up the entablature, light above the frame */
      K({ cam: [-3, 2.2, 5.6], look: [2, 9.2, -3.5], fov: 56, lp: [10, 80, -18], si: 32, ri: 0.7, rp: [10, 20, 8], tint: VIOLET, ring: 0.2, ringA: 0.7, fog: 0.014, pi: 0.7 }),
      /* spotlight: cool light dropping between the beams */
      K({ cam: [3.4, 4.2, 4.6], look: [-0.6, 8.2, -4.5], fov: 54, lp: [-10, 36, -12], si: 30, ri: 0.7, rp: [12, 20, 6], tint: [0.6, 0.75, 1.0], fog: 0.012, pi: 0.72 }),
      /* latest: dim, long view down the aisle */
      K({ cam: [0.8, 1.5, 6.2], look: [0.8, 4.4, -22], fov: 50, lp: [-42, 5, -30], si: 28, ri: 0.25, rp: [0, 8, 16], tint: BLUE, fog: 0.014, pi: 0.64 }),
      /* cta: blue sun rising behind the near column pair */
      K({ cam: [-0.4, 1.7, 9], look: [-0.4, 6, -2], fov: 50, lp: [11, 2.4, -28], si: 36, ri: 1.0, rp: [14, 2, 10], tint: [0.62, 0.78, 1.0], flood: 1, ring: 0.16, ringA: 0.6, fog: 0.012, pi: 0.78 }),
      K({ cam: [0, 1.8, 14], look: [0, 4, -4], fov: 46, lp: [34, 3, -34], si: 22, ri: 0.4, rp: [0, 8, 16], tint: DEEP, fog: 0.017, pi: 0.5, ex: 0.7 }),
    ];
    const IDS = ['hero', 'trust', 'badges', 'core', 'established', 'build', 'support', 'own', 'spotlight', 'latest', 'cta', 'footer'];
    let tops = [];
    function measure() {
      tops = IDS.map((id) => { const el = document.getElementById(id); const r = el.getBoundingClientRect(); const top = r.top + scrollY, h = r.height; return { top, h, c: top + (id === 'hero' ? Math.min(h, H) / 2 : h / 2) }; });
    }
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const flat = (k) => [...k.cam, ...k.look, k.fov, ...k.lp, k.si, k.ri, ...k.rp, ...k.tint, k.flood, k.fog, k.ring, k.ringA, k.pi, k.ex];
    const FK = KEYS.map(flat); const NK = FK[0].length;
    const WORDS = [{ dy: 0, tint: BLUE, dx: 0 }, { dy: -1.4, tint: CYAN, dx: 4 }, { dy: 3.2, tint: VIOLET, dx: -3 }];
    const cur = new Float32Array(NK), tgt = new Float32Array(NK); let inited = false;
    const wc = { dy: 0, dx: 0, tint: BLUE.slice() };
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener('pointermove', (e) => { mouse.tx = e.clientX / W - 0.5; mouse.ty = e.clientY / H - 0.5; }, { passive: true });

    function compute(dt) {
      const s = scrollY + H / 2;
      let i = 0; for (let k = 0; k < tops.length - 1; k++) if (s >= tops[k].c) i = k;
      const a = tops[i].c, b = tops[Math.min(i + 1, tops.length - 1)].c;
      let t = b > a ? Math.min(1, Math.max(0, (s - a) / (b - a))) : 0;
      t = smooth(0.15, 0.85, t); if (s < tops[0].c) t = 0;
      const keys = FK.map((f) => f.slice());
      // hero word moves the light and shifts its tint
      const W_ = WORDS[window.__heroWord | 0], kk = 1 - Math.exp(-dt * 1.2);
      wc.dy += (W_.dy - wc.dy) * kk; wc.dx += (W_.dx - wc.dx) * kk; for (let c = 0; c < 3; c++) wc.tint[c] += (W_.tint[c] - wc.tint[c]) * kk;
      keys[0][8] += wc.dy; keys[0][7] += wc.dx; keys[0][15] = wc.tint[0]; keys[0][16] = wc.tint[1]; keys[0][17] = wc.tint[2];
      // core chapter: the camera slides along the shafts as the five services change
      const cp = window.__coreProgress || 0; keys[3][0] += (cp - 0.5) * 7; keys[3][3] += (cp - 0.5) * 6; keys[3][7] += (cp - 0.5) * 6;
      const A = keys[i], B = keys[Math.min(i + 1, keys.length - 1)];
      for (let n = 0; n < NK; n++) tgt[n] = A[n] + (B[n] - A[n]) * t;
    }

    const _v = new THREE.Vector3();
    let T0 = performance.now(), last = T0, ms = 16, frames = 0, qTimer = 0, running = true;
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      const dtMs = Math.min(now - last, 100); last = now; const dt = dtMs / 1000;
      compute(dt);
      const k = !inited || reduce ? 1 : 1 - Math.exp(-dt * 2.4);
      for (let n = 0; n < NK; n++) cur[n] += (tgt[n] - cur[n]) * k;
      inited = true;
      mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 2)); mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 2));
      camera.position.set(cur[0] + mouse.x * 0.5, cur[1] - mouse.y * 0.25, cur[2]);
      camera.lookAt(cur[3], cur[4], cur[5]); camera.fov = cur[6]; camera.updateProjectionMatrix();
      spot.position.set(cur[7], cur[8], cur[9]); spot.target.position.set(0, 3, -3); spot.target.updateMatrixWorld();
      { const dd = spot.position.distanceTo(spot.target.position); spot.angle = Math.min(1.1, Math.atan(34 / dd)); spot.shadow.camera.far = dd + 60; }
      spot.intensity = cur[10] * 0.72; spot.color.setRGB(0.55 + cur[16] * 0.45, 0.65 + cur[17] * 0.35, 1);
      rake.position.set(cur[12], cur[13], cur[14]); rake.target.position.set(0, 4, -2); rake.target.updateMatrixWorld(); rake.intensity = cur[11];
      rake.color.setRGB(0.5 + cur[15] * 0.5, 0.6 + cur[16] * 0.4, 1);
      hemi.color.setRGB(cur[15] * 0.5, cur[16] * 0.6, cur[17]);
      // source position on screen, and whether it is in front of the camera
      _v.copy(spot.position).project(camera);
      const behind = _v.z > 1 ? 0 : 1;
      const lx = _v.x * 0.5 + 0.5, ly = _v.y * 0.5 + 0.5;
      const u = post.uniforms;
      u.uL.value.set(lx, ly); u.uLV.value = behind;
      u.uI.value = cur[22]; u.uTint.value.set(cur[15], cur[16], cur[17]);
      u.uFlood.value = cur[18]; u.uFog.value = cur[19]; u.uRing.value.set(cur[20], cur[21]); u.uExp.value = cur[23];
      u.uNF.value.set(camera.near, camera.far);
      u.uT.value = reduce ? 3 : (now - T0) / 1000;
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(pscene, pcam);
      ms = ms * 0.9 + dtMs * 0.1; frames++;
      if (frames > 30 && now - qTimer > 2000) { qTimer = now; if (ms > 26 && scale > 0.5) { scale = Math.max(0.5, scale * 0.82); resize(); } }
    }
    addEventListener('resize', () => { resize(); measure(); inited = false; });
    resize(); measure();
    addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    new ResizeObserver(measure).observe(document.body);
    window.__noexit = { renderer, cur, camera, spot, rake, scene, mats, KEYS, post };
    // first frame with plain material, then generate textures and fade the look in
    requestAnimationFrame(frame);
    setTimeout(() => { dress().then(() => document.documentElement.classList.add('stone')); }, 60);
  }
})();
