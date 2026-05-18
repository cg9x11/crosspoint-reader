function translationProjectPath(projectId) {
    return projectId ? `/translations/${encodeURIComponent(projectId)}` : '/translations';
  }

  function buildLanguageOptions(selectedValue, includeAuto = false) {
    const options = [
      ['ja', 'Japanese (ja)'],
      ['zh', 'Chinese (zh)'],
      ['ko', 'Korean (ko)'],
      ['en', 'English (en)'],
      ['vi', 'Vietnamese (vi)']
    ];
    const rows = includeAuto ? [['', 'Tự nhận diện']] : [];
    return rows.concat(options).map(([value, label]) =>
      `<option value="${escapeHtml(value)}" ${String(selectedValue || '') === value ? 'selected' : ''}>${escapeHtml(label)}</option>`
    ).join('');
  }

  async function loadTranslationProjects(force = false) {
    if (state.translationProjectsLoaded && !force) return state.translationProjects;
    const payload = await apiJson('/api/translations/projects');
    state.translationProjects = Array.isArray(payload.items) ? payload.items : [];
    state.translationProjectsLoaded = true;
    return state.translationProjects;
  }

  async function loadTranslationProjectDetail(projectId) {
    const payload = await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}`);
    state.translationDetail = payload.item || null;
    state.activeTranslationProjectId = payload.item?.id || null;
    return state.translationDetail;
  }

  // ─── Card ────────────────────────────────────────────────────────────────────

  function renderTranslationProjectCard(item) {
    const translated = Number(item._count?.chapterTranslations || 0);
    const total      = Number(item.novel?.downloadedChapters || 0);
    const statusOk   = item.status === 'ready';

    return `
      <article class="t-card" data-translation-project-id="${escapeHtml(item.id)}">

        <div class="t-card-bar"></div>

        <div class="t-card-body">
          <span class="t-card-title">${escapeHtml(item.name || 'Project dịch')}</span>
          <span class="t-card-novel">${escapeHtml(item.novel?.title || '—')}</span>
          <span class="t-card-meta">
            <span class="t-chip-plain">${escapeHtml(item.targetLanguage || 'vi')}</span>
            ${item.isActiveAuto     ? '<span class="t-chip-plain t-chip-green">Auto</span>'     : ''}
            ${item.isDefaultEdition ? '<span class="t-chip-plain t-chip-gold">Mặc định</span>' : ''}
            <span class="t-card-count">${translated}/${total} chap</span>
          </span>
        </div>

        <div class="t-card-actions">
          <span class="t-status-badge ${statusOk ? 't-status-ready' : ''}">${escapeHtml(item.status || 'idle')}</span>
          <button class="btn-ghost t-btn-sm" type="button" data-translation-edit="${escapeHtml(item.id)}">Sửa</button>
          <button class="btn-ghost t-btn-sm t-btn-danger" type="button" data-translation-delete="${escapeHtml(item.id)}">Xóa</button>
        </div>

      </article>
    `;
  }

  function bindTranslationListEvents() {
    $$('[data-translation-project-id]', $id('translations-list')).forEach((item) => {
      item.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        navigateTo(translationProjectPath(item.getAttribute('data-translation-project-id')));
      });
    });
    $$('[data-translation-edit]').forEach((btn) =>
      btn.addEventListener('click', () => void openTranslationProjectConfigModal(btn.getAttribute('data-translation-edit')))
    );
    $$('[data-translation-delete]').forEach((btn) =>
      btn.addEventListener('click', () => void confirmDeleteTranslationProject(btn.getAttribute('data-translation-delete')))
    );
  }

  // ─── Glossary ────────────────────────────────────────────────────────────────

  function buildGlossaryRows(entries) {
    return entries.map((entry, index) => `
      <tr data-glossary-row="${index}">
        <td>
          <select class="form-input" data-field="type">
            <option value="term"  ${(entry.type||'term')==='term'  ?'selected':''}>term</option>
            <option value="name"  ${(entry.type||'term')==='name'  ?'selected':''}>name</option>
            <option value="title" ${(entry.type||'term')==='title' ?'selected':''}>title</option>
            <option value="place" ${(entry.type||'term')==='place' ?'selected':''}>place</option>
          </select>
        </td>
        <td><input class="form-input" data-field="rawName"        value="${escapeHtml(entry.rawName||'')}"></td>
        <td><input class="form-input" data-field="translatedName" value="${escapeHtml(entry.translatedName||'')}"></td>
        <td>
          <select class="form-input" data-field="gender">
            <option value="">-</option>
            <option value="male"    ${entry.gender==='male'    ?'selected':''}>male</option>
            <option value="female"  ${entry.gender==='female'  ?'selected':''}>female</option>
            <option value="neutral" ${entry.gender==='neutral' ?'selected':''}>neutral</option>
            <option value="other"   ${entry.gender==='other'   ?'selected':''}>other</option>
          </select>
        </td>
        <td><input class="form-input" data-field="description" value="${escapeHtml(entry.description||'')}"></td>
        <td>
          <select class="form-input" data-field="locked">
            <option value="false" ${entry.locked?'':'selected'}>mở</option>
            <option value="true"  ${entry.locked?'selected':''}>khóa</option>
          </select>
        </td>
        <td><button class="btn-ghost t-btn-sm t-btn-danger" type="button" data-remove-glossary-row="${index}">✕</button></td>
      </tr>
    `).join('');
  }

  function collectGlossaryRows() {
    return $$('[data-glossary-row]', $id('dynamic-modal-body')).map((row) => ({
      type:           $('[data-field="type"]',           row)?.value || 'term',
      rawName:        $('[data-field="rawName"]',        row)?.value || '',
      translatedName: $('[data-field="translatedName"]', row)?.value || '',
      gender:         $('[data-field="gender"]',         row)?.value || '',
      description:    $('[data-field="description"]',    row)?.value || '',
      locked:        ($('[data-field="locked"]',         row)?.value || 'false') === 'true'
    })).filter((e) => e.rawName && e.translatedName);
  }

  function parseStyleGuideJson(rawValue) {
    try   { return JSON.parse(String(rawValue || '{}')); }
    catch { return {}; }
  }

  function stringifyStyleGuideWithSource(rawStyle, sourceLanguage) {
    const next = parseStyleGuideJson(rawStyle);
    if (sourceLanguage) next.sourceLanguage = sourceLanguage;
    else delete next.sourceLanguage;
    return JSON.stringify(next, null, 2);
  }

  // ─── Glossary editor modal ────────────────────────────────────────────────────

  async function openGlossaryEditor(projectId) {
    const detail  = state.translationDetail?.id === projectId
      ? state.translationDetail
      : await loadTranslationProjectDetail(projectId);
    const active  = detail.glossaries?.find((g) => g.isActive) || detail.glossaries?.[0];
    const entries = (active?.entries || []).map((e) => ({ ...e }));

    showDynamicModal({
      title: `Glossary · ${detail.name}`,
      bodyHtml: `
        <div class="t-modal-wide">

          <div class="t-section-bar">
            <button class="btn-primary t-btn-sm" type="button" id="translation-add-glossary-row">+ Thêm dòng</button>
            <button class="btn-ghost  t-btn-sm" type="button" id="translation-suggest-glossary">✦ AI suggest</button>
          </div>

          <div class="t-table-scroll">
            <table class="translation-table">
              <thead>
                <tr>
                  <th>Type</th><th>Raw</th><th>Translated</th>
                  <th>Gender</th><th>Mô tả</th><th>Lock</th><th></th>
                </tr>
              </thead>
              <tbody id="translation-glossary-body">${buildGlossaryRows(entries)}</tbody>
            </table>
          </div>

        </div>
      `,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Đóng</button>
        <button class="btn-primary" type="button" id="translation-save-glossary">Lưu glossary</button>
      `
    });

    const bindGlossaryButtons = () => {
      $$('[data-remove-row]', $id('translation-glossary-body')).forEach((button) => {
        button.addEventListener('click', () => button.closest('tr')?.remove());
      });
    };

    const collectGlossaryRows = () => $$('tr', $id('translation-glossary-body')).map((row) => ({
      type: row.querySelector('[data-field="type"]')?.value || 'term',
      rawName: row.querySelector('[data-field="rawName"]')?.value || '',
      translatedName: row.querySelector('[data-field="translatedName"]')?.value || '',
      gender: row.querySelector('[data-field="gender"]')?.value || '',
      description: row.querySelector('[data-field="description"]')?.value || '',
      locked: Boolean(row.querySelector('[data-field="locked"]')?.checked)
    }));

    bindGlossaryButtons();
    $id('translation-add-glossary-row')?.addEventListener('click', () => {
      const body = $id('translation-glossary-body');
      body.insertAdjacentHTML('beforeend', buildGlossaryRows([{ type: 'term', rawName: '', translatedName: '', gender: '', description: '', locked: false }]));
      bindGlossaryButtons();
    });
    $id('translation-suggest-glossary')?.addEventListener('click', async () => {
      const payload = await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/glossary/suggest`, { method: 'POST', body: {} });
      const body = $id('translation-glossary-body');
      for (const item of payload.items || []) {
        body.insertAdjacentHTML('beforeend', buildGlossaryRows([{ ...item, locked: false }]));
      }
      bindGlossaryButtons();
    });
    $id('translation-save-glossary')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/glossaries/${encodeURIComponent(active.id)}`, {
        method: 'PATCH',
        body: { entries: collectGlossaryRows() }
      });
      await loadTranslationProjectDetail(projectId);
      renderTranslations();
      closeModal('dynamic-modal');
      showToast('✓', 'Đã lưu glossary', detail.name);
    });
  }

  async function openRuntimeSettingsModal() {
    const settings = await apiJson('/api/translations/settings');
    const primary = (settings.credentials || []).find((item) => item.enabled !== false) || settings.credentials?.[0] || {};
    showDynamicModal({
      title: 'Cấu hình model dịch chung',
      bodyHtml: `
        <label class="form-label">Provider</label>
        <select class="form-input" id="translation-runtime-provider">
          <option value="openai" ${primary.provider === 'openai' ? 'selected' : ''}>openai-compatible</option>
          <option value="gemini" ${primary.provider === 'gemini' ? 'selected' : ''}>gemini</option>
        </select>
        <label class="form-label" style="margin-top:12px;">Base URL</label>
        <input class="form-input" id="translation-runtime-base-url" value="${escapeHtml(primary.baseUrl || '')}" placeholder="https://...">
        <label class="form-label" style="margin-top:12px;">API Key</label>
        <input class="form-input" id="translation-runtime-api-key" value="${escapeHtml(primary.apiKey || '')}" placeholder="sk-...">
        <label class="form-label" style="margin-top:12px;">Model mặc định</label>
        <input class="form-input" id="translation-runtime-model" value="${escapeHtml(primary.modelHint || '')}" placeholder="gpt-4.1-mini">
        <label class="form-label" style="margin-top:12px;">Runtime JSON</label>
        <textarea class="form-input" id="translation-runtime-config" rows="8">${escapeHtml(JSON.stringify(settings.runtime || {}, null, 2))}</textarea>
      `,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Đóng</button>
        <button class="btn-ghost" type="button" id="translation-runtime-test">Test kết nối</button>
        <button class="btn-primary" type="button" id="translation-runtime-save">Lưu</button>
      `
    });

    $id('translation-runtime-test')?.addEventListener('click', async () => {
      const button = $id('translation-runtime-test');
      const originalLabel = button?.textContent || 'Test kết nối';
      try {
        if (button) {
          button.disabled = true;
          button.textContent = 'Đang test...';
        }
        const runtime = JSON.parse($id('translation-runtime-config').value || '{}');
        const result = await apiJson('/api/translations/settings/test', {
          method: 'POST',
          body: {
            provider: $id('translation-runtime-provider').value || 'openai',
            baseUrl: $id('translation-runtime-base-url').value?.trim(),
            apiKey: $id('translation-runtime-api-key').value?.trim(),
            modelHint: $id('translation-runtime-model').value?.trim() || 'gpt-4.1-mini',
            runtime
          }
        });
        showToast('✓', 'Kết nối model thành công', `${result.latencyMs || 0} ms`);
      } catch (error) {
        showToast('!', 'Test kết nối thất bại', error instanceof Error ? error.message : 'Không rõ lỗi');
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    });

    $id('translation-runtime-save')?.addEventListener('click', async () => {
      await apiJson('/api/translations/settings', {
        method: 'PATCH',
        body: {
          credentials: [{
            provider: $id('translation-runtime-provider').value || 'openai',
            label: 'default',
            apiKey: $id('translation-runtime-api-key').value?.trim(),
            baseUrl: $id('translation-runtime-base-url').value?.trim(),
            modelHint: $id('translation-runtime-model').value?.trim(),
            enabled: true
          }],
          runtime: JSON.parse($id('translation-runtime-config').value || '{}')
        }
      });
      closeModal('dynamic-modal');
      showToast('✓', 'Đã lưu cấu hình dịch', 'Project mới sẽ dùng model chung này');
    });
  }

  // ─── Create project modal ─────────────────────────────────────────────────────

  async function openCreateTranslationProjectModal() {
    await loadLibrary();
    const settings = await apiJson('/api/translations/settings');
    const primary  = (settings.credentials || []).find((c) => c.enabled !== false) || settings.credentials?.[0] || {};
    const options  = state.libraryItems.map((item) =>
      `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`
    ).join('');

    showDynamicModal({
      title: 'Tạo project dịch',
      bodyHtml: `
        <div class="t-form-grid">

          <div class="t-form-col">
            <label class="form-label">Truyện</label>
            <select class="form-input" id="translation-project-novel">${options}</select>

            <label class="form-label">Tên project</label>
            <input  class="form-input" id="translation-project-name" placeholder="Ví dụ: Việt hóa đọc mượt">

            <div class="t-form-row">
              <div>
                <label class="form-label">Ngôn ngữ đích</label>
                <select class="form-input" id="translation-project-language">${buildLanguageOptions('vi')}</select>
              </div>
              <div>
                <label class="form-label">Ngôn ngữ nguồn</label>
                <select class="form-input" id="translation-project-source-language">${buildLanguageOptions('ja', true)}</select>
              </div>
            </div>

            <p class="form-hint t-model-hint">
              Model chung:
              <strong>${escapeHtml(primary.provider || 'chưa cấu hình')}</strong>
              ·
              <strong>${escapeHtml(primary.modelHint || 'chưa cấu hình')}</strong>
            </p>
          </div>

          <div class="t-form-col">
            <label class="form-label">Style JSON</label>
            <textarea class="form-input t-textarea-code" id="translation-project-style" rows="7">{
  "tone": "natural",
  "register": "readable",
  "hanVietLevel": "medium",
  "pronouns": "contextual"
}</textarea>

            <div class="t-checkbox-group">
              <label class="t-checkbox-label"><input type="checkbox" id="translation-project-auto"> Auto chap mới</label>
              <label class="t-checkbox-label"><input type="checkbox" id="translation-project-active"  checked> Active auto</label>
              <label class="t-checkbox-label"><input type="checkbox" id="translation-project-default" checked> Edition mặc định</label>
            </div>
          </div>

        </div>
      `,
      footerHtml: `
        <button class="btn-ghost"   type="button" data-close="dynamic-modal">Hủy</button>
        <button class="btn-primary" type="button" id="translation-project-save">Tạo project</button>
      `
    });

    $id('translation-project-save')?.addEventListener('click', async () => {
      const body = {
        novelId:                   $id('translation-project-novel').value,
        name:                      $id('translation-project-name').value || 'Bản dịch mới',
        targetLanguage:            $id('translation-project-language').value || 'vi',
        styleGuideJson:            stringifyStyleGuideWithSource(
                                     $id('translation-project-style').value || '{}',
                                     $id('translation-project-source-language').value?.trim()
                                   ),
        autoTranslateNewChapters:  $id('translation-project-auto').checked,
        isActiveAuto:              $id('translation-project-active').checked,
        isDefaultEdition:          $id('translation-project-default').checked
      };
      const payload = await apiJson('/api/translations/projects', { method: 'POST', body });
      state.translationProjectsLoaded = false;
      await loadTranslationProjects(true);
      closeModal('dynamic-modal');
      showToast('✓', 'Đã tạo project dịch', payload.item?.name || body.name);
      navigateTo(translationProjectPath(payload.item?.id));
    });
  }

  // ─── Edit project modal ────────────────────────────────────────────────────────

  async function openTranslationProjectConfigModal(projectId) {
    const detail = state.translationDetail?.id === projectId
      ? state.translationDetail
      : await loadTranslationProjectDetail(projectId);
    const style  = parseStyleGuideJson(detail.styleGuideJson || '{}');

    showDynamicModal({
      title: `Sửa project · ${detail.name}`,
      bodyHtml: `
        <div class="t-form-grid">

          <div class="t-form-col">
            <label class="form-label">Tên project</label>
            <input class="form-input" id="translation-config-name" value="${escapeHtml(detail.name)}">

            <div class="t-form-row">
              <div>
                <label class="form-label">Ngôn ngữ đích</label>
                <select class="form-input" id="translation-config-language">${buildLanguageOptions(detail.targetLanguage || 'vi')}</select>
              </div>
              <div>
                <label class="form-label">Ngôn ngữ nguồn</label>
                <select class="form-input" id="translation-config-source-language">${buildLanguageOptions(style.sourceLanguage || '', true)}</select>
              </div>
            </div>

            <div class="t-checkbox-group">
              <label class="t-checkbox-label"><input type="checkbox" id="translation-config-auto"    ${detail.autoTranslateNewChapters?'checked':''}> Auto chap mới</label>
              <label class="t-checkbox-label"><input type="checkbox" id="translation-config-active"  ${detail.isActiveAuto       ?'checked':''}> Active auto</label>
              <label class="t-checkbox-label"><input type="checkbox" id="translation-config-default" ${detail.isDefaultEdition   ?'checked':''}> Edition mặc định</label>
            </div>
          </div>

          <div class="t-form-col">
            <label class="form-label">Style JSON</label>
            <textarea class="form-input t-textarea-code" id="translation-config-style" rows="5">${escapeHtml(detail.styleGuideJson || '{}')}</textarea>

            <label class="form-label">System prompt</label>
            <textarea class="form-input" id="translation-config-prompt" rows="5">${escapeHtml(detail.systemPrompt || '')}</textarea>
          </div>

        </div>
      `,
      footerHtml: `
        <button class="btn-ghost"   type="button" data-close="dynamic-modal">Đóng</button>
        <button class="btn-primary" type="button" id="translation-config-save">Lưu thay đổi</button>
      `
    });

    $id('translation-config-save')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(detail.id)}`, {
        method: 'PATCH',
        body: {
          name:                     $id('translation-config-name').value,
          targetLanguage:           $id('translation-config-language').value || 'vi',
          styleGuideJson:           stringifyStyleGuideWithSource(
                                      $id('translation-config-style').value || '{}',
                                      $id('translation-config-source-language').value?.trim()
                                    ),
          systemPrompt:             $id('translation-config-prompt').value,
          autoTranslateNewChapters: $id('translation-config-auto').checked,
          isActiveAuto:             $id('translation-config-active').checked,
          isDefaultEdition:         $id('translation-config-default').checked
        }
      });
      await loadTranslationProjects(true);
      await loadTranslationProjectDetail(detail.id);
      renderTranslations();
      closeModal('dynamic-modal');
      showToast('✓', 'Đã lưu project', detail.name);
    });
  }

  // ─── Delete confirm ───────────────────────────────────────────────────────────

  async function confirmDeleteTranslationProject(projectId) {
    const detail = state.translationProjects.find((p) => p.id === projectId) || state.translationDetail;
    showConfirmModal({
      title:        'Xóa project dịch',
      message:      `Xóa "${detail?.name || 'project'}"? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa project',
      confirmTone:  'danger',
      onConfirm: async () => {
        await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
        state.translationProjectsLoaded = false;
        state.translationDetail = state.translationDetail?.id === projectId ? null : state.translationDetail;
        await loadTranslationProjects(true);
        renderTranslations();
        if (state.activeTranslationProjectId === projectId) navigateTo('/translations');
        showToast('✓', 'Đã xóa project', detail?.name || projectId);
      }
    });
  }

  // ─── Chapter rows ─────────────────────────────────────────────────────────────

  function buildTranslationChapterRows(detail) {
    if (!(detail.chapterTranslations || []).length) {
      return `<tr><td colspan="5" class="t-empty-row">Chưa có chapter nào</td></tr>`;
    }
    return detail.chapterTranslations.map((item) => {
      const published = item.currentPublishedVersionId ? '✓' : '—';
      const statusCls = item.status === 'done' ? 't-ch-done' : item.status === 'error' ? 't-ch-error' : '';
      return `
        <tr class="${statusCls}">
          <td class="t-ch-index">${String(item.chapter?.chapterIndex || '').padStart(3, '0')}</td>
          <td class="t-ch-title">${escapeHtml(item.chapter?.title || '')}</td>
          <td><span class="t-status-pill t-status-${escapeHtml(item.status||'idle')}">${escapeHtml(item.status || 'idle')}</span></td>
          <td class="t-ch-pub">${published}</td>
          <td>
            <div class="t-row-actions">
              <button class="btn-ghost t-btn-sm" type="button" data-translation-open-chapter="${escapeHtml(item.id)}">Mở</button>
              <button class="btn-ghost t-btn-sm" type="button" data-translation-retranslate-chapter="${escapeHtml(item.id)}">↺ Dịch chap</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ─── Detail panel ─────────────────────────────────────────────────────────────

  function renderTranslationDetail(detail) {
    const container = $id('translations-detail');
    if (!detail) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    const activeGlossary = detail.glossaries?.find((g) => g.isActive) || detail.glossaries?.[0];
    const translated     = Number(detail._count?.chapterTranslations || detail.chapterTranslations?.length || 0);
    const total          = Number(detail.novel?.downloadedChapters || 0);
    const pct            = total > 0 ? Math.round((translated / total) * 100) : 0;
    const style          = parseStyleGuideJson(detail.styleGuideJson || '{}');
    const sourceLanguage = style.sourceLanguage || '';
    const progressLabel  = total > 0 ? `${translated} / ${total}` : String(translated);
    const statusOk       = detail.status === 'ready';

    container.style.display = 'block';
    container.innerHTML = `
      <div class="t-detail-layout">

        <!-- ── Header card ────────────────────────────── -->
        <section class="t-panel t-panel-hero">
          <div class="t-hero-top">
            <div>
              <h2 class="t-hero-title">${escapeHtml(detail.name)}</h2>
              <p class="t-hero-novel">${escapeHtml(detail.novel?.title || '—')}</p>
              <div class="t-chip-row">
                <span class="translation-chip">→ ${escapeHtml(detail.targetLanguage || 'vi')}</span>
                ${sourceLanguage ? `<span class="translation-chip">← ${escapeHtml(sourceLanguage)}</span>` : ''}
                ${detail.provider  ? `<span class="translation-chip">${escapeHtml(detail.provider)}</span>`  : ''}
                ${detail.model     ? `<span class="translation-chip t-chip-mono">${escapeHtml(detail.model)}</span>` : ''}
                ${detail.isActiveAuto     ? '<span class="translation-chip t-chip-green">Auto</span>'       : ''}
                ${detail.isDefaultEdition ? '<span class="translation-chip t-chip-gold">Mặc định</span>'   : ''}
              </div>
            </div>
            <span class="t-status-badge ${statusOk ? 't-status-ready' : ''}">${escapeHtml(detail.status || 'idle')}</span>
          </div>

          <!-- progress bar -->
          <div class="t-hero-progress">
            <div class="t-progress-wrap t-progress-lg">
              <div class="t-progress-bar" style="width:${pct}%"></div>
            </div>
            <span class="t-progress-label">${progressLabel} chương · ${pct}%</span>
          </div>

          <!-- stat grid -->
          <div class="t-stat-row">
            <div class="t-stat">
              <span class="s-val">${escapeHtml(progressLabel)}</span>
              <span class="s-lbl">Tiến độ</span>
            </div>
            <div class="t-stat">
              <span class="s-val">${(activeGlossary?.entries || []).length}</span>
              <span class="s-lbl">Glossary</span>
            </div>
            <div class="t-stat">
              <span class="s-val">${escapeHtml(detail.provider || '—')}</span>
              <span class="s-lbl">Provider</span>
            </div>
            <div class="t-stat">
              <span class="s-val t-stat-model">${escapeHtml(detail.model || '—')}</span>
              <span class="s-lbl">Model</span>
            </div>
          </div>

          <!-- action toolbar -->
          <div class="t-action-toolbar">
            <button class="btn-primary t-btn-sm" type="button" id="translation-run-project">▶ Dịch / cập nhật</button>
            <button class="btn-ghost  t-btn-sm" type="button" id="translation-rebuild-project">↺ Rebuild</button>
            <button class="btn-ghost  t-btn-sm" type="button" id="translation-edit-config">Sửa project</button>
            <button class="btn-ghost  t-btn-sm" type="button" id="translation-runtime-settings">Model chung</button>
            <button class="btn-ghost  t-btn-sm" type="button" id="translation-edit-glossary">Glossary</button>
            <div class="t-toolbar-sep"></div>
            <button class="btn-ghost  t-btn-sm" type="button" id="translation-export-epub">↓ EPUB</button>
            <button class="btn-ghost  t-btn-sm" type="button" id="translation-export-txt">↓ TXT</button>
            <button class="btn-ghost  t-btn-sm t-btn-danger" type="button" id="translation-delete-project">Xóa</button>
          </div>
        </section>

        <!-- ── Chapter list ────────────────────────────── -->
        <section class="t-panel">
          <div class="t-panel-header">
            <div>
              <h4 class="t-panel-title">Danh sách chương</h4>
              <p class="translation-muted">Tổng: ${escapeHtml(String(total || detail.chapterTranslations?.length || 0))} chương</p>
            </div>
          </div>

          <div class="t-table-scroll">
            <table class="translation-table">
              <thead>
                <tr><th>#</th><th>Chương</th><th>Trạng thái</th><th>Pub</th><th></th></tr>
              </thead>
              <tbody>${buildTranslationChapterRows(detail)}</tbody>
            </table>
          </div>
        </section>

        <!-- ── Glossary summary ────────────────────────── -->
        <section class="t-panel t-panel-glossary">
          <div class="t-panel-header">
            <div>
              <h4 class="t-panel-title">Glossary đang dùng</h4>
              <p class="translation-muted">
                ${activeGlossary
                  ? `${(activeGlossary.entries||[]).length} mục · v${activeGlossary.version}`
                  : 'Chưa có glossary'}
              </p>
            </div>
            <span class="translation-chip">
              ${sourceLanguage ? `${sourceLanguage} → ${detail.targetLanguage||'vi'}` : `→ ${detail.targetLanguage||'vi'}`}
            </span>
          </div>
        </section>

      </div>
    `;

    // bind detail events
    $id('translation-run-project')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(detail.id)}/start`, { method: 'POST', body: { triggerType: 'manual' } });
      showToast('↻', 'Đã xếp hàng dịch', detail.name);
    });
    $id('translation-rebuild-project')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(detail.id)}/rebuild`, { method: 'POST' });
      showToast('↻', 'Đã xếp hàng rebuild', detail.name);
    });
    $id('translation-edit-config')?.addEventListener('click',    () => void openTranslationProjectConfigModal(detail.id));
    $id('translation-delete-project')?.addEventListener('click', () => void confirmDeleteTranslationProject(detail.id));
    $id('translation-edit-glossary')?.addEventListener('click',  () => void openGlossaryEditor(detail.id));
    $id('translation-runtime-settings')?.addEventListener('click',() => void openRuntimeSettingsModal());
    $id('translation-export-epub')?.addEventListener('click', () => {
      window.open(`/api/library/novels/${encodeURIComponent(detail.novelId)}/editions/${encodeURIComponent(detail.id)}/export.epub`, '_blank', 'noopener,noreferrer');
    });
    $id('translation-export-txt')?.addEventListener('click', () => {
      window.open(`/api/library/novels/${encodeURIComponent(detail.novelId)}/editions/${encodeURIComponent(detail.id)}/export.txt`, '_blank', 'noopener,noreferrer');
    });
    $$('[data-translation-retranslate-chapter]', container).forEach((btn) => {
      btn.addEventListener('click', async () => {
        await apiJson(`/api/translations/projects/${encodeURIComponent(detail.id)}/chapters/${encodeURIComponent(btn.getAttribute('data-translation-retranslate-chapter'))}/retranslate`, { method: 'POST' });
        showToast('↻', 'Đã xếp hàng dịch chap', detail.name);
      });
    });
    $$('[data-translation-open-chapter]', container).forEach((btn) => {
      btn.addEventListener('click', () => void openTranslationChapterEditor(detail.id, btn.getAttribute('data-translation-open-chapter')));
    });
  }

  // ─── Chapter editor modal ─────────────────────────────────────────────────────

  async function openTranslationChapterEditor(projectId, chapterTranslationId) {
    const payload   = await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterTranslationId)}`);
    const detail    = payload.item;
    const published = (detail.versions || []).find((v) => v.id === detail.currentPublishedVersionId) || detail.versions?.[0];

    showDynamicModal({
      title: `Editor · ${detail.chapter?.title || ''}`,
      bodyHtml: `
        <div class="t-editor-shell">

          <!-- version picker -->
          <div class="t-editor-toolbar">
            <select class="form-input t-version-select" id="translation-version-select">
              ${(detail.versions || []).map((v) => `
                <option value="${escapeHtml(v.id)}" ${v.id === detail.currentPublishedVersionId ? 'selected' : ''}>
                  v${v.versionNumber} · ${escapeHtml(v.kind)}${v.isPublished ? ' · ✓ publish' : ''}
                </option>
              `).join('')}
            </select>
            <button class="btn-ghost t-btn-sm" type="button" id="translation-switch-version">Dùng version này</button>
            <button class="btn-ghost t-btn-sm" type="button" id="translation-translate-current-chapter">↺ Dịch chap này</button>
            <button class="btn-ghost t-btn-sm t-btn-danger" type="button" id="translation-delete-version">Xóa version</button>
          </div>

          <!-- dual pane -->
          <div class="t-editor-panes">
            <div class="t-editor-col">
              <p class="t-editor-col-label">Bản gốc</p>
              <div class="t-editor-pane t-editor-pane-readonly">${detail.sourceHtml || ''}</div>
            </div>
            <div class="t-editor-col">
              <p class="t-editor-col-label">Bản dịch hiện tại</p>
              <div class="t-editor-pane" id="translation-editor-pane" contenteditable="true">${published?.html || ''}</div>
            </div>
          </div>

        </div>
      `,
      footerHtml: `
        <button class="btn-ghost"   type="button" data-close="dynamic-modal">Hủy</button>
        <button class="btn-primary" type="button" id="translation-save-editor">Lưu version mới</button>
      `
    });

    $id('translation-save-editor')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterTranslationId)}/versions`, {
        method: 'POST',
        body: { html: $id('translation-editor-pane').innerHTML, publish: true, createdBy: 'web-editor' }
      });
      await loadTranslationProjectDetail(projectId);
      renderTranslations();
      closeModal('dynamic-modal');
      showToast('✓', 'Đã lưu version mới', detail.chapter?.title || 'chapter');
    });

    $id('translation-switch-version')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterTranslationId)}/published-version`, {
        method: 'PATCH',
        body: { versionId: $id('translation-version-select').value }
      });
      await loadTranslationProjectDetail(projectId);
      renderTranslations();
      closeModal('dynamic-modal');
      showToast('✓', 'Đã đổi version publish', detail.chapter?.title || 'chapter');
    });

    $id('translation-delete-version')?.addEventListener('click', async () => {
      const versionId = $id('translation-version-select').value;
      await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterTranslationId)}/versions/${encodeURIComponent(versionId)}`, { method: 'DELETE' });
      await loadTranslationProjectDetail(projectId);
      renderTranslations();
      closeModal('dynamic-modal');
      showToast('✓', 'Đã xóa version', detail.chapter?.title || 'chapter');
    });

    $id('translation-translate-current-chapter')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterTranslationId)}/retranslate`, {
        method: 'POST'
      });
      showToast('↻', 'Đã xếp hàng dịch chap này', detail.chapter?.title || chapterTranslationId);
    });
  }

  // ─── Main render ──────────────────────────────────────────────────────────────

  function renderTranslations() {
    const list  = $id('translations-list');
    const empty = $id('translations-empty');
    list.innerHTML = (state.translationProjects || []).map(renderTranslationProjectCard).join('');
    empty.style.display = state.translationProjects.length ? 'none' : 'block';
    bindTranslationListEvents();
    renderTranslationDetail(state.translationDetail);
  }
