#include "WirelessCoordinator.h"

#include <Arduino.h>
#include <Logging.h>
#include <WiFi.h>

namespace {
bool modeHasAp(const int mode) { return (mode & static_cast<int>(WIFI_MODE_AP)) != 0; }
}  // namespace

void prepareForWifiUse(const char* ownerTag) {
  const int mode = static_cast<int>(WiFi.getMode());
  WiFi.scanDelete();
  if (modeHasAp(mode)) {
    LOG_DBG(ownerTag, "Stopping WiFi AP before WiFi STA use (mode=%d)", mode);
    WiFi.softAPdisconnect(true);
    delay(40);
  }
}

void prepareForExclusiveWifiUse(const char* ownerTag) { prepareForWifiUse(ownerTag); }

void prepareForBluetoothUse(const char* ownerTag) { LOG_DBG(ownerTag, "Bluetooth coordinator unavailable in clean build"); }
