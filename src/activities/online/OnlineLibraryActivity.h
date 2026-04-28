#pragma once

#include "../../BackgroundDownloadManager.h"
#include "../Activity.h"
#include "util/ButtonNavigator.h"

class OnlineLibraryActivity final : public Activity {
  ButtonNavigator buttonNavigator;
  int selectedIndex = 0;

 public:
  explicit OnlineLibraryActivity(GfxRenderer& renderer, MappedInputManager& mappedInput)
      : Activity("OnlineLibrary", renderer, mappedInput) {}

  bool skipLoopDelay() override { return BACKGROUND_DOWNLOAD_MANAGER.hasActiveWork(); }
  bool preventAutoSleep() override { return BACKGROUND_DOWNLOAD_MANAGER.hasActiveWork(); }

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;
};
