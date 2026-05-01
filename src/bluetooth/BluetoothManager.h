#pragma once

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>

#include "activities/Activity.h"

enum class BluetoothConnectionState { Idle, Scanning, Connecting, Connected, Error };

struct BluetoothDeviceInfo {
  std::string name;
  std::string address;
  int rssi = 0;
  bool isTapDevice = false;
  bool connectable = false;
  uint8_t addressType = 0;
};

class BLEClient;
class BLERemoteCharacteristic;

class BluetoothManager {
 public:
  bool ensureInitialized();
  void loop();
  void shutdown();

  bool scanForDevices();
  bool connectToIndex(size_t index);
  void disconnect();

  BluetoothConnectionState getState() const;
  std::string getStatusMessage() const;
  std::vector<BluetoothDeviceInfo> getDevices() const;
  bool isConnected() const;
  std::string getConnectedAddress() const;
  std::string getConnectedName() const;
  bool isBusy() const;

 private:
  struct TapFrame {
    uint8_t code = 0;
    uint16_t intervalMs = 0;
  };

  struct PendingTap {
    bool active = false;
    uint8_t code = 0;
    uint8_t count = 0;
    uint32_t lastMs = 0;
  };

  struct ConnectTaskPayload {
    BluetoothManager* manager = nullptr;
    BluetoothDeviceInfo device;
  };

  bool initialized = false;
  BluetoothConnectionState state = BluetoothConnectionState::Idle;
  std::string statusMessage;
  std::vector<BluetoothDeviceInfo> devices;

  BLEClient* client = nullptr;
  BLERemoteCharacteristic* tapDataCharacteristic = nullptr;
  BLERemoteCharacteristic* supportCharacteristic = nullptr;
  std::string connectedAddress;
  std::string connectedName;
  TaskHandle_t workerTaskHandle = nullptr;
  SemaphoreHandle_t stateMutex = nullptr;
  bool shuttingDown = false;

  static constexpr size_t TAP_FRAME_QUEUE_SIZE = 24;
  TapFrame tapFrameQueue[TAP_FRAME_QUEUE_SIZE];
  portMUX_TYPE tapQueueMux = portMUX_INITIALIZER_UNLOCKED;
  volatile uint8_t tapFrameHead = 0;
  volatile uint8_t tapFrameTail = 0;
  PendingTap pendingTap;
  bool shiftNext = false;
  bool switchArmed = false;
  uint32_t switchArmedAt = 0;
  uint32_t lastControllerKeepAliveAt = 0;

  bool connectTapDevice(const BluetoothDeviceInfo& device);
  void runConnectTask(BluetoothDeviceInfo device);
  bool enterControllerMode();
  void ensureStateMutex();
  void waitForWorkerStop(uint32_t timeoutMs);
  void clearConnectionState();
  void setState(BluetoothConnectionState newState, std::string message);
  void handleDisconnected();

  void enqueueTapFrame(uint8_t code, uint16_t intervalMs);
  void drainTapFrames();
  void flushPendingTap(uint32_t now, bool force);
  void handleTapFrame(uint8_t code, uint16_t intervalMs, uint32_t now);
  void emitTapCode(uint8_t code, uint8_t count);
  void dispatchCharacter(char character);
  void dispatchSpecial(ExternalKeyboardKey key);

  static bool supportsMultiTap(uint8_t code);
  static void connectTaskTrampoline(void* param);
  static void tapNotificationCallback(BLERemoteCharacteristic* characteristic, uint8_t* data, size_t length, bool isNotify);
  static BluetoothManager* instanceForCallback;
};

extern BluetoothManager BLUETOOTH_MANAGER;
