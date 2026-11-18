import * as THREE from 'three';

/* One glowing point body for the whole page. Forms are built in forms.worker.js and swapped in
   as vertex attributes (A = form being left, B = form being entered). Morph time is long and calm. */
const N = 230 * 230, NF = 23;

const VERT = /* glsl */`
attribute vec4 aA; attribute vec4 aB; attribute vec2 aR;
uniform float uMix, uTime, uPx, uHand, uYaw, uTiltX, uTiltY, uScale;
uniform vec3 uOff;
varying float vK, vD, vW, vS;
vec3 hand(vec4 a){ vec3 p=a.xyz; if(a.w>.955){ float k=a.w>.98?12.:1.; float c=cos(-uHand*k), s=sin(-uHand*k); p.xy=vec2(c*p.x-s*p.y, s*p.x+c*p.y);} return p; }
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
void main(){
  float d=aR.x*.4; float e=clamp((uMix-d)/.6,0.,1.); e=e*e*(3.-2.*e);
  vec3 p=mix(hand(aA),hand(aB),e);
  float arc=sin(e*3.14159);
  vec3 j=vec3(aR.y-.5, fract(aR.y*7.13)-.5, fract(aR.y*13.7)-.5);
  p+=j*arc*1.0;
  float w=mix(aA.w,aB.w,e);
  p=rotY(uYaw+uTiltY)*(rotX(.22+uTiltX)*p);
  vK=clamp(p.y*.15+.5,0.,1.); vW=w;
  vS=.86+.14*sin(uTime*.7+aR.y*60.);
  p*=uScale; p+=uOff;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  vD=clamp(.5-mv.z*.02,0.,1.);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=uPx*(1.9+1.8*fract(aR.x*17.))*(14./(-mv.z))*sqrt(uScale);
}`;
const FRAG = /* glsl */`
uniform float uOp;
varying float vK, vD, vW, vS;
void main(){
  vec2 c=gl_PointCoord-.5; float d=length(c); if(d>.5) discard;
  float a=smoothstep(.5,.06,d);
  vec3 lo=vec3(.06,.22,.8), mid=vec3(.16,.5,1.), hi=vec3(.62,.93,1.);
  float t=clamp(vK*.5+vW*.7,0.,1.);
  vec3 col=t<.5?mix(lo,mid,t*2.):mix(mid,hi,(t-.5)*2.);
  col*=(.85+.6*vD)*vS;
  gl_FragColor=vec4(col, a*(.42+.5*vD)*uOp);
}`;

export function initMatter(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  renderer.setClearColor(0, 0);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  const FOV = 42, CZ = 15, HH = Math.tan(FOV * Math.PI / 360) * CZ;
  const cam = new THREE.PerspectiveCamera(FOV, 1, .1, 100); cam.position.set(0, 0, CZ);

  const aR = new Float32Array(N * 2); for (let i = 0; i < N; i++) { aR[i * 2] = Math.random(); aR[i * 2 + 1] = Math.random(); }
  // fallback body (a soft sphere) until the worker delivers a form
  const fb = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { const z = 1 - 2 * ((i + .5) / N), a = i * 2.39996, s = Math.sqrt(1 - z * z); fb[i * 4] = 2.6 * s * Math.cos(a); fb[i * 4 + 1] = 2.6 * z; fb[i * 4 + 2] = 2.6 * s * Math.sin(a); fb[i * 4 + 3] = .3; }
  const geo = new THREE.BufferGeometry();
  const attA = new THREE.BufferAttribute(new Float32Array(fb), 4), attB = new THREE.BufferAttribute(new Float32Array(fb), 4);
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('aA', attA); geo.setAttribute('aB', attB); geo.setAttribute('aR', new THREE.BufferAttribute(aR, 2));
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uMix: { value: 0 }, uTime: { value: 0 }, uPx: { value: 1 }, uHand: { value: 0 }, uYaw: { value: 0 }, uTiltX: { value: 0 }, uTiltY: { value: 0 }, uScale: { value: 1 }, uOff: { value: new THREE.Vector3() }, uOp: { value: 0 } },
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);

  /* forms from the worker */
  const forms = new Array(NF).fill(null);
  let from = 0, to = 0, want = 0, mix = 0, morphing = false;
  const load = (att, i) => { att.array.set(forms[i] || fb); att.needsUpdate = true; };
  try {
    const wk = new Worker('forms.worker.js');
    wk.onmessage = e => { forms[e.data.i] = e.data.p; if (!morphing && e.data.i === from) load(attA, from); if (morphing && e.data.i === to) load(attB, to); if (!morphing && e.data.i === to) load(attA, to); };
    wk.postMessage({ order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22] });
  } catch (e) { /* stays on fallback sphere */ }

  /* pose (damped) */
  const pose = { x: .5, y: 0, s: 1.2, o: 0, yaw: 0 }, tgt = { x: .5, y: 0, s: 1.2, o: 1, yaw: 0 };
  let w = 1, h = 1, aspect = 1, mx = 0, my = 0, scrollY = 0, t0 = performance.now(), last = t0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  const resize = () => {
    w = innerWidth; h = innerHeight; aspect = w / h;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); cam.aspect = aspect; cam.updateProjectionMatrix();
    mat.uniforms.uPx.value = dpr * Math.min(1, h / 900 + .35) * (w > 1900 ? 1.15 : 1);
  };
  resize();
  const damp = (k, dt) => 1 - Math.exp(-dt * k);
  let running = true;
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    if (!running) return;
    // morph: calm, one at a time, latest wish wins
    if (!morphing && want !== from) { to = want; load(attB, to); mix = 0; morphing = true; }
    if (morphing) {
      mix += dt / (reduced ? .5 : 1.8);
      if (mix >= 1) { mix = 0; from = to; load(attA, from); morphing = false; if (want !== from) { to = want; load(attB, to); morphing = true; } }
    }
    const u = mat.uniforms; u.uMix.value = morphing ? mix : 0;
    const k = reduced ? 8 : 2.1; const f = damp(k, dt);
    for (const key of ['x', 'y', 's', 'o', 'yaw']) pose[key] += (tgt[key] - pose[key]) * f;
    const hw = HH * aspect, narrow = aspect < .9;
    const fit = Math.min(1, (2 * hw) / 11.5) * (narrow ? 1.3 : 1);
    u.uScale.value = pose.s * fit * (HH / 5.76);
    u.uOff.value.set(pose.x * hw * .9, pose.y * HH, 0);
    u.uOp.value = pose.o;
    const ts = reduced ? 0 : (t - t0) / 1000;
    u.uTime.value = ts;
    u.uYaw.value = pose.yaw + (reduced ? 0 : Math.sin(ts * .21) * .3 + scrollY * .00022);
    u.uTiltY.value += (mx * .35 - u.uTiltY.value) * .04; u.uTiltX.value += (my * .22 - u.uTiltX.value) * .04;
    u.uHand.value = scrollY * .0032;
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
  return {
    set(st) { want = st.form; tgt.x = st.x; tgt.y = st.y; tgt.s = st.s; tgt.o = st.o; tgt.yaw = st.yaw || 0; },
    scroll(y) { scrollY = y; },
    resize,
    pause(v) { running = !v; },
  };
}
