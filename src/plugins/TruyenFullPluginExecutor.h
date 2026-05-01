#pragma once

#include <string>
#include <vector>

#include "HakoPluginExecutor.h"

class TruyenFullPluginExecutor {
 public:
  static constexpr const char* BASE_URL = "https://truyenfull.vision";

  static bool fetchHomeFeed(const std::string& baseUrl, std::vector<HakoSearchResult>& outResults);
  static bool search(const std::string& baseUrl, const std::string& query, int page, std::vector<HakoSearchResult>& outResults);
  static bool fetchDetail(const std::string& baseUrl, const std::string& url, HakoBookDetail& outDetail);
  static bool fetchTocPage(const std::string& baseUrl, const std::string& url, int page, std::vector<HakoChapterRef>& outToc,
                           int& outTotalPages);
  static bool fetchToc(const std::string& baseUrl, const std::string& url, std::vector<HakoChapterRef>& outToc);
  static bool fetchChapter(const std::string& baseUrl, const HakoChapterRef& ref, HakoChapterContent& outContent,
                           bool includePlainText = true);
  static void clearMemoryCaches();
};
