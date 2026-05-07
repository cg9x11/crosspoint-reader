import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright-core";

const baseUrl = process.env.SMOKE_BASE_URL || "http://192.168.1.202:8787";
const initialUsername = process.env.SMOKE_BOOTSTRAP_USER || "admin";
const initialPassword = process.env.SMOKE_BOOTSTRAP_PASS || "ChangeMe123!";
const temporaryPassword = process.env.SMOKE_TEMP_PASS || "AdminTemp123!";
const viewport = { width: 375, height: 812 };
const chromePath =
  process.env.SMOKE_CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.resolve(process.cwd(), ".tmp-browser", "out");

async function ensureOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function screenshot(page, name) {
  const target = path.join(outputDir, name);
  await page.screenshot({
    path: target,
    fullPage: true
  });
  return target;
}

async function detectOverflow(page) {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const offenders = [];
    const scrollableSelector = ".filter-bar, .source-tabs, .category-bar";

    for (const element of document.querySelectorAll("body *")) {
      if (element.closest(scrollableSelector)) {
        continue;
      }

      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        continue;
      }

      const overflowLeft = rect.left < -1;
      const overflowRight = rect.right > viewportWidth + 1;
      if (!overflowLeft && !overflowRight) {
        continue;
      }

      offenders.push({
        tag: element.tagName.toLowerCase(),
        className: element.className || "",
        id: element.id || "",
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width)
      });
    }

    return {
      viewportWidth,
      count: offenders.length,
      offenders: offenders.slice(0, 20)
    };
  });
}

async function waitForPageSettled(page, delayMs = 500) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(delayMs);
}

async function waitForBrowseReady(page, timeoutMs = 20000) {
  await page
    .waitForFunction(
      () =>
        document.querySelectorAll("#browse-grid .novel-card").length > 0 ||
        !!document.querySelector("#browse-grid .empty-title"),
      null,
      { timeout: timeoutMs }
    )
    .catch(() => {});
}

async function waitForDetailReady(page, timeoutMs = 30000) {
  await page
    .waitForFunction(
      () => document.querySelectorAll("#chapter-list .chapter-row").length > 5,
      null,
      { timeout: timeoutMs }
    )
    .catch(() => {});
}

async function clickByText(page, selector, text) {
  const locator = page.locator(selector).filter({ hasText: text }).first();
  if ((await locator.count()) > 0) {
    await locator.click();
    return true;
  }
  return false;
}

async function collectState(page, label) {
  return {
    label,
    url: page.url(),
    overflow: await detectOverflow(page)
  };
}

async function main() {
  await ensureOutputDir();

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true
  });

  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const states = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await waitForPageSettled(page);
  await screenshot(page, "01-login-mobile.png");
  states.push(await collectState(page, "login"));

  await page.locator("#login-username").fill(initialUsername);
  await page.locator("#login-password").fill(initialPassword);
  await page.locator("#login-form button[type=submit]").click();
  await waitForPageSettled(page, 800);
  await screenshot(page, "02-change-password-mobile.png");
  states.push(await collectState(page, "change-password"));

  const passwordModalVisible = await page.locator("#change-password-modal").isVisible().catch(() => false);
  if (passwordModalVisible) {
    await page.locator("#change-password-username").fill(initialUsername);
    await page.locator("#change-password-current").fill(initialPassword);
    await page.locator("#change-password-next").fill(temporaryPassword);
    await page.locator("#change-password-confirm").fill(temporaryPassword);
    await page.locator("#change-password-form").press("Enter");
    await waitForPageSettled(page, 1000);
  }

  await page.goto(`${baseUrl}/library`, { waitUntil: "domcontentloaded" });
  await waitForPageSettled(page, 1000);
  await screenshot(page, "03-library-mobile.png");
  states.push(await collectState(page, "library"));

  await page.goto(`${baseUrl}/sources`, { waitUntil: "domcontentloaded" });
  await waitForPageSettled(page, 1200);
  await screenshot(page, "04-sources-mobile.png");
  states.push(await collectState(page, "sources"));

  const browseButton = page.locator(".source-card .source-browse-btn").first();
  if ((await browseButton.count()) > 0) {
    await browseButton.click();
    await waitForBrowseReady(page);
    await waitForPageSettled(page, 800);
    await screenshot(page, "05-browse-mobile.png");
    states.push(await collectState(page, "browse"));

    const novelCard = page.locator("#browse-grid .novel-card").first();
    if ((await novelCard.count()) > 0) {
      await novelCard.click();
      await waitForDetailReady(page);
      await waitForPageSettled(page, 800);
      await screenshot(page, "06-detail-mobile.png");
      states.push(await collectState(page, "detail"));
      await page.locator("#back-btn").click().catch(() => {});
      await waitForPageSettled(page, 800);
    }
  }

  await page.goto(`${baseUrl}/tasks`, { waitUntil: "domcontentloaded" });
  await waitForPageSettled(page, 1200);
  await screenshot(page, "07-tasks-mobile.png");
  states.push(await collectState(page, "tasks"));

  await page.goto(`${baseUrl}/extensions`, { waitUntil: "domcontentloaded" });
  await waitForPageSettled(page, 1400);
  await screenshot(page, "08-extensions-mobile.png");
  states.push(await collectState(page, "extensions"));

  const extensionCard = page.locator("#page-server .source-card").first();
  if ((await extensionCard.count()) > 0) {
    await extensionCard.click();
    await waitForPageSettled(page, 500);
    await screenshot(page, "09-extension-modal-mobile.png");
    states.push(await collectState(page, "extension-modal"));
    await page.locator("#dynamic-modal [data-close='dynamic-modal']").click().catch(() => {});
  }

  await page.goto(`${baseUrl}/settings`, { waitUntil: "domcontentloaded" });
  await waitForPageSettled(page, 1000);
  await screenshot(page, "10-settings-mobile.png");
  states.push(await collectState(page, "settings"));

  if (await clickByText(page, "button", "Đăng xuất")) {
    await waitForPageSettled(page, 600);
    await screenshot(page, "11-logout-mobile.png");
    states.push(await collectState(page, "logout"));
  }

  await page.locator("#login-username").fill(initialUsername);
  await page.locator("#login-password").fill(temporaryPassword);
  await page.locator("#login-form button[type=submit]").click();
  await waitForPageSettled(page, 800);
  await screenshot(page, "12-relogin-mobile.png");
  states.push(await collectState(page, "relogin"));

  await fs.writeFile(
    path.join(outputDir, "smoke-report.json"),
    JSON.stringify(
      {
        baseUrl,
        viewport,
        states,
        consoleErrors,
        pageErrors
      },
      null,
      2
    ),
    "utf8"
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
