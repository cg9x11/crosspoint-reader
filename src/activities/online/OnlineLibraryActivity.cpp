#include "OnlineLibraryActivity.h"

#include <GfxRenderer.h>
#include <I18n.h>

#include "DownloadsActivity.h"
#include "OnlineLibrarySettingsActivity.h"
#include "OnlineSourceListActivity.h"
#include "PluginRegistryActivity.h"
#include "TrackedSeriesActivity.h"
#include "components/UITheme.h"

namespace {
constexpr int MENU_ITEM_COUNT = 5;
const char* const MENU_LABELS[MENU_ITEM_COUNT] = {"Sources", "Downloads", "Story Library", "Plugins", "Settings"};
const UIIcon MENU_ICONS[MENU_ITEM_COUNT] = {Library, Recent, Library, Settings, Settings};
}  // namespace

void OnlineLibraryActivity::onEnter() {
  Activity::onEnter();
  selectedIndex = 0;
  requestUpdate();
}

void OnlineLibraryActivity::loop() {
  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    finish();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    if (selectedIndex == 0) {
      activityManager.pushActivity(std::make_unique<OnlineSourceListActivity>(renderer, mappedInput));
    } else if (selectedIndex == 1) {
      activityManager.pushActivity(std::make_unique<DownloadsActivity>(renderer, mappedInput));
    } else if (selectedIndex == 2) {
      activityManager.pushActivity(std::make_unique<TrackedSeriesActivity>(renderer, mappedInput));
    } else if (selectedIndex == 3) {
      activityManager.pushActivity(std::make_unique<PluginRegistryActivity>(renderer, mappedInput));
    } else {
      activityManager.pushActivity(std::make_unique<OnlineLibrarySettingsActivity>(renderer, mappedInput));
    }
    return;
  }

  buttonNavigator.onNext([this] {
    selectedIndex = ButtonNavigator::nextIndex(selectedIndex, MENU_ITEM_COUNT);
    requestUpdate();
  });

  buttonNavigator.onPrevious([this] {
    selectedIndex = ButtonNavigator::previousIndex(selectedIndex, MENU_ITEM_COUNT);
    requestUpdate();
  });
}

void OnlineLibraryActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int contentHeight = pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2;

  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, "Online Library");
  GUI.drawList(renderer, Rect{0, contentTop, pageWidth, contentHeight}, MENU_ITEM_COUNT, selectedIndex,
               [](int index) { return std::string(MENU_LABELS[index]); }, nullptr,
               [](int index) { return MENU_ICONS[index]; });

  const auto labels = mappedInput.mapLabels(tr(STR_BACK), tr(STR_SELECT), tr(STR_DIR_UP), tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
