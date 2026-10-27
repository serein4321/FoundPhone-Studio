import { describe, it, expect } from "vitest";
import { createWork, createEmptyWork } from "./demo";
import { validateWork } from "./schema";
import {
  essentialApps,
  installApp,
  removeFromHome,
  uninstallApp,
  moveApp,
  newCustomApp,
} from "./apps";
describe("optional app lifecycle", () => {
  it("starts newly authored projects without seeded optional content or story", () => {
    const w = createEmptyWork();
    expect(w.nodes).toEqual([]);
    expect(Object.keys(w.data).sort()).toEqual([...essentialApps].sort());
    expect(Object.values(w.data).every((items) => items.length === 0)).toBe(
      true,
    );
  });
  it("installs only six necessary system apps in new works", () => {
    const w = createWork();
    expect(
      w.apps
        .filter((a) => a.installed)
        .map((a) => a.id)
        .sort(),
    ).toEqual([...essentialApps].sort());
    expect(w.apps).toHaveLength(49);
  });
  it("upgrades old format v1 app records without uninstalling existing apps", () => {
    const old = createWork();
    const raw = JSON.parse(JSON.stringify(old));
    for (const a of raw.apps) delete a.installed;
    expect(validateWork(raw).apps.every((a) => a.installed)).toBe(true);
  });
  it("distinguishes home removal from uninstall and keeps content on request", () => {
    const w = createWork();
    installApp(w, "wechat");
    const data = structuredClone(w.data.wechat);
    removeFromHome(w, "wechat");
    expect(w.apps.find((a) => a.id === "wechat")).toMatchObject({
      installed: true,
      visible: false,
    });
    expect(w.data.wechat).toEqual(data);
    uninstallApp(w, "wechat", true);
    expect(w.apps.find((a) => a.id === "wechat")?.installed).toBe(false);
    installApp(w, "wechat");
    expect(w.apps.find((a) => a.id === "wechat")).toMatchObject({
      installed: true,
      visible: true,
    });
    expect(w.data.wechat).toEqual(data);
  });
  it("deletes app data only when selected and reinstall starts empty", () => {
    const w = createWork();
    installApp(w, "instagram");
    uninstallApp(w, "instagram", false);
    expect(w.data.instagram).toBeUndefined();
    installApp(w, "instagram");
    expect(w.data.instagram).toEqual([]);
  });
  it("preserves icon, name, folders, order and install state on roundtrip", () => {
    const w = createWork();
    installApp(w, "wechat");
    const a = w.apps.find((a) => a.id === "wechat")!;
    a.name = "私人訊息";
    a.icon = "信";
    a.folder = "社交";
    moveApp(w, "wechat", "phone");
    uninstallApp(w, "whatsapp", true);
    const copy = validateWork(JSON.parse(JSON.stringify(w)));
    expect(copy).toEqual(w);
    expect(copy.apps[0].id).toBe("wechat");
    expect(copy.apps.find((a) => a.id === "whatsapp")?.installed).toBe(false);
  });
  it("retains custom app identity across uninstall and reinstall", () => {
    const w = createWork();
    const id = newCustomApp(w, "調查");
    uninstallApp(w, id, true);
    installApp(w, id);
    expect(w.apps.find((a) => a.id === id)?.name).toBe("調查");
  });
});
