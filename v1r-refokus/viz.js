// Small canvas 2D line systems. Each one draws something specific to its section and pauses when offscreen.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function setup(canvas, draw) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, vis = false, raf = 0, t0 = performance.now();
  const size = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(2, r.width); H = Math.max(2, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint();
  };
  const paint = () => { ctx.clearRect(0, 0, W, H); draw(ctx, W, H, reduce ? 4 : (performance.now() - t0) / 1000); };
  const loop = () => { if (!vis) { raf = 0; return; } paint(); raf = requestAnimationFrame(loop); };
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(es => {
    vis = es[0].isIntersecting;
    if (vis && !raf && !reduce) raf = requestAnimationFrame(loop);
  }, { rootMargin: '80px' }).observe(canvas);
  size();
}

/* Light strands: the page's motif. Thin lines that carry a value in their length; the tip glows. */
export function bars(canvas, o = {}) {
  const { n = 60, mode = 'wave', color = '255,255,255', seed = 1, width = .5, fromTop = false, maxH = .9, tip = '255,255,255' } = o;
  setup(canvas, (c, W, H, t) => {
    const gap = W / n, bw = Math.max(1.5, Math.min(gap * width * .55, 5));
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      let h;
      if (mode === 'wave') h = .5 + .35 * Math.sin(u * 5.2 + t * .5 + seed) + .15 * Math.sin(u * 17 + t * .9 + seed * 3);
      else if (mode === 'sparse') h = .25 + .75 * Math.pow(.5 + .5 * Math.sin(i * 2.3 + t * .35 + seed), 1.6);
      else if (mode === 'travel') h = .12 + .88 * Math.exp(-Math.pow(((u * 1.15 - (t * .12 + seed * .1) % 1.4) * 4), 2)) + .12 * hash(i + seed);
      else if (mode === 'halving') { const stage = Math.floor(u * 5); h = Math.pow(.5, stage * .85) * (.9 + .1 * Math.sin(i * 3 + t)); h = h * .95 + .05; }
      else if (mode === 'build') { const cyc = (t * .22 + hash(i + seed) * .6) % 1; h = .1 + .9 * ease(clamp(cyc * 1.6)) * (.4 + .6 * hash(i * 3 + seed)); }
      else h = .5;
      h = clamp(h, .04, 1) * H * maxH;
      const x = i * gap + gap / 2 - bw / 2;
      const y0 = fromTop ? 0 : H, y1 = fromTop ? h : H - h;
      const g = c.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, `rgba(${color},0)`);
      g.addColorStop(.55, `rgba(${color},.28)`);
      g.addColorStop(1, `rgba(${color},.9)`);
      c.fillStyle = g;
      c.fillRect(x, Math.min(y0, y1), bw, Math.abs(y1 - y0));
      const r = 12 + bw * 4;
      const gl = c.createRadialGradient(x + bw / 2, y1, 0, x + bw / 2, y1, r);
      gl.addColorStop(0, `rgba(${tip},.9)`); gl.addColorStop(.25, `rgba(${tip},.25)`); gl.addColorStop(1, `rgba(${tip},0)`);
      c.fillStyle = gl; c.fillRect(x + bw / 2 - r, y1 - r, r * 2, r * 2);
    }
  });
}

/* Go Accounts: cash and crypto rows slide together into one ledger line. */
export function ledger(canvas) {
  setup(canvas, (c, W, H, t) => {
    const rows = 7, rh = H / (rows * 1.9), gapY = rh * .9, y0 = (H - (rows * rh + (rows - 1) * gapY)) / 2;
    for (let r = 0; r < rows; r++) {
      const y = y0 + r * (rh + gapY);
      const ph = ((t * .32 + r * .11) % 1);
      const join = Math.sin(ph * Math.PI);
      const wTotal = W * (.5 + .22 * hash(r + 3));
      const x0 = (W - wTotal) / 2;
      const cashW = wTotal * (.42 + .1 * hash(r * 7));
      const cryW = wTotal - cashW;
      const gapX = (1 - ease(join)) * W * .12 + 6;
      const off = (1 - ease(join)) * W * .06;
      // cash (pale)
      let g = c.createLinearGradient(x0 - off, 0, x0 - off + cashW, 0);
      g.addColorStop(0, 'rgba(210,222,255,.9)'); g.addColorStop(1, 'rgba(160,185,255,.85)');
      round(c, x0 - off - gapX / 2, y, cashW, rh, rh / 2, g);
      // crypto (blue)
      g = c.createLinearGradient(x0 + cashW + off, 0, x0 + wTotal + off, 0);
      g.addColorStop(0, '#2f63ff'); g.addColorStop(1, '#7b9dff');
      round(c, x0 + cashW + off + gapX / 2, y, cryW, rh, rh / 2, g);
      // joined glow
      c.fillStyle = `rgba(255,255,255,${.5 * ease(join) * (1 - Math.abs(r - 3) / 5)})`;
      c.fillRect(x0 + cashW - 1, y + rh * .2, 2, rh * .6);
    }
  });
}
function round(c, x, y, w, h, r, fill) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); }

/* Go Network: arcs of settlement light between nodes. */
export function network(canvas) {
  const N = 16, pts = [];
  for (let i = 0; i < N; i++) { const a = hash(i * 2.1) * TAU, r = Math.sqrt(hash(i * 5.3 + 1)) * .42; pts.push([.5 + Math.cos(a) * r * 1.1, .52 + Math.sin(a) * r * .8]); }
  const links = []; for (let i = 0; i < N; i++) { links.push([i, (i * 5 + 3) % N]); links.push([i, (i * 3 + 7) % N]); }
  setup(canvas, (c, W, H, t) => {
    c.lineWidth = 1.2;
    links.forEach(([a, b], k) => {
      const A = pts[a], Bp = pts[b];
      const x1 = A[0] * W, y1 = A[1] * H, x2 = Bp[0] * W, y2 = Bp[1] * H;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * .32;
      c.strokeStyle = 'rgba(150,180,255,.22)';
      c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke();
      const p = ((t * .22 + hash(k * 1.7)) % 1);
      const q = 1 - p, px = q * q * x1 + 2 * q * p * mx + p * p * x2, py = q * q * y1 + 2 * q * p * my + p * p * y2;
      const gr = c.createRadialGradient(px, py, 0, px, py, 14);
      gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.3, 'rgba(110,150,255,.55)'); gr.addColorStop(1, 'rgba(60,100,255,0)');
      c.fillStyle = gr; c.fillRect(px - 14, py - 14, 28, 28);
    });
    pts.forEach((p, i) => {
      const x = p[0] * W, y = p[1] * H, pulse = .5 + .5 * Math.sin(t * 1.4 + i);
      c.fillStyle = `rgba(80,120,255,${.18 + .2 * pulse})`; c.beginPath(); c.arc(x, y, 12 + 6 * pulse, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.fill();
    });
  });
}

/* Staking: strands that compound upward, each tip a reward. */
export function staking(canvas) {
  setup(canvas, (c, W, H, t) => {
    const n = 30, gap = W / n, bw = Math.max(2.5, gap * .3);
    const grow = .3 + .7 * ease(.5 + .5 * Math.sin(t * .55 - 1.3));
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const target = .14 + .78 * Math.pow(u, 1.6);
      const lag = clamp(grow * 1.25 - (1 - u) * .25);
      const h = H * (.07 + target * lag);
      const x = i * gap + (gap - bw) / 2, y = H - h;
      const g = c.createLinearGradient(0, H, 0, y);
      g.addColorStop(0, 'rgba(70,115,255,0)'); g.addColorStop(.6, 'rgba(100,145,255,.45)'); g.addColorStop(1, 'rgba(235,242,255,1)');
      c.fillStyle = g; c.fillRect(x, y, bw, h);
      const gl = c.createRadialGradient(x + bw / 2, y, 0, x + bw / 2, y, 26);
      gl.addColorStop(0, 'rgba(220,232,255,.95)'); gl.addColorStop(.25, 'rgba(120,160,255,.3)'); gl.addColorStop(1, 'rgba(80,120,255,0)');
      c.fillStyle = gl; c.fillRect(x - 26, y - 26, bw + 52, 52);
    }
  });
}

/* 24/7: a dial of blades. Light sweeps around it and no blade ever goes dark. */
export function dial(canvas, o = {}) {
  const dark = o.dark ?? false;
  setup(canvas, (c, W, H, t) => {
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 * .96, r0 = R * .46, n = 72;
    const sweep = (t * .45) % TAU;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU - Math.PI / 2;
      let d = Math.abs(((a + Math.PI / 2) - sweep + Math.PI * 3) % TAU - Math.PI); // 0..PI
      const lit = Math.exp(-Math.pow((Math.PI - d) * 1.2, 2));
      const hour = i % 3 === 0;
      const len = (R - r0) * (.42 + .38 * lit + (hour ? .18 : 0)) ;
      const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0, x1 = cx + Math.cos(a) * (r0 + len), y1 = cy + Math.sin(a) * (r0 + len);
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, dark ? 'rgba(22,71,219,.9)' : 'rgba(22,71,219,.95)');
      g.addColorStop(1, `rgba(${dark ? '150,180,255' : '120,150,255'},${.25 + .75 * lit})`);
      c.strokeStyle = g; c.lineWidth = hour ? Math.max(4, R * .022) : Math.max(2, R * .011); c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
  });
}
