#include "PluginInfoActivity.h"

#include <GfxRenderer.h>
#include <I18n.h>

#include "../../util/StringUtils.h"
#include "components/UITheme.h"
#include "fontIds.h"

namespace {
std::string boolText(bool value) { return value ? "Yes" : "No"; }
bool isBundledPlugin(const std::string& pluginId) {
  return pluginId == "hako" || pluginId == "truyenfull" || pluginId == "webtruyen";
}
}

void PluginInfoActivity::onEnter() {
  Activity::onEnter();
  requestUpdate();
}

void PluginInfoActivity::loop() {
  if (!popupMessage.empty() && millis() >= popupUntilMs) {
    popupMessage.clear();
    requestUpdate();
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back) || mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    finish();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Left) && !isBundledPlugin(plugin.id)) {
    std::string error;
    if (PLUGIN_STORE.removePlugin(plugin.id, &error)) {
      finish();
    } else {
      popupMessage = error.empty() ? "Delete failed" : error;
      popupUntilMs = millis() + 1800;
      requestUpdate();
    }
  }
}

void PluginInfoActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int contentX = metrics.contentSidePadding;
  int cursorY = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;

  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, "Plugin Info");

  const auto drawLine = [this, &contentX, &cursorY](int fontId, const std::string& text, bool bold = false) {
    const std::string safeText = StringUtils::toDisplaySafeAscii(text);
    if (bold) {
      renderer.drawText(fontId, contentX, cursorY, safeText.c_str(), true, EpdFontFamily::BOLD);
    } else {
      renderer.drawText(fontId, contentX, cursorY, safeText.c_str(), true);
    }
    cursorY += renderer.getLineHeight(fontId) + 4;
  };

  drawLine(UI_12_FONT_ID, plugin.name, true);
  drawLine(UI_10_FONT_ID, "ID: " + plugin.id);
  drawLine(UI_10_FONT_ID, "Version: " + std::to_string(plugin.version));
  drawLine(UI_10_FONT_ID, "Runtime: " + plugin.runtimeMode);
  if (!plugin.runtimeProfile.empty()) {
    drawLine(UI_10_FONT_ID, "Adapter: " + plugin.runtimeProfile);
  }
  if (!plugin.runtimeOrigin.empty()) {
    drawLine(UI_10_FONT_ID, "Origin: " + plugin.runtimeOrigin);
  }
  drawLine(UI_10_FONT_ID, "Base URL: " + plugin.baseUrl);
  drawLine(UI_10_FONT_ID, "Locale: " + (plugin.locale.empty() ? std::string("-") : plugin.locale));
  drawLine(UI_10_FONT_ID, "Content: " + (plugin.contentType.empty() ? std::string("-") : plugin.contentType));
  drawLine(UI_10_FONT_ID, "Search: " + boolText(plugin.supportsSearch) + " | Updates: " +
                              boolText(plugin.supportsTrackedUpdates));
  drawLine(UI_10_FONT_ID, "X3: " + boolText(plugin.supportsX3) + " | X4: " + boolText(plugin.supportsX4));
  drawLine(UI_10_FONT_ID, "Registry: " + plugin.filePath);
  drawLine(UI_10_FONT_ID, "Removable: " + boolText(!isBundledPlugin(plugin.id)));

  if (!popupMessage.empty()) {
    GUI.drawPopup(renderer, popupMessage.c_str());
  }

  const auto labels = mappedInput.mapLabels(tr(STR_BACK), tr(STR_DONE), isBundledPlugin(plugin.id) ? "" : "Delete", "");
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
