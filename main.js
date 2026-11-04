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

    const isMobile = window.innerWidth < 900;
    // Rock-solid fixed center: centered on the right on desktop, centered on mobile
    const fixedCenter = isMobile ? [0.5, 0.5] : [0.72, 0.5];
    const fixedZoom = isMobile ? 0.95 : 1.15;

    try {
      vortex = AeternaLiquidVortex.mount(vCanvas, {
        center: fixedCenter,
        zoom: fixedZoom,
        maxDpr: 1.25,
      });
    } catch (err) {
      console.error(err);
    }
    if (!vortex) { document.body.classList.add('vortex-fallback'); return; }

    // STABLE: Do NOT shift, twist or move the vortex on scroll!
    // It rotates smoothly and majestically in place with zero user-induced jitter.
    window.addEventListener('resize', () => {
      const mobile = window.innerWidth < 900;
      vortex.setTarget({
        center: mobile ? [0.5, 0.5] : [0.72, 0.5],
        zoom: mobile ? 0.95 : 1.15,
      });
    });
  })();

  // ==========================================================================
  // 7. CONTINUOUS AUTOPLAY VIDEO CARDS (SELECTED WORKS)
  // ==========================================================================
  function initAutoPlayPortfolioVideos() {
    const videos = document.querySelectorAll('.portfolio-video');
    videos.forEach((video) => {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.setAttribute('loop', '');
      video.setAttribute('autoplay', '');

      const startPlay = () => {
        video.muted = true;
        const p = video.play();
        if (p !== undefined) p.catch(() => {});
      };

      startPlay();

      // Completely autonomous continuous playback: resume immediately if paused
      video.addEventListener('pause', () => {
        if (!document.hidden) startPlay();
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        videos.forEach((v) => {
          v.muted = true;
          v.play().catch(() => {});
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoPlayPortfolioVideos);
  } else {
    initAutoPlayPortfolioVideos();
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
    if (e.key === 'Escape') {
      if (modalOverlay && modalOverlay.classList.contains('active')) closeModal();
      closeAllProposalModals();
    }
  });

  // ==========================================================================
  // 8b. PROPOSAL MODALS (TIER 01 - 04 & BESPOKE INVOICE)
  // ==========================================================================
  const proposalModals = {
    tier1: document.getElementById('modalProposalTier1'),
    tier2: document.getElementById('modalProposalTier2'),
    tier3: document.getElementById('modalProposalTier3'),
    tier4: document.getElementById('modalProposalTier4'),
    invoice: document.getElementById('modalBespokeInvoice'),
  };

  function openProposalModal(tierKey) {
    const targetModal = proposalModals[tierKey];
    if (!targetModal) return;
    targetModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }

  function closeAllProposalModals() {
    Object.values(proposalModals).forEach((m) => {
      if (m) m.classList.remove('active');
    });
    if (!modalOverlay || !modalOverlay.classList.contains('active')) {
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    }
  }

  document.querySelectorAll('.trigger-proposal-modal').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tier = btn.getAttribute('data-tier');
      if (tier) openProposalModal(tier);
    });
  });

  document.querySelectorAll('.proposal-modal .modal-close-btn, .modal-close-btn-inline').forEach((btn) => {
    btn.addEventListener('click', closeAllProposalModals);
  });

  document.querySelectorAll('.proposal-modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllProposalModals();
    });
  });

  // ==========================================================================
  // 8c. INTERACTIVE SCOPE CONFIGURATOR & DUAL GATEWAY INVOICE GENERATOR
  // ==========================================================================
  const STRIPE_LINKS = {
    tier1: {
      full: 'https://buy.stripe.com/9B6cMZga86Qa9IE8gDfAc00',
      deposit: 'https://buy.stripe.com/dRm5kx7DCcau5soeF1fAc06'
    },
    tier2: {
      full: 'https://buy.stripe.com/9B614hcXW4I25sodAXfAc01',
      deposit: 'https://buy.stripe.com/8x27sF1fegqKg72eF1fAc07'
    },
    tier3: {
      full: 'https://buy.stripe.com/9B6cMZ5vub6q0840ObfAc02',
      deposit: 'https://buy.stripe.com/fZu3cp7DC0rMdYU0ObfAc08'
    },
    tier4: {
      full: 'https://buy.stripe.com/aFa5kx8HG1vQ7AwbsPfAc03',
      deposit: 'https://buy.stripe.com/4gMaERga80rMcUQ0ObfAc09'
    }
  };

  const tierPills = document.querySelectorAll('.cfg-tier-pill');
  const addonChecks = document.querySelectorAll('.cfg-addon-check');
  const maintRadios = document.querySelectorAll('input[name="maintPlan"]');
  const settleRadios = document.querySelectorAll('input[name="paymentSchedule"]');
  const cfgBreakdownText = document.getElementById('cfgBreakdownText');
  const cfgTotalDisplay = document.getElementById('cfgTotalDisplay');
  const cfgPeriodDisplay = document.getElementById('cfgPeriodDisplay');
  const btnTriggerCustomInvoice = document.getElementById('btnTriggerCustomInvoice');

  let currentTier = {
    id: 'tier1',
    title: 'Express Business Presence',
    price: 1500,
  };

  const addonCard3dViewer = document.getElementById('addonCard3dViewer');
  const addonCheck3dViewer = document.getElementById('addonCheck3dViewer');
  const addonTag3dViewer = document.getElementById('addonTag3dViewer');

  function sync3dAddonAvailability() {
    const is3dIncludedInTier = (currentTier.id === 'tier3' || currentTier.id === 'tier4');
    if (addonCheck3dViewer && addonCard3dViewer && addonTag3dViewer) {
      if (is3dIncludedInTier) {
        addonCheck3dViewer.checked = false;
        addonCheck3dViewer.disabled = true;
        addonCard3dViewer.classList.remove('selected');
        addonCard3dViewer.classList.add('included-in-tier');
        addonTag3dViewer.textContent = '✓ INCLUDED IN TIER ($0)';
        addonTag3dViewer.style.color = '#38e370';
      } else {
        addonCheck3dViewer.disabled = false;
        addonCard3dViewer.classList.remove('included-in-tier');
        addonTag3dViewer.textContent = '+$800';
        addonTag3dViewer.style.color = '';
      }
    }
  }

  function recalculateConfigurator() {
    sync3dAddonAvailability();

    let totalScope = currentTier.price;
    let checkedAddons = [];

    addonChecks.forEach((chk) => {
      const card = chk.closest('.addon-card');
      if (chk.checked && !chk.disabled) {
        if (card) card.classList.add('selected');
        const price = parseInt(chk.getAttribute('data-price'), 10) || 0;
        const name = chk.getAttribute('data-name') || '';
        totalScope += price;
        checkedAddons.push({ name, price });
      } else {
        if (card && !card.classList.contains('included-in-tier')) {
          card.classList.remove('selected');
        }
      }
    });

    const isDeposit = document.querySelector('input[name="paymentSchedule"]:checked')?.value === 'deposit';
    let payableNow = totalScope;
    let balanceDue = 0;

    if (isDeposit) {
      payableNow = Math.round(totalScope * 0.5);
      balanceDue = totalScope - payableNow;
    } else {
      // 5% Cash Prepayment Discount on full settlement
      const discount = Math.round(totalScope * 0.05);
      payableNow = totalScope - discount;
      balanceDue = 0;
    }

    if (cfgTotalDisplay) {
      cfgTotalDisplay.textContent = payableNow.toLocaleString('en-US');
    }

    if (cfgPeriodDisplay) {
      cfgPeriodDisplay.textContent = isDeposit
        ? 'USD • 50% Production Deposit Due Now (50% on Handover)'
        : 'USD • 100% Full Turnkey Settlement (-5% Prepayment Discount)';
    }

    if (cfgBreakdownText) {
      const addonCount = checkedAddons.length;
      const addonSum = checkedAddons.reduce((acc, a) => acc + a.price, 0);
      cfgBreakdownText.textContent = `${currentTier.title} ($${currentTier.price.toLocaleString('en-US')}) + ${addonCount} Extras (+$${addonSum.toLocaleString('en-US')}) • Total Scope: $${totalScope.toLocaleString('en-US')}`;
    }

    return { totalScope, payableNow, balanceDue, isDeposit, checkedAddons };
  }

  // Tier pill click handlers
  tierPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      tierPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentTier.id = pill.getAttribute('data-tier-id') || 'tier1';
      currentTier.title = pill.getAttribute('data-tier-title') || 'Express Business Presence';
      currentTier.price = parseInt(pill.getAttribute('data-base-price'), 10) || 1500;
      recalculateConfigurator();
    });
  });

  // Addon checkbox change handlers
  addonChecks.forEach((chk) => {
    chk.addEventListener('change', recalculateConfigurator);
  });

  // Maintenance radio change handlers
  maintRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.maint-option-label').forEach((lbl) => lbl.classList.remove('selected'));
      const parentLabel = radio.closest('.maint-option-label');
      if (parentLabel) parentLabel.classList.add('selected');
    });
  });

  // Settlement radio change handlers
  settleRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.settle-option-card').forEach((lbl) => lbl.classList.remove('selected'));
      const parentCard = radio.closest('.settle-option-card');
      if (parentCard) parentCard.classList.add('selected');
      recalculateConfigurator();
    });
  });

  // Initial calculation on page load
  recalculateConfigurator();

  // Generate & Render Brutally Beautiful Invoice
  if (btnTriggerCustomInvoice) {
    btnTriggerCustomInvoice.addEventListener('click', () => {
      const { totalScope, payableNow, balanceDue, isDeposit, checkedAddons } = recalculateConfigurator();

      // Dynamic Invoice Details
      const invRand = Math.floor(1000 + Math.random() * 9000);
      const invNum = `INV-2026-${invRand}`;
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

      // Client input values
      const clientCompany = document.getElementById('cfgClientCompany')?.value.trim();
      const clientVat = document.getElementById('cfgClientVat')?.value.trim();
      const clientAddress = document.getElementById('cfgClientAddress')?.value.trim();
      const clientContact = document.getElementById('cfgClientContact')?.value.trim();

      // Elements inside invoice modal
      const invRenderNumber = document.getElementById('invRenderNumber');
      const invRenderDate = document.getElementById('invRenderDate');
      const invItemsTableBody = document.getElementById('invItemsTableBody');
      const invRenderTotalScope = document.getElementById('invRenderTotalScope');
      const invRenderScheduleLabel = document.getElementById('invRenderScheduleLabel');
      const invRenderScheduleAmount = document.getElementById('invRenderScheduleAmount');
      const invRowBalanceDue = document.getElementById('invRowBalanceDue');
      const invRenderBalanceDue = document.getElementById('invRenderBalanceDue');
      const invRenderGrandLabel = document.getElementById('invRenderGrandLabel');
      const invRenderGrandTotal = document.getElementById('invRenderGrandTotal');
      const invRenderMaintPlan = document.getElementById('invRenderMaintPlan');
      const invDynamicStripeLink = document.getElementById('invDynamicStripeLink');
      const invDynamicPayPalLink = document.getElementById('invDynamicPayPalLink');
      const invStripeBtnAmount = document.getElementById('invStripeBtnAmount');
      const invPayBtnAmount = document.getElementById('invPayBtnAmount');

      // Populate Client Details in Invoice
      const invClientRenderCompany = document.getElementById('invClientRenderCompany');
      const invClientRenderTax = document.getElementById('invClientRenderTax');
      const invClientRenderAddress = document.getElementById('invClientRenderAddress');
      const invClientRenderContact = document.getElementById('invClientRenderContact');

      if (invClientRenderCompany) invClientRenderCompany.textContent = clientCompany || 'Private Client / Visionary Enterprise';
      if (invClientRenderTax) invClientRenderTax.innerHTML = clientVat ? `Corporate Tax / VAT ID: <strong>${clientVat}</strong>` : 'VAT / Tax ID: B2B Cross-Border / Reverse Charge';
      if (invClientRenderAddress) invClientRenderAddress.textContent = clientAddress || 'International Client Corporate Jurisdiction';
      if (invClientRenderContact) invClientRenderContact.textContent = clientContact ? `Attn: ${clientContact} • Turnkey Digital Commission` : 'Attn: Corporate Procurement • Turnkey Digital Commission';

      if (invRenderNumber) invRenderNumber.textContent = invNum;
      if (invRenderDate) invRenderDate.textContent = `Date: ${dateStr}`;

      // Populate line items table
      if (invItemsTableBody) {
        invItemsTableBody.innerHTML = '';

        // Row 1: Base Tier
        const trBase = document.createElement('tr');
        trBase.innerHTML = `
          <td>
            <strong class="inv-item-name">${currentTier.title}</strong>
            <span class="inv-item-desc">Core architectural layout, mobile responsive UI/UX, sub-second latency, contact endpoints & Google indexing.</span>
          </td>
          <td><span style="font-family: var(--font-mono); font-size: 11px; color: var(--gold-light);">BASE ARCHITECTURE</span></td>
          <td style="text-align: right;">$${currentTier.price.toLocaleString('en-US')}.00</td>
        `;
        invItemsTableBody.appendChild(trBase);

        // Checked Add-on rows
        checkedAddons.forEach((addon) => {
          const trAddon = document.createElement('tr');
          trAddon.innerHTML = `
            <td>
              <strong class="inv-item-name">${addon.name}</strong>
              <span class="inv-item-desc">Bespoke technical add-on & service module integrated into client platform.</span>
            </td>
            <td><span style="font-family: var(--font-mono); font-size: 11px; color: #70baff;">ADD-ON MODULE</span></td>
            <td style="text-align: right;">+$${addon.price.toLocaleString('en-US')}.00</td>
          `;
          invItemsTableBody.appendChild(trAddon);
        });
      }

      // Calculations in totals table with Dynamic VAT Logic
      if (invRenderTotalScope) invRenderTotalScope.textContent = `$${totalScope.toLocaleString('en-US')}.00`;
      
      const cleanVat = (clientVat || '').toUpperCase().trim();
      const cleanAddr = (clientAddress || '').toUpperCase();
      const isBulgarianTax = cleanVat.startsWith('BG') || /^\d{9,10}$/.test(cleanVat) || cleanAddr.includes('BULGARIA') || cleanAddr.includes('БЪЛГАРИЯ');

      let vatRate = 0.0;
      let vatAmount = 0;
      let grossScope = totalScope;

      const invRenderVatLabel = document.getElementById('invRenderVatLabel');
      const invRenderVatAmount = document.getElementById('invRenderVatAmount');

      if (isBulgarianTax) {
        vatRate = 0.20;
        vatAmount = Math.round(totalScope * 0.20);
        grossScope = totalScope + vatAmount;
        if (invRenderVatLabel) invRenderVatLabel.textContent = 'VAT (20% Bulgarian Commercial Tax - чл. 86 ЗДДС):';
        if (invRenderVatAmount) invRenderVatAmount.textContent = `+$${vatAmount.toLocaleString('en-US')}.00 (20%)`;
      } else {
        vatRate = 0.0;
        vatAmount = 0;
        grossScope = totalScope;
        if (invRenderVatLabel) invRenderVatLabel.textContent = 'Tax / VAT (B2B Cross-Border Reverse Charge - Art. 196 EU VAT Directive):';
        if (invRenderVatAmount) invRenderVatAmount.textContent = '$0.00 (0%)';
      }

      let finalPayable = grossScope;
      let finalBalanceDue = 0;

      if (isDeposit) {
        finalPayable = Math.round(grossScope * 0.5);
        finalBalanceDue = grossScope - finalPayable;
        if (invRenderScheduleLabel) invRenderScheduleLabel.textContent = 'Settlement Schedule (50% Upfront Production Deposit):';
        if (invRenderScheduleAmount) invRenderScheduleAmount.textContent = `$${finalPayable.toLocaleString('en-US')}.00`;
        if (invRowBalanceDue) invRowBalanceDue.style.display = 'flex';
        if (invRenderBalanceDue) invRenderBalanceDue.textContent = `$${finalBalanceDue.toLocaleString('en-US')}.00 (Due upon final delivery)`;
        if (invRenderGrandLabel) invRenderGrandLabel.textContent = 'AMOUNT DUE TODAY (50% DEPOSIT):';
        if (invRenderGrandTotal) invRenderGrandTotal.textContent = `$${finalPayable.toLocaleString('en-US')}.00 USD`;
      } else {
        const discountAmt = Math.round(totalScope * 0.05);
        finalPayable = grossScope - discountAmt;
        finalBalanceDue = 0;
        if (invRenderScheduleLabel) invRenderScheduleLabel.textContent = 'Prepayment Incentive (5% Immediate Cash Discount):';
        if (invRenderScheduleAmount) invRenderScheduleAmount.textContent = `-$${discountAmt.toLocaleString('en-US')}.00`;
        if (invRowBalanceDue) invRowBalanceDue.style.display = 'none';
        if (invRenderGrandLabel) invRenderGrandLabel.textContent = 'AMOUNT DUE TODAY (FULL SETTLEMENT):';
        if (invRenderGrandTotal) invRenderGrandTotal.textContent = `$${finalPayable.toLocaleString('en-US')}.00 USD`;
      }

      if (invStripeBtnAmount) invStripeBtnAmount.textContent = `$${finalPayable.toLocaleString('en-US')}.00 USD`;
      if (invPayBtnAmount) invPayBtnAmount.textContent = `$${finalPayable.toLocaleString('en-US')}.00 USD`;

      // Bank Wire reference update
      const invRenderWireRef = document.getElementById('invRenderWireRef');
      if (invRenderWireRef) {
        invRenderWireRef.textContent = `${invNum} / ${(clientCompany || 'Corporate Commission')}`;
      }

      // Maintenance description
      const selectedMaint = document.querySelector('input[name="maintPlan"]:checked')?.value;
      if (invRenderMaintPlan) {
        if (selectedMaint === 'seo') {
          invRenderMaintPlan.textContent = '$500 / month (Enterprise Care + Active Monthly Google SEO & Optimization)';
        } else {
          invRenderMaintPlan.textContent = '$200 / month (Standard Cloud Maintenance & Security Updates)';
        }
      }

      // Dual Gateways checkout URLs
      const tierMap = STRIPE_LINKS[currentTier.id] || STRIPE_LINKS.tier1;
      const hasCustomAddons = checkedAddons.length > 0 || isBulgarianTax;
      const stripeUrl = hasCustomAddons
        ? 'https://buy.stripe.com/28E14h0bacau7Aw1SffAc0a'
        : (isDeposit ? tierMap.deposit : tierMap.full);

      if (invDynamicStripeLink) {
        invDynamicStripeLink.href = stripeUrl;
      }

      const scheduleLabel = isDeposit ? '50% Production Deposit' : 'Full Settlement';
      const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=billing@aeterna.website&currency_code=USD&amount=${finalPayable}&item_name=${encodeURIComponent(`Aeterna Invoice ${invNum} - ${currentTier.title} (${scheduleLabel})`)}&no_shipping=1&no_note=0`;
      if (invDynamicPayPalLink) {
        invDynamicPayPalLink.href = paypalUrl;
      }

      // Background Lead Capture Dispatch (Instant Hot Lead Notification)
      try {
        fetch('https://formspree.io/f/mqaeveze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            event: 'Invoice Generated',
            invoiceNumber: invNum,
            tier: currentTier.title,
            basePrice: currentTier.price,
            totalScope,
            payableToday: finalPayable,
            isDeposit,
            clientCompany: clientCompany || 'Undisclosed',
            clientVat: clientVat || 'N/A',
            clientContact: clientContact || 'N/A',
            clientAddress: clientAddress || 'N/A',
            addons: checkedAddons.map(a => `${a.name} (+$${a.price})`).join('; ') || 'None',
            timestamp: new Date().toISOString()
          })
        }).catch(() => {});
      } catch (_) {}

      // Open the invoice modal!
      openProposalModal('invoice');
    });
  }

  // Invoice Print Action
  const btnInvoicePrint = document.getElementById('btnInvoicePrint');
  if (btnInvoicePrint) {
    btnInvoicePrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Invoice Copy Link Action (Copies Stripe Checkout Link)
  const btnInvoiceCopyLink = document.getElementById('btnInvoiceCopyLink');
  if (btnInvoiceCopyLink) {
    btnInvoiceCopyLink.addEventListener('click', () => {
      const link = document.getElementById('invDynamicStripeLink')?.href || document.getElementById('invDynamicPayPalLink')?.href;
      if (link) {
        navigator.clipboard.writeText(link).then(() => {
          const originalText = btnInvoiceCopyLink.innerHTML;
          btnInvoiceCopyLink.innerHTML = '<span>✓ DIRECT LINK COPIED!</span>';
          btnInvoiceCopyLink.style.borderColor = '#16833b';
          btnInvoiceCopyLink.style.color = '#38e370';
          setTimeout(() => {
            btnInvoiceCopyLink.innerHTML = originalText;
            btnInvoiceCopyLink.style.borderColor = '';
            btnInvoiceCopyLink.style.color = '';
          }, 2500);
        });
      }
    });
  }

  // Copy Bank Wire Details Action
  const btnCopyWireDetails = document.getElementById('btnCopyWireDetails');
  if (btnCopyWireDetails) {
    btnCopyWireDetails.addEventListener('click', () => {
      const wireRef = document.getElementById('invRenderWireRef')?.textContent || 'INV-2026-COMMISSION';
      const wirePayload = 
`AETERNA TECHNOLOGIES EOOD // OFFICIAL B2B BANK WIRE DETAILS
------------------------------------------------------------------
Beneficiary:         Dimitar Stavrev Prodromov / AETERNA Technologies EOOD
Corporate UIC / VAT: BG101327948
Depository Bank:     iCard AD (EU Regulated Financial Institution)
IBAN (EUR/USD/BGN):  BG22INTF40012011857631
BIC / SWIFT Code:    INTFBGSF
Payment Reference:   ${wireRef}
Bank Jurisdiction:   Sofia / Pomorie, European Union
------------------------------------------------------------------
Official Invoicing:  billing@aeterna.website • Tel: +359 884 638 640`;

      navigator.clipboard.writeText(wirePayload).then(() => {
        const originalText = btnCopyWireDetails.innerHTML;
        btnCopyWireDetails.innerHTML = '<span>✓ OFFICIAL IBAN &amp; WIRE DETAILS COPIED!</span>';
        btnCopyWireDetails.style.borderColor = '#38e370';
        btnCopyWireDetails.style.color = '#38e370';
        setTimeout(() => {
          btnCopyWireDetails.innerHTML = originalText;
          btnCopyWireDetails.style.borderColor = '';
          btnCopyWireDetails.style.color = '';
        }, 3000);
      });
    });
  }

  // Share Configured Quote Link (Deep Linking for Partners & Accountants)
  const btnShareQuoteLink = document.getElementById('btnShareQuoteLink');
  if (btnShareQuoteLink) {
    btnShareQuoteLink.addEventListener('click', () => {
      const isDeposit = document.querySelector('input[name="paymentSchedule"]:checked')?.value === 'deposit';
      const checkedAddonNames = [];
      document.querySelectorAll('.cfg-addon-check:checked').forEach((c) => {
        const p = c.getAttribute('data-price');
        if (p) checkedAddonNames.push(p);
      });

      const comp = encodeURIComponent(document.getElementById('cfgClientCompany')?.value.trim() || '');
      const tax = encodeURIComponent(document.getElementById('cfgClientVat')?.value.trim() || '');

      const params = new URLSearchParams();
      params.set('tier', currentTier.id);
      params.set('sched', isDeposit ? 'deposit' : 'full');
      if (checkedAddonNames.length) params.set('addons', checkedAddonNames.join(','));
      if (comp) params.set('comp', comp);
      if (tax) params.set('tax', tax);

      const shareableUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}#quoteConfigurator`;

      navigator.clipboard.writeText(shareableUrl).then(() => {
        const originalText = btnShareQuoteLink.innerHTML;
        btnShareQuoteLink.innerHTML = '<span>✓ SHAREABLE QUOTE LINK COPIED!</span>';
        btnShareQuoteLink.style.borderColor = '#70baff';
        btnShareQuoteLink.style.color = '#70baff';
        setTimeout(() => {
          btnShareQuoteLink.innerHTML = originalText;
          btnShareQuoteLink.style.borderColor = '';
          btnShareQuoteLink.style.color = '';
        }, 3000);
      });
    });
  }

  // Deep-Linking: Hydrate Configurator from URL on page load
  function hydrateFromUrlParams() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.toString()) return;

      const tierParam = urlParams.get('tier');
      if (tierParam) {
        const targetPill = document.querySelector(`.cfg-tier-pill[data-tier-id="${tierParam}"]`);
        if (targetPill) targetPill.click();
      }

      const schedParam = urlParams.get('sched');
      if (schedParam) {
        const targetRadio = document.querySelector(`input[name="paymentSchedule"][value="${schedParam}"]`);
        if (targetRadio) {
          targetRadio.checked = true;
          targetRadio.dispatchEvent(new Event('change'));
        }
      }

      const compParam = urlParams.get('comp');
      if (compParam) {
        const compInput = document.getElementById('cfgClientCompany');
        if (compInput) compInput.value = decodeURIComponent(compParam);
      }

      const taxParam = urlParams.get('tax');
      if (taxParam) {
        const taxInput = document.getElementById('cfgClientVat');
        if (taxInput) taxInput.value = decodeURIComponent(taxParam);
      }

      recalculateConfigurator();
    } catch (_) {}
  }
  setTimeout(hydrateFromUrlParams, 200);

  // ==========================================================================
  // LEGAL & COMPLIANCE MODAL ENGINE
  // ==========================================================================
  const modalLegal = document.getElementById('modalLegalCompliance');
  const legalModalTitle = document.getElementById('legalModalTitle');
  const legalModalContent = document.getElementById('legalModalContent');
  const legalTabs = document.querySelectorAll('.btn-legal-tab');

  const LEGAL_DOCS = {
    terms: {
      title: 'Terms of Service & Engagement Governance',
      html: `
        <h4>1. CORPORATE IDENTIFICATION & JURISDICTION</h4>
        <p>This digital service covenant is executed by and between the client ("Client") and <strong>AETERNA Technologies EOOD</strong>, Unified Identification Code (UIC / VAT): <strong>BG101327948</strong>, registered with headquarters in Pomorie, Republic of Bulgaria, European Union ("Studio", "Architect").</p>

        <h4>2. DELIVERABLES & TECHNICAL BENCHMARKS</h4>
        <p>The Studio delivers bespoke web architecture, 3D WebGL spatial engines, and high-conversion commercial flagships in accordance with the selected commercial tier (Tier 01 Express to Tier 04 Enterprise). All systems are engineered to achieve &lt; 0.8s load latency and 90–100 Google Core Web Vitals performance benchmarks.</p>

        <h4>3. 100% UNRESTRICTED CODE & ASSET OWNERSHIP</h4>
        <p>Upon clearance of the final milestone settlement, 100% of the custom source code, Git repositories, 3D assets, layouts, and domain configurations are transferred unconditionally to the Client. The Client incurs 0% ongoing platform cuts or proprietary licensing royalties.</p>

        <h4>4. 90-DAY COMPLIMENTARY TECHNICAL WARRANTY</h4>
        <p>Every commercial package includes ninety (90) days of comprehensive post-launch technical support, cloud backup verification, and bug fixes at zero additional cost ($0). Month-to-month care plans starting Month 4 are optional and cancelable at any time.</p>
      `
    },
    privacy: {
      title: 'Privacy Policy & GDPR Compliance (Regulation EU 2016/679)',
      html: `
        <h4>1. DATA CONTROLLER & COMMITMENT</h4>
        <p>AETERNA Technologies EOOD operates as the Data Controller in strict accordance with the General Data Protection Regulation (GDPR) and the Bulgarian Personal Data Protection Act. Inquiries may be addressed directly to <strong>billing@aeterna.website</strong>.</p>

        <h4>2. SCOPE OF COLLECTED DATA</h4>
        <p>We collect solely the corporate and contact data strictly necessary to execute commercial pro-forma invoices, mutual Non-Disclosure Agreements, and custom architecture commissions (e.g. Legal Entity Name, Corporate Tax/VAT Number, Signatory Name, and Billing Email).</p>

        <h4>3. ZERO DATA COMMERCIALIZATION</h4>
        <p>The Studio never sells, rents, or commercializes client data to advertising networks or external data brokers. All communications are encrypted via 256-bit TLS encryption.</p>

        <h4>4. RIGHTS OF DATA SUBJECTS</h4>
        <p>Clients possess the unqualified right to access, rectify, export, or request the immediate erasure of their personal data from our operational repositories at any time.</p>
      `
    },
    refund: {
      title: 'Refund, Milestone Settlement & Digital Delivery Policy',
      html: `
        <h4>1. MILESTONE PRODUCTION DEPOSIT</h4>
        <p>Due to the bespoke nature of custom architectural design and dedicated studio reservation (maximum 4 client allocations per quarter), the 50% milestone production deposit becomes non-refundable once discovery and custom software compilation commence.</p>

        <h4>2. CLIENT CALIBRATION & REVISION PHASES</h4>
        <p>Prior to final handover, the Client reviews the live flagship on a private staging server and is entitled to up to three (3) iterative rounds of microscopic design, copy, and performance calibration.</p>

        <h4>3. DIGITAL DELIVERY FULFILLMENT</h4>
        <p>Final delivery is fulfilled digitally via encrypted Git repository transfer, direct DNS / production server deployment, and turnkey credential handover. Automated official tax invoices are issued immediately upon transaction clearance.</p>

        <h4>4. B2B DISPUTE RESOLUTION</h4>
        <p>In the event of an operational dispute, both parties commit to thirty (30) days of good-faith executive mediation directly with the Managing Director prior to initiating formal arbitration.</p>
      `
    },
    nda: {
      title: 'Mutual Non-Disclosure Agreement (NDA) Covenant',
      html: `
        <h4>1. CONFIDENTIALITY PLEDGE</h4>
        <p>Both parties acknowledge that in the course of discussing and executing the digital flagship, proprietary commercial insights, unreleased products, financial projections, and custom codebase will be exchanged ("Confidential Information").</p>

        <h4>2. STANDARD OF CARE</h4>
        <p>The Receiving Party shall safeguard all Confidential Information with the same degree of care it exercises for its own confidential assets, but in no event less than reasonable institutional care.</p>

        <h4>3. TERM OF PROTECTION</h4>
        <p>This confidentiality covenant remains binding for a period of three (3) full years following the date of initial disclosure or formal invoice generation.</p>

        <h4>4. EXECUTED BY ARCHITECT</h4>
        <p>Executed by Dimitar Stavrev Prodromov under EU Horizon Europe PIC: 865986222 and AETERNA Sovereign Cryptographic Mandate.</p>
      `
    }
  };

  function renderLegalDoc(docKey) {
    const doc = LEGAL_DOCS[docKey] || LEGAL_DOCS.terms;
    if (legalModalTitle) legalModalTitle.textContent = doc.title;
    if (legalModalContent) legalModalContent.innerHTML = doc.html;
    legalTabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-doc') === docKey);
    });
  }

  legalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const docKey = tab.getAttribute('data-doc');
      renderLegalDoc(docKey);
    });
  });

  document.querySelectorAll('.trigger-legal-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const docKey = btn.getAttribute('data-legal') || 'terms';
      renderLegalDoc(docKey);
      if (modalLegal) {
        modalLegal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // ==========================================================================
  // 8d. THREE.JS LUXURY 3D INTERACTIVE SANDBOX ENGINE (4D PBR & SPATIAL AUDIO)
  // ==========================================================================
  const modal3dDemo = document.getElementById('modal3dDemo');
  const canvas3dDemo = document.getElementById('canvas3dDemo');
  const demo3dTitle = document.getElementById('demo3dTitle');
  const demoFpsCounter = document.getElementById('demoFpsCounter');
  const demoLatencyCounter = document.getElementById('demoLatencyCounter');
  const demoShaderCounter = document.getElementById('demoShaderCounter');
  const btnAdopt3dAddon = document.getElementById('btnAdopt3dAddon');

  const btnToggleExplode = document.getElementById('btnToggleExplode');
  const sliderExplode = document.getElementById('sliderExplode');
  const valExplode = document.getElementById('valExplode');
  const btnToggle4d = document.getElementById('btnToggle4d');
  const label4d = document.getElementById('label4d');
  const btnToggleAudio = document.getElementById('btnToggleAudio');
  const audioIcon = document.getElementById('audioIcon');
  const labelAudio = document.getElementById('labelAudio');

  let renderer3d = null;
  let scene3d = null;
  let camera3d = null;
  let currentMeshGroup = null;
  let animFrameId = null;
  let activeModelKey = 'watch';
  let is3dDragging = false;
  let prevMousePos = { x: 0, y: 0 };
  let targetRotation = { x: 0.3, y: 0.4 };
  let currentRotation = { x: 0.3, y: 0.4 };
  let targetZoom = 5.0;
  let currentZoom = 5.0;
  let frameCount = 0;
  let lastFpsTime = performance.now();
  let avgLatency = 0.6;

  // 4D & Explode & Material States
  let targetExplodeFactor = 0.0;
  let currentExplodeFactor = 0.0;
  let is4dFlowActive = false;
  let activeMaterialTheme = 'gold';

  // Spatial Audio Engine (Web Audio API - Zero External Audio Files)
  let audioCtx = null;
  let isAudioEnabled = true;
  let lastAudioTickTime = 0;
  let accumulatedDragDist = 0;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playMechanicalClick(freq = 2400) {
    if (!isAudioEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.015);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, ctx.currentTime);
      filter.Q.setValueAtTime(4.0, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch (_) {}
  }

  function playCrystalChime(baseFreq = 880) {
    if (!isAudioEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      [baseFreq, baseFreq * 1.5, baseFreq * 2.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const vol = 0.05 / (idx + 1);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      });
    } catch (_) {}
  }

  function playExplodeWhoosh(isExpanding) {
    if (!isAudioEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const startFreq = isExpanding ? 160 : 640;
      const endFreq = isExpanding ? 640 : 160;
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (_) {}
  }

  const MODEL_META = {
    watch: {
      title: 'Aura Monaco // Tourbillon Spatial Atelier',
    },
    gem: {
      title: 'Kallos Atelier // 4D Brilliant Diamond & Living Gold',
    },
    globe: {
      title: 'Vance & Sterling // Sovereign Asset Topology',
    }
  };

  function applyMaterialTheme(matKey) {
    activeMaterialTheme = matKey;
    if (!currentMeshGroup) return;

    let matProps = {};
    let shaderDesc = 'PBR 24K GOLD ACTIVE';

    if (matKey === 'gold') {
      matProps = {
        color: 0xd4af37,
        metalness: 0.95,
        roughness: 0.18,
        transmission: 0.0,
        clearcoat: 0.4
      };
      shaderDesc = 'PBR 24K GOLD ACTIVE';
    } else if (matKey === 'diamond') {
      matProps = {
        color: 0xffffff,
        metalness: 0.05,
        roughness: 0.03,
        transmission: 0.92,
        thickness: 1.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
      };
      shaderDesc = 'PBR DIAMOND TRANSMISSION';
    } else if (matKey === 'obsidian') {
      matProps = {
        color: 0x090a10,
        metalness: 0.88,
        roughness: 0.14,
        transmission: 0.0,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1
      };
      shaderDesc = 'PBR OBSIDIAN CERAMIC';
    }

    if (demoShaderCounter) demoShaderCounter.textContent = shaderDesc;

    currentMeshGroup.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.name !== 'ruby') {
        if (matKey === 'diamond') {
          if (!(obj.material instanceof THREE.MeshPhysicalMaterial)) {
            obj.material = new THREE.MeshPhysicalMaterial(matProps);
          } else {
            Object.assign(obj.material, matProps);
            obj.material.needsUpdate = true;
          }
        } else {
          if (!(obj.material instanceof THREE.MeshStandardMaterial)) {
            obj.material = new THREE.MeshStandardMaterial(matProps);
          } else {
            Object.assign(obj.material, matProps);
            obj.material.needsUpdate = true;
          }
        }
      }
    });

    playCrystalChime(matKey === 'gold' ? 880 : matKey === 'diamond' ? 1320 : 660);
  }

  function initThreeJsSandbox() {
    if (!window.THREE || !canvas3dDemo) return;
    if (renderer3d) return;

    scene3d = new THREE.Scene();
    camera3d = new THREE.PerspectiveCamera(45, canvas3dDemo.clientWidth / (canvas3dDemo.clientHeight || 480), 0.1, 100);
    camera3d.position.set(0, 0, currentZoom);

    renderer3d = new THREE.WebGLRenderer({
      canvas: canvas3dDemo,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer3d.setSize(canvas3dDemo.clientWidth, canvas3dDemo.clientHeight || 480);
    renderer3d.toneMapping = THREE.ACESFilmicToneMapping;
    renderer3d.toneMappingExposure = 1.25;

    // Ambient + Directional lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene3d.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xd4af37, 2.2);
    dirLight1.position.set(6, 8, 6);
    scene3d.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x70baff, 1.4);
    dirLight2.position.set(-6, -4, -6);
    scene3d.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffeedd, 1.8, 25);
    pointLight.position.set(0, 3, 5);
    scene3d.add(pointLight);

    // Build initial model
    loadModelScene(activeModelKey);

    // Mouse & Touch events
    canvas3dDemo.addEventListener('pointerdown', (e) => {
      is3dDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
      canvas3dDemo.setPointerCapture(e.pointerId);
      getAudioContext(); // Initialize audio context on user gesture
    });

    canvas3dDemo.addEventListener('pointermove', (e) => {
      if (!is3dDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      targetRotation.y += deltaX * 0.008;
      targetRotation.x += deltaY * 0.008;
      targetRotation.x = Math.max(-1.4, Math.min(1.4, targetRotation.x));

      // Audio click on rotation
      accumulatedDragDist += Math.hypot(deltaX, deltaY);
      const now = performance.now();
      if (accumulatedDragDist > 30 && now - lastAudioTickTime > 50) {
        playMechanicalClick(2100 + Math.random() * 500);
        accumulatedDragDist = 0;
        lastAudioTickTime = now;
      }
    });

    const stopDrag = () => { is3dDragging = false; };
    canvas3dDemo.addEventListener('pointerup', stopDrag);
    canvas3dDemo.addEventListener('pointercancel', stopDrag);

    canvas3dDemo.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetZoom += e.deltaY * 0.004;
      targetZoom = Math.max(2.5, Math.min(8.0, targetZoom));
    }, { passive: false });

    // Render loop
    function renderLoop() {
      animFrameId = requestAnimationFrame(renderLoop);

      // Smooth damping
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;
      currentZoom += (targetZoom - currentZoom) * 0.1;

      // Explode smooth lerp
      currentExplodeFactor += (targetExplodeFactor - currentExplodeFactor) * 0.12;

      camera3d.position.z = currentZoom;

      if (currentMeshGroup) {
        currentMeshGroup.rotation.x = currentRotation.x;
        currentMeshGroup.rotation.y = currentRotation.y;

        if (!is3dDragging) {
          targetRotation.y += 0.003;
        }

        // Sub-mesh animations & Explode View Displacements
        if (activeModelKey === 'watch') {
          const escapement = currentMeshGroup.getObjectByName('escapement');
          if (escapement) {
            escapement.rotation.z += 0.08;
            escapement.position.z = currentExplodeFactor * 0.8;
          }
          const tourbillonCage = currentMeshGroup.getObjectByName('tourbillonCage');
          if (tourbillonCage) {
            tourbillonCage.rotation.z -= 0.02;
            tourbillonCage.position.z = 0.08 + currentExplodeFactor * 1.1;
            tourbillonCage.position.y = -0.4 - currentExplodeFactor * 0.2;
          }
          const secondsHand = currentMeshGroup.getObjectByName('secondsHand');
          if (secondsHand) {
            secondsHand.rotation.z -= 0.03;
            secondsHand.position.z = 0.1 + currentExplodeFactor * 2.3;
          }
          const hourHand = currentMeshGroup.getObjectByName('hourHand');
          if (hourHand) {
            hourHand.position.z = 0.08 + currentExplodeFactor * 1.8;
          }
          const bezel = currentMeshGroup.getObjectByName('bezel');
          if (bezel) {
            bezel.position.z = currentExplodeFactor * 1.4;
          }
          const dial = currentMeshGroup.getObjectByName('dial');
          if (dial) {
            dial.position.z = -currentExplodeFactor * 0.35;
          }
        } else if (activeModelKey === 'gem') {
          const goldRings = currentMeshGroup.getObjectByName('goldRings');
          if (goldRings) {
            goldRings.rotation.x += 0.01;
            goldRings.rotation.y += 0.015;
            const scaleVal = 1.0 + currentExplodeFactor * 0.65;
            goldRings.scale.set(scaleVal, scaleVal, scaleVal);
          }
          const gemCore = currentMeshGroup.getObjectByName('gemCore');
          if (gemCore) {
            gemCore.position.y = currentExplodeFactor * 0.8;
          }
        } else if (activeModelKey === 'globe') {
          const ringMesh = currentMeshGroup.getObjectByName('orbitalRings');
          if (ringMesh) {
            ringMesh.rotation.y += 0.02;
            const scaleVal = 1.0 + currentExplodeFactor * 0.75;
            ringMesh.scale.set(scaleVal, scaleVal, scaleVal);
          }
          const wireGlobe = currentMeshGroup.getObjectByName('wireGlobe');
          if (wireGlobe) {
            const scaleVal = 1.0 + currentExplodeFactor * 0.4;
            wireGlobe.scale.set(scaleVal, scaleVal, scaleVal);
          }
        }

        // 4D Living Fluid / Wave Morphing
        if (is4dFlowActive) {
          const t = performance.now() * 0.0028;
          const pulse = 1.0 + Math.sin(t * 1.8) * 0.045;
          const waveZ = Math.cos(t * 1.4) * 0.03;

          if (activeModelKey === 'gem') {
            const gemCore = currentMeshGroup.getObjectByName('gemCore');
            if (gemCore) {
              gemCore.scale.set(pulse, 1.0 + Math.sin(t * 2.4) * 0.06, pulse);
              gemCore.rotation.z = waveZ;
            }
          } else if (activeModelKey === 'watch') {
            const bezel = currentMeshGroup.getObjectByName('bezel');
            if (bezel) {
              bezel.scale.set(pulse, pulse, 1.0 + waveZ * 2.0);
            }
          } else if (activeModelKey === 'globe') {
            const coreGlobe = currentMeshGroup.getObjectByName('coreGlobe');
            if (coreGlobe) {
              coreGlobe.scale.set(pulse, pulse, pulse);
            }
          }
        }
      }

      const tStart = performance.now();
      renderer3d.render(scene3d, camera3d);
      const tRender = performance.now() - tStart;

      // Moving average for latency
      avgLatency = avgLatency * 0.9 + tRender * 0.1;

      // FPS & Telemetry counter
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        if (demoFpsCounter) demoFpsCounter.textContent = `${fps}`;
        if (demoLatencyCounter) demoLatencyCounter.textContent = avgLatency.toFixed(2);
        frameCount = 0;
        lastFpsTime = now;
      }
    }
    renderLoop();
  }

  function loadModelScene(modelKey) {
    if (!scene3d) return;
    activeModelKey = modelKey;

    // Reset Explode & 4D states for newly loaded scene
    targetExplodeFactor = 0.0;
    currentExplodeFactor = 0.0;
    if (sliderExplode) sliderExplode.value = 0;
    if (valExplode) valExplode.textContent = '0%';
    if (btnToggleExplode) btnToggleExplode.classList.remove('active');

    if (currentMeshGroup) {
      scene3d.remove(currentMeshGroup);
      currentMeshGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    currentMeshGroup = new THREE.Group();

    if (modelKey === 'watch') {
      // 1. AURA MONACO TOURBILLON
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.95,
        roughness: 0.2,
      });
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.9,
        roughness: 0.3,
      });
      const rubyMat = new THREE.MeshStandardMaterial({
        color: 0xc80815,
        metalness: 0.1,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      });
      const blueSteelMat = new THREE.MeshStandardMaterial({
        color: 0x1b3f8b,
        metalness: 0.85,
        roughness: 0.2,
      });

      // Outer bezel ring
      const bezelGeo = new THREE.TorusGeometry(1.5, 0.18, 24, 64);
      const bezel = new THREE.Mesh(bezelGeo, goldMat);
      bezel.name = 'bezel';
      currentMeshGroup.add(bezel);

      // Dial Plate
      const dialGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.08, 48);
      const dialMat = new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.6, roughness: 0.4 });
      const dial = new THREE.Mesh(dialGeo, dialMat);
      dial.name = 'dial';
      dial.rotation.x = Math.PI / 2;
      currentMeshGroup.add(dial);

      // Tourbillon Cage & Balance Wheel
      const cageGroup = new THREE.Group();
      cageGroup.name = 'tourbillonCage';
      cageGroup.position.set(0, -0.4, 0.08);

      const cageRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 16, 32), goldMat);
      cageRing.name = 'cageRing';
      cageGroup.add(cageRing);

      const escapement = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.03, 12), steelMat);
      escapement.name = 'escapement';
      escapement.rotation.x = Math.PI / 2;
      cageGroup.add(escapement);

      const ruby = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), rubyMat);
      ruby.name = 'ruby';
      ruby.position.z = 0.04;
      cageGroup.add(ruby);

      currentMeshGroup.add(cageGroup);

      // Hands
      const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.02), blueSteelMat);
      hourHand.name = 'hourHand';
      hourHand.position.set(0, 0.3, 0.08);
      currentMeshGroup.add(hourHand);

      const secHand = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.1, 0.02), goldMat);
      secHand.name = 'secondsHand';
      secHand.position.set(0, 0.2, 0.1);
      currentMeshGroup.add(secHand);

    } else if (modelKey === 'gem') {
      // 2. KALLOS ATELIER BRILLIANT DIAMOND & LIVING GOLD
      const diamondMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 1.2,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });

      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xe6b800,
        metalness: 0.95,
        roughness: 0.18,
      });

      const gemGeo = new THREE.OctahedronGeometry(1.2, 1);
      const gem = new THREE.Mesh(gemGeo, diamondMat);
      gem.name = 'gemCore';
      currentMeshGroup.add(gem);

      const goldRingsGroup = new THREE.Group();
      goldRingsGroup.name = 'goldRings';

      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.05, 16, 64), goldMat);
      ring1.name = 'ring1';
      ring1.rotation.x = 0.8;
      goldRingsGroup.add(ring1);

      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.04, 16, 64), goldMat);
      ring2.name = 'ring2';
      ring2.rotation.y = 1.1;
      goldRingsGroup.add(ring2);

      for (let i = 0; i < 6; i++) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), goldMat);
        sphere.name = `satellite_${i}`;
        const angle = (i / 6) * Math.PI * 2;
        sphere.position.set(Math.cos(angle) * 1.7, Math.sin(angle) * 0.4, Math.sin(angle) * 1.7);
        goldRingsGroup.add(sphere);
      }

      currentMeshGroup.add(goldRingsGroup);

    } else if (modelKey === 'globe') {
      // 3. VANCE & STERLING SOVEREIGN ASSET TERMINAL
      const obsidianMat = new THREE.MeshStandardMaterial({
        color: 0x0a0c10,
        metalness: 0.8,
        roughness: 0.3,
      });
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const cyanGlowMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
      });

      const coreGlobe = new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 32), obsidianMat);
      coreGlobe.name = 'coreGlobe';
      currentMeshGroup.add(coreGlobe);

      const wireGlobe = new THREE.Mesh(new THREE.SphereGeometry(1.32, 24, 24), wireMat);
      wireGlobe.name = 'wireGlobe';
      currentMeshGroup.add(wireGlobe);

      const hubCoords = [
        [0.7, 0.8, 0.7],
        [0.2, 1.1, 0.6],
        [0.9, 0.3, -0.8],
        [-0.8, 0.7, 0.8],
        [-0.6, -0.2, 1.1],
        [0.4, 0.5, -1.1]
      ];

      hubCoords.forEach(([x, y, z], idx) => {
        const hub = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), cyanGlowMat);
        hub.name = `hubNode_${idx}`;
        hub.position.set(x, y, z);
        currentMeshGroup.add(hub);
      });

      const ringsGroup = new THREE.Group();
      ringsGroup.name = 'orbitalRings';
      const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.025, 12, 64), new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.6
      }));
      orbitRing.name = 'orbitRing';
      orbitRing.rotation.x = Math.PI / 3;
      ringsGroup.add(orbitRing);
      currentMeshGroup.add(ringsGroup);
    }

    scene3d.add(currentMeshGroup);

    // Apply active material theme to newly created meshes if not gold
    if (activeMaterialTheme !== 'gold') {
      applyMaterialTheme(activeMaterialTheme);
    }

    const meta = MODEL_META[modelKey] || MODEL_META.watch;
    if (demo3dTitle) demo3dTitle.textContent = meta.title;
  }

  // Hook up Floating HUD Interactive Controls
  if (btnToggleExplode) {
    btnToggleExplode.addEventListener('click', () => {
      targetExplodeFactor = (targetExplodeFactor > 0.05 ? 0.0 : 1.0);
      const isExp = targetExplodeFactor > 0.05;
      btnToggleExplode.classList.toggle('active', isExp);
      if (sliderExplode) sliderExplode.value = Math.round(targetExplodeFactor * 100);
      if (valExplode) valExplode.textContent = `${Math.round(targetExplodeFactor * 100)}%`;
      playExplodeWhoosh(isExp);
    });
  }

  if (sliderExplode) {
    sliderExplode.addEventListener('input', (e) => {
      targetExplodeFactor = parseFloat(e.target.value) / 100;
      if (valExplode) valExplode.textContent = `${Math.round(targetExplodeFactor * 100)}%`;
      if (btnToggleExplode) btnToggleExplode.classList.toggle('active', targetExplodeFactor > 0.05);
      if (Math.random() > 0.65) playMechanicalClick(2000 + targetExplodeFactor * 1000);
    });
  }

  if (btnToggle4d) {
    btnToggle4d.addEventListener('click', () => {
      is4dFlowActive = !is4dFlowActive;
      btnToggle4d.classList.toggle('active', is4dFlowActive);
      if (label4d) label4d.textContent = is4dFlowActive ? '4D FLOW: ON' : '4D FLOW: OFF';
      playCrystalChime(is4dFlowActive ? 1100 : 700);
    });
  }

  if (btnToggleAudio) {
    btnToggleAudio.addEventListener('click', () => {
      isAudioEnabled = !isAudioEnabled;
      btnToggleAudio.classList.toggle('active', isAudioEnabled);
      if (audioIcon) audioIcon.textContent = isAudioEnabled ? '🔊' : '🔇';
      if (labelAudio) labelAudio.textContent = isAudioEnabled ? 'AUDIO: ON' : 'AUDIO: OFF';
      if (isAudioEnabled) playMechanicalClick(2600);
    });
  }

  document.querySelectorAll('.btn-hud-mat').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-hud-mat').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mat = btn.getAttribute('data-mat') || 'gold';
      applyMaterialTheme(mat);
    });
  });

  function open3dDemoModal(modelKey = 'watch') {
    if (!modal3dDemo) return;
    modal3dDemo.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.querySelectorAll('.btn-demo-tab').forEach((tab) => {
      if (tab.getAttribute('data-model') === modelKey) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    setTimeout(() => {
      initThreeJsSandbox();
      loadModelScene(modelKey);
      if (renderer3d && canvas3dDemo) {
        renderer3d.setSize(canvas3dDemo.clientWidth, canvas3dDemo.clientHeight || 450);
        camera3d.aspect = canvas3dDemo.clientWidth / (canvas3dDemo.clientHeight || 450);
        camera3d.updateProjectionMatrix();
      }
    }, 60);
  }

  function close3dDemoModal() {
    if (!modal3dDemo) return;
    modal3dDemo.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Model switch tabs
  document.querySelectorAll('.btn-demo-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.btn-demo-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const model = tab.getAttribute('data-model') || 'watch';
      loadModelScene(model);
    });
  });

  // Modal triggers on cards and configurator
  document.querySelectorAll('.btn-case-demo-trigger, .btn-card-launch-3d, .btn-addon-preview-3d').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const model = btn.getAttribute('data-demo') || 'watch';
      open3dDemoModal(model);
    });
  });

  if (modal3dDemo) {
    modal3dDemo.querySelector('.modal-close-btn')?.addEventListener('click', close3dDemoModal);
    modal3dDemo.addEventListener('click', (e) => {
      if (e.target === modal3dDemo) close3dDemoModal();
    });
  }

  if (btnAdopt3dAddon) {
    btnAdopt3dAddon.addEventListener('click', () => {
      close3dDemoModal();
      const chk3d = document.querySelector('.cfg-addon-check[data-price="800"]');
      if (chk3d) {
        chk3d.checked = true;
        recalculateConfigurator();
      }
      const cfgElem = document.getElementById('quoteConfigurator');
      if (cfgElem) {
        cfgElem.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // "INITIATE THIS TIER WITH NDA" button inside proposal modals
  document.querySelectorAll('.initiate-tier-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const scopeChoice = btn.getAttribute('data-tier-choice');
      const budgetChoice = btn.getAttribute('data-budget-choice');

      closeAllProposalModals();

      // Pre-select scope pill in inquiry modal
      if (scopeChoice) {
        document.querySelectorAll('.pill-service').forEach((p) => {
          if (p.textContent.trim().includes(scopeChoice) || scopeChoice.includes(p.textContent.trim())) {
            p.parentElement.querySelectorAll('.pill').forEach((x) => x.classList.remove('selected'));
            p.classList.add('selected');
          }
        });
      }

      // Pre-select budget pill in inquiry modal
      if (budgetChoice) {
        document.querySelectorAll('.pill-budget').forEach((p) => {
          if (p.innerHTML.includes(budgetChoice) || budgetChoice.includes(p.innerHTML)) {
            p.parentElement.querySelectorAll('.pill').forEach((x) => x.classList.remove('selected'));
            p.classList.add('selected');
          }
        });
      }

      // Open inquiry modal with selected tier prefilled
      setTimeout(openModal, 120);
    });
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
      const selectedBudget = document.querySelector('.pill-budget.selected')?.textContent.trim() || '$7,500 – $15,000+';

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

      window.location.href = `mailto:dimitar@aeterna.website?subject=${subject}&body=${body}`;
      alert(`Thank you, ${name}. Your executive brief has been dispatched. An NDA confirmation will be issued to ${email} within 24 hours.`);
      closeModal();
      inquiryForm.reset();
    });
  }

  // ==========================================================================
  // 9. FLAGSHIP PORTFOLIO FILTER & INTERACTIVE LIVE BROWSER PREVIEW
  // ==========================================================================
  const filterTabs = document.querySelectorAll('.btn-filter-tab');
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  function setPortfolioFilter(category) {
    filterTabs.forEach((tab) => {
      tab.classList.toggle('active', tab.getAttribute('data-filter') === category);
    });
    portfolioCards.forEach((card) => {
      const cardCat = card.getAttribute('data-category');
      if (category === 'all' || cardCat === category) {
        card.classList.remove('is-hidden');
      } else {
        card.classList.add('is-hidden');
      }
    });
  }

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const category = tab.getAttribute('data-filter') || 'live';
      setPortfolioFilter(category);
    });
  });

  // Default to Live Production Platforms on initial load
  setPortfolioFilter('live');

  // Direct Tier Order Triggers from Portfolio Cards
  document.querySelectorAll('.btn-trigger-tier-order').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tierId = btn.getAttribute('data-select-tier') || 'tier4';
      const targetPill = document.querySelector(`.cfg-tier-pill[data-tier-id="${tierId}"]`);
      if (targetPill) targetPill.click();
      const cfgElem = document.getElementById('quoteConfigurator');
      if (cfgElem) {
        cfgElem.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Interactive Live Browser Preview Modal Engine
  const modalLiveBrowserPreview = document.getElementById('modalLiveBrowserPreview');
  const lblLivePreviewUrl = document.getElementById('lblLivePreviewUrl');
  const btnLiveExternalLink = document.getElementById('btnLiveExternalLink');
  const iframeLivePreview = document.getElementById('iframeLivePreview');
  const browserSpinner = document.getElementById('browserSpinner');
  const btnViewDesktop = document.getElementById('btnViewDesktop');
  const btnViewMobile = document.getElementById('btnViewMobile');
  const browserViewportWrapper = document.getElementById('browserViewportWrapper');
  const btnAdoptLiveDesign = document.getElementById('btnAdoptLiveDesign');
  const btnCloseBrowserPreview = document.getElementById('btnCloseBrowserPreview');

  let currentPreviewUrl = 'https://anchialo.com';

  function openLiveBrowserPreview(url, title) {
    if (!modalLiveBrowserPreview || !iframeLivePreview) return;
    currentPreviewUrl = url;
    if (lblLivePreviewUrl) lblLivePreviewUrl.textContent = url;
    if (btnLiveExternalLink) btnLiveExternalLink.href = url;

    if (browserSpinner) browserSpinner.classList.add('active');
    iframeLivePreview.src = url;

    iframeLivePreview.onload = () => {
      if (browserSpinner) browserSpinner.classList.remove('active');
    };

    modalLiveBrowserPreview.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLiveBrowserPreview() {
    if (!modalLiveBrowserPreview) return;
    modalLiveBrowserPreview.classList.remove('active');
    document.body.style.overflow = '';
    if (iframeLivePreview) iframeLivePreview.src = 'about:blank';
  }

  document.querySelectorAll('.btn-case-preview-trigger, .btn-card-preview-live').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = btn.getAttribute('data-preview-url') || 'https://anchialo.com';
      const title = btn.getAttribute('data-preview-title') || 'Live Platform Preview';
      openLiveBrowserPreview(url, title);
    });
  });

  if (btnViewDesktop && browserViewportWrapper) {
    btnViewDesktop.addEventListener('click', () => {
      btnViewDesktop.classList.add('active');
      if (btnViewMobile) btnViewMobile.classList.remove('active');
      browserViewportWrapper.classList.remove('is-mobile');
    });
  }

  if (btnViewMobile && browserViewportWrapper) {
    btnViewMobile.addEventListener('click', () => {
      btnViewMobile.classList.add('active');
      if (btnViewDesktop) btnViewDesktop.classList.remove('active');
      browserViewportWrapper.classList.add('is-mobile');
    });
  }

  if (btnCloseBrowserPreview) {
    btnCloseBrowserPreview.addEventListener('click', closeLiveBrowserPreview);
  }

  if (modalLiveBrowserPreview) {
    modalLiveBrowserPreview.addEventListener('click', (e) => {
      if (e.target === modalLiveBrowserPreview) closeLiveBrowserPreview();
    });
  }

  if (btnAdoptLiveDesign) {
    btnAdoptLiveDesign.addEventListener('click', () => {
      closeLiveBrowserPreview();
      const targetPill = document.querySelector('.cfg-tier-pill[data-tier-id="tier4"]');
      if (targetPill) targetPill.click();
      const cfgElem = document.getElementById('quoteConfigurator');
      if (cfgElem) {
        cfgElem.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

})();
