#include <Arduino.h>
#include "HomeActivity.h"

#include <Bitmap.h>
#include <Epub.h>
#include <FsHelpers.h>
#include <GfxRenderer.h>
#include <HalStorage.h>
#include <I18n.h>
#include <Logging.h>
#include <WiFi.h>
#include <Utf8.h>
#include <Xtc.h>

#include <cstring>
#include <vector>

#include "CrossPointSettings.h"
#include "CrossPointState.h"
#include "MappedInputManager.h"
#include "OnlineCoverStore.h"
#include "OpdsServerStore.h"
#include "RecentBooksStore.h"
#include "activities/network/WifiSelectionActivity.h"
#include "activities/online/HakoBookDetailActivity.h"
#include "activities/online/OnlineLibraryActivity.h"
#include "components/UITheme.h"
#include "fontIds.h"
#include "plugins/OnlineSourceBridge.h"

namespace {
bool isWifiReadyForOnlineRecent() {
  return WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0);
}

bool resolvePluginForRecentBook(const RecentBook& book, CpPluginInfo& outPlugin) {
  return OnlineSourceBridge::resolveCatalogPlugin(book.pluginId, book.runtimeProfile, outPlugin);
}
}  // namespace

int HomeActivity::getMenuItemCount() const {
  int count = 5;  // File Browser, Recents, Online Library, File transfer, Settings
  if (!recentBooks.empty()) {
    count += recentBooks.size();
  }
  if (hasOpdsServers) {
    count++;
  }
  return count;
}

void HomeActivity::loadRecentBooks(int maxBooks) {
  recentBooks.clear();
  const auto& books = RECENT_BOOKS.getBooks();
  recentBooks.reserve(std::min(static_cast<int>(books.size()), maxBooks));

  for (const RecentBook& book : books) {
    // Limit to maximum number of recent books
    if (recentBooks.size() >= maxBooks) {
      break;
    }

    // Skip if file no longer exists
    if (book.isLocalFile() && !Storage.exists(book.path.c_str())) {
      continue;
    }

    recentBooks.push_back(book);
  }
}

void HomeActivity::loadRecentCovers(int coverHeight) {
  if (recentsLoaded || recentsLoading) {
    return;
  }

  while (recentCoverWarmIndex < recentBooks.size()) {
    RecentBook& book = recentBooks[recentCoverWarmIndex];
    recentCoverWarmIndex++;

    const std::string coverPath = UITheme::getCoverThumbPath(book.coverBmpPath, coverHeight);
    if (!book.coverBmpPath.empty() && Storage.exists(coverPath.c_str())) {
      continue;
    }
    if (book.coverBmpPath.empty() && !book.isOnlineSource()) {
      continue;
    }

    recentsLoading = true;
    const unsigned long startedAt = millis();
    LOG_DBG("HOME", "Warming recent cover %u/%u (heap=%u, largest=%u): %s",
            static_cast<unsigned>(recentCoverWarmIndex), static_cast<unsigned>(recentBooks.size()), ESP.getFreeHeap(),
            ESP.getMaxAllocHeap(), book.path.c_str());

    bool success = false;
    std::string resolvedCoverPath = coverPath;
    if (book.isOnlineSource()) {
      if (!book.coverUrl.empty()) {
        success = OnlineCoverStore::getOrCreateThumb(book.coverUrl, coverHeight, resolvedCoverPath);
      }
    } else if (FsHelpers::hasEpubExtension(book.path)) {
      Epub epub(book.path, "/.crosspoint");
      if (epub.load(false, true)) {
        success = epub.generateThumbBmp(coverHeight);
      }
    } else if (FsHelpers::hasXtcExtension(book.path)) {
      Xtc xtc(book.path, "/.crosspoint");
      if (xtc.load()) {
        success = xtc.generateThumbBmp(coverHeight);
      }
    }

    if (success && book.isOnlineSource()) {
      RECENT_BOOKS.updateBook(book.path, book.title, book.author, resolvedCoverPath);
      book.coverBmpPath = resolvedCoverPath;
    } else if (!success) {
      RECENT_BOOKS.updateBook(book.path, book.title, book.author, "");
      book.coverBmpPath.clear();
    }

    coverRendered = false;
    freeCoverBuffer();
    recentsLoading = false;
    LOG_DBG("HOME", "Recent cover warm finished in %lu ms, success=%s (heap=%u, largest=%u)", millis() - startedAt,
            success ? "yes" : "no", ESP.getFreeHeap(), ESP.getMaxAllocHeap());
    requestUpdate();
    return;
  }

  recentsLoaded = true;
  recentsLoading = false;
}

void HomeActivity::onEnter() {
  Activity::onEnter();

  hasOpdsServers = OPDS_STORE.hasServers();

  selectorIndex = 0;

  const auto& metrics = UITheme::getInstance().getMetrics();
  loadRecentBooks(metrics.homeRecentBooksCount);
  resetRecentState();
  firstRenderDone = false;

  // Trigger first update
  requestUpdate();
}

void HomeActivity::onExit() {
  Activity::onExit();

  // Free the stored cover buffer if any
  freeCoverBuffer();
}

bool HomeActivity::storeCoverBuffer() {
  uint8_t* frameBuffer = renderer.getFrameBuffer();
  if (!frameBuffer) {
    return false;
  }

  // Free any existing buffer first
  freeCoverBuffer();

  const size_t bufferSize = renderer.getBufferSize();
  coverBuffer = static_cast<uint8_t*>(malloc(bufferSize));
  if (!coverBuffer) {
    return false;
  }

  memcpy(coverBuffer, frameBuffer, bufferSize);
  return true;
}

bool HomeActivity::restoreCoverBuffer() {
  if (!coverBuffer) {
    return false;
  }

  uint8_t* frameBuffer = renderer.getFrameBuffer();
  if (!frameBuffer) {
    return false;
  }

  const size_t bufferSize = renderer.getBufferSize();
  memcpy(frameBuffer, coverBuffer, bufferSize);
  return true;
}

void HomeActivity::freeCoverBuffer() {
  if (coverBuffer) {
    free(coverBuffer);
    coverBuffer = nullptr;
  }
  coverBufferStored = false;
}

void HomeActivity::resetRecentState() {
  recentCoverWarmIndex = 0;
  recentsLoading = false;
  recentsLoaded = recentBooks.empty();
  coverRendered = false;
  freeCoverBuffer();
}

void HomeActivity::loop() {
  const int menuCount = getMenuItemCount();

  buttonNavigator.onNext([this, menuCount] {
    selectorIndex = ButtonNavigator::nextIndex(selectorIndex, menuCount);
    requestUpdate();
  });

  buttonNavigator.onPrevious([this, menuCount] {
    selectorIndex = ButtonNavigator::previousIndex(selectorIndex, menuCount);
    requestUpdate();
  });

  if (mappedInput.wasPressed(MappedInputManager::Button::Confirm)) {
    // Calculate dynamic indices based on which options are available
    int idx = 0;
    int menuSelectedIndex = selectorIndex - static_cast<int>(recentBooks.size());
    const int fileBrowserIdx = idx++;
    const int recentsIdx = idx++;
    const int opdsLibraryIdx = hasOpdsServers ? idx++ : -1;
    const int onlineLibraryIdx = idx++;
    const int fileTransferIdx = idx++;
    const int settingsIdx = idx;

    if (selectorIndex < recentBooks.size()) {
      onSelectBook(recentBooks[selectorIndex]);
    } else if (menuSelectedIndex == fileBrowserIdx) {
      onFileBrowserOpen();
    } else if (menuSelectedIndex == recentsIdx) {
      onRecentsOpen();
    } else if (menuSelectedIndex == opdsLibraryIdx) {
      onOpdsBrowserOpen();
    } else if (menuSelectedIndex == onlineLibraryIdx) {
      onOnlineLibraryOpen();
    } else if (menuSelectedIndex == fileTransferIdx) {
      onFileTransferOpen();
    } else if (menuSelectedIndex == settingsIdx) {
      onSettingsOpen();
    }
  }

  if (firstRenderDone && !recentsLoaded && !recentsLoading) {
    const auto& metrics = UITheme::getInstance().getMetrics();
    loadRecentCovers(metrics.homeCoverHeight);
  }
}

void HomeActivity::render(RenderLock&&) {
  const auto& metrics = UITheme::getInstance().getMetrics();
  const auto pageWidth = renderer.getScreenWidth();
  const auto pageHeight = renderer.getScreenHeight();

  renderer.clearScreen();
  bool bufferRestored = coverBufferStored && restoreCoverBuffer();

  GUI.drawHeader(renderer, Rect{0, metrics.topPadding, pageWidth, metrics.homeTopPadding}, nullptr);

  GUI.drawRecentBookCover(renderer, Rect{0, metrics.homeTopPadding, pageWidth, metrics.homeCoverTileHeight},
                          recentBooks, selectorIndex, coverRendered, coverBufferStored, bufferRestored,
                          std::bind(&HomeActivity::storeCoverBuffer, this));

  // Build menu items dynamically
  std::vector<std::string> menuItems = {tr(STR_BROWSE_FILES), tr(STR_MENU_RECENT_BOOKS), "Online Library",
                                        tr(STR_FILE_TRANSFER), tr(STR_SETTINGS_TITLE)};
  std::vector<UIIcon> menuIcons = {Folder, Recent, Library, Transfer, Settings};

  if (hasOpdsServers) {
    menuItems.insert(menuItems.begin() + 2, tr(STR_OPDS_BROWSER));
    menuIcons.insert(menuIcons.begin() + 2, Library);
  }

  GUI.drawButtonMenu(
      renderer,
      Rect{0, metrics.homeTopPadding + metrics.homeCoverTileHeight + metrics.verticalSpacing, pageWidth,
           pageHeight - (metrics.headerHeight + metrics.homeTopPadding + metrics.verticalSpacing * 2 +
                         metrics.buttonHintsHeight)},
      static_cast<int>(menuItems.size()), selectorIndex - recentBooks.size(),
      [&menuItems](int index) { return menuItems[index]; },
      [&menuIcons](int index) { return menuIcons[index]; });

  const auto labels = mappedInput.mapLabels("", tr(STR_SELECT), tr(STR_DIR_UP), tr(STR_DIR_DOWN));
  GUI.drawButtonHints(renderer, labels.btn1, labels.btn2, labels.btn3, labels.btn4);

  renderer.displayBuffer();

  if (!firstRenderDone) {
    firstRenderDone = true;
    requestUpdate();
  }
}

void HomeActivity::onSelectBook(const RecentBook& book) {
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

void HomeActivity::openOnlineRecentBook(const RecentBook& book) {
  CpPluginInfo plugin;
  if (!resolvePluginForRecentBook(book, plugin)) {
    RenderLock lock(*this);
    const std::string message =
        OnlineSourceBridge::getLastError().empty() ? "Source unavailable" : OnlineSourceBridge::getLastError();
    GUI.drawPopup(renderer, message.c_str());
    requestUpdate();
    return;
  }
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
        const auto& metrics = UITheme::getInstance().getMetrics();
        loadRecentBooks(metrics.homeRecentBooksCount);
        resetRecentState();
        requestUpdate();
      });
}

void HomeActivity::onFileBrowserOpen() { activityManager.goToFileBrowser(); }

void HomeActivity::onRecentsOpen() { activityManager.goToRecentBooks(); }

void HomeActivity::onSettingsOpen() { activityManager.goToSettings(); }

void HomeActivity::onFileTransferOpen() { activityManager.goToFileTransfer(); }

void HomeActivity::onOpdsBrowserOpen() { activityManager.goToBrowser(); }

void HomeActivity::onOnlineLibraryOpen() {
  activityManager.replaceActivity(std::make_unique<OnlineLibraryActivity>(renderer, mappedInput));
}
