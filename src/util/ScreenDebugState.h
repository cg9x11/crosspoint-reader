#pragma once

#include <mutex>
#include <string>
#include <vector>

struct ScreenDebugListItem {
  std::string title;
  std::string subtitle;
  std::string value;
};

struct ScreenDebugList {
  int itemCount = 0;
  int selectedIndex = -1;
  int selectedVisibleIndex = -1;
  std::string selectedTitle;
  std::string selectedSubtitle;
  std::string selectedValue;
  std::vector<ScreenDebugListItem> visibleItems;
};

struct ScreenDebugButtonMenu {
  int selectedIndex = -1;
  std::string selectedLabel;
  std::vector<std::string> labels;
};

struct ScreenDebugButtonHints {
  std::string btn1;
  std::string btn2;
  std::string btn3;
  std::string btn4;
};

struct ScreenDebugDiagnostics {
  bool trackedSeriesLoaded = false;
  size_t trackedSeriesCount = 0;
  size_t totalJobCount = 0;
  size_t activeJobCount = 0;
  size_t coverCacheFileCount = 0;
  std::string summary;
};

struct ScreenDebugSnapshot {
  std::string activityName;
  std::string headerTitle;
  std::string headerSubtitle;
  std::string subHeaderLabel;
  std::string subHeaderRightLabel;
  std::string bodyPrimaryText;
  std::string bodySecondaryText;
  std::string bodyTertiaryText;
  ScreenDebugList list;
  ScreenDebugButtonMenu buttonMenu;
  ScreenDebugButtonHints buttonHints;
  ScreenDebugDiagnostics diagnostics;
  std::string popupMessage;
};

class ScreenDebugState {
 public:
  void beginFrame(const std::string& activityName);
  void presentFrame();
  void setHeader(const char* title, const char* subtitle);
  void setSubHeader(const char* label, const char* rightLabel);
  void setBodyText(const char* primary, const char* secondary = nullptr, const char* tertiary = nullptr);
  void setList(int itemCount, int selectedIndex, int selectedVisibleIndex, const char* selectedTitle,
               const char* selectedSubtitle, const char* selectedValue,
               const std::vector<ScreenDebugListItem>& visibleItems);
  void setButtonMenu(int selectedIndex, const char* selectedLabel, const std::vector<std::string>& labels);
  void setButtonHints(const char* btn1, const char* btn2, const char* btn3, const char* btn4);
  void setPopup(const char* message);
  ScreenDebugSnapshot getSnapshot() const;

 private:
  static std::string safeText(const char* text);

  mutable std::mutex mutex_;
  ScreenDebugSnapshot workingSnapshot_;
  ScreenDebugSnapshot presentedSnapshot_;
  bool hasPresentedSnapshot_ = false;
};

extern ScreenDebugState SCREEN_DEBUG;
