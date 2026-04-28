#include "ScreenDebugState.h"

#include "RuntimeDebugMetrics.h"

ScreenDebugState SCREEN_DEBUG;

void ScreenDebugState::beginFrame(const std::string& activityName) {
  std::lock_guard<std::mutex> lock(mutex_);
  workingSnapshot_ = ScreenDebugSnapshot{};
  workingSnapshot_.activityName = activityName;
  const auto metrics = RuntimeDebugMetrics::capture();
  workingSnapshot_.diagnostics.trackedSeriesLoaded = metrics.trackedSeriesLoaded;
  workingSnapshot_.diagnostics.trackedSeriesCount = metrics.trackedSeriesCount;
  workingSnapshot_.diagnostics.totalJobCount = metrics.totalJobCount;
  workingSnapshot_.diagnostics.activeJobCount = metrics.activeJobCount;
  workingSnapshot_.diagnostics.coverCacheFileCount = metrics.coverCacheFileCount;
  workingSnapshot_.diagnostics.summary = RuntimeDebugMetrics::summaryLine(metrics);
}

void ScreenDebugState::presentFrame() {
  std::lock_guard<std::mutex> lock(mutex_);
  presentedSnapshot_ = workingSnapshot_;
  hasPresentedSnapshot_ = true;
}

void ScreenDebugState::setHeader(const char* title, const char* subtitle) {
  std::lock_guard<std::mutex> lock(mutex_);
  workingSnapshot_.headerTitle = safeText(title);
  workingSnapshot_.headerSubtitle = safeText(subtitle);
}

void ScreenDebugState::setSubHeader(const char* label, const char* rightLabel) {
  std::lock_guard<std::mutex> lock(mutex_);
  workingSnapshot_.subHeaderLabel = safeText(label);
  workingSnapshot_.subHeaderRightLabel = safeText(rightLabel);
}

void ScreenDebugState::setBodyText(const char* primary, const char* secondary, const char* tertiary) {
  std::lock_guard<std::mutex> lock(mutex_);
  workingSnapshot_.bodyPrimaryText = safeText(primary);
  workingSnapshot_.bodySecondaryText = safeText(secondary);
  workingSnapshot_.bodyTertiaryText = safeText(tertiary);
}

void ScreenDebugState::setList(int itemCount, int selectedIndex, int selectedVisibleIndex, const char* selectedTitle,
                               const char* selectedSubtitle, const char* selectedValue,
                               const std::vector<ScreenDebugListItem>& visibleItems) {
  std::lock_guard<std::mutex> lock(mutex_);
  workingSnapshot_.list.itemCount = itemCount;
  workingSnapshot_.list.selectedIndex = selectedIndex;
  workingSnapshot_.list.selectedVisibleIndex = selectedVisibleIndex;
  workingSnapshot_.list.selectedTitle = safeText(selectedTitle);
  workingSnapshot_.list.selectedSubtitle = safeText(selectedSubtitle);
  workingSnapshot_.list.selectedValue = safeText(selectedValue);
  workingSnapshot_.list.visibleItems = visibleItems;
}

void ScreenDebugState::setButtonMenu(int selectedIndex, const char* selectedLabel,
                                     const std::vector<std::string>& labels) {
  std::lock_guard<std::mutex> lock(mutex_);
  workingSnapshot_.buttonMenu.selectedIndex = selectedIndex;
  workingSnapshot_.buttonMenu.selectedLabel = safeText(selectedLabel);
  workingSnapshot_.buttonMenu.labels = labels;
}

void ScreenDebugState::setButtonHints(const char* btn1, const char* btn2, const char* btn3, const char* btn4) {
  std::lock_guard<std::mutex> lock(mutex_);
  workingSnapshot_.buttonHints.btn1 = safeText(btn1);
  workingSnapshot_.buttonHints.btn2 = safeText(btn2);
  workingSnapshot_.buttonHints.btn3 = safeText(btn3);
  workingSnapshot_.buttonHints.btn4 = safeText(btn4);
}

void ScreenDebugState::setPopup(const char* message) {
  std::lock_guard<std::mutex> lock(mutex_);
  workingSnapshot_.popupMessage = safeText(message);
}

ScreenDebugSnapshot ScreenDebugState::getSnapshot() const {
  std::lock_guard<std::mutex> lock(mutex_);
  return hasPresentedSnapshot_ ? presentedSnapshot_ : workingSnapshot_;
}

std::string ScreenDebugState::safeText(const char* text) { return text ? std::string(text) : std::string{}; }
