  function translationProjectPath(projectId) {
    return projectId ? `/translations/${encodeURIComponent(projectId)}` : "/translations";
  }

  async function loadTranslationProjects(force = false) {
    if (state.translationProjectsLoaded && !force) {
      return state.translationProjects;
    }
    const payload = await apiJson("/api/translations/projects");
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

  function renderTranslationProjectCard(item) {
    const completed = Number(item._count?.chapterTranslations || 0);
    const downloaded = Number(item.novel?.downloadedChapters || 0);
    return `
      <article class="source-card translation-card" data-translation-project-id="${escapeHtml(item.id)}">
        <div class="source-main">
          <div>
            <h3 class="source-name">${escapeHtml(item.name)}</h3>
            <p class="source-desc">${escapeHtml(item.novel?.title || "")}</p>
            <div class="source-meta">
              <span class="translation-chip">${escapeHtml(item.provider || "mock")}</span>
              <span class="translation-chip">${escapeHtml(item.model || "mock-vi")}</span>
              <span class="translation-chip">${escapeHtml(item.targetLanguage || "vi")}</span>
              ${item.isActiveAuto ? '<span class="translation-chip">Auto Chap Mới</span>' : ""}
              ${item.isDefaultEdition ? '<span class="translation-chip">Bản dịch mặc định</span>' : ""}
            </div>
          </div>
          <div class="source-actions">
            <span class="source-status ${item.status === "ready" ? "enabled" : ""}">${escapeHtml(item.status || "idle")}</span>
            <span class="translation-muted">${completed}/${downloaded} chap dịch</span>
          </div>
        </div>
      </article>
    `;
  }

  function bindTranslationListEvents() {
    $$('[data-translation-project-id]', $id('translations-list')).forEach((item) => {
      item.addEventListener('click', () => {
        navigateTo(translationProjectPath(item.getAttribute('data-translation-project-id')));
      });
    });
  }

  function buildGlossaryRows(entries) {
    return entries.map((entry, index) => `
      <tr data-glossary-row="${index}">
        <td><input class="form-input" data-field="type" value="${escapeHtml(entry.type || 'term')}"></td>
        <td><input class="form-input" data-field="rawName" value="${escapeHtml(entry.rawName || '')}"></td>
        <td><input class="form-input" data-field="translatedName" value="${escapeHtml(entry.translatedName || '')}"></td>
        <td><input class="form-input" data-field="gender" value="${escapeHtml(entry.gender || '')}"></td>
        <td><input class="form-input" data-field="description" value="${escapeHtml(entry.description || '')}"></td>
        <td><input type="checkbox" data-field="locked" ${entry.locked ? 'checked' : ''}></td>
        <td><button class="btn-ghost" type="button" data-remove-glossary-row="${index}">X</button></td>
      </tr>
    `).join('');
  }

  function collectGlossaryRows() {
    return $$('[data-glossary-row]', $id('dynamic-modal-body')).map((row) => ({
      type: $('[data-field="type"]', row)?.value || 'term',
      rawName: $('[data-field="rawName"]', row)?.value || '',
      translatedName: $('[data-field="translatedName"]', row)?.value || '',
      gender: $('[data-field="gender"]', row)?.value || '',
      description: $('[data-field="description"]', row)?.value || '',
      locked: Boolean($('[data-field="locked"]', row)?.checked)
    })).filter((entry) => entry.rawName && entry.translatedName);
  }

  async function openGlossaryEditor(projectId) {
    const detail = state.translationDetail?.id === projectId ? state.translationDetail : await loadTranslationProjectDetail(projectId);
    const active = detail.glossaries?.find((item) => item.isActive) || detail.glossaries?.[0];
    const entries = (active?.entries || []).map((entry) => ({ ...entry }));
    showDynamicModal({
      title: `Glossary — ${detail.name}`,
      bodyHtml: `
        <div class="translation-toolbar">
          <button class="btn-primary" type="button" id="translation-add-glossary-row">Thêm dòng</button>
          <button class="btn-ghost" type="button" id="translation-suggest-glossary">AI suggest</button>
        </div>
        <table class="translation-table">
          <thead>
            <tr><th>Type</th><th>Raw</th><th>Translated</th><th>Gender</th><th>Description</th><th>Lock</th><th></th></tr>
          </thead>
          <tbody id="translation-glossary-body">${buildGlossaryRows(entries)}</tbody>
        </table>
      `,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Đóng</button>
        <button class="btn-primary" type="button" id="translation-save-glossary">Lưu glossary</button>
      `
    });
    function bindGlossaryButtons() {
      $$('[data-remove-glossary-row]').forEach((button) => {
        button.addEventListener('click', () => button.closest('tr')?.remove());
      });
    }
    bindGlossaryButtons();
    $id('translation-add-glossary-row')?.addEventListener('click', () => {
      const body = $id('translation-glossary-body');
      body.insertAdjacentHTML('beforeend', buildGlossaryRows([{ type: 'term', rawName: '', translatedName: '', gender: '', description: '', locked: false }]));
      bindGlossaryButtons();
    });
    $id('translation-suggest-glossary')?.addEventListener('click', async () => {
      const payload = await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/glossary/suggest`, { method: 'POST' });
      const body = $id('translation-glossary-body');
      for (const item of payload.items || []) {
        body.insertAdjacentHTML('beforeend', buildGlossaryRows([{ ...item, locked: false }]));
      }
      bindGlossaryButtons();
    });
    $id('translation-save-glossary')?.addEventListener('click', async () => {
      const rows = collectGlossaryRows();
      await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/glossaries/${encodeURIComponent(active.id)}`, {
        method: 'PATCH',
        body: { entries: rows }
      });
      await loadTranslationProjectDetail(projectId);
      renderTranslations();
      closeModal('dynamic-modal');
      showToast('?', '?? l?u glossary', detail.name);
    });
  }

  async function openRuntimeSettingsModal() {
    const settings = await apiJson('/api/translations/settings');
    showDynamicModal({
      title: 'Cấu hình runtime dịch',
      bodyHtml: `
        <label class="form-label">Credentials JSON</label>
        <textarea class="form-input" id="translation-runtime-credentials" rows="8">${escapeHtml(JSON.stringify(settings.credentials || [], null, 2))}</textarea>
        <label class="form-label" style="margin-top:12px;">Runtime JSON</label>
        <textarea class="form-input" id="translation-runtime-config" rows="8">${escapeHtml(JSON.stringify(settings.runtime || {}, null, 2))}</textarea>
      `,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Đóng</button>
        <button class="btn-primary" type="button" id="translation-runtime-save">Lưu</button>
      `
    });
    $id('translation-runtime-save')?.addEventListener('click', async () => {
      await apiJson('/api/translations/settings', {
        method: 'PATCH',
        body: {
          credentials: JSON.parse($id('translation-runtime-credentials').value || '[]'),
          runtime: JSON.parse($id('translation-runtime-config').value || '{}')
        }
      });
      closeModal('dynamic-modal');
      showToast('\u2713', '\u0110\u00e3 l\u01b0u runtime', 'C\u1ea5u h\u00ecnh d\u1ecbch \u0111\u00e3 c\u1eadp nh\u1eadt');
    });
  }

  async function openCreateTranslationProjectModal() {
    await loadLibrary();
    const options = state.libraryItems.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`).join('');
    showDynamicModal({
      title: 'Tạo project dịch',
      bodyHtml: `
        <label class="form-label">Truy\u1ec7n</label>
        <select class="form-input" id="translation-project-novel">${options}</select>
        <label class="form-label" style="margin-top:12px;">T\u00ean project</label>
        <input class="form-input" id="translation-project-name" placeholder="V\u00ed d\u1ee5: Vi\u1ec7t h\u00f3a \u0111\u1ecdc m\u01b0\u1ee3t">
        <label class="form-label" style="margin-top:12px;">Provider</label>
        <select class="form-input" id="translation-project-provider"><option value="mock">mock</option><option value="openai">openai-compatible</option><option value="gemini">gemini</option></select>
        <label class="form-label" style="margin-top:12px;">Model</label>
        <input class="form-input" id="translation-project-model" value="mock-vi">
        <label class="form-label" style="margin-top:12px;">Target language</label>
        <input class="form-input" id="translation-project-language" value="vi">
        <label class="form-label" style="margin-top:12px;">Style JSON</label>
        <textarea class="form-input" id="translation-project-style" rows="6">{
  "tone": "natural",
  "register": "readable",
  "hanVietLevel": "medium",
  "pronouns": "contextual"
}</textarea>
        <div class="translation-toolbar">
          <label><input type="checkbox" id="translation-project-auto"> Auto chap mới</label>
          <label><input type="checkbox" id="translation-project-active" checked> Active auto</label>
          <label><input type="checkbox" id="translation-project-default" checked> Edition mặc định</label>
        </div>
      `,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Hủy</button>
        <button class="btn-primary" type="button" id="translation-project-save">Tạo</button>
      `
    });
    $id('translation-project-save')?.addEventListener('click', async () => {
      const body = {
        novelId: $id('translation-project-novel').value,
        name: $id('translation-project-name').value || 'Bản dịch mới',
        provider: $id('translation-project-provider').value,
        model: $id('translation-project-model').value || 'mock-vi',
        targetLanguage: $id('translation-project-language').value || 'vi',
        styleGuideJson: $id('translation-project-style').value || '{}',
        autoTranslateNewChapters: $id('translation-project-auto').checked,
        isActiveAuto: $id('translation-project-active').checked,
        isDefaultEdition: $id('translation-project-default').checked
      };
      const payload = await apiJson('/api/translations/projects', { method: 'POST', body });
      state.translationProjectsLoaded = false;
      await loadTranslationProjects(true);
      closeModal('dynamic-modal');
      showToast('\u2713', '\u0110\u00e3 t\u1ea1o project d\u1ecbch', payload.item?.name || body.name);
      navigateTo(translationProjectPath(payload.item?.id));
    });
  }

  function renderTranslationDetail(detail) {
    const container = $id('translations-detail');
    if (!detail) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }
    container.style.display = 'block';
    const activeGlossary = detail.glossaries?.find((item) => item.isActive) || detail.glossaries?.[0];
    container.innerHTML = `
      <div class="translation-detail-grid">
        <section class="translation-section">
          <h3>${escapeHtml(detail.name)}</h3>
          <p class="translation-muted">${escapeHtml(detail.novel?.title || '')}</p>
          <div class="translation-toolbar">
            <span class="translation-chip">${escapeHtml(detail.provider)}</span>
            <span class="translation-chip">${escapeHtml(detail.model)}</span>
            <span class="translation-chip">${escapeHtml(detail.targetLanguage)}</span>
            ${detail.isActiveAuto ? '<span class="translation-chip">auto chap mới</span>' : ''}
            ${detail.isDefaultEdition ? '<span class="translation-chip">edition mặc định</span>' : ''}
          </div>
          <div class="translation-toolbar">
            <button class="btn-primary" type="button" id="translation-run-project">Dịch / cập nhật</button>
            ${detail.isActiveAuto ? '<span class="translation-chip">auto chap m\u1edbi</span>' : ''}
            ${detail.isDefaultEdition ? '<span class="translation-chip">edition m\u1eb7c \u0111\u1ecbnh</span>' : ''}
            <button class="btn-ghost" type="button" id="translation-edit-glossary">Glossary</button>
            <button class="btn-ghost" type="button" id="translation-runtime-settings">Runtime</button>
            <button class="btn-ghost" type="button" id="translation-export-epub">Export EPUB</button>
            <button class="btn-ghost" type="button" id="translation-export-txt">Export TXT</button>
          </div>
          <p class="translation-muted">Glossary active: v${escapeHtml(activeGlossary?.version || 1)} · ${escapeHtml((activeGlossary?.entries || []).length)} entries</p>
        </section>
        <section class="translation-section">
          <h3>Chapters</h3>
          <div class="translation-versions">
            ${(detail.chapterTranslations || []).map((item) => `
              <article class="translation-version-card">
                <strong>${escapeHtml(item.chapter?.title || '')}</strong>
                <div class="translation-toolbar">
                  <span class="translation-chip">${escapeHtml(item.status || 'pending')}</span>
                  ${item.hasManualEdits ? '<span class="translation-chip">đã sửa tay</span>' : ''}
                  ${item.newGeneratedAvailable ? '<span class="translation-chip">có bản generated mới</span>' : ''}
                </div>
                <div class="translation-toolbar">
                  <button class="btn-ghost" type="button" data-translation-open-chapter="${escapeHtml(item.id)}">Mở editor</button>
                  <button class="btn-ghost" type="button" data-translation-retranslate-chapter="${escapeHtml(item.id)}">Dịch lại</button>
                </div>
              </article>
            `).join('') || '<p class="translation-muted">Chưa có chapter dịch.</p>'}
          </div>
        </section>
      </div>
    `;
    $id('translation-run-project')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(detail.id)}/start`, { method: 'POST', body: { triggerType: 'manual' } });
      showToast('↻', 'Đã xếp hàng dịch', detail.name);
    });
    $id('translation-rebuild-project')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(detail.id)}/rebuild`, { method: 'POST' });
      showToast('↻', 'Đã xếp hàng rebuild', detail.name);
    });
    $id('translation-edit-glossary')?.addEventListener('click', () => void openGlossaryEditor(detail.id));
    $id('translation-runtime-settings')?.addEventListener('click', () => void openRuntimeSettingsModal());
    $id('translation-export-epub')?.addEventListener('click', () => {
      window.open(`/api/library/novels/${encodeURIComponent(detail.novelId)}/editions/${encodeURIComponent(detail.id)}/export.epub`, '_blank', 'noopener,noreferrer');
    });
    $id('translation-export-txt')?.addEventListener('click', () => {
      window.open(`/api/library/novels/${encodeURIComponent(detail.novelId)}/editions/${encodeURIComponent(detail.id)}/export.txt`, '_blank', 'noopener,noreferrer');
    });
    $id('translation-edit-config')?.addEventListener('click', async () => {
      showDynamicModal({
        title: `Cấu hình — ${detail.name}`,
        bodyHtml: `
          <label class="form-label">Tên project</label>
          <input class="form-input" id="translation-config-name" value="${escapeHtml(detail.name)}">
          <label class="form-label" style="margin-top:12px;">Provider</label>
          <input class="form-input" id="translation-config-provider" value="${escapeHtml(detail.provider)}">
          <label class="form-label" style="margin-top:12px;">Model</label>
          <input class="form-input" id="translation-config-model" value="${escapeHtml(detail.model)}">
          <label class="form-label" style="margin-top:12px;">Style JSON</label>
          <textarea class="form-input" id="translation-config-style" rows="8">${escapeHtml(detail.styleGuideJson || '{}')}</textarea>
          <label class="form-label" style="margin-top:12px;">System prompt</label>
          <textarea class="form-input" id="translation-config-prompt" rows="8">${escapeHtml(detail.systemPrompt || '')}</textarea>
        `,
        footerHtml: `
          <button class="btn-ghost" type="button" data-close="dynamic-modal">??ng</button>
          <button class="btn-primary" type="button" id="translation-config-save">L?u</button>
        `
      });
      $id('translation-config-save')?.addEventListener('click', async () => {
        await apiJson(`/api/translations/projects/${encodeURIComponent(detail.id)}`, {
          method: 'PATCH',
          body: {
            name: $id('translation-config-name').value,
            provider: $id('translation-config-provider').value,
            model: $id('translation-config-model').value,
            styleGuideJson: $id('translation-config-style').value,
            systemPrompt: $id('translation-config-prompt').value
          }
        });
        await loadTranslationProjectDetail(detail.id);
        renderTranslations();
        closeModal('dynamic-modal');
        showToast('\u2713', '\u0110\u00e3 l\u01b0u c\u1ea5u h\u00ecnh', detail.name);
      });
    });
    $$('[data-translation-retranslate-chapter]', container).forEach((button) => {
      button.addEventListener('click', async () => {
        await apiJson(`/api/translations/projects/${encodeURIComponent(detail.id)}/chapters/${encodeURIComponent(button.getAttribute('data-translation-retranslate-chapter'))}/retranslate`, { method: 'POST' });
        showToast('\u21bb', '\u0110\u00e3 x\u1ebfp h\u00e0ng d\u1ecbch l\u1ea1i chap', detail.name);
      });
    });
    $$('[data-translation-open-chapter]', container).forEach((button) => {
      button.addEventListener('click', () => void openTranslationChapterEditor(detail.id, button.getAttribute('data-translation-open-chapter')));
    });
  }

  async function openTranslationChapterEditor(projectId, chapterTranslationId) {
    const payload = await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterTranslationId)}`);
    const detail = payload.item;
    const published = (detail.versions || []).find((item) => item.id === detail.currentPublishedVersionId) || detail.versions?.[0];
    showDynamicModal({
      title: `Editor — ${detail.chapter?.title || ''}`,
      bodyHtml: `
        <div class="translation-editor-grid">
          <div>
            <h4>Bản gốc</h4>
            <div class="translation-editor-pane">${detail.sourceHtml || ''}</div>
          </div>
          <div>
            <h4>Bản dịch hiện tại</h4>
            <div class="translation-editor-pane" id="translation-editor-pane" contenteditable="true">${published?.html || ''}</div>
          </div>
        </div>
        <div class="translation-toolbar" style="margin-top:14px;">
          <select class="form-input" id="translation-version-select" style="max-width:320px;">
            ${(detail.versions || []).map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === detail.currentPublishedVersionId ? 'selected' : ''}>v${item.versionNumber} Â· ${escapeHtml(item.kind)}${item.isPublished ? ' Â· publish' : ''}</option>`).join('')}
          </select>
          <button class="btn-ghost" type="button" id="translation-switch-version">Dùng version này</button>
          <button class="btn-ghost" type="button" id="translation-delete-version">Xóa version đang chọn</button>
        </div>
      `,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Hủy</button>
        <button class="btn-primary" type="button" id="translation-save-editor">Lưu thành version mới</button>
      `,
      dismissible: true
    });
    $id('translation-save-editor')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterTranslationId)}/versions`, {
        method: 'POST',
        body: {
          html: $id('translation-editor-pane').innerHTML,
          publish: true,
          createdBy: 'web-editor'
        }
      });
      await loadTranslationProjectDetail(projectId);
      renderTranslations();
      closeModal('dynamic-modal');
      showToast('\u2713', 'Đã lưu version mới', detail.chapter?.title || 'chapter');
    });
    $id('translation-switch-version')?.addEventListener('click', async () => {
      await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterTranslationId)}/published-version`, {
        method: 'PATCH',
        body: { versionId: $id('translation-version-select').value }
      });
      await loadTranslationProjectDetail(projectId);
      renderTranslations();
      closeModal('dynamic-modal');
      showToast('\u2713', 'Đã đổi version publish', detail.chapter?.title || 'chapter');
    });
    $id('translation-delete-version')?.addEventListener('click', async () => {
      const versionId = $id('translation-version-select').value;
      await apiJson(`/api/translations/projects/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterTranslationId)}/versions/${encodeURIComponent(versionId)}`, {
        method: 'DELETE'
      });
      await loadTranslationProjectDetail(projectId);
      renderTranslations();
      closeModal('dynamic-modal');
      showToast('\u2713', 'Đã xóa version', detail.chapter?.title || 'chapter');
    });
  }

  function renderTranslations() {
    const list = $id('translations-list');
    const empty = $id('translations-empty');
    list.innerHTML = (state.translationProjects || []).map(renderTranslationProjectCard).join('');
    empty.style.display = state.translationProjects.length ? 'none' : 'block';
    bindTranslationListEvents();
    renderTranslationDetail(state.translationDetail);
  }

