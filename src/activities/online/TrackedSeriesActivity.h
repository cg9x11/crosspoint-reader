#pragma once

#include <string>
#include <vector>

#include "../../BackgroundDownloadManager.h"
#include "../../OnlineCoverStore.h"
#include "../../TrackedSeriesStore.h"
#include "../Activity.h"
#include "util/ButtonNavigator.h"

class TrackedSeriesActivity final : public Activity {
 public:
  enum class FilterMode { All, Reading, NeedsUpdate, Downloaded };
  enum class SortMode { Status, Title, Chapters };

 private:
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
  std::vector<TrackedSeriesInfo> items;
  std::vector<int> visibleIndices;
  std::vector<PreviewCacheEntry> previewCache;
  std::vector<CoverCacheEntry> coverCache;
  int selectedIndex = 0;
  std::string selectedTrackedId;
  int previewSelectionIndex = -1;
  uint32_t previewSelectionChangedAtMs = 0;
  std::string popupMessage;
  uint32_t popupUntilMs = 0;
  uint32_t lastPollMs = 0;
  FilterMode filterMode = FilterMode::All;
  SortMode sortMode = SortMode::Status;
  bool leftLongHandled = false;
  bool rightLongHandled = false;
  bool leftShortPending = false;
  bool rightShortPending = false;

  void reloadItems();
  void rebuildVisibleItems();
  void restoreSelection();
  void syncSelected(int index);
  void syncAllTracked();
  void openSeriesDetail(int index);
  std::string statusForItem(const TrackedSeriesInfo& item) const;
  std::string progressForItem(const TrackedSeriesInfo& item) const;
  std::string subtitleForItem(const TrackedSeriesInfo& item) const;
  bool matchesFilter(const TrackedSeriesInfo& item) const;
  int selectedItemIndex() const;
  const TrackedSeriesInfo* selectedItem() const;
  PreviewCacheEntry* findPreviewEntry(const std::string& url);
  const PreviewCacheEntry* findPreviewEntry(const std::string& url) const;
  CoverCacheEntry* findCoverEntry(const std::string& url);
  const CoverCacheEntry* findCoverEntry(const std::string& url) const;
  void noteSelectionChanged();
  void prunePreviewCache(const std::string& keepUrl);
  void pruneCoverCache(const std::string& keepUrl);
  static constexpr size_t MAX_PREVIEW_CACHE_ENTRIES = 4;
  static constexpr size_t MAX_COVER_CACHE_ENTRIES = 4;
  static constexpr unsigned long PREVIEW_FETCH_DELAY_MS = 900;
  static constexpr unsigned long COVER_FETCH_DELAY_MS = 1500;

  void maybeLoadSelectedPreview();
  void maybeLoadSelectedCover();
  std::string selectedResolvedCoverUrl() const;
  std::string selectedPreviewText() const;
  bool selectedPreviewFailed() const;
  bool selectedPreviewLoading() const;
  std::string selectedCoverPath() const;
  bool selectedCoverFailed() const;
  std::string filterLabel() const;
  std::string sortLabel() const;
  std::string headerSubtitle(int pageItems) const;
  std::string emptyStateTitle() const;
  std::string emptyStateBody() const;
  std::string confirmLabel() const;
  bool selectedPreviewOverflows() const;
  void cycleFilterMode();
  void cycleSortMode();

 public:
  explicit TrackedSeriesActivity(GfxRenderer& renderer, MappedInputManager& mappedInput)
      : Activity("TrackedSeries", renderer, mappedInput) {}

  bool skipLoopDelay() override { return BACKGROUND_DOWNLOAD_MANAGER.hasActiveWork(); }
  bool preventAutoSleep() override { return BACKGROUND_DOWNLOAD_MANAGER.hasActiveWork(); }

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;
};
