import { expect, it } from "vitest";
import { kktTimeline } from "./Apps";
import { makeItem } from "../../schema";
const items = [0, 1, 2].map((n) => makeItem({ id: "stage-" + n, title: "群組", body: "階段" + n, meta: { afterReplies: String(n) } }));
it("reveals stages only after replies in that group and preserves conversation order", () => {
  const reply = (text: string) => JSON.stringify(["群組", text, "10:00"]);
  expect(kktTimeline(items, [], "群組", "我").map((m) => m.id)).toEqual(["stage-0"]);
  expect(kktTimeline(items, [JSON.stringify(["別群", "你好", "10:00"])], "群組", "我")).toHaveLength(1);
  expect(kktTimeline(items, [reply("一")], "群組", "我").map((m) => m.body)).toEqual(["階段0", "一", "階段1"]);
  expect(kktTimeline(items, [reply("一"), reply("二")], "群組", "我").map((m) => m.body)).toEqual(["階段0", "一", "階段1", "二", "階段2"]);
  expect(kktTimeline(items, ["bad", reply("一"), reply("二")], "群組", "我")).toHaveLength(5);
});
it("holds post-call stages until the call has ended", () => {
  const callItems = [
    makeItem({ id: "call-stage-0", title: "群組", body: "原本訊息" }),
    makeItem({
      id: "call-stage-1",
      title: "群組",
      body: "通話後訊息",
      meta: { afterReplies: "1", afterCall: "true" },
    }),
  ];
  const reply = JSON.stringify(["群組", "我回來了", "10:00"]);
  expect(
    kktTimeline(callItems, [reply], "群組", "我", false, Number.POSITIVE_INFINITY, true).map(
      (m) => m.body,
    ),
  ).toEqual(["原本訊息", "我回來了"]);
  expect(
    kktTimeline(callItems, [reply], "群組", "我", false, Number.POSITIVE_INFINITY, false).map(
      (m) => m.body,
    ),
  ).toEqual(["原本訊息", "我回來了", "通話後訊息"]);
});

it("orders the rose-20 Dad notice, automatic reply, and Dad's follow-up in sequence", () => {
  const scene = [
    makeItem({
      id: "rose20-notice",
      title: "爸爸🐈‍⬛",
      body: "你看了那个花絮喔，不要亏你妈妈啦",
      meta: { afterReplies: "0", rose20Order: "dad-notice" },
    }),
    makeItem({
      id: "rose20-dad-reply",
      title: "爸爸🐈‍⬛",
      body: "但是他17岁的时候就遇到我了😎",
      meta: { afterReplies: "0", rose20Order: "dad-replies" },
    }),
  ];
  const autoReply = JSON.stringify(["爸爸🐈‍⬛", "拜托我都还没说什么呢", "10:00"]);
  expect(
    kktTimeline(scene, [autoReply], "爸爸🐈‍⬛", "我", false, Number.POSITIVE_INFINITY, false, 0)
      .map((item) => item.body),
  ).toEqual([
    "你看了那个花絮喔，不要亏你妈妈啦",
    "拜托我都还没说什么呢",
    "但是他17岁的时候就遇到我了😎",
  ]);
});
it("places the Mom notice after the player's group reply and the later replies after the next message", () => {
  const scene = [
    makeItem({ id: "rose20-mom", title: "群組", body: "🫣你干嘛…干嘛", meta: { rose20Order: "mom-notice" } }),
    makeItem({ id: "rose20-masha", title: "群組", body: "玛莎叔叔", meta: { rose20Order: "mom-notice" } }),
    makeItem({ id: "rose20-stone", title: "群組", body: "把我们学弟又忘记了呀", meta: { rose20Order: "group-after-masha-reply" } }),
    makeItem({ id: "rose20-dad", title: "群組", body: "你们今天这又是要怎样……", meta: { rose20Order: "group-after-masha-reply" } }),
  ];
  const sent = [
    JSON.stringify(["群組", "20岁，我还没遇到你爸呢", "10:00"]),
    JSON.stringify(["群組", "好啦那你们继续", "10:01"]),
  ];
  expect(
    kktTimeline(scene, sent, "群組", "我", false, Number.POSITIVE_INFINITY, false, -1, 1)
      .map((item) => item.body),
  ).toEqual([
    "20岁，我还没遇到你爸呢",
    "🫣你干嘛…干嘛",
    "玛莎叔叔",
    "好啦那你们继续",
    "把我们学弟又忘记了呀",
    "你们今天这又是要怎样……",
  ]);
});
