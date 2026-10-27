import { test, expect } from "@playwright/test";
async function ready(page: import("@playwright/test").Page) {
  await page.goto("/?preview=test");
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(page.locator(".lock-screen")).toHaveCount(0);
  await expect(page.locator(".interactive-home")).toHaveCSS("opacity", "1");
}
async function settled(page: import("@playwright/test").Page, n: number) {
  await expect(
    page.getByRole("button", { name: "前往桌面第" + n + "頁", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect
    .poll(() =>
      page
        .locator(".home-pages")
        .evaluate((el) => Math.round(el.scrollLeft / el.clientWidth)),
    )
    .toBe(n - 1);
  await expect(page.locator(".app-screen")).toHaveCount(0);
  await expect(page.locator(".interactive-home")).not.toHaveClass(
    /home-editing/,
  );
}
test("mouse dragging an app flips pages without opening or editing it", async ({
  page,
}) => {
  await ready(page);
  const icon = await page
    .locator(".home-app-grid")
    .first()
    .locator(".launcher-cell")
    .nth(3)
    .boundingBox();
  await page.mouse.move(icon!.x + 30, icon!.y + 25);
  await page.mouse.down();
  await page.mouse.move(icon!.x - 180, icon!.y + 25, { steps: 10 });
  await page.mouse.up();
  await settled(page, 2);
  const box = await page.locator(".home-pages").boundingBox();
  await page.mouse.move(box!.x + box!.width * 0.42, box!.y + box!.height - 15);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.9, box!.y + box!.height - 15, {
    steps: 10,
  });
  await page.mouse.up();
  await settled(page, 1);
  await expect(page.locator(".dock [data-home-key]")).toHaveCount(4);
});
test("touch swipe over app icons and empty desktop flips both directions", async ({
  browser,
}) => {
  const context = await browser.newContext({
    isMobile: true,
    hasTouch: true,
    viewport: { width: 393, height: 852 },
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/?preview=test");
    await page.getByRole("button", { name: "輕觸解鎖" }).click();
    await expect(page.locator(".lock-screen")).toHaveCount(0);
    await expect(page.locator(".interactive-home")).toHaveCSS("opacity", "1");
    const cdp = await context.newCDPSession(page);
    async function swipe(x: number, y: number, tx: number) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      for (let i = 1; i <= 8; i++) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x + ((tx - x) * i) / 8, y }],
        });
        await page.waitForTimeout(15);
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    }
    const icon = await page
      .locator(".home-app-grid")
      .first()
      .locator(".launcher-cell")
      .nth(3)
      .boundingBox();
    await swipe(icon!.x + 30, icon!.y + 25, icon!.x - 190);
    await settled(page, 2);
    const box = await page.locator(".home-pages").boundingBox();
    await swipe(
      box!.x + box!.width * 0.42,
      box!.y + box!.height - 15,
      box!.x + box!.width * 0.92,
    );
    await settled(page, 1);
    await page.screenshot({ path: "outputs/release/touch-home-swipe.png" });
  } finally {
    await context.close();
  }
});
