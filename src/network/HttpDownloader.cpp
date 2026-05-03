#include "HttpDownloader.h"

#include <HTTPClient.h>
#include <Logging.h>
#include <NetworkClient.h>
#include <NetworkClientSecure.h>
#include <WiFi.h>
#include <base64.h>
#include <esp_heap_caps.h>

#include <cstring>
#include <memory>
#include <new>
#include <utility>

#include "network/OnlineDebugLog.h"
#include "util/UrlUtils.h"

namespace {
std::string g_lastError;
bool g_lastResponseTruncated = false;
constexpr uint16_t HTTP_CONNECT_TIMEOUT_MS = 8000;
constexpr uint16_t HTTP_READ_TIMEOUT_MS = 35000;
constexpr uint32_t HTTP_READ_BUFFER_SIZE = 512;
constexpr uint32_t HTTP_MIN_HEADROOM_BYTES = 12288;
constexpr uint32_t HTTP_DEFAULT_INITIAL_RESERVE = 12288;
constexpr size_t HTTP_FAILURE_BODY_SNIPPET_BYTES = 2048;

void setLastError(std::string message) { g_lastError = std::move(message); }

std::string heapSummary() {
  return "heap=" + std::to_string(ESP.getFreeHeap()) +
         ", largest=" + std::to_string(heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
}

std::string describeHttpFailure(int httpCode) {
  if (httpCode == HTTPC_ERROR_READ_TIMEOUT) {
    return "Request timed out (HTTP -11)";
  }
  if (httpCode == HTTPC_ERROR_CONNECTION_REFUSED) {
    return "Connection refused (HTTP -1)";
  }
  if (httpCode < 0) {
    return "Network error (HTTP " + std::to_string(httpCode) + ")";
  }
  return "HTTP " + std::to_string(httpCode);
}

bool isWifiReady() { return WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0); }

class ScopedWifiPerformanceMode final {
 public:
  ScopedWifiPerformanceMode() {
    if (isWifiReady()) {
      WiFi.setSleep(false);
      active_ = true;
    }
  }

  ~ScopedWifiPerformanceMode() {
    if (active_) {
      WiFi.setSleep(true);
    }
  }

 private:
  bool active_ = false;
};

void addDefaultRequestHeaders(HTTPClient& http) {
  http.addHeader("User-Agent", "Mozilla/5.0 (CrossPoint; ESP32) AppleWebKit/537.36 (KHTML, like Gecko) CrossPoint/" CROSSPOINT_VERSION);
  http.addHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
  http.addHeader("Accept-Language", "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7");
  http.addHeader("Cache-Control", "no-cache");
  http.addHeader("Connection", "close");
  http.addHeader("Pragma", "no-cache");
}

void configureHttpRequest(HTTPClient& http) {
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.setConnectTimeout(HTTP_CONNECT_TIMEOUT_MS);
  http.setTimeout(HTTP_READ_TIMEOUT_MS);
  http.useHTTP10(true);
  http.setAcceptEncoding("identity");
  addDefaultRequestHeaders(http);
}

size_t computeSafeBodyBudget(size_t requestedMaxBytes = 0) {
  const size_t freeHeap = ESP.getFreeHeap();
  const size_t largest = heap_caps_get_largest_free_block(MALLOC_CAP_8BIT);
  size_t budget = 0;
  if (largest > HTTP_MIN_HEADROOM_BYTES) {
    budget = largest - HTTP_MIN_HEADROOM_BYTES;
  } else if (freeHeap > HTTP_MIN_HEADROOM_BYTES) {
    budget = freeHeap - HTTP_MIN_HEADROOM_BYTES;
  }
  if (requestedMaxBytes > 0 && (budget == 0 || requestedMaxBytes < budget)) {
    budget = requestedMaxBytes;
  }
  return budget;
}

bool appendBounded(std::string& outContent, const char* data, size_t size, size_t maxBytes, bool allowTruncate,
                   bool& truncated, bool& overflowed);

class BoundedStringWriteStream final : public Stream {
 public:
  BoundedStringWriteStream(std::string& outContent, size_t maxBytes, bool allowTruncate)
      : outContent_(outContent), maxBytes_(maxBytes), allowTruncate_(allowTruncate) {}

  size_t write(uint8_t byte) override { return write(&byte, 1); }

  size_t write(const uint8_t* buffer, size_t size) override {
    if (maxBytes_ == 0) {
      outContent_.append(reinterpret_cast<const char*>(buffer), size);
      return size;
    }

    const size_t room = maxBytes_ > outContent_.size() ? maxBytes_ - outContent_.size() : 0;
    if (room == 0) {
      if (allowTruncate_) {
        truncated_ = true;
        return size;
      }
      overflowed_ = true;
      return 0;
    }

    const size_t toCopy = std::min(room, size);
    outContent_.append(reinterpret_cast<const char*>(buffer), toCopy);
    if (toCopy < size) {
      if (allowTruncate_) {
        truncated_ = true;
        return size;
      }
      overflowed_ = true;
      return toCopy;
    }

    return size;
  }

  int available() override { return 0; }
  int read() override { return -1; }
  int peek() override { return -1; }
  void flush() override {}

  bool overflowed() const { return overflowed_; }
  bool truncated() const { return truncated_; }

 private:
  std::string& outContent_;
  size_t maxBytes_ = 0;
  bool allowTruncate_ = false;
  bool overflowed_ = false;
  bool truncated_ = false;
};

bool readHttpBody(HTTPClient& http, std::string& outContent, size_t maxBytes = 0, bool allowTruncate = false) {
  outContent.clear();

  const int64_t reportedLength = http.getSize();
  const size_t safeBudget = computeSafeBodyBudget(maxBytes);
  if (safeBudget == 0) {
    setLastError("Insufficient heap for HTTP body");
    return false;
  }

  const size_t reserveTarget = reportedLength > 0
                                   ? std::min<size_t>(static_cast<size_t>(reportedLength), safeBudget)
                                   : (allowTruncate || maxBytes > 0 ? safeBudget
                                                                    : std::min<size_t>(HTTP_DEFAULT_INITIAL_RESERVE, safeBudget));
  if (reserveTarget > 0) {
    outContent.reserve(reserveTarget);
  }

  NetworkClient* rawStream = http.getStreamPtr();
  if (!rawStream) {
    setLastError("Missing HTTP stream");
    return false;
  }

  bool truncated = false;
  bool overflowed = false;
  size_t totalRead = 0;
  uint32_t lastDataAtMs = millis();
  uint8_t buffer[HTTP_READ_BUFFER_SIZE];

  while (http.connected() || rawStream->available() > 0) {
    const int available = rawStream->available();
    if (available <= 0) {
      if ((millis() - lastDataAtMs) > HTTP_READ_TIMEOUT_MS) {
        setLastError(describeHttpFailure(HTTPC_ERROR_READ_TIMEOUT));
        return false;
      }
      delay(1);
      continue;
    }

    const size_t toRead = std::min<size_t>(sizeof(buffer), static_cast<size_t>(available));
    const int bytesRead = rawStream->readBytes(buffer, toRead);
    if (bytesRead <= 0) {
      if ((millis() - lastDataAtMs) > HTTP_READ_TIMEOUT_MS) {
        setLastError(describeHttpFailure(HTTPC_ERROR_READ_TIMEOUT));
        return false;
      }
      delay(1);
      continue;
    }

    lastDataAtMs = millis();
    totalRead += static_cast<size_t>(bytesRead);

    if (!appendBounded(outContent, reinterpret_cast<const char*>(buffer), static_cast<size_t>(bytesRead), safeBudget,
                       allowTruncate, truncated, overflowed)) {
      break;
    }
  }

  if (overflowed) {
    setLastError("HTTP body exceeds safe heap budget");
    return false;
  }

  if (truncated) {
    g_lastResponseTruncated = true;
    setLastError("Response truncated by RAM limit");
    LOG_DBG("HTTP", "Response truncated at %u bytes (%s)", static_cast<unsigned>(outContent.size()), heapSummary().c_str());
    return true;
  }

  if (reportedLength > 0 && totalRead != static_cast<size_t>(reportedLength)) {
    setLastError("Partial HTTP body read");
    return false;
  }

  return true;
}

bool appendBounded(std::string& outContent, const char* data, size_t size, size_t maxBytes, bool allowTruncate,
                   bool& truncated, bool& overflowed) {
  if (maxBytes == 0) {
    outContent.append(data, size);
    return true;
  }

  const size_t room = maxBytes > outContent.size() ? maxBytes - outContent.size() : 0;
  if (room == 0) {
    if (allowTruncate) {
      truncated = true;
      return true;
    }
    overflowed = true;
    return false;
  }

  const size_t toCopy = std::min(room, size);
  outContent.append(data, toCopy);
  if (toCopy < size) {
    if (allowTruncate) {
      truncated = true;
      return true;
    }
    overflowed = true;
    return false;
  }

  return true;
}

class MarkerBoundedWriteStream final : public Stream {
 public:
  MarkerBoundedWriteStream(std::string& outContent, std::string marker, size_t maxBytes, bool allowTruncate)
      : outContent_(outContent), marker_(std::move(marker)), maxBytes_(maxBytes), allowTruncate_(allowTruncate) {
    tail_.reserve(std::max<size_t>(marker_.size(), 32));
  }

  size_t write(uint8_t byte) override { return write(&byte, 1); }

  size_t write(const uint8_t* buffer, size_t size) override {
    if (!buffer || size == 0) {
      return 0;
    }
    if (overflowed_) {
      return 0;
    }
    if (truncated_) {
      return size;
    }

    if (!started_) {
      std::string candidate = tail_;
      candidate.append(reinterpret_cast<const char*>(buffer), size);
      const size_t markerPos = candidate.find(marker_);
      if (markerPos == std::string::npos) {
        const size_t keep = marker_.size() > 1 ? marker_.size() - 1 : 0;
        if (candidate.size() > keep) {
          tail_.assign(candidate.data() + candidate.size() - keep, keep);
        } else {
          tail_ = std::move(candidate);
        }
        return size;
      }

      started_ = true;
      tail_.clear();
      if (!appendBounded(outContent_, candidate.data() + markerPos, candidate.size() - markerPos, maxBytes_, allowTruncate_, truncated_,
                         overflowed_)) {
        return 0;
      }
      return size;
    }

    if (!appendBounded(outContent_, reinterpret_cast<const char*>(buffer), size, maxBytes_, allowTruncate_, truncated_, overflowed_)) {
      return 0;
    }
    return size;
  }

  int available() override { return 0; }
  int read() override { return -1; }
  int peek() override { return -1; }
  void flush() override {}

  bool started() const { return started_; }
  bool truncated() const { return truncated_; }
  bool overflowed() const { return overflowed_; }

 private:
  std::string& outContent_;
  std::string marker_;
  std::string tail_;
  size_t maxBytes_ = 0;
  bool allowTruncate_ = false;
  bool started_ = false;
  bool truncated_ = false;
  bool overflowed_ = false;
};

class MarkerChunkCallbackStream final : public Stream {
 public:
  MarkerChunkCallbackStream(std::string marker, HttpDownloader::ChunkCallback onChunk)
      : marker_(std::move(marker)), onChunk_(std::move(onChunk)) {
    tail_.reserve(std::max<size_t>(marker_.size(), 32));
  }

  size_t write(uint8_t byte) override { return write(&byte, 1); }

  size_t write(const uint8_t* buffer, size_t size) override {
    if (!buffer || size == 0) {
      return 0;
    }
    if (stopped_) {
      return size;
    }

    if (!started_) {
      std::string candidate = tail_;
      candidate.append(reinterpret_cast<const char*>(buffer), size);
      const size_t markerPos = candidate.find(marker_);
      if (markerPos == std::string::npos) {
        const size_t keep = marker_.size() > 1 ? marker_.size() - 1 : 0;
        if (candidate.size() > keep) {
          tail_.assign(candidate.data() + candidate.size() - keep, keep);
        } else {
          tail_ = std::move(candidate);
        }
        return size;
      }

      started_ = true;
      tail_.clear();
      const uint8_t* chunkPtr = reinterpret_cast<const uint8_t*>(candidate.data() + markerPos);
      const size_t chunkSize = candidate.size() - markerPos;
      if (chunkSize > 0 && onChunk_ && !onChunk_(chunkPtr, chunkSize)) {
        stopped_ = true;
      }
      return size;
    }

    if (onChunk_ && !onChunk_(buffer, size)) {
      stopped_ = true;
    }
    return size;
  }

  int available() override { return 0; }
  int read() override { return -1; }
  int peek() override { return -1; }
  void flush() override {}

  bool started() const { return started_; }

 private:
  std::string marker_;
  std::string tail_;
  HttpDownloader::ChunkCallback onChunk_;
  bool started_ = false;
  bool stopped_ = false;
};

bool readHttpBodyFromMarker(HTTPClient& http, std::string& outContent, const std::string& marker, size_t maxBytes,
                            bool allowTruncate) {
  outContent.clear();
  if (marker.empty()) {
    setLastError("Missing HTTP marker");
    return false;
  }

  const size_t safeBudget = computeSafeBodyBudget(maxBytes);
  if (safeBudget == 0) {
    setLastError("Insufficient heap for HTTP body");
    return false;
  }

  NetworkClient* rawStream = http.getStreamPtr();
  if (!rawStream) {
    setLastError("Missing HTTP stream");
    return false;
  }

  MarkerBoundedWriteStream stream(outContent, marker, safeBudget, allowTruncate);
  uint32_t lastDataAtMs = millis();
  uint8_t buffer[HTTP_READ_BUFFER_SIZE];

  while (http.connected() || rawStream->available() > 0) {
    const int available = rawStream->available();
    if (available <= 0) {
      if ((millis() - lastDataAtMs) > HTTP_READ_TIMEOUT_MS) {
        setLastError(describeHttpFailure(HTTPC_ERROR_READ_TIMEOUT));
        return false;
      }
      delay(1);
      continue;
    }

    const size_t toRead = std::min<size_t>(sizeof(buffer), static_cast<size_t>(available));
    const int bytesRead = rawStream->readBytes(buffer, toRead);
    if (bytesRead <= 0) {
      if ((millis() - lastDataAtMs) > HTTP_READ_TIMEOUT_MS) {
        setLastError(describeHttpFailure(HTTPC_ERROR_READ_TIMEOUT));
        return false;
      }
      delay(1);
      continue;
    }

    lastDataAtMs = millis();
    stream.write(buffer, static_cast<size_t>(bytesRead));
    if (stream.overflowed()) {
      break;
    }
  }

  if (stream.overflowed()) {
    setLastError("HTTP body exceeds safe heap budget");
    return false;
  }

  if (!stream.started()) {
    setLastError("Content marker not found");
    return false;
  }

  if (stream.truncated()) {
    g_lastResponseTruncated = true;
    setLastError("Response truncated by RAM limit");
    LOG_DBG("HTTP", "Marker fetch truncated at %u bytes (%s)", static_cast<unsigned>(outContent.size()), heapSummary().c_str());
  }

  return true;
}

bool streamHttpBodyFromMarker(HTTPClient& http, const std::string& marker, const HttpDownloader::ChunkCallback& onChunk) {
  if (marker.empty()) {
    setLastError("Missing HTTP marker");
    return false;
  }

  NetworkClient* rawStream = http.getStreamPtr();
  if (!rawStream) {
    setLastError("Missing HTTP stream");
    return false;
  }

  MarkerChunkCallbackStream stream(marker, onChunk);
  uint32_t lastDataAtMs = millis();
  uint8_t buffer[HTTP_READ_BUFFER_SIZE];

  while (http.connected() || rawStream->available() > 0) {
    const int available = rawStream->available();
    if (available <= 0) {
      if ((millis() - lastDataAtMs) > HTTP_READ_TIMEOUT_MS) {
        setLastError(describeHttpFailure(HTTPC_ERROR_READ_TIMEOUT));
        return false;
      }
      delay(1);
      continue;
    }

    const size_t toRead = std::min<size_t>(sizeof(buffer), static_cast<size_t>(available));
    const int bytesRead = rawStream->readBytes(buffer, toRead);
    if (bytesRead <= 0) {
      if ((millis() - lastDataAtMs) > HTTP_READ_TIMEOUT_MS) {
        setLastError(describeHttpFailure(HTTPC_ERROR_READ_TIMEOUT));
        return false;
      }
      delay(1);
      continue;
    }

    lastDataAtMs = millis();
    stream.write(buffer, static_cast<size_t>(bytesRead));
  }

  if (!stream.started()) {
    setLastError("Content marker not found");
    return false;
  }

  return true;
}

class FileWriteStream final : public Stream {
 public:
  FileWriteStream(FsFile& file, size_t total, HttpDownloader::ProgressCallback progress)
      : file_(file), total_(total), progress_(std::move(progress)) {}

  size_t write(uint8_t byte) override { return write(&byte, 1); }

  size_t write(const uint8_t* buffer, size_t size) override {
    // Write-through stream for HTTPClient::writeToStream with progress tracking.
    const size_t written = file_.write(buffer, size);
    if (written != size) {
      writeOk_ = false;
    }
    downloaded_ += written;
    if (progress_ && total_ > 0) {
      progress_(downloaded_, total_);
    }
    return written;
  }

  int available() override { return 0; }
  int read() override { return -1; }
  int peek() override { return -1; }
  void flush() override { file_.flush(); }

  size_t downloaded() const { return downloaded_; }
  bool ok() const { return writeOk_; }

 private:
  FsFile& file_;
  size_t total_;
  size_t downloaded_ = 0;
  bool writeOk_ = true;
  HttpDownloader::ProgressCallback progress_;
};
}  // namespace

bool HttpDownloader::fetchUrl(const std::string& url, Stream& outContent, const std::string& username,
                              const std::string& password) {
  clearLastError();
  if (!isWifiReady()) {
    setLastError("WiFi not connected");
    LOG_ERR("HTTP", "Fetch aborted: WiFi not ready");
    return false;
  }
  ScopedWifiPerformanceMode wifiPerformanceMode;

  std::unique_ptr<NetworkClient> client;
  if (UrlUtils::isHttpsUrl(url)) {
    auto* secureClient = new (std::nothrow) NetworkClientSecure();
    if (!secureClient) {
      setLastError("Failed to allocate secure client");
      OnlineDebugLog::logHttpFailure(url, HTTPC_ERROR_TOO_LESS_RAM, g_lastError);
      return false;
    }
    secureClient->setInsecure();
    client.reset(secureClient);
  } else {
    auto* plainClient = new (std::nothrow) NetworkClient();
    if (!plainClient) {
      setLastError("Failed to allocate network client");
      OnlineDebugLog::logHttpFailure(url, HTTPC_ERROR_TOO_LESS_RAM, g_lastError);
      return false;
    }
    client.reset(plainClient);
  }
  HTTPClient http;

  LOG_DBG("HTTP", "Fetching: %s (%s)", url.c_str(), heapSummary().c_str());

  http.begin(*client, url.c_str());
  http.setReuse(false);
  configureHttpRequest(http);

  if (!username.empty() && !password.empty()) {
    std::string credentials = username + ":" + password;
    String encoded = base64::encode(credentials.c_str());
    http.addHeader("Authorization", "Basic " + encoded);
  }

  const int httpCode = http.GET();
  if (httpCode != HTTP_CODE_OK) {
    setLastError(describeHttpFailure(httpCode));
    LOG_ERR("HTTP", "Fetch failed: %d", httpCode);
    OnlineDebugLog::logHttpFailure(url, httpCode, g_lastError);
    http.end();
    return false;
  }

  const int streamResult = http.writeToStream(&outContent);
  if (streamResult < 0) {
    setLastError("writeToStream error " + std::to_string(streamResult));
    OnlineDebugLog::logHttpFailure(url, streamResult, g_lastError);
    LOG_ERR("HTTP", "writeToStream failed: %d", streamResult);
    http.end();
    return false;
  }

  http.end();

  LOG_DBG("HTTP", "Fetch success (%d bytes)", streamResult);
  return true;
}

bool HttpDownloader::fetchUrl(const std::string& url, std::string& outContent, const std::string& username,
                              const std::string& password) {
  return fetchUrlCapped(url, outContent, 0, false, username, password);
}

bool HttpDownloader::fetchUrlCapped(const std::string& url, std::string& outContent, size_t maxBytes, bool allowTruncate,
                                    const std::string& username, const std::string& password) {
  clearLastError();
  if (!isWifiReady()) {
    setLastError("WiFi not connected");
    OnlineDebugLog::logHttpFailure(url, -1, g_lastError);
    return false;
  }
  ScopedWifiPerformanceMode wifiPerformanceMode;

  std::unique_ptr<NetworkClient> client;
  if (UrlUtils::isHttpsUrl(url)) {
    auto* secureClient = new (std::nothrow) NetworkClientSecure();
    if (!secureClient) {
      setLastError("Failed to allocate secure client");
      return false;
    }
    secureClient->setInsecure();
    client.reset(secureClient);
  } else {
    auto* plainClient = new (std::nothrow) NetworkClient();
    if (!plainClient) {
      setLastError("Failed to allocate network client");
      return false;
    }
    client.reset(plainClient);
  }
  HTTPClient http;

  LOG_DBG("HTTP", "Fetching text: %s (%s)", url.c_str(), heapSummary().c_str());
  http.begin(*client, url.c_str());
  http.setReuse(false);
  configureHttpRequest(http);

  if (!username.empty() && !password.empty()) {
    std::string credentials = username + ":" + password;
    String encoded = base64::encode(credentials.c_str());
    http.addHeader("Authorization", "Basic " + encoded);
  }

  const int httpCode = http.GET();
  if (httpCode != HTTP_CODE_OK) {
    outContent.clear();
    if (httpCode > 0) {
      readHttpBody(http, outContent, HTTP_FAILURE_BODY_SNIPPET_BYTES, true);
    }
    setLastError(describeHttpFailure(httpCode));
    OnlineDebugLog::logHttpFailure(url, httpCode, g_lastError, outContent);
    LOG_ERR("HTTP", "Fetch text failed: %d", httpCode);
    http.end();
    return false;
  }

  if (!readHttpBody(http, outContent, maxBytes, allowTruncate)) {
    if (g_lastError.empty()) {
      setLastError("Failed to read response body");
    }
    OnlineDebugLog::logHttpFailure(url, HTTPC_ERROR_TOO_LESS_RAM, g_lastError, outContent);
    LOG_ERR("HTTP", "Failed to read HTTP body: %s", g_lastError.c_str());
    http.end();
    return false;
  }

  OnlineDebugLog::logHttpSuccess(url, httpCode, outContent);
  http.end();
  return true;
}

bool HttpDownloader::fetchUrlFromMarkerCapped(const std::string& url, std::string& outContent, const std::string& marker,
                                              size_t maxBytes, bool allowTruncate, const std::string& username,
                                              const std::string& password) {
  clearLastError();
  if (!isWifiReady()) {
    setLastError("WiFi not connected");
    OnlineDebugLog::logHttpFailure(url, -1, g_lastError);
    return false;
  }
  ScopedWifiPerformanceMode wifiPerformanceMode;

  std::unique_ptr<NetworkClient> client;
  if (UrlUtils::isHttpsUrl(url)) {
    auto* secureClient = new (std::nothrow) NetworkClientSecure();
    if (!secureClient) {
      setLastError("Failed to allocate secure client");
      return false;
    }
    secureClient->setInsecure();
    client.reset(secureClient);
  } else {
    auto* plainClient = new (std::nothrow) NetworkClient();
    if (!plainClient) {
      setLastError("Failed to allocate network client");
      return false;
    }
    client.reset(plainClient);
  }
  HTTPClient http;

  LOG_DBG("HTTP", "Fetching text from marker: %s (%s)", url.c_str(), heapSummary().c_str());
  http.begin(*client, url.c_str());
  http.setReuse(false);
  configureHttpRequest(http);

  if (!username.empty() && !password.empty()) {
    std::string credentials = username + ":" + password;
    String encoded = base64::encode(credentials.c_str());
    http.addHeader("Authorization", "Basic " + encoded);
  }

  const int httpCode = http.GET();
  if (httpCode != HTTP_CODE_OK) {
    outContent.clear();
    if (httpCode > 0) {
      readHttpBody(http, outContent, HTTP_FAILURE_BODY_SNIPPET_BYTES, true);
    }
    setLastError(describeHttpFailure(httpCode));
    OnlineDebugLog::logHttpFailure(url, httpCode, g_lastError, outContent);
    LOG_ERR("HTTP", "Fetch text from marker failed: %d", httpCode);
    http.end();
    return false;
  }

  if (!readHttpBodyFromMarker(http, outContent, marker, maxBytes, allowTruncate)) {
    if (g_lastError.empty()) {
      setLastError("Failed to read response body");
    }
    OnlineDebugLog::logHttpFailure(url, HTTPC_ERROR_TOO_LESS_RAM, g_lastError, outContent);
    LOG_ERR("HTTP", "Failed to read HTTP body from marker: %s", g_lastError.c_str());
    http.end();
    return false;
  }

  OnlineDebugLog::logHttpSuccess(url, httpCode, outContent);
  http.end();
  return true;
}

bool HttpDownloader::fetchUrlFromMarkerStreamed(const std::string& url, const std::string& marker, ChunkCallback onChunk,
                                                const std::string& username, const std::string& password) {
  clearLastError();
  if (!isWifiReady()) {
    setLastError("WiFi not connected");
    OnlineDebugLog::logHttpFailure(url, -1, g_lastError);
    return false;
  }
  ScopedWifiPerformanceMode wifiPerformanceMode;

  std::unique_ptr<NetworkClient> client;
  if (UrlUtils::isHttpsUrl(url)) {
    auto* secureClient = new (std::nothrow) NetworkClientSecure();
    if (!secureClient) {
      setLastError("Failed to allocate secure client");
      return false;
    }
    secureClient->setInsecure();
    client.reset(secureClient);
  } else {
    auto* plainClient = new (std::nothrow) NetworkClient();
    if (!plainClient) {
      setLastError("Failed to allocate network client");
      return false;
    }
    client.reset(plainClient);
  }
  HTTPClient http;

  LOG_DBG("HTTP", "Fetching streamed text from marker: %s (%s)", url.c_str(), heapSummary().c_str());
  http.begin(*client, url.c_str());
  http.setReuse(false);
  configureHttpRequest(http);

  if (!username.empty() && !password.empty()) {
    std::string credentials = username + ":" + password;
    String encoded = base64::encode(credentials.c_str());
    http.addHeader("Authorization", "Basic " + encoded);
  }

  const int httpCode = http.GET();
  if (httpCode != HTTP_CODE_OK) {
    std::string failureSnippet;
    if (httpCode > 0) {
      readHttpBody(http, failureSnippet, HTTP_FAILURE_BODY_SNIPPET_BYTES, true);
    }
    setLastError(describeHttpFailure(httpCode));
    OnlineDebugLog::logHttpFailure(url, httpCode, g_lastError, failureSnippet);
    LOG_ERR("HTTP", "Fetch streamed text failed: %d", httpCode);
    http.end();
    return false;
  }

  const bool ok = streamHttpBodyFromMarker(http, marker, onChunk);
  if (!ok) {
    if (g_lastError.empty()) {
      setLastError("Failed to stream response body");
    }
    OnlineDebugLog::logHttpFailure(url, HTTPC_ERROR_TOO_LESS_RAM, g_lastError);
    LOG_ERR("HTTP", "Failed to stream HTTP body from marker: %s", g_lastError.c_str());
    http.end();
    return false;
  }

  http.end();
  return true;
}

HttpDownloader::DownloadError HttpDownloader::downloadToFile(const std::string& url, const std::string& destPath,
                                                             ProgressCallback progress, const std::string& username,
                                                             const std::string& password) {
  clearLastError();
  if (!isWifiReady()) {
    setLastError("WiFi not connected");
    LOG_ERR("HTTP", "Download aborted: WiFi not ready");
    return HTTP_ERROR;
  }
  ScopedWifiPerformanceMode wifiPerformanceMode;

  std::unique_ptr<NetworkClient> client;
  if (UrlUtils::isHttpsUrl(url)) {
    auto* secureClient = new (std::nothrow) NetworkClientSecure();
    if (!secureClient) {
      setLastError("Failed to allocate secure client");
      return HTTP_ERROR;
    }
    secureClient->setInsecure();
    client.reset(secureClient);
  } else {
    auto* plainClient = new (std::nothrow) NetworkClient();
    if (!plainClient) {
      setLastError("Failed to allocate network client");
      return HTTP_ERROR;
    }
    client.reset(plainClient);
  }
  HTTPClient http;

  LOG_DBG("HTTP", "Downloading: %s (%s)", url.c_str(), heapSummary().c_str());
  LOG_DBG("HTTP", "Destination: %s", destPath.c_str());

  http.begin(*client, url.c_str());
  http.setReuse(false);
  configureHttpRequest(http);

  if (!username.empty() && !password.empty()) {
    std::string credentials = username + ":" + password;
    String encoded = base64::encode(credentials.c_str());
    http.addHeader("Authorization", "Basic " + encoded);
  }

  const int httpCode = http.GET();
  if (httpCode != HTTP_CODE_OK) {
    setLastError(describeHttpFailure(httpCode));
    LOG_ERR("HTTP", "Download failed: %d", httpCode);
    http.end();
    return HTTP_ERROR;
  }

  const int64_t reportedLength = http.getSize();
  const size_t contentLength = reportedLength > 0 ? static_cast<size_t>(reportedLength) : 0;
  if (contentLength > 0) {
    LOG_DBG("HTTP", "Content-Length: %zu", contentLength);
  } else {
    LOG_DBG("HTTP", "Content-Length: unknown");
  }

  // Remove existing file if present
  if (Storage.exists(destPath.c_str())) {
    Storage.remove(destPath.c_str());
  }

  // Open file for writing
  FsFile file;
  if (!Storage.openFileForWrite("HTTP", destPath.c_str(), file)) {
    setLastError("Failed to open destination file");
    LOG_ERR("HTTP", "Failed to open file for writing");
    http.end();
    return FILE_ERROR;
  }

  // Let HTTPClient handle chunked decoding and stream body bytes into the file.
  FileWriteStream fileStream(file, contentLength, progress);
  const int writeResult = http.writeToStream(&fileStream);

  file.close();
  http.end();

  if (writeResult < 0) {
    setLastError("writeToStream error " + std::to_string(writeResult));
    LOG_ERR("HTTP", "writeToStream error: %d", writeResult);
    Storage.remove(destPath.c_str());
    return HTTP_ERROR;
  }

  const size_t downloaded = fileStream.downloaded();
  LOG_DBG("HTTP", "Downloaded %zu bytes", downloaded);

  // Guard against partial writes even if HTTPClient completes.
  if (!fileStream.ok()) {
    setLastError("File write failed");
    LOG_ERR("HTTP", "Write failed during download");
    Storage.remove(destPath.c_str());
    return FILE_ERROR;
  }

  if (contentLength == 0 && downloaded == 0) {
    setLastError("No data received");
    LOG_ERR("HTTP", "Download failed: no data received");
    Storage.remove(destPath.c_str());
    return HTTP_ERROR;
  }

  // Verify download size if known
  if (contentLength > 0 && downloaded != contentLength) {
    setLastError("Incomplete download");
    LOG_ERR("HTTP", "Size mismatch: got %zu, expected %zu", downloaded, contentLength);
    Storage.remove(destPath.c_str());
    return HTTP_ERROR;
  }

  return OK;
}

const std::string& HttpDownloader::getLastError() { return g_lastError; }

void HttpDownloader::clearLastError() {
  g_lastError.clear();
  g_lastResponseTruncated = false;
}

bool HttpDownloader::wasLastResponseTruncated() { return g_lastResponseTruncated; }
