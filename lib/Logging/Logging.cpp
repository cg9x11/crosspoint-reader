#include "Logging.h"

#include <Arduino.h>
#include <SDCardManager.h>

#include <string>

// Keep enough crash context for triage while avoiding overuse of scarce RTC slow memory.
#define MAX_ENTRY_LEN 192
#define MAX_LOG_LINES 12
static constexpr const char* TRACE_LOG_DIR = "/.crosspoint/logs";
static constexpr const char* TRACE_LOG_FILE = "/.crosspoint/logs/http_trace.log";
static constexpr size_t TRACE_LOG_MAX_BYTES = 64 * 1024;
static constexpr bool TRACE_LOG_ENABLED = false;
static bool g_traceSessionOpened = false;
static bool g_traceWriteInProgress = false;

void appendTraceSessionHeaderIfNeeded(FsFile& file);

// Simple ring buffer log, useful for error reporting when we encounter a crash
RTC_NOINIT_ATTR char logMessages[MAX_LOG_LINES][MAX_ENTRY_LEN];
RTC_NOINIT_ATTR size_t logHead = 0;
// Magic word written alongside logHead to detect uninitialized RTC memory.
// RTC_NOINIT_ATTR is not zeroed on cold boot, so logHead may appear in-range
// (0..MAX_LOG_LINES-1) by chance even though logMessages is garbage. The magic
// value is only set by clearLastLogs(), so its absence means the buffer was
// never properly initialized.
RTC_NOINIT_ATTR uint32_t rtcLogMagic;
static constexpr uint32_t LOG_RTC_MAGIC = 0xDEADBEEF;

void addToLogRingBuffer(const char* message) {
  // Add the message to the ring buffer, overwriting old messages if necessary.
  // If the magic is wrong or logHead is out of range (RTC_NOINIT_ATTR garbage
  // on cold boot), clear the entire buffer so subsequent reads are safe.
  if (rtcLogMagic != LOG_RTC_MAGIC || logHead >= MAX_LOG_LINES) {
    memset(logMessages, 0, sizeof(logMessages));
    logHead = 0;
    rtcLogMagic = LOG_RTC_MAGIC;
  }
  strncpy(logMessages[logHead], message, MAX_ENTRY_LEN - 1);
  logMessages[logHead][MAX_ENTRY_LEN - 1] = '\0';
  logHead = (logHead + 1) % MAX_LOG_LINES;
}

bool shouldPersistTraceLog(const char* origin) {
  return strcmp(origin, "HTTP") == 0 || strcmp(origin, "OPDS") == 0 || strcmp(origin, "SER") == 0;
}

bool ensureTraceLogReadyInternal(FsFile* openedFile = nullptr) {
  if (!TRACE_LOG_ENABLED) {
    return false;
  }
  if (!SdMan.ready() || !SdMan.ensureDirectoryExists("/.crosspoint") || !SdMan.ensureDirectoryExists(TRACE_LOG_DIR)) {
    return false;
  }

  if (SdMan.exists(TRACE_LOG_FILE)) {
    auto existing = SdMan.open(TRACE_LOG_FILE);
    if (existing && existing.size() >= TRACE_LOG_MAX_BYTES) {
      existing.close();
      SdMan.remove(TRACE_LOG_FILE);
      g_traceSessionOpened = false;
    } else if (existing) {
      existing.close();
    }
  }

  if (openedFile) {
    return true;
  }

  auto file = SdMan.open(TRACE_LOG_FILE, O_WRONLY | O_CREAT);
  if (!file) {
    return false;
  }
  file.seekSet(file.size());
  appendTraceSessionHeaderIfNeeded(file);
  file.close();
  return true;
}

void appendTraceSessionHeaderIfNeeded(FsFile& file) {
  if (g_traceSessionOpened) {
    return;
  }
  char header[160];
  snprintf(header, sizeof(header), "\n=== TRACE SESSION %lu %s ===\n", millis(), CROSSPOINT_VERSION);
  file.write(reinterpret_cast<const uint8_t*>(header), strlen(header));
  g_traceSessionOpened = true;
}

void appendTraceLog(const char* message) {
  if (g_traceWriteInProgress || !message || message[0] == '\0') {
    return;
  }

  g_traceWriteInProgress = true;
  if (!ensureTraceLogReadyInternal()) {
    g_traceWriteInProgress = false;
    return;
  }

  auto file = SdMan.open(TRACE_LOG_FILE, O_WRONLY | O_CREAT);
  if (!file) {
    g_traceWriteInProgress = false;
    return;
  }
  file.seekSet(file.size());
  appendTraceSessionHeaderIfNeeded(file);
  file.write(reinterpret_cast<const uint8_t*>(message), strlen(message));
  file.close();
  g_traceWriteInProgress = false;
}

// Since logging can take a large amount of flash, we want to make the format string as short as possible.
// This logPrintf prepend the timestamp, level and origin to the user-provided message, so that the user only needs to
// provide the format string for the message itself.
void logPrintf(const char* level, const char* origin, const char* format, ...) {
  va_list args;
  va_start(args, format);
  char buf[MAX_ENTRY_LEN];
  buf[0] = '\0';
  char* c = buf;
  size_t remaining = sizeof(buf);
  // add timestamp, level and origin
  {
    unsigned long ms = millis();
    int len = snprintf(c, remaining, "[%lu] [%s] [%s] ", ms, level, origin);
    // error while writing => return
    if (len < 0) {
      va_end(args);
      return;
    }
    const size_t written = strnlen(buf, sizeof(buf));
    c = buf + written;
    remaining = written < sizeof(buf) ? (sizeof(buf) - written) : 0;
  }
  // add the user message
  if (remaining > 0) {
    int len = vsnprintf(c, remaining, format, args);
    if (len < 0) {
      va_end(args);
      return;
    }
  }
  va_end(args);
  if (logSerial) {
    logSerial.print(buf);
  }
  addToLogRingBuffer(buf);
  // Keep SD-backed trace logs focused on explicit TRC entries and errors.
  // Persisting every DBG line on hot paths increases IO churn and can destabilize
  // network/parse flows on low-memory devices.
  if (strcmp(level, "ERR") == 0 && shouldPersistTraceLog(origin)) {
    appendTraceLog(buf);
  }
}

void traceLogPrintf(const char* origin, const char* format, ...) {
  if (!TRACE_LOG_ENABLED) {
    return;
  }
  char buf[MAX_ENTRY_LEN];
  buf[0] = '\0';
  int prefixLen = snprintf(buf, sizeof(buf), "[%lu] [TRC] [%s] ", millis(), origin);
  if (prefixLen < 0) {
    return;
  }

  va_list args;
  va_start(args, format);
  const size_t written = strnlen(buf, sizeof(buf));
  const size_t remaining = written < sizeof(buf) ? (sizeof(buf) - written) : 0;
  if (remaining > 0) {
    vsnprintf(buf + written, remaining, format, args);
  }
  va_end(args);
  appendTraceLog(buf);
}

std::string getLastLogs() {
  if (rtcLogMagic != LOG_RTC_MAGIC) {
    return {};
  }
  std::string output;
  for (size_t i = 0; i < MAX_LOG_LINES; i++) {
    size_t idx = (logHead + i) % MAX_LOG_LINES;
    if (logMessages[idx][0] != '\0') {
      const size_t len = strnlen(logMessages[idx], MAX_ENTRY_LEN);
      output.append(logMessages[idx], len);
    }
  }
  return output;
}

// Checks whether the RTC log state is consistent: rtcLogMagic must equal
// LOG_RTC_MAGIC and logHead must be in 0..MAX_LOG_LINES-1. Returns true if
// corruption is detected, in which case rtcLogMagic is still invalid and
// logMessages may contain garbage. Callers (e.g. HalSystem::begin on the
// panic-reboot path) must call clearLastLogs() after a true result to fully
// reinitialize the ring buffer and stamp the magic before getLastLogs() is used.
bool sanitizeLogHead() {
  if (rtcLogMagic != LOG_RTC_MAGIC || logHead >= MAX_LOG_LINES) {
    logHead = 0;
    return true;
  }
  return false;
}

void clearLastLogs() {
  for (size_t i = 0; i < MAX_LOG_LINES; i++) {
    logMessages[i][0] = '\0';
  }
  logHead = 0;
  rtcLogMagic = LOG_RTC_MAGIC;
}

const char* getTraceLogFilePath() { return TRACE_LOG_FILE; }

bool ensureTraceLogReady() { return ensureTraceLogReadyInternal(); }

void clearTraceLog() {
  g_traceSessionOpened = false;
  if (!SdMan.ready() || !SdMan.ensureDirectoryExists("/.crosspoint") || !SdMan.ensureDirectoryExists(TRACE_LOG_DIR)) {
    return;
  }
  if (SdMan.exists(TRACE_LOG_FILE)) {
    SdMan.remove(TRACE_LOG_FILE);
  }
}
