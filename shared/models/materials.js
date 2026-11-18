/* BitGo 3D model library: the shared look. Every model in shared/models/ builds from these, so the whole site
   reads as one world (the v3 Refokus homepage: glass BitGo shield over a blue metal light curtain).
   Nothing is fetched: environments are generated in code. */
import * as THREE from 'three';

export const BLUE = 0x1647db, BLUE_HI = 0x4d78ff, INK = 0x03071a, PAPER = 0xf4f7ff;

/* Generated studio environments. 'dark' = the homepage scene (blue and white strips on ink).
   'light' = pale studio with dark flags and blue cards, for white sections. */
export function makeEnv(renderer, mode = 'dark') {
  const env = new THREE.Scene();
  const panel = (w, h, col, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
  };
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  if (mode === 'light') {
    env.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc9d6f7).multiplyScalar(0.9), side: THREE.BackSide })));
    panel(30, 12, 0xffffff, 5, [0, 18, 6]); panel(8, 30, 0xffffff, 6, [-16, 2, 10]); panel(5, 30, 0xffffff, 7, [17, 0, 8]);
    [-62, -38, -14, 14, 38, 62].forEach((d, i) => { const a = THREE.MathUtils.degToRad(d); panel(1.4 + (i % 3) * .7, 40, i % 2 ? 0x06103a : BLUE, i % 2 ? 1 : 2.4, [Math.sin(a) * 20, 0, Math.cos(a) * 20]); });
    panel(40, 8, 0x0a1a66, 1.2, [0, -18, 6]);
  } else {
    env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ color: 0x02061a, side: THREE.BackSide })));
    for (let i = 0; i < 26; i++) {
      const az = THREE.MathUtils.degToRad(-84 + i * (168 / 25)), r = 22;
      const c = i % 5 === 0 ? 0xffffff : i % 3 === 0 ? 0x7fa8ff : 0x2f63ff;
      panel(0.35 + rnd() * 1.1, 50, c, 3 + rnd() * 9, [Math.sin(az) * r, 0, Math.cos(az) * r]);
    }
    for (let i = 0; i < 12; i++) { const az = THREE.MathUtils.degToRad(100 + i * 14); panel(0.6 + rnd(), 50, i % 2 ? 0xffffff : BLUE_HI, 4 + rnd() * 6, [Math.sin(az) * 22, 0, Math.cos(az) * 22]); }
    panel(34, 14, 0xc6d4ff, 1.8, [0, 22, 6]); panel(14, 30, BLUE, 3.2, [-26, 2, 4]); panel(10, 26, 0xe2e9ff, 2.4, [24, 0, 8]); panel(30, 6, BLUE, 2.2, [0, -20, 8]);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.03).texture;
  pm.dispose();
  return tex;
}

/* The renderer settings every page uses (ACES bends bright blue toward violet; keep Neutral). */
export function setupRenderer(renderer) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.9;
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = 1;
}

/* Material set. Each call returns a new material, so a model can animate its own emissive/opacity. */
export const mat = {
  /* the shield glass: clear, blue body colour, faint iridescent edge */
  glass: (o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({
    color: 0x9db8ff, metalness: 0, roughness: 0.05, transmission: 1, thickness: 1.2, ior: 1.52,
    attenuationColor: new THREE.Color(0x1238d8), attenuationDistance: 0.55, clearcoat: 1, clearcoatRoughness: 0.03,
    iridescence: 0.45, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 620], envMapIntensity: 1.8,
    emissive: new THREE.Color(0x2f63ff), emissiveIntensity: 0, specularIntensity: 1
  }, o)),
  /* frosted glass (cold, offline, at rest) */
  frost: (o = {}) => mat.glass(Object.assign({ roughness: 0.32, iridescence: 0.05, thickness: 1.6 }, o)),
  /* the curtain metal: deep BitGo blue, brushed */
  metal: (o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({
    color: 0x2c4cc4, metalness: 1, roughness: 0.3, envMapIntensity: 0.9, clearcoat: 0.4, clearcoatRoughness: 0.2,
    emissive: new THREE.Color(0.06, 0.22, 0.86), emissiveIntensity: 0.12
  }, o)),
  /* polished chrome with a blue cast, for small hardware (bolts, hinges, pins) */
  chrome: (o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({
    color: 0xe6ecff, metalness: 1, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4
  }, o)),
  /* dark lacquer / ink glass for bodies that should recede */
  ink: (o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({
    color: 0x0a1546, metalness: 0.6, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.1
  }, o)),
  /* light: unlit glowing lines, beams and pulses (additive) */
  light: (o = {}) => new THREE.MeshBasicMaterial(Object.assign({
    color: 0x8fb0ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
  }, o))
};

/* Fresnel halo: a back-faced shell that glows at the rim (atmospheres, auras). */
export function halo(radius, color = BLUE_HI, power = 3.2, strength = 1.2) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uP: { value: power }, uS: { value: strength } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uP; uniform float uS; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - abs(dot(vN, vV)), uP); gl_FragColor = vec4(uColor * f * uS, f); }',
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), m);
}

/* Glowing light that works on both grounds. Additive light vanishes on white, so on light sections
   it becomes a deep-blue normal-blended emitter. Pass the model's opts.light. */
export function glow(light = false, o = {}) {
  return light
    ? new THREE.MeshBasicMaterial(Object.assign({ color: 0x1647db, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }, o))
    : mat.light(o);
}
