import { describe, expect, it } from "vitest";
import { makeItem } from "./schema";
import {
  HALLOWEEN_DAD,
  HALLOWEEN_MOM,
  halloweenCanStart,
  halloweenReplied,
  halloweenTimeline,
} from "./wechatHalloween";

const oldDadEnd = makeItem({
  id: "wx-dad-guinea-05-dad-one-pig",
  title: HALLOWEEN_DAD,
  sender: HALLOWEEN_DAD,
  body: "但是我們家養一隻小豬就夠了💪🏻",
});
const script = [
  ["mom-question", HALLOWEEN_MOM, "過幾天萬聖節你要和朋友出去玩嗎"],
  ["mom-film", HALLOWEEN_MOM, "我要來看之前找的一部恐怖電影啦"],
  ["mom-fear", HALLOWEEN_MOM, "但是我喊了阿翊陪我一起，我害怕餒"],
  ["mom-my-reaction", HALLOWEEN_MOM, "我怎麼不記得你怕這些東西😳"],
  ["mom-emojis", HALLOWEEN_MOM, "🫣🫣🫣"],
  ["dad-warning", HALLOWEEN_DAD, "萬聖節你要是出去玩記得要早點回來"],
  ["dad-my-question", HALLOWEEN_DAD, "你和我媽要看電影？"],
  ["dad-asked", HALLOWEEN_DAD, "你怎麼知道的，阿信告訴你了？"],
  ["dad-fear", HALLOWEEN_DAD, "因為我有點害怕那個，我就喊他陪我一起🤓"],
  ["dad-gift", HALLOWEEN_DAD, "不過我們給你準備好了禮物🤫"],
].map(([step, title, body]) =>
  makeItem({
    id: "wx-halloween-" + step,
    title,
    body,
    sender: title,
    meta: { halloweenStep: step },
  }),
);
const msg = (thread: string, body: string) =>
  JSON.stringify([thread, body, "2026-10-29 18:35"]);

describe("staged Halloween WeChat chapter", () => {
  it("stays locked until the existing video-chat and dad guinea-pig sequence are finished", () => {
    const dadReplies = [msg(HALLOWEEN_DAD, "第一句"), msg(HALLOWEEN_DAD, "第二句")];
    expect(halloweenCanStart(dadReplies, [oldDadEnd], false)).toBe(false);
    expect(halloweenCanStart(dadReplies.slice(0, 1), [oldDadEnd], true)).toBe(false);
    expect(halloweenCanStart(dadReplies, script, true)).toBe(false);
    expect(halloweenCanStart(dadReplies, [oldDadEnd, ...script], true)).toBe(true);
  });
  it("waits for the player's reply before showing Mom's movie and reaction", () => {
    expect(halloweenTimeline(script, [], HALLOWEEN_MOM, "我", true).map((i) => i.body))
      .toEqual(["過幾天萬聖節你要和朋友出去玩嗎"]);
    const messages = halloweenTimeline(script, [msg(HALLOWEEN_MOM, "我打算出去")], HALLOWEEN_MOM, "我", true);
    expect(messages.map((i) => i.body)).toEqual([
      "過幾天萬聖節你要和朋友出去玩嗎",
      "我打算出去",
      "我要來看之前找的一部恐怖電影啦",
      "但是我喊了阿翊陪我一起，我害怕餒",
      "我怎麼不記得你怕這些東西😳",
      "🫣🫣🫣",
    ]);
    expect(halloweenReplied([msg(HALLOWEEN_MOM, "我打算出去")], HALLOWEEN_MOM)).toBe(true);
  });
  it("only releases Dad's conversation after Mom, in two later user-reply stages", () => {
    expect(halloweenTimeline(script, [], HALLOWEEN_DAD, "我", true)).toEqual([]);
    const replies = [msg(HALLOWEEN_MOM, "出去"), msg(HALLOWEEN_DAD, "媽媽告訴我的"), msg(HALLOWEEN_DAD, "哈哈")];
    expect(halloweenTimeline(script, replies.slice(0, 1), HALLOWEEN_DAD, "我", true).map((i) => i.body))
      .toEqual(["萬聖節你要是出去玩記得要早點回來", "你和我媽要看電影？", "你怎麼知道的，阿信告訴你了？"]);
    expect(halloweenTimeline(script, replies.slice(0, 2), HALLOWEEN_DAD, "我", true).map((i) => i.body).at(-1))
      .toBe("因為我有點害怕那個，我就喊他陪我一起🤓");
    expect(halloweenTimeline(script, replies, HALLOWEEN_DAD, "我", true).map((i) => i.body).at(-1))
      .toBe("不過我們給你準備好了禮物🤫");
  });
});
