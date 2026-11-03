/* ═══════════════════════════════════════════════════════════════════════════
   AETERNA 3D SOVEREIGN STUDIO // HYPER-REALISTIC LIQUID GOLD PBR ENGINE v3.1
   Alternating 24K Gold & Glossy Obsidian Ribbons | Studio PBR | Zero Blur
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;
uniform vec2  uCenter;
uniform float uZoom;

const float TAU = 6.28318530718;

// True 24K Liquid Bullion Gold Spectral Constants (Exact Match to Reference Video)
const vec3 GOLD_BASE   = vec3(1.00, 0.76, 0.30);
const vec3 GOLD_EDGE   = vec3(1.00, 0.96, 0.82);
const vec3 GOLD_SHADOW = vec3(0.18, 0.10, 0.03);

// Deep Obsidian Piano Lacquer (Jet black satin core + mirror gloss)
const vec3 OBSIDIAN_BASE  = vec3(0.008, 0.008, 0.010);
const vec3 OBSIDIAN_CREST = vec3(0.040, 0.040, 0.050);

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0 - 2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++){ v += a*noise(p); p = m*p; a *= 0.5; }
  return v;
}

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

/* Hyper-Realistic PBR Studio Lighting Rig:
   - Key light: Overhead softbox with broad cream highlight
   - Rim light: Right sharp metallic rim
   - Fill: Subtle warm amber floor bounce */
vec3 studioPbr(vec3 R, vec3 N, vec2 mouseOffset, float roughness){
  vec3 LKey = normalize(vec3(-0.45 + mouseOffset.x*0.10, 0.80 + mouseOffset.y*0.10, 0.60));
  vec3 LRim = normalize(vec3(0.85, -0.10, 0.45));
  vec3 LAmb = normalize(vec3(0.10, -0.80, 0.35));

  float ndKey = max(dot(N, LKey), 0.0);
  float ndRim = max(dot(N, LRim), 0.0);
  float ndAmb = max(dot(N, LAmb), 0.0);

  float spKey = pow(max(dot(R, LKey), 0.0), mix(64.0, 8.0, roughness));
  float spRim = pow(max(dot(R, LRim), 0.0), mix(128.0, 24.0, roughness));

  // Softbox area light sheen
  float softbox = smoothstep(0.65, 0.98, dot(R, LKey));

  vec3 light = vec3(1.00, 0.98, 0.95) * (spKey * 3.5 + softbox * 1.8)
             + vec3(0.96, 0.90, 0.80) * (spRim * 2.8 + ndRim * 0.5)
             + vec3(0.40, 0.28, 0.12) * (ndAmb * 0.35)
             + vec3(0.020, 0.016, 0.014);
  return light;
}

/* Sculptural Molten Ribbons: Exactly 4 distinct flowing streams
   Arm 0: 24K Gold
   Arm 1: Jet Obsidian Lacquer
   Arm 2: 24K Gold
   Arm 3: Jet Obsidian Lacquer */
vec4 ribbons(vec2 p, float t, float seed){
  float r  = length(p) + 1e-4;
  float a  = atan(p.y, p.x);
  
  // Smooth logarithmic vortex twist
  float wind = 1.35;
  float aw = a + wind*log(r) - t;
  
  // Macroscopic organic breathing (fluid dynamics without high-frequency ripples)
  vec2  q  = vec2(cos(aw), sin(aw))*(0.65 + r*0.45);
  float w  = fbm(q*0.8 + seed);
  
  // Exactly 4 arms
  float arms = 4.0;
  float ph = aw*arms + w*1.5 - r*2.6;
  float cyc = fract(ph/TAU);
  float idx = floor(ph/TAU);
  float armId = mod(idx, arms);

  // Broad, majestic ribbon coverage (each ribbon covers ~70% of its cycle slot)
  float c = 0.72 + 0.18*w;
  float distToCenter = abs(cyc - 0.5);
  float halfW = c * 0.5;

  // Normalized width across ribbon [-1, 1]
  float uSym = clamp((cyc - 0.5) / halfW, -1.0, 1.0);
  
  // Physical cylindrical cross section: parabolic arch
  float h = sqrt(max(0.0, 1.0 - uSym*uSym));
  h = h * h * (3.0 - 2.0 * h); // Hermite smoothing

  // Eye of the vortex in the very center
  h *= smoothstep(0.035, 0.25, r);

  // Sharp, clean ribbon edge
  float edgeDist = halfW - distToCenter;
  float cov = smoothstep(0.0, 0.040, edgeDist) * smoothstep(0.030, 0.12, r);

  // Left-side negative space fade (keeps hero text 100% clean over obsidian void)
  float leftFade = smoothstep(-0.65, 0.05, p.x);
  cov *= leftFade;

  // Arm 0 & 2 = Gold (1.0), Arm 1 & 3 = Obsidian (0.0)
  float isGold = (armId == 0.0 || armId == 2.0) ? 1.0 : 0.0;

  return vec4(h, isGold, cov, r);
}

vec3 shadeRibbons(vec2 p, float t, float seed, float e, vec2 mouseOffset, out float alpha){
  vec4 f0 = ribbons(p, t, seed);
  alpha = f0.z;
  if (alpha <= 0.001) return vec3(0.0);

  float hx = ribbons(p + vec2(e, 0.0), t, seed).x;
  float hy = ribbons(p + vec2(0.0, e), t, seed).x;
  
  vec2 g = vec2(hx - f0.x, hy - f0.x) / e * 0.062;
  float gl = length(g);
  if (gl > 2.6) g *= 2.6 / gl;

  vec3 N = normalize(vec3(-g, 1.0));
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);
  float fr = pow(1.0 - clamp(N.z, 0.0, 1.0), 4.2);

  // Gold vs Obsidian PBR response
  if (f0.y > 0.5) {
    // 24K Liquid Gold
    vec3 pbrLight = studioPbr(R, N, mouseOffset, 0.03);
    vec3 col = mix(GOLD_BASE, GOLD_EDGE, fr) * pbrLight + GOLD_SHADOW * 0.5;
    // Ambient occlusion in deep folds
    col *= mix(0.25, 1.0, smoothstep(0.0, 0.65, f0.x));
    return col;
  } else {
    // Deep Obsidian Piano Lacquer (Ultra-gloss mirror finish with chrome rim)
    vec3 pbrLight = studioPbr(R, N, mouseOffset, 0.015);
    vec3 col = mix(OBSIDIAN_BASE, OBSIDIAN_CREST, fr*0.6) + pbrLight * (0.04 + 0.96*fr);
    col *= mix(0.30, 1.0, smoothstep(0.0, 0.55, f0.x));
    return col;
  }
}

/* Floating mirror-polished 24K gold spheres */
void sphereLayer(vec2 p, float t, bool front, vec2 mouseOffset, inout vec3 col){
  for (int i = 0; i < 12; i++){
    float fi = float(i);
    float h1 = hash(vec2(fi, 1.37)), h2 = hash(vec2(fi, 7.19)), z = hash(vec2(fi, 3.73));
    if (front != (z > 0.50)) continue;

    float orbit = 0.28 + h1*1.15;
    float ang = h2*TAU + t*(0.35 - 0.15*h1);
    vec2  c = vec2(cos(ang), sin(ang)*0.82)*orbit;
    
    // Negative space protection
    if (c.x < -0.75) continue;

    float rad  = mix(0.024, 0.075, z*z)*(0.85 + 0.45*h2);
    float d = length(p - c)/rad;
    float a = 1.0 - smoothstep(0.92, 1.0, d);
    if (a <= 0.0) continue;

    float dd = min(d, 0.999);
    vec3 n = normalize(vec3((p - c)/rad, sqrt(1.0 - dd*dd)));
    vec3 R = reflect(vec3(0.0, 0.0, -1.0), n);
    float fr = pow(1.0 - n.z, 3.8);

    vec3 pbrLight = studioPbr(R, n, mouseOffset, 0.03);
    vec3 sc = mix(GOLD_BASE, GOLD_EDGE, fr) * pbrLight + GOLD_SHADOW * 0.4;
    sc *= mix(0.45, 1.0, z);

    // Drop shadow
    float shadow = exp(-length(p - (c + vec2(0.025, -0.030)))*14.0/rad);
    col *= 1.0 - shadow*0.45*(1.0 - a);

    col = mix(col, sc, a);
  }
}

/* Ambient Gold Micro-Dust */
float goldDust(vec2 p, float t){
  float r = length(p);
  vec2 q = rot(t*0.30 + 0.35/(r + 0.25))*p;
  float acc = 0.0;
  for (int k = 0; k < 2; k++){
    float sc = (k == 0) ? 42.0 : 90.0;
    vec2 g  = q*sc + float(k)*17.3;
    vec2 id = floor(g), f = fract(g) - 0.5;
    float rn = hash(id);
    if (rn > 0.93){
      vec2 o = vec2(hash(id + 2.7), hash(id + 8.1)) - 0.5;
      float d = length(f - o*0.65);
      float tw = 0.4 + 0.6*sin(t*7.0 + rn*30.0);
      acc += exp(-d*d*((k == 0) ? 75.0 : 150.0))*tw*((k == 0) ? 1.0 : 0.55);
    }
  }
  float band = smoothstep(0.12, 0.40, r)*smoothstep(1.8, 0.8, r);
  return acc*band;
}

vec3 aces(vec3 x){ return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  vec2 m = (uMouse - 0.5);
  vec2 frag = gl_FragCoord.xy;
  
  vec2 p = (frag - uRes*uCenter)/uRes.y*2.0/uZoom;
  float e = 1.3/uRes.y*2.0/uZoom;
  
  // Autonomous fluid rotation
  float t = uTime * 0.14;

  float r0 = length(p);
  // Warm obsidian room ambiance
  vec3 col = vec3(0.008, 0.007, 0.006) + GOLD_BASE*0.015*exp(-r0*1.3);

  /* Deep background spiral layer */
  float aB;
  vec2 pB = rot(0.85)*p;
  vec3 cB = shadeRibbons(pB, t*0.88, 7.3, e*1.2, m, aB);
  col = mix(col, cB*0.45, aB*0.90);

  /* Back floating spheres */
  sphereLayer(p, t, false, m, col);

  /* Main foreground sculptural ribbons (Obsidian & Gold) */
  float aF;
  vec3 cF = shadeRibbons(p, t, 1.0, e, m, aF);

  // Ambient occlusion shadow cast onto underlying layers
  col *= 1.0 - 0.65*smoothstep(0.0, 0.70, aF);
  col = mix(col, cF, aF);

  /* Foreground floating spheres */
  sphereLayer(p, t, true, m, col);

  // Micro Gold Dust
  col += vec3(1.0, 0.88, 0.55) * goldDust(p, t) * 1.5 * (1.0 - 0.5*aF);

  // Vignette & ACES Tone Mapping
  vec2 sv = frag/uRes - 0.5;
  col *= 1.0 - 0.42*dot(sv, sv)*1.4;
  col = aces(col*1.22);
  col = pow(col, vec3(1.0/2.2));
  
  // Dither
  col += (hash(frag + fract(uTime)*73.1) - 0.5)*0.008;
  
  gl_FragColor = vec4(col, 1.0);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error('[AeternaLiquidVortex] shader: ' + log);
    }
    return s;
  }

  function mount(canvas, opts) {
    opts = opts || {};
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) { canvas.classList.add('vortex-fallback'); return null; }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ['uRes', 'uTime', 'uMouse', 'uCenter', 'uZoom'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

    // ZERO BLUR: Locked full crisp native resolution (capped at 2.0 for Retina/4K)
    const maxDpr = opts.maxDpr || 2;
    const scale = Math.min(global.devicePixelRatio || 1, maxDpr);

    const state = {
      center: (opts.center || [0.72, 0.50]).slice(),
      zoom: opts.zoom || 1.15,
      mouse: [0.5, 0.5],
      tMouse: [0.5, 0.5],
    };

    function resize() {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale));
      const h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function onMove(e) {
      state.tMouse[0] = e.clientX / global.innerWidth;
      state.tMouse[1] = 1 - e.clientY / global.innerHeight;
    }
    global.addEventListener('pointermove', onMove, { passive: true });
    global.addEventListener('resize', resize);

    const reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let raf = 0;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;

      // Smooth studio light specular response
      state.mouse[0] += (state.tMouse[0] - state.mouse[0]) * 0.04;
      state.mouse[1] += (state.tMouse[1] - state.mouse[1]) * 0.04;

      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, reduced ? 0 : (now - t0) / 1000);
      gl.uniform2f(U.uMouse, state.mouse[0], state.mouse[1]);
      gl.uniform2f(U.uCenter, state.center[0], state.center[1]);
      gl.uniform1f(U.uZoom, state.zoom);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    resize();
    raf = requestAnimationFrame(frame);

    return {
      setTarget(t) {
        if (t.center) { state.center[0] = t.center[0]; state.center[1] = t.center[1]; }
        if (typeof t.zoom === 'number') state.zoom = t.zoom;
      },
      setScroll() {},
      getScale() { return scale; },
      destroy() {
        cancelAnimationFrame(raf);
        global.removeEventListener('pointermove', onMove);
        global.removeEventListener('resize', resize);
      },
    };
  }

  global.AeternaLiquidVortex = { mount };
})(window);
