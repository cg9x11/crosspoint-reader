#pragma once

#include <vector>

#include "../../PluginStore.h"
#include "../Activity.h"
#include "util/ButtonNavigator.h"

class PluginRegistryActivity final : public Activity {
  ButtonNavigator buttonNavigator;
  std::vector<CpPluginInfo> plugins;
  int selectedIndex = 0;

  void reloadPlugins();

 public:
  explicit PluginRegistryActivity(GfxRenderer& renderer, MappedInputManager& mappedInput)
      : Activity("PluginRegistry", renderer, mappedInput) {}

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;
};
