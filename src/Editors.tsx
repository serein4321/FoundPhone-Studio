import { getFields } from "./fields";
import { useState, lazy, Suspense } from "react";
import { X, Trash2, ImagePlus, Check } from "lucide-react";
import { type Item, type Work, itemSchema, safeMedia } from "./schema";
import { mediaData } from "./io";
import { parseChat, parseCsv } from "./chat";
import { getApp } from "./registry";
const RichEditor = lazy(() => import("./RichEditor"));
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <header>
          <div>
            <span className="eyebrow">FOUNDPHONE STUDIO</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" aria-label="關閉" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function ItemEditor({
  item,
  app,
  onSave,
  onDelete,
  onClose,
}: {
  item: Item;
  app: string;
  onSave: (i: Item) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [draft, set] = useState(item);
  const [error, setError] = useState("");
  const setField = <K extends keyof Item>(key: K, value: Item[K]) =>
    set((s) => ({ ...s, [key]: value }));
  const plugin = getApp(app);
  return (
    <Modal
      title={`編輯${plugin.engine === "messaging" ? "訊息" : "內容"} · ${plugin.name}`}
      onClose={onClose}
    >
      <div className="editor-fields">
        <label>
          內容 ID
          <input
            aria-label="內容 ID"
            readOnly
            value={draft.id}
            onFocus={(e) => e.target.select()}
          />
        </label>
        <div className="two-cols">
          <label>
            {plugin.engine === "messaging" ? "會話名稱" : "標題"}
            <input
              value={draft.title}
              onChange={(e) => setField("title", e.target.value)}
            />
          </label>
          <label>
            傳送者 / 作者
            <input
              value={draft.sender}
              onChange={(e) => setField("sender", e.target.value)}
            />
          </label>
        </div>
        <div className="two-cols">
          <label>
            時間
            <input
              value={draft.time}
              onChange={(e) => setField("time", e.target.value)}
            />
          </label>
          <label>
            內容類型
            <select
              value={draft.kind}
              onChange={(e) => setField("kind", e.target.value as Item["kind"])}
            >
              {[
                "text",
                "image",
                "audio",
                "video",
                "file",
                "transfer",
                "call",
                "order",
                "note",
                "post",
                "event",
              ].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
        </div>
        {["messaging", "social"].includes(plugin.engine) && (
          <label className="upload-zone">
            <ImagePlus size={20} />
            <span>傳送者頭像</span>
            <input
              type="file"
              aria-label="上傳傳送者頭像"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  setField("avatar", await mediaData(f));
                  setError("");
                } catch (err) {
                  setError(String(err));
                }
              }}
            />
            {draft.avatar && (
              <>
                <img
                  className="avatar-preview"
                  src={safeMedia(draft.avatar)}
                  alt="頭像預覽"
                />
                <button type="button" onClick={() => setField("avatar", "")}>
                  移除頭像
                </button>
              </>
            )}
          </label>
        )}
        {getFields(app).length > 0 && (
          <div className="two-cols">
            {getFields(app).map((field) => (
              <label key={field.key}>
                {field.label}
                <input
                  type={field.type ?? "text"}
                  value={draft.meta?.[field.key] ?? ""}
                  onChange={(e) =>
                    setField("meta", {
                      ...draft.meta,
                      [field.key]: e.target.value,
                    })
                  }
                />
              </label>
            ))}
          </div>
        )}
        <label>
          故事內容
          {plugin.engine === "document" ? (
            <>
              <Suspense fallback={<p>正在開啟編輯器…</p>}>
                <RichEditor
                  item={item}
                  onChange={(patch) => set((s) => ({ ...s, ...patch }))}
                />
              </Suspense>
            </>
          ) : (
            <textarea
              rows={5}
              value={draft.body}
              onChange={(e) => setField("body", e.target.value)}
            />
          )}
        </label>
        <div className="two-cols">
          <label>
            資料夾 / App 分欄
            <input
              list="item-folders"
              value={draft.folder}
              onChange={(e) => setField("folder", e.target.value)}
              placeholder="可輸入新的分組或頻道名稱"
            />
            <datalist id="item-folders">
              {[...new Set([...plugin.tabs, draft.folder])]
                .filter(Boolean)
                .map((t) => (
                  <option key={t} value={t} />
                ))}
            </datalist>
          </label>
          <label>
            內容密碼
            <input
              value={draft.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="可留空"
            />
          </label>
        </div>
        <label className="upload-zone">
          <ImagePlus size={20} />
          <span>
            {draft.media ? "替換已上傳素材" : "新增圖片、音頻或視訊"}
            <small>僅本地儲存 · 圖片自動壓縮 · 單檔案 20 MB</small>
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,audio/*,video/mp4,video/webm"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const data = await mediaData(f);
                set((s) => ({
                  ...s,
                  media: data,
                  kind: f.type.startsWith("image")
                    ? "image"
                    : f.type.startsWith("audio")
                      ? "audio"
                      : "video",
                }));
                setError("");
              } catch (err) {
                setError(String(err));
              }
            }}
          />
        </label>
        {draft.media && (
          <button className="text-button" onClick={() => setField("media", "")}>
            移除素材
          </button>
        )}
        <div className="check-row">
          <label>
            <input
              type="checkbox"
              checked={draft.outgoing}
              onChange={(e) => setField("outgoing", e.target.checked)}
            />
            本人傳送
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.hidden}
              onChange={(e) => setField("hidden", e.target.checked)}
            />
            初始隱藏
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.favorite}
              onChange={(e) => setField("favorite", e.target.checked)}
            />
            收藏
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.read}
              onChange={(e) => setField("read", e.target.checked)}
            />
            已讀
          </label>
        </div>
        <label>
          解鎖變量
          <input
            placeholder="例如 found（變量為 true 時顯示）"
            value={draft.unlock}
            onChange={(e) => setField("unlock", e.target.value)}
          />
        </label>
        {plugin.engine === "social" && (
          <>
            <label>
              虛構點贊數
              <input
                type="number"
                min="0"
                value={draft.likes}
                onChange={(e) => setField("likes", Number(e.target.value))}
              />
            </label>
            <label>
              評論（每行一條）
              <textarea
                value={draft.comments.join("\n")}
                onChange={(e) =>
                  setField(
                    "comments",
                    e.target.value.split("\n").filter(Boolean),
                  )
                }
              />
            </label>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
      <footer>
        <button className="danger ghost" onClick={onDelete}>
          <Trash2 size={15} />
          刪除
        </button>
        <button
          className="primary"
          onClick={() => {
            const parsed = itemSchema.safeParse(draft);
            if (parsed.success) onSave(parsed.data);
            else setError(parsed.error.message);
          }}
        >
          <Check size={16} />
          儲存內容
        </button>
      </footer>
    </Modal>
  );
}
export function PhoneSettings({
  work,
  onChange,
  onClose,
}: {
  work: Work;
  onChange: (fn: (w: Work) => void) => void;
  onClose: () => void;
}) {
  const [draft, set] = useState(work.phone);
  return (
    <Modal title="手機設定" onClose={onClose}>
      <div className="editor-fields">
        <div className="two-cols">
          <label>
            機主名稱
            <input
              value={draft.owner}
              onChange={(e) => set({ ...draft, owner: e.target.value })}
            />
          </label>
          <label>
            鎖屏密碼
            <input
              maxLength={12}
              value={draft.passcode}
              onChange={(e) => set({ ...draft, passcode: e.target.value })}
            />
          </label>
        </div>
        <label>
          壁紙
          <div className="wallpaper-options">
            {["sage", "sand", "night", "rose"].map((w) => (
              <button
                key={w}
                aria-label={`選擇${w}壁紙`}
                className={`wallpaper-${w} ${draft.wallpaper === w ? "chosen" : ""}`}
                onClick={() => set({ ...draft, wallpaper: w })}
              >
                {draft.wallpaper === w && <Check size={16} />}
              </button>
            ))}
          </div>
        </label>
        <div className="two-cols">
          <label>
            主題
            <select
              value={draft.theme}
              onChange={(e) =>
                set({ ...draft, theme: e.target.value as "light" | "dark" })
              }
            >
              <option value="light">淺色</option>
              <option value="dark">深色</option>
            </select>
          </label>
          <label>
            虛擬時間
            <input
              type="time"
              value={draft.time}
              onChange={(e) => set({ ...draft, time: e.target.value })}
            />
          </label>
          <label>
            電量
            <input
              type="number"
              min={0}
              max={100}
              value={draft.battery}
              onChange={(e) =>
                set({
                  ...draft,
                  battery: Math.max(0, Math.min(100, Number(e.target.value))),
                })
              }
            />
          </label>
          <label>
            網路
            <input
              value={draft.network}
              onChange={(e) => set({ ...draft, network: e.target.value })}
            />
          </label>
        </div>
        <label>
          <input
            type="checkbox"
            checked={draft.notifications}
            onChange={(e) => set({ ...draft, notifications: e.target.checked })}
          />
          顯示劇情通知
        </label>
      </div>
      <footer>
        <span>設定會用於創作器和獨立玩家。</span>
        <button
          className="primary"
          onClick={() => {
            onChange((w) => {
              w.phone = draft;
            });
            onClose();
          }}
        >
          儲存設定
        </button>
      </footer>
    </Modal>
  );
}
export function BatchImport({
  onImport,
  onClose,
}: {
  onImport: (items: Item[]) => void;
  onClose: () => void;
}) {
  const [text, set] = useState(
    "[2026-09-01 08:30] 小林：你到學校了嗎？\n[2026-09-01 08:31] 我：還沒，快到了。",
  );
  const [format, setFormat] = useState("script");
  const [me, setMe] = useState("我");
  const [conversation, setConversation] = useState("小林");
  let parsed: { items: Item[]; errors: string[] };
  try {
    parsed =
      format === "csv"
        ? parseCsv(text)
        : format === "json"
          ? { items: itemSchema.array().parse(JSON.parse(text)), errors: [] }
          : parseChat(text);
  } catch (e) {
    parsed = { items: [], errors: [String(e)] };
  }
  return (
    <Modal title="批量導入聊天" onClose={onClose}>
      <div className="editor-fields">
        <div className="two-cols">
          <label>
            格式
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="script">聊天腳本</option>
              <option value="csv">CSV · time,sender,body</option>
              <option value="json">JSON · Item[]</option>
            </select>
          </label>
          <label>
            會話名稱
            <input
              value={conversation}
              onChange={(e) => setConversation(e.target.value)}
            />
          </label>
        </div>
        <label>
          代表機主的傳送者
          <input value={me} onChange={(e) => setMe(e.target.value)} />
        </label>
        <textarea rows={8} value={text} onChange={(e) => set(e.target.value)} />
        <div className="import-preview">
          <strong>解析預覽 · {parsed.items.length} 條</strong>
          {parsed.items.slice(0, 20).map((i) => (
            <p key={i.id}>
              <small>{i.time}</small> <b>{i.sender}</b>：{i.body}
            </p>
          ))}
        </div>
        {parsed.errors.map((e, i) => (
          <p key={i} className="error">
            {e}
          </p>
        ))}
      </div>
      <footer>
        <span>確認後寫入目前 App，可撤銷。</span>
        <button
          className="primary"
          disabled={!!parsed.errors.length || !parsed.items.length}
          onClick={() =>
            onImport(
              parsed.items.map((i) => ({
                ...i,
                title: conversation,
                outgoing: i.sender === me,
              })),
            )
          }
        >
          確認導入
        </button>
      </footer>
    </Modal>
  );
}
