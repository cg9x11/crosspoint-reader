#pragma once

#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>

#include <optional>
#include <string>
#include <vector>

#include "DownloadJobStore.h"
#include "PluginStore.h"
#include "TrackedSeriesStore.h"

class BackgroundDownloadManager {
 private:
  std::vector<DownloadJobInfo> jobs;
  SemaphoreHandle_t mutex = nullptr;
  TaskHandle_t workerTaskHandle = nullptr;
  volatile bool uiRefreshRequested = false;

  static BackgroundDownloadManager instance;

  BackgroundDownloadManager() = default;

  static void workerTaskTrampoline(void* param);
  void workerTaskLoop();

  bool saveJobsLocked(std::string* outError = nullptr);
  std::optional<size_t> findJobIndexByIdLocked(const std::string& id) const;
  std::optional<size_t> findActiveJobForSeriesLocked(const std::string& pluginId, const std::string& seriesUrl) const;
  bool runJob(const DownloadJobInfo& job);
  void requestUiRefresh() { uiRefreshRequested = true; }
  std::string makeJobIdLocked(const std::string& pluginId, const std::string& seriesUrl) const;

 public:
  BackgroundDownloadManager(const BackgroundDownloadManager&) = delete;
  BackgroundDownloadManager& operator=(const BackgroundDownloadManager&) = delete;

  static BackgroundDownloadManager& getInstance() { return instance; }

  void begin();
  bool hasActiveWork() const;
  bool consumeUiRefreshRequested();
  void getJobCounts(size_t& outTotalCount, size_t& outActiveCount) const;

  std::vector<DownloadJobInfo> getJobsSnapshot() const;
  std::optional<DownloadJobInfo> getLatestJobForSeries(const std::string& pluginId, const std::string& seriesUrl) const;

  bool enqueueHakoDownload(const CpPluginInfo& pluginInfo, const TrackedSeriesInfo& trackedItem,
                           std::string* outMessage = nullptr);
  bool enqueueTrackedSync(const TrackedSeriesInfo& trackedItem, std::string* outMessage = nullptr);
  bool retryJob(const std::string& jobId, std::string* outMessage = nullptr);
  bool cancelJob(const std::string& jobId, std::string* outMessage = nullptr);
  bool clearFinished(std::string* outMessage = nullptr);
};

#define BACKGROUND_DOWNLOAD_MANAGER BackgroundDownloadManager::getInstance()
