#include "RecentBooksActivity.h"

#include <GfxRenderer.h>
#include <HalStorage.h>
#include <I18n.h>
#include <WiFi.h>

#include <algorithm>

#include "MappedInputManager.h"
#include "PluginStore.h"
#include "RecentBooksStore.h"
#include "activities/network/WifiSelectionActivity.h"
#include "activities/online/HakoBookDetailActivity.h"
#include "components/UITheme.h"
#include "fontIds.h"
#include "plugins/OnlineSourceBridge.h"

namespace {
constexpr unsigned long GO_HOME_MS = 1000;

bool isWifiReadyForOnlineRecent() {
  return WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0);
}

CpPluginInfo resolvePluginForRecentBook(const RecentBook& book) {
  if (const auto* exact = PLUGIN_STORE.getPlugin(book.pluginId)) {
    return *exact;
  }

  const std::string family = PluginStore::canonicalizeRuntimeProfile(book.pluginId, book.runtimeProfile);
  const CpPluginInfo* best = nullptr;
  for (const auto& plugin : PLUGIN_STORE.getPlugins()) {
    if (PluginStore::canonicalizeRuntimeProfile(plugin.id, plugin.runtimeProfile) != family) {
      continue;
    }
    if (!plugin.supportsSearch || !OnlineSourceBridge::supportsNativeUi(plugin)) {
      continue;
    }
    if (!best || (best->runtimeOrigin != "server" && plugin.runtimeOrigin == "server")) {
      best = &plugin;
    }
  }

  return best ? *best : OnlineSourceBridge::makeFallbackPluginInfo(book.pluginId, book.runtimeProfile);
}
}  // namespace

void RecentBooksActivity::loadRecentBooks() {
  recentBooks.clear();
  const auto& books = RECENT_BOOKS.getBooks();
  recentBooks.reserve(books.size());

  for (const auto& book : books) {
    // Skip if file no longer exists
    if (book.isLocalFile() && !Storage.exists(book.path.c_str())) {
      continue;
    }
    recentBooks.push_back(book);
  }
}

void RecentBooksActivity::onEnter() {
  Activity::onEnter();

  // Load data
  loadRecentBooks();

  selectorIndex = 0;
  requestUpdate();
}

void RecentBooksActivity::onExit() {
  Activity::onExit();
  recentBooks.clear();
}

void RecentBooksActivity::loop() {
  const int pageItems = UITheme::getInstance().getNumberOfItemsPerPage(renderer, true, false, true, true);

  if (mappedInput.wasReleased(MappedInputManager::Button::Confirm)) {
    if (!recentBooks.empty() && selectorIndex < static_cast<int>(recentBooks.size())) {
      LOG_DBG("RBA", "Selected recent book: %s", recentBooks[selectorIndex].path.c_str());
      onSelectBook(recentBooks[selectorIndex]);
      return;
    }
  }

  if (mappedInput.wasReleased(MappedInputManager::Button::Back)) {
    onGoHome();
  }

  int listSize = static_cast<int>(recentBooks.size());

  buttonNavigator.onNextRelease([this, listSize] {
    selectorIndex = ButtonNavigator::nextIndex(static_cast<int>(selectorIndex), listSize);
    requestUpdate();
  });

  buttonNavigator.onPreviousRelease([this, listSize] {
    selectorIndex = ButtonNavigator::previousIndex(static_cast<int>(selectorIndex), listSize);
    requestUpdate();
  });

  buttonNavigator.onNextContinuous([this, listSize, pageItems] {
    selectorIndex = ButtonNavigator::nextPageIndex(static_cast<int>(selectorIndex), listSize, pageItems);
    requestUpdate();
  });

  buttonNavigator.onPreviousContinuous([this, listSize, pageItems] {
    selectorIndex = ButtonNavigator::previousPageIndex(static_cast<int>(selectorIndex), listSize, pageItems);
    requestUpdate();
  });
}

void RecentBooksActivity::onSelectBook(const RecentBook& book) {
  if (!book.isOnlineSource()) {
    activityManager.goToReader(book.path);
    return;
  }

  if (book.pluginId.empty() || book.seriesUrl.empty()) {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Unsupported recent item");
    requestUpdate();
    return;
  }

  if (isWifiReadyForOnlineRecent()) {
    openOnlineRecentBook(book);
    return;
  }

  startActivityForResult(std::make_unique<WifiSelectionActivity>(renderer, mappedInput),
                         [this, book](const ActivityResult& result) {
                           if (result.isCancelled) {
                             requestUpdate();
                             return;
                           }
                           openOnlineRecentBook(book);
                         });
}

void RecentBooksActivity::openOnlineRecentBook(const RecentBook& book) {
  const CpPluginInfo plugin = resolvePluginForRecentBook(book);
  if (!OnlineSourceBridge::supportsNativeUi(plugin)) {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Unsupported source");
    requestUpdate();
    return;
  }

  HakoBookDetail detail;
  {
    RenderLock lock(*this);
    GUI.drawPopup(renderer, "Loading series...");
    renderer.displayBuffer();
  }
  if (!OnlineSourceBridge::fetchDetail(plugin, book.seriesUrl, detail)) {
    RenderLock lock(*this);
    const std::string message =
        OnlineSourceBridge::getLastError().empty() ? "Failed to load series" : OnlineSourceBridge::getLastError();
    GUI.drawPopup(renderer, message.c_str());
    requestUpdate();
    return;
  }

  startActivityForResult(
      std::make_unique<HakoBookDetailActivity>(renderer, mappedInput, plugin, std::move(detail), std::vector<HakoChapterRef>{}),
      [this](const ActivityResult&) {
        loadRecentBooks();
        requestUpdate();
      });
}

void RecentBooksActivity::render(RenderLock&&) {
  renderer.clearScreen();

  const auto pageWidth = renderer.getScreenWidth();
  const auto pageHeight = renderer.getScreenHeight();
  const auto& metrics = UITheme::getInstance().getMetrics();

  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.headerHeight}, tr(STR_MENU_RECENT_BOOKS));

  const int contentTop = metrics.topPadding + metrics.headerHeight + metrics.verticalSpacing;
  const int contentHeight = pageHeight - contentTop - metrics.buttonHintsHeight - metrics.verticalSpacing;

  // Recent tab
  if (recentBooks.empty()) {
    renderer.drawText(UI_10_FONT_ID, metrics.contentSidePadding, contentTop + 20, tr(STR_NO_RECENT_BOOKS));
  } else {
    GUI.drawList(
        renderer, Rect{0, contentTop, pageWidth, contentHeight}, recentBooks.size(), selectorIndex,
        [this](int index) { return recentBooks[index].title; }, [this](int index) { return recentBooks[index].author; },
        [this](int index) {
          return recentBooks[index].isOnlineSource() ? Library : UITheme::getFileIcon(recentBooks[index].path);
        });
  }

  // Help text
  const auto labels = mappedInput.mapLabels(tr(STR_HOME), tr(STR_OPEN), tr(STR_DIR_UP), tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);

  renderer.displayBuffer();
}
