import fs from "node:fs";
import path from "node:path";

const APP_NAME = "XteinkReader";
const APP_VERSION = "0.1.0";
const FAVICON_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230e0e10'/%3E%3Cpath d='M18 16h10v32H18zm18 0h10v32H36zM52 16 48 48' fill='none' stroke='%23e8c97a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

function assetPath(filename: string) {
  return path.resolve(process.cwd(), "src", "web", "assets", filename);
}

function assetDirPath() {
  return path.resolve(process.cwd(), "src", "web", "assets");
}

function webPath(filename: string) {
  return path.resolve(process.cwd(), "src", "web", filename);
}

function readAsset(filename: string) {
  return fs.readFileSync(assetPath(filename), "utf8");
}

function getAssetVersion() {
  const assetFiles = fs.readdirSync(assetDirPath());
  const assetMtimes = assetFiles.map((filename) => fs.statSync(assetPath(filename)).mtimeMs);
  return String(Math.max(...assetMtimes, fs.statSync(webPath("themeAppShell.html")).mtimeMs));
}

function readThemeBody(filename: string) {
  const html = fs.readFileSync(webPath(filename), "utf8");
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = match?.[1] ?? html;
  return body.replace(/<script\s+src="app\.js"><\/script>\s*$/i, "").trim();
}

const appCss = readAsset("app.css");
const appJs = readAsset("app.js");
const appShellMarkup = readThemeBody("themeAppShell.html");
const assetVersion = getAssetVersion();

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serializeBootData(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

interface AuthBootPayload {
  authenticated: boolean;
  user: string | null;
  username: string | null;
  mustChangePassword: boolean;
  bootstrapMode: boolean;
  bootstrapCredentials:
    | {
        username: string;
        password: string;
      }
    | null;
}

interface BootPayload {
  page: "login" | "app";
  user: string | null;
  currentPath: string;
  nextPath?: string;
  appName: string;
  version: string;
  auth: AuthBootPayload;
}

interface DocumentOptions {
  title: string;
  description: string;
  bodyClass: string;
  boot: BootPayload;
  shellMarkup: string;
}

function renderDocument({ title, description, bodyClass, boot, shellMarkup }: DocumentOptions) {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#0e0e10">
    <meta name="description" content="${escapeHtml(description)}">
    <title>${escapeHtml(title)}</title>
    <link rel="icon" href="${FAVICON_DATA_URI}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400&family=Geist+Mono:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/app.css?v=${assetVersion}">
  </head>
  <body class="${escapeHtml(bodyClass)}">
    ${shellMarkup}
    <script>window.__CPR_BOOT__=${serializeBootData(boot)};</script>
    <script src="/assets/app.js?v=${assetVersion}" defer></script>
  </body>
</html>`;
}

function emptyAuthBootPayload(): AuthBootPayload {
  return {
    authenticated: false,
    user: null,
    username: null,
    mustChangePassword: false,
    bootstrapMode: false,
    bootstrapCredentials: null
  };
}

export function renderLoginPage(options?: {
  nextPath?: string;
  auth?: AuthBootPayload;
}) {
  const nextPath = options?.nextPath || "/library";
  const auth = options?.auth || emptyAuthBootPayload();
  const bootstrapHint =
    auth.bootstrapMode && auth.bootstrapCredentials
      ? `
        <p class="form-hint" style="margin:0 0 16px;">
          Tài khoản mặc định đang được kích hoạt. Đăng nhập lần đầu bằng:
          <br>
          <strong>${escapeHtml(auth.bootstrapCredentials.username)}</strong> /
          <strong>${escapeHtml(auth.bootstrapCredentials.password)}</strong>
        </p>`
      : "";

  return renderDocument({
    title: `${APP_NAME} | Đăng nhập`,
    description: "Đăng nhập quản trị để quản lý thư viện, nguồn, tác vụ và extension.",
    bodyClass: "page-login",
    boot: {
      page: "login",
      user: null,
      currentPath: "/login",
      nextPath,
      appName: APP_NAME,
      version: APP_VERSION,
      auth
    },
    shellMarkup: `
      <div class="modal-overlay" style="display:flex">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Đăng nhập quản trị</h3>
          </div>
          <div class="modal-body">
            <div class="sidebar-logo" style="padding:0 0 18px;border-bottom:1px solid rgba(255,255,255,0.07);margin-bottom:18px;">
              <span class="logo-mark">X</span>
              <span class="logo-text">teink<em>Reader</em></span>
            </div>
            <p class="form-hint" style="margin:0 0 16px;">
              Quản lý thư viện, nguồn, extension và hệ thống đồng bộ bằng giao diện production của XteinkReader Server.
            </p>
            ${bootstrapHint}
            <form id="login-form" novalidate>
              <div style="margin-bottom:14px;">
                <label class="form-label" for="login-username">Tên đăng nhập</label>
                <input
                  class="form-input"
                  id="login-username"
                  name="username"
                  type="text"
                  autocomplete="username"
                  placeholder="admin"
                  value="${escapeHtml(auth.bootstrapCredentials?.username || auth.username || "")}"
                  required
                >
              </div>
              <div>
                <label class="form-label" for="login-password">Mật khẩu</label>
                <input
                  class="form-input"
                  id="login-password"
                  name="password"
                  type="password"
                  autocomplete="current-password"
                  placeholder="Nhập mật khẩu"
                  required
                >
              </div>
              <p
                id="login-error"
                class="form-hint"
                hidden
                aria-live="polite"
                style="color:#d86b6b;margin:12px 0 0;"
              ></p>
              <button class="btn-primary btn-full" style="margin-top:16px;" type="submit">Đăng nhập</button>
            </form>
          </div>
        </div>
      </div>`
  });
}

export function renderAppPage(options: {
  user: string;
  currentPath: string;
  auth: AuthBootPayload;
}) {
  return renderDocument({
    title: `${APP_NAME} | Bảng điều khiển`,
    description: "Giao diện quản trị thư viện, nguồn, OPDS, tác vụ và extension của XteinkReader.",
    bodyClass: "page-app",
    boot: {
      page: "app",
      user: options.user,
      currentPath: options.currentPath,
      appName: APP_NAME,
      version: APP_VERSION,
      auth: options.auth
    },
    shellMarkup: appShellMarkup
  });
}

export function getUiMeta() {
  return {
    name: APP_NAME,
    version: APP_VERSION,
    docs: {
      routeMap: "/server/docs/ROUTE_MAP.md",
      apiContract: "/server/docs/API_CONTRACT_V1.md"
    },
    menus: ["library", "sources", "tasks", "extensions", "settings"],
    routes: {
      login: "/login",
      library: "/library",
      sources: "/sources",
      tasks: "/tasks",
      extensions: "/extensions",
      settings: "/settings"
    }
  };
}

export function getAppCss() {
  return appCss;
}

export function getAppJs() {
  return appJs;
}

export function getAsset(filename: string) {
  return readAsset(filename);
}
