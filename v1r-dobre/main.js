import { buildPage } from './ui.js';

buildPage();

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const L = { ink: '#06080f', hi: '#8791a8' }, BL = { ink: '#00010a', hi: '#2645bd' };
const SC = {
  vault:     { shape: 'vault',   c: L,  ox: 0.44, oy: 0.0, s: 1.42, rx: 0.12,  ry: -0.95, rz: 0 },
  gears:     { shape: 'gears',   c: L,  ox: 0.4, oy: 0.0,  s: 1.7, rx: -0.12, ry: 0.32, rz: 0.12 },
  crane:     { shape: 'crane',   c: L,  ox: 0.5,  oy: 0.0,  s: 2.2, rx: 0.06, ry: -0.7, rz: 0 },
  skyline:   { shape: 'skyline', c: BL, ox: 0.3,  oy: -0.2, s: 2.1, rx: 0.52, ry: 0.55, rz: 0 },
  skyline2:  { shape: 'arch', c: L,  ox: 0.5,  oy: -0.05, s: 1.9, rx: 0.08, ry: -0.5,  rz: 0 },
  stack:     { shape: 'stack',   c: BL, ox: -0.42, oy: 0.0, s: 1.7, rx: 0.3,  ry: 0.5,  rz: 0 },
  bridge:    { shape: 'bridge',  c: L,  ox: 0.6,  oy: 0.4, s: 1.6, rx: 0.14, ry: -0.55, rz: 0 },
  dome:      { shape: 'dome',    c: L,  ox: 0.46, oy: 0.0,  s: 1.75, rx: 0.14, ry: 0.4, rz: 0 },
  lighthouse:{ shape: 'lighthouse', c: L, ox: -0.5, oy: 0.0, s: 1.8, rx: 0.05, ry: 0.55, rz: 0 },
  terrain:   { shape: 'terrain', c: BL, ox: 0.0,  oy: -0.28, s: 2.5, rx: 0.62,  ry: 0.2,  rz: 0 },
  iris:      { shape: 'lamp',    c: L,  ox: 0.4, oy: 0.02,  s: 1.55, rx: 0.12, ry: 0.75, rz: 0 },
  ribbon:    { shape: 'ribbon',  c: L,  ox: 0.4,  oy: 0.3,  s: 2.3, rx: 0.2, ry: 0.15, rz: 0 },
  gate:      { shape: 'gate',    c: BL, ox: 0.3, oy: -0.05, s: 2.5, rx: 0.12, ry: -0.12, rz: 0 },
};

const words = [...document.querySelectorAll('.hero .w')];
let heroWord = -1;
function setWord(i) { if (i === heroWord) return; heroWord = i; words.forEach((w, k) => w.classList.toggle('on', k === i)); }

let stops = [];
function measure() {
  const vh = innerHeight, sy = scrollY;
  stops = [{ y: 0, name: 'vault', hero: 0 }, { y: 1.3 * vh, name: 'gears', hero: 1 }, { y: 2.45 * vh, name: 'crane', hero: 2 }];
  document.querySelectorAll('section[data-scene]').forEach((el) => {
    if (el.id === 'hero') return;
    const top = el.getBoundingClientRect().top + sy;
    stops.push({ y: Math.max(top - 0.45 * vh, stops[stops.length - 1].y + 0.3 * vh), name: el.dataset.scene, hero: -1 });
  });
  const f = document.getElementById('footer');
  stops.footTop = f.getBoundingClientRect().top + sy;
}

function stateAt(sy) {
  const vh = innerHeight;
  let k = stops.findIndex((s) => sy < s.y);
  if (k === -1) return { a: stops[stops.length - 1], b: stops[stops.length - 1], p: 0 };
  if (k === 0) return { a: stops[0], b: stops[0], p: 0 };
  const span = Math.min(0.62 * vh, stops[k].y - stops[k - 1].y);
  const p = Math.min(1, Math.max(0, (sy - (stops[k].y - span)) / span));
  return { a: stops[k - 1], b: stops[k], p };
}

const canvas = document.getElementById('gl');
const FORCE = new URLSearchParams(location.search).get('shape');
let cloud = null, last = performance.now();
const mouse = { x: 9, y: 9, on: 0, t: -9 };
let sy = scrollY, target = scrollY, needs = true;

async function init() {
  let mod;
  try { mod = await import('./cloud.js'); } catch (e) { console.error('cloud import failed', e); document.documentElement.classList.add('no-gl'); return; }
  const THREE = await import('three');
  const N = innerWidth < 720 ? 100000 : 240000;
  try {
    cloud = new mod.Cloud(canvas, N);
  } catch (e) { console.error('webgl failed', e); document.documentElement.classList.add('no-gl'); return; }
  const resize = () => { cloud.resize(innerWidth, innerHeight, Math.min(devicePixelRatio || 1, 2)); measure(); needs = true; };
  resize();
  addEventListener('resize', resize);
  new ResizeObserver(() => { measure(); needs = true; }).observe(document.body);
  addEventListener('scroll', () => { target = scrollY; needs = true; }, { passive: true });
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = -(e.clientY / innerHeight * 2 - 1); mouse.t = performance.now(); needs = true; }, { passive: true });
  document.addEventListener('visibilitychange', () => { last = performance.now(); });
  sy = target = scrollY;
  const cA = new THREE.Color(), cB = new THREE.Color(), cc = new THREE.Color();
  const lerp = (a, b, t) => a + (b - a) * t;
  // pre-build the next shapes while idle
  const order = ['gears', 'crane', 'skyline', 'arch', 'stack', 'bridge', 'dome', 'lighthouse', 'terrain', 'lamp', 'ribbon', 'gate'];
  const { buildShape } = await import('./shapes.js');
  let oi = 0; const pre = () => { if (oi < order.length) { buildShape(order[oi++], N); setTimeout(pre, 120); } };
  setTimeout(pre, 600);

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(0.5, (now - last) / 1000); last = now;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 7);
    if (Math.abs(target - sy) > 0.3) { sy += (target - sy) * k; needs = true; } else sy = target;
    const mAct = now - mouse.t < 1600;
    const mo = cloud.uniforms.uMouseOn;
    const mt = mAct ? 1 : 0;
    if (Math.abs(mo.value - mt) > 0.01) { mo.value += (mt - mo.value) * (1 - Math.exp(-dt * 6)); needs = true; }
    const sway = !reduce;
    if (!needs && !sway) return;
    needs = false;
    const st = FORCE ? { a: { name: FORCE, hero: -1 }, b: { name: FORCE, hero: -1 }, p: 0 } : stateAt(sy), A = SC[st.a.name], Bs = SC[st.b.name];
    const p = st.p, pe = p * p * (3 - 2 * p);
    cloud.setPair(A.shape, Bs.shape);
    const same = A.shape === Bs.shape;
    cloud.uniforms.uProg.value = same ? 0 : p;
    const mob = innerWidth / innerHeight < 0.8;
    const pl = (s) => { if (FORCE) { const q = new URLSearchParams(location.search); const o = { ...s }; for (const k of ['ox','oy','s','rx','ry','rz']) if (q.has(k)) o[k] = +q.get(k); return o; } return mob ? { ...s, ox: 0, oy: 0.36, s: s.s * 0.6 } : s; };
    const a = pl(A), b = pl(Bs);
    const ox = lerp(a.ox, b.ox, pe), oy = lerp(a.oy, b.oy, pe), sc = lerp(a.s, b.s, pe);
    const drift = (sy / innerHeight) * 0.07;
    const t = now / 1000;
    const pt = cloud.points;
    pt.position.set(ox * cloud.halfW, oy * cloud.halfH, 0);
    pt.scale.setScalar(sc); cloud.uniforms.uScale.value = sc;
    pt.rotation.set(lerp(a.rx, b.rx, pe) + (sway ? Math.sin(t * 0.21) * 0.025 : 0) - mouse.y * 0.05 * (mAct ? 1 : 0), lerp(a.ry, b.ry, pe) + drift + (sway ? Math.sin(t * 0.17) * 0.04 : 0) + mouse.x * 0.06 * (mAct ? 1 : 0), lerp(a.rz, b.rz, pe));
    cc.set(A.c.ink).lerp(cB.set(Bs.c.ink), pe); cloud.uniforms.uInk.value.copy(cc);
    cc.set(A.c.hi).lerp(cB.set(Bs.c.hi), pe); cloud.uniforms.uHi.value.copy(cc);
    cloud.uniforms.uTime.value = t;
    cloud.uniforms.uSway.value = sway ? 1 : 0;
    cloud.uniforms.uMouse.value.set(mouse.x, mouse.y);
    const fade = 1 - Math.min(1, Math.max(0, (sy + innerHeight - stops.footTop) / (0.55 * innerHeight)));
    canvas.style.opacity = fade.toFixed(3);
    // hero word follows the morph
    if (st.a.hero >= 0) setWord(st.b.hero >= 0 && p > 0.5 ? st.b.hero : st.a.hero); else if (st.a.hero === -1 && st.b.hero === -1 && sy > 0) setWord(2);
    document.documentElement.dataset.ground = (p > 0.5 ? Bs : A).c === BL ? 'b' : 'l';
    if (fade > 0.002) cloud.render();
  }
  requestAnimationFrame(frame);
  window.__cloud = { get sy() { return sy; } };
}
measure();
init();
