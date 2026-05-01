#include "HakoEpubService.h"

#include <Arduino.h>
#include <Epub.h>
#include <HalStorage.h>
#include <Logging.h>
#include <ZipFile.h>

#include <algorithm>
#include <array>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <vector>

#include "../util/StringUtils.h"
#include "OnlineSourceBridge.h"
#include "network/HttpDownloader.h"

namespace {
constexpr char MODULE[] = "HKOEPUB";
constexpr char OUTPUT_DIR[] = "/Online Library";
constexpr uint32_t ZIP_LOCAL_HEADER_SIG = 0x04034b50;
constexpr uint32_t ZIP_CENTRAL_HEADER_SIG = 0x02014b50;
constexpr uint32_t ZIP_END_OF_CENTRAL_DIR_SIG = 0x06054b50;

struct ZipEntryMeta {
  std::string path;
  uint32_t crc32 = 0;
  uint32_t size = 0;
  uint32_t compressedSize = 0;
  uint32_t offset = 0;
  uint16_t compressionMethod = 0;
};

struct StagedZipEntry {
  std::string path;
  std::string sourcePath;
  std::string inlineContent;
  bool hasInlineContent = false;
  bool compress = true;
};

struct StagedAssetEntry {
  std::string zipPath;
  std::string sourcePath;
  std::string mediaType;
};

uint16_t toDosTime() { return static_cast<uint16_t>(12 << 11); }

uint16_t toDosDate() { return static_cast<uint16_t>(((2026 - 1980) << 9) | (1 << 5) | 1); }

void writeLe16(FsFile& file, uint16_t value) {
  const std::array<uint8_t, 2> bytes = {static_cast<uint8_t>(value & 0xFF), static_cast<uint8_t>((value >> 8) & 0xFF)};
  file.write(bytes.data(), bytes.size());
}

void writeLe32(FsFile& file, uint32_t value) {
  const std::array<uint8_t, 4> bytes = {static_cast<uint8_t>(value & 0xFF), static_cast<uint8_t>((value >> 8) & 0xFF),
                                        static_cast<uint8_t>((value >> 16) & 0xFF),
                                        static_cast<uint8_t>((value >> 24) & 0xFF)};
  file.write(bytes.data(), bytes.size());
}

uint32_t fnv1a32(const std::string& value) {
  uint32_t hash = 2166136261u;
  for (unsigned char ch : value) {
    hash ^= ch;
    hash *= 16777619u;
  }
  return hash;
}

std::string shortHex(uint32_t value) {
  char buf[9];
  std::snprintf(buf, sizeof(buf), "%08x", static_cast<unsigned int>(value));
  return buf;
}

std::string xmlEscape(const std::string& input) {
  std::string out;
  out.reserve(input.size() + 16);
  for (char ch : input) {
    switch (ch) {
      case '&':
        out += "&amp;";
        break;
      case '<':
        out += "&lt;";
        break;
      case '>':
        out += "&gt;";
        break;
      case '"':
        out += "&quot;";
        break;
      case '\'':
        out += "&apos;";
        break;
      default:
        out.push_back(ch);
        break;
    }
  }
  return out;
}

std::string makeChapterHref(uint32_t index) {
  char buf[32];
  std::snprintf(buf, sizeof(buf), "text/chapter-%04u.xhtml", static_cast<unsigned int>(index));
  return buf;
}

std::string makeChapterFullPath(uint32_t index) { return std::string("OEBPS/") + makeChapterHref(index); }

std::string makeChapterItemId(uint32_t index) {
  char buf[24];
  std::snprintf(buf, sizeof(buf), "chapter-%04u", static_cast<unsigned int>(index));
  return buf;
}

std::string makeImageHref(uint32_t chapterIndex, uint32_t imageIndex, const std::string& extension) {
  char buf[64];
  std::snprintf(buf, sizeof(buf), "images/chapter-%04u-img-%02u.%s", static_cast<unsigned int>(chapterIndex),
                static_cast<unsigned int>(imageIndex), extension.c_str());
  return buf;
}

std::string buildIdentifier(const HakoBookDetail& detail) {
  const std::string seed = detail.url.empty() ? detail.title : detail.url;
  return "urn:crosspoint:hako:" + shortHex(fnv1a32(seed));
}

std::string makeTempWorkDir(const std::string& epubPath) {
  return std::string("/.crosspoint/hako-epub-") + shortHex(fnv1a32(epubPath));
}

std::string makeTempSourcePath(const std::string& workDir, const std::string& zipPath) {
  return workDir + "/" + StringUtils::sanitizeFilename(zipPath, 120);
}

std::string toLowerAscii(std::string value) {
  std::transform(value.begin(), value.end(), value.begin(),
                 [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
  return value;
}

std::string mediaTypeForExtension(const std::string& extension) {
  const std::string lower = toLowerAscii(extension);
  if (lower == "jpg" || lower == "jpeg") return "image/jpeg";
  if (lower == "png") return "image/png";
  if (lower == "gif") return "image/gif";
  if (lower == "webp") return "image/webp";
  return "";
}

std::string extensionFromUrl(const std::string& url) {
  size_t end = url.find_first_of("?#");
  std::string clean = end == std::string::npos ? url : url.substr(0, end);
  const size_t dot = clean.find_last_of('.');
  if (dot == std::string::npos) return "jpg";
  const std::string ext = toLowerAscii(clean.substr(dot + 1));
  return mediaTypeForExtension(ext).empty() ? "jpg" : ext;
}

std::string extractUrlOrigin(const std::string& url) {
  const size_t schemePos = url.find("://");
  if (schemePos == std::string::npos) {
    return "";
  }
  const size_t hostStart = schemePos + 3;
  const size_t hostEnd = url.find('/', hostStart);
  return hostEnd == std::string::npos ? url : url.substr(0, hostEnd);
}

std::string makeAbsoluteAssetUrl(const std::string& url, const std::string& baseUrl) {
  if (url.empty()) return "";
  if (url.rfind("http://", 0) == 0 || url.rfind("https://", 0) == 0) return url;
  if (url.rfind("//", 0) == 0) return "https:" + url;
  const std::string origin = extractUrlOrigin(baseUrl);
  if (url.front() == '/') return origin.empty() ? url : origin + url;
  const size_t slash = baseUrl.find_last_of('/');
  if (slash == std::string::npos) return origin.empty() ? url : origin + "/" + url;
  return baseUrl.substr(0, slash + 1) + url;
}

std::string buildStyles() {
  return "body{font-family:serif;line-height:1.6;margin:0 auto;max-width:44em;padding:1.2em;}"
         "h1{font-size:1.35em;margin:0 0 1em 0;}"
         ".chapter-body p{margin:0 0 1em 0;}"
         "img{max-width:100%;height:auto;}";
}

bool writeChapterDocumentToFile(const std::string& path, const std::string& title, const std::string& html) {
  FsFile file;
  if (!Storage.openFileForWrite(MODULE, path, file) || !file) {
    return false;
  }

  const std::string escapedTitle = xmlEscape(title);
  const char* prefix1 = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                        "<html xmlns=\"http://www.w3.org/1999/xhtml\">\n"
                        "<head>\n"
                        "  <title>";
  const char* prefix2 = "</title>\n"
                        "  <link rel=\"stylesheet\" type=\"text/css\" href=\"../styles.css\"/>\n"
                        "</head>\n"
                        "<body>\n"
                        "  <section class=\"chapter\">\n"
                        "    <h1>";
  const char* prefix3 = "</h1>\n"
                        "    <div class=\"chapter-body\">";
  const char* suffix = "</div>\n"
                       "  </section>\n"
                       "</body>\n"
                       "</html>\n";

  const bool ok =
      file.print(prefix1) == std::strlen(prefix1) && file.write(escapedTitle.data(), escapedTitle.size()) == escapedTitle.size() &&
      file.print(prefix2) == std::strlen(prefix2) && file.write(escapedTitle.data(), escapedTitle.size()) == escapedTitle.size() &&
      file.print(prefix3) == std::strlen(prefix3) &&
      (html.empty() || file.write(html.data(), html.size()) == html.size()) && file.print(suffix) == std::strlen(suffix);
  file.flush();
  file.close();
  return ok;
}

std::string buildNav(const HakoBookDetail& detail, const std::vector<HakoChapterRef>& toc) {
  std::string items;
  for (const auto& chapter : toc) {
    items += "      <li><a href=\"" + xmlEscape(makeChapterHref(chapter.index)) + "\">" + xmlEscape(chapter.title) +
             "</a></li>\n";
  }
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
         "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:epub=\"http://www.idpf.org/2007/ops\">\n"
         "<head><title>" +
         xmlEscape(detail.title) +
         "</title></head>\n"
         "<body>\n"
         "  <nav epub:type=\"toc\" id=\"toc\">\n"
         "    <h1>" +
         xmlEscape(detail.title) +
         "</h1>\n"
         "    <ol>\n" +
         items +
         "    </ol>\n"
         "  </nav>\n"
         "</body>\n"
         "</html>\n";
}

std::string buildNcx(const HakoBookDetail& detail, const std::vector<HakoChapterRef>& toc, const std::string& identifier) {
  std::string points;
  for (size_t i = 0; i < toc.size(); ++i) {
    points += "    <navPoint id=\"navPoint-" + std::to_string(i + 1) + "\" playOrder=\"" + std::to_string(i + 1) +
              "\"><navLabel><text>" + xmlEscape(toc[i].title) + "</text></navLabel><content src=\"" +
              xmlEscape(makeChapterHref(toc[i].index)) + "\"/></navPoint>\n";
  }
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
         "<ncx xmlns=\"http://www.daisy.org/z3986/2005/ncx/\" version=\"2005-1\">\n"
         "  <head><meta name=\"dtb:uid\" content=\"" +
         xmlEscape(identifier) +
         "\"/></head>\n"
         "  <docTitle><text>" +
         xmlEscape(detail.title) +
         "</text></docTitle>\n"
         "  <navMap>\n" +
         points +
         "  </navMap>\n"
         "</ncx>\n";
}

std::string buildOpf(const HakoBookDetail& detail, const std::vector<HakoChapterRef>& toc,
                     const std::vector<StagedAssetEntry>& imageAssets, const std::string& identifier) {
  std::string manifest;
  std::string spine;
  for (const auto& chapter : toc) {
    manifest += "    <item id=\"" + makeChapterItemId(chapter.index) + "\" href=\"" + xmlEscape(makeChapterHref(chapter.index)) +
                "\" media-type=\"application/xhtml+xml\"/>\n";
    spine += "    <itemref idref=\"" + makeChapterItemId(chapter.index) + "\"/>\n";
  }
  for (size_t i = 0; i < imageAssets.size(); ++i) {
    manifest += "    <item id=\"img-" + std::to_string(i + 1) + "\" href=\"" + xmlEscape(imageAssets[i].zipPath.substr(6)) +
                "\" media-type=\"" + imageAssets[i].mediaType + "\"/>\n";
  }
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
         "<package xmlns=\"http://www.idpf.org/2007/opf\" version=\"3.0\" unique-identifier=\"BookId\">\n"
         "  <metadata xmlns:dc=\"http://purl.org/dc/elements/1.1/\">\n"
         "    <dc:identifier id=\"BookId\">" +
         xmlEscape(identifier) +
         "</dc:identifier>\n"
         "    <dc:title>" +
         xmlEscape(detail.title) +
         "</dc:title>\n"
         "    <dc:creator>" +
         xmlEscape(detail.author.empty() ? "Unknown" : detail.author) +
         "</dc:creator>\n"
         "    <dc:language>vi</dc:language>\n"
         "  </metadata>\n"
         "  <manifest>\n"
         "    <item id=\"nav\" href=\"nav.xhtml\" media-type=\"application/xhtml+xml\" properties=\"nav\"/>\n"
         "    <item id=\"ncx\" href=\"toc.ncx\" media-type=\"application/x-dtbncx+xml\"/>\n"
         "    <item id=\"styles\" href=\"styles.css\" media-type=\"text/css\"/>\n" +
         manifest +
         "  </manifest>\n"
         "  <spine toc=\"ncx\">\n" +
         spine +
         "  </spine>\n"
         "</package>\n";
}

bool writeStringToFile(const std::string& path, const std::string& content) {
  FsFile file;
  if (!Storage.openFileForWrite(MODULE, path, file) || !file) {
    return false;
  }
  const bool ok = content.empty() || file.write(content.data(), content.size()) == content.size();
  file.flush();
  file.close();
  return ok;
}

uint32_t crc32Update(uint32_t crc, const uint8_t* data, size_t size) {
  for (size_t i = 0; i < size; ++i) {
    crc ^= data[i];
    for (int bit = 0; bit < 8; ++bit) {
      crc = (crc & 1u) ? ((crc >> 1) ^ 0xEDB88320u) : (crc >> 1);
    }
  }
  return crc;
}

bool computeFileCrcAndSize(const std::string& path, uint32_t& outCrc32, uint32_t& outSize) {
  FsFile file = Storage.open(path.c_str(), O_RDONLY);
  if (!file) return false;

  outCrc32 = 0xFFFFFFFFu;
  outSize = 0;
  std::array<uint8_t, 1024> buffer{};
  while (true) {
    const int bytesRead = file.read(buffer.data(), buffer.size());
    if (bytesRead <= 0) break;
    outSize += static_cast<uint32_t>(bytesRead);
    outCrc32 = crc32Update(outCrc32, buffer.data(), static_cast<size_t>(bytesRead));
  }
  file.close();
  outCrc32 ^= 0xFFFFFFFFu;
  return true;
}

void computeStringCrcAndSize(const std::string& content, uint32_t& outCrc32, uint32_t& outSize) {
  outSize = static_cast<uint32_t>(content.size());
  outCrc32 = 0xFFFFFFFFu;
  if (!content.empty()) {
    outCrc32 = crc32Update(outCrc32, reinterpret_cast<const uint8_t*>(content.data()), content.size());
  }
  outCrc32 ^= 0xFFFFFFFFu;
}

bool appendStringContents(FsFile& dest, const std::string& content) {
  return content.empty() || dest.write(content.data(), content.size()) == content.size();
}

bool appendFileContents(FsFile& dest, const std::string& sourcePath) {
  FsFile src = Storage.open(sourcePath.c_str(), O_RDONLY);
  if (!src) return false;

  std::array<uint8_t, 1024> buffer{};
  while (true) {
    const int bytesRead = src.read(buffer.data(), buffer.size());
    if (bytesRead <= 0) break;
    if (dest.write(buffer.data(), static_cast<size_t>(bytesRead)) != static_cast<size_t>(bytesRead)) {
      src.close();
      return false;
    }
  }
  src.close();
  return true;
}

bool writeZip(const std::string& path, const std::vector<StagedZipEntry>& entries, std::string* outError) {
  FsFile file;
  if (!Storage.openFileForWrite(MODULE, path, file) || !file) {
    if (outError) *outError = "Failed to open output EPUB";
    return false;
  }

  std::vector<ZipEntryMeta> central;
  central.reserve(entries.size());

  for (const auto& entry : entries) {
    ZipEntryMeta meta;
    meta.path = entry.path;
    meta.offset = static_cast<uint32_t>(file.position());

    if (entry.hasInlineContent) {
      computeStringCrcAndSize(entry.inlineContent, meta.crc32, meta.size);
    } else if (!computeFileCrcAndSize(entry.sourcePath, meta.crc32, meta.size)) {
      file.close();
      if (outError) *outError = "Failed to read staged EPUB entry";
      return false;
    }
    meta.compressedSize = meta.size;
    meta.compressionMethod = 0;

    writeLe32(file, ZIP_LOCAL_HEADER_SIG);
    writeLe16(file, 20);
    writeLe16(file, 0);
    writeLe16(file, meta.compressionMethod);
    writeLe16(file, toDosTime());
    writeLe16(file, toDosDate());
    writeLe32(file, meta.crc32);
    writeLe32(file, meta.compressedSize);
    writeLe32(file, meta.size);
    writeLe16(file, static_cast<uint16_t>(meta.path.size()));
    writeLe16(file, 0);
    file.write(meta.path.data(), meta.path.size());
    const bool writeOk = entry.hasInlineContent ? appendStringContents(file, entry.inlineContent)
                                                : appendFileContents(file, entry.sourcePath);
    if (!writeOk) {
      file.close();
      if (outError) *outError = "Failed to write staged EPUB entry";
      return false;
    }

    central.push_back(std::move(meta));
  }

  const uint32_t centralOffset = static_cast<uint32_t>(file.position());
  for (const auto& meta : central) {
    writeLe32(file, ZIP_CENTRAL_HEADER_SIG);
    writeLe16(file, 20);
    writeLe16(file, 20);
    writeLe16(file, 0);
    writeLe16(file, meta.compressionMethod);
    writeLe16(file, toDosTime());
    writeLe16(file, toDosDate());
    writeLe32(file, meta.crc32);
    writeLe32(file, meta.compressedSize);
    writeLe32(file, meta.size);
    writeLe16(file, static_cast<uint16_t>(meta.path.size()));
    writeLe16(file, 0);
    writeLe16(file, 0);
    writeLe16(file, 0);
    writeLe16(file, 0);
    writeLe32(file, 0);
    writeLe32(file, meta.offset);
    file.write(meta.path.data(), meta.path.size());
  }

  const uint32_t centralSize = static_cast<uint32_t>(file.position()) - centralOffset;
  writeLe32(file, ZIP_END_OF_CENTRAL_DIR_SIG);
  writeLe16(file, 0);
  writeLe16(file, 0);
  writeLe16(file, static_cast<uint16_t>(central.size()));
  writeLe16(file, static_cast<uint16_t>(central.size()));
  writeLe32(file, centralSize);
  writeLe32(file, centralOffset);
  writeLe16(file, 0);
  file.flush();
  file.close();
  return true;
}

bool stageEntry(const std::string& workDir, const std::string& zipPath, const std::string& content,
                std::vector<StagedZipEntry>& outEntries, std::vector<std::string>& stagedPaths, std::string* outError) {
  const std::string sourcePath = makeTempSourcePath(workDir, zipPath);
  if (!writeStringToFile(sourcePath, content)) {
    if (outError) *outError = "Failed to stage EPUB entry";
    return false;
  }
  StagedZipEntry entry;
  entry.path = zipPath;
  entry.sourcePath = sourcePath;
  entry.compress = zipPath != "mimetype";
  outEntries.push_back(std::move(entry));
  stagedPaths.push_back(sourcePath);
  return true;
}

bool stageInlineEntry(const std::string& zipPath, const std::string& content, std::vector<StagedZipEntry>& outEntries) {
  StagedZipEntry entry;
  entry.path = zipPath;
  entry.inlineContent = content;
  entry.hasInlineContent = true;
  entry.compress = zipPath != "mimetype";
  outEntries.push_back(std::move(entry));
  return true;
}

bool stageExistingFileEntry(const std::string& zipPath, const std::string& sourcePath, const std::string& mediaType,
                            std::vector<StagedZipEntry>& outEntries, std::vector<StagedAssetEntry>& outAssets) {
  StagedZipEntry entry;
  entry.path = zipPath;
  entry.sourcePath = sourcePath;
  entry.compress = true;
  outEntries.push_back(std::move(entry));
  outAssets.push_back({zipPath, sourcePath, mediaType});
  return true;
}

bool localizeChapterImages(const CpPluginInfo& pluginInfo, const std::string& workDir, const HakoChapterRef& ref, std::string& html,
                           std::vector<StagedZipEntry>& outEntries, std::vector<StagedAssetEntry>& outAssets,
                           std::vector<std::string>& stagedPaths) {
  size_t searchPos = 0;
  uint32_t imageIndex = 1;
  while ((searchPos = html.find("<img", searchPos)) != std::string::npos) {
    const size_t tagEnd = html.find('>', searchPos);
    if (tagEnd == std::string::npos) break;
    size_t srcPos = html.find("src=\"", searchPos);
    size_t quoteLen = 5;
    if (srcPos == std::string::npos || srcPos > tagEnd) {
      srcPos = html.find("src='", searchPos);
      quoteLen = 5;
    }
    if (srcPos == std::string::npos || srcPos > tagEnd) {
      searchPos = tagEnd + 1;
      continue;
    }
    const char quote = html[srcPos + 4];
    const size_t valueStart = srcPos + quoteLen;
    const size_t valueEnd = html.find(quote, valueStart);
    if (valueEnd == std::string::npos || valueEnd > tagEnd) {
      searchPos = tagEnd + 1;
      continue;
    }

    const std::string originalUrl = html.substr(valueStart, valueEnd - valueStart);
    const std::string absoluteUrl = makeAbsoluteAssetUrl(originalUrl, ref.url);
    const std::string downloadUrl = OnlineSourceBridge::buildAssetProxyUrl(pluginInfo, absoluteUrl);
    const std::string extension = extensionFromUrl(absoluteUrl);
    const std::string mediaType = mediaTypeForExtension(extension);
    if (mediaType.empty()) {
      searchPos = tagEnd + 1;
      continue;
    }

    const std::string href = makeImageHref(ref.index, imageIndex++, extension);
    const std::string zipPath = std::string("OEBPS/") + href;
    const std::string sourcePath = makeTempSourcePath(workDir, zipPath);
    if (HttpDownloader::downloadToFile(downloadUrl, sourcePath) != HttpDownloader::OK) {
      searchPos = tagEnd + 1;
      continue;
    }

    stagedPaths.push_back(sourcePath);
    stageExistingFileEntry(zipPath, sourcePath, mediaType, outEntries, outAssets);
    html.replace(valueStart, valueEnd - valueStart, "../" + href);
    searchPos = valueStart + href.size() + 3;
  }
  return true;
}

void cleanupStagedFiles(const std::vector<std::string>& stagedPaths) {
  for (const auto& path : stagedPaths) {
    if (Storage.exists(path.c_str())) {
      Storage.remove(path.c_str());
    }
  }
}

bool stageBaseEntries(const std::string& workDir, const HakoBookDetail& detail, const std::vector<HakoChapterRef>& toc,
                      const std::vector<StagedAssetEntry>& imageAssets, std::vector<StagedZipEntry>& outEntries,
                      std::vector<std::string>& stagedPaths,
                      std::string* outError) {
  static_cast<void>(workDir);
  static_cast<void>(stagedPaths);
  static_cast<void>(outError);
  const std::string identifier = buildIdentifier(detail);
  return stageInlineEntry("mimetype", "application/epub+zip", outEntries) &&
         stageInlineEntry("META-INF/container.xml",
                          "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                          "<container version=\"1.0\" xmlns=\"urn:oasis:names:tc:opendocument:xmlns:container\">"
                          "<rootfiles><rootfile full-path=\"OEBPS/content.opf\" "
                          "media-type=\"application/oebps-package+xml\"/></rootfiles></container>",
                          outEntries) &&
         stageInlineEntry("OEBPS/styles.css", buildStyles(), outEntries) &&
         stageInlineEntry("OEBPS/nav.xhtml", buildNav(detail, toc), outEntries) &&
         stageInlineEntry("OEBPS/toc.ncx", buildNcx(detail, toc, identifier), outEntries) &&
         stageInlineEntry("OEBPS/content.opf", buildOpf(detail, toc, imageAssets, identifier), outEntries);
}

uint32_t randomBetween(uint32_t minValue, uint32_t maxValue) {
  if (maxValue <= minValue) return minValue;
  return minValue + static_cast<uint32_t>(std::rand() % static_cast<int>(maxValue - minValue + 1));
}

bool emitProgress(const HakoProgressCallback& progress, uint32_t completed, uint32_t total, const std::string& chapterTitle,
                  const std::string& message, uint32_t waitMs = 0) {
  if (!progress) {
    return true;
  }
  HakoProgressState state;
  state.completedChapters = completed;
  state.totalChapters = total;
  state.waitMs = waitMs;
  state.chapterTitle = chapterTitle;
  state.message = message;
  return progress(state);
}

bool waitWithProgress(uint32_t waitMs, uint32_t completed, uint32_t total, const std::string& chapterTitle,
                      const std::string& message, const HakoProgressCallback& progress, std::string* outError) {
  if (waitMs == 0) {
    return true;
  }

  if (!emitProgress(progress, completed, total, chapterTitle, message, waitMs)) {
    if (outError) *outError = "Cancelled";
    return false;
  }

  constexpr uint32_t sliceMs = 250;
  uint32_t elapsedMs = 0;
  while (elapsedMs < waitMs) {
    const uint32_t remainingMs = waitMs - elapsedMs;
    const uint32_t sleepMs = remainingMs < sliceMs ? remainingMs : sliceMs;
    delay(sleepMs);
    elapsedMs += sleepMs;
    if (!emitProgress(progress, completed, total, chapterTitle, message, waitMs > elapsedMs ? waitMs - elapsedMs : 0)) {
      if (outError) *outError = "Cancelled";
      return false;
    }
  }
  return true;
}

bool throttleAfterChapter(uint32_t completedCount, uint32_t totalCount, const HakoDownloadOptions* options,
                          const HakoProgressCallback& progress, const std::string& chapterTitle, std::string* outError) {
  if (!options || completedCount >= totalCount) {
    return true;
  }

  uint32_t waitMs = 0;
  if (options->batchSize > 0 && completedCount % options->batchSize == 0) {
    waitMs = randomBetween(options->batchDelayMinMs, options->batchDelayMaxMs);
  } else {
    waitMs = randomBetween(options->chapterDelayMinMs, options->chapterDelayMaxMs);
  }

  if (waitMs == 0) {
    return true;
  }
  return waitWithProgress(waitMs, completedCount, totalCount, chapterTitle, "Cooling down", progress, outError);
}

bool stageFetchedChapters(const CpPluginInfo& pluginInfo, const std::string& workDir, const std::vector<HakoChapterRef>& refs,
                          std::vector<StagedZipEntry>& outEntries, std::vector<StagedAssetEntry>& outAssets,
                          std::vector<std::string>& stagedPaths, std::string* outError, const HakoDownloadOptions* options,
                          const HakoProgressCallback& progress) {
  const uint32_t total = static_cast<uint32_t>(refs.size());
  uint32_t completed = 0;
  for (const auto& ref : refs) {
    const uint32_t retryCount = options ? options->chapterRetryCount : 0;
    HakoChapterContent content;
    bool fetched = false;
    for (uint32_t attempt = 0; attempt <= retryCount; ++attempt) {
      const std::string progressMessage = attempt == 0 ? "Fetching chapter" : "Retrying chapter";
      if (!emitProgress(progress, completed, total, ref.title, progressMessage)) {
        if (outError) *outError = "Cancelled";
        return false;
      }
      if (OnlineSourceBridge::fetchChapter(pluginInfo, ref, content, false)) {
        fetched = true;
        break;
      }
      if (attempt >= retryCount) {
        break;
      }

      uint32_t retryDelayMs = 0;
      if (options) {
        retryDelayMs = randomBetween(options->chapterRetryDelayMinMs, options->chapterRetryDelayMaxMs);
      }
      if (!waitWithProgress(retryDelayMs, completed, total, ref.title, "Waiting before retry", progress, outError)) {
        return false;
      }
    }

      if (!fetched) {
        if (outError) *outError = "Failed to fetch chapter: " + ref.title;
        return false;
      }
      content.text.clear();
      content.text.shrink_to_fit();
      localizeChapterImages(pluginInfo, workDir, ref, content.html, outEntries, outAssets, stagedPaths);
      const std::string zipPath = makeChapterFullPath(ref.index);
      const std::string sourcePath = makeTempSourcePath(workDir, zipPath);
      if (!writeChapterDocumentToFile(sourcePath, ref.title, content.html)) {
        if (outError) *outError = "Failed to stage chapter";
        return false;
      }
      StagedZipEntry entry;
      entry.path = zipPath;
      entry.sourcePath = sourcePath;
      entry.compress = true;
      outEntries.push_back(std::move(entry));
      stagedPaths.push_back(sourcePath);
      content.html.clear();
      content.html.shrink_to_fit();
      completed++;
    if (!emitProgress(progress, completed, total, ref.title, "Chapter saved")) {
      if (outError) *outError = "Cancelled";
      return false;
    }
    if (!throttleAfterChapter(completed, total, options, progress, ref.title, outError)) {
      return false;
    }
  }
  return true;
}

class FileWritePrint final : public Print {
 public:
  explicit FileWritePrint(FsFile& file) : file(file) {}

  size_t write(uint8_t ch) override { return file.write(&ch, 1); }

  size_t write(const uint8_t* buffer, size_t size) override { return file.write(buffer, size); }

 private:
  FsFile& file;
};

bool stageExistingGeneratedChapters(const std::string& workDir, const std::string& epubPath, const std::vector<HakoChapterRef>& refs,
                                    std::vector<StagedZipEntry>& outEntries, std::vector<std::string>& stagedPaths,
                                    std::string* outError) {
  ZipFile zip(epubPath);
  constexpr size_t ZIP_STREAM_CHUNK_SIZE = 768;
  for (const auto& ref : refs) {
    const std::string zipPath = makeChapterFullPath(ref.index);
    const std::string sourcePath = makeTempSourcePath(workDir, zipPath);
    FsFile stagedFile;
    if (!Storage.openFileForWrite(MODULE, sourcePath, stagedFile) || !stagedFile) {
      if (outError) *outError = "Failed to stage existing chapter";
      return false;
    }
    FileWritePrint stream(stagedFile);
    const bool ok = zip.readFileToStream(zipPath.c_str(), stream, ZIP_STREAM_CHUNK_SIZE);
    stagedFile.flush();
    stagedFile.close();
    if (!ok) {
      Storage.remove(sourcePath.c_str());
      if (outError) *outError = "Missing stored chapter in existing EPUB";
      return false;
    }

    StagedZipEntry entry;
    entry.path = zipPath;
    entry.sourcePath = sourcePath;
    entry.compress = true;
    outEntries.push_back(std::move(entry));
    stagedPaths.push_back(sourcePath);
  }
  return true;
}

bool buildEpub(const CpPluginInfo& pluginInfo, const HakoBookDetail& detail, const std::vector<HakoChapterRef>& toc,
               const std::vector<HakoChapterRef>& existingRefs, const std::vector<HakoChapterRef>& newRefs,
               const std::string& existingEpubPath, const std::string& epubPath, std::string* outError,
               const HakoDownloadOptions* options, const HakoProgressCallback& progress) {
  if (toc.empty()) {
    if (outError) *outError = "No chapters available";
    return false;
  }
  if (!Storage.ensureDirectoryExists(OUTPUT_DIR)) {
    if (outError) *outError = "Failed to create output directory";
    return false;
  }

  const std::string workDir = makeTempWorkDir(epubPath);
  if (!Storage.ensureDirectoryExists(workDir.c_str())) {
    if (outError) *outError = "Failed to create temp EPUB workspace";
    return false;
  }

  std::vector<StagedZipEntry> entries;
  std::vector<StagedZipEntry> chapterEntries;
  std::vector<StagedAssetEntry> imageAssets;
  std::vector<std::string> stagedPaths;
  entries.reserve(6 + toc.size());

  const uint32_t totalFetchCount = static_cast<uint32_t>(newRefs.empty() ? toc.size() : newRefs.size());
  if (!emitProgress(progress, 0, totalFetchCount, "", "Preparing EPUB")) {
    if (outError) *outError = "Cancelled";
    cleanupStagedFiles(stagedPaths);
    return false;
  }

  if ((!existingRefs.empty() &&
       !stageExistingGeneratedChapters(workDir, existingEpubPath, existingRefs, chapterEntries, stagedPaths, outError)) ||
      (!newRefs.empty() &&
       !stageFetchedChapters(pluginInfo, workDir, newRefs, chapterEntries, imageAssets, stagedPaths, outError, options,
                             progress)) ||
      !stageBaseEntries(workDir, detail, toc, imageAssets, entries, stagedPaths, outError)) {
    cleanupStagedFiles(stagedPaths);
    return false;
  }
  entries.insert(entries.end(), chapterEntries.begin(), chapterEntries.end());

  if (!emitProgress(progress, totalFetchCount, totalFetchCount, "", "Finalizing EPUB")) {
    if (outError) *outError = "Cancelled";
    cleanupStagedFiles(stagedPaths);
    return false;
  }

  if (!writeZip(epubPath, entries, outError)) {
    cleanupStagedFiles(stagedPaths);
    return false;
  }

  cleanupStagedFiles(stagedPaths);
  Epub(epubPath, "/.crosspoint").clearCache();
  return true;
}

bool persistTrackedItem(const TrackedSeriesInfo& item, std::string* outError) {
  TRACKED_SERIES_STORE.ensureLoaded();
  return TRACKED_SERIES_STORE.upsert(item, outError);
}

int findChapterIndexByUrl(const std::vector<HakoChapterRef>& toc, const std::string& url) {
  if (url.empty()) {
    return -1;
  }
  for (size_t i = 0; i < toc.size(); ++i) {
    if (toc[i].url == url) {
      return static_cast<int>(i);
    }
  }
  return -1;
}

int findChapterIndexByTitle(const std::vector<HakoChapterRef>& toc, const std::string& title) {
  if (title.empty()) {
    return -1;
  }
  for (size_t i = 0; i < toc.size(); ++i) {
    if (toc[i].title == title) {
      return static_cast<int>(i);
    }
  }
  return -1;
}

void remapReadingProgress(const std::vector<HakoChapterRef>& toc, TrackedSeriesInfo& item) {
  if (item.lastReadChapterUrl.empty() && item.lastReadChapterTitle.empty()) {
    return;
  }

  int readIndex = findChapterIndexByUrl(toc, item.lastReadChapterUrl);
  if (readIndex < 0) {
    readIndex = findChapterIndexByTitle(toc, item.lastReadChapterTitle);
    if (readIndex >= 0) {
      item.lastReadChapterUrl = toc[readIndex].url;
      item.lastReadChapterTitle = toc[readIndex].title;
    }
  }

  if (readIndex >= 0) {
    return;
  }

  item.lastReadChapterUrl.clear();
  item.lastReadChapterTitle.clear();
  item.lastReadPage = 0;
  item.lastReadPageCount = 0;
}
}  // namespace

std::string HakoEpubService::buildDefaultEpubPath(const HakoBookDetail& detail) {
  const std::string baseName = StringUtils::sanitizeFilename(
      detail.title + (detail.author.empty() ? "" : " - " + detail.author), 80);
  const std::string suffix = shortHex(fnv1a32(detail.url.empty() ? detail.title : detail.url));
  return std::string(OUTPUT_DIR) + "/" + baseName + " [" + suffix + "].epub";
}

TrackedSeriesInfo HakoEpubService::makeTrackedInfo(const CpPluginInfo& pluginInfo, const HakoBookDetail& detail,
                                                   const std::vector<HakoChapterRef>& toc,
                                                   const TrackedSeriesInfo* existing) {
  TrackedSeriesInfo item;
  if (existing) {
    item = *existing;
  }

  item.pluginId = pluginInfo.id;
  item.runtimeProfile = pluginInfo.runtimeProfile;
  item.title = detail.title;
  item.author = detail.author;
  item.seriesUrl = detail.url;
  item.coverUrl = OnlineSourceBridge::buildAssetProxyUrl(pluginInfo, detail.coverUrl, detail.url);
  item.epubPath = item.epubPath.empty() ? buildDefaultEpubPath(detail) : item.epubPath;
  item.chapterCount = static_cast<uint32_t>(toc.size());
  if (!toc.empty()) {
    item.lastChapterUrl = toc.back().url;
    item.lastChapterTitle = toc.back().title;
  }
  return item;
}

bool HakoEpubService::downloadEpub(const CpPluginInfo& pluginInfo, const HakoBookDetail& detail,
                                   const std::vector<HakoChapterRef>& toc,
                                   const std::string& epubPath, std::string* outError, const HakoDownloadOptions* options,
                                   const HakoProgressCallback& progress) {
  return buildEpub(pluginInfo, detail, toc, {}, toc, "", epubPath, outError, options, progress);
}

bool HakoEpubService::syncTrackedSeries(const CpPluginInfo& pluginInfo, const TrackedSeriesInfo& current,
                                        HakoTrackedSyncResult& outResult,
                                        const HakoDownloadOptions* options, const HakoProgressCallback& progress) {
  outResult = {};
  outResult.epubPath = current.epubPath;

  if (!emitProgress(progress, 0, 0, "", "Loading series")) {
    outResult.message = "Cancelled";
    return false;
  }

  HakoBookDetail remoteDetail;
  if (!OnlineSourceBridge::fetchDetail(pluginInfo, current.seriesUrl, remoteDetail)) {
    outResult.message = "Failed to load series detail";
    return false;
  }

  std::vector<HakoChapterRef> toc;
  if (!OnlineSourceBridge::fetchToc(pluginInfo, current.seriesUrl, toc)) {
    outResult.message = "Failed to load chapter list";
    return false;
  }
  if (toc.empty()) {
    outResult.message = "No chapters found";
    return false;
  }

  outResult.chapterCount = static_cast<uint32_t>(toc.size());
  outResult.latestChapterUrl = toc.back().url;
  outResult.latestChapterTitle = toc.back().title;

  int lastKnownIndex = findChapterIndexByUrl(toc, current.lastChapterUrl);
  outResult.lastKnownFound = lastKnownIndex >= 0;
  if (lastKnownIndex >= 0) {
    outResult.newChapters.assign(toc.begin() + lastKnownIndex + 1, toc.end());
  }

  TrackedSeriesInfo updated = current;
  updated.title = remoteDetail.title.empty() ? current.title : remoteDetail.title;
  updated.author = remoteDetail.author.empty() ? current.author : remoteDetail.author;
  updated.coverUrl =
      remoteDetail.coverUrl.empty() ? current.coverUrl
                                    : OnlineSourceBridge::buildAssetProxyUrl(pluginInfo, remoteDetail.coverUrl, remoteDetail.url);
  updated.chapterCount = static_cast<uint32_t>(toc.size());
  updated.lastChapterUrl = toc.back().url;
  updated.lastChapterTitle = toc.back().title;
  remapReadingProgress(toc, updated);
  if (updated.epubPath.empty()) {
    updated.epubPath = buildDefaultEpubPath(remoteDetail);
  }
  outResult.epubPath = updated.epubPath;

  std::string error;
  if (!Storage.exists(updated.epubPath.c_str()) || lastKnownIndex < 0) {
    if (!buildEpub(pluginInfo, remoteDetail, toc, {}, toc, "", updated.epubPath, &error, options, progress)) {
      outResult.message = error;
      return false;
    }
    if (!persistTrackedItem(updated, &error)) {
      outResult.message = error;
      return false;
    }
    outResult.success = true;
    outResult.updated = true;
    outResult.rebuilt = true;
    outResult.message = lastKnownIndex < 0 ? "Source changed, rebuilt EPUB" : "EPUB downloaded";
    return true;
  }

  if (outResult.newChapters.empty()) {
    if (!persistTrackedItem(updated, &error)) {
      outResult.message = error;
      return false;
    }
    outResult.success = true;
    outResult.message = "Up to date";
    return true;
  }

  const std::vector<HakoChapterRef> existingRefs(toc.begin(), toc.begin() + lastKnownIndex + 1);
  if (!buildEpub(pluginInfo, remoteDetail, toc, existingRefs, outResult.newChapters, updated.epubPath, updated.epubPath,
                 &error, options, progress)) {
    LOG_ERR(MODULE, "Incremental EPUB rebuild failed, retrying full rebuild: %s", error.c_str());
    if (!buildEpub(pluginInfo, remoteDetail, toc, {}, toc, "", updated.epubPath, &error, options, progress)) {
      outResult.message = error;
      return false;
    }
    if (!persistTrackedItem(updated, &error)) {
      outResult.message = error;
      return false;
    }
    outResult.success = true;
    outResult.updated = true;
    outResult.rebuilt = true;
    outResult.message = "Rebuilt EPUB with latest chapters";
    return true;
  }
  if (!persistTrackedItem(updated, &error)) {
    outResult.message = error;
    return false;
  }

  outResult.success = true;
  outResult.updated = true;
  outResult.message = "Added " + std::to_string(outResult.newChapters.size()) + " new chapter(s)";
  return true;
}
