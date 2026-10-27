import { useSkinState } from "../skinState";
import {
  ArrowDown,
  ArrowUp,
  AtSign,
  Bookmark,
  Camera,
  ChevronRight,
  Grid,
  Hash,
  Heart,
  Home,
  MessageCircle,
  Repeat2,
  User,
  Users,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import type { Item } from "../schema";
import {
  Avatar,
  Empty,
  groupItems,
  Header,
  Media,
  meta,
  SearchBox,
  Tabs,
  useContent,
  type Props,
} from "./shared";
function Actions({ p, item }: { p: Props; item: Item }) {
  const [liked, setLiked] = useSkinState<boolean>(p, `liked-${item.id}`, false),
    [saved, setSaved] = useSkinState<boolean>(p, `saved-${item.id}`, false);
  return (
    <div className="social-actions">
      <button aria-label={`喜歡${item.title}`} onClick={() => setLiked(!liked)}>
        <Heart size={17} fill={liked ? "currentColor" : "none"} />
        {item.likes + (liked ? 1 : 0) || ""}
      </button>
      <button aria-label={`評論${item.title}`} onClick={() => p.onItem(item)}>
        <MessageCircle size={17} />
        {item.comments.length || ""}
      </button>
      <button aria-label={`詳情${item.title}`} onClick={() => p.onItem(item)}>
        <Repeat2 size={17} />
        {meta(item, "reposts")}
      </button>
      <button aria-label={`收藏${item.title}`} onClick={() => setSaved(!saved)}>
        <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
function PostHeader({ item, p }: { item: Item; p: Props }) {
  return (
    <button className="social-author" onClick={() => p.onItem(item)}>
      <Avatar name={item.sender} />
      <span>
        <strong>{item.sender}</strong>
        <small>{meta(item, "handle", item.time)}</small>
      </span>
    </button>
  );
}
function WeiboActions({ p, item }: { p: Props; item: Item }) {
  const [liked, setLiked] = useSkinState<boolean>(p, `liked-${item.id}`, false);
  return (
    <div className="social-actions weibo-actions">
      <button aria-label={`轉發${item.title}`} onClick={() => p.onItem(item)}>
        <Share2 size={17} />
        {meta(item, "reposts", "轉發")}
      </button>
      <button aria-label={`評論${item.title}`} onClick={() => p.onItem(item)}>
        <MessageCircle size={17} />
        {item.comments.length || "評論"}
      </button>
      <button
        aria-label={`喜歡${item.title}`}
        aria-pressed={liked}
        onClick={() => setLiked(!liked)}
      >
        <ThumbsUp size={17} fill={liked ? "currentColor" : "none"} />
        {item.likes + (liked ? 1 : 0) || "贊"}
      </button>
    </div>
  );
}
export function WeiboSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "關注");
  const [feed, setFeed] = useState("全部");
  const list = feed === "全部" ? items : items.filter((i) => i.folder === feed);
  return (
    <div className="catalog-skin weibo-ui">
      <Header p={p} />
      <div className="weibo-sections">
        {["關注", "發現", "我"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="catalog-scroll">
        {tab === "我" ? (
          <div className="weibo-profile">
            <Avatar name={p.owner ?? "我"} />
            <h2>{p.owner ?? "我"}</h2>
            <span>{items.length} 條微博</span>
          </div>
        ) : (
          <>
            <SearchBox value={q} set={setQ} />
            <div className="weibo-feed-filter">
              {["全部", ...groupItems(items).filter((g) => g !== "未分類")].map(
                (g) => (
                  <button key={g} onClick={() => setFeed(g)}>
                    {g}
                  </button>
                ),
              )}
            </div>
          </>
        )}
        {list.map((i) => (
          <article className="weibo-post" key={i.id}>
            <PostHeader p={p} item={i} />
            <button className="social-body" onClick={() => p.onItem(i)}>
              <p>{i.body}</p>
              {i.media && <Media item={i} />}
            </button>
            <WeiboActions p={p} item={i} />
          </article>
        ))}
        <Empty items={list} />
      </div>
    </div>
  );
}
export function XSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "為你推薦");
  return (
    <div className="catalog-skin x-ui">
      <Header p={p} />
      <div className="x-feed-tabs">
        <button
          className={tab === "為你推薦" ? "selected" : ""}
          onClick={() => setTab("為你推薦")}
        >
          為你推薦
        </button>
        <button
          className={tab === "正在關注" ? "selected" : ""}
          onClick={() => setTab("正在關注")}
        >
          正在關注
        </button>
      </div>
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {items
          .filter((i) => tab === "為你推薦" || i.folder === "正在關注")
          .map((i) => (
            <article className="x-post" key={i.id}>
              <Avatar name={i.sender} />
              <div>
                <button className="x-byline" onClick={() => p.onItem(i)}>
                  <strong>{i.sender}</strong>
                  <span>
                    @{meta(i, "handle", i.sender)} · {i.time.slice(5, 10)}
                  </span>
                </button>
                <button className="social-body" onClick={() => p.onItem(i)}>
                  <p>{i.body}</p>
                  {i.media && <Media item={i} />}
                </button>
                <Actions p={p} item={i} />
              </div>
            </article>
          ))}
      </div>
      <Tabs
        tabs={["為你推薦", "正在關注"]}
        value={tab}
        set={setTab}
        icons={[<Home />, <Users />]}
      />
    </div>
  );
}
export function ThreadsSkin(p: Props) {
  const { tab, setTab, items } = useContent(p, "為你推薦");
  return (
    <div className="catalog-skin threads-ui">
      <Header p={p} />
      <div className="threads-title">
        <AtSign size={30} />
        <button
          onClick={() => setTab(tab === "為你推薦" ? "正在關注" : "為你推薦")}
        >
          {tab} ⌄
        </button>
      </div>
      <div className="catalog-scroll">
        {(tab === "個人首頁"
          ? items
          : items.filter((i) => tab !== "正在關注" || i.folder === "正在關注")
        ).map((i) => (
          <article className="threads-post" key={i.id}>
            <div className="thread-avatar">
              <Avatar name={i.sender} />
              <i />
            </div>
            <div>
              <div className="threads-byline">
                <strong>{i.sender}</strong>
                <small>{i.time.slice(5, 10)}</small>
              </div>
              <button className="social-body" onClick={() => p.onItem(i)}>
                <p>{i.body}</p>
                {i.media && <Media item={i} />}
              </button>
              <Actions p={p} item={i} />
              <button className="thread-replies" onClick={() => p.onItem(i)}>
                {i.comments.length} 條回復
              </button>
            </div>
          </article>
        ))}
        <Empty items={items} />
      </div>
      <Tabs
        tabs={["為你推薦", "正在關注", "個人首頁"]}
        value={tab}
        set={setTab}
        icons={[<Home />, <Users />, <User />]}
      />
    </div>
  );
}
export function FacebookSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "動態");
  const stories = items.filter((i) => i.folder === "Story");
  return (
    <div className="catalog-skin facebook-ui">
      <Header p={p} />
      <Tabs
        tabs={["動態", "好友", "個人首頁"]}
        value={tab}
        set={setTab}
        icons={[<Home />, <Users />, <User />]}
      />
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {tab === "動態" ? (
          <>
            <button
              className="fb-compose"
              disabled={!p.creator}
              onClick={p.onAdd}
            >
              <Avatar name={p.owner ?? "我"} />
              分享新動態
            </button>
            <div className="fb-stories">
              {stories.map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  <Media item={i} />
                  <strong>{i.sender}</strong>
                </button>
              ))}
            </div>
            {items
              .filter((i) => i.folder !== "Story")
              .map((i) => (
                <article className="fb-post" key={i.id}>
                  <PostHeader p={p} item={i} />
                  <button className="social-body" onClick={() => p.onItem(i)}>
                    <p>{i.body}</p>
                    {i.media && <Media item={i} />}
                  </button>
                  <Actions p={p} item={i} />
                </article>
              ))}
          </>
        ) : tab === "好友" ? (
          <div className="fb-friends">
            {[...new Set(items.map((i) => i.sender))].map((s) => (
              <button
                key={s}
                onClick={() => p.onItem(items.find((i) => i.sender === s)!)}
              >
                <Avatar name={s} />
                <strong>{s}</strong>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="fb-cover" />
            <div className="fb-profile">
              <Avatar name={p.owner ?? "我"} />
              <h1>{p.owner ?? "我"}</h1>
            </div>
            {items
              .filter((i) => i.folder === "個人首頁")
              .map((i) => (
                <button
                  key={i.id}
                  className="fb-profile-note"
                  onClick={() => p.onItem(i)}
                >
                  {i.title}
                  <p>{i.body}</p>
                </button>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
export function RedbookSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "發現");
  const list =
    tab === "收藏"
      ? items.filter((i) => i.favorite)
      : tab === "關注"
        ? items.filter((i) => i.folder === "關注")
        : items;
  return (
    <div className="catalog-skin redbook-ui">
      <Header p={p} />
      <div className="redbook-top">
        {["關注", "發現", "收藏"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        <div className="redbook-masonry">
          {list.map((i) => (
            <button key={i.id} onClick={() => p.onItem(i)}>
              <Media item={i} />
              <strong>{i.title}</strong>
              <div>
                <Avatar name={i.sender} />
                <small>{i.sender}</small>
                <Heart size={12} />
                <small>{i.likes}</small>
              </div>
            </button>
          ))}
        </div>
        <Empty items={list} />
      </div>
      <Tabs
        tabs={["發現", "收藏"]}
        value={tab}
        set={setTab}
        icons={[<Home />, <Bookmark />]}
      />
    </div>
  );
}
export function PinterestSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "發現");
  const [board, setBoard] = useState("");
  const list = board
    ? items.filter((i) => (i.folder || "未分類") === board)
    : items;
  return (
    <div className="catalog-skin pinterest-ui">
      <Header p={p} />
      <div className="catalog-scroll">
        {tab === "收藏板" && !board ? (
          <>
            <h1>收藏板</h1>
            <div className="pinterest-boards">
              {groupItems(items).map((g) => (
                <button key={g} onClick={() => setBoard(g)}>
                  <Media
                    item={items.find((i) => (i.folder || "未分類") === g)!}
                  />
                  <strong>{g}</strong>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <SearchBox value={q} set={setQ} />
            {board && (
              <button
                className="pinterest-board-title"
                onClick={() => setBoard("")}
              >
                {board} · 返回收藏板
              </button>
            )}
            <div className="pinterest-pins">
              {list.map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  <Media item={i} />
                  <strong>{i.title}</strong>
                </button>
              ))}
            </div>
            <Empty items={list} />
          </>
        )}
      </div>
      <Tabs
        tabs={["發現", "收藏板"]}
        value={tab}
        set={(t) => {
          setTab(t);
          setBoard("");
        }}
        icons={[<Home />, <Grid />]}
      />
    </div>
  );
}
export function RedditSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "首頁");
  const [sort, setSort] = useState("最新");
  const list = [...items].sort((a, b) =>
    sort === "熱門" ? b.likes - a.likes : b.time.localeCompare(a.time),
  );
  return (
    <div className="catalog-skin reddit-ui">
      <Header p={p} />
      <div className="reddit-community">
        <Hash size={21} />
        <button onClick={() => setTab(tab === "首頁" ? "社區" : "首頁")}>
          {tab} ⌄
        </button>
        <select
          aria-label="帖子排序"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option>最新</option>
          <option>熱門</option>
        </select>
      </div>
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {tab === "社區"
          ? groupItems(items).map((g) => (
              <button
                className="reddit-sub"
                key={g}
                onClick={() => {
                  setQ(g === "未分類" ? "" : g);
                  setTab("首頁");
                }}
              >
                <Hash size={22} />
                {g}
                <small>
                  {items.filter((i) => (i.folder || "未分類") === g).length} 帖
                </small>
              </button>
            ))
          : list.map((i) => <RedditPost key={i.id} p={p} item={i} />)}
        <Empty items={items} />
      </div>
      <Tabs
        tabs={["首頁", "社區"]}
        value={tab}
        set={setTab}
        icons={[<Home />, <Users />]}
      />
    </div>
  );
}
function RedditPost({ p, item: i }: { p: Props; item: Item }) {
  const [vote, setVote] = useSkinState<number>(p, `vote-${i.id}`, 0);
  return (
    <article className="reddit-post">
      <button className="reddit-byline" onClick={() => p.onItem(i)}>
        r/{meta(i, "community", i.folder || "story")} · u/{i.sender}
      </button>
      <button className="social-body" onClick={() => p.onItem(i)}>
        <h3>{i.title}</h3>
        <p>{i.body}</p>
        {i.media && <Media item={i} />}
      </button>
      <div className="reddit-actions">
        <button
          aria-label={`贊同${i.title}`}
          onClick={() => setVote(vote === 1 ? 0 : 1)}
        >
          <ArrowUp size={17} />
        </button>
        <span>{Number(meta(i, "votes", String(i.likes))) + vote}</span>
        <button
          aria-label={`反對${i.title}`}
          onClick={() => setVote(vote === -1 ? 0 : -1)}
        >
          <ArrowDown size={17} />
        </button>
        <button onClick={() => p.onItem(i)}>
          <MessageCircle size={16} />
          {i.comments.length} 評論
        </button>
      </div>
    </article>
  );
}
export function ForumSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "帖子");
  const [board, setBoard] = useState("");
  const list = board
    ? items.filter((i) => (i.folder || "未分類") === board)
    : items;
  return (
    <div className="catalog-skin forum-ui">
      <Header p={p} />
      <div className="forum-banner">
        <Hash size={27} />
        <strong>{board || "論壇"}</strong>
        <span>{items.length} 個主題</span>
      </div>
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {tab === "版塊"
          ? groupItems(items).map((g) => (
              <button
                className="forum-board"
                key={g}
                onClick={() => {
                  setBoard(g);
                  setTab("帖子");
                }}
              >
                <FolderIcon />
                <div>
                  <strong>{g}</strong>
                  <small>
                    {items.filter((i) => (i.folder || "未分類") === g).length}{" "}
                    個主題
                  </small>
                </div>
                <ChevronRight size={16} />
              </button>
            ))
          : list.map((i) => (
              <button
                className="forum-topic"
                key={i.id}
                onClick={() => p.onItem(i)}
              >
                <strong>
                  {meta(i, "status") && <em>{meta(i, "status")}</em>}
                  {i.title}
                </strong>
                <p>{i.body.split("\n")[0]}</p>
                <div>
                  <span>
                    {i.sender} · {i.time.slice(5, 16)}
                  </span>
                  <span>
                    {meta(i, "views", "—")} 瀏覽 · {i.comments.length} 回復
                  </span>
                </div>
              </button>
            ))}
      </div>
      <Tabs
        tabs={["帖子", "版塊"]}
        value={tab}
        set={(t) => {
          setTab(t);
          setBoard("");
        }}
        icons={[<MessageCircle />, <Grid />]}
      />
    </div>
  );
}
function FolderIcon() {
  return <Hash size={27} />;
}
export function SnapchatSkin(p: Props) {
  const { tab, setTab, items } = useContent(p, "快拍");
  const [index, setIndex] = useState(0);
  const list = items.filter((i) =>
    tab === "回憶"
      ? i.favorite || i.folder === "回憶"
      : tab === "聊天"
        ? i.folder === "聊天"
        : i.folder !== "聊天",
  );
  const i = list[index % Math.max(list.length, 1)];
  return (
    <div className="catalog-skin snapchat-ui">
      <Header p={p} />
      <div className="snap-content">
        {tab === "聊天" ? (
          <div className="snap-chats">
            {list.map((x) => (
              <button key={x.id} onClick={() => p.onItem(x)}>
                <Avatar name={x.sender} />
                <div>
                  <strong>{x.sender}</strong>
                  <small>{x.body}</small>
                </div>
                <Camera size={20} />
              </button>
            ))}
          </div>
        ) : i ? (
          <>
            <Media item={i} />
            <button className="snap-author" onClick={() => p.onItem(i)}>
              <Avatar name={i.sender} />
              {i.sender}
            </button>
            <button
              className="snap-next"
              aria-label="下一條快拍"
              onClick={() => {
                setIndex((n) => n + 1);
                p.onRead(i.id);
              }}
            >
              <ChevronRight size={25} />
            </button>
            <button className="snap-caption" onClick={() => p.onItem(i)}>
              {i.body}
            </button>
          </>
        ) : (
          <p className="catalog-empty">暫無{tab}</p>
        )}
      </div>
      <Tabs
        tabs={["聊天", "快拍", "回憶"]}
        value={tab}
        set={(t) => {
          setTab(t);
          setIndex(0);
        }}
        icons={[<MessageCircle />, <Camera />, <ImageIcon />]}
      />
    </div>
  );
}
function ImageIcon() {
  return <Grid />;
}
