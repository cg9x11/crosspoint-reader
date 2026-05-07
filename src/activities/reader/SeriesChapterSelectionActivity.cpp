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

int SeriesChapterSelectionActivity::getTotalItems() const { return static_cast<int>(manifest.chapters.size()); }

void SeriesChapterSelectionActivity::onEnter() {
  Activity::onEnter();

  selectorIndex = 0;
  for (size_t i = 0; i < manifest.chapters.size(); ++i) {
    if (manifest.chapters[i].chapterIndex == currentChapterIndex) {
      selectorIndex = static_cast<int>(i);
      break;
    }
  }

  requestUpdate();
}

void SeriesChapterSelectionActivity::onExit() { Activity::onExit(); }

void SeriesChapterSelectionActivity::loop() {
  const int pageItems = getPageItems();
  const int totalItems = getTotalItems();

  if (mappedInput.wasReleased(MappedInputManager::Button::Confirm)) {
    if (selectorIndex < 0 || selectorIndex >= totalItems) {
      ActivityResult result;
      result.isCancelled = true;
      setResult(std::move(result));
    } else {
      const auto& chapter = manifest.chapters[selectorIndex];
      setResult(SeriesChapterResult{
          SeriesManifestStore::buildChapterPath(manifest.seriesDir, chapter.file),
          chapter.chapterIndex,
      });
    }
    finish();
    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Back)) {
    ActivityResult result;
    result.isCancelled = true;
    setResult(std::move(result));
    finish();
    return;
  }

  buttonNavigator.onNextRelease([this, totalItems] {
    selectorIndex = ButtonNavigator::nextIndex(selectorIndex, totalItems);
    requestUpdate();
  });

  buttonNavigator.onPreviousRelease([this, totalItems] {
    selectorIndex = ButtonNavigator::previousIndex(selectorIndex, totalItems);
    requestUpdate();
  });

  buttonNavigator.onNextContinuous([this, totalItems, pageItems] {
    selectorIndex = ButtonNavigator::nextPageIndex(selectorIndex, totalItems, pageItems);
    requestUpdate();
  });

  buttonNavigator.onPreviousContinuous([this, totalItems, pageItems] {
    selectorIndex = ButtonNavigator::previousPageIndex(selectorIndex, totalItems, pageItems);
    requestUpdate();
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
  const int pageItems = getPageItems();
  const int totalItems = getTotalItems();

  const int titleX =
      contentX + (contentWidth - renderer.getTextWidth(UI_12_FONT_ID, tr(STR_SELECT_CHAPTER), EpdFontFamily::BOLD)) / 2;
  renderer.drawText(UI_12_FONT_ID, titleX, 15 + contentY, tr(STR_SELECT_CHAPTER), true, EpdFontFamily::BOLD);

  if (!manifest.title.empty()) {
    const std::string subtitle = renderer.truncatedText(UI_10_FONT_ID, manifest.title.c_str(), contentWidth - 40);
    renderer.drawCenteredText(UI_10_FONT_ID, 42 + contentY, subtitle.c_str());
  }

  const int pageStartIndex = selectorIndex / pageItems * pageItems;
  renderer.fillRect(contentX, 60 + contentY + (selectorIndex % pageItems) * 30 - 2, contentWidth - 1, 30);

  for (int i = 0; i < pageItems; i++) {
    const int itemIndex = pageStartIndex + i;
    if (itemIndex >= totalItems) {
      break;
    }

    const int displayY = 60 + contentY + i * 30;
    const bool isSelected = itemIndex == selectorIndex;
    const auto& chapter = manifest.chapters[itemIndex];
    const std::string title = chapter.title.empty() ? chapter.file : chapter.title;
    const std::string label = std::to_string(chapter.chapterIndex) + ". " + title;
    const std::string truncated = renderer.truncatedText(UI_10_FONT_ID, label.c_str(), contentWidth - 40);
    renderer.drawText(UI_10_FONT_ID, contentX + 20, displayY, truncated.c_str(), !isSelected);
  }

  const auto labels = mappedInput.mapLabels(tr(STR_BACK), tr(STR_SELECT), tr(STR_DIR_UP), tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);

  renderer.displayBuffer();
}
