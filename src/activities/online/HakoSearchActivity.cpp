#include "HakoSearchActivity.h"

#include <GfxRenderer.h>
#include <I18n.h>
#include <Logging.h>

#include <algorithm>
#include <cctype>
#include <utility>

#include "../../OnlineCoverStore.h"
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
    previewCache.push_back(PreviewCacheEntry{selected.url, fallbackPreviewTextForResult(selected), "", false, false});
    prunePreviewCache(selected.url);
    requestUpdate();
    return;
  }

  const unsigned long now = millis();
  if (now < previewSelectionChangedAtMs + PREVIEW_FETCH_DELAY_MS) {
    return;
  }

  HakoBookDetail detail;
  if (!OnlineSourceBridge::fetchDetail(pluginInfo, selected.url, detail)) {
    cached->text.clear();
    cached->resolvedCoverUrl.clear();
    cached->detailLoaded = true;
    cached->failed = true;
  } else {
    std::string previewText = OnlineTextUtils::stripHtml(detail.descriptionHtml);
    previewText = OnlineTextUtils::limitPreviewText(previewText, 520);
    cached->text = previewText.empty() ? cached->text : previewText;
    cached->resolvedCoverUrl = selected.coverUrl.empty() ? detail.coverUrl : selected.coverUrl;
    cached->detailLoaded = true;
    cached->failed = previewText.empty();
  }
  prunePreviewCache(selected.url);

  requestUpdate();
}

void HakoSearchActivity::maybeLoadSelectedCover() {
  const int resultIndex = getResultIndex(selectedIndex);
  if (resultIndex < 0 || resultIndex >= static_cast<int>(results.size())) {
    return;
  }

  if (previewSelectionIndex != selectedIndex) {
    return;
  }

  const auto& selected = results[resultIndex];
  if (findCoverEntry(selected.url) != nullptr) {
    return;
  }

  const unsigned long now = millis();
  if (now < previewSelectionChangedAtMs + COVER_FETCH_DELAY_MS) {
    return;
  }

  const std::string coverUrl = selectedResolvedCoverUrl();
  std::string coverPath;
  const bool coverOk = !coverUrl.empty() && OnlineCoverStore::tryGetCachedThumb(coverUrl, 72, coverPath);
  coverCache.push_back(CoverCacheEntry{selected.url, coverOk ? coverPath : "", !coverOk});
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
    return selected.coverUrl;
  }

  const auto* cached = findPreviewEntry(selected.url);
  return cached == nullptr ? std::string() : cached->resolvedCoverUrl;
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
  const int resultIndex = getResultIndex(selectedIndex);
  if (resultIndex < 0 || resultIndex >= static_cast<int>(results.size())) {
    return false;
  }
  if (previewSelectionIndex != selectedIndex) {
    return false;
  }
  const auto& selected = results[resultIndex];
  const auto* cached = findPreviewEntry(selected.url);
  if (cached != nullptr && (cached->detailLoaded || cached->failed)) {
    return false;
  }
  const unsigned long now = millis();
  if (now < previewSelectionChangedAtMs + PREVIEW_FETCH_DELAY_MS) {
    return false;
  }
  return true;
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
  if (!coverUrl.empty() && OnlineCoverStore::tryGetCachedThumb(coverUrl, 72, coverPath)) {
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

  std::string ignoredCoverPath;
  const std::string coverUrl = selectedResolvedCoverUrl();
  return coverUrl.empty() || !OnlineCoverStore::tryGetCachedThumb(coverUrl, 72, ignoredCoverPath);
}

int HakoSearchActivity::selectedPreviewVisibleLineCapacity() const {
  if (results.empty()) {
    return 1;
  }

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int previewHeight = 188;
  const int contentHeight =
      pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2 - previewHeight;
  const int previewTop = contentTop + contentHeight + metrics.verticalSpacing;
  const int previewBoxHeight = previewHeight - metrics.verticalSpacing;
  const int summaryTop = std::max(previewTop + 8 + 92 + 6, previewTop + 8 + 40);
  const int summaryTextY = summaryTop + renderer.getLineHeight(UI_10_FONT_ID) + 3;
  const int previewLineHeight = renderer.getLineHeight(UI_10_FONT_ID) + 2;
  const int previewBottomPadding = 8;
  const int availablePreviewHeight = std::max(0, previewTop + previewBoxHeight - previewBottomPadding - summaryTextY);
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
  if (pluginInfo.id == "hako" || pluginInfo.runtimeProfile == "hako") {
    return HOME_FEED_SLOW_SOURCE_DELAY_MS;
  }
  return HOME_FEED_INITIAL_DELAY_MS;
}

namespace {
const char* coverDebugStatus(bool hasCover, bool failed) {
  if (hasCover) return "Cover ready";
  if (failed) return "Cover unavailable";
  return "Cover pending";
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
          queueHomeFeedLoad();
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
  loadingMessage = "Pause to load source...";
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
  if (pendingLoadKind == PendingLoadKind::None) {
    return;
  }

  const PendingLoadKind loadKind = pendingLoadKind;
  if (loadKind == PendingLoadKind::Home && millis() < homeFeedLoadEarliestAtMs) {
    return;
  }

  pendingLoadKind = PendingLoadKind::None;
  errorMessage.clear();

  if (loadKind == PendingLoadKind::Home) {
    homeFeedLoadEarliestAtMs = 0;
    if (!OnlineSourceBridge::fetchHomeFeed(pluginInfo, results)) {
      errorMessage = "Failed to load source";
    } else if (results.empty()) {
      errorMessage = "No stories found";
    }
  } else {
    currentPage = pendingSearchPage < 1 ? 1 : pendingSearchPage;
    if (static_cast<int>(query.size()) < MIN_SEARCH_QUERY_LENGTH) {
      errorMessage = "Enter at least 3 characters";
    } else if (!OnlineSourceBridge::search(pluginInfo, query, currentPage, results)) {
      errorMessage = "Search failed";
    } else if (results.empty()) {
      errorMessage = currentPage == 1 ? "No results found" : "No more results";
    } else {
      hasNextPage = static_cast<int>(results.size()) >= SEARCH_PAGE_SIZE;
    }
  }

  isLoading = false;
  loadingMessage.clear();
  if (!results.empty()) {
    noteSelectionChanged();
  }
  requestUpdate();
}

void HakoSearchActivity::onEnter() {
  Activity::onEnter();
  hasRenderedOnce = false;
  resetPreviewState();
  queueHomeFeedLoad();
}

void HakoSearchActivity::loop() {
  if (!popupMessage.empty() && millis() >= popupUntilMs) {
    popupMessage.clear();
    requestUpdate();
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
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
      errorMessage = "Failed to load book";
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
  const int previewHeight = showPreviewPanel ? 188 : 0;
  const int contentHeight =
      pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2 - previewHeight;

  std::string subtitle;
  if (showingHomeFeed) {
    subtitle = "Home | LEFT search";
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
    const int previewBoxHeight = previewHeight - metrics.verticalSpacing;
    renderer.drawRect(previewX, previewTop, previewWidth, previewBoxHeight);

    const int coverBoxWidth = 64;
    const int coverBoxHeight = 92;
    const int coverX = previewX + 8;
    const int coverY = previewTop + 8;
    renderer.drawRect(coverX, coverY, coverBoxWidth, coverBoxHeight);
    const int coverBottom = coverY + coverBoxHeight;

    const std::string coverPath = getSelectedCoverPath();
    const bool coverFailed = selectedCoverFailed();
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
    const auto titleLines =
        renderer.wrappedText(UI_10_FONT_ID, selectedTitle.c_str(), headerTextWidth, 2, EpdFontFamily::BOLD);
    for (const auto& line : titleLines) {
      renderer.drawText(UI_10_FONT_ID, textX, textY, line.c_str(), true, EpdFontFamily::BOLD);
      textY += renderer.getLineHeight(UI_10_FONT_ID) + 1;
    }

    if (resultIndex >= 0) {
      const std::string metaLine = buildResultSubtitle(results[resultIndex], showingHomeFeed);
      const auto metaLines = renderer.wrappedText(UI_10_FONT_ID, metaLine.c_str(), headerTextWidth, 3, EpdFontFamily::REGULAR);
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
    const bool showPreviewHint = selectedPreviewOverflows();
    const int hintReserve = showPreviewHint ? (previewLineHeight + 2) : 0;
    const int availablePreviewHeight =
        std::max(0, previewTop + previewBoxHeight - previewBottomPadding - summaryTextY - hintReserve);
    const int maxPreviewLines = std::max(1, availablePreviewHeight / previewLineHeight);
    const auto previewLines = renderer.wrappedText(UI_10_FONT_ID, previewText.c_str(), previewWidth - 16, MAX_SUMMARY_WRAP_LINES,
                                                   EpdFontFamily::REGULAR);
    const int startLine = 0;
    const int endLine = std::min(static_cast<int>(previewLines.size()), maxPreviewLines);
    textY = summaryTextY;
    for (int lineIndex = startLine; lineIndex < endLine; ++lineIndex) {
      if (textY + renderer.getLineHeight(UI_10_FONT_ID) > previewTop + previewBoxHeight - previewBottomPadding) {
        break;
      }
      renderer.drawText(UI_10_FONT_ID, previewX + 8, textY, previewLines[lineIndex].c_str(), true);
      textY += previewLineHeight;
    }

    if (showPreviewHint) {
      const std::string hintText = "Select: open detail for full summary";
      const std::string safeHint = renderer.truncatedText(UI_10_FONT_ID, hintText.c_str(), previewWidth - 16);
      renderer.drawText(UI_10_FONT_ID, previewX + 8, previewTop + previewBoxHeight - previewBottomPadding - renderer.getLineHeight(UI_10_FONT_ID),
                        safeHint.c_str(), true, EpdFontFamily::BOLD);
    }
    SCREEN_DEBUG.setBodyText("Summary", previewText.c_str(), coverDebugStatus(!coverPath.empty(), coverFailed));
  }

  if (!popupMessage.empty()) {
    GUI.drawPopup(renderer, popupMessage.c_str());
  }

  const char* rightLabel = showingHomeFeed ? "Refresh" : "Home";
  const auto labels = mappedInput.mapLabels(tr(STR_BACK), tr(STR_SELECT), "Search", rightLabel);
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
