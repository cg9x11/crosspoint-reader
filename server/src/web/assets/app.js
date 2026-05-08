"use strict";

(() => {
  const boot = window.__CPR_BOOT__ || {};
  const COVER_COLORS = [
    ["#2d1b4e", "#7c3aed"],
    ["#1a2f1a", "#16a34a"],
    ["#2d1a1a", "#dc2626"],
    ["#1a1f2d", "#2563eb"],
    ["#2d2a1a", "#ca8a04"],
    ["#1a2d2d", "#0891b2"],
    ["#2d1a2d", "#9333ea"],
    ["#1f2d1a", "#65a30d"]
  ];
  const SOURCE_HOST_ALIASES = new Map([
    ["www.docln.sbs", "docln.sbs"],
    ["docln.net", "docln.sbs"],
    ["www.docln.net", "docln.sbs"],
    ["docln.top", "docln.sbs"],
    ["www.docln.top", "docln.sbs"],
    ["ln.hako.vn", "docln.sbs"],
    ["www.ln.hako.vn", "docln.sbs"],
    ["ln.hako.re", "docln.sbs"],
    ["www.ln.hako.re", "docln.sbs"]
  ]);
  const SERVER_SECTIONS = [
    { id: "tasks", label: "Tác vụ", path: "/tasks" },
    { id: "extensions", label: "Extensions", path: "/extensions" },
    { id: "settings", label: "Cài đặt", path: "/settings" }
  ];
  const FALLBACK_AUTH = {
    authenticated: false,
    user: null,
    username: "admin",
    mustChangePassword: false,
    bootstrapMode: false,
    bootstrapCredentials: null
  };
  const state = {
    auth: { ...FALLBACK_AUTH, ...(boot.auth || {}) },
    routeToken: 0,
    routeLoadingToken: 0,
    browseRequestToken: 0,
    activeFilter: "all",
    activeSourceId: null,
    browseSectionId: null,
    browseMode: "home",
    browseHome: null,
    browseItems: [],
    browseNextPage: null,
    browseError: "",
    browseWarning: "",
    searchQuery: "",
    searchTimer: null,
    chapterSort: "desc",
    detailChapterLimit: 150,
    detailContext: "browse",
    detailPayload: null,
    detailLibraryId: null,
    detailRequestUrl: null,
    serverSection: "tasks",
    libraryItems: [],
    libraryLoaded: false,
    enabledSources: [],
    enabledSourcesLoaded: false,
    installedExtensions: [],
    catalogExtensions: [],
    extensionsLoaded: false,
    registries: [],
    registriesLoaded: false,
    tasks: [],
    tasksLoaded: false,
    settings: [],
    settingsLoaded: false,
    system: null,
    storage: null,
    ready: null,
    readyLoaded: false,
    pendingPasswordPath: null
  };

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $id(id) {
    return document.getElementById(id);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function buildRouteLoadingCopy(route) {
    if (route.page === "library") {
      return {
        title: "\u0110ang t\u1ea3i th\u01b0 vi\u1ec7n",
        subtitle: "\u0110\u1ed3ng b\u1ed9 danh s\u00e1ch truy\u1ec7n, ti\u1ebfn \u0111\u1ed9 t\u1ea3i v\u00e0 tr\u1ea1ng th\u00e1i \u0111\u1ecdc..."
      };
    }

    if (route.page === "sources") {
      return {
        title: "\u0110ang t\u1ea3i ngu\u1ed3n",
        subtitle: "Chu\u1ea9n b\u1ecb danh s\u00e1ch ngu\u1ed3n, runtime v\u00e0 policy hi\u1ec3n th\u1ecb..."
      };
    }

    if (route.page === "browse") {
      return {
        title: "\u0110ang chu\u1ea9n b\u1ecb ngu\u1ed3n",
        subtitle: "L\u1ea5y home, t\u00ecm ki\u1ebfm v\u00e0 b\u1ed9 m\u1ee5c c\u1ee7a ngu\u1ed3n truy\u1ec7n..."
      };
    }

    if (route.page === "detail") {
      return {
        title: "\u0110ang m\u1edf truy\u1ec7n",
        subtitle:
          route.detailContext === "library"
            ? "L\u1ea5y metadata th\u01b0 vi\u1ec7n v\u00e0 danh s\u00e1ch ch\u01b0\u01a1ng \u0111\u00e3 t\u1ea3i..."
            : "L\u1ea5y chi ti\u1ebft truy\u1ec7n, m\u00f4 t\u1ea3 v\u00e0 t\u00ecnh tr\u1ea1ng ch\u01b0\u01a1ng t\u1eeb ngu\u1ed3n..."
      };
    }

    if (route.page === "server") {
      const subtitleMap = {
        tasks: "N\u1ea1p runtime, h\u00e0ng \u0111\u1ee3i v\u00e0 l\u1ecbch s\u1eed t\u00e1c v\u1ee5 g\u1ea7n \u0111\u00e2y...",
        extensions: "\u0110\u1ed3ng b\u1ed9 extension \u0111\u00e3 c\u00e0i, catalog v\u00e0 registry ngu\u1ed3n...",
        settings: "T\u1ea3i c\u1ea5u h\u00ecnh h\u1ec7 th\u1ed1ng, storage v\u00e0 ch\u00ednh s\u00e1ch ngu\u1ed3n..."
      };
      return {
        title: "\u0110ang t\u1ea3i b\u1ea3ng \u0111i\u1ec1u khi\u1ec3n",
        subtitle: subtitleMap[route.section] || "Chu\u1ea9n b\u1ecb d\u1eef li\u1ec7u qu\u1ea3n tr\u1ecb server..."
      };
    }

    return {
      title: "\u0110ang t\u1ea3i d\u1eef li\u1ec7u",
      subtitle: "Chu\u1ea9n b\u1ecb n\u1ed9i dung trang..."
    };
  }

  function showRouteLoadingOverlay(route, token) {
    const overlay = $id("route-loading-overlay");
    if (!overlay) {
      return;
    }

    state.routeLoadingToken = token;
    const copy = buildRouteLoadingCopy(route);
    $id("route-loading-title").textContent = copy.title;
    $id("route-loading-subtitle").textContent = copy.subtitle;
    overlay.classList.remove("is-hidden");
  }

  function hideRouteLoadingOverlay(token, force = false) {
    const overlay = $id("route-loading-overlay");
    if (!overlay) {
      return;
    }

    if (!force && token !== state.routeLoadingToken) {
      return;
    }

    overlay.classList.add("is-hidden");
  }

  function stripHtml(value) {
    if (!value) {
      return "";
    }

    const probe = document.createElement("div");
    probe.innerHTML = String(value);
    return probe.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  function truncate(value, length) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!text || text.length <= length) {
      return text;
    }
    return `${text.slice(0, Math.max(0, length - 1)).trimEnd()}…`;
  }

  function getBrowseQuery() {
    return String(state.searchQuery ?? "").trim();
  }

  function hashSeed(value) {
    let hash = 0;
    const text = String(value ?? "");
    for (let index = 0; index < text.length; index += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function coverGradient(seed) {
    const [from, to] = COVER_COLORS[hashSeed(seed) % COVER_COLORS.length];
    return `linear-gradient(160deg, ${from} 0%, ${to} 100%)`;
  }

  function sourceInitials(name) {
    const parts = String(name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const initials = parts.length ? parts.slice(0, 2).map((entry) => entry[0]).join("") : "SR";
    return initials.toUpperCase();
  }

  function sourceDomain(url) {
    try {
      return new URL(String(url)).host.replace(/^www\./, "");
    } catch {
      return truncate(url, 40);
    }
  }

  function normalizeKnownSourceUrl(rawUrl) {
    const value = String(rawUrl || "").trim();
    if (!value) {
      return "";
    }

    try {
      const url = new URL(value);
      const nextHost = SOURCE_HOST_ALIASES.get(url.hostname.toLowerCase());
      if (nextHost) {
        url.hostname = nextHost;
      }
      url.hash = "";
      url.search = "";
      url.pathname = url.pathname.replace(/\/+$/, "") || "/";
      return url.toString();
    } catch {
      return value.replace(/\/+$/, "");
    }
  }

  function sameSourceUrl(left, right) {
    return normalizeKnownSourceUrl(left) === normalizeKnownSourceUrl(right);
  }

  function isSystemSource(item) {
    return Boolean(item?.systemSource || item?.registryId === "system");
  }

  function firstText(...values) {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return "";
  }

  function isUrlLikeText(value) {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  function readableTitleFromUrl(rawUrl) {
    try {
      const url = new URL(String(rawUrl || ""));
      const slug = url.pathname.split("/").filter(Boolean).at(-1) || url.hostname;
      return slug
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
    } catch {
      return String(rawUrl || "Không rõ");
    }
  }

  function resolveDetailTitle(title, sourceUrl) {
    const cleanedTitle = firstText(title);
    if (cleanedTitle && !isUrlLikeText(cleanedTitle)) {
      return cleanedTitle;
    }
    return readableTitleFromUrl(sourceUrl || cleanedTitle || "Khong ro");
  }

  function buildLibraryCoverUrl(item) {
    if (item?.id && item?.coverLocalPath) {
      return `/api/library/novels/${encodeURIComponent(item.id)}/cover`;
    }
    return item?.coverUrl || "";
  }

  function isSourceUpstreamBlockedPayload(payload) {
    return Boolean(payload && typeof payload === "object" && payload.blocked);
  }

  function isSourceUpstreamBlockedError(error) {
    return Boolean(
      error?.code === "SOURCE_UPSTREAM_BLOCKED" ||
        error?.payload?.error === "SOURCE_UPSTREAM_BLOCKED"
    );
  }

  function getBrowsePreviewItems() {
    const sectionItems = Array.isArray(state.browseHome?.sections)
      ? state.browseHome.sections.flatMap((section) => section.items || [])
      : [];
    return [...sectionItems, ...(Array.isArray(state.browseItems) ? state.browseItems : [])];
  }

  function findBrowsePreviewItem(sourceId, requestUrl) {
    const normalizedRequestUrl = normalizeKnownSourceUrl(requestUrl);
    return (
      getBrowsePreviewItems().find(
        (item) => item?.detailUrl && item?.id && sameSourceUrl(item.detailUrl, normalizedRequestUrl)
      ) || null
    );
  }

  function statusLabel(status) {
    const key = String(status ?? "").toLowerCase();
    const labels = {
      completed: "Hoàn thành",
      complete: "Hoàn thành",
      ongoing: "Đang ra",
      updating: "Đang cập nhật",
      finished: "Hoàn thành",
      active: "Đang hoạt động",
      idle: "Chờ"
    };
    return labels[key] || (status ? String(status) : "Chưa rõ");
  }

  function syncStatusLabel(status) {
    const key = String(status ?? "").toLowerCase();
    const labels = {
      ready: "Sẵn sàng",
      syncing: "Đang đồng bộ",
      error: "Lỗi",
      idle: "Chưa đồng bộ",
      pending: "Đang chờ"
    };
    return labels[key] || (status ? String(status) : "Chưa rõ");
  }

  function formatCount(value) {
    const numeric = Number(value) || 0;
    if (numeric >= 1000) {
      return `${(numeric / 1000).toFixed(numeric >= 10000 ? 0 : 1)}k`;
    }
    return String(numeric);
  }

  function formatFileSize(value) {
    const numeric = Number(value) || 0;
    if (numeric <= 0) {
      return "";
    }
    if (numeric < 1024) {
      return `${numeric} B`;
    }

    const units = ["KB", "MB", "GB"];
    let size = numeric / 1024;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
  }

  function formatRelative(value) {
    if (!value) {
      return "Chưa có";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const diffMs = date.getTime() - Date.now();
    const diffMinutes = Math.round(diffMs / 60000);
    const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

    if (Math.abs(diffMinutes) < 1) {
      return "Vừa xong";
    }
    if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, "minute");
    }

    const diffHours = Math.round(diffMs / 3600000);
    if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, "hour");
    }

    const diffDays = Math.round(diffMs / 86400000);
    if (Math.abs(diffDays) < 7) {
      return rtf.format(diffDays, "day");
    }

    return date.toLocaleString("vi-VN");
  }

  function updateServerStatusPill(isOnline) {
    const pill = $id("sidebar-server-status");
    if (!pill) {
      return;
    }
    pill.querySelector(".pill-text").textContent = isOnline ? "OPDS: online" : "OPDS: offline";
  }

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
    const parts = [formatChapterProgress(task.downloadedChapters, task.totalChapters)];
    if (task.remainingChapters > 0) {
      parts.push(`còn ${formatCount(task.remainingChapters)}`);
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
      parts.push("Lỗi dựng EPUB");
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
      parts.push(`đã thử ${formatCount(retryCount)} lần`);
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
    return sortByPriority(filterInstalledBySourcePolicy(state.installedExtensions)).map(
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

  function sourceBrowsePath(sourceId, detailUrl) {
    const path = `/sources/${encodeURIComponent(sourceId)}`;
    if (!detailUrl) {
      return path;
    }

    const params = new URLSearchParams();
    params.set("detail", normalizeKnownSourceUrl(detailUrl));
    return `${path}?${params.toString()}`;
  }

  function libraryDetailPath(novelId) {
    return `/library/${encodeURIComponent(novelId)}`;
  }

  function serverSectionPath(section = "tasks") {
    if (section === "extensions") {
      return "/extensions";
    }
    if (section === "settings") {
      return "/settings";
    }
    return "/tasks";
  }

  function defaultBrowsePath() {
    const sourceId =
      state.activeSourceId && getEnabledSourceById(state.activeSourceId)
        ? state.activeSourceId
        : state.enabledSources[0]?.id;
    return sourceId ? sourceBrowsePath(sourceId) : "/sources";
  }

  function resetBrowseState() {
    state.searchQuery = "";
    state.browseItems = [];
    state.browseNextPage = null;
    state.browseSectionId = null;
    state.browseError = "";
    state.browseWarning = "";
  }

  function openSourceBrowse(sourceId) {
    resetBrowseState();
    navigateTo(sourceBrowsePath(sourceId));
  }

  function parseRoute() {
    const currentUrl = new URL(location.href);
    const rawPath = currentUrl.pathname.replace(/\/+$/, "") || "/";

    if (rawPath === "/sources") {
      return {
        page: "sources",
        navPage: "sources"
      };
    }

    if (rawPath.startsWith("/sources/")) {
      const sourceId = decodeURIComponent(rawPath.slice("/sources/".length));
      const detailUrl = currentUrl.searchParams.get("detail");
      if (detailUrl) {
        return {
          page: "detail",
          navPage: "browse",
          detailContext: "browse",
          sourceId,
          detailUrl
        };
      }

      return {
        page: "browse",
        navPage: "browse",
        sourceId
      };
    }

    if (rawPath === "/tasks") {
      return {
        page: "server",
        navPage: "server",
        section: "tasks"
      };
    }

    if (rawPath === "/extensions") {
      return {
        page: "server",
        navPage: "server",
        section: "extensions"
      };
    }

    if (rawPath === "/settings") {
      return {
        page: "server",
        navPage: "server",
        section: "settings"
      };
    }

    if (rawPath.startsWith("/library/")) {
      return {
        page: "detail",
        navPage: "library",
        detailContext: "library",
        novelId: decodeURIComponent(rawPath.slice("/library/".length))
      };
    }

    return {
      page: "library",
      navPage: "library"
    };
  }

  function navigateTo(path, replace = false) {
    const target = String(path || "/library");
    const current = `${location.pathname}${location.search}`;
    if (target !== current) {
      history[replace ? "replaceState" : "pushState"]({}, "", target);
    }
    void handleRoute();
  }

  function activatePage(page, navPage) {
    $$(".page").forEach((item) => item.classList.remove("active"));
    $id(`page-${page}`)?.classList.add("active");

    $$(".nav-item, .bnav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.page === navPage);
    });

    $id("main")?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }

  function syncBrowseSearchUi() {
    const input = $id("browse-search");
    const clearButton = $id("search-clear");
    const activeSource = state.activeSourceId ? getEnabledSourceById(state.activeSourceId) : null;

    if (input) {
      input.value = state.searchQuery;
      input.placeholder = activeSource
        ? `Tìm truyện trên ${activeSource.name}…`
        : "Tìm truyện, tác giả…";
    }
    if (clearButton) {
      clearButton.style.display = state.searchQuery ? "block" : "none";
    }
  }

  function submitBrowseSearch() {
    const input = $id("browse-search");
    state.searchQuery = input?.value ?? "";
    syncBrowseSearchUi();
    void refreshBrowseContent({ append: false });
  }

  function ensureServerSectionBar() {
    if ($id("server-section-bar")) {
      return;
    }

    const header = $("#page-server .page-header");
    if (!header) {
      return;
    }

    const bar = document.createElement("div");
    bar.className = "filter-bar";
    bar.id = "server-section-bar";

    SERVER_SECTIONS.forEach((section) => {
      const button = document.createElement("button");
      button.className = "filter-btn";
      button.type = "button";
      button.textContent = section.label;
      button.addEventListener("click", () => navigateTo(section.path));
      bar.appendChild(button);
    });

    header.appendChild(bar);
  }

  function updateServerSectionBar(sectionId) {
    state.serverSection = sectionId;
    $$("#server-section-bar .filter-btn").forEach((button, index) => {
      button.classList.toggle("active", SERVER_SECTIONS[index]?.id === sectionId);
    });
  }

  function ensureDynamicShell() {
    ensureServerSectionBar();

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

  function openModal(id) {
    const modal = $id(id);
    if (modal) {
      modal.style.display = "flex";
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
    return parts.join(" • ");
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

  function renderLibrary() {
    const grid = $id("library-grid");
    const empty = $id("library-empty");
    if (!grid || !empty) {
      return;
    }

    let items = [...state.libraryItems];
    if (state.activeFilter === "ongoing") {
      items = items.filter((item) => String(item.status).toLowerCase() !== "completed");
    } else if (state.activeFilter === "completed") {
      items = items.filter((item) => String(item.status).toLowerCase() === "completed");
    } else if (state.activeFilter === "downloaded") {
      items = items.filter((item) => hasDownloadedChapters(item));
    }

    grid.innerHTML = "";
    if (!items.length) {
      grid.style.display = "none";
      empty.style.display = "flex";
      return;
    }

    grid.style.display = "grid";
    empty.style.display = "none";

    items.forEach((item) => {
      grid.appendChild(
        createNovelCard(item, {
          showProgress: true,
          onClick: () => navigateTo(libraryDetailPath(item.id))
        })
      );
    });
  }

  function renderBrowseSourceTabs() {
    const container = $id("source-tabs");
    if (!container) {
      return;
    }

    container.innerHTML = "";
    const items = sortByPriority(state.enabledSources);
    items.forEach((source) => {
      const button = document.createElement("button");
      button.className = `source-tab${source.id === state.activeSourceId ? " active" : ""}`;
      button.type = "button";
      button.innerHTML = `<span class="source-tab-dot"></span>${escapeHtml(source.name)}`;
      button.addEventListener("click", () => openSourceBrowse(source.id));
      container.appendChild(button);
    });
  }

  function renderBrowseCategoryBar() {
    const bar = $id("category-bar");
    if (!bar) {
      return;
    }

    bar.innerHTML = "";
    if (getBrowseQuery()) {
      const button = document.createElement("button");
      button.className = "cat-btn active";
      button.type = "button";
      button.textContent = "Kết quả";
      bar.appendChild(button);
      return;
    }

    const sections = Array.isArray(state.browseHome?.sections) ? state.browseHome.sections : [];
    if (!sections.length) {
      bar.style.display = "none";
      return;
    }

    bar.style.display = "flex";
    sections.forEach((section) => {
      const button = document.createElement("button");
      button.className = `cat-btn${section.id === state.browseSectionId ? " active" : ""}`;
      button.type = "button";
      button.textContent = section.title;
      button.addEventListener("click", () => {
        state.browseSectionId = section.id;
        renderBrowse();
      });
      bar.appendChild(button);
    });
  }

  function renderBrowse() {
    const grid = $id("browse-grid");
    const loadMoreWrap = $id("load-more-btn")?.parentElement;
    if (!grid) {
      return;
    }

    const browseQuery = getBrowseQuery();

    renderBrowseSourceTabs();
    renderBrowseCategoryBar();
    syncBrowseSearchUi();

    const items = browseQuery
      ? state.browseItems
      : state.browseHome?.sections?.find((section) => section.id === state.browseSectionId)?.items || [];

    grid.innerHTML = "";
    if (state.browseError) {
      setMessageInGrid(
        grid,
        "Không tải được dữ liệu",
        state.browseError,
        "Tải lại",
        () => void refreshBrowseContent({ append: false })
      );
    } else if (state.browseWarning && !items.length) {
      setMessageInGrid(
        grid,
        "Nguồn đang chặn truy cập",
        state.browseWarning,
        browseQuery ? "Xóa tìm kiếm" : "Tải lại",
        browseQuery
          ? () => {
              resetBrowseState();
              syncBrowseSearchUi();
              void refreshBrowseContent({ append: false });
            }
          : () => void refreshBrowseContent({ append: false })
      );
    } else if (!state.enabledSources.length) {
      setMessageInGrid(
        grid,
        "Chưa có nguồn đang bật",
        "Vào mục Nguồn để bật Hako, TruyenFull hoặc cài thêm extension.",
        "Mở Nguồn",
        () => navigateTo("/sources")
      );
    } else if (!items.length && !browseQuery && !(state.browseHome?.sections?.length || 0)) {
      setMessageInGrid(
        grid,
        "Nguồn chưa có home",
        "Nguồn này không trả về trang chủ. Hãy dùng ô tìm kiếm để duyệt truyện.",
        "Tập trung ô tìm kiếm",
        () => $id("browse-search")?.focus()
      );
    } else if (!items.length) {
      setMessageInGrid(
        grid,
        "Không có truyện phù hợp",
        browseQuery ? "Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm." : "Mục này hiện chưa có dữ liệu.",
        browseQuery ? "Xóa tìm kiếm" : "",
        browseQuery
          ? () => {
              resetBrowseState();
              syncBrowseSearchUi();
              void refreshBrowseContent({ append: false });
            }
          : null
      );
    } else {
      items.forEach((item) => {
        grid.appendChild(
          createNovelCard(item, {
            onClick: () => navigateTo(sourceBrowsePath(state.activeSourceId, item.detailUrl))
          })
        );
      });
    }

    if (loadMoreWrap) {
      loadMoreWrap.style.display = browseQuery && state.browseNextPage ? "flex" : "none";
    }
  }

  function renderBrowseLoading() {
    renderBrowseSourceTabs();
    renderBrowseCategoryBar();
    syncBrowseSearchUi();
    showNovelSkeleton("browse-grid", 12);
    const loadMoreWrap = $id("load-more-btn")?.parentElement;
    if (loadMoreWrap) {
      loadMoreWrap.style.display = "none";
    }
  }

  function renderSourcesLoading() {
    const list = $id("sources-list");
    if (!list) {
      return;
    }
    setMessageInBlock(list, "Đang tải nguồn", "Đồng bộ danh sách extension và nguồn đang bật.");
  }

  function renderSources() {
    const list = $id("sources-list");
    if (!list) {
      return;
    }

    list.innerHTML = "";
    const items = sortByPriority(filterInstalledBySourcePolicy(state.installedExtensions));
    if (!items.length && state.installedExtensions.length) {
      setMessageInBlock(
        list,
        "Chưa có nguồn phù hợp với policy hiện tại",
        "Máy chủ đang ẩn toàn bộ nguồn không nằm trong allowlist production. Mở Extensions hoặc Cài đặt để kiểm tra policy.",
        "Mở Extensions",
        () => navigateTo("/extensions")
      );
      return;
    }
    if (!items.length) {
      setMessageInBlock(
        list,
        "Chưa có extension",
        "Thêm manifest hoặc refresh registry để cài nguồn mới.",
        "Thêm nguồn",
        () => openModal("add-source-modal")
      );
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "source-card";
      card.innerHTML = `
        <div class="source-icon-wrap">${renderSourceIconHtml(item)}</div>
        <div class="source-info">
          <div class="source-name">${escapeHtml(item.name || item.id)}</div>
          <div class="source-meta">
            <span class="source-domain">${escapeHtml(
              item.sourceUrl ? sourceDomain(item.sourceUrl) : item.registryName || item.runtimeKind || "local"
            )}</span>
            <span class="source-ver">v${escapeHtml(item.version || "0")}</span>
          </div>
          <div class="source-desc">${escapeHtml(
            truncate(
              item.description ||
                (item.enabled
                  ? "Nguồn đang sẵn sàng để duyệt home, tìm kiếm và đồng bộ vào thư viện."
                  : "Nguồn đã cài nhưng đang tắt. Bật lại để duyệt home và tải truyện."),
              120
            )
          )}</div>
        </div>
        <div class="source-actions">
          <button class="source-browse-btn" type="button">${item.enabled && item.runtimeSupported ? "Duyệt" : "Chi tiết"}</button>
          <label class="toggle-switch">
            <input type="checkbox" ${item.enabled ? "checked" : ""}>
            <span class="toggle-track"></span>
          </label>
        </div>
      `;

      card.addEventListener("click", () => openExtensionInfoModal(item, true));

      card.querySelector(".source-browse-btn")?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (false) {
          void showSourceInPolicy(item.id).catch((error) => {
            showToast("!", "Không hiển thị được nguồn", error.message);
          });
        } else if (item.enabled && item.runtimeSupported) {
          openSourceBrowse(item.id);
        } else {
          openExtensionInfoModal(item, true);
        }
      });

      card.querySelector("input[type=checkbox]")?.addEventListener("change", (event) => {
        event.stopPropagation();
        void setSourceEnabled(item.id, event.currentTarget.checked);
      });
      card.querySelector(".toggle-switch")?.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      list.appendChild(card);
    });

    const hiddenInstalledCount = Math.max(0, state.installedExtensions.length - items.length);
    if (hiddenInstalledCount > 0 || state.catalogExtensions.length > 0) {
      const manageCard = document.createElement("div");
      manageCard.className = "source-card source-card-manage";
      manageCard.innerHTML = `
        <div class="source-icon-wrap">EX</div>
        <div class="source-info">
          <div class="source-name">Extensions nguồn</div>
          <div class="source-meta">
            <span class="source-domain">${escapeHtml(
              `${items.filter((item) => item.enabled).length} đang bật • ${hiddenInstalledCount} ẩn • ${state.catalogExtensions.length} catalog`
            )}</span>
          </div>
          <div class="source-desc">${escapeHtml(
            hiddenInstalledCount > 0
              ? "Mở để xem nguồn ẩn bởi policy production, sync registry và cài hoặc gỡ extension."
              : "Mở để sync registry, duyệt catalog và quản lý extension nguồn."
          )}</div>
        </div>
        <div class="source-actions">
          <button class="source-browse-btn" type="button">Mở Extensions</button>
        </div>
      `;
      const manageMeta = manageCard.querySelector(".source-domain");
      if (manageMeta) {
        manageMeta.textContent = `${items.filter((item) => item.enabled).length} đang bật • ${hiddenInstalledCount} ẩn bởi policy`;
      }
      const manageDesc = manageCard.querySelector(".source-desc");
      if (manageDesc) {
        manageDesc.textContent =
          hiddenInstalledCount > 0
            ? "Mở để sync registry, xem nguồn đang bị ẩn và cài hoặc gỡ extension."
            : "Mở để sync registry, duyệt catalog và cấu hình nguồn đang cài.";
      }
      const manageButton = manageCard.querySelector("button");
      if (manageButton) {
        manageButton.textContent = "Quản lý nguồn";
      }
      manageButton?.addEventListener("click", () => navigateTo("/extensions"));
      manageCard.addEventListener("click", () => navigateTo("/extensions"));
      list.appendChild(manageCard);
    }
  }

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
    const addButton = $id("btn-add-library");
    const syncButton = $id("btn-download-all");
    const rebuildButton = $id("btn-rebuild-library");
    const exportButton = $id("btn-export-epub");
    const removeLibraryButton = $id("btn-remove-library");
    const openLibraryButton = $id("btn-in-library");
    const sourceBlocked = Boolean(detail.upstreamBlocked);

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
    if (originalUrl) {
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
    removeLibraryButton.style.display = detail.libraryItem ? "block" : "none";
    openLibraryButton.style.display = detail.libraryItem && detail.kind !== "library" ? "block" : "none";
    addButton.disabled = sourceBlocked;
    syncButton.disabled = sourceBlocked;
    rebuildButton.disabled = !detail.libraryItem;
    exportButton.disabled = !detail.libraryItem || !Number(detail.libraryItem?.downloadedChapters);

    syncButton.textContent =
      sourceBlocked
        ? "Nguồn đang chặn"
        : detail.libraryItem?.syncStatus === "error"
          ? "↻ Thử lại đồng bộ"
          : "↻ Đồng bộ lại";
    rebuildButton.textContent = "↻ Rebuild local files";
    exportButton.textContent = "⇩ Xuất EPUB tổng hợp";
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
      const retryButton = isChapterRetryable(chapter)
        ? `<button class="chapter-retry-btn" type="button">Tải lại</button>`
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
        </div>
      `;
      if (isChapterPreviewable(chapter) || chapter.sourceUrl) {
        row.addEventListener("click", (event) => {
          if (event.target.closest(".chapter-retry-btn, .chapter-view-btn")) {
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

  function renderServerLoading(sectionId) {
    updateServerSectionBar(sectionId);
    const cards = [
      $("#page-server .status-card"),
      $("#page-server .stats-card"),
      $("#page-server .log-card"),
      $("#page-server .connect-card")
    ];
    cards.forEach((card) => {
      if (card) {
        card.innerHTML = `<p class="form-hint" style="margin:0;">Đang tải dữ liệu server…</p>`;
      }
    });
  }

  function renderLockedServerState() {
    updateServerSectionBar("settings");
    const statusCard = $("#page-server .status-card");
    const statsCard = $("#page-server .stats-card");
    const logCard = $("#page-server .log-card");
    const connectCard = $("#page-server .connect-card");

    statusCard.innerHTML = `
      <div class="server-card-header">
        <span class="card-label">Bảo mật</span>
      </div>
      <div class="status-indicator offline">
        <div class="status-pulse"></div>
        <span class="status-text">Cần đổi mật khẩu</span>
      </div>
      <p class="server-hint">Phiên bootstrap đang khóa API quản trị cho tới khi cập nhật tài khoản admin.</p>
    `;
    statsCard.innerHTML = `<p class="form-hint" style="margin:0;">Đăng nhập lần đầu phải đổi mật khẩu trước khi dùng thư viện, nguồn và extension.</p>`;
    logCard.innerHTML = `<p class="form-hint" style="margin:0;">Sau khi đổi mật khẩu, UI sẽ tải lại toàn bộ dữ liệu server.</p>`;
    connectCard.innerHTML = `<p class="form-hint" style="margin:0;">Tài khoản hiện tại: ${escapeHtml(
      state.auth.username || state.auth.user || "admin"
    )}</p>`;
  }

  function renderServerTasksSection() {
    updateServerSectionBar("tasks");

    const ready = state.ready || { status: "not_ready", checks: {} };
    const system = state.system || {};
    const libraryItems = state.libraryItems || [];
    const totalPublished = libraryItems.reduce(
      (sum, item) => sum + (Number(item.downloadedChapters) || 0),
      0
    );
    const enabledSourceCount = state.enabledSources.length;

    const statusCard = $("#page-server .status-card");
    statusCard.innerHTML = `
      <div class="server-card-header">
        <span class="card-label">OPDS Server</span>
        <label class="toggle-switch">
          <input type="checkbox" id="server-toggle" ${ready.status === "ready" ? "checked" : ""} disabled>
          <span class="toggle-track"></span>
        </label>
      </div>
      <div class="status-indicator ${ready.status === "ready" ? "" : "offline"}">
        <div class="status-pulse"></div>
        <span class="status-text">${ready.status === "ready" ? "Đang chạy" : "Chưa sẵn sàng"}</span>
      </div>
      <div class="server-url-row">
        <code class="server-url" id="server-url">${escapeHtml((system.baseUrl || location.origin) + "/opds")}</code>
        <button class="copy-btn" id="copy-url-btn" type="button" title="Copy URL">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
            <rect x="5" y="5" width="9" height="9" rx="1"></rect>
            <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2"></path>
          </svg>
        </button>
      </div>
      <p class="server-hint">
        DB ${ready.checks?.database ? "ok" : "fail"} • Redis ${ready.checks?.redis ? "ok" : "fail"} • Storage ${
          ready.checks?.storage ? "ok" : "fail"
        }
      </p>
    `;
    statusCard.querySelector("#copy-url-btn")?.addEventListener("click", async () => {
      const value = (system.baseUrl || location.origin) + "/opds";
      try {
        await navigator.clipboard.writeText(value);
        showToast("✓", "Đã copy URL OPDS", value);
      } catch {
        showToast("!", "Không copy được URL", value);
      }
    });

    const statsCard = $("#page-server .stats-card");
    statsCard.innerHTML = `
      <div class="server-stats-grid">
        <div class="server-stat">
          <span class="s-val">${formatCount(libraryItems.length)}</span>
          <span class="s-lbl">Truyện</span>
        </div>
        <div class="server-stat">
          <span class="s-val">${formatCount(totalPublished)}</span>
          <span class="s-lbl">Chương</span>
        </div>
        <div class="server-stat">
          <span class="s-val">${formatCount(enabledSourceCount)}</span>
          <span class="s-lbl">Nguồn</span>
        </div>
      </div>
    `;

    const logCard = $("#page-server .log-card");
    logCard.innerHTML = `<h3 class="card-title">Tác vụ gần đây</h3><div class="log-list" id="server-task-list"></div>`;
    const taskList = logCard.querySelector("#server-task-list");
    const jobs = state.tasks.slice(0, 8);
    if (!jobs.length) {
      setMessageInBlock(taskList, "Chưa có job", "Hàng đợi hiện chưa có tác vụ đồng bộ nào.");
    } else {
      jobs.forEach((job) => {
        const row = document.createElement("div");
        const errorMeta = buildTaskErrorMeta(job);
        row.className = `log-row log-row-actionable${job.lastError ? " has-error" : ""}`;
        row.tabIndex = 0;
        row.setAttribute("role", "button");
        row.setAttribute("aria-label", `Mở chi tiết ${job.title || String(job.id)}`);
        row.innerHTML = `
          <div class="log-dot${taskStateTone(job.state) === "error" ? " error" : ""}"></div>
          <div class="log-content">
            <div class="log-title">${escapeHtml(job.title || String(job.id))}</div>
            <div class="log-time">${escapeHtml(
              `${taskStateLabel(job.state)} • ${buildTaskSummary(job)} • ${formatRelative(job.lastActivityAt || job.createdAt)}`
            )}</div>
            ${
              job.lastError
                ? `
                  ${errorMeta ? `<div class="log-error-context">${escapeHtml(errorMeta)}</div>` : ""}
                  <p class="log-error" title="${escapeHtml(job.lastError)}">${escapeHtml(job.lastError)}</p>
                `
                : ""
            }
          </div>
          <div class="log-actions">
            ${job.retryable ? `<button class="source-browse-btn" type="button">Thử lại</button>` : ""}
          </div>
        `;
        const openDetail = () => navigateTo(libraryDetailPath(job.novelId || job.id));
        row.addEventListener("click", (event) => {
          if (event.target.closest("button")) {
            return;
          }
          openDetail();
        });
        row.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }
          if (event.target.closest("button")) {
            return;
          }
          event.preventDefault();
          openDetail();
        });
        row.querySelector(".source-browse-btn")?.addEventListener("click", (event) => {
          event.stopPropagation();
          void retryJob(job.id);
        });
        taskList.appendChild(row);
      });
    }

    const connectCard = $("#page-server .connect-card");
    connectCard.innerHTML = `
      <h3 class="card-title">Runtime</h3>
      <div class="device-row">
        <div class="device-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
            <rect x="5" y="2" width="14" height="20" rx="2"></rect>
            <circle cx="12" cy="18" r="1" fill="currentColor"></circle>
            <line x1="9" y1="6" x2="15" y2="6"></line>
          </svg>
        </div>
        <div class="device-info">
          <span class="device-name">${escapeHtml(system.roleLabel || system.role || "app")}</span>
          <span class="device-last">${escapeHtml(
            truncate(system.roleDescription || state.storage?.root || "Không rõ storage root", 72)
          )}</span>
        </div>
        <span class="device-dot ${ready.status === "ready" ? "online" : ""}"></span>
      </div>
    `;
  }

  function createExtensionCard(item, { catalog = false, hiddenByPolicy = false } = {}) {
    const card = document.createElement("div");
    card.className = "source-card";
    card.innerHTML = `
      <div class="source-icon-wrap">${renderSourceIconHtml(item)}</div>
      <div class="source-info">
        <div class="source-name">${escapeHtml(item.name || item.id)}</div>
        <div class="source-meta">
          <span class="source-domain">${escapeHtml(
            item.registryName || (item.sourceUrl ? sourceDomain(item.sourceUrl) : item.runtimeKind || "catalog")
          )}</span>
          <span class="source-ver">v${escapeHtml(item.version || "0")}</span>
        </div>
        ${
          item.description
            ? `<div class="source-desc">${escapeHtml(truncate(item.description, 120))}</div>`
            : ""
        }
      </div>
      <div class="source-actions"></div>
    `;

    const actions = card.querySelector(".source-actions");
    if (catalog) {
      const installButton = document.createElement("button");
      installButton.className = "source-browse-btn";
      installButton.type = "button";
      installButton.textContent = "Cài & bật";
      installButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        await installAndEnableExtension(item.id);
      });
      actions.appendChild(installButton);
    } else {
      const detailButton = document.createElement("button");
      detailButton.className = "source-browse-btn";
      detailButton.type = "button";
      if (hiddenByPolicy) {
        detailButton.textContent = "Hiện nguồn";
      }
      detailButton.textContent = item.enabled && item.runtimeSupported ? "Duyệt" : "Chi tiết";
      if (hiddenByPolicy) {
        detailButton.textContent = "Hiện nguồn";
      }
      detailButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (hiddenByPolicy) {
          void showSourceInPolicy(item.id).catch((error) => {
            showToast("!", "Không hiển thị được nguồn", error.message);
          });
        } else if (item.enabled && item.runtimeSupported) {
          openSourceBrowse(item.id);
        } else {
          openExtensionInfoModal(item, true);
        }
      });
      actions.appendChild(detailButton);

      if (!item.bundled && !isSystemSource(item)) {
        const removeButton = document.createElement("button");
        removeButton.className = "source-browse-btn";
        removeButton.type = "button";
        removeButton.textContent = "Gỡ";
        removeButton.addEventListener("click", (event) => {
          event.stopPropagation();
          confirmRemoveExtension(item.id, item.name || item.id);
        });
        actions.appendChild(removeButton);
      }

      const toggle = document.createElement("label");
      toggle.className = "toggle-switch";
      toggle.innerHTML = `
        <input type="checkbox" ${item.enabled ? "checked" : ""}>
        <span class="toggle-track"></span>
      `;
      toggle.querySelector("input")?.addEventListener("change", (event) => {
        event.stopPropagation();
        void setSourceEnabled(item.id, event.currentTarget.checked);
      });
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      actions.appendChild(toggle);
    }

    card.addEventListener("click", () => openExtensionInfoModal(item, !catalog));
    return card;
  }

  function renderServerExtensionsSection() {
    updateServerSectionBar("extensions");

    const registries = state.registries;
    const installed = sortByPriority(state.installedExtensions);
    const visibleInstalled = sortByPriority(filterInstalledBySourcePolicy(installed));
    const visibleInstalledIds = new Set(visibleInstalled.map((item) => item.id));
    const hiddenInstalled = installed.filter((item) => !visibleInstalledIds.has(item.id));
    const installedIds = new Set(installed.map((item) => item.id));
    const catalog = sortByPriority(state.catalogExtensions.filter((item) => !installedIds.has(item.id)));

    const statusCard = $("#page-server .status-card");
    statusCard.innerHTML = `
      <div class="server-card-header">
        <span class="card-label">Registries</span>
        <button class="source-browse-btn" type="button" id="refresh-registries-btn">Refresh</button>
      </div>
      <div class="log-list" id="registry-list"></div>
      <p class="server-hint">Ưu tiên dùng ext-vbook và vbook-extensions. Có thể thêm manifest hoặc registry riêng từ mục Nguồn.</p>
    `;
    statusCard.querySelector("#refresh-registries-btn")?.addEventListener("click", () => void refreshRegistries());

    const registryList = statusCard.querySelector("#registry-list");
    if (!registries.length) {
      setMessageInBlock(registryList, "Chưa có registry", "Thêm manifest hoặc repository để lấy catalog extension.");
    } else {
      registries.forEach((registry) => {
        const row = document.createElement("div");
        row.className = "log-row";
        row.innerHTML = `
          <div class="log-dot${registry.status === "offline" ? " error" : ""}"></div>
          <div class="log-content">
            <div class="log-title">${escapeHtml(registry.name)}</div>
            <div class="log-time">${escapeHtml(
              `${registry.status} • ${registry.extensionCount} ext • ${formatRelative(registry.lastSyncedAt)}`
            )}</div>
          </div>
          <button class="source-browse-btn" type="button">Sync</button>
        `;
        row.querySelector("button")?.addEventListener("click", () => void refreshRegistry(registry.id));
        if (!["ext-vbook", "vbook-extensions"].includes(registry.id)) {
          const removeButton = document.createElement("button");
          removeButton.className = "source-browse-btn";
          removeButton.type = "button";
          removeButton.textContent = "Xóa";
          removeButton.addEventListener("click", () => confirmRemoveRegistry(registry.id, registry.name));
          row.appendChild(removeButton);
        }
        registryList.appendChild(row);
      });
    }

    const statsCard = $("#page-server .stats-card");
    statsCard.innerHTML = `
      <div class="server-stats-grid">
        <div class="server-stat">
          <span class="s-val">${formatCount(visibleInstalled.length)}</span>
          <span class="s-lbl">Đang hiện</span>
        </div>
        <div class="server-stat">
          <span class="s-val">${formatCount(hiddenInstalled.length)}</span>
          <span class="s-lbl">Ẩn bởi policy</span>
        </div>
        <div class="server-stat">
          <span class="s-val">${formatCount(catalog.length)}</span>
          <span class="s-lbl">Catalog</span>
        </div>
      </div>
    `;

    const logCard = $("#page-server .log-card");
    logCard.innerHTML = `
      <h3 class="card-title">Nguồn đã cài</h3>
      <div class="sources-list" id="server-installed-list" style="padding:0;gap:10px;"></div>
      ${
        hiddenInstalled.length
          ? `
            <div class="server-subsection">
              <h3 class="card-title">Nguồn ẩn bởi policy</h3>
              <div class="sources-list" id="server-hidden-installed-list" style="padding:0;gap:10px;"></div>
            </div>
          `
          : ""
      }
    `;
    const installedList = logCard.querySelector("#server-installed-list");
    if (!visibleInstalled.length) {
      setMessageInBlock(installedList, "Chưa cài extension", "Refresh registry rồi chọn extension cần cài.");
    } else {
      visibleInstalled.forEach((item) => installedList.appendChild(createExtensionCard(item)));
    }

    const hiddenInstalledList = logCard.querySelector("#server-hidden-installed-list");
    if (hiddenInstalledList) {
      hiddenInstalled.forEach((item) =>
        hiddenInstalledList.appendChild(createExtensionCard(item, { hiddenByPolicy: true }))
      );
    }

    const connectCard = $("#page-server .connect-card");
    connectCard.innerHTML = `
      <h3 class="card-title">Catalog khả dụng</h3>
      <div class="sources-list" id="server-catalog-list" style="padding:0;gap:10px;"></div>
    `;
    const catalogList = connectCard.querySelector("#server-catalog-list");
    if (!catalog.length) {
      setMessageInBlock(catalogList, "Catalog trống", "Refresh registry để tải danh sách extension mới.");
    } else {
      catalog.slice(0, 12).forEach((item) => catalogList.appendChild(createExtensionCard(item, { catalog: true })));
    }
  }

  function openSettingEditor(item) {
    showDynamicModal({
      title: "Cập nhật thiết lập",
      bodyHtml: `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div>
            <span class="form-label">Key</span>
            <p class="form-hint" style="margin:0;">${escapeHtml(item.key)}</p>
          </div>
          <div>
            <label class="form-label" for="setting-edit-value">Value</label>
            <input class="form-input" id="setting-edit-value" type="text" value="${escapeHtml(item.value || "")}">
          </div>
          <p class="form-hint" style="margin:0;">Thiết lập này được lưu vào DB của server và áp dụng ngay cho UI/backend đọc từ AppSetting.</p>
        </div>
      `,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Hủy</button>
        <button class="btn-primary" type="button" id="save-setting-btn">Lưu</button>
      `
    });

    $id("save-setting-btn")?.addEventListener("click", async () => {
      const value = $id("setting-edit-value")?.value ?? "";
      await apiJson("/api/settings", {
        method: "PATCH",
        body: {
          settings: {
            [item.key]: value
          }
        }
      });
      closeModal("dynamic-modal");
      state.settingsLoaded = false;
      await loadSettingsBundle(true);
      renderServerSettingsSection();
      showToast("✓", "Đã cập nhật thiết lập", item.key);
    });
  }

  function renderServerSettingsSection() {
    updateServerSectionBar("settings");

    const system = state.system || {};
    const storage = state.storage || {};
    const enabledSourceCount = state.enabledSources.length;
    const totalQueueConcurrency =
      (system.queueConcurrency?.novelSync || 0) +
      (system.queueConcurrency?.chapterFetch || 0) +
      (system.queueConcurrency?.chapterBuild || 0) +
      (system.queueConcurrency?.maintenance || 0);

    const statusCard = $("#page-server .status-card");
    statusCard.innerHTML = `
      <div class="server-card-header">
        <span class="card-label">Tài khoản</span>
        <button class="source-browse-btn" type="button" id="logout-btn">Đăng xuất</button>
      </div>
      <div class="status-indicator ${state.auth.mustChangePassword ? "offline" : ""}">
        <div class="status-pulse"></div>
        <span class="status-text">${state.auth.user || state.auth.username || "admin"}</span>
      </div>
      <p class="server-hint">
        ${escapeHtml(
          state.auth.bootstrapMode
            ? "Đang ở chế độ bootstrap. Hãy đổi tài khoản mặc định ngay."
            : "Tài khoản quản trị đang hoạt động ổn định."
        )}
      </p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn-primary" type="button" id="change-password-btn" style="flex:1;">Đổi mật khẩu</button>
      </div>
    `;
    statusCard.querySelector("#logout-btn")?.addEventListener("click", () => void logout());
    statusCard.querySelector("#change-password-btn")?.addEventListener("click", () => openChangePasswordModal(false));

    const statsCard = $("#page-server .stats-card");
    statsCard.innerHTML = `
      <div class="server-stats-grid">
        <div class="server-stat">
          <span class="s-val">${escapeHtml(system.role || "app")}</span>
          <span class="s-lbl">Vai trò</span>
        </div>
        <div class="server-stat">
          <span class="s-val">${formatCount(enabledSourceCount)}</span>
          <span class="s-lbl">Nguồn</span>
        </div>
        <div class="server-stat">
          <span class="s-val">${formatCount(totalQueueConcurrency)}</span>
          <span class="s-lbl">Queue</span>
        </div>
      </div>
    `;

    const logCard = $("#page-server .log-card");
    logCard.innerHTML = `<h3 class="card-title">Thiết lập ứng dụng</h3><div class="log-list" id="setting-list"></div>`;
    const settingList = logCard.querySelector("#setting-list");
    if (!state.settings.length) {
      setMessageInBlock(settingList, "Chưa có AppSetting", "Server sẽ tự tạo khi có cấu hình runtime cần lưu.");
    } else {
      state.settings.forEach((item) => {
        const row = document.createElement("div");
        row.className = "log-row";
        row.innerHTML = `
          <div class="log-dot"></div>
          <div class="log-content">
            <div class="log-title">${escapeHtml(item.key)}</div>
            <div class="log-time">${escapeHtml(truncate(item.value || "", 72) || "(trống)")}</div>
          </div>
          <button class="source-browse-btn" type="button">Sửa</button>
        `;
        row.querySelector("button")?.addEventListener("click", () => openSettingEditor(item));
        settingList.appendChild(row);
      });
    }

    const connectCard = $("#page-server .connect-card");
    connectCard.innerHTML = `<h3 class="card-title">Storage & chính sách nguồn</h3><div class="log-list" id="runtime-list"></div>`;
    const runtimeList = connectCard.querySelector("#runtime-list");
    const rows = [
      ["APP_BASE_URL", system.baseUrl || location.origin],
      ["STORAGE_ROOT", storage.root || storage.directories?.root || "Không rõ"],
      [
        "NGUỒN ĐANG HIỆN",
        visibleInstalledNames().length ? visibleInstalledNames().join(", ") : "Chưa có nguồn production"
      ],
      [
        "ALLOWLIST",
        formatSourcePolicyNames(system.sourcePolicy?.enabledAllowlist || [], "Không giới hạn")
      ],
      [
        "PRIORITY",
        formatSourcePolicyNames(system.sourcePolicy?.priorityIds || [], "Không đặt ưu tiên")
      ]
    ];

    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "log-row";
      row.innerHTML = `
        <div class="log-dot"></div>
        <div class="log-content">
          <div class="log-title">${escapeHtml(label)}</div>
          <div class="log-time">${escapeHtml(truncate(value, 90))}</div>
        </div>
      `;
      runtimeList.appendChild(row);
    });
  }

  async function loadBrowseHome(sourceId) {
    const payload = await apiJson(`/api/sources/${encodeURIComponent(sourceId)}/home`);
    state.browseMode = "home";
    state.browseHome = payload || { sections: [] };
    state.browseItems = [];
    state.browseNextPage = null;
    state.browseError = "";
    state.browseWarning = typeof payload?.warning === "string" ? payload.warning : "";

    const sections = Array.isArray(state.browseHome.sections) ? state.browseHome.sections : [];
    if (!sections.find((section) => section.id === state.browseSectionId)) {
      state.browseSectionId = sections[0]?.id || null;
    }
  }

  async function loadBrowseSearch(sourceId, append = false) {
    const params = new URLSearchParams();
    params.set("query", getBrowseQuery());
    if (append && state.browseNextPage) {
      params.set("page", state.browseNextPage);
    }

    const payload = await apiJson(`/api/sources/${encodeURIComponent(sourceId)}/search?${params.toString()}`);
    const nextItems = Array.isArray(payload.items) ? payload.items : [];

    state.browseMode = "search";
    state.browseHome = null;
    state.browseItems = append ? [...state.browseItems, ...nextItems] : nextItems;
    state.browseNextPage = payload.nextPage || null;
    state.browseError = "";
    state.browseWarning = typeof payload?.warning === "string" ? payload.warning : "";
  }

  async function refreshBrowseContent({ append = false } = {}) {
    if (!state.activeSourceId) {
      renderBrowse();
      return;
    }

    const requestToken = ++state.browseRequestToken;
    if (!append) {
      renderBrowseLoading();
    }

    try {
      if (getBrowseQuery()) {
        await loadBrowseSearch(state.activeSourceId, append);
      } else {
        await loadBrowseHome(state.activeSourceId);
      }

      if (requestToken !== state.browseRequestToken) {
        return;
      }

      renderBrowse();
    } catch (error) {
      if (requestToken !== state.browseRequestToken) {
        return;
      }
      state.browseError = error.message;
      state.browseWarning = "";
      renderBrowse();
      showToast("!", "Không tải được dữ liệu nguồn", error.message);
    }
  }

  async function loadLibraryDetail(novelId) {
    const novel = await apiJson(`/api/library/novels/${encodeURIComponent(novelId)}`);
    let enriched = null;
    try {
      enriched = await apiJson(
        `/api/sources/${encodeURIComponent(novel.sourceId)}/detail?url=${encodeURIComponent(novel.sourceUrl)}`
      );
    } catch {
      enriched = null;
    }

    return {
      kind: "library",
      sourceId: novel.sourceId,
      title: resolveDetailTitle(enriched?.title || novel.title, novel.sourceUrl),
      author: enriched?.author || novel.author,
      coverUrl: firstText(buildLibraryCoverUrl(novel), enriched?.coverUrl, novel.coverUrl) || null,
      description: enriched?.description || novel.description,
      status: novel.status,
      genres: Array.isArray(enriched?.genres) ? enriched.genres : [],
      chapterCount: Number(novel.totalChapters) || (novel.chapters?.length || 0),
      chapters: Array.isArray(novel.chapters) ? novel.chapters : [],
      chapterWarning: null,
      source: getInstalledExtensionById(novel.sourceId) || getEnabledSourceById(novel.sourceId) || {
        id: novel.sourceId,
        name: getReadableSourceLabel(novel) || novel.sourceId
      },
      libraryItem: novel,
      requestUrl: novel.sourceUrl,
      sourceUrl: novel.sourceUrl
    };
  }

  async function loadSourceDetail(sourceId, requestUrl) {
    await loadLibrary();
    const normalizedRequestUrl = normalizeKnownSourceUrl(requestUrl);
    const preview = findBrowsePreviewItem(sourceId, normalizedRequestUrl);
    const [detailResult, chapterResult] = await Promise.allSettled([
      apiJson(
        `/api/sources/${encodeURIComponent(sourceId)}/detail?url=${encodeURIComponent(normalizedRequestUrl)}`
      ),
      apiJson(
        `/api/sources/${encodeURIComponent(sourceId)}/chapters?url=${encodeURIComponent(normalizedRequestUrl)}`
      )
    ]);

    const detailPayload = detailResult.status === "fulfilled" ? detailResult.value : null;
    const chapterPayload = chapterResult.status === "fulfilled" ? chapterResult.value : null;
    const detailError = detailResult.status === "rejected" ? detailResult.reason : null;
    const chapterError = chapterResult.status === "rejected" ? chapterResult.reason : null;
    const upstreamBlocked =
      isSourceUpstreamBlockedPayload(detailPayload) ||
      isSourceUpstreamBlockedPayload(chapterPayload) ||
      isSourceUpstreamBlockedError(detailError) ||
      isSourceUpstreamBlockedError(chapterError);

    if (!detailPayload && !chapterPayload && !upstreamBlocked) {
      throw detailError || chapterError || new Error("Không tải được chi tiết truyện.");
    }

    const sourceUrl =
      detailPayload?.sourceUrl || preview?.detailUrl || normalizedRequestUrl;
    const libraryItem =
      findLibraryBySource(sourceId, sourceUrl) ||
      findLibraryBySource(sourceId, normalizedRequestUrl);
    const fallbackWarning = firstText(
      detailPayload?.warning,
      chapterPayload?.warning,
      detailError?.message,
      chapterError?.message
    );
    const resolvedStatus = upstreamBlocked
      ? firstText(preview?.status, libraryItem?.status, detailPayload?.status, "unknown")
      : firstText(
          detailPayload?.status !== "unknown" ? detailPayload?.status : "",
          preview?.status,
          libraryItem?.status,
          "unknown"
        );
    const resolvedTitle = upstreamBlocked
      ? firstText(preview?.title, !isUrlLikeText(detailPayload?.title) ? detailPayload?.title : "", libraryItem?.title)
      : firstText(
          !isUrlLikeText(detailPayload?.title) ? detailPayload?.title : "",
          preview?.title,
          libraryItem?.title
        );
    const resolvedDescription = firstText(
      upstreamBlocked ? preview?.description : detailPayload?.description,
      detailPayload?.description,
      libraryItem?.description
    );
    const chapters = Array.isArray(chapterPayload?.items)
      ? chapterPayload.items.map((item) => {
          const libraryChapter = libraryItem?.chapters?.find(
            (chapter) => chapter.chapterIndex === item.chapterIndex
          );
          return {
            ...item,
            id: libraryChapter?.id || null,
            status: libraryChapter?.status || "remote",
            lastError: libraryChapter?.lastError || null
          };
        })
      : [];

    return {
      kind: "source",
      sourceId,
      title: resolveDetailTitle(resolvedTitle, sourceUrl),
      author: firstText(
        upstreamBlocked ? preview?.author : detailPayload?.author,
        detailPayload?.author,
        libraryItem?.author
      ) || null,
      coverUrl: firstText(
        upstreamBlocked ? preview?.coverUrl : detailPayload?.coverUrl,
        detailPayload?.coverUrl,
        buildLibraryCoverUrl(libraryItem),
        libraryItem?.coverUrl
      ) || null,
      description: resolvedDescription || null,
      status: resolvedStatus || "unknown",
      genres: Array.isArray(detailPayload?.genres) ? detailPayload.genres : [],
      chapterCount: chapters.length,
      chapters,
      chapterWarning: fallbackWarning || null,
      upstreamBlocked,
      source: getEnabledSourceById(sourceId) || getInstalledExtensionById(sourceId),
      libraryItem,
      requestUrl: normalizedRequestUrl,
      sourceUrl
    };
  }

  async function syncAllLibrary() {
    await loadLibrary();
    if (!state.libraryItems.length) {
      showToast("!", "Thư viện đang trống", "Không có truyện để đồng bộ.");
      return;
    }

    showToast("↻", "Đang xếp hàng đồng bộ", `${state.libraryItems.length} truyện`);
    for (const item of state.libraryItems) {
      try {
        await apiJson(`/api/library/novels/${encodeURIComponent(item.id)}/sync`, {
          method: "POST"
        });
      } catch {
        continue;
      }
    }

    state.libraryLoaded = false;
    state.tasksLoaded = false;
    await Promise.all([loadLibrary(true), loadTasks(true).catch(() => [])]);
    showToast("✓", "Đã đẩy vào hàng đợi", `${state.libraryItems.length} truyện`);
  }

  async function setSourceEnabled(sourceId, enabled) {
    try {
      await apiJson(
        `/api/extensions/${encodeURIComponent(sourceId)}/${enabled ? "enable" : "disable"}`,
        {
          method: "POST"
        }
      );

      state.extensionsLoaded = false;
      state.enabledSourcesLoaded = false;
      await refreshSourceInventory(true);
      await loadSystem().catch(() => state.system);
      renderSources();
      if (state.serverSection === "extensions") {
        renderServerExtensionsSection();
      }

      if (!enabled && state.activeSourceId === sourceId) {
        state.activeSourceId = state.enabledSources[0]?.id || null;
        navigateTo(defaultBrowsePath(), true);
      }

      showToast("✓", enabled ? "Đã bật nguồn" : "Đã tắt nguồn", sourceId);
    } catch (error) {
      showToast("!", "Không cập nhật được nguồn", error.message);
      renderSources();
      if (state.serverSection === "extensions") {
        renderServerExtensionsSection();
      }
    }
  }

  async function installAndEnableExtension(extensionId) {
    await apiJson(`/api/extensions/${encodeURIComponent(extensionId)}/install`, {
      method: "POST"
    });
    await apiJson(`/api/extensions/${encodeURIComponent(extensionId)}/enable`, {
      method: "POST"
    });

    state.extensionsLoaded = false;
    state.enabledSourcesLoaded = false;
    state.registriesLoaded = false;
    await refreshSourceInventory(true);
    renderSources();
    if (state.serverSection === "extensions") {
      renderServerExtensionsSection();
    }

    const installed = getInstalledExtensionById(extensionId);
    showToast("✓", "Đã cài và bật nguồn", installed?.name || extensionId);
  }

  async function refreshRegistries() {
    try {
      await apiJson("/api/extensions/registries/refresh", {
        method: "POST"
      });
      state.extensionsLoaded = false;
      state.registriesLoaded = false;
      await Promise.all([loadRegistries(true), loadExtensions(true)]);
      renderServerExtensionsSection();
      showToast("✓", "Đã refresh registries", `${state.registries.length} registry`);
    } catch (error) {
      showToast("!", "Refresh registry thất bại", error.message);
    }
  }

  async function refreshRegistry(registryId) {
    try {
      await apiJson(`/api/extensions/registries/${encodeURIComponent(registryId)}/refresh`, {
        method: "POST"
      });
      state.extensionsLoaded = false;
      state.registriesLoaded = false;
      await Promise.all([loadRegistries(true), loadExtensions(true)]);
      renderServerExtensionsSection();
      showToast("✓", "Đã refresh registry", registryId);
    } catch (error) {
      showToast("!", "Refresh registry thất bại", error.message);
    }
  }

  async function retryJob(jobId) {
    try {
      await apiJson(`/api/tasks/novels/${encodeURIComponent(jobId)}/retry`, {
        method: "POST"
      });
      state.tasksLoaded = false;
      await loadTasks(true);
      renderServerTasksSection();
      showToast("✓", "Đã retry job", String(jobId));
    } catch (error) {
      showToast("!", "Không retry được job", error.message);
    }
  }

  async function addCurrentDetailToLibrary() {
    if (!state.detailPayload || state.detailPayload.kind !== "source") {
      return;
    }
    if (state.detailPayload.upstreamBlocked) {
      showToast(
        "!",
        "Nguồn đang chặn truy cập",
        state.detailPayload.chapterWarning || "Chưa thể thêm truyện này vào thư viện từ server lúc này."
      );
      return;
    }

    const response = await apiJson("/api/library/novels", {
      method: "POST",
      body: {
        sourceId: state.detailPayload.sourceId,
        detailUrl: state.detailRequestUrl,
        syncNow: true
      }
    });

    state.libraryLoaded = false;
    state.tasksLoaded = false;
    await Promise.all([loadLibrary(true), loadTasks(true).catch(() => [])]);

    const createdItem = response.item || findLibraryBySource(state.detailPayload.sourceId, state.detailPayload.sourceUrl);
    state.detailPayload.libraryItem = createdItem || state.detailPayload.libraryItem;
    state.detailLibraryId = createdItem?.id || null;
    renderDetail({
      ...state.detailPayload,
      libraryItem: createdItem || state.detailPayload.libraryItem
    });
    showToast("✓", "Đã thêm vào thư viện", createdItem?.title || state.detailPayload.title);
  }

  async function syncCurrentDetail() {
    const libraryItem = state.detailPayload?.libraryItem || getLibraryById(state.detailLibraryId);
    if (!libraryItem?.id) {
      return;
    }
    if (state.detailPayload?.upstreamBlocked) {
      showToast(
        "!",
        "Nguồn đang chặn truy cập",
        state.detailPayload.chapterWarning || "Hãy thử đồng bộ lại sau khi nguồn cho phép truy cập."
      );
      return;
    }

    const endpoint =
      libraryItem.syncStatus === "error"
        ? `/api/library/novels/${encodeURIComponent(libraryItem.id)}/retry`
        : `/api/library/novels/${encodeURIComponent(libraryItem.id)}/sync`;

    await apiJson(endpoint, { method: "POST" });
    state.libraryLoaded = false;
    state.tasksLoaded = false;
    await Promise.all([loadLibrary(true), loadTasks(true).catch(() => []), refreshActiveDetailView()]);
    showToast("↻", "Đã xếp hàng đồng bộ", libraryItem.title);
  }

  async function rebuildCurrentDetail() {
    const libraryItem = state.detailPayload?.libraryItem || getLibraryById(state.detailLibraryId);
    if (!libraryItem?.id) {
      return;
    }

    await apiJson(`/api/library/novels/${encodeURIComponent(libraryItem.id)}/rebuild`, {
      method: "POST"
    });

    state.libraryLoaded = false;
    state.tasksLoaded = false;
    await Promise.all([loadLibrary(true), loadTasks(true).catch(() => []), refreshActiveDetailView()]);
    showToast("↻", "Đã xếp hàng rebuild", libraryItem.title);
  }

  function exportCurrentDetailEpub() {
    const libraryItem = state.detailPayload?.libraryItem || getLibraryById(state.detailLibraryId);
    if (!libraryItem?.id) {
      return;
    }

    window.open(
      `/api/library/novels/${encodeURIComponent(libraryItem.id)}/export.epub`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function refreshActiveDetailView() {
    if (!state.detailPayload) {
      return;
    }

    if (state.detailContext === "library" && state.detailLibraryId) {
      const detail = await loadLibraryDetail(state.detailLibraryId);
      renderDetail(detail);
      return;
    }

    if (state.detailPayload.sourceId && state.detailRequestUrl) {
      const detail = await loadSourceDetail(state.detailPayload.sourceId, state.detailRequestUrl);
      renderDetail(detail);
    }
  }

  async function previewCurrentChapter(chapterId) {
    const libraryItem = state.detailPayload?.libraryItem || getLibraryById(state.detailLibraryId);
    if (!libraryItem?.id || !chapterId) {
      return;
    }

    try {
      const payload = await apiJson(
        `/api/library/novels/${encodeURIComponent(libraryItem.id)}/chapters/${encodeURIComponent(chapterId)}/preview`
      );
      const preview = payload.item || payload;
      const footerButtons = [`<button class="btn-ghost" type="button" data-close="dynamic-modal">Đóng</button>`];

      if (preview.sourceUrl) {
        footerButtons.push(`<button class="btn-ghost" type="button" id="chapter-preview-source">Mở nguồn</button>`);
      }
      if (preview.chapterUrl) {
        footerButtons.push(`<button class="btn-primary" type="button" id="chapter-preview-file">Mở file local</button>`);
      }

      showDynamicModal({
        title: preview.title || `Chương ${preview.chapterIndex || ""}`.trim(),
        bodyHtml: `
          <div class="chapter-preview-shell">
            <div class="detail-badges" style="margin-bottom:10px;">
              <span class="badge badge-cat">Đọc từ dữ liệu local</span>
              ${preview.fileSize ? `<span class="badge badge-cat">${escapeHtml(formatFileSize(preview.fileSize))}</span>` : ""}
              ${preview.publishedAt ? `<span class="badge badge-cat">${escapeHtml(formatRelative(preview.publishedAt))}</span>` : ""}
            </div>
            <p class="form-hint" style="margin:0 0 14px;">
              Đây là bản HTML đã tải và lưu trong server. Nếu nội dung hiển thị đúng thì chapter này đã download thành công.
            </p>
            <div class="chapter-preview-info">
              <div><span class="form-label">Truyện</span><p class="form-hint">${escapeHtml(
                preview.novelTitle || libraryItem.title || ""
              )}</p></div>
              <div><span class="form-label">Chương</span><p class="form-hint">${escapeHtml(
                String(preview.chapterIndex || "")
              )}</p></div>
              ${
                preview.checksum
                  ? `<div><span class="form-label">Checksum</span><p class="form-hint">${escapeHtml(preview.checksum)}</p></div>`
                  : ""
              }
            </div>
            <article class="chapter-preview-content" id="chapter-preview-html">${preview.html || ""}</article>
          </div>
        `,
        footerHtml: footerButtons.join("")
      });

      $id("chapter-preview-source")?.addEventListener("click", () => {
        window.open(preview.sourceUrl, "_blank", "noopener,noreferrer");
      });
      $id("chapter-preview-file")?.addEventListener("click", () => {
        window.open(preview.chapterUrl, "_blank", "noopener,noreferrer");
      });
      $("#chapter-preview-html")
        ?.querySelectorAll("a[href]")
        .forEach((anchor) => {
          anchor.setAttribute("target", "_blank");
          anchor.setAttribute("rel", "noopener noreferrer");
        });
    } catch (error) {
      showToast("!", "Không mở được bản local của chương", error.message);
    }
  }

  async function retryCurrentChapter(chapterId) {
    const libraryItem = state.detailPayload?.libraryItem || getLibraryById(state.detailLibraryId);
    if (!libraryItem?.id || !chapterId) {
      return;
    }

    await apiJson(
      `/api/library/novels/${encodeURIComponent(libraryItem.id)}/chapters/${encodeURIComponent(chapterId)}/retry`,
      {
        method: "POST"
      }
    );

    state.libraryLoaded = false;
    state.tasksLoaded = false;
    await Promise.all([loadLibrary(true), loadTasks(true).catch(() => []), refreshActiveDetailView()]);
    showToast("↻", "Đã xếp hàng tải lại chương", libraryItem.title);
  }

  async function removeCurrentDetailFromLibrary() {
    const libraryItem = state.detailPayload?.libraryItem || getLibraryById(state.detailLibraryId);
    if (!libraryItem?.id) {
      return;
    }

    showConfirmModal({
      title: "Xóa truyện khỏi thư viện",
      message: `Xóa ${libraryItem.title} và dọn cache, EPUB đã build cùng tất cả task liên quan?`,
      confirmLabel: "Xóa truyện",
      onConfirm: async () => {
        await apiJson(`/api/library/novels/${encodeURIComponent(libraryItem.id)}`, {
          method: "DELETE"
        });

        state.libraryLoaded = false;
        state.tasksLoaded = false;
        state.detailLibraryId = null;
        if (state.detailPayload) {
          state.detailPayload.libraryItem = null;
        }
        await Promise.all([loadLibrary(true), loadTasks(true).catch(() => [])]);

        if (state.detailContext === "library") {
          navigateTo("/library", true);
        } else {
          await refreshActiveDetailView();
        }

        showToast("✓", "Đã xóa khỏi thư viện", libraryItem.title);
      }
    });
  }

  async function showSourceInPolicy(sourceId) {
    const currentAllowlist = Array.isArray(state.system?.sourcePolicy?.enabledAllowlist)
      ? state.system.sourcePolicy.enabledAllowlist
      : [];
    const nextAllowlist = Array.from(new Set([...currentAllowlist, sourceId]));

    await apiJson("/api/settings/source-policy", {
      method: "PATCH",
      body: {
        enabledAllowlist: nextAllowlist
      }
    });

    state.system = null;
    state.enabledSourcesLoaded = false;
    state.extensionsLoaded = false;
    await Promise.all([loadSystem(true), loadEnabledSources(true), loadExtensions(true)]);
    renderSources();
    if (state.serverSection === "extensions") {
      renderServerExtensionsSection();
    }

    const source = getInstalledExtensionById(sourceId) || getEnabledSourceById(sourceId);
    showToast("✓", "Đã hiện nguồn", source?.name || sourceId);
  }

  function confirmRemoveRegistry(registryId, name) {
    showConfirmModal({
      title: "Xóa registry",
      message: `Xóa registry ${name}? Catalog tương ứng sẽ bị gỡ khỏi server.`,
      confirmLabel: "Xóa registry",
      onConfirm: async () => {
        await apiJson(`/api/extensions/registries/${encodeURIComponent(registryId)}`, {
          method: "DELETE"
        });
        state.extensionsLoaded = false;
        state.registriesLoaded = false;
        await Promise.all([loadRegistries(true), loadExtensions(true)]);
        if (state.serverSection === "extensions") {
          renderServerExtensionsSection();
        }
        showToast("✓", "Đã xóa registry", name);
      }
    });
  }

  async function logout() {
    try {
      await apiJson("/api/auth/logout", { method: "POST" });
    } finally {
      redirectToLogin();
    }
  }

  function openChangePasswordModal(force = false) {
    const username = state.auth.user || state.auth.username || "admin";
    $id("change-password-hint").textContent = force
      ? "Phiên bootstrap chỉ cho phép truy cập sau khi bạn đổi tên đăng nhập hoặc mật khẩu mặc định."
      : "Bạn có thể đổi username và mật khẩu quản trị ngay trong giao diện này.";
    $id("change-password-username").value = username;
    $id("change-password-current").value = "";
    $id("change-password-next").value = "";
    $id("change-password-confirm").value = "";
    const error = $id("change-password-error");
    error.hidden = true;
    error.textContent = "";

    $id("change-password-cancel").style.display = force ? "none" : "block";
    $id("change-password-close").style.display = force ? "none" : "flex";
    $id("change-password-modal").dataset.force = force ? "true" : "false";
    openModal("change-password-modal");
  }

  async function submitChangePassword(event) {
    event.preventDefault();

    const username = $id("change-password-username").value.trim();
    const currentPassword = $id("change-password-current").value;
    const newPassword = $id("change-password-next").value;
    const confirmPassword = $id("change-password-confirm").value;
    const error = $id("change-password-error");

    const fail = (message) => {
      error.hidden = false;
      error.textContent = message;
    };

    if (!username) {
      fail("Vui lòng nhập tên đăng nhập mới.");
      return;
    }
    if (!currentPassword) {
      fail("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword) {
      fail("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (newPassword !== confirmPassword) {
      fail("Mật khẩu mới và phần nhập lại chưa khớp.");
      return;
    }

    try {
      const response = await apiJson("/api/auth/change-password", {
        method: "POST",
        body: {
          username,
          currentPassword,
          newPassword
        }
      });

      state.auth = {
        ...state.auth,
        ...(response.session || {}),
        user: response.user || username,
        username,
        mustChangePassword: false,
        bootstrapMode: false
      };

      blurActiveElement();
      closeModal("change-password-modal");
      showToast("✓", "Đã đổi mật khẩu", username);

      const nextPath = state.pendingPasswordPath || "/library";
      state.pendingPasswordPath = null;
      location.replace(nextPath);
    } catch (apiError) {
      fail(apiError.message);
    }
  }

  async function submitAddSource() {
    const input = $id("source-url-input");
    const submit = $id("confirm-add-source");
    const manifestUrl = input.value.trim();
    if (!manifestUrl) {
      showToast("!", "Thiếu URL manifest", "Nhập plugin.json hoặc repository.json.");
      input.focus();
      return;
    }

    submit.disabled = true;
    try {
      const created = await apiJson("/api/extensions/registries", {
        method: "POST",
        body: {
          url: manifestUrl
        }
      });

      const registryId = created.item?.id;
      if (registryId) {
        await apiJson(`/api/extensions/registries/${encodeURIComponent(registryId)}/refresh`, {
          method: "POST"
        });
      }

      state.extensionsLoaded = false;
      state.enabledSourcesLoaded = false;
      state.registriesLoaded = false;
      await refreshSourceInventory(true);
      await loadSystem().catch(() => state.system);

      const addedFromRegistry = state.catalogExtensions.filter((item) => item.registryId === registryId);
      if (addedFromRegistry.length === 1) {
        await installAndEnableExtension(addedFromRegistry[0].id);
        closeModal("add-source-modal");
        input.value = "";
        openSourceBrowse(addedFromRegistry[0].id);
        return;
      }

      renderSources();
      closeModal("add-source-modal");
      input.value = "";
      showToast("✓", "Đã thêm registry", manifestUrl);
    } catch (error) {
      showToast("!", "Không thêm được nguồn", error.message);
    } finally {
      submit.disabled = false;
    }
  }

  async function navigateFromNav(page) {
    if (page === "library") {
      navigateTo("/library");
      return;
    }
    if (page === "sources") {
      navigateTo("/sources");
      return;
    }
    if (page === "browse") {
      await loadEnabledSources().catch(() => []);
      navigateTo(defaultBrowsePath());
      return;
    }
    if (page === "server") {
      navigateTo(serverSectionPath(state.serverSection));
    }
  }

  function bindStaticAppEvents() {
    window.navigate = (page) => {
      void navigateFromNav(page);
    };

    $$("[data-page]").forEach((item) => {
      item.addEventListener("click", () => {
        void navigateFromNav(item.dataset.page);
      });
    });

    $$(".filter-btn", $id("page-library")).forEach((button) => {
      button.addEventListener("click", () => {
        $$(".filter-btn", $id("page-library")).forEach((target) => target.classList.remove("active"));
        button.classList.add("active");
        state.activeFilter = button.dataset.filter || "all";
        renderLibrary();
      });
    });

    const searchInput = $id("browse-search");
    searchInput?.addEventListener("input", () => {
      state.searchQuery = searchInput.value;
      syncBrowseSearchUi();
    });
    searchInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      submitBrowseSearch();
    });
    $id("browse-search-submit")?.addEventListener("click", () => submitBrowseSearch());

    $id("search-clear")?.addEventListener("click", () => {
      resetBrowseState();
      syncBrowseSearchUi();
      void refreshBrowseContent({ append: false });
    });

    $id("back-btn")?.addEventListener("click", () => {
      if (state.detailContext === "library") {
        navigateTo("/library");
      } else {
        const sourceId = state.detailPayload?.sourceId || state.activeSourceId;
        navigateTo(sourceId ? sourceBrowsePath(sourceId) : defaultBrowsePath());
      }
    });

    $id("btn-add-library")?.addEventListener("click", () => {
      void addCurrentDetailToLibrary().catch((error) => {
        showToast("!", "Không thêm được vào thư viện", error.message);
      });
    });

    $id("btn-download-all")?.addEventListener("click", () => {
      void syncCurrentDetail().catch((error) => {
        showToast("!", "Không đẩy được tác vụ", error.message);
      });
    });

    $id("btn-rebuild-library")?.addEventListener("click", () => {
      void rebuildCurrentDetail().catch((error) => {
        showToast("!", "Không xếp hàng rebuild được", error.message);
      });
    });

    $id("btn-export-epub")?.addEventListener("click", () => {
      try {
        exportCurrentDetailEpub();
      } catch (error) {
        showToast("!", "Không xuất được EPUB", error.message);
      }
    });

    $id("btn-remove-library")?.addEventListener("click", () => {
      void removeCurrentDetailFromLibrary().catch((error) => {
        showToast("!", "Không xóa được truyện", error.message);
      });
    });

    $id("btn-in-library")?.addEventListener("click", () => {
      if (state.detailLibraryId) {
        navigateTo(libraryDetailPath(state.detailLibraryId));
      }
    });

    $id("load-more-btn")?.addEventListener("click", () => {
      void refreshBrowseContent({ append: true });
    });

    $id("add-source-btn")?.addEventListener("click", () => openModal("add-source-modal"));
    $id("add-source-row-btn")?.addEventListener("click", () => openModal("add-source-modal"));
    $id("confirm-add-source")?.addEventListener("click", () => {
      void submitAddSource();
    });

    $id("sort-btn")?.addEventListener("click", () => {
      state.chapterSort = state.chapterSort === "desc" ? "asc" : "desc";
      if (state.detailPayload) {
        renderDetail(state.detailPayload);
      }
    });

    $("#page-library .icon-btn")?.addEventListener("click", () => {
      void syncAllLibrary().catch((error) => {
        showToast("!", "Không sync được thư viện", error.message);
      });
    });

    $id("detail-summary")?.addEventListener("click", () => {
      $id("detail-summary").classList.toggle("expanded");
    });

    document.addEventListener("click", (event) => {
      const closeTarget = event.target.closest("[data-close]");
      if (closeTarget) {
        closeModal(closeTarget.getAttribute("data-close"));
      }
    });

    document.addEventListener("click", (event) => {
      const overlay = event.target.classList?.contains("modal-overlay") ? event.target : null;
      if (!overlay) {
        return;
      }

      if (overlay.id === "change-password-modal" && state.auth.mustChangePassword) {
        return;
      }
      if (overlay.id === "dynamic-modal" && overlay.dataset.dismissible === "false") {
        return;
      }

      closeModal(overlay.id);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (!state.auth.mustChangePassword) {
        closeModal("dynamic-modal");
        closeModal("add-source-modal");
        closeModal("change-password-modal");
      }
    });

    $id("change-password-form")?.addEventListener("submit", (event) => {
      void submitChangePassword(event);
    });

    window.addEventListener("popstate", () => {
      void handleRoute();
    });
  }

  async function initLoginPage() {
    const form = $id("login-form");
    if (!form) {
      return;
    }

    const error = $id("login-error");
    const usernameInput = $id("login-username");
    const passwordInput = $id("login-password");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      error.hidden = true;
      error.textContent = "";

      if (!username) {
        error.hidden = false;
        error.textContent = "Vui lòng nhập tên đăng nhập.";
        usernameInput.focus();
        return;
      }
      if (!password) {
        error.hidden = false;
        error.textContent = "Vui lòng nhập mật khẩu.";
        passwordInput.focus();
        return;
      }

      try {
        const response = await apiJson("/api/auth/login", {
          method: "POST",
          body: {
            username,
            password
          }
        });

        blurActiveElement();
        const nextPath = boot.nextPath || "/library";
        const target = response.mustChangePassword
          ? `/settings?next=${encodeURIComponent(nextPath)}`
          : nextPath;
        location.href = target;
      } catch (apiError) {
        error.hidden = false;
        error.textContent = apiError.message;
      }
    });
  }

  async function initAppPage() {
    ensureDynamicShell();
    bindStaticAppEvents();
    syncBrowseSearchUi();
    void loadSystem().catch(() => null);
    void loadReady().catch(() => null);

    if (state.auth.mustChangePassword) {
      const gateUrl = new URL(location.href);
      const requestedNextPath = gateUrl.searchParams.get("next");
      state.pendingPasswordPath =
        requestedNextPath || (location.pathname === "/settings" ? "/library" : `${location.pathname}${location.search}`);
      if (location.pathname !== "/settings") {
        history.replaceState({}, "", `/settings?next=${encodeURIComponent(state.pendingPasswordPath)}`);
      }
      activatePage("server", "server");
      renderLockedServerState();
      hideRouteLoadingOverlay(state.routeLoadingToken, true);
      openChangePasswordModal(true);
      return;
    }

    await handleRoute();
  }

  async function handleRoute() {
    const token = ++state.routeToken;
    const route = parseRoute();
    showRouteLoadingOverlay(route, token);

    try {
      if (route.page === "library") {
      activatePage("library", "library");
      showNovelSkeleton("library-grid", 10);
      $id("library-empty").style.display = "none";
      await loadLibrary();
      if (token !== state.routeToken) {
        return;
      }
      renderLibrary();
      return;
      }

      if (route.page === "sources") {
      activatePage("sources", "sources");
      renderSourcesLoading();
      await Promise.all([loadExtensions(), loadSystem().catch(() => state.system)]);
      if (token !== state.routeToken) {
        return;
      }
      renderSources();
      return;
      }

      if (route.page === "browse") {
      activatePage("browse", "browse");
      await Promise.all([loadEnabledSources(), loadExtensions().catch(() => ({ installed: [], catalog: [] }))]);
      if (token !== state.routeToken) {
        return;
      }

      if (!state.enabledSources.length) {
        renderBrowse();
        return;
      }

      if (route.sourceId && !getEnabledSourceById(route.sourceId) && isSourceHiddenByPolicy(route.sourceId)) {
        navigateTo("/extensions", true);
        showToast("!", "Nguồn đang bị ẩn bởi policy", findKnownSourceById(route.sourceId)?.name || route.sourceId);
        return;
      }

      const nextSourceId =
        route.sourceId && getEnabledSourceById(route.sourceId) ? route.sourceId : state.enabledSources[0].id;
      const sourceChanged = nextSourceId !== state.activeSourceId;
      state.activeSourceId = nextSourceId;
      if (sourceChanged) {
        resetBrowseState();
      }

      renderBrowseLoading();
      await refreshBrowseContent({ append: false });
      return;
      }

      if (route.page === "detail" && route.detailContext === "library") {
      activatePage("detail", "library");
      renderDetailLoading();
      await loadLibrary();
      const detail = await loadLibraryDetail(route.novelId);
      if (token !== state.routeToken) {
        return;
      }
      state.detailChapterLimit = 150;
      renderDetail(detail);
      return;
      }

      if (route.page === "detail" && route.detailContext === "browse") {
      activatePage("detail", "browse");
      renderDetailLoading();
      await Promise.all([loadEnabledSources(), loadExtensions().catch(() => ({ installed: [], catalog: [] }))]);
      if (token !== state.routeToken) {
        return;
      }

      if (!getEnabledSourceById(route.sourceId)) {
        if (isSourceHiddenByPolicy(route.sourceId)) {
          navigateTo("/extensions", true);
          showToast("!", "Nguồn đang bị ẩn bởi policy", findKnownSourceById(route.sourceId)?.name || route.sourceId);
          return;
        }
        navigateTo(defaultBrowsePath(), true);
        return;
      }

      state.activeSourceId = route.sourceId;
      let detail;
      try {
        detail = await loadSourceDetail(route.sourceId, route.detailUrl);
      } catch (error) {
        const preview = findBrowsePreviewItem(route.sourceId, route.detailUrl);
        detail = {
          kind: "source",
          sourceId: route.sourceId,
          title: preview?.title || readableTitleFromUrl(route.detailUrl),
          author: preview?.author || null,
          coverUrl: preview?.coverUrl || null,
          description: preview?.description || null,
          status: preview?.status || "unknown",
          genres: [],
          chapterCount: 0,
          chapters: [],
          chapterWarning: error.message,
          upstreamBlocked: false,
          source: getEnabledSourceById(route.sourceId) || getInstalledExtensionById(route.sourceId),
          libraryItem: findLibraryBySource(route.sourceId, route.detailUrl),
          requestUrl: normalizeKnownSourceUrl(route.detailUrl),
          sourceUrl: normalizeKnownSourceUrl(route.detailUrl)
        };
        showToast("!", "Không tải được chi tiết truyện", error.message);
      }
      if (token !== state.routeToken) {
        return;
      }
      state.detailChapterLimit = 150;
      renderDetail(detail);
      return;
      }

      if (route.page === "server") {
      activatePage("server", "server");
      renderServerLoading(route.section);

      if (route.section === "tasks") {
        await Promise.all([
          loadReady(true),
          loadSystem(),
          loadLibrary(),
          loadEnabledSources(),
          loadTasks(true)
        ]);
        if (token !== state.routeToken) {
          return;
        }
        renderServerTasksSection();
        return;
      }

      if (route.section === "extensions") {
        await Promise.all([loadSystem().catch(() => state.system), loadExtensions(true), loadRegistries(true)]);
        if (token !== state.routeToken) {
          return;
        }
        renderServerExtensionsSection();
        return;
      }

      await Promise.all([
        loadEnabledSources().catch(() => state.enabledSources),
        loadExtensions().catch(() => ({
          installed: state.installedExtensions,
          catalog: state.catalogExtensions
        })),
        loadSettingsBundle(true)
      ]);
      if (token !== state.routeToken) {
        return;
      }
      renderServerSettingsSection();
      return;
      }
    } finally {
      hideRouteLoadingOverlay(token);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (boot.page === "login") {
      void initLoginPage();
      return;
    }
    void initAppPage();
  });
})();
