(() => {
  'use strict';

  const api = () => window.SIGMA3;

  let modulesBooted = false;
  function initModules() {
    if (modulesBooted) return;
    modulesBooted = true;
    renderCartelLab();
    renderMonopoliesAndShared();
    populateGraphInstDropdown();
    renderProposalMatrix();
    bindModuleEvents();
  }

  // =========================================================================
  // TAB 5: CARTEL CO-BIDDING LAB, BENFORD'S LAW, PARETO GINI & MONOPOLIES
  // =========================================================================
  function renderCartelLab() {
    const { state, fmtEur, fmtInt } = api();
    if (!state.macro) return;
    const ce = state.macro.cartelEngine;
    const bf = state.macro.benford;

    document.getElementById('cartelKpiGrid').innerHTML = `
      <div class="kpi-card emphasis"><div class="kpi-label">Анализирани ДЗЗД консорциуми</div><div class="kpi-val">${fmtInt(ce.totalConsortiaAnalyzed)}</div><div class="kpi-sub">Общ обем: ${fmtEur(ce.totalConsortiaEur)}</div></div>
      <div class="kpi-card emphasis"><div class="kpi-label">Повтарящи се ДЗЗД двойки</div><div class="kpi-val">${fmtInt(ce.coBiddingPairsCount)}</div><div class="kpi-sub">Фирми с &ge;2 общи консорциума (&ge;€500 хил.)</div></div>
      <div class="kpi-card"><div class="kpi-label">Топ 1% фирми — Пазарен дял</div><div class="kpi-val">${String(bf.paretoCompanies.top1Pct).replace('.', ',')}%</div><div class="kpi-sub">Индекс на Джини: ${String(bf.paretoCompanies.gini).replace('.', ',')} (екстремна концентрация)</div></div>
      <div class="kpi-card"><div class="kpi-label">Закон на Бенфорд (Възложители)</div><div class="kpi-val">MAD ${String(bf.authorities.mad).replace('.', ',')}</div><div class="kpi-sub">${bf.authorities.conformity}</div></div>`;

    renderBenfordChart(bf);
    renderParetoChart(bf);
    renderCartelPairs('');
    renderConsortiumHubs();
  }

  function renderBenfordChart(bf) {
    const host = document.getElementById('benfordChartHost');
    if (!host || !bf) return;
    const theo = bf.authorities.theoretical;
    const obsA = bf.authorities.observed;
    const obsC = bf.companies.observed;
    const w = 520, h = 210, padL = 38, padR = 12, padT = 18, padB = 34;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const maxP = 34;
    const groupW = plotW / 9;

    let bars = '';
    let theoPts = [];
    for (let i = 0; i < 9; i++) {
      const gx = padL + i * groupW;
      const ha = (obsA[i] / maxP) * plotH;
      const hc = (obsC[i] / maxP) * plotH;
      const yt = padT + plotH - (theo[i] / maxP) * plotH;
      theoPts.push(`${(gx + groupW / 2).toFixed(1)},${yt.toFixed(1)}`);
      bars += `
        <rect x="${(gx + 6).toFixed(1)}" y="${(padT + plotH - ha).toFixed(1)}" width="${(groupW * 0.36).toFixed(1)}" height="${ha.toFixed(1)}" fill="#b91c1c" opacity="0.88" rx="1.5"><title>Цифра ${i + 1} · Възложители: ${obsA[i]}% (Бенфорд: ${theo[i]}%)</title></rect>
        <rect x="${(gx + 6 + groupW * 0.4).toFixed(1)}" y="${(padT + plotH - hc).toFixed(1)}" width="${(groupW * 0.36).toFixed(1)}" height="${hc.toFixed(1)}" fill="#1e3a8a" opacity="0.8" rx="1.5"><title>Цифра ${i + 1} · Фирми: ${obsC[i]}% (Бенфорд: ${theo[i]}%)</title></rect>
        <text x="${(gx + groupW / 2).toFixed(1)}" y="${h - 12}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11.5" font-weight="700" fill="var(--ink)">${i + 1}</text>`;
    }
    const grid = [0, 10, 20, 30].map((v) => {
      const y = padT + plotH - (v / maxP) * plotH;
      return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-dasharray="3 3" />
        <text x="${padL - 5}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--ink-muted)">${v}%</text>`;
    }).join('');
    const lineSvg = `<polyline points="${theoPts.join(' ')}" fill="none" stroke="#f59e0b" stroke-width="2.5" />` +
      theoPts.map((pt, i) => {
        const [cx, cy] = pt.split(',');
        return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#f59e0b" stroke="#fff" stroke-width="1"><title>Теоретична крива на Бенфорд (цифра ${i + 1}): ${theo[i]}%</title></circle>`;
      }).join('');

    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block;">${grid}${bars}${lineSvg}</svg>
      <div class="gauge-legend" style="margin-top:6px;">
        <span><i class="dot" style="background:#b91c1c;margin-right:5px;"></i>Възложители (n=${bf.authorities.n}, MAD <b>${bf.authorities.mad}</b>, &chi;&sup2;=${bf.authorities.chi2})</span>
        <span><i class="dot" style="background:#1e3a8a;margin-right:5px;"></i>Фирми (n=${bf.companies.n}, MAD <b>${bf.companies.mad}</b>)</span>
        <span><i class="dot" style="background:#f59e0b;margin-right:5px;"></i>Теоретичен Бенфорд</span>
      </div>`;
  }

  function renderParetoChart(bf) {
    const host = document.getElementById('paretoChartHost');
    if (!host || !bf) return;
    const pa = bf.paretoAuthorities, pc = bf.paretoCompanies;
    const w = 520, h = 210, padL = 42, padR = 16, padT = 16, padB = 34;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const toPts = (deciles) => ['0,100', ...deciles.map((v, i) => `${((i + 1) * 10)},${(100 - v).toFixed(2)}`)]
      .map((pair) => {
        const [xP, yP] = pair.split(',').map(Number);
        return `${(padL + (xP / 100) * plotW).toFixed(1)},${(padT + (yP / 100) * plotH).toFixed(1)}`;
      }).join(' ');
    const diag = `<line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT}" stroke="var(--border-strong)" stroke-dasharray="4 4" stroke-width="1.3" />`;
    const grid = [0, 25, 50, 75, 100].map((v) => {
      const y = padT + plotH * (1 - v / 100);
      return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${padL + plotW}" y2="${y.toFixed(1)}" stroke="var(--border)" />
        <text x="${padL - 5}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--ink-muted)">${v}%</text>`;
    }).join('');
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block;">
      ${grid}${diag}
      <polyline points="${toPts(pc.lorenzDeciles)}" fill="none" stroke="#1e3a8a" stroke-width="2.5" />
      <polyline points="${toPts(pa.lorenzDeciles)}" fill="none" stroke="#b91c1c" stroke-width="2.5" />
      <text x="${padL + plotW / 2}" y="${h - 8}" text-anchor="middle" font-size="10.5" fill="var(--ink-muted)">Кумулативен % субекти (от най-малките към най-големите)</text>
    </svg>
    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin:10px 0 0;">
      <div class="kpi-card"><div class="kpi-label">Топ 1% фирми</div><div class="kpi-val" style="font-size:16px;color:var(--navy-dark);">${pc.top1Pct}%</div><div class="kpi-sub">Gini ${pc.gini}</div></div>
      <div class="kpi-card"><div class="kpi-label">Топ 5% фирми</div><div class="kpi-val" style="font-size:16px;">${pc.top5Pct}%</div><div class="kpi-sub">Топ 10%: ${pc.top10Pct}%</div></div>
      <div class="kpi-card emphasis"><div class="kpi-label">Топ 1% възложители</div><div class="kpi-val" style="font-size:16px;">${pa.top1Pct}%</div><div class="kpi-sub">Gini ${pa.gini}</div></div>
    </div>`;
  }

  function renderCartelPairs(searchQ) {
    const { state, fmtEur, esc } = api();
    const tbody = document.getElementById('cartelPairsTbody');
    if (!tbody || !state.macro) return;
    const q = (searchQ || '').trim().toLowerCase();
    let list = state.macro.cartelEngine.coBiddingPairs || [];
    if (q) list = list.filter((p) => p.nameA.toLowerCase().includes(q) || p.nameB.toLowerCase().includes(q) || p.eikA.includes(q) || p.eikB.includes(q));
    tbody.innerHTML = list.length ? list.map((p, i) => `<tr style="cursor:default;">
      <td class="mono muted">${i + 1}</td>
      <td>
        <div><a href="#" data-open-company="${esc(p.eikA)}" style="font-weight:700;">${esc(p.nameA)}</a> <span class="eik-tag">${esc(p.eikA)}</span> ${p.polA ? '<span class="tag tag-crimson">СИГМА</span>' : ''}</div>
        <div style="margin-top:2px;">&harr; <a href="#" data-open-company="${esc(p.eikB)}" style="font-weight:700;color:var(--plum);">${esc(p.nameB)}</a> <span class="eik-tag">${esc(p.eikB)}</span> ${p.polB ? '<span class="tag tag-crimson">СИГМА</span>' : ''}</div>
        <div class="inst-line">${(p.samples || []).slice(0, 1).map((s) => esc(s.name)).join('')}</div>
      </td>
      <td class="num"><span class="tag tag-plum">${p.jointCount} ДЗЗД</span></td>
      <td class="num" style="font-weight:700;color:var(--crimson);">${fmtEur(p.jointEur)}</td>
    </tr>`).join('') : `<tr><td colspan="4" class="loading">Няма намерени двойки.</td></tr>`;
  }

  function renderConsortiumHubs() {
    const { state, fmtEur, esc } = api();
    const tbody = document.getElementById('consortiumHubsTbody');
    if (!tbody || !state.macro) return;
    const hubs = state.macro.cartelEngine.consortiumHubs || [];
    tbody.innerHTML = hubs.map((h, i) => `<tr data-open-company="${esc(h.eik)}">
      <td class="mono muted">${i + 1}</td>
      <td>
        <strong>${esc(h.name)}</strong> <span class="eik-tag">${esc(h.eik)}</span>
        ${h.politicianLinked ? '<span class="tag tag-crimson">ПОЛИТИК</span>' : ''}
        <div class="inst-line">Участва в <strong>${h.consortiumCount}</strong> отделни ДЗЗД консорциума</div>
      </td>
      <td class="num muted">${fmtEur(h.directEur)}</td>
      <td class="num" style="font-weight:700;color:var(--plum);">+${fmtEur(h.consortiumEur)}</td>
      <td class="num"><span class="tag ${h.shadowMultiplier >= 5 ? 'tag-crimson' : 'tag-ochre'}">${h.shadowMultiplier}×</span></td>
    </tr>`).join('');
  }

  function renderMonopoliesAndShared() {
    const { state, fmtEur, fmtInt, esc } = api();
    const shared = (state.circles && state.circles.sharedCompanies) || [];
    document.getElementById('sharedCompaniesBox').innerHTML = shared.map((sc) => `<div class="contract-row">
      <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <strong><a href="#" data-open-company="${esc(sc.eik)}">${esc(sc.companyName)}</a> <span class="eik-tag">ЕИК ${esc(sc.eik)}</span></strong>
        <span class="tag tag-plum">${sc.officialCount} лица · ${fmtEur(sc.maxTotalEur)}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">
        ${sc.officials.map((p) => `<button class="pill" data-open-slug="${esc(p.slug)}" style="font-size:11.5px;">${esc(p.name)} <span class="muted">(${esc(p.institution)})</span></button>`).join('')}
      </div>
    </div>`).join('');

    const c = state.comp;
    if (!c) return;
    document.getElementById('topPairsTbody').innerHTML = (c.topPairs || []).map((p) => `<tr style="cursor:default;">
      <td class="mono muted">${p.rank}</td>
      <td><a href="#" data-open-authority="${esc(p.authoritySlug)}">${esc(p.authorityName)}</a><div class="inst-line">&rarr; <a href="#" data-open-company="${esc(p.bidderSlug)}" style="color:var(--ochre);font-weight:600;">${esc(p.bidderName)}</a></div></td>
      <td class="num">${fmtInt(p.contracts)}</td>
      <td class="num" style="font-weight:700;">${fmtEur(p.wonEur)}</td>
    </tr>`).join('');

    document.getElementById('concentrationTbody').innerHTML = (c.byConcentration || []).map((x, i) => `<tr data-open-authority="${esc(x.slug)}">
      <td class="mono muted">${i + 1}</td>
      <td><strong>${esc(x.name)}</strong></td>
      <td class="num" style="color:var(--crimson);font-weight:700;">${Number(x.hhi || 0).toFixed(2)}</td>
      <td class="num">${fmtEur(x.valueEur)}</td>
    </tr>`).join('');

    document.getElementById('singleOfferTbody').innerHTML = (c.bySingleOffer || []).map((x, i) => `<tr data-open-authority="${esc(x.slug)}">
      <td class="mono muted">${i + 1}</td>
      <td><strong>${esc(x.name)}</strong></td>
      <td class="num" style="color:var(--ochre);font-weight:700;">${((x.singleOfferShare || 0) * 100).toFixed(1)}%</td>
      <td class="num">${fmtEur(x.valueEur)}</td>
    </tr>`).join('');

    document.getElementById('directAwardTbody').innerHTML = (c.byDirectAward || []).map((x, i) => `<tr data-open-authority="${esc(x.slug)}">
      <td class="mono muted">${i + 1}</td>
      <td><strong>${esc(x.name)}</strong></td>
      <td class="num" style="color:var(--plum);font-weight:700;">${((x.nonCompetitiveShare || 0) * 100).toFixed(1)}%</td>
      <td class="num">${fmtEur(x.valueEur)}</td>
    </tr>`).join('');
  }

  // =========================================================================
  // TAB 6: COMPLETE NATIONAL AUTHORITIES EXPLORER (4,344)
  // =========================================================================
  async function loadAndRenderAuthorities() {
    const { state, ensureAuthoritiesLoaded, esc } = api();
    const tbody = document.getElementById('authoritiesTbody');
    if (!state.authorities) {
      tbody.innerHTML = `<tr><td colspan="7" class="loading">Зареждане на всички 4 344 възложители…</td></tr>`;
      await ensureAuthoritiesLoaded();
      const regions = [...new Set(state.authorities.map((a) => a.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bg'));
      const sel = document.getElementById('authRegionSelect');
      sel.innerHTML = `<option value="">Всички 28 области</option>` + regions.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
    }
    document.getElementById('authRegionSelect').value = state.authFilter.region;
    renderAuthoritiesTable();
  }

  function renderAuthoritiesTable() {
    const { state, fmtEur, fmtInt, esc, riskBadgeHtml } = api();
    if (!state.authorities) return;
    const f = state.authFilter;
    const q = f.search.trim().toLowerCase();
    let list = state.authorities;
    if (f.region) list = list.filter((a) => a.region === f.region);
    if (f.type) list = list.filter((a) => a.type === f.type);
    if (f.flag === 'linked') list = list.filter((a) => a.linkedCount > 0);
    else if (f.flag === 'own') list = list.filter((a) => a.ownHits > 0);
    else if (f.flag === 'risk') list = list.filter((a) => a.riskScore >= 40);
    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q) || a.eik.includes(q) || (a.settlement && a.settlement.toLowerCase().includes(q)));

    list = [...list].sort((a, b) => {
      if (f.sort === 'risk') return b.riskScore - a.riskScore || b.spentEur - a.spentEur;
      if (f.sort === 'contracts') return b.contracts - a.contracts;
      if (f.sort === 'linked') return b.linkedCount - a.linkedCount || b.spentEur - a.spentEur;
      if (f.sort === 'avg') return b.avgEur - a.avgEur;
      return b.spentEur - a.spentEur;
    });

    const pageSize = 60;
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    if (f.page > totalPages) f.page = totalPages;
    const start = (f.page - 1) * pageSize;
    const slice = list.slice(start, start + pageSize);

    document.getElementById('authoritiesTbody').innerHTML = slice.length ? slice.map((a, idx) => `<tr data-open-authority="${esc(a.eik)}">
      <td class="mono muted">${start + idx + 1}</td>
      <td><span class="official-name">${esc(a.name)}</span><div class="inst-line mono">ЕИК ${esc(a.eik)} ${a.settlement ? '· ' + esc(a.settlement) : ''}</div></td>
      <td><span class="tag tag-slate">${esc(a.type || 'друго')}</span><div class="inst-line">${esc(a.region || 'Национален')}</div></td>
      <td class="num" style="font-weight:700;">${fmtEur(a.spentEur)}</td>
      <td class="num">${fmtInt(a.contracts)} / ${fmtInt(a.suppliers)}</td>
      <td class="num muted">${fmtEur(a.avgEur)}</td>
      <td class="num">
        ${riskBadgeHtml(a.riskScore)}
        ${a.judicialBoost > 0 ? `<div class="inst-line mono" style="color:#4f46e5;font-weight:700;">+${a.judicialBoost} съд/АДФИ</div>` : ''}
        <div class="inst-line">${a.ownHits > 0 ? `<span style="color:var(--crimson);font-weight:700;">${a.ownHits} собств.</span>` : (a.adfiCount > 0 ? `${a.adfiCount} АДФИ` : (a.kzkCount > 0 ? `${a.kzkCount} КЗК` : (a.linkedCount > 0 ? `${a.linkedCount} лица` : (a.hhi > 0 ? `HHI ${a.hhi}` : '—'))))}</div>
      </td>
    </tr>`).join('') : `<tr><td colspan="7" class="loading">Няма намерени възложители.</td></tr>`;

    document.getElementById('authPagerBar').innerHTML = `
      <div class="muted">Показани <strong>${slice.length}</strong> от <strong>${fmtInt(list.length)}</strong> възложители (стр. ${f.page}/${totalPages})</div>
      <div style="display:flex;gap:6px;">
        <button class="btn" id="authPrev" ${f.page <= 1 ? 'disabled' : ''}>Предишна</button>
        <button class="btn" id="authNext" ${f.page >= totalPages ? 'disabled' : ''}>Следваща</button>
      </div>`;
    const p = document.getElementById('authPrev'), n = document.getElementById('authNext');
    if (p) p.onclick = () => { if (f.page > 1) { f.page--; renderAuthoritiesTable(); } };
    if (n) n.onclick = () => { if (f.page < totalPages) { f.page++; renderAuthoritiesTable(); } };
  }

  async function openAuthorityDossier(eik) {
    const { state, ensureAuthoritiesLoaded, fmtEur, fmtInt, esc, riskBadgeHtml } = api();
    await ensureAuthoritiesLoaded();
    const a = state.authoritiesByEik.get(eik);
    if (!a) return;
    document.getElementById('drawerCircle').textContent = `ВЪЗЛОЖИТЕЛ · ${a.type || 'ИНСТИТУЦИЯ'} · ${a.region || 'БЪЛГАРИЯ'}`;
    document.getElementById('drawerName').textContent = a.name;
    document.getElementById('drawerBadges').innerHTML = `
      ${riskBadgeHtml(a.riskScore)}
      <span class="tag tag-slate">ЕИК ${esc(a.eik)}</span>
      ${a.ownHits > 0 ? `<span class="tag tag-crimson">${a.ownHits} самовъзлагане</span>` : ''}
      ${a.hhi > 0 ? `<span class="tag tag-ochre">HHI ${a.hhi}</span>` : ''}
      <a class="tag tag-navy" href="https://sigma.midt.bg/authorities/${esc(a.eik)}" target="_blank" rel="noopener">Профил в СИГМА 2.0 ↗</a>`;

    const linkedOffs = state.officials.filter((o) => (o.byAuthority || []).some((ba) => String(ba.id) === String(a.eik)));
    const j6 = state.judicial6;
    const adfiAuth = j6 && j6.module2_impunityIndex ? (j6.module2_impunityIndex.topInspectedAuthorities || []).find((x) => x.eik === a.eik) : null;
    const kzkAuth = j6 && j6.module4_kzkVas ? (j6.module4_kzkVas.topAuthorities || []).find((x) => x.eik === a.eik) : null;
    const judicialBox = (a.judicialBoost > 0 || adfiAuth || kzkAuth) ? `<div class="drawer-section">
      <h4 style="color:#4f46e5;">Съдебен и контролен риск компонент (АДФИ &times; КЗК &times; Salami)</h4>
      <div class="contract-row" style="border-left:3px solid #4f46e5;">
        <strong>Добавка към Риск индекса:</strong> <span class="tag tag-crimson">+${a.judicialBoost || 0} т.</span> (Базов ${a.baseRiskScore ?? a.riskScore} &rarr; Краен <strong>${a.riskScore}/100</strong>)<br/>
        <strong>Фактори:</strong> ${(a.judicialReasons || []).map((r) => `<span class="tag tag-navy" style="margin:2px;">${esc(r)}</span>`).join(' ') || '—'}
        ${adfiAuth && adfiAuth.reports ? `<div style="margin-top:6px;"><strong>Живи доклади АДФИ:</strong> ${adfiAuth.reports.slice(0, 4).map((r) => `<a class="tag ${r.updatedArt17 ? 'tag-crimson' : 'tag-slate'}" style="margin:2px;" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.code)} PDF ↗</a>`).join('')}</div>` : ''}
      </div>
    </div>` : '';

    document.getElementById('drawerBody').innerHTML = `
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px;">
        <div class="kpi-card"><div class="kpi-label">Разход (2020–26)</div><div class="kpi-val" style="font-size:15px;">${fmtEur(a.spentEur)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Договори</div><div class="kpi-val" style="font-size:15px;">${fmtInt(a.contracts)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Доставчици</div><div class="kpi-val" style="font-size:15px;">${fmtInt(a.suppliers)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Среден договор</div><div class="kpi-val" style="font-size:15px;">${fmtEur(a.avgEur)}</div></div>
      </div>
      ${judicialBox}
      <div class="drawer-section">
        <h4>Индикатори за концентрация и конкуренция</h4>
        <div class="contract-row">
          <strong>Област / Седалище:</strong> ${esc(a.region || '—')} / ${esc(a.settlement || '—')}<br/>
          <strong>Средно договори на доставчик:</strong> <span class="mono">${(a.contracts / Math.max(1, a.suppliers)).toFixed(2)}</span> ·
          <strong>HHI индекс:</strong> <span class="mono">${a.hhi > 0 ? a.hhi : 'извън Топ 20'}</span> ·
          <strong>1 оферта:</strong> <span class="mono">${a.singleOffer > 0 ? (a.singleOffer * 100).toFixed(1) + '%' : '—'}</span>
        </div>
      </div>
      <div class="drawer-section" style="border-bottom:none;">
        <h4>Свързани длъжностни лица от СИГМА, чиито фирми са печелили тук (${linkedOffs.length})</h4>
        ${linkedOffs.length ? `<ul class="cluster-people">${linkedOffs.map((o) => {
          const hit = (o.byAuthority || []).find((ba) => String(ba.id) === String(a.eik));
          return `<li data-open-slug="${esc(o.slug)}">
            <span>${o.ownInstitution ? '<i class="dot" style="background:#b91c1c;margin-right:5px;"></i>' : ''}<strong>${esc(o.name)}</strong> <span class="muted">· ${esc(o.primaryInstitution)}</span></span>
            <span class="mono" style="font-weight:700;">${hit ? fmtEur(hit.valueEur) + ' (' + hit.contracts + ')' : fmtEur(o.periodEur)}</span>
          </li>`;
        }).join('')}</ul>` : '<div class="muted">Няма индексирани свързани длъжностни лица за този възложител.</div>'}
      </div>`;
    document.getElementById('drawerBackdrop').classList.add('open');
    document.getElementById('dossierDrawer').classList.add('open');
  }

  // =========================================================================
  // TAB 7: COMPLETE NATIONAL COMPANIES & CONSORTIA EXPLORER (17,428)
  // =========================================================================
  async function loadAndRenderCompanies() {
    const { state, ensureCompaniesLoaded, esc } = api();
    const tbody = document.getElementById('companiesTbody');
    if (!state.companies) {
      tbody.innerHTML = `<tr><td colspan="7" class="loading">Зареждане на всички 17 428 фирми и ДЗЗД консорциуми…</td></tr>`;
      await ensureCompaniesLoaded();
      const secs = (state.macro && state.macro.sectors) || [];
      const sel = document.getElementById('compSectorSelect');
      sel.innerHTML = `<option value="">Всички CPV сектори</option>` + secs.map((s) => `<option value="${esc(s.code)}">CPV ${esc(s.code)} · ${esc(s.label.slice(0, 42))}</option>`).join('');
    }
    document.getElementById('compSectorSelect').value = state.compFilter.sector;
    renderCompaniesTable();
  }

  function renderCompaniesTable() {
    const { state, fmtEur, fmtInt, esc, riskBadgeHtml } = api();
    if (!state.companies) return;
    const f = state.compFilter;
    const q = f.search.trim().toLowerCase();
    let list = state.companies;
    if (f.kind === 'company') list = list.filter((c) => !c.isConsortium);
    else if (f.kind === 'consortium') list = list.filter((c) => c.isConsortium);
    if (f.sector) list = list.filter((c) => c.sector === f.sector);
    if (f.flag === 'politician') list = list.filter((c) => c.linkedOfficials > 0);
    else if (f.flag === 'inDzzd') list = list.filter((c) => c.consortiumCount > 0);
    else if (f.flag === 'jrisk') list = list.filter((c) => (c.judicialRiskScore || 0) > 0);
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.eik.includes(q) || (c.settlement && c.settlement.toLowerCase().includes(q)));

    list = [...list].sort((a, b) => {
      if (f.sort === 'risk') return (b.judicialRiskScore || 0) - (a.judicialRiskScore || 0) || b.wonEur - a.wonEur;
      if (f.sort === 'combined') return (b.wonEur + b.consortiumEur) - (a.wonEur + a.consortiumEur);
      if (f.sort === 'dzzd') return b.consortiumEur - a.consortiumEur;
      if (f.sort === 'contracts') return b.contracts - a.contracts;
      if (f.sort === 'auths') return b.authorities - a.authorities;
      return b.wonEur - a.wonEur;
    });

    const pageSize = 60;
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    if (f.page > totalPages) f.page = totalPages;
    const start = (f.page - 1) * pageSize;
    const slice = list.slice(start, start + pageSize);

    document.getElementById('companiesTbody').innerHTML = slice.length ? slice.map((c, idx) => `<tr data-open-company="${esc(c.eik || c.name)}">
      <td class="mono muted">${start + idx + 1}</td>
      <td>
        <span class="official-name">${esc(c.name.length > 92 ? c.name.slice(0, 91) + '…' : c.name)}</span>
        <div class="inst-line mono">${c.eik ? 'ЕИК ' + esc(c.eik) : 'Консорциум без ЕИК'}</div>
      </td>
      <td><div>${esc(c.settlement || '—')}</div><div class="inst-line mono">${c.sector ? 'CPV ' + esc(c.sector) : ''}</div></td>
      <td class="num" style="font-weight:700;">${fmtEur(c.wonEur)}</td>
      <td class="num" style="color:${c.consortiumEur > 0 ? 'var(--plum)' : 'var(--ink-muted)'};font-weight:700;">${c.consortiumEur > 0 ? '+' + fmtEur(c.consortiumEur) : '—'}</td>
      <td class="num">${fmtInt(c.contracts)} / ${fmtInt(c.authorities)}</td>
      <td>
        <div class="badges" style="margin-top:0;">
          ${c.judicialRiskScore > 0 ? riskBadgeHtml(c.judicialRiskScore) : ''}
          ${c.isConsortium ? '<span class="tag tag-plum">ДЗЗД</span>' : '<span class="tag tag-slate">Фирма</span>'}
          ${c.linkedOfficials > 0 ? `<span class="tag tag-crimson">${c.linkedOfficials} политик</span>` : ''}
          ${c.consortiumCount > 0 ? `<span class="tag tag-ochre">${c.consortiumCount} ДЗЗД</span>` : ''}
        </div>
        ${c.judicialReasons && c.judicialReasons.length ? `<div class="inst-line" style="color:var(--crimson);">${esc(c.judicialReasons.slice(0, 2).join(' · '))}</div>` : ''}
      </td>
    </tr>`).join('') : `<tr><td colspan="7" class="loading">Няма намерени фирми.</td></tr>`;

    document.getElementById('compPagerBar').innerHTML = `
      <div class="muted">Показани <strong>${slice.length}</strong> от <strong>${fmtInt(list.length)}</strong> изпълнители (стр. ${f.page}/${totalPages})</div>
      <div style="display:flex;gap:6px;">
        <button class="btn" id="compPrev" ${f.page <= 1 ? 'disabled' : ''}>Предишна</button>
        <button class="btn" id="compNext" ${f.page >= totalPages ? 'disabled' : ''}>Следваща</button>
      </div>`;
    const p = document.getElementById('compPrev'), n = document.getElementById('compNext');
    if (p) p.onclick = () => { if (f.page > 1) { f.page--; renderCompaniesTable(); } };
    if (n) n.onclick = () => { if (f.page < totalPages) { f.page++; renderCompaniesTable(); } };
  }

  async function openCompanyDossier(eikOrName) {
    const { state, ensureCompaniesLoaded, fmtEur, fmtInt, esc } = api();
    await ensureCompaniesLoaded();
    const cleanNeedle = String(eikOrName || '').replace(/\s+и др\.$/i, '').trim().toLowerCase();
    const c = state.companiesByEik.get(eikOrName)
      || state.companies.find((x) => x.name === eikOrName)
      || (cleanNeedle.length >= 4 ? state.companies.find((x) => x.name.toLowerCase().includes(cleanNeedle)) : null);
    if (!c) return;
    document.getElementById('drawerCircle').textContent = c.isConsortium ? 'КОНСОРЦИУМ / ДЗЗД ОБЕДИНЕНИЕ' : `КОМПАНИЯ ИЗПЪЛНИТЕЛ · ЕИК ${c.eik}`;
    document.getElementById('drawerName').textContent = c.name;
    const links = [];
    if (c.eik) {
      links.push(`<a class="tag tag-navy" href="https://sigma.midt.bg/companies/${esc(c.eik)}" target="_blank" rel="noopener">СИГМА 2.0 ↗</a>`);
      links.push(`<a class="tag tag-teal" href="https://portal.registryagency.bg/CR/Reports/ActiveConditionTabResult?uic=${esc(c.eik)}" target="_blank" rel="noopener">Търговски регистър ↗</a>`);
    }
    if (c.linkedOfficials > 0) links.push(`<span class="tag tag-crimson">${c.linkedOfficials} свързани длъжностни лица</span>`);
    document.getElementById('drawerBadges').innerHTML = links.join('');

    const linkedOffs = state.officials.filter((o) => o.companies.some((oc) => oc.eik && oc.eik === c.eik));
    const pairs = ((state.macro && state.macro.cartelEngine && state.macro.cartelEngine.coBiddingPairs) || []).filter((p) => p.eikA === c.eik || p.eikB === c.eik);
    const hub = ((state.macro && state.macro.cartelEngine && state.macro.cartelEngine.consortiumHubs) || []).find((h) => h.eik === c.eik);
    const jCompRisk = c.judicialRiskScore > 0 ? `<div class="drawer-section">
      <h4 style="color:#4f46e5;">Съдебен и криминалистичен профил (Риск ${c.judicialRiskScore}/100)</h4>
      <div class="contract-row" style="border-left:3px solid #4f46e5;">
        ${(c.judicialReasons || []).map((r) => `<span class="tag tag-crimson" style="margin:2px;">${esc(r)}</span>`).join(' ')}
      </div>
    </div>` : '';

    document.getElementById('drawerBody').innerHTML = `
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px;">
        <div class="kpi-card"><div class="kpi-label">Директни (€)</div><div class="kpi-val" style="font-size:15px;">${fmtEur(c.wonEur)}</div></div>
        <div class="kpi-card emphasis"><div class="kpi-label">Чрез ДЗЗД (€)</div><div class="kpi-val" style="font-size:15px;color:var(--plum);">+${fmtEur(c.consortiumEur)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Договори</div><div class="kpi-val" style="font-size:15px;">${fmtInt(c.contracts)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Възложители</div><div class="kpi-val" style="font-size:15px;">${fmtInt(c.authorities)}</div></div>
      </div>
      ${jCompRisk}
      ${linkedOffs.length ? `<div class="drawer-section"><h4>Свързани длъжностни лица (СИГМА)</h4><ul class="cluster-people">${linkedOffs.map((o) => `<li data-open-slug="${esc(o.slug)}"><span><strong>${esc(o.name)}</strong> <span class="muted">· ${esc(o.primaryInstitution)}</span></span><span class="mono">${fmtEur(o.periodEur)}</span></li>`).join('')}</ul></div>` : ''}
      ${pairs.length ? `<div class="drawer-section"><h4>Повтарящи се ДЗЗД партньори (Картелна матрица)</h4>${pairs.map((p) => {
        const partnerName = p.eikA === c.eik ? p.nameB : p.nameA;
        const partnerEik = p.eikA === c.eik ? p.eikB : p.eikA;
        return `<div class="contract-row"><div style="display:flex;justify-content:space-between;"><a href="#" data-open-company="${esc(partnerEik)}"><strong>${esc(partnerName)}</strong></a><span class="mono" style="color:var(--crimson);font-weight:700;">${p.jointCount} ДЗЗД · ${fmtEur(p.jointEur)}</span></div></div>`;
      }).join('')}</div>` : ''}
      ${hub && hub.sampleConsortia ? `<div class="drawer-section" style="border-bottom:none;"><h4>Участия в ДЗЗД консорциуми (${hub.consortiumCount} общо · Множител ${hub.shadowMultiplier}×)</h4>${hub.sampleConsortia.map((sc) => `<div class="contract-row"><strong class="mono" style="color:var(--plum);">${fmtEur(sc.wonEur)}</strong> · ${esc(sc.name)}</div>`).join('')}</div>` : ''}
    `;
    document.getElementById('drawerBackdrop').classList.add('open');
    document.getElementById('dossierDrawer').classList.add('open');
  }

  // =========================================================================
  // TAB 8: MULTI-HOP NETWORK GRAPH 3.0 + BFS SHORTEST-PATH FINDER
  // =========================================================================
  function populateGraphInstDropdown() {
    const { state, fmtEur, esc } = api();
    const sel = document.getElementById('graphInstSelect');
    const clusters = ((state.circles && state.circles.institutionalClusters) || []).filter((c) => c.officialCount >= 2 || c.ownInstitutionHits > 0);
    sel.innerHTML = `<option value="">Всички институции (${clusters.length})</option>` +
      clusters.map((c) => `<option value="${esc(c.institution)}">${esc(c.institution)} (${c.officialCount} лица · ${fmtEur(c.periodEur)})</option>`).join('');
  }

  async function buildGraphData(preset, specificInst = '', customNodes = null, customEdges = null) {
    const { state, fmtEur, esc } = api();
    if ((preset === 'judicial_full' || preset === 'judicial_kzk' || preset === 'legal_expert') && !state.judicial6 && window.SIGMA3_J6) {
      await window.SIGMA3_J6.ensureJudicial6Loaded();
    }
    const nodesMap = new Map();
    const edges = [];

    const addNode = (id, label, type, meta = {}) => {
      if (!nodesMap.has(id)) {
        const rad = type === 'inst' ? 13 : type === 'official' ? (meta.ownInstitution ? 11.5 : 9) : type === 'court_case' ? 10 : type === 'lawyer' ? 9.5 : type === 'expert' ? 9.5 : type === 'dzzd' ? 9.5 : type === 'company' ? 8 : 6.5;
        nodesMap.set(id, { id, label, type, meta, x: 0, y: 0, vx: 0, vy: 0, degree: 0, radius: rad });
      }
      return nodesMap.get(id);
    };
    const addEdge = (a, b, kind) => {
      edges.push({ source: a, target: b, kind });
      if (nodesMap.has(a)) nodesMap.get(a).degree++;
      if (nodesMap.has(b)) nodesMap.get(b).degree++;
    };

    let sideListHtml = '';
    if (customNodes && customEdges) {
      customNodes.forEach((n) => addNode(n.id, n.label, n.type, n.meta));
      customEdges.forEach((e) => addEdge(e.source, e.target, e.kind));
      sideListHtml = customNodes.map((n) => `<li ${n.type === 'official' ? `data-open-slug="${esc(n.meta.slug)}"` : ''}><span>${esc(n.label)}</span><span class="tag tag-slate">${esc(n.type)}</span></li>`).join('');
    } else if ((preset === 'judicial_full' || preset === 'judicial_kzk' || preset === 'legal_expert') && state.judicial6 && state.judicial6.graphJudicialLayer) {
      const gl = state.judicial6.graphJudicialLayer;
      const keepKinds = preset === 'judicial_kzk' ? new Set(['court_case']) : preset === 'legal_expert' ? new Set(['lawyer', 'expert']) : new Set(['court_case', 'lawyer', 'expert']);
      const nodeById = new Map((gl.nodes || []).map((n) => [n.id, n]));
      (gl.edges || []).forEach((e) => {
        if (!keepKinds.has(e.kind)) return;
        const na = nodeById.get(e.source), nb = nodeById.get(e.target);
        if (!na || !nb) return;
        addNode(na.id, na.label, na.type, na.meta);
        addNode(nb.id, nb.label, nb.type, nb.meta);
        addEdge(na.id, nb.id, e.kind);
      });
      if (preset === 'judicial_full') {
        // Also overlay top 8 own-institution officials for true 9-node graph!
        state.officials.filter((o) => o.ownInstitution).slice(0, 8).forEach((o) => {
          const oId = `o:${o.slug}`, iId = `i:${o.primaryInstitution}`;
          addNode(oId, o.name, 'official', o);
          addNode(iId, o.primaryInstitution, 'inst', { name: o.primaryInstitution });
          addEdge(iId, oId, 'own');
          o.companies.slice(0, 1).forEach((c) => {
            const cId = `c:${c.eik || c.name}`;
            addNode(cId, c.name, 'company', { eik: c.eik, name: c.name });
            addEdge(oId, cId, 'company');
          });
        });
      }
      const listed = Array.from(nodesMap.values()).filter((n) => n.type === 'court_case' || n.type === 'lawyer' || n.type === 'expert').slice(0, 30);
      sideListHtml = listed.map((n) => {
        const tCol = n.type === 'court_case' ? '#4f46e5' : n.type === 'lawyer' ? '#0284c7' : '#059669';
        const tLbl = n.type === 'court_case' ? 'Дело' : n.type === 'lawyer' ? 'Адвокат' : 'Експерт';
        const attr = n.meta && n.meta.eik ? `data-open-company="${esc(n.meta.eik)}"` : '';
        return `<li ${attr}><span><i class="dot" style="background:${tCol};margin-right:5px;"></i>${esc(n.label.slice(0, 34))}</span><span class="tag tag-slate">${tLbl}</span></li>`;
      }).join('');
    } else if (preset === 'cartels' && state.macro) {
      const pairs = (state.macro.cartelEngine.coBiddingPairs || []).slice(0, 35);
      pairs.forEach((p) => {
        const aId = `c:${p.eikA}`, bId = `c:${p.eikB}`;
        addNode(aId, p.nameA, 'company', { eik: p.eikA, name: p.nameA });
        addNode(bId, p.nameB, 'company', { eik: p.eikB, name: p.nameB });
        addEdge(aId, bId, 'dzzd');
      });
      sideListHtml = pairs.slice(0, 25).map((p) => `<li data-open-company="${esc(p.eikA)}"><span>${esc(p.nameA.slice(0, 22))} &harr; ${esc(p.nameB.slice(0, 20))}</span><span class="mono">${p.jointCount} ДЗЗД</span></li>`).join('');
    } else {
      let subset = [];
      if (specificInst) subset = state.officials.filter((o) => o.primaryInstitution === specificInst || o.institutions.some((i) => i.institution.toLowerCase().includes(specificInst.replace(/^Община \/ ОбС /i, '').toLowerCase())));
      else if (preset === 'own') subset = state.officials.filter((o) => o.ownInstitution);
      else if (preset === 'dzzd') subset = state.officials.filter((o) => o.dzzdEur > 0).sort((a, b) => b.dzzdEur - a.dzzdEur).slice(0, 30);
      else if (preset === 'parliament') subset = state.officials.filter((o) => o.circle.includes('Народно събрание'));
      else if (preset === 'central') subset = state.officials.filter((o) => o.circle.includes('Служби') || o.circle.includes('Централна власт'));
      else if (preset === 'shared') subset = state.officials.filter((o) => o.companies.some((c) => state.sharedEiks.has(c.eik)));
      else if (preset === 'registry') subset = state.officials.filter((o) => o.hasRegistryRole || o.omissionsCount > 0);
      else if (preset === 'burgas') subset = state.officials.filter((o) => o.isBurgas);
      else subset = [...state.officials].sort((a, b) => b.periodEur - a.periodEur).slice(0, 35);

      subset = [...subset].sort((a, b) => b.combinedEur - a.combinedEur).slice(0, 55);
      subset.forEach((o) => {
        const oId = `o:${o.slug}`;
        addNode(oId, o.name, 'official', o);
        const iId = `i:${o.primaryInstitution}`;
        addNode(iId, o.primaryInstitution, 'inst', { name: o.primaryInstitution, circle: o.circle });
        addEdge(iId, oId, o.ownInstitution ? 'own' : 'office');
        o.companies.forEach((c) => {
          const cId = `c:${c.eik || c.name}`;
          addNode(cId, c.name, 'company', { eik: c.eik, name: c.name, roles: c.roles });
          addEdge(oId, cId, c.registry ? 'registry' : 'company');
          if (o.ownInstitution) addEdge(cId, iId, 'loop');
        });
        if (preset === 'dzzd') {
          const dc = state.deepBySlug.get(o.slug);
          if (dc) (dc.topConsortia || []).slice(0, 2).forEach((tc) => {
            const dId = `d:${tc.name.slice(0, 50)}`;
            addNode(dId, tc.name.slice(0, 42), 'dzzd', tc);
            const firstComp = o.companies[0];
            addEdge(firstComp ? `c:${firstComp.eik || firstComp.name}` : oId, dId, 'dzzd');
          });
        }
        (o.relatives || []).slice(0, 2).forEach((rel) => {
          const rId = `r:${rel.name}`;
          addNode(rId, rel.name, 'relative', rel);
          addEdge(oId, rId, 'relative');
        });
      });
      sideListHtml = subset.map((o) => `<li data-open-slug="${esc(o.slug)}"><span>${o.ownInstitution ? '<i class="dot" style="background:#b91c1c;margin-right:5px;"></i>' : ''}${esc(o.name)}</span><span class="mono muted" style="font-size:11px;">${fmtEur(o.combinedEur)}</span></li>`).join('');
    }

    const nodes = Array.from(nodesMap.values());
    const canvas = document.getElementById('networkCanvas');
    const w = canvas.clientWidth || 900, h = canvas.clientHeight || 680;
    nodes.forEach((n, idx) => {
      const ang = (idx / Math.max(1, nodes.length)) * Math.PI * 2;
      const ring = n.type === 'inst' ? 105 : n.type === 'official' ? 200 : n.type === 'company' ? 280 : 335;
      n.x = w / 2 + Math.cos(ang) * ring + (Math.random() - 0.5) * 26;
      n.y = h / 2 + Math.sin(ang) * ring + (Math.random() - 0.5) * 26;
    });

    state.graph.nodes = nodes;
    state.graph.edges = edges;
    state.graph.panX = 0; state.graph.panY = 0; state.graph.scale = 0.92;
    state.graph.simSteps = 220; state.graph.hovered = null;

    document.getElementById('graphStatsBox').innerHTML = `<strong>${nodes.length} възли</strong> · <strong>${edges.length} връзки</strong>`;
    document.getElementById('graphNodeList').innerHTML = sideListHtml;
    startGraphLoop();
  }

  function runShortestPathBFS(fromQ, toQ) {
    const { state, esc } = api();
    const box = document.getElementById('pathResultBox');
    const fq = (fromQ || '').trim().toLowerCase(), tq = (toQ || '').trim().toLowerCase();
    if (!fq || !tq) return;

    // Build full multi-hop adjacency graph across ALL 571 officials + companies + institutions + relatives + DZZD + cartel pairs!
    const adj = new Map();
    const meta = new Map();
    const link = (a, aLbl, aType, aMeta, b, bLbl, bType, bMeta, rel) => {
      if (!meta.has(a)) meta.set(a, { id: a, label: aLbl, type: aType, meta: aMeta });
      if (!meta.has(b)) meta.set(b, { id: b, label: bLbl, type: bType, meta: bMeta });
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      adj.get(a).push({ to: b, rel });
      adj.get(b).push({ to: a, rel });
    };

    state.officials.forEach((o) => {
      const oId = `o:${o.slug}`;
      link(oId, o.name, 'official', o, `i:${o.primaryInstitution}`, o.primaryInstitution, 'inst', { name: o.primaryInstitution }, 'длъжност');
      o.companies.forEach((c) => {
        const cId = `c:${c.eik || c.name}`;
        link(oId, o.name, 'official', o, cId, `${c.name} (${c.eik})`, 'company', c, 'свързана фирма');
        (o.byAuthority || []).slice(0, 4).forEach((ba) => {
          link(cId, `${c.name} (${c.eik})`, 'company', c, `a:${ba.id || ba.name}`, ba.name, 'inst', ba, 'договор');
        });
      });
      const dc = state.deepBySlug.get(o.slug);
      if (dc) (dc.topConsortia || []).forEach((tc) => {
        const firstC = o.companies[0];
        if (firstC) link(`c:${firstC.eik || firstC.name}`, `${firstC.name} (${firstC.eik})`, 'company', firstC, `d:${tc.name.slice(0, 60)}`, tc.name.slice(0, 55), 'dzzd', tc, 'ДЗЗД');
      });
    });
    ((state.macro && state.macro.cartelEngine && state.macro.cartelEngine.coBiddingPairs) || []).forEach((p) => {
      link(`c:${p.eikA}`, `${p.nameA} (${p.eikA})`, 'company', { eik: p.eikA, name: p.nameA }, `c:${p.eikB}`, `${p.nameB} (${p.eikB})`, 'company', { eik: p.eikB, name: p.nameB }, `${p.jointCount} общи ДЗЗД`);
    });
    // Include ALL 3 NEW JUDICIAL NODE TYPES (court_case, lawyer, expert) in 9-Node BFS!
    if (state.judicial6 && state.judicial6.graphJudicialLayer) {
      const gl = state.judicial6.graphJudicialLayer;
      const gMap = new Map((gl.nodes || []).map((n) => [n.id, n]));
      (gl.edges || []).forEach((e) => {
        const na = gMap.get(e.source), nb = gMap.get(e.target);
        if (na && nb) link(na.id, na.label, na.type, na.meta, nb.id, nb.label, nb.type, nb.meta, e.kind);
      });
    }

    const findIds = (q) => [...meta.values()].filter((m) => m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)).map((m) => m.id);
    const starts = findIds(fq), targets = new Set(findIds(tq));
    box.style.display = 'block';
    if (!starts.length || !targets.size) {
      box.innerHTML = `Не е намерен възел за <strong>${esc(!starts.length ? fromQ : toQ)}</strong> в мулти-хоп графа.`;
      return;
    }

    // BFS
    const queue = starts.map((s) => [s]);
    const visited = new Set(starts);
    let foundPath = null;
    while (queue.length && !foundPath) {
      const path = queue.shift();
      const cur = path[path.length - 1];
      if (targets.has(cur) && path.length > 1) { foundPath = path; break; }
      if (path.length >= 7) continue;
      for (const edge of (adj.get(cur) || [])) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push([...path, edge.to]);
        }
      }
    }

    if (!foundPath) {
      box.innerHTML = `Няма открита верига до 6 стъпки между <strong>${esc(fromQ)}</strong> и <strong>${esc(toQ)}</strong>.`;
      return;
    }
    const cNodes = foundPath.map((id) => meta.get(id));
    const cEdges = [];
    for (let i = 0; i < foundPath.length - 1; i++) cEdges.push({ source: foundPath[i], target: foundPath[i + 1], kind: 'own' });
    box.innerHTML = `<strong>Открита верига (${foundPath.length - 1} стъпки):</strong> ` +
      cNodes.map((n) => `<span class="tag tag-plum">${esc(n.label)}</span>`).join(' &rarr; ');
    buildGraphData('', '', cNodes, cEdges);
  }

  function startGraphLoop() {
    const { state } = api();
    if (state.graph.raf) cancelAnimationFrame(state.graph.raf);
    const canvas = document.getElementById('networkCanvas');
    const ctx = canvas.getContext('2d');

    const tick = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || 900, h = rect.height || 680;
      if (rect.width > 0 && (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr))) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      }
      const { nodes, edges } = state.graph;
      const nodeById = new Map(nodes.map((n) => [n.id, n]));
      if (state.graph.simSteps > 0 || state.graph.dragging) {
        if (state.graph.simSteps > 0) state.graph.simSteps--;
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d2 = dx * dx + dy * dy + 1;
            const f = 2600 / d2, d = Math.sqrt(d2);
            a.vx += (dx / d) * f; a.vy += (dy / d) * f;
            b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
          }
          a.vx += (w / 2 - a.x) * 0.008; a.vy += (h / 2 - a.y) * 0.008;
        }
        for (const e of edges) {
          const a = nodeById.get(e.source), b = nodeById.get(e.target);
          if (!a || !b) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
          const f = (d - (e.kind === 'loop' ? 92 : 78)) * 0.045;
          a.vx += (dx / d) * f; a.vy += (dy / d) * f;
          b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
        }
        for (const n of nodes) {
          if (state.graph.dragging === n) { n.vx = 0; n.vy = 0; continue; }
          n.vx *= 0.82; n.vy *= 0.82; n.x += n.vx; n.y += n.vy;
        }
      }

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2 + state.graph.panX, h / 2 + state.graph.panY);
      ctx.scale(state.graph.scale, state.graph.scale);
      ctx.translate(-w / 2, -h / 2);

      const hov = state.graph.hovered;
      const activeSet = new Set();
      if (hov) {
        activeSet.add(hov.id);
        edges.forEach((e) => { if (e.source === hov.id) activeSet.add(e.target); if (e.target === hov.id) activeSet.add(e.source); });
      }
      for (const e of edges) {
        const a = nodeById.get(e.source), b = nodeById.get(e.target);
        if (!a || !b) continue;
        const lit = !hov || (activeSet.has(a.id) && activeSet.has(b.id));
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        if (e.kind === 'loop' || e.kind === 'own') { ctx.strokeStyle = lit ? 'rgba(220,38,38,0.6)' : 'rgba(220,38,38,0.08)'; ctx.lineWidth = 1.7; }
        else if (e.kind === 'dzzd') { ctx.strokeStyle = lit ? 'rgba(13,148,136,0.65)' : 'rgba(13,148,136,0.08)'; ctx.lineWidth = 1.6; }
        else if (e.kind === 'court_case') { ctx.strokeStyle = lit ? 'rgba(79,70,229,0.68)' : 'rgba(79,70,229,0.08)'; ctx.lineWidth = 1.7; }
        else if (e.kind === 'lawyer') { ctx.strokeStyle = lit ? 'rgba(2,132,199,0.65)' : 'rgba(2,132,199,0.08)'; ctx.lineWidth = 1.5; }
        else if (e.kind === 'expert') { ctx.strokeStyle = lit ? 'rgba(5,150,105,0.65)' : 'rgba(5,150,105,0.08)'; ctx.lineWidth = 1.5; }
        else if (e.kind === 'registry') { ctx.strokeStyle = lit ? 'rgba(147,51,234,0.55)' : 'rgba(147,51,234,0.08)'; ctx.lineWidth = 1.2; }
        else { ctx.strokeStyle = lit ? 'rgba(100,116,139,0.35)' : 'rgba(100,116,139,0.06)'; ctx.lineWidth = 0.9; }
        ctx.stroke();
      }
      for (const n of nodes) {
        const lit = !hov || activeSet.has(n.id);
        let fill = '#1e3a8a';
        if (n.type === 'official') fill = n.meta.ownInstitution ? '#b91c1c' : '#e11d48';
        else if (n.type === 'company') fill = '#b45309';
        else if (n.type === 'relative') fill = '#6b21a8';
        else if (n.type === 'dzzd') fill = '#0d9488';
        else if (n.type === 'court_case') fill = '#4f46e5';
        else if (n.type === 'lawyer') fill = '#0284c7';
        else if (n.type === 'expert') fill = '#059669';
        ctx.globalAlpha = lit ? 1 : 0.14;
        ctx.beginPath();
        if (n.type === 'court_case') {
          const r = n.radius + 1.5;
          ctx.moveTo(n.x, n.y - r); ctx.lineTo(n.x + r, n.y); ctx.lineTo(n.x, n.y + r); ctx.lineTo(n.x - r, n.y); ctx.closePath();
        } else if (n.type === 'lawyer') {
          const r = n.radius;
          ctx.rect(n.x - r, n.y - r, r * 2, r * 2);
        } else if (n.type === 'expert') {
          const r = n.radius + 1.5;
          ctx.moveTo(n.x, n.y - r); ctx.lineTo(n.x + r, n.y + r * 0.85); ctx.lineTo(n.x - r, n.y + r * 0.85); ctx.closePath();
        } else {
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = fill; ctx.fill();
        ctx.lineWidth = hov === n ? 2.5 : 1.4;
        ctx.strokeStyle = hov === n ? '#f59e0b' : '#ffffff';
        ctx.stroke();
        if (hov === n || (hov && activeSet.has(n.id)) || n.type === 'inst' || n.degree >= 3 || nodes.length <= 42) {
          ctx.font = `${n.type === 'inst' || hov === n ? '600' : '400'} 10.5px "IBM Plex Sans", sans-serif`;
          const lbl = n.label.length > 28 ? n.label.slice(0, 27) + '…' : n.label;
          ctx.lineWidth = 3;
          ctx.strokeStyle = isDark ? 'rgba(9,13,22,0.92)' : 'rgba(252,251,248,0.92)';
          ctx.strokeText(lbl, n.x + n.radius + 4, n.y + 3.5);
          ctx.fillStyle = isDark ? '#f1f5f9' : '#131720';
          ctx.fillText(lbl, n.x + n.radius + 4, n.y + 3.5);
        }
      }
      ctx.restore();
      state.graph.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  // =========================================================================
  // TAB 9: SIGMA 3.0 ORACLE — LIVE ZERO-503 BULGARIAN AI COPILOT
  // =========================================================================
  let oracleInitialized = false;
  function ensureOracleReady() {
    if (oracleInitialized) return;
    oracleInitialized = true;
    appendOracleMsg('ai', `Здравейте! Аз съм <strong>СИГМА 3.0 ORACLE</strong> — детерминистичен криминалистичен асистент, работещ на живо в браузъра върху всички <strong>206 907 договора (€53,22 млрд.)</strong>, <strong>4 344 възложители</strong>, <strong>17 428 фирми/ДЗЗД</strong>, <strong>571 свързани лица</strong> и <strong>3 035 XML декларации</strong>.<br/><br/>Изберете готов въпрос по-горе или напишете име на политик, община, област, ЕИК, „Сравни X и Y“ или „Генерирай сигнал за [име]“.`);
  }

  function appendOracleMsg(role, html) {
    const box = document.getElementById('oracleMessages');
    if (!box) return;
    const div = document.createElement('div');
    div.className = `msg-bubble ${role === 'user' ? 'msg-user' : 'msg-ai'}`;
    div.innerHTML = role === 'ai' ? `<div class="msg-ai-head">СИГМА 3.0 ORACLE · 0 ms · Детерминистична справка</div>${html}` : html;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  async function askOracle(question) {
    ensureOracleReady();
    const { state, fmtEur, fmtInt, esc, riskBadgeHtml, ensureAuthoritiesLoaded, ensureCompaniesLoaded, generateSignalBrief } = api();
    const qRaw = (question || '').trim();
    if (!qRaw) return;
    appendOracleMsg('user', esc(qRaw));
    const q = qRaw.toLowerCase();

    // 1. Signal generation intent
    if (q.includes('сигнал') || q.includes('доклад за') || q.includes('справка за')) {
      const target = state.officials.find((o) => {
        const parts = o.name.toLowerCase().split(/\s+/);
        return parts.length >= 2 && q.includes(parts[0]) && q.includes(parts[parts.length - 1]);
      }) || state.officials.find((o) => o.name.toLowerCase().split(/\s+/).some((p) => p.length >= 5 && q.includes(p)));
      if (target) {
        generateSignalBrief(target.slug);
        appendOracleMsg('ai', `Генерирах официална одитна справка / сигнал за <strong>${esc(target.name)}</strong> (${esc(target.primaryInstitution)}, Риск ${riskBadgeHtml(target.sigma3Score)}, Комбиниран обем: <strong class="mono">${fmtEur(target.combinedEur)}</strong>). Прозорецът за копиране/печат/изтегляне е отворен.`);
        return;
      }
    }

    // 2. Compare two oblasts / cities
    if (q.includes('сравни') && state.macro) {
      const obs = state.macro.mapGeo.oblasts;
      const found = obs.filter((ob) => q.includes(ob.name.replace(' (столица)', '').toLowerCase()));
      if (found.length >= 2) {
        const [a, b] = found;
        appendOracleMsg('ai', `<strong>Сравнителен криминалистичен профил: Област ${esc(a.name)} vs. Област ${esc(b.name)}</strong>
          <table style="margin-top:8px;"><thead><tr><th>Показател</th><th class="num">${esc(a.name)}</th><th class="num">${esc(b.name)}</th></tr></thead>
          <tbody>
            <tr><td>Обществени поръчки (€)</td><td class="num"><b>${fmtEur(a.valueEur)}</b></td><td class="num"><b>${fmtEur(b.valueEur)}</b></td></tr>
            <tr><td>Договори / Възложители</td><td class="num">${fmtInt(a.contracts)} / ${a.authorities}</td><td class="num">${fmtInt(b.contracts)} / ${b.authorities}</td></tr>
            <tr><td>Свързани длъжностни лица</td><td class="num">${a.officialCount}</td><td class="num">${b.officialCount}</td></tr>
            <tr><td>Самовъзлагане (Собств. инст.)</td><td class="num" style="color:var(--crimson);font-weight:700;">${a.ownHits}</td><td class="num" style="color:var(--crimson);font-weight:700;">${b.ownHits}</td></tr>
            <tr><td>Скрити ДЗЗД на политици</td><td class="num" style="color:var(--plum);">${fmtEur(a.hiddenDzzdEur)}</td><td class="num" style="color:var(--plum);">${fmtEur(b.hiddenDzzdEur)}</td></tr>
            <tr><td>СИГМА 3.0 Риск индекс</td><td class="num">${riskBadgeHtml(a.riskScore)}</td><td class="num">${riskBadgeHtml(b.riskScore)}</td></tr>
          </tbody></table>`);
        return;
      }
    }

    // 3. Benford & Pareto
    if (q.includes('бенфорд') || q.includes('парето') || q.includes('джини')) {
      const bf = state.macro.benford;
      appendOracleMsg('ai', `<strong>Математически одит по Закона на Бенфорд и Парето/Джини:</strong>
        <ul class="clean-list" style="margin-top:6px;">
          <li><strong>Възложители (n=${fmtInt(bf.authorities.n)}):</strong> MAD = <code>${bf.authorities.mad}</code>, &chi;&sup2; = <code>${bf.authorities.chi2}</code> — <strong>${esc(bf.authorities.conformity)}</strong>. Първа цифра <b>4</b> се среща в <b>${bf.authorities.observed[3]}%</b> при теоретични <b>9,69%</b> (сигнал за прагово групиране на бюджети).</li>
          <li><strong>Компании (n=${fmtInt(bf.companies.n)}):</strong> MAD = <code>${bf.companies.mad}</code> — <strong>${esc(bf.companies.conformity)}</strong>.</li>
          <li><strong>Парето хиперконцентрация:</strong> Топ 1% от фирмите държат <strong>${bf.paretoCompanies.top1Pct}%</strong> (Gini <b>${bf.paretoCompanies.gini}</b>), а Топ 1% от възложителите контролират <strong>${bf.paretoAuthorities.top1Pct}%</strong> (Gini <b>${bf.paretoAuthorities.gini}</b>) от всички €53,22 млрд.</li>
        </ul>`);
      return;
    }

    // 4. Cartels
    if (q.includes('картел') || q.includes('двойк')) {
      const pairs = (state.macro.cartelEngine.coBiddingPairs || []).slice(0, 10);
      appendOracleMsg('ai', `<strong>Топ 10 най-чести картелни ДЗЗД двойки (от 3 427 анализирани консорциума):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        pairs.map((p) => `<li><strong>${esc(p.nameA)}</strong> &harr; <strong>${esc(p.nameB)}</strong> — <span class="mono" style="color:var(--crimson);font-weight:700;">${p.jointCount} общи ДЗЗД · ${fmtEur(p.jointEur)}</span></li>`).join('') + `</ol>`);
      return;
    }

    // 5. XML new politicians
    if (q.includes('xml') || q.includes('нови политиц') || q.includes('извън сигма')) {
      const list = ((state.deep && state.deep.deepLinks) || []).filter((r) => r.missedBySigma).slice(0, 12);
      appendOracleMsg('ai', `<strong>Връзки, пропуснати от СИГМА 2.0 (от 3 035 сканирани XML декларации 2025–2026 г.):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((r) => `<li><strong>${esc(r.politician)}</strong> (${esc(r.position)}, ${esc(r.institution)}) &rarr; <span class="tag tag-ochre">${esc(r.linkType)}</span> &rarr; <strong>${esc(r.companyName)}</strong> (<span class="mono">${fmtEur(r.companyWonEur)}</span>) · <a href="${esc(r.declarationUrl)}" target="_blank">XML ↗</a></li>`).join('') + `</ol>`);
      return;
    }

    // 6. Hidden DZZD top 10
    if (q.includes('дззд') || q.includes('консорциум')) {
      const list = ((state.deep && state.deep.hiddenConsortiumLeaderboard) || []).slice(0, 10);
      appendOracleMsg('ai', `<strong>Топ 10 длъжностни лица с най-големи скрити ДЗЗД поръчки (+€1,92 млрд. общо):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((lb) => `<li><a href="#" data-open-slug="${esc(lb.slug)}"><strong>${esc(lb.officialName)}</strong></a> (${esc(lb.institution)}) — СИГМА показва ${fmtEur(lb.directTotalEur)}, а <strong>скрити ДЗЗД (${lb.hiddenConsortiumCount})</strong>: <span class="mono" style="color:var(--crimson);font-weight:700;">+${fmtEur(lb.hiddenConsortiumEur)}</span></li>`).join('') + `</ol>`);
      return;
    }

    // 7. Own institution / self-dealing
    if (q.includes('самовъзлагане') || q.includes('собствената институция')) {
      const list = state.officials.filter((o) => o.ownInstitution).sort((a, b) => b.periodEur - a.periodEur).slice(0, 10);
      appendOracleMsg('ai', `<strong>Топ 10 лица със самовъзлагане (от общо 53 директни съвпадения):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((o) => `<li><a href="#" data-open-slug="${esc(o.slug)}"><strong>${esc(o.name)}</strong></a> (${esc(o.primaryInstitution)}) — В периода: <strong class="mono">${fmtEur(o.periodEur)}</strong> · +ДЗЗД: <span class="mono" style="color:var(--plum);">${fmtEur(o.dzzdEur)}</span> ${riskBadgeHtml(o.sigma3Score)}</li>`).join('') + `</ol>`);
      return;
    }

    // 8. HHI Monopolies
    if (q.includes('hhi') || q.includes('монопол')) {
      const list = ((state.comp && state.comp.byConcentration) || []).slice(0, 10);
      appendOracleMsg('ai', `<strong>Топ 10 институции по концентрация на доставчици (HHI):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((x) => `<li><a href="#" data-open-authority="${esc(x.slug)}"><strong>${esc(x.name)}</strong></a> — HHI <strong class="mono" style="color:var(--crimson);">${Number(x.hhi).toFixed(2)}</strong> · ${fmtEur(x.valueEur)} (${x.suppliers} доставчици)</li>`).join('') + `</ol>`);
      return;
    }

    // 9. Single-offer mega contracts
    if (q.includes('1 оферта') || q.includes('една оферта')) {
      const list = (state.macro.topLists.topSingleOffer || []).slice(0, 8);
      appendOracleMsg('ai', `<strong>Най-големи договори с 1 оферта (общо 83 993 дог. / €18,50 млрд. = 40,7% от стойността):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((c) => `<li><strong>${esc(c.authorityName)}</strong> &rarr; ${esc(c.bidderName)} — <strong class="mono" style="color:var(--crimson);">${fmtEur(c.valueEur)}</strong> (${c.signedAt}) · <button class="btn btn-oracle" style="padding:1px 6px;font-size:11px;" data-inspect-contract="${esc(c.id)}">Жив JSON</button></li>`).join('') + `</ol>`);
      return;
    }

    // 10. DANS / DATO / Parliament
    if (q.includes('данс') || q.includes('дато') || q.includes('народно събрание') || q.includes('депутат')) {
      const sec = state.officials.filter((o) => o.circle.includes('Служби'));
      const mps = state.officials.filter((o) => o.circle.includes('Народно събрание')).sort((a, b) => b.combinedEur - a.combinedEur);
      appendOracleMsg('ai', `<strong>Служби за сигурност (ДАНС, ДАТО, МВР):</strong> ${sec.length} лица (В периода: ${fmtEur(sec.reduce((a, o) => a + o.periodEur, 0))}).<br/>
        <strong>Народно събрание (Депутати):</strong> ${mps.length} лица (Комбиниран обем СИГМА + ДЗЗД: ${fmtEur(mps.reduce((a, o) => a + o.combinedEur, 0))}). Топ 5 депутати:<ol style="margin:6px 0 0;padding-left:18px;">` +
        mps.slice(0, 5).map((o) => `<li><a href="#" data-open-slug="${esc(o.slug)}"><strong>${esc(o.name)}</strong></a> — СИГМА: ${fmtEur(o.totalEur)} ${o.dzzdEur > 0 ? '+ ДЗЗД ' + fmtEur(o.dzzdEur) : ''}</li>`).join('') + `</ol>`);
      return;
    }

    // 10B. 7 Forensic & 6 Judicial Radar Intents (LIVE!)
    const f7 = state.forensics7 || (window.SIGMA3_F7 ? await window.SIGMA3_F7.ensureForensics7Loaded() : null);
    const j6 = state.judicial6 || (window.SIGMA3_J6 ? await window.SIGMA3_J6.ensureJudicial6Loaded() : null);

    if (f7 && (q.includes('анекс') || q.includes('оскъпяване') || q.includes('инфлац'))) {
      const e1 = f7.engine1_annexInflation || {};
      const list = (e1.contracts || []).filter((c) => c.inflationEur > 0).slice(0, 8);
      appendOracleMsg('ai', `<strong>Анекси и пост-договорно оскъпяване (+${fmtEur(e1.totalInflationEur)} доказани от живи JSON):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((c) => `<li><strong>${esc(c.authority)}</strong> &rarr; ${esc(c.contractor.slice(0, 48))} — ${fmtEur(c.signingEur)} &rarr; <strong>${fmtEur(c.currentEur)}</strong> (<span style="color:var(--crimson);font-weight:700;">+${fmtEur(c.inflationEur)} / +${c.inflationPct}%</span>)</li>`).join('') + `</ol>`);
      return;
    }
    if (f7 && (q.includes('кух') || q.includes('новосъздаден') || q.includes('shell'))) {
      const e2 = f7.engine2_shellCompanies || {};
      const list = (e2.companies || []).slice(0, 8);
      appendOracleMsg('ai', `<strong>Новосъздадени / „кухи“ фирми (Верифицирани в ТР · ${e2.verifiedShellCount} фирми / ${fmtEur(e2.totalShellEur)}):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((c) => `<li><a href="#" data-open-company="${esc(c.eik)}"><strong>${esc(c.name)}</strong></a> (ЕИК ${esc(c.eik)}) — учр. ${esc(c.incorpDate)}, 1-ви дог. след <strong>${c.daysToFirstContract} дни</strong>, капитал ${esc(c.capitalRaw || '—')}, спечелени <strong style="color:var(--crimson);">${fmtEur(c.totalEur)}</strong></li>`).join('') + `</ol>`);
      return;
    }
    if (f7 && (q.includes('salami') || q.includes('разделяне') || q.includes('под прага'))) {
      const e3 = f7.engine3_salamiSlicing || {};
      const list = (e3.clusters || []).slice(0, 8);
      appendOracleMsg('ai', `<strong>Разделяне под прага (Salami Slicing — ${fmtInt(e3.nonPharmaClusters)} клъстера за ${fmtEur(e3.nonPharmaTotalEur)}):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((c) => `<li><strong>${esc(c.authority)}</strong> &rarr; ${esc(c.contractor)} — <strong>${c.contractCount} дог. за ${c.spanDays} дни</strong> = <strong style="color:var(--crimson);">${fmtEur(c.totalEur)}</strong> (${c.thresholdRatio}× прага)</li>`).join('') + `</ol>`);
      return;
    }
    if (f7 && (q.includes('дарен') || q.includes('ерик') || q.includes('меди'))) {
      const e4 = f7.engine4_politicsAndMedia || {};
      const list = (e4.partyAgencies || []).slice(0, 8);
      appendOracleMsg('ai', `<strong>Политически дарения (ЕРИК 2023–2026: ${fmtInt(e4.donorsIndexed)} дарители) и медийни плащания (${fmtEur(e4.mediaTotalEur)}):</strong> <strong>${e4.partyAgenciesWinningProcurement} партийни PR/медийни агенции</strong> са спечелили <strong>${fmtEur(e4.partyAgenciesTotalEur)}</strong> обществени поръчки. Топ 8:<ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((a) => `<li><a href="#" data-open-company="${esc(a.eik)}"><strong>${esc(a.name)}</strong></a> (${esc((a.parties || []).slice(0, 2).join(', '))}) — <strong>${fmtEur(a.totalWonEur)}</strong></li>`).join('') + `</ol>`);
      return;
    }
    if (f7 && (q.includes('ротац') || q.includes('общ адрес'))) {
      const e6 = f7.engine6_cartelGraphs || {};
      const list = (e6.rotationRings || []).slice(0, 8);
      appendOracleMsg('ai', `<strong>Графов детектор за ротация на победители (${fmtInt(e6.rotationRingsCount)} пръстена · ${e6.sharedAddressesCount} общи адреса по ТР):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((r) => `<li><strong>${esc(r.authority)}</strong> (CPV ${esc(r.sector)}) — Редуване <code>${esc(r.sequence)}</code> (${r.alternationPct}%, ср. ${r.avgBids} оф.) · <strong>${fmtEur(r.ringEur)}</strong></li>`).join('') + `</ol>`);
      return;
    }
    if (f7 && (q.includes('шит') || q.includes('спецификац') || q.includes('марк'))) {
      const e7 = f7.engine7_nlpTailoredSpecs || {};
      const list = (e7.brandLeaderboard || []).slice(0, 8);
      appendOracleMsg('ai', `<strong>NLP „Шити“ поръчки (${fmtInt(e7.totalHighRiskSpecs)} критични договора за ${fmtEur(e7.totalHighRiskEur)}):</strong> Топ марки по обем с 1 оферта:<ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((b) => `<li><strong>${esc(b.brand)}</strong> — ${b.contracts} дог., <strong>${b.singleOfferPct}% с 1 оферта</strong> (${fmtEur(b.singleOfferEur)})</li>`).join('') + `</ol>`);
      return;
    }
    if (j6 && (q.includes('адфи') || q.includes('безнаказаност') || q.includes('инспекц'))) {
      const m2 = j6.module2_impunityIndex || {};
      const list = (m2.topInspectedAuthorities || []).slice(0, 8);
      appendOracleMsg('ai', `<strong>АДФИ Индекс на безнаказаността (${fmtInt(m2.totalReports)} живи доклада 2024–2026 · ${fmtInt(m2.updatedArt17Count)} актуализирани по чл. 17(7)):</strong> Най-проверявани възложители:<ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((a) => `<li><a href="#" data-open-authority="${esc(a.eik)}"><strong>${esc(a.name)}</strong></a> — <strong>${a.reportCount} доклада АДФИ</strong> (${a.updatedArt17Count} по чл. 17) · ЗОП: ${fmtEur(a.spentEur)}</li>`).join('') + `</ol>`);
      return;
    }
    if (j6 && (q.includes('кзк') || q.includes('вас') || q.includes('предварително изпълнение'))) {
      const m4 = j6.module4_kzkVas || {};
      const ing = m4.ingestedCounts || {};
      const list = (m4.prelimRulings || []).slice(0, 8);
      appendOracleMsg('ai', `<strong>КЗК / ВАС ЗОП Радар (2026: ${fmtInt((m4.year2026Totals || {}).proceedings)} производства · ${ing.prelimGranted || 0} допуснати предв. изп. · ${ing.decisionsOverturned || 0} отменени):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((r) => `<li><a href="${esc(r.url)}" target="_blank"><strong>${esc(r.caseNo)} ↗</strong></a> (${esc(r.date)}) — <strong>${esc(r.outcome)}</strong> · ${esc(r.respondentsRaw.slice(0, 55))}</li>`).join('') + `</ol>`);
      return;
    }
    if (j6 && (q.includes('адвокат') || q.includes('вещ') || q.includes('експерт'))) {
      const m3 = j6.module3_legalExpertGraph || {};
      const list = (m3.topLawFirmHubs || []).slice(0, 8);
      appendOracleMsg('ai', `<strong>Мрежа на адвокати и вещи лица (${fmtInt(m3.lawFirmsCount)} правни кантори за ${fmtEur(m3.lawFirmsTotalEur)} · ${(m3.adfiRegisteredExperts || {}).totalExperts || 0} АДФИ вещи лица):</strong> Топ адвокатски хъбове:<ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((l) => `<li><a href="#" data-open-company="${esc(l.eik || l.name)}"><strong>${esc(l.name)}</strong></a> — <strong>${l.authorityCount} институции</strong> · ${fmtEur(l.totalEur)} (${l.singleOfferPct}% с 1 оф.)</li>`).join('') + `</ol>`);
      return;
    }
    if (j6 && (q.includes('несъстоятел') || q.includes('феникс') || q.includes('запор') || q.includes('eppo') || q.includes('европрокуратур'))) {
      const m5 = j6.module5_insolvencyPhoenix || {};
      const m6 = j6.module6_criminalEppo || {};
      appendOracleMsg('ai', `<strong>Несъстоятелност / Феникс и EPPO Радар:</strong><ul class="clean-list" style="margin-top:6px;">
        <li><strong>Несъстоятелност и запори (ТР):</strong> ${m5.distressedOrPledgedCount} фирми със запори/залози/несъстоятелност · <strong>${m5.burnoutFirmsCount} „Burnout“ фирми</strong> (${fmtEur(m5.burnoutTotal2020_2023Eur)} през 2020–23 &rarr; €0 през 2024–26) · ${m5.phoenixChainsCount} Феникс/мулти-фирмени вериги.</li>
        <li><strong>ЕС Средства / EPPO (Регламент ЕС 2017/1939):</strong> ${fmtEur(m6.euFundedTotalEur)} в ${fmtInt(m6.euFundedContractsTotal)} ЕС договора (<strong>${m6.euSingleOfferSharePct}% с 1 оферта</strong>) · <strong>${fmtInt(m6.eppoHighRiskCount)} високорискови договора &ge;€1M</strong> (${fmtEur(m6.eppoHighRiskEur)}).</li>
      </ul>`);
      return;
    }

    // 11. EIK or Entity Deep Search across ALL 22,343 records
    const eikM = q.match(/\b(\d{9})\b/);
    const [auths, comps] = await Promise.all([ensureAuthoritiesLoaded(), ensureCompaniesLoaded()]);
    const needle = eikM ? eikM[1] : q.replace(/(покажи|провери|какво|има|за|община|област|фирма|информация|данни)/g, '').trim();
    const hitOffs = state.officials.filter((o) => o.name.toLowerCase().includes(needle) || o.primaryInstitution.toLowerCase().includes(needle) || (o.oblast && o.oblast.toLowerCase().includes(needle)) || o.companies.some((c) => c.eik === needle || c.name.toLowerCase().includes(needle))).slice(0, 6);
    const hitAuths = auths.filter((a) => a.eik === needle || a.name.toLowerCase().includes(needle)).slice(0, 5);
    const hitComps = comps.filter((c) => c.eik === needle || c.name.toLowerCase().includes(needle)).slice(0, 5);

    if (hitOffs.length || hitAuths.length || hitComps.length) {
      let out = `<strong>Резултати от пълния индекс (22 343 записа) за „${esc(needle || qRaw)}“:</strong>`;
      if (hitOffs.length) out += `<div style="margin-top:8px;"><b>Свързани лица (${hitOffs.length}):</b><ul>` + hitOffs.map((o) => `<li><a href="#" data-open-slug="${esc(o.slug)}"><strong>${esc(o.name)}</strong></a> (${esc(o.primaryInstitution)}) · В периода: <b>${fmtEur(o.periodEur)}</b> · Общо+ДЗЗД: <b>${fmtEur(o.combinedEur)}</b> ${riskBadgeHtml(o.sigma3Score)} · <button class="btn" style="padding:1px 6px;font-size:11px;" data-gen-signal="${esc(o.slug)}">Сигнал</button></li>`).join('') + `</ul></div>`;
      if (hitAuths.length) out += `<div style="margin-top:8px;"><b>Възложители (${hitAuths.length}):</b><ul>` + hitAuths.map((a) => `<li><a href="#" data-open-authority="${esc(a.eik)}"><strong>${esc(a.name)}</strong></a> (ЕИК ${esc(a.eik)}) · <b>${fmtEur(a.spentEur)}</b> (${fmtInt(a.contracts)} дог.)</li>`).join('') + `</ul></div>`;
      if (hitComps.length) out += `<div style="margin-top:8px;"><b>Компании / ДЗЗД (${hitComps.length}):</b><ul>` + hitComps.map((c) => `<li><a href="#" data-open-company="${esc(c.eik || c.name)}"><strong>${esc(c.name.slice(0, 80))}</strong></a> · Директно: <b>${fmtEur(c.wonEur)}</b>${c.consortiumEur > 0 ? ' · ДЗЗД: <b style="color:var(--plum);">+' + fmtEur(c.consortiumEur) + '</b>' : ''}</li>`).join('') + `</ul></div>`;
      appendOracleMsg('ai', out);
      return;
    }

    appendOracleMsg('ai', `Общ национален срез на <strong>СИГМА 3.0 FINALITY</strong>: <strong>206 907 договора</strong> за <strong>€53,22 млрд.</strong> (40,7% с 1 оферта), <strong>571 свързани лица</strong> (53 със самовъзлагане), <strong>+€1,92 млрд. скрити ДЗЗД</strong> и <strong>60 картелни двойки</strong>. Опитайте конкретно име, ЕИК, град или готов бутон по-горе.`);
  }

  // =========================================================================
  // TAB 10: OFFICIAL EXECUTIVE PROPOSAL TO MIDT (SIGMA 2.0 -> 3.0 FINALITY)
  // =========================================================================
  const PROPOSAL_ROWS = [
    ['Обхват на консорциуми (ДЗЗД без ЕИК)', 'Пропуска договорите на политици през ДЗЗД, защото свързва само по ЕИК', 'Пълно разбиване на 3 427 ДЗЗД &rarr; разкрива +€1,92 млрд. при 76 лица', '+€1,92 млрд. нови разкрития'],
    ['XML декларации на Сметната палата', 'Чете основно Табл. 10 (ООД/ЕООД дялове)', 'Сканира всички таблици: Табл. 6/7 (частни заеми), Табл. 9 (акции АД), Табл. 11, Декл. чл. 35', '+26 пропуснати връзки / 16 нови лица'],
    ['Реални собственици на мега-консорциуми', 'Показва само текста на обединението', 'Разбива Топ 23 ДЗЗД (&ge;€25 млн.) с живи партиди от ТР, ЗМИП бенефициенти и холдинги-майки', '2-hop корпоративно разкриване'],
    ['AI Асистент на български език', 'Изключен в production (HTTP 503 без LLM ключ)', 'ORACLE работи 100% на живо в браузъра (&lt;5 ms, €0 разход, 0% халюцинации)', '0×503 · €0/мес. оперативен разход'],
    ['Публичен рисков индекс (0–100)', 'Липсва (отбелязан като „в плана за развитие“)', 'Прозрачен 6-факторен индекс за всички 571 лица, 4 344 възложители и 28 области', 'Готов за внедряване днес'],
    ['Детектор за картели (Co-Bidding)', 'Липсва (в бъдещата пътна карта)', 'Автоматична ДЗЗД матрица: 60 повтарящи се двойки + 40 сенчести хъба (до 55× множител)', 'Първи картелен радар в БГ'],
    ['Математически одит (Бенфорд / Джини)', 'Липсва', 'Тест на Бенфорд (Nigrini MAD 0,0122 при възложители) + Лоренц/Парето (Топ 1% = 48,3%)', 'Научна криминалистика'],
    ['Карта на 28-те области (GISCO NUTS-3)', 'Показва само сума на разходите', '5-слоен рисков атлас: разходи, риск, самовъзлагане, свързани лица и скрити ДЗЗД', '5× по-дълбок регионален срез'],
    ['Мрежов граф и търсене на връзки', '1-2 хопа около 1 фиксиран център', '9-типов граф (+3 нови: Съдебно дело, Адвокат, Вещо лице) + BFS най-кратък път + PNG експорт', '9-слойна графова криминалистика'],
    ['Хронология „Мандат vs. Договори“', 'Текстов списък без визуално наслагване', 'Интерактивна 8-годишна Gantt диаграма (2019–2026) с червени маркери за припокриване', 'Мигновена визуална верификация'],
    ['Жива проверка на договор (JSON)', 'Отваря нова страница за всеки договор', 'Интегриран CORS инспектор към <code>/contracts/{id}.json</code> (анекси, оферти, CPV p25–p99)', 'Мигновен одит без напускане'],
    ['Експорт на официален сигнал / справка', 'Няма (само суров CSV)', '1-клик генератор на юридическа справка за АДФИ / КПКОНПИ / Сметна палата / EPPO (MD + PDF)', 'Директна приложимост за контрол'],
    ['Глобално търсене (Omnibox)', 'Сървърна заявка с презареждане', '<code>Ctrl+K</code> мигновен индекс през 22 343 записа (571 лица + 4 344 инст. + 17 428 фирми)', '&lt;10 ms реакция'],
    ['Зала на славата (Топ 50 пирамида)', 'Няма обобщена визуална йерархия', '5-режимна интерактивна пирамида Топ 50 (СИГМА+ДЗЗД, Самовъзлагане, Мандат, ДЗЗД, Риск)', 'Максимална гражданска яснота'],
    ['Радар 1: Анекси и оскъпяване (Post-Award)', 'Показва единични флагове без обща класация', 'Автоматично проследяване Подписана &rarr; Крайна цена (+€433,9 млн. доказани анекси до +142,8%)', 'Спира дъмпинг + анекс схеми'],
    ['Радар 2: „Кухи“ и новосъздадени фирми', 'Не проверява дата на регистрация / капитал / ГФО', 'Жив ТР одит (<code>CR_F_1_L</code>, <code>CR_F_31_L</code>, ГФО): дни до 1-ви договор и множител Поръчки/Капитал', 'Засича фирми-фантоми'],
    ['Радар 3: Разделяне под прага (Salami Slicing)', 'Липсва', '60-дневен плъзгащ алгоритъм върху 206 907 договора &rarr; 2 155 клъстера (1 776 не-фарма за €214M+)', 'Разкрива заобикаляне на ЗОП'],
    ['Радар 4: Политически дарения (ЕРИК) и Медии', 'Липсва', 'Жива връзка с ЕРИК (2023–2026: 3 716 дарители, 152 партийни PR агенции за €291M + 1 130 медийни дог.)', 'Разкрива „откупуване“ на поръчки'],
    ['Радар 5: Времеви аномалии (Петък / Ное–Дек)', 'Липсва', 'Анализ по дни от седмицата, 20–31 декември и 141 институции с Ное–Дек дъмпинг &ge;32%', 'Контрол на бюджетния дъмпинг'],
    ['Радар 6: Картелна ротация и общ адрес (ТР)', 'Липсва', '430 ротационни пръстена (<code>A&rarr;B&rarr;C&rarr;A</code>) + клъстери по общ адрес и собственици в ТР', 'Антикартелен контрол (ЗЗК)'],
    ['Радар 7: NLP „Шити“ поръчки (чл. 49 ЗОП)', 'Липсва', 'Национален скан (661 марково заключени договора за €240M) + Жив интерактивен ЗОП NLP одитор', 'Превенция преди обявяване'],
    ['Съдебен 1: Фиктивни спорове (Collusive Litigation)', 'Липсва', 'Матрица Анекси &times; КЗК/АДФИ + съдебно-свързани договори + ЕИСС/RegiX конектор за МИДТ', 'Пресича източване чрез спогодби'],
    ['Съдебен 2: Индекс на безнаказаността (АДФИ)', 'Липсва', 'Пълен жив инжест на всички 2 229 доклада на АДФИ (2024–2026) + чл. 17(7) актуализации + 0-одит гиганти', 'Реален одитен контрол'],
    ['Съдебен 3: Адвокати и Вещи лица (Legal Graph)', 'Липсва', 'Мулти-институционални адвокатски кантори + надзорни фирми + 107 АДФИ вещи лица (30.09.2026 PDF)', 'Разкрива скрити правни мрежи'],
    ['Съдебен 4: Предварително изпълнение (КЗК/ВАС)', 'Липсва', 'Жив инжест от <code>reg.cpc.bg</code> (1 032 дела 2026, допуснати предв. изп., отменени актове и ВАС)', 'Контрол върху спиранията'],
    ['Съдебен 5: Несъстоятелност и „Феникс“ фирми', 'Липсва', 'Жив ТР скан за запори (<code>CR_F_26_L</code>), залози (<code>CR_F_28_L</code>), burnout фирми и Феникс вериги', 'Спира „изгаряне“ с дългове'],
    ['Съдебен 6: Криминален, ЗМИП и EPPO профил', 'Липсва', 'Радар на ЕС средства по Регл. (ЕС) 2017/1939 + ЗМИП празноти + автоматичен флаг чл. 54, ал. 1 ЗОП', 'Защита на бюджета на ЕС'],
  ];

  function renderProposalMatrix() {
    const tb = document.getElementById('proposalMatrixTbody');
    if (!tb) return;
    tb.innerHTML = PROPOSAL_ROWS.map((r) => `<tr style="cursor:default;">
      <td><strong>${r[0]}</strong></td>
      <td class="muted">${r[1]}</td>
      <td>${r[2]}</td>
      <td><span class="tag tag-teal">${r[3]}</span></td>
    </tr>`).join('');
  }

  function downloadProposalMarkdown() {
    const md = [
      `# МЕМОРАНДУМ ЗА ИНСТИТУЦИОНАЛНО НАДГРАЖДАНЕ: СИГМА 2.0 → СИГМА 3.0 FINALITY`,
      ``,
      `- **Демонстрационна платформа на живо:** https://paas.website`,
      `- **Базов източник:** https://sigma.midt.bg (МИДТ, MIT / CC-BY 4.0)`,
      `- **Дата:** ${new Date().toISOString().slice(0, 10)}`,
      ``,
      `## 1. Резюме за ръководството на МИДТ`,
      `СИГМА 2.0 постави отличен отворен фундамент за прозрачност на българските обществени поръчки (206 907 договора / €53,22 млрд.).`,
      `СИГМА 3.0 FINALITY надгражда директно същата архитектура (Cloudflare Workers + D1 + React Router v7), като реализира днес модулите от пътната карта на МИДТ и затваря 4 измерими слепи петна:`,
      `1. **+€1,92 млрд. скрити поръчки през ДЗЗД консорциуми без ЕИК** при 76 длъжностни лица от СИГМА.`,
      `2. **26 пропуснати връзки и 16 нови висши политици** от 3 035 XML декларации пред Сметната палата (Табл. 6, 7, 9, 11 и Декл. чл. 35).`,
      `3. **Картелен Co-Bidding двигател (60 повтарящи се ДЗЗД двойки)** + **Закон на Бенфорд (MAD 0,0122 при възложители)** + **Парето/Джини (0,906)** + **6-факторен Риск индекс (0–100)**.`,
      `4. **Работещ на живо AI Асистент на български (ORACLE)** с €0 разход за LLM API и 0× HTTP 503.`,
      ``,
      `## 2. Сравнителна матрица`,
      `| Измерение | СИГМА 2.0 | СИГМА 3.0 FINALITY | Ефект |`,
      `|---|---|---|---|`,
      ...PROPOSAL_ROWS.map((r) => `| ${r[0]} | ${r[1]} | ${r[2].replace(/<[^>]+>/g, '')} | ${r[3]} |`),
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'MEMORANDUM_MIDT_SIGMA_3_0_FINALITY.md';
    a.click();
  }

  function bindModuleEvents() {
    const { state, openDossier, fmtEur, esc } = api();

    // Cartel pair search
    document.getElementById('cartelPairSearch')?.addEventListener('input', (e) => renderCartelPairs(e.target.value));

    // Authorities Explorer events
    document.getElementById('authSearchInput')?.addEventListener('input', (e) => { state.authFilter.search = e.target.value; state.authFilter.page = 1; renderAuthoritiesTable(); });
    document.getElementById('authRegionSelect')?.addEventListener('change', (e) => { state.authFilter.region = e.target.value; state.authFilter.page = 1; renderAuthoritiesTable(); });
    document.getElementById('authTypeSelect')?.addEventListener('change', (e) => { state.authFilter.type = e.target.value; state.authFilter.page = 1; renderAuthoritiesTable(); });
    document.getElementById('authSortSelect')?.addEventListener('change', (e) => { state.authFilter.sort = e.target.value; state.authFilter.page = 1; renderAuthoritiesTable(); });
    document.getElementById('authQuickPills')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-auth-flag]');
      if (!b) return;
      state.authFilter.flag = b.dataset.authFlag;
      state.authFilter.page = 1;
      document.querySelectorAll('#authQuickPills .pill').forEach((p) => p.classList.toggle('active', p === b));
      renderAuthoritiesTable();
    });

    // Companies Explorer events
    document.getElementById('compSearchInput')?.addEventListener('input', (e) => { state.compFilter.search = e.target.value; state.compFilter.page = 1; renderCompaniesTable(); });
    document.getElementById('compKindSelect')?.addEventListener('change', (e) => { state.compFilter.kind = e.target.value; state.compFilter.page = 1; renderCompaniesTable(); });
    document.getElementById('compSectorSelect')?.addEventListener('change', (e) => { state.compFilter.sector = e.target.value; state.compFilter.page = 1; renderCompaniesTable(); });
    document.getElementById('compSortSelect')?.addEventListener('change', (e) => { state.compFilter.sort = e.target.value; state.compFilter.page = 1; renderCompaniesTable(); });
    document.getElementById('compQuickPills')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-comp-flag]');
      if (!b) return;
      state.compFilter.flag = b.dataset.compFlag;
      state.compFilter.page = 1;
      document.querySelectorAll('#compQuickPills .pill').forEach((p) => p.classList.toggle('active', p === b));
      renderCompaniesTable();
    });

    // Graph controls & canvas interactions
    document.getElementById('graphPresetSelect')?.addEventListener('change', (e) => {
      document.getElementById('graphInstSelect').value = '';
      buildGraphData(e.target.value, '');
    });
    document.getElementById('graphInstSelect')?.addEventListener('change', (e) => {
      if (e.target.value) buildGraphData('', e.target.value);
      else buildGraphData(document.getElementById('graphPresetSelect').value, '');
    });
    document.getElementById('btnRelayout')?.addEventListener('click', () => { state.graph.simSteps = 220; });
    document.getElementById('btnResetZoom')?.addEventListener('click', () => { state.graph.panX = 0; state.graph.panY = 0; state.graph.scale = 0.92; });
    document.getElementById('btnExportGraphPng')?.addEventListener('click', () => {
      const c = document.getElementById('networkCanvas');
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'SIGMA_3_0_NETWORK_GRAPH.png';
      a.click();
    });
    document.getElementById('btnFindPath')?.addEventListener('click', () => {
      runShortestPathBFS(document.getElementById('pathFromInput').value, document.getElementById('pathToInput').value);
    });
    document.getElementById('btnPathDemo')?.addEventListener('click', () => {
      document.getElementById('pathFromInput').value = 'Даниел Руменов Гаргов';
      document.getElementById('pathToInput').value = 'Георги Делчев Георгиев';
      runShortestPathBFS('Даниел Руменов Гаргов', 'Георги Делчев Георгиев');
    });

    const canvas = document.getElementById('networkCanvas');
    if (canvas) {
      const toWorld = (cx, cy) => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (cx - rect.left - rect.width / 2 - state.graph.panX) / state.graph.scale + rect.width / 2,
          y: (cy - rect.top - rect.height / 2 - state.graph.panY) / state.graph.scale + rect.height / 2,
        };
      };
      const hitAt = (x, y) => {
        for (let i = state.graph.nodes.length - 1; i >= 0; i--) {
          const n = state.graph.nodes[i];
          if ((n.x - x) ** 2 + (n.y - y) ** 2 <= (n.radius + 5) ** 2) return n;
        }
        return null;
      };
      const updateTip = (n) => {
        const tip = document.getElementById('graphTooltip');
        if (!n || !tip) return;
        if (n.type === 'official') tip.innerHTML = `<strong style="color:var(--crimson);">${esc(n.meta.name)}</strong><br/><span class="muted">${esc(n.meta.primaryInstitution)}</span><br/>Комбинирано: <strong class="mono">${fmtEur(n.meta.combinedEur)}</strong><br/><button class="btn" style="margin-top:6px;padding:3px 8px;font-size:11px;" data-open-slug="${esc(n.meta.slug)}">Досие &rarr;</button>`;
        else if (n.type === 'company') tip.innerHTML = `<strong style="color:var(--ochre);">${esc(n.label)}</strong><br/><span class="mono muted">ЕИК ${esc(n.meta.eik || '—')}</span><br/><button class="btn" style="margin-top:6px;padding:3px 8px;font-size:11px;" data-open-company="${esc(n.meta.eik || n.label)}">Фирма &rarr;</button>`;
        else if (n.type === 'court_case') tip.innerHTML = `<strong style="color:#4f46e5;">${esc(n.meta.caseNo || n.label)}</strong><br/><span class="muted">${esc(n.meta.kind || 'Производство')} · ${esc(n.meta.date || '')}</span><br/><span>${esc(n.meta.outcome || '')}</span>${n.meta.url ? `<br/><a class="btn" style="margin-top:6px;padding:3px 8px;font-size:11px;" href="${esc(n.meta.url)}" target="_blank" rel="noopener">Отвори официален акт ↗</a>` : ''}`;
        else if (n.type === 'lawyer') tip.innerHTML = `<strong style="color:#0284c7;">Адвокат / Кантора: ${esc(n.label)}</strong><br/><span class="mono muted">ЕИК ${esc(n.meta.eik || '—')} · ${n.meta.authorityCount || n.degree} институции · ${fmtEur(n.meta.totalEur || 0)}</span>${n.meta.eik ? `<br/><button class="btn" style="margin-top:6px;padding:3px 8px;font-size:11px;" data-open-company="${esc(n.meta.eik)}">Досие кантора &rarr;</button>` : ''}`;
        else if (n.type === 'expert') tip.innerHTML = `<strong style="color:#059669;">Вещо лице / Надзор: ${esc(n.label)}</strong><br/><span class="mono muted">ЕИК ${esc(n.meta.eik || '—')} · ${n.meta.authorityCount || n.degree} институции · ${fmtEur(n.meta.totalEur || 0)}</span>${n.meta.eik ? `<br/><button class="btn" style="margin-top:6px;padding:3px 8px;font-size:11px;" data-open-company="${esc(n.meta.eik)}">Досие експерт &rarr;</button>` : ''}`;
        else if (n.type === 'dzzd') tip.innerHTML = `<strong style="color:var(--teal);">${esc(n.label)}</strong><br/><span class="mono">${n.meta.wonEur ? fmtEur(n.meta.wonEur) : 'ДЗЗД консорциум'}</span>`;
        else tip.innerHTML = `<strong style="color:var(--navy-dark);">${esc(n.label)}</strong><br/><span class="muted">${n.degree} връзки в среза</span>`;
      };
      canvas.addEventListener('mousedown', (e) => {
        const p = toWorld(e.clientX, e.clientY), hit = hitAt(p.x, p.y);
        if (hit) { state.graph.dragging = hit; state.graph.simSteps = Math.max(state.graph.simSteps, 60); }
        else { state.graph.panning = true; state.graph.lastX = e.clientX; state.graph.lastY = e.clientY; }
      });
      window.addEventListener('mousemove', (e) => {
        if (state.graph.dragging) { const p = toWorld(e.clientX, e.clientY); state.graph.dragging.x = p.x; state.graph.dragging.y = p.y; }
        else if (state.graph.panning) { state.graph.panX += e.clientX - state.graph.lastX; state.graph.panY += e.clientY - state.graph.lastY; state.graph.lastX = e.clientX; state.graph.lastY = e.clientY; }
        else if (e.target === canvas) { const p = toWorld(e.clientX, e.clientY), hit = hitAt(p.x, p.y); state.graph.hovered = hit; canvas.style.cursor = hit ? 'pointer' : 'grab'; if (hit) updateTip(hit); }
      });
      window.addEventListener('mouseup', () => { state.graph.dragging = null; state.graph.panning = false; });
      canvas.addEventListener('click', (e) => {
        const p = toWorld(e.clientX, e.clientY), hit = hitAt(p.x, p.y);
        if (hit) {
          updateTip(hit);
          if (hit.type === 'official') openDossier(hit.meta.slug);
          else if ((hit.type === 'company' || hit.type === 'lawyer' || hit.type === 'expert') && hit.meta.eik) openCompanyDossier(hit.meta.eik);
          else if (hit.type === 'inst' && hit.meta.eik) openAuthorityDossier(hit.meta.eik);
        }
      });
      canvas.addEventListener('wheel', (e) => { e.preventDefault(); state.graph.scale = Math.max(0.28, Math.min(3.5, state.graph.scale * (e.deltaY < 0 ? 1.12 : 0.89))); }, { passive: false });
    }

    // ORACLE Copilot events
    document.getElementById('oracleForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = document.getElementById('oracleInput');
      const val = inp.value.trim();
      if (!val) return;
      inp.value = '';
      askOracle(val);
    });
    document.getElementById('oraclePrompts')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-oracle-q]');
      if (b) askOracle(b.dataset.oracleQ);
    });
    document.getElementById('oracleClearBtn')?.addEventListener('click', () => {
      document.getElementById('oracleMessages').innerHTML = '';
      oracleInitialized = false;
      ensureOracleReady();
    });

    // Proposal Export Buttons
    document.getElementById('btnPrintProposal')?.addEventListener('click', () => window.print());
    document.getElementById('btnDownloadProposalMd')?.addEventListener('click', downloadProposalMarkdown);
  }

  window.SIGMA3_MOD = {
    initModules, loadAndRenderAuthorities, loadAndRenderCompanies,
    openAuthorityDossier, openCompanyDossier, buildGraphData,
    ensureOracleReady, askOracle,
  };

  if (window.SIGMA3 && window.SIGMA3.state && window.SIGMA3.state.meta) {
    initModules();
  }
})();
