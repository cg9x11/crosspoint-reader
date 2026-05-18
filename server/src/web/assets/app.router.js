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

    if (rawPath === "/translations") {
      return {
        page: "translations",
        navPage: "translations"
      };
    }

    if (rawPath.startsWith("/translations/")) {
      return {
        page: "translations",
        navPage: "translations",
        projectId: decodeURIComponent(rawPath.slice("/translations/".length))
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

    const sourceIdFromUrl = resolveBrowseSourceIdFromUrl(state.searchQuery);
    if (sourceIdFromUrl) {
      resetBrowseState();
      state.searchQuery = input?.value ?? "";
      syncBrowseSearchUi();
      navigateTo(sourceBrowsePath(sourceIdFromUrl, state.searchQuery));
      return;
    }

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
