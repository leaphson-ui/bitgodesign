/* An armillary globe: a frosted-glass sphere with the continents etched into it, held inside three thick chrome
   rings (an equator and two tilted meridians) like a navigator's instrument. Light pulses run along the rings.
   open 0..1: the rings tip outward and away from the sphere onto their own axes, and the pulses quicken.
   Land comes from data/land-110m.js (own canvas code, nothing shared with globe.js). */
import { THREE, mat, glow, lathe, inst, smoother, sm, lerp, disposeTree } from './_kit.js';
import { LAND } from './data/land-110m.js';

export const meta = {
  name: 'orbit-globe', title: 'Orbit globe',
  means: 'Custody and settlement across the world, held in one instrument',
  pages: ['Global Access', 'Go Network', 'Institutions'],
  states: { open: 'the rings tip outward onto their own axes, 0..1' }
};

/* land onto an equirectangular canvas; rings that cross the date line are unwrapped and drawn twice */
function landCanvas(W, fill, bg, stroke) {
  const H = W / 2, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const trace = () => {
    x.beginPath();
    for (const [, pts] of LAND) {
      const lon = [], lat = [];
      for (let i = 0; i < pts.length; i += 2) {
        let l = pts[i];
        if (lon.length) { const d = l - lon[lon.length - 1]; if (d > 180) l -= 360; else if (d < -180) l += 360; }
        lon.push(l); lat.push(pts[i + 1]);
      }
      const shifts = [0]; if (Math.max(...lon) > 180) shifts.push(-360); if (Math.min(...lon) < -180) shifts.push(360);
      for (const sh of shifts) { lon.forEach((l, i) => { const px = (l + sh + 180) / 360 * W, py = (90 - lat[i]) / 180 * H; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); }
    }
  };
  if (fill) { x.fillStyle = fill; trace(); x.fill('evenodd'); }
  if (stroke) { x.strokeStyle = stroke; x.lineWidth = W / 800; x.lineJoin = 'round'; trace(); x.stroke(); }
  return c;
}
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };

export function create(opts = {}) {
  const L = !!opts.light, hi = opts.quality !== 'low', W = hi ? 2048 : 1024;
  const object = new THREE.Group();
  const root = new THREE.Group(); root.scale.setScalar(0.96); root.rotation.z = -0.18; object.add(root);
  const chrome = mat.chrome({ roughness: 0.14 });

  /* sphere: frost with etched land (raised and lighter), coastlines glowing a little */
  const color = tex(landCanvas(W, '#ffffff', '#8aa8f5'));
  const bump = tex(landCanvas(W, '#ffffff', '#000000'), false);
  const edge = tex(landCanvas(W, null, '#000000', '#8fb0ff'));
  const sphereMat = mat.frost({ map: color, bumpMap: bump, bumpScale: 3, emissiveMap: edge, emissive: new THREE.Color(0x4d78ff), emissiveIntensity: L ? 0.5 : 1.1, thickness: 1.4, roughness: 0.55, iridescence: 0 });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.6, hi ? 96 : 48, hi ? 64 : 32), sphereMat);
  sphere.rotation.y = 4.2; root.add(sphere);
  // inner core of light gives the frost something to scatter
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), glow(L, { opacity: L ? 0.25 : 0.45 }));
  root.add(core);

  /* the axis: a chrome rod with caps, through the poles */
  const axis = new THREE.Group(); axis.rotation.z = 0.0; root.add(axis);
  axis.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 12), chrome));
  [1, -1].forEach(s => { const m = new THREE.Mesh(lathe([[0, 0], [0.055, 0, 0.02], [0.055, 0.06 * s, 0.02], [0.03, 0.1 * s, 0.02], [0, 0.1 * s]], 24), chrome); m.position.y = 0.68 * s; axis.add(m); });

  /* rings: a bevelled chrome band (lathe of a rounded rectangle) with a pulse bead running on it */
  const ringGeo = R => lathe([[R - 0.045, -0.04], [R + 0.045, -0.04, 0.02], [R + 0.045, 0.04, 0.02], [R - 0.045, 0.04, 0.02], [R - 0.045, -0.04]], hi ? 96 : 48, 2);
  const defs = [
    { R: 0.97, closed: [0, 0, 0], open: [0.7, 0, 0.35], ticks: 72, v: 0.22, ph: 0 },
    { R: 0.88, closed: [Math.PI / 2, 0.45, 0], open: [Math.PI / 2 - 0.55, 1.1, 0.4], ticks: 36, v: -0.19, ph: 1 },
    { R: 0.79, closed: [Math.PI / 2, 0.45 + Math.PI / 2, 0.0], open: [Math.PI / 2 + 0.5, 0.45 + Math.PI / 2 + 0.9, -0.5], ticks: 36, v: 0.25, ph: 2 }
  ];
  const beadGeo = new THREE.SphereGeometry(0.045, 14, 10), beadMat = glow(L), tailGeo = new THREE.SphereGeometry(0.02, 10, 6);
  const tickGeo = new THREE.BoxGeometry(0.012, 0.012, 0.03);
  const rings = defs.map(d => {
    const g = new THREE.Group(); root.add(g);
    const spin = new THREE.Group(); g.add(spin);
    spin.add(new THREE.Mesh(ringGeo(d.R), chrome));
    const tk = []; for (let i = 0; i < d.ticks; i++) { const a = i / d.ticks * Math.PI * 2; tk.push({ p: [Math.cos(a) * (d.R + 0.045), i % 6 ? 0 : 0, Math.sin(a) * (d.R + 0.045)], r: [0, -a, 0], s: [1, 1, i % 6 ? 0.5 : 1] }); }
    inst(tickGeo, mat.ink({ color: 0x0a1a66 }), tk, spin);
    const beads = [0, 1, 2].map(k => { const b = new THREE.Mesh(beadGeo, beadMat); g.add(b); const t1 = new THREE.Mesh(tailGeo, beadMat); g.add(t1); return { b, t1 }; });
    return { g, spin, d, beads };
  });

  const st = smoother(2.0);
  return {
    object,
    update(time, state = {}) {
      const s = st(time, state, { open: 0 }), e = sm(0, 1, s.open);
      sphere.rotation.y = 4.2 + time * 0.05;
      core.scale.setScalar(1 + Math.sin(time * 1.1) * 0.05);
      rings.forEach((r, i) => {
        const d = r.d;
        r.g.rotation.set(lerp(d.closed[0], d.open[0], e), lerp(d.closed[1], d.open[1], e) + Math.sin(time * 0.2 + i) * 0.03, lerp(d.closed[2], d.open[2], e), 'YXZ');
        r.g.scale.setScalar(1 + e * 0.12);
        r.spin.rotation.y = e * Math.sin(time * 0.15 + i * 2) * 0.5;
        const sp = d.v * (1 + e * 0.5);
        r.beads.forEach((p, k) => {
          const a = time * sp * Math.PI * 2 / 2 + k * 2.09 + d.ph;
          p.b.position.set(Math.cos(a) * (d.R + 0.05), 0, Math.sin(a) * (d.R + 0.05));
          const a2 = a - Math.sign(d.v) * 0.12; p.t1.position.set(Math.cos(a2) * (d.R + 0.05), 0, Math.sin(a2) * (d.R + 0.05));
          p.b.scale.setScalar(0.8 + 0.2 * Math.sin(time * 1.4 + k));
        });
      });
    },
    dispose() { color.dispose(); bump.dispose(); edge.dispose(); disposeTree(object); }
  };
}
