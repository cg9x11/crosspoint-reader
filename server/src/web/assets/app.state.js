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
    novelEditions: {},
    translationProjects: [],
    translationProjectsLoaded: false,
    translationDetail: null,
    activeTranslationProjectId: null,
    translationSettings: null,
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

