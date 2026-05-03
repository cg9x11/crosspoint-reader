#include "BluetoothActivity.h"

#include <GfxRenderer.h>
#include <I18n.h>

#include <string>

#include "network/WirelessCoordinator.h"
#include "components/UITheme.h"

void BluetoothActivity::onEnter() {
  Activity::onEnter();
  selectedIndex = 0;
  pendingInitialScan = true;
  lastObservedState = BLUETOOTH_MANAGER.getState();
  lastObservedStatus = BLUETOOTH_MANAGER.getStatusMessage();
  lastObservedConnectedName = BLUETOOTH_MANAGER.getConnectedName();
  lastObservedDeviceCount = BLUETOOTH_MANAGER.getDevices().size();
  requestUpdate();
}

int BluetoothActivity::getRowCount() const { return 1 + static_cast<int>(BLUETOOTH_MANAGER.getDevices().size()); }

void BluetoothActivity::startScan() {
  pendingInitialScan = false;
  prepareForBluetoothUse("BTUI");
  BLUETOOTH_MANAGER.scanForDevices();
  popupMessage = BLUETOOTH_MANAGER.getStatusMessage();
  popupUntilMs = millis() + 1200;
  clampSelection();
  requestUpdate();
}

void BluetoothActivity::clampSelection() {
  const int rowCount = getRowCount();
  if (selectedIndex < 0) {
    selectedIndex = 0;
  }
  if (selectedIndex >= rowCount) {
    selectedIndex = rowCount - 1;
  }
}

void BluetoothActivity::loop() {
  if (!popupMessage.empty() && millis() >= popupUntilMs) {
    popupMessage.clear();
    requestUpdate();
  }

  const auto currentState = BLUETOOTH_MANAGER.getState();
  const std::string currentStatus = BLUETOOTH_MANAGER.getStatusMessage();
  const std::string currentConnectedName = BLUETOOTH_MANAGER.getConnectedName();
  const size_t currentDeviceCount = BLUETOOTH_MANAGER.getDevices().size();
  if (currentState != lastObservedState || currentStatus != lastObservedStatus ||
      currentConnectedName != lastObservedConnectedName || currentDeviceCount != lastObservedDeviceCount) {
    const bool wasBusy =
        lastObservedState == BluetoothConnectionState::Scanning || lastObservedState == BluetoothConnectionState::Connecting;
    const bool nowBusy =
        currentState == BluetoothConnectionState::Scanning || currentState == BluetoothConnectionState::Connecting;
    lastObservedState = currentState;
    lastObservedStatus = currentStatus;
    lastObservedConnectedName = currentConnectedName;
    lastObservedDeviceCount = currentDeviceCount;
    if (wasBusy && !nowBusy && !currentStatus.empty()) {
      popupMessage = currentState == BluetoothConnectionState::Connected && !currentConnectedName.empty()
                         ? (currentStatus + ": " + currentConnectedName)
                         : currentStatus;
      popupUntilMs = millis() + 2200;
    }
    clampSelection();
    requestUpdate();
  }

  if (pendingInitialScan) {
    startScan();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    finish();
    return;
  }

  buttonNavigator.onNextRelease([this] {
    selectedIndex = ButtonNavigator::nextIndex(selectedIndex, getRowCount());
    requestUpdate();
  });

  buttonNavigator.onPreviousRelease([this] {
    selectedIndex = ButtonNavigator::previousIndex(selectedIndex, getRowCount());
    requestUpdate();
  });

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    if (BLUETOOTH_MANAGER.isBusy()) {
      return;
    }

    if (selectedIndex == 0) {
      if (BLUETOOTH_MANAGER.isConnected()) {
        BLUETOOTH_MANAGER.disconnect();
      } else {
        startScan();
      }
      requestUpdate();
      return;
    }

    prepareForBluetoothUse("BTUI");
    if (!BLUETOOTH_MANAGER.connectToIndex(static_cast<size_t>(selectedIndex - 1))) {
      popupMessage = BLUETOOTH_MANAGER.getStatusMessage();
      if (popupMessage.empty()) {
        popupMessage = "Bluetooth connect failed";
      }
      popupUntilMs = millis() + 2200;
    } else {
      const auto devices = BLUETOOTH_MANAGER.getDevices();
      const std::string deviceName = (selectedIndex - 1) < static_cast<int>(devices.size())
                                         ? devices[static_cast<size_t>(selectedIndex - 1)].name
                                         : std::string("TapXR");
      popupMessage = "Connecting to " + deviceName;
      popupUntilMs = millis() + 2200;
    }
    requestUpdate();
    return;
  }
}

void BluetoothActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto pageWidth = renderer.getScreenWidth();
  const auto pageHeight = renderer.getScreenHeight();
  const auto& metrics = UITheme::getInstance().getMetrics();

  std::string subtitle = BLUETOOTH_MANAGER.getStatusMessage();
  const std::string connectedName = BLUETOOTH_MANAGER.getConnectedName();
  if (subtitle.empty()) {
    subtitle = BLUETOOTH_MANAGER.isConnected() ? std::string(tr(STR_BT_CONNECTED)) : std::string(tr(STR_BT_NOT_CONNECTED));
  } else if (BLUETOOTH_MANAGER.isConnected() && !connectedName.empty()) {
    subtitle += ": " + connectedName;
  }

  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, tr(STR_BLUETOOTH),
                 subtitle.c_str());

  const auto& devices = BLUETOOTH_MANAGER.getDevices();
  const int listY = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int listHeight = pageHeight - (listY + metrics.buttonHintsHeight + metrics.verticalSpacing);

  GUI.drawList(
      renderer, Rect{0, listY, pageWidth, listHeight}, getRowCount(), selectedIndex,
      [&devices](int index) {
        if (index == 0) {
          return BLUETOOTH_MANAGER.isConnected() ? std::string(tr(STR_BT_DISCONNECT)) : std::string(tr(STR_BT_SCAN_NOW));
        }
        return devices[static_cast<size_t>(index - 1)].name;
      },
      [&devices](int index) {
        if (index == 0) {
          return std::string(tr(STR_BT_TAPXR_ONLY));
        }
        const auto& device = devices[static_cast<size_t>(index - 1)];
        if (BLUETOOTH_MANAGER.getConnectedAddress() == device.address) {
          return std::string(tr(STR_BT_CONNECTED));
        }
        return device.address;
      },
      nullptr,
      [&devices](int index) {
        if (index == 0) {
          return std::string{};
        }
        const auto& device = devices[static_cast<size_t>(index - 1)];
        return std::to_string(device.rssi) + "dBm";
      },
      true);

  const auto labels = mappedInput.mapLabels(tr(STR_BACK), tr(STR_SELECT), tr(STR_DIR_UP), tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  if (!popupMessage.empty()) {
    GUI.drawPopup(renderer, popupMessage.c_str());
  }

  renderer.displayBuffer();
}
