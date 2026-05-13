#include "OpdsParser.h"

#include <Logging.h>
#include <XmlParserUtils.h>

#include <cstring>

namespace {
constexpr size_t MAX_OPDS_TITLE_LEN = 160;
constexpr size_t MAX_OPDS_AUTHOR_LEN = 96;
constexpr size_t MAX_OPDS_ID_LEN = 160;
constexpr size_t MAX_OPDS_SUMMARY_LEN = 384;
constexpr size_t MAX_OPDS_FEED_TITLE_LEN = 160;
constexpr size_t MAX_OPDS_LIGHTWEIGHT_ENTRIES = 64;
constexpr size_t MAX_OPDS_EXTENDED_ENTRIES = 24;

bool isBookAcquisitionType(const char* type) {
  if (!type) {
    return false;
  }
  return strcmp(type, "application/epub+zip") == 0 || strncmp(type, "text/plain", 10) == 0 ||
         strncmp(type, "text/markdown", 13) == 0;
}

size_t currentTextLimit(const bool inSummary, const bool inContent, const bool inAuthorName, const bool inId,
                        const bool inFeedTitle) {
  if (inSummary || inContent) {
    return MAX_OPDS_SUMMARY_LEN;
  }
  if (inAuthorName) {
    return MAX_OPDS_AUTHOR_LEN;
  }
  if (inId) {
    return MAX_OPDS_ID_LEN;
  }
  if (inFeedTitle) {
    return MAX_OPDS_FEED_TITLE_LEN;
  }
  return MAX_OPDS_TITLE_LEN;
}

void appendCapped(std::string& target, const XML_Char* s, const int len, const size_t maxLen) {
  if (len <= 0 || target.size() >= maxLen) {
    return;
  }
  const size_t remaining = maxLen - target.size();
  const size_t appendLen = std::min(static_cast<size_t>(len), remaining);
  target.append(s, appendLen);
}
}  // namespace

OpdsParser::OpdsParser(const bool captureExtendedMetadata, const size_t maxEntriesOverride)
    : captureExtendedMetadata(captureExtendedMetadata) {
  // Ensure safe caps to avoid heap exhaustion on large OPDS feeds.
  size_t effectiveCap = maxEntriesOverride > 0 ? maxEntriesOverride : 0;
  if (effectiveCap == 0) {
    effectiveCap = captureExtendedMetadata ? MAX_OPDS_EXTENDED_ENTRIES
                                          : MAX_OPDS_LIGHTWEIGHT_ENTRIES;
  }
  maxEntries = std::min(effectiveCap,
                        captureExtendedMetadata ? MAX_OPDS_EXTENDED_ENTRIES
                                                : MAX_OPDS_LIGHTWEIGHT_ENTRIES);
  if (maxEntries > 0) {
    entries.reserve(maxEntries);
  }
  parser = XML_ParserCreate(nullptr);
  if (!parser) {
    errorOccured = true;
    LOG_DBG("OPDS", "Couldn't allocate memory for parser");
  }
}
OpdsParser::~OpdsParser() { destroyXmlParser(parser); }

size_t OpdsParser::write(uint8_t c) { return write(&c, 1); }

size_t OpdsParser::write(const uint8_t* xmlData, const size_t length) {
  if (errorOccured) return length;

  XML_SetUserData(parser, this);
  XML_SetElementHandler(parser, startElement, endElement);
  XML_SetCharacterDataHandler(parser, characterData);

  const char* currentPos = reinterpret_cast<const char*>(xmlData);
  size_t remaining = length;
  constexpr size_t chunkSize = 1024;

  while (remaining > 0) {
    void* const buf = XML_GetBuffer(parser, chunkSize);
    if (!buf) { errorOccured = true; LOG_DBG("OPDS", "Memory error"); return length; }

    const size_t toRead = remaining < chunkSize ? remaining : chunkSize;
    memcpy(buf, currentPos, toRead);

    if (XML_ParseBuffer(parser, static_cast<int>(toRead), 0) == XML_STATUS_ERROR) { errorOccured = true; return length; }
    currentPos += toRead;
    remaining -= toRead;
  }
  return length;
}

void OpdsParser::flush() {
  if (!parser) {
    errorOccured = true;
    return;
  }
  if (XML_Parse(parser, nullptr, 0, XML_TRUE) != XML_STATUS_OK) { errorOccured = true; }
}

bool OpdsParser::error() const { return errorOccured; }

void OpdsParser::clear() {
  entries.clear();
  searchTemplate.clear();
  nextPageUrl.clear();
  prevPageUrl.clear();
  feedTitle.clear();
  currentEntry = OpdsEntry{};
  currentText.clear();
  skippingEntry = false;
  entryLimitLogged = false;
  inEntry = inTitle = inFeedTitle = inAuthor = inAuthorName = inId = inSummary = inContent = false;
}

std::vector<OpdsEntry> OpdsParser::getBooks() const {
  std::vector<OpdsEntry> books;
  for (const auto& entry : entries) {
    if (entry.type == OpdsEntryType::BOOK) books.push_back(entry);
  }
  return books;
}

const char* OpdsParser::findAttribute(const XML_Char** atts, const char* name) {
  for (int i = 0; atts[i]; i += 2) {
    if (strcmp(atts[i], name) == 0) return atts[i + 1];
  }
  return nullptr;
}

void XMLCALL OpdsParser::startElement(void* userData, const XML_Char* name, const XML_Char** atts) {
  auto* self = static_cast<OpdsParser*>(userData);

  if (strcmp(name, "link") == 0 || strstr(name, ":link") != nullptr) {
    const char* href = findAttribute(atts, "href");
    if (href) {
      const char* rel = findAttribute(atts, "rel");
      const char* type = findAttribute(atts, "type");

      if (rel && strcmp(rel, "search") == 0) {
        std::string sHref(href);
        if (sHref.find("{searchTerms}") != std::string::npos) {
          self->searchTemplate = sHref;
        }
      } else if (rel && strcmp(rel, "next") == 0 && !self->inEntry) {
        self->nextPageUrl = href;
      } else if (rel && strcmp(rel, "previous") == 0 && !self->inEntry) {
        self->prevPageUrl = href;
      }

      if (self->inEntry) {
        if (self->skippingEntry) {
          return;
        }
        if (rel && type && strstr(rel, "opds-spec.org/acquisition") != nullptr && isBookAcquisitionType(type)) {
          self->currentEntry.type = OpdsEntryType::BOOK;
          self->currentEntry.href = href;
        } else if (type && strstr(type, "application/atom+xml") != nullptr && strstr(type, "kind=acquisition") != nullptr) {
          if (self->currentEntry.type != OpdsEntryType::BOOK) {
            self->currentEntry.type = OpdsEntryType::SERIES;
            self->currentEntry.href = href;
          }
        } else if (self->captureExtendedMetadata &&
                   rel &&
                   (strcmp(rel, "http://opds-spec.org/image") == 0 ||
                    strcmp(rel, "http://opds-spec.org/image/thumbnail") == 0)) {
          if (self->currentEntry.imageHref.empty()) {
            self->currentEntry.imageHref = href;
          }
        } else if (type && strstr(type, "application/atom+xml") != nullptr) {
          if (self->currentEntry.type != OpdsEntryType::BOOK) {
            self->currentEntry.type = OpdsEntryType::NAVIGATION;
            self->currentEntry.href = href;
          }
        }
      }
    }
  }

  if (strcmp(name, "entry") == 0 || strstr(name, ":entry") != nullptr) {
    self->inEntry = true;
    self->currentEntry = OpdsEntry{};
    self->skippingEntry = self->maxEntries > 0 && self->entries.size() >= self->maxEntries;
    if (self->skippingEntry && !self->entryLimitLogged) {
      self->entryLimitLogged = true;
      LOG_DBG("OPDS", "Entry cap reached: %u", static_cast<unsigned>(self->maxEntries));
    }
    return;
  }

  if (!self->inEntry) {
    if (strcmp(name, "title") == 0 || strstr(name, ":title") != nullptr) {
      self->inFeedTitle = true;
      self->currentText.clear();
    }
    return;
  }

  if (self->skippingEntry) {
    return;
  }

  if (strcmp(name, "title") == 0 || strstr(name, ":title") != nullptr) {
    self->inTitle = true;
    self->currentText.clear();
  } else if (self->captureExtendedMetadata && (strcmp(name, "author") == 0 || strstr(name, ":author") != nullptr)) {
    self->inAuthor = true;
  } else if (self->captureExtendedMetadata && self->inAuthor &&
             (strcmp(name, "name") == 0 || strstr(name, ":name") != nullptr)) {
    self->inAuthorName = true;
    self->currentText.clear();
  } else if (self->captureExtendedMetadata && (strcmp(name, "id") == 0 || strstr(name, ":id") != nullptr)) {
    self->inId = true;
    self->currentText.clear();
  } else if (self->captureExtendedMetadata && (strcmp(name, "summary") == 0 || strstr(name, ":summary") != nullptr)) {
    self->inSummary = true;
    self->currentText.clear();
  } else if (self->captureExtendedMetadata && (strcmp(name, "content") == 0 || strstr(name, ":content") != nullptr)) {
    self->inContent = true;
    self->currentText.clear();
  }
}

void XMLCALL OpdsParser::endElement(void* userData, const XML_Char* name) {
  auto* self = static_cast<OpdsParser*>(userData);

  if (strcmp(name, "entry") == 0 || strstr(name, ":entry") != nullptr) {
    if (!self->skippingEntry && !self->currentEntry.title.empty() && !self->currentEntry.href.empty()) {
      self->entries.push_back(std::move(self->currentEntry));
      self->currentEntry = OpdsEntry{};
    }
    self->skippingEntry = false;
    self->inEntry = false;
  } else if (!self->inEntry) {
    if (strcmp(name, "title") == 0 || strstr(name, ":title") != nullptr) {
      if (self->inFeedTitle && self->feedTitle.empty()) self->feedTitle = self->currentText;
      self->inFeedTitle = false;
    }
  } else if (self->inEntry) {
    if (strcmp(name, "title") == 0 || strstr(name, ":title") != nullptr) {
      if (self->inTitle) self->currentEntry.title = self->currentText;
      self->inTitle = false;
    } else if (strcmp(name, "author") == 0 || strstr(name, ":author") != nullptr) {
      self->inAuthor = false;
    } else if (self->inAuthorName && (strcmp(name, "name") == 0 || strstr(name, ":name") != nullptr)) {
      self->currentEntry.author = self->currentText;
      self->inAuthorName = false;
    } else if (strcmp(name, "id") == 0 || strstr(name, ":id") != nullptr) {
      if (self->inId) self->currentEntry.id = self->currentText;
      self->inId = false;
    } else if (strcmp(name, "summary") == 0 || strstr(name, ":summary") != nullptr) {
      if (self->inSummary) self->currentEntry.summary = self->currentText;
      self->inSummary = false;
    } else if (strcmp(name, "content") == 0 || strstr(name, ":content") != nullptr) {
      if (self->inContent && self->currentEntry.summary.empty()) self->currentEntry.summary = self->currentText;
      self->inContent = false;
    }
  }
}

void XMLCALL OpdsParser::characterData(void* userData, const XML_Char* s, const int len) {
  auto* self = static_cast<OpdsParser*>(userData);
  if (self->skippingEntry) {
    return;
  }
  if (self->inTitle || self->inFeedTitle || self->inAuthorName || self->inId || self->inSummary || self->inContent) {
    const size_t limit =
        currentTextLimit(self->inSummary, self->inContent, self->inAuthorName, self->inId, self->inFeedTitle);
    if (self->currentText.size() >= limit) {
      return;
    }
    appendCapped(self->currentText, s, len, limit);
  }
}



