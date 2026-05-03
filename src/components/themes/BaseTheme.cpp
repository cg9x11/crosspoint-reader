#include "BaseTheme.h"

#include <GfxRenderer.h>
#include <HalPowerManager.h>
#include <HalStorage.h>
#include <Logging.h>
#include <WiFi.h>

#include <algorithm>
#include <cstdint>
#include <string>
#include <vector>

#include "I18n.h"
#include "RecentBooksStore.h"
#include "components/UITheme.h"
#include "fontIds.h"
#include "util/ScreenDebugState.h"

// Internal constants
namespace {
constexpr int homeMenuMargin = 20;
constexpr int homeMarginTop = 30;
constexpr int subtitleY = 738;

bool isWifiConnectedForUi() { return WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0); }

std::vector<std::string> splitPopupLines(const char* message) {
  std::vector<std::string> lines;
  if (!message || !*message) {
    lines.emplace_back("");
    return lines;
  }

  std::string current;
  for (const char* ch = message; *ch; ++ch) {
    if (*ch == '\n') {
      lines.push_back(current);
      current.clear();
      continue;
    }
    current.push_back(*ch);
  }
  lines.push_back(current);
  return lines;
}

void drawWifiStatusIcon(const GfxRenderer& renderer, int x, int y) {
  if (!isWifiConnectedForUi()) {
    return;
  }

  renderer.drawLine(x + 5, y + 0, x + 8, y + 0);
  renderer.drawLine(x + 3, y + 1, x + 4, y + 1);
  renderer.drawLine(x + 9, y + 1, x + 10, y + 1);
  renderer.drawLine(x + 2, y + 2, x + 3, y + 2);
  renderer.drawLine(x + 10, y + 2, x + 11, y + 2);
  renderer.drawLine(x + 1, y + 3, x + 2, y + 3);
  renderer.drawLine(x + 11, y + 3, x + 12, y + 3);

  renderer.drawLine(x + 5, y + 4, x + 8, y + 4);
  renderer.drawPixel(x + 4, y + 5);
  renderer.drawPixel(x + 9, y + 5);
  renderer.drawPixel(x + 3, y + 6);
  renderer.drawPixel(x + 10, y + 6);

  renderer.drawLine(x + 6, y + 7, x + 7, y + 7);
  renderer.drawPixel(x + 5, y + 8);
  renderer.drawPixel(x + 8, y + 8);

  renderer.fillRect(x + 6, y + 10, 2, 2);
}

// Helper: draw battery icon at given position
void drawBatteryIcon(const GfxRenderer& renderer, int x, int y, int battWidth, int rectHeight, uint16_t percentage) {
  // Draw battery outline (shared code)
  BaseTheme::drawBatteryOutline(renderer, x, y, battWidth, rectHeight);

  const bool charging = gpio.isUsbConnected();

  // The +1 is to round up, so that we always fill at least one pixel
  const int maxFillWidth = battWidth - 5;
  const int fillHeight = rectHeight - 4;
  if (maxFillWidth <= 0 || fillHeight <= 0) {
    return;
  }
  int filledWidth = percentage * maxFillWidth / 100 + 1;
  if (filledWidth > maxFillWidth) {
    filledWidth = maxFillWidth;
  }

  // When charging, ensure minimum fill so lightning bolt is fully visible
  constexpr int minFillForBolt = 8;
  if (charging && filledWidth < minFillForBolt) {
    filledWidth = std::min(minFillForBolt, maxFillWidth);
  }

  renderer.fillRect(x + 2, y + 2, filledWidth, fillHeight);

  // Draw lightning bolt when charging (white/inverted on black fill for visibility)
  if (charging) {
    BaseTheme::drawBatteryLightningBolt(renderer, x + 4, y + 2);
  }
}
}  // namespace

void BaseTheme::drawBatteryOutline(const GfxRenderer& renderer, int x, int y, int battWidth, int rectHeight) {
  // Top line
  renderer.drawLine(x + 1, y, x + battWidth - 3, y);
  // Bottom line
  renderer.drawLine(x + 1, y + rectHeight - 1, x + battWidth - 3, y + rectHeight - 1);
  // Left line
  renderer.drawLine(x, y + 1, x, y + rectHeight - 2);
  // Battery end
  renderer.drawLine(x + battWidth - 2, y + 1, x + battWidth - 2, y + rectHeight - 2);
  renderer.drawPixel(x + battWidth - 1, y + 3);
  renderer.drawPixel(x + battWidth - 1, y + rectHeight - 4);
  renderer.drawLine(x + battWidth - 0, y + 4, x + battWidth - 0, y + rectHeight - 5);
}

void BaseTheme::drawBatteryLightningBolt(const GfxRenderer& renderer, int boltX, int boltY) {
  // Draw lightning bolt (white/inverted on black fill for visibility)
  renderer.drawLine(boltX + 4, boltY + 0, boltX + 5, boltY + 0, false);
  renderer.drawLine(boltX + 3, boltY + 1, boltX + 4, boltY + 1, false);
  renderer.drawLine(boltX + 2, boltY + 2, boltX + 5, boltY + 2, false);
  renderer.drawLine(boltX + 3, boltY + 3, boltX + 4, boltY + 3, false);
  renderer.drawLine(boltX + 2, boltY + 4, boltX + 3, boltY + 4, false);
  renderer.drawLine(boltX + 1, boltY + 5, boltX + 4, boltY + 5, false);
  renderer.drawLine(boltX + 2, boltY + 6, boltX + 3, boltY + 6, false);
  renderer.drawLine(boltX + 1, boltY + 7, boltX + 2, boltY + 7, false);
}

std::string BaseTheme::formatRecentProgress(const RecentBook& book) {
  const int percent = std::clamp(static_cast<int>(book.progressPercent), 0, 100);
  return std::to_string(percent) + "%";
}

std::string BaseTheme::formatRecentReadingTime(const RecentBook& book) {
  const uint32_t totalMinutes = book.readingTimeSeconds / 60;
  if (totalMinutes < 60) {
    return std::to_string(totalMinutes) + "m";
  }

  const uint32_t hours = totalMinutes / 60;
  const uint32_t minutes = totalMinutes % 60;
  if (minutes == 0) {
    return std::to_string(hours) + "h";
  }
  return std::to_string(hours) + "h " + std::to_string(minutes) + "m";
}

void BaseTheme::drawBatteryLeft(const GfxRenderer& renderer, Rect rect, const bool showPercentage) const {
  // Left aligned: icon on left, percentage on right (reader mode)
  const uint16_t percentage = powerManager.getBatteryPercentage();
  const int y = rect.y + 6;

  if (showPercentage) {
    const auto percentageText = std::to_string(percentage) + "%";
    renderer.drawText(SMALL_FONT_ID, rect.x + BaseTheme::batteryPercentSpacing + BaseMetrics::values.batteryWidth,
                      rect.y, percentageText.c_str());
  }

  drawBatteryIcon(renderer, rect.x, y, BaseMetrics::values.batteryWidth, rect.height, percentage);
}

void BaseTheme::drawBatteryRight(const GfxRenderer& renderer, Rect rect, const bool showPercentage) const {
  // Right aligned: percentage on left, icon on right (UI headers)
  // rect.x is already positioned for the icon (drawHeader calculated it)
  const uint16_t percentage = powerManager.getBatteryPercentage();
  const int y = rect.y + 6;

  if (showPercentage) {
    const auto percentageText = std::to_string(percentage) + "%";
    const int textWidth = renderer.getTextWidth(SMALL_FONT_ID, percentageText.c_str());
    // Clear the area where we're going to draw the text to prevent ghosting
    const auto textHeight = renderer.getTextHeight(SMALL_FONT_ID);
    renderer.fillRect(rect.x - textWidth - BaseTheme::batteryPercentSpacing, rect.y, textWidth, textHeight, false);
    // Draw text to the left of the icon
    renderer.drawText(SMALL_FONT_ID, rect.x - textWidth - BaseTheme::batteryPercentSpacing, rect.y,
                      percentageText.c_str());
  }

  // Icon is already at correct position from rect.x
  drawBatteryIcon(renderer, rect.x, y, BaseMetrics::values.batteryWidth, rect.height, percentage);
}

void BaseTheme::drawProgressBar(const GfxRenderer& renderer, Rect rect, const size_t current,
                                const size_t total) const {
  if (total == 0) {
    return;
  }

  // Use 64-bit arithmetic to avoid overflow for large files
  const int percent = static_cast<int>((static_cast<uint64_t>(current) * 100) / total);

  LOG_DBG("UI", "Drawing progress bar: current=%u, total=%u, percent=%d", current, total, percent);
  // Draw outline
  renderer.drawRect(rect.x, rect.y, rect.width, rect.height);

  // Draw filled portion
  const int fillWidth = (rect.width - 4) * percent / 100;
  if (fillWidth > 0) {
    renderer.fillRect(rect.x + 2, rect.y + 2, fillWidth, rect.height - 4);
  }

  // Draw percentage text centered below bar
  const std::string percentText = std::to_string(percent) + "%";
  renderer.drawCenteredText(UI_10_FONT_ID, rect.y + rect.height + 15, percentText.c_str());
}

void BaseTheme::drawButtonHints(GfxRenderer& renderer, const char* btn1, const char* btn2, const char* btn3,
                                const char* btn4) const {
  SCREEN_DEBUG.setButtonHints(btn1, btn2, btn3, btn4);
  const GfxRenderer::Orientation orig_orientation = renderer.getOrientation();
  renderer.setOrientation(GfxRenderer::Orientation::Portrait);

  const int pageHeight = renderer.getScreenHeight();
  constexpr int buttonWidth = 106;
  constexpr int buttonHeight = BaseMetrics::values.buttonHintsHeight;
  constexpr int buttonY = BaseMetrics::values.buttonHintsHeight;  // Distance from bottom
  constexpr int textYOffset = 7;                                  // Distance from top of button to text baseline
  // X3 has wider screen in portrait (528 vs 480), use more spacing
  constexpr int x4ButtonPositions[] = {25, 130, 245, 350};
  constexpr int x3ButtonPositions[] = {38, 154, 268, 384};
  const int* buttonPositions = gpio.deviceIsX3() ? x3ButtonPositions : x4ButtonPositions;
  const char* labels[] = {btn1, btn2, btn3, btn4};

  for (int i = 0; i < 4; i++) {
    // Only draw if the label is non-empty
    if (labels[i] != nullptr && labels[i][0] != '\0') {
      const int x = buttonPositions[i];
      renderer.fillRect(x, pageHeight - buttonY, buttonWidth, buttonHeight, false);
      renderer.drawRect(x, pageHeight - buttonY, buttonWidth, buttonHeight);
      const int textWidth = renderer.getTextWidth(UI_10_FONT_ID, labels[i]);
      const int textX = x + (buttonWidth - 1 - textWidth) / 2;
      renderer.drawText(UI_10_FONT_ID, textX, pageHeight - buttonY + textYOffset, labels[i]);
    }
  }

  renderer.setOrientation(orig_orientation);
}

void BaseTheme::drawSideButtonHints(const GfxRenderer& renderer, const char* topBtn, const char* bottomBtn) const {
  const int screenWidth = renderer.getScreenWidth();
  constexpr int buttonWidth = BaseMetrics::values.sideButtonHintsWidth;  // Width on screen (height when rotated)
  constexpr int buttonHeight = 80;                                       // Height on screen (width when rotated)
  constexpr int buttonMargin = 4;

  if (gpio.deviceIsX3()) {
    // X3 layout: Up on left side, Down on right side, positioned higher
    constexpr int x3ButtonY = 155;

    if (topBtn != nullptr && topBtn[0] != '\0') {
      const int leftX = buttonMargin;
      renderer.drawRect(leftX, x3ButtonY, buttonWidth, buttonHeight);
      const int textWidth = renderer.getTextWidth(SMALL_FONT_ID, topBtn);
      const int textHeight = renderer.getTextHeight(SMALL_FONT_ID);
      const int textX = leftX + (buttonWidth - textHeight) / 2;
      const int textY = x3ButtonY + (buttonHeight + textWidth) / 2;
      renderer.drawTextRotated90CW(SMALL_FONT_ID, textX, textY, topBtn);
    }

    if (bottomBtn != nullptr && bottomBtn[0] != '\0') {
      const int rightX = screenWidth - buttonMargin - buttonWidth;
      renderer.drawRect(rightX, x3ButtonY, buttonWidth, buttonHeight);
      const int textWidth = renderer.getTextWidth(SMALL_FONT_ID, bottomBtn);
      const int textHeight = renderer.getTextHeight(SMALL_FONT_ID);
      const int textX = rightX + (buttonWidth - textHeight) / 2;
      const int textY = x3ButtonY + (buttonHeight + textWidth) / 2;
      renderer.drawTextRotated90CW(SMALL_FONT_ID, textX, textY, bottomBtn);
    }
  } else {
    // X4 layout: Both buttons stacked on right side
    constexpr int topButtonY = 345;
    const char* labels[] = {topBtn, bottomBtn};
    const int x = screenWidth - buttonMargin - buttonWidth;

    if (topBtn != nullptr && topBtn[0] != '\0') {
      renderer.drawLine(x, topButtonY, x + buttonWidth - 1, topButtonY);
      renderer.drawLine(x, topButtonY, x, topButtonY + buttonHeight - 1);
      renderer.drawLine(x + buttonWidth - 1, topButtonY, x + buttonWidth - 1, topButtonY + buttonHeight - 1);
    }

    if ((topBtn != nullptr && topBtn[0] != '\0') || (bottomBtn != nullptr && bottomBtn[0] != '\0')) {
      renderer.drawLine(x, topButtonY + buttonHeight, x + buttonWidth - 1, topButtonY + buttonHeight);
    }

    if (bottomBtn != nullptr && bottomBtn[0] != '\0') {
      renderer.drawLine(x, topButtonY + buttonHeight, x, topButtonY + 2 * buttonHeight - 1);
      renderer.drawLine(x + buttonWidth - 1, topButtonY + buttonHeight, x + buttonWidth - 1,
                        topButtonY + 2 * buttonHeight - 1);
      renderer.drawLine(x, topButtonY + 2 * buttonHeight - 1, x + buttonWidth - 1, topButtonY + 2 * buttonHeight - 1);
    }

    for (int i = 0; i < 2; i++) {
      if (labels[i] != nullptr && labels[i][0] != '\0') {
        const int y = topButtonY + i * buttonHeight;
        const int textWidth = renderer.getTextWidth(SMALL_FONT_ID, labels[i]);
        const int textHeight = renderer.getTextHeight(SMALL_FONT_ID);
        const int textX = x + (buttonWidth - textHeight) / 2;
        const int textY = y + (buttonHeight + textWidth) / 2;
        renderer.drawTextRotated90CW(SMALL_FONT_ID, textX, textY, labels[i]);
      }
    }
  }
}

void BaseTheme::drawList(const GfxRenderer& renderer, Rect rect, int itemCount, int selectedIndex,
                         const std::function<std::string(int index)>& rowTitle,
                         const std::function<std::string(int index)>& rowSubtitle,
                         const std::function<UIIcon(int index)>& rowIcon,
                         const std::function<std::string(int index)>& rowValue, bool highlightValue) const {
  int rowHeight =
      (rowSubtitle != nullptr) ? BaseMetrics::values.listWithSubtitleRowHeight : BaseMetrics::values.listRowHeight;
  int pageItems = rect.height / rowHeight;

  const int totalPages = (itemCount + pageItems - 1) / pageItems;
  if (totalPages > 1) {
    constexpr int indicatorWidth = 20;
    constexpr int arrowSize = 6;
    constexpr int margin = 15;  // Offset from right edge

    const int centerX = rect.x + rect.width - indicatorWidth / 2 - margin;
    const int indicatorTop = rect.y;  // Offset to avoid overlapping side button hints
    const int indicatorBottom = rect.y + rect.height - arrowSize;

    // Draw up arrow at top (^) - narrow point at top, wide base at bottom
    for (int i = 0; i < arrowSize; ++i) {
      const int lineWidth = 1 + i * 2;
      const int startX = centerX - i;
      renderer.drawLine(startX, indicatorTop + i, startX + lineWidth - 1, indicatorTop + i);
    }

    // Draw down arrow at bottom (v) - wide base at top, narrow point at bottom
    for (int i = 0; i < arrowSize; ++i) {
      const int lineWidth = 1 + (arrowSize - 1 - i) * 2;
      const int startX = centerX - (arrowSize - 1 - i);
      renderer.drawLine(startX, indicatorBottom - arrowSize + 1 + i, startX + lineWidth - 1,
                        indicatorBottom - arrowSize + 1 + i);
    }
  }

  // Draw selection
  int contentWidth = rect.width - 5;
  if (selectedIndex >= 0) {
    renderer.fillRect(0, rect.y + selectedIndex % pageItems * rowHeight - 2, rect.width, rowHeight);
  }
  // Draw all items
  const auto pageStartIndex = selectedIndex / pageItems * pageItems;
  std::vector<ScreenDebugListItem> debugItems;
  debugItems.reserve(pageItems > 0 ? pageItems : 0);
  for (int i = pageStartIndex; i < itemCount && i < pageStartIndex + pageItems; i++) {
    const int itemY = rect.y + (i % pageItems) * rowHeight;
    int textWidth = contentWidth - BaseMetrics::values.contentSidePadding * 2 - (rowValue != nullptr ? 60 : 0);

    // Draw name
    auto itemName = rowTitle(i);
    auto font = (rowSubtitle != nullptr) ? UI_12_FONT_ID : UI_10_FONT_ID;
    const int textX = rect.x + BaseMetrics::values.contentSidePadding;
    if (rowSubtitle != nullptr) {
      const auto titleLines = renderer.wrappedText(font, itemName.c_str(), textWidth, 2);
      const int titleLineCount = std::max(1, std::min(static_cast<int>(titleLines.size()), 2));
      for (int lineIndex = 0; lineIndex < titleLineCount; ++lineIndex) {
        renderer.drawText(font, textX, itemY + lineIndex * renderer.getLineHeight(font), titleLines[lineIndex].c_str(),
                          i != selectedIndex);
      }

      if (titleLineCount == 1) {
        std::string subtitleText = rowSubtitle(i);
        auto subtitle = renderer.truncatedText(UI_10_FONT_ID, subtitleText.c_str(), textWidth);
        renderer.drawText(UI_10_FONT_ID, textX, itemY + 30, subtitle.c_str(), i != selectedIndex);
      }
    } else {
      auto item = renderer.truncatedText(font, itemName.c_str(), textWidth);
      renderer.drawText(font, textX, itemY, item.c_str(), i != selectedIndex);
    }

    if (rowValue != nullptr) {
      // Draw value
      std::string valueText = rowValue(i);
      const auto valueTextWidth = renderer.getTextWidth(UI_10_FONT_ID, valueText.c_str());
      renderer.drawText(UI_10_FONT_ID, rect.x + contentWidth - BaseMetrics::values.contentSidePadding - valueTextWidth,
                        itemY, valueText.c_str(), i != selectedIndex);
    }

    ScreenDebugListItem debugItem;
    debugItem.title = rowTitle(i);
    debugItem.subtitle = rowSubtitle != nullptr ? rowSubtitle(i) : std::string{};
    debugItem.value = rowValue != nullptr ? rowValue(i) : std::string{};
    debugItems.push_back(std::move(debugItem));
  }
  const int selectedVisibleIndex =
      (selectedIndex >= pageStartIndex && selectedIndex < pageStartIndex + static_cast<int>(debugItems.size()))
          ? (selectedIndex - pageStartIndex)
          : -1;
  const char* selectedTitle = nullptr;
  const char* selectedSubtitle = nullptr;
  const char* selectedValue = nullptr;
  if (selectedVisibleIndex >= 0 && selectedVisibleIndex < static_cast<int>(debugItems.size())) {
    const auto& selectedItem = debugItems[selectedVisibleIndex];
    selectedTitle = selectedItem.title.c_str();
    selectedSubtitle = selectedItem.subtitle.c_str();
    selectedValue = selectedItem.value.c_str();
  }
  SCREEN_DEBUG.setList(itemCount, selectedIndex, selectedVisibleIndex, selectedTitle, selectedSubtitle, selectedValue,
                       debugItems);
}

void BaseTheme::drawHeader(const GfxRenderer& renderer, Rect rect, const char* title, const char* subtitle) const {
  SCREEN_DEBUG.setHeader(title, subtitle);
  // Hide last battery draw
  constexpr int maxHeaderStatusWidth = 100;
  renderer.fillRect(rect.x + rect.width - maxHeaderStatusWidth, rect.y + 5, maxHeaderStatusWidth,
                    BaseMetrics::values.batteryHeight + 10, false);

  const bool showBatteryPercentage =
      SETTINGS.hideBatteryPercentage != CrossPointSettings::HIDE_BATTERY_PERCENTAGE::HIDE_ALWAYS;
  const int wifiIconWidth = isWifiConnectedForUi() ? 14 : 0;
  const int statusGap = wifiIconWidth > 0 ? 8 : 0;
  // Position icon at right edge, drawBatteryRight will place text to the left
  const int batteryX = rect.x + rect.width - 12 - BaseMetrics::values.batteryWidth - wifiIconWidth - statusGap;
  drawBatteryRight(renderer,
                   Rect{batteryX, rect.y + 5, BaseMetrics::values.batteryWidth, BaseMetrics::values.batteryHeight},
                   showBatteryPercentage);
  if (wifiIconWidth > 0) {
    drawWifiStatusIcon(renderer, batteryX + BaseMetrics::values.batteryWidth + statusGap, rect.y + 9);
  }

  if (title) {
    int padding = rect.width - batteryX + BaseMetrics::values.batteryWidth;
    auto truncatedTitle = renderer.truncatedText(UI_12_FONT_ID, title,
                                                 rect.width - padding * 2 - BaseMetrics::values.contentSidePadding * 2,
                                                 EpdFontFamily::BOLD);
    renderer.drawCenteredText(UI_12_FONT_ID, rect.y + 5, truncatedTitle.c_str(), true, EpdFontFamily::BOLD);
  }

  if (subtitle) {
    auto truncatedSubtitle = renderer.truncatedText(
        SMALL_FONT_ID, subtitle, rect.width - BaseMetrics::values.contentSidePadding * 2, EpdFontFamily::REGULAR);
    int truncatedSubtitleWidth = renderer.getTextWidth(SMALL_FONT_ID, truncatedSubtitle.c_str());
    renderer.drawText(SMALL_FONT_ID,
                      rect.x + rect.width - BaseMetrics::values.contentSidePadding - truncatedSubtitleWidth, subtitleY,
                      truncatedSubtitle.c_str(), true);
  }
}

void BaseTheme::drawSubHeader(const GfxRenderer& renderer, Rect rect, const char* label, const char* rightLabel) const {
  SCREEN_DEBUG.setSubHeader(label, rightLabel);
  constexpr int underlineHeight = 2;  // Height of selection underline
  constexpr int underlineGap = 4;     // Gap between text and underline
  constexpr int maxListValueWidth = 200;

  int currentX = rect.x + BaseMetrics::values.contentSidePadding;
  int rightSpace = BaseMetrics::values.contentSidePadding;
  if (rightLabel) {
    auto truncatedRightLabel =
        renderer.truncatedText(SMALL_FONT_ID, rightLabel, maxListValueWidth, EpdFontFamily::REGULAR);
    int rightLabelWidth = renderer.getTextWidth(SMALL_FONT_ID, truncatedRightLabel.c_str());
    renderer.drawText(SMALL_FONT_ID, rect.x + rect.width - BaseMetrics::values.contentSidePadding - rightLabelWidth,
                      rect.y + 7, truncatedRightLabel.c_str());
    rightSpace += rightLabelWidth + 10;
  }

  auto truncatedLabel = renderer.truncatedText(
      UI_12_FONT_ID, label, rect.width - BaseMetrics::values.contentSidePadding - rightSpace, EpdFontFamily::REGULAR);
  renderer.drawText(UI_12_FONT_ID, currentX, rect.y, truncatedLabel.c_str(), true, EpdFontFamily::REGULAR);
}

void BaseTheme::drawTabBar(const GfxRenderer& renderer, const Rect rect, const std::vector<TabInfo>& tabs,
                           bool selected) const {
  constexpr int underlineHeight = 2;  // Height of selection underline
  constexpr int underlineGap = 4;     // Gap between text and underline

  const int lineHeight = renderer.getLineHeight(UI_12_FONT_ID);

  int currentX = rect.x + BaseMetrics::values.contentSidePadding;

  for (const auto& tab : tabs) {
    const int textWidth =
        renderer.getTextWidth(UI_12_FONT_ID, tab.label, tab.selected ? EpdFontFamily::BOLD : EpdFontFamily::REGULAR);

    // Draw underline for selected tab
    if (tab.selected) {
      if (selected) {
        renderer.fillRect(currentX - 3, rect.y, textWidth + 6, lineHeight + underlineGap);
      } else {
        renderer.fillRect(currentX, rect.y + lineHeight + underlineGap, textWidth, underlineHeight);
      }
    }

    // Draw tab label
    renderer.drawText(UI_12_FONT_ID, currentX, rect.y, tab.label, !(tab.selected && selected),
                      tab.selected ? EpdFontFamily::BOLD : EpdFontFamily::REGULAR);

    currentX += textWidth + BaseMetrics::values.tabSpacing;
  }
}

// Draw the "Recent Book" cover card on the home screen
// TODO: Refactor method to make it cleaner, split into smaller methods
void BaseTheme::drawRecentBookCover(GfxRenderer& renderer, Rect rect, const std::vector<RecentBook>& recentBooks,
                                    const int selectorIndex, bool& coverRendered, bool& coverBufferStored,
                                    bool& bufferRestored, std::function<bool()> storeCoverBuffer) const {
  const bool hasContinueReading = !recentBooks.empty();
  const bool bookSelected = hasContinueReading && selectorIndex == 0;
  (void)bufferRestored;

  const int outerPadding = 18;
  const int cardX = rect.x + outerPadding;
  const int cardY = rect.y + 8;
  const int cardWidth = rect.width - outerPadding * 2;
  const int cardHeight = rect.height - 16;

  if (!hasContinueReading) {
    renderer.drawRect(cardX, cardY, cardWidth, cardHeight);
    renderer.drawCenteredText(UI_12_FONT_ID, rect.y + rect.height / 2 - renderer.getLineHeight(UI_12_FONT_ID),
                              tr(STR_NO_OPEN_BOOK), true, EpdFontFamily::BOLD);
    renderer.drawCenteredText(UI_10_FONT_ID, rect.y + rect.height / 2 + 10, tr(STR_START_READING), true);
    return;
  }

  const RecentBook& book = recentBooks[0];
  const int coverHeight = cardHeight - 24;
  int coverWidth = std::max(120, std::min(cardWidth / 3, (coverHeight * 3) / 2));
  const int coverX = cardX + 12;
  const int coverY = cardY + 12;

  if (!book.coverBmpPath.empty()) {
    const std::string coverBmpPath = UITheme::getCoverThumbPath(book.coverBmpPath, BaseMetrics::values.homeCoverHeight);
    FsFile file;
    if (Storage.openFileForRead("HOME", coverBmpPath, file)) {
      Bitmap bitmap(file);
      if (bitmap.parseHeaders() == BmpReaderError::Ok && bitmap.getWidth() > 0 && bitmap.getHeight() > 0) {
        coverWidth = std::max(
            120, std::min(cardWidth / 3, static_cast<int>((coverHeight * bitmap.getWidth()) / bitmap.getHeight())));
        if (!coverRendered) {
          renderer.drawBitmap(bitmap, coverX, coverY, coverWidth, coverHeight);
        }
      }
      file.close();
    }
  }

  if (!coverRendered) {
    if (book.coverBmpPath.empty()) {
      renderer.drawRect(coverX, coverY, coverWidth, coverHeight);
      renderer.fillRect(coverX + 1, coverY + (coverHeight / 3), coverWidth - 2, (coverHeight * 2) / 3 - 1, true);
      renderer.drawText(UI_12_FONT_ID, coverX + 18, coverY + 32, "No", false, EpdFontFamily::BOLD);
      renderer.drawText(UI_10_FONT_ID, coverX + 12, coverY + 52, "Cover", false);
    }
    coverBufferStored = storeCoverBuffer();
    coverRendered = coverBufferStored;
  }

  const int textX = coverX + coverWidth + 20;
  const int textWidth = std::max(80, cardX + cardWidth - 14 - textX);
  const int textPanelY = cardY + 10;
  const int textPanelHeight = cardHeight - 20;
  const bool textInk = !bookSelected;

  renderer.drawRect(cardX, cardY, cardWidth, cardHeight);
  renderer.drawRect(coverX, coverY, coverWidth, coverHeight);
  renderer.fillRect(textX - 8, textPanelY, textWidth + 10, textPanelHeight, bookSelected);
  renderer.drawRect(textX - 8, textPanelY, textWidth + 10, textPanelHeight, true);

  auto titleLines = renderer.wrappedText(UI_12_FONT_ID, book.title.c_str(), textWidth - 8, 3);
  const std::string author =
      book.author.empty() ? std::string{} : renderer.truncatedText(UI_10_FONT_ID, book.author.c_str(), textWidth - 8);
  const std::string progressText = formatRecentProgress(book);
  const std::string timeText = formatRecentReadingTime(book);

  int textY = textPanelY + 10;
  renderer.drawText(UI_10_FONT_ID, textX, textY, tr(STR_CONTINUE_READING), textInk);
  textY += renderer.getLineHeight(UI_10_FONT_ID) + 8;

  for (const auto& line : titleLines) {
    renderer.drawText(UI_12_FONT_ID, textX, textY, line.c_str(), textInk, EpdFontFamily::BOLD);
    textY += renderer.getLineHeight(UI_12_FONT_ID);
  }

  if (!author.empty()) {
    textY += 6;
    renderer.drawText(UI_10_FONT_ID, textX, textY, author.c_str(), textInk);
  }

  const int statsY = textPanelY + textPanelHeight - 44;
  renderer.drawText(UI_12_FONT_ID, textX, statsY, progressText.c_str(), textInk, EpdFontFamily::BOLD);
  const int timeWidth = renderer.getTextWidth(UI_10_FONT_ID, timeText.c_str());
  renderer.drawText(UI_10_FONT_ID, textX + textWidth - timeWidth, statsY + 2, timeText.c_str(), textInk);

  const int progressBarY = textPanelY + textPanelHeight - 18;
  const int progressBarWidth = textWidth;
  const int progressFillWidth =
      (progressBarWidth - 2) * std::clamp(static_cast<int>(book.progressPercent), 0, 100) / 100;
  renderer.drawRect(textX, progressBarY, progressBarWidth, 8, textInk);
  if (progressFillWidth > 0) {
    renderer.fillRect(textX + 1, progressBarY + 1, progressFillWidth, 6, textInk);
  }
}

void BaseTheme::drawButtonMenu(GfxRenderer& renderer, Rect rect, int buttonCount, int selectedIndex,
                               const std::function<std::string(int index)>& buttonLabel,
                               const std::function<UIIcon(int index)>& rowIcon) const {
  std::vector<std::string> debugLabels;
  debugLabels.reserve(buttonCount);
  for (int i = 0; i < buttonCount; ++i) {
    const int tileY = BaseMetrics::values.verticalSpacing + rect.y +
                      static_cast<int>(i) * (BaseMetrics::values.menuRowHeight + BaseMetrics::values.menuSpacing);

    const bool selected = selectedIndex == i;

    if (selected) {
      renderer.fillRect(rect.x + BaseMetrics::values.contentSidePadding, tileY,
                        rect.width - BaseMetrics::values.contentSidePadding * 2, BaseMetrics::values.menuRowHeight);
    } else {
      renderer.drawRect(rect.x + BaseMetrics::values.contentSidePadding, tileY,
                        rect.width - BaseMetrics::values.contentSidePadding * 2, BaseMetrics::values.menuRowHeight);
    }

    std::string labelStr = buttonLabel(i);
    debugLabels.push_back(labelStr);
    const char* label = labelStr.c_str();
    const int textWidth = renderer.getTextWidth(UI_10_FONT_ID, label);
    const int minTextX = rect.x + BaseMetrics::values.contentSidePadding + 6;
    const int maxTextX = rect.x + rect.width - BaseMetrics::values.contentSidePadding - textWidth - 6;
    const int textX = std::max(minTextX, std::min(rect.x + (rect.width - textWidth) / 2, maxTextX));
    const int lineHeight = renderer.getLineHeight(UI_10_FONT_ID);
    const int textY =
        tileY + (BaseMetrics::values.menuRowHeight - lineHeight) / 2;  // vertically centered assuming y is top of text
    // Invert text when the tile is selected, to contrast with the filled background
    renderer.drawText(UI_10_FONT_ID, textX, textY, label, selectedIndex != i);
  }
  const char* selectedLabel =
      (selectedIndex >= 0 && selectedIndex < static_cast<int>(debugLabels.size())) ? debugLabels[selectedIndex].c_str()
                                                                                    : nullptr;
  SCREEN_DEBUG.setButtonMenu(selectedIndex, selectedLabel, debugLabels);
}

Rect BaseTheme::drawPopup(const GfxRenderer& renderer, const char* message) const {
  SCREEN_DEBUG.setPopup(message);
  constexpr int margin = 15;
  // Scale y position proportionally to screen height (7.5% from top)
  const int y = static_cast<int>(renderer.getScreenHeight() * 0.075f);
  const std::vector<std::string> lines = splitPopupLines(message);
  int textWidth = 0;
  for (const auto& line : lines) {
    textWidth = std::max(textWidth, renderer.getTextWidth(UI_12_FONT_ID, line.c_str(), EpdFontFamily::BOLD));
  }
  const int textHeight = renderer.getLineHeight(UI_12_FONT_ID) * static_cast<int>(lines.size());
  const int w = textWidth + margin * 2;
  const int h = textHeight + margin * 2;
  const int x = (renderer.getScreenWidth() - w) / 2;

  renderer.fillRect(x - 2, y - 2, w + 4, h + 4, true);  // frame thickness 2
  renderer.fillRect(x, y, w, h, false);

  int textY = y + margin - 2;
  for (const auto& line : lines) {
    const int lineWidth = renderer.getTextWidth(UI_12_FONT_ID, line.c_str(), EpdFontFamily::BOLD);
    const int textX = x + (w - lineWidth) / 2;
    renderer.drawText(UI_12_FONT_ID, textX, textY, line.c_str(), true, EpdFontFamily::BOLD);
    textY += renderer.getLineHeight(UI_12_FONT_ID);
  }
  renderer.displayBuffer();
  return Rect{x, y, w, h};
}

void BaseTheme::fillPopupProgress(const GfxRenderer& renderer, const Rect& layout, const int progress) const {
  constexpr int barHeight = 4;
  const int barWidth = layout.width - 30;  // twice the margin in drawPopup to match text width
  const int barX = layout.x + (layout.width - barWidth) / 2;
  const int barY = layout.y + layout.height - 10;

  int fillWidth = barWidth * progress / 100;

  renderer.fillRect(barX, barY, fillWidth, barHeight, true);

  renderer.displayBuffer(HalDisplay::FAST_REFRESH);
}

void BaseTheme::drawStatusBar(GfxRenderer& renderer, const float bookProgress, const int currentPage,
                              const int pageCount, std::string title, const int paddingBottom,
                              const int textYOffset) const {
  auto metrics = UITheme::getInstance().getMetrics();
  int orientedMarginTop, orientedMarginRight, orientedMarginBottom, orientedMarginLeft;
  renderer.getOrientedViewableTRBL(&orientedMarginTop, &orientedMarginRight, &orientedMarginBottom,
                                   &orientedMarginLeft);

  // Draw Progress Text
  const auto screenHeight = renderer.getScreenHeight();
  auto textY = screenHeight - UITheme::getInstance().getStatusBarHeight() - orientedMarginBottom - paddingBottom - 4;
  int progressTextWidth = 0;

  if (SETTINGS.statusBarBookProgressPercentage || SETTINGS.statusBarChapterPageCount) {
    // Right aligned text for progress counter
    char progressStr[32];

    if (SETTINGS.statusBarBookProgressPercentage && SETTINGS.statusBarChapterPageCount) {
      snprintf(progressStr, sizeof(progressStr), "%d/%d  %.0f%%", currentPage, pageCount, bookProgress);
    } else if (SETTINGS.statusBarBookProgressPercentage) {
      snprintf(progressStr, sizeof(progressStr), "%.0f%%", bookProgress);
    } else {
      snprintf(progressStr, sizeof(progressStr), "%d/%d", currentPage, pageCount);
    }

    progressTextWidth = renderer.getTextWidth(SMALL_FONT_ID, progressStr);
    renderer.drawText(
        SMALL_FONT_ID,
        renderer.getScreenWidth() - metrics.statusBarHorizontalMargin - orientedMarginRight - progressTextWidth, textY,
        progressStr);
  }

  // Draw Progress Bar
  if (SETTINGS.statusBarProgressBar != CrossPointSettings::STATUS_BAR_PROGRESS_BAR::HIDE_PROGRESS) {
    const int progressBarMaxWidth = renderer.getScreenWidth() - orientedMarginLeft - orientedMarginRight;
    const int progressBarY = renderer.getScreenHeight() - orientedMarginBottom -
                             ((SETTINGS.statusBarProgressBarThickness + 1) * 2) - paddingBottom;
    size_t progress;
    if (SETTINGS.statusBarProgressBar == CrossPointSettings::STATUS_BAR_PROGRESS_BAR::BOOK_PROGRESS) {
      progress = static_cast<size_t>(bookProgress);
    } else {
      // Chapter progress
      progress = (pageCount > 0) ? (static_cast<float>(currentPage) / pageCount) * 100 : 0;
    }
    const int barWidth = progressBarMaxWidth * progress / 100;
    renderer.fillRect(orientedMarginLeft, progressBarY, barWidth, ((SETTINGS.statusBarProgressBarThickness + 1) * 2),
                      true);
  }

  // Draw Battery
  const bool showBatteryPercentage =
      SETTINGS.hideBatteryPercentage == CrossPointSettings::HIDE_BATTERY_PERCENTAGE::HIDE_NEVER;
  if (SETTINGS.statusBarBattery) {
    GUI.drawBatteryLeft(renderer,
                        Rect{metrics.statusBarHorizontalMargin + orientedMarginLeft + 1, textY, metrics.batteryWidth,
                             metrics.batteryHeight},
                        showBatteryPercentage);
  }

  // Draw Title
  if (!title.empty()) {
    textY -= textYOffset;
    // Centered chapter title text
    // Page width minus existing content with 30px padding on each side
    const int rendererableScreenWidth =
        renderer.getScreenWidth() - (metrics.statusBarHorizontalMargin * 2) - orientedMarginLeft - orientedMarginRight;

    const int batterySize = SETTINGS.statusBarBattery ? (showBatteryPercentage ? 50 : 20) : 0;
    const int titleMarginLeft = batterySize + 30;
    const int titleMarginRight = progressTextWidth + 30;

    // Attempt to center title on the screen, but if title is too wide then later we will center it within the
    // available space.
    int titleMarginLeftAdjusted = std::max(titleMarginLeft, titleMarginRight);
    int availableTitleSpace = rendererableScreenWidth - 2 * titleMarginLeftAdjusted;

    int titleWidth;
    titleWidth = renderer.getTextWidth(SMALL_FONT_ID, title.c_str());
    if (titleWidth > availableTitleSpace) {
      // Not enough space to center on the screen, center it within the remaining space instead
      availableTitleSpace = rendererableScreenWidth - titleMarginLeft - titleMarginRight;
      titleMarginLeftAdjusted = titleMarginLeft;
    }
    if (titleWidth > availableTitleSpace) {
      title = renderer.truncatedText(SMALL_FONT_ID, title.c_str(), availableTitleSpace);
      titleWidth = renderer.getTextWidth(SMALL_FONT_ID, title.c_str());
    }

    renderer.drawText(SMALL_FONT_ID,
                      titleMarginLeftAdjusted + metrics.statusBarHorizontalMargin + orientedMarginLeft +
                          (availableTitleSpace - titleWidth) / 2,
                      textY, title.c_str());
  }
}

void BaseTheme::drawHelpText(const GfxRenderer& renderer, Rect rect, const char* label) const {
  const auto& metrics = UITheme::getInstance().getMetrics();
  auto truncatedLabel =
      renderer.truncatedText(SMALL_FONT_ID, label, rect.width - metrics.contentSidePadding * 2, EpdFontFamily::REGULAR);
  renderer.drawCenteredText(SMALL_FONT_ID, rect.y, truncatedLabel.c_str());
}

void BaseTheme::drawTextField(const GfxRenderer& renderer, Rect rect, const int textWidth, bool cursorMode,
                              int contentStartX, int contentWidth) const {
  const auto& metrics = UITheme::getInstance().getMetrics();
  const int lineHeight = renderer.getLineHeight(UI_12_FONT_ID);
  const int lineY = rect.y + rect.height + lineHeight + metrics.verticalSpacing;
  const int thickness = cursorMode ? 3 : 1;
  if (contentWidth > 0) {
    renderer.drawLine(rect.x + contentStartX, lineY, rect.x + contentStartX + contentWidth, lineY, thickness, true);
  } else {
    const int hPadding = 6;
    const int lineW = textWidth + hPadding * 2;
    renderer.drawLine(rect.x + (rect.width - lineW) / 2, lineY, rect.x + (rect.width + lineW) / 2, lineY, thickness,
                      true);
  }
}

void BaseTheme::drawKeyboardKey(const GfxRenderer& renderer, Rect rect, const char* label, const bool isSelected,
                                const char* secondaryLabel, const KeyboardKeyType keyType,
                                const bool inactiveSelection) const {
  const auto& metrics = UITheme::getInstance().getMetrics();
  const int cr = metrics.keyboardKeyCornerRadius;

  if (isSelected) {
    if (inactiveSelection) {
      if (cr > 0) {
        renderer.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, cr, Color::LightGray);
      } else {
        renderer.drawRect(rect.x, rect.y, rect.width, rect.height, 2, true);
      }
    } else if (keyType == KeyboardKeyType::Disabled) {
      if (cr > 0) {
        renderer.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, cr, Color::LightGray);
      } else {
        renderer.fillRectDither(rect.x, rect.y, rect.width, rect.height, Color::LightGray);
      }
    } else {
      if (cr > 0) {
        renderer.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, cr, Color::Black);
      } else {
        renderer.fillRect(rect.x, rect.y, rect.width, rect.height, true);
      }
    }
  } else if (keyType == KeyboardKeyType::Shift || keyType == KeyboardKeyType::Mode || keyType == KeyboardKeyType::Del ||
             keyType == KeyboardKeyType::Space || keyType == KeyboardKeyType::Ok ||
             keyType == KeyboardKeyType::Disabled) {
    if (cr > 0) {
      renderer.drawRoundedRect(rect.x, rect.y, rect.width, rect.height, 1, cr, true);
    } else {
      renderer.drawRect(rect.x, rect.y, rect.width, rect.height);
    }
  }

  const bool invert = isSelected && !inactiveSelection;

  if (keyType == KeyboardKeyType::Space) {
    const int lineHalfWidth = rect.width * 3 / 10;
    const int centerX = rect.x + rect.width / 2;
    const int lineY = rect.y + rect.height / 2 + 3;
    renderer.drawLine(centerX - lineHalfWidth, lineY, centerX + lineHalfWidth, lineY, 3, !invert);
    return;
  }

  if (keyType == KeyboardKeyType::Del) {
    const int centerX = rect.x + rect.width / 2;
    const int centerY = rect.y + rect.height / 2;
    const int arrowLen = rect.width / 4;
    const int arrowHead = arrowLen / 2;
    renderer.drawLine(centerX - arrowLen / 2, centerY, centerX + arrowLen / 2, centerY, 3, !invert);
    renderer.drawLine(centerX - arrowLen / 2, centerY, centerX - arrowLen / 2 + arrowHead, centerY - arrowHead, 3,
                      !invert);
    renderer.drawLine(centerX - arrowLen / 2, centerY, centerX - arrowLen / 2 + arrowHead, centerY + arrowHead, 3,
                      !invert);
    return;
  }

  const bool hasSecondary = secondaryLabel != nullptr && secondaryLabel[0] != '\0';
  const int itemWidth = renderer.getTextWidth(UI_12_FONT_ID, label);
  const int textX = rect.x + (rect.width - itemWidth) / 2;
  const int textY = rect.y + (rect.height - renderer.getLineHeight(UI_12_FONT_ID)) / 2;

  renderer.drawText(UI_12_FONT_ID, textX, textY, label, !invert);

  if (hasSecondary) {
    const int secWidth = renderer.getTextWidth(SMALL_FONT_ID, secondaryLabel);
    renderer.drawText(SMALL_FONT_ID, rect.x + rect.width - secWidth - 1, rect.y, secondaryLabel, !invert);
  }
}
