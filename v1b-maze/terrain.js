import * as THREE from 'three';

/* ---------- CPU height field (own noise, so DOM tags can sit on exact surface points) ---------- */
function hash(x, y, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const sm = (t) => t * t * (3 - 2 * t);
function vn(x, y, s) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
  const u = sm(fx), v = sm(fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) {
  let a = 0.5, f = 1, t = 0;
  for (let i = 0; i < 5; i++) { t += a * vn(x * f, y * f, s + i * 17); f *= 2.03; a *= 0.5; }
  return t;
}
function ridge(x, y, s) {
  let a = 0.5, f = 1, t = 0;
  for (let i = 0; i < 4; i++) { const n = 1 - Math.abs(vn(x * f, y * f, s + i * 31) * 2 - 1); t += a * n * n; f *= 2.1; a *= 0.5; }
  return t;
}

const VERT = /* glsl */`
uniform float uTime, uPR, uF, uPoint, uIntro, uHover;
uniform vec3 uPulse[4];
uniform vec3 uMouse;
attribute vec3 aN;
attribute float aH, aR;
varying float vShade, vAlpha, vH, vRing, vDepth;
void main(){
  vec3 p = position;
  float stag = smoothstep(0.0, 1.0, uIntro * 1.5 - aR * 0.5 - (1.0 - aH) * 0.0);
  p.y -= (1.0 - stag) * 2.2;
  float md = distance(p.xz, uMouse.xz);
  p.y += exp(-md * md * 0.06) * 0.9 * uHover;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, uPoint * uF * uPR / -mv.z);
  vec3 L = normalize(vec3(-0.75, 0.42, 0.35));
  float d = dot(normalize(aN), L) * 0.5 + 0.5;
  vShade = d;
  vH = aH;
  float ring = 0.0;
  for (int i = 0; i < 4; i++) {
    vec3 q = uPulse[i];
    float age = uTime - q.z;
    if (age > 0.0 && age < 5.0) {
      float dist = distance(p.xz, q.xy);
      float r = age * 3.2;
      ring += exp(-pow((dist - r) * 1.1, 2.0)) * (1.0 - age / 5.0);
    }
  }
  vRing = ring;
  vAlpha = stag;
}`;

const FRAG = /* glsl */`
precision highp float;
uniform vec3 uLo, uHi, uAccent;
uniform vec2 uFog, uRes;
uniform vec4 uMaskX, uMaskY;
uniform float uTime, uAlpha, uContour;
varying float vShade, vAlpha, vH, vRing, vDepth;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float disc = smoothstep(0.5, 0.18, r);
  float h = vH;
  float t = clamp(smoothstep(0.05, 0.9, h) * 0.35 + pow(vShade, 1.7) * 1.15 - 0.1, 0.0, 1.0);
  vec3 col = mix(uLo, uHi, t);
  float cl = abs(fract(h * 16.0 - uTime * 0.05) - 0.5) * 2.0;
  col += uAccent * smoothstep(0.86, 1.0, cl) * uContour;
  col += uAccent * vRing * 1.4;
  vec2 s = gl_FragCoord.xy / uRes;
  float mx = smoothstep(uMaskX.x, uMaskX.y, s.x) * (1.0 - smoothstep(uMaskX.z, uMaskX.w, s.x));
  float my = smoothstep(uMaskY.x, uMaskY.y, 1.0 - s.y) * (1.0 - smoothstep(uMaskY.z, uMaskY.w, 1.0 - s.y));
  float fog = 1.0 - smoothstep(uFog.x, uFog.y, vDepth);
  float a = disc * vAlpha * fog * mx * my * uAlpha * (0.55 + 0.7 * t);
  gl_FragColor = vec4(col, a);
}`;

export class Terrain {
  constructor(canvas, o) {
    this.canvas = canvas;
    this.o = Object.assign({
      cols: 440, rows: 280, w: 40, z0: 6, z1: -34, amp: 4, freq: 0.11, ridge: 0.55, rise: 3, seed: 7,
      lo: '#0B2C9A', hi: '#BFD0FF', accent: '#FFFFFF', fov: 38, cam: [0, 7.5, 10], look: [0, 0.5, -8], camEnd: null, lookEnd: null,
      fog: [16, 52], alpha: 0.85, contour: 0.35, pointScale: 1.5, maskX: [0, 0, 1, 1], maskY: [0, 0, 1, 1],
      shift: [0, 0], blend: THREE.AdditiveBlending, hover: true, additive: true
    }, o);
    this.progress = 0; this.visible = false; this.hover = 0; this.hoverT = 0;
    this.mouse = new THREE.Vector3(999, 0, 999);
    this.pulses = [0, 1, 2, 3].map(() => new THREE.Vector3(999, 999, -99));
    this.pulseI = 0;
    this.ok = false;
    try { this.init(); this.ok = true; } catch (e) { console.warn('terrain init failed', e); }
  }
  heightAt(x, z) {
    const o = this.o, p = o.freq;
    let h = (o.ridge * ridge(x * p + 3, z * p + 9, o.seed) + (1 - o.ridge) * fbm(x * p, z * p, o.seed)) * o.amp;
    h += o.rise * ((o.z0 - z) / (o.z0 - o.z1));
    return h;
  }
  init() {
    const o = this.o;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }));
    r.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(o.fov, 1, 0.1, 200);
    const n = o.cols * o.rows;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), aH = new Float32Array(n), aR = new Float32Array(n);
    const dx = o.w / o.cols, dz = (o.z0 - o.z1) / o.rows;
    let hmin = 1e9, hmax = -1e9, i = 0;
    for (let j = 0; j < o.rows; j++) for (let k = 0; k < o.cols; k++, i++) {
      const x = (k / (o.cols - 1) - 0.5) * o.w + (Math.random() - 0.5) * dx * 0.9;
      const z = o.z0 - (j / (o.rows - 1)) * (o.z0 - o.z1) + (Math.random() - 0.5) * dz * 0.9;
      const y = this.heightAt(x, z);
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      const e = 0.18;
      const nx = this.heightAt(x - e, z) - this.heightAt(x + e, z);
      const nz = this.heightAt(x, z - e) - this.heightAt(x, z + e);
      const l = Math.hypot(nx, 2 * e, nz);
      nor[i * 3] = nx / l; nor[i * 3 + 1] = (2 * e) / l; nor[i * 3 + 2] = nz / l;
      aH[i] = y; aR[i] = Math.random();
      if (y < hmin) hmin = y; if (y > hmax) hmax = y;
    }
    for (let q = 0; q < n; q++) aH[q] = (aH[q] - hmin) / (hmax - hmin);
    this.hmin = hmin; this.hmax = hmax;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aN', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aH', new THREE.BufferAttribute(aH, 1));
    g.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -14), 200);
    const col = (c) => new THREE.Color(c);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: o.blend,
      uniforms: {
        uTime: { value: 0 }, uPR: { value: 1 }, uF: { value: 800 }, uPoint: { value: dx * o.pointScale },
        uIntro: { value: 0 }, uHover: { value: 0 }, uPulse: { value: this.pulses }, uMouse: { value: this.mouse },
        uLo: { value: col(o.lo) }, uHi: { value: col(o.hi) }, uAccent: { value: col(o.accent) },
        uFog: { value: new THREE.Vector2(...o.fog) }, uRes: { value: new THREE.Vector2(1, 1) },
        uMaskX: { value: new THREE.Vector4(...o.maskX) }, uMaskY: { value: new THREE.Vector4(...o.maskY) },
        uAlpha: { value: o.alpha }, uContour: { value: o.contour }
      }
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    this.intro = 0; this.introTarget = 1;
    this.resize();
    this.io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; }, { rootMargin: '100px' });
    this.io.observe(this.canvas);
    if (o.hover) {
      const host = this.canvas.parentElement;
      host.addEventListener('pointermove', (ev) => {
        const b = this.canvas.getBoundingClientRect();
        const nx = ((ev.clientX - b.left) / b.width) * 2 - 1, ny = -((ev.clientY - b.top) / b.height) * 2 + 1;
        const ray = new THREE.Raycaster(); ray.setFromCamera({ x: nx, y: ny }, this.camera);
        const t = (2.5 - ray.ray.origin.y) / ray.ray.direction.y;
        if (t > 0 && t < 120) { this.mouse.copy(ray.ray.origin).addScaledVector(ray.ray.direction, t); this.hoverT = 1; }
      });
      host.addEventListener('pointerleave', () => { this.hoverT = 0; });
    }
  }
  resize() {
    if (!this.mat || !this.points) return;
    const b = this.canvas.parentElement.getBoundingClientRect();
    const w = Math.max(1, Math.round(b.width)), h = Math.max(1, Math.round(b.height));
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = w; this.H = h; this.pr = pr;
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.camera.aspect = w / h;
    const sh = this.o.shift;
    const mobile = w < 700;
    const s = mobile && this.o.shiftMobile ? this.o.shiftMobile : sh;
    this.camera.setViewOffset(w, h, -s[0] * w, -s[1] * h, w, h);
    this.camera.updateProjectionMatrix();
    this.mat.uniforms.uPR.value = pr;
    this.mat.uniforms.uRes.value.set(w * pr, h * pr);
    this.mat.uniforms.uF.value = h / (2 * Math.tan((this.o.fov * Math.PI) / 360));
    this.renderOnce();
  }
  setCamera() {
    const o = this.o, p = this.progress;
    const e = o.camEnd || o.cam, le = o.lookEnd || o.look;
    this.camera.position.set(o.cam[0] + (e[0] - o.cam[0]) * p, o.cam[1] + (e[1] - o.cam[1]) * p, o.cam[2] + (e[2] - o.cam[2]) * p);
    this.camera.lookAt(o.look[0] + (le[0] - o.look[0]) * p, o.look[1] + (le[1] - o.look[1]) * p, o.look[2] + (le[2] - o.look[2]) * p);
    this.camera.updateMatrixWorld();
  }
  /** project a terrain point (x,z) to pixel coords inside the canvas */
  project(x, z) {
    const v = new THREE.Vector3(x, this.heightAt(x, z), z).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.W, y: (-v.y * 0.5 + 0.5) * this.H, behind: v.z > 1 };
  }
  firePulse(x, z) {
    const p = this.pulses[this.pulseI++ % 4];
    p.set(x, z, this.mat.uniforms.uTime.value);
  }
  renderOnce() { this.draw(0, true); }
  draw(dt, force) {
    if (!this.ok) return;
    const u = this.mat.uniforms;
    u.uTime.value += dt;
    if (this.introStart == null) this.introStart = performance.now();
    this.intro = Math.min(1, (performance.now() - this.introStart) / 1000 / (this.o.introSec || 2.2));
    u.uIntro.value = this.o.introOverride != null ? this.o.introOverride : this.intro;
    this.hover += (this.hoverT - this.hover) * Math.min(1, dt * 3);
    u.uHover.value = this.hover;
    this.setCamera();
    this.renderer.render(this.scene, this.camera);
  }
}

/* Shared loop: only visible terrains tick. */
const list = [];
let last = 0, running = false;
export function register(t, reduced) {
  if (reduced) { t.o.introOverride = 1; t.renderOnce(); }
  list.push({ t, reduced });
  if (!running) { running = true; requestAnimationFrame(tick); }
}
function tick(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
  last = ts;
  for (const { t, reduced } of list) {
    if (!t.ok) continue;
    if (reduced) continue;
    if (t.visible) { t.draw(dt); t.onFrame && t.onFrame(dt); }
  }
  requestAnimationFrame(tick);
}

/* Render one frame of a terrain to a PNG data URL, then free the GL context. */
export function still(opts, w, h) {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-9999px;top:0;width:${w}px;height:${h}px;pointer-events:none`;
  const cv = document.createElement('canvas'); host.appendChild(cv); document.body.appendChild(host);
  let url = null;
  try {
    const t = new Terrain(cv, Object.assign({}, opts, { hover: false, introOverride: 1 }));
    if (t.ok) {
      t.mat.uniforms.uTime.value = 3; t.draw(0);
      url = cv.toDataURL('image/png');
      t.renderer.dispose(); t.renderer.forceContextLoss();
    }
  } finally { host.remove(); }
  return url;
}
