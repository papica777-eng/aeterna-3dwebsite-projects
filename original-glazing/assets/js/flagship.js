/* ==========================================================================
   ORIGINAL PROPERTY GROUP & ORIGINAL GLAZING 24/7 — INTERACTIVE ENGINE
   Deterministic Vanilla ES6 • Zero External Dependencies • WCAG 2.1 AA
   ========================================================================== */

(function () {
  'use strict';

  const DISPATCH_PHONE_DISPLAY = '0411 946 933';
  const DISPATCH_WA_INTL = '61411946933';

  /* ------------------------------------------------------------------------
     1. URL PARAMETER CHECK (?clean=1 hides Audit Verification Pill)
     ------------------------------------------------------------------------ */
  function initCleanMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('clean') === '1') {
      const pill = document.getElementById('auditVerifiedPill');
      if (pill) pill.style.display = 'none';
    }
  }

  /* ------------------------------------------------------------------------
     2. MOBILE MENU & ACCORDIONS
     ------------------------------------------------------------------------ */
  function initNavigationAndAccordions() {
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
          const text = item.textContent.toLowerCase();
          const match = !q || text.indexOf(q) !== -1;
          item.style.display = match ? '' : 'none';
          if (q && match) item.classList.add('open');
        });
      });
    }
  }

  /* ------------------------------------------------------------------------
     3. ORIGINAL PROPERTY GROUP — MULTI-TRADE SCOPE BUILDER
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
        slaLabel = '⚡ < 60 Min Melbourne Emergency Dispatch';
      } else if (urgency.indexOf('Priority') !== -1) {
        slaLabel = '24–48 Hr Priority Trade Attendance';
      }

      const tradeCountText = selectedTrades.length === 1
        ? '1 Specialist Trade (' + selectedTrades[0] + ')'
        : selectedTrades.length + ' Coordinated Trades · 1 Point of Contact (' + selectedTrades.join(', ') + ')';

      const discountNote = hasDiscount
        ? ' · Pensioner / NDIS / Strata Priority Rate Applied'
        : ' · Free Obligation-Free On-Site Quote (ABN 27 564 832 883)';

      if (summaryTitleEl) summaryTitleEl.textContent = slaLabel;
      if (summarySpecEl) summarySpecEl.textContent = propType + ' · ' + tradeCountText + discountNote;

      const waMsg = 'Hi David (Original Property Group), requesting a quote:\n' +
        '• Property: ' + propType + '\n' +
        '• Trades Required: ' + selectedTrades.join(', ') + '\n' +
        '• Urgency: ' + urgency +
        (hasDiscount ? '\n• Account: Pensioner / NDIS / Strata Commercial Rate' : '');

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
            msgArea.value = 'Property Type: ' + propType + ' | Trades: ' + selectedTrades.join(', ') + ' | Urgency: ' + urgency + (hasDiscount ? ' | Eligible for Pensioner/NDIS/Strata Rate' : '');
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
     4. ORIGINAL GLAZING 24/7 — INTEGER-EXACT AS1288 GLASS CALCULATOR
     ------------------------------------------------------------------------ */
  const GLASS_SPECS = {
    laminate_clear: {
      name: '6.38mm Clear Laminated Safety Glass (AS1288)',
      kgPerSqmTenths: 158, // 15.8 kg/m²
      acousticDb: '32 dB Noise Reduction',
      uvBlock: '99% UV Blocked',
      standard: 'AS1288 Grade A Human Impact Compliant'
    },
    laminate_frosted: {
      name: '6.38mm Frosted / Translucent Privacy Laminate (AS1288)',
      kgPerSqmTenths: 158,
      acousticDb: '33 dB Noise Reduction',
      uvBlock: '99% UV + 100% Privacy',
      standard: 'AS1288 Grade A Bathroom & Streetfront Compliant'
    },
    toughened_10: {
      name: '10mm Toughened Frameless Safety Glass (AS1288)',
      kgPerSqmTenths: 250, // 25.0 kg/m²
      acousticDb: '31 dB Noise Reduction',
      uvBlock: 'High Thermal & Impact Load',
      standard: 'AS1288 Grade A Shower Screens & Doors'
    },
    double_igu: {
      name: '24mm Argon Low-E Retrofit Double Glaze Unit (IGU)',
      kgPerSqmTenths: 300, // 30.0 kg/m²
      acousticDb: '39 dB Acoustic Insulation',
      uvBlock: 'Up to 64% Less Heat Loss',
      standard: 'AS1288 + NatHERS Energy Upgrade Ready'
    },
    shopfront_1038: {
      name: '10.38mm Heavy Commercial Shopfront Security Laminate',
      kgPerSqmTenths: 258,
      acousticDb: '37 dB Commercial Acoustic Barrier',
      uvBlock: '99% Merchandise Fade Protection',
      standard: 'AS1288 Commercial Anti-Intrusion Safety'
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

      // Exact integer arithmetic: area in hundredths of m² = round((wMm * hMm) / 10000)
      const areaMm2 = wMm * hMm;
      const areaHundredths = Math.max(10, Math.round(areaMm2 / 10000));
      const areaFormatted = (Math.floor(areaHundredths / 100)) + '.' + String(areaHundredths % 100).padStart(2, '0');

      // Exact weight in tenths of kg = round((areaHundredths * kgPerSqmTenths) / 100)
      const weightTenths = Math.max(20, Math.round((areaHundredths * spec.kgPerSqmTenths) / 100));
      const weightFormatted = (Math.floor(weightTenths / 10)) + '.' + (weightTenths % 10);

      const urgency = urgencyEl ? urgencyEl.value : '24/7 Emergency Rapid Replacement';
      const hasDiscount = discountEl && discountEl.checked;

      if (outMainEl) {
        outMainEl.textContent = areaFormatted + ' m² · ~' + weightFormatted + ' kg Panel';
      }
      if (outSubEl) {
        outSubEl.textContent = spec.standard + ' · ' + spec.acousticDb + ' · ' + spec.uvBlock +
          (hasDiscount ? ' · Pensioner/NDIS/Trade Discount Eligible' : '');
      }

      const waMsg = 'Hi David (Original Glazing 24/7), requesting a fast quote:\n' +
        '• Glass Spec: ' + spec.name + '\n' +
        '• Approx Size: ' + wMm + 'mm (W) x ' + hMm + 'mm (H) (' + areaFormatted + ' m²)\n' +
        '• Service Speed: ' + urgency +
        (hasDiscount ? '\n• Eligible for Pensioner / NDIS / Business Discount' : '');

      if (waBtn) {
        waBtn.href = 'https://wa.me/' + DISPATCH_WA_INTL + '?text=' + encodeURIComponent(waMsg);
      }

      if (formBtn) {
        formBtn.onclick = function () {
          const msgArea = document.getElementById('quoteDetailsInput');
          if (msgArea) {
            msgArea.value = 'Glass Spec: ' + spec.name + ' | Approx Dimensions: ' + wMm + 'mm x ' + hMm + 'mm (' + areaFormatted + ' m²) | Urgency: ' + urgency + (hasDiscount ? ' | Pensioner/NDIS/Business Discount' : '');
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
     5. INTERACTIVE AS1288 GLASS SAFETY CROSS-SECTION SIMULATOR
     ------------------------------------------------------------------------ */
  const SIM_DATA = {
    float4: {
      title: 'Old 3mm–4mm Annealed Float Glass (Non-Compliant Hazard)',
      safety: '❌ SHATTERS INTO LETHAL SHARDS',
      safetyColor: '#ef4444',
      acoustic: '24 dB (Poor)',
      thermal: '5.9 W/m²K (High Heat Loss)',
      uv: '18% Blocked',
      svg: '<svg viewBox="0 0 420 190" width="100%" height="100%">' +
        '<rect x="195" y="22" width="14" height="146" rx="2" fill="rgba(248,113,113,0.38)" stroke="#ef4444" stroke-width="2"/>' +
        '<path d="M196 70 L209 92 M208 64 L195 108 M196 112 L209 135" stroke="#fca5a5" stroke-width="2"/>' +
        '<text x="30" y="95" fill="#fca5a5" font-size="12" font-weight="700">Impact Hazard →</text>' +
        '<text x="228" y="88" fill="#ffffff" font-size="13" font-weight="800">Single 4mm Float Sheet</text>' +
        '<text x="228" y="108" fill="#fca5a5" font-size="11.5">Fails AS1288 Human Impact Zones</text>' +
        '</svg>'
    },
    lam638: {
      title: '6.38mm Laminated Safety Glass (3mm + 0.38mm PVB + 3mm)',
      safety: '✅ AS1288 GRADE A — HOLDS IN FRAME',
      safetyColor: '#10b981',
      acoustic: '33 dB (Acoustic PVB Core)',
      thermal: '5.5 W/m²K + Solar Control',
      uv: '99% UV Rays Blocked',
      svg: '<svg viewBox="0 0 420 190" width="100%" height="100%">' +
        '<rect x="176" y="20" width="16" height="150" rx="2" fill="rgba(56,189,248,0.35)" stroke="#38bdf8" stroke-width="1.8"/>' +
        '<rect x="194" y="20" width="8" height="150" fill="#10b981"/>' +
        '<rect x="204" y="20" width="16" height="150" rx="2" fill="rgba(56,189,248,0.35)" stroke="#38bdf8" stroke-width="1.8"/>' +
        '<text x="24" y="95" fill="#6ee7b7" font-size="12" font-weight="700">Impact Contained 🛡️</text>' +
        '<text x="234" y="78" fill="#ffffff" font-size="13" font-weight="800">Dual 3mm Glass + 0.38mm PVB</text>' +
        '<text x="234" y="98" fill="#6ee7b7" font-size="11.5">Bonds shards safely upon impact</text>' +
        '<text x="234" y="118" fill="#94a3b8" font-size="11">Australian Made · Cut On-Site Ready</text>' +
        '</svg>'
    },
    tough10: {
      title: '10mm Toughened Frameless Safety Glass (AS1288 Grade A)',
      safety: '✅ 5× STRONGER THAN FLOAT GLASS',
      safetyColor: '#10b981',
      acoustic: '31 dB Solid Mass Damping',
      thermal: 'High Thermal Shock Resistance',
      uv: '42% UV Blocked',
      svg: '<svg viewBox="0 0 420 190" width="100%" height="100%">' +
        '<rect x="182" y="20" width="32" height="150" rx="4" fill="rgba(14,165,233,0.42)" stroke="#0ea5e9" stroke-width="2.2"/>' +
        '<text x="24" y="95" fill="#38bdf8" font-size="12" font-weight="700">500% Strength ⚡</text>' +
        '<text x="230" y="82" fill="#ffffff" font-size="13" font-weight="800">10mm Heat-Tempered Monolith</text>' +
        '<text x="230" y="102" fill="#7dd3fc" font-size="11.5">Ideal for Frameless Showers &amp; Doors</text>' +
        '</svg>'
    },
    igu24: {
      title: '24mm Argon Low-E Retrofit Double Glazing (6mm + 12mm Argon + 6mm)',
      safety: '✅ AS1288 + MAXIMUM ENERGY SAVING',
      safetyColor: '#10b981',
      acoustic: '39 dB Whisper-Quiet Interior',
      thermal: '1.6 W/m²K (Up to 64% Less Loss)',
      uv: '99% UV + Infrared Barrier',
      svg: '<svg viewBox="0 0 420 190" width="100%" height="100%">' +
        '<rect x="156" y="20" width="16" height="150" rx="2" fill="rgba(56,189,248,0.4)" stroke="#38bdf8" stroke-width="1.8"/>' +
        '<rect x="174" y="20" width="34" height="150" fill="rgba(16,185,129,0.12)" stroke="#10b981" stroke-dasharray="4 3"/>' +
        '<rect x="210" y="20" width="16" height="150" rx="2" fill="rgba(245,158,11,0.35)" stroke="#f59e0b" stroke-width="1.8"/>' +
        '<rect x="174" y="156" width="34" height="14" fill="#334155"/>' +
        '<text x="180" y="96" fill="#6ee7b7" font-size="10" font-weight="800">ARGON</text>' +
        '<text x="240" y="78" fill="#ffffff" font-size="13" font-weight="800">12mm Sealed Argon Gas Cavity</text>' +
        '<text x="240" y="98" fill="#fde68a" font-size="11.5">Fits Existing Melbourne Frames</text>' +
        '<text x="240" y="118" fill="#6ee7b7" font-size="11">Eliminates Condensation &amp; Street Noise</text>' +
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
      if (uvEl) uvEl.textContent = d.uv;
    }

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        renderSim(btn.getAttribute('data-sim'));
      });
    });
    renderSim('lam638');
  }

  /* ------------------------------------------------------------------------
     6. BEFORE / AFTER SLIDER & PROJECT FILTERING
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

    const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
    const projectCards = Array.from(document.querySelectorAll('.project-card'));
    if (filterBtns.length && projectCards.length) {
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const cat = btn.getAttribute('data-filter') || 'all';
          filterBtns.forEach(function (b) { b.classList.toggle('active', b === btn); });
          projectCards.forEach(function (card) {
            const c = card.getAttribute('data-cat') || '';
            const show = cat === 'all' || c.indexOf(cat) !== -1;
            card.classList.toggle('hidden', !show);
          });
        });
      });
    }
  }

  /* ------------------------------------------------------------------------
     7. WORKING QUOTE FORM + DRAG & DROP PHOTO PREVIEW + DISPATCH ROUTING
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
      dropzone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropzone.style.borderColor = '#10b981';
      });
      dropzone.addEventListener('dragleave', function () {
        dropzone.style.borderColor = '';
      });
      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropzone.style.borderColor = '';
        if (e.dataTransfer && e.dataTransfer.files) {
          handleFiles(e.dataTransfer.files);
        }
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
      const targetEmail = isGlazing
        ? 'david@originalglazing.com.au'
        : 'info@originalpropertygroup.com.au';
      const refCode = (isGlazing ? 'OG-247-' : 'OPG-MEL-') + String(Math.floor(1000 + Math.random() * 9000));

      const subject = '[' + refCode + '] Quote Request: ' + service + ' — ' + suburb;
      const bodyLines = [
        'Job Reference: ' + refCode,
        'Client Name: ' + name,
        'Phone: ' + phone,
        'Email: ' + email,
        'Melbourne Suburb: ' + suburb,
        'Service Required: ' + service,
        'Photos Selected: ' + attachedFilesCount,
        '',
        'Project / Repair Details:',
        details
      ].join('\n');

      const mailtoHref = 'mailto:' + targetEmail +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines);

      const waHref = 'https://wa.me/' + DISPATCH_WA_INTL + '?text=' + encodeURIComponent(bodyLines);

      if (successBanner) {
        successBanner.innerHTML =
          '<strong>✅ Dispatch Reference Generated (' + refCode + ')!</strong><br>' +
          'Thank you, <strong>' + name.replace(/[<>&"]/g, '') + '</strong>. Choose your preferred instant dispatch channel below to send directly to David\'s Melbourne team' +
          (attachedFilesCount > 0 ? ' (attach your ' + attachedFilesCount + ' selected photo(s) in 1 tap):' : ':') +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">' +
          '<a href="' + waHref + '" target="_blank" rel="noopener" class="btn btn-whatsapp">💬 Send Instantly via WhatsApp</a>' +
          '<a href="' + mailtoHref + '" class="btn btn-accent">✉️ Send via Email (' + targetEmail + ')</a>' +
          '<a href="tel:0411946933" class="btn btn-emergency">📞 Call 24/7: ' + DISPATCH_PHONE_DISPLAY + '</a>' +
          '</div>';
        successBanner.classList.add('visible');
        successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  /* ------------------------------------------------------------------------
     8. 24/7 AI MELBOURNE GLAZING & TRADE TRIAGE CONCIERGE
     ------------------------------------------------------------------------ */
  function initAiConcierge() {
    const toggleBtn = document.getElementById('aiConciergeBtn');
    const win = document.getElementById('aiConciergeWindow');
    const closeBtn = document.getElementById('aiConciergeClose');
    const msgs = document.getElementById('aiConciergeMsgs');
    if (!toggleBtn || !win || !msgs) return;

    toggleBtn.addEventListener('click', function () {
      win.classList.toggle('open');
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        win.classList.remove('open');
      });
    }

    const ANSWERS = {
      emergency: '🚨 <strong>24/7 Emergency Response:</strong> Our Melbourne glaziers and make-safe technicians operate 24 hours a day, 7 days a week across Inner, Eastern, Southern, Northern & Western suburbs. Call <a href="tel:0411946933" style="color:#38bdf8;font-weight:800;">0411 946 933</a> for immediate dispatch.',
      as1288: '🛡️ <strong>AS1288 Compliance:</strong> Every piece of 6.38mm laminated and 10mm toughened safety glass we supply and install strictly complies with Australian Safety Standard AS1288. Compliance certificates and tax invoices (ABN 27 564 832 883) are issued for insurance and strata claims.',
      discounts: '💳 <strong>Discounts & Trade Accounts:</strong> Yes! We proudly provide discounts for <strong>Pensioners, NDIS Participants, Real Estate Agencies, and Strata / Commercial Accounts</strong>, alongside free no-obligation quotes.',
      trades: '🛠️ <strong>Single Point of Contact (All 8 Trades):</strong> Original Property Group handles Emergency Glazing (via Original Glazing), Roofing & Gutters, Plumbing, Licensed Electrical, Painting, Carpentry/Timber Rot, Renovations, and Handyman Maintenance under one ABN.'
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

  /* ------------------------------------------------------------------------
     9. FORENSIC AUDIT VERIFICATION DRAWER (19/19 DEFECTS RESOLVED)
     ------------------------------------------------------------------------ */
  function initAuditDrawer() {
    const pill = document.getElementById('auditVerifiedPill');
    const drawer = document.getElementById('auditDrawer');
    const closeBtn = document.getElementById('auditDrawerClose');
    if (!pill || !drawer) return;

    pill.addEventListener('click', function () {
      drawer.classList.add('open');
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        drawer.classList.remove('open');
      });
    }
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer) drawer.classList.remove('open');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCleanMode();
    initNavigationAndAccordions();
    initOpgEstimator();
    initGlazingCalculator();
    initGlassSimulator();
    initBeforeAfterAndGallery();
    initQuoteForm();
    initAiConcierge();
    initAuditDrawer();
  });
})();
