#include "WirelessCoordinator.h"

#include <Arduino.h>
#include <HalGPIO.h>
#include <ESPmDNS.h>
#include <Logging.h>
#include <WiFi.h>

#include "BackgroundWebServerRuntime.h"
#include "../bluetooth/BluetoothManager.h"

namespace {
bool modeHasSta(const int mode) { return (mode & static_cast<int>(WIFI_MODE_STA)) != 0; }

bool modeHasAp(const int mode) { return (mode & static_cast<int>(WIFI_MODE_AP)) != 0; }

bool wifiRadioActive() {
  const int mode = static_cast<int>(WiFi.getMode());
  return modeHasSta(mode) || modeHasAp(mode) || WiFi.status() == WL_CONNECTED;
}

void shutdownWifiRadio(const char* ownerTag) {
  if (!wifiRadioActive()) {
    return;
  }

  const int mode = static_cast<int>(WiFi.getMode());
  LOG_DBG(ownerTag, "Shutting down WiFi before Bluetooth (mode=%d status=%d)", mode,
          static_cast<int>(WiFi.status()));

  if (BACKGROUND_WEB_SERVER_RUNTIME.isRunning()) {
    LOG_DBG(ownerTag, "Stopping background web server before Bluetooth");
    BACKGROUND_WEB_SERVER_RUNTIME.stop();
  }

  MDNS.end();
  WiFi.scanDelete();

  if (modeHasAp(mode)) {
    WiFi.softAPdisconnect(true);
  }
  if (modeHasSta(mode) || WiFi.status() == WL_CONNECTED) {
    WiFi.disconnect(false);
  }

  delay(40);
  WiFi.mode(WIFI_OFF);
  delay(60);
}

bool bluetoothInitialized() { return BLUETOOTH_MANAGER.isInitialized(); }

bool shouldForceBluetoothShutdownForWifi() { return gpio.deviceIsX3() || gpio.deviceIsX4(); }
}  // namespace

void prepareForWifiUse(const char* ownerTag) {
  if (!bluetoothInitialized()) {
    return;
  }

  const auto state = BLUETOOTH_MANAGER.getState();
  if (shouldForceBluetoothShutdownForWifi()) {
    LOG_DBG(ownerTag, "Shutting down Bluetooth before WiFi STA on constrained device (state=%d)",
            static_cast<int>(state));
    BLUETOOTH_MANAGER.shutdown();
    delay(80);
    return;
  }

  LOG_DBG(ownerTag, "Keeping Bluetooth active while enabling WiFi STA (state=%d)", static_cast<int>(state));
}

void prepareForExclusiveWifiUse(const char* ownerTag) {
  if (!bluetoothInitialized()) {
    return;
  }

  LOG_DBG(ownerTag, "Shutting down Bluetooth before exclusive WiFi use (state=%d)",
          static_cast<int>(BLUETOOTH_MANAGER.getState()));
  BLUETOOTH_MANAGER.shutdown();
  delay(60);
}

void prepareForBluetoothUse(const char* ownerTag) {
  const int mode = static_cast<int>(WiFi.getMode());
  if (!modeHasAp(mode)) {
    if (wifiRadioActive()) {
      LOG_DBG(ownerTag, "Keeping WiFi STA active while enabling Bluetooth (mode=%d status=%d)", mode,
              static_cast<int>(WiFi.status()));
    }
    return;
  }

  LOG_DBG(ownerTag, "Stopping WiFi AP before Bluetooth (mode=%d status=%d)", mode, static_cast<int>(WiFi.status()));
  shutdownWifiRadio(ownerTag);
}
