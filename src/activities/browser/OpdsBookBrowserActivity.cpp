#include "OpdsBookBrowserActivity.h"

#include <ArduinoJson.h>
#include <Bitmap.h>
#include <Epub.h>
#include <GfxRenderer.h>
#include <HalStorage.h>
#include <I18n.h>
#include <Logging.h>
#include <OpdsStream.h>
#include <WiFi.h>

#include <algorithm>
#include <functional>

#include "MappedInputManager.h"
#include "activities/network/WifiSelectionActivity.h"
#include "activities/util/KeyboardEntryActivity.h"
#include "components/UITheme.h"
#include "fontIds.h"
#include "network/HttpDownloader.h"
#include "SeriesManifest.h"
#include "util/ScreenDebugRecorder.h"
#include "util/StringUtils.h"
#include "util/UrlUtils.h"

namespace {
constexpr int FULL_LIST_PAGE_ITEMS = 23;
constexpr int PREVIEW_LIST_PAGE_ITEMS = 9;
constexpr int LIST_TOP = 60;
constexpr int LIST_ITEM_HEIGHT = 30;
constexpr const char* NO_DESCRIPTION_TEXT = "No description";

std::string getUrlBasename(const std::string& url) {
  size_t end = url.find('?');
  if (end == std::string::npos) {
    end = url.find('#');
  }
  if (end == std::string::npos) {
    end = url.size();
  }

  const size_t slashPos = url.rfind('/', end);
  if (slashPos == std::string::npos) {
    return url.substr(0, end);
  }
  return url.substr(slashPos + 1, end - slashPos - 1);
}

std::string getUrlParent(const std::string& url) {
  size_t end = url.find('?');
  if (end == std::string::npos) {
    end = url.find('#');
  }
  if (end == std::string::npos) {
    end = url.size();
  }

  const size_t slashPos = url.rfind('/', end);
  if (slashPos == std::string::npos) {
    return url;
  }
  return url.substr(0, slashPos);
}

bool isSeriesChapterFilename(const std::string& filename) {
  if (filename.size() < 10 || filename.rfind("ch_", 0) != 0) {
    return false;
  }
  if (filename.substr(filename.size() - 5) != ".epub") {
    return false;
  }
  for (size_t i = 3; i < filename.size() - 5; i++) {
    if (!isdigit(static_cast<unsigned char>(filename[i]))) {
      return false;
    }
  }
  return true;
}

int parseChapterIndexFromFilename(const std::string& filename) {
  if (!isSeriesChapterFilename(filename)) {
    return 0;
  }
  return atoi(filename.substr(3, filename.size() - 8).c_str());
}

std::string chooseLegacySeriesDirectoryName(const std::string& feedTitle, const OpdsEntry& entry) {
  if (!feedTitle.empty()) {
    return "/" + StringUtils::sanitizeFilename(feedTitle);
  }
  if (!entry.title.empty()) {
    return "/" + StringUtils::sanitizeFilename(entry.title);
  }
  return "/series";
}

std::string chooseSeriesDirectoryName(const std::string& stableKey, const std::string& feedTitle, const OpdsEntry& entry) {
  if (!stableKey.empty()) {
    return "/series_" + std::to_string(std::hash<std::string>{}(stableKey));
  }
  return chooseLegacySeriesDirectoryName(feedTitle, entry);
}

std::string buildPreviewCachePath(const OpdsEntry& entry) {
  const std::string cacheKey = !entry.id.empty() ? entry.id : entry.href;
  const size_t hash = std::hash<std::string>{}(cacheKey);
  return "/.crosspoint/opds/" + std::to_string(hash) + ".bmp";
}

void drawBitmapCoverFill(GfxRenderer& renderer, const Bitmap& bitmap, const int x, const int y, const int width,
                         const int height) {
  if (bitmap.getWidth() <= 0 || bitmap.getHeight() <= 0 || width <= 0 || height <= 0) {
    return;
  }

  const float bitmapAspect = static_cast<float>(bitmap.getWidth()) / static_cast<float>(bitmap.getHeight());
  const float targetAspect = static_cast<float>(width) / static_cast<float>(height);
  float cropX = 0.0f;
  float cropY = 0.0f;

  if (bitmapAspect > targetAspect) {
    const float targetWidth = static_cast<float>(bitmap.getHeight()) * targetAspect;
    cropX = 1.0f - (targetWidth / static_cast<float>(bitmap.getWidth()));
  } else if (bitmapAspect < targetAspect) {
    const float targetHeight = static_cast<float>(bitmap.getWidth()) / targetAspect;
    cropY = 1.0f - (targetHeight / static_cast<float>(bitmap.getHeight()));
  }

  renderer.drawBitmap(bitmap, x, y, width, height, cropX, cropY);
}

std::string findSeriesDirectoryBySeriesId(const std::string& seriesId) {
  if (seriesId.empty()) {
    return "";
  }

  auto root = Storage.open("/");
  if (!root || !root.isDirectory()) {
    return "";
  }

  root.rewindDirectory();
  char name[500];
  for (auto dir = root.openNextFile(); dir; dir = root.openNextFile()) {
    if (!dir.isDirectory()) {
      continue;
    }

    dir.getName(name, sizeof(name));
    if (name[0] == '.') {
      continue;
    }

    SeriesManifest manifest;
    const std::string seriesDir = "/" + std::string(name);
    if (!SeriesManifestStore::loadFromSeriesDir(seriesDir, manifest)) {
      continue;
    }
    if (manifest.seriesId == seriesId) {
      return seriesDir;
    }
  }

  return "";
}

std::string resolveExistingSeriesDirectoryName(const std::string& stableKey, const std::string& feedTitle,
                                               const OpdsEntry& entry) {
  const std::string preferredDir = chooseSeriesDirectoryName(stableKey, feedTitle, entry);
  if (Storage.exists(preferredDir.c_str())) {
    return preferredDir;
  }

  const std::string legacyFeedDir = chooseLegacySeriesDirectoryName(feedTitle, entry);
  if (legacyFeedDir != preferredDir && Storage.exists(legacyFeedDir.c_str())) {
    return legacyFeedDir;
  }

  const std::string legacyEntryDir = chooseLegacySeriesDirectoryName("", entry);
  if (legacyEntryDir != preferredDir && legacyEntryDir != legacyFeedDir && Storage.exists(legacyEntryDir.c_str())) {
    return legacyEntryDir;
  }

  const std::string manifestMatchedDir = findSeriesDirectoryBySeriesId(stableKey);
  if (!manifestMatchedDir.empty()) {
    return manifestMatchedDir;
  }

  return preferredDir;
}

std::string normalizePreviewText(const std::string& input) {
  std::string output;
  output.reserve(input.size());

  bool inTag = false;
  bool lastWasSpace = false;
  for (unsigned char ch : input) {
    if (ch == '<') {
      inTag = true;
      continue;
    }
    if (inTag) {
      if (ch == '>') {
        inTag = false;
      }
      continue;
    }

    const bool isSpace = isspace(ch) != 0;
    if (isSpace) {
      if (!output.empty() && !lastWasSpace) {
        output.push_back(' ');
      }
      lastWasSpace = true;
      continue;
    }

    output.push_back(static_cast<char>(ch));
    lastWasSpace = false;
  }

  while (!output.empty() && output.back() == ' ') {
    output.pop_back();
  }
  return output;
}

size_t countExistingSeriesChapters(const std::string& seriesDir, const std::vector<OpdsEntry>& seriesEntries) {
  if (seriesDir.empty()) {
    return 0;
  }

  size_t count = 0;
  for (const auto& entry : seriesEntries) {
    if (entry.type != OpdsEntryType::BOOK) {
      continue;
    }

    const std::string filename = getUrlBasename(entry.href);
    if (!isSeriesChapterFilename(filename)) {
      continue;
    }

    if (Storage.exists((seriesDir + "/" + filename).c_str())) {
      ++count;
    }
  }

  return count;
}

std::string buildSeriesPreviewStatus(const size_t localChapterCount, const size_t serverChapterCount) {
  if (serverChapterCount == 0) {
    return "";
  }

  std::string status = std::to_string(localChapterCount) + "/" + std::to_string(serverChapterCount) + " chapters";
  if (localChapterCount < serverChapterCount) {
    status += " | " + std::to_string(serverChapterCount - localChapterCount) + " new";
  } else {
    status += " | Up to date";
  }
  return status;
}
}  // namespace

void OpdsBookBrowserActivity::onEnter() {
  Activity::onEnter();

  state = BrowserState::CHECK_WIFI;
  entries.clear();
  navigationHistory.clear();
  searchTemplate.clear();
  currentPath.clear();
  currentFeedTitle.clear();
  selectorIndex = 0;
  consumeConfirm = false;
  consumeBack = false;
  currentPreview = {};
  seriesStatusCache.clear();
  errorMessage.clear();
  statusMessage = tr(STR_CHECKING_WIFI);
  requestUpdate();

  checkAndConnectWifi();
}

void OpdsBookBrowserActivity::onExit() {
  Activity::onExit();
  WiFi.mode(WIFI_OFF);
  entries.clear();
  navigationHistory.clear();
  seriesStatusCache.clear();
}

bool OpdsBookBrowserActivity::fetchFeedData(const std::string& url, std::vector<OpdsEntry>& outEntries,
                                            std::string* outFeedTitle, std::string* outSearchTemplate,
                                            std::string* outNextUrl, std::string* outPrevUrl) const {
  LOG_DBG("OPDS", "Fetching: %s", url.c_str());

  OpdsParser parser;
  {
    OpdsParserStream stream{parser};
    if (!HttpDownloader::fetchUrl(url, stream, server.username, server.password)) {
      return false;
    }
  }

  if (!parser) {
    return false;
  }

  if (outSearchTemplate) {
    *outSearchTemplate = parser.getSearchTemplate();
  }
  if (outFeedTitle) {
    *outFeedTitle = parser.getFeedTitle();
  }
  if (outNextUrl) {
    *outNextUrl = parser.getNextPageUrl();
  }
  if (outPrevUrl) {
    *outPrevUrl = parser.getPrevPageUrl();
  }
  outEntries = std::move(parser).getEntries();
  return true;
}

void OpdsBookBrowserActivity::loop() {
  if (state == BrowserState::WIFI_SELECTION || state == BrowserState::SEARCH_INPUT) {
    return;
  }

  if (consumeConfirm && mappedInput.wasReleased(MappedInputManager::Button::Confirm)) {
    consumeConfirm = false;
    return;
  }
  if (consumeBack && mappedInput.wasReleased(MappedInputManager::Button::Back)) {
    consumeBack = false;
    return;
  }

  if (state == BrowserState::ERROR) {
    if (mappedInput.wasReleased(MappedInputManager::Button::Confirm)) {
      if (WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0)) {
        state = BrowserState::LOADING;
        statusMessage = tr(STR_LOADING);
        requestUpdate();
        fetchFeed(currentPath);
      } else {
        launchWifiSelection();
      }
    } else if (mappedInput.wasReleased(MappedInputManager::Button::Back)) {
      navigateBack();
    }
    return;
  }

  if (state == BrowserState::CHECK_WIFI || state == BrowserState::LOADING) {
    if (mappedInput.wasReleased(MappedInputManager::Button::Back)) {
      state == BrowserState::CHECK_WIFI ? onGoHome() : navigateBack();
    }
    return;
  }

  if (state == BrowserState::DOWNLOADING) {
    return;
  }

  if (state != BrowserState::BROWSING) {
    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Confirm)) {
    if (!entries.empty()) {
      const auto& entry = entries[selectorIndex];
      if (entry.type == OpdsEntryType::BOOK) {
        downloadBook(entry);
      } else if (entry.type == OpdsEntryType::SERIES) {
        downloadSeries(entry);
      } else {
        navigateToEntry(entry);
      }
    }
    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Back)) {
    navigateBack();
    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Left)) {
    if (!searchTemplate.empty() && selectorIndex == 0) {
      launchSearch();
    }
    return;
  }

  if (entries.empty()) {
    return;
  }

  const int pageItems = currentPreview.available ? PREVIEW_LIST_PAGE_ITEMS : FULL_LIST_PAGE_ITEMS;
  buttonNavigator.onNextRelease([this] {
    selectorIndex = ButtonNavigator::nextIndex(selectorIndex, entries.size());
    updatePreviewForSelection();
    requestUpdate();
  });
  buttonNavigator.onPreviousRelease([this] {
    selectorIndex = ButtonNavigator::previousIndex(selectorIndex, entries.size());
    updatePreviewForSelection();
    requestUpdate();
  });
  buttonNavigator.onNextContinuous([this, pageItems] {
    selectorIndex = ButtonNavigator::nextPageIndex(selectorIndex, entries.size(), pageItems);
    updatePreviewForSelection();
    requestUpdate();
  });
  buttonNavigator.onPreviousContinuous([this, pageItems] {
    selectorIndex = ButtonNavigator::previousPageIndex(selectorIndex, entries.size(), pageItems);
    updatePreviewForSelection();
    requestUpdate();
  });
}

void OpdsBookBrowserActivity::drawPreviewPanel(const Rect& rect, const PreviewData& preview) {
  constexpr int panelPadding = 8;
  constexpr int columnGap = 10;

  renderer.fillRect(rect.x, rect.y, rect.width, rect.height, false);
  renderer.drawRect(rect.x, rect.y, rect.width, rect.height, true);

  const int coverHeight = rect.height - panelPadding * 2;
  const int idealCoverWidth = (coverHeight * 2) / 3;
  const int coverWidth = std::min((rect.width * 36) / 100, idealCoverWidth);
  const int coverX = rect.x + panelPadding;
  const int coverY = rect.y + panelPadding;
  const int dividerX = coverX + coverWidth + panelPadding;

  renderer.drawLine(dividerX, rect.y + 1, dividerX, rect.y + rect.height - 2, 1, true);

  bool coverDrawn = false;
  if (!preview.coverBmpPath.empty()) {
    FsFile file;
    if (Storage.openFileForRead("OPDS", preview.coverBmpPath, file)) {
      Bitmap bitmap(file);
      if (bitmap.parseHeaders() == BmpReaderError::Ok) {
        drawBitmapCoverFill(renderer, bitmap, coverX, coverY, coverWidth, coverHeight);
        coverDrawn = true;
      }
      file.close();
    }
  }

  if (!coverDrawn) {
    const char* noCoverText = "No cover";
    const int noCoverWidth = renderer.getTextWidth(UI_10_FONT_ID, noCoverText);
    const int noCoverX = coverX + std::max(0, (coverWidth - noCoverWidth) / 2);
    renderer.drawText(UI_10_FONT_ID, noCoverX,
                      coverY + coverHeight / 2 - renderer.getLineHeight(UI_10_FONT_ID) / 2, noCoverText, true);
  }

  const int textX = dividerX + columnGap;
  const int textWidth = rect.x + rect.width - panelPadding - textX;
  int textY = rect.y + panelPadding;

  auto titleLines = renderer.wrappedText(UI_12_FONT_ID, preview.title.c_str(), textWidth, 2, EpdFontFamily::BOLD);
  for (const auto& line : titleLines) {
    renderer.drawText(UI_12_FONT_ID, textX, textY, line.c_str(), true, EpdFontFamily::BOLD);
    textY += renderer.getLineHeight(UI_12_FONT_ID);
  }

  if (!preview.author.empty()) {
    textY += 2;
    const std::string author = renderer.truncatedText(UI_10_FONT_ID, preview.author.c_str(), textWidth);
    renderer.drawText(UI_10_FONT_ID, textX, textY, author.c_str(), true);
    textY += renderer.getLineHeight(UI_10_FONT_ID) + 6;
  }

  if (!preview.status.empty()) {
    const std::string meta = renderer.truncatedText(SMALL_FONT_ID, preview.status.c_str(), textWidth);
    renderer.drawText(SMALL_FONT_ID, textX, textY, meta.c_str(), true);
    textY += renderer.getLineHeight(SMALL_FONT_ID) + 8;
    renderer.drawLine(textX, textY - 4, textX + textWidth, textY - 4, true);
  }

  renderer.drawText(UI_10_FONT_ID, textX, textY, "Summary", true, EpdFontFamily::BOLD);
  textY += renderer.getLineHeight(UI_10_FONT_ID) + 4;

  const int availableHeight = rect.y + rect.height - panelPadding - textY;
  const int maxSummaryLines = std::max(0, std::min(7, availableHeight / renderer.getLineHeight(SMALL_FONT_ID)));
  if (maxSummaryLines <= 0) {
    return;
  }
  const std::string summaryText = normalizePreviewText(preview.summary);
  auto summaryLines = renderer.wrappedText(SMALL_FONT_ID, summaryText.c_str(), textWidth, maxSummaryLines);
  for (const auto& line : summaryLines) {
    renderer.drawText(SMALL_FONT_ID, textX, textY, line.c_str(), true);
    textY += renderer.getLineHeight(SMALL_FONT_ID);
  }
}

void OpdsBookBrowserActivity::render(RenderLock&&) {
  renderer.clearScreen();
  const auto pageWidth = renderer.getScreenWidth();
  const auto pageHeight = renderer.getScreenHeight();

  const char* headerTitle = server.name.empty() ? tr(STR_OPDS_BROWSER) : server.name.c_str();
  renderer.drawCenteredText(UI_12_FONT_ID, 15, headerTitle, true, EpdFontFamily::BOLD);
  ScreenDebugRecorder::setHeader(headerTitle, currentFeedTitle.empty() ? nullptr : currentFeedTitle.c_str());

  if (state == BrowserState::CHECK_WIFI || state == BrowserState::LOADING) {
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2, statusMessage.c_str());
    const auto labels = mappedInput.mapLabels(tr(STR_BACK), "", "", "");
    GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
    ScreenDebugRecorder::setBody(statusMessage.c_str());
    ScreenDebugRecorder::setButtonHints(labels.btn1, labels.btn2, labels.btn3, labels.btn4);
    renderer.displayBuffer();
    return;
  }

  if (state == BrowserState::ERROR) {
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 - 20, tr(STR_ERROR_MSG));
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 + 10, errorMessage.c_str());
    const auto labels = mappedInput.mapLabels(tr(STR_BACK), tr(STR_RETRY), "", "");
    GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
    ScreenDebugRecorder::setBody(tr(STR_ERROR_MSG), errorMessage.c_str());
    ScreenDebugRecorder::setButtonHints(labels.btn1, labels.btn2, labels.btn3, labels.btn4);
    renderer.displayBuffer();
    return;
  }

  if (state == BrowserState::DOWNLOADING) {
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 - 40, tr(STR_DOWNLOADING));
    const auto title = renderer.truncatedText(UI_10_FONT_ID, statusMessage.c_str(), pageWidth - 40);
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 - 10, title.c_str());
    if (downloadTotal > 0) {
      GUI.drawProgressBar(renderer, Rect{50, pageHeight / 2 + 20, pageWidth - 100, 20}, downloadProgress,
                          downloadTotal);
    }
    ScreenDebugRecorder::setBody(tr(STR_DOWNLOADING), statusMessage.c_str());
    renderer.displayBuffer();
    return;
  }

  const bool selectedDownloadable =
      !entries.empty() &&
      (entries[selectorIndex].type == OpdsEntryType::BOOK || entries[selectorIndex].type == OpdsEntryType::SERIES);
  const char* confirmLabel = selectedDownloadable ? tr(STR_DOWNLOAD) : tr(STR_OPEN);
  const char* searchLabel = (!searchTemplate.empty() && selectorIndex == 0) ? tr(STR_SEARCH) : tr(STR_DIR_UP);
  const auto labels = mappedInput.mapLabels(tr(STR_BACK), confirmLabel, searchLabel, tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  ScreenDebugRecorder::setButtonHints(labels.btn1, labels.btn2, labels.btn3, labels.btn4);

  if (entries.empty()) {
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2, tr(STR_NO_ENTRIES));
    ScreenDebugRecorder::setBody(tr(STR_NO_ENTRIES));
    ScreenDebugRecorder::setList(0, -1, 0, 0, [](int) { return std::string{}; });
    renderer.displayBuffer();
    return;
  }

  const bool showPreview = currentPreview.available;
  const int previewHeight = showPreview ? 210 : 0;
  const int previewSpacing = showPreview ? 8 : 0;
  const int listBottom = pageHeight - 40 - previewHeight - previewSpacing;
  const int listHeight = std::max(LIST_ITEM_HEIGHT, listBottom - LIST_TOP);
  const int pageItems = showPreview ? PREVIEW_LIST_PAGE_ITEMS : FULL_LIST_PAGE_ITEMS;
  const int pageStartIndex = selectorIndex / pageItems * pageItems;
  const int highlightRow = selectorIndex % pageItems;

  renderer.fillRect(0, LIST_TOP + highlightRow * LIST_ITEM_HEIGHT - 2, pageWidth - 1, LIST_ITEM_HEIGHT);
  for (size_t i = pageStartIndex; i < entries.size() && i < static_cast<size_t>(pageStartIndex + pageItems); i++) {
    const auto& entry = entries[i];
    std::string displayText = entry.type == OpdsEntryType::NAVIGATION ? "> " + entry.title : entry.title;
    if ((entry.type == OpdsEntryType::BOOK || entry.type == OpdsEntryType::SERIES) && !entry.author.empty()) {
      displayText += " - " + entry.author;
    }
    const auto item = renderer.truncatedText(UI_10_FONT_ID, displayText.c_str(), pageWidth - 40);
    const int rowIndex = static_cast<int>(i - pageStartIndex);
    renderer.drawText(UI_10_FONT_ID, 20, LIST_TOP + rowIndex * LIST_ITEM_HEIGHT, item.c_str(),
                      i != static_cast<size_t>(selectorIndex));
  }

  if (showPreview) {
    drawPreviewPanel(Rect{0, listBottom + previewSpacing, pageWidth, previewHeight}, currentPreview);
  }

  ScreenDebugRecorder::setList(
      static_cast<int>(entries.size()), selectorIndex, pageStartIndex, pageItems,
      [this](int index) {
        const auto& entry = entries[index];
        return entry.type == OpdsEntryType::NAVIGATION ? "> " + entry.title : entry.title;
      },
      [this](int index) {
        const auto& entry = entries[index];
        return entry.author;
      },
      [this](int index) {
        const auto& entry = entries[index];
        return entry.type == OpdsEntryType::SERIES ? "SERIES"
               : (entry.type == OpdsEntryType::BOOK ? "BOOK" : "NAV");
      });
  if (showPreview) {
    const std::string previewSecondary = currentPreview.author;
    const std::string previewSummary = normalizePreviewText(currentPreview.summary);
    const std::string previewTertiary =
        currentPreview.status.empty() ? previewSummary : currentPreview.status + " | " + previewSummary;
    ScreenDebugRecorder::setBody(currentPreview.title.c_str(),
                                 previewSecondary.empty() ? nullptr : previewSecondary.c_str(),
                                 previewTertiary.c_str());
  }

  renderer.displayBuffer();
}

void OpdsBookBrowserActivity::updatePreviewForSelection() {
  currentPreview = {};

  if (state != BrowserState::BROWSING || entries.empty() || selectorIndex < 0 ||
      selectorIndex >= static_cast<int>(entries.size())) {
    return;
  }

  const auto& entry = entries[selectorIndex];
  if (entry.type == OpdsEntryType::NAVIGATION) {
    return;
  }

  currentPreview.available = true;
  currentPreview.key = !entry.id.empty() ? entry.id : entry.href;
  currentPreview.title = entry.title;
  currentPreview.author = entry.author;
  currentPreview.summary = entry.summary.empty() ? NO_DESCRIPTION_TEXT : entry.summary;
  currentPreview.coverBmpPath = getPreviewCoverPath(entry, UrlUtils::buildUrl(server.url, currentPath));

  if (entry.type != OpdsEntryType::SERIES) {
    return;
  }

  const std::string seriesFeedUrl = UrlUtils::buildUrl(UrlUtils::buildUrl(server.url, currentPath), entry.href);
  const std::string cacheKey = !entry.id.empty() ? entry.id : seriesFeedUrl;
  auto cacheIt = seriesStatusCache.find(cacheKey);
  if (cacheIt != seriesStatusCache.end()) {
    if (!cacheIt->second.resolvedTitle.empty()) {
      currentPreview.title = cacheIt->second.resolvedTitle;
    }
    currentPreview.status = cacheIt->second.status;
    return;
  }

  std::vector<OpdsEntry> seriesEntries;
  std::string seriesFeedTitle;
  if (!fetchFeedData(seriesFeedUrl, seriesEntries, &seriesFeedTitle)) {
    return;
  }

  size_t serverChapterCount = 0;
  for (const auto& seriesEntry : seriesEntries) {
    if (seriesEntry.type != OpdsEntryType::BOOK) {
      continue;
    }

    if (isSeriesChapterFilename(getUrlBasename(seriesEntry.href))) {
      ++serverChapterCount;
    }
  }

  if (!seriesFeedTitle.empty()) {
    currentPreview.title = seriesFeedTitle;
  }
  const std::string seriesDir = resolveExistingSeriesDirectoryName(seriesFeedUrl, seriesFeedTitle, entry);
  currentPreview.status = buildSeriesPreviewStatus(countExistingSeriesChapters(seriesDir, seriesEntries), serverChapterCount);
  seriesStatusCache[cacheKey] = SeriesStatusSnapshot{currentPreview.title, currentPreview.status};
}

std::string OpdsBookBrowserActivity::getPreviewCoverPath(const OpdsEntry& entry, const std::string& baseUrl) {
  if (entry.imageHref.empty()) {
    return "";
  }

  const std::string localPath = buildPreviewCachePath(entry);
  if (Storage.exists(localPath.c_str())) {
    return localPath;
  }

  Storage.ensureDirectoryExists("/.crosspoint");
  Storage.ensureDirectoryExists("/.crosspoint/opds");
  const std::string remoteUrl = UrlUtils::buildUrl(baseUrl, entry.imageHref);
  const auto result = HttpDownloader::downloadToFile(remoteUrl, localPath, nullptr, server.username, server.password);
  return result == HttpDownloader::OK ? localPath : "";
}

void OpdsBookBrowserActivity::fetchFeed(const std::string& path) {
  if (server.url.empty()) {
    state = BrowserState::ERROR;
    errorMessage = tr(STR_NO_SERVER_URL);
    requestUpdate();
    return;
  }

  const std::string url = (path.find("http") == 0) ? path : UrlUtils::buildUrl(server.url, path);
  std::vector<OpdsEntry> parsedEntries;
  std::string nextUrl;
  std::string prevUrl;
  std::string parsedFeedTitle;
  std::string parsedSearchTemplate;
  if (!fetchFeedData(url, parsedEntries, &parsedFeedTitle, &parsedSearchTemplate, &nextUrl, &prevUrl)) {
    state = BrowserState::ERROR;
    errorMessage = tr(STR_FETCH_FEED_FAILED);
    requestUpdate();
    return;
  }

  searchTemplate = parsedSearchTemplate;
  currentFeedTitle = parsedFeedTitle;
  if (path.empty() && parsedEntries.size() == 1 && parsedEntries[0].type == OpdsEntryType::NAVIGATION) {
    currentPath = UrlUtils::buildUrl(url, parsedEntries[0].href);
    statusMessage = tr(STR_LOADING);
    requestUpdate(true);
    fetchFeed(currentPath);
    return;
  }

  entries = std::move(parsedEntries);

  if (!prevUrl.empty()) {
    entries.insert(entries.begin(), OpdsEntry{OpdsEntryType::NAVIGATION, tr(STR_PREV_PAGE), "", "", "", prevUrl, ""});
  }
  if (!nextUrl.empty()) {
    entries.push_back(OpdsEntry{OpdsEntryType::NAVIGATION, tr(STR_NEXT_PAGE), "", "", "", nextUrl, ""});
  }

  selectorIndex = 0;
  state = entries.empty() ? BrowserState::ERROR : BrowserState::BROWSING;
  if (entries.empty()) {
    errorMessage = tr(STR_NO_ENTRIES);
  } else {
    updatePreviewForSelection();
  }
  requestUpdate();
}

void OpdsBookBrowserActivity::navigateToEntry(const OpdsEntry& entry) {
  navigationHistory.push_back(currentPath);
  const std::string feedUrl = UrlUtils::buildUrl(server.url, currentPath);
  currentPath = UrlUtils::buildUrl(feedUrl, entry.href);

  state = BrowserState::LOADING;
  statusMessage = tr(STR_LOADING);
  entries.clear();
  currentPreview = {};
  selectorIndex = 0;
  requestUpdate(true);
  fetchFeed(currentPath);
}

void OpdsBookBrowserActivity::navigateBack() {
  if (navigationHistory.empty()) {
    onGoHome();
  } else {
    currentPath = navigationHistory.back();
    navigationHistory.pop_back();
    state = BrowserState::LOADING;
    statusMessage = tr(STR_LOADING);
    entries.clear();
    currentPreview = {};
    selectorIndex = 0;
    requestUpdate();
    fetchFeed(currentPath);
  }
}

void OpdsBookBrowserActivity::downloadBook(const OpdsEntry& book) {
  state = BrowserState::DOWNLOADING;
  statusMessage = book.title;
  downloadProgress = downloadTotal = 0;
  requestUpdate(true);

  const std::string feedUrl = UrlUtils::buildUrl(server.url, currentPath);
  const std::string downloadUrl = UrlUtils::buildUrl(feedUrl, book.href);
  const std::string remoteFilename = getUrlBasename(downloadUrl);
  const bool looksLikeSeriesChapter = isSeriesChapterFilename(remoteFilename);
  std::string filename;
  std::string localSeriesDir;

  if (looksLikeSeriesChapter) {
    localSeriesDir = resolveExistingSeriesDirectoryName(feedUrl, currentFeedTitle, book);
    Storage.ensureDirectoryExists(localSeriesDir.c_str());
    filename = localSeriesDir + "/" + remoteFilename;
  } else {
    filename = "/" +
               StringUtils::sanitizeFilename((book.author.empty() ? "" : book.author + " - ") + book.title) + ".epub";
  }
  LOG_DBG("OPDS", "Downloading: %s -> %s", downloadUrl.c_str(), filename.c_str());

  const auto result = HttpDownloader::downloadToFile(
      downloadUrl, filename,
      [this](const size_t downloaded, const size_t total) {
        downloadProgress = downloaded;
        downloadTotal = total;
        requestUpdate(true);
      },
      server.username, server.password);

  if (result == HttpDownloader::OK) {
    Epub(filename, "/.crosspoint").clearCache();
    if (looksLikeSeriesChapter) {
      ensureSeriesArtifacts(book, feedUrl, entries, downloadUrl, localSeriesDir);
    }
    state = BrowserState::BROWSING;
  } else {
    state = BrowserState::ERROR;
    errorMessage = tr(STR_DOWNLOAD_FAILED);
  }
  requestUpdate();
}

void OpdsBookBrowserActivity::downloadSeries(const OpdsEntry& entry) {
  state = BrowserState::DOWNLOADING;
  statusMessage = entry.title;
  downloadProgress = 0;
  downloadTotal = 0;
  requestUpdate(true);

  const std::string browseFeedUrl = UrlUtils::buildUrl(server.url, currentPath);
  const std::string seriesFeedUrl = UrlUtils::buildUrl(browseFeedUrl, entry.href);
  std::vector<OpdsEntry> seriesEntries;
  std::string seriesFeedTitle;
  if (!fetchFeedData(seriesFeedUrl, seriesEntries, &seriesFeedTitle)) {
    state = BrowserState::ERROR;
    errorMessage = tr(STR_FETCH_FEED_FAILED);
    requestUpdate();
    return;
  }

  std::vector<OpdsEntry> chapters;
  for (const auto& item : seriesEntries) {
    if (item.type == OpdsEntryType::BOOK) {
      chapters.push_back(item);
    }
  }

  if (chapters.empty()) {
    state = BrowserState::ERROR;
    errorMessage = tr(STR_NO_ENTRIES);
    requestUpdate();
    return;
  }

  const std::string localSeriesDir = resolveExistingSeriesDirectoryName(seriesFeedUrl, seriesFeedTitle, entry);
  Storage.ensureDirectoryExists(localSeriesDir.c_str());

  const bool hasStoryCover = !entry.imageHref.empty();
  downloadProgress = 0;
  size_t serverChapterCount = 0;

  std::string firstDownloadUrl;
  std::vector<std::pair<OpdsEntry, std::string>> pendingChapters;
  pendingChapters.reserve(chapters.size());
  for (size_t index = 0; index < chapters.size(); index++) {
    const auto& chapter = chapters[index];
    const std::string chapterUrl = UrlUtils::buildUrl(seriesFeedUrl, chapter.href);
    const std::string remoteFilename = getUrlBasename(chapterUrl);
    if (!isSeriesChapterFilename(remoteFilename)) {
      continue;
    }
    ++serverChapterCount;

    if (firstDownloadUrl.empty()) {
      firstDownloadUrl = chapterUrl;
    }

    const std::string localChapterPath = localSeriesDir + "/" + remoteFilename;
    if (Storage.exists(localChapterPath.c_str())) {
      continue;
    }

    pendingChapters.push_back({chapter, chapterUrl});
  }

  downloadTotal = pendingChapters.size() + 1 + (hasStoryCover ? 1 : 0);
  requestUpdate(true);

  if (hasStoryCover) {
    const std::string coverUrl = UrlUtils::buildUrl(browseFeedUrl, entry.imageHref);
    const std::string localCoverPath = localSeriesDir + "/cover.bmp";
    if (Storage.exists(localCoverPath.c_str())) {
      downloadProgress += 1;
      requestUpdate(true);
    } else {
      const auto coverResult =
          HttpDownloader::downloadToFile(coverUrl, localCoverPath, nullptr, server.username, server.password);
      if (coverResult == HttpDownloader::OK) {
        downloadProgress += 1;
        requestUpdate(true);
      }
    }
  }

  for (const auto& pending : pendingChapters) {
    const auto& chapter = pending.first;
    const auto& chapterUrl = pending.second;
    const std::string remoteFilename = getUrlBasename(chapterUrl);
    const std::string localChapterPath = localSeriesDir + "/" + remoteFilename;

    statusMessage = chapter.title.empty() ? remoteFilename : chapter.title;
    requestUpdate(true);

    const auto result =
        HttpDownloader::downloadToFile(chapterUrl, localChapterPath, nullptr, server.username, server.password);
    if (result != HttpDownloader::OK) {
      state = BrowserState::ERROR;
      errorMessage = tr(STR_DOWNLOAD_FAILED);
      requestUpdate();
      return;
    }

    Epub(localChapterPath, "/.crosspoint").clearCache();
    downloadProgress += 1;
    requestUpdate(true);
  }

  if (!ensureSeriesArtifacts(entry, seriesFeedUrl, chapters, firstDownloadUrl, localSeriesDir)) {
    LOG_DBG("OPDS", "Series manifest repair fallback failed for %s", localSeriesDir.c_str());
  }
  downloadProgress = downloadTotal;
  state = BrowserState::BROWSING;
  const std::string cacheKey = !entry.id.empty() ? entry.id : seriesFeedUrl;
  seriesStatusCache[cacheKey] =
      SeriesStatusSnapshot{seriesFeedTitle.empty() ? entry.title : seriesFeedTitle,
                           buildSeriesPreviewStatus(serverChapterCount, serverChapterCount)};
  updatePreviewForSelection();
  requestUpdate();
}

bool OpdsBookBrowserActivity::ensureSeriesArtifacts(const OpdsEntry& seriesEntry, const std::string& feedUrl,
                                                    const std::vector<OpdsEntry>& seriesEntries,
                                                    const std::string& firstDownloadUrl,
                                                    const std::string& localSeriesDir) {
  if (localSeriesDir.empty() || firstDownloadUrl.empty()) {
    return false;
  }

  const std::string localManifestPath = localSeriesDir + "/_series.json";
  const std::string remoteManifestUrl = getUrlParent(firstDownloadUrl) + "/_series.json";

  const auto manifestResult =
      HttpDownloader::downloadToFile(remoteManifestUrl, localManifestPath, nullptr, server.username, server.password);
  if (manifestResult == HttpDownloader::OK) {
    LOG_DBG("OPDS", "Downloaded series manifest: %s", remoteManifestUrl.c_str());
    downloadProgress = std::min(downloadProgress + 1, downloadTotal);
    requestUpdate(true);
    return true;
  }

  LOG_DBG("OPDS", "Remote series manifest unavailable, synthesizing from feed: %s", feedUrl.c_str());
  const bool synthesized = synthesizeSeriesManifest(feedUrl, seriesEntries, localSeriesDir, seriesEntry);
  if (synthesized) {
    downloadProgress = std::min(downloadProgress + 1, downloadTotal);
    requestUpdate(true);
  }
  return synthesized;
}

bool OpdsBookBrowserActivity::synthesizeSeriesManifest(const std::string& feedUrl,
                                                       const std::vector<OpdsEntry>& seriesEntries,
                                                       const std::string& localSeriesDir,
                                                       const OpdsEntry& seriesEntry) const {
  JsonDocument doc;
  doc["version"] = 1;
  doc["seriesId"] = feedUrl;
  doc["title"] = !seriesEntry.title.empty() ? seriesEntry.title
                                            : (currentFeedTitle.empty() ? localSeriesDir.substr(1) : currentFeedTitle);
  if (!seriesEntry.author.empty()) {
    doc["author"] = seriesEntry.author;
  }
  if (!seriesEntry.summary.empty()) {
    doc["description"] = seriesEntry.summary;
  }

  JsonArray chapters = doc["chapters"].to<JsonArray>();
  std::string firstChapterFile;
  for (const auto& entry : seriesEntries) {
    if (entry.type != OpdsEntryType::BOOK) {
      continue;
    }

    const std::string chapterFile = getUrlBasename(UrlUtils::buildUrl(feedUrl, entry.href));
    const int chapterIndex = parseChapterIndexFromFilename(chapterFile);
    if (chapterIndex <= 0) {
      continue;
    }

    if (firstChapterFile.empty()) {
      firstChapterFile = chapterFile;
    }

    JsonObject chapter = chapters.add<JsonObject>();
    chapter["chapterIndex"] = chapterIndex;
    chapter["title"] = entry.title;
    chapter["file"] = chapterFile;
  }

  if (chapters.size() == 0) {
    LOG_DBG("OPDS", "Could not synthesize manifest: no chapter-pattern entries found");
    return false;
  }

  if (Storage.exists((localSeriesDir + "/cover.bmp").c_str())) {
    doc["coverPath"] = "cover.bmp";
  } else if (!firstChapterFile.empty()) {
    doc["coverPath"] = firstChapterFile;
  }

  String manifestJson;
  serializeJson(doc, manifestJson);
  const std::string localManifestPath = localSeriesDir + "/_series.json";
  return Storage.writeFile(localManifestPath.c_str(), manifestJson);
}

void OpdsBookBrowserActivity::launchSearch() {
  consumeConfirm = true;
  state = BrowserState::SEARCH_INPUT;
  requestUpdate();

  auto keyboard = std::make_unique<KeyboardEntryActivity>(renderer, mappedInput, tr(STR_SEARCH));
  startActivityForResult(std::move(keyboard), [this](const ActivityResult& result) {
    state = BrowserState::BROWSING;
    if (!result.isCancelled) {
      performSearch(std::get<KeyboardResult>(result.data).text);
    } else {
      requestUpdate();
    }
  });
}

void OpdsBookBrowserActivity::performSearch(const std::string& query) {
  if (query.empty() || searchTemplate.empty()) {
    state = BrowserState::BROWSING;
    requestUpdate();
    return;
  }

  auto urlEncode = [](const std::string& s) {
    std::string out;
    out.reserve(s.size() * 3);
    for (unsigned char c : s) {
      if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
        out += static_cast<char>(c);
      } else {
        char buf[4];
        snprintf(buf, sizeof(buf), "%%%02X", c);
        out += buf;
      }
    }
    return out;
  };

  std::string url = searchTemplate;
  const std::string placeholder = "{searchTerms}";
  const size_t pos = url.find(placeholder);
  if (pos != std::string::npos) {
    url.replace(pos, placeholder.length(), urlEncode(query));
  }

  navigationHistory.push_back(currentPath);
  currentPath = url;

  state = BrowserState::LOADING;
  statusMessage = tr(STR_LOADING);
  requestUpdate(true);
  fetchFeed(url);
}

void OpdsBookBrowserActivity::checkAndConnectWifi() {
  if (WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0)) {
    state = BrowserState::LOADING;
    statusMessage = tr(STR_LOADING);
    requestUpdate();
    fetchFeed(currentPath);
    return;
  }
  launchWifiSelection();
}

void OpdsBookBrowserActivity::launchWifiSelection() {
  state = BrowserState::WIFI_SELECTION;
  requestUpdate();

  startActivityForResult(std::make_unique<WifiSelectionActivity>(renderer, mappedInput),
                         [this](const ActivityResult& result) { onWifiSelectionComplete(!result.isCancelled); });
}

void OpdsBookBrowserActivity::onWifiSelectionComplete(const bool connected) {
  if (connected) {
    state = BrowserState::LOADING;
    statusMessage = tr(STR_LOADING);
    requestUpdate(true);
    fetchFeed(currentPath);
  } else {
    WiFi.disconnect();
    WiFi.mode(WIFI_OFF);
    state = BrowserState::ERROR;
    errorMessage = tr(STR_WIFI_CONN_FAILED);
    requestUpdate();
  }
}
