import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { compileStory } from "../src/story-engine/compiler";
import { defaultLayout } from "../src/launcher/layout";
async function open(page: Page, name: string) {
  await page
    .getByRole("button", { name: "開啟App Store", exact: true })
    .click();
  await page.getByPlaceholder("搜尋全部App").fill(name);
  await page
    .locator(".runtime-library-row")
    .filter({
      has: page.locator(".library-app-title strong", {
        hasText: new RegExp("^" + name + "$"),
      }),
    })
    .getByRole("button", { name: "開啟", exact: true })
    .click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
}
test("old preview folders migrate, WeChat and Douyin appear directly and store has functional categories", async ({
  page,
}) => {
  const w = compileStory(
    JSON.parse(readFileSync("stories/test-preview/story.json", "utf8")),
  ).work;
  const old = defaultLayout(w);
  old.previewLayoutRevision = 0;
  for (const id of ["wechat", "douyin"])
    old.apps.find((a) => a.id === id)!.folder = "國內";
  old.apps.find((a) => a.id === "instagram")!.folder = "國際";
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    { key: "foundphone-layout-v1:" + w.id, value: JSON.stringify(old) },
  );
  await page.goto("/?preview=test");
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(page.locator(".lock-screen")).toHaveCount(0);
  await expect(page.locator('[data-home-key="wechat"]')).toBeInViewport();
  await expect(page.locator('[data-home-key="douyin"]')).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "開啟資料夾國內", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "開啟資料夾國際", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "開啟App Store", exact: true })
    .click();
  for (const name of ["中國", "國內", "國際", "海外"])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await page.getByRole("button", { name: "通訊", exact: true }).click();
  await expect(page.locator(".runtime-library-row").first()).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(page.locator('[data-home-key="wechat"]')).toBeInViewport();
});
test("Weibo has no X action row while X retains its own navigation", async ({
  page,
}) => {
  await page.goto("/?preview=test");
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await open(page, "微博");
  await expect(page.locator(".weibo-actions button")).toHaveCount(3);
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/weibo-clean-feed.png" });
  await page.locator(".weibo-post .social-body").click();
  await expect(page.locator(".weibo-post-detail")).toBeVisible();
  await expect(
    page.locator(
      ".weibo-bottom-actions,.x-detail-bottom,.weibo-post-detail .post-detail-actions",
    ),
  ).toHaveCount(0);
  await expect(page.locator(".post-detail-reply")).toHaveCount(1);
  await page.getByRole("textbox", { name: "回復帖子" }).fill("測試評論");
  await page.getByRole("button", { name: "傳送回復", exact: true }).click();
  await expect(
    page.locator(".post-detail-comment").filter({ hasText: "測試評論" }),
  ).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/weibo-clean-detail.png" });
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await open(page, "X");
  await page.locator(".kzxx").first().click();
  await expect(page.locator(".x-detail-bottom button")).toHaveCount(5);
});
