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

