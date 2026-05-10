#include "SeriesManifest.h"

#include <ArduinoJson.h>
#include <HalStorage.h>
#include <Logging.h>

#include <algorithm>
#include <functional>

namespace {
constexpr const char* CHAPTER_INDEX_TOKEN = "\"chapterIndex\"";

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

class JsonFileStream final : public Stream {
 public:
  explicit JsonFileStream(FsFile& file) : file_(file) {}

  int available() override { return file_.available(); }
  int read() override { return file_.read(); }
  int peek() override {
    const size_t pos = file_.position();
    const int value = file_.read();
    if (value >= 0) {
      file_.seekSet(pos);
    }
    return value;
  }
  void flush() override {}
  size_t write(uint8_t) override { return 0; }

 private:
  FsFile& file_;
};

size_t countManifestChapters(FsFile& file) {
  const size_t originalPos = file.position();
  if (!file.seekSet(0)) {
    return 0;
  }

  constexpr size_t chunkSize = 512;
  constexpr size_t tokenLen = 14;
  char chunk[chunkSize + tokenLen];
  size_t carryLen = 0;
  size_t count = 0;

  while (file.available() > 0) {
    const int bytesRead = file.read(chunk + carryLen, chunkSize);
    if (bytesRead <= 0) {
      break;
    }

    const size_t totalLen = carryLen + static_cast<size_t>(bytesRead);
    for (size_t i = 0; i + tokenLen <= totalLen; i++) {
      if (memcmp(chunk + i, CHAPTER_INDEX_TOKEN, tokenLen) == 0) {
        ++count;
      }
    }

    carryLen = std::min(tokenLen - 1, totalLen);
    if (carryLen > 0) {
      memmove(chunk, chunk + totalLen - carryLen, carryLen);
    }
  }

  file.seekSet(originalPos);
  return count;
}

bool seekToChaptersArray(FsFile& file) {
  constexpr const char* token = "\"chapters\"";
  constexpr size_t tokenLen = 10;
  char window[tokenLen];
  size_t matched = 0;

  if (!file.seekSet(0)) {
    return false;
  }

  while (file.available() > 0) {
    const int value = file.read();
    if (value < 0) {
      return false;
    }
    window[matched % tokenLen] = static_cast<char>(value);
    ++matched;
    if (matched >= tokenLen) {
      bool same = true;
      for (size_t i = 0; i < tokenLen; ++i) {
        if (window[(matched - tokenLen + i) % tokenLen] != token[i]) {
          same = false;
          break;
        }
      }
      if (same) {
        break;
      }
    }
  }

  if (matched < tokenLen) {
    return false;
  }

  while (file.available() > 0) {
    const int value = file.read();
    if (value == '[') {
      return true;
    }
  }
  return false;
}

bool nextChapterObjectJson(FsFile& file, std::string& objectJson) {
  objectJson.clear();

  bool inString = false;
  bool escaped = false;
  int braceDepth = 0;

  while (file.available() > 0) {
    const int raw = file.read();
    if (raw < 0) {
      return false;
    }

    const char ch = static_cast<char>(raw);
    if (braceDepth == 0) {
      if (ch == '{') {
        braceDepth = 1;
        objectJson.push_back(ch);
      } else if (ch == ']') {
        return false;
      }
      continue;
    }

    objectJson.push_back(ch);
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch == '\\') {
      escaped = true;
      continue;
    }
    if (ch == '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch == '{') {
        ++braceDepth;
      } else if (ch == '}') {
        --braceDepth;
        if (braceDepth == 0) {
          return true;
        }
      }
    }
  }

  objectJson.clear();
  return false;
}

bool findJsonFieldValue(const std::string& json, const char* key, size_t& valuePos) {
  const std::string needle = std::string("\"") + key + "\"";
  const size_t keyPos = json.find(needle);
  if (keyPos == std::string::npos) {
    return false;
  }

  size_t colonPos = json.find(':', keyPos + needle.size());
  if (colonPos == std::string::npos) {
    return false;
  }

  valuePos = colonPos + 1;
  while (valuePos < json.size()) {
    const char ch = json[valuePos];
    if (ch != ' ' && ch != '\t' && ch != '\r' && ch != '\n') {
      return true;
    }
    ++valuePos;
  }
  return false;
}

bool decodeJsonStringAt(const std::string& json, size_t valuePos, std::string& out) {
  out.clear();
  if (valuePos >= json.size() || json[valuePos] != '"') {
    return false;
  }

  for (size_t i = valuePos + 1; i < json.size(); ++i) {
    const char ch = json[i];
    if (ch == '"') {
      return true;
    }
    if (ch != '\\') {
      out.push_back(ch);
      continue;
    }

    if (++i >= json.size()) {
      return false;
    }

    switch (json[i]) {
      case '"':
      case '\\':
      case '/':
        out.push_back(json[i]);
        break;
      case 'b':
        out.push_back('\b');
        break;
      case 'f':
        out.push_back('\f');
        break;
      case 'n':
        out.push_back('\n');
        break;
      case 'r':
        out.push_back('\r');
        break;
      case 't':
        out.push_back('\t');
        break;
      case 'u':
        if (i + 4 >= json.size()) {
          return false;
        }
        // Keep escaped unicode sequences verbatim enough to avoid parser failure on MCU.
        out.push_back('?');
        i += 4;
        break;
      default:
        out.push_back(json[i]);
        break;
    }
  }

  return false;
}

bool parseChapterFromObjectJson(const std::string& objectJson, SeriesChapter& chapter) {
  chapter = {};

  size_t valuePos = 0;
  if (findJsonFieldValue(objectJson, "chapterIndex", valuePos)) {
    char* endPtr = nullptr;
    const long parsed = strtol(objectJson.c_str() + valuePos, &endPtr, 10);
    if (endPtr != objectJson.c_str() + valuePos && parsed > 0) {
      chapter.chapterIndex = static_cast<int>(parsed);
    }
  }

  if (findJsonFieldValue(objectJson, "title", valuePos)) {
    decodeJsonStringAt(objectJson, valuePos, chapter.title);
  }

  if (findJsonFieldValue(objectJson, "file", valuePos)) {
    decodeJsonStringAt(objectJson, valuePos, chapter.file);
  }

  return chapter.chapterIndex > 0 && !chapter.file.empty();
}

bool forEachManifestChapter(FsFile& file, const std::function<bool(const SeriesChapter&)>& callback, size_t* outCount) {
  if (outCount) {
    *outCount = 0;
  }
  if (!seekToChaptersArray(file)) {
    return false;
  }

  std::string objectJson;
  while (nextChapterObjectJson(file, objectJson)) {
    SeriesChapter chapter;
    if (!parseChapterFromObjectJson(objectJson, chapter)) {
      continue;
    }

    if (outCount) {
      ++(*outCount);
    }
    if (!callback(chapter)) {
      return true;
    }
  }

  return true;
}
}  // namespace

bool SeriesManifestStore::loadFromSeriesDir(const std::string& seriesDir, SeriesManifest& manifest) {
  const std::string normalizedDir = normalizeDir(seriesDir);
  const std::string manifestPath = buildChapterPath(normalizedDir, MANIFEST_FILE);
  if (!Storage.exists(manifestPath.c_str())) {
    LOG_DBG("SER", "Series manifest missing: %s", manifestPath.c_str());
    return false;
  }

  SeriesManifest parsed;
  if (!loadMetadataFromSeriesDir(normalizedDir, parsed)) {
    return false;
  }
  parsed.seriesDir = normalizedDir;

  FsFile file;
  if (!Storage.openFileForRead("SER", manifestPath.c_str(), file) || !file) {
    LOG_ERR("SER", "Series manifest open failed: %s", manifestPath.c_str());
    return false;
  }

  if (file.size() == 0) {
    LOG_ERR("SER", "Series manifest empty: %s", manifestPath.c_str());
    file.close();
    return false;
  }

  const size_t estimatedChapterCount = countManifestChapters(file);
  if (estimatedChapterCount > 0) {
    parsed.chapters.reserve(estimatedChapterCount);
  }

  const bool chaptersLoaded = forEachManifestChapter(
      file,
      [&parsed](const SeriesChapter& chapter) {
        parsed.chapters.push_back(chapter);
        return true;
      },
      nullptr);
  file.close();
  if (!chaptersLoaded) {
    LOG_ERR("SER", "Series manifest chapters parse failed: %s", manifestPath.c_str());
    return false;
  }

  if (!parsed.isValid()) {
    LOG_ERR("SER", "Series manifest invalid for dir: %s", normalizedDir.c_str());
    return false;
  }

  std::sort(parsed.chapters.begin(), parsed.chapters.end(),
            [](const SeriesChapter& left, const SeriesChapter& right) { return left.chapterIndex < right.chapterIndex; });
  manifest = std::move(parsed);
  return true;
}

bool SeriesManifestStore::loadMetadataFromSeriesDir(const std::string& seriesDir, SeriesManifest& manifest) {
  const std::string normalizedDir = normalizeDir(seriesDir);
  const std::string manifestPath = buildChapterPath(normalizedDir, MANIFEST_FILE);
  if (!Storage.exists(manifestPath.c_str())) {
    return false;
  }

  FsFile file;
  if (!Storage.openFileForRead("SER", manifestPath.c_str(), file) || !file) {
    LOG_ERR("SER", "Series metadata open failed: %s", manifestPath.c_str());
    return false;
  }

  JsonFileStream stream(file);
  JsonDocument doc;
  JsonDocument filter;
  filter["version"] = true;
  filter["seriesId"] = true;
  filter["title"] = true;
  filter["author"] = true;
  filter["sourceId"] = true;
  filter["sourceName"] = true;
  filter["description"] = true;
  filter["coverPath"] = true;
  filter["status"] = true;
  filter["updatedAt"] = true;

  auto error = deserializeJson(doc, stream, DeserializationOption::Filter(filter));
  file.close();
  if (error) {
    LOG_ERR("SER", "Series metadata parse error: %s", error.c_str());
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
  parsed.seriesDir = normalizedDir;
  manifest = std::move(parsed);
  return true;
}

size_t SeriesManifestStore::countChaptersFromSeriesDir(const std::string& seriesDir) {
  const std::string normalizedDir = normalizeDir(seriesDir);
  const std::string manifestPath = buildChapterPath(normalizedDir, MANIFEST_FILE);
  if (!Storage.exists(manifestPath.c_str())) {
    return 0;
  }

  FsFile file;
  if (!Storage.openFileForRead("SER", manifestPath.c_str(), file) || !file) {
    return 0;
  }

  const size_t count = countManifestChapters(file);
  file.close();
  return count;
}

bool SeriesManifestStore::forEachChapterInSeriesDir(const std::string& seriesDir,
                                                    const std::function<bool(const SeriesChapter&)>& callback,
                                                    size_t* outCount) {
  const std::string normalizedDir = normalizeDir(seriesDir);
  const std::string manifestPath = buildChapterPath(normalizedDir, MANIFEST_FILE);
  if (!Storage.exists(manifestPath.c_str())) {
    return false;
  }

  FsFile file;
  if (!Storage.openFileForRead("SER", manifestPath.c_str(), file) || !file) {
    return false;
  }

  const bool ok = forEachManifestChapter(file, callback, outCount);
  file.close();
  return ok;
}

bool SeriesManifestStore::findFirstChapterInSeriesDir(const std::string& seriesDir, SeriesChapter& chapterOut,
                                                      size_t* outCount) {
  bool found = false;
  chapterOut = {};
  size_t chapterCount = 0;
  const bool ok = forEachChapterInSeriesDir(
      seriesDir,
      [&chapterOut, &found](const SeriesChapter& chapter) {
        if (!found) {
          chapterOut = chapter;
          found = true;
        }
        return true;
      },
      &chapterCount);
  if (outCount) {
    *outCount = chapterCount;
  }
  return ok && found;
}

bool SeriesManifestStore::findChapterByPathInSeriesDir(const std::string& seriesDir, const std::string& chapterPath,
                                                       SeriesChapter& chapterOut, size_t* outCount) {
  bool found = false;
  chapterOut = {};
  size_t chapterCount = 0;
  const bool ok = forEachChapterInSeriesDir(
      seriesDir,
      [&seriesDir, &chapterPath, &chapterOut, &found](const SeriesChapter& chapter) {
        if (buildChapterPath(seriesDir, chapter.file) == chapterPath) {
          chapterOut = chapter;
          found = true;
        }
        return true;
      },
      &chapterCount);
  if (outCount) {
    *outCount = chapterCount;
  }
  return ok && found;
}

bool SeriesManifestStore::loadChapterSliceFromSeriesDir(const std::string& seriesDir, const size_t startIndex,
                                                        const size_t maxItems,
                                                        std::vector<SeriesChapter>& chaptersOut) {
  chaptersOut.clear();
  if (maxItems == 0) {
    return true;
  }

  const std::string normalizedDir = normalizeDir(seriesDir);
  const std::string manifestPath = buildChapterPath(normalizedDir, MANIFEST_FILE);
  if (!Storage.exists(manifestPath.c_str())) {
    return false;
  }

  FsFile file;
  if (!Storage.openFileForRead("SER", manifestPath.c_str(), file) || !file) {
    return false;
  }

  size_t index = 0;
  const bool ok = forEachManifestChapter(
      file,
      [&chaptersOut, &index, startIndex, maxItems](const SeriesChapter& chapter) {
        if (index++ < startIndex) {
          return true;
        }
        chaptersOut.push_back(chapter);
        return chaptersOut.size() < maxItems;
      },
      nullptr);
  file.close();
  return ok;
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
