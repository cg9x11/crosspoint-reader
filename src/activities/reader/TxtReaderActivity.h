#pragma once

#include <Txt.h>

#include <optional>
#include <vector>

#include "CrossPointSettings.h"
#include "SeriesReadingContext.h"
#include "activities/Activity.h"

class TxtReaderActivity final : public Activity {
  std::unique_ptr<Txt> txt;
  std::optional<SeriesReadingContext> seriesContext;
  bool openAtLastPage = false;

  int currentPage = 0;
  int totalPages = 1;
  int pagesUntilFullRefresh = 0;
  bool consumeLeftRelease = false;
  bool consumeRightRelease = false;
  bool consumePageBackRelease = false;
  bool consumePageForwardRelease = false;
  bool consumeUpRelease = false;
  bool consumeDownRelease = false;

  // Streaming text reader - stores file offsets for each page
  std::vector<size_t> pageOffsets;  // File offset for start of each page
  std::vector<std::string> currentPageLines;
  int linesPerPage = 0;
  int viewportWidth = 0;
  bool initialized = false;

  // Cached settings for cache validation (different fonts/margins require re-indexing)
  int cachedFontId = 0;
  uint8_t cachedScreenMargin = 0;
  uint8_t cachedParagraphAlignment = CrossPointSettings::LEFT_ALIGN;
  int cachedOrientedMarginTop = 0;
  int cachedOrientedMarginRight = 0;
  int cachedOrientedMarginBottom = 0;
  int cachedOrientedMarginLeft = 0;

  void renderPage();
  void renderStatusBar() const;

  void initializeReader();
  bool loadPageAtOffset(size_t offset, std::vector<std::string>& outLines, size_t& nextOffset);
  void buildPageIndex();
  bool loadPageIndexCache();
  void savePageIndexCache() const;
  void persistSeriesReadingState() const;
  int getCurrentSeriesChapterIndex() const;
  bool tryNavigateAdjacentSeriesChapter(int chapterDelta, bool openChapterAtLastPage);
  void openSeriesChapterSelection();
  void saveProgress() const;
  void loadProgress();
  std::string buildPerChapterCachePath(const char* baseName) const;

 public:
  explicit TxtReaderActivity(GfxRenderer& renderer, MappedInputManager& mappedInput, std::unique_ptr<Txt> txt,
                             std::optional<SeriesReadingContext> seriesContext = std::nullopt,
                             bool openAtLastPage = false)
      : Activity("TxtReader", renderer, mappedInput),
        txt(std::move(txt)),
        seriesContext(std::move(seriesContext)),
        openAtLastPage(openAtLastPage) {}
  void onEnter() override;
  void onExit() override;
  void loop() override;
  void render(RenderLock&&) override;
  bool isReaderActivity() const override { return true; }
  ScreenshotInfo getScreenshotInfo() const override;
};
