import { heroLineX } from './hero.js';
import { reduced } from './loop.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const mk = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };

// The follow line: value moving through the whole stack. One trunk from the hero to the last button,
// with branches that leave it at each section. It draws itself as you scroll.
export function initTrace() {
  const svg = $('#trace');
  let pieces = [], nodes = [], head, halo, pk = [], trunk = null;
  let hy = scrollY + innerHeight * 0.62;
  let first = true;
  let root = null;

  const R = (el) => { const r = el.getBoundingClientRect(); return { l: r.left + scrollX, r: r.right + scrollX, t: r.top + scrollY, b: r.bottom + scrollY, w: r.width, h: r.height, cx: r.left + scrollX + r.width / 2, cy: r.top + scrollY + r.height / 2 }; };

  const dstr = (pts, rad = 14) => {
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
      const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const r = Math.min(rad, l1 / 2, l2 / 2);
      const a = [p1[0] + (p0[0] - p1[0]) / l1 * r, p1[1] + (p0[1] - p1[1]) / l1 * r];
      const b = [p1[0] + (p2[0] - p1[0]) / l2 * r, p1[1] + (p2[1] - p1[1]) / l2 * r];
      d += ` L${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${p1[0]} ${p1[1]} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    }
    const e = pts[pts.length - 1];
    return d + ` L${e[0]} ${e[1]}`;
  };

  function build() {
    const W = document.documentElement.clientWidth;
    const Hh = Math.max(document.body.scrollHeight, $('#app').offsetHeight);
    svg.innerHTML = '';
    root = mk('g', {}, svg);
    pieces = []; nodes = []; pk = []; first = true;
    const phone = W < 820;
    const hero = R($('#hero')); const lx = heroLineX(hero.w);
    const padL = R($('.hero-copy')).l;
    const G = phone ? 12 : Math.max(16, padL * 0.42);
    const ghost = mk('g', { fill: 'none', stroke: '#fff', 'stroke-width': 1, opacity: 0.2 }, root);
    const litg = mk('g', { fill: 'none', stroke: '#fff', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, root);
    const ng = mk('g', {}, root);

    const addPiece = (pts, isTrunk) => {
      const d = dstr(pts);
      mk('path', { d }, ghost);
      const p = mk('path', { d }, litg);
      const L = p.getTotalLength();
      const ys = [], ls = [];
      for (let l = 0; l <= L; l += 4) { ys.push(p.getPointAtLength(l).y); ls.push(l); }
      ys.push(p.getPointAtLength(L).y); ls.push(L);
      p.style.strokeDasharray = L + ' ' + (L + 4); p.style.strokeDashoffset = L;
      const pc = { p, L, ys, ls, cur: 0 };
      pieces.push(pc);
      if (isTrunk) trunk = pc;
      return pc;
    };
    const addNode = (x, y) => { const r = mk('rect', { x: x - 4.5, y: y - 4.5, width: 9, height: 9, fill: '#fff', opacity: 0 }, ng); nodes.push({ x, y, r, v: 0 }); };
    const jogRoom = (dx, f, max) => Math.min(Math.abs(dx) * f, max);

    // stubs: branches that leave the trunk and run to an element
    const stubs = [];
    const stubTo = (x, y) => { const run = Math.max(10, Math.abs(x - G)); const ys = y - Math.min(run, 280); stubs.push({ ys, pts: [[G, ys], [x, y]], x, y }); };

    $$('.badge').forEach((el) => { const r = R(el); stubTo(Math.max(G + 12, r.l - 16), r.cy); });
    $$('.crow .nd').forEach((el) => { const r = R(el); stubTo(r.cx, r.cy); });
    const coreEnd = stubs.length ? Math.max(...stubs.map((s) => s.ys)) : 0;
    const est = $('.est-grid'), cards = $$('.card');
    let fanY = 0;
    if (cards.length) {
      fanY = R($('.build h2')).b + 40;
      if (!phone) cards.forEach((c) => { const r = R(c); stubs.push({ ys: fanY, pts: [[G, fanY], [r.cx, r.t + 1]], x: r.cx, y: r.t + 1 }); });
      else cards.forEach((c) => { const r = R(c); stubTo(Math.max(G + 10, r.l + 24), r.t + 1); });
    }
    $$('.sitem .nd').forEach((el) => { const r = R(el); stubTo(r.cx, r.cy); });
    $$('.oitem .nd').forEach((el) => { const r = R(el); stubTo(r.cx, r.cy); });
    const btn = R($('.cta .pill'));
    stubTo(btn.l - 14, btn.cy);
    stubs.sort((a, b) => a.ys - b.ys);

    // trunk: hero drop, a switch to the gutter, a detour through the middle of the client grid, then down to the last stub
    const T = [[lx, 98]];
    const jog = (x, room, limit) => { const l = T[T.length - 1]; let r = room; if (limit) r = Math.min(r, limit - l[1] - 6); T.push([x, l[1] + Math.max(40, r)]); };
    const rowsB = R($('.lrows')).b + 36;
    T.push([lx, Math.max(hero.b - 30, rowsB)]);
    jog(G, jogRoom(lx - G, 0.8, 620), stubs[0].ys);
    if (est && !phone) {
      const e = R($('.est')), g = R(est);
      const yy = Math.max(T[T.length - 1][1] + 10, e.t + 24, coreEnd + 30);
      T.push([G, yy]); jog(g.cx, jogRoom(g.cx - G, 0.62, 440));
      T.push([g.cx, g.b + 24]); jog(G, jogRoom(g.cx - G, 0.5, 320), fanY || 1e9);
    }
    for (const s of stubs) { if (s.ys > T[T.length - 1][1] + 1) T.push([G, s.ys]); }
    const dedup = [T[0]];
    for (let i = 1; i < T.length; i++) { const a = dedup[dedup.length - 1], b = T[i]; if (b[1] >= a[1] && (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) > 1)) dedup.push(b); }
    addPiece(dedup, true);
    stubs.forEach((s) => { addPiece(s.pts); addNode(s.x, s.y); });
    head = mk('circle', { r: 4.5, fill: '#fff' }, root);
    halo = mk('circle', { r: 16, fill: 'rgba(160,195,255,.28)' }, root);
    for (let i = 0; i < 4; i++) pk.push(mk('rect', { width: 5, height: 5, fill: '#fff', opacity: 0 }, root));
  }

  const lenAt = (pc, y) => {
    const ys = pc.ys; if (y <= ys[0]) return 0; if (y >= ys[ys.length - 1]) return pc.L;
    let lo = 0, hi = ys.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ys[m] <= y) lo = m; else hi = m; }
    return pc.ls[lo];
  };

  let lastNow = 0;
  const tick = (now) => {
    const t = now / 1000; const dtk = Math.min(0.25, Math.max(0.001, t - lastNow)); lastNow = t;
    const kk = reduced ? 1 : 1 - Math.exp(-dtk * 9);
    const tgt = scrollY + innerHeight * 0.62;
    hy += (tgt - hy) * (reduced ? 1 : 1 - Math.exp(-dtk * 8));
    if (root) root.setAttribute('transform', `translate(0 ${-scrollY})`);
    if (trunk && pieces.length) {
      for (const pc of pieces) {
        const want = lenAt(pc, hy);
        pc.cur += (want - pc.cur) * (first ? 1 : kk);
        if (Math.abs(want - pc.cur) < 0.3) pc.cur = want;
        pc.p.style.strokeDashoffset = pc.L - pc.cur;
      }
      for (const n of nodes) {
        const on = hy >= n.y - 2 ? 1 : 0; n.v += (on - n.v) * Math.min(1, kk * 1.3);
        n.r.setAttribute('opacity', n.v.toFixed(2));
        n.r.setAttribute('transform', `translate(${n.x} ${n.y}) scale(${0.4 + 0.6 * n.v}) translate(${-n.x} ${-n.y})`);
      }
      const hp = trunk.p.getPointAtLength(Math.max(0, trunk.cur));
      head.setAttribute('cx', hp.x); head.setAttribute('cy', hp.y); halo.setAttribute('cx', hp.x); halo.setAttribute('cy', hp.y);
      halo.setAttribute('r', 16 + (reduced ? 0 : 3 * Math.sin(t * 3)));
      pk.forEach((r, i) => {
        if (reduced || trunk.cur < 240) { r.setAttribute('opacity', 0); return; }
        const s = ((t * 120 + i * (trunk.cur / 4)) % trunk.cur);
        const p = trunk.p.getPointAtLength(s);
        r.setAttribute('x', p.x - 2.5); r.setAttribute('y', p.y - 2.5); r.setAttribute('opacity', 0.85 * Math.min(1, (trunk.cur - s) / 60));
      });
      first = false;
    }
    requestAnimationFrame(tick);
  };

  let tm;
  const rebuild = () => { clearTimeout(tm); tm = setTimeout(() => { try { build(); } catch (e) { console.warn('trace', e); } }, 120); };
  try { build(); } catch (e) { console.warn('trace', e); }
  requestAnimationFrame(tick);
  addEventListener('resize', rebuild);
  addEventListener('load', rebuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe($('#app'));
  setTimeout(rebuild, 1500); setTimeout(rebuild, 4000);
}
