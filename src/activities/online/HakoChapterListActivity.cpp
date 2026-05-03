#include "HakoChapterListActivity.h"

#include <algorithm>

#include <GfxRenderer.h>
#include <I18n.h>

#include "../../TrackedSeriesStore.h"
#include "../../plugins/OnlineSourceBridge.h"
#include "../../util/StringUtils.h"
#include "HakoChapterReaderActivity.h"
#include "components/UITheme.h"
#include "fontIds.h"

namespace {
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

std::string makeSectionTag(const std::string& sectionTitle) {
  const std::string safe = StringUtils::toDisplaySafeAscii(sectionTitle);
  if (safe.empty()) return std::string();
  return "[" + safe + "]";
}

int parseLeadingChapterNumberFromTitle(const std::string& title) {
  const std::string safeTitle = lowerAscii(StringUtils::toDisplaySafeAscii(title));
  const char* markers[] = {"chuong ", "chuong:", "chuong-", "chap ", "chap:", "chap-", "chapter "};
  for (const char* marker : markers) {
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

int parseChapterNumberFromUrl(const std::string& url) {
  const std::string safeUrl = lowerAscii(StringUtils::toDisplaySafeAscii(url));
  const char* markers[] = {"chuong-", "chuong/", "chap-", "chap/", "chapter-", "chapter/"};
  for (const char* marker : markers) {
    const size_t markerPos = safeUrl.find(marker);
    if (markerPos == std::string::npos) {
      continue;
    }
    const int value = parseDigitsAt(safeUrl, markerPos + std::strlen(marker));
    if (value > 0) {
      return value;
    }
  }
  return parseLastNumberInText(safeUrl);
}

int inferChapterNumber(const std::string& url, const std::string& title) {
  const int fromUrl = parseChapterNumberFromUrl(url);
  if (fromUrl > 0) {
    return fromUrl;
  }
  return parseLeadingChapterNumberFromTitle(title);
}

int pageStartIndexFor(const std::vector<HakoChapterRef>& chapters, int currentPage, const CpPluginInfo& pluginInfo) {
  if (!chapters.empty() && chapters.front().index > 0) {
    return static_cast<int>(chapters.front().index);
  }

  const int pageSize = std::max(1, OnlineSourceBridge::pagedTocPageSize(pluginInfo));
  return ((std::max(1, currentPage) - 1) * pageSize) + 1;
}

int resolveAbsoluteChapterIndex(const HakoChapterRef& chapter, const std::vector<HakoChapterRef>& chapters, int currentPage,
                                int selectedIndex, const CpPluginInfo& pluginInfo) {
  if (chapter.index > 0) {
    return static_cast<int>(chapter.index);
  }

  const int inferred = inferChapterNumber(chapter.url, chapter.title);
  if (inferred > 0) {
    return inferred;
  }

  return pageStartIndexFor(chapters, currentPage, pluginInfo) + selectedIndex;
}

std::string buildChapterRowTitle(const HakoChapterRef& chapter) {
  std::string title = StringUtils::toDisplaySafeAscii(chapter.title);
  const std::string chapterPrefix = "Chuong ";
  if (title.rfind(chapterPrefix, 0) == 0) {
    const std::string remainder = title.substr(chapterPrefix.size());
    size_t colonPos = remainder.find(": ");
    if (colonPos != std::string::npos) {
      const std::string left = remainder.substr(0, colonPos);
      const std::string right = remainder.substr(colonPos + 2);
      bool leftIsNumber = !left.empty() &&
                          std::all_of(left.begin(), left.end(), [](unsigned char ch) { return std::isdigit(ch) != 0; });
      bool rightRepeatsNumber = right.rfind(left + ": ", 0) == 0;
      if (leftIsNumber && rightRepeatsNumber) {
        title = chapterPrefix + right;
      }
    }
  }
  return title;
}

std::string buildChapterRowSubtitle(const HakoChapterRef& chapter, const std::string& lastReadChapterUrl, uint32_t lastReadPage,
                                    uint32_t lastReadPageCount) {
  std::string subtitle = makeSectionTag(chapter.sectionTitle);
  if (!lastReadChapterUrl.empty() && lastReadChapterUrl == chapter.url) {
    const bool completed = lastReadPageCount > 0 && (lastReadPage + 1) >= lastReadPageCount;
    subtitle += subtitle.empty() ? (completed ? "Read" : "Continue") : (completed ? " | Read" : " | Continue");
    if (lastReadPageCount > 0 && !completed) {
      subtitle += " | Page " + std::to_string(lastReadPage + 1) + "/" + std::to_string(lastReadPageCount);
    }
  }
  return StringUtils::toDisplaySafeAscii(subtitle);
}
}  // namespace

void HakoChapterListActivity::applyPreferredSelection() {
  if (chapters.empty()) {
    selectedIndex = 0;
    return;
  }

  if (!preferredChapterUrl.empty()) {
    for (size_t i = 0; i < chapters.size(); ++i) {
      if (chapters[i].url == preferredChapterUrl) {
        selectedIndex = static_cast<int>(i);
        return;
      }
    }
  }

  if (!trackedSeriesId.empty()) {
    TRACKED_SERIES_STORE.ensureLoaded();
    if (const auto* item = TRACKED_SERIES_STORE.getById(trackedSeriesId)) {
      for (size_t i = 0; i < chapters.size(); ++i) {
        if (chapters[i].url == item->lastReadChapterUrl) {
          selectedIndex = static_cast<int>(i);
          return;
        }
      }
    }
  }
}

bool HakoChapterListActivity::loadPage(int page) {
  if (!pagedMode || seriesUrl.empty()) {
    return false;
  }

  OnlineSourceBridge::TocPageResult result;
  {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Loading chapters...");
    renderer.displayBuffer();
  }

  if (!OnlineSourceBridge::fetchTocPage(pluginInfo, seriesUrl, page, result)) {
    pageMessage = OnlineSourceBridge::getLastError().empty() ? "Failed to load chapter page"
                                                             : OnlineSourceBridge::getLastError();
    pageMessageUntilMs = millis() + 1800;
    requestUpdate();
    return false;
  }

  chapters = std::move(result.chapters);
  currentPage = result.page;
  totalPages = result.totalPages < 1 ? 1 : result.totalPages;
  selectedIndex = std::max(0, std::min(selectedIndex, static_cast<int>(chapters.size()) - 1));

  if (!preferredChapterUrl.empty()) {
    for (size_t i = 0; i < chapters.size(); ++i) {
      if (chapters[i].url == preferredChapterUrl) {
        selectedIndex = static_cast<int>(i);
        break;
      }
    }
  } else if (preferredChapterIndex > 0) {
    const int pageStartIndex = pageStartIndexFor(chapters, currentPage, pluginInfo);
    const int pageEndIndex = pageStartIndex + static_cast<int>(chapters.size()) - 1;
    if (preferredChapterIndex >= pageStartIndex && preferredChapterIndex <= pageEndIndex) {
      selectedIndex = preferredChapterIndex - pageStartIndex;
    }
  }

  applyPreferredSelection();

  requestUpdate();
  return !chapters.empty();
}

void HakoChapterListActivity::onEnter() {
  Activity::onEnter();
  if (pagedMode && chapters.empty()) {
    if (preferredChapterIndex > 0) {
      const int pageSize = std::max(1, OnlineSourceBridge::pagedTocPageSize(pluginInfo));
      currentPage = std::max(1, ((preferredChapterIndex - 1) / pageSize) + 1);
    }
    loadPage(currentPage);
    return;
  }

  applyPreferredSelection();
  requestUpdate();
}

void HakoChapterListActivity::loop() {
  if (!pageMessage.empty() && millis() >= pageMessageUntilMs) {
    pageMessage.clear();
    requestUpdate();
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    if (selectionOnly) {
      ActivityResult result;
      result.isCancelled = true;
      setResult(std::move(result));
    }
    finish();
    return;
  }

  if (pagedMode) {
    if (mappedInput.wasPressed(MappedInputManager::Button::Left) && currentPage > 1) {
      selectedIndex = 0;
      loadPage(currentPage - 1);
      return;
    }
    if (mappedInput.wasPressed(MappedInputManager::Button::Right) && currentPage < totalPages) {
      selectedIndex = 0;
      loadPage(currentPage + 1);
      return;
    }
  }

  if (chapters.empty()) {
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    if (selectionOnly) {
      const int resultIndex = pagedMode && !chapters.empty()
                                  ? resolveAbsoluteChapterIndex(chapters[selectedIndex], chapters, currentPage, selectedIndex, pluginInfo) - 1
                                  : selectedIndex;
      setResult(OnlineChapterResult{resultIndex});
      finish();
      return;
    }

    HakoChapterContent chapter;
    {
      RenderLock lock(*this);
      GUI.drawPopup(renderer, "Loading chapter...");
      renderer.displayBuffer();
    }
    if (!OnlineSourceBridge::fetchChapter(pluginInfo, chapters[selectedIndex], chapter)) {
      RenderLock lock(*this);
      const std::string message =
          OnlineSourceBridge::getLastError().empty() ? "Failed to load chapter" : OnlineSourceBridge::getLastError();
      GUI.drawPopup(renderer, message.c_str());
      requestUpdate();
      return;
    }
    activityManager.pushActivity(std::make_unique<HakoChapterReaderActivity>(
        renderer, mappedInput, pluginInfo, std::move(chapter), chapters, selectedIndex, trackedSeriesId, bookTitle, bookAuthor,
        seriesUrl, pagedMode, HakoChapterReaderActivity::InitialPageMode::RestoreTracked, currentPage, totalPages));
    return;
  }

  buttonNavigator.onNext([this] {
    selectedIndex = ButtonNavigator::nextIndex(selectedIndex, static_cast<int>(chapters.size()));
    requestUpdate();
  });

  buttonNavigator.onPrevious([this] {
    selectedIndex = ButtonNavigator::previousIndex(selectedIndex, static_cast<int>(chapters.size()));
    requestUpdate();
  });
}

void HakoChapterListActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int contentHeight = pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2;

  const std::string safeBookTitle = StringUtils::toDisplaySafeAscii(bookTitle);
  const std::string subtitle = pagedMode ? (safeBookTitle + " | Page " + std::to_string(currentPage) + "/" + std::to_string(totalPages))
                                         : (safeBookTitle + " | " + std::to_string(chapters.size()) + " ch");
  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, "Chapters", subtitle.c_str());

  if (chapters.empty()) {
    renderer.drawCenteredText(UI_12_FONT_ID, pageHeight / 2, "No chapters");
  } else {
    std::string lastReadChapterUrl;
    uint32_t lastReadPage = 0;
    uint32_t lastReadPageCount = 0;
    if (!trackedSeriesId.empty()) {
      TRACKED_SERIES_STORE.ensureLoaded();
      if (const auto* item = TRACKED_SERIES_STORE.getById(trackedSeriesId)) {
        lastReadChapterUrl = item->lastReadChapterUrl;
        lastReadPage = item->lastReadPage;
        lastReadPageCount = item->lastReadPageCount;
      }
    }

    GUI.drawList(renderer, Rect{0, contentTop, pageWidth, contentHeight}, static_cast<int>(chapters.size()), selectedIndex,
                 [this](int index) { return buildChapterRowTitle(chapters[index]); },
                 [lastReadChapterUrl, lastReadPage, lastReadPageCount, this](int index) {
                   return buildChapterRowSubtitle(chapters[index], lastReadChapterUrl, lastReadPage, lastReadPageCount);
                 },
                 [](int) { return Book; });
  }

  if (!pageMessage.empty()) {
    GUI.drawPopup(renderer, pageMessage.c_str());
  }

  const char* confirmLabel = "";
  if (!chapters.empty()) {
    confirmLabel = selectionOnly ? tr(STR_SELECT) : tr(STR_OPEN);
  }
  const auto labels = mappedInput.mapLabels(tr(STR_BACK), confirmLabel, pagedMode ? "Prev Pg" : "Prev",
                                            pagedMode ? "Next Pg" : "Next");
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
