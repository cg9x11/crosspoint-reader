#pragma once

#include <cstdint>
#include <vector>

#include "../../PluginStore.h"
#include "../../plugins/HakoPluginExecutor.h"
#include "../Activity.h"

class HakoChapterReaderActivity final : public Activity {
 public:
  enum class InitialPageMode { RestoreTracked, Start, End };

 private:
  CpPluginInfo pluginInfo;
  HakoChapterContent chapter;
  std::vector<HakoChapterRef> chapters;
  std::string trackedSeriesId;
  std::string seriesTitle;
  std::string seriesAuthor;
  std::string seriesUrl;
  bool pagedTocMode = false;
  int pagedCurrentPage = 1;
  int pagedTotalPages = 1;
  int chapterIndex = -1;
  InitialPageMode initialPageMode = InitialPageMode::RestoreTracked;
  std::string pageCachePath;
  std::vector<uint32_t> pageStartOffsets;
  std::vector<uint16_t> pageLineCounts;
  int currentPage = 0;
  int linesPerPage = 1;
  int pagesUntilFullRefresh = 1;
  bool leftShortPending = false;
  bool leftLongHandled = false;

  void paginate();
  int pageCount() const;
  void saveReadingProgress() const;
  void restoreReadingProgress();
  int currentAbsoluteChapterIndex() const;
  bool canUsePagedTocFallback() const;
  bool hasPreviousChapter() const;
  bool hasNextChapter() const;
  std::string recentBookPath() const;
  std::string resolveRecentCoverUrl() const;
  void syncRecentBook(bool moveToFront, bool persist) const;
  bool openChapterAtIndex(int targetIndex, InitialPageMode targetPageMode);
  bool openChapterAtAbsoluteIndex(int targetAbsoluteIndex, InitialPageMode targetPageMode);
  bool openAdjacentChapter(int delta, InitialPageMode targetPageMode);
  void openChapterList();
  bool loadPagedChapterContext(int targetAbsoluteIndex, std::vector<HakoChapterRef>& outChapters, int& outLocalIndex,
                               int& outPage, int& outTotalPages) const;
  void cleanupTransientFiles();

 public:
  HakoChapterReaderActivity(GfxRenderer& renderer, MappedInputManager& mappedInput, CpPluginInfo pluginInfo,
                            HakoChapterContent chapter, std::vector<HakoChapterRef> chapters = {},
                            int chapterIndex = -1, std::string trackedSeriesId = {}, std::string seriesTitle = {},
                            std::string seriesAuthor = {}, std::string seriesUrl = {}, bool pagedTocMode = false,
                            InitialPageMode initialPageMode = InitialPageMode::RestoreTracked, int pagedCurrentPage = 1,
                            int pagedTotalPages = 1)
      : Activity("HakoChapterReader", renderer, mappedInput),
        pluginInfo(std::move(pluginInfo)),
        chapter(std::move(chapter)),
        chapters(std::move(chapters)),
        chapterIndex(chapterIndex),
        trackedSeriesId(std::move(trackedSeriesId)),
        seriesTitle(std::move(seriesTitle)),
        seriesAuthor(std::move(seriesAuthor)),
        seriesUrl(std::move(seriesUrl)),
        pagedTocMode(pagedTocMode),
        pagedCurrentPage(pagedCurrentPage),
        pagedTotalPages(pagedTotalPages),
        initialPageMode(initialPageMode) {}

  void onEnter() override;
  void onExit() override;
  void loop() override;
  void render(RenderLock&&) override;
  bool isReaderActivity() const override { return true; }
};
