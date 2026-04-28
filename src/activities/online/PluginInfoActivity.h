#pragma once

#include "../../PluginStore.h"
#include "../Activity.h"

class PluginInfoActivity final : public Activity {
  CpPluginInfo plugin;
  std::string popupMessage;
  uint32_t popupUntilMs = 0;

 public:
  PluginInfoActivity(GfxRenderer& renderer, MappedInputManager& mappedInput, CpPluginInfo plugin)
      : Activity("PluginInfo", renderer, mappedInput), plugin(std::move(plugin)) {}

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;
};
