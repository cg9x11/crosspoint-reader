  function renderDetailLoading() {
    const detailTitleLink = $id("detail-title-link");
    detailTitleLink.textContent = "Đang tải…";
    detailTitleLink.removeAttribute("href");
    $id("detail-author").textContent = "";
    $id("detail-origin-link").classList.add("is-hidden");
    $id("detail-badges").innerHTML = "";
    $id("detail-summary").textContent = "Đang lấy thông tin truyện và danh sách chương.";
    $id("stat-chapters").textContent = "—";
    $id("stat-status").textContent = "—";
    $id("stat-source").textContent = "—";
    if ($id("btn-add-library")) {
      $id("btn-add-library").disabled = false;
      $id("btn-add-library").textContent = "+ Thêm vào thư viện";
    }
    if ($id("btn-download-all")) {
      $id("btn-download-all").disabled = false;
      $id("btn-download-all").textContent = "↻ Đồng bộ lại";
    }
    if ($id("btn-rebuild-library")) {
      $id("btn-rebuild-library").disabled = false;
      $id("btn-rebuild-library").textContent = "↻ Rebuild local files";
    }
    if ($id("btn-export-epub")) {
      $id("btn-export-epub").disabled = false;
      $id("btn-export-epub").textContent = "⇩ Xuất EPUB tổng hợp";
    }
    $id("chapter-list").innerHTML = `
      <div class="chapter-row"><span class="ch-title">Đang tải chương…</span></div>
    `;
  }

  function buildDetailRowIcon(status) {
    if (status === "published") {
      return `
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 6l3 3 5-5" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      `;
    }
    if (status === "fetch_failed" || status === "build_failed") {
      return `
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 3.2v3.1" stroke-linecap="round"></path>
          <circle cx="6" cy="8.7" r="0.6" fill="currentColor" stroke="none"></circle>
          <circle cx="6" cy="6" r="4.5"></circle>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6 2v6M3.5 6L6 8.5 8.5 6M2 10h8" stroke-linecap="round"></path>
      </svg>
    `;
  }

  async function loadNovelEditions(novelId, force = false) {
    if (!novelId) {
      return [];
    }
    if (!force && Array.isArray(state.novelEditions[novelId])) {
      return state.novelEditions[novelId];
    }
    const payload = await apiJson(`/api/library/novels/${encodeURIComponent(novelId)}/editions`);
    const items = Array.isArray(payload.items) ? payload.items : [];
    state.novelEditions[novelId] = items;
    return items;
  }

  function renderDetailEditions(novelId) {
    const container = $id("detail-editions");
    if (!container) {
      return;
    }
    const editions = Array.isArray(state.novelEditions[novelId]) ? state.novelEditions[novelId] : [];
    if (!novelId || !editions.length) {
      container.classList.add("is-hidden");
      container.innerHTML = "";
      return;
    }

    container.classList.remove("is-hidden");
    container.innerHTML = `
      <div class="detail-editions-header">
        <div>
          <h3 class="section-title" style="margin:0;">Bản đọc / bản tải</h3>
          <p class="form-hint" style="margin:4px 0 0;">Chọn bản mặc định cho OPDS, mở project dịch, hoặc tải riêng từng bản.</p>
        </div>
      </div>
      <div class="detail-editions-grid">
        ${editions
          .map(
            (item) => `
              <div class="detail-edition-row">
                <div class="detail-edition-meta">
                  <div class="detail-edition-title">${escapeHtml(item.label || item.id)}</div>
                  <div class="source-meta">
                    <span class="translation-chip">${escapeHtml(item.kind === "translation" ? `Dịch • ${item.language || "?"}` : "Gốc")}</span>
                    ${item.isDefault ? '<span class="translation-chip">Mặc định OPDS</span>' : ""}
                    ${item.status ? `<span class="translation-chip">${escapeHtml(item.status)}</span>` : ""}
                  </div>
                </div>
                <div class="detail-edition-actions">
                  ${
                    item.kind === "translation"
                      ? `<button class="btn-secondary" type="button" data-open-translation-project="${escapeHtml(item.projectId || item.id)}">Mở project</button>`
                      : ""
                  }
                  ${
                    item.kind === "translation"
                      ? `<button class="btn-ghost" type="button" data-download-edition-epub="${escapeHtml(item.id)}">EPUB</button><button class="btn-ghost" type="button" data-download-edition-txt="${escapeHtml(item.id)}">TXT</button>`
                      : `<button class="btn-ghost" type="button" data-open-original-opds="${escapeHtml(item.id)}">Link OPDS gốc</button>`
                  }
                  ${
                    item.isDefault
                      ? ""
                      : `<button class="btn-primary" type="button" data-set-default-edition="${escapeHtml(item.id)}" data-set-default-kind="${escapeHtml(item.kind)}">Đặt mặc định</button>`
                  }
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `;

    $$('[data-open-translation-project]', container).forEach((button) => {
      button.addEventListener('click', () => navigateTo(translationProjectPath(button.getAttribute('data-open-translation-project'))));
    });
    $$('[data-download-edition-epub]', container).forEach((button) => {
      button.addEventListener('click', () => {
        window.open(`/api/library/novels/${encodeURIComponent(novelId)}/editions/${encodeURIComponent(button.getAttribute('data-download-edition-epub'))}/export.epub`, '_blank', 'noopener,noreferrer');
      });
    });
    $$('[data-download-edition-txt]', container).forEach((button) => {
      button.addEventListener('click', () => {
        window.open(`/api/library/novels/${encodeURIComponent(novelId)}/editions/${encodeURIComponent(button.getAttribute('data-download-edition-txt'))}/export.txt`, '_blank', 'noopener,noreferrer');
      });
    });
    $$('[data-open-original-opds]', container).forEach((button) => {
      button.addEventListener('click', () => {
        window.open(`/opds/series/${encodeURIComponent(novelId)}?edition=${encodeURIComponent(button.getAttribute('data-open-original-opds'))}`, '_blank', 'noopener,noreferrer');
      });
    });
    $$('[data-set-default-edition]', container).forEach((button) => {
      button.addEventListener('click', async () => {
        await apiJson(`/api/library/novels/${encodeURIComponent(novelId)}/default-edition`, {
          method: 'PATCH',
          body: {
            kind: button.getAttribute('data-set-default-kind'),
            projectId: button.getAttribute('data-set-default-kind') === 'translation' ? button.getAttribute('data-set-default-edition') : null
          }
        });
        await loadNovelEditions(novelId, true);
        renderDetailEditions(novelId);
        showToast('✓', 'Đã đổi edition mặc định', 'OPDS sẽ dùng bản này');
      });
    });
  }

  function renderDetail(detail) {
    state.detailPayload = detail;
    state.detailContext = detail.kind === "library" ? "library" : "browse";
    state.detailLibraryId = detail.libraryItem?.id || null;
    state.detailRequestUrl = detail.requestUrl || null;

    const sourceRecord = detail.source || getEnabledSourceById(detail.sourceId) || getInstalledExtensionById(detail.sourceId);
    const coverWrap = $("#detail-hero .detail-cover-wrap");
    const cover = $id("detail-cover");
    const blur = $id("detail-cover-blur");
    const detailTitleLink = $id("detail-title-link");
    const detailOriginLink = $id("detail-origin-link");
    const badges = $id("detail-badges");
    const summary = $id("detail-summary");
    const chapterList = $id("chapter-list");
    const editionsBox = $id("detail-editions");
    const addButton = $id("btn-add-library");
    const syncButton = $id("btn-download-all");
    const rebuildButton = $id("btn-rebuild-library");
    const exportButton = $id("btn-export-epub");
    const uploadChaptersButton = $id("btn-upload-chapters");
    const editButton = $id("btn-edit-library");
    const removeLibraryButton = $id("btn-remove-library");
    const openLibraryButton = $id("btn-in-library");
    const sourceBlocked = Boolean(detail.upstreamBlocked);
    const isLocalUpload = isLocalUploadLibraryItem(detail.libraryItem);

    editionsBox?.classList.add("is-hidden");
    if (editionsBox) {
      editionsBox.innerHTML = "";
    }

    coverWrap.style.background = coverGradient(detail.title || detail.sourceUrl || detail.requestUrl);
    const preferredCoverUrl = firstText(buildLibraryCoverUrl(detail.libraryItem), detail.coverUrl);
    if (preferredCoverUrl) {
      cover.src = preferredCoverUrl;
      cover.alt = detail.title || "";
      cover.style.display = "block";
      blur.style.backgroundImage = "none";
      blur.style.opacity = "1";
    } else {
      cover.removeAttribute("src");
      cover.style.display = "none";
      blur.style.backgroundImage = "none";
      blur.style.opacity = "0";
    }

    const originalUrl = detail.sourceUrl || detail.requestUrl || "";
    const displayTitle = resolveDetailTitle(detail.title, originalUrl);
    detailTitleLink.textContent = displayTitle;
    if (originalUrl && !isLocalUpload) {
      detailTitleLink.href = originalUrl;
      detailOriginLink.href = originalUrl;
      detailOriginLink.classList.remove("is-hidden");
    } else {
      detailTitleLink.removeAttribute("href");
      detailOriginLink.removeAttribute("href");
      detailOriginLink.classList.add("is-hidden");
    }
    $id("detail-author").textContent = detail.author || sourceRecord?.name || "";

    badges.innerHTML = "";
    const statusBadge = document.createElement("span");
    statusBadge.className = `badge ${
      String(detail.status || "").toLowerCase() === "completed" ? "badge-completed" : "badge-ongoing"
    }`;
    statusBadge.textContent = statusLabel(detail.status);
    badges.appendChild(statusBadge);

    if (sourceBlocked) {
      const warningBadge = document.createElement("span");
      warningBadge.className = "badge badge-cat";
      warningBadge.textContent = "Nguồn đang chặn server";
      badges.appendChild(warningBadge);
    }

    (detail.genres || []).slice(0, 6).forEach((genre) => {
      const tag = document.createElement("span");
      tag.className = "badge badge-cat";
      tag.textContent = genre;
      badges.appendChild(tag);
    });

    summary.textContent =
      stripHtml(detail.description) ||
      (sourceBlocked
        ? detail.chapterWarning || "Nguồn đang chặn truy cập từ server nên chỉ hiển thị được dữ liệu preview."
        : "Truyện chưa có mô tả từ nguồn. Bạn vẫn có thể thêm vào thư viện và đồng bộ chương.");
    summary.classList.toggle("expanded", false);

    $id("stat-chapters").textContent = formatCount(detail.chapterCount || detail.chapters?.length || 0);
    $id("stat-status").textContent = statusLabel(detail.status);
    $id("stat-source").textContent = sourceRecord?.name || detail.sourceId || "Không rõ";

    addButton.style.display = detail.libraryItem ? "none" : "block";
    syncButton.style.display = detail.libraryItem ? "block" : "none";
    rebuildButton.style.display = detail.libraryItem ? "block" : "none";
    exportButton.style.display = detail.libraryItem ? "block" : "none";
    uploadChaptersButton.style.display = detail.libraryItem ? "block" : "none";
    editButton.style.display = isLocalUpload ? "block" : "none";
    removeLibraryButton.style.display = detail.libraryItem ? "block" : "none";
    openLibraryButton.style.display = detail.libraryItem && detail.kind !== "library" && !isLocalUpload ? "block" : "none";
    addButton.disabled = sourceBlocked;
    syncButton.disabled = sourceBlocked || isLocalUpload;
    rebuildButton.disabled = !detail.libraryItem || isLocalUpload;
    exportButton.disabled = !detail.libraryItem || !Number(detail.libraryItem?.downloadedChapters);
    uploadChaptersButton.disabled = !detail.libraryItem;

    syncButton.textContent =
      isLocalUpload
        ? "Đã upload local"
        : sourceBlocked
        ? "Nguồn đang chặn"
        : detail.libraryItem?.syncStatus === "error"
          ? "↻ Thử lại đồng bộ"
          : "↻ Đồng bộ lại";
    rebuildButton.textContent = "↻ Rebuild local files";
    exportButton.textContent = "⇩ Xuất EPUB tổng hợp";
    uploadChaptersButton.textContent = "+ Upload chapter";
    addButton.textContent = sourceBlocked ? "Nguồn đang chặn" : "+ Thêm vào thư viện";
    openLibraryButton.textContent = detail.kind === "library" ? "✓ Đã trong thư viện" : "✓ Mở trong thư viện";

    const chapters = [...(detail.chapters || [])];
    if (state.chapterSort === "desc") {
      chapters.reverse();
    }

    chapterList.innerHTML = "";
    const chapterLimit = Math.min(chapters.length, state.detailChapterLimit || 150);
    const visibleChapters = chapters.slice(0, chapterLimit);
    const limitedChapters = visibleChapters;
    visibleChapters.forEach((chapter) => {
      const row = document.createElement("div");
      const downloaded = chapter.status === "published";
      const chapterTitle = escapeHtml(chapter.title || "Chương");
      const chapterMeta = chapter.lastError
        ? `<span class="ch-meta">${escapeHtml(truncate(chapter.lastError, 88))}</span>`
        : "";
      const previewButton = isChapterPreviewable(chapter)
        ? `<button class="chapter-view-btn" type="button">Xem</button>`
        : "";
      const retryButton = !isLocalUpload && isChapterRetryable(chapter)
        ? `<button class="chapter-retry-btn" type="button">Tải lại</button>`
        : "";
      const deleteButton = isLocalUpload && chapter.id
        ? `<button class="chapter-delete-btn" type="button">Xóa</button>`
        : "";
      row.className = `chapter-row${downloaded ? " downloaded" : ""}${isChapterFailed(chapter.status) ? " failed" : ""}`;
      row.innerHTML = `
        <span class="ch-index">${String(chapter.chapterIndex ?? 0).padStart(3, "0")}</span>
        <div class="ch-main">
          <span class="ch-title">${chapterTitle}</span>
          ${chapterMeta}
        </div>
        <div class="ch-actions">
          <span class="ch-dl-icon">${buildDetailRowIcon(chapter.status)}</span>
          ${previewButton}
          ${retryButton}
          ${deleteButton}
        </div>
      `;
      if (isChapterPreviewable(chapter) || (chapter.sourceUrl && !isLocalUpload)) {
        row.addEventListener("click", (event) => {
          if (event.target.closest(".chapter-retry-btn, .chapter-view-btn, .chapter-delete-btn")) {
            return;
          }
          if (isChapterPreviewable(chapter)) {
            void previewCurrentChapter(chapter.id);
            return;
          }
          window.open(chapter.sourceUrl, "_blank", "noopener,noreferrer");
        });
      }
      row.querySelector(".chapter-view-btn")?.addEventListener("click", (event) => {
        event.stopPropagation();
        void previewCurrentChapter(chapter.id);
      });
      row.querySelector(".chapter-retry-btn")?.addEventListener("click", (event) => {
        event.stopPropagation();
        void retryCurrentChapter(chapter.id);
      });
      row.querySelector(".chapter-delete-btn")?.addEventListener("click", (event) => {
        event.stopPropagation();
        showConfirmModal({
          title: "Xóa chapter",
          message: `Xóa ${chapter.title || `Chương ${chapter.chapterIndex}`} khỏi truyện upload?`,
          confirmLabel: "Xóa",
          confirmTone: "danger",
          onConfirm: async () => {
            await deleteUploadedChapter(chapter.id);
          }
        });
      });
      chapterList.appendChild(row);
    });

    if (!limitedChapters.length) {
      const row = document.createElement("div");
      row.className = "chapter-row";
      row.innerHTML = `<span class="ch-title">${escapeHtml(
        detail.chapterWarning || "Chưa có dữ liệu chương từ nguồn hoặc thư viện."
      )}</span>`;
      chapterList.appendChild(row);
    } else if (chapters.length > limitedChapters.length) {
      const row = document.createElement("div");
      row.className = "chapter-row";
      row.style.justifyContent = "center";
      row.style.color = "var(--ink-3)";
      row.style.fontSize = "12px";
      row.style.fontFamily = "var(--font-mono)";
      row.textContent = `... và ${chapters.length - limitedChapters.length} chương khác`;
      chapterList.appendChild(row);
    }

    if (chapters.length > visibleChapters.length) {
      chapterList.lastElementChild?.remove();
      const button = document.createElement("button");
      button.className = "chapter-more-btn";
      button.type = "button";
      button.textContent = `Xem thêm ${Math.min(150, chapters.length - visibleChapters.length)} / ${
        chapters.length - visibleChapters.length
      } chương`;
      button.addEventListener("click", () => {
        state.detailChapterLimit += 150;
        if (state.detailPayload) {
          renderDetail(state.detailPayload);
        }
      });
      chapterList.appendChild(button);
    }

    const sortButton = $id("sort-btn");
    if (sortButton) {
      sortButton.dataset.asc = String(state.chapterSort === "asc");
      sortButton.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
          <path d="M2 4h12M4 8h8M6 12h4"></path>
        </svg>
        ${state.chapterSort === "desc" ? "Mới nhất" : "Cũ nhất"}
      `;
    }

    if (detail.kind === "library" && detail.id) {
      void loadNovelEditions(detail.id)
        .then(() => renderDetailEditions(detail.id))
        .catch((error) => {
          console.error(error);
        });
    }
  }

  function openExtensionInfoModal(item, isInstalled) {
    const capabilities = [
      ["Home", item.capabilities?.supportsHome ?? item.supportsHome],
      ["Search", item.capabilities?.supportsSearch ?? item.supportsSearch],
      ["Genre", item.capabilities?.supportsGenre ?? item.supportsGenre],
      ["Paging", item.capabilities?.supportsPagination ?? item.supportsPagination],
      ["Detail", item.capabilities?.supportsDetailDescription ?? item.supportsDetailDescription],
      ["Browser", item.capabilities?.supportsBrowserAutomation ?? item.supportsBrowserAutomation]
    ]
      .filter((entry) => Boolean(entry[1]))
      .map((entry) => `<span class="badge badge-cat">${escapeHtml(entry[0])}</span>`)
      .join("");
    const hiddenByPolicy = isInstalled && isSourceHiddenByPolicy(item.id);

    const footerButtons = [
      `<button class="btn-ghost" type="button" data-close="dynamic-modal">Đóng</button>`
    ];

    if (isInstalled && item.enabled && item.runtimeSupported && !hiddenByPolicy) {
      footerButtons.push(`<button class="btn-primary" type="button" id="dynamic-browse-source">Duyệt</button>`);
    } else if (hiddenByPolicy) {
      footerButtons.push(`<button class="btn-primary" type="button" id="dynamic-show-source">Hiện nguồn</button>`);
    } else if (!isInstalled) {
      footerButtons.push(`<button class="btn-primary" type="button" id="dynamic-install-source">Cài & bật</button>`);
    }

    if (isInstalled && !item.bundled && !isSystemSource(item)) {
      footerButtons.splice(
        1,
        0,
        `<button class="btn-ghost" type="button" id="dynamic-remove-source">Gỡ</button>`
      );
    }

    showDynamicModal({
      title: item.name || item.id,
      bodyHtml: `
        ${
          item.description
            ? `<p class="form-hint" style="margin:0 0 16px;">${escapeHtml(item.description)}</p>`
            : ""
        }
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <span class="form-label">Trạng thái</span>
            <p class="form-hint" style="margin:0;">
              ${escapeHtml(
                isInstalled
                  ? `${item.enabled ? "Đang bật" : "Đang tắt"} • ${item.runtimeSupported ? "runtime ổn" : "runtime lỗi"}`
                  : `Chưa cài • registry ${item.registryName || "không rõ"}`
              )}
            </p>
          </div>
          <div>
            <span class="form-label">Nguồn / domain</span>
            <p class="form-hint" style="margin:0;">${escapeHtml(
              item.sourceUrl ? sourceDomain(item.sourceUrl) : item.registryName || item.runtimeKind || "local"
            )}</p>
          </div>
          <div>
            <span class="form-label">Version</span>
            <p class="form-hint" style="margin:0;">v${escapeHtml(item.version || "0")}</p>
          </div>
          <div>
            <span class="form-label">Capabilities</span>
            <div class="detail-badges" style="margin-top:6px;">
              ${capabilities || `<span class="form-hint" style="margin:0;">Không có capability đặc biệt.</span>`}
            </div>
          </div>
          ${
            item.lastError
              ? `
                <div>
                  <span class="form-label">Lỗi gần nhất</span>
                  <p class="form-hint" style="margin:0;color:#d86b6b;">${escapeHtml(item.lastError)}</p>
                </div>
              `
              : ""
          }
        </div>
      `,
      footerHtml: footerButtons.join("")
    });

    $id("dynamic-browse-source")?.addEventListener("click", () => {
      closeModal("dynamic-modal");
      openSourceBrowse(item.id);
    });

    $id("dynamic-show-source")?.addEventListener("click", async () => {
      try {
        await showSourceInPolicy(item.id);
        closeModal("dynamic-modal");
      } catch (error) {
        showToast("!", error.message, "Không hiển thị được nguồn.");
      }
    });

    $id("dynamic-install-source")?.addEventListener("click", async () => {
      try {
        await installAndEnableExtension(item.id);
        closeModal("dynamic-modal");
      } catch (error) {
        showToast("!", error.message, "Không thể cài extension.");
      }
    });

    $id("dynamic-remove-source")?.addEventListener("click", () => {
      closeModal("dynamic-modal");
      confirmRemoveExtension(item.id, item.name);
    });
  }

  function confirmRemoveExtension(extensionId, name) {
    showConfirmModal({
      title: "Gỡ extension",
      message: `Gỡ ${name} khỏi server? Dữ liệu thư viện đã thêm vẫn được giữ lại.`,
      confirmLabel: "Gỡ extension",
      onConfirm: async () => {
        await apiJson(`/api/extensions/${encodeURIComponent(extensionId)}`, {
          method: "DELETE"
        });
        state.extensionsLoaded = false;
        state.enabledSourcesLoaded = false;
        state.registriesLoaded = false;
        await refreshSourceInventory(true);
        renderSources();
        if (state.serverSection === "extensions") {
          renderServerExtensionsSection();
        }
        if (state.activeSourceId === extensionId) {
          state.activeSourceId = state.enabledSources[0]?.id || null;
        }
        showToast("✓", "Đã gỡ extension", name);
      }
    });
  }
