#include "PluginRegistryActivity.h"

#include <GfxRenderer.h>
#include <I18n.h>

#include "../../util/StringUtils.h"
#include "PluginInfoActivity.h"
#include "components/UITheme.h"
#include "fontIds.h"

namespace {
std::string g_lastSelectedPluginId;
}

void PluginRegistryActivity::reloadPlugins() {
  if (!PLUGIN_STORE.hasPlugins()) {
    PLUGIN_STORE.loadFromDisk();
  }
  plugins = PLUGIN_STORE.getPlugins();
  if (plugins.empty()) {
    selectedIndex = 0;
    g_lastSelectedPluginId.clear();
    return;
  }

  if (!g_lastSelectedPluginId.empty()) {
    for (size_t index = 0; index < plugins.size(); ++index) {
      if (plugins[index].id == g_lastSelectedPluginId) {
        selectedIndex = static_cast<int>(index);
        return;
      }
    }
  }

  selectedIndex = std::min(selectedIndex, std::max(0, static_cast<int>(plugins.size()) - 1));
  g_lastSelectedPluginId = plugins[selectedIndex].id;
}

void PluginRegistryActivity::onEnter() {
  Activity::onEnter();
  reloadPlugins();
  requestUpdate();
}

void PluginRegistryActivity::loop() {
  if (PLUGIN_STORE.getCount() != plugins.size()) {
    reloadPlugins();
    requestUpdate();
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    finish();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Left)) {
    PLUGIN_STORE.loadFromDisk();
    reloadPlugins();
    requestUpdate();
    return;
  }

  if (plugins.empty()) {
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    g_lastSelectedPluginId = plugins[selectedIndex].id;
    activityManager.pushActivity(std::make_unique<PluginInfoActivity>(renderer, mappedInput, plugins[selectedIndex]));
    return;
  }

  buttonNavigator.onNext([this] {
    selectedIndex = ButtonNavigator::nextIndex(selectedIndex, static_cast<int>(plugins.size()));
    g_lastSelectedPluginId = plugins[selectedIndex].id;
    requestUpdate();
  });

  buttonNavigator.onPrevious([this] {
    selectedIndex = ButtonNavigator::previousIndex(selectedIndex, static_cast<int>(plugins.size()));
    g_lastSelectedPluginId = plugins[selectedIndex].id;
    requestUpdate();
  });
}

void PluginRegistryActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int contentHeight = pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2;

  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, "Plugins");

  if (plugins.empty()) {
    renderer.drawCenteredText(UI_12_FONT_ID, pageHeight / 2 - renderer.getLineHeight(UI_12_FONT_ID), "No plugins installed");
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 + 4, "Copy cpplugin JSON into /.crosspoint/plugins");
  } else {
    GUI.drawList(renderer, Rect{0, contentTop, pageWidth, contentHeight}, static_cast<int>(plugins.size()), selectedIndex,
                 [this](int index) { return StringUtils::toDisplaySafeAscii(plugins[index].name); },
                 [this](int index) {
                   const auto& plugin = plugins[index];
                   std::string subtitle = plugin.id + " | v" + std::to_string(plugin.version);
                   if (!plugin.runtimeProfile.empty()) {
                     subtitle += " | " + plugin.runtimeProfile;
                   }
                   return StringUtils::toDisplaySafeAscii(subtitle);
                 },
                 [](int) { return Library; });
  }

  const auto labels = mappedInput.mapLabels(tr(STR_BACK), plugins.empty() ? "" : tr(STR_OPEN), "Reload",
                                            plugins.empty() ? "" : tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
