import { test, expect } from "@playwright/test";
import { createWork } from "../src/demo";
test("iOS18 canonical screen, native artwork and paged desktop stay aligned", async ({
  page,
}) => {
  const w = createWork("iOS 18 驗收");
  w.apps.forEach((a) => {
    a.installed = true;
    a.visible = true;
    a.folder = "";
    a.dock = false;
  });
  w.apps.find((a) => a.id === "phone")!.dock = true;
  w.apps.find((a) => a.id === "messages")!.dock = true;
  w.apps.find((a) => a.id === "safari")!.dock = true;
  await page.goto("/");
  await page.locator('input[accept=".json,.zip"]').setInputFiles({
    name: "ios18.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(w)),
  });
  await expect(page.getByRole("status")).toContainText("作品已導入");
  await page.getByRole("button", { name: "關閉提示" }).click();
  const phone = page.locator(".creator-layout .phone-shell");
  expect(
    await phone
      .locator(".phone-screen")
      .evaluate((e) => parseFloat(getComputedStyle(e).width)),
  ).toBeCloseTo(393, 1);
  expect(
    await phone
      .locator(".phone-screen")
      .evaluate((e) => parseFloat(getComputedStyle(e).height)),
  ).toBeCloseTo(852, 1);
  await expect(phone.locator(".home-app-grid")).toHaveCount(2);
  await expect(phone.locator(".dock .app-artwork")).toHaveCount(3);
  await expect(phone.locator(".home-app-grid .app-artwork")).toHaveCount(44);
  await expect(
    phone
      .locator(".home-app-grid")
      .first()
      .getByRole("button", { name: "開啟相簿" })
      .locator(".app-artwork"),
  ).toHaveCount(1);
  await expect(phone.locator(".home-pages")).toHaveJSProperty("scrollTop", 0);
  const metrics = await phone.locator(".phone-screen").evaluate((screen) => {
    const frame = screen.getBoundingClientRect(),
      scale = frame.width / 393;
    const rect = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: (r.x - frame.x) / scale,
        y: (r.y - frame.y) / scale,
        width: r.width / scale,
        height: r.height / scale,
      };
    };
    const icons = [
      ...screen.querySelectorAll(".home-app-grid:first-child .app-icon"),
    ];
    return {
      screen: { width: 393, height: 852 },
      status: rect(screen.querySelector(".status-bar")),
      island: rect(screen.querySelector(".dynamic-island")),
      dock: rect(screen.querySelector(".dock")),
      icons: icons.map(rect),
    };
  });
  expect(metrics.icons[0]!.width).toBeCloseTo(62, 0);
  expect(metrics.icons[4]!.y - metrics.icons[0]!.y).toBeCloseTo(99, 0);
  expect(metrics.icons.at(-1)!.y + metrics.icons.at(-1)!.height).toBeLessThan(
    metrics.dock!.y,
  );
  const { writeFile } = await import("node:fs/promises");
  await writeFile(
    "outputs/v0.5/layout-metrics.json",
    JSON.stringify(metrics, null, 2),
  );
  await phone.screenshot({ path: "outputs/v0.5/ios18-home.png" });
  await phone.getByRole("button", { name: "前往桌面第2頁" }).click();
  await expect(
    phone.getByRole("button", { name: "前往桌面第2頁" }),
  ).toHaveAttribute("aria-current", "page");
  const last = phone.locator(".home-app-grid").last();
  await expect(last.getByRole("button").last()).toBeInViewport();
  await last.getByRole("button").last().click();
  await expect(phone.locator(".app-screen")).toBeVisible();
  await page.getByRole("button", { name: "預覽", exact: true }).click();
  const player = page.locator(".preview-overlay .phone-shell");
  await expect(player.locator(".lock-screen")).toBeVisible();
  await player.screenshot({ path: "outputs/v0.5/ios18-lock.png" });
});

test("WeChat avatars survive export and player menu returns to its conversation", async ({
  page,
}) => {
  const w = createWork("頭像回歸");
  w.phone.passcode = "";
  const app = w.apps.find((a) => a.id === "wechat")!;
  app.installed = true;
  app.visible = true;
  const avatar =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7mQAAAAASUVORK5CYII=";
  w.data.wechat.forEach((i) => {
    i.avatar = avatar;
  });
  await page.goto("/");
  await page
    .locator('input[accept=".json,.zip"]')
    .setInputFiles({
      name: "avatars.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(w)),
    });
  await expect(page.getByRole("status")).toContainText("作品已導入");
  await page.getByRole("button", { name: "關閉提示" }).click();
  await page.getByRole("button", { name: "導出作品", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /作品 JSON/ }).click();
  const file = await download;
  const { readFile } = await import("node:fs/promises");
  const restored = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(restored.data.wechat[0].avatar).toBe(avatar);
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  await page.getByRole("button", { name: "預覽", exact: true }).click();
  const player = page.locator(".preview-overlay");
  await player.getByRole("button", { name: "輕觸解鎖" }).click();
  await player.getByRole("button", { name: "開啟微信", exact: true }).click();
  await expect(player.locator(".wx-chat-avatar img").first()).toHaveAttribute(
    "src",
    avatar,
  );
  await player.getByRole("button", { name: "微信選單" }).click();
  await player.getByRole("menuitem", { name: "新增朋友" }).click();
  await expect(player.locator(".wx-nav strong")).toHaveText("新增朋友");
  await player.getByRole("button", { name: "返回", exact: true }).click();
  await player.locator(".wx-chat-row").first().click();
  const title = await player.locator(".wx-nav strong").textContent();
  await player.getByRole("button", { name: "聊天詳情" }).click();
  await expect(player.locator(".wx-nav strong")).toHaveText("聊天資訊");
  await player.getByRole("button", { name: "返回", exact: true }).click();
  await expect(player.locator(".wx-nav strong")).toHaveText(title!);
  await expect(player.locator(".skin-messages")).toBeVisible();
  await player
    .locator(".phone-shell")
    .screenshot({ path: "outputs/v0.5/wechat-classic-chat.png" });
});
