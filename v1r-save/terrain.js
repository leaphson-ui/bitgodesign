/* Live raymarched terrain in a BitGo-blue palette. Raw WebGL, low internal resolution, grain hides the softness. */
(function () {
  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uFly; uniform vec2 uMouse;
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }
const mat2 R = mat2(0.80,0.60,-0.60,0.80);
float pathX(float z){ return sin(z*0.11)*1.7 + sin(z*0.043)*2.6; }
float height(vec2 p, int oct){
  float px = p.x - pathX(p.y);
  float v = smoothstep(0.2,4.6,abs(px));
  vec2 q = p*0.21; float a = 0.55, h = 0.0;
  for(int i=0;i<6;i++){ if(i>=oct) break;
    float n = noise(q); n = 1.0 - abs(2.0*n-1.0); h += a*n*n; q = R*q*2.03; a *= 0.5; }
  return h*5.2*(0.05+0.95*v);
}
vec3 skyCol(vec3 rd, vec3 sun){
  float y = clamp(rd.y,0.0,1.0);
  vec3 top = vec3(0.012,0.028,0.13), mid = vec3(0.086,0.28,0.86), hor = vec3(0.62,0.76,1.0);
  vec3 c = mix(hor, mid, smoothstep(0.0,0.22,y));
  c = mix(c, top, smoothstep(0.18,0.85,y));
  float s = max(dot(rd,sun),0.0);
  c += vec3(0.45,0.62,1.0)*pow(s,6.0)*0.42 + vec3(0.9,0.95,1.0)*pow(s,300.0)*0.7;
  vec2 g = rd.xz/(rd.y+0.4)*90.0; float st = step(0.9965, hash(floor(g)));
  c += st*smoothstep(0.25,0.7,y)*0.8;
  return c;
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes)/uRes.y;
  vec3 sun = normalize(vec3(0.04,0.13,1.0));
  float z = uTime*0.28 + uFly;
  vec3 ro = vec3(pathX(z) + uMouse.x*0.8, 0.0, z);
  ro.y = height(vec2(pathX(z),z),4) + 1.25 + uMouse.y*0.3;
  vec3 ta = vec3(pathX(z+4.0)+uMouse.x*1.4, ro.y - 0.25, z + 4.0);
  vec3 ww = normalize(ta-ro), uu = normalize(cross(ww,vec3(0.,1.,0.))), vv = cross(uu,ww);
  vec3 rd = normalize(uv.x*uu + uv.y*vv + 1.45*ww);
  float t = 0.15, hit = 0.0; vec3 p = ro;
  for(int i=0;i<64;i++){
    p = ro + rd*t; float d = p.y - height(p.xz,4);
    if(d < 0.0025*t){ hit = 1.0; break; }
    t += max(0.012*t, 0.4*d); if(t>60.0) break;
  }
  vec3 col = skyCol(rd,sun);
  if(hit>0.5){
    float h = height(p.xz,6);
    vec2 e = vec2(0.012*t+0.002,0.0);
    vec3 n = normalize(vec3(height(p.xz-e.xy,6)-height(p.xz+e.xy,6), 2.0*e.x, height(p.xz-e.yx,6)-height(p.xz+e.yx,6)));
    float key = clamp(dot(n,normalize(vec3(-0.55,0.75,-0.25))),0.0,1.0);
    float back = clamp(dot(n,sun),0.0,1.0);
    float rim = pow(1.0-clamp(n.y,0.0,1.0),2.2);
    vec3 shadow = vec3(0.008,0.02,0.10), lit = vec3(0.07,0.24,0.92), ice = vec3(0.72,0.84,1.0);
    vec3 m = mix(shadow, lit, key*key*1.15);
    m = mix(m, vec3(0.02,0.05,0.24), smoothstep(1.2,0.0,h)*0.7);
    m += vec3(0.30,0.52,1.0)*back*0.35;
    m = mix(m, ice, smoothstep(3.2,4.4,h + n.y*0.6)*0.75);
    m += ice*rim*(0.12+back*0.5);
    float lf = abs(fract(h*2.0)-0.5)*2.0;
    float ln = smoothstep(1.0-(0.02+t*0.004),1.0,lf);
    m += vec3(0.30,0.60,1.0)*ln*0.38*smoothstep(40.0,4.0,t);
    float fog = 1.0 - exp(-t*t*0.0011);
    col = mix(m, skyCol(vec3(rd.x,0.02,rd.z),sun), fog);
  }
  col += (hash(gl_FragCoord.xy + fract(uTime)*91.7)-0.5)*0.055;
  col *= 1.0 - 0.35*dot(uv,uv);
  col = pow(max(col,0.0), vec3(0.92));
  gl_FragColor = vec4(col,1.0);
}`;
  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  function init(canvas) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(pr, n);
    const uRes = U('uRes'), uTime = U('uTime'), uFly = U('uFly'), uMouse = U('uMouse');
    let W = 0, H = 0;
    function size() {
      const cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight;
      const w = Math.min(720, Math.round(cw * 0.5)), h = Math.round(w * ch / cw);
      if (w !== W || h !== H) { W = canvas.width = w; H = canvas.height = h; gl.viewport(0, 0, W, H); }
    }
    return {
      draw(time, fly, mx, my) {
        size();
        gl.uniform2f(uRes, W, H); gl.uniform1f(uTime, time); gl.uniform1f(uFly, fly); gl.uniform2f(uMouse, mx, my);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }
  window.BitGoTerrain = { init };
})();
