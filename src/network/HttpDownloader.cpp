#include "HttpDownloader.h"

#include <HTTPClient.h>
#include <Logging.h>
#include <NetworkClient.h>
#include <NetworkClientSecure.h>
#include <StreamString.h>
#include <base64.h>

#include <cstring>
#include <memory>
#include <utility>

#include "util/UrlUtils.h"

namespace {
int g_lastHttpCode = 0;
std::string g_lastErrorMessage;

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
  clearLastHttpError();
  const std::string sanitizedUrl = UrlUtils::sanitizeUrl(url);
  std::unique_ptr<NetworkClient> client;
  if (UrlUtils::isHttpsUrl(sanitizedUrl)) {
    auto* secureClient = new NetworkClientSecure();
    secureClient->setInsecure();
    client.reset(secureClient);
  } else {
    client.reset(new NetworkClient());
  }
  HTTPClient http;

  if (sanitizedUrl != url) {
    LOG_DBG("HTTP", "Sanitized fetch URL: raw=%s sanitized=%s", escapeUrlForLog(url).c_str(),
            sanitizedUrl.c_str());
  }
  LOG_DBG("HTTP", "Fetching: %s", sanitizedUrl.c_str());

  if (!http.begin(*client, sanitizedUrl.c_str())) {
    setLastHttpError("begin", sanitizedUrl, -1000);
    LOG_ERR("HTTP", "Fetch begin failed: %s", escapeUrlForLog(sanitizedUrl).c_str());
    return false;
  }
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.addHeader("User-Agent", "CrossPoint-ESP32-" CROSSPOINT_VERSION);

  if (!username.empty() && !password.empty()) {
    std::string credentials = username + ":" + password;
    String encoded = base64::encode(credentials.c_str());
    http.addHeader("Authorization", "Basic " + encoded);
  }

  const int httpCode = http.GET();
  if (httpCode != HTTP_CODE_OK) {
    const String detail = HTTPClient::errorToString(httpCode);
    setLastHttpError("GET", sanitizedUrl, httpCode, detail);
    LOG_ERR("HTTP", "Fetch failed: %d (%s) url=%s", httpCode, detail.c_str(), sanitizedUrl.c_str());
    http.end();
    return false;
  }

  http.writeToStream(&outContent);

  http.end();
  clearLastHttpError();

  LOG_DBG("HTTP", "Fetch success");
  return true;
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
  const std::string sanitizedUrl = UrlUtils::sanitizeUrl(url);
  std::unique_ptr<NetworkClient> client;
  if (UrlUtils::isHttpsUrl(sanitizedUrl)) {
    auto* secureClient = new NetworkClientSecure();
    secureClient->setInsecure();
    client.reset(secureClient);
  } else {
    client.reset(new NetworkClient());
  }
  HTTPClient http;

  if (sanitizedUrl != url) {
    LOG_DBG("HTTP", "Sanitized download URL: raw=%s sanitized=%s", escapeUrlForLog(url).c_str(),
            sanitizedUrl.c_str());
  }
  LOG_DBG("HTTP", "Downloading: %s", sanitizedUrl.c_str());
  LOG_DBG("HTTP", "Destination: %s", destPath.c_str());

  if (!http.begin(*client, sanitizedUrl.c_str())) {
    setLastHttpError("begin", sanitizedUrl, -1000);
    LOG_ERR("HTTP", "Download begin failed: %s", escapeUrlForLog(sanitizedUrl).c_str());
    return HTTP_ERROR;
  }
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.addHeader("User-Agent", "CrossPoint-ESP32-" CROSSPOINT_VERSION);

  if (!username.empty() && !password.empty()) {
    std::string credentials = username + ":" + password;
    String encoded = base64::encode(credentials.c_str());
    http.addHeader("Authorization", "Basic " + encoded);
  }

  const int httpCode = http.GET();
  if (httpCode != HTTP_CODE_OK) {
    const String detail = HTTPClient::errorToString(httpCode);
    setLastHttpError("GET", sanitizedUrl, httpCode, detail);
    LOG_ERR("HTTP", "Download failed: %d (%s) url=%s", httpCode, detail.c_str(), sanitizedUrl.c_str());
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
    setLastHttpError("write", sanitizedUrl, writeResult);
    LOG_ERR("HTTP", "writeToStream error: %d", writeResult);
    Storage.remove(destPath.c_str());
    return HTTP_ERROR;
  }

  const size_t downloaded = fileStream.downloaded();
  LOG_DBG("HTTP", "Downloaded %zu bytes", downloaded);

  // Guard against partial writes even if HTTPClient completes.
  if (!fileStream.ok()) {
    LOG_ERR("HTTP", "Write failed during download");
    Storage.remove(destPath.c_str());
    return FILE_ERROR;
  }

  if (contentLength == 0 && downloaded == 0) {
    setLastHttpError("empty", sanitizedUrl, -1001);
    LOG_ERR("HTTP", "Download failed: no data received");
    Storage.remove(destPath.c_str());
    return HTTP_ERROR;
  }

  // Verify download size if known
  if (contentLength > 0 && downloaded != contentLength) {
    setLastHttpError("size", sanitizedUrl, -1002);
    LOG_ERR("HTTP", "Size mismatch: got %zu, expected %zu", downloaded, contentLength);
    Storage.remove(destPath.c_str());
    return HTTP_ERROR;
  }

  clearLastHttpError();
  return OK;
}

int HttpDownloader::getLastHttpCode() { return g_lastHttpCode; }

std::string HttpDownloader::getLastErrorMessage() { return g_lastErrorMessage; }
