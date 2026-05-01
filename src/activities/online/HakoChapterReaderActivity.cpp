#include "HakoChapterReaderActivity.h"

#include <CrossPointSettings.h>
#include <FontCacheManager.h>
#include <GfxRenderer.h>
#include <HalStorage.h>
#include <I18n.h>

#include <algorithm>
#include <cctype>
#include <cmath>
#include <cstring>
#include <functional>
#include <sstream>

#include "../../RecentBooksStore.h"
#include "../../TrackedSeriesStore.h"
#include "../../plugins/OnlineSourceBridge.h"
#include "../../util/StringUtils.h"
#include "../reader/ReaderUtils.h"
#include "HakoChapterListActivity.h"
#include "components/UITheme.h"

namespace {
constexpr char READER_CACHE_DIR[] = "/.crosspoint/data/online_cache";
constexpr int TOC_PAGE_SIZE = 50;

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

int inferChapterNumberFromRef(const HakoChapterRef& ref) {
  if (ref.index > 0) {
    return static_cast<int>(ref.index);
  }

  const std::string safeUrl = lowerAscii(StringUtils::toDisplaySafeAscii(ref.url));
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

  const std::string safeTitle = lowerAscii(StringUtils::toDisplaySafeAscii(ref.title));
  const char* titleMarkers[] = {"chuong ", "chuong:", "chuong-", "chap ", "chap:", "chap-", "chapter "};
  for (const char* marker : titleMarkers) {
    const size_t markerPos = safeTitle.find(marker);
    if (markerPos == std::string::npos) {
      continue;
    }
    size_t pos = markerPos + std::strlen(marker);
    while (pos < safeTitle.size() && safeTitle[pos] == ' ') {
      pos++;
    }
    const int value = parseDigitsAt(safeTitle, pos);
    if (value > 0) {
      return value;
    }
  }

  return parseLastNumberInText(safeTitle);
}

std::string trimCopy(const std::string& input) {
  size_t start = 0;
  while (start < input.size() && std::isspace(static_cast<unsigned char>(input[start])) != 0) start++;
  size_t end = input.size();
  while (end > start && std::isspace(static_cast<unsigned char>(input[end - 1])) != 0) end--;
  return input.substr(start, end - start);
}

bool ensureReaderCacheDir() {
  Storage.mkdir("/.crosspoint");
  Storage.mkdir("/.crosspoint/data");
  Storage.mkdir(READER_CACHE_DIR);
  return true;
}

void releaseChapterPayload(HakoChapterContent& chapter) {
  if (!chapter.textFilePath.empty()) {
    Storage.remove(chapter.textFilePath.c_str());
    chapter.textFilePath.clear();
  }
  chapter.text.clear();
  chapter.text.shrink_to_fit();
  chapter.html.clear();
  chapter.html.shrink_to_fit();
}

std::string buildReaderCachePath(const HakoChapterRef& ref) {
  const std::string key = ref.url.empty() ? ref.title : ref.url;
  const size_t hashValue = std::hash<std::string>{}(key + "|" + std::to_string(millis()));
  return std::string(READER_CACHE_DIR) + "/rdr_" + std::to_string(hashValue) + ".bin";
}

bool readUtf8Line(FsFile& file, std::string& outLine) {
  outLine.clear();
  while (file.available() > 0) {
    const int value = file.read();
    if (value < 0) {
      break;
    }
    const char ch = static_cast<char>(value);
    if (ch == '\n') {
      if (!outLine.empty() && outLine.back() == '\r') {
        outLine.pop_back();
      }
      return true;
    }
    outLine.push_back(ch);
  }

  if (!outLine.empty() && outLine.back() == '\r') {
    outLine.pop_back();
  }
  return !outLine.empty();
}

template <typename EmitFn>
bool appendWrappedLine(const GfxRenderer& renderer, int fontId, int maxWidth, const std::string& source, EmitFn&& emitLine) {
  if (source.empty()) {
    return emitLine(std::string());
  }

  std::istringstream stream(source);
  std::string word;
  std::string current;
  while (stream >> word) {
    std::string candidate = current.empty() ? word : current + " " + word;
    if (renderer.getTextWidth(fontId, candidate.c_str()) <= maxWidth) {
      current = std::move(candidate);
      continue;
    }

    if (!current.empty()) {
      if (!emitLine(current)) {
        return false;
      }
      current.clear();
    }

    if (renderer.getTextWidth(fontId, word.c_str()) <= maxWidth) {
      current = word;
      continue;
    }

    std::string chunk;
    for (char ch : word) {
      std::string next = chunk + ch;
      if (!chunk.empty() && renderer.getTextWidth(fontId, next.c_str()) > maxWidth) {
        if (!emitLine(chunk)) {
          return false;
        }
        chunk.assign(1, ch);
      } else {
        chunk = std::move(next);
      }
    }
    current = std::move(chunk);
  }

  if (!current.empty()) {
    return emitLine(current);
  }
  return true;
}
}  // namespace

int HakoChapterReaderActivity::pageCount() const {
  return std::max(1, static_cast<int>(pageLineCounts.empty() ? 0 : pageLineCounts.size()));
}

std::string HakoChapterReaderActivity::recentBookPath() const {
  if (pluginInfo.id.empty() || seriesUrl.empty()) {
    return {};
  }
  return RecentBooksStore::buildOnlinePath(pluginInfo.id, seriesUrl, OnlineSourceBridge::runtimeProfileFor(pluginInfo));
}

std::string HakoChapterReaderActivity::resolveRecentCoverUrl() const {
  if (trackedSeriesId.empty()) {
    return {};
  }

  TRACKED_SERIES_STORE.ensureLoaded();
  const auto* existing = TRACKED_SERIES_STORE.getById(trackedSeriesId);
  return existing ? existing->coverUrl : std::string{};
}

void HakoChapterReaderActivity::syncRecentBook(const bool moveToFront, const bool persist) const {
  if (pluginInfo.id.empty() || seriesUrl.empty()) {
    return;
  }

  const std::string title = seriesTitle.empty() ? StringUtils::toDisplaySafeAscii(chapter.ref.title) : seriesTitle;
  const std::string author = seriesAuthor;
  RECENT_BOOKS.addOrUpdateOnlineBook(
      pluginInfo.id, OnlineSourceBridge::runtimeProfileFor(pluginInfo), seriesUrl, title, author, resolveRecentCoverUrl(),
      chapter.ref.url, chapter.ref.title, static_cast<uint32_t>(std::max(0, currentPage)),
      static_cast<uint32_t>(pageCount()), moveToFront, persist);
}

void HakoChapterReaderActivity::saveReadingProgress() const {
  if (!trackedSeriesId.empty()) {
    TRACKED_SERIES_STORE.ensureLoaded();
    const auto* existing = TRACKED_SERIES_STORE.getById(trackedSeriesId);
    if (existing) {
      auto updated = *existing;
      updated.lastReadChapterUrl = chapter.ref.url;
      updated.lastReadChapterTitle = chapter.ref.title;
      updated.lastReadPage = static_cast<uint32_t>(currentPage);
      updated.lastReadPageCount = static_cast<uint32_t>(pageCount());
      std::string ignoredError;
      TRACKED_SERIES_STORE.upsert(updated, &ignoredError);
    }
  }

  syncRecentBook(false, false);
}

void HakoChapterReaderActivity::restoreReadingProgress() {
  const int totalPages = pageCount();
  if (initialPageMode == InitialPageMode::Start) {
    currentPage = 0;
    return;
  }
  if (initialPageMode == InitialPageMode::End) {
    currentPage = totalPages - 1;
    return;
  }

  if (trackedSeriesId.empty()) {
    return;
  }

  TRACKED_SERIES_STORE.ensureLoaded();
  const auto* existing = TRACKED_SERIES_STORE.getById(trackedSeriesId);
  if (!existing || existing->lastReadChapterUrl != chapter.ref.url) {
    return;
  }

  currentPage = std::max(0, std::min(static_cast<int>(existing->lastReadPage), totalPages - 1));
}

int HakoChapterReaderActivity::currentAbsoluteChapterIndex() const {
  if (chapterIndex >= 0 && chapterIndex < static_cast<int>(chapters.size()) && chapters[chapterIndex].index > 0) {
    return static_cast<int>(chapters[chapterIndex].index);
  }
  if (chapter.ref.index > 0) {
    return static_cast<int>(chapter.ref.index);
  }
  if (chapterIndex >= 0 && chapterIndex < static_cast<int>(chapters.size()) && pagedCurrentPage > 0) {
    return ((pagedCurrentPage - 1) * TOC_PAGE_SIZE) + chapterIndex + 1;
  }
  if (!pagedTocMode && chapterIndex >= 0 && chapterIndex < static_cast<int>(chapters.size())) {
    return chapterIndex + 1;
  }
  return inferChapterNumberFromRef(chapter.ref);
}

bool HakoChapterReaderActivity::canUsePagedTocFallback() const {
  return !seriesUrl.empty() && OnlineSourceBridge::supportsPagedToc(pluginInfo);
}

bool HakoChapterReaderActivity::hasPreviousChapter() const {
  if (chapterIndex > 0 && chapterIndex < static_cast<int>(chapters.size())) {
    return true;
  }
  return canUsePagedTocFallback() && currentAbsoluteChapterIndex() > 1;
}

bool HakoChapterReaderActivity::hasNextChapter() const {
  if (chapterIndex >= 0 && chapterIndex + 1 < static_cast<int>(chapters.size())) {
    return true;
  }
  if (!canUsePagedTocFallback()) {
    return false;
  }
  if (pagedTotalPages > 1 && pagedCurrentPage > 0 && pagedCurrentPage < pagedTotalPages) {
    return true;
  }
  return currentAbsoluteChapterIndex() > 0;
}

bool HakoChapterReaderActivity::loadPagedChapterContext(const int targetAbsoluteIndex, std::vector<HakoChapterRef>& outChapters,
                                                        int& outLocalIndex, int& outPage, int& outTotalPages) const {
  outChapters.clear();
  outLocalIndex = -1;
  outPage = 1;
  outTotalPages = 1;

  if ((!pagedTocMode && !canUsePagedTocFallback()) || seriesUrl.empty() || targetAbsoluteIndex < 1) {
    return false;
  }

  OnlineSourceBridge::TocPageResult pageResult;
  const int targetPage = std::max(1, ((targetAbsoluteIndex - 1) / TOC_PAGE_SIZE) + 1);
  if (!OnlineSourceBridge::fetchTocPage(pluginInfo, seriesUrl, targetPage, pageResult) || pageResult.chapters.empty()) {
    return false;
  }

  outChapters = std::move(pageResult.chapters);
  outPage = pageResult.page;
  outTotalPages = std::max(1, pageResult.totalPages);
  for (size_t index = 0; index < outChapters.size(); ++index) {
    if (static_cast<int>(outChapters[index].index) == targetAbsoluteIndex) {
      outLocalIndex = static_cast<int>(index);
      break;
    }
  }

  if (outLocalIndex < 0) {
    const int fallbackIndex = targetAbsoluteIndex - ((outPage - 1) * TOC_PAGE_SIZE) - 1;
    if (fallbackIndex >= 0 && fallbackIndex < static_cast<int>(outChapters.size())) {
      outLocalIndex = fallbackIndex;
    }
  }

  return outLocalIndex >= 0 && outLocalIndex < static_cast<int>(outChapters.size());
}

bool HakoChapterReaderActivity::openChapterAtIndex(const int targetIndex, const InitialPageMode targetPageMode) {
  if (targetIndex < 0 || targetIndex >= static_cast<int>(chapters.size())) {
    return false;
  }

  HakoChapterContent nextChapter;
  {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, targetIndex > chapterIndex ? "Loading next chapter..." : "Loading chapter...");
    renderer.displayBuffer();
  }

  if (!OnlineSourceBridge::fetchChapter(pluginInfo, chapters[targetIndex], nextChapter)) {
    RenderLock lock(*this);
    const std::string message =
        OnlineSourceBridge::getLastError().empty() ? "Failed to load chapter" : OnlineSourceBridge::getLastError();
    GUI.drawPopup(renderer, message.c_str());
    requestUpdate();
    return false;
  }

  saveReadingProgress();
  activityManager.replaceCurrentActivity(std::make_unique<HakoChapterReaderActivity>(
      renderer, mappedInput, pluginInfo, std::move(nextChapter), chapters, targetIndex, trackedSeriesId, seriesTitle, seriesAuthor,
      seriesUrl, pagedTocMode, targetPageMode, pagedCurrentPage, pagedTotalPages));
  return true;
}

bool HakoChapterReaderActivity::openChapterAtAbsoluteIndex(const int targetAbsoluteIndex,
                                                           const InitialPageMode targetPageMode) {
  if (targetAbsoluteIndex < 1) {
    return false;
  }

  for (size_t index = 0; index < chapters.size(); ++index) {
    if (static_cast<int>(chapters[index].index) == targetAbsoluteIndex) {
      return openChapterAtIndex(static_cast<int>(index), targetPageMode);
    }
  }

  std::vector<HakoChapterRef> targetChapters;
  int localIndex = -1;
  int targetPage = 1;
  int totalPages = 1;
  if (!loadPagedChapterContext(targetAbsoluteIndex, targetChapters, localIndex, targetPage, totalPages)) {
    RenderLock lock(*this);
    const std::string message =
        OnlineSourceBridge::getLastError().empty() ? "Failed to load chapter list" : OnlineSourceBridge::getLastError();
    GUI.drawPopup(renderer, message.c_str());
    requestUpdate();
    return false;
  }

  HakoChapterContent nextChapter;
  {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Loading chapter...");
    renderer.displayBuffer();
  }

  if (!OnlineSourceBridge::fetchChapter(pluginInfo, targetChapters[localIndex], nextChapter)) {
    RenderLock lock(*this);
    const std::string message =
        OnlineSourceBridge::getLastError().empty() ? "Failed to load chapter" : OnlineSourceBridge::getLastError();
    GUI.drawPopup(renderer, message.c_str());
    requestUpdate();
    return false;
  }

  saveReadingProgress();
  activityManager.replaceCurrentActivity(std::make_unique<HakoChapterReaderActivity>(
      renderer, mappedInput, pluginInfo, std::move(nextChapter), std::move(targetChapters), localIndex, trackedSeriesId, seriesTitle,
      seriesAuthor, seriesUrl, true, targetPageMode, targetPage, totalPages));
  return true;
}

bool HakoChapterReaderActivity::openAdjacentChapter(const int delta, const InitialPageMode targetPageMode) {
  const int localTargetIndex = chapterIndex + delta;
  if (localTargetIndex >= 0 && localTargetIndex < static_cast<int>(chapters.size())) {
    return openChapterAtIndex(localTargetIndex, targetPageMode);
  }

  if (!canUsePagedTocFallback()) {
    return false;
  }

  const int absoluteIndex = currentAbsoluteChapterIndex();
  return absoluteIndex > 0 ? openChapterAtAbsoluteIndex(absoluteIndex + delta, targetPageMode) : false;
}

void HakoChapterReaderActivity::openChapterList() {
  if (chapters.empty() && !canUsePagedTocFallback()) {
    return;
  }

  startActivityForResult(
      std::make_unique<HakoChapterListActivity>(
          renderer, mappedInput, pluginInfo, seriesTitle.empty() ? StringUtils::toDisplaySafeAscii(chapter.ref.title) : seriesTitle,
          seriesAuthor, canUsePagedTocFallback() ? std::vector<HakoChapterRef>{} : chapters, false, trackedSeriesId, seriesUrl,
          canUsePagedTocFallback(),
          chapter.ref.url, chapter.ref.title, currentAbsoluteChapterIndex(), true),
      [this](const ActivityResult& result) {
        if (result.isCancelled || !std::holds_alternative<OnlineChapterResult>(result.data)) {
          return;
        }
        const int targetIndex = std::get<OnlineChapterResult>(result.data).chapterIndex;
        if (canUsePagedTocFallback()) {
          const int currentAbsoluteIndex = currentAbsoluteChapterIndex();
          if (targetIndex + 1 == currentAbsoluteIndex) {
            requestUpdate();
            return;
          }
          openChapterAtAbsoluteIndex(targetIndex + 1, InitialPageMode::Start);
          return;
        }
        if (targetIndex == chapterIndex) {
          requestUpdate();
          return;
        }
        openChapterAtIndex(targetIndex, InitialPageMode::Start);
      });
}

void HakoChapterReaderActivity::paginate() {
  pageCachePath.clear();
  pageStartOffsets.clear();
  pageLineCounts.clear();
  currentPage = 0;

  const auto& metrics = UITheme::getInstance().getMetrics();
  int marginTop = 0;
  int marginRight = 0;
  int marginBottom = 0;
  int marginLeft = 0;
  renderer.getOrientedViewableTRBL(&marginTop, &marginRight, &marginBottom, &marginLeft);
  marginTop += metrics.headerHeight + metrics.topPadding + metrics.verticalSpacing + metrics.tabBarHeight;
  marginLeft += SETTINGS.screenMargin + metrics.contentSidePadding / 2;
  marginRight += SETTINGS.screenMargin + metrics.contentSidePadding / 2;
  marginBottom += std::max(metrics.buttonHintsHeight, static_cast<int>(SETTINGS.screenMargin));

  const int viewportWidth = renderer.getScreenWidth() - marginLeft - marginRight;
  const int viewportHeight = renderer.getScreenHeight() - marginTop - marginBottom;
  const int fontId = SETTINGS.getReaderFontId();
  const int lineHeight =
      std::max(1, static_cast<int>(std::lround(renderer.getLineHeight(fontId) * SETTINGS.getReaderLineCompression())));
  linesPerPage = std::max(1, viewportHeight / std::max(1, lineHeight));
  pagesUntilFullRefresh = SETTINGS.getRefreshFrequency();

  ensureReaderCacheDir();
  pageCachePath = buildReaderCachePath(chapter.ref);
  Storage.remove(pageCachePath.c_str());

  FsFile cacheFile;
  if (!Storage.openFileForWrite("HCR", pageCachePath, cacheFile)) {
    releaseChapterPayload(chapter);
    pageCachePath.clear();
    return;
  }

  uint16_t currentPageLineCount = 0;
  bool emittedAnyLine = false;
  bool pendingParagraphGap = false;
  bool writeOk = true;

  auto emitPageLine = [&](const std::string& line) {
    if (currentPageLineCount == 0) {
      pageStartOffsets.push_back(static_cast<uint32_t>(cacheFile.position()));
    }
    if (!line.empty() && cacheFile.write(line.data(), line.size()) != line.size()) {
      writeOk = false;
      return false;
    }
    if (cacheFile.write("\n", 1) != 1) {
      writeOk = false;
      return false;
    }
    emittedAnyLine = true;
    currentPageLineCount++;
    if (currentPageLineCount >= linesPerPage) {
      pageLineCounts.push_back(currentPageLineCount);
      currentPageLineCount = 0;
    }
    return true;
  };

  auto processParagraph = [&](const std::string& rawParagraph) {
    const std::string trimmed = trimCopy(rawParagraph);
    if (trimmed.empty()) {
      pendingParagraphGap = emittedAnyLine;
      return true;
    }

    if (pendingParagraphGap && !emitPageLine(std::string())) {
      return false;
    }
    pendingParagraphGap = true;

    return appendWrappedLine(renderer, fontId, viewportWidth, trimmed,
                             [&](const std::string& line) { return emitPageLine(line); });
  };

  bool sourceOk = true;
  if (!chapter.textFilePath.empty()) {
    FsFile sourceFile;
    if (!Storage.openFileForRead("HCR", chapter.textFilePath, sourceFile)) {
      sourceOk = false;
    } else {
      std::string paragraph;
      while (readUtf8Line(sourceFile, paragraph)) {
        if (!processParagraph(paragraph)) {
          sourceOk = false;
          break;
        }
      }
      sourceFile.close();
    }
  } else {
    const std::string& textSource = chapter.text.empty() ? chapter.html : chapter.text;
    size_t pos = 0;
    while (sourceOk && pos <= textSource.size()) {
      const size_t lineEnd = textSource.find('\n', pos);
      std::string paragraph =
          lineEnd == std::string::npos ? textSource.substr(pos) : textSource.substr(pos, lineEnd - pos);
      if (!paragraph.empty() && paragraph.back() == '\r') {
        paragraph.pop_back();
      }
      if (!processParagraph(paragraph)) {
        sourceOk = false;
        break;
      }
      if (lineEnd == std::string::npos) {
        break;
      }
      pos = lineEnd + 1;
    }
  }

  if (!sourceOk && !emittedAnyLine) {
    emitPageLine("Failed to load chapter");
  } else if (!emittedAnyLine) {
    emitPageLine("(Empty chapter)");
  }

  if (currentPageLineCount > 0 || pageLineCounts.empty()) {
    pageLineCounts.push_back(std::max<uint16_t>(1, currentPageLineCount));
  }

  cacheFile.flush();
  cacheFile.close();

  if (!writeOk || pageStartOffsets.empty() || pageLineCounts.empty()) {
    Storage.remove(pageCachePath.c_str());
    pageCachePath.clear();
    pageStartOffsets.clear();
    pageLineCounts.clear();
    releaseChapterPayload(chapter);
    return;
  }

  releaseChapterPayload(chapter);
}

void HakoChapterReaderActivity::cleanupTransientFiles() {
  if (!pageCachePath.empty()) {
    Storage.remove(pageCachePath.c_str());
    pageCachePath.clear();
  }
  releaseChapterPayload(chapter);
}

void HakoChapterReaderActivity::onEnter() {
  Activity::onEnter();
  ReaderUtils::applyOrientation(renderer, SETTINGS.orientation);
  paginate();
  restoreReadingProgress();
  syncRecentBook(true, true);
  const std::string path = recentBookPath();
  if (!path.empty()) {
    RECENT_BOOKS.startReadingSession(path);
  }
  requestUpdate();
}

void HakoChapterReaderActivity::onExit() {
  saveReadingProgress();
  const std::string path = recentBookPath();
  if (!path.empty()) {
    RECENT_BOOKS.finishReadingSession(path);
  }
  cleanupTransientFiles();
  Activity::onExit();
  renderer.setOrientation(GfxRenderer::Orientation::Portrait);
}

void HakoChapterReaderActivity::loop() {
  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    finish();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm) && (!chapters.empty() || canUsePagedTocFallback())) {
    openChapterList();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Left) && currentPage > 0) {
    leftShortPending = true;
  }

  if (leftLongHandled && mappedInput.wasReleased(MappedInputManager::Button::Left)) {
    leftLongHandled = false;
    return;
  }

  if (!leftLongHandled && leftShortPending && mappedInput.isPressed(MappedInputManager::Button::Left) &&
      mappedInput.getHeldTime() >= 450) {
    leftShortPending = false;
    leftLongHandled = true;
    currentPage = 0;
    saveReadingProgress();
    requestUpdate();
    return;
  }

  if (leftShortPending && mappedInput.isPressed(MappedInputManager::Button::Left)) {
    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Left) && leftShortPending) {
    leftShortPending = false;
  }

  const auto pageTurn = ReaderUtils::detectPageTurn(mappedInput);
  const int totalPages = pageCount();

  if (pageTurn.prev && currentPage > 0) {
    currentPage--;
    saveReadingProgress();
    requestUpdate();
  } else if (pageTurn.prev && currentPage == 0 && hasPreviousChapter()) {
    openAdjacentChapter(-1, InitialPageMode::End);
  } else if (pageTurn.next && currentPage < totalPages - 1) {
    currentPage++;
    saveReadingProgress();
    requestUpdate();
  } else if (pageTurn.next && currentPage == totalPages - 1 && hasNextChapter()) {
    openAdjacentChapter(1, InitialPageMode::Start);
  }
}

void HakoChapterReaderActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int fontId = SETTINGS.getReaderFontId();
  const int lineHeight =
      std::max(1, static_cast<int>(std::lround(renderer.getLineHeight(fontId) * SETTINGS.getReaderLineCompression())));
  const int startX = metrics.contentSidePadding;
  const int startY = metrics.topPadding + metrics.headerHeight + metrics.tabBarHeight + metrics.verticalSpacing * 2;
  const int totalPages = pageCount();

  const std::string safeChapterTitle = StringUtils::toDisplaySafeAscii(chapter.ref.title);
  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, safeChapterTitle.c_str());
  const std::string subHeader = "Page " + std::to_string(currentPage + 1) + "/" + std::to_string(totalPages);
  GUI.drawSubHeader(renderer, Rect{0, metrics.topPadding + metrics.headerHeight, pageWidth, metrics.tabBarHeight},
                    subHeader.c_str());

  auto renderChapterLines = [&]() {
    int y = startY;
    bool renderedAnyLine = false;
    if (!pageCachePath.empty() && currentPage >= 0 && currentPage < static_cast<int>(pageStartOffsets.size()) &&
        currentPage < static_cast<int>(pageLineCounts.size())) {
      FsFile cacheFile;
      if (Storage.openFileForRead("HCR", pageCachePath, cacheFile) &&
          cacheFile.seek(pageStartOffsets[static_cast<size_t>(currentPage)])) {
        std::string line;
        const int lineCount = pageLineCounts[static_cast<size_t>(currentPage)];
        for (int i = 0; i < lineCount && readUtf8Line(cacheFile, line); ++i) {
          renderer.drawText(fontId, startX, y, line.c_str(), true);
          y += lineHeight;
          renderedAnyLine = true;
        }
        cacheFile.close();
      }
    }

    if (!renderedAnyLine) {
      renderer.drawText(fontId, startX, y, "(Empty chapter)", true);
    }
  };

  auto* fcm = renderer.getFontCacheManager();
  auto scope = fcm->createPrewarmScope();
  renderChapterLines();
  scope.endScanAndPrewarm();

  renderChapterLines();

  const char* leftLabel = hasPreviousChapter() && currentPage == 0 ? "Prev ch" : tr(STR_DIR_LEFT);
  const char* rightLabel = hasNextChapter() && currentPage == totalPages - 1 ? "Next ch" : tr(STR_DIR_RIGHT);
  const bool canOpenChapterList = !chapters.empty() || canUsePagedTocFallback();
  const auto labels = mappedInput.mapLabels(tr(STR_BACK), canOpenChapterList ? "Chapters" : "", leftLabel, rightLabel);
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  ReaderUtils::displayWithRefreshCycle(renderer, pagesUntilFullRefresh);

  if (ReaderUtils::shouldUseTextAntiAliasing()) {
    ReaderUtils::renderAntiAliased(renderer, [&renderChapterLines]() { renderChapterLines(); });
  }
}
