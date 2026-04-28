#pragma once

#include <vector>

#include "../../PluginStore.h"
#include "../../plugins/HakoPluginExecutor.h"
#include "../Activity.h"
#include "util/ButtonNavigator.h"

class HakoChapterListActivity final : public Activity {
  ButtonNavigator buttonNavigator;
  CpPluginInfo pluginInfo;
  std::string bookTitle;
  std::string bookAuthor;
  std::string seriesUrl;
  std::vector<HakoChapterRef> chapters;
  std::string trackedSeriesId;
  std::string preferredChapterUrl;
  std::string preferredChapterTitle;
  int preferredChapterIndex = 0;
  int selectedIndex = 0;
  int currentPage = 1;
  int totalPages = 1;
  bool pagedMode = false;
  std::string pageMessage;
  uint32_t pageMessageUntilMs = 0;

  bool loadPage(int page);

 public:
  HakoChapterListActivity(GfxRenderer& renderer, MappedInputManager& mappedInput, CpPluginInfo pluginInfo,
                          std::string bookTitle, std::string bookAuthor, std::vector<HakoChapterRef> chapters, bool selectLatest,
                          std::string trackedSeriesId = {}, std::string seriesUrl = {}, bool pagedMode = false,
                          std::string preferredChapterUrl = {}, std::string preferredChapterTitle = {},
                          int preferredChapterIndex = 0)
      : Activity("HakoChapters", renderer, mappedInput),
        pluginInfo(std::move(pluginInfo)),
        bookTitle(std::move(bookTitle)),
        bookAuthor(std::move(bookAuthor)),
        seriesUrl(std::move(seriesUrl)),
        chapters(std::move(chapters)),
        trackedSeriesId(std::move(trackedSeriesId)),
        preferredChapterUrl(std::move(preferredChapterUrl)),
        preferredChapterTitle(std::move(preferredChapterTitle)),
        preferredChapterIndex(preferredChapterIndex),
        pagedMode(pagedMode) {
    if (selectLatest && !this->chapters.empty()) {
      selectedIndex = static_cast<int>(this->chapters.size()) - 1;
    }
  }

  void onEnter() override;
  void loop() override;
  void render(RenderLock&&) override;
};
