import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

import { load as loadHtml } from "cheerio";
import iconv from "iconv-lite";
import { unzipSync } from "fflate";
import { parse } from "acorn";
import { fullAncestor } from "acorn-walk";
import MagicString from "magic-string";

import { fetchBuffer, fetchWithTimeout } from "../../lib/http.js";
import {
  ensureDir,
  fileExists,
  readJsonFile,
  sanitizeFileSegment,
  stableId,
  writeFileAtomic,
  writeJsonFileAtomic
} from "../../lib/filesystem.js";
import type {
  SourceCapabilities,
  SourceChapterContentPayload,
  SourceChapterPayload,
  SourceDetailPayload,
  SourceHandler,
  SourceHomeItem,
  SourceHomePayload,
  SourceListItem,
  SourceSearchPayload
} from "../types.js";

const DEFAULT_FETCH_TIMEOUT_MS = 15000;
const HOME_MENU_LIMIT = 4;
const HOME_SECTION_ITEM_LIMIT = 12;
const SEARCH_PAGE_SIZE_HINT = 24;
const RUNTIME_MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const RUNTIME_DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const RUNTIME_IOS_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const DEFAULT_ACCEPT_HEADER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
const DEFAULT_ACCEPT_LANGUAGE = "en-US,en;q=0.8";
const DEFAULT_ACCEPT_LANGUAGE_VI = "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7";
const DEFAULT_ACCEPT_LANGUAGE_ZH = "zh-CN,zh;q=0.9,en;q=0.8";
const SUSPICIOUS_REDIRECT_HOST_PATTERNS = [
  /(?:^|\.)explorads\.com$/i,
  /(?:^|\.)plarclck\.com$/i,
  /(?:^|\.)exmainclcknew\.com$/i
];

const SUPPORTED_RESPONSE_TERMINALS = new Set(["text", "html", "json", "base64", "blob"]);
const SUPPORTED_HTTP_TERMINALS = new Set(["string", "html", "json", "base64", "blob"]);
const UNSUPPORTED_API_PATTERNS = [
  { pattern: /\bEngine\.newBrowser\s*\(/, reason: "requires browser automation" },
  { pattern: /\bGraphics\./, reason: "requires graphics runtime" },
  { pattern: /\bWebSocket\s*\(/, reason: "requires websocket runtime" },
  { pattern: /\bScript\.execute\s*\(/, reason: "requires Script.execute bridge" }
];

const EMPTY_CAPABILITIES: SourceCapabilities = {
  supportsHome: false,
  supportsSearch: false,
  supportsGenre: false,
  supportsPagination: false,
  supportsDetailDescription: false,
  supportsBrowserAutomation: false
};

interface VbookManifest {
  metadata?: Record<string, unknown>;
  script?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

interface VbookPackageInspection {
  manifest: VbookManifest | null;
  runtimeSupported: boolean;
  issues: string[];
  capabilities: SourceCapabilities;
}

interface RuntimeResponseShape {
  code?: number;
  data?: unknown;
  data2?: unknown;
  message?: string;
}

interface RuntimeExecutionState {
  localStorage: Record<string, unknown>;
  cacheStorage: Record<string, unknown>;
  cookie: string;
}

interface FetchLikeOptions {
  method?: string;
  headers?: Record<string, unknown>;
  body?: unknown;
  timeout?: number;
  queries?: Record<string, unknown>;
}

function getManifestScriptMap(manifest: VbookManifest | null | undefined) {
  if (!manifest?.script || typeof manifest.script !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(manifest.script).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function parseCapabilitiesFromScriptMap(scriptMap?: Record<string, string>): SourceCapabilities {
  const keys = new Set(Object.keys(scriptMap ?? {}));

  return {
    supportsHome: keys.has("home") || keys.has("gen"),
    supportsSearch: keys.has("search"),
    supportsGenre: keys.has("genre"),
    supportsPagination: keys.has("page"),
    supportsDetailDescription: keys.has("detail"),
    supportsBrowserAutomation: keys.has("config") || keys.has("crypto")
  };
}

function normalizeRelativeScriptPath(scriptName: string) {
  return scriptName.replace(/\\/g, "/").replace(/^\.?\//, "");
}

function normalizeUrl(rawUrl: string, baseUrl?: string) {
  const url = rawUrl.trim();

  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (!baseUrl) {
    return url;
  }

  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

function defaultAcceptLanguage(locale?: string) {
  if (!locale) {
    return DEFAULT_ACCEPT_LANGUAGE;
  }

  if (/^vi(?:[_-]|$)/i.test(locale)) {
    return DEFAULT_ACCEPT_LANGUAGE_VI;
  }

  if (/^zh(?:[_-]|$)/i.test(locale)) {
    return DEFAULT_ACCEPT_LANGUAGE_ZH;
  }

  return DEFAULT_ACCEPT_LANGUAGE;
}

function getUrlOrigin(rawUrl: string) {
  try {
    return `${new URL(rawUrl).origin}/`;
  } catch {
    return undefined;
  }
}

function swapUrlProtocol(rawUrl: string, protocol: "http:" | "https:") {
  try {
    const url = new URL(rawUrl);
    url.protocol = protocol;
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function withAlternateHost(rawUrl: string, hostname: string) {
  try {
    const url = new URL(rawUrl);
    url.hostname = hostname;
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function getAlternateHosts(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname.startsWith("www.")) {
      return [url.hostname.slice(4)];
    }
    return [`www.${url.hostname}`];
  } catch {
    return [];
  }
}

function collectErrorMessages(error: unknown) {
  const messages: string[] = [];
  let current: unknown = error;

  while (current && typeof current === "object") {
    const message =
      typeof (current as { message?: unknown }).message === "string"
        ? (current as { message: string }).message
        : null;

    if (message) {
      messages.push(message);
    }

    current = (current as { cause?: unknown }).cause;
  }

  return messages.join(" | ");
}

function isTlsAltNameError(error: unknown) {
  return /ERR_TLS_CERT_ALTNAME_INVALID|certificate's altnames|Hostname\/IP does not match certificate/i.test(
    collectErrorMessages(error)
  );
}

function isSocketClosedError(error: unknown) {
  return /other side closed|UND_ERR_SOCKET|socket hang up|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENOTFOUND/i.test(
    collectErrorMessages(error)
  );
}

function isRetryableStatusCode(status: number) {
  return status === 403 || status === 408 || status === 425 || status === 429 || status >= 500;
}

function isSuspiciousRedirectHost(requestUrl: string, responseUrl: string) {
  try {
    const requestHost = new URL(requestUrl).hostname;
    const responseHost = new URL(responseUrl).hostname;

    if (requestHost === responseHost) {
      return false;
    }

    return SUSPICIOUS_REDIRECT_HOST_PATTERNS.some((pattern) => pattern.test(responseHost));
  } catch {
    return false;
  }
}

function buildSourceBaseUrl(source: Pick<SourceListItem, "sourceUrl">, manifest: VbookManifest | null) {
  const metadataSource = manifest?.metadata?.source;
  if (typeof metadataSource === "string" && metadataSource.trim()) {
    return metadataSource.trim();
  }

  if (typeof source.sourceUrl === "string" && source.sourceUrl.trim() && source.sourceUrl !== "builtin://core-demo") {
    return source.sourceUrl.trim();
  }

  return "";
}

function buildHeadersRecord(headers: Headers) {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });
  return record;
}

function extractCookieValue(input: string) {
  return input
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)[0] ?? "";
}

function mergeCookieStrings(existingCookie: string, nextCookies: string[]) {
  const merged = new Map<string, string>();

  for (const chunk of [existingCookie, ...nextCookies]) {
    const cookie = extractCookieValue(chunk);
    if (!cookie) {
      continue;
    }

    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    merged.set(cookie.slice(0, separatorIndex).trim(), cookie.slice(separatorIndex + 1).trim());
  }

  return Array.from(merged.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

function decodeBuffer(buffer: Buffer, charset?: string) {
  if (!charset || /^utf-?8$/i.test(charset)) {
    return buffer.toString("utf8");
  }

  try {
    return iconv.decode(buffer, charset);
  } catch {
    return buffer.toString("utf8");
  }
}

function normalizeStatus(raw: unknown) {
  if (typeof raw === "boolean") {
    return raw ? "ongoing" : "completed";
  }

  if (typeof raw !== "string") {
    return "unknown";
  }

  const value = raw.trim().toLowerCase();
  if (!value) {
    return "unknown";
  }

  if (
    value.includes("ongoing") ||
    value.includes("đang") ||
    value.includes("dang") ||
    value.includes("còn tiếp") ||
    value.includes("con tiep") ||
    value.includes("连载")
  ) {
    return "ongoing";
  }

  if (
    value.includes("completed") ||
    value.includes("hoàn thành") ||
    value.includes("hoan thanh") ||
    value.includes("full") ||
    value.includes("完结")
  ) {
    return "completed";
  }

  return "unknown";
}

function getStringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function extractGenreTitles(rawGenres: unknown) {
  if (!Array.isArray(rawGenres)) {
    return [];
  }

  const titles = rawGenres
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim();
      }

      if (entry && typeof entry === "object") {
        const title = getStringField(entry as Record<string, unknown>, ["title", "name", "text"]);
        return title?.trim() ?? "";
      }

      return "";
    })
    .filter(Boolean);

  return Array.from(new Set(titles));
}

function isNovelItemShape(record: Record<string, unknown>) {
  const explicitDetailUrl = getStringField(record, ["link", "url", "detailUrl"]);
  const fallbackInput = getStringField(record, ["input"]);
  const hasScript = Boolean(getStringField(record, ["script"]));
  return Boolean(explicitDetailUrl || (fallbackInput && !hasScript)) && Boolean(getStringField(record, ["name", "title"]));
}

function isMenuItemShape(record: Record<string, unknown>) {
  return Boolean(getStringField(record, ["script", "title"])) && Boolean(getStringField(record, ["input", "url"]));
}

function normalizeHomeItem(
  sourceId: string,
  sourceBaseUrl: string,
  rawItem: Record<string, unknown>
): SourceHomeItem | null {
  const title = getStringField(rawItem, ["title", "name"]);
  const detailUrlRaw =
    getStringField(rawItem, ["detailUrl", "link", "url"]) ??
    (getStringField(rawItem, ["script"]) ? undefined : getStringField(rawItem, ["input"]));

  if (!title || !detailUrlRaw) {
    return null;
  }

  const host = getStringField(rawItem, ["host"]);
  const detailUrl = normalizeUrl(detailUrlRaw, host || sourceBaseUrl);
  const coverUrl = getStringField(rawItem, ["coverUrl", "cover", "image"]);
  const description = getStringField(rawItem, ["description", "detail"]);

  return {
    id: stableId("novel", `${sourceId}:${detailUrl}`),
    title,
    author: getStringField(rawItem, ["author"]),
    coverUrl: coverUrl ? normalizeUrl(coverUrl, host || sourceBaseUrl) : undefined,
    description,
    status: normalizeStatus(rawItem.status ?? rawItem.ongoing),
    detailUrl
  };
}

function normalizeChapterUrl(rawItem: Record<string, unknown>, sourceBaseUrl: string) {
  const url = getStringField(rawItem, ["url", "link", "input", "detailUrl"]);
  const host = getStringField(rawItem, ["host"]);
  return url ? normalizeUrl(url, host || sourceBaseUrl) : "";
}

function toRuntimeData(result: unknown) {
  if (result == null) {
    throw new Error("Extension returned no data");
  }

  if (typeof result === "object") {
    const response = result as RuntimeResponseShape;
    if (typeof response.code === "number") {
      if (response.code === 0) {
        return response.data;
      }

      throw new Error(
        typeof response.message === "string"
          ? response.message
          : typeof response.data === "string"
            ? response.data
            : "Extension returned an error"
      );
    }
  }

  return result;
}

function collectScriptFiles(contentRoot: string, entries: string[] = []) {
  if (!fs.existsSync(contentRoot)) {
    return entries;
  }

  for (const entry of fs.readdirSync(contentRoot, { withFileTypes: true })) {
    const absolutePath = path.join(contentRoot, entry.name);
    if (entry.isDirectory()) {
      collectScriptFiles(absolutePath, entries);
      continue;
    }

    if (entry.isFile() && absolutePath.toLowerCase().endsWith(".js")) {
      entries.push(absolutePath);
    }
  }

  return entries;
}

function resolveScriptPathSync(packageDir: string, scriptName: string) {
  const normalized = normalizeRelativeScriptPath(scriptName);
  const candidates = normalized.includes("/")
    ? [path.join(packageDir, normalized)]
    : [path.join(packageDir, normalized), path.join(packageDir, "src", normalized)];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function hasMaterializedScripts(packageDir: string, manifest: VbookManifest | null) {
  const scriptMap = getManifestScriptMap(manifest);
  return Object.values(scriptMap).some((scriptName) => resolveScriptPathSync(packageDir, scriptName));
}

function isFunctionNode(node: any): node is { type: string; start: number; async?: boolean } {
  return Boolean(
    node &&
      typeof node === "object" &&
      typeof node.type === "string" &&
      (node.type === "FunctionDeclaration" ||
        node.type === "FunctionExpression" ||
        node.type === "ArrowFunctionExpression")
  );
}

function getMemberPropertyName(node: any) {
  if (!node || node.type !== "MemberExpression") {
    return null;
  }

  if (!node.computed && node.property?.type === "Identifier") {
    return node.property.name;
  }

  if (node.computed && typeof node.property?.value === "string") {
    return node.property.value;
  }

  return null;
}

function isIdentifierCall(node: any, name: string) {
  return Boolean(node?.callee?.type === "Identifier" && node.callee.name === name);
}

function isHttpBuilderRoot(node: any): boolean {
  if (!node || typeof node !== "object") {
    return false;
  }

  if (node.type !== "CallExpression" || node.callee?.type !== "MemberExpression") {
    return false;
  }

  const propertyName = getMemberPropertyName(node.callee);
  if (node.callee.object?.type === "Identifier" && node.callee.object.name === "Http") {
    return propertyName === "get" || propertyName === "post";
  }

  return isHttpBuilderRoot(node.callee.object);
}

function transformRuntimeScript(sourceCode: string, filename: string) {
  const magic = new MagicString(sourceCode);
  const ast = parse(sourceCode, {
    ecmaVersion: "latest",
    allowReturnOutsideFunction: true
  }) as any;

  const functionsToAsync = new Set<any>();

  const markAwaitedExpression = (node: any, enclosingFunction: any | undefined) => {
    magic.prependLeft(node.start, "(await ");
    magic.appendRight(node.end, ")");
    if (enclosingFunction && !enclosingFunction.async) {
      functionsToAsync.add(enclosingFunction);
    }
  };

  fullAncestor(ast, (node: any, _state: unknown, ancestors: any[]) => {
    const parent = ancestors.at(-2);
    const enclosingFunction = [...ancestors].reverse().find((candidate) => isFunctionNode(candidate));

    if (node.type === "CallExpression" && isIdentifierCall(node, "sleep")) {
      markAwaitedExpression(node, enclosingFunction);
      return;
    }

    if (node.type === "CallExpression" && isIdentifierCall(node, "fetch")) {
      if (parent?.type === "MemberExpression" && parent.object === node) {
        return;
      }

      markAwaitedExpression(node, enclosingFunction);
      return;
    }

    if (node.type !== "CallExpression" || node.callee?.type !== "MemberExpression") {
      return;
    }

    const propertyName = getMemberPropertyName(node.callee);
    if (!propertyName) {
      return;
    }

    if (SUPPORTED_RESPONSE_TERMINALS.has(propertyName) && isIdentifierCall(node.callee.object, "fetch")) {
      const fetchCall = node.callee.object;
      magic.prependLeft(fetchCall.start, "(await ");
      magic.appendRight(fetchCall.end, ")");
      if (enclosingFunction && !enclosingFunction.async) {
        functionsToAsync.add(enclosingFunction);
      }
      return;
    }

    if (SUPPORTED_HTTP_TERMINALS.has(propertyName) && isHttpBuilderRoot(node.callee.object)) {
      markAwaitedExpression(node, enclosingFunction);
    }
  });

  for (const functionNode of Array.from(functionsToAsync).sort((left, right) => left.start - right.start)) {
    magic.prependLeft(functionNode.start, "async ");
  }

  return magic.toString();
}

class VbookBlob {
  readonly _isBlob = true;
  readonly _base64: string;
  readonly type: string;
  readonly size: number;

  constructor(base64: string, type = "application/octet-stream") {
    this._base64 = base64;
    this.type = type;
    this.size = Buffer.from(base64, "base64").byteLength;
  }

  static fromBase64(base64: string, type = "application/octet-stream") {
    return new VbookBlob(base64, type);
  }

  base64() {
    return this._base64;
  }

  toString() {
    return this._base64;
  }
}

class VbookHtmlElement {
  constructor(
    private readonly $: ReturnType<typeof loadHtml>,
    private readonly node: any | null
  ) {}

  select(selector: string) {
    if (!this.node) {
      return new VbookHtmlElements(this.$, []);
    }

    return new VbookHtmlElements(this.$, this.$(this.node).find(selector).toArray());
  }

  attr(attrName: string) {
    if (!this.node) {
      return "";
    }

    const value = this.$(this.node).attr(attrName);
    return typeof value === "string" ? value : "";
  }

  text() {
    if (!this.node) {
      return "";
    }

    return this.$(this.node).text();
  }

  html() {
    if (!this.node) {
      return "";
    }

    const html = this.$(this.node).html();
    return typeof html === "string" ? html : "";
  }

  attributes() {
    return this.node?.attribs ? { ...this.node.attribs } : {};
  }

  remove() {
    if (this.node) {
      this.$(this.node).remove();
    }
  }

  toString() {
    return this.html();
  }
}

class VbookHtmlElements implements Iterable<VbookHtmlElement> {
  constructor(
    private readonly $: ReturnType<typeof loadHtml>,
    private readonly nodes: any[]
  ) {}

  get length() {
    return this.nodes.length;
  }

  size() {
    return this.nodes.length;
  }

  isEmpty() {
    return this.nodes.length === 0;
  }

  get(index: number) {
    return new VbookHtmlElement(this.$, this.nodes[index] ?? null);
  }

  first() {
    return this.get(0);
  }

  last() {
    return this.get(this.nodes.length - 1);
  }

  select(selector: string) {
    const nested = this.nodes.flatMap((node) => this.$(node).find(selector).toArray());
    return new VbookHtmlElements(this.$, nested);
  }

  attr(attrName: string) {
    if (this.nodes.length === 0) {
      return "";
    }

    const value = this.$(this.nodes[0]).attr(attrName);
    return typeof value === "string" ? value : "";
  }

  text() {
    return this.nodes.map((node) => this.$(node).text()).join("");
  }

  html() {
    if (this.nodes.length === 0) {
      return "";
    }

    const html = this.$(this.nodes[0]).html();
    return typeof html === "string" ? html : "";
  }

  remove() {
    for (const node of this.nodes) {
      this.$(node).remove();
    }
  }

  forEach(callback: (element: VbookHtmlElement, index: number) => void) {
    this.nodes.forEach((node, index) => callback(new VbookHtmlElement(this.$, node), index));
  }

  map<T>(callback: (element: VbookHtmlElement, index: number) => T) {
    return this.nodes.map((node, index) => callback(new VbookHtmlElement(this.$, node), index));
  }

  *[Symbol.iterator](): Iterator<VbookHtmlElement> {
    for (const node of this.nodes) {
      yield new VbookHtmlElement(this.$, node);
    }
  }
}

class VbookHttpResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly request: { url: string; headers: Record<string, unknown> };

  constructor(
    private readonly body: Buffer,
    response: {
      ok: boolean;
      status: number;
      statusText: string;
      url: string;
      headers: Record<string, string>;
      request: { url: string; headers: Record<string, unknown> };
      contentType?: string;
    }
  ) {
    this.ok = response.ok;
    this.status = response.status;
    this.statusText = response.statusText;
    this.url = response.url;
    this.headers = response.headers;
    this.request = response.request;
    this.contentType = response.contentType ?? this.headers["content-type"] ?? "application/octet-stream";
  }

  private readonly contentType: string;

  header(key: string) {
    return this.headers[key.toLowerCase()] ?? "";
  }

  text(charset?: string) {
    return decodeBuffer(this.body, charset);
  }

  html(charset?: string) {
    const $ = loadHtml(this.text(charset));
    return new VbookHtmlElement($, $.root().get(0) ?? null);
  }

  json(charset?: string) {
    return JSON.parse(this.text(charset));
  }

  base64() {
    return this.body.toString("base64");
  }

  blob() {
    return new VbookBlob(this.base64(), this.contentType);
  }
}

class KeyValueStorage {
  constructor(private readonly data: Record<string, unknown>) {}

  setItem(key: string, value: unknown) {
    this.data[key] = value;
  }

  getItem(key: string) {
    return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null;
  }

  removeItem(key: string) {
    delete this.data[key];
  }

  clear() {
    Object.keys(this.data).forEach((key) => delete this.data[key]);
  }
}

class CookieStorage {
  constructor(private cookie: string) {}

  setCookie(cookie: string) {
    this.cookie = mergeCookieStrings(this.cookie, [cookie]);
  }

  mergeCookies(cookies: string[]) {
    this.cookie = mergeCookieStrings(this.cookie, cookies);
  }

  getCookie() {
    return this.cookie;
  }
}

class VbookHttpRequestBuilder {
  private headersMap: Record<string, unknown> = {};
  private queryMap: Record<string, unknown> = {};
  private timeoutMs = DEFAULT_FETCH_TIMEOUT_MS;
  private requestBody: unknown;

  constructor(
    private readonly session: VbookRuntimeSession,
    private readonly method: "GET" | "POST",
    private readonly rawUrl: string
  ) {}

  headers(headers: Record<string, unknown>) {
    this.headersMap = { ...this.headersMap, ...headers };
    return this;
  }

  params(queries: Record<string, unknown>) {
    return this.queries(queries);
  }

  queries(queries: Record<string, unknown>) {
    this.queryMap = { ...this.queryMap, ...queries };
    return this;
  }

  timeout(timeoutMs: number) {
    this.timeoutMs = timeoutMs;
    return this;
  }

  body(data: unknown) {
    this.requestBody = data;
    return this;
  }

  binary(base64: string, type = "application/octet-stream") {
    this.requestBody = VbookBlob.fromBase64(base64, type);
    return this;
  }

  url() {
    return this.session.buildRequestUrl(this.rawUrl, this.queryMap);
  }

  private execute() {
    return this.session.fetch(this.rawUrl, {
      method: this.method,
      headers: this.headersMap,
      body: this.requestBody,
      timeout: this.timeoutMs,
      queries: this.queryMap
    });
  }

  async string(charset?: string) {
    return (await this.execute()).text(charset);
  }

  async html(charset?: string) {
    return (await this.execute()).html(charset);
  }

  async json(charset?: string) {
    return (await this.execute()).json(charset);
  }

  async base64() {
    return (await this.execute()).base64();
  }

  async blob() {
    return (await this.execute()).blob();
  }
}

class VbookRuntimeSession {
  private readonly localStorageData: KeyValueStorage;
  private readonly cacheStorageData: KeyValueStorage;
  private readonly cookieStorage: CookieStorage;

  constructor(
    private readonly packageDir: string,
    private readonly stateDir: string,
    private readonly manifest: VbookManifest | null,
    readonly source: SourceListItem,
    private readonly state: RuntimeExecutionState
  ) {
    this.localStorageData = new KeyValueStorage(this.state.localStorage);
    this.cacheStorageData = new KeyValueStorage(this.state.cacheStorage);
    this.cookieStorage = new CookieStorage(this.state.cookie);
  }

  get baseUrl() {
    return buildSourceBaseUrl(this.source, this.manifest);
  }

  buildRequestUrl(rawUrl: string, queries?: Record<string, unknown>) {
    const normalized = normalizeUrl(rawUrl, this.baseUrl);
    if (!queries || Object.keys(queries).length === 0) {
      return normalized;
    }

    try {
      const url = new URL(normalized);
      for (const [key, value] of Object.entries(queries)) {
        if (value == null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
      return url.toString();
    } catch {
      return normalized;
    }
  }

  private buildFetchHeaders(requestUrl: string, baseHeaders: Headers, userAgentOverride?: string) {
    const headers = new Headers(baseHeaders);

    if (!headers.has("user-agent")) {
      headers.set("user-agent", userAgentOverride ?? RUNTIME_MOBILE_USER_AGENT);
    }

    if (!headers.has("accept")) {
      headers.set("accept", DEFAULT_ACCEPT_HEADER);
    }

    if (!headers.has("accept-language")) {
      headers.set("accept-language", defaultAcceptLanguage(this.source.locale));
    }

    if (!headers.has("referer")) {
      const origin = getUrlOrigin(requestUrl);
      if (origin) {
        headers.set("referer", origin);
      }
    }

    if (!headers.has("cache-control")) {
      headers.set("cache-control", "no-cache");
    }

    if (!headers.has("pragma")) {
      headers.set("pragma", "no-cache");
    }

    if (!headers.has("upgrade-insecure-requests")) {
      headers.set("upgrade-insecure-requests", "1");
    }

    if (!headers.has("cookie")) {
      const cookie = this.cookieStorage.getCookie();
      if (cookie) {
        headers.set("cookie", cookie);
      }
    }

    return headers;
  }

  private async executeFetchRequest(
    requestUrl: string,
    method: string,
    headers: Headers,
    body: Buffer | string | undefined,
    timeoutMs: number
  ) {
    const response = await fetchWithTimeout(
      requestUrl,
      {
        method,
        headers,
        body
      },
      timeoutMs
    );

    if (typeof response.headers.getSetCookie === "function") {
      const setCookies = response.headers.getSetCookie();
      if (setCookies.length > 0) {
        this.cookieStorage.mergeCookies(setCookies);
      }
    }

    return response;
  }

  async fetch(rawUrl: string, options?: FetchLikeOptions) {
    const requestUrl = this.buildRequestUrl(rawUrl, options?.queries);
    const method = options?.method ?? "GET";
    const timeoutMs = options?.timeout ?? DEFAULT_FETCH_TIMEOUT_MS;
    const explicitHeaders = new Headers();

    for (const [key, value] of Object.entries(options?.headers ?? {})) {
      if (value == null) {
        continue;
      }
      explicitHeaders.set(key, String(value));
    }

    let body: Buffer | string | undefined;
    if (typeof options?.body === "string") {
      body = options.body;
    } else if (options?.body instanceof VbookBlob) {
      body = Buffer.from(options.body.base64(), "base64");
      if (!explicitHeaders.has("content-type")) {
        explicitHeaders.set("content-type", options.body.type);
      }
    } else if (Buffer.isBuffer(options?.body)) {
      body = options.body;
    }

    const attempts: Array<{ url: string; headers: Headers; reason: string }> = [];
    const seenAttempts = new Set<string>();
    const addAttempt = (url: string, reason: string, userAgentOverride?: string) => {
      const headers = this.buildFetchHeaders(url, explicitHeaders, userAgentOverride);
      const key = `${url}@@${headers.get("user-agent") ?? ""}`;
      if (!url || seenAttempts.has(key)) {
        return;
      }
      seenAttempts.add(key);
      attempts.push({ url, headers, reason });
    };
    const addFallbackAttempts = (currentUrl: string, reason: string, includeHttpFallback: boolean) => {
      addAttempt(currentUrl, `${reason}:desktop`, RUNTIME_DESKTOP_USER_AGENT);
      addAttempt(currentUrl, `${reason}:ios`, RUNTIME_IOS_USER_AGENT);

      for (const hostname of getAlternateHosts(currentUrl)) {
        const alternateUrl = withAlternateHost(currentUrl, hostname);
        addAttempt(alternateUrl, `${reason}:alt-host`);
        addAttempt(alternateUrl, `${reason}:alt-host-desktop`, RUNTIME_DESKTOP_USER_AGENT);
      }

      if (includeHttpFallback && currentUrl.startsWith("https://")) {
        const httpUrl = swapUrlProtocol(currentUrl, "http:");
        addAttempt(httpUrl, `${reason}:http`);
        addAttempt(httpUrl, `${reason}:http-desktop`, RUNTIME_DESKTOP_USER_AGENT);
      }
    };

    addAttempt(requestUrl, "primary");

    let lastError: unknown = new Error(`fetch failed for ${requestUrl}`);
    while (attempts.length > 0) {
      const attempt = attempts.shift();
      if (!attempt) {
        continue;
      }

      try {
        const response = await this.executeFetchRequest(
          attempt.url,
          method,
          attempt.headers,
          body,
          timeoutMs
        );

        if (isSuspiciousRedirectHost(attempt.url, response.url)) {
          lastError = new Error(`unexpected redirect from ${attempt.url} to ${response.url}`);
          addFallbackAttempts(attempt.url, "redirect", true);
          continue;
        }

        if (isRetryableStatusCode(response.status)) {
          lastError = new Error(`upstream responded ${response.status} for ${attempt.url}`);
          addFallbackAttempts(attempt.url, `status-${response.status}`, response.status >= 500);
          if (attempts.length > 0) {
            continue;
          }
        }

        return new VbookHttpResponse(Buffer.from(await response.arrayBuffer()), {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: buildHeadersRecord(response.headers),
          request: {
            url: attempt.url,
            headers: Object.fromEntries(attempt.headers.entries())
          },
          contentType: response.headers.get("content-type") ?? undefined
        });
      } catch (error) {
        lastError = error;

        if (isTlsAltNameError(error)) {
          addFallbackAttempts(attempt.url, "tls-altname", true);
          continue;
        }

        if (isSocketClosedError(error)) {
          addFallbackAttempts(attempt.url, "socket", true);
          continue;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`fetch failed for ${requestUrl}`);
  }

  private buildContext(currentScriptPath: string) {
    const evaluateScriptSync = (scriptPath: string) => {
      const absolutePath = path.isAbsolute(scriptPath)
        ? scriptPath
        : resolveScriptPathSync(path.dirname(currentScriptPath), scriptPath) ??
          resolveScriptPathSync(this.packageDir, scriptPath);

      if (!absolutePath) {
        throw new Error(`Loaded script not found: ${scriptPath}`);
      }

      const nestedSource = fs.readFileSync(absolutePath, "utf8");
      const nestedCode = transformRuntimeScript(nestedSource, absolutePath);
      new vm.Script(nestedCode, { filename: absolutePath }).runInContext(context);
    };

    const htmlBridge = {
      parse: (html: string) => {
        const $ = loadHtml(html);
        return new VbookHtmlElement($, $.root().get(0) ?? null);
      },
      clean: (html: string, tags: string[]) => {
        const $ = loadHtml(html);
        for (const tag of tags) {
          $(tag).each((_, element) => {
            $(element).replaceWith($(element).html() ?? "");
          });
        }
        return $.root().html() ?? "";
      }
    };

    const contextObject = {
      console,
      JSON,
      Math,
      Date,
      RegExp,
      String,
      Number,
      Boolean,
      Array,
      Object,
      URL,
      URLSearchParams,
      Response: {
        success: (data: unknown, data2?: unknown) => ({ code: 0, data, data2 }),
        error: (message: string) => ({ code: 1, data: message })
      },
      fetch: (url: string, options?: FetchLikeOptions) => this.fetch(url, options),
      Http: {
        get: (url: string) => new VbookHttpRequestBuilder(this, "GET", url),
        post: (url: string) => new VbookHttpRequestBuilder(this, "POST", url)
      },
      Html: htmlBridge,
      Blob: VbookBlob,
      UserAgent: {
        system: () => "xteinkreader-server/0.1",
        android: () => RUNTIME_MOBILE_USER_AGENT,
        chrome: () => RUNTIME_DESKTOP_USER_AGENT,
        ios: () => RUNTIME_IOS_USER_AGENT
      },
      load: (scriptPath: string) => evaluateScriptSync(scriptPath),
      sleep: (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
      localStorage: this.localStorageData,
      cacheStorage: this.cacheStorageData,
      localCookie: this.cookieStorage,
      localConfig: {
        getItem: (key: string) => this.manifest?.config?.[key] ?? null
      },
      Log: {
        log: (...args: unknown[]) => console.log(...args)
      }
    };

    if (typeof (contextObject.String as unknown as { format?: unknown }).format !== "function") {
      (contextObject.String as unknown as { format: (template: string, ...args: unknown[]) => string }).format = (
        template: string,
        ...args: unknown[]
      ) =>
        template.replace(/\{(\d+)\}/g, (_, index) => {
          const value = args[Number(index)];
          return value == null ? "" : String(value);
        });
    }

    const context = vm.createContext(contextObject);
    return context;
  }

  async runScript(scriptName: string, args: unknown[]) {
    const absoluteScriptPath = resolveScriptPathSync(this.packageDir, scriptName);
    if (!absoluteScriptPath) {
      throw new Error(`Script not found: ${scriptName}`);
    }

    const sourceCode = await fsp.readFile(absoluteScriptPath, "utf8");
    const transformedSource = transformRuntimeScript(sourceCode, absoluteScriptPath);
    const context = this.buildContext(absoluteScriptPath);

    new vm.Script(transformedSource, { filename: absoluteScriptPath }).runInContext(context);

    const execute = (context as Record<string, unknown>).execute;
    if (typeof execute !== "function") {
      throw new Error(`Script ${scriptName} does not export execute()`);
    }

    const result = await (execute as (...params: unknown[]) => unknown)(...args);
    return toRuntimeData(result);
  }

  async flush() {
    await ensureDir(this.stateDir);
    await Promise.all([
      writeJsonFileAtomic(path.join(this.stateDir, "localStorage.json"), this.state.localStorage),
      writeJsonFileAtomic(path.join(this.stateDir, "cacheStorage.json"), this.state.cacheStorage),
      writeFileAtomic(path.join(this.stateDir, "cookies.txt"), `${this.cookieStorage.getCookie()}\n`)
    ]);
  }
}

async function loadRuntimeState(stateDir: string): Promise<RuntimeExecutionState> {
  const [localStorageData, cacheStorageData, cookie] = await Promise.all([
    readJsonFile<Record<string, unknown>>(path.join(stateDir, "localStorage.json"), {}),
    readJsonFile<Record<string, unknown>>(path.join(stateDir, "cacheStorage.json"), {}),
    (await fileExists(path.join(stateDir, "cookies.txt")))
      ? fsp.readFile(path.join(stateDir, "cookies.txt"), "utf8").then((value) => value.trim())
      : Promise.resolve("")
  ]);

  return {
    localStorage: localStorageData,
    cacheStorage: cacheStorageData,
    cookie
  };
}

async function runWithSession<T>(
  packageDir: string,
  stateDir: string,
  manifest: VbookManifest | null,
  source: SourceListItem,
  fn: (session: VbookRuntimeSession) => Promise<T>
) {
  const session = new VbookRuntimeSession(packageDir, stateDir, manifest, source, await loadRuntimeState(stateDir));
  try {
    return await fn(session);
  } finally {
    await session.flush();
  }
}

async function extractArchiveToPackageDir(packageDir: string, archive: Buffer) {
  const files = unzipSync(new Uint8Array(archive));

  for (const [relativeName, fileData] of Object.entries(files)) {
    if (!relativeName || relativeName.endsWith("/")) {
      continue;
    }

    const normalizedPath = relativeName.replace(/\\/g, "/");
    const safeSegments = normalizedPath.split("/").filter(Boolean);
    if (safeSegments.length === 0 || safeSegments.some((segment) => segment === "." || segment === "..")) {
      continue;
    }

    const targetPath = path.join(packageDir, ...safeSegments);
    await writeFileAtomic(targetPath, Buffer.from(fileData));
  }
}

async function downloadManifestScripts(packageDir: string, manifestUrl: string, manifest: VbookManifest) {
  const scriptMap = getManifestScriptMap(manifest);
  const manifestBaseUrl = manifestUrl.slice(0, manifestUrl.lastIndexOf("/") + 1);

  await Promise.all(
    Object.values(scriptMap).map(async (scriptName) => {
      const normalized = normalizeRelativeScriptPath(scriptName);
      const relativePath = normalized.includes("/") ? normalized : `src/${normalized}`;
      const targetPath = path.join(packageDir, ...relativePath.split("/"));

      if (await fileExists(targetPath)) {
        return;
      }

      const scriptUrl = new URL(relativePath, manifestBaseUrl).toString();
      const scriptBuffer = await fetchBuffer(scriptUrl);
      await writeFileAtomic(targetPath, scriptBuffer);
    })
  );
}

export async function loadVbookManifest(packageDir: string) {
  const manifestPath = path.join(packageDir, "plugin.json");
  if (!(await fileExists(manifestPath))) {
    return null;
  }

  return readJsonFile<VbookManifest | null>(manifestPath, null);
}

export async function hydrateVbookPackage(packageDir: string, manifestUrl?: string) {
  const manifest = await loadVbookManifest(packageDir);
  if (!manifest) {
    return null;
  }

  if (!hasMaterializedScripts(packageDir, manifest)) {
    const archivePath = path.join(packageDir, "plugin.zip");
    if (await fileExists(archivePath)) {
      await extractArchiveToPackageDir(packageDir, await fsp.readFile(archivePath));
    } else if (manifestUrl) {
      await downloadManifestScripts(packageDir, manifestUrl, manifest);
    }
  }

  return manifest;
}

export async function inspectVbookPackage(packageDir: string): Promise<VbookPackageInspection> {
  const manifest = await loadVbookManifest(packageDir);
  const scriptMap = getManifestScriptMap(manifest);
  const capabilities = parseCapabilitiesFromScriptMap(scriptMap);
  const issues: string[] = [];

  if (!manifest) {
    return {
      manifest: null,
      runtimeSupported: false,
      issues: ["missing plugin.json"],
      capabilities: EMPTY_CAPABILITIES
    };
  }

  for (const requiredScript of ["detail", "toc", "chap"]) {
    const fileName = scriptMap[requiredScript];
    if (!fileName || !resolveScriptPathSync(packageDir, fileName)) {
      issues.push(`missing required script ${requiredScript}`);
    }
  }

  const scriptFiles = collectScriptFiles(path.join(packageDir, "src"));
  if (scriptFiles.length === 0) {
    const fallbackRootFiles = collectScriptFiles(packageDir);
    for (const filePath of fallbackRootFiles) {
      if (!scriptFiles.includes(filePath)) {
        scriptFiles.push(filePath);
      }
    }
  }

  for (const filePath of scriptFiles) {
    const sourceCode = await fsp.readFile(filePath, "utf8");
    for (const unsupportedApi of UNSUPPORTED_API_PATTERNS) {
      if (unsupportedApi.pattern.test(sourceCode)) {
        issues.push(`${path.basename(filePath)} ${unsupportedApi.reason}`);
      }
    }
  }

  return {
    manifest,
    runtimeSupported: issues.length === 0,
    issues: Array.from(new Set(issues)),
    capabilities
  };
}

export async function createVbookSourceRuntime(options: {
  packageDir: string;
  stateDir: string;
  source: SourceListItem;
}): Promise<SourceHandler> {
  const manifest = await loadVbookManifest(options.packageDir);
  if (!manifest) {
    throw new Error("Extension package is missing plugin.json");
  }

  const scriptMap = getManifestScriptMap(manifest);
  const sourceBaseUrl = buildSourceBaseUrl(options.source, manifest);

  const executeScript = async (scriptName: string, args: unknown[]) =>
    runWithSession(options.packageDir, options.stateDir, manifest, options.source, (session) =>
      session.runScript(scriptName, args)
    );

  const executeNamedScript = async (key: string, args: unknown[]) => {
    const scriptName = scriptMap[key];
    if (!scriptName) {
      throw new Error(`Extension does not provide ${key}.js`);
    }
    return executeScript(scriptName, args);
  };

  const mapHomeItems = (rawItems: unknown) =>
    Array.isArray(rawItems)
      ? rawItems
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
          .map((item) => normalizeHomeItem(options.source.id, sourceBaseUrl, item))
          .filter((item): item is SourceHomeItem => Boolean(item))
      : [];

  return {
    async home(): Promise<SourceHomePayload> {
      const rawHomeData = await executeNamedScript("home", []);
      const directItems = mapHomeItems(rawHomeData);
      const homeEntries = Array.isArray(rawHomeData)
        ? rawHomeData.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        : [];

      const menuEntries = homeEntries.filter((item) => isMenuItemShape(item) && !isNovelItemShape(item));
      const sections: SourceHomePayload["sections"] = [];

      if (directItems.length > 0) {
        sections.push({
          id: "home",
          title: "Trang chu",
          items: directItems.slice(0, HOME_SECTION_ITEM_LIMIT)
        });
      }

      if (menuEntries.length > 0) {
        const menuSections = (
          await Promise.all(
          menuEntries.slice(0, HOME_MENU_LIMIT).map(async (entry, index) => {
            const scriptName = getStringField(entry, ["script"]);
            const input = getStringField(entry, ["input", "url"]);
            const title = getStringField(entry, ["title", "name"]) ?? `Section ${index + 1}`;

            if (!scriptName || !input) {
              return null;
            }

            try {
              const rawSectionData = await executeScript(scriptName, [input, "1"]);
              const items = mapHomeItems(rawSectionData).slice(0, HOME_SECTION_ITEM_LIMIT);
              if (items.length === 0) {
                return null;
              }

              return {
                id: stableId("section", `${options.source.id}:${title}:${input}`),
                title,
                items
              };
            } catch {
              return null;
            }
          })
          )
        ).filter(
          (
            section
          ): section is {
            id: string;
            title: string;
            items: SourceHomeItem[];
          } => Boolean(section)
        );

        sections.push(...menuSections);
      }

      return {
        source: {
          id: options.source.id,
          name: options.source.name,
          description: options.source.description,
          runtimeSupported: true
        },
        sections
      };
    },

    async search(query: string, page?: string): Promise<SourceSearchPayload> {
      const rawSearchData = await executeNamedScript("search", [query, page ?? "1"]);
      const items = mapHomeItems(rawSearchData);
      const currentPage = page ?? null;
      const nextPage =
        options.source.supportsPagination && items.length >= SEARCH_PAGE_SIZE_HINT
          ? String(Number(page ?? "1") + 1)
          : null;

      return {
        source: {
          id: options.source.id,
          name: options.source.name,
          runtimeSupported: true
        },
        query,
        page: currentPage,
        nextPage,
        items
      };
    },

    async detail(detailUrl: string): Promise<SourceDetailPayload> {
      const rawDetail = await executeNamedScript("detail", [detailUrl]);
      if (!rawDetail || typeof rawDetail !== "object") {
        throw new Error("Detail script returned invalid data");
      }

      const record = rawDetail as Record<string, unknown>;
      const sourceUrl = normalizeUrl(detailUrl, getStringField(record, ["host"]) || sourceBaseUrl);
      const title = getStringField(record, ["title", "name"]) ?? sourceUrl;
      const coverUrl = getStringField(record, ["coverUrl", "cover", "image"]);
      const description = getStringField(record, ["description"]) ?? getStringField(record, ["detail"]);

      return {
        id: stableId("novel", `${options.source.id}:${sourceUrl}`),
        sourceId: options.source.id,
        title,
        author: getStringField(record, ["author"]),
        coverUrl: coverUrl ? normalizeUrl(coverUrl, getStringField(record, ["host"]) || sourceBaseUrl) : undefined,
        description,
        status: normalizeStatus(record.status ?? record.ongoing ?? record.detail),
        genres: extractGenreTitles(record.genres),
        sourceUrl
      };
    },

    async chapters(detailUrl: string): Promise<SourceChapterPayload[]> {
      const pageInputs: string[] = [];

      if (scriptMap.page) {
        try {
          const rawPageData = await executeNamedScript("page", [detailUrl]);
          if (Array.isArray(rawPageData)) {
            for (const entry of rawPageData) {
              if (typeof entry === "string" && entry.trim()) {
                pageInputs.push(normalizeUrl(entry, sourceBaseUrl));
                continue;
              }

              if (entry && typeof entry === "object") {
                const url = normalizeChapterUrl(entry as Record<string, unknown>, sourceBaseUrl);
                if (url) {
                  pageInputs.push(url);
                }
              }
            }
          }
        } catch {
          pageInputs.length = 0;
        }
      }

      if (pageInputs.length === 0) {
        pageInputs.push(detailUrl);
      }

      const dedupe = new Map<string, SourceChapterPayload>();

      for (const input of pageInputs) {
        const rawTocData = await executeNamedScript("toc", [input]);
        if (!Array.isArray(rawTocData)) {
          continue;
        }

        for (const item of rawTocData) {
          if (!item || typeof item !== "object") {
            continue;
          }

          const record = item as Record<string, unknown>;
          const title = getStringField(record, ["title", "name"]);
          const sourceUrl = normalizeChapterUrl(record, sourceBaseUrl);
          if (!title || !sourceUrl) {
            continue;
          }

          if (!dedupe.has(sourceUrl)) {
            dedupe.set(sourceUrl, {
              chapterIndex: dedupe.size + 1,
              title,
              sourceUrl
            });
          }
        }
      }

      return Array.from(dedupe.values()).map((chapter, index) => ({
        ...chapter,
        chapterIndex: index + 1
      }));
    },

    async chapterContent(chapterUrl: string): Promise<SourceChapterContentPayload> {
      const rawChapterData = await executeNamedScript("chap", [chapterUrl]);

      if (typeof rawChapterData === "string") {
        return {
          title: path.basename(new URL(chapterUrl).pathname) || "Chapter",
          html: rawChapterData
        };
      }

      if (!rawChapterData || typeof rawChapterData !== "object") {
        throw new Error("Chapter script returned invalid data");
      }

      const record = rawChapterData as Record<string, unknown>;
      return {
        title: getStringField(record, ["title", "name"]) ?? "Chapter",
        html: getStringField(record, ["html", "content", "description"]) ?? ""
      };
    }
  };
}

export async function materializeVbookPackage(options: {
  packageDir: string;
  manifest?: VbookManifest | null;
  archive?: Buffer | null;
  manifestUrl?: string;
}) {
  await fsp.rm(options.packageDir, { recursive: true, force: true });
  await fsp.mkdir(options.packageDir, { recursive: true });

  if (options.manifest) {
    await writeJsonFileAtomic(path.join(options.packageDir, "plugin.json"), options.manifest);
  }

  if (options.archive) {
    await writeFileAtomic(path.join(options.packageDir, "plugin.zip"), options.archive);
    await extractArchiveToPackageDir(options.packageDir, options.archive);
  } else if (options.manifest && options.manifestUrl) {
    await downloadManifestScripts(options.packageDir, options.manifestUrl, options.manifest);
  }

  return inspectVbookPackage(options.packageDir);
}

export function buildVbookStateDir(rootRuntimeDir: string, sourceId: string) {
  return path.join(rootRuntimeDir, "vbook", sanitizeFileSegment(sourceId));
}
