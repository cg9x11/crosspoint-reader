#include "OpdsBookBrowserActivity.h"

#include <ArduinoJson.h>
#include <Bitmap.h>
#include <Epub.h>
#include <FsHelpers.h>
#include <GfxRenderer.h>
#include <HalStorage.h>
#include <I18n.h>
#include <Logging.h>
#include <OpdsStream.h>
#include <WiFi.h>

#include <algorithm>
#include <functional>
#include <vector>

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
constexpr unsigned long PREVIEW_DWELL_MS = 450;
constexpr const char* NO_DESCRIPTION_TEXT = "No description";
constexpr size_t SERIES_DOWNLOAD_BATCH_LIMIT = 25;
constexpr const char* OPDS_CACHE_DIR = "/.crosspoint/opds";

std::string summarizeFetchUrl(const std::string& url) {
  std::string summary = url;
  const size_t protocolPos = summary.find("://");
  if (protocolPos != std::string::npos) {
    summary.erase(0, protocolPos + 3);
  }
  const size_t queryPos = summary.find('?');
  if (queryPos != std::string::npos) {
    summary.resize(queryPos);
  }
  if (summary.size() > 36) {
    summary = summary.substr(0, 36);
  }
  return summary;
}

std::string summarizeErrorPath(const std::string& url) {
  std::string summary = summarizeFetchUrl(url);
  const size_t slashPos = summary.find('/');
  if (slashPos == std::string::npos) {
    return summary;
  }
  const std::string host = summary.substr(0, slashPos);
  const std::string path = summary.substr(slashPos);
  if (path.size() <= 24) {
    return host + path;
  }
  return host + "..." + path.substr(path.size() - 24);
}

std::string truncateLine(std::string text, const size_t maxLen = 36) {
  if (text.size() <= maxLen) {
    return text;
  }
  if (maxLen <= 3) {
    return text.substr(0, maxLen);
  }
  return text.substr(0, maxLen - 3) + "...";
}

std::string buildVerboseHttpErrorText(const std::string& url, const std::string& fallbackPhase) {
  const int httpCode = HttpDownloader::getLastHttpCode();
  const std::string raw = HttpDownloader::getLastErrorMessage();

  std::string phase = fallbackPhase;
  std::string detail;
  if (!raw.empty()) {
    const size_t firstSpace = raw.find(' ');
    if (firstSpace != std::string::npos && firstSpace > 0) {
      phase = raw.substr(0, firstSpace);
    }
    const std::string codeToken = "code=";
    const size_t codePos = raw.find(codeToken);
    if (codePos != std::string::npos) {
      const size_t detailStart = raw.find(' ', codePos + codeToken.size());
      if (detailStart != std::string::npos && detailStart + 1 < raw.size()) {
        detail = raw.substr(detailStart + 1);
      }
    }
  }

  std::string message = truncateLine(phase + " " + std::to_string(httpCode));
  message += "\n";
  message += truncateLine(summarizeErrorPath(url));
  if (!detail.empty()) {
    message += "\n";
    message += truncateLine(detail);
  }
  return message;
}

std::string buildFetchErrorText(const std::string& url) { return buildVerboseHttpErrorText(url, "FETCH"); }

std::string buildDownloadErrorText(const std::string& url, const HttpDownloader::DownloadError result) {
  switch (result) {
    case HttpDownloader::FILE_ERROR:
      return "FILE\n" + truncateLine(summarizeErrorPath(url));
    case HttpDownloader::ABORTED:
      return "ABORT\n" + truncateLine(summarizeErrorPath(url));
    case HttpDownloader::HTTP_ERROR:
    default:
      return buildVerboseHttpErrorText(url, "GET");
  }
}

std::vector<std::string> splitErrorLines(const std::string& text) {
  std::vector<std::string> lines;
  size_t start = 0;
  while (start <= text.size()) {
    const size_t end = text.find('\n', start);
    if (end == std::string::npos) {
      lines.push_back(text.substr(start));
      break;
    }
    lines.push_back(text.substr(start, end - start));
    start = end + 1;
  }
  return lines;
}

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

std::string buildSeriesDownloadBaseUrl(const std::string& seriesFeedUrl) {
  size_t end = seriesFeedUrl.find('?');
  if (end == std::string::npos) {
    end = seriesFeedUrl.find('#');
  }
  if (end == std::string::npos) {
    end = seriesFeedUrl.size();
  }

  const std::string normalized = seriesFeedUrl.substr(0, end);
  constexpr const char* marker = "/series/";
  const size_t markerPos = normalized.rfind(marker);
  if (markerPos == std::string::npos) {
    return "";
  }

  return normalized.substr(0, markerPos) + "/download/" + normalized.substr(markerPos + strlen(marker));
}

bool isSeriesChapterFilename(const std::string& filename) {
  if (filename.size() < 10 || filename.rfind("ch_", 0) != 0) {
    return false;
  }
  const size_t extPos = filename.find_last_of('.');
  if (extPos == std::string::npos) {
    return false;
  }
  const std::string ext = filename.substr(extPos);
  if (ext != ".epub" && ext != ".txt" && ext != ".md") {
    return false;
  }
  for (size_t i = 3; i < extPos; i++) {
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
  const size_t extPos = filename.find_last_of('.');
  return atoi(filename.substr(3, extPos - 3).c_str());
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
  return std::string(OPDS_CACHE_DIR) + "/" + std::to_string(hash) + ".bmp";
}

std::string buildMetadataCachePath(const std::string& currentPath, const OpdsEntry& entry) {
  const std::string cacheKey = currentPath + "|" + (!entry.id.empty() ? entry.id : entry.href);
  const size_t hash = std::hash<std::string>{}(cacheKey);
  return std::string(OPDS_CACHE_DIR) + "/meta_" + std::to_string(hash) + ".json";
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

bool hasUsableLocalChapterFile(const std::string& path);

size_t countLocalSeriesChapterFiles(const std::string& seriesDir) {
  if (seriesDir.empty()) {
    return 0;
  }

  auto dir = Storage.open(seriesDir.c_str());
  if (!dir || !dir.isDirectory()) {
    return 0;
  }

  dir.rewindDirectory();
  char name[256];
  std::vector<std::string> chapterPaths;
  size_t count = 0;
  for (auto file = dir.openNextFile(); file; file = dir.openNextFile()) {
    if (file.isDirectory()) {
      file.close();
      continue;
    }
    file.getName(name, sizeof(name));
    file.close();
    if (isSeriesChapterFilename(name)) {
      chapterPaths.emplace_back(seriesDir + "/" + std::string(name));
    }
  }
  dir.close();

  for (const auto& chapterPath : chapterPaths) {
    if (hasUsableLocalChapterFile(chapterPath)) {
      ++count;
    }
  }
  return count;
}

bool hasUsableLocalFile(const std::string& path, const size_t minSize = 1) {
  if (!Storage.exists(path.c_str())) {
    return false;
  }

  FsFile file;
  if (!Storage.openFileForRead("OPDS", path.c_str(), file) || !file || file.isDirectory()) {
    if (file) {
      file.close();
    }
    Storage.remove(path.c_str());
    return false;
  }

  const size_t fileSize = file.size();
  file.close();
  if (fileSize < minSize) {
    LOG_DBG("OPDS", "Removing stale file: %s size=%u", path.c_str(), static_cast<unsigned>(fileSize));
    Storage.remove(path.c_str());
    return false;
  }

  return true;
}

bool hasUsableLocalChapterFile(const std::string& path) {
  if (FsHelpers::hasEpubExtension(path)) {
    if (!hasUsableLocalFile(path, 256)) {
      return false;
    }

    FsFile file;
    if (!Storage.openFileForRead("OPDS", path.c_str(), file) || !file) {
      if (file) {
        file.close();
      }
      Storage.remove(path.c_str());
      return false;
    }

    const int first = file.read();
    const int second = file.read();
    file.close();
    if (first != 'P' || second != 'K') {
      LOG_DBG("OPDS", "Removing invalid epub payload: %s", path.c_str());
      Storage.remove(path.c_str());
      return false;
    }
    return true;
  }

  return hasUsableLocalFile(path, 8);
}

bool shouldSkipOptionalSeriesCoverDownload() {
  constexpr uint32_t kMinFreeHeap = 72 * 1024;
  constexpr uint32_t kMinLargestBlock = 32 * 1024;
  constexpr uint32_t kMinObservedFloor = 8 * 1024;
  const uint32_t freeHeap = ESP.getFreeHeap();
  const uint32_t largestBlock = ESP.getMaxAllocHeap();
  const uint32_t minHeap = ESP.getMinFreeHeap();
  const bool skip = freeHeap < kMinFreeHeap || largestBlock < kMinLargestBlock || minHeap < kMinObservedFloor;
  if (skip) {
    LOG_DBG("OPDS", "Skipping optional cover: heap=%u largest=%u min=%u", freeHeap, largestBlock, minHeap);
  }
  return skip;
}

bool shouldRefreshDownloadUi(unsigned long& lastUiUpdateAt, const bool force = false) {
  const unsigned long now = millis();
  if (!force && lastUiUpdateAt != 0 && (now - lastUiUpdateAt) < 200) {
    return false;
  }
  lastUiUpdateAt = now;
  return true;
}

bool shouldRefreshDownloadProgressUi(const size_t current, const size_t total, unsigned long& lastUiUpdateAt,
                                     int& lastPercent, const bool force = false) {
  int percent = -1;
  if (total > 0) {
    percent = static_cast<int>((current * 100) / total);
  } else if (current > 0) {
    percent = 100;
  }
  const bool percentChanged = percent != lastPercent;

  if (!force && !percentChanged && !shouldRefreshDownloadUi(lastUiUpdateAt, false)) {
    return false;
  }

  lastPercent = percent;
  return shouldRefreshDownloadUi(lastUiUpdateAt, force || percentChanged);
}

std::string buildLocalSeriesPreviewStatus(const std::string& seriesDir) {
  const std::string manifestPath = SeriesManifestStore::buildChapterPath(seriesDir, SeriesManifestStore::MANIFEST_FILE);
  if (Storage.exists(manifestPath.c_str())) {
    FsFile file;
    if (Storage.openFileForRead("OPDS", manifestPath.c_str(), file) && file) {
      size_t totalChapters = 0;
      constexpr size_t chunkSize = 512;
      constexpr const char* token = "\"chapterIndex\"";
      constexpr size_t tokenLen = 14;
      char chunk[chunkSize + tokenLen];
      size_t carryLen = 0;

      while (file.available() > 0) {
        const int bytesRead = file.read(chunk + carryLen, chunkSize);
        if (bytesRead <= 0) {
          break;
        }

        const size_t totalLen = carryLen + static_cast<size_t>(bytesRead);
        for (size_t i = 0; i + tokenLen <= totalLen; i++) {
          if (memcmp(chunk + i, token, tokenLen) == 0) {
            ++totalChapters;
          }
        }

        carryLen = std::min(tokenLen - 1, totalLen);
        if (carryLen > 0) {
          memmove(chunk, chunk + totalLen - carryLen, carryLen);
        }
      }
      file.close();

      if (totalChapters > 0) {
        return std::to_string(countLocalSeriesChapterFiles(seriesDir)) + "/" + std::to_string(totalChapters) +
               " chapters";
      }
    }
  }

  const size_t localChapterCount = countLocalSeriesChapterFiles(seriesDir);
  if (localChapterCount == 0) {
    return "";
  }

  return std::to_string(localChapterCount) + " downloaded";
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

bool formatSeriesDownloadDetail(const size_t overallCurrent, const size_t overallTotal, const size_t fileCurrent,
                                const size_t fileTotal, char* out, const size_t outSize) {
  if (out == nullptr || outSize == 0) {
    return false;
  }

  out[0] = '\0';
  if (overallTotal == 0 && fileTotal == 0) {
    return false;
  }
  if (overallTotal > 0 && fileTotal > 0) {
    const unsigned filePercent = static_cast<unsigned>((fileCurrent * 100) / fileTotal);
    snprintf(out, outSize, "Chapters %u/%u | File %u%%", static_cast<unsigned>(overallCurrent),
             static_cast<unsigned>(overallTotal), filePercent);
  } else if (overallTotal > 0) {
    snprintf(out, outSize, "Chapters %u/%u", static_cast<unsigned>(overallCurrent), static_cast<unsigned>(overallTotal));
  } else {
    const unsigned filePercent = static_cast<unsigned>((fileCurrent * 100) / fileTotal);
    snprintf(out, outSize, "File %u%%", filePercent);
  }

  return out[0] != '\0';
}

}  // namespace

void OpdsBookBrowserActivity::onEnter() {
  Activity::onEnter();

  if (ensureTraceLogReady()) {
    traceLogPrintf("OPDS", "browser_enter server=%s path=%s trace=%s\n", server.url.c_str(), currentPath.c_str(),
                   getTraceLogFilePath());
  }

  state = BrowserState::CHECK_WIFI;
  entries.clear();
  navigationHistory.clear();
  searchTemplate.clear();
  currentPath.clear();
  currentFeedTitle.clear();
  selectorIndex = 0;
  consumeConfirm = false;
  consumeBack = false;
  previewSelectorIndex = -1;
  previewReadyAt = 0;
  resetPreviewSummaryCache();
  currentPreview = {};
  pendingFetchPath.clear();
  hasPendingFetch = false;
  errorMessage.clear();
  statusMessage = tr(STR_CHECKING_WIFI);
  downloadProgress = 0;
  downloadTotal = 0;
  currentFileDownloaded = 0;
  currentFileTotal = 0;
  requestUpdate();

  checkAndConnectWifi();
}

void OpdsBookBrowserActivity::onExit() {
  Activity::onExit();
  WiFi.mode(WIFI_OFF);
  entries.clear();
  navigationHistory.clear();
  resetPreviewSummaryCache();
}

bool OpdsBookBrowserActivity::fetchFeedData(const std::string& url, std::vector<OpdsEntry>& outEntries,
                                            std::string* outFeedTitle, std::string* outSearchTemplate,
                                            std::string* outNextUrl, std::string* outPrevUrl,
                                            const bool lightweightEntries, const size_t maxEntries) const {
  LOG_DBG("OPDS", "Fetching: %s", url.c_str());

  OpdsParser parser(!lightweightEntries, maxEntries);
  {
    OpdsParserStream stream{parser};
    if (!HttpDownloader::fetchUrl(url, stream, server.username, server.password)) {
      LOG_ERR("OPDS", "Fetch feed failed: %s", HttpDownloader::getLastErrorMessage().c_str());
      return false;
    }
    stream.finish();
  }

  if (!parser) {
    LOG_ERR("OPDS", "Parser rejected feed: %s", url.c_str());
    return false;
  }

  if (outSearchTemplate) {
    *outSearchTemplate = parser.takeSearchTemplate();
  }
  if (outFeedTitle) {
    *outFeedTitle = parser.takeFeedTitle();
  }
  if (outNextUrl) {
    *outNextUrl = parser.takeNextPageUrl();
  }
  if (outPrevUrl) {
    *outPrevUrl = parser.takePrevPageUrl();
  }
  outEntries = std::move(parser).getEntries();
  return true;
}

void OpdsBookBrowserActivity::loop() {
  if (hasPendingFetch && state == BrowserState::LOADING) {
    if (ensureTraceLogReady()) {
      traceLogPrintf("OPDS", "loop_fetch path=%s\n", pendingFetchPath.c_str());
    }
    const std::string nextPath = pendingFetchPath;
    pendingFetchPath.clear();
    hasPendingFetch = false;
    fetchFeed(nextPath);
    return;
  }

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
        queueFetch(currentPath);
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
      return;
    }
  }

  if (entries.empty()) {
    return;
  }

  if (previewSelectorIndex == selectorIndex && previewReadyAt > 0 && millis() >= previewReadyAt &&
      (!currentPreview.available || currentPreview.key != (!entries[selectorIndex].id.empty() ? entries[selectorIndex].id
                                                                                              : entries[selectorIndex].href))) {
    updatePreviewForSelection();
    previewReadyAt = 0;
    requestUpdate();
  }

  const int pageItems = currentPreview.available ? PREVIEW_LIST_PAGE_ITEMS : FULL_LIST_PAGE_ITEMS;
  buttonNavigator.onNextRelease([this] {
    selectorIndex = ButtonNavigator::nextIndex(selectorIndex, entries.size());
    schedulePreviewUpdate();
    requestUpdate();
  });
  buttonNavigator.onPreviousRelease([this] {
    selectorIndex = ButtonNavigator::previousIndex(selectorIndex, entries.size());
    schedulePreviewUpdate();
    requestUpdate();
  });
  buttonNavigator.onNextContinuous([this, pageItems] {
    selectorIndex = ButtonNavigator::nextPageIndex(selectorIndex, entries.size(), pageItems);
    schedulePreviewUpdate();
    requestUpdate();
  });
  buttonNavigator.onPreviousContinuous([this, pageItems] {
    selectorIndex = ButtonNavigator::previousPageIndex(selectorIndex, entries.size(), pageItems);
    schedulePreviewUpdate();
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
  previewSummaryVisibleLines = maxSummaryLines;
  previewSummaryTotalLines = 0;
  if (maxSummaryLines <= 0) {
    return;
  }
  ensurePreviewSummaryCache(preview, textWidth);
  previewSummaryTotalLines = static_cast<int>(previewSummaryLines.size());
  const size_t startIndex = std::min(static_cast<size_t>(previewSummaryScrollOffset), previewSummaryLines.size());
  const size_t endIndex = std::min(startIndex + static_cast<size_t>(maxSummaryLines), previewSummaryLines.size());
  for (size_t i = startIndex; i < endIndex; ++i) {
    renderer.drawText(SMALL_FONT_ID, textX, textY, previewSummaryLines[i].c_str(), true);
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
    auto errorLines = splitErrorLines(errorMessage);
    const int lineHeight = renderer.getLineHeight(UI_10_FONT_ID) + 2;
    int textY = pageHeight / 2 + 2;
    for (size_t i = 0; i < errorLines.size() && i < 4; i++) {
      renderer.drawCenteredText(UI_10_FONT_ID, textY, errorLines[i].c_str());
      textY += lineHeight;
    }
    const auto labels = mappedInput.mapLabels(tr(STR_BACK), tr(STR_RETRY), "", "");
    GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
    ScreenDebugRecorder::setBody(tr(STR_ERROR_MSG), errorMessage.c_str());
    ScreenDebugRecorder::setButtonHints(labels.btn1, labels.btn2, labels.btn3, labels.btn4);
    renderer.displayBuffer();
    return;
  }

  if (state == BrowserState::DOWNLOADING) {
    char downloadDetail[96];
    const bool hasDownloadDetail =
        formatSeriesDownloadDetail(downloadProgress, downloadTotal, currentFileDownloaded, currentFileTotal, downloadDetail,
                                   sizeof(downloadDetail));
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 - 40, tr(STR_DOWNLOADING));
    const auto title = renderer.truncatedText(UI_10_FONT_ID, statusMessage.c_str(), pageWidth - 40);
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 - 10, title.c_str());
    if (hasDownloadDetail) {
      renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 + 8, downloadDetail);
    }
    if (downloadTotal > 0) {
      GUI.drawProgressBar(renderer, Rect{50, pageHeight / 2 + 32, pageWidth - 100, 20}, downloadProgress,
                          downloadTotal);
    }
    ScreenDebugRecorder::setBody(tr(STR_DOWNLOADING), statusMessage.c_str(), hasDownloadDetail ? downloadDetail : nullptr);
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
  resetPreviewSummaryCache();

  if (state != BrowserState::BROWSING || entries.empty() || selectorIndex < 0 ||
      selectorIndex >= static_cast<int>(entries.size())) {
    return;
  }

  auto& entry = entries[selectorIndex];
  if (entry.type == OpdsEntryType::NAVIGATION) {
    return;
  }

  const bool allowRootPreviewHydration = !currentPath.empty();
  if (allowRootPreviewHydration && (entry.author.empty() && entry.summary.empty() && entry.imageHref.empty()) &&
      !hydrateEntryMetadata(entry, false)) {
    LOG_DBG("OPDS", "Preview hydrate skipped/failed for %s", entry.href.c_str());
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

  if (currentPath.empty()) {
    return;
  }

  const std::string seriesFeedUrl = UrlUtils::buildUrl(UrlUtils::buildUrl(server.url, currentPath), entry.href);
  const std::string seriesDir = resolveExistingSeriesDirectoryName(seriesFeedUrl, currentFeedTitle, entry);
  currentPreview.status = buildLocalSeriesPreviewStatus(seriesDir);
}

bool OpdsBookBrowserActivity::hydrateEntryMetadata(OpdsEntry& entry, const bool allowRemoteFetch) {
  if (server.url.empty()) {
    return false;
  }

  const std::string metadataCachePath = buildMetadataCachePath(currentPath, entry);
  if (Storage.exists(metadataCachePath.c_str())) {
    const String cachedJson = Storage.readFile(metadataCachePath.c_str());
    if (cachedJson.length() > 0) {
      JsonDocument doc;
      if (deserializeJson(doc, cachedJson.c_str()) == DeserializationError::Ok) {
        entry.author = doc["author"] | entry.author;
        entry.summary = doc["summary"] | entry.summary;
        entry.imageHref = doc["imageHref"] | entry.imageHref;
        entry.id = doc["id"] | entry.id;
        LOG_DBG("OPDS", "Hydrate cache hit: %s", entry.href.c_str());
        return true;
      }
    }
  }

  if (!allowRemoteFetch) {
    return false;
  }

  const std::string feedUrl = UrlUtils::buildUrl(server.url, currentPath);
  std::vector<OpdsEntry> detailedEntries;
  if (!fetchFeedData(feedUrl, detailedEntries, nullptr, nullptr, nullptr, nullptr, false)) {
    LOG_ERR("OPDS", "Hydrate feed fetch failed: %s", feedUrl.c_str());
    return false;
  }

  for (auto& detailed : detailedEntries) {
    const bool sameHref = detailed.href == entry.href;
    const bool sameId = !entry.id.empty() && !detailed.id.empty() && detailed.id == entry.id;
    if (!sameHref && !sameId) {
      continue;
    }

    if (entry.author.empty()) {
      entry.author = std::move(detailed.author);
    }
    if (entry.summary.empty()) {
      entry.summary = std::move(detailed.summary);
    }
    if (entry.imageHref.empty()) {
      entry.imageHref = std::move(detailed.imageHref);
    }
    if (entry.id.empty()) {
      entry.id = std::move(detailed.id);
    }

    if (Storage.ensureDirectoryExists("/.crosspoint") && Storage.ensureDirectoryExists(OPDS_CACHE_DIR)) {
      JsonDocument cacheDoc;
      cacheDoc["id"] = entry.id;
      cacheDoc["author"] = entry.author;
      cacheDoc["summary"] = entry.summary;
      cacheDoc["imageHref"] = entry.imageHref;
      String cacheJson;
      serializeJson(cacheDoc, cacheJson);
      Storage.writeFile(metadataCachePath.c_str(), cacheJson);
    }
    return true;
  }

  LOG_DBG("OPDS", "Hydrate entry metadata not found: %s", entry.href.c_str());
  return false;
}

void OpdsBookBrowserActivity::schedulePreviewUpdate() {
  currentPreview = {};
  resetPreviewSummaryCache();
  if (state != BrowserState::BROWSING || entries.empty() || selectorIndex < 0 ||
      selectorIndex >= static_cast<int>(entries.size())) {
    previewSelectorIndex = -1;
    previewReadyAt = 0;
    return;
  }

  const auto& entry = entries[selectorIndex];
  if (entry.type == OpdsEntryType::NAVIGATION) {
    previewSelectorIndex = -1;
    previewReadyAt = 0;
    return;
  }

  previewSelectorIndex = selectorIndex;
  previewReadyAt = millis() + PREVIEW_DWELL_MS;
}

void OpdsBookBrowserActivity::resetPreviewSummaryCache() {
  previewSummaryScrollOffset = 0;
  previewSummaryTotalLines = 0;
  previewSummaryVisibleLines = 0;
  previewSummaryCacheWidth = 0;
  previewSummaryCacheKey.clear();
  previewSummaryLines.clear();
}

void OpdsBookBrowserActivity::ensurePreviewSummaryCache(const PreviewData& preview, const int textWidth) {
  if (textWidth <= 0) {
    previewSummaryLines.clear();
    previewSummaryCacheWidth = 0;
    previewSummaryCacheKey.clear();
    return;
  }

  const std::string cacheKey = preview.key + "|" + preview.summary;
  if (previewSummaryCacheWidth == textWidth && previewSummaryCacheKey == cacheKey && !previewSummaryLines.empty()) {
    return;
  }

  const std::string summaryText = normalizePreviewText(preview.summary);
  previewSummaryLines = renderer.wrappedText(SMALL_FONT_ID, summaryText.c_str(), textWidth, 48);
  previewSummaryCacheWidth = textWidth;
  previewSummaryCacheKey = std::move(cacheKey);
}

std::string OpdsBookBrowserActivity::getPreviewCoverPath(const OpdsEntry& entry, const std::string& baseUrl) {
  if (entry.imageHref.empty()) {
    return "";
  }

  const std::string localPath = buildPreviewCachePath(entry);
  if (Storage.exists(localPath.c_str())) {
    return localPath;
  }
  (void)baseUrl;
  return "";
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
  if (path.empty()) {
    LOG_DBG("OPDS", "Root feed parse begin");
    if (!fetchFeedData(url, parsedEntries, nullptr, nullptr, nullptr, nullptr, true, 12)) {
      state = BrowserState::ERROR;
      errorMessage = buildFetchErrorText(url);
      requestUpdate();
      return;
    }
    LOG_DBG("OPDS", "Root feed parse done: entries=%u", static_cast<unsigned>(parsedEntries.size()));
    if (parsedEntries.size() == 1 && parsedEntries[0].type == OpdsEntryType::NAVIGATION) {
      LOG_DBG("OPDS", "Auto-opening root navigation feed: %s", parsedEntries[0].href.c_str());
      currentPath = UrlUtils::buildUrl(url, parsedEntries[0].href);
      queueFetch(currentPath);
      return;
    }

    searchTemplate.clear();
    currentFeedTitle.clear();
    LOG_DBG("OPDS", "Root feed swap");
    entries.swap(parsedEntries);
    selectorIndex = 0;
    state = entries.empty() ? BrowserState::ERROR : BrowserState::BROWSING;
    if (entries.empty()) {
      errorMessage = tr(STR_NO_ENTRIES);
    } else {
      currentPreview = {};
      previewSelectorIndex = -1;
      previewReadyAt = 0;
    }
    LOG_DBG("OPDS", "Root feed ready");
    requestUpdate();
    return;
  }

  std::string nextUrl;
  std::string prevUrl;
  std::string parsedFeedTitle;
  std::string parsedSearchTemplate;
  if (!fetchFeedData(url, parsedEntries, &parsedFeedTitle, &parsedSearchTemplate, &nextUrl, &prevUrl, true, 12)) {
    state = BrowserState::ERROR;
    errorMessage = buildFetchErrorText(url);
    requestUpdate();
    return;
  }
  searchTemplate.swap(parsedSearchTemplate);
  currentFeedTitle.swap(parsedFeedTitle);
  entries.swap(parsedEntries);

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
    schedulePreviewUpdate();
  }
  requestUpdate();
}

void OpdsBookBrowserActivity::queueFetch(const std::string& path) {
  state = BrowserState::LOADING;
  statusMessage = tr(STR_LOADING);
  pendingFetchPath = path;
  hasPendingFetch = true;
  if (ensureTraceLogReady()) {
    traceLogPrintf("OPDS", "queue_fetch path=%s\n", path.c_str());
  }
  requestUpdate(true);
}

void OpdsBookBrowserActivity::navigateToEntry(const OpdsEntry& entry) {
  navigationHistory.push_back(currentPath);
  const std::string feedUrl = UrlUtils::buildUrl(server.url, currentPath);
  currentPath = UrlUtils::buildUrl(feedUrl, entry.href);

  state = BrowserState::LOADING;
  statusMessage = tr(STR_LOADING);
  entries.clear();
  currentPreview = {};
  resetPreviewSummaryCache();
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
    resetPreviewSummaryCache();
    selectorIndex = 0;
    requestUpdate(true);
    fetchFeed(currentPath);
  }
}

void OpdsBookBrowserActivity::downloadBook(const OpdsEntry& book) {
  OpdsEntry resolvedBook = book;
  if ((resolvedBook.author.empty() && resolvedBook.summary.empty() && resolvedBook.imageHref.empty())) {
    hydrateEntryMetadata(resolvedBook);
  }

  state = BrowserState::DOWNLOADING;
  statusMessage = resolvedBook.title;
  downloadProgress = downloadTotal = 0;
  currentFileDownloaded = 0;
  currentFileTotal = 0;
  requestUpdate(true);
  unsigned long lastUiUpdateAt = millis();
  int lastProgressPercent = -1;

  const std::string feedUrl = UrlUtils::buildUrl(server.url, currentPath);
  const std::string downloadUrl = UrlUtils::buildUrl(feedUrl, resolvedBook.href);
  const std::string remoteFilename = getUrlBasename(downloadUrl);
  const bool looksLikeSeriesChapter = isSeriesChapterFilename(remoteFilename);
  std::string filename;
  std::string localSeriesDir;

  if (looksLikeSeriesChapter) {
    localSeriesDir = resolveExistingSeriesDirectoryName(feedUrl, currentFeedTitle, resolvedBook);
    if (!Storage.ensureDirectoryExists(localSeriesDir.c_str())) {
      LOG_ERR("OPDS", "Failed to create series dir: %s", localSeriesDir.c_str());
      state = BrowserState::ERROR;
      errorMessage = "FILE " + localSeriesDir.substr(1, std::min<size_t>(42, localSeriesDir.size() > 1 ? localSeriesDir.size() - 1 : 0));
      requestUpdate();
      return;
    }
    filename = localSeriesDir + "/" + remoteFilename;
  } else {
    filename = "/" +
               StringUtils::sanitizeFilename((resolvedBook.author.empty() ? "" : resolvedBook.author + " - ") +
                                             resolvedBook.title) +
               ".epub";
  }
  LOG_DBG("OPDS", "Downloading: %s -> %s", downloadUrl.c_str(), filename.c_str());
  const bool targetExistedBeforeDownload = Storage.exists(filename.c_str());

  const auto result = HttpDownloader::downloadToFile(
      downloadUrl, filename,
      [this, &lastUiUpdateAt, &lastProgressPercent](const size_t downloaded, const size_t total) {
        currentFileDownloaded = downloaded;
        currentFileTotal = total;
        downloadProgress = downloaded;
        downloadTotal = total;
        if (shouldRefreshDownloadProgressUi(downloaded, total, lastUiUpdateAt, lastProgressPercent,
                                            downloaded == total)) {
          requestUpdate(true);
        }
      },
      server.username, server.password);

  if (result == HttpDownloader::OK) {
    currentFileDownloaded = 0;
    currentFileTotal = 0;
    if (FsHelpers::hasEpubExtension(filename) && targetExistedBeforeDownload) {
      Epub(filename, "/.crosspoint").clearCache();
    }
    if (looksLikeSeriesChapter) {
      ensureSeriesArtifacts(resolvedBook, feedUrl, entries, downloadUrl, localSeriesDir, true);
    }
    state = BrowserState::BROWSING;
  } else {
    state = BrowserState::ERROR;
    errorMessage = buildDownloadErrorText(downloadUrl, result);
    LOG_ERR("OPDS", "Book download failed: %s", HttpDownloader::getLastErrorMessage().c_str());
  }
  requestUpdate();
}

void OpdsBookBrowserActivity::downloadSeries(const OpdsEntry& entry) {
  OpdsEntry resolvedEntry = entry;
  struct PendingManifestDownload {
    SeriesChapter chapter;
    std::string localChapterPath;
    std::string chapterUrl;
  };
  struct PendingFeedDownload {
    OpdsEntry chapter;
    std::string localChapterPath;
    std::string chapterUrl;
  };

  state = BrowserState::DOWNLOADING;
  statusMessage = resolvedEntry.title;
  downloadProgress = 0;
  downloadTotal = 0;
  currentFileDownloaded = 0;
  currentFileTotal = 0;
  requestUpdate(true);
  unsigned long lastUiUpdateAt = millis();
  int lastProgressPercent = -1;

  const std::string returnPath = currentPath;
  const std::string browseFeedUrl = UrlUtils::buildUrl(server.url, currentPath);
  const std::string seriesFeedUrl = UrlUtils::buildUrl(browseFeedUrl, resolvedEntry.href);
  const std::string localSeriesDir = resolveExistingSeriesDirectoryName(seriesFeedUrl, "", resolvedEntry);
  auto releaseDownloadMemory = [this]() {
    LOG_DBG("OPDS", "Releasing browse memory before series download: heap=%u min=%u", ESP.getFreeHeap(),
            ESP.getMinFreeHeap());
    entries.clear();
    navigationHistory.clear();
    searchTemplate.clear();
    currentFeedTitle.clear();
    currentPreview = {};
    previewSelectorIndex = -1;
    previewReadyAt = 0;
    LOG_DBG("OPDS", "After release browse memory: heap=%u min=%u", ESP.getFreeHeap(), ESP.getMinFreeHeap());
  };
  auto reloadBrowseFeed = [this, &returnPath]() {
    currentPath = returnPath;
    state = BrowserState::LOADING;
    statusMessage = tr(STR_LOADING);
    requestUpdate(true);
    fetchFeed(returnPath);
  };
  if (!Storage.ensureDirectoryExists(localSeriesDir.c_str())) {
    LOG_ERR("OPDS", "Failed to create series dir: %s", localSeriesDir.c_str());
    state = BrowserState::ERROR;
    errorMessage = "FILE " + localSeriesDir.substr(1, std::min<size_t>(42, localSeriesDir.size() > 1 ? localSeriesDir.size() - 1 : 0));
    requestUpdate();
    return;
  }

  const std::string remoteSeriesBaseUrl = buildSeriesDownloadBaseUrl(seriesFeedUrl);
  SeriesManifest manifestMetadata;
  bool manifestStored = false;
  LOG_DBG("OPDS", "Skip remote _series.json fetch for memory safety");

  std::string remoteCoverUrl;
  bool skipCoverDownloadForSession = false;
  const bool skipRemoteManifestFetchForSession = true;
  if (manifestStored && !manifestMetadata.coverPath.empty() && !remoteSeriesBaseUrl.empty()) {
    remoteCoverUrl = remoteSeriesBaseUrl + "/" + manifestMetadata.coverPath;
  } else if (!resolvedEntry.imageHref.empty()) {
    remoteCoverUrl = UrlUtils::buildUrl(browseFeedUrl, resolvedEntry.imageHref);
  }
  const bool hasStoryCover = !remoteCoverUrl.empty();
  size_t finalServerChapterCount = 0;
  size_t finalLocalChapterCount = 0;
  std::string finalSeriesFeedTitle;

  auto tryDownloadSeriesCover = [&]() {
    if (!hasStoryCover || skipCoverDownloadForSession || shouldSkipOptionalSeriesCoverDownload()) {
      return;
    }
    const std::string localCoverPath = localSeriesDir + "/cover.bmp";
    if (hasUsableLocalFile(localCoverPath, 64)) {
      return;
    }

    const auto coverResult =
        HttpDownloader::downloadToFile(remoteCoverUrl, localCoverPath, nullptr, server.username, server.password);
    if (coverResult != HttpDownloader::OK) {
      skipCoverDownloadForSession = true;
      LOG_ERR("OPDS", "Series cover download failed: %s", HttpDownloader::getLastErrorMessage().c_str());
    }
  };

  bool useStoredManifest = SeriesManifestStore::loadMetadataFromSeriesDir(localSeriesDir, manifestMetadata);
  if (useStoredManifest) {
    finalServerChapterCount = SeriesManifestStore::countChaptersFromSeriesDir(localSeriesDir);
  }

  if (useStoredManifest && !remoteSeriesBaseUrl.empty()) {
    constexpr size_t kManifestSliceSize = 64;
    while (true) {
      size_t pendingChapterCount = 0;
      finalServerChapterCount = SeriesManifestStore::countChaptersFromSeriesDir(localSeriesDir);
      if (finalServerChapterCount == 0) {
        LOG_DBG("OPDS", "Stored manifest unusable, falling back to feed: %s", localSeriesDir.c_str());
        Storage.remove((localSeriesDir + "/_series.json").c_str());
        useStoredManifest = false;
        break;
      }

      std::vector<PendingManifestDownload> pendingBatch;
      pendingBatch.reserve(SERIES_DOWNLOAD_BATCH_LIMIT);
      bool manifestScanned = true;
      for (size_t sliceStart = 0; sliceStart < finalServerChapterCount; sliceStart += kManifestSliceSize) {
        std::vector<SeriesChapter> slice;
        if (!SeriesManifestStore::loadChapterSliceFromSeriesDir(localSeriesDir, sliceStart, kManifestSliceSize, slice)) {
          manifestScanned = false;
          break;
        }
        if (slice.empty()) {
          break;
        }

        for (const auto& chapter : slice) {
          const std::string localChapterPath = localSeriesDir + "/" + chapter.file;
          if (hasUsableLocalChapterFile(localChapterPath)) {
            continue;
          }
          ++pendingChapterCount;
          if (pendingBatch.size() < SERIES_DOWNLOAD_BATCH_LIMIT) {
            pendingBatch.push_back(PendingManifestDownload{chapter, localChapterPath, remoteSeriesBaseUrl + "/" + chapter.file});
          }
        }
      }

      if (!manifestScanned) {
        LOG_DBG("OPDS", "Stored manifest unusable, falling back to feed: %s", localSeriesDir.c_str());
        Storage.remove((localSeriesDir + "/_series.json").c_str());
        useStoredManifest = false;
        break;
      }

      finalLocalChapterCount = finalServerChapterCount - pendingChapterCount;
      if (pendingChapterCount == 0) {
        break;
      }

      downloadProgress = finalLocalChapterCount;
      downloadTotal = finalServerChapterCount;
      releaseDownloadMemory();
      requestUpdate(true);

      size_t downloadedThisBatch = 0;
      for (const auto& pending : pendingBatch) {
        if (downloadedThisBatch >= SERIES_DOWNLOAD_BATCH_LIMIT) {
          break;
        }

        statusMessage = pending.chapter.title.empty() ? pending.chapter.file : pending.chapter.title;
        currentFileDownloaded = 0;
        currentFileTotal = 0;
        if (shouldRefreshDownloadUi(lastUiUpdateAt)) {
          requestUpdate(true);
        }

        const auto result = HttpDownloader::downloadToFile(
            pending.chapterUrl, pending.localChapterPath,
            [this, &lastUiUpdateAt](const size_t downloaded, const size_t total) {
              currentFileDownloaded = downloaded;
              currentFileTotal = total;
              if (shouldRefreshDownloadUi(lastUiUpdateAt)) {
                requestUpdate(true);
              }
            },
                                                           server.username, server.password);
        if (result != HttpDownloader::OK) {
          state = BrowserState::ERROR;
          errorMessage = buildDownloadErrorText(pending.chapterUrl, result);
          LOG_ERR("OPDS", "Series chapter download failed: %s", HttpDownloader::getLastErrorMessage().c_str());
          requestUpdate();
          return;
        }

        ++downloadedThisBatch;
        ++finalLocalChapterCount;
        downloadProgress = finalLocalChapterCount;
        currentFileDownloaded = 0;
        currentFileTotal = 0;
        if (shouldRefreshDownloadProgressUi(downloadProgress, downloadTotal, lastUiUpdateAt, lastProgressPercent,
                                            true)) {
          requestUpdate(true);
        }
      }

      if (pendingChapterCount > downloadedThisBatch) {
        LOG_DBG("OPDS", "Series manifest batch complete: downloaded=%d remaining=%d limit=%d",
                static_cast<int>(downloadedThisBatch), static_cast<int>(pendingChapterCount - downloadedThisBatch),
                static_cast<int>(SERIES_DOWNLOAD_BATCH_LIMIT));
      } else {
        downloadProgress = downloadTotal;
        LOG_DBG("OPDS", "Series fully downloaded from manifest in current session");
        break;
      }
    }

    if (useStoredManifest) {
      tryDownloadSeriesCover();
      reloadBrowseFeed();
      return;
    }
  }

  while (true) {
    std::vector<OpdsEntry> seriesEntries;
    std::string seriesFeedTitle;
    if (!fetchFeedData(seriesFeedUrl, seriesEntries, &seriesFeedTitle, nullptr, nullptr, nullptr, true, 0)) {
      state = BrowserState::ERROR;
      errorMessage = tr(STR_FETCH_FEED_FAILED);
      requestUpdate();
      return;
    }
    finalSeriesFeedTitle = seriesFeedTitle;

    bool hasChapterEntries = false;
    size_t serverChapterCount = 0;
    size_t pendingChapterCount = 0;
    std::string firstDownloadUrl;
    std::vector<PendingFeedDownload> pendingBatch;
    pendingBatch.reserve(SERIES_DOWNLOAD_BATCH_LIMIT);

    for (const auto& chapter : seriesEntries) {
      if (chapter.type != OpdsEntryType::BOOK) {
        continue;
      }
      hasChapterEntries = true;
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
      if (hasUsableLocalChapterFile(localChapterPath)) {
        continue;
      }

      ++pendingChapterCount;
      if (pendingBatch.size() < SERIES_DOWNLOAD_BATCH_LIMIT) {
        pendingBatch.push_back(PendingFeedDownload{chapter, localChapterPath, chapterUrl});
      }
    }

    if (!hasChapterEntries) {
      state = BrowserState::ERROR;
      errorMessage = tr(STR_NO_ENTRIES);
      requestUpdate();
      return;
    }

    finalServerChapterCount = serverChapterCount;
    finalLocalChapterCount = serverChapterCount - pendingChapterCount;
    if (pendingChapterCount == 0) {
      break;
    }

    downloadProgress = finalLocalChapterCount;
    downloadTotal = finalServerChapterCount;
    releaseDownloadMemory();
    requestUpdate(true);

    size_t downloadedThisBatch = 0;
    for (const auto& pending : pendingBatch) {
      if (downloadedThisBatch >= SERIES_DOWNLOAD_BATCH_LIMIT) {
        break;
      }

      statusMessage = pending.chapter.title.empty() ? getUrlBasename(pending.chapterUrl) : pending.chapter.title;
      currentFileDownloaded = 0;
      currentFileTotal = 0;
      if (shouldRefreshDownloadUi(lastUiUpdateAt)) {
        requestUpdate(true);
      }

      const auto result = HttpDownloader::downloadToFile(
          pending.chapterUrl, pending.localChapterPath,
          [this, &lastUiUpdateAt](const size_t downloaded, const size_t total) {
            currentFileDownloaded = downloaded;
            currentFileTotal = total;
            if (shouldRefreshDownloadUi(lastUiUpdateAt)) {
              requestUpdate(true);
            }
          },
          server.username, server.password);
      if (result != HttpDownloader::OK) {
        state = BrowserState::ERROR;
        errorMessage = buildDownloadErrorText(pending.chapterUrl, result);
        LOG_ERR("OPDS", "Series chapter download failed: %s", HttpDownloader::getLastErrorMessage().c_str());
        requestUpdate();
        return;
      }

      ++downloadedThisBatch;
      ++finalLocalChapterCount;
      downloadProgress = finalLocalChapterCount;
      currentFileDownloaded = 0;
      currentFileTotal = 0;
      if (shouldRefreshDownloadProgressUi(downloadProgress, downloadTotal, lastUiUpdateAt, lastProgressPercent,
                                          true)) {
        requestUpdate(true);
      }
    }

    if (!ensureSeriesArtifacts(resolvedEntry, seriesFeedUrl, seriesEntries, firstDownloadUrl, localSeriesDir,
                               !skipRemoteManifestFetchForSession)) {
      LOG_DBG("OPDS", "Series manifest repair fallback failed for %s", localSeriesDir.c_str());
    }
    if (pendingChapterCount > downloadedThisBatch) {
      LOG_DBG("OPDS", "Series batch complete: downloaded=%d remaining=%d limit=%d",
              static_cast<int>(downloadedThisBatch), static_cast<int>(pendingChapterCount - downloadedThisBatch),
              static_cast<int>(SERIES_DOWNLOAD_BATCH_LIMIT));
    } else {
      downloadProgress = downloadTotal;
      LOG_DBG("OPDS", "Series fully downloaded in current session");
      break;
    }
  }

  tryDownloadSeriesCover();
  currentFileDownloaded = 0;
  currentFileTotal = 0;
  reloadBrowseFeed();
}

bool OpdsBookBrowserActivity::ensureSeriesArtifacts(const OpdsEntry& seriesEntry, const std::string& feedUrl,
                                                    const std::vector<OpdsEntry>& seriesEntries,
                                                    const std::string& firstDownloadUrl,
                                                    const std::string& localSeriesDir,
                                                    const bool allowRemoteManifestFetch) {
  if (localSeriesDir.empty() || firstDownloadUrl.empty()) {
    return false;
  }

  const std::string localManifestPath = localSeriesDir + "/_series.json";
  if (allowRemoteManifestFetch) {
    const std::string remoteManifestUrl = getUrlParent(firstDownloadUrl) + "/_series.json";
    const auto manifestResult =
        HttpDownloader::downloadToFile(remoteManifestUrl, localManifestPath, nullptr, server.username, server.password);
    if (manifestResult == HttpDownloader::OK) {
      LOG_DBG("OPDS", "Downloaded series manifest: %s", remoteManifestUrl.c_str());
      requestUpdate(true);
      return true;
    }
  }

  LOG_DBG("OPDS", "Remote series manifest unavailable, synthesizing from feed: %s", feedUrl.c_str());
  const bool synthesized = synthesizeSeriesManifest(feedUrl, seriesEntries, localSeriesDir, seriesEntry);
  if (synthesized) {
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
  for (const auto& entry : seriesEntries) {
    if (entry.type != OpdsEntryType::BOOK) {
      continue;
    }

    const std::string chapterFile = getUrlBasename(UrlUtils::buildUrl(feedUrl, entry.href));
    const int chapterIndex = parseChapterIndexFromFilename(chapterFile);
    if (chapterIndex <= 0) {
      continue;
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
  if (ensureTraceLogReady()) {
    traceLogPrintf("OPDS", "check_wifi status=%d ip=%u.%u.%u.%u\n", static_cast<int>(WiFi.status()), WiFi.localIP()[0],
                   WiFi.localIP()[1], WiFi.localIP()[2], WiFi.localIP()[3]);
  }
  if (WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0)) {
    state = BrowserState::LOADING;
    statusMessage = tr(STR_LOADING);
    requestUpdate(true);
    fetchFeed(currentPath);
    return;
  }
  launchWifiSelection();
}

void OpdsBookBrowserActivity::launchWifiSelection() {
  if (ensureTraceLogReady()) {
    traceLogPrintf("OPDS", "launch_wifi_selection\n");
  }
  state = BrowserState::WIFI_SELECTION;
  requestUpdate();

  startActivityForResult(std::make_unique<WifiSelectionActivity>(renderer, mappedInput),
                         [this](const ActivityResult& result) { onWifiSelectionComplete(!result.isCancelled); });
}

void OpdsBookBrowserActivity::onWifiSelectionComplete(const bool connected) {
  if (ensureTraceLogReady()) {
    traceLogPrintf("OPDS", "wifi_selection_complete connected=%d\n", connected ? 1 : 0);
  }
  if (connected) {
    queueFetch(currentPath);
  } else {
    WiFi.disconnect();
    WiFi.mode(WIFI_OFF);
    state = BrowserState::ERROR;
    errorMessage = tr(STR_WIFI_CONN_FAILED);
    requestUpdate();
  }
}
