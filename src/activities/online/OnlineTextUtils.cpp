#include "OnlineTextUtils.h"

#include <algorithm>
#include <cctype>

namespace OnlineTextUtils {

std::string trimAscii(std::string value) {
  auto isNotSpace = [](unsigned char ch) { return std::isspace(ch) == 0; };
  value.erase(value.begin(), std::find_if(value.begin(), value.end(), isNotSpace));
  value.erase(std::find_if(value.rbegin(), value.rend(), isNotSpace).base(), value.end());
  return value;
}

std::string collapseWhitespace(std::string value) {
  std::string out;
  out.reserve(value.size());
  bool previousWasSpace = false;
  for (unsigned char ch : value) {
    if (std::isspace(ch)) {
      if (!previousWasSpace) {
        out.push_back(' ');
      }
      previousWasSpace = true;
    } else {
      out.push_back(static_cast<char>(ch));
      previousWasSpace = false;
    }
  }
  return trimAscii(std::move(out));
}

std::string decodeHtmlEntities(std::string value) {
  const std::pair<const char*, const char*> replacements[] = {
      {"&quot;", "\""}, {"&amp;", "&"}, {"&lt;", "<"}, {"&gt;", ">"}, {"&#039;", "'"}, {"&nbsp;", " "}};
  for (const auto& replacement : replacements) {
    size_t pos = 0;
    while ((pos = value.find(replacement.first, pos)) != std::string::npos) {
      value.replace(pos, std::char_traits<char>::length(replacement.first), replacement.second);
      pos += std::char_traits<char>::length(replacement.second);
    }
  }
  return value;
}

std::string stripHtml(const std::string& html) {
  std::string out;
  out.reserve(html.size());
  bool inTag = false;
  for (char ch : html) {
    if (ch == '<') {
      inTag = true;
      continue;
    }
    if (ch == '>') {
      inTag = false;
      out.push_back(' ');
      continue;
    }
    if (!inTag) {
      out.push_back(ch);
    }
  }
  return collapseWhitespace(decodeHtmlEntities(std::move(out)));
}

std::string limitPreviewText(const std::string& text, size_t maxLength) {
  if (text.size() <= maxLength) {
    return text;
  }
  if (maxLength <= 3) {
    return text.substr(0, maxLength);
  }
  return trimAscii(text.substr(0, maxLength - 3)) + "...";
}

}  // namespace OnlineTextUtils
