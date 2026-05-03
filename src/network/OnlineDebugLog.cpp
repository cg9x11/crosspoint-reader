#include "OnlineDebugLog.h"

#include <Arduino.h>
#include <HalStorage.h>
#include <Logging.h>
#include <esp_heap_caps.h>

#include <algorithm>
#include <string>

namespace OnlineDebugLog {

namespace {
constexpr char MODULE[] = "ODL";
constexpr char LOG_PATH[] = "/online-debug.log";
constexpr char VERBOSE_FLAG_ROOT[] = "/online-debug.on";
constexpr char VERBOSE_FLAG_HIDDEN[] = "/.crosspoint/online-debug.on";
constexpr size_t MAX_LOG_BYTES = 16 * 1024;
constexpr size_t MAX_COMPACT_SNIPPET_CHARS = 120;
constexpr size_t MAX_VERBOSE_SNIPPET_CHARS = 384;
constexpr uint32_t VERBOSE_FLAG_REFRESH_MS = 5000;

struct VerboseFlagCache {
  uint32_t checkedAtMs = 0;
  bool enabled = false;
};

VerboseFlagCache g_verboseFlagCache;

std::string sanitizeSnippet(const std::string& text, size_t maxChars) {
  const size_t copyLen = std::min(text.size(), maxChars);
  std::string snippet = text.substr(0, copyLen);
  for (char& ch : snippet) {
    const unsigned char value = static_cast<unsigned char>(ch);
    if ((value < 32 && ch != '\n' && ch != '\t') || value == 127) {
      ch = ' ';
    }
  }
  if (text.size() > maxChars) {
    snippet += "\n...[truncated]";
  }
  return snippet;
}

std::string compactField(std::string value, size_t maxChars) {
  for (char& ch : value) {
    const unsigned char code = static_cast<unsigned char>(ch);
    if ((code < 32 && ch != ' ') || code == 127) {
      ch = ' ';
    }
  }
  if (value.size() > maxChars) {
    value.resize(maxChars);
    while (!value.empty() && value.back() == ' ') {
      value.pop_back();
    }
    value += "...";
  }
  return value;
}

std::string heapSummary() {
  return "heap=" + std::to_string(ESP.getFreeHeap()) +
         ", largest=" + std::to_string(heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
}

bool storageReady() {
  if (!Storage.begin()) {
    LOG_ERR(MODULE, "Storage.begin failed");
    return false;
  }
  return true;
}

bool fileExists(const char* path) {
  return Storage.exists(path);
}

bool readVerboseFlagUncached() { return fileExists(VERBOSE_FLAG_ROOT) || fileExists(VERBOSE_FLAG_HIDDEN); }

void rotateIfNeeded() {
  auto file = Storage.open(LOG_PATH, O_RDONLY);
  if (!file) {
    return;
  }
  const uint32_t size = file.size();
  file.close();
  if (size >= MAX_LOG_BYTES) {
    Storage.remove(LOG_PATH);
  }
}

bool appendRecord(const std::string& record) {
  if (!storageReady()) {
    return false;
  }

  rotateIfNeeded();
  auto file = Storage.open(LOG_PATH, O_RDWR | O_CREAT);
  if (!file) {
    LOG_ERR(MODULE, "Failed to open log file");
    return false;
  }

  const uint32_t endPos = file.size();
  if (!file.seek(endPos)) {
    LOG_ERR(MODULE, "Failed to seek log file");
    file.close();
    return false;
  }

  const size_t written = file.write(reinterpret_cast<const uint8_t*>(record.data()), record.size());
  file.flush();
  file.close();
  if (written != record.size()) {
    LOG_ERR(MODULE, "Failed to append log file (%u/%u bytes)", static_cast<unsigned>(written),
            static_cast<unsigned>(record.size()));
    return false;
  }
  return true;
}

std::string prefix(const char* kind) {
  return "\n=== " + std::string(kind) + " @" + std::to_string(millis()) + "ms ===\n";
}

bool shouldRefreshVerboseFlag() {
  const uint32_t now = millis();
  return g_verboseFlagCache.checkedAtMs == 0 || (now - g_verboseFlagCache.checkedAtMs) >= VERBOSE_FLAG_REFRESH_MS;
}

bool includeVerboseBody() { return isVerboseEnabled(); }

void appendStandardFields(std::string& record, const std::string& url) {
  record += "URL: " + compactField(url, 180) + "\n";
  record += "MEM: " + heapSummary() + "\n";
}
}  // namespace

bool isVerboseEnabled() {
  if (shouldRefreshVerboseFlag()) {
    g_verboseFlagCache.enabled = storageReady() && readVerboseFlagUncached();
    g_verboseFlagCache.checkedAtMs = millis();
  }
  return g_verboseFlagCache.enabled;
}

void logProbe(const char* tag, const std::string& message) {
  if (!isVerboseEnabled()) {
    return;
  }

  std::string record = prefix("PROBE");
  record += "TAG: " + compactField(tag ? std::string(tag) : std::string("-"), 64) + "\n";
  if (!message.empty()) {
    record += "MESSAGE: " + sanitizeSnippet(message, MAX_COMPACT_SNIPPET_CHARS) + "\n";
  }
  record += "MEM: " + heapSummary() + "\n";
  appendRecord(record);
}

void logHttpSuccess(const std::string& url, int httpCode, const std::string& body) {
  if (!isVerboseEnabled()) {
    return;
  }

  std::string record = prefix("HTTP OK");
  appendStandardFields(record, url);
  record += "CODE: " + std::to_string(httpCode) + "\n";
  record += "BYTES: " + std::to_string(body.size()) + "\n";
  if (!body.empty()) {
    record += "BODY:\n" + sanitizeSnippet(body, MAX_VERBOSE_SNIPPET_CHARS) + "\n";
  }
  appendRecord(record);
}

void logHttpFailure(const std::string& url, int httpCode, const std::string& errorMessage, const std::string& body) {
  std::string record = prefix("HTTP FAIL");
  appendStandardFields(record, url);
  record += "CODE: " + std::to_string(httpCode) + "\n";
  record += "ERROR: " + compactField(errorMessage, 160) + "\n";
  if (!body.empty()) {
    const size_t snippetChars = includeVerboseBody() ? MAX_VERBOSE_SNIPPET_CHARS : MAX_COMPACT_SNIPPET_CHARS;
    record += "BODY:\n" + sanitizeSnippet(body, snippetChars) + "\n";
  }
  appendRecord(record);
}

void logParserFailure(const char* source, const char* stage, const std::string& url, const std::string& reason,
                      const std::string& html) {
  std::string record = prefix("PARSER FAIL");
  record += "SOURCE: " + compactField(source ? std::string(source) : std::string("-"), 48) + "\n";
  record += "STAGE: " + compactField(stage ? std::string(stage) : std::string("-"), 48) + "\n";
  appendStandardFields(record, url);
  record += "REASON: " + compactField(reason, 160) + "\n";
  if (!html.empty()) {
    const size_t snippetChars = includeVerboseBody() ? MAX_VERBOSE_SNIPPET_CHARS : MAX_COMPACT_SNIPPET_CHARS;
    record += "HTML:\n" + sanitizeSnippet(html, snippetChars) + "\n";
  }
  appendRecord(record);
}

}  // namespace OnlineDebugLog
