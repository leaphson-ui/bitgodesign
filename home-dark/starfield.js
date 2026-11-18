/* Starfield: the black-ground effect from bitgo.com (its Starfield component), ported for the dark homepage exploration.
   A faint 32px grid that scrolls at 0.6x, with a seeded star on each node (most faint, a few bright, some twinkle with a
   cross). Near the cursor the stars snap to their node, grow, turn BitGo blue and the grid edges between them light up.
   When the cursor rests, a ripple leaves it every 1.5s and blue monospace characters (+ x * $ % / # 0 1) appear and
   fade around it. A click flashes, sends a ring of characters out to the screen edges and brightens nearby content.
   Touch screens and reduced motion get one still frame. Two canvases: #sf-field (behind the content) and #sf-burst
   (over it, pointer-events none). Starfield.opacity(v) lets the page fade the field (0 where the curtain shows). */
(function () {
  const CHARS = ['+', '×', '*', '$', '%', '/', '#', '0', '1'], BLUE = '#4f9dff', WHITE = '#f4f4f5', GRID = '#a1a1aa';
  const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', CELL = 32, PARALLAX = 0.6;
  const SEL = 'h1,h2,h3,h4,h5,h6,p,li,a,button,img,picture,video,svg,figure,blockquote,input,select,textarea,label,pre,table';
  const hash = (a, b, c) => { let m = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177); m = Math.imul(m ^ (m >>> 13), 1103515245); m ^= m >>> 16; return (m >>> 0) / 4294967296; };
  const pick = a => a[Math.floor(Math.random() * a.length)], rand = (a, b) => a + Math.random() * (b - a);
  const follow = (k, dt) => 1 - (1 - k) ** (dt / (1000 / 60));

  function start(field, burst) {
    const f = field.getContext('2d'), u = burst.getContext('2d');
    const rm = matchMedia('(prefers-reduced-motion: reduce)'), touch = matchMedia('(hover: none), (pointer: coarse)');
    const still = () => rm.matches || touch.matches;
    let W = 0, H = 0, dpr = 1, scroll = 0, cols = 0, rowsBuf = 0;
    let rowOf = new Int32Array(0), heat = new Float32Array(0), jx = new Float32Array(0), jy = new Float32Array(0), base = new Float32Array(0),
      twP = new Float32Array(0), twO = new Float32Array(0), spP = new Float32Array(0), spO = new Float32Array(0), kind = new Uint8Array(0);
    let raf = 0, last = 0, lastDraw = 0, maxHeat = 0, burstLive = false, scrollUntil = 0, restAt = -1, lastRipple = 0, lastChar = 0, lastFlash = -Infinity;
    const mouse = { on: false, lastMove: -Infinity, sx: 0, sy: 0, tx: 0, ty: 0 };
    const ripples = [], chars = [], rings = [], flashes = [];
    // one row of nodes, seeded by its absolute row index, so the field is stable as you scroll
    const seedRow = (slot, row) => {
      rowOf[slot] = row; const o = slot * cols;
      for (let c = 0; c < cols; c++) {
        const i = o + c, r1 = hash(c, row, 1), r2 = hash(c, row, 2);
        if (r1 < 0.4) { kind[i] = 0; base[i] = r2 * 0.04; }                                   // barely there
        else if (r1 < 0.47) { kind[i] = hash(c, row, 3) < 0.3 ? 3 : 2; base[i] = 0.26 + r2 * 0.2; }   // bright (3 twinkles with a cross)
        else { kind[i] = 1; base[i] = 0.08 + r2 * 0.14; }                                    // faint
        const d = Math.sqrt(hash(c, row, 4)) * 11, a = hash(c, row, 5) * Math.PI * 2;
        jx[i] = Math.cos(a) * d; jy[i] = Math.sin(a) * d;
        twP[i] = 2000 + hash(c, row, 6) * 4000; twO[i] = hash(c, row, 7) * Math.PI * 2;
        spP[i] = 14000 + hash(c, row, 8) * 26000; spO[i] = hash(c, row, 9) * Math.PI; heat[i] = 0;
      }
    };
    const rowIdx = row => { const slot = ((row % rowsBuf) + rowsBuf) % rowsBuf; if (rowOf[slot] !== row) seedRow(slot, row); return slot * cols; };
    const visRows = () => [Math.floor(scroll / CELL) - 1, Math.ceil((scroll + H) / CELL) + 1];
    const resize = () => {
      W = document.documentElement.clientWidth; H = innerHeight; dpr = Math.min(2, devicePixelRatio || 1);
      for (const c of [field, burst]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      f.setTransform(dpr, 0, 0, dpr, 0, 0); u.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL) + 2; rowsBuf = Math.ceil(H / CELL) + 4; const n = cols * rowsBuf;
      rowOf = new Int32Array(rowsBuf).fill(-2147483648); heat = new Float32Array(n); jx = new Float32Array(n); jy = new Float32Array(n);
      base = new Float32Array(n); twP = new Float32Array(n); twO = new Float32Array(n); spP = new Float32Array(n); spO = new Float32Array(n); kind = new Uint8Array(n);
      scroll = scrollY * PARALLAX; wake(true);
    };
    // add heat around a point (page coordinates in field space): fn(distance) -> heat
    const warm = (x, y, r, fn) => {
      const [r0, r1] = visRows(), ra = Math.max(r0, Math.floor((y - r) / CELL)), rb = Math.min(r1, Math.ceil((y + r) / CELL));
      const ca = Math.max(0, Math.floor((x - r) / CELL)), cb = Math.min(cols - 1, Math.ceil((x + r) / CELL));
      for (let row = ra; row <= rb; row++) { const o = rowIdx(row), dy = row * CELL - y; for (let c = ca; c <= cb; c++) { const h = fn(Math.hypot(c * CELL - x, dy)), i = o + c; if (h > heat[i]) heat[i] = h; } }
    };
    const ringFn = (rad, w, k) => d => Math.max(0, 1 - Math.abs(d - rad) / w) * k;

    const drawField = (t, live) => {
      f.clearRect(0, 0, W, H); const [r0, r1] = visRows();
      f.beginPath();                                                       // the grid, all but invisible
      for (let c = 0; c < cols; c++) { const x = c * CELL + 0.5; f.moveTo(x, 0); f.lineTo(x, H); }
      for (let row = r0; row <= r1; row++) { const y = Math.round(row * CELL - scroll) + 0.5; f.moveTo(0, y); f.lineTo(W, y); }
      f.strokeStyle = GRID; f.globalAlpha = 0.035; f.lineWidth = 1; f.stroke();   // a touch more than bitgo.com's 0.012, so the grid reads
      if (live && maxHeat > 0.01) {                                        // warm grid edges light up, in 12 brightness bands
        const bands = Array.from({ length: 12 }, () => new Path2D()); let any = false;
        for (let row = r0; row <= r1; row++) {
          const o = rowIdx(row), on = row < r1 ? rowIdx(row + 1) : -1, y = Math.round(row * CELL - scroll) + 0.5;
          for (let c = 0; c < cols; c++) {
            const h = heat[o + c]; if (h < 0.01) continue; const x = c * CELL + 0.5;
            if (c + 1 < cols) { const e = Math.min(h, heat[o + c + 1]); if (e >= 0.01) { const p = bands[Math.min(11, Math.floor(e * 12))]; p.moveTo(x, y); p.lineTo(x + CELL, y); any = true; } }
            if (on >= 0) { const e = Math.min(h, heat[on + c]); if (e >= 0.01) { const p = bands[Math.min(11, Math.floor(e * 12))]; p.moveTo(x, y); p.lineTo(x, y + CELL); any = true; } }
          }
        }
        if (any) bands.forEach((p, k) => { f.globalAlpha = Math.min(1, (k + 0.5) / 12) * 0.18; f.stroke(p); });
      }
      const breathe = live ? 0.85 - 0.15 * Math.cos(t * Math.PI * 2 / 8000) : 0.85; let fill = '';
      for (let row = r0; row <= r1; row++) {
        const o = rowIdx(row), y0 = row * CELL - scroll;
        for (let c = 0; c < cols; c++) {
          const i = o + c, h = live ? heat[i] : 0; let a = base[i] * breathe * 0.8, tw = 1;
          if (live && a > 0.001) { tw = 0.65 + 0.35 * Math.sin(t * Math.PI * 2 / twP[i] + twO[i]); const sp = Math.sin(t * Math.PI / spP[i] + spO[i]) ** 40; a *= tw * (1 + 0.35 * sp); }
          const hot = Math.min(1, h * 0.99), alpha = 1 - (1 - a) * (1 - hot); if (alpha < 0.008) continue;
          const loose = 1 - Math.min(1, h / 0.4), x = c * CELL + jx[i] * loose, y = y0 + jy[i] * loose;       // heat pulls the star onto its node
          const k = kind[i] >= 2 ? 2 : 1, big = h > 0.32, s = big ? 3 : k + (2 - k) * Math.min(1, h / 0.32), col = big || hot > a ? BLUE : WHITE;
          if (col !== fill) { f.fillStyle = col; fill = col; }
          f.globalAlpha = alpha; f.fillRect(x - s / 2, y - s / 2, s, s);
          if (kind[i] === 3 && tw > 0.9 && !big) { f.globalAlpha = alpha * ((tw - 0.9) / 0.1); f.fillRect(x - 3, y - 0.5, 6, 1); f.fillRect(x - 0.5, y - 3, 1, 6); }
        }
      }
      if (chars.length) {
        f.font = `11px ${MONO}`; f.textAlign = 'center'; f.textBaseline = 'middle';
        for (const ch of chars) { const k = (t - ch.born) / ch.life; f.globalAlpha = 0.54 * Math.sin(Math.PI * Math.min(1, k)); f.fillStyle = ch.color; f.fillText(ch.char, ch.x, ch.y - scroll); }
      }
      f.globalAlpha = 1;
    };
    const drawBurst = t => {
      if (!burstLive && !flashes.length && !rings.length) return;
      u.clearRect(0, 0, W, H); burstLive = flashes.length + rings.length > 0; u.globalCompositeOperation = 'lighter';
      for (const e of flashes) {
        const k = Math.min(1, (t - e.born) / 320), r = 10 + 44 * (1 - (1 - k) ** 2), g = u.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
        g.addColorStop(0, 'rgb(79 157 255 / 100%)'); g.addColorStop(1, 'rgb(79 157 255 / 0%)'); u.globalAlpha = 0.07 * (1 - k); u.fillStyle = g; u.fillRect(e.x - r, e.y - r, r * 2, r * 2);
      }
      u.textAlign = 'center'; u.textBaseline = 'middle'; u.font = `10px ${MONO}`;
      for (const e of rings) {
        const k = (t - e.born) / 1400, d = e.far * k, a = (1 - 0.55 * k) * Math.min(1, (1 - k) / 0.15);
        for (let j = 0; j < e.angles.length; j++) {
          const x = e.x + Math.cos(e.angles[j]) * d, y = e.y - scroll + Math.sin(e.angles[j]) * d;
          if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
          u.globalAlpha = 0.11 * a; u.fillStyle = e.colors[j]; const ch = e.chars[j]; ch ? u.fillText(ch, x, y) : u.fillRect(x - 1, y - 1, 2, 2);
        }
      }
      u.globalCompositeOperation = 'source-over'; u.globalAlpha = 1;
    };
    const tick = t => {
      raf = 0; if (document.hidden) return;
      const step = Math.min(64, last ? t - last : 16); last = t;
      const s2 = scrollY * PARALLAX; if (s2 !== scroll) { scroll = s2; scrollUntil = t + 150; mouse.lastMove = t; }
      const moving = Math.abs(mouse.tx - mouse.sx) + Math.abs(mouse.ty - mouse.sy) > 0.3;
      if (!(maxHeat > 0.004 || moving || t < scrollUntil || ripples.length || chars.length || rings.length || flashes.length || burstLive) && t - lastDraw < 1000 / 18) { raf = requestAnimationFrame(tick); return; }
      const dt = Math.min(100, lastDraw ? t - lastDraw : step); lastDraw = t;
      const cool = 0.93 ** (dt / (1000 / 60)); maxHeat = 0;
      for (let i = 0; i < heat.length; i++) { const h = heat[i] * cool; heat[i] = h < 0.002 ? 0 : h; if (h > maxHeat) maxHeat = h; }
      if (mouse.on) {
        const k = follow(0.3, dt); mouse.sx += (mouse.tx - mouse.sx) * k; mouse.sy += (mouse.ty - mouse.sy) * k;
        const x = mouse.sx, y = mouse.sy + scroll, resting = t - mouse.lastMove > 250;
        if (resting && restAt < 0) { restAt = t; lastRipple = t - 1500; } if (!resting) restAt = -1;
        const r = resting ? 170 * (1 + 0.16 * Math.sin(t / 480)) : 170;
        warm(x, y, r, d => d < r ? (1 - d / r) ** 2 * 0.5 : 0);
        if (resting) {
          if (t - lastRipple >= 1500) { ripples.push({ born: t, x, y }); lastRipple = t; }
          if (t - lastChar >= 110) {
            lastChar = t; const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 136, c = Math.round((x + Math.cos(a) * d) / CELL), row = Math.round((y + Math.sin(a) * d) / CELL);
            if (c >= 0 && c < cols) chars.push({ born: t, char: pick(CHARS), color: BLUE, life: rand(700, 1300), x: c * CELL, y: row * CELL });
          }
        }
      }
      for (let n = ripples.length - 1; n >= 0; n--) { const e = ripples[n], r = (t - e.born) * 0.24; if (r > 300) { ripples.splice(n, 1); continue; } warm(e.x, e.y, r + 20, ringFn(r, 20, 0.3 * (1 - (r / 300) ** 2))); }
      for (let n = chars.length - 1; n >= 0; n--) if (t - chars[n].born > chars[n].life) chars.splice(n, 1);
      for (let n = rings.length - 1; n >= 0; n--) { const e = rings[n], k = (t - e.born) / 1400; if (k >= 1) { rings.splice(n, 1); continue; } const d = e.far * k; warm(e.x, e.y, d + 30, ringFn(d, 30, 0.25 * (1 - 0.55 * k))); }
      for (let n = flashes.length - 1; n >= 0; n--) if (t - flashes[n].born > 320) flashes.splice(n, 1);
      drawField(t, true); drawBurst(t); raf = requestAnimationFrame(tick);
    };
    // a click: nearby content brightens in a wave, nearest first
    const shimmer = (x, y, far) => {
      const seen = new Set(), list = [];
      for (const el of document.querySelectorAll(`main :is(${SEL}), header :is(${SEL}), footer :is(${SEL})`)) {
        const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue;
        list.push({ d: Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y), el }); seen.add(el);
      }
      list.filter(({ el }) => { for (let p = el.parentElement; p; p = p.parentElement) if (seen.has(p)) return false; return true; })
        .sort((a, b) => a.d - b.d).slice(0, 90)
        .forEach(({ d, el }) => el.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.06)', offset: 0.25 }, { filter: 'brightness(1)' }], { composite: 'add', delay: d / far * 1400, duration: 650, easing: 'ease-out' }));
    };
    let stillRaf = 0;
    const drawStill = () => { stillRaf = 0; scroll = scrollY * PARALLAX; drawField(0, false); };
    function wake(reset = false) {
      if (still()) { if (!stillRaf) stillRaf = requestAnimationFrame(drawStill); return; }
      if (reset) lastDraw = 0; if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); }
    }
    addEventListener('resize', resize, { passive: true });
    addEventListener('scroll', () => wake(), { passive: true });
    addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; if (!mouse.on) { mouse.sx = e.clientX; mouse.sy = e.clientY; } mouse.on = true; mouse.tx = e.clientX; mouse.ty = e.clientY; mouse.lastMove = performance.now(); wake(); }, { passive: true });
    document.addEventListener('pointerout', e => { if (!e.relatedTarget) mouse.on = false; }, { passive: true });
    addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      const t = performance.now(), x = e.clientX, y = e.clientY; flashes.push({ born: t, x, y });
      const far = Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y)), n = 44, angles = new Float32Array(n), cs = [], cols2 = [];
      for (let j = 0; j < n; j++) { angles[j] = j / n * Math.PI * 2 + rand(-0.05, 0.05); cs.push(j % 3 === 0 ? pick(CHARS) : ''); cols2.push(BLUE); }
      rings.push({ angles, born: t, chars: cs, colors: cols2, far, x, y: y + scroll }); if (rings.length > 5) rings.shift();
      if (t - lastFlash >= 250) { lastFlash = t; shimmer(x, y, far); }
      wake();
    }, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => wake(true));
    resize();
  }
  const field = document.getElementById('sf-field'), burst = document.getElementById('sf-burst');
  window.Starfield = { opacity(v) { if (field) field.style.opacity = v; } };
  if (field && burst) start(field, burst);
})();
