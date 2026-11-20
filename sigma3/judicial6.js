(() => {
  'use strict';

  const api = () => window.SIGMA3;
  let j6Data = null;
  let j6Loading = null;
  let activeSub = 'collusive';
  let kzkView = 'vas';
  let art17View = 'all';
  let j6Wired = false;

  async function ensureJudicial6Loaded() {
    if (j6Data) return j6Data;
    if (!j6Loading) {
      j6Loading = fetch('data/sigma3_judicial_6.json')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          j6Data = d;
          if (api() && api().state) {
            api().state.judicial6 = d;
            applyJudicialRiskWeightsToState();
          }
          return d;
        })
        .catch(() => null);
    }
    return j6Loading;
  }

  function applyJudicialRiskWeightsToState() {
    if (!j6Data || !api() || !api().state) return;
    const { state } = api();
    const adj = j6Data.riskAdjustments || {};
    const authAdj = adj.authorities || {};
    const compAdj = adj.companies || {};
    if (state.authorities) {
      state.authorities.forEach((a) => {
        const b = authAdj[a.eik];
        if (b && !a._judicialApplied) {
          a._judicialApplied = true;
          a.baseRiskScore = a.riskScore;
          a.judicialBoost = b.judicialBoost;
          a.judicialReasons = b.reasons || [];
          a.adfiCount = b.adfiCount || 0;
          a.kzkCount = b.kzkCount || 0;
          a.riskScore = b.finalScore;
        }
      });
    }
    if (state.companies) {
      state.companies.forEach((c) => {
        const cr = compAdj[c.eik];
        if (cr) {
          c.judicialRiskScore = cr.score;
          c.judicialReasons = cr.reasons || [];
        }
      });
    }
  }

  function wireSubTabs() {
    if (j6Wired) return;
    j6Wired = true;
    const nav = document.getElementById('j6SubTabs');
    if (nav) {
      nav.addEventListener('click', (e) => {
        const b = e.target.closest('[data-j6-sub]');
        if (!b) return;
        activeSub = b.dataset.j6Sub;
        nav.querySelectorAll('.pill').forEach((p) => p.classList.toggle('active', p === b));
        renderActiveSubPanel();
      });
    }
    document.getElementById('j6SearchInput')?.addEventListener('input', () => renderActiveSubPanel());
  }

  async function loadAndRenderJudicial6() {
    wireSubTabs();
    const host = document.getElementById('j6BodyHost');
    if (!host) return;
    if (!j6Data) {
      host.innerHTML = `<div class="loading">Зареждане на съдебния и контролен радар (АДФИ, КЗК/ВАС, ТР несъстоятелност, адвокати, вещи лица и EPPO)…</div>`;
      await ensureJudicial6Loaded();
    }
    if (!j6Data) {
      host.innerHTML = `<div class="loading" style="color:var(--crimson);">Грешка при зареждане на data/sigma3_judicial_6.json.</div>`;
      return;
    }
    renderEntityMatchingBanner();
    renderTopKpis();
    renderActiveSubPanel();
  }

  function renderEntityMatchingBanner() {
    const { fmtInt, esc } = api();
    const box = document.getElementById('j6EntityMatchingBox');
    if (!box || !j6Data) return;
    const em = j6Data.entityMatching || {};
    const ms = em.matchStats || {};
    const totalMatches = Object.values(ms).reduce((a, v) => a + Number(v || 0), 0);
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:10px;">
        <div>
          <strong>Слой за автоматични съвпадения (Entity Matching Layer &amp; Zero-False-Positive Lock):</strong>
          Входящият поток от <strong>${fmtInt(em.incomingRecordsScanned)} живи контролни/съдебни акта</strong> + <strong>206 907 договора</strong> се филтрира автоматично по <strong>${fmtInt(em.authoritiesUniverse)} възложители</strong>, <strong>${fmtInt(em.companiesUniverse)} фирми/ДЗЗД</strong> и <strong>${fmtInt(em.contractsUnpUniverse)} УНП</strong>
          &rarr; <strong>${fmtInt(totalMatches)} точни съвпадения</strong> · <strong>${fmtInt(em.authoritiesWithJudicialBoost)} институции</strong> и <strong>${fmtInt(em.companiesWithJudicialScore)} фирми</strong> с изчислен Съдебен риск компонент (0–100).
          <div style="font-size:11.5px;margin-top:4px;color:var(--ink-secondary);">
            <strong>Активни Zero-False-Positive филтри:</strong> (1) 0 дела на Прокуратурата по чл. 155 ТЗ (<code>121817309*</code>); (2) Географско заключване по дирекции <code>ДИД1-СФ</code>..<code>ДИД7-РС</code> и съдебен район за едноименни училища, ДГ, читалища, МБАЛ и ВиК; (3) Строго разделяне на <code>EXACT_EIK</code> от регионални актуализации по чл. 17, ал. 7 ЗДФИ; (4) Структурирани адвокати от <code>/Case/SidesLoadData</code> и 0 ЕГН по ЗЗЛД.
          </div>
        </div>
        <button type="button" class="btn btn-dark" id="btnJumpJudicialGraph">Отвори 9-възловия граф (Дела + Адвокати + Вещи лица) &rarr;</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${(em.connectorStatus || []).map((c) => `<span class="tag ${c.captcha ? 'tag-ochre' : c.mode === 'LIVE OPEN' ? 'tag-teal' : 'tag-navy'}">${esc(c.source)}: <strong>${esc(c.mode)}</strong>${c.records > 0 ? ' (' + fmtInt(c.records) + ')' : ''}</span>`).join('')}
      </div>`;
    document.getElementById('btnJumpJudicialGraph')?.addEventListener('click', () => {
      api().switchTab('graph');
      const sel = document.getElementById('graphPresetSelect');
      if (sel) {
        sel.value = 'judicial_full';
        if (window.SIGMA3_MOD) window.SIGMA3_MOD.buildGraphData('judicial_full', '');
      }
      document.getElementById('mainTabs')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function renderTopKpis() {
    const { fmtEur, fmtInt } = api();
    const el = document.getElementById('j6TopKpiGrid');
    if (!el || !j6Data) return;
    const m1 = j6Data.module1_collusiveLitigation || {};
    const m2 = j6Data.module2_impunityIndex || {};
    const m3 = j6Data.module3_legalExpertGraph || {};
    const m4 = j6Data.module4_kzkVas || {};
    const m5 = j6Data.module5_insolvencyPhoenix || {};
    const m6 = j6Data.module6_criminalEppo || {};
    const kzkTot = m4.year2026Totals || {};
    const kzkIng = m4.ingestedCounts || {};
    const eissAdfiCnt = (m2.liveEissAndKandCases || []).length;
    const eissVasCnt = (m4.liveVasFinalActs || []).length;
    const eissTdCnt = (m1.liveEissCommercialDisputes || []).length;
    const eissLawCnt = (m3.eissExtractedLawyers || []).length;
    el.innerHTML = `
      <div class="kpi-card"><div class="kpi-label">1. Търговски дела (ЕИСС) &amp; ЗОП</div><div class="kpi-val">${fmtInt(eissTdCnt)} ТД / ${fmtInt(m1.litigationLinkedContractsCount)} дог.</div><div class="kpi-sub">Живи ТД/ВТД дела с диспозитив · ${fmtEur(m1.litigationLinkedEur)}</div></div>
      <div class="kpi-card emphasis"><div class="kpi-label">2. АДФИ + КАНД/АНД (ЕИСС)</div><div class="kpi-val" style="color:var(--crimson);">${fmtInt(m2.updatedArt17Count)} чл.17(7) · ${eissAdfiCnt} дела</div><div class="kpi-sub">${fmtInt(m2.totalReports)} докл. АДФИ · Потвърдени vs Отменени НП</div></div>
      <div class="kpi-card"><div class="kpi-label">3. Адвокати и Вещи лица</div><div class="kpi-val">${fmtInt(m3.lawFirmsCount)} кант. / ${eissLawCnt} юристи</div><div class="kpi-sub">${fmtEur(m3.lawFirmsTotalEur)} · ${fmtInt((m3.adfiRegisteredExperts || {}).totalExperts)} АДФИ експерти</div></div>
      <div class="kpi-card emphasis"><div class="kpi-label">4. КЗК &amp; ВАС IV отд. (ЕИСС)</div><div class="kpi-val">${eissVasCnt} акта ВАС</div><div class="kpi-sub">${kzkIng.prelimGranted || 0} допуснати предв. изп. · ${kzkIng.decisionsOverturned || 0} отм. в КЗК</div></div>
      <div class="kpi-card"><div class="kpi-label">5. Несъстоятелност / Феникс</div><div class="kpi-val">${fmtInt(m5.burnoutFirmsCount)} в срив</div><div class="kpi-sub">${m5.distressedOrPledgedCount} със запори/залози ТР · ${m5.phoenixChainsCount} вериги</div></div>
      <div class="kpi-card"><div class="kpi-label">6. ЕС Средства / EPPO Радар</div><div class="kpi-val">${fmtEur(m6.euFundedTotalEur)}</div><div class="kpi-sub">${m6.euSingleOfferSharePct}% с 1 оф. · ${fmtInt(m6.eppoHighRiskCount)} EPPO тригера</div></div>`;
  }

  function renderActiveSubPanel() {
    const host = document.getElementById('j6BodyHost');
    if (!host || !j6Data) return;
    const q = (document.getElementById('j6SearchInput')?.value || '').trim().toLowerCase();
    if (activeSub === 'collusive') renderMod1Collusive(host, q);
    else if (activeSub === 'impunity') renderMod2Impunity(host, q);
    else if (activeSub === 'legal') renderMod3LegalExpert(host, q);
    else if (activeSub === 'kzk') renderMod4KzkVas(host, q);
    else if (activeSub === 'phoenix') renderMod5Phoenix(host, q);
    else if (activeSub === 'eppo') renderMod6Eppo(host, q);
  }

  // ---- MODULE J1: COLLUSIVE LITIGATION (LIVE EISS COMMERCIAL DISPUTES + ANNEX MATRIX) ----
  function renderMod1Collusive(host, q) {
    const { fmtEur, esc } = api();
    const m1 = j6Data.module1_collusiveLitigation || {};
    let eissTd = m1.liveEissCommercialDisputes || [];
    let watch = m1.highRiskAnnexDisputeMatrix || [];
    let lits = m1.topLitigationContracts || [];
    if (q) {
      eissTd = eissTd.filter((c) => `${c.court} ${c.caseNo} ${c.sideLeft} ${c.sideRight} ${c.authorityName} ${c.contractorName} ${c.disposition} ${c.outcome}`.toLowerCase().includes(q));
      watch = watch.filter((w) => `${w.authority} ${w.contractor} ${w.unp}`.toLowerCase().includes(q));
      lits = lits.filter((l) => `${l.authority} ${l.contractor} ${l.subject}`.toLowerCase().includes(q));
    }
    const sc = m1.eissConnectorSchema || {};
    const outBreak = m1.commercialOutcomeBreakdown || [];
    host.innerHTML = `
      <div class="editorial-note note-crimson">
        <div>
          <strong>1. Съдебни спорове Изпълнител &harr; Възложител (Директен ЕПЕП / ЕИСС API достъп без CAPTCHA + Анекс радар):</strong>
          Автоматично извличане на пълните диспозитиви, мотиви, страни и адвокати по <strong>реални търговски и въззивни търговски дела (ТД / ВТД)</strong> между фирми-изпълнители и публични възложители директно от <code>ecase.justice.bg</code> (<code>/Case/LoadData &rarr; /Case/ActsLoadData &rarr; /api/file/download/{gid}</code>), съчетано с матрицата на анексираните договори (&ge;20–50% оскъпяване).
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
            ${outBreak.map((o) => `<span class="tag ${o.outcome.includes('ОСЪДЕН') || o.outcome.includes('СПОГОДБА') ? 'tag-crimson' : o.outcome.includes('ОТХВЪРЛЕН') ? 'tag-teal' : 'tag-navy'}">${esc(o.outcome)}: <strong>${o.count}</strong></span>`).join('')}
          </div>
        </div>
      </div>

      <div class="panel-box" style="margin-bottom:16px;">
        <h3>Живи Търговски и Въззивни дела (ТД / ВТД) между Изпълнители и Възложители в ЕПЕП / ЕИСС (${eissTd.length} дела с извлечен диспозитив)</h3>
        <div class="table-wrap" style="border:none;max-height:500px;overflow-y:auto;"><table>
          <thead><tr><th>Съд / Дело / Акт</th><th>Страни (Ищец &harr; Ответник)</th><th>Възложител (4 344) &amp; Роля</th><th>Извлечен диспозитив от ЕИСС и Съдебен състав</th><th>Пълен акт</th></tr></thead>
          <tbody>${eissTd.map((c) => `<tr>
            <td style="white-space:nowrap;">
              <strong>${esc(c.court)}</strong>
              <div class="inst-line mono">${esc(c.caseNo)} · ${esc(c.actNo)}</div>
              <div class="inst-line mono muted">${esc(c.actDate)}</div>
            </td>
            <td>
              <div style="font-size:12px;"><strong>Ищец:</strong> ${esc(c.sideLeft)}</div>
              <div style="font-size:12px;"><strong>Ответник:</strong> ${esc(c.sideRight)}</div>
              ${c.contractorEik ? `<div class="inst-line"><a href="#" data-open-company="${esc(c.contractorEik)}">Фирма в ЗОП: ${esc(c.contractorName)} (${fmtEur(c.contractorWonEur)})</a></div>` : ''}
            </td>
            <td>
              <a href="#" data-open-authority="${esc(c.authorityEik)}"><strong>${esc(c.authorityName)}</strong></a>
              <div class="inst-line mono">ЕИК ${esc(c.authorityEik)} · ${esc(c.authorityRole)}</div>
              <div style="margin-top:4px;"><span class="tag ${c.severity === 'critical' ? 'tag-crimson' : c.severity === 'warn' ? 'tag-ochre' : 'tag-teal'}">${esc(c.outcome)}</span></div>
              ${c.claimedAmount ? `<div class="inst-line mono" style="color:var(--crimson);font-weight:700;">Претенция/Присъдено: ${esc(c.claimedAmount)}</div>` : ''}
            </td>
            <td style="font-size:11.8px;max-width:440px;">
              <div>${esc((c.disposition || '').slice(0, 260))}${(c.disposition || '').length > 260 ? '…' : ''}</div>
              ${(c.judges && c.judges.length) ? `<div class="inst-line muted">Съдии: ${esc(c.judges.join(', '))}</div>` : ''}
              ${(c.lawyers && c.lawyers.length) ? `<div class="inst-line" style="color:#0284c7;">Юристи: ${esc(c.lawyers.join(' · '))}</div>` : ''}
              ${(c.experts && c.experts.length) ? `<div class="inst-line" style="color:#059669;">Вещи лица: ${esc(c.experts.join(', '))}</div>` : ''}
            </td>
            <td style="white-space:nowrap;">
              <a class="btn" style="padding:3px 8px;font-size:11px;margin-bottom:4px;display:inline-block;" href="${esc(c.actDownloadUrl)}" target="_blank" rel="noopener">Акт HTML ↗</a><br/>
              <a class="btn" style="padding:2px 7px;font-size:10.5px;" href="${esc(c.caseUrl)}" target="_blank" rel="noopener">ЕПЕП Карта ↗</a>
            </td>
          </tr>`).join('') || `<tr><td colspan="5" class="loading">Няма намерени търговски дела за филтъра.</td></tr>`}</tbody>
        </table></div>
      </div>

      <div class="panel-box" style="margin-bottom:16px;">
        <h3>Матрица на висок риск за спорове и оскъпяване (Анекси &times; АДФИ &times; КЗК)</h3>
        <div class="table-wrap" style="border:none;max-height:420px;overflow-y:auto;"><table>
          <thead><tr><th>Възложител &rarr; Изпълнител</th><th class="num">Подписана (€)</th><th class="num">Оскъпяване</th><th class="num">АДФИ / КЗК</th><th>Рисков профил</th><th>JSON</th></tr></thead>
          <tbody>${watch.map((w) => `<tr>
            <td><a href="#" data-open-authority="${esc(w.authorityEik)}"><strong>${esc(w.authority)}</strong></a><div class="inst-line">&rarr; <a href="#" data-open-company="${esc(w.contractorEik || w.contractor)}">${esc(w.contractor.slice(0, 62))}</a> · УНП <span class="mono">${esc(w.unp)}</span></div></td>
            <td class="num">${fmtEur(w.signingEur)}</td>
            <td class="num" style="color:var(--crimson);font-weight:700;">${w.inflationEur > 0 ? '+' + fmtEur(w.inflationEur) + ' (+' + w.inflationPct + '%)' : 'SUSPECT'}</td>
            <td class="num mono">${w.authorityAdfiReports} АДФИ · ${w.authorityKzkCases} КЗК</td>
            <td><span class="tag ${w.inflationPct >= 25 ? 'tag-crimson' : 'tag-ochre'}">${esc(w.riskReason)}</span></td>
            <td><button class="btn" style="padding:2px 6px;font-size:10px;" data-inspect-contract="${esc(w.id)}">JSON</button></td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>

      <div class="panel-box">
        <h3>Договори в ЦАИС ЕОП, касаещи съдебни спорове, арбитраж, спогодби и принудително изпълнение (Топ ${lits.length})</h3>
        <div class="table-wrap" style="border:none;max-height:400px;overflow-y:auto;"><table>
          <thead><tr><th>Дата</th><th>Възложител &rarr; Изпълнител</th><th>Предмет</th><th class="num">Стойност (€)</th><th>JSON</th></tr></thead>
          <tbody>${lits.map((l) => `<tr>
            <td class="mono" style="white-space:nowrap;">${esc(l.signedAt)}</td>
            <td><a href="#" data-open-authority="${esc(l.authorityEik)}"><strong>${esc(l.authority)}</strong></a><div class="inst-line">&rarr; <a href="#" data-open-company="${esc(l.contractorEik || l.contractor)}">${esc(l.contractor)}</a></div></td>
            <td style="font-size:12px;">${esc(l.subject)}</td>
            <td class="num" style="font-weight:700;">${fmtEur(l.valueEur)}<div class="inst-line">${l.bids === 1 ? '<span class="tag tag-crimson">1 оферта</span>' : l.bids + ' оф.'}</div></td>
            <td><button class="btn" style="padding:2px 6px;font-size:10px;" data-inspect-contract="${esc(l.id)}">JSON</button></td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`;
  }

  // ---- MODULE J2: ADFI IMPUNITY INDEX (ALL 2,229 REPORTS + 370 ART.17(7) FATE + LIVE EISS KAND/AND!) ----
  function renderMod2Impunity(host, q) {
    const { fmtEur, fmtInt, esc, riskBadgeHtml } = api();
    const m2 = j6Data.module2_impunityIndex || {};
    let eissCases = m2.liveEissAndKandCases || [];
    let art17Reps = m2.updatedArt17Reports || [];
    let insts = m2.topInspectedAuthorities || [];
    let uninsp = m2.uninspectedMegaSpenders || [];
    if (q) {
      eissCases = eissCases.filter((c) => `${c.court} ${c.caseNo} ${c.andCaseNo} ${c.npNo} ${c.adfiOrder} ${c.authorityName} ${c.outcome} ${c.annulmentReason} ${c.disposition}`.toLowerCase().includes(q));
      art17Reps = art17Reps.filter((r) => `${r.code} ${r.object} ${r.authorityName} ${r.authorityEik} ${r.directorate} ${r.linkedCourtCase} ${r.courtFate}`.toLowerCase().includes(q));
      insts = insts.filter((a) => `${a.name} ${a.eik} ${a.region}`.toLowerCase().includes(q));
      uninsp = uninsp.filter((a) => `${a.name} ${a.eik} ${a.region}`.toLowerCase().includes(q));
    }
    const byYr = m2.byYear || {};
    const basisRows = m2.byBasis || [];
    const maxB = Math.max(...basisRows.map((b) => b.count), 1);
    const outBreak = m2.eissOutcomeBreakdown || [];
    const annulBreak = m2.eissAnnulmentReasons || [];
    const dirBreak = m2.updatedByDirectorate || [];

    host.innerHTML = `
      <div class="editorial-note note-crimson">
        <div>
          <strong>2. Индекс на безнаказаността: Проследяване на 370-те актуализирани доклада на АДФИ (чл. 17, ал. 7 ЗДФИ) и съдебната съдба на НП по АНД / КАНД в ЕИСС:</strong>
          Автоматично свързване на докладите от <code>adfi.minfin.bg/bg/34</code> (<strong>${fmtInt(m2.totalReports)} доклада</strong>, от които <strong>${fmtInt(m2.updatedArt17Count)} актуализирани по чл. 17, ал. 7 ЗДФИ</strong>) с конкретните <strong>административнонаказателни дела (АНД / КАНД)</strong> в районните и административните съдилища чрез директния ЕПЕП / ЕИСС API поток (<code>ecase.justice.bg</code> без CAPTCHA).
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
            ${outBreak.map((o) => `<span class="tag ${o.outcome.includes('ОТМЕНЕНО') ? 'tag-crimson' : o.outcome.includes('ИЗМЕНЕНО') ? 'tag-ochre' : 'tag-teal'}">${esc(o.outcome)}: <strong>${o.count}</strong></span>`).join('')}
            ${annulBreak.map((a) => `<span class="tag tag-plum">Причина за отмяна — ${esc(a.reason)}: <strong>${a.count}</strong></span>`).join('')}
          </div>
        </div>
      </div>

      <div class="panel-box" style="margin-bottom:16px;">
        <h3>Съдебна съдба на наказателните постановления (НП) на АДФИ и Сметната палата — Живи КАНД / АНД решения от ЕИСС (${eissCases.length} дела с пълни мотиви)</h3>
        <div class="table-wrap" style="border:none;max-height:520px;overflow-y:auto;"><table>
          <thead><tr><th>Съд / КАНД &amp; АНД №</th><th>НП / АУАН / Заповед АДФИ</th><th>Инспектиран възложител &amp; УНП</th><th>Нарушение и Глоба</th><th>Съдебен резултат (Потвърдено / Намалено / Отменено)</th><th>Пълен акт</th></tr></thead>
          <tbody>${eissCases.map((c) => `<tr>
            <td style="white-space:nowrap;">
              <strong>${esc(c.court)}</strong>
              <div class="inst-line mono">${esc(c.caseNo)} · ${esc(c.actNo)}</div>
              ${c.andCaseNo ? `<div class="inst-line mono" style="color:var(--plum);">Първа инст.: ${esc(c.andCourt ? c.andCourt + ' ' : '')}${esc(c.andCaseNo)}</div>` : ''}
              <div class="inst-line mono muted">${esc(c.actDate)}</div>
            </td>
            <td style="font-size:12px;">
              <div><strong>${esc(c.agency)}:</strong> ${esc(c.agencyRole)}</div>
              ${c.npNo ? `<div class="inst-line mono"><strong>НП №</strong> ${esc(c.npNo)}</div>` : ''}
              ${c.auanNo ? `<div class="inst-line mono">АУАН № ${esc(c.auanNo)}</div>` : ''}
              ${c.adfiOrder ? `<div class="inst-line mono" style="color:var(--crimson);">${esc(c.adfiOrder)}</div>` : ''}
            </td>
            <td>
              ${c.authorityEik
                ? `<a href="#" data-open-authority="${esc(c.authorityEik)}"><strong>${esc(c.authorityName)}</strong></a><div class="inst-line mono">ЕИК ${esc(c.authorityEik)} (${esc(c.matchMethod)})</div>`
                : `<strong>${esc(c.authorityName)}</strong>`}
              ${c.unp ? `<div class="inst-line mono">УНП: <strong>${esc(c.unp)}</strong></div>` : ''}
            </td>
            <td style="font-size:12px;">
              <div><span class="tag tag-navy">${esc(c.violatedArticle)}</span></div>
              ${c.fineAmount ? `<div class="inst-line mono" style="color:var(--crimson);font-weight:700;margin-top:4px;">Санкция: ${esc(c.fineAmount)}</div>` : '<div class="inst-line muted">По ЗОП / ЗДФИ</div>'}
            </td>
            <td style="max-width:410px;font-size:11.8px;">
              <div>
                <span class="tag ${c.severity === 'critical' ? 'tag-crimson' : c.severity === 'warn' ? 'tag-ochre' : 'tag-teal'}">${esc(c.outcome)}</span>
                ${c.annulmentReason && c.annulmentReason !== '—' ? `<span class="tag tag-plum">${esc(c.annulmentReason)}</span>` : ''}
              </div>
              <div style="margin-top:4px;">${esc((c.disposition || '').slice(0, 230))}${(c.disposition || '').length > 230 ? '…' : ''}</div>
              ${(c.judges && c.judges.length) ? `<div class="inst-line muted">Съдии: ${esc(c.judges.join(', '))}</div>` : ''}
              ${(c.lawyers && c.lawyers.length) ? `<div class="inst-line" style="color:#0284c7;">${esc(c.lawyers.join(' · '))}</div>` : ''}
            </td>
            <td style="white-space:nowrap;">
              <a class="btn" style="padding:3px 8px;font-size:11px;margin-bottom:4px;display:inline-block;" href="${esc(c.actDownloadUrl)}" target="_blank" rel="noopener">Акт HTML ↗</a><br/>
              <a class="btn" style="padding:2px 7px;font-size:10.5px;" href="${esc(c.caseUrl)}" target="_blank" rel="noopener">ЕПЕП ↗</a>
            </td>
          </tr>`).join('') || `<tr><td colspan="6" class="loading">Няма намерени КАНД/АНД дела за филтъра.</td></tr>`}</tbody>
        </table></div>
      </div>

      <div class="panel-box" style="margin-bottom:16px;">
        <div class="chart-head">
          <div>
            <h3 style="margin:0;border:none;padding:0;">Пълен регистър на 370-те актуализирани доклада на АДФИ по чл. 17, ал. 7 от ЗДФИ (${art17Reps.length} общо)</h3>
            <p class="chart-caption" style="margin-bottom:0;">
              Директните съвпадения по ЕИК/УНП със съдебни решения по КАНД/АНД са разграничени от останалите актуализирани доклади след проверка на Прокуратурата (чл. 19 ЗДФИ).
            </p>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            <div class="pill-row" id="art17ViewPills" style="margin:0;">
              <button class="pill ${art17View === 'all' ? 'active' : ''}" data-a17-v="all">Всички 370 по чл. 17(7) (${art17Reps.length})</button>
              <button class="pill ${art17View === 'direct' ? 'active' : ''}" data-a17-v="direct">Директно свързани с КАНД по ЕИК (${art17Reps.filter((x) => x.linkType === 'EXACT_EIK').length})</button>
            </div>
            ${dirBreak.slice(0, 6).map((d) => `<span class="tag tag-navy">${esc(d.directorate)}: <strong>${d.count}</strong></span>`).join('')}
          </div>
        </div>
        <div class="table-wrap" style="border:none;max-height:460px;overflow-y:auto;margin-top:10px;"><table>
          <thead><tr><th>№</th><th>Код на доклад (ДИД)</th><th>Дата / Основание</th><th>Инспектиран обект (Географски потвърден ЕИК)</th><th>Тип връзка и Съдебна / Прокурорска съдба</th><th>PDF / Акт</th></tr></thead>
          <tbody>${(art17View === 'direct' ? art17Reps.filter((x) => x.linkType === 'EXACT_EIK') : art17Reps).slice(0, 150).map((r, i) => `<tr>
            <td class="mono muted">${i + 1}</td>
            <td style="white-space:nowrap;">
              <span class="tag tag-crimson">${esc(r.code)}</span>
              <div class="inst-line mono">${esc(r.directorate)}</div>
            </td>
            <td class="mono" style="white-space:nowrap;">${esc(r.date)}<div class="inst-line">${esc(r.basis)}</div></td>
            <td>
              ${r.authorityEik
                ? `<a href="#" data-open-authority="${esc(r.authorityEik)}"><strong>${esc(r.authorityName)}</strong></a><div class="inst-line mono">ЕИК ${esc(r.authorityEik)} · ${esc(r.authorityRegion || '')} · ЗОП: ${fmtEur(r.authoritySpentEur || 0)}</div>`
                : `<span style="font-size:12px;">${esc(r.object.slice(0, 95))}</span>`}
            </td>
            <td style="font-size:12px;">
              <div>
                ${r.linkType === 'EXACT_EIK'
                  ? '<span class="tag tag-teal">ДИРЕКТНО СЪВПАДЕНИЕ (ЕИК/УНП)</span>'
                  : '<span class="tag tag-slate">ЧЛ. 17, АЛ. 7 ЗДФИ (АКТУАЛИЗИРАН PDF)</span>'}
                <strong>${esc(r.linkedCourtCase || 'Чл. 17, ал. 7 ЗДФИ')}</strong>
              </div>
              <div class="inst-line" style="margin-top:3px;">
                <span class="tag ${String(r.courtFate).includes('ОТМЕНЕНО') ? 'tag-crimson' : String(r.courtFate).includes('ПОТВЪРДЕНО') ? 'tag-teal' : 'tag-ochre'}">${esc(r.courtFate)}</span>
                ${r.annulmentReason && r.annulmentReason !== '—' ? `<span class="tag tag-plum">${esc(r.annulmentReason)}</span>` : ''}
              </div>
            </td>
            <td style="white-space:nowrap;">
              <a class="btn" style="padding:3px 8px;font-size:11px;" href="${esc(r.url)}" target="_blank" rel="noopener">Доклад PDF ↗</a>
              ${r.linkedCaseUrl && r.linkedCaseUrl !== r.url ? `<a class="btn" style="padding:3px 7px;font-size:10.5px;margin-left:4px;" href="${esc(r.linkedCaseUrl)}" target="_blank" rel="noopener">Съд ↗</a>` : ''}
            </td>
          </tr>`).join('') || `<tr><td colspan="6" class="loading">Няма записи за избрания филтър.</td></tr>`}</tbody>
        </table></div>
      </div>

      <div class="two-col" style="margin-bottom:16px;">
        <div class="panel-box">
          <h3>Основания за възлагане на инспекциите на АДФИ (${fmtInt(m2.totalReports)} доклада · ${Object.entries(byYr).map(([y, c]) => `${y}: ${fmtInt(c)}`).join(' · ')})</h3>
          <div class="bar-list">
            ${basisRows.map((b) => `<div class="bar-row" style="cursor:default;">
              <div class="bar-top"><span>${esc(b.label)}</span><span class="mono"><strong>${fmtInt(b.count)}</strong></span></div>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, (b.count / maxB) * 100).toFixed(1)}%;background:${b.label.includes('Прокуратура') ? '#b91c1c' : b.label.includes('ЗОП') ? '#b45309' : '#1e3a8a'};"></div></div>
            </div>`).join('')}
          </div>
        </div>
        <div class="panel-box">
          <h3>Исторически знакови доклади на АДФИ (до 2024 г. · PDF архив)</h3>
          ${(m2.historicalHighlights || []).map((h) => `<div class="contract-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div><strong>${esc(h.entity)}</strong><div class="inst-line">${esc(h.title)}</div></div>
            <a class="btn" style="padding:3px 9px;font-size:11px;" href="${esc(h.url)}" target="_blank" rel="noopener">PDF ↗</a>
          </div>`).join('')}
        </div>
      </div>

      <div class="panel-box" style="margin-bottom:16px;">
        <h3>Най-често инспектирани от АДФИ институции (Топ ${insts.length} · С преки PDF връзки към докладите)</h3>
        <div class="table-wrap" style="border:none;max-height:460px;overflow-y:auto;"><table>
          <thead><tr><th>№</th><th>Възложител (ЕИК / Област)</th><th class="num">ЗОП разход (€)</th><th class="num">АДФИ докл.</th><th class="num">Чл. 17(7) актуал.</th><th class="num">Индекс</th><th>Живи АДФИ PDF доклади</th></tr></thead>
          <tbody>${insts.map((a, i) => `<tr>
            <td class="mono muted">${i + 1}</td>
            <td><a href="#" data-open-authority="${esc(a.eik)}"><strong>${esc(a.name)}</strong></a><div class="inst-line mono">ЕИК ${esc(a.eik)} · ${esc(a.region)} · ${a.ownHits > 0 ? '<span style="color:var(--crimson);font-weight:700;">' + a.ownHits + ' самовъзл.</span>' : (a.contracts + ' дог.')}</div></td>
            <td class="num" style="font-weight:700;">${fmtEur(a.spentEur)}</td>
            <td class="num"><span class="tag tag-navy">${a.reportCount} докл.</span><div class="inst-line">${a.signalInitiatedCount} по сигнал</div></td>
            <td class="num">${a.updatedArt17Count > 0 ? `<span class="tag tag-crimson">${a.updatedArt17Count} (${a.updatedRatePct}%)</span>` : '<span class="muted">0</span>'}</td>
            <td class="num">${riskBadgeHtml(a.impunityRiskScore)}</td>
            <td>${(a.reports || []).slice(0, 3).map((r) => `<a class="tag ${r.updatedArt17 ? 'tag-crimson' : 'tag-slate'}" style="margin:1px 2px;" href="${esc(r.url)}" target="_blank" rel="noopener" title="${esc(r.basis)} · ${esc(r.date)}">${esc(r.code)} PDF ↗</a>`).join('')}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>

      <div class="panel-box">
        <h3>„Сляпо петно“ на одита: Топ 25 мега-възложители (&ge;€40 млн.) с 0 публикувани доклада от АДФИ (2024–2026)</h3>
        <div class="table-wrap" style="border:none;max-height:360px;overflow-y:auto;"><table>
          <thead><tr><th>№</th><th>Институция (ЕИК)</th><th>Тип / Област</th><th class="num">Изразходвано (€)</th><th class="num">Договори</th><th class="num">1 оферта %</th></tr></thead>
          <tbody>${uninsp.map((u, i) => `<tr data-open-authority="${esc(u.eik)}">
            <td class="mono muted">${i + 1}</td>
            <td><strong>${esc(u.name)}</strong><div class="inst-line mono">ЕИК ${esc(u.eik)}</div></td>
            <td>${esc(u.type)} · ${esc(u.region)}</td>
            <td class="num" style="font-weight:700;color:var(--crimson);">${fmtEur(u.spentEur)}</td>
            <td class="num">${fmtInt(u.contracts)}</td>
            <td class="num">${u.singleOfferPct > 0 ? u.singleOfferPct + '%' : '—'}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`;

    document.getElementById('art17ViewPills')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a17-v]');
      if (!b) return;
      art17View = b.dataset.a17V;
      renderMod2Impunity(host, q);
    });
  }

  // ---- MODULE J3: LEGAL & EXPERT GRAPH ----
  function renderMod3LegalExpert(host, q) {
    const { fmtEur, fmtInt, esc } = api();
    const m3 = j6Data.module3_legalExpertGraph || {};
    let laws = m3.topLawFirmHubs || [];
    let exps = m3.topExpertHubs || [];
    const adfiVl = m3.adfiRegisteredExperts || {};
    if (q) {
      laws = laws.filter((x) => `${x.name} ${x.eik} ${(x.topAuthorities || []).map((t) => t.name).join(' ')}`.toLowerCase().includes(q));
      exps = exps.filter((x) => `${x.name} ${x.eik} ${(x.topAuthorities || []).map((t) => t.name).join(' ')}`.toLowerCase().includes(q));
    }

    host.innerHTML = `
      <div class="editorial-note note-plum">
        <div>
          <strong>3. Скрити мрежи чрез адвокати и вещи лица (Legal &amp; Expert Graph):</strong>
          Разкрива мулти-институционалните адвокатски хъбове (<strong>${fmtInt(m3.lawFirmsCount)} правни кантори</strong> за <strong>${fmtEur(m3.lawFirmsTotalEur)}</strong>), повтарящите се консултанти по строителен надзор и одит (<strong>${fmtInt(m3.expertFirmsCount)} фирми</strong> за <strong>${fmtEur(m3.expertFirmsTotalEur)}</strong>) и официалния <strong>Списък на вещите лица на АДФИ (${adfiVl.totalExperts || 0} експерти към ${esc(adfiVl.asOf)})</strong>.
          Всички те са интегрирани като <strong>2 нови типа възли (Адвокат и Вещо лице)</strong> в Мрежовия граф 3.0!
        </div>
        <button type="button" class="btn btn-dark" id="btnOpenLegalGraphPreset">Визуализирай в Граф 3.0 &rarr;</button>
      </div>

      <div class="two-col" style="margin-bottom:16px;">
        <div class="panel-box">
          <h3>Мулти-институционални адвокатски кантори (Топ ${laws.length})</h3>
          <p class="chart-caption">Адвокатски дружества, наемани за правни услуги и процесуално представителство от множество държавни институции и общини.</p>
          <div class="table-wrap" style="border:none;max-height:480px;overflow-y:auto;"><table>
            <thead><tr><th>№</th><th>Адвокатско дружество / Кантора</th><th class="num">Инст.</th><th class="num">Общо (€)</th><th class="num">1 оф.</th></tr></thead>
            <tbody>${laws.map((l, i) => `<tr data-open-company="${esc(l.eik || l.name)}">
              <td class="mono muted">${i + 1}</td>
              <td>
                <strong style="color:#0284c7;">${esc(l.name)}</strong>
                <div class="inst-line mono">${l.eik ? 'ЕИК ' + esc(l.eik) : ''} · ${l.contracts} дог. · Пряко: ${l.directAwardPct}%</div>
                <div class="inst-line muted">Възл.: ${esc((l.topAuthorities || []).slice(0, 3).map((t) => t.name).join('; '))}</div>
              </td>
              <td class="num"><span class="tag ${l.authorityCount >= 5 ? 'tag-crimson' : 'tag-navy'}">${l.authorityCount}</span></td>
              <td class="num" style="font-weight:700;">${fmtEur(l.totalEur)}</td>
              <td class="num">${l.singleOfferPct}%</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>

        <div class="panel-box">
          <h3>„Дежурни“ консултанти по строителен надзор и одит (Топ ${exps.length})</h3>
          <p class="chart-caption">Фирми за строителен надзор, оценка на съответствието и експертизи, повтарящи се в десетки общини и инфраструктурни обекти.</p>
          <div class="table-wrap" style="border:none;max-height:480px;overflow-y:auto;"><table>
            <thead><tr><th>№</th><th>Експертна / Надзорна фирма (ЕИК)</th><th class="num">Инст.</th><th class="num">Общо (€)</th><th class="num">1 оф.</th></tr></thead>
            <tbody>${exps.map((e, i) => `<tr data-open-company="${esc(e.eik)}">
              <td class="mono muted">${i + 1}</td>
              <td>
                <strong style="color:#059669;">${esc(e.name)}</strong>
                <div class="inst-line mono">ЕИК ${esc(e.eik)} · ${e.contracts} дог.</div>
                <div class="inst-line muted">Възл.: ${esc((e.topAuthorities || []).slice(0, 3).map((t) => t.name).join('; '))}</div>
              </td>
              <td class="num"><span class="tag tag-teal">${e.authorityCount}</span></td>
              <td class="num" style="font-weight:700;">${fmtEur(e.totalEur)}</td>
              <td class="num">${e.singleOfferPct}%</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>

      <div class="panel-box">
        <div class="chart-head">
          <div>
            <h3 style="margin:0;border:none;padding:0;">Официален списък на вещите лица към АДФИ (${adfiVl.totalExperts || 0} експерти · ${esc(adfiVl.asOf)})</h3>
            <p class="chart-caption" style="margin-bottom:0;">
              <strong>Дефицит на прозрачност:</strong> АДФИ публикува списъка с инициали (<code>А. Б. А.</code>) по чл. 2 ЗЗЛД, което пречи на гражданския контрол за конфликт на интереси. NAsvetlo предлага псевдонимизирана проверка в RegiX.
            </p>
          </div>
          <a class="btn" href="${esc(adfiVl.sourceUrl)}" target="_blank" rel="noopener">Оригинален PDF на АДФИ ↗</a>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 12px;">
          ${(adfiVl.specialties || []).map((s) => `<span class="tag tag-teal">${esc(s.category)}: <strong>${s.count}</strong></span>`).join('')}
        </div>
        <div class="table-wrap" style="border:none;max-height:280px;overflow-y:auto;"><table>
          <thead><tr><th>№</th><th>Инициали (ЗЗЛД)</th><th>Категория</th><th>Утвърдена специалност (чл. 9, т. 9 ППЗДФИ)</th></tr></thead>
          <tbody>${(adfiVl.samples || []).map((s) => `<tr>
            <td class="mono muted">${s.no}</td>
            <td class="mono"><strong>${esc(s.initials)}</strong></td>
            <td>${(s.categories || []).map((c) => `<span class="tag tag-slate">${esc(c)}</span>`).join(' ')}</td>
            <td style="font-size:12px;">${esc(s.specialty)}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>

      <div class="panel-box" style="margin-top:16px;">
        <h3>Извлечени адвокати, юрисконсулти и вещи лица директно от съдебните актове в ЕПЕП / ЕИСС (${(m3.eissExtractedLawyers || []).length} процесуални представители)</h3>
        <div class="table-wrap" style="border:none;max-height:340px;overflow-y:auto;"><table>
          <thead><tr><th>Роля и Име в съдебния акт</th><th>Съд / Дело</th><th>Възложител / Институция</th><th>Страни по делото</th><th>ЕПЕП</th></tr></thead>
          <tbody>${(m3.eissExtractedLawyers || []).map((lw) => `<tr>
            <td><strong style="color:#0284c7;">${esc(lw.role)} ${esc(lw.name)}</strong></td>
            <td class="mono" style="white-space:nowrap;">${esc(lw.court)} · ${esc(lw.caseNo)}</td>
            <td><strong>${esc(lw.authority)}</strong></td>
            <td style="font-size:12px;">${esc(lw.party)}</td>
            <td><a class="btn" style="padding:2px 8px;font-size:11px;" href="${esc(lw.caseUrl)}" target="_blank" rel="noopener">Дело ↗</a></td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`;

    document.getElementById('btnOpenLegalGraphPreset')?.addEventListener('click', () => {
      api().switchTab('graph');
      const sel = document.getElementById('graphPresetSelect');
      if (sel) { sel.value = 'legal_expert'; if (window.SIGMA3_MOD) window.SIGMA3_MOD.buildGraphData('legal_expert', ''); }
      document.getElementById('mainTabs')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ---- MODULE J4: KZK / VAS PRELIMINARY EXECUTION (LIVE reg.cpc.bg + LIVE VAS CourtId=113 EISS!) ----
  function renderMod4KzkVas(host, q) {
    const { fmtEur, fmtInt, esc } = api();
    const m4 = j6Data.module4_kzkVas || {};
    const tot = m4.year2026Totals || {};
    const ing = m4.ingestedCounts || {};
    let vasActs = m4.liveVasFinalActs || [];
    let prelims = m4.prelimRulings || [];
    let decs = m4.decisions || [];
    let doss = m4.openDossiers || [];
    let topAuths = m4.topAuthorities || [];
    let topApps = m4.topAppellants || [];
    if (q) {
      vasActs = vasActs.filter((v) => `${v.vasCaseNo} ${v.vasActNo} ${v.kzkDossierNo} ${v.kzkActNo} ${v.appellantName} ${v.authorityName} ${v.vasOutcome} ${v.disposition}`.toLowerCase().includes(q));
      prelims = prelims.filter((r) => `${r.caseNo} ${r.actNo} ${r.initiatorsRaw} ${r.respondentsRaw} ${r.disposition} ${r.outcome}`.toLowerCase().includes(q));
      decs = decs.filter((r) => `${r.caseNo} ${r.actNo} ${r.initiatorsRaw} ${r.respondentsRaw} ${r.disposition} ${r.outcome}`.toLowerCase().includes(q));
      doss = doss.filter((r) => `${r.caseNo} ${r.unp} ${r.initiatorsRaw} ${r.respondentsRaw} ${r.description}`.toLowerCase().includes(q));
      topAuths = topAuths.filter((a) => `${a.name} ${a.eik}`.toLowerCase().includes(q));
      topApps = topApps.filter((c) => `${c.name} ${c.eik}`.toLowerCase().includes(q));
    }

    const sevTag = (r) => {
      const cls = r.severity === 'critical' ? 'tag-crimson' : r.severity === 'warn' ? 'tag-ochre' : r.severity === 'ok' ? 'tag-teal' : 'tag-slate';
      return `<span class="tag ${cls}">${esc(r.outcome)}</span>`;
    };

    const renderVasTable = (list) => `<div class="table-wrap" style="border:none;max-height:540px;overflow-y:auto;"><table>
      <thead><tr><th>ВАС Дело / Акт (IV отд.)</th><th>Обжалван акт на КЗК &amp; ЦАИС ЕОП</th><th>Жалбоподател (Фирма)</th><th>Възложител (Ответник)</th><th>Окончателен резултат във ВАС и Диспозитив</th><th>ВАС Акт</th></tr></thead>
      <tbody>${list.map((v) => `<tr>
        <td style="white-space:nowrap;">
          <strong>ВАС адм.д. № ${esc(v.vasCaseNo)}</strong>
          <div class="inst-line mono">${esc(v.vasActNo)} · ${esc(v.vasActDate)}</div>
          <div class="inst-line"><span class="tag ${v.isPrelim ? 'tag-ochre' : 'tag-navy'}">${v.isPrelim ? 'Чл. 217 ЗОП (Предв. изп. / ЧАД)' : 'Чл. 216 ЗОП (По същество / КАД)'}</span></div>
        </td>
        <td style="white-space:nowrap;">
          ${v.kzkDossierNo ? `<div><strong>Преписка:</strong> <span class="mono">${esc(v.kzkDossierNo)}</span></div>` : ''}
          ${v.kzkActNo ? `<div class="inst-line mono">Акт КЗК: ${esc(v.kzkActNo)}</div>` : ''}
          ${(v.eopDecisionRefs && v.eopDecisionRefs.length) ? `<div class="inst-line mono" style="color:var(--plum);">ЦАИС: ${esc(v.eopDecisionRefs.join(', '))}</div>` : ''}
          ${v.unp ? `<div class="inst-line mono">УНП ${esc(v.unp)}</div>` : ''}
        </td>
        <td>
          ${v.appellantEik
            ? `<a href="#" data-open-company="${esc(v.appellantEik)}"><strong>${esc(v.appellantName)}</strong></a> <span class="tag tag-teal">MATCH</span>`
            : `<strong style="font-size:12px;">${esc(v.appellantName)}</strong>`}
        </td>
        <td>
          ${v.authorityEik
            ? `<a href="#" data-open-authority="${esc(v.authorityEik)}"><strong>${esc(v.authorityName)}</strong></a> <span class="tag tag-teal">${esc(v.authorityMatch)}</span>`
            : `<span style="font-size:12px;">${esc(v.authorityName)}</span>`}
        </td>
        <td style="max-width:410px;font-size:11.8px;">
          <div><span class="tag ${v.severity === 'critical' ? 'tag-crimson' : v.severity === 'ok' ? 'tag-teal' : 'tag-slate'}">${esc(v.vasOutcome)}</span></div>
          <div style="margin-top:4px;">${esc((v.disposition || '').slice(0, 235))}${(v.disposition || '').length > 235 ? '…' : ''}</div>
          ${(v.judges && v.judges.length) ? `<div class="inst-line muted">Състав на ВАС: ${esc(v.judges.join(', '))}</div>` : ''}
          ${(v.lawyers && v.lawyers.length) ? `<div class="inst-line" style="color:#0284c7;">${esc(v.lawyers.join(' · '))}</div>` : ''}
        </td>
        <td style="white-space:nowrap;">
          <a class="btn" style="padding:3px 8px;font-size:11px;margin-bottom:4px;display:inline-block;" href="${esc(v.actDownloadUrl)}" target="_blank" rel="noopener">ВАС Акт ↗</a><br/>
          <a class="btn" style="padding:2px 7px;font-size:10.5px;" href="${esc(v.caseUrl)}" target="_blank" rel="noopener">ЕПЕП ↗</a>
        </td>
      </tr>`).join('') || `<tr><td colspan="6" class="loading">Няма записи за филтъра.</td></tr>`}</tbody>
    </table></div>`;

    const renderActsTable = (list) => `<div class="table-wrap" style="border:none;max-height:520px;overflow-y:auto;"><table>
      <thead><tr><th>Акт / Производство</th><th>Дата</th><th>Произнасяне на КЗК и Окончателен ВАС статус</th><th>Инициатор (17 428 фирми)</th><th>Ответник (4 344 възл.)</th></tr></thead>
      <tbody>${list.map((r) => `<tr>
        <td style="white-space:nowrap;">
          <a href="${esc(r.url)}" target="_blank" rel="noopener"><strong>${esc(r.caseNo || r.actNo)} ↗</strong></a>
          <div class="inst-line mono">${esc(r.actNo)}</div>
          ${r.unp ? `<div class="inst-line mono">УНП ${esc(r.unp)}${r.contractValueEur > 0 ? ' · ' + fmtEur(r.contractValueEur) : ''}</div>` : ''}
        </td>
        <td class="mono" style="white-space:nowrap;">${esc(r.date)}</td>
        <td>
          <div>
            ${sevTag(r)}
            ${r.vasOutcome ? `<a class="tag tag-plum" href="${esc(r.vasActUrl || '#')}" target="_blank" rel="noopener">ВАС д. ${esc(r.vasCaseNo)}: ${esc(r.vasOutcome)} ↗</a>` : (r.appealedToVas ? '<span class="tag tag-plum">Обжалвано пред ВАС</span>' : '')}
          </div>
          <div class="inst-line">${esc(r.disposition.slice(0, 175))}</div>
        </td>
        <td>
          ${(r.matchedInitiators && r.matchedInitiators.length)
            ? r.matchedInitiators.map((mi) => `<div><a href="#" data-open-company="${esc(mi.eik)}"><strong>${esc(mi.name)}</strong></a> <span class="tag tag-teal">MATCH</span></div>`).join('')
            : `<span style="font-size:12px;">${esc(r.initiatorsRaw.slice(0, 80))}</span>`}
        </td>
        <td>
          ${r.authorityEik
            ? `<a href="#" data-open-authority="${esc(r.authorityEik)}"><strong>${esc(r.authorityName)}</strong></a> <span class="tag tag-teal">${esc(r.authorityMatch)}</span>`
            : `<span style="font-size:12px;">${esc(r.respondentsRaw.slice(0, 80))}</span>`}
        </td>
      </tr>`).join('') || `<tr><td colspan="5" class="loading">Няма записи за филтъра.</td></tr>`}</tbody>
    </table></div>`;

    let bodyHtml = '';
    if (kzkView === 'vas') bodyHtml = renderVasTable(vasActs);
    else if (kzkView === 'prelim') bodyHtml = renderActsTable(prelims);
    else if (kzkView === 'decisions') bodyHtml = renderActsTable(decs);
    else if (kzkView === 'dossiers') {
      bodyHtml = `<div class="table-wrap" style="border:none;max-height:520px;overflow-y:auto;"><table>
        <thead><tr><th>Дело / Дата</th><th>УНП и Стойност (ЦАИС)</th><th>Инициатор &rarr; Ответник</th><th>Описание на жалбата</th></tr></thead>
        <tbody>${doss.map((d) => `<tr>
          <td style="white-space:nowrap;"><a href="${esc(d.url)}" target="_blank" rel="noopener"><strong>${esc(d.caseNo)} ↗</strong></a><div class="inst-line mono">${esc(d.date)} · ${esc(d.status)}</div></td>
          <td class="mono">${esc(d.unp || '—')}${d.contractValueEur > 0 ? `<div style="color:var(--crimson);font-weight:700;">${fmtEur(d.contractValueEur)}</div>` : ''}</td>
          <td>
            <div>${d.contractorEik ? `<a href="#" data-open-company="${esc(d.contractorEik)}"><strong>${esc(d.initiatorsRaw)}</strong></a>` : esc(d.initiatorsRaw)}</div>
            <div class="inst-line">&rarr; ${d.authorityEik ? `<a href="#" data-open-authority="${esc(d.authorityEik)}">${esc(d.respondentsRaw)}</a>` : esc(d.respondentsRaw)}</div>
          </td>
          <td style="font-size:12px;">${esc(d.description)}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    } else {
      bodyHtml = `<div class="two-col">
        <div class="panel-box">
          <h3>Топ възложители в КЗК (Предварително изпълнение / Отменени)</h3>
          <div class="table-wrap" style="border:none;max-height:420px;overflow-y:auto;"><table>
            <thead><tr><th>Възложител</th><th class="num">Акта</th><th class="num">Предв. изп.</th><th class="num">Отм.</th><th class="num">ВАС</th></tr></thead>
            <tbody>${topAuths.map((a) => `<tr data-open-authority="${esc(a.eik)}">
              <td><strong>${esc(a.name)}</strong><div class="inst-line mono">${fmtEur(a.spentEur)}</div></td>
              <td class="num">${a.totalActs}</td>
              <td class="num">${a.prelimGranted > 0 ? `<span class="tag tag-crimson">${a.prelimGranted}</span>` : '0'}</td>
              <td class="num">${a.overturned > 0 ? `<span class="tag tag-ochre">${a.overturned}</span>` : '0'}</td>
              <td class="num">${a.vasAppeals}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="panel-box">
          <h3>Топ жалбоподатели (Компании от 17 428)</h3>
          <div class="table-wrap" style="border:none;max-height:420px;overflow-y:auto;"><table>
            <thead><tr><th>Фирма (ЕИК)</th><th class="num">Жалби</th><th class="num">Спечелени</th><th class="num">ЗОП (€)</th></tr></thead>
            <tbody>${topApps.map((c) => `<tr data-open-company="${esc(c.eik)}">
              <td><strong>${esc(c.name)}</strong><div class="inst-line mono">ЕИК ${esc(c.eik)}</div></td>
              <td class="num">${c.totalActs}</td>
              <td class="num">${c.winsOverturned > 0 ? `<span class="tag tag-teal">${c.winsOverturned}</span>` : '0'}</td>
              <td class="num">${fmtEur(c.wonEur)}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>`;
    }

    const vasBreak = m4.vasOutcomeBreakdown || [];
    host.innerHTML = `
      <div class="editorial-note">
        <div>
          <strong>4. Предварително изпълнение и блокиране на конкуренцията (КЗК <code>reg.cpc.bg</code> &times; Окончателни актове на ВАС IV отделение <code>ecase.justice.bg</code> без CAPTCHA):</strong>
          Само за 2026 г. в КЗК са образувани <strong>${fmtInt(tot.proceedings)} производства по ЗОП</strong>, <strong>${fmtInt(tot.decisions)} решения</strong> и <strong>${fmtInt(tot.prelimDeterminations)} определения</strong>.
          Чрез директния ЕПЕП / ЕИСС API достъп до <strong>Върховния административен съд (CourtId 113)</strong> са извлечени пълните диспозитиви на <strong>${vasActs.length} окончателни решения и определения на ВАС</strong> по жалби срещу актове на КЗК (дали ВАС оставя в сила или отменя решението/предварителното изпълнение на КЗК):
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
            ${vasBreak.map((vb) => `<span class="tag ${vb.outcome.includes('ОТМЕНЯ') ? 'tag-crimson' : 'tag-teal'}">${esc(vb.outcome)}: <strong>${vb.count}</strong></span>`).join('')}
          </div>
        </div>
        <div class="pill-row" id="kzkViewPills">
          <button class="pill ${kzkView === 'vas' ? 'active' : ''}" data-kzk-v="vas">Окончателни актове на ВАС (${vasActs.length})</button>
          <button class="pill ${kzkView === 'prelim' ? 'active' : ''}" data-kzk-v="prelim">КЗК Предварително изпълнение (${prelims.length})</button>
          <button class="pill ${kzkView === 'decisions' ? 'active' : ''}" data-kzk-v="decisions">КЗК Решения по ЗОП (${decs.length})</button>
          <button class="pill ${kzkView === 'dossiers' ? 'active' : ''}" data-kzk-v="dossiers">Открити дела с УНП (${doss.length})</button>
          <button class="pill ${kzkView === 'stats' ? 'active' : ''}" data-kzk-v="stats">Класация страни</button>
        </div>
      </div>
      ${bodyHtml}`;

    document.getElementById('kzkViewPills')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-kzk-v]');
      if (!b) return;
      kzkView = b.dataset.kzkV;
      renderMod4KzkVas(host, q);
    });
  }

  // ---- MODULE J5: INSOLVENCY, DISTRAINTS & PHOENIX COMPANIES ----
  function renderMod5Phoenix(host, q) {
    const { fmtEur, fmtInt, esc } = api();
    const m5 = j6Data.module5_insolvencyPhoenix || {};
    let dist = m5.distressedFirms || [];
    let chains = m5.phoenixChains || [];
    let burn = m5.burnoutFirms || [];
    if (q) {
      dist = dist.filter((x) => `${x.name} ${x.eik} ${x.statusLabel}`.toLowerCase().includes(q));
      chains = chains.filter((x) => `${x.owner} ${(x.firms || []).map((f) => f.name).join(' ')}`.toLowerCase().includes(q));
      burn = burn.filter((x) => `${x.name} ${x.eik} ${x.topAuthority}`.toLowerCase().includes(q));
    }

    host.innerHTML = `
      <div class="editorial-note note-crimson">
        <div>
          <strong>5. Несъстоятелност, запори и „Феникс“ фирми (Търговски регистър — запори, особени залози и ликвидационен/дългов срив):</strong>
          Проверява живите партиди в Търговския регистър за <strong>несъстоятелност, ликвидация, запори на дружествени дялове (ЧСИ / НАП)</strong> и <strong>особени залози</strong>, и проследява <strong>${fmtInt(m5.burnoutFirmsCount)} компании</strong>, спечелили <strong>${fmtEur(m5.burnoutTotal2020_2023Eur)}</strong> през 2020–2023 г. и внезапно спрели до €0 през 2024–2026 г. (класически профил на „изгаряне“ и прехвърляне към нова фирма).
        </div>
      </div>

      <div class="two-col" style="margin-bottom:16px;">
        <div class="panel-box">
          <h3>Фирми със запори, залози или несъстоятелност в ТР (${dist.length})</h3>
          <div class="table-wrap" style="border:none;max-height:440px;overflow-y:auto;"><table>
            <thead><tr><th>Фирма (ЕИК) и статус в ТР</th><th class="num">Спечелено (€)</th><th>Запори / Залози (ТР)</th></tr></thead>
            <tbody>${dist.map((d) => `<tr data-open-company="${esc(d.eik)}">
              <td>
                <strong>${esc(d.name)}</strong>
                <div class="inst-line mono">ЕИК ${esc(d.eik)} · <span class="tag ${d.isInsolvent || d.isLiquidation ? 'tag-crimson' : 'tag-ochre'}">${esc(d.statusLabel)}</span></div>
              </td>
              <td class="num" style="font-weight:700;">${fmtEur(d.wonEur)}<div class="inst-line">${d.contracts} дог.</div></td>
              <td>
                <div class="badges" style="margin-top:0;">
                  ${d.distraintCount > 0 ? `<span class="tag tag-crimson">${d.distraintCount} запора (CR_F_26_L)</span>` : ''}
                  ${d.pledgeCount > 0 ? `<span class="tag tag-ochre">${d.pledgeCount} особени залога</span>` : ''}
                  ${d.isBurnout ? '<span class="tag tag-plum">СРИВ 2024–26</span>' : ''}
                </div>
                ${(d.distraintDetails || d.pledgeDetails || []).slice(0, 1).map((t) => `<div class="inst-line">${esc(t.slice(0, 110))}…</div>`).join('')}
              </td>
            </tr>`).join('') || `<tr><td colspan="3" class="loading">Няма намерени записи.</td></tr>`}</tbody>
          </table></div>
        </div>

        <div class="panel-box">
          <h3>„Феникс“ и мулти-фирмени вериги по общ собственик в ТР (${chains.length})</h3>
          <div style="max-height:440px;overflow-y:auto;">
            ${chains.map((ch) => `<div class="contract-row" style="border-left:3px solid ${ch.hasDistressedOrBurnout ? 'var(--crimson)' : 'var(--plum)'};">
              <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:5px;">
                <strong>${esc(ch.owner)}</strong>
                <span class="mono" style="color:var(--crimson);font-weight:700;">${ch.firmCount} фирми · ${fmtEur(ch.combinedEur)}</span>
              </div>
              ${ch.firms.map((f) => `<div style="font-size:12px;margin-bottom:3px;display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap;">
                <span><a href="#" data-open-company="${esc(f.eik)}">${esc(f.name)}</a> <span class="mono muted">(${esc(f.eik)} · ${esc(f.incorpDate || '—')})</span> ${f.distraintCount > 0 ? '<span class="tag tag-crimson">' + f.distraintCount + ' запор</span>' : ''}${f.pledgeCount > 0 ? '<span class="tag tag-ochre">' + f.pledgeCount + ' залог</span>' : ''}${f.isBurnout ? '<span class="tag tag-plum">спряла</span>' : ''}</span>
                <span class="mono">${fmtEur(f.wonEur)}</span>
              </div>`).join('')}
            </div>`).join('') || '<div class="muted">Няма открити вериги.</div>'}
          </div>
        </div>
      </div>

      <div class="panel-box">
        <h3>Топ ${burn.length} дружества в ликвидационен/дългов срив (&ge;€1,5 млн. през 2020–2023 г. &rarr; €0 през 2024–2026 г.)</h3>
        <div class="table-wrap" style="border:none;max-height:420px;overflow-y:auto;"><table>
          <thead><tr><th>№</th><th>Компания (ЕИК) и последен договор</th><th class="num">2020–2023 (€)</th><th class="num">2024–2026</th><th>Статус ТР</th><th>Проверка</th></tr></thead>
          <tbody>${burn.map((b, i) => `<tr>
            <td class="mono muted">${i + 1}</td>
            <td><a href="#" data-open-company="${esc(b.eik)}"><strong>${esc(b.name)}</strong></a><div class="inst-line mono">ЕИК ${esc(b.eik)} · Последен: ${esc(b.lastContractDate)} · ${b.singleOfferPct}% с 1 оф.</div><div class="inst-line muted">Топ възл.: ${esc(b.topAuthority)}</div></td>
            <td class="num" style="font-weight:700;color:var(--crimson);">${fmtEur(b.eur2020_2023)}<div class="inst-line">${b.cnt2020_2023} дог.</div></td>
            <td class="num mono muted">€0</td>
            <td><span class="tag ${b.distraints > 0 ? 'tag-crimson' : b.pledges > 0 ? 'tag-ochre' : 'tag-slate'}">${esc(b.crStatus)}${b.distraints > 0 ? ' · ' + b.distraints + ' запор' : ''}${b.pledges > 0 ? ' · ' + b.pledges + ' залог' : ''}</span></td>
            <td><a class="btn" style="padding:2px 8px;font-size:11px;" href="https://portal.registryagency.bg/CR/Reports/ActiveConditionTabResult?uic=${esc(b.eik)}" target="_blank" rel="noopener">ТР ↗</a></td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`;
  }

  // ---- MODULE J6: CRIMINAL / ZMIP / EPPO COMPLIANCE PROFILE ----
  function renderMod6Eppo(host, q) {
    const { fmtEur, fmtInt, esc } = api();
    const m6 = j6Data.module6_criminalEppo || {};
    let hits = m6.eppoHighRiskContracts || [];
    let gaps = m6.zmipBeneficialOwnerGaps || [];
    if (q) {
      hits = hits.filter((h) => `${h.authority} ${h.contractor} ${h.subject} ${h.unp}`.toLowerCase().includes(q));
      gaps = gaps.filter((g) => `${g.name} ${g.eik}`.toLowerCase().includes(q));
    }
    const sc = m6.art54ZopSchema || {};
    host.innerHTML = `
      <div class="editorial-note note-plum">
        <div>
          <strong>6. ЗМИП и EPPO рисков профил (Регламент (ЕС) 2017/1939 &amp; чл. 54 ЗОП):</strong>
          В ЦАИС ЕОП са отчетени <strong>${fmtInt(m6.euFundedContractsTotal)} договора с европейско финансиране</strong> на стойност <strong>${fmtEur(m6.euFundedTotalEur)}</strong>, от които <strong>${m6.euSingleOfferSharePct}% (${fmtEur(m6.euSingleOfferEur)})</strong> са възложени с <strong>1 оферта</strong>.
          Открити са <strong>${fmtInt(m6.eppoHighRiskCount)} високорискови ЕС договора (&ge;€1 млн. с 1 оферта / пряко договаряне)</strong> за <strong>${fmtEur(m6.eppoHighRiskEur)}</strong>, попадащи в материалния праг за одит на Европейската прокуратура (EPPO).
          <br/><span class="muted" style="font-size:11.5px;">${esc(sc.disclaimer)}</span>
        </div>
      </div>

      <div class="panel-box" style="margin-bottom:16px;">
        <h3>Топ ${hits.length} договора с ЕС средства и обективни EPPO рискови тригери</h3>
        <div class="table-wrap" style="border:none;max-height:460px;overflow-y:auto;"><table>
          <thead><tr><th>Дата / УНП</th><th>Възложител &rarr; Изпълнител</th><th>Тригери (Регл. ЕС 2017/1939)</th><th class="num">Стойност ЕС (€)</th><th>JSON</th></tr></thead>
          <tbody>${hits.map((h) => `<tr>
            <td class="mono" style="white-space:nowrap;">${esc(h.signedAt)}<div class="inst-line">${esc(h.unp)}</div></td>
            <td><a href="#" data-open-authority="${esc(h.authorityEik)}"><strong>${esc(h.authority)}</strong></a><div class="inst-line">&rarr; <a href="#" data-open-company="${esc(h.contractorEik || h.contractor)}">${esc(h.contractor.slice(0, 56))}</a></div><div class="inst-line muted">${esc(h.subject.slice(0, 100))}</div></td>
            <td><div class="badges" style="margin-top:0;">${(h.triggers || []).map((t) => `<span class="tag ${t.includes('EPPO') || t.includes('1 оферта') ? 'tag-crimson' : 'tag-ochre'}">${esc(t)}</span>`).join('')}</div></td>
            <td class="num" style="font-weight:700;color:var(--crimson);">${fmtEur(h.valueEur)}</td>
            <td><button class="btn" style="padding:2px 6px;font-size:10px;" data-inspect-contract="${esc(h.id)}">JSON</button></td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>

      <div class="two-col">
        <div class="panel-box">
          <h3>ЗМИП / Чуждестранен контрол (От живите ТР партиди · ${gaps.length})</h3>
          <div class="table-wrap" style="border:none;max-height:360px;overflow-y:auto;"><table>
            <thead><tr><th>Фирма (ЕИК)</th><th class="num">Спечелено (€)</th><th>ЗМИП статус</th></tr></thead>
            <tbody>${gaps.map((g) => `<tr data-open-company="${esc(g.eik)}">
              <td><strong>${esc(g.name)}</strong><div class="inst-line mono">ЕИК ${esc(g.eik)} · ${esc(g.statusLabel)}</div></td>
              <td class="num" style="font-weight:700;">${fmtEur(g.wonEur)}</td>
              <td>${!g.hasZmipBo ? '<span class="tag tag-ochre">Без вписан ЗМИП ДС</span>' : ''}${g.hasForeignParent ? ' <span class="tag tag-plum">Чуждестр. майка</span>' : ''}</td>
            </tr>`).join('') || `<tr><td colspan="3" class="muted">Всички проверени фирми имат вписани ЗМИП бенефициенти.</td></tr>`}</tbody>
          </table></div>
        </div>
        <div class="panel-box">
          <h3>Архитектура за МИДТ: Автоматичен флаг по чл. 54, ал. 1 ЗОП</h3>
          <div class="contract-row"><strong>Правно основание:</strong> ${esc(sc.legalBasis)}</div>
          <div class="contract-row"><strong>Автоматичен статус при RegiX връзка:</strong> <span class="tag tag-crimson">${esc(sc.automaticFlag)}</span></div>
          <div class="contract-row"><strong>Текущи потвърдени конфликти на интереси (СИГМА):</strong> <strong>${m6.ownInstitutionConflicts}</strong> директни самовъзлагания + <strong>26</strong> пропуснати връзки в XML декларации.</div>
        </div>
      </div>`;
  }

  window.SIGMA3_J6 = {
    ensureJudicial6Loaded,
    loadAndRenderJudicial6,
    applyJudicialRiskWeightsToState,
    getData: () => j6Data,
  };
})();
