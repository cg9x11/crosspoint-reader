#include "HttpDownloader.h"

#include <Arduino.h>
#include <Logging.h>
#include <NetworkClient.h>
#include <NetworkClientSecure.h>
#include <StreamString.h>
#include <WiFi.h>
#include <base64.h>
#include <esp_heap_caps.h>

#include <algorithm>
#include <cctype>
#include <cstring>
#include <string>
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
constexpr int HTTP_REDIRECT_LIMIT = 3;
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

struct HttpResponseHeaders {
  int statusCode = 0;
  size_t contentLength = 0;
  bool hasContentLength = false;
  bool chunked = false;
  std::string location;
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

std::string trimAscii(std::string value) {
  while (!value.empty() && std::isspace(static_cast<unsigned char>(value.front()))) {
    value.erase(value.begin());
  }
  while (!value.empty() && std::isspace(static_cast<unsigned char>(value.back()))) {
    value.pop_back();
  }
  return value;
}

std::string toLowerAscii(std::string value) {
  std::transform(value.begin(), value.end(), value.begin(),
                 [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
  return value;
}

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
  const unsigned stackWords = static_cast<unsigned>(uxTaskGetStackHighWaterMark(nullptr));
  traceLogPrintf("HTTP", "#%lu %s %s url=%s wifi=%d ip=%s rssi=%ld heap=%u min=%u largest=%u stack_words=%u%s%s\n",
                 requestId,
                 requestModeLabel(isDownload), phase, url.c_str(), static_cast<int>(wifiStatus), ipBuf, rssi,
                 ESP.getFreeHeap(), ESP.getMinFreeHeap(), largest, stackWords, detail ? " " : "", detail ? detail : "");
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

bool shouldRetryHttpCode(const int httpCode) { return httpCode < 0 || httpCode >= 500; }

ParsedUrl parseUrlForHttpClient(const std::string& sanitizedUrl) {
  ParsedUrl parsed;
  const size_t schemePos = sanitizedUrl.find("://");
  if (schemePos == std::string::npos) {
    return parsed;
  }

  const std::string scheme = sanitizedUrl.substr(0, schemePos);
  parsed.https = (scheme == "https");
  if (!parsed.https && scheme != "http") {
    return parsed;
  }

  size_t hostStart = schemePos + 3;
  size_t pathStart = sanitizedUrl.find('/', hostStart);
  if (pathStart == std::string::npos) {
    pathStart = sanitizedUrl.size();
    parsed.path = "/";
  } else {
    parsed.path = sanitizedUrl.substr(pathStart);
  }

  std::string hostPort = sanitizedUrl.substr(hostStart, pathStart - hostStart);
  if (hostPort.empty()) {
    return parsed;
  }

  const size_t colonPos = hostPort.rfind(':');
  if (colonPos != std::string::npos && colonPos + 1 < hostPort.size() && hostPort.find(']') == std::string::npos) {
    parsed.host = hostPort.substr(0, colonPos);
    const long port = strtol(hostPort.substr(colonPos + 1).c_str(), nullptr, 10);
    if (port <= 0 || port > 65535) {
      return ParsedUrl{};
    }
    parsed.port = static_cast<uint16_t>(port);
  } else {
    parsed.host = hostPort;
    parsed.port = parsed.https ? 443 : 80;
  }

  parsed.valid = !parsed.host.empty();
  return parsed;
}

ResolvedRequestTarget resolveRequestTarget(const ParsedUrl& parsed) {
  ResolvedRequestTarget target;
  if (!parsed.valid || parsed.host.empty()) {
    return target;
  }

  target.valid = true;
  target.https = parsed.https;
  target.port = parsed.port;
  target.hostHeader = parsed.host;
  target.connectHost = parsed.host;
  if ((parsed.https && parsed.port != 443) || (!parsed.https && parsed.port != 80)) {
    target.hostHeader += ":" + std::to_string(parsed.port);
  }
  target.path = parsed.path.empty() ? "/" : parsed.path;
  return target;
}

void applyRequestCooldown(const uint32_t requestId, const bool isDownload, const ResolvedRequestTarget& target,
                          const std::string& url) {
  if (!target.valid || !target.https) {
    return;
  }
  if (g_lastHttpRequestHost != target.hostHeader) {
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

void finalizeRequestTarget(const ResolvedRequestTarget& target) {
  g_lastHttpRequestHost = target.hostHeader;
  g_lastHttpRequestEndedAtMs = millis();
  delay(50);
}

bool connectClient(NetworkClient& client, const ResolvedRequestTarget& target, const std::string& sanitizedUrl,
                   const uint32_t requestId, const bool isDownload) {
  client.setTimeout(HTTP_READ_TIMEOUT_MS);
  if (!client.connect(target.connectHost.c_str(), target.port, HTTP_CONNECT_TIMEOUT_MS)) {
    setLastHttpError("connect", sanitizedUrl, -2001);
    traceRequest(requestId, isDownload, "connect_fail", sanitizedUrl, target.connectHost.c_str());
    return false;
  }
  return true;
}

bool sendHttpRequest(NetworkClient& client, const ResolvedRequestTarget& target, const std::string& sanitizedUrl,
                     const std::string& username, const std::string& password) {
  std::string request;
  request.reserve(512 + target.path.size());
  request += "GET ";
  request += target.path;
  request += " HTTP/1.1\r\nHost: ";
  request += target.hostHeader;
  request += "\r\nUser-Agent: CrossPoint-ESP32-" CROSSPOINT_VERSION;
  request += "\r\nAccept: */*\r\nConnection: close\r\n";

  if (!username.empty() && !password.empty()) {
    const std::string credentials = username + ":" + password;
    String encoded = base64::encode(credentials.c_str());
    request += "Authorization: Basic ";
    request += encoded.c_str();
    request += "\r\n";
  }

  request += "\r\n";
  const size_t written = client.write(reinterpret_cast<const uint8_t*>(request.data()), request.size());
  if (written != request.size()) {
    setLastHttpError("write_request", sanitizedUrl, -2002);
    return false;
  }
  return true;
}

bool readHttpLine(NetworkClient& client, std::string& line, const std::string& sanitizedUrl, const int errorCode,
                  const char* errorPhase) {
  line.clear();
  const uint32_t startedAt = millis();
  while (true) {
    while (client.available() > 0) {
      const int ch = client.read();
      if (ch < 0) {
        break;
      }
      if (ch == '\n') {
        if (!line.empty() && line.back() == '\r') {
          line.pop_back();
        }
        return true;
      }
      line.push_back(static_cast<char>(ch));
      if (line.size() > 4096) {
        setLastHttpError(errorPhase, sanitizedUrl, errorCode, "line_too_long");
        return false;
      }
    }

    if (!client.connected() && client.available() <= 0) {
      setLastHttpError(errorPhase, sanitizedUrl, errorCode, "closed");
      return false;
    }
    if (millis() - startedAt > HTTP_READ_TIMEOUT_MS) {
      setLastHttpError(errorPhase, sanitizedUrl, errorCode, "timeout");
      return false;
    }
    delay(1);
  }
}

bool readHttpHeaders(NetworkClient& client, HttpResponseHeaders& headers, const std::string& sanitizedUrl) {
  headers = HttpResponseHeaders{};

  std::string line;
  if (!readHttpLine(client, line, sanitizedUrl, -2003, "status_line")) {
    return false;
  }

  const size_t firstSpace = line.find(' ');
  if (firstSpace == std::string::npos) {
    setLastHttpError("status_line", sanitizedUrl, -2003, line.c_str());
    return false;
  }
  headers.statusCode = atoi(line.c_str() + firstSpace + 1);
  g_lastHttpCode = headers.statusCode;

  while (true) {
    if (!readHttpLine(client, line, sanitizedUrl, -2004, "headers")) {
      return false;
    }
    if (line.empty()) {
      return true;
    }

    const size_t colonPos = line.find(':');
    if (colonPos == std::string::npos) {
      continue;
    }
    const std::string name = toLowerAscii(trimAscii(line.substr(0, colonPos)));
    const std::string value = trimAscii(line.substr(colonPos + 1));
    if (name == "content-length") {
      headers.contentLength = static_cast<size_t>(strtoull(value.c_str(), nullptr, 10));
      headers.hasContentLength = true;
    } else if (name == "transfer-encoding") {
      headers.chunked = toLowerAscii(value).find("chunked") != std::string::npos;
    } else if (name == "location") {
      headers.location = value;
    }
  }
}

std::string buildAbsoluteRedirectUrl(const ParsedUrl& base, const std::string& location) {
  if (location.empty()) {
    return std::string();
  }
  if (location.find("://") != std::string::npos) {
    return location;
  }
  if (location[0] == '/') {
    std::string url = base.https ? "https://" : "http://";
    url += base.host;
    if ((base.https && base.port != 443) || (!base.https && base.port != 80)) {
      url += ":" + std::to_string(base.port);
    }
    url += location;
    return url;
  }

  std::string basePath = base.path.empty() ? "/" : base.path;
  const size_t slashPos = basePath.rfind('/');
  if (slashPos == std::string::npos) {
    basePath = "/";
  } else {
    basePath.erase(slashPos + 1);
  }
  std::string url = base.https ? "https://" : "http://";
  url += base.host;
  if ((base.https && base.port != 443) || (!base.https && base.port != 80)) {
    url += ":" + std::to_string(base.port);
  }
  url += basePath;
  url += location;
  return url;
}

template <typename Writer>
bool streamFixedBody(NetworkClient& client, const size_t contentLength, const std::string& sanitizedUrl,
                     Writer&& writer) {
  uint8_t buffer[HTTP_DOWNLOAD_CHUNK_SIZE];
  size_t remaining = contentLength;
  uint32_t lastDataAt = millis();

  while (remaining > 0) {
    int available = client.available();
    if (available <= 0) {
      if (!client.connected()) {
        setLastHttpError("body_read", sanitizedUrl, -2005, "closed");
        return false;
      }
      if (millis() - lastDataAt > HTTP_READ_TIMEOUT_MS) {
        setLastHttpError("body_read", sanitizedUrl, -2005, "timeout");
        return false;
      }
      delay(1);
      continue;
    }

    size_t toRead = static_cast<size_t>(available);
    if (toRead > sizeof(buffer)) {
      toRead = sizeof(buffer);
    }
    if (toRead > remaining) {
      toRead = remaining;
    }

    const size_t readCount = client.readBytes(buffer, toRead);
    if (readCount == 0) {
      if (millis() - lastDataAt > HTTP_READ_TIMEOUT_MS) {
        setLastHttpError("body_read", sanitizedUrl, -2005, "zero");
        return false;
      }
      delay(1);
      continue;
    }

    lastDataAt = millis();
    if (!writer(buffer, readCount)) {
      return false;
    }
    remaining -= readCount;
  }

  return true;
}

template <typename Writer>
bool streamUntilClose(NetworkClient& client, const std::string& sanitizedUrl, Writer&& writer) {
  uint8_t buffer[HTTP_DOWNLOAD_CHUNK_SIZE];
  uint32_t lastDataAt = millis();

  while (client.connected() || client.available() > 0) {
    int available = client.available();
    if (available <= 0) {
      if (millis() - lastDataAt > HTTP_READ_TIMEOUT_MS) {
        setLastHttpError("body_read", sanitizedUrl, -2006, "timeout");
        return false;
      }
      delay(1);
      continue;
    }

    size_t toRead = static_cast<size_t>(available);
    if (toRead > sizeof(buffer)) {
      toRead = sizeof(buffer);
    }
    const size_t readCount = client.readBytes(buffer, toRead);
    if (readCount == 0) {
      if (millis() - lastDataAt > HTTP_READ_TIMEOUT_MS) {
        setLastHttpError("body_read", sanitizedUrl, -2006, "zero");
        return false;
      }
      delay(1);
      continue;
    }

    lastDataAt = millis();
    if (!writer(buffer, readCount)) {
      return false;
    }
  }

  return true;
}

template <typename Writer>
bool streamChunkedBody(NetworkClient& client, const std::string& sanitizedUrl, Writer&& writer) {
  std::string line;
  while (true) {
    if (!readHttpLine(client, line, sanitizedUrl, -2007, "chunk_len")) {
      return false;
    }

    const size_t semiPos = line.find(';');
    const std::string sizeToken = semiPos == std::string::npos ? line : line.substr(0, semiPos);
    const size_t chunkSize = static_cast<size_t>(strtoull(trimAscii(sizeToken).c_str(), nullptr, 16));
    if (chunkSize == 0) {
      while (true) {
        if (!readHttpLine(client, line, sanitizedUrl, -2008, "chunk_trailer")) {
          return false;
        }
        if (line.empty()) {
          return true;
        }
      }
    }

    if (!streamFixedBody(client, chunkSize, sanitizedUrl, writer)) {
      return false;
    }

    if (!readHttpLine(client, line, sanitizedUrl, -2009, "chunk_crlf")) {
      return false;
    }
    if (!line.empty()) {
      setLastHttpError("chunk_crlf", sanitizedUrl, -2009, line.c_str());
      return false;
    }
  }
}

template <typename Writer>
bool streamResponseBody(NetworkClient& client, const HttpResponseHeaders& headers, const std::string& sanitizedUrl,
                        Writer&& writer) {
  if (headers.chunked) {
    return streamChunkedBody(client, sanitizedUrl, writer);
  }
  if (headers.hasContentLength) {
    return streamFixedBody(client, headers.contentLength, sanitizedUrl, writer);
  }
  return streamUntilClose(client, sanitizedUrl, writer);
}

template <typename BodyHandler>
bool executeHttpRequest(const std::string& url, const bool isDownload, const std::string& username,
                        const std::string& password, const uint32_t requestId, BodyHandler&& bodyHandler,
                        HttpResponseHeaders* headersOut = nullptr) {
  std::string currentUrl = UrlUtils::sanitizeUrl(url);
  traceRequest(requestId, isDownload, "start", currentUrl);

  for (int redirectCount = 0; redirectCount <= HTTP_REDIRECT_LIMIT; ++redirectCount) {
    const ParsedUrl parsed = parseUrlForHttpClient(currentUrl);
    const ResolvedRequestTarget target = resolveRequestTarget(parsed);
    if (!target.valid) {
      setLastHttpError("parse", currentUrl, -2010);
      traceRequest(requestId, isDownload, "parse_fail", currentUrl);
      return false;
    }

    traceRequestTarget(requestId, isDownload, target);

    for (int attempt = 1; attempt <= HTTP_RETRY_COUNT; ++attempt) {
      NetworkClient plainClient;
      NetworkClientSecure secureClient;
      NetworkClient* client = nullptr;
      if (target.https) {
        secureClient.setInsecure();
        client = &secureClient;
      } else {
        client = &plainClient;
      }

      applyRequestCooldown(requestId, isDownload, target, currentUrl);
      if (!connectClient(*client, target, currentUrl, requestId, isDownload)) {
        finalizeRequestTarget(target);
        if (attempt < HTTP_RETRY_COUNT) {
          delay(250);
          continue;
        }
        return false;
      }

      if (!sendHttpRequest(*client, target, currentUrl, username, password)) {
        client->stop();
        finalizeRequestTarget(target);
        if (attempt < HTTP_RETRY_COUNT) {
          delay(250);
          continue;
        }
        return false;
      }

      HttpResponseHeaders headers;
      if (!readHttpHeaders(*client, headers, currentUrl)) {
        client->stop();
        finalizeRequestTarget(target);
        if (attempt < HTTP_RETRY_COUNT) {
          delay(250);
          continue;
        }
        return false;
      }

      if (headersOut != nullptr) {
        *headersOut = headers;
      }

      if (headers.statusCode >= 300 && headers.statusCode < 400 && !headers.location.empty()) {
        client->stop();
        finalizeRequestTarget(target);
        currentUrl = buildAbsoluteRedirectUrl(parsed, headers.location);
        traceRequest(requestId, isDownload, "redirect", currentUrl);
        break;
      }

      if (headers.statusCode < 200 || headers.statusCode >= 300) {
        setLastHttpError("status", currentUrl, headers.statusCode);
        client->stop();
        finalizeRequestTarget(target);
        if (shouldRetryHttpCode(headers.statusCode) && attempt < HTTP_RETRY_COUNT) {
          delay(250);
          continue;
        }
        return false;
      }

      bool bodyOk = bodyHandler(*client, headers, currentUrl);
      client->stop();
      finalizeRequestTarget(target);
      if (bodyOk) {
        clearLastHttpError();
        return true;
      }
      if (attempt < HTTP_RETRY_COUNT) {
        delay(250);
        continue;
      }
      return false;
    }
  }

  setLastHttpError("redirect", url, -2011);
  return false;
}

}  // namespace

bool HttpDownloader::fetchUrl(const std::string& url, std::string& outContent, const std::string& username,
                              const std::string& password) {
  outContent.clear();
  StreamString response;
  if (!fetchUrl(url, response, username, password)) {
    return false;
  }
  outContent = response.c_str();
  return true;
}

bool HttpDownloader::fetchUrl(const std::string& url, Stream& stream, const std::string& username,
                              const std::string& password) {
  const uint32_t requestId = nextRequestId();
  bool hadData = false;
  const bool ok = executeHttpRequest(
      url, false, username, password, requestId,
      [&stream, &hadData](NetworkClient& client, const HttpResponseHeaders& headers, const std::string& currentUrl) {
        return streamResponseBody(client, headers, currentUrl,
                                  [&stream, &hadData](const uint8_t* buffer, const size_t size) {
                                    if (size == 0) {
                                      return true;
                                    }
                                    const size_t written = stream.write(buffer, size);
                                    hadData = hadData || written > 0;
                                    return written == size;
                                  });
      });

  if (ok && !hadData) {
    clearLastHttpError();
  }
  return ok;
}

HttpDownloader::DownloadError HttpDownloader::downloadToFile(const std::string& url, const std::string& destPath,
                                                             ProgressCallback progress, const std::string& username,
                                                             const std::string& password) {
  const uint32_t requestId = nextRequestId();
  const std::string sanitizedUrl = UrlUtils::sanitizeUrl(url);
  if (progress != nullptr) {
    LOG_DBG("HTTP", "Downloading: %s", escapeUrlForLog(sanitizedUrl).c_str());
    LOG_DBG("HTTP", "Destination: %s", destPath.c_str());
    char detail[96];
    snprintf(detail, sizeof(detail), "dest=%s", destPath.c_str());
    traceRequest(requestId, true, "start", sanitizedUrl, detail);
  }

  const std::string partialPath = buildPartialDownloadPath(destPath);
  Storage.remove(partialPath.c_str());

  FsFile file;
  if (!Storage.openFileForWrite("HTTP", partialPath.c_str(), file)) {
    setLastHttpError("file_open", sanitizedUrl, -2012);
    traceRequest(requestId, true, "file_open_fail", sanitizedUrl, partialPath.c_str());
    return FILE_ERROR;
  }

  size_t downloaded = 0;
  size_t flushedAt = 0;
  bool aborted = false;
  HttpResponseHeaders responseHeaders;
  const bool ok = executeHttpRequest(
      sanitizedUrl, true, username, password, requestId,
      [&file, &progress, &downloaded, &flushedAt, &aborted, requestId](NetworkClient& client, const HttpResponseHeaders& headers,
                                                             const std::string& currentUrl) {
        char detail[128];
        snprintf(detail, sizeof(detail), "status=%d len=%zu chunked=%d", headers.statusCode,
                 headers.hasContentLength ? headers.contentLength : 0, headers.chunked ? 1 : 0);
        traceRequest(requestId, true, "headers", currentUrl, detail);

        return streamResponseBody(client, headers, currentUrl,
                                  [&file, &progress, &downloaded, &flushedAt, &aborted, &headers](const uint8_t* buffer,
                                                                                                   const size_t size) {
                                    const size_t written = file.write(buffer, size);
                                    if (written != size) {
                                      return false;
                                    }
                                    downloaded += written;
                                    if (downloaded - flushedAt >= HTTP_DOWNLOAD_FLUSH_INTERVAL) {
                                      file.flush();
                                      flushedAt = downloaded;
                                    }
                                    if (progress != nullptr && headers.hasContentLength) {
                                      if (!progress(downloaded, headers.contentLength)) {
                                        aborted = true;
                                        setLastHttpError("aborted", std::string(), -2013);
                                        return false;
                                      }
                                    }
                                    return true;
                                  });
      },
      &responseHeaders);

  file.flush();
  file.close();

  if (aborted) {
    Storage.remove(partialPath.c_str());
    return ABORTED;
  }

  if (!ok) {
    Storage.remove(partialPath.c_str());
    return shouldRetryHttpCode(g_lastHttpCode) ? HTTP_ERROR : HTTP_ERROR;
  }

  if (responseHeaders.hasContentLength && downloaded != responseHeaders.contentLength) {
    setLastHttpError("size", sanitizedUrl, -1002);
    Storage.remove(partialPath.c_str());
    return HTTP_ERROR;
  }

  if (downloaded == 0) {
    setLastHttpError("empty", sanitizedUrl, -1001);
    Storage.remove(partialPath.c_str());
    return HTTP_ERROR;
  }

  Storage.remove(destPath.c_str());
  if (!Storage.rename(partialPath.c_str(), destPath.c_str())) {
    setLastHttpError("rename", sanitizedUrl, -1007);
    Storage.remove(partialPath.c_str());
    return FILE_ERROR;
  }

  if (progress != nullptr) {
    LOG_DBG("HTTP", "Downloaded %zu bytes", downloaded);
    traceRequest(requestId, true, "success", sanitizedUrl);
  }
  clearLastHttpError();
  return OK;
}

int HttpDownloader::getLastHttpCode() { return g_lastHttpCode; }

std::string HttpDownloader::getLastErrorMessage() { return g_lastErrorMessage; }


