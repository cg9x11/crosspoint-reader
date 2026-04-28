#pragma once

#include <cstdint>
#include <string>
#include <vector>

struct CpPluginInfo {
  std::string id;
  std::string name;
  uint32_t version = 0;
  std::string runtimeMode;
  std::string runtimeProfile;
  std::string runtimeOrigin;
  std::string baseUrl;
  std::string locale;
  std::string contentType;
  bool supportsSearch = false;
  bool supportsTrackedUpdates = false;
  bool supportsX3 = false;
  bool supportsX4 = false;
  std::string filePath;
};

class PluginStore {
 private:
  static PluginStore instance;
  std::vector<CpPluginInfo> plugins;

  PluginStore() = default;

 public:
  PluginStore(const PluginStore&) = delete;
  PluginStore& operator=(const PluginStore&) = delete;

  static PluginStore& getInstance() { return instance; }

  bool loadFromDisk();
  bool installPluginJson(const std::string& pluginJson, std::string* outError = nullptr);
  bool removePlugin(const std::string& pluginId, std::string* outError = nullptr);

  const std::vector<CpPluginInfo>& getPlugins() const { return plugins; }
  const CpPluginInfo* getPlugin(const std::string& pluginId) const;
  size_t getCount() const { return plugins.size(); }
  bool hasPlugins() const { return !plugins.empty(); }
};

#define PLUGIN_STORE PluginStore::getInstance()
