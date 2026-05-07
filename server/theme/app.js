/* ═══════════════════════════════════════════════════════
   XTEINK READER — App Logic
════════════════════════════════════════════════════════ */

'use strict';

// ── Mock Data ─────────────────────────────────────────
const MOCK_SOURCES = [
  { id: 'truyenfull', name: 'Truyenfull', domain: 'truyenfull.vn', version: '1.2.0', enabled: true,  icon: 'TF' },
  { id: 'tangthuvien', name: 'Tàng Thư Viện', domain: 'tangthuvien.vn', version: '1.0.3', enabled: true,  icon: 'TT' },
  { id: 'metruyencv', name: 'Metruyencv', domain: 'metruyencv.com', version: '0.9.1', enabled: false, icon: 'MT' },
  { id: 'isach', name: 'Isach', domain: 'isach.info', version: '1.1.0', enabled: true,  icon: 'IS' },
];

const COVER_COLORS = [
  ['#2d1b4e','#7c3aed'], ['#1a2f1a','#16a34a'], ['#2d1a1a','#dc2626'],
  ['#1a1f2d','#2563eb'], ['#2d2a1a','#ca8a04'], ['#1a2d2d','#0891b2'],
  ['#2d1a2d','#9333ea'], ['#1f2d1a','#65a30d'],
];

function makeCoverGradient(index) {
  const [from, to] = COVER_COLORS[index % COVER_COLORS.length];
  return `linear-gradient(160deg, ${from} 0%, ${to} 100%)`;
}

const MOCK_NOVELS = [
  { id: 'n001', title: 'Đấu Phá Thương Khung', author: 'Thiên Tằm Thổ Đậu', source: 'truyenfull', chapters: 502, downloaded: 502, status: 'completed', cats: ['Tiên Hiệp', 'Huyền Huyễn'] },
  { id: 'n002', title: 'Toàn Chức Pháp Sư', author: 'Loạn', source: 'truyenfull', chapters: 3000, downloaded: 1240, status: 'ongoing', cats: ['Huyền Huyễn'] },
  { id: 'n003', title: 'Conan Lạc Vào Thế Giới Anime', author: 'Unknown', source: 'tangthuvien', chapters: 89, downloaded: 89, status: 'ongoing', cats: ['Đô Thị'] },
  { id: 'n004', title: 'Thần Đạo Đan Tôn', author: 'Phong Đình Thiên Hạ', source: 'truyenfull', chapters: 2600, downloaded: 800, status: 'ongoing', cats: ['Tiên Hiệp'] },
  { id: 'n005', title: 'Võ Thần Chúa Tể', author: 'Tịch Mịch Tiếu', source: 'tangthuvien', chapters: 1200, downloaded: 1200, status: 'completed', cats: ['Kiếm Hiệp'] },
  { id: 'n006', title: 'Vạn Cổ Chí Tôn', author: 'Thanh Thư', source: 'truyenfull', chapters: 4000, downloaded: 220, status: 'ongoing', cats: ['Huyền Huyễn'] },
  { id: 'n007', title: 'Ngã Lão Gia Tử Tốc Lôi', author: 'Ngu Nhân Nhất Trí', source: 'isach', chapters: 560, downloaded: 560, status: 'completed', cats: ['Ngôn Tình'] },
  { id: 'n008', title: 'Kiếm Đến Phong Sương', author: 'Trần Mặc', source: 'isach', chapters: 300, downloaded: 0, status: 'completed', cats: ['Kiếm Hiệp'] },
];

const MOCK_BROWSE = [
  { id: 'b001', title: 'Lý Mục', author: 'Đặng Thiên', source: 'truyenfull', chapters: 1800, status: 'ongoing', cats: ['Lịch Sử'] },
  { id: 'b002', title: 'Hắc Kỹ Thuật', author: 'Lê Phong', source: 'truyenfull', chapters: 420, status: 'completed', cats: ['Đô Thị'] },
  { id: 'b003', title: 'Tu La Võ Thần', author: 'Cổ Long', source: 'truyenfull', chapters: 2200, status: 'ongoing', cats: ['Tiên Hiệp'] },
  { id: 'b004', title: 'Linh Kiếm Tôn', author: 'Vân Hư', source: 'truyenfull', chapters: 900, status: 'completed', cats: ['Kiếm Hiệp'] },
  { id: 'b005', title: 'Hỗn Độn Kiếm Thần', author: 'Thiên Ảnh', source: 'truyenfull', chapters: 1600, status: 'ongoing', cats: ['Huyền Huyễn'] },
  { id: 'b006', title: 'Siêu Phẩm Thần Y', author: 'Bạch Lộc', source: 'truyenfull', chapters: 780, status: 'ongoing', cats: ['Đô Thị'] },
  { id: 'b007', title: 'Thánh Tổ', author: 'Văn Nhân Mặc Khách', source: 'truyenfull', chapters: 1100, status: 'completed', cats: ['Tiên Hiệp'] },
  { id: 'b008', title: 'Phàm Nhân Tu Tiên', author: 'Vong Ngữ', source: 'truyenfull', chapters: 2400, status: 'completed', cats: ['Tiên Hiệp'] },
  { id: 'b009', title: 'Dấu Ấn Rồng Thần', author: 'Hải Yến', source: 'truyenfull', chapters: 520, status: 'ongoing', cats: ['Huyền Huyễn'] },
  { id: 'b010', title: 'Đại Đạo Triều Thiên', author: 'Cửu Giang', source: 'truyenfull', chapters: 3300, status: 'ongoing', cats: ['Tiên Hiệp'] },
  { id: 'b011', title: 'Mỹ Nữ Tổng Tài Yêu Ta', author: 'Phong Lưu', source: 'truyenfull', chapters: 640, status: 'completed', cats: ['Ngôn Tình'] },
  { id: 'b012', title: 'Nghịch Thiên Tà Thần', author: 'Tứ Mục', source: 'truyenfull', chapters: 1450, status: 'ongoing', cats: ['Huyền Huyễn'] },
];

const LIBRARY_IDS = new Set(MOCK_NOVELS.map(n => n.id));
const MOCK_ALL = [...MOCK_NOVELS, ...MOCK_BROWSE];

const LOG_ENTRIES = [
  { type: 'ok',    title: 'Xteink X4 → Đấu Phá ch_498–502 (50KB)', time: '3 phút trước' },
  { type: 'ok',    title: 'Xteink X4 → _series.json × 8',           time: '3 phút trước' },
  { type: 'ok',    title: 'Xteink X4 → Toàn Chức ch_001–020',       time: '2 giờ trước' },
  { type: 'error', title: 'Timeout khi sync Metruyencv',             time: '5 giờ trước' },
  { type: 'ok',    title: 'Xteink X4 → library feed',               time: 'Hôm qua' },
];

// ── State ─────────────────────────────────────────────
const state = {
  currentPage: 'library',
  prevPage:    null,
  activeSource: 'truyenfull',
  activeFilter: 'all',
  activeCat:    'all',
  searchQuery:  '',
  detailNovel:  null,
  chapterSort:  'desc',
};

// ── Router ────────────────────────────────────────────
function navigate(page, data = null) {
  const pages   = document.querySelectorAll('.page');
  const navItems = document.querySelectorAll('.nav-item, .bnav-item');

  // Hide all pages
  pages.forEach(p => p.classList.remove('active'));

  // Show target page
  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }

  // Update nav active state (only for main nav pages)
  const mainPages = ['library', 'sources', 'browse', 'server'];
  if (mainPages.includes(page)) {
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  }

  state.prevPage    = state.currentPage;
  state.currentPage = page;

  // Page-specific init
  if (page === 'detail' && data) {
    state.detailNovel = data;
    renderDetail(data);
  }
  if (page === 'browse') renderBrowse();
  if (page === 'library') renderLibrary();

  // Scroll main to top
  document.getElementById('main')?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

// ── Novel Card ────────────────────────────────────────
function createNovelCard(novel, index) {
  const inLibrary = LIBRARY_IDS.has(novel.id);
  const progress  = novel.downloaded && novel.chapters
    ? (novel.downloaded / novel.chapters * 100).toFixed(0) : 0;
  const statusLabel = novel.status === 'completed' ? 'Hoàn thành' : 'Đang ra';
  const statusClass = novel.status === 'completed' ? 'badge-completed' : 'badge-ongoing';

  const card = document.createElement('div');
  card.className = 'novel-card';
  card.innerHTML = `
    <div class="novel-card-cover-wrap">
      <div class="cover-placeholder" style="background:${makeCoverGradient(index)};">
        <span class="cover-placeholder-text">${novel.title}</span>
      </div>
      <span class="novel-card-badge ${statusClass}">${statusLabel}</span>
      ${inLibrary && novel.downloaded < novel.chapters ? `
        <div class="novel-card-progress">
          <div class="novel-card-progress-bar" style="width:${progress}%"></div>
        </div>` : ''}
    </div>
    <div class="novel-card-title">${novel.title}</div>
    <div class="novel-card-sub">${novel.author}</div>
  `;

  card.addEventListener('click', () => {
    navigate('detail', novel);
  });

  return card;
}

function createSkeletonCard() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="skeleton skeleton-cover"></div>
    <div class="skeleton skeleton-line-sm"></div>
    <div class="skeleton skeleton-line-sm"></div>
    <div class="skeleton skeleton-line-xs"></div>
  `;
  return el;
}

// ── Render Library ────────────────────────────────────
function renderLibrary() {
  const grid  = document.getElementById('library-grid');
  const empty = document.getElementById('library-empty');
  const filter = state.activeFilter;

  let novels = MOCK_NOVELS;
  if (filter === 'ongoing')    novels = novels.filter(n => n.status === 'ongoing');
  if (filter === 'completed')  novels = novels.filter(n => n.status === 'completed');
  if (filter === 'downloaded') novels = novels.filter(n => n.downloaded === n.chapters);

  grid.innerHTML = '';
  if (!novels.length) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }

  grid.style.display = 'grid';
  empty.style.display = 'none';
  novels.forEach((n, i) => grid.appendChild(createNovelCard(n, i)));
}

// ── Render Sources ────────────────────────────────────
function renderSources() {
  const list = document.getElementById('sources-list');
  list.innerHTML = '';

  MOCK_SOURCES.forEach(src => {
    const card = document.createElement('div');
    card.className = 'source-card';
    card.innerHTML = `
      <div class="source-icon-wrap">${src.icon}</div>
      <div class="source-info">
        <div class="source-name">${src.name}</div>
        <div class="source-meta">
          <span class="source-domain">${src.domain}</span>
          <span class="source-ver">v${src.version}</span>
        </div>
      </div>
      <div class="source-actions">
        <button class="source-browse-btn" data-id="${src.id}">Duyệt</button>
        <label class="toggle-switch">
          <input type="checkbox" ${src.enabled ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
      </div>
    `;

    // Browse button
    card.querySelector('.source-browse-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      state.activeSource = src.id;
      navigate('browse');
    });

    // Toggle
    card.querySelector('input[type=checkbox]').addEventListener('change', (e) => {
      src.enabled = e.target.checked;
      updateSourceTabs();
    });

    list.appendChild(card);
  });
}

// ── Render Browse ─────────────────────────────────────
function updateSourceTabs() {
  const tabs = document.getElementById('source-tabs');
  tabs.innerHTML = '';

  const enabled = MOCK_SOURCES.filter(s => s.enabled);
  enabled.forEach(src => {
    const btn = document.createElement('button');
    btn.className = `source-tab${src.id === state.activeSource ? ' active' : ''}`;
    btn.innerHTML = `<span class="source-tab-dot"></span>${src.name}`;
    btn.addEventListener('click', () => {
      state.activeSource = src.id;
      document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      renderBrowseGrid();
    });
    tabs.appendChild(btn);
  });
}

function renderBrowse() {
  updateSourceTabs();
  renderBrowseGrid();
}

function renderBrowseGrid() {
  const grid = document.getElementById('browse-grid');

  // Skeleton loading
  grid.innerHTML = '';
  for (let i = 0; i < 12; i++) grid.appendChild(createSkeletonCard());

  setTimeout(() => {
    grid.innerHTML = '';
    let novels = MOCK_BROWSE;

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      novels = novels.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.author.toLowerCase().includes(q)
      );
    }

    if (state.activeCat !== 'all' && state.activeCat !== 'new' && state.activeCat !== 'hot') {
      novels = novels.filter(n =>
        n.cats?.some(c => c.toLowerCase().includes(state.activeCat.toLowerCase()))
      );
    }
    if (state.activeCat === 'completed') {
      novels = novels.filter(n => n.status === 'completed');
    }

    novels.forEach((n, i) => grid.appendChild(createNovelCard(n, i)));
  }, 400);
}

// ── Render Detail ─────────────────────────────────────
function renderDetail(novel) {
  // Cover
  const coverEl  = document.getElementById('detail-cover');
  const blurEl   = document.getElementById('detail-cover-blur');
  const heroEl   = document.getElementById('detail-hero');

  // Use gradient as cover bg
  const coverWrap = heroEl.querySelector('.detail-cover-wrap');
  coverWrap.style.background = makeCoverGradient(MOCK_ALL.indexOf(novel));
  coverEl.style.display = 'none';

  // Meta
  document.getElementById('detail-title').textContent  = novel.title;
  document.getElementById('detail-author').textContent = novel.author;

  const badges = document.getElementById('detail-badges');
  badges.innerHTML = '';
  const statusBadge = document.createElement('span');
  statusBadge.className = `badge ${novel.status === 'completed' ? 'badge-completed' : 'badge-ongoing'}`;
  statusBadge.textContent = novel.status === 'completed' ? 'Hoàn thành' : 'Đang ra';
  badges.appendChild(statusBadge);
  (novel.cats || []).forEach(cat => {
    const b = document.createElement('span');
    b.className = 'badge badge-cat';
    b.textContent = cat;
    badges.appendChild(b);
  });

  // Summary
  document.getElementById('detail-summary').textContent =
    `Câu chuyện xoay quanh ${novel.author ? novel.author : 'nhân vật chính'} ` +
    `trong thế giới ${novel.cats?.[0] ?? 'huyền bí'}. Một hành trình dài với ` +
    `${novel.chapters} chương đầy kịch tính, hành động và cảm xúc chờ đón bạn khám phá.`;

  // Stats
  document.getElementById('stat-chapters').textContent =
    novel.chapters >= 1000 ? (novel.chapters / 1000).toFixed(1) + 'k' : novel.chapters;
  document.getElementById('stat-status').textContent =
    novel.status === 'completed' ? 'Hoàn thành' : 'Đang ra';
  document.getElementById('stat-source').textContent =
    MOCK_SOURCES.find(s => s.id === novel.source)?.name ?? novel.source;

  // Actions
  const inLib = LIBRARY_IDS.has(novel.id);
  document.getElementById('btn-add-library').style.display  = inLib ? 'none'  : 'block';
  document.getElementById('btn-download-all').style.display = inLib ? 'block' : 'none';
  document.getElementById('btn-in-library').style.display   = inLib ? 'block' : 'none';

  // Chapter list
  const list = document.getElementById('chapter-list');
  list.innerHTML = '';
  const count = Math.min(novel.chapters, 30);
  const chapters = Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    title: `Chương ${i + 1}`,
    downloaded: inLib && i < (novel.downloaded || 0),
  }));

  if (state.chapterSort === 'desc') chapters.reverse();

  chapters.forEach(ch => {
    const row = document.createElement('div');
    row.className = `chapter-row${ch.downloaded ? ' downloaded' : ''}`;
    row.innerHTML = `
      <span class="ch-index">${String(ch.index).padStart(3, '0')}</span>
      <span class="ch-title">${ch.title}</span>
      <span class="ch-dl-icon">
        ${ch.downloaded
          ? `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
               <path d="M2 6l3 3 5-5" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>`
          : `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
               <path d="M6 2v6M3.5 6L6 8.5 8.5 6M2 10h8" stroke-linecap="round"/>
             </svg>`
        }
      </span>
    `;
    list.appendChild(row);
  });

  if (novel.chapters > 30) {
    const more = document.createElement('div');
    more.className = 'chapter-row';
    more.style.justifyContent = 'center';
    more.style.color = 'var(--ink-3)';
    more.style.fontSize = '12px';
    more.style.fontFamily = 'var(--font-mono)';
    more.textContent = `... và ${novel.chapters - 30} chương khác`;
    list.appendChild(more);
  }
}

// ── Render Server ─────────────────────────────────────
function renderServer() {
  const logList = document.getElementById('log-list');
  logList.innerHTML = '';

  LOG_ENTRIES.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'log-row';
    row.innerHTML = `
      <div class="log-dot${entry.type === 'error' ? ' error' : ''}"></div>
      <div class="log-content">
        <div class="log-title">${entry.title}</div>
        <div class="log-time">${entry.time}</div>
      </div>
    `;
    logList.appendChild(row);
  });
}

// ── Toast ─────────────────────────────────────────────
let toastTimer = null;

function showToast(icon, title, sub = '') {
  const toast = document.getElementById('toast');
  document.getElementById('toast-icon').textContent  = icon;
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-sub').textContent   = sub;

  toast.style.display = 'flex';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ── Modal ─────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ── Event Listeners ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Initial render
  renderLibrary();
  renderSources();
  renderServer();

  // ── Nav clicks (sidebar + bottom nav)
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => {
      const page = el.dataset.page;
      if (page) navigate(page);
    });
  });

  // ── Filter buttons (library)
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      renderLibrary();
    });
  });

  // ── Category buttons (browse)
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCat = btn.dataset.cat;
      renderBrowseGrid();
    });
  });

  // ── Search input
  const searchInput = document.getElementById('browse-search');
  const searchClear = document.getElementById('search-clear');

  let searchTimer;
  searchInput?.addEventListener('input', () => {
    state.searchQuery = searchInput.value.trim();
    searchClear.style.display = state.searchQuery ? 'block' : 'none';
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderBrowseGrid, 300);
  });

  searchClear?.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClear.style.display = 'none';
    renderBrowseGrid();
  });

  // ── Back button (detail)
  document.getElementById('back-btn')?.addEventListener('click', () => {
    navigate(state.prevPage || 'library');
  });

  // ── Add to library button
  document.getElementById('btn-add-library')?.addEventListener('click', () => {
    const novel = state.detailNovel;
    if (!novel) return;
    LIBRARY_IDS.add(novel.id);
    MOCK_NOVELS.push(novel);

    document.getElementById('btn-add-library').style.display  = 'none';
    document.getElementById('btn-download-all').style.display = 'block';
    document.getElementById('btn-in-library').style.display   = 'block';

    showToast('📚', 'Đã thêm vào thư viện', novel.title);
  });

  // ── Download all button
  document.getElementById('btn-download-all')?.addEventListener('click', () => {
    const novel = state.detailNovel;
    showToast('⬇', `Đang tải ${novel.chapters} chương…`, novel.title);
  });

  // ── Sort button (chapters)
  document.getElementById('sort-btn')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const isAsc = btn.dataset.asc === 'true';
    btn.dataset.asc = String(!isAsc);
    btn.querySelector('span') || (btn.lastChild.textContent = isAsc ? 'Cũ nhất' : 'Mới nhất');
    state.chapterSort = isAsc ? 'asc' : 'desc';
    if (state.detailNovel) renderDetail(state.detailNovel);
  });

  // ── Load more (browse)
  document.getElementById('load-more-btn')?.addEventListener('click', () => {
    showToast('⏳', 'Đang tải thêm…');
  });

  // ── Add source buttons
  ['add-source-btn', 'add-source-row-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      openModal('add-source-modal');
    });
  });

  // ── Modal close
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // ── Click outside modal
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });

  // ── Confirm add source
  document.getElementById('confirm-add-source')?.addEventListener('click', () => {
    const url = document.getElementById('source-url-input').value.trim();
    if (!url) return;
    closeModal('add-source-modal');
    showToast('✓', 'Đã thêm nguồn', url);
    document.getElementById('source-url-input').value = '';
  });

  // ── Copy OPDS URL
  document.getElementById('copy-url-btn')?.addEventListener('click', () => {
    const url = document.getElementById('server-url').textContent;
    navigator.clipboard.writeText(url).then(() => {
      showToast('✓', 'Đã copy URL', 'Paste vào Xteink → OPDS Servers');
    }).catch(() => {
      showToast('✓', 'URL đã được chọn');
    });
  });

  // ── Server toggle
  document.getElementById('server-toggle')?.addEventListener('change', (e) => {
    const on = e.target.checked;
    const indicator = document.getElementById('status-indicator');
    document.getElementById('status-text').textContent = on ? 'Đang chạy' : 'Đã tắt';
    indicator.classList.toggle('offline', !on);

    const pill = document.getElementById('sidebar-server-status');
    if (pill) {
      pill.querySelector('.pill-text').textContent = on ? 'OPDS: online' : 'OPDS: offline';
    }
  });

  // ── Keyboard shortcut: Esc closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => {
        if (m.style.display !== 'none') m.style.display = 'none';
      });
    }
  });

  // ── Sync button
  document.querySelector('[title="Sync tất cả"]')?.addEventListener('click', () => {
    showToast('🔄', 'Đang sync tất cả truyện…');
  });
});
