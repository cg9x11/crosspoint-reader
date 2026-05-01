#pragma once

#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <cstdint>
#include <string>
#include <vector>

#include "../../PluginStore.h"
#include "../../plugins/HakoPluginExecutor.h"
#include "../Activity.h"
#include "util/ButtonNavigator.h"

class HakoSearchActivity final : public Activity {
  enum class PendingLoadKind { None, Home, Search };

  struct PreviewCacheEntry {
    std::string url;
    std::string text;
    std::string resolvedCoverUrl;
    bool detailLoaded = false;
    bool failed = false;
  };

  struct CoverCacheEntry {
    std::string url;
    std::string bmpPath;
    bool failed = false;
  };

  ButtonNavigator buttonNavigator;
  CpPluginInfo pluginInfo;
  std::string query;
  std::vector<HakoSearchResult> results;
  std::vector<PreviewCacheEntry> previewCache;
  std::vector<CoverCacheEntry> coverCache;
  std::string errorMessage;
  bool showingHomeFeed = true;
  int selectedIndex = 0;
  int currentPage = 1;
  bool hasNextPage = false;
  int previewSelectionIndex = -1;
  unsigned long previewSelectionChangedAtMs = 0;
  PendingLoadKind pendingLoadKind = PendingLoadKind::None;
  uint32_t activeLoadToken = 0;
  TaskHandle_t activeLoadTaskHandle = nullptr;
  int pendingSearchPage = 1;
  bool isLoading = false;
  bool hasRenderedOnce = false;
  std::string loadingMessage;
  std::string popupMessage;
  unsigned long popupUntilMs = 0;
  unsigned long homeFeedLoadEarliestAtMs = 0;

  static constexpr int SEARCH_PAGE_SIZE = 12;
  static constexpr int MIN_SEARCH_QUERY_LENGTH = 3;
  static constexpr size_t MAX_PREVIEW_CACHE_ENTRIES = 4;
  static constexpr size_t MAX_COVER_CACHE_ENTRIES = 4;
  static constexpr unsigned long PREVIEW_FETCH_DELAY_MS = 900;
  static constexpr unsigned long COVER_FETCH_DELAY_MS = 1500;
  static constexpr unsigned long HOME_FEED_INITIAL_DELAY_MS = 0;
  static constexpr unsigned long HOME_FEED_SLOW_SOURCE_DELAY_MS = 250;

  void openSearchPrompt();
  void triggerHomeFeedAction();
  void queueHomeFeedLoad();
  void queueSearchLoad(int page = 1);
  void executePendingLoad();
  void pollAsyncLoad();
  void cancelActiveLoad();
  int getDisplayItemCount() const;
  bool hasPreviousPage() const;
  bool isPreviousPageItem(int index) const;
  bool isNextPageItem(int index) const;
  int getResultIndex(int displayIndex) const;
  void resetPreviewState();
  void noteSelectionChanged();
  PreviewCacheEntry* findPreviewEntry(const std::string& url);
  const PreviewCacheEntry* findPreviewEntry(const std::string& url) const;
  CoverCacheEntry* findCoverEntry(const std::string& url);
  const CoverCacheEntry* findCoverEntry(const std::string& url) const;
  void prunePreviewCache(const std::string& keepUrl);
  void pruneCoverCache(const std::string& keepUrl);
  void maybeLoadSelectedPreview();
  void maybeLoadSelectedCover();
  std::string fallbackPreviewTextForResult(const HakoSearchResult& result) const;
  std::string selectedResolvedCoverUrl() const;
  std::string getSelectedPreviewText() const;
  bool selectedPreviewFailed() const;
  bool selectedPreviewLoading() const;
  std::string getSelectedCoverPath() const;
  bool selectedCoverFailed() const;
  int selectedPreviewVisibleLineCapacity() const;
  bool selectedPreviewOverflows() const;
  unsigned long initialHomeFeedDelayMs() const;
  bool supportsHomeFeed() const;
  void showPopupMessage(const std::string& message, unsigned long durationMs = 1800);

 public:
  HakoSearchActivity(GfxRenderer& renderer, MappedInputManager& mappedInput, CpPluginInfo pluginInfo)
      : Activity("HakoSearch", renderer, mappedInput), pluginInfo(std::move(pluginInfo)) {}

  void onEnter() override;
  void onExit() override;
  void loop() override;
  void render(RenderLock&&) override;
};
