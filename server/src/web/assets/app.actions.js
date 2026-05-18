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
    const isLocalUpload = novel.sourceId === "local-upload" || String(novel.sourceUrl || "").startsWith("upload:");
    if (!isLocalUpload) {
      try {
        enriched = await apiJson(
          `/api/sources/${encodeURIComponent(novel.sourceId)}/detail?url=${encodeURIComponent(novel.sourceUrl)}`
        );
      } catch {
        enriched = null;
      }
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

    showToast("⟳", "Đang xếp hàng đồng bộ", `${state.libraryItems.length} truyện`);
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
    showToast("⟳", "Đã xếp hàng đồng bộ", libraryItem.title);
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
    showToast("⟳", "Đã xếp hàng rebuild", libraryItem.title);
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

  function openLibraryUploadModal() {
    showDynamicModal({
      title: "Upload truyện",
      bodyHtml: `
        <label class="form-label">File</label>
        <input class="form-input" id="library-upload-file" type="file" accept=".epub,.zip">
        <p class="form-hint">Hỗ trợ <code>.epub</code> hoặc <code>.zip</code> chứa các chapter <code>.txt</code>.</p>
        <div class="upload-progress-shell">
          <div class="upload-progress-meta">
            <span class="form-label" style="margin:0;">Tiến độ upload</span>
            <span class="upload-progress-value" id="library-upload-progress-value"></span>
          </div>
          <div class="upload-progress-track"><div class="upload-progress-bar" id="library-upload-progress-bar"></div></div>
          <p class="form-hint upload-progress-status" id="library-upload-status">Chưa chọn file.</p>
        </div>
        <label class="form-label" style="margin-top:12px;">Tên truyện</label>
        <input class="form-input" id="library-upload-title" placeholder="Để trống để lấy từ file">
        <label class="form-label" style="margin-top:12px;">Tác giả</label>
        <input class="form-input" id="library-upload-author" placeholder="Tùy chọn">
        <label class="form-label" style="margin-top:12px;">Mô tả</label>
        <textarea class="form-input" id="library-upload-description" rows="5" placeholder="Tùy chọn"></textarea>
      `,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Hủy</button>
        <button class="btn-primary" type="button" id="library-upload-submit">Upload</button>
      `
    });

    $id("library-upload-submit")?.addEventListener("click", async () => {
      const fileInput = $id("library-upload-file");
      const file = fileInput?.files?.[0];
      if (!file) {
        showToast("!", "Chưa chọn file", "Chọn file EPUB hoặc ZIP trước.");
        return;
      }

      const submitButton = $id("library-upload-submit");
      const closeButton = $id("dynamic-modal-close");
      const cancelButton = $id("dynamic-modal-footer")?.querySelector('[data-close="dynamic-modal"]');
      submitButton.disabled = true;
      submitButton.textContent = "Dang upload...";
      if (closeButton) {
        closeButton.disabled = true;
      }
      if (cancelButton) {
        cancelButton.disabled = true;
      }
      setUploadProgressState(
        "library",
        `Đang upload ${file.name} (${formatFileSize(file.size || 0)})`,
        0
      );

      try {
        const formData = new FormData();
        formData.append("file", file);
        const title = $id("library-upload-title")?.value?.trim();
        const author = $id("library-upload-author")?.value?.trim();
        const description = $id("library-upload-description")?.value?.trim();
        if (title) {
          formData.append("title", title);
        }
        if (author) {
          formData.append("author", author);
        }
        if (description) {
          formData.append("description", description);
        }

        const payload = await apiFormUpload("/api/library/uploads/novel", formData, {
          onProgress: ({ percent }) => {
            setUploadProgressState("library", `Đang upload ${file.name}`, percent);
          },
          onUploadComplete: () => {
            setUploadProgressState("library", "Upload xong. Server đang nhập truyện...", 100);
            if (closeButton) {
              closeButton.disabled = false;
            }
            if (cancelButton) {
              cancelButton.disabled = false;
              cancelButton.textContent = "Đóng";
            }
          }
        });
        setUploadProgressState("library", "Upload xong. Đang nạp lại thư viện...", 100);
        state.libraryLoaded = false;
        await loadLibrary(true);
        closeModal("dynamic-modal");
        showToast("✓", "Đã upload truyện", `${payload.item?.title || file.name} · ${formatCount(payload.item?.chapters?.length || 0)} chapter`);
        if (payload.item?.id) {
          navigateTo(libraryDetailPath(payload.item.id));
        } else {
          renderLibrary();
        }
      } catch (error) {
        showToast("!", "Upload truyện thất bại", error.message);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Upload";
        if (closeButton) {
          closeButton.disabled = false;
        }
      }
    });
  }

  function openAppendChaptersModal() {
    const libraryItem = state.detailPayload?.libraryItem || getLibraryById(state.detailLibraryId);
    if (!libraryItem?.id) {
      return;
    }

    showDynamicModal({
      title: "Upload chapter",
      bodyHtml: `
        <label class="form-label">File</label>
        <input class="form-input" id="library-chapter-upload-file" type="file" accept=".txt,.zip">
        <p class="form-hint">Hỗ trợ 1 file <code>.txt</code> hoặc <code>.zip</code> chứa nhiều chapter <code>.txt</code>.</p>
        <div class="upload-progress-shell">
          <div class="upload-progress-meta">
            <span class="form-label" style="margin:0;">Tiến độ upload</span>
            <span class="upload-progress-value" id="chapter-upload-progress-value"></span>
          </div>
          <div class="upload-progress-track"><div class="upload-progress-bar" id="chapter-upload-progress-bar"></div></div>
          <p class="form-hint upload-progress-status" id="chapter-upload-status">Chưa chọn file.</p>
        </div>
        <label class="form-label" style="margin-top:12px;">Chapter bắt đầu</label>
        <input class="form-input" id="library-chapter-start-index" type="number" min="1" placeholder="Mặc định nối tiếp chapter cuối">
      `,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Hủy</button>
        <button class="btn-primary" type="button" id="library-chapter-upload-submit">Upload</button>
      `
    });

    $id("library-chapter-upload-submit")?.addEventListener("click", async () => {
      const fileInput = $id("library-chapter-upload-file");
      const file = fileInput?.files?.[0];
      if (!file) {
        showToast("!", "Chưa chọn file", "Chọn file TXT hoặc ZIP trước.");
        return;
      }

      const submitButton = $id("library-chapter-upload-submit");
      const closeButton = $id("dynamic-modal-close");
      const cancelButton = $id("dynamic-modal-footer")?.querySelector('[data-close="dynamic-modal"]');
      submitButton.disabled = true;
      submitButton.textContent = "Dang upload...";
      if (closeButton) {
        closeButton.disabled = true;
      }
      if (cancelButton) {
        cancelButton.disabled = true;
      }
      setUploadProgressState(
        "chapter",
        `Đang upload ${file.name} (${formatFileSize(file.size || 0)})`,
        0
      );

      try {
        const formData = new FormData();
        formData.append("file", file);
        const startIndex = $id("library-chapter-start-index")?.value?.trim();
        if (startIndex) {
          formData.append("startIndex", startIndex);
        }
        const payload = await apiFormUpload(`/api/library/novels/${encodeURIComponent(libraryItem.id)}/uploads/chapters`, formData, {
          onProgress: ({ percent }) => {
            setUploadProgressState("chapter", `Đang upload ${file.name}`, percent);
          },
          onUploadComplete: () => {
            setUploadProgressState("chapter", "Upload xong. Server đang nhập chapter...", 100);
            if (closeButton) {
              closeButton.disabled = false;
            }
            if (cancelButton) {
              cancelButton.disabled = false;
              cancelButton.textContent = "Đóng";
            }
          }
        });
        setUploadProgressState("chapter", "Upload xong. Đang nạp lại truyện...", 100);
        state.libraryLoaded = false;
        await loadLibrary(true);
        closeModal("dynamic-modal");
        showToast("✓", "Đã upload chapter", `${payload.item?.title || libraryItem.title} · ${formatCount(payload.item?.totalChapters || 0)} chapter`);
        await refreshActiveDetailView();
      } catch (error) {
        showToast("!", "Upload chapter thất bại", error.message);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Upload";
        if (closeButton) {
          closeButton.disabled = false;
        }
        if (cancelButton) {
          cancelButton.disabled = false;
        }
      }
    });
  }

  function isLocalUploadLibraryItem(item) {
    return item?.sourceId === "local-upload" || String(item?.sourceUrl || "").startsWith("upload:");
  }

  function openEditUploadedNovelModal() {
    const libraryItem = state.detailPayload?.libraryItem || getLibraryById(state.detailLibraryId);
    if (!libraryItem?.id || !isLocalUploadLibraryItem(libraryItem)) {
      return;
    }

    showDynamicModal({
      title: "Sửa truyện upload",
      bodyHtml: `
        <label class="form-label">Tên truyện</label>
        <input class="form-input" id="uploaded-novel-title" value="${escapeHtml(libraryItem.title || "")}">
        <label class="form-label" style="margin-top:12px;">Tác giả</label>
        <input class="form-input" id="uploaded-novel-author" value="${escapeHtml(libraryItem.author || "")}">
        <label class="form-label" style="margin-top:12px;">Mô tả</label>
        <textarea class="form-input" id="uploaded-novel-description" rows="6">${escapeHtml(libraryItem.description || "")}</textarea>
        <label class="form-label" style="margin-top:12px;">Cover</label>
        <input class="form-input" id="uploaded-novel-cover" type="file" accept="image/*">
        <p class="form-hint">Có thể đổi tên, mô tả, cover cho truyện upload local.</p>
      `,
      footerHtml: `
        <button class="btn-ghost" type="button" data-close="dynamic-modal">Hủy</button>
        <button class="btn-primary" type="button" id="uploaded-novel-save">Lưu</button>
      `
    });

    $id("uploaded-novel-save")?.addEventListener("click", async () => {
      const submitButton = $id("uploaded-novel-save");
      submitButton.disabled = true;
      submitButton.textContent = "Dang lưu...";
      try {
        const title = $id("uploaded-novel-title")?.value?.trim();
        const author = $id("uploaded-novel-author")?.value?.trim();
        const description = $id("uploaded-novel-description")?.value?.trim();
        const coverFile = $id("uploaded-novel-cover")?.files?.[0] || null;

        await apiJson(`/api/library/novels/${encodeURIComponent(libraryItem.id)}/uploaded`, {
          method: "PATCH",
          body: {
            title,
            author: author || null,
            description: description || null
          }
        });

        if (coverFile) {
          const coverForm = new FormData();
          coverForm.append("file", coverFile);
          await apiForm(`/api/library/novels/${encodeURIComponent(libraryItem.id)}/uploaded/cover`, coverForm);
        }

        state.libraryLoaded = false;
        await loadLibrary(true);
        await refreshActiveDetailView();
        closeModal("dynamic-modal");
        showToast("✓", "Đã lưu truyện upload", title || libraryItem.title);
      } catch (error) {
        showToast("!", "Không lưu được truyện upload", error.message);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Lưu";
      }
    });
  }

  async function deleteUploadedChapter(chapterId) {
    const libraryItem = state.detailPayload?.libraryItem || getLibraryById(state.detailLibraryId);
    if (!libraryItem?.id || !chapterId || !isLocalUploadLibraryItem(libraryItem)) {
      return;
    }

    await apiJson(
      `/api/library/novels/${encodeURIComponent(libraryItem.id)}/chapters/${encodeURIComponent(chapterId)}`,
      { method: "DELETE" }
    );
    state.libraryLoaded = false;
    await loadLibrary(true);
    await refreshActiveDetailView();
    showToast("✓", "Đã xóa chapter", libraryItem.title);
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
    showToast("⟳", "Đã xếp hàng tải lại chương", libraryItem.title);
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
    showToast("✓", "Đã hiển thị nguồn", source?.name || sourceId);
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

