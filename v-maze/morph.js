import * as THREE from 'three';

/* One dense particle body that morphs between five solid forms, one per service. */
const rnd = Math.random;
function shapes(N) {
  const out = [];
  // 0 Prime: order-book depth surface (valley that rises to both sides, bid and ask)
  { const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const x = rnd() * 2 - 1, z = rnd() * 2 - 1;
      const y = 1.05 * (Math.pow(Math.abs(x), 1.5) - 0.42) * (0.75 + 0.35 * (z + 1) * 0.5) + 0.05 * Math.sin(x * 9 + z * 5) ;
      a[i * 3] = x * 1.5; a[i * 3 + 1] = y; a[i * 3 + 2] = z * 1.2; }
    out.push(a); }
  // 1 Ecosystem: many bodies joined into one network
  { const a = new Float32Array(N * 3), K = 18, cs = [];
    for (let k = 0; k < K; k++) { const u = rnd() * 2 - 1, th = rnd() * 6.283, s2 = Math.sqrt(1 - u * u), r = k === 0 ? 0 : 0.55 + rnd() * 0.55;
      cs.push([s2 * Math.cos(th) * r * 1.3, u * r * 0.95, s2 * Math.sin(th) * r * 1.1, k === 0 ? 0.3 : 0.1 + rnd() * 0.1]); }
    const ed = [];
    cs.forEach((c, i) => { const d = cs.map((o, j) => [j, Math.hypot(c[0] - o[0], c[1] - o[1], c[2] - o[2])]).filter((x) => x[0] !== i).sort((p, q) => p[1] - q[1]);
      ed.push([i, d[0][0]], [i, d[1][0]]); if (i) ed.push([0, i]); });
    for (let i = 0; i < N; i++) {
      if (rnd() < 0.62) { const c = cs[(rnd() * K) | 0], u = rnd() * 2 - 1, th = rnd() * 6.283, s2 = Math.sqrt(1 - u * u), r = c[3] * Math.cbrt(rnd());
        a[i * 3] = c[0] + s2 * Math.cos(th) * r; a[i * 3 + 1] = c[1] + u * r; a[i * 3 + 2] = c[2] + s2 * Math.sin(th) * r; }
      else { const e = ed[(rnd() * ed.length) | 0], A = cs[e[0]], Bq = cs[e[1]], t = rnd(), j = 0.02;
        a[i * 3] = A[0] + (Bq[0] - A[0]) * t + (rnd() - 0.5) * j; a[i * 3 + 1] = A[1] + (Bq[1] - A[1]) * t + (rnd() - 0.5) * j; a[i * 3 + 2] = A[2] + (Bq[2] - A[2]) * t + (rnd() - 0.5) * j; }
    }
    out.push(a); }
  // 2 Stablecoins: torus (mint and burn loop)
  { const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const t = rnd() * 6.283, p = rnd() * 6.283, R = 0.88, r = 0.34 + 0.03 * Math.sin(t * 8);
      a[i * 3] = (R + r * Math.cos(p)) * Math.cos(t); a[i * 3 + 1] = r * Math.sin(p) * 1.15; a[i * 3 + 2] = (R + r * Math.cos(p)) * Math.sin(t); }
    out.push(a); }
  // 3 Wallets: nested vault strata (three sealed shells, one inside the next)
  { const a = new Float32Array(N * 3), R = [0.42, 0.74, 1.08];
    for (let i = 0; i < N; i++) { const q = rnd(), L = q < 0.14 ? 0 : q < 0.4 ? 1 : 2, k = R[L];
      const f = (rnd() * 6) | 0, u = rnd() * 2 - 1, v = rnd() * 2 - 1, s = f % 2 ? 1 : -1;
      let p = f < 2 ? [s, u, v] : f < 4 ? [u, s, v] : [u, v, s];
      const l = Math.pow(Math.pow(Math.abs(p[0]), 6) + Math.pow(Math.abs(p[1]), 6) + Math.pow(Math.abs(p[2]), 6), 1 / 6);
      a[i * 3] = (p[0] / l) * k * 1.25; a[i * 3 + 1] = (p[1] / l) * k * 0.95; a[i * 3 + 2] = (p[2] / l) * k * 1.25; }
    out.push(a); }
  // 4 Crypto-as-a-Service: stacked slabs
  { const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const k = (rnd() * 4) | 0;
      a[i * 3] = (rnd() * 2 - 1) * 1.25; a[i * 3 + 1] = -0.78 + k * 0.52 + (rnd() - 0.5) * 0.14; a[i * 3 + 2] = (rnd() * 2 - 1) * 0.85 + (k - 1.5) * 0.06; }
    out.push(a); }
  return out;
}

const VERT = /* glsl */`
uniform float uMorph, uTime, uPR, uF, uSize;
uniform vec2 uRot;
attribute vec3 aA, aB;
attribute float aR;
varying float vY, vR, vA;
void main(){
  float e = clamp(uMorph * 1.6 - aR * 0.6, 0.0, 1.0);
  e = e * e * (3.0 - 2.0 * e);
  vec3 p = mix(aA, aB, e);
  float sw = sin(e * 3.14159) * 0.55;
  p += vec3(sin(aR * 40.0 + uTime), cos(aR * 33.0 + uTime * 1.1), sin(aR * 27.0 - uTime)) * sw * 0.5;
  float cy = cos(uRot.y + uTime * 0.18), sy = sin(uRot.y + uTime * 0.18);
  p = vec3(p.x * cy - p.z * sy, p.y, p.x * sy + p.z * cy);
  float cx = cos(0.42 + uRot.x), sx = sin(0.42 + uRot.x);
  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
  vec4 mv = modelViewMatrix * vec4(p + vec3(0.0, 0.0, 0.0), 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, uSize * uF * uPR / -mv.z);
  vY = p.y; vR = aR; vA = 0.5 + 0.5 * (p.z + 1.3) / 2.6;
}`;
const FRAG = /* glsl */`
precision highp float;
varying float vY, vR, vA;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float d = smoothstep(0.5, 0.15, r);
  vec3 lo = vec3(0.10, 0.28, 0.86), hi = vec3(0.82, 0.88, 1.0);
  vec3 c = mix(lo, hi, clamp(vY * 0.5 + 0.5 + (vR - 0.5) * 0.25, 0.0, 1.0) * (0.35 + vA * 0.55));
  gl_FragColor = vec4(c, d * (0.12 + 0.2 * vA));
}`;

export class SvcMorph {
  constructor(canvas) {
    this.canvas = canvas; this.ok = false; this.visible = false;
    this.cur = 0; this.nxt = 0; this.m = 1; this.mouse = [0, 0]; this.sm = [0, 0];
    try { this.init(); this.ok = true; } catch (e) { console.warn('morph init failed', e); }
  }
  init() {
    const N = innerWidth < 760 ? 26000 : 70000;
    const r = (this.r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: true }));
    r.setClearColor(0, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    this.camera.position.set(0, 0, 7.4);
    this.sh = shapes(N);
    this.attrs = this.sh.map((a) => new THREE.BufferAttribute(a, 3));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', this.attrs[0]);
    g.setAttribute('aA', this.attrs[0]); g.setAttribute('aB', this.attrs[0]);
    const ar = new Float32Array(N); for (let i = 0; i < N; i++) ar[i] = rnd();
    g.setAttribute('aR', new THREE.BufferAttribute(ar, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uMorph: { value: 1 }, uTime: { value: 0 }, uPR: { value: 1 }, uF: { value: 800 }, uSize: { value: 0.016 }, uRot: { value: new THREE.Vector2() } }
    });
    this.g = g;
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.scene.add(this.pts);
    this.resize();
    new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; }, { rootMargin: '100px' }).observe(this.canvas);
    const host = this.canvas.parentElement;
    host.addEventListener('pointermove', (ev) => { const b = host.getBoundingClientRect(); this.mouse = [((ev.clientX - b.left) / b.width - 0.5), ((ev.clientY - b.top) / b.height - 0.5)]; });
    this.t0 = performance.now();
  }
  resize() {
    if (!this.r) return;
    const b = this.canvas.parentElement.getBoundingClientRect();
    const pr = Math.min(devicePixelRatio || 1, 2), w = Math.max(1, b.width), h = Math.max(1, b.height);
    this.r.setPixelRatio(pr); this.r.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.mat.uniforms.uPR.value = pr;
    this.mat.uniforms.uF.value = h / (2 * Math.tan((30 * Math.PI) / 360));
    this.mat.uniforms.uSize.value = 0.026;
    this.draw(0);
  }
  go(i) {
    if (!this.ok || i === this.nxt) return;
    // restart morph from wherever the current blend sits: freeze the visible form as A
    this.cur = this.m >= 0.5 ? this.nxt : this.cur;
    this.nxt = i; this.m = 0;
    this.g.setAttribute('aA', this.attrs[this.cur]); this.g.setAttribute('aB', this.attrs[this.nxt]);
  }
  draw(dt) {
    if (!this.ok) return;
    const u = this.mat.uniforms;
    this.m = Math.min(1, this.m + dt / 1.6);
    u.uMorph.value = this.m;
    u.uTime.value += dt;
    this.sm[0] += (this.mouse[0] - this.sm[0]) * 0.06; this.sm[1] += (this.mouse[1] - this.sm[1]) * 0.06;
    u.uRot.value.set(this.sm[1] * 0.5, this.sm[0] * 1.2);
    this.r.render(this.scene, this.camera);
  }
}
