import { expect, it } from "vitest";
import { taiwanClock } from "./useDeviceClock";
it("follows Taiwan midnight and minute rollover independently of story time", () => {
  expect(taiwanClock(new Date("2026-10-26T15:59:59Z"))).toEqual({ date: "2026-10-26", time: "23:59" });
  expect(taiwanClock(new Date("2026-10-26T16:00:01Z"))).toEqual({ date: "2026-10-27", time: "00:00" });
});
