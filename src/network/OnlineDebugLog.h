#pragma once

#include <string>

namespace OnlineDebugLog {

void logProbe(const char* tag, const std::string& message = {});
void logHttpSuccess(const std::string& url, int httpCode, const std::string& body);
void logHttpFailure(const std::string& url, int httpCode, const std::string& errorMessage, const std::string& body = {});
void logParserFailure(const char* source, const char* stage, const std::string& url, const std::string& reason,
                      const std::string& html = {});
bool isVerboseEnabled();

}  // namespace OnlineDebugLog
