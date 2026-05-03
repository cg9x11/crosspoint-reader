#pragma once

#include <optional>
#include <vector>

#include "../../plugins/OnlineSourceBridge.h"
#include "../Activity.h"
#include "util/ButtonNavigator.h"

class OnlineSourceListActivity final : public Activity {
  ButtonNavigator buttonNavigator;
  std::vector<CpPluginInfo> supportedPlugins;
  int selectedIndex = 0;
  std::string selectedPluginId;
  std::string sourceLoadError;
  std::optional<int> pendingLaunchIndex;
  bool autoWifiLaunchPending = false;

  void reloadPlugins(bool forceRefresh = false);
  void restoreSelection();
  void launchSelectedSource();
  void launchWifiSelection();
  void onWifiSelectionComplete(bool connected);

 public:
  explicit OnlineSourceListActivity(GfxRenderer& renderer, MappedInputManager& mappedInput)
      : Activity("OnlineSources", renderer, mappedInput) {}

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;
};
