#pragma once

#include <functional>
#include <string>
#include <vector>

#include "../PluginStore.h"
#include "../TrackedSeriesStore.h"
#include "HakoPluginExecutor.h"

struct HakoTrackedSyncResult {
  bool success = false;
  bool updated = false;
  bool rebuilt = false;
  bool lastKnownFound = true;
  uint32_t chapterCount = 0;
  std::string message;
  std::string epubPath;
  std::string latestChapterUrl;
  std::string latestChapterTitle;
  std::vector<HakoChapterRef> newChapters;
};

struct HakoDownloadOptions {
  uint32_t chapterDelayMinMs = 0;
  uint32_t chapterDelayMaxMs = 0;
  uint32_t batchSize = 0;
  uint32_t batchDelayMinMs = 0;
  uint32_t batchDelayMaxMs = 0;
  uint32_t chapterRetryCount = 0;
  uint32_t chapterRetryDelayMinMs = 0;
  uint32_t chapterRetryDelayMaxMs = 0;
};

struct HakoProgressState {
  uint32_t completedChapters = 0;
  uint32_t totalChapters = 0;
  uint32_t waitMs = 0;
  std::string chapterTitle;
  std::string message;
};

using HakoProgressCallback = std::function<bool(const HakoProgressState&)>;

class HakoEpubService {
 public:
  static std::string buildDefaultEpubPath(const HakoBookDetail& detail);

  static TrackedSeriesInfo makeTrackedInfo(const CpPluginInfo& pluginInfo, const HakoBookDetail& detail,
                                           const std::vector<HakoChapterRef>& toc,
                                           const TrackedSeriesInfo* existing = nullptr);

  static bool downloadEpub(const HakoBookDetail& detail, const std::vector<HakoChapterRef>& toc,
                           const std::string& epubPath, std::string* outError = nullptr,
                           const HakoDownloadOptions* options = nullptr,
                           const HakoProgressCallback& progress = HakoProgressCallback());

  static bool syncTrackedSeries(const TrackedSeriesInfo& current, HakoTrackedSyncResult& outResult,
                                const HakoDownloadOptions* options = nullptr,
                                const HakoProgressCallback& progress = HakoProgressCallback());
};
