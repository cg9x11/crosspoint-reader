#pragma once

#include <cstddef>
#include <string>

struct RuntimeDebugMetricsSnapshot {
  bool trackedSeriesLoaded = false;
  size_t trackedSeriesCount = 0;
  size_t totalJobCount = 0;
  size_t activeJobCount = 0;
  size_t coverCacheFileCount = 0;
};

class RuntimeDebugMetrics {
 public:
  static RuntimeDebugMetricsSnapshot capture();
  static std::string summaryLine(const RuntimeDebugMetricsSnapshot& snapshot);
};
