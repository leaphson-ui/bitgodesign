import * as THREE from 'three';

/* One grid of points, one fixed canvas. Every section bends the same sheet into its own form. */

const FORM = { FIELD: 0, PILLARS: 1, SKY: 2, GLOBE: 3, DIAL: 4, RIBBONS: 5, APERTURE: 6, LOGO: 7 };
const SLOT = { core: 1, sky: 6, globe: 7, dial: 8, own: 9, disc: 10, logo: 13 };

const rngMaker = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ---------------- baked targets ---------------- */

function bakeSky(N, rng) {
  // local units: x in [-1,1], y up from 0, so one unit is half the anchor width
  const segs = [];
  const add = (xc, hw, y0, y1, layer, lm) => segs.push({ xc, hw, y0, y1, layer, lm });
  const lms = [
    { x: -0.62, type: 'crown', h: 0.62 },
    { x: -0.18, type: 'step', h: 0.74 },
    { x: 0.30, type: 'spire', h: 0.9 },
    { x: 0.70, type: 'step', h: 0.58 }
  ];
  const towerAt = (x0, w, h, layer) => {
    const xc = x0 + w / 2;
    let hw = w / 2, y0 = 0, hh = h;
    const steps = rng() < 0.55 ? 1 + Math.floor(rng() * 2.4) : 0;
    add(xc, hw, 0, hh * (steps ? 0.7 : 1), layer, 0);
    let top = hh * (steps ? 0.7 : 1);
    for (let s = 0; s < steps; s++) {
      hw *= 0.74; const nt = top + (hh - top) * (0.55 + rng() * 0.3);
      add(xc, hw, top, nt, layer, 0); top = nt;
    }
  };
  for (let layer = 1; layer >= 0; layer--) {
    let x = -1.08 + (layer ? 0.03 : 0);
    while (x < 1.08) {
      const w = 0.045 + rng() * 0.07;
      const mid = 1 - Math.abs(x) * 0.5;
      const h = (0.12 + rng() * 0.3) * (0.7 + 0.5 * mid) * (layer ? 0.88 : 1);
      const lm = layer === 0 && lms.find((l) => Math.abs(l.x - (x + w / 2)) < 0.07);
      if (lm) {
        const xc = x + w / 2, ww = 0.05;
        if (lm.type === 'crown') {
          let y = 0; const base = 0.38;
          add(xc, 0.062, 0, base, 0, 0); y = base;
          [[0.05, 0.12], [0.038, 0.08], [0.027, 0.06], [0.017, 0.05], [0.009, 0.05]].forEach(([hw2, dh]) => { add(xc, hw2, y, y + dh, 0, 0); y += dh; });
          add(xc, 0.003, y, y + 0.14, 0, 1);
        } else if (lm.type === 'step') {
          let y = 0;
          [[0.07, 0.34], [0.055, 0.14], [0.042, 0.12], [0.03, 0.1]].forEach(([hw2, dh]) => { add(xc, hw2, y, y + dh, 0, 0); y += dh; });
          add(xc, 0.016, y, y + 0.08, 0, 0); y += 0.08; add(xc, 0.003, y, y + 0.1, 0, 1);
        } else {
          let y = 0;
          [[0.058, 0.5], [0.046, 0.2], [0.032, 0.12]].forEach(([hw2, dh]) => { add(xc, hw2, y, y + dh, 0, 0); y += dh; });
          add(xc, 0.0035, y, y + 0.16, 0, 1);
        }
        x += ww * 2.2;
      } else {
        towerAt(x, w, h, layer);
        x += w + (rng() < 0.3 ? 0.01 : 0.002);
      }
    }
  }
  // weights
  const out = [];
  let tot = 0;
  segs.forEach((s) => { s.a = (s.hw * 2) * (s.y1 - s.y0) * (s.layer ? 0.42 : 1) * (s.lm ? 0.12 : 1); tot += s.a; });
  const winW = 0.0095, winH = 0.0135;
  const winBudget = N * 0.8;
  segs.forEach((s) => {
    const n = Math.max(s.lm ? 90 : 14, Math.round(winBudget * s.a / tot));
    const cols = Math.max(1, Math.floor((s.hw * 2) / winW)), rows = Math.max(1, Math.floor((s.y1 - s.y0) / winH));
    const z = s.layer ? -0.42 : 0;
    // lit pattern per segment
    const lit = new Float32Array(cols * rows);
    const density = 0.5 + rng() * 0.35;
    for (let i = 0; i < lit.length; i++) lit[i] = rng() < density ? 1 : 0;
    for (let k = 0; k < n; k++) {
      let x, y, kind;
      if (s.lm === 1) { x = s.xc + (rng() - 0.5) * 0.006; y = s.y0 + rng() * (s.y1 - s.y0); kind = 1.35; }
      else {
        let tries = 0, ci, ri;
        do { ci = Math.floor(rng() * cols); ri = Math.floor(rng() * rows); tries++; } while (!lit[ci * rows + ri] && tries < 6);
        const cw = (s.hw * 2) / cols, ch = (s.y1 - s.y0) / rows;
        x = s.xc - s.hw + (ci + 0.2 + rng() * 0.6) * cw; y = s.y0 + (ri + 0.2 + rng() * 0.6) * ch;
        kind = s.layer ? 0.5 : (0.75 + rng() * 0.25);
      }
      out.push([x, y, z + (rng() - 0.5) * 0.02, kind]);
    }
    // outline: roof line and corners
    const m = Math.round(n * 0.13);
    for (let k = 0; k < m; k++) {
      const r = rng();
      if (r < 0.5) out.push([s.xc - s.hw + rng() * s.hw * 2, s.y1, z, s.layer ? 0.6 : 1.3]);
      else out.push([s.xc + (r < 0.75 ? -s.hw : s.hw), s.y0 + rng() * (s.y1 - s.y0), z, s.layer ? 0.55 : 1.15]);
    }
  });
  // street line
  for (let k = 0; k < N * 0.05; k++) out.push([-1.12 + rng() * 2.24, -0.004 - rng() * 0.012, (rng() - 0.5) * 0.3, 0.9]);
  // trim or pad to N
  while (out.length > N) out.splice(Math.floor(rng() * out.length), 1);
  while (out.length < N) out.push(out[Math.floor(rng() * out.length)].slice());
  out.sort((a, b) => a[0] - b[0]);
  return out;
}

const CONT = [
  [48, -100, 20, 34], [62, -108, 12, 26], [20, -99, 9, 10], [68, -42, 8, 14],
  [-12, -58, 22, 15], [-36, -66, 13, 7], [4, -70, 9, 11],
  [50, 12, 9, 22], [63, 16, 8, 11], [41, 14, 5, 12],
  [8, 20, 27, 22], [-19, 26, 16, 14],
  [54, 88, 17, 55], [30, 78, 15, 26], [24, 106, 11, 17], [8, 108, 9, 10],
  [-25, 134, 12, 17], [36, 138, 6, 5]
];
function landAt(lat, lon, hash) {
  let s = 0;
  for (const c of CONT) {
    let dl = lon - c[1]; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
    const a = (lat - c[0]) / c[2], b = dl / c[3];
    s = Math.max(s, Math.exp(-(a * a + b * b) * 1.5));
  }
  return s + (hash - 0.5) * 0.35 > 0.46;
}
const CITIES = [
  [40.7, -74], [51.5, -0.1], [50.1, 8.7], [25.2, 55.3], [1.35, 103.8], [35.7, 139.7], [-33.9, 151.2],
  [-23.5, -46.6], [37.8, -122.4], [-26.2, 28], [22.3, 114.2], [47.4, 8.5]
];
const ARCS = [[0, 1], [0, 8], [1, 3], [2, 4], [3, 4], [4, 5], [5, 6], [0, 7], [1, 9], [8, 5], [2, 10], [11, 0], [4, 6], [9, 3], [10, 5], [7, 1], [8, 1], [0, 2], [6, 10], [3, 2]];
const ll2v = (lat, lon) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; };

function bakeGlobe(N, rng) {
  const out = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  const cand = N * 3.2;
  const land = [], sea = [];
  for (let i = 0; i < cand; i++) {
    const y = 1 - (i / (cand - 1)) * 2, rad = Math.sqrt(1 - y * y), th = i * ga;
    const x = Math.cos(th) * rad, z = Math.sin(th) * rad;
    const lat = Math.asin(y) * 180 / Math.PI, lon = Math.atan2(x, z) * 180 / Math.PI;
    (landAt(lat, lon, rng()) ? land : sea).push([x, y, z]);
  }
  const nl = Math.min(land.length, Math.round(N * 0.84));
  for (let i = 0; i < nl; i++) { const p = land[Math.floor(i * land.length / nl)]; out.push([p[0], p[1], p[2], 1]); }
  while (out.length < N) { const p = sea[Math.floor(rng() * sea.length)]; out.push([p[0], p[1], p[2], 0.28]); }
  out.sort((a, b) => Math.atan2(a[0], a[2]) - Math.atan2(b[0], b[2]));
  return out;
}

function ringLogo(N, rng) {
  const out = [];
  for (let i = 0; i < N; i++) { const a = rng() * 6.283, r = 0.35 + rng() * 0.06; out.push([Math.cos(a) * r * 2, Math.sin(a) * r * 2, 0, 1]); }
  out.sort((a, b) => a[0] - b[0]); return out;
}
async function bakeLogo(N, rng, url) {
  const img = new Image(); img.src = url; await img.decode();
  const W = 1084, Hh = 368, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0, W, Hh);
  const d = cx.getImageData(0, 0, W, Hh).data, px = [];
  for (let y = 0; y < Hh; y += 1) for (let x = 0; x < W; x += 1) if (d[(y * W + x) * 4 + 3] > 120) px.push(x, y);
  const m = px.length / 2; if (m < 100) throw new Error('empty logo');
  const out = [];
  for (let i = 0; i < N; i++) {
    const k = Math.floor(rng() * m) * 2;
    const x = (px[k] + rng() - 0.5) / W * 2 - 1, y = -((px[k + 1] + rng() - 0.5) - Hh / 2) / (W / 2);
    out.push([x, y, (rng() - 0.5) * 0.05, 0.85 + rng() * 0.3]);
  }
  out.sort((a, b) => a[0] - b[0]); return out;
}

/* ---------------- shaders ---------------- */

const COMMON = /* glsl */`
mat2 rot2(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 rotY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
vec3 rotX(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
vec3 hash3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return -1.+2.*fract(sin(p)*43758.5453123);}
float gnoise(vec3 p){
  vec3 i=floor(p),f=fract(p);vec3 u=f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(mix(dot(hash3(i),f),dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),mix(dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
             mix(mix(dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),mix(dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
}
float lay(vec3 p){return gnoise(p)+0.5*gnoise(p*2.03+7.1)+0.25*gnoise(p*4.1+13.7);}
uniform vec4 uA[14];
uniform vec2 uRes;
uniform float uGlobeYaw;
vec3 globeXf(vec3 u,out float facing){
  vec4 a=uA[7];float R=min(a.z,a.w)*0.5*0.9;
  vec3 q=rotX(rotY(u,uGlobeYaw),0.38);
  facing=q.z;
  return vec3(a.xy,0.)+q*R;
}
`;

const VERT = /* glsl */`
precision highp float;
attribute vec2 aG; attribute float aR; attribute vec4 aSky; attribute vec4 aGlobe; attribute vec4 aLogo;
uniform float uTime,uIntro,uMix,uAmp,uDpr,uCamD,uSize,uSweep,uActA,uActB,uFrom,uTo,uCalm;
uniform vec2 uBlue0,uBlue1;
uniform vec4 uQ[6]; uniform float uQs[6];
uniform vec3 uPtr;
varying float vA; varying float vC; varying float vBlue; varying float vK;
${COMMON}
struct F{vec3 p;float k;float c;float f;float b;};

float inR(float y,vec2 r){return smoothstep(r.y-26.,r.y+26.,y)*(1.-smoothstep(r.x-26.,r.x+26.,y));}

F fField(vec2 g,float r){
  F o;float W=uRes.x,H=uRes.y,d=uCamD;float v=g.y;
  float z=0.15*d-pow(v,1.3)*1.6*d;
  float x=(g.x-0.5)*3.0*W;
  vec3 q=vec3(g.x*9.0,v*4.2,0.0);float tt=uTime*0.05;
  float sN=lay(q+vec3(0.,0.,r*0.25));
  float lN=lay(vec3(q.x*0.55+tt,q.y*0.8-tt*0.7,tt*0.9+r*0.12));
  float h=mix(sN,lN,0.6);
  float y=-0.60*H+v*0.9*H+h*uAmp*0.27*H*(0.45+0.55*v);
  o.p=vec3(x,y,z);
  float line=smoothstep(0.86,1.0,sin(h*13.0+v*3.0)*0.5+0.5);
  o.k=0.58+0.8*line;
  o.c=clamp(h*0.55+0.45+v*0.1,0.,1.);
  o.f=smoothstep(1.0,0.74,v)*(0.75+0.5*smoothstep(-0.2,0.7,h))*(1.0-0.45*uCalm);
  o.b=1.;
  return o;
}
F fPillars(vec2 g,float r,float act){
  F o;float c=min(floor(g.x*5.),4.);float u=g.x*5.-c;vec4 a=uA[1+int(c)];
  float on=1.-clamp(abs(c-act),0.,1.);
  float R=min(a.z*0.36,a.w*0.22)*(1.+0.1*on);
  float gy=g.y;float th=u*6.28318+uTime*(0.16+0.04*c)+gy*(c==1.?4.2:0.6);
  float rad=R;
  if(c==0.){rad=R*(0.5+0.5*step(0.5,fract(floor(gy*11.)*0.618)));rad=mix(R*0.55,R,step(0.5,fract(floor(gy*11.)*0.618+0.12)));}
  else if(c==1.){rad=R*(0.55+0.45*abs(sin(gy*6.2832)));}
  else if(c==2.){float f=fract(gy*9.);rad=R*(f<0.78?0.95:0.62);}
  else if(c==3.){float cs=cos(th),sn=sin(th);rad=R*0.9/max(abs(cs),abs(sn))*0.75;rad=min(rad,R*1.25);}
  else {rad=R*(1.05-0.55*gy)*(0.78+0.22*step(0.5,fract(gy*5.)));}
  float y=a.y+(gy-0.5)*a.w*0.9;
  o.p=vec3(a.x+cos(th)*rad,y,sin(th)*rad);
  float ring=smoothstep(0.82,1.,fract(gy*(c==2.?9.:22.)));
  if(c==3.){ring=max(ring,smoothstep(0.84,1.,fract(u*16.)));}
  o.k=0.5+0.4*ring+0.1*on;o.c=clamp(gy*0.8+0.1+0.2*on,0.,1.);
  o.f=(0.5+0.75*on)*smoothstep(0.,0.06,gy)*smoothstep(1.,0.94,gy);
  o.b=1.;return o;
}
F fSky(vec2 g,float r){
  F o;vec4 a=uA[6];float hw=a.z*0.5;
  vec4 s=aSky;
  o.p=vec3(a.x+s.x*hw,a.y-a.w*0.5+s.y*(a.w/0.95),s.z*hw*0.5);
  o.k=s.w;o.c=clamp(s.y*0.8+0.32+(s.w>1.?0.25:0.)-s.z*0.5,0.,1.);
  o.f=1.;o.b=1.;return o;
}
F fGlobe(vec2 g,float r){
  F o;float fc;vec4 s=aGlobe;
  vec3 p=globeXf(s.xyz*(1.+0.012*sin(r*60.)),fc);
  o.p=p;o.k=s.w;
  o.c=clamp(0.5+0.5*gnoise(s.xyz*2.2+vec3(uTime*0.05))+s.y*0.2,0.,1.);
  float back=smoothstep(-0.55,0.25,fc);
  o.f=mix(0.22,1.,back)*(0.35+0.65*s.w);
  o.b=1.;return o;
}
F fDial(vec2 g,float r){
  F o;vec4 a=uA[8];float R=min(a.z,a.w)*0.5;
  float rings=15.;float gq=mix(g.y,(floor(g.y*rings)+0.5)/rings,0.78);
  float rad=(0.1+0.9*gq)*R;float ang=g.x*6.28318;
  if(gq>0.84){float aq=floor(g.x*96.)/96.*6.28318;ang=mix(ang,aq,0.75);}
  vec3 q=vec3(cos(ang)*rad,sin(ang)*rad,0.);
  q=rotX(q,0.78);q=rotY(q,0.3*sin(uTime*0.12));
  o.p=vec3(a.xy,0.)+q;
  float df=mod(uSweep-ang,6.28318);
  float beam=exp(-df*1.15);
  float outer=smoothstep(0.84,0.96,gq);
  o.k=0.45+0.3*outer+0.7*beam;o.c=clamp(gq*0.7+0.5*beam,0.,1.);
  o.f=(0.42+0.75*beam)*(0.4+0.6*smoothstep(0.0,0.15,g.y));
  o.b=1.;return o;
}
F fRibbon(vec2 g,float r,float act){
  F o;vec4 a=uA[9];float c=min(floor(g.x*5.),4.);float u=g.x*5.-c-0.5;float s=g.y;
  float on=1.-clamp(abs(c-act),0.,1.);
  float t=uTime*0.16;
  float xx=a.x+(s-0.5)*a.z*1.02;
  float yb=a.y+(c-2.)*a.w*0.12;
  float y=yb+a.w*0.2*sin(s*3.6+c*1.3+t)+a.w*0.07*sin(s*8.5-c*2.1-t*1.7);
  float w=a.w*(0.05+0.035*sin(s*5.+c))*(1.+0.7*on);
  float ph=s*6.+c*1.7+t*1.4;
  y+=cos(ph)*u*w;float z=sin(ph)*u*w*2.2+sin(s*4.+c)*a.w*0.1;
  o.p=vec3(xx,y,z);
  o.k=0.5+0.35*smoothstep(0.35,0.5,abs(u))+0.15*on;o.c=clamp(s*0.6+0.25+0.3*on,0.,1.);
  o.f=smoothstep(0.,0.12,s)*smoothstep(1.,0.9,s)*(0.55+0.7*on);
  o.b=1.;return o;
}
F fAperture(vec2 g,float r,float act){
  F o;float k=min(floor(g.x*3.),2.);float u=g.x*3.-k;vec4 a=uA[10+int(k)];
  float on=1.-clamp(abs(k-act),0.,1.);
  float R=min(a.z,a.w)*0.5*(1.+0.08*on);
  float rad=R*pow(g.y,0.72);float ang=u*6.28318+uTime*(0.12+0.05*k)*(k==1.?-1.:1.);
  vec3 q=vec3(cos(ang)*rad,sin(ang)*rad,0.);
  q=rotX(q,0.55+0.2*k);q=rotY(q,0.45*sin(uTime*0.2+k*2.));
  o.p=vec3(a.xy,0.)+q;
  float bl=0.5+0.5*sin(ang*6.+g.y*5.-uTime*0.6);
  o.k=0.4+0.5*bl+0.1*on;o.c=clamp(g.y*0.6+0.3*bl+0.15*on,0.,1.);
  o.f=(0.5+0.7*on)*(0.5+0.5*smoothstep(0.,0.2,g.y));
  o.b=1.;return o;
}
F fLogo(vec2 g,float r){
  F o;vec4 a=uA[13];vec4 s=aLogo;
  o.p=vec3(a.x+s.x*a.z*0.5,a.y+s.y*a.z*0.5,s.z*a.z*0.5);
  o.k=s.w;o.c=clamp(0.45+0.5*s.w-0.4*abs(s.x),0.,1.);o.f=1.;o.b=1.;return o;
}
F form(int id,vec2 g,float r,float act){
  if(id==0)return fField(g,r);
  if(id==1)return fPillars(g,r,act);
  if(id==2)return fSky(g,r);
  if(id==3)return fGlobe(g,r);
  if(id==4)return fDial(g,r);
  if(id==5)return fRibbon(g,r,act);
  if(id==6)return fAperture(g,r,act);
  return fLogo(g,r);
}

void main(){
  vec2 g=aG;float r=aR;float H=uRes.y;
  int ia=int(uFrom+0.5),ib=int(uTo+0.5);
  F A=form(ia,g,r,uActA);F B=A;float e=0.;
  if(uMix>0.0005&&ia!=ib){
    B=form(ib,g,r,uActB);
    float gs=(ib==2)?clamp(aSky.y*1.2,0.,1.):g.y;
    float stg=r*0.4+gs*0.3;
    e=smoothstep(0.,1.,uMix*1.7-stg);
  }
  vec3 pos=mix(A.p,B.p,e);
  float arc=sin(e*3.14159);
  vec3 sq=pos*0.0028;
  pos+=vec3(gnoise(sq+vec3(r*3.,uTime*0.07,0.)),gnoise(sq+vec3(0.,r*3.,uTime*0.07)+11.),gnoise(sq+31.))*arc*0.2*H;
  pos.xy*=1.-0.72*arc*arc;
  pos.xy+=vec2(sin(uTime*0.7+r*60.),cos(uTime*0.6+r*45.))*1.1;
  float ie=smoothstep(0.,1.,uIntro*1.35-r*0.4-g.y*0.1);
  pos.y-=(1.-ie)*0.28*H;
  float k=mix(A.k,B.k,e);float cc=mix(A.c,B.c,e);float ff=mix(A.f,B.f,e);
  vec4 mv=modelViewMatrix*vec4(pos,1.);
  gl_Position=projectionMatrix*mv;
  vec2 scr=gl_Position.xy/gl_Position.w*0.5*uRes;
  // pointer swirl (screen space)
  vec2 dp=scr-uPtr.xy;float R=H*0.16;float fall=exp(-dot(dp,dp)/(R*R*1.7));
  vec2 tang=vec2(-dp.y,dp.x)/R;float ph=uTime*1.3+r*12.;
  vec2 off=(tang*0.6+dp/R*0.4*sin(ph))*fall*uPtr.z*(24.+12.*sin(r*20.+uTime));
  gl_Position.xy+=off*2./uRes*gl_Position.w;
  scr+=off;
  // quiet zones behind text
  float qf=1.;
  for(int i=0;i<6;i++){
    float qs=uQs[i];
    if(qs>0.){vec4 q=uQ[i];vec2 cn=(q.xy+q.zw)*0.5,hf=(q.zw-q.xy)*0.5;vec2 dd=abs(scr-cn)-hf;float di=max(dd.x,dd.y);qf*=1.-qs*(1.-smoothstep(-40.,70.,di));}
  }
  vBlue=clamp(inR(scr.y,uBlue0)+inR(scr.y,uBlue1),0.,1.);
  vA=min(1.,ff*ie*qf*(0.42+0.85*min(k,1.)));
  vC=cc;vK=k;
  float sz=uSize*(0.75+0.55*min(k,1.))*(1.+0.35*smoothstep(1.,1.4,k));
  gl_PointSize=sz*uDpr*(uCamD/-mv.z);
}
`;

const FRAG = /* glsl */`
precision highp float;
uniform vec3 uLo,uHi,uAcc,uBLo,uBHi;
varying float vA;varying float vC;varying float vBlue;varying float vK;
void main(){
  vec2 uv=gl_PointCoord-0.5;float d=length(uv);
  float a=smoothstep(0.5,0.12,d);
  vec3 col=mix(uLo,uHi,vC);
  col=mix(col,uAcc,clamp(vK-1.,0.,1.));
  vec3 cb=mix(uBLo,uBHi,vC);
  col=mix(col,cb,vBlue);
  float al=a*vA*mix(1.,0.95,vBlue);
  if(al<0.01)discard;
  gl_FragColor=vec4(col,al);
}
`;

const ARC_VERT = /* glsl */`
precision highp float;
attribute vec3 aA; attribute vec3 aB; attribute vec3 aT;
uniform float uTime,uDpr,uCamD,uGlobeW,uArcShow;
varying float vA; varying float vH;
${COMMON}
void main(){
  float t=aT.x;float seed=aT.y;float ord=aT.z;
  vec3 u;float size;float al;
  if(t<0.){
    u=normalize(aA);size=5.5+2.*sin(uTime*2.+seed*30.);al=0.95;vH=0.6;
  } else {
    float ang=acos(clamp(dot(aA,aB),-0.999,0.999));
    vec3 sl=(sin((1.-t)*ang)*aA+sin(t*ang)*aB)/sin(ang);
    u=normalize(sl)*(1.+(0.1+0.26*ang/3.1416)*sin(3.14159*t));
    float head=fract(uTime*0.1+seed);float d=mod(head-t+1.,1.);
    float tr=exp(-d*8.)*step(d,0.45);
    al=0.34+tr*1.0;size=2.+tr*4.5;vH=tr;
  }
  float fc;vec3 p=globeXf(u,fc);
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
  float show=1.-smoothstep(uArcShow-0.02,uArcShow+0.02,ord);
  if(t<0.)show=max(show,0.55);
  vA=al*show*pow(uGlobeW,2.2)*mix(0.12,1.,smoothstep(-0.4,0.2,fc));
  gl_PointSize=size*uDpr*(uCamD/-mv.z);
}
`;
const ARC_FRAG = /* glsl */`
precision highp float;
uniform vec3 uAcc;varying float vA;varying float vH;
void main(){vec2 uv=gl_PointCoord-0.5;float a=smoothstep(0.5,0.1,length(uv));
  vec3 c=mix(uAcc,vec3(1.),clamp(vH,0.,1.));float al=a*vA;if(al<0.01)discard;gl_FragColor=vec4(c,al);}
`;

/* ---------------- field class ---------------- */

export class Field {
  constructor(canvas, cfg) {
    this.canvas = canvas; this.cfg = cfg; this.ok = false;
    this.reduced = cfg.reduced;
    this.mobile = cfg.mobile;
    try { this.init(); this.ok = true; } catch (e) { console.warn('field init failed', e); }
  }
  init() {
    const cfg = this.cfg;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    r.setPixelRatio(this.dpr); r.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(40, 1, 10, 100000);
    this.canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());

    const N = this.N = this.mobile ? 64000 : 140000;
    const cx = Math.round(Math.sqrt(N * 2.4)), cy = Math.floor(N / cx), n = this.n = cx * cy;
    const rng = rngMaker(7);
    const aG = new Float32Array(n * 2), aR = new Float32Array(n);
    for (let ix = 0; ix < cx; ix++) for (let iy = 0; iy < cy; iy++) {
      const i = ix * cy + iy;
      aG[i * 2] = clamp((ix + (rng() - 0.5) * 0.9) / (cx - 1)); aG[i * 2 + 1] = clamp((iy + (rng() - 0.5) * 0.9) / (cy - 1));
      aR[i] = rng();
    }
    const geo = this.geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aG', new THREE.BufferAttribute(aG, 2));
    geo.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
    const pack = (arr) => { const f = new Float32Array(n * 4); for (let i = 0; i < n; i++) { const p = arr[i]; f[i * 4] = p[0]; f[i * 4 + 1] = p[1]; f[i * 4 + 2] = p[2]; f[i * 4 + 3] = p[3]; } return f; };
    const rb = rngMaker(21);
    geo.setAttribute('aSky', new THREE.BufferAttribute(pack(bakeSky(n, rb)), 4));
    geo.setAttribute('aGlobe', new THREE.BufferAttribute(pack(bakeGlobe(n, rb)), 4));
    geo.setAttribute('aLogo', new THREE.BufferAttribute(pack(ringLogo(n, rb)), 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    bakeLogo(n, rngMaker(5), cfg.logo).then((arr) => { const a = geo.getAttribute('aLogo'); a.array.set(pack(arr)); a.needsUpdate = true; }).catch((e) => console.warn('logo bake', e));

    const C = (h) => new THREE.Color(h);
    const U = this.U = {
      uTime: { value: 0 }, uIntro: { value: 0 }, uMix: { value: 0 }, uAmp: { value: 1 }, uCalm: { value: 0 },
      uDpr: { value: this.dpr }, uCamD: { value: 1000 }, uSize: { value: 2 }, uSweep: { value: 0 },
      uActA: { value: 0 }, uActB: { value: 0 }, uFrom: { value: 0 }, uTo: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) }, uA: { value: Array.from({ length: 14 }, () => new THREE.Vector4()) },
      uBlue0: { value: new THREE.Vector2(-1e5, -1e5) }, uBlue1: { value: new THREE.Vector2(-1e5, -1e5) },
      uQ: { value: Array.from({ length: 6 }, () => new THREE.Vector4()) }, uQs: { value: new Array(6).fill(0) },
      uPtr: { value: new THREE.Vector3(-1e5, -1e5, 0) }, uGlobeYaw: { value: 0.2 },
      uLo: { value: C('#6E92FF') }, uHi: { value: C('#F6F9FF') }, uAcc: { value: C('#9FE6FF') },
      uBLo: { value: C('#A9C0FF') }, uBHi: { value: C('#FFFFFF') }
    };
    this.mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false });
    this.points = new THREE.Points(geo, this.mat); this.points.frustumCulled = false;
    this.scene.add(this.points);

    // arcs
    const cities = CITIES.map((c) => ll2v(c[0], c[1]));
    const per = 70, A = [], B = [], T = [];
    ARCS.forEach(([i, j], k) => {
      for (let s = 0; s < per; s++) { A.push(...cities[i]); B.push(...cities[j]); T.push((s + 0.5) / per, (k * 0.382) % 1, k / ARCS.length); }
    });
    cities.forEach((c, i) => { A.push(...c); B.push(...c); T.push(-1, i / 12, i < 4 ? 0 : 0.5); });
    const ag = new THREE.BufferGeometry();
    ag.setAttribute('position', new THREE.BufferAttribute(new Float32Array(T.length), 3));
    ag.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(A), 3));
    ag.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(B), 3));
    ag.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(T), 3));
    ag.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    this.AU = { uTime: U.uTime, uDpr: U.uDpr, uCamD: U.uCamD, uGlobeYaw: U.uGlobeYaw, uRes: U.uRes, uA: U.uA, uAcc: U.uAcc, uGlobeW: { value: 0 }, uArcShow: { value: 1 } };
    this.arcs = new THREE.Points(ag, new THREE.ShaderMaterial({ uniforms: this.AU, vertexShader: ARC_VERT, fragmentShader: ARC_FRAG, transparent: true, depthWrite: false, depthTest: false }));
    this.arcs.frustumCulled = false; this.scene.add(this.arcs);

    // state
    this.S = 0; this.t = 0; this.ptr = { x: -1e5, y: -1e5, tx: -1e5, ty: -1e5, vel: 0, str: 0, init: false };
    this.act = { pillars: 0, ribbons: 0, aperture: 0, arcs: 1 };
    this.actS = { pillars: 0, ribbons: 0, aperture: 0, arcs: 1 };
    this.introT = 0; this.sweep = 0; this.yaw = 0.2;
    this.rects = {};
    this.resize();
    addEventListener('pointermove', (e) => {
      const p = this.ptr, W = innerWidth, H = innerHeight;
      p.tx = e.clientX - W / 2; p.ty = H / 2 - e.clientY;
      if (!p.init) { p.x = p.tx; p.y = p.ty; p.init = true; }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { this.ptr.init = false; this.ptr.tx = this.ptr.ty = -1e5; });
  }
  resize() {
    const W = innerWidth, H = innerHeight;
    this.W = W; this.H = H;
    this.renderer.setSize(W, H, false);
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    const fov = 40 * Math.PI / 180, d = (H / 2) / Math.tan(fov / 2);
    this.cam.aspect = W / H; this.cam.fov = 40; this.cam.near = d * 0.1; this.cam.far = d * 12;
    this.cam.position.set(0, 0, d); this.cam.updateProjectionMatrix();
    this.U.uCamD.value = d; this.U.uRes.value.set(W, H);
    this.U.uSize.value = (this.mobile ? 2.1 : 2.0) * clamp(W / 1500, 0.9, 1.45);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); this.renderer.setPixelRatio(this.dpr); this.U.uDpr.value = this.dpr;
  }
  /* dt seconds, time seconds */
  frame(dt, time) {
    const U = this.U, cfg = this.cfg, W = this.W, H = this.H, sy = window.scrollY;
    if (this.reduced) dt = 1;
    // anchors
    const A = U.uA.value;
    const setA = (slot, el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      A[slot].set(r.left + r.width / 2 - W / 2, H / 2 - (r.top + r.height / 2), r.width, r.height);
    };
    for (let i = 0; i < 5; i++) setA(SLOT.core + i, cfg.anchors.core[i]);
    setA(SLOT.sky, cfg.anchors.sky); setA(SLOT.globe, cfg.anchors.globe); setA(SLOT.dial, cfg.anchors.dial); setA(SLOT.own, cfg.anchors.own);
    for (let i = 0; i < 3; i++) setA(SLOT.disc + i, cfg.anchors.disc[i]);
    setA(SLOT.logo, cfg.anchors.logo);
    // stations
    const secs = cfg.sections;
    const tops = secs.map((s) => s.el.getBoundingClientRect().top + sy);
    let S = 0;
    for (let k = 1; k < secs.length; k++) S += sstep(tops[k] - H * 0.78, tops[k] - H * 0.2, sy);
    this.S += (S - this.S) * (this.reduced ? 1 : 1 - Math.exp(-dt * 5));
    const Sd = Math.min(this.S, secs.length - 1 - 1e-4);
    const i = Math.max(0, Math.floor(Sd)), f = Sd - i;
    const sa = secs[i], sb = secs[i + 1];
    U.uFrom.value = sa.form; U.uTo.value = sb.form; U.uMix.value = f < 0.0008 ? 0 : f;
    U.uAmp.value = sa.amp + (sb.amp - sa.amp) * f;
    U.uCalm.value = (sa.calm || 0) + ((sb.calm || 0) - (sa.calm || 0)) * f;
    // activity
    const as = (k) => { this.actS[k] += (this.act[k] - this.actS[k]) * (this.reduced ? 1 : 1 - Math.exp(-dt * 5)); return this.actS[k]; };
    const pil = as('pillars'), rib = as('ribbons'), apt = as('aperture'), arcs = as('arcs');
    const actFor = (form) => (form === 1 ? pil : form === 5 ? rib : form === 6 ? apt : 0);
    U.uActA.value = actFor(sa.form); U.uActB.value = actFor(sb.form);
    // globe weight
    const gw = (sa.form === 3 ? 1 - f : 0) + (sb.form === 3 ? f : 0);
    this.AU.uGlobeW.value = clamp(gw); this.AU.uArcShow.value = arcs;
    // time
    this.t += this.reduced ? 0 : dt;
    U.uTime.value = this.t;
    this.sweep += this.reduced ? 0 : dt * 0.42; U.uSweep.value = this.sweep % 6.28318;
    this.yaw += this.reduced ? 0 : dt * 0.11; U.uGlobeYaw.value = this.yaw;
    this.introT = Math.min(1, this.introT + (this.reduced ? 1 : dt / 3.2)); U.uIntro.value = this.introT;
    // blue ranges
    const bl = [U.uBlue0.value, U.uBlue1.value];
    cfg.blue.forEach((el, k) => { const r = el.getBoundingClientRect(); bl[k].set(H / 2 - r.top, H / 2 - r.bottom); });
    // quiet zones
    let qi = 0;
    for (const el of cfg.quiet) {
      if (qi >= 6) break;
      const r = el.getBoundingClientRect();
      if (r.bottom < -60 || r.top > H + 60 || r.width < 4) continue;
      U.uQ.value[qi].set(r.left - W / 2, H / 2 - r.bottom, r.right - W / 2, H / 2 - r.top);
      U.uQs.value[qi] = parseFloat(el.dataset.quiet) || 0.8; qi++;
    }
    for (; qi < 6; qi++) U.uQs.value[qi] = 0;
    // pointer
    const p = this.ptr, k = this.reduced ? 1 : 1 - Math.exp(-dt * 9);
    if (p.init) { const dx = p.tx - p.x, dy = p.ty - p.y; p.x += dx * k; p.y += dy * k; p.vel = Math.min(1, Math.hypot(dx, dy) / 40); }
    const target = p.init ? 0.35 + 0.65 * p.vel : 0;
    p.str += (target - p.str) * (1 - Math.exp(-dt * 3));
    U.uPtr.value.set(p.x, p.y, this.reduced ? 0 : p.str);
    this.renderer.render(this.scene, this.cam);
  }
}
