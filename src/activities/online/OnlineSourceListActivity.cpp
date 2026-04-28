#include "OnlineSourceListActivity.h"

#include <GfxRenderer.h>
#include <HalGPIO.h>
#include <I18n.h>

#include <set>

#include "../../plugins/OnlineSourceBridge.h"
#include "../../util/StringUtils.h"
#include "HakoSearchActivity.h"
#include "components/UITheme.h"
#include "fontIds.h"

namespace {
std::string g_lastSelectedOnlineSourceId;
}

void OnlineSourceListActivity::reloadPlugins() {
  supportedPlugins.clear();
  if (!PLUGIN_STORE.hasPlugins()) {
    PLUGIN_STORE.loadFromDisk();
  }
  std::set<std::string> seenSourceKeys;

  for (const auto& plugin : PLUGIN_STORE.getPlugins()) {
    const bool deviceSupported = gpio.deviceIsX3() ? plugin.supportsX3 : plugin.supportsX4;
    if (!deviceSupported || !plugin.supportsSearch || !OnlineSourceBridge::supportsNativeUi(plugin)) {
      continue;
    }

    std::string normalizedBaseUrl = plugin.baseUrl;
    while (!normalizedBaseUrl.empty() && normalizedBaseUrl.back() == '/') {
      normalizedBaseUrl.pop_back();
    }
    const std::string sourceKey = plugin.runtimeProfile + "|" + normalizedBaseUrl;
    if (!sourceKey.empty() && !seenSourceKeys.insert(sourceKey).second) {
      continue;
    }

    supportedPlugins.push_back(plugin);
  }

  restoreSelection();
}

void OnlineSourceListActivity::restoreSelection() {
  if (supportedPlugins.empty()) {
    selectedIndex = 0;
    selectedPluginId.clear();
    return;
  }

  const std::string preferredId = !selectedPluginId.empty() ? selectedPluginId : g_lastSelectedOnlineSourceId;
  if (!preferredId.empty()) {
    for (size_t index = 0; index < supportedPlugins.size(); ++index) {
      if (supportedPlugins[index].id == preferredId) {
        selectedIndex = static_cast<int>(index);
        selectedPluginId = preferredId;
        return;
      }
    }
  }

  selectedIndex = std::min(selectedIndex, std::max(0, static_cast<int>(supportedPlugins.size()) - 1));
  selectedPluginId = supportedPlugins[selectedIndex].id;
}

void OnlineSourceListActivity::onEnter() {
  Activity::onEnter();
  reloadPlugins();
  requestUpdate();
}

void OnlineSourceListActivity::loop() {
  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    finish();
    return;
  }

  if (supportedPlugins.empty()) {
    if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
      finish();
    }
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    const auto& plugin = supportedPlugins[selectedIndex];
    selectedPluginId = plugin.id;
    g_lastSelectedOnlineSourceId = plugin.id;
    if (OnlineSourceBridge::supportsNativeUi(plugin)) {
      activityManager.pushActivity(std::make_unique<HakoSearchActivity>(renderer, mappedInput, plugin));
    } else {
      RenderLock lock(*this);
      GUI.drawPopup(renderer, "Native support coming soon");
    }
    return;
  }

  buttonNavigator.onNext([this] {
    selectedIndex = ButtonNavigator::nextIndex(selectedIndex, static_cast<int>(supportedPlugins.size()));
    selectedPluginId = supportedPlugins[selectedIndex].id;
    g_lastSelectedOnlineSourceId = selectedPluginId;
    requestUpdate();
  });

  buttonNavigator.onPrevious([this] {
    selectedIndex = ButtonNavigator::previousIndex(selectedIndex, static_cast<int>(supportedPlugins.size()));
    selectedPluginId = supportedPlugins[selectedIndex].id;
    g_lastSelectedOnlineSourceId = selectedPluginId;
    requestUpdate();
  });
}

void OnlineSourceListActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int contentHeight = pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2;

  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, "Sources");

  if (supportedPlugins.empty()) {
    renderer.drawCenteredText(UI_12_FONT_ID, pageHeight / 2 - renderer.getLineHeight(UI_12_FONT_ID), "No online sources");
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 + 4, "Import a compatible plugin first");
  } else {
    GUI.drawList(
        renderer, Rect{0, contentTop, pageWidth, contentHeight}, static_cast<int>(supportedPlugins.size()), selectedIndex,
        [this](int index) { return StringUtils::toDisplaySafeAscii(supportedPlugins[index].name); },
        [this](int index) {
          const auto& plugin = supportedPlugins[index];
          std::string subtitle = plugin.locale.empty() ? plugin.baseUrl : plugin.locale + " | " + plugin.baseUrl;
          if (plugin.runtimeMode == "adapter" && !plugin.runtimeProfile.empty()) {
            subtitle += " | " + plugin.runtimeProfile;
          }
          return StringUtils::toDisplaySafeAscii(subtitle);
        },
        [](int) { return Library; });
  }

  const auto labels = mappedInput.mapLabels(tr(STR_BACK), supportedPlugins.empty() ? tr(STR_DONE) : tr(STR_SELECT),
                                            tr(STR_DIR_UP), tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
