/* The curtain: BitGo's light-curtain background, one module for every page (set 2026-11-17).
   A height map of glowing ridges (render target) -> a normal map -> a displaced metal plane lit by a generated
   environment. Pages call createCurtain() once, then per frame set its look (dim, silver, pale, ridge count N, colour)
   and render its two maps. Variants are options here, never page copies.
   Returns: bgCol, RTW, RTH, rtOpt, heightRT, normalRT, maxAniso, ortho, quadGeo, vsh, heightMat, normalMat, quad, quadScene, dimU, silverU, paleU, curtainMat, curtain, makeEnv */
import * as THREE from 'three';

export function createCurtain({ renderer, scene, soft = false }) {
  const bgCol = new THREE.Color(0x03071a);
  scene.background = bgCol;
  /* ---------- generated environment: strips and softboxes, no image ---------- */
  function makeEnv() {
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ color: 0x02061a, side: THREE.BackSide })));
    const panel = (w, h, col, k, pos) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
    };
    const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    for (let i = 0; i < 26; i++) {
      const az = THREE.MathUtils.degToRad(-84 + i * (168 / 25)), r = 22;
      const c = i % 5 === 0 ? 0xffffff : i % 3 === 0 ? 0x7fa8ff : 0x2f63ff;
      panel(0.35 + rnd() * 1.1, 50, c, 3 + rnd() * 9, [Math.sin(az) * r, 0, Math.cos(az) * r]);
    }
    for (let i = 0; i < 12; i++) {
      const az = THREE.MathUtils.degToRad(100 + i * 14);
      panel(0.6 + rnd(), 50, i % 2 ? 0xffffff : 0x4d78ff, 4 + rnd() * 6, [Math.sin(az) * 22, 0, Math.cos(az) * 22]);
    }
    panel(34, 14, 0xc6d4ff, 1.8, [0, 22, 6]);
    panel(14, 30, 0x1647db, 3.2, [-26, 2, 4]);
    panel(10, 26, 0xe2e9ff, 2.4, [24, 0, 8]);
    panel(30, 6, 0x1647db, 2.2, [0, -20, 8]);
    const pm = new THREE.PMREMGenerator(renderer);
    const tex = pm.fromScene(env, 0.03).texture;
    pm.dispose();
    return tex;
  }
  scene.environment = makeEnv();

  /* ---------- curtain: height RT -> normal RT -> metal plane (higher resolution, analytic ridge profile) ---------- */
  const RTW = soft ? 1024 : 2048, RTH = soft ? 512 : 1024;
  const rtOpt = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  const heightRT = new THREE.WebGLRenderTarget(RTW, RTH, rtOpt);
  const normalRT = new THREE.WebGLRenderTarget(RTW, RTH, rtOpt);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  heightRT.texture.anisotropy = maxAniso; normalRT.texture.anisotropy = maxAniso;
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const vsh = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const heightMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uN: { value: 38 } }, vertexShader: vsh,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform float uT; uniform float uN;
      float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        float a=h11(i.x+i.y*57.), b=h11(i.x+1.+i.y*57.), c=h11(i.x+(i.y+1.)*57.), d=h11(i.x+1.+(i.y+1.)*57.);
        return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
      void main(){
        float x = vUv.x*uN; float id = floor(x); float f = fract(x)-.5;
        float r1=h11(id+1.7), r2=h11(id*3.1+9.2), r3=h11(id*7.7+4.4);
        float w = mix(.24,.5,r1);
        float off = (r2-.5)*.16;
        float d = abs(f-off)/w;
        float c = clamp(d,0.,1.);
        float ridge = 0.5+0.5*cos(c*3.14159);       // smooth cosine profile, zero slope at both ends
        ridge = ridge*ridge*(3.-2.*ridge);
        float amp = .5 + .5*vn(vec2(id*.8, vUv.y*2.2 - uT*.12 + r3*10.));
        float arch = .6 + .4*sin(vUv.x*3.14159);
        float hg = ridge*amp*arch;
        float sp = .12 + r1*.22;
        float ph = fract(vUv.y*.9 - uT*sp*(r2>.5?1.:-1.) + r3);
        float pulse = smoothstep(0.,.08,ph)*(1.-smoothstep(.08,.3,ph));
        pulse *= step(.5, r1*.5+r2*.5+.12)*ridge*ridge;
        gl_FragColor = vec4(hg, hg*.5+pulse*.8, hg*.9+pulse*1.3, 1.);
      }`
  });
  const normalMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: heightRT.texture }, uS: { value: 7 } }, vertexShader: vsh,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D uMap; uniform float uS;
      void main(){ vec2 e = vec2(1./${RTW}.,1./${RTH}.);
        float l=texture2D(uMap,vUv-vec2(e.x,0.)).r, r=texture2D(uMap,vUv+vec2(e.x,0.)).r;
        float d=texture2D(uMap,vUv-vec2(0.,e.y)).r, u=texture2D(uMap,vUv+vec2(0.,e.y)).r;
        vec3 n = normalize(vec3(-(r-l)*uS*.5, -(u-d)*uS*.25, 1.));
        gl_FragColor = vec4(n*.5+.5, 1.); }`
  });
  const quad = new THREE.Mesh(quadGeo, heightMat);
  const quadScene = new THREE.Scene(); quadScene.add(quad);
  const dimU = { value: 1 }, silverU = { value: 0 }, paleU = { value: 0 };
  const curtainMat = new THREE.MeshPhysicalMaterial({
    color: 0x2c4cc4, metalness: 1, roughness: 0.3, envMapIntensity: 0.38,
    displacementMap: heightRT.texture, displacementScale: 1.0, displacementBias: -0.5,
    normalMap: normalRT.texture, normalScale: new THREE.Vector2(1.3, 1.3),
    emissive: new THREE.Color(0.06, 0.22, 0.86), emissiveMap: heightRT.texture, emissiveIntensity: 0.34
  });
  curtainMat.onBeforeCompile = sh => {
    sh.uniforms.uDim = dimU; sh.uniforms.uSilver = silverU; sh.uniforms.uPale = paleU;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDim; uniform float uSilver; uniform float uPale;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n vec2 q = vEmissiveMapUv-.5; float vg = 1.-smoothstep(.22,.82,length(q*vec2(1.,1.2))); float lu = dot(gl_FragColor.rgb, vec3(.3,.45,.25)); gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(lu)*vec3(.82,.9,1.1), uSilver*.7); gl_FragColor.rgb *= uDim*mix(.38,1.,vg); float pl = dot(gl_FragColor.rgb, vec3(.3,.45,.25)); vec3 pc = mix(vec3(.36,.47,.93), vec3(.74,.81,1.), smoothstep(.0,.55,pl)); gl_FragColor.rgb = mix(gl_FragColor.rgb, pc, uPale * .85);');
  };
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(31, 18, soft ? 400 : 1100, soft ? 30 : 56), curtainMat);
  curtain.position.set(0, 0, -4.2);
  scene.add(curtain);

  return { bgCol, RTW, RTH, rtOpt, heightRT, normalRT, maxAniso, ortho, quadGeo, vsh, heightMat, normalMat, quad, quadScene, dimU, silverU, paleU, curtainMat, curtain, makeEnv };
}
