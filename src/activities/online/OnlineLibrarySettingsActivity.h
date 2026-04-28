#pragma once

#include "../../OnlineLibrarySettingsStore.h"
#include "../Activity.h"
#include "util/ButtonNavigator.h"

class OnlineLibrarySettingsActivity final : public Activity {
  ButtonNavigator buttonNavigator;
  OnlineLibrarySettings settings;
  int selectedIndex = 0;
  std::string popupMessage;
  uint32_t popupUntilMs = 0;

  void saveSettings();
  void adjustSelected(int direction);
  std::string titleForIndex(int index) const;
  std::string valueForIndex(int index) const;

 public:
  explicit OnlineLibrarySettingsActivity(GfxRenderer& renderer, MappedInputManager& mappedInput)
      : Activity("OnlineLibrarySettings", renderer, mappedInput) {}

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;
};
