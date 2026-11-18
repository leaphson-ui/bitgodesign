import * as THREE from 'three';

const VERT = /* glsl */`
attribute vec2 aUv;
uniform float uShape, uTime, uPx, uTiltX, uTiltY;
varying float vK; varying float vD;
const float PI = 3.14159265;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec3 sPlane(vec2 uv){ vec2 p=(uv-.5)*7.4; float y=.28*sin(p.x*1.3+uTime*.8)+.22*sin(p.y*1.7-uTime*1.1); return vec3(p.x,y,p.y); }
vec3 sTorus(vec2 uv){ float a=uv.x*2.*PI, b=uv.y*2.*PI; float R=2.3, r=.9; return vec3((R+r*cos(b))*cos(a), r*sin(b), (R+r*cos(b))*sin(a)); }
vec3 sSphere(vec2 uv){ float a=uv.x*2.*PI, b=acos(1.-2.*uv.y); return 2.9*vec3(sin(b)*cos(a),cos(b),sin(b)*sin(a)); }
vec3 sCrystal(vec2 uv){ vec3 s=sSphere(uv)/2.9; float l=abs(s.x)+abs(s.y)+abs(s.z); return 3.5*s/l; }
vec3 sCity(vec2 uv){
  vec2 g=(uv-.5)*6.2; vec2 c=floor(g/.62); float hh=h21(c); float ht=-1.4+pow(hh,2.0)*4.2;
  vec2 f=fract(g/.62); float edge=min(min(f.x,1.-f.x),min(f.y,1.-f.y));
  float k=smoothstep(.0,.08,edge); float y=mix(-1.8, ht, k);
  return vec3(g.x, y, g.y);
}
vec3 shapeOf(int i, vec2 uv){
  if(i==0) return sPlane(uv); if(i==1) return sTorus(uv); if(i==2) return sSphere(uv); if(i==3) return sCrystal(uv); return sCity(uv);
}
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
void main(){
  int a=int(floor(uShape)); int b=min(a+1,4); float f=fract(uShape);
  vec3 p = mix(shapeOf(a,aUv), shapeOf(b,aUv), f);
  float dust = sin(f*PI);
  vec3 j = vec3(h21(aUv+1.3),h21(aUv+4.1),h21(aUv+7.7))-.5;
  p += j*dust*4.5;
  p = rotY(uTime*.18+uTiltY)*(rotX(uTiltX+.32)*p);
  vK = clamp(p.y*.2+.5,0.,1.);
  vec4 mv = modelViewMatrix*vec4(p,1.);
  vD = clamp(.5-mv.z*.02,0.,1.);
  gl_Position = projectionMatrix*mv;
  gl_PointSize = uPx*(1.6+1.4*h21(aUv*9.))*(14./(-mv.z));
}`;
const FRAG = /* glsl */`
varying float vK; varying float vD;
void main(){
  vec2 c=gl_PointCoord-.5; float d=length(c); if(d>.5) discard;
  float a=smoothstep(.5,.1,d);
  vec3 lo=vec3(.09,.28,.86), hi=vec3(.55,.92,1.);
  vec3 col=mix(lo,hi,vK*vK)*(.65+.8*vD);
  gl_FragColor=vec4(col, a*(.35+.5*vD));
}`;

export function initMatter(canvas, host) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true }); } catch (e) { return null; }
  renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(42, 1, .1, 100); cam.position.set(0, 0, 15);
  const N = 230, count = N * N;
  const uv = new Float32Array(count * 2), pos = new Float32Array(count * 3);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const k = i * N + j; uv[k * 2] = (i + .5) / N; uv[k * 2 + 1] = (j + .5) / N; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aUv', new THREE.BufferAttribute(uv, 2));
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uShape: { value: 0 }, uTime: { value: 0 }, uPx: { value: 1 }, uTiltX: { value: 0 }, uTiltY: { value: 0 } },
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let vis = false, shape = 0, target = 0, mx = 0, my = 0, w = 1, h = 1;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  const resize = () => {
    w = host.clientWidth; h = host.clientHeight; if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    mat.uniforms.uPx.value = dpr * Math.min(1, h / 900 + .3);
    pts.position.x = w / h > 1.2 ? 3.4 : 0;
  };
  resize();
  new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(host);
  const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  function frame(t) {
    requestAnimationFrame(frame);
    if (!vis) return;
    shape += (target - shape) * .12;
    mat.uniforms.uShape.value = Math.min(3.9999, Math.max(0, shape));
    mat.uniforms.uTime.value = reduced ? 0 : t / 1000;
    mat.uniforms.uTiltY.value += (mx * .6 - mat.uniforms.uTiltY.value) * .05;
    mat.uniforms.uTiltX.value += (my * .4 - mat.uniforms.uTiltX.value) * .05;
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
  return {
    set(x) { const idx = Math.min(4, Math.floor(x)); const u = x - idx; target = idx + (idx < 4 ? sm((u - .76) / .24) : 0); },
    resize,
  };
}
