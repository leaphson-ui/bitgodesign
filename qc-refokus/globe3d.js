/* Global Access: the library globe (shared/models/globe.js) on its own canvas. The arcs between the five regions
   draw in as the section arrives; the globe turns slowly and leans toward the pointer. Renders only while visible. */
import * as THREE from 'three';
import { makeEnv, setupRenderer } from '../shared/models/materials.js';
import { create } from '../shared/models/globe.js';

const canvas = document.getElementById('globe3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
try { if (canvas) start(); } catch (e) { console.warn('globe unavailable', e); }

function start() {
  const sec = document.getElementById('global');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  setupRenderer(renderer);
  renderer.setClearColor(0x000000, 0);
  let soft = false;
  try { const g = renderer.getContext(), e = g.getExtension('WEBGL_debug_renderer_info'); soft = !!e && /swiftshader|llvmpipe|software/i.test(g.getParameter(e.UNMASKED_RENDERER_WEBGL)); } catch (e) {}
  const scene = new THREE.Scene();
  scene.environment = makeEnv(renderer, 'dark');
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0.35, 4.4); camera.lookAt(0, 0, 0);
  const model = create({ quality: soft ? 'low' : 'high' });
  scene.add(model.object);
  const key = new THREE.DirectionalLight(0xffffff, 0.6); key.position.set(-3, 3, 4); scene.add(key);

  let vis = false, W = 0, H = 0;
  const resize = () => {
    const r = canvas.getBoundingClientRect(); if (!r.width) return;
    W = r.width; H = r.height;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, soft ? 1 : 2)); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '10% 0px' }).observe(canvas);
  resize();
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  let open = 0, last = performance.now(), lastR = 0;
  const t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!vis) { last = now; return; }
    if (soft && now - lastR < 900) return;
    lastR = now;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const r = sec.getBoundingClientRect();
    const target = reduce ? 1 : Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.95)));
    open += (target - open) * (1 - Math.exp(-dt * 2.2));
    ptr.sx += (ptr.x - ptr.sx) * 0.04; ptr.sy += (ptr.y - ptr.sy) * 0.04;
    model.object.rotation.x = ptr.sy * 0.12; model.object.rotation.y = ptr.sx * 0.18;
    model.update(reduce ? 4 : (now - t0) / 1000, { open });
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
