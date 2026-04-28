#include "TruyenFullPluginExecutor.h"

#include <Arduino.h>
#include <Logging.h>

#include <algorithm>
#include <cctype>
#include <cstring>

#include "network/HttpDownloader.h"
#include "util/StringUtils.h"

namespace {
constexpr char MODULE[] = "TFULL";
constexpr unsigned long HOME_FEED_CACHE_TTL_MS = 120000;
constexpr int SEARCH_PAGE_SIZE = 20;

struct HomeFeedCacheEntry {
  std::string baseUrl;
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

bool fetchPage(const std::string& url, std::string& outHtml) {
  if (!HttpDownloader::fetchUrl(url, outHtml)) {
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

void normalizeTocOrder(std::vector<HakoChapterRef>& toc) {
  std::stable_sort(toc.begin(), toc.end(), [](const HakoChapterRef& left, const HakoChapterRef& right) {
    return left.index < right.index;
  });
  for (size_t i = 0; i < toc.size(); ++i) {
    toc[i].index = static_cast<uint32_t>(i + 1);
  }
}
}  // namespace

bool TruyenFullPluginExecutor::fetchHomeFeed(const std::string& baseUrl, std::vector<HakoSearchResult>& outResults) {
  const std::string resolvedBaseUrl = normalizeBaseUrl(baseUrl);
  const unsigned long now = millis();
  if (g_homeFeedCache.valid && g_homeFeedCache.baseUrl == resolvedBaseUrl &&
      (now - g_homeFeedCache.fetchedAtMs) < HOME_FEED_CACHE_TTL_MS) {
    outResults = g_homeFeedCache.results;
    return true;
  }

  std::string html;
  if (!fetchPage(resolvedBaseUrl + "/danh-sach/truyen-moi/", html)) {
    return false;
  }

  if (!parseListingPage(resolvedBaseUrl, html, outResults) &&
      !parseThumbnailListingPage(resolvedBaseUrl, html, outResults)) {
    return false;
  }

  if (static_cast<int>(outResults.size()) > SEARCH_PAGE_SIZE) {
    outResults.resize(SEARCH_PAGE_SIZE);
  }

  g_homeFeedCache.baseUrl = resolvedBaseUrl;
  g_homeFeedCache.results = outResults;
  g_homeFeedCache.fetchedAtMs = now;
  g_homeFeedCache.valid = true;
  return true;
}

bool TruyenFullPluginExecutor::search(const std::string& baseUrl, const std::string& query, int page,
                                      std::vector<HakoSearchResult>& outResults) {
  const std::string resolvedBaseUrl = normalizeBaseUrl(baseUrl);
  const int safePage = page < 1 ? 1 : page;
  std::string html;
  const std::string url =
      resolvedBaseUrl + "/tim-kiem/?tukhoa=" + urlEncode(query) + "&paged=" + std::to_string(safePage);
  if (!fetchPage(url, html)) {
    return false;
  }

  if (!parseListingPage(resolvedBaseUrl, html, outResults)) {
    outResults.clear();
    return true;
  }

  if (static_cast<int>(outResults.size()) > SEARCH_PAGE_SIZE) {
    outResults.resize(SEARCH_PAGE_SIZE);
  }
  return true;
}

bool TruyenFullPluginExecutor::fetchDetail(const std::string& baseUrl, const std::string& url, HakoBookDetail& outDetail) {
  std::string html;
  const std::string resolvedUrl = makeAbsoluteUrl(baseUrl, url);
  if (!fetchPage(resolvedUrl, html)) {
    return false;
  }

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

  std::string html;
  if (!fetchPage(pageUrl, html)) {
    return false;
  }

  outToc.clear();
  parseTocPage(baseUrl, html, outToc);
  outTotalPages = parseLastTocPage(html);
  if (outTotalPages < 1) {
    outTotalPages = 1;
  }
  return !outToc.empty();
}

bool TruyenFullPluginExecutor::fetchToc(const std::string& baseUrl, const std::string& url,
                                        std::vector<HakoChapterRef>& outToc) {
  int lastPage = 1;
  if (!fetchTocPage(baseUrl, url, 1, outToc, lastPage)) {
    return false;
  }
  const std::string resolvedUrl = makeAbsoluteUrl(baseUrl, url);

  for (int page = 2; page <= lastPage; ++page) {
    std::string pageHtml;
    const std::string trimmedUrl = trim(resolvedUrl);
    const std::string pageUrl = trimmedUrl.back() == '/' ? (trimmedUrl + "trang-" + std::to_string(page) + "/")
                                                          : (trimmedUrl + "/trang-" + std::to_string(page) + "/");
    if (!fetchPage(pageUrl, pageHtml)) {
      return false;
    }
    parseTocPage(baseUrl, pageHtml, outToc);
  }

  normalizeTocOrder(outToc);
  return !outToc.empty();
}

bool TruyenFullPluginExecutor::fetchChapter(const std::string& baseUrl, const HakoChapterRef& ref,
                                            HakoChapterContent& outContent) {
  std::string html;
  if (!fetchPage(makeAbsoluteUrl(baseUrl, ref.url), html)) {
    return false;
  }

  const std::string bodyHtml = extractChapterBody(html);
  if (bodyHtml.empty()) {
    return false;
  }

  outContent = {};
  outContent.ref = ref;
  outContent.html = bodyHtml;
  outContent.text = stripTags(bodyHtml);
  return !outContent.text.empty();
}
