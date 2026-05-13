#pragma once

#include <functional>
#include <string>
#include <vector>

#include <Bitmap.h>

#include "../Activity.h"
#include "SeriesManifest.h"
#include "RecentBooksStore.h"
#include "SeriesReadingContext.h"
#include "util/ButtonNavigator.h"

struct Rect;

class FileBrowserActivity final : public Activity {
 public:
  // Books = standard reader browser; PickFirmware = filter to .bin only and return path via ActivityResult.
  enum class Mode { Books, PickFirmware };

 private:
  enum class EntryKind { Directory, SeriesDirectory, File };

  struct FileBrowserEntry {
    std::string rawName;
    std::string title;
    std::string subtitle;
    std::string value;
    EntryKind kind = EntryKind::File;
    std::string resumePath;
    SeriesReadingContext seriesContext;
  };

  struct PreviewData {
    bool available = false;
    std::string key;
    std::string title;
    std::string author;
    std::string summary;
    std::string status;
    std::string coverBmpPath;
  };

  struct SeriesBrowseCache {
    std::string seriesDir;
    std::string matchedRecentPath;
    bool ready = false;
    bool isSeries = false;
    size_t totalChapters = 0;
    size_t downloadedChapters = 0;
    bool hasFirstChapter = false;
    bool hasRecentChapter = false;
    bool hasFirstDownloadedChapter = false;
    SeriesChapter firstChapter;
    SeriesChapter recentChapter;
    SeriesChapter firstDownloadedChapter;
    SeriesManifest manifest;
  };

  // Deletion
  void clearFileMetadata(const std::string& fullPath);
  void clearSeriesMetadata(const FileBrowserEntry& entry);
  bool deletePathRecursive(const std::string& fullPath);
  bool tryBuildSeriesEntry(const std::string& directoryName, FileBrowserEntry& entry) const;
  const SeriesBrowseCache* getSeriesBrowseCache(const std::string& seriesDir,
                                                const std::string& recentPath = "") const;
  bool isPreviewable(const FileBrowserEntry& entry) const;
  std::string getEntryFullPath(const FileBrowserEntry& entry) const;
  void loadPreviewForSelection();
  void loadSeriesPreview(const FileBrowserEntry& entry, PreviewData& preview) const;
  void loadFilePreview(const FileBrowserEntry& entry, const std::string& fullPath, PreviewData& preview) const;
  void drawPreviewPanel(const Rect& rect, const PreviewData& preview);
  const RecentBook* findRecentBookForPath(const std::string& path, const std::string& seriesId = "") const;
  void openDirectory(const std::string& rawName);
  void openSeriesChapterList(const FileBrowserEntry& entry);
  void resumeSeriesDirectory(const FileBrowserEntry& entry);

  ButtonNavigator buttonNavigator;

  size_t selectorIndex = 0;

  bool lockLongPressBack = false;
  // True when this activity was entered while Confirm was already held; we must swallow the next
  // release so we don't immediately auto-open the first entry.
  bool lockNextConfirmRelease = false;

  Mode mode = Mode::Books;

  // Files state
  std::string basepath = "/";
  std::vector<FileBrowserEntry> files;
  bool currentDirectoryIsSeries = false;
  mutable std::vector<SeriesBrowseCache> seriesBrowseCache;
  PreviewData currentPreview;
  int previewSummaryScrollOffset = 0;
  int previewSummaryTotalLines = 0;
  int previewSummaryVisibleLines = 0;
  int previewSummaryCacheWidth = 0;
  std::string previewSummaryCacheKey;
  std::vector<std::string> previewSummaryLines;

  // Data loading
  void loadFiles();
  size_t findEntry(const std::string& name) const;
  void resetPreviewSummaryCache();
  void ensurePreviewSummaryCache(const PreviewData& preview, int textWidth);

 public:
  explicit FileBrowserActivity(GfxRenderer& renderer, MappedInputManager& mappedInput, std::string initialPath = "/",
                               Mode mode = Mode::Books)
      : Activity("FileBrowser", renderer, mappedInput),
        mode(mode),
        basepath(initialPath.empty() ? "/" : std::move(initialPath)) {}
  void onEnter() override;
  void onExit() override;
  void loop() override;
  void render(RenderLock&&) override;
};
