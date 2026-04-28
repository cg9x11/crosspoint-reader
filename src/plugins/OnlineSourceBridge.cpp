#include "OnlineSourceBridge.h"

#include <Arduino.h>

#include <algorithm>

#include "HakoEpubService.h"
#include "TruyenFullPluginExecutor.h"

namespace OnlineSourceBridge {

namespace {
constexpr unsigned long TOC_CACHE_TTL_MS = 120000;
constexpr size_t MAX_TOC_CACHE_ENTRIES = 6;
constexpr size_t MAX_TOC_PAGE_CACHE_ENTRIES = 12;

struct TocCacheEntry {
  std::string key;
  std::vector<HakoChapterRef> toc;
  unsigned long fetchedAtMs = 0;
};

std::vector<TocCacheEntry> g_tocCache;

struct TocPageCacheEntry {
  std::string key;
  TocPageResult page;
  unsigned long fetchedAtMs = 0;
};

std::vector<TocPageCacheEntry> g_tocPageCache;

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
  if (pluginInfo.id == "hako") {
    return "hako";
  }
  if (pluginInfo.id == "truyenfull") {
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

std::string tocCacheKeyFor(const CpPluginInfo& pluginInfo, const std::string& url) {
  return canonicalProfileFor(pluginInfo) + "|" + pluginInfo.id + "|" + pluginInfo.baseUrl + "|" + url;
}

std::string tocPageCacheKeyFor(const CpPluginInfo& pluginInfo, const std::string& url, int page) {
  return tocCacheKeyFor(pluginInfo, url) + "|page:" + std::to_string(page);
}

bool tryReadCachedToc(const std::string& key, std::vector<HakoChapterRef>& outToc) {
  const unsigned long now = millis();
  auto it = std::find_if(g_tocCache.begin(), g_tocCache.end(),
                         [&key](const TocCacheEntry& entry) { return entry.key == key; });
  if (it == g_tocCache.end()) {
    return false;
  }
  if ((now - it->fetchedAtMs) > TOC_CACHE_TTL_MS) {
    g_tocCache.erase(it);
    return false;
  }

  outToc = it->toc;
  return !outToc.empty();
}

void writeCachedToc(const std::string& key, const std::vector<HakoChapterRef>& toc) {
  if (toc.empty()) {
    return;
  }

  auto it = std::find_if(g_tocCache.begin(), g_tocCache.end(),
                         [&key](const TocCacheEntry& entry) { return entry.key == key; });
  if (it != g_tocCache.end()) {
    it->toc = toc;
    it->fetchedAtMs = millis();
    return;
  }

  if (g_tocCache.size() >= MAX_TOC_CACHE_ENTRIES) {
    auto oldest = std::min_element(g_tocCache.begin(), g_tocCache.end(), [](const TocCacheEntry& left, const TocCacheEntry& right) {
      return left.fetchedAtMs < right.fetchedAtMs;
    });
    if (oldest != g_tocCache.end()) {
      g_tocCache.erase(oldest);
    }
  }

  g_tocCache.push_back(TocCacheEntry{key, toc, millis()});
}

bool tryReadCachedTocPage(const std::string& key, TocPageResult& outPage) {
  const unsigned long now = millis();
  auto it = std::find_if(g_tocPageCache.begin(), g_tocPageCache.end(),
                         [&key](const TocPageCacheEntry& entry) { return entry.key == key; });
  if (it == g_tocPageCache.end()) {
    return false;
  }
  if ((now - it->fetchedAtMs) > TOC_CACHE_TTL_MS) {
    g_tocPageCache.erase(it);
    return false;
  }

  outPage = it->page;
  return !outPage.chapters.empty();
}

void writeCachedTocPage(const std::string& key, const TocPageResult& page) {
  if (page.chapters.empty()) {
    return;
  }

  auto it = std::find_if(g_tocPageCache.begin(), g_tocPageCache.end(),
                         [&key](const TocPageCacheEntry& entry) { return entry.key == key; });
  if (it != g_tocPageCache.end()) {
    it->page = page;
    it->fetchedAtMs = millis();
    return;
  }

  if (g_tocPageCache.size() >= MAX_TOC_PAGE_CACHE_ENTRIES) {
    auto oldest = std::min_element(g_tocPageCache.begin(), g_tocPageCache.end(),
                                   [](const TocPageCacheEntry& left, const TocPageCacheEntry& right) {
                                     return left.fetchedAtMs < right.fetchedAtMs;
                                   });
    if (oldest != g_tocPageCache.end()) {
      g_tocPageCache.erase(oldest);
    }
  }

  g_tocPageCache.push_back(TocPageCacheEntry{key, page, millis()});
}
}

bool supportsNativeUi(const CpPluginInfo& pluginInfo) {
  return isHakoLike(pluginInfo) || isTruyenFullLike(pluginInfo);
}

bool supportsBackgroundDownloads(const CpPluginInfo& pluginInfo) { return isHakoLike(pluginInfo); }

bool supportsTrackedUpdates(const CpPluginInfo& pluginInfo) { return pluginInfo.supportsTrackedUpdates; }

bool supportsPagedToc(const CpPluginInfo& pluginInfo) { return isTruyenFullLike(pluginInfo); }

std::string runtimeProfileFor(const CpPluginInfo& pluginInfo) { return canonicalProfileFor(pluginInfo); }

CpPluginInfo makeFallbackPluginInfo(const std::string& pluginId, const std::string& runtimeProfile) {
  CpPluginInfo info;
  info.id = pluginId;
  info.runtimeMode = runtimeProfile.empty() ? std::string("native") : std::string("adapter");
  info.runtimeProfile = runtimeProfile;
  if (info.runtimeProfile.empty()) {
    if (pluginId == "hako") info.runtimeProfile = "hako";
    if (pluginId == "truyenfull") info.runtimeProfile = "truyenfull";
    if (pluginId == "webtruyen") info.runtimeProfile = "truyenfull";
  }
  if (info.runtimeProfile == "hako") {
    info.name = "Hako";
    info.baseUrl = HakoPluginExecutor::BASE_URL;
    info.supportsSearch = true;
    info.supportsTrackedUpdates = true;
  } else if (info.runtimeProfile == "truyenfull") {
    info.name = pluginId == "webtruyen" ? "Web Truyen" : "Truyen Full";
    info.baseUrl = pluginId == "webtruyen" ? "https://truyencom.com" : TruyenFullPluginExecutor::BASE_URL;
    info.supportsSearch = true;
    info.supportsTrackedUpdates = false;
  } else {
    info.name = pluginId;
  }
  return info;
}

bool fetchHomeFeed(const CpPluginInfo& pluginInfo, std::vector<HakoSearchResult>& outResults) {
  if (isHakoLike(pluginInfo)) {
    return HakoPluginExecutor::fetchHomeFeed(outResults);
  }
  if (isTruyenFullLike(pluginInfo)) {
    return TruyenFullPluginExecutor::fetchHomeFeed(resolvedBaseUrlFor(pluginInfo, TruyenFullPluginExecutor::BASE_URL),
                                                   outResults);
  }
  return false;
}

bool search(const CpPluginInfo& pluginInfo, const std::string& query, int page, std::vector<HakoSearchResult>& outResults) {
  if (isHakoLike(pluginInfo)) {
    return HakoPluginExecutor::search(query, page, outResults);
  }
  if (isTruyenFullLike(pluginInfo)) {
    return TruyenFullPluginExecutor::search(resolvedBaseUrlFor(pluginInfo, TruyenFullPluginExecutor::BASE_URL), query,
                                            page, outResults);
  }
  return false;
}

bool fetchDetail(const CpPluginInfo& pluginInfo, const std::string& url, HakoBookDetail& outDetail) {
  if (isHakoLike(pluginInfo)) {
    return HakoPluginExecutor::fetchDetail(url, outDetail);
  }
  if (isTruyenFullLike(pluginInfo)) {
    return TruyenFullPluginExecutor::fetchDetail(resolvedBaseUrlFor(pluginInfo, TruyenFullPluginExecutor::BASE_URL), url,
                                                 outDetail);
  }
  return false;
}

bool fetchTocPage(const CpPluginInfo& pluginInfo, const std::string& url, int page, TocPageResult& outPage) {
  const int safePage = page < 1 ? 1 : page;
  const std::string cacheKey = tocPageCacheKeyFor(pluginInfo, url, safePage);
  if (tryReadCachedTocPage(cacheKey, outPage)) {
    return true;
  }

  outPage = {};
  outPage.page = safePage;
  outPage.totalPages = 1;

  if (isTruyenFullLike(pluginInfo)) {
    int totalPages = 1;
    if (!TruyenFullPluginExecutor::fetchTocPage(resolvedBaseUrlFor(pluginInfo, TruyenFullPluginExecutor::BASE_URL), url, safePage,
                                                outPage.chapters, totalPages)) {
      return false;
    }
    outPage.totalPages = totalPages;
    writeCachedTocPage(cacheKey, outPage);
    return true;
  }

  if (fetchToc(pluginInfo, url, outPage.chapters)) {
    writeCachedTocPage(cacheKey, outPage);
    return true;
  }
  return false;
}

bool fetchToc(const CpPluginInfo& pluginInfo, const std::string& url, std::vector<HakoChapterRef>& outToc) {
  const std::string cacheKey = tocCacheKeyFor(pluginInfo, url);
  if (tryReadCachedToc(cacheKey, outToc)) {
    return true;
  }

  bool ok = false;
  if (isHakoLike(pluginInfo)) {
    ok = HakoPluginExecutor::fetchToc(url, outToc);
  } else if (isTruyenFullLike(pluginInfo)) {
    ok = TruyenFullPluginExecutor::fetchToc(resolvedBaseUrlFor(pluginInfo, TruyenFullPluginExecutor::BASE_URL), url, outToc);
  }
  if (ok) {
    writeCachedToc(cacheKey, outToc);
  }
  return ok;
}

bool fetchChapter(const CpPluginInfo& pluginInfo, const HakoChapterRef& ref, HakoChapterContent& outContent) {
  if (isHakoLike(pluginInfo)) {
    return HakoPluginExecutor::fetchChapter(ref, outContent);
  }
  if (isTruyenFullLike(pluginInfo)) {
    return TruyenFullPluginExecutor::fetchChapter(resolvedBaseUrlFor(pluginInfo, TruyenFullPluginExecutor::BASE_URL), ref,
                                                  outContent);
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
  info.coverUrl = detail.coverUrl;
  info.chapterCount = static_cast<uint32_t>(chapters.size());
  if (!chapters.empty()) {
    info.lastChapterUrl = chapters.back().url;
    info.lastChapterTitle = chapters.back().title;
  }
  applyLatestFallback(info);
  return info;
}

}  // namespace OnlineSourceBridge
