/* ═══════════════════════════════════════════════════════════════════════════
   AETERNA 3D SOVEREIGN STUDIO // LIQUID VORTEX GPU ENGINE v1.0
   Procedural, resolution-independent liquid gold / black-lacquer vortex.
   Rendered per-pixel on the GPU (WebGL) — no video, no texture upscaling:
   every frame is computed natively at the display's physical resolution
   (1080p / 4K / 8K), so detail never softens.

   Layers (back → front):
     1. Warm studio void + radial glow
     2. Back ribbon spiral (dimmed, parallax-slow)
     3. Far gold spheres (defocused)
     4. Front ribbon spiral (gold + black lacquer, satin streaks)
     5. Near gold spheres (bokeh-defocused)
     6. Gold dust spiralling with the vortex
     7. ACES tonemap, vignette, film grain

   API:
     const v = AeternaLiquidVortex.mount(canvas, { center:[0.64,0.5], zoom:1 });
     v.setTarget({ center:[0.5,0.5], zoom:1.15 });   // eased transition
     v.setScroll(px);                                 // scroll-driven twist
     v.destroy();
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
const vec3  GOLD = vec3(0.98, 0.66, 0.26);

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

/* Studio environment: large key softbox top-left, rim strip right, dim floor */
vec3 env(vec3 R){
  vec3 L1 = normalize(vec3(-0.45, 0.62, 0.64));
  vec3 L2 = normalize(vec3(0.75, -0.15, 0.55));
  vec3 L3 = normalize(vec3(0.10, 0.95, 0.30));
  float k1 = smoothstep(0.80, 0.97, dot(R, L1));
  float k2 = pow(max(dot(R, L2), 0.0), 14.0);
  float k3 = pow(max(dot(R, L3), 0.0), 40.0);
  float sky = 0.5 + 0.5*R.y;
  return vec3(1.0, 0.95, 0.86)*(k1*3.2 + k2*1.3 + k3*2.0) + vec3(0.07, 0.06, 0.05)*sky + 0.015;
}

/* Spiral ribbon field. x = height (0..1), y = gold mask, z = coverage */
vec3 ribbons(vec2 p, float t, float arms, float wind, float seed, float cover){
  float r  = length(p) + 1e-4;
  float a  = atan(p.y, p.x);
  float aw = a + wind*log(r) - t;
  vec2  q  = vec2(cos(aw), sin(aw))*(0.5 + r*0.8);
  float w  = fbm(q*1.1 + seed);
  float ph = aw*arms + w*2.2 - r*3.4;
  /* sawtooth phase → position across the ribbon, ribbon occupies 'c' of the cycle */
  float cyc = fract(ph/TAU);
  float idx = floor(ph/TAU);
  float rid = mod(idx, arms);
  float c   = cover*(0.75 + 0.5*w)*(0.45 + 0.8*hash(vec2(rid, seed)));
  float x   = clamp((cyc - (1.0 - c)*0.5)/c, 0.0, 1.0);
  /* twisting sheet: rounded tube whose crest drifts as the sheet rolls */
  float roll = 0.5 + 0.38*sin(r*5.0 + w*4.0 + seed);
  float h  = x < roll ? sin(x/roll*1.5707963) : cos((x - roll)/(1.0 - roll)*1.5707963);
  h = h*h*(3.0 - 2.0*h);
  h += 0.03*sin(x*TAU*(3.0 + 3.0*r) + w*3.0)*h;   /* satin streaks */
  h *= smoothstep(0.02, 0.22, r);              /* vortex eye    */
  float gold = mod(rid + floor(seed), 2.0);
  float edge = min(cyc - (1.0 - c)*0.5, (1.0 + c)*0.5 - cyc);
  float cov  = smoothstep(0.0, 0.018, edge)*smoothstep(0.02, 0.08, r);
  return vec3(h, gold, cov);
}

vec3 shadeRibbon(vec2 p, float t, float arms, float wind, float seed, float cover, float e, out float alpha){
  vec3 f0 = ribbons(p, t, arms, wind, seed, cover);
  alpha = f0.z;
  if (alpha <= 0.001) return vec3(0.0);
  float hx = ribbons(p + vec2(e, 0.0), t, arms, wind, seed, cover).x;
  float hy = ribbons(p + vec2(0.0, e), t, arms, wind, seed, cover).x;
  vec2 g = vec2(hx - f0.x, hy - f0.x)/e*0.045;
  float gl = length(g);
  if (gl > 2.6) g *= 2.6/gl;
  vec3 N = normalize(vec3(-g, 1.0));
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);
  float fr = pow(1.0 - clamp(N.z, 0.0, 1.0), 5.0);
  vec3 E = env(R);
  vec3 goldC  = (GOLD + (1.0 - GOLD)*fr)*E + GOLD*0.035;
  vec3 blackC = vec3(0.004) + E*(0.07 + 0.93*fr);
  vec3 col = mix(blackC, goldC, f0.y);
  col *= mix(0.22, 1.0, smoothstep(0.0, 0.55, f0.x));   /* groove occlusion */
  return col;
}

void sphereLayer(vec2 p, float t, bool front, inout vec3 col){
  for (int i = 0; i < 12; i++){
    float fi = float(i);
    float h1 = hash(vec2(fi, 1.3)), h2 = hash(vec2(fi, 7.1)), z = hash(vec2(fi, 3.7));
    if (front != (z > 0.55)) continue;
    float orbit = 0.28 + h1*1.05;
    float ang = h2*TAU + t*(0.55 - 0.25*h1);
    vec2  c = vec2(cos(ang), sin(ang)*0.82)*orbit
            + vec2(sin(t*1.3 + fi), cos(t*1.1 + fi*1.7))*0.025;
    float rad  = mix(0.014, 0.085, z*z)*(0.7 + 0.6*h2);
    float blur = 0.05 + 0.55*smoothstep(0.80, 1.0, z) + 0.35*smoothstep(0.25, 0.0, z);
    float d = length(p - c)/rad;
    float a = 1.0 - smoothstep(1.0 - blur, 1.0, d);
    if (a <= 0.0) continue;
    float dd = min(d, 0.999);
    vec3 n = vec3((p - c)/rad, sqrt(1.0 - dd*dd));
    n = normalize(n);
    vec3 R = reflect(vec3(0.0, 0.0, -1.0), n);
    float fr = pow(1.0 - n.z, 5.0);
    vec3 sc = (GOLD + (1.0 - GOLD)*fr)*env(R) + GOLD*0.04;
    sc *= mix(0.30, 1.0, z);
    col = mix(col, sc, a);
  }
}

float dust(vec2 p, float t){
  float r = length(p);
  vec2 q = rot(t*0.6 + 0.55/(r + 0.25))*p;
  float acc = 0.0;
  for (int k = 0; k < 2; k++){
    float sc = (k == 0) ? 48.0 : 105.0;
    vec2 g  = q*sc + float(k)*13.1;
    vec2 id = floor(g), f = fract(g) - 0.5;
    float rn = hash(id);
    if (rn > 0.93){
      vec2 o = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
      float d = length(f - o*0.7);
      float tw = 0.45 + 0.55*sin(t*9.0 + rn*40.0);
      acc += exp(-d*d*((k == 0) ? 70.0 : 140.0))*tw*((k == 0) ? 1.0 : 0.55);
    }
  }
  float band = smoothstep(0.12, 0.45, r)*smoothstep(1.6, 0.7, r);
  float lane = 0.35 + 0.65*smoothstep(0.2, 0.8, fbm(q*2.0 + 4.0));
  return acc*band*lane;
}

vec3 aces(vec3 x){ return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  vec2 m = (uMouse - 0.5);
  vec2 frag = gl_FragCoord.xy;
  vec2 p  = (frag - uRes*uCenter)/uRes.y*2.0/uZoom;
  float e = 1.6/uRes.y*2.0/uZoom;
  float t = uTime*0.16 + uTwist;

  float r0 = length(p);
  vec3 col = vec3(0.012, 0.011, 0.010) + GOLD*0.018*exp(-r0*1.4);

  /* back spiral — slower, dimmer, parallax */
  float aB;
  vec2 pB = rot(1.3)*(p*1.15 + m*0.03);
  vec3 cB = shadeRibbon(pB, t*0.7, 7.0, 1.7, 6.0, 0.55, e*1.15, aB);
  col = mix(col, cB*0.5, aB*0.92);

  vec2 pS = p + m*0.05;
  sphereLayer(pS, t, false, col);

  /* front spiral */
  float aF;
  vec2 pF = p + m*0.07;
  vec3 cF = shadeRibbon(pF, t, 6.0, 1.5, 1.0, 0.62, e, aF);
  /* contact shadow on what lies beneath the front ribbons */
  col *= 1.0 - 0.55*smoothstep(0.0, 1.0, aF);
  col = mix(col, cF, aF);

  sphereLayer(p + m*0.10, t, true, col);

  col += vec3(1.0, 0.82, 0.45)*dust(p + m*0.06, t)*1.6*(1.0 - 0.8*aF);

  vec2 sv = frag/uRes - 0.5;
  col *= 1.0 - 0.55*dot(sv, sv)*1.6;
  col = aces(col*1.15);
  col = pow(col, vec3(1.0/2.2));
  col += (hash(frag + fract(uTime)*91.7) - 0.5)*0.018;
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
