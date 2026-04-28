#pragma once

#include <vector>

#include "../../plugins/HakoPluginExecutor.h"
#include "../Activity.h"

class HakoChapterReaderActivity final : public Activity {
  HakoChapterContent chapter;
  std::string trackedSeriesId;
  std::vector<std::string> lines;
  int currentPage = 0;
  int linesPerPage = 1;
  int pagesUntilFullRefresh = 1;

  void paginate();
  void saveReadingProgress() const;
  void restoreReadingProgress();

 public:
  HakoChapterReaderActivity(GfxRenderer& renderer, MappedInputManager& mappedInput, HakoChapterContent chapter,
                            std::string trackedSeriesId = {})
      : Activity("HakoChapterReader", renderer, mappedInput),
        chapter(std::move(chapter)),
        trackedSeriesId(std::move(trackedSeriesId)) {}

  void onEnter() override;
  void onExit() override;
  void loop() override;
  void render(RenderLock&&) override;
  bool isReaderActivity() const override { return true; }
};
