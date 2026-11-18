import * as THREE from 'three';

const VERT = /* glsl */`
uniform float uZ;
varying vec3 vP; varying vec3 vV; varying float vH; varying float vM; varying vec2 vW;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float ridged(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ float n=1.-abs(noise(p)*2.-1.); n*=n; s+=a*n; p=mat2(1.6,1.2,-1.2,1.6)*p; a*=.5; } return s; }
void main(){
  vec2 w = vec2(position.x, position.z + uZ);
  float width = 16. + 9.*sin(w.y*.045);
  float m = smoothstep(2.2, width, abs(position.x));
  float r = ridged(vec2(position.x + 9.*sin(w.y*.04), w.y)*.075);
  float h = (r*r*15. + r*2.)*m;
  // faint terracing: strata
  float t = h*.55; h = mix(h, (floor(t)+smoothstep(.2,.8,fract(t)))/.55, .22);
  vec3 p = vec3(position.x, h, position.z);
  vP = p; vH = h; vM = m; vW = w;
  vec4 mv = modelViewMatrix*vec4(p,1.);
  vV = mv.xyz;
  gl_Position = projectionMatrix*mv;
}`;

const FRAG = /* glsl */`
uniform float uTime; uniform vec3 uSun; uniform vec3 uTint; uniform float uFog;
varying vec3 vP; varying vec3 vV; varying float vH; varying float vM; varying vec2 vW;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
void main(){
  vec3 n = normalize(cross(dFdx(vP), dFdy(vP)));
  vec3 L = normalize(uSun);
  float dif = max(dot(n,L),0.);
  float hn = clamp(vH/14.,0.,1.);
  vec3 low  = vec3(.015,.04,.2);
  vec3 mid  = vec3(.05,.17,.62);
  vec3 high = vec3(.72,.86,1.);
  vec3 base = mix(low, mid, smoothstep(.0,.35,hn));
  base = mix(base, high, smoothstep(.5,.95,hn));
  vec3 amb = mix(vec3(.04,.07,.3), vec3(.35,.5,1.), n.y*.5+.5);
  vec3 col = base*(amb*.65 + dif*vec3(.9,.8,1.)*1.1);
  // facet sheen
  col += pow(max(dot(reflect(normalize(vV),n),L),0.),12.)*vec3(.5,.7,1.)*.35;
  // contour lines of the ledger
  float k = vH*.9; float fw = fwidth(k)*1.4+1e-4;
  float ln = 1.-smoothstep(0.,fw*1.3,abs(fract(k-.5)-.5));
  col += vec3(.38,.85,1.)*ln*.55*smoothstep(.02,.15,vH);
  // valley stream of light
  float st = 1.-smoothstep(0.,.5,abs(vP.x));
  float pulse = .5+.5*sin(vW.y*.35 + uTime*2.2);
  col += vec3(.4,.9,1.)*st*(.35+.65*pulse)*(1.-smoothstep(.2,2.,vH));
  float d = length(vV);
  float f = 1.-exp(-pow(d*.012*uFog,1.5));
  vec3 fogc = vec3(.36,.5,.94)+uTint*.5;
  col = mix(col, fogc, f); col += uTint*.35*ln;
  float a = 1.-smoothstep(.5,.97,f);
  col += (hash(gl_FragCoord.xy+uTime)-.5)*.045;
  gl_FragColor = vec4(col, a);
}`;

const DEF = { mode: 'fly', y: 4.2, pitch: 7.5, fov: 55, z0: 0, speed: 1.4, scroll: .03, fog: 1, tint: [0, 0, 0], sun: [.2, .35, -1], look: 0, s: 0 };

/* One fixed canvas, many scissored views. Each registered element is a window onto the same terrain. */
export function initTerrain(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  renderer.setClearColor(0x000000, 0); renderer.autoClear = false;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(55, 1, .1, 400);
  const geo = new THREE.PlaneGeometry(220, 260, 130, 160); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -110);
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true,
    uniforms: { uZ: { value: 0 }, uTime: { value: 0 }, uFog: { value: 1 }, uSun: { value: new THREE.Vector3(.2, .35, -1) }, uTint: { value: new THREE.Vector3() } },
    extensions: { derivatives: true },
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; scene.add(mesh);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const views = [];
  let W = 0, H = 0;
  const resize = () => {
    W = innerWidth; H = innerHeight; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.setSize(W, H, false);
  };
  resize();
  const up = new THREE.Vector3(0, 1, 0), upPlan = new THREE.Vector3(0, 0, -1);
  function draw(v, t, sy) {
    const r = v.el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H || r.right < 0 || r.left > W || r.width < 4 || r.height < 4) return;
    const c = v.cfg; if (c.onFrame) c.onFrame(c, t, sy, r);
    v.ss += (c.s - v.ss) * .035;
    const ss = v.ss, time = reduced ? 0 : t / 1000;
    const x = Math.max(0, r.left), y = Math.max(0, r.top), x2 = Math.min(W, r.right), y2 = Math.min(H, r.bottom);
    renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
    renderer.setScissor(x, H - y2, x2 - x, y2 - y); renderer.setScissorTest(true);
    const u = mat.uniforms;
    u.uTime.value = time; u.uFog.value = c.fog;
    u.uZ.value = -(c.z0 + time * c.speed + sy * c.scroll + ss * 45);
    const k = Math.min(2, ss);
    u.uTint.value.set(c.tint[0] + (k < 1 ? -.1 * k : -.1 + (k - 1) * .35), c.tint[1] + (k < 1 ? .05 * k : .05 + (k - 1) * .1), c.tint[2] + (k < 1 ? .1 * k : .1 + (k - 1) * .1));
    u.uSun.value.set(c.sun[0] + Math.sin(ss * 1.6) * .9, c.sun[1] + ss * .15, c.sun[2]);
    const asp = r.width / r.height; cam.aspect = asp; cam.fov = asp < 1 ? c.fov + 15 : c.fov; cam.updateProjectionMatrix();
    if (c.mode === 'plan') {
      cam.up.copy(upPlan); cam.position.set(Math.sin(time * .1) * 2, c.y, -42); cam.lookAt(0, 0, -42 - Math.sin(time * .08) * 3);
    } else {
      cam.up.copy(up); const cy = c.y + ss * .9, pitch = (asp < 1 ? c.pitch + 1.5 : c.pitch) * Math.PI / 180;
      cam.position.set(0, cy, 0);
      cam.lookAt(Math.sin(time * .15) * 1.5 + c.look + (ss - 1) * 7 * (c.s > 0 ? 1 : 0), cy - 40 * Math.tan(pitch), -40);
    }
    renderer.render(scene, cam);
  }
  return {
    add(el, cfg) { for (const k in DEF) if (!(k in cfg)) cfg[k] = DEF[k]; const v = { el, cfg, ss: cfg.s }; views.push(v); return v; },
    frame(t, sy) {
      renderer.setScissorTest(false); renderer.clear();
      for (const v of views) draw(v, t, sy);
    },
    resize,
  };
}
