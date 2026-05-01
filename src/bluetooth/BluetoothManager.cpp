#include "BluetoothManager.h"

#include <Arduino.h>
#include <BLEClient.h>
#include <BLEDevice.h>
#include <BLEScan.h>
#include <BLERemoteCharacteristic.h>
#include <BLERemoteService.h>
#include <I18n.h>
#include <Logging.h>
#include <WiFi.h>

#include <algorithm>

namespace {
constexpr uint32_t SCAN_DURATION_SECONDS = 4;
constexpr uint32_t TAP_MULTITAP_WINDOW_MS = 260;
constexpr uint32_t TAP_SWITCH_TIMEOUT_MS = 1500;
constexpr uint32_t TAP_KEEPALIVE_INTERVAL_MS = 5000;
constexpr uint32_t CONNECT_TIMEOUT_MS = 6000;
constexpr uint32_t SHUTDOWN_WAIT_TIMEOUT_MS = CONNECT_TIMEOUT_MS + 1000;

constexpr char TAP_DATA_SERVICE_UUID[] = "C3FF0001-1D8B-40FD-A56F-C7BD5D0F3370";
constexpr char TAP_DATA_CHARACTERISTIC_UUID[] = "C3FF0005-1D8B-40FD-A56F-C7BD5D0F3370";
constexpr char TAP_SUPPORT_SERVICE_UUID[] = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
constexpr char TAP_SUPPORT_CHARACTERISTIC_UUID[] = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";

bool isTapAdvertisedDevice(BLEAdvertisedDevice& device) {
  if (device.haveName()) {
    String lowerName = device.getName();
    lowerName.toLowerCase();
    if (lowerName.indexOf("tap") >= 0) {
      return true;
    }
  }

  return device.haveServiceUUID() && device.isAdvertisingService(BLEUUID(TAP_DATA_SERVICE_UUID));
}

bool isWifiReady() { return WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0); }
}  // namespace

BluetoothManager BLUETOOTH_MANAGER;
BluetoothManager* BluetoothManager::instanceForCallback = nullptr;

void BluetoothManager::ensureStateMutex() {
  if (!stateMutex) {
    stateMutex = xSemaphoreCreateMutex();
  }
}

BluetoothConnectionState BluetoothManager::getState() const {
  if (!stateMutex) {
    return state;
  }
  xSemaphoreTake(stateMutex, portMAX_DELAY);
  const auto snapshot = state;
  xSemaphoreGive(stateMutex);
  return snapshot;
}

std::string BluetoothManager::getStatusMessage() const {
  if (!stateMutex) {
    return statusMessage;
  }
  xSemaphoreTake(stateMutex, portMAX_DELAY);
  std::string snapshot = statusMessage;
  xSemaphoreGive(stateMutex);
  return snapshot;
}

std::vector<BluetoothDeviceInfo> BluetoothManager::getDevices() const {
  if (!stateMutex) {
    return devices;
  }
  xSemaphoreTake(stateMutex, portMAX_DELAY);
  std::vector<BluetoothDeviceInfo> snapshot = devices;
  xSemaphoreGive(stateMutex);
  return snapshot;
}

bool BluetoothManager::isConnected() const { return getState() == BluetoothConnectionState::Connected; }

std::string BluetoothManager::getConnectedAddress() const {
  if (!stateMutex) {
    return connectedAddress;
  }
  xSemaphoreTake(stateMutex, portMAX_DELAY);
  std::string snapshot = connectedAddress;
  xSemaphoreGive(stateMutex);
  return snapshot;
}

std::string BluetoothManager::getConnectedName() const {
  if (!stateMutex) {
    return connectedName;
  }
  xSemaphoreTake(stateMutex, portMAX_DELAY);
  std::string snapshot = connectedName;
  xSemaphoreGive(stateMutex);
  return snapshot;
}

bool BluetoothManager::isBusy() const {
  if (!stateMutex) {
    return state == BluetoothConnectionState::Scanning || state == BluetoothConnectionState::Connecting ||
           workerTaskHandle != nullptr;
  }
  xSemaphoreTake(stateMutex, portMAX_DELAY);
  const bool busy = state == BluetoothConnectionState::Scanning || state == BluetoothConnectionState::Connecting ||
                    workerTaskHandle != nullptr;
  xSemaphoreGive(stateMutex);
  return busy;
}

bool BluetoothManager::ensureInitialized() {
  ensureStateMutex();
  if (initialized) {
    return true;
  }

  BLEDevice::init("CrossPoint");
  BLEScan* scan = BLEDevice::getScan();
  if (!scan) {
    setState(BluetoothConnectionState::Error, tr(STR_BT_INIT_FAILED));
    return false;
  }

  scan->setActiveScan(true);
  scan->setInterval(160);
  scan->setWindow(120);

  initialized = true;
  instanceForCallback = this;
  setState(BluetoothConnectionState::Idle, tr(STR_BT_NOT_CONNECTED));
  return true;
}

void BluetoothManager::loop() {
  if (!initialized) {
    return;
  }

  BLEClient* currentClient = nullptr;
  BLERemoteCharacteristic* currentSupport = nullptr;
  BluetoothConnectionState currentState = BluetoothConnectionState::Idle;
  if (stateMutex) {
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    currentClient = client;
    currentSupport = supportCharacteristic;
    currentState = state;
    xSemaphoreGive(stateMutex);
  } else {
    currentClient = client;
    currentSupport = supportCharacteristic;
    currentState = state;
  }

  if (currentClient && currentState == BluetoothConnectionState::Connected && !currentClient->isConnected()) {
    handleDisconnected();
  }

  if (currentState == BluetoothConnectionState::Connected && currentSupport &&
      millis() - lastControllerKeepAliveAt >= TAP_KEEPALIVE_INTERVAL_MS) {
    if (enterControllerMode()) {
      lastControllerKeepAliveAt = millis();
    }
  }

  drainTapFrames();
  flushPendingTap(millis(), false);

  if (switchArmed && millis() - switchArmedAt > TAP_SWITCH_TIMEOUT_MS) {
    switchArmed = false;
  }
}

void BluetoothManager::shutdown() {
  shuttingDown = true;
  waitForWorkerStop(SHUTDOWN_WAIT_TIMEOUT_MS);
  disconnect();
  if (initialized) {
    BLEDevice::deinit(false);
  }
  initialized = false;
  instanceForCallback = nullptr;
  if (stateMutex) {
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    devices.clear();
    xSemaphoreGive(stateMutex);
  } else {
    devices.clear();
  }
  pendingTap = {};
  shiftNext = false;
  switchArmed = false;
  setState(BluetoothConnectionState::Idle, {});
  shuttingDown = false;
}

bool BluetoothManager::scanForDevices() {
  if (!ensureInitialized()) {
    return false;
  }
  if (isBusy()) {
    return false;
  }

  disconnect();
  if (stateMutex) {
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    devices.clear();
    xSemaphoreGive(stateMutex);
  } else {
    devices.clear();
  }
  setState(BluetoothConnectionState::Scanning, tr(STR_BT_SCANNING));
  if (isWifiReady()) {
    WiFi.setSleep(false);
  }

  BLEScan* scan = BLEDevice::getScan();
  if (!scan) {
    setState(BluetoothConnectionState::Error, tr(STR_BT_SCAN_FAILED));
    if (isWifiReady()) {
      WiFi.setSleep(true);
    }
    return false;
  }

  BLEScanResults* results = scan->start(SCAN_DURATION_SECONDS, false);
  if (!results) {
    setState(BluetoothConnectionState::Error, tr(STR_BT_SCAN_FAILED));
    if (isWifiReady()) {
      WiFi.setSleep(true);
    }
    return false;
  }

  const int count = results->getCount();
  std::vector<BluetoothDeviceInfo> scannedDevices;
  scannedDevices.reserve(count > 0 ? static_cast<size_t>(count) : 0);
  for (int i = 0; i < count; ++i) {
    BLEAdvertisedDevice device = results->getDevice(i);
    if (!device.isConnectable() || !isTapAdvertisedDevice(device)) {
      continue;
    }

    BluetoothDeviceInfo info;
    info.name = device.haveName() ? std::string(device.getName().c_str()) : std::string("TapXR");
    info.address = std::string(device.getAddress().toString().c_str());
    info.rssi = device.haveRSSI() ? device.getRSSI() : 0;
    info.isTapDevice = true;
    info.connectable = device.isConnectable();
    info.addressType = device.getAddressType();
    scannedDevices.push_back(std::move(info));
  }

  std::sort(scannedDevices.begin(), scannedDevices.end(), [](const BluetoothDeviceInfo& a, const BluetoothDeviceInfo& b) {
    return a.rssi > b.rssi;
  });

  scan->clearResults();
  if (stateMutex) {
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    devices = std::move(scannedDevices);
    xSemaphoreGive(stateMutex);
  } else {
    devices = std::move(scannedDevices);
  }
  if (isWifiReady()) {
    WiFi.setSleep(true);
  }

  if (getDevices().empty()) {
    setState(BluetoothConnectionState::Idle, tr(STR_BT_NO_DEVICES));
  } else {
    setState(BluetoothConnectionState::Idle, tr(STR_BT_READY_TO_CONNECT));
  }
  return true;
}

bool BluetoothManager::connectToIndex(const size_t index) {
  if (isBusy()) {
    return false;
  }

  const auto currentDevices = getDevices();
  if (index >= currentDevices.size()) {
    setState(BluetoothConnectionState::Error, tr(STR_BT_CONNECT_FAILED));
    return false;
  }

  disconnect();
  const std::string deviceName = currentDevices[index].name.empty() ? std::string("TapXR") : currentDevices[index].name;
  setState(BluetoothConnectionState::Connecting, std::string("Connecting to ") + deviceName);
  if (isWifiReady()) {
    WiFi.setSleep(false);
  }

  auto* payload = new (std::nothrow) ConnectTaskPayload{this, currentDevices[index]};
  if (!payload) {
    setState(BluetoothConnectionState::Error, tr(STR_BT_CONNECT_FAILED));
    if (isWifiReady()) {
      WiFi.setSleep(true);
    }
    return false;
  }

  TaskHandle_t taskHandle = nullptr;
  BaseType_t taskOk = xTaskCreate(&BluetoothManager::connectTaskTrampoline, "BTConnect", 6144, payload, 1, &taskHandle);
  if (taskOk != pdPASS) {
    delete payload;
    setState(BluetoothConnectionState::Error, tr(STR_BT_CONNECT_FAILED));
    if (isWifiReady()) {
      WiFi.setSleep(true);
    }
    return false;
  }
  if (stateMutex) {
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    workerTaskHandle = taskHandle;
    xSemaphoreGive(stateMutex);
  } else {
    workerTaskHandle = taskHandle;
  }
  return true;
}

bool BluetoothManager::connectTapDevice(const BluetoothDeviceInfo& device) {
  if (!ensureInitialized()) {
    return false;
  }

  setState(BluetoothConnectionState::Connecting, "Opening BLE link");
  client = BLEDevice::createClient();
  if (!client) {
    setState(BluetoothConnectionState::Error, tr(STR_BT_CONNECT_FAILED));
    return false;
  }

  BLEAddress address(String(device.address.c_str()), device.addressType);
  if (!client->connect(address, device.addressType, CONNECT_TIMEOUT_MS)) {
    clearConnectionState();
    delete client;
    client = nullptr;
    setState(BluetoothConnectionState::Error, tr(STR_BT_CONNECT_FAILED));
    return false;
  }

  setState(BluetoothConnectionState::Connecting, "Discovering TapXR services");
  BLERemoteService* tapService = client->getService(BLEUUID(TAP_DATA_SERVICE_UUID));
  BLERemoteService* supportService = client->getService(BLEUUID(TAP_SUPPORT_SERVICE_UUID));
  if (!tapService || !supportService) {
    disconnect();
    setState(BluetoothConnectionState::Error, tr(STR_BT_TAPXR_ONLY));
    return false;
  }

  tapDataCharacteristic = tapService->getCharacteristic(BLEUUID(TAP_DATA_CHARACTERISTIC_UUID));
  supportCharacteristic = supportService->getCharacteristic(BLEUUID(TAP_SUPPORT_CHARACTERISTIC_UUID));
  if (!tapDataCharacteristic || !supportCharacteristic) {
    disconnect();
    setState(BluetoothConnectionState::Error, tr(STR_BT_CONNECT_FAILED));
    return false;
  }

  tapDataCharacteristic->registerForNotify(&BluetoothManager::tapNotificationCallback);
  setState(BluetoothConnectionState::Connecting, "Enabling Tap input");
  if (!enterControllerMode()) {
    disconnect();
    setState(BluetoothConnectionState::Error, tr(STR_BT_CONNECT_FAILED));
    return false;
  }

  connectedAddress = device.address;
  connectedName = device.name;
  pendingTap = {};
  shiftNext = false;
  switchArmed = false;
  lastControllerKeepAliveAt = millis();
  setState(BluetoothConnectionState::Connected, tr(STR_BT_CONNECTED));
  return true;
}

void BluetoothManager::runConnectTask(BluetoothDeviceInfo device) {
  connectTapDevice(device);
  if (stateMutex) {
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    workerTaskHandle = nullptr;
    xSemaphoreGive(stateMutex);
  } else {
    workerTaskHandle = nullptr;
  }
  if (!isConnected() && isWifiReady()) {
    WiFi.setSleep(true);
  }
}

bool BluetoothManager::enterControllerMode() {
  if (!supportCharacteristic) {
    return false;
  }

  uint8_t packet[] = {0x03, 0x0C, 0x00, 0x01};
  return supportCharacteristic->writeValue(packet, sizeof(packet), false);
}

void BluetoothManager::disconnect() {
  if (supportCharacteristic && client && client->isConnected()) {
    uint8_t packet[] = {0x03, 0x0C, 0x00, 0x00};
    supportCharacteristic->writeValue(packet, sizeof(packet), false);
  }

  if (client) {
    client->disconnect();
    delete client;
    client = nullptr;
  }

  clearConnectionState();
  if (initialized) {
    setState(BluetoothConnectionState::Idle, tr(STR_BT_NOT_CONNECTED));
  }
  if (isWifiReady()) {
    WiFi.setSleep(true);
  }
}

void BluetoothManager::clearConnectionState() {
  if (stateMutex) {
    xSemaphoreTake(stateMutex, portMAX_DELAY);
  }
  tapDataCharacteristic = nullptr;
  supportCharacteristic = nullptr;
  connectedAddress.clear();
  connectedName.clear();
  pendingTap = {};
  shiftNext = false;
  switchArmed = false;
  tapFrameHead = 0;
  tapFrameTail = 0;
  if (stateMutex) {
    xSemaphoreGive(stateMutex);
  }
}

void BluetoothManager::setState(const BluetoothConnectionState newState, std::string message) {
  if (stateMutex) {
    xSemaphoreTake(stateMutex, portMAX_DELAY);
  }
  state = newState;
  statusMessage = std::move(message);
  if (stateMutex) {
    xSemaphoreGive(stateMutex);
  }
}

void BluetoothManager::handleDisconnected() {
  clearConnectionState();
  if (client) {
    delete client;
    client = nullptr;
  }
  setState(BluetoothConnectionState::Idle, tr(STR_BT_NOT_CONNECTED));
}

void BluetoothManager::waitForWorkerStop(const uint32_t timeoutMs) {
  const uint32_t start = millis();
  while (true) {
    TaskHandle_t handle = nullptr;
    if (stateMutex) {
      xSemaphoreTake(stateMutex, portMAX_DELAY);
      handle = workerTaskHandle;
      xSemaphoreGive(stateMutex);
    } else {
      handle = workerTaskHandle;
    }
    if (handle == nullptr) {
      return;
    }
    if (millis() - start >= timeoutMs) {
      LOG_ERR("BT", "Timed out waiting for connect task to stop");
      return;
    }
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

void BluetoothManager::connectTaskTrampoline(void* param) {
  std::unique_ptr<ConnectTaskPayload> payload(static_cast<ConnectTaskPayload*>(param));
  if (payload && payload->manager) {
    payload->manager->runConnectTask(std::move(payload->device));
  }
  vTaskDelete(nullptr);
}

void BluetoothManager::enqueueTapFrame(const uint8_t code, const uint16_t intervalMs) {
  portENTER_CRITICAL(&tapQueueMux);
  const uint8_t nextHead = static_cast<uint8_t>((tapFrameHead + 1) % TAP_FRAME_QUEUE_SIZE);
  if (nextHead == tapFrameTail) {
    tapFrameTail = static_cast<uint8_t>((tapFrameTail + 1) % TAP_FRAME_QUEUE_SIZE);
  }

  tapFrameQueue[tapFrameHead].code = code;
  tapFrameQueue[tapFrameHead].intervalMs = intervalMs;
  tapFrameHead = nextHead;
  portEXIT_CRITICAL(&tapQueueMux);
}

void BluetoothManager::drainTapFrames() {
  while (true) {
    portENTER_CRITICAL(&tapQueueMux);
    const bool hasFrame = tapFrameTail != tapFrameHead;
    TapFrame frame;
    if (hasFrame) {
      frame = tapFrameQueue[tapFrameTail];
      tapFrameTail = static_cast<uint8_t>((tapFrameTail + 1) % TAP_FRAME_QUEUE_SIZE);
    }
    portEXIT_CRITICAL(&tapQueueMux);

    if (!hasFrame) {
      break;
    }

    handleTapFrame(frame.code, frame.intervalMs, millis());
  }
}

void BluetoothManager::flushPendingTap(const uint32_t now, const bool force) {
  if (!pendingTap.active) {
    return;
  }

  if (!force && now - pendingTap.lastMs < TAP_MULTITAP_WINDOW_MS) {
    return;
  }

  emitTapCode(pendingTap.code, pendingTap.count);
  pendingTap = {};
}

void BluetoothManager::handleTapFrame(const uint8_t code, const uint16_t intervalMs, const uint32_t now) {
  if (!supportsMultiTap(code)) {
    flushPendingTap(now, true);
    emitTapCode(code, 1);
    return;
  }

  if (pendingTap.active && pendingTap.code == code && intervalMs <= TAP_MULTITAP_WINDOW_MS && pendingTap.count < 3) {
    pendingTap.count++;
    pendingTap.lastMs = now;
    if (pendingTap.count >= 3) {
      flushPendingTap(now, true);
    }
    return;
  }

  flushPendingTap(now, true);
  pendingTap = {.active = true, .code = code, .count = 1, .lastMs = now};
}

void BluetoothManager::emitTapCode(const uint8_t code, const uint8_t count) {
  if (count == 1 && switchArmed) {
    switchArmed = false;
    switch (code) {
      case 1: dispatchCharacter('1'); return;
      case 2: dispatchCharacter('2'); return;
      case 4: dispatchCharacter('3'); return;
      case 8: dispatchCharacter('4'); return;
      case 16: dispatchCharacter('5'); return;
      case 17: dispatchCharacter('6'); return;
      case 18: dispatchCharacter('7'); return;
      case 20: dispatchCharacter('8'); return;
      case 24: dispatchCharacter('9'); return;
      case 30: dispatchCharacter('0'); return;
      case 3: dispatchSpecial(ExternalKeyboardKey::Left); return;
      case 6: dispatchSpecial(ExternalKeyboardKey::Up); return;
      case 9: dispatchSpecial(ExternalKeyboardKey::Down); return;
      case 12: dispatchSpecial(ExternalKeyboardKey::Right); return;
      case 5: dispatchCharacter('.'); return;
      case 15: dispatchSpecial(ExternalKeyboardKey::Tab); return;
      case 19: dispatchSpecial(ExternalKeyboardKey::Escape); return;
      default: return;
    }
  }

  if (count == 2) {
    switch (code) {
      case 31: dispatchCharacter('.'); return;
      case 10: dispatchCharacter(','); return;
      case 9: dispatchCharacter('?'); return;
      case 2: dispatchCharacter('!'); return;
      case 29: dispatchCharacter(':'); return;
      case 30: dispatchCharacter('-'); return;
      case 6: dispatchCharacter('"'); return;
      case 15: dispatchCharacter('\''); return;
      case 19: dispatchCharacter('('); return;
      case 12: dispatchCharacter('/'); return;
      case 5: dispatchCharacter('&'); return;
      case 18: dispatchCharacter('['); return;
      case 13: dispatchCharacter('>'); return;
      default: return;
    }
  }

  if (count >= 3) {
    switch (code) {
      case 19: dispatchCharacter(')'); return;
      case 29: dispatchCharacter(';'); return;
      case 16: dispatchCharacter('_'); return;
      case 1: dispatchCharacter('@'); return;
      case 6: dispatchCharacter('#'); return;
      case 18: dispatchCharacter(']'); return;
      case 12: dispatchCharacter('+'); return;
      case 2: dispatchCharacter('='); return;
      case 13: dispatchCharacter('<'); return;
      case 5: dispatchCharacter('$'); return;
      case 15: dispatchCharacter('%'); return;
      case 9: dispatchCharacter('*'); return;
      default: return;
    }
  }

  if (count != 1) {
    return;
  }

  switch (code) {
    case 1: dispatchCharacter(shiftNext ? 'A' : 'a'); break;
    case 18: dispatchCharacter(shiftNext ? 'B' : 'b'); break;
    case 29: dispatchCharacter(shiftNext ? 'C' : 'c'); break;
    case 5: dispatchCharacter(shiftNext ? 'D' : 'd'); break;
    case 2: dispatchCharacter(shiftNext ? 'E' : 'e'); break;
    case 11: dispatchCharacter(shiftNext ? 'F' : 'f'); break;
    case 13: dispatchCharacter(shiftNext ? 'G' : 'g'); break;
    case 30: dispatchCharacter(shiftNext ? 'H' : 'h'); break;
    case 4: dispatchCharacter(shiftNext ? 'I' : 'i'); break;
    case 23: dispatchCharacter(shiftNext ? 'J' : 'j'); break;
    case 9: dispatchCharacter(shiftNext ? 'K' : 'k'); break;
    case 12: dispatchCharacter(shiftNext ? 'L' : 'l'); break;
    case 10: dispatchCharacter(shiftNext ? 'M' : 'm'); break;
    case 3: dispatchCharacter(shiftNext ? 'N' : 'n'); break;
    case 8: dispatchCharacter(shiftNext ? 'O' : 'o'); break;
    case 19: dispatchCharacter(shiftNext ? 'P' : 'p'); break;
    case 22: dispatchCharacter(shiftNext ? 'Q' : 'q'); break;
    case 15: dispatchCharacter(shiftNext ? 'R' : 'r'); break;
    case 24: dispatchCharacter(shiftNext ? 'S' : 's'); break;
    case 6: dispatchCharacter(shiftNext ? 'T' : 't'); break;
    case 16: dispatchCharacter(shiftNext ? 'U' : 'u'); break;
    case 27: dispatchCharacter(shiftNext ? 'V' : 'v'); break;
    case 21: dispatchCharacter(shiftNext ? 'W' : 'w'); break;
    case 26: dispatchCharacter(shiftNext ? 'X' : 'x'); break;
    case 17: dispatchCharacter(shiftNext ? 'Y' : 'y'); break;
    case 20: dispatchCharacter(shiftNext ? 'Z' : 'z'); break;
    case 31: dispatchCharacter(' '); break;
    case 14: dispatchSpecial(ExternalKeyboardKey::Backspace); break;
    case 25: dispatchSpecial(ExternalKeyboardKey::Submit); break;
    case 28:
      switchArmed = true;
      switchArmedAt = millis();
      break;
    case 7:
      shiftNext = true;
      break;
    default:
      break;
  }
}

void BluetoothManager::dispatchCharacter(const char character) {
  ExternalKeyboardEvent event;
  event.key = ExternalKeyboardKey::Character;
  event.character = character;
  activityManager.injectExternalKeyboardEvent(event);
  shiftNext = false;
}

void BluetoothManager::dispatchSpecial(const ExternalKeyboardKey key) {
  ExternalKeyboardEvent event;
  event.key = key;
  activityManager.injectExternalKeyboardEvent(event);
}

bool BluetoothManager::supportsMultiTap(const uint8_t code) {
  switch (code) {
    case 1:
    case 2:
    case 5:
    case 6:
    case 9:
    case 10:
    case 12:
    case 13:
    case 15:
    case 16:
    case 18:
    case 19:
    case 29:
    case 30:
    case 31:
      return true;
    default:
      return false;
  }
}

void BluetoothManager::tapNotificationCallback(BLERemoteCharacteristic* characteristic, uint8_t* data, size_t length,
                                               bool isNotify) {
  (void)characteristic;
  (void)isNotify;

  if (!instanceForCallback || length < 3) {
    return;
  }

  const uint8_t code = data[0];
  const uint16_t intervalMs = static_cast<uint16_t>(data[1]) | (static_cast<uint16_t>(data[2]) << 8);
  instanceForCallback->enqueueTapFrame(code, intervalMs);
}
