/* ==========================================================================
   APEX DIGITAL // 3D LIQUID SPATIAL ENGINE v3.5
   Organic 120-Frame Living Gold | Fluid Water Caustics & Interactive Ripples |
   Zero Rectangular Borders | Full-Bleed Screen Void Dissolve
   ========================================================================== */

(function initApexLiquidSpatialEngine() {
  'use strict';

  // ==========================================================================
  // 1. LENIS SMOOTH SCROLL ENGINE
  // ==========================================================================
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.3,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Smooth anchor scrolling
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          if (lenis) {
            lenis.scrollTo(targetEl, { offset: -60 });
          } else {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  });

  // Header scroll state
  const siteHeader = document.getElementById('siteHeader');
  function handleHeaderScroll() {
    if (!siteHeader) return;
    if (window.scrollY > 40) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  // ==========================================================================
  // 2. 120-FRAME LIVING GOLD SCULPTURE CANVAS ENGINE
  // ==========================================================================
  const canvas = document.getElementById('heroCanvas');
  const stage = document.getElementById('sculptureCard');
  const liquidGoldSpill = document.getElementById('liquidGoldSpill');
  const causticsCanvas = document.getElementById('liquidCausticsCanvas');
  const glCanvas = document.getElementById('heroGlCanvas');

  const TOTAL_FRAMES = 120;
  const FRAME_BASE = './frames_liquid_gold/frame_';
  const FALLBACK_BASES = ['./frames_desktop/frame_', './assets/frames/frame_'];
  const FRAME_EXT = '.webp';
  const DAMPING = 0.08;
  const AMBIENT_SPEED = 0.32; // ~20 fps cinematic rotational speed
  const IDLE_TIMEOUT_MS = 1400;

  const frameCache = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let targetFrame = 0;
  let currentFrame = 0;
  let isIdle = true;
  let lastActiveTime = performance.now();
  let isDragging = false;
  let dragStartX = 0;
  let dragStartFrame = 0;

  let ctx = null;
  if (canvas) {
    ctx = canvas.getContext('2d', { alpha: true });
  }

  function resizeCanvases() {
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (canvas) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
    }

    if (causticsCanvas) {
      causticsCanvas.width = Math.round(rect.width * 1.3);
      causticsCanvas.height = Math.round(rect.height * 1.3);
    }

    if (glCanvas) {
      glCanvas.width = Math.round(rect.width * 1.2);
      glCanvas.height = Math.round(rect.height * 1.2);
      if (gl) gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    }
  }

  // Preload all 120 WebP frames with multi-path resilience
  function preloadFrames() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const frameNum = String(i + 1).padStart(4, '0');
      const url = `${FRAME_BASE}${frameNum}${FRAME_EXT}`;
      const img = new Image();
      img.decoding = 'async';

      img.onload = () => {
        if (window.createImageBitmap) {
          createImageBitmap(img)
            .then((bitmap) => {
              frameCache[i] = bitmap;
              onFrameLoaded();
            })
            .catch(() => {
              frameCache[i] = img;
              onFrameLoaded();
            });
        } else {
          frameCache[i] = img;
          onFrameLoaded();
        }
      };

      img.onerror = () => {
        // Try fallback bases
        const fbUrl = `${FALLBACK_BASES[0]}${frameNum}${FRAME_EXT}`;
        const fbImg = new Image();
        fbImg.onload = () => {
          frameCache[i] = fbImg;
          onFrameLoaded();
        };
        fbImg.onerror = () => {
          frameCache[i] = frameCache[0] || null;
        };
        fbImg.src = fbUrl;
      };

      img.src = url;
    }
  }

  function onFrameLoaded() {
    loadedCount++;
    if (loadedCount === 1) {
      drawSculptureFrame(0);
    }
  }

  // Double-Buffered High-DPI Sculpture Painter with Pixel-Exact Liquid Alpha Feathering
  function drawSculptureFrame(frameIdx) {
    if (!ctx || !canvas) return;
    const clampedIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIdx)));
    const asset = frameCache[clampedIdx] || frameCache[0];
    if (!asset) return;

    const cW = canvas.width;
    const cH = canvas.height;
    ctx.clearRect(0, 0, cW, cH);

    const aW = asset.width || asset.naturalWidth || 720;
    const aH = asset.height || asset.naturalHeight || 1280;

    // Scale to fill organically and boldly across the stage
    const scale = Math.min(cW / aW, cH / aH) * 1.12;
    const drawW = aW * scale;
    const drawH = aH * scale;
    const drawX = (cW - drawW) * 0.5;
    const drawY = (cH - drawH) * 0.5;

    // 1. Draw raw video frame (1:1 photoreal gold fidelity)
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(asset, drawX, drawY, drawW, drawH);

    // 2. Erase ALL square/rectangular frame boundaries inside GPU pixel buffer
    // Guarantees 100% seamless bleed into background with zero square seams
    ctx.globalCompositeOperation = 'destination-in';
    const rx = drawW * 0.48;
    const ry = drawH * 0.48;
    const maxR = Math.max(rx, ry);
    const radGrad = ctx.createRadialGradient(
      cW * 0.5, cH * 0.5, maxR * 0.20,
      cW * 0.5, cH * 0.5, maxR * 0.95
    );
    radGrad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
    radGrad.addColorStop(0.70, 'rgba(0, 0, 0, 0.96)');
    radGrad.addColorStop(0.88, 'rgba(0, 0, 0, 0.45)');
    radGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, cW, cH);

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }

  // ==========================================================================
  // 3. FLUID WATER CAUSTICS & INTERACTIVE RIPPLE SIMULATION
  // ==========================================================================
  const cCtx = causticsCanvas ? causticsCanvas.getContext('2d') : null;
  const ripples = [];

  function addWaterRipple(x, y, maxRadius, intensity) {
    ripples.push({
      x: x,
      y: y,
      radius: 4,
      maxRadius: maxRadius || 120,
      alpha: intensity || 0.6,
      speed: 1.8 + Math.random() * 1.2,
      aspect: 0.65, // Perspective elliptical compression
    });
    if (ripples.length > 24) ripples.shift();
  }

  function renderWaterCaustics(timeSec) {
    if (!cCtx || !causticsCanvas) return;
    const w = causticsCanvas.width;
    const h = causticsCanvas.height;
    cCtx.clearRect(0, 0, w, h);

    // Subtle sinusoidal ambient water caustics rays
    const cx = w * 0.5;
    const cy = h * 0.5;
    const rayCount = 12;

    cCtx.save();
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + timeSec * 0.2;
      const r = (Math.sin(timeSec * 1.5 + i * 2.0) * 0.15 + 0.85) * (w * 0.35);
      const rx = cx + Math.cos(angle) * r;
      const ry = cy + Math.sin(angle) * r * 0.6;

      const grad = cCtx.createRadialGradient(rx, ry, 2, rx, ry, 70);
      grad.addColorStop(0, 'rgba(212, 175, 55, 0.18)');
      grad.addColorStop(0.5, 'rgba(224, 36, 195, 0.08)');
      grad.addColorStop(1, 'transparent');

      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.ellipse(rx, ry, 70, 40, angle, 0, Math.PI * 2);
      cCtx.fill();
    }

    // Render active ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rip = ripples[i];
      cCtx.beginPath();
      cCtx.ellipse(rip.x, rip.y, rip.radius, rip.radius * rip.aspect, 0, 0, Math.PI * 2);
      cCtx.strokeStyle = `rgba(212, 175, 55, ${rip.alpha * 0.45})`;
      cCtx.lineWidth = 1.6;
      cCtx.stroke();

      // Outer chromatic ring
      cCtx.beginPath();
      cCtx.ellipse(rip.x, rip.y, rip.radius * 0.95, rip.radius * 0.95 * rip.aspect, 0, 0, Math.PI * 2);
      cCtx.strokeStyle = `rgba(0, 229, 255, ${rip.alpha * 0.25})`;
      cCtx.lineWidth = 1.0;
      cCtx.stroke();

      rip.radius += rip.speed;
      rip.alpha -= 0.009;

      if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
        ripples.splice(i, 1);
      }
    }
    cCtx.restore();
  }

  // ==========================================================================
  // 4. WEBGL LIQUID REFRACTION & CHROMATIC BLOOM SHADER
  // ==========================================================================
  let gl = null;
  let shaderProgram = null;
  let uResolutionLoc, uMouseLoc, uTimeLoc, uRippleLoc;
  let mouseNormX = 0.5, mouseNormY = 0.5;

  if (glCanvas) {
    try {
      gl = glCanvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false }) ||
           glCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    } catch (e) {
      gl = null;
    }

    if (gl) {
      const vsSource = `
        attribute vec2 a_pos;
        varying vec2 v_uv;
        void main() {
          v_uv = (a_pos + 1.0) * 0.5;
          gl_Position = vec4(a_pos, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;
        varying vec2 v_uv;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_time;
        uniform vec4 u_ripple; // x, y, age, intensity

        void main() {
          vec2 uv = v_uv;
          vec2 m = u_mouse;

          // Water ripple deformation
          float d = distance(uv, m);
          float wave = sin(d * 32.0 - u_time * 4.5) * exp(-d * 3.5);
          
          // Organic Liquid Gold caustics
          vec2 dispUv = uv + vec2(wave * 0.025);
          float caustic = sin(dispUv.x * 14.0 + sin(u_time + dispUv.y * 10.0)) * 
                          cos(dispUv.y * 14.0 + cos(u_time + dispUv.x * 10.0));
          caustic = smoothstep(0.4, 0.95, caustic) * 0.35;

          // Radial light dissipation
          float centerDist = distance(uv, vec2(0.5, 0.5));
          float radialFeather = smoothstep(0.5, 0.15, centerDist);

          // Liquid gold & cyan photon dispersion
          vec3 gold = vec3(0.85, 0.70, 0.25) * caustic;
          vec3 cyan = vec3(0.0, 0.85, 1.0) * wave * 0.2;
          vec3 magenta = vec3(0.88, 0.14, 0.76) * smoothstep(0.35, 0.0, d) * 0.18;

          vec3 color = (gold + cyan + magenta) * radialFeather;
          float alpha = clamp((caustic + abs(wave) * 0.3) * radialFeather * 0.65, 0.0, 0.5);

          gl_FragColor = vec4(color, alpha);
        }
      `;

      function compileShader(ctx, type, src) {
        const s = ctx.createShader(type);
        ctx.shaderSource(s, src);
        ctx.compileShader(s);
        return ctx.getShaderParameter(s, ctx.COMPILE_STATUS) ? s : null;
      }

      const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

      if (vs && fs) {
        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vs);
        gl.attachShader(shaderProgram, fs);
        gl.linkProgram(shaderProgram);

        if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
          gl.useProgram(shaderProgram);
          const buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

          const aPos = gl.getAttribLocation(shaderProgram, 'a_pos');
          gl.enableVertexAttribArray(aPos);
          gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

          uResolutionLoc = gl.getUniformLocation(shaderProgram, 'u_resolution');
          uMouseLoc = gl.getUniformLocation(shaderProgram, 'u_mouse');
          uTimeLoc = gl.getUniformLocation(shaderProgram, 'u_time');
          uRippleLoc = gl.getUniformLocation(shaderProgram, 'u_ripple');
        }
      }
    }
  }

  function renderGlWater(timeSec) {
    if (!gl || !shaderProgram) return;
    gl.useProgram(shaderProgram);
    gl.uniform2f(uResolutionLoc, glCanvas.width, glCanvas.height);
    gl.uniform2f(uMouseLoc, mouseNormX, mouseNormY);
    gl.uniform1f(uTimeLoc, timeSec);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // ==========================================================================
  // 5. INTERACTION & ORGANIC WATER RIPPLE EVENTS
  // ==========================================================================
  function onUserInteract() {
    lastActiveTime = performance.now();
    isIdle = false;
  }

  if (stage) {
    stage.addEventListener('mousemove', (e) => {
      onUserInteract();
      const rect = stage.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const normX = Math.max(0, Math.min(1, relX / rect.width));

      mouseNormX = normX;
      mouseNormY = 1.0 - (relY / rect.height);

      if (isDragging) {
        const deltaX = e.clientX - dragStartX;
        const frameOffset = (deltaX / rect.width) * TOTAL_FRAMES * 1.5;
        targetFrame = (dragStartFrame + frameOffset + TOTAL_FRAMES * 10) % TOTAL_FRAMES;
      } else {
        targetFrame = normX * (TOTAL_FRAMES - 1);
      }

      // Add water ripple on motion
      if (Math.random() < 0.28) {
        addWaterRipple(relX * 1.3, relY * 1.3, Math.random() * 80 + 60, 0.55);
      }

      // Spill liquid gold aura towards cursor
      if (liquidGoldSpill) {
        const driftX = (normX - 0.5) * 50;
        const driftY = ((relY / rect.height) - 0.5) * 40;
        liquidGoldSpill.style.transform = `translate3d(${driftX.toFixed(1)}px, ${driftY.toFixed(1)}px, 0) scale(1.08)`;
      }
    });

    stage.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartFrame = targetFrame;
      onUserInteract();

      const rect = stage.getBoundingClientRect();
      addWaterRipple((e.clientX - rect.left) * 1.3, (e.clientY - rect.top) * 1.3, 140, 0.85);
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        isDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartFrame = targetFrame;
        onUserInteract();
        const rect = stage.getBoundingClientRect();
        addWaterRipple((e.touches[0].clientX - rect.left) * 1.3, (e.touches[0].clientY - rect.top) * 1.3, 120, 0.8);
      }
    }, { passive: true });

    stage.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length > 0) {
        onUserInteract();
        const rect = stage.getBoundingClientRect();
        const deltaX = e.touches[0].clientX - dragStartX;
        const frameOffset = (deltaX / rect.width) * TOTAL_FRAMES * 1.5;
        targetFrame = (dragStartFrame + frameOffset + TOTAL_FRAMES * 10) % TOTAL_FRAMES;
        if (Math.random() < 0.3) {
          addWaterRipple((e.touches[0].clientX - rect.left) * 1.3, (e.touches[0].clientY - rect.top) * 1.3, 70, 0.5);
        }
      }
    }, { passive: true });

    stage.addEventListener('touchend', () => { isDragging = false; });
  }

  // Scroll Scrubbing
  window.addEventListener('scroll', () => {
    if (window.scrollY < window.innerHeight * 1.5) {
      onUserInteract();
      const heroHeight = window.innerHeight;
      const scrollPct = Math.min(1, Math.max(0, window.scrollY / heroHeight));
      targetFrame = (targetFrame + scrollPct * 1.1) % TOTAL_FRAMES;
    }
  }, { passive: true });

  // 3D Parallax Tilt
  let targetTiltX = 0, targetTiltY = 0;
  let curTiltX = 0, curTiltY = 0;

  window.addEventListener('mousemove', (e) => {
    const wMid = window.innerWidth * 0.5;
    const hMid = window.innerHeight * 0.5;
    const nX = (e.clientX - wMid) / wMid;
    const nY = (e.clientY - hMid) / hMid;
    targetTiltX = -nY * 8;
    targetTiltY = nX * 12;
  });

  // ==========================================================================
  // 6. MAIN FLUID RAF LOOP
  // ==========================================================================
  function fluidLoop(now) {
    const timeSec = now * 0.001;

    // Ambient rotation when idle
    if (now - lastActiveTime > IDLE_TIMEOUT_MS) {
      isIdle = true;
      targetFrame = (targetFrame + AMBIENT_SPEED) % TOTAL_FRAMES;
      // Ambient water ripple pulse
      if (Math.random() < 0.015 && causticsCanvas) {
        addWaterRipple(causticsCanvas.width * 0.5, causticsCanvas.height * 0.55, 100, 0.3);
      }
    }

    // Shortest angular lerp wrapping
    let diff = targetFrame - currentFrame;
    while (diff < -TOTAL_FRAMES * 0.5) diff += TOTAL_FRAMES;
    while (diff > TOTAL_FRAMES * 0.5) diff -= TOTAL_FRAMES;
    currentFrame = (currentFrame + diff * DAMPING + TOTAL_FRAMES) % TOTAL_FRAMES;

    // Draw living sculpture frame
    drawSculptureFrame(currentFrame);

    // Draw fluid caustics & ripples
    renderWaterCaustics(timeSec);

    // Draw WebGL liquid refraction
    renderGlWater(timeSec);

    // Gentle organic tilt
    if (stage) {
      curTiltX += (targetTiltX - curTiltX) * 0.05;
      curTiltY += (targetTiltY - curTiltY) * 0.05;
      stage.style.transform = `perspective(1400px) rotateX(${curTiltX.toFixed(2)}deg) rotateY(${curTiltY.toFixed(2)}deg)`;
    }

    requestAnimationFrame(fluidLoop);
  }

  // Legacy frame-scrubber stage is superseded by the full-screen GPU vortex
  // (body.vortex-mode). Only boot it when the vortex engine is not active.
  if (!document.body.classList.contains('vortex-mode')) {
    window.addEventListener('resize', resizeCanvases);
    resizeCanvases();
    preloadFrames();
    requestAnimationFrame(fluidLoop);
  }

  // ==========================================================================
  // 6b. AETERNA LIQUID VORTEX — FULL-SCREEN GPU BACKGROUND
  // ==========================================================================
  (function initVortexBackground() {
    const vCanvas = document.getElementById('aeternaVortexBg');
    if (!vCanvas || typeof AeternaLiquidVortex === 'undefined') return;
    let vortex = null;
    try {
      vortex = AeternaLiquidVortex.mount(vCanvas, { center: [0.66, 0.5], zoom: 1.0, maxDpr: 2 });
    } catch (err) {
      console.error(err);
    }
    if (!vortex) { document.body.classList.add('vortex-fallback'); return; }

    const isMobile = () => window.innerWidth < 900;
    const heroPose = () => (isMobile() ? { center: [0.5, 0.66], zoom: 0.85 } : { center: [0.66, 0.5], zoom: 1.0 });
    const ctaPose = () => (isMobile() ? { center: [0.5, 0.55], zoom: 0.9 } : { center: [0.5, 0.5], zoom: 1.12 });
    const midPose = () => (isMobile() ? { center: [0.5, 0.5], zoom: 0.8 } : { center: [0.78, 0.5], zoom: 0.9 });

    const hero = document.getElementById('hero');
    const cta = document.getElementById('insights');

    function updatePose() {
      const vh = window.innerHeight;
      vortex.setScroll(window.scrollY);
      const ctaRect = cta ? cta.getBoundingClientRect() : null;
      const heroRect = hero ? hero.getBoundingClientRect() : null;
      if (ctaRect && ctaRect.top < vh * 0.6 && ctaRect.bottom > vh * 0.3) vortex.setTarget(ctaPose());
      else if (heroRect && heroRect.bottom > vh * 0.45) vortex.setTarget(heroPose());
      else vortex.setTarget(midPose());
    }
    window.addEventListener('scroll', updatePose, { passive: true });
    window.addEventListener('resize', updatePose);
    updatePose();
  })();

  // ==========================================================================
  // 7. HOVER-SCRUBBING VIDEO CARDS (SELECTED WORKS)
  // ==========================================================================
  function initHoverScrubVideos() {
    const videoBoxes = document.querySelectorAll('.card-video-box');

    videoBoxes.forEach((box) => {
      const video = box.querySelector('.portfolio-video');
      const scrubFill = box.querySelector('.card-scrub-fill');
      const backlight = box.querySelector('.card-backlight');
      let isHovered = false;

      if (!video) return;
      video.muted = true;
      video.playsInline = true;

      video.addEventListener('timeupdate', () => {
        if (!isHovered && video.duration) {
          const pct = (video.currentTime / video.duration) * 100;
          if (scrubFill) scrubFill.style.width = `${pct}%`;
        }
      });

      box.addEventListener('mousemove', (e) => {
        isHovered = true;
        const rect = box.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        if (video.duration) {
          video.currentTime = pct * video.duration;
          if (scrubFill) scrubFill.style.width = `${pct * 100}%`;
        }

        if (backlight) {
          const shiftX = (pct - 0.5) * 24;
          backlight.style.transform = `translateX(${shiftX.toFixed(1)}px) scale(1.08)`;
          backlight.style.opacity = '0.9';
        }
      });

      box.addEventListener('mouseenter', () => {
        isHovered = true;
        const p = video.play();
        if (p !== undefined) p.catch(() => { video.muted = true; video.play(); });
        if (backlight) backlight.style.opacity = '0.85';
      });

      box.addEventListener('mouseleave', () => {
        isHovered = false;
        video.pause();
        if (backlight) {
          backlight.style.transform = 'translateX(0) scale(1)';
          backlight.style.opacity = '0.35';
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHoverScrubVideos);
  } else {
    initHoverScrubVideos();
  }

  // ==========================================================================
  // 8. EXECUTIVE BRIEF MODAL (NDA & CORPORATE DISPATCH)
  // ==========================================================================
  const modalOverlay = document.getElementById('inquireModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalTriggers = document.querySelectorAll('.trigger-inquire-modal');
  const inquiryForm = document.getElementById('inquiryForm');

  function openModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }

  modalTriggers.forEach((btn) => btn.addEventListener('click', openModal));
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });

  // Pill selectors
  document.querySelectorAll('.pills-grid .pill').forEach((pill) => {
    pill.addEventListener('click', function () {
      const parent = this.parentElement;
      parent.querySelectorAll('.pill').forEach((p) => p.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  // Form Submission
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('clientName')?.value.trim() || 'Principal';
      const company = document.getElementById('clientCompany')?.value.trim() || 'Undisclosed';
      const email = document.getElementById('clientEmail')?.value.trim() || '';
      const timeline = document.getElementById('clientTimeline')?.value || 'Standard';
      const brief = document.getElementById('clientBrief')?.value.trim() || 'Spatial 3D Inquiry';
      const ndaChecked = document.getElementById('ndaCheck')?.checked ? 'YES' : 'NO';

      const selectedService = document.querySelector('.pill-service.selected')?.textContent.trim() || 'Interactive 3D Spatial World';
      const selectedBudget = document.querySelector('.pill-budget.selected')?.textContent.trim() || '&euro;15,000+';

      const subject = encodeURIComponent(`Executive Project Brief: ${company} // ${name}`);
      const body = encodeURIComponent(
        `CLIENT DISPATCH:\n` +
        `----------------------------------------\n` +
        `Principal: ${name}\n` +
        `Company: ${company}\n` +
        `Corporate Email: ${email}\n` +
        `Mutual NDA Required: ${ndaChecked}\n\n` +
        `PROJECT SPECIFICATIONS:\n` +
        `----------------------------------------\n` +
        `Scope: ${selectedService}\n` +
        `Investment Tier: ${selectedBudget}\n` +
        `Target Timeline: ${timeline}\n\n` +
        `COMMERCIAL OBJECTIVES & BRIEF:\n` +
        `----------------------------------------\n` +
        `${brief}\n\n` +
        `Dispatched via APEX DIGITAL Sovereign Spatial Terminal.`
      );

      window.location.href = `mailto:inquire@apexdigital.com?subject=${subject}&body=${body}`;
      alert(`Thank you, ${name}. Your executive brief has been dispatched. An NDA confirmation will be issued to ${email} within 24 hours.`);
      closeModal();
      inquiryForm.reset();
    });
  }

})();
