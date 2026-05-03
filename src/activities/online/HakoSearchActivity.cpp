#include "HakoSearchActivity.h"

#include <GfxRenderer.h>
#include <I18n.h>
#include <Logging.h>
#include <ESP.h>
#include <freertos/semphr.h>
#include <freertos/task.h>

#include <algorithm>
#include <cctype>
#include <memory>
#include <utility>

#include "../../OnlineCoverStore.h"
#include "../../network/OnlineDebugLog.h"
#include "../../util/ScreenDebugState.h"
#include "../../util/StringUtils.h"
#include "../../plugins/OnlineSourceBridge.h"
#include "../util/KeyboardEntryActivity.h"
#include "HakoBookDetailActivity.h"
#include "OnlineTextUtils.h"
#include "components/UITheme.h"
#include "fontIds.h"

namespace {
constexpr int MAX_SUMMARY_WRAP_LINES = 96;
constexpr uint32_t ONLINE_SOURCE_LOAD_TASK_STACK_BYTES = 12288;
constexpr uint32_t MIN_FREE_HEAP_FOR_PREVIEW_DETAIL = 90000;
constexpr uint32_t MIN_FREE_HEAP_FOR_PREVIEW_COVER_FETCH = 60000;
constexpr uint32_t MIN_LARGEST_BLOCK_FOR_PREVIEW = 70000;
constexpr uint32_t MIN_LARGEST_BLOCK_FOR_PREVIEW_COVER_FETCH = 36000;
constexpr int PREVIEW_COVER_TARGET_HEIGHT = 92;

enum class AsyncLoadKind : uint8_t { Home = 1, Search = 2 };

struct AsyncLoadResult {
  uint32_t token = 0;
  AsyncLoadKind kind = AsyncLoadKind::Home;
  int searchPage = 1;
  bool success = false;
  std::vector<HakoSearchResult> results;
  std::string errorMessage;
};

struct AsyncLoadContext {
  uint32_t token = 0;
  AsyncLoadKind kind = AsyncLoadKind::Home;
  CpPluginInfo pluginInfo;
  std::string query;
  int searchPage = 1;
};

struct AsyncLoadTaskEntry {
  uint32_t token = 0;
  TaskHandle_t handle = nullptr;
};

bool canLoadPreviewDetailNow() {
  return ESP.getFreeHeap() >= MIN_FREE_HEAP_FOR_PREVIEW_DETAIL && ESP.getMaxAllocHeap() >= MIN_LARGEST_BLOCK_FOR_PREVIEW;
}

bool canAttemptPreviewCoverFetchNow() {
  return ESP.getFreeHeap() >= MIN_FREE_HEAP_FOR_PREVIEW_COVER_FETCH &&
         ESP.getMaxAllocHeap() >= MIN_LARGEST_BLOCK_FOR_PREVIEW_COVER_FETCH;
}

SemaphoreHandle_t g_asyncLoadMutex = nullptr;
std::vector<AsyncLoadResult> g_asyncLoadResults;
std::vector<AsyncLoadTaskEntry> g_asyncLoadTasks;
std::vector<uint32_t> g_asyncLoadDiscardedTokens;
uint32_t g_nextAsyncLoadToken = 1;

SemaphoreHandle_t ensureAsyncLoadMutex() {
  if (g_asyncLoadMutex == nullptr) {
    g_asyncLoadMutex = xSemaphoreCreateMutex();
  }
  return g_asyncLoadMutex;
}

uint32_t nextAsyncLoadToken() {
  auto* mutex = ensureAsyncLoadMutex();
  if (mutex == nullptr) {
    return 0;
  }

  xSemaphoreTake(mutex, portMAX_DELAY);
  uint32_t token = g_nextAsyncLoadToken++;
  if (g_nextAsyncLoadToken == 0) {
    g_nextAsyncLoadToken = 1;
  }
  xSemaphoreGive(mutex);
  return token;
}

void storeAsyncLoadResult(AsyncLoadResult&& result) {
  auto* mutex = ensureAsyncLoadMutex();
  if (mutex == nullptr) {
    return;
  }

  xSemaphoreTake(mutex, portMAX_DELAY);
  g_asyncLoadResults.erase(
      std::remove_if(g_asyncLoadResults.begin(), g_asyncLoadResults.end(),
                     [&](const AsyncLoadResult& item) { return item.token == result.token; }),
      g_asyncLoadResults.end());
  g_asyncLoadResults.push_back(std::move(result));
  if (g_asyncLoadResults.size() > 8) {
    g_asyncLoadResults.erase(g_asyncLoadResults.begin(),
                             g_asyncLoadResults.begin() + (g_asyncLoadResults.size() - 8));
  }
  xSemaphoreGive(mutex);
}

bool takeAsyncLoadResult(uint32_t token, AsyncLoadResult& outResult) {
  auto* mutex = ensureAsyncLoadMutex();
  if (mutex == nullptr) {
    return false;
  }

  bool found = false;
  xSemaphoreTake(mutex, portMAX_DELAY);
  for (auto it = g_asyncLoadResults.begin(); it != g_asyncLoadResults.end(); ++it) {
    if (it->token == token) {
      outResult = std::move(*it);
      g_asyncLoadResults.erase(it);
      found = true;
      break;
    }
  }
  xSemaphoreGive(mutex);
  return found;
}

void clearAsyncLoadResult(uint32_t token) {
  auto* mutex = ensureAsyncLoadMutex();
  if (mutex == nullptr) {
    return;
  }

  xSemaphoreTake(mutex, portMAX_DELAY);
  g_asyncLoadResults.erase(
      std::remove_if(g_asyncLoadResults.begin(), g_asyncLoadResults.end(),
                     [&](const AsyncLoadResult& item) { return item.token == token; }),
      g_asyncLoadResults.end());
  xSemaphoreGive(mutex);
}

void registerAsyncLoadTask(uint32_t token, TaskHandle_t handle) {
  auto* mutex = ensureAsyncLoadMutex();
  if (mutex == nullptr) {
    return;
  }

  xSemaphoreTake(mutex, portMAX_DELAY);
  g_asyncLoadTasks.erase(
      std::remove_if(g_asyncLoadTasks.begin(), g_asyncLoadTasks.end(),
                     [&](const AsyncLoadTaskEntry& item) { return item.token == token; }),
      g_asyncLoadTasks.end());
  g_asyncLoadTasks.push_back(AsyncLoadTaskEntry{token, handle});
  xSemaphoreGive(mutex);
}

void markAsyncLoadDiscarded(uint32_t token) {
  auto* mutex = ensureAsyncLoadMutex();
  if (mutex == nullptr || token == 0) {
    return;
  }

  xSemaphoreTake(mutex, portMAX_DELAY);
  const bool exists =
      std::find(g_asyncLoadDiscardedTokens.begin(), g_asyncLoadDiscardedTokens.end(), token) != g_asyncLoadDiscardedTokens.end();
  if (!exists) {
    g_asyncLoadDiscardedTokens.push_back(token);
    if (g_asyncLoadDiscardedTokens.size() > 8) {
      g_asyncLoadDiscardedTokens.erase(
          g_asyncLoadDiscardedTokens.begin(),
          g_asyncLoadDiscardedTokens.begin() + (g_asyncLoadDiscardedTokens.size() - 8));
    }
  }
  xSemaphoreGive(mutex);
}

bool consumeAsyncLoadDiscarded(uint32_t token) {
  auto* mutex = ensureAsyncLoadMutex();
  if (mutex == nullptr || token == 0) {
    return false;
  }

  bool discarded = false;
  xSemaphoreTake(mutex, portMAX_DELAY);
  const auto it = std::find(g_asyncLoadDiscardedTokens.begin(), g_asyncLoadDiscardedTokens.end(), token);
  if (it != g_asyncLoadDiscardedTokens.end()) {
    g_asyncLoadDiscardedTokens.erase(it);
    discarded = true;
  }
  xSemaphoreGive(mutex);
  return discarded;
}

TaskHandle_t unregisterAsyncLoadTask(uint32_t token) {
  auto* mutex = ensureAsyncLoadMutex();
  if (mutex == nullptr) {
    return nullptr;
  }

  TaskHandle_t handle = nullptr;
  xSemaphoreTake(mutex, portMAX_DELAY);
  for (auto it = g_asyncLoadTasks.begin(); it != g_asyncLoadTasks.end(); ++it) {
    if (it->token == token) {
      handle = it->handle;
      g_asyncLoadTasks.erase(it);
      break;
    }
  }
  xSemaphoreGive(mutex);
  return handle;
}

TaskHandle_t findAsyncLoadTask(uint32_t token) {
  auto* mutex = ensureAsyncLoadMutex();
  if (mutex == nullptr) {
    return nullptr;
  }

  TaskHandle_t handle = nullptr;
  xSemaphoreTake(mutex, portMAX_DELAY);
  for (const auto& item : g_asyncLoadTasks) {
    if (item.token == token) {
      handle = item.handle;
      break;
    }
  }
  xSemaphoreGive(mutex);
  return handle;
}

void asyncLoadTaskTrampoline(void* param) {
  std::unique_ptr<AsyncLoadContext> context(static_cast<AsyncLoadContext*>(param));
  AsyncLoadResult result;
  result.token = context ? context->token : 0;
  result.kind = context ? context->kind : AsyncLoadKind::Home;
  result.searchPage = context ? context->searchPage : 1;

  if (context != nullptr) {
    if (context->kind == AsyncLoadKind::Home) {
      result.success = OnlineSourceBridge::fetchHomeFeed(context->pluginInfo, result.results);
    } else {
      result.success = OnlineSourceBridge::search(context->pluginInfo, context->query, context->searchPage, result.results);
    }
    if (!result.success) {
      result.errorMessage = OnlineSourceBridge::getLastError();
    }
  } else {
    result.errorMessage = "Failed to start request";
  }

  const bool discarded = consumeAsyncLoadDiscarded(result.token);
  unregisterAsyncLoadTask(result.token);
  if (!discarded) {
    storeAsyncLoadResult(std::move(result));
  }
  vTaskDelete(nullptr);
}

std::string toLowerAscii(std::string value) {
  std::transform(value.begin(), value.end(), value.begin(),
                 [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
  return value;
}

std::string compactFeedLabel(std::string value) {
  value = StringUtils::toDisplaySafeAscii(OnlineTextUtils::trimAscii(value));
  const std::string normalized = toLowerAscii(OnlineTextUtils::collapseWhitespace(value));
  if (normalized.find("moi nhat") != std::string::npos) return "Moi nhat";
  if (normalized.find("trong ngay") != std::string::npos || normalized.find("doc nhieu") != std::string::npos) {
    return "Hot hom nay";
  }
  if (normalized.find("cap nhat") != std::string::npos) return "Vua cap nhat";
  return value;
}

std::string chapterOnlyTitle(std::string value) {
  value = StringUtils::toDisplaySafeAscii(OnlineTextUtils::trimAscii(value));
  if (value.empty()) return value;

  const size_t lastColon = value.find_last_of(':');
  if (lastColon != std::string::npos && lastColon + 1 < value.size()) {
    const std::string tail = OnlineTextUtils::trimAscii(value.substr(lastColon + 1));
    if (!tail.empty()) {
      return tail;
    }
  }

  const size_t dashPos = value.find(" - ");
  if (dashPos != std::string::npos && dashPos + 3 < value.size()) {
    const std::string tail = OnlineTextUtils::trimAscii(value.substr(dashPos + 3));
    if (!tail.empty()) {
      return tail;
    }
  }

  const std::string lowered = toLowerAscii(value);
  if (lowered.rfind("chuong ", 0) == 0) {
    return "Ch. " + OnlineTextUtils::trimAscii(value.substr(7));
  }

  return value;
}

int computePreviewHeight(int availableBodyHeight) {
  if (availableBodyHeight <= 0) {
    return 0;
  }

  const int target = (availableBodyHeight * 45) / 100;
  const int minHeight = std::min(220, availableBodyHeight);
  const int maxHeight = std::max(minHeight, availableBodyHeight - 120);
  const int desiredHeight = std::max(minHeight, std::min(target, maxHeight));
  return std::min(desiredHeight, std::max(0, availableBodyHeight - 140));
}

bool useRoundedRaffSearchLayout() {
  return SETTINGS.uiTheme == CrossPointSettings::UI_THEME::ROUNDEDRAFF;
}

int computeSearchPreviewHeight(int availableBodyHeight) {
  if (availableBodyHeight <= 0) {
    return 0;
  }

  if (useRoundedRaffSearchLayout()) {
    const int target = availableBodyHeight / 2;
    const int minHeight = std::min(300, availableBodyHeight);
    const int maxHeight = std::max(minHeight, availableBodyHeight - 110);
    const int desiredHeight = std::max(minHeight, std::min(target, maxHeight));
    return std::min(desiredHeight, std::max(0, availableBodyHeight - 150));
  }
  return computePreviewHeight(availableBodyHeight);
}

std::string clampSubtitle(std::string value, size_t maxLength = 88) {
  return StringUtils::toDisplaySafeAscii(
      OnlineTextUtils::limitPreviewText(OnlineTextUtils::trimAscii(value), maxLength));
}

std::string buildResultSubtitle(const HakoSearchResult& result, bool showingHomeFeed) {
  if (!showingHomeFeed) {
    const std::string text = result.description.empty() ? result.url : result.description;
    return clampSubtitle(text, 92);
  }

  if (!result.homeDisplaySubtitle.empty()) {
    return clampSubtitle(result.homeDisplaySubtitle, 88);
  }

  std::string subtitle;
  if (!result.homeSectionLabel.empty()) {
    subtitle = "[" + compactFeedLabel(result.homeSectionLabel) + "]";
  }
  if (!result.homeLatestChapterTitle.empty()) {
    const std::string latest = chapterOnlyTitle(result.homeLatestChapterTitle);
    subtitle = subtitle.empty() ? latest : subtitle + " " + latest;
  } else if (!result.homeVolumeTitle.empty()) {
    subtitle = subtitle.empty() ? result.homeVolumeTitle : subtitle + " " + result.homeVolumeTitle;
  } else if (!result.description.empty()) {
    subtitle = result.description;
  }
  if (subtitle.empty()) {
    subtitle = result.description.empty() ? result.url : result.description;
  }
  return clampSubtitle(subtitle, 88);
}
}  // namespace

int HakoSearchActivity::getDisplayItemCount() const {
  int count = static_cast<int>(results.size());
  if (hasPreviousPage()) count++;
  if (hasNextPage) count++;
  return count;
}

bool HakoSearchActivity::hasPreviousPage() const { return currentPage > 1; }

bool HakoSearchActivity::isPreviousPageItem(int index) const { return hasPreviousPage() && index == 0; }

bool HakoSearchActivity::isNextPageItem(int index) const { return hasNextPage && index == getDisplayItemCount() - 1; }

int HakoSearchActivity::getResultIndex(int displayIndex) const {
  if (isPreviousPageItem(displayIndex) || isNextPageItem(displayIndex)) {
    return -1;
  }
  const int offset = hasPreviousPage() ? 1 : 0;
  const int resultIndex = displayIndex - offset;
  return (resultIndex >= 0 && resultIndex < static_cast<int>(results.size())) ? resultIndex : -1;
}

void HakoSearchActivity::resetPreviewState() {
  previewCache.clear();
  coverCache.clear();
  if (previewCache.capacity() > MAX_PREVIEW_CACHE_ENTRIES * 3) {
    previewCache.shrink_to_fit();
  }
  if (coverCache.capacity() > MAX_COVER_CACHE_ENTRIES * 3) {
    coverCache.shrink_to_fit();
  }
  previewSelectionIndex = -1;
  previewSelectionChangedAtMs = millis();
}

void HakoSearchActivity::noteSelectionChanged() {
  previewSelectionIndex = selectedIndex;
  previewSelectionChangedAtMs = millis();
}

HakoSearchActivity::PreviewCacheEntry* HakoSearchActivity::findPreviewEntry(const std::string& url) {
  for (auto& entry : previewCache) {
    if (entry.url == url) {
      return &entry;
    }
  }
  return nullptr;
}

const HakoSearchActivity::PreviewCacheEntry* HakoSearchActivity::findPreviewEntry(const std::string& url) const {
  for (const auto& entry : previewCache) {
    if (entry.url == url) {
      return &entry;
    }
  }
  return nullptr;
}

HakoSearchActivity::CoverCacheEntry* HakoSearchActivity::findCoverEntry(const std::string& url) {
  for (auto& entry : coverCache) {
    if (entry.url == url) {
      return &entry;
    }
  }
  return nullptr;
}

const HakoSearchActivity::CoverCacheEntry* HakoSearchActivity::findCoverEntry(const std::string& url) const {
  for (const auto& entry : coverCache) {
    if (entry.url == url) {
      return &entry;
    }
  }
  return nullptr;
}

void HakoSearchActivity::prunePreviewCache(const std::string& keepUrl) {
  while (previewCache.size() > MAX_PREVIEW_CACHE_ENTRIES) {
    auto eraseIt = previewCache.begin();
    if (!keepUrl.empty() && eraseIt->url == keepUrl && previewCache.size() > 1) {
      eraseIt = previewCache.begin() + 1;
    }
    previewCache.erase(eraseIt);
  }
}

void HakoSearchActivity::pruneCoverCache(const std::string& keepUrl) {
  while (coverCache.size() > MAX_COVER_CACHE_ENTRIES) {
    auto eraseIt = coverCache.begin();
    if (!keepUrl.empty() && eraseIt->url == keepUrl && coverCache.size() > 1) {
      eraseIt = coverCache.begin() + 1;
    }
    coverCache.erase(eraseIt);
  }
}

void HakoSearchActivity::maybeLoadSelectedPreview() {
  const int resultIndex = getResultIndex(selectedIndex);
  if (resultIndex < 0 || resultIndex >= static_cast<int>(results.size())) {
    return;
  }

  if (previewSelectionIndex != selectedIndex) {
    noteSelectionChanged();
    return;
  }

  const auto& selected = results[resultIndex];
  auto* cached = findPreviewEntry(selected.url);
  if (cached != nullptr && (cached->detailLoaded || cached->failed)) {
    return;
  }

  if (cached == nullptr) {
    previewCache.push_back(PreviewCacheEntry{
        selected.url,
        fallbackPreviewTextForResult(selected),
        OnlineSourceBridge::buildAssetProxyUrl(pluginInfo, selected.coverUrl, selected.url),
        true,
        false});
    prunePreviewCache(selected.url);
    requestUpdate();
  }
}

void HakoSearchActivity::maybeLoadSelectedCover() {
  const int resultIndex = getResultIndex(selectedIndex);
  if (resultIndex < 0 || resultIndex >= static_cast<int>(results.size())) {
    return;
  }

  const auto& selected = results[resultIndex];
  if (findCoverEntry(selected.url) != nullptr) {
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
  if (coverUrl.empty()) {
    coverCache.push_back(CoverCacheEntry{selected.url, "", true});
    pruneCoverCache(selected.url);
    requestUpdate();
    return;
  }

  std::string coverPath;
  if (OnlineCoverStore::tryGetCachedThumb(coverUrl, PREVIEW_COVER_TARGET_HEIGHT, coverPath)) {
    coverCache.push_back(CoverCacheEntry{selected.url, coverPath, false});
    pruneCoverCache(selected.url);
    requestUpdate();
    return;
  }

  if (!canAttemptPreviewCoverFetchNow()) {
    return;
  }

  const bool ok = OnlineCoverStore::getOrCreateThumb(coverUrl, PREVIEW_COVER_TARGET_HEIGHT, coverPath);
  coverCache.push_back(CoverCacheEntry{selected.url, ok ? coverPath : "", !ok});
  pruneCoverCache(selected.url);
  requestUpdate();
}

std::string HakoSearchActivity::fallbackPreviewTextForResult(const HakoSearchResult& result) const {
  const std::string candidate = !result.description.empty() ? result.description : buildResultSubtitle(result, showingHomeFeed);
  return StringUtils::toDisplaySafeAscii(
      OnlineTextUtils::limitPreviewText(OnlineTextUtils::trimAscii(candidate), 220));
}

std::string HakoSearchActivity::selectedResolvedCoverUrl() const {
  const int resultIndex = getResultIndex(selectedIndex);
  if (resultIndex < 0 || resultIndex >= static_cast<int>(results.size())) {
    return "";
  }

  const auto& selected = results[resultIndex];
  if (!selected.coverUrl.empty()) {
    return OnlineSourceBridge::buildAssetProxyUrl(pluginInfo, selected.coverUrl, selected.url);
  }

  const auto* cached = findPreviewEntry(selected.url);
  return cached == nullptr ? std::string()
                           : OnlineSourceBridge::buildAssetProxyUrl(pluginInfo, cached->resolvedCoverUrl, selected.url);
}

std::string HakoSearchActivity::getSelectedPreviewText() const {
  const int resultIndex = getResultIndex(selectedIndex);
  if (resultIndex < 0 || resultIndex >= static_cast<int>(results.size())) {
    if (isPreviousPageItem(selectedIndex)) {
      return "Load the previous result page.";
    }
    if (isNextPageItem(selectedIndex)) {
      return "Load the next result page.";
    }
    return "";
  }

  const auto& selected = results[resultIndex];
  const auto* cached = findPreviewEntry(selected.url);
  if (cached == nullptr) {
    return "";
  }
  return StringUtils::toDisplaySafeAscii(cached->text);
}

bool HakoSearchActivity::selectedPreviewFailed() const {
  const int resultIndex = getResultIndex(selectedIndex);
  if (resultIndex < 0 || resultIndex >= static_cast<int>(results.size())) {
    return false;
  }
  const auto* cached = findPreviewEntry(results[resultIndex].url);
  return cached != nullptr && cached->failed;
}

bool HakoSearchActivity::selectedPreviewLoading() const {
  return false;
}

std::string HakoSearchActivity::getSelectedCoverPath() const {
  const int resultIndex = getResultIndex(selectedIndex);
  if (resultIndex < 0 || resultIndex >= static_cast<int>(results.size())) {
    return "";
  }

  const auto& selected = results[resultIndex];
  const auto* cached = findCoverEntry(selected.url);
  if (cached != nullptr) {
    return cached->bmpPath;
  }
  if (previewSelectionIndex != selectedIndex || millis() < previewSelectionChangedAtMs + COVER_FETCH_DELAY_MS) {
    return "";
  }

  std::string coverPath;
  const std::string coverUrl = selectedResolvedCoverUrl();
  if (!coverUrl.empty() &&
      OnlineCoverStore::tryGetCachedThumb(coverUrl, PREVIEW_COVER_TARGET_HEIGHT, coverPath)) {
    return coverPath;
  }
  return "";
}

bool HakoSearchActivity::selectedCoverFailed() const {
  const int resultIndex = getResultIndex(selectedIndex);
  if (resultIndex < 0 || resultIndex >= static_cast<int>(results.size())) {
    return false;
  }

  const auto& selected = results[resultIndex];
  const auto* cached = findCoverEntry(selected.url);
  if (cached != nullptr) {
    return cached->failed;
  }
  if (previewSelectionIndex != selectedIndex || millis() < previewSelectionChangedAtMs + COVER_FETCH_DELAY_MS) {
    return false;
  }

  const std::string coverUrl = selectedResolvedCoverUrl();
  if (coverUrl.empty()) {
    return true;
  }

  std::string ignoredCoverPath;
  if (OnlineCoverStore::tryGetCachedThumb(coverUrl, PREVIEW_COVER_TARGET_HEIGHT, ignoredCoverPath)) {
    return false;
  }

  return false;
}

int HakoSearchActivity::selectedPreviewVisibleLineCapacity() const {
  if (results.empty()) {
    return 1;
  }

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int availableBodyHeight = pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2;
  const int previewHeight = computeSearchPreviewHeight(availableBodyHeight);
  if (previewHeight <= metrics.verticalSpacing) {
    return 1;
  }
  const int contentHeight = std::max(0, availableBodyHeight - previewHeight);
  const int previewTop = contentTop + contentHeight + metrics.verticalSpacing;
  const int previewBoxHeight = previewHeight - metrics.verticalSpacing;
  const int summaryTop = std::max(previewTop + 8 + 92 + 6, previewTop + 8 + 40);
  const int summaryTextY = summaryTop + renderer.getLineHeight(UI_10_FONT_ID) + 3;
  const int previewLineHeight = renderer.getLineHeight(UI_10_FONT_ID) + 2;
  const int previewBottomPadding = 8;
  const int hintReserve = renderer.getLineHeight(SMALL_FONT_ID) + 6;
  const int availablePreviewHeight =
      std::max(0, previewTop + previewBoxHeight - previewBottomPadding - summaryTextY - hintReserve);
  return std::max(1, availablePreviewHeight / std::max(1, previewLineHeight));
}

bool HakoSearchActivity::selectedPreviewOverflows() const {
  std::string previewText = getSelectedPreviewText();
  if (selectedPreviewFailed()) {
    previewText = "Summary unavailable for this story.";
  } else if (previewText.empty()) {
    previewText = selectedPreviewLoading() ? "Loading story summary..." : "Pause on a story to load a fuller summary.";
  }

  if (previewText.empty()) {
    return 1;
  }

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int previewWidth = renderer.getScreenWidth() - metrics.contentSidePadding * 2;
  const auto previewLines =
      renderer.wrappedText(UI_10_FONT_ID, previewText.c_str(), previewWidth - 16, MAX_SUMMARY_WRAP_LINES, EpdFontFamily::REGULAR);
  const int visibleLines = selectedPreviewVisibleLineCapacity();
  return static_cast<int>(previewLines.size()) > visibleLines;
}

unsigned long HakoSearchActivity::initialHomeFeedDelayMs() const {
  if (pluginInfo.runtimeOrigin == "server") {
    return 0;
  }
  if (pluginInfo.id == "hako" || pluginInfo.runtimeProfile == "hako") {
    return HOME_FEED_SLOW_SOURCE_DELAY_MS;
  }
  return HOME_FEED_INITIAL_DELAY_MS;
}

bool HakoSearchActivity::supportsHomeFeed() const {
  return pluginInfo.runtimeOrigin == "server";
}

namespace {
const char* coverDebugStatus(bool hasCover, bool failed) {
  if (hasCover) return "Cover ready";
  if (failed) return "Cover unavailable";
  return "Text-only preview";
}
}

void HakoSearchActivity::showPopupMessage(const std::string& message, unsigned long durationMs) {
  popupMessage = message;
  popupUntilMs = millis() + durationMs;
  requestUpdate();
}

void HakoSearchActivity::openSearchPrompt() {
  startActivityForResult(
      std::make_unique<KeyboardEntryActivity>(renderer, mappedInput, "Search Online Library", query, 80, InputType::Text),
      [this](const ActivityResult& result) {
        if (result.isCancelled) {
          if (query.empty()) {
            finish();
          } else {
            requestUpdate();
          }
          return;
        }

        query = OnlineTextUtils::trimAscii(std::get<KeyboardResult>(result.data).text);
        if (query.empty()) {
          if (supportsHomeFeed()) {
            queueHomeFeedLoad();
          } else {
            results.clear();
            resetPreviewState();
            currentPage = 1;
            hasNextPage = false;
            errorMessage.clear();
            requestUpdate();
          }
          return;
        }
        if (static_cast<int>(query.size()) < MIN_SEARCH_QUERY_LENGTH) {
          results.clear();
          currentPage = 1;
          hasNextPage = false;
          errorMessage = "Enter at least 3 characters";
          requestUpdate();
          return;
        }

        queueSearchLoad(1);
      });
}

void HakoSearchActivity::triggerHomeFeedAction() {
  if (!supportsHomeFeed()) {
    openSearchPrompt();
    return;
  }

  if (pendingLoadKind == PendingLoadKind::Home) {
    homeFeedLoadEarliestAtMs = millis();
    loadingMessage = "Loading source...";
    requestUpdate();
    return;
  }

  queueHomeFeedLoad();
}

void HakoSearchActivity::queueHomeFeedLoad() {
  showingHomeFeed = true;
  query.clear();
  results.clear();
  resetPreviewState();
  errorMessage.clear();
  currentPage = 1;
  selectedIndex = 0;
  hasNextPage = false;
  isLoading = true;
  loadingMessage = "Loading source...";
  pendingLoadKind = PendingLoadKind::Home;
  pendingSearchPage = 1;
  homeFeedLoadEarliestAtMs = millis() + initialHomeFeedDelayMs();
  requestUpdate();
}

void HakoSearchActivity::queueSearchLoad(int page) {
  showingHomeFeed = false;
  results.clear();
  resetPreviewState();
  errorMessage.clear();
  currentPage = page < 1 ? 1 : page;
  selectedIndex = 0;
  hasNextPage = false;
  isLoading = true;
  loadingMessage = "Searching...";
  pendingLoadKind = PendingLoadKind::Search;
  pendingSearchPage = currentPage;
  homeFeedLoadEarliestAtMs = 0;
  requestUpdate();
}

void HakoSearchActivity::executePendingLoad() {
  if (pendingLoadKind == PendingLoadKind::None || activeLoadToken != 0) {
    return;
  }

  const PendingLoadKind loadKind = pendingLoadKind;
  if (loadKind == PendingLoadKind::Home && millis() < homeFeedLoadEarliestAtMs) {
    return;
  }

  if (loadKind == PendingLoadKind::Search && static_cast<int>(query.size()) < MIN_SEARCH_QUERY_LENGTH) {
    pendingLoadKind = PendingLoadKind::None;
    isLoading = false;
    loadingMessage.clear();
    errorMessage = "Enter at least 3 characters";
    requestUpdate();
    return;
  }

  std::unique_ptr<AsyncLoadContext> context(new AsyncLoadContext{});
  context->token = nextAsyncLoadToken();
  if (context->token == 0) {
    pendingLoadKind = PendingLoadKind::None;
    isLoading = false;
    loadingMessage.clear();
    errorMessage = "Failed to start request";
    requestUpdate();
    return;
  }
  context->kind = loadKind == PendingLoadKind::Home ? AsyncLoadKind::Home : AsyncLoadKind::Search;
  context->pluginInfo = pluginInfo;
  context->query = query;
  context->searchPage = pendingSearchPage < 1 ? 1 : pendingSearchPage;

  activeLoadToken = context->token;
  pendingLoadKind = PendingLoadKind::None;
  errorMessage.clear();

  TaskHandle_t taskHandle = nullptr;
  if (xTaskCreate(&asyncLoadTaskTrampoline, "OnlineSourceLoad", ONLINE_SOURCE_LOAD_TASK_STACK_BYTES, context.release(), 1,
                  &taskHandle) != pdPASS) {
    activeLoadToken = 0;
    activeLoadTaskHandle = nullptr;
    isLoading = false;
    loadingMessage.clear();
    errorMessage = "Failed to start request";
    requestUpdate();
    return;
  }
  activeLoadTaskHandle = taskHandle;
  registerAsyncLoadTask(activeLoadToken, taskHandle);
}

void HakoSearchActivity::pollAsyncLoad() {
  if (activeLoadToken == 0) {
    return;
  }

  AsyncLoadResult result;
  if (!takeAsyncLoadResult(activeLoadToken, result)) {
    return;
  }

  activeLoadToken = 0;
  activeLoadTaskHandle = nullptr;
  isLoading = false;
  loadingMessage.clear();
  results.clear();
  hasNextPage = false;

  if (result.kind == AsyncLoadKind::Home) {
    homeFeedLoadEarliestAtMs = 0;
    if (!result.success) {
      errorMessage = result.errorMessage.empty() ? "Failed to load source" : result.errorMessage;
      LOG_ERR("ONLINE", "Home feed load failed for %s: %s", pluginInfo.id.c_str(), errorMessage.c_str());
    } else {
      results = std::move(result.results);
      if (results.empty()) {
        errorMessage = "No stories found";
      }
    }
  } else {
    currentPage = result.searchPage < 1 ? 1 : result.searchPage;
    if (!result.success) {
      errorMessage = result.errorMessage.empty() ? "Search failed" : result.errorMessage;
      LOG_ERR("ONLINE", "Search failed for %s: %s", pluginInfo.id.c_str(), errorMessage.c_str());
    } else {
      results = std::move(result.results);
      if (results.empty()) {
        errorMessage = currentPage == 1 ? "No results found" : "No more results";
      } else {
        hasNextPage = static_cast<int>(results.size()) >= SEARCH_PAGE_SIZE;
      }
    }
  }

  if (!results.empty()) {
    noteSelectionChanged();
  }
  requestUpdate();
}

void HakoSearchActivity::cancelActiveLoad() {
  pendingLoadKind = PendingLoadKind::None;
  homeFeedLoadEarliestAtMs = 0;

  if (activeLoadToken != 0) {
    markAsyncLoadDiscarded(activeLoadToken);
    unregisterAsyncLoadTask(activeLoadToken);
    clearAsyncLoadResult(activeLoadToken);
  }

  activeLoadToken = 0;
  activeLoadTaskHandle = nullptr;
  isLoading = false;
  loadingMessage.clear();
}

void HakoSearchActivity::onEnter() {
  Activity::onEnter();
  OnlineDebugLog::logProbe("HakoSearchActivity::onEnter", pluginInfo.id);
  hasRenderedOnce = false;
  resetPreviewState();
  if (supportsHomeFeed()) {
    queueHomeFeedLoad();
    return;
  }

  showingHomeFeed = false;
  query.clear();
  results.clear();
  errorMessage.clear();
  loadingMessage.clear();
  pendingLoadKind = PendingLoadKind::None;
  isLoading = false;
  currentPage = 1;
  selectedIndex = 0;
  hasNextPage = false;
  homeFeedLoadEarliestAtMs = 0;
  requestUpdate();
}

void HakoSearchActivity::onExit() {
  cancelActiveLoad();
  resetPreviewState();
  results.clear();
  if (results.capacity() > SEARCH_PAGE_SIZE * 2) {
    results.shrink_to_fit();
  }
  errorMessage.clear();
  query.clear();
  loadingMessage.clear();
  popupMessage.clear();
  OnlineSourceBridge::clearMemoryCaches();
  Activity::onExit();
}

void HakoSearchActivity::loop() {
  pollAsyncLoad();

  if (!popupMessage.empty() && millis() >= popupUntilMs) {
    popupMessage.clear();
    requestUpdate();
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    cancelActiveLoad();
    finish();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Left)) {
    openSearchPrompt();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Right)) {
    triggerHomeFeedAction();
    return;
  }

  if (pendingLoadKind != PendingLoadKind::None && hasRenderedOnce) {
    executePendingLoad();
    return;
  }

  if (activeLoadToken != 0) {
    return;
  }

  if (results.empty()) {
    if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
      openSearchPrompt();
    }
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    if (isPreviousPageItem(selectedIndex)) {
      queueSearchLoad(currentPage - 1);
      return;
    }
    if (isNextPageItem(selectedIndex)) {
      queueSearchLoad(currentPage + 1);
      return;
    }

    const int resultIndex = getResultIndex(selectedIndex);
    if (resultIndex < 0 || resultIndex >= static_cast<int>(results.size())) {
      return;
    }
    const auto selected = results[resultIndex];
    HakoBookDetail detail;
    {
      RenderLock lock(*this);
      GUI.drawPopup(renderer, "Loading book...");
      renderer.displayBuffer();
    }
    if (!OnlineSourceBridge::fetchDetail(pluginInfo, selected.url, detail)) {
      errorMessage = OnlineSourceBridge::getLastError();
      if (errorMessage.empty()) {
        errorMessage = "Failed to load book";
      }
      showPopupMessage(errorMessage);
      return;
    }
    activityManager.pushActivity(
        std::make_unique<HakoBookDetailActivity>(renderer, mappedInput, pluginInfo, std::move(detail), std::vector<HakoChapterRef>{}));
    return;
  }

  buttonNavigator.onNext([this] {
    selectedIndex = ButtonNavigator::nextIndex(selectedIndex, getDisplayItemCount());
    noteSelectionChanged();
    requestUpdate();
  });

  buttonNavigator.onPrevious([this] {
    selectedIndex = ButtonNavigator::previousIndex(selectedIndex, getDisplayItemCount());
    noteSelectionChanged();
    requestUpdate();
  });

  maybeLoadSelectedPreview();
  maybeLoadSelectedCover();
}

void HakoSearchActivity::render(RenderLock&&) {
  hasRenderedOnce = true;
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const bool showPreviewPanel = !results.empty();
  const int availableBodyHeight = pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2;
  const bool compactRoundedPreview = useRoundedRaffSearchLayout();
  const int previewHeight = showPreviewPanel ? computeSearchPreviewHeight(availableBodyHeight) : 0;
  const int contentHeight = std::max(0, availableBodyHeight - previewHeight);

  std::string subtitle;
  if (showingHomeFeed) {
    subtitle = "Home | LEFT search";
  } else if (query.empty()) {
    subtitle = "Search";
  } else {
    subtitle = StringUtils::toDisplaySafeAscii(query) + " | Page " + std::to_string(currentPage);
  }
  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, pluginInfo.name.c_str(), subtitle.c_str());

  if (results.empty()) {
    const char* primaryText = nullptr;
    if (isLoading && !loadingMessage.empty()) {
      primaryText = loadingMessage.c_str();
    } else {
      primaryText = errorMessage.empty() ? "Press LEFT to search" : errorMessage.c_str();
    }
    renderer.drawCenteredText(UI_12_FONT_ID, pageHeight / 2 - renderer.getLineHeight(UI_12_FONT_ID), primaryText);
    SCREEN_DEBUG.setBodyText(primaryText);
  } else {
    GUI.drawList(renderer, Rect{0, contentTop, pageWidth, contentHeight}, getDisplayItemCount(), selectedIndex,
                 [this](int index) {
                   if (isPreviousPageItem(index)) return std::string("Previous Page");
                   if (isNextPageItem(index)) return std::string("Next Page");
                   const int resultIndex = getResultIndex(index);
                   return resultIndex >= 0 ? StringUtils::toDisplaySafeAscii(results[resultIndex].title) : std::string();
                 },
                 [this](int index) {
                   if (isPreviousPageItem(index)) return std::string("Load page ") + std::to_string(currentPage - 1);
                   if (isNextPageItem(index)) return std::string("Load page ") + std::to_string(currentPage + 1);
                   const int resultIndex = getResultIndex(index);
                   if (resultIndex < 0) return std::string();
                   return buildResultSubtitle(results[resultIndex], showingHomeFeed);
                 },
                 [this](int index) { return (isPreviousPageItem(index) || isNextPageItem(index)) ? Recent : Book; });

    const int previewTop = contentTop + contentHeight + metrics.verticalSpacing;
    const int previewX = metrics.contentSidePadding;
    const int previewWidth = pageWidth - metrics.contentSidePadding * 2;
    const int previewBoxHeight = std::max(0, previewHeight - metrics.verticalSpacing);
    const std::string coverPath = getSelectedCoverPath();
    const bool coverFailed = selectedCoverFailed();

    if (previewBoxHeight > 0) {
      renderer.drawRect(previewX, previewTop, previewWidth, previewBoxHeight);

      const int coverBoxWidth = 64;
      const int coverBoxHeight = 92;
      const int coverX = previewX + 8;
      const int coverY = previewTop + 8;
      renderer.drawRect(coverX, coverY, coverBoxWidth, coverBoxHeight);
      const int coverBottom = coverY + coverBoxHeight;

      if (!coverPath.empty()) {
        FsFile coverFile;
        if (Storage.openFileForRead("HSR", coverPath.c_str(), coverFile)) {
          Bitmap bitmap(coverFile);
          if (bitmap.parseHeaders() == BmpReaderError::Ok) {
            renderer.drawBitmap(bitmap, coverX + 1, coverY + 1, coverBoxWidth - 2, coverBoxHeight - 2);
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

      const int textX = coverX + coverBoxWidth + 10;
      int textY = previewTop + 8;
      const int resultIndex = getResultIndex(selectedIndex);
      const std::string selectedTitle =
          resultIndex >= 0 ? StringUtils::toDisplaySafeAscii(results[resultIndex].title) : std::string("Selected Story");
      const int headerTextWidth = previewWidth - (textX - previewX) - 8;
      const int maxTitleLines = compactRoundedPreview ? 1 : 2;
      const auto titleLines =
          renderer.wrappedText(UI_10_FONT_ID, selectedTitle.c_str(), headerTextWidth, maxTitleLines, EpdFontFamily::BOLD);
      for (const auto& line : titleLines) {
        renderer.drawText(UI_10_FONT_ID, textX, textY, line.c_str(), true, EpdFontFamily::BOLD);
        textY += renderer.getLineHeight(UI_10_FONT_ID) + 1;
      }

      if (resultIndex >= 0) {
        const std::string metaLine = buildResultSubtitle(results[resultIndex], showingHomeFeed);
        const int maxMetaLines = compactRoundedPreview ? 2 : 3;
        const auto metaLines =
            renderer.wrappedText(UI_10_FONT_ID, metaLine.c_str(), headerTextWidth, maxMetaLines, EpdFontFamily::REGULAR);
        for (const auto& line : metaLines) {
          renderer.drawText(UI_10_FONT_ID, textX, textY, line.c_str(), true);
          textY += renderer.getLineHeight(UI_10_FONT_ID);
        }
      }

      std::string previewText = getSelectedPreviewText();
      if (selectedPreviewFailed()) {
        previewText = "Summary unavailable for this story.";
      } else if (previewText.empty()) {
        previewText = selectedPreviewLoading() ? "Loading story summary..." : "Pause on a story to load a fuller summary.";
      }

      const int summaryTop = std::max(coverBottom + 6, textY + 6);
      renderer.drawLine(previewX + 8, summaryTop - 4, previewX + previewWidth - 8, summaryTop - 4);
      renderer.drawText(UI_10_FONT_ID, previewX + 8, summaryTop, "Summary", true, EpdFontFamily::BOLD);

      const int previewLineHeight = renderer.getLineHeight(UI_10_FONT_ID) + 2;
      const int previewBottomPadding = 8;
      const int summaryTextY = summaryTop + renderer.getLineHeight(UI_10_FONT_ID) + 3;
      const bool compactPreview = previewBoxHeight < 170 || compactRoundedPreview;
      const bool showPreviewHint = selectedPreviewOverflows() && !compactPreview;
      const int hintReserve = showPreviewHint ? (renderer.getLineHeight(SMALL_FONT_ID) + 6) : 0;
      const int availablePreviewHeight =
          std::max(0, previewTop + previewBoxHeight - previewBottomPadding - summaryTextY - hintReserve);
      const int maxPreviewLines = std::max(1, availablePreviewHeight / previewLineHeight);
      const auto previewLines = renderer.wrappedText(UI_10_FONT_ID, previewText.c_str(), previewWidth - 16,
                                                     MAX_SUMMARY_WRAP_LINES, EpdFontFamily::REGULAR);
      const int endLine = std::min(static_cast<int>(previewLines.size()), maxPreviewLines);
      textY = summaryTextY;
      for (int lineIndex = 0; lineIndex < endLine; ++lineIndex) {
        if (textY + renderer.getLineHeight(UI_10_FONT_ID) > previewTop + previewBoxHeight - previewBottomPadding) {
          break;
        }
        renderer.drawText(UI_10_FONT_ID, previewX + 8, textY, previewLines[lineIndex].c_str(), true);
        textY += previewLineHeight;
      }

      if (showPreviewHint) {
        const std::string hintText = "Select: open detail";
        const std::string safeHint = renderer.truncatedText(SMALL_FONT_ID, hintText.c_str(), previewWidth - 16);
        const int hintY =
            previewTop + previewBoxHeight - previewBottomPadding - renderer.getLineHeight(SMALL_FONT_ID);
        renderer.drawLine(previewX + 8, hintY - 3, previewX + previewWidth - 8, hintY - 3);
        renderer.drawText(SMALL_FONT_ID, previewX + 8, hintY, safeHint.c_str(), true, EpdFontFamily::REGULAR);
      }
      SCREEN_DEBUG.setBodyText("Summary", previewText.c_str(), coverDebugStatus(!coverPath.empty(), coverFailed));
    }
  }

  if (!popupMessage.empty()) {
    GUI.drawPopup(renderer, popupMessage.c_str());
  }

  const char* rightLabel = supportsHomeFeed() ? (showingHomeFeed ? "Refresh" : "Home") : "";
  const auto labels = mappedInput.mapLabels(tr(STR_BACK), tr(STR_SELECT), "Search", rightLabel);
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
