import { AppManager } from "./AppLibrary";
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  Smartphone,
  LayoutGrid,
  GitBranch,
  FolderOpen,
  Settings2,
  Undo2,
  Redo2,
  Play,
  Download,
  Plus,
  ChevronDown,
  ArrowUpRight,
  Check,
  BookOpen,
  Upload,
  FileJson,
  Package,
  Globe,
  Copy,
  Trash2,
  ChevronRight,
  PanelRightClose,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useStudio } from "./store";
import { Phone } from "./Phone";
import { getApp } from "./registry";
import {
  makeItem,
  initialRuntime,
  type Work,
  type Item,
  type Runtime,
} from "./schema";
import { ItemEditor, PhoneSettings, BatchImport, Modal } from "./Editors";
import { jsonExport, backup, staticExport, importWork, mediaData } from "./io";
import { dispatch } from "./engine";
import "./styles.css";
const StoryEditor = lazy(() =>
  import("./StoryEditor").then((m) => ({ default: m.StoryEditor })),
);
function Studio() {
  const store = useStudio();
  const { work, works, change } = store;
  const [view, setView] = useState("phone");
  const [app, setApp] = useState("messages");
  const [editing, setEditing] = useState<{ app: string; item: Item } | null>(
    null,
  );
  const [modal, setModal] = useState("");
  const [preview, setPreview] = useState<Work | null>(null);
  const [runtime, setRuntime] = useState<Runtime | undefined>();
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [busy, setBusy] = useState(false);
  const [side, setSide] = useState(true);
  const [phoneKey, setPhoneKey] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void useStudio.getState().load();
    const handler = () => {
      void useStudio.getState().flush();
    };
    window.addEventListener("pagehide", handler);
    return () => window.removeEventListener("pagehide", handler);
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void useStudio.getState().flush();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "z" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        if (e.shiftKey) useStudio.getState().redo();
        else useStudio.getState().undo();
      }
      if (e.key === "Escape") {
        setModal("");
        setEditing(null);
        setPreview(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  const run = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await fn();
      setNotice(message);
    } catch (e) {
      setNotice(String(e));
    } finally {
      setBusy(false);
    }
  };
  if (!work)
    return (
      <div className="boot">
        <Smartphone size={40} />
        <h1>撿手機</h1>
        <p>{store.error || "正在開啟你的故事工作室…"}</p>
      </div>
    );
  const count = Object.values(work.data).reduce(
    (n, items) => n + items.length,
    0,
  );
  const items = (work.data[app] ?? []).filter((i) =>
    (i.title + i.body).includes(search),
  );
  const startPreview = () => {
    const snapshot = structuredClone(work);
    setPreview(snapshot);
    setRuntime(dispatch(snapshot, initialRuntime(snapshot), "start"));
  };
  const edit = (app: string, item: Item) => {
    setApp(app);
    setEditing({ app, item });
  };
  const add = (app: string) =>
    edit(
      app,
      makeItem({
        title: getApp(app).engine === "messaging" ? "小林" : "新的故事片段",
        folder: getApp(app).tabs[0],
      }),
    );
  return (
    <div className="studio">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="FoundPhone 首頁">
          <span className="brand-mark">
            <Smartphone size={25} />
          </span>
          <span>
            撿手機<small>FOUNDPHONE STUDIO</small>
          </span>
        </a>
        <div className="workspace-label">
          創作空間 <span>LOCAL</span>
        </div>
        <nav>
          {[
            { id: "phone", icon: Smartphone, label: "手機創作" },
            { id: "story", icon: GitBranch, label: "劇情編排" },
            { id: "assets", icon: FolderOpen, label: "素材與內容" },
            { id: "works", icon: LayoutGrid, label: "我的作品" },
          ].map((t) => (
            <button
              key={t.id}
              className={view === t.id ? "active" : ""}
              onClick={() => setView(t.id)}
            >
              <t.icon size={18} />
              {t.label}
              {view === t.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="section-label">
          <span>目前作品</span>
          <button aria-label="新建作品" onClick={() => void store.add()}>
            <Plus size={15} />
          </button>
        </div>
        <button className="current-work" onClick={() => setView("works")}>
          <div className="work-thumb">
            <span>雨</span>
          </div>
          <div>
            <strong>{work.title}</strong>
            <small>{work.category}</small>
          </div>
          <ChevronRight size={13} />
        </button>

        <div className="sidebar-bottom">
          <button onClick={() => setModal("guide")}>
            <BookOpen size={17} />
            創作指南 <ArrowUpRight size={13} />
          </button>
          <button onClick={() => setModal("about")}>
            <Info size={17} />
            關於撿手機
          </button>
          <div className="local-status">
            <span />
            本地優先 · 無需登入
          </div>
        </div>
      </aside>
      <div className="main-workspace">
        <header className="topbar">
          <div className="breadcrumb">
            創作空間 <ChevronRight size={13} />
            <button onClick={() => setModal("metadata")}>
              {work.title}
              <ChevronDown size={13} />
            </button>
            <span className="draft-badge">草稿</span>
          </div>
          <div className="topbar-actions">
            <button
              className={`save-status ${store.error ? "error" : ""}`}
              onClick={() => void store.flush()}
            >
              <span className="save-dot" />
              {store.status}
            </button>
            <span className="toolbar-divider" />
            <button
              aria-label="撤銷"
              disabled={!store.past.length}
              onClick={store.undo}
            >
              <Undo2 size={17} />
            </button>
            <button
              aria-label="重做"
              disabled={!store.future.length}
              onClick={store.redo}
            >
              <Redo2 size={17} />
            </button>
            <button className="secondary compact" onClick={startPreview}>
              <Play size={14} />
              預覽
            </button>
            <button
              className="primary compact"
              onClick={() => setModal("export")}
            >
              <Download size={14} />
              導出作品
            </button>
          </div>
        </header>
        {view === "story" ? (
          <Suspense fallback={<div className="boot">正在載入劇情編輯器…</div>}>
            <StoryEditor work={work} onChange={change} />
          </Suspense>
        ) : view === "works" ? (
          <div className="library-page">
            <div className="page-title">
              <div>
                <h1>
                  我的作品<span> {works.length}</span>
                </h1>
              </div>
              <button className="primary" onClick={() => void store.add()}>
                <Plus size={16} />
                新建作品
              </button>
            </div>
            <div className="works-grid">
              {works.map((w) => (
                <article className="work-card" key={w.id}>
                  <button
                    className={`work-cover wallpaper-${w.phone.wallpaper}`}
                    onClick={() => {
                      store.select(w.id);
                      setPhoneKey((k) => k + 1);
                      setView("phone");
                    }}
                  >
                    {w.cover ? (
                      <img src={w.cover} alt={w.title} />
                    ) : (
                      <>
                        <small>FOUND PHONE STORY</small>
                        <h2>{w.title}</h2>
                        <span>{w.phone.owner} 的手機</span>
                      </>
                    )}
                  </button>
                  <div className="work-card-meta">
                    <h3>{w.title}</h3>
                    <p>
                      {w.category} ·{" "}
                      {new Date(w.updatedAt).toLocaleDateString("zh-TW")}
                    </p>
                    <div>
                      <button
                        onClick={() => {
                          store.select(w.id);
                          setModal("metadata");
                        }}
                      >
                        編輯資訊
                      </button>
                      <button
                        aria-label={`復制${w.title}`}
                        onClick={() =>
                          void store.add({ ...w, title: `${w.title} 副本` })
                        }
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        aria-label={`刪除${w.title}`}
                        className="danger"
                        onClick={() => setConfirmDelete(w.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              <button
                className="import-work-card"
                onClick={() => input.current?.click()}
              >
                <Upload size={26} />
                <strong>導入作品</strong>
                <span>JSON 或 ZIP 作品包</span>
              </button>
            </div>
            <p className="storage-note">
              清理瀏覽器資料會刪除本地草稿，更換設備不會自動同步。請定期導出 ZIP
              備份。
            </p>
          </div>
        ) : view === "assets" ? (
          <div className="library-page">
            <div className="page-title">
              <div>
                <h1>素材與內容</h1>
              </div>
              <button className="primary" onClick={() => add(app)}>
                <Plus size={16} />
                新增內容
              </button>
            </div>
            <div className="asset-toolbar">
              <select
                aria-label="選擇內容 App"
                value={app}
                onChange={(e) => setApp(e.target.value)}
              >
                {work.apps.map((a) => (
                  <option value={a.id} key={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="搜尋故事內容"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="secondary" onClick={() => setModal("batch")}>
                批量導入聊天
              </button>
            </div>
            <div className="content-table">
              <div className="table-header">
                <span>標題 / 會話</span>
                <span>內容</span>
                <span>時間</span>
                <span>操作</span>
              </div>
              {items.map((i) => (
                <div key={i.id}>
                  <button onClick={() => edit(app, i)}>
                    <strong>{i.title}</strong>
                    {i.hidden && <small>隱藏</small>}
                  </button>
                  <p>{i.body.slice(0, 85)}</p>
                  <small>{i.time}</small>
                  <button
                    aria-label={`編輯${i.title}`}
                    onClick={() => edit(app, i)}
                  >
                    編輯 <ArrowUpRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`creator-layout ${side ? "" : "no-inspector"}`}>
            <section className="phone-stage">
              <div className="stage-heading">
                <div>
                  <h1>手機創作</h1>
                </div>
                <button
                  className="secondary"
                  aria-label="開啟 App 庫"
                  onClick={() => setModal("apps")}
                >
                  <LayoutGrid size={15} />
                  App 庫
                </button>
                <button
                  className="stage-settings"
                  aria-label="手機設定"
                  onClick={() => setModal("settings")}
                >
                  <Settings2 size={19} />
                </button>
              </div>
              <div className="phone-presentation">
                <Phone
                  key={`${work.id}-${phoneKey}`}
                  work={work}
                  creator
                  onEdit={edit}
                  onAdd={add}
                  onSettings={() => setModal("settings")}
                  onOpen={setApp}
                />
              </div>
              <div className="stage-footer">
                <span className="mode-pill">
                  <span />
                  創作模式
                </span>
                <button onClick={startPreview}>
                  切換玩家視角 <ArrowUpRight size={13} />
                </button>
                <button
                  aria-label="顯示屬性面板"
                  onClick={() => setSide(!side)}
                >
                  <PanelRightClose size={16} />
                </button>
              </div>
            </section>
            {side && (
              <aside className="inspector">
                <div className="inspector-section">
                  <div className="section-label">
                    <strong>作品概覽</strong>
                    <button onClick={() => setModal("metadata")}>
                      編輯 <ArrowUpRight size={12} />
                    </button>
                  </div>
                  <div className="overview-grid">
                    <div>
                      <strong>
                        {work.apps.filter((a) => a.installed).length}
                      </strong>
                      <span>已安裝 App</span>
                    </div>
                    <div>
                      <strong>{count}</strong>
                      <span>內容片段</span>
                    </div>
                    <div>
                      <strong>{work.nodes.length}</strong>
                      <span>劇情節點</span>
                    </div>
                  </div>
                  <div className="story-mode">
                    <span>故事模式</span>
                    <select
                      value={work.mode}
                      onChange={(e) =>
                        change((w) => {
                          w.mode = e.target.value as Work["mode"];
                        })
                      }
                    >
                      <option value="mixed">混合模式</option>
                      <option value="explore">自由探索</option>
                      <option value="story">互動劇情</option>
                    </select>
                  </div>
                </div>
                <div className="inspector-section">
                  <div className="section-label">
                    <strong>手機個性化</strong>
                    <Settings2 size={14} />
                  </div>
                  <button
                    className="inspector-row"
                    onClick={() => setModal("settings")}
                  >
                    <span className="round-icon">
                      <Smartphone size={16} />
                    </span>
                    <span>
                      機主與鎖屏<small>{work.phone.owner} 的 iPhone</small>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                  <button
                    className="inspector-row"
                    onClick={() => setModal("settings")}
                  >
                    <span
                      className={`wallpaper-swatch wallpaper-${work.phone.wallpaper}`}
                    />
                    <span>
                      壁紙與外觀
                      <small>
                        柔霧 · {work.phone.theme === "light" ? "淺色" : "深色"}
                        模式
                      </small>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                  <button
                    className="inspector-row"
                    onClick={() => setModal("apps")}
                  >
                    <span className="round-icon">
                      <LayoutGrid size={16} />
                    </span>
                    <span>App 庫</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
                <div className="inspector-section">
                  <div className="section-label">
                    <strong>正在編輯 · {getApp(app).name}</strong>
                    <button
                      aria-label="新增目前 App 內容"
                      onClick={() => add(app)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="app-content-list">
                    {(work.data[app] ?? []).slice(0, 4).map((i) => (
                      <button key={i.id} onClick={() => edit(app, i)}>
                        <span className="content-line-mark" />
                        <span>
                          <strong>{i.title}</strong>
                          <small>{i.body.slice(0, 25)}</small>
                        </span>
                        <ChevronRight size={13} />
                      </button>
                    ))}
                  </div>
                  <button
                    className="dashed-button"
                    onClick={() => setModal("batch")}
                  >
                    <Upload size={14} />
                    批量導入聊天記錄
                  </button>
                  <button
                    className="text-button all-content"
                    onClick={() => setView("assets")}
                  >
                    管理全部內容 <ArrowUpRight size={12} />
                  </button>
                </div>

                <div className="inspector-bottom">
                  <ShieldCheck size={14} />
                  <span>僅儲存在你的瀏覽器中</span>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept=".json,.zip"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file)
            void run(async () => {
              const imported = await importWork(file);
              await store.add(imported);
              setPhoneKey((k) => k + 1);
            }, "作品已導入");
          e.target.value = "";
        }}
      />
      {editing && (
        <ItemEditor
          key={editing.item.id}
          app={editing.app}
          item={editing.item}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            change((w) => {
              const list = w.data[editing.app] ?? [];
              w.data[editing.app] = list.some((i) => i.id === item.id)
                ? list.map((i) => (i.id === item.id ? item : i))
                : [...list, item];
            });
            setEditing(null);
          }}
          onDelete={() => {
            if (confirm("刪除這條內容？可使用撤銷恢復。")) {
              change((w) => {
                w.data[editing.app] = (w.data[editing.app] ?? []).filter(
                  (i) => i.id !== editing.item.id,
                );
              });
              setEditing(null);
            }
          }}
        />
      )}
      {modal === "settings" && (
        <PhoneSettings
          work={work}
          onChange={change}
          onClose={() => setModal("")}
        />
      )}
      {modal === "apps" && (
        <AppManager
          work={work}
          onChange={change}
          onClose={() => setModal("")}
        />
      )}
      {modal === "batch" && (
        <BatchImport
          onClose={() => setModal("")}
          onImport={(items) => {
            change((w) => {
              w.data[app] = [...(w.data[app] ?? []), ...items];
            });
            setModal("");
            setNotice(`已向 ${getApp(app).name} 導入 ${items.length} 條訊息`);
          }}
        />
      )}
      {modal === "export" && (
        <Modal title="導出作品" onClose={() => setModal("")}>
          <p className="modal-intro">選擇導出格式。</p>
          <div className="export-options">
            <button
              disabled={busy}
              onClick={() => {
                jsonExport(work);
                setNotice("JSON 已導出");
              }}
            >
              <FileJson />
              <span>
                <strong>作品 JSON</strong>
                <small>完整資料與內嵌素材，可再次導入編輯。</small>
              </span>
              <Download size={16} />
            </button>
            <button
              disabled={busy}
              onClick={() => void run(() => backup(work), "ZIP 備份已導出")}
            >
              <Package />
              <span>
                <strong>完整 ZIP 備份</strong>
                <small>儲存作品與素材，適合長期備份和遷移。</small>
              </span>
              <Download size={16} />
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(() => staticExport(work), "獨立玩家網頁已導出")
              }
            >
              <Globe />
              <span>
                <strong>獨立玩家網頁</strong>
                <small>靜態運行器 + 作品，無創作後臺。需生產構建。</small>
              </span>
              <Download size={16} />
            </button>
          </div>
          <p className="storage-note">
            目前作品約{" "}
            {(new Blob([JSON.stringify(work)]).size / 1024).toFixed(1)}{" "}
            KB。素材版權由作者自行確認。部署說明見 docs/DEPLOYMENT.md。
          </p>
          <footer>
            <button
              className="text-button"
              onClick={() => input.current?.click()}
            >
              <Upload size={15} />
              導入作品
            </button>
            <span>{busy ? "正在打包…" : "所有導出均在本地完成"}</span>
          </footer>
        </Modal>
      )}
      {modal === "metadata" && (
        <Metadata
          work={work}
          onClose={() => setModal("")}
          onSave={(patch) => {
            change((w) => Object.assign(w, patch));
            setModal("");
          }}
        />
      )}
      {(modal === "guide" || modal === "about") && (
        <Modal
          title={modal === "guide" ? "創作指南" : "撿手機 FoundPhone Studio"}
          onClose={() => setModal("")}
        >
          <div className="guide-content">
            {modal === "guide" ? (
              <ol>
                <li>開啟手機中的 App，點擊內容編輯；右上角 ＋ 新建。</li>
                <li>在“素材與內容”管理會話、帖子和記錄，批量導入聊天。</li>
                <li>
                  使用“劇情編排”連接事件與動作，用內容 ID
                  解鎖照片、設定選項與結局。
                </li>
                <li>點“預覽”以玩家身份探索。預覽不會修改作者草稿。</li>
                <li>導出 JSON / ZIP 備份，或構建後導出獨立玩家靜態網頁。</li>
              </ol>
            ) : (
              <>
                <p>免費、開源、本地優先的虛擬手機故事創作工具。</p>
                <p>
                  目前版本 0.2.0：47 個 App
                  注冊入口，共用六類內容引擎。品牌專屬完整交互、真實延時調度與完整移動端驗收仍在開發。
                </p>
                <p>
                  所有品牌名稱僅用於非官方模擬參考。預設圖標來自
                  Lucide；內置畫面與人物為原創虛構內容。
                </p>
              </>
            )}
            <p className="storage-note">
              清理瀏覽器資料可能丟失草稿。設備間不會同步，請定期導出 ZIP
              備份。源碼採用 MIT，用戶作品不自動採用 MIT。
            </p>
          </div>
        </Modal>
      )}
      {preview && (
        <div className="preview-overlay">
          <header>
            <div>
              <h3>{preview.title}</h3>
            </div>
            <span>
              {runtime?.clues.length ?? 0} 條線索 ·{" "}
              {runtime?.endings.length ?? 0} 個結局
            </span>
            <button className="secondary" onClick={() => setPreview(null)}>
              退出預覽
            </button>
          </header>
          <Phone
            key={preview.id + preview.updatedAt}
            work={preview}
            runtime={runtime}
            onRuntime={setRuntime}
          />
          <div className="debug-trace">
            <span>劇情調試</span>
            {runtime?.trace.slice(-3).map((t, i) => (
              <small key={i}>{t}</small>
            ))}
          </div>
        </div>
      )}
      {confirmDelete && (
        <Modal title="刪除這部作品？" onClose={() => setConfirmDelete("")}>
          <p className="modal-intro">
            此操作會刪除本機上的作品與玩家進度。請先導出備份。
          </p>
          <footer>
            <button className="secondary" onClick={() => setConfirmDelete("")}>
              取消
            </button>
            <button
              className="primary danger-bg"
              onClick={() => {
                void run(() => store.remove(confirmDelete), "作品已刪除");
                setConfirmDelete("");
              }}
            >
              確認刪除
            </button>
          </footer>
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{notice}</span>
          <button aria-label="關閉提示" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
function Metadata({
  work,
  onClose,
  onSave,
}: {
  work: Work;
  onClose: () => void;
  onSave: (p: Partial<Work>) => void;
}) {
  const [title, setTitle] = useState(work.title),
    [description, setDescription] = useState(work.description),
    [category, setCategory] = useState(work.category),
    [cover, setCover] = useState(work.cover),
    [error, setError] = useState("");
  return (
    <Modal title="作品資訊" onClose={onClose}>
      <div className="editor-fields">
        <label>
          作品名稱
          <input
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          簡介
          <textarea
            rows={4}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label>
          分類
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>
        <label>
          封面
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              if (e.target.files?.[0])
                try {
                  setCover(await mediaData(e.target.files[0]));
                } catch (err) {
                  setError(String(err));
                }
            }}
          />
        </label>
        {cover && <img className="cover-preview" alt="作品封面" src={cover} />}
        <p className="error">{error}</p>
      </div>
      <footer>
        <span>作品 ID · {work.id.slice(0, 8)}</span>
        <button
          className="primary"
          disabled={!title.trim()}
          onClick={() =>
            onSave({ title: title.trim(), description, category, cover })
          }
        >
          儲存資訊
        </button>
      </footer>
    </Modal>
  );
}
createRoot(document.getElementById("root")!).render(<Studio />);
