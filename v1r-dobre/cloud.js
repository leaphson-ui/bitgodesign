// One dense point cloud that morphs between procedural shapes as the page scrolls.
import * as THREE from 'three';
import { buildShape } from './shapes.js';

const VERT = /* glsl */`
attribute vec3 aNormA; attribute vec3 aPosB; attribute vec3 aNormB;
attribute float aRank; attribute float aRand;
uniform float uScale, uProg, uStagger, uBurst, uSize, uTime, uAspect, uMouseOn, uSway;
uniform vec2 uMouse;
uniform vec3 uLight;
varying float vL; varying float vFar; varying float vJit;
void main(){
  float delay = aRank * uStagger + (aRand - 0.5) * 0.05;
  float t = clamp((uProg - delay) / (1.0 - uStagger - 0.03), 0.0, 1.0);
  float e = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(position, aPosB, e);
  vec3 n = normalize(mix(aNormA, aNormB, e));
  float bump = sin(3.14159265 * t);
  vec3 rv = fract(sin(aRand * vec3(127.1, 311.7, 74.7) * 41.3) * 43758.5453) - 0.5;
  float spike = mix(0.35, 1.7, fract(aRand * 91.7));
  p += n * bump * uBurst * spike + rv * bump * 0.55;
  p += vec3(sin(uTime * 0.6 + aRand * 40.0), cos(uTime * 0.5 + aRand * 33.0), 0.0) * 0.0035 * uSway;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 vn = normalize(normalMatrix * n);
  float ndl = dot(vn, uLight);
  float diff = max((ndl + 0.5) / 1.5, 0.0);
  vec3 vd = normalize(-mv.xyz);
  float rim = pow(clamp(1.0 - max(dot(vn, vd), 0.0), 0.0, 1.0), 4.0);
  vL = clamp(0.07 + diff * 0.9 + rim * 0.45, 0.0, 1.0);
  float cz = -(modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z;
  vFar = clamp(0.5 + (-mv.z - cz) / (1.7 * uScale), 0.0, 1.0);
  vJit = fract(aRand * 713.1);
  vec4 cp = projectionMatrix * mv;
  vec2 nd = cp.xy / cp.w - uMouse;
  nd.x *= uAspect;
  float d2 = dot(nd, nd);
  vec2 push = normalize(nd + 1e-5) * exp(-d2 / 0.03) * 0.07 * uMouseOn;
  cp.xy += vec2(push.x / uAspect, push.y) * cp.w;
  gl_Position = cp;
  gl_PointSize = uSize * (7.0 / max(-mv.z, 1.0)) * (1.0 + bump * 0.6);
}`;
const FRAG = /* glsl */`
uniform vec3 uInk, uHi; uniform float uAlpha;
varying float vL; varying float vFar; varying float vJit;
void main(){
  vec2 c = gl_PointCoord - 0.5; float d = dot(c, c);
  if (d > 0.25) discard;
  float shade = mix(0.8, 1.0, sqrt(1.0 - d * 4.0));
  vec3 col = mix(uInk, uHi, pow(clamp(vL * shade * (0.92 + vJit * 0.16), 0.0, 1.0), 1.35));
  col = mix(col, uHi, vFar * vFar * 0.5);
  gl_FragColor = vec4(col, 0.95 * uAlpha);
}`;

export class Cloud {
  constructor(canvas, N) {
    this.N = N;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    this.camera.position.set(0, 0, 7);
    const g = new THREE.BufferGeometry();
    const z = new Float32Array(N * 3);
    this.aPosA = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
    this.aNormA = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
    this.aPosB = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
    this.aNormB = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
    for (const a of [this.aPosA, this.aNormA, this.aPosB, this.aNormB]) a.setUsage(THREE.DynamicDrawUsage);
    const rank = new Float32Array(N), rand = new Float32Array(N);
    let s = 12345; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < N; i++) { rank[i] = i / (N - 1); rand[i] = r(); }
    g.setAttribute('position', this.aPosA); g.setAttribute('aNormA', this.aNormA);
    g.setAttribute('aPosB', this.aPosB); g.setAttribute('aNormB', this.aNormB);
    g.setAttribute('aRank', new THREE.BufferAttribute(rank, 1)); g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
    this.uniforms = {
      uScale: { value: 1.5 }, uProg: { value: 0 }, uStagger: { value: 0.32 }, uBurst: { value: 0.22 }, uSize: { value: 3 }, uTime: { value: 0 },
      uAspect: { value: 1 }, uMouseOn: { value: 0 }, uSway: { value: 1 }, uMouse: { value: new THREE.Vector2(9, 9) },
      uLight: { value: new THREE.Vector3(-0.42, 0.62, 0.66).normalize() },
      uInk: { value: new THREE.Color('#080a10') }, uHi: { value: new THREE.Color('#8e97ab') }, uAlpha: { value: 1 },
    };
    this.mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms, transparent: true, depthTest: true, depthWrite: true });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    this.loaded = { a: null, b: null };
    this.dpr = 1;
  }
  resize(w, h, dpr) {
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.w = w; this.h = h;
    this.uniforms.uAspect.value = w / h;
    // point size scales with canvas height and DPR so density holds at any width
    const base = this.N > 150000 ? 3.6 : 4.2;
    this.uniforms.uSize.value = base * dpr * Math.max(0.8, h / 1000);
    this.halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    this.halfW = this.halfH * this.camera.aspect;
  }
  setPair(a, b) {
    if (this.loaded.a !== a) {
      const s = buildShape(a, this.N);
      this.aPosA.array.set(s.pos); this.aNormA.array.set(s.nor); this.aPosA.needsUpdate = true; this.aNormA.needsUpdate = true; this.loaded.a = a;
    }
    if (this.loaded.b !== b) {
      const s = buildShape(b, this.N);
      this.aPosB.array.set(s.pos); this.aNormB.array.set(s.nor); this.aPosB.needsUpdate = true; this.aNormB.needsUpdate = true; this.loaded.b = b;
    }
  }
  render() { this.renderer.render(this.scene, this.camera); }
}
