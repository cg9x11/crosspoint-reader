#include "ActivityManager.h"

#include <HalPowerManager.h>

#include <algorithm>
#include <Logging.h>

#include "OpdsServerStore.h"
#include "boot_sleep/BootActivity.h"
#include "boot_sleep/SleepActivity.h"
#include "browser/OpdsBookBrowserActivity.h"
#include "home/CrashActivity.h"
#include "home/FileBrowserActivity.h"
#include "home/HomeActivity.h"
#include "home/RecentBooksActivity.h"
#include "network/CrossPointWebServerActivity.h"
#include "reader/ReaderActivity.h"
#include "settings/OpdsServerListActivity.h"
#include "settings/SettingsActivity.h"
#include "util/ScreenDebugRecorder.h"
#include "util/FullScreenMessageActivity.h"

void ActivityManager::begin() {}

void ActivityManager::renderNow() {
  requestedUpdate = false;
  RenderLock lock;
  if (currentActivity) {
    HalPowerManager::Lock powerLock;
    ScreenDebugRecorder::beginFrame(currentActivity->name);
    currentActivity->render(std::move(lock));
    ScreenDebugRecorder::applyScreenshotInfo(currentActivity->getScreenshotInfo());
  }
}

void ActivityManager::loop() {
  if (currentActivity) {
    // Note: do not hold a lock here, the loop() method must be responsible for acquire one if needed
    LOG_DBG("ACT", "Loop activity begin: %s", currentActivity->name.c_str());
    currentActivity->loop();
    LOG_DBG("ACT", "Loop activity end: %s", currentActivity->name.c_str());
  }

  while (pendingAction != PendingAction::None) {
    if (pendingAction == PendingAction::Pop) {
      RenderLock lock;

      if (!currentActivity) {
        // Should never happen in practice
        LOG_ERR("ACT", "Pop set but currentActivity is null; ignoring pop request");
        pendingAction = PendingAction::None;
        continue;
      }

      ActivityResult pendingResult = std::move(currentActivity->result);

      // Destroy the current activity
      exitActivity(lock);
      pendingAction = PendingAction::None;

      if (stackActivities.empty()) {
        LOG_DBG("ACT", "No more activities on stack, going home");
        lock.unlock();  // goHome may acquire its own lock
        goHome();
        continue;  // Will launch goHome immediately

      } else {
        currentActivity = std::move(stackActivities.back());
        stackActivities.pop_back();
        LOG_DBG("ACT", "Popped from activity stack, new size = %zu", stackActivities.size());
        // Handle result if necessary
        if (currentActivity->resultHandler) {
          LOG_DBG("ACT", "Handling result for popped activity");

          // Move it here to avoid the case where handler calling another startActivityForResult()
          auto handler = std::move(currentActivity->resultHandler);
          currentActivity->resultHandler = nullptr;
          lock.unlock();  // Handler may acquire its own lock
          handler(pendingResult);
        }

        // Request an update to ensure the popped activity gets re-rendered
        if (pendingAction == PendingAction::None) {
          requestUpdate();
        }

        // Handler may request another pending action, we will handle it in the next loop iteration
        continue;
      }

    } else if (pendingActivity) {
      // Current activity has requested a new activity to be launched
      RenderLock lock;
      LOG_DBG("ACT", "Processing pending activity: %s action=%d current=%s", pendingActivity->name.c_str(),
              static_cast<int>(pendingAction), currentActivity ? currentActivity->name.c_str() : "<none>");

      if (pendingAction == PendingAction::Replace) {
        // Destroy the current activity
        LOG_DBG("ACT", "Replace: exiting current activity");
        exitActivity(lock);
        // Clear the stack
        while (!stackActivities.empty()) {
          stackActivities.back()->onExit();
          stackActivities.pop_back();
        }
      } else if (pendingAction == PendingAction::Push) {
        // Move current activity to stack
        stackActivities.push_back(std::move(currentActivity));
        LOG_DBG("ACT", "Pushed to activity stack, new size = %zu", stackActivities.size());
      }
      pendingAction = PendingAction::None;
      currentActivity = std::move(pendingActivity);
      LOG_DBG("ACT", "About to enter activity: %s", currentActivity ? currentActivity->name.c_str() : "<none>");

      lock.unlock();  // onEnter may acquire its own lock
      currentActivity->onEnter();
      LOG_DBG("ACT", "Activity onEnter returned: %s", currentActivity ? currentActivity->name.c_str() : "<none>");

      // onEnter may request another pending action, we will handle it in the next loop iteration
      continue;
    }
  }

  if (requestedUpdate) {
    renderNow();
  }
}

void ActivityManager::exitActivity(const RenderLock& lock) {
  // Note: lock must be held by the caller
  if (currentActivity) {
    currentActivity->onExit();
    currentActivity.reset();
  }
}

void ActivityManager::replaceActivity(std::unique_ptr<Activity>&& newActivity) {
  // Note: no lock here, this is usually called by loop() and we may run into deadlock
  if (currentActivity) {
    // Defer launch if we're currently in an activity, to avoid deleting the current activity
    // leading to the "delete this" problem
    pendingActivity = std::move(newActivity);
    pendingAction = PendingAction::Replace;
  } else {
    // No current activity, safe to launch immediately
    currentActivity = std::move(newActivity);
    currentActivity->onEnter();
  }
}

void ActivityManager::goToFileTransfer() {
  replaceActivity(std::make_unique<CrossPointWebServerActivity>(renderer, mappedInput));
}

void ActivityManager::goToSettings() { replaceActivity(std::make_unique<SettingsActivity>(renderer, mappedInput)); }

void ActivityManager::goToFileBrowser(std::string path) {
  replaceActivity(std::make_unique<FileBrowserActivity>(renderer, mappedInput, std::move(path)));
}

void ActivityManager::goToRecentBooks() {
  replaceActivity(std::make_unique<RecentBooksActivity>(renderer, mappedInput));
}

void ActivityManager::goToBrowser() {
  const auto& servers = OPDS_STORE.getServers();
  // Skip the server picker when there's only one server configured
  if (servers.size() == 1) {
    replaceActivity(std::make_unique<OpdsBookBrowserActivity>(renderer, mappedInput, servers[0]));
  } else {
    replaceActivity(std::make_unique<OpdsServerListActivity>(renderer, mappedInput, true));
  }
}

void ActivityManager::goToReader(std::string path) {
  replaceActivity(std::make_unique<ReaderActivity>(renderer, mappedInput, std::move(path)));
}

void ActivityManager::goToReader(SeriesReadingContext context, const bool openAtLastPage) {
  std::string chapterPath = context.chapterPath;
  replaceActivity(std::make_unique<ReaderActivity>(renderer, mappedInput, std::move(chapterPath), std::move(context),
                                                   openAtLastPage));
}

void ActivityManager::goToSleep() {
  replaceActivity(std::make_unique<SleepActivity>(renderer, mappedInput));
  loop();  // Important: sleep screen must be rendered immediately, the caller will go to sleep right after this returns
}

void ActivityManager::goToBoot() { replaceActivity(std::make_unique<BootActivity>(renderer, mappedInput)); }

void ActivityManager::goToFullScreenMessage(std::string message, EpdFontFamily::Style style) {
  replaceActivity(std::make_unique<FullScreenMessageActivity>(renderer, mappedInput, std::move(message), style));
}

void ActivityManager::goToCrashReport() { replaceActivity(std::make_unique<CrashActivity>(renderer, mappedInput)); }

void ActivityManager::goHome() { replaceActivity(std::make_unique<HomeActivity>(renderer, mappedInput)); }

void ActivityManager::pushActivity(std::unique_ptr<Activity>&& activity) {
  if (pendingActivity) {
    // Should never happen in practice
    LOG_ERR("ACT", "pendingActivity while pushActivity is not expected");
    pendingActivity.reset();
  }
  pendingActivity = std::move(activity);
  pendingAction = PendingAction::Push;
}

void ActivityManager::popActivity() {
  if (pendingActivity) {
    // Should never happen in practice
    LOG_ERR("ACT", "pendingActivity while popActivity is not expected");
    pendingActivity.reset();
  }
  pendingAction = PendingAction::Pop;
}

bool ActivityManager::preventAutoSleep() const { return currentActivity && currentActivity->preventAutoSleep(); }

bool ActivityManager::isReaderActivity() const {
  return std::any_of(stackActivities.begin(), stackActivities.end(),
                     [](const auto& activity) { return activity->isReaderActivity(); }) ||
         (currentActivity && currentActivity->isReaderActivity());
}

bool ActivityManager::skipLoopDelay() const { return currentActivity && currentActivity->skipLoopDelay(); }

ScreenshotInfo ActivityManager::getScreenshotInfo() const {
  if (currentActivity) {
    return currentActivity->getScreenshotInfo();
  }
  return {};
}

std::string ActivityManager::getCurrentActivityName() const {
  return currentActivity ? currentActivity->name : std::string{};
}

std::string ActivityManager::getPendingActivityName() const {
  return pendingActivity ? pendingActivity->name : std::string{};
}

std::vector<std::string> ActivityManager::getStackActivityNames() const {
  std::vector<std::string> names;
  names.reserve(stackActivities.size());
  for (const auto& activity : stackActivities) {
    names.push_back(activity ? activity->name : std::string{});
  }
  return names;
}

const char* ActivityManager::getPendingActionName() const {
  switch (pendingAction) {
    case PendingAction::None: return "none";
    case PendingAction::Push: return "push";
    case PendingAction::Pop: return "pop";
    case PendingAction::Replace: return "replace";
  }
  return "unknown";
}

bool ActivityManager::injectAutomationText(const std::string& text) {
  (void)text;
  return false;
}

void ActivityManager::requestUpdate(bool immediate) {
  if (immediate) {
    auto currTaskHandler = xTaskGetCurrentTaskHandle();
    auto mutexHolder = xSemaphoreGetMutexHolder(renderingMutex);
    bool holdingRenderLock = (mutexHolder == currTaskHandler);
    if (!holdingRenderLock) {
      renderNow();
      return;
    }
  }

  // Deferring the update until current loop is finished
  // This is to avoid multiple updates being requested in the same loop
  requestedUpdate = true;
}
namespace {
TaskHandle_t g_renderLockOwner = nullptr;
const char* currentTaskTag() {
  TaskHandle_t task = xTaskGetCurrentTaskHandle();
  return pcTaskGetName(task);
}
}

void ActivityManager::requestUpdateAndWait() {
  auto currTaskHandler = xTaskGetCurrentTaskHandle();
  auto mutexHolder = xSemaphoreGetMutexHolder(renderingMutex);
  bool holdingRenderLock = (mutexHolder == currTaskHandler);

  assert(!holdingRenderLock && "Cannot call requestUpdateAndWait() while holding RenderLock");
  renderNow();
}

// RenderLock

RenderLock::RenderLock() {
  LOG_DBG("RLOCK", "take begin task=%s owner=%s", currentTaskTag(), g_renderLockOwner ? pcTaskGetName(g_renderLockOwner) : "<none>");
  xSemaphoreTake(activityManager.renderingMutex, portMAX_DELAY);
  g_renderLockOwner = xTaskGetCurrentTaskHandle();
  isLocked = true;
  LOG_DBG("RLOCK", "take done task=%s", currentTaskTag());
}

RenderLock::RenderLock([[maybe_unused]] Activity&) {
  LOG_DBG("RLOCK", "take begin task=%s owner=%s", currentTaskTag(), g_renderLockOwner ? pcTaskGetName(g_renderLockOwner) : "<none>");
  xSemaphoreTake(activityManager.renderingMutex, portMAX_DELAY);
  g_renderLockOwner = xTaskGetCurrentTaskHandle();
  isLocked = true;
  LOG_DBG("RLOCK", "take done task=%s", currentTaskTag());
}

RenderLock::~RenderLock() {
  if (isLocked) {
    LOG_DBG("RLOCK", "give begin task=%s owner=%s", currentTaskTag(), g_renderLockOwner ? pcTaskGetName(g_renderLockOwner) : "<none>");
    xSemaphoreGive(activityManager.renderingMutex);
    g_renderLockOwner = nullptr;
    isLocked = false;
    LOG_DBG("RLOCK", "give done task=%s", currentTaskTag());
  }
}

void RenderLock::unlock() {
  if (isLocked) {
    LOG_DBG("RLOCK", "unlock begin task=%s owner=%s", currentTaskTag(), g_renderLockOwner ? pcTaskGetName(g_renderLockOwner) : "<none>");
    xSemaphoreGive(activityManager.renderingMutex);
    g_renderLockOwner = nullptr;
    isLocked = false;
    LOG_DBG("RLOCK", "unlock done task=%s", currentTaskTag());
  }
}

/**
 *
 * Checks if renderingMutex is busy.
 *
 * @return true if renderingMutex is busy, otherwise false.
 *
 */
bool RenderLock::peek() { return xQueuePeek(activityManager.renderingMutex, NULL, 0) != pdTRUE; };

