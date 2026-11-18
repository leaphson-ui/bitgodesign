import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const C = (h) => new THREE.Color(h);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- procedural glass facade ---------- */
const FACADE_V = `
attribute vec4 aP; attribute vec3 aTint;
varying vec3 vW; varying vec3 vN; varying vec4 vP; varying vec3 vT;
void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); vP=aP; vT=aTint; gl_Position=projectionMatrix*viewMatrix*w; }`;
const FACADE_F = `
precision highp float;
varying vec3 vW; varying vec3 vN; varying vec4 vP; varying vec3 vT;
uniform vec3 uSkyTop, uSkyHor, uSunCol, uSun, uFog, uWarm, uCool, uRoof, uDeep;
uniform float uFogD, uLit, uNight, uTime;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float n1(float x){ float i=floor(x); return mix(h21(vec2(i,1.7)),h21(vec2(i+1.,1.7)),smoothstep(0.,1.,fract(x))); }
vec3 sky(vec3 d){
  float y=clamp(d.y,-.1,1.);
  vec3 c=mix(uSkyHor,uSkyTop,pow(max(y,0.),.45));
  float sd=max(dot(d,uSun),0.);
  c+=uSunCol*(pow(sd,900.)*18.+pow(sd,40.)*.5+pow(sd,6.)*.12);
  return c;
}
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW);
  float dist=length(cameraPosition-vW);
  vec3 col;
  if(N.y>.5){ col=uRoof; }
  else {
    float hz=abs(N.x)>abs(N.z)? vW.z : vW.x;
    vec2 g=vec2(hz/vP.x, vW.y/vP.y);
    vec2 id=floor(g), f=fract(g);
    float seed=vP.z, type=vP.w;
    float hr=h21(id+seed);
    float gm;
    if(type<.5){ gm=step(.045,f.x)*step(f.x,.955)*step(.09,f.y)*step(f.y,.93); }
    else if(type<1.5){ gm=step(.2,f.x)*step(f.x,.8)*step(.2,f.y)*step(f.y,.8); }
    else { gm=step(.04,f.x)*step(f.x,.96)*step(.22,f.y)*step(f.y,.86); }
    // fade fine detail with distance so it does not alias
    float aa=smoothstep(.07,.3,max(fwidth(g.x),fwidth(g.y)));
    gm=mix(gm,.8,aa);
    vec3 R=reflect(-V,N);
    float nb=smoothstep(.45,.62,n1(R.x*4.+seed))*smoothstep(.5,-.15,R.y);
    vec3 refl=mix(sky(R),uSkyHor*.16+uDeep*.4,nb*.85);
    float fr=.2+.8*pow(1.-max(dot(N,V),0.),3.);
    float flo=h21(vec2(id.y*1.31,seed));
    vec3 glass=mix(uDeep*(.7+.6*hr*.4),refl,fr*.92)*(.78+.4*flo*.5+.25*hr);
    float on=mix(step(hr,uLit*(.55+.9*flo)),uLit*.8,aa);
    vec3 lc=mix(uWarm,uCool,step(.82,h21(id*3.1+seed)));
    float inner=smoothstep(0.,.3,f.y)*smoothstep(1.,.7,f.y)*smoothstep(0.,.25,f.x)*smoothstep(1.,.75,f.x);
    vec3 emis=lc*(.9+1.6*h21(id+7.7))*on*(.45+.55*inner)*(1.-aa*.4);
    glass=glass*(1.-on*.75)+emis*(uNight>.5?1.:.8);
    float sp=pow(max(dot(R,uSun),0.),24.);
    glass+=uSunCol*sp*.9*(1.-nb);
    vec3 solid=vT*(.75+.5*h21(id*5.3+seed))*(.55+.45*smoothstep(0.,60.,vW.y));
    solid+=uSkyHor*.05;
    col=mix(solid,glass,gm);
    // slab edge highlight
    col+=uSunCol*.05*smoothstep(.9,1.,f.y)*(1.-gm)*(1.-aa);
  }
  float fogF=1.-exp(-uFogD*uFogD*dist*dist);
  fogF=clamp(fogF+smoothstep(60.,0.,vW.y)*.18,0.,1.);
  col=mix(col,uFog,fogF);
  gl_FragColor=vec4(col,1.);
}`;

const SKY_F = `
precision highp float; varying vec3 vD;
uniform vec3 uTop, uHor, uSunCol, uSun; uniform float uNight, uTime;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*vn(p); p*=2.03; a*=.5;} return s; }
void main(){
  vec3 d=normalize(vD);
  float y=clamp(d.y,-.2,1.);
  vec3 c=mix(uHor,uTop,pow(max(y,0.),.5));
  vec2 cp=d.xz/(d.y+.35)*1.6+uTime*.004;
  float cl=smoothstep(.45,.85,fbm(cp))*smoothstep(-.05,.5,d.y);
  c=mix(c,mix(uHor,uSunCol,.35)*1.05,cl*(uNight>.5?.18:.42));
  float sd=max(dot(d,uSun),0.);
  c+=uSunCol*(pow(sd,900.)*18.+pow(sd,40.)*.5+pow(sd,6.)*.12);
  if(uNight>.5){ vec2 sp=floor(d.xz/(d.y+.2)*180.); float st=step(.9965,h21(sp)); c+=st*vec3(.8,.85,1.)*smoothstep(.1,.5,d.y)*(.4+.6*h21(sp+3.)); }
  gl_FragColor=vec4(c,1.);
}`;

const GROUND_F = `
precision highp float; varying vec3 vW;
uniform vec3 uFog, uWarm; uniform float uFogD, uTime, uPitch;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
void main(){
  vec2 p=vW.xz; float P=uPitch, st=12.;
  vec2 q=mod(p+P*.5,P)-P*.5; // distance-from-block-centre coords
  float roadX=step(P*.5-st*.5,abs(q.x)), roadZ=step(P*.5-st*.5,abs(q.y));
  float road=max(roadX,roadZ);
  vec3 col=vec3(.012,.015,.025)+road*vec3(.025,.027,.04);
  // moving lights along roads
  float lane=0., a=0.;
  if(roadX>.5 && roadZ<.5){ float id=floor((p.x+P*.5)/P); float s=p.y*.05+uTime*(.6+h21(vec2(id,1.))*.8)*(mod(id,2.)<1.?1.:-1.); float dsh=step(.82,fract(s)); float off=abs(fract((p.x+P*.5)/P*1.)-.5); lane=dsh*step(abs(q.x)-(P*.5-st*.5),2.2)*step(1.,abs(q.x)-(P*.5-st*.5))*1.2; }
  if(roadZ>.5 && roadX<.5){ float id=floor((p.y+P*.5)/P); float s=p.x*.05+uTime*(.6+h21(vec2(id,2.))*.8)*(mod(id,2.)<1.?1.:-1.); float dsh=step(.82,fract(s)); lane=dsh*step(abs(q.y)-(P*.5-st*.5),2.2)*step(1.,abs(q.y)-(P*.5-st*.5))*1.2; }
  col+=mix(uWarm,vec3(1.,.25,.2),step(.5,h21(floor(p*.3))))*lane*1.4;
  col+=uWarm*road*.05;
  float dist=length(cameraPosition-vW);
  float fogF=clamp(1.-exp(-uFogD*uFogD*dist*dist),0.,1.);
  gl_FragColor=vec4(mix(col,uFog,fogF),1.);
}`;

const GRAIN = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAmt: { value: .035 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: 'varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uTime,uAmt; uniform vec2 uRes; float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y);} void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float l=dot(c,vec3(.3,.59,.11)); float n=h(floor(vUv*uRes*.5)+fract(uTime)*91.)-.5; c+=n*uAmt*(.35+.65*l); gl_FragColor=vec4(c,1.); }'
};
let v_grain;
const GRADE = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: .05 }, uDuo: { value: 0 }, uVig: { value: .5 }, uRes: { value: new THREE.Vector2(1, 1) }, uLo: { value: C('#030b33') }, uMid: { value: C('#1647DB') }, uHi: { value: C('#dbe7ff') }, uMidAt: { value: .12 }, uHiAt: { value: 1.4 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `
varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uTime,uGrain,uDuo,uVig,uMidAt,uHiAt; uniform vec2 uRes; uniform vec3 uLo,uMid,uHi;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
void main(){
  vec2 c=vUv-.5; float ca=dot(c,c)*.012;
  vec3 col=vec3(texture2D(tDiffuse,vUv+c*ca).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-c*ca).b);
  float l=dot(col,vec3(.2126,.7152,.0722));
  vec3 duo=l<uMidAt? mix(uLo,uMid,smoothstep(0.,uMidAt,l)) : mix(uMid,uHi,smoothstep(uMidAt,uHiAt,l));
  col=mix(col,duo,uDuo);
  col*=1.-smoothstep(.35,1.05,length(c*vec2(1.,.85)))*uVig;
  gl_FragColor=vec4(max(col,0.),1.);
}`
};

/* ---------- city builders (merged geometry, one draw call) ---------- */
function box(list, cx, cz, w, d, y0, y1, p, tint) {
  const g = new THREE.BoxGeometry(w, y1 - y0, d); g.translate(cx, (y0 + y1) / 2, cz); g.deleteAttribute('uv');
  const n = g.attributes.position.count, a = new Float32Array(n * 4), t = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a.set(p, i * 4); t.set(tint, i * 3); }
  g.setAttribute('aP', new THREE.BufferAttribute(a, 4)); g.setAttribute('aTint', new THREE.BufferAttribute(t, 3));
  list.push(g);
}
function tower(list, r, cx, cz, w, d, H, tints) {
  const tint = tints[(r() * tints.length) | 0], t = () => (r() * 3) | 0;
  const wW = 2.2 + r() * 1.6, fH = 3.5 + r() * 1.0, s = r() * 80;
  const c = tint.map(v => v * (.8 + r() * .5));
  box(list, cx, cz, w, d, 0, H * .38, [wW, fH, s, t()], c);
  box(list, cx + (r() - .5) * 2, cz + (r() - .5) * 2, w * .82, d * .82, H * .38, H * .76, [wW * (.8 + r() * .5), fH, s + 5, t()], c);
  box(list, cx, cz, w * .6, d * .6, H * .76, H, [wW, fH, s + 9, 0], c);
  if (r() < .5) box(list, cx, cz, w * .08, d * .08, H, H + 14 + r() * 24, [8, 8, 1, 2], [.05, .06, .08]);
}

function makeFacadeMat(u) {
  return new THREE.ShaderMaterial({ vertexShader: FACADE_V, fragmentShader: FACADE_F, uniforms: u });
}

const SCENES = {
  hero(scene, camState) {
    const r = rng(7), list = [], tints = [[.05, .07, .13], [.08, .09, .14], [.04, .06, .1]];
    for (const side of [-1, 1]) {
      let z = 90;
      while (z > -420) {
        const w = 16 + r() * 10, d = 20 + r() * 12, H = 150 + r() * 170 + (side * z < 0 ? 0 : 0);
        const cx = side * (15 + w / 2 + r() * 4);
        tower(list, r, cx, z - d / 2, w, d, H, tints);
        z -= d + 2 + r() * 8;
      }
      // second row further out
      z = 40;
      while (z > -450) { const w = 22 + r() * 14, d = 26 + r() * 12, H = 100 + r() * 200; tower(list, r, side * (60 + r() * 30), z - d / 2, w, d, H, tints); z -= d + 6 + r() * 14; }
    }
    let z = -440; for (let i = 0; i < 9; i++) { const w = 30 + r() * 20, d = 30; tower(list, r, (i - 4) * 40 + (r() - .5) * 16, z - d, w, d, 160 + r() * 140, tints); }
    const u = {
      uSkyTop: { value: C('#08225f') }, uSkyHor: { value: C('#7fa6ff') }, uSunCol: { value: C('#ffe9c8') }, uSun: { value: new THREE.Vector3(-.32, .6, -.7).normalize() },
      uFog: { value: C('#5f86ee') }, uWarm: { value: C('#ffe2b8') }, uCool: { value: C('#bcd4ff') }, uRoof: { value: C('#070b1c') }, uDeep: { value: C('#0b1a46') },
      uFogD: { value: .0026 }, uLit: { value: .22 }, uNight: { value: 0 }, uTime: { value: 0 }
    };
    scene.add(new THREE.Mesh(mergeGeometries(list), makeFacadeMat(u)));
    sky(scene, u, 0);
    return { u, bloom: { s: .55, r: .7, t: .72 }, grade: { duo: 1, lo: '#02082b', mid: '#1647DB', hi: '#e2ecff', midAt: .1, hiAt: 1.3, grain: .045, vig: .5 }, cam(s, mx, my, t) {
      const pitch = (56 - 18 * s) * Math.PI / 180, yaw = (mx * 4 + Math.sin(t * .1) * 1.5) * Math.PI / 180;
      return { pos: [Math.sin(t * .07) * 2, 2 + s * 18, 74 - s * 70], pitch: pitch + my * .03, yaw, fov: 64 };
    } };
  },
  night(scene) {
    const r = rng(23), list = [], P = 42, tints = [[.04, .05, .08], [.06, .06, .09], [.05, .07, .1]];
    for (let i = -8; i <= 8; i++) for (let j = -22; j <= 2; j++) {
      const cx = i * P, cz = j * P, dc = Math.hypot(i * .9, (j + 9) * .55);
      const H = Math.max(14, (260 - dc * 26) * (.35 + r() * .75));
      if (r() < .05) continue;
      const w = 24 + r() * 8, d = 24 + r() * 8;
      if (H > 70) tower(list, r, cx, cz, w, d, H, tints);
      else { const wW = 2.4 + r() * 1.4; box(list, cx, cz, w, d, 0, H, [wW, 3.6 + r(), r() * 90, (r() * 3) | 0], tints[0]); }
    }
    const u = {
      uSkyTop: { value: C('#040818') }, uSkyHor: { value: C('#5a4565') }, uSunCol: { value: C('#cfe0ff') }, uSun: { value: new THREE.Vector3(.5, .22, -.8).normalize() },
      uFog: { value: C('#2c2a45') }, uWarm: { value: C('#ffbe73') }, uCool: { value: C('#8cc8ff') }, uRoof: { value: C('#04060f') }, uDeep: { value: C('#070c1c') },
      uFogD: { value: .00125 }, uLit: { value: .34 }, uNight: { value: 1 }, uTime: { value: 0 }
    };
    scene.add(new THREE.Mesh(mergeGeometries(list), makeFacadeMat(u)));
    const gm = new THREE.ShaderMaterial({ vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }', fragmentShader: GROUND_F, uniforms: { uFog: u.uFog, uWarm: u.uWarm, uFogD: u.uFogD, uTime: u.uTime, uPitch: { value: P } } });
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), gm); gp.position.set(P * .5, 0, -P * .5); scene.add(gp);
    sky(scene, u, 1);
    return { u, bloom: { s: .55, r: .6, t: .78 }, grade: { duo: 0, grain: .055, vig: .55 }, cam(s, mx, my, t) {
      return { pos: [110 + s * 30 + mx * 12, 250 - s * 40, 330 - s * 120], pitch: -(.3 + s * .05) + my * .02, yaw: (-12 + mx * 3) * Math.PI / 180 + Math.sin(t * .05) * .015, fov: 56 };
    } };
  }
};

function sky(scene, u, night) {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, vertexShader: 'varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.); }', fragmentShader: SKY_F, uniforms: { uTop: u.uSkyTop, uHor: u.uSkyHor, uSunCol: u.uSunCol, uSun: u.uSun, uNight: u.uNight, uTime: u.uTime } });
  const s = new THREE.Mesh(new THREE.SphereGeometry(1500, 24, 16), m); s.frustumCulled = false; s.renderOrder = -1; scene.add(s);
}

/* ---------- runtime ---------- */
const views = [];
const mouse = { x: 0, y: 0 };
addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; }, { passive: true });

function init(host) {
  const canvas = host.querySelector('canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false }); } catch (e) { canvas.style.display = 'none'; return; }
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  const scene = new THREE.Scene();
  const S = SCENES[host.dataset.scene](scene);
  const cam = new THREE.PerspectiveCamera(60, 1, 1, 3200);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), S.bloom.s, S.bloom.r, S.bloom.t); composer.addPass(bloom);
  const gp = new ShaderPass(GRADE); composer.addPass(gp);
  const g = S.grade, gu = gp.uniforms;
  gu.uDuo.value = g.duo || 0; gu.uGrain.value = g.grain; gu.uVig.value = g.vig;
  if (g.lo) { gu.uLo.value = C(g.lo); gu.uMid.value = C(g.mid); gu.uHi.value = C(g.hi); gu.uMidAt.value = g.midAt; gu.uHiAt.value = g.hiAt; }
  composer.addPass(new OutputPass()); const gr = new ShaderPass(GRAIN); composer.addPass(gr); v_grain = gr;
  const v = { grain: gr, host, canvas, renderer, scene, cam, composer, bloom, gp, S, vis: true, smx: 0, smy: 0 };
  const size = () => {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, w > 1800 ? 1 : 1.5);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); composer.setPixelRatio(dpr); composer.setSize(w, h);
    cam.aspect = w / h; cam.updateProjectionMatrix(); gu.uRes.value.set(w * dpr, h * dpr); gr.uniforms.uRes.value.set(w * dpr, h * dpr);
    bloom.resolution.set(w / 2, h / 2);
  };
  size(); new ResizeObserver(size).observe(host);
  new IntersectionObserver(es => es.forEach(e => v.vis = e.isIntersecting), { rootMargin: '100px' }).observe(host);
  views.push(v); renderView(v, 0);
}

function renderView(v, t) {
  const r = v.host.getBoundingClientRect(), vh = innerHeight;
  const s = v.host.dataset.scene === 'hero' ? clamp(-r.top / r.height, 0, 1) : clamp((vh - r.top) / (vh + r.height), 0, 1);
  v.smx += (mouse.x - v.smx) * .05; v.smy += (mouse.y - v.smy) * .05;
  const c = v.S.cam(s, v.smx, v.smy, reduce ? 0 : t);
  v.cam.fov = c.fov; v.cam.updateProjectionMatrix();
  v.cam.position.set(...c.pos); v.cam.rotation.order = 'YXZ'; v.cam.rotation.set(c.pitch, -c.yaw, 0);
  v.S.u.uTime.value = t; v.gp.uniforms.uTime.value = t; v.grain.uniforms.uTime.value = t;
  v.composer.render();
}

document.querySelectorAll('[data-scene]').forEach(init);
let last = 0;
function loop(now) {
  const t = now / 1000;
  if (!reduce && now - last > 30) { last = now; views.forEach(v => v.vis && renderView(v, t)); }
  requestAnimationFrame(loop);
}
if (!reduce) requestAnimationFrame(loop); else addEventListener('scroll', () => views.forEach(v => v.vis && renderView(v, 0)), { passive: true });
