#pragma once

#include <string>

namespace OnlineTextUtils {

std::string trimAscii(std::string value);
std::string collapseWhitespace(std::string value);
std::string decodeHtmlEntities(std::string value);
std::string stripHtml(const std::string& html);
std::string limitPreviewText(const std::string& text, size_t maxLength);

}  // namespace OnlineTextUtils
