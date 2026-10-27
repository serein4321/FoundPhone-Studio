import { describe, it, expect } from "vitest";
import { registry } from "./registry";
import { catalogSkins } from "./skins/catalog";
import { makeItem, validateWork } from "./schema";
import { createWork } from "./demo";
import { getFields } from "./fields";
describe("independent app coverage and authored attributes", () => {
  it("routes all 47 built-in app identities through dedicated screens", () => {
    const previous = [
      "wechat",
      "whatsapp",
      "instagram",
      "calculator",
      "settings", "appstore",
    ];
    expect(Object.keys(catalogSkins)).toHaveLength(44);
    for (const app of registry)
      expect(previous.includes(app.id) || app.id in catalogSkins).toBe(true);
  });
  it("defaults new metadata safely when reading legacy item records", () => {
    const w = JSON.parse(JSON.stringify(createWork()));
    for (const items of Object.values(w.data) as Record<string, unknown>[][])
      for (const i of items) { delete i.meta; delete i.avatar; }
    expect(validateWork(w).data.notes[0].meta).toEqual({});
    expect(validateWork(w).data.wechat[0].avatar).toBe("");
  });
  it("roundtrips authored amounts, status, server and position data", () => {
    const w = createWork();
    w.data.alipay = [
      makeItem({
        title: "書店收款",
        meta: { amount: "-38.00", status: "交易成功", merchant: "城南舊書店" },
      }),
    ];
    w.data.discord = [
      makeItem({ meta: { server: "夜班", status: "離線" }, folder: "線索" }),
    ];
    const copy = validateWork(JSON.parse(JSON.stringify(w)));
    expect(copy.data.alipay[0].meta.amount).toBe("-38.00");
    expect(copy.data.discord[0].meta.server).toBe("夜班");
    expect(getFields("alipay").some((f) => f.key === "amount")).toBe(true);
  });
  it("rejects non-string or oversized authored attribute values", () => {
    expect(() =>
      makeItem({ meta: { amount: 42 } as unknown as Record<string, string> }),
    ).toThrow();
    expect(() => makeItem({ meta: { url: "x".repeat(2001) } })).toThrow();
  });
});
