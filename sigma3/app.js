(() => {
  'use strict';

  const state = {
    meta: null,
    macro: null,
    officials: [],
    bySlug: new Map(),
    riskBySlug: new Map(),
    circles: null,
    comp: null,
    deep: null,
    deepBySlug: new Map(),
    authorities: null,
    authoritiesByEik: new Map(),
    companies: null,
    companiesByEik: new Map(),
    forensics7: null,
    judicial6: null,
    sharedEiks: new Set(),
    trendMode: 'months',
    liveContractMode: 'top',
    atlasMetric: 'valueEur',
    selectedNuts3: 'BG411',
    deepTier: 'missed',
    deepConsSearch: '',
    hofMode: 'combined',
    filter: 'all',
    scope: 'all',
    sort: 'period',
    search: '',
    page: 1,
    pageSize: 100,
    authFilter: { search: '', region: '', type: '', sort: 'spent', flag: 'all', page: 1 },
    compFilter: { search: '', kind: 'all', sector: '', sort: 'won', flag: 'all', page: 1 },
    signalLastFile: 'SIGMA3_SIGNAL.md',
    signalLastText: '',
    graph: {
      nodes: [], edges: [], dragging: null, hovered: null,
      panX: 0, panY: 0, scale: 1, panning: false, lastX: 0, lastY: 0,
      raf: null, simSteps: 0,
    },
  };

  const fmtEur = (n) => {
    const v = Number(n || 0);
    if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2).replace('.', ',') + ' млрд. €';
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2).replace('.', ',') + ' млн. €';
    if (Math.abs(v) >= 1e3) return Math.round(v).toLocaleString('bg-BG') + ' €';
    return v.toFixed(0) + ' €';
  };
  const fmtInt = (n) => Number(n || 0).toLocaleString('bg-BG');
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const riskBadgeHtml = (score) => {
    const sc = Number(score || 0);
    const cls = sc >= 70 ? 'risk-crit' : sc >= 45 ? 'risk-high' : sc >= 20 ? 'risk-mid' : 'risk-low';
    return `<span class="risk-badge ${cls}">${sc}/100</span>`;
  };

  async function ensureAuthoritiesLoaded() {
    if (state.authorities) return state.authorities;
    const res = await fetch('data/authorities_index.json');
    const json = await res.json();
    state.authorities = (json.rows || []).map((r) => ({
      eik: r[0], name: r[1], type: r[2], settlement: r[3], region: r[4],
      spentEur: r[5], contracts: r[6], suppliers: r[7], avgEur: r[8],
      hhi: r[9], singleOffer: r[10], directAward: r[11],
      linkedCount: r[12], ownHits: r[13], riskScore: r[14],
    }));
    state.authorities.forEach((a) => { if (a.eik) state.authoritiesByEik.set(a.eik, a); });
    if (window.SIGMA3_J6) window.SIGMA3_J6.applyJudicialRiskWeightsToState();
    return state.authorities;
  }

  async function ensureCompaniesLoaded() {
    if (state.companies) return state.companies;
    const res = await fetch('data/companies_index.json');
    const json = await res.json();
    state.companies = (json.rows || []).map((r) => ({
      eik: r[0], name: r[1], isConsortium: r[2] === 1, settlement: r[3],
      wonEur: r[4], contracts: r[5], authorities: r[6], sector: r[7],
      linkedOfficials: r[8], consortiumCount: r[9], consortiumEur: r[10],
      judicialRiskScore: 0, judicialReasons: [],
    }));
    state.companies.forEach((c) => { if (c.eik) state.companiesByEik.set(c.eik, c); });
    if (window.SIGMA3_J6) window.SIGMA3_J6.applyJudicialRiskWeightsToState();
    return state.companies;
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + tabId));
    if (tabId === 'graph' && !state.graph.nodes.length && window.SIGMA3_MOD) {
      window.SIGMA3_MOD.buildGraphData(document.getElementById('graphPresetSelect').value);
    }
    if (tabId === 'forensics7' && window.SIGMA3_F7) window.SIGMA3_F7.loadAndRenderForensics7();
    if (tabId === 'judicial6' && window.SIGMA3_J6) window.SIGMA3_J6.loadAndRenderJudicial6();
    if (tabId === 'authorities' && window.SIGMA3_MOD) window.SIGMA3_MOD.loadAndRenderAuthorities();
    if (tabId === 'companies' && window.SIGMA3_MOD) window.SIGMA3_MOD.loadAndRenderCompanies();
    if (tabId === 'oracle' && window.SIGMA3_MOD) window.SIGMA3_MOD.ensureOracleReady();
  }

  function jumpToDirectory(opts = {}) {
    switchTab('directory');
    if (opts.filter !== undefined) state.filter = opts.filter;
    if (opts.search !== undefined) {
      state.search = opts.search;
      document.getElementById('searchInput').value = opts.search;
    }
    if (opts.sort !== undefined) {
      state.sort = opts.sort;
      document.getElementById('sortSelect').value = opts.sort;
    }
    state.page = 1;
    renderFilterPills();
    renderDirectory();
    const el = document.getElementById('mainTabs');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('sigma3_theme', theme); } catch {}
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = theme === 'dark' ? 'Светъл режим' : 'Тъмен режим';
  }

  async function init() {
    try {
      const savedTheme = (() => { try { return localStorage.getItem('sigma3_theme'); } catch { return null; } })();
      if (savedTheme === 'dark' || savedTheme === 'light') applyTheme(savedTheme);

      const [offRes, cirRes, compRes, deepRes, macroRes] = await Promise.all([
        fetch('data/officials_all.json'),
        fetch('data/circles_graph.json'),
        fetch('data/competition_stats.json'),
        fetch('data/deep_links.json').catch(() => null),
        fetch('data/sigma3_macro.json').catch(() => null),
      ]);
      const offJson = await offRes.json();
      const cirJson = await cirRes.json();
      const compJson = await compRes.json();
      const deepJson = deepRes && deepRes.ok ? await deepRes.json() : null;
      const macroJson = macroRes && macroRes.ok ? await macroRes.json() : null;

      state.meta = offJson.meta;
      state.officials = offJson.officials || [];
      state.circles = cirJson;
      state.comp = compJson;
      state.deep = deepJson;
      state.macro = macroJson;

      if (deepJson && deepJson.hiddenConsortiumLeaderboard) {
        deepJson.hiddenConsortiumLeaderboard.forEach((lb) => state.deepBySlug.set(lb.slug, lb));
      }
      (cirJson.sharedCompanies || []).forEach((sc) => state.sharedEiks.add(sc.eik));

      const riskEnrich = (macroJson && macroJson.riskEnrichment) || {};
      state.officials.forEach((o) => {
        const re = riskEnrich[o.slug];
        const dc = state.deepBySlug.get(o.slug);
        o.dzzdEur = re ? re.dzzdEur : (dc ? Number(dc.hiddenConsortiumEur || 0) : 0);
        o.dzzdCnt = re ? re.dzzdCnt : (dc ? Number(dc.hiddenConsortiumCount || 0) : 0);
        o.combinedEur = Number(o.totalEur || 0) + o.dzzdEur;
        o.sigma3Score = re ? re.score : o.riskScore;
        o.oblast = re ? re.oblast : '';
        o.riskBreakdown = re ? re.breakdown : null;
        state.bySlug.set(o.slug, o);
        if (re) state.riskBySlug.set(o.slug, re);
      });

      renderHeader();
      initLiveVisitorCounter();
      renderHallOfFamePyramid();
      renderDashboard();
      renderVisualCharts();
      renderAtlas();
      renderFilterPills();
      renderDirectory();
      renderDeepTab();
      if (window.SIGMA3_MOD) window.SIGMA3_MOD.initModules();
      if (window.SIGMA3_F7) window.SIGMA3_F7.ensureForensics7Loaded();
      if (window.SIGMA3_J6) window.SIGMA3_J6.ensureJudicial6Loaded();
      setupEvents();
    } catch (err) {
      console.error(err);
      const tb = document.getElementById('officialsTbody');
      if (tb) tb.innerHTML = `<tr><td colspan="7" class="loading" style="color:var(--crimson);">Грешка при зареждане: ${esc(err.message)}</td></tr>`;
    }
  }

  function renderHeader() {
    const mm = state.macro && state.macro.meta;
    const t = mm ? mm.totals : { contracts: 206907, valueEur: 53224934606, authorities: 4344, bidders: 17428 };
    const j6Date = (state.judicial6 && state.judicial6.generatedAtUtc) ? String(state.judicial6.generatedAtUtc).slice(0, 10) : '';
    const f7Date = (state.forensics7 && state.forensics7.generatedAtUtc) ? String(state.forensics7.generatedAtUtc).slice(0, 10) : '';
    const latestDate = [j6Date, f7Date, (mm && mm.asOf) || '', (state.meta && state.meta.asOf) || '', '2026-11-20'].filter(Boolean).sort().pop();
    const refreshed = latestDate || '2026-11-20';
    const asOf = latestDate || '2026-11-20';
    document.getElementById('syncSubtitle').textContent =
      `Жив масив sigma.midt.bg + Сметна палата + ТР + ЕПЕП/АДФИ/КЗК · Обновено: ${refreshed} · ${fmtInt(t.contracts)} дог. · ${fmtInt(t.authorities)} инст. · ${fmtInt(t.bidders)} фирми`;
    document.getElementById('asOfChip').textContent = `Данни към: ${asOf}`;
    document.getElementById('f1Val').textContent = fmtEur(t.valueEur);
    document.getElementById('f1Sub').textContent = `${fmtInt(t.contracts)} договора · ${fmtInt(t.authorities)} възложители · ${fmtInt(t.bidders)} фирми`;
    if (mm && mm.singleOffer) {
      document.getElementById('f2Val').textContent = fmtEur(mm.singleOffer.valueEur);
      document.getElementById('f2Sub').textContent = `${String(mm.singleOffer.valueShare).replace('.', ',')}% с 1 оферта · ${fmtEur((mm.procedure && mm.procedure.nonCompetitiveValueEur) || 5.92e9)} пряко`;
    }
    if (state.macro && state.macro.benford) {
      const ba = state.macro.benford.authorities;
      const pc = state.macro.benford.paretoCompanies;
      const ce = state.macro.cartelEngine;
      document.getElementById('heroCartelSub').textContent =
        `${ce.coBiddingPairsCount} ДЗЗД двойки · Топ 1% държат ${String(pc.top1Pct).replace('.', ',')}% (Gini ${String(pc.gini).replace('.', ',')})`;
      document.getElementById('heroCartelNum').textContent = `MAD ${String(ba.mad).replace('.', ',')}`;
    }
  }

  // ===== LIVE GLOBAL VISITOR COUNTER =====
  async function initLiveVisitorCounter() {
    const el = document.getElementById('visitorCountVal');
    if (!el) return;
    const FALLBACK_VISITS = 1420;
    if (!el.textContent || el.textContent.trim() === '—') {
      el.textContent = fmtInt(FALLBACK_VISITS);
    }
    const ns = 'sigma-2-0-radar-bg';
    const key = 'visits';
    const storageKey = 'sigma_radar_bg_counted_v1';
    const alreadyCounted = (() => { try { return sessionStorage.getItem(storageKey) === '1'; } catch { return false; } })();
    const endpoint = alreadyCounted ? `https://abacus.jasoncameron.dev/get/${ns}/${key}` : `https://abacus.jasoncameron.dev/hit/${ns}/${key}`;
    try {
      const res = await fetch(endpoint, { mode: 'cors', cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const target = Number(data && data.value);
      if (!Number.isFinite(target) || target <= 0) throw new Error('Invalid');
      try { sessionStorage.setItem(storageKey, '1'); } catch {}
      const start = Math.max(0, target - Math.min(target, 35));
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 520);
        el.textContent = fmtInt(Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    } catch {
      el.textContent = fmtInt(FALLBACK_VISITS);
    }
  }

  // ===== HALL OF FAME PYRAMID (TOP 50) =====
  function renderHallOfFamePyramid() {
    const host = document.getElementById('hofPyramid');
    if (!host || !state.officials.length) return;
    const mode = state.hofMode;
    let pool = [...state.officials];
    if (mode === 'own') pool = pool.filter((o) => o.ownInstitution).sort((a, b) => b.periodEur - a.periodEur || b.combinedEur - a.combinedEur);
    else if (mode === 'period') pool.sort((a, b) => b.periodEur - a.periodEur || b.combinedEur - a.combinedEur);
    else if (mode === 'dzzd') pool = pool.filter((o) => o.dzzdEur > 0).sort((a, b) => b.dzzdEur - a.dzzdEur || b.totalEur - a.totalEur);
    else if (mode === 'risk') pool.sort((a, b) => b.sigma3Score - a.sigma3Score || b.combinedEur - a.combinedEur);
    else pool.sort((a, b) => b.combinedEur - a.combinedEur || b.periodEur - a.periodEur);

    const top50 = pool.slice(0, 50);
    const rowSpecs = [
      { count: 1, rowCls: 'tier-apex', cardCls: 'rank-apex', level: 'apex' },
      { count: 2, rowCls: 'tier-2', cardCls: 'rank-upper', level: 'upper' },
      { count: 3, rowCls: 'tier-3', cardCls: 'rank-upper', level: 'upper' },
      { count: 4, rowCls: 'tier-4', cardCls: 'rank-mid', level: 'mid' },
      { count: 5, rowCls: 'tier-5', cardCls: 'rank-mid', level: 'mid' },
      { count: 6, rowCls: 'tier-6', cardCls: 'rank-mid', level: 'mid' },
      { count: 7, rowCls: 'tier-7', cardCls: 'rank-base', level: 'base' },
      { count: 10, rowCls: 'tier-base', cardCls: 'rank-base', level: 'base' },
      { count: 12, rowCls: 'tier-base', cardCls: 'rank-base', level: 'base' },
    ];
    const getVal = (o) => (mode === 'period' || mode === 'own') ? o.periodEur : mode === 'dzzd' ? o.dzzdEur : mode === 'risk' ? o.sigma3Score : o.combinedEur;

    let cursor = 0;
    host.innerHTML = rowSpecs.map((spec) => {
      const items = top50.slice(cursor, cursor + spec.count);
      if (!items.length) return '';
      const cardsHtml = items.map((o, idx) => {
        const rank = cursor + idx + 1;
        const val = getVal(o);
        const pills = [];
        if (o.ownInstitution) pills.push(`<span class="hof-pill hof-pill-own">Собств. инст.</span>`);
        if (o.dzzdEur > 0 && spec.level !== 'base') pills.push(`<span class="hof-pill hof-pill-dzzd">+ДЗЗД</span>`);
        const topComp = (o.companies && o.companies[0]) ? o.companies[0].name : '';
        let subline = '';
        if (spec.level === 'apex') subline = `<div class="hof-subline">${esc(topComp)} · СИГМА: ${fmtEur(o.totalEur)}${o.dzzdEur > 0 ? ' · ДЗЗД (' + o.dzzdCnt + '): +' + fmtEur(o.dzzdEur) : ''} · Риск: ${o.sigma3Score}/100</div>`;
        else if (spec.level === 'upper') subline = `<div class="hof-subline">${esc(topComp)}${o.dzzdEur > 0 ? ' · ДЗЗД: +' + fmtEur(o.dzzdEur) : ' · В мандата: ' + fmtEur(o.periodEur)}</div>`;
        else if (spec.level === 'mid') subline = `<div class="hof-subline">${o.dzzdEur > 0 ? 'ДЗЗД +' + fmtEur(o.dzzdEur) : esc(topComp)}</div>`;
        const valTxt = mode === 'risk' ? `Риск ${val}/100` : (mode === 'dzzd' ? '+' : '') + fmtEur(val);
        return `<div class="hof-card ${spec.cardCls} ${o.ownInstitution ? 'is-own' : ''}" data-open-slug="${esc(o.slug)}">
          <div>
            <div class="hof-card-top"><span class="hof-rank">#${String(rank).padStart(2, '0')}</span><div style="display:flex;gap:4px;flex-wrap:wrap;">${pills.join('')}</div></div>
            <div class="hof-name">${esc(o.name)}</div>
            <div class="hof-inst">${esc(o.primaryInstitution)}</div>
          </div>
          <div><div class="hof-amount">${valTxt}</div>${subline}</div>
        </div>`;
      }).join('');
      cursor += items.length;
      return `<div class="hof-row ${spec.rowCls}">${cardsHtml}</div>`;
    }).join('');

    const sumVal = top50.reduce((acc, o) => acc + (mode === 'risk' ? o.combinedEur : getVal(o)), 0);
    const ownIn50 = top50.filter((o) => o.ownInstitution).length;
    const sumEl = document.getElementById('hofSummaryText');
    if (sumEl) sumEl.innerHTML = `<strong>${top50.length} лица</strong> в пирамидата: <strong class="mono" style="color:#fbbf24;">${fmtEur(sumVal)}</strong> · От собствената институция: <strong style="color:#fda4af;">${ownIn50}</strong>`;
    if (mode === 'combined' && top50.length >= 3) {
      const teaser = document.getElementById('hofTriggerTeaser');
      if (teaser) teaser.textContent = `#01 ${top50[0].name} (${fmtEur(top50[0].combinedEur)}) · #02 ${top50[1].name} · #03 ${top50[2].name}`;
    }
  }

  // ===== TAB 1: MACRO COMMAND DASHBOARD =====
  function renderDashboard() {
    if (!state.macro) return;
    renderTrendsChart();
    renderSankey();
    renderCpvSectors();
    renderLiveSingleOfferFeed();
  }

  function renderTrendsChart() {
    const tr = state.macro.trends;
    if (!tr) return;
    const host = document.getElementById('trendChartHost');
    const strip = document.getElementById('trendYearsStrip');
    const items = state.trendMode === 'years' ? tr.years : tr.months;
    const maxV = Math.max(...items.map((x) => x.valueEur), 1);
    const w = 960;
    const h = 215;
    const padL = 56, padR = 16, padT = 18, padB = 34;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const bw = Math.max(4, plotW / items.length - (state.trendMode === 'years' ? 22 : 2.2));
    const stepX = plotW / items.length;

    const yGrid = [0, 0.25, 0.5, 0.75, 1].map((frac) => {
      const y = padT + plotH * (1 - frac);
      const val = maxV * frac;
      return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-dasharray="3 3" />
        <text x="${padL - 7}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--ink-muted)">${frac === 0 ? '0' : (val >= 1e9 ? (val / 1e9).toFixed(1) + 'B' : Math.round(val / 1e6) + 'M')}</text>`;
    }).join('');

    const bars = items.map((pt, i) => {
      const bh = Math.max(2, (pt.valueEur / maxV) * plotH);
      const x = padL + i * stepX + (stepX - bw) / 2;
      const y = padT + plotH - bh;
      const isPeak = tr.peakMonth && pt.period === tr.peakMonth.period;
      const fill = isPeak ? '#dc2626' : pt.partial ? '#94a3b8' : (state.trendMode === 'years' ? '#1e3a8a' : '#b91c1c');
      const lbl = pt.year || pt.period;
      const showTick = state.trendMode === 'years' || lbl.endsWith('-01') || i === items.length - 1;
      const tickHtml = showTick ? `<text x="${(x + bw / 2).toFixed(1)}" y="${h - 10}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--ink-muted)">${esc(lbl.slice(0, 7))}</text>` : '';
      return `<g>
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="1.5" fill="${fill}" opacity="${isPeak ? '1' : '0.86'}">
          <title>${esc(lbl)}: ${fmtEur(pt.valueEur)} (${fmtInt(pt.contracts)} дог.)${pt.partial ? ' · непълен период' : ''}</title>
        </rect>
        ${tickHtml}
      </g>`;
    }).join('');

    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;min-width:620px;display:block;">${yGrid}${bars}</svg>`;

    strip.innerHTML = tr.years.map((y) => {
      const yoy = y.yoyPct !== null ? `<span class="tag ${y.yoyPct >= 0 ? 'tag-crimson' : 'tag-teal'}">${y.yoyPct >= 0 ? '+' : ''}${String(y.yoyPct).replace('.', ',')}%</span>` : (y.partial ? `<span class="tag tag-slate">текуща</span>` : '');
      return `<div class="trend-yr-card">
        <div style="display:flex;justify-content:space-between;align-items:center;"><span class="yr">${esc(y.year)} г.</span>${yoy}</div>
        <div class="val">${fmtEur(y.valueEur)}</div>
        <div class="sub">${fmtInt(y.contracts)} договора</div>
      </div>`;
    }).join('');
  }

  function renderSankey() {
    const sk = state.macro && state.macro.sankey;
    const host = document.getElementById('sankeyHost');
    const readout = document.getElementById('sankeyReadout');
    if (!sk || !host) return;

    const ribbonsHtml = (sk.ribbons || []).map((rb, idx) => {
      const isCons = /ДЗЗД|КОНСОРЦИУМ|и др\./i.test(rb.toName);
      const col = isCons ? '#7e22ce' : '#b91c1c';
      return `<path class="sankey-ribbon" data-rb="${idx}" d="${esc(rb.d)}" fill="${col}" fill-opacity="0.34" stroke="${col}" stroke-opacity="0.22" stroke-width="0.6"><title>${esc(rb.title)}</title></path>`;
    }).join('');

    const nodesHtml = (sk.nodes || []).map((n) => {
      const isAuth = n.side === 'authority';
      const col = isAuth ? '#1e3a8a' : (/ДЗЗД|КОНСОРЦИУМ|и др\./i.test(n.name) ? '#7e22ce' : '#b45309');
      const tx = isAuth ? n.x - 7 : n.x + n.width + 7;
      const anchor = isAuth ? 'end' : 'start';
      const shortLbl = n.label.length > 34 ? n.label.slice(0, 33) + '…' : n.label;
      const slugId = (n.href || '').split('/').pop() || '';
      const clickAttr = isAuth && /^\d{9,13}$/.test(slugId)
        ? `data-open-authority="${esc(slugId)}"`
        : (!isAuth ? `data-open-company="${esc(/^\d{9,13}$/.test(slugId) ? slugId : n.name)}"` : '');
      return `<g ${clickAttr} style="cursor:pointer;">
        <rect class="sankey-node-rect" x="${n.x}" y="${n.y}" width="${n.width}" height="${Math.max(3, n.height)}" fill="${col}" rx="2">
          <title>${esc(n.name)} — ${fmtEur(n.valueEur)} (клик за досие)</title>
        </rect>
        <text x="${tx}" y="${(n.labelY + 3.5).toFixed(1)}" text-anchor="${anchor}" font-family="IBM Plex Sans, sans-serif" font-size="10.5" font-weight="${isAuth ? '600' : '500'}" fill="var(--ink)">${esc(shortLbl)}</text>
      </g>`;
    }).join('');

    host.innerHTML = `<svg class="sankey-svg" viewBox="${esc(sk.viewBox)}">${ribbonsHtml}${nodesHtml}</svg>`;
    host.querySelectorAll('.sankey-ribbon').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        const rb = sk.ribbons[Number(el.dataset.rb)];
        host.querySelectorAll('.sankey-ribbon').forEach((p) => p.setAttribute('fill-opacity', p === el ? '0.78' : '0.12'));
        if (rb && readout) {
          readout.innerHTML = `<strong>${esc(rb.fromName)}</strong> &rarr; <strong style="color:var(--crimson);">${esc(rb.toName)}</strong> · <span class="mono" style="font-weight:700;">${fmtEur(rb.valueEur)}</span> (${fmtInt(rb.contracts)} дог.)`;
        }
      });
      el.addEventListener('mouseleave', () => {
        host.querySelectorAll('.sankey-ribbon').forEach((p) => p.setAttribute('fill-opacity', '0.34'));
      });
    });
  }

  function renderCpvSectors() {
    const secs = (state.macro && state.macro.sectors) || [];
    const host = document.getElementById('cpvSectorsHost');
    if (!host || !secs.length) return;
    const maxV = Math.max(...secs.map((s) => s.wonEur), 1);
    host.innerHTML = secs.slice(0, 12).map((s) => {
      const totalW = Math.max(3, (s.wonEur / maxV) * 100);
      const consW = Math.min(100, s.consortiumShare);
      const dirW = Math.max(0, 100 - consW);
      return `<div class="hbar-item" data-cpv-sector="${esc(s.code)}">
        <div class="hbar-top">
          <span class="hbar-name"><span class="mono muted">CPV ${esc(s.code)}</span> · ${esc(s.label.length > 48 ? s.label.slice(0, 47) + '…' : s.label)}</span>
          <span class="hbar-val">${fmtEur(s.wonEur)} <span class="muted" style="font-weight:400;">(${s.consortiumShare}% ДЗЗД)</span></span>
        </div>
        <div class="hbar-track" style="width:${totalW}%;min-width:24px;">
          <div class="hbar-fill" style="width:${dirW}%;background:#1e3a8a;" title="Директни фирми"></div>
          <div class="hbar-fill" style="width:${consW}%;background:#7e22ce;" title="ДЗЗД консорциуми (${fmtEur(s.consortiumEur)})"></div>
        </div>
      </div>`;
    }).join('');
  }

  function renderLiveSingleOfferFeed() {
    const tl = state.macro && state.macro.topLists;
    const tbody = document.getElementById('liveSingleOfferTbody');
    if (!tl || !tbody) return;
    const list = state.liveContractMode === 'recent' ? (tl.recentSingleOffer || []) : (tl.topSingleOffer || []);
    tbody.innerHTML = list.map((c, idx) => `
      <tr style="cursor:default;">
        <td class="mono muted">${idx + 1}</td>
        <td class="mono" style="white-space:nowrap;">
          <div>${esc(c.signedAt)}</div>
          <div class="inst-line">УНП ${esc(c.unp)}</div>
        </td>
        <td>
          <div style="font-weight:600;color:var(--ink);">${esc(c.subject.length > 140 ? c.subject.slice(0, 139) + '…' : c.subject)}</div>
          <div class="inst-line">Възложител: <strong>${esc(c.authorityName)}</strong> · <span class="tag tag-slate">${esc(c.procedureLabel)}</span> ${c.euFunded ? '<span class="tag tag-navy">ЕС средства</span>' : ''} ${c.isConsortium ? '<span class="tag tag-plum">ДЗЗД</span>' : ''}</div>
        </td>
        <td><strong style="font-size:12.5px;">${esc(c.bidderName)}</strong></td>
        <td class="num" style="font-weight:700;color:var(--crimson);">${fmtEur(c.valueEur)}</td>
        <td style="white-space:nowrap;">
          <button type="button" class="btn btn-oracle" style="padding:4px 9px;font-size:11.5px;" data-inspect-contract="${esc(c.id)}">Провери JSON ↗</button>
        </td>
      </tr>`).join('');
  }

  // ===== LIVE REAL-TIME CONTRACT FORENSIC INSPECTOR (DIRECT CORS TO SIGMA.MIDT.BG) =====
  async function inspectContractLive(contractId) {
    const bd = document.getElementById('contractModalBackdrop');
    const titleEl = document.getElementById('contractModalTitle');
    const bodyEl = document.getElementById('contractModalBody');
    bd.classList.add('open');
    bd.setAttribute('aria-hidden', 'false');
    titleEl.textContent = 'Жива заявка към sigma.midt.bg…';
    bodyEl.innerHTML = `<div class="loading">Извличане на реален JSON договор <code>${esc(contractId)}</code> директно от сървъра на МИДТ…</div>`;

    const cleanId = contractId.replace(/^c:/, '');
    const apiUrl = `https://sigma.midt.bg/contracts/${encodeURIComponent(cleanId)}.json`;
    const webUrl = `https://sigma.midt.bg/contracts/${encodeURIComponent(cleanId)}`;
    try {
      const res = await fetch(apiUrl, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      titleEl.textContent = d.subject || `Договор № ${d.contractNumber || cleanId}`;

      const val = d.value || {};
      const coh = d.cohort && d.cohort.stats ? d.cohort.stats : null;
      const amends = d.amendments || [];
      const lots = (d.lots && d.lots.rows) || [];

      const cohortHtml = coh ? `
        <div class="drawer-section">
          <h4>Сравнение с CPV кохорта (Дивизия ${esc(coh.division)} · ${fmtInt(coh.pricedContracts)} договора)</h4>
          <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:0;">
            <div class="kpi-card"><div class="kpi-label">p25</div><div class="kpi-val" style="font-size:13px;">${fmtEur(coh.p25Eur)}</div></div>
            <div class="kpi-card"><div class="kpi-label">Медиана</div><div class="kpi-val" style="font-size:13px;">${fmtEur(coh.medianEur)}</div></div>
            <div class="kpi-card"><div class="kpi-label">p75</div><div class="kpi-val" style="font-size:13px;">${fmtEur(coh.p75Eur)}</div></div>
            <div class="kpi-card"><div class="kpi-label">p95</div><div class="kpi-val" style="font-size:13px;">${fmtEur(coh.p95Eur)}</div></div>
            <div class="kpi-card emphasis"><div class="kpi-label">p99</div><div class="kpi-val" style="font-size:13px;">${fmtEur(coh.p99Eur)}</div></div>
          </div>
          <div class="muted" style="font-size:12px;margin-top:7px;">Позиция на договора: <strong>${esc(d.cohort.band)}</strong> (${val.currentEur && coh.medianEur ? (val.currentEur / coh.medianEur).toFixed(1) + '× спрямо медианата на сектора' : '—'})</div>
        </div>` : '';

      const amendsHtml = amends.length ? amends.map((a) => `
        <div class="contract-row" style="border-left:3px solid ${a.suspect ? 'var(--crimson)' : 'var(--ochre)'};">
          <div style="display:flex;justify-content:space-between;"><strong>Анекс от ${esc(a.date)}</strong><span class="mono" style="color:var(--crimson);font-weight:700;">${a.deltaEur >= 0 ? '+' : ''}${fmtEur(a.deltaEur)} &rarr; ${fmtEur(a.valueAfterEur)}</span></div>
          ${a.suspect ? '<span class="tag tag-crimson">Подозрителен анекс</span>' : ''}
        </div>`).join('') : '<div class="muted">Няма регистрирани анекси за промяна на стойността.</div>';

      const lotsHtml = lots.length > 1 ? `
        <div class="drawer-section">
          <h4>Обособени позиции в същата процедура (УНП ${esc(d.unp)} · ${lots.length} позиции · Общо ${fmtEur(d.lots.signedTotalEur)})</h4>
          ${lots.map((l) => `<div class="contract-row" style="${l.isCurrent ? 'border-left:3px solid var(--crimson);' : ''}">
            <div style="display:flex;justify-content:space-between;gap:8px;">
              <strong>Поз. ${esc(l.lotLabel)}: ${esc(l.contractorName)}</strong>
              <span class="mono" style="font-weight:700;">${fmtEur(l.signingEur)}</span>
            </div>
            <div class="inst-line">${esc(l.subject)}</div>
          </div>`).join('')}
        </div>` : '';

      bodyEl.innerHTML = `
        <div class="badges" style="margin-bottom:14px;">
          <span class="tag ${d.bidsReceived === 1 ? 'tag-crimson' : 'tag-teal'}">Получени оферти: ${d.bidsReceived ?? '—'} (отхвърлени: ${d.bidsRejected ?? 0}, МСП: ${d.bidsSme ?? 0})</span>
          <span class="tag tag-slate">${esc(d.procedureLabel)}</span>
          <span class="tag ${val.suspect ? 'tag-crimson' : 'tag-teal'}">Флаг стойност: ${esc(val.flag || 'ok')}</span>
          ${d.euFunded ? `<span class="tag tag-navy">ЕС: ${esc(d.euProgramme || 'Да')}</span>` : ''}
          <a class="tag tag-plum" href="${esc(webUrl)}" target="_blank" rel="noopener">Отвори в sigma.midt.bg ↗</a>
        </div>

        <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="kpi-card"><div class="kpi-label">Прогнозна стойност</div><div class="kpi-val" style="font-size:16px;">${val.estimatedEur ? fmtEur(val.estimatedEur) : '—'}</div></div>
          <div class="kpi-card"><div class="kpi-label">При подписване</div><div class="kpi-val" style="font-size:16px;">${fmtEur(val.signingEur)}</div></div>
          <div class="kpi-card emphasis"><div class="kpi-label">Текуща стойност</div><div class="kpi-val" style="font-size:16px;">${fmtEur(val.currentEur)}</div></div>
        </div>

        <div class="drawer-section">
          <h4>Страни и метаданни</h4>
          <div class="contract-row"><strong>Възложител:</strong> ${esc(d.authority && d.authority.name)} <span class="mono muted">(ЕИК ${esc(d.authority && d.authority.eik)})</span></div>
          <div class="contract-row"><strong>Изпълнител:</strong> ${esc(d.bidder && d.bidder.name)} <span class="mono muted">${d.bidder && d.bidder.eik ? '(ЕИК ' + esc(d.bidder.eik) + ')' : '(ДЗЗД)'}</span></div>
          <div class="contract-row"><strong>УНП:</strong> <span class="mono">${esc(d.unp)}</span> · <strong>Договор №:</strong> <span class="mono">${esc(d.contractNumber)}</span> · <strong>Подписан:</strong> <span class="mono">${esc(d.signedAt)}</span> · <strong>Публикуван:</strong> <span class="mono">${esc(d.publishedAt)}</span> · <strong>CPV:</strong> <span class="mono">${esc(d.cpvCode)}</span> (${esc(d.cpvDescription)})</div>
        </div>

        ${cohortHtml}
        <div class="drawer-section"><h4>Анекси (${amends.length})</h4>${amendsHtml}</div>
        ${lotsHtml}
      `;
    } catch (e) {
      bodyEl.innerHTML = `<div class="contract-row" style="border-left:3px solid var(--crimson);">
        <strong>Неуспешна жива заявка (${esc(e.message)})</strong><br/>
        Можете да отворите договора директно в официалния портал: <a href="${esc(webUrl)}" target="_blank" rel="noopener">${esc(webUrl)} ↗</a>
      </div>`;
    }
  }

  // ===== CLASSIC 2x2 CITIZEN VISUAL CHARTS =====
  function renderVisualCharts() {
    const sectors = (state.circles.circleSummary || []).slice(0, 7);
    const totalPeriod = state.meta.totalPeriodEur || 1;
    const maxSec = Math.max(...sectors.map((s) => s.periodEur), 1);
    const sectorToFilter = (name) => {
      if (name.includes('Общини')) return 'municipal';
      if (name.includes('Народно събрание')) return 'parliament';
      if (name.includes('Служби')) return 'security';
      if (name.includes('Централна') || name.includes('Областни')) return 'central';
      if (name.includes('болници')) return 'health';
      if (name.includes('дружества')) return 'state_co';
      return 'all';
    };

    document.getElementById('chartSectorBars').innerHTML = sectors.map((s, idx) => {
      const pctWidth = Math.max(2, (s.periodEur / maxSec) * 100);
      const sharePct = ((s.periodEur / totalPeriod) * 100).toFixed(1).replace('.', ',');
      const fillCol = idx === 0 ? '#b91c1c' : idx === 1 ? '#1e3a8a' : '#475569';
      return `<div class="hbar-item" data-chart-filter="${sectorToFilter(s.circle)}">
        <div class="hbar-top">
          <span class="hbar-name">${esc(s.circle)} <span class="muted" style="font-weight:400;">(${s.officialCount} лица)</span></span>
          <span class="hbar-val">${fmtEur(s.periodEur)} <span class="muted" style="font-weight:400;">(${sharePct}%)</span></span>
        </div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${pctWidth}%;background:${fillCol};"></div></div>
      </div>`;
    }).join('');

    const ownCnt = state.officials.filter((o) => o.ownInstitution).length;
    const inPeriodOtherCnt = state.officials.filter((o) => !o.ownInstitution && o.inCore512 && o.hasContemporaneous).length;
    const histCoreCnt = state.officials.filter((o) => !o.ownInstitution && o.inCore512 && !o.hasContemporaneous).length;
    const boardOnlyCnt = state.officials.filter((o) => !o.inCore512).length;
    const totalN = state.officials.length || 1;
    const slices = [
      { label: 'От собствената институция', count: ownCnt, color: '#b91c1c', filter: 'own' },
      { label: 'В мандата (друга институция)', count: inPeriodOtherCnt, color: '#b45309', filter: 'all' },
      { label: 'Историческа / извън мандата', count: histCoreCnt, color: '#1e3a8a', filter: 'all' },
      { label: 'Членове на съвети', count: boardOnlyCnt, color: '#94a3b8', filter: 'all' },
    ];
    const r = 64, circ = 2 * Math.PI * r;
    let offset = 0;
    const arcsSvg = slices.map((sl) => {
      const len = (sl.count / totalN) * circ;
      const svg = `<circle cx="90" cy="90" r="${r}" fill="none" stroke="${sl.color}" stroke-width="24"
        stroke-dasharray="${len.toFixed(2)} ${(circ - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"
        transform="rotate(-90 90 90)" style="cursor:pointer;" data-chart-filter="${sl.filter}" />`;
      offset += len;
      return svg;
    }).join('');
    document.getElementById('chartDonutWrap').innerHTML = `
      <svg viewBox="0 0 180 180" width="174" height="174" aria-label="571 лица">
        ${arcsSvg}
        <text x="90" y="86" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="24" font-weight="700" fill="var(--ink)">${totalN}</text>
        <text x="90" y="104" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="11" fill="var(--ink-muted)">общо лица</text>
      </svg>
      <ul class="donut-legend">${slices.map((sl) => `<li data-chart-filter="${sl.filter}">
        <span><i class="dot" style="background:${sl.color};margin-right:7px;"></i>${sl.label}</span>
        <span class="mono" style="font-weight:600;">${sl.count} <span class="muted" style="font-weight:400;">(${((sl.count / totalN) * 100).toFixed(1)}%)</span></span>
      </li>`).join('')}</ul>`;

    const top10 = [...state.officials].sort((a, b) => b.periodEur - a.periodEur).slice(0, 10);
    const maxTop = Math.max(...top10.map((o) => o.periodEur), 1);
    document.getElementById('chartTop10Bars').innerHTML = top10.map((o) => {
      const w = Math.max(3, (o.periodEur / maxTop) * 100);
      return `<div class="hbar-item" data-open-slug="${esc(o.slug)}">
        <div class="hbar-top">
          <span class="hbar-name">${esc(o.name)} <span class="muted" style="font-weight:400;">· ${esc(o.primaryInstitution)}</span></span>
          <span class="hbar-val" style="color:${o.ownInstitution ? 'var(--crimson)' : 'var(--ink)'};">${fmtEur(o.periodEur)}</span>
        </div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${w}%;background:${o.ownInstitution ? '#b91c1c' : '#334155'};"></div></div>
      </div>`;
    }).join('');

    const nat = (state.comp && state.comp.totals) || {};
    const proc = (state.comp && state.comp.procedure) || {};
    const soValPct = ((nat.singleOfferValueShare || 0.4066) * 100).toFixed(1);
    const multiValPct = (100 - Number(soValPct)).toFixed(1);
    const soCntPct = ((nat.singleOfferShare || 0.454) * 100).toFixed(1);
    const multiCntPct = (100 - Number(soCntPct)).toFixed(1);
    const nonCompPct = ((proc.nonCompetitiveShare || 0.1353) * 100).toFixed(1);
    const compPct = (100 - Number(nonCompPct)).toFixed(1);
    document.getElementById('chartCompetitionGauge').innerHTML = `
      <div class="gauge-block">
        <div class="hbar-top"><span class="hbar-name">По стойност (€45,49 млрд. с данни за оферти)</span><span class="hbar-val" style="color:var(--crimson);">${soValPct}% без конкуренция</span></div>
        <div class="gauge-bar"><div class="gauge-seg" style="width:${soValPct}%;background:#b91c1c;">${soValPct}% (${fmtEur(nat.singleOfferValueEur || 18.5e9)})</div><div class="gauge-seg" style="width:${multiValPct}%;background:#334155;">${multiValPct}% с 2+</div></div>
      </div>
      <div class="gauge-block">
        <div class="hbar-top"><span class="hbar-name">По брой договори (${fmtInt(nat.contracts || 184993)} класифицирани)</span><span class="hbar-val" style="color:var(--ochre);">${soCntPct}% с 1 участник</span></div>
        <div class="gauge-bar"><div class="gauge-seg" style="width:${soCntPct}%;background:#b45309;">${fmtInt(nat.singleOffer || 83993)} дог.</div><div class="gauge-seg" style="width:${multiCntPct}%;background:#64748b;">2+ оферти</div></div>
      </div>
      <div class="gauge-block" style="margin-bottom:0;">
        <div class="hbar-top"><span class="hbar-name">Неконкурентни процедури / пряко договаряне</span><span class="hbar-val" style="color:var(--plum);">${nonCompPct}% (${fmtEur(proc.nonCompetitiveValueEur || 5.92e9)})</span></div>
        <div class="gauge-bar"><div class="gauge-seg" style="width:${nonCompPct}%;background:#6b21a8;">${nonCompPct}%</div><div class="gauge-seg" style="width:${compPct}%;background:#94a3b8;color:#111827;">${compPct}% състезателни</div></div>
      </div>`;
  }

  // ===== TAB 2: 28-OBLAST INTERACTIVE GISCO CARTOGRAPHIC RISK ATLAS =====
  function renderAtlas() {
    const mg = state.macro && state.macro.mapGeo;
    if (!mg || !mg.oblasts) return;
    const metric = state.atlasMetric;
    const titles = {
      valueEur: 'Общи разходи по обществени поръчки (€)',
      riskScore: 'NAsvetlo Съставен индекс на риска (0–100)',
      ownHits: 'Случаи на самовъзлагане (От собствената институция)',
      officialCount: 'Брой свързани длъжностни лица (СИГМА)',
      hiddenDzzdEur: 'Скрити ДЗЗД консорциуми на политици (€)',
    };
    document.getElementById('atlasMapTitle').textContent = `Карта на България — ${titles[metric]}`;

    const vals = mg.oblasts.map((o) => Number(o[metric] || 0));
    const maxV = Math.max(...vals, 1);
    const useLog = metric === 'valueEur' || metric === 'hiddenDzzdEur';

    const palette = metric === 'riskScore' || metric === 'ownHits'
      ? ['#fef2f2', '#fecaca', '#f87171', '#dc2626', '#991b1b']
      : metric === 'hiddenDzzdEur'
      ? ['#faf5ff', '#e9d5ff', '#c084fc', '#9333ea', '#581c87']
      : ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a'];

    const colorFor = (v) => {
      if (v <= 0) return palette[0];
      const norm = useLog ? Math.log1p(v) / Math.log1p(maxV) : v / maxV;
      const idx = Math.min(palette.length - 1, Math.max(1, Math.ceil(norm * (palette.length - 1))));
      return palette[idx];
    };

    const polys = mg.oblasts.map((ob) => {
      const v = Number(ob[metric] || 0);
      const sel = ob.nuts3 === state.selectedNuts3 ? 'selected' : '';
      const shortN = ob.name.replace(' (столица)', ' (гр.)');
      return `<g data-select-oblast="${esc(ob.nuts3)}">
        <path class="oblast-poly ${sel}" d="${esc(ob.d)}" fill="${colorFor(v)}">
          <title>${esc(ob.name)} (${ob.nuts3}): ${useLog ? fmtEur(v) : v} · Риск ${ob.riskScore}/100</title>
        </path>
        <text class="oblast-lbl" x="${ob.cx}" y="${ob.cy}">${esc(shortN)}</text>
      </g>`;
    }).join('');

    document.getElementById('bulgariaSvgHost').innerHTML = `<svg class="bg-map-svg" viewBox="${esc(mg.viewBox)}" role="img" aria-label="Карта на 28-те области в България">${polys}</svg>`;
    document.getElementById('atlasLegend').innerHTML = `<span>Ниско</span>${palette.map((c) => `<i class="atlas-swatch" style="background:${c};"></i>`).join('')}<span>Високо (${useLog ? fmtEur(maxV) : maxV})</span>`;

    // Render Selected Oblast Detail Panel
    const ob = mg.oblasts.find((x) => x.nuts3 === state.selectedNuts3) || mg.oblasts[0];
    if (ob) {
      document.getElementById('atlasDetailBox').innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
          <div>
            <div class="kpi-label">${esc(ob.nuts3)} · ${esc(ob.nuts2Name)}</div>
            <h3 style="margin:4px 0 6px;border:none;padding:0;font-size:22px;">Област ${esc(ob.name)}</h3>
          </div>
          ${riskBadgeHtml(ob.riskScore)}
        </div>
        <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr);margin:10px 0 14px;">
          <div class="kpi-card"><div class="kpi-label">Общо поръчки</div><div class="kpi-val" style="font-size:17px;">${fmtEur(ob.valueEur)}</div><div class="kpi-sub">${fmtInt(ob.contracts)} дог. · ${ob.authorities} възл.</div></div>
          <div class="kpi-card emphasis"><div class="kpi-label">Свързани лица / Собств.</div><div class="kpi-val" style="font-size:17px;">${ob.officialCount} / ${ob.ownHits}</div><div class="kpi-sub">В мандата: ${fmtEur(ob.officialPeriodEur)}</div></div>
          <div class="kpi-card"><div class="kpi-label">Скрити ДЗЗД (политици)</div><div class="kpi-val" style="font-size:16px;color:var(--plum);">${fmtEur(ob.hiddenDzzdEur)}</div></div>
          <div class="kpi-card"><div class="kpi-label">Средно на възложител</div><div class="kpi-val" style="font-size:16px;">${fmtEur(ob.avgPerAuthority)}</div></div>
        </div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px;">
          <button type="button" class="btn btn-dark" data-atlas-jump-auth="${esc(ob.name)}">Виж всички ${ob.authorities} възложители</button>
          <button type="button" class="btn" data-atlas-jump-off="${esc(ob.name.replace(' (столица)', ''))}">Филтрирай 571 лица</button>
        </div>
        <div class="drawer-section" style="margin-bottom:12px;padding-bottom:10px;">
          <h4>Най-големи възложители в областта</h4>
          ${(ob.topAuthorities || []).map((a) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;">
            <a href="#" data-open-authority="${esc(a.eik)}">${esc(a.name)}</a>
            <span class="mono" style="font-weight:600;white-space:nowrap;">${fmtEur(a.spentEur)}</span>
          </div>`).join('')}
        </div>
        <div>
          <h4 style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:var(--ink-muted);">Топ свързани длъжностни лица в областта (${ob.officialCount})</h4>
          <ul class="cluster-people">
            ${(ob.topOfficials || []).length ? ob.topOfficials.map((p) => `<li data-open-slug="${esc(p.slug)}">
              <span>${p.own ? '<i class="dot" style="background:#b91c1c;margin-right:5px;"></i>' : ''}<strong>${esc(p.name)}</strong> <span class="muted">· ${esc(p.inst)}</span></span>
              <span class="mono">${fmtEur(p.periodEur || p.totalEur)}</span>
            </li>`).join('') : '<li style="cursor:default;" class="muted">Няма индексирани свързани лица в областта.</li>'}
          </ul>
        </div>`;
    }

    const sortedOb = [...mg.oblasts].sort((a, b) => Number(b[metric] || 0) - Number(a[metric] || 0));
    document.getElementById('atlasTableTbody').innerHTML = sortedOb.map((o, idx) => `
      <tr data-select-oblast="${esc(o.nuts3)}" style="${o.nuts3 === state.selectedNuts3 ? 'background:var(--surface-hover);' : ''}">
        <td class="mono muted">${idx + 1}</td>
        <td><strong>${esc(o.name)}</strong> <span class="eik-tag">${esc(o.nuts3)}</span></td>
        <td class="muted">${esc(o.nuts2Name)}</td>
        <td class="num" style="font-weight:700;">${fmtEur(o.valueEur)}</td>
        <td class="num">${fmtInt(o.contracts)}</td>
        <td class="num">${fmtInt(o.authorities)}</td>
        <td class="num">${o.officialCount}</td>
        <td class="num" style="color:${o.ownHits > 0 ? 'var(--crimson)' : 'var(--ink-muted)'};font-weight:700;">${o.ownHits}</td>
        <td class="num" style="color:var(--plum);">${o.hiddenDzzdEur > 0 ? '+' + fmtEur(o.hiddenDzzdEur) : '—'}</td>
        <td class="num">${riskBadgeHtml(o.riskScore)}</td>
      </tr>`).join('');
  }

  // ===== TAB 3: DIRECTORY OF 571 OFFICIALS =====
  function getScopedOfficials() {
    return state.scope === 'core512' ? state.officials.filter((o) => o.inCore512) : state.officials;
  }

  function matchCategory(o, filterKey) {
    switch (filterKey) {
      case 'own': return o.ownInstitution;
      case 'dzzd': return o.dzzdEur > 0;
      case 'highrisk': return o.sigma3Score >= 50;
      case 'parliament': return o.circle.includes('Народно събрание');
      case 'security': return o.circle.includes('Служби за сигурност');
      case 'central': return o.circle.includes('Централна власт') || o.circle.includes('Областни');
      case 'municipal': return o.circle.includes('Общини');
      case 'health': return o.circle.includes('болници');
      case 'state_co': return o.circle.includes('Държавни и общински дружества');
      case 'registry': return o.hasRegistryRole || o.omissionsCount > 0;
      case 'family': return o.hasFamilyStake || (o.relatives && o.relatives.length > 0);
      case 'shared': return o.companies.some((c) => state.sharedEiks.has(c.eik));
      case 'burgas': return o.isBurgas;
      default: return true;
    }
  }

  function renderFilterPills() {
    const base = getScopedOfficials();
    const defs = [
      { key: 'all', label: 'Всички', dot: '' },
      { key: 'own', label: 'Самовъзлагане', dot: '#b91c1c' },
      { key: 'dzzd', label: 'Скрити ДЗЗД', dot: '#7e22ce' },
      { key: 'highrisk', label: 'Висок риск ≥50', dot: '#dc2626' },
      { key: 'parliament', label: 'Депутати', dot: '#1e3a8a' },
      { key: 'security', label: 'ДАНС/ДАТО/МВР', dot: '#131720' },
      { key: 'central', label: 'Министерства/Агенции', dot: '#0369a1' },
      { key: 'municipal', label: 'Общини и ОбС', dot: '#b45309' },
      { key: 'health', label: 'Болници', dot: '#0f766e' },
      { key: 'registry', label: 'Роли по ТР', dot: '#6b21a8' },
      { key: 'shared', label: 'Споделени фирми', dot: '#be123c' },
      { key: 'burgas', label: 'Област Бургас', dot: '#0284c7' },
    ];
    document.getElementById('filterPills').innerHTML = defs.map((d) => {
      const cnt = base.filter((o) => matchCategory(o, d.key)).length;
      const dotHtml = d.dot ? `<i class="dot" style="background:${d.dot};"></i>` : '';
      return `<button class="pill ${state.filter === d.key ? 'active' : ''}" data-filter="${d.key}">${dotHtml}${d.label}<span class="cnt">${cnt}</span></button>`;
    }).join('');
  }

  function getFilteredOfficials() {
    const q = state.search.trim().toLowerCase();
    let list = getScopedOfficials().filter((o) => matchCategory(o, state.filter));
    if (q) {
      list = list.filter((o) =>
        o.name.toLowerCase().includes(q) ||
        o.primaryInstitution.toLowerCase().includes(q) ||
        (o.oblast && o.oblast.toLowerCase().includes(q)) ||
        o.circle.toLowerCase().includes(q) ||
        o.companies.some((c) => c.name.toLowerCase().includes(q) || c.eik.includes(q)) ||
        o.institutions.some((i) => i.institution.toLowerCase().includes(q) || i.positions.some((p) => p.toLowerCase().includes(q))) ||
        (o.relatives || []).some((r) => r.name.toLowerCase().includes(q)) ||
        (o.byAuthority || []).some((a) => a.name.toLowerCase().includes(q))
      );
    }
    const s = state.sort;
    return [...list].sort((a, b) => {
      if (s === 'combined') return b.combinedEur - a.combinedEur;
      if (s === 'risk') return b.sigma3Score - a.sigma3Score || b.combinedEur - a.combinedEur;
      if (s === 'total') return b.totalEur - a.totalEur;
      if (s === 'own') return (b.ownInstitution - a.ownInstitution) || (b.periodEur - a.periodEur);
      if (s === 'contracts') return b.contractCount - a.contractCount;
      if (s === 'name') return a.name.localeCompare(b.name, 'bg');
      return b.periodEur - a.periodEur || b.combinedEur - a.combinedEur;
    });
  }

  function renderDirectory() {
    const list = getFilteredOfficials();
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.pageSize;
    const slice = list.slice(start, start + state.pageSize);

    const tbody = document.getElementById('officialsTbody');
    if (!slice.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="loading">Няма намерени записи по зададените критерии.</td></tr>`;
    } else {
      tbody.innerHTML = slice.map((o, idx) => {
        const instLines = o.institutions.slice(0, 2).map((i) => {
          const pos = i.positions.slice(0, 2).join(', ');
          const yrs = i.years.length ? ` (${i.years[0]}–${i.years[i.years.length - 1]})` : '';
          return `<div class="inst-line">${esc(i.institution)}${pos ? ' · ' + esc(pos) : ''}${yrs}</div>`;
        }).join('');
        const compHtml = o.companies.map((c) => {
          const sharedTag = state.sharedEiks.has(c.eik) ? `<span class="tag tag-plum" style="margin-left:4px;">споделена</span>` : '';
          return `<div class="comp-item"><span class="comp-name">${esc(c.name)}</span><span class="eik-tag">ЕИК ${esc(c.eik)}</span>${sharedTag}</div>`;
        }).join('');
        const badges = [];
        if (o.ownInstitution) badges.push(`<span class="tag tag-crimson">Самовъзлагане</span>`);
        if (o.dzzdEur > 0) badges.push(`<span class="tag tag-plum">+${fmtEur(o.dzzdEur)} ДЗЗД</span>`);
        if (o.hasContemporaneous) badges.push(`<span class="tag tag-ochre">В периода</span>`);
        if (o.hasRegistryRole) badges.push(`<span class="tag tag-navy">Роля по ТР</span>`);
        if (o.boardOnly) badges.push(`<span class="tag tag-slate">Съвет</span>`);
        return `<tr data-slug="${esc(o.slug)}">
          <td class="mono muted">${start + idx + 1}</td>
          <td><span class="official-name">${esc(o.name)}</span>${instLines}${o.oblast ? `<div class="inst-line">Област: <strong>${esc(o.oblast)}</strong></div>` : ''}</td>
          <td>${compHtml}</td>
          <td><div style="font-size:11.5px;color:var(--ink-muted);">${esc(o.circle)}</div><div class="badges">${badges.join('')}</div></td>
          <td class="num" style="font-weight:700;color:${o.periodEur > 0 ? 'var(--ink)' : 'var(--ink-muted)'};">${fmtEur(o.periodEur)}</td>
          <td class="num"><div style="font-weight:700;">${fmtEur(o.combinedEur)}</div><div class="inst-line">${fmtInt(o.contractCount)} дог.${o.dzzdCnt ? ' + ' + o.dzzdCnt + ' ДЗЗД' : ''}</div></td>
          <td class="num">${riskBadgeHtml(o.sigma3Score)}</td>
        </tr>`;
      }).join('');
    }
    document.getElementById('pagerBar').innerHTML = `
      <div class="muted">Показани <strong>${slice.length}</strong> от <strong>${total}</strong> лица (стр. ${state.page}/${totalPages})</div>
      <div style="display:flex;gap:6px;">
        <button class="btn" id="pgPrev" ${state.page <= 1 ? 'disabled' : ''}>Предишна</button>
        <button class="btn" id="pgNext" ${state.page >= totalPages ? 'disabled' : ''}>Следваща</button>
      </div>`;
    const prev = document.getElementById('pgPrev');
    const next = document.getElementById('pgNext');
    if (prev) prev.onclick = () => { if (state.page > 1) { state.page--; renderDirectory(); } };
    if (next) next.onclick = () => { if (state.page < totalPages) { state.page++; renderDirectory(); } };
  }

  // ===== MANDATE VS CONTRACTS TIMELINE + OFFICIAL DOSSIER DRAWER =====
  function buildMandateTimelineHtml(o) {
    const officeYears = new Set();
    (o.institutions || []).forEach((i) => (i.years || []).forEach((y) => officeYears.add(String(y).slice(0, 4))));
    const byYrEur = {};
    (o.topContracts || []).forEach((ct) => {
      const yr = String(ct.signedAt || '').slice(0, 4);
      if (yr) byYrEur[yr] = (byYrEur[yr] || 0) + Number(ct.valueEur || 0);
    });
    const years = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
    const maxY = Math.max(...years.map((y) => byYrEur[y] || 0), 1);
    return `<div class="timeline-grid">${years.map((yr) => {
      const inOff = officeYears.has(yr);
      const val = byYrEur[yr] || 0;
      const overlap = inOff && val > 0;
      const bh = val > 0 ? Math.max(5, Math.round((val / maxY) * 40)) : 2;
      const col = overlap ? '#dc2626' : val > 0 ? '#b45309' : 'var(--border)';
      return `<div class="tl-col ${overlap ? 'tl-overlap' : inOff ? 'tl-office' : ''}" title="${yr}: ${inOff ? 'В длъжност' : 'Извън декл. год.'} · Топ дог.: ${fmtEur(val)}">
        <div class="tl-yr">${yr}</div>
        <div class="tl-bar-wrap"><div class="tl-bar" style="height:${bh}px;background:${col};"></div></div>
        <div class="tl-lbl">${overlap ? 'СЪВП.' : inOff ? 'МАНДАТ' : (val > 0 ? 'ДОГ.' : '—')}</div>
      </div>`;
    }).join('')}</div>`;
  }

  function openDossier(slug) {
    const o = state.bySlug.get(slug);
    if (!o) return;
    document.getElementById('drawerCircle').textContent = `${o.circle}${o.oblast ? ' · Област ' + o.oblast : ''}`;
    document.getElementById('drawerName').textContent = o.name;

    const badges = [riskBadgeHtml(o.sigma3Score)];
    if (o.ownInstitution) badges.push(`<span class="tag tag-crimson">Самовъзлагане</span>`);
    if (o.dzzdEur > 0) badges.push(`<span class="tag tag-plum">+${fmtEur(o.dzzdEur)} ДЗЗД</span>`);
    if (o.hasContemporaneous) badges.push(`<span class="tag tag-ochre">В периода</span>`);
    if (o.hasRegistryRole) badges.push(`<span class="tag tag-navy">Роля по ТР</span>`);
    badges.push(`<a class="tag tag-slate" href="${esc(o.sigmaUrl)}" target="_blank" rel="noopener">СИГМА 2.0 ↗</a>`);
    document.getElementById('drawerBadges').innerHTML = badges.join('');

    const rb = o.riskBreakdown;
    const j6 = state.judicial6;
    const compRiskAlerts = [];
    if (j6 && j6.riskAdjustments && j6.riskAdjustments.companies) {
      o.companies.forEach((c) => {
        const cr = c.eik && j6.riskAdjustments.companies[c.eik];
        if (cr) compRiskAlerts.push(`${c.name} (${c.eik}): Риск ${cr.score}/100 — ${(cr.reasons || []).join('; ')}`);
      });
    }
    const riskExplain = rb ? `<div class="contract-row" style="border-left:3px solid var(--crimson);font-size:12px;">
      <strong>Разбивка на NAsvetlo Риск индекс (${o.sigma3Score}/100):</strong>
      Самовъзлагане: <b>+${rb.own}</b> · В периода: <b>+${rb.period}</b> · Скрити ДЗЗД: <b>+${rb.dzzd}</b> · Роля/пропуск ТР: <b>+${rb.registry}</b> · Споделена фирма: <b>+${rb.shared}</b> · Свързано лице: <b>+${rb.family}</b>
      ${compRiskAlerts.length ? `<div style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--border);color:var(--crimson);"><strong>Съдебен / Криминалистичен слой (13 радара):</strong> ${compRiskAlerts.map((x) => esc(x)).join(' | ')}</div>` : ''}
    </div>` : '';

    const instHtml = o.institutions.map((i) => `<div class="contract-row"><strong>${esc(i.institution)}</strong><br/><span class="muted">${esc(i.positions.join('; '))} · Години: ${esc(i.years.join(', '))}</span></div>`).join('');
    const compHtml = o.companies.map((c) => `<div class="contract-row">
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <strong><a href="#" data-open-company="${esc(c.eik)}">${esc(c.name)}</a></strong>
        <span class="mono muted">ЕИК ${esc(c.eik)}</span>
      </div>
      <div class="muted" style="margin-top:3px;">Основание: ${esc(c.roles.join(', '))}${c.missingYears && c.missingYears.length ? ` · Липсва в декл.: <strong style="color:var(--crimson);">${esc(c.missingYears.join(', '))}</strong>` : ''}</div>
    </div>`).join('');

    const relHtml = (o.relatives && o.relatives.length) ? `<div class="drawer-section"><h4>Свързани лица (Търговски регистър)</h4>${o.relatives.map((r) => `<div class="contract-row"><strong style="color:var(--plum);">${esc(r.name)}</strong> <span class="muted">(${esc(r.role)})</span></div>`).join('')}</div>` : '';

    const dc = state.deepBySlug.get(o.slug);
    const dzzdHtml = dc ? `<div class="drawer-section">
      <h4 style="color:var(--plum);">Отвъд СИГМА 2.0: Скрити консорциуми (ДЗЗД) — +${fmtEur(dc.hiddenConsortiumEur)} (${dc.hiddenConsortiumCount} ДЗЗД)</h4>
      ${dc.topConsortia.map((tc) => `<div class="contract-row" style="border-left:3px solid var(--plum);">
        <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:3px;"><strong class="mono" style="color:var(--plum);">${fmtEur(tc.wonEur)}</strong><span class="mono muted">${tc.contracts} дог.</span></div>
        <div style="font-size:12px;">${esc(tc.name)}</div>
      </div>`).join('')}
    </div>` : '';

    const authHtml = (o.byAuthority && o.byAuthority.length) ? o.byAuthority.map((a) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12.5px;">
      <a href="#" data-open-authority="${esc(a.id)}">${esc(a.name)}</a>
      <span class="mono" style="white-space:nowrap;font-weight:600;">${fmtEur(a.valueEur)} (${a.contracts})</span>
    </div>`).join('') : '<div class="muted">Няма детайли за възложителите.</div>';

    const contractsHtml = (o.topContracts && o.topContracts.length) ? o.topContracts.map((ct) => `<div class="contract-row">
      <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
        <span class="mono" style="font-weight:700;">${fmtEur(ct.valueEur)}</span>
        <span class="mono muted">${esc(ct.signedAt)} ${ct.duringOffice ? '<span class="tag tag-ochre">в периода</span>' : ''}</span>
      </div>
      <div style="margin-bottom:5px;">${esc(ct.subject)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <span class="muted" style="font-size:11.5px;">Възложител: <strong>${esc(ct.authority)}</strong></span>
        <button type="button" class="btn btn-oracle" style="padding:3px 8px;font-size:11px;" data-inspect-contract="${esc(ct.id)}">Жив JSON ↗</button>
      </div>
    </div>`).join('') : '<div class="muted">Виж договорите в sigma.midt.bg.</div>';

    const declsHtml = (o.declarations && o.declarations.length) ? o.declarations.map((d) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;font-size:12px;border-bottom:1px solid var(--border);">
      <span><strong>${esc(d.year)}</strong> (${esc(d.type)}) · ${esc(d.institution)}</span>
      ${d.url ? `<a href="${esc(d.url)}" target="_blank" rel="noopener" class="mono">XML ↗</a>` : ''}
    </div>`).join('') : '<div class="muted">Няма XML препратки.</div>';

    document.getElementById('drawerBody').innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
        <button type="button" class="btn btn-dark" data-gen-signal="${esc(o.slug)}">Генерирай официален сигнал (АДФИ / КПК / Сметна палата / EPPO)</button>
        <button type="button" class="btn" data-graph-focus="${esc(o.name)}">Проследи в графа</button>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;">
        <div class="kpi-card"><div class="kpi-label">В периода</div><div class="kpi-val" style="font-size:15px;">${fmtEur(o.periodEur)}</div></div>
        <div class="kpi-card"><div class="kpi-label">СИГМА общо</div><div class="kpi-val" style="font-size:15px;">${fmtEur(o.totalEur)}</div></div>
        <div class="kpi-card emphasis"><div class="kpi-label">Скрити ДЗЗД</div><div class="kpi-val" style="font-size:15px;color:var(--plum);">+${fmtEur(o.dzzdEur)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Договори</div><div class="kpi-val" style="font-size:15px;">${fmtInt(o.contractCount)}</div></div>
      </div>
      ${riskExplain}
      <div class="drawer-section"><h4>Хронологично припокриване: Мандат vs. Топ договори (2019–2026)</h4>${buildMandateTimelineHtml(o)}</div>
      <div class="drawer-section"><h4>Декларирани публични длъжности</h4>${instHtml}</div>
      <div class="drawer-section"><h4>Свързани дружества (${o.companies.length})</h4>${compHtml}</div>
      ${relHtml}
      ${dzzdHtml}
      <div class="drawer-section"><h4>Основни възложители (общо ${o.byAuthorityTotal})</h4>${authHtml}</div>
      <div class="drawer-section"><h4>Най-големи договори (Топ ${o.topContracts.length})</h4>${contractsHtml}</div>
      <div class="drawer-section" style="border-bottom:none;"><h4>Декларации в Сметната палата (register.cacbg.bg)</h4>${declsHtml}</div>
    `;
    document.getElementById('drawerBackdrop').classList.add('open');
    document.getElementById('dossierDrawer').classList.add('open');
  }

  function closeDossier() {
    document.getElementById('drawerBackdrop').classList.remove('open');
    document.getElementById('dossierDrawer').classList.remove('open');
  }

  // ===== LEGAL AUDIT / SIGNAL GENERATOR (ADFI / KPKONPI / NAO / EPPO) =====
  function generateSignalBrief(slug) {
    const o = state.bySlug.get(slug);
    if (!o) return;
    const dc = state.deepBySlug.get(slug);
    const today = new Date().toISOString().slice(0, 10);
    const lines = [
      `========================================================================`,
      `ОФИЦИАЛНА АНАЛИТИЧНА СПРАВКА / СИГНАЛ ЗА ПРОВЕРКА ПО ЗОП И ЗПК`,
      `Генерирано от NAsvetlo (https://nasvetlo.website — независима гражданска платформа върху данни CC-BY 4.0 на МИДТ / СИГМА 2.0) · Дата: ${today}`,
      `========================================================================`,
      ``,
      `ДО:`,
      `  - Агенция за държавна финансова инспекция (АДФИ)`,
      `  - Комисия за противодействие на корупцията (КПК, правоприемник на КПКОНПИ)`,
      `  - Сметна палата на Република България`,
      `  - Европейска прокуратура (EPPO) — при наличие на ЕС финансиране`,
      ``,
      `1. ИДЕНТИФИКАЦИЯ НА ДЛЪЖНОСТНОТО ЛИЦЕ`,
      `   Име: ${o.name}`,
      `   Категория: ${o.circle}`,
      `   Основна институция: ${o.primaryInstitution}${o.oblast ? ' (Област ' + o.oblast + ')' : ''}`,
      `   NAsvetlo Риск индекс: ${o.sigma3Score}/100`,
      `   Признак „От собствената институция“: ${o.ownInstitution ? 'ДА (ДИРЕКТНО САМОВЪЗЛАГАНЕ)' : 'НЕ'}`,
      `   Вписани роли по Търговския регистър / пропуски: ${o.hasRegistryRole || o.omissionsCount > 0 ? 'ДА' : 'НЕ'}`,
      `   Официален профил в СИГМА 2.0 (МИДТ): ${o.sigmaUrl}`,
      ``,
      `2. ЗАЕМАНИ ПУБЛИЧНИ ДЛЪЖНОСТИ (ПО ДЕКЛАРАЦИИ ПРЕД СМЕТНАТА ПАЛАТА)`,
      ...o.institutions.map((i, idx) => `   ${idx + 1}. ${i.institution} — ${i.positions.join(', ')} (години: ${i.years.join(', ')})`),
      ``,
      `3. ФИНАНСОВИ ОБЕМИ НА СВЪРЗАНИТЕ ДРУЖЕСТВА`,
      `   - Договори в декларирания период на мандата: ${fmtEur(o.periodEur)}`,
      `   - Общо договори в СИГМА 2.0 (директно по ЕИК): ${fmtEur(o.totalEur)} (${o.contractCount} договора)`,
      `   - Скрити поръчки през ДЗЗД консорциуми (неотчетени в СИГМА 2.0): +${fmtEur(o.dzzdEur)} (${o.dzzdCnt} ДЗЗД)`,
      `   - КОМБИНИРАН ОБЕМ (СИГМА + ДЗЗД): ${fmtEur(o.combinedEur)}`,
      ``,
      `4. СВЪРЗАНИ ТЪРГОВСКИ ДРУЖЕСТВА (ЕИК)`,
      ...o.companies.map((c, idx) => `   ${idx + 1}. ${c.name} | ЕИК ${c.eik} | Основание: ${c.roles.join(', ')}${c.missingYears && c.missingYears.length ? ' | ЛИПСВА В ДЕКЛ. ЗА: ' + c.missingYears.join(', ') : ''}`),
      ...(o.relatives && o.relatives.length ? [``, `   Свързани физически лица по ТР: ${o.relatives.map((r) => `${r.name} (${r.role})`).join('; ')}`] : []),
      ``,
      ...(dc ? [
        `5. СКРИТИ КОНСОРЦИУМИ (ДЗЗД БЕЗ ЕИК), РАЗКРИТИ ОТ NAsvetlo`,
        ...dc.topConsortia.map((tc, idx) => `   ${idx + 1}. ${tc.name} — ${fmtEur(tc.wonEur)} (${tc.contracts} дог.)`),
        ``,
      ] : []),
      `6. ТОП ВЪЗЛОЖИТЕЛИ И КОНКРЕТНИ ДОГОВОРИ ЗА ПРОВЕРКА`,
      ...(o.byAuthority || []).slice(0, 6).map((a, idx) => `   - Възложител ${idx + 1}: ${a.name} — ${fmtEur(a.valueEur)} (${a.contracts} дог.)`),
      ``,
      ...(o.topContracts || []).slice(0, 6).map((ct, idx) => `   Договор #${idx + 1} [${ct.signedAt}]: ${fmtEur(ct.valueEur)} | Възложител: ${ct.authority} | Изпълнител: ${ct.company} | Предмет: ${ct.subject} | URL: https://sigma.midt.bg/contracts/${encodeURIComponent(ct.id)}`),
      ``,
      `7. ДОКАЗАТЕЛСТВЕНИ XML ДЕКЛАРАЦИИ (ЧЛ. 75 ЗСП — REGISTER.CACBG.BG)`,
      ...(o.declarations || []).slice(0, 8).map((d) => `   - ${d.year} (${d.type}) · ${d.institution}: ${d.url || 'архив Сметна палата'}`),
      ``,
      `8. ПРАВНА КВАЛИФИКАЦИЯ И ИСКАНЕ`,
      `   Настоящата справка се базира изцяло на официални публични регистри (ЦАИС ЕОП / АОП,`,
      `   СИГМА 2.0 на МИДТ, Публичен регистър на Сметната палата и ТРРЮЛНЦ, CC-BY 4.0).`,
      `   Молим компетентните органи да извършат проверка за наличие на конфликт на интереси`,
      `   по чл. 70–75 от ЗПК, нарушения при възлагането по ЗОП и несъответствия в имуществените`,
      `   декларации. Данните са публични индикатори и не представляват съдебно установена вина.`,
    ];

    state.signalLastText = lines.join('\n');
    state.signalLastFile = `SIGNAL_SIGMA3_${o.name.replace(/\s+/g, '_').slice(0, 40)}_${today}.md`;
    document.getElementById('signalModalTitle').textContent = `Одитна справка / Сигнал: ${o.name}`;
    document.getElementById('signalModalText').textContent = state.signalLastText;
    const bd = document.getElementById('signalModalBackdrop');
    bd.classList.add('open');
    bd.setAttribute('aria-hidden', 'false');
  }

  // ===== TAB 4: BEYOND SIGMA 2.0 =====
  function renderDeepTab() {
    const d = state.deep;
    if (!d || !d.summary) return;
    const s = d.summary;
    const heroNum = document.getElementById('heroDeepNum');
    const heroSub = document.getElementById('heroDeepSub');
    if (heroNum) heroNum.textContent = '+' + fmtEur(s.hiddenConsortiumTotalEur);
    if (heroSub) heroSub.textContent = `${fmtInt(s.hiddenConsortiumHitsCount)} ДЗЗД на ${s.hiddenConsortiumOfficialsCount} лица + ${s.brandNewPoliticiansNotInSigma571} нови от XML`;

    document.getElementById('deepKpiGrid').innerHTML = `
      <div class="kpi-card emphasis"><div class="kpi-label">Скрити ДЗЗД поръчки (без ЕИК)</div><div class="kpi-val">${fmtEur(s.hiddenConsortiumTotalEur)}</div><div class="kpi-sub">${fmtInt(s.hiddenConsortiumHitsCount)} обединения на ${s.hiddenConsortiumOfficialsCount} лица</div></div>
      <div class="kpi-card emphasis"><div class="kpi-label">Нови лица извън СИГМА 2.0</div><div class="kpi-val">${fmtInt(s.brandNewPoliticiansNotInSigma571)}</div><div class="kpi-sub">${s.missedPrivateLinksCount} частни/упр. + ${s.missedPublicStockCount} акции АД</div></div>
      <div class="kpi-card"><div class="kpi-label">Сканирани XML (Сметна палата)</div><div class="kpi-val">${fmtInt(s.declarationsScanned)}</div><div class="kpi-sub">Висши политици и кметове (2025–2026)</div></div>
      <div class="kpi-card"><div class="kpi-label">Разбити мега-консорциуми</div><div class="kpi-val">${fmtInt(s.consortiaExplodedCount)}</div><div class="kpi-sub">Живи партиди по Търговския регистър</div></div>`;
    renderDeepConsortia();
    renderDeepXml();
    renderMegaConsortia();
  }

  function renderDeepConsortia() {
    const d = state.deep;
    const tbody = document.getElementById('deepConsTbody');
    if (!d || !tbody) return;
    const q = state.deepConsSearch.trim().toLowerCase();
    let list = d.hiddenConsortiumLeaderboard || [];
    if (q) list = list.filter((lb) => lb.officialName.toLowerCase().includes(q) || lb.institution.toLowerCase().includes(q) || lb.companies.some((c) => c.name.toLowerCase().includes(q) || c.eik.includes(q)) || lb.topConsortia.some((tc) => tc.name.toLowerCase().includes(q)));
    tbody.innerHTML = list.length ? list.map((lb, idx) => `<tr data-open-slug="${esc(lb.slug)}">
      <td class="mono muted">${idx + 1}</td>
      <td><span class="official-name">${esc(lb.officialName)}</span><div class="inst-line">${esc(lb.institution)} · <span class="tag tag-plum">${lb.hiddenConsortiumCount} ДЗЗД</span></div></td>
      <td>${lb.companies.map((c) => `<div class="comp-item"><span class="comp-name">${esc(c.name)}</span><span class="eik-tag">ЕИК ${esc(c.eik)}</span></div>`).join('')}</td>
      <td class="num muted">${fmtEur(lb.directTotalEur)}</td>
      <td class="num" style="color:var(--crimson);font-weight:700;">+${fmtEur(lb.hiddenConsortiumEur)}</td>
      <td>${lb.topConsortia.slice(0, 3).map((tc) => `<div class="inst-line"><strong class="mono" style="color:var(--plum);">${fmtEur(tc.wonEur)}</strong> · ${esc(tc.name.length > 100 ? tc.name.slice(0, 99) + '…' : tc.name)}</div>`).join('')}</td>
    </tr>`).join('') : `<tr><td colspan="6" class="loading">Няма намерени записи.</td></tr>`;
  }

  function renderDeepXml() {
    const d = state.deep;
    const tbody = document.getElementById('deepXmlTbody');
    if (!d || !tbody) return;
    let list = (d.deepLinks || []).filter((r) => r.missedBySigma);
    if (state.deepTier === 'private') list = list.filter((r) => r.tier === 'private_link');
    else if (state.deepTier === 'stock') list = list.filter((r) => r.tier === 'public_stock');
    tbody.innerHTML = list.length ? list.map((r, idx) => `<tr style="cursor:default;">
      <td class="mono muted">${idx + 1}</td>
      <td><span class="official-name">${esc(r.politician)}</span><div class="inst-line">${esc(r.position)} · ${esc(r.institution)}</div><div class="badges">${!r.inSigmaPerson ? '<span class="tag tag-crimson">НОВО ЛИЦЕ (извън 2.0)</span>' : '<span class="tag tag-plum">НОВА ВРЪЗКА</span>'}</div></td>
      <td><div class="badges" style="margin-top:0;margin-bottom:4px;"><span class="tag ${r.tier === 'private_link' ? 'tag-ochre' : 'tag-navy'}">${esc(r.linkType)}${r.shareCount ? ' · ' + esc(r.shareCount) + ' бр.' : ''}</span></div><div class="inst-line mono" style="font-size:11px;">${esc(r.rawSnippet)}</div></td>
      <td><a class="comp-name" href="#" data-open-company="${esc(r.companyEik)}">${esc(r.companyName)}</a><div class="eik-tag" style="margin-left:0;">ЕИК ${esc(r.companyEik)} · ${fmtInt(r.companyContracts)} дог.</div></td>
      <td class="num" style="font-weight:700;">${fmtEur(r.companyWonEur)}</td>
      <td style="white-space:nowrap;"><a class="btn" style="padding:4px 8px;font-size:11.5px;" href="${esc(r.declarationUrl)}" target="_blank" rel="noopener">XML (${esc(r.declarationYear)}) ↗</a></td>
    </tr>`).join('') : `<tr><td colspan="6" class="loading">Няма записи.</td></tr>`;
  }

  function renderMegaConsortia() {
    const d = state.deep;
    const grid = document.getElementById('megaConsortiaGrid');
    if (!d || !grid) return;
    grid.innerHTML = (d.megaConsortia || []).map((con) => {
      const membersHtml = (con.members || []).map((m) => {
        const crParts = [];
        if (m.managers && m.managers.length) crParts.push(`<strong>Управители:</strong> ${esc(m.managers.slice(0, 3).join('; '))}`);
        if (m.owners && m.owners.length) crParts.push(`<strong>Собственик (ТР):</strong> ${esc(m.owners.slice(0, 2).join('; '))}`);
        if (m.beneficialOwners && m.beneficialOwners.length) crParts.push(`<strong>ЗМИП бенефициент:</strong> ${esc(m.beneficialOwners.slice(0, 2).join('; '))}`);
        if (m.holdingParents && m.holdingParents.length) {
          m.holdingParents.forEach((hp) => {
            const hpTxt = [...(hp.owners || []), ...(hp.beneficialOwners || []), ...(hp.managers || [])].slice(0, 2).join('; ');
            if (hpTxt) crParts.push(`<strong style="color:var(--plum);">Холдинг-майка (${esc(hp.name)}):</strong> ${esc(hpTxt)}`);
          });
        }
        return `<li style="cursor:default;flex-direction:column;align-items:stretch;gap:2px;">
          <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <span><strong>${esc(m.name)}</strong> ${m.eik ? `<a href="#" data-open-company="${esc(m.eik)}" class="eik-tag">ЕИК ${esc(m.eik)}</a>` : '<span class="eik-tag">чужд./ДЗЗД</span>'}</span>
            ${m.ownWonEur > 0 ? `<span class="mono muted" style="font-size:11px;">(${fmtEur(m.ownWonEur)} дир.)</span>` : ''}
          </div>
          ${crParts.length ? `<div style="font-size:11.5px;color:var(--ink-secondary);">${crParts.join(' · ')}</div>` : ''}
        </li>`;
      }).join('');
      return `<div class="cluster-card has-own" style="border-top-color:var(--plum);">
        <div class="cluster-head">
          <div><div class="cluster-title" style="font-size:14px;">${esc(con.consortiumName.length > 130 ? con.consortiumName.slice(0, 129) + '…' : con.consortiumName)}</div><div class="muted" style="font-size:11.5px;margin-top:3px;">${con.members.length} участника · ${con.contracts} дог.</div></div>
          <div class="cluster-metrics" style="color:var(--crimson);">${fmtEur(con.wonEur)}</div>
        </div>
        <ul class="cluster-people">${membersHtml}</ul>
      </div>`;
    }).join('');
  }

  // ===== COMMAND-K GLOBAL OMNIBOX =====
  async function openCmdPalette() {
    const bd = document.getElementById('cmdBackdrop');
    bd.classList.add('open');
    bd.setAttribute('aria-hidden', 'false');
    const inp = document.getElementById('cmdInput');
    inp.value = '';
    inp.focus();
    // Pre-warm lazy indices silently
    ensureAuthoritiesLoaded().catch(() => {});
    ensureCompaniesLoaded().catch(() => {});
  }

  function closeCmdPalette() {
    const bd = document.getElementById('cmdBackdrop');
    bd.classList.remove('open');
    bd.setAttribute('aria-hidden', 'true');
  }

  async function renderCmdResults(qRaw) {
    const host = document.getElementById('cmdResults');
    const q = (qRaw || '').trim().toLowerCase();
    if (q.length < 2) {
      host.innerHTML = `<div class="muted" style="padding:18px;text-align:center;">Въведете поне 2 символа (име, ЕИК, община, област, ДЗЗД)…</div>`;
      return;
    }
    const [auths, comps] = await Promise.all([ensureAuthoritiesLoaded().catch(() => []), ensureCompaniesLoaded().catch(() => [])]);
    const hitOffs = state.officials.filter((o) => o.name.toLowerCase().includes(q) || o.primaryInstitution.toLowerCase().includes(q) || o.companies.some((c) => c.eik.includes(q) || c.name.toLowerCase().includes(q))).slice(0, 6);
    const hitAuths = auths.filter((a) => a.name.toLowerCase().includes(q) || a.eik.includes(q) || (a.region && a.region.toLowerCase().includes(q))).slice(0, 6);
    const hitComps = comps.filter((c) => c.name.toLowerCase().includes(q) || c.eik.includes(q)).slice(0, 6);
    const hitOblasts = ((state.macro && state.macro.mapGeo && state.macro.mapGeo.oblasts) || []).filter((ob) => ob.name.toLowerCase().includes(q)).slice(0, 4);

    let html = '';
    if (hitOffs.length) {
      html += `<div class="cmd-group-title">Свързани длъжностни лица (${hitOffs.length})</div>` +
        hitOffs.map((o) => `<div class="cmd-item" data-cmd-slug="${esc(o.slug)}"><span><strong>${esc(o.name)}</strong> <span class="muted">· ${esc(o.primaryInstitution)}</span></span><span class="mono">${fmtEur(o.combinedEur)}</span></div>`).join('');
    }
    if (hitAuths.length) {
      html += `<div class="cmd-group-title">Възложители — 4 344 (${hitAuths.length})</div>` +
        hitAuths.map((a) => `<div class="cmd-item" data-cmd-auth="${esc(a.eik)}"><span><strong>${esc(a.name)}</strong> <span class="eik-tag">ЕИК ${esc(a.eik)}</span></span><span class="mono">${fmtEur(a.spentEur)}</span></div>`).join('');
    }
    if (hitComps.length) {
      html += `<div class="cmd-group-title">Компании и ДЗЗД — 17 428 (${hitComps.length})</div>` +
        hitComps.map((c) => `<div class="cmd-item" data-cmd-comp="${esc(c.eik || c.name)}"><span><strong>${esc(c.name.slice(0, 65))}</strong> ${c.eik ? `<span class="eik-tag">ЕИК ${esc(c.eik)}</span>` : '<span class="tag tag-plum">ДЗЗД</span>'}</span><span class="mono">${fmtEur(c.wonEur)}</span></div>`).join('');
    }
    if (hitOblasts.length) {
      html += `<div class="cmd-group-title">Области на картата</div>` +
        hitOblasts.map((ob) => `<div class="cmd-item" data-cmd-oblast="${esc(ob.nuts3)}"><span><strong>Област ${esc(ob.name)}</strong> (${ob.officialCount} лица)</span><span class="mono">${fmtEur(ob.valueEur)}</span></div>`).join('');
    }
    if (!html) html = `<div class="muted" style="padding:18px;text-align:center;">Няма съвпадения за „${esc(qRaw)}“. Пробвайте в <strong>AI Асистент (ORACLE)</strong>!</div>`;
    host.innerHTML = html;
  }

  function setupEvents() {
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('openCmdPaletteBtn').addEventListener('click', openCmdPalette);
    document.getElementById('cmdCloseBtn').addEventListener('click', closeCmdPalette);
    document.getElementById('cmdBackdrop').addEventListener('click', (e) => { if (e.target.id === 'cmdBackdrop') closeCmdPalette(); });
    document.getElementById('cmdInput').addEventListener('input', (e) => renderCmdResults(e.target.value));
    document.getElementById('cmdResults').addEventListener('click', (e) => {
      const s = e.target.closest('[data-cmd-slug]');
      if (s) { closeCmdPalette(); openDossier(s.dataset.cmdSlug); return; }
      const a = e.target.closest('[data-cmd-auth]');
      if (a && window.SIGMA3_MOD) { closeCmdPalette(); window.SIGMA3_MOD.openAuthorityDossier(a.dataset.cmdAuth); return; }
      const c = e.target.closest('[data-cmd-comp]');
      if (c && window.SIGMA3_MOD) { closeCmdPalette(); window.SIGMA3_MOD.openCompanyDossier(c.dataset.cmdComp); return; }
      const ob = e.target.closest('[data-cmd-oblast]');
      if (ob) { closeCmdPalette(); state.selectedNuts3 = ob.dataset.cmdOblast; switchTab('atlas'); renderAtlas(); }
    });

    document.getElementById('quickOpenOracleBtn').addEventListener('click', () => {
      switchTab('oracle');
      document.getElementById('mainTabs').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('quickOpenProposalBtn').addEventListener('click', () => {
      switchTab('proposal');
      document.getElementById('mainTabs').scrollIntoView({ behavior: 'smooth' });
    });
    const densBtn = document.getElementById('densityToggleBtn');
    if (densBtn) {
      densBtn.addEventListener('click', () => {
        const isCompact = document.body.getAttribute('data-density') === 'compact';
        if (isCompact) {
          document.body.removeAttribute('data-density');
          densBtn.textContent = 'Одиторски изглед';
        } else {
          document.body.setAttribute('data-density', 'compact');
          densBtn.textContent = 'Презентационен изглед';
        }
      });
    }

    const runHeroSearch = () => {
      const val = document.getElementById('heroSearchInput').value.trim();
      if (/^\d{9}$/.test(val) && window.SIGMA3_MOD) {
        ensureAuthoritiesLoaded().then((auths) => {
          if (auths.some((a) => a.eik === val)) { window.SIGMA3_MOD.openAuthorityDossier(val); return; }
          window.SIGMA3_MOD.openCompanyDossier(val);
        });
        return;
      }
      jumpToDirectory({ filter: 'all', search: val });
    };
    document.getElementById('heroSearchBtn').addEventListener('click', runHeroSearch);
    document.getElementById('heroSearchInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') runHeroSearch(); });
    document.getElementById('heroAskOracleBtn').addEventListener('click', () => {
      const val = document.getElementById('heroSearchInput').value.trim() || 'Каква е общата картина на риска в България?';
      switchTab('oracle');
      document.getElementById('mainTabs').scrollIntoView({ behavior: 'smooth' });
      if (window.SIGMA3_MOD) window.SIGMA3_MOD.askOracle(val);
    });

    document.querySelectorAll('[data-quick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.quick;
        if (q === 'Народно събрание') jumpToDirectory({ filter: 'parliament', search: '' });
        else if (q === 'ДАНС') jumpToDirectory({ filter: 'security', search: '' });
        else { document.getElementById('heroSearchInput').value = q; jumpToDirectory({ filter: 'all', search: q }); }
      });
    });
    document.querySelectorAll('[data-jump-filter]').forEach((el) => el.addEventListener('click', () => jumpToDirectory({ filter: el.dataset.jumpFilter, search: '' })));
    document.querySelectorAll('[data-jump-tab]').forEach((el) => el.addEventListener('click', () => {
      switchTab(el.dataset.jumpTab);
      document.getElementById('mainTabs').scrollIntoView({ behavior: 'smooth' });
    }));
    document.querySelectorAll('.tab-btn').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    // Trend & Live Contract & Atlas pill switchers
    document.getElementById('trendModePills').addEventListener('click', (e) => {
      const b = e.target.closest('[data-trend-mode]');
      if (!b) return;
      state.trendMode = b.dataset.trendMode;
      document.querySelectorAll('#trendModePills .pill').forEach((p) => p.classList.toggle('active', p === b));
      renderTrendsChart();
    });
    document.getElementById('liveContractsPills').addEventListener('click', (e) => {
      const b = e.target.closest('[data-lc-mode]');
      if (!b) return;
      state.liveContractMode = b.dataset.lcMode;
      document.querySelectorAll('#liveContractsPills .pill').forEach((p) => p.classList.toggle('active', p === b));
      renderLiveSingleOfferFeed();
    });
    document.getElementById('atlasMetricPills').addEventListener('click', (e) => {
      const b = e.target.closest('[data-atlas-metric]');
      if (!b) return;
      state.atlasMetric = b.dataset.atlasMetric;
      document.querySelectorAll('#atlasMetricPills .pill').forEach((p) => p.classList.toggle('active', p === b));
      renderAtlas();
    });

    // Global delegated clicks
    document.body.addEventListener('click', (e) => {
      const chartFilterEl = e.target.closest('[data-chart-filter]');
      if (chartFilterEl) { jumpToDirectory({ filter: chartFilterEl.dataset.chartFilter, search: '' }); return; }
      const slugEl = e.target.closest('[data-open-slug]');
      if (slugEl) { openDossier(slugEl.dataset.openSlug); return; }
      const inspEl = e.target.closest('[data-inspect-contract]');
      if (inspEl) { inspectContractLive(inspEl.dataset.inspectContract); return; }
      const sigEl = e.target.closest('[data-gen-signal]');
      if (sigEl) { generateSignalBrief(sigEl.dataset.genSignal); return; }
      const obEl = e.target.closest('[data-select-oblast]');
      if (obEl) { state.selectedNuts3 = obEl.dataset.selectOblast; renderAtlas(); return; }
      const authEl = e.target.closest('[data-open-authority]');
      if (authEl && window.SIGMA3_MOD) { e.preventDefault(); window.SIGMA3_MOD.openAuthorityDossier(authEl.dataset.openAuthority); return; }
      const compEl = e.target.closest('[data-open-company]');
      if (compEl && window.SIGMA3_MOD) { e.preventDefault(); window.SIGMA3_MOD.openCompanyDossier(compEl.dataset.openCompany); return; }
      const cpvEl = e.target.closest('[data-cpv-sector]');
      if (cpvEl && window.SIGMA3_MOD) {
        state.compFilter.sector = cpvEl.dataset.cpvSector;
        state.compFilter.page = 1;
        switchTab('companies');
        return;
      }
      const jAuth = e.target.closest('[data-atlas-jump-auth]');
      if (jAuth && window.SIGMA3_MOD) {
        state.authFilter.region = jAuth.dataset.atlasJumpAuth;
        state.authFilter.page = 1;
        switchTab('authorities');
        return;
      }
      const jOff = e.target.closest('[data-atlas-jump-off]');
      if (jOff) { jumpToDirectory({ filter: 'all', search: jOff.dataset.atlasJumpOff }); return; }
      const gf = e.target.closest('[data-graph-focus]');
      if (gf && window.SIGMA3_MOD) {
        closeDossier();
        switchTab('graph');
        document.getElementById('pathFromInput').value = gf.dataset.graphFocus;
        document.getElementById('mainTabs').scrollIntoView({ behavior: 'smooth' });
      }
    });

    // Directory controls
    document.getElementById('searchInput').addEventListener('input', (e) => { state.search = e.target.value; state.page = 1; renderDirectory(); });
    document.getElementById('sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 1; renderDirectory(); });
    document.getElementById('scopeSelect').addEventListener('change', (e) => { state.scope = e.target.value; state.page = 1; renderFilterPills(); renderDirectory(); });
    document.getElementById('pageSizeSelect').addEventListener('change', (e) => { state.pageSize = Number(e.target.value); state.page = 1; renderDirectory(); });
    document.getElementById('filterPills').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      state.filter = btn.dataset.filter;
      state.page = 1;
      renderFilterPills();
      renderDirectory();
    });
    document.getElementById('officialsTbody').addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-slug]');
      if (tr) openDossier(tr.dataset.slug);
    });

    // Deep tab controls
    document.getElementById('deepConsSearch').addEventListener('input', (e) => { state.deepConsSearch = e.target.value; renderDeepConsortia(); });
    document.getElementById('deepTierPills').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-deep-tier]');
      if (!btn) return;
      state.deepTier = btn.dataset.deepTier;
      document.querySelectorAll('#deepTierPills .pill').forEach((p) => p.classList.toggle('active', p === btn));
      renderDeepXml();
    });

    // Modals & Drawers
    document.getElementById('drawerClose').onclick = closeDossier;
    document.getElementById('drawerBackdrop').onclick = closeDossier;
    document.getElementById('contractModalClose').onclick = () => document.getElementById('contractModalBackdrop').classList.remove('open');
    document.getElementById('contractModalBackdrop').addEventListener('click', (e) => { if (e.target.id === 'contractModalBackdrop') e.target.classList.remove('open'); });
    document.getElementById('signalModalClose').onclick = () => document.getElementById('signalModalBackdrop').classList.remove('open');
    document.getElementById('signalModalBackdrop').addEventListener('click', (e) => { if (e.target.id === 'signalModalBackdrop') e.target.classList.remove('open'); });
    document.getElementById('signalCopyBtn').onclick = () => {
      navigator.clipboard?.writeText(state.signalLastText).then(() => {
        document.getElementById('signalCopyBtn').textContent = 'Копирано!';
        setTimeout(() => (document.getElementById('signalCopyBtn').textContent = 'Копирай'), 1500);
      });
    };
    document.getElementById('signalDownloadBtn').onclick = () => {
      const blob = new Blob([state.signalLastText], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = state.signalLastFile;
      a.click();
    };
    document.getElementById('signalPrintBtn').onclick = () => window.print();

    // Hall of Fame Modal
    const hofBd = document.getElementById('hofModalBackdrop');
    document.getElementById('hofOpenBtn').addEventListener('click', () => {
      hofBd.classList.add('open'); hofBd.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    });
    const closeHof = () => { hofBd.classList.remove('open'); hofBd.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
    document.getElementById('hofCloseBtn').addEventListener('click', closeHof);
    hofBd.addEventListener('click', (e) => { if (e.target === hofBd) closeHof(); });
    document.getElementById('hofControls').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-hof-mode]');
      if (!btn) return;
      state.hofMode = btn.dataset.hofMode;
      document.querySelectorAll('#hofControls .hof-mode-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderHallOfFamePyramid();
    });

    // Global Keyboard Shortcuts (Ctrl+K / Escape)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCmdPalette();
      } else if (e.key === 'Escape') {
        closeCmdPalette();
        document.getElementById('contractModalBackdrop').classList.remove('open');
        document.getElementById('signalModalBackdrop').classList.remove('open');
        closeDossier();
        closeHof();
      }
    });
  }

  window.SIGMA3 = {
    state, fmtEur, fmtInt, esc, riskBadgeHtml,
    ensureAuthoritiesLoaded, ensureCompaniesLoaded,
    switchTab, jumpToDirectory, openDossier, closeDossier,
    inspectContractLive, generateSignalBrief, renderAtlas,
  };

  init();
})();
