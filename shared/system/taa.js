/* Temporal smoothing (TAA) for the site's WebGL pages.

   Why: the glass objects have highlight lines thinner than a pixel (reflections on the bevels, and the curtain's stripes
   refracted through them). MSAA and SMAA only smooth polygon outlines, so those lines break into dots and dashes.
   Each frame the camera is shifted by a sub-pixel amount (Halton 2,3) and a final pass blends the new frame into a
   running history. The history is clamped to the colours around each pixel in the new frame, and the blend follows how
   fast things move on screen: still objects get full smoothing, moving ones little or none, so nothing smears.
   Proven on Self-Custody against a 3x supersampled reference, at no measurable frame-time cost.

   Use: composer.addPass(new TAAPass()) after OutputPass; call taaStep(taa, {...}) right before composer.render(). */
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';

export class TAAPass extends Pass {
  constructor() {
    super();
    const mk = () => new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, depthBuffer: false });
    this.hist = [mk(), mk()]; this.i = 0; this.alpha = 1; this.reset = true;
    this.blend = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: { tCur: { value: null }, tHist: { value: null }, uTexel: { value: new THREE.Vector2() }, uAlpha: { value: 1 } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tCur, tHist; uniform vec2 uTexel; uniform float uAlpha; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tCur, vUv).rgb, mn = c, mx = c;
          for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) { vec3 s = texture2D(tCur, vUv + vec2(float(x), float(y)) * uTexel).rgb; mn = min(mn, s); mx = max(mx, s); }
          vec3 h = clamp(texture2D(tHist, vUv).rgb, mn, mx);
          gl_FragColor = vec4(mix(h, c, uAlpha), 1.);
        }`, depthTest: false, depthWrite: false }));
    this.copy = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: VS,
      fragmentShader: 'uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = texture2D(t, vUv); }', depthTest: false, depthWrite: false }));
  }
  setSize(w, h) { this.hist.forEach(r => r.setSize(w, h)); this.blend.material.uniforms.uTexel.value.set(1 / w, 1 / h); this.reset = true; }
  render(renderer, writeBuffer, readBuffer) {
    const prev = this.hist[this.i], next = this.hist[1 - this.i], u = this.blend.material.uniforms;
    u.tCur.value = readBuffer.texture; u.tHist.value = prev.texture; u.uAlpha.value = this.reset ? 1 : this.alpha;
    renderer.setRenderTarget(next); this.blend.render(renderer);
    this.copy.material.uniforms.t.value = next.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.copy.render(renderer);
    this.i = 1 - this.i; this.reset = false;
  }
}

const HAL = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
const V = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3();

/* o: { camera, scene, W, H (CSS px), dpr, skip: Set of meshes to ignore (the curtain), drift: pointer is moving } */
export function taaStep(taa, o) {
  const st = taa.st || (taa.st = { sy: scrollY, jit: 0, last: new WeakMap() });
  o.camera.clearViewOffset();                       // measure motion with the unshifted camera
  const scrolled = Math.abs(scrollY - st.sy) > 0.5; st.sy = scrollY;
  // fastest on-screen movement of any visible mesh this frame, in CSS pixels (position + spin + size change)
  const pxPerUnit = o.H / (2 * Math.tan(THREE.MathUtils.degToRad(o.camera.fov) / 2));
  let speed = 0;
  o.scene.traverseVisible(m => {
    if (!m.isMesh || (o.skip && o.skip.has(m))) return;
    m.matrixWorld.decompose(V, Q, S);
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    const r = m.geometry.boundingSphere.radius * Math.max(S.x, S.y, S.z) / Math.max(0.1, V.distanceTo(o.camera.position)) * pxPerUnit;
    V.project(o.camera); const x = (V.x + 1) / 2 * o.W, y = (1 - V.y) / 2 * o.H;
    const p = st.last.get(m);
    if (p) speed = Math.max(speed, Math.hypot(x - p.x, y - p.y) + p.q.angleTo(Q) * r + Math.abs(r - p.r));
    if (p) { p.x = x; p.y = y; p.q.copy(Q); p.r = r; } else st.last.set(m, { x, y, q: Q.clone(), r });
  });
  let a = scrolled || speed > 2 ? 1 : Math.min(1, 0.1 + Math.max(0, speed - 0.1) * 0.5);
  if (o.drift) a = Math.max(a, 0.35);
  taa.alpha = a;
  if (a < 0.9) { const fw = o.W * o.dpr, fh = o.H * o.dpr; st.jit = (st.jit % 8) + 1; o.camera.setViewOffset(fw, fh, HAL(st.jit, 2) - 0.5, HAL(st.jit, 3) - 0.5, fw, fh); }
}
