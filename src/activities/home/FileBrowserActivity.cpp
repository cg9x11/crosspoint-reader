#include "FileBrowserActivity.h"

#include <Bitmap.h>
#include <Epub.h>
#include <FsHelpers.h>
#include <GfxRenderer.h>
#include <HalStorage.h>
#include <I18n.h>
#include <Xtc.h>

#include <algorithm>

#include "../ActivityManager.h"
#include "../util/ConfirmationActivity.h"
#include "CrossPointState.h"
#include "CrossPointSettings.h"
#include "MappedInputManager.h"
#include "SeriesManifest.h"
#include "components/UITheme.h"
#include "fontIds.h"
#include "util/ScreenDebugState.h"

namespace {
constexpr unsigned long GO_HOME_MS = 1000;
constexpr const char* SERIES_VALUE = "SER";
constexpr int PREVIEW_COVER_HEIGHT = 200;
constexpr const char* NO_DESCRIPTION_TEXT = "No description";
constexpr const char* CURRENT_READING_TEXT = "Current";

bool isSeriesChapterFilename(std::string_view filename) {
  if (filename.size() < 8 || filename.rfind("ch_", 0) != 0) {
    return false;
  }
  const size_t extPos = filename.find_last_of('.');
  if (extPos == std::string_view::npos) {
    return false;
  }
  const std::string_view ext = filename.substr(extPos);
  if (ext != ".epub" && ext != ".txt" && ext != ".md") {
    return false;
  }
  for (size_t i = 3; i < extPos; ++i) {
    if (!isdigit(static_cast<unsigned char>(filename[i]))) {
      return false;
    }
  }
  return true;
}

bool containsNonAscii(const char* text) {
  if (!text) {
    return false;
  }
  for (const unsigned char* p = reinterpret_cast<const unsigned char*>(text); *p != 0; ++p) {
    if (*p >= 0x80) {
      return true;
    }
  }
  return false;
}

std::string normalizePreviewText(const std::string& input) {
  std::string output;
  output.reserve(input.size());

  bool inTag = false;
  bool lastWasSpace = false;
  for (unsigned char ch : input) {
    if (ch == '<') {
      inTag = true;
      continue;
    }
    if (inTag) {
      if (ch == '>') {
        inTag = false;
      }
      continue;
    }

    const bool isSpace = isspace(ch) != 0;
    if (isSpace) {
      if (!output.empty() && !lastWasSpace) {
        output.push_back(' ');
      }
      lastWasSpace = true;
      continue;
    }

    output.push_back(static_cast<char>(ch));
    lastWasSpace = false;
  }

  while (!output.empty() && output.back() == ' ') {
    output.pop_back();
  }
  return output;
}

std::string joinPath(std::string base, const std::string& child) {
  if (base.empty()) {
    base = "/";
  }
  if (base.back() != '/') {
    base.push_back('/');
  }
  return base + child;
}

bool looksLikeSeriesDirectory(FsFile& dir) {
  if (!dir || !dir.isDirectory()) {
    return false;
  }

  dir.rewindDirectory();
  char childName[256];
  bool hasManifest = false;
  bool hasSeriesChapter = false;
  for (auto child = dir.openNextFile(); child; child = dir.openNextFile()) {
    child.getName(childName, sizeof(childName));
    if (!hasManifest && strcmp(childName, "_series.json") == 0) {
      hasManifest = true;
    }
    if (!hasSeriesChapter) {
      std::string_view filename{childName};
      hasSeriesChapter = isSeriesChapterFilename(filename);
    }
    if (hasManifest || hasSeriesChapter) {
      dir.rewindDirectory();
      return true;
    }
  }

  dir.rewindDirectory();
  return false;
}

std::string migrateUnicodeSeriesDirectoryName(const std::string& basepath, const std::string& directoryName, FsFile& dir) {
  if (!containsNonAscii(directoryName.c_str()) || !looksLikeSeriesDirectory(dir)) {
    return directoryName;
  }

  const std::string oldPath = joinPath(basepath, directoryName);
  const std::string newDirName = "series_" + std::to_string(std::hash<std::string>{}(directoryName));
  const std::string newPath = joinPath(basepath, newDirName);
  if (Storage.exists(newPath.c_str()) || !Storage.rename(oldPath.c_str(), newPath.c_str())) {
    LOG_ERR("FBA", "Failed to migrate unicode series dir: %s", oldPath.c_str());
    return directoryName;
  }

  LOG_DBG("FBA", "Migrated unicode series dir: %s -> %s", oldPath.c_str(), newPath.c_str());
  return newDirName;
}

std::string getDirectoryTitle(std::string directoryName) {
  if (!directoryName.empty() && directoryName.back() == '/') {
    directoryName.pop_back();
  }
  if (!UITheme::getInstance().getTheme().showsFileIcons()) {
    return "[" + directoryName + "]";
  }
  return directoryName;
}

std::string getFileTitle(const std::string& filename) {
  const auto pos = filename.rfind('.');
  return filename.substr(0, pos);
}

std::string getFileExtension(const std::string& filename) {
  const auto pos = filename.rfind('.');
  return pos == std::string::npos ? "" : filename.substr(pos);
}

bool compareFileBrowserNames(const std::string& str1, const std::string& str2) {
  if (str1.empty() || str2.empty()) {
    return str1 < str2;
  }

  // Directories first
  bool isDir1 = str1.back() == '/';
  bool isDir2 = str2.back() == '/';
  if (isDir1 != isDir2) return isDir1;

  // Start naive natural sort
  const char* s1 = str1.c_str();
  const char* s2 = str2.c_str();

  // Iterate while both strings have characters
  while (*s1 && *s2) {
    const unsigned char uc1 = static_cast<unsigned char>(*s1);
    const unsigned char uc2 = static_cast<unsigned char>(*s2);

    // Check if both are at the start of a number
    if (isdigit(uc1) && isdigit(uc2)) {
      while (*s1 == '0') s1++;
      while (*s2 == '0') s2++;

      int len1 = 0;
      int len2 = 0;
      while (isdigit(static_cast<unsigned char>(s1[len1]))) len1++;
      while (isdigit(static_cast<unsigned char>(s2[len2]))) len2++;

      if (len1 != len2) return len1 < len2;

      for (int i = 0; i < len1; i++) {
        if (s1[i] != s2[i]) return s1[i] < s2[i];
      }

      s1 += len1;
      s2 += len2;
    } else {
      const unsigned char c1 = static_cast<unsigned char>(tolower(uc1));
      const unsigned char c2 = static_cast<unsigned char>(tolower(uc2));
      if (c1 != c2) return c1 < c2;
      s1++;
      s2++;
    }
  }

  return *s1 == '\0' && *s2 != '\0';
}

bool loadEpubForPreview(Epub& epub) {
  if (epub.load(false, true)) {
    return true;
  }
  // Preview should still work for first-time selections that have no cache yet.
  return epub.load(true, true);
}

std::string preparePreviewEpubThumb(Epub& epub, const int thumbHeight) {
  if (epub.generateThumbBmp(thumbHeight)) {
    return epub.getThumbBmpPath(thumbHeight);
  }
  return epub.getThumbBmpPath();
}

std::string preparePreviewXtcThumb(Xtc& xtc, const int thumbHeight) {
  if (xtc.generateThumbBmp(thumbHeight)) {
    return xtc.getThumbBmpPath(thumbHeight);
  }
  return xtc.getThumbBmpPath();
}

std::string resolvePreviewCoverPath(const std::string& coverBmpPath, const int thumbHeight) {
  if (coverBmpPath.empty()) {
    return "";
  }

  const std::string thumbPath = UITheme::getCoverThumbPath(coverBmpPath, thumbHeight);
  if (Storage.exists(thumbPath.c_str())) {
    return thumbPath;
  }
  if (Storage.exists(coverBmpPath.c_str())) {
    return coverBmpPath;
  }
  return "";
}

bool hasPreviewCoverBitmap(const std::string& coverBmpPath, const int thumbHeight) {
  return !resolvePreviewCoverPath(coverBmpPath, thumbHeight).empty();
}

bool hasUsableDownloadedSeriesChapterFile(const std::string& path) {
  if (!Storage.exists(path.c_str())) {
    return false;
  }

  FsFile file;
  if (!Storage.openFileForRead("FBA", path.c_str(), file) || !file || file.isDirectory()) {
    if (file) {
      file.close();
    }
    return false;
  }

  const size_t fileSize = file.size();
  std::string_view filename{path};
  bool usable = false;
  if (FsHelpers::hasEpubExtension(filename)) {
    uint8_t header[2] = {0, 0};
    usable = fileSize >= 256 && file.read(header, sizeof(header)) == static_cast<int>(sizeof(header)) && header[0] == 'P' &&
             header[1] == 'K';
  } else if (FsHelpers::hasTxtExtension(filename) || FsHelpers::hasMarkdownExtension(filename)) {
    usable = fileSize >= 8;
  } else {
    usable = fileSize > 0;
  }

  file.close();
  return usable;
}

size_t countDownloadedSeriesChapters(const std::string& seriesDir) {
  size_t count = 0;
  SeriesManifestStore::forEachChapterInSeriesDir(
      seriesDir,
      [&seriesDir, &count](const SeriesChapter& chapter) {
        if (hasUsableDownloadedSeriesChapterFile(SeriesManifestStore::buildChapterPath(seriesDir, chapter.file))) {
          ++count;
        }
        return true;
      },
      nullptr);
  return count;
}

void drawBitmapCoverFill(GfxRenderer& renderer, const Bitmap& bitmap, const int x, const int y, const int width,
                         const int height) {
  if (bitmap.getWidth() <= 0 || bitmap.getHeight() <= 0 || width <= 0 || height <= 0) {
    return;
  }

  const float bitmapAspect = static_cast<float>(bitmap.getWidth()) / static_cast<float>(bitmap.getHeight());
  const float targetAspect = static_cast<float>(width) / static_cast<float>(height);
  float cropX = 0.0f;
  float cropY = 0.0f;

  if (bitmapAspect > targetAspect) {
    const float targetWidth = static_cast<float>(bitmap.getHeight()) * targetAspect;
    cropX = 1.0f - (targetWidth / static_cast<float>(bitmap.getWidth()));
  } else if (bitmapAspect < targetAspect) {
    const float targetHeight = static_cast<float>(bitmap.getWidth()) / targetAspect;
    cropY = 1.0f - (targetHeight / static_cast<float>(bitmap.getHeight()));
  }

  renderer.drawBitmap(bitmap, x, y, width, height, cropX, cropY);
}
}  // namespace

const RecentBook* FileBrowserActivity::findRecentBookForPath(const std::string& path, const std::string& seriesId) const {
  for (const auto& book : RECENT_BOOKS.getBooks()) {
    if (!seriesId.empty() && book.seriesId == seriesId) {
      return &book;
    }
    if (book.path == path) {
      return &book;
    }
  }
  return nullptr;
}

const FileBrowserActivity::SeriesBrowseCache* FileBrowserActivity::getSeriesBrowseCache(const std::string& seriesDir,
                                                                                        const std::string& recentPath) const {
  auto buildCache = [this, &seriesDir, &recentPath](SeriesBrowseCache& cache) {
    cache = {};
    cache.seriesDir = seriesDir;
    cache.matchedRecentPath = recentPath;

    if (!SeriesManifestStore::loadMetadataFromSeriesDir(seriesDir, cache.manifest) || cache.manifest.seriesId.empty()) {
      return;
    }

    cache.ready = true;
    cache.isSeries = true;
    SeriesManifestStore::forEachChapterInSeriesDir(
        seriesDir,
        [this, &cache, &seriesDir, &recentPath](const SeriesChapter& chapter) {
          ++cache.totalChapters;
          if (!cache.hasFirstChapter) {
            cache.firstChapter = chapter;
            cache.hasFirstChapter = true;
          }

          const std::string chapterPath = SeriesManifestStore::buildChapterPath(seriesDir, chapter.file);
          if (!recentPath.empty() && !cache.hasRecentChapter && chapterPath == recentPath) {
            cache.recentChapter = chapter;
            cache.hasRecentChapter = true;
          }
          if (hasUsableDownloadedSeriesChapterFile(chapterPath)) {
            ++cache.downloadedChapters;
          }
          return true;
        },
        nullptr);
  };

  for (auto& cache : seriesBrowseCache) {
    if (cache.seriesDir != seriesDir) {
      continue;
    }
    if (!cache.ready || (!recentPath.empty() && recentPath != cache.matchedRecentPath && !cache.hasRecentChapter)) {
      buildCache(cache);
    }
    return cache.isSeries && cache.hasFirstChapter ? &cache : nullptr;
  }

  seriesBrowseCache.emplace_back();
  buildCache(seriesBrowseCache.back());
  const SeriesBrowseCache& cache = seriesBrowseCache.back();
  return cache.isSeries && cache.hasFirstChapter ? &cache : nullptr;
}

bool FileBrowserActivity::tryBuildSeriesEntry(const std::string& directoryName, FileBrowserEntry& entry) const {
  const std::string seriesDir = joinPath(basepath, directoryName);
  const SeriesBrowseCache* cache = getSeriesBrowseCache(seriesDir);
  if (!cache) {
    return false;
  }

  const RecentBook* recent = nullptr;
  for (const auto& book : RECENT_BOOKS.getBooks()) {
    if (book.seriesId == cache->manifest.seriesId) {
      recent = &book;
      break;
    }
  }
  if (recent && !recent->path.empty() && !cache->hasRecentChapter) {
    cache = getSeriesBrowseCache(seriesDir, recent->path);
    if (!cache) {
      return false;
    }
  }

  SeriesChapter activeChapter = cache->firstChapter;
  std::string resumePath = SeriesManifestStore::buildChapterPath(cache->manifest.seriesDir, activeChapter.file);
  if (recent && !recent->path.empty() && cache->hasRecentChapter && Storage.exists(recent->path.c_str())) {
    activeChapter = cache->recentChapter;
    resumePath = recent->path;
  }

  if (!Storage.exists(resumePath.c_str())) {
    LOG_ERR("FBA", "Series chapter missing: %s", resumePath.c_str());
    return false;
  }

  entry = {};
  entry.kind = EntryKind::SeriesDirectory;
  entry.rawName = directoryName + "/";
  entry.title = cache->manifest.title.empty() ? getDirectoryTitle(entry.rawName) : cache->manifest.title;
  entry.resumePath = resumePath;
  entry.subtitle = activeChapter.title.empty() ? getFileTitle(activeChapter.file) : activeChapter.title;
  entry.value = std::to_string(cache->downloadedChapters) + "/" + std::to_string(cache->totalChapters);
  entry.seriesContext.seriesId = cache->manifest.seriesId;
  entry.seriesContext.seriesDir = cache->manifest.seriesDir;
  entry.seriesContext.chapterPath = resumePath;
  entry.seriesContext.chapterIndex = activeChapter.chapterIndex;
  return true;
}

bool FileBrowserActivity::isPreviewable(const FileBrowserEntry& entry) const {
  if (entry.kind == EntryKind::SeriesDirectory) {
    return true;
  }
  if (entry.kind != EntryKind::File) {
    return false;
  }

  if (isSeriesChapterFilename(entry.rawName)) {
    SeriesManifest manifest;
    if (SeriesManifestStore::loadMetadataFromSeriesDir(basepath, manifest)) {
      return false;
    }
  }

  std::string_view filename{entry.rawName};
  return FsHelpers::hasEpubExtension(filename) || FsHelpers::hasXtcExtension(filename) ||
         FsHelpers::hasTxtExtension(filename) || FsHelpers::hasMarkdownExtension(filename);
}

std::string FileBrowserActivity::getEntryFullPath(const FileBrowserEntry& entry) const { return joinPath(basepath, entry.rawName); }

void FileBrowserActivity::loadSeriesPreview(const FileBrowserEntry& entry, PreviewData& preview) const {
  const SeriesBrowseCache* cache = getSeriesBrowseCache(entry.seriesContext.seriesDir, entry.resumePath);
  if (!cache) {
    return;
  }
  const SeriesManifest& manifest = cache->manifest;

  preview.available = true;
  preview.title = entry.title;
  preview.author = manifest.author;
  preview.summary = manifest.description.empty() ? NO_DESCRIPTION_TEXT : manifest.description;

  if (!manifest.coverPath.empty()) {
    const std::string manifestCoverPath = SeriesManifestStore::buildChapterPath(manifest.seriesDir, manifest.coverPath);
    if (Storage.exists(manifestCoverPath.c_str()) && FsHelpers::hasBmpExtension(manifestCoverPath)) {
      preview.coverBmpPath = manifestCoverPath;
    }
  }

  const RecentBook* recent = findRecentBookForPath(entry.resumePath, manifest.seriesId);
  if (recent && !recent->coverBmpPath.empty()) {
    preview.coverBmpPath = recent->coverBmpPath;
  }

  if (!hasPreviewCoverBitmap(preview.coverBmpPath, PREVIEW_COVER_HEIGHT)) {
    const std::string seriesCoverPath = SeriesManifestStore::buildChapterPath(manifest.seriesDir, "cover.bmp");
    if (Storage.exists(seriesCoverPath.c_str())) {
      preview.coverBmpPath = seriesCoverPath;
    }
  }

  if (entry.seriesContext.chapterIndex > 0) {
    preview.status = tr(STR_CONTINUE_READING) + std::string(": ") + std::to_string(entry.seriesContext.chapterIndex) +
                     "/" + std::to_string(cache->totalChapters);
  } else {
    preview.status = tr(STR_START_READING);
  }

  if (APP_STATE.openSeriesId == manifest.seriesId && !APP_STATE.openChapterPath.empty()) {
    preview.status = std::string(tr(STR_CONTINUE_READING)) + " (" + CURRENT_READING_TEXT + ")";
  }
}

void FileBrowserActivity::loadFilePreview(const FileBrowserEntry& entry, const std::string& fullPath, PreviewData& preview) const {
  preview.available = true;
  preview.title = entry.title;
  preview.summary = NO_DESCRIPTION_TEXT;

  std::string_view filename{entry.rawName};
  const RecentBook* recent = findRecentBookForPath(fullPath);
  if (recent) {
    if (!recent->title.empty()) {
      preview.title = recent->title;
    }
    preview.author = recent->author;
    preview.coverBmpPath = recent->coverBmpPath;
  }

  if (FsHelpers::hasEpubExtension(filename)) {
    const bool shouldLoadMetadata =
        preview.title == entry.title || preview.author.empty() || !hasPreviewCoverBitmap(preview.coverBmpPath, PREVIEW_COVER_HEIGHT);
    if (shouldLoadMetadata) {
      Epub epub(fullPath, "/.crosspoint");
      if (loadEpubForPreview(epub)) {
        preview.title = epub.getTitle().empty() ? preview.title : epub.getTitle();
        if (preview.author.empty()) {
          preview.author = epub.getAuthor();
        }
        if (!hasPreviewCoverBitmap(preview.coverBmpPath, PREVIEW_COVER_HEIGHT)) {
          preview.coverBmpPath = preparePreviewEpubThumb(epub, PREVIEW_COVER_HEIGHT);
        }
        if (epub.getTocItemsCount() > 0) {
          preview.summary = epub.getTocItem(0).title;
        }
      }
    }
  } else if (FsHelpers::hasXtcExtension(filename)) {
    const bool shouldLoadMetadata =
        preview.title == entry.title || preview.author.empty() || !hasPreviewCoverBitmap(preview.coverBmpPath, PREVIEW_COVER_HEIGHT);
    if (shouldLoadMetadata) {
      Xtc xtc(fullPath, "/.crosspoint");
      if (xtc.load()) {
        preview.title = xtc.getTitle().empty() ? preview.title : xtc.getTitle();
        if (preview.author.empty()) {
          preview.author = xtc.getAuthor();
        }
        if (!hasPreviewCoverBitmap(preview.coverBmpPath, PREVIEW_COVER_HEIGHT)) {
          preview.coverBmpPath = preparePreviewXtcThumb(xtc, PREVIEW_COVER_HEIGHT);
        }
        preview.summary = "XTC";
      }
    }
  } else if (FsHelpers::hasMarkdownExtension(filename)) {
    preview.summary = "Markdown";
  } else {
    preview.summary = "Text";
  }

  if (recent) {
    if (preview.author.empty()) {
      preview.author = recent->author;
    }
    if (preview.coverBmpPath.empty()) {
      preview.coverBmpPath = recent->coverBmpPath;
    }
  }

  if (APP_STATE.openEpubPath == fullPath) {
    preview.status = std::string(tr(STR_CONTINUE_READING)) + " (" + CURRENT_READING_TEXT + ")";
  } else if (recent) {
    preview.status = tr(STR_CONTINUE_READING);
  } else {
    preview.status = tr(STR_START_READING);
  }
}

void FileBrowserActivity::loadPreviewForSelection() {
  currentPreview = {};
  resetPreviewSummaryCache();
  if (files.empty() || selectorIndex >= files.size()) {
    return;
  }

  const FileBrowserEntry& entry = files[selectorIndex];
  if (!isPreviewable(entry)) {
    return;
  }

  currentPreview.key = getEntryFullPath(entry);
  if (entry.kind == EntryKind::SeriesDirectory) {
    loadSeriesPreview(entry, currentPreview);
  } else {
    loadFilePreview(entry, currentPreview.key, currentPreview);
  }
}

void FileBrowserActivity::loadFiles() {
  files.clear();
  seriesBrowseCache.clear();

  auto root = Storage.open(basepath.c_str());
  if (!root || !root.isDirectory()) {
    return;
  }

  root.rewindDirectory();

  struct PendingEntry {
    std::string name;
    bool isDirectory = false;
  };
  std::vector<PendingEntry> pendingEntries;
  char name[500];
  for (auto file = root.openNextFile(); file; file = root.openNextFile()) {
    file.getName(name, sizeof(name));
    if ((!SETTINGS.showHiddenFiles && name[0] == '.') || strcmp(name, "System Volume Information") == 0) {
      file.close();
      continue;
    }

    PendingEntry pending;
    pending.name = name;
    pending.isDirectory = file.isDirectory();
    pendingEntries.push_back(std::move(pending));
    file.close();
  }
  root.close();

  for (const auto& pending : pendingEntries) {
    if (pending.isDirectory) {
      auto dir = Storage.open(joinPath(basepath, pending.name).c_str());
      std::string normalizedDirectoryName = pending.name;
      if (dir && dir.isDirectory()) {
        normalizedDirectoryName = migrateUnicodeSeriesDirectoryName(basepath, pending.name, dir);
        dir.close();
      }

      FileBrowserEntry entry;
      if (tryBuildSeriesEntry(normalizedDirectoryName, entry)) {
        files.push_back(std::move(entry));
        continue;
      }

      entry.rawName = normalizedDirectoryName + "/";
      entry.title = getDirectoryTitle(entry.rawName);
      entry.kind = EntryKind::Directory;
      files.push_back(std::move(entry));
      continue;
    }

    std::string_view filename{pending.name};
    if (mode == Mode::PickFirmware) {
      if (getFileExtension(std::string(filename)) != ".bin") {
        continue;
      }
      FileBrowserEntry entry;
      entry.rawName = std::string(filename);
      entry.title = getFileTitle(entry.rawName);
      entry.value = getFileExtension(entry.rawName);
      entry.kind = EntryKind::File;
      files.push_back(std::move(entry));
      continue;
    }

    if (FsHelpers::hasEpubExtension(filename) || FsHelpers::hasXtcExtension(filename) ||
        FsHelpers::hasTxtExtension(filename) || FsHelpers::hasMarkdownExtension(filename) ||
        FsHelpers::hasBmpExtension(filename)) {
      FileBrowserEntry entry;
      entry.rawName = std::string(filename);
      entry.title = getFileTitle(entry.rawName);
      entry.value = getFileExtension(entry.rawName);
      entry.kind = EntryKind::File;
      files.push_back(std::move(entry));
    }
  }
  std::sort(files.begin(), files.end(),
            [](const FileBrowserEntry& left, const FileBrowserEntry& right) {
              return compareFileBrowserNames(left.rawName, right.rawName);
            });
}

void FileBrowserActivity::onEnter() {
  Activity::onEnter();

  selectorIndex = 0;
  resetPreviewSummaryCache();

  auto root = Storage.open(basepath.c_str());
  if (!root) {
    basepath = "/";
    loadFiles();
  } else if (!root.isDirectory()) {
    lockLongPressBack = mappedInput.isPressed(MappedInputManager::Button::Back);

    const std::string oldPath = basepath;
    basepath = FsHelpers::extractFolderPath(basepath);
    loadFiles();

    const auto pos = oldPath.find_last_of('/');
    const std::string fileName = oldPath.substr(pos + 1);
    selectorIndex = findEntry(fileName);
  } else {
    loadFiles();
  }

  loadPreviewForSelection();
  requestUpdate();
}

void FileBrowserActivity::onExit() {
  Activity::onExit();
  files.clear();
  seriesBrowseCache.clear();
  resetPreviewSummaryCache();
}

void FileBrowserActivity::clearFileMetadata(const std::string& fullPath) {
  // Only clear cache for .epub files
  if (FsHelpers::hasEpubExtension(fullPath)) {
    Epub(fullPath, "/.crosspoint").clearCache();
    LOG_DBG("FileBrowser", "Cleared metadata cache for: %s", fullPath.c_str());
  }
}

void FileBrowserActivity::clearSeriesMetadata(const FileBrowserEntry& entry) {
  RECENT_BOOKS.removeBySeriesId(entry.seriesContext.seriesId);
  RECENT_BOOKS.removeByPathPrefix(entry.seriesContext.seriesDir);

  if ((!entry.seriesContext.seriesId.empty() && APP_STATE.openSeriesId == entry.seriesContext.seriesId) ||
      (!entry.seriesContext.seriesDir.empty() &&
       APP_STATE.openChapterPath.rfind(entry.seriesContext.seriesDir + "/", 0) == 0)) {
    APP_STATE.clearOpenReadingState();
    APP_STATE.saveToFile();
  }
}

bool FileBrowserActivity::deletePathRecursive(const std::string& fullPath) {
  auto file = Storage.open(fullPath.c_str());
  if (!file) {
    return Storage.remove(fullPath.c_str());
  }

  if (!file.isDirectory()) {
    file.close();
    return Storage.remove(fullPath.c_str());
  }

  file.rewindDirectory();
  char childName[256];
  for (auto child = file.openNextFile(); child; child = file.openNextFile()) {
    child.getName(childName, sizeof(childName));
    const std::string childPath = joinPath(fullPath, childName);
    const bool isDir = child.isDirectory();
    child.close();
    if (isDir) {
      if (!deletePathRecursive(childPath)) {
        file.close();
        return false;
      }
    } else if (!Storage.remove(childPath.c_str())) {
      file.close();
      return false;
    }
  }

  file.close();
  return Storage.rmdir(fullPath.c_str());
}

void FileBrowserActivity::openDirectory(const std::string& rawName) {
  basepath = joinPath(basepath, rawName.substr(0, rawName.length() - 1));
  loadFiles();
  selectorIndex = 0;
  resetPreviewSummaryCache();
  loadPreviewForSelection();
  requestUpdate();
}

void FileBrowserActivity::openSeriesChapterList(const FileBrowserEntry& entry) { openDirectory(entry.rawName); }

void FileBrowserActivity::resumeSeriesDirectory(const FileBrowserEntry& entry) {
  if (entry.seriesContext.isValid()) {
    activityManager.goToReader(entry.seriesContext);
    return;
  }
  if (!entry.resumePath.empty()) {
    onSelectBook(entry.resumePath);
    return;
  }
  openSeriesChapterList(entry);
}

void FileBrowserActivity::resetPreviewSummaryCache() {
  previewSummaryScrollOffset = 0;
  previewSummaryTotalLines = 0;
  previewSummaryVisibleLines = 0;
  previewSummaryCacheWidth = 0;
  previewSummaryCacheKey.clear();
  previewSummaryLines.clear();
}

void FileBrowserActivity::ensurePreviewSummaryCache(const PreviewData& preview, const int textWidth) {
  if (textWidth <= 0) {
    previewSummaryLines.clear();
    previewSummaryCacheWidth = 0;
    previewSummaryCacheKey.clear();
    return;
  }

  const std::string cacheKey = preview.key + "|" + preview.summary;
  if (previewSummaryCacheWidth == textWidth && previewSummaryCacheKey == cacheKey && !previewSummaryLines.empty()) {
    return;
  }

  const std::string summaryText = normalizePreviewText(preview.summary);
  previewSummaryLines = renderer.wrappedText(SMALL_FONT_ID, summaryText.c_str(), textWidth, 48);
  previewSummaryCacheWidth = textWidth;
  previewSummaryCacheKey = cacheKey;
}

void FileBrowserActivity::loop() {
  // Long press BACK (1s+) goes to root folder
  // but Long press BACK (1s+) from ReaderActivity sends us here with the MappedInput already set.
  // So ignore it the first time.
  if (mappedInput.isPressed(MappedInputManager::Button::Back) && mappedInput.getHeldTime() >= GO_HOME_MS &&
      basepath != "/" && !lockLongPressBack) {
    basepath = "/";
    loadFiles();
    selectorIndex = 0;
    requestUpdate();
    return;
  }

  if (lockLongPressBack && mappedInput.wasReleased(MappedInputManager::Button::Back)) {
    lockLongPressBack = false;
    return;
  }

  const int pathReserved = renderer.getLineHeight(SMALL_FONT_ID) + UITheme::getInstance().getMetrics().verticalSpacing;
  const int pageItems = UITheme::getNumberOfItemsPerPage(renderer, true, false, true, false, pathReserved);

  if (mappedInput.wasReleased(MappedInputManager::Button::Confirm)) {
    if (files.empty()) return;

    const FileBrowserEntry& entry = files[selectorIndex];
    const bool isLongPress = mappedInput.getHeldTime() >= GO_HOME_MS;
    const std::string fullPath = joinPath(basepath, entry.rawName);

    if (mode == Mode::PickFirmware) {
      if (entry.kind == EntryKind::Directory) {
        openDirectory(entry.rawName);
      } else {
        ActivityResult result;
        result.data = FilePathResult{fullPath};
        setResult(std::move(result));
        finish();
      }
      return;
    }

    if (isLongPress && entry.kind == EntryKind::SeriesDirectory) {
      auto handler = [this, entry, fullPath](const ActivityResult& res) {
        if (res.isCancelled) {
          LOG_DBG("FileBrowser", "Series delete cancelled by user");
          return;
        }

        clearSeriesMetadata(entry);
        if (deletePathRecursive(fullPath)) {
          LOG_DBG("FileBrowser", "Deleted series directory: %s", fullPath.c_str());
          loadFiles();
          if (files.empty()) {
            selectorIndex = 0;
          } else if (selectorIndex >= files.size()) {
            selectorIndex = files.size() - 1;
          }
          loadPreviewForSelection();
          requestUpdate(true);
        } else {
          LOG_ERR("FileBrowser", "Failed to delete series directory: %s", fullPath.c_str());
        }
      };

      std::string heading = tr(STR_DELETE) + std::string("? ");
      startActivityForResult(std::make_unique<ConfirmationActivity>(renderer, mappedInput, heading, entry.title),
                             handler);
      return;
    }

    if (isLongPress && entry.kind == EntryKind::File) {
      // --- LONG PRESS ACTION: DELETE FILE ---
      auto handler = [this, fullPath](const ActivityResult& res) {
        if (!res.isCancelled) {
          LOG_DBG("FileBrowser", "Attempting to delete: %s", fullPath.c_str());
          clearFileMetadata(fullPath);
          const bool deleted = Storage.remove(fullPath.c_str());
          if (deleted) {
            LOG_DBG("FileBrowser", "Deleted successfully");
            loadFiles();
            if (files.empty()) {
              selectorIndex = 0;
            } else if (selectorIndex >= files.size()) {
              // Move selection to the new "last" item
              selectorIndex = files.size() - 1;
            }

            loadPreviewForSelection();
            requestUpdate(true);
          } else {
            LOG_ERR("FileBrowser", "Failed to delete: %s", fullPath.c_str());
          }
        } else {
          LOG_DBG("FileBrowser", "Delete cancelled by user");
        }
      };

      std::string heading = tr(STR_DELETE) + std::string("? ");
      startActivityForResult(std::make_unique<ConfirmationActivity>(renderer, mappedInput, heading, entry.title),
                             handler);
      return;
    }

    // --- SHORT PRESS ACTION: OPEN/NAVIGATE ---
    switch (entry.kind) {
      case EntryKind::Directory:
        openDirectory(entry.rawName);
        break;
      case EntryKind::SeriesDirectory:
        resumeSeriesDirectory(entry);
        break;
      case EntryKind::File:
        onSelectBook(fullPath);
        break;
    }
    return;
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Back)) {
    // Short press: go up one directory, or go home if at root
    if (mappedInput.getHeldTime() < GO_HOME_MS) {
      if (basepath != "/") {
        const std::string oldPath = basepath;

        basepath.replace(basepath.find_last_of('/'), std::string::npos, "");
        if (basepath.empty()) basepath = "/";
        loadFiles();

        const auto pos = oldPath.find_last_of('/');
        const std::string dirName = oldPath.substr(pos + 1) + "/";
        selectorIndex = findEntry(dirName);

        resetPreviewSummaryCache();
        loadPreviewForSelection();
        requestUpdate();
      } else {
        onGoHome();
      }
    }
  }

  int listSize = static_cast<int>(files.size());
  buttonNavigator.onNextRelease([this, listSize] {
    selectorIndex = ButtonNavigator::nextIndex(static_cast<int>(selectorIndex), listSize);
    loadPreviewForSelection();
    requestUpdate();
  });

  buttonNavigator.onPreviousRelease([this, listSize] {
    selectorIndex = ButtonNavigator::previousIndex(static_cast<int>(selectorIndex), listSize);
    loadPreviewForSelection();
    requestUpdate();
  });

  buttonNavigator.onNextContinuous([this, listSize, pageItems] {
    selectorIndex = ButtonNavigator::nextPageIndex(static_cast<int>(selectorIndex), listSize, pageItems);
    loadPreviewForSelection();
    requestUpdate();
  });

  buttonNavigator.onPreviousContinuous([this, listSize, pageItems] {
    selectorIndex = ButtonNavigator::previousPageIndex(static_cast<int>(selectorIndex), listSize, pageItems);
    loadPreviewForSelection();
    requestUpdate();
  });
}

void FileBrowserActivity::drawPreviewPanel(const Rect& rect, const PreviewData& preview) {
  constexpr int panelPadding = 8;
  constexpr int columnGap = 10;

  renderer.fillRect(rect.x, rect.y, rect.width, rect.height, false);
  renderer.drawRect(rect.x, rect.y, rect.width, rect.height, true);

  const int coverHeight = rect.height - panelPadding * 2;
  const int idealCoverWidth = (coverHeight * 2) / 3;
  const int coverWidth = std::min((rect.width * 36) / 100, idealCoverWidth);
  const int coverX = rect.x + panelPadding;
  const int coverY = rect.y + panelPadding;
  const int dividerX = coverX + coverWidth + panelPadding;

  renderer.drawLine(dividerX, rect.y + 1, dividerX, rect.y + rect.height - 2, 1, true);

  bool coverDrawn = false;
  if (!preview.coverBmpPath.empty()) {
    const std::string coverPath = resolvePreviewCoverPath(preview.coverBmpPath, PREVIEW_COVER_HEIGHT);
    FsFile file;
    if (!coverPath.empty() && Storage.openFileForRead("FBA", coverPath, file)) {
      Bitmap bitmap(file);
      if (bitmap.parseHeaders() == BmpReaderError::Ok) {
        drawBitmapCoverFill(renderer, bitmap, coverX, coverY, coverWidth, coverHeight);
        coverDrawn = true;
      }
      file.close();
    }
  }
  if (!coverDrawn) {
    const char* noCoverText = "No cover";
    const int noCoverWidth = renderer.getTextWidth(UI_10_FONT_ID, noCoverText);
    const int noCoverX = coverX + std::max(0, (coverWidth - noCoverWidth) / 2);
    renderer.drawText(UI_10_FONT_ID, noCoverX,
                      coverY + coverHeight / 2 - renderer.getLineHeight(UI_10_FONT_ID) / 2, noCoverText, true);
  }

  const int textX = dividerX + columnGap;
  const int textWidth = rect.x + rect.width - panelPadding - textX;
  int textY = rect.y + panelPadding;

  auto titleLines = renderer.wrappedText(UI_12_FONT_ID, preview.title.c_str(), textWidth, 2, EpdFontFamily::BOLD);
  for (const auto& line : titleLines) {
    renderer.drawText(UI_12_FONT_ID, textX, textY, line.c_str(), true, EpdFontFamily::BOLD);
    textY += renderer.getLineHeight(UI_12_FONT_ID);
  }

  if (!preview.author.empty()) {
    textY += 2;
    std::string author = renderer.truncatedText(UI_10_FONT_ID, preview.author.c_str(), textWidth);
    renderer.drawText(UI_10_FONT_ID, textX, textY, author.c_str(), true);
    textY += renderer.getLineHeight(UI_10_FONT_ID) + 6;
  }

  if (!preview.status.empty()) {
    const std::string meta = renderer.truncatedText(SMALL_FONT_ID, preview.status.c_str(), textWidth);
    renderer.drawText(SMALL_FONT_ID, textX, textY, meta.c_str(), true);
    textY += renderer.getLineHeight(SMALL_FONT_ID) + 8;
    renderer.drawLine(textX, textY - 4, textX + textWidth, textY - 4, true);
  }

  renderer.drawText(UI_10_FONT_ID, textX, textY, "Summary", true, EpdFontFamily::BOLD);
  textY += renderer.getLineHeight(UI_10_FONT_ID) + 4;

  const int availableHeight = rect.y + rect.height - panelPadding - textY;
  const int maxSummaryLines = std::max(0, std::min(7, availableHeight / renderer.getLineHeight(SMALL_FONT_ID)));
  previewSummaryVisibleLines = maxSummaryLines;
  previewSummaryTotalLines = 0;
  if (maxSummaryLines <= 0) {
    return;
  }

  ensurePreviewSummaryCache(preview, textWidth);
  previewSummaryTotalLines = static_cast<int>(previewSummaryLines.size());
  const size_t startIndex = std::min(static_cast<size_t>(previewSummaryScrollOffset), previewSummaryLines.size());
  const size_t endIndex = std::min(startIndex + static_cast<size_t>(maxSummaryLines), previewSummaryLines.size());
  for (size_t i = startIndex; i < endIndex; ++i) {
    renderer.drawText(SMALL_FONT_ID, textX, textY, previewSummaryLines[i].c_str(), true);
    textY += renderer.getLineHeight(SMALL_FONT_ID);
  }

}

void FileBrowserActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto pageWidth = renderer.getScreenWidth();
  const auto pageHeight = renderer.getScreenHeight();
  const auto& metrics = UITheme::getInstance().getMetrics();

  std::string folderName = (basepath == "/") ? tr(STR_SD_CARD) : basepath.substr(basepath.rfind('/') + 1);
  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, folderName.c_str());

  const int pathLineHeight = renderer.getLineHeight(SMALL_FONT_ID);
  const int pathReserved = pathLineHeight + metrics.verticalSpacing;
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int contentHeight = pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing - pathReserved;
  const bool showPreview = currentPreview.available;
  const int previewSpacing = showPreview ? std::max(2, metrics.verticalSpacing / 2) : 0;
  const int previewHeight = showPreview ? std::min(210, (contentHeight * 11) / 20) : 0;
  const int listHeight = showPreview ? (contentHeight - previewHeight - previewSpacing) : contentHeight;
  if (files.empty()) {
    renderer.drawText(UI_10_FONT_ID, metrics.contentSidePadding, contentTop + 20, tr(STR_NO_FILES_FOUND));
  } else {
    GUI.drawList(
        renderer, Rect{0, contentTop, pageWidth, listHeight}, files.size(), selectorIndex,
        [this](int index) { return files[index].title; },
        [this](int index) { return files[index].subtitle; },
        [this](int index) { return files[index].kind == EntryKind::SeriesDirectory ? UIIcon::Book : UITheme::getFileIcon(files[index].rawName); },
        [this](int index) { return files[index].value; }, false);
  }

  if (showPreview) {
    drawPreviewPanel(Rect{0, contentTop + listHeight + previewSpacing, pageWidth, previewHeight},
                     currentPreview);

    const std::string previewSecondary =
        currentPreview.status.empty()
            ? currentPreview.author
            : (currentPreview.author.empty() ? currentPreview.status : currentPreview.author + " | " + currentPreview.status);
    SCREEN_DEBUG.setBodyText(currentPreview.title.c_str(), previewSecondary.c_str(), currentPreview.summary.c_str());
  }

  // Full path display
  {
    const int pathY = pageHeight - metrics.buttonHintsHeight - metrics.verticalSpacing - pathLineHeight;
    const int separatorY = pathY - metrics.verticalSpacing / 2;
    renderer.drawLine(0, separatorY, pageWidth - 1, separatorY, 3, true);
    const int pathMaxWidth = pageWidth - metrics.contentSidePadding * 2;
    // Left-truncate so the deepest directory is always visible
    const char* pathStr = basepath.c_str();
    const char* pathDisplay = pathStr;
    char leftTruncBuf[256];
    if (renderer.getTextWidth(SMALL_FONT_ID, pathStr) > pathMaxWidth) {
      const char ellipsis[] = "\xe2\x80\xa6";  // UTF-8 ellipsis (…)
      const int ellipsisWidth = renderer.getTextWidth(SMALL_FONT_ID, ellipsis);
      const int available = pathMaxWidth - ellipsisWidth;
      // Walk forward from the start until the suffix fits, skipping UTF-8 continuation bytes
      const char* p = pathStr;
      while (*p) {
        if (renderer.getTextWidth(SMALL_FONT_ID, p) <= available) break;
        ++p;
        while (*p && (static_cast<unsigned char>(*p) & 0xC0) == 0x80) ++p;
      }
      snprintf(leftTruncBuf, sizeof(leftTruncBuf), "%s%s", ellipsis, p);
      pathDisplay = leftTruncBuf;
    }
    renderer.drawText(SMALL_FONT_ID, metrics.contentSidePadding, pathY, pathDisplay);
  }

  // Help text
  const auto labels =
      mappedInput.mapLabels(basepath == "/" ? tr(STR_HOME) : tr(STR_BACK), files.empty() ? "" : tr(STR_OPEN),
                            files.empty() ? "" : tr(STR_DIR_UP), files.empty() ? "" : tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);

  renderer.displayBuffer();
}

size_t FileBrowserActivity::findEntry(const std::string& name) const {
  for (size_t i = 0; i < files.size(); i++)
    if (files[i].rawName == name) return i;
  return 0;
}
