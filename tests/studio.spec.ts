import { test, expect } from "@playwright/test";
import JSZip from "jszip";
import { readFile } from "node:fs/promises";
test("creator edits, saves, restores, exports and reimports", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "手機創作" })).toBeVisible();
  await expect(page.locator(".home-screen")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "outputs/v0.5/studio-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "手機設定", exact: true }).click();
  await page.getByLabel("機主名稱").fill("測試機主");
  await page.getByRole("button", { name: "選擇sand壁紙" }).click();
  await page.getByRole("button", { name: "儲存設定", exact: true }).click();
  await expect(page.getByText("測試機主 的 iPhone")).toBeVisible();
  await page.getByRole("button", { name: "已儲存到本機" }).click();
  await page.reload();
  await expect(page.getByText("測試機主 的 iPhone")).toBeVisible();
  await page.getByRole("button", { name: "批量導入聊天記錄" }).click();
  await page.getByRole("button", { name: "確認導入", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("2 條");
  await page.getByRole("button", { name: "關閉提示" }).click();
  await page.getByRole("button", { name: "素材與內容", exact: true }).click();
  await page.getByRole("button", { name: "新增內容", exact: true }).click();
  await page.getByLabel("會話名稱").fill("測試會話");
  await page.getByLabel("故事內容").fill("這是一條經過瀏覽器驗證的訊息");
  await page.getByRole("button", { name: "儲存內容", exact: true }).click();
  await expect(page.getByText("測試會話", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "導出作品", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: /完整 ZIP 備份/ }).click();
  const file = await downloaded;
  const zip = await JSZip.loadAsync(await readFile((await file.path())!));
  const w = JSON.parse(await zip.file("work.json")!.async("string"));
  expect(w.phone.owner).toBe("測試機主");
  expect(
    w.data.messages.some((i: { body: string }) =>
      i.body.includes("瀏覽器驗證"),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  await page.locator('input[accept=".json,.zip"]').setInputFiles({
    name: "roundtrip.zip",
    mimeType: "application/zip",
    buffer: await zip.generateAsync({ type: "nodebuffer" }),
  });
  await expect(page.getByRole("status")).toContainText("作品已導入");
  expect(errors).toEqual([]);
});
test("preview progresses through clues and an ending without editing draft", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "預覽", exact: true }).click();
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  const preview = page.locator(".preview-overlay");
  await preview
    .getByRole("button", { name: "開啟備忘錄", exact: true })
    .click();
  await preview.getByRole("button", { name: /如果我忘記了/ }).click();
  await expect(
    preview.getByRole("heading", { name: "你會如何選擇？" }),
  ).toBeVisible();
  await preview.getByRole("button", { name: "赴約 · 雨停了" }).click();
  await expect(
    page.getByRole("heading", { name: "故事在這裡停泊。" }),
  ).toBeVisible();
  await page.screenshot({
    path: "outputs/v0.2/player-ending.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "退出預覽" }).click();
  await expect(page.getByRole("heading", { name: "手機創作" })).toBeVisible();
});
test("static export contains player and can run from subdirectory", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "導出作品", exact: true }).click();
  const wait = page.waitForEvent("download");
  await page.getByRole("button", { name: /獨立玩家網頁/ }).click();
  const file = await wait;
  const zip = await JSZip.loadAsync(await readFile((await file.path())!));
  expect(zip.file("index.html")).not.toBeNull();
  expect(zip.file("work.json")).not.toBeNull();
  expect(await zip.file("player.js")!.async("string")).not.toContain(
    "從一部手機開始",
  );
  await page.route("**/exported/**", async (route) => {
    const name =
      new URL(route.request().url()).pathname.split("/exported/")[1] ||
      "index.html";
    const entry = zip.file(name);
    if (!entry) return route.fulfill({ status: 404 });
    await route.fulfill({
      body: await entry.async("nodebuffer"),
      contentType: name.endsWith(".html")
        ? "text/html"
        : name.endsWith(".js")
          ? "application/javascript"
          : name.endsWith(".css")
            ? "text/css"
            : name.endsWith(".json")
              ? "application/json"
              : "text/plain",
    });
  });
  await page.goto("http://127.0.0.1:4180/exported/index.html");
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await page.getByRole("button", { name: "開啟備忘錄", exact: true }).click();
  await page.getByRole("button", { name: /如果我忘記了/ }).click();
  await expect(
    page.getByRole("heading", { name: "你會如何選擇？" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(
    page.getByRole("heading", { name: "你會如何選擇？" }),
  ).toBeVisible();
});
test("mobile workspace stays within viewport and graph loads", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "手機創作" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await expect(page.locator(".home-screen")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "outputs/v0.2/studio-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "劇情編排", exact: true }).click();
  await expect(
    page.getByText("圖結構檢查通過", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "新增節點", exact: true }).click();
  await expect(page.getByLabel("名稱", { exact: true })).toHaveValue(
    "新的事件",
  );
});

test("all registered app templates open and expose editable saved content", async ({
  page,
}) => {
  test.setTimeout(90000);
  const { registry } = await import("../src/registry");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const phone = page.locator(".phone-stage .phone-shell");
  await page.getByRole("button", { name: "開啟 App 庫", exact: true }).click();
  for (const app of registry) {
    const b = page.getByRole("button", {
      name: `安裝${app.name}`,
      exact: true,
    });
    if (await b.count()) await b.click();
  }
  await page.getByRole("button", { name: "完成", exact: true }).click();
  for (const app of registry) {
    await phone.getByRole("button", { name: "搜尋", exact: true }).click();
    await phone.getByPlaceholder("App 名稱").fill(app.name);
    await phone.getByRole("button", { name: app.name, exact: true }).click();
    await expect(phone.locator(".app-nav strong")).toHaveText(app.name);
    await phone.getByRole("button", { name: "新增內容", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "儲存內容", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await phone.getByRole("button", { name: "返回桌面", exact: true }).click();
  }
  expect(errors).toEqual([]);
});

test("photo upload and structured note formatting survive save and reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "素材與內容", exact: true }).click();
  await page
    .getByRole("combobox", { name: "選擇內容 App" })
    .selectOption("photos");
  await page.getByRole("button", { name: "新增內容", exact: true }).click();
  await page.getByLabel("標題", { exact: true }).fill("上傳的線索照片");
  await page
    .getByRole("dialog")
    .locator("input[type=file]")
    .setInputFiles({
      name: "clue.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6QZ4AAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(page.getByRole("button", { name: "移除素材" })).toBeVisible();
  await page.getByRole("button", { name: "儲存內容", exact: true }).click();
  await page
    .getByRole("combobox", { name: "選擇內容 App" })
    .selectOption("notes");
  await page.getByRole("button", { name: "新增內容", exact: true }).click();
  await page.getByLabel("標題", { exact: true }).fill("加粗的約定");
  await page.locator(".tiptap").fill("請記住這個約定");
  await page.locator(".tiptap").selectText();
  await page.getByRole("button", { name: "粗體", exact: true }).click();
  await page.getByRole("button", { name: "儲存內容", exact: true }).click();
  await page.getByRole("button", { name: "已儲存到本機", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "素材與內容", exact: true }).click();
  await page
    .getByRole("combobox", { name: "選擇內容 App" })
    .selectOption("notes");
  await page.getByRole("button", { name: "加粗的約定", exact: true }).click();
  await expect(page.locator(".tiptap strong")).toContainText("請記住這個約定");
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  await page.getByRole("button", { name: "導出作品", exact: true }).click();
  const wait = page.waitForEvent("download");
  await page.getByRole("button", { name: /作品 JSON/ }).click();
  const file = await wait;
  const work = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(
    work.data.photos.find(
      (i: { title: string }) => i.title === "上傳的線索照片",
    ).media,
  ).toMatch(/^data:image\/webp;base64,/);
});

test("rejects invalid work versions and unsafe ZIP paths", async ({ page }) => {
  await page.goto("/");
  const input = page.locator('input[accept=".json,.zip"]');
  await input.setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ formatVersion: 999 })),
  });
  await expect(page.getByRole("status")).toContainText("formatVersion");
  await page.getByRole("button", { name: "關閉提示" }).click();
  const zip = new JSZip();
  zip.file("../work.json", "{}");
  await input.setInputFiles({
    name: "unsafe.zip",
    mimeType: "application/zip",
    buffer: await zip.generateAsync({ type: "nodebuffer" }),
  });
  await expect(page.getByRole("status")).toContainText("不安全路徑");
});
