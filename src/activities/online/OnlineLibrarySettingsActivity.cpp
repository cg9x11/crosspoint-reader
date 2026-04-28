#include "OnlineLibrarySettingsActivity.h"

#include <GfxRenderer.h>
#include <I18n.h>

#include "components/UITheme.h"
#include "fontIds.h"

namespace {
constexpr int ITEM_COUNT = 5;

uint32_t clampValue(uint32_t value, uint32_t minValue, uint32_t maxValue) {
  if (value < minValue) return minValue;
  if (value > maxValue) return maxValue;
  return value;
}
}  // namespace

void OnlineLibrarySettingsActivity::saveSettings() {
  ONLINE_LIBRARY_SETTINGS_STORE.set(settings);
  if (ONLINE_LIBRARY_SETTINGS_STORE.saveToDisk()) {
    popupMessage = "Settings saved";
  } else {
    popupMessage = "Failed to save settings";
  }
  popupUntilMs = millis() + 1500;
  requestUpdate();
}

void OnlineLibrarySettingsActivity::adjustSelected(int direction) {
  switch (selectedIndex) {
    case 0:
      settings.maxJobRetries = clampValue(settings.maxJobRetries + direction, 0, 10);
      break;
    case 1:
      settings.jobRetryBaseDelaySec = clampValue(settings.jobRetryBaseDelaySec + direction * 5, 5, 3600);
      break;
    case 2:
      settings.jobRetryBackoffPercent = clampValue(settings.jobRetryBackoffPercent + direction * 25, 100, 1000);
      break;
    case 3:
      settings.chapterRetryCount = clampValue(settings.chapterRetryCount + direction, 0, 10);
      break;
    case 4:
      settings.chapterRetryDelaySec = clampValue(settings.chapterRetryDelaySec + direction * 2, 1, 600);
      break;
    default:
      break;
  }
  saveSettings();
}

std::string OnlineLibrarySettingsActivity::titleForIndex(int index) const {
  switch (index) {
    case 0: return "Max Job Retries";
    case 1: return "Retry Delay";
    case 2: return "Backoff Multiplier";
    case 3: return "Chapter Retries";
    case 4: return "Chapter Retry Delay";
    default: return "";
  }
}

std::string OnlineLibrarySettingsActivity::valueForIndex(int index) const {
  switch (index) {
    case 0: return std::to_string(settings.maxJobRetries) + " attempts";
    case 1: return std::to_string(settings.jobRetryBaseDelaySec) + " sec";
    case 2: return std::to_string(settings.jobRetryBackoffPercent) + "%";
    case 3: return std::to_string(settings.chapterRetryCount) + " attempts";
    case 4: return std::to_string(settings.chapterRetryDelaySec) + " sec";
    default: return "";
  }
}

void OnlineLibrarySettingsActivity::onEnter() {
  Activity::onEnter();
  ONLINE_LIBRARY_SETTINGS_STORE.loadFromDisk();
  settings = ONLINE_LIBRARY_SETTINGS_STORE.get();
  selectedIndex = 0;
  requestUpdate();
}

void OnlineLibrarySettingsActivity::loop() {
  if (!popupMessage.empty() && millis() >= popupUntilMs) {
    popupMessage.clear();
    requestUpdate();
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Back)) {
    finish();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    settings = OnlineLibrarySettings{};
    saveSettings();
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Left)) {
    adjustSelected(-1);
    return;
  }

  if (mappedInput.wasPressed(MappedInputManager::Button::Right)) {
    adjustSelected(1);
    return;
  }

  buttonNavigator.onNext([this] {
    selectedIndex = ButtonNavigator::nextIndex(selectedIndex, ITEM_COUNT);
    requestUpdate();
  });

  buttonNavigator.onPrevious([this] {
    selectedIndex = ButtonNavigator::previousIndex(selectedIndex, ITEM_COUNT);
    requestUpdate();
  });
}

void OnlineLibrarySettingsActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto& metrics = UITheme::getInstance().getMetrics();
  const int pageWidth = renderer.getScreenWidth();
  const int pageHeight = renderer.getScreenHeight();
  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int contentHeight = pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing * 2;

  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, "Online Library Settings");
  GUI.drawList(renderer, Rect{0, contentTop, pageWidth, contentHeight}, ITEM_COUNT, selectedIndex,
               [this](int index) { return titleForIndex(index); },
               [this](int index) { return valueForIndex(index); }, [](int) { return Settings; });

  if (!popupMessage.empty()) {
    GUI.drawPopup(renderer, popupMessage.c_str());
  }

  const auto labels = mappedInput.mapLabels(tr(STR_BACK), "Defaults", "Less", "More");
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);
  renderer.displayBuffer();
}
