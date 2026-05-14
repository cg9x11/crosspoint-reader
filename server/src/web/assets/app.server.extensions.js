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

