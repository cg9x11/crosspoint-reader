#pragma once
#include <cstdint>
#include <string>
#include <vector>

enum class RecentBookKind : uint8_t { LocalFile = 0, OnlineSource = 1 };

struct RecentBook {
  std::string path;
  std::string title;
  std::string author;
  std::string coverBmpPath;
  uint8_t progressPercent = 0;
  uint32_t readingTimeSeconds = 0;
  RecentBookKind kind = RecentBookKind::LocalFile;
  std::string pluginId;
  std::string runtimeProfile;
  std::string seriesUrl;
  std::string coverUrl;
  std::string chapterUrl;
  std::string chapterTitle;
  uint32_t lastReadPage = 0;
  uint32_t lastReadPageCount = 0;

  bool operator==(const RecentBook& other) const { return path == other.path; }
  bool isOnlineSource() const { return kind == RecentBookKind::OnlineSource; }
  bool isLocalFile() const { return kind == RecentBookKind::LocalFile; }
};

class RecentBooksStore;
namespace JsonSettingsIO {
bool loadRecentBooks(RecentBooksStore& store, const char* json);
}  // namespace JsonSettingsIO

class RecentBooksStore {
  // Static instance
  static RecentBooksStore instance;

  std::vector<RecentBook> recentBooks;

  friend bool JsonSettingsIO::loadRecentBooks(RecentBooksStore&, const char*);

 public:
  ~RecentBooksStore() = default;

  // Get singleton instance
  static RecentBooksStore& getInstance() { return instance; }

  // Add a book to the recent list (moves to front if already exists)
  void addBook(const std::string& path, const std::string& title, const std::string& author,
               const std::string& coverBmpPath);

  void updateBook(const std::string& path, const std::string& title, const std::string& author,
                  const std::string& coverBmpPath);
  void addOrUpdateOnlineBook(const std::string& pluginId, const std::string& runtimeProfile,
                             const std::string& seriesUrl, const std::string& title, const std::string& author,
                             const std::string& coverUrl, const std::string& chapterUrl = {},
                             const std::string& chapterTitle = {}, uint32_t lastReadPage = 0,
                             uint32_t lastReadPageCount = 0, bool moveToFront = true, bool persist = true);

  void startReadingSession(const std::string& path);
  void finishReadingSession(const std::string& path);
  void updateReadingProgress(const std::string& path, uint8_t progressPercent, bool persist = false);

  // Get the list of recent books (most recent first)
  const std::vector<RecentBook>& getBooks() const { return recentBooks; }

  // Get the count of recent books
  int getCount() const { return static_cast<int>(recentBooks.size()); }

  bool saveToFile() const;
  static std::string buildOnlinePath(const std::string& pluginId, const std::string& seriesUrl,
                                     const std::string& runtimeProfile = {});

  bool loadFromFile();
  RecentBook getDataFromBook(std::string path) const;

 private:
  RecentBook* findBook(const std::string& path);
  void upsertBook(RecentBook book, bool moveToFront, bool persist);
  bool loadFromBinaryFile();

  std::string activeSessionPath;
  uint32_t activeSessionStartMs = 0;
  bool activeSessionOpen = false;
};

// Helper macro to access recent books store
#define RECENT_BOOKS RecentBooksStore::getInstance()
