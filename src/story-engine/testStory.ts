import { initialRuntime, type Work } from "../schema";
import { dispatch, advance, choose, visible } from "../engine";
import type { Story } from "./compiler";
export function testStory(story: Story, work: Work) {
  const errors: string[] = [];
  if (work.nodes.some((n) => n.type !== "comment") && !story.tests.length)
    errors.push("tests: 至少提供一個通關路徑");
  const reached = new Set<string>();
  for (const t of story.tests) {
    let state = dispatch(work, initialRuntime(work), "start");
    const unlocked = new Set<string>();
    for (const [i, step] of t.steps.entries()) {
      const at = `tests.${story.tests.indexOf(t)}.steps.${i}`;
      if (step.password !== undefined) {
        const item = Object.values(work.data)
          .flat()
          .find((x) => x.id === step.target);
        if (!item || item.password !== step.password) {
          errors.push(at + ": 密碼不正確");
          continue;
        }
        unlocked.add(item.id);
      }
      if (step.event === "read") {
        const item = Object.values(work.data)
          .flat()
          .find((x) => x.id === step.target);
        if (
          !item ||
          !visible(item, state) ||
          (item.password && !unlocked.has(item.id))
        ) {
          errors.push(at + ": 內容不可讀或未解密");
          continue;
        }
      }
      if (step.choose) {
        if (!state.choices.some((c) => c.target === step.choose))
          errors.push(at + ": 選項不可達");
        state = choose(work, state, step.choose);
      }
      if (step.advanceMs !== undefined)
        state = advance(work, state, step.advanceMs);
      if (step.event) state = dispatch(work, state, step.event, step.target);
    }
    if (!state.endings.includes(t.ending))
      errors.push(t.name + ": 未到達結局 " + t.ending);
    else reached.add(t.ending);
    for (const id of t.expectUnlocked)
      if (!state.unlocked.includes(id)) errors.push(t.name + ": 未解鎖 " + id);
  }
  for (const n of work.nodes.filter((n) => n.type === "ending")) {
    const ending = String(
      n.actions.find((a) => a.type === "ending")?.value || n.label,
    );
    if (!reached.has(ending))
      errors.push(
        "events." +
          work.nodes.indexOf(n) +
          ": 結局沒有可通過的測試路徑: " +
          ending,
      );
  }
  return errors;
}
