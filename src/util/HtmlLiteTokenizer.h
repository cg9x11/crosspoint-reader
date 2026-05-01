#pragma once

#include <algorithm>
#include <cctype>
#include <functional>
#include <string>
#include <utility>
#include <vector>

struct HtmlLiteAttribute {
  std::string name;
  std::string value;
};

struct HtmlLiteStartTag {
  std::string name;
  std::vector<HtmlLiteAttribute> attrs;
  bool selfClosing = false;
};

class HtmlLiteTokenizer {
 public:
  using StartTagCallback = std::function<bool(const HtmlLiteStartTag&)>;
  using EndTagCallback = std::function<bool(const std::string&)>;
  using TextCallback = std::function<bool(const std::string&)>;

  HtmlLiteTokenizer(StartTagCallback onStartTag, EndTagCallback onEndTag, TextCallback onText)
      : onStartTag_(std::move(onStartTag)), onEndTag_(std::move(onEndTag)), onText_(std::move(onText)) {}

  bool feed(const char* data, size_t size) {
    if (!running_ || !data || size == 0) {
      return running_;
    }

    buffer_.append(data, size);
    while (running_) {
      const size_t tagStart = buffer_.find('<');
      if (tagStart == std::string::npos) {
        if (!buffer_.empty()) {
          if (!emitText(buffer_)) return false;
          buffer_.clear();
        }
        break;
      }

      if (tagStart > 0) {
        std::string text = buffer_.substr(0, tagStart);
        buffer_.erase(0, tagStart);
        if (!emitText(text)) return false;
        continue;
      }

      size_t tagEnd = std::string::npos;
      bool inQuote = false;
      char quoteChar = '\0';
      for (size_t i = 1; i < buffer_.size(); ++i) {
        const char ch = buffer_[i];
        if (inQuote) {
          if (ch == quoteChar) {
            inQuote = false;
          }
          continue;
        }
        if (ch == '"' || ch == '\'') {
          inQuote = true;
          quoteChar = ch;
          continue;
        }
        if (ch == '>') {
          tagEnd = i;
          break;
        }
      }

      if (tagEnd == std::string::npos) {
        break;
      }

      std::string token = buffer_.substr(0, tagEnd + 1);
      buffer_.erase(0, tagEnd + 1);
      if (!processTag(token)) return false;
    }

    return running_;
  }

  bool finish() {
    if (!running_) return false;
    if (!buffer_.empty()) {
      if (buffer_.find('<') == std::string::npos) {
        if (!emitText(buffer_)) return false;
        buffer_.clear();
      } else {
        return false;
      }
    }
    return true;
  }

 private:
  static void trimInPlace(std::string& value) {
    const auto notSpace = [](unsigned char ch) { return !std::isspace(ch); };
    value.erase(value.begin(), std::find_if(value.begin(), value.end(), notSpace));
    value.erase(std::find_if(value.rbegin(), value.rend(), notSpace).base(), value.end());
  }

  static std::string toLowerAscii(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(),
                   [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
    return value;
  }

  bool emitText(std::string text) {
    if (!onText_) return true;
    if (!text.empty() && !onText_(text)) {
      running_ = false;
      return false;
    }
    return true;
  }

  bool processTag(const std::string& token) {
    if (token.size() < 3 || token.front() != '<' || token.back() != '>') {
      return true;
    }

    if (token.compare(0, 4, "<!--") == 0 || token.compare(0, 2, "<!") == 0 || token.compare(0, 2, "<?") == 0) {
      return true;
    }

    if (token[1] == '/') {
      std::string name = token.substr(2, token.size() - 3);
      trimInPlace(name);
      size_t stop = 0;
      while (stop < name.size() && !std::isspace(static_cast<unsigned char>(name[stop])) && name[stop] != '>') {
        ++stop;
      }
      name.resize(stop);
      name = toLowerAscii(std::move(name));
      if (!name.empty() && onEndTag_ && !onEndTag_(name)) {
        running_ = false;
        return false;
      }
      return true;
    }

    HtmlLiteStartTag tag;
    if (!parseStartTag(token, tag)) {
      return true;
    }
    if (onStartTag_ && !onStartTag_(tag)) {
      running_ = false;
      return false;
    }
    if (tag.selfClosing && onEndTag_ && !onEndTag_(tag.name)) {
      running_ = false;
      return false;
    }
    return true;
  }

  static bool parseStartTag(const std::string& token, HtmlLiteStartTag& outTag) {
    outTag = HtmlLiteStartTag{};
    size_t i = 1;
    while (i < token.size() - 1 && std::isspace(static_cast<unsigned char>(token[i]))) ++i;
    const size_t nameStart = i;
    while (i < token.size() - 1 && !std::isspace(static_cast<unsigned char>(token[i])) && token[i] != '>' && token[i] != '/') ++i;
    if (i <= nameStart) return false;
    outTag.name = toLowerAscii(token.substr(nameStart, i - nameStart));

    while (i < token.size() - 1) {
      while (i < token.size() - 1 && std::isspace(static_cast<unsigned char>(token[i]))) ++i;
      if (i >= token.size() - 1) break;
      if (token[i] == '/') {
        outTag.selfClosing = true;
        ++i;
        continue;
      }

      const size_t attrNameStart = i;
      while (i < token.size() - 1 && !std::isspace(static_cast<unsigned char>(token[i])) && token[i] != '=' &&
             token[i] != '>' && token[i] != '/') {
        ++i;
      }
      if (i <= attrNameStart) break;

      HtmlLiteAttribute attr;
      attr.name = toLowerAscii(token.substr(attrNameStart, i - attrNameStart));
      while (i < token.size() - 1 && std::isspace(static_cast<unsigned char>(token[i]))) ++i;
      if (i < token.size() - 1 && token[i] == '=') {
        ++i;
        while (i < token.size() - 1 && std::isspace(static_cast<unsigned char>(token[i]))) ++i;
        if (i < token.size() - 1 && (token[i] == '"' || token[i] == '\'')) {
          const char quote = token[i++];
          const size_t valueStart = i;
          while (i < token.size() - 1 && token[i] != quote) ++i;
          attr.value = token.substr(valueStart, i - valueStart);
          if (i < token.size() - 1 && token[i] == quote) ++i;
        } else {
          const size_t valueStart = i;
          while (i < token.size() - 1 && !std::isspace(static_cast<unsigned char>(token[i])) && token[i] != '>' &&
                 token[i] != '/') {
            ++i;
          }
          attr.value = token.substr(valueStart, i - valueStart);
        }
      }
      outTag.attrs.push_back(std::move(attr));
    }

    return true;
  }

  StartTagCallback onStartTag_;
  EndTagCallback onEndTag_;
  TextCallback onText_;
  std::string buffer_;
  bool running_ = true;
};
