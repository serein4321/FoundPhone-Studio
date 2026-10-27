import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { compileStory } from "../src/story-engine/compiler";
const blank = compileStory(
  JSON.parse(readFileSync("stories/blank/story.json", "utf8")),
).work;
test.beforeEach(async ({ page }) => {
  await page.route("**/work.json", (r) => r.fulfill({ json: blank }));
});
async function unlock(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(page.locator(".lock-screen")).toHaveCount(0);
}
async function library(page: Page) {
  await page
    .getByRole("button", { name: "開啟App Store", exact: true })
    .click();
  await expect(page.getByPlaceholder("搜尋全部App")).toBeVisible();
}
async function add(page: Page, name: string) {
  await page.getByPlaceholder("搜尋全部App").fill(name);
  const row = page.locator(".runtime-library-row").filter({
    has: page.locator(".library-app-title strong", { hasText: name }),
  });
  await row.getByRole("button", { name: "獲取", exact: true }).click();
  await expect(
    row.getByRole("button", { name: "開啟", exact: true }),
  ).toBeVisible();
}
async function close(page: Page) {
  await page.getByRole("button", { name: "關閉App管理" }).click();
}
async function open(page: Page, name: string) {
  await page.getByRole("button", { name: "開啟" + name, exact: true }).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
}
test("all apps available, install, remove vs uninstall, refresh and reinstall", async ({
  page,
}) => {
  await unlock(page);
  await library(page);
  await expect(page.locator(".runtime-library-row")).toHaveCount(49);
  await expect(page.locator(".library-count")).toContainText("7 / 全部49");
  await add(page, "微信");
  await close(page);
  await open(page, "微信");
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(page.locator(".app-screen")).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(
    page.getByRole("button", { name: "開啟微信", exact: true }),
  ).toBeVisible();
  await library(page);
  await page.getByPlaceholder("搜尋全部App").fill("微信");
  await page.locator(".library-app-title").click();
  await page.getByRole("button", { name: "從桌面移除", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "開啟微信", exact: true }),
  ).toHaveCount(0);
  await library(page);
  await page.getByPlaceholder("搜尋全部App").fill("微信");
  await page.getByRole("button", { name: "新增到桌面" }).click();
  await page.locator(".library-app-title").click();
  await page.getByRole("button", { name: "卸載App", exact: true }).click();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: "確認卸載", exact: true }).click();
  await library(page);
  await add(page, "微信");
  await page
    .locator(".launcher-sheet")
    .screenshot({ path: "outputs/v0.8/app-library.png" });
});
test("pointer drag reorders apps, widgets pack and persist, folders and Dock", async ({
  page,
}) => {
  await unlock(page);
  const before = await page
    .locator(".home-app-grid [data-home-key]")
    .evaluateAll((es) => es.map((e) => e.getAttribute("data-home-key")));
  const first = await page.locator('[data-home-key="photos"]').boundingBox(),
    last = await page.locator('[data-home-key="settings"]').boundingBox();
  await page.mouse.move(first!.x + 30, first!.y + 30);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.move(last!.x + 30, last!.y + 30, { steps: 10 });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "完成", exact: true }),
  ).toBeVisible();
  const after = await page
    .locator(".home-app-grid [data-home-key]")
    .evaluateAll((es) => es.map((e) => e.getAttribute("data-home-key")));
  expect(after).not.toEqual(before);
  await page.getByRole("button", { name: "新增小組件", exact: true }).click();
  await page
    .getByRole("button", { name: "新增日歷小組件", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "日歷小組件", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(
    page.getByRole("button", { name: "日歷小組件", exact: true }),
  ).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/v0.8/widgets-home.png" });
  await library(page);
  await page.getByPlaceholder("搜尋全部App").fill("相簿");
  await page.locator(".library-app-title").click();
  await page.getByRole("textbox", { name: "資料夾名稱" }).fill("工具");
  await close(page);
  await expect(
    page.getByRole("button", { name: "開啟資料夾工具" }),
  ).toBeVisible();
  await expect(page.locator(".launcher-sheet")).toHaveCount(0);
  await expect(page.locator(".interactive-home")).toHaveCSS("opacity", "1");
  await expect(page.locator(".dock")).toBeVisible();
  const source = await page.locator('[data-home-key="settings"]').boundingBox(),
    dock = await page.locator(".dock").boundingBox();
  await page.mouse.move(source!.x + 30, source!.y + 30);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.move(dock!.x + dock!.width / 2, dock!.y + 40, { steps: 8 });
  await page.mouse.up();
  await expect(
    page.locator('.dock [data-home-key="dock:settings"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: "布局", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "導出布局JSON" }).click();
  const download = await downloadPromise;
  const exported = JSON.parse(readFileSync((await download.path())!, "utf8"));
  expect(
    exported.apps.filter(
      (a: { dock: boolean; installed: boolean; visible: boolean }) =>
        a.dock && a.installed && a.visible,
    ),
  ).toHaveLength(4);
  expect(exported.widgets).toHaveLength(1);
  await page.locator('input[aria-label="導入桌面布局"]').setInputFiles({
    name: "layout.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exported)),
  });
  await expect(page.locator(".launcher-sheet")).toHaveCount(0);
});
test("new three reference screens, calculator operations, health tabs and weather cities", async ({
  page,
}) => {
  await unlock(page);
  await library(page);
  for (const name of ["計算器", "健康", "天氣"]) await add(page, name);
  await close(page);
  await open(page, "計算器");
  await page.getByRole("button", { name: "AC", exact: true }).click();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/v0.8/calculator.png" });
  for (const name of ["7", "+", "5", "="])
    await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator(".calculator>output")).toHaveText("12");
  await page.getByRole("button", { name: "計算歷史" }).click();
  await expect(
    page.getByRole("button", { name: "7 + 5 = 12", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(page.locator(".app-screen")).toHaveCount(0);
  await open(page, "健康");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/v0.8/health.png" });
  await page
    .locator(".health-floating-tabs button")
    .filter({ hasText: "瀏覽" })
    .click();
  await expect(
    page.getByRole("button", { name: "經期追蹤", exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(page.locator(".app-screen")).toHaveCount(0);
  await open(page, "天氣");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/v0.8/weather.png" });
  await page.getByRole("button", { name: "城市列表" }).click();
  await expect(page.getByText("暫無城市", { exact: true })).toBeVisible();
});

import { makeItem } from "../src/schema";
test("mobile long press supports free cell placement and drag-created folder", async ({
  browser,
}) => {
  const context = await browser.newContext({
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  try {
    await context.route("**/work.json", (r) => r.fulfill({ json: blank }));
    const page = await context.newPage();
    await unlock(page);
    const original = await page
        .locator('[data-home-key="photos"]')
        .boundingBox(),
      grid = await page.locator(".home-app-grid").first().boundingBox(),
      scale = grid!.width / 393;
    const touch = await context.newCDPSession(page);
    const x = original!.x + 25 * scale,
      y = original!.y + 25 * scale,
      tx = grid!.x + (16 + (361 / 4) * 2 + 35) * scale,
      ty = grid!.y + (99 * 3 + 30) * scale;
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await page.waitForTimeout(550);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: tx, y: ty }],
    });
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            JSON.parse(
              localStorage.getItem("foundphone-layout-v1:blank-phone") || "{}",
            ).positions?.photos,
        ),
      )
      .toEqual({ page: 0, x: 2, y: 3 });
    await page.getByRole("button", { name: "完成", exact: true }).click();
    await page.reload();
    await page.getByRole("button", { name: "輕觸解鎖" }).click();
    const moved = await page.locator('[data-home-key="photos"]').boundingBox();
    expect(moved!.y).toBeGreaterThan(original!.y + 200 * scale);
    await page.screenshot({ path: "outputs/v0.8/mobile-free-layout.png" });
    const a = await page.locator('[data-home-key="notes"]').boundingBox(),
      b = await page.locator('[data-home-key="settings"]').boundingBox();
    await page.mouse.move(a!.x + 25, a!.y + 25);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.move(b!.x + 25, b!.y + 25, { steps: 8 });
    await page.waitForTimeout(720);
    await page.mouse.up();
    await expect(
      page.getByRole("button", { name: "開啟資料夾資料夾" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
test("QQ chat and independent X/Weibo detail interactions preserve player state", async ({
  page,
}) => {
  const raw = JSON.parse(
    readFileSync(
      new URL("../stories/blank/story.json", import.meta.url),
      "utf8",
    ),
  );
  raw.installedApps.push("qq", "twitter", "weibo");
  const w = compileStory(raw).work;
  w.id = "social-visual-test";
  w.data.twitter = [
    makeItem({
      id: "x-detail-test",
      title: "測試動態",
      sender: "測試作者",
      body: "此內容僅用於介面回歸測試。",
      kind: "post",
      likes: 12,
      comments: ["測試用戶：測試評論"],
      meta: { handle: "@test", views: "120", reposts: "2" },
    }),
  ];
  w.data.weibo = [makeItem({ ...w.data.twitter[0], id: "wb-detail-test" })];
  w.data.qq = [
    makeItem({
      id: "qq-transfer-test",
      title: "測試聯絡人",
      sender: "測試聯絡人",
      body: "100",
      kind: "transfer",
      meta: { amount: "100.00", transferStatus: "已收款" },
    }),
    makeItem({
      id: "qq-message-test",
      title: "測試聯絡人",
      sender: "測試聯絡人",
      body: "引用訊息測試",
      meta: { replyTo: "qq-transfer-test" },
    }),
  ];
  await page.route("**/work.json", (route) => route.fulfill({ json: w }));
  await unlock(page);
  await open(page, "X");
  await page.locator(".kzxx").first().click();
  await expect(page.locator(".x-post-detail")).toBeVisible();
  await page.getByRole("button", { name: "喜歡帖子" }).click();
  await expect(page.getByRole("button", { name: "喜歡帖子" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("textbox", { name: "回復帖子" }).fill("測試回復");
  await page.getByRole("button", { name: "傳送回復" }).click();
  await expect(page.locator(".post-detail-comments")).toContainText("測試回復");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/v0.8/x-detail-fixture.png" });
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(page.locator(".app-screen")).toHaveCount(0);
  await open(page, "微博");
  await page.locator(".weibo-post .social-body").first().click();
  await expect(page.locator(".weibo-post-detail")).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/v0.8/weibo-detail-fixture.png" });
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(page.locator(".app-screen")).toHaveCount(0);
  await open(page, "QQ");
  await page.locator(".catalog-chat").first().click();
  await expect(page.locator(".qq-native-thread")).toBeVisible();
  await expect(page.locator(".qq-transfer-bubble")).toContainText("100.00");
  await expect(page.locator(".qq-message-quote")).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/v0.8/qq-chat-fixture.png" });
});
