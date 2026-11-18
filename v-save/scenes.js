const TAU = Math.PI * 2;
const FONT = '500 15px Onest, system-ui, sans-serif';

function bez(p0, p1, p2, p3, u) {
  const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}
function glowDot(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.25, `rgba(${rgb},${a * .35})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, TAU); ctx.fill();
}
const CY = '98,216,255', WH = '255,255,255', BL = '110,170,255';

/* scene 0: accounts. Two sources enter one account, four uses leave */
function accounts(ctx, w, h, t, B) {
  const hs = Math.min(w, h) * .15, cx = w / 2, cy = h / 2;
  const src = [[w * .1, h * .32], [w * .1, h * .68]];
  const dst = [.14, .38, .62, .86].map(y => [w * .9, h * y]);
  const labS = ['Cash', 'Crypto'], labD = ['Hold', 'Send', 'Trade', 'Finance'];
  const curve = (a, b) => { const dx = Math.abs(b[0] - a[0]); return [a, [a[0] + dx * .5, a[1]], [b[0] - dx * .5, b[1]], b]; };
  const inEnd = (si) => [cx - hs, cy + (si ? hs * .4 : -hs * .4)];
  const outStart = (di) => [cx + hs, cy + (di - 1.5) * hs * .3];
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(120,165,255,.28)';
  src.forEach((s, si) => { const c = curve(s, inEnd(si)); ctx.beginPath(); ctx.moveTo(...c[0]); ctx.bezierCurveTo(...c[1], ...c[2], ...c[3]); ctx.stroke(); });
  dst.forEach((d, i) => { const c = curve(outStart(i), d); ctx.beginPath(); ctx.moveTo(...c[0]); ctx.bezierCurveTo(...c[1], ...c[2], ...c[3]); ctx.stroke(); });
  const g = ctx.createLinearGradient(cx - hs, cy - hs, cx + hs, cy + hs); g.addColorStop(0, '#2F62F5'); g.addColorStop(1, '#0F2FA8');
  ctx.save(); ctx.shadowColor = 'rgba(60,120,255,.8)'; ctx.shadowBlur = 50; ctx.fillStyle = g;
  ctx.beginPath(); ctx.roundRect(cx - hs, cy - hs, hs * 2, hs * 2, hs * .3); ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(cx - hs, cy - hs, hs * 2, hs * 2, hs * .3); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.max(13, hs * .26)}px Bricolage Grotesque, system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(B.build.cards[0].cta.label, cx, cy);
  for (let i = 0; i < 30; i++) {
    const ph = ((t * .00018 + i / 30) % 1), si = i % 2, di = (i * 3 + (i >> 2)) % 4;
    let pt;
    if (ph < .5) { const c = curve(src[si], inEnd(si)); pt = bez(c[0], c[1], c[2], c[3], ph / .5); }
    else { const c = curve(outStart(di), dst[di]); pt = bez(c[0], c[1], c[2], c[3], (ph - .5) / .5); }
    glowDot(ctx, pt[0], pt[1], 3, si ? WH : CY, .95);
  }
  ctx.font = FONT; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left'; src.forEach((s, i) => ctx.fillText(labS[i], s[0] - 6, s[1] - 22));
  ctx.textAlign = 'right'; dst.forEach((d, i) => ctx.fillText(labD[i], d[0] + 6, d[1] - 22));
}

/* scene 1: staking. Orbits that keep growing outward */
function staking(ctx, w, h, t) {
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .46;
  for (let k = 0; k < 4; k++) {
    const u = ((t * .00028) + k / 4) % 1;
    ctx.strokeStyle = `rgba(98,216,255,${(1 - u) * .5})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R * .15 + u * R * .9, 0, TAU); ctx.stroke();
  }
  for (let o = 0; o < 6; o++) {
    const r = R * (.28 + o * .14);
    ctx.strokeStyle = 'rgba(120,165,255,.22)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    const n = 7 + o * 5, sp = (o % 2 ? -1 : 1) * (.00012 + .00005 * (6 - o));
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + t * sp + o;
      const sz = 2.2 + 2.2 * (.5 + .5 * Math.sin(t * .0016 + i * 1.7 + o));
      glowDot(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, sz, o % 3 === 0 ? WH : BL, .95);
    }
  }
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * .22);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(98,216,255,.8)'); g.addColorStop(1, 'rgba(22,71,219,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * .22 * (1 + .06 * Math.sin(t * .003)), 0, TAU); ctx.fill();
}

/* scene 2: network. A solid globe of points, with settlement arcs */
const globe = (() => {
  const pts = [], N = 3400;
  for (let i = 0; i < N; i++) { const y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), a = i * 2.399963; pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
  const nodes = [];
  for (let i = 0; i < 18; i++) { const lat = Math.asin(Math.sin(i * 2.17) * .8), lon = i * 2.6; nodes.push([Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]); }
  return { pts, nodes };
})();
function network(ctx, w, h, t) {
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .38, ay = t * .00008, ax = .38;
  const rot = ([x, y, z]) => { const c = Math.cos(ay), s = Math.sin(ay); const X = x * c + z * s, Z = -x * s + z * c; const c2 = Math.cos(ax), s2 = Math.sin(ax); return [X, y * c2 - Z * s2, y * s2 + Z * c2]; };
  const proj = (p, lift = 1) => { const q = rot(p); return [cx + q[0] * R * lift, cy - q[1] * R * lift, q[2] * lift]; };
  const halo = ctx.createRadialGradient(cx, cy, R * .6, cx, cy, R * 1.5); halo.addColorStop(0, 'rgba(22,71,219,.5)'); halo.addColorStop(1, 'rgba(22,71,219,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
  for (const p of globe.pts) {
    const q = proj(p), z = q[2];
    const a = z > 0 ? .25 + .6 * z : .08;
    ctx.fillStyle = z > 0 ? `rgba(${120 + z * 100 | 0},${170 + z * 70 | 0},255,${a})` : `rgba(60,100,230,${a})`;
    ctx.fillRect(q[0], q[1], 2.2, 2.2);
  }
  const slerp = (a, b, u) => { const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), o = Math.acos(d), s = Math.sin(o) || 1; const k1 = Math.sin((1 - u) * o) / s, k2 = Math.sin(u * o) / s; return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2]; };
  const nd = globe.nodes;
  for (let i = 0; i < nd.length; i++) {
    const a = nd[i], b = nd[(i * 5 + 3) % nd.length]; if (a === b) continue;
    const dist = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    const path = [];
    for (let s = 0; s <= 24; s++) { const u = s / 24; path.push(proj(slerp(a, b, u), 1 + Math.sin(u * Math.PI) * .09 * dist)); }
    ctx.lineWidth = 1.4; ctx.beginPath(); path.forEach((q, s) => s ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
    ctx.strokeStyle = path[12][2] > -.2 ? 'rgba(98,216,255,.55)' : 'rgba(98,216,255,.12)'; ctx.stroke();
    const u = ((t * .0002 + i * .137) % 1), q = path[Math.floor(u * 24)];
    if (q[2] > -.2) glowDot(ctx, q[0], q[1], 2.6, WH, .95);
  }
  nd.forEach(n => { const q = proj(n); if (q[2] > -.1) glowDot(ctx, q[0], q[1], 3, CY, .95); });
}

export function initScenes(canvases, B) {
  const fns = [accounts, staking, network];
  const state = [...canvases].map((c, i) => {
    const s = { c, ctx: c.getContext('2d'), fn: fns[i], vis: false, w: 0, h: 0, dpr: 1 };
    new IntersectionObserver(es => { s.vis = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(c);
    return s;
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    tick(t) {
      for (const s of state) {
        if (!s.vis) continue;
        const w = s.c.clientWidth, h = s.c.clientHeight; if (!w || !h) continue;
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        if (w !== s.w || h !== s.h || dpr !== s.dpr) { s.w = w; s.h = h; s.dpr = dpr; s.c.width = w * dpr; s.c.height = h * dpr; }
        s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); s.ctx.clearRect(0, 0, w, h);
        s.fn(s.ctx, w, h, reduced ? 4000 : t, B);
      }
    },
  };
}
