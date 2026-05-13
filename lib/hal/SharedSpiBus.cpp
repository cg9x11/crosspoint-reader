#include "SharedSpiBus.h"

#include <cassert>

namespace {
SemaphoreHandle_t getSharedSpiBusMutex() {
  static SemaphoreHandle_t mutex = xSemaphoreCreateRecursiveMutex();
  assert(mutex != nullptr);
  return mutex;
}
}  // namespace

SharedSpiBusLock::SharedSpiBusLock() : mutex(getSharedSpiBusMutex()) {
  xSemaphoreTakeRecursive(mutex, portMAX_DELAY);
}

SharedSpiBusLock::~SharedSpiBusLock() {
  if (mutex != nullptr) {
    xSemaphoreGiveRecursive(mutex);
  }
}

