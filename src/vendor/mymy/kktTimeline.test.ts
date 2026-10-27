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
