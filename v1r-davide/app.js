import { build } from './dom.js';
build();

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const COL = { blue: '#1647DB', navy: '#030719', ice: '#e8eeff', ink: '#02040c' };
let vw = innerWidth, vh = innerHeight;
const phone = () => vw < 760;

/* ---------- nav ---------- */
const nav = $('#nav');
$$('.menu>li').forEach(li => {
  const b = li.firstElementChild;
  li.addEventListener('mouseenter', () => { if (vw > 1000) { $$('.menu>li').forEach(x => x.classList.remove('open')); li.classList.add('open'); } });
  li.addEventListener('mouseleave', () => { if (vw > 1000) li.classList.remove('open'); });
  b.addEventListener('click', () => { const o = li.classList.contains('open'); $$('.menu>li').forEach(x => x.classList.remove('open')); if (!o) li.classList.add('open'); });
});
$('#burger').addEventListener('click', () => nav.classList.toggle('menu-open'));

/* ---------- word reveal for headings ---------- */
const wordEls = $$('[data-words]').map(el => {
  const words = el.textContent.split(' ');
  el.setAttribute('aria-label', el.textContent);
  el.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${w} </span>`).join('');
  return { el, ws: $$('.w', el) };
});
function updateWords() {
  for (const { el, ws } of wordEls) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh) continue;
    const p = clamp((vh * 0.92 - r.top) / (vh * 0.5));
    ws.forEach((w, i) => w.classList.toggle('on', i / ws.length < p * 1.08));
  }
}
if (RM) wordEls.forEach(o => o.ws.forEach(w => w.classList.add('on')));

/* ---------- reveal / in-view ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
$$('.rv,[data-badge]').forEach((el, i) => { el.style.transitionDelay = (el.classList.contains('card') || el.classList.contains('vid') ? (i % 3) * 0.12 : 0) + 's'; io.observe(el); });

/* ---------- own items focus ---------- */
const ownItems = $$('[data-own]');
function updateOwn() {
  if (phone()) return;
  ownItems.forEach(el => {
    const r = el.getBoundingClientRect();
    const m = Math.abs((r.top + r.height / 2) - vh * 0.5);
    el.classList.toggle('on', m < vh * 0.26);
  });
}

/* ---------- tile wipes ---------- */
const strips = $$('.wipe').map(el => {
  const prev = el.previousElementSibling;
  const from = getComputedStyle(prev).backgroundColor;
  el.style.background = from;
  return { el, to: COL[el.dataset.to], mode: el.dataset.mode, tiles: [], rect: null, last: [] };
});
function layoutStrips() {
  for (const s of strips) {
    s.el.innerHTML = '';
    const cols = phone() ? 6 : vw > 1900 ? 18 : 14;
    const size = vw / cols;
    const rows = Math.ceil(s.el.clientHeight / size);
    s.tiles = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = document.createElement('i');
      i.style.cssText = `left:${c * size - .5}px;top:${r * size - .5}px;width:${size + 1}px;height:${size + 1}px;background:${s.to}`;
      s.el.appendChild(i);
      let th = Math.random();
      if (s.mode === 'diag') th = (c / cols * 0.7 + r / rows * 0.3) * 0.8 + Math.random() * 0.2;
      if (s.mode === 'cols') th = (c % 2 ? c / cols : 1 - c / cols) * 0.6 + Math.random() * 0.4;
      s.tiles.push({ i, th, v: -1 });
    }
  }
}
function updateStrips() {
  for (const s of strips) {
    const r = s.el.getBoundingClientRect();
    if (r.bottom < -10 || r.top > vh + 10) continue;
    const p = clamp((vh * 0.9 - r.top) / (r.height + vh * 0.45));
    for (const t of s.tiles) {
      let v = clamp((p * 1.7 - t.th * 0.7) * 3);
      v = Math.round(v * 20) / 20;
      if (v !== t.v) { t.v = v; t.i.style.opacity = v; t.i.style.transform = `scale(${v})`; }
    }
  }
}

/* ---------- hero word rotate ---------- */
const rot = $$('.hero h1 .rot span');
if (!RM) {
  let k = 0;
  setInterval(() => {
    const cur = rot[k]; k = (k + 1) % rot.length; const nx = rot[k];
    cur.classList.remove('on'); cur.classList.add('out');
    nx.style.transition = 'none'; nx.classList.remove('out'); void nx.offsetWidth; nx.style.transition = ''; nx.classList.add('on');
    setTimeout(() => { cur.classList.remove('out'); }, 900);
  }, 2600);
}

/* ---------- nav theme (solid after hero) ---------- */
function updateNav() { nav.classList.toggle('solid', scrollY > vh * 0.6); }

/* ---------- 2D canvases ---------- */
function mk2d(canvas, dprMax = 1.5) {
  const ctx = canvas.getContext('2d');
  const o = { canvas, ctx, w: 0, h: 0, vis: false, dpr: 1 };
  const fit = () => {
    o.dpr = Math.min(devicePixelRatio || 1, dprMax);
    const r = canvas.getBoundingClientRect();
    o.w = Math.max(2, r.width); o.h = Math.max(2, r.height);
    canvas.width = o.w * o.dpr; canvas.height = o.h * o.dpr;
    ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
    o.resized && o.resized();
  };
  new ResizeObserver(fit).observe(canvas);
  new IntersectionObserver(es => { o.vis = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
  fit();
  return o;
}

// own: dense white particle streams riding sine rails
const own = mk2d($('#c-own'), 1);
const ownP = Array.from({ length: 900 }, () => ({ r: Math.floor(Math.random() * 9), u: Math.random(), s: 0.03 + Math.random() * 0.09, j: (Math.random() - .5) * 2, a: 0.25 + Math.random() * 0.75 }));
function railY(r, x, t, h, sc) {
  const k = (r - 4) / 4;
  const f = x / own.w;
  return h * (0.5 + k * 0.34 * (0.5 + 0.5 * Math.sin(f * 3.2 + t * .15 + r))) + Math.sin(f * 5 + r * 1.7 + t * .3) * h * 0.06 + sc * k * h * 0.2 * Math.sin(f * 6.28 - 1.0);
}
function drawOwn(t) {
  const { ctx, w, h } = own;
  ctx.fillStyle = 'rgba(22,71,219,0.38)'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1;
  for (let r = 0; r < 9; r++) { ctx.beginPath(); for (let x = 0; x <= w; x += 40) { const y = railY(r, x, t, h, Math.sin(scrollY * 0.002)); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  const sc = Math.sin(scrollY * 0.002);
  ctx.fillStyle = '#fff';
  for (const p of ownP) {
    p.u += p.s * 0.012 * (RM ? 0 : 1);
    if (p.u > 1) p.u = 0;
    const x = p.u * w;
    const y = railY(p.r, x, t, h, sc) + p.j * (6 + 8 * Math.abs(Math.sin(p.u * 3 + p.r)));
    ctx.globalAlpha = p.a * (0.35 + 0.65 * Math.sin(p.u * Math.PI));
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

// support: 24 hour ring that never stops
const clock = mk2d($('#c-clock'), 2);
function drawClock(t) {
  const { ctx, w, h } = clock; ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.47;
  const sweep = (t * 0.35) % (Math.PI * 2);
  for (let ring = 0; ring < 3; ring++) {
    const n = 24 * (ring + 1), r0 = R * (0.62 + ring * 0.13), len = R * (0.1 - ring * 0.012);
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 - Math.PI / 2;
      let d = (a + Math.PI / 2 - sweep) % (Math.PI * 2); if (d < 0) d += Math.PI * 2;
      const trail = Math.exp(-d * 1.1 + 0);
      const lit = d < 0.06 ? 1 : trail;
      ctx.strokeStyle = `rgba(${lerp(60, 255, lit) | 0},${lerp(110, 255, lit) | 0},255,${0.22 + 0.78 * lit})`;
      ctx.lineWidth = ring === 0 ? 3 : 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * (r0 + len * (1 + lit * 0.9)), cy + Math.sin(a) * (r0 + len * (1 + lit * 0.9)));
      ctx.stroke();
    }
  }
  // seven day nodes on the inner circle
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 - Math.PI / 2 + t * 0.05;
    ctx.fillStyle = '#4d7cff'; ctx.shadowColor = '#4d7cff'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 0.4, cy + Math.sin(a) * R * 0.4, 5, 0, 7); ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(77,124,255,.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.4, 0, 7); ctx.stroke();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.3);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.25, 'rgba(77,124,255,.55)'); g.addColorStop(1, 'rgba(22,71,219,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.3, 0, 7); ctx.fill();
}

// cta: flows converge on the button
const cta = mk2d($('#c-cta'), 1.5);
function drawCta(t) {
  const { ctx, w, h } = cta; ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.72;
  const n = 11;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const sx = side < 0 ? -20 : w + 20, sy = h * (0.06 + (i / n) * 0.8);
    const c1x = lerp(sx, cx, 0.5), c1y = sy, c2x = lerp(sx, cx, 0.75), c2y = cy + (sy - cy) * 0.1;
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(c1x, c1y, c2x, c2y, cx, cy); ctx.stroke();
    // light pulse
    const u = ((t * (0.12 + i * 0.011) + i * .37) % 1);
    const bz = (a, b, c, d, k) => (1 - k) ** 3 * a + 3 * (1 - k) ** 2 * k * b + 3 * (1 - k) * k * k * c + k ** 3 * d;
    for (let s = 0; s < 14; s++) {
      const k = clamp(u - s * 0.012);
      const x = bz(sx, c1x, c2x, cx, k), y = bz(sy, c1y, c2y, cy, k);
      ctx.fillStyle = `rgba(255,255,255,${(1 - s / 14) * 0.95})`;
      ctx.beginPath(); ctx.arc(x, y, 2.2 - s * 0.1, 0, 7); ctx.fill();
    }
  }
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
  g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 120, 0, 7); ctx.fill();
}

/* ---------- WebGL ---------- */
let THREE, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
let hero = null, core = null;

function makeStage(canvas, camOpts, bloom, bg) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  const camera = new THREE.PerspectiveCamera(camOpts.fov, 1, 0.1, 100);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bp = new UnrealBloomPass(new THREE.Vector2(256, 256), bloom[0], bloom[1], bloom[2]);
  composer.addPass(bp); composer.addPass(new OutputPass());
  const st = { renderer, camera, scene, composer, bp, vis: true, w: 1, h: 1, onResize: null };
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    st.w = Math.max(2, r.width); st.h = Math.max(2, r.height);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr); renderer.setSize(st.w, st.h, false); composer.setPixelRatio(dpr); composer.setSize(st.w, st.h);
    camera.aspect = st.w / st.h; camera.updateProjectionMatrix();
    st.onResize && st.onResize();
  };
  new ResizeObserver(fit).observe(canvas);
  new IntersectionObserver(es => { st.vis = es[0].isIntersecting; }, { rootMargin: '50px' }).observe(canvas);
  fit();
  return st;
}

/* hero: the rail */
function initHero() {
  const canvas = $('#c-hero');
  const st = makeStage(canvas, { fov: 38 }, [0.85, 0.6, 0.2], 0x02040c);
  const { scene, camera } = st;
  const pts = [[10, -7, 3], [6.5, -3.6, 1], [3, -3.2, -1.5], [-.5, -1.6, -2.6], [-2.6, .6, -2.2], [-.8, 2.6, -1.4], [3, 3.1, -.2], [6.4, 5, 1.2], [10, 8.4, 3.5]].map(a => new THREE.Vector3(...a));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .5);
  const N = 230, RS = 6;
  const fr = curve.computeFrenetFrames(N, false);
  const pos = [], aT = [], aK = [];
  const push = (a, b, ta, tb, k) => { pos.push(a.x, a.y, a.z, b.x, b.y, b.z); aT.push(ta, tb); aK.push(k, k); };
  const corner = (i) => {
    const t = i / N, p = curve.getPointAt(t);
    const tw = t * 9.5 + Math.sin(t * 7) * .6, c = Math.cos(tw), s = Math.sin(tw);
    const n = fr.normals[i], b = fr.binormals[i];
    const u = n.clone().multiplyScalar(c).addScaledVector(b, s), v = b.clone().multiplyScalar(c).addScaledVector(n, -s);
    const w = .46 * (1 + .3 * Math.sin(t * 11 + 1)), hh = .27 * (1 + .25 * Math.cos(t * 8));
    return { p, c: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => p.clone().addScaledVector(u, x * w).addScaledVector(v, y * hh)) };
  };
  const st0 = []; for (let i = 0; i <= N; i++) st0.push(corner(i));
  for (let i = 0; i < N; i++) {
    const a = st0[i], b = st0[i + 1], ta = i / N, tb = (i + 1) / N;
    for (let k = 0; k < 4; k++) push(a.c[k], b.c[k], ta, tb, 0);
    push(a.p, b.p, ta, tb, 1);
    if (i % RS === 0) { for (let k = 0; k < 4; k++) push(a.c[k], a.c[(k + 1) % 4], ta, ta, 2); }
    if (i % RS === 0 && i + RS <= N) {
      const e = st0[i + RS];
      for (let k = 0; k < 4; k++) push(a.c[k], e.c[(k + 1) % 4], ta, (i + RS) / N, 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScroll: { value: 0 } },
    vertexShader: `attribute float aT; attribute float aK; varying float vT; varying float vK; varying float vD;
      void main(){ vT=aT; vK=aK; vec4 mv=modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTime; varying float vT; varying float vK; varying float vD;
      void main(){
        float pulse=0.;
        for(int k=0;k<5;k++){ float fk=float(k); float d=fract(uTime*(0.03+0.011*fk)+fk*0.21-vT); pulse+=exp(-d*34.)*(1.0-step(.45,d)); }
        pulse=min(pulse,1.6);
        vec3 blue=vec3(.17,.36,1.); vec3 white=vec3(.9,.95,1.);
        float base = vK<.5?0.5:(vK<1.5?0.9:(vK<2.5?0.7:0.32));
        vec3 col=mix(blue*base, white, clamp(pulse*(vK<1.5?1.0:.6),0.,1.));
        col+=blue*pulse*.8;
        float depth=smoothstep(26.,7.,vD)*.8+.2;
        float ends=smoothstep(0.,.05,vT)*smoothstep(1.,.93,vT);
        gl_FragColor=vec4(col*depth*ends*(0.7+pulse*0.6),1.);
      }`
  });
  const rail = new THREE.LineSegments(g, mat);
  const grp = new THREE.Group(); grp.add(rail); scene.add(grp);
  // faint dust around the rail
  const dp = []; for (let i = 0; i < 900; i++) { const q = curve.getPointAt(Math.random()); dp.push(q.x + (Math.random() - .5) * 5, q.y + (Math.random() - .5) * 4, q.z + (Math.random() - .5) * 5); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: .035, color: 0x6f95ff, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
  grp.add(dust);
  grp.position.set(1.1, 0, 0);
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { mouse.x = e.clientX / vw - .5; mouse.y = e.clientY / vh - .5; });
  st.onResize = () => { camera.position.set(0, 0, 10); if (st.w < 760) { grp.position.set(0, 1.4, 0); camera.fov = 52; } else { grp.position.set(1.4, 0, 0); camera.fov = 38; } camera.updateProjectionMatrix(); };
  st.onResize();
  hero = { st, mat, grp, camera, mouse, render(t) {
    const s = clamp(scrollY / vh);
    mat.uniforms.uTime.value = RM ? 5 : t;
    mouse.sx += (mouse.x - mouse.sx) * .05; mouse.sy += (mouse.y - mouse.sy) * .05;
    grp.rotation.y = -.35 + mouse.sx * .25 + s * .6;
    grp.rotation.x = mouse.sy * .15 - s * .1;
    camera.position.z = 10 - s * 3.5;
    camera.position.y = s * 1.0;
    camera.lookAt(0, s * 0.8, 0);
    st.composer.render();
  } };
}

/* core: five flows converge on one point */
function initCore() {
  const canvas = $('#c-core');
  const st = makeStage(canvas, { fov: 42 }, [0.9, 0.6, 0.2], 0x030719);
  const { scene, camera } = st;
  const items = $$('.core-item'), labs = $$('.core-lab'), listBtns = $$('.core-list button');
  const headEl = $('[data-core-head]');
  const headWords = headEl.textContent.split(' ');
  headEl.innerHTML = headWords.map(w => `<span class="w" aria-hidden="true">${w} </span>`).join('');
  const hw = $$('.w', headEl);
  const lgs = items.map(it => { const el = $('[data-lg]', it); const ws = el.textContent.split(' '); el.setAttribute('aria-label', el.textContent); el.innerHTML = ws.map(w => `<span class="w" aria-hidden="true">${w} </span>`).join(''); return $$('.w', el); });
  const logo = $('.core-logo');
  const grp = new THREE.Group(); scene.add(grp);
  const NC = 5, curves = [], mats = [], starts = [];
  const mkMat = (seed) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uDraw: { value: 0 }, uAct: { value: .3 }, uTime: { value: 0 }, uSeed: { value: seed } },
    vertexShader: `varying float vU; varying vec3 vN; void main(){ vU=uv.x; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uDraw,uAct,uTime,uSeed; varying float vU; varying vec3 vN;
      void main(){
        float reveal=smoothstep(uDraw,uDraw-.04,vU); if(reveal<=0.) discard;
        float ndv=abs(vN.z); float core=pow(ndv,1.5);
        float h=fract(uTime*.1+uSeed); float d=h-vU; d+=step(d,0.)*1.; float pulse=exp(-d*14.);
        float grad=.25+.75*pow(vU,1.6);
        vec3 blue=vec3(.18,.38,1.), white=vec3(.92,.96,1.);
        vec3 col=mix(blue,white,clamp(pulse*.9+pow(vU,6.)*.8,0.,1.));
        float a=(.22+.78*uAct)*grad*(.35+.65*core)+pulse*uAct*.9;
        gl_FragColor=vec4(col*a*0.9*reveal,1.);
      }`
  });
  for (let i = 0; i < NC; i++) {
    const y0 = [-3.0, -1.5, 0.1, 1.6, 3.0][i], z0 = [-3.2, 2.8, -1.2, 3.4, -3.6][i], x0 = -8.2 - (i % 2) * .8;
    const P = [];
    for (let k = 0; k <= 8; k++) {
      const f = k / 8, e = f * f * (3 - 2 * f), q = 1 - f;
      P.push(new THREE.Vector3(lerp(x0, 0, Math.pow(f, .85)), lerp(y0, 0, e) + Math.sin(f * 4.2 + i * 1.3) * q * 1.3, lerp(z0, 0, f) + Math.sin(f * 3 + i * 2) * q * 1.6));
    }
    P[P.length - 1].set(0, 0, 0);
    const c = new THREE.CatmullRomCurve3(P, false, 'catmullrom', .5);
    const m = mkMat(i * .21); mats.push(m); curves.push(c);
    grp.add(new THREE.Mesh(new THREE.TubeGeometry(c, 260, .03, 6, false), m));
  }
  // particles streaming along each curve toward the point
  const PN = 150, pPos = new Float32Array(NC * PN * 3), pU = new Float32Array(NC * PN), pS = new Float32Array(NC * PN);
  for (let i = 0; i < NC * PN; i++) { pU[i] = Math.random(); pS[i] = .04 + Math.random() * .08; }
  const dc = document.createElement('canvas'); dc.width = dc.height = 32; const dx = dc.getContext('2d'); const dg2 = dx.createRadialGradient(16, 16, 0, 16, 16, 16); dg2.addColorStop(0, '#fff'); dg2.addColorStop(.4, 'rgba(255,255,255,.6)'); dg2.addColorStop(1, 'rgba(255,255,255,0)'); dx.fillStyle = dg2; dx.fillRect(0, 0, 32, 32);
  const dotTex = new THREE.CanvasTexture(dc);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: .16, map: dotTex, color: 0xb9ceff, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending }));
  grp.add(pts);
  // the point
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const cx = cv.getContext('2d');
  const gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.15, 'rgba(190,210,255,.9)'); gr.addColorStop(.45, 'rgba(60,110,255,.35)'); gr.addColorStop(1, 'rgba(22,71,219,0)');
  cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  grp.add(spr);
  const tmp = new THREE.Vector3();
  const place = () => { // shift the convergence point on screen
    const ph = phone();
    const dx = ph ? 0 : (0.42 - .5) * st.w, dy = ph ? (0.34 - .5) * st.h : (0.47 - .5) * st.h;
    camera.setViewOffset(st.w, st.h, -dx, -dy, st.w, st.h);
    st.bp.strength = ph ? 0.45 : 0.9;
  };
  st.onResize = place; place();
  const el = $('#core');
  let active = -1;
  const labT = [.3, .3, .3, .3, .3];
  let avCache = null, avAt = 0;
  const avoid = () => { // boxes the chips must stay out of: heading, service list, text block
    const n = performance.now();
    if (!avCache || n - avAt > 600) {
      avAt = n; const o = st.renderer.domElement.getBoundingClientRect();
      avCache = [headEl, $('.core-list'), $('.core-item.on')].filter(e => e && e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return { l: r.left - o.left - 8, r: r.right - o.left + 8, t: r.top - o.top - 8, b: r.bottom - o.top + 8 }; });
    }
    return avCache;
  };
  core = { st, render(t) {
    const r = el.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - vh));
    // phases: intro 0-.1 | items .1-.9 | resolve .9-1
    const ip = clamp((p - .1) / .8) * NC;
    const idx = p < .09 ? -1 : Math.min(NC - 1, Math.floor(ip));
    const local = p < .09 ? 0 : clamp(ip - idx);
    if (idx !== active) { active = idx; items.forEach((e, i) => e.classList.toggle('on', i === idx)); labs.forEach((e, i) => e.classList.toggle('on', i === idx)); listBtns.forEach((e, i) => e.classList.toggle('on', i === idx)); }
    const res = sstep(.88, .97, p);
    hw.forEach((w, i) => w.classList.toggle('on', i / hw.length < clamp(p / .07) * 1.05));
    if (idx >= 0) { const q = clamp((local - .08) / .55); lgs[idx].forEach((w, i) => w.classList.toggle('on', i / lgs[idx].length < q * 1.05)); }
    for (let i = 0; i < NC; i++) {
      const m = mats[i].uniforms;
      m.uDraw.value = clamp((p / .09) * 1.15 - i * .08, 0, 1.05);
      const tgt = res > 0 ? lerp(idx === i ? 1 : .35, .9, res) : (idx < 0 ? .5 : (idx === i ? 1 : .16));
      m.uAct.value += (tgt - m.uAct.value) * .12;
      m.uTime.value = RM ? 3 : t;
    }
    // particles
    const arr = pg.attributes.position.array;
    for (let i = 0; i < NC * PN; i++) {
      pU[i] += pS[i] * .01 * (RM ? 0 : 1); if (pU[i] > 1) pU[i] = 0;
      const c = curves[(i / PN) | 0]; c.getPoint(pU[i], tmp);
      arr[i * 3] = tmp.x + Math.sin(i * 7.1) * .05; arr[i * 3 + 1] = tmp.y + Math.cos(i * 3.3) * .05; arr[i * 3 + 2] = tmp.z;
    }
    pg.attributes.position.needsUpdate = true;
    pts.material.opacity = .25 + .6 * clamp(p / .1);
    // camera: dolly + orbit
    const ang = lerp(-.4, .4, p) + Math.sin(t * .1) * .03;
    const dist = lerp(15.5, 12.5, sstep(0, .1, p)) - res * 2 + (phone() ? 4 : 0);
    camera.position.set(Math.sin(ang) * dist, lerp(1.6, .2, p), Math.cos(ang) * dist);
    camera.lookAt(0, 0, 0);
    const s = (1.1 + .35 * Math.sin(t * 2)) * (.7 + res * 1.6) * (.4 + .6 * clamp(p / .1)) * (phone() ? .55 : 1);
    spr.scale.set(s, s, 1);
    st.renderer.getSize(tmpV);
    const W = st.w, H = st.h;
    // labels at curve ends
    const boxes = labs.map((lb, i) => {
      curves[i].getPoint(labT[i], tmp); tmp.project(camera);
      const lw = lb.offsetWidth, lh = lb.offsetHeight;
      let X = clamp((tmp.x * .5 + .5) * W, 14, W - lw - 14), Y = clamp((-tmp.y * .5 + .5) * H, 100, H - lh - 14);
      for (const bx of avoid()) if (X < bx.r && X + lw > bx.l && Y < bx.b && Y + lh > bx.t) Y = (Y + lh / 2 < (bx.t + bx.b) / 2 && bx.t - lh - 10 > 96) ? bx.t - lh - 10 : bx.b + 10;
      return { lb, X, Y, lw, lh };
    });
    boxes.sort((m, n) => m.Y - n.Y);
    for (let k = 1; k < boxes.length; k++) for (let m = 0; m < k; m++) {
      const A = boxes[m], Bx = boxes[k];
      if (Bx.X < A.X + A.lw + 8 && Bx.X + Bx.lw + 8 > A.X && Bx.Y < A.Y + A.lh + 6) Bx.Y = A.Y + A.lh + 6;
    }
    boxes.forEach(({ lb, X, Y }, k) => {
      lb.style.transform = `translate(${X.toFixed(1)}px,${Y.toFixed(1)}px)`;
      const idxL = labs.indexOf(lb);
      lb.style.opacity = clamp(p / .08) * (1 - res * (idx === idxL ? 0 : .6));
    });
    tmp.set(0, 0, 0).project(camera);
    logo.style.transform = `translate(${((tmp.x * .5 + .5) * W - logo.offsetWidth / 2).toFixed(1)}px,${((-tmp.y * .5 + .5) * H + 34).toFixed(1)}px)`;
    logo.style.opacity = res;
    st.composer.render();
  }, jump(i) {
    const r = el.getBoundingClientRect(), total = r.height - vh;
    const top = scrollY + r.top + total * (.1 + (i + .5) / NC * .8);
    scrollTo({ top, behavior: RM ? 'auto' : 'smooth' });
  } };
  listBtns.forEach((b, i) => b.addEventListener('click', () => core.jump(i)));
}
let tmpV;

/* ---------- main loop ---------- */
let t0 = performance.now();
function frame(now) {
  const t = (now - t0) / 1000;
  vw = innerWidth; vh = innerHeight;
  updateNav(); updateWords(); updateStrips(); updateOwn();
  if (hero && hero.st.vis) hero.render(t);
  if (core && core.st.vis) core.render(t);
  if (own.vis) drawOwn(t);
  if (clock.vis) drawClock(t);
  if (cta.vis) drawCta(t);
  requestAnimationFrame(frame);
}

layoutStrips();
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { vw = innerWidth; vh = innerHeight; layoutStrips(); }, 150); });
// wipes depend on section heights; re-measure after fonts load
document.fonts && document.fonts.ready.then(layoutStrips);

(async () => {
  try {
    THREE = await import('three');
    ({ EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js'));
    ({ RenderPass } = await import('three/addons/postprocessing/RenderPass.js'));
    ({ UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js'));
    ({ OutputPass } = await import('three/addons/postprocessing/OutputPass.js'));
    tmpV = new THREE.Vector2();
    initHero(); initCore();
  } catch (e) { console.warn('WebGL scenes unavailable', e); hero = core = null; document.body.classList.add('nogl'); $('#c-hero')?.remove(); $('#c-core')?.remove(); }
  requestAnimationFrame(frame);
})();
