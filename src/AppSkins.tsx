import { NativeComposer } from "./DeviceSystem";
import { useSkinState } from "./skinState";
import { useState } from "react";
import type { ChangeEvent } from "react";
import {
  ChevronLeft,
  Plus,
  CirclePlus,
  Search,
  MessageCircle,
  Users,
  Compass,
  User,
  Camera,
  Phone,
  Video,
  Settings,
  Heart,
  Send,
  Home,
  Play,
  Bookmark,
  MoreHorizontal,
  Mic,
  Smile,
  Grid,
  CheckCheck,
  AtSign,
  Star,
  Music,
  Image as ImageIcon,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { makeItem, safeMedia, type Item, type UiValue } from "./schema";
export type SkinProps = {
  ui?: Record<string, UiValue>;
  onUi?: (key: string, value: UiValue) => void;
  appId?: string;
  owner?: string;
  virtualTime?: string;
  name: string;
  items: Item[];
  creator: boolean;
  onRead: (id: string) => void;
  onItem: (i: Item) => void;
  onAdd: () => void;
  onBack: () => void;
  thread: string;
  onThread: (s: string) => void;
  incomingCall?: { status: "ringing" | "answered" } | null;
};
function Avatar({
  name,
  round = false,
  src = "",
}: {
  name: string;
  round?: boolean;
  src?: string;
}) {
  return (
    <span className={`skin-avatar ${round ? "round" : ""}`}>
      {safeMedia(src)?.startsWith("data:image/") ? (
        <img src={safeMedia(src)} alt="" />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}
function ItemMedia({ item }: { item: Item }) {
  const src = safeMedia(item.media);
  return src ? (
    item.kind === "audio" ? (
      <audio controls src={src} />
    ) : item.kind === "video" ? (
      <video controls playsInline src={src} />
    ) : (
      <img loading="lazy" alt={item.title} src={src} />
    )
  ) : (
    <div className="skin-photo">
      <span>{item.title}</span>
    </div>
  );
}
function MessageList({
  items,
  creator,
  onItem,
  onRead,
  whatsapp = false,
}: {
  items: Item[];
  creator: boolean;
  onItem: (i: Item) => void;
  onRead: (id: string) => void;
  whatsapp?: boolean;
}) {
  return (
    <div className={`skin-messages ${whatsapp ? "wa-wallpaper" : ""}`}>
      <div className="skin-date">{items[0]?.time.slice(0, 10)}</div>
      {items.map((i) => (
        <div
          key={i.id}
          className={`skin-message ${i.outgoing ? "outgoing" : ""}`}
        >
          {!whatsapp && !i.outgoing && (
            <Avatar name={i.sender} src={i.avatar} />
          )}
          <button
            className="skin-bubble"
            onClick={() => (creator ? onItem(i) : onRead(i.id))}
          >
            {["image", "audio", "video"].includes(i.kind) ? (
              <ItemMedia item={i} />
            ) : i.kind === "transfer" ? (
              <div className="skin-transfer">
                ¥ {i.body}
                <small>轉帳記錄 · 虛構</small>
              </div>
            ) : (
              i.body
            )}
            <small className={whatsapp ? undefined : "wx-message-time"}>
              {i.time.slice(-5)}{" "}
              {whatsapp && i.outgoing && <CheckCheck size={11} />}
            </small>
          </button>
          {!whatsapp && i.outgoing && <Avatar name={i.sender} src={i.avatar} />}
        </div>
      ))}
    </div>
  );
}
function parseWechatReply(raw: string) {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      Array.isArray(value) &&
      value.length === 3 &&
      value.every((v) => typeof v === "string")
    ) {
      return {
        thread: value[0] as string,
        body: value[1] as string,
        time: value[2] as string,
      };
    }
  } catch {
    // Ignore invalid saved entries.
  }
  return null;
}
function hasMomWechatReply(sent: string[]) {
  return sent.some((raw) => {
    const entry = parseWechatReply(raw);
    return entry?.thread === "媽媽🐈" && entry.body === "我想你了";
  });
}
function wechatTimeline(
  items: Item[],
  sent: string[],
  thread: string,
  owner: string,
  creator = false,
  revealAfterCall = false,
) {
  const replies = sent
    .map(parseWechatReply)
    .filter(
      (entry): entry is { thread: string; body: string; time: string } =>
        Boolean(entry && entry.thread === thread),
    )
    .map((entry, index) =>
      makeItem({
        id: "local-wechat-" + index,
        title: thread,
        body: entry.body,
        time: entry.time,
        sender: owner,
        outgoing: true,
        meta: { local: "true" },
      }),
    );
  const authored = items.filter(
    (item) =>
      item.title === thread &&
      (creator || item.meta.afterCall !== "true" || revealAfterCall),
  );
  return [
    ...authored.map((item) => ({
      item,
      order: Number(item.meta.afterReplies || 0) * 2,
    })),
    ...replies.map((item, index) => ({ item, order: index * 2 + 1 })),
  ]
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.item);
}

function Compose({
  creator,
  onAdd,
  wa = false,
}: {
  creator: boolean;
  onAdd: () => void;
  wa?: boolean;
}) {
  return (
    <div className={`skin-compose ${wa ? "wa-compose" : ""}`}>
      {wa ? <Plus size={20} /> : <Mic size={20} />}
      <NativeComposer creator={creator} onAdd={onAdd} />

      <Smile size={21} />
      {wa ? <Mic size={20} /> : <Plus size={22} />}
    </div>
  );
}
export function WeChatSkin(p: SkinProps) {
  const [tab, setTab] = useState("微信"),
    [query, setQuery] = useState(""),
    [moments, setMoments] = useState(false),
    [menu, setMenu] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [utility, setUtility] = useState("");
  const [sent, setSent] = useSkinState<string[]>(p, "wechatSent", []);
  const [draft, setDraft] = useState("");
  const momVideoReplySent = hasMomWechatReply(sent);
  const revealAfterCall = p.creator || (momVideoReplySent && !p.incomingCall);
  const wechatContactNames = [
    "媽媽🐈",
    "爸爸🐈‍⬛",
    "瑪莎叔叔🧹",
    "石頭叔叔🪨",
    "冠佑叔叔🥁",
  ];
  const wechatContactAvatars = new Map(
    wechatContactNames.map((name) => [
      name,
      p.items.find((item) => item.sender === name && item.avatar)?.avatar ||
        "",
    ]),
  );
  const wechatAvatar = (name: string, fallback = "") =>
    wechatContactAvatars.get(name) || fallback;
  const [profileName, setProfileName] = useSkinState<string>(
    p,
    "wechatProfileName",
    "",
  );
  const [profileAvatar, setProfileAvatar] = useSkinState<string>(
    p,
    "wechatProfileAvatar",
    "",
  );
  const [profileReady, setProfileReady] = useSkinState<boolean>(
    p,
    "wechatProfileReady",
    false,
  );
  const [draftName, setDraftName] = useState(profileName);
  const [draftAvatar, setDraftAvatar] = useState(profileAvatar);
  const displayName = profileName || "我";
  const isPlayerSender = (name: string) =>
    name === displayName ||
    name === (p.owner || "機主") ||
    name === "我" ||
    name === "機主";
  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (
      !file ||
      file.size > 12_000_000 ||
      !/^image\/(png|jpeg|webp)$/.test(file.type)
    ) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const image = new Image();
      image.onload = () => {
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        if (!sourceWidth || !sourceHeight) return;
        const scale = Math.min(
          1,
          512 / Math.max(sourceWidth, sourceHeight),
        );
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        setDraftAvatar(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  const fixedWechatTimeline = (thread: string) =>
    wechatTimeline(
      p.items,
      sent,
      thread,
      displayName,
      p.creator,
      revealAfterCall,
    ).map((item) => {
      if (item.outgoing || isPlayerSender(item.sender)) {
        return { ...item, avatar: profileAvatar };
      }
      const avatar = wechatAvatar(item.sender, item.avatar);
      return avatar && avatar !== item.avatar ? { ...item, avatar } : item;
    });
  const [momentsCover, setMomentsCover] = useSkinState<string>(
    p,
    "wechatMomentsCover",
    "",
  );
  const chooseMomentsCover = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (
      !file ||
      file.size > 12_000_000 ||
      !/^image\/(png|jpeg|webp|gif)$/.test(file.type)
    ) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const image = new Image();
      image.onload = () => {
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        if (!sourceWidth || !sourceHeight) return;
        const scale = Math.min(
          1,
          1600 / Math.max(sourceWidth, sourceHeight),
        );
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        setMomentsCover(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  const saveProfile = () => {
    const name = draftName.trim();
    if (!name || !draftAvatar) return;
    setProfileName(name);
    setProfileAvatar(draftAvatar);
    setProfileReady(true);
  };
  const [readThreads, setReadThreads] = useSkinState<string[]>(
    p,
    "readThreads",
    [],
  );
  const profileSetup = (
    <div className="wx-profile-setup">
      <p className="wx-profile-intro">
        第一次使用微信，請設定你的微信名稱和頭像。完成後會保留在手機存檔中，不會自動更改。
      </p>
      <Avatar name={draftName || "我"} src={draftAvatar} />
      <label>
        微信名稱
        <input
          aria-label="微信名稱"
          value={draftName}
          maxLength={20}
          placeholder="輸入你想使用的名稱"
          onChange={(event) => setDraftName(event.target.value)}
        />
      </label>
      <label className="wx-avatar-picker">
        我的頭像（請從裝置選擇照片）
        <input
          aria-label="選擇我的微信頭像"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={chooseAvatar}
        />
      </label>
      {draftAvatar && <p className="wx-avatar-selected">已選擇頭像</p>}
      <button
        className="phone-add"
        disabled={!draftName.trim() || !draftAvatar}
        onClick={saveProfile}
      >
        完成設定並進入微信
      </button>
    </div>
  );
  const visibleItems = p.items.filter(
    (i) => p.creator || i.meta.afterCall !== "true" || revealAfterCall,
  );
  const sentThreads = sent
    .map(parseWechatReply)
    .filter((entry): entry is { thread: string; body: string; time: string } =>
      Boolean(entry),
    )
    .map((entry) => entry.thread);
  const conversations = [
    ...new Set([
      ...visibleItems
        .filter((i) => !["朋友圈", "我", "通訊錄"].includes(i.folder))
        .map((i) => i.title),
      ...sentThreads,
    ]),
  ];
  const contacts = [
    ...new Set(p.items.map((i) => i.sender).filter((s) => s !== "我")),
  ];
  const posts = p.items.filter(
    (i) => i.folder === "朋友圈" || i.kind === "post",
  );
  if (!profileReady || !profileName.trim() || !profileAvatar) {
    return (
      <div
        className="wechat-ui independent-skin wx-first-setup"
        data-tab="微信"
      >
        <div className="app-nav wx-nav">
          <strong>設定微信個人資料</strong>
        </div>
        <div className="wx-first-setup-content">{profileSetup}</div>
      </div>
    );
  }
  return (
    <div
      className="wechat-ui independent-skin"
      data-tab={tab}
      data-thread={!!p.thread}
      data-moments={moments}
      data-utility={!!utility}
    >
      <div className="app-nav wx-nav">
        <button
          aria-label={utility || p.thread || moments ? "返回" : "收藏"}
          onClick={() =>
            utility
              ? setUtility("")
              : p.thread
                ? p.onThread("")
                : moments
                  ? setMoments(false)
                  : setUtility("收藏")
          }
        >
          {utility || p.thread || moments ? (
            <ChevronLeft size={22} />
          ) : (
            <Star size={22} />
          )}
        </button>
        <strong>
          {utility ||
            p.thread ||
            (moments ? "朋友圈" : tab === "微信" ? p.name : tab)}
        </strong>
        <button
          aria-label={
            p.creator ? "新增內容" : p.thread ? "聊天詳情" : "微信選單"
          }
          onClick={
            p.creator
              ? p.onAdd
              : () => (p.thread ? setUtility("聊天資訊") : setMenu(!menu))
          }
        >
          {p.thread ? <MoreHorizontal size={22} /> : <CirclePlus size={22} />}
        </button>
      </div>
      {menu && (
        <div className="wx-popup-menu" role="menu">
          {["搜尋", "發起群聊", "新增朋友", "掃一掃", "收付款"].map((label) => (
            <button
              role="menuitem"
              key={label}
              onClick={() => {
                setMenu(false);
                if (label === "搜尋") {
                  setSearchOpen(true);
                } else setUtility(label);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {utility ? (
        <div className="skin-scroll wx-utility">
          {utility === "聊天資訊" && (
            <div className="wx-members">
              {[
                ...new Set(
                  p.items
                    .filter((i) => i.title === p.thread)
                    .map((i) => i.sender),
                ),
              ].map((name) => (
                <div key={name}>
                  <Avatar
                    name={name}
                    src={wechatAvatar(
                      name,
                      p.items.find((i) => i.sender === name)?.avatar,
                    )}
                  />
                  <small>{name}</small>
                </div>
              ))}
            </div>
          )}
          {p.items
            .filter((i) => i.folder === utility)
            .map((i) => (
              <button
                key={i.id}
                className="wx-discovery"
                onClick={() => p.onItem(i)}
              >
                {i.title}
                <span>›</span>
              </button>
            ))}
          {!p.items.some((i) => i.folder === utility) &&
            utility !== "聊天資訊" && <p className="skin-empty">暫無內容</p>}
        </div>
      ) : p.thread ? (
        <>
          <MessageList
            items={fixedWechatTimeline(p.thread)}
            creator={p.creator}
            onItem={p.onItem}
            onRead={p.onRead}
          />
          <form
            className="skin-compose wechat-compose"
            onSubmit={(event) => {
              event.preventDefault();
              const value = draft.trim();
              if (!value) return;
              if (p.creator) {
                p.onAdd();
                return;
              }
              setSent([
                ...sent,
                JSON.stringify([
                  p.thread,
                  value,
                  p.virtualTime || "09:41",
                ]),
              ]);
              setDraft("");
            }}
          >
            <button
              type="button"
              aria-label="聊天選單"
              onClick={() =>
                p.creator ? p.onAdd() : setUtility("聊天資訊")
              }
            >
              <Plus size={20} />
            </button>
            <input
              aria-label="微信訊息"
              placeholder="輸入訊息"
              value={draft}
              maxLength={2000}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Smile size={21} />
            <button
              type="submit"
              className="wechat-send"
              aria-label="傳送微信訊息"
              disabled={!draft.trim()}
            >
              ↑
            </button>
          </form>
        </>
      ) : moments ? (
        <div className="wx-moments">
          <div
            className={`wx-moment-cover ${momentsCover ? "has-custom-cover" : ""}`}
            style={
              momentsCover
                ? { backgroundImage: `url("${momentsCover}")` }
                : undefined
            }
          >
            {momentsCover ? (
              <span className="wx-moment-cover-title">朋友圈</span>
            ) : (
              <>
                <Camera size={32} />
                <span className="wx-moment-cover-title">朋友圈</span>
              </>
            )}
            <label className="wx-cover-change">
              <Camera size={14} />
              <span>更換背景</span>
              <input
                aria-label="更換朋友圈背景圖片"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={chooseMomentsCover}
              />
            </label>
          </div>
          {posts.map((i) => (
            <button
              key={i.id}
              className="wx-moment-post"
              onClick={() => p.onItem(i)}
            >
              <Avatar name={i.sender} src={isPlayerSender(i.sender) ? profileAvatar : wechatAvatar(i.sender, i.avatar)} />
              <div>
                <strong>{isPlayerSender(i.sender) ? displayName : i.sender}</strong>
                <p>{i.body}</p>
                {i.media && <ItemMedia item={i} />}
                {i.comments.map((comment, index) => (
                  <p className="wx-moment-comment" key={`${i.id}-comment-${index}`}>
                    {comment}
                  </p>
                ))}
                <small>{i.time}</small>
              </div>
            </button>
          ))}
          {!posts.length && <p className="skin-empty">暫無朋友圈動態</p>}
          {p.creator && (
            <button className="phone-add" onClick={p.onAdd}>
              新增朋友圈動態
            </button>
          )}
        </div>
      ) : (
        <div className="skin-scroll">
          {tab === "微信" ? (
            <>
              {searchOpen && (
                <label className="wx-search">
                  <Search size={14} />
                  <input
                    aria-label="搜尋微信內容"
                    placeholder="搜尋"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              )}
              {conversations
                .filter(
                  (t) =>
                    t.includes(query) ||
                    p.items.some(
                      (i) => i.title === t && i.body.includes(query),
                    ),
                )
                .map((t) => {
                  const list = fixedWechatTimeline(t),
                    last = list.at(-1);
                  if (!last) return null;
                  return (
                    <button
                      className="wx-chat-row"
                      key={t}
                      onClick={() => {
                        setReadThreads((v) => (v.includes(t) ? v : [...v, t]));
                        p.onThread(t);
                        p.onRead(t);
                      }}
                    >
                      <span className="wx-chat-avatar">
                        <Avatar
                          name={t}
                          src={wechatAvatar(t, last.avatar)}
                        />
                        {!readThreads.includes(t) &&
                          list.some((i) => !i.read) && (
                            <b className="wx-unread">
                              {list.filter((i) => !i.read).length}
                            </b>
                          )}
                      </span>
                      <div>
                        <strong>{t}</strong>
                        <p>{last.body}</p>
                      </div>
                      <time>{last.time.slice(-5)}</time>
                    </button>
                  );
                })}
              {!conversations.length && <p className="skin-empty">暫無聊天</p>}
            </>
          ) : tab === "通訊錄" ? (
            <>
              <div className="wx-section-label">聯絡人</div>
              {contacts.map((c) => (
                <button
                  key={c}
                  className="wx-contact"
                  onClick={() => {
                    const item = p.items.find((i) => i.sender === c);
                    if (item) {
                      p.onThread(item.title);
                      p.onRead(item.title);
                    }
                  }}
                >
                  <Avatar
                    name={c}
                    src={wechatAvatar(
                    c,
                    p.items.find((i) => i.sender === c)?.avatar,
                  )}
                  />
                  {c}
                </button>
              ))}
            </>
          ) : tab === "發現" ? (
            <div className="wx-discover-groups">
              {[
                [Camera, "朋友圈", "#26a958"],
                [Play, "視訊號", "#fa9d3b"],
                [Music, "聽一聽", "#fa5151"],
              ].map(([Icon, label, color]) => {
                const Glyph = Icon as typeof Camera;
                return (
                  <button
                    key={String(label)}
                    className="wx-discovery"
                    onClick={() =>
                      label === "朋友圈"
                        ? setMoments(true)
                        : setUtility(String(label))
                    }
                  >
                    <Glyph size={22} style={{ color: String(color) }} />
                    {String(label)}
                    <span>›</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="wx-profile">
                    <Avatar name={displayName} src={profileAvatar} />
                    <div>
                      <h2>{displayName}</h2>
                      <small>微信號：未設定</small>
                      <button
                        className="wx-profile-status"
                        onClick={() => setUtility("狀態")}
                      >
                        ＋ 狀態
                      </button>
                    </div>
                  </div>
                  <div className="wx-profile-menu">
                    {[
                      [MessageCircle, "服務", "#07c160"],
                      [Layers, "收藏", "#e8a828"],
                      [ImageIcon, "朋友圈", "#3a9bd9"],
                      [Layers, "作品", "#329dd8"],
                      [ShoppingBag, "小店與卡包", "#ed7c59"],
                      [Smile, "表情", "#f7b900"],
                      [Settings, "設定", "#1696d2"],
                    ].map(([Icon, label, color]) => {
                      const Glyph = Icon as typeof Settings;
                      return (
                        <button
                          key={String(label)}
                          className="wx-discovery"
                          onClick={() =>
                            label === "朋友圈"
                              ? setMoments(true)
                              : setUtility(String(label))
                          }
                        >
                          <Glyph size={22} style={{ color: String(color) }} />
                          {String(label)}
                          <span>›</span>
                        </button>
                      );
                    })}
                  </div>
                  {p.items
                    .filter((i) => i.folder === "我")
                    .map((i) => (
                      <button
                        className="wx-discovery"
                        key={i.id}
                        onClick={() => p.onItem(i)}
                      >
                        <User size={18} />
                        {i.title}
                        <span>›</span>
                      </button>
                    ))}
                  {p.creator && (
                    <button className="phone-add" onClick={p.onAdd}>
                      編輯個人資料內容
                    </button>
                  )}
            </>
          )}
        </div>
      )}
      {!p.thread && !moments && !utility && (
        <nav className="wx-bottom">
          {[
            { label: "微信", icon: MessageCircle },
            { label: "通訊錄", icon: Users },
            { label: "發現", icon: Compass },
            { label: "我", icon: User },
          ].map((t) => (
            <button
              className={tab === t.label ? "selected" : ""}
              key={t.label}
              onClick={() => setTab(t.label)}
            >
              <t.icon size={21} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
export function WhatsAppSkin(p: SkinProps) {
  const [tab, setTab] = useState("聊天"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("全部");
  const tabs = [
    { label: "動態", icon: Compass },
    { label: "通話", icon: Phone },
    { label: "社區", icon: Users },
    { label: "聊天", icon: MessageCircle },
    { label: "設定", icon: Settings },
  ];
  const conversations = [
    ...new Set(
      p.items
        .filter((i) => !["動態", "通話", "社區", "設定"].includes(i.folder))
        .filter((i) => filter !== "未讀" || !i.read)
        .map((i) => i.title),
    ),
  ];
  const name = tab === "聊天" ? p.name : tab;
  return (
    <div className="whatsapp-ui independent-skin">
      <div className="app-nav wa-nav">
        <button
          aria-label="返回"
          onClick={() => (p.thread ? p.onThread("") : p.onBack())}
        >
          <ChevronLeft size={22} />
        </button>
        <strong>{p.thread || name}</strong>
        <button
          aria-label={p.creator ? "新增內容" : "搜尋內容"}
          onClick={
            p.creator
              ? p.onAdd
              : () =>
                  document
                    .querySelector<HTMLInputElement>(".wa-search input")
                    ?.focus()
          }
        >
          {p.creator ? <Plus size={21} /> : <Search size={20} />}
        </button>
      </div>
      {p.thread ? (
        <>
          <div className="wa-thread-profile">
            <button aria-label="返回聊天列表" onClick={() => p.onThread("")}>
              <ChevronLeft size={23} />
            </button>
            <Avatar
              name={p.thread}
              src={p.items.find((i) => i.title === p.thread)?.avatar}
              round
            />
            <div>
              <strong>{p.thread}</strong>
              <small>聯絡人</small>
            </div>
            <Video size={18} />
            <Phone size={17} />
          </div>
          <MessageList
            items={p.items.filter((i) => i.title === p.thread)}
            creator={p.creator}
            onItem={p.onItem}
            onRead={p.onRead}
            whatsapp
          />
          <Compose creator={p.creator} onAdd={p.onAdd} wa />
        </>
      ) : (
        <div className="skin-scroll">
          <h1 className="wa-large-title">{tab}</h1>
          {tab === "聊天" ? (
            <>
              <label className="wa-search">
                <Search size={16} />
                <input
                  placeholder="搜尋"
                  aria-label="搜尋WhatsApp"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="wa-filters">
                {["全部", "未讀", "群組"].map((f) => (
                  <button
                    key={f}
                    className={filter === f ? "selected" : ""}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {conversations
                .filter((t) => t.includes(query))
                .filter(
                  (t) =>
                    filter !== "群組" ||
                    p.items.some((i) => i.title === t && i.folder === "群組"),
                )
                .map((t) => {
                  const last = p.items.filter((i) => i.title === t).at(-1)!;
                  return (
                    <button
                      className="wa-chat-row"
                      key={t}
                      onClick={() => {
                        p.onThread(t);
                        p.onRead(t);
                      }}
                    >
                      <Avatar name={t} src={last.avatar} round />
                      <div>
                        <strong>{t}</strong>
                        <p>
                          {last.outgoing && <CheckCheck size={12} />}{" "}
                          {last.body}
                        </p>
                      </div>
                      <time>{last.time.slice(-5)}</time>
                    </button>
                  );
                })}
            </>
          ) : tab === "設定" ? (
            <>
              <div className="wa-settings-profile">
                <Avatar name="我" round />
                <h2>個人資料</h2>
              </div>
              {p.items
                .filter((i) => i.folder === "設定")
                .map((i) => (
                  <button
                    key={i.id}
                    className="wa-record"
                    onClick={() => p.onItem(i)}
                  >
                    {i.title}
                    <span>›</span>
                  </button>
                ))}
            </>
          ) : (
            <>
              {tab === "動態" && (
                <div className="wa-status">
                  <Avatar name="我" round />
                  <span>我的狀態</span>
                  {p.creator && (
                    <button aria-label="新增狀態" onClick={p.onAdd}>
                      <Plus size={17} />
                    </button>
                  )}
                </div>
              )}
              {p.items
                .filter(
                  (i) =>
                    i.folder === tab || (tab === "通話" && i.kind === "call"),
                )
                .map((i) => (
                  <button
                    className="wa-record"
                    key={i.id}
                    onClick={() => p.onItem(i)}
                  >
                    <Avatar name={i.sender} src={i.avatar} round />
                    <div>
                      <strong>{i.title}</strong>
                      <p>{i.body}</p>
                    </div>
                    <span>
                      {tab === "通話" ? (
                        <Phone size={17} />
                      ) : (
                        <ChevronLeft size={15} />
                      )}
                    </span>
                  </button>
                ))}
              {!p.items.some((i) => i.folder === tab) && (
                <p className="skin-empty">暫無{tab}內容</p>
              )}
            </>
          )}
          {p.creator && (
            <button className="phone-add" onClick={p.onAdd}>
              新增{tab === "聊天" ? "聊天" : tab}內容
            </button>
          )}
        </div>
      )}
      {!p.thread && (
        <nav className="wa-bottom">
          {tabs.map((t) => (
            <button
              className={tab === t.label ? "selected" : ""}
              key={t.label}
              onClick={() => setTab(t.label)}
            >
              <t.icon size={20} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
export function InstagramSkin(p: SkinProps) {
  const [tab, setTab] = useState("首頁"),
    [dm, setDm] = useState(false),
    [query, setQuery] = useState(""),
    [likes, setLikes] = useSkinState<string[]>(p, "likes", []),
    [saved, setSaved] = useSkinState<string[]>(p, "saved", []),
    [showSaved, setShowSaved] = useState(false);
  const posts = p.items.filter(
      (i) =>
        i.kind === "post" ||
        !["私信", "Story", "Reels", "個人首頁"].includes(i.folder),
    ),
    stories = p.items.filter((i) => i.folder === "Story"),
    reels = p.items.filter((i) => i.kind === "video" || i.folder === "Reels"),
    messages = p.items.filter((i) => i.folder === "私信");
  const tabs = [
    { label: "首頁", icon: Home },
    { label: "搜尋", icon: Search },
    { label: "Reels", icon: Play },
    { label: "個人首頁", icon: User },
  ];
  const shown = (
    showSaved ? posts.filter((i) => saved.includes(i.id)) : posts
  ).filter((i) => (i.title + i.body + i.sender).includes(query));
  return (
    <div className="instagram-ui independent-skin">
      <div className="app-nav ig-nav">
        <button
          aria-label="返回"
          onClick={() => (dm ? setDm(false) : p.onBack())}
        >
          <ChevronLeft size={22} />
        </button>
        <strong>{dm ? "私信" : p.name}</strong>
        <div>
          {p.creator && (
            <button aria-label="新增內容" onClick={p.onAdd}>
              <Plus size={21} />
            </button>
          )}
          <button aria-label="Instagram 私信" onClick={() => setDm(!dm)}>
            <Send size={20} />
          </button>
        </div>
      </div>
      <div className="skin-scroll ig-scroll">
        {dm ? (
          <>
            {messages.map((i) => (
              <button
                key={i.id}
                className="ig-dm-row"
                onClick={() => p.onItem(i)}
              >
                <Avatar name={i.sender} round />
                <div>
                  <strong>{i.sender}</strong>
                  <p>{i.body}</p>
                </div>
              </button>
            ))}
            {!messages.length && <p className="skin-empty">暫無私信</p>}
            {p.creator && (
              <button className="phone-add" onClick={p.onAdd}>
                新增私信
              </button>
            )}
          </>
        ) : tab === "首頁" ? (
          <>
            <div className="ig-stories">
              <button
                className="ig-story"
                onClick={
                  p.creator
                    ? p.onAdd
                    : () => {
                        if (stories[0]) p.onItem(stories[0]);
                      }
                }
                disabled={!p.creator && !stories.length}
              >
                <span>
                  <Avatar name="我" round />
                </span>
                <small>你的快拍</small>
              </button>
              {stories.map((i) => (
                <button
                  key={i.id}
                  className="ig-story"
                  onClick={() => p.onItem(i)}
                >
                  <span>
                    <Avatar name={i.sender} round />
                  </span>
                  <small>{i.sender}</small>
                </button>
              ))}
            </div>
            {posts.map((i) => (
              <article className="ig-post" key={i.id}>
                <div className="ig-post-author">
                  <Avatar name={i.sender} round />
                  <strong>{i.sender}</strong>
                  <button
                    aria-label={`帖子詳情${i.title}`}
                    onClick={() => p.onItem(i)}
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </div>
                <button className="ig-post-media" onClick={() => p.onItem(i)}>
                  <ItemMedia item={i} />
                </button>
                <div className="ig-post-controls">
                  <button
                    aria-label={`喜歡${i.title}`}
                    onClick={() =>
                      setLikes(
                        likes.includes(i.id)
                          ? likes.filter((x) => x !== i.id)
                          : [...likes, i.id],
                      )
                    }
                  >
                    <Heart
                      size={23}
                      fill={likes.includes(i.id) ? "#ed4956" : "none"}
                      color={likes.includes(i.id) ? "#ed4956" : "currentColor"}
                    />
                  </button>
                  <button
                    aria-label={`評論${i.title}`}
                    onClick={() => p.onItem(i)}
                  >
                    <MessageCircle size={22} />
                  </button>
                  <button
                    aria-label={`檢視${i.title}`}
                    onClick={() => p.onItem(i)}
                  >
                    <Send size={21} />
                  </button>
                  <button
                    aria-label={`收藏${i.title}`}
                    onClick={() =>
                      setSaved(
                        saved.includes(i.id)
                          ? saved.filter((x) => x !== i.id)
                          : [...saved, i.id],
                      )
                    }
                  >
                    <Bookmark
                      size={22}
                      fill={saved.includes(i.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <div className="ig-post-caption">
                  <strong>
                    {i.likes + (likes.includes(i.id) ? 1 : 0)} 次贊
                  </strong>
                  <p>
                    <b>{i.sender}</b> {i.body}
                  </p>
                  <button onClick={() => p.onItem(i)}>
                    檢視全部 {i.comments.length} 條評論
                  </button>
                  <time>{i.time}</time>
                </div>
              </article>
            ))}
          </>
        ) : tab === "搜尋" ? (
          <>
            <label className="ig-search">
              <Search size={15} />
              <input
                value={query}
                aria-label="搜尋Instagram"
                placeholder="搜尋"
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="ig-explore">
              {shown.map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  <ItemMedia item={i} />
                </button>
              ))}
            </div>
          </>
        ) : tab === "Reels" ? (
          <>
            {reels.map((i) => (
              <div className="ig-reel" key={i.id}>
                <ItemMedia item={i} />
                <button onClick={() => p.onItem(i)}>
                  {i.sender} · {i.title}
                </button>
              </div>
            ))}
            {!reels.length && <p className="skin-empty">暫無 Reels</p>}
          </>
        ) : (
          <>
            <div className="ig-profile">
              <Avatar name={posts[0]?.sender ?? "我"} round />
              <div>
                <strong>{posts.length}</strong>
                <small>帖子</small>
              </div>
              <div>
                <strong>0</strong>
                <small>關注者</small>
              </div>
              <div>
                <strong>0</strong>
                <small>正在關注</small>
              </div>
            </div>
            <h3 className="ig-profile-name">{posts[0]?.sender ?? "我"}</h3>
            <div className="ig-profile-tabs">
              <button aria-label="帖子網格" onClick={() => setShowSaved(false)}>
                <Grid size={21} />
              </button>
              <button
                aria-label="已收藏帖子"
                onClick={() => setShowSaved(true)}
              >
                <Bookmark size={21} />
              </button>
              <button
                aria-label="資料內容"
                onClick={() => {
                  const i = p.items.find((i) => i.folder === "個人首頁");
                  if (i) p.onItem(i);
                  else if (p.creator) p.onAdd();
                }}
              >
                <AtSign size={21} />
              </button>
            </div>
            <div className="ig-explore">
              {shown.map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  <ItemMedia item={i} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <nav className="ig-bottom">
        {tabs.map((t) => (
          <button
            key={t.label}
            className={tab === t.label ? "selected" : ""}
            aria-label={`Instagram ${t.label}`}
            onClick={() => {
              setTab(t.label);
              setDm(false);
            }}
          >
            <t.icon size={23} />
          </button>
        ))}
      </nav>
    </div>
  );
}
