import { describe, it, expect } from "vitest";
import example from "../../tests/fixtures/story-example/story.json";
import { compileStory } from "./compiler";
import { testStory } from "./testStory";
const copy = () => structuredClone(example);
describe("AI story compiler", () => {
  it("compiles stable IDs deterministically and preserves optional catalog", () => {
    const a = compileStory(copy()),
      b = compileStory(copy());
    expect(a.work).toEqual(b.work);
    expect(a.work.apps).toHaveLength(49);
    expect(a.work.apps.filter((a) => a.installed)).toHaveLength(13);
    expect(a.work.data.wechat[0].sender).toBe("小林");
  });
  it("both actual engine paths pass with password, hidden content and delayed call", () => {
    const { story, work } = compileStory(copy());
    expect(testStory(story, work)).toEqual([]);
  });
  it("rejects dangling node and content references", () => {
    const s = copy();
    s.events[0].next = ["missing"];
    expect(() => compileStory(s)).toThrow("不存在的節點");
    const t = copy();
    t.events[1].actions![0].key = "missing";
    expect(() => compileStory(t)).toThrow("不存在的內容");
  });
  it("rejects duplicate IDs and absent participants", () => {
    const s = copy();
    s.chats[0].messages[0].id = "wx-password";
    expect(() => compileStory(s)).toThrow("重復 ID");
    const t = copy();
    t.chats[0].participants.push("missing");
    expect(() => compileStory(t)).toThrow("聯絡人不存在");
  });
  it("does not allow a test to bypass hidden content or wrong passwords", () => {
    const { story, work } = compileStory(copy());
    story.tests[0].steps[2].password = "wrong";
    expect(testStory(story, work).join()).toContain("密碼不正確");
    story.tests[0].steps.unshift({ event: "read", target: "photo-hidden" });
    expect(testStory(story, work).join()).toContain("不可讀");
  });
  it("rejects runtime scripts, arbitrary HTML rich text and remote media", () => {
    const s = copy();
    Object.assign(s, { scripts: ["alert(1)"] });
    expect(() => compileStory(s)).toThrow();
    const t = copy();
    Object.assign(t.content.notes[0], {
      richText: "<script>alert(1)</script>",
    });
    expect(() => compileStory(t)).toThrow("不能導入 HTML");
    const v = copy();
    Object.assign(v.content.photos[0], { media: "javascript:alert(1)" });
    expect(() => compileStory(v)).toThrow("不允許腳本");
  });
  it("requires proof of every ending path", () => {
    const { story, work } = compileStory(copy());
    story.tests.pop();
    expect(testStory(story, work).join()).toContain("沒有可通過的測試路徑");
  });
});

it("blank default has no story and needs no ending test", () => {
  const { story, work } = compileStory({
    scriptVersion: 1,
    id: "blank-test",
    title: "撿手機",
    phone: { owner: "機主" },
  });
  expect(work.nodes).toEqual([]);
  expect(Object.values(work.data).flat()).toEqual([]);
  expect(work.mode).toBe("explore");
  expect(testStory(story, work)).toEqual([]);
});
