import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { compileStory } from "../src/story-engine/compiler";
test.use({ hasTouch: true });
const fixture = JSON.parse(
  readFileSync(
    new URL("./fixtures/mymy-ui/story.json", import.meta.url),
    "utf8",
  ),
);
async function start(page: Page) {
  await page.route("**/work.json", (r) =>
    r.fulfill({ json: compileStory(fixture).work }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
}
async function open(page: Page, name: string) {
  await page.getByRole("button", { name: "開啟App Store", exact: true }).click();
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
async function home(page: Page) {
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(page.locator(".app-screen")).toHaveCount(0);
}
test("Mymy KKT read triggers call and cross-app authored Instagram unlock", async ({
  page,
}) => {
  await start(page);
  await open(page, "KakaoTalk");
  await expect(page.locator("[data-mymy=kakao]")).toBeVisible();
  await page.getByRole("button", { name: "好友", exact: true }).first().click();
  await page.locator(".kzkcr").click();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/mymy/kkt-chat.png" });
  await page
    .getByRole("button", { name: "點擊這條測試訊息觸發來電。", exact: true })
    .click();
  await expect(page.locator(".incoming-call-screen")).toBeVisible();
  await page.getByRole("button", { name: "接聽", exact: false }).click();
  await page.getByRole("button", { name: "掛斷", exact: false }).click();
  await home(page);
  await open(page, "Instagram");
  await expect(
    page.getByText("掛斷後出現的測試動態。", { exact: false }),
  ).toBeVisible();
});
test("Mymy Instagram comments, likes, profile, stories and X interaction persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await open(page, "Instagram");
  await page.getByRole("button", { name: "點贊測試帖子", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "點贊測試帖子", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "評論測試帖子", exact: true }).click();
  await page.getByRole("textbox", { name: "新增評論" }).fill("本地測試回復");
  await page.getByRole("button", { name: "發布", exact: true }).click();
  await expect(
    page.locator(".mymy-comments p").filter({ hasText: "本地測試回復" }),
  ).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/mymy/instagram-comments.png" });
  await page.getByRole("button", { name: "關閉評論面板" }).click();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/mymy/instagram-feed.png" });
  await page.locator(".st").first().click();
  await expect(page.locator(".mymy-story")).toBeVisible();
  await page.getByRole("button", { name: "關閉快拍" }).click();
  await page.getByRole("button", { name: "個人首頁", exact: true }).click();
  await expect(page.locator(".pg2")).toBeVisible();
  await home(page);
  await open(page, "X");
  await page.getByRole("button", { name: "點贊測試帖子", exact: true }).click();
  await page.getByRole("button", { name: "轉發測試帖子", exact: true }).click();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/mymy/x-feed.png" });
  await page.locator(".kzxx").click();
  await expect(page.locator(".x-post-detail")).toBeVisible();
  await expect(page.getByRole("button", { name: "喜歡帖子" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await home(page);
  await page.reload();
  await page.getByRole("button", { name: "輕觸解鎖" }).click();
  await open(page, "Instagram");
  await page.getByRole("button", { name: "首頁", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "點贊測試帖子", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});
test("mobile Mymy KKT layout and touch controls", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await start(page);
  await open(page, "KakaoTalk");
  await page.locator(".kzkcr").click();
  await expect(page.locator(".kzbub")).toHaveCount(2);
  const bounds = await page.locator(".kzinp").boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(393);
  await page
    .getByRole("textbox", { name: "KKT訊息", exact: true })
    .fill("本地傳送測試");
  await page.getByRole("button", { name: "傳送KKT訊息" }).click();
  await expect(
    page.getByRole("button", { name: "本地傳送測試", exact: true }),
  ).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/mymy/mobile-kkt.png" });
});

const familyStory = JSON.parse(
  readFileSync(new URL("../stories/template/story.json", import.meta.url), "utf8"),
);
for (const answer of [true, false]) {
  test("family KKT reply triggers mom video: " + (answer ? "answer" : "decline"), async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.route("**/work.json", (r) =>
      r.fulfill({ json: compileStory(familyStory).work }),
    );
    await page.goto("/");
    await expect(page.locator(".lock-screen")).toBeVisible();
    expect(await page.locator(".phone-screen").evaluate((el, src) =>
      (el as HTMLElement).style.backgroundImage.includes(src), familyStory.phone.wallpaper)).toBe(true);
    await page.getByRole("button", { name: "輕觸解鎖" }).click();
    for (const n of "0329") await page.getByRole("button", { name: "密碼鍵" + n, exact: true }).click();
    expect(await page.locator(".phone-screen").evaluate((el, src) =>
      (el as HTMLElement).style.backgroundImage.includes(src), familyStory.phone.homeWallpaper)).toBe(true);
    await page.locator(".phone-screen").screenshot({ path: "outputs/mymy/family-home-wallpaper-" + answer + ".png" });
    await open(page, "KakaoTalk");
    await page.locator(".kzkcr").filter({ hasText: "一對恩愛夫夫和我（3）" }).click();
    await expect(page.locator(".chat-time")).toContainText("10月26日");
    await expect(page.locator(".kzt").first()).toHaveText("09:30");
    await expect(page.locator(".kzt").nth(1)).toHaveText("09:37");
    await expect(page.locator(".kzbub")).toHaveCount(2);
    await expect(page.locator(".incoming-call-screen")).toHaveCount(0);
    const send = page.getByRole("button", { name: "傳送KKT訊息" });
    await expect(send).toBeDisabled();
    await page.getByRole("textbox", { name: "KKT訊息", exact: true }).fill("   ");
    await expect(send).toBeDisabled();
    const reply = answer ? "想吃牛肉麵，我在這裡！" : "<script>不是程式，只是回覆</script>";
    await page.getByRole("textbox", { name: "KKT訊息", exact: true }).fill(reply);
    await send.click();
    const call = page.locator(".incoming-call-screen");
    await expect(call).toBeVisible();
    await expect(call.locator("h2")).toHaveText("媽媽🐈");
    await expect(call).toContainText("KKT 視訊通話");
    await page.locator(".phone-screen").screenshot({ path: "outputs/mymy/family-kkt-" + answer + ".png" });
    if (answer) {
      await call.getByRole("button", { name: "接聽", exact: false }).click();
      await expect(call).toContainText("視訊通話已接通");
      await call.getByRole("button", { name: "掛斷", exact: false }).click();
    } else {
      await call.getByRole("button", { name: "拒接", exact: false }).click();
    }
    await expect(call).toHaveCount(0);
    await expect(page.locator(".kzbub").last()).toHaveText(reply);
  });
}

