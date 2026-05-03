#pragma once

#include <string>
#include <vector>

#include "../PluginStore.h"
#include "../TrackedSeriesStore.h"
#include "HakoPluginExecutor.h"

namespace OnlineSourceBridge {

struct TocPageResult {
  std::vector<HakoChapterRef> chapters;
  int page = 1;
  int totalPages = 1;
};

bool supportsNativeUi(const CpPluginInfo& pluginInfo);
bool supportsBackgroundDownloads(const CpPluginInfo& pluginInfo);
bool supportsTrackedUpdates(const CpPluginInfo& pluginInfo);
bool supportsPagedToc(const CpPluginInfo& pluginInfo);
int pagedTocPageSize(const CpPluginInfo& pluginInfo);
std::string runtimeProfileFor(const CpPluginInfo& pluginInfo);
const std::string& getLastError();
std::string buildAssetProxyUrl(const CpPluginInfo& pluginInfo, const std::string& assetUrl,
                               const std::string& baseUrl = "");
CpPluginInfo makeCanonicalPluginInfo(const std::string& pluginId, const std::string& runtimeProfile = "");
bool fetchSourceCatalog(std::vector<CpPluginInfo>& outSources, bool forceRefresh = false);
bool resolveCatalogPlugin(const std::string& pluginId, const std::string& runtimeProfile, CpPluginInfo& outInfo,
                          bool forceRefresh = false);
void clearMemoryCaches();

bool fetchHomeFeed(const CpPluginInfo& pluginInfo, std::vector<HakoSearchResult>& outResults);
bool search(const CpPluginInfo& pluginInfo, const std::string& query, int page, std::vector<HakoSearchResult>& outResults);
bool fetchDetail(const CpPluginInfo& pluginInfo, const std::string& url, HakoBookDetail& outDetail);
bool fetchTocPage(const CpPluginInfo& pluginInfo, const std::string& url, int page, TocPageResult& outPage);
bool fetchToc(const CpPluginInfo& pluginInfo, const std::string& url, std::vector<HakoChapterRef>& outToc);
bool fetchChapter(const CpPluginInfo& pluginInfo, const HakoChapterRef& ref, HakoChapterContent& outContent,
                  bool includePlainText = true);
bool refreshTrackedSeries(const CpPluginInfo& pluginInfo, const TrackedSeriesInfo& trackedItem, TrackedSeriesInfo& outUpdated,
                          uint32_t& outNewChapterCount, std::string& outMessage);

TrackedSeriesInfo makeTrackedInfo(const CpPluginInfo& pluginInfo, const HakoBookDetail& detail,
                                  const std::vector<HakoChapterRef>& chapters, const TrackedSeriesInfo* existing = nullptr);

}  // namespace OnlineSourceBridge
