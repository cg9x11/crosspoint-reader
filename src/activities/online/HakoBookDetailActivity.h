#pragma once

#include <vector>

#include "../../BackgroundDownloadManager.h"
#include "../../PluginStore.h"
#include "../../TrackedSeriesStore.h"
#include "../../plugins/HakoEpubService.h"
#include "../../plugins/HakoPluginExecutor.h"
#include "../Activity.h"
#include "util/ButtonNavigator.h"

class HakoBookDetailActivity final : public Activity {
  ButtonNavigator buttonNavigator;
  CpPluginInfo pluginInfo;
  HakoBookDetail detail;
  std::vector<HakoChapterRef> chapters;
  std::string coverBmpPath;
  bool coverLoadAttempted = false;
  bool coverLoadFailed = false;
  bool hasRenderedOnce = false;
  std::string descriptionText;
  int selectedAction = 0;
  bool tracked = false;
  TrackedSeriesInfo trackedItem;
  std::string queueMessage;
  uint32_t queueMessageUntilMs = 0;
  bool confirmLongHandled = false;
  bool confirmShortPending = false;
  bool summaryScrollMode = false;
  int summaryScrollOffset = 0;

  void refreshTrackedState();
  void toggleTracking();
  void openChapter(const HakoChapterRef& ref);
  void openChapterAtIndex(int index);
  void downloadOrSyncEpub();
  bool ensureChaptersLoaded(const char* loadingLabel);
  void ensurePreviewAssets();
  void maybeLoadDeferredAssets();
  std::string summaryText() const;
  int summaryVisibleLineCapacity() const;
  int summaryPageCount() const;
  bool toggleSummaryScrollMode();

 public:
  HakoBookDetailActivity(GfxRenderer& renderer, MappedInputManager& mappedInput, CpPluginInfo pluginInfo,
                         HakoBookDetail detail, std::vector<HakoChapterRef> chapters)
      : Activity("HakoDetail", renderer, mappedInput),
        pluginInfo(std::move(pluginInfo)),
        detail(std::move(detail)),
        chapters(std::move(chapters)) {}

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;
};
