// Shared WebGL helpers: generated environment, strand (light curtain) shader, lockup pieces.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export const BLUE = new THREE.Color('#1647DB');

// A generated studio: dark blue dome, white soft boxes and a ring of vertical blue light strands.
// Baked through PMREM so clearcoat and glass reflect and refract the same curtain the page shows.
export function makeEnvironment(renderer) {
  const s = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(30, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {},
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `varying vec3 vP; void main(){
        float h = vP.y*.5+.5;
        vec3 lo = vec3(.004,.010,.045), mid = vec3(.02,.07,.34), hi = vec3(.05,.12,.55);
        vec3 c = mix(lo, mid, smoothstep(.1,.65,h)); c = mix(c, hi, smoothstep(.7,1.,h)*.6);
        gl_FragColor = vec4(c,1.); }`
    })
  );
  s.add(dome);
  const box = (w, h, pos, color, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m); return m;
  };
  box(26, 7, [0, 17, 4], '#ffffff', 5);          // key light overhead
  box(5, 22, [-17, 2, 6], '#cfe0ff', 4.5);       // left strip
  box(4, 22, [18, 0, 3], '#8fb2ff', 5.5);        // right strip
  box(18, 3, [0, -14, 10], '#3b6bff', 3);        // floor kick, blue
  box(12, 6, [0, 3, -22], '#ffffff', 2.2);       // rim from behind
  box(34, 20, [-6, 3, 26], '#8fb0ff', 1.5);      // broad front panel so flat faces catch a gradient
  box(10, 24, [8, 0, 24], '#ffffff', 2.6);       // tall front strip, reads as a long highlight on the glass
  // vertical strands ring
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + 0.07;
    const r = 22;
    const h = 8 + 14 * Math.abs(Math.sin(i * 1.7));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 5 === 0 ? '#e6efff' : '#2f63ff').multiplyScalar(i % 5 === 0 ? 7 : 5), side: THREE.DoubleSide }));
    m.position.set(Math.cos(a) * r, (Math.sin(i * 3.1)) * 3, Math.sin(a) * r);
    m.lookAt(0, m.position.y, 0);
    s.add(m);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.012, 0.1, 80);
  pm.dispose();
  s.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt.texture;
}

// The light curtain: vertical blue strands, hanging from the top, brightest at their tips, lifted by the pointer.
export const CURTAIN_FRAG = /* glsl */`
uniform float uTime; uniform float uAspect; uniform vec2 uPtr; uniform float uSeed; uniform float uDensity; uniform float uFlip; uniform float uIntensity;
varying vec2 vUv;
float h11(float n){ return fract(sin(n*127.1+uSeed)*43758.5453); }
float vn(float x){ float i=floor(x), f=fract(x); f=f*f*(3.-2.*f); return mix(h11(i), h11(i+1.), f); }
vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
void main(){
  vec2 uv = vUv; if(uFlip>.5) uv.y = 1.-uv.y;
  float N = uDensity*uAspect;
  float x = uv.x*N;
  float id = floor(x);
  float fx = fract(x)-.5;
  float u = (id+.5)/N;
  float d = 1.-uv.y;                      // 0 at top, 1 at bottom
  // strand length: slow noise, a swell near the pointer
  float tip = .30 + .46*vn(id*.11+uTime*.12) + .14*vn(id*.9+3.7) ;
  float near = exp(-pow((u-uPtr.x)*3.2,2.));
  tip += near*.22*(1.-uPtr.y*.4);
  // wave of light travelling across
  float wave = .5+.5*sin(u*7.+uTime*.55+vn(id*.3)*2.);
  float below = tip-d;
  float body = below>0. ? exp(-below*5.5) : 0.;
  body *= smoothstep(0.,.02,below);
  float tipGlow = exp(-pow((d-tip)*26.,2.));
  float w = mix(.10,.16,vn(id*2.3));
  float core = smoothstep(w,0.,abs(fx));
  float halo = exp(-abs(fx)*7.)*.5;
  float I = core*(body*(.45+.55*wave)+tipGlow*1.5) + halo*(body*.35+tipGlow*.5);
  I += near*core*.25*body;
  // a soft bed of blue light under everything
  float bed = exp(-pow((d-.95)*3.,2.))*.35 + smoothstep(.0,.9,uv.y)*.04;
  vec3 deep = lin(vec3(.02,.05,.22)), mid = lin(vec3(.086,.28,.86)), hot = lin(vec3(.80,.88,1.));
  vec3 col = mix(deep, mid, clamp(I*1.2,0.,1.)); col = mix(col, hot, clamp(tipGlow*core*1.2+near*body*core*.4,0.,1.));
  vec3 base = lin(vec3(.004,.009,.04)) + deep*bed;
  // luminous haze behind the subject so glass has light to carry
  float hz = exp(-pow((uv.y-.60)*2.6,2.))*exp(-pow((uv.x-.5)*1.5,2.));
  float lift = 1.+1.4*exp(-pow((uv.y-.6)*3.2,2.));
  vec3 c = base + deep*hz*.6 + mid*hz*.12 + col*I*uIntensity*lift;
  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)))*43758.5453);
  c += (g-.5)*.012;
  gl_FragColor = vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function makeCurtainMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uAspect: { value: 1.6 }, uPtr: { value: new THREE.Vector2(.5, .5) },
      uSeed: { value: opts.seed || 0 }, uDensity: { value: opts.density || 34 }, uFlip: { value: 0 }, uIntensity: { value: opts.intensity || 1 }
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: CURTAIN_FRAG,
    depthWrite: false
  });
}

// Parses the lockup into six extruded pieces: shield, B, i, t, G, o.
export async function loadLockup(url, extrude = {}) {
  const text = await (await fetch(url)).text();
  const data = new SVGLoader().parse(text);
  const pieces = [];
  const names = ['o', 'G', 't', 'i', 'B', 'shield'];
  data.paths.forEach((p, i) => {
    const shapes = SVGLoader.createShapes(p);
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: extrude.depth ?? 30, curveSegments: 28,
      bevelEnabled: true, bevelThickness: extrude.bt ?? 9, bevelSize: extrude.bs ?? 6, bevelOffset: -(extrude.bs ?? 6), bevelSegments: 10
    });
    geo.computeBoundingBox();
    const c = new THREE.Vector3(); geo.boundingBox.getCenter(c);
    geo.translate(-c.x, -c.y, -c.z);
    pieces.push({ name: names[i] || 'p' + i, geo, center: c.clone(), size: geo.boundingBox.getSize(new THREE.Vector3()) });
  });
  return pieces;
}
