#pragma once

#include <cstdint>
#include <string>
#include <vector>

struct HakoSearchResult {
  std::string title;
  std::string url;
  std::string description;
  std::string coverUrl;
  std::string homeSectionLabel;
  std::string homeVolumeTitle;
  std::string homeLatestChapterTitle;
  std::string homeDisplaySubtitle;
};

struct HakoBookDetail {
  std::string title;
  std::string url;
  std::string author;
  std::string coverUrl;
  std::string descriptionHtml;
  std::string latestChapterTitle;
  std::string latestChapterUrl;
  std::vector<std::string> genres;
  bool ongoing = false;
};

struct HakoChapterRef {
  std::string title;
  std::string url;
  std::string sectionTitle;
  uint32_t index = 0;
};

struct HakoChapterContent {
  HakoChapterRef ref;
  std::string html;
  std::string text;
  std::string textFilePath;
};

class HakoPluginExecutor {
 public:
  static constexpr const char* BASE_URL = "https://docln.sbs";

  static bool fetchHomeFeed(std::vector<HakoSearchResult>& outResults);
  static bool search(const std::string& query, int page, std::vector<HakoSearchResult>& outResults);
  static bool fetchDetail(const std::string& url, HakoBookDetail& outDetail);
  static bool fetchToc(const std::string& url, std::vector<HakoChapterRef>& outToc);
  static bool fetchChapter(const HakoChapterRef& ref, HakoChapterContent& outContent, bool includePlainText = true);
  static void clearMemoryCaches();
};
