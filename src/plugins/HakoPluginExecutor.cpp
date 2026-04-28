#include "HakoPluginExecutor.h"

#include <Arduino.h>
#include <Logging.h>

#include <algorithm>
#include <cctype>
#include <cstdlib>

#include "network/HttpDownloader.h"
#include "util/StringUtils.h"

namespace {
constexpr char MODULE[] = "HAKO";
constexpr uint32_t CHAPTER_FETCH_RETRY_DELAYS_MS[] = {1500, 5000};
constexpr unsigned long HOME_FEED_CACHE_TTL_MS = 120000;

struct HomeFeedCacheEntry {
  std::vector<HakoSearchResult> results;
  unsigned long fetchedAtMs = 0;
  bool valid = false;
};

HomeFeedCacheEntry g_homeFeedCache;

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

std::string getQueryParamSeparator(const std::string& url) { return url.find('?') == std::string::npos ? "?" : "&"; }

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
         containsAsciiCaseInsensitive(html, "xác minh") || containsAsciiCaseInsensitive(html, "verify you are human");
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

bool HakoPluginExecutor::search(const std::string& query, int page, std::vector<HakoSearchResult>& outResults) {
  outResults.clear();
  constexpr size_t SEARCH_PAGE_SIZE = 20;
  std::string html;
  const std::string url =
      std::string(BASE_URL) + "/tim-kiem" + getQueryParamSeparator(std::string(BASE_URL) + "/tim-kiem") + "keywords=" + urlEncode(query) +
      "&page=" + std::to_string(page);
  if (!HttpDownloader::fetchUrl(url, html)) {
    return false;
  }

  auto blocks = collectBlocks(html, "thumb-item-flow");
  for (const auto& block : blocks) {
    HakoSearchResult result;
    std::string href;
    if (!extractAttrNear(block, "series-title", "href", href)) continue;
    std::string titleHtml;
    if (!extractTagContent(block, "series-title", ">", "</a>", titleHtml)) continue;
    result.title = stripTags(titleHtml);
    result.url = makeAbsoluteUrl(href);
    std::string descHtml;
    if (extractTagContent(block, "chapter-title", ">", "</div>", descHtml)) {
      result.description = stripTags(descHtml);
    }
    extractAttrNear(block, "img-in-ratio", "data-bg", result.coverUrl);
    outResults.push_back(std::move(result));
  }
  if (outResults.size() > SEARCH_PAGE_SIZE) {
    outResults.resize(SEARCH_PAGE_SIZE);
  }
  return true;
}

bool HakoPluginExecutor::fetchHomeFeed(std::vector<HakoSearchResult>& outResults) {
  outResults.clear();

  const unsigned long nowMs = millis();
  if (g_homeFeedCache.valid && (nowMs - g_homeFeedCache.fetchedAtMs) <= HOME_FEED_CACHE_TTL_MS) {
    outResults = g_homeFeedCache.results;
    return !outResults.empty();
  }

  std::string html;
  if (!HttpDownloader::fetchUrl(BASE_URL, html)) {
    return false;
  }

  std::vector<std::string> sections;
  extractSectionBlocks(html, "thumb-section-flow", sections);

  std::vector<std::string> seenUrls;
  for (const auto& section : sections) {
    const std::string sectionLabel = extractSectionLabel(section);
    const auto blocks = collectBlocks(section, "thumb-item-flow");
    for (const auto& block : blocks) {
      HakoSearchResult result;
      std::string href;
      if (!extractAttrNear(block, "series-title", "href", href)) continue;
      result.url = makeAbsoluteUrl(href);
      if (std::find(seenUrls.begin(), seenUrls.end(), result.url) != seenUrls.end()) {
        continue;
      }

      std::string titleHtml;
      if (!extractTagContent(block, "series-title", ">", "</a>", titleHtml)) continue;
      result.title = stripTags(titleHtml);

      std::string chapterHtml;
      std::string volumeHtml;
      if (extractTagContent(block, "chapter-title", ">", "</div>", chapterHtml)) {
        result.homeLatestChapterTitle = stripTags(chapterHtml);
      }
      if (extractTagContent(block, "volume-title", ">", "</div>", volumeHtml)) {
        result.homeVolumeTitle = stripTags(volumeHtml);
      }
      if (!sectionLabel.empty()) {
        result.homeSectionLabel = sectionLabel;
      }
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
      extractAttrNear(block, "img-in-ratio", "data-bg", result.coverUrl);

      seenUrls.push_back(result.url);
      outResults.push_back(std::move(result));
    }
  }

  g_homeFeedCache.results = outResults;
  g_homeFeedCache.fetchedAtMs = nowMs;
  g_homeFeedCache.valid = !outResults.empty();
  return !outResults.empty();
}

bool HakoPluginExecutor::fetchDetail(const std::string& url, HakoBookDetail& outDetail) {
  std::string html;
  if (!HttpDownloader::fetchUrl(makeAbsoluteUrl(url), html)) {
    return false;
  }
  outDetail = {};
  outDetail.url = makeAbsoluteUrl(url);
  std::string titleHtml;
  if (extractTagContent(html, "series-name", ">", "</div>", titleHtml)) {
    outDetail.title = stripTags(titleHtml);
  }
  std::string style;
  if (extractAttrNear(html, "series-cover", "style", style)) {
    outDetail.coverUrl = extractStyleUrl(style);
  }
  std::string summaryHtml;
  if (extractTagContent(html, "summary-content", ">", "</div>", summaryHtml)) {
    outDetail.descriptionHtml = summaryHtml;
  }

  auto infoBlocks = collectBlocks(html, "info-item");
  for (const auto& block : infoBlocks) {
    std::string labelHtml;
    std::string valueHtml;
    if (!extractTagContent(block, "info-name", ">", "</div>", labelHtml)) continue;
    if (!extractTagContent(block, "info-value", ">", "</div>", valueHtml)) continue;
    const std::string label = stripTags(labelHtml);
    const std::string value = stripTags(valueHtml);
    if (label.find("Tác giả") != std::string::npos || label.find("Tc gi") != std::string::npos) {
      outDetail.author = value;
    }
    if (label.find("Tình trạng") != std::string::npos || label.find("Tnh trng") != std::string::npos) {
      const std::string lower = value;
      outDetail.ongoing = lower.find("đang tiến hành") != std::string::npos || lower.find("dang tien hanh") != std::string::npos;
    }
  }

  size_t pos = 0;
  while ((pos = html.find("series-gerne-item", pos)) != std::string::npos) {
    std::string genreHtml;
    if (extractTagContent(html.substr(pos), "series-gerne-item", ">", "</a>", genreHtml)) {
      outDetail.genres.push_back(stripTags(genreHtml));
    }
    pos += 16;
  }
  return !outDetail.title.empty();
}

bool HakoPluginExecutor::fetchToc(const std::string& url, std::vector<HakoChapterRef>& outToc) {
  outToc.clear();
  std::string html;
  if (!HttpDownloader::fetchUrl(makeAbsoluteUrl(url), html)) {
    return false;
  }

  size_t pos = 0;
  uint32_t index = 1;
  while ((pos = html.find("volume-list", pos)) != std::string::npos) {
    const std::string block = html.substr(pos, html.find("volume-list", pos + 10) == std::string::npos
                                                   ? std::string::npos
                                                   : html.find("volume-list", pos + 10) - pos);
    std::string sectionName;
    std::string sectionHtml;
    if (extractTagContent(block, "sect-title", ">", "</div>", sectionHtml)) {
      sectionName = stripTags(sectionHtml);
    }
    size_t chapPos = 0;
    while ((chapPos = block.find("chapter-name", chapPos)) != std::string::npos) {
      std::string href;
      if (!extractAttrNear(block.substr(chapPos), "chapter-name", "href", href)) {
        chapPos += 12;
        continue;
      }
      std::string titleHtml;
      if (!extractTagContent(block.substr(chapPos), "chapter-name", ">", "</a>", titleHtml)) {
        chapPos += 12;
        continue;
      }
      HakoChapterRef ref;
      ref.title = stripTags(titleHtml);
      ref.sectionTitle = sectionName;
      ref.url = makeAbsoluteUrl(href);
      ref.index = index++;
      outToc.push_back(std::move(ref));
      chapPos += 12;
    }
    pos += 10;
  }
  normalizeTocOrder(outToc);
  return !outToc.empty();
}

bool HakoPluginExecutor::fetchChapter(const HakoChapterRef& ref, HakoChapterContent& outContent) {
  const std::string url = makeAbsoluteUrl(ref.url);
  for (size_t attemptIndex = 0; attemptIndex <= sizeof(CHAPTER_FETCH_RETRY_DELAYS_MS) / sizeof(CHAPTER_FETCH_RETRY_DELAYS_MS[0]);
       ++attemptIndex) {
    std::string html;
    const bool fetchOk = HttpDownloader::fetchUrl(url, html);
    if (fetchOk) {
      const std::string chapterHtml = extractChapterContainerHtml(html);
      if (!chapterHtml.empty()) {
        outContent = {};
        outContent.ref = ref;
        outContent.html = decodeProtectedContent(chapterHtml);
        cleanupChapterHtml(outContent.html);
        outContent.text = stripTags(outContent.html);
        if (!outContent.html.empty() || !outContent.text.empty()) {
          return true;
        }
      }
    }

    logChapterAttemptFailure(ref, attemptIndex, html, fetchOk);
    if (attemptIndex >= sizeof(CHAPTER_FETCH_RETRY_DELAYS_MS) / sizeof(CHAPTER_FETCH_RETRY_DELAYS_MS[0])) {
      break;
    }
    delay(CHAPTER_FETCH_RETRY_DELAYS_MS[attemptIndex]);
  }
  return false;
}
