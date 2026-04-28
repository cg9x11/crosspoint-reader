#pragma once

#include <string>
#include <vector>

#include "../../BackgroundDownloadManager.h"
#include "../Activity.h"
#include "util/ButtonNavigator.h"

class DownloadsActivity final : public Activity {
  ButtonNavigator buttonNavigator;
  std::vector<DownloadJobInfo> jobs;
  int selectedIndex = 0;
  std::string popupMessage;
  uint32_t popupUntilMs = 0;
  uint32_t lastPollMs = 0;

  void reloadJobs();
  void showPopup(const std::string& message);
  static std::string formatStatus(const DownloadJobInfo& job);
  std::string headerSubtitle(int pageItems) const;

 public:
  explicit DownloadsActivity(GfxRenderer& renderer, MappedInputManager& mappedInput)
      : Activity("Downloads", renderer, mappedInput) {}

  bool skipLoopDelay() override { return BACKGROUND_DOWNLOAD_MANAGER.hasActiveWork(); }
  bool preventAutoSleep() override { return BACKGROUND_DOWNLOAD_MANAGER.hasActiveWork(); }

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;
};
