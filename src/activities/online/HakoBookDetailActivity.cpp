#include "HakoBookDetailActivity.h"

#include <algorithm>

#include <GfxRenderer.h>
#include <HalGPIO.h>
#include <HalStorage.h>
#include <I18n.h>
#include <Logging.h>

#include "../../OnlineLibrarySettingsStore.h"
#include "../../OnlineCoverStore.h"
#include "../../TrackedSeriesStore.h"
#include "../../plugins/OnlineSourceBridge.h"
#include "../../util/StringUtils.h"
#include "HakoChapterListActivity.h"
#include "HakoChapterReaderActivity.h"
#include "OnlineTextUtils.h"
#include "components/UITheme.h"
#include "fontIds.h"

namespace {
constexpr unsigned long SUMMARY_MODE_SWITCH_MS = 700;
constexpr int MAX_SUMMARY_WRAP_LINES = 128;
constexpr int TOC_PAGE_SIZE = 50;

HakoDownloadOptions makeForegroundDownloadOptions() {
  ONLINE_LIBRARY_SETTINGS_STORE.loadFromDisk();
  const auto& settings = ONLINE_LIBRARY_SETTINGS_STORE.get();

  HakoDownloadOptions options;
  options.chapterDelayMinMs = 0;
  options.chapterDelayMaxMs = 0;
  options.batchSize = 0;
  options.batchDelayMinMs = 0;
  options.batchDelayMaxMs = 0;
  options.chapterRetryCount = settings.chapterRetryCount;
  options.chapterRetryDelayMinMs = settings.chapterRetryDelaySec * 1000UL;
  options.chapterRetryDelayMaxMs = settings.chapterRetryDelaySec * 1000UL;
  return options;
}

int progressPercentForForegroundDownload(const HakoProgressState& state) {
  if (state.message == "Loading series") {
    return 5;
  }
  if (state.message == "Preparing EPUB") {
    return 10;
  }
  if (state.message == "Finalizing EPUB") {
    return 95;
  }
  if (state.totalChapters > 0) {
    const uint32_t completed = state.completedChapters > state.totalChapters ? state.totalChapters : state.completedChapters;
    return 10 + static_cast<int>((completed * 80U) / state.totalChapters);
  }
  return 10;
}

std::string popupLabelForForegroundDownload(const HakoProgressState& state) {
  std::string label = state.message.empty() ? std::string("Working...") : state.message;
  if (!state.chapterTitle.empty()) {
    label += ": ";
    label += StringUtils::toDisplaySafeAscii(state.chapterTitle);
  }
  return label;
}

std::string lowerAscii(std::string value) {
  std::transform(value.begin(), value.end(), value.begin(),
                 [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
  return value;
}

int findChapterIndexByUrl(const std::vector<HakoChapterRef>& chapters, const std::string& url) {
  auto normalizeUrl = [](std::string value) {
    const size_t queryPos = value.find_first_of("?#");
    if (queryPos != std::string::npos) {
      value.resize(queryPos);
    }
    while (value.size() > 1 && value.back() == '/') {
      value.pop_back();
    }
    return lowerAscii(value);
  };

  const std::string normalizedUrl = normalizeUrl(url);
  for (size_t i = 0; i < chapters.size(); ++i) {
    if (chapters[i].url == url) {
      return static_cast<int>(i);
    }
    if (!normalizedUrl.empty() && normalizeUrl(chapters[i].url) == normalizedUrl) {
      return static_cast<int>(i);
    }
  }
  return -1;
}

int findChapterIndexForRef(const std::vector<HakoChapterRef>& chapters, const HakoChapterRef& ref) {
  if (ref.index > 0) {
    for (size_t i = 0; i < chapters.size(); ++i) {
      if (chapters[i].index == ref.index) {
        return static_cast<int>(i);
      }
    }
  }

  if (!ref.url.empty()) {
    const int byUrl = findChapterIndexByUrl(chapters, ref.url);
    if (byUrl >= 0) {
      return byUrl;
    }
  }

  if (!ref.title.empty()) {
    const std::string safeTitle = lowerAscii(StringUtils::toDisplaySafeAscii(ref.title));
    for (size_t i = 0; i < chapters.size(); ++i) {
      if (lowerAscii(StringUtils::toDisplaySafeAscii(chapters[i].title)) == safeTitle) {
        return static_cast<int>(i);
      }
    }
  }
  return -1;
}

int parseDigitsAt(const std::string& text, size_t pos) {
  int value = 0;
  bool foundDigit = false;
  while (pos < text.size() && std::isdigit(static_cast<unsigned char>(text[pos])) != 0) {
    foundDigit = true;
    value = value * 10 + (text[pos] - '0');
    pos++;
  }
  return foundDigit ? value : 0;
}

int parseLastNumberInText(const std::string& text) {
  int value = 0;
  bool foundAny = false;
  size_t pos = 0;
  while (pos < text.size()) {
    if (std::isdigit(static_cast<unsigned char>(text[pos])) == 0) {
      pos++;
      continue;
    }

    foundAny = true;
    value = 0;
    while (pos < text.size() && std::isdigit(static_cast<unsigned char>(text[pos])) != 0) {
      value = value * 10 + (text[pos] - '0');
      pos++;
    }
  }
  return foundAny ? value : 0;
}

int inferChapterNumberForPagedBrowse(const std::string& url, const std::string& title) {
  const std::string safeUrl = lowerAscii(StringUtils::toDisplaySafeAscii(url));
  const char* urlMarkers[] = {"chuong-", "chuong/", "chap-", "chap/", "chapter-", "chapter/"};
  for (const char* marker : urlMarkers) {
    const size_t markerPos = safeUrl.find(marker);
    if (markerPos != std::string::npos) {
      const int value = parseDigitsAt(safeUrl, markerPos + std::strlen(marker));
      if (value > 0) {
        return value;
      }
    }
  }

  const int lastUrlNumber = parseLastNumberInText(safeUrl);
  if (lastUrlNumber > 0) {
    return lastUrlNumber;
  }

  const std::string safeTitle = lowerAscii(StringUtils::toDisplaySafeAscii(title));
  const char* titleMarkers[] = {"chuong ", "chuong:", "chuong-", "chap ", "chap:", "chap-", "chapter "};
  for (const char* marker : titleMarkers) {
    const size_t markerPos = safeTitle.find(marker);
    if (markerPos != std::string::npos) {
      size_t pos = markerPos + std::strlen(marker);
      while (pos < safeTitle.size() && safeTitle[pos] == ' ') {
        pos++;
      }
      const int value = parseDigitsAt(safeTitle, pos);
      if (value > 0) {
        return value;
      }
    }
  }

  return parseLastNumberInText(safeTitle);
}

enum class DetailAction { Read = 0, Browse = 1, DownloadOrSync = 2, Track = 3 };

bool deviceAllowsLocalEpubDownloads() { return !gpio.deviceIsX3() && !gpio.deviceIsX4(); }

bool shouldShowLocalEpubAction(const CpPluginInfo& pluginInfo) {
  return OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo) && deviceAllowsLocalEpubDownloads();
}

bool isChapterProgressComplete(uint32_t lastReadPage, uint32_t lastReadPageCount) {
  return lastReadPageCount > 0 && (lastReadPage + 1) >= lastReadPageCount;
}

bool shouldResumeTrackedChapter(const TrackedSeriesInfo& trackedItem) {
  return !trackedItem.lastReadChapterUrl.empty() &&
         !isChapterProgressComplete(trackedItem.lastReadPage, trackedItem.lastReadPageCount);
}
}

std::string HakoBookDetailActivity::summaryText() const {
  return descriptionText.empty() ? std::string("Open this story to browse chapters, read, or add it to your library.")
                                 : descriptionText;
}

int HakoBookDetailActivity::summaryVisibleLineCapacity() const {
  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageHeight = renderer.getScreenHeight();
  const int actionCount = shouldShowLocalEpubAction(pluginInfo) ? 4 : 3;
  const int menuTop = pageHeight - metrics.buttonHintsHeight - metrics.verticalSpacing * 2 -
                      actionCount * (metrics.menuRowHeight + metrics.menuSpacing);
  const int infoBottom = menuTop - metrics.verticalSpacing;
  const int coverY = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int coverHeight = 96;
  const int bodyTop = coverY + coverHeight + 8;
  const int summaryTop = bodyTop + renderer.getLineHeight(UI_10_FONT_ID) + 3;
  const int lineHeight = renderer.getLineHeight(UI_10_FONT_ID) + 2;
  const int availableSummaryHeight = std::max(0, infoBottom - summaryTop);
  return std::max(1, availableSummaryHeight / std::max(1, lineHeight));
}

int HakoBookDetailActivity::summaryPageCount() const {
  const auto& metrics = UITheme::getInstance().getMetrics();
  const int contentWidth = renderer.getScreenWidth() - metrics.contentSidePadding * 2;
  const auto lines =
      renderer.wrappedText(UI_10_FONT_ID, summaryText().c_str(), contentWidth, MAX_SUMMARY_WRAP_LINES, EpdFontFamily::REGULAR);
  const int capacity = summaryVisibleLineCapacity();
  return std::max(1, static_cast<int>((lines.size() + capacity - 1) / std::max(1, capacity)));
}

bool HakoBookDetailActivity::toggleSummaryScrollMode() {
  if (summaryPageCount() <= 1) {
    return false;
  }

  summaryScrollMode = !summaryScrollMode;
  if (!summaryScrollMode) {
    summaryScrollOffset = 0;
  }
  requestUpdate();
  return true;
}

bool HakoBookDetailActivity::ensureChaptersLoaded(const char* loadingLabel) {
  if (!chapters.empty()) {
    return true;
  }

  {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, loadingLabel);
    renderer.displayBuffer();
  }

  if (!OnlineSourceBridge::fetchToc(pluginInfo, detail.url, chapters)) {
    queueMessage = OnlineSourceBridge::getLastError().empty() ? "Failed to load chapters" : OnlineSourceBridge::getLastError();
    queueMessageUntilMs = millis() + 1800;
    requestUpdate();
    return false;
  }

  refreshTrackedState();
  requestUpdate();
  return !chapters.empty();
}

bool HakoBookDetailActivity::tryLoadPagedChapterContext(const HakoChapterRef& ref, std::vector<HakoChapterRef>& outChapters,
                                                        int& outChapterIndex, int& outCurrentPage, int& outTotalPages) {
  outChapters.clear();
  outChapterIndex = -1;
  outCurrentPage = 1;
  outTotalPages = 1;

  if (!OnlineSourceBridge::supportsPagedToc(pluginInfo) || detail.url.empty()) {
    return false;
  }

  int preferredChapterIndex = static_cast<int>(ref.index);
  if (preferredChapterIndex <= 0) {
    preferredChapterIndex = inferChapterNumberForPagedBrowse(ref.url, ref.title);
  }
  if (preferredChapterIndex <= 0) {
    return false;
  }

  OnlineSourceBridge::TocPageResult pageResult;
  const int targetPage = std::max(1, ((preferredChapterIndex - 1) / TOC_PAGE_SIZE) + 1);
  if (!OnlineSourceBridge::fetchTocPage(pluginInfo, detail.url, targetPage, pageResult) || pageResult.chapters.empty()) {
    return false;
  }

  outChapters = std::move(pageResult.chapters);
  outCurrentPage = std::max(1, pageResult.page);
  outTotalPages = std::max(1, pageResult.totalPages);
  outChapterIndex = findChapterIndexForRef(outChapters, ref);

  if (outChapterIndex < 0 && preferredChapterIndex > 0) {
    for (size_t i = 0; i < outChapters.size(); ++i) {
      if (static_cast<int>(outChapters[i].index) == preferredChapterIndex) {
        outChapterIndex = static_cast<int>(i);
        break;
      }
    }
  }

  if (outChapterIndex < 0) {
    const int fallbackIndex = preferredChapterIndex - ((outCurrentPage - 1) * TOC_PAGE_SIZE) - 1;
    if (fallbackIndex >= 0 && fallbackIndex < static_cast<int>(outChapters.size())) {
      outChapterIndex = fallbackIndex;
    }
  }

  return outChapterIndex >= 0 && outChapterIndex < static_cast<int>(outChapters.size());
}

void HakoBookDetailActivity::refreshTrackedState() {
  TRACKED_SERIES_STORE.ensureLoaded();
  tracked = false;
  trackedItem = OnlineSourceBridge::makeTrackedInfo(pluginInfo, detail, chapters, nullptr);
  for (const auto& item : TRACKED_SERIES_STORE.getAll()) {
    if (item.pluginId == pluginInfo.id && item.seriesUrl == detail.url) {
      tracked = true;
      trackedItem = item;
      return;
    }
  }
}

void HakoBookDetailActivity::toggleTracking() {
  TRACKED_SERIES_STORE.ensureLoaded();
  for (const auto& item : TRACKED_SERIES_STORE.getAll()) {
    if (item.pluginId == pluginInfo.id && item.seriesUrl == detail.url) {
      std::string error;
      const bool removed = TRACKED_SERIES_STORE.removeById(item.id, &error);
      refreshTrackedState();
      queueMessage = removed ? "Removed from library" : (error.empty() ? "Failed to update library" : error);
      queueMessageUntilMs = millis() + 1800;
      requestUpdate();
      return;
    }
  }

  trackedItem = OnlineSourceBridge::makeTrackedInfo(pluginInfo, detail, chapters, &trackedItem);
  std::string error;
  const bool saved = TRACKED_SERIES_STORE.upsert(trackedItem, &error);
  refreshTrackedState();
  queueMessage = saved ? "Added to library" : (error.empty() ? "Failed to update library" : error);
  queueMessageUntilMs = millis() + 1800;
  requestUpdate();
}

void HakoBookDetailActivity::openChapter(const HakoChapterRef& ref) {
  LOG_DBG("HDETAIL", "Open chapter requested tracked=%d hasUrl=%d", trackedItem.id.empty() ? 0 : 1, ref.url.empty() ? 0 : 1);
  std::vector<HakoChapterRef> readerChapters = chapters;
  int readerChapterIndex = findChapterIndexForRef(readerChapters, ref);
  int readerCurrentPage = 1;
  int readerTotalPages = 1;
  bool readerPagedMode = false;

  if (readerChapters.empty()) {
    if (!tryLoadPagedChapterContext(ref, readerChapters, readerChapterIndex, readerCurrentPage, readerTotalPages)) {
      if (!ensureChaptersLoaded("Loading chapters...")) {
        return;
      }
      readerChapters = chapters;
      readerChapterIndex = findChapterIndexForRef(readerChapters, ref);
      if (readerChapterIndex < 0 &&
          tryLoadPagedChapterContext(ref, readerChapters, readerChapterIndex, readerCurrentPage, readerTotalPages)) {
        readerPagedMode = true;
      }
    } else {
      readerPagedMode = true;
    }
  } else if (readerChapterIndex < 0 &&
             tryLoadPagedChapterContext(ref, readerChapters, readerChapterIndex, readerCurrentPage, readerTotalPages)) {
    readerPagedMode = true;
  }

  if (!readerPagedMode && readerChapterIndex >= 0) {
    readerCurrentPage = 1;
    readerTotalPages = 1;
  }

  HakoChapterContent chapter;
  {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Loading chapter...");
    renderer.displayBuffer();
  }
  if (!OnlineSourceBridge::fetchChapter(pluginInfo, ref, chapter)) {
    LOG_ERR("HDETAIL", "Open chapter failed error='%s'", OnlineSourceBridge::getLastError().c_str());
    RenderLock lock(*this);
    const std::string message =
        OnlineSourceBridge::getLastError().empty() ? "Failed to load chapter" : OnlineSourceBridge::getLastError();
    GUI.drawPopup(renderer, message.c_str());
    requestUpdate();
    return;
  }

  LOG_DBG("HDETAIL", "Open chapter success textBytes=%u", static_cast<unsigned>(chapter.text.size()));

  activityManager.pushActivity(std::make_unique<HakoChapterReaderActivity>(
      renderer, mappedInput, pluginInfo, std::move(chapter), std::move(readerChapters), readerChapterIndex, trackedItem.id,
      detail.title, detail.author, detail.url, readerPagedMode, HakoChapterReaderActivity::InitialPageMode::RestoreTracked,
      readerCurrentPage, readerTotalPages));
}

void HakoBookDetailActivity::openChapterAtIndex(int index) {
  if (index < 0 || index >= static_cast<int>(chapters.size())) {
    return;
  }
  openChapter(chapters[index]);
}

void HakoBookDetailActivity::downloadOrSyncEpub() {
  if (!OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo)) {
    queueMessage = "Offline download unavailable for this source";
    queueMessageUntilMs = millis() + 1800;
    requestUpdate();
    return;
  }

  if (!deviceAllowsLocalEpubDownloads()) {
    queueMessage = "EPUB download disabled on X3/X4";
    queueMessageUntilMs = millis() + 1800;
    requestUpdate();
    return;
  }

  if (!ensureChaptersLoaded("Loading chapters...")) {
    return;
  }

  HakoDownloadOptions options = makeForegroundDownloadOptions();
  int lastShownProgress = -1;
  std::string lastShownLabel;
  const auto progress = [this, &lastShownProgress, &lastShownLabel](const HakoProgressState& state) {
    const int progressValue = progressPercentForForegroundDownload(state);
    const std::string label = popupLabelForForegroundDownload(state);
    if (label == lastShownLabel && progressValue == lastShownProgress) {
      return true;
    }

    lastShownProgress = progressValue;
    lastShownLabel = label;

    RenderLock lock(*this);
    const Rect popupRect = GUI.drawPopup(renderer, label.c_str());
    GUI.fillPopupProgress(renderer, popupRect, progressValue);
    renderer.displayBuffer();
    return true;
  };

  trackedItem = OnlineSourceBridge::makeTrackedInfo(pluginInfo, detail, chapters, tracked ? &trackedItem : nullptr);
  if (trackedItem.epubPath.empty()) {
    trackedItem.epubPath = HakoEpubService::buildDefaultEpubPath(detail);
  }

  std::string message;
  bool ok = false;
  if (tracked) {
    HakoTrackedSyncResult result;
    ok = HakoEpubService::syncTrackedSeries(pluginInfo, trackedItem, result, &options, progress);
    message = result.message.empty() ? (ok ? "EPUB updated" : "Update failed") : result.message;
  } else {
    std::string error;
    ok = HakoEpubService::downloadEpub(pluginInfo, detail, chapters, trackedItem.epubPath, &error, &options, progress);
    if (ok) {
      TRACKED_SERIES_STORE.ensureLoaded();
      std::string persistError;
      if (!TRACKED_SERIES_STORE.upsert(trackedItem, &persistError)) {
        ok = false;
        message = persistError.empty() ? "Failed to save library entry" : persistError;
      } else {
        message = "EPUB downloaded";
      }
    } else {
      message = error.empty() ? "Download failed" : error;
    }
  }

  if (ok) {
    refreshTrackedState();
    requestUpdate();
  } else {
    refreshTrackedState();
  }

  queueMessageUntilMs = millis() + 1800;
  queueMessage = message;
  requestUpdate();
}

void HakoBookDetailActivity::ensurePreviewAssets() {
  if (descriptionText.empty()) {
    descriptionText = StringUtils::toDisplaySafeAscii(OnlineTextUtils::stripHtml(detail.descriptionHtml));
    detail.descriptionHtml.clear();
    detail.descriptionHtml.shrink_to_fit();
  }
}

void HakoBookDetailActivity::maybeLoadDeferredAssets() {
  if (!hasRenderedOnce || coverLoadAttempted || detail.coverUrl.empty()) {
    return;
  }

  coverLoadAttempted = true;
  coverLoadFailed = !OnlineCoverStore::getOrCreateThumb(detail.coverUrl, 96, coverBmpPath);
  requestUpdate();
}

void HakoBookDetailActivity::onEnter() {
  Activity::onEnter();
  refreshTrackedState();
  ensurePreviewAssets();
  hasRenderedOnce = false;
  confirmLongHandled = false;
  confirmShortPending = false;
  summaryScrollMode = false;
  summaryScrollOffset = 0;
  requestUpdate();
}

void HakoBookDetailActivity::loop() {
  maybeLoadDeferredAssets();

  if (!queueMessage.empty() && millis() >= queueMessageUntilMs) {
    queueMessage.clear();
    requestUpdate();
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    confirmShortPending = true;
  }

  if (confirmLongHandled && mappedInput.wasReleased(MappedInputManager::Button::Confirm)) {
    confirmLongHandled = false;
    return;
  }

  if (!confirmLongHandled && mappedInput.isPressed(MappedInputManager::Button::Confirm) && confirmShortPending &&
      mappedInput.getHeldTime() >= SUMMARY_MODE_SWITCH_MS) {
    confirmShortPending = false;
    confirmLongHandled = true;
    if (!toggleSummaryScrollMode()) {
      queueMessage = "Summary fits on one page";
      queueMessageUntilMs = millis() + 1200;
      requestUpdate();
    }
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    if (summaryScrollMode) {
      summaryScrollMode = false;
      summaryScrollOffset = 0;
      requestUpdate();
      return;
    }
    finish();
    return;
  }

  if (summaryScrollMode) {
    if (mappedInput.wasReleased(MappedInputManager::Button::Confirm) && confirmShortPending) {
      confirmShortPending = false;
      summaryScrollMode = false;
      summaryScrollOffset = 0;
      requestUpdate();
      return;
    }

    if ((mappedInput.wasPressed(MappedInputManager::Button::Up) || mappedInput.wasPressed(MappedInputManager::Button::Left)) &&
        summaryScrollOffset > 0) {
      summaryScrollOffset--;
      requestUpdate();
      return;
    }

    if ((mappedInput.wasPressed(MappedInputManager::Button::Down) || mappedInput.wasPressed(MappedInputManager::Button::Right)) &&
        summaryScrollOffset + 1 < summaryPageCount()) {
      summaryScrollOffset++;
      requestUpdate();
      return;
    }

    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Confirm) && confirmShortPending) {
    confirmShortPending = false;
    LOG_DBG("HDETAIL", "Confirm action=%d hasLatest=%d tracked=%d hasLastRead=%d", selectedAction,
            detail.latestChapterUrl.empty() ? 0 : 1, tracked ? 1 : 0, trackedItem.lastReadChapterUrl.empty() ? 0 : 1);
    if (selectedAction == static_cast<int>(DetailAction::Read)) {
      if (tracked && shouldResumeTrackedChapter(trackedItem)) {
        HakoChapterRef ref;
        ref.url = trackedItem.lastReadChapterUrl;
        ref.title = trackedItem.lastReadChapterTitle.empty() ? std::string("Continue Reading") : trackedItem.lastReadChapterTitle;
        LOG_DBG("HDETAIL", "Read action resumes tracked chapter");
        openChapter(ref);
        return;
      }

      if (!detail.latestChapterUrl.empty()) {
        HakoChapterRef ref;
        ref.url = detail.latestChapterUrl;
        ref.title = detail.latestChapterTitle.empty() ? std::string("Latest Chapter") : detail.latestChapterTitle;
        LOG_DBG("HDETAIL", "Read action opens latest chapter directly");
        openChapter(ref);
        return;
      }

      LOG_DBG("HDETAIL", "Read action falling back to TOC load");
      if (!ensureChaptersLoaded("Loading chapters...")) {
        LOG_ERR("HDETAIL", "Read action failed to load TOC for fallback");
        return;
      }
      HakoChapterRef trackedRef;
      trackedRef.url = trackedItem.lastReadChapterUrl;
      trackedRef.title = trackedItem.lastReadChapterTitle;
      const int lastReadIndex = tracked ? findChapterIndexForRef(chapters, trackedRef) : -1;
      if (tracked && isChapterProgressComplete(trackedItem.lastReadPage, trackedItem.lastReadPageCount) &&
          lastReadIndex >= 0 && lastReadIndex + 1 < static_cast<int>(chapters.size())) {
        openChapterAtIndex(lastReadIndex + 1);
      } else {
        openChapterAtIndex(lastReadIndex >= 0 ? lastReadIndex : static_cast<int>(chapters.size()) - 1);
      }
    } else if (selectedAction == static_cast<int>(DetailAction::Browse)) {
      if (chapters.empty() && OnlineSourceBridge::supportsPagedToc(pluginInfo)) {
        std::string preferredUrl;
        std::string preferredTitle;
        if (tracked && !trackedItem.lastReadChapterUrl.empty()) {
          preferredUrl = trackedItem.lastReadChapterUrl;
          preferredTitle = trackedItem.lastReadChapterTitle;
        } else if (!detail.latestChapterUrl.empty()) {
          preferredUrl = detail.latestChapterUrl;
          preferredTitle = detail.latestChapterTitle;
        }
        const int preferredChapterIndex = inferChapterNumberForPagedBrowse(preferredUrl, preferredTitle);
        activityManager.pushActivity(std::make_unique<HakoChapterListActivity>(
            renderer, mappedInput, pluginInfo, detail.title, detail.author, std::vector<HakoChapterRef>{}, false, trackedItem.id,
            detail.url, true, preferredUrl, preferredTitle, preferredChapterIndex));
      } else {
        if (!ensureChaptersLoaded("Loading chapters...")) {
          return;
        }
        activityManager.pushActivity(std::make_unique<HakoChapterListActivity>(renderer, mappedInput, pluginInfo, detail.title,
                                                                               detail.author, chapters, false, trackedItem.id));
      }
    } else if (shouldShowLocalEpubAction(pluginInfo) &&
               selectedAction == static_cast<int>(DetailAction::DownloadOrSync)) {
      downloadOrSyncEpub();
    } else {
      toggleTracking();
    }
    return;
  }

  buttonNavigator.onNext([this] {
    const int actionCount = shouldShowLocalEpubAction(pluginInfo) ? 4 : 3;
    selectedAction = ButtonNavigator::nextIndex(selectedAction, actionCount);
    requestUpdate();
  });

  buttonNavigator.onPrevious([this] {
    const int actionCount = shouldShowLocalEpubAction(pluginInfo) ? 4 : 3;
    selectedAction = ButtonNavigator::previousIndex(selectedAction, actionCount);
    requestUpdate();
  });
}

void HakoBookDetailActivity::render(RenderLock&&) {
  hasRenderedOnce = true;
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int pageHeight = renderer.getScreenHeight();
  const int contentX = metrics.contentSidePadding;
  const int contentWidth = pageWidth - metrics.contentSidePadding * 2;
  int cursorY = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;

  const std::string safeTitle = StringUtils::toDisplaySafeAscii(detail.title);
  const std::string meta =
      StringUtils::toDisplaySafeAscii(detail.author.empty() ? std::string("Unknown author") : detail.author) + " | " +
      (detail.ongoing ? std::string("Ongoing") : std::string("Completed"));
  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, safeTitle.c_str(), meta.c_str());

  const int actionCount = shouldShowLocalEpubAction(pluginInfo) ? 4 : 3;
  const int menuTop = pageHeight - metrics.buttonHintsHeight - metrics.verticalSpacing * 2 -
                      actionCount * (metrics.menuRowHeight + metrics.menuSpacing);
  const int infoBottom = menuTop - metrics.verticalSpacing;

  const int coverWidth = 68;
  const int coverHeight = 96;
  const int coverX = contentX;
  const int coverY = cursorY;
  renderer.drawRect(coverX, coverY, coverWidth, coverHeight);
  if (!coverBmpPath.empty()) {
    FsFile coverFile;
    if (Storage.openFileForRead("HBD", coverBmpPath.c_str(), coverFile)) {
      Bitmap bitmap(coverFile);
      if (bitmap.parseHeaders() == BmpReaderError::Ok) {
        renderer.drawBitmap(bitmap, coverX + 1, coverY + 1, coverWidth - 2, coverHeight - 2);
      }
      coverFile.close();
    }
  } else if (coverLoadFailed) {
    renderer.drawText(UI_10_FONT_ID, coverX + 10, coverY + 30, "Cover", true, EpdFontFamily::BOLD);
    renderer.drawText(UI_10_FONT_ID, coverX + 12, coverY + 46, "not", true);
    renderer.drawText(UI_10_FONT_ID, coverX + 8, coverY + 62, "avail.", true);
  } else {
    renderer.drawText(UI_10_FONT_ID, coverX + 20, coverY + 36, "No", true, EpdFontFamily::BOLD);
    renderer.drawText(UI_10_FONT_ID, coverX + 12, coverY + 52, "Cover", true);
  }

  int metaX = coverX + coverWidth + 10;
  int metaY = cursorY;
  const int metaWidth = contentWidth - coverWidth - 10;
  const std::string chapterCount =
      chapters.empty() ? std::string("Chapters: Load on demand") : ("Chapters: " + std::to_string(chapters.size()));
  renderer.drawText(UI_10_FONT_ID, metaX, metaY, renderer.truncatedText(UI_10_FONT_ID, chapterCount.c_str(), metaWidth).c_str(), true);
  metaY += renderer.getLineHeight(UI_10_FONT_ID) + 4;

  if (shouldShowLocalEpubAction(pluginInfo)) {
    const size_t epubSlashPos = trackedItem.epubPath.find_last_of('/');
    const std::string epubName =
        epubSlashPos == std::string::npos ? trackedItem.epubPath : trackedItem.epubPath.substr(epubSlashPos + 1);
    const std::string epubLabel =
        StringUtils::toDisplaySafeAscii(std::string("EPUB: ") + StringUtils::sanitizeFilename(epubName, 80));
    renderer.drawText(UI_10_FONT_ID, metaX, metaY, renderer.truncatedText(UI_10_FONT_ID, epubLabel.c_str(), metaWidth).c_str(), true);
    metaY += renderer.getLineHeight(UI_10_FONT_ID) + 4;
  } else {
    const std::string sourceLabel = "Source: " + StringUtils::toDisplaySafeAscii(pluginInfo.name);
    renderer.drawText(UI_10_FONT_ID, metaX, metaY, renderer.truncatedText(UI_10_FONT_ID, sourceLabel.c_str(), metaWidth).c_str(), true);
    metaY += renderer.getLineHeight(UI_10_FONT_ID) + 4;
  }

  if (!chapters.empty()) {
    const std::string latest = "Latest: " + StringUtils::toDisplaySafeAscii(chapters.back().title);
    renderer.drawText(UI_10_FONT_ID, metaX, metaY, renderer.truncatedText(UI_10_FONT_ID, latest.c_str(), metaWidth).c_str(), true);
    metaY += renderer.getLineHeight(UI_10_FONT_ID) + 4;
  } else if (!detail.latestChapterTitle.empty()) {
    const std::string latest = "Latest: " + StringUtils::toDisplaySafeAscii(detail.latestChapterTitle);
    renderer.drawText(UI_10_FONT_ID, metaX, metaY, renderer.truncatedText(UI_10_FONT_ID, latest.c_str(), metaWidth).c_str(), true);
    metaY += renderer.getLineHeight(UI_10_FONT_ID) + 4;
  } else {
    const std::string latest = "Latest: Load chapters to browse or read";
    renderer.drawText(UI_10_FONT_ID, metaX, metaY, renderer.truncatedText(UI_10_FONT_ID, latest.c_str(), metaWidth).c_str(), true);
    metaY += renderer.getLineHeight(UI_10_FONT_ID) + 4;
  }

  const int bodyTop = std::max(coverY + coverHeight + 8, metaY + 4);
  renderer.drawLine(contentX, bodyTop - 4, contentX + contentWidth, bodyTop - 4);
  std::string summaryLabel = "Summary";
  const int summaryPages = summaryPageCount();
  if (summaryPages > 1) {
    summaryLabel += " " + std::to_string(summaryScrollOffset + 1) + "/" + std::to_string(summaryPages);
  }
  renderer.drawText(UI_10_FONT_ID, contentX, bodyTop, summaryLabel.c_str(), true, EpdFontFamily::BOLD);
  const std::string currentSummaryText = summaryText();
  const int summaryTop = bodyTop + renderer.getLineHeight(UI_10_FONT_ID) + 3;
  const int lineHeight = renderer.getLineHeight(UI_10_FONT_ID) + 2;
  const bool showSummaryHint = summaryPages > 1;
  const int hintReserve = showSummaryHint ? (lineHeight + 2) : 0;
  const int availableSummaryHeight = std::max(0, infoBottom - summaryTop - hintReserve);
  const int summaryLines = std::max(1, availableSummaryHeight / lineHeight);
  const auto wrappedSummary =
      renderer.wrappedText(UI_10_FONT_ID, currentSummaryText.c_str(), contentWidth, MAX_SUMMARY_WRAP_LINES, EpdFontFamily::REGULAR);
  const int startLine = std::min(static_cast<int>(wrappedSummary.size()), summaryScrollOffset * summaryLines);
  const int endLine = std::min(static_cast<int>(wrappedSummary.size()), startLine + summaryLines);
  int summaryY = summaryTop;
  for (int lineIndex = startLine; lineIndex < endLine; ++lineIndex) {
    if (summaryY + renderer.getLineHeight(UI_10_FONT_ID) > infoBottom) break;
    renderer.drawText(UI_10_FONT_ID, contentX, summaryY, wrappedSummary[lineIndex].c_str(), true);
    summaryY += lineHeight;
  }

  if (showSummaryHint) {
    const std::string hintText = summaryScrollMode ? "Up/Down scroll | Select done" : "Hold Select to scroll summary";
    const std::string safeHint = renderer.truncatedText(UI_10_FONT_ID, hintText.c_str(), contentWidth);
    renderer.drawText(UI_10_FONT_ID, contentX, infoBottom - renderer.getLineHeight(UI_10_FONT_ID), safeHint.c_str(), true,
                      EpdFontFamily::BOLD);
  }

  GUI.drawButtonMenu(renderer, Rect{0, menuTop, pageWidth, pageHeight - menuTop - metrics.buttonHintsHeight}, actionCount,
                     selectedAction,
                     [this](int index) {
                       if (index == 0) {
                         return tracked && shouldResumeTrackedChapter(trackedItem) ? std::string("Continue Reading")
                                                                                   : std::string("Read Latest");
                       }
                       if (index == 1) return std::string("Browse Chapters");
                       if (shouldShowLocalEpubAction(pluginInfo) && index == 2) {
                         return tracked ? std::string("Update EPUB") : std::string("Download EPUB");
                       }
                       return tracked ? std::string("Remove from Library") : std::string("Add to Library");
                     },
                     [](int) { return Book; });

  if (!queueMessage.empty()) {
    GUI.drawPopup(renderer, queueMessage.c_str());
  }

  const auto labels =
      mappedInput.mapLabels(tr(STR_BACK), summaryScrollMode ? "Done" : tr(STR_SELECT), tr(STR_DIR_UP), tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
