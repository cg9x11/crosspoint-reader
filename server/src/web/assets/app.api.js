  function buildError(message, status, code, payload) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    error.payload = payload;
    return error;
  }

  function redirectToLogin() {
    const next = `${location.pathname}${location.search}`;
    location.href = `/login?next=${encodeURIComponent(next)}`;
  }

  async function apiJson(url, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };
    const request = {
      method: options.method || "GET",
      headers
    };

    if (options.body !== undefined) {
      request.body = JSON.stringify(options.body);
      request.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, request);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    if (!response.ok) {
      const message =
        payload && typeof payload === "object"
          ? payload.message || payload.error || response.statusText || "Yêu cầu thất bại."
          : String(payload || response.statusText || "Yêu cầu thất bại.");

      if (response.status === 401 && boot.page !== "login") {
        redirectToLogin();
      }
      if (response.status === 403 && payload?.error === "PASSWORD_CHANGE_REQUIRED") {
        state.auth.mustChangePassword = true;
        openChangePasswordModal(true);
      }

      throw buildError(message, response.status, payload?.error || null, payload);
    }

    return payload;
  }

  async function apiForm(url, formData, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };
    const request = {
      method: options.method || "POST",
      headers,
      body: formData
    };

    const response = await fetch(url, request);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    if (!response.ok) {
      const message =
        payload && typeof payload === "object"
          ? payload.message || payload.error || response.statusText || "Upload failed."
          : String(payload || response.statusText || "Upload failed.");

      if (response.status === 401 && boot.page !== "login") {
        redirectToLogin();
      }
      if (response.status === 403 && payload?.error === "PASSWORD_CHANGE_REQUIRED") {
        state.pendingPasswordPath = `${location.pathname}${location.search}`;
        state.auth.mustChangePassword = true;
        openChangePasswordModal(true);
      }

      throw buildApiError(message, response, payload);
    }

    return payload;
  }

  function apiFormUpload(url, formData, { method = "POST", headers = {}, onProgress, onUploadComplete } = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader("Accept", "application/json");
      Object.entries(headers || {}).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || typeof onProgress !== "function") {
          return;
        }
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)))
        });
      };
      xhr.upload.onload = () => {
        if (typeof onUploadComplete === "function") {
          onUploadComplete();
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed."));
      xhr.onload = () => {
        const contentType = xhr.getResponseHeader("content-type") || "";
        const payload = contentType.includes("application/json")
          ? JSON.parse(xhr.responseText || "null")
          : xhr.responseText;

        if (xhr.status < 200 || xhr.status >= 300) {
          const message =
            payload && typeof payload === "object"
              ? payload.message || payload.error || xhr.statusText || "Upload failed."
              : String(payload || xhr.statusText || "Upload failed.");
          reject(buildApiError(message, { status: xhr.status, statusText: xhr.statusText }, payload));
          return;
        }

        resolve(payload);
      };

      xhr.send(formData);
    });
  }

  function setUploadProgressState(prefix, message = "", percent = null) {
    const status = $id(`${prefix}-upload-status`);
    const bar = $id(`${prefix}-upload-progress-bar`);
    const value = $id(`${prefix}-upload-progress-value`);
    if (status) {
      status.textContent = message;
    }
    if (bar) {
      bar.style.width = `${Math.max(0, Math.min(100, Number(percent) || 0))}%`;
    }
    if (value) {
      value.textContent = percent === null ? "" : `${percent}%`;
    }
  }

  async function loadLibrary(force = false) {
    if (state.auth.mustChangePassword) {
      return state.libraryItems;
    }
    if (state.libraryLoaded && !force) {
      return state.libraryItems;
    }

    const payload = await apiJson("/api/library/novels");
    state.libraryItems = Array.isArray(payload.items) ? payload.items : [];
    state.libraryLoaded = true;
    return state.libraryItems;
  }

  async function loadEnabledSources(force = false) {
    if (state.auth.mustChangePassword) {
      return state.enabledSources;
    }
    if (state.enabledSourcesLoaded && !force) {
      return state.enabledSources;
    }

    const payload = await apiJson("/api/sources");
    state.enabledSources = Array.isArray(payload.items) ? payload.items : [];
    state.enabledSourcesLoaded = true;
    if (!state.activeSourceId && state.enabledSources[0]) {
      state.activeSourceId = state.enabledSources[0].id;
    }
    return state.enabledSources;
  }

  async function loadExtensions(force = false) {
    if (state.auth.mustChangePassword) {
      return {
        installed: state.installedExtensions,
        catalog: state.catalogExtensions
      };
    }
    if (state.extensionsLoaded && !force) {
      return {
        installed: state.installedExtensions,
        catalog: state.catalogExtensions
      };
    }

    const payload = await apiJson("/api/extensions");
    state.installedExtensions = Array.isArray(payload.installed) ? payload.installed : [];
    state.catalogExtensions = Array.isArray(payload.catalog) ? payload.catalog : [];
    state.extensionsLoaded = true;
    return {
      installed: state.installedExtensions,
      catalog: state.catalogExtensions
    };
  }

  async function loadRegistries(force = false) {
    if (state.auth.mustChangePassword) {
      return state.registries;
    }
    if (state.registriesLoaded && !force) {
      return state.registries;
    }

    const payload = await apiJson("/api/extensions/registries");
    state.registries = Array.isArray(payload.items) ? payload.items : [];
    state.registriesLoaded = true;
    return state.registries;
  }

  async function loadTasks(force = false) {
    if (state.auth.mustChangePassword) {
      return state.tasks;
    }
    if (state.tasksLoaded && !force) {
      return state.tasks;
    }

    const payload = await apiJson("/api/tasks/jobs");
    state.tasks = Array.isArray(payload.items) ? payload.items : [];
    state.tasksLoaded = true;
    return state.tasks;
  }

  async function loadSystem(force = false) {
    if (state.auth.mustChangePassword) {
      return state.system;
    }
    if (state.system && !force) {
      return state.system;
    }

    state.system = await apiJson("/api/settings/system");
    return state.system;
  }

  async function loadSettingsBundle(force = false) {
    if (state.auth.mustChangePassword) {
      return {
        settings: state.settings,
        system: state.system,
        storage: state.storage
      };
    }
    if (state.settingsLoaded && !force) {
      return {
        settings: state.settings,
        system: state.system,
        storage: state.storage
      };
    }

    const [settingsPayload, systemPayload, storagePayload] = await Promise.all([
      apiJson("/api/settings"),
      apiJson("/api/settings/system"),
      apiJson("/api/settings/storage")
    ]);

    state.settings = Array.isArray(settingsPayload.items) ? settingsPayload.items : [];
    state.system = systemPayload || null;
    state.storage = storagePayload || null;
    state.settingsLoaded = true;
    return {
      settings: state.settings,
      system: state.system,
      storage: state.storage
    };
  }

  async function loadReady(force = false) {
    if (state.readyLoaded && !force) {
      return state.ready;
    }

    const response = await fetch("/readyz", {
      headers: { Accept: "application/json" }
    });
    const payload = await response.json().catch(() => null);
    state.ready = payload || null;
    state.readyLoaded = true;
    updateServerStatusPill(payload?.status === "ready");
    return state.ready;
  }

  async function refreshSourceInventory(force = true) {
    await Promise.all([loadExtensions(force), loadEnabledSources(force), loadRegistries(force).catch(() => [])]);
  }

  function getInstalledExtensionById(extensionId) {
    return state.installedExtensions.find((item) => item.id === extensionId) || null;
  }

  function getEnabledSourceById(sourceId) {
    return state.enabledSources.find((item) => item.id === sourceId) || null;
  }

  function getLibraryById(novelId) {
    return state.libraryItems.find((item) => item.id === novelId) || null;
  }

  function findLibraryBySource(sourceId, sourceUrl) {
    return (
      state.libraryItems.find(
        (item) => item.sourceId === sourceId && sameSourceUrl(item.sourceUrl, sourceUrl)
      ) || null
    );
  }

  function hasDownloadedChapters(item) {
    return Number(item.downloadedChapters) > 0;
  }

  function isLibraryFullyDownloaded(item) {
    return Number(item.totalChapters) > 0 && Number(item.downloadedChapters) >= Number(item.totalChapters);
  }

  function isLibraryDownloaded(item) {
    return hasDownloadedChapters(item);
  }

  function sortByPriority(items) {
    const priorityIds = state.system?.sourcePolicy?.priorityIds || [];
    const priorityMap = new Map(priorityIds.map((id, index) => [id, index]));

    return [...items].sort((left, right) => {
      const leftPriority = priorityMap.has(left.id) ? priorityMap.get(left.id) : Number.MAX_SAFE_INTEGER;
      const rightPriority = priorityMap.has(right.id) ? priorityMap.get(right.id) : Number.MAX_SAFE_INTEGER;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      if (Boolean(right.enabled) !== Boolean(left.enabled)) {
        return Number(Boolean(right.enabled)) - Number(Boolean(left.enabled));
      }

      return String(left.name || left.title || "").localeCompare(String(right.name || right.title || ""), "vi");
    });
  }

  function getSourcePolicyAllowlist() {
    const ids = state.system?.sourcePolicy?.enabledAllowlist;
    return Array.isArray(ids) && ids.length ? new Set(ids) : null;
  }

  function filterInstalledBySourcePolicy(items) {
    const allowlist = getSourcePolicyAllowlist();
    return allowlist ? items.filter((item) => allowlist.has(item.id)) : items;
  }

  function isSourceHiddenByPolicy(sourceId) {
    const allowlist = getSourcePolicyAllowlist();
    return Boolean(sourceId && allowlist && !allowlist.has(sourceId));
  }

  function isChapterFailed(status) {
    return status === "fetch_failed" || status === "build_failed";
  }

  function isChapterRetryable(chapter) {
    return Boolean(chapter?.id) && isChapterFailed(chapter.status);
  }

  function isChapterPreviewable(chapter) {
    return Boolean(chapter?.id) && chapter.status === "published";
  }

  function taskStateLabel(stateValue) {
    if (stateValue === "running") {
      return "Đang chạy";
    }
    if (stateValue === "queued") {
      return "Đang xếp hàng";
    }
    if (stateValue === "stopped") {
      return "Đã dừng";
    }
    return "Hoàn tất";
  }

  function taskStateTone(stateValue) {
    if (stateValue === "running" || stateValue === "queued") {
      return "pending";
    }
    if (stateValue === "stopped") {
      return "error";
    }
    return "ready";
  }

  function taskTriggerLabel(task) {
    const value = String(task?.triggerType || "").toLowerCase();
    if (value === "upload") {
      return "Upload truyện";
    }
    if (value === "upload_chapters") {
      return "Upload chapter";
    }
    if (value === "rebuild") {
      return "Rebuild local";
    }
    if (value === "export") {
      return "Xuất EPUB";
    }
    if (value === "manual") {
      return "Đồng bộ tay";
    }
    if (value === "retry") {
      return "Chạy lại";
    }
    if (value === "cron") {
      return "Đồng bộ lịch";
    }
    if (value === "add") {
      return "Thêm vào thư viện";
    }
    return "Tác vụ";
  }

  function formatChapterProgress(downloadedChapters, totalChapters) {
    const downloaded = Number(downloadedChapters) || 0;
    const total = Number(totalChapters) || 0;
    if (total > 0) {
      return `${formatCount(downloaded)}/${formatCount(total)} chương`;
    }
    if (downloaded > 0) {
      return `${formatCount(downloaded)} chương đã tải`;
    }
    return "Chưa tải chương";
  }

  function buildTaskSummary(task) {
    const parts = [taskTriggerLabel(task)];
    if (task?.triggerType === "rebuild" && Number(task.rebuildTargetChapters) > 0) {
      parts.push(
        `${formatCount(task.rebuildCompletedChapters)}/${formatCount(task.rebuildTargetChapters)} chap built`
      );
      if (Number(task.rebuildRemainingChapters) > 0) {
        parts.push(`còn ${formatCount(task.rebuildRemainingChapters)}`);
      }
    } else if (task?.triggerType === "export" && Number(task.exportTargetChapters) > 0) {
      parts.push(
        `${formatCount(task.exportCompletedChapters)}/${formatCount(task.exportTargetChapters)} chap exported`
      );
      if (Number(task.exportRemainingChapters) > 0) {
        parts.push(`còn ${formatCount(task.exportRemainingChapters)}`);
      }
    } else {
      parts.push(formatChapterProgress(task.downloadedChapters, task.totalChapters));
      if (task.remainingChapters > 0) {
        parts.push(`còn ${formatCount(task.remainingChapters)}`);
      }
    }
    if (task.failedChapters > 0) {
      parts.push(`lỗi ${formatCount(task.failedChapters)}`);
    }
    if (task.activeJobs > 0) {
      parts.push(`${formatCount(task.activeJobs)} đang chạy`);
    } else if (task.waitingJobs > 0) {
      parts.push(`${formatCount(task.waitingJobs)} đang chờ`);
    }
    return parts.join(" • ");
  }

  function formatTaskChapterLabel(chapter) {
    if (!chapter) {
      return "";
    }

    const chapterLabel = `Chương ${String(chapter.chapterIndex ?? 0).padStart(3, "0")}`;
    const title = truncate(stripHtml(chapter.title || ""), 56);
    return title ? `${chapterLabel} • ${title}` : chapterLabel;
  }

  function buildTaskErrorMeta(task) {
    const parts = [];
    const chapterLabel = formatTaskChapterLabel(task?.lastErrorChapter);
    if (task?.lastErrorSource === "chapter_fetch") {
      parts.push("Lỗi tải chương");
      if (chapterLabel) {
        parts.push(chapterLabel);
      }
    } else if (task?.lastErrorSource === "chapter_build") {
      parts.push(task?.triggerType === "rebuild" ? "Lỗi rebuild local" : "Lỗi dựng file local");
      if (chapterLabel) {
        parts.push(chapterLabel);
      }
    } else if (task?.lastErrorSource === "sync_run") {
      parts.push("Lỗi đồng bộ nguồn");
    } else if (task?.lastErrorSource === "novel") {
      parts.push("Lỗi tác vụ");
    } else if (chapterLabel) {
      parts.push(chapterLabel);
    }

    const retryCount = Number(task?.lastErrorChapter?.retryCount) || 0;
    if (retryCount > 0) {
      parts.push(`Đã thử ${formatCount(retryCount)} lần`);
    }
    if (task?.lastErrorAt) {
      parts.push(formatRelative(task.lastErrorAt));
    }
    return parts.join(" • ");
  }

  function findKnownSourceById(sourceId) {
    return (
      state.enabledSources.find((item) => item.id === sourceId) ||
      state.installedExtensions.find((item) => item.id === sourceId) ||
      state.catalogExtensions.find((item) => item.id === sourceId) ||
      null
    );
  }

  function formatSourcePolicyNames(ids, emptyLabel) {
    if (!Array.isArray(ids) || !ids.length) {
      return emptyLabel;
    }

    return ids
      .map((sourceId) => findKnownSourceById(sourceId)?.name || sourceId)
      .join(", ");
  }

  function visibleInstalledNames() {
    return sortByPriority(filterInstalledBySourcePolicy(state.enabledSources.length ? state.enabledSources : state.installedExtensions)).map(
      (item) => item.name || item.id
    );
  }

  function createCoverPlaceholderHtml(seed, title) {
    return `
      <div class="cover-placeholder" style="background:${coverGradient(seed)};">
        <span class="cover-placeholder-text">${escapeHtml(title || "Không có bìa")}</span>
      </div>
    `;
  }

  function attachNovelCoverFallback(card, item) {
    const image = card.querySelector(".novel-card-cover");
    if (!image) {
      return;
    }

    image.addEventListener(
      "error",
      () => {
        const wrap = card.querySelector(".novel-card-cover-wrap");
        if (!wrap || wrap.querySelector(".cover-placeholder")) {
          return;
        }
        image.insertAdjacentHTML(
          "afterend",
          createCoverPlaceholderHtml(item.id || item.sourceUrl || item.title, item.title)
        );
        image.remove();
      },
      { once: true }
    );
  }
