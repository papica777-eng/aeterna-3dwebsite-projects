/* ============================================================================
 * AETERNA COSMOS x STELLARIUM WEB ENGINE (C/C++/ERFA/WebGL2/NanoVG WASM)
 * Engine runtime: Stellarium Web Engine (GNU AGPL v3, ./LICENSE-AGPL-3.0.txt)
 * Commercial Showcase & 3D Observatory HUD: AETERNA Technologies EOOD
 * ============================================================================ */
(function () {
  'use strict';

  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;

  // --------------------------------------------------------------------------
  // 1. CATALOG OF 15 BUSINESS WORLDS & 6 MILLENNIUM 8K/3D STUDIOS
  // --------------------------------------------------------------------------
  const WEBSITE_PLANETS = [
    {
      id: 'vulcan-trades',
      name: 'Planet Vulcan // Trades & Services',
      shortName: 'Trades & Dispatch 24/7',
      niche: 'Plumbers, Electricians, Roofers, Builders, Glaziers',
      cat: 'trades',
      azDeg: 25, altDeg: 18, color: 0xf59e0b, hex: '#f59e0b', glow: 0xfbbf24, radius: 1.45, hasRing: false,
      speed: '0.3s',
      priceLabel: '$495 Base Launchpad',
      priceSub: '+ Optional SEO & Calculator Add-ons',
      url: './demos/trades.html',
      externalUrl: './demos/trades.html',
      isCustomizable: true,
      desc: 'Obsidian-and-gold digital flagship tailored for high-margin trade businesses. Stops losing emergency call-outs on Google with 1-tap phone routing and interactive scope pre-qualification.',
      features: [
        'Instant 24/7 Emergency Call Routing & Intake Terminal',
        'Interactive m2 / Scope Estimator (Add-on)',
        'VBA / Licensing Compliance Plaques & Local Suburb Coverage',
        'Dynamic Brand Injection: Enter your name in the Left Drawer'
      ]
    },
    {
      id: 'olivine-hospitality',
      name: 'Planet Olivine // Hospitality & Cafes',
      shortName: 'Cafes, Restaurants & Bakeries',
      niche: 'Artisan Cafes, Restaurants, Wine Bars, Boutiques',
      cat: 'hospitality',
      azDeg: 68, altDeg: 26, color: 0x63b292, hex: '#63b292', glow: 0xd4f23b, radius: 1.35, hasRing: false,
      speed: '0.4s',
      priceLabel: '$495 Base Launchpad',
      priceSub: 'Warm Cream & Sage Editorial Edition',
      url: './demos/hospitality.html',
      externalUrl: './demos/hospitality.html',
      isCustomizable: true,
      desc: 'Fresh warm editorial aesthetic (#f7f4ee Ivory Cream + Sage Green + Poppins). Engineered for cafes, artisan bakeries, and restaurants seeking zero-commission direct table reservations.',
      features: [
        'Zero-Commission Direct Table Reservation Engine',
        'Clean Seasonal Menu & Signature Dish Showcase',
        'Warm Editorial Readability Inspired by Top SaaS Studios',
        'Dynamic Brand Injection from the Left Drawer'
      ]
    },
    {
      id: 'anchialo-ecommerce',
      name: 'Planet Anchialo // Global E-Commerce',
      shortName: 'Multi-Currency E-Commerce',
      niche: 'Retail Brands, Wellness, Cosmetics, Apothecary',
      cat: 'ecommerce',
      azDeg: 112, altDeg: 22, color: 0x10b981, hex: '#10b981', glow: 0x34d399, radius: 1.65, hasRing: true,
      speed: '0.35s',
      priceLabel: '$8,900 Turnkey Store',
      priceSub: '0% Shopify Fees Forever (Live Client Site)',
      url: 'https://anchialo.com',
      externalUrl: 'https://anchialo.com',
      isCustomizable: false,
      isExternal: true,
      liveTag: 'LIVE',
      desc: 'Production-proven international store (LIVE at anchialo.com). Features 4-currency real-time pricing (AUD/USD/EUR/BGN), 300 DPI label inspection, and automated ATO GST tax invoicing.',
      features: [
        'LIVE Client Flagship (anchialo.com) — Click Launch or Open Tab',
        '4-Currency Dynamic Engine & Automated Courier Barcodes',
        'Zero Monthly Shopify or SaaS Percentage Cuts',
        '100% Source Code & Intellectual Property Transfer'
      ]
    },
    {
      id: 'cptmma-academy',
      name: 'Planet CPT MMA // Sports & Coaching',
      shortName: 'Academies & Video Vaults',
      niche: 'Combat Academies, Gyms, Online Coaching Portals',
      cat: 'sports',
      azDeg: 158, altDeg: 32, color: 0xef4444, hex: '#ef4444', glow: 0xfca5a5, radius: 1.55, hasRing: false,
      speed: '0.4s',
      priceLabel: '$4,900 Portal Build',
      priceSub: '40-Lesson Encrypted Vault (Live Site)',
      url: 'https://cptmma.com',
      externalUrl: 'https://cptmma.com',
      isCustomizable: false,
      isExternal: true,
      liveTag: 'LIVE',
      desc: 'Live dual-division sports academy and encrypted 40-lesson HD training vault engineered for ONE Championship veteran Sotir Kichukov in Melbourne, with PayID & PayPal checkout.',
      features: [
        'LIVE Client Flagship (cptmma.com) — Streaming Video Portal',
        'VIP Member Access Codes & Encrypted Lesson Protection',
        'Integrated Merchandise Checkout & Training Timetable',
        'Dual-Division Brand Architecture (Combat + Canine K9)'
      ]
    },
    {
      id: 'immersion-apparel',
      name: 'Planet Immersion // 3D Apparel & Gym',
      shortName: '3D Interactive Store & Academy',
      niche: 'Martial Arts Clubs, Streetwear, Fitness Studios',
      cat: 'sports',
      azDeg: 200, altDeg: 16, color: 0x06b6d4, hex: '#06b6d4', glow: 0x67e8f9, radius: 1.38, hasRing: false,
      speed: '0.38s',
      priceLabel: '$4,900 Spatial Portal',
      priceSub: 'Hosted Live on paas.website/immersion-mma',
      url: './immersion-mma/index.html',
      externalUrl: './immersion-mma/index.html',
      isCustomizable: false,
      liveTag: '3D',
      desc: 'Multi-page combat sports flagship featuring interactive 3D gear visualization, class timetables (BJJ, Muay Thai, Kids Bullyproof), and automated trial bookings.',
      features: [
        'Live Multi-Page Portal Built Directly on Bare Metal',
        'Interactive 3D Rashguard & Compression Gear Simulator',
        'Direct Student & Trial Membership Lead Capture',
        'Sub-0.4s Instant Page Transitions'
      ]
    },
    {
      id: 'helios-clinic',
      name: 'Planet Helios // Clinics & Aesthetics',
      shortName: 'Medical, Dental & Beauty',
      niche: 'Dental Practices, Cosmetic Clinics, Hair & Spa',
      cat: 'clinic',
      azDeg: 245, altDeg: 28, color: 0x38bdf8, hex: '#38bdf8', glow: 0xbae6fd, radius: 1.4, hasRing: true,
      speed: '0.32s',
      priceLabel: '$495 Base Launchpad',
      priceSub: 'or $1,500 Express Multi-Page Practice',
      url: './demos/clinic.html',
      externalUrl: './demos/clinic.html',
      isCustomizable: true,
      desc: 'Crisp Swiss clinical precision design. Eliminates HotDoc/booking aggregator commissions with direct encrypted patient intake forms and diagnostic clarity.',
      features: [
        'Encrypted Zero-Bloat Patient Appointment Request Console',
        'AHPRA / GDPR Trust Badges & Treatment Specialization',
        'Zero Third-Party Booking Commissions Per Patient',
        'Dynamic Practice Name & City Hydration from Left Drawer'
      ]
    },
    {
      id: 'themis-legal',
      name: 'Planet Themis // Legal & Sovereign AI',
      shortName: 'Law Firms & SaaS Utilities',
      niche: 'Lawyers, Financial Advisors, Tax & Civic Portals',
      cat: 'clinic',
      azDeg: 290, altDeg: 20, color: 0xc5a34e, hex: '#c5a34e', glow: 0xfef08a, radius: 1.48, hasRing: true,
      speed: '0.25s',
      priceLabel: '$1,500 – $2,800',
      priceSub: 'Client-Side Zero-Leakage Architecture',
      url: './lex/index.html',
      externalUrl: './lex/index.html',
      isCustomizable: false,
      liveTag: 'LIVE',
      desc: 'Live production legal engine (paas.website/lex/) demonstrating zero-latency client-side document synthesis, statutory fee calculation, and cryptographic privacy.',
      features: [
        'LIVE Client-Side Legal Automation System (13 Active Modules)',
        'Instant Fee Calculators & Print-Ready PDF Synthesis',
        '100% Local Privacy Architecture — Zero Server Data Leakage',
        'Deployable as Bespoke Firm Portal or Client Intake Tool'
      ]
    },
    {
      id: 'vance-luxury-estate',
      name: 'Planet Vance // Real Estate & Luxury',
      shortName: 'Real Estate, Auto & Wealth',
      niche: 'Luxury Property, Developers, Family Offices, Supercar Dealers',
      cat: 'luxury',
      azDeg: 332, altDeg: 34, color: 0xa855f7, hex: '#a855f7', glow: 0xe9d5ff, radius: 1.5, hasRing: false,
      speed: '0.45s',
      priceLabel: '$4,900 Spatial Luxury',
      priceSub: 'Interactive 3D WebGL Portfolio',
      url: './demos/luxury-estate.html',
      externalUrl: './demos/luxury-estate.html',
      isCustomizable: true,
      desc: 'Architectural obsidian showcase featuring a live WebGL2 procedural gold geometry core, portfolio mandate cards, and VIP consultation routing.',
      features: [
        'Live Interactive Three.js 3D Monolith & Geometric Grid',
        'Cormorant Garamond Haute Horlogerie Editorial Design',
        'Private Mandate Cards ($8M–$15M Architectural Portfolio)',
        'Custom Brand Injection from Left Drawer Controls'
      ]
    },
    {
      id: 'aeterna-flagship',
      name: 'Solaris Core // AETERNA Classic Studio',
      shortName: 'Flagship Agency & 3D R&D',
      niche: 'All Custom Flagships, 3D Shaders, Enterprise Commissions',
      cat: 'luxury',
      azDeg: 38, altDeg: 38, color: 0xfde047, hex: '#fde047', glow: 0xffffff, radius: 1.9, hasRing: true,
      speed: '0.3s',
      priceLabel: '$1,500 – $8,900',
      priceSub: 'Full 4-Step Engineering & IP Transfer',
      url: './classic/index.html',
      externalUrl: './classic/index.html',
      isCustomizable: false,
      liveTag: 'HUB',
      desc: 'Solar flagship core housing the classic AETERNA DIGITAL agency studio showcase, Biomechanical Chameleon engine, and 3D Tourbillon R&D lab.',
      features: [
        'Direct Portal to Classic Studio View (/classic/)',
        'Bespoke Stripe, PayPal & Corporate IBAN Checkout Tiers',
        '3D Spatial WebGL Sandboxes & Liquid Gold Shaders',
        'Bilateral NDA & Permanent Intellectual Property Transfer'
      ]
    },
    {
      id: 'millennium-vortex',
      name: 'Nova Vortex // 8K Liquid Gold Shader',
      shortName: 'Procedural 8K Gold Vortex',
      niche: 'Luxury Interactive Backgrounds, Flagship Brand Portals',
      cat: 'labs',
      azDeg: 52, altDeg: 44, color: 0xfbbf24, hex: '#fbbf24', glow: 0xfef08a, radius: 1.42, hasRing: true,
      speed: '60 FPS',
      priceLabel: '$4,900 Spatial Shader',
      priceSub: 'Native Per-Pixel WebGL GPU Engine',
      url: './studios/liquid-vortex.html',
      externalUrl: './studios/liquid-vortex.html',
      isCustomizable: false,
      liveTag: '8K GLSL',
      desc: 'Millennium Studio Engine (37_AETERNA_3D_SOVEREIGN_STUDIO): renders liquid 24K gold and black-lacquer spiral ribbons, ACES filmic bokeh spheres, and scroll-reactive stardust mathematically on every pixel.',
      features: [
        'Resolution-Independent GPU Fragment Shader (1080p / 4K / 8K)',
        'Cursor Parallax & Scroll-Driven Spiral Twist API',
        'Zero Video File Downloads (~12 KB Total Engine Payload)',
        'Click Launch Interactive Website for Fullscreen 8K Studio'
      ]
    },
    {
      id: 'millennium-8k-raymarch',
      name: 'Kintsugi Prime // 8K HDR Raymarcher',
      shortName: '8K HDR Multi-Pass Studio',
      niche: 'Jewellery, Architecture, Spatial Flagship Showcases',
      cat: 'labs',
      azDeg: 118, altDeg: 48, color: 0xf59e0b, hex: '#f59e0b', glow: 0xfde047, radius: 1.52, hasRing: true,
      speed: 'WebGL2 HDR',
      priceLabel: '$4,900 – $8,900',
      priceSub: '5 SDF Manifolds + 7680x4320 PNG Exporter',
      url: './studios/8k-raymarch.html',
      externalUrl: './studios/8k-raymarch.html',
      isCustomizable: false,
      liveTag: '8K HDR',
      desc: 'Full WebGL2 RGBA16F HDR raymarching engine featuring Cook-Torrance GGX shading, 1-bounce reflections, separable anamorphic bloom, FXAA, and native 4x4 RGSS tiled 8K PNG export.',
      features: [
        '5 Live Switchable SDF Geometries (Kintsugi Torus, Knot, SU(3), Helix, Crystal DNA)',
        'Real-Time Gold Vein Density, Relief Height & Exposure Sliders',
        'True 7680x4320 (8K DCI) Client-Side Tiled PNG Export',
        'Optional Live Rust Kernel Telemetry Hook'
      ]
    },
    {
      id: 'millennium-cad-studio',
      name: 'Orion CAD // Exploded Thin-Film 3D',
      shortName: '3D Optical & CAD Studio',
      niche: 'Manufacturing, Aerospace, Biotech Hardware Configurators',
      cat: 'labs',
      azDeg: 184, altDeg: 44, color: 0x38bdf8, hex: '#38bdf8', glow: 0x7dd3fc, radius: 1.44, hasRing: false,
      speed: 'Three r170',
      priceLabel: '$4,900 Spatial CAD',
      priceSub: 'Snell Dispersion, Section Cut & GLB Export',
      url: './studios/cad-studio.html',
      externalUrl: './studios/cad-studio.html',
      isCustomizable: false,
      liveTag: '3D CAD',
      desc: 'Real-time Three.js r170 exploded-assembly CAD configurator with thin-film optical iridescence, Snell refractive dispersion, cross-section slicing, UnrealBloom, and binary GLB export.',
      features: [
        'Interactive Exploded CMOS & Optical Sensor Assembly',
        'Real-Time Section Cut Slicing & Physical Iridescence',
        'One-Click Binary .GLB 3D Mesh & 4K Snapshot Export',
        'Embeddable Directly Into Product E-Commerce Pages'
      ]
    },
    {
      id: 'millennium-particle-field',
      name: 'Pulsar Vector // 3D Particle Dynamics',
      shortName: 'Quantum Particle Vector Field',
      niche: 'FinTech, SaaS Telemetry, AI Startups, Interactive Heroes',
      cat: 'labs',
      azDeg: 252, altDeg: 46, color: 0xf43f5e, hex: '#f43f5e', glow: 0xfda4af, radius: 1.36, hasRing: false,
      speed: '0.35s',
      priceLabel: '$2,800 Pro Interactive',
      priceSub: 'Three.js GPU Vector Field + Live KaTeX HUD',
      url: './studios/dynamical-field.html',
      externalUrl: './studios/dynamical-field.html',
      isCustomizable: false,
      liveTag: 'WEBGL',
      desc: 'Real-time WebGL particle flow field and dynamical phase-space visualizer from the Millennium engine suite — engineered for SaaS dashboards, interactive hero canvases, and live telemetry.',
      features: [
        'Real-Time GPU Vector Attractor & Particle Trajectories',
        'Interactive Parameter Controls & Orbit Inspection',
        'Integrated KaTeX Mathematical Overlay Panel',
        'Zero Server Overhead — Pure Client-Side WebGL'
      ]
    },
    {
      id: 'millennium-spectral-wilson',
      name: 'Wilsonian Halo // 3D Spectral Lattice',
      shortName: 'Spectral & Lattice Visualizer',
      niche: 'Deep-Tech R&D, Cybersecurity, Data Platforms',
      cat: 'labs',
      azDeg: 315, altDeg: 50, color: 0xa855f7, hex: '#a855f7', glow: 0xd8b4fe, radius: 1.40, hasRing: true,
      speed: '0.30s',
      priceLabel: '$2,800 Pro 3D Dashboard',
      priceSub: 'WebGL2 3D Spectral Matrix & Topology HUD',
      url: './studios/spectral-wilson.html',
      externalUrl: './studios/spectral-wilson.html',
      isCustomizable: false,
      liveTag: '3D SU(3)',
      desc: 'Live 3D WebGL2 Wilson Plaquette and eigenvalue spectrum explorer ported straight from AETERNA Millennium visualizations — ideal for analytical dashboards and enterprise R&D portals.',
      features: [
        'Interactive 3D Eigenvalue & Plaquette Manifold Mesh',
        'Dark Glassmorphic Telemetry HUD Overlay',
        'Responsive Camera Orbit & Live Mode Switching',
        'Ready for Live API / SSE / WebSocket Telemetry Feeds'
      ]
    },
    {
      id: 'millennium-thom-cusp',
      name: 'Catastrophe Cusp // 3D Coherence Engine',
      shortName: 'Thom Cusp 3D Explorer',
      niche: 'Quant Finance, Biotech SaaS, Complex Systems Analytics',
      cat: 'labs',
      azDeg: 86, altDeg: 58, color: 0x10b981, hex: '#10b981', glow: 0x6ee7b7, radius: 1.34, hasRing: false,
      speed: '0.28s',
      priceLabel: '$2,800 Analytics WebApp',
      priceSub: 'Interactive 3D Catastrophe Surface Simulator',
      url: './studios/thom-cusp.html',
      externalUrl: './studios/thom-cusp.html',
      isCustomizable: false,
      liveTag: '3D SCI',
      desc: 'Interactive 3D Thom Cusp catastrophe surface and Sovereign Coherence (SCI = 0.2314) explorer rendered smoothly in Three.js for high-stakes scientific and SaaS data visualization.',
      features: [
        'Real-Time 3D Bifurcation Manifold & Control Trajectory',
        'Zero-Bloat Single-File Deployment Architecture (20 KB)',
        'Full OrbitControls Inspection & Custom Color Grading',
        'Deployable as Standalone Micro-App or Embedded Widget'
      ]
    }
  ];

  // Category Icon Badges for Inspector Header (pure flat UI — no 3D spheres)
  const CAT_GLYPHS = {
    trades: '⚡',
    hospitality: '☕',
    ecommerce: '💎',
    sports: '🥊',
    clinic: '⚖️',
    luxury: '🏛️',
    labs: '🔮'
  };

  // Observatory Locations
  const OBSERVATORY_PRESETS = [
    { key: 'melbourne', name: 'Melbourne Observatory', lat: -37.8136, lon: 144.9631, elev: 31, tag: 'AU' },
    { key: 'sofia', name: 'Sofia // Vitosha Ridge', lat: 42.6977, lon: 23.3219, elev: 590, tag: 'BG' },
    { key: 'atacama', name: 'Atacama Paranal Dark Sky', lat: -24.6275, lon: -70.4045, elev: 2635, tag: 'Bortle 1' },
    { key: 'london', name: 'London // Greenwich Meridian', lat: 51.4779, lon: -0.0015, elev: 47, tag: 'UK' },
    { key: 'nyc', name: 'New York // Hudson Sky', lat: 40.7128, lon: -74.0060, elev: 15, tag: 'US' },
    { key: 'tokyo', name: 'Tokyo // Mitaka', lat: 35.6752, lon: 139.5391, elev: 58, tag: 'JP' }
  ];

  // Indexed Celestial Quick-Lookup Names (verified against Stellarium catalog)
  const CELESTIAL_CATALOG = [
    { query: 'NAME Moon', name: 'The Moon', sub: 'Natural Satellite of Earth', tag: 'Solar Sys' },
    { query: 'NAME Jupiter', name: 'Jupiter', sub: 'Gas Giant + Galilean Moons', tag: 'Planet' },
    { query: 'NAME Saturn', name: 'Saturn', sub: 'Ringed Giant + Titan', tag: 'Planet' },
    { query: 'NAME Venus', name: 'Venus', sub: 'Morning / Evening Star', tag: 'Planet' },
    { query: 'NAME Mars', name: 'Mars', sub: 'The Red Planet', tag: 'Planet' },
    { query: 'NAME Sun', name: 'The Sun', sub: 'G2V Main-Sequence Star', tag: 'Star' },
    { query: 'NAME Sirius', name: 'Sirius (Alpha CMa)', sub: 'Brightest Star in Night Sky (-1.46 mag)', tag: 'Star' },
    { query: 'NAME Vega', name: 'Vega (Alpha Lyr)', sub: 'Lyra Summer Triangle Anchor', tag: 'Star' },
    { query: 'NAME Betelgeuse', name: 'Betelgeuse (Alpha Ori)', sub: 'Red Supergiant in Orion', tag: 'Star' },
    { query: 'NAME Polaris', name: 'Polaris (Alpha UMi)', sub: 'North Celestial Pole Star', tag: 'Star' },
    { query: 'NAME Canopus', name: 'Canopus (Alpha Car)', sub: 'Second Brightest Star', tag: 'Star' },
    { query: 'M31', name: 'Andromeda Galaxy (M31)', sub: '2.5M Light-Years Spiral Galaxy', tag: 'Galaxy' },
    { query: 'M42', name: 'Orion Nebula (M42)', sub: 'Diffuse Emission Nursery', tag: 'Nebula' },
    { query: 'M45', name: 'The Pleiades (M45)', sub: 'Seven Sisters Open Cluster', tag: 'Cluster' },
    { query: 'M13', name: 'Hercules Globular Cluster (M13)', sub: '300,000+ Ancient Stars', tag: 'Cluster' }
  ];

  // --------------------------------------------------------------------------
  // 2. DOM REFERENCES & APP STATE
  // --------------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);

  const state = {
    stel: null,
    core: null,
    paasLayer: null,
    worldEntries: [], // { planet, obj, icrf, pinEl }
    activeCategory: 'all',
    selectedPlanetId: null,
    inspectedMode: null, // 'business' | 'celestial'
    currentCelestialObj: null,
    currentLocation: OBSERVATORY_PRESETS[0],
    beaconsVisible: true,
    ultraOpen: false,
    nightMode: false,
    currentSkyCulture: 'western',
    lastCelestialSelection: null,
    brandName: '',
    brandCity: ''
  };

  // --------------------------------------------------------------------------
  // 3. SAFE FORMATTERS & COORDINATE HELPERS
  // --------------------------------------------------------------------------
  function hexToRgba01(hexInt, alpha) {
    return [
      ((hexInt >> 16) & 255) / 255,
      ((hexInt >> 8) & 255) / 255,
      (hexInt & 255) / 255,
      alpha
    ];
  }

  function formatHms(hms) {
    if (!hms) return '--h --m';
    const hh = String(Math.abs(hms.h || 0)).padStart(2, '0');
    const mm = String(Math.abs(hms.m || 0)).padStart(2, '0');
    const ss = String(Math.floor(Math.abs(hms.s || 0))).padStart(2, '0');
    return `${hh}h ${mm}m ${ss}s`;
  }

  function formatDms(dms, signed) {
    if (!dms) return '--° --\'';
    const sign = signed ? (dms.sign < 0 ? '-' : '+') : '';
    const dd = String(Math.abs(dms.d || 0)).padStart(2, '0');
    const mm = String(Math.abs(dms.m || 0)).padStart(2, '0');
    const ss = String(Math.floor(Math.abs(dms.s || 0))).padStart(2, '0');
    return `${sign}${dd}° ${mm}' ${ss}"`;
  }

  function buildTargetUrl(planet) {
    if (!planet) return './classic/index.html';
    if (!planet.isCustomizable || (!state.brandName.trim() && !state.brandCity.trim())) {
      return planet.url;
    }
    const u = new URL(planet.url, window.location.href);
    if (state.brandName.trim()) u.searchParams.set('brand', state.brandName.trim());
    if (state.brandCity.trim()) u.searchParams.set('city', state.brandCity.trim());
    return u.toString();
  }

  // Exact Stellarium Stereographic Projection (matches projections/proj_stereographic.c)
  function projectIcrfToScreen(stel, icrfVec, winW, winH) {
    const v = stel.convertFrame(stel.observer, 'ICRF', 'VIEW', icrfVec);
    const d = Math.hypot(v[0], v[1], v[2]);
    if (!d || d < 1e-12) return null;
    const nx = v[0] / d;
    const ny = v[1] / d;
    const nz = v[2] / d;
    if (nz > 0.72) return null; // Behind camera FOV cone
    const oneOverH = 1.0 / (0.5 * (1.0 - nz));
    const px = nx * oneOverH;
    const py = ny * oneOverH;
    const aspect = winW / Math.max(1, winH);
    const fov = stel.core.fov || (70 * D2R);
    const fovy = aspect < 1 ? 4 * Math.atan(Math.tan(fov / 4) / aspect) : fov;
    const t = 2 * Math.tan(fovy / 4);
    if (!t) return null;
    const ndcX = px / (t * aspect);
    const ndcY = py / t;
    const sx = (ndcX + 1) * 0.5 * winW;
    const sy = (1 - ndcY) * 0.5 * winH;
    if (sx < -140 || sx > winW + 140 || sy < -90 || sy > winH + 90) return null;
    return { x: sx, y: sy };
  }

  // Compute Optimal Evening Twilight MJD (~14 deg below western horizon after sunset)
  function computeEveningTwilightMJD(stel) {
    const obs = stel.observer;
    const baseNow = new Date();
    const startMjd = stel.date2MJD(baseNow);
    const sunObj = stel.getObj('NAME Sun');
    if (!sunObj) return startMjd;

    const savedUtc = obs.utc;
    let bestMjd = startMjd;
    let prevAlt = null;

    // Scan forward 24h in 15-minute increments for sunset descending past -14 deg
    for (let step = 0; step <= 96; step++) {
      const mjd = startMjd + step / 96;
      obs.utc = mjd;
      const radec = sunObj.getInfo('radec', obs);
      if (!radec) continue;
      const obsVec = stel.convertFrame(obs, 'ICRF', 'OBSERVED', radec);
      const alt = Math.asin(Math.max(-1, Math.min(1, obsVec[2])));
      if (prevAlt !== null && prevAlt > -13 * D2R && alt <= -13 * D2R) {
        bestMjd = mjd;
        break;
      }
      if (step === 0 && alt <= -13 * D2R && alt > -60 * D2R) {
        // Already in deep evening twilight / night right now
        bestMjd = mjd;
        break;
      }
      prevAlt = alt;
    }

    obs.utc = savedUtc;
    return bestMjd;
  }

  // --------------------------------------------------------------------------
  // 4. INSPECTOR HEADER BADGE (NO SPINNING 3D SPHERES)
  // --------------------------------------------------------------------------
  function setInspectorBadge(glyph, accentHex) {
    const el = $('inspBadgeIcon');
    if (!el) return;
    el.textContent = glyph || '✦';
    el.style.borderColor = `${accentHex || '#c5a34e'}66`;
    el.style.boxShadow = `0 6px 20px ${accentHex || '#c5a34e'}33`;
  }

  // --------------------------------------------------------------------------
  // 5. STELLARIUM WASM ENGINE BOOTSTRAP & CUSTOM PAAS LAYER
  // --------------------------------------------------------------------------
  function populatePaasWorldsLayer() {
    const stel = state.stel;
    if (!stel) return;

    // Remove previous entries if relocating observer city
    if (state.paasLayer) {
      state.worldEntries.forEach((e) => {
        if (e.obj && state.paasLayer.remove) {
          try { state.paasLayer.remove(e.obj); } catch (_) {}
        }
        if (e.pinEl && e.pinEl.parentNode) e.pinEl.parentNode.removeChild(e.pinEl);
      });
    } else {
      state.paasLayer = stel.createLayer({ id: 'paas-worlds', z: 50, visible: true });
    }

    const pinsHost = $('paasWorldPins');
    pinsHost.innerHTML = '';
    state.worldEntries = [];

    WEBSITE_PLANETS.forEach((planet) => {
      const obsVec = stel.s2c(planet.azDeg * D2R, planet.altDeg * D2R);
      const icrf = stel.convertFrame(stel.observer, 'OBSERVED', 'ICRF', obsVec);
      const rgbaMain = hexToRgba01(planet.color, 0.26);
      const rgbaBorder = hexToRgba01(planet.glow, 0.92);

      let obj = null;
      try {
        obj = state.paasLayer.add('circle', {
          pos: [icrf[0], icrf[1], icrf[2], 0],
          frame: stel.FRAME_ICRF,
          size: [0.022, 0.022],
          color: rgbaMain,
          border_color: rgbaBorder,
          label: planet.shortName
        });
      } catch (_) {}

      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'paas-pin';
      pin.dataset.id = planet.id;
      pin.innerHTML = `
        <span class="pin-dot" style="background:${planet.hex};color:${planet.hex};box-shadow:0 0 10px ${planet.hex};"></span>
        <span class="pin-label">${planet.shortName}</span>
        ${planet.liveTag ? `<span class="pin-live">${planet.liveTag}</span>` : ''}
      `;
      pin.addEventListener('click', (ev) => {
        ev.stopPropagation();
        selectBusinessWorld(planet.id, true);
      });
      pinsHost.appendChild(pin);

      state.worldEntries.push({ planet, obj, icrf, pinEl: pin });
    });
  }

  function applyObserverLocation(loc, jumpToTwilight) {
    const stel = state.stel;
    if (!stel) return;
    state.currentLocation = loc;
    stel.observer.latitude = loc.lat * D2R;
    stel.observer.longitude = loc.lon * D2R;
    stel.observer.elevation = loc.elev;

    $('locNameOut').innerHTML = `${loc.name} <span style="color:var(--gold,#c5a34e);">[${loc.tag}]</span>`;
    $('locCoordsOut').textContent = `${Math.abs(loc.lat).toFixed(2)}°${loc.lat >= 0 ? 'N' : 'S'} · ${Math.abs(loc.lon).toFixed(2)}°${loc.lon >= 0 ? 'E' : 'W'} · ${loc.elev}m`;

    document.querySelectorAll('#locPopover button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.loc === loc.key);
    });

    if (jumpToTwilight) {
      stel.observer.utc = computeEveningTwilightMJD(stel);
    }
    populatePaasWorldsLayer();
  }

  function bootStellarium() {
    const baseUrl = new URL('./', window.location.href).href;
    const statusEl = $('bootStatus');
    const canvas = $('stel-canvas');

    if (typeof window.StelWebEngine !== 'function') {
      if (statusEl) statusEl.textContent = 'Stellarium WASM bundle missing — reload page.';
      return;
    }

    if (statusEl) statusEl.textContent = 'Initializing C/ERFA/WebGL2 Astronomy Kernel...';

    window.StelWebEngine({
      wasmFile: `${baseUrl}engine/stellarium-web-engine.wasm`,
      canvas: canvas,
      translateFn: function (_domain, str) { return str; },
      onReady: function (stel) {
        state.stel = stel;
        state.core = stel.core;
        const core = stel.core;

        if (statusEl) statusEl.textContent = 'Streaming Stars, Milky Way & Planetary HiPS...';

        // Load NanoVG TrueType Fonts
        stel.setFont('regular', `${baseUrl}fonts/Roboto-Regular.ttf`, 1.38);
        stel.setFont('bold', `${baseUrl}fonts/Roboto-Bold.ttf`, 1.38);

        // Attach Official Stellarium Sky Data Catalogs (absolute URLs mandatory for Emscripten XHR)
        core.stars.addDataSource({ url: `${baseUrl}skydata/stars` });
        core.skycultures.addDataSource({ url: `${baseUrl}skydata/skycultures/western`, key: 'western' });
        core.dsos.addDataSource({ url: `${baseUrl}skydata/dso` });
        core.landscapes.addDataSource({ url: `${baseUrl}skydata/landscapes/guereins`, key: 'guereins' });
        core.milkyway.addDataSource({ url: `${baseUrl}skydata/surveys/milkyway` });
        core.minor_planets.addDataSource({ url: `${baseUrl}skydata/mpcorb.dat`, key: 'mpc_asteroids' });
        core.planets.addDataSource({ url: `${baseUrl}skydata/surveys/sso/moon`, key: 'moon' });
        core.planets.addDataSource({ url: `${baseUrl}skydata/surveys/sso/sun`, key: 'sun' });
        core.planets.addDataSource({ url: `${baseUrl}skydata/surveys/sso/moon`, key: 'default' });
        core.comets.addDataSource({ url: `${baseUrl}skydata/CometEls.txt`, key: 'mpc_comets' });
        core.satellites.addDataSource({ url: `${baseUrl}skydata/tle_satellite.jsonl.gz`, key: 'jsonl/sat' });

        // Clean Realistic Stellarium Defaults (NO noisy grids on load!)
        core.atmosphere.visible = true;
        core.landscapes.visible = true;
        core.milkyway.visible = true;
        core.dsos.visible = true;
        core.satellites.visible = true;
        core.planets.hints_visible = true;
        core.constellations.lines_visible = true;
        core.constellations.labels_visible = true;
        core.constellations.images_visible = true;
        core.lines.azimuthal.visible = false;
        core.lines.equatorial.visible = false;
        core.lines.ecliptic.visible = false;
        core.lines.meridian.visible = false;

        core.bortle_index = 2;
        core.exposure_scale = 1.15;
        core.star_relative_scale = 1.1;
        core.time_speed = 1.0;
        core.fov = 72 * D2R;

        // Initial Observer & Dusk Evening Sky
        applyObserverLocation(OBSERVATORY_PRESETS[0], true);

        // Smoothly point toward East-Northeast horizon so Milky Way, Constellations & Business Beacons gleam
        const initVec = stel.convertFrame(stel.observer, 'OBSERVED', 'ICRF', stel.s2c(48 * D2R, 24 * D2R));
        stel.lookAt(initVec, 0.05);

        // Reactive C/WASM Listener for Native Celestial Object Selection (Stars, Planets, DSOs, Satellites)
        stel.change(function (obj, attr) {
          if (attr === 'selection') {
            handleNativeWasmSelection(obj);
          }
          if (attr === 'fov') {
            updateTopTelemetry();
          }
        });

        // Sync UI Toggle States with Core Flags
        syncBottomDockButtons();
        syncUltraControls();

        // Start 60 FPS Telemetry & Screen-Projected Beacon Loop
        requestAnimationFrame(hudSyncLoop);

        // Lift Boot Curtain
        setTimeout(() => {
          $('bootCurtain').classList.add('ready');
        }, 350);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. SELECTION: REAL CELESTIAL BODIES & BUSINESS WEBSITE PLANETS
  // --------------------------------------------------------------------------
  function handleNativeWasmSelection(obj) {
    if (!obj) {
      $('btnUnlockTarget').style.display = 'none';
      return;
    }

    // Check if native circle object belongs to PAAS world list
    const matchEntry = state.worldEntries.find((e) => e.obj && (e.obj === obj || e.obj.v === obj.v));
    if (matchEntry) {
      selectBusinessWorld(matchEntry.planet.id, false);
      return;
    }

    // Otherwise open Inspector in Genuine Astronomical Object mode!
    state.inspectedMode = 'celestial';
    state.currentCelestialObj = obj;
    state.selectedPlanetId = null;

    document.querySelectorAll('.world-card').forEach((c) => c.classList.remove('active'));
    state.worldEntries.forEach((e) => e.pinEl.classList.remove('active'));
    $('btnUnlockTarget').style.display = 'inline-flex';

    renderCelestialInspector(obj);
  }

  function renderCelestialInspector(obj) {
    const stel = state.stel;
    if (!stel || !obj) return;

    let names = [];
    try { names = obj.designations ? obj.designations() : []; } catch (_) {}
    const primary = (names[0] || 'Celestial Body').replace(/^NAME\s+/i, '');
    const secondary = names.slice(1, 4).map((s) => s.replace(/^NAME\s+/i, '')).join(' · ') || 'Stellarium Catalog';

    const vmag = obj.getInfo ? obj.getInfo('vmag', stel.observer) : null;
    const radec = obj.getInfo ? obj.getInfo('radec', stel.observer) : null;

    let raStr = '--', decStr = '--', azStr = '--', altStr = '--';
    if (radec) {
      const [ra, dec] = stel.c2s(radec);
      const [az, alt] = stel.c2s(stel.convertFrame(stel.observer, 'ICRF', 'OBSERVED', radec));
      raStr = formatHms(stel.a2tf(stel.anp(ra), 1));
      decStr = formatDms(stel.a2af(stel.anpm(dec), 1), true);
      azStr = `${(stel.anp(az) * R2D).toFixed(2)}°`;
      altStr = `${(alt * R2D).toFixed(2)}°`;
    }

    // Emoji icon by designation/type heuristic
    const lower = primary.toLowerCase();
    let glyph = '✦';
    if (lower.includes('moon')) glyph = '🌕';
    else if (lower.includes('saturn')) glyph = '🪐';
    else if (lower.includes('sun')) glyph = '☀️';
    else if (/^(m\d+|ngc|ic\s)/i.test(primary)) glyph = '🌌';
    else if (lower.includes('jupiter') || lower.includes('mars') || lower.includes('venus') || lower.includes('mercury')) glyph = '🪐';
    else if (lower.includes('iss') || lower.includes('starlink') || lower.includes('zarya')) glyph = '🛰️';

    setInspectorBadge(glyph, '#38bdf8');

    $('inspKicker').textContent = `STELLARIUM WASM // REAL SKY OBJECT`;
    $('inspTitle').textContent = primary;
    $('inspDesc').textContent = secondary;

    $('stat1K').textContent = 'MAGNITUDE';
    $('stat1V').textContent = typeof vmag === 'number' && isFinite(vmag) ? `${vmag.toFixed(2)} mag` : 'Catalog';
    $('stat2K').textContent = 'ALTITUDE';
    $('stat2V').textContent = altStr;
    $('stat3K').textContent = 'TRACKING';
    $('stat3V').textContent = 'ERFA J2000';

    $('inspSkyCoords').innerHTML = `
      <span>RA / Dec (ICRF)</span><span>${raStr} · ${decStr}</span>
      <span>Azimuth / Alt</span><span>${azStr} · ${altStr}</span>
    `;

    $('inspFeatures').innerHTML = `
      <div class="feat-row">Computed in real time by C/ERFA astrometry compiled to WebAssembly</div>
      <div class="feat-row">Use Zoom Telescope or Center Camera below to explore surrounding stars</div>
      <div class="feat-row">Want a 3D interactive web showcase built with this precision? Configure below!</div>
    `;

    $('inspPriceTag').textContent = 'OBSERVATORY ENGINE';
    $('inspPriceMain').textContent = 'Custom 3D Web';
    $('inspPriceSub').textContent = 'Starting $495 Turnkey';

    const btnP = $('btnInspPrimary');
    btnP.textContent = '🔭 ZOOM TELESCOPE (FOV 4°)';
    btnP.onclick = () => {
      if (state.stel && state.currentCelestialObj) {
        state.stel.pointAndLock(state.currentCelestialObj, 0.9);
        state.stel.zoomTo(4 * D2R, 1.1);
      }
    };

    const btnExt = $('btnInspExt');
    btnExt.removeAttribute('href');
    btnExt.textContent = 'EXPLORE SITES';
    btnExt.onclick = (e) => {
      e.preventDefault();
      $('leftDrawer').classList.add('open');
      $('btnExploreSites').classList.add('open');
    };

    $('inspectorPanel').classList.add('open');
  }

  function selectBusinessWorld(planetId, shouldSlew) {
    const planet = WEBSITE_PLANETS.find((p) => p.id === planetId);
    if (!planet) return;

    state.inspectedMode = 'business';
    state.selectedPlanetId = planet.id;
    state.currentCelestialObj = null;

    // Release lock on any previous celestial body
    if (state.core && state.core.selection) {
      state.core.selection = null;
    }
    $('btnUnlockTarget').style.display = 'none';

    document.querySelectorAll('.world-card').forEach((c) => {
      c.classList.toggle('active', c.dataset.id === planet.id);
    });
    state.worldEntries.forEach((e) => {
      e.pinEl.classList.toggle('active', e.planet.id === planet.id);
    });

    if (shouldSlew && state.stel) {
      const entry = state.worldEntries.find((e) => e.planet.id === planet.id);
      if (entry) {
        state.stel.lookAt(entry.icrf, 0.95);
        if (state.core.fov > 78 * D2R || state.core.fov < 35 * D2R) {
          state.stel.zoomTo(56 * D2R, 0.95);
        }
      }
    }

    setInspectorBadge(CAT_GLYPHS[planet.cat] || '✦', planet.hex);

    const hasCustom = planet.isCustomizable && (state.brandName.trim() || state.brandCity.trim());
    const displayTitle = hasCustom && state.brandName.trim()
      ? `${state.brandName.trim()} // Preview`
      : planet.name;

    $('inspKicker').textContent = `${planet.cat.toUpperCase()} SECTOR // AZ ${planet.azDeg}° · ALT +${planet.altDeg}°`;
    $('inspTitle').textContent = displayTitle;
    $('inspDesc').textContent = planet.desc;

    $('stat1K').textContent = 'LIGHTHOUSE';
    $('stat1V').textContent = '100 / 100';
    $('stat2K').textContent = 'SPEED';
    $('stat2V').textContent = planet.speed;
    $('stat3K').textContent = 'OWNERSHIP';
    $('stat3V').textContent = '100% CODE';

    // Convert planet ICRF to live RA/Dec
    let raDecText = 'ICRF J2000';
    if (state.stel) {
      const entry = state.worldEntries.find((e) => e.planet.id === planet.id);
      if (entry) {
        const [ra, dec] = state.stel.c2s(entry.icrf);
        raDecText = `${formatHms(state.stel.a2tf(state.stel.anp(ra), 0))} · ${formatDms(state.stel.a2af(state.stel.anpm(dec), 0), true)}`;
      }
    }
    $('inspSkyCoords').innerHTML = `
      <span>RA / Dec</span><span>${raDecText}</span>
      <span>Target Niche</span><span>${planet.niche}</span>
    `;

    $('inspFeatures').innerHTML = planet.features.map((f) => `<div class="feat-row">${f}</div>`).join('');

    $('inspPriceTag').textContent = 'RECOMMENDED LAUNCH';
    $('inspPriceMain').textContent = planet.priceLabel;
    $('inspPriceSub').textContent = planet.priceSub;

    const btnP = $('btnInspPrimary');
    btnP.textContent = '👁 LAUNCH LIVE INTERACTIVE WEBSITE';
    btnP.onclick = () => openPreviewModal(planet);

    const resolvedUrl = buildTargetUrl(planet);
    const btnExt = $('btnInspExt');
    btnExt.href = resolvedUrl;
    btnExt.target = '_blank';
    btnExt.rel = 'noopener';
    btnExt.textContent = 'OPEN IN NEW TAB ↗';
    btnExt.onclick = null;

    $('inspectorPanel').classList.add('open');
  }

  // --------------------------------------------------------------------------
  // 7. PREVIEW MODAL & COMMERCIAL $495+ CONFIGURATOR
  // --------------------------------------------------------------------------
  function openPreviewModal(planet) {
    const resolved = buildTargetUrl(planet);
    const titleLabel = state.brandName.trim() && planet.isCustomizable
      ? `${state.brandName.trim()} — Live Customized Demo`
      : planet.name;

    $('previewTitle').textContent = titleLabel;
    $('previewExtLink').href = resolved;
    $('previewExtNote').style.display = planet.isExternal ? 'inline' : 'none';
    $('previewFrame').src = resolved;
    $('modalPreview').classList.add('open');
  }

  function closePreviewModal() {
    $('modalPreview').classList.remove('open');
    $('previewFrame').src = 'about:blank';
  }

  function recalcModularConfigurator() {
    let oneTime = 495;
    let monthly = 0;
    const labels = [];

    document.querySelectorAll('.mod-addon').forEach((chk) => {
      if (!chk.checked) return;
      const p = Number(chk.dataset.price || 0);
      if (chk.dataset.rec === 'true') {
        monthly += p;
        labels.push('Managed Edge Care');
      } else {
        oneTime += p;
        labels.push(chk.dataset.label || 'Add-on');
      }
    });

    $('modTotalOut').textContent = monthly > 0
      ? `$${oneTime.toLocaleString()} + $${monthly}/mo`
      : `$${oneTime.toLocaleString()}`;

    const activePlanet = WEBSITE_PLANETS.find((x) => x.id === state.selectedPlanetId);
    const worldStr = activePlanet ? activePlanet.shortName : 'Business Launchpad';
    const customStr = state.brandName.trim() ? ` for ${state.brandName.trim()} (${state.brandCity.trim() || 'Custom'})` : '';
    const msg = `Hi Dimitar (AETERNA), I configured ${worldStr}${customStr}: Total $${oneTime}${monthly ? ` + $${monthly}/mo` : ''} [${labels.join(', ') || 'Base $495'}]. Ready to proceed!`;
    $('btnModWhatsApp').href = `https://wa.me/359884638640?text=${encodeURIComponent(msg)}`;
  }

  // --------------------------------------------------------------------------
  // 8. DRAWERS, OMNI-SEARCH, ULTRA VISUALS & BOTTOM DOCK SYNC
  // --------------------------------------------------------------------------
  function renderDrawerCards() {
    const host = $('drawerCardsList');
    const filtered = WEBSITE_PLANETS.filter((p) => state.activeCategory === 'all' || p.cat === state.activeCategory);
    host.innerHTML = '';

    filtered.forEach((p) => {
      const card = document.createElement('div');
      card.className = `world-card${state.selectedPlanetId === p.id ? ' active' : ''}`;
      card.dataset.id = p.id;
      card.innerHTML = `
        <span class="wc-orb" style="background:${p.hex};box-shadow:0 0 10px ${p.hex};"></span>
        <div class="wc-meta">
          <div class="wc-title">${p.shortName}</div>
          <div class="wc-sub">${p.niche}</div>
        </div>
        <span class="wc-price">${p.priceLabel.replace(' Turnkey Store', '').replace(' Base Launchpad', '').replace(' Portal Build', '').replace(' Spatial Portal', '')}</span>
      `;
      card.addEventListener('click', () => {
        selectBusinessWorld(p.id, true);
        if (window.innerWidth < 1050) {
          $('leftDrawer').classList.remove('open');
          $('btnExploreSites').classList.remove('open');
        }
      });
      host.appendChild(card);
    });
  }

  function runOmniSearch(q) {
    const dd = $('searchDropdown');
    const clearBtn = $('btnClearSearch');
    const term = q.trim().toLowerCase();
    clearBtn.classList.toggle('visible', term.length > 0);

    if (!term) {
      dd.classList.remove('open');
      return;
    }

    const hits = [];

    // 1. Business Worlds & 8K Studios
    WEBSITE_PLANETS.forEach((p) => {
      if (
        p.name.toLowerCase().includes(term) ||
        p.shortName.toLowerCase().includes(term) ||
        p.niche.toLowerCase().includes(term) ||
        p.cat.toLowerCase().includes(term)
      ) {
        hits.push({
          kind: 'world',
          id: p.id,
          title: p.shortName,
          sub: p.niche,
          tag: p.liveTag || 'Site'
        });
      }
    });

    // 2. Real Celestial Objects Index
    CELESTIAL_CATALOG.forEach((c) => {
      if (c.name.toLowerCase().includes(term) || c.sub.toLowerCase().includes(term)) {
        hits.push({
          kind: 'celestial',
          query: c.query,
          title: c.name,
          sub: c.sub,
          tag: c.tag
        });
      }
    });

    // 3. Direct Stellarium WASM dynamic lookup fallback if user types e.g. HIP/M/NGC/star name
    let wasmMatch = null;
    if (state.stel && term.length >= 2 && !hits.some((h) => h.kind === 'celestial')) {
      try {
        wasmMatch = state.stel.getObj(`NAME ${q.trim()}`) || state.stel.getObj(q.trim());
        if (wasmMatch) {
          hits.push({
            kind: 'wasmObj',
            obj: wasmMatch,
            title: q.trim().toUpperCase(),
            sub: 'Stellarium Live WASM Sky Catalog Match',
            tag: 'Sky'
          });
        }
      } catch (_) {}
    }

    if (hits.length === 0) {
      dd.innerHTML = `<div class="sr-item"><div class="sr-sub">No matching worlds or celestial bodies found for "${q.trim()}"</div></div>`;
      dd.classList.add('open');
      return;
    }

    dd.innerHTML = '';
    hits.slice(0, 12).forEach((item) => {
      const el = document.createElement('div');
      el.className = 'sr-item';
      el.innerHTML = `
        <div>
          <div class="sr-title">${item.title}</div>
          <div class="sr-sub">${item.sub}</div>
        </div>
        <span class="sr-tag${item.kind !== 'world' ? ' celestial' : ''}">${item.tag}</span>
      `;
      el.addEventListener('click', () => {
        dd.classList.remove('open');
        $('searchInput').value = item.title;
        if (item.kind === 'world') {
          selectBusinessWorld(item.id, true);
        } else if (item.kind === 'wasmObj' && item.obj && state.stel) {
          state.stel.core.selection = item.obj;
          state.stel.pointAndLock(item.obj, 0.9);
          state.stel.zoomTo(18 * D2R, 0.9);
        } else if (item.kind === 'celestial' && state.stel) {
          const obj = state.stel.getObj(item.query);
          if (obj) {
            state.stel.core.selection = obj;
            state.stel.pointAndLock(obj, 0.95);
            state.stel.zoomTo((item.tag === 'Galaxy' || item.tag === 'Nebula' ? 8 : 18) * D2R, 0.95);
          }
        }
      });
      dd.appendChild(el);
    });
    dd.classList.add('open');
  }

  function syncBottomDockButtons() {
    const core = state.core;
    if (!core) return;

    $('btnStelCstLines').classList.toggle('active', !!core.constellations.lines_visible);
    $('btnStelCstArt').classList.toggle('active', !!core.constellations.images_visible);
    $('btnStelAtmo').classList.toggle('active', !!core.atmosphere.visible);
    $('btnStelLandscape').classList.toggle('active', !!core.landscapes.visible);
    $('btnStelAzGrid').classList.toggle('active', !!core.lines.azimuthal.visible);
    $('btnStelEqGrid').classList.toggle('active', !!core.lines.equatorial.visible);
    $('btnStelDso').classList.toggle('active', !!core.dsos.visible);
    $('btnStelMilkyWay').classList.toggle('active', !!core.milkyway.visible);
    $('btnStelBeacons').classList.toggle('active', state.beaconsVisible);
    $('btnNightMode').classList.toggle('active', state.nightMode);
  }

  function syncUltraControls() {
    const core = state.core;
    if (!core) return;

    $('rngExposure').value = core.exposure_scale;
    $('valExposure').textContent = `${Number(core.exposure_scale).toFixed(2)}×`;

    $('rngBortle').value = core.bortle_index;
    $('valBortle').textContent = `Class ${Math.round(core.bortle_index)}`;

    $('rngStarScale').value = core.star_relative_scale;
    $('valStarScale').textContent = `${Number(core.star_relative_scale).toFixed(2)}×`;

    document.querySelectorAll('#fxTogglesRow .fx-chip').forEach((chip) => {
      const key = chip.dataset.fx;
      if (key === 'satellites') chip.classList.toggle('active', !!core.satellites.visible);
      if (key === 'ecliptic') chip.classList.toggle('active', !!core.lines.ecliptic.visible);
      if (key === 'meridian') chip.classList.toggle('active', !!core.lines.meridian.visible);
      if (key === 'hints') chip.classList.toggle('active', !!core.planets.hints_visible);
      if (key === 'bigmoon') chip.classList.toggle('active', core.planets.scale_moon > 1.2);
    });
  }

  function updateTopTelemetry() {
    const stel = state.stel;
    if (!stel) return;
    const obs = stel.observer;
    const azDeg = (stel.anp(obs.yaw) * R2D).toFixed(1);
    const altDeg = (obs.pitch * R2D).toFixed(1);
    const fovDeg = (stel.core.fov * R2D).toFixed(1);
    $('hudTelCoords').innerHTML = `AZM <b>${azDeg}°</b> &middot; ALT <b>${altDeg >= 0 ? '+' + altDeg : altDeg}°</b> &middot; FOV <b>${fovDeg}°</b>`;
  }

  function updateClockAndProgress() {
    const stel = state.stel;
    if (!stel) return;

    try {
      const d = stel.MJD2date(stel.observer.utc);
      $('clockTimeOut').textContent = d.toISOString().slice(11, 19) + ' UTC';
      $('clockDateOut').textContent = d.toISOString().slice(0, 10);
    } catch (_) {}

    // Live WASM background tile download progress indicators
    const rack = $('stelProgressRack');
    const pbars = stel.core.progressbars;
    if (Array.isArray(pbars) && pbars.length > 0) {
      rack.innerHTML = pbars.slice(0, 4).map((b) => {
        const pct = Math.min(100, Math.max(0, Math.round((b.value / (b.total || 1)) * 100)));
        return `<div class="stel-prog-pill"><span>${b.label || 'Streaming Sky'}</span><span class="bar"><i style="width:${pct}%"></i></span></div>`;
      }).join('');
    } else if (rack.childElementCount > 0) {
      rack.innerHTML = '';
    }
  }

  function updateProjectedWorldBeacons() {
    const stel = state.stel;
    if (!stel) return;

    const canvas = $('stel-canvas');
    const winW = canvas.clientWidth || window.innerWidth;
    const winH = canvas.clientHeight || window.innerHeight;
    const landscapeOn = !!stel.core.landscapes.visible;

    state.worldEntries.forEach((entry) => {
      const el = entry.pinEl;
      if (!state.beaconsVisible) {
        el.style.display = 'none';
        return;
      }

      const pt = projectIcrfToScreen(stel, entry.icrf, winW, winH);
      if (!pt || pt.y < 64 || pt.y > winH - 72) {
        el.style.display = 'none';
        return;
      }

      const obsV = stel.convertFrame(stel.observer, 'ICRF', 'OBSERVED', entry.icrf);
      const belowHorizon = obsV[2] < -0.02;
      if (landscapeOn && obsV[2] < -0.10) {
        el.style.display = 'none';
        return;
      }

      el.style.display = 'flex';
      el.style.opacity = belowHorizon && landscapeOn ? '0.35' : '1';
      el.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0) translate(-10px, -50%)`;
    });
  }

  let frameCounter = 0;
  function hudSyncLoop() {
    requestAnimationFrame(hudSyncLoop);
    if (!state.stel) return;

    updateProjectedWorldBeacons();
    frameCounter++;

    if (frameCounter % 10 === 0) {
      updateTopTelemetry();
      updateClockAndProgress();
    }

    // Live-refresh RA/Az telemetry while inspecting a moving celestial body
    if (frameCounter % 30 === 0 && state.inspectedMode === 'celestial' && state.currentCelestialObj && $('inspectorPanel').classList.contains('open')) {
      renderCelestialInspector(state.currentCelestialObj);
    }
  }

  // --------------------------------------------------------------------------
  // 9. EVENT WIRING
  // --------------------------------------------------------------------------
  function wireUIEvents() {
    // Top Left Explore Drawer
    $('btnExploreSites').addEventListener('click', () => {
      const open = $('leftDrawer').classList.toggle('open');
      $('btnExploreSites').classList.toggle('open', open);
    });
    $('btnCloseLeft').addEventListener('click', () => {
      $('leftDrawer').classList.remove('open');
      $('btnExploreSites').classList.remove('open');
    });

    // Category Filters
    $('catBar').addEventListener('click', (ev) => {
      const btn = ev.target.closest('.cat-pill');
      if (!btn) return;
      state.activeCategory = btn.dataset.cat;
      document.querySelectorAll('#catBar .cat-pill').forEach((b) => b.classList.toggle('active', b === btn));
      renderDrawerCards();
    });

    // Live Brand & City Injection
    $('brandNameInput').addEventListener('input', (e) => {
      state.brandName = e.target.value;
      if (state.inspectedMode === 'business' && state.selectedPlanetId) {
        selectBusinessWorld(state.selectedPlanetId, false);
      }
    });
    $('brandCityInput').addEventListener('input', (e) => {
      state.brandCity = e.target.value;
      if (state.inspectedMode === 'business' && state.selectedPlanetId) {
        selectBusinessWorld(state.selectedPlanetId, false);
      }
    });

    // Top Omni-Search
    $('searchInput').addEventListener('input', (e) => runOmniSearch(e.target.value));
    $('searchInput').addEventListener('focus', (e) => {
      if (e.target.value.trim()) runOmniSearch(e.target.value);
    });
    $('btnClearSearch').addEventListener('click', () => {
      $('searchInput').value = '';
      $('searchDropdown').classList.remove('open');
      $('btnClearSearch').classList.remove('visible');
    });

    // Dismiss dropdown/popovers on outside click
    document.addEventListener('click', (ev) => {
      if (!ev.target.closest('.search-wrap')) $('searchDropdown').classList.remove('open');
      if (!ev.target.closest('#cornerLocation') && !ev.target.closest('#locPopover')) {
        $('locPopover').classList.remove('open');
      }
    });

    // Right Inspector Controls
    $('btnCloseInspector').addEventListener('click', () => {
      $('inspectorPanel').classList.remove('open');
      state.worldEntries.forEach((e) => e.pinEl.classList.remove('active'));
      if (state.core) state.core.selection = null;
      $('btnUnlockTarget').style.display = 'none';
    });

    // Configurator Modal Triggers
    const openCfg = () => {
      recalcModularConfigurator();
      $('modalConfig').classList.add('open');
    };
    $('btnTopConfigure').addEventListener('click', openCfg);
    $('btnInspConfigure').addEventListener('click', openCfg);
    $('btnPreviewCfg').addEventListener('click', openCfg);
    $('btnCloseConfig').addEventListener('click', () => $('modalConfig').classList.remove('open'));
    $('modalConfig').addEventListener('click', (e) => {
      if (e.target === $('modalConfig')) $('modalConfig').classList.remove('open');
    });

    // Configurator Tabs & Checkboxes
    document.querySelectorAll('#cfgTabs .cfg-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#cfgTabs .cfg-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const mod = tab.dataset.mode === 'modular';
        $('paneModular').style.display = mod ? 'block' : 'none';
        $('paneEnterprise').style.display = mod ? 'none' : 'block';
      });
    });
    document.querySelectorAll('.mod-addon').forEach((chk) => {
      chk.addEventListener('change', recalcModularConfigurator);
    });

    // Fullscreen Live Preview Modal
    $('btnClosePreview').addEventListener('click', closePreviewModal);

    // Bottom Dock: Core Stellarium Toggles
    const bindCoreToggle = (btnId, getFn, setFn) => {
      $(btnId).addEventListener('click', () => {
        if (!state.core) return;
        setFn(state.core, !getFn(state.core));
        syncBottomDockButtons();
      });
    };

    bindCoreToggle('btnStelCstLines', (c) => c.constellations.lines_visible, (c, v) => {
      c.constellations.lines_visible = v;
      c.constellations.labels_visible = v;
    });
    bindCoreToggle('btnStelCstArt', (c) => c.constellations.images_visible, (c, v) => { c.constellations.images_visible = v; });
    bindCoreToggle('btnStelAtmo', (c) => c.atmosphere.visible, (c, v) => { c.atmosphere.visible = v; });
    bindCoreToggle('btnStelLandscape', (c) => c.landscapes.visible, (c, v) => { c.landscapes.visible = v; });
    bindCoreToggle('btnStelAzGrid', (c) => c.lines.azimuthal.visible, (c, v) => { c.lines.azimuthal.visible = v; });
    bindCoreToggle('btnStelEqGrid', (c) => c.lines.equatorial.visible, (c, v) => { c.lines.equatorial.visible = v; });
    bindCoreToggle('btnStelDso', (c) => c.dsos.visible, (c, v) => { c.dsos.visible = v; });
    bindCoreToggle('btnStelMilkyWay', (c) => c.milkyway.visible, (c, v) => { c.milkyway.visible = v; });

    $('btnStelBeacons').addEventListener('click', () => {
      state.beaconsVisible = !state.beaconsVisible;
      if (state.paasLayer) state.paasLayer.visible = state.beaconsVisible;
      syncBottomDockButtons();
    });

    $('btnNightMode').addEventListener('click', () => {
      state.nightMode = !state.nightMode;
      $('nightModeOverlay').classList.toggle('active', state.nightMode);
      syncBottomDockButtons();
    });

    $('btnToggleUltra').addEventListener('click', () => {
      state.ultraOpen = !state.ultraOpen;
      $('ultraDrawer').classList.toggle('open', state.ultraOpen);
      $('btnToggleUltra').classList.toggle('active', state.ultraOpen);
    });
    $('btnCloseUltra').addEventListener('click', () => {
      state.ultraOpen = false;
      $('ultraDrawer').classList.remove('open');
      $('btnToggleUltra').classList.remove('active');
    });

    $('btnUnlockTarget').addEventListener('click', () => {
      if (state.core) {
        state.core.selection = null;
        state.core.lock = null;
      }
      $('btnUnlockTarget').style.display = 'none';
    });

    $('btnResetHorizon').addEventListener('click', () => {
      if (!state.stel) return;
      state.core.selection = null;
      const vec = state.stel.convertFrame(state.stel.observer, 'OBSERVED', 'ICRF', state.stel.s2c(48 * D2R, 24 * D2R));
      state.stel.lookAt(vec, 0.9);
      state.stel.zoomTo(72 * D2R, 0.9);
    });

    $('btnFullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Ultra Visuals Sliders & Chips
    $('rngExposure').addEventListener('input', (e) => {
      if (!state.core) return;
      state.core.exposure_scale = Number(e.target.value);
      syncUltraControls();
    });
    $('rngBortle').addEventListener('input', (e) => {
      if (!state.core) return;
      state.core.bortle_index = Number(e.target.value);
      syncUltraControls();
    });
    $('rngStarScale').addEventListener('input', (e) => {
      if (!state.core) return;
      state.core.star_relative_scale = Number(e.target.value);
      syncUltraControls();
    });

    $('fxTogglesRow').addEventListener('click', (ev) => {
      const chip = ev.target.closest('.fx-chip');
      if (!chip || !state.core) return;
      const key = chip.dataset.fx;
      const c = state.core;
      if (key === 'satellites') c.satellites.visible = !c.satellites.visible;
      if (key === 'ecliptic') c.lines.ecliptic.visible = !c.lines.ecliptic.visible;
      if (key === 'meridian') c.lines.meridian.visible = !c.lines.meridian.visible;
      if (key === 'hints') c.planets.hints_visible = !c.planets.hints_visible;
      if (key === 'bigmoon') c.planets.scale_moon = c.planets.scale_moon > 1.2 ? 1.0 : 4.0;
      syncUltraControls();
    });

    // Ultra Visuals 1-Click Tours & Flagship Presets
    $('fxPresetsRow').addEventListener('click', (ev) => {
      const btn = ev.target.closest('.preset-btn');
      if (!btn || !state.stel) return;
      const preset = btn.dataset.preset;
      if (preset.startsWith('world:')) {
        selectBusinessWorld(preset.slice(6), true);
        return;
      }
      const obj = state.stel.getObj(preset);
      if (obj) {
        state.stel.core.selection = obj;
        state.stel.pointAndLock(obj, 0.95);
        state.stel.zoomTo((preset === 'M31' || preset === 'M42' ? 6 : preset === 'NAME Moon' ? 4 : 18) * D2R, 0.95);
      }
    });

    // Observatory Location Popover
    $('cornerLocation').addEventListener('click', (e) => {
      e.stopPropagation();
      $('locPopover').classList.toggle('open');
    });
    $('locPopover').addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-loc]');
      if (!btn) return;
      const loc = OBSERVATORY_PRESETS.find((l) => l.key === btn.dataset.loc);
      if (loc) applyObserverLocation(loc, true);
      $('locPopover').classList.remove('open');
    });

    // Time Speed & Sky Jump Controls
    $('timeControls').addEventListener('click', (ev) => {
      const btn = ev.target.closest('button');
      if (!btn || !state.stel) return;
      const act = btn.dataset.tact;

      document.querySelectorAll('#timeControls button[data-tact="0"], #timeControls button[data-tact="1"], #timeControls button[data-tact="100"], #timeControls button[data-tact="1000"]').forEach((b) => {
        if (act === '0' || act === '1' || act === '100' || act === '1000') {
          b.classList.toggle('active', b === btn);
        }
      });

      if (act === '0' || act === '1' || act === '100' || act === '1000') {
        state.core.time_speed = Number(act);
      } else if (act === 'sunset') {
        state.stel.observer.utc = computeEveningTwilightMJD(state.stel);
        populatePaasWorldsLayer();
      } else if (act === 'plus2h') {
        state.stel.observer.utc += 2 / 24;
      }
    });

    // Populate Left Drawer on load
    $('countSitesBadge').textContent = `${WEBSITE_PLANETS.length}`;
    renderDrawerCards();
  }

  // --------------------------------------------------------------------------
  // 10. INITIALIZATION ON DOM READY
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    wireUIEvents();
    bootStellarium();
  });
})();
