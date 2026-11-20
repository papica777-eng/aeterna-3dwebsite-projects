(() => {
  'use strict';

  const api = () => window.SIGMA3;
  let f7Data = null;
  let f7Loading = null;
  let activeSub = 'annex';
  let f7Wired = false;

  async function ensureForensics7Loaded() {
    if (f7Data) return f7Data;
    if (!f7Loading) {
      f7Loading = fetch('data/sigma3_forensics_7.json')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          f7Data = d;
          if (api() && api().state) api().state.forensics7 = d;
          return d;
        })
        .catch(() => null);
    }
    return f7Loading;
  }

  function wireSubTabs() {
    if (f7Wired) return;
    f7Wired = true;
    const nav = document.getElementById('f7SubTabs');
    if (nav) {
      nav.addEventListener('click', (e) => {
        const b = e.target.closest('[data-f7-sub]');
        if (!b) return;
        activeSub = b.dataset.f7Sub;
        nav.querySelectorAll('.pill').forEach((p) => p.classList.toggle('active', p === b));
        renderActiveSubPanel();
      });
    }
    document.getElementById('f7SearchInput')?.addEventListener('input', () => renderActiveSubPanel());
  }

  async function loadAndRenderForensics7() {
    wireSubTabs();
    const host = document.getElementById('f7BodyHost');
    if (!host) return;
    if (!f7Data) {
      host.innerHTML = `<div class="loading">Зареждане на 7-те криминалистични радара върху 206 907 договора…</div>`;
      await ensureForensics7Loaded();
    }
    if (!f7Data) {
      host.innerHTML = `<div class="loading" style="color:var(--crimson);">Грешка при зареждане на data/sigma3_forensics_7.json.</div>`;
      return;
    }
    renderTopSummaryStrip();
    renderActiveSubPanel();
  }

  function renderTopSummaryStrip() {
    const { fmtEur, fmtInt } = api();
    const el = document.getElementById('f7TopKpiGrid');
    if (!el || !f7Data) return;
    const e1 = f7Data.engine1_annexInflation || {};
    const e2 = f7Data.engine2_shellCompanies || {};
    const e3 = f7Data.engine3_salamiSlicing || {};
    const e4 = f7Data.engine4_politicsAndMedia || {};
    const e5 = f7Data.engine5_timeForensics || {};
    const e6 = f7Data.engine6_cartelGraphs || {};
    const e7 = f7Data.engine7_nlpTailoredSpecs || {};
    el.innerHTML = `
      <div class="kpi-card emphasis"><div class="kpi-label">1. Доказано оскъпяване (Анекси)</div><div class="kpi-val" style="color:var(--crimson);">+${fmtEur(e1.totalInflationEur)}</div><div class="kpi-sub">${e1.withAmendmentsCount} с анекси · ${fmtInt(e1.totalFlaggedInCorpus)} флага</div></div>
      <div class="kpi-card"><div class="kpi-label">2. Новосъздадени / Кухи (ТР)</div><div class="kpi-val">${fmtInt(e2.verifiedShellCount)} фирми</div><div class="kpi-sub">${fmtEur(e2.totalShellEur)} · ${e2.crDeedsAnalyzed} ТР партиди</div></div>
      <div class="kpi-card"><div class="kpi-label">3. Разделяне (Salami Slicing)</div><div class="kpi-val">${fmtInt(e3.nonPharmaClusters)} клъстера</div><div class="kpi-sub">${fmtEur(e3.nonPharmaTotalEur)} под прага (60 дни)</div></div>
      <div class="kpi-card"><div class="kpi-label">4. Партийни PR / Медии (ЕРИК)</div><div class="kpi-val">${fmtInt(e4.partyAgenciesWinningProcurement)} агенции</div><div class="kpi-sub">${fmtEur(e4.partyAgenciesTotalEur)} · ${fmtInt(e4.donorsIndexed)} дарители</div></div>
      <div class="kpi-card"><div class="kpi-label">5. Ное–Дек Дъмпинг / Петък</div><div class="kpi-val">${fmtInt(e5.yearendDumpersCount)} инст.</div><div class="kpi-sub">${fmtInt((e5.fridayHolidayMega || []).length)} пет./дек. мега-дог.</div></div>
      <div class="kpi-card"><div class="kpi-label">6. Картелна ротация и адреси</div><div class="kpi-val">${fmtInt(e6.rotationRingsCount)} пръстена</div><div class="kpi-sub">${e6.sharedAddressesCount} общи адреса · ${e6.sharedPersonsCount} лица</div></div>
      <div class="kpi-card"><div class="kpi-label">7. NLP „Шити“ поръчки</div><div class="kpi-val">${fmtInt(e7.totalHighRiskSpecs)} дог.</div><div class="kpi-sub">${fmtEur(e7.totalHighRiskEur)} марково заключване</div></div>`;
  }

  function renderActiveSubPanel() {
    const host = document.getElementById('f7BodyHost');
    if (!host || !f7Data) return;
    const q = (document.getElementById('f7SearchInput')?.value || '').trim().toLowerCase();
    if (activeSub === 'annex') renderEngine1Annex(host, q);
    else if (activeSub === 'shell') renderEngine2Shell(host, q);
    else if (activeSub === 'salami') renderEngine3Salami(host, q);
    else if (activeSub === 'politics') renderEngine4Politics(host, q);
    else if (activeSub === 'time') renderEngine5Time(host, q);
    else if (activeSub === 'cartels') renderEngine6Cartels(host, q);
    else if (activeSub === 'nlp') renderEngine7Nlp(host, q);
  }

  // ---- ENGINE 1: POST-AWARD INFLATION ----
  function renderEngine1Annex(host, q) {
    const { fmtEur, fmtInt, esc } = api();
    const e1 = f7Data.engine1_annexInflation || {};
    let rows = e1.contracts || [];
    if (q) rows = rows.filter((c) => `${c.authority} ${c.contractor} ${c.subject} ${c.unp} ${c.contractorEik}`.toLowerCase().includes(q));
    const fc = e1.flagCounts || {};
    host.innerHTML = `
      <div class="editorial-note note-crimson">
        <div>
          <strong>1. Анализ на анекси и оскъпяване (Post-Award Inflation):</strong>
          Кръстосана жива проверка директно в <code>sigma.midt.bg/contracts/{id}.json</code>. Разкрива договори, подписани на по-ниска цена и анексирани с <strong>+20% до +142,8%</strong> нагоре (общо доказано оскъпяване <strong>+${fmtEur(e1.totalInflationEur)}</strong>).
          В целия корпус от 206 907 договора: <code>annex_total_suspect</code>: <strong>${fmtInt(fc.annex_total_suspect || 0)}</strong> · <code>annex_suspect</code>: <strong>${fmtInt(fc.annex_suspect || 0)}</strong> · <code>value_low</code>: <strong>${fmtInt(fc.value_low || 0)}</strong>.
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>№</th><th>Възложител / Предмет / УНП</th><th>Изпълнител</th>
            <th class="num">Подписана (€)</th><th class="num">Крайна (€)</th><th class="num">Оскъпяване</th><th>Жив одит</th>
          </tr></thead>
          <tbody>
            ${rows.map((c, idx) => `<tr>
              <td class="mono muted">${idx + 1}</td>
              <td>
                <a href="#" data-open-authority="${esc(c.authorityEik)}"><strong>${esc(c.authority)}</strong></a>
                <div class="inst-line">${esc(c.subject)}</div>
                <div class="inst-line mono">УНП ${esc(c.unp)} · ${esc(c.signedAt)} · ${c.bids ? c.bids + ' оферти' : esc(c.procedure)}</div>
              </td>
              <td>
                <a href="#" data-open-company="${esc(c.contractorEik || c.contractor)}">${esc((c.contractor || '').slice(0, 68))}</a>
                ${c.amendmentCount > 0 ? `<div class="badges"><span class="tag tag-ochre">${c.amendmentCount} анекса</span>${c.suspect ? '<span class="tag tag-crimson">SUSPECT</span>' : ''}</div>` : `<div class="badges"><span class="tag tag-crimson">${esc(c.valueFlag)}</span></div>`}
              </td>
              <td class="num">${fmtEur(c.signingEur)}</td>
              <td class="num" style="font-weight:700;">${fmtEur(c.currentEur)}</td>
              <td class="num">
                ${c.inflationEur > 0 ? `<strong style="color:var(--crimson);">+${fmtEur(c.inflationEur)}</strong><div class="inst-line"><span class="tag ${c.inflationPct >= 25 ? 'tag-crimson' : 'tag-ochre'}">+${c.inflationPct}%</span></div>` : `<span class="muted">${esc(c.valueFlag)}</span>`}
              </td>
              <td><button type="button" class="btn btn-oracle" style="padding:3px 8px;font-size:11px;" data-inspect-contract="${esc(c.id)}">Жив JSON ↗</button></td>
            </tr>`).join('') || `<tr><td colspan="7" class="loading">Няма съвпадения за филтъра.</td></tr>`}
          </tbody>
        </table>
      </div>`;
  }

  // ---- ENGINE 2: SHELL & NEWLY-FORMED COMPANIES ----
  function renderEngine2Shell(host, q) {
    const { fmtEur, fmtInt, esc, riskBadgeHtml } = api();
    const e2 = f7Data.engine2_shellCompanies || {};
    let rows = e2.companies || [];
    if (q) rows = rows.filter((c) => `${c.name} ${c.eik} ${c.topAuthority} ${(c.owners || []).join(' ')} ${(c.managers || []).join(' ')}`.toLowerCase().includes(q));
    host.innerHTML = `
      <div class="editorial-note note-plum">
        <div>
          <strong>2. Засичане на „кухи“ и новосъздадени фирми (Shell Companies · Жив Търговски регистър):</strong>
          Автоматично кръстосване на точната <strong>дата на учредяване (<code>CR_F_1_L</code>)</strong>, <strong>вписан капитал (<code>CR_F_31_L</code>)</strong> и <strong>обявени ГФО (<code>CR_F_1001_L</code>)</strong> от <code>portal.registryagency.bg</code> срещу спечелените милиони в ЦАИС ЕОП.
          Индикатор: фирма с минимален капитал печели мултимилионна поръчка месеци след учредяването си.
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>№</th><th>Компания (ЕИК) и собственици (ТР)</th><th>Учредена / 1-ви дог.</th>
            <th class="num">Капитал (ТР)</th><th class="num">Спечелено (€)</th><th class="num">Поръчки / Капитал</th><th class="num">Shell Риск</th>
          </tr></thead>
          <tbody>
            ${rows.map((c, idx) => `<tr data-open-company="${esc(c.eik)}">
              <td class="mono muted">${idx + 1}</td>
              <td>
                <span class="official-name">${esc(c.name)}</span>
                <div class="inst-line mono">ЕИК ${esc(c.eik)} · ${esc(c.seatCity || 'България')} · ГФО в ТР: <strong>${c.gfoCount}</strong></div>
                <div class="inst-line">Собственик/МОЛ: ${esc((c.owners && c.owners.length ? c.owners : c.managers || []).join('; ').slice(0, 110))}</div>
                <div class="inst-line muted">Топ възл.: ${esc(c.topAuthority)}</div>
              </td>
              <td class="mono">
                <div><strong>${esc(c.incorpDate)}</strong> &rarr; ${esc(c.firstContractDate)}</div>
                <div class="badges"><span class="tag ${c.daysToFirstContract <= 180 ? 'tag-crimson' : c.daysToFirstContract <= 365 ? 'tag-ochre' : 'tag-slate'}">${fmtInt(c.daysToFirstContract)} дни до 1-ви договор</span></div>
              </td>
              <td class="num">${esc(c.capitalRaw || (c.capitalEur != null ? fmtEur(c.capitalEur) : '—'))}</td>
              <td class="num" style="font-weight:700;color:var(--crimson);">${fmtEur(c.totalEur)}<div class="inst-line">${c.contracts} дог. · ${c.singleOfferPct}% с 1 оф.</div></td>
              <td class="num mono">${c.wonToCapitalRatio ? `<strong>${fmtInt(c.wonToCapitalRatio)}×</strong>` : '—'}</td>
              <td class="num">${riskBadgeHtml(c.shellScore)}</td>
            </tr>`).join('') || `<tr><td colspan="7" class="loading">Няма намерени фирми.</td></tr>`}
          </tbody>
        </table>
      </div>`;
  }

  // ---- ENGINE 3: SALAMI SLICING ----
  function renderEngine3Salami(host, q) {
    const { fmtEur, fmtInt, esc } = api();
    const e3 = f7Data.engine3_salamiSlicing || {};
    let rows = e3.clusters || [];
    if (q) rows = rows.filter((c) => `${c.authority} ${c.contractor} ${c.authorityEik} ${c.contractorEik} ${c.sector}`.toLowerCase().includes(q));
    host.innerHTML = `
      <div class="editorial-note">
        <div>
          <strong>3. Разделяне на поръчки под прага (Salami Slicing — 60-дневни прозорци):</strong>
          Плъзгащ се 60-дневен алгоритъм върху всички 206 907 договора откри <strong>${fmtInt(e3.totalClusters)} клъстера</strong> (<strong>${fmtInt(e3.nonPharmaClusters)}</strong> в строителство/услуги/доставки извън лекарства за <strong>${fmtEur(e3.nonPharmaTotalEur)}</strong>), при които една институция възлага &ge;3 малки договора под прага (€138 050 СМР / €35 790 услуги) на един и същ изпълнител в един CPV код, надхвърляйки прага за открита процедура.
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>№</th><th>Възложител &rarr; Изпълнител (CPV)</th><th>Период и брой договори</th>
            <th class="num">Макс. 1 дог. (€)</th><th class="num">Общо в прозореца (€)</th><th class="num">Множител праг</th><th>Примери (Жив JSON)</th>
          </tr></thead>
          <tbody>
            ${rows.map((c, idx) => `<tr>
              <td class="mono muted">${idx + 1}</td>
              <td>
                <a href="#" data-open-authority="${esc(c.authorityEik)}"><strong>${esc(c.authority)}</strong></a>
                <div class="inst-line">&rarr; <a href="#" data-open-company="${esc(c.contractorEik)}">${esc(c.contractor)}</a> <span class="mono">(ЕИК ${esc(c.contractorEik)} · CPV ${esc(c.sector)})</span></div>
              </td>
              <td>
                <div class="mono"><strong>${c.contractCount} дог. за ${c.spanDays} дни</strong></div>
                <div class="inst-line mono">${esc(c.startDate)} – ${esc(c.endDate)}</div>
                <div class="badges">
                  ${c.singleOfferCount > 0 ? `<span class="tag tag-crimson">${c.singleOfferCount}/${c.contractCount} с 1 оферта</span>` : ''}
                  ${c.nonOpenCount > 0 ? `<span class="tag tag-ochre">${c.nonOpenCount} неконкурентни</span>` : ''}
                </div>
              </td>
              <td class="num muted">${fmtEur(c.maxSingleEur)}<div class="inst-line">праг ${fmtEur(c.thresholdEur)}</div></td>
              <td class="num" style="font-weight:700;color:var(--crimson);">${fmtEur(c.totalEur)}</td>
              <td class="num"><span class="tag ${c.thresholdRatio >= 3 ? 'tag-crimson' : 'tag-ochre'}">${c.thresholdRatio}× прага</span></td>
              <td style="max-width:280px;">
                ${(c.samples || []).slice(0, 2).map((s) => `<div style="font-size:11px;margin-bottom:3px;"><button class="btn" style="padding:1px 5px;font-size:10px;" data-inspect-contract="${esc(s.id)}">${esc(s.date)} · ${fmtEur(s.valueEur)}</button> ${esc(s.subject.slice(0, 52))}…</div>`).join('')}
              </td>
            </tr>`).join('') || `<tr><td colspan="7" class="loading">Няма съвпадения.</td></tr>`}
          </tbody>
        </table>
      </div>`;
  }

  // ---- ENGINE 4: POLITICAL DONATIONS (ERIK) & MEDIA PAYMENTS ----
  function renderEngine4Politics(host, q) {
    const { fmtEur, fmtInt, esc } = api();
    const e4 = f7Data.engine4_politicsAndMedia || {};
    let agencies = e4.partyAgencies || [];
    let donors = e4.donorMatches || [];
    let mediaRec = e4.topMediaRecipients || [];
    let mediaPay = e4.topMediaPayers || [];
    if (q) {
      agencies = agencies.filter((x) => `${x.name} ${x.eik} ${(x.parties || []).join(' ')} ${x.topAuthority}`.toLowerCase().includes(q));
      donors = donors.filter((x) => `${x.donor} ${x.party} ${x.institution} ${(x.companies || []).join(' ')}`.toLowerCase().includes(q));
      mediaRec = mediaRec.filter((x) => `${x.name} ${x.eik}`.toLowerCase().includes(q));
      mediaPay = mediaPay.filter((x) => `${x.name} ${x.eik}`.toLowerCase().includes(q));
    }
    host.innerHTML = `
      <div class="editorial-note note-plum">
        <div>
          <strong>4. Кръстосване с политически дарения (Сметна палата ЕРИК 2023–2026) и медийни плащания:</strong>
          Извлечени на живо от <code>erik.bulnao.government.bg</code> за <strong>${e4.electionsScanned} национални и местни избори (2023–2026)</strong>:
          <strong>${fmtInt(e4.donorsIndexed)} политически дарители</strong> и <strong>${fmtInt(e4.partyAgenciesIndexed)} партийни PR/медийни/социологически договори</strong>.
          Открити са <strong>${fmtInt(e4.partyAgenciesWinningProcurement)} партийни медийни/PR агенции</strong>, спечелили <strong>${fmtEur(e4.partyAgenciesTotalEur)}</strong> обществени поръчки, и <strong>${fmtInt(e4.mediaContractsCount)} медийни договора</strong> на общини/министерства за <strong>${fmtEur(e4.mediaTotalEur)}</strong> (<strong>${e4.mediaSingleOfferPct}%</strong> с 1 оферта).
        </div>
      </div>

      ${donors.length ? `<div class="panel-box" style="margin-bottom:16px;">
        <h3>Точни 3-именни съвпадения: Политически дарители (ЕРИК) &times; Длъжностни лица / Собственици по ТР (${donors.length})</h3>
        <div class="table-wrap" style="border:none;"><table>
          <thead><tr><th>Дарител / Партия / Избори</th><th>Дарение (лв.)</th><th>Връзка (СИГМА / ТР)</th><th class="num">Общо поръчки (€)</th><th class="num">До 12 мес. след дарението</th><th>Декларация</th></tr></thead>
          <tbody>${donors.map((d) => `<tr>
            <td><strong>${esc(d.donor)}</strong><div class="inst-line">${esc(d.party)} · ${esc(d.election)} (${esc(d.donationDate)})</div></td>
            <td class="mono">${fmtInt(d.donationBgn)} лв.</td>
            <td><span class="tag tag-plum">${esc(d.matchKind)}</span><div class="inst-line">${esc((d.companies || []).join(', ') || d.institution)}</div></td>
            <td class="num">${fmtEur(d.totalWonEur)}</td>
            <td class="num" style="color:${d.post12mEur > 0 ? 'var(--crimson)' : 'var(--ink-muted)'};font-weight:700;">${d.post12mEur > 0 ? fmtEur(d.post12mEur) + ' (' + d.post12mCnt + ')' : '—'}</td>
            <td><a href="${esc(d.declUrl)}" target="_blank" rel="noopener" class="mono">ЕРИК ↗</a></td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>` : `<div class="contract-row" style="margin-bottom:14px;border-left:3px solid var(--teal);"><strong>Нулев фалшив позитив (Zero-False-Positive Lock):</strong> Сканирани са всички <strong>${fmtInt(e4.donorsIndexed)}</strong> дарители от ЕРИК по строг 3-именен ключ срещу 571-те лица от СИГМА и проверените ТР партиди — без необосновани съвпадения по омоними. При интеграция с RegiX (ЕГН хеш) МИДТ може да кръстосва всички 17 428 фирми в реално време.</div>`}

      <div class="panel-box" style="margin-bottom:16px;">
        <h3>Партийни PR, рекламни и медийни агенции (ЕРИК), спечелили обществени поръчки (Топ ${agencies.length} от ${e4.partyAgenciesWinningProcurement})</h3>
        <div class="table-wrap" style="border:none;max-height:460px;overflow-y:auto;">
          <table>
            <thead><tr><th>№</th><th>Агенция (ЕИК) и тип</th><th>Обслужвани партии / коалиции (ЕРИК)</th><th class="num">Общо ЗОП (€)</th><th class="num">До 12 мес. след избори</th><th class="num">1 оферта</th></tr></thead>
            <tbody>${agencies.map((a, i) => `<tr data-open-company="${esc(a.eik)}">
              <td class="mono muted">${i + 1}</td>
              <td><strong>${esc(a.name)}</strong><div class="inst-line mono">ЕИК ${esc(a.eik)} · ${esc((a.agencyTypes || []).join(', '))}</div><div class="inst-line muted">Топ възл.: ${esc(a.topAuthority)}</div></td>
              <td><div class="badges" style="margin-top:0;">${(a.parties || []).map((p) => `<span class="tag tag-navy">${esc(p.slice(0, 34))}</span>`).join('')}</div></td>
              <td class="num" style="font-weight:700;">${fmtEur(a.totalWonEur)}<div class="inst-line">${a.contracts} дог. / ${a.authorities} възл.</div></td>
              <td class="num" style="color:${a.postElection12mEur > 0 ? 'var(--crimson)' : 'var(--ink-muted)'};font-weight:700;">${a.postElection12mEur > 0 ? fmtEur(a.postElection12mEur) : '—'}</td>
              <td class="num">${a.singleOfferPct}%</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>

      <div class="two-col">
        <div class="panel-box">
          <h3>Топ медии и PR получатели на публични средства</h3>
          <div class="table-wrap" style="border:none;max-height:400px;overflow-y:auto;"><table>
            <thead><tr><th>№</th><th>Медия / Агенция</th><th class="num">Общо (€)</th><th class="num">1 оф.</th></tr></thead>
            <tbody>${mediaRec.map((m, i) => `<tr data-open-company="${esc(m.eik || m.name)}">
              <td class="mono muted">${i + 1}</td>
              <td><strong>${esc(m.name)}</strong> ${m.partyClient ? '<span class="tag tag-crimson">Партиен клиент ЕРИК</span>' : ''}<div class="inst-line mono">${m.eik ? 'ЕИК ' + esc(m.eik) : ''} · ${m.contracts} дог. / ${m.authorities} възл.</div></td>
              <td class="num" style="font-weight:700;">${fmtEur(m.eur)}</td>
              <td class="num">${m.singleOfferPct}%</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="panel-box">
          <h3>Топ институции, плащащи за медийно обслужване и PR</h3>
          <div class="table-wrap" style="border:none;max-height:400px;overflow-y:auto;"><table>
            <thead><tr><th>№</th><th>Възложител</th><th class="num">Общо (€)</th><th class="num">1 оф.</th></tr></thead>
            <tbody>${mediaPay.map((m, i) => `<tr data-open-authority="${esc(m.eik)}">
              <td class="mono muted">${i + 1}</td>
              <td><strong>${esc(m.name)}</strong><div class="inst-line mono">ЕИК ${esc(m.eik)} · ${m.contracts} договора</div></td>
              <td class="num" style="font-weight:700;">${fmtEur(m.eur)}</td>
              <td class="num">${m.singleOfferPct}%</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>`;
  }

  // ---- ENGINE 5: TIME-SERIES FORENSICS ----
  function renderEngine5Time(host, q) {
    const { fmtEur, fmtInt, esc } = api();
    const e5 = f7Data.engine5_timeForensics || {};
    const wd = e5.weekdays || [];
    const dec = e5.dec20_31 || {};
    let dumpers = e5.yearendDumpers || [];
    let megas = e5.fridayHolidayMega || [];
    if (q) {
      dumpers = dumpers.filter((x) => `${x.name} ${x.eik}`.toLowerCase().includes(q));
      megas = megas.filter((x) => `${x.authority} ${x.contractor} ${x.subject} ${x.dayTag}`.toLowerCase().includes(q));
    }
    const maxWd = Math.max(...wd.map((d) => d.valueEur), 1);
    const barChartHtml = `<div class="bar-list">${wd.map((d, idx) => {
      const pct = Math.max(2, (d.valueEur / maxWd) * 100);
      const col = idx >= 4 ? '#dc2626' : '#1e3a8a';
      return `<div class="bar-row" style="cursor:default;">
        <div class="bar-top"><span><strong>${esc(d.day)}</strong> <span class="muted">(${fmtInt(d.contracts)} дог. · ${d.singleOfferPct}% с 1 оф.)</span></span><span class="mono" style="font-weight:700;">${fmtEur(d.valueEur)}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${col};"></div></div>
      </div>`;
    }).join('')}</div>`;

    host.innerHTML = `
      <div class="two-col" style="margin-bottom:16px;">
        <div class="panel-box">
          <h3>Подписване по дни от седмицата (2020–2026 · 206 907 договора)</h3>
          <p class="chart-caption">Петък, събота и неделя са маркирани в червено — засичане на „петъчно/празнично“ възлагане на договори с ограничена публичност.</p>
          ${barChartHtml}
        </div>
        <div class="panel-box">
          <h3>Коледен „Бюджетен дъмпинг“ (20–31 декември · 2020–2025)</h3>
          <div class="kpi-grid" style="grid-template-columns:1fr 1fr;margin-bottom:12px;">
            <div class="kpi-card emphasis"><div class="kpi-label">Обем 20–31 декември</div><div class="kpi-val" style="color:var(--crimson);">${fmtEur(dec.valueEur)}</div><div class="kpi-sub">${fmtInt(dec.contracts)} договора за 12-дневния прозорец</div></div>
            <div class="kpi-card"><div class="kpi-label">1 оферта / Пряко (20–31 дек.)</div><div class="kpi-val">${dec.singleOfferPct}%</div><div class="kpi-sub">${fmtInt(dec.singleOffer)} с 1 оферта · ${fmtInt(dec.directAward)} директни</div></div>
          </div>
          <p class="chart-caption" style="margin-bottom:0;">
            В края на бюджетната година (ноември–декември) <strong>${e5.yearendDumpersCount} институции</strong> изразходват <strong>&ge;32%</strong> от целия си 5-годишен бюджет (2021–2025) само в последните 2 месеца (нормално разпределение: 16,7%, коефициент на скок 2,5× до 10×).
          </p>
        </div>
      </div>
      <div class="two-col">
        <div class="panel-box">
          <h3>Топ 50 „Усвоители в края на годината“ (Ноември–Декември 2021–2025)</h3>
          <div class="table-wrap" style="border:none;max-height:450px;overflow-y:auto;"><table>
            <thead><tr><th>№</th><th>Възложител</th><th class="num">Ное–Дек (€)</th><th class="num">Дял %</th><th class="num">Скок</th></tr></thead>
            <tbody>${dumpers.map((d, i) => `<tr data-open-authority="${esc(d.eik)}">
              <td class="mono muted">${i + 1}</td>
              <td><strong>${esc(d.name)}</strong><div class="inst-line mono">${d.novDecCnt}/${d.totalCnt} дог. · ${d.novDecSinglePct}% с 1 оф.</div></td>
              <td class="num" style="font-weight:700;">${fmtEur(d.novDecEur)}</td>
              <td class="num"><span class="tag ${d.novDecSharePct >= 50 ? 'tag-crimson' : 'tag-ochre'}">${d.novDecSharePct}%</span></td>
              <td class="num mono"><strong>${d.surgeRatio}×</strong></td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="panel-box">
          <h3>Топ 50 петъчни / уикенд / 20–31 дек. мега-договори (1 оф. / пряко)</h3>
          <div class="table-wrap" style="border:none;max-height:450px;overflow-y:auto;"><table>
            <thead><tr><th>Дата / Етикет</th><th>Възложител &rarr; Изпълнител</th><th class="num">€</th><th>JSON</th></tr></thead>
            <tbody>${megas.map((m) => `<tr>
              <td class="mono" style="white-space:nowrap;">${esc(m.signedAt)}<div><span class="tag ${m.dayTag.includes('декември') ? 'tag-crimson' : 'tag-ochre'}">${esc(m.dayTag)}</span></div></td>
              <td><strong>${esc(m.authority)}</strong><div class="inst-line">&rarr; ${esc(m.contractor)}</div><div class="inst-line muted">${esc(m.subject.slice(0, 80))}</div></td>
              <td class="num" style="font-weight:700;">${fmtEur(m.valueEur)}</td>
              <td><button class="btn" style="padding:2px 6px;font-size:10px;" data-inspect-contract="${esc(m.id)}">JSON</button></td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>`;
  }

  // ---- ENGINE 6: BID ROTATION RINGS + SHARED CR ADDRESS/PERSON CLUSTERS ----
  function renderEngine6Cartels(host, q) {
    const { fmtEur, fmtInt, esc, riskBadgeHtml } = api();
    const e6 = f7Data.engine6_cartelGraphs || {};
    let rings = e6.rotationRings || [];
    let addrs = e6.sharedAddresses || [];
    let persons = e6.sharedPersons || [];
    if (q) {
      rings = rings.filter((r) => `${r.authority} ${r.sector} ${(r.members || []).map((m) => m.name).join(' ')}`.toLowerCase().includes(q));
      addrs = addrs.filter((a) => `${a.address} ${(a.companies || []).map((c) => c.name).join(' ')}`.toLowerCase().includes(q));
      persons = persons.filter((p) => `${p.person} ${(p.companies || []).map((c) => c.name).join(' ')}`.toLowerCase().includes(q));
    }
    const seqColors = { A: '#b91c1c', B: '#1e3a8a', C: '#0d9488', D: '#b45309' };
    host.innerHTML = `
      <div class="editorial-note note-crimson">
        <div>
          <strong>6. Графови алгоритми за скрити картели (Bid Rotation &amp; Shared CR Metadata):</strong>
          Алгоритъмът за ротация на победителите откри <strong>${fmtInt(e6.rotationRingsCount)} пазарни пръстена</strong>, в които 2–4 фирми редовно си разпределят &ge;72% от поръчките на един възложител в един CPV код на ротационен принцип (<code>A &rarr; B &rarr; C &rarr; A</code>) при средно 1,0–1,5 оферти. Долу са кръстосани и <strong>общите адреси на управление</strong> и <strong>общите собственици/управители</strong> от живия Търговски регистър.
        </div>
      </div>

      <div class="panel-box" style="margin-bottom:16px;">
        <h3>Топ ${rings.length} пръстена за ротация на победителите (от общо ${fmtInt(e6.rotationRingsCount)})</h3>
        <div class="table-wrap" style="border:none;max-height:480px;overflow-y:auto;"><table>
          <thead><tr><th>№</th><th>Възложител / CPV</th><th>Редуване на победители (Хронология)</th><th>Участници в пръстена</th><th class="num">Стойност (€)</th><th class="num">Риск</th></tr></thead>
          <tbody>${rings.map((r, i) => `<tr>
            <td class="mono muted">${i + 1}</td>
            <td>
              <a href="#" data-open-authority="${esc(r.authorityEik)}"><strong>${esc(r.authority)}</strong></a>
              <div class="inst-line mono">CPV ${esc(r.sector)} · ${r.ringContracts}/${r.totalContracts} дог. (${r.ringSharePct}%)</div>
              <div class="inst-line">Редуване: <strong>${r.alternationPct}%</strong> · Ср. оферти: <strong>${r.avgBids}</strong></div>
            </td>
            <td>
              <div style="display:flex;gap:3px;flex-wrap:wrap;max-width:170px;">
                ${String(r.sequence || '').split('').map((ch) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;border-radius:3px;font-family:var(--font-mono);font-size:10.5px;font-weight:700;color:#fff;background:${seqColors[ch] || '#475569'};">${ch}</span>`).join('')}
              </div>
            </td>
            <td>
              ${(r.members || []).map((m) => `<div style="font-size:11.5px;margin-bottom:2px;"><span style="display:inline-block;width:15px;height:15px;line-height:15px;text-align:center;border-radius:2px;font-size:10px;font-weight:700;color:#fff;background:${seqColors[m.code] || '#475569'};margin-right:4px;">${m.code}</span><a href="#" data-open-company="${esc(m.eik)}">${esc(m.name.slice(0, 36))}</a> <span class="mono muted">(${m.wins}× · ${fmtEur(m.eur)})</span></div>`).join('')}
            </td>
            <td class="num" style="font-weight:700;">${fmtEur(r.ringEur)}</td>
            <td class="num">${riskBadgeHtml(r.rotationScore)}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>

      <div class="two-col">
        <div class="panel-box">
          <h3>Общ адрес на управление в ТР (${addrs.length} клъстера)</h3>
          ${addrs.map((a) => `<div class="contract-row">
            <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;"><strong>${esc(a.address)}</strong><span class="mono" style="color:var(--crimson);font-weight:700;">${fmtEur(a.combinedEur)}</span></div>
            ${a.companies.map((c) => `<div style="font-size:12px;"><a href="#" data-open-company="${esc(c.eik)}">${esc(c.name)}</a> <span class="mono muted">(ЕИК ${esc(c.eik)} · ${fmtEur(c.wonEur)})</span></div>`).join('')}
          </div>`).join('') || '<div class="muted">Няма съвпадения.</div>'}
        </div>
        <div class="panel-box">
          <h3>Общи собственици / управители в ТР (${persons.length} мрежи)</h3>
          ${persons.map((p) => `<div class="contract-row">
            <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;"><strong style="color:var(--plum);">${esc(p.person)}</strong><span class="mono" style="color:var(--crimson);font-weight:700;">${p.companyCount} фирми · ${fmtEur(p.combinedEur)}</span></div>
            ${p.companies.map((c) => `<div style="font-size:12px;"><a href="#" data-open-company="${esc(c.eik)}">${esc(c.name)}</a> <span class="mono muted">(ЕИК ${esc(c.eik)} · ${fmtEur(c.wonEur)})</span></div>`).join('')}
          </div>`).join('') || '<div class="muted">Няма съвпадения.</div>'}
        </div>
      </div>`;
  }

  // ---- ENGINE 7: NLP TAILORED SPECS + LIVE INTERACTIVE ZOP AUDITOR ----
  const NLP_PRESETS = {
    car: 'Доставка на 4 броя високопроходими служебни автомобили марка Skoda Kodiaq или BMW X3, минимална дължина 4697 мм, максимална дължина 4705 мм, междуосие точно 2791 мм, двигател 1968 куб. см с мощност 193 к.с., оторизиран сервиз в рамките на 5 км от сградата на възложителя и оригинални резервни части от производителя.',
    med: 'Доставка на високотехнологична диагностична апаратура Siemens Magnetom и оригинални консумативи и реактиви Mindray модел BC760, напълно съвместими със съществуващата система в болницата, обслужвана единствено от официален представител с изключителни права по чл. 79 ЗОП.',
    it: 'Надграждане на съществуващ софтуер Oracle и SAP ERP модул с изключителни авторски права, притежавани от единствен изпълнител без аналог, изискващ сертификат ISO 27001, ISO 20000, ISO 22301 и минимум 3 изпълнени идентични договора с министерства през последните 24 месеца.',
  };

  function runClientNlpAudit(text) {
    const out = document.getElementById('nlpLiveAuditResult');
    if (!out) return;
    const raw = (text || '').trim();
    if (!raw) { out.innerHTML = '<span class="muted">Поставете текст на техническа спецификация от ЦАИС ЕОП или изберете демо пример.</span>'; return; }
    const { esc, riskBadgeHtml } = api();

    const rules = [
      { label: 'Конкретна търговска марка (чл. 49, ал. 2 ЗОП)', re: /\b(mercedes|мерцедес|bmw|бмв|skoda|škoda|шкода|volkswagen|фолксваген|toyota|тойота|renault|siemens|сименс|philips|филипс|general electric|oracle|оракъл|sap|microsoft|cisco|dell|lenovo|huawei|apple|canon|xerox|konica minolta|caterpillar|jcb|olympus|mindray|abbott|dräger|roche|bosch)\b/gi, pts: 28 },
      { label: 'Изключителни / авторски права (пряко договаряне)', re: /(изключителн[иа]\s+права|авторск[иа]\s+права|чл\.?\s*79\s*зоп|единствен\s+(изпълнител|доставчик|представител)|без\s+аналог)/gi, pts: 24 },
      { label: 'Оригинални резервни части / съвместимост', re: /(оригиналн[иа]\s+(резервн|консуматив|част)|съвместим[иао]?\s+със?|надграждане\s+на\s+съществуващ|оторизиран\s+сервиз|официален\s+представител)/gi, pts: 18 },
      { label: 'Тясно фиксирани размери / технически параметри („шита“ геометрия)', re: /(\bточно\s+\d+[\d.,]*\s*(?:мм|см|м|к\.с\.|куб\.?\s*см|л\.?|кг)|минималн[ао]\s+дължина\s+\d+[^.,;]{0,40}максималн[ао]\s+дължина\s+\d+|междуосие\s+[^\s,;]{1,18}\s*\d{3,4})/gi, pts: 22 },
      { label: 'Териториално ограничение за сервиз / база', re: /(в\s+рамките\s+на\s+\d+\s*км|на\s+територията\s+на\s+община|сервиз\s+в\s+града)/gi, pts: 15 },
      { label: 'Специфичен модел / продуктов код', re: /\b([A-Z]{2,5}[-\s]?\d{3,5}[A-Z]?|модел\s+["„“]?[A-Za-zА-Яа-я0-9\-]+)/g, pts: 14 },
      { label: 'Натрупване на ограничителни ISO сертификати', re: /(ISO\s*\d{4,5})/gi, pts: 6 },
    ];
    const hasEquiv = /или\s+еквивалент|еквивалентн/i.test(raw);
    let score = 0;
    const hits = [];
    let highlighted = esc(raw);

    rules.forEach((r) => {
      const m = raw.match(r.re);
      if (m && m.length) {
        const add = r.pts === 6 ? Math.min(18, m.length * 6) : r.pts;
        score += add;
        hits.push({ label: r.label, matches: [...new Set(m)].slice(0, 5), pts: add });
        highlighted = highlighted.replace(r.re, (x) => `<mark class="nlp-hl">${x}</mark>`);
      }
    });
    if (!hasEquiv && score >= 28) {
      score += 14;
      hits.push({ label: 'Липсва задължителната клауза „или еквивалентно“ (нарушение на чл. 49, ал. 2 ЗОП!)', matches: ['Липсва „или еквивалент“'], pts: 14 });
    }
    score = Math.min(100, score);
    const verdict = score >= 70 ? 'КРИТИЧЕН РИСК ОТ „ШИТА“ ПОРЪЧКА (нарушение на чл. 49 ЗОП)' : score >= 45 ? 'ВИСОК РИСК ОТ ОГРАНИЧАВАНЕ НА КОНКУРЕНЦИЯТА' : score >= 20 ? 'УМЕРЕН РИСК — изисква експертна проверка' : 'НИСЪК РИСК — неутрална формулировка';

    out.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <strong>Вердикт: ${verdict}</strong>
        <span>NLP Индекс на „шита“ спецификация: ${riskBadgeHtml(score)}</span>
      </div>
      <div class="contract-row" style="line-height:1.65;font-size:13px;">${highlighted}</div>
      <div style="margin-top:8px;">${hits.map((h) => `<div style="font-size:12px;margin-bottom:4px;"><span class="tag tag-crimson">+${h.pts} т.</span> <strong>${esc(h.label)}:</strong> <span class="mono">${esc(h.matches.join(', '))}</span></div>`).join('') || '<span class="tag tag-teal">Не са открити ограничителни клаузи.</span>'}</div>`;
  }

  function renderEngine7Nlp(host, q) {
    const { fmtEur, fmtInt, esc, riskBadgeHtml } = api();
    const e7 = f7Data.engine7_nlpTailoredSpecs || {};
    const brands = e7.brandLeaderboard || [];
    let contracts = e7.topTailoredContracts || [];
    if (q) contracts = contracts.filter((c) => `${c.authority} ${c.contractor} ${c.subject} ${(c.flags || []).join(' ')}`.toLowerCase().includes(q));

    host.innerHTML = `
      <div class="panel-box" style="margin-bottom:16px;border-left:4px solid var(--crimson);">
        <div class="chart-head">
          <div>
            <h3 style="margin:0;border:none;padding:0;">Жив NLP Одитор на технически спецификации (чл. 49 ЗОП)</h3>
            <p class="chart-caption" style="margin-bottom:0;">Поставете произволен текст от тръжна документация в ЦАИС ЕОП за мигновен криминалистичен анализ за „шити“ параметри и марково заключване.</p>
          </div>
          <div class="pill-row">
            <button type="button" class="city-chip" data-nlp-preset="car">Демо: „Шит“ автомобил</button>
            <button type="button" class="city-chip" data-nlp-preset="med">Демо: Болнична апаратура</button>
            <button type="button" class="city-chip" data-nlp-preset="it">Демо: IT монопол (чл. 79)</button>
          </div>
        </div>
        <textarea id="nlpSpecInput" class="search-input" style="width:100%;min-height:86px;margin:8px 0;font-family:var(--font-sans);resize:vertical;" placeholder="Поставете текст от техническа спецификация…">${esc(NLP_PRESETS.med)}</textarea>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <button type="button" class="btn btn-dark" id="btnRunNlpAudit">Сканирай спецификацията (NLP) &rarr;</button>
          <button type="button" class="btn" id="btnClearNlpAudit">Изчисти</button>
        </div>
        <div id="nlpLiveAuditResult"></div>
      </div>

      <div class="two-col">
        <div class="panel-box">
          <h3>Класация на „марково заключване“ в 206 907 договора</h3>
          <p class="chart-caption">Дял на поръчките с <strong>1 оферта</strong>, когато конкретна търговска марка е назована в предмета на договора.</p>
          <div class="table-wrap" style="border:none;max-height:460px;overflow-y:auto;"><table>
            <thead><tr><th>Марка</th><th class="num">Дог.</th><th class="num">1 оферта %</th><th class="num">С 1 оферта (€)</th></tr></thead>
            <tbody>${brands.map((b) => `<tr>
              <td><strong>${esc(b.brand)}</strong></td>
              <td class="num">${fmtInt(b.contracts)}</td>
              <td class="num"><span class="tag ${b.singleOfferPct >= 70 ? 'tag-crimson' : b.singleOfferPct >= 50 ? 'tag-ochre' : 'tag-slate'}">${b.singleOfferPct}%</span></td>
              <td class="num" style="font-weight:700;">${fmtEur(b.singleOfferEur)}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="panel-box">
          <h3>Топ ${contracts.length} договора с критичен NLP индекс (от ${fmtInt(e7.totalHighRiskSpecs)})</h3>
          <div class="table-wrap" style="border:none;max-height:460px;overflow-y:auto;"><table>
            <thead><tr><th>Възложител / Предмет</th><th class="num">€ / Риск</th><th>JSON</th></tr></thead>
            <tbody>${contracts.slice(0, 60).map((c) => `<tr>
              <td>
                <a href="#" data-open-authority="${esc(c.authorityEik)}"><strong>${esc(c.authority)}</strong></a>
                <div class="inst-line">${esc(c.subject)}</div>
                <div class="badges">${(c.flags || []).map((fl) => `<span class="tag tag-crimson">${esc(fl)}</span>`).join('')}${!c.hasEquiv ? '<span class="tag tag-ochre">Без „или еквивалент“</span>' : ''}</div>
              </td>
              <td class="num"><strong>${fmtEur(c.valueEur)}</strong><div>${riskBadgeHtml(c.score)}</div></td>
              <td><button class="btn" style="padding:2px 6px;font-size:10px;" data-inspect-contract="${esc(c.id)}">JSON</button></td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>`;

    document.getElementById('btnRunNlpAudit')?.addEventListener('click', () => runClientNlpAudit(document.getElementById('nlpSpecInput').value));
    document.getElementById('btnClearNlpAudit')?.addEventListener('click', () => { document.getElementById('nlpSpecInput').value = ''; runClientNlpAudit(''); });
    host.querySelectorAll('[data-nlp-preset]').forEach((b) => b.addEventListener('click', () => {
      const txt = NLP_PRESETS[b.dataset.nlpPreset] || '';
      document.getElementById('nlpSpecInput').value = txt;
      runClientNlpAudit(txt);
    }));
    runClientNlpAudit(NLP_PRESETS.med);
  }

  window.SIGMA3_F7 = {
    ensureForensics7Loaded,
    loadAndRenderForensics7,
    getData: () => f7Data,
  };
})();
