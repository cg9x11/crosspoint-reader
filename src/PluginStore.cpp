#include "PluginStore.h"

#include <ArduinoJson.h>
#include <HalStorage.h>
#include <Logging.h>

#include <algorithm>
#include <cctype>
#include <cstring>

PluginStore PluginStore::instance;

namespace {
constexpr char PLUGIN_DIR[] = "/.crosspoint/plugins";
constexpr char DEFAULT_ONLINE_LIBRARY_BASE_URL[] = "https://online-library.noe.asia";
constexpr char HAKO_PLUGIN_JSON[] =
    "{"
    "\"plugin\":{\"id\":\"hako\",\"name\":\"Hako\",\"version\":1,\"deviceSupport\":[\"x3\",\"x4\"]},"
    "\"runtime\":{\"mode\":\"adapter\",\"adapter\":{\"origin\":\"server\",\"profile\":\"hako\"}},"
    "\"source\":{\"baseUrl\":\"https://online-library.noe.asia\",\"locale\":\"vi-VN\",\"contentType\":\"webnovel\","
    "\"supportsSearch\":true,\"supportsTrackedUpdates\":true}"
    "}";
constexpr char TRUYENFULL_PLUGIN_JSON[] =
    "{"
    "\"plugin\":{\"id\":\"truyenfull\",\"name\":\"Truyen Full\",\"version\":1,\"deviceSupport\":[\"x3\",\"x4\"]},"
    "\"runtime\":{\"mode\":\"adapter\",\"adapter\":{\"origin\":\"server\",\"profile\":\"truyenfull\"}},"
    "\"source\":{\"baseUrl\":\"https://online-library.noe.asia\",\"locale\":\"vi-VN\",\"contentType\":\"webnovel\","
    "\"supportsSearch\":true,\"supportsTrackedUpdates\":false}"
    "}";

bool isSafePluginId(const std::string& id) {
  if (id.empty()) {
    return false;
  }
  for (char ch : id) {
    const bool ok = std::isalnum(static_cast<unsigned char>(ch)) || ch == '_' || ch == '-';
    if (!ok) {
      return false;
    }
  }
  return true;
}

std::string buildPluginPath(const std::string& pluginId) { return std::string(PLUGIN_DIR) + "/" + pluginId + ".cpplugin.json"; }

bool parsePluginJson(const char* json, CpPluginInfo& outInfo, std::string* outError);

std::string canonicalizedPluginIdFor(const std::string& pluginId, const std::string& runtimeProfile) {
  if (runtimeProfile == "hako") {
    return "hako";
  }
  if (runtimeProfile == "truyenfull") {
    return "truyenfull";
  }
  if (pluginId == "hako" || pluginId == "hako-novel") {
    return "hako";
  }
  if (pluginId == "truyenfull" || pluginId == "truyen-full" || pluginId == "webtruyen") {
    return "truyenfull";
  }
  return pluginId;
}

std::string canonicalizedRuntimeProfileFor(const std::string& pluginId, const std::string& runtimeProfile) {
  if (runtimeProfile == "hako" || runtimeProfile == "truyenfull") {
    return runtimeProfile;
  }

  const std::string canonicalPluginId = canonicalizedPluginIdFor(pluginId, runtimeProfile);
  if (canonicalPluginId == "hako") {
    return "hako";
  }
  if (canonicalPluginId == "truyenfull") {
    return "truyenfull";
  }
  return runtimeProfile;
}

bool isBundledOnlineLibraryPlugin(const std::string& pluginId) { return pluginId == "hako" || pluginId == "truyenfull"; }

std::string expectedRuntimeProfileForBundledPlugin(const std::string& pluginId) {
  if (pluginId == "hako") {
    return "hako";
  }
  if (pluginId == "truyenfull") {
    return "truyenfull";
  }
  return "";
}

bool shouldMigrateBundledOnlineLibraryPlugin(const std::string& pluginId, const CpPluginInfo& existingInfo) {
  if (!isBundledOnlineLibraryPlugin(pluginId) || existingInfo.id != pluginId) {
    return false;
  }

  const std::string expectedProfile = expectedRuntimeProfileForBundledPlugin(pluginId);
  if (expectedProfile.empty()) {
    return false;
  }

  // Force bundled `hako` / `truyenfull` onto the server-backed runtime so
  // real devices do not fall back to fragile direct-web fetches.
  return existingInfo.runtimeMode != "adapter" || existingInfo.runtimeProfile != expectedProfile ||
         existingInfo.runtimeOrigin != "server" || existingInfo.baseUrl != DEFAULT_ONLINE_LIBRARY_BASE_URL;
}

bool shouldReplaceBundledPlugin(const std::string& path, const std::string& pluginId, const String& incomingJson) {
  if (!Storage.exists(path.c_str())) {
    return true;
  }

  const String existingJson = Storage.readFile(path.c_str());
  if (existingJson == incomingJson) {
    return false;
  }

  CpPluginInfo existingInfo;
  if (!parsePluginJson(existingJson.c_str(), existingInfo, nullptr)) {
    return true;
  }

  // Migrate legacy bundled native plugins and older direct-web bundled
  // adapters to the server-backed bundled runtime.
  if (shouldMigrateBundledOnlineLibraryPlugin(pluginId, existingInfo)) {
    return true;
  }

  // Avoid overwriting custom plugins with unrelated ids.
  return existingInfo.id == pluginId && existingInfo.runtimeMode == "native";
}

void seedBundledPlugin(const char* pluginId, const char* json) {
  const std::string path = buildPluginPath(pluginId);
  const String incoming = String(json);
  if (!shouldReplaceBundledPlugin(path, pluginId, incoming)) {
    return;
  }
  Storage.writeFile(path.c_str(), incoming);
}

void deleteLegacyBundledPlugin(const char* pluginId) {
  const std::string path = buildPluginPath(pluginId);
  if (Storage.exists(path.c_str())) {
    Storage.remove(path.c_str());
  }
}

bool parsePluginJson(const char* json, CpPluginInfo& outInfo, std::string* outError) {
  JsonDocument doc;
  const auto error = deserializeJson(doc, json);
  if (error) {
    if (outError) *outError = std::string("JSON parse error: ") + error.c_str();
    return false;
  }

  JsonObject plugin = doc["plugin"];
  JsonObject source = doc["source"];
  JsonObject runtime = doc["runtime"];

  if (plugin.isNull() || source.isNull() || runtime.isNull()) {
    if (outError) *outError = "Missing required top-level sections";
    return false;
  }

  outInfo.id = plugin["id"] | std::string("");
  outInfo.name = plugin["name"] | std::string("");
  outInfo.runtimeMode = runtime["mode"] | std::string("");
  JsonObject adapter = runtime["adapter"];
  outInfo.runtimeProfile = adapter["profile"] | std::string("");
  outInfo.id = canonicalizedPluginIdFor(outInfo.id, outInfo.runtimeProfile);
  outInfo.runtimeProfile = canonicalizedRuntimeProfileFor(outInfo.id, outInfo.runtimeProfile);
  if (outInfo.id == "hako") {
    outInfo.name = "Hako";
  } else if (outInfo.id == "truyenfull") {
    outInfo.name = "Truyen Full";
  } else if (outInfo.id == "webtruyen") {
    outInfo.name = "Web Truyen";
  }
  outInfo.version = plugin["version"] | static_cast<uint32_t>(0);
  outInfo.runtimeOrigin = adapter["origin"] | std::string("");
  outInfo.baseUrl = source["baseUrl"] | std::string("");
  outInfo.locale = source["locale"] | std::string("");
  outInfo.contentType = source["contentType"] | std::string("");
  outInfo.supportsSearch = source["supportsSearch"] | false;
  outInfo.supportsTrackedUpdates = source["supportsTrackedUpdates"] | false;
  outInfo.supportsX3 = false;
  outInfo.supportsX4 = false;

  JsonArray deviceSupport = plugin["deviceSupport"].as<JsonArray>();
  for (JsonVariant value : deviceSupport) {
    const std::string device = value.as<std::string>();
    if (device == "x3") outInfo.supportsX3 = true;
    if (device == "x4") outInfo.supportsX4 = true;
  }

  if (!isSafePluginId(outInfo.id)) {
    if (outError) *outError = "Invalid plugin id";
    return false;
  }
  if (outInfo.name.empty()) {
    if (outError) *outError = "Missing plugin name";
    return false;
  }
  if (outInfo.version == 0) {
    if (outError) *outError = "Missing or invalid plugin version";
    return false;
  }
  if (outInfo.runtimeMode.empty()) {
    if (outError) *outError = "Missing runtime mode";
    return false;
  }
  if (outInfo.runtimeMode == "adapter" && outInfo.runtimeProfile.empty()) {
    if (outError) *outError = "Adapter runtime requires profile";
    return false;
  }
  if (outInfo.baseUrl.empty()) {
    if (outError) *outError = "Missing source baseUrl";
    return false;
  }
  if (!outInfo.supportsX3 && !outInfo.supportsX4) {
    if (outError) *outError = "Plugin must support at least one device";
    return false;
  }
  return true;
}
}  // namespace

bool PluginStore::loadFromDisk() {
  plugins.clear();
  Storage.mkdir("/.crosspoint");
  Storage.mkdir(PLUGIN_DIR);
  deleteLegacyBundledPlugin("webtruyen");
  deleteLegacyBundledPlugin("hako-novel");
  deleteLegacyBundledPlugin("truyen-full");
  seedBundledPlugin("hako", HAKO_PLUGIN_JSON);
  seedBundledPlugin("truyenfull", TRUYENFULL_PLUGIN_JSON);

  FsFile root = Storage.open(PLUGIN_DIR);
  if (!root || !root.isDirectory()) {
    LOG_DBG("PLG", "Plugin directory unavailable");
    if (root) root.close();
    return false;
  }

  FsFile file = root.openNextFile();
  char nameBuf[192];
  while (file) {
    memset(nameBuf, 0, sizeof(nameBuf));
    file.getName(nameBuf, sizeof(nameBuf));
    const std::string fileName = nameBuf;
    if (!file.isDirectory() && fileName.size() >= 14 &&
        fileName.rfind(".cpplugin.json") == fileName.size() - std::strlen(".cpplugin.json")) {
      std::string fullPath = std::string(PLUGIN_DIR) + "/" + fileName;
      const String json = Storage.readFile(fullPath.c_str());
      if (!json.isEmpty()) {
        CpPluginInfo info;
        std::string error;
        if (parsePluginJson(json.c_str(), info, &error)) {
          info.filePath = fullPath;
          plugins.push_back(std::move(info));
        } else {
          LOG_ERR("PLG", "Failed to load plugin %s: %s", fullPath.c_str(), error.c_str());
        }
      }
    }
    file.close();
    file = root.openNextFile();
  }
  root.close();

  std::sort(plugins.begin(), plugins.end(),
            [](const CpPluginInfo& a, const CpPluginInfo& b) { return a.name < b.name; });
  LOG_DBG("PLG", "Loaded %d plugins", static_cast<int>(plugins.size()));
  return true;
}

bool PluginStore::installPluginJson(const std::string& pluginJson, std::string* outError) {
  CpPluginInfo info;
  if (!parsePluginJson(pluginJson.c_str(), info, outError)) {
    return false;
  }

  Storage.mkdir("/.crosspoint");
  Storage.mkdir(PLUGIN_DIR);
  const std::string path = buildPluginPath(info.id);
  if (!Storage.writeFile(path.c_str(), String(pluginJson.c_str()))) {
    if (outError) *outError = "Failed to write plugin file";
    return false;
  }

  info.filePath = path;
  loadFromDisk();
  return true;
}

bool PluginStore::removePlugin(const std::string& pluginId, std::string* outError) {
  const std::string canonicalPluginId = canonicalizedPluginIdFor(pluginId, "");
  if (!isSafePluginId(canonicalPluginId)) {
    if (outError) *outError = "Invalid plugin id";
    return false;
  }
  const std::string path = buildPluginPath(canonicalPluginId);
  if (!Storage.exists(path.c_str())) {
    if (outError) *outError = "Plugin not found";
    return false;
  }
  if (!Storage.remove(path.c_str())) {
    if (outError) *outError = "Failed to delete plugin";
    return false;
  }
  loadFromDisk();
  return true;
}

const CpPluginInfo* PluginStore::getPlugin(const std::string& pluginId) const {
  const std::string canonicalPluginId = canonicalizedPluginIdFor(pluginId, "");
  for (const auto& plugin : plugins) {
    if (plugin.id == canonicalPluginId) {
      return &plugin;
    }
  }
  return nullptr;
}

std::string PluginStore::canonicalizePluginId(const std::string& pluginId, const std::string& runtimeProfile) {
  return canonicalizedPluginIdFor(pluginId, runtimeProfile);
}

std::string PluginStore::canonicalizeRuntimeProfile(const std::string& pluginId, const std::string& runtimeProfile) {
  return canonicalizedRuntimeProfileFor(pluginId, runtimeProfile);
}
