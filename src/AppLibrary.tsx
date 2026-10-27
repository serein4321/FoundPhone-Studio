import { useRef, useState } from "react";
import {
  GripVertical,
  Search,
  Plus,
  Check,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  Trash2,
  Download,
  Smartphone,
} from "lucide-react";
import { Modal } from "./Editors";
import { AppIcon } from "./Phone";
import { registry, getApp } from "./registry";
import { type Work } from "./schema";
import {
  category,
  installApp,
  removeFromHome,
  uninstallApp,
  moveApp,
  newCustomApp,
} from "./apps";
import { mediaData } from "./io";
export function AppManager({
  work,
  onChange,
  onClose,
}: {
  work: Work;
  onChange: (fn: (w: Work) => void) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState("全部"),
    [status, setStatus] = useState("全部"),
    [selected, setSelected] = useState(""),
    [uninstall, setUninstall] = useState(""),
    [keep, setKeep] = useState(true),
    [folder, setFolder] = useState(""),
    [folderApps, setFolderApps] = useState<string[]>([]),
    [showFolder, setShowFolder] = useState(false),
    [customName, setCustomName] = useState(""),
    [error, setError] = useState(""),
    [dragging, setDragging] = useState("");
  const drag = useRef("");
  const catalog = [
    ...work.apps,
    ...registry
      .filter((r) => !work.apps.some((a) => a.id === r.id))
      .map((a) => ({
        id: a.id,
        name: a.name,
        installed: false,
        visible: false,
        dock: false,
        folder: "",
        icon: "",
      })),
  ];
  const filtered = catalog.filter(
    (a) =>
      (a.name + getApp(a.id).name)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (group === "全部" || category(a.id) === group) &&
      (status === "全部" || (status === "已安裝" ? a.installed : !a.installed)),
  );
  const current = work.apps.find((a) => a.id === selected);
  const update = (patch: Partial<Work["apps"][number]>) =>
    onChange((w) => {
      const a = w.apps.find((a) => a.id === selected);
      if (a) Object.assign(a, patch);
    });
  const drop = (target: string) => {
    if (drag.current && target && target !== drag.current)
      onChange((w) => moveApp(w, drag.current, target));
    drag.current = "";
    setDragging("");
  };
  return (
    <>
      <Modal title="App 庫" onClose={onClose} wide>
        <div className="app-library">
          <div className="library-controls">
            <label className="library-search">
              <Search size={16} />
              <input
                aria-label="搜尋 App"
                placeholder="搜尋 App"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="App 分類"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              {[
                "全部",
                "系統",
                "通訊",
                "社交",
                "影音",
                "生活",
                "工具",
                "自定義",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="安裝篩選"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["全部", "已安裝", "未安裝"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <button
              className="secondary"
              onClick={() => setShowFolder(!showFolder)}
            >
              <FolderPlus size={15} />
              創建資料夾
            </button>
          </div>
          {showFolder && (
            <section className="folder-builder">
              <label>
                資料夾名稱
                <input
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  placeholder="資料夾名稱"
                />
              </label>
              <div className="folder-app-picks">
                {work.apps
                  .filter((a) => a.installed)
                  .map((a) => (
                    <label key={a.id}>
                      <input
                        type="checkbox"
                        checked={folderApps.includes(a.id)}
                        onChange={(e) =>
                          setFolderApps(
                            e.target.checked
                              ? [...folderApps, a.id]
                              : folderApps.filter((id) => id !== a.id),
                          )
                        }
                      />
                      {a.name}
                    </label>
                  ))}
              </div>
              <button
                className="primary"
                disabled={!folder.trim() || !folderApps.length}
                onClick={() => {
                  onChange((w) => {
                    for (const a of w.apps)
                      if (folderApps.includes(a.id)) {
                        a.folder = folder.trim();
                        a.visible = true;
                        a.dock = false;
                      }
                  });
                  setShowFolder(false);
                  setFolderApps([]);
                }}
              >
                儲存資料夾
              </button>
            </section>
          )}
          <div className="library-layout">
            <div className="library-catalog" aria-label="App 目錄">
              {filtered.map((a) => (
                <article
                  key={a.id}
                  data-app-id={a.id}
                  className={`library-app ${a.id === selected ? "selected" : ""} ${dragging === a.id ? "dragging" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    drop(a.id);
                  }}
                >
                  <div className="library-app-main">
                    <button
                      className="drag-grip"
                      aria-label={`拖動${a.name}排序`}
                      disabled={!a.installed}
                      draggable={false}
                      onDragStart={(e) => {
                        drag.current = a.id;
                        setDragging(a.id);
                        e.dataTransfer.setData("text/plain", a.id);
                      }}
                      onDragEnd={() => {
                        drag.current = "";
                        setDragging("");
                      }}
                      onPointerDown={(e) => {
                        if (!a.installed) return;
                        e.preventDefault();
                        drag.current = a.id;
                        setDragging(a.id);
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerUp={(e) => {
                        const row = document
                          .elementFromPoint(e.clientX, e.clientY)
                          ?.closest<HTMLElement>("[data-app-id]");
                        drop(row?.dataset.appId ?? "");
                      }}
                      onPointerCancel={() => {
                        drag.current = "";
                        setDragging("");
                      }}
                    >
                      <GripVertical size={15} />
                    </button>
                    <button
                      className="library-app-select"
                      onClick={() => setSelected(a.id)}
                    >
                      <AppIcon id={a.id} custom={a.icon} small />
                      <span>
                        <strong>{a.name}</strong>
                        <small>
                          {category(a.id)} ·{" "}
                          {a.installed
                            ? a.visible
                              ? "已安裝"
                              : "僅 App 資源庫"
                            : "未安裝"}
                        </small>
                      </span>
                    </button>
                    {a.installed ? (
                      <button
                        className="library-configure"
                        onClick={() => setSelected(a.id)}
                      >
                        管理
                      </button>
                    ) : (
                      <button
                        className="library-install"
                        aria-label={`安裝${a.name}`}
                        onClick={() => {
                          onChange((w) => installApp(w, a.id));
                          setSelected(a.id);
                        }}
                      >
                        <Download size={14} />
                        安裝
                      </button>
                    )}
                  </div>
                  {a.installed && (
                    <div className="library-app-actions">
                      <button
                        aria-label={`上移${a.name}`}
                        onClick={() => {
                          const i = work.apps.indexOf(a);
                          if (i > 0)
                            onChange((w) => moveApp(w, a.id, w.apps[i - 1].id));
                        }}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        aria-label={`下移${a.name}`}
                        onClick={() => {
                          const i = work.apps.indexOf(a);
                          if (i < work.apps.length - 1)
                            onChange((w) => moveApp(w, a.id, w.apps[i + 1].id));
                        }}
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        aria-label={`${a.visible ? "從桌面移除" : "新增到桌面"}${a.name}`}
                        onClick={() =>
                          onChange((w) => {
                            if (a.visible) removeFromHome(w, a.id);
                            else {
                              const x = w.apps.find((x) => x.id === a.id);
                              if (x) x.visible = true;
                            }
                          })
                        }
                      >
                        <Smartphone size={12} />
                        {a.visible ? "從桌面移除" : "新增到桌面"}
                      </button>
                      <button
                        className="danger"
                        aria-label={`卸載${a.name}`}
                        onClick={() => {
                          setUninstall(a.id);
                          setKeep(true);
                        }}
                      >
                        <Trash2 size={12} />
                        卸載
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {!filtered.length && (
                <p className="library-empty">沒有匹配的 App</p>
              )}
            </div>
            <aside className="app-properties">
              {current?.installed ? (
                <>
                  <h3>{current.name}</h3>
                  <label>
                    App 名稱
                    <input
                      aria-label="自定義 App 名稱"
                      value={current.name}
                      onChange={(e) => update({ name: e.target.value })}
                    />
                  </label>
                  <label>
                    圖標文字
                    <input
                      aria-label="自定義圖標文字"
                      maxLength={4}
                      value={
                        current.icon.startsWith("data:") ? "" : current.icon
                      }
                      placeholder="使用預設圖標"
                      onChange={(e) => update({ icon: e.target.value })}
                    />
                  </label>
                  <label className="icon-upload">
                    上傳圖標
                    <input
                      aria-label="上傳 App 圖標"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f)
                          try {
                            update({ icon: await mediaData(f) });
                          } catch (err) {
                            setError(String(err));
                          }
                      }}
                    />
                  </label>
                  {current.icon && (
                    <button
                      className="text-button"
                      onClick={() => update({ icon: "" })}
                    >
                      恢復預設圖標
                    </button>
                  )}
                  <label>
                    資料夾
                    <input
                      aria-label="App 資料夾"
                      value={current.folder}
                      placeholder="留空放在桌面"
                      onChange={(e) =>
                        update({
                          folder: e.target.value,
                          dock: false,
                          visible: true,
                        })
                      }
                    />
                  </label>
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={current.dock}
                      onChange={(e) => {
                        if (
                          e.target.checked &&
                          work.apps.filter(
                            (a) => a.installed && a.visible && a.dock,
                          ).length >= 4
                        ) {
                          setError("Dock 最多放置 4 個 App");
                          return;
                        }
                        update({
                          dock: e.target.checked,
                          visible: true,
                          folder: "",
                        });
                      }}
                    />
                    放入 Dock
                  </label>
                  <small>
                    {(work.data[current.id] ?? []).length} 條創作內容
                  </small>
                </>
              ) : (
                <p>選擇已安裝的 App，編輯名稱、圖標與資料夾。</p>
              )}
              <div className="custom-app-form">
                <label>
                  自定義 App
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="App 名稱"
                  />
                </label>
                <button
                  className="secondary"
                  disabled={!customName.trim()}
                  onClick={() => {
                    onChange((w) => {
                      setSelected(newCustomApp(w, customName.trim()));
                    });
                    setCustomName("");
                  }}
                >
                  <Plus size={14} />
                  新增 App
                </button>
              </div>
            </aside>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
        <footer>
          <span>
            {work.apps.filter((a) => a.installed).length} 個已安裝 ·
            拖動手柄排序
          </span>
          <button className="primary" onClick={onClose}>
            <Check size={14} />
            完成
          </button>
        </footer>
      </Modal>
      {uninstall && (
        <Modal
          title={`卸載${catalog.find((a) => a.id === uninstall)?.name}？`}
          onClose={() => setUninstall("")}
        >
          <div className="editor-fields">
            <p>卸載後將從手機和 App 資源庫移除。</p>
            <label className="inline-check">
              <input
                type="checkbox"
                checked={keep}
                onChange={(e) => setKeep(e.target.checked)}
              />
              保留創作資料，重新安裝後恢復
            </label>
            {!keep && (
              <p className="error">
                將刪除此 App 的全部創作內容。引用這些內容的劇情可能失效。
              </p>
            )}
          </div>
          <footer>
            <button className="secondary" onClick={() => setUninstall("")}>
              取消
            </button>
            <button
              className="primary danger-bg"
              onClick={() => {
                onChange((w) => uninstallApp(w, uninstall, keep));
                setUninstall("");
              }}
            >
              確認卸載{keep ? "並保留資料" : "並刪除資料"}
            </button>
          </footer>
        </Modal>
      )}
    </>
  );
}
