import { test, expect, type Page } from "@playwright/test";
import { createWork } from "../src/demo";
import { makeItem, type Work } from "../src/schema";
import { registry } from "../src/registry";
async function importFixture(page: Page, w: Work) {
  await page.goto("/");
  await page.locator('input[accept=".json,.zip"]').setInputFiles({
    name: "fixture.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(w)),
  });
  await expect(page.getByRole("status")).toContainText("作品已導入");
  await page.getByRole("button", { name: "關閉提示" }).click();
}
function fixture() {
  const w = createWork("App專項驗收");
  for (const a of w.apps) {
    a.installed = true;
    a.visible = true;
    a.folder = "";
  }
  w.mode = "mixed";
  w.nodes = [];
  for (const a of registry) {
    w.data[a.id] = [
      makeItem({
        id: `proof-${a.id}`,
        title: `${a.name}的線索`,
        body: `${a.name}內的作者內容，閱讀後獲得線索。`,
        sender: "林知夏",
        time: "2026-09-01 08:30",
        folder: a.id === "find" ? "設備" : a.tabs[0],
        kind: a.engine === "social" ? "post" : "text",
        meta: {
          amount: "-38.00",
          price: "38.00",
          status: "已完成",
          number: "FP0901",
          server: "夜班站",
          location: "城南",
          temperature: "24",
          condition: "多雲",
          value: "6280",
          unit: "步",
          url: "story.local/book",
        },
      }),
    ];
    w.nodes.push({
      id: `event-${a.id}`,
      label: `驗證${a.id}`,
      type: "event",
      event: "read",
      target: `proof-${a.id}`,
      conditions: [],
      logic: "and",
      actions: [{ type: "clue", key: a.id, value: true }],
      next: [],
      once: true,
      x: 0,
      y: 0,
    });
  }
  return w;
}
async function open(phone: ReturnType<Page["locator"]>, name: string) {
  await phone.getByRole("button", { name: "返回桌面", exact: true }).click();
  await phone.getByRole("button", { name: "搜尋", exact: true }).click();
  await phone.getByPlaceholder("App 名稱").fill(name);
  await phone.getByRole("button", { name, exact: true }).click();
}
test("all 47 app player screens read authored content and trigger independent clues", async ({
  page,
}) => {
  test.setTimeout(180000);
  const w = fixture();
  await importFixture(page, w);
  await page.getByRole("button", { name: "預覽", exact: true }).click();
  const phone = page.locator(".preview-overlay .phone-shell");
  await phone.getByRole("button", { name: "輕觸解鎖" }).click();
  const selectors: Record<string, string> = {
    phone: ".call-row",
    contacts: ".catalog-row",
    photos: ".photo-mosaic button",
    camera: ".camera-shutter",
    safari: ".safari-favorites button",
    notes: ".notes-list button",
    calendar: ".calendar-event",
    mail: ".mail-preview",
    clock: ".alarm-row>button:first-child",
    reminders: ".reminder-row>button:last-child",
    files: ".file-grid>div>button:first-child",
    music: ".music-track",
    maps: ".map-pin",
    weather: ".weather-forecast",
    wallet: ".wallet-stack>button",
    health: ".health-metric",
    find: ".find-sheet .catalog-row",
    calculator: ".calc-records button",
    settings: ".record-row",
    weibo: ".social-body",
    redbook: ".redbook-masonry>button",
    douyin: ".vertical-caption",
    bilibili: ".bili-grid>button",
    alipay: ".alipay-bill",
    taobao: ".taobao-products>button",
    netease: ".netease-track>button:first-child",
    delivery: ".delivery-merchant",
    forum: ".forum-topic",
    instagram: ".ig-post-media",
    tiktok: ".vertical-caption",
    twitter: ".social-body",
    discord: ".discord-message",
    youtube: ".youtube-thumb",
    snapchat: ".snap-caption",
    facebook: ".social-body",
    reddit: ".social-body",
    spotify: ".spotify-tracks>button",
    netflix: ".netflix-feature>div:last-child>button:first-of-type",
    pinterest: ".pinterest-pins>button",
    threads: ".social-body",
  };
  let count = 0;
  for (const a of registry) {
    await open(phone, a.name);
    if (
      [
        "notes",
        "photos",
        "mail",
        "calendar",
        "telegram",
        "discord",
        "redbook",
        "reddit",
        "spotify",
        "youtube",
        "bilibili",
        "douyin",
        "netflix",
        "alipay",
        "taobao",
        "delivery",
      ].includes(a.id)
    ) {
      await expect(phone.locator(".app-nav strong")).toHaveText(a.name);
      await expect(phone.locator(".app-screen")).toHaveCSS("opacity", "1");
      await phone.screenshot({ path: `outputs/v0.5/apps/${a.id}.png` });
    }
    if (["messages", "qq", "telegram", "line", "messenger"].includes(a.id)) {
      await phone.locator(".catalog-chat").first().click();
      await phone.locator(".catalog-message>button").first().click();
    } else if (a.id === "wechat") {
      await phone.locator(".wx-chat-row").first().click();
      await phone.locator(".skin-bubble").first().click();
    } else if (a.id === "whatsapp") {
      await phone.locator(".wa-chat-row").first().click();
      await phone.locator(".skin-bubble").first().click();
    } else await phone.locator(selectors[a.id]).first().click();
    count++;
    await expect(page.locator(".preview-overlay>header>span")).toContainText(
      `${count} 條線索`,
    );
    expect(
      await phone.locator(".phone-screen").evaluate((el) => el.scrollTop),
    ).toBe(0);
  }
  await page.getByRole("button", { name: "退出預覽" }).click();
});
test("system app folders, calendar days and stopwatch are interactive", async ({
  page,
}) => {
  const w = fixture();
  w.data.notes = [
    makeItem({
      id: "private-note",
      title: "私人約定",
      body: "保持分組",
      folder: "私人",
      kind: "note",
    }),
  ];
  w.data.calendar = [
    makeItem({
      title: "二號的約定",
      body: "在書店見面",
      time: "2026-09-02 16:30",
      meta: { location: "舊書店" },
    }),
  ];
  await importFixture(page, w);
  await page.getByRole("button", { name: "預覽", exact: true }).click();
  const phone = page.locator(".preview-overlay .phone-shell");
  await phone.getByRole("button", { name: "輕觸解鎖" }).click();
  await open(phone, "備忘錄");
  await phone
    .locator(".note-folders button")
    .filter({ hasText: "私人" })
    .click();
  await phone.locator(".notes-list button").click();
  await expect(phone.getByRole("heading", { name: "私人約定" })).toBeVisible();
  await phone.getByRole("button", { name: "返回", exact: true }).click();
  await expect(phone.locator(".native-notes h1")).toHaveText("私人");
  await open(phone, "相簿");
  await phone.getByRole("button", { name: "相簿", exact: true }).click();
  await phone.locator(".album-grid button").first().click();
  await expect(phone.locator(".photo-mosaic button")).toHaveCount(1);
  await open(phone, "日歷");
  await phone
    .locator(".calendar-grid button")
    .filter({ hasText: /^2$/ })
    .click();
  await expect(phone.locator(".calendar-event")).toContainText("二號的約定");
  await phone.getByRole("button", { name: "下個月" }).click();
  await expect(phone.locator(".month-title h2")).toContainText("10 月");
  await open(phone, "時鍾");
  await phone.getByRole("button", { name: "秒表", exact: true }).click();
  await phone.getByRole("button", { name: "開始", exact: true }).click();
  await expect(phone.locator(".stopwatch output")).not.toHaveText("00:00");
  await phone.getByRole("button", { name: "暫停", exact: true }).click();
  await phone.getByRole("button", { name: "復位", exact: true }).click();
  await expect(phone.locator(".stopwatch output")).toHaveText("00:00");
});
test("editable commerce metadata persists and renders in player details", async ({
  page,
}) => {
  const w = fixture();
  await importFixture(page, w);
  const phone = page.locator(".phone-stage .phone-shell");
  await open(phone, "支付寶");
  await phone.locator(".alipay-bill").click();
  await page.getByLabel("金額", { exact: true }).fill("-42.80");
  await page.getByLabel("交易狀態", { exact: true }).fill("交易成功");
  await page.getByLabel("交易單號", { exact: true }).fill("FP-20260901");
  await page.getByRole("button", { name: "儲存內容", exact: true }).click();
  await expect(phone.locator(".alipay-bill")).toContainText("-42.80");
  await page.getByRole("button", { name: "已儲存到本機", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "預覽", exact: true }).click();
  const preview = page.locator(".preview-overlay .phone-shell");
  await preview.getByRole("button", { name: "輕觸解鎖" }).click();
  await open(preview, "支付寶");
  await preview.locator(".alipay-bill").click();
  await expect(preview.locator(".item-metadata")).toContainText("FP-20260901");
  await expect(preview.locator(".item-metadata")).toContainText("交易成功");
  await page.screenshot({
    path: "outputs/v0.5/alipay-detail.png",
    fullPage: true,
  });
});
test("Discord servers, channels and members use authored groups", async ({
  page,
}) => {
  const w = fixture();
  w.data.discord = [
    makeItem({
      title: "站內訊息",
      body: "夜班集合",
      sender: "小林",
      folder: "集合",
      meta: { server: "夜班站", status: "在線" },
    }),
    makeItem({
      title: "另一條線索",
      body: "第二個頻道",
      sender: "阿青",
      folder: "線索",
      meta: { server: "夜班站", status: "離線" },
    }),
    makeItem({
      title: "第二個服務器",
      body: "只在燈塔出現",
      folder: "general",
      meta: { server: "燈塔" },
    }),
  ];
  await importFixture(page, w);
  const phone = page.locator(".phone-stage .phone-shell");
  await open(phone, "Discord");
  await phone.getByRole("button", { name: "服務器燈塔" }).click();
  await expect(phone.locator(".discord-message")).toContainText("只在燈塔出現");
  await phone.getByRole("button", { name: "服務器夜班站" }).click();
  await phone
    .locator(".discord-channel-tabs button")
    .filter({ hasText: "線索" })
    .click();
  await expect(phone.locator(".discord-message")).toContainText("第二個頻道");
  await phone.getByRole("button", { name: "成員", exact: true }).click();
  await expect(phone.locator(".discord-member")).toHaveCount(2);
  await page.screenshot({ path: "outputs/v0.5/discord.png", fullPage: true });
});

test("standalone player restores reminders, bookmarks and uploaded audio position", async ({
  page,
}) => {
  const w = fixture();
  w.mode = "explore";
  const pcm = Buffer.alloc(16044, 128);
  pcm.write("RIFF", 0);
  pcm.writeUInt32LE(16036, 4);
  pcm.write("WAVEfmt ", 8);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(8000, 24);
  pcm.writeUInt32LE(8000, 28);
  pcm.writeUInt16LE(1, 32);
  pcm.writeUInt16LE(8, 34);
  pcm.write("data", 36);
  pcm.writeUInt32LE(16000, 40);
  w.data.spotify = [
    makeItem({
      id: "uploaded-audio",
      title: "測試音樂",
      sender: "原創",
      kind: "audio",
      media: `data:audio/wav;base64,${pcm.toString("base64")}`,
    }),
  ];
  await page.route("**/player-runtime/work.json", (route) =>
    route.fulfill({ json: w }),
  );
  await page.goto("/player-runtime/player.html");
  const phone = page.locator(".phone-shell");
  await phone.getByRole("button", { name: "輕觸解鎖" }).click();
  await open(phone, "提醒事項");
  await phone.getByRole("checkbox", { name: "完成提醒事項的線索" }).click();
  await phone
    .locator(".reminder-categories>button")
    .filter({ hasText: "已完成" })
    .click();
  await expect(phone.locator(".reminder-row")).toHaveCount(1);
  await open(phone, "Netflix");
  await phone
    .locator(".netflix-feature button")
    .filter({ hasText: "我的片單" })
    .click();
  await phone
    .getByRole("button", { name: "我的片單", exact: true })
    .last()
    .click();
  await expect(phone.locator(".netflix-shelf>div>button")).toHaveCount(1);
  await open(phone, "Spotify");
  await phone.locator(".spotify-tracks>button").click();
  const audio = phone.getByLabel("播放測試音樂");
  await expect(audio).toBeVisible();
  await expect
    .poll(() => audio.evaluate((a: HTMLAudioElement) => a.duration))
    .toBe(2);
  await audio.evaluate(async (a: HTMLAudioElement) => {
    a.muted = true;
    await a.play();
    a.currentTime = 0.6;
    a.pause();
  });
  await expect
    .poll(() =>
      page.evaluate(async (id) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const r = indexedDB.open("foundphone-studio");
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
        return new Promise<number | undefined>((resolve) => {
          const r = db.transaction("saves").objectStore("saves").get(id);
          r.onsuccess = () => {
            resolve(r.result?.state.ui?.spotify?.["audio-uploaded-audio"]);
            db.close();
          };
        });
      }, w.id),
    )
    .toBeGreaterThan(0.4);
  await page.reload();
  await phone.getByRole("button", { name: "輕觸解鎖" }).click();
  await open(phone, "提醒事項");
  await phone
    .locator(".reminder-categories>button")
    .filter({ hasText: "已完成" })
    .click();
  await expect(phone.locator(".reminder-row")).toHaveCount(1);
  await open(phone, "Netflix");
  await phone
    .getByRole("button", { name: "我的片單", exact: true })
    .last()
    .click();
  await expect(phone.locator(".netflix-shelf>div>button")).toHaveCount(1);
  await open(phone, "Spotify");
  await expect(phone.getByLabel("播放測試音樂")).toBeVisible();
  await expect
    .poll(() =>
      phone
        .getByLabel("播放測試音樂")
        .evaluate((a: HTMLAudioElement) => a.currentTime),
    )
    .toBeGreaterThan(0.4);
});

test("scheduled call can be answered and ended through authored branches", async ({
  page,
}) => {
  const w = fixture();
  const base = {
    conditions: [],
    logic: "and" as const,
    next: [],
    once: true,
    x: 0,
    y: 0,
    target: "",
  };
  w.nodes = [
    {
      ...base,
      id: "wait",
      label: "來電等待",
      type: "delay",
      event: "start",
      delayMs: 2000,
      actions: [{ type: "call", key: "lin", value: "林知夏" }],
    },
    {
      ...base,
      id: "answer",
      label: "接聽分支",
      type: "event",
      event: "callAnswered",
      target: "lin",
      actions: [{ type: "clue", key: "answered", value: true }],
    },
    {
      ...base,
      id: "end",
      label: "掛斷分支",
      type: "event",
      event: "callEnded",
      target: "lin",
      actions: [{ type: "ending", key: "", value: "通話結束" }],
    },
  ];
  await importFixture(page, w);
  await page.getByRole("button", { name: "預覽", exact: true }).click();
  const phone = page.locator(".preview-overlay .phone-shell");
  await expect(phone.locator(".incoming-call-screen")).toBeVisible({
    timeout: 7000,
  });
  await phone.getByRole("button", { name: "接聽", exact: true }).click();
  await expect(phone.locator(".incoming-call-screen")).toContainText("林知夏");
  await phone.getByRole("button", { name: "掛斷", exact: true }).click();
  await expect(phone.locator(".incoming-call-screen")).toHaveCount(0);
  await phone.getByRole("button", { name: "輕觸解鎖" }).click();
  await expect(page.locator(".preview-overlay")).toContainText("通話結束");
});
