#include "RecentBooksStore.h"

#include <Arduino.h>
#include <Epub.h>
#include <FsHelpers.h>
#include <HalStorage.h>
#include <JsonSettingsIO.h>
#include <Logging.h>
#include <Serialization.h>
#include <Xtc.h>

#include <algorithm>

#include "PluginStore.h"

namespace {
constexpr uint8_t RECENT_BOOKS_FILE_VERSION = 3;
constexpr char RECENT_BOOKS_FILE_BIN[] = "/.crosspoint/recent.bin";
constexpr char RECENT_BOOKS_FILE_JSON[] = "/.crosspoint/recent.json";
constexpr char RECENT_BOOKS_FILE_BAK[] = "/.crosspoint/recent.bin.bak";
constexpr int MAX_RECENT_BOOKS = 10;

uint8_t progressPercentFromPageState(const uint32_t lastReadPage, const uint32_t lastReadPageCount) {
  if (lastReadPageCount == 0) {
    return 0;
  }

  const uint32_t clampedPage = std::min(lastReadPage + 1, lastReadPageCount);
  return static_cast<uint8_t>(std::min<uint32_t>(100, (clampedPage * 100U) / lastReadPageCount));
}
}  // namespace

RecentBooksStore RecentBooksStore::instance;

RecentBook* RecentBooksStore::findBook(const std::string& path) {
  auto it =
      std::find_if(recentBooks.begin(), recentBooks.end(), [&](const RecentBook& book) { return book.path == path; });
  return it != recentBooks.end() ? &(*it) : nullptr;
}

void RecentBooksStore::addBook(const std::string& path, const std::string& title, const std::string& author,
                               const std::string& coverBmpPath) {
  RecentBook book;
  book.path = path;
  book.title = title;
  book.author = author;
  book.coverBmpPath = coverBmpPath;
  book.kind = RecentBookKind::LocalFile;
  upsertBook(std::move(book), true, true);
}

void RecentBooksStore::updateBook(const std::string& path, const std::string& title, const std::string& author,
                                  const std::string& coverBmpPath) {
  if (RecentBook* book = findBook(path)) {
    book->title = title;
    book->author = author;
    book->coverBmpPath = coverBmpPath;
    saveToFile();
  }
}

void RecentBooksStore::addOrUpdateOnlineBook(const std::string& pluginId, const std::string& runtimeProfile,
                                             const std::string& seriesUrl, const std::string& title,
                                             const std::string& author, const std::string& coverUrl,
                                             const std::string& chapterUrl, const std::string& chapterTitle,
                                             const uint32_t lastReadPage, const uint32_t lastReadPageCount,
                                             const bool moveToFront, const bool persist) {
  if (pluginId.empty() || seriesUrl.empty()) {
    return;
  }

  RecentBook book;
  book.path = buildOnlinePath(pluginId, seriesUrl, runtimeProfile);
  book.title = title;
  book.author = author;
  book.kind = RecentBookKind::OnlineSource;
  book.pluginId = pluginId;
  book.runtimeProfile = runtimeProfile;
  book.seriesUrl = seriesUrl;
  book.coverUrl = coverUrl;
  book.chapterUrl = chapterUrl;
  book.chapterTitle = chapterTitle;
  book.lastReadPage = lastReadPage;
  book.lastReadPageCount = lastReadPageCount;
  book.progressPercent = progressPercentFromPageState(lastReadPage, lastReadPageCount);
  upsertBook(std::move(book), moveToFront, persist);
}

void RecentBooksStore::startReadingSession(const std::string& path) {
  if (activeSessionOpen) {
    finishReadingSession(activeSessionPath);
  }

  activeSessionPath = path;
  activeSessionStartMs = millis();
  activeSessionOpen = true;
}

void RecentBooksStore::finishReadingSession(const std::string& path) {
  if (!activeSessionOpen || activeSessionPath != path) {
    return;
  }

  if (RecentBook* book = findBook(path)) {
    const uint32_t elapsedMs = millis() - activeSessionStartMs;
    if (elapsedMs > 0) {
      const uint32_t elapsedSeconds = std::max<uint32_t>(1, elapsedMs / 1000);
      book->readingTimeSeconds += elapsedSeconds;
    }
    saveToFile();
  }

  activeSessionPath.clear();
  activeSessionStartMs = 0;
  activeSessionOpen = false;
}

void RecentBooksStore::updateReadingProgress(const std::string& path, uint8_t progressPercent, bool persist) {
  if (RecentBook* book = findBook(path)) {
    if (progressPercent > 100) {
      progressPercent = 100;
    }
    book->progressPercent = progressPercent;
    if (persist) {
      saveToFile();
    }
  }
}

bool RecentBooksStore::saveToFile() const {
  Storage.mkdir("/.crosspoint");
  return JsonSettingsIO::saveRecentBooks(*this, RECENT_BOOKS_FILE_JSON);
}

std::string RecentBooksStore::buildOnlinePath(const std::string& pluginId, const std::string& seriesUrl,
                                              const std::string& runtimeProfile) {
  return std::string("online://") + PluginStore::canonicalizeRuntimeProfile(pluginId, runtimeProfile) + "|" + seriesUrl;
}

RecentBook RecentBooksStore::getDataFromBook(std::string path) const {
  std::string lastBookFileName = "";
  const size_t lastSlash = path.find_last_of('/');
  if (lastSlash != std::string::npos) {
    lastBookFileName = path.substr(lastSlash + 1);
  }

  LOG_DBG("RBS", "Loading recent book: %s", path.c_str());

  // If epub, try to load the metadata for title/author and cover.
  // Use buildIfMissing=false to avoid heavy epub loading on boot; getTitle()/getAuthor() may be
  // blank until the book is opened, and entries with missing title are omitted from recent list.
  if (FsHelpers::hasEpubExtension(lastBookFileName)) {
    Epub epub(path, "/.crosspoint");
    epub.load(false, true);
    return RecentBook{path, epub.getTitle(), epub.getAuthor(), epub.getThumbBmpPath()};
  } else if (FsHelpers::hasXtcExtension(lastBookFileName)) {
    // Handle XTC file
    Xtc xtc(path, "/.crosspoint");
    if (xtc.load()) {
      return RecentBook{path, xtc.getTitle(), xtc.getAuthor(), xtc.getThumbBmpPath()};
    }
  } else if (FsHelpers::hasTxtExtension(lastBookFileName) || FsHelpers::hasMarkdownExtension(lastBookFileName)) {
    return RecentBook{path, lastBookFileName, "", ""};
  }
  return RecentBook{path, "", "", ""};
}

void RecentBooksStore::upsertBook(RecentBook book, const bool moveToFront, const bool persist) {
  auto it =
      std::find_if(recentBooks.begin(), recentBooks.end(), [&](const RecentBook& existing) { return existing.path == book.path; });

  if (it != recentBooks.end()) {
    const bool hasNewPageState = book.lastReadPageCount > 0;
    if (book.title.empty()) book.title = it->title;
    if (book.author.empty()) book.author = it->author;
    if (book.coverBmpPath.empty()) book.coverBmpPath = it->coverBmpPath;
    if (book.coverUrl.empty()) book.coverUrl = it->coverUrl;
    if (book.chapterUrl.empty()) book.chapterUrl = it->chapterUrl;
    if (book.chapterTitle.empty()) book.chapterTitle = it->chapterTitle;
    if (book.runtimeProfile.empty()) book.runtimeProfile = it->runtimeProfile;
    if (book.pluginId.empty()) book.pluginId = it->pluginId;
    if (book.seriesUrl.empty()) book.seriesUrl = it->seriesUrl;
    if (!hasNewPageState) {
      book.lastReadPageCount = it->lastReadPageCount;
      book.lastReadPage = it->lastReadPage;
    }
    if (book.progressPercent == 0 && it->progressPercent > 0) book.progressPercent = it->progressPercent;
    if (book.kind == RecentBookKind::LocalFile && it->kind == RecentBookKind::OnlineSource) {
      book.kind = it->kind;
    }
    book.readingTimeSeconds = it->readingTimeSeconds;

    if (!moveToFront) {
      *it = std::move(book);
      if (persist) {
        saveToFile();
      }
      return;
    }

    recentBooks.erase(it);
  }

  recentBooks.insert(recentBooks.begin(), std::move(book));
  if (recentBooks.size() > MAX_RECENT_BOOKS) {
    recentBooks.resize(MAX_RECENT_BOOKS);
  }

  if (persist) {
    saveToFile();
  }
}

bool RecentBooksStore::loadFromFile() {
  // Try JSON first
  if (Storage.exists(RECENT_BOOKS_FILE_JSON)) {
    String json = Storage.readFile(RECENT_BOOKS_FILE_JSON);
    if (!json.isEmpty()) {
      return JsonSettingsIO::loadRecentBooks(*this, json.c_str());
    }
  }

  // Fall back to binary migration
  if (Storage.exists(RECENT_BOOKS_FILE_BIN)) {
    if (loadFromBinaryFile()) {
      saveToFile();
      Storage.rename(RECENT_BOOKS_FILE_BIN, RECENT_BOOKS_FILE_BAK);
      LOG_DBG("RBS", "Migrated recent.bin to recent.json");
      return true;
    }
  }

  return false;
}

bool RecentBooksStore::loadFromBinaryFile() {
  FsFile inputFile;
  if (!Storage.openFileForRead("RBS", RECENT_BOOKS_FILE_BIN, inputFile)) {
    return false;
  }

  uint8_t version;
  serialization::readPod(inputFile, version);
  if (version == 1 || version == 2) {
    // Old version, just read paths
    uint8_t count;
    serialization::readPod(inputFile, count);
    recentBooks.clear();
    recentBooks.reserve(count);
    for (uint8_t i = 0; i < count; i++) {
      std::string path;
      serialization::readString(inputFile, path);

      // load book to get missing data
      RecentBook book = getDataFromBook(path);
      if (book.title.empty() && book.author.empty() && version == 2) {
        // Fall back to loading what we can from the store
        std::string title, author;
        serialization::readString(inputFile, title);
        serialization::readString(inputFile, author);
        recentBooks.push_back({path, title, author, ""});
      } else {
        recentBooks.push_back(book);
      }
    }
  } else if (version == 3) {
    uint8_t count;
    serialization::readPod(inputFile, count);

    recentBooks.clear();
    recentBooks.reserve(count);
    uint8_t omitted = 0;

    for (uint8_t i = 0; i < count; i++) {
      std::string path, title, author, coverBmpPath;
      serialization::readString(inputFile, path);
      serialization::readString(inputFile, title);
      serialization::readString(inputFile, author);
      serialization::readString(inputFile, coverBmpPath);

      // Omit books with missing title (e.g. saved before metadata was available)
      if (title.empty()) {
        omitted++;
        continue;
      }

      recentBooks.push_back({path, title, author, coverBmpPath});
    }

    if (omitted > 0) {
      // Explicitly close() file before saveToFile() rewrites the same file
      inputFile.close();
      saveToFile();
      LOG_DBG("RBS", "Omitted %u recent book(s) with missing title", omitted);
      return true;
    }
  } else {
    LOG_ERR("RBS", "Deserialization failed: Unknown version %u", version);
    return false;
  }

  LOG_DBG("RBS", "Recent books loaded from binary file (%d entries)", static_cast<int>(recentBooks.size()));
  return true;
}
