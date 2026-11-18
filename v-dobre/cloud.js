import * as THREE from 'three';
import { NAMES, buildShape } from './shapes.js';

const canvas = document.getElementById('cloud');
const footEl = document.querySelector('footer'); let footTop = 1e9, hiddenDraw = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = innerWidth < 800;
const N = small ? 100000 : 260000;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
} catch (err) { document.documentElement.classList.add('no-webgl'); throw err; }
const DPR = Math.min(devicePixelRatio || 1, 2);
renderer.setPixelRatio(DPR);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/* ---------- geometry: A/B pair buffers ---------- */
const geo = new THREE.BufferGeometry();
const mk = (n, name, dyn = true) => { const a = new THREE.BufferAttribute(new Float32Array(N * n), n); if (dyn) a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, a); return a; };
const aA = mk(3, 'position'), aNA = mk(3, 'aNA'), aB = mk(3, 'aPB'), aNB = mk(3, 'aNB'), aGA = mk(1, 'aGA'), aGB = mk(1, 'aGB');
const aRank = mk(1, 'aRank', false), aRand = mk(1, 'aRand', false);
{
  let s = 12345; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < N; i++) { aRank.array[i] = i / (N - 1); aRand.array[i] = rnd(); }
  aRank.needsUpdate = aRand.needsUpdate = true;
}
geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

const U = {
  uT: { value: 0 }, uStagger: { value: .6 }, uBurst: { value: reduced ? .1 : .42 }, uScatter: { value: reduced ? .2 : .7 },
  uScale: { value: 300 }, uYaw: { value: 0 }, uPitch: { value: 0 }, uDpr: { value: DPR }, uSize: { value: small ? 1.8 : 1.75 },
  uActive: { value: -1 }, uActiveAmt: { value: 0 }, uFocus: { value: .1 },
  uCenter: { value: new THREE.Vector2(800, 500) }, uRes: { value: new THREE.Vector2(innerWidth, innerHeight) },
  uMouse: { value: new THREE.Vector2(-9999, -9999) }, uRects: { value: Array.from({ length: 24 }, () => new THREE.Vector4()) }, uNR: { value: 0 }, uMouseR: { value: 120 },
  uInk: { value: new THREE.Color(0x070c26) }, uLit: { value: new THREE.Color(0x5d6788) }
};
const mat = new THREE.ShaderMaterial({
  uniforms: U, transparent: true, depthTest: false, depthWrite: false,
  vertexShader: /* glsl */`
    attribute vec3 aNA; attribute vec3 aPB; attribute vec3 aNB; attribute float aGA; attribute float aGB; attribute float aRank; attribute float aRand;
    uniform float uT, uStagger, uBurst, uScatter, uScale, uYaw, uPitch, uDpr, uSize, uActive, uActiveAmt, uFocus, uMouseR;
    uniform vec2 uCenter, uRes, uMouse; uniform vec4 uRects[24]; uniform float uNR;
    varying float vLit; varying float vA;
    float eio(float t){ return t < .5 ? 4.*t*t*t : 1. - pow(-2.*t + 2., 3.) * .5; }
    vec3 h3(float n){ return fract(sin(vec3(n*127.1, n*311.7, n*74.7)) * 43758.5453); }
    void main(){
      float delay = aRank * uStagger;
      float lt = clamp((uT - delay) / (1.0 - uStagger), 0., 1.);
      float e = eio(lt), mid = sin(3.14159 * lt);
      vec3 p = mix(position, aPB, e);
      vec3 n = normalize(mix(aNA, aNB, e));
      float act = (abs(aGA - uActive) < .5 ? 1. : 0.) * (1. - e) + (abs(aGB - uActive) < .5 ? 1. : 0.) * e;
      act *= uActiveAmt;
      p.x += act * .4;
      p += n * mid * uBurst * (.3 + aRand) + (h3(aRand * 91.7) - .5) * mid * uScatter;
      float cy = cos(uYaw), sy = sin(uYaw);
      p = vec3(cy*p.x + sy*p.z, p.y, -sy*p.x + cy*p.z); n = vec3(cy*n.x + sy*n.z, n.y, -sy*n.x + cy*n.z);
      float cp = cos(uPitch), sp = sin(uPitch);
      p = vec3(p.x, cp*p.y - sp*p.z, sp*p.y + cp*p.z); n = vec3(n.x, cp*n.y - sp*n.z, sp*n.y + cp*n.z);
      float f = 1.0 / (1.0 - p.z * .14);
      vec2 s = uCenter + vec2(p.x, -p.y) * uScale * f;
      vec2 d = s - uMouse; float dl = length(d);
      s += d / max(dl, .001) * exp(-dl*dl / (uMouseR*uMouseR)) * uMouseR * .3;
      float clr = 1.;
      for (int i = 0; i < 24; i++) { if (float(i) >= uNR) break; vec4 q = uRects[i]; vec2 dd = max(max(q.xy - s, s - q.zw), 0.); clr = min(clr, mix(.04, 1., smoothstep(0., 44., length(dd)))); }
      gl_Position = vec4(s.x / uRes.x * 2. - 1., 1. - s.y / uRes.y * 2., 0., 1.);
      vec3 L = normalize(vec3(-.45, .65, .62));
      float dif = max((dot(n, L) + .55) / 1.55, 0.);
      float rim = pow(1. - abs(n.z), 3.);
      float back = smoothstep(.02, -.3, n.z);
      float def = smoothstep(.55, 1.25, abs(p.z - uFocus));
      vLit = clamp(smoothstep(.5, 1.0, dif) * .9 + rim * .14 + act * .35, 0., 1.) * (1. - back);
      vA = (1. - .9 * back) * (1. - .5 * def) * mix(1., .8, mid) * clr;
      gl_PointSize = max(1.0, uSize * uDpr * f * (.8 + .5 * aRand) * (1. + def * 1.1 + act * .25));
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uInk; uniform vec3 uLit; varying float vLit; varying float vA;
    void main(){
      vec2 c = gl_PointCoord - .5; float d = dot(c, c);
      if (d > .25) discard;
      float a = smoothstep(.25, .08, d);
      gl_FragColor = vec4(mix(uInk, uLit, vLit), a * vA * mix(.97, .72, vLit));
    }`
});
const points = new THREE.Points(geo, mat);
points.frustumCulled = false;
scene.add(points);

/* ---------- forms: hero first, the rest in the background ---------- */
const ready = {};
const log = (...a) => { (window.__cloudLog = window.__cloudLog || []).push(a.join(' ')); };
let pairKey = '';
function make(name) { const t = performance.now(); ready[name] = buildShape(name, N); log('ready', name, Math.round(performance.now() - t) + 'ms'); pairKey = ''; }
make('vault');
let qi = 1;
(function next() { if (qi >= NAMES.length) { window.__cloudReady = true; return; } setTimeout(() => { make(NAMES[qi++]); next(); }, 20); })();
const shapeOf = n => ready[n] || ready.vault;

function setPair(an, bn) {
  const A = shapeOf(an), B = shapeOf(bn);
  aA.array.set(A.pos); aNA.array.set(A.nrm); aGA.array.set(A.grp);
  aB.array.set(B.pos); aNB.array.set(B.nrm); aGB.array.set(B.grp);
  aA.needsUpdate = aNA.needsUpdate = aGA.needsUpdate = aB.needsUpdate = aNB.needsUpdate = aGB.needsUpdate = true;
}

/* ---------- key frames from the DOM ---------- */
let keys = [], textEls = [];
function computeKeys() {
  const vh = innerHeight, sy = scrollY, out = [];
  document.querySelectorAll('[data-stage]').forEach(el => {
    const names = el.dataset.stage.split(',');
    const pinEl = el.closest('[data-pin]');
    const pinned = pinEl && getComputedStyle(pinEl.querySelector('.pin')).position === 'sticky';
    if (pinned) {
      const r = pinEl.getBoundingClientRect(), T = r.top + sy, trav = r.height - vh;
      names.forEach((nm, k) => {
        const f = names.length === 1 ? .5 : k / (names.length - 1), hold = names.length === 1 ? .5 * trav : .17 * vh;
        const c = T + f * trav;
        out.push({ el, name: nm, y0: names.length === 1 ? T + vh * .3 : c - hold + vh * .5, y1: names.length === 1 ? T + trav + vh * .7 : c + hold + vh * .5, ground: +el.dataset.ground, i: k });
      });
    } else {
      const r = el.getBoundingClientRect(), c = r.top + sy + r.height / 2, hold = Math.max(.3 * vh, .32 * r.height);
      out.push({ el, name: names[0], y0: c - hold, y1: c + hold, ground: +el.dataset.ground, i: 0 });
    }
  });
  textEls = [...document.querySelectorAll('main h2, main p, .steps li, .own-list li, .core-left, .posts a, .sup-list li, .cap, .est-side')].filter(e => !e.closest('.hero'));
  out.sort((a, b) => a.y0 - b.y0);
  keys = out;
  if (footEl) footTop = footEl.getBoundingClientRect().top + sy;
}

/* ---------- pointer ---------- */
const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
addEventListener('pointermove', e => { mouse.tx = e.clientX; mouse.ty = e.clientY; if (mouse.x < -999) { mouse.x = e.clientX; mouse.y = e.clientY; } }, { passive: true });
addEventListener('pointerleave', () => { mouse.tx = mouse.ty = -9999; });

/* ---------- resize ---------- */
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  U.uRes.value.set(innerWidth, innerHeight);
  computeKeys();
}
addEventListener('resize', resize);
new ResizeObserver(() => computeKeys()).observe(document.body);
document.fonts && document.fonts.ready.then(() => setTimeout(computeKeys, 50));
addEventListener('load', () => setTimeout(computeKeys, 100));
resize();

/* ---------- loop ---------- */
const GRAY_LIT = new THREE.Color(0x5d6788), BLUE_LIT = new THREE.Color(0xe2eaff), tmp = new THREE.Color();
const fit = (sh, r, m = .94) => Math.min(r.width / (2 * sh.hw), r.height / (2 * sh.hh)) * m;
let lastActive = -1, activeT = 0, visible = true, last = performance.now();
document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) requestAnimationFrame(frame); });

const SPIN = { vault: .0003, gears: .0003, tower: .0004, rings: .0006, stack: .0006, viaduct: .0003, ziggurat: .0005, mobius: .0007, globe: .0012, cone: .0005, ribbon: .0003, city: .0004 };
const SWAY = { vault: .16, gears: .16, tower: .14, rings: .14, stack: .16, viaduct: .1, ziggurat: .14, mobius: .2, globe: .12, cone: .14, ribbon: .08, city: .1 };
const MUL = { vault: .86, gears: .92, tower: .96, rings: .96, stack: .98, viaduct: 1, ziggurat: 1, mobius: 1, globe: 1, cone: 1, ribbon: 1, city: 1 };

function frame(now) {
  if (!visible) return;
  requestAnimationFrame(frame);
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  const vh = innerHeight, sy = scrollY, f = sy + vh * .5;
  if (!keys.length) return;
  if (footEl && sy + vh * .15 > footTop) { if (!hiddenDraw) { renderer.clear(); hiddenDraw = true; } return; }
  hiddenDraw = false;
  let i = 0; while (i < keys.length - 1 && f >= keys[i + 1].y0) i++;
  let j = i, tt = 0;
  if (i < keys.length - 1) { j = i + 1; const a = keys[i].y1, b = keys[j].y0; if (f > a) tt = smooth(0, 1, (f - a) / Math.max(1, b - a)); }
  const k0 = keys[i], k1 = keys[j];
  const key = k0.name + '>' + k1.name;
  if (key !== pairKey) { pairKey = key; setPair(k0.name, k1.name); }
  const A = shapeOf(k0.name), B = shapeOf(k1.name);
  const r0 = k0.el.getBoundingClientRect(), r1 = j === i ? r0 : k1.el.getBoundingClientRect();
  const cx = lerp(r0.left + r0.width / 2, r1.left + r1.width / 2, tt), cy = lerp(r0.top + r0.height / 2, r1.top + r1.height / 2, tt);
  const sc = lerp(fit(A, r0) * (MUL[k0.name] || 1), fit(B, r1) * (MUL[k1.name] || 1), tt);
  U.uCenter.value.set(cx, clamp(cy, vh * .2, vh * .8)); U.uScale.value = sc; U.uT.value = tt;
  const t = reduced ? 0 : now / 1000;
  const yaw = k => Math.max(-1.3, Math.min(1.3, (f - (k.y0 + k.y1) / 2) * (SPIN[k.name] || .0006))) + Math.sin(t * .35 + k.i) * (SWAY[k.name] || .1);
  U.uYaw.value = lerp(yaw(k0), yaw(k1), tt);
  U.uPitch.value = Math.sin(t * .27) * .04;
  // ground colours
  const g = lerp(k0.ground, k1.ground, tt);
  tmp.copy(GRAY_LIT).lerp(BLUE_LIT, g); U.uLit.value.copy(tmp);
  // service stack: lifted layer follows the active service
  const act = +document.body.dataset.core || 0;
  const stackW = (k0.name === 'stack' ? 1 - tt : 0) + (k1.name === 'stack' && j !== i ? tt : 0);
  if (act !== lastActive) { lastActive = act; activeT = 0; U.uActive.value = act; }
  activeT = Math.min(1, activeT + dt * 2.2);
  U.uActiveAmt.value = stackW * smooth(0, 1, activeT);
  { let n = 0; for (const el of textEls) { if (n >= 24) break; const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh || !r.width) continue; U.uRects.value[n++].set(r.left - 8, r.top - 8, r.right + 8, r.bottom + 8); } U.uNR.value = n; }
  // pointer
  mouse.x += (mouse.tx - mouse.x) * .18; mouse.y += (mouse.ty - mouse.y) * .18;
  U.uMouse.value.set(mouse.x, mouse.y);
  renderer.render(scene, camera);
  if (!window.__cloudFirst) { window.__cloudFirst = true; document.documentElement.classList.add('cloud-on'); }
}
requestAnimationFrame(frame);
window.__holds = () => keys.map(k => ({ n: k.name, y: Math.round((k.y0 + k.y1) / 2 - innerHeight / 2) }));
