import { describe, it, expect } from "vitest";
import { createWork } from "./demo";
import {
  dispatch,
  choose,
  testCondition,
  visible,
  validateGraph,
} from "./engine";
import { initialRuntime, validateWork, safeMedia } from "./schema";
import { parseChat, parseCsv } from "./chat";
import { registry } from "./registry";
describe("story progression", () => {
  it("reveals clue, unlocks photo and reaches exactly one selected ending", () => {
    const w = createWork();
    const original = initialRuntime(w);
    const started = dispatch(w, original, "start");
    expect(started.notifications).toHaveLength(1);
    expect(visible(w.data.photos[0], started)).toBe(false);
    const read = dispatch(w, started, "read", "note-clue");
    expect(read.clues).toContain("ticket");
    expect(visible(w.data.photos[0], read)).toBe(true);
    expect(read.choices).toHaveLength(2);
    const result = choose(w, read, "good");
    expect(result.endings).toHaveLength(1);
    expect(result.endings[0]).toContain("雨停了");
    expect(original.clues).toEqual([]);
    expect(w.variables.found).toBe(false);
  });
  it("keeps pending choices during exploration and rejects unoffered choices", () => {
    const w = createWork();
    const s = dispatch(w, initialRuntime(w), "read", "note-clue");
    expect(dispatch(w, s, "openApp", "photos").choices).toHaveLength(2);
    expect(choose(w, s, "start")).toEqual(s);
  });
  it("prevents repeated effects and bounds cycles", () => {
    const w = createWork();
    w.nodes[0].next = ["start"];
    const s = dispatch(w, initialRuntime(w), "start");
    expect(s.notifications).toHaveLength(1);
    expect(dispatch(w, s, "start").notifications).toHaveLength(1);
    expect(validateGraph(w.nodes).some((e) => e.includes("自環"))).toBe(true);
  });
  it("supports typed AND/OR/NOT and scoped conditions", () => {
    const w = createWork(),
      s = initialRuntime(w);
    s.variables.score = 5;
    s.clues = ["ticket"];
    expect(testCondition({ key: "score", op: "gt", value: 4 }, s)).toBe(true);
    expect(
      testCondition({ key: "clue:ticket", op: "eq", value: true }, s),
    ).toBe(true);
    w.nodes[0].conditions = [{ key: "found", op: "eq", value: true }];
    expect(dispatch(w, s, "start").notifications).toHaveLength(0);
    w.nodes[0].logic = "not";
    expect(dispatch(w, s, "start").notifications).toHaveLength(1);
  });
  it("detects broken references and unreachable nodes", () => {
    const w = createWork();
    w.nodes.push({
      ...w.nodes[0],
      id: "orphan",
      type: "action",
      event: "",
      next: ["missing"],
    });
    expect(validateGraph(w.nodes).join()).toContain("missing");
    expect(validateGraph(w.nodes).join()).toContain("不可達");
  });
  it("free exploration bypasses story effects", () => {
    const w = createWork();
    w.mode = "explore";
    expect(dispatch(w, initialRuntime(w), "start").notifications).toEqual([]);
  });
  it("preserves save state through JSON roundtrip", () => {
    const w = createWork();
    const s = dispatch(w, initialRuntime(w), "read", "note-clue");
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});
describe("import and schema safety", () => {
  it("validates version and rejects invalid structures", () => {
    const w = createWork();
    expect(validateWork(w).formatVersion).toBe(1);
    expect(() => validateWork({ ...w, formatVersion: 2 })).toThrow();
    expect(() => validateWork({ ...w, phone: {} })).toThrow();
  });
  it("rejects executable and remote media", () => {
    expect(safeMedia("javascript:alert(1)")).toBe("");
    expect(safeMedia("data:image/svg+xml;base64,PHN2Zz4=")).toBe("");
    expect(safeMedia("https://example.com/image.png")).toBe("");
    expect(safeMedia("data:image/png;base64,YQ==")).not.toBe("");
  });
  it("parses script and explains invalid lines", () => {
    const r = parseChat(
      "[2026-09-01 08:30] 小林：你到學校了嗎？\n[2026-09-01 08:31] 我：快到了\ninvalid",
    );
    expect(r.items).toHaveLength(2);
    expect(r.items[1].outgoing).toBe(true);
    expect(r.errors[0]).toContain("第 3 行");
  });
  it("handles quoted CSV and multiline message fields", () => {
    const r = parseCsv(
      'time,sender,body\n09:41,小林,"你好,世界\n第二行"\n09:42,我,收到',
    );
    expect(r.errors).toEqual([]);
    expect(r.items).toHaveLength(2);
    expect(r.items[0].body).toBe("你好,世界\n第二行");
    expect(parseCsv("a,b,c\n1,2,3").errors).toHaveLength(1);
  });
  it("registers all 47 named apps with editable story data", () => {
    const w = createWork();
    expect(registry).toHaveLength(49);
    for (const a of registry) {
      expect(w.apps.some((x) => x.id === a.id)).toBe(true);
      expect(w.data[a.id].length).toBeGreaterThan(0);
      expect(a.tabs.length).toBeGreaterThan(0);
    }
  });
});
