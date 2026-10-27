import { create } from "zustand";
import { createWork, createEmptyWork } from "./demo";
import { uid, validateWork, type Work } from "./schema";
import { db } from "./persistence";
export { db } from "./persistence";
type Store = {
  works: Work[];
  work: Work | null;
  status: string;
  past: Work[];
  future: Work[];
  error: string;
  load: () => Promise<void>;
  select: (id: string) => void;
  change: (fn: (w: Work) => void) => void;
  add: (w?: Work) => Promise<void>;
  remove: (id: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
  flush: () => Promise<void>;
};
let timer: ReturnType<typeof setTimeout>;
let pending: Work | undefined;
let saving: Promise<void> = Promise.resolve();
export const useStudio = create<Store>((set, get) => ({
  works: [],
  work: null,
  status: "正在載入",
  past: [],
  future: [],
  error: "",
  load: async () => {
    try {
      let works = (await db.works.orderBy("updatedAt").reverse().toArray()).map(
        validateWork,
      );
      if (!works.length) {
        const w = createWork();
        await db.works.put(w);
        works = [w];
      }
      set({ works, work: works[0], status: "已儲存到本機" });
    } catch (e) {
      set({ error: String(e), status: "儲存不可用" });
    }
  },
  select: (id) => {
    void get().flush();
    const work = get().works.find((w) => w.id === id);
    if (work) set({ work, past: [], future: [] });
  },
  change: (fn) => {
    const old = get().work;
    if (!old) return;
    const w = structuredClone(old);
    fn(w);
    w.updatedAt = Date.now();
    pending = w;
    set({
      work: w,
      works: get().works.map((x) => (x.id === w.id ? w : x)),
      past: [...get().past.slice(-29), old],
      future: [],
      status: "儲存中…",
    });
    clearTimeout(timer);
    timer = setTimeout(() => {
      void get().flush();
    }, 450);
  },
  flush: async () => {
    clearTimeout(timer);
    const w = pending;
    pending = undefined;
    if (!w) return saving;
    saving = saving
      .catch(() => {})
      .then(async () => {
        try {
          await db.works.put(w);
          if (!pending) set({ status: "已儲存到本機", error: "" });
        } catch (e) {
          pending = w;
          set({ status: "儲存失敗 · 點擊重試", error: String(e) });
        }
      });
    return saving;
  },
  add: async (input) => {
    await get().flush();
    const w = input
      ? { ...structuredClone(input), id: uid(), updatedAt: Date.now() }
      : createEmptyWork();
    await db.works.put(w);
    set({ works: [w, ...get().works], work: w, past: [], future: [] });
  },
  remove: async (id) => {
    await get().flush();
    await db.works.delete(id);
    await db.saves.delete(id);
    const works = get().works.filter((w) => w.id !== id);
    if (!works.length) {
      await get().add();
      set((s) => ({ works: s.works.filter((w) => w.id !== id) }));
    } else set({ works, work: works[0], past: [], future: [] });
  },
  undo: () => {
    const { past, work, future } = get();
    if (!past.length || !work) return;
    const w = past[past.length - 1];
    pending = w;
    set({
      work: w,
      works: get().works.map((x) => (x.id === w.id ? w : x)),
      past: past.slice(0, -1),
      future: [work, ...future],
      status: "儲存中…",
    });
    void get().flush();
  },
  redo: () => {
    const { future, work, past } = get();
    if (!future.length || !work) return;
    const w = future[0];
    pending = w;
    set({
      work: w,
      works: get().works.map((x) => (x.id === w.id ? w : x)),
      future: future.slice(1),
      past: [...past, work],
      status: "儲存中…",
    });
    void get().flush();
  },
}));
