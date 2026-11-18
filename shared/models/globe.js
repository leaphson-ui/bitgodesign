/* Globe: BitGo custody across the five regions it serves (North America, Europe, Middle East, North Africa, APAC),
   joined by live arcs. A glossy ink ocean that carries the studio reflections, raised blue-metal continents with
   glowing coastlines (Natural Earth 1:110m, baked in data/land-110m.js), an atmosphere rim, light beams on the
   five regions and arcs whose pulses travel between them. State `open` (0..1) draws the arcs in. */
import * as THREE from 'three';
import { mat, halo, BLUE_HI } from './materials.js';
import { LAND } from './data/land-110m.js';

export const meta = {
  name: 'globe',
  title: 'Globe',
  means: 'Custody that meets regional requirements in North America, Europe, the Middle East, North Africa and APAC',
  pages: ['Qualified Custody: Global Access', 'Entities', 'Licenses', 'Singapore / UAE / Korea'],
  states: { open: 'arcs between the regions draw in, 0..1' }
};

/* the five regions, as cities BitGo serves them from (lat, lon) */
const REGIONS = [[40.71, -74.0], [50.11, 8.68], [25.2, 55.27], [30.04, 31.24], [1.35, 103.82]];
const LINKS = [[0, 1], [1, 3], [3, 2], [1, 2], [2, 4]];
const toVec = (lat, lon, r = 1) => {
  const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
  // matches three's SphereGeometry UVs with an equirectangular map whose left edge is lon -180
  return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
};

/* land drawn once into equirectangular canvases: mask (cut-out), soft height (bevel) and coastline glow */
function landMaps(W) {
  const H = W / 2;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  // rings that cross the date line (Fiji, Chukotka) are unwrapped so they stay continuous, then drawn a second
  // time one map-width over, so nothing draws a line across the whole map
  const path = ctx => {
    ctx.beginPath();
    for (const [, pts] of LAND) {
      const lon = [], lat = [];
      for (let i = 0; i < pts.length; i += 2) {
        let L = pts[i];
        if (lon.length) { const d = L - lon[lon.length - 1]; if (d > 180) L -= 360; else if (d < -180) L += 360; }
        lon.push(L); lat.push(pts[i + 1]);
      }
      const shifts = [0];
      if (Math.max(...lon) > 180) shifts.push(-360);
      if (Math.min(...lon) < -180) shifts.push(360);
      for (const sh of shifts) {
        lon.forEach((L, i) => { const x = (L + sh + 180) / 360 * W, y = (90 - lat[i]) / 180 * H; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.closePath();
      }
    }
  };
  const mask = mk(), mc = mask.getContext('2d');
  mc.fillStyle = '#000'; mc.fillRect(0, 0, W, H); mc.fillStyle = '#fff'; path(mc); mc.fill('evenodd');
  const bump = mk(), bc = bump.getContext('2d');
  bc.fillStyle = '#000'; bc.fillRect(0, 0, W, H); bc.filter = `blur(${Math.round(W / 700)}px)`; bc.drawImage(mask, 0, 0);
  const edge = mk(), ec = edge.getContext('2d');
  ec.fillStyle = '#000'; ec.fillRect(0, 0, W, H);
  ec.strokeStyle = '#7fa0ff'; ec.lineWidth = W / 900; ec.lineJoin = 'round'; path(ec); ec.stroke();
  ec.globalCompositeOperation = 'lighter'; ec.filter = `blur(${Math.round(W / 500)}px)`; ec.drawImage(edge, 0, 0);
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };
  return { mask: tex(mask), bump: tex(bump), edge: tex(edge, true) };
}

/* an arc between two points on the globe, lifted by its length, with a travelling light pulse */
function arc(a, b, color, offset) {
  const va = toVec(...a), vb = toVec(...b), ang = va.angleTo(vb), lift = 0.06 + ang * 0.16, pts = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64, v = new THREE.Vector3().copy(va).lerp(vb, t).normalize();
    pts.push(v.multiplyScalar(1.012 + Math.sin(Math.PI * t) * lift));
  }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.0062, 8, false);
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uGrow: { value: 1 }, uC: { value: new THREE.Color(color) }, uO: { value: offset } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform float uT; uniform float uGrow; uniform vec3 uC; uniform float uO; varying vec2 vUv;
      void main(){
        if (vUv.x > uGrow) discard;
        float p = fract(vUv.x - uT * .16 - uO);
        float pulse = smoothstep(0., .05, p) * (1. - smoothstep(.05, .2, p));
        float tip = smoothstep(uGrow - .04, uGrow, vUv.x) * step(uGrow, .999);
        float a = .38 + pulse * 1.4 + tip;
        gl_FragColor = vec4(uC * a, a);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
  return new THREE.Mesh(geo, m);
}

export function create(opts = {}) {
  const light = !!opts.light, W = opts.quality === 'low' ? 2048 : 4096;
  const object = new THREE.Group();
  const globe = new THREE.Group(); globe.rotation.z = THREE.MathUtils.degToRad(-14); object.add(globe);
  const spin = new THREE.Group(); globe.add(spin);
  const maps = landMaps(W);
  const seg = opts.quality === 'low' ? [128, 64] : [192, 128];

  const ocean = new THREE.Mesh(new THREE.SphereGeometry(1, ...seg), new THREE.MeshPhysicalMaterial(light
    ? { color: 0xdfe7fb, metalness: 0.1, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1 }
    : { color: 0x050e36, metalness: 0.3, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.85 }));
  spin.add(ocean);
  const landMat = mat.metal({
    alphaMap: maps.mask, alphaTest: 0.5, bumpMap: maps.bump, bumpScale: 4,
    emissiveMap: maps.edge, emissive: new THREE.Color(light ? 0x1647db : 0x3f6bff), emissiveIntensity: light ? 0.35 : 1.1,
    roughness: 0.34, envMapIntensity: 1.15, side: THREE.FrontSide
  });
  const land = new THREE.Mesh(new THREE.SphereGeometry(1.012, ...seg), landMat);
  spin.add(land);
  const rim = halo(1.16, light ? 0x1647db : BLUE_HI, light ? 4.5 : 3.2, light ? 0.55 : 1.15);
  globe.add(rim);

  /* the five regions: a dot, a beam standing off the surface, a ring that pulses outward */
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(0x9bb6ff) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uC; varying vec2 vUv; void main(){ float a = pow(1. - vUv.y, 1.6) * .85; gl_FragColor = vec4(uC * a, a); }',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const marks = REGIONS.map(([lat, lon], i) => {
    const g = new THREE.Group(), n = toVec(lat, lon).normalize();
    g.position.copy(n).multiplyScalar(1.014); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.013, 0.26, 16, 1, true), beamMat); beam.position.y = 0.13; g.add(beam);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 20, 12), mat.light({ color: 0xffffff, opacity: 1 })); g.add(dot);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.028, 48), mat.light({ color: 0x9bb6ff, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; g.add(ring);
    spin.add(g);
    return { ring, phase: i * 0.37 };
  });
  const arcs = LINKS.map(([a, b], i) => { const m = arc(REGIONS[a], REGIONS[b], light ? 0x2f63ff : 0xb8ccff, i * 0.21); spin.add(m); return m; });

  object.scale.setScalar(1 / 1.17);
  const FACE = -1.83;      // the Atlantic, Europe, Africa and the Middle East face the camera
  spin.rotation.y = FACE;

  return {
    object,
    update(time, state = {}) {
      const open = state.open ?? 1;
      spin.rotation.y = FACE + Math.sin(time * 0.06) * 0.55;   // a slow sway that keeps the five regions in view
      arcs.forEach((m, i) => { m.material.uniforms.uT.value = time; m.material.uniforms.uGrow.value = Math.min(1, Math.max(0, open * 1.35 - i * 0.07)); });
      marks.forEach(mk => {
        const p = (time * 0.33 + mk.phase) % 1;
        mk.ring.scale.setScalar(1 + p * 2.6); mk.ring.material.opacity = (1 - p) * 0.8 * Math.min(1, open * 2);
      });
    },
    dispose() {
      object.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      Object.values(maps).forEach(t => t.dispose());
    }
  };
}
