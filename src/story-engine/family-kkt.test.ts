import { expect, it } from "vitest";
import raw from "../../stories/template/story.json";
import { compileStory } from "./compiler";
import { initialRuntime } from "../schema";
import { dispatch } from "../engine";
it("only a saved reply in the family KKT triggers one mom call", () => {
  const { work } = compileStory(raw);
  let state = dispatch(work, initialRuntime(work), "start");
  const send = (thread: string, text: string) => {
    state = dispatch(work, { ...state, ui: { ...state.ui, kakao: {
      ...state.ui?.kakao, mymyKktSent: [JSON.stringify([thread, text, "09:38"])],
    } } }, "variable", "ui:kakao:mymyKktSent");
  };
  send("別的群", "你好");
  expect(state.incomingCall).toBeNull();
  send("一對恩愛夫夫和我（3）", "想吃麵");
  expect(state.incomingCall?.target).toBe("mom-video-call");
  expect(state.incomingCall?.caller).toBe("媽媽🐈");
  state = dispatch(work, { ...state, incomingCall: null }, "callDeclined", "mom-video-call");
  send("一對恩愛夫夫和我（3）", "再回一次");
  expect(state.incomingCall).toBeNull();
});
