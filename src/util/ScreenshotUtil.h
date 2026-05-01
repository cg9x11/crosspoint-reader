#pragma once
#include <GfxRenderer.h>

#include <functional>

class ScreenshotUtil {
 public:
  using BmpWriter = std::function<bool(const uint8_t*, size_t)>;

  static void takeScreenshot(GfxRenderer& renderer);
  static size_t getFramebufferBmpSize(int width, int height);
  static bool streamFramebufferAsBmp(const uint8_t* framebuffer, int width, int height, const BmpWriter& writer);
  static bool saveFramebufferAsBmp(const char* filename, const uint8_t* framebuffer, int width, int height);
};
