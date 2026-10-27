import { describe, it, expect } from "vitest";
import { createWork } from "./demo";
import { initialRuntime, type StoryNode } from "./schema";
import { advance, dispatch } from "./engine";
function node(p: Partial<StoryNode>): StoryNode {
  return {
    id: "node",
    label: "節點",
    type: "action",
    event: "",
    target: "",
    conditions: [],
    logic: "and",
    actions: [],
    next: [],
    once: true,
    x: 0,
    y: 0,
    ...p,
  };
}
describe("deterministic scheduled story execution", () => {
  it("runs delay actions only after their due virtual time", () => {
    const w = createWork();
    w.nodes = [
      node({
        id: "wait",
        type: "delay",
        event: "start",
        delayMs: 2000,
        actions: [{ type: "clue", key: "late", value: true }],
        next: ["end"],
      }),
      node({ id: "end", type: "ending", label: "遲來的訊息" }),
    ];
    const s = dispatch(w, initialRuntime(w), "start");
    expect(s.clues).toEqual([]);
    expect(s.scheduled).toEqual([{ nodeId: "wait", due: 2000 }]);
    const early = advance(w, s, 1999);
    expect(early.endings).toEqual([]);
    const done = advance(w, early, 1);
    expect(done.clues).toEqual(["late"]);
    expect(done.endings).toEqual(["遲來的訊息"]);
    expect(advance(w, done, 3000).clues).toHaveLength(1);
  });
  it("restores pending events through save JSON and handles chained due times", () => {
    const w = createWork();
    w.nodes = [
      node({
        id: "one",
        type: "delay",
        event: "start",
        delayMs: 1000,
        next: ["two"],
      }),
      node({
        id: "two",
        type: "delay",
        delayMs: 2000,
        actions: [{ type: "notification", key: "", value: "到了" }],
      }),
    ];
    const state = JSON.parse(
      JSON.stringify(dispatch(w, initialRuntime(w), "start")),
    );
    const result = advance(w, state, 3000);
    expect(result.notifications).toEqual(["到了"]);
    expect(result.scheduled).toEqual([]);
  });
  it("reacts to variable changes and clock-minute events without arbitrary code", () => {
    const w = createWork();
    w.nodes = [
      node({
        id: "start",
        event: "start",
        actions: [{ type: "variable", key: "found", value: true }],
      }),
      node({
        id: "variable",
        event: "variable",
        target: "found",
        actions: [{ type: "clue", key: "variable", value: true }],
      }),
      node({
        id: "clock",
        event: "time",
        target: "09:42",
        actions: [{ type: "clue", key: "clock", value: true }],
      }),
    ];
    const s = dispatch(w, initialRuntime(w), "start");
    expect(s.clues).toEqual(["variable"]);
    const done = advance(w, s, 60000);
    expect(done.time).toBe("09:42");
    expect(done.clues).toEqual(["variable", "clock"]);
  });
  it("records incoming calls and runs author answer/end branches separately", () => {
    const w = createWork();
    w.nodes = [
      node({
        id: "call",
        event: "start",
        actions: [{ type: "call", key: "lin", value: "小林" }],
      }),
      node({
        id: "answer",
        event: "callAnswered",
        target: "lin",
        actions: [{ type: "variable", key: "answered", value: true }],
      }),
    ];
    const s = dispatch(w, initialRuntime(w), "start");
    expect(s.incomingCall).toEqual({
      caller: "小林",
      target: "lin",
      status: "ringing",
    });
    const answer = dispatch(
      w,
      { ...s, incomingCall: { ...s.incomingCall!, status: "answered" } },
      "callAnswered",
      "lin",
    );
    expect(answer.variables.answered).toBe(true);
    expect(w.variables).toEqual({ found: false });
  });
  it("bounds zero-delay cycles, rejects invalid delta, and preserves UI state", () => {
    const w = createWork();
    w.nodes = [
      node({
        id: "a",
        type: "delay",
        event: "start",
        delayMs: 0,
        once: false,
        next: ["b"],
      }),
      node({ id: "b", type: "delay", delayMs: 0, once: false, next: ["a"] }),
    ];
    const s = dispatch(w, initialRuntime(w), "start");
    s.ui = { reminders: { checked: ["a"] } };
    const result = advance(w, s, Number.NaN);
    expect(result.trace.length).toBeLessThanOrEqual(100);
    expect(result.completed.length).toBeLessThanOrEqual(2);
    expect(result.ui).toEqual(s.ui);
  });
});

it("keeps time action and delay order identical across tick sizes", () => {
  const w = createWork();
  w.nodes = [
    node({
      id: "delay",
      type: "delay",
      event: "start",
      delayMs: 30000,
      actions: [{ type: "time", key: "", value: "12:00" }],
    }),
    node({
      id: "clock",
      event: "time",
      target: "12:01",
      actions: [{ type: "time", key: "", value: "15:00" }],
    }),
  ];
  const start = dispatch(w, initialRuntime(w), "start");
  const bulk = advance(w, start, 150000);
  let split = start;
  for (let i = 0; i < 150; i++) split = advance(w, split, 1000);
  expect(bulk).toEqual(split);
  expect(bulk.time).toBe("15:01");
});
