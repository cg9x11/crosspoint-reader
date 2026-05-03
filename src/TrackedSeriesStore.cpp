#include "TrackedSeriesStore.h"

#include <ArduinoJson.h>
#include <HalStorage.h>
#include <Logging.h>

#include <algorithm>
#include <cctype>
#include <sstream>

#include "PluginStore.h"

TrackedSeriesStore TrackedSeriesStore::instance;

namespace {
constexpr char TRACKED_SERIES_FILE[] = "/.crosspoint/data/tracked_series.json";
constexpr char TRACKED_SERIES_TMP_FILE[] = "/.crosspoint/data/tracked_series.tmp";
constexpr char LEGACY_TRACKED_SERIES_FILE[] = "/.crosspoint/plugins/tracked_series.json";
constexpr uint32_t STORE_VERSION = 2;

void skipUtf8Bom(FsFile& file) {
  const int first = file.read();
  if (first < 0) {
    return;
  }
  if (first != 0xEF) {
    file.seek(0);
    return;
  }

  const int second = file.read();
  const int third = file.read();
  if (second == 0xBB && third == 0xBF) {
    return;
  }
  file.seek(0);
}

template <typename TObject>
std::string readStringField(TObject obj, const char* shortKey, const char* legacyKey) {
  if (obj[shortKey].template is<const char*>()) {
    return obj[shortKey].template as<std::string>();
  }
  return obj[legacyKey] | std::string("");
}

template <typename TObject>
uint32_t readUIntField(TObject obj, const char* shortKey, const char* legacyKey) {
  if (!obj[shortKey].isNull()) {
    return obj[shortKey] | static_cast<uint32_t>(0);
  }
  return obj[legacyKey] | static_cast<uint32_t>(0);
}

bool isSafeId(const std::string& id) {
  if (id.empty()) {
    return false;
  }
  for (char ch : id) {
    const bool ok = std::isalnum(static_cast<unsigned char>(ch)) || ch == '_' || ch == '-';
    if (!ok) {
      return false;
    }
  }
  return true;
}

std::string buildTrackedSeriesId(const std::string& pluginId, const std::string& seriesUrl) {
  const size_t hash = std::hash<std::string>{}(pluginId + "|" + seriesUrl);
  std::ostringstream out;
  out << pluginId << "-" << std::hex << hash;
  return out.str();
}

bool normalizeTrackedSeriesIdentity(TrackedSeriesInfo& item) {
  const std::string canonicalPluginId = PluginStore::canonicalizePluginId(item.pluginId, item.runtimeProfile);
  const std::string canonicalRuntimeProfile =
      PluginStore::canonicalizeRuntimeProfile(canonicalPluginId.empty() ? item.pluginId : canonicalPluginId, item.runtimeProfile);
  const bool changed = canonicalPluginId != item.pluginId || canonicalRuntimeProfile != item.runtimeProfile;
  if (!canonicalPluginId.empty()) {
    item.pluginId = canonicalPluginId;
  }
  item.runtimeProfile = canonicalRuntimeProfile;
  return changed;
}
}  // namespace

bool TrackedSeriesStore::loadFromDisk() {
  items.clear();
  loaded = false;
  Storage.mkdir("/.crosspoint");
  Storage.mkdir("/.crosspoint/data");

  const char* sourcePath = TRACKED_SERIES_FILE;
  if (!Storage.exists(sourcePath) && Storage.exists(LEGACY_TRACKED_SERIES_FILE)) {
    sourcePath = LEGACY_TRACKED_SERIES_FILE;
  }

  if (!Storage.exists(sourcePath)) {
    loaded = true;
    return true;
  }

  FsFile file;
  if (!Storage.openFileForRead("TRK", sourcePath, file)) {
    return false;
  }
  if (!file || file.size() == 0) {
    file.close();
    loaded = true;
    return true;
  }

  skipUtf8Bom(file);
  JsonDocument doc;
  const auto error = deserializeJson(doc, file);
  file.close();
  if (error) {
    LOG_ERR("TRK", "Failed to parse tracked series store: %s", error.c_str());
    return false;
  }

  JsonArray tracked = doc["i"].is<JsonArray>() ? doc["i"].as<JsonArray>() : doc["items"].as<JsonArray>();
  items.reserve(tracked.size());
  bool migrated = sourcePath != TRACKED_SERIES_FILE;
  for (JsonObject obj : tracked) {
    TrackedSeriesInfo item;
    item.pluginId = readStringField(obj, "p", "pluginId");
    item.runtimeProfile = readStringField(obj, "rp", "runtimeProfile");
    item.title = readStringField(obj, "t", "title");
    item.author = readStringField(obj, "a", "author");
    item.seriesUrl = readStringField(obj, "u", "seriesUrl");
    item.coverUrl = readStringField(obj, "c", "coverUrl");
    item.epubPath = readStringField(obj, "e", "epubPath");
    item.lastChapterUrl = readStringField(obj, "lu", "lastChapterUrl");
    item.lastChapterTitle = readStringField(obj, "lt", "lastChapterTitle");
    item.lastReadChapterUrl = readStringField(obj, "ru", "lastReadChapterUrl");
    item.lastReadChapterTitle = readStringField(obj, "rt", "lastReadChapterTitle");
    item.lastReadPage = readUIntField(obj, "pg", "lastReadPage");
    item.lastReadPageCount = readUIntField(obj, "pc", "lastReadPageCount");
    item.chapterCount = readUIntField(obj, "cc", "chapterCount");
    item.id = readStringField(obj, "id", "id");
    migrated = normalizeTrackedSeriesIdentity(item) || migrated;
    if (item.id.empty()) {
      item.id = buildTrackedSeriesId(item.pluginId, item.seriesUrl);
    }

    if (!isSafeId(item.id) || item.pluginId.empty() || item.seriesUrl.empty()) {
      LOG_ERR("TRK", "Skipping invalid tracked series entry");
      continue;
    }
    items.push_back(std::move(item));
  }

  std::sort(items.begin(), items.end(),
            [](const TrackedSeriesInfo& a, const TrackedSeriesInfo& b) { return a.title < b.title; });
  loaded = true;
  if (migrated) {
    saveToDisk(nullptr);
  }
  return true;
}

bool TrackedSeriesStore::ensureLoaded() {
  if (loaded) {
    return true;
  }
  return loadFromDisk();
}

bool TrackedSeriesStore::saveToDisk(std::string* outError) const {
  Storage.mkdir("/.crosspoint");
  Storage.mkdir("/.crosspoint/data");

  JsonDocument doc;
  doc["v"] = STORE_VERSION;
  JsonArray tracked = doc["i"].to<JsonArray>();
  for (const auto& item : items) {
    JsonObject obj = tracked.add<JsonObject>();
    obj["id"] = item.id;
    obj["p"] = item.pluginId;
    if (!item.runtimeProfile.empty()) obj["rp"] = item.runtimeProfile;
    obj["t"] = item.title;
    if (!item.author.empty()) obj["a"] = item.author;
    obj["u"] = item.seriesUrl;
    if (!item.coverUrl.empty()) obj["c"] = item.coverUrl;
    if (!item.epubPath.empty()) obj["e"] = item.epubPath;
    if (!item.lastChapterUrl.empty()) obj["lu"] = item.lastChapterUrl;
    if (!item.lastChapterTitle.empty()) obj["lt"] = item.lastChapterTitle;
    if (!item.lastReadChapterUrl.empty()) obj["ru"] = item.lastReadChapterUrl;
    if (!item.lastReadChapterTitle.empty()) obj["rt"] = item.lastReadChapterTitle;
    if (item.lastReadPage != 0) obj["pg"] = item.lastReadPage;
    if (item.lastReadPageCount != 0) obj["pc"] = item.lastReadPageCount;
    if (item.chapterCount != 0) obj["cc"] = item.chapterCount;
  }

  FsFile file;
  if (!Storage.openFileForWrite("TRK", TRACKED_SERIES_TMP_FILE, file)) {
    if (outError) *outError = "Failed to write tracked series store";
    return false;
  }
  const size_t expectedBytes = measureJson(doc);
  const size_t written = serializeJson(doc, file);
  file.flush();
  file.close();
  if (written != expectedBytes) {
    Storage.remove(TRACKED_SERIES_TMP_FILE);
    if (outError) *outError = "Failed to write tracked series store";
    return false;
  }
  if (Storage.exists(TRACKED_SERIES_FILE)) {
    Storage.remove(TRACKED_SERIES_FILE);
  }
  if (!Storage.rename(TRACKED_SERIES_TMP_FILE, TRACKED_SERIES_FILE)) {
    Storage.remove(TRACKED_SERIES_TMP_FILE);
    if (outError) *outError = "Failed to finalize tracked series store";
    return false;
  }
  if (Storage.exists(LEGACY_TRACKED_SERIES_FILE)) {
    Storage.remove(LEGACY_TRACKED_SERIES_FILE);
  }
  return true;
}

bool TrackedSeriesStore::upsert(const TrackedSeriesInfo& input, std::string* outError) {
  if (!ensureLoaded()) {
    if (outError) *outError = "Failed to load tracked series store";
    return false;
  }

  TrackedSeriesInfo item = input;
  normalizeTrackedSeriesIdentity(item);
  if (item.pluginId.empty()) {
    if (outError) *outError = "Missing plugin id";
    return false;
  }
  if (item.seriesUrl.empty()) {
    if (outError) *outError = "Missing series url";
    return false;
  }
  if (item.id.empty()) {
    item.id = buildTrackedSeriesId(item.pluginId, item.seriesUrl);
  }
  if (!isSafeId(item.id)) {
    if (outError) *outError = "Invalid tracked series id";
    return false;
  }

  auto it = std::find_if(items.begin(), items.end(),
                         [&item](const TrackedSeriesInfo& existing) {
                           if (existing.id == item.id) {
                             return true;
                           }
                           return existing.seriesUrl == item.seriesUrl &&
                                  PluginStore::canonicalizePluginId(existing.pluginId, existing.runtimeProfile) == item.pluginId;
                         });
  if (it == items.end()) {
    items.push_back(std::move(item));
  } else {
    if (!it->id.empty()) {
      item.id = it->id;
    }
    *it = std::move(item);
  }

  std::sort(items.begin(), items.end(),
            [](const TrackedSeriesInfo& a, const TrackedSeriesInfo& b) { return a.title < b.title; });
  return saveToDisk(outError);
}

bool TrackedSeriesStore::removeById(const std::string& id, std::string* outError) {
  if (!ensureLoaded()) {
    if (outError) *outError = "Failed to load tracked series store";
    return false;
  }

  auto it = std::remove_if(items.begin(), items.end(),
                           [&id](const TrackedSeriesInfo& existing) { return existing.id == id; });
  if (it == items.end()) {
    if (outError) *outError = "Tracked series not found";
    return false;
  }
  items.erase(it, items.end());
  return saveToDisk(outError);
}

const TrackedSeriesInfo* TrackedSeriesStore::getById(const std::string& id) const {
  for (const auto& item : items) {
    if (item.id == id) {
      return &item;
    }
  }
  return nullptr;
}
