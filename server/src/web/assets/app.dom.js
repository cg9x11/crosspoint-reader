  function ensureDynamicShell() {
    ensureServerSectionBar();
    ensureLibraryUploadUi();

    if (!$id("dynamic-modal")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <div class="modal-overlay" id="dynamic-modal" style="display:none">
            <div class="modal">
              <div class="modal-header">
                <h3 class="modal-title" id="dynamic-modal-title"></h3>
                <button class="modal-close" type="button" id="dynamic-modal-close" data-close="dynamic-modal">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
                    <line x1="3" y1="3" x2="13" y2="13"></line>
                    <line x1="13" y1="3" x2="3" y2="13"></line>
                  </svg>
                </button>
              </div>
              <div class="modal-body" id="dynamic-modal-body"></div>
              <div class="modal-footer" id="dynamic-modal-footer"></div>
            </div>
          </div>
        `
      );
    }

    if (!$id("change-password-modal")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <div class="modal-overlay" id="change-password-modal" style="display:none">
            <div class="modal">
              <div class="modal-header">
                <h3 class="modal-title">Đổi mật khẩu quản trị</h3>
                <button class="modal-close" type="button" id="change-password-close" data-close="change-password-modal">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
                    <line x1="3" y1="3" x2="13" y2="13"></line>
                    <line x1="13" y1="3" x2="3" y2="13"></line>
                  </svg>
                </button>
              </div>
              <div class="modal-body">
                <p class="form-hint" id="change-password-hint" style="margin:0 0 16px;"></p>
                <form id="change-password-form" novalidate>
                  <div style="margin-bottom:14px;">
                    <label class="form-label" for="change-password-username">Tên đăng nhập</label>
                    <input class="form-input" id="change-password-username" name="username" type="text" autocomplete="username">
                  </div>
                  <div style="margin-bottom:14px;">
                    <label class="form-label" for="change-password-current">Mật khẩu hiện tại</label>
                    <input class="form-input" id="change-password-current" name="currentPassword" type="password" autocomplete="current-password">
                  </div>
                  <div style="margin-bottom:14px;">
                    <label class="form-label" for="change-password-next">Mật khẩu mới</label>
                    <input class="form-input" id="change-password-next" name="newPassword" type="password" autocomplete="new-password">
                  </div>
                  <div>
                    <label class="form-label" for="change-password-confirm">Nhập lại mật khẩu mới</label>
                    <input class="form-input" id="change-password-confirm" name="confirmPassword" type="password" autocomplete="new-password">
                  </div>
                  <p
                    id="change-password-error"
                    class="form-hint"
                    hidden
                    aria-live="polite"
                    style="color:#d86b6b;margin:12px 0 0;"
                  ></p>
                </form>
              </div>
              <div class="modal-footer">
                <button class="btn-ghost" type="button" id="change-password-cancel" data-close="change-password-modal">Để sau</button>
                <button class="btn-primary" type="submit" form="change-password-form" id="change-password-submit">Lưu thay đổi</button>
              </div>
            </div>
          </div>
        `
      );
    }
  }

  function ensureLibraryUploadUi() {
    const libraryHeader = document.querySelector("#page-library .page-header-inner");
    if (libraryHeader && !$id("library-sync-btn")) {
      const existingIconButton = libraryHeader.querySelector(".icon-btn");
      const actions = document.createElement("div");
      actions.className = "page-header-actions";
      actions.innerHTML = `
        <button class="icon-btn" id="library-upload-btn" title="Upload truyện" type="button">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M10 13V4" stroke-linecap="round"></path>
            <path d="M6.5 7.5L10 4l3.5 3.5" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M4 14.5v.5A1.5 1.5 0 005.5 16.5h9A1.5 1.5 0 0016 15v-.5" stroke-linecap="round"></path>
          </svg>
        </button>
        <button class="icon-btn" id="library-sync-btn" title="Sync tất cả" type="button">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 10a7 7 0 0113.5-2.5M17 10a7 7 0 01-13.5 2.5"></path>
            <path d="M15 5l1.5 2.5L14 8.5M5 15l-1.5-2.5L6 11.5" stroke-linecap="round"></path>
          </svg>
        </button>
      `;

      if (existingIconButton) {
        existingIconButton.replaceWith(actions);
      } else {
        libraryHeader.appendChild(actions);
      }
    }

    const detailActions = $id("detail-actions");
    if (detailActions && !$id("btn-upload-chapters")) {
      const button = document.createElement("button");
      button.className = "btn-secondary btn-full";
      button.id = "btn-upload-chapters";
      button.type = "button";
      button.style.display = "none";
      button.textContent = "+ Upload chapter";
      const removeButton = $id("btn-remove-library");
      if (removeButton?.parentElement === detailActions) {
        detailActions.insertBefore(button, removeButton);
      } else {
        detailActions.appendChild(button);
      }
    }
  }

  function openModal(id) {
    const modal = $id(id);
    if (modal) {
      modal.style.display = "flex";
      repairNodeText(modal);
    }
  }

  function blurActiveElement() {
    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }
  }

  function closeModal(id) {
    if (id === "change-password-modal" && state.auth.mustChangePassword) {
      return;
    }

    const modal = $id(id);
    if (modal) {
      modal.style.display = "none";
    }
  }

  let toastTimer = null;
  function showToast(icon, title, subtitle = "") {
    const toast = $id("toast");
    if (!toast) {
      return;
    }
    $id("toast-icon").textContent = icon;
    $id("toast-title").textContent = title;
    $id("toast-sub").textContent = subtitle;
    repairNodeText(toast);
    toast.style.display = "flex";

    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
      toast.style.display = "none";
    }, 3200);
  }

  function showDynamicModal({ title, bodyHtml, footerHtml = "", dismissible = true }) {
    $id("dynamic-modal-title").textContent = title;
    $id("dynamic-modal-body").innerHTML = bodyHtml;

    const footer = $id("dynamic-modal-footer");
    footer.innerHTML = footerHtml;
    footer.style.display = footerHtml ? "flex" : "none";

    const closeButton = $id("dynamic-modal-close");
    closeButton.style.display = dismissible ? "flex" : "none";
    $id("dynamic-modal").dataset.dismissible = dismissible ? "true" : "false";
    repairNodeText($id("dynamic-modal"));
    openModal("dynamic-modal");
  }

  function showConfirmModal({ title, message, confirmLabel, confirmTone = "primary", onConfirm }) {
    showDynamicModal({
      title,
      bodyHtml: `<p class="form-hint" style="margin:0;">${escapeHtml(message)}</p>`,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Hủy</button>
        <button class="${confirmTone === "ghost" ? "btn-ghost" : "btn-primary"}" type="button" id="confirm-modal-submit">
          ${escapeHtml(confirmLabel)}
        </button>
      `
    });

    $id("confirm-modal-submit")?.addEventListener("click", async () => {
      try {
        await onConfirm();
      } finally {
        closeModal("dynamic-modal");
      }
    });
  }

  function setMessageInGrid(grid, title, subtitle, buttonLabel, onClick) {
    grid.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";
    wrapper.style.gridColumn = "1 / -1";
    wrapper.style.padding = "48px 16px";
    wrapper.innerHTML = `
      <p class="empty-title">${escapeHtml(title)}</p>
      <p class="empty-sub">${escapeHtml(subtitle)}</p>
      ${buttonLabel ? `<button class="btn-primary" type="button">${escapeHtml(buttonLabel)}</button>` : ""}
    `;
    if (buttonLabel && onClick) {
      wrapper.querySelector("button")?.addEventListener("click", onClick);
    }
    grid.appendChild(wrapper);
  }

  function setMessageInBlock(container, title, subtitle, buttonLabel, onClick) {
    container.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";
    wrapper.style.padding = "40px 12px";
    wrapper.innerHTML = `
      <p class="empty-title">${escapeHtml(title)}</p>
      <p class="empty-sub">${escapeHtml(subtitle)}</p>
      ${buttonLabel ? `<button class="btn-primary" type="button">${escapeHtml(buttonLabel)}</button>` : ""}
    `;
    if (buttonLabel && onClick) {
      wrapper.querySelector("button")?.addEventListener("click", onClick);
    }
    container.appendChild(wrapper);
  }

  function showNovelSkeleton(gridId, count = 10) {
    const grid = $id(gridId);
    if (!grid) {
      return;
    }

    grid.innerHTML = "";
    for (let index = 0; index < count; index += 1) {
      const item = document.createElement("div");
      item.innerHTML = `
        <div class="skeleton skeleton-cover"></div>
        <div class="skeleton skeleton-line-sm"></div>
        <div class="skeleton skeleton-line-sm"></div>
        <div class="skeleton skeleton-line-xs"></div>
      `;
      grid.appendChild(item);
    }
  }

  function renderSourceIconHtml(item) {
    if (item.iconUrl) {
      return `<img src="${escapeHtml(item.iconUrl)}" alt="">`;
    }
    return escapeHtml(sourceInitials(item.name || item.title));
  }

  function looksTechnicalSourceLabel(value) {
    const text = String(value ?? "").trim();
    if (!text) {
      return true;
    }

    return (
      text.startsWith("ext:") ||
      text.includes("://") ||
      /^[a-z0-9_-]+(?::[a-z0-9._/-]+){2,}$/i.test(text)
    );
  }

  function getReadableSourceLabel(item) {
    const knownSourceName =
      (item.sourceId && getInstalledExtensionById(item.sourceId)?.name) ||
      (item.sourceId && getEnabledSourceById(item.sourceId)?.name) ||
      "";

    if (knownSourceName && !looksTechnicalSourceLabel(knownSourceName)) {
      return truncate(knownSourceName, 30);
    }

    if (item.sourceName && !looksTechnicalSourceLabel(item.sourceName)) {
      return truncate(item.sourceName, 30);
    }

    if (item.sourceUrl) {
      return truncate(sourceDomain(item.sourceUrl), 30);
    }

    if (item.sourceId && !looksTechnicalSourceLabel(item.sourceId)) {
      return truncate(item.sourceId, 30);
    }

    return "";
  }

  function buildNovelSubtitle(item) {
    const parts = [];
    const author = truncate(item.author, 24);
    const summary = truncate(stripHtml(item.description), 42);
    const sourceLabel = getReadableSourceLabel(item);
    if (author) {
      parts.push(author);
    }
    if (summary) {
      parts.push(summary);
    } else if (sourceLabel) {
      parts.push(sourceLabel);
    }
    return parts.join(" â€¢ ");
  }

  function createNovelCard(item, options = {}) {
    const card = document.createElement("div");
    card.className = "novel-card";
    card.title = stripHtml(item.description) || item.title || "";

    const statusKey = String(item.status || "").toLowerCase();
    const badgeClass =
      statusKey === "completed" || statusKey === "complete" || statusKey === "finished"
        ? "badge-completed"
        : "badge-ongoing";
    const progress =
      Number(item.totalChapters) > 0
        ? Math.max(
            0,
            Math.min(100, Math.round(((Number(item.downloadedChapters) || 0) / Number(item.totalChapters)) * 100))
          )
        : 0;
    const progressLabel = formatChapterProgress(item.downloadedChapters, item.totalChapters);
    const syncChipClass =
      item.syncStatus === "error" ? "error" : isLibraryFullyDownloaded(item) ? "ready" : "pending";
    const syncChipLabel =
      item.syncStatus === "error"
        ? "Lỗi tải"
        : isLibraryFullyDownloaded(item)
          ? "Đã tải đủ"
          : hasDownloadedChapters(item)
            ? "Đang tải dở"
            : "Chưa tải";
    const preferredCoverUrl = firstText(buildLibraryCoverUrl(item), item.coverUrl);
    const coverMarkup = preferredCoverUrl
      ? `<img class="novel-card-cover" src="${escapeHtml(preferredCoverUrl)}" alt="${escapeHtml(
          item.title || ""
        )}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
      : createCoverPlaceholderHtml(item.id || item.sourceUrl || item.title, item.title);

    card.innerHTML = `
      <div class="novel-card-cover-wrap">
        ${coverMarkup}
        <span class="novel-card-badge ${badgeClass}">${escapeHtml(statusLabel(item.status))}</span>
        ${
          options.showProgress && progress > 0 && progress < 100
            ? `
              <div class="novel-card-progress">
                <div class="novel-card-progress-bar" style="width:${progress}%"></div>
              </div>
            `
            : ""
        }
      </div>
      <div class="novel-card-title">${escapeHtml(item.title || "Không có tiêu đề")}</div>
      <div class="novel-card-sub">${escapeHtml(buildNovelSubtitle(item) || truncate(sourceDomain(item.sourceUrl), 36))}</div>
      <div class="novel-card-meta">
        <span class="novel-card-progress-label">${escapeHtml(progressLabel)}</span>
        <span class="novel-card-sync ${syncChipClass}">${escapeHtml(syncChipLabel)}</span>
      </div>
    `;

    if (options.onClick) {
      card.addEventListener("click", options.onClick);
    }

    attachNovelCoverFallback(card, item);

    return card;
  }


