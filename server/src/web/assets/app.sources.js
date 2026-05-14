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
      button.textContent = "Káº¿t quáº£";
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

