#include "OnlineCoverStore.h"

#include <Arduino.h>
#include <HalStorage.h>
#include <JpegToBmpConverter.h>
#include <Logging.h>
#include <PngToBmpConverter.h>

#include <algorithm>
#include <cctype>
#include <sstream>
#include <vector>

#include <FsHelpers.h>
#include <Bitmap.h>

#include "network/HttpDownloader.h"

namespace {
constexpr char MODULE[] = "OCOV";
constexpr char COVER_DIR[] = "/.crosspoint/data/online_covers";
constexpr int DEFAULT_THUMB_WIDTH_RATIO_NUM = 2;
constexpr int DEFAULT_THUMB_WIDTH_RATIO_DEN = 3;
constexpr size_t MAX_CACHE_FILE_COUNT = 96;
constexpr size_t TARGET_CACHE_FILE_COUNT = 72;
constexpr uint32_t PRUNE_INTERVAL_MS = 5UL * 60UL * 1000UL;
enum class ImageKind { Unknown, Jpeg, Png };
enum class JpegVariant { Unknown, Baseline, Progressive };
uint32_t g_lastPruneAtMs = 0;

struct CacheFileInfo {
  std::string path;
  bool removable = false;
};

std::string stripQueryAndFragment(const std::string& url) {
  size_t end = url.find('?');
  const size_t fragmentPos = url.find('#');
  if (fragmentPos != std::string::npos) {
    end = end == std::string::npos ? fragmentPos : std::min(end, fragmentPos);
  }
  return end == std::string::npos ? url : url.substr(0, end);
}

std::string toLowerAscii(std::string value) {
  for (char& ch : value) {
    ch = static_cast<char>(std::tolower(static_cast<unsigned char>(ch)));
  }
  return value;
}

ImageKind inferImageKindFromUrl(const std::string& coverUrl) {
  const std::string normalized = toLowerAscii(stripQueryAndFragment(coverUrl));
  if (FsHelpers::hasJpgExtension(normalized)) {
    return ImageKind::Jpeg;
  }
  if (FsHelpers::hasPngExtension(normalized)) {
    return ImageKind::Png;
  }
  return ImageKind::Unknown;
}

ImageKind detectImageKindFromFile(const std::string& sourcePath) {
  FsFile sourceFile;
  if (!Storage.openFileForRead(MODULE, sourcePath.c_str(), sourceFile)) {
    return ImageKind::Unknown;
  }

  uint8_t header[8] = {};
  const size_t bytesRead = sourceFile.read(header, sizeof(header));
  sourceFile.close();

  if (bytesRead >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF) {
    return ImageKind::Jpeg;
  }

  constexpr uint8_t PNG_SIGNATURE[8] = {0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
  if (bytesRead >= sizeof(PNG_SIGNATURE) && std::equal(std::begin(PNG_SIGNATURE), std::end(PNG_SIGNATURE), header)) {
    return ImageKind::Png;
  }

  return ImageKind::Unknown;
}

std::string makeBasePath(const std::string& coverUrl, int targetHeight) {
  std::ostringstream out;
  out << COVER_DIR << "/" << std::hex << std::hash<std::string>{}(coverUrl) << "_" << targetHeight;
  return out.str();
}

bool ensureDirectories() {
  Storage.mkdir("/.crosspoint");
  Storage.mkdir("/.crosspoint/data");
  Storage.mkdir(COVER_DIR);
  return true;
}

std::string failureMarkerPath(const std::string& basePath) { return basePath + ".fail"; }

bool hasFailureMarker(const std::string& basePath) { return Storage.exists(failureMarkerPath(basePath).c_str()); }

void clearFailureMarker(const std::string& basePath) {
  const std::string markerPath = failureMarkerPath(basePath);
  if (Storage.exists(markerPath.c_str())) {
    Storage.remove(markerPath.c_str());
  }
}

void writeFailureMarker(const std::string& basePath, const char* reason) {
  FsFile marker;
  if (!Storage.openFileForWrite(MODULE, failureMarkerPath(basePath).c_str(), marker)) {
    return;
  }
  if (reason && *reason) {
    marker.print(reason);
  }
  marker.close();
}

JpegVariant detectJpegVariant(const std::string& sourcePath) {
  FsFile file;
  if (!Storage.openFileForRead(MODULE, sourcePath.c_str(), file)) {
    return JpegVariant::Unknown;
  }

  const auto readBe16 = [&file]() -> uint16_t {
    const int hi = file.read();
    const int lo = file.read();
    if (hi < 0 || lo < 0) return 0;
    return static_cast<uint16_t>((hi << 8) | lo);
  };

  if (file.read() != 0xFF || file.read() != 0xD8) {
    file.close();
    return JpegVariant::Unknown;
  }

  while (file.available()) {
    int prefix = file.read();
    while (prefix == 0xFF && file.available()) {
      prefix = file.read();
    }
    if (prefix < 0) break;

    const uint8_t marker = static_cast<uint8_t>(prefix);
    if (marker == 0xD9 || marker == 0xDA) {
      break;
    }
    if (marker >= 0xD0 && marker <= 0xD7) {
      continue;
    }

    const uint16_t segmentLength = readBe16();
    if (segmentLength < 2) {
      break;
    }

    if (marker == 0xC0 || marker == 0xC1) {
      file.close();
      return JpegVariant::Baseline;
    }
    if (marker == 0xC2) {
      file.close();
      return JpegVariant::Progressive;
    }

    if (!file.seekCur(static_cast<int32_t>(segmentLength) - 2)) {
      break;
    }
  }

  file.close();
  return JpegVariant::Unknown;
}

bool isUsableBmp(const std::string& bmpPath) {
  FsFile bmpFile;
  if (!Storage.openFileForRead(MODULE, bmpPath.c_str(), bmpFile)) {
    return false;
  }

  Bitmap bitmap(bmpFile);
  const BmpReaderError parseResult = bitmap.parseHeaders();
  if (parseResult != BmpReaderError::Ok || bitmap.getWidth() <= 0 || bitmap.getHeight() <= 0) {
    bmpFile.close();
    return false;
  }

  auto* outputRow = static_cast<uint8_t*>(malloc((bitmap.getWidth() + 3) / 4));
  auto* rowBytes = static_cast<uint8_t*>(malloc(bitmap.getRowBytes()));
  if (!outputRow || !rowBytes) {
    free(outputRow);
    free(rowBytes);
    bmpFile.close();
    return false;
  }

  const bool ok = bitmap.readNextRow(outputRow, rowBytes) == BmpReaderError::Ok;
  free(outputRow);
  free(rowBytes);
  bmpFile.close();
  return ok;
}

bool convertDownloadedImage(const std::string& sourcePath, const std::string& outputPath, int targetHeight, ImageKind imageKind) {
  FsFile sourceFile;
  if (!Storage.openFileForRead(MODULE, sourcePath.c_str(), sourceFile)) {
    return false;
  }

  FsFile outputFile;
  if (!Storage.openFileForWrite(MODULE, outputPath.c_str(), outputFile)) {
    sourceFile.close();
    return false;
  }

  const int targetWidth = std::max(24, (targetHeight * DEFAULT_THUMB_WIDTH_RATIO_NUM) / DEFAULT_THUMB_WIDTH_RATIO_DEN);
  bool success = false;
  if (imageKind == ImageKind::Jpeg) {
    const JpegVariant jpegVariant = detectJpegVariant(sourcePath);
    if (jpegVariant == JpegVariant::Progressive) {
      LOG_DBG(MODULE, "Skipping unsupported progressive JPEG cover: %s", sourcePath.c_str());
      sourceFile.close();
      outputFile.close();
      Storage.remove(outputPath.c_str());
      return false;
    }
    success = JpegToBmpConverter::jpegFileToBmpStreamWithSize(sourceFile, outputFile, targetWidth, targetHeight);
  } else if (imageKind == ImageKind::Png) {
    success = PngToBmpConverter::pngFileToBmpStreamWithSize(sourceFile, outputFile, targetWidth, targetHeight);
  }

  sourceFile.close();
  outputFile.close();

  if (success && !isUsableBmp(outputPath)) {
    LOG_DBG(MODULE, "Generated cover BMP failed validation: %s", outputPath.c_str());
    success = false;
  }

  if (!success && Storage.exists(outputPath.c_str())) {
    Storage.remove(outputPath.c_str());
  }
  return success;
}

bool shouldPruneNow() {
  const uint32_t now = millis();
  if (g_lastPruneAtMs != 0 && now - g_lastPruneAtMs < PRUNE_INTERVAL_MS) {
    return false;
  }
  g_lastPruneAtMs = now;
  return true;
}

void collectCacheFiles(std::vector<CacheFileInfo>& outFiles) {
  outFiles.clear();
  FsFile dir = Storage.open(COVER_DIR, O_RDONLY);
  if (!dir || !dir.isDirectory()) {
    return;
  }

  dir.rewindDirectory();
  for (FsFile file = dir.openNextFile(); file; file = dir.openNextFile()) {
    if (file.isDirectory()) {
      file.close();
      continue;
    }

    char nameBuffer[96] = {};
    const size_t nameLength = file.getName(nameBuffer, sizeof(nameBuffer));
    file.close();
    if (nameLength == 0 || nameLength >= sizeof(nameBuffer)) {
      continue;
    }

    const std::string name(nameBuffer, nameLength);
    const bool removable =
        (name.size() >= 4 && name.rfind(".bmp") == name.size() - 4) ||
        (name.size() >= 4 && name.rfind(".img") == name.size() - 4) ||
        (name.size() >= 5 && name.rfind(".fail") == name.size() - 5);
    outFiles.push_back(CacheFileInfo{std::string(COVER_DIR) + "/" + name, removable});
  }
  dir.close();
}
}  // namespace

bool OnlineCoverStore::tryGetCachedThumb(const std::string& coverUrl, int targetHeight, std::string& outBmpPath) {
  outBmpPath.clear();
  if (coverUrl.empty() || targetHeight <= 0) {
    return false;
  }

  ensureDirectories();

  const std::string basePath = makeBasePath(coverUrl, targetHeight);
  const std::string bmpPath = basePath + ".bmp";
  if (Storage.exists(bmpPath.c_str())) {
    if (!isUsableBmp(bmpPath)) {
      LOG_DBG(MODULE, "Removing invalid cached cover: %s", bmpPath.c_str());
      Storage.remove(bmpPath.c_str());
    } else {
      clearFailureMarker(basePath);
      outBmpPath = bmpPath;
      return true;
    }
  }
  if (hasFailureMarker(basePath)) {
    return false;
  }

  return false;
}

bool OnlineCoverStore::getOrCreateThumb(const std::string& coverUrl, int targetHeight, std::string& outBmpPath) {
  if (tryGetCachedThumb(coverUrl, targetHeight, outBmpPath)) {
    return true;
  }

  outBmpPath.clear();
  if (coverUrl.empty() || targetHeight <= 0) {
    return false;
  }

  ensureDirectories();

  const std::string basePath = makeBasePath(coverUrl, targetHeight);
  const std::string bmpPath = basePath + ".bmp";
  if (hasFailureMarker(basePath)) {
    return false;
  }

  const std::string tempImagePath = basePath + ".img";
  const auto downloadResult = HttpDownloader::downloadToFile(coverUrl, tempImagePath);
  if (downloadResult != HttpDownloader::OK) {
    if (Storage.exists(tempImagePath.c_str())) {
      Storage.remove(tempImagePath.c_str());
    }
    return false;
  }

  ImageKind imageKind = inferImageKindFromUrl(coverUrl);
  if (imageKind == ImageKind::Unknown) {
    imageKind = detectImageKindFromFile(tempImagePath);
  }
  if (imageKind == ImageKind::Unknown) {
    LOG_DBG(MODULE, "Unsupported downloaded cover format: %s", coverUrl.c_str());
    Storage.remove(tempImagePath.c_str());
    return false;
  }

  const bool success = convertDownloadedImage(tempImagePath, bmpPath, targetHeight, imageKind);
  Storage.remove(tempImagePath.c_str());
  if (!success) {
    writeFailureMarker(basePath, "convert_failed");
    return false;
  }

  clearFailureMarker(basePath);
  outBmpPath = bmpPath;
  pruneCache();
  return true;
}

void OnlineCoverStore::pruneCache() {
  ensureDirectories();
  if (!shouldPruneNow()) {
    return;
  }

  std::vector<CacheFileInfo> files;
  collectCacheFiles(files);
  if (files.size() <= MAX_CACHE_FILE_COUNT) {
    return;
  }

  size_t remaining = files.size();
  for (const auto& file : files) {
    if (remaining <= TARGET_CACHE_FILE_COUNT) {
      break;
    }
    if (!file.removable) {
      continue;
    }
    if (Storage.exists(file.path.c_str()) && Storage.remove(file.path.c_str())) {
      remaining--;
    }
  }
}

size_t OnlineCoverStore::getCacheFileCount() {
  ensureDirectories();
  std::vector<CacheFileInfo> files;
  collectCacheFiles(files);
  return files.size();
}
