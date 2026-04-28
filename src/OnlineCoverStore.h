#pragma once

#include <string>

class OnlineCoverStore {
 public:
  static bool tryGetCachedThumb(const std::string& coverUrl, int targetHeight, std::string& outBmpPath);
  static bool getOrCreateThumb(const std::string& coverUrl, int targetHeight, std::string& outBmpPath);
  static void pruneCache();
  static size_t getCacheFileCount();
};
