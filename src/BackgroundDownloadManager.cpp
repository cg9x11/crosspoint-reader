#include "BackgroundDownloadManager.h"

#include <Arduino.h>
#include <HalGPIO.h>
#include <Logging.h>

#include <algorithm>
#include <functional>
#include <sstream>

#include "OnlineLibrarySettingsStore.h"
#include "plugins/HakoEpubService.h"
#include "plugins/OnlineSourceBridge.h"

BackgroundDownloadManager BackgroundDownloadManager::instance;

namespace {
constexpr char MODULE[] = "BGDL";
constexpr unsigned WORKER_IDLE_DELAY_MS = 250;
constexpr uint32_t WORKER_TASK_STACK_WORDS = 7168;
bool isActiveStatus(DownloadJobStatus status) {
  return status == DownloadJobStatus::Queued || status == DownloadJobStatus::Running || status == DownloadJobStatus::RetryWait;
}

bool isForegroundOnlyEpubJob(DownloadJobKind kind) {
  return kind == DownloadJobKind::HakoDownload || kind == DownloadJobKind::HakoSync;
}

bool deviceRequiresForegroundOnlyDownloads() { return gpio.deviceIsX3() || gpio.deviceIsX4(); }

const char* foregroundOnlyJobBlockedMessage(DownloadJobKind kind) {
  return kind == DownloadJobKind::HakoDownload ? "Open story detail to download"
                                               : "Open story detail to update";
}

OnlineLibrarySettings loadOnlineLibrarySettings() {
  ONLINE_LIBRARY_SETTINGS_STORE.loadFromDisk();
  return ONLINE_LIBRARY_SETTINGS_STORE.get();
}

uint32_t nextRetryDelayMs(uint32_t retryCount, const OnlineLibrarySettings& settings) {
  uint64_t delayMs = static_cast<uint64_t>(settings.jobRetryBaseDelaySec) * 1000ULL;
  for (uint32_t i = 0; i < retryCount; ++i) {
    delayMs = (delayMs * settings.jobRetryBackoffPercent) / 100ULL;
    if (delayMs > 24ULL * 60ULL * 60ULL * 1000ULL) {
      return 24UL * 60UL * 60UL * 1000UL;
    }
  }
  return static_cast<uint32_t>(delayMs);
}

HakoDownloadOptions makeDownloadOptions() {
  const auto settings = loadOnlineLibrarySettings();
  HakoDownloadOptions options;
  options.chapterDelayMinMs = 2000;
  options.chapterDelayMaxMs = 5000;
  options.batchSize = 5;
  options.batchDelayMinMs = 10000;
  options.batchDelayMaxMs = 20000;
  options.chapterRetryCount = settings.chapterRetryCount;
  options.chapterRetryDelayMinMs = settings.chapterRetryDelaySec * 1000UL;
  options.chapterRetryDelayMaxMs = settings.chapterRetryDelaySec * 1000UL;
  return options;
}

CpPluginInfo resolvePluginInfo(const std::string& pluginId, const std::string& runtimeProfile) {
  const auto* plugin = PLUGIN_STORE.getPlugin(pluginId);
  return plugin ? *plugin : OnlineSourceBridge::makeFallbackPluginInfo(pluginId, runtimeProfile);
}

std::string compactBackgroundError(const std::string& message, const char* fallback) {
  std::string text = message;
  if (text.empty()) {
    text = fallback;
  }
  if (text.size() > 72) {
    text.resize(72);
    while (!text.empty() && text.back() == ' ') {
      text.pop_back();
    }
    text += "...";
  }
  return text;
}
}  // namespace

void BackgroundDownloadManager::begin() {
  if (!mutex) {
    mutex = xSemaphoreCreateMutex();
  }
  if (!mutex) {
    LOG_ERR(MODULE, "Failed to create mutex");
    return;
  }

  xSemaphoreTake(mutex, portMAX_DELAY);
  DownloadJobStore::loadFromDisk(jobs);
  bool migratedLegacyEpubJobs = false;
  if (gpio.deviceIsX3() || gpio.deviceIsX4()) {
    for (auto& job : jobs) {
      if (!isForegroundOnlyEpubJob(job.kind) || !isActiveStatus(job.status)) {
        continue;
      }
      job.status = DownloadJobStatus::Cancelled;
      job.statusMessage = "Foreground download required";
      job.nextRetryAtMs = 0;
      job.updatedAtMs = millis();
      migratedLegacyEpubJobs = true;
    }
  }
  if (migratedLegacyEpubJobs) {
    saveJobsLocked();
  }
  xSemaphoreGive(mutex);

  if (!workerTaskHandle) {
    xTaskCreate(&workerTaskTrampoline, "BackgroundDownload", WORKER_TASK_STACK_WORDS, this, 1, &workerTaskHandle);
    if (!workerTaskHandle) {
      LOG_ERR(MODULE, "Failed to create worker task");
    }
  }
}

void BackgroundDownloadManager::workerTaskTrampoline(void* param) {
  auto* self = static_cast<BackgroundDownloadManager*>(param);
  self->workerTaskLoop();
}

bool BackgroundDownloadManager::saveJobsLocked(std::string* outError) { return DownloadJobStore::saveToDisk(jobs, outError); }

std::optional<size_t> BackgroundDownloadManager::findJobIndexByIdLocked(const std::string& id) const {
  for (size_t i = 0; i < jobs.size(); ++i) {
    if (jobs[i].id == id) return i;
  }
  return std::nullopt;
}

std::optional<size_t> BackgroundDownloadManager::findActiveJobForSeriesLocked(const std::string& pluginId,
                                                                               const std::string& seriesUrl) const {
  for (size_t i = 0; i < jobs.size(); ++i) {
    const auto& job = jobs[i];
    if (job.pluginId == pluginId && job.seriesUrl == seriesUrl && isActiveStatus(job.status)) {
      return i;
    }
  }
  return std::nullopt;
}

std::string BackgroundDownloadManager::makeJobIdLocked(const std::string& pluginId, const std::string& seriesUrl) const {
  std::ostringstream out;
  out << pluginId << "-" << std::hex << std::hash<std::string>{}(pluginId + "|" + seriesUrl + "|" + std::to_string(millis()));
  return out.str();
}

bool BackgroundDownloadManager::hasActiveWork() const {
  if (!mutex) return false;
  xSemaphoreTake(mutex, portMAX_DELAY);
  bool active = false;
  for (const auto& job : jobs) {
    if (isActiveStatus(job.status)) {
      active = true;
      break;
    }
  }
  xSemaphoreGive(mutex);
  return active;
}

bool BackgroundDownloadManager::consumeUiRefreshRequested() {
  const bool wasRequested = uiRefreshRequested;
  uiRefreshRequested = false;
  return wasRequested;
}

void BackgroundDownloadManager::getJobCounts(size_t& outTotalCount, size_t& outActiveCount) const {
  outTotalCount = 0;
  outActiveCount = 0;
  if (!mutex) {
    return;
  }

  xSemaphoreTake(mutex, portMAX_DELAY);
  outTotalCount = jobs.size();
  for (const auto& job : jobs) {
    if (isActiveStatus(job.status)) {
      outActiveCount++;
    }
  }
  xSemaphoreGive(mutex);
}

std::vector<DownloadJobInfo> BackgroundDownloadManager::getJobsSnapshot() const {
  std::vector<DownloadJobInfo> snapshot;
  if (!mutex) return snapshot;
  xSemaphoreTake(mutex, portMAX_DELAY);
  snapshot = jobs;
  xSemaphoreGive(mutex);
  std::sort(snapshot.begin(), snapshot.end(), [](const DownloadJobInfo& a, const DownloadJobInfo& b) {
    if (isActiveStatus(a.status) != isActiveStatus(b.status)) {
      return isActiveStatus(a.status);
    }
    return a.updatedAtMs > b.updatedAtMs;
  });
  return snapshot;
}

std::optional<DownloadJobInfo> BackgroundDownloadManager::getLatestJobForSeries(const std::string& pluginId,
                                                                                 const std::string& seriesUrl) const {
  if (!mutex) return std::nullopt;
  xSemaphoreTake(mutex, portMAX_DELAY);
  std::optional<DownloadJobInfo> match;
  for (const auto& job : jobs) {
    if (job.pluginId != pluginId || job.seriesUrl != seriesUrl) continue;
    if (!match || job.updatedAtMs >= match->updatedAtMs) {
      match = job;
    }
  }
  xSemaphoreGive(mutex);
  return match;
}

bool BackgroundDownloadManager::enqueueHakoDownload(const CpPluginInfo& pluginInfo, const TrackedSeriesInfo& trackedItem,
                                                    std::string* outMessage) {
  if (!mutex) begin();
  if (deviceRequiresForegroundOnlyDownloads()) {
    if (outMessage) *outMessage = foregroundOnlyJobBlockedMessage(DownloadJobKind::HakoDownload);
    return false;
  }
  xSemaphoreTake(mutex, portMAX_DELAY);
  if (findActiveJobForSeriesLocked(pluginInfo.id, trackedItem.seriesUrl).has_value()) {
    xSemaphoreGive(mutex);
    if (outMessage) *outMessage = "Already queued";
    return false;
  }

  DownloadJobInfo job;
  job.id = makeJobIdLocked(pluginInfo.id, trackedItem.seriesUrl);
  job.kind = DownloadJobKind::HakoDownload;
  job.status = DownloadJobStatus::Queued;
  job.pluginId = pluginInfo.id;
  job.runtimeProfile = OnlineSourceBridge::runtimeProfileFor(pluginInfo);
  job.title = trackedItem.title;
  job.author = trackedItem.author;
  job.seriesUrl = trackedItem.seriesUrl;
  job.epubPath = trackedItem.epubPath;
  job.trackedSeriesId = trackedItem.id;
  job.createdAtMs = millis();
  job.updatedAtMs = job.createdAtMs;
  job.statusMessage = "Waiting in queue";
  jobs.push_back(job);
  std::string error;
  bool ok = saveJobsLocked(&error);
  if (ok) {
    TRACKED_SERIES_STORE.ensureLoaded();
    std::string trackedError;
    ok = TRACKED_SERIES_STORE.upsert(trackedItem, &trackedError);
    if (!ok) {
      jobs.pop_back();
      std::string rollbackError;
      if (!saveJobsLocked(&rollbackError) && !rollbackError.empty()) {
        error = trackedError + " (rollback: " + rollbackError + ")";
      } else {
        error = trackedError;
      }
    }
  }
  xSemaphoreGive(mutex);
  if (outMessage) *outMessage = ok ? "Added to downloads and updates" : error;
  if (ok) requestUiRefresh();
  return ok;
}

bool BackgroundDownloadManager::enqueueTrackedSync(const TrackedSeriesInfo& trackedItem, std::string* outMessage) {
  if (!mutex) begin();
  const CpPluginInfo pluginInfo = resolvePluginInfo(trackedItem.pluginId, trackedItem.runtimeProfile);
  const DownloadJobKind jobKind =
      OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo) ? DownloadJobKind::HakoSync : DownloadJobKind::TrackedSync;
  if (deviceRequiresForegroundOnlyDownloads() && isForegroundOnlyEpubJob(jobKind)) {
    if (outMessage) *outMessage = foregroundOnlyJobBlockedMessage(jobKind);
    return false;
  }
  xSemaphoreTake(mutex, portMAX_DELAY);
  if (findActiveJobForSeriesLocked(pluginInfo.id, trackedItem.seriesUrl).has_value()) {
    xSemaphoreGive(mutex);
    if (outMessage) *outMessage = "Already queued";
    return false;
  }

  DownloadJobInfo job;
  job.id = makeJobIdLocked(pluginInfo.id, trackedItem.seriesUrl);
  job.kind = jobKind;
  job.status = DownloadJobStatus::Queued;
  job.pluginId = pluginInfo.id;
  job.runtimeProfile = OnlineSourceBridge::runtimeProfileFor(pluginInfo);
  job.title = trackedItem.title;
  job.author = trackedItem.author;
  job.seriesUrl = trackedItem.seriesUrl;
  job.epubPath = trackedItem.epubPath;
  job.trackedSeriesId = trackedItem.id;
  job.createdAtMs = millis();
  job.updatedAtMs = job.createdAtMs;
  job.statusMessage = "Waiting in queue";
  jobs.push_back(job);
  std::string error;
  bool ok = saveJobsLocked(&error);
  if (!ok) {
    jobs.pop_back();
  }
  xSemaphoreGive(mutex);
  if (outMessage) *outMessage = ok ? "Update check queued" : error;
  if (ok) requestUiRefresh();
  return ok;
}

bool BackgroundDownloadManager::retryJob(const std::string& jobId, std::string* outMessage) {
  if (!mutex) return false;
  xSemaphoreTake(mutex, portMAX_DELAY);
  const auto index = findJobIndexByIdLocked(jobId);
  if (!index.has_value()) {
    xSemaphoreGive(mutex);
    if (outMessage) *outMessage = "Job not found";
    return false;
  }
  auto& job = jobs[*index];
  if (deviceRequiresForegroundOnlyDownloads() && isForegroundOnlyEpubJob(job.kind)) {
    xSemaphoreGive(mutex);
    if (outMessage) *outMessage = foregroundOnlyJobBlockedMessage(job.kind);
    return false;
  }
  job.status = DownloadJobStatus::Queued;
  job.statusMessage = "Waiting in queue";
  job.currentChapterTitle.clear();
  job.retryCount = 0;
  job.totalChapters = 0;
  job.completedChapters = 0;
  job.nextRetryAtMs = 0;
  job.updatedAtMs = millis();
  std::string error;
  bool ok = saveJobsLocked(&error);

  xSemaphoreGive(mutex);
  if (outMessage) *outMessage = ok ? "Retry queued" : error;
  if (ok) requestUiRefresh();
  return ok;
}

bool BackgroundDownloadManager::cancelJob(const std::string& jobId, std::string* outMessage) {
  if (!mutex) return false;
  xSemaphoreTake(mutex, portMAX_DELAY);
  const auto index = findJobIndexByIdLocked(jobId);
  if (!index.has_value()) {
    xSemaphoreGive(mutex);
    if (outMessage) *outMessage = "Job not found";
    return false;
  }
  auto& job = jobs[*index];
  if (job.status == DownloadJobStatus::Completed || job.status == DownloadJobStatus::Failed ||
      job.status == DownloadJobStatus::Cancelled) {
    xSemaphoreGive(mutex);
    if (outMessage) *outMessage = "Nothing to cancel";
    return false;
  }
  job.status = DownloadJobStatus::Cancelled;
  job.statusMessage = "Cancelled";
  job.nextRetryAtMs = 0;
  job.updatedAtMs = millis();
  std::string error;
  bool ok = saveJobsLocked(&error);

  xSemaphoreGive(mutex);
  if (outMessage) *outMessage = ok ? "Cancelled" : error;
  if (ok) requestUiRefresh();
  return ok;
}

bool BackgroundDownloadManager::clearFinished(std::string* outMessage) {
  if (!mutex) return false;
  xSemaphoreTake(mutex, portMAX_DELAY);
  const auto oldSize = jobs.size();
  jobs.erase(std::remove_if(jobs.begin(), jobs.end(),
                            [](const DownloadJobInfo& job) {
                              return job.status == DownloadJobStatus::Completed || job.status == DownloadJobStatus::Failed ||
                                     job.status == DownloadJobStatus::Cancelled;
                            }),
             jobs.end());
  std::string error;
  bool ok = saveJobsLocked(&error);

  const bool changed = oldSize != jobs.size();
  xSemaphoreGive(mutex);
  if (outMessage) *outMessage = ok ? (changed ? "Cleared finished jobs" : "Nothing to clear") : error;
  if (ok) requestUiRefresh();
  return ok;
}

bool BackgroundDownloadManager::runJob(const DownloadJobInfo& job) {
  auto progress = [this, jobId = job.id](const HakoProgressState& state) {
    if (!mutex) return true;
    xSemaphoreTake(mutex, portMAX_DELAY);
    const auto index = findJobIndexByIdLocked(jobId);
    if (!index.has_value()) {
      xSemaphoreGive(mutex);
      return false;
    }

    auto& current = jobs[*index];
    if (current.status == DownloadJobStatus::Cancelled) {
      xSemaphoreGive(mutex);
      return false;
    }

    current.totalChapters = state.totalChapters;
    current.completedChapters = state.completedChapters;
    current.currentChapterTitle = state.chapterTitle;
    current.statusMessage = state.message;
    current.updatedAtMs = millis();
    const bool shouldPersist = state.completedChapters == 0 || state.completedChapters == state.totalChapters ||
                               (state.completedChapters > 0 && state.completedChapters % 5 == 0);
    if (shouldPersist) {
      saveJobsLocked();
    }
    xSemaphoreGive(mutex);
    requestUiRefresh();
    return true;
  };

  const auto onlineSettings = loadOnlineLibrarySettings();
  const auto options = makeDownloadOptions();
  if (job.kind == DownloadJobKind::HakoDownload) {
    const CpPluginInfo pluginInfo = resolvePluginInfo(job.pluginId, job.runtimeProfile);
    if (!OnlineSourceBridge::supportsBackgroundDownloads(pluginInfo)) {
      xSemaphoreTake(mutex, portMAX_DELAY);
      if (const auto index = findJobIndexByIdLocked(job.id)) {
        jobs[*index].status = DownloadJobStatus::Failed;
        jobs[*index].statusMessage = "Unsupported source";
        jobs[*index].updatedAtMs = millis();
        saveJobsLocked();
      }
      xSemaphoreGive(mutex);
      requestUiRefresh();
      return false;
    }

    HakoBookDetail detail;
    std::vector<HakoChapterRef> toc;
    if (!OnlineSourceBridge::fetchDetail(pluginInfo, job.seriesUrl, detail) ||
        !OnlineSourceBridge::fetchToc(pluginInfo, job.seriesUrl, toc)) {
      const std::string loadError = compactBackgroundError(OnlineSourceBridge::getLastError(), "Failed to load series");
      xSemaphoreTake(mutex, portMAX_DELAY);
      if (const auto index = findJobIndexByIdLocked(job.id)) {
        auto& current = jobs[*index];
        current.retryCount++;
        if (current.retryCount <= onlineSettings.maxJobRetries) {
          current.status = DownloadJobStatus::RetryWait;
          current.nextRetryAtMs = millis() + nextRetryDelayMs(current.retryCount - 1, onlineSettings);
          current.statusMessage = loadError;
        } else {
          current.status = DownloadJobStatus::Failed;
          current.statusMessage = loadError;
        }
        current.updatedAtMs = millis();
        saveJobsLocked();
      }
      xSemaphoreGive(mutex);
      requestUiRefresh();
      return false;
    }

    std::string error;
    const bool ok = HakoEpubService::downloadEpub(pluginInfo, detail, toc, job.epubPath, &error, &options, progress);
    xSemaphoreTake(mutex, portMAX_DELAY);
    if (const auto index = findJobIndexByIdLocked(job.id)) {
      auto& current = jobs[*index];
      current.updatedAtMs = millis();
      if (current.status == DownloadJobStatus::Cancelled) {
        current.statusMessage = "Cancelled";
      } else if (ok) {
        TRACKED_SERIES_STORE.ensureLoaded();
        const auto resolvedPlugin = resolvePluginInfo(current.pluginId, current.runtimeProfile);
        auto updatedTracked = HakoEpubService::makeTrackedInfo(resolvedPlugin, detail, toc, nullptr);
        if (const auto* existing = TRACKED_SERIES_STORE.getById(current.trackedSeriesId); existing) {
          updatedTracked = HakoEpubService::makeTrackedInfo(resolvedPlugin, detail, toc, existing);
        }
        updatedTracked.id = current.trackedSeriesId.empty() ? updatedTracked.id : current.trackedSeriesId;
        updatedTracked.epubPath = current.epubPath;
        std::string trackedError;
        TRACKED_SERIES_STORE.upsert(updatedTracked, &trackedError);
        current.trackedSeriesId = updatedTracked.id;
        current.status = DownloadJobStatus::Completed;
        current.totalChapters = static_cast<uint32_t>(toc.size());
        current.completedChapters = static_cast<uint32_t>(toc.size());
        current.statusMessage = "EPUB ready";
        current.currentChapterTitle.clear();
      } else {
        current.retryCount++;
        if (current.retryCount <= onlineSettings.maxJobRetries) {
          current.status = DownloadJobStatus::RetryWait;
          current.nextRetryAtMs = millis() + nextRetryDelayMs(current.retryCount - 1, onlineSettings);
          current.statusMessage = error.empty() ? "Will retry" : error;
        } else {
          current.status = DownloadJobStatus::Failed;
          current.statusMessage = error.empty() ? "Download failed" : error;
        }
      }
      saveJobsLocked();
    }
    xSemaphoreGive(mutex);
    requestUiRefresh();
    return ok;
  }

  if (job.kind == DownloadJobKind::TrackedSync) {
    TRACKED_SERIES_STORE.ensureLoaded();
    const auto* trackedItem = TRACKED_SERIES_STORE.getById(job.trackedSeriesId);
    if (!trackedItem) {
      xSemaphoreTake(mutex, portMAX_DELAY);
      if (const auto index = findJobIndexByIdLocked(job.id)) {
        jobs[*index].status = DownloadJobStatus::Failed;
        jobs[*index].statusMessage = "Tracked series missing";
        jobs[*index].updatedAtMs = millis();
        saveJobsLocked();
      }
      xSemaphoreGive(mutex);
      requestUiRefresh();
      return false;
    }

    const CpPluginInfo pluginInfo = resolvePluginInfo(job.pluginId, job.runtimeProfile);
    TrackedSeriesInfo updatedTracked;
    uint32_t newChapterCount = 0;
    std::string message;
    const bool ok =
        OnlineSourceBridge::refreshTrackedSeries(pluginInfo, *trackedItem, updatedTracked, newChapterCount, message);

    xSemaphoreTake(mutex, portMAX_DELAY);
    if (const auto index = findJobIndexByIdLocked(job.id)) {
      auto& current = jobs[*index];
      current.updatedAtMs = millis();
      current.totalChapters = updatedTracked.chapterCount;
      current.completedChapters = updatedTracked.chapterCount;
      if (ok) {
        std::string trackedError;
        TRACKED_SERIES_STORE.upsert(updatedTracked, &trackedError);
        current.status = DownloadJobStatus::Completed;
        current.statusMessage = trackedError.empty() ? message : trackedError;
        current.currentChapterTitle = updatedTracked.lastChapterTitle;
      } else {
        current.retryCount++;
        if (current.retryCount <= onlineSettings.maxJobRetries) {
          current.status = DownloadJobStatus::RetryWait;
          current.nextRetryAtMs = millis() + nextRetryDelayMs(current.retryCount - 1, onlineSettings);
          current.statusMessage = message.empty() ? "Will retry" : message;
        } else {
          current.status = DownloadJobStatus::Failed;
          current.statusMessage = message.empty() ? "Update check failed" : message;
        }
      }
      saveJobsLocked();
    }
    xSemaphoreGive(mutex);
    requestUiRefresh();
    return ok;
  }

  TRACKED_SERIES_STORE.ensureLoaded();
  const auto* trackedItem = TRACKED_SERIES_STORE.getById(job.trackedSeriesId);
  if (!trackedItem) {
    xSemaphoreTake(mutex, portMAX_DELAY);
    if (const auto index = findJobIndexByIdLocked(job.id)) {
      jobs[*index].status = DownloadJobStatus::Failed;
      jobs[*index].statusMessage = "Tracked series missing";
      jobs[*index].updatedAtMs = millis();
      saveJobsLocked();
    }
    xSemaphoreGive(mutex);
    requestUiRefresh();
    return false;
  }

  HakoTrackedSyncResult result;
  const CpPluginInfo pluginInfo = resolvePluginInfo(job.pluginId, job.runtimeProfile);
  const bool ok = HakoEpubService::syncTrackedSeries(pluginInfo, *trackedItem, result, &options, progress);
  xSemaphoreTake(mutex, portMAX_DELAY);
  if (const auto index = findJobIndexByIdLocked(job.id)) {
    auto& current = jobs[*index];
    current.updatedAtMs = millis();
    current.epubPath = result.epubPath.empty() ? current.epubPath : result.epubPath;
    if (current.status == DownloadJobStatus::Cancelled) {
      current.statusMessage = "Cancelled";
    } else if (ok) {
      current.status = DownloadJobStatus::Completed;
      current.totalChapters = result.chapterCount;
      current.completedChapters = result.chapterCount;
      current.statusMessage = result.message.empty() ? "Sync complete" : result.message;
      current.currentChapterTitle.clear();
    } else {
      current.retryCount++;
      if (current.retryCount <= onlineSettings.maxJobRetries) {
        current.status = DownloadJobStatus::RetryWait;
        current.nextRetryAtMs = millis() + nextRetryDelayMs(current.retryCount - 1, onlineSettings);
        current.statusMessage = result.message.empty() ? "Will retry" : result.message;
      } else {
        current.status = DownloadJobStatus::Failed;
        current.statusMessage = result.message.empty() ? "Sync failed" : result.message;
      }
    }
    saveJobsLocked();
  }
  xSemaphoreGive(mutex);
  requestUiRefresh();
  return ok;
}

void BackgroundDownloadManager::workerTaskLoop() {
  while (true) {
    DownloadJobInfo nextJob;
    bool hasJob = false;

    if (mutex) {
      xSemaphoreTake(mutex, portMAX_DELAY);
      const uint32_t now = millis();
      for (auto& job : jobs) {
        if (job.status == DownloadJobStatus::Queued ||
            (job.status == DownloadJobStatus::RetryWait && (job.nextRetryAtMs == 0 || now >= job.nextRetryAtMs))) {
          job.status = DownloadJobStatus::Running;
          job.statusMessage = "Preparing download";
          job.currentChapterTitle.clear();
          job.nextRetryAtMs = 0;
          job.updatedAtMs = now;
          nextJob = job;
          hasJob = true;
          saveJobsLocked();
          break;
        }
      }
      xSemaphoreGive(mutex);
    }

    if (hasJob) {
      requestUiRefresh();
      runJob(nextJob);
      continue;
    }

    vTaskDelay(WORKER_IDLE_DELAY_MS);
  }
}
