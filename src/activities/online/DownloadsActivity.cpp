#include "DownloadsActivity.h"

#include <GfxRenderer.h>
#include <HalStorage.h>
#include <I18n.h>

#include "../../util/StringUtils.h"
#include "../../util/RuntimeDebugMetrics.h"
#include "../../util/ScreenDebugState.h"
#include "components/UITheme.h"
#include "fontIds.h"

namespace {
bool isTerminal(DownloadJobStatus status) {
  return status == DownloadJobStatus::Completed || status == DownloadJobStatus::Failed || status == DownloadJobStatus::Cancelled;
}

bool isCancellable(DownloadJobStatus status) { return !isTerminal(status); }

bool isActive(DownloadJobStatus status) {
  return status == DownloadJobStatus::Queued || status == DownloadJobStatus::Running || status == DownloadJobStatus::RetryWait;
}

ScreenDebugDiagnostics buildDownloadsDiagnostics(const std::vector<DownloadJobInfo>& jobs) {
  const auto runtime = RuntimeDebugMetrics::capture();
  ScreenDebugDiagnostics diagnostics;
  diagnostics.trackedSeriesLoaded = runtime.trackedSeriesLoaded;
  diagnostics.trackedSeriesCount = runtime.trackedSeriesCount;
  diagnostics.coverCacheFileCount = runtime.coverCacheFileCount;
  diagnostics.totalJobCount = jobs.size();
  diagnostics.activeJobCount = 0;
  for (const auto& job : jobs) {
    if (isActive(job.status)) {
      diagnostics.activeJobCount++;
    }
  }
  diagnostics.summary =
      RuntimeDebugMetrics::summaryLine(RuntimeDebugMetricsSnapshot{diagnostics.trackedSeriesLoaded,
                                                                   diagnostics.trackedSeriesCount,
                                                                   diagnostics.totalJobCount,
                                                                   diagnostics.activeJobCount,
                                                                   diagnostics.coverCacheFileCount});
  return diagnostics;
}
}  // namespace

void DownloadsActivity::reloadJobs() {
  jobs = BACKGROUND_DOWNLOAD_MANAGER.getJobsSnapshot();
  if (jobs.empty()) {
    selectedIndex = 0;
  } else {
    selectedIndex = std::max(0, std::min(selectedIndex, static_cast<int>(jobs.size()) - 1));
  }
}

void DownloadsActivity::showPopup(const std::string& message) {
  popupMessage = message;
  popupUntilMs = millis() + 1800;
  requestUpdate();
}

std::string DownloadsActivity::formatStatus(const DownloadJobInfo& job) {
  std::string summary;
  switch (job.status) {
    case DownloadJobStatus::Queued: summary = "Queued"; break;
    case DownloadJobStatus::Running: summary = "Updating"; break;
    case DownloadJobStatus::RetryWait: summary = "Retry wait"; break;
    case DownloadJobStatus::Completed: summary = "Ready"; break;
    case DownloadJobStatus::Failed: summary = "Failed"; break;
    case DownloadJobStatus::Cancelled: summary = "Cancelled"; break;
  }

  if (job.totalChapters > 0) {
    summary += " | " + std::to_string(job.completedChapters) + "/" + std::to_string(job.totalChapters) + " ch";
  }
  if (!job.statusMessage.empty()) {
    summary += " | " + job.statusMessage;
  }
  return summary;
}

std::string DownloadsActivity::headerSubtitle(int pageItems) const {
  if (jobs.empty()) {
    return "Queue background jobs";
  }

  int activeCount = 0;
  for (const auto& job : jobs) {
    if (isActive(job.status)) {
      activeCount++;
    }
  }

  std::string subtitle = std::to_string(activeCount) + " active | " + std::to_string(jobs.size()) + " total";
  if (pageItems > 0 && static_cast<int>(jobs.size()) > pageItems) {
    const int currentPage = std::min((static_cast<int>(jobs.size()) + pageItems - 1) / pageItems, selectedIndex / pageItems + 1);
    const int pageStart = (currentPage - 1) * pageItems + 1;
    const int pageEnd = std::min(static_cast<int>(jobs.size()), pageStart + pageItems - 1);
    subtitle += " | " + std::to_string(pageStart) + "-" + std::to_string(pageEnd) + "/" + std::to_string(jobs.size());
    subtitle += " | Page " + std::to_string(currentPage) + "/" +
                std::to_string((static_cast<int>(jobs.size()) + pageItems - 1) / pageItems);
  }
  return subtitle;
}

void DownloadsActivity::onEnter() {
  Activity::onEnter();
  reloadJobs();
  lastPollMs = millis();
  requestUpdate();
}

void DownloadsActivity::loop() {
  if (BACKGROUND_DOWNLOAD_MANAGER.consumeUiRefreshRequested()) {
    reloadJobs();
    requestUpdate();
  }

  const bool hasActiveWork = BACKGROUND_DOWNLOAD_MANAGER.hasActiveWork();
  if (hasActiveWork && millis() - lastPollMs >= 1000) {
    lastPollMs = millis();
    reloadJobs();
    if (!jobs.empty() || hasActiveWork) {
      requestUpdate();
    }
  }

  if (!popupMessage.empty() && millis() >= popupUntilMs) {
    popupMessage.clear();
    requestUpdate();
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    finish();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Right)) {
    std::string message;
    BACKGROUND_DOWNLOAD_MANAGER.clearFinished(&message);
    reloadJobs();
    showPopup(message);
    return;
  }

  if (jobs.empty()) {
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Left)) {
    std::string message;
    BACKGROUND_DOWNLOAD_MANAGER.cancelJob(jobs[selectedIndex].id, &message);
    reloadJobs();
    showPopup(message);
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    const auto selected = jobs[selectedIndex];
    if (selected.status == DownloadJobStatus::Completed && Storage.exists(selected.epubPath.c_str())) {
      activityManager.goToReader(selected.epubPath);
      return;
    }

    if (isTerminal(selected.status)) {
      std::string message;
      BACKGROUND_DOWNLOAD_MANAGER.retryJob(selected.id, &message);
      reloadJobs();
      showPopup(message);
      return;
    }
  }

  buttonNavigator.onNext([this] {
    selectedIndex = ButtonNavigator::nextIndex(selectedIndex, static_cast<int>(jobs.size()));
    requestUpdate();
  });

  buttonNavigator.onPrevious([this] {
    selectedIndex = ButtonNavigator::previousIndex(selectedIndex, static_cast<int>(jobs.size()));
    requestUpdate();
  });
}

void DownloadsActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int contentHeight = pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2;

  const int pageItems = std::max(1, contentHeight / std::max(1, metrics.listWithSubtitleRowHeight));
  const std::string subtitle = headerSubtitle(pageItems);
  const std::string emptyHint = "Queue background download or update jobs";
  SCREEN_DEBUG.setDiagnostics(buildDownloadsDiagnostics(jobs));
  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, "Downloads", subtitle.c_str());

  if (jobs.empty()) {
    renderer.drawCenteredText(UI_12_FONT_ID, pageHeight / 2 - renderer.getLineHeight(UI_12_FONT_ID), "No jobs yet");
    renderer.drawCenteredText(UI_10_FONT_ID, pageHeight / 2 + 4, emptyHint.c_str());
  } else {
    GUI.drawList(renderer, Rect{0, contentTop, pageWidth, contentHeight}, static_cast<int>(jobs.size()), selectedIndex,
                 [this](int index) { return StringUtils::toDisplaySafeAscii(jobs[index].title); },
                 [this](int index) { return StringUtils::toDisplaySafeAscii(formatStatus(jobs[index])); },
                 [](int) { return Recent; });
  }

  if (!popupMessage.empty()) {
    GUI.drawPopup(renderer, popupMessage.c_str());
  }

  const bool canOpen = !jobs.empty() && jobs[selectedIndex].status == DownloadJobStatus::Completed &&
                       Storage.exists(jobs[selectedIndex].epubPath.c_str());
  const bool canRetry = !jobs.empty() && isTerminal(jobs[selectedIndex].status);
  const bool canCancel = !jobs.empty() && isCancellable(jobs[selectedIndex].status);
  const auto labels = mappedInput.mapLabels(tr(STR_BACK), canOpen ? tr(STR_OPEN) : (canRetry ? "Retry" : ""),
                                            canCancel ? "Cancel" : "", jobs.empty() ? "" : "Clear done");
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
