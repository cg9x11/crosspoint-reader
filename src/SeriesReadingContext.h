#pragma once

#include <string>

struct SeriesReadingContext {
  std::string seriesId;
  std::string seriesDir;
  std::string chapterPath;
  int chapterIndex = 0;

  bool isValid() const { return !chapterPath.empty(); }
  bool hasSeriesIdentity() const { return !seriesId.empty() && !seriesDir.empty() && chapterIndex > 0; }
};
