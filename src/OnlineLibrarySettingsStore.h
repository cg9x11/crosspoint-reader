#pragma once

#include <cstdint>

struct OnlineLibrarySettings {
  uint32_t maxJobRetries = 3;
  uint32_t jobRetryBaseDelaySec = 60;
  uint32_t jobRetryBackoffPercent = 300;
  uint32_t chapterRetryCount = 2;
  uint32_t chapterRetryDelaySec = 8;
};

class OnlineLibrarySettingsStore {
 private:
  static OnlineLibrarySettingsStore instance;
  OnlineLibrarySettings settings;

  OnlineLibrarySettingsStore() = default;

 public:
  OnlineLibrarySettingsStore(const OnlineLibrarySettingsStore&) = delete;
  OnlineLibrarySettingsStore& operator=(const OnlineLibrarySettingsStore&) = delete;

  static OnlineLibrarySettingsStore& getInstance() { return instance; }

  bool loadFromDisk();
  bool saveToDisk() const;

  const OnlineLibrarySettings& get() const { return settings; }
  void set(const OnlineLibrarySettings& next) { settings = next; }
  void resetToDefaults() { settings = OnlineLibrarySettings{}; }
};

#define ONLINE_LIBRARY_SETTINGS_STORE OnlineLibrarySettingsStore::getInstance()
