#include "OnlineSourceBridge.h"

#include <Arduino.h>
#include <ArduinoJson.h>
#include <HalStorage.h>
#include <Logging.h>
#include <WiFi.h>

#include <algorithm>
#include <cctype>
#include <cstdio>
#include <sstream>
#include <utility>
#include <vector>

#include <Serialization.h>
#include "HakoEpubService.h"
#include "network/HttpDownloader.h"
#include "util/UrlUtils.h"

namespace OnlineSourceBridge {

namespace {
std::string g_lastError;
std::string g_preferredServerBaseUrl;

void clearLastError() { g_lastError.clear(); }

void setLastError(std::string message) { g_lastError = std::move(message); }

bool containsAsciiCaseInsensitive(const std::string& haystack, const char* needle) {
  return std::search(haystack.begin(), haystack.end(), needle, needle + std::char_traits<char>::length(needle),
                     [](const char left, const char right) {
                       return std::tolower(static_cast<unsigned char>(left)) ==
                              std::tolower(static_cast<unsigned char>(right));
                     }) != haystack.end();
}

std::string sourceLabel(const CpPluginInfo& pluginInfo) {
  if (!pluginInfo.name.empty()) {
    return pluginInfo.name;
  }
  if (pluginInfo.runtimeProfile == "hako" || pluginInfo.id == "hako") return "Hako";
  if (pluginInfo.id == "webtruyen") return "Web Truyen";
  if (pluginInfo.runtimeProfile == "truyenfull" || pluginInfo.id == "truyenfull") return "Truyen Full";
  return pluginInfo.id.empty() ? std::string("Source") : pluginInfo.id;
}

std::string sourceError(const CpPluginInfo& pluginInfo, const char* detail) {
  return sourceLabel(pluginInfo) + "\n" + detail;
}

std::string normalizeSourceError(const CpPluginInfo& pluginInfo, const std::string& rawError, const char* fallback) {
  const std::string message = rawError.empty() ? std::string(fallback) : rawError;

  if (containsAsciiCaseInsensitive(message, "connection refused")) {
    return sourceError(pluginInfo, "Server unavailable");
  }

  if (message == "Request timed out (HTTP -11)") {
    return sourceError(pluginInfo, "Request timed out");
  }

  if (containsAsciiCaseInsensitive(message, "network error")) {
    return sourceError(pluginInfo, "Network error");
  }

  if (containsAsciiCaseInsensitive(message, "truncated by ram") ||
      containsAsciiCaseInsensitive(message, "insufficient heap")) {
    return sourceError(pluginInfo, "Not enough memory");
  }

  if (containsAsciiCaseInsensitive(message, "http 403")) {
    return sourceError(pluginInfo, "HTTP 403 forbidden");
  }

  if (containsAsciiCaseInsensitive(message, "http 404")) {
    return sourceError(pluginInfo, "HTTP 404 not found");
  }

  if (containsAsciiCaseInsensitive(message, "http 5")) {
    return sourceError(pluginInfo, "Server error");
  }

  if (containsAsciiCaseInsensitive(message, "blocking") || containsAsciiCaseInsensitive(message, "blocked") ||
      containsAsciiCaseInsensitive(message, "captcha") || containsAsciiCaseInsensitive(message, "cloudflare") ||
      containsAsciiCaseInsensitive(message, "verify you are human") ||
      containsAsciiCaseInsensitive(message, "access denied")) {
    return sourceError(pluginInfo, "Blocked or captcha");
  }

  if (message == "Source feed parse failed") {
    return sourceError(pluginInfo, "Home page error");
  }

  if (message == "Search request failed") {
    return sourceError(pluginInfo, "Search request failed");
  }

  if (message == "Book detail parse failed") {
    return sourceError(pluginInfo, "Book page error");
  }

  if (message == "Chapter list parse failed") {
    return sourceError(pluginInfo, "Chapter list error");
  }

  if (message == "Chapter parse failed") {
    return sourceError(pluginInfo, "Chapter page error");
  }

  if (containsAsciiCaseInsensitive(message, "unexpected page")) {
    return sourceError(pluginInfo, "Unexpected page");
  }

  if (containsAsciiCaseInsensitive(message, "invalid server response") ||
      containsAsciiCaseInsensitive(message, "invalid upstream response")) {
    return sourceError(pluginInfo, "Invalid response");
  }

  if (containsAsciiCaseInsensitive(message, "upstream request failed")) {
    return sourceError(pluginInfo, "Upstream request failed");
  }

  if (containsAsciiCaseInsensitive(message, "http ")) {
    return sourceLabel(pluginInfo) + "\n" + message;
  }

  return message;
}

void setLastErrorFromHttpOrFallback(const char* fallback) {
  const std::string& httpError = HttpDownloader::getLastError();
  if (!httpError.empty()) {
    setLastError(httpError);
  } else {
    setLastError(fallback);
  }
}

constexpr char ONLINE_CACHE_DIR[] = "/.crosspoint/data/online_cache";
constexpr char DEFAULT_ONLINE_LIBRARY_BASE_URL[] = "https://online-library.noe.asia";
constexpr char LAN_ONLINE_LIBRARY_BASE_URL[] = "http://192.168.1.202:8787";
constexpr uint32_t DETAIL_CACHE_FILE_MAGIC = 0x4F444331;   // ODC1
constexpr uint32_t TOC_CACHE_FILE_MAGIC = 0x4F544331;      // OTC1
constexpr uint32_t TOC_PAGE_CACHE_FILE_MAGIC = 0x4F544350; // OTCP
constexpr uint16_t TOC_CACHE_FILE_VERSION = 1;
constexpr uint16_t DETAIL_CACHE_FILE_VERSION = 2;
constexpr size_t MAX_TOC_CACHE_CHAPTERS = 192;
constexpr size_t MAX_TOC_PAGE_CACHE_CHAPTERS = 64;
constexpr size_t MAX_ONLINE_CACHE_FILES = 24;
constexpr uint32_t ONLINE_CACHE_PRUNE_INTERVAL_MS = 30000;
constexpr size_t SERVER_HOME_CAP_BYTES = 24 * 1024;
constexpr size_t SERVER_SEARCH_CAP_BYTES = 24 * 1024;
constexpr size_t SERVER_DETAIL_CAP_BYTES = 48 * 1024;
constexpr size_t SERVER_TOC_PAGE_CAP_BYTES = 32 * 1024;
constexpr size_t SERVER_TOC_CAP_BYTES = 96 * 1024;
constexpr size_t SERVER_CHAPTER_TEXT_CAP_BYTES = 64 * 1024;
constexpr size_t SERVER_CHAPTER_HTML_CAP_BYTES = 96 * 1024;
constexpr size_t SERVER_CHAPTER_TEXT_FILE_CAP_BYTES = 256 * 1024;

struct CacheFileInfo {
  std::string path;
  bool removable = false;
};

bool isPlugin(const CpPluginInfo& pluginInfo, const char* expectedId) { return pluginInfo.id == expectedId; }

bool isProfile(const CpPluginInfo& pluginInfo, const char* expectedProfile) {
  return pluginInfo.runtimeMode == "adapter" && pluginInfo.runtimeProfile == expectedProfile;
}

bool isHakoLike(const CpPluginInfo& pluginInfo) { return isPlugin(pluginInfo, "hako") || isProfile(pluginInfo, "hako"); }

bool isTruyenFullLike(const CpPluginInfo& pluginInfo) {
  return isPlugin(pluginInfo, "truyenfull") || isProfile(pluginInfo, "truyenfull");
}

std::string canonicalProfileFor(const CpPluginInfo& pluginInfo) {
  if (!pluginInfo.runtimeProfile.empty()) {
    return pluginInfo.runtimeProfile;
  }
  if (pluginInfo.id == "hako" || pluginInfo.id == "hako-novel") {
    return "hako";
  }
  if (pluginInfo.id == "truyenfull" || pluginInfo.id == "truyen-full") {
    return "truyenfull";
  }
  if (pluginInfo.id == "webtruyen") {
    return "truyenfull";
  }
  return "";
}

std::string resolvedBaseUrlFor(const CpPluginInfo& pluginInfo, const char* fallback) {
  return pluginInfo.baseUrl.empty() ? std::string(fallback) : pluginInfo.baseUrl;
}

bool isServerOrigin(const CpPluginInfo& pluginInfo) {
  return pluginInfo.runtimeMode == "adapter" && pluginInfo.runtimeOrigin == "server" && !pluginInfo.runtimeProfile.empty() &&
         !pluginInfo.baseUrl.empty();
}

bool supportsIncrementalTocFetch(const CpPluginInfo& pluginInfo) {
  return isServerOrigin(pluginInfo) && (isHakoLike(pluginInfo) || isTruyenFullLike(pluginInfo));
}

std::string trimTrailingSlash(std::string value) {
  while (!value.empty() && value.back() == '/') {
    value.pop_back();
  }
  return value;
}

void noteWorkingServerBaseUrl(const std::string& baseUrl) {
  const std::string normalized = trimTrailingSlash(baseUrl);
  if (!normalized.empty()) {
    g_preferredServerBaseUrl = normalized;
  }
}

std::string extractUrlOrigin(const std::string& url) {
  const size_t schemePos = url.find("://");
  if (schemePos == std::string::npos) {
    return "";
  }
  const size_t hostStart = schemePos + 3;
  const size_t hostEnd = url.find('/', hostStart);
  return hostEnd == std::string::npos ? url : url.substr(0, hostEnd);
}

std::string stripUrlQueryAndFragment(std::string url) {
  const size_t cutPos = url.find_first_of("?#");
  if (cutPos != std::string::npos) {
    url.resize(cutPos);
  }
  return url;
}

std::string resolveAbsoluteUrl(const std::string& url, const std::string& baseUrl) {
  if (url.empty()) {
    return "";
  }
  if (url.rfind("http://", 0) == 0 || url.rfind("https://", 0) == 0) {
    return url;
  }
  if (url.rfind("//", 0) == 0) {
    return "https:" + url;
  }
  if (baseUrl.empty()) {
    return url;
  }

  const std::string origin = extractUrlOrigin(baseUrl);
  if (url.front() == '/') {
    return origin.empty() ? url : origin + url;
  }

  std::string parent = stripUrlQueryAndFragment(baseUrl);
  const size_t slashPos = parent.find_last_of('/');
  if (slashPos == std::string::npos) {
    return origin.empty() ? url : origin + "/" + url;
  }
  parent.resize(slashPos + 1);
  return parent + url;
}

std::string urlEncode(const std::string& value) {
  std::string encoded;
  encoded.reserve(value.size() * 3);
  static constexpr char HEX_DIGITS[] = "0123456789ABCDEF";
  for (unsigned char ch : value) {
    if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '-' || ch == '_' ||
        ch == '.' || ch == '~') {
      encoded.push_back(static_cast<char>(ch));
      continue;
    }
    encoded.push_back('%');
    encoded.push_back(HEX_DIGITS[(ch >> 4) & 0x0F]);
    encoded.push_back(HEX_DIGITS[ch & 0x0F]);
  }
  return encoded;
}

std::string buildServerApiUrl(const CpPluginInfo& pluginInfo, const std::string& operation,
                              const std::vector<std::pair<std::string, std::string>>& params = {});
std::string preferredServerBaseUrlFor(const CpPluginInfo& pluginInfo);

std::string buildServerApiUrlForBaseUrl(const std::string& baseUrl, const CpPluginInfo& pluginInfo, const std::string& operation,
                              const std::vector<std::pair<std::string, std::string>>& params = {}) {
  std::string url = trimTrailingSlash(baseUrl);
  url += "/api/v1/source/";
  url += canonicalProfileFor(pluginInfo);
  url += "/";
  url += operation;
  if (!params.empty()) {
    url.push_back('?');
    for (size_t i = 0; i < params.size(); ++i) {
      if (i > 0) {
        url.push_back('&');
      }
      url += urlEncode(params[i].first);
      url.push_back('=');
      url += urlEncode(params[i].second);
    }
  }
  return url;
}

std::string buildServerApiUrl(const CpPluginInfo& pluginInfo, const std::string& operation,
                              const std::vector<std::pair<std::string, std::string>>& params) {
  return buildServerApiUrlForBaseUrl(preferredServerBaseUrlFor(pluginInfo), pluginInfo, operation, params);
}

void appendServerBaseUrlCandidate(std::vector<std::string>& outCandidates, const std::string& baseUrl) {
  const std::string normalized = trimTrailingSlash(baseUrl);
  if (normalized.empty()) {
    return;
  }
  if (std::find(outCandidates.begin(), outCandidates.end(), normalized) == outCandidates.end()) {
    outCandidates.push_back(normalized);
  }
}

bool deviceAppearsOnServerLan() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  const IPAddress ip = WiFi.localIP();
  return ip[0] == 192 && ip[1] == 168 && ip[2] == 1;
}

std::vector<std::string> buildServerBaseUrlCandidates(const CpPluginInfo& pluginInfo) {
  std::vector<std::string> out;
  out.reserve(4);
  if (deviceAppearsOnServerLan()) {
    appendServerBaseUrlCandidate(out, LAN_ONLINE_LIBRARY_BASE_URL);
    appendServerBaseUrlCandidate(out, g_preferredServerBaseUrl);
    appendServerBaseUrlCandidate(out, pluginInfo.baseUrl);
    appendServerBaseUrlCandidate(out, DEFAULT_ONLINE_LIBRARY_BASE_URL);
  } else {
    appendServerBaseUrlCandidate(out, g_preferredServerBaseUrl);
    appendServerBaseUrlCandidate(out, pluginInfo.baseUrl);
    appendServerBaseUrlCandidate(out, DEFAULT_ONLINE_LIBRARY_BASE_URL);
    appendServerBaseUrlCandidate(out, LAN_ONLINE_LIBRARY_BASE_URL);
  }
  return out;
}

std::string preferredServerBaseUrlFor(const CpPluginInfo& pluginInfo) {
  const auto candidates = buildServerBaseUrlCandidates(pluginInfo);
  return candidates.empty() ? trimTrailingSlash(pluginInfo.baseUrl) : candidates.front();
}

bool isServerAssetProxyUrl(const std::string& url) { return url.find("/api/v1/source/") != std::string::npos && url.find("/asset?") != std::string::npos; }

std::string extractProxiedAssetTarget(const std::string& url) {
  const size_t queryPos = url.find('?');
  if (queryPos == std::string::npos || queryPos + 1 >= url.size()) {
    return "";
  }

  size_t pos = queryPos + 1;
  while (pos < url.size()) {
    const size_t nextAmp = url.find('&', pos);
    const std::string pair = url.substr(pos, nextAmp == std::string::npos ? std::string::npos : nextAmp - pos);
    if (pair.rfind("url=", 0) == 0) {
      std::string decoded;
      decoded.reserve(pair.size());
      for (size_t index = 4; index < pair.size(); ++index) {
        const char ch = pair[index];
        if (ch == '%' && index + 2 < pair.size()) {
          const auto hexValue = [](char value) -> int {
            if (value >= '0' && value <= '9') return value - '0';
            if (value >= 'A' && value <= 'F') return value - 'A' + 10;
            if (value >= 'a' && value <= 'f') return value - 'a' + 10;
            return -1;
          };
          const int hi = hexValue(pair[index + 1]);
          const int lo = hexValue(pair[index + 2]);
          if (hi >= 0 && lo >= 0) {
            decoded.push_back(static_cast<char>((hi << 4) | lo));
            index += 2;
            continue;
          }
        }
        decoded.push_back(ch == '+' ? ' ' : ch);
      }
      return decoded;
    }
    if (nextAmp == std::string::npos) {
      break;
    }
    pos = nextAmp + 1;
  }
  return "";
}

std::string rewriteHtmlAssetUrls(const CpPluginInfo& pluginInfo, const std::string& baseUrl, const std::string& html);

CpPluginInfo makeServerPluginInfo(const std::string& id, const std::string& profile, const std::string& name,
                                  const std::string& baseUrl, const std::string& locale, const std::string& contentType,
                                  bool supportsSearch, bool supportsTrackedUpdates, bool supportsX3, bool supportsX4) {
  CpPluginInfo info;
  info.id = id;
  info.name = name;
  info.version = 1;
  info.runtimeMode = "adapter";
  info.runtimeProfile = profile;
  info.runtimeOrigin = "server";
  info.baseUrl = baseUrl;
  info.locale = locale;
  info.contentType = contentType;
  info.supportsSearch = supportsSearch;
  info.supportsTrackedUpdates = supportsTrackedUpdates;
  info.supportsX3 = supportsX3;
  info.supportsX4 = supportsX4;
  return info;
}

bool tryParseServerJsonOnce(const CpPluginInfo& pluginInfo, const std::string& url, size_t maxBytes, std::string& body,
                            JsonDocument& doc, std::string& outError) {
  body.clear();
  doc.clear();
  if (!HttpDownloader::fetchUrlCapped(url, body, maxBytes, false)) {
    const std::string& httpError = HttpDownloader::getLastError();
    outError = normalizeSourceError(pluginInfo, httpError.empty() ? "Server request failed" : httpError, "Server request failed");
    return false;
  }

  DeserializationError error = deserializeJson(doc, body.data(), body.size());
  if (error) {
    outError = normalizeSourceError(pluginInfo, "Invalid server response", "Invalid server response");
    return false;
  }

  const bool ok = doc["ok"].isNull() ? true : doc["ok"].as<bool>();
  if (!ok) {
    const std::string errorMessage = doc["error"] | "Server request failed";
    outError = normalizeSourceError(pluginInfo, errorMessage, "Server request failed");
    return false;
  }

  outError.clear();
  return true;
}

bool parseServerJson(const CpPluginInfo& pluginInfo, const std::string& operation,
                     const std::vector<std::pair<std::string, std::string>>& params, size_t maxBytes, std::string& body,
                     JsonDocument& doc) {
  std::string lastError = normalizeSourceError(pluginInfo, "Server request failed", "Server request failed");
  for (const auto& baseUrl : buildServerBaseUrlCandidates(pluginInfo)) {
    if (tryParseServerJsonOnce(pluginInfo, buildServerApiUrlForBaseUrl(baseUrl, pluginInfo, operation, params), maxBytes, body,
                               doc, lastError)) {
      noteWorkingServerBaseUrl(baseUrl);
      return true;
    }
  }

  setLastError(lastError);
  return false;
}

bool tryParseSourceCatalogOnce(const std::string& baseUrl, std::vector<CpPluginInfo>& outSources, std::string& outError) {
  const std::string url = trimTrailingSlash(baseUrl) + "/api/v1/sources";
  std::string body;
  JsonDocument doc;
  if (!HttpDownloader::fetchUrlCapped(url, body, 24 * 1024, false)) {
    const std::string& httpError = HttpDownloader::getLastError();
    outError = httpError.empty() ? std::string("Server request failed") : httpError;
    return false;
  }

  DeserializationError error = deserializeJson(doc, body.data(), body.size());
  if (error) {
    outError = "Invalid server response";
    return false;
  }

  const bool ok = doc["ok"].isNull() ? true : doc["ok"].as<bool>();
  if (!ok) {
    outError = doc["error"] | "Server request failed";
    return false;
  }

  JsonArrayConst sources = doc["sources"].as<JsonArrayConst>();
  if (sources.isNull()) {
    outError = "Invalid server response";
    return false;
  }

  outSources.clear();
  outSources.reserve(sources.size());
  for (JsonObjectConst item : sources) {
    const std::string id = item["id"] | std::string("");
    const std::string profile = item["profile"] | std::string("");
    const std::string name = item["name"] | std::string("");
    if (id.empty() || profile.empty() || name.empty()) {
      continue;
    }
    outSources.push_back(makeServerPluginInfo(id, profile, name, trimTrailingSlash(baseUrl), item["locale"] | "vi-VN",
                                              item["contentType"] | "webnovel", item["supportsSearch"] | true,
                                              item["supportsTrackedUpdates"] | false, item["supportsX3"] | true,
                                              item["supportsX4"] | true));
  }

  if (outSources.empty()) {
    outError = "No online sources";
    return false;
  }

  std::sort(outSources.begin(), outSources.end(),
            [](const CpPluginInfo& left, const CpPluginInfo& right) { return left.name < right.name; });
  noteWorkingServerBaseUrl(baseUrl);
  outError.clear();
  return true;
}

bool readRawWireLine(const std::string& body, size_t& pos, std::string& outLine) {
  if (pos > body.size()) {
    return false;
  }

  const size_t lineEnd = body.find('\n', pos);
  if (lineEnd == std::string::npos) {
    outLine = body.substr(pos);
    pos = body.size();
  } else {
    outLine = body.substr(pos, lineEnd - pos);
    pos = lineEnd + 1;
  }

  if (!outLine.empty() && outLine.back() == '\r') {
    outLine.pop_back();
  }
  return true;
}

bool tryParseWireChapterBody(const std::string& body, const HakoChapterRef& fallbackRef, bool includePlainText,
                             HakoChapterContent& outContent) {
  size_t pos = 0;
  std::string magic;
  std::string mode;
  std::string url;
  std::string title;
  std::string sectionTitle;
  std::string indexLine;
  std::string separator;

  if (!readRawWireLine(body, pos, magic) || !readRawWireLine(body, pos, mode) || !readRawWireLine(body, pos, url) ||
      !readRawWireLine(body, pos, title) || !readRawWireLine(body, pos, sectionTitle) ||
      !readRawWireLine(body, pos, indexLine) || !readRawWireLine(body, pos, separator)) {
    return false;
  }

  if (magic != "CPCH1" || !separator.empty()) {
    return false;
  }

  outContent = {};
  outContent.ref = fallbackRef;
  if (!url.empty()) {
    outContent.ref.url = url;
  }
  if (!title.empty()) {
    outContent.ref.title = title;
  }
  if (!sectionTitle.empty()) {
    outContent.ref.sectionTitle = sectionTitle;
  }
  if (!indexLine.empty()) {
    int parsedIndex = 0;
    bool sawDigit = false;
    bool negative = false;
    size_t indexPos = 0;
    if (indexLine[0] == '-') {
      negative = true;
      indexPos = 1;
    }
    for (; indexPos < indexLine.size(); ++indexPos) {
      const char ch = indexLine[indexPos];
      if (ch < '0' || ch > '9') {
        sawDigit = false;
        break;
      }
      sawDigit = true;
      parsedIndex = parsedIndex * 10 + (ch - '0');
    }
    if (sawDigit) {
      outContent.ref.index = negative ? -parsedIndex : parsedIndex;
    }
  }

  const std::string payload = body.substr(pos);
  if (mode == "text") {
    outContent.text = payload;
    if (!includePlainText) {
      outContent.text.clear();
    }
  } else if (mode == "html") {
    outContent.html = payload;
  } else {
    return false;
  }

  return !outContent.ref.url.empty() && (!outContent.text.empty() || !outContent.html.empty());
}

bool ensureOnlineCacheDir();

class RawChapterTextFileStream final : public Stream {
 public:
  RawChapterTextFileStream(HakoChapterRef fallbackRef, size_t maxBytes, std::string destPath)
      : ref_(std::move(fallbackRef)), maxBytes_(maxBytes), destPath_(std::move(destPath)) {}

  bool begin() {
    ensureOnlineCacheDir();
    Storage.remove(destPath_.c_str());
    if (!Storage.openFileForWrite("OSB", destPath_, file_)) {
      error_ = "Failed to open chapter cache";
      return false;
    }
    return true;
  }

  size_t write(uint8_t byte) override { return write(&byte, 1); }

  size_t write(const uint8_t* buffer, size_t size) override {
    if (!buffer || size == 0) {
      return 0;
    }
    if (failed_) {
      return 0;
    }

    size_t consumed = 0;
    for (; consumed < size; ++consumed) {
      const char ch = static_cast<char>(buffer[consumed]);
      if (!headerDone_) {
        if (ch == '\n') {
          if (!consumeHeaderLine(headerLine_)) {
            failed_ = true;
            break;
          }
          headerLine_.clear();
          continue;
        }
        if (ch != '\r') {
          headerLine_.push_back(ch);
          if (headerLine_.size() > 256) {
            error_ = "Invalid raw chapter header";
            failed_ = true;
            break;
          }
        }
        continue;
      }

      if (payloadBytes_ >= maxBytes_) {
        error_ = "Insufficient heap for chapter payload";
        failed_ = true;
        capacityExceeded_ = true;
        break;
      }
      if (file_.write(&ch, 1) != 1) {
        error_ = "Failed to write chapter cache";
        failed_ = true;
        break;
      }
      payloadBytes_++;
    }
    return consumed;
  }

  int available() override { return 0; }
  int read() override { return -1; }
  int peek() override { return -1; }
  void flush() override {
    if (file_) {
      file_.flush();
    }
  }

  bool finish(HakoChapterContent& outContent) {
    if (file_) {
      file_.flush();
      file_.close();
    }

    if (failed_) {
      discard();
      return false;
    }
    if (!headerDone_ || lineIndex_ != 7 || mode_ != "text" || ref_.url.empty() || payloadBytes_ == 0) {
      if (error_.empty()) {
        error_ = "Invalid raw chapter response";
      }
      discard();
      return false;
    }

    outContent = {};
    outContent.ref = ref_;
    outContent.textFilePath = destPath_;
    return true;
  }

  void discard() {
    if (file_) {
      file_.close();
    }
    if (!destPath_.empty()) {
      Storage.remove(destPath_.c_str());
    }
  }

  const std::string& error() const { return error_; }
  bool capacityExceeded() const { return capacityExceeded_; }

 private:
  bool consumeHeaderLine(const std::string& line) {
    switch (lineIndex_) {
      case 0:
        if (line != "CPCH1") {
          error_ = "Invalid raw chapter response";
          return false;
        }
        break;
      case 1:
        mode_ = line;
        if (mode_ != "text") {
          error_ = "Invalid raw chapter response";
          return false;
        }
        break;
      case 2:
        if (!line.empty()) {
          ref_.url = line;
        }
        break;
      case 3:
        if (!line.empty()) {
          ref_.title = line;
        }
        break;
      case 4:
        if (!line.empty()) {
          ref_.sectionTitle = line;
        }
        break;
      case 5:
        if (!line.empty()) {
          uint32_t parsedIndex = 0;
          for (char ch : line) {
            if (ch < '0' || ch > '9') {
              error_ = "Invalid raw chapter response";
              return false;
            }
            parsedIndex = parsedIndex * 10 + static_cast<uint32_t>(ch - '0');
          }
          ref_.index = parsedIndex;
        }
        break;
      case 6:
        if (!line.empty()) {
          error_ = "Invalid raw chapter response";
          return false;
        }
        headerDone_ = true;
        break;
      default:
        error_ = "Invalid raw chapter response";
        return false;
    }

    lineIndex_++;
    return true;
  }

  HakoChapterRef ref_;
  size_t maxBytes_ = 0;
  std::string destPath_;
  FsFile file_;
  std::string headerLine_;
  std::string mode_;
  std::string error_;
  size_t payloadBytes_ = 0;
  int lineIndex_ = 0;
  bool headerDone_ = false;
  bool failed_ = false;
  bool capacityExceeded_ = false;
};

bool parseSearchItems(const CpPluginInfo& pluginInfo, JsonVariantConst itemsValue, std::vector<HakoSearchResult>& outResults) {
  const JsonArrayConst items = itemsValue.as<JsonArrayConst>();
  if (items.isNull()) {
    return false;
  }

  outResults.clear();
  for (JsonObjectConst obj : items) {
    HakoSearchResult item;
    item.title = obj["title"] | "";
    item.url = obj["url"] | "";
    item.description = obj["description"] | "";
    item.coverUrl = buildAssetProxyUrl(pluginInfo, obj["coverUrl"] | "", item.url);
    item.homeSectionLabel = obj["homeSectionLabel"] | "";
    item.homeVolumeTitle = obj["homeVolumeTitle"] | "";
    item.homeLatestChapterTitle = obj["homeLatestChapterTitle"] | "";
    item.homeDisplaySubtitle = obj["homeDisplaySubtitle"] | "";
    if (!item.title.empty() && !item.url.empty()) {
      outResults.push_back(std::move(item));
    }
  }
  return true;
}

bool parseDetailObject(const CpPluginInfo& pluginInfo, JsonVariantConst detailValue, const std::string& requestedUrl,
                       HakoBookDetail& outDetail) {
  const JsonObjectConst obj = detailValue.as<JsonObjectConst>();
  if (obj.isNull()) {
    return false;
  }

  HakoBookDetail detail;
  detail.title = obj["title"] | "";
  detail.url = obj["url"] | requestedUrl;
  detail.author = obj["author"] | "";
  detail.coverUrl = buildAssetProxyUrl(pluginInfo, obj["coverUrl"] | "", detail.url);
  detail.descriptionHtml = obj["descriptionHtml"] | "";
  detail.latestChapterTitle = obj["latestChapterTitle"] | "";
  detail.latestChapterUrl = obj["latestChapterUrl"] | "";
  detail.ongoing = obj["ongoing"] | false;

  const JsonArrayConst genres = obj["genres"].as<JsonArrayConst>();
  if (!genres.isNull()) {
    for (JsonVariantConst genre : genres) {
      const std::string value = genre.as<std::string>();
      if (!value.empty()) {
        detail.genres.push_back(value);
      }
    }
  }

  if (detail.title.empty()) {
    return false;
  }

  outDetail = std::move(detail);
  return true;
}

std::string rewriteHtmlAssetUrls(const CpPluginInfo& pluginInfo, const std::string& baseUrl, const std::string& html) {
  if (!isServerOrigin(pluginInfo) || html.empty()) {
    return html;
  }

  std::string out;
  out.reserve(html.size() + 64);
  size_t pos = 0;
  while (pos < html.size()) {
    const size_t srcPos = html.find("src=", pos);
    if (srcPos == std::string::npos) {
      out.append(html, pos, std::string::npos);
      break;
    }

    out.append(html, pos, srcPos - pos + 4);
    const size_t valueStart = srcPos + 4;
    if (valueStart >= html.size()) {
      pos = valueStart;
      continue;
    }

    const char quote = html[valueStart];
    if (quote != '"' && quote != '\'') {
      pos = valueStart;
      continue;
    }

    out.push_back(quote);
    const size_t urlStart = valueStart + 1;
    const size_t urlEnd = html.find(quote, urlStart);
    if (urlEnd == std::string::npos) {
      out.append(html, urlStart, std::string::npos);
      break;
    }

    out += buildAssetProxyUrl(pluginInfo, html.substr(urlStart, urlEnd - urlStart), baseUrl);
    out.push_back(quote);
    pos = urlEnd + 1;
  }
  return out;
}

bool parseChapterRefs(JsonVariantConst chaptersValue, std::vector<HakoChapterRef>& outRefs) {
  const JsonArrayConst chapters = chaptersValue.as<JsonArrayConst>();
  if (chapters.isNull()) {
    return false;
  }

  outRefs.clear();
  for (JsonObjectConst obj : chapters) {
    HakoChapterRef ref;
    ref.title = obj["title"] | "";
    ref.url = obj["url"] | "";
    ref.sectionTitle = obj["sectionTitle"] | "";
    ref.index = obj["index"] | 0U;
    if (!ref.title.empty() && !ref.url.empty()) {
      outRefs.push_back(std::move(ref));
    }
  }
  return true;
}

std::string tocCacheKeyFor(const CpPluginInfo& pluginInfo, const std::string& url) {
  return canonicalProfileFor(pluginInfo) + "|" + pluginInfo.id + "|" + pluginInfo.baseUrl + "|" + url;
}

std::string detailCacheKeyFor(const CpPluginInfo& pluginInfo, const std::string& url) {
  return tocCacheKeyFor(pluginInfo, url) + "|detail";
}

std::string tocPageCacheKeyFor(const CpPluginInfo& pluginInfo, const std::string& url, int page) {
  return tocCacheKeyFor(pluginInfo, url) + "|page:" + std::to_string(page);
}

bool ensureOnlineCacheDir() {
  Storage.mkdir("/.crosspoint");
  Storage.mkdir("/.crosspoint/data");
  Storage.mkdir(ONLINE_CACHE_DIR);
  return true;
}

std::string cachePathFor(const std::string& key, const char* prefix) {
  std::ostringstream out;
  out << ONLINE_CACHE_DIR << "/" << prefix << "_" << std::hex << std::hash<std::string>{}(key) << ".bin";
  return out.str();
}

void invalidateCachePath(const std::string& path) {
  if (path.empty()) {
    return;
  }
  Storage.remove(path.c_str());
}

bool shouldPruneOnlineCacheNow() {
  static uint32_t lastPruneAtMs = 0;
  const uint32_t now = millis();
  if (lastPruneAtMs != 0 && now - lastPruneAtMs < ONLINE_CACHE_PRUNE_INTERVAL_MS) {
    return false;
  }
  lastPruneAtMs = now;
  return true;
}

void collectOnlineCacheFiles(std::vector<CacheFileInfo>& outFiles) {
  outFiles.clear();

  FsFile dir = Storage.open(ONLINE_CACHE_DIR, O_RDONLY);
  if (!dir || !dir.isDirectory()) {
    return;
  }

  dir.rewindDirectory();
  for (FsFile file = dir.openNextFile(); file; file = dir.openNextFile()) {
    if (file.isDirectory()) {
      file.close();
      continue;
    }

    char nameBuffer[96] = {};
    const size_t nameLength = file.getName(nameBuffer, sizeof(nameBuffer));
    file.close();
    if (nameLength == 0 || nameLength >= sizeof(nameBuffer)) {
      continue;
    }

    const std::string name(nameBuffer, nameLength);
    const bool removable =
        ((name.rfind("det_", 0) == 0) || (name.rfind("toc_", 0) == 0) || (name.rfind("tocp_", 0) == 0) ||
         (name.rfind("cht_", 0) == 0) || (name.rfind("rdr_", 0) == 0)) &&
        name.size() > 4 && name.rfind(".bin") == name.size() - 4;
    outFiles.push_back(CacheFileInfo{std::string(ONLINE_CACHE_DIR) + "/" + name, removable});
  }
  dir.close();
}

void pruneOnlineCacheDirIfNeeded() {
  if (!shouldPruneOnlineCacheNow()) {
    return;
  }

  std::vector<CacheFileInfo> files;
  collectOnlineCacheFiles(files);
  if (files.size() <= MAX_ONLINE_CACHE_FILES) {
    return;
  }

  std::sort(files.begin(), files.end(), [](const CacheFileInfo& left, const CacheFileInfo& right) {
    return left.path < right.path;
  });

  size_t removableCount = 0;
  for (const auto& file : files) {
    if (file.removable) {
      ++removableCount;
    }
  }
  if (removableCount == 0) {
    return;
  }

  size_t excess = files.size() - MAX_ONLINE_CACHE_FILES;
  for (const auto& file : files) {
    if (excess == 0) {
      break;
    }
    if (!file.removable) {
      continue;
    }
    Storage.remove(file.path.c_str());
    --excess;
  }
}

void writeChapterRef(FsFile& file, const HakoChapterRef& ref) {
  serialization::writeString(file, ref.title);
  serialization::writeString(file, ref.url);
  serialization::writeString(file, ref.sectionTitle);
  serialization::writePod(file, ref.index);
}

bool readChapterRef(FsFile& file, HakoChapterRef& ref) {
  if (!file || !file.available()) {
    return false;
  }
  serialization::readString(file, ref.title);
  serialization::readString(file, ref.url);
  serialization::readString(file, ref.sectionTitle);
  serialization::readPod(file, ref.index);
  return true;
}

bool tryReadCachedDetail(const std::string& key, HakoBookDetail& outDetail) {
  const std::string path = cachePathFor(key, "det");
  FsFile file;
  if (!Storage.openFileForRead("OSB", path.c_str(), file)) {
    return false;
  }

  uint32_t magic = 0;
  uint16_t version = 0;
  std::string storedKey;
  uint32_t genreCount = 0;
  serialization::readPod(file, magic);
  serialization::readPod(file, version);
  serialization::readString(file, storedKey);
  if (magic != DETAIL_CACHE_FILE_MAGIC || version != DETAIL_CACHE_FILE_VERSION || storedKey != key) {
    file.close();
    invalidateCachePath(path);
    return false;
  }

  HakoBookDetail detail;
  serialization::readString(file, detail.title);
  serialization::readString(file, detail.url);
  serialization::readString(file, detail.author);
  serialization::readString(file, detail.coverUrl);
  serialization::readString(file, detail.descriptionHtml);
  serialization::readString(file, detail.latestChapterUrl);
  serialization::readString(file, detail.latestChapterTitle);
  serialization::readPod(file, detail.ongoing);
  serialization::readPod(file, genreCount);
  if (genreCount > 32) {
    file.close();
    invalidateCachePath(path);
    return false;
  }
  detail.genres.clear();
  detail.genres.reserve(genreCount);
  for (uint32_t i = 0; i < genreCount; ++i) {
    std::string genre;
    serialization::readString(file, genre);
    detail.genres.push_back(std::move(genre));
  }
  file.close();
  if (detail.title.empty() || detail.url.empty()) {
    invalidateCachePath(path);
    return false;
  }
  outDetail = std::move(detail);
  return true;
}

void writeCachedDetail(const std::string& key, const HakoBookDetail& detail) {
  if (detail.title.empty() || detail.url.empty()) {
    return;
  }

  ensureOnlineCacheDir();
  FsFile file;
  if (!Storage.openFileForWrite("OSB", cachePathFor(key, "det").c_str(), file)) {
    return;
  }

  serialization::writePod(file, DETAIL_CACHE_FILE_MAGIC);
  serialization::writePod(file, DETAIL_CACHE_FILE_VERSION);
  serialization::writeString(file, key);
  serialization::writeString(file, detail.title);
  serialization::writeString(file, detail.url);
  serialization::writeString(file, detail.author);
  serialization::writeString(file, detail.coverUrl);
  serialization::writeString(file, detail.descriptionHtml);
  serialization::writeString(file, detail.latestChapterUrl);
  serialization::writeString(file, detail.latestChapterTitle);
  serialization::writePod(file, detail.ongoing);
  const uint32_t genreCount = static_cast<uint32_t>(detail.genres.size());
  serialization::writePod(file, genreCount);
  for (const auto& genre : detail.genres) {
    serialization::writeString(file, genre);
  }
  file.flush();
  file.close();
  pruneOnlineCacheDirIfNeeded();
}

bool tryReadCachedToc(const std::string& key, std::vector<HakoChapterRef>& outToc) {
  const std::string path = cachePathFor(key, "toc");
  FsFile file;
  if (!Storage.openFileForRead("OSB", path.c_str(), file)) {
    return false;
  }

  uint32_t magic = 0;
  uint16_t version = 0;
  std::string storedKey;
  uint32_t count = 0;
  serialization::readPod(file, magic);
  serialization::readPod(file, version);
  serialization::readString(file, storedKey);
  serialization::readPod(file, count);
  if (magic != TOC_CACHE_FILE_MAGIC || version != TOC_CACHE_FILE_VERSION || storedKey != key ||
      count == 0 || count > MAX_TOC_CACHE_CHAPTERS) {
    file.close();
    invalidateCachePath(path);
    return false;
  }

  outToc.clear();
  outToc.reserve(count);
  for (uint32_t i = 0; i < count; ++i) {
    HakoChapterRef ref;
    if (!readChapterRef(file, ref)) {
      outToc.clear();
      file.close();
      invalidateCachePath(path);
      return false;
    }
    outToc.push_back(std::move(ref));
  }
  file.close();
  return !outToc.empty();
}

void writeCachedToc(const std::string& key, const std::vector<HakoChapterRef>& toc) {
  if (toc.empty() || toc.size() > MAX_TOC_CACHE_CHAPTERS) {
    return;
  }

  ensureOnlineCacheDir();
  FsFile file;
  if (!Storage.openFileForWrite("OSB", cachePathFor(key, "toc").c_str(), file)) {
    return;
  }

  serialization::writePod(file, TOC_CACHE_FILE_MAGIC);
  serialization::writePod(file, TOC_CACHE_FILE_VERSION);
  serialization::writeString(file, key);
  serialization::writePod(file, static_cast<uint32_t>(toc.size()));
  for (const auto& ref : toc) {
    writeChapterRef(file, ref);
  }
  file.close();
  pruneOnlineCacheDirIfNeeded();
}

bool tryReadCachedTocPage(const std::string& key, TocPageResult& outPage) {
  const std::string path = cachePathFor(key, "tocp");
  FsFile file;
  if (!Storage.openFileForRead("OSB", path.c_str(), file)) {
    return false;
  }

  uint32_t magic = 0;
  uint16_t version = 0;
  std::string storedKey;
  uint32_t count = 0;
  serialization::readPod(file, magic);
  serialization::readPod(file, version);
  serialization::readString(file, storedKey);
  serialization::readPod(file, outPage.page);
  serialization::readPod(file, outPage.totalPages);
  serialization::readPod(file, count);
  if (magic != TOC_PAGE_CACHE_FILE_MAGIC || version != TOC_CACHE_FILE_VERSION || storedKey != key ||
      count == 0 || count > MAX_TOC_PAGE_CACHE_CHAPTERS) {
    file.close();
    invalidateCachePath(path);
    return false;
  }

  outPage.chapters.clear();
  outPage.chapters.reserve(count);
  for (uint32_t i = 0; i < count; ++i) {
    HakoChapterRef ref;
    if (!readChapterRef(file, ref)) {
      outPage = {};
      file.close();
      invalidateCachePath(path);
      return false;
    }
    outPage.chapters.push_back(std::move(ref));
  }
  file.close();
  return !outPage.chapters.empty();
}

void writeCachedTocPage(const std::string& key, const TocPageResult& page) {
  if (page.chapters.empty() || page.chapters.size() > MAX_TOC_PAGE_CACHE_CHAPTERS) {
    return;
  }

  ensureOnlineCacheDir();
  FsFile file;
  if (!Storage.openFileForWrite("OSB", cachePathFor(key, "tocp").c_str(), file)) {
    return;
  }

  serialization::writePod(file, TOC_PAGE_CACHE_FILE_MAGIC);
  serialization::writePod(file, TOC_CACHE_FILE_VERSION);
  serialization::writeString(file, key);
  serialization::writePod(file, page.page);
  serialization::writePod(file, page.totalPages);
  serialization::writePod(file, static_cast<uint32_t>(page.chapters.size()));
  for (const auto& ref : page.chapters) {
    writeChapterRef(file, ref);
  }
  file.close();
  pruneOnlineCacheDirIfNeeded();
}

bool fetchTocIncrementally(const CpPluginInfo& pluginInfo, const std::string& url, std::vector<HakoChapterRef>& outToc) {
  TocPageResult firstPage;
  if (!fetchTocPage(pluginInfo, url, 1, firstPage) || firstPage.chapters.empty()) {
    return false;
  }

  outToc = firstPage.chapters;
  const int totalPages = std::max(1, firstPage.totalPages);
  for (int page = 2; page <= totalPages; ++page) {
    TocPageResult currentPage;
    if (!fetchTocPage(pluginInfo, url, page, currentPage) || currentPage.chapters.empty()) {
      return false;
    }
    outToc.insert(outToc.end(), currentPage.chapters.begin(), currentPage.chapters.end());
  }

  if (outToc.empty()) {
    return false;
  }

  for (size_t index = 0; index < outToc.size(); ++index) {
    outToc[index].index = static_cast<uint32_t>(index + 1);
  }
  return true;
}
}

bool supportsNativeUi(const CpPluginInfo& pluginInfo) { return isServerOrigin(pluginInfo); }

bool supportsBackgroundDownloads(const CpPluginInfo& pluginInfo) {
  return isServerOrigin(pluginInfo) && isHakoLike(pluginInfo);
}

bool supportsTrackedUpdates(const CpPluginInfo& pluginInfo) {
  return isServerOrigin(pluginInfo) && pluginInfo.supportsTrackedUpdates;
}

bool supportsPagedToc(const CpPluginInfo& pluginInfo) {
  return supportsIncrementalTocFetch(pluginInfo);
}

std::string runtimeProfileFor(const CpPluginInfo& pluginInfo) { return canonicalProfileFor(pluginInfo); }

const std::string& getLastError() { return g_lastError; }

std::string buildAssetProxyUrl(const CpPluginInfo& pluginInfo, const std::string& assetUrl, const std::string& baseUrl) {
  if (assetUrl.empty()) {
    return "";
  }
  if (assetUrl.rfind("data:", 0) == 0 || assetUrl.rfind("blob:", 0) == 0 || assetUrl.rfind("javascript:", 0) == 0) {
    return assetUrl;
  }

  std::string resolvedUrl = assetUrl;
  if (isServerAssetProxyUrl(resolvedUrl)) {
    const std::string upstreamUrl = extractProxiedAssetTarget(resolvedUrl);
    if (!upstreamUrl.empty()) {
      resolvedUrl = upstreamUrl;
    }
  } else {
    resolvedUrl = resolveAbsoluteUrl(assetUrl, baseUrl);
  }

  if (!isServerOrigin(pluginInfo)) {
    return resolvedUrl;
  }

  const std::string serverBaseUrl = preferredServerBaseUrlFor(pluginInfo);
  if (serverBaseUrl.empty()) {
    return resolvedUrl;
  }

  return buildServerApiUrlForBaseUrl(serverBaseUrl, pluginInfo, "asset", {{"url", resolvedUrl}});
}

void buildFallbackSourceCatalog(std::vector<CpPluginInfo>& outSources) {
  outSources.clear();
  outSources.reserve(2);
  outSources.push_back(makeFallbackPluginInfo("hako", "hako"));
  outSources.push_back(makeFallbackPluginInfo("truyenfull", "truyenfull"));
}

bool fetchSourceCatalog(std::vector<CpPluginInfo>& outSources) {
  std::string lastError = "Server request failed";
  for (const auto& baseUrl : buildServerBaseUrlCandidates(makeFallbackPluginInfo("hako", "hako"))) {
    if (tryParseSourceCatalogOnce(baseUrl, outSources, lastError)) {
      return true;
    }
  }
  setLastError(lastError);
  return false;
}

void clearMemoryCaches() {}

CpPluginInfo makeFallbackPluginInfo(const std::string& pluginId, const std::string& runtimeProfile) {
  CpPluginInfo info;
  info.id = PluginStore::canonicalizePluginId(pluginId, runtimeProfile);
  info.runtimeProfile = PluginStore::canonicalizeRuntimeProfile(info.id.empty() ? pluginId : info.id, runtimeProfile);
  info.runtimeMode = info.runtimeProfile.empty() ? std::string("native") : std::string("adapter");
  if (info.runtimeProfile.empty()) {
    if (info.id == "hako") info.runtimeProfile = "hako";
    if (info.id == "truyenfull") info.runtimeProfile = "truyenfull";
  }
  if (info.runtimeProfile == "hako") {
    info.runtimeMode = "adapter";
    info.runtimeOrigin = "server";
    info.name = "Hako";
    info.baseUrl = DEFAULT_ONLINE_LIBRARY_BASE_URL;
    info.supportsSearch = true;
    info.supportsTrackedUpdates = true;
  } else if (info.runtimeProfile == "truyenfull") {
    info.runtimeMode = "adapter";
    info.runtimeOrigin = "server";
    info.name = "Truyen Full";
    info.baseUrl = DEFAULT_ONLINE_LIBRARY_BASE_URL;
    info.supportsSearch = true;
    info.supportsTrackedUpdates = false;
  } else {
    info.name = info.id.empty() ? pluginId : info.id;
  }
  return info;
}

bool fetchHomeFeed(const CpPluginInfo& pluginInfo, std::vector<HakoSearchResult>& outResults) {
  clearLastError();
  if (!isServerOrigin(pluginInfo)) {
    setLastError(sourceError(pluginInfo, "Server source required"));
    return false;
  }

  std::string body;
  JsonDocument doc;
  if (!parseServerJson(pluginInfo, "home", {}, SERVER_HOME_CAP_BYTES, body, doc)) {
    return false;
  }
  if (!parseSearchItems(pluginInfo, doc["items"], outResults) || outResults.empty()) {
    setLastError(normalizeSourceError(pluginInfo, "Source feed parse failed", "Source feed parse failed"));
    return false;
  }
  return true;
}

bool search(const CpPluginInfo& pluginInfo, const std::string& query, int page, std::vector<HakoSearchResult>& outResults) {
  clearLastError();
  if (!isServerOrigin(pluginInfo)) {
    setLastError(sourceError(pluginInfo, "Server source required"));
    return false;
  }

  const int safePage = page < 1 ? 1 : page;
  std::string body;
  JsonDocument doc;
  if (!parseServerJson(pluginInfo, "search", {{"query", query}, {"page", std::to_string(safePage)}},
                       SERVER_SEARCH_CAP_BYTES, body, doc)) {
    return false;
  }
  if (!parseSearchItems(pluginInfo, doc["items"], outResults)) {
    setLastError(normalizeSourceError(pluginInfo, "Search request failed", "Search request failed"));
    return false;
  }
  return true;
}

bool fetchDetail(const CpPluginInfo& pluginInfo, const std::string& url, HakoBookDetail& outDetail) {
  clearLastError();
  const std::string cacheKey = detailCacheKeyFor(pluginInfo, url);
  if (tryReadCachedDetail(cacheKey, outDetail)) {
    outDetail.coverUrl = buildAssetProxyUrl(pluginInfo, outDetail.coverUrl, outDetail.url);
    return true;
  }

  if (!isServerOrigin(pluginInfo)) {
    setLastError(sourceError(pluginInfo, "Server source required"));
    return false;
  }

  std::string body;
  JsonDocument doc;
  if (!parseServerJson(pluginInfo, "detail", {{"url", url}}, SERVER_DETAIL_CAP_BYTES, body, doc)) {
    return false;
  }
  if (!parseDetailObject(pluginInfo, doc.as<JsonVariantConst>(), url, outDetail)) {
    setLastError(normalizeSourceError(pluginInfo, "Book detail parse failed", "Book detail parse failed"));
    return false;
  }
  writeCachedDetail(cacheKey, outDetail);
  return true;
}

bool fetchTocPage(const CpPluginInfo& pluginInfo, const std::string& url, int page, TocPageResult& outPage) {
  clearLastError();
  const int safePage = page < 1 ? 1 : page;
  const std::string cacheKey = tocPageCacheKeyFor(pluginInfo, url, safePage);
  if (tryReadCachedTocPage(cacheKey, outPage)) {
    return true;
  }

  outPage = {};
  outPage.page = safePage;
  outPage.totalPages = 1;

  if (!isServerOrigin(pluginInfo)) {
    setLastError(sourceError(pluginInfo, "Server source required"));
    return false;
  }

  std::string body;
  JsonDocument doc;
  if (!parseServerJson(pluginInfo, "toc-page", {{"url", url}, {"page", std::to_string(safePage)}},
                       SERVER_TOC_PAGE_CAP_BYTES, body, doc)) {
    return false;
  }
  if (!parseChapterRefs(doc["chapters"], outPage.chapters) || outPage.chapters.empty()) {
    setLastError(normalizeSourceError(pluginInfo, "Chapter list parse failed", "Chapter list parse failed"));
    return false;
  }
  outPage.page = doc["page"] | safePage;
  outPage.totalPages = doc["totalPages"] | 1;
  if (outPage.totalPages < 1) {
    outPage.totalPages = 1;
  }
  writeCachedTocPage(cacheKey, outPage);
  return true;
}

bool fetchToc(const CpPluginInfo& pluginInfo, const std::string& url, std::vector<HakoChapterRef>& outToc) {
  clearLastError();
  const std::string cacheKey = tocCacheKeyFor(pluginInfo, url);
  if (tryReadCachedToc(cacheKey, outToc)) {
    return true;
  }

  if (!isServerOrigin(pluginInfo)) {
    setLastError(sourceError(pluginInfo, "Server source required"));
    return false;
  }

  if (supportsIncrementalTocFetch(pluginInfo) && fetchTocIncrementally(pluginInfo, url, outToc)) {
    writeCachedToc(cacheKey, outToc);
    return true;
  }

  const std::string incrementalError = g_lastError;
  std::string body;
  JsonDocument doc;
  if (!parseServerJson(pluginInfo, "toc", {{"url", url}}, SERVER_TOC_CAP_BYTES, body, doc)) {
    if (!incrementalError.empty()) {
      setLastError(incrementalError);
    }
    return false;
  }

  if (!parseChapterRefs(doc["chapters"], outToc) || outToc.empty()) {
    if (!incrementalError.empty()) {
      setLastError(incrementalError);
    } else {
      setLastError(normalizeSourceError(pluginInfo, "Chapter list parse failed", "Chapter list parse failed"));
    }
    return false;
  }

  writeCachedToc(cacheKey, outToc);
  return true;
}

bool fetchChapter(const CpPluginInfo& pluginInfo, const HakoChapterRef& ref, HakoChapterContent& outContent,
                  bool includePlainText) {
  clearLastError();
  if (!isServerOrigin(pluginInfo)) {
    setLastError(sourceError(pluginInfo, "Server source required"));
    return false;
  }

  const size_t capBytes = includePlainText ? SERVER_CHAPTER_TEXT_CAP_BYTES : SERVER_CHAPTER_HTML_CAP_BYTES;
  const std::vector<std::pair<std::string, std::string>> params = {{"url", ref.url},
                                                                   {"title", ref.title},
                                                                   {"index", std::to_string(ref.index)},
                                                                   {"sectionTitle", ref.sectionTitle},
                                                                   {"text", includePlainText ? "1" : "0"},
                                                                   {"html", includePlainText ? "0" : "1"}}; 
  std::string body;
  JsonDocument doc;
  if (parseServerJson(pluginInfo, "chapter", params, capBytes, body, doc)) {
    outContent = {};
    outContent.ref = ref;
    JsonObjectConst refObj = doc["ref"].as<JsonObjectConst>();
    if (!refObj.isNull()) {
      outContent.ref.title = refObj["title"] | outContent.ref.title;
      outContent.ref.url = refObj["url"] | outContent.ref.url;
      outContent.ref.sectionTitle = refObj["sectionTitle"] | outContent.ref.sectionTitle;
      outContent.ref.index = refObj["index"] | outContent.ref.index;
    }
    outContent.html = rewriteHtmlAssetUrls(pluginInfo, outContent.ref.url, doc["html"] | "");
    outContent.text = doc["text"] | "";
    if (!includePlainText) {
      outContent.text.clear();
    }
    if (!outContent.ref.url.empty() && (!outContent.html.empty() || !outContent.text.empty())) {
      return true;
    }
    setLastError(normalizeSourceError(pluginInfo, "Chapter parse failed", "Chapter parse failed"));
    if (!includePlainText) {
      return false;
    }
  } else if (!includePlainText) {
    return false;
  }

  const std::string jsonError = g_lastError;
  const std::string wireUrl = buildServerApiUrl(pluginInfo, "chapter",
                                                {{"url", ref.url},
                                                 {"title", ref.title},
                                                 {"index", std::to_string(ref.index)},
                                                 {"sectionTitle", ref.sectionTitle},
                                                 {"text", "1"},
                                                 {"html", "0"},
                                                 {"format", "raw"}});
  const std::string rawCachePath = cachePathFor(canonicalProfileFor(pluginInfo) + "|" + ref.url + "|chapter", "cht");
  RawChapterTextFileStream rawStream(ref, SERVER_CHAPTER_TEXT_FILE_CAP_BYTES, rawCachePath);
  if (!rawStream.begin()) {
    if (!jsonError.empty()) {
      setLastError(jsonError);
    }
    return false;
  }

  if (HttpDownloader::fetchUrl(wireUrl, rawStream) && rawStream.finish(outContent)) {
    outContent.html = rewriteHtmlAssetUrls(pluginInfo, outContent.ref.url, outContent.html);
    return true;
  }

  const std::string rawError = rawStream.error();
  rawStream.discard();
  if (rawStream.capacityExceeded()) {
    setLastError(normalizeSourceError(pluginInfo, rawError, "Chapter parse failed"));
    return false;
  }

  if (!jsonError.empty()) {
    setLastError(jsonError);
  } else {
    setLastError(normalizeSourceError(pluginInfo, rawError, "Chapter parse failed"));
  }
  return false;
}

bool refreshTrackedSeries(const CpPluginInfo& pluginInfo, const TrackedSeriesInfo& trackedItem, TrackedSeriesInfo& outUpdated,
                          uint32_t& outNewChapterCount, std::string& outMessage) {
  outUpdated = trackedItem;
  outNewChapterCount = 0;
  outMessage.clear();

  HakoBookDetail detail;
  std::vector<HakoChapterRef> chapters;
  if (!fetchDetail(pluginInfo, trackedItem.seriesUrl, detail) || !fetchToc(pluginInfo, trackedItem.seriesUrl, chapters)) {
    outMessage = "Failed to load series";
    return false;
  }

  outUpdated = makeTrackedInfo(pluginInfo, detail, chapters, &trackedItem);
  if (!trackedItem.lastChapterUrl.empty() && trackedItem.lastChapterUrl != outUpdated.lastChapterUrl) {
    int oldIndex = -1;
    for (size_t i = 0; i < chapters.size(); ++i) {
      if (chapters[i].url == trackedItem.lastChapterUrl) {
        oldIndex = static_cast<int>(i);
        break;
      }
    }
    outNewChapterCount = oldIndex >= 0 ? static_cast<uint32_t>(chapters.size() - static_cast<size_t>(oldIndex + 1))
                                       : static_cast<uint32_t>(chapters.size());
  } else if (outUpdated.chapterCount > trackedItem.chapterCount) {
    outNewChapterCount = outUpdated.chapterCount - trackedItem.chapterCount;
  }

  if (outNewChapterCount > 0) {
    outMessage = std::to_string(outNewChapterCount) + " new chapter(s)";
  } else {
    outMessage = "Already current";
  }
  return true;
}

TrackedSeriesInfo makeTrackedInfo(const CpPluginInfo& pluginInfo, const HakoBookDetail& detail,
                                  const std::vector<HakoChapterRef>& chapters, const TrackedSeriesInfo* existing) {
  auto applyLatestFallback = [&detail](TrackedSeriesInfo& info) {
    if (info.lastChapterUrl.empty() && !detail.latestChapterUrl.empty()) {
      info.lastChapterUrl = detail.latestChapterUrl;
    }
    if (info.lastChapterTitle.empty() && !detail.latestChapterTitle.empty()) {
      info.lastChapterTitle = detail.latestChapterTitle;
    }
  };

  if (isHakoLike(pluginInfo)) {
    TrackedSeriesInfo info = HakoEpubService::makeTrackedInfo(pluginInfo, detail, chapters, existing);
    applyLatestFallback(info);
    return info;
  }

  TrackedSeriesInfo info;
  if (existing != nullptr) {
    info = *existing;
  }
  info.pluginId = pluginInfo.id;
  info.runtimeProfile = runtimeProfileFor(pluginInfo);
  info.title = detail.title;
  info.author = detail.author;
  info.seriesUrl = detail.url;
  info.coverUrl = buildAssetProxyUrl(pluginInfo, detail.coverUrl, detail.url);
  info.chapterCount = static_cast<uint32_t>(chapters.size());
  if (!chapters.empty()) {
    info.lastChapterUrl = chapters.back().url;
    info.lastChapterTitle = chapters.back().title;
  }
  applyLatestFallback(info);
  return info;
}

}  // namespace OnlineSourceBridge
