#pragma once

#include <memory>

class CrossPointWebServer;

class BackgroundWebServerRuntime {
 public:
  bool isRunning() const;
  void activate(std::unique_ptr<CrossPointWebServer>&& server);
  std::unique_ptr<CrossPointWebServer> takeOwnership();
  void stop();
  void loop();
  void requestHandoff();
  bool consumeHandoffRequest();

 private:
  std::unique_ptr<CrossPointWebServer> server;
  unsigned long lastHandleClientTime = 0;
  bool handoffRequested = false;
};

extern BackgroundWebServerRuntime BACKGROUND_WEB_SERVER_RUNTIME;
