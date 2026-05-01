#pragma once
#include <HalStorage.h>

#include <functional>
#include <string>

/**
 * HTTP client utility for fetching content and downloading files.
 * Wraps NetworkClientSecure and HTTPClient for HTTPS requests.
 */
class HttpDownloader {
 public:
  using ProgressCallback = std::function<void(size_t downloaded, size_t total)>;
  using ChunkCallback = std::function<bool(const uint8_t* data, size_t size)>;

  enum DownloadError {
    OK = 0,
    HTTP_ERROR,
    FILE_ERROR,
    ABORTED,
  };

  /**
   * Fetch text content from a URL with optional credentials.
   */
  static bool fetchUrl(const std::string& url, std::string& outContent, const std::string& username = "",
                       const std::string& password = "");

  static bool fetchUrlCapped(const std::string& url, std::string& outContent, size_t maxBytes, bool allowTruncate,
                             const std::string& username = "", const std::string& password = "");
  static bool fetchUrlFromMarkerCapped(const std::string& url, std::string& outContent, const std::string& marker,
                                       size_t maxBytes, bool allowTruncate, const std::string& username = "",
                                       const std::string& password = "");
  static bool fetchUrlFromMarkerStreamed(const std::string& url, const std::string& marker, ChunkCallback onChunk,
                                         const std::string& username = "", const std::string& password = "");

  static bool fetchUrl(const std::string& url, Stream& stream, const std::string& username = "",
                       const std::string& password = "");

  static const std::string& getLastError();
  static void clearLastError();
  static bool wasLastResponseTruncated();

  /**
   * Download a file to the SD card with optional credentials.
   */
  static DownloadError downloadToFile(const std::string& url, const std::string& destPath,
                                      ProgressCallback progress = nullptr, const std::string& username = "",
                                      const std::string& password = "");
};
