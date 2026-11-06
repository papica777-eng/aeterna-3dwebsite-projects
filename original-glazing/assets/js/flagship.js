/* ==========================================================================
   ORIGINAL PROPERTY GROUP & ORIGINAL GLAZING — 8K ARCHITECTURAL STUDIO ENGINE
   60fps Specular Glass Caustics • Spotlight Bento • Zero Monospace • Exact Math
   ========================================================================== */

(function () {
  'use strict';

  const DISPATCH_PHONE_DISPLAY = '0411 946 933';
  const DISPATCH_WA_INTL = '61411946933';

  /* ------------------------------------------------------------------------
     1. 8K SPECULAR ARCHITECTURAL GLASS REFRACTION CANVAS
     ------------------------------------------------------------------------ */
  function initArchitecturalCanvas() {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;

    let canvas = hero.querySelector('.hero-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'hero-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      hero.insertBefore(canvas, hero.firstChild);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isGlazing = document.body.classList.contains('theme-glazing');
    let width = 0;
    let height = 0;
    let pointerX = 0.65;
    let pointerY = 0.35;
    let targetX = 0.65;
    let targetY = 0.35;
    let tick = 0;

    function resize() {
      const rect = hero.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width));
      height = Math.max(320, Math.floor(rect.height));
      canvas.width = width;
      canvas.height = height;
    }

    window.addEventListener('resize', resize, { passive: true });
    hero.addEventListener('mousemove', function (e) {
      const r = hero.getBoundingClientRect();
      targetX = (e.clientX - r.left) / Math.max(1, r.width);
      targetY = (e.clientY - r.top) / Math.max(1, r.height);
    }, { passive: true });

    resize();

    function renderFrame() {
      tick += 0.005;
      pointerX += (targetX - pointerX) * 0.05;
      pointerY += (targetY - pointerY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Smooth 8K Architectural Glass Caustic Light Beams
      for (let i = 0; i < 3; i++) {
        const shift = Math.sin(tick + i * 1.4) * 55 + (pointerX - 0.5) * 85;
        const x0 = width * (0.42 + i * 0.16) + shift;
        const grad = ctx.createLinearGradient(x0 - 150, 0, x0 + 190, height);
        if (isGlazing) {
          grad.addColorStop(0, 'rgba(125, 211, 252, 0)');
          grad.addColorStop(0.5, 'rgba(125, 211, 252, 0.05)');
          grad.addColorStop(1, 'rgba(207, 169, 98, 0)');
        } else {
          grad.addColorStop(0, 'rgba(207, 169, 98, 0)');
          grad.addColorStop(0.5, 'rgba(207, 169, 98, 0.05)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0 + 180, 0);
        ctx.lineTo(x0 - 80, height);
        ctx.lineTo(x0 - 260, height);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      // Soft Ambient Studio Spotlight
      const rad = ctx.createRadialGradient(
        pointerX * width, pointerY * height, 10,
        pointerX * width, pointerY * height, 360
      );
      rad.addColorStop(0, isGlazing ? 'rgba(125, 211, 252, 0.075)' : 'rgba(207, 169, 98, 0.075)');
      rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, width, height);

      requestAnimationFrame(renderFrame);
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(renderFrame);
    }
  }

  /* ------------------------------------------------------------------------
     2. SCROLL REVEAL & MOUSE-TRACKING CARD SPOTLIGHT
     ------------------------------------------------------------------------ */
  function initChoreographyAndSpotlights() {
    document.querySelectorAll('.service-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });

    const targets = document.querySelectorAll('.service-card, .project-card, .spec-row, .stat-card');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });

      targets.forEach(function (el) {
        el.classList.add('reveal');
        io.observe(el);
      });
    }
  }

  /* ------------------------------------------------------------------------
     3. CLEAN MODE & NAVIGATION / ACCORDIONS
     ------------------------------------------------------------------------ */
  function initCleanModeAndNav() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('clean') === '1') {
      const pill = document.getElementById('auditVerifiedPill');
      if (pill) pill.style.display = 'none';
    }

    const menuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');
    if (menuBtn && mainNav) {
      menuBtn.addEventListener('click', function () {
        const isOpen = mainNav.classList.toggle('mobile-open');
        menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    document.querySelectorAll('.accordion-trigger').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const item = btn.closest('.accordion-item');
        if (!item) return;
        const nowOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
        const indicator = btn.querySelector('.acc-icon');
        if (indicator) indicator.textContent = nowOpen ? '−' : '+';
      });
    });

    const faqSearch = document.getElementById('faqSearchInput');
    if (faqSearch) {
      faqSearch.addEventListener('input', function () {
        const q = faqSearch.value.trim().toLowerCase();
        document.querySelectorAll('.faq-searchable').forEach(function (item) {
          const match = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
          item.style.display = match ? '' : 'none';
          if (q && match) item.classList.add('open');
        });
      });
    }
  }

  /* ------------------------------------------------------------------------
     4. ORIGINAL PROPERTY GROUP — MULTI-TRADE SCOPE BUILDER
     ------------------------------------------------------------------------ */
  function initOpgEstimator() {
    const root = document.getElementById('opgEstimator');
    if (!root) return;

    const propTypeEl = document.getElementById('opgPropType');
    const urgencyEl = document.getElementById('opgUrgency');
    const discountEl = document.getElementById('opgDiscountChk');
    const summaryTitleEl = document.getElementById('opgResultSla');
    const summarySpecEl = document.getElementById('opgResultSpec');
    const waBtn = document.getElementById('opgCalcWaBtn');
    const formJumpBtn = document.getElementById('opgCalcFormBtn');
    const chips = Array.from(root.querySelectorAll('.trade-chip'));

    function updateOpgScope() {
      const selectedTrades = chips
        .filter(function (c) { return c.classList.contains('active'); })
        .map(function (c) { return c.getAttribute('data-trade') || c.textContent.trim(); });

      if (selectedTrades.length === 0 && chips[0]) {
        chips[0].classList.add('active');
        selectedTrades.push(chips[0].getAttribute('data-trade') || chips[0].textContent.trim());
      }

      const propType = propTypeEl ? propTypeEl.value : 'Residential Home';
      const urgency = urgencyEl ? urgencyEl.value : '24/7 Emergency Make-Safe (< 60 Mins)';
      const hasDiscount = discountEl && discountEl.checked;

      let slaLabel = 'Same-Week Coordinated Trade Dispatch';
      if (urgency.indexOf('24/7') !== -1) {
        slaLabel = '< 60 Min Melbourne Emergency Dispatch';
      } else if (urgency.indexOf('Priority') !== -1) {
        slaLabel = '24–48 Hr Priority Trade Attendance';
      }

      const tradeCountText = selectedTrades.length === 1
        ? '1 Division (' + selectedTrades[0] + ')'
        : selectedTrades.length + ' Coordinated Divisions (' + selectedTrades.join(', ') + ')';

      const discountNote = hasDiscount
        ? ' · Pensioner, NDIS & Strata Priority Applied'
        : ' · Obligation-Free Quote (ABN 27 564 832 883)';

      if (summaryTitleEl) summaryTitleEl.textContent = slaLabel;
      if (summarySpecEl) summarySpecEl.textContent = propType + ' · ' + tradeCountText + discountNote;

      const waMsg = 'Hi David (Original Property Group), requesting a Melbourne quote:\n' +
        '- Property: ' + propType + '\n' +
        '- Divisions: ' + selectedTrades.join(', ') + '\n' +
        '- Priority: ' + urgency +
        (hasDiscount ? '\n- Account: Pensioner / NDIS / Strata Commercial Rate' : '');

      if (waBtn) {
        waBtn.href = 'https://wa.me/' + DISPATCH_WA_INTL + '?text=' + encodeURIComponent(waMsg);
      }

      if (formJumpBtn) {
        formJumpBtn.onclick = function () {
          const serviceSelect = document.getElementById('quoteServiceSelect');
          const msgArea = document.getElementById('quoteDetailsInput');
          if (serviceSelect && selectedTrades[0]) {
            Array.from(serviceSelect.options).forEach(function (opt) {
              if (opt.text.toLowerCase().indexOf(selectedTrades[0].toLowerCase().split(' ')[0]) !== -1) {
                serviceSelect.value = opt.value;
              }
            });
          }
          if (msgArea) {
            msgArea.value = 'Property: ' + propType + ' | Divisions: ' + selectedTrades.join(', ') + ' | Priority: ' + urgency + (hasDiscount ? ' | Pensioner/NDIS/Strata Rate' : '');
          }
          const contactSec = document.getElementById('contact');
          if (contactSec) contactSec.scrollIntoView({ behavior: 'smooth' });
        };
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chip.classList.toggle('active');
        updateOpgScope();
      });
    });

    if (propTypeEl) propTypeEl.addEventListener('change', updateOpgScope);
    if (urgencyEl) urgencyEl.addEventListener('change', updateOpgScope);
    if (discountEl) discountEl.addEventListener('change', updateOpgScope);
    updateOpgScope();
  }

  /* ------------------------------------------------------------------------
     5. ORIGINAL GLAZING 24/7 — INTEGER-EXACT AS1288 GLASS CALCULATOR
     ------------------------------------------------------------------------ */
  const GLASS_SPECS = {
    laminate_clear: {
      name: '6.38mm Clear Laminated Safety Glass (AS1288)',
      kgPerSqmTenths: 158,
      acousticDb: '32 dB Acoustic Rating',
      uvBlock: '99% UV Blocked',
      standard: 'AS1288 Grade A Human Impact'
    },
    laminate_frosted: {
      name: '6.38mm Translucent Privacy Laminate (AS1288)',
      kgPerSqmTenths: 158,
      acousticDb: '33 dB Acoustic Rating',
      uvBlock: '99% UV + Privacy Diffusion',
      standard: 'AS1288 Grade A Wet-Area & Facade'
    },
    toughened_10: {
      name: '10mm Heat-Toughened Frameless Glass (AS1288)',
      kgPerSqmTenths: 250,
      acousticDb: '31 dB Mass Damping',
      uvBlock: '5x Flexural Strength',
      standard: 'AS1288 Grade A Showers & Doors'
    },
    double_igu: {
      name: '24mm Argon Low-E Insulated Glass Unit (IGU)',
      kgPerSqmTenths: 300,
      acousticDb: '39 dB Acoustic Barrier',
      uvBlock: 'Up to 64% Less Thermal Loss',
      standard: 'AS1288 + NatHERS Thermal Spec'
    },
    shopfront_1038: {
      name: '10.38mm Commercial Shopfront Security Laminate',
      kgPerSqmTenths: 258,
      acousticDb: '37 dB Retail Acoustic Rating',
      uvBlock: '99% Display Fade Control',
      standard: 'AS1288 Commercial Anti-Intrusion'
    }
  };

  function initGlazingCalculator() {
    const root = document.getElementById('glazingCalculator');
    if (!root) return;

    const glassTypeEl = document.getElementById('glazeSpecSelect');
    const widthEl = document.getElementById('glazeWidthMm');
    const heightEl = document.getElementById('glazeHeightMm');
    const urgencyEl = document.getElementById('glazeUrgencySelect');
    const discountEl = document.getElementById('glazeDiscountChk');
    const outMainEl = document.getElementById('glazeCalcMainOut');
    const outSubEl = document.getElementById('glazeCalcSubOut');
    const waBtn = document.getElementById('glazeCalcWaBtn');
    const formBtn = document.getElementById('glazeCalcFormBtn');

    function updateGlazingCalc() {
      const specKey = (glassTypeEl && GLASS_SPECS[glassTypeEl.value]) ? glassTypeEl.value : 'laminate_clear';
      const spec = GLASS_SPECS[specKey];

      let wMm = parseInt(widthEl ? widthEl.value : '1200', 10);
      let hMm = parseInt(heightEl ? heightEl.value : '1500', 10);
      if (isNaN(wMm) || wMm < 100) wMm = 100;
      if (wMm > 6000) wMm = 6000;
      if (isNaN(hMm) || hMm < 100) hMm = 100;
      if (hMm > 6000) hMm = 6000;

      const areaMm2 = wMm * hMm;
      const areaHundredths = Math.max(10, Math.round(areaMm2 / 10000));
      const areaFormatted = (Math.floor(areaHundredths / 100)) + '.' + String(areaHundredths % 100).padStart(2, '0');

      const weightTenths = Math.max(20, Math.round((areaHundredths * spec.kgPerSqmTenths) / 100));
      const weightFormatted = (Math.floor(weightTenths / 10)) + '.' + (weightTenths % 10);

      const urgency = urgencyEl ? urgencyEl.value : '24/7 Emergency Rapid Replacement';
      const hasDiscount = discountEl && discountEl.checked;

      if (outMainEl) {
        outMainEl.textContent = areaFormatted + ' m² · ' + weightFormatted + ' kg Panel';
      }
      if (outSubEl) {
        outSubEl.textContent = spec.standard + ' · ' + spec.acousticDb + ' · ' + spec.uvBlock +
          (hasDiscount ? ' · Concession/Partner Rate' : '');
      }

      const waMsg = 'Hi David (Original Glazing 24/7), requesting a Melbourne glass quote:\n' +
        '- Specification: ' + spec.name + '\n' +
        '- Dimensions: ' + wMm + 'mm x ' + hMm + 'mm (' + areaFormatted + ' m²)\n' +
        '- Priority: ' + urgency +
        (hasDiscount ? '\n- Rate: Pensioner / NDIS / Commercial Partner' : '');

      if (waBtn) {
        waBtn.href = 'https://wa.me/' + DISPATCH_WA_INTL + '?text=' + encodeURIComponent(waMsg);
      }

      if (formBtn) {
        formBtn.onclick = function () {
          const msgArea = document.getElementById('quoteDetailsInput');
          if (msgArea) {
            msgArea.value = 'Glass Spec: ' + spec.name + ' | Dimensions: ' + wMm + 'mm x ' + hMm + 'mm (' + areaFormatted + ' m²) | Priority: ' + urgency + (hasDiscount ? ' | Concession/Commercial Rate' : '');
          }
          const contactSec = document.getElementById('contact');
          if (contactSec) contactSec.scrollIntoView({ behavior: 'smooth' });
        };
      }
    }

    [glassTypeEl, widthEl, heightEl, urgencyEl, discountEl].forEach(function (el) {
      if (el) {
        el.addEventListener('input', updateGlazingCalc);
        el.addEventListener('change', updateGlazingCalc);
      }
    });
    updateGlazingCalc();
  }

  /* ------------------------------------------------------------------------
     6. 8K ARCHITECTURAL GLASS SECTION STUDIO (CRISP VECTOR GRAPHICS)
     ------------------------------------------------------------------------ */
  const SIM_DATA = {
    float4: {
      title: 'Legacy 3mm–4mm Annealed Float Glass (Non-Compliant)',
      safety: 'Non-Compliant — Fractures Into Shards',
      safetyColor: '#f87171',
      acoustic: '24 dB Rw (Minimal)',
      thermal: '5.9 W/m²K (Uninsulated)',
      uv: '18% UV Attenuation',
      svg: '<svg viewBox="0 0 440 200" width="100%" height="100%" font-family="Outfit, Plus Jakarta Sans, sans-serif">' +
        '<line x1="30" y1="100" x2="178" y2="100" stroke="#f87171" stroke-width="1.5" stroke-dasharray="4 4"/>' +
        '<polygon points="178,100 170,96 170,104" fill="#f87171"/>' +
        '<rect x="188" y="24" width="14" height="152" rx="2" fill="rgba(248,113,113,0.24)" stroke="#f87171" stroke-width="1.5"/>' +
        '<path d="M189 68 L201 92 M201 64 L189 108 M189 114 L201 138" stroke="#fca5a5" stroke-width="1.5"/>' +
        '<text x="30" y="88" fill="#f87171" font-size="11" font-weight="600">Impact Vector</text>' +
        '<text x="222" y="82" fill="#ffffff" font-size="14" font-weight="600">4.0 mm Annealed Monolith</text>' +
        '<text x="222" y="104" fill="#f87171" font-size="12">Prohibited in AS1288 human-impact zones</text>' +
        '<text x="222" y="124" fill="#8b95a7" font-size="11.5">Zero interlayer retention upon fracture</text>' +
        '</svg>'
    },
    lam638: {
      title: '6.38mm Architectural Safety Laminate (3mm + 0.38mm PVB + 3mm)',
      safety: 'Grade A — AS1288:2021 Certified',
      safetyColor: '#34d399',
      acoustic: '33 dB Rw (Acoustic PVB)',
      thermal: '5.5 W/m²K + Solar Control',
      uv: '99% UV Spectrum Blocked',
      svg: '<svg viewBox="0 0 440 200" width="100%" height="100%" font-family="Outfit, Plus Jakarta Sans, sans-serif">' +
        '<line x1="30" y1="100" x2="160" y2="100" stroke="#7dd3fc" stroke-width="1.5"/>' +
        '<rect x="170" y="22" width="16" height="156" rx="2" fill="rgba(125,211,252,0.25)" stroke="#7dd3fc" stroke-width="1.5"/>' +
        '<rect x="188" y="22" width="7" height="156" rx="1" fill="#cfa962"/>' +
        '<rect x="197" y="22" width="16" height="156" rx="2" fill="rgba(125,211,252,0.25)" stroke="#7dd3fc" stroke-width="1.5"/>' +
        '<text x="30" y="88" fill="#7dd3fc" font-size="11" font-weight="600">Impact Arrested</text>' +
        '<text x="230" y="78" fill="#ffffff" font-size="14" font-weight="600">3 mm + 0.38 mm PVB + 3 mm</text>' +
        '<text x="230" y="100" fill="#34d399" font-size="12">Bonds fragments safely inside window rebate</text>' +
        '<text x="230" y="120" fill="#edd6a6" font-size="11.5">Cut on-site from Melbourne 24/7 mobile fleet</text>' +
        '</svg>'
    },
    tough10: {
      title: '10mm Heat-Tempered Frameless Monolith (AS1288 Grade A)',
      safety: 'Grade A — 500% Flexural Load',
      safetyColor: '#34d399',
      acoustic: '31 dB Rw Solid Mass',
      thermal: '250°C Thermal Shock Rated',
      uv: '42% UV Attenuation',
      svg: '<svg viewBox="0 0 440 200" width="100%" height="100%" font-family="Outfit, Plus Jakarta Sans, sans-serif">' +
        '<rect x="176" y="22" width="32" height="156" rx="3" fill="rgba(125,211,252,0.3)" stroke="#e0f2fe" stroke-width="1.6"/>' +
        '<line x1="176" y1="186" x2="208" y2="186" stroke="#cfa962" stroke-width="1.5"/>' +
        '<text x="30" y="102" fill="#e0f2fe" font-size="11" font-weight="600">10.0 mm Tempered</text>' +
        '<text x="228" y="82" fill="#ffffff" font-size="14" font-weight="600">10 mm Frameless Architectural</text>' +
        '<text x="228" y="104" fill="#7dd3fc" font-size="12">Precision CNC-polished edges &amp; hardware cutouts</text>' +
        '<text x="228" y="124" fill="#8b95a7" font-size="11.5">Frameless showers, entry doors &amp; splashbacks</text>' +
        '</svg>'
    },
    igu24: {
      title: '24mm Argon Low-E Insulated Glass Unit (6mm + 12mm Argon + 6mm)',
      safety: 'Grade A + NatHERS Thermal Spec',
      safetyColor: '#34d399',
      acoustic: '39 dB Rw Acoustic Isolation',
      thermal: '1.6 W/m²K (-64% Heat Loss)',
      uv: '99% UV &amp; IR Coating',
      svg: '<svg viewBox="0 0 440 200" width="100%" height="100%" font-family="Outfit, Plus Jakarta Sans, sans-serif">' +
        '<rect x="150" y="22" width="15" height="156" rx="2" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" stroke-width="1.5"/>' +
        '<rect x="167" y="22" width="34" height="156" fill="rgba(207,169,98,0.09)" stroke="#cfa962" stroke-dasharray="3 3"/>' +
        '<rect x="203" y="22" width="15" height="156" rx="2" fill="rgba(207,169,98,0.28)" stroke="#edd6a6" stroke-width="1.5"/>' +
        '<rect x="167" y="164" width="34" height="14" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>' +
        '<text x="169" y="102" fill="#edd6a6" font-size="9.5" font-weight="600">Argon</text>' +
        '<text x="234" y="78" fill="#ffffff" font-size="14" font-weight="600">12 mm Sealed Argon Cavity</text>' +
        '<text x="234" y="100" fill="#edd6a6" font-size="12">Retrofits existing Melbourne timber &amp; Al frames</text>' +
        '<text x="234" y="120" fill="#34d399" font-size="11.5">Eliminates condensation &amp; arterial road noise</text>' +
        '</svg>'
    }
  };

  function initGlassSimulator() {
    const shell = document.getElementById('glassSimulator');
    if (!shell) return;

    const btns = Array.from(shell.querySelectorAll('.sim-tab-btn'));
    const canvasBox = document.getElementById('simCanvasBox');
    const titleEl = document.getElementById('simSpecTitle');
    const safetyEl = document.getElementById('simMetricSafety');
    const acousticEl = document.getElementById('simMetricAcoustic');
    const thermalEl = document.getElementById('simMetricThermal');
    const uvEl = document.getElementById('simMetricUv');

    function renderSim(key) {
      const d = SIM_DATA[key] || SIM_DATA.lam638;
      btns.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-sim') === key);
      });
      if (canvasBox) canvasBox.innerHTML = d.svg;
      if (titleEl) titleEl.textContent = d.title;
      if (safetyEl) {
        safetyEl.textContent = d.safety;
        safetyEl.style.color = d.safetyColor;
      }
      if (acousticEl) acousticEl.textContent = d.acoustic;
      if (thermalEl) thermalEl.textContent = d.thermal;
      if (uvEl) uvEl.innerHTML = d.uv;
    }

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        renderSim(btn.getAttribute('data-sim'));
      });
    });
    renderSim('lam638');
  }

  /* ------------------------------------------------------------------------
     7. BEFORE / AFTER SLIDER & PROJECT FILTER
     ------------------------------------------------------------------------ */
  function initBeforeAfterAndGallery() {
    document.querySelectorAll('.ba-slider').forEach(function (slider) {
      const range = slider.querySelector('.ba-range');
      const beforeWrap = slider.querySelector('.ba-before-wrap');
      const handle = slider.querySelector('.ba-handle');
      if (!range || !beforeWrap || !handle) return;

      function syncSlider() {
        const val = range.value + '%';
        beforeWrap.style.width = val;
        handle.style.left = val;
      }
      range.addEventListener('input', syncSlider);
      syncSlider();
    });

    const filterBtns = Array.from(document.querySelectorAll('.filter-btn[data-filter]'));
    const projectCards = Array.from(document.querySelectorAll('.project-card'));
    if (filterBtns.length && projectCards.length) {
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const cat = btn.getAttribute('data-filter') || 'all';
          filterBtns.forEach(function (b) { b.classList.toggle('active', b === btn); });
          projectCards.forEach(function (card) {
            const c = card.getAttribute('data-cat') || '';
            card.classList.toggle('hidden', !(cat === 'all' || c.indexOf(cat) !== -1));
          });
        });
      });
    }
  }

  /* ------------------------------------------------------------------------
     8. QUOTE FORM + PHOTO PREVIEW + DISPATCH ROUTING
     ------------------------------------------------------------------------ */
  function initQuoteForm() {
    const form = document.getElementById('flagshipQuoteForm');
    if (!form) return;

    const fileInput = document.getElementById('quotePhotoInput');
    const dropzone = document.getElementById('photoDropzone');
    const previewRow = document.getElementById('photoPreviewRow');
    const successBanner = document.getElementById('formSuccessBanner');
    let attachedFilesCount = 0;

    function handleFiles(files) {
      if (!previewRow || !files) return;
      previewRow.innerHTML = '';
      attachedFilesCount = files.length;
      Array.from(files).slice(0, 4).forEach(function (file) {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
          const img = document.createElement('img');
          img.src = ev.target.result;
          img.alt = 'Attached job photo preview';
          img.className = 'photo-thumb';
          previewRow.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () { handleFiles(fileInput.files); });
      dropzone.addEventListener('dragover', function (e) { e.preventDefault(); });
      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = (document.getElementById('quoteNameInput') || {}).value || '';
      const phone = (document.getElementById('quotePhoneInput') || {}).value || '';
      const email = (document.getElementById('quoteEmailInput') || {}).value || '';
      const suburb = (document.getElementById('quoteSuburbInput') || {}).value || '';
      const service = (document.getElementById('quoteServiceSelect') || {}).value || 'General Enquiry';
      const details = (document.getElementById('quoteDetailsInput') || {}).value || '';

      const isGlazing = document.body.classList.contains('theme-glazing');
      const targetEmail = isGlazing ? 'david@originalglazing.com.au' : 'info@originalpropertygroup.com.au';
      const refCode = (isGlazing ? 'OG-247-' : 'OPG-MEL-') + String(Math.floor(1000 + Math.random() * 9000));

      const subject = '[' + refCode + '] Melbourne Quote Request: ' + service + ' — ' + suburb;
      const bodyLines = [
        'Dispatch Reference: ' + refCode,
        'Client / Agency: ' + name,
        'Phone: ' + phone,
        'Email: ' + email,
        'Melbourne Suburb: ' + suburb,
        'Division Required: ' + service,
        'Photos Selected: ' + attachedFilesCount,
        '',
        'Scope & Measurements:',
        details
      ].join('\n');

      const mailtoHref = 'mailto:' + targetEmail +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines);
      const waHref = 'https://wa.me/' + DISPATCH_WA_INTL + '?text=' + encodeURIComponent(bodyLines);

      if (successBanner) {
        successBanner.innerHTML =
          '<strong style="font-family:var(--font-display);font-size:15px;letter-spacing:0.03em;">Priority Reference Ready: ' + refCode + '</strong><br>' +
          'Thank you, <strong>' + name.replace(/[<>&"]/g, '') + '</strong>. Choose your preferred channel below to send directly to David\'s Melbourne desk' +
          (attachedFilesCount > 0 ? ' (attach your ' + attachedFilesCount + ' selected photo(s)):' : ':') +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">' +
          '<a href="' + waHref + '" target="_blank" rel="noopener" class="btn btn-accent">Send via WhatsApp</a>' +
          '<a href="' + mailtoHref + '" class="btn btn-outline">Send via Email (' + targetEmail + ')</a>' +
          '<a href="tel:0411946933" class="btn btn-emergency">Call 24/7: ' + DISPATCH_PHONE_DISPLAY + '</a>' +
          '</div>';
        successBanner.classList.add('visible');
        successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  /* ------------------------------------------------------------------------
     9. CONCIERGE & AUDIT VERIFICATION DRAWER
     ------------------------------------------------------------------------ */
  function initHudModals() {
    const toggleBtn = document.getElementById('aiConciergeBtn');
    const win = document.getElementById('aiConciergeWindow');
    const closeBtn = document.getElementById('aiConciergeClose');
    const msgs = document.getElementById('aiConciergeMsgs');

    if (toggleBtn && win && msgs) {
      toggleBtn.addEventListener('click', function () { win.classList.toggle('open'); });
      if (closeBtn) closeBtn.addEventListener('click', function () { win.classList.remove('open'); });

      const ANSWERS = {
        emergency: '<strong>24/7 Melbourne Dispatch:</strong> Mobile glazing and make-safe technicians operate 24 hours a day, 7 days a week across Greater Melbourne. Call <a href="tel:0411946933" style="color:var(--accent-light);text-decoration:underline;">0411 946 933</a> for immediate attendance.',
        as1288: '<strong>AS1288:2021 Certification:</strong> Every 6.38mm laminated, 10mm toughened, and double-glazed panel strictly complies with Australian Standard AS1288. Full tax invoices (ABN 27 564 832 883) and site photos are supplied for insurers and strata.',
        discounts: '<strong>Concessions &amp; Commercial Accounts:</strong> Dedicated pricing applies for Pensioner Concession Card holders, NDIS participants, real estate property managers, and ongoing body corporate accounts.',
        trades: '<strong>8 Coordinated Divisions:</strong> Original Property Group unifies 24/7 Glazing (Original Glazing), Roofing &amp; Gutters, Plumbing, Licensed Electrical, Carpentry, Painting &amp; Caulking, Renovations, and Strata Care under one ABN.'
      };

      document.querySelectorAll('.c-quick-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const topic = btn.getAttribute('data-topic') || 'emergency';
          const uDiv = document.createElement('div');
          uDiv.className = 'c-msg user';
          uDiv.textContent = btn.textContent;
          msgs.appendChild(uDiv);

          const bDiv = document.createElement('div');
          bDiv.className = 'c-msg bot';
          bDiv.innerHTML = ANSWERS[topic] || ANSWERS.emergency;
          msgs.appendChild(bDiv);
          msgs.scrollTop = msgs.scrollHeight;
        });
      });
    }

    const pill = document.getElementById('auditVerifiedPill');
    const drawer = document.getElementById('auditDrawer');
    const drawerClose = document.getElementById('auditDrawerClose');
    if (pill && drawer) {
      pill.addEventListener('click', function () { drawer.classList.add('open'); });
      if (drawerClose) drawerClose.addEventListener('click', function () { drawer.classList.remove('open'); });
      drawer.addEventListener('click', function (e) { if (e.target === drawer) drawer.classList.remove('open'); });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initArchitecturalCanvas();
    initChoreographyAndSpotlights();
    initCleanModeAndNav();
    initOpgEstimator();
    initGlazingCalculator();
    initGlassSimulator();
    initBeforeAfterAndGallery();
    initQuoteForm();
    initHudModals();
  });
})();
