// Fluted sculpture renderer: procedural ribbed surfaces, code-built studio lighting, own post pass.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TAU = Math.PI * 2;
export const BLUE = 0x1647db;

/* ---------- surfaces ---------- */
const KINDS = {
  wave(u, v, o) {
    const t = u - 0.5, s = v - 0.5;
    const y = Math.sin(t * TAU * o.f + s * o.skew) * o.A + Math.sin(t * TAU * o.f * 2.3 + 1.7) * o.A * 0.22 + s * o.tilt;
    return [s * o.W, y, t * o.L];
  },
  loop(u, v, o) {
    const th = u * TAU * o.turns, s = v - 0.5;
    const R = o.R * (1 + 0.24 * Math.sin(s * 3.0 + o.ph));
    return [s * o.W + Math.sin(th * 0.5) * o.drift, Math.sin(th) * R, Math.cos(th) * R];
  },
  pleat(u, v, o) {
    const t = u - 0.5, s = v - 0.5;
    const tri = Math.asin(Math.sin(t * TAU * o.f)) * (2 / Math.PI);
    return [s * o.W, tri * o.A * (1 + 0.3 * Math.sin(s * 2)), t * o.L + s * o.tilt];
  },
  swirl(u, v, o) {
    const th = u * TAU * o.turns, R = o.R * (0.35 + u * 0.9), s = v - 0.5;
    return [Math.cos(th) * R, s * o.W + u * o.rise, Math.sin(th) * R];
  },
};

function buildGeometry(kind, o) {
  const U = o.U || 900, V = o.V || 48;
  const f = KINDS[kind];
  const pos = new Float32Array((U + 1) * (V + 1) * 3);
  let k = 0;
  for (let i = 0; i <= U; i++) for (let j = 0; j <= V; j++) {
    const p = f(i / U, j / V, o);
    pos[k++] = p[0]; pos[k++] = p[1]; pos[k++] = p[2];
  }
  const idx = new Uint32Array(U * V * 6);
  k = 0;
  for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
    const a = i * (V + 1) + j, b = a + 1, c = a + V + 1, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  const n = g.attributes.normal.array;
  k = 0;
  for (let i = 0; i <= U; i++) {
    const w = (i / U * o.ribs) % 1;
    const prof = (Math.pow(Math.sin(Math.PI * w), 0.5) - 0.6) * o.amp;
    for (let j = 0; j <= V; j++) {
      pos[k] += n[k] * prof; pos[k + 1] += n[k + 1] * prof; pos[k + 2] += n[k + 2] * prof; k += 3;
    }
  }
  g.attributes.position.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/* ---------- studio lighting built in code ---------- */
export function makeEnv(renderer, mode) {
  const s = new THREE.Scene();
  const bright = mode === 'bright';
  s.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16),
    new THREE.MeshBasicMaterial({ color: bright ? 0x59627a : 0x04070f, side: THREE.BackSide })));
  const strip = (w, h, p, look, hex, power) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(power), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(...p); m.lookAt(...look); s.add(m);
  };
  if (bright) {
    strip(40, 14, [0, 14, 0], [0, 0, 0], 0xffffff, 1.9);
    strip(6, 30, [-16, 0, 2], [0, 0, 0], 0x4f7dff, 6);
    strip(5, 26, [15, 2, 4], [0, 0, 0], 0xffffff, 2.2);
    strip(30, 6, [0, -9, 8], [0, 0, 0], 0xcfd8ff, 1.6);
  } else {
    strip(34, 2.6, [0, 12, 2], [0, 0, 0], 0xffffff, 7);
    strip(2.2, 30, [-15, 0, 3], [0, 0, 0], 0x2b63ff, 12);
    strip(1.4, 26, [14, 1, 6], [0, 0, 0], 0xffffff, 5);
    strip(30, 1.6, [0, -3, -14], [0, 0, 0], 0x6ea0ff, 6);
    strip(18, 1.2, [0, -11, 6], [0, 0, 0], 0x1647db, 4);
    strip(36, 7, [0, 7, -20], [0, 0, 0], 0xdfe8ff, 1.4);
    strip(26, 22, [-18, 8, 8], [0, 0, 0], 0x6d86d6, 0.85);
    strip(24, 20, [16, 3, 10], [0, 0, 0], 0x40507f, 0.6);
    strip(40, 18, [0, 14, 10], [0, 0, 0], 0x8190c0, 0.5);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.015);
  pm.dispose();
  s.traverse((o) => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); });
  return rt.texture;
}

const PALETTES = {
  black: { color: 0x070a12, metalness: 0.7, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, env: 'dark', bg: 0x02030a },
  blue: { color: 0x1647db, metalness: 0.35, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.1, env: 'dark', bg: 0x0a2fa0 },
  frost: { color: 0xc4cadb, metalness: 0.05, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.4, env: 'bright', bg: 0xc9cfdc },
  ink: { color: 0x0a0f20, metalness: 0.6, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, env: 'dark', bg: 0x03040a },
};

const POST = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uCA: { value: 0.1 }, uGrain: { value: 0.07 }, uVig: { value: 0.85 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uCA, uGrain, uVig; varying vec2 vUv;
    float hs(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
    void main(){
      vec2 c=vUv-.5; float d2=dot(c,c);
      vec3 col=vec3(0.); vec3 ws=vec3(0.);
      for(int i=0;i<6;i++){
        float t=float(i)/5.;
        float s=1.+uCA*d2*(t*2.-1.);
        vec3 w=vec3(smoothstep(.25,1.,t),1.-abs(t-.5)*1.6,smoothstep(.75,0.,t));
        col+=texture2D(tDiffuse,c*s+.5).rgb*w; ws+=w;
      }
      col/=ws;
      float lum=dot(col,vec3(.299,.587,.114));
      float g=hs(gl_FragCoord.xy+fract(uTime*.37)*173.1)-.5;
      col+=g*uGrain*(.25+sqrt(lum));
      col*=mix(1.,smoothstep(1.0,.2,length(c*vec2(1.,.92))),uVig);
      gl_FragColor=vec4(max(col,0.),1.);
    }`,
};

export class Studio {
  constructor(canvas, { dpr = Math.min(window.devicePixelRatio || 1, 2) } = {}) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(dpr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.envs = {};
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.post = new ShaderPass(POST);
    this.composer.addPass(this.post);
    this.composer.addPass(new OutputPass());
    this.mesh = null;
  }
  env(mode) { return this.envs[mode] || (this.envs[mode] = makeEnv(this.renderer, mode)); }
  setView(v) {
    this.view = v;
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
    const pal = PALETTES[v.palette || 'black'];
    const mat = new THREE.MeshPhysicalMaterial({
      color: pal.color, metalness: pal.metalness, roughness: pal.roughness,
      clearcoat: pal.clearcoat, clearcoatRoughness: pal.clearcoatRoughness, side: THREE.DoubleSide,
      envMapIntensity: v.envI ?? 1,
    });
    this.scene.environment = this.env(pal.env);
    this.scene.background = null;
    this.mesh = new THREE.Mesh(buildGeometry(v.kind, v.o), mat);
    this.mesh.rotation.set(...(v.rot || [0, 0, 0]));
    this.scene.add(this.mesh);
    this.bgHex = pal.bg;
    this.post.uniforms.uCA.value = v.ca ?? 0.12;
    this.post.uniforms.uGrain.value = v.grain ?? 0.07;
    this.post.uniforms.uVig.value = v.vig ?? 0.85;
    const c = this.camera; c.fov = v.fov || 35;
    c.position.set(...v.cam); c.lookAt(...(v.look || [0, 0, 0]));
  }
  size(w, h) {
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  draw(t, exposure = 1) {
    this.renderer.toneMappingExposure = exposure;
    this.post.uniforms.uTime.value = t;
    this.composer.render();
  }
  dispose() {
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

/* ---------- view presets ---------- */
export const VIEWS = {
  hero: { kind: 'wave', palette: 'black', o: { f: 0.85, A: 3.0, skew: 2.6, tilt: 1.6, W: 20, L: 20, ribs: 56, amp: 0.12, U: 1100, V: 44 },
    rot: [0.28, -0.5, 0.12], cam: [0, 2.5, 13], fov: 40, envI: 1.1, ca: 0.1 },
  badges: { kind: 'wave', palette: 'blue', o: { f: 1.1, A: 2.4, skew: 2.2, tilt: 1.2, W: 15, L: 15, ribs: 64, amp: 0.09, U: 900, V: 40 },
    rot: [0.2, -0.5, 0.1], cam: [0, 3.5, 12], fov: 40, envI: 1.1, ca: 0.1 },
  build1: { kind: 'wave', palette: 'blue', o: { f: 0.8, A: 3.2, skew: -2.8, tilt: 2.4, W: 16, L: 16, ribs: 46, amp: 0.12, U: 900, V: 44 },
    rot: [0.35, 0.7, -0.1], cam: [0, 3, 11], fov: 40, envI: 1.15, ca: 0.08 },
  build2: { kind: 'wave', palette: 'black', o: { f: 1.3, A: 2.6, skew: 3, tilt: -1.8, W: 16, L: 16, ribs: 44, amp: 0.13, U: 900, V: 44 },
    rot: [0.3, 0.3, 0.2], cam: [0, 3, 11], fov: 40, envI: 1.35, ca: 0.08 },
  build3: { kind: 'pleat', palette: 'frost', o: { f: 1.4, A: 2.4, W: 14, L: 14, tilt: 1.4, ribs: 34, amp: 0.1, U: 900, V: 36 },
    rot: [0.5, -0.5, 0.05], cam: [0, 5, 12], fov: 38, envI: 0.9, ca: 0.04, grain: 0.05, vig: 0.4 },
  support: { kind: 'wave', palette: 'ink', o: { f: 0.7, A: 3.4, skew: 1.6, tilt: -2.2, W: 20, L: 20, ribs: 62, amp: 0.12, U: 1100, V: 44 },
    rot: [0.4, 0.55, 0.25], cam: [0, 2, 12], fov: 40, envI: 1.35, ca: 0.08 },
  spot1: { kind: 'wave', palette: 'black', o: { f: 1.0, A: 3.0, skew: -1.8, tilt: 2.2, W: 16, L: 16, ribs: 48, amp: 0.13, U: 900, V: 44 },
    rot: [0.4, 1.0, 0.1], cam: [0, 3, 11], fov: 40, envI: 1.35, ca: 0.08 },
  spot2: { kind: 'wave', palette: 'blue', o: { f: 0.9, A: 2.6, skew: 1.2, tilt: -1, W: 12, L: 14, ribs: 50, amp: 0.1, U: 900, V: 40 },
    rot: [0.15, 0.9, 0.1], cam: [0, 3, 10], fov: 36, envI: 1.1 },
  spot3: { kind: 'pleat', palette: 'black', o: { f: 1.2, A: 2.8, W: 14, L: 14, tilt: -1.6, ribs: 38, amp: 0.12, U: 900, V: 36 },
    rot: [0.55, 0.2, -0.2], cam: [0, 5, 12], fov: 38, envI: 1.35 },
  cta: { kind: 'wave', palette: 'black', o: { f: 0.75, A: 3.2, skew: 2.0, tilt: -1.2, W: 20, L: 20, ribs: 58, amp: 0.13, U: 1100, V: 44 },
    rot: [0.35, 0.35, -0.1], cam: [0, 3, 12.5], fov: 40, envI: 1.3, ca: 0.09 },
};
