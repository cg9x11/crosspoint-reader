#include "TruyenFullPluginExecutor.h"

#include <Arduino.h>
#include <Logging.h>

#include <algorithm>
#include <cctype>
#include <cstring>

#include "network/HttpDownloader.h"
#include "network/OnlineDebugLog.h"
#include "util/HtmlLiteTokenizer.h"
#include "util/StringUtils.h"

namespace {
constexpr char MODULE[] = "TFULL";
constexpr int SEARCH_PAGE_SIZE = 12;
constexpr size_t LISTING_MARKER_FETCH_CAP_BYTES = 32 * 1024;
constexpr size_t DETAIL_FETCH_CAP_BYTES = 24 * 1024;
constexpr size_t TOC_FETCH_CAP_BYTES = 112 * 1024;
constexpr size_t CHAPTER_FETCH_CAP_BYTES = 96 * 1024;
constexpr size_t DETAIL_DESCRIPTION_CAP_BYTES = 4096;
constexpr size_t TOC_PAGE_SIZE = 50;
constexpr uint32_t HEAVY_FALLBACK_MIN_FREE_HEAP = 98000;
constexpr uint32_t HEAVY_FALLBACK_MIN_LARGEST_BLOCK = 72000;

void capRetainedHtml(std::string& html, size_t maxBytes) {
  if (html.size() <= maxBytes) {
    return;
  }
  html.resize(maxBytes);
  html.shrink_to_fit();
}

bool shouldAttemptHeavyHtmlFallback() {
  return ESP.getFreeHeap() >= HEAVY_FALLBACK_MIN_FREE_HEAP && ESP.getMaxAllocHeap() >= HEAVY_FALLBACK_MIN_LARGEST_BLOCK;
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
    if (!inTag) {
      out.push_back(ch);
    }
  }
  return collapseWhitespace(htmlDecode(out));
}

std::string normalizeDisplayText(std::string value) {
  return collapseWhitespace(StringUtils::toDisplaySafeAscii(trim(std::move(value))));
}

std::string toLowerAscii(std::string value) {
  std::transform(value.begin(), value.end(), value.begin(),
                 [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
  return value;
}

std::string normalizeBaseUrl(std::string value) {
  value = trim(std::move(value));
  if (value.empty()) {
    return TruyenFullPluginExecutor::BASE_URL;
  }
  while (!value.empty() && value.back() == '/') {
    value.pop_back();
  }
  return value.empty() ? std::string(TruyenFullPluginExecutor::BASE_URL) : value;
}

std::string makeAbsoluteUrl(const std::string& baseUrl, const std::string& url) {
  if (url.rfind("http://", 0) == 0 || url.rfind("https://", 0) == 0) {
    return url;
  }
  if (!url.empty() && url[0] == '/') {
    return normalizeBaseUrl(baseUrl) + url;
  }
  return normalizeBaseUrl(baseUrl) + "/" + url;
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

bool fetchPage(const std::string& url, std::string& outHtml, size_t maxBytes, bool allowTruncate = false) {
  if (!HttpDownloader::fetchUrlCapped(url, outHtml, maxBytes, allowTruncate)) {
    LOG_ERR(MODULE, "Failed to fetch %s", url.c_str());
    return false;
  }
  return !outHtml.empty();
}

std::vector<std::string> collectBlocks(const std::string& html, const std::string& marker) {
  std::vector<std::string> blocks;
  size_t pos = 0;
  while ((pos = html.find(marker, pos)) != std::string::npos) {
    size_t next = html.find(marker, pos + marker.size());
    if (next == std::string::npos) {
      next = html.find("</div></div> </div>", pos);
    }
    if (next == std::string::npos) {
      next = html.size();
    }
    blocks.push_back(html.substr(pos, next - pos));
    pos = next;
  }
  return blocks;
}

bool extractAnchor(const std::string& baseUrl, const std::string& html, std::string& outUrl, std::string& outTitle) {
  const size_t hrefPos = html.find("href=\"");
  if (hrefPos == std::string::npos) return false;
  const size_t hrefStart = hrefPos + 6;
  const size_t hrefEnd = html.find('"', hrefStart);
  if (hrefEnd == std::string::npos) return false;

  const size_t textStart = html.find('>', hrefEnd);
  const size_t textEnd = textStart == std::string::npos ? std::string::npos : html.find("</a>", textStart + 1);
  if (textStart == std::string::npos || textEnd == std::string::npos) return false;

  outUrl = makeAbsoluteUrl(baseUrl, htmlDecode(html.substr(hrefStart, hrefEnd - hrefStart)));
  outTitle = stripTags(html.substr(textStart + 1, textEnd - textStart - 1));
  return !outUrl.empty() && !outTitle.empty();
}

std::string extractAttr(const std::string& html, const std::string& marker, const std::string& attr) {
  const size_t markerPos = html.find(marker);
  if (markerPos == std::string::npos) return "";
  const std::string needle = attr + "=\"";
  const size_t attrPos = html.find(needle, markerPos);
  if (attrPos == std::string::npos) return "";
  const size_t valueStart = attrPos + needle.size();
  const size_t valueEnd = html.find('"', valueStart);
  if (valueEnd == std::string::npos) return "";
  return htmlDecode(html.substr(valueStart, valueEnd - valueStart));
}

std::string extractBlock(const std::string& html, const std::string& startMarker, const std::string& endMarker) {
  const size_t start = html.find(startMarker);
  if (start == std::string::npos) return "";
  const size_t contentStart = html.find('>', start);
  if (contentStart == std::string::npos) return "";
  const size_t end = html.find(endMarker, contentStart + 1);
  if (end == std::string::npos) return "";
  return html.substr(contentStart + 1, end - contentStart - 1);
}

std::string extractNearestDivBlock(const std::string& html, size_t markerPos) {
  if (markerPos == std::string::npos) {
    return "";
  }
  size_t start = html.rfind("<div", markerPos);
  if (start == std::string::npos) {
    start = markerPos;
  }
  const size_t end = html.find("</div>", markerPos);
  if (end == std::string::npos || end <= start) {
    return "";
  }
  return html.substr(start, end + 6 - start);
}

std::string extractDivBlockByContainedMarker(const std::string& html, const char* marker) {
  const size_t markerPos = html.find(marker);
  return extractNearestDivBlock(html, markerPos);
}

std::string extractTitleAnchorBlock(const std::string& block) {
  const size_t truyenTitlePos = block.find("<h3 class=\"truyen-title\"");
  if (truyenTitlePos != std::string::npos) {
    return block.substr(truyenTitlePos);
  }

  const size_t genericTitlePos = block.find("<h3 itemprop=\"name\"");
  if (genericTitlePos != std::string::npos) {
    return block.substr(genericTitlePos);
  }

  const size_t anyTitlePos = block.find("<h3");
  if (anyTitlePos != std::string::npos) {
    return block.substr(anyTitlePos);
  }
  return "";
}

std::string extractInlineAuthorText(const std::string& block) {
  const size_t authorPos = block.find("<span class=\"author\"");
  if (authorPos == std::string::npos) {
    return "";
  }

  size_t authorEnd = block.find("<span class=\"author\"", authorPos + 1);
  if (authorEnd == std::string::npos) {
    authorEnd = block.find("</div>", authorPos);
  }
  if (authorEnd == std::string::npos || authorEnd <= authorPos) {
    authorEnd = block.size();
  }

  return stripTags(block.substr(authorPos, authorEnd - authorPos));
}

std::string extractLatestChapterBlock(const std::string& block) {
  const char* markers[] = {
      "<div class=\"col-xs-2 text-info\">",
      "<div class=\"col-xs-3 col-sm-3 col-md-2 col-chap text-info\">",
      "col-chap text-info",
      "text-info"};
  for (const char* marker : markers) {
    const size_t pos = block.find(marker);
    if (pos != std::string::npos) {
      return block.substr(pos);
    }
  }
  return "";
}

bool parseListingPage(const std::string& baseUrl, const std::string& html, std::vector<HakoSearchResult>& outResults) {
  outResults.clear();
  auto blocks = collectBlocks(html, "<div class=\"row\" itemscope itemtype=\"https://schema.org/Book\">");
  if (blocks.empty()) {
    blocks = collectBlocks(html, "<div class=\"row\" itemscope=\"\" itemtype=\"https://schema.org/Book\">");
  }
  if (blocks.empty()) {
    blocks = collectBlocks(html, "<div class=\"row\" itemscope");
  }
  for (const auto& block : blocks) {
    HakoSearchResult item;

    const std::string titleAnchorBlock = extractTitleAnchorBlock(block);
    if (titleAnchorBlock.empty()) {
      continue;
    }

    if (!extractAnchor(baseUrl, titleAnchorBlock, item.url, item.title)) {
      continue;
    }

    const std::string authorText = extractInlineAuthorText(block);
    item.description = authorText.empty() ? "" : ("Tac gia: " + authorText);
    item.coverUrl = extractAttr(block, "data-classname=\"cover\"", "data-image");

    const std::string latestChapterBlock = extractLatestChapterBlock(block);
    if (!latestChapterBlock.empty()) {
      std::string latestUrl;
      std::string latestTitle;
      if (extractAnchor(baseUrl, latestChapterBlock, latestUrl, latestTitle)) {
        item.homeLatestChapterTitle = latestTitle;
      }
    }

    item.homeSectionLabel = "Moi cap nhat";
    item.homeDisplaySubtitle = item.homeLatestChapterTitle.empty() ? item.description : item.homeLatestChapterTitle;
    outResults.push_back(std::move(item));
  }

  return !outResults.empty();
}

bool parseThumbnailListingPage(const std::string& baseUrl, const std::string& html, std::vector<HakoSearchResult>& outResults) {
  outResults.clear();

  size_t pos = 0;
  while ((pos = html.find("<div class=\"col-xs-3 col-sm-2 col-md-2\">", pos)) != std::string::npos) {
    const size_t next = html.find("<div class=\"col-xs-3 col-sm-2 col-md-2\">", pos + 1);
    const std::string block = html.substr(pos, next == std::string::npos ? std::string::npos : next - pos);

    HakoSearchResult item;
    if (!extractAnchor(baseUrl, block, item.url, item.title)) {
      pos += 1;
      continue;
    }

    item.coverUrl = extractAttr(block, "class=\"lazyimg\"", "data-image");
    if (item.coverUrl.empty()) {
      item.coverUrl = extractAttr(block, "class=\"lazyimg\"", "data-desk-image");
    }

    const std::string captionHtml = extractBlock(block, "<div class=\"caption\"", "</div>");
    const std::string subtitle = stripTags(captionHtml);
    if (!subtitle.empty() && subtitle != item.title) {
      item.homeDisplaySubtitle = subtitle;
      item.description = subtitle;
    }
    item.homeSectionLabel = "Noi bat";
    outResults.push_back(std::move(item));
    pos = next == std::string::npos ? html.size() : next;
  }

  return !outResults.empty();
}

int parseLastPageNumber(const std::string& html) {
  int maxPage = 1;
  const char* markers[] = {"page=", "paged="};
  for (const char* marker : markers) {
    size_t pos = 0;
    const size_t markerLength = std::strlen(marker);
    while ((pos = html.find(marker, pos)) != std::string::npos) {
      pos += markerLength;
      int page = 0;
      bool foundDigit = false;
      while (pos < html.size() && std::isdigit(static_cast<unsigned char>(html[pos]))) {
        foundDigit = true;
        page = page * 10 + (html[pos] - '0');
        pos++;
      }
      if (foundDigit && page > maxPage) {
        maxPage = page;
      }
    }
  }
  return maxPage;
}

int parseLastTocPage(const std::string& html) {
  int maxPage = 1;
  size_t pos = 0;
  while ((pos = html.find("/trang-", pos)) != std::string::npos) {
    pos += 7;
    int page = 0;
    bool foundDigit = false;
    while (pos < html.size() && std::isdigit(static_cast<unsigned char>(html[pos]))) {
      foundDigit = true;
      page = page * 10 + (html[pos] - '0');
      pos++;
    }
    if (foundDigit && page > maxPage) {
      maxPage = page;
    }
  }
  return maxPage;
}

void parseGenres(const std::string& html, std::vector<std::string>& outGenres) {
  outGenres.clear();
  const char* inlineMarkers[] = {"<h3>Thể loại:</h3>", "<h3>The loai:</h3>"};
  for (const char* marker : inlineMarkers) {
    const std::string block = extractDivBlockByContainedMarker(html, marker);
    if (!block.empty()) {
      size_t anchorPos = 0;
      while ((anchorPos = block.find("<a ", anchorPos)) != std::string::npos) {
        std::string url;
        std::string title;
        if (extractAnchor(TruyenFullPluginExecutor::BASE_URL, block.substr(anchorPos), url, title) && !title.empty()) {
          outGenres.push_back(title);
        }
        anchorPos += 3;
      }
      if (!outGenres.empty()) {
        return;
      }
    }
  }

  size_t pos = html.find("<div class=\"info\">");
  while (pos != std::string::npos) {
    const size_t end = html.find("</div>", pos);
    if (end == std::string::npos) break;
    const std::string block = html.substr(pos, end + 6 - pos);
    if (block.find("Thể loại:") != std::string::npos || block.find("The loai:") != std::string::npos) {
      size_t anchorPos = 0;
      while ((anchorPos = block.find("<a ", anchorPos)) != std::string::npos) {
        std::string url;
        std::string title;
        if (extractAnchor(TruyenFullPluginExecutor::BASE_URL, block.substr(anchorPos), url, title) && !title.empty()) {
          outGenres.push_back(title);
        }
        anchorPos += 3;
      }
      return;
    }
    pos = html.find("<div class=\"info\">", end);
  }
}

bool isCompleted(const std::string& html) {
  const char* inlineMarkers[] = {"<h3>Trạng thái:</h3>", "<h3>Trang thai:</h3>"};
  for (const char* marker : inlineMarkers) {
    const std::string block = stripTags(extractDivBlockByContainedMarker(html, marker));
    if (!block.empty()) {
      return block.find("Full") != std::string::npos || block.find("Hoan") != std::string::npos;
    }
  }

  size_t pos = html.find("<div class=\"info\">");
  while (pos != std::string::npos) {
    const size_t end = html.find("</div>", pos);
    if (end == std::string::npos) break;
    const std::string block = stripTags(html.substr(pos, end + 6 - pos));
    if (block.find("Trang thai:") != std::string::npos) {
      return block.find("Full") != std::string::npos || block.find("Hoan") != std::string::npos;
    }
    pos = html.find("<div class=\"info\">", end);
  }
  return false;
}

std::string extractAuthor(const std::string& html) {
  const char* inlineMarkers[] = {"<h3>Tác giả:</h3>", "<h3>Tac gia:</h3>"};
  for (const char* marker : inlineMarkers) {
    const std::string block = extractDivBlockByContainedMarker(html, marker);
    if (!block.empty()) {
      std::string url;
      std::string title;
      if (extractAnchor(TruyenFullPluginExecutor::BASE_URL, block, url, title) && !title.empty()) {
        return title;
      }
      return stripTags(block);
    }
  }

  size_t pos = html.find("<div class=\"info\">");
  while (pos != std::string::npos) {
    const size_t end = html.find("</div>", pos);
    if (end == std::string::npos) break;
    const std::string block = html.substr(pos, end + 6 - pos);
    if (block.find("Tác giả:") != std::string::npos || block.find("Tac gia:") != std::string::npos) {
      std::string url;
      std::string title;
      if (extractAnchor(TruyenFullPluginExecutor::BASE_URL, block, url, title)) {
        return title;
      }
      return stripTags(block);
    }
    pos = html.find("<div class=\"info\">", end);
  }
  return "";
}

void parseTocPage(const std::string& baseUrl, const std::string& html, std::vector<HakoChapterRef>& outToc) {
  const uint32_t startIndex = static_cast<uint32_t>(outToc.size());
  uint32_t localCount = 0;
  size_t listPos = 0;
  while ((listPos = html.find("<ul class=\"list-chapter\"", listPos)) != std::string::npos) {
    const size_t listEnd = html.find("</ul>", listPos);
    if (listEnd == std::string::npos) break;
    const std::string listHtml = html.substr(listPos, listEnd + 5 - listPos);

    size_t itemPos = 0;
    while ((itemPos = listHtml.find("<li>", itemPos)) != std::string::npos) {
      const size_t itemEnd = listHtml.find("</li>", itemPos);
      if (itemEnd == std::string::npos) break;
      const std::string itemHtml = listHtml.substr(itemPos, itemEnd + 5 - itemPos);

      std::string url;
      std::string title;
      if (extractAnchor(baseUrl, itemHtml, url, title)) {
        HakoChapterRef chapter;
        chapter.url = url;
        chapter.title = normalizeDisplayText(title);
        chapter.index = startIndex + (++localCount);
        outToc.push_back(std::move(chapter));
      }
      itemPos = itemEnd + 5;
    }

    listPos = listEnd + 5;
  }
}

std::string extractChapterBody(const std::string& html) {
  const size_t start = html.find("<div id=\"chapter-c\" class=\"chapter-c\"");
  if (start == std::string::npos) return "";
  const size_t contentStart = html.find('>', start);
  if (contentStart == std::string::npos) return "";

  size_t pos = start;
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
        const size_t divEnd = html.find('>', pos);
        if (divEnd != std::string::npos && divEnd > contentStart) {
          return html.substr(contentStart + 1, (pos - 5) - contentStart - 1);
        }
        break;
      }
      continue;
    }
    pos++;
  }
  return "";
}

class RawBalancedDivInnerStreamExtractor {
 public:
  RawBalancedDivInnerStreamExtractor(std::string startMarker, size_t maxBytes)
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
  std::string innerHtml() const {
    if (!finished_) {
      return "";
    }
    const size_t firstTagEnd = captured_.find('>');
    if (firstTagEnd == std::string::npos) {
      return "";
    }
    const size_t closingStart = captured_.rfind("</div");
    if (closingStart == std::string::npos || closingStart <= firstTagEnd) {
      return "";
    }
    return captured_.substr(firstTagEnd + 1, closingStart - firstTagEnd - 1);
  }

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

std::string streamChapterBody(const std::string& chapterUrl) {
  RawBalancedDivInnerStreamExtractor extractor("<div id=\"chapter-c\" class=\"chapter-c\"", CHAPTER_FETCH_CAP_BYTES);
  const bool fetchOk = HttpDownloader::fetchUrlFromMarkerStreamed(
      chapterUrl, "<div id=\"chapter-c\" class=\"chapter-c\"",
      [&extractor](const uint8_t* data, size_t size) { return extractor.feed(data, size); });
  if (fetchOk && extractor.started() && extractor.finished() && !extractor.overflowed()) {
    return extractor.innerHtml();
  }
  if (extractor.overflowed()) {
    HttpDownloader::clearLastError();
  }
  return "";
}

void normalizeTocOrder(std::vector<HakoChapterRef>& toc) {
  std::stable_sort(toc.begin(), toc.end(), [](const HakoChapterRef& left, const HakoChapterRef& right) {
    return left.index < right.index;
  });
  for (size_t i = 0; i < toc.size(); ++i) {
    toc[i].index = static_cast<uint32_t>(i + 1);
  }
}

bool classHasToken(const std::string& classAttr, const char* token) {
  std::string lower = classAttr;
  std::transform(lower.begin(), lower.end(), lower.begin(),
                 [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
  std::string needle = token;
  std::transform(needle.begin(), needle.end(), needle.begin(),
                 [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
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

class TruyenFullHomeStreamParser {
 public:
  TruyenFullHomeStreamParser(const std::string& baseUrl)
      : baseUrl_(baseUrl),
        tokenizer_(
            [this](const HtmlLiteStartTag& tag) { return onStartTag(tag); },
            [this](const std::string& tagName) { return onEndTag(tagName); },
            [this](const std::string& text) { return onText(text); }) {
    stack_.reserve(16);
    results_.reserve(SEARCH_PAGE_SIZE);
  }

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
  static std::string normalizeText(const std::string& value) { return normalizeDisplayText(htmlDecode(value)); }

  bool hasAncestorClass(const char* token) const {
    for (auto it = stack_.rbegin(); it != stack_.rend(); ++it) {
      if (classHasToken(it->classAttr, token)) {
        return true;
      }
    }
    return false;
  }

  void finalizeCurrentItem() {
    if (!rowActive_) {
      return;
    }

    currentItem_.title = normalizeText(currentItem_.title);
    currentItem_.description = normalizeText(currentItem_.description);
    currentItem_.homeLatestChapterTitle = normalizeText(currentItem_.homeLatestChapterTitle);
    currentItem_.homeSectionLabel = "Moi cap nhat";
    currentItem_.homeDisplaySubtitle = currentItem_.homeLatestChapterTitle.empty() ? currentItem_.description
                                                                                   : currentItem_.homeLatestChapterTitle;
    if (!currentItem_.title.empty() && !currentItem_.url.empty()) {
      results_.push_back(currentItem_);
    }

    currentItem_ = HakoSearchResult{};
    rowActive_ = false;
    rowDepth_ = 0;
  }

  bool onStartTag(const HtmlLiteStartTag& tag) {
    std::string classAttr;
    if (const auto* classValue = findAttrValue(tag, "class")) {
      classAttr = *classValue;
    }
    const auto* itemprop = findAttrValue(tag, "itemprop");
    stack_.push_back(HtmlNodeContext{tag.name, classAttr});
    const size_t depth = stack_.size();

    if (tag.name == "div" && classHasToken(classAttr, "row")) {
      const auto* itemScope = findAttrValue(tag, "itemscope");
      const auto* itemType = findAttrValue(tag, "itemtype");
      if (itemScope || (itemType && itemType->find("Book") != std::string::npos)) {
        finalizeCurrentItem();
        rowActive_ = true;
        rowDepth_ = depth;
        currentItem_ = HakoSearchResult{};
      }
    }

    if (!rowActive_) {
      return true;
    }

    if (const auto* dataClassName = findAttrValue(tag, "data-classname")) {
      if (*dataClassName == "cover") {
        if (const auto* dataImage = findAttrValue(tag, "data-image")) {
          currentItem_.coverUrl = htmlDecode(*dataImage);
        }
      }
    }

    if (classHasToken(classAttr, "author")) {
      authorCapture_ = true;
      authorDepth_ = depth;
      authorText_.clear();
    }

    if (classHasToken(classAttr, "text-info")) {
      latestCapture_ = true;
      latestDepth_ = depth;
      latestText_.clear();
    }

    if (tag.name == "a") {
      if (hasAncestorClass("truyen-title")) {
        titleAnchorCapture_ = true;
        titleAnchorDepth_ = depth;
        titleAnchorText_.clear();
        if (const auto* href = findAttrValue(tag, "href")) {
          currentItem_.url = makeAbsoluteUrl(baseUrl_, *href);
        }
        if (const auto* title = findAttrValue(tag, "title")) {
          currentItem_.title = htmlDecode(*title);
        }
      } else if (latestCapture_) {
        latestAnchorCapture_ = true;
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

    if (titleAnchorCapture_ && depth == titleAnchorDepth_ && node.tagName == "a") {
      if (currentItem_.title.empty()) {
        currentItem_.title = normalizeText(titleAnchorText_);
      }
      titleAnchorCapture_ = false;
      titleAnchorText_.clear();
    }

    if (authorCapture_ && depth == authorDepth_ && classHasToken(node.classAttr, "author")) {
      const std::string author = normalizeText(authorText_);
      currentItem_.description = author.empty() ? std::string{} : ("Tac gia: " + author);
      authorCapture_ = false;
      authorText_.clear();
    }

    if (latestCapture_ && depth == latestDepth_ && classHasToken(node.classAttr, "text-info")) {
      currentItem_.homeLatestChapterTitle = normalizeText(latestText_);
      latestCapture_ = false;
      latestAnchorCapture_ = false;
      latestText_.clear();
    }

    if (rowActive_ && depth == rowDepth_ && node.tagName == "div" && classHasToken(node.classAttr, "row")) {
      finalizeCurrentItem();
    }

    stack_.pop_back();
    return true;
  }

  bool onText(const std::string& text) {
    if (titleAnchorCapture_) {
      titleAnchorText_ += text;
    }
    if (authorCapture_) {
      authorText_ += text;
    }
    if (latestCapture_ && latestAnchorCapture_) {
      latestText_ += text;
    }
    return true;
  }

  std::string baseUrl_;
  HtmlLiteTokenizer tokenizer_;
  std::vector<HtmlNodeContext> stack_;
  std::vector<HakoSearchResult> results_;
  std::string snippet_;
  HakoSearchResult currentItem_;
  bool rowActive_ = false;
  size_t rowDepth_ = 0;
  bool titleAnchorCapture_ = false;
  size_t titleAnchorDepth_ = 0;
  std::string titleAnchorText_;
  bool authorCapture_ = false;
  size_t authorDepth_ = 0;
  std::string authorText_;
  bool latestCapture_ = false;
  size_t latestDepth_ = 0;
  bool latestAnchorCapture_ = false;
  std::string latestText_;
};

class TruyenFullTocPageStreamParser {
 public:
  explicit TruyenFullTocPageStreamParser(const std::string& baseUrl)
      : baseUrl_(baseUrl),
        tokenizer_(
            [this](const HtmlLiteStartTag& tag) { return onStartTag(tag); },
            [this](const std::string& tagName) { return onEndTag(tagName); },
            [this](const std::string& text) { return onText(text); }) {
    stack_.reserve(16);
    toc_.reserve(TOC_PAGE_SIZE);
  }

  bool feed(const uint8_t* data, size_t size) {
    if (snippet_.size() < 4096 && data && size > 0) {
      const size_t toCopy = std::min<size_t>(4096 - snippet_.size(), size);
      snippet_.append(reinterpret_cast<const char*>(data), toCopy);
    }
    return tokenizer_.feed(reinterpret_cast<const char*>(data), size);
  }

  bool finish() {
    const bool ok = tokenizer_.finish();
    return ok;
  }

  const std::vector<HakoChapterRef>& toc() const { return toc_; }
  std::vector<HakoChapterRef> takeToc() { return std::move(toc_); }
  int totalPages() const { return totalPages_; }
  const std::string& snippet() const { return snippet_; }

 private:
  static int parseTocPageNumberFromHref(const std::string& href) {
    const size_t markerPos = href.find("/trang-");
    if (markerPos == std::string::npos) {
      return 0;
    }

    size_t pos = markerPos + 7;
    int page = 0;
    bool foundDigit = false;
    while (pos < href.size() && std::isdigit(static_cast<unsigned char>(href[pos]))) {
      foundDigit = true;
      page = page * 10 + (href[pos] - '0');
      ++pos;
    }
    return foundDigit ? page : 0;
  }

  bool hasAncestorClass(const char* token) const {
    for (auto it = stack_.rbegin(); it != stack_.rend(); ++it) {
      if (classHasToken(it->classAttr, token)) {
        return true;
      }
    }
    return false;
  }

  static std::string normalizeText(const std::string& value) { return normalizeDisplayText(htmlDecode(value)); }

  bool onStartTag(const HtmlLiteStartTag& tag) {
    std::string classAttr;
    if (const auto* classValue = findAttrValue(tag, "class")) {
      classAttr = *classValue;
    }
    const auto* itemprop = findAttrValue(tag, "itemprop");
    stack_.push_back(HtmlNodeContext{tag.name, classAttr});
    const size_t depth = stack_.size();

    if (tag.name == "a") {
      if (const auto* href = findAttrValue(tag, "href")) {
        const int parsedPage = parseTocPageNumberFromHref(*href);
        if (parsedPage > totalPages_) {
          totalPages_ = parsedPage;
        }
      }
    }

    if (tag.name == "ul" && classHasToken(classAttr, "list-chapter")) {
      listActive_ = true;
      listDepth_ = depth;
    }

    if (!listActive_) {
      return true;
    }

    if (tag.name == "li" && hasAncestorClass("list-chapter")) {
      itemActive_ = true;
      itemDepth_ = depth;
      itemText_.clear();
      itemUrl_.clear();
    }

    if (itemActive_ && tag.name == "a") {
      itemAnchorCapture_ = true;
      itemAnchorDepth_ = depth;
      itemText_.clear();
      if (const auto* href = findAttrValue(tag, "href")) {
        itemUrl_ = makeAbsoluteUrl(baseUrl_, *href);
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

    if (itemAnchorCapture_ && depth == itemAnchorDepth_ && node.tagName == "a") {
      itemAnchorCapture_ = false;
    }

    if (itemActive_ && depth == itemDepth_ && node.tagName == "li") {
      HakoChapterRef ref;
      ref.title = normalizeText(itemText_);
      ref.url = itemUrl_;
      ref.index = static_cast<uint32_t>(toc_.size() + 1);
      if (!ref.title.empty() && !ref.url.empty()) {
        toc_.push_back(std::move(ref));
      }
      itemActive_ = false;
      itemText_.clear();
      itemUrl_.clear();
    }

    if (listActive_ && depth == listDepth_ && node.tagName == "ul" && classHasToken(node.classAttr, "list-chapter")) {
      listActive_ = false;
    }

    stack_.pop_back();
    return true;
  }

  bool onText(const std::string& text) {
    if (itemActive_ && itemAnchorCapture_) {
      itemText_ += text;
    }
    return true;
  }

  std::string baseUrl_;
  HtmlLiteTokenizer tokenizer_;
  std::vector<HtmlNodeContext> stack_;
  std::vector<HakoChapterRef> toc_;
  std::string snippet_;
  int totalPages_ = 1;
  bool listActive_ = false;
  size_t listDepth_ = 0;
  bool itemActive_ = false;
  size_t itemDepth_ = 0;
  bool itemAnchorCapture_ = false;
  size_t itemAnchorDepth_ = 0;
  std::string itemText_;
  std::string itemUrl_;
};

class TruyenFullDetailStreamParser {
 public:
  explicit TruyenFullDetailStreamParser(const std::string& baseUrl)
      : baseUrl_(baseUrl),
        tokenizer_(
            [this](const HtmlLiteStartTag& tag) { return onStartTag(tag); },
            [this](const std::string& tagName) { return onEndTag(tagName); },
            [this](const std::string& text) { return onText(text); }) {
    stack_.reserve(20);
  }

  bool feed(const uint8_t* data, size_t size) {
    if (snippet_.size() < 3072 && data && size > 0) {
      const size_t toCopy = std::min<size_t>(3072 - snippet_.size(), size);
      snippet_.append(reinterpret_cast<const char*>(data), toCopy);
    }
    return tokenizer_.feed(reinterpret_cast<const char*>(data), size);
  }

  bool finish() {
    const bool ok = tokenizer_.finish();
    finalizeInfoBlock();
    return ok;
  }

  const HakoBookDetail& detail() const { return detail_; }
  const std::string& snippet() const { return snippet_; }

 private:
  struct InfoBlockState {
    std::string text;
    std::vector<std::string> anchors;
  };

  static std::string normalizeText(const std::string& value) { return normalizeDisplayText(htmlDecode(value)); }

  bool hasAncestorClass(const char* token) const {
    for (auto it = stack_.rbegin(); it != stack_.rend(); ++it) {
      if (classHasToken(it->classAttr, token)) {
        return true;
      }
    }
    return false;
  }

  static bool containsLabel(const std::string& text, const char* needle) {
    return toLowerAscii(text).find(toLowerAscii(std::string(needle))) != std::string::npos;
  }

  void finalizeInfoBlock() {
    if (!infoBlockActive_) {
      return;
    }

    const std::string text = normalizeText(infoBlock_.text);
    if (containsLabel(text, "tac gia")) {
      if (!infoBlock_.anchors.empty()) {
        detail_.author = normalizeText(infoBlock_.anchors.front());
      } else if (detail_.author.empty()) {
        detail_.author = text;
      }
    } else if (containsLabel(text, "the loai")) {
      if (!infoBlock_.anchors.empty()) {
        detail_.genres.clear();
        for (const auto& genre : infoBlock_.anchors) {
          const std::string normalized = normalizeText(genre);
          if (!normalized.empty()) {
            detail_.genres.push_back(normalized);
          }
        }
      }
    } else if (containsLabel(text, "trang thai")) {
      detail_.ongoing = !(containsLabel(text, "full") || containsLabel(text, "hoan"));
    }

    infoBlock_ = InfoBlockState{};
    infoBlockActive_ = false;
    infoBlockDepth_ = 0;
  }

  bool onStartTag(const HtmlLiteStartTag& tag) {
    std::string classAttr;
    if (const auto* classValue = findAttrValue(tag, "class")) {
      classAttr = *classValue;
    }
    const auto* itemprop = findAttrValue(tag, "itemprop");
    stack_.push_back(HtmlNodeContext{tag.name, classAttr});
    const size_t depth = stack_.size();

    if (tag.name == "meta") {
      const auto* property = findAttrValue(tag, "property");
      const auto* content = findAttrValue(tag, "content");
      if (property && content && *property == "og:image" && detail_.coverUrl.empty()) {
        detail_.coverUrl = htmlDecode(*content);
      }
    }

    if ((tag.name == "h3" && classHasToken(classAttr, "title")) ||
        (tag.name == "h1" && ((itemprop && *itemprop == "name") || classHasToken(classAttr, "title")))) {
      titleCapture_ = true;
      titleDepth_ = depth;
      titleText_.clear();
    }

    if (tag.name == "div" && classHasToken(classAttr, "book")) {
      bookCapture_ = true;
      bookDepth_ = depth;
    }
    if (bookCapture_ && tag.name == "img" && detail_.coverUrl.empty()) {
      if (const auto* src = findAttrValue(tag, "src")) {
        detail_.coverUrl = htmlDecode(*src);
      }
    }

    if (tag.name == "div" && classHasToken(classAttr, "desc-text")) {
      descCapture_ = true;
      descDepth_ = depth;
      descText_.clear();
    }

    if (tag.name == "ul" && classHasToken(classAttr, "l-chapters")) {
      latestListActive_ = true;
      latestListDepth_ = depth;
    }
    if (latestListActive_ && tag.name == "a" && detail_.latestChapterUrl.empty()) {
      latestAnchorCapture_ = true;
      latestAnchorDepth_ = depth;
      latestAnchorText_.clear();
      if (const auto* href = findAttrValue(tag, "href")) {
        detail_.latestChapterUrl = makeAbsoluteUrl(baseUrl_, *href);
      }
    }

    if (tag.name == "div" && classHasToken(classAttr, "info")) {
      finalizeInfoBlock();
      infoBlockActive_ = true;
      infoBlockDepth_ = depth;
      infoBlock_ = InfoBlockState{};
    }
    if (infoBlockActive_ && tag.name == "a") {
      infoAnchorCapture_ = true;
      infoAnchorDepth_ = depth;
      infoAnchorText_.clear();
    }

    return true;
  }

  bool onEndTag(const std::string&) {
    if (stack_.empty()) {
      return true;
    }

    const HtmlNodeContext node = stack_.back();
    const size_t depth = stack_.size();

    if (titleCapture_ && depth == titleDepth_) {
      detail_.title = normalizeText(titleText_);
      titleCapture_ = false;
      titleText_.clear();
    }

    if (bookCapture_ && depth == bookDepth_ && node.tagName == "div" && classHasToken(node.classAttr, "book")) {
      bookCapture_ = false;
    }

    if (descCapture_ && depth == descDepth_ && node.tagName == "div" && classHasToken(node.classAttr, "desc-text")) {
      const std::string summary = normalizeText(descText_);
      detail_.descriptionHtml = summary.empty() ? std::string{} : ("<p>" + summary + "</p>");
      capRetainedHtml(detail_.descriptionHtml, DETAIL_DESCRIPTION_CAP_BYTES);
      descCapture_ = false;
      descText_.clear();
    }

    if (latestAnchorCapture_ && depth == latestAnchorDepth_ && node.tagName == "a") {
      detail_.latestChapterTitle = normalizeText(latestAnchorText_);
      latestAnchorCapture_ = false;
      latestAnchorText_.clear();
    }

    if (latestListActive_ && depth == latestListDepth_ && node.tagName == "ul" && classHasToken(node.classAttr, "l-chapters")) {
      latestListActive_ = false;
    }

    if (infoAnchorCapture_ && depth == infoAnchorDepth_ && node.tagName == "a") {
      const std::string anchorText = normalizeText(infoAnchorText_);
      if (!anchorText.empty()) {
        infoBlock_.anchors.push_back(anchorText);
      }
      infoAnchorCapture_ = false;
      infoAnchorText_.clear();
    }

    if (infoBlockActive_ && depth == infoBlockDepth_ && node.tagName == "div" && classHasToken(node.classAttr, "info")) {
      finalizeInfoBlock();
    }

    stack_.pop_back();
    return true;
  }

  bool onText(const std::string& text) {
    if (titleCapture_) {
      titleText_ += text;
    }
    if (descCapture_) {
      descText_ += text;
    }
    if (latestAnchorCapture_) {
      latestAnchorText_ += text;
    }
    if (infoBlockActive_) {
      infoBlock_.text += text;
    }
    if (infoAnchorCapture_) {
      infoAnchorText_ += text;
    }
    return true;
  }

  std::string baseUrl_;
  HtmlLiteTokenizer tokenizer_;
  std::vector<HtmlNodeContext> stack_;
  HakoBookDetail detail_;
  std::string snippet_;
  bool titleCapture_ = false;
  size_t titleDepth_ = 0;
  std::string titleText_;
  bool bookCapture_ = false;
  size_t bookDepth_ = 0;
  bool descCapture_ = false;
  size_t descDepth_ = 0;
  std::string descText_;
  bool latestListActive_ = false;
  size_t latestListDepth_ = 0;
  bool latestAnchorCapture_ = false;
  size_t latestAnchorDepth_ = 0;
  std::string latestAnchorText_;
  bool infoBlockActive_ = false;
  size_t infoBlockDepth_ = 0;
  InfoBlockState infoBlock_;
  bool infoAnchorCapture_ = false;
  size_t infoAnchorDepth_ = 0;
  std::string infoAnchorText_;
};
}  // namespace

bool TruyenFullPluginExecutor::fetchHomeFeed(const std::string& baseUrl, std::vector<HakoSearchResult>& outResults) {
  const std::string resolvedBaseUrl = normalizeBaseUrl(baseUrl);

  TruyenFullHomeStreamParser streamParser(resolvedBaseUrl);
  const std::string homeUrl = resolvedBaseUrl + "/danh-sach/truyen-moi/";
  if (HttpDownloader::fetchUrlFromMarkerStreamed(homeUrl, "<div class=\"row\" itemscope",
                                                 [&streamParser](const uint8_t* data, size_t size) {
                                                   return streamParser.feed(data, size);
                                                 })) {
    streamParser.finish();
    outResults = streamParser.takeResults();
  }

  if (!outResults.empty()) {
    if (static_cast<int>(outResults.size()) > SEARCH_PAGE_SIZE) {
      outResults.resize(SEARCH_PAGE_SIZE);
    }
    return true;
  }
  const std::string reason = HttpDownloader::getLastError().empty() ? std::string("Home feed parser found no entries")
                                                                     : HttpDownloader::getLastError();
  std::string markerHtml;
  if (shouldAttemptHeavyHtmlFallback() &&
      HttpDownloader::fetchUrlFromMarkerCapped(homeUrl, markerHtml, "<div class=\"row\" itemscope",
                                               LISTING_MARKER_FETCH_CAP_BYTES, true) &&
      (parseListingPage(resolvedBaseUrl, markerHtml, outResults) ||
       parseThumbnailListingPage(resolvedBaseUrl, markerHtml, outResults))) {
    if (static_cast<int>(outResults.size()) > SEARCH_PAGE_SIZE) {
      outResults.resize(SEARCH_PAGE_SIZE);
    }
    return true;
  }
  OnlineDebugLog::logParserFailure("TruyenFull", "home", homeUrl, reason, streamParser.snippet());
  return false;
}

bool TruyenFullPluginExecutor::search(const std::string& baseUrl, const std::string& query, int page,
                                      std::vector<HakoSearchResult>& outResults) {
  const std::string resolvedBaseUrl = normalizeBaseUrl(baseUrl);
  const int safePage = page < 1 ? 1 : page;
  const std::string url =
      resolvedBaseUrl + "/tim-kiem/?tukhoa=" + urlEncode(query) + "&paged=" + std::to_string(safePage);

  TruyenFullHomeStreamParser streamParser(resolvedBaseUrl);
  if (HttpDownloader::fetchUrlFromMarkerStreamed(url, "<div class=\"row\" itemscope",
                                                 [&streamParser](const uint8_t* data, size_t size) {
                                                   return streamParser.feed(data, size);
                                                 })) {
    streamParser.finish();
    outResults = streamParser.takeResults();
  }

  if (outResults.empty()) {
    std::string markerHtml;
    if (shouldAttemptHeavyHtmlFallback() &&
        HttpDownloader::fetchUrlFromMarkerCapped(url, markerHtml, "<div class=\"row\" itemscope",
                                                 LISTING_MARKER_FETCH_CAP_BYTES, true) &&
        (parseListingPage(resolvedBaseUrl, markerHtml, outResults) ||
         parseThumbnailListingPage(resolvedBaseUrl, markerHtml, outResults))) {
      if (static_cast<int>(outResults.size()) > SEARCH_PAGE_SIZE) {
        outResults.resize(SEARCH_PAGE_SIZE);
      }
      return true;
    }
    const std::string reason = HttpDownloader::getLastError().empty() ? std::string("Search parser found no entries")
                                                                       : HttpDownloader::getLastError();
    OnlineDebugLog::logParserFailure("TruyenFull", "search", url, reason, streamParser.snippet());
    return false;
  }

  if (static_cast<int>(outResults.size()) > SEARCH_PAGE_SIZE) {
    outResults.resize(SEARCH_PAGE_SIZE);
  }
  return true;
}

bool TruyenFullPluginExecutor::fetchDetail(const std::string& baseUrl, const std::string& url, HakoBookDetail& outDetail) {
  const std::string resolvedUrl = makeAbsoluteUrl(baseUrl, url);
  auto parseDetailStreaming = [&]() {
    TruyenFullDetailStreamParser streamParser(baseUrl);
    if (!HttpDownloader::fetchUrlFromMarkerStreamed(
            resolvedUrl, "<meta property=\"og:image\"",
            [&streamParser](const uint8_t* data, size_t size) { return streamParser.feed(data, size); })) {
      return false;
    }

    if (!streamParser.finish()) {
      OnlineDebugLog::logParserFailure("TruyenFull", "detail", resolvedUrl, "Streaming tokenizer failed",
                                       streamParser.snippet());
      return false;
    }

    outDetail = streamParser.detail();
    outDetail.url = resolvedUrl;
    if (!outDetail.title.empty()) {
      return true;
    }

    OnlineDebugLog::logParserFailure("TruyenFull", "detail", resolvedUrl, "Streaming detail parser found no title",
                                     streamParser.snippet());
    return false;
  };

  auto parseDetailHtml = [&](const std::string& html) {
    outDetail = {};
    outDetail.url = resolvedUrl;
    outDetail.title = stripTags(extractBlock(html, "<h3 class=\"title\"", "</h3>"));
    if (outDetail.title.empty()) {
      outDetail.title = stripTags(extractBlock(html, "<h1 itemprop=\"name\"", "</h1>"));
    }
    if (outDetail.title.empty()) {
      outDetail.title = stripTags(extractBlock(html, "<h1 class=\"title\"", "</h1>"));
    }
    outDetail.author = extractAuthor(html);
    outDetail.coverUrl = extractAttr(html, "<div class=\"book\"", "src");
    if (outDetail.coverUrl.empty()) {
      outDetail.coverUrl = extractAttr(html, "<meta property=\"og:image\"", "content");
    }
    outDetail.descriptionHtml = extractBlock(html, "<div class=\"desc-text desc-text-full\"", "</div>");
    if (outDetail.descriptionHtml.empty()) {
      outDetail.descriptionHtml = extractBlock(html, "<div class=\"desc-text\"", "</div>");
    }
    capRetainedHtml(outDetail.descriptionHtml, DETAIL_DESCRIPTION_CAP_BYTES);
    {
      std::string latestUrl;
      std::string latestTitle;
      const std::string latestBlock = extractBlock(html, "<ul class=\"l-chapters\"", "</ul>");
      if (!latestBlock.empty() && extractAnchor(baseUrl, latestBlock, latestUrl, latestTitle)) {
        outDetail.latestChapterUrl = latestUrl;
        outDetail.latestChapterTitle = normalizeDisplayText(latestTitle);
      }
    }
    parseGenres(html, outDetail.genres);
    outDetail.ongoing = !isCompleted(html);
  };

  if (parseDetailStreaming()) {
    return true;
  }

  std::string html;
  if (HttpDownloader::fetchUrlFromMarkerCapped(resolvedUrl, html, "<meta property=\"og:image\"",
                                               DETAIL_FETCH_CAP_BYTES, true) &&
      !html.empty()) {
    parseDetailHtml(html);
    if (!outDetail.title.empty()) {
      return true;
    }
  }

  if (!shouldAttemptHeavyHtmlFallback() || !fetchPage(resolvedUrl, html, DETAIL_FETCH_CAP_BYTES, true)) {
    return false;
  }

  parseDetailHtml(html);
  if (outDetail.title.empty()) {
    OnlineDebugLog::logParserFailure("TruyenFull", "detail", resolvedUrl, "Title not parsed", html);
  }
  return !outDetail.title.empty();
}

bool TruyenFullPluginExecutor::fetchTocPage(const std::string& baseUrl, const std::string& url, int page,
                                            std::vector<HakoChapterRef>& outToc, int& outTotalPages) {
  const int safePage = page < 1 ? 1 : page;
  const std::string resolvedUrl = makeAbsoluteUrl(baseUrl, url);
  const std::string trimmedUrl = trim(resolvedUrl);
  const std::string pageUrl =
      safePage <= 1 ? trimmedUrl
                    : (trimmedUrl.back() == '/' ? (trimmedUrl + "trang-" + std::to_string(safePage) + "/")
                                                : (trimmedUrl + "/trang-" + std::to_string(safePage) + "/"));

  TruyenFullTocPageStreamParser streamParser(baseUrl);
  if (HttpDownloader::fetchUrlFromMarkerStreamed(pageUrl, "list-chapter",
                                                 [&streamParser](const uint8_t* data, size_t size) {
                                                   return streamParser.feed(data, size);
                                                 })) {
    streamParser.finish();
    outToc = streamParser.takeToc();
    outTotalPages = streamParser.totalPages();
    if (outTotalPages < 1) {
      outTotalPages = 1;
    }
    if (outToc.size() < TOC_PAGE_SIZE && outTotalPages > safePage) {
      outTotalPages = safePage;
    }
    if (outTotalPages < safePage) {
      outTotalPages = safePage;
    }
    if (!outToc.empty()) {
      return true;
    }
  }

  std::string html;
  OnlineDebugLog::logParserFailure("TruyenFull", "toc-page", pageUrl,
                                   HttpDownloader::getLastError().empty() ? std::string("No chapters parsed on TOC page")
                                                                          : HttpDownloader::getLastError(),
                                   streamParser.snippet());
  return false;
}

bool TruyenFullPluginExecutor::fetchToc(const std::string& baseUrl, const std::string& url,
                                        std::vector<HakoChapterRef>& outToc) {
  int lastPage = 1;
  std::vector<HakoChapterRef> pageToc;
  if (!fetchTocPage(baseUrl, url, 1, pageToc, lastPage)) {
    return false;
  }
  outToc = std::move(pageToc);
  if (lastPage <= 1) {
    normalizeTocOrder(outToc);
    return !outToc.empty();
  }

  for (int page = 2; page <= lastPage; ++page) {
    pageToc.clear();
    int ignoredTotalPages = lastPage;
    if (!fetchTocPage(baseUrl, url, page, pageToc, ignoredTotalPages)) {
      return false;
    }
    outToc.insert(outToc.end(), pageToc.begin(), pageToc.end());
  }

  normalizeTocOrder(outToc);
  return !outToc.empty();
}

bool TruyenFullPluginExecutor::fetchChapter(const std::string& baseUrl, const HakoChapterRef& ref,
                                            HakoChapterContent& outContent, bool includePlainText) {
  std::string html;
  const std::string chapterUrl = makeAbsoluteUrl(baseUrl, ref.url);
  std::string bodyHtml = streamChapterBody(chapterUrl);
  if (bodyHtml.empty()) {
    if (HttpDownloader::fetchUrlFromMarkerCapped(chapterUrl, html, "<div id=\"chapter-c\" class=\"chapter-c\"",
                                                 CHAPTER_FETCH_CAP_BYTES, true)) {
      if (html.empty()) {
        return false;
      }
      bodyHtml = extractChapterBody(html);
    } else if (shouldAttemptHeavyHtmlFallback()) {
      if (!fetchPage(chapterUrl, html, CHAPTER_FETCH_CAP_BYTES, true)) {
        return false;
      }
      bodyHtml = extractChapterBody(html);
    } else {
      return false;
    }
  }

  if (bodyHtml.empty()) {
    OnlineDebugLog::logParserFailure("TruyenFull", "chapter", chapterUrl, "Chapter body missing", html);
    return false;
  }

  std::string().swap(html);
  outContent = {};
  outContent.ref = ref;
  outContent.html = std::move(bodyHtml);
  if (includePlainText) {
    outContent.text = stripTags(outContent.html);
  } else {
    outContent.text.clear();
  }
  if (includePlainText && outContent.text.empty()) {
    OnlineDebugLog::logParserFailure("TruyenFull", "chapter", chapterUrl, "Chapter text empty", html);
  }
  return includePlainText ? !outContent.text.empty() : !outContent.html.empty();
}

void TruyenFullPluginExecutor::clearMemoryCaches() {}
