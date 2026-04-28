#include "OnlineLibrarySettingsStore.h"

#include <ArduinoJson.h>
#include <HalStorage.h>
#include <Logging.h>

namespace {
constexpr char SETTINGS_FILE[] = "/.crosspoint/data/online_library_settings.json";

uint32_t clampValue(uint32_t value, uint32_t minValue, uint32_t maxValue) {
  if (value < minValue) return minValue;
  if (value > maxValue) return maxValue;
  return value;
}
}  // namespace

OnlineLibrarySettingsStore OnlineLibrarySettingsStore::instance;

bool OnlineLibrarySettingsStore::loadFromDisk() {
  settings = OnlineLibrarySettings{};

  Storage.mkdir("/.crosspoint");
  Storage.mkdir("/.crosspoint/data");
  if (!Storage.exists(SETTINGS_FILE)) {
    return true;
  }

  const String json = Storage.readFile(SETTINGS_FILE);
  if (json.isEmpty()) {
    return true;
  }

  JsonDocument doc;
  const auto error = deserializeJson(doc, json.c_str());
  if (error) {
    LOG_ERR("OLS", "Failed to parse online library settings: %s", error.c_str());
    return false;
  }

  settings.maxJobRetries = clampValue(doc["maxJobRetries"] | settings.maxJobRetries, 0, 10);
  settings.jobRetryBaseDelaySec = clampValue(doc["jobRetryBaseDelaySec"] | settings.jobRetryBaseDelaySec, 5, 3600);
  settings.jobRetryBackoffPercent = clampValue(doc["jobRetryBackoffPercent"] | settings.jobRetryBackoffPercent, 100, 1000);
  settings.chapterRetryCount = clampValue(doc["chapterRetryCount"] | settings.chapterRetryCount, 0, 10);
  settings.chapterRetryDelaySec = clampValue(doc["chapterRetryDelaySec"] | settings.chapterRetryDelaySec, 1, 600);
  return true;
}

bool OnlineLibrarySettingsStore::saveToDisk() const {
  Storage.mkdir("/.crosspoint");
  Storage.mkdir("/.crosspoint/data");

  JsonDocument doc;
  doc["maxJobRetries"] = settings.maxJobRetries;
  doc["jobRetryBaseDelaySec"] = settings.jobRetryBaseDelaySec;
  doc["jobRetryBackoffPercent"] = settings.jobRetryBackoffPercent;
  doc["chapterRetryCount"] = settings.chapterRetryCount;
  doc["chapterRetryDelaySec"] = settings.chapterRetryDelaySec;

  String json;
  serializeJson(doc, json);
  if (!Storage.writeFile(SETTINGS_FILE, json)) {
    LOG_ERR("OLS", "Failed to write online library settings");
    return false;
  }
  return true;
}
