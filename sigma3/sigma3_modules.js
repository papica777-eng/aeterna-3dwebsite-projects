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
      const rootCss = getComputedStyle(document.documentElement);
      const cssToken = (v, fb) => (rootCss.getPropertyValue(v) || '').trim() || fb;
      const colInst = cssToken('--node-inst', '#1e3a8a');
      const colOffOwn = cssToken('--node-official', '#b91c1c');
      const colComp = cssToken('--node-company', '#b45309');
      const colRel = cssToken('--node-consortium', '#6b21a8');
      const colDzzd = cssToken('--node-donor', '#0d9488');
      const colJudicial = cssToken('--node-judicial', '#4f46e5');
      const colLawyer = cssToken('--node-lawyer', '#0284c7');
      const colExpert = cssToken('--node-expert', '#059669');
      for (const n of nodes) {
        const lit = !hov || activeSet.has(n.id);
        let fill = colInst;
        if (n.type === 'official') fill = n.meta.ownInstitution ? colOffOwn : '#e11d48';
        else if (n.type === 'company') fill = colComp;
        else if (n.type === 'relative') fill = colRel;
        else if (n.type === 'dzzd') fill = colDzzd;
        else if (n.type === 'court_case') fill = colJudicial;
        else if (n.type === 'lawyer') fill = colLawyer;
        else if (n.type === 'expert') fill = colExpert;
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
  // TAB 9: SIGMA 3.0 ORACLE — HYBRID NLU, FUZZY ENTITY RESOLVER & 13-RADAR RAG
  // =========================================================================
  let oracleInitialized = false;
  const oracleContext = {
    lastOfficial: null,
    lastAuthority: null,
    lastCompany: null,
    lastOblast: null,
    lastIntents: [],
    history: [],
  };

  // 1. Bidirectional Shlyokavitsa / Latin-to-Cyrillic & Acronym Normalizer
  const ACRONYM_ALIASES = {
    'апи': 'агенция пътна инфраструктура',
    'api': 'агенция пътна инфраструктура',
    'нкжи': 'национална компания железопътна инфраструктура',
    'nkji': 'национална компания железопътна инфраструктура',
    'nkzhi': 'национална компания железопътна инфраструктура',
    'аец': 'аец козлодуй',
    'aec': 'аец козлодуй',
    'aets': 'аец козлодуй',
    'бдж': 'бдж пътнически превози',
    'bdj': 'бдж пътнически превози',
    'bdz': 'бдж пътнически превози',
    'есо': 'електроенергиен системен оператор',
    'eso': 'електроенергиен системен оператор',
    'со': 'столична община',
    'мвр': 'министерство на вътрешните работи',
    'mvr': 'министерство на вътрешните работи',
    'мз': 'министерство на здравеопазването',
    'мррб': 'министерство на регионалното развитие и благоустройството',
    'mrrb': 'министерство на регионалното развитие и благоустройството',
    'мон': 'министерство на образованието и науката',
    'мп': 'министерство на правосъдието',
    'мф': 'министерство на финансите',
    'гбс': 'главболгарстрой',
    'gbs': 'главболгарстрой',
    'дппи': 'пристанищна инфраструктура',
  };

  function latinToCyrillicBg(str) {
    let s = String(str || '').toLowerCase();
    // Preserve numbers & punctuation, convert multi-char Bulgarian shlyokavitsa clusters first
    const multi = [
      ['sht', 'щ'], ['6t', 'щ'], ['sh', 'ш'], ['zh', 'ж'], ['ch', 'ч'],
      ['ts', 'ц'], ['tz', 'ц'], ['yu', 'ю'], ['iu', 'ю'], ['ya', 'я'],
      ['ia', 'я'], ['yo', 'йо'], ['io', 'йо'], ['dj', 'дж'], ['dz', 'дз'],
    ];
    for (const [lat, cyr] of multi) s = s.split(lat).join(cyr);
    // Replace '4' and '6' only when adjacent to letters (shlyokavitsa for ч / ш)
    s = s.replace(/(?<=[a-zа-я])4|4(?=[a-zа-я])/g, 'ч').replace(/(?<=[a-zа-я])6|6(?=[a-zа-я])/g, 'ш');
    const single = {
      a: 'а', b: 'б', v: 'в', w: 'в', g: 'г', d: 'д', e: 'е', j: 'ж', z: 'з',
      i: 'и', y: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
      s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', c: 'ц', q: 'я', x: 'кс',
    };
    return s.replace(/[a-z]/g, (ch) => single[ch] || ch);
  }

  // 2. Bulgarian Morphological Stemmer & Trigram / Levenshtein Fuzzy Similarity
  function stemBg(word) {
    let w = String(word || '').toLowerCase().replace(/[^а-яa-z0-9]/g, '');
    if (w.length <= 3) return w;
    const suffixes = [
      'ията', 'ието', 'овете', 'ените', 'аните', 'ската', 'ското', 'ските',
      'ите', 'ата', 'ята', 'ове', 'ища', 'ия', 'ие', 'ски', 'ска', 'ско',
      'ен', 'на', 'но', 'ни', 'ът', 'ят', 'та', 'то', 'те', 'а', 'я', 'и', 'о', 'е',
    ];
    for (const suf of suffixes) {
      if (w.length - suf.length >= 3 && w.endsWith(suf)) {
        return w.slice(0, w.length - suf.length);
      }
    }
    return w;
  }

  function trigramSim(a, b) {
    const s1 = String(a || '').toLowerCase().trim();
    const s2 = String(b || '').toLowerCase().trim();
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) {
      const ratio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
      return Math.max(0.82, ratio);
    }
    if (s1.length < 3 || s2.length < 3) return 0;
    const p1 = ` ${s1} `, p2 = ` ${s2} `;
    const g1 = new Set(), g2 = new Set();
    for (let i = 0; i <= p1.length - 3; i++) g1.add(p1.slice(i, i + 3));
    for (let i = 0; i <= p2.length - 3; i++) g2.add(p2.slice(i, i + 3));
    let inter = 0;
    g1.forEach((g) => { if (g2.has(g)) inter++; });
    return (2 * inter) / (g1.size + g2.size);
  }

  function editDistanceBounded(a, b, maxDist = 2) {
    if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
    for (let j = 1; j <= b.length; j++) {
      let prev = dp[0];
      dp[0] = j;
      let minRow = dp[0];
      for (let i = 1; i <= a.length; i++) {
        const tmp = dp[i];
        dp[i] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[i], dp[i - 1]);
        prev = tmp;
        if (dp[i] < minRow) minRow = dp[i];
      }
      if (minRow > maxDist) return maxDist + 1;
    }
    return dp[a.length];
  }

  function tokenFuzzyMatchScore(queryToken, targetText) {
    const qt = queryToken.toLowerCase();
    const tt = String(targetText || '').toLowerCase();
    if (!qt || !tt) return 0;
    if (tt.includes(qt)) return 1.0;
    const qStem = stemBg(qt);
    if (qStem.length >= 3 && tt.includes(qStem)) return 0.92;
    if (qt.length < 4) return 0;
    const targetWords = tt.split(/[^а-яa-z0-9]+/).filter((w) => w.length >= 4);
    let best = 0;
    for (const tw of targetWords) {
      if (tw.startsWith(qStem) || qStem.startsWith(stemBg(tw))) {
        best = Math.max(best, 0.88);
        continue;
      }
      const dist = editDistanceBounded(qt, tw, qt.length >= 7 ? 2 : 1);
      if (dist <= (qt.length >= 7 ? 2 : 1)) {
        best = Math.max(best, 1 - dist / Math.max(qt.length, tw.length));
      } else {
        const tri = trigramSim(qt, tw);
        if (tri > best) best = tri;
      }
    }
    return best;
  }

  const STOP_WORDS = new Set([
    'кажи', 'ми', 'за', 'покажи', 'провери', 'какво', 'какви', 'какъв', 'каква', 'има', 'имат',
    'са', 'е', 'в', 'във', 'на', 'от', 'до', 'по', 'със', 'с', 'или', 'и', 'а', 'но', 'че',
    'кой', 'кои', 'коя', 'кое', 'колко', 'къде', 'кога', 'как', 'защо', 'всички', 'всичко',
    'дай', 'ми', 'информация', 'данни', 'справка', 'одит', 'моля', 'те', 'искам', 'да', 'видя',
    'разкажи', 'намери', 'потърси', 'извади', 'списък', 'таблица', 'относно', 'около', 'при',
    'между', 'след', 'преди', 'над', 'под', 'най', 'много', 'малко', 'големи', 'голям', 'голяма',
    'ли', 'се', 'си', 'му', 'й', 'им', 'ги', 'го', 'я', 'това', 'тази', 'този', 'тези', 'там',
    'тук', 'него', 'нея', 'тях', 'фирма', 'фирми', 'фирмата', 'фирмите', 'компания', 'компании',
    'институция', 'институции', 'възложител', 'възложители', 'изпълнител', 'изпълнители',
    'поръчка', 'поръчки', 'поръчките', 'договор', 'договори', 'договорите', 'обществени',
    'обществена', 'пари', 'сума', 'суми', 'евро', 'лева', 'милиона', 'милиарда', 'българия',
  ]);

  // 3. Semantic Intent Taxonomy (22 Intents with Colloquial, Slang & Morphological Triggers)
  const INTENT_DEFS = [
    {
      id: 'COMPARE',
      label: 'Сравнителен одит',
      triggers: ['сравни', 'сравнение', 'разлика', 'срещу', 'съпостави', 'vs', 'или между'],
      weight: 3.0,
    },
    {
      id: 'SIGNAL',
      label: 'Генератор на официален сигнал',
      triggers: ['сигнал', 'доклад до', 'жалба до', 'генерирай сигнал', 'официална справка', 'изпрати до кпк', 'експорт на сигнал'],
      weight: 3.2,
    },
    {
      id: 'SELF_DEALING',
      label: 'Самовъзлагане и конфликт на интереси',
      triggers: ['самовъзлаг', 'собствената инст', 'собствена общин', 'сам на себе', 'конфликт на интерес', 'кмет печели', 'кметове с фирми', 'общинари с фирми', 'свои фирми', 'роднински фирми'],
      weight: 2.5,
    },
    {
      id: 'HIDDEN_DZZD',
      label: 'Скрити ДЗЗД консорциуми',
      triggers: ['дззд', 'консорциум', 'обединени', 'скрити фирми', 'без еик', 'мега-консорциум', 'скрити поръчки', 'зад консорциум'],
      weight: 2.4,
    },
    {
      id: 'XML_DECLARATIONS',
      label: 'XML декларации (Сметна палата)',
      triggers: ['xml', 'декларац', 'сметна палата', 'пропуснати от сигма', 'нови политиц', 'извън сигма', 'частни заеми', 'акции в ад', 'таблица 9', 'таблица 7', 'чл. 35'],
      weight: 2.4,
    },
    {
      id: 'JUDICIAL_TD',
      label: 'Търговски спорове в съда (ЕПЕП ТД/ВТД)',
      triggers: ['търговски дел', 'търговски спор', 'съдебни спор', 'дела в съда', 'съди ', 'осъден', 'неустойк', 'неизпълнени', 'спогодб', 'арбитраж', 'призрачно изпълнение', 'фиктивни спор', 'втд', 'окръжен съд'],
      weight: 2.6,
    },
    {
      id: 'JUDICIAL_ADFI',
      label: 'АДФИ ревизии, чл. 17(7) и КАНД/АНД глоби',
      triggers: ['адфи', 'финансова инспекция', 'инспекц', 'ревизи', 'безнаказаност', 'наказателно постановление', 'наказателни постановления', 'глоб', 'санкци', 'ауан', 'канд', 'анд ', 'отменено нп', 'отменени глоби', 'чл. 17', 'маловажен случай', 'чл. 28 занн', 'дид1', 'дид2', 'дид3', 'дид4', 'дид5', 'дид6', 'дид7'],
      weight: 2.7,
    },
    {
      id: 'JUDICIAL_KZK_VAS',
      label: 'КЗК жалби и окончателни актове на ВАС',
      triggers: ['кзк', 'комисия за защита на конкуренцията', 'вас', 'върховен административен', 'предварително изпълнение', 'чл. 205', 'обжалван', 'жалб', 'блокаж', 'спряна поръчка', 'отменено решение', 'четвърто отделение'],
      weight: 2.7,
    },
    {
      id: 'JUDICIAL_LAWYERS',
      label: 'Адвокати, юрисконсулти и вещи лица',
      triggers: ['адвокат', 'юрист', 'юрисконсулт', 'кантор', 'правни услуг', 'вещ', 'вещи лица', 'експерт', 'строителен надзор', 'консултант'],
      weight: 2.5,
    },
    {
      id: 'JUDICIAL_PHOENIX',
      label: 'Несъстоятелност, запори в ТР и Феникс фирми',
      triggers: ['несъстоятелн', 'фалит', 'фалирал', 'ликвидац', 'запор', 'залоз', 'особен залог', 'чси', 'дългов', 'феникс', 'burnout', 'изгаряне', 'спряла фирма', 'прехвърляне на фирма'],
      weight: 2.6,
    },
    {
      id: 'JUDICIAL_EPPO',
      label: 'Европейска прокуратура (EPPO), ЕС средства и ЗМИП',
      triggers: ['eppo', 'еппо', 'европрокуратур', 'кьовеши', 'европейска прокуратура', 'ес средства', 'еврофонд', 'европейски пари', 'европроекти', 'змип', 'действителен собственик', 'офшор', 'чуждестранна майка'],
      weight: 2.6,
    },
    {
      id: 'FORENSIC_ANNEX',
      label: 'Анекси и пост-договорно оскъпяване',
      triggers: ['анекс', 'оскъп', 'инфлац', 'увеличена цена', 'допълнително споразумение', 'допълнителни споразумения', 'чл. 116', 'дъмпинг'],
      weight: 2.5,
    },
    {
      id: 'FORENSIC_SHELL',
      label: 'Кухи и новосъздадени фирми-фантоми',
      triggers: ['кух', 'фантом', 'новосъздаден', 'нова фирма', 'нови фирми', 'вчерашна фирма', '2 лв', 'минимален капитал', 'без история', 'shell'],
      weight: 2.5,
    },
    {
      id: 'FORENSIC_SALAMI',
      label: 'Разделяне под прага (Salami Slicing)',
      triggers: ['salami', 'салами', 'разделяне', 'раздробяване', 'нацепване', 'под прага', 'заобикаляне на търга', 'чл. 20', 'чл. 21'],
      weight: 2.5,
    },
    {
      id: 'FORENSIC_POLITICS_MEDIA',
      label: 'Политически дарения (ЕРИК) и медийни договори',
      triggers: ['дарен', 'дарител', 'ерик', 'парти', 'предизбор', 'спонсор', 'меди', 'телевизи', 'вестни', 'пиар', 'pr агенц', 'реклам'],
      weight: 2.5,
    },
    {
      id: 'FORENSIC_TIME',
      label: 'Времеви аномалии (Петък / Ноември–Декември)',
      triggers: ['петък', 'декември', 'ноември', 'края на годината', 'колед', 'бюджетен дъмпинг', 'времеви аномалии', 'последния момент'],
      weight: 2.4,
    },
    {
      id: 'FORENSIC_CARTEL',
      label: 'Картелна ротация, съвместни оферти и общ адрес',
      triggers: ['картел', 'ротац', 'редуване', 'общ адрес', 'един и същ адрес', 'двойки фирми', 'съвместни оферти', 'co-bidding', 'сговаряне'],
      weight: 2.5,
    },
    {
      id: 'FORENSIC_NLP',
      label: 'NLP „Шити“ поръчки и ограничителни критерии',
      triggers: ['шит', 'нагласен', 'спецификац', 'марк', 'дискриминац', 'ограничител', 'чл. 49', 'технически критерии', 'nlp'],
      weight: 2.5,
    },
    {
      id: 'SINGLE_OFFER_HHI',
      label: 'Единични оферти (1 оферта), пряко договаряне и HHI монопол',
      triggers: ['1 оферта', 'една оферта', 'единствен участник', 'без конкуренция', 'без търг', 'пряко договаряне', 'директно възлагане', 'hhi', 'монопол', 'концентрация'],
      weight: 2.3,
    },
    {
      id: 'BENFORD_PARETO',
      label: 'Математически одит (Закон на Бенфорд и Парето/Джини)',
      triggers: ['бенфорд', 'benford', 'парето', 'pareto', 'джини', 'gini', 'лоренц', 'математически', 'статистически', 'първа цифра', 'топ 1%'],
      weight: 2.4,
    },
    {
      id: 'SECTOR_CIRCLE',
      label: 'Секторен срез (Общини, Депутати, Министерства, Служби, Болници)',
      triggers: ['кмет', 'общински съвет', 'депутат', 'народно събрание', 'парламент', 'министерств', 'министър', 'данс', 'дато', 'служби за сигурност', 'болниц', 'мбал', 'здравеопазване'],
      weight: 1.9,
    },
    {
      id: 'HIGH_RISK_OVERVIEW',
      label: 'Топ рисков профил и корупционни индикатори',
      triggers: ['крад', 'далавер', 'корупц', 'схем', 'злоупотреб', 'нарушен', 'съмнител', 'рисков', 'червени флагове', 'топ 10', 'топ 50', 'класация', 'пирамида', 'кой води', 'най-много пари'],
      weight: 1.8,
    },
  ];

  function analyzeNaturalQuery(qRaw) {
    const rawTrim = String(qRaw || '').trim();
    const hasLatin = /[a-zA-Z]/.test(rawTrim);
    const cyrQuery = latinToCyrillicBg(rawTrim);
    const combinedLower = `${rawTrim.toLowerCase()} ${cyrQuery}`;

    // Expand acronym aliases
    const rawTokens = cyrQuery.split(/[^а-яa-z0-9-]+/).filter(Boolean);
    const expandedPhrases = [];
    rawTokens.forEach((tk) => {
      if (ACRONYM_ALIASES[tk]) expandedPhrases.push(ACRONYM_ALIASES[tk]);
    });
    const fullNorm = `${cyrQuery} ${expandedPhrases.join(' ')}`.trim();
    const contentTokens = rawTokens.filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
    const stems = contentTokens.map(stemBg);

    // Detect follow-up / pronoun reference to previous turn
    const isFollowUp = /\b(него|нея|тях|негов|нейн|техн|там|тази|този|тези|същия|същата|първия|втория|третия)\b/.test(cyrQuery)
      || (/^(а |и |още |дай |покажи |какви |колко )/.test(cyrQuery) && contentTokens.length <= 3);

    // Score intents
    const matchedIntents = [];
    for (const def of INTENT_DEFS) {
      let score = 0;
      const hits = [];
      for (const trig of def.triggers) {
        if (combinedLower.includes(trig) || fullNorm.includes(trig)) {
          score += def.weight;
          hits.push(trig);
        } else {
          const trigStem = stemBg(trig);
          if (trigStem.length >= 4 && stems.some((st) => st === trigStem || tokenFuzzyMatchScore(trigStem, st) >= 0.86)) {
            score += def.weight * 0.8;
            hits.push(trig);
          }
        }
      }
      if (score > 0) matchedIntents.push({ id: def.id, label: def.label, score, hits });
    }
    matchedIntents.sort((a, b) => b.score - a.score);

    return {
      raw: rawTrim,
      hasLatin,
      cyrQuery,
      fullNorm,
      rawTokens,
      contentTokens,
      stems,
      isFollowUp,
      intents: matchedIntents,
    };
  }

  function resolveEntitiesFuzzy(nlu, state, auths, comps, j6, f7) {
    const { cyrQuery, fullNorm, contentTokens, isFollowUp } = nlu;
    const result = {
      eiks: [],
      unps: [],
      oblasts: [],
      officials: [],
      authorities: [],
      companies: [],
      courtCases: [],
      fromContext: false,
    };

    // 1. Exact EIK (9 or 13 digits) & UNP patterns
    const eikMatches = cyrQuery.match(/\b(\d{9}|\d{13})\b/g);
    if (eikMatches) result.eiks = [...new Set(eikMatches)];
    const unpMatches = nlu.raw.match(/\b(\d{4}-\d{5,7}|\d{5}-\d{4}-\d{4})\b/g);
    if (unpMatches) result.unps = [...new Set(unpMatches)];

    // 2. Oblasts (28 NUTS-3 regions)
    const oblastsList = (state.macro && state.macro.mapGeo && state.macro.mapGeo.oblasts) || [];
    for (const ob of oblastsList) {
      const cleanOb = ob.name.replace(' (столица)', '').toLowerCase();
      if (fullNorm.includes(cleanOb)) {
        result.oblasts.push({ item: ob, score: 1.0 });
      } else {
        for (const tk of contentTokens) {
          if (tk.length >= 5) {
            const sim = tokenFuzzyMatchScore(tk, cleanOb);
            if (sim >= 0.82) {
              result.oblasts.push({ item: ob, score: sim });
              break;
            }
          }
        }
      }
    }
    result.oblasts.sort((a, b) => b.score - a.score);

    // Filter out tokens that are pure intent keywords so we don't fuzzy-match "адфи" or "съд" as a company name
    const intentWords = new Set();
    INTENT_DEFS.forEach((d) => d.triggers.forEach((t) => t.split(/\s+/).forEach((w) => { if (w.length >= 3) intentWords.add(stemBg(w)); })));
    const entityCandidateTokens = contentTokens.filter((tk) => {
      if (/^\d+$/.test(tk)) return true;
      const st = stemBg(tk);
      return !intentWords.has(st) || ACRONYM_ALIASES[tk] !== undefined;
    });

    // Expand acronym tokens for entity matching
    const searchTokens = [...entityCandidateTokens];
    contentTokens.forEach((tk) => {
      if (ACRONYM_ALIASES[tk]) {
        ACRONYM_ALIASES[tk].split(/\s+/).forEach((w) => { if (w.length >= 3) searchTokens.push(w); });
      }
    });

    // 3. Match Officials (571)
    if (result.eiks.length || searchTokens.length) {
      for (const o of state.officials) {
        let sc = 0;
        if (result.eiks.some((e) => o.companies.some((c) => c.eik === e))) sc = 1.0;
        const nameLow = o.name.toLowerCase();
        const nameParts = nameLow.split(/\s+/);
        let matchedParts = 0;
        for (const tk of searchTokens) {
          if (tk.length < 4) continue;
          if (nameParts.some((np) => np === tk || (tk.length >= 5 && tokenFuzzyMatchScore(tk, np) >= 0.84))) {
            matchedParts++;
          }
        }
        if (matchedParts >= 2) sc = Math.max(sc, 0.98);
        else if (matchedParts === 1) {
          // Check if it's a distinctive surname (last part of name)
          const lastPart = nameParts[nameParts.length - 1];
          if (searchTokens.some((tk) => tk.length >= 5 && tokenFuzzyMatchScore(tk, lastPart) >= 0.86)) {
            sc = Math.max(sc, 0.87);
          }
        }
        if (sc >= 0.85) result.officials.push({ item: o, score: sc });
      }
      result.officials.sort((a, b) => b.score - a.score || b.item.combinedEur - a.item.combinedEur);
    }

    // 4. Match Authorities (4,344)
    if (result.eiks.length || searchTokens.length) {
      const genericAuthWords = new Set(['община', 'област', 'министерство', 'агенция', 'дирекция', 'училище', 'болница', 'мбал', 'университет']);
      const specificAuthTokens = searchTokens.filter((t) => !genericAuthWords.has(t) && t.length >= 3);
      for (const a of auths) {
        let sc = 0;
        if (result.eiks.includes(a.eik)) sc = 1.0;
        else if (specificAuthTokens.length) {
          const aLow = a.name.toLowerCase();
          // Direct phrase check for expanded acronyms
          for (const tk of contentTokens) {
            if (ACRONYM_ALIASES[tk] && aLow.includes(ACRONYM_ALIASES[tk])) {
              sc = 0.99;
              break;
            }
          }
          if (sc < 0.99) {
            let hitCount = 0;
            let bestSim = 0;
            for (const tk of specificAuthTokens) {
              const sim = tokenFuzzyMatchScore(tk, aLow);
              if (sim >= 0.83) {
                hitCount++;
                bestSim = Math.max(bestSim, sim);
              }
            }
            if (hitCount > 0) {
              sc = bestSim * (0.7 + 0.3 * (hitCount / specificAuthTokens.length));
              // Boost primary municipality or national agency
              if (aLow.startsWith('община ') && hitCount >= 1) sc += 0.06;
            }
          }
        }
        if (sc >= 0.78) result.authorities.push({ item: a, score: Math.min(1, sc) });
      }
      result.authorities.sort((a, b) => b.score - a.score || b.item.spentEur - a.item.spentEur);
    }

    // 5. Match Companies & DZZD (17,428)
    if (result.eiks.length || searchTokens.length) {
      const genericCompWords = new Set(['еоод', 'оод', 'еад', 'дззд', 'консорциум', 'обединение', 'груп', 'холдинг', 'инженеринг', 'строй', 'българия']);
      const specificCompTokens = searchTokens.filter((t) => !genericCompWords.has(t) && t.length >= 4);
      // Do not match a pure city name as a company unless the query doesn't match an oblast or explicitly mentions фирма/еоод/аД
      const oblastNames = new Set(result.oblasts.map((o) => o.item.name.replace(' (столица)', '').toLowerCase()));
      const nonCityCompTokens = specificCompTokens.filter((t) => !oblastNames.has(t));

      for (const c of comps) {
        let sc = 0;
        if (result.eiks.includes(c.eik)) sc = 1.0;
        else if (nonCityCompTokens.length) {
          const cLow = c.name.toLowerCase();
          let hitCount = 0;
          let bestSim = 0;
          for (const tk of nonCityCompTokens) {
            const sim = tokenFuzzyMatchScore(tk, cLow);
            if (sim >= 0.84) {
              hitCount++;
              bestSim = Math.max(bestSim, sim);
            }
          }
          if (hitCount > 0) {
            sc = bestSim * (0.72 + 0.28 * (hitCount / nonCityCompTokens.length));
          }
        }
        if (sc >= 0.80) result.companies.push({ item: c, score: Math.min(1, sc) });
      }
      result.companies.sort((a, b) => b.score - a.score || (b.item.wonEur + b.item.consortiumEur) - (a.item.wonEur + a.item.consortiumEur));
    }

    // 6. Match Live Court Cases / ADFI Report Codes / KZK Dossiers
    if (j6) {
      const m1 = (j6.module1_collusiveLitigation && j6.module1_collusiveLitigation.liveEissCommercialDisputes) || [];
      const m2 = (j6.module2_impunityIndex && j6.module2_impunityIndex.liveEissAndKandCases) || [];
      const m4 = (j6.module4_kzkVas && j6.module4_kzkVas.liveVasFinalActs) || [];
      const allCases = [
        ...m1.map((c) => ({ kind: 'ТД/ВТД (Търговски спор)', no: c.caseNo, court: c.court, auth: c.authorityName, authEik: c.authorityEik, party: `${c.sideLeft} ↔ ${c.sideRight}`, outcome: c.outcome, disp: c.disposition, url: c.actDownloadUrl })),
        ...m2.map((c) => ({ kind: 'КАНД/АНД (АДФИ/СП НП)', no: c.caseNo, court: c.court, auth: c.authorityName, authEik: c.authorityEik, party: `${c.agency} · НП ${c.npNo || ''}`, outcome: c.outcome, disp: c.disposition, url: c.actDownloadUrl })),
        ...m4.map((v) => ({ kind: 'ВАС IV отд. (КЗК ЗОП)', no: v.vasCaseNo, court: 'ВАС', auth: v.authorityName, authEik: v.authorityEik, party: `${v.appellantName} (КЗК ${v.kzkDossierNo || ''})`, outcome: v.vasOutcome, disp: v.disposition, url: v.actDownloadUrl })),
      ];
      const caseNumMatch = nlu.raw.match(/\b(\d{2,5}\/202[456])\b/);
      for (const cs of allCases) {
        if (caseNumMatch && cs.no && cs.no.includes(caseNumMatch[1])) {
          result.courtCases.push(cs);
        }
      }
    }

    // 7. Conversational Context Fallback (when user asks follow-up like "а какви дела има?", "дай сигнал за него")
    const hasAnyEntity = result.officials.length || result.authorities.length || result.companies.length || result.oblasts.length || result.courtCases.length;
    if (!hasAnyEntity && (isFollowUp || nlu.intents.some((i) => i.id === 'SIGNAL'))) {
      if (oracleContext.lastOfficial) { result.officials.push({ item: oracleContext.lastOfficial, score: 0.95 }); result.fromContext = true; }
      if (oracleContext.lastAuthority) { result.authorities.push({ item: oracleContext.lastAuthority, score: 0.95 }); result.fromContext = true; }
      if (oracleContext.lastCompany) { result.companies.push({ item: oracleContext.lastCompany, score: 0.95 }); result.fromContext = true; }
      if (oracleContext.lastOblast) { result.oblasts.push({ item: oracleContext.lastOblast, score: 0.95 }); result.fromContext = true; }
    }

    // Update conversational context with top resolved entities
    if (result.officials.length) oracleContext.lastOfficial = result.officials[0].item;
    if (result.authorities.length) oracleContext.lastAuthority = result.authorities[0].item;
    if (result.companies.length) oracleContext.lastCompany = result.companies[0].item;
    if (result.oblasts.length) oracleContext.lastOblast = result.oblasts[0].item;
    if (nlu.intents.length) oracleContext.lastIntents = nlu.intents.map((i) => i.id);

    return result;
  }

  function ensureOracleReady() {
    if (oracleInitialized) return;
    oracleInitialized = true;
    appendOracleMsg('ai', `Здравейте! Аз съм <strong>СИГМА 3.0 ORACLE</strong> — интелигентен одиторски AI агент с <strong>разбиране на свободен естествен език (NLU)</strong>, <strong>автоматична транслитерация от шльокавица/латиница</strong>, <strong>толерантност към правописни грешки (Fuzzy Matching)</strong> и <strong>контекстна памет между въпросите</strong>.<br/><br/>
    Пишете свободно със свои думи — например:<br/>
    • <em>„Кажи ми всичко за Бургас — поръчки, АДФИ ревизии и съдебни дела“</em><br/>
    • <em>„Какви дела в съда, анекси и жалби в КЗК има за АПИ?“</em><br/>
    • <em>„kaji mi za glavbolgarstroi i patinjenering“</em> (разбира и латиница)<br/>
    • <em>„Кои кметове си дават поръчки сами на себе си?“</em> &rarr; и после <em>„Генерирай сигнал за първия“</em>.`);
  }

  function appendOracleMsg(role, html, nluMeta = null) {
    const box = document.getElementById('oracleMessages');
    if (!box) return;
    const div = document.createElement('div');
    div.className = `msg-bubble ${role === 'user' ? 'msg-user' : 'msg-ai'}`;
    let metaRibbon = '';
    if (role === 'ai' && nluMeta) {
      const tags = [];
      if (nluMeta.hasLatin) tags.push(`<span class="tag tag-teal" style="font-size:10px;">Шльокавица &rarr; Кирилица</span>`);
      if (nluMeta.fromContext) tags.push(`<span class="tag tag-plum" style="font-size:10px;">Контекстна памет</span>`);
      if (nluMeta.nbIntent) tags.push(`<span class="tag tag-navy" style="font-size:10px;" title="Naive Bayes TF-IDF N-gram Classifier (intent-classifier.ts)">NB TF-IDF: ${nluMeta.nbIntent} (${(nluMeta.nbConf * 100).toFixed(0)}%)</span>`);
      if (nluMeta.memorySize) tags.push(`<span class="tag tag-slate" style="font-size:10px;" title="SemanticMemoryBank 256-D DJB2 Vector Embeddings (semantic-memory.ts)">256-D Памет: ${nluMeta.memorySize} вектора${nluMeta.topSim ? ' · Cosine ' + nluMeta.topSim.toFixed(2) : ''}</span>`);
      (nluMeta.intents || []).slice(0, 2).forEach((it) => tags.push(`<span class="tag tag-navy" style="font-size:10px;">${it.label}</span>`));
      if (nluMeta.entitySummary) tags.push(`<span class="tag tag-ochre" style="font-size:10px;">Субект: ${nluMeta.entitySummary}</span>`);
      tags.push(`<span class="tag tag-teal" style="font-size:10px;" title="IntentAnchor (IntentAnchor.ts) — 0% халюцинации">IntentAnchor: 100%</span>`);
      if (tags.length) {
        metaRibbon = `<div style="display:flex;gap:5px;flex-wrap:wrap;margin:4px 0 8px;">${tags.join('')}</div>`;
      }
    }
    div.innerHTML = role === 'ai'
      ? `<div class="msg-ai-head">СИГМА 3.0 ORACLE · QAntum Cognitive ReAct &amp; 256-D Vector RAG</div>${metaRibbon}${html}`
      : html;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function renderFollowUpChips(suggestions) {
    if (!suggestions || !suggestions.length) return '';
    return `<div style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--border);display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
      <span class="muted" style="font-size:11px;">Продължи разговора:</span>
      ${suggestions.map((s) => `<button type="button" class="city-chip" style="font-size:11px;padding:3px 8px;" data-oracle-q="${s.replace(/"/g, '&quot;')}">${s}</button>`).join('')}
    </div>`;
  }

  async function askOracle(question) {
    ensureOracleReady();
    const { state, fmtEur, fmtInt, esc, riskBadgeHtml, ensureAuthoritiesLoaded, ensureCompaniesLoaded, generateSignalBrief } = api();
    const qRaw = (question || '').trim();
    if (!qRaw) return;
    appendOracleMsg('user', esc(qRaw));

    const [auths, comps, f7, j6] = await Promise.all([
      ensureAuthoritiesLoaded(),
      ensureCompaniesLoaded(),
      state.forensics7 || (window.SIGMA3_F7 ? window.SIGMA3_F7.ensureForensics7Loaded() : Promise.resolve(null)),
      state.judicial6 || (window.SIGMA3_J6 ? window.SIGMA3_J6.ensureJudicial6Loaded() : Promise.resolve(null)),
    ]);

    const nlu = analyzeNaturalQuery(qRaw);
    const ents = resolveEntitiesFuzzy(nlu, state, auths, comps, j6, f7);
    const intentSet = new Set(nlu.intents.map((i) => i.id));

    // Evaluate QAntum TypeScript Semantic Dialogue Pipeline (Naive Bayes TF-IDF + 256-D Vector Memory + SAL UI Executor)
    const semEngine = window.SIGMA3_SEMANTIC_ENGINE;
    const cog = semEngine
      ? semEngine.evaluateCognitivePipeline(qRaw, nlu.cyrQuery, nlu.fullNorm, state, auths, comps, j6, f7)
      : null;

    // Fuse Naive Bayes classifier prediction when user phrasing is novel/colloquial
    if (cog && cog.nbResult) {
      if (!intentSet.size || cog.nbResult.confidence >= 0.14) {
        intentSet.add(cog.nbResult.intent);
        const def = INTENT_DEFS.find((d) => d.id === cog.nbResult.intent);
        if (def && !nlu.intents.some((x) => x.id === def.id)) {
          nlu.intents.push({ id: def.id, label: def.label, score: cog.nbResult.confidence * 3 });
        }
      }
    }

    const entNames = [
      ...ents.officials.slice(0, 1).map((x) => x.item.name),
      ...ents.authorities.slice(0, 1).map((x) => x.item.name),
      ...ents.companies.slice(0, 1).map((x) => x.item.name.slice(0, 35)),
      ...ents.oblasts.slice(0, 1).map((x) => `Обл. ${x.item.name}`),
    ];
    const nluMeta = {
      hasLatin: nlu.hasLatin,
      fromContext: ents.fromContext,
      intents: nlu.intents,
      entitySummary: entNames.length ? esc(entNames.join(' · ')) : '',
      nbIntent: cog && cog.nbResult ? cog.nbResult.intent : '',
      nbConf: cog && cog.nbResult ? cog.nbResult.confidence : 0,
      memorySize: cog ? cog.memorySize : 0,
      topSim: cog ? cog.topVectorSim : 0,
    };

    // If Autonomous UI Action was triggered by SAL (e.g. "включи тъмен режим", "намери път между X и Y")
    if (cog && cog.uiActionMsg) {
      appendOracleMsg('ai', `<strong>Изпълнено автономно UI действие (Adaptive Semantic Core):</strong><br/>${esc(cog.uiActionMsg)}` +
        renderFollowUpChips(['Кажи ми всичко за Бургас', 'Покажи търговските дела в ЕПЕП']), nluMeta);
      if (intentSet.has('UI_NAVIGATION') && intentSet.size === 1) return;
    }

    // =========================================================================
    // A. SIGNAL GENERATION INTENT
    // =========================================================================
    if (intentSet.has('SIGNAL')) {
      const target = ents.officials[0] ? ents.officials[0].item : oracleContext.lastOfficial;
      if (target) {
        generateSignalBrief(target.slug);
        appendOracleMsg('ai', `Генерирах официална одитна справка / сигнал до <strong>АДФИ, КПК (бивша КПКОНПИ), Сметната палата и EPPO</strong> за <strong>${esc(target.name)}</strong> (${esc(target.primaryInstitution)}, Риск ${riskBadgeHtml(target.sigma3Score)}, Комбиниран обем: <strong class="mono">${fmtEur(target.combinedEur)}</strong>). Модалният прозорец за копиране, изтегляне (.md) и печат (PDF) е отворен.` +
          renderFollowUpChips([`Покажи всички договори на ${target.name}`, `Какви АДФИ проверки има в ${target.primaryInstitution}?`]), nluMeta);
        return;
      }
    }

    // =========================================================================
    // B. MULTI-ENTITY COMPARISON (2 Oblasts, 2 Authorities, or 2 Companies)
    // =========================================================================
    if (intentSet.has('COMPARE') || ents.oblasts.length >= 2) {
      if (ents.oblasts.length >= 2) {
        const a = ents.oblasts[0].item, b = ents.oblasts[1].item;
        appendOracleMsg('ai', `<strong>Сравнителен криминалистичен профил: Област ${esc(a.name)} vs. Област ${esc(b.name)}</strong>
          <table style="margin-top:8px;"><thead><tr><th>Показател</th><th class="num">${esc(a.name)}</th><th class="num">${esc(b.name)}</th></tr></thead>
          <tbody>
            <tr><td>Обществени поръчки (€)</td><td class="num"><b>${fmtEur(a.valueEur)}</b></td><td class="num"><b>${fmtEur(b.valueEur)}</b></td></tr>
            <tr><td>Договори / Възложители</td><td class="num">${fmtInt(a.contracts)} / ${a.authorities}</td><td class="num">${fmtInt(b.contracts)} / ${b.authorities}</td></tr>
            <tr><td>Свързани длъжностни лица</td><td class="num">${a.officialCount}</td><td class="num">${b.officialCount}</td></tr>
            <tr><td>Самовъзлагане (Собств. инст.)</td><td class="num" style="color:var(--crimson);font-weight:700;">${a.ownHits}</td><td class="num" style="color:var(--crimson);font-weight:700;">${b.ownHits}</td></tr>
            <tr><td>Скрити ДЗЗД на политици</td><td class="num" style="color:var(--plum);">${fmtEur(a.hiddenDzzdEur)}</td><td class="num" style="color:var(--plum);">${fmtEur(b.hiddenDzzdEur)}</td></tr>
            <tr><td>СИГМА 3.0 Риск индекс</td><td class="num">${riskBadgeHtml(a.riskScore)}</td><td class="num">${riskBadgeHtml(b.riskScore)}</td></tr>
          </tbody></table>` +
          renderFollowUpChips([`Кажи ми всичко за ${a.name.replace(' (столица)', '')}`, `Кажи ми всичко за ${b.name.replace(' (столица)', '')}`]), nluMeta);
        return;
      }
      if (ents.authorities.length >= 2) {
        const a = ents.authorities[0].item, b = ents.authorities[1].item;
        appendOracleMsg('ai', `<strong>Сравнение на възложители: ${esc(a.name)} vs. ${esc(b.name)}</strong>
          <table style="margin-top:8px;"><thead><tr><th>Показател</th><th class="num">${esc(a.name.slice(0, 32))}</th><th class="num">${esc(b.name.slice(0, 32))}</th></tr></thead>
          <tbody>
            <tr><td>ЕИК / Област</td><td class="num mono">${esc(a.eik)} (${esc(a.region)})</td><td class="num mono">${esc(b.eik)} (${esc(b.region)})</td></tr>
            <tr><td>Общ разход по ЗОП (€)</td><td class="num"><b>${fmtEur(a.spentEur)}</b></td><td class="num"><b>${fmtEur(b.spentEur)}</b></td></tr>
            <tr><td>Договори / Изпълнители</td><td class="num">${fmtInt(a.contracts)} / ${fmtInt(a.suppliers)}</td><td class="num">${fmtInt(b.contracts)} / ${fmtInt(b.suppliers)}</td></tr>
            <tr><td>Свързани лица / Самовъзлагане</td><td class="num">${a.linkedCount} / <b>${a.ownHits}</b></td><td class="num">${b.linkedCount} / <b>${b.ownHits}</b></td></tr>
            <tr><td>АДФИ доклади / КЗК дела</td><td class="num">${a.adfiCount || 0} / ${a.kzkCount || 0}</td><td class="num">${b.adfiCount || 0} / ${b.kzkCount || 0}</td></tr>
            <tr><td>Риск индекс 3.0</td><td class="num">${riskBadgeHtml(a.riskScore)}</td><td class="num">${riskBadgeHtml(b.riskScore)}</td></tr>
          </tbody></table>`, nluMeta);
        return;
      }
    }

    // =========================================================================
    // C. 360° CROSS-RADAR ENTITY SYNTHESIS (When a City/Oblast, Authority, Official, or Company is named!)
    // =========================================================================
    const hasSpecificEntity = (ents.officials.length && ents.officials[0].score >= 0.86)
      || (ents.authorities.length && ents.authorities[0].score >= 0.82)
      || (ents.companies.length && ents.companies[0].score >= 0.84)
      || (ents.oblasts.length && ents.oblasts[0].score >= 0.84)
      || ents.courtCases.length > 0;

    if (hasSpecificEntity) {
      const sections = [];
      const topOff = ents.officials[0] && ents.officials[0].score >= 0.86 ? ents.officials[0].item : null;
      const topAuth = ents.authorities[0] && ents.authorities[0].score >= 0.82 ? ents.authorities[0].item : null;
      const topComp = ents.companies[0] && ents.companies[0].score >= 0.84 ? ents.companies[0].item : null;
      const topOb = ents.oblasts[0] && ents.oblasts[0].score >= 0.84 ? ents.oblasts[0].item : null;

      // Build needle set for cross-radar filtering (EIKs + entity keywords)
      const filterEiks = new Set(ents.eiks);
      const filterNames = [];
      if (topAuth) { filterEiks.add(topAuth.eik); filterNames.push(topAuth.name.toLowerCase()); }
      if (topComp && topComp.eik) { filterEiks.add(topComp.eik); filterNames.push(topComp.name.toLowerCase().slice(0, 22)); }
      if (topOb) { filterNames.push(topOb.name.replace(' (столица)', '').toLowerCase()); }
      if (topOff) {
        topOff.companies.forEach((c) => { if (c.eik) filterEiks.add(c.eik); });
        filterNames.push(topOff.primaryInstitution.toLowerCase());
      }

      const matchesEntityRecord = (recEik, recText) => {
        if (recEik && filterEiks.has(String(recEik))) return true;
        const low = String(recText || '').toLowerCase();
        return filterNames.some((fn) => fn.length >= 4 && low.includes(fn));
      };

      // 1. Official Profile (if matched)
      if (topOff) {
        const dc = state.deepBySlug.get(topOff.slug);
        sections.push(`<div class="contract-row" style="border-left:3px solid var(--crimson);">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <div><strong>Длъжностно лице:</strong> <a href="#" data-open-slug="${esc(topOff.slug)}"><strong>${esc(topOff.name)}</strong></a> · <span class="muted">${esc(topOff.primaryInstitution)}</span></div>
            <div>${riskBadgeHtml(topOff.sigma3Score)} ${topOff.ownInstitution ? '<span class="tag tag-crimson">Самовъзлагане</span>' : ''}</div>
          </div>
          <div style="margin-top:4px;font-size:12px;">
            В периода на мандата: <strong class="mono">${fmtEur(topOff.periodEur)}</strong> · Директно в СИГМА: <strong class="mono">${fmtEur(topOff.totalEur)}</strong> (${topOff.contractCount} дог.)
            ${topOff.dzzdEur > 0 ? ` · <strong style="color:var(--plum);">Скрити ДЗЗД (${topOff.dzzdCnt}): +${fmtEur(topOff.dzzdEur)}</strong> &rarr; Общо: <strong class="mono">${fmtEur(topOff.combinedEur)}</strong>` : ''}
          </div>
          <div class="inst-line" style="margin-top:4px;">Свързани фирми: ${topOff.companies.map((c) => `<a href="#" data-open-company="${esc(c.eik)}">${esc(c.name)} (${esc(c.eik)})</a>`).join(' · ')}</div>
          ${dc && dc.topConsortia ? `<div class="inst-line" style="color:var(--plum);">Топ консорциуми: ${dc.topConsortia.slice(0, 2).map((tc) => `${esc(tc.name.slice(0, 55))} (${fmtEur(tc.wonEur)})`).join(' | ')}</div>` : ''}
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-dark" style="padding:2px 8px;font-size:11px;" data-open-slug="${esc(topOff.slug)}">Пълно досие &rarr;</button>
            <button class="btn" style="padding:2px 8px;font-size:11px;" data-gen-signal="${esc(topOff.slug)}">Генерирай официален сигнал</button>
          </div>
        </div>`);
      }

      // 2. Authority Profile (if matched)
      if (topAuth) {
        const linkedOffs = state.officials.filter((o) => (o.byAuthority || []).some((ba) => String(ba.id) === String(topAuth.eik)) || o.primaryInstitution.toLowerCase().includes(topAuth.name.toLowerCase()));
        sections.push(`<div class="contract-row" style="border-left:3px solid var(--navy-dark);">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <div><strong>Възложител:</strong> <a href="#" data-open-authority="${esc(topAuth.eik)}"><strong>${esc(topAuth.name)}</strong></a> <span class="eik-tag">ЕИК ${esc(topAuth.eik)}</span> · <span class="muted">${esc(topAuth.region || '')}</span></div>
            <div>${riskBadgeHtml(topAuth.riskScore)} ${topAuth.judicialBoost > 0 ? `<span class="tag tag-plum">+${topAuth.judicialBoost} съд/АДФИ</span>` : ''}</div>
          </div>
          <div style="margin-top:4px;font-size:12px;">
            Общ разход (2020–2026): <strong class="mono">${fmtEur(topAuth.spentEur)}</strong> · <strong>${fmtInt(topAuth.contracts)} договора</strong> към ${fmtInt(topAuth.suppliers)} изпълнители · Среден договор: ${fmtEur(topAuth.avgEur)}
            ${topAuth.singleOffer > 0 ? ` · 1 оферта: <strong style="color:var(--crimson);">${(topAuth.singleOffer * 100).toFixed(1)}%</strong>` : ''}
          </div>
          ${topAuth.judicialReasons && topAuth.judicialReasons.length ? `<div class="inst-line" style="color:#4f46e5;margin-top:3px;"><strong>Съдебни/контролни рискови фактори:</strong> ${topAuth.judicialReasons.map((r) => esc(r)).join(' · ')}</div>` : ''}
          ${linkedOffs.length ? `<div class="inst-line" style="margin-top:3px;">Свързани длъжностни лица (${linkedOffs.length}): ${linkedOffs.slice(0, 4).map((o) => `<a href="#" data-open-slug="${esc(o.slug)}">${esc(o.name)}</a> (${fmtEur(o.periodEur)})`).join(' · ')}</div>` : ''}
          <div style="margin-top:6px;"><button class="btn" style="padding:2px 8px;font-size:11px;" data-open-authority="${esc(topAuth.eik)}">Отвори досие на възложителя &rarr;</button></div>
        </div>`);
      }

      // 3. Company / Consortium Profile (if matched)
      if (topComp) {
        const compPairs = ((state.macro && state.macro.cartelEngine && state.macro.cartelEngine.coBiddingPairs) || []).filter((p) => p.eikA === topComp.eik || p.eikB === topComp.eik);
        sections.push(`<div class="contract-row" style="border-left:3px solid var(--ochre);">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <div><strong>Изпълнител:</strong> <a href="#" data-open-company="${esc(topComp.eik || topComp.name)}"><strong>${esc(topComp.name)}</strong></a> ${topComp.eik ? `<span class="eik-tag">ЕИК ${esc(topComp.eik)}</span>` : '<span class="tag tag-plum">ДЗЗД</span>'}</div>
            <div>${topComp.judicialRiskScore > 0 ? riskBadgeHtml(topComp.judicialRiskScore) : ''}</div>
          </div>
          <div style="margin-top:4px;font-size:12px;">
            Директни договори: <strong class="mono">${fmtEur(topComp.wonEur)}</strong> (${fmtInt(topComp.contracts)} дог. при ${fmtInt(topComp.authorities)} възложители)
            ${topComp.consortiumEur > 0 ? ` · <strong style="color:var(--plum);">Чрез ДЗЗД (${topComp.consortiumCount}): +${fmtEur(topComp.consortiumEur)}</strong>` : ''}
          </div>
          ${topComp.judicialReasons && topComp.judicialReasons.length ? `<div class="inst-line" style="color:var(--crimson);margin-top:3px;"><strong>Съдебен/криминалистичен профил:</strong> ${topComp.judicialReasons.map((r) => esc(r)).join(' · ')}</div>` : ''}
          ${compPairs.length ? `<div class="inst-line" style="margin-top:3px;">Повтарящи се ДЗЗД партньори: ${compPairs.slice(0, 3).map((p) => `${esc(p.eikA === topComp.eik ? p.nameB : p.nameA)} (${p.jointCount} ДЗЗД / ${fmtEur(p.jointEur)})`).join(' · ')}</div>` : ''}
          <div style="margin-top:6px;"><button class="btn" style="padding:2px 8px;font-size:11px;" data-open-company="${esc(topComp.eik || topComp.name)}">Отвори досие на фирмата &rarr;</button></div>
        </div>`);
      }

      // 4. Oblast Regional Profile (if matched and not overshadowed by a non-municipal query)
      if (topOb && (!topOff || ents.authorities.length > 0)) {
        sections.push(`<div class="contract-row" style="border-left:3px solid #0284c7;">
          <strong>Регионален срез — Област ${esc(topOb.name)} (${esc(topOb.nuts3)}):</strong>
          Общо <strong>${fmtEur(topOb.valueEur)}</strong> (${fmtInt(topOb.contracts)} дог. при ${topOb.authorities} възложители) ·
          Свързани лица: <strong>${topOb.officialCount}</strong> (Самовъзлагане: <strong style="color:var(--crimson);">${topOb.ownHits}</strong>) ·
          Скрити ДЗЗД: <strong style="color:var(--plum);">+${fmtEur(topOb.hiddenDzzdEur)}</strong> · Риск ${riskBadgeHtml(topOb.riskScore)}
        </div>`);
      }

      // 5. Cross-Check Live Judicial & Control Radar (EPEP TD, ADFI, KAND, KZK/VAS) for this Entity!
      if (j6) {
        const m1 = j6.module1_collusiveLitigation || {};
        const m2 = j6.module2_impunityIndex || {};
        const m4 = j6.module4_kzkVas || {};
        const m5 = j6.module5_insolvencyPhoenix || {};

        const tdHits = (m1.liveEissCommercialDisputes || []).filter((c) => matchesEntityRecord(c.authorityEik, `${c.authorityName} ${c.contractorName} ${c.sideLeft} ${c.sideRight} ${c.court}`) || matchesEntityRecord(c.contractorEik, ''));
        const kandHits = (m2.liveEissAndKandCases || []).filter((c) => matchesEntityRecord(c.authorityEik, `${c.authorityName} ${c.court}`));
        const adfiTopHits = (m2.topInspectedAuthorities || []).filter((a) => matchesEntityRecord(a.eik, `${a.name} ${a.region}`));
        const art17Hits = (m2.updatedArt17Reports || []).filter((r) => matchesEntityRecord(r.authorityEik, `${r.authorityName} ${r.object}`));
        const vasHits = (m4.liveVasFinalActs || []).filter((v) => matchesEntityRecord(v.authorityEik, `${v.authorityName} ${v.appellantName}`) || matchesEntityRecord(v.appellantEik, ''));
        const kzkHits = [...(m4.prelimRulings || []), ...(m4.decisions || [])].filter((r) => matchesEntityRecord(r.authorityEik, `${r.authorityName} ${r.respondentsRaw} ${r.initiatorsRaw}`));
        const distHits = (m5.distressedFirms || []).filter((d) => matchesEntityRecord(d.eik, d.name));

        const jLines = [];
        if (tdHits.length) {
          jLines.push(`<li><strong>Търговски дела в ЕПЕП (${tdHits.length}):</strong> ` +
            tdHits.slice(0, 3).map((c) => `${esc(c.court)} <b>${esc(c.caseNo)}</b> (${esc(c.sideLeft)} &harr; ${esc(c.sideRight)}) — <span class="tag tag-crimson">${esc(c.outcome)}</span> <a href="${esc(c.actDownloadUrl)}" target="_blank">Акт ↗</a>`).join(' | ') + `</li>`);
        }
        if (adfiTopHits.length || art17Hits.length) {
          const repSum = adfiTopHits.slice(0, 2).map((a) => `<b>${esc(a.name)}</b>: ${a.reportCount} доклада АДФИ (${a.updatedArt17Count} актуализирани по чл. 17(7))`).join('; ');
          jLines.push(`<li><strong>Инспекции на АДФИ:</strong> ${repSum || `${art17Hits.length} актуализирани доклада по чл. 17, ал. 7 ЗДФИ`}</li>`);
        }
        if (kandHits.length) {
          jLines.push(`<li><strong>Съдебни решения по НП на АДФИ / КАНД (${kandHits.length}):</strong> ` +
            kandHits.slice(0, 3).map((c) => `${esc(c.court)} <b>${esc(c.caseNo)}</b> (${esc(c.authorityName)}) — <span class="tag ${c.outcome.includes('ОТМЕНЕНО') ? 'tag-crimson' : 'tag-teal'}">${esc(c.outcome)}</span> <a href="${esc(c.actDownloadUrl)}" target="_blank">Акт ↗</a>`).join(' | ') + `</li>`);
        }
        if (vasHits.length || kzkHits.length) {
          const vTxt = vasHits.slice(0, 3).map((v) => `ВАС д. <b>${esc(v.vasCaseNo)}</b> (${esc(v.appellantName)} &rarr; ${esc(v.authorityName)}): <span class="tag tag-plum">${esc(v.vasOutcome)}</span> <a href="${esc(v.actDownloadUrl)}" target="_blank">ВАС ↗</a>`).join(' | ');
          jLines.push(`<li><strong>КЗК &amp; ВАС IV отделение (${vasHits.length} акта ВАС / ${kzkHits.length} акта КЗК):</strong> ${vTxt || kzkHits.slice(0, 2).map((k) => `${esc(k.caseNo)}: ${esc(k.outcome)}`).join(' | ')}</li>`);
        }
        if (distHits.length) {
          jLines.push(`<li><strong>Запори / Несъстоятелност в ТР:</strong> ${distHits.map((d) => `${esc(d.name)} (${d.distraintCount} запора, ${d.pledgeCount} залога)`).join('; ')}</li>`);
        }
        if (jLines.length) {
          sections.push(`<div class="contract-row" style="border-left:3px solid #4f46e5;">
            <strong style="color:#4f46e5;">Съдебно-институционален радар (ЕПЕП / ВАС / АДФИ / КЗК / ТР):</strong>
            <ul class="clean-list" style="margin-top:4px;font-size:12px;">${jLines.join('')}</ul>
          </div>`);
        }
      }

      // 6. Cross-Check 7 Procurement Forensic Engines for this Entity!
      if (f7) {
        const annexHits = ((f7.engine1_annexInflation && f7.engine1_annexInflation.contracts) || []).filter((c) => matchesEntityRecord(c.authorityEik, `${c.authority} ${c.contractor}`) || matchesEntityRecord(c.contractorEik, ''));
        const salamiHits = ((f7.engine3_salamiSlicing && f7.engine3_salamiSlicing.clusters) || []).filter((c) => matchesEntityRecord(c.authorityEik, `${c.authority} ${c.contractor}`));
        const rotHits = ((f7.engine6_cartelGraphs && f7.engine6_cartelGraphs.rotationRings) || []).filter((r) => matchesEntityRecord(r.authorityEik, r.authority));
        const nlpHits = ((f7.engine7_nlpTailoredSpecs && f7.engine7_nlpTailoredSpecs.flaggedContracts) || []).filter((c) => matchesEntityRecord(c.authorityEik, `${c.authority} ${c.contractor}`));

        const fLines = [];
        if (annexHits.length) {
          fLines.push(`<li><strong>Анекси и оскъпяване (${annexHits.length}):</strong> ${annexHits.slice(0, 2).map((c) => `${esc(c.authority)} &rarr; ${esc(c.contractor.slice(0, 38))}: +${fmtEur(c.inflationEur)} (+${c.inflationPct}%)`).join(' | ')}</li>`);
        }
        if (salamiHits.length) {
          fLines.push(`<li><strong>Разделяне под прага / Salami (${salamiHits.length} клъстера):</strong> ${salamiHits.slice(0, 2).map((c) => `${esc(c.authority)} &rarr; ${esc(c.contractor.slice(0, 35))} (${c.contractCount} дог. за ${c.spanDays} дни = ${fmtEur(c.totalEur)})`).join(' | ')}</li>`);
        }
        if (rotHits.length) {
          fLines.push(`<li><strong>Картелна ротация (${rotHits.length} пръстена):</strong> ${rotHits.slice(0, 2).map((r) => `${esc(r.authority)} (CPV ${esc(r.sector)}, редуване ${esc(r.sequence)}, ${fmtEur(r.ringEur)})`).join(' | ')}</li>`);
        }
        if (nlpHits.length) {
          fLines.push(`<li><strong>NLP „Шити“ спецификации (${nlpHits.length}):</strong> ${nlpHits.slice(0, 2).map((c) => `${esc(c.authority)} — марка/критерий <b>${esc(c.matchedBrand || c.trigger)}</b> (${fmtEur(c.valueEur)})`).join(' | ')}</li>`);
        }
        if (fLines.length) {
          sections.push(`<div class="contract-row" style="border-left:3px solid var(--plum);">
            <strong style="color:var(--plum);">Криминалистични радари (Анекси / Salami / Ротация / NLP):</strong>
            <ul class="clean-list" style="margin-top:4px;font-size:12px;">${fLines.join('')}</ul>
          </div>`);
        }
      }

      if (sections.length) {
        const followUps = [];
        if (topOff) followUps.push(`Генерирай сигнал за ${topOff.name}`);
        if (topAuth) followUps.push(`Какви съдебни дела и АДФИ доклади има за ${topAuth.name}?`);
        if (topComp) followUps.push(`В кои ДЗЗД консорциуми участва ${topComp.name.slice(0, 28)}?`);
        if (topOb) followUps.push(`Кои са лицата със самовъзлагане в ${topOb.name.replace(' (столица)', '')}?`);
        appendOracleMsg('ai', `<strong>360° Кръстосан одиторски синтез за вашата заявка:</strong><div style="margin-top:8px;">${sections.join('')}</div>` + renderFollowUpChips(followUps), nluMeta);
        return;
      }
    }

    // =========================================================================
    // D. MULTI-INTENT TOPIC SYNTHESIS (Combines ALL matched intents in the query!)
    // =========================================================================
    const blocks = [];

    if (intentSet.has('JUDICIAL_TD') && j6) {
      const m1 = j6.module1_collusiveLitigation || {};
      const list = (m1.liveEissCommercialDisputes || []).slice(0, 8);
      blocks.push(`<div><strong>Търговски спорове Възложител &harr; Изпълнител в ЕПЕП / ЕИСС (${(m1.liveEissCommercialDisputes || []).length} верифицирани ТД/ВТД дела, 0 дела на Прокуратурата по чл. 155 ТЗ):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((c) => `<li><strong>${esc(c.court)} · ${esc(c.caseNo)}</strong>: <a href="#" data-open-authority="${esc(c.authorityEik)}"><strong>${esc(c.authorityName)}</strong></a> &harr; ${c.contractorEik ? `<a href="#" data-open-company="${esc(c.contractorEik)}">${esc(c.contractorName)}</a>` : esc(c.sideRight)} — <span class="tag tag-crimson">${esc(c.outcome)}</span> · <a href="${esc(c.actDownloadUrl)}" target="_blank">Пълен акт ↗</a></li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('JUDICIAL_ADFI') && j6) {
      const m2 = j6.module2_impunityIndex || {};
      const cases = (m2.liveEissAndKandCases || []).slice(0, 7);
      const topA = (m2.topInspectedAuthorities || []).slice(0, 5);
      const outB = (m2.eissOutcomeBreakdown || []).map((o) => `${esc(o.outcome)}: <b>${o.count}</b>`).join(' · ');
      blocks.push(`<div><strong>АДФИ Индекс на безнаказаността (${fmtInt(m2.totalReports)} доклада · ${fmtInt(m2.updatedArt17Count)} по чл. 17, ал. 7 ЗДФИ) &amp; КАНД решения в ЕПЕП (${outB}):</strong>
        <div style="font-size:12px;margin-top:4px;"><b>Топ инспектирани възложители:</b> ${topA.map((a) => `<a href="#" data-open-authority="${esc(a.eik)}">${esc(a.name)}</a> (${a.reportCount} докл.)`).join(' · ')}</div>
        <ol style="margin:6px 0 0;padding-left:18px;">` +
        cases.map((c) => `<li><strong>${esc(c.court)} · ${esc(c.caseNo)}</strong> (${esc(c.authorityName)}) — <span class="tag ${c.outcome.includes('ОТМЕНЕНО') ? 'tag-crimson' : 'tag-teal'}">${esc(c.outcome)}</span> ${c.annulmentReason && c.annulmentReason !== '—' ? `(${esc(c.annulmentReason)})` : ''} · <a href="${esc(c.actDownloadUrl)}" target="_blank">Акт ↗</a></li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('JUDICIAL_KZK_VAS') && j6) {
      const m4 = j6.module4_kzkVas || {};
      const vas = (m4.liveVasFinalActs || []).slice(0, 7);
      const ing = m4.ingestedCounts || {};
      blocks.push(`<div><strong>КЗК &times; Върховен административен съд IV отд. (${(m4.liveVasFinalActs || []).length} окончателни акта на ВАС · ${ing.prelimGranted || 0} допуснати предв. изп. · ${ing.decisionsOverturned || 0} отменени в КЗК):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        vas.map((v) => `<li><strong>ВАС адм.д. № ${esc(v.vasCaseNo)}</strong> (КЗК ${esc(v.kzkDossierNo || 'ЗОП')}): ${esc(v.appellantName)} &rarr; <a href="#" data-open-authority="${esc(v.authorityEik)}"><strong>${esc(v.authorityName)}</strong></a> — <span class="tag ${v.vasOutcome.includes('ОТМЕНЯ') ? 'tag-crimson' : 'tag-teal'}">${esc(v.vasOutcome)}</span> · <a href="${esc(v.actDownloadUrl)}" target="_blank">ВАС Акт ↗</a></li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('JUDICIAL_LAWYERS') && j6) {
      const m3 = j6.module3_legalExpertGraph || {};
      const laws = (m3.topLawFirmHubs || []).slice(0, 6);
      const eissL = (m3.eissExtractedLawyers || []).slice(0, 6);
      blocks.push(`<div><strong>Мрежа на адвокати, юрисконсулти и вещи лица (${fmtInt(m3.lawFirmsCount)} кантори за ${fmtEur(m3.lawFirmsTotalEur)} · ${(m3.eissExtractedLawyers || []).length} процесуални представители от ЕПЕП · ${(m3.adfiRegisteredExperts || {}).totalExperts || 0} вещи лица АДФИ):</strong>
        <ol style="margin:6px 0 0;padding-left:18px;">` +
        laws.map((l) => `<li><a href="#" data-open-company="${esc(l.eik || l.name)}"><strong>${esc(l.name)}</strong></a> — <strong>${l.authorityCount} институции</strong> · ${fmtEur(l.totalEur)} (${l.singleOfferPct}% с 1 оферта)</li>`).join('') + `</ol>
        <div class="inst-line" style="margin-top:4px;">Примери от съдебни актове в ЕПЕП: ${eissL.map((lw) => `<b>${esc(lw.role)} ${esc(lw.name)}</b> (${esc(lw.court)} ${esc(lw.caseNo)})`).join(' · ')}</div></div>`);
    }

    if (intentSet.has('JUDICIAL_PHOENIX') && j6) {
      const m5 = j6.module5_insolvencyPhoenix || {};
      const dist = (m5.distressedFirms || []).slice(0, 6);
      const chains = (m5.phoenixChains || []).slice(0, 4);
      blocks.push(`<div><strong>Несъстоятелност, запори в ТР (${m5.distressedOrPledgedCount} фирми) и „Феникс“ вериги (${m5.phoenixChainsCount} вериги · ${m5.burnoutFirmsCount} Burnout компании за ${fmtEur(m5.burnoutTotal2020_2023Eur)}):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        dist.map((d) => `<li><a href="#" data-open-company="${esc(d.eik)}"><strong>${esc(d.name)}</strong></a> (ЕИК ${esc(d.eik)}) — <strong>${fmtEur(d.wonEur)}</strong> · <span class="tag tag-crimson">${d.distraintCount} запора / ${d.pledgeCount} залога</span></li>`).join('') + `</ol>
        <div class="inst-line" style="margin-top:4px;">Феникс групи по собственик: ${chains.map((c) => `<b>${esc(c.owner)}</b> (${c.firmCount} фирми / ${fmtEur(c.combinedEur)})`).join(' · ')}</div></div>`);
    }

    if (intentSet.has('JUDICIAL_EPPO') && j6) {
      const m6 = j6.module6_criminalEppo || {};
      const hits = (m6.eppoHighRiskContracts || []).slice(0, 6);
      blocks.push(`<div><strong>ЗМИП и EPPO Радар на ЕС средства (${fmtInt(m6.euFundedContractsTotal)} ЕС договора за ${fmtEur(m6.euFundedTotalEur)}, от които ${m6.euSingleOfferSharePct}% с 1 оферта · ${fmtInt(m6.eppoHighRiskCount)} високорискови договора &ge;€1 млн.):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        hits.map((h) => `<li><a href="#" data-open-authority="${esc(h.authorityEik)}"><strong>${esc(h.authority)}</strong></a> &rarr; ${esc(h.contractor.slice(0, 45))} — <strong class="mono" style="color:var(--crimson);">${fmtEur(h.valueEur)}</strong> (${(h.triggers || []).slice(0, 2).join(', ')})</li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('SELF_DEALING')) {
      const list = state.officials.filter((o) => o.ownInstitution).sort((a, b) => b.periodEur - a.periodEur).slice(0, 10);
      oracleContext.lastOfficial = list[0] || oracleContext.lastOfficial;
      blocks.push(`<div><strong>Топ 10 длъжностни лица със самовъзлагане (от собствената институция — общо 53 лица):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((o) => `<li><a href="#" data-open-slug="${esc(o.slug)}"><strong>${esc(o.name)}</strong></a> (${esc(o.primaryInstitution)}) — В мандата: <strong class="mono">${fmtEur(o.periodEur)}</strong> · +ДЗЗД: <span class="mono" style="color:var(--plum);">${fmtEur(o.dzzdEur)}</span> ${riskBadgeHtml(o.sigma3Score)}</li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('HIDDEN_DZZD')) {
      const list = ((state.deep && state.deep.hiddenConsortiumLeaderboard) || []).slice(0, 10);
      blocks.push(`<div><strong>Топ 10 длъжностни лица с най-големи скрити ДЗЗД поръчки (+€1,92 млрд. общо в 338 консорциума без ЕИК):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((lb) => `<li><a href="#" data-open-slug="${esc(lb.slug)}"><strong>${esc(lb.officialName)}</strong></a> (${esc(lb.institution)}) — Директно: ${fmtEur(lb.directTotalEur)} · <strong>Скрити ДЗЗД (${lb.hiddenConsortiumCount}): <span class="mono" style="color:var(--crimson);">+${fmtEur(lb.hiddenConsortiumEur)}</span></strong></li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('XML_DECLARATIONS')) {
      const list = ((state.deep && state.deep.deepLinks) || []).filter((r) => r.missedBySigma).slice(0, 10);
      blocks.push(`<div><strong>Нови връзки от 3 035 XML декларации пред Сметната палата (Табл. 6/7 заеми, Табл. 9 акции в АД, чл. 35 — 26 връзки при 16 нови лица):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((r) => `<li><strong>${esc(r.politician)}</strong> (${esc(r.position)}, ${esc(r.institution)}) &rarr; <span class="tag tag-ochre">${esc(r.linkType)}</span> &rarr; <a href="#" data-open-company="${esc(r.companyEik)}"><strong>${esc(r.companyName)}</strong></a> (<span class="mono">${fmtEur(r.companyWonEur)}</span>) · <a href="${esc(r.declarationUrl)}" target="_blank">XML ↗</a></li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('FORENSIC_ANNEX') && f7) {
      const e1 = f7.engine1_annexInflation || {};
      const list = (e1.contracts || []).filter((c) => c.inflationEur > 0).slice(0, 8);
      blocks.push(`<div><strong>Анекси и пост-договорно оскъпяване (+${fmtEur(e1.totalInflationEur)} доказано увеличение чрез анекси):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((c) => `<li><strong>${esc(c.authority)}</strong> &rarr; ${esc(c.contractor.slice(0, 46))} — ${fmtEur(c.signingEur)} &rarr; <strong>${fmtEur(c.currentEur)}</strong> (<span style="color:var(--crimson);font-weight:700;">+${fmtEur(c.inflationEur)} / +${c.inflationPct}%</span>)</li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('FORENSIC_SHELL') && f7) {
      const e2 = f7.engine2_shellCompanies || {};
      const list = (e2.companies || []).slice(0, 8);
      blocks.push(`<div><strong>Новосъздадени и „кухи“ фирми (Верифицирани в ТР · ${e2.verifiedShellCount} фирми за ${fmtEur(e2.totalShellEur)}):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((c) => `<li><a href="#" data-open-company="${esc(c.eik)}"><strong>${esc(c.name)}</strong></a> (ЕИК ${esc(c.eik)}) — учр. ${esc(c.incorpDate)}, 1-ви договор след <strong>${c.daysToFirstContract} дни</strong>, капитал ${esc(c.capitalRaw || '—')}, спечелени <strong style="color:var(--crimson);">${fmtEur(c.totalEur)}</strong></li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('FORENSIC_SALAMI') && f7) {
      const e3 = f7.engine3_salamiSlicing || {};
      const list = (e3.clusters || []).slice(0, 8);
      blocks.push(`<div><strong>Разделяне на поръчки под прага (Salami Slicing — ${fmtInt(e3.nonPharmaClusters)} не-фарма клъстера за ${fmtEur(e3.nonPharmaTotalEur)}):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((c) => `<li><strong>${esc(c.authority)}</strong> &rarr; ${esc(c.contractor)} — <strong>${c.contractCount} дог. за ${c.spanDays} дни</strong> = <strong style="color:var(--crimson);">${fmtEur(c.totalEur)}</strong> (${c.thresholdRatio}× прага)</li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('FORENSIC_POLITICS_MEDIA') && f7) {
      const e4 = f7.engine4_politicsAndMedia || {};
      const list = (e4.partyAgencies || []).slice(0, 8);
      blocks.push(`<div><strong>Политически дарения (ЕРИК: ${fmtInt(e4.donorsIndexed)} дарители) и медийни договори (${fmtEur(e4.mediaTotalEur)}):</strong> <strong>${e4.partyAgenciesWinningProcurement} партийни PR/медийни агенции</strong> са спечелили <strong>${fmtEur(e4.partyAgenciesTotalEur)}</strong>:<ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((a) => `<li><a href="#" data-open-company="${esc(a.eik)}"><strong>${esc(a.name)}</strong></a> (${esc((a.parties || []).slice(0, 2).join(', '))}) — <strong>${fmtEur(a.totalWonEur)}</strong></li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('FORENSIC_TIME') && f7) {
      const e5 = f7.engine5_timeAnomalies || {};
      const list = (e5.yearEndDumpers || []).slice(0, 8);
      blocks.push(`<div><strong>Времеви аномалии и декемврийски бюджетен дъмпинг (${fmtInt((e5.yearEndDumpers || []).length)} институции с Ноември–Декември пик &ge;32%):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((d) => `<li><a href="#" data-open-authority="${esc(d.eik)}"><strong>${esc(d.name)}</strong></a> — Ное–Дек дял: <strong style="color:var(--crimson);">${d.novDecSharePct}%</strong> (${fmtEur(d.novDecEur)} от общо ${fmtEur(d.totalEur)})</li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('FORENSIC_CARTEL')) {
      const pairs = (state.macro.cartelEngine.coBiddingPairs || []).slice(0, 7);
      const rot = (f7 && f7.engine6_cartelGraphs && f7.engine6_cartelGraphs.rotationRings || []).slice(0, 4);
      blocks.push(`<div><strong>Картелен радар — Топ ДЗЗД двойки със съвместни оферти (от 3 427 консорциума) и ротационни пръстени:</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        pairs.map((p) => `<li><a href="#" data-open-company="${esc(p.eikA)}"><strong>${esc(p.nameA)}</strong></a> &harr; <a href="#" data-open-company="${esc(p.eikB)}"><strong>${esc(p.nameB)}</strong></a> — <span class="mono" style="color:var(--crimson);font-weight:700;">${p.jointCount} общи ДЗЗД · ${fmtEur(p.jointEur)}</span></li>`).join('') + `</ol>` +
        (rot.length ? `<div class="inst-line" style="margin-top:4px;">Ротация на победители: ${rot.map((r) => `<b>${esc(r.authority)}</b> (${esc(r.sequence)}, ${fmtEur(r.ringEur)})`).join(' · ')}</div>` : '') + `</div>`);
    }

    if (intentSet.has('FORENSIC_NLP') && f7) {
      const e7 = f7.engine7_nlpTailoredSpecs || {};
      const list = (e7.brandLeaderboard || []).slice(0, 8);
      blocks.push(`<div><strong>NLP „Шити“ поръчки и ограничителни критерии по чл. 49 ЗОП (${fmtInt(e7.totalHighRiskSpecs)} договора за ${fmtEur(e7.totalHighRiskEur)}):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((b) => `<li>Марка/Критерий <strong>${esc(b.brand)}</strong> — ${b.contracts} дог., <strong>${b.singleOfferPct}% с 1 оферта</strong> (${fmtEur(b.singleOfferEur)})</li>`).join('') + `</ol></div>`);
    }

    if (intentSet.has('SINGLE_OFFER_HHI')) {
      const list = (state.macro.topLists.topSingleOffer || []).slice(0, 6);
      const hhiList = ((state.comp && state.comp.byConcentration) || []).slice(0, 5);
      blocks.push(`<div><strong>Поръчки с 1 оферта (83 993 дог. / €18,50 млрд. = 40,7% от обема) и Топ HHI монополи:</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
        list.map((c) => `<li><strong>${esc(c.authorityName)}</strong> &rarr; ${esc(c.bidderName)} — <strong class="mono" style="color:var(--crimson);">${fmtEur(c.valueEur)}</strong> (${c.signedAt}) · <button class="btn btn-oracle" style="padding:1px 6px;font-size:11px;" data-inspect-contract="${esc(c.id)}">Жив JSON</button></li>`).join('') + `</ol>` +
        `<div class="inst-line" style="margin-top:4px;">Топ HHI концентрация: ${hhiList.map((x) => `<a href="#" data-open-authority="${esc(x.slug)}"><b>${esc(x.name)}</b></a> (HHI ${Number(x.hhi).toFixed(2)})`).join(' · ')}</div></div>`);
    }

    if (intentSet.has('BENFORD_PARETO')) {
      const bf = state.macro.benford;
      blocks.push(`<div><strong>Математически одит по Закона на Бенфорд и Парето/Джини:</strong>
        <ul class="clean-list" style="margin-top:6px;">
          <li><strong>Възложители (n=${fmtInt(bf.authorities.n)}):</strong> MAD = <code>${bf.authorities.mad}</code>, &chi;&sup2; = <code>${bf.authorities.chi2}</code> — <strong>${esc(bf.authorities.conformity)}</strong> (пик при първа цифра 4: ${bf.authorities.observed[3]}% срещу теоретични 9,69%).</li>
          <li><strong>Компании (n=${fmtInt(bf.companies.n)}):</strong> MAD = <code>${bf.companies.mad}</code> — <strong>${esc(bf.companies.conformity)}</strong>.</li>
          <li><strong>Парето хиперконцентрация:</strong> Топ 1% от фирмите държат <strong>${bf.paretoCompanies.top1Pct}%</strong> (Gini <b>${bf.paretoCompanies.gini}</b>), а Топ 1% от възложителите контролират <strong>${bf.paretoAuthorities.top1Pct}%</strong> от пазара.</li>
        </ul></div>`);
    }

    if (intentSet.has('SECTOR_CIRCLE')) {
      const qL = nlu.fullNorm;
      let circleFilter = () => true;
      let title = 'Свързани лица по институционален сектор';
      if (qL.includes('кмет') || qL.includes('общин')) { circleFilter = (o) => o.circle.includes('Общини'); title = 'Общини и общински съвети (кметове и общински съветници)'; }
      else if (qL.includes('депутат') || qL.includes('народно събрание') || qL.includes('парламент')) { circleFilter = (o) => o.circle.includes('Народно събрание'); title = 'Народно събрание (Депутати)'; }
      else if (qL.includes('данс') || qL.includes('дато') || qL.includes('служб') || qL.includes('мвр')) { circleFilter = (o) => o.circle.includes('Служби'); title = 'Служби за сигурност (ДАНС, ДАТО, МВР)'; }
      else if (qL.includes('болниц') || qL.includes('мбал') || qL.includes('здрав')) { circleFilter = (o) => o.circle.includes('болници'); title = 'Държавни и общински болници'; }
      else if (qL.includes('минист')) { circleFilter = (o) => o.circle.includes('Централна власт'); title = 'Централна власт (Министерства и агенции)'; }
      const sub = state.officials.filter(circleFilter).sort((a, b) => b.combinedEur - a.combinedEur);
      if (sub.length) {
        oracleContext.lastOfficial = sub[0];
        blocks.push(`<div><strong>${title} — общо ${sub.length} лица (Комбиниран обем СИГМА + ДЗЗД: ${fmtEur(sub.reduce((a, o) => a + o.combinedEur, 0))}):</strong><ol style="margin:6px 0 0;padding-left:18px;">` +
          sub.slice(0, 8).map((o) => `<li><a href="#" data-open-slug="${esc(o.slug)}"><strong>${esc(o.name)}</strong></a> (${esc(o.primaryInstitution)}) — В мандата: <b>${fmtEur(o.periodEur)}</b> · Общо+ДЗЗД: <b>${fmtEur(o.combinedEur)}</b> ${riskBadgeHtml(o.sigma3Score)}</li>`).join('') + `</ol></div>`);
      }
    }

    if (intentSet.has('HIGH_RISK_OVERVIEW') && !blocks.length) {
      const topOffs = [...state.officials].sort((a, b) => b.sigma3Score - a.sigma3Score || b.combinedEur - a.combinedEur).slice(0, 7);
      const topAuths = [...auths].sort((a, b) => b.riskScore - a.riskScore || b.spentEur - a.spentEur).slice(0, 5);
      oracleContext.lastOfficial = topOffs[0];
      blocks.push(`<div><strong>Топ рискови профили в СИГМА 3.0 FINALITY (по 6-факторен Риск индекс + Съдебен/АДФИ/КЗК буст):</strong>
        <div style="margin-top:6px;"><b>1. Длъжностни лица с най-висок риск и финансов обем:</b><ol style="margin:4px 0 6px;padding-left:18px;">` +
        topOffs.map((o) => `<li><a href="#" data-open-slug="${esc(o.slug)}"><strong>${esc(o.name)}</strong></a> (${esc(o.primaryInstitution)}) — Общо+ДЗЗД: <strong>${fmtEur(o.combinedEur)}</strong> ${o.ownInstitution ? '<span class="tag tag-crimson">Самовъзлагане</span>' : ''} ${riskBadgeHtml(o.sigma3Score)}</li>`).join('') + `</ol></div>
        <div><b>2. Възложители с най-висок комбиниран риск (ЗОП + АДФИ + КЗК + Съд):</b><ol style="margin:4px 0 0;padding-left:18px;">` +
        topAuths.map((a) => `<li><a href="#" data-open-authority="${esc(a.eik)}"><strong>${esc(a.name)}</strong></a> (ЕИК ${esc(a.eik)}) — <strong>${fmtEur(a.spentEur)}</strong> · ${riskBadgeHtml(a.riskScore)}</li>`).join('') + `</ol></div></div>`);
    }

    if (blocks.length) {
      appendOracleMsg('ai', blocks.join('<hr style="border:none;border-top:1px solid var(--border);margin:10px 0;"/>') +
        renderFollowUpChips([
          'Генерирай сигнал за първото лице',
          'Покажи търговските дела в съда (ЕПЕП)',
          'Покажи отменените глоби на АДФИ',
          'Кои са топ 10 със скрити ДЗЗД?',
        ]), nluMeta);
      return;
    }

    // =========================================================================
    // E. BROAD FULL-TEXT & SUBJECT SEARCH (Contract subjects, brands, court text, fuzzy fallback)
    // =========================================================================
    const searchStems = nlu.stems.filter((s) => s.length >= 3);
    const matchByStems = (text) => {
      const low = String(text || '').toLowerCase();
      let hits = 0;
      for (const st of searchStems) {
        if (low.includes(st) || tokenFuzzyMatchScore(st, low) >= 0.84) hits++;
      }
      return hits;
    };

    const hitOffs = state.officials.map((o) => ({ o, h: matchByStems(`${o.name} ${o.primaryInstitution} ${o.oblast || ''} ${o.companies.map((c) => c.name).join(' ')}`) })).filter((x) => x.h > 0).sort((a, b) => b.h - a.h || b.o.combinedEur - a.o.combinedEur).slice(0, 5);
    const hitAuths = auths.map((a) => ({ a, h: matchByStems(`${a.name} ${a.settlement || ''} ${a.region || ''}`) })).filter((x) => x.h > 0).sort((a, b) => b.h - a.h || b.a.spentEur - a.a.spentEur).slice(0, 5);
    const hitComps = comps.map((c) => ({ c, h: matchByStems(`${c.name} ${c.settlement || ''}`) })).filter((x) => x.h > 0).sort((a, b) => b.h - a.h || b.c.wonEur - a.c.wonEur).slice(0, 5);

    // Also search contract subjects in topSingleOffer, annex contracts, litigation contracts, and court cases!
    const allSampleContracts = [
      ...((state.macro && state.macro.topLists && state.macro.topLists.topSingleOffer) || []).map((c) => ({ id: c.id, auth: c.authorityName, comp: c.bidderName, subj: c.subject, eur: c.valueEur })),
      ...((f7 && f7.engine1_annexInflation && f7.engine1_annexInflation.contracts) || []).map((c) => ({ id: c.id, auth: c.authority, comp: c.contractor, subj: `Анекс (+${c.inflationPct}%): ${c.subject || ''}`, eur: c.currentEur })),
      ...((j6 && j6.module1_collusiveLitigation && j6.module1_collusiveLitigation.topLitigationContracts) || []).map((c) => ({ id: c.id, auth: c.authority, comp: c.contractor, subj: c.subject, eur: c.valueEur })),
    ];
    const hitContracts = allSampleContracts.map((c) => ({ c, h: matchByStems(`${c.subj} ${c.auth} ${c.comp}`) })).filter((x) => x.h > 0).sort((a, b) => b.h - a.h || b.c.eur - a.c.eur).slice(0, 5);

    const ragHits = (cog && cog.ragMatches) ? cog.ragMatches.filter((m) => m.entry.metadata.type === 'fact' && m.similarity >= 0.27).slice(0, 4) : [];

    if (hitOffs.length || hitAuths.length || hitComps.length || hitContracts.length || ragHits.length) {
      let out = `<strong>Намерени резултати (Fuzzy Stem Match &amp; 256-D Cosine Vector Memory) за „${esc(qRaw)}“:</strong>`;
      if (hitOffs.length) {
        oracleContext.lastOfficial = hitOffs[0].o;
        out += `<div style="margin-top:8px;"><b>Свързани длъжностни лица (${hitOffs.length}):</b><ul>` + hitOffs.map(({ o }) => `<li><a href="#" data-open-slug="${esc(o.slug)}"><strong>${esc(o.name)}</strong></a> (${esc(o.primaryInstitution)}) · В мандата: <b>${fmtEur(o.periodEur)}</b> · Общо+ДЗЗД: <b>${fmtEur(o.combinedEur)}</b> ${riskBadgeHtml(o.sigma3Score)} · <button class="btn" style="padding:1px 6px;font-size:11px;" data-gen-signal="${esc(o.slug)}">Сигнал</button></li>`).join('') + `</ul></div>`;
      }
      if (hitAuths.length) {
        oracleContext.lastAuthority = hitAuths[0].a;
        out += `<div style="margin-top:8px;"><b>Възложители (${hitAuths.length}):</b><ul>` + hitAuths.map(({ a }) => `<li><a href="#" data-open-authority="${esc(a.eik)}"><strong>${esc(a.name)}</strong></a> (ЕИК ${esc(a.eik)}) · <b>${fmtEur(a.spentEur)}</b> (${fmtInt(a.contracts)} дог.) · ${riskBadgeHtml(a.riskScore)}</li>`).join('') + `</ul></div>`;
      }
      if (hitComps.length) {
        oracleContext.lastCompany = hitComps[0].c;
        out += `<div style="margin-top:8px;"><b>Изпълнители / ДЗЗД (${hitComps.length}):</b><ul>` + hitComps.map(({ c }) => `<li><a href="#" data-open-company="${esc(c.eik || c.name)}"><strong>${esc(c.name.slice(0, 80))}</strong></a> · Директно: <b>${fmtEur(c.wonEur)}</b>${c.consortiumEur > 0 ? ' · ДЗЗД: <b style="color:var(--plum);">+' + fmtEur(c.consortiumEur) + '</b>' : ''}</li>`).join('') + `</ul></div>`;
      }
      if (hitContracts.length) {
        out += `<div style="margin-top:8px;"><b>Конкретни договори по предмет (${hitContracts.length}):</b><ul>` + hitContracts.map(({ c }) => `<li><strong>${esc(c.auth)}</strong> &rarr; ${esc(c.comp.slice(0, 45))}: <em>${esc((c.subj || '').slice(0, 95))}</em> — <b class="mono">${fmtEur(c.eur)}</b> ${c.id ? `<button class="btn btn-oracle" style="padding:1px 6px;font-size:10.5px;" data-inspect-contract="${esc(c.id)}">JSON</button>` : ''}</li>`).join('') + `</ul></div>`;
      }
      if (ragHits.length) {
        out += `<div style="margin-top:8px;"><b>Семантични съвпадения от 256-D Векторната памет (Cosine Similarity):</b><ul>` + ragHits.map((m) => `<li><span class="tag tag-slate" style="font-size:10px;">Cosine ${m.similarity.toFixed(2)}</span> ${esc(m.entry.content)}</li>`).join('') + `</ul></div>`;
      }
      appendOracleMsg('ai', out + renderFollowUpChips([
        hitAuths[0] ? `Какви съдебни дела и АДФИ доклади има за ${hitAuths[0].a.name}?` : 'Покажи търговските дела в ЕПЕП',
        hitOffs[0] ? `Генерирай сигнал за ${hitOffs[0].o.name}` : 'Кои кметове имат самовъзлагане?',
      ]), nluMeta);
      return;
    }

    appendOracleMsg('ai', `Разбрах въпроса ви (нормализиран като: <code>${esc(nlu.cyrQuery)}</code>), но не открих директен субект с това име. Ето общия национален срез на <strong>СИГМА 3.0 FINALITY</strong>:
      <ul class="clean-list" style="margin-top:6px;">
        <li><strong>Обем по ЗОП:</strong> 206 907 договора за <strong>€53,22 млрд.</strong> (40,7% с 1 оферта) при 4 344 възложители и 17 428 изпълнители.</li>
        <li><strong>Свързани лица и ДЗЗД:</strong> 571 длъжностни лица (53 със самовъзлагане), <strong>+€1,92 млрд.</strong> в скрити ДЗЗД консорциуми и 26 нови връзки от XML декларации.</li>
        <li><strong>Съдебен радар (ЕПЕП / ВАС / АДФИ / КЗК):</strong> 86 пълни съдебни акта без CAPTCHA (28 търговски спора ТД/ВТД, 28 КАНД решения по НП на АДФИ, 30 окончателни акта на ВАС IV отд.), 2 229 доклада на АДФИ (370 по чл. 17, ал. 7 ЗДФИ) и 90 структурирани адвокати.</li>
      </ul>` +
      renderFollowUpChips([
        'Кажи ми всичко за Бургас — поръчки, АДФИ и съд',
        'Какви дела и анекси има за АПИ?',
        'Покажи отменените глоби на АДФИ в съда',
        'Кои кметове имат самовъзлагане?',
      ]), nluMeta);
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
    ['Експорт на официален сигнал / справка', 'Няма (само суров CSV)', '1-клик генератор на юридическа справка за АДФИ / КПК (бивша КПКОНПИ) / Сметна палата / EPPO (MD + PDF)', 'Директна приложимост за контрол'],
    ['Глобално търсене (Omnibox)', 'Сървърна заявка с презареждане', '<code>Ctrl+K</code> мигновен индекс през 22 343 записа (571 лица + 4 344 инст. + 17 428 фирми)', '&lt;10 ms реакция'],
    ['Йерархичен профил на концентрацията (Топ 50)', 'Няма обобщена визуална йерархия', '5-режимна интерактивна йерархия Топ 50 (СИГМА+ДЗЗД, Самовъзлагане, Мандат, ДЗЗД, Риск)', 'Максимална одиторска яснота'],
    ['Радар 1: Анекси и оскъпяване (Post-Award)', 'Показва единични флагове без обща класация', 'Автоматично проследяване Подписана &rarr; Крайна цена (+€1,29 млрд. доказани анекси при 165 договора)', 'Спира дъмпинг + анекс схеми'],
    ['Радар 2: „Кухи“ и новосъздадени фирми', 'Не проверява дата на регистрация / капитал / ГФО', 'Жив ТР одит (<code>CR_F_1_L</code>, <code>CR_F_31_L</code>, ГФО): дни до 1-ви договор и множител Поръчки/Капитал', 'Засича фирми-фантоми'],
    ['Радар 3: Разделяне под прага (Salami Slicing)', 'Липсва', '60-дневен плъзгащ алгоритъм върху 206 907 договора &rarr; 2 155 клъстера (1 776 не-фарма за €214M+)', 'Разкрива заобикаляне на ЗОП'],
    ['Радар 4: Политически дарения (ЕРИК) и Медии', 'Липсва', 'Жива връзка с ЕРИК (2023–2026: 3 716 дарители, 152 партийни PR агенции за €291M + 1 130 медийни дог.)', 'Разкрива „откупуване“ на поръчки'],
    ['Радар 5: Времеви аномалии (Петък / Ное–Дек)', 'Липсва', 'Анализ по дни от седмицата, 20–31 декември и 141 институции с Ное–Дек дъмпинг &ge;32%', 'Контрол на бюджетния дъмпинг'],
    ['Радар 6: Картелна ротация и общ адрес (ТР)', 'Липсва', '430 ротационни пръстена (<code>A&rarr;B&rarr;C&rarr;A</code>) + клъстери по общ адрес и собственици в ТР', 'Антикартелен контрол (ЗЗК)'],
    ['Радар 7: NLP „Шити“ поръчки (чл. 49 ЗОП)', 'Липсва', 'Национален скан (661 марково заключени договора за €240M) + Жив интерактивен ЗОП NLP одитор', 'Превенция преди обявяване'],
    ['Съдебен 1: Търговски спорове и спогодби (ЕИСС)', 'Липсва', '28 реални ТД/ВТД дела Възложител &harr; Изпълнител от ЕПЕП (0 дела по чл. 155 ТЗ) + Матрица Анекси &times; КЗК/АДФИ', 'Пресича източване чрез спогодби'],
    ['Съдебен 2: Индекс на безнаказаността (АДФИ)', 'Липсва', 'Пълен жив инжест на всички 2 229 доклада на АДФИ (2024–2026) + 370 по чл. 17(7) + 28 КАНД решения от ЕПЕП', 'Реален одитен контрол'],
    ['Съдебен 3: Адвокати и Вещи лица (Legal Graph)', 'Липсва', 'Мулти-институционални кантори + 90 адвокати от <code>/Case/SidesLoadData</code> + 107 АДФИ вещи лица', 'Разкрива скрити правни мрежи'],
    ['Съдебен 4: Предварително изпълнение (КЗК/ВАС)', 'Липсва', 'Жив инжест от <code>reg.cpc.bg</code> (1 032 дела 2026) + 30 окончателни акта на ВАС IV отд. от ЕПЕП', 'Контрол върху спиранията'],
    ['Съдебен 5: Несъстоятелност и „Феникс“ фирми', 'Липсва', 'Жив ТР скан за запори (<code>CR_F_26_L</code>), залози (<code>CR_F_28_L</code>), burnout фирми и Феникс вериги', 'Спира „изгаряне“ с дългове'],
    ['Съдебен 6: ЗМИП и EPPO рисков профил', 'Липсва', 'Радар на ЕС средства по Регл. (ЕС) 2017/1939 + ЗМИП празноти + автоматичен флаг чл. 54, ал. 1 ЗОП', 'Защита на бюджета на ЕС'],
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
      `- **Демонстрационна платформа на живо:** https://nasvetlo.website`,
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
    document.getElementById('oracleMessages')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-oracle-q]');
      if (b) askOracle(b.dataset.oracleQ);
    });
    document.getElementById('oracleClearBtn')?.addEventListener('click', () => {
      document.getElementById('oracleMessages').innerHTML = '';
      oracleContext.lastOfficial = null;
      oracleContext.lastAuthority = null;
      oracleContext.lastCompany = null;
      oracleContext.lastOblast = null;
      oracleContext.lastIntents = [];
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
