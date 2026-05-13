#pragma once

#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

class SharedSpiBusLock {
 public:
  SharedSpiBusLock();
  ~SharedSpiBusLock();

  SharedSpiBusLock(const SharedSpiBusLock&) = delete;
  SharedSpiBusLock& operator=(const SharedSpiBusLock&) = delete;

 private:
  SemaphoreHandle_t mutex = nullptr;
};

