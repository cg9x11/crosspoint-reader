#include "RuntimeDebugMetrics.h"

#include <sstream>

#include "../BackgroundDownloadManager.h"
#include "../OnlineCoverStore.h"
#include "../TrackedSeriesStore.h"

RuntimeDebugMetricsSnapshot RuntimeDebugMetrics::capture() {
  RuntimeDebugMetricsSnapshot snapshot;
  snapshot.trackedSeriesLoaded = TRACKED_SERIES_STORE.isLoaded();
  snapshot.trackedSeriesCount = TRACKED_SERIES_STORE.getCount();

  size_t totalJobCount = 0;
  size_t activeJobCount = 0;
  BACKGROUND_DOWNLOAD_MANAGER.getJobCounts(totalJobCount, activeJobCount);
  snapshot.totalJobCount = totalJobCount;
  snapshot.activeJobCount = activeJobCount;
  snapshot.coverCacheFileCount = OnlineCoverStore::getCacheFileCount();
  return snapshot;
}

std::string RuntimeDebugMetrics::summaryLine(const RuntimeDebugMetricsSnapshot& snapshot) {
  std::ostringstream out;
  out << "trk " << snapshot.trackedSeriesCount;
  out << (snapshot.trackedSeriesLoaded ? " loaded" : " cold");
  out << " | jobs " << snapshot.activeJobCount << "/" << snapshot.totalJobCount;
  out << " | covers " << snapshot.coverCacheFileCount;
  return out.str();
}
