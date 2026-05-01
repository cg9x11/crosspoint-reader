#include "ScreenshotUtil.h"

#include <Arduino.h>
#include <BitmapHelpers.h>
#include <GfxRenderer.h>
#include <HalStorage.h>
#include <Logging.h>

#include <array>
#include <string>

#include "Bitmap.h"  // Required for BmpHeader struct definition

void ScreenshotUtil::takeScreenshot(GfxRenderer& renderer) {
  const uint8_t* fb = renderer.getFrameBuffer();
  if (fb) {
    String filename_str = "/screenshots/screenshot-" + String(millis()) + ".bmp";
    if (ScreenshotUtil::saveFramebufferAsBmp(filename_str.c_str(), fb, renderer.getDisplayWidth(),
                                             renderer.getDisplayHeight())) {
      LOG_DBG("SCR", "Screenshot saved to %s", filename_str.c_str());
    } else {
      LOG_ERR("SCR", "Failed to save screenshot");
    }
  } else {
    LOG_ERR("SCR", "Framebuffer not available");
  }

  // Display a border around the screen to indicate a screenshot was taken
  if (renderer.storeBwBuffer()) {
    renderer.drawRect(6, 6, renderer.getDisplayHeight() - 12, renderer.getDisplayWidth() - 12, 2, true);
    renderer.displayBuffer();
    delay(1000);
    renderer.restoreBwBuffer();
    renderer.displayBuffer(HalDisplay::RefreshMode::HALF_REFRESH);
  }
}

size_t ScreenshotUtil::getFramebufferBmpSize(const int width, const int height) {
  const int phyWidth = height;
  const int phyHeight = width;
  const uint32_t rowSizePadded = (phyWidth + 31) / 32 * 4;
  return sizeof(BmpHeader) + rowSizePadded * phyHeight;
}

bool ScreenshotUtil::streamFramebufferAsBmp(const uint8_t* framebuffer, const int width, const int height,
                                            const BmpWriter& writer) {
  if (!framebuffer || !writer) {
    return false;
  }

  const int phyWidth = height;
  const int phyHeight = width;
  const uint32_t rowSizePadded = (phyWidth + 31) / 32 * 4;
  constexpr size_t kMaxRowSize = 128;
  if (rowSizePadded > kMaxRowSize) {
    LOG_ERR("SCR", "Row size %u exceeds buffer capacity", rowSizePadded);
    return false;
  }

  BmpHeader header;
  createBmpHeader(&header, phyWidth, phyHeight, BmpRowOrder::BottomUp);
  if (!writer(reinterpret_cast<const uint8_t*>(&header), sizeof(header))) {
    return false;
  }

  std::array<uint8_t, kMaxRowSize> rowBuffer = {};
  for (int outY = 0; outY < phyHeight; outY++) {
    for (int outX = 0; outX < phyWidth; outX++) {
      const int srcX = width - 1 - outY;
      const int srcY = phyWidth - 1 - outX;
      const int fbIndex = srcY * (width / 8) + (srcX / 8);
      const uint8_t pixel = (framebuffer[fbIndex] >> (7 - (srcX % 8))) & 0x01;
      rowBuffer[outX / 8] |= pixel << (7 - (outX % 8));
    }
    if (!writer(rowBuffer.data(), rowSizePadded)) {
      return false;
    }
    memset(rowBuffer.data(), 0, rowSizePadded);
  }

  return true;
}

bool ScreenshotUtil::saveFramebufferAsBmp(const char* filename, const uint8_t* framebuffer, int width, int height) {
  if (!framebuffer) {
    return false;
  }

  // Note: the width and height, we rotate the image 90d counter-clockwise to match the default display orientation
  int phyWidth = height;
  int phyHeight = width;

  std::string path(filename);
  size_t last_slash = path.find_last_of('/');
  if (last_slash != std::string::npos) {
    std::string dir = path.substr(0, last_slash);
    if (!Storage.exists(dir.c_str())) {
      if (!Storage.mkdir(dir.c_str())) {
        return false;
      }
    }
  }

  FsFile file;
  if (!Storage.openFileForWrite("SCR", filename, file)) {
    LOG_ERR("SCR", "Failed to save screenshot");
    return false;
  }

  const bool writeError = !streamFramebufferAsBmp(
      framebuffer, width, height, [&file](const uint8_t* data, const size_t length) {
        return file.write(data, length) == length;
      });

  // Explicitly close() file before calling Storage.remove()
  file.close();

  if (writeError) {
    Storage.remove(filename);
    return false;
  }

  return true;
}
