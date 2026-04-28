#pragma once

#include <cstdint>
#include <string>
#include <vector>

struct TrackedSeriesInfo {
  std::string id;
  std::string pluginId;
  std::string runtimeProfile;
  std::string title;
  std::string author;
  std::string seriesUrl;
  std::string coverUrl;
  std::string epubPath;
  std::string lastChapterUrl;
  std::string lastChapterTitle;
  std::string lastReadChapterUrl;
  std::string lastReadChapterTitle;
  uint32_t lastReadPage = 0;
  uint32_t lastReadPageCount = 0;
  uint32_t chapterCount = 0;
};

class TrackedSeriesStore {
 private:
  static TrackedSeriesStore instance;
  std::vector<TrackedSeriesInfo> items;
  bool loaded = false;

  TrackedSeriesStore() = default;

 public:
  TrackedSeriesStore(const TrackedSeriesStore&) = delete;
  TrackedSeriesStore& operator=(const TrackedSeriesStore&) = delete;

  static TrackedSeriesStore& getInstance() { return instance; }

  bool loadFromDisk();
  bool ensureLoaded();
  void markDirty() { loaded = false; }
  bool saveToDisk(std::string* outError = nullptr) const;
  bool upsert(const TrackedSeriesInfo& item, std::string* outError = nullptr);
  bool removeById(const std::string& id, std::string* outError = nullptr);

  bool isLoaded() const { return loaded; }
  size_t getCount() const { return items.size(); }
  const std::vector<TrackedSeriesInfo>& getAll() const { return items; }
  const TrackedSeriesInfo* getById(const std::string& id) const;
};

#define TRACKED_SERIES_STORE TrackedSeriesStore::getInstance()
