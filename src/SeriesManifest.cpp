#include "SeriesManifest.h"

#include <ArduinoJson.h>
#include <HalStorage.h>
#include <Logging.h>

#include <algorithm>

namespace {
std::string normalizeDir(std::string dir) {
  if (dir.empty()) {
    return "/";
  }
  if (dir.back() == '/' && dir.size() > 1) {
    dir.pop_back();
  }
  if (dir.empty()) {
    return "/";
  }
  return dir;
}
}  // namespace

bool SeriesManifestStore::loadFromSeriesDir(const std::string& seriesDir, SeriesManifest& manifest) {
  const std::string normalizedDir = normalizeDir(seriesDir);
  const std::string manifestPath = buildChapterPath(normalizedDir, MANIFEST_FILE);
  if (!Storage.exists(manifestPath.c_str())) {
    LOG_DBG("SER", "Series manifest missing: %s", manifestPath.c_str());
    return false;
  }

  String json = Storage.readFile(manifestPath.c_str());
  if (json.isEmpty()) {
    LOG_ERR("SER", "Series manifest empty: %s", manifestPath.c_str());
    return false;
  }

  return parseJson(json.c_str(), normalizedDir, manifest);
}

bool SeriesManifestStore::tryLoadForChapterPath(const std::string& chapterPath, SeriesManifest& manifest) {
  const std::string seriesDir = extractSeriesDir(chapterPath);
  if (seriesDir.empty()) {
    return false;
  }
  return loadFromSeriesDir(seriesDir, manifest);
}

std::optional<SeriesChapter> SeriesManifestStore::findByIndex(const SeriesManifest& manifest, const int chapterIndex) {
  auto it = std::find_if(manifest.chapters.begin(), manifest.chapters.end(),
                         [chapterIndex](const SeriesChapter& chapter) { return chapter.chapterIndex == chapterIndex; });
  if (it == manifest.chapters.end()) {
    return std::nullopt;
  }
  return *it;
}

std::optional<SeriesChapter> SeriesManifestStore::findByPath(const SeriesManifest& manifest,
                                                             const std::string& chapterPath) {
  for (const auto& chapter : manifest.chapters) {
    if (buildChapterPath(manifest.seriesDir, chapter.file) == chapterPath) {
      return chapter;
    }
  }
  return std::nullopt;
}

bool SeriesManifestStore::resolveChapterPath(const SeriesManifest& manifest, const int chapterIndex,
                                             std::string& chapterPath) {
  const auto chapter = findByIndex(manifest, chapterIndex);
  if (!chapter.has_value()) {
    return false;
  }
  chapterPath = buildChapterPath(manifest.seriesDir, chapter->file);
  return true;
}

std::string SeriesManifestStore::buildChapterPath(const std::string& seriesDir, const std::string& relativeFile) {
  std::string normalizedDir = normalizeDir(seriesDir);
  if (normalizedDir == "/") {
    return "/" + relativeFile;
  }
  return normalizedDir + "/" + relativeFile;
}

std::string SeriesManifestStore::extractSeriesDir(const std::string& chapterPath) {
  const size_t slashPos = chapterPath.find_last_of('/');
  if (slashPos == std::string::npos) {
    return "/";
  }
  if (slashPos == 0) {
    return "/";
  }
  return chapterPath.substr(0, slashPos);
}

bool SeriesManifestStore::parseJson(const std::string& json, const std::string& seriesDir, SeriesManifest& manifest) {
  JsonDocument doc;
  auto error = deserializeJson(doc, json.c_str());
  if (error) {
    LOG_ERR("SER", "Series manifest parse error: %s", error.c_str());
    return false;
  }

  SeriesManifest parsed;
  parsed.version = doc["version"] | 0;
  parsed.seriesId = doc["seriesId"] | std::string("");
  parsed.title = doc["title"] | std::string("");
  parsed.author = doc["author"] | std::string("");
  parsed.sourceId = doc["sourceId"] | std::string("");
  parsed.sourceName = doc["sourceName"] | std::string("");
  parsed.description = doc["description"] | std::string("");
  parsed.coverPath = doc["coverPath"] | std::string("");
  parsed.status = doc["status"] | std::string("");
  parsed.updatedAt = doc["updatedAt"] | std::string("");
  parsed.seriesDir = seriesDir;

  JsonArray chapters = doc["chapters"].as<JsonArray>();
  for (JsonObject chapterObj : chapters) {
    SeriesChapter chapter;
    chapter.chapterIndex = chapterObj["chapterIndex"] | 0;
    chapter.title = chapterObj["title"] | std::string("");
    chapter.file = chapterObj["file"] | std::string("");
    if (chapter.chapterIndex <= 0 || chapter.file.empty()) {
      continue;
    }
    parsed.chapters.push_back(std::move(chapter));
  }

  if (!parsed.isValid()) {
    LOG_ERR("SER", "Series manifest invalid for dir: %s", seriesDir.c_str());
    return false;
  }

  std::sort(parsed.chapters.begin(), parsed.chapters.end(),
            [](const SeriesChapter& left, const SeriesChapter& right) { return left.chapterIndex < right.chapterIndex; });
  manifest = std::move(parsed);
  return true;
}
