#pragma once

#include <string>
#include <vector>

#include "SeriesManifest.h"
#include "activities/Activity.h"
#include "util/ButtonNavigator.h"

class SeriesChapterSelectionActivity final : public Activity {
  std::string seriesDir;
  std::string seriesTitle;
  std::vector<int> chapterOrder;
  std::vector<SeriesChapter> visibleChapters;
  std::vector<bool> visibleAvailability;
  ButtonNavigator buttonNavigator;
  int selectorIndex = 0;
  int currentChapterIndex = 0;
  int totalItems = 0;
  int pageStartIndex = 0;

  int getPageItems() const;
  int getTotalItems() const;
  bool loadMetadata();
  bool locateCurrentSelection();
  bool loadVisiblePage();
  bool isVisibleChapterAvailable(int localIndex) const;

 public:
  explicit SeriesChapterSelectionActivity(GfxRenderer& renderer, MappedInputManager& mappedInput,
                                          std::string seriesDir, int currentChapterIndex)
      : Activity("SeriesChapterSelection", renderer, mappedInput),
        seriesDir(std::move(seriesDir)),
        currentChapterIndex(currentChapterIndex) {}

  void onEnter() override;
  void onExit() override;
  void loop() override;
  void render(RenderLock&&) override;
  bool isReaderActivity() const override { return true; }
};
