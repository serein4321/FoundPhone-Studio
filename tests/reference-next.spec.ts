import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { compileStory } from "../src/story-engine/compiler";
const blank = JSON.parse(
  readFileSync(new URL("../stories/blank/story.json", import.meta.url), "utf8"),
);
async function enter(page: Page) {
  const story = structuredClone(blank);
  story.id = "reference-social-ui";
  story.installedApps.push("threads", "twitter");
  story.content.threads = [
    {
      id: "thread-feed",
      title: "測試串文",
      body: "這是一條用於布局校準的測試串文。",
      sender: "測試用戶",
      likes: 2,
    },
    {
      id: "thread-dm",
      title: "測試會話",
      body: "這是一條測試訊息。",
      sender: "測試聯絡人",
      folder: "私信",
    },
    {
      id: "thread-activity",
      title: "測試動態",
      body: "這是一條測試回復動態。",
      sender: "測試用戶",
      meta: { activityType: "reply" },
    },
  ];
  story.content.twitter = [
    {
      id: "x-reference",
      title: "測試帖子",
      body: "這是一條用於深色介面校準的測試帖子。",
      sender: "測試用戶",
      comments: ["這是一條測試回復。"],
    },
  ];
  await page.route("**/work.json", (r) =>
    r.fulfill({ json: compileStory(story).work }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
}
async function open(page: Page, name: string) {
  await page
    .getByRole("button", { name: "開啟App Store", exact: true })
    .click();
  await page.getByPlaceholder("搜尋全部App").fill(name);
  await page
    .locator(".runtime-library-row")
    .getByRole("button", { name: "開啟", exact: true })
    .click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
}
test("home has no permanent toolbar, long press edits, App Store installs apps", async ({
  page,
}) => {
  await enter(page);
  await expect(
    page.getByRole("button", { name: "編輯桌面", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "開啟App庫", exact: true }),
  ).toHaveCount(0);
  const home = page.locator(".interactive-home");
  const box = await home.boundingBox();
  await page.mouse.move(box!.x + 200, box!.y + 740);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "新增小組件", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/reference-next/home.png" });
  await page
    .getByRole("button", { name: "開啟App Store", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "搜尋", exact: true }),
  ).toBeVisible();
  await page.getByPlaceholder("搜尋全部App").fill("抖音");
  await page.getByRole("button", { name: "獲取", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "開啟", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".interactive-home")).toHaveCSS("opacity", "1");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/reference-next/app-store.png" });
});
test("Threads reference messages activity menu and composer persist local posts", async ({
  page,
}) => {
  await enter(page);
  await open(page, "Threads");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/reference-next/threads-feed.png" });
  await page.getByRole("button", { name: "Threads訊息", exact: true }).click();
  await expect(page.locator(".tr-message")).toContainText("測試訊息");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/reference-next/threads-messages.png" });
  await page.getByRole("button", { name: "Threads動態", exact: true }).click();
  await expect(page.locator(".tr-activity")).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/reference-next/threads-activity.png" });
  await page.getByRole("button", { name: "Threads首頁", exact: true }).click();
  await page.getByRole("button", { name: "開啟Threads選單" }).click();
  await expect(page.locator(".tr-side")).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/reference-next/threads-menu.png" });
  await page.getByRole("button", { name: "關閉Threads選單" }).click();
  await page.getByRole("button", { name: "新建串文", exact: true }).click();
  await page.getByRole("textbox", { name: "串文內容" }).fill("本地串文測試");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/reference-next/threads-compose.png" });
  await page.getByRole("button", { name: "發布", exact: true }).click();
  await expect(page.locator(".tr-scroll")).toContainText("本地串文測試");
  await page.reload();
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await open(page, "Threads");
  await expect(page.locator(".tr-scroll")).toContainText("本地串文測試");
});
test("X reference dark feed and detail with optional light appearance", async ({
  page,
}) => {
  await enter(page);
  await open(page, "X");
  await expect(page.locator(".mymy-x")).toHaveClass(/x-reference-dark/);
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/reference-next/x-dark-feed.png" });
  await page.getByRole("button", { name: "切換X外觀" }).click();
  await expect(page.locator(".mymy-x")).not.toHaveClass(/x-reference-dark/);
  await page.getByRole("button", { name: "切換X外觀" }).click();
  await page.locator(".kzxx").click();
  await expect(page.locator(".x-post-detail")).toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/reference-next/x-dark-detail.png" });
});
