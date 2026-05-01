#include "HakoPluginExecutor.h"

#include <Arduino.h>
#include <Logging.h>

#include <algorithm>
#include <cctype>
#include <cstdlib>

#include "network/HttpDownloader.h"
#include "network/OnlineDebugLog.h"
#include "util/HtmlLiteTokenizer.h"
#include "util/StringUtils.h"

namespace {
constexpr char MODULE[] = "HAKO";
constexpr uint32_t CHAPTER_FETCH_RETRY_DELAYS_MS[] = {1500, 5000};
constexpr size_t HOME_FETCH_CAP_BYTES = 48 * 1024;
constexpr size_t SEARCH_FETCH_CAP_BYTES = 48 * 1024;
constexpr size_t DETAIL_FETCH_CAP_BYTES = 72 * 1024;
constexpr size_t TOC_FETCH_CAP_BYTES = 96 * 1024;
constexpr size_t CHAPTER_FETCH_CAP_BYTES = 160 * 1024;
constexpr size_t DETAIL_DESCRIPTION_CAP_BYTES = 4096;
constexpr const char* HOME_FEED_URL = "https://docln.sbs/danh-sach?sapxep=truyenmoi";
constexpr uint32_t HEAVY_FALLBACK_MIN_FREE_HEAP = 98000;
constexpr uint32_t HEAVY_FALLBACK_MIN_LARGEST_BLOCK = 72000;

void capRetainedHtml(std::string& html, size_t maxBytes) {
  if (html.size() <= maxBytes) {
    return;
  }
  html.resize(maxBytes);
  html.shrink_to_fit();
}

std::string htmlDecode(std::string s) {
  auto replaceAll = [](std::string& value, const std::string& from, const std::string& to) {
    size_t pos = 0;
    while ((pos = value.find(from, pos)) != std::string::npos) {
      value.replace(pos, from.length(), to);
      pos += to.length();
    }
  };
  replaceAll(s, "&quot;", "\"");
  replaceAll(s, "&amp;", "&");
  replaceAll(s, "&lt;", "<");
  replaceAll(s, "&gt;", ">");
  replaceAll(s, "&#039;", "'");
  replaceAll(s, "&nbsp;", " ");
  return s;
}

std::string trim(std::string value) {
  auto notSpace = [](unsigned char ch) { return !std::isspace(ch); };
  value.erase(value.begin(), std::find_if(value.begin(), value.end(), notSpace));
  value.erase(std::find_if(value.rbegin(), value.rend(), notSpace).base(), value.end());
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
  return trim(out);
}

std::string cleanupDecorativeSuffix(std::string value) {
  value = trim(std::move(value));
  while (!value.empty() && (value.back() == '*' || value.back() == '|' || value.back() == '-')) {
    value.pop_back();
    value = trim(std::move(value));
  }
  return value;
}

std::string stripTags(const std::string& html) {
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
    if (!inTag) out.push_back(ch);
  }
  return cleanupDecorativeSuffix(collapseWhitespace(htmlDecode(out)));
}

std::string makeAbsoluteUrl(const std::string& url) {
  if (url.rfind("http://", 0) == 0 || url.rfind("https://", 0) == 0) {
    return url;
  }
  if (!url.empty() && url[0] == '/') {
    return std::string(HakoPluginExecutor::BASE_URL) + url;
  }
  return std::string(HakoPluginExecutor::BASE_URL) + "/" + url;
}

bool extractTagContent(const std::string& html, const std::string& marker, const std::string& openTagEnd,
                       const std::string& closeTag, std::string& out) {
  const size_t markerPos = html.find(marker);
  if (markerPos == std::string::npos) return false;
  const size_t start = html.find(openTagEnd, markerPos);
  if (start == std::string::npos) return false;
  const size_t contentStart = start + openTagEnd.size();
  const size_t end = html.find(closeTag, contentStart);
  if (end == std::string::npos) return false;
  out = html.substr(contentStart, end - contentStart);
  return true;
}

bool extractAttrNear(const std::string& html, const std::string& marker, const std::string& attr, std::string& out) {
  const size_t markerPos = html.find(marker);
  if (markerPos == std::string::npos) return false;
  const std::string needle = attr + "=\"";
  const size_t attrPos = html.find(needle, markerPos);
  if (attrPos == std::string::npos) return false;
  const size_t valueStart = attrPos + needle.size();
  const size_t valueEnd = html.find('"', valueStart);
  if (valueEnd == std::string::npos) return false;
  out = htmlDecode(html.substr(valueStart, valueEnd - valueStart));
  return true;
}

std::string extractStyleUrl(const std::string& style) {
  const size_t urlPos = style.find("url(");
  if (urlPos == std::string::npos) return "";
  size_t start = urlPos + 4;
  while (start < style.size() && (style[start] == '\'' || style[start] == '"' || std::isspace((unsigned char)style[start]))) {
    start++;
  }
  size_t end = style.find(')', start);
  if (end == std::string::npos) end = style.size();
  while (end > start && (style[end - 1] == '\'' || style[end - 1] == '"' || std::isspace((unsigned char)style[end - 1]))) {
    end--;
  }
  return htmlDecode(style.substr(start, end - start));
}

bool shouldAttemptHeavyHtmlFallback() {
  return ESP.getFreeHeap() >= HEAVY_FALLBACK_MIN_FREE_HEAP && ESP.getMaxAllocHeap() >= HEAVY_FALLBACK_MIN_LARGEST_BLOCK;
}

std::string getQueryParamSeparator(const std::string& url) { return url.find('?') == std::string::npos ? "?" : "&"; }

bool hasHakoVolumeSegment(const std::string& url) {
  const size_t tPos = url.find("/t");
  return tPos != std::string::npos && tPos + 2 < url.size() && std::isdigit(static_cast<unsigned char>(url[tPos + 2])) != 0;
}

std::string urlEncode(const std::string& value) {
  static constexpr char kHex[] = "0123456789ABCDEF";
  std::string out;
  out.reserve(value.size() * 3);
  for (unsigned char ch : value) {
    if (std::isalnum(ch) || ch == '-' || ch == '_' || ch == '.' || ch == '~') {
      out.push_back(static_cast<char>(ch));
      continue;
    }
    out.push_back('%');
    out.push_back(kHex[(ch >> 4) & 0x0F]);
    out.push_back(kHex[ch & 0x0F]);
  }
  return out;
}

std::string toLowerAscii(std::string value) {
  std::transform(value.begin(), value.end(), value.begin(),
                 [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
  return value;
}

std::string normalizeDisplayText(std::string value) {
  return collapseWhitespace(StringUtils::toDisplaySafeAscii(trim(std::move(value))));
}

bool startsWithAscii(const std::string& value, const char* prefix) {
  const size_t prefixLength = std::char_traits<char>::length(prefix);
  return value.size() >= prefixLength && value.compare(0, prefixLength, prefix) == 0;
}

std::string compactHomeSectionLabel(std::string value) {
  value = normalizeDisplayText(std::move(value));
  const std::string lower = toLowerAscii(value);

  if (lower.find("sang tac") != std::string::npos && lower.find("moi nhat") != std::string::npos) {
    return "Moi nhat";
  }
  if (lower == "ai moi nhat" || (lower.find(" ai ") != std::string::npos && lower.find("moi nhat") != std::string::npos)) {
    return "AI moi nhat";
  }
  if (lower.find("doc nhieu") != std::string::npos || lower.find("trong ngay") != std::string::npos) {
    return "Hot hom nay";
  }
  if (lower.find("vua dang") != std::string::npos) {
    return "Vua dang";
  }
  if (lower.find("cap nhat") != std::string::npos) {
    return "Vua cap nhat";
  }
  if (lower.find("moi nhat") != std::string::npos) {
    return "Moi nhat";
  }
  return value;
}

std::string compactHomeVolumeTitle(std::string value) {
  value = normalizeDisplayText(std::move(value));
  if (value.empty()) {
    return value;
  }

  const std::string lower = toLowerAscii(value);
  if (lower == "toan tap" || lower == "toan van" || lower == "oneshot" || lower == "web novel" || lower == "wn") {
    return value;
  }
  if (startsWithAscii(lower, "tap ")) {
    return "Tap " + trim(value.substr(4));
  }
  if (startsWithAscii(lower, "vol ")) {
    return "Vol " + trim(value.substr(4));
  }
  if (startsWithAscii(lower, "volume ")) {
    return "Vol " + trim(value.substr(7));
  }
  if (startsWithAscii(lower, "quyen ")) {
    return "Quyen " + trim(value.substr(6));
  }
  return value;
}

std::string compactHomeLatestChapterTitle(std::string value) {
  value = normalizeDisplayText(std::move(value));
  if (value.empty()) {
    return value;
  }

  const std::string lower = toLowerAscii(value);
  if (lower == "oneshot") {
    return "Oneshot";
  }
  if (startsWithAscii(lower, "chuong ")) {
    return "Ch. " + trim(value.substr(7));
  }
  if (startsWithAscii(lower, "chap ")) {
    return "Ch. " + trim(value.substr(5));
  }
  if (startsWithAscii(lower, "chapter ")) {
    return "Ch. " + trim(value.substr(8));
  }
  if (startsWithAscii(lower, "ch_")) {
    return "Ch. " + trim(value.substr(3));
  }
  if (lower.find("loi mo dau") != std::string::npos || lower == "mo dau" || lower.find("prologue") != std::string::npos) {
    return "Prologue";
  }

  const size_t dashPos = value.find(" - ");
  if (dashPos != std::string::npos && dashPos + 3 < value.size()) {
    const std::string right = trim(value.substr(dashPos + 3));
    const std::string rightLower = toLowerAscii(right);
    const std::string left = toLowerAscii(trim(value.substr(0, dashPos)));
    if (rightLower == "oneshot" && left.find("chuong") == std::string::npos &&
        left.find("chap") == std::string::npos && left.find("chapter") == std::string::npos) {
      return "Oneshot";
    }
  }

  return value;
}

std::string buildHomeDisplaySubtitle(const std::string& sectionLabel, const std::string& volumeTitle,
                                     const std::string& latestChapterTitle) {
  std::string subtitle;
  const std::string compactSection = compactHomeSectionLabel(sectionLabel);
  const std::string compactLatest = compactHomeLatestChapterTitle(latestChapterTitle);
  const std::string compactVolume = compactHomeVolumeTitle(volumeTitle);

  if (!compactSection.empty()) {
    subtitle = "[" + compactSection + "]";
  }
  if (!compactLatest.empty()) {
    subtitle = subtitle.empty() ? compactLatest : subtitle + " " + compactLatest;
  } else if (!compactVolume.empty()) {
    subtitle = subtitle.empty() ? compactVolume : subtitle + " " + compactVolume;
  }
  return subtitle;
}

bool hasSeenUrl(const std::vector<std::string>& seenUrls, const std::string& url) {
  return std::find(seenUrls.begin(), seenUrls.end(), url) != seenUrls.end();
}

bool appendHomeFeedResultFromBlock(const std::string& block, const std::string& sectionLabel,
                                   std::vector<std::string>& seenUrls, std::vector<HakoSearchResult>& outResults,
                                   bool styleCoverFallback = false) {
  HakoSearchResult result;
  std::string href;
  if (!extractAttrNear(block, "series-title", "href", href)) return false;
  result.url = makeAbsoluteUrl(href);
  if (hasSeenUrl(seenUrls, result.url)) {
    return false;
  }

  std::string titleHtml;
  if (!extractTagContent(block, "series-title", ">", "</a>", titleHtml)) return false;
  result.title = stripTags(titleHtml);

  std::string chapterHtml;
  std::string volumeHtml;
  if (extractTagContent(block, "chapter-title", ">", "</div>", chapterHtml)) {
    result.homeLatestChapterTitle = stripTags(chapterHtml);
  }
  if (extractTagContent(block, "volume-title", ">", "</div>", volumeHtml)) {
    result.homeVolumeTitle = stripTags(volumeHtml);
  }

  result.homeSectionLabel = sectionLabel;
  result.homeDisplaySubtitle =
      buildHomeDisplaySubtitle(result.homeSectionLabel, result.homeVolumeTitle, result.homeLatestChapterTitle);

  if (!result.homeSectionLabel.empty()) {
    result.description = result.homeSectionLabel;
  }
  if (!result.homeVolumeTitle.empty()) {
    result.description = result.description.empty() ? result.homeVolumeTitle
                                                    : result.description + " | " + result.homeVolumeTitle;
  }
  if (!result.homeLatestChapterTitle.empty()) {
    result.description = result.description.empty() ? result.homeLatestChapterTitle
                                                    : result.description + " | " + result.homeLatestChapterTitle;
  }

  if (!extractAttrNear(block, "img-in-ratio", "data-bg", result.coverUrl) && styleCoverFallback) {
    std::string style;
    if (extractAttrNear(block, "img-in-ratio", "style", style)) {
      result.coverUrl = extractStyleUrl(style);
    }
  }

  seenUrls.push_back(result.url);
  outResults.push_back(std::move(result));
  return true;
}

std::vector<int> extractIntegers(const std::string& value) {
  std::vector<int> numbers;
  int current = -1;
  for (unsigned char ch : value) {
    if (std::isdigit(ch)) {
      if (current < 0) current = 0;
      current = current * 10 + (ch - '0');
    } else if (current >= 0) {
      numbers.push_back(current);
      current = -1;
    }
  }
  if (current >= 0) {
    numbers.push_back(current);
  }
  return numbers;
}

std::vector<int> extractChapterSortNumbers(const std::string& value) {
  const std::string lower = toLowerAscii(StringUtils::toDisplaySafeAscii(value));

  size_t markerPos = lower.find("chuong");
  if (markerPos == std::string::npos) {
    markerPos = lower.find("chapter");
  }
  if (markerPos == std::string::npos) {
    markerPos = lower.find("mo dau");
  }
  if (markerPos == std::string::npos) {
    markerPos = lower.find("prologue");
  }

  if (markerPos != std::string::npos) {
    return extractIntegers(lower.substr(markerPos));
  }
  return extractIntegers(lower);
}

bool isPrologueTitle(const std::string& title) {
  const std::string lower = toLowerAscii(StringUtils::toDisplaySafeAscii(title));
  return lower.find("mo dau") != std::string::npos || lower.find("prologue") != std::string::npos;
}

int compareNumberVectors(const std::vector<int>& left, const std::vector<int>& right) {
  const size_t commonCount = std::min(left.size(), right.size());
  for (size_t i = 0; i < commonCount; ++i) {
    if (left[i] < right[i]) return -1;
    if (left[i] > right[i]) return 1;
  }
  if (left.size() < right.size()) return -1;
  if (left.size() > right.size()) return 1;
  return 0;
}

void normalizeTocOrder(std::vector<HakoChapterRef>& toc) {
  std::stable_sort(toc.begin(), toc.end(), [](const HakoChapterRef& left, const HakoChapterRef& right) {
    const bool leftPrologue = isPrologueTitle(left.title);
    const bool rightPrologue = isPrologueTitle(right.title);
    if (leftPrologue != rightPrologue) {
      return leftPrologue;
    }

    const int titleCompare = compareNumberVectors(extractChapterSortNumbers(left.title), extractChapterSortNumbers(right.title));
    if (titleCompare != 0) {
      return titleCompare < 0;
    }

    const int urlCompare = compareNumberVectors(extractIntegers(left.url), extractIntegers(right.url));
    if (urlCompare != 0) {
      return urlCompare < 0;
    }

    return left.index < right.index;
  });

  for (size_t i = 0; i < toc.size(); ++i) {
    toc[i].index = static_cast<uint32_t>(i + 1);
  }
}

std::vector<std::string> collectBlocks(const std::string& html, const std::string& marker) {
  std::vector<std::string> blocks;
  size_t pos = 0;
  while ((pos = html.find(marker, pos)) != std::string::npos) {
    size_t next = html.find(marker, pos + marker.size());
    if (next == std::string::npos) next = html.size();
    blocks.push_back(html.substr(pos, next - pos));
    pos = next;
  }
  return blocks;
}

bool extractSectionBlocks(const std::string& html, const std::string& marker, std::vector<std::string>& outBlocks) {
  outBlocks.clear();
  size_t pos = 0;
  while ((pos = html.find(marker, pos)) != std::string::npos) {
    const size_t end = html.find("</section>", pos);
    if (end == std::string::npos) {
      break;
    }
    outBlocks.push_back(html.substr(pos, end + 10 - pos));
    pos = end + 10;
  }
  return !outBlocks.empty();
}

std::string extractSectionLabel(const std::string& sectionHtml) {
  std::string headerHtml;
  if (!extractTagContent(sectionHtml, "section-title", ">", "</header>", headerHtml)) {
    return "";
  }
  return stripTags(headerHtml);
}

std::string findBalancedDiv(const std::string& html, const std::string& marker) {
  const size_t start = html.find(marker);
  if (start == std::string::npos) return "";
  size_t open = html.rfind("<div", start);
  if (open == std::string::npos) open = start;
  size_t pos = open;
  int depth = 0;
  while (pos < html.size()) {
    if (html.compare(pos, 4, "<div") == 0) {
      depth++;
      pos += 4;
      continue;
    }
    if (html.compare(pos, 5, "</div") == 0) {
      depth--;
      pos += 5;
      if (depth == 0) {
        const size_t end = html.find('>', pos);
        if (end != std::string::npos) {
          return html.substr(open, end + 1 - open);
        }
        break;
      }
      continue;
    }
    pos++;
  }
  return "";
}

bool containsAsciiCaseInsensitive(const std::string& haystack, const std::string& needle) {
  if (needle.empty()) return true;
  return toLowerAscii(haystack).find(toLowerAscii(needle)) != std::string::npos;
}

bool containsVerificationMarker(const std::string& html) {
  return containsAsciiCaseInsensitive(html, "captcha") || containsAsciiCaseInsensitive(html, "cloudflare") ||
         containsAsciiCaseInsensitive(html, "access denied") || containsAsciiCaseInsensitive(html, "ddos") ||
         containsAsciiCaseInsensitive(html, "xÃƒÆ’Ã‚Â¡c minh") || containsAsciiCaseInsensitive(html, "verify you are human");
}


bool parseHomeFeedBlocks(const std::string& html, std::vector<HakoSearchResult>& outResults) {
  outResults.clear();
  std::vector<std::string> seenUrls;
  std::vector<std::string> sections;
  if (extractSectionBlocks(html, "thumb-section-flow", sections)) {
    for (const std::string& section : sections) {
      const std::string label = extractSectionLabel(section);
      const std::vector<std::string> blocks = collectBlocks(section, "thumb-item-flow");
      for (const std::string& block : blocks) {
        appendHomeFeedResultFromBlock(block, label, seenUrls, outResults, true);
      }
    }
  }

  if (!outResults.empty()) {
    return true;
  }

  const std::vector<std::string> blocks = collectBlocks(html, "thumb-item-flow");
  for (const std::string& block : blocks) {
    appendHomeFeedResultFromBlock(block, std::string{}, seenUrls, outResults, true);
  }
  return !outResults.empty();
}

bool parseSearchResultBlocks(const std::string& html, std::vector<HakoSearchResult>& outResults) {
  outResults.clear();
  std::vector<std::string> seenUrls;
  const std::vector<std::string> blocks = collectBlocks(html, "thumb-item-flow");
  for (const std::string& block : blocks) {
    appendHomeFeedResultFromBlock(block, std::string{}, seenUrls, outResults, true);
  }
  return !outResults.empty();
}

std::string extractTagNameAt(const std::string& html, size_t tagStart) {
  if (tagStart >= html.size() || html[tagStart] != '<') {
    return "";
  }

  size_t pos = tagStart + 1;
  while (pos < html.size() && std::isspace(static_cast<unsigned char>(html[pos]))) {
    ++pos;
  }

  const size_t nameStart = pos;
  while (pos < html.size() && (std::isalnum(static_cast<unsigned char>(html[pos])) || html[pos] == '-' || html[pos] == ':')) {
    ++pos;
  }

  if (pos <= nameStart) {
    return "";
  }
  return html.substr(nameStart, pos - nameStart);
}

std::string extractTagTextByMarker(const std::string& html, const std::string& marker) {
  const size_t markerPos = html.find(marker);
  if (markerPos == std::string::npos) {
    return "";
  }

  const size_t tagStart = html.rfind('<', markerPos);
  if (tagStart == std::string::npos) {
    return "";
  }

  const std::string tagName = extractTagNameAt(html, tagStart);
  if (tagName.empty()) {
    return "";
  }

  const size_t openEnd = html.find('>', markerPos);
  if (openEnd == std::string::npos) {
    return "";
  }

  const std::string closeTag = "</" + tagName + ">";
  const size_t closePos = html.find(closeTag, openEnd + 1);
  if (closePos == std::string::npos) {
    return "";
  }

  return stripTags(html.substr(openEnd + 1, closePos - openEnd - 1));
}

std::vector<std::string> collectBalancedDivBlocks(const std::string& html, const std::string& marker) {
  std::vector<std::string> blocks;
  size_t searchPos = 0;
  while (searchPos < html.size()) {
    const size_t markerPos = html.find(marker, searchPos);
    if (markerPos == std::string::npos) {
      break;
    }

    const size_t divStart = html.rfind("<div", markerPos);
    if (divStart == std::string::npos) {
      searchPos = markerPos + marker.size();
      continue;
    }

    const std::string block = findBalancedDiv(html.substr(divStart), marker);
    if (block.empty()) {
      searchPos = markerPos + marker.size();
      continue;
    }

    blocks.push_back(block);
    searchPos = divStart + block.size();
  }
  return blocks;
}

void parseDetailInfoBlocks(const std::string& html, HakoBookDetail& outDetail) {
  const std::vector<std::string> infoBlocks = collectBalancedDivBlocks(html, "info-item");
  for (const std::string& block : infoBlocks) {
    const std::string label = toLowerAscii(extractTagTextByMarker(block, "info-name"));
    const std::string value = extractTagTextByMarker(block, "info-value");
    if (label.empty() || value.empty()) {
      continue;
    }

    if (label.find("tac gia") != std::string::npos) {
      outDetail.author = value;
    } else if (label.find("tinh trang") != std::string::npos) {
      const std::string status = toLowerAscii(value);
      outDetail.ongoing = status.find("dang tien hanh") != std::string::npos;
    }
  }
}

bool parseDetailFromHtml(const std::string& html, const std::string& resolvedUrl, HakoBookDetail& outDetail) {
  outDetail = HakoBookDetail{};
  outDetail.url = resolvedUrl;

  outDetail.title = extractTagTextByMarker(html, "series-name");

  std::string coverBlock = findBalancedDiv(html, "series-cover");
  if (!coverBlock.empty()) {
    if (!extractAttrNear(coverBlock, "img-in-ratio", "data-bg", outDetail.coverUrl)) {
      std::string style;
      if (extractAttrNear(coverBlock, "img-in-ratio", "style", style)) {
        outDetail.coverUrl = extractStyleUrl(style);
      }
    }
  }

  std::string summaryBlock = findBalancedDiv(html, "summary-content");
  if (!summaryBlock.empty()) {
    const std::string summary = stripTags(summaryBlock);
    if (!summary.empty()) {
      outDetail.descriptionHtml = "<p>" + summary + "</p>";
      capRetainedHtml(outDetail.descriptionHtml, DETAIL_DESCRIPTION_CAP_BYTES);
    }
  }

  size_t genrePos = 0;
  while ((genrePos = html.find("series-gerne-item", genrePos)) != std::string::npos) {
    const size_t openEnd = html.find('>', genrePos);
    if (openEnd == std::string::npos) {
      break;
    }

    const size_t closePos = html.find("</a>", openEnd + 1);
    if (closePos == std::string::npos) {
      break;
    }

    const std::string genre = stripTags(html.substr(openEnd + 1, closePos - openEnd - 1));
    if (!genre.empty()) {
      outDetail.genres.push_back(genre);
    }
    genrePos = closePos + 4;
  }

  parseDetailInfoBlocks(html, outDetail);
  return !outDetail.title.empty();
}

void renumberToc(std::vector<HakoChapterRef>& toc, uint32_t startIndex = 1) {
  for (auto& ref : toc) {
    ref.index = startIndex++;
  }
}

std::string extractVolumeTitleFromPageTitle(const std::string& html) {
  const std::string pageTitle = extractTagTextByMarker(html, "<title>");
  if (pageTitle.empty()) {
    return "";
  }

  const size_t sepPos = pageTitle.find(" - Cổng Light Novel");
  const std::string trimmed = sepPos == std::string::npos ? pageTitle : pageTitle.substr(0, sepPos);
  const size_t seriesSep = trimmed.find(" - ");
  if (seriesSep == std::string::npos || seriesSep + 3 >= trimmed.size()) {
    return "";
  }
  return trim(trimmed.substr(seriesSep + 3));
}

void collectUniqueVolumeUrls(const std::string& html, std::vector<std::string>& outUrls) {
  std::vector<std::string> seen;

  auto appendCandidate = [&](std::string candidate) {
    if (candidate.empty()) {
      return;
    }

    const size_t quotePos = candidate.find('"');
    if (quotePos != std::string::npos) {
      candidate.resize(quotePos);
    }
    const size_t apostrophePos = candidate.find('\'');
    if (apostrophePos != std::string::npos) {
      candidate.resize(apostrophePos);
    }
    const size_t anglePos = candidate.find('<');
    if (anglePos != std::string::npos) {
      candidate.resize(anglePos);
    }
    const size_t spacePos = candidate.find(' ');
    if (spacePos != std::string::npos) {
      candidate.resize(spacePos);
    }

    candidate = htmlDecode(trim(candidate));
    if (!hasHakoVolumeSegment(candidate)) {
      return;
    }

    const std::string absoluteUrl = makeAbsoluteUrl(candidate);
    if (!hasSeenUrl(seen, absoluteUrl)) {
      seen.push_back(absoluteUrl);
      outUrls.push_back(absoluteUrl);
    }
  };

  size_t searchPos = 0;
  while (searchPos < html.size()) {
    const size_t hrefPos = html.find("href=\"", searchPos);
    if (hrefPos == std::string::npos) {
      break;
    }

    const size_t valueStart = hrefPos + 6;
    const size_t valueEnd = html.find('"', valueStart);
    if (valueEnd == std::string::npos) {
      break;
    }

    appendCandidate(html.substr(valueStart, valueEnd - valueStart));

    searchPos = valueEnd + 1;
  }

  if (!outUrls.empty()) {
    return;
  }

  searchPos = 0;
  while (searchPos < html.size()) {
    const size_t urlPos = html.find("/truyen/", searchPos);
    if (urlPos == std::string::npos) {
      break;
    }

    size_t endPos = urlPos;
    while (endPos < html.size()) {
      const char ch = html[endPos];
      if (ch == '"' || ch == '\'' || ch == '<' || std::isspace(static_cast<unsigned char>(ch)) != 0) {
        break;
      }
      ++endPos;
    }
    appendCandidate(html.substr(urlPos, endPos - urlPos));
    searchPos = endPos;
  }
}

std::string extractChapterContainerHtml(const std::string& html) {
  std::string chapterHtml = findBalancedDiv(html, "id=\"chapter-content\"");
  if (!chapterHtml.empty()) {
    return chapterHtml;
  }

  chapterHtml = findBalancedDiv(html, "id=\"chapter-c-protected\"");
  if (!chapterHtml.empty()) {
    return chapterHtml;
  }

  return "";
}

class RawBalancedDivStreamExtractor {
 public:
  RawBalancedDivStreamExtractor(std::string startMarker, size_t maxBytes)
      : startMarker_(std::move(startMarker)), maxBytes_(maxBytes) {
    tail_.reserve(std::max<size_t>(startMarker_.size(), 32));
    tagBuffer_.reserve(128);
  }

  bool feed(const uint8_t* data, size_t size) {
    if (!data || size == 0 || finished_ || overflowed_) {
      return !overflowed_;
    }

    if (!started_) {
      std::string candidate = tail_;
      candidate.append(reinterpret_cast<const char*>(data), size);
      const size_t markerPos = candidate.find(startMarker_);
      if (markerPos == std::string::npos) {
        const size_t keep = startMarker_.size() > 1 ? startMarker_.size() - 1 : 0;
        if (candidate.size() > keep) {
          tail_.assign(candidate.data() + candidate.size() - keep, keep);
        } else {
          tail_ = std::move(candidate);
        }
        return true;
      }

      const size_t divStart = candidate.rfind("<div", markerPos);
      const size_t captureStart = divStart == std::string::npos ? markerPos : divStart;
      started_ = true;
      tail_.clear();
      return appendAndScan(candidate.data() + captureStart, candidate.size() - captureStart);
    }

    return appendAndScan(reinterpret_cast<const char*>(data), size);
  }

  bool started() const { return started_; }
  bool finished() const { return finished_; }
  bool overflowed() const { return overflowed_; }
  const std::string& captured() const { return captured_; }

 private:
  bool appendAndScan(const char* data, size_t size) {
    if (!data || size == 0) {
      return true;
    }

    const size_t room = maxBytes_ > captured_.size() ? maxBytes_ - captured_.size() : 0;
    if (room == 0) {
      overflowed_ = true;
      return false;
    }

    const size_t toCopy = std::min(room, size);
    captured_.append(data, toCopy);
    scanAppended(data, toCopy);
    if (toCopy < size && !finished_) {
      overflowed_ = true;
      return false;
    }
    return !overflowed_ && !finished_;
  }

  void scanAppended(const char* data, size_t size) {
    for (size_t i = 0; i < size && !finished_; ++i) {
      const char ch = data[i];
      if (inTag_) {
        tagBuffer_.push_back(ch);
        if (ch == '>') {
          finalizeTag();
        }
        continue;
      }

      if (ch == '<') {
        inTag_ = true;
        tagBuffer_.clear();
        tagBuffer_.push_back(ch);
      }
    }
  }

  void finalizeTag() {
    inTag_ = false;
    const std::string lowerTag = toLowerAscii(tagBuffer_);
    if (lowerTag.rfind("<div", 0) == 0) {
      ++depth_;
    } else if (lowerTag.rfind("</div", 0) == 0) {
      --depth_;
      if (started_ && depth_ <= 0) {
        finished_ = true;
      }
    }
    tagBuffer_.clear();
  }

  std::string startMarker_;
  size_t maxBytes_ = 0;
  std::string tail_;
  std::string captured_;
  std::string tagBuffer_;
  int depth_ = 0;
  bool started_ = false;
  bool finished_ = false;
  bool overflowed_ = false;
  bool inTag_ = false;
};

std::string streamChapterContainerHtml(const std::string& url, const std::string& marker) {
  RawBalancedDivStreamExtractor extractor(marker, CHAPTER_FETCH_CAP_BYTES);
  const bool fetchOk = HttpDownloader::fetchUrlFromMarkerStreamed(
      url, marker, [&extractor](const uint8_t* data, size_t size) { return extractor.feed(data, size); });
  if (fetchOk && extractor.started() && extractor.finished() && !extractor.overflowed()) {
    return extractor.captured();
  }
  if (extractor.overflowed()) {
    HttpDownloader::clearLastError();
  }
  return "";
}

void logChapterAttemptFailure(const HakoChapterRef& ref, size_t attemptIndex, const std::string& html, bool fetchOk) {
  const bool hasChapterContent = html.find("id=\"chapter-content\"") != std::string::npos;
  const bool hasProtectedContent = html.find("id=\"chapter-c-protected\"") != std::string::npos;
  LOG_INF(MODULE,
          "Fetch chapter attempt %u failed for %s | fetchOk=%d html=%u chapter=%d protected=%d verify=%d",
          static_cast<unsigned>(attemptIndex + 1), ref.url.c_str(), fetchOk ? 1 : 0, static_cast<unsigned>(html.size()),
          hasChapterContent ? 1 : 0, hasProtectedContent ? 1 : 0, containsVerificationMarker(html) ? 1 : 0);
}

std::vector<std::string> parseJsonStringArray(const std::string& jsonArray) {
  std::vector<std::string> out;
  bool inString = false;
  std::string current;
  for (size_t i = 0; i < jsonArray.size(); i++) {
    char ch = jsonArray[i];
    if (!inString) {
      if (ch == '"') {
        inString = true;
        current.clear();
      }
      continue;
    }
    if (ch == '\\' && i + 1 < jsonArray.size()) {
      current.push_back(jsonArray[++i]);
      continue;
    }
    if (ch == '"') {
      inString = false;
      out.push_back(current);
      current.clear();
      continue;
    }
    current.push_back(ch);
  }
  return out;
}

std::string base64Decode(const std::string& input) {
  static constexpr unsigned char kDecTable[256] = {
      64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,
      64,64,64,64,64,64,64,64,64,64,64,62,64,64,64,63,52,53,54,55,56,57,58,59,60,61,64,64,64,65,64,64,
      64,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,64,64,64,64,64,
      64,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,64,64,64,64,64,
      64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,
      64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,
      64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,
      64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64};
  std::string out;
  int val = 0;
  int valb = -8;
  for (unsigned char c : input) {
    if (c == '=') break;
    unsigned char d = kDecTable[c];
    if (d == 64) continue;
    if (d == 65) break;
    val = (val << 6) + d;
    valb += 6;
    if (valb >= 0) {
      out.push_back(char((val >> valb) & 0xFF));
      valb -= 8;
    }
  }
  return out;
}

std::string xorDecodeBase64(const std::string& encoded, const std::string& key) {
  const std::string decoded = base64Decode(encoded);
  if (key.empty()) {
    return decoded;
  }
  std::string out;
  out.reserve(decoded.size());
  for (size_t i = 0; i < decoded.size(); i++) {
    out.push_back(decoded[i] ^ key[i % key.size()]);
  }
  return out;
}

std::string decodeProtectedContent(const std::string& chapterHtml) {
  const std::string protectedMarker = "id=\"chapter-c-protected\"";
  const size_t markerPos = chapterHtml.find(protectedMarker);
  if (markerPos == std::string::npos) {
    return chapterHtml;
  }

  std::string mode, key, chunksJson;
  const std::string protectedHtml = chapterHtml.substr(markerPos);
  extractAttrNear(protectedHtml, "data-s", "data-s", mode);
  extractAttrNear(protectedHtml, "data-k", "data-k", key);
  extractAttrNear(protectedHtml, "data-c", "data-c", chunksJson);
  chunksJson = htmlDecode(chunksJson);
  auto chunks = parseJsonStringArray(chunksJson);
  std::sort(chunks.begin(), chunks.end(),
            [](const std::string& a, const std::string& b) { return std::atoi(a.substr(0, 4).c_str()) < std::atoi(b.substr(0, 4).c_str()); });

  std::string content;
  for (const auto& chunk : chunks) {
    const std::string part = chunk.size() > 4 ? chunk.substr(4) : "";
    if (mode == "xor_shuffle") {
      content += xorDecodeBase64(part, key);
    } else {
      content += base64Decode(part);
    }
  }

  const size_t divStart = chapterHtml.rfind("<div", markerPos);
  const size_t divEnd = chapterHtml.find("</div>", markerPos);
  if (divStart == std::string::npos || divEnd == std::string::npos) {
    return chapterHtml;
  }
  return chapterHtml.substr(0, divStart) + content + chapterHtml.substr(divEnd + 6);
}

void cleanupChapterHtml(std::string& html) {
  const char* patterns[] = {"<script", "<style", "<iframe"};
  for (const auto* pattern : patterns) {
    size_t pos = 0;
    while ((pos = html.find(pattern, pos)) != std::string::npos) {
      const size_t end = html.find('>', pos);
      const std::string closing = std::string("</") + std::string(pattern + 1) + ">";
      const size_t closePos = html.find(closing, end);
      if (closePos == std::string::npos) break;
      html.erase(pos, closePos + closing.size() - pos);
    }
  }
  while (true) {
    const size_t pos = html.find("&nbsp;");
    if (pos == std::string::npos) break;
    html.replace(pos, 6, " ");
  }
}
}  // namespace

bool classHasToken(const std::string& classAttr, const char* token) {
  const std::string lower = toLowerAscii(classAttr);
  const std::string needle = toLowerAscii(token);
  size_t pos = 0;
  while ((pos = lower.find(needle, pos)) != std::string::npos) {
    const bool leftOk = pos == 0 || std::isspace(static_cast<unsigned char>(lower[pos - 1])) || lower[pos - 1] == '-';
    const size_t end = pos + needle.size();
    const bool rightOk = end >= lower.size() || std::isspace(static_cast<unsigned char>(lower[end])) || lower[end] == '-';
    if (leftOk && rightOk) {
      return true;
    }
    pos = end;
  }
  return false;
}

const std::string* findAttrValue(const HtmlLiteStartTag& tag, const char* name) {
  for (const auto& attr : tag.attrs) {
    if (attr.name == name) {
      return &attr.value;
    }
  }
  return nullptr;
}

struct HtmlNodeContext {
  std::string tagName;
  std::string classAttr;
};

class HakoHomeStreamParser {
 public:
  HakoHomeStreamParser()
      : tokenizer_(
            [this](const HtmlLiteStartTag& tag) { return onStartTag(tag); },
            [this](const std::string& tagName) { return onEndTag(tagName); },
            [this](const std::string& text) { return onText(text); }) {}

  bool feed(const uint8_t* data, size_t size) {
    if (snippet_.size() < 2048 && data && size > 0) {
      const size_t toCopy = std::min<size_t>(2048 - snippet_.size(), size);
      snippet_.append(reinterpret_cast<const char*>(data), toCopy);
    }
    return tokenizer_.feed(reinterpret_cast<const char*>(data), size);
  }

  bool finish() {
    const bool ok = tokenizer_.finish();
    finalizeCurrentItem();
    return ok;
  }

  const std::vector<HakoSearchResult>& results() const { return results_; }
  std::vector<HakoSearchResult> takeResults() { return std::move(results_); }
  const std::string& snippet() const { return snippet_; }

 private:
  bool hasAncestorClass(const char* token) const {
    for (auto it = stack_.rbegin(); it != stack_.rend(); ++it) {
      if (classHasToken(it->classAttr, token)) {
        return true;
      }
    }
    return false;
  }

  static std::string normalizeText(const std::string& value) { return normalizeDisplayText(htmlDecode(value)); }

  void finalizeCurrentItem() {
    if (!itemActive_) {
      return;
    }

    currentItem_.title = normalizeText(currentItem_.title);
    currentItem_.homeLatestChapterTitle = normalizeText(currentItem_.homeLatestChapterTitle);
    currentItem_.homeVolumeTitle = normalizeText(currentItem_.homeVolumeTitle);
    currentItem_.homeSectionLabel = compactHomeSectionLabel(normalizeText(currentItem_.homeSectionLabel));
    currentItem_.homeDisplaySubtitle =
        buildHomeDisplaySubtitle(currentItem_.homeSectionLabel, currentItem_.homeVolumeTitle, currentItem_.homeLatestChapterTitle);

    if (!currentItem_.homeSectionLabel.empty()) {
      currentItem_.description = currentItem_.homeSectionLabel;
    }
    if (!currentItem_.homeVolumeTitle.empty()) {
      currentItem_.description =
          currentItem_.description.empty() ? currentItem_.homeVolumeTitle : currentItem_.description + " | " + currentItem_.homeVolumeTitle;
    }
    if (!currentItem_.homeLatestChapterTitle.empty()) {
      currentItem_.description = currentItem_.description.empty()
                                     ? currentItem_.homeLatestChapterTitle
                                     : currentItem_.description + " | " + currentItem_.homeLatestChapterTitle;
    }

    if (!currentItem_.title.empty() && !currentItem_.url.empty() && !hasSeenUrl(seenUrls_, currentItem_.url)) {
      seenUrls_.push_back(currentItem_.url);
      results_.push_back(currentItem_);
    }

    currentItem_ = HakoSearchResult{};
    itemActive_ = false;
    itemDepth_ = 0;
  }

  bool onStartTag(const HtmlLiteStartTag& tag) {
    std::string classAttr;
    if (const auto* classValue = findAttrValue(tag, "class")) {
      classAttr = *classValue;
    }

    stack_.push_back(HtmlNodeContext{tag.name, classAttr});
    const size_t depth = stack_.size();

    if (classHasToken(classAttr, "section-title")) {
      sectionTitleCapture_ = true;
      sectionTitleDepth_ = depth;
      sectionTitleText_.clear();
    }

    if (classHasToken(classAttr, "thumb-item-flow")) {
      finalizeCurrentItem();
      itemActive_ = true;
      itemDepth_ = depth;
      currentItem_ = HakoSearchResult{};
      currentItem_.homeSectionLabel = currentSectionLabel_;
    }

    if (!itemActive_) {
      return true;
    }

    if (classHasToken(classAttr, "img-in-ratio")) {
      if (const auto* dataBg = findAttrValue(tag, "data-bg")) {
        currentItem_.coverUrl = htmlDecode(*dataBg);
      } else if (const auto* style = findAttrValue(tag, "style")) {
        currentItem_.coverUrl = extractStyleUrl(*style);
      }
    }

    if (classHasToken(classAttr, "chapter-title")) {
      chapterCapture_ = true;
      chapterDepth_ = depth;
      chapterText_.clear();
    }

    if (classHasToken(classAttr, "volume-title")) {
      volumeCapture_ = true;
      volumeDepth_ = depth;
      volumeText_.clear();
    }

    if (tag.name == "a" && hasAncestorClass("series-title")) {
      seriesAnchorCapture_ = true;
      seriesAnchorDepth_ = depth;
      seriesAnchorText_.clear();
      if (const auto* href = findAttrValue(tag, "href")) {
        currentItem_.url = makeAbsoluteUrl(*href);
      }
      if (const auto* title = findAttrValue(tag, "title")) {
        currentItem_.title = htmlDecode(*title);
      }
    }

    return true;
  }

  bool onEndTag(const std::string&) {
    if (stack_.empty()) {
      return true;
    }

    const HtmlNodeContext node = stack_.back();
    const size_t depth = stack_.size();

    if (sectionTitleCapture_ && depth == sectionTitleDepth_ && classHasToken(node.classAttr, "section-title")) {
      currentSectionLabel_ = compactHomeSectionLabel(normalizeText(sectionTitleText_));
      sectionTitleCapture_ = false;
      sectionTitleText_.clear();
    }

    if (seriesAnchorCapture_ && depth == seriesAnchorDepth_ && node.tagName == "a") {
      if (currentItem_.title.empty()) {
        currentItem_.title = normalizeText(seriesAnchorText_);
      }
      seriesAnchorCapture_ = false;
      seriesAnchorText_.clear();
    }

    if (chapterCapture_ && depth == chapterDepth_ && classHasToken(node.classAttr, "chapter-title")) {
      currentItem_.homeLatestChapterTitle = normalizeText(chapterText_);
      chapterCapture_ = false;
      chapterText_.clear();
    }

    if (volumeCapture_ && depth == volumeDepth_ && classHasToken(node.classAttr, "volume-title")) {
      currentItem_.homeVolumeTitle = normalizeText(volumeText_);
      volumeCapture_ = false;
      volumeText_.clear();
    }

    if (itemActive_ && depth == itemDepth_ && classHasToken(node.classAttr, "thumb-item-flow")) {
      finalizeCurrentItem();
    }

    stack_.pop_back();
    return true;
  }

  bool onText(const std::string& text) {
    if (sectionTitleCapture_) {
      sectionTitleText_ += text;
    }
    if (seriesAnchorCapture_) {
      seriesAnchorText_ += text;
    }
    if (chapterCapture_) {
      chapterText_ += text;
    }
    if (volumeCapture_) {
      volumeText_ += text;
    }
    return true;
  }

  HtmlLiteTokenizer tokenizer_;
  std::vector<HtmlNodeContext> stack_;
  std::vector<std::string> seenUrls_;
  std::vector<HakoSearchResult> results_;
  std::string snippet_;
  std::string currentSectionLabel_;
  HakoSearchResult currentItem_;
  bool itemActive_ = false;
  size_t itemDepth_ = 0;
  bool sectionTitleCapture_ = false;
  size_t sectionTitleDepth_ = 0;
  std::string sectionTitleText_;
  bool seriesAnchorCapture_ = false;
  size_t seriesAnchorDepth_ = 0;
  std::string seriesAnchorText_;
  bool chapterCapture_ = false;
  size_t chapterDepth_ = 0;
  std::string chapterText_;
  bool volumeCapture_ = false;
  size_t volumeDepth_ = 0;
  std::string volumeText_;
};

class HakoSeriesPageStreamParser {
 public:
  HakoSeriesPageStreamParser()
      : tokenizer_(
            [this](const HtmlLiteStartTag& tag) { return onStartTag(tag); },
            [this](const std::string& tagName) { return onEndTag(tagName); },
            [this](const std::string& text) { return onText(text); }) {}

  bool feed(const uint8_t* data, size_t size) {
    if (snippet_.size() < 4096 && data && size > 0) {
      const size_t toCopy = std::min<size_t>(4096 - snippet_.size(), size);
      snippet_.append(reinterpret_cast<const char*>(data), toCopy);
    }
    return tokenizer_.feed(reinterpret_cast<const char*>(data), size);
  }

  bool finish() {
    const bool ok = tokenizer_.finish();
    finalizeInfoItem();
    return ok;
  }

  const HakoBookDetail& detail() const { return detail_; }
  const std::vector<HakoChapterRef>& toc() const { return toc_; }
  const std::string& snippet() const { return snippet_; }

 private:
  static std::string normalizeText(const std::string& value) { return normalizeDisplayText(htmlDecode(value)); }

  std::string resolveSectionTitle(const std::string& rawTitle) const {
    const std::string normalized = normalizeText(rawTitle);
    if (normalized.empty()) {
      return volumeTitle_;
    }

    const std::string lower = toLowerAscii(StringUtils::toDisplaySafeAscii(normalized));
    if (lower.find("danh sach chuong") != std::string::npos && !volumeTitle_.empty()) {
      return volumeTitle_;
    }
    return normalized;
  }

  bool hasAncestorClass(const char* token) const {
    for (auto it = stack_.rbegin(); it != stack_.rend(); ++it) {
      if (classHasToken(it->classAttr, token)) {
        return true;
      }
    }
    return false;
  }

  void finalizeInfoItem() {
    if (!infoItemActive_) {
      return;
    }

    const std::string label = toLowerAscii(normalizeText(infoNameText_));
    const std::string value = normalizeText(infoValueText_);
    if (label.find("tac gia") != std::string::npos) {
      detail_.author = value;
    } else if (label.find("tinh trang") != std::string::npos) {
      const std::string status = toLowerAscii(value);
      detail_.ongoing = status.find("dang tien hanh") != std::string::npos;
    }

    infoItemActive_ = false;
    infoNameCapture_ = false;
    infoValueCapture_ = false;
    infoNameText_.clear();
    infoValueText_.clear();
  }

  bool onStartTag(const HtmlLiteStartTag& tag) {
    std::string classAttr;
    if (const auto* classValue = findAttrValue(tag, "class")) {
      classAttr = *classValue;
    }

    stack_.push_back(HtmlNodeContext{tag.name, classAttr});
    const size_t depth = stack_.size();

    if (classHasToken(classAttr, "series-name")) {
      titleCapture_ = true;
      titleDepth_ = depth;
      titleText_.clear();
    }

    if (classHasToken(classAttr, "volume-name")) {
      volumeTitleCapture_ = true;
      volumeTitleDepth_ = depth;
      volumeTitleText_.clear();
    }

    if (classHasToken(classAttr, "img-in-ratio") && detail_.coverUrl.empty() && hasAncestorClass("series-cover")) {
      if (const auto* style = findAttrValue(tag, "style")) {
        detail_.coverUrl = extractStyleUrl(*style);
      } else if (const auto* dataBg = findAttrValue(tag, "data-bg")) {
        detail_.coverUrl = htmlDecode(*dataBg);
      }
    }

    if (tag.name == "a" && classHasToken(classAttr, "series-gerne-item")) {
      genreCapture_ = true;
      genreDepth_ = depth;
      genreText_.clear();
    }

    if (classHasToken(classAttr, "summary-content")) {
      summaryCapture_ = true;
      summaryDepth_ = depth;
      summaryText_.clear();
    }

    if (classHasToken(classAttr, "info-item")) {
      finalizeInfoItem();
      infoItemActive_ = true;
      infoItemDepth_ = depth;
      infoNameText_.clear();
      infoValueText_.clear();
    }

    if (infoItemActive_ && classHasToken(classAttr, "info-name")) {
      infoNameCapture_ = true;
      infoNameDepth_ = depth;
      infoNameText_.clear();
    }

    if (infoItemActive_ && classHasToken(classAttr, "info-value")) {
      infoValueCapture_ = true;
      infoValueDepth_ = depth;
      infoValueText_.clear();
    }

    if (classHasToken(classAttr, "volume-list") || classHasToken(classAttr, "ln_chapters-volume")) {
      if (currentSectionTitle_.empty() && !volumeTitle_.empty()) {
        currentSectionTitle_ = volumeTitle_;
      }
      chapterIndex_ = chapterIndex_ == 0 ? 1 : chapterIndex_;
      volumeActive_ = true;
      volumeDepth_ = depth;
    }

    if (volumeActive_ && classHasToken(classAttr, "sect-title")) {
      sectionTitleCapture_ = true;
      sectionTitleDepth_ = depth;
      sectionTitleText_.clear();
    }

    if (volumeActive_ && classHasToken(classAttr, "chapter-name")) {
      chapterCapture_ = true;
      chapterDepth_ = depth;
      chapterText_.clear();
      currentChapterUrl_.clear();
      if (const auto* href = findAttrValue(tag, "href")) {
        currentChapterUrl_ = makeAbsoluteUrl(*href);
      }
    }

    if (volumeActive_ && tag.name == "a" && hasAncestorClass("chapter-name")) {
      chapterAnchorCapture_ = true;
      chapterAnchorDepth_ = depth;
      chapterText_.clear();
      if (const auto* href = findAttrValue(tag, "href")) {
        currentChapterUrl_ = makeAbsoluteUrl(*href);
      }
    }

    return true;
  }

  bool onEndTag(const std::string&) {
    if (stack_.empty()) {
      return true;
    }

    const HtmlNodeContext node = stack_.back();
    const size_t depth = stack_.size();

    if (titleCapture_ && depth == titleDepth_ && classHasToken(node.classAttr, "series-name")) {
      detail_.title = normalizeText(titleText_);
      titleCapture_ = false;
      titleText_.clear();
    }

    if (volumeTitleCapture_ && depth == volumeTitleDepth_ && classHasToken(node.classAttr, "volume-name")) {
      volumeTitle_ = normalizeText(volumeTitleText_);
      if (currentSectionTitle_.empty()) {
        currentSectionTitle_ = volumeTitle_;
      }
      volumeTitleCapture_ = false;
      volumeTitleText_.clear();
    }

    if (genreCapture_ && depth == genreDepth_ && node.tagName == "a") {
      const std::string genre = normalizeText(genreText_);
      if (!genre.empty()) {
        detail_.genres.push_back(genre);
      }
      genreCapture_ = false;
      genreText_.clear();
    }

    if (summaryCapture_ && depth == summaryDepth_ && classHasToken(node.classAttr, "summary-content")) {
      const std::string summary = normalizeText(summaryText_);
      detail_.descriptionHtml = summary.empty() ? std::string{} : ("<p>" + summary + "</p>");
      capRetainedHtml(detail_.descriptionHtml, DETAIL_DESCRIPTION_CAP_BYTES);
      summaryCapture_ = false;
      summaryText_.clear();
    }

    if (infoNameCapture_ && depth == infoNameDepth_ && classHasToken(node.classAttr, "info-name")) {
      infoNameCapture_ = false;
    }

    if (infoValueCapture_ && depth == infoValueDepth_ && classHasToken(node.classAttr, "info-value")) {
      infoValueCapture_ = false;
    }

    if (infoItemActive_ && depth == infoItemDepth_ && classHasToken(node.classAttr, "info-item")) {
      finalizeInfoItem();
    }

    if (sectionTitleCapture_ && depth == sectionTitleDepth_ && classHasToken(node.classAttr, "sect-title")) {
      currentSectionTitle_ = resolveSectionTitle(sectionTitleText_);
      sectionTitleCapture_ = false;
      sectionTitleText_.clear();
    }

    if (chapterAnchorCapture_ && depth == chapterAnchorDepth_ && node.tagName == "a") {
      chapterAnchorCapture_ = false;
    }

    if (chapterCapture_ && depth == chapterDepth_ && classHasToken(node.classAttr, "chapter-name")) {
      HakoChapterRef ref;
      ref.title = normalizeText(chapterText_);
      ref.sectionTitle = currentSectionTitle_;
      ref.url = currentChapterUrl_;
      ref.index = chapterIndex_++;
      if (!ref.title.empty() && !ref.url.empty()) {
        toc_.push_back(std::move(ref));
      }
      chapterCapture_ = false;
      chapterText_.clear();
      currentChapterUrl_.clear();
    }

    if (volumeActive_ && depth == volumeDepth_ &&
        (classHasToken(node.classAttr, "volume-list") || classHasToken(node.classAttr, "ln_chapters-volume"))) {
      volumeActive_ = false;
      currentSectionTitle_.clear();
    }

    stack_.pop_back();
    return true;
  }

  bool onText(const std::string& text) {
    if (titleCapture_) {
      titleText_ += text;
    }
    if (volumeTitleCapture_) {
      volumeTitleText_ += text;
    }
    if (genreCapture_) {
      genreText_ += text;
    }
    if (summaryCapture_) {
      summaryText_ += text;
    }
    if (infoNameCapture_) {
      infoNameText_ += text;
    }
    if (infoValueCapture_) {
      infoValueText_ += text;
    }
    if (sectionTitleCapture_) {
      sectionTitleText_ += text;
    }
    if (chapterCapture_ && chapterAnchorCapture_) {
      chapterText_ += text;
    }
    return true;
  }

  HtmlLiteTokenizer tokenizer_;
  std::vector<HtmlNodeContext> stack_;
  HakoBookDetail detail_;
  std::vector<HakoChapterRef> toc_;
  std::string snippet_;
  bool titleCapture_ = false;
  size_t titleDepth_ = 0;
  std::string titleText_;
  bool volumeTitleCapture_ = false;
  size_t volumeTitleDepth_ = 0;
  std::string volumeTitleText_;
  std::string volumeTitle_;
  bool genreCapture_ = false;
  size_t genreDepth_ = 0;
  std::string genreText_;
  bool summaryCapture_ = false;
  size_t summaryDepth_ = 0;
  std::string summaryText_;
  bool infoItemActive_ = false;
  size_t infoItemDepth_ = 0;
  bool infoNameCapture_ = false;
  size_t infoNameDepth_ = 0;
  std::string infoNameText_;
  bool infoValueCapture_ = false;
  size_t infoValueDepth_ = 0;
  std::string infoValueText_;
  bool volumeActive_ = false;
  size_t volumeDepth_ = 0;
  bool sectionTitleCapture_ = false;
  size_t sectionTitleDepth_ = 0;
  std::string sectionTitleText_;
  std::string currentSectionTitle_;
  bool chapterCapture_ = false;
  size_t chapterDepth_ = 0;
  bool chapterAnchorCapture_ = false;
  size_t chapterAnchorDepth_ = 0;
  std::string chapterText_;
  std::string currentChapterUrl_;
  uint32_t chapterIndex_ = 1;
};

bool fetchSeriesPageStreamed(const std::string& resolvedUrl, HakoSeriesPageStreamParser& parser) {
  return HttpDownloader::fetchUrlFromMarkerStreamed(resolvedUrl, "<title>",
                                                    [&parser](const uint8_t* data, size_t size) { return parser.feed(data, size); }) &&
         parser.finish();
}

bool fetchListingPageStreamed(const std::string& url, HakoHomeStreamParser& parser) {
  return HttpDownloader::fetchUrlFromMarkerStreamed(url, "thumb-item-flow",
                                                    [&parser](const uint8_t* data, size_t size) { return parser.feed(data, size); }) &&
         parser.finish();
}

bool HakoPluginExecutor::search(const std::string& query, int page, std::vector<HakoSearchResult>& outResults) {
  outResults.clear();
  constexpr size_t SEARCH_PAGE_SIZE = 12;
  const std::string url =
      std::string(BASE_URL) + "/tim-kiem" + getQueryParamSeparator(std::string(BASE_URL) + "/tim-kiem") + "keywords=" + urlEncode(query) +
      "&page=" + std::to_string(page);

  HakoHomeStreamParser streamParser;
  if (fetchListingPageStreamed(url, streamParser)) {
    outResults = streamParser.takeResults();
  }

  std::string html;
  if (outResults.empty() && shouldAttemptHeavyHtmlFallback() &&
      HttpDownloader::fetchUrlFromMarkerCapped(url, html, "thumb-item-flow", SEARCH_FETCH_CAP_BYTES, true)) {
    parseSearchResultBlocks(html, outResults);
  }

  if (outResults.empty()) {
    const std::string reason = HttpDownloader::getLastError().empty() ? std::string("No search results parsed")
                                                                       : HttpDownloader::getLastError();
    OnlineDebugLog::logParserFailure("Hako", "search", url, reason, html.empty() ? streamParser.snippet() : html);
    return false;
  }

  if (outResults.size() > SEARCH_PAGE_SIZE) {
    outResults.resize(SEARCH_PAGE_SIZE);
  }
  return true;
}
bool HakoPluginExecutor::fetchHomeFeed(std::vector<HakoSearchResult>& outResults) {
  outResults.clear();

  HakoHomeStreamParser streamParser;
  if (fetchListingPageStreamed(HOME_FEED_URL, streamParser)) {
    outResults = streamParser.takeResults();
    if (!outResults.empty()) {
      return true;
    }
  }

  std::string html;
  if (outResults.empty() && shouldAttemptHeavyHtmlFallback() &&
      HttpDownloader::fetchUrlFromMarkerCapped(HOME_FEED_URL, html, "thumb-item-flow", HOME_FETCH_CAP_BYTES, true)) {
    if (parseHomeFeedBlocks(html, outResults)) {
      return true;
    }
  }

  const std::string reason = HttpDownloader::getLastError().empty() ? std::string("No home feed entries parsed")
                                                                     : HttpDownloader::getLastError();
  OnlineDebugLog::logParserFailure("Hako", "home", HOME_FEED_URL, reason, html.empty() ? streamParser.snippet() : html);
  return false;
}
bool HakoPluginExecutor::fetchDetail(const std::string& url, HakoBookDetail& outDetail) {
  const std::string resolvedUrl = makeAbsoluteUrl(url);
  HakoSeriesPageStreamParser streamParser;
  if (fetchSeriesPageStreamed(resolvedUrl, streamParser)) {
    outDetail = streamParser.detail();
    outDetail.url = resolvedUrl;
    if (!outDetail.title.empty()) {
      return true;
    }
  }

  std::string html;
  if (shouldAttemptHeavyHtmlFallback() &&
      HttpDownloader::fetchUrlFromMarkerCapped(resolvedUrl, html, "series-cover", DETAIL_FETCH_CAP_BYTES, true) &&
      parseDetailFromHtml(html, resolvedUrl, outDetail)) {
    return true;
  }

  outDetail.url = resolvedUrl;
  OnlineDebugLog::logParserFailure("Hako", "detail", outDetail.url,
                                   HttpDownloader::getLastError().empty() ? std::string("Title not parsed")
                                                                          : HttpDownloader::getLastError(),
                                   html.empty() ? streamParser.snippet() : html);
  return false;
}

bool HakoPluginExecutor::fetchToc(const std::string& url, std::vector<HakoChapterRef>& outToc) {
  outToc.clear();
  const std::string resolvedUrl = makeAbsoluteUrl(url);
  HakoSeriesPageStreamParser streamParser;
  if (fetchSeriesPageStreamed(resolvedUrl, streamParser)) {
    outToc = streamParser.toc();
    if (!outToc.empty()) {
      renumberToc(outToc);
      return true;
    }
  }

  OnlineDebugLog::logParserFailure("Hako", "toc", resolvedUrl,
                                   HttpDownloader::getLastError().empty() ? std::string("No chapters parsed")
                                                                          : HttpDownloader::getLastError(),
                                   streamParser.snippet());
  return false;
}

bool HakoPluginExecutor::fetchChapter(const HakoChapterRef& ref, HakoChapterContent& outContent, bool includePlainText) {
  const std::string url = makeAbsoluteUrl(ref.url);
  for (size_t attemptIndex = 0; attemptIndex <= sizeof(CHAPTER_FETCH_RETRY_DELAYS_MS) / sizeof(CHAPTER_FETCH_RETRY_DELAYS_MS[0]);
       ++attemptIndex) {
    std::string html;
    std::string chapterHtml = streamChapterContainerHtml(url, "<div id=\"chapter-content\"");
    if (chapterHtml.empty()) {
      chapterHtml = streamChapterContainerHtml(url, "<div id=\"chapter-c-protected\"");
    }
    bool fetchOk = !chapterHtml.empty();
    if (!fetchOk && shouldAttemptHeavyHtmlFallback()) {
      fetchOk = HttpDownloader::fetchUrlCapped(url, html, CHAPTER_FETCH_CAP_BYTES, false);
      if (fetchOk) {
        chapterHtml = extractChapterContainerHtml(html);
      }
    }

    if (!chapterHtml.empty()) {
      std::string().swap(html);
      outContent = {};
      outContent.ref = ref;
      outContent.html = decodeProtectedContent(chapterHtml);
      std::string().swap(chapterHtml);
      cleanupChapterHtml(outContent.html);
      if (includePlainText) {
        outContent.text = stripTags(outContent.html);
      } else {
        outContent.text.clear();
      }
      if (!outContent.html.empty() || !outContent.text.empty()) {
        return true;
      }
    }

    logChapterAttemptFailure(ref, attemptIndex, html, fetchOk);
    OnlineDebugLog::logParserFailure("Hako", "chapter", url,
                                     fetchOk ? "Chapter container missing or empty" : HttpDownloader::getLastError(), html);
    if (attemptIndex >= sizeof(CHAPTER_FETCH_RETRY_DELAYS_MS) / sizeof(CHAPTER_FETCH_RETRY_DELAYS_MS[0])) {
      break;
    }
    delay(CHAPTER_FETCH_RETRY_DELAYS_MS[attemptIndex]);
  }
  return false;
}

void HakoPluginExecutor::clearMemoryCaches() {}
