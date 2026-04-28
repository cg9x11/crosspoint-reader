#include "HakoBookDetailActivity.h"

#include <algorithm>

#include <GfxRenderer.h>
#include <HalStorage.h>
#include <I18n.h>

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

int findChapterIndexByUrl(const std::vector<HakoChapterRef>& chapters, const std::string& url) {
  for (size_t i = 0; i < chapters.size(); ++i) {
    if (chapters[i].url == url) {
      return static_cast<int>(i);
    }
  }
  return -1;
}

std::string lowerAscii(std::string value) {
  std::transform(value.begin(), value.end(), value.begin(),
                 [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
  return value;
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
}

std::string HakoBookDetailActivity::summaryText() const {
  return descriptionText.empty() ? std::string("Open this story to browse chapters, read, or add it to your library.")
                                 : descriptionText;
}

int HakoBookDetailActivity::summaryVisibleLineCapacity() const {
  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageHeight = renderer.getScreenHeight();
  const int actionCount = OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo) ? 4 : 3;
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
    queueMessage = "Failed to load chapters";
    queueMessageUntilMs = millis() + 1800;
    requestUpdate();
    return false;
  }

  refreshTrackedState();
  requestUpdate();
  return !chapters.empty();
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
  HakoChapterContent chapter;
  {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Loading chapter...");
    renderer.displayBuffer();
  }
  if (!OnlineSourceBridge::fetchChapter(pluginInfo, ref, chapter)) {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Failed to load chapter");
    requestUpdate();
    return;
  }

  activityManager.pushActivity(std::make_unique<HakoChapterReaderActivity>(renderer, mappedInput, std::move(chapter), trackedItem.id));
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

  if (!ensureChaptersLoaded("Loading chapters...")) {
    return;
  }

  trackedItem = OnlineSourceBridge::makeTrackedInfo(pluginInfo, detail, chapters, tracked ? &trackedItem : nullptr);
  std::string message;
  const bool queued = tracked ? BACKGROUND_DOWNLOAD_MANAGER.enqueueTrackedSync(trackedItem, &message)
                              : BACKGROUND_DOWNLOAD_MANAGER.enqueueHakoDownload(pluginInfo, trackedItem, &message);
  if (queued && !tracked) {
    refreshTrackedState();
  }
  queueMessage = message.empty() ? (queued ? "Added to downloads" : "Queue failed") : message;
  queueMessageUntilMs = millis() + 1800;
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
    if (selectedAction == static_cast<int>(DetailAction::Read)) {
      if (tracked && !trackedItem.lastReadChapterUrl.empty()) {
        HakoChapterRef ref;
        ref.url = trackedItem.lastReadChapterUrl;
        ref.title = trackedItem.lastReadChapterTitle.empty() ? std::string("Continue Reading") : trackedItem.lastReadChapterTitle;
        openChapter(ref);
        return;
      }

      if (!detail.latestChapterUrl.empty()) {
        HakoChapterRef ref;
        ref.url = detail.latestChapterUrl;
        ref.title = detail.latestChapterTitle.empty() ? std::string("Latest Chapter") : detail.latestChapterTitle;
        openChapter(ref);
        return;
      }

      if (!ensureChaptersLoaded("Loading chapters...")) {
        return;
      }
      const int lastReadIndex = tracked ? findChapterIndexByUrl(chapters, trackedItem.lastReadChapterUrl) : -1;
      openChapterAtIndex(lastReadIndex >= 0 ? lastReadIndex : static_cast<int>(chapters.size()) - 1);
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
    } else if (OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo) &&
               selectedAction == static_cast<int>(DetailAction::DownloadOrSync)) {
      downloadOrSyncEpub();
    } else {
      toggleTracking();
    }
    return;
  }

  buttonNavigator.onNext([this] {
    const int actionCount = OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo) ? 4 : 3;
    selectedAction = ButtonNavigator::nextIndex(selectedAction, actionCount);
    requestUpdate();
  });

  buttonNavigator.onPrevious([this] {
    const int actionCount = OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo) ? 4 : 3;
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

  const int actionCount = OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo) ? 4 : 3;
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

  if (OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo)) {
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
                         return tracked && !trackedItem.lastReadChapterUrl.empty() ? std::string("Continue Reading")
                                                                                  : std::string("Read Latest");
                       }
                       if (index == 1) return std::string("Browse Chapters");
                       if (OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo) && index == 2) {
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
