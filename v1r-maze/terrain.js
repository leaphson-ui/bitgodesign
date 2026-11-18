// ParticleTerrain: a dense point surface (tens of thousands of sprites) baked once on the CPU.
// Heights are computed in JS so DOM tags can be pinned to exact surface points.
import * as THREE from 'three';

function hash(i, j) {
  let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
export function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f + i * 7.3, y * f - i * 3.1); f *= 2.03; a *= 0.5; }
  return s / (1 - Math.pow(0.5, oct)) * 0.5 + 0; // ~0..1
}

const VERT = `
uniform float uTime, uF, uSize, uDpr, uRise, uFogNear, uFogFar, uAlpha;
uniform vec3 uMask, uLow, uMid, uHigh, uPulseCol;
uniform float uPulse, uLight;
attribute float aH, aShade, aR, aSp;
attribute vec2 aUV;
varying vec3 vCol;
varying float vA;
void main(){
  vec3 pos = position;
  pos -= pos * uMask * (1.0 - uRise);
  float wob = sin(pos.x * 0.9 + uTime * 0.5 + aR * 0.6) * 0.5 + sin(pos.z * 0.7 - uTime * 0.35) * 0.5;
  pos += uMask * wob * 0.035;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float depth = -mv.z;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSp * uSize * uF * uDpr / max(depth, 0.2), 1.6, 30.0);
  float h = aH;
  vec3 c = mix(uLow, uMid, smoothstep(0.0, 0.55, h));
  c = mix(c, uHigh, smoothstep(0.5, 1.0, h));
  float lit = clamp(aShade, 0.0, 1.0);
  c *= 0.28 + lit * uLight;
  if (uPulse > 0.0) {
    float ph = fract(uTime * 0.045);
    float d = abs(aUV.y - (1.0 - ph));
    c += uPulseCol * smoothstep(0.06, 0.0, d) * (0.25 + h * 0.6) * uPulse;
  }
  c *= 0.8 + aR * 0.4;
  c += step(0.992, aR) * 0.25 * (0.6 + 0.4 * sin(uTime * 2.0 + aR * 90.0)) * lit;
  vCol = c;
  float edge = smoothstep(0.0, 0.1, aUV.x) * smoothstep(1.0, 0.9, aUV.x) * smoothstep(0.0, 0.14, aUV.y) * smoothstep(1.0, 0.86, aUV.y);
  float fog = 1.0 - smoothstep(uFogNear, uFogFar, depth);
  float near = smoothstep(0.35, 1.4, depth);
  vA = edge * fog * near * uAlpha;
}`;
const FRAG = `
varying vec3 vCol;
varying float vA;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.36, r);
  if (a * vA < 0.01) discard;
  gl_FragColor = vec4(vCol, a * vA);
}`;

export class ParticleTerrain {
  constructor(canvas, o) {
    this.canvas = canvas;
    this.o = Object.assign({
      nu: 520, nv: 300, u0: -9, u1: 9, v0: 3, v1: -17, mode: 'terrain', fov: 48,
      cam: [0, 1.6, 3.2], target: [0, 0.2, -5], low: '#06133f', mid: '#1647DB', high: '#dbe6ff',
      light: [0.5, 0.8, 0.35], lightGain: 1.1, fog: [14, 26], size: 1.55, alpha: 1, pulse: 0, pulseCol: '#7fa6ff',
      hMin: 0, hMax: 3, fn: () => 0,
    }, o);
    this.failed = false; this.visible = false; this.raf = 0; this.rise = 1; this.time = 0;
    this.cam = { pos: new THREE.Vector3(...this.o.cam), target: new THREE.Vector3(...this.o.target) };
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { this.failed = true; return; }
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.o.fov, 1, 0.1, 80);
    this.build();
    this.resize();
    this.ro = new ResizeObserver(() => { this.resize(); this.draw(); });
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; this.visible ? this.loop() : cancelAnimationFrame(this.raf); }, { rootMargin: '100px' });
    this.io.observe(canvas);
  }
  toWorld(u, v, h) { return this.o.mode === 'wall' ? [u, v, h] : [u, h, v]; }
  build() {
    const o = this.o, n = o.nu * o.nv;
    const pos = new Float32Array(n * 3), aH = new Float32Array(n), aS = new Float32Array(n), aR = new Float32Array(n), aUV = new Float32Array(n * 2), aSp = new Float32Array(n);
    const L = new THREE.Vector3(...o.light).normalize();
    const du = (o.u1 - o.u0) / o.nu, dv = (o.v1 - o.v0) / o.nv, e = 0.06;
    let k = 0;
    for (let j = o.nv - 1; j >= 0; j--) { // far to near for painter's order
      for (let i = 0; i < o.nu; i++) {
        const fu = (i + hash(i, j * 3 + 1)) / o.nu, fv = (j + hash(i * 5 + 2, j)) / o.nv;
        const pw = o.vPow || 1, fvp = Math.pow(fv, pw);
        const u = o.u0 + fu * (o.u1 - o.u0), v = o.v0 + fvp * (o.v1 - o.v0);
        aSp[k] = Math.max(du, Math.abs(dv) * pw * Math.pow(Math.max(fv, 0.02), pw - 1));
        const h = o.fn(u, v);
        const hu = (o.fn(u + e, v) - o.fn(u - e, v)) / (2 * e), hv = (o.fn(u, v + e) - o.fn(u, v - e)) / (2 * e);
        const nrm = o.mode === 'wall' ? new THREE.Vector3(-hu, -hv, 1) : new THREE.Vector3(-hu, 1, -hv);
        nrm.normalize();
        const w = this.toWorld(u, v, h);
        pos[k * 3] = w[0]; pos[k * 3 + 1] = w[1]; pos[k * 3 + 2] = w[2];
        aH[k] = Math.min(1, Math.max(0, (h - o.hMin) / (o.hMax - o.hMin)));
        aS[k] = nrm.dot(L) * 0.5 + 0.5;
        aR[k] = hash(i + 11, j + 29);
        aUV[k * 2] = fu; aUV[k * 2 + 1] = fv;
        k++;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aH', new THREE.BufferAttribute(aH, 1));
    g.setAttribute('aShade', new THREE.BufferAttribute(aS, 1));
    g.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
    g.setAttribute('aSp', new THREE.BufferAttribute(aSp, 1));
    g.setAttribute('aUV', new THREE.BufferAttribute(aUV, 2));
    const spacing = Math.max(du, Math.abs(dv));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uTime: { value: 0 }, uF: { value: 800 }, uSize: { value: o.size }, uDpr: { value: this.dpr },
        uRise: { value: 1 }, uFogNear: { value: o.fog[0] }, uFogFar: { value: o.fog[1] }, uAlpha: { value: o.alpha },
        uMask: { value: new THREE.Vector3(...(o.mode === 'wall' ? [0, 0, 1] : [0, 1, 0])) },
        uLow: { value: new THREE.Color(o.low) }, uMid: { value: new THREE.Color(o.mid) }, uHigh: { value: new THREE.Color(o.high) },
        uPulse: { value: o.pulse }, uPulseCol: { value: new THREE.Color(o.pulseCol) }, uLight: { value: o.lightGain },
      },
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }
  resize() {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.mat.uniforms.uF.value = h / (2 * Math.tan(this.camera.fov * Math.PI / 360));
  }
  setCam() {
    this.camera.position.copy(this.cam.pos);
    this.camera.lookAt(this.cam.target);
    this.camera.updateMatrixWorld();
  }
  // returns {x,y,ok} in CSS px relative to canvas
  project(u, v) {
    const w = this.toWorld(u, v, this.o.fn(u, v));
    const p = new THREE.Vector3(w[0], w[1], w[2]);
    p.y *= (this.o.mode === 'wall' ? 1 : this.rise);
    const q = p.clone().project(this.camera);
    return { x: (q.x * 0.5 + 0.5) * this.w, y: (-q.y * 0.5 + 0.5) * this.h, ok: q.z < 1 && Math.abs(q.x) < 1.05 };
  }
  draw(t) {
    if (this.failed) return;
    if (t !== undefined) this.time = t;
    this.mat.uniforms.uTime.value = this.time;
    this.mat.uniforms.uRise.value = this.rise;
    this.setCam();
    this.renderer.render(this.scene, this.camera);
    if (this.onFrame) this.onFrame(this);
  }
  loop() {
    cancelAnimationFrame(this.raf);
    if (this.o.static) { this.draw(); return; }
    const tick = (ms) => { this.draw(ms / 1000); this.raf = requestAnimationFrame(tick); };
    this.raf = requestAnimationFrame(tick);
  }
}
