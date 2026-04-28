#pragma once

#include <cstdint>
#include <string>
#include <vector>

enum class DownloadJobKind : uint8_t {
  HakoDownload = 0,
  HakoSync = 1,
  TrackedSync = 2,
};

enum class DownloadJobStatus : uint8_t {
  Queued = 0,
  Running = 1,
  RetryWait = 2,
  Completed = 3,
  Failed = 4,
  Cancelled = 5,
};

struct DownloadJobInfo {
  std::string id;
  DownloadJobKind kind = DownloadJobKind::HakoDownload;
  DownloadJobStatus status = DownloadJobStatus::Queued;
  std::string pluginId;
  std::string runtimeProfile;
  std::string title;
  std::string author;
  std::string seriesUrl;
  std::string epubPath;
  std::string trackedSeriesId;
  uint32_t totalChapters = 0;
  uint32_t completedChapters = 0;
  uint32_t retryCount = 0;
  uint32_t nextRetryAtMs = 0;
  uint32_t createdAtMs = 0;
  uint32_t updatedAtMs = 0;
  std::string statusMessage;
  std::string currentChapterTitle;
};

class DownloadJobStore {
 public:
  static bool loadFromDisk(std::vector<DownloadJobInfo>& outJobs);
  static bool saveToDisk(const std::vector<DownloadJobInfo>& jobs, std::string* outError = nullptr);
};
