#pragma once
#include <OpdsParser.h>

#include <string>
#include <utility>
#include <vector>

#include "../Activity.h"
#include "OpdsServerStore.h"
#include "util/ButtonNavigator.h"

struct Rect;

class OpdsBookBrowserActivity final : public Activity {
 public:
  enum class BrowserState { CHECK_WIFI, WIFI_SELECTION, LOADING, BROWSING, DOWNLOADING, ERROR, SEARCH_INPUT };

  explicit OpdsBookBrowserActivity(GfxRenderer& renderer, MappedInputManager& mappedInput, OpdsServer server)
      : Activity("OpdsBookBrowser", renderer, mappedInput), buttonNavigator(), server(std::move(server)) {}

  void onEnter() override;
  void onExit() override;
  void loop() override;
  void render(RenderLock&&) override;

 private:
  struct PreviewData {
    bool available = false;
    std::string key;
    std::string title;
    std::string author;
    std::string status;
    std::string summary;
    std::string coverBmpPath;
  };

  ButtonNavigator buttonNavigator;
  BrowserState state = BrowserState::LOADING;
  std::vector<OpdsEntry> entries;
  std::vector<std::string> navigationHistory;
  std::string currentPath;
  std::string searchTemplate;
  std::string currentFeedTitle;
  bool consumeConfirm = false;
  bool consumeBack = false;
  int selectorIndex = 0;
  int previewSelectorIndex = -1;
  unsigned long previewReadyAt = 0;
  int previewSummaryScrollOffset = 0;
  int previewSummaryTotalLines = 0;
  int previewSummaryVisibleLines = 0;
  int previewSummaryCacheWidth = 0;
  std::string previewSummaryCacheKey;
  std::vector<std::string> previewSummaryLines;
  std::string errorMessage;
  std::string statusMessage;
  std::string downloadDetailMessage;
  std::string pendingFetchPath;
  size_t downloadProgress = 0;
  size_t downloadTotal = 0;
  PreviewData currentPreview;

  OpdsServer server;  // Copied at construction - safe even if the store changes during browsing

  void checkAndConnectWifi();
  void launchWifiSelection();
  void onWifiSelectionComplete(bool connected);
  void fetchFeed(const std::string& path);
  bool fetchFeedData(const std::string& url, std::vector<OpdsEntry>& outEntries, std::string* outFeedTitle = nullptr,
                     std::string* outSearchTemplate = nullptr, std::string* outNextUrl = nullptr,
                     std::string* outPrevUrl = nullptr, bool lightweightEntries = false) const;
  void navigateToEntry(const OpdsEntry& entry);
  void navigateBack();
  void downloadBook(const OpdsEntry& book);
  void downloadSeries(const OpdsEntry& entry);
  void launchSearch();
  void performSearch(const std::string& query);
  bool ensureSeriesArtifacts(const OpdsEntry& seriesEntry, const std::string& feedUrl,
                             const std::vector<OpdsEntry>& seriesEntries, const std::string& firstDownloadUrl,
                             const std::string& localSeriesDir, bool allowRemoteManifestFetch);
  bool synthesizeSeriesManifest(const std::string& feedUrl, const std::vector<OpdsEntry>& seriesEntries,
                                const std::string& localSeriesDir, const OpdsEntry& seriesEntry) const;
  void updatePreviewForSelection();
  void schedulePreviewUpdate();
  bool hydrateEntryMetadata(OpdsEntry& entry);
  void resetPreviewSummaryCache();
  void ensurePreviewSummaryCache(const PreviewData& preview, int textWidth);
  std::string getPreviewCoverPath(const OpdsEntry& entry, const std::string& baseUrl);
  void drawPreviewPanel(const Rect& rect, const PreviewData& preview);
  bool preventAutoSleep() override { return true; }
};
