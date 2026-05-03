const DEFAULT_HEADERS = {
  "user-agent": "Mozilla/5.0 (CrossPoint Server) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
  "cache-control": "no-cache",
  pragma: "no-cache"
};

const RETRY_DELAYS_MS = [300, 900];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(message) {
  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timed out") ||
    message.includes("econnreset") ||
    message.includes("enotfound") ||
    message.includes("eai_again") ||
    message.includes("http 429") ||
    message.includes("http 500") ||
    message.includes("http 502") ||
    message.includes("http 503") ||
    message.includes("http 504")
  );
}

export async function fetchText(url) {
  let lastError = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: DEFAULT_HEADERS,
        redirect: "follow",
        signal: AbortSignal.timeout(15000)
      });

      const body = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      if (!body) {
        throw new Error("Empty upstream response");
      }
      return body;
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error).toLowerCase();
      if (attempt >= RETRY_DELAYS_MS.length || !shouldRetry(message)) {
        throw error;
      }
      await delay(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError || new Error("Fetch failed");
}

export async function fetchBinary(url) {
  let lastError = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: DEFAULT_HEADERS,
        redirect: "follow",
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const body = Buffer.from(await response.arrayBuffer());
      if (!body.length) {
        throw new Error("Empty upstream response");
      }

      return {
        body,
        contentType: response.headers.get("content-type") || "application/octet-stream"
      };
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error).toLowerCase();
      if (attempt >= RETRY_DELAYS_MS.length || !shouldRetry(message)) {
        throw error;
      }
      await delay(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError || new Error("Fetch failed");
}
