#include "UrlUtils.h"

#include <cctype>

namespace UrlUtils {

namespace {
bool isTrimChar(unsigned char ch) { return ch <= 0x20 || ch == 0x7F; }

void normalizeProtocolCase(std::string& url) {
  const size_t schemePos = url.find("://");
  if (schemePos == std::string::npos) {
    return;
  }
  for (size_t i = 0; i < schemePos; ++i) {
    url[i] = static_cast<char>(tolower(static_cast<unsigned char>(url[i])));
  }
}
}

std::string sanitizeUrl(const std::string& url) {
  std::string sanitized;
  sanitized.reserve(url.size());
  for (unsigned char ch : url) {
    if (ch <= 0x20 || ch == 0x7F || ch >= 0x80) {
      continue;
    }
    sanitized.push_back(static_cast<char>(ch));
  }

  size_t start = 0;
  while (start < sanitized.size() && isTrimChar(static_cast<unsigned char>(sanitized[start]))) {
    ++start;
  }

  size_t end = sanitized.size();
  while (end > start && isTrimChar(static_cast<unsigned char>(sanitized[end - 1]))) {
    --end;
  }

  sanitized = sanitized.substr(start, end - start);
  normalizeProtocolCase(sanitized);
  return sanitized;
}

bool isHttpsUrl(const std::string& url) { return sanitizeUrl(url).rfind("https://", 0) == 0; }

std::string ensureProtocol(const std::string& url) {
  const std::string sanitized = sanitizeUrl(url);
  if (sanitized.find("://") == std::string::npos) {
    return "http://" + sanitized;
  }
  return sanitized;
}

std::string extractHost(const std::string& url) {
  const std::string sanitized = sanitizeUrl(url);
  const size_t protocolEnd = sanitized.find("://");
  if (protocolEnd == std::string::npos) {
    // No protocol, find first slash
    const size_t firstSlash = sanitized.find('/');
    return firstSlash == std::string::npos ? sanitized : sanitized.substr(0, firstSlash);
  }
  // Find the first slash after the protocol
  const size_t hostStart = protocolEnd + 3;
  const size_t pathStart = sanitized.find('/', hostStart);
  return pathStart == std::string::npos ? sanitized : sanitized.substr(0, pathStart);
}

std::string buildUrl(const std::string& serverUrl, const std::string& path) {
  const std::string sanitizedPath = sanitizeUrl(path);
  // If path is already an absolute URL (has protocol), use it directly
  if (sanitizedPath.find("://") != std::string::npos) {
    return sanitizedPath;
  }
  const std::string urlWithProtocol = ensureProtocol(serverUrl);
  if (sanitizedPath.empty()) {
    return urlWithProtocol;
  }
  if (sanitizedPath[0] == '/') {
    // Absolute path - use just the host
    return extractHost(urlWithProtocol) + sanitizedPath;
  }
  // Relative path - strip query string from base before appending
  std::string base = urlWithProtocol;
  const size_t queryPos = base.find('?');
  if (queryPos != std::string::npos) {
    base.resize(queryPos);
  }
  if (base.back() == '/') {
    return base + sanitizedPath;
  }
  return base + "/" + sanitizedPath;
}

}  // namespace UrlUtils
