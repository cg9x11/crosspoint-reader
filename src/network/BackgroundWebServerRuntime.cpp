#include "BackgroundWebServerRuntime.h"

#include <Logging.h>
#include <esp_task_wdt.h>

#include "CrossPointWebServer.h"

BackgroundWebServerRuntime BACKGROUND_WEB_SERVER_RUNTIME;

bool BackgroundWebServerRuntime::isRunning() const { return server && server->isRunning(); }

void BackgroundWebServerRuntime::activate(std::unique_ptr<CrossPointWebServer>&& newServer) {
  server = std::move(newServer);
  lastHandleClientTime = 0;
  handoffRequested = false;
}

std::unique_ptr<CrossPointWebServer> BackgroundWebServerRuntime::takeOwnership() {
  lastHandleClientTime = 0;
  handoffRequested = false;
  return std::move(server);
}

void BackgroundWebServerRuntime::stop() {
  if (server) {
    server->stop();
    server.reset();
  }
  lastHandleClientTime = 0;
  handoffRequested = false;
}

void BackgroundWebServerRuntime::loop() {
  if (!isRunning()) {
    return;
  }

  const unsigned long timeSinceLastHandleClient = millis() - lastHandleClientTime;
  if (lastHandleClientTime > 0 && timeSinceLastHandleClient > 100) {
    LOG_DBG("WEBBG", "WARNING: %lu ms gap since last handleClient", timeSinceLastHandleClient);
  }

  esp_task_wdt_reset();
  constexpr int MAX_ITERATIONS = 120;
  for (int i = 0; i < MAX_ITERATIONS && server && server->isRunning(); i++) {
    server->handleClient();
    if ((i & 0x0F) == 0x0F) {
      esp_task_wdt_reset();
    }
    if ((i & 0x1F) == 0x1F) {
      yield();
    }
  }
  lastHandleClientTime = millis();

  if (server && !server->isRunning()) {
    server.reset();
    lastHandleClientTime = 0;
  }
}

void BackgroundWebServerRuntime::requestHandoff() { handoffRequested = true; }

bool BackgroundWebServerRuntime::consumeHandoffRequest() {
  const bool requested = handoffRequested;
  handoffRequested = false;
  return requested;
}
