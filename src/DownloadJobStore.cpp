#include "DownloadJobStore.h"

#include <ArduinoJson.h>
#include <HalStorage.h>
#include <Logging.h>

#include <algorithm>

namespace {
constexpr char DOWNLOAD_JOBS_FILE[] = "/.crosspoint/data/download_jobs.json";
constexpr char LEGACY_DOWNLOAD_JOBS_FILE[] = "/.crosspoint/plugins/download_jobs.json";
constexpr uint32_t STORE_VERSION = 2;
constexpr size_t MAX_PERSISTED_TERMINAL_JOBS = 12;
constexpr size_t MAX_STATUS_MESSAGE_LENGTH = 96;
constexpr size_t MAX_CHAPTER_TITLE_LENGTH = 96;

const char* kindToString(DownloadJobKind kind) {
  switch (kind) {
    case DownloadJobKind::HakoDownload: return "hako_download";
    case DownloadJobKind::HakoSync: return "hako_sync";
    case DownloadJobKind::TrackedSync: return "tracked_sync";
  }
  return "hako_download";
}

DownloadJobKind kindFromString(const std::string& value) {
  if (value == "tracked_sync") return DownloadJobKind::TrackedSync;
  if (value == "hako_sync") return DownloadJobKind::HakoSync;
  return DownloadJobKind::HakoDownload;
}

const char* statusToString(DownloadJobStatus status) {
  switch (status) {
    case DownloadJobStatus::Queued: return "queued";
    case DownloadJobStatus::Running: return "running";
    case DownloadJobStatus::RetryWait: return "retry_wait";
    case DownloadJobStatus::Completed: return "completed";
    case DownloadJobStatus::Failed: return "failed";
    case DownloadJobStatus::Cancelled: return "cancelled";
  }
  return "queued";
}

DownloadJobStatus statusFromString(const std::string& value) {
  if (value == "running") return DownloadJobStatus::Running;
  if (value == "retry_wait") return DownloadJobStatus::RetryWait;
  if (value == "completed") return DownloadJobStatus::Completed;
  if (value == "failed") return DownloadJobStatus::Failed;
  if (value == "cancelled") return DownloadJobStatus::Cancelled;
  return DownloadJobStatus::Queued;
}

template <typename TObject>
std::string readStringField(TObject obj, const char* shortKey, const char* legacyKey) {
  if (obj[shortKey].template is<const char*>()) {
    return obj[shortKey].template as<std::string>();
  }
  return obj[legacyKey] | std::string("");
}

template <typename TObject>
uint32_t readUIntField(TObject obj, const char* shortKey, const char* legacyKey) {
  if (!obj[shortKey].isNull()) {
    return obj[shortKey] | static_cast<uint32_t>(0);
  }
  return obj[legacyKey] | static_cast<uint32_t>(0);
}

bool isTerminalStatus(DownloadJobStatus status) {
  return status == DownloadJobStatus::Completed || status == DownloadJobStatus::Failed || status == DownloadJobStatus::Cancelled;
}

std::string compactText(const std::string& value, size_t maxLength) {
  if (value.size() <= maxLength) {
    return value;
  }
  if (maxLength <= 3) {
    return value.substr(0, maxLength);
  }
  return value.substr(0, maxLength - 3) + "...";
}

std::vector<DownloadJobInfo> compactJobsForStorage(const std::vector<DownloadJobInfo>& jobs) {
  std::vector<DownloadJobInfo> activeJobs;
  std::vector<DownloadJobInfo> terminalJobs;
  activeJobs.reserve(jobs.size());
  terminalJobs.reserve(jobs.size());

  for (const auto& job : jobs) {
    DownloadJobInfo copy = job;
    copy.statusMessage = compactText(copy.statusMessage, MAX_STATUS_MESSAGE_LENGTH);
    copy.currentChapterTitle = compactText(copy.currentChapterTitle, MAX_CHAPTER_TITLE_LENGTH);
    if (isTerminalStatus(copy.status)) {
      terminalJobs.push_back(std::move(copy));
    } else {
      activeJobs.push_back(std::move(copy));
    }
  }

  std::sort(terminalJobs.begin(), terminalJobs.end(),
            [](const DownloadJobInfo& lhs, const DownloadJobInfo& rhs) { return lhs.updatedAtMs > rhs.updatedAtMs; });
  if (terminalJobs.size() > MAX_PERSISTED_TERMINAL_JOBS) {
    terminalJobs.resize(MAX_PERSISTED_TERMINAL_JOBS);
  }

  activeJobs.insert(activeJobs.end(), terminalJobs.begin(), terminalJobs.end());
  return activeJobs;
}
}  // namespace

bool DownloadJobStore::loadFromDisk(std::vector<DownloadJobInfo>& outJobs) {
  outJobs.clear();
  Storage.mkdir("/.crosspoint");
  Storage.mkdir("/.crosspoint/data");

  const char* sourcePath = DOWNLOAD_JOBS_FILE;
  if (!Storage.exists(sourcePath) && Storage.exists(LEGACY_DOWNLOAD_JOBS_FILE)) {
    sourcePath = LEGACY_DOWNLOAD_JOBS_FILE;
  }

  if (!Storage.exists(sourcePath)) {
    return true;
  }

  const String json = Storage.readFile(sourcePath);
  if (json.isEmpty()) {
    return true;
  }

  JsonDocument doc;
  const auto error = deserializeJson(doc, json.c_str());
  if (error) {
    LOG_ERR("DLJ", "Failed to parse download job store: %s", error.c_str());
    return false;
  }

  JsonArray items = doc["j"].is<JsonArray>() ? doc["j"].as<JsonArray>() : doc["jobs"].as<JsonArray>();
  outJobs.reserve(items.size());
  for (JsonObject obj : items) {
    DownloadJobInfo job;
    job.id = readStringField(obj, "i", "id");
    job.kind = kindFromString(readStringField(obj, "k", "kind").empty() ? std::string("hako_download")
                                                                         : readStringField(obj, "k", "kind"));
    job.status =
        statusFromString(readStringField(obj, "s", "status").empty() ? std::string("queued") : readStringField(obj, "s", "status"));
    if (job.status == DownloadJobStatus::Running || job.status == DownloadJobStatus::RetryWait) {
      job.status = DownloadJobStatus::Queued;
    }
    job.pluginId = readStringField(obj, "p", "pluginId");
    job.runtimeProfile = readStringField(obj, "rp", "runtimeProfile");
    job.title = readStringField(obj, "t", "title");
    job.author = readStringField(obj, "a", "author");
    job.seriesUrl = readStringField(obj, "u", "seriesUrl");
    job.epubPath = readStringField(obj, "e", "epubPath");
    job.trackedSeriesId = readStringField(obj, "ts", "trackedSeriesId");
    job.totalChapters = readUIntField(obj, "tc", "totalChapters");
    job.completedChapters = readUIntField(obj, "cc", "completedChapters");
    job.retryCount = readUIntField(obj, "rc", "retryCount");
    job.nextRetryAtMs = 0;
    job.createdAtMs = readUIntField(obj, "ct", "createdAtMs");
    job.updatedAtMs = readUIntField(obj, "ut", "updatedAtMs");
    job.statusMessage = compactText(readStringField(obj, "sm", "statusMessage"), MAX_STATUS_MESSAGE_LENGTH);
    job.currentChapterTitle = compactText(readStringField(obj, "ch", "currentChapterTitle"), MAX_CHAPTER_TITLE_LENGTH);

    if (job.id.empty() || job.pluginId.empty() || job.seriesUrl.empty()) {
      LOG_ERR("DLJ", "Skipping invalid download job");
      continue;
    }
    outJobs.push_back(std::move(job));
  }
  outJobs = compactJobsForStorage(outJobs);
  return true;
}

bool DownloadJobStore::saveToDisk(const std::vector<DownloadJobInfo>& jobs, std::string* outError) {
  Storage.mkdir("/.crosspoint");
  Storage.mkdir("/.crosspoint/data");

  JsonDocument doc;
  doc["v"] = STORE_VERSION;
  JsonArray items = doc["j"].to<JsonArray>();
  const std::vector<DownloadJobInfo> persistedJobs = compactJobsForStorage(jobs);
  for (const auto& job : persistedJobs) {
    JsonObject obj = items.add<JsonObject>();
    obj["i"] = job.id;
    obj["k"] = kindToString(job.kind);
    obj["s"] = statusToString(job.status);
    obj["p"] = job.pluginId;
    obj["rp"] = job.runtimeProfile;
    obj["t"] = job.title;
    obj["a"] = job.author;
    obj["u"] = job.seriesUrl;
    obj["e"] = job.epubPath;
    obj["ts"] = job.trackedSeriesId;
    obj["tc"] = job.totalChapters;
    obj["cc"] = job.completedChapters;
    obj["rc"] = job.retryCount;
    obj["ct"] = job.createdAtMs;
    obj["ut"] = job.updatedAtMs;
    if (!job.statusMessage.empty()) obj["sm"] = compactText(job.statusMessage, MAX_STATUS_MESSAGE_LENGTH);
    if (!job.currentChapterTitle.empty()) obj["ch"] = compactText(job.currentChapterTitle, MAX_CHAPTER_TITLE_LENGTH);
  }

  String json;
  serializeJson(doc, json);
  if (!Storage.writeFile(DOWNLOAD_JOBS_FILE, json)) {
    if (outError) *outError = "Failed to write download jobs";
    return false;
  }
  if (Storage.exists(LEGACY_DOWNLOAD_JOBS_FILE)) {
    Storage.remove(LEGACY_DOWNLOAD_JOBS_FILE);
  }
  return true;
}
