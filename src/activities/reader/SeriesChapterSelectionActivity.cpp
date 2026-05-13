#include "SeriesChapterSelectionActivity.h"

#include <algorithm>

#include <GfxRenderer.h>
#include <I18n.h>

#include "MappedInputManager.h"
#include "components/UITheme.h"
#include "fontIds.h"

int SeriesChapterSelectionActivity::getPageItems() const {
  constexpr int lineHeight = 30;

  const int screenHeight = renderer.getScreenHeight();
  const auto orientation = renderer.getOrientation();
  const bool isPortraitInverted = orientation == GfxRenderer::Orientation::PortraitInverted;
  const int hintGutterHeight = isPortraitInverted ? 50 : 0;
  const int startY = 60 + hintGutterHeight;
  const int availableHeight = screenHeight - startY - lineHeight;
  return std::max(1, availableHeight / lineHeight);
}

int SeriesChapterSelectionActivity::getTotalItems() const { return totalItems; }

bool SeriesChapterSelectionActivity::loadMetadata() {
  SeriesManifest manifest;
  if (!SeriesManifestStore::loadMetadataFromSeriesDir(seriesDir, manifest)) {
    return false;
  }
  seriesTitle = manifest.title;
  totalItems = static_cast<int>(SeriesManifestStore::countChaptersFromSeriesDir(seriesDir));
  return totalItems > 0;
}

bool SeriesChapterSelectionActivity::locateCurrentSelection() {
  selectorIndex = 0;
  if (currentChapterIndex <= 0 || totalItems <= 0) {
    pageStartIndex = 0;
    return true;
  }

  constexpr int kScanSliceSize = 64;
  for (int sliceStart = 0; sliceStart < totalItems; sliceStart += kScanSliceSize) {
    std::vector<SeriesChapter> slice;
    if (!SeriesManifestStore::loadChapterSliceFromSeriesDir(seriesDir, static_cast<size_t>(sliceStart), kScanSliceSize,
                                                            slice)) {
      return false;
    }
    for (size_t i = 0; i < slice.size(); ++i) {
      if (slice[i].chapterIndex == currentChapterIndex) {
        selectorIndex = sliceStart + static_cast<int>(i);
        pageStartIndex = (selectorIndex / getPageItems()) * getPageItems();
        return true;
      }
    }
  }

  pageStartIndex = 0;
  return true;
}

bool SeriesChapterSelectionActivity::loadVisiblePage() {
  visibleChapters.clear();
  visibleAvailability.clear();
  if (!SeriesManifestStore::loadChapterSliceFromSeriesDir(seriesDir, static_cast<size_t>(pageStartIndex),
                                                          static_cast<size_t>(getPageItems()), visibleChapters)) {
    return false;
  }

  visibleAvailability.reserve(visibleChapters.size());
  for (const auto& chapter : visibleChapters) {
    const std::string chapterPath = SeriesManifestStore::buildChapterPath(seriesDir, chapter.file);
    visibleAvailability.push_back(Storage.exists(chapterPath.c_str()));
  }
  return true;
}

bool SeriesChapterSelectionActivity::isVisibleChapterAvailable(const int localIndex) const {
  return localIndex >= 0 && localIndex < static_cast<int>(visibleAvailability.size()) && visibleAvailability[localIndex];
}

void SeriesChapterSelectionActivity::onEnter() {
  Activity::onEnter();

  if (!loadMetadata() || !locateCurrentSelection() || !loadVisiblePage()) {
    ActivityResult result;
    result.isCancelled = true;
    setResult(std::move(result));
    finish();
    return;
  }

  requestUpdate();
}

void SeriesChapterSelectionActivity::onExit() { Activity::onExit(); }

void SeriesChapterSelectionActivity::loop() {
  const int pageItems = getPageItems();
  const int items = getTotalItems();

  if (mappedInput.wasReleased(MappedInputManager::Button::Confirm)) {
    const int localIndex = selectorIndex - pageStartIndex;
    if (selectorIndex < 0 || selectorIndex >= items || localIndex < 0 || localIndex >= static_cast<int>(visibleChapters.size())) {
      ActivityResult result;
      result.isCancelled = true;
      setResult(std::move(result));
    } else if (!isVisibleChapterAvailable(localIndex)) {
      requestUpdate();
    } else {
      const auto& chapter = visibleChapters[localIndex];
      setResult(SeriesChapterResult{SeriesManifestStore::buildChapterPath(seriesDir, chapter.file), chapter.chapterIndex});
      finish();
      return;
    }
    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Back)) {
    ActivityResult result;
    result.isCancelled = true;
    setResult(std::move(result));
    finish();
    return;
  }

  auto moveTo = [this, items](int newIndex) {
    if (items <= 0) {
      return;
    }
    selectorIndex = std::clamp(newIndex, 0, items - 1);
    const int newPageStart = (selectorIndex / getPageItems()) * getPageItems();
    if (newPageStart != pageStartIndex) {
      pageStartIndex = newPageStart;
      loadVisiblePage();
    }
    requestUpdate();
  };

  buttonNavigator.onNextRelease([this, items, &moveTo] {
    moveTo(ButtonNavigator::nextIndex(selectorIndex, items));
  });

  buttonNavigator.onPreviousRelease([this, items, &moveTo] {
    moveTo(ButtonNavigator::previousIndex(selectorIndex, items));
  });

  buttonNavigator.onNextContinuous([this, items, pageItems, &moveTo] {
    moveTo(ButtonNavigator::nextPageIndex(selectorIndex, items, pageItems));
  });

  buttonNavigator.onPreviousContinuous([this, items, pageItems, &moveTo] {
    moveTo(ButtonNavigator::previousPageIndex(selectorIndex, items, pageItems));
  });
}

void SeriesChapterSelectionActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto pageWidth = renderer.getScreenWidth();
  const auto orientation = renderer.getOrientation();
  const bool isLandscapeCw = orientation == GfxRenderer::Orientation::LandscapeClockwise;
  const bool isLandscapeCcw = orientation == GfxRenderer::Orientation::LandscapeCounterClockwise;
  const bool isPortraitInverted = orientation == GfxRenderer::Orientation::PortraitInverted;
  const int hintGutterWidth = (isLandscapeCw || isLandscapeCcw) ? 30 : 0;
  const int contentX = isLandscapeCw ? hintGutterWidth : 0;
  const int contentWidth = pageWidth - hintGutterWidth;
  const int hintGutterHeight = isPortraitInverted ? 50 : 0;
  const int contentY = hintGutterHeight;

  const int titleX =
      contentX + (contentWidth - renderer.getTextWidth(UI_12_FONT_ID, tr(STR_SELECT_CHAPTER), EpdFontFamily::BOLD)) / 2;
  renderer.drawText(UI_12_FONT_ID, titleX, 15 + contentY, tr(STR_SELECT_CHAPTER), true, EpdFontFamily::BOLD);

  if (!seriesTitle.empty()) {
    const std::string subtitle = renderer.truncatedText(UI_10_FONT_ID, seriesTitle.c_str(), contentWidth - 40);
    renderer.drawCenteredText(UI_10_FONT_ID, 42 + contentY, subtitle.c_str());
  }

  const int localSelectedIndex = selectorIndex - pageStartIndex;
  if (localSelectedIndex >= 0 && localSelectedIndex < static_cast<int>(visibleChapters.size())) {
    renderer.fillRect(contentX, 60 + contentY + localSelectedIndex * 30 - 2, contentWidth - 1, 30);
  }

  for (size_t i = 0; i < visibleChapters.size(); ++i) {
    const int displayY = 60 + contentY + static_cast<int>(i) * 30;
    const bool isSelected = static_cast<int>(i) == localSelectedIndex;
    const auto& chapter = visibleChapters[i];
    const bool isAvailable = isVisibleChapterAvailable(static_cast<int>(i));
    const std::string title = chapter.title.empty() ? chapter.file : chapter.title;
    std::string label = std::to_string(chapter.chapterIndex) + ". " + title;
    if (!isAvailable) {
      label += " [Not downloaded]";
    }
    const std::string truncated = renderer.truncatedText(UI_10_FONT_ID, label.c_str(), contentWidth - 40);
    renderer.drawText(UI_10_FONT_ID, contentX + 20, displayY, truncated.c_str(), !isSelected && isAvailable);
  }

  const auto labels = mappedInput.mapLabels(tr(STR_BACK), tr(STR_SELECT), tr(STR_DIR_UP), tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);

  renderer.displayBuffer();
}
