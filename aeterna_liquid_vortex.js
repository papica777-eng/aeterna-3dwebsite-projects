/* ═══════════════════════════════════════════════════════════════════════════
   AETERNA 3D SOVEREIGN STUDIO // HYPER-REALISTIC LIQUID GOLD PBR ENGINE v2.0
   Physical Anisotropic Gold & Obsidian Lacquer | Viscous Droplets | Studio PBR
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
uniform float uTwist;

const float TAU = 6.28318530718;

// True 24K Liquid Bullion Gold Spectral Constants
const vec3  GOLD_BASE = vec3(1.00, 0.766, 0.336);
const vec3  GOLD_EDGE = vec3(1.00, 0.94, 0.78);
const vec3  GOLD_AMB  = vec3(0.35, 0.22, 0.06);

// Deep Obsidian Piano Lacquer
const vec3  OBSIDIAN_BASE = vec3(0.003, 0.003, 0.004);

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++){ v += a*noise(p); p = m*p; a *= 0.5; }
  return v;
}
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

/* Hyper-Realistic PBR Studio Lighting Rig:
   1. Overhead Softbox Key Light (Cream white, broad gradient)
   2. Right Rim Strip Light (Sharp metallic razor edge)
   3. Amber Floor Bounce (Radiant warm fill)
   4. Specular Pin Glints (Diamond-like sparks) */
vec3 studioPbr(vec3 R, vec3 N, float roughness){
  vec3 LKey = normalize(vec3(-0.45, 0.75, 0.65));
  vec3 LRim = normalize(vec3(0.85, -0.10, 0.45));
  vec3 LAmb = normalize(vec3(0.10, -0.85, 0.50));

  float ndKey = max(dot(N, LKey), 0.0);
  float ndRim = max(dot(N, LRim), 0.0);
  float ndAmb = max(dot(N, LAmb), 0.0);

  float spKey = pow(max(dot(R, LKey), 0.0), mix(40.0, 4.0, roughness));
  float spRim = pow(max(dot(R, LRim), 0.0), mix(90.0, 16.0, roughness));

  // Softbox area diffusion
  float softbox = smoothstep(0.70, 0.98, dot(R, LKey));

  vec3 light = vec3(1.00, 0.98, 0.92) * (spKey * 2.8 + softbox * 1.4)
             + vec3(0.95, 0.88, 0.75) * (spRim * 2.2 + ndRim * 0.4)
             + vec3(0.40, 0.28, 0.12) * (ndAmb * 0.35)
             + vec3(0.015, 0.012, 0.010);
  return light;
}

/* Spiral ribbon field with Viscous Liquid Droplets & Anisotropic Folds */
vec3 ribbons(vec2 p, float t, float arms, float wind, float seed, float cover){
  float r  = length(p) + 1e-4;
  float a  = atan(p.y, p.x);
  float aw = a + wind*log(r) - t;
  vec2  q  = vec2(cos(aw), sin(aw))*(0.5 + r*0.8);
  float w  = fbm(q*1.2 + seed);
  float ph = aw*arms + w*2.4 - r*3.6;

  float cyc = fract(ph/TAU);
  float idx = floor(ph/TAU);
  float rid = mod(idx, arms);

  // Viscous fluid droplet tear-off along edge
  float dropNoise = fbm(q*6.0 + t*0.8);
  float edgeTendril = sin(ph*12.0 + w*7.0)*0.045*smoothstep(0.15, 0.8, r);

  float c   = cover*(0.76 + 0.48*w)*(0.48 + 0.75*hash(vec2(rid, seed)));
  float x   = clamp((cyc - (1.0 - c)*0.5 + edgeTendril)/c, 0.0, 1.0);

  // 3D Tubular Rolling Sheet
  float roll = 0.5 + 0.36*sin(r*5.0 + w*4.0 + seed);
  float h  = x < roll ? sin(x/roll*1.5707963) : cos((x - roll)/(1.0 - roll)*1.5707963);
  h = h*h*(3.0 - 2.0*h);

  // Brushed satin silk anisotropic micro-grooves
  h += 0.035*sin(x*TAU*(4.0 + 3.0*r) + w*4.0)*h;
  h *= smoothstep(0.018, 0.22, r); // Center vortex eye opening

  float gold = mod(rid + floor(seed), 2.0);
  float edge = min(cyc - (1.0 - c)*0.5 + edgeTendril, (1.0 + c)*0.5 - cyc - edgeTendril);
  float cov  = smoothstep(0.0, 0.020, edge)*smoothstep(0.018, 0.07, r);
  return vec3(h, gold, cov);
}

vec3 shadeRibbon(vec2 p, float t, float arms, float wind, float seed, float cover, float e, out float alpha){
  vec3 f0 = ribbons(p, t, arms, wind, seed, cover);
  alpha = f0.z;
  if (alpha <= 0.001) return vec3(0.0);

  float hx = ribbons(p + vec2(e, 0.0), t, arms, wind, seed, cover).x;
  float hy = ribbons(p + vec2(0.0, e), t, arms, wind, seed, cover).x;
  vec2 g = vec2(hx - f0.x, hy - f0.x)/e*0.052;
  float gl = length(g);
  if (gl > 2.8) g *= 2.8/gl;

  vec3 N = normalize(vec3(-g, 1.0));
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);
  float fr = pow(1.0 - clamp(N.z, 0.0, 1.0), 4.5);

  // PBR Surface Response
  vec3 PbrKey = studioPbr(R, N, mix(0.12, 0.02, f0.y));

  // Liquid Gold: Deep Metallic Conductor Fresnel (Schlick Complex)
  vec3 goldColor = mix(GOLD_BASE, GOLD_EDGE, fr) * PbrKey + GOLD_AMB*0.4;

  // Obsidian Clearcoat Lacquer: Pure Deep Black with Brilliant White Mirror Sheen
  vec3 obsidianColor = OBSIDIAN_BASE + PbrKey * (0.04 + 0.96*fr);

  vec3 col = mix(obsidianColor, goldColor, f0.y);

  // Ambient Occlusion in deep fluid folds
  float ao = smoothstep(0.0, 0.60, f0.x);
  col *= mix(0.20, 1.0, ao);
  return col;
}

void sphereLayer(vec2 p, float t, bool front, inout vec3 col){
  for (int i = 0; i < 14; i++){
    float fi = float(i);
    float h1 = hash(vec2(fi, 1.3)), h2 = hash(vec2(fi, 7.1)), z = hash(vec2(fi, 3.7));
    if (front != (z > 0.52)) continue;
    float orbit = 0.24 + h1*1.15;
    float ang = h2*TAU + t*(0.50 - 0.22*h1);
    vec2  c = vec2(cos(ang), sin(ang)*0.84)*orbit
            + vec2(sin(t*1.2 + fi), cos(t*1.0 + fi*1.7))*0.03;
    float rad  = mix(0.016, 0.095, z*z)*(0.75 + 0.55*h2);
    float blur = 0.04 + 0.55*smoothstep(0.82, 1.0, z) + 0.35*smoothstep(0.25, 0.0, z);
    float d = length(p - c)/rad;
    float a = 1.0 - smoothstep(1.0 - blur, 1.0, d);
    if (a <= 0.0) continue;

    float dd = min(d, 0.999);
    vec3 n = vec3((p - c)/rad, sqrt(1.0 - dd*dd));
    n = normalize(n);
    vec3 R = reflect(vec3(0.0, 0.0, -1.0), n);
    float fr = pow(1.0 - n.z, 4.0);

    vec3 pbrLight = studioPbr(R, n, 0.05);
    vec3 sc = mix(GOLD_BASE, GOLD_EDGE, fr) * pbrLight + GOLD_AMB*0.35;
    sc *= mix(0.35, 1.0, z); // Depth shading

    // Realistic Contact Shadow under front spheres
    col = mix(col, sc, a);
  }
}

float dust(vec2 p, float t){
  float r = length(p);
  vec2 q = rot(t*0.55 + 0.50/(r + 0.22))*p;
  float acc = 0.0;
  for (int k = 0; k < 2; k++){
    float sc = (k == 0) ? 52.0 : 110.0;
    vec2 g  = q*sc + float(k)*13.1;
    vec2 id = floor(g), f = fract(g) - 0.5;
    float rn = hash(id);
    if (rn > 0.92){
      vec2 o = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
      float d = length(f - o*0.7);
      float tw = 0.45 + 0.55*sin(t*9.0 + rn*40.0);
      acc += exp(-d*d*((k == 0) ? 80.0 : 160.0))*tw*((k == 0) ? 1.0 : 0.6);
    }
  }
  float band = smoothstep(0.10, 0.45, r)*smoothstep(1.7, 0.7, r);
  float lane = 0.35 + 0.65*smoothstep(0.2, 0.8, fbm(q*2.0 + 4.0));
  return acc*band*lane;
}

vec3 aces(vec3 x){ return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  vec2 m = (uMouse - 0.5);
  vec2 frag = gl_FragCoord.xy;
  vec2 p  = (frag - uRes*uCenter)/uRes.y*2.0/uZoom;
  float e = 1.6/uRes.y*2.0/uZoom;
  float t = uTime*0.18 + uTwist;

  float r0 = length(p);
  // Deep warm obsidian room glow
  vec3 col = vec3(0.010, 0.009, 0.008) + GOLD_BASE*0.022*exp(-r0*1.3);

  /* Back spiral — deeper, darker, parallax delayed */
  float aB;
  vec2 pB = rot(1.35)*(p*1.18 + m*0.03);
  vec3 cB = shadeRibbon(pB, t*0.7, 7.0, 1.7, 6.0, 0.56, e*1.15, aB);
  col = mix(col, cB*0.48, aB*0.92);

  vec2 pS = p + m*0.05;
  sphereLayer(pS, t, false, col);

  /* Front spiral — full physical studio gloss */
  float aF;
  vec2 pF = p + m*0.07;
  vec3 cF = shadeRibbon(pF, t, 6.0, 1.5, 1.0, 0.64, e, aF);

  // Cast deep contact occlusion shadow onto layers underneath
  col *= 1.0 - 0.65*smoothstep(0.0, 0.8, aF);
  col = mix(col, cF, aF);

  sphereLayer(p + m*0.10, t, true, col);

  // Micro Gold Dust
  col += vec3(1.0, 0.86, 0.52)*dust(p + m*0.06, t)*1.8*(1.0 - 0.7*aF);

  // Cinematic Vignette & ACES Film Tone Mapping
  vec2 sv = frag/uRes - 0.5;
  col *= 1.0 - 0.52*dot(sv, sv)*1.5;
  col = aces(col*1.20);
  col = pow(col, vec3(1.0/2.2));
  col += (hash(frag + fract(uTime)*91.7) - 0.5)*0.014;
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
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
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
    ['uRes', 'uTime', 'uMouse', 'uCenter', 'uZoom', 'uTwist'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

    const maxDpr = opts.maxDpr || 2;
    let scale = Math.min(global.devicePixelRatio || 1, maxDpr);
    const state = {
      center: (opts.center || [0.5, 0.5]).slice(),
      zoom: opts.zoom || 1,
      tCenter: (opts.center || [0.5, 0.5]).slice(),
      tZoom: opts.zoom || 1,
      mouse: [0.5, 0.5], tMouse: [0.5, 0.5],
      twist: 0, tTwist: 0,
    };

    function resize() {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale));
      const h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
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
    let raf = 0, last = t0, slow = 0, fast = 0;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const dt = now - last; last = now;

      /* adaptive resolution: keep ~60 fps on any GPU, max out on strong ones */
      if (dt > 24) { slow++; fast = 0; } else if (dt < 14) { fast++; slow = 0; }
      if (slow > 20 && scale > 0.5) { scale = Math.max(0.5, scale * 0.85); slow = 0; resize(); }
      if (fast > 120 && scale < Math.min(global.devicePixelRatio || 1, maxDpr)) { scale = Math.min(maxDpr, scale * 1.1); fast = 0; resize(); }

      const k = 0.06;
      state.center[0] += (state.tCenter[0] - state.center[0]) * k;
      state.center[1] += (state.tCenter[1] - state.center[1]) * k;
      state.zoom += (state.tZoom - state.zoom) * k;
      state.mouse[0] += (state.tMouse[0] - state.mouse[0]) * 0.05;
      state.mouse[1] += (state.tMouse[1] - state.mouse[1]) * 0.05;
      state.twist += (state.tTwist - state.twist) * 0.08;

      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, reduced ? 0 : (now - t0) / 1000);
      gl.uniform2f(U.uMouse, state.mouse[0], state.mouse[1]);
      gl.uniform2f(U.uCenter, state.center[0], state.center[1]);
      gl.uniform1f(U.uZoom, state.zoom);
      gl.uniform1f(U.uTwist, state.twist);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    resize();
    raf = requestAnimationFrame(frame);

    return {
      setTarget(t) {
        if (t.center) { state.tCenter[0] = t.center[0]; state.tCenter[1] = t.center[1]; }
        if (typeof t.zoom === 'number') state.tZoom = t.zoom;
      },
      setScroll(px) { state.tTwist = px * 0.0009; },
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
