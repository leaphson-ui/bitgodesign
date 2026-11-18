import * as THREE from 'three';

const KEYS = ['cx','lx','ly','r1','g1','b1','r2','g2','b2','int','gap','slab','top','asym','step','fin','lintel','ringR','ringI','rays','flood','shatter','tilt'];

const FRAG = /* glsl */`
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uM; uniform float uGlitch;
uniform float uCx, uLx, uLy, uInt, uGap, uSlab, uTop, uAsym, uStep, uFin, uLintel, uRingR, uRingI, uRays, uFlood, uShatter, uTilt;
uniform vec3 uC1, uC2;
varying vec2 vUv;

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*noise(p); p=p*2.03+7.1; a*=.5; } return s; }
float sdBox(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }

// A stepped monolith: two slabs split by a slit that widens in tiers, an optional floating keystone, and fins.
// p is already centred on the form.
float form(vec2 p){
  if(uShatter>.001){
    vec2 q=p*vec2(2.4,1.9); vec2 c=floor(q);
    vec2 h=vec2(hash(c),hash(c+3.7))-.5;
    p += h*uShatter*vec2(1.1,.8);
    p.x += sin(c.y*2.1+c.x)*uShatter*.12;
  }
  p.x += p.y*uTilt;
  float ax=abs(p.x);
  float tier=max(floor((p.y+1.2)*2.2),0.);
  float gap=uGap+uStep*.06*tier;
  float top=uTop+uAsym*sign(p.x+1e-4);
  float cy=(top-1.4)*.5, hy=(top+1.4)*.5;
  float d=sdBox(vec2(ax-(gap+uSlab),p.y-cy), vec2(uSlab,hy));
  if(uLintel>-5.) d=min(d, sdBox(vec2(p.x,p.y-uLintel), vec2(uGap*.8+.03,.05)));
  if(uFin>.01){
    float px=ax-(gap+2.*uSlab)-.1;
    if(px>0.){
      float pitch=.3; float id=floor(px/pitch);
      float q=mod(px,pitch)-pitch*.5;
      float fh=uFin*(.45+.55*hash(vec2(id,2.)));
      d=min(d, sdBox(vec2(q,p.y+1.4-fh), vec2(.075,fh)));
    }
  }
  return d;
}

void main(){
  vec2 fc=gl_FragCoord.xy;
  float unit=.5*min(uRes.y, uRes.x*1.15);
  float aspect=uRes.x/uRes.y;
  float sh=clamp(aspect/1.6,.2,1.);
  vec2 p=(fc-.5*uRes)/unit;

  // rare glitch: row bands slide sideways
  float gl=0.;
  if(uGlitch>.01){
    float band=floor(fc.y/(uRes.y/36.));
    float tk=floor(uTime*14.);
    float hv=hash(vec2(band,tk));
    if(hv>1.-.3*uGlitch){ p.x+=(hash(vec2(band,tk+9.))-.5)*.5*uGlitch; gl=1.; }
  }

  float cx=uCx*sh;
  vec2 L=vec2(cx+uLx*sh, uLy)+uM*.025;
  vec2 pp=p-uM*.012;
  vec2 pf=pp-vec2(cx,0.);           // form-local coordinates

  float d=form(pf);
  float inside=smoothstep(.003,-.003,d);

  vec2 dl=L-pp; float r=length(dl);
  float T=uTime;
  float pulse=1.+.035*sin(T*.7)+.02*sin(T*1.7+1.);

  float core=.006/(r*r+.006);
  float bloom=exp(-r*2.6);
  float haze=exp(-r*.85);

  // god rays: march from the pixel to the light, count open samples
  float rays=0.;
  float jit=hash(fc+fract(T)*61.);
  for(int i=0;i<26;i++){
    float t=(float(i)+jit)/26.;
    vec2 q=pp+dl*t;
    float v=step(0.,form(q-vec2(cx,0.)));
    rays+=v*exp(-length(L-q)*3.4);
  }
  rays/=26.;

  // prismatic halo ring: per-channel radius split
  float ang=atan(dl.y,dl.x);
  float wob=.6+.4*noise(vec2(ang*1.7+T*.05, r*3.));
  float wv=.028+.02*noise(vec2(ang*3.,1.+T*.04));
  vec3 ringc=vec3(0.);
  for(int c=0;c<3;c++){
    float rr=uRingR*(1.+(1.-float(c))*.085);
    float x=(r-rr)/wv;
    ringc[c]=exp(-x*x);
  }
  float arc=.45+.55*pow(.5+.5*cos(ang-1.1+T*.05),1.6);
  ringc*=arc*wob;
  vec3 ringTint=mix(vec3(1.), uC2*1.5, .55);
  vec3 ring=ringc*ringTint*uRingI*(1.-inside);
  float ringBloom=exp(-pow((r-uRingR)/.28,2.))*.16*uRingI;

  // floor pool of light
  float floorY=-.66;
  float pool=smoothstep(floorY+.02,floorY-.12,pp.y)*exp(-abs(pp.x-L.x)*1.5)*exp(-(floorY-pp.y)*1.6)*.55;
  float horizon=exp(-abs(pp.y-floorY)*55.)*exp(-abs(pp.x-L.x)*.9)*.4;

  vec3 white=vec3(1.);
  vec3 lightCol = uC1*(bloom*.7+haze*.1+rays*(.8*uRays)) + mix(uC1,white,.45)*core*1.1;
  lightCol += uC1*ringBloom + (pool+horizon)*mix(uC1,white,.25);
  lightCol *= uInt*pulse;

  vec3 bg=vec3(.004,.007,.016);
  float fl=uFlood*(.62+.38*smoothstep(-1.,1.,pp.y*.8+.3)+.25*exp(-r*.9));
  fl*= .85+.3*fbm(pp*2.2+T*.02);
  vec3 open = bg + lightCol + ring + uC1*fl*.95;

  // form surface
  vec3 fcol=vec3(.006,.008,.016);
  float stone=fbm(pp*vec2(9.,5.)+3.)*.6+fbm(pp*34.)*.4;
  fcol*=.6+stone*1.1;
  fcol+=uC1*(.085*exp(-r*1.3))*uInt*(.5+stone*.8);
  fcol+=uC1*uFlood*(.05+.04*stone);
  if(d<.12){
    vec2 e=vec2(.004,0.);
    vec2 n=normalize(vec2(form(pf+e.xy)-form(pf-e.xy), form(pf+e.yx)-form(pf-e.yx))+1e-5);
    float facing=max(dot(n,normalize(dl)),0.);
    float rim=exp(min(d,0.)*70.)*(.12+.88*facing);
    fcol+=mix(uC1,white,.45)*rim*(.9*uInt)*exp(-r*.35);
  }
  fcol+=uC1*haze*.04*uInt;
  vec3 col=mix(open,fcol,inside);

  col+=gl*uC1*.35*uGlitch*step(.5,hash(vec2(floor(fc.x/18.),floor(uTime*20.))));

  // tone, grain, vignette
  col=1.-exp(-col*1.05);
  float g1=hash(fc+vec2(fract(T*7.31)*917.,fract(T*3.17)*443.))-.5;
  float g2=hash(floor(fc*.5)+vec2(fract(T*5.13)*311.,7.))-.5;
  float gr=g1*.75+g2*.5;
  float lm=dot(col,vec3(.33));
  col*=1.+gr*(.4*smoothstep(.0,.35,lm)*(1.-smoothstep(.55,1.,lm))+.1);
  col+=gr*.05;
  vec2 vq=vUv-.5; col*=1.-.55*dot(vq,vq);
  gl_FragColor=vec4(max(col,0.),1.);
}`;

export function initScene(canvas){
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:false, alpha:false, powerPreference:'high-performance'}); }
  catch(e){ canvas.style.display='none'; return null; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const U = {
    uRes:{value:new THREE.Vector2(1,1)}, uTime:{value:3}, uM:{value:new THREE.Vector2()}, uGlitch:{value:0},
    uCx:{value:0}, uLx:{value:0}, uLy:{value:0}, uInt:{value:1}, uGap:{value:.1}, uSlab:{value:1}, uTop:{value:2},
    uAsym:{value:0}, uStep:{value:0}, uFin:{value:0}, uLintel:{value:-9}, uRingR:{value:.5}, uRingI:{value:.5},
    uRays:{value:1}, uFlood:{value:0}, uShatter:{value:0}, uTilt:{value:0},
    uC1:{value:new THREE.Vector3(.09,.27,.95)}, uC2:{value:new THREE.Vector3(.7,.3,1)}
  };
  const mat = new THREE.ShaderMaterial({
    uniforms:U, depthTest:false, depthWrite:false,
    vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader:FRAG
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat));

  let scale = Math.min(devicePixelRatio||1, 1.5) * .8;
  function resize(){
    renderer.setPixelRatio(1);
    renderer.setSize(Math.round(innerWidth*scale), Math.round(innerHeight*scale), false);
    canvas.style.width='100%'; canvas.style.height='100%';
    U.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
  }
  resize(); addEventListener('resize', resize);

  const cur = {}, tgt = {};
  let ready=false;
  function setTarget(t){ for(const k of KEYS){ tgt[k]=t[k]; if(cur[k]===undefined) cur[k]=t[k]; } ready=true; }
  function apply(){
    const c=cur;
    U.uCx.value=c.cx; U.uLx.value=c.lx; U.uLy.value=c.ly; U.uInt.value=c.int; U.uGap.value=Math.max(c.gap,.012);
    U.uSlab.value=Math.max(c.slab,.05); U.uTop.value=c.top; U.uAsym.value=c.asym; U.uStep.value=c.step; U.uFin.value=c.fin;
    U.uLintel.value=c.lintel; U.uRingR.value=c.ringR; U.uRingI.value=c.ringI; U.uRays.value=c.rays; U.uFlood.value=c.flood;
    U.uShatter.value=c.shatter; U.uTilt.value=c.tilt;
    U.uC1.value.set(c.r1,c.g1,c.b1); U.uC2.value.set(c.r2,c.g2,c.b2);
  }
  const mouse={x:0,y:0,tx:0,ty:0};
  addEventListener('pointermove', e=>{ mouse.tx=e.clientX/innerWidth*2-1; mouse.ty=-(e.clientY/innerHeight*2-1); }, {passive:true});

  let glitch=0, last=performance.now(), t0=last, slow=0, dirty=true;
  function glitchBurst(a){ if(!reduce) glitch=Math.max(glitch,a); }
  function frame(now){
    requestAnimationFrame(frame);
    if(document.hidden || !ready) return;
    const dt=Math.min((now-last)/1000,.1); last=now;
    const k=1-Math.exp(-dt*(reduce?30:3.2));
    let moving=false;
    for(const key of KEYS){ const dd=tgt[key]-cur[key]; if(Math.abs(dd)>1e-4){ cur[key]+=dd*k; moving=true; } }
    mouse.x+=(mouse.tx-mouse.x)*Math.min(1,dt*3); mouse.y+=(mouse.ty-mouse.y)*Math.min(1,dt*3);
    glitch=Math.max(0,glitch-dt*2.2);
    if(reduce && !moving && !dirty) return;
    dirty=false;
    apply();
    U.uTime.value = reduce ? 3 : 3+(now-t0)/1000;
    U.uM.value.set(reduce?0:mouse.x, reduce?0:mouse.y);
    U.uGlitch.value=glitch;
    renderer.render(scene,cam);
    if(dt>.045) slow++; else slow=Math.max(0,slow-.25);
    if(slow>12 && scale>.38){ scale*=.8; slow=0; resize(); }
  }
  requestAnimationFrame(frame);
  canvas.addEventListener('webglcontextlost', e=>{ e.preventDefault(); canvas.style.display='none'; });
  return { setTarget, glitchBurst, KEYS };
}
