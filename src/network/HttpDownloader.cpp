#include "HttpDownloader.h"

#include <Arduino.h>
#include <HTTPClient.h>
#include <Logging.h>
#include <NetworkClient.h>
#include <NetworkClientSecure.h>
#include <StreamString.h>
#include <WiFi.h>
#include <base64.h>
#include <esp_heap_caps.h>

#include <cstring>
#include <memory>
#include <utility>

#include "util/UrlUtils.h"

namespace {
int g_lastHttpCode = 0;
std::string g_lastErrorMessage;
uint32_t g_httpRequestSequence = 0;
uint32_t g_lastHttpRequestEndedAtMs = 0;
std::string g_lastHttpRequestHost;
constexpr int HTTP_CONNECT_TIMEOUT_MS = 12000;
constexpr int HTTP_READ_TIMEOUT_MS = 20000;
constexpr int HTTP_RETRY_COUNT = 3;
constexpr uint32_t HTTPS_SAME_HOST_COOLDOWN_MS = 250;
constexpr size_t HTTP_DOWNLOAD_CHUNK_SIZE = 512;
constexpr size_t HTTP_DOWNLOAD_FLUSH_INTERVAL = 16384;

struct ParsedUrl {
  bool valid = false;
  bool https = false;
  uint16_t port = 0;
  std::string host;
  std::string path;
};

struct ResolvedRequestTarget {
  bool valid = false;
  bool https = false;
  uint16_t port = 0;
  std::string hostHeader;
  std::string connectHost;
  std::string path;
};

std::string escapeUrlForLog(const std::string& text) {
  std::string escaped;
  escaped.reserve(text.size());
  for (unsigned char ch : text) {
    if (ch >= 32 && ch <= 126) {
      escaped.push_back(static_cast<char>(ch));
      continue;
    }
    char buf[5];
    snprintf(buf, sizeof(buf), "\\x%02X", ch);
    escaped += buf;
  }
  return escaped;
}

uint32_t nextRequestId() { return ++g_httpRequestSequence; }

const char* requestModeLabel(const bool isDownload) { return isDownload ? "download" : "fetch"; }

std::string buildPartialDownloadPath(const std::string& destPath) { return destPath + ".part"; }

void traceRequest(const uint32_t requestId, const bool isDownload, const char* phase, const std::string& url,
                  const char* detail = nullptr) {
  if (!isDownload) {
    return;
  }
  const wl_status_t wifiStatus = WiFi.status();
  char ipBuf[20];
  const IPAddress ip = WiFi.localIP();
  snprintf(ipBuf, sizeof(ipBuf), "%u.%u.%u.%u", ip[0], ip[1], ip[2], ip[3]);
  const long rssi = wifiStatus == WL_CONNECTED ? WiFi.RSSI() : 0;
  const size_t largest = heap_caps_get_largest_free_block(MALLOC_CAP_8BIT);
  traceLogPrintf("HTTP", "#%lu %s %s url=%s wifi=%d ip=%s rssi=%ld heap=%u min=%u largest=%u%s%s\n", requestId,
                 requestModeLabel(isDownload), phase, url.c_str(), static_cast<int>(wifiStatus), ipBuf, rssi,
                 ESP.getFreeHeap(), ESP.getMinFreeHeap(), largest, detail ? " " : "", detail ? detail : "");
}

void traceRequestTarget(const uint32_t requestId, const bool isDownload, const ResolvedRequestTarget& target) {
  if (!isDownload) {
    return;
  }
  char detail[220];
  snprintf(detail, sizeof(detail), "host=%s connect=%s port=%u path=%s https=%d", target.hostHeader.c_str(),
           target.connectHost.c_str(), target.port, target.path.c_str(), target.https ? 1 : 0);
  traceRequest(requestId, isDownload, "target", target.hostHeader + target.path, detail);
}

void clearLastHttpError() {
  g_lastHttpCode = 0;
  g_lastErrorMessage.clear();
}

void setLastHttpError(const std::string& phase, const std::string& url, const int httpCode,
                      const String& detail = String()) {
  g_lastHttpCode = httpCode;
  g_lastErrorMessage = phase + " " + url + " code=" + std::to_string(httpCode);
  if (detail.length() > 0) {
    g_lastErrorMessage += " ";
    g_lastErrorMessage += detail.c_str();
  }
}

void configureHttpClient(HTTPClient& http, const std::string& username, const std::string& password) {
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.setConnectTimeout(HTTP_CONNECT_TIMEOUT_MS);
  http.setTimeout(HTTP_READ_TIMEOUT_MS);
  http.useHTTP10(true);
  http.setReuse(false);
  http.addHeader("User-Agent", "CrossPoint-ESP32-" CROSSPOINT_VERSION);

  if (!username.empty() && !password.empty()) {
    std::string credentials = username + ":" + password;
    String encoded = base64::encode(credentials.c_str());
    http.addHeader("Authorization", "Basic " + encoded);
  }
}

bool shouldRetryHttpCode(const int httpCode) { return httpCode < 0; }

ParsedUrl parseUrlForHttpClient(const std::string& sanitizedUrl) {
  ParsedUrl parsed;
  const size_t schemePos = sanitizedUrl.find("://");
  if (schemePos == std::string::npos) {
    return parsed;
  }

  const std::string scheme = sanitizedUrl.substr(0, schemePos);
  parsed.https = (scheme == "https");
  size_t hostStart = schemePos + 3;
  size_t pathStart = sanitizedUrl.find('/', hostStart);
  if (pathStart == std::string::npos) {
    pathStart = sanitizedUrl.size();
    parsed.path = "/";
  } else {
    parsed.path = sanitizedUrl.substr(pathStart);
  }

  std::string hostPort = sanitizedUrl.substr(hostStart, pathStart - hostStart);
  const size_t colonPos = hostPort.rfind(':');
  if (colonPos != std::string::npos && colonPos + 1 < hostPort.size()) {
    parsed.host = hostPort.substr(0, colonPos);
    parsed.port = static_cast<uint16_t>(atoi(hostPort.substr(colonPos + 1).c_str()));
  } else {
    parsed.host = hostPort;
    parsed.port = parsed.https ? 443 : 80;
  }

  if (parsed.host.empty() || parsed.port == 0) {
    parsed.host.clear();
    parsed.path.clear();
    parsed.port = 0;
    return parsed;
  }

  parsed.valid = true;
  return parsed;
}

ResolvedRequestTarget resolveRequestTarget(const std::string& sanitizedUrl) {
  ResolvedRequestTarget target;
  const ParsedUrl parsed = parseUrlForHttpClient(sanitizedUrl);
  if (!parsed.valid) {
    return target;
  }

  target.https = parsed.https;
  target.port = parsed.port;
  target.hostHeader = parsed.host;
  target.connectHost = parsed.host;
  target.path = parsed.path;

  IPAddress resolvedIp;
  if (WiFi.hostByName(parsed.host.c_str(), resolvedIp) == 1 && resolvedIp != IPAddress(0, 0, 0, 0)) {
    const std::string resolvedIpText = resolvedIp.toString().c_str();
    LOG_DBG("HTTP", "Resolved %s -> %s", parsed.host.c_str(), resolvedIpText.c_str());
    // For HTTPS endpoints behind Cloudflare/reverse proxies we must keep the hostname
    // as the actual connect target so TLS SNI and host-based routing continue to work.
    if (!parsed.https) {
      target.connectHost = resolvedIpText;
    }
  } else {
    LOG_DBG("HTTP", "DNS resolve failed for %s, using host directly", parsed.host.c_str());
  }

  target.valid = true;
  return target;
}

bool beginHttpRequest(HTTPClient& http, NetworkClient& client, const ResolvedRequestTarget& target) {
  if (!target.valid) {
    return false;
  }

  LOG_DBG("HTTP", "Connect target: %s:%u%s", target.connectHost.c_str(), target.port, target.path.c_str());
  const bool began = http.begin(client, target.connectHost.c_str(), target.port, target.path.c_str(), target.https);
  if (began && target.connectHost != target.hostHeader) {
    http.addHeader("Host", target.hostHeader.c_str(), true, true);
  }
  return began;
}

void applyRequestCooldown(const uint32_t requestId, const bool isDownload, const ResolvedRequestTarget& target,
                          const std::string& url) {
  if (!target.https || g_lastHttpRequestEndedAtMs == 0 || g_lastHttpRequestHost != target.hostHeader) {
    return;
  }

  const uint32_t now = millis();
  const uint32_t elapsed = now - g_lastHttpRequestEndedAtMs;
  if (elapsed >= HTTPS_SAME_HOST_COOLDOWN_MS) {
    return;
  }

  const uint32_t waitMs = HTTPS_SAME_HOST_COOLDOWN_MS - elapsed;
  char detail[96];
  snprintf(detail, sizeof(detail), "host=%s wait_ms=%lu", target.hostHeader.c_str(), static_cast<unsigned long>(waitMs));
  traceRequest(requestId, isDownload, "cooldown", url, detail);
  delay(waitMs);
}

void finalizeRequestClient(HTTPClient& http, std::unique_ptr<NetworkClient>& client, const ResolvedRequestTarget& target) {
  http.end();
  if (client) {
    client->stop();
    client.reset();
  }
  g_lastHttpRequestHost = target.hostHeader;
  g_lastHttpRequestEndedAtMs = millis();
  delay(50);
}

class FileWriteStream final : public Stream {
 public:
  FileWriteStream(FsFile& file, size_t total, HttpDownloader::ProgressCallback progress)
      : file_(file), total_(total), progress_(std::move(progress)) {}

  size_t write(uint8_t byte) override { return write(&byte, 1); }

  size_t write(const uint8_t* buffer, size_t size) override {
    if (aborted_) {
      return 0;
    }
    // Write-through stream for HTTPClient::writeToStream with progress tracking.
    const size_t written = file_.write(buffer, size);
    if (written != size) {
      writeOk_ = false;
    }
    downloaded_ += written;
    if (progress_ && total_ > 0) {
      if (!progress_(downloaded_, total_)) {
        aborted_ = true;
        return 0;
      }
    }
    return written;
  }

  int available() override { return 0; }
  int read() override { return -1; }
  int peek() override { return -1; }
  void flush() override { file_.flush(); }

  size_t downloaded() const { return downloaded_; }
  bool ok() const { return writeOk_; }
  bool aborted() const { return aborted_; }

 private:
  FsFile& file_;
  size_t total_;
  size_t downloaded_ = 0;
  bool writeOk_ = true;
  bool aborted_ = false;
  HttpDownloader::ProgressCallback progress_;
};
}  // namespace

bool HttpDownloader::fetchUrl(const std::string& url, Stream& outContent, const std::string& username,
                              const std::string& password) {
  clearLastHttpError();
  const uint32_t requestId = nextRequestId();
  const std::string sanitizedUrl = UrlUtils::sanitizeUrl(url);
  if (sanitizedUrl != url) {
    LOG_DBG("HTTP", "Sanitized fetch URL: raw=%s sanitized=%s", escapeUrlForLog(url).c_str(),
            sanitizedUrl.c_str());
  }
  LOG_DBG("HTTP", "Fetching: %s", sanitizedUrl.c_str());
  traceRequest(requestId, false, "start", sanitizedUrl);
  const ResolvedRequestTarget target = resolveRequestTarget(sanitizedUrl);
  if (!target.valid) {
    setLastHttpError("parse", sanitizedUrl, -1003);
    LOG_ERR("HTTP", "Fetch URL parse failed: %s", sanitizedUrl.c_str());
    traceRequest(requestId, false, "parse_fail", sanitizedUrl);
    return false;
  }
  traceRequestTarget(requestId, false, target);

  for (int attempt = 1; attempt <= HTTP_RETRY_COUNT; ++attempt) {
    std::unique_ptr<NetworkClient> client;
    if (UrlUtils::isHttpsUrl(sanitizedUrl)) {
      auto* secureClient = new NetworkClientSecure();
      secureClient->setInsecure();
      client.reset(secureClient);
    } else {
      client.reset(new NetworkClient());
    }
    HTTPClient http;
    applyRequestCooldown(requestId, false, target, sanitizedUrl);

    if (!beginHttpRequest(http, *client, target)) {
      setLastHttpError("begin", sanitizedUrl, -1000);
      LOG_ERR("HTTP", "Fetch begin failed (attempt %d/%d): %s", attempt, HTTP_RETRY_COUNT,
              escapeUrlForLog(sanitizedUrl).c_str());
      char detail[48];
      snprintf(detail, sizeof(detail), "attempt=%d/%d", attempt, HTTP_RETRY_COUNT);
      traceRequest(requestId, false, "begin_fail", sanitizedUrl, detail);
      if (attempt < HTTP_RETRY_COUNT) {
        delay(250);
        continue;
      }
      return false;
    }

    configureHttpClient(http, username, password);
    {
      char detail[48];
      snprintf(detail, sizeof(detail), "attempt=%d/%d", attempt, HTTP_RETRY_COUNT);
      traceRequest(requestId, false, "get_begin", sanitizedUrl, detail);
    }

    const int httpCode = http.GET();
    if (httpCode == HTTP_CODE_OK) {
      http.writeToStream(&outContent);
      finalizeRequestClient(http, client, target);
      clearLastHttpError();
      LOG_DBG("HTTP", "Fetch success");
      traceRequest(requestId, false, "success", sanitizedUrl);
      return true;
    }

    setLastHttpError("GET", sanitizedUrl, httpCode);
    LOG_ERR("HTTP", "Fetch failed (attempt %d/%d): %d url=%s", attempt, HTTP_RETRY_COUNT, httpCode,
            sanitizedUrl.c_str());
    {
      char traceDetail[64];
      snprintf(traceDetail, sizeof(traceDetail), "attempt=%d/%d code=%d", attempt, HTTP_RETRY_COUNT, httpCode);
      traceRequest(requestId, false, "get_fail", sanitizedUrl, traceDetail);
    }
    finalizeRequestClient(http, client, target);

    if (!shouldRetryHttpCode(httpCode) || attempt >= HTTP_RETRY_COUNT) {
      return false;
    }
    delay(250);
  }
  return false;
}

bool HttpDownloader::fetchUrl(const std::string& url, std::string& outContent, const std::string& username,
                              const std::string& password) {
  StreamString stream;
  if (!fetchUrl(url, stream, username, password)) {
    return false;
  }
  outContent = stream.c_str();
  return true;
}

HttpDownloader::DownloadError HttpDownloader::downloadToFile(const std::string& url, const std::string& destPath,
                                                             ProgressCallback progress, const std::string& username,
                                                             const std::string& password) {
  clearLastHttpError();
  const uint32_t requestId = nextRequestId();
  const std::string sanitizedUrl = UrlUtils::sanitizeUrl(url);
  if (sanitizedUrl != url) {
    LOG_DBG("HTTP", "Sanitized download URL: raw=%s sanitized=%s", escapeUrlForLog(url).c_str(),
            sanitizedUrl.c_str());
  }
  LOG_DBG("HTTP", "Downloading: %s", sanitizedUrl.c_str());
  if (progress != nullptr) {
    LOG_DBG("HTTP", "Destination: %s", destPath.c_str());
  }
  {
    char detail[180];
    snprintf(detail, sizeof(detail), "dest=%s", destPath.c_str());
    traceRequest(requestId, true, "start", sanitizedUrl, detail);
  }
  const ResolvedRequestTarget target = resolveRequestTarget(sanitizedUrl);
  if (!target.valid) {
    setLastHttpError("parse", sanitizedUrl, -1003);
    LOG_ERR("HTTP", "Download URL parse failed: %s", sanitizedUrl.c_str());
    traceRequest(requestId, true, "parse_fail", sanitizedUrl);
    return HTTP_ERROR;
  }
  traceRequestTarget(requestId, true, target);

  for (int attempt = 1; attempt <= HTTP_RETRY_COUNT; ++attempt) {
    std::unique_ptr<NetworkClient> client;
    if (UrlUtils::isHttpsUrl(sanitizedUrl)) {
      auto* secureClient = new NetworkClientSecure();
      secureClient->setInsecure();
      client.reset(secureClient);
    } else {
      client.reset(new NetworkClient());
    }
    HTTPClient http;
    applyRequestCooldown(requestId, true, target, sanitizedUrl);

    if (!beginHttpRequest(http, *client, target)) {
      setLastHttpError("begin", sanitizedUrl, -1000);
      LOG_ERR("HTTP", "Download begin failed (attempt %d/%d): %s", attempt, HTTP_RETRY_COUNT,
              escapeUrlForLog(sanitizedUrl).c_str());
      char detail[48];
      snprintf(detail, sizeof(detail), "attempt=%d/%d", attempt, HTTP_RETRY_COUNT);
      traceRequest(requestId, true, "begin_fail", sanitizedUrl, detail);
      if (attempt < HTTP_RETRY_COUNT) {
        delay(250);
        continue;
      }
      return HTTP_ERROR;
    }

    configureHttpClient(http, username, password);
    {
      char detail[48];
      snprintf(detail, sizeof(detail), "attempt=%d/%d", attempt, HTTP_RETRY_COUNT);
      traceRequest(requestId, true, "get_begin", sanitizedUrl, detail);
    }

    const int httpCode = http.GET();
    if (httpCode != HTTP_CODE_OK) {
      setLastHttpError("GET", sanitizedUrl, httpCode);
      LOG_ERR("HTTP", "Download failed (attempt %d/%d): %d url=%s", attempt, HTTP_RETRY_COUNT, httpCode,
              sanitizedUrl.c_str());
      {
        char traceDetail[64];
        snprintf(traceDetail, sizeof(traceDetail), "attempt=%d/%d code=%d", attempt, HTTP_RETRY_COUNT, httpCode);
        traceRequest(requestId, true, "get_fail", sanitizedUrl, traceDetail);
      }
      finalizeRequestClient(http, client, target);
      if (!shouldRetryHttpCode(httpCode) || attempt >= HTTP_RETRY_COUNT) {
        return HTTP_ERROR;
      }
      delay(250);
      continue;
    }

    const int64_t reportedLength = http.getSize();
    const size_t contentLength = reportedLength > 0 ? static_cast<size_t>(reportedLength) : 0;
    if (progress != nullptr) {
      if (contentLength > 0) {
        LOG_DBG("HTTP", "Content-Length: %zu", contentLength);
      } else {
        LOG_DBG("HTTP", "Content-Length: unknown");
      }
      char detail[64];
      snprintf(detail, sizeof(detail), "content_length=%zu", contentLength);
      traceRequest(requestId, true, "headers", sanitizedUrl, detail);
    }

    FsFile file;
    if (!Storage.openFileForWrite("HTTP", destPath.c_str(), file)) {
      LOG_ERR("HTTP", "Failed to open file for writing");
      finalizeRequestClient(http, client, target);
      traceRequest(requestId, true, "file_open_fail", sanitizedUrl, destPath.c_str());
      return FILE_ERROR;
    }

    uint8_t buffer[HTTP_DOWNLOAD_CHUNK_SIZE];
    WiFiClient* stream = http.getStreamPtr();
    size_t downloaded = 0;
    size_t flushedAt = 0;
    bool aborted = false;
    bool writeOk = true;
    bool readOk = true;
    unsigned long lastDataAt = millis();

    while (true) {
      if (contentLength > 0 && downloaded >= contentLength) {
        break;
      }

      int available = stream != nullptr ? stream->available() : 0;
      if (available <= 0) {
        if ((stream == nullptr || !stream->connected()) && !http.connected()) {
          break;
        }
        if (millis() - lastDataAt > HTTP_READ_TIMEOUT_MS) {
          readOk = false;
          setLastHttpError("read_timeout", sanitizedUrl, -1004);
          LOG_ERR("HTTP", "Read timeout (attempt %d/%d): downloaded=%zu expected=%zu", attempt,
                  HTTP_RETRY_COUNT, downloaded, contentLength);
          traceRequest(requestId, true, "read_timeout", sanitizedUrl);
          break;
        }
        delay(1);
        continue;
      }

      size_t toRead = static_cast<size_t>(available);
      if (toRead > HTTP_DOWNLOAD_CHUNK_SIZE) {
        toRead = HTTP_DOWNLOAD_CHUNK_SIZE;
      }
      if (contentLength > 0) {
        const size_t remaining = contentLength - downloaded;
        if (toRead > remaining) {
          toRead = remaining;
        }
      }
      if (toRead == 0) {
        break;
      }

      const size_t readCount = stream->readBytes(buffer, toRead);
      if (readCount == 0) {
        if (millis() - lastDataAt > HTTP_READ_TIMEOUT_MS) {
          readOk = false;
          setLastHttpError("read_zero", sanitizedUrl, -1005);
          LOG_ERR("HTTP", "Read stalled (attempt %d/%d): downloaded=%zu expected=%zu", attempt,
                  HTTP_RETRY_COUNT, downloaded, contentLength);
          traceRequest(requestId, true, "read_zero", sanitizedUrl);
          break;
        }
        delay(1);
        continue;
      }

      lastDataAt = millis();
      const size_t written = file.write(buffer, readCount);
      if (written != readCount) {
        writeOk = false;
        LOG_ERR("HTTP", "Chunk write failed: wrote=%zu expected=%zu", written, readCount);
        traceRequest(requestId, true, "chunk_write_fail", sanitizedUrl, destPath.c_str());
        break;
      }

      downloaded += written;
      if (downloaded - flushedAt >= HTTP_DOWNLOAD_FLUSH_INTERVAL) {
        file.flush();
        flushedAt = downloaded;
      }

      if (progress != nullptr && contentLength > 0) {
        if (!progress(downloaded, contentLength)) {
          aborted = true;
          break;
        }
      }
    }

    file.flush();
    file.close();
    finalizeRequestClient(http, client, target);

    if (aborted) {
      Storage.remove(destPath.c_str());
      return ABORTED;
    }

    if (progress != nullptr) {
      LOG_DBG("HTTP", "Downloaded %zu bytes", downloaded);
      char detail[96];
      snprintf(detail, sizeof(detail), "attempt=%d/%d downloaded=%zu", attempt, HTTP_RETRY_COUNT, downloaded);
      traceRequest(requestId, true, "write_done", sanitizedUrl, detail);
    }

    if (!writeOk) {
      LOG_ERR("HTTP", "Write failed during download");
      traceRequest(requestId, true, "file_write_fail", sanitizedUrl, destPath.c_str());
      Storage.remove(destPath.c_str());
      return FILE_ERROR;
    }

    if (!readOk) {
      Storage.remove(destPath.c_str());
      if (attempt < HTTP_RETRY_COUNT) {
        delay(250);
        continue;
      }
      return HTTP_ERROR;
    }

    if (contentLength == 0 && downloaded == 0) {
      setLastHttpError("empty", sanitizedUrl, -1001);
      LOG_ERR("HTTP", "Download failed: no data received");
      traceRequest(requestId, true, "empty_fail", sanitizedUrl);
      Storage.remove(destPath.c_str());
      if (attempt < HTTP_RETRY_COUNT) {
        delay(250);
        continue;
      }
      return HTTP_ERROR;
    }

    if (contentLength > 0 && downloaded != contentLength) {
      setLastHttpError("size", sanitizedUrl, -1002);
      LOG_ERR("HTTP", "Size mismatch: got %zu, expected %zu", downloaded, contentLength);
      char detail[96];
      snprintf(detail, sizeof(detail), "downloaded=%zu expected=%zu", downloaded, contentLength);
      traceRequest(requestId, true, "size_fail", sanitizedUrl, detail);
      Storage.remove(destPath.c_str());
      if (attempt < HTTP_RETRY_COUNT) {
        delay(250);
        continue;
      }
      return HTTP_ERROR;
    }
    clearLastHttpError();
    if (progress != nullptr) {
      traceRequest(requestId, true, "success", sanitizedUrl);
    }
    return OK;
  }
  return HTTP_ERROR;
}

int HttpDownloader::getLastHttpCode() { return g_lastHttpCode; }

std::string HttpDownloader::getLastErrorMessage() { return g_lastErrorMessage; }
