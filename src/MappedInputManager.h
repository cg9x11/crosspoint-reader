#pragma once

#include <HalGPIO.h>

#include <array>

class MappedInputManager {
 public:
  enum class Button { Back, Confirm, Left, Right, Up, Down, Power, PageBack, PageForward };

  struct Labels {
    const char* btn1;
    const char* btn2;
    const char* btn3;
    const char* btn4;
  };

  explicit MappedInputManager(HalGPIO& gpio) : gpio(gpio) {}

  void update() const;
  bool wasPressed(Button button) const;
  bool wasReleased(Button button) const;
  bool isPressed(Button button) const;
  bool wasAnyPressed() const;
  bool wasAnyReleased() const;
  unsigned long getHeldTime() const;
  unsigned long getHeldTime(Button button) const;
  Labels mapLabels(const char* back, const char* confirm, const char* previous, const char* next) const;
  // Returns the raw front button index that was pressed this frame (or -1 if none).
  int getPressedFrontButton() const;
  bool injectTap(Button button, unsigned long holdMs = 80) const;

 private:
  static constexpr size_t BUTTON_COUNT = 9;
  struct InjectedButtonState {
    bool pressed = false;
    bool pressedEdge = false;
    bool releasedEdge = false;
    unsigned long pressedAtMs = 0;
    unsigned long releaseAtMs = 0;
    unsigned long activateOnGeneration = 0;
    unsigned long pendingHoldMs = 0;
  };

  HalGPIO& gpio;
  mutable std::array<InjectedButtonState, BUTTON_COUNT> injectedButtons = {};
  mutable unsigned long updateGeneration = 0;

  bool mapButton(Button button, bool (HalGPIO::*fn)(uint8_t) const) const;
  static size_t buttonToIndex(Button button);
  void updateInjectedButtons() const;
};
