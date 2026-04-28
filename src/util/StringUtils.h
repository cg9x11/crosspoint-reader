#pragma once

#include <string>

namespace StringUtils {

/**
 * Sanitize a string for use as a filename.
 * Replaces invalid characters with underscores, trims spaces/dots,
 * and limits length to maxBytes bytes.
 */
std::string sanitizeFilename(const std::string& name, size_t maxBytes = 100);

/**
 * Convert UTF-8 text into a display-safe ASCII approximation for UI surfaces
 * that may not have full glyph coverage.
 */
std::string toDisplaySafeAscii(const std::string& text);

}  // namespace StringUtils
