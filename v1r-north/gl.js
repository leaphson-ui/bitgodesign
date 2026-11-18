import * as THREE from 'three';

const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const BLUE = 0x1647DB;

/* ---------- studio environment built in code (no HDR file) ---------- */
function makeEnvScene(blue = 1) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(60, 60, 60), new THREE.MeshBasicMaterial({ color: 0x010103, side: THREE.BackSide })));
  const panel = (w, h, pos, col, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(34, 3, [0, 18, 2], 0xffffff, 7);          // top strip
  panel(3, 30, [-20, 2, 4], BLUE, 14 * blue);             // blue tall left
  panel(1.1, 26, [19, 0, 8], 0xffffff, 12);        // thin white right
  panel(26, 7, [0, -12, 20], BLUE, 4 * blue);             // soft blue below front
  panel(2.2, 20, [-6, 4, -22], 0xb9ccff, 6);       // cool rim behind
  panel(16, 2, [10, 10, -16], 0xffffff, 5);
  panel(50, 40, [0, 0, -26], 0x2a4fe0, 0.3 * blue);  // faint blue back fill so the form reads
  panel(40, 14, [0, 14, 12], 0x9db4ff, 0.35);   // soft top-front sheet
  return s;
}
function makeEnv(renderer, blue = 1) {
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(makeEnvScene(blue), 0.015).texture;
  pm.dispose();
  return t;
}

/* ---------- final pass: spectral chromatic aberration, grain, tone ---------- */
const POST_FRAG = `
uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime; uniform float uCA; uniform float uGrain;
varying vec2 vUv;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec3 spectrum(float t){ // t 0..1 across the visible band
  return clamp(vec3(1.5-abs(t*4.0-3.0), 1.5-abs(t*4.0-2.0), 1.5-abs(t*4.0-1.0)),0.0,1.0);
}
void main(){
  vec2 c = vUv-0.5; float d2 = dot(c*vec2(uRes.x/uRes.y,1.0),c*vec2(uRes.x/uRes.y,1.0));
  vec3 acc=vec3(0.0), wsum=vec3(0.0);
  for(int i=0;i<9;i++){
    float t=float(i)/8.0;
    float k = (t-0.5)*uCA*(0.25+d2*3.2);
    vec3 w = spectrum(t);
    vec3 s = texture2D(tDiffuse, 0.5 + c*(1.0+k)).rgb;
    acc += s*w; wsum += w;
  }
  vec3 col = acc/wsum;
  col = col/(1.0+col*0.55); col = pow(col, vec3(1.0/2.2));
  col = mix(col, col*vec3(0.92,0.97,1.12)+vec3(0.0,0.004,0.016), 0.6);
  float v = smoothstep(1.15,0.2,length(c*vec2(1.1,1.0)*1.7));
  col *= mix(0.55,1.0,v);
  float g = hash(gl_FragCoord.xy + fract(uTime*0.7)*311.0)-0.5;
  col += g*uGrain*(0.4+0.6*(1.0-col.r));
  gl_FragColor = vec4(col,1.0);
}`;
const FS_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }`;
function fsTriangle() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  return g;
}

/* ---------- hero: fluted black-glass ribbon ---------- */
function buildRibbon({ len = 6, width = 4.6, ribs = 56, seg = 8, nu = 150, twist = 1.9, amp = 0.036, seed = 0 }) {
  const nv = ribs * seg;
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const C = (u) => new THREE.Vector3(u * len, 0.9 * Math.sin(u * 1.9 + seed), -1.2 * Math.cos(u * 1.3 + seed));
  const Y = new THREE.Vector3(0, 1, 0);
  let k = 0;
  for (let i = 0; i <= nu; i++) {
    const u = -1 + 2 * i / nu;
    const c = C(u);
    const t = C(u + 0.002).sub(C(u - 0.002)).normalize();
    const r = Y.clone().sub(t.clone().multiplyScalar(Y.dot(t))).normalize();
    const w2 = new THREE.Vector3().crossVectors(t, r);
    const phi = u * twist + seed;
    const W = r.multiplyScalar(Math.cos(phi)).add(w2.multiplyScalar(Math.sin(phi))).normalize();
    const N = new THREE.Vector3().crossVectors(t, W).normalize();
    for (let j = 0; j <= nv; j++) {
      const v = -1 + 2 * j / nv;
      const rr = j / seg, fr = rr - Math.floor(rr);
      const prof = Math.sqrt(Math.max(0, 1 - Math.pow(2 * fr - 1, 2)));
      const p = c.clone().addScaledVector(W, v * width * 0.5).addScaledVector(N, prof * amp);
      pos[k++] = p.x; pos[k++] = p.y; pos[k++] = p.z;
    }
  }
  const idx = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * (nv + 1) + j, b = a + 1, c2 = a + nv + 1, d = c2 + 1;
    idx.push(a, c2, b, b, c2, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function initHero(section, canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  scene.environment = makeEnv(renderer);
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x030406, metalness: 0.3, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.7, side: THREE.DoubleSide });
  const group = new THREE.Group(); scene.add(group);
  const a = new THREE.Mesh(buildRibbon({ ribs: 26, seg: 14, nu: 170, amp: 0.07, width: 5.2, len: 6.4 }), mat); group.add(a);
  const b = new THREE.Mesh(buildRibbon({ len: 5, width: 2.8, ribs: 16, seg: 14, nu: 120, twist: -2.3, seed: 2.1, amp: 0.06 }), mat);
  b.position.set(2.0, -1.9, -4.5); b.rotation.z = 0.35; group.add(b);

  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
  const post = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uCA: { value: 0.07 }, uGrain: { value: 0.09 } },
    vertexShader: FS_VERT, fragmentShader: POST_FRAG, depthTest: false, depthWrite: false
  });
  const quad = new THREE.Mesh(fsTriangle(), post); quad.frustumCulled = false;
  const pscene = new THREE.Scene(); pscene.add(quad);
  const pcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let W = 0, H = 0, portrait = false;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });
  function resize() {
    const r = section.getBoundingClientRect();
    W = Math.max(2, Math.round(r.width)); H = Math.max(2, Math.round(r.height));
    const d = DPR() * (W > 1800 ? 0.8 : 1);
    renderer.setPixelRatio(d); renderer.setSize(W, H, false);
    rt.setSize(Math.round(W * d), Math.round(H * d));
    post.uniforms.uRes.value.set(W * d, H * d);
    camera.aspect = W / H; portrait = camera.aspect < 0.9;
    camera.fov = portrait ? 52 : 36; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);
  return {
    visible: true, el: section,
    draw(t, scrollY, reduce) {
      const hh = H || 1;
      const p = clamp(scrollY / hh);
      mouse.sx += (mouse.x - mouse.sx) * 0.05; mouse.sy += (mouse.y - mouse.sy) * 0.05;
      const tt = reduce ? 0 : t;
      group.rotation.y = -0.45 + p * 1.15 + mouse.sx * 0.25 + tt * 0.045;
      group.rotation.x = 0.1 - p * 0.2 + mouse.sy * 0.1;
      group.rotation.z = -0.1 + p * 0.25;
      group.position.y = p * 1.6;
      group.position.x = portrait ? 0 : 0.3;
      camera.position.set(0, 0.2, (portrait ? 10.5 : 9.6) - p * 1.8);
      camera.lookAt(0, 0, 0);
      b.rotation.y = tt * 0.05;
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      post.uniforms.uTime.value = tt; post.uniforms.uCA.value = 0.07 + p * 0.1;
      renderer.render(pscene, pcam);
    }
  };
}

/* ---------- exploded stack of five plates ---------- */
function plateTexture(kind, w = 1024, h = 660) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
  const bar = (px, py, pw, ph, vertical) => {
    const g = vertical ? x.createLinearGradient(px, 0, px + pw, 0) : x.createLinearGradient(0, py, 0, py + ph);
    g.addColorStop(0, '#303030'); g.addColorStop(.5, '#f4f4f4'); g.addColorStop(1, '#303030');
    x.fillStyle = g; x.fillRect(px, py, pw, ph);
  };
  if (kind === 0) { // concentric vault rings
    for (let i = 0; i < 20; i++) { const m = 22 + i * 15; x.lineWidth = 7; x.strokeStyle = i % 2 ? '#e0e0e0' : '#3a3a3a'; x.beginPath(); x.roundRect(m, m * 0.66, w - 2 * m, h - 2 * m * 0.66, 40); x.stroke(); }
  } else if (kind === 1) { // fine vertical flutes
    for (let i = 0; i < 74; i++) bar(i * (w / 74), 0, w / 74 - 1, h, true);
  } else if (kind === 2) { // diamond knurl
    x.lineWidth = 6;
    for (let i = -h; i < w + h; i += 26) { x.strokeStyle = '#ececec'; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.strokeStyle = '#2c2c2c'; x.beginPath(); x.moveTo(i + h, 0); x.lineTo(i, h); x.stroke(); }
  } else if (kind === 3) { // hex lattice grooves
    x.lineWidth = 8; x.strokeStyle = '#2a2a2a'; const R = 40, hh = Math.sqrt(3) * R;
    for (let row = -1; row < h / hh + 1; row++) for (let col = -1; col < w / (R * 1.5) + 1; col++) {
      const cx = col * R * 1.5, cy = row * hh + (col % 2 ? hh / 2 : 0);
      x.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k; x.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); } x.closePath(); x.stroke();
    }
  } else { // horizontal flutes on the top plate
    for (let i = 0; i < 46; i++) bar(0, i * (h / 46), w, h / 46 - 1, false);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
function roundedShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}

export function initStack(section, canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  scene.environment = makeEnv(renderer, 0.35);
  const PW = 5.2, PH = 3.4;
  const geo = new THREE.ExtrudeGeometry(roundedShape(PW, PH, 0.3), { depth: 0.2, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 14 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, 0, 0);
  const plates = [];
  const root = new THREE.Group(); scene.add(root);
  for (let i = 0; i < 5; i++) {
    const tex = plateTexture(i);
    tex.repeat.set(1 / PW, 1 / PH); tex.offset.set(0.5, 0.5);
    // extruded UVs sit in shape units; after rotateX the face keeps its (x,y) uv
    const top = i === 4;
    const m = new THREE.MeshPhysicalMaterial({
      color: top ? BLUE : 0x050608, metalness: top ? 0.1 : 0.35, roughness: top ? 0.22 : 0.28,
      clearcoat: 1, clearcoatRoughness: 0.12, bumpMap: tex, bumpScale: top ? 2.2 : 3.2, envMapIntensity: top ? 1.2 : 1.6,
      emissive: BLUE, emissiveIntensity: 0
    });
    const mesh = new THREE.Mesh(geo, m); root.add(mesh);
    plates.push({ mesh, m, y: 0, x: 0, e: 0 });
  }
  const state = { active: 0, explode: 0.4 };
  let W = 1, H = 1;
  function resize() {
    const r = canvas.getBoundingClientRect(); W = Math.max(2, r.width); H = Math.max(2, r.height);
    renderer.setPixelRatio(DPR()); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.fov = camera.aspect < 0.9 ? 38 : 30; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);
  return {
    visible: false, el: canvas, state,
    setActive(i) { state.active = i; },
    draw(t, _s, reduce, _sp, dt = 0.016) {
      const tt = reduce ? 0 : t; const k = 1 - Math.exp(-dt * 6);
      const gap = 0.55 + state.explode * 0.9;
      root.rotation.y = -0.62 + Math.sin(tt * 0.2) * 0.06;
      camera.position.set(0, 7.2, 15.2); camera.lookAt(0, 1.2 + gap * 1.5, 0);
      if (camera.aspect < 0.9) camera.position.multiplyScalar(1.1);
      plates.forEach((p, i) => {
        const on = i === state.active;
        const ty = i * gap + (on ? 0.35 : 0) + Math.sin(tt * 0.7 + i) * 0.04;
        const tx = on ? 0.55 : 0;
        p.y += (ty - p.y) * k; p.x += (tx - p.x) * k;
        p.e += ((on ? 1 : 0) - p.e) * k;
        p.mesh.position.set(p.x, p.y, 0);
        p.m.emissiveIntensity = i === 4 ? 0.0 + p.e * 0.12 : p.e * 0.55;
      });
      renderer.render(scene, camera);
    }
  };
}

/* ---------- layer renders: raymarched glass forms on a pale floor ---------- */
const LAYER_FRAG = `
uniform vec2 uRes; uniform float uTime; uniform float uMode; uniform float uScroll;
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
float sdRB(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b+r; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-r; }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h)-r; }
float smin(float a,float b,float k){ float h=max(k-abs(a-b),0.0)/k; return min(a,b)-h*h*k*0.25; }
vec2 mapS(vec3 p){
  float t = uTime*0.12 + uScroll*1.4;
  vec2 res = vec2(1e5,0.0);
  if(uMode<0.5){
    p.x += 0.2;
    for(int i=0;i<7;i++){
      float fi=float(i)-3.0;
      vec3 q=p; q.xz *= rot(fi*0.34 + sin(t*1.3)*0.16 - 0.15);
      q.x -= 0.95; q.y -= 0.05*fi*fi*0.2;
      float d = sdRB(q, vec3(0.95,0.74,0.035), 0.03);
      if(d<res.x) res = vec2(d, i==3?1.0:0.0);
    }
  } else if(uMode<1.5){
    p.xz *= rot(-0.5 + sin(t)*0.15);
    for(int r=0;r<2;r++){
      for(int i=0;i<7;i++){
        float fi=float(i);
        float h = 0.3 + fi*0.27 + 0.06*sin(t*3.0+fi+float(r)*2.0) - float(r)*0.2;
        vec3 q = p - vec3(-1.95+fi*0.66, -1.0+h*0.5, float(r)*0.85-0.4);
        float d = sdRB(q, vec3(0.25,h*0.5,0.25), 0.09);
        if(d<res.x) res = vec2(d, (i==6&&r==0)?1.0:0.0);
      }
    }
  } else {
    p.xz *= rot(t*0.9);
    vec3 n0=vec3(-1.9,-0.2,0.3), n1=vec3(-0.6,0.6,-0.5), n2=vec3(0.5,-0.35,0.45), n3=vec3(1.8,0.45,-0.25), n4=vec3(0.05,0.1,-1.3);
    float d = length(p-n0)-0.42;
    float s1 = length(p-n1)-0.3, s2 = length(p-n2)-0.55, s3 = length(p-n3)-0.34, s4 = length(p-n4)-0.24;
    float tubes = min(min(sdCap(p,n0,n1,0.06), sdCap(p,n1,n2,0.06)), min(min(sdCap(p,n2,n3,0.06), sdCap(p,n1,n4,0.06)), sdCap(p,n4,n2,0.06)));
    float body = min(min(d,s1),min(s3,s4));
    body = smin(body, tubes, 0.1);
    res = vec2(body,0.0);
    if(s2<res.x) res = vec2(s2,1.0);
  }
  return res;
}
vec3 envM(vec3 r){
  vec3 c = vec3(0.02,0.024,0.04);
  c += vec3(0.9,0.95,1.0)*2.4*smoothstep(0.35,0.95,r.y);
  c += vec3(0.1,0.3,1.0)*5.0*pow(max(dot(r,normalize(vec3(-0.9,0.2,0.55))),0.0),18.0);
  c += vec3(1.0)*5.0*pow(max(dot(r,normalize(vec3(0.85,0.12,0.5))),0.0),180.0);
  c += vec3(0.5,0.55,0.62)*0.85*smoothstep(0.05,-0.55,r.y);
  return c;
}
vec3 calcN(vec3 p){
  vec2 e=vec2(1.0,-1.0)*0.0015;
  return normalize(e.xyy*mapS(p+e.xyy).x + e.yyx*mapS(p+e.yyx).x + e.yxy*mapS(p+e.yxy).x + e.xxx*mapS(p+e.xxx).x);
}
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes)/uRes.y;
  vec2 q = gl_FragCoord.xy/uRes;
  vec3 bg = vec3(0.894,0.902,0.918);
  float gy = -1.12;
  float ox = uMode<0.5 ? -0.55 : (uMode<1.5 ? 0.45 : 0.0);
  vec3 ro = vec3(ox*0.9, 1.05, 4.9);
  vec3 rd = normalize(vec3(uv.x - ox*0.35, uv.y+0.02, -1.45));
  rd.yz = rot(0.21) * rd.yz;
  vec3 L = normalize(vec3(-0.5,0.9,0.5));
  float tm = 0.0, hit=-1.0; vec2 m=vec2(0.0);
  for(int i=0;i<56;i++){
    vec3 p=ro+rd*tm; m=mapS(p);
    if(m.x<0.0015){ hit=1.0; break; }
    tm += m.x*0.9; if(tm>16.0) break;
  }
  vec3 col = bg;
  // floor
  float tg = rd.y<-0.0001 ? (gy-ro.y)/rd.y : 1e5;
  if(hit<0.0 || tg<tm){
    if(tg<40.0){
      vec3 gp = ro+rd*tg; float sh=1.0, tt=0.04;
      for(int i=0;i<16;i++){ float h=mapS(gp+L*tt).x; sh=min(sh,7.0*h/tt); tt+=clamp(h,0.04,0.5); if(sh<0.0||tt>6.0) break; }
      sh=clamp(sh,0.0,1.0);
      float amb = 1.0; // contact darkness
      float dd = mapS(gp+vec3(0.0,0.5,0.0)).x; amb = clamp(dd*0.9,0.0,1.0);
      float fall = smoothstep(7.0,1.0,length(gp.xz-vec2(ox*0.4,0.0)));
      col = bg*(1.0-fall*(0.42*(1.0-sh)+0.3*(1.0-amb)));
    }
    hit=-1.0;
  } else {
    vec3 p=ro+rd*tm; vec3 n=calcN(p);
    float ndv = clamp(dot(n,-rd),0.0,1.0);
    float F = 0.05+0.95*pow(1.0-ndv,4.0);
    vec3 refl = envM(reflect(rd,n));
    if(m.y<0.5){
      col = vec3(0.012,0.014,0.024) + refl*(0.32+F*1.25);
    } else {
      float df = max(dot(n,L),0.0);
      col = vec3(0.07,0.24,0.93)*(0.3+0.9*df) + refl*(0.16+F*0.9) + vec3(0.05,0.12,0.4)*pow(1.0-ndv,2.0);
    }
    col = 1.0-exp(-col*1.25);
    col = pow(col, vec3(0.92));
  }
  float edge = smoothstep(0.0,0.05,q.x)*smoothstep(1.0,0.95,q.x)*smoothstep(0.0,0.08,q.y)*smoothstep(1.0,0.92,q.y);
  col = mix(bg, col, edge);
  float g = hash(gl_FragCoord.xy + fract(uTime)*97.0)-0.5;
  col += g*0.05*edge;
  gl_FragColor = vec4(col,1.0);
}`;

/* ---------- established band: slow blue silk ---------- */
const SILK_FRAG = `
uniform vec2 uRes; uniform float uTime; uniform float uScroll;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+vec2(7.1,3.7); a*=0.5; } return s; }
void main(){
  vec2 uv = gl_FragCoord.xy/uRes; vec2 p = (gl_FragCoord.xy-0.5*uRes)/uRes.y;
  float t = uTime*0.04 + uScroll*0.6;
  vec2 q = p*1.1 + vec2(0.0, t);
  q += 0.9*vec2(fbm(q*1.1+vec2(t,0.0)), fbm(q.yx*1.1-vec2(0.0,t)));
  float h = fbm(q*1.4+3.0);
  float bands = sin(h*17.0 + p.x*1.8 + p.y*1.2)*0.5+0.5;
  float sheen = pow(bands, 5.0);
  vec3 deep = vec3(0.02,0.08,0.36), mid = vec3(0.086,0.278,0.859), hi = vec3(0.45,0.62,1.0);
  vec3 col = mix(deep, mid, smoothstep(0.25,0.7,h));
  col = mix(col, hi, sheen*0.5*smoothstep(0.3,0.8,h));
  col += vec3(0.5,0.65,1.0)*pow(bands,18.0)*0.9*smoothstep(0.3,0.7,h);
  col *= 0.75+0.25*smoothstep(0.2,0.6,h);
  col *= 0.8 + 0.35*smoothstep(1.2,0.0,length(p-vec2(0.4,0.15)));
  float g = hash(gl_FragCoord.xy + fract(uTime)*91.0)-0.5;
  col += g*0.07;
  gl_FragColor = vec4(col,1.0);
}`;

function shaderCanvas(canvas, frag, extra = {}, fixedDpr) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
  const mat = new THREE.ShaderMaterial({
    uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uScroll: { value: 0 }, uMode: { value: extra.mode || 0 } },
    vertexShader: FS_VERT, fragmentShader: frag, depthTest: false
  });
  const quad = new THREE.Mesh(fsTriangle(), mat); quad.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  function resize() {
    const r = canvas.getBoundingClientRect(); const w = Math.max(2, r.width), h = Math.max(2, r.height);
    const d = fixedDpr || Math.min(DPR(), 1.5) * (extra.scale || 1);
    renderer.setPixelRatio(d); renderer.setSize(w, h, false); mat.uniforms.uRes.value.set(w * d, h * d);
  }
  resize(); window.addEventListener('resize', resize);
  return {
    visible: false, el: canvas,
    draw(t, _s, reduce, scrollP) {
      mat.uniforms.uTime.value = reduce ? 0 : t; mat.uniforms.uScroll.value = scrollP || 0;
      renderer.render(scene, cam);
    }
  };
}
export const initLayer = (canvas, mode) => shaderCanvas(canvas, LAYER_FRAG, { mode, scale: 0.65 });
export const initSilk = (canvas) => shaderCanvas(canvas, SILK_FRAG, { scale: 0.6 });
