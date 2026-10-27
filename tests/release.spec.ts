import { test, expect } from "@playwright/test";
test("full catalog preview preserves four dock apps and updated status bar", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/test-work.json")).json();
  const preview = await (await request.get("/test-work.json")).json();
  expect(work.id).toBe("ui-test-phone-v2");
  expect(work.apps).toEqual(preview.apps);
  expect(work.data).toEqual(preview.data);
  expect(
    work.apps.filter((a: { installed: boolean }) => a.installed),
  ).toHaveLength(49);
  expect(work.nodes).toHaveLength(0);
  expect(
    work.apps.filter(
      (a: { installed: boolean; dock: boolean }) => a.installed && a.dock,
    ),
  ).toHaveLength(4);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/?preview=test");
  await page.getByRole("button", { name: "輕觸解鎖" }).waitFor();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/lock.png" });
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(page.locator(".lock-screen")).toHaveCount(0);
  await expect(page.locator(".interactive-home")).toHaveCSS("opacity", "1");
  await expect(page.locator(".dock [data-home-key]")).toHaveCount(4);
  await expect(page.locator(".status-silent")).toBeVisible();
  await expect(page.locator(".status-cellular")).toBeVisible();
  await expect(page.locator(".status-wifi")).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/home.png" });
  await page
    .locator(".status-bar")
    .screenshot({ path: "outputs/release/status-bar.png" });
  await page
    .getByRole("button", { name: "開啟App Store", exact: true })
    .click();
  await page.getByPlaceholder("搜尋全部App").fill("X");
  const x = page
    .locator(".runtime-library-row")
    .filter({
      has: page.locator(".library-app-title strong", { hasText: /^X$/ }),
    });
  await expect(x.locator("[data-original-icon=twitter] img")).toHaveAttribute(
    "src",
    /twitter\.svg$/,
  );
  await x.getByRole("button", { name: "開啟", exact: true }).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await page
    .getByRole("button", { name: "開啟App Store", exact: true })
    .click();
  await page.getByPlaceholder("搜尋全部App").fill("設定");
  await page
    .locator(".runtime-library-row")
    .getByRole("button", { name: "開啟", exact: true })
    .click();
  await expect(page.getByRole("switch", { name: "飛行模式" })).toBeVisible();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/settings.png" });
  await page.reload();
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(page.locator(".dock [data-home-key]")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("published family story keeps authored password, wallpapers and live Taiwan clock", async ({ request }) => {
  const work = await (await request.get("/work.json")).json();
  expect(work.id).toBe("shiyi-family-phone");
  expect(work.phone.passcode).toBe("0329");
  expect(work.phone.clockMode).toBe("real");
  expect(work.phone.wallpaper.startsWith("data:image/")).toBe(true);
  expect(work.phone.homeWallpaper.startsWith("data:image/")).toBe(true);
  expect(work.phone.homeWallpaper).not.toBe(work.phone.wallpaper);
  expect(work.data.kakao.some((m: { title: string }) => m.title === "這是全天下最完美的陣容（5）")).toBe(true);
});
