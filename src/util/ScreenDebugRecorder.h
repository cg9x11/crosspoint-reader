#pragma once

#include <functional>
#include <string>
#include <vector>

#include "util/ScreenshotInfo.h"

#if CROSSPOINT_EMULATED
#include <cstdio>

#include <util/ScreenDebugState.h>
#endif

namespace ScreenDebugRecorder {

#if CROSSPOINT_EMULATED

inline void beginFrame(const std::string& activityName) { SCREEN_DEBUG.beginFrame(activityName); }

inline void setHeader(const char* title, const char* subtitle = nullptr) {
  SCREEN_DEBUG.setHeader(title ? title : "", subtitle ? subtitle : "");
}

inline void setSubHeader(const char* label, const char* rightLabel = nullptr) {
  SCREEN_DEBUG.setSubHeader(label ? label : "", rightLabel ? rightLabel : "");
}

inline void setBody(const char* primary, const char* secondary = nullptr, const char* tertiary = nullptr) {
  SCREEN_DEBUG.setBodyText(primary ? primary : "", secondary ? secondary : "", tertiary ? tertiary : "");
}

inline void setPopup(const char* message) { SCREEN_DEBUG.setPopup(message ? message : ""); }

inline void setButtonHints(const char* btn1, const char* btn2, const char* btn3, const char* btn4) {
  SCREEN_DEBUG.setButtonHints(btn1 ? btn1 : "", btn2 ? btn2 : "", btn3 ? btn3 : "", btn4 ? btn4 : "");
}

inline void setButtonMenu(const int buttonCount, const int selectedIndex,
                          const std::function<std::string(int index)>& buttonLabel) {
  std::vector<std::string> labels;
  labels.reserve(buttonCount);
  for (int i = 0; i < buttonCount; ++i) {
    labels.push_back(buttonLabel(i));
  }
  const char* selectedLabel =
      selectedIndex >= 0 && selectedIndex < static_cast<int>(labels.size()) ? labels[selectedIndex].c_str() : nullptr;
  SCREEN_DEBUG.setButtonMenu(selectedIndex, selectedLabel, labels);
}

inline void setList(const int itemCount, const int selectedIndex, const int pageStartIndex, const int pageItems,
                    const std::function<std::string(int index)>& rowTitle,
                    const std::function<std::string(int index)>& rowSubtitle = nullptr,
                    const std::function<std::string(int index)>& rowValue = nullptr) {
  std::vector<ScreenDebugListItem> visibleItems;
  visibleItems.reserve(pageItems > 0 ? pageItems : 0);

  for (int i = pageStartIndex; i < itemCount && i < pageStartIndex + pageItems; ++i) {
    visibleItems.push_back(ScreenDebugListItem{
        rowTitle(i),
        rowSubtitle ? rowSubtitle(i) : std::string{},
        rowValue ? rowValue(i) : std::string{},
    });
  }

  const int selectedVisibleIndex =
      (selectedIndex >= pageStartIndex && selectedIndex < pageStartIndex + pageItems) ? (selectedIndex - pageStartIndex)
                                                                                       : -1;

  const std::string selectedTitle =
      selectedIndex >= 0 && selectedIndex < itemCount ? rowTitle(selectedIndex) : std::string{};
  const std::string selectedSubtitle =
      (rowSubtitle && selectedIndex >= 0 && selectedIndex < itemCount) ? rowSubtitle(selectedIndex) : std::string{};
  const std::string selectedValue =
      (rowValue && selectedIndex >= 0 && selectedIndex < itemCount) ? rowValue(selectedIndex) : std::string{};

  SCREEN_DEBUG.setList(itemCount, selectedIndex, selectedVisibleIndex,
                       selectedTitle.empty() ? nullptr : selectedTitle.c_str(),
                       selectedSubtitle.empty() ? nullptr : selectedSubtitle.c_str(),
                       selectedValue.empty() ? nullptr : selectedValue.c_str(), visibleItems);
}

inline void applyScreenshotInfo(const ScreenshotInfo& info) {
  if (info.readerType == ScreenshotInfo::ReaderType::None) {
    return;
  }

  if (info.title[0] != '\0') {
    SCREEN_DEBUG.setHeaderIfEmpty(info.title);
  }

  if (info.currentPage > 0 && info.totalPages > 0) {
    char progress[32];
    std::snprintf(progress, sizeof(progress), "Page %d/%d", info.currentPage, info.totalPages);
    SCREEN_DEBUG.setSubHeaderIfEmpty(progress, "");
  }
}

#else

inline void beginFrame(const std::string&) {}
inline void setHeader(const char*, const char* = nullptr) {}
inline void setSubHeader(const char*, const char* = nullptr) {}
inline void setBody(const char*, const char* = nullptr, const char* = nullptr) {}
inline void setPopup(const char*) {}
inline void setButtonHints(const char*, const char*, const char*, const char*) {}
inline void setButtonMenu(int, int, const std::function<std::string(int index)>&) {}
inline void setList(int, int, int, int, const std::function<std::string(int index)>&,
                    const std::function<std::string(int index)>& = nullptr,
                    const std::function<std::string(int index)>& = nullptr) {}
inline void applyScreenshotInfo(const ScreenshotInfo&) {}

#endif

}  // namespace ScreenDebugRecorder
