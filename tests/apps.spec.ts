import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { Work } from "../src/schema";
async function snapshot(page: Page): Promise<Work> {
  await page.getByRole("button", { name: "導出作品", exact: true }).click();
  const wait = page.waitForEvent("download");
  await page.getByRole("button", { name: /作品 JSON/ }).click();
  const file = await wait;
  const w = JSON.parse(await readFile((await file.path())!, "utf8"));
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  return w;
}
async function library(page: Page) {
  await page.getByRole("button", { name: "開啟 App 庫", exact: true }).click();
}
test("library distinguishes home removal, uninstall and reinstall after reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("撿手機 · FoundPhone Studio");
  expect(
    (await (await page.request.get("/manifest.webmanifest")).json()).short_name,
  ).toBe("撿手機");
  await library(page);
  await expect(page.getByText("6 個已安裝 · 拖動手柄排序")).toBeVisible();
  await page.getByLabel("App 分類").selectOption("中國");
  await page.getByLabel("搜尋 App", { exact: true }).fill("微信");
  await page.getByRole("button", { name: "安裝微信", exact: true }).click();
  await page
    .getByRole("button", { name: "從桌面移除微信", exact: true })
    .click();
  await page.getByRole("button", { name: "完成", exact: true }).click();
  const phone = page.locator(".phone-stage .phone-shell");
  await expect(
    phone.getByRole("button", { name: "開啟微信", exact: true }),
  ).toHaveCount(0);
  await phone.getByRole("button", { name: "搜尋", exact: true }).click();
  await phone.getByPlaceholder("App 名稱").fill("微信");
  await phone.getByRole("button", { name: "微信", exact: true }).click();
  await expect(phone.locator(".wx-nav strong")).toHaveText("微信");
  await phone.getByRole("button", { name: "返回桌面" }).click();
  await page.getByRole("button", { name: "已儲存到本機", exact: true }).click();
  await page.reload();
  let w = await snapshot(page);
  expect(w.apps.find((a) => a.id === "wechat")).toMatchObject({
    installed: true,
    visible: false,
  });
  await library(page);
  await page.getByLabel("搜尋 App", { exact: true }).fill("微信");
  await page.getByRole("button", { name: "卸載微信", exact: true }).click();
  await page.getByRole("button", { name: "確認卸載並保留資料" }).click();
  await page.getByRole("button", { name: "完成", exact: true }).click();
  w = await snapshot(page);
  expect(w.apps.find((a) => a.id === "wechat")?.installed).toBe(false);
  expect(w.data.wechat).toHaveLength(3);
  await library(page);
  await page.getByLabel("搜尋 App", { exact: true }).fill("微信");
  await page.getByRole("button", { name: "安裝微信", exact: true }).click();
  await expect(page.getByText("3 條創作內容")).toBeVisible();
  await page.getByRole("button", { name: "卸載微信", exact: true }).click();
  await page.getByLabel("保留創作資料，重新安裝後恢復").uncheck();
  await page.getByRole("button", { name: "確認卸載並刪除資料" }).click();
  await page.getByRole("button", { name: "安裝微信", exact: true }).click();
  await expect(page.getByText("0 條創作內容")).toBeVisible();
  await page.getByRole("button", { name: "完成", exact: true }).click();
  w = await snapshot(page);
  expect(w.data.wechat).toEqual([]);
});
test("folders, custom names, icons and drag order persist and export", async ({
  page,
}) => {
  await page.goto("/");
  await library(page);
  await page.getByRole("button", { name: "安裝微信", exact: true }).click();
  await page.getByLabel("自定義 App 名稱", { exact: true }).fill("旅人訊息");
  await page.getByLabel("自定義圖標文字").fill("旅");
  await page.getByLabel("安裝篩選").selectOption("已安裝");
  const grip = page.getByRole("button", { name: "拖動旅人訊息排序" }),
    target = page.locator('.app-library [data-app-id="phone"]');
  await grip.dragTo(target);
  await page.getByRole("button", { name: "創建資料夾", exact: true }).click();
  await page.getByRole("textbox", { name: "資料夾名稱" }).fill("通訊");
  await page.getByRole("checkbox", { name: "旅人訊息", exact: true }).check();
  await page.getByRole("checkbox", { name: "資訊", exact: true }).check();
  await page.getByRole("button", { name: "儲存資料夾" }).click();
  await page.screenshot({
    path: "outputs/v0.5/app-library.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await expect(
    page
      .locator(".phone-shell")
      .getByRole("button", { name: "通訊", exact: true }),
  ).toBeVisible();
  let w = await snapshot(page);
  expect(w.apps[0].id).toBe("wechat");
  expect(w.apps.find((a) => a.id === "wechat")).toMatchObject({
    name: "旅人訊息",
    icon: "旅",
    folder: "通訊",
    installed: true,
    visible: true,
    dock: false,
  });
  await page.getByRole("button", { name: "已儲存到本機" }).click();
  await page.reload();
  w = await snapshot(page);
  expect(w.apps[0].id).toBe("wechat");
  expect(w.apps.find((a) => a.id === "wechat")?.folder).toBe("通訊");
});
test("WeChat, WhatsApp and Instagram have distinct navigation and content interactions", async ({
  page,
}) => {
  await page.goto("/");
  await library(page);
  for (const name of ["微信", "WhatsApp", "Instagram"])
    await page
      .getByRole("button", { name: `安裝${name}`, exact: true })
      .click();
  await page.getByRole("button", { name: "完成", exact: true }).click();
  const phone = page.locator(".phone-stage .phone-shell");
  await phone.getByRole("button", { name: "開啟微信", exact: true }).click();
  await phone.getByRole("button", { name: "通訊錄", exact: true }).click();
  await expect(phone.locator(".wx-contact")).not.toHaveCount(0);
  await phone.getByRole("button", { name: "發現", exact: true }).click();
  await phone.getByRole("button", { name: /朋友圈/ }).click();
  await expect(phone.locator(".wx-moments")).toBeVisible();
  await page.screenshot({ path: "outputs/v0.5/wechat.png", fullPage: true });
  await phone.getByRole("button", { name: "返回桌面" }).click();
  await phone
    .getByRole("button", { name: "開啟WhatsApp", exact: true })
    .click();
  await expect(phone.locator(".wa-filters")).toBeVisible();
  await phone.getByRole("button", { name: "通話", exact: true }).click();
  await expect(phone.locator(".wa-large-title")).toHaveText("通話");
  await phone.getByRole("button", { name: "聊天", exact: true }).click();
  await phone.locator(".wa-chat-row").first().click();
  await expect(phone.locator(".wa-thread-profile")).toBeVisible();
  await expect(phone.locator(".app-screen")).toHaveCSS("opacity", "1");
  expect(
    await phone.locator(".phone-screen").evaluate((el) => el.scrollTop),
  ).toBe(0);
  await page.screenshot({ path: "outputs/v0.5/whatsapp.png", fullPage: true });
  await phone.getByRole("button", { name: "返回桌面" }).click();
  await phone
    .getByRole("button", { name: "開啟Instagram", exact: true })
    .click();
  await expect(phone.locator(".ig-stories")).toBeVisible();
  await phone
    .getByRole("button", { name: "Instagram 搜尋", exact: true })
    .click();
  await expect(phone.locator(".ig-explore")).toBeVisible();
  await phone
    .getByRole("button", { name: "Instagram 個人首頁", exact: true })
    .click();
  await expect(phone.locator(".ig-profile")).toBeVisible();
  await expect(phone.locator(".app-screen")).toHaveCSS("opacity", "1");
  expect(
    await phone.locator(".phone-screen").evaluate((el) => el.scrollTop),
  ).toBe(0);
  await page.screenshot({ path: "outputs/v0.5/instagram.png", fullPage: true });
  await phone
    .getByRole("button", { name: "Instagram 私信", exact: true })
    .click();
  await expect(phone.getByText("暫無私信")).toBeVisible();
});

test("player respects hidden installed apps and uninstall state without changing the draft", async ({
  page,
}) => {
  await page.goto("/");
  await library(page);
  await page.getByRole("button", { name: "安裝微信", exact: true }).click();
  await page
    .getByRole("button", { name: "從桌面移除微信", exact: true })
    .click();
  await page.getByRole("button", { name: "完成", exact: true }).click();
  const before = await snapshot(page);
  await page.getByRole("button", { name: "預覽", exact: true }).click();
  const preview = page.locator(".preview-overlay");
  await preview.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(
    preview.getByRole("button", { name: "開啟微信", exact: true }),
  ).toHaveCount(0);
  await preview.getByRole("button", { name: "搜尋", exact: true }).click();
  await preview.getByPlaceholder("App 名稱").fill("Instagram");
  await expect(preview.locator(".search-result")).toHaveCount(0);
  await preview.getByPlaceholder("App 名稱").fill("微信");
  await preview.getByRole("button", { name: "微信", exact: true }).click();
  await expect(preview.locator(".wx-nav strong")).toHaveText("微信");
  await page.getByRole("button", { name: "退出預覽" }).click();
  expect((await snapshot(page)).apps).toEqual(before.apps);
  await page.locator('input[accept=".json,.zip"]').setInputFiles({
    name: "installed.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(before)),
  });
  await expect(page.getByRole("status")).toContainText("作品已導入");
  const restored = await snapshot(page);
  expect(restored.apps).toEqual(before.apps);
});

test("new works start empty with six apps and the lock keypad unlocks them", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "新建作品", exact: true }).click();
  await page.getByRole("button", { name: "手機設定", exact: true }).click();
  await page.getByLabel("鎖屏密碼", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "儲存設定", exact: true }).click();
  const w = await snapshot(page);
  expect(w.title).toBe("未命名作品");
  expect(w.apps.filter((a) => a.installed)).toHaveLength(6);
  expect(w.nodes).toEqual([]);
  expect(Object.values(w.data).flat()).toEqual([]);
  await page.getByRole("button", { name: "預覽", exact: true }).click();
  const preview = page.locator(".preview-overlay");
  await preview.getByRole("button", { name: "輕觸解鎖" }).click();
  for (const key of ["1", "2", "3", "4"])
    await preview
      .getByRole("button", { name: `密碼鍵${key}`, exact: true })
      .click();

  await expect(
    preview.getByRole("button", { name: "開啟備忘錄", exact: true }),
  ).toBeVisible();
});
