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
        card.innerHTML = `<p class="form-hint" style="margin:0;">Đang tải dữ liệu server...</p>`;
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
      <p class="server-hint">Phiên bootstrap đang khóa API quản trị tới khi cập nhật tài khoản admin.</p>
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
    const jobs = state.tasks.slice(0, 10);
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
          void retryJob(job.novelId || job.id);
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

