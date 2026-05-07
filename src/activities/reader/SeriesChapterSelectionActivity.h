#pragma once

#include "SeriesManifest.h"
#include "activities/Activity.h"
#include "util/ButtonNavigator.h"

class SeriesChapterSelectionActivity final : public Activity {
  SeriesManifest manifest;
  ButtonNavigator buttonNavigator;
  int selectorIndex = 0;
  int currentChapterIndex = 0;

  int getPageItems() const;
  int getTotalItems() const;

 public:
  explicit SeriesChapterSelectionActivity(GfxRenderer& renderer, MappedInputManager& mappedInput,
                                          SeriesManifest manifest, int currentChapterIndex)
      : Activity("SeriesChapterSelection", renderer, mappedInput),
        manifest(std::move(manifest)),
        currentChapterIndex(currentChapterIndex) {}

  void onEnter() override;
  void onExit() override;
  void loop() override;
  void render(RenderLock&&) override;
  bool isReaderActivity() const override { return true; }
};
