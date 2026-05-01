#pragma once

#include <vector>

#include "activities/Activity.h"
#include "bluetooth/BluetoothManager.h"
#include "util/ButtonNavigator.h"

class BluetoothActivity final : public Activity {
 public:
  explicit BluetoothActivity(GfxRenderer& renderer, MappedInputManager& mappedInput)
      : Activity("Bluetooth", renderer, mappedInput) {}

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;

 private:
  ButtonNavigator buttonNavigator;
  int selectedIndex = 0;
  bool pendingInitialScan = false;
  BluetoothConnectionState lastObservedState = BluetoothConnectionState::Idle;
  std::string lastObservedStatus;
  std::string lastObservedConnectedName;
  size_t lastObservedDeviceCount = 0;
  std::string popupMessage;
  uint32_t popupUntilMs = 0;

  int getRowCount() const;
  void startScan();
  void clampSelection();
};
