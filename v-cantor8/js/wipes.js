import { register } from './loop.js';

const LIGHT = '#8FB0FF';
const hash = (a, b, s = 0) => {
  let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177; h = h ^ (h >>> 16);
  return ((h >>> 0) % 10000) / 10000;
};

export function initWipes() {
  document.querySelectorAll('.wipe').forEach((el, n) => {
    const cv = el.querySelector('canvas');
    const ctx = cv.getContext('2d');
    const F = el.dataset.from, T = el.dataset.to;
    // dark mid step: navy when the page goes to black, deep blue when it goes to blue
    const M = F === '#04050E' ? '#0A2A9E' : '#0A1A66';
    let W = 0, H = 0, big = 128, last = -1;
    const size = () => {
      const r = el.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height);
      big = W < 700 ? 72 : 128;
      cv.width = W; cv.height = H; last = -1;
    };
    size();
    addEventListener('resize', size);
    const draw = () => {
      const r = el.getBoundingClientRect();
      const vh = innerHeight;
      const p = Math.max(0, Math.min(1, (vh * 0.92 - r.top) / (vh * 0.78 + H)));
      const key = Math.round(p * 500) + ':' + W + ':' + H;
      if (key === last) return; last = key;
      ctx.fillStyle = F; ctx.fillRect(0, 0, W, H);
      if (p <= 0) return;
      if (p >= 1) { ctx.fillStyle = T; ctx.fillRect(0, 0, W, H); return; }
      const sm = big / 4;
      const nx = Math.ceil(W / big), ny = Math.ceil(H / big);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const tl = hash(i, j, n) * 0.55 + (i / nx) * 0.35;
        const u = p - tl * 0.62;
        if (u < 0) continue;
        if (u < 0.09) { ctx.fillStyle = LIGHT; ctx.fillRect(i * big, j * big, big, big); continue; }
        for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) {
          const hs = hash(i * 4 + a, j * 4 + b, n + 9);
          const v = u - 0.09 - hs * 0.3;
          ctx.fillStyle = v < 0 ? M : T;
          ctx.fillRect(i * big + a * sm, j * big + b * sm, sm, sm);
        }
      }
    };
    register(el, draw);
    addEventListener('scroll', draw, { passive: true });
    draw();
  });
}
