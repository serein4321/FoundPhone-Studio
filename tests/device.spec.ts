import { test, expect } from "@playwright/test";
import { createWork } from "../src/demo";
async function setup(page: import("@playwright/test").Page) {
  const w = createWork("系統體驗驗收");
  w.phone.passcode = "1121";
  for (const id of [
    "wechat",
    "whatsapp",
    "telegram",
    "discord",
    "instagram",
    "camera",
  ]) {
    w.apps.find((a) => a.id === id)!.installed = true;
    w.apps.find((a) => a.id === id)!.visible = true;
  }
  w.phone.notifications = true;
  w.nodes = [
    {
      id: "device-notices",
      label: "通知回歸",
      type: "event",
      event: "start",
      target: "",
      conditions: [],
      logic: "and",
      actions: [
        { type: "notification", key: "", value: "微信：林知夏發來了一條訊息" },
        { type: "notification", key: "", value: "資訊：記得帶上那張車票" },
      ],
      next: [],
      once: true,
      x: 0,
      y: 0,
    },
  ];
  await page.goto("/");
  await page.locator('input[accept=".json,.zip"]').setInputFiles({
    name: "device.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(w)),
  });
  await expect(page.getByRole("status")).toContainText("作品已導入");
  await page.getByRole("button", { name: "關閉提示" }).click();
  await page.getByRole("button", { name: "預覽", exact: true }).click();
  return page.locator(".preview-overlay .phone-shell");
}
test("device lock, automatic passcode, native settings, controls and keyboard work together", async ({
  page,
}) => {
  const phone = await setup(page);
  await expect(phone.locator(".lock-clock-block")).toBeVisible();
  await expect(phone.locator(".pin-keypad")).toHaveCount(0);
  await phone.screenshot({ path: "outputs/v0.5/lock.png" });
  await phone.getByRole("button", { name: "輕觸解鎖" }).click();
  await phone.screenshot({ path: "outputs/v0.5/passcode.png" });
  for (const n of "0000")
    await phone
      .getByRole("button", { name: "密碼鍵" + n, exact: true })
      .click();
  await expect(phone.getByText("密碼不正確")).toBeVisible();
  for (const n of "1121")
    await phone
      .getByRole("button", { name: "密碼鍵" + n, exact: true })
      .click();
  await expect(phone.locator(".home-screen")).toBeVisible();
  await phone.screenshot({ path: "outputs/v0.5/home.png" });
  await phone.getByRole("button", { name: "開啟設定", exact: true }).click();
  await expect(phone.locator(".settings-account")).toBeVisible();
  await phone.screenshot({ path: "outputs/v0.5/settings.png" });
  await phone.getByRole("button", { name: "Wi-Fi", exact: false }).click();
  await expect(phone.locator(".settings-native-nav strong")).toHaveText(
    "Wi-Fi",
  );
  await phone
    .locator(".settings-native-nav")
    .getByRole("button", { name: "設定", exact: true })
    .click();
  await phone.getByRole("button", { name: "返回桌面" }).click();
  await phone.getByRole("button", { name: "控制中心", exact: true }).click();
  await expect(phone.locator(".device-control")).toHaveCSS("opacity", "1");
  await phone.screenshot({ path: "outputs/v0.5/control-center.png" });
  const wifi = phone.getByRole("button", { name: "Wi-Fi", exact: true });
  await expect(wifi).toHaveAttribute("aria-pressed", "true");
  await wifi.click();
  await expect(wifi).toHaveAttribute("aria-pressed", "false");
  await phone.getByRole("button", { name: "關閉控制中心" }).click();
  await phone.getByRole("button", { name: "開啟微信", exact: true }).click();
  await phone.screenshot({ path: "outputs/v0.5/wechat-list.png" });
  await phone.locator(".wx-chat-row").first().click();
  await phone.getByRole("button", { name: "輸入訊息", exact: true }).click();
  await expect(phone.getByRole("dialog", { name: "螢幕鍵盤" })).toBeVisible();
  await phone
    .getByRole("dialog")
    .getByRole("button", { name: "q", exact: true })
    .click();
  await expect(phone.getByRole("textbox", { name: "訊息草稿" })).toHaveValue(
    "q",
  );
  await phone.screenshot({ path: "outputs/v0.5/keyboard.png" });
  await phone.getByRole("button", { name: "收起鍵盤" }).click();
  await expect(phone.locator(".device-keyboard")).toHaveCount(0);
  await phone.screenshot({ path: "outputs/v0.5/wechat-chat.png" });
});
test("mobile device gestures and long press work at 390px without document overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const phone = await setup(page);
  const screen = phone.locator(".phone-screen");
  const box = (await screen.boundingBox())!;
  const scale = box.width / 393;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 1,
  });
  const swipe = async (x1: number, y1: number, x2: number, y2: number) => {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: x1, y: y1 }],
    });
    for (let i = 1; i <= 10; i++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: x1 + ((x2 - x1) * i) / 10, y: y1 + ((y2 - y1) * i) / 10 },
        ],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  };
  await swipe(
    box.x + 180 * scale,
    box.y + 750 * scale,
    box.x + 180 * scale,
    box.y + 400 * scale,
  );
  await expect(phone.locator(".device-passcode")).toBeVisible();
  for (const n of "1121")
    await phone
      .getByRole("button", { name: "密碼鍵" + n, exact: true })
      .click();
  await expect(phone.locator(".home-screen")).toBeVisible();
  await swipe(
    box.x + 330 * scale,
    box.y + 32 * scale,
    box.x + 330 * scale,
    box.y + 180 * scale,
  );
  await expect(phone.locator(".device-control")).toBeVisible();
  await phone.getByRole("button", { name: "關閉控制中心" }).click();
  const icon = phone.getByRole("button", { name: "開啟相簿", exact: true });
  await icon.hover();
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.up();
  await expect(phone.locator(".home-context-menu")).toBeVisible();
  await phone
    .locator(".home-context-menu")
    .getByRole("button", { name: "取消" })
    .click();
  await icon.click();
  await expect(phone.locator(".native-photos")).toBeVisible();
  await phone.screenshot({ path: "outputs/v0.5/photos-mobile.png" });
  const currentBox = (await screen.boundingBox())!;
  const currentScale = currentBox.width / 393;
  await page.mouse.move(
    currentBox.x + 195 * currentScale,
    currentBox.y + 830 * currentScale,
  );
  await page.mouse.down();
  await page.mouse.move(
    currentBox.x + 195 * currentScale,
    currentBox.y + 600 * currentScale,
    {
      steps: 10,
    },
  );
  await page.mouse.up();
  await expect(phone.locator(".home-screen")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "outputs/v0.5/mobile-workspace.png",
    fullPage: true,
  });
});

test("notification stack, authenticated camera return and recent apps preserve the lock boundary", async ({
  page,
}) => {
  const phone = await setup(page);
  await expect(phone.locator(".notice-stacked")).toBeVisible();
  await expect(phone.locator(".device-notice").first()).toHaveCSS(
    "opacity",
    "1",
  );
  await phone.screenshot({ path: "outputs/v0.5/lock-notifications.png" });
  await phone.getByRole("button", { name: "2 條通知", exact: true }).click();
  await expect(phone.locator(".device-notice")).toHaveCount(2);
  await phone.getByRole("button", { name: "相機", exact: true }).click();
  await expect(phone.locator(".native-camera")).toBeVisible();
  await phone.getByRole("button", { name: "返回桌面" }).click();
  await expect(phone.locator(".device-passcode")).toBeVisible();
  await expect(phone.locator(".home-screen")).toHaveCount(0);
  for (const n of "1121")
    await phone
      .getByRole("button", { name: "密碼鍵" + n, exact: true })
      .click();
  await phone.getByRole("button", { name: "通知中心", exact: true }).click();
  await expect(phone.locator(".device-notice")).toHaveCount(2);
  await phone.getByRole("button", { name: "清除通知" }).first().click();
  await expect(phone.locator(".device-notice")).toHaveCount(1);
  await phone.screenshot({ path: "outputs/v0.5/notifications.png" });
  await phone.getByRole("button", { name: "返回桌面" }).click();
  await phone.getByRole("button", { name: "開啟備忘錄", exact: true }).click();
  await expect(phone.locator(".native-notes")).toBeVisible();
  await expect(phone.locator(".app-screen")).toHaveCSS("opacity", "1");
  const box = (await phone.locator(".phone-screen").boundingBox())!;
  const scale = box.width / 393;
  await page.mouse.move(box.x + 190 * scale, box.y + 835 * scale);
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.move(box.x + 190 * scale, box.y + 610 * scale, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(phone.locator(".device-switcher")).toBeVisible();
  await phone.screenshot({ path: "outputs/v0.5/switcher.png" });
  await phone
    .locator(".device-switcher")
    .getByRole("button", { name: /備忘錄/ })
    .click();
  await expect(phone.locator(".native-notes")).toBeVisible();
  await expect(phone.locator(".device-switcher")).toHaveCount(0);
});
