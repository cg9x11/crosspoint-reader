#include "OnlineSourceListActivity.h"

#include <GfxRenderer.h>
#include <HalGPIO.h>
#include <I18n.h>
#include <WiFi.h>

#include <algorithm>
#include <map>
#include <tuple>

#include "../../plugins/OnlineSourceBridge.h"
#include "../../network/WirelessCoordinator.h"
#include "../../util/StringUtils.h"
#include "../network/WifiSelectionActivity.h"
#include "HakoSearchActivity.h"
#include "components/UITheme.h"
#include "fontIds.h"

namespace {
std::string g_lastSelectedOnlineSourceId;

std::string canonicalSourceFamily(const CpPluginInfo& plugin) {
  if (!plugin.runtimeProfile.empty()) {
    return plugin.runtimeProfile;
  }
  return plugin.id;
}

int sourceOriginRank(const CpPluginInfo& plugin) {
  if (plugin.runtimeOrigin == "server") {
    return 0;
  }
  return 1;
}

int sourceIdRank(const CpPluginInfo& plugin) {
  return plugin.id == canonicalSourceFamily(plugin) ? 0 : 1;
}

std::tuple<int, int, std::string, std::string> sourcePreferenceKey(const CpPluginInfo& plugin) {
  return std::make_tuple(sourceOriginRank(plugin), sourceIdRank(plugin), plugin.name, plugin.id);
}

bool shouldShowLocale(const CpPluginInfo& plugin) {
  return !plugin.locale.empty() && plugin.locale != "vi-VN";
}

std::string buildSourceSubtitle(const CpPluginInfo& plugin) {
  const std::string localePrefix = shouldShowLocale(plugin) ? plugin.locale + " | " : "";
  return localePrefix + "Server";
}
}

void OnlineSourceListActivity::reloadPlugins(bool forceRefresh) {
  supportedPlugins.clear();
  sourceLoadError.clear();

  std::vector<CpPluginInfo> sourceCandidates;
  if (WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0)) {
    if (!OnlineSourceBridge::fetchSourceCatalog(sourceCandidates, forceRefresh)) {
      sourceLoadError = OnlineSourceBridge::getLastError();
    }
  }

  std::map<std::string, size_t> bestPluginIndexByFamily;

  for (const auto& plugin : sourceCandidates) {
    const bool deviceSupported = gpio.deviceIsX3() ? plugin.supportsX3 : plugin.supportsX4;
    if (!deviceSupported || !plugin.supportsSearch || !OnlineSourceBridge::supportsNativeUi(plugin)) {
      continue;
    }

    const std::string family = canonicalSourceFamily(plugin);
    auto existingIt = bestPluginIndexByFamily.find(family);
    if (existingIt == bestPluginIndexByFamily.end()) {
      bestPluginIndexByFamily[family] = supportedPlugins.size();
      supportedPlugins.push_back(plugin);
      continue;
    }

    CpPluginInfo& currentBest = supportedPlugins[existingIt->second];
    if (sourcePreferenceKey(plugin) < sourcePreferenceKey(currentBest)) {
      currentBest = plugin;
    }
  }

  std::sort(supportedPlugins.begin(), supportedPlugins.end(), [](const CpPluginInfo& left, const CpPluginInfo& right) {
    return std::make_tuple(canonicalSourceFamily(left), sourcePreferenceKey(left)) <
           std::make_tuple(canonicalSourceFamily(right), sourcePreferenceKey(right));
  });

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
  reloadPlugins(true);
  autoWifiLaunchPending = WiFi.status() != WL_CONNECTED || WiFi.localIP() == IPAddress(0, 0, 0, 0);
  requestUpdate();
}

void OnlineSourceListActivity::launchSelectedSource() {
  if (supportedPlugins.empty() || selectedIndex < 0 || selectedIndex >= static_cast<int>(supportedPlugins.size())) {
    return;
  }

  const auto& plugin = supportedPlugins[selectedIndex];
  selectedPluginId = plugin.id;
  g_lastSelectedOnlineSourceId = plugin.id;
  prepareForWifiUse("ONLINE");
  activityManager.pushActivity(std::make_unique<HakoSearchActivity>(renderer, mappedInput, plugin));
}

void OnlineSourceListActivity::launchWifiSelection() {
  startActivityForResult(std::make_unique<WifiSelectionActivity>(renderer, mappedInput),
                         [this](const ActivityResult& result) { onWifiSelectionComplete(!result.isCancelled); });
}

void OnlineSourceListActivity::onWifiSelectionComplete(const bool connected) {
  if (!connected) {
    const bool hadPendingLaunch = pendingLaunchIndex.has_value();
    pendingLaunchIndex.reset();
    if (hadPendingLaunch) {
      RenderLock lock(*this);
      GUI.drawPopup(renderer, tr(STR_WIFI_CONN_FAILED));
    }
    return;
  }

  reloadPlugins(true);
  if (!pendingLaunchIndex.has_value()) {
    requestUpdate();
    return;
  }

  if (supportedPlugins.empty()) {
    pendingLaunchIndex.reset();
    requestUpdate();
    return;
  }

  selectedPluginId = *pendingLaunchIndex < 0 || *pendingLaunchIndex >= static_cast<int>(supportedPlugins.size())
                         ? std::string()
                         : supportedPlugins[*pendingLaunchIndex].id;
  pendingLaunchIndex.reset();
  launchSelectedSource();
}

void OnlineSourceListActivity::loop() {
  if (autoWifiLaunchPending) {
    autoWifiLaunchPending = false;
    launchWifiSelection();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    finish();
    return;
  }

  if (supportedPlugins.empty()) {
    if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
      if (WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0)) {
        reloadPlugins(true);
        requestUpdate();
      } else {
        launchWifiSelection();
      }
    }
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    const auto& plugin = supportedPlugins[selectedIndex];
    if (!OnlineSourceBridge::supportsNativeUi(plugin)) {
      RenderLock lock(*this);
      GUI.drawPopup(renderer, "Native support coming soon");
      return;
    }

    if (WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0)) {
      launchSelectedSource();
    } else {
      pendingLaunchIndex = selectedIndex;
      launchWifiSelection();
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
    const char* message = sourceLoadError.empty() ? "Connect WiFi and try again" : sourceLoadError.c_str();
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 + 4, message);
  } else {
    GUI.drawList(
        renderer, Rect{0, contentTop, pageWidth, contentHeight}, static_cast<int>(supportedPlugins.size()), selectedIndex,
        [this](int index) { return StringUtils::toDisplaySafeAscii(supportedPlugins[index].name); },
        [this](int index) {
          const auto& plugin = supportedPlugins[index];
          return StringUtils::toDisplaySafeAscii(buildSourceSubtitle(plugin));
        },
        [](int) { return Library; });
  }

  const char* confirmLabel = tr(STR_SELECT);
  if (supportedPlugins.empty()) {
    confirmLabel = WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0) ? "Retry" : "Connect";
  }
  const auto labels = mappedInput.mapLabels(tr(STR_BACK), confirmLabel, tr(STR_DIR_UP), tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
