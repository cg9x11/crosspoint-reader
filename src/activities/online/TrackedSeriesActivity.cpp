#include "TrackedSeriesActivity.h"

#include <GfxRenderer.h>
#include <HalStorage.h>
#include <I18n.h>

#include <algorithm>
#include <cctype>

#include "../../OnlineCoverStore.h"
#include "../../PluginStore.h"
#include "../../plugins/HakoEpubService.h"
#include "../../plugins/HakoPluginExecutor.h"
#include "../../plugins/OnlineSourceBridge.h"
#include "../../util/ScreenDebugState.h"
#include "../../util/StringUtils.h"
#include "HakoBookDetailActivity.h"
#include "OnlineTextUtils.h"
#include "components/UITheme.h"
#include "fontIds.h"

namespace {
constexpr unsigned long MODE_SWITCH_MS = 700;
constexpr int MAX_SUMMARY_WRAP_LINES = 96;
TrackedSeriesActivity::FilterMode g_lastFilterMode = TrackedSeriesActivity::FilterMode::All;
TrackedSeriesActivity::SortMode g_lastSortMode = TrackedSeriesActivity::SortMode::Status;
std::string g_lastTrackedSeriesId;

bool asciiLess(const std::string& lhs, const std::string& rhs) {
  return std::lexicographical_compare(lhs.begin(), lhs.end(), rhs.begin(), rhs.end(), [](char a, char b) {
    return std::tolower(static_cast<unsigned char>(a)) < std::tolower(static_cast<unsigned char>(b));
  });
}

int statusRank(const std::string& status) {
  if (status == "Updating") return 0;
  if (status == "Retry wait") return 1;
  if (status == "Queued") return 2;
  if (status == "Failed") return 3;
  if (status == "New chapters") return 4;
  if (status == "Unread") return 5;
  if (status == "Library") return 6;
  return 9;
}

bool shouldSurfaceJobStatus(DownloadJobStatus status) {
  return status == DownloadJobStatus::Queued || status == DownloadJobStatus::Running ||
         status == DownloadJobStatus::RetryWait || status == DownloadJobStatus::Failed;
}

bool hasDownloadedEpub(const TrackedSeriesInfo& item) {
  return !item.epubPath.empty() && Storage.exists(item.epubPath.c_str());
}

CpPluginInfo resolvePluginForTrackedItem(const TrackedSeriesInfo& item) {
  const auto* plugin = PLUGIN_STORE.getPlugin(item.pluginId);
  return plugin ? *plugin : OnlineSourceBridge::makeFallbackPluginInfo(item.pluginId, item.runtimeProfile);
}

const char* coverDebugStatus(bool hasCover, bool failed) {
  if (hasCover) return "Cover ready";
  if (failed) return "Cover unavailable";
  return "Cover pending";
}

}

void TrackedSeriesActivity::reloadItems() {
  TRACKED_SERIES_STORE.loadFromDisk();
  items = TRACKED_SERIES_STORE.getAll();
  previewCache.clear();
  coverCache.clear();
  if (previewCache.capacity() > MAX_PREVIEW_CACHE_ENTRIES * 3) {
    previewCache.shrink_to_fit();
  }
  if (coverCache.capacity() > MAX_COVER_CACHE_ENTRIES * 3) {
    coverCache.shrink_to_fit();
  }
  rebuildVisibleItems();
}

void TrackedSeriesActivity::restoreSelection() {
  if (visibleIndices.empty()) {
    selectedIndex = 0;
    selectedTrackedId.clear();
    return;
  }

  const std::string preferredId = !selectedTrackedId.empty() ? selectedTrackedId : g_lastTrackedSeriesId;
  if (!preferredId.empty()) {
    for (size_t index = 0; index < visibleIndices.size(); ++index) {
      if (items[visibleIndices[index]].id == preferredId) {
        selectedIndex = static_cast<int>(index);
        selectedTrackedId = preferredId;
        return;
      }
    }
  }

  selectedIndex = std::max(0, std::min(selectedIndex, static_cast<int>(visibleIndices.size()) - 1));
  selectedTrackedId = items[visibleIndices[selectedIndex]].id;
}

void TrackedSeriesActivity::rebuildVisibleItems() {
  visibleIndices.clear();
  visibleIndices.reserve(items.size());

  for (int i = 0; i < static_cast<int>(items.size()); ++i) {
    if (matchesFilter(items[i])) {
      visibleIndices.push_back(i);
    }
  }

  std::sort(visibleIndices.begin(), visibleIndices.end(), [this](int lhs, int rhs) {
    const auto& a = items[lhs];
    const auto& b = items[rhs];

    if (sortMode == SortMode::Status) {
      const int rankA = statusRank(statusForItem(a));
      const int rankB = statusRank(statusForItem(b));
      if (rankA != rankB) return rankA < rankB;
    } else if (sortMode == SortMode::Chapters && a.chapterCount != b.chapterCount) {
      return a.chapterCount > b.chapterCount;
    }

    return asciiLess(a.title, b.title);
  });

  if (visibleIndices.empty()) {
    selectedIndex = 0;
  } else {
    restoreSelection();
  }
}

void TrackedSeriesActivity::syncSelected(int index) {
  if (index < 0 || index >= static_cast<int>(visibleIndices.size())) return;
  const int itemIndex = visibleIndices[index];
  const CpPluginInfo plugin = resolvePluginForTrackedItem(items[itemIndex]);
  if (!OnlineSourceBridge::supportsTrackedUpdates(plugin)) {
    popupMessage = "Update check unavailable";
    popupUntilMs = millis() + 1800;
    requestUpdate();
    return;
  }
  std::string message;
  BACKGROUND_DOWNLOAD_MANAGER.enqueueTrackedSync(items[itemIndex], &message);
  popupMessage = message;
  popupUntilMs = millis() + 1800;
  requestUpdate();
}

void TrackedSeriesActivity::syncAllTracked() {
  if (items.empty()) {
    popupMessage = "No library items";
    popupUntilMs = millis() + 1800;
    requestUpdate();
    return;
  }

  int queuedCount = 0;
  for (const auto& item : items) {
    const CpPluginInfo plugin = resolvePluginForTrackedItem(item);
    if (!OnlineSourceBridge::supportsTrackedUpdates(plugin)) {
      continue;
    }
    std::string ignoredMessage;
    if (BACKGROUND_DOWNLOAD_MANAGER.enqueueTrackedSync(item, &ignoredMessage)) {
      queuedCount++;
    }
  }

  popupMessage = queuedCount > 0 ? ("Queued " + std::to_string(queuedCount) + " update job(s)") : "No new jobs queued";
  popupUntilMs = millis() + 1800;
  requestUpdate();
}

void TrackedSeriesActivity::openSeriesDetail(int index) {
  if (index < 0 || index >= static_cast<int>(visibleIndices.size())) return;
  const auto selected = items[visibleIndices[index]];
  const CpPluginInfo plugin = resolvePluginForTrackedItem(selected);
  if (!OnlineSourceBridge::supportsNativeUi(plugin)) {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Unsupported source");
    return;
  }

  HakoBookDetail detail;
  {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Loading series...");
    renderer.displayBuffer();
  }
  if (!OnlineSourceBridge::fetchDetail(plugin, selected.seriesUrl, detail)) {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Failed to load series");
    requestUpdate();
    return;
  }
  activityManager.pushActivity(
      std::make_unique<HakoBookDetailActivity>(renderer, mappedInput, plugin, std::move(detail), std::vector<HakoChapterRef>{}));
}

void TrackedSeriesActivity::onEnter() {
  Activity::onEnter();
  filterMode = g_lastFilterMode;
  sortMode = g_lastSortMode;
  reloadItems();
  lastPollMs = millis();
  leftLongHandled = false;
  rightLongHandled = false;
  leftShortPending = false;
  rightShortPending = false;
  noteSelectionChanged();
  requestUpdate();
}

std::string TrackedSeriesActivity::statusForItem(const TrackedSeriesInfo& item) const {
  const auto job = BACKGROUND_DOWNLOAD_MANAGER.getLatestJobForSeries(item.pluginId, item.seriesUrl);
  if (job.has_value() && shouldSurfaceJobStatus(job->status)) {
    std::string summary;
    switch (job->status) {
      case DownloadJobStatus::Queued: summary = "Queued"; break;
      case DownloadJobStatus::Running: summary = "Updating"; break;
      case DownloadJobStatus::RetryWait: summary = "Retry wait"; break;
      case DownloadJobStatus::Failed: summary = "Failed"; break;
      case DownloadJobStatus::Completed:
      case DownloadJobStatus::Cancelled: break;
    }
    return summary;
  }

  const bool hasEpub = hasDownloadedEpub(item);
  if (item.lastReadChapterUrl.empty()) {
    return hasEpub ? "Unread" : "Library";
  }

  if (!item.lastChapterUrl.empty() && item.lastReadChapterUrl == item.lastChapterUrl) {
    return "Current";
  }

  return "New chapters";
}

std::string TrackedSeriesActivity::progressForItem(const TrackedSeriesInfo& item) const {
  const auto job = BACKGROUND_DOWNLOAD_MANAGER.getLatestJobForSeries(item.pluginId, item.seriesUrl);
  if (job.has_value() && shouldSurfaceJobStatus(job->status)) {
    std::string summary;
    if (job->totalChapters > 0) {
      summary = std::to_string(job->completedChapters) + "/" + std::to_string(job->totalChapters) + " ch";
    } else if (item.chapterCount > 0) {
      summary = std::to_string(item.chapterCount) + " ch";
    }

    if (!job->statusMessage.empty()) {
      if (!summary.empty()) summary += " | ";
      summary += job->statusMessage;
    } else if (!job->currentChapterTitle.empty()) {
      if (!summary.empty()) summary += " | ";
      summary += "Now: " + job->currentChapterTitle;
    }

    return summary.empty() ? std::string("Waiting in queue") : summary;
  }

  std::string summary;
  if (item.chapterCount > 0) {
    summary = std::to_string(item.chapterCount) + " ch";
  }

  const bool hasRead = !item.lastReadChapterTitle.empty();
  const bool hasLatest = !item.lastChapterTitle.empty();
  const bool latestChanged = !item.lastChapterUrl.empty() && item.lastChapterUrl != item.lastReadChapterUrl;

  if (hasRead) {
    if (!summary.empty()) summary += " | ";
    summary += "Read: " + item.lastReadChapterTitle;
  }

  if (hasLatest && (!hasRead || latestChanged)) {
    if (!summary.empty()) summary += " | ";
    summary += "Latest: " + item.lastChapterTitle;
  }

  return summary;
}

std::string TrackedSeriesActivity::subtitleForItem(const TrackedSeriesInfo& item) const {
  std::string summary = statusForItem(item);
  const std::string progress = progressForItem(item);
  if (!progress.empty()) {
    summary += " | " + progress;
  }
  return summary;
}

bool TrackedSeriesActivity::matchesFilter(const TrackedSeriesInfo& item) const {
  switch (filterMode) {
    case FilterMode::All: return true;
    case FilterMode::Reading: return !item.lastReadChapterUrl.empty();
    case FilterMode::NeedsUpdate:
      return statusForItem(item) == "New chapters" || statusForItem(item) == "Queued" || statusForItem(item) == "Updating" ||
             statusForItem(item) == "Retry wait" || statusForItem(item) == "Failed";
    case FilterMode::Downloaded: return hasDownloadedEpub(item);
  }
  return true;
}

int TrackedSeriesActivity::selectedItemIndex() const {
  if (selectedIndex < 0 || selectedIndex >= static_cast<int>(visibleIndices.size())) return -1;
  return visibleIndices[selectedIndex];
}

const TrackedSeriesInfo* TrackedSeriesActivity::selectedItem() const {
  const int index = selectedItemIndex();
  return index >= 0 ? &items[index] : nullptr;
}

TrackedSeriesActivity::PreviewCacheEntry* TrackedSeriesActivity::findPreviewEntry(const std::string& url) {
  for (auto& entry : previewCache) {
    if (entry.url == url) return &entry;
  }
  return nullptr;
}

const TrackedSeriesActivity::PreviewCacheEntry* TrackedSeriesActivity::findPreviewEntry(const std::string& url) const {
  for (const auto& entry : previewCache) {
    if (entry.url == url) return &entry;
  }
  return nullptr;
}

TrackedSeriesActivity::CoverCacheEntry* TrackedSeriesActivity::findCoverEntry(const std::string& url) {
  for (auto& entry : coverCache) {
    if (entry.url == url) {
      return &entry;
    }
  }
  return nullptr;
}

const TrackedSeriesActivity::CoverCacheEntry* TrackedSeriesActivity::findCoverEntry(const std::string& url) const {
  for (const auto& entry : coverCache) {
    if (entry.url == url) {
      return &entry;
    }
  }
  return nullptr;
}

void TrackedSeriesActivity::prunePreviewCache(const std::string& keepUrl) {
  while (previewCache.size() > MAX_PREVIEW_CACHE_ENTRIES) {
    auto eraseIt = previewCache.begin();
    if (!keepUrl.empty() && eraseIt->url == keepUrl && previewCache.size() > 1) {
      eraseIt = previewCache.begin() + 1;
    }
    previewCache.erase(eraseIt);
  }
}

void TrackedSeriesActivity::pruneCoverCache(const std::string& keepUrl) {
  while (coverCache.size() > MAX_COVER_CACHE_ENTRIES) {
    auto eraseIt = coverCache.begin();
    if (!keepUrl.empty() && eraseIt->url == keepUrl && coverCache.size() > 1) {
      eraseIt = coverCache.begin() + 1;
    }
    coverCache.erase(eraseIt);
  }
}

void TrackedSeriesActivity::noteSelectionChanged() {
  if (selectedIndex >= 0 && selectedIndex < static_cast<int>(visibleIndices.size())) {
    selectedTrackedId = items[visibleIndices[selectedIndex]].id;
    g_lastTrackedSeriesId = selectedTrackedId;
  }
  previewSelectionIndex = selectedIndex;
  previewSelectionChangedAtMs = millis();
}

void TrackedSeriesActivity::maybeLoadSelectedPreview() {
  const auto* selected = selectedItem();
  if (!selected) return;

  if (previewSelectionIndex != selectedIndex) {
    noteSelectionChanged();
    return;
  }

  auto* cached = findPreviewEntry(selected->seriesUrl);
  if (cached != nullptr && (cached->detailLoaded || cached->failed)) {
    return;
  }

  if (cached == nullptr) {
    previewCache.push_back(PreviewCacheEntry{selected->seriesUrl, "", "", false, false});
    prunePreviewCache(selected->seriesUrl);
    return;
  }

  if (millis() < previewSelectionChangedAtMs + PREVIEW_FETCH_DELAY_MS) {
    return;
  }

  const CpPluginInfo plugin = resolvePluginForTrackedItem(*selected);
  if (!OnlineSourceBridge::supportsNativeUi(plugin)) {
    cached->detailLoaded = true;
    cached->failed = true;
    return;
  }

  HakoBookDetail detail;
  if (!OnlineSourceBridge::fetchDetail(plugin, selected->seriesUrl, detail)) {
    cached->text.clear();
    cached->resolvedCoverUrl.clear();
    cached->detailLoaded = true;
    cached->failed = true;
  } else {
    const std::string previewText =
        OnlineTextUtils::limitPreviewText(OnlineTextUtils::stripHtml(detail.descriptionHtml), 720);
    cached->text = previewText;
    cached->resolvedCoverUrl = detail.coverUrl;
    cached->detailLoaded = true;
    cached->failed = previewText.empty();
  }
  prunePreviewCache(selected->seriesUrl);
  requestUpdate();
}

void TrackedSeriesActivity::maybeLoadSelectedCover() {
  const auto* selected = selectedItem();
  if (!selected || findCoverEntry(selected->seriesUrl) != nullptr) {
    return;
  }

  if (previewSelectionIndex != selectedIndex) {
    noteSelectionChanged();
    return;
  }

  if (millis() < previewSelectionChangedAtMs + COVER_FETCH_DELAY_MS) {
    return;
  }

  const std::string coverUrl = selectedResolvedCoverUrl();
  std::string coverPath;
  const bool ok = !coverUrl.empty() && OnlineCoverStore::tryGetCachedThumb(coverUrl, 72, coverPath);
  coverCache.push_back(CoverCacheEntry{selected->seriesUrl, ok ? coverPath : "", !ok});
  pruneCoverCache(selected->seriesUrl);
  requestUpdate();
}

std::string TrackedSeriesActivity::selectedResolvedCoverUrl() const {
  const auto* selected = selectedItem();
  if (!selected) {
    return "";
  }
  if (!selected->coverUrl.empty()) {
    return selected->coverUrl;
  }
  const auto* cached = findPreviewEntry(selected->seriesUrl);
  return cached == nullptr ? std::string() : cached->resolvedCoverUrl;
}

std::string TrackedSeriesActivity::selectedCoverPath() const {
  const auto* selected = selectedItem();
  if (!selected) {
    return "";
  }
  const auto* cached = findCoverEntry(selected->seriesUrl);
  if (cached != nullptr) {
    return cached->bmpPath;
  }
  if (previewSelectionIndex != selectedIndex || millis() < previewSelectionChangedAtMs + COVER_FETCH_DELAY_MS) {
    return "";
  }

  std::string coverPath;
  const std::string coverUrl = selectedResolvedCoverUrl();
  if (!coverUrl.empty() && OnlineCoverStore::tryGetCachedThumb(coverUrl, 72, coverPath)) {
    return coverPath;
  }
  return "";
}

bool TrackedSeriesActivity::selectedCoverFailed() const {
  const auto* selected = selectedItem();
  if (!selected) {
    return false;
  }
  const auto* cached = findCoverEntry(selected->seriesUrl);
  if (cached != nullptr) {
    return cached->failed;
  }
  if (previewSelectionIndex != selectedIndex || millis() < previewSelectionChangedAtMs + COVER_FETCH_DELAY_MS) {
    return false;
  }

  std::string ignoredCoverPath;
  const std::string coverUrl = selectedResolvedCoverUrl();
  return coverUrl.empty() || !OnlineCoverStore::tryGetCachedThumb(coverUrl, 72, ignoredCoverPath);
}

std::string TrackedSeriesActivity::selectedPreviewText() const {
  const auto* selected = selectedItem();
  if (!selected) return "";
  const auto* cached = findPreviewEntry(selected->seriesUrl);
  return cached == nullptr ? std::string() : StringUtils::toDisplaySafeAscii(cached->text);
}

bool TrackedSeriesActivity::selectedPreviewFailed() const {
  const auto* selected = selectedItem();
  if (!selected) return false;
  const auto* cached = findPreviewEntry(selected->seriesUrl);
  return cached != nullptr && cached->failed;
}

bool TrackedSeriesActivity::selectedPreviewLoading() const {
  const auto* selected = selectedItem();
  if (!selected) return false;
  if (previewSelectionIndex != selectedIndex) return false;
  const auto* cached = findPreviewEntry(selected->seriesUrl);
  if (cached != nullptr && (cached->detailLoaded || cached->failed)) return false;
  return millis() >= previewSelectionChangedAtMs + PREVIEW_FETCH_DELAY_MS;
}

std::string TrackedSeriesActivity::filterLabel() const {
  switch (filterMode) {
    case FilterMode::All: return "All";
    case FilterMode::Reading: return "Reading";
    case FilterMode::NeedsUpdate: return "Needs Update";
    case FilterMode::Downloaded: return "Downloaded";
  }
  return "All";
}

std::string TrackedSeriesActivity::sortLabel() const {
  switch (sortMode) {
    case SortMode::Status: return "Status";
    case SortMode::Title: return "Title";
    case SortMode::Chapters: return "Chapters";
  }
  return "Status";
}

std::string TrackedSeriesActivity::headerSubtitle(int pageItems) const {
  std::string subtitle = filterLabel() + " " + std::to_string(visibleIndices.size()) + "/" + std::to_string(items.size());
  if (!visibleIndices.empty() && pageItems > 0) {
    const int totalPages = (static_cast<int>(visibleIndices.size()) + pageItems - 1) / pageItems;
    if (totalPages > 1) {
      const int currentPage = std::min(totalPages, selectedIndex / pageItems + 1);
      const int pageStart = (currentPage - 1) * pageItems + 1;
      const int pageEnd = std::min(static_cast<int>(visibleIndices.size()), pageStart + pageItems - 1);
      subtitle += " | " + std::to_string(pageStart) + "-" + std::to_string(pageEnd) + "/" +
                  std::to_string(visibleIndices.size());
      subtitle += " | Page " + std::to_string(currentPage) + "/" + std::to_string(totalPages);
    }
  }
  subtitle += " | Sort " + sortLabel();
  return subtitle;
}

std::string TrackedSeriesActivity::emptyStateTitle() const {
  if (items.empty()) {
    return "No stories yet";
  }
  return filterMode == FilterMode::All ? "No stories yet" : ("No " + filterLabel());
}

std::string TrackedSeriesActivity::emptyStateBody() const {
  if (items.empty()) {
    return "Add a story from book detail";
  }
  return "Press Select to reset filter";
}

std::string TrackedSeriesActivity::confirmLabel() const {
  if (visibleIndices.empty()) {
    return items.empty() ? std::string() : std::string("Reset");
  }

  const auto* selected = selectedItem();
  if (!selected) return tr(STR_OPEN);
  const CpPluginInfo plugin = resolvePluginForTrackedItem(*selected);
  if (OnlineSourceBridge::supportsNativeUi(plugin)) return "Details";
  if (hasDownloadedEpub(*selected)) return tr(STR_OPEN);
  return "Details";
}

bool TrackedSeriesActivity::selectedPreviewOverflows() const {
  const auto* selected = selectedItem();
  if (selected == nullptr) {
    return false;
  }

  std::string infoText = selectedPreviewText();
  if (selectedPreviewFailed()) {
    infoText = "Summary unavailable for this story.";
  } else if (infoText.empty()) {
    infoText = selectedPreviewLoading() ? "Loading story summary..." : "Pause on a story to load a fuller summary.";
  }

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int previewHeight = 188;
  const int contentHeight =
      pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2 - previewHeight;
  const int previewTop = contentTop + contentHeight + metrics.verticalSpacing;
  const int previewBoxHeight = previewHeight - metrics.verticalSpacing;
  const int infoY = previewTop + 8 + 92 + 6 + renderer.getLineHeight(UI_10_FONT_ID) + 3;
  const int infoLineHeight = renderer.getLineHeight(UI_10_FONT_ID) + 2;
  const int previewBottomPadding = 8;
  const int hintReserve = 0;
  const int availableInfoHeight = std::max(0, previewTop + previewBoxHeight - previewBottomPadding - infoY - hintReserve);
  const int visibleLines = std::max(1, availableInfoHeight / std::max(1, infoLineHeight));
  const int previewWidth = renderer.getScreenWidth() - metrics.contentSidePadding * 2;
  const auto infoLines = renderer.wrappedText(UI_10_FONT_ID, StringUtils::toDisplaySafeAscii(infoText).c_str(), previewWidth - 16,
                                              MAX_SUMMARY_WRAP_LINES, EpdFontFamily::REGULAR);
  return static_cast<int>(infoLines.size()) > visibleLines;
}

void TrackedSeriesActivity::cycleFilterMode() {
  filterMode = filterMode == FilterMode::All
                   ? FilterMode::Reading
                   : filterMode == FilterMode::Reading ? FilterMode::NeedsUpdate
                                                      : filterMode == FilterMode::NeedsUpdate ? FilterMode::Downloaded
                                                                                              : FilterMode::All;
  g_lastFilterMode = filterMode;
  rebuildVisibleItems();
  popupMessage = "Filter: " + filterLabel();
  popupUntilMs = millis() + 1400;
  requestUpdate();
}

void TrackedSeriesActivity::cycleSortMode() {
  sortMode = sortMode == SortMode::Status ? SortMode::Title : sortMode == SortMode::Title ? SortMode::Chapters : SortMode::Status;
  g_lastSortMode = sortMode;
  rebuildVisibleItems();
  popupMessage = "Sort: " + sortLabel();
  popupUntilMs = millis() + 1400;
  requestUpdate();
}

void TrackedSeriesActivity::loop() {
  if (BACKGROUND_DOWNLOAD_MANAGER.consumeUiRefreshRequested()) {
    reloadItems();
    requestUpdate();
  }

  if (!popupMessage.empty() && millis() >= popupUntilMs) {
    popupMessage.clear();
    requestUpdate();
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Left)) {
    leftShortPending = true;
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Right)) {
    rightShortPending = true;
    return;
  }

  if (leftLongHandled && mappedInput.wasReleased(MappedInputManager::Button::Left)) {
    leftLongHandled = false;
    return;
  }

  if (rightLongHandled && mappedInput.wasReleased(MappedInputManager::Button::Right)) {
    rightLongHandled = false;
    return;
  }

  if (!leftLongHandled && mappedInput.isPressed(MappedInputManager::Button::Left) &&
      leftShortPending && mappedInput.getHeldTime() >= MODE_SWITCH_MS) {
    leftShortPending = false;
    leftLongHandled = true;
    cycleFilterMode();
    return;
  }

  if (!rightLongHandled && mappedInput.isPressed(MappedInputManager::Button::Right) &&
      rightShortPending && mappedInput.getHeldTime() >= MODE_SWITCH_MS) {
    rightShortPending = false;
    rightLongHandled = true;
    cycleSortMode();
    return;
  }

  if (leftShortPending && mappedInput.isPressed(MappedInputManager::Button::Left)) {
    return;
  }

  if (rightShortPending && mappedInput.isPressed(MappedInputManager::Button::Right)) {
    return;
  }

  if ((BACKGROUND_DOWNLOAD_MANAGER.hasActiveWork() || !popupMessage.empty()) && millis() - lastPollMs >= 1500) {
    lastPollMs = millis();
    requestUpdate();
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    finish();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm) && visibleIndices.empty()) {
    if (!items.empty() && filterMode != FilterMode::All) {
      filterMode = FilterMode::All;
      rebuildVisibleItems();
      popupMessage = "Filter: " + filterLabel();
      popupUntilMs = millis() + 1400;
      requestUpdate();
    }
    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Left) && leftShortPending) {
    leftShortPending = false;
    if (!visibleIndices.empty()) {
      syncSelected(selectedIndex);
    }
    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Right) && rightShortPending) {
    rightShortPending = false;
    if (!items.empty()) {
      syncAllTracked();
    }
    return;
  }

  if (visibleIndices.empty()) {
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    const auto* selected = selectedItem();
    if (!selected) return;
    const CpPluginInfo plugin = resolvePluginForTrackedItem(*selected);
    if (OnlineSourceBridge::supportsNativeUi(plugin)) {
      openSeriesDetail(selectedIndex);
    } else if (hasDownloadedEpub(*selected)) {
      activityManager.goToReader(selected->epubPath);
    } else {
      popupMessage = "Unsupported source";
      popupUntilMs = millis() + 1800;
      requestUpdate();
    }
    return;
  }

  buttonNavigator.onNext([this] {
    selectedIndex = ButtonNavigator::nextIndex(selectedIndex, static_cast<int>(visibleIndices.size()));
    noteSelectionChanged();
    requestUpdate();
  });

  buttonNavigator.onPrevious([this] {
    selectedIndex = ButtonNavigator::previousIndex(selectedIndex, static_cast<int>(visibleIndices.size()));
    noteSelectionChanged();
    requestUpdate();
  });

  maybeLoadSelectedPreview();
  maybeLoadSelectedCover();
}

void TrackedSeriesActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const bool showPreviewPanel = !items.empty() && !visibleIndices.empty();
  const int previewHeight = showPreviewPanel ? 188 : 0;
  const int contentHeight =
      pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2 - previewHeight;

  const int pageItems = std::max(1, contentHeight / std::max(1, metrics.listWithSubtitleRowHeight));
  const std::string subtitle = headerSubtitle(pageItems);
  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, "Story Library", subtitle.c_str());

  if (items.empty() || visibleIndices.empty()) {
    renderer.drawCenteredText(UI_12_FONT_ID, pageHeight / 2 - renderer.getLineHeight(UI_12_FONT_ID), emptyStateTitle().c_str());
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 + 4, emptyStateBody().c_str());
    if (!items.empty()) {
      renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 + 18, "Hold Check Updates to change filter");
    }
    SCREEN_DEBUG.setBodyText(emptyStateTitle().c_str(), emptyStateBody().c_str(),
                             items.empty() ? "" : "Hold Check Updates to change filter");
  } else {
    GUI.drawList(renderer, Rect{0, contentTop, pageWidth, contentHeight}, static_cast<int>(visibleIndices.size()), selectedIndex,
                 [this](int index) { return StringUtils::toDisplaySafeAscii(items[visibleIndices[index]].title); },
                 [this](int index) { return StringUtils::toDisplaySafeAscii(subtitleForItem(items[visibleIndices[index]])); },
                 [](int) { return Recent; });

    const auto& selected = items[visibleIndices[selectedIndex]];
    const int previewTop = contentTop + contentHeight + metrics.verticalSpacing;
    const int previewX = metrics.contentSidePadding;
    const int previewWidth = pageWidth - metrics.contentSidePadding * 2;
    const int previewBoxHeight = previewHeight - metrics.verticalSpacing;
    renderer.drawRect(previewX, previewTop, previewWidth, previewBoxHeight);

    const int coverX = previewX + 8;
    const int coverY = previewTop + 8;
    const int coverWidth = 64;
    const int coverHeight = 92;
    renderer.drawRect(coverX, coverY, coverWidth, coverHeight);
    const int coverBottom = coverY + coverHeight;

    const std::string coverPath = selectedCoverPath();
    const bool coverFailed = selectedCoverFailed();
    if (!coverPath.empty()) {
      FsFile coverFile;
      if (Storage.openFileForRead("TRK", coverPath.c_str(), coverFile)) {
        Bitmap bitmap(coverFile);
        if (bitmap.parseHeaders() == BmpReaderError::Ok) {
          renderer.drawBitmap(bitmap, coverX + 1, coverY + 1, coverWidth - 2, coverHeight - 2);
        }
        coverFile.close();
      }
    } else if (coverFailed) {
      renderer.drawText(UI_10_FONT_ID, coverX + 2, coverY + 20, "Cover", true, EpdFontFamily::BOLD);
      renderer.drawText(UI_10_FONT_ID, coverX + 4, coverY + 36, "not", true);
      renderer.drawText(UI_10_FONT_ID, coverX + 1, coverY + 52, "avail.", true);
    } else {
      renderer.drawText(UI_10_FONT_ID, coverX + 7, coverY + 26, "No", true, EpdFontFamily::BOLD);
      renderer.drawText(UI_10_FONT_ID, coverX + 2, coverY + 42, "Cover", true);
    }

    const int textX = coverX + coverWidth + 10;
    int textY = previewTop + 8;
    const int bodyWidth = previewWidth - (textX - previewX) - 8;
    const auto titleLines = renderer.wrappedText(UI_10_FONT_ID, StringUtils::toDisplaySafeAscii(selected.title).c_str(), bodyWidth, 2,
                                                 EpdFontFamily::BOLD);
    for (const auto& line : titleLines) {
      renderer.drawText(UI_10_FONT_ID, textX, textY, line.c_str(), true, EpdFontFamily::BOLD);
      textY += renderer.getLineHeight(UI_10_FONT_ID) + 2;
    }
    const auto metaLines = renderer.wrappedText(UI_10_FONT_ID, StringUtils::toDisplaySafeAscii(subtitleForItem(selected)).c_str(),
                                                bodyWidth, 3, EpdFontFamily::REGULAR);
    for (const auto& line : metaLines) {
      renderer.drawText(UI_10_FONT_ID, textX, textY, line.c_str(), true);
      textY += renderer.getLineHeight(UI_10_FONT_ID) + 2;
    }

    const int infoTop = std::max(coverBottom + 6, textY + 4);
    renderer.drawLine(previewX + 8, infoTop - 4, previewX + previewWidth - 8, infoTop - 4);

    std::string infoText = selectedPreviewText();
    if (selectedPreviewFailed()) {
      infoText = "Summary unavailable for this story.";
    } else if (infoText.empty()) {
      infoText = selectedPreviewLoading() ? "Loading story summary..." : "Pause on a story to load a fuller summary.";
    }

    int infoY = infoTop;
    renderer.drawText(UI_10_FONT_ID, previewX + 8, infoY, "Summary", true, EpdFontFamily::BOLD);
    infoY += renderer.getLineHeight(UI_10_FONT_ID) + 3;
    const int infoLineHeight = renderer.getLineHeight(UI_10_FONT_ID) + 2;
    const int previewBottomPadding = 8;
    const bool showPreviewHint = selectedPreviewOverflows();
    const int hintReserve = showPreviewHint ? (infoLineHeight + 2) : 0;
    const int availableInfoHeight = std::max(0, previewTop + previewBoxHeight - previewBottomPadding - infoY - hintReserve);
    const int maxInfoLines = std::max(1, availableInfoHeight / infoLineHeight);
    const auto infoLines =
        renderer.wrappedText(UI_10_FONT_ID, StringUtils::toDisplaySafeAscii(infoText).c_str(), previewWidth - 16,
                             MAX_SUMMARY_WRAP_LINES,
                             EpdFontFamily::REGULAR);
    const int startLine = 0;
    const int endLine = std::min(static_cast<int>(infoLines.size()), maxInfoLines);
    for (int lineIndex = startLine; lineIndex < endLine; ++lineIndex) {
      if (infoY + renderer.getLineHeight(UI_10_FONT_ID) > previewTop + previewBoxHeight - previewBottomPadding) {
        break;
      }
      renderer.drawText(UI_10_FONT_ID, previewX + 8, infoY, infoLines[lineIndex].c_str(), true);
      infoY += infoLineHeight;
    }

    if (showPreviewHint) {
      const std::string hintText = "Select: open detail for full summary";
      const std::string safeHint = renderer.truncatedText(UI_10_FONT_ID, hintText.c_str(), previewWidth - 16);
      renderer.drawText(UI_10_FONT_ID, previewX + 8,
                        previewTop + previewBoxHeight - previewBottomPadding - renderer.getLineHeight(UI_10_FONT_ID),
                        safeHint.c_str(), true, EpdFontFamily::BOLD);
    }
    SCREEN_DEBUG.setBodyText("Summary", StringUtils::toDisplaySafeAscii(infoText).c_str(),
                             coverDebugStatus(!coverPath.empty(), coverFailed));
  }

  if (!popupMessage.empty()) {
    GUI.drawPopup(renderer, popupMessage.c_str());
  }

  const std::string confirm = confirmLabel();
  const auto labels = mappedInput.mapLabels(tr(STR_BACK), confirm.c_str(), items.empty() ? "" : "Check",
                                            items.empty() ? "" : "All");
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
