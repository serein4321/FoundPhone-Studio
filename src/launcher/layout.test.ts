import { describe, it, expect } from "vitest";
import blank from "../../stories/blank/story.json";
import { compileStory } from "../story-engine/compiler";
import {
  defaultLayout,
  ensureAppStore,
  validateLayout,
  packHome,
  homeEntries,
  moveHome,
} from "./layout";
const work = () => compileStory(blank).work;
describe("device layout", () => {
  it("keeps all 47 apps and only defaults installed", () => {
    const l = defaultLayout(work());
    expect(l.apps).toHaveLength(49);
    expect(l.apps.filter((a) => a.installed)).toHaveLength(7);
  });
  it("packs different widget sizes and pages without overlap", () => {
    const l = defaultLayout(work());
    l.apps.forEach((a) => {
      a.installed = true;
      a.visible = true;
      a.dock = false;
      a.folder = "";
    });
    l.widgets = [
      { id: "widget-calendar", type: "calendar", size: "medium" },
      { id: "widget-notes", type: "notes", size: "large" },
    ];
    l.order = l.widgets.map((w) => w.id);
    const pages = packHome(homeEntries(l));
    expect(pages.length).toBeGreaterThan(2);
    for (const page of pages) {
      const cells = new Set();
      for (const entry of page)
        for (let y = entry.y; y < entry.y + entry.h; y++)
          for (let x = entry.x; x < entry.x + entry.w; x++) {
            expect(x).toBeLessThan(4);
            expect(y).toBeLessThan(6);
            expect(cells.has(x + "," + y)).toBe(false);
            cells.add(x + "," + y);
          }
    }
  });
  it("reorders entries and round-trips typed install and widget states", () => {
    const w = work(),
      l = defaultLayout(w);
    l.widgets = [{ id: "widget-clock", type: "clock", size: "small" }];
    const before = homeEntries(l).map((e) => e.key);
    moveHome(l, before[0], before[1]);
    expect(homeEntries(l)[0].key).toBe(before[1]);
    expect(validateLayout(JSON.parse(JSON.stringify(l)), w)).toEqual(l);
  });
  it("rejects foreign work and unknown apps and overfilled Dock", () => {
    const w = work(),
      l = defaultLayout(w);
    l.workId = "wrong";
    expect(() => validateLayout(l, w)).toThrow();
    l.workId = w.id;
    l.apps[0].id = "arbitrary";
    expect(() => validateLayout(l, w)).toThrow();
    const t = defaultLayout(w);
    t.apps.slice(0, 5).forEach((a) => {
      a.installed = true;
      a.visible = true;
      a.dock = true;
    });
    expect(() => validateLayout(t, w)).toThrow("Dock");
  });
});
it("preserves free grid gaps and rejects colliding fixed placements", () => {
  const w = work(),
    l = defaultLayout(w);
  l.positions.photos = { page: 0, x: 2, y: 4 };
  const pages = packHome(homeEntries(l), l.positions);
  expect(pages[0].find((c) => c.entry.key === "photos")).toMatchObject({
    x: 2,
    y: 4,
  });
  l.positions.notes = { page: 0, x: 2, y: 4 };
  expect(() => validateLayout(l, w)).toThrow("位置衝突");
});

it("adds store to legacy work without changing author data or other app states", () => {
  const w = work();
  w.apps = w.apps.filter((a) => a.id !== "appstore");
  const before = JSON.stringify(w);
  const effective = ensureAppStore(w);
  expect(effective.apps).toHaveLength(w.apps.length + 1);
  expect(JSON.stringify(w)).toBe(before);
  expect(effective.apps.filter((a) => a.id !== "appstore")).toEqual(w.apps);
  expect(
    validateLayout(defaultLayout(w), w).apps.some((a) => a.id === "appstore"),
  ).toBe(true);
});

it("migrates preview folders once while preserving custom folders and widgets", async () => {
  const preview = await import("../../stories/test-preview/story.json");
  const w = compileStory(preview.default).work;
  const before = JSON.stringify(w);
  const old = defaultLayout(w);
  old.previewLayoutRevision = 0;
  old.apps.find((a) => a.id === "wechat")!.folder = "聊天";
  old.apps.find((a) => a.id === "douyin")!.folder = "國內";
  old.apps.find((a) => a.id === "instagram")!.folder = "國際";
  old.apps.find((a) => a.id === "clock")!.folder = "我的工具";
  old.widgets.push({ id: "widget-keep", type: "battery", size: "small" });
  const migrated = validateLayout(old, w);
  for (const id of ["wechat", "douyin", "instagram"])
    expect(migrated.apps.find((a) => a.id === id)!.folder).toBe("");
  expect(migrated.apps.find((a) => a.id === "clock")!.folder).toBe("我的工具");
  expect(migrated.widgets).toEqual(old.widgets);
  expect(JSON.stringify(w)).toBe(before);
  migrated.apps.find((a) => a.id === "wechat")!.folder = "作者新建資料夾";
  expect(
    validateLayout(migrated, w).apps.find((a) => a.id === "wechat")!.folder,
  ).toBe("作者新建資料夾");
});
