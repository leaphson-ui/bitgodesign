// One shared render loop. Each item only runs while its element is on screen.
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const items = [];
const io = new IntersectionObserver((es) => {
  for (const e of es) {
    const it = items.find((i) => i.el === e.target);
    if (it) it.vis = e.isIntersecting;
  }
}, { rootMargin: '120px 0px' });

export function register(el, fn, opts = {}) {
  const it = { el, fn, vis: false, still: opts.still };
  items.push(it);
  io.observe(el);
  return it;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  if (!reduced) for (const it of items) if (it.vis) it.fn(t, dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Reduced motion: draw once when visible and on resize.
if (reduced) {
  const redraw = () => items.forEach((it) => it.fn(4, 0.016));
  addEventListener('resize', redraw);
  setTimeout(redraw, 300);
  setTimeout(redraw, 1500);
}

export function fit(canvas, maxDpr = 2) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  return { w, h, dpr };
}
