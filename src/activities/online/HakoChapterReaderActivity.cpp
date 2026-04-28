#include "HakoChapterReaderActivity.h"

#include <CrossPointSettings.h>
#include <GfxRenderer.h>
#include <I18n.h>

#include <algorithm>
#include <cctype>
#include <sstream>

#include "../../TrackedSeriesStore.h"
#include "../reader/ReaderUtils.h"
#include "../../util/StringUtils.h"
#include "components/UITheme.h"

namespace {
std::string trimCopy(const std::string& input) {
  size_t start = 0;
  while (start < input.size() && std::isspace(static_cast<unsigned char>(input[start]))) start++;
  size_t end = input.size();
  while (end > start && std::isspace(static_cast<unsigned char>(input[end - 1]))) end--;
  return input.substr(start, end - start);
}

void appendWrappedLine(const GfxRenderer& renderer, int fontId, int maxWidth, const std::string& source,
                       std::vector<std::string>& outLines) {
  if (source.empty()) {
    outLines.emplace_back("");
    return;
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
      outLines.push_back(current);
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
        outLines.push_back(chunk);
        chunk.assign(1, ch);
      } else {
        chunk = std::move(next);
      }
    }
    current = std::move(chunk);
  }

  if (!current.empty()) {
    outLines.push_back(current);
  }
}
}  // namespace

void HakoChapterReaderActivity::saveReadingProgress() const {
  if (trackedSeriesId.empty()) {
    return;
  }

  TRACKED_SERIES_STORE.ensureLoaded();
  const auto* existing = TRACKED_SERIES_STORE.getById(trackedSeriesId);
  if (!existing) {
    return;
  }

  auto updated = *existing;
  updated.lastReadChapterUrl = chapter.ref.url;
  updated.lastReadChapterTitle = chapter.ref.title;
  updated.lastReadPage = static_cast<uint32_t>(currentPage);
  updated.lastReadPageCount =
      static_cast<uint32_t>(std::max(1, static_cast<int>((lines.size() + linesPerPage - 1) / linesPerPage)));
  std::string ignoredError;
  TRACKED_SERIES_STORE.upsert(updated, &ignoredError);
}

void HakoChapterReaderActivity::restoreReadingProgress() {
  if (trackedSeriesId.empty()) {
    return;
  }

  TRACKED_SERIES_STORE.ensureLoaded();
  const auto* existing = TRACKED_SERIES_STORE.getById(trackedSeriesId);
  if (!existing || existing->lastReadChapterUrl != chapter.ref.url) {
    return;
  }

  const int pageCount = std::max(1, static_cast<int>((lines.size() + linesPerPage - 1) / linesPerPage));
  currentPage = std::max(0, std::min(static_cast<int>(existing->lastReadPage), pageCount - 1));
}

void HakoChapterReaderActivity::paginate() {
  lines.clear();
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
  const int lineHeight = renderer.getLineHeight(fontId);
  linesPerPage = std::max(1, viewportHeight / std::max(1, lineHeight));
  pagesUntilFullRefresh = SETTINGS.getRefreshFrequency();

  const std::string text = chapter.text.empty() ? chapter.html : chapter.text;
  std::stringstream paragraphStream(text);
  std::string paragraph;
  while (std::getline(paragraphStream, paragraph)) {
    const std::string trimmed = trimCopy(paragraph);
    if (trimmed.empty()) {
      if (!lines.empty() && !lines.back().empty()) lines.emplace_back("");
      continue;
    }
    appendWrappedLine(renderer, fontId, viewportWidth, trimmed, lines);
    lines.emplace_back("");
  }

  if (!lines.empty() && lines.back().empty()) lines.pop_back();
  if (lines.empty()) lines.emplace_back("(Empty chapter)");
}

void HakoChapterReaderActivity::onEnter() {
  Activity::onEnter();
  ReaderUtils::applyOrientation(renderer, SETTINGS.orientation);
  paginate();
  restoreReadingProgress();
  requestUpdate();
}

void HakoChapterReaderActivity::onExit() {
  saveReadingProgress();
  Activity::onExit();
  renderer.setOrientation(GfxRenderer::Orientation::Portrait);
}

void HakoChapterReaderActivity::loop() {
  if (mappedInput.isPressed(MappedInputManager::Button::Back) && mappedInput.getHeldTime() >= ReaderUtils::GO_HOME_MS) {
    onGoHome();
    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Back) &&
      mappedInput.getHeldTime() < ReaderUtils::GO_HOME_MS) {
    finish();
    return;
  }

  const auto pageTurn = ReaderUtils::detectPageTurn(mappedInput);
  const int pageCount = std::max(1, static_cast<int>((lines.size() + linesPerPage - 1) / linesPerPage));

  if (pageTurn.prev && currentPage > 0) {
    currentPage--;
    saveReadingProgress();
    requestUpdate();
  } else if (pageTurn.next && currentPage < pageCount - 1) {
    currentPage++;
    saveReadingProgress();
    requestUpdate();
  }
}

void HakoChapterReaderActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int fontId = SETTINGS.getReaderFontId();
  const int lineHeight = renderer.getLineHeight(fontId);
  const int startX = metrics.contentSidePadding;
  int y = metrics.topPadding + metrics.headerHeight + metrics.tabBarHeight + metrics.verticalSpacing * 2;
  const int pageCount = std::max(1, static_cast<int>((lines.size() + linesPerPage - 1) / linesPerPage));

  const std::string safeChapterTitle = StringUtils::toDisplaySafeAscii(chapter.ref.title);
  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, safeChapterTitle.c_str());
  const std::string subHeader = "Page " + std::to_string(currentPage + 1) + "/" + std::to_string(pageCount);
  GUI.drawSubHeader(renderer, Rect{0, metrics.topPadding + metrics.headerHeight, pageWidth, metrics.tabBarHeight},
                    subHeader.c_str());

  const int firstLine = currentPage * linesPerPage;
  const int lastLine = std::min(static_cast<int>(lines.size()), firstLine + linesPerPage);
  for (int index = firstLine; index < lastLine; ++index) {
    renderer.drawText(fontId, startX, y, lines[index].c_str(), true);
    y += lineHeight;
  }

  const auto labels = mappedInput.mapLabels(tr(STR_BACK), "", tr(STR_DIR_LEFT), tr(STR_DIR_RIGHT));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  ReaderUtils::displayWithRefreshCycle(renderer, pagesUntilFullRefresh);
}
