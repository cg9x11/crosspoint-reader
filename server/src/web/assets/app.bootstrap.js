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
    if (page === "translations") {
      navigateTo(state.activeTranslationProjectId ? translationProjectPath(state.activeTranslationProjectId) : "/translations");
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
        showToast("!", "Không thể thêm vào thư viện", error.message);
      });
    });

    $id("btn-download-all")?.addEventListener("click", () => {
      void syncCurrentDetail().catch((error) => {
        showToast("!", "Không thể đẩy được tác vụ", error.message);
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
        showToast("!", "Không thể xuất được EPUB", error.message);
      }
    });

    $id("btn-upload-chapters")?.addEventListener("click", () => {
      try {
        openAppendChaptersModal();
      } catch (error) {
        showToast("!", "Không mở được form upload", error.message);
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

    $id("translations-create-btn")?.addEventListener("click", () => void openCreateTranslationProjectModal());
    $id("translations-empty-create")?.addEventListener("click", () => void openCreateTranslationProjectModal());
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

    $id("library-sync-btn")?.addEventListener("click", () => {
      void syncAllLibrary().catch((error) => {
        showToast("!", "Không sync được thư viện", error.message);
      });
    });

    $id("library-upload-btn")?.addEventListener("click", () => {
      try {
        openLibraryUploadModal();
      } catch (error) {
        showToast("!", "Không mở được form upload", error.message);
      }
    });

    $id("detail-summary")?.addEventListener("click", () => {
      $id("detail-summary").classList.toggle("expanded");
    });

    document.addEventListener("click", (event) => {
      const uploadLibraryButton = event.target.closest("#library-upload-btn");
      if (uploadLibraryButton) {
        event.preventDefault();
        openLibraryUploadModal();
        return;
      }

      const syncLibraryButton = event.target.closest("#library-sync-btn");
      if (syncLibraryButton) {
        event.preventDefault();
        void syncAllLibrary().catch((error) => {
          showToast("!", "Không sync được thư viện", error.message);
        });
        return;
      }

      const uploadChaptersButton = event.target.closest("#btn-upload-chapters");
      if (uploadChaptersButton) {
        event.preventDefault();
        openAppendChaptersModal();
        return;
      }

      const editLibraryButton = event.target.closest("#btn-edit-library");
      if (editLibraryButton) {
        event.preventDefault();
        openEditUploadedNovelModal();
      }
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
      repairNodeText(document.body);
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

      if (route.page === "translations") {
      activatePage("translations", "translations");
      await loadTranslationProjects(route.projectId ? true : false);
      if (route.projectId) {
        await loadTranslationProjectDetail(route.projectId);
      } else {
        state.translationDetail = null;
        state.activeTranslationProjectId = null;
      }
      if (token !== state.routeToken) {
        return;
      }
      renderTranslations();
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
      repairNodeText(document.body);
      hideRouteLoadingOverlay(token);
    }
  }

  function startApp() {
    if (boot.page === "login") {
      void initLoginPage();
      return;
    }
    void initAppPage();
    repairNodeText(document.body);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp, { once: true });
  } else {
    startApp();
  }
