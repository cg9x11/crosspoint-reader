#include "MappedInputManager.h"

#include "CrossPointSettings.h"

namespace {
using ButtonIndex = uint8_t;

struct SideLayoutMap {
  ButtonIndex pageBack;
  ButtonIndex pageForward;
};

// Order matches CrossPointSettings::SIDE_BUTTON_LAYOUT.
constexpr SideLayoutMap kSideLayouts[] = {
    {HalGPIO::BTN_UP, HalGPIO::BTN_DOWN},
    {HalGPIO::BTN_DOWN, HalGPIO::BTN_UP},
};
}  // namespace

size_t MappedInputManager::buttonToIndex(const Button button) { return static_cast<size_t>(button); }

void MappedInputManager::update() const {
  gpio.update();
  updateGeneration++;
  updateInjectedButtons();
}

void MappedInputManager::updateInjectedButtons() const {
  const unsigned long now = millis();
  for (auto& state : injectedButtons) {
    state.pressedEdge = false;
    state.releasedEdge = false;
    if (state.activateOnGeneration != 0 && state.activateOnGeneration <= updateGeneration) {
      state.pressed = true;
      state.pressedEdge = true;
      state.pressedAtMs = now;
      state.releaseAtMs = now + state.pendingHoldMs;
      state.activateOnGeneration = 0;
      state.pendingHoldMs = 0;
    }
    if (state.pressed && state.releaseAtMs > 0 && now >= state.releaseAtMs) {
      state.pressed = false;
      state.releaseAtMs = 0;
      state.releasedEdge = true;
    }
  }
}

bool MappedInputManager::mapButton(const Button button, bool (HalGPIO::*fn)(uint8_t) const) const {
  const auto sideLayout = static_cast<CrossPointSettings::SIDE_BUTTON_LAYOUT>(SETTINGS.sideButtonLayout);
  const auto& side = kSideLayouts[sideLayout];

  switch (button) {
    case Button::Back:
      // Logical Back maps to user-configured front button.
      return (gpio.*fn)(SETTINGS.frontButtonBack);
    case Button::Confirm:
      // Logical Confirm maps to user-configured front button.
      return (gpio.*fn)(SETTINGS.frontButtonConfirm);
    case Button::Left:
      // Logical Left maps to user-configured front button.
      return (gpio.*fn)(SETTINGS.frontButtonLeft);
    case Button::Right:
      // Logical Right maps to user-configured front button.
      return (gpio.*fn)(SETTINGS.frontButtonRight);
    case Button::Up:
      // Side buttons remain fixed for Up/Down.
      return (gpio.*fn)(HalGPIO::BTN_UP);
    case Button::Down:
      // Side buttons remain fixed for Up/Down.
      return (gpio.*fn)(HalGPIO::BTN_DOWN);
    case Button::Power:
      // Power button bypasses remapping.
      return (gpio.*fn)(HalGPIO::BTN_POWER);
    case Button::PageBack:
      // Reader page navigation uses side buttons and can be swapped via settings.
      return (gpio.*fn)(side.pageBack);
    case Button::PageForward:
      // Reader page navigation uses side buttons and can be swapped via settings.
      return (gpio.*fn)(side.pageForward);
  }

  return false;
}

bool MappedInputManager::wasPressed(const Button button) const {
  return mapButton(button, &HalGPIO::wasPressed) || injectedButtons[buttonToIndex(button)].pressedEdge;
}

bool MappedInputManager::wasReleased(const Button button) const {
  return mapButton(button, &HalGPIO::wasReleased) || injectedButtons[buttonToIndex(button)].releasedEdge;
}

bool MappedInputManager::isPressed(const Button button) const {
  return mapButton(button, &HalGPIO::isPressed) || injectedButtons[buttonToIndex(button)].pressed;
}

bool MappedInputManager::wasAnyPressed() const {
  if (gpio.wasAnyPressed()) {
    return true;
  }
  for (const auto& state : injectedButtons) {
    if (state.pressedEdge) {
      return true;
    }
  }
  return false;
}

bool MappedInputManager::wasAnyReleased() const {
  if (gpio.wasAnyReleased()) {
    return true;
  }
  for (const auto& state : injectedButtons) {
    if (state.releasedEdge) {
      return true;
    }
  }
  return false;
}

unsigned long MappedInputManager::getHeldTime() const {
  unsigned long injectedHeldTime = 0;
  const unsigned long now = millis();
  for (const auto& state : injectedButtons) {
    if (state.pressed) {
      const unsigned long heldTime = now - state.pressedAtMs;
      if (heldTime > injectedHeldTime) {
        injectedHeldTime = heldTime;
      }
    }
  }
  const unsigned long hardwareHeldTime = gpio.getHeldTime();
  return hardwareHeldTime > injectedHeldTime ? hardwareHeldTime : injectedHeldTime;
}

MappedInputManager::Labels MappedInputManager::mapLabels(const char* back, const char* confirm, const char* previous,
                                                         const char* next) const {
  // Build the label order based on the configured hardware mapping.
  auto labelForHardware = [&](uint8_t hw) -> const char* {
    // Compare against configured logical roles and return the matching label.
    if (hw == SETTINGS.frontButtonBack) {
      return back;
    }
    if (hw == SETTINGS.frontButtonConfirm) {
      return confirm;
    }
    if (hw == SETTINGS.frontButtonLeft) {
      return previous;
    }
    if (hw == SETTINGS.frontButtonRight) {
      return next;
    }
    return "";
  };

  return {labelForHardware(HalGPIO::BTN_BACK), labelForHardware(HalGPIO::BTN_CONFIRM),
          labelForHardware(HalGPIO::BTN_LEFT), labelForHardware(HalGPIO::BTN_RIGHT)};
}

int MappedInputManager::getPressedFrontButton() const {
  // Scan the raw front buttons in hardware order.
  // This bypasses remapping so the remap activity can capture physical presses.
  if (gpio.wasPressed(HalGPIO::BTN_BACK)) {
    return HalGPIO::BTN_BACK;
  }
  if (gpio.wasPressed(HalGPIO::BTN_CONFIRM)) {
    return HalGPIO::BTN_CONFIRM;
  }
  if (gpio.wasPressed(HalGPIO::BTN_LEFT)) {
    return HalGPIO::BTN_LEFT;
  }
  if (gpio.wasPressed(HalGPIO::BTN_RIGHT)) {
    return HalGPIO::BTN_RIGHT;
  }
  return -1;
}

bool MappedInputManager::injectTap(const Button button, const unsigned long holdMs) const {
  InjectedButtonState& state = injectedButtons[buttonToIndex(button)];
  state.pressed = false;
  state.releaseAtMs = 0;
  state.releasedEdge = false;
  state.pressedEdge = false;
  state.activateOnGeneration = updateGeneration + 1;
  state.pendingHoldMs = (holdMs == 0 ? 1 : holdMs);
  return true;
}
