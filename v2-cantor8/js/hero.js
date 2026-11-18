import { register, fit, reduced } from './loop.js';

export const heroLineX = (w) => (w < 820 ? w * 0.8 : w * 0.8);

// Six tiers of the stack drawn as live strings. A value pulse drops through all six;
// every tier it crosses rings, and the cursor pushes the strings like a hand.
export function initHero() {
  const hero = document.getElementById('hero');
  const cv = document.getElementById('heroCanvas');
  const ctx = cv.getContext('2d');
  const labels = [...hero.querySelectorAll('.tier')];
  const NT = 6;
  const T = []; // tiers
  let W = 0, H = 0, dpr = 1, dx = 8, N = 0, lineX = 0, tierBottom = 0, padL = 0;
  const mouse = { x: -999, y: -999, on: false };
  const flash = new Float32Array(NT);

  const layout = () => {
    ({ w: W, h: H, dpr } = fit(cv));
    const cb = hero.querySelector('.hero-copy').getBoundingClientRect();
    const hb = hero.getBoundingClientRect();
    padL = cb.left;
    const top = Math.max(118, H * 0.15);
    const bot = Math.max(top + 150, cb.top - hb.top - 56);
    lineX = heroLineX(W);
    N = Math.ceil(W / 8) + 1; dx = W / (N - 1);
    tierBottom = bot;
    T.length = 0;
    for (let i = 0; i < NT; i++) {
      const t = i / (NT - 1);
      const y = top + (bot - top) * (t * t * 0.38 + t * 0.62);
      T.push({ y, d: new Float32Array(N), v: new Float32Array(N), A: 3 + (i % 3) * 2.2, f: 0.006 + i * 0.0011, w: 0.5 + i * 0.13 });
      labels[i].style.top = (y - 26) + 'px';
      labels[i].style.left = padL + 'px';
    }
  };
  layout();
  addEventListener('resize', layout);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(hero);

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
  });
  hero.addEventListener('pointerleave', () => { mouse.on = false; });

  const kick = (ti, x, amt) => {
    const t = T[ti]; if (!t) return;
    const c = Math.round(x / dx);
    for (let k = -6; k <= 6; k++) { const j = c + k; if (j > 0 && j < N - 1) t.v[j] += amt * Math.exp(-(k * k) / 8); }
  };
  addEventListener('hero-word', (e) => {
    const sets = [[0], [1, 2], [5]][e.detail] || [];
    sets.forEach((i) => { flash[i] = 1; kick(i, W * 0.3 + Math.random() * W * 0.3, -300); });
  });

  let prevY = -1;
  const step = (t, dt) => {
    // value pulse
    const cyc = 3.1, tp = t % cyc, travel = 1.55;
    let py = -1;
    if (tp < travel) { const u = tp / travel; py = (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)) * (tierBottom + 30); }
    if (py >= 0 && prevY >= 0) T.forEach((tr, i) => { if (prevY < tr.y && py >= tr.y) { flash[i] = 1; kick(i, lineX, -520); } });
    prevY = py;
    const sub = 2, h = dt / sub;
    for (let s = 0; s < sub; s++) {
      for (let i = 0; i < NT; i++) {
        const tr = T[i], d = tr.d, v = tr.v;
        for (let k = 1; k < N - 1; k++) {
          let a = (d[k - 1] + d[k + 1] - 2 * d[k]) * 1100 - d[k] * 3 - v[k] * 2.4;
          if (mouse.on) {
            const px = k * dx, ddx = px - mouse.x, ddy = tr.y + d[k] - mouse.y;
            const dist = Math.hypot(ddx, ddy * 0.6);
            if (dist < 170) { const f = Math.pow(1 - dist / 170, 1.7); a += (ddy >= 0 ? 1 : -1) * f * 5200; }
          }
          v[k] += a * h;
        }
        for (let k = 1; k < N - 1; k++) d[k] += v[k] * h;
      }
    }
    for (let i = 0; i < NT; i++) flash[i] *= Math.pow(0.12, dt);
    return py;
  };

  const draw = (t, dt) => {
    const py = step(t, dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1647DB'; ctx.fillRect(0, 0, W, H);
    // soft light from the top right
    const g = ctx.createRadialGradient(W * 0.72, -H * 0.1, 0, W * 0.72, -H * 0.1, H * 1.1);
    g.addColorStop(0, 'rgba(120,160,255,.45)'); g.addColorStop(1, 'rgba(22,71,219,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.lineJoin = 'round';
    for (let i = 0; i < NT; i++) {
      const tr = T[i], fl = flash[i];
      const cx = (((t * 0.11 + i * 0.19) % 1.3) - 0.15) * W;
      const gr = ctx.createLinearGradient(cx - 380, 0, cx + 380, 0);
      gr.addColorStop(0, 'rgba(255,255,255,.26)'); gr.addColorStop(0.5, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,.26)');
      ctx.strokeStyle = fl > 0.05 ? `rgba(255,255,255,${0.7 + 0.3 * fl})` : gr;
      ctx.lineWidth = 1 + fl * 0.9;
      for (let pass = 0; pass < 3; pass++) {
        if (pass) { ctx.strokeStyle = `rgba(255,255,255,${0.16 + fl * 0.14})`; ctx.lineWidth = 1; }
        const off = pass === 0 ? 0 : (pass === 1 ? 7 : -9);
        ctx.beginPath();
        for (let k = 0; k < N; k++) {
          const x = k * dx;
          const ph = pass * 1.7;
          const base = tr.A * Math.sin(x * tr.f * 3.1 - t * tr.w + ph) + tr.A * 0.5 * Math.sin(x * tr.f * 7.3 + t * tr.w * 1.7 + i + ph);
          const y = tr.y + off + base + tr.d[k] * (pass ? 0.8 : 1);
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      // crossing square
      const ix = Math.round(lineX / dx);
      const cy = tr.y + tr.d[ix] + tr.A * Math.sin(lineX * tr.f * 3.1 - t * tr.w);
      const s = 6 + fl * 7;
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.55 + fl * 0.45;
      ctx.fillRect(lineX - s / 2, cy - s / 2, s, s);
      ctx.globalAlpha = 1;
      if (fl > 0.02) {
        ctx.strokeStyle = `rgba(255,255,255,${fl * 0.7})`; ctx.lineWidth = 1;
        const r = 14 + (1 - fl) * 90; ctx.strokeRect(lineX - r, cy - r * 0.18, r * 2, r * 0.36);
      }
    }
    if (py >= 0) {
      const rg = ctx.createRadialGradient(lineX, py, 0, lineX, py, 46);
      rg.addColorStop(0, 'rgba(255,255,255,.9)'); rg.addColorStop(0.25, 'rgba(180,210,255,.35)'); rg.addColorStop(1, 'rgba(22,71,219,0)');
      ctx.fillStyle = rg; ctx.fillRect(lineX - 50, py - 50, 100, 100);
    }
  };
  register(hero, draw);
  if (reduced) draw(4, 0.016);
}
