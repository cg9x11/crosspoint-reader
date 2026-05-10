#pragma once

#include <functional>
#include <optional>
#include <string>
#include <vector>

struct SeriesChapter {
  int chapterIndex = 0;
  std::string title;
  std::string file;
};

struct SeriesManifest {
  int version = 0;
  std::string seriesId;
  std::string title;
  std::string author;
  std::string sourceId;
  std::string sourceName;
  std::string description;
  std::string coverPath;
  std::string status;
  std::string updatedAt;
  std::string seriesDir;
  std::vector<SeriesChapter> chapters;

  bool isValid() const { return version > 0 && !seriesId.empty() && !seriesDir.empty() && !chapters.empty(); }
};

class SeriesManifestStore {
 public:
  static constexpr const char* MANIFEST_FILE = "_series.json";

  static bool loadMetadataFromSeriesDir(const std::string& seriesDir, SeriesManifest& manifest);
  static bool loadFromSeriesDir(const std::string& seriesDir, SeriesManifest& manifest);
  static size_t countChaptersFromSeriesDir(const std::string& seriesDir);
  static bool loadChapterSliceFromSeriesDir(const std::string& seriesDir, size_t startIndex, size_t maxItems,
                                            std::vector<SeriesChapter>& chaptersOut);
  static bool forEachChapterInSeriesDir(const std::string& seriesDir, const std::function<bool(const SeriesChapter&)>& callback,
                                        size_t* outCount = nullptr);
  static bool findFirstChapterInSeriesDir(const std::string& seriesDir, SeriesChapter& chapterOut, size_t* outCount = nullptr);
  static bool findChapterByPathInSeriesDir(const std::string& seriesDir, const std::string& chapterPath, SeriesChapter& chapterOut,
                                           size_t* outCount = nullptr);
  static bool tryLoadForChapterPath(const std::string& chapterPath, SeriesManifest& manifest);
  static std::optional<SeriesChapter> findByIndex(const SeriesManifest& manifest, int chapterIndex);
  static std::optional<SeriesChapter> findByPath(const SeriesManifest& manifest, const std::string& chapterPath);
  static bool resolveChapterPath(const SeriesManifest& manifest, int chapterIndex, std::string& chapterPath);
  static std::string buildChapterPath(const std::string& seriesDir, const std::string& relativeFile);

 private:
  static std::string extractSeriesDir(const std::string& chapterPath);
  static bool parseJson(const std::string& json, const std::string& seriesDir, SeriesManifest& manifest);
};
