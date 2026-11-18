/* "Calm down the blue, it's too vibrant or shiny": presets for the curtain, shared by every page.
   Vibrant comes from the curtain's own blue glow (emissive) and the saturated metal tint; shiny comes from the smooth,
   fully reflective metal (sharp streaks) and the bloom halo around them. Each preset turns down only those.
   Preview on any page with ?calm=1, 2 or 3. 0 = the current curtain. */
import * as THREE from 'three';

const P = {   // measured on Self-Custody: saturation and streak contrast both drop as the number rises
  1: { color: 0x4a5a9a, emissive: [0.10, 0.16, 0.42], roughness: 0.55, normal: 0.8 },
  2: { color: 0x55618f, emissive: [0.11, 0.15, 0.34], roughness: 0.50, normal: 0.85 },
  3: { color: 0x5a6488, emissive: [0.12, 0.15, 0.30], roughness: 0.60, normal: 0.7 }
};
/* colour directions on top of a preset (?calm=3&hue=royal): same calm finish, different blue */
const HUES = {
  royal:  { color: 0x4d62a0, emissive: [0.10, 0.17, 0.40] },   // closer to BitGo blue
  indigo: { color: 0x5f5f8f, emissive: [0.15, 0.14, 0.32] },   // toward violet
  steel:  { color: 0x58708a, emissive: [0.11, 0.18, 0.28] },   // cooler, a touch of cyan
  navy:   { color: 0x4a5274, emissive: [0.08, 0.10, 0.22] }    // deeper and darker
};
const hq = new URLSearchParams(location.search).get('hue');
const q = +(new URLSearchParams(location.search).get('calm') || 0);
export const CALM = P[q] ? q : 0;

export function calmCurtain(mat, bloom, scene) {
  const p = P[CALM]; if (!p) return;
  mat.color = new THREE.Color(p.color);
  mat.emissive = new THREE.Color(...p.emissive);
  mat.roughness = p.roughness;
  mat.normalScale.set(p.normal, p.normal);
  const h = HUES[hq]; if (h) { mat.color = new THREE.Color(h.color); mat.emissive = new THREE.Color(...h.emissive); }
}

/* every saved version, for the design system's Background versions section */
export const VERSIONS = [
  { slug: 'current', name: 'Current', q: '' },
  { slug: 'calm-1', name: 'Calm 1', q: '?calm=1' },
  { slug: 'calm-2', name: 'Calm 2', q: '?calm=2' },
  { slug: 'calm-3', name: 'Calm 3', q: '?calm=3' },
  { slug: 'calm-3-royal', name: 'Calm 3, royal', q: '?calm=3&hue=royal' },
  { slug: 'calm-3-indigo', name: 'Calm 3, indigo', q: '?calm=3&hue=indigo' },
  { slug: 'calm-3-steel', name: 'Calm 3, steel', q: '?calm=3&hue=steel' },
  { slug: 'calm-3-navy', name: 'Calm 3, navy', q: '?calm=3&hue=navy' }
];
