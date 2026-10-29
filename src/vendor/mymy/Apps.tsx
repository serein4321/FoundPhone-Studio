/* React/data adapters for dudwo5/Mymy UI templates: kt/ktn/KHD/bub,
 * igHome/igProfile/igDM/igSheet, xHome. See NOTICE.txt for permission.
 * Author content, DOM globals, timers and media dependencies are excluded. */
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Settings,
  Users,
  MessageCircle,
  MoreHorizontal,
  Heart,
  Home,
  Grid,
  Send,
  Bookmark,
  Repeat2,
  BarChart2,
  Share,
  User,
  Bell,
  X,
  Smile,
  Menu,
  Compass,
} from "lucide-react";
import type { SkinProps } from "../../AppSkins";
import { Avatar, Media } from "../../skins/shared";
import { useSkinState } from "../../skinState";
import { makeItem, type Item } from "../../schema";
import "./ui.css";
import "./adapter.css";
function grouped(items: Item[]) {
  return [...new Set(items.map((i) => i.title))].map((title) => ({
    title,
    items: items.filter((i) => i.title === title),
  }));
}
export function messageRun(items: Item[], index: number) {
  const m = items[index],
    previous = items[index - 1],
    next = items[index + 1];
  return {
    first:
      !previous ||
      previous.outgoing !== m.outgoing ||
      previous.sender !== m.sender,
    last: !next || next.outgoing !== m.outgoing || next.sender !== m.sender,
  };
}
const read = (p: SkinProps, i: Item) =>
  p.creator || i.password ? p.onItem(i) : p.onRead(i.id);

const ROSE20_GROUP_TITLE = "這是全天下最完美的陣容（6）";
const ROSE20_DAD_TITLE = "爸爸🐈‍⬛";
const ROSE20_TRIGGER = "20岁，我还没遇到你爸呢";
const ROSE20_AUTO_REPLY = "拜托我都还没说什么呢";
const ROSE20_DAD_NOTICE = "你看了那个花絮喔，不要亏你妈妈啦";
const ROSE20_MOM_NOTICE = "🫣你干嘛…干嘛";
function parseKktSent(raw: string): [string, string, string] | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      Array.isArray(value) &&
      value.length === 3 &&
      typeof value[0] === "string" &&
      typeof value[1] === "string" &&
      typeof value[2] === "string"
    ) return [value[0], value[1], value[2]];
  } catch { /* Ignore malformed saved replies. */ }
  return null;
}
function normalizeRose20Trigger(value: string) {
  return value.trim()
    .replace(/[，,。.!！?？]/g, "")
    .replaceAll(" ", "")
    .replaceAll("　", "")
    .replace(/[歲]/g, "岁")
    .replace(/[還]/g, "还")
    .replace(/[沒]/g, "没");
}
function Blank() {
  return <p className="mymy-empty">暫無內容</p>;
}
function Back({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="返回" onClick={onClick}>
      <ArrowLeft size={22} />
    </button>
  );
}
function stageVisible(items: Item[], thread: string, stage: number, count: number, id: string) {
  if (!Number.isFinite(count)) return true;
  const stageItems = items.filter((m) => m.title === thread && Number(m.meta.afterReplies || 0) === stage);
  return stageItems.slice(0, count).some((m) => m.id === id);
}
export function kktTimeline(
  items: Item[],
  sent: string[],
  thread: string,
  owner: string,
  creator = false,
  visibleStageCount = Number.POSITIVE_INFINITY,
  callActive = false,
  rose20DadAutoReplyIndex = -1,
  rose20GroupRepliesAtNotice = -1,
) {
  const replies: Item[] = [];
  for (const raw of sent) {
    const entry = parseKktSent(raw);
    if (!entry || entry[0] !== thread) continue;
    replies.push(makeItem({
      id: "local-kkt-" + replies.length,
      title: thread,
      body: entry[1],
      time: entry[2],
      sender: owner,
      outgoing: true,
      meta: { local: "true" },
    }));
  }
  const autoReplyThreadIndex = rose20DadAutoReplyIndex < 0
    ? -1
    : sent.slice(0, rose20DadAutoReplyIndex + 1)
        .filter((raw) => parseKktSent(raw)?.[0] === ROSE20_DAD_TITLE).length - 1;
  const authored = items.filter(
    (m) =>
      m.title === thread &&
      !(callActive && m.meta.afterCall === "true") &&
      (creator ||
        Number(m.meta.afterReplies || 0) < replies.length ||
        (Number(m.meta.afterReplies || 0) === replies.length &&
          stageVisible(items, thread, replies.length, visibleStageCount, m.id))),
  );
  const authoredOrder = (m: Item) => {
    switch (m.meta.rose20Order) {
      case "dad-notice":
        return Math.max(0, autoReplyThreadIndex >= 0 ? autoReplyThreadIndex : replies.length) * 2;
      case "dad-replies":
        return autoReplyThreadIndex >= 0 ? autoReplyThreadIndex * 2 + 1.5 : Number.POSITIVE_INFINITY;
      case "mom-notice":
        return rose20GroupRepliesAtNotice >= 0
          ? rose20GroupRepliesAtNotice * 2
          : Number.POSITIVE_INFINITY;
      case "group-after-masha-reply":
        return rose20GroupRepliesAtNotice >= 0
          ? rose20GroupRepliesAtNotice * 2 + 2
          : Number.POSITIVE_INFINITY;
      default:
        return Number(m.meta.afterReplies || 0) * 2;
    }
  };
  return [
    ...authored.map((item) => ({ item, order: authoredOrder(item) })),
    ...replies.map((item, index) => ({ item, order: index * 2 + 1 })),
  ]
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.item);
}
export function MymyKakao(p: SkinProps) {
  const [tab, setTab] = useSkinState<string>(p, "mymyTab", "聊天"),
    [sent, setSent] = useSkinState<string[]>(p, "mymyKktSent", []),
    [draft, setDraft] = useState(""),
    [query, setQuery] = useState(""),
    [menu, setMenu] = useState(false),
    [stagedVisible, setStagedVisible] = useState<number | null>(null);
  const [rose20DadAutoReplyIndex, setRose20DadAutoReplyIndex] =
    useSkinState<number>(p, "mymyRose20DadAutoReplyIndex", -1);
  const [rose20GroupRepliesAtNotice, setRose20GroupRepliesAtNotice] =
    useSkinState<number>(p, "mymyRose20GroupRepliesAtNotice", -1);
  const [rose20GroupOpened, setRose20GroupOpened] =
    useSkinState<boolean>(p, "mymyRose20GroupOpened", false);
  const [rose20DadNoticeDismissed, setRose20DadNoticeDismissed] =
    useSkinState<boolean>(p, "mymyRose20DadNoticeDismissed", false);
  const [rose20MomNoticeDismissed, setRose20MomNoticeDismissed] =
    useSkinState<boolean>(p, "mymyRose20MomNoticeDismissed", false);
  const rose20AutoReplyGuard = useRef(false);
  const replyCount = (title: string) =>
    sent.filter((raw) => parseKktSent(raw)?.[0] === title).length;
  const rose20Triggered = sent.some((raw) => {
    const entry = parseKktSent(raw);
    return Boolean(
      entry &&
      entry[0] === ROSE20_GROUP_TITLE &&
      normalizeRose20Trigger(entry[1]) === normalizeRose20Trigger(ROSE20_TRIGGER),
    );
  });
  const rose20UserRepliedToDad =
    rose20DadAutoReplyIndex >= 0 &&
    sent.slice(rose20DadAutoReplyIndex + 1).some(
      (raw) => parseKktSent(raw)?.[0] === ROSE20_DAD_TITLE,
    );
  const rose20GroupReplyAfterMasha =
    rose20UserRepliedToDad &&
    rose20GroupOpened &&
    rose20GroupRepliesAtNotice >= 0 &&
    replyCount(ROSE20_GROUP_TITLE) > rose20GroupRepliesAtNotice;
  const visibleItems = p.items.filter((item) => {
    if (p.creator) return true;
    switch (item.meta.rose20Gate) {
      case "dad-notice":
        return rose20Triggered;
      case "dad-replies":
        return rose20DadAutoReplyIndex >= 0;
      case "mom-notice":
        return rose20UserRepliedToDad && rose20GroupRepliesAtNotice >= 0;
      case "masha-after-open":
        return rose20UserRepliedToDad && rose20GroupRepliesAtNotice >= 0 && rose20GroupOpened;
      case "group-after-masha-reply":
        return rose20GroupReplyAfterMasha;
      default:
        return true;
    }
  });
  const openThread = (title: string) => {
    if (title === ROSE20_DAD_TITLE && rose20Triggered) {
      setRose20DadNoticeDismissed(true);
    }
    if (title === ROSE20_GROUP_TITLE && rose20UserRepliedToDad) {
      setRose20MomNoticeDismissed(true);
      setRose20GroupOpened(true);
    }
    p.onThread(title);
  };
  const activeStoryNotice =
    !p.creator && rose20Triggered && !rose20DadNoticeDismissed && p.thread !== ROSE20_DAD_TITLE
      ? { kind: "dad" as const, target: ROSE20_DAD_TITLE, title: ROSE20_DAD_TITLE, body: ROSE20_DAD_NOTICE }
      : !p.creator &&
          rose20UserRepliedToDad &&
          rose20GroupRepliesAtNotice >= 0 &&
          !rose20MomNoticeDismissed &&
          p.thread !== ROSE20_GROUP_TITLE
        ? { kind: "mom" as const, target: ROSE20_GROUP_TITLE, title: ROSE20_GROUP_TITLE, body: ROSE20_MOM_NOTICE }
        : null;
  const list = grouped(visibleItems.filter(
    (m) => p.creator || Number(m.meta.afterReplies || 0) <= replyCount(m.title),
  )),
    messages = kktTimeline(
      visibleItems,
      sent,
      p.thread,
      p.owner || "機主",
      p.creator,
      stagedVisible ?? Number.POSITIVE_INFINITY,
      Boolean(p.incomingCall),
      rose20DadAutoReplyIndex,
      rose20GroupRepliesAtNotice,
    ),
    scroll = useRef<HTMLDivElement>(null),
    wasInCall = useRef(Boolean(p.incomingCall));
  useEffect(() => {
    if (
      p.creator ||
      p.thread !== ROSE20_DAD_TITLE ||
      !rose20Triggered ||
      rose20DadAutoReplyIndex >= 0 ||
      rose20AutoReplyGuard.current
    ) return;
    rose20AutoReplyGuard.current = true;
    setRose20DadNoticeDismissed(true);
    setRose20DadAutoReplyIndex(sent.length);
    setSent([
      ...sent,
      JSON.stringify([
        ROSE20_DAD_TITLE,
        ROSE20_AUTO_REPLY,
        p.virtualTime || "09:41",
      ]),
    ]);
  }, [
    p.creator,
    p.thread,
    p.virtualTime,
    rose20Triggered,
    rose20DadAutoReplyIndex,
    sent,
    setRose20DadNoticeDismissed,
    setRose20DadAutoReplyIndex,
    setSent,
  ]);
  useEffect(() => {
    const active = Boolean(p.incomingCall);
    const ended = wasInCall.current && !active;
    if (ended && p.thread && !p.creator) {
      const stage = replyCount(p.thread);
      const pending = p.items.some(
        (m) =>
          m.title === p.thread &&
          m.meta.afterCall === "true" &&
          Number(m.meta.afterReplies || 0) === stage,
      );
      if (pending) {
        const alreadyVisible = p.items.filter(
          (m) =>
            m.title === p.thread &&
            m.meta.afterCall !== "true" &&
            Number(m.meta.afterReplies || 0) === stage,
        ).length;
        setStagedVisible(alreadyVisible);
      }
    }
    wasInCall.current = active;
  }, [p.incomingCall, p.thread, p.creator, p.items, sent.length]);
  useEffect(() => {
    if (stagedVisible === null || !p.thread || p.incomingCall) return;
    const stage = replyCount(p.thread);
    const total = p.items.filter((m) => m.title === p.thread && Number(m.meta.afterReplies || 0) === stage).length;
    if (!total) { setStagedVisible(null); return; }
    if (stagedVisible >= total) { setStagedVisible(null); return; }
    const timer = window.setTimeout(() => setStagedVisible((v) => (v === null ? 1 : v + 1)), 950);
    return () => window.clearTimeout(timer);
  }, [stagedVisible, p.thread, sent.length, p.items, p.incomingCall]);
  useEffect(() => {
    const node = scroll.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [p.thread, messages.length]);
  const onReadRef = useRef(p.onRead);
  useEffect(() => { onReadRef.current = p.onRead; });
  useEffect(() => {
    if (p.creator || !p.thread) return;
    const last = messages.at(-1);
    const bubble = scroll.current?.querySelector(".kzm:last-child .kzbub");
    if (!last || last.meta.incomingCall !== "true" || !bubble) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (timer) clearTimeout(timer);
      if (entry.isIntersecting) timer = setTimeout(() => {
        onReadRef.current(last.id);
        observer.disconnect();
      }, 600);
    }, { root: scroll.current, threshold: 1 });
    observer.observe(bubble);
    return () => { observer.disconnect(); if (timer) clearTimeout(timer); };
  // Reobserve when switching chats or when the visible message count changes.
  }, [p.creator, p.thread, messages.length]);
  return (
    <div className="mymy-ui mymy-kakao" data-mymy="kakao">
      {p.thread ? (
        <>
          <header className="kzth">
            <Back onClick={() => p.onThread("")} />
            <span className="kzname">{p.thread}</span>
            <span className="kzpill">
              <button aria-label="聊天選單" onClick={() => setMenu(!menu)}>
                <Menu size={21} />
              </button>
            </span>
          </header>
          <div className="msgs kk" ref={scroll}>
            {/^\d{4}-\d{2}-\d{2}/.test(messages[0]?.time || "") && (
              <div className="chat-time">
                {new Intl.DateTimeFormat("zh-TW", {
                  month: "long", day: "numeric", weekday: "long", timeZone: "UTC",
                }).format(new Date(messages[0].time.slice(0, 10) + "T12:00:00Z"))}
              </div>
            )}
            {messages.map((m, i) => {
              const run = messageRun(messages, i);
              return (
                <div
                  key={m.id}
                  className={
                    "kzm " +
                    (m.outgoing ? "kzmy" : "kzot") +
                    (run.first ? " first" : "")
                  }
                >
                  {!m.outgoing && run.first && (
                    <>
                      <div className="kzmav">
                        <Avatar name={m.sender} src={m.avatar} />
                      </div>
                      <div className="kzmn">{m.sender}</div>
                    </>
                  )}
                  {m.outgoing && run.last && (
                    <span className="kzt">
                      {m.meta.unread || ""}
                      <br />
                      {m.time.slice(-5)}
                    </span>
                  )}
                  <button
                    className={"kzbub" + (m.media ? " kzimg" : "")}
                    onClick={() => m.meta.local !== "true" && read(p, m)}
                  >
                    {m.media ? <Media item={m} /> : m.body}
                  </button>
                  {!m.outgoing && run.last && (
                    <span className="kzt">{m.time.slice(-5)}</span>
                  )}
                </div>
              );
            })}
            {!messages.length && <Blank />}
          </div>
          <form
            className="kzinp"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) {
                const value = draft.trim();
                if (
                  p.thread === ROSE20_DAD_TITLE &&
                  rose20Triggered &&
                  rose20DadAutoReplyIndex >= 0 &&
                  rose20GroupRepliesAtNotice < 0
                ) {
                  setRose20GroupRepliesAtNotice(replyCount(ROSE20_GROUP_TITLE));
                }
                setStagedVisible(0);
                setSent([
                  ...sent,
                  JSON.stringify([
                    p.thread,
                    value,
                    p.virtualTime || "09:41",
                  ]),
                ]);
                setDraft("");
              }
            }}
          >
            <button
              type="button"
              aria-label="新增聊天內容"
              onClick={() => (p.creator ? p.onAdd() : setMenu(!menu))}
            >
              <Plus size={21} />
            </button>
            <input
              aria-label="KKT訊息"
              placeholder="輸入訊息"
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Smile size={22} />
            <button
              className={draft.trim() ? "go" : ""}
              aria-label="傳送KKT訊息"
              disabled={!draft.trim()}
            >
              ↑
            </button>
          </form>
          {menu && (
            <div className="mymy-local-menu">
              <strong>{p.thread}</strong>
              <p>
                群組成員：{[...new Set(messages.map((m) => m.sender))].join("、")}
              </p>
              <button onClick={() => setMenu(false)}>完成</button>
            </div>
          )}
        </>
      ) : (
        <div className="kzkk">
          <div className="kzhd">
            <header className="kzkh">
              <b className="kzti">
                {tab === "好友" ? p.owner || "好友" : "聊天"}
              </b>
              <span className="kzic">
                <button
                  aria-label="搜尋聊天"
                  onClick={() => setQuery(query ? "" : " ")}
                >
                  <Search size={21} />
                </button>
                {p.creator && (
                  <button aria-label="新增內容" onClick={p.onAdd}>
                    <Plus />
                  </button>
                )}
                <button aria-label="KKT設定" onClick={() => setMenu(!menu)}>
                  <Settings size={21} />
                </button>
              </span>
            </header>
            <div className="kzkc2">
              {["好友", "聊天"].map((t) => (
                <button
                  key={t}
                  className={
                    "kzkpl " +
                    (t === tab || (t === "為你推薦" && tab === "推薦")
                      ? "on"
                      : "")
                  }
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {query !== "" && (
              <input
                className="mymy-search"
                aria-label="搜尋KKT"
                value={query.trimStart()}
                onChange={(e) => setQuery(e.target.value || " ")}
                placeholder="搜尋"
              />
            )}
          </div>
          <div className="kzkb">
            <div className="kzksec">
              {tab === "好友" ? "好友" : "全部聊天"} {list.length}
            </div>
            {list
              .filter((g) => g.title.includes(query.trim()))
              .map((g) => {
                const last = g.items.at(-1)!;
                return (
                  <button
                    className="kzkr kzkcr"
                    key={g.title}
                    onClick={() => openThread(g.title)}
                  >
                    <Avatar name={last.sender || g.title} src={last.avatar} />
                    <span className="kzkn">
                      <b>{g.title}</b>
                      <small>{tab === "好友" ? last.sender : last.body}</small>
                    </span>
                    <span className="kzkmt">
                      {last.time.slice(-5)}
                      {last.meta.unread && (
                        <i className="kzkbd">{last.meta.unread}</i>
                      )}
                    </span>
                  </button>
                );
              })}
            {!list.length && <Blank />}
          </div>
          <nav className="kzknv">
            {[Users, MessageCircle, Compass, Grid, MoreHorizontal].map(
              (Icon, i) => (
                <button
                  key={i}
                  aria-label={["好友", "聊天", "發現", "更多功能", "設定"][i]}
                  className={(tab === "好友" ? 0 : 1) === i ? "on" : ""}
                  onClick={() =>
                    i < 2 ? setTab(["好友", "聊天"][i]) : setMenu(true)
                  }
                >
                  <Icon />
                </button>
              ),
            )}
          </nav>
          {menu && (
            <div className="mymy-local-menu">
              <strong>KakaoTalk</strong>
              <p>作品內聊天</p>
              <button onClick={() => setMenu(false)}>完成</button>
            </div>
          )}
        </div>
      )}
      {activeStoryNotice && (
        <div className="mymy-story-notice" role="status">
          <button
            className="mymy-story-notice-main"
            onClick={() => openThread(activeStoryNotice.target)}
          >
            <Avatar
              name={activeStoryNotice.title}
              src={p.items.find((item) => item.title === activeStoryNotice.target)?.avatar}
            />
            <span className="mymy-story-notice-copy">
              <strong>{activeStoryNotice.title}</strong>
              <small>{activeStoryNotice.body}</small>
            </span>
          </button>
          <button
            type="button"
            className="mymy-story-notice-close"
            aria-label="忽略這則訊息通知"
            onClick={() => {
              if (activeStoryNotice.kind === "dad") setRose20DadNoticeDismissed(true);
              else setRose20MomNoticeDismissed(true);
            }}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
export function MymyInstagram(p: SkinProps) {
  const [tab, setTab] = useSkinState<string>(p, "mymyTab", "首頁"),
    [liked, setLiked] = useSkinState<string[]>(p, "mymyLiked", []),
    [saved, setSaved] = useSkinState<string[]>(p, "mymySaved", []),
    [replies, setReplies] = useSkinState<string[]>(p, "mymyReplies", []),
    [seen, setSeen] = useSkinState<string[]>(p, "mymySeen", []);
  const [sheet, setSheet] = useState<Item | null>(null),
    [selected, setSelected] = useState<Item | null>(null),
    [story, setStory] = useState(0),
    [draft, setDraft] = useState(""),
    [pop, setPop] = useState("");
  const posts = p.items.filter(
      (i) => i.folder !== "私信" && i.meta.story !== "true",
    ),
    stories = p.items.filter((i) => i.meta.story === "true"),
    dms = p.items.filter((i) => i.folder === "私信"),
    active = stories[story - 1];
  const toggle = (id: string, values: string[], set: (v: string[]) => void) =>
    set(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(
      () => setStory((n) => (n < stories.length ? n + 1 : 0)),
      5000,
    );
    return () => clearTimeout(t);
  }, [active, stories.length]);
  const openStory = (i: number) => {
    const m = stories[i];
    setSeen([...new Set([...seen, m.id])]);
    read(p, m);
    setStory(i + 1);
  };
  const openPost = (i: Item) => {
    if (p.creator || i.password) p.onItem(i);
    else {
      read(p, i);
      setSelected(i);
    }
  };
  const post = (i: Item) => (
    <article className="igp" key={i.id}>
      <header className="igph">
        <Avatar name={i.sender} src={i.avatar} />
        <div className="igpn">
          <button onClick={() => setTab("個人首頁")}>
            <b>{i.sender}</b>
          </button>
          <small>{i.meta.location || i.time}</small>
        </div>
        <button aria-label="帖子詳情" onClick={() => openPost(i)}>
          <MoreHorizontal />
        </button>
      </header>
      <div
        className="carw"
        onDoubleClick={() => {
          if (!liked.includes(i.id)) setLiked([...liked, i.id]);
          setPop(i.id);
        }}
      >
        <Media item={i} />
        {pop === i.id && (
          <Heart
            className="mymy-heart-pop"
            fill="white"
            onAnimationEnd={() => setPop("")}
          />
        )}
      </div>
      <div className="iga">
        <button
          aria-label={"點贊" + i.title}
          aria-pressed={liked.includes(i.id)}
          onClick={() => toggle(i.id, liked, setLiked)}
        >
          <Heart
            fill={liked.includes(i.id) ? "#ff3040" : "none"}
            color={liked.includes(i.id) ? "#ff3040" : "currentColor"}
          />
        </button>
        <button
          aria-label={"評論" + i.title}
          onClick={() => {
            read(p, i);
            setSheet(i);
          }}
        >
          <MessageCircle />
        </button>
        <button aria-label="分享帖子" onClick={() => setTab("私信")}>
          <Send />
        </button>
        <button
          className="mymy-save"
          aria-label={"收藏" + i.title}
          aria-pressed={saved.includes(i.id)}
          onClick={() => toggle(i.id, saved, setSaved)}
        >
          <Bookmark fill={saved.includes(i.id) ? "currentColor" : "none"} />
        </button>
      </div>
      <p className="lk2">{i.likes + (liked.includes(i.id) ? 1 : 0)} 次贊</p>
      <button
        className="igc"
        onClick={() => {
          openPost(i);
        }}
      >
        <b>{i.sender}</b> {i.body}
      </button>
      <button className="cmall" onClick={() => setSheet(i)}>
        檢視評論{" "}
        {i.comments.length +
          replies.filter((r) => r.startsWith(i.id + "\t")).length}
      </button>
      <p className="igt">{i.time}</p>
    </article>
  );
  return (
    <div className="mymy-ui mymy-instagram" data-mymy="instagram">
      <div className="ig">
        <header className="igh">
          <button
            aria-label={selected ? "返回Instagram動態" : "關閉目前App"}
            onClick={() => (selected ? setSelected(null) : p.onBack())}
          >
            <ArrowLeft />
          </button>
          <span className="igl2">
            {selected ? "帖子" : tab === "首頁" ? "Instagram" : tab}
          </span>
          <button aria-label="開啟私信" onClick={() => setTab("私信")}>
            <Send />
          </button>
        </header>
        <div className="igb">
          {selected && post(selected)}
          {!selected && tab === "首頁" && (
            <>
              <div className="sts">
                {stories.map((s, n) => (
                  <button
                    className="st"
                    key={s.id}
                    onClick={() => openStory(n)}
                  >
                    <span
                      className={"sr on " + (seen.includes(s.id) ? "seen" : "")}
                    >
                      <Avatar name={s.sender} src={s.avatar} />
                    </span>
                    <small>{s.sender}</small>
                  </button>
                ))}
              </div>
              {posts.map(post)}
              {!posts.length && <Blank />}
            </>
          )}
          {!selected && tab === "個人首頁" && (
            <>
              <div className="pf">
                <Avatar name={p.owner || "機主"} />
                <div className="ps">
                  <div>
                    <b>{posts.length}</b>
                    <small>帖子</small>
                  </div>
                  <div>
                    <b>—</b>
                    <small>粉絲</small>
                  </div>
                  <div>
                    <b>—</b>
                    <small>關注</small>
                  </div>
                </div>
              </div>
              <p className="pn">{p.owner}</p>
              <div className="ptab">
                <div className="on">
                  <Grid />
                </div>
              </div>
              <div className="pg2">
                {posts.map((i) => (
                  <button key={i.id} onClick={() => openPost(i)}>
                    <Media item={i} />
                  </button>
                ))}
              </div>
            </>
          )}
          {!selected && tab === "私信" && (
            <>
              {dms.map((i) => (
                <button className="kzkr" key={i.id} onClick={() => openPost(i)}>
                  <Avatar name={i.sender} src={i.avatar} />
                  <span className="kzkn">
                    <b>{i.title}</b>
                    <small>{i.body}</small>
                  </span>
                </button>
              ))}
              {!dms.length && <Blank />}
            </>
          )}
          {!selected && tab === "搜尋" && (
            <>
              <input
                className="mymy-search"
                aria-label="搜尋Instagram"
                placeholder="搜尋"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              {posts
                .filter((i) => (i.title + i.body + i.sender).includes(draft))
                .map(post)}
            </>
          )}
        </div>
        <nav className="mymy-ig-nav">
          {[Home, Search, Send, User].map((Icon, n) => (
            <button
              key={n}
              aria-label={["首頁", "搜尋", "私信", "個人首頁"][n]}
              aria-pressed={
                !selected && tab === ["首頁", "搜尋", "私信", "個人首頁"][n]
              }
              onClick={() => {
                setSelected(null);
                setTab(["首頁", "搜尋", "私信", "個人首頁"][n]);
              }}
            >
              <Icon />
            </button>
          ))}
        </nav>
      </div>
      {sheet && (
        <div className="kzcs">
          <button
            className="kzbk"
            aria-label="關閉評論"
            onClick={() => setSheet(null)}
          />
          <section className="kzsh" role="dialog" aria-label="Instagram評論">
            <div className="mymy-sheet-handle" />
            <header>
              <b>評論</b>
              <button aria-label="關閉評論面板" onClick={() => setSheet(null)}>
                <X />
              </button>
            </header>
            <div className="mymy-comments">
              {[
                ...sheet.comments,
                ...replies
                  .filter((r) => r.startsWith(sheet.id + "\t"))
                  .map((r) => r.split("\t").slice(1).join("\t")),
              ].map((c, n) => (
                <p key={n}>
                  <Avatar name={c.split(":")[0]} />
                  {c}
                </p>
              ))}
            </div>
            <form
              className="cmb2"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) {
                  setReplies([...replies, sheet.id + "\t" + draft.trim()]);
                  setDraft("");
                }
              }}
            >
              <input
                aria-label="新增評論"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="新增評論"
                maxLength={500}
              />
              <button>發布</button>
            </form>
          </section>
        </div>
      )}
      {active && (
        <div
          className="mymy-story"
          onPointerDown={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            const next =
              e.clientX - box.left < box.width * 0.3 ? story - 1 : story + 1;
            setStory(next > stories.length ? 0 : Math.max(0, next));
          }}
        >
          <div className="mymy-story-bars">
            {stories.map((s, n) => (
              <i key={s.id} className={n < story ? "seen" : ""} />
            ))}
          </div>
          <header>
            <Avatar name={active.sender} src={active.avatar} />
            <b>{active.sender}</b>
            <button
              aria-label="關閉快拍"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setStory(0)}
            >
              <X />
            </button>
          </header>
          <Media item={active} />
          <p>{active.body}</p>
        </div>
      )}
    </div>
  );
}
export function MymyX(p: SkinProps) {
  const [dark, setDark] = useSkinState<boolean>(p, "x-dark", true);
  const [tab, setTab] = useSkinState<string>(p, "mymyTab", "推薦"),
    [likes, setLikes] = useSkinState<string[]>(p, "mymyXLikes", []),
    [reposts, setReposts] = useSkinState<string[]>(p, "mymyXReposts", []),
    [marks, setMarks] = useSkinState<string[]>(p, "mymyXMarks", []),
    [query, setQuery] = useState("");
  const isLiked = (id: string) =>
    typeof p.ui?.["liked-" + id] === "boolean"
      ? Boolean(p.ui["liked-" + id])
      : likes.includes(id);
  const isSaved = (id: string) =>
    typeof p.ui?.["saved-" + id] === "boolean"
      ? Boolean(p.ui["saved-" + id])
      : marks.includes(id);
  const toggle = (id: string, v: string[], set: (x: string[]) => void) =>
    set(v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
  return (
    <div
      className={"mymy-ui mymy-x " + (dark ? "x-reference-dark" : "")}
      data-mymy="twitter"
    >
      <div className="kzxw">
        <header className="kzxh">
          <button aria-label="關閉目前App" onClick={p.onBack}>
            <ArrowLeft />
          </button>
          <div className="kzxlg">𝕏</div>
          <button aria-label="切換X外觀" onClick={() => setDark(!dark)}>
            <User />
          </button>
        </header>
        <div className="kzxtb">
          {["為你推薦", "正在關注", "新增 +", "時間"].map((t) => (
            <button
              className={t === tab ? "on" : ""}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "搜尋" && (
          <input
            className="mymy-search"
            aria-label="搜尋X"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋"
          />
        )}
        <div className="kzxfd">
          {p.items
            .filter((i) => (i.title + i.body).includes(query))
            .map((i) => (
              <article className="kzxt" key={i.id}>
                <Avatar name={i.sender} src={i.avatar} />
                <div className="kzxb">
                  <div className="kzxn">
                    <b>{i.sender}</b>
                    <small>
                      @{i.meta.handle || "user"} · {i.time.slice(-5)}
                    </small>
                    <em>
                      <MoreHorizontal size={18} />
                    </em>
                  </div>
                  <button
                    className="kzxx"
                    onClick={() => {
                      read(p, i);
                      p.onItem(i);
                    }}
                  >
                    {i.body}
                  </button>
                  {i.media && (
                    <button
                      className="kzxv"
                      aria-label="開啟媒體"
                      onClick={() => p.onItem(i)}
                    >
                      <Media item={i} />
                    </button>
                  )}
                  <div className="kzxac">
                    <button
                      aria-label={"評論" + i.title}
                      onClick={() => p.onItem(i)}
                    >
                      <MessageCircle />
                      {i.comments.length}
                    </button>
                    <button
                      aria-label={"轉發" + i.title}
                      aria-pressed={reposts.includes(i.id)}
                      onClick={() => toggle(i.id, reposts, setReposts)}
                    >
                      <Repeat2 />
                      {reposts.includes(i.id) ? 1 : 0}
                    </button>
                    <button
                      aria-label={"點贊" + i.title}
                      aria-pressed={isLiked(i.id)}
                      onClick={() => {
                        toggle(i.id, likes, setLikes);
                        p.onUi?.("liked-" + i.id, !isLiked(i.id));
                      }}
                    >
                      <Heart fill={isLiked(i.id) ? "#f91880" : "none"} />
                      {i.likes + (isLiked(i.id) ? 1 : 0)}
                    </button>
                    <span>
                      <BarChart2 />
                      {i.meta.views || "—"}
                    </span>
                    <button
                      aria-label={"收藏" + i.title}
                      aria-pressed={isSaved(i.id)}
                      onClick={() => {
                        toggle(i.id, marks, setMarks);
                        p.onUi?.("saved-" + i.id, !isSaved(i.id));
                      }}
                    >
                      <Bookmark />
                    </button>
                    <button aria-label="分享" onClick={() => p.onItem(i)}>
                      <Share />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          {!p.items.length && <Blank />}
        </div>
        <nav className="kzxnav">
          {[Home, Search, Bell, MessageCircle].map((Icon, n) => (
            <button
              key={n}
              aria-label={["時間線", "搜尋", "通知", "私信"][n]}
              onClick={() => n < 2 && setTab(n ? "搜尋" : "推薦")}
              disabled={n > 1}
            >
              <Icon />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

