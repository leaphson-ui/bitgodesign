/* One fixed full-screen fragment shader. Each page section is a keyframe of light. */
(function () {
  const canvas = document.getElementById('light');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) { document.documentElement.classList.add('nogl'); return; }

  const VS = `#version 300 es
in vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }`;

  const FS = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uTime;
uniform vec2 uL; uniform float uLR, uLI; uniform vec3 uTint;
uniform vec2 uRing; uniform float uAur, uFlood, uMono, uSlit, uGl, uBeam, uCone;
uniform vec4 uS[3];

float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float n2(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*n2(p); p=p*2.03+7.1; a*=.5; } return s; }
float box(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }

float slabD(vec2 p, vec4 s){
  vec2 q=p-s.xy;
  float t=clamp(q.y/max(s.w,.001),-1.,1.);
  float hw=s.z*(1.-.10*t);
  float d=box(q,vec2(hw,s.w));
  return d;
}
float sdf(vec2 p){
  float d=1e3;
  for(int i=0;i<3;i++) d=min(d,slabD(p,uS[i]));
  d=max(d,-box(p-uS[1].xy-vec2(0.,uS[1].w*.05),vec2(uSlit,uS[1].w*.82)));
  return d+(1.-uMono)*.45;
}

void main(){
  vec2 fc=gl_FragCoord.xy;
  vec2 p=(fc-.5*uRes)/uRes.y;
  vec2 q=p;
  float tq=floor(uTime*9.);
  if(uGl>.001){
    float b=floor(p.y*26.); float r=h21(vec2(b,tq));
    if(r>.9) q.x+=(h21(vec2(b+7.,tq))-.5)*.3*uGl;
  }
  vec2 d=q-uL; float r=length(d); float ang=atan(d.y,d.x);
  float jit=h21(fc*.7+fract(uTime));
  float R=max(uLR,.05);

  /* bloom with per-channel radius = dispersion */
  vec3 rr=vec3(.93,1.,1.09)*r;
  vec3 bl=uLI*(exp(-rr*3.2/R)*.9+.16/(1.+pow(rr/R,vec3(2.))*3.));

  /* volumetric shafts: march from the pixel toward the light, count how much stone is in the way */
  float vis=0.;
  for(int i=0;i<26;i++){
    float t=(float(i)+jit)/26.;
    vec2 s=mix(q,uL,t*.96);
    vis+=smoothstep(-.004,.004,sdf(s));
  }
  vis/=26.;
  float an=ang*3.;
  vec3 rn=vec3(.8+.4*n2(vec2(an*2.,1.))+.25*n2(vec2(an*9.,2.)),.8+.4*n2(vec2(an*2.+.2,1.))+.25*n2(vec2(an*9.+.5,2.)),.8+.4*n2(vec2(an*2.+.4,1.))+.25*n2(vec2(an*9.+1.,2.)));
  vec3 rays=uLI*pow(vis,2.5)*rn*(.5/(1.+r*r*5./(R*R)));

  vec3 light=bl*mix(.25,1.,vis)+rays;
  vec3 col=vec3(.003,.005,.014);
  col+=light*uTint;
  col+=pow(max(light,0.),vec3(2.4))*.55;

  /* horizon beam with split channels */
  if(uBeam>.001){
    float by=q.y-uL.y;
    vec3 bm=vec3(exp(-pow((by+.006)/.007,2.)),exp(-pow(by/.007,2.)),exp(-pow((by-.006)/.007,2.)));
    bm*= .55+.45*exp(-abs(q.x-uL.x)*.45);
    bm+=.22*exp(-abs(by)/.07)*exp(-abs(q.x-uL.x)*.7);
    col+=uBeam*(bm*uTint*1.5+bm*.25);
  }
  /* cone from above + pool on the floor */
  if(uCone>.001){
    float cy=.5-q.y; float w=.02+cy*.27;
    float cn=exp(-pow((q.x-uL.x)/w,2.))*smoothstep(-.02,.15,cy)*exp(-cy*.85);
    cn*=.55+.9*n2(vec2(q.x*55.,q.y*3.));
    float pool=exp(-pow((q.x-uL.x)/.38,2.)-pow((q.y+.44)/.05,2.));
    col+=uCone*(cn*1.2+pool*.9)*uTint;
  }
  /* aurora ribbons */
  if(uAur>.001){
    for(int k=0;k<3;k++){
      float fk=float(k);
      float w=sin(q.x*(2.+fk)+uTime*.13*(1.+fk*.4)+fbm(q*1.4+fk)*4.)*.09;
      float y0=.24-.17*fk;
      float a=exp(-pow((q.y-y0-w)*6.5,2.));
      float str=.45+.9*n2(vec2(q.x*26.+fk*5.,q.y*2.));
      vec3 ac=k==0?vec3(.18,.38,1.):(k==1?vec3(.5,.25,1.):vec3(.15,.75,1.));
      col+=ac*a*str*uAur*.55*(.6+.4*sin(q.x*3.+fk));
    }
  }
  /* prismatic halo: three ring radii, one per channel */
  if(uRing.y>.001){
    float r0=uRing.x;
    float wob=1.+.025*sin(ang*3.+uTime*.2)+.025*n2(vec2(ang*4.,3.));
    float wd=.008+.03*r0;
    vec3 rg=vec3(exp(-pow((r-r0*wob*.955)/wd,2.)),exp(-pow((r-r0*wob)/wd,2.)),exp(-pow((r-r0*wob*1.045)/wd,2.)));
    vec3 ring=rg.x*vec3(1.,.32,.55)+rg.y*vec3(.55,.75,1.)+rg.z*vec3(.42,.28,1.);
    ring*=uRing.y*(.65+.7*n2(vec2(ang*5.,uTime*.08)));
    ring+=.14*exp(-pow((r-r0*1.55)/(.1*r0+.02),2.))*uTint*uRing.y;
    col+=ring*(.35+.65*vis);
  }

  vec3 t=1.-exp(-col*1.3);

  /* BitGo blue flood */
  if(uFlood>.001){
    float gfl=clamp(dot(light,vec3(.33))*.55,0.,1.5);
    vec3 blue=vec3(.0863,.2784,.8588);
    vec3 fl=blue*(.6+.5*gfl)+vec3(.45,.65,1.)*gfl*gfl*.45;
    fl+=(col-light*uTint)*.8; /* aurora, ring, beam sit on top of the blue */
    t=mix(t,min(fl,vec3(1.)),uFlood);
  }

  /* the dark form */
  float sd=sdf(q);
  float h=fbm(q*vec2(24.,8.))*.75+n2(q*vec2(120.,70.))*.25;
  vec2 hg=vec2(0.);
  if(sd<.03){
    vec2 e=vec2(.0015,0.);
    vec2 gr=normalize(vec2(sdf(q+e.xy)-sdf(q-e.xy),sdf(q+e.yx)-sdf(q-e.yx))+1e-5);
    float depth=max(-sd,0.);
    { vec2 ee=vec2(.003,0.);
      float hx=fbm((q+ee.xy)*vec2(24.,8.))*.75+n2((q+ee.xy)*vec2(120.,70.))*.25;
      float hy=fbm((q+ee.yx)*vec2(24.,8.))*.75+n2((q+ee.yx)*vec2(120.,70.))*.25;
      hg=vec2(hx-h,hy-h)*7.; }
    vec4 S=uS[0]; float bu=1e3;
    for(int i=0;i<3;i++){ float u=abs(q.x-uS[i].x)/max(uS[i].z,.001); if(u<bu){ bu=u; S=uS[i]; } }
    float tt=clamp((q.y-S.y)/max(S.w,.001),-1.,1.);
    float u=(q.x-S.x)/max(S.z*(1.-.10*tt),.001);
    float side=smoothstep(.72,.76,u);
    float f=fract(q.y/.17+S.x*2.7); float dl=min(f,1.-f)*.17;
    float groove=1.-smoothstep(.0007,.0032,dl);
    float bevel=smoothstep(.04,0.,depth);
    vec2 nxy=gr*bevel*1.3+hg;
    nxy.x+=side*1.15;
    nxy.y-=groove*.9;
    vec3 n=normalize(vec3(nxy,1.));
    vec3 ld=normalize(vec3(uL-q,.22+.25*R));
    float dif=max(dot(n,ld),0.);
    float spec=pow(max(dot(n,normalize(ld+vec3(0.,0.,1.))),0.),22.);
    float fall=1./(1.+r*r*3.5/(R*R+.05));
    float edge=smoothstep(.024,0.,depth);
    float face=clamp(dot(gr,normalize(uL-q+1e-4))*.5+.5,0.,1.);
    vec3 L3=mix(uTint,vec3(1.),.35)*uLI;
    vec3 stone=vec3(.011,.014,.03)*(.5+h)*(1.-side*.35);
    stone+=L3*fall*(dif*.28+spec*(.2+h)*.5+side*.1);
    stone+=L3*edge*(.15+1.1*face)*(.2+fall*1.8);
    stone+=uTint*.012*(1.+4.*groove);
    stone*=1.-.5*smoothstep(.0,.5,q.y*-1.)*0.; 
    vec3 st=1.-exp(-stone*1.3);
    float occ=1.-smoothstep(-.0015,.0015,sd);
    t=mix(t,st,occ);
  }

  /* heavy film grain, stronger in the light */
  float lum=dot(t,vec3(.33));
  float g1=h21(fc+floor(uTime*18.)*17.3)-.5;
  float g2=h21(floor(fc*.5)+floor(uTime*18.)*5.1)-.5;
  t+=(g1*.9+g2*.7)*(.05+.2*lum);
  t*=1.-.38*dot(p*.75,p*.75)*(1.-uFlood*.6);
  t+=(h21(fc*1.7)-.5)/255.;
  o=vec4(clamp(t,0.,1.),1.);
}`;

  function sh(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { document.documentElement.classList.add('nogl'); return; }
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); document.documentElement.classList.add('nogl'); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['uRes', 'uTime', 'uL', 'uLR', 'uLI', 'uTint', 'uRing', 'uAur', 'uFlood', 'uMono', 'uSlit', 'uGl', 'uBeam', 'uCone', 'uS'].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

  /* ---------- sizing, adaptive quality ---------- */
  let W = innerWidth, H = innerHeight, aspect = W / H, q = 1;
  function resize() {
    W = innerWidth; H = innerHeight; aspect = W / H;
    const k = Math.min(Math.min(devicePixelRatio || 1, 2), 1280 / Math.max(W, H)) * q;
    canvas.width = Math.max(2, Math.round(W * k)); canvas.height = Math.max(2, Math.round(H * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
    buildKeys();
  }

  /* ---------- keyframes ---------- */
  // numeric layout: 0 Lx,1 Ly (viewport fractions, y down) 2 LR 3 LI 4-6 tint 7 ringR 8 ringA 9 aur 10 flood 11 mono 12 slit 13 beam 14 cone 15..26 slabs (shader units)
  const BLUE = [0.3, 0.52, 1.0], CYAN = [0.3, 0.74, 1.0], VIOLET = [0.55, 0.42, 1.0], PALE = [0.62, 0.68, 1.0], DEEP = [0.14, 0.3, 0.95];
  let S_ = 1;
  const slabsOf = (arr) => { const o = []; arr.forEach((s) => o.push(...s)); return o; };
  // fx center fraction, top (frac, y down) for the middle slab, hw (H units, scaled), gap
  function mono(fx, top, hw, gap, offs) {
    hw *= S_; gap *= S_;
    offs = offs || [0.07, 0, 0.035];
    const out = [];
    for (let i = 0; i < 3; i++) {
      const tp = top + offs[i];
      const hh = (1.35 - tp) / 2;
      out.push([(fx - 0.5) * aspect + (i - 1) * (2 * hw + gap), 0.5 - (tp + hh), hw, hh]);
    }
    return slabsOf(out);
  }
  const none = () => slabsOf([[0, -3, 0, 0], [0, -3, 0, 0], [0, -3, 0, 0]]);
  function kf(o) {
    const d = Object.assign({ L: [0.5, 0.5], LR: 0.6, LI: 1, tint: BLUE, ring: [0.3, 0], aur: 0, flood: 0, mono: 0, slit: 0, beam: 0, cone: 0, slabs: none() }, o);
    const nw = aspect > 1.05 ? 1 : 1;
    if (aspect <= 1.05) { d.LI *= 0.72; d.LR *= 0.85; }
    return [d.L[0], d.L[1], d.LR, d.LI, ...d.tint, d.ring[0], d.ring[1], d.aur, d.flood, d.mono, d.slit, d.beam, d.cone, ...d.slabs];
  }
  const IDS = ['hero', 'trust', 'badges', 'core', 'established', 'build', 'support', 'own', 'spotlight', 'latest', 'cta', 'footer'];
  let K = [], tops = [];
  const wide = () => aspect > 1.05;
  function buildKeys() {
    S_ = Math.min(1, aspect / 1.25);
    const hx = wide() ? 0.74 : 0.5;
    K = [
      kf({ L: [hx, wide() ? 0.4 : 0.3], LR: 0.55, LI: wide() ? 1.25 : 0.8, tint: BLUE, mono: 1, slit: 0.011 * S_, slabs: mono(hx, 0.14, 0.1, 0.012) }),
      kf({ L: [0.5, 0.6], LR: 0.4, LI: 0.75, tint: CYAN, beam: 1, aur: 0.12 }),
      kf({ L: [0.5, 0.5], LR: 0.55, LI: 0.9, tint: VIOLET, ring: [wide() ? 0.4 : 0.3, 1.1] }),
      kf({ L: [wide() ? 0.9 : 0.5, 0.8], LR: 0.8, LI: 0.85, tint: [0.7, 0.8, 1.0], flood: 1, mono: 1, slit: 0, slabs: wide() ? mono(0.1, -0.05, 0.12, 0.02, [0, 0.0, 0]) : mono(-0.02, -0.05, 0.1, 0.012, [0, 0, 0]) }),
      kf({ L: [0.5, 0.45], LR: 0.7, LI: 0.7, tint: PALE, ring: [0.2, 0.55] }),
      kf({ L: [0.5, 0.5], LR: 0.55, LI: 1.1, tint: DEEP, aur: 0.85, mono: 1, slabs: pillars() }),
      kf({ L: [0.15, 0.9], LR: 0.42, LI: 0.8, tint: CYAN, beam: 0.55 }),
      kf({ L: [0.5, 0.34], LR: 0.7, LI: 0.6, tint: VIOLET, ring: [0.6, 0.8], aur: 0.3 }),
      kf({ L: [0.5, -0.02], LR: 0.5, LI: 1.1, tint: [0.6, 0.75, 1.0], cone: 1 }),
      kf({ L: [0.92, 0.5], LR: 0.8, LI: 0.9, tint: BLUE, mono: 1, slabs: mono(0.93, -0.15, 0.016, 0.05, [0, 0, 0]) }),
      kf({ L: [0.5, 0.52], LR: 0.95, LI: 1.1, tint: [0.62, 0.78, 1.0], flood: 1, ring: [0.4, 0.9], mono: 1, slabs: slabsOf([[(-0.02 - 0.5) * aspect, -0.5, wide() ? 0.27 : 0.1, 1.1], [0, -3, 0, 0], [(1.02 - 0.5) * aspect, -0.5, wide() ? 0.27 : 0.1, 1.1]]) }),
      kf({ L: [0.5, 1.12], LR: 0.9, LI: 0.7, tint: DEEP }),
    ];
    measure();
  }
  function pillars() {
    const cards = Array.from(document.querySelectorAll('.pil'));
    if (cards.length === 3 && cards[0].getBoundingClientRect().left !== cards[1].getBoundingClientRect().left && wide()) {
      const out = cards.map((c, i) => {
        const r = c.getBoundingClientRect();
        const cx = ((r.left + r.width / 2) / W - 0.5) * aspect;
        const hw = (r.width * 0.5) / H;
        const tp = [0.0, -0.08, 0.04][i];
        const hh = (1.4 - tp) / 2;
        return [cx, 0.5 - (tp + hh), hw, hh];
      });
      return slabsOf(out);
    }
    return mono(0.5, 0.06, 0.07, 0.03);
  }
  function measure() {
    tops = IDS.map((id) => {
      const el = document.getElementById(id);
      const r = el.getBoundingClientRect();
      const top = r.top + scrollY, h = r.height;
      return { top, h, c: top + (id === 'hero' ? Math.min(h, H) / 2 : h / 2) };
    });
  }

  /* ---------- state ---------- */
  const cur = new Float32Array(27), tgt = new Float32Array(27);
  let inited = false, glPulse = 0, lastSec = -1;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / W - 0.5; mouse.ty = e.clientY / H - 0.5; }, { passive: true });
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // hero word overlays: [Ly, ring, beam, slit, tint]
  const WORDS = [
    { ly: 0.4, ring: 0, beam: 0, slit: 0.011, tint: BLUE },
    { ly: 0.8, ring: 0, beam: 0.85, slit: 0.02, tint: CYAN },
    { ly: 0.16, ring: 0.6, beam: 0, slit: 0.03, tint: VIOLET },
  ];
  const wcur = { ly: 0.4, ring: 0, beam: 0, slit: 0.011, tint: BLUE.slice() };

  function compute(dt) {
    const sy = scrollY, s = sy + H / 2;
    // section index pair
    let i = 0;
    for (let k = 0; k < tops.length - 1; k++) if (s >= tops[k].c) i = k;
    const a = tops[i].c, b = tops[Math.min(i + 1, tops.length - 1)].c;
    let t = b > a ? Math.min(1, Math.max(0, (s - a) / (b - a))) : 0;
    t = smooth(0.18, 0.82, t);
    if (s < tops[0].c) t = 0;

    // dynamic keyframes
    const wi = window.__heroWord | 0, W_ = WORDS[wi], kk = 1 - Math.exp(-dt * 2.2);
    wcur.ly += (W_.ly - wcur.ly) * kk; wcur.ring += (W_.ring - wcur.ring) * kk; wcur.beam += (W_.beam - wcur.beam) * kk; wcur.slit += (W_.slit - wcur.slit) * kk;
    for (let c = 0; c < 3; c++) wcur.tint[c] += (W_.tint[c] - wcur.tint[c]) * kk;
    const k0 = K[0].slice();
    k0[1] = wide() ? wcur.ly : wcur.ly * 0.8; k0[8] = wcur.ring; k0[7] = 0.36; k0[13] = wcur.beam; k0[12] = wcur.slit * S_; k0[4] = wcur.tint[0]; k0[5] = wcur.tint[1]; k0[6] = wcur.tint[2];
    const kc = K[3].slice(); const cp = window.__coreProgress || 0; kc[1] = 0.86 - 0.72 * cp;
    const ks = K[6].slice(); const sr = tops[6]; const sp = Math.min(1, Math.max(0, (s - sr.top) / sr.h));
    ks[0] = 0.12 + 0.76 * sp; ks[1] = 0.92 - 0.06 * Math.sin(sp * Math.PI);
    ks[4] = 0.3 + 0.4 * sp; ks[5] = 0.72 - 0.3 * sp; ks[6] = 1.0; // cyan, drifting toward violet
    const keys = K.map((x, j) => (j === 0 ? k0 : j === 3 ? kc : j === 6 ? ks : x));
    const A = keys[i], Bk = keys[Math.min(i + 1, keys.length - 1)];
    for (let n = 0; n < 27; n++) tgt[n] = A[n] + (Bk[n] - A[n]) * t;
    const near = t > 0.5 ? i + 1 : i;
    if (near !== lastSec) { if (lastSec !== -1 && (near === 7 || near === 3) && !reduce) glPulse = 0.85; lastSec = near; }
    return s;
  }

  /* ---------- loop ---------- */
  const T0 = performance.now();
  let last = T0, prevS = -1, ms = 0, frames = 0, qTimer = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dtMs = now - last;
    if (dtMs < 28) return;
    last = now;
    const dt = Math.min(dtMs / 1000, 1);
    const s = compute(dt);
    const jump = prevS < 0 || Math.abs(s - prevS) > H * 1.3;
    prevS = s;
    const k = (jump && !inited) || reduce ? 1 : 1 - Math.exp(-dt * 4.2);
    for (let n = 0; n < 27; n++) cur[n] += (tgt[n] - cur[n]) * (n >= 15 || jump ? (jump ? 1 : 1 - Math.exp(-dt * 6)) : k);
    inited = true;
    mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 3)); mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 3));
    glPulse *= Math.exp(-dt * 3.2);
    const time = reduce ? 3 : (now - T0) / 1000;
    const lx = (cur[0] - 0.5) * aspect + mouse.x * 0.03, ly = 0.5 - cur[1] - mouse.y * 0.03;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, time);
    gl.uniform2f(U.uL, lx, ly);
    gl.uniform1f(U.uLR, cur[2]); gl.uniform1f(U.uLI, cur[3]);
    gl.uniform3f(U.uTint, cur[4], cur[5], cur[6]);
    gl.uniform2f(U.uRing, cur[7], cur[8]);
    gl.uniform1f(U.uAur, cur[9]); gl.uniform1f(U.uFlood, cur[10]); gl.uniform1f(U.uMono, cur[11]);
    gl.uniform1f(U.uSlit, cur[12]); gl.uniform1f(U.uBeam, cur[13]); gl.uniform1f(U.uCone, cur[14]);
    gl.uniform1f(U.uGl, glPulse);
    gl.uniform4fv(U.uS, cur.subarray(15, 27));
    const t0 = performance.now();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish && 0;
    // adaptive quality
    ms = ms * 0.9 + dtMs * 0.1; frames++;
    if (frames > 20 && now - qTimer > 1500) {
      qTimer = now;
      if (ms > 52 && q > 0.45) { q = Math.max(0.45, q * 0.8); resize(); }
    }
  }
  addEventListener('resize', () => { resize(); inited = false; });
  addEventListener('load', () => { measure(); buildKeys(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { buildKeys(); });
  resize();
  new ResizeObserver(() => { measure(); }).observe(document.body);
  // building keys needs layout; re-run once the page has settled
  setTimeout(buildKeys, 300);
  requestAnimationFrame(frame);
})();
