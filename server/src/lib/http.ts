const DEFAULT_TIMEOUT_MS = 15000;
const USER_AGENT = "xteinkreader-server/0.1";

function buildHeaders(init?: RequestInit["headers"]) {
  const headers = new Headers(init);
  if (!headers.has("user-agent")) {
    headers.set("user-agent", USER_AGENT);
  }
  return headers;
}

export async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      headers: buildHeaders(init?.headers),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  const raw = await response.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    const preview = raw.slice(0, 180).trim();
    throw new Error(preview ? `Invalid JSON response: ${preview}` : "Invalid JSON response");
  }
}

export async function fetchText(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export async function fetchBuffer(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
