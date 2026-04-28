#pragma once

#include <vector>

#include "../../PluginStore.h"
#include "../Activity.h"
#include "util/ButtonNavigator.h"

class OnlineSourceListActivity final : public Activity {
  ButtonNavigator buttonNavigator;
  std::vector<CpPluginInfo> supportedPlugins;
  int selectedIndex = 0;
  std::string selectedPluginId;

  void reloadPlugins();
  void restoreSelection();

 public:
  explicit OnlineSourceListActivity(GfxRenderer& renderer, MappedInputManager& mappedInput)
      : Activity("OnlineSources", renderer, mappedInput) {}

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;
};
