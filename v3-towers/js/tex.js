import * as THREE from 'three';

// Every texture here is drawn in code on a canvas. Nothing is fetched.
let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b) => a + rnd() * (b - a);
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, { srgb = false, rep = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = rep ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;
  return t;
}
export function rep(t, x, y) { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; }

// layered value noise, overlaid. Same idea as the pillar hall's concrete.
function noise(ctx, size, { octaves = 6, amp = 60 } = {}) {
  for (let o = 0; o < octaves; o++) {
    const n = Math.max(2, size >> (octaves - o + 1)); const [t, tx] = cv(n, n);
    const id = tx.createImageData(n, n);
    for (let i = 0; i < n * n; i++) { const v = 128 + (rnd() - 0.5) * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    tx.putImageData(id, 0, 0);
    ctx.globalAlpha = (amp / 255) * (0.55 + o * 0.09); ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(t, 0, 0, size, size);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

// ---- tower facades: colour map, roughness/metal map, emissive map (R lit, G pane id, B warm/cool) ----
export const PANE_W = 1.5, PANE_H = 3.2, TILE = 16;
const FACADES = {
  steel:  { mull: '#07090d', p0: '#16243a', p1: '#04060a', sp: '#05070a', lit: 0.07, hue: 0 },
  bronze: { mull: '#21150a', p0: '#4a3b2c', p1: '#120d08', sp: '#1a1008', lit: 0.12, hue: 0 },
  blue:   { mull: '#1647DB', p0: '#2a5cf0', p1: '#0c2a8c', sp: '#103bb8', lit: 0.20, hue: 1 },
  lit:    { mull: '#07090d', p0: '#1a2a44', p1: '#05080d', sp: '#05070a', lit: 0.66, hue: 0 },
  stone:  { stone: true, lit: 0.16 },
};
const cache = {};
export function facade(kind) {
  if (cache[kind]) return cache[kind];
  seed = 11 + kind.length * 7 + kind.charCodeAt(0);
  const cfg = FACADES[kind], W = 1024, H = 2048, PW = 64, PH = 128;
  const [c, x] = cv(W, H), [e, ex] = cv(W, H), [r, rx] = cv(W, H);
  if (cfg.stone) {
    x.fillStyle = '#b9ae9a'; x.fillRect(0, 0, W, H); noise(x, 1024, { octaves: 7, amp: 36 });
    for (let k = 0; k < 14000; k++) { x.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,255,255'},${R(.02, .06)})`; x.fillRect(rnd() * W, rnd() * H, R(1, 4), R(1, 4)); }
    // ashlar courses
    for (let y = 0; y < H; y += 32) { x.fillStyle = 'rgba(40,34,26,.35)'; x.fillRect(0, y, W, 1.5); const off = (y / 32) % 2 ? 0 : 64; for (let xx = off; xx < W; xx += 128) x.fillRect(xx, y, 1.5, 32); }
    // vertical piers between window bays (a dim rib)
    for (let i = 0; i < 16; i++) { x.fillStyle = 'rgba(255,248,230,.10)'; x.fillRect(i * PW, 0, 5, H); x.fillStyle = 'rgba(30,24,16,.25)'; x.fillRect(i * PW + 5, 0, 2, H); }
    rx.fillStyle = 'rgb(0,225,0)'; rx.fillRect(0, 0, W, H);
  } else {
    x.fillStyle = cfg.mull; x.fillRect(0, 0, W, H);
    rx.fillStyle = 'rgb(0,175,70)'; rx.fillRect(0, 0, W, H);
  }
  ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
  for (let j = 0; j < 16; j++) {
    const rowBias = Math.pow(rnd(), 1.4) * 1.8 + 0.1;
    for (let i = 0; i < 16; i++) {
      const px = i * PW, py = j * PH;
      let wx, wy, ww, wh;
      if (cfg.stone) { wx = px + 14; wy = py + 18; ww = PW - 28; wh = PH - 50; } else { wx = px + 3; wy = py + 3; ww = PW - 6; wh = PH - 6; }
      if (!cfg.stone) {
        const g = x.createLinearGradient(0, wy, 0, wy + wh); const v = R(-.12, .12);
        g.addColorStop(0, cfg.p0); g.addColorStop(1, cfg.p1); x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
        if (v > 0) { x.fillStyle = `rgba(255,255,255,${v * .08})`; x.fillRect(wx, wy, ww, wh); }
        x.fillStyle = cfg.sp; x.fillRect(wx, wy + wh * 0.78, ww, wh * 0.22); // spandrel band
        rx.fillStyle = 'rgb(0,22,120)'; rx.fillRect(wx, wy, ww, wh * 0.78);
      } else {
        const g = x.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#20293a'); g.addColorStop(1, '#090c12');
        x.fillStyle = 'rgba(20,16,10,.5)'; x.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
        x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
        x.fillStyle = 'rgba(255,248,232,.38)'; x.fillRect(wx - 5, wy + wh + 3, ww + 10, 5); // sill
        x.fillStyle = 'rgba(255,248,232,.22)'; x.fillRect(wx - 4, wy - 7, ww + 8, 4);        // lintel
        rx.fillStyle = 'rgb(0,40,160)'; rx.fillRect(wx, wy, ww, wh);
      }
      const lit = rnd() < cfg.lit * rowBias;
      const warm = rnd() < 0.8 ? 0 : 255;
      const id = 30 + Math.floor(rnd() * 225);
      const lh = cfg.stone ? wh : wh * 0.78;
      const lv = lit ? Math.floor(R(90, 210)) : 0;
      const eg = ex.createLinearGradient(0, wy, 0, wy + lh); eg.addColorStop(0, `rgb(${lv},${id},${warm})`); eg.addColorStop(1, `rgb(${Math.floor(lv * .45)},${id},${warm})`);
      ex.fillStyle = eg; ex.fillRect(wx, wy, ww, lh);
    }
  }
  const out = { map: tex(c, { srgb: true }), rm: tex(r), em: tex(e) };
  return (cache[kind] = out);
}

// ---- stone, marble, pavers, coffers ----
export function ashlar() {
  seed = 5; const S = 1024; const [c, x] = cv(S, S);
  x.fillStyle = '#c9bfab'; x.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 128) for (let xx = (y / 128) % 2 ? 128 : 0; xx < S + 256; xx += 256) { const t = R(-.08, .08); x.fillStyle = `rgba(${t > 0 ? '255,248,232' : '40,30,18'},${Math.abs(t)})`; x.fillRect(xx - 256, y, 256, 128); }
  noise(x, S, { octaves: 8, amp: 46 });
  for (let k = 0; k < 20000; k++) { x.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,255,255'},${R(.02, .07)})`; x.fillRect(rnd() * S, rnd() * S, R(1, 3), R(1, 3)); }
  const [b, bx] = cv(S, S); bx.drawImage(c, 0, 0);
  for (let y = 0; y < S; y += 128) { bx.fillStyle = 'rgba(0,0,0,.85)'; bx.fillRect(0, y, S, 5); for (let xx = (y / 128) % 2 ? 128 : 0; xx < S + 256; xx += 256) bx.fillRect(xx - 256, y, 5, 128); }
  x.fillStyle = 'rgba(30,22,12,.4)';
  for (let y = 0; y < S; y += 128) { x.fillRect(0, y, S, 3); for (let xx = (y / 128) % 2 ? 128 : 0; xx < S + 256; xx += 256) x.fillRect(xx - 256, y, 3, 128); }
  return { map: tex(c, { srgb: true }), bump: tex(b) };
}
export function checker(a, b2, veins = true) {
  seed = 9; const S = 1024, N = 8, T = S / N; const [c, x] = cv(S, S);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { x.fillStyle = (i + j) % 2 ? b2 : a; x.fillRect(i * T, j * T, T, T); }
  noise(x, S, { octaves: 6, amp: 34 });
  if (veins) for (let k = 0; k < 90; k++) { x.strokeStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},${R(.03, .1)})`; x.lineWidth = R(.5, 2); x.beginPath(); let px = rnd() * S, py = rnd() * S; x.moveTo(px, py); for (let s = 0; s < 6; s++) { px += R(-80, 80); py += R(-80, 80); x.lineTo(px, py); } x.stroke(); }
  x.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i <= N; i++) { x.fillRect(i * T - 1, 0, 2, S); x.fillRect(0, i * T - 1, S, 2); }
  return tex(c, { srgb: true });
}
export function pavers() {
  seed = 21; const S = 512; const [c, x] = cv(S, S);
  x.fillStyle = '#8c8a86'; x.fillRect(0, 0, S, S);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const t = R(-.08, .08); x.fillStyle = `rgba(${t > 0 ? '255,255,255' : '0,0,0'},${Math.abs(t)})`; x.fillRect(i * 128, j * 128, 128, 128); }
  noise(x, S, { octaves: 6, amp: 50 });
  x.fillStyle = 'rgba(0,0,0,.45)'; for (let i = 0; i < 4; i++) { x.fillRect(i * 128, 0, 2, S); x.fillRect(0, i * 128, S, 2); }
  return tex(c, { srgb: true });
}
export function asphalt() {
  seed = 33; const S = 512; const [c, x] = cv(S, S);
  x.fillStyle = '#2a2d34'; x.fillRect(0, 0, S, S); noise(x, S, { octaves: 7, amp: 70 });
  for (let k = 0; k < 9000; k++) { x.fillStyle = `rgba(255,255,255,${R(.02, .08)})`; x.fillRect(rnd() * S, rnd() * S, 1.5, 1.5); }
  return tex(c, { srgb: true });
}
export function concrete() {
  seed = 7; const S = 1024; const [c, x] = cv(S, S);
  x.fillStyle = '#8a8c92'; x.fillRect(0, 0, S, S); noise(x, S, { octaves: 8, amp: 40 });
  for (let i = 0; i < 70; i++) { const px = rnd() * S, w = 1 + rnd() * 5; const g = x.createLinearGradient(0, 0, 0, S); const a = .03 + rnd() * .07; g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(rnd(), 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a * .6})`); x.fillStyle = g; x.fillRect(px, 0, w, S); }
  for (let y = 0; y < S; y += S / 4) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, y, S, 2); }
  return tex(c, { srgb: true });
}
export function steelPlate() {
  seed = 4; const S = 512; const [c, x] = cv(S, S);
  x.fillStyle = '#8b9099'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},${R(.02, .08)})`; x.fillRect(0, rnd() * S, S, R(.5, 2)); }
  noise(x, S, { octaves: 5, amp: 24 });
  return tex(c, { srgb: true });
}
// warm coffered ceiling: returns {map (dark beams), em (lit squares)}
export function coffer(N = 4) {
  const S = 512; const [c, x] = cv(S, S), [e, ex] = cv(S, S); const T = S / N;
  x.fillStyle = '#0a0b0f'; x.fillRect(0, 0, S, S); ex.fillStyle = '#000'; ex.fillRect(0, 0, S, S);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const g = ex.createLinearGradient(0, j * T, 0, (j + 1) * T); g.addColorStop(0, '#ffc27a'); g.addColorStop(1, '#ff9a42');
    ex.fillStyle = g; ex.fillRect(i * T + 10, j * T + 10, T - 20, T - 20);
    x.fillStyle = '#c99a62'; x.fillRect(i * T + 10, j * T + 10, T - 20, T - 20);
  }
  return { map: tex(c, { srgb: true }), em: tex(e, { srgb: true }) };
}
export function glow() {
  const S = 128; const [c, x] = cv(S, S); const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,255,255,.55)'); g.addColorStop(.5, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S); return tex(c, { srgb: true, rep: false });
}
export function blueEnamel() {
  const [c, x] = cv(4, 256); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#1b52ee'); g.addColorStop(.5, '#1647DB'); g.addColorStop(1, '#0f33a6');
  x.fillStyle = g; x.fillRect(0, 0, 4, 256); return tex(c, { srgb: true, rep: false });
}
export function shopfront() {
  seed = 61; const [c, x] = cv(1024, 128);
  x.fillStyle = '#0b0c10'; x.fillRect(0, 0, 1024, 128);
  for (let i = 0; i < 8; i++) {
    const g = x.createLinearGradient(0, 20, 0, 118); g.addColorStop(0, '#ffd8a0'); g.addColorStop(1, '#ff9c4a');
    x.fillStyle = rnd() < .85 ? g : '#2a2118'; x.fillRect(i * 128 + 10, 18, 108, 100);
    x.fillStyle = '#0b0c10'; x.fillRect(i * 128 + 64 - 2, 18, 4, 100);
  }
  return tex(c, { srgb: true });
}
// LED ticker: amber text on black, drawn at high resolution, sampled coarsely by the shader
export function ticker(lines) {
  const W = 4096, H = 128; const [c, x] = cv(W, H); x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#fff'; x.font = '700 78px "Libre Franklin", system-ui, sans-serif'; x.textBaseline = 'middle';
  let px = 30; let i = 0;
  while (px < W - 400) {
    const t = lines[i++ % lines.length].toUpperCase(); const w = x.measureText(t).width;
    if (px + w > W - 150) break; x.fillText(t, px, H / 2 + 3); px += w;
    x.fillRect(px + 60, H / 2 - 8, 16, 16); px += 140;
  }
  const t = tex(c); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t;
}
export function logoCanvasTex(cb) {
  const img = new Image(); img.onload = () => { const [c, x] = cv(1084, 368); x.drawImage(img, 0, 0, 1084, 368); const t = tex(c, { srgb: true, rep: false }); cb(t); }; img.src = '../shared/assets/bitgo-logo.svg';
}
export function flutes() {
  seed = 77; const [c, x] = cv(512, 64);
  x.fillStyle = '#cfc5b2'; x.fillRect(0, 0, 512, 64); noise(x, 512, { octaves: 6, amp: 30 });
  for (let i = 0; i < 24; i++) { const g = x.createLinearGradient(i * 21.3, 0, i * 21.3 + 21.3, 0); g.addColorStop(0, 'rgba(0,0,0,.34)'); g.addColorStop(.3, 'rgba(0,0,0,0)'); g.addColorStop(.75, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.34)'); x.fillStyle = g; x.fillRect(i * 21.3, 0, 21.4, 64); }
  return tex(c, { srgb: true });
}
