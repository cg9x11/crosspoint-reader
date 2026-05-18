  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  const MOJIBAKE_PATTERN = /[ÃÂÄÅÆÇÐÑØÞßáºá»â€‹€™œžŸ]/;

  function looksMojibake(value) {
    return typeof value === "string" && MOJIBAKE_PATTERN.test(value);
  }

  function mojibakeScore(value) {
    return (String(value ?? "").match(MOJIBAKE_PATTERN) || []).length;
  }

  function decodeMojibakeOnce(value) {
    try {
      const bytes = Uint8Array.from(Array.from(String(value), (char) => char.charCodeAt(0) & 0xff));
      return new TextDecoder("utf-8").decode(bytes);
    } catch {
      return String(value ?? "");
    }
  }

  function repairMojibakeText(value) {
    let current = String(value ?? "");
    if (!looksMojibake(current)) {
      return current;
    }

    for (let pass = 0; pass < 3; pass += 1) {
      const decoded = decodeMojibakeOnce(current);
      if (!decoded || decoded === current || decoded.includes("�")) {
        break;
      }
      const currentScore = mojibakeScore(current);
      const decodedScore = mojibakeScore(decoded);
      if (decodedScore >= currentScore || decoded.length + 1 < current.length) {
        break;
      }
      current = decoded;
      if (!looksMojibake(current)) {
        break;
      }
    }

    return current;
  }

  function repairNodeText(root) {
    if (!root) {
      return;
    }

    const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let textNode = textWalker.nextNode();
    while (textNode) {
      textNodes.push(textNode);
      textNode = textWalker.nextNode();
    }

    textNodes.forEach((node) => {
      const repaired = repairMojibakeText(node.textContent || "");
      if (repaired !== node.textContent) {
        node.textContent = repaired;
      }
    });

    const attrNames = ["title", "placeholder", "aria-label", "aria-description", "value"];
    root.querySelectorAll?.("*").forEach((element) => {
      attrNames.forEach((name) => {
        if (!element.hasAttribute(name)) {
          return;
        }
        const current = element.getAttribute(name) || "";
        const repaired = repairMojibakeText(current);
        if (repaired !== current) {
          element.setAttribute(name, repaired);
        }
      });
    });
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

    if (route.page === "translations") {
      return {
        title: "Đang tải bản dịch",
        subtitle: "Chuẩn bị project dịch, glossary, version và export..."
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
    return `${text.slice(0, Math.max(0, length - 1)).trimEnd()}â€¦`;
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

  function tryParseUrl(value) {
    try {
      return new URL(String(value || "").trim());
    } catch {
      return null;
    }
  }

  function resolveBrowseSourceIdFromUrl(rawUrl) {
    const url = tryParseUrl(rawUrl);
    if (!url) {
      return null;
    }

    const host = url.hostname.toLowerCase();
    if (/(^|\.)syosetu\.com$/i.test(host) && /^\/n[0-9a-z]+(?:\/\d+)?\/?$/i.test(url.pathname)) {
      return "sys:syosetu";
    }

    if (/(^|\.)docln\.sbs$/i.test(host) || /(^|\.)docln\.net$/i.test(host) || /(^|\.)docln\.top$/i.test(host) || /(^|\.)hako\./i.test(host)) {
      return state.enabledSources.find((item) => item.id.toLowerCase().includes("hako"))?.id || null;
    }

    if (/(^|\.)truyenfull\.vi$/i.test(host)) {
      return state.enabledSources.find((item) => item.id.toLowerCase().includes("truyen-full"))?.id || null;
    }

    return null;
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
    return readableTitleFromUrl(sourceUrl || cleanedTitle || "Không rõ");
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
