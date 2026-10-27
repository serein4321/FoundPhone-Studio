import { useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import {
  uid,
  type Work,
  type StoryNode,
  type Action,
  type Condition,
} from "./schema";
import { validateGraph } from "./engine";
export function StoryEditor({
  work,
  onChange,
}: {
  work: Work;
  onChange: (fn: (w: Work) => void) => void;
}) {
  const [selected, setSelected] = useState("");
  const [dragged, setDragged] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [query, setQuery] = useState("");
  const n = work.nodes.find((n) => n.id === selected);
  const errors = validateGraph(work.nodes);
  const update = (patch: Partial<StoryNode>) =>
    onChange((w) => {
      w.nodes = w.nodes.map((x) =>
        x.id === selected ? { ...x, ...patch } : x,
      );
    });
  const add = () => {
    const id = uid();
    onChange((w) => {
      w.nodes.push({
        id,
        label: "新的事件",
        type: "event",
        event: "openApp",
        target: "wechat",
        conditions: [],
        logic: "and",
        actions: [],
        next: [],
        once: true,
        x: 100 + w.nodes.length * 25,
        y: 150 + w.nodes.length * 20,
      });
    });
    setSelected(id);
  };
  const connect = (c: Connection) => {
    if (c.source && c.target)
      onChange((w) => {
        const n = w.nodes.find((n) => n.id === c.source);
        if (n && !n.next.includes(c.target!)) n.next.push(c.target!);
      });
  };
  const nodes: Node[] = work.nodes.map((x) => ({
    id: x.id,
    data: {
      label: `${{ start: "起點", event: "事件", condition: "條件", action: "動作", choice: "選擇", delay: "延時", ending: "結局", comment: "注釋" }[x.type]} · ${x.label}`,
    },
    position: dragged[x.id] ?? { x: x.x, y: x.y },
    type:
      x.type === "start" ? "input" : x.type === "ending" ? "output" : "default",
    selected: x.id === selected,
    style: {
      borderColor:
        x.type === "ending"
          ? "#a88963"
          : x.type === "choice"
            ? "#879c78"
            : "#a9b4ab",
      opacity: query && !x.label.includes(query) ? 0.3 : 1,
    },
  }));
  return (
    <div className="story-editor">
      <div className="graph-main">
        <div className="graph-toolbar">
          <div>
            <h2>劇情編排</h2>
          </div>
          <input
            placeholder="搜尋節點"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="secondary" onClick={add}>
            <Plus size={16} />
            新增節點
          </button>
        </div>
        <div className="flow-canvas">
          <ReactFlow
            nodes={nodes}
            edges={work.nodes.flatMap((n) =>
              n.next.map((id) => ({
                id: `${n.id}-${id}`,
                source: n.id,
                target: id,
                animated: n.type === "choice",
              })),
            )}
            onConnect={connect}
            onNodeClick={(_, n) => setSelected(n.id)}
            onNodeDrag={(_, n) =>
              setDragged((d) => ({ ...d, [n.id]: n.position }))
            }
            onNodeDragStop={(_, n) => {
              setDragged({});
              onChange((w) => {
                const x = w.nodes.find((x) => x.id === n.id);
                if (x) {
                  x.x = n.position.x;
                  x.y = n.position.y;
                }
              });
            }}
            onEdgesDelete={(edges) =>
              onChange((w) => {
                for (const e of edges) {
                  const n = w.nodes.find((n) => n.id === e.source);
                  if (n) n.next = n.next.filter((id) => id !== e.target);
                }
              })
            }
            fitView
            deleteKeyCode="Delete"
          >
            <Background gap={24} color="#d4dad1" />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        <div className={`graph-validation ${errors.length ? "error" : ""}`}>
          {errors.length ? (
            <>
              <AlertCircle size={16} />
              {errors.join("；")}
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              圖結構檢查通過 · {work.nodes.length} 個節點
            </>
          )}
        </div>
      </div>
      <aside className="node-inspector">
        {n ? (
          <>
            <h3>{n.label}</h3>
            <label>
              節點 ID
              <input value={n.id} readOnly />
            </label>
            <label>
              名稱
              <input
                value={n.label}
                onChange={(e) => update({ label: e.target.value })}
              />
            </label>
            <label>
              節點類型
              <select
                value={n.type}
                onChange={(e) =>
                  update({ type: e.target.value as StoryNode["type"] })
                }
              >
                {[
                  "start",
                  "event",
                  "condition",
                  "action",
                  "choice",
                  "delay",
                  "ending",
                  "comment",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            {n.type === "delay" && (
              <label>
                延遲毫秒
                <input
                  type="number"
                  min="0"
                  max="86400000"
                  value={n.delayMs ?? 1000}
                  onChange={(e) =>
                    update({
                      delayMs: Math.max(
                        0,
                        Math.min(86400000, Number(e.target.value)),
                      ),
                    })
                  }
                />
                <small>按作品運行時間計時，關閉後暫停。</small>
              </label>
            )}
            <label>
              觸發事件
              <select
                value={n.event}
                onChange={(e) => update({ event: e.target.value })}
              >
                {[
                  "",
                  "start",
                  "openApp",
                  "read",
                  "password",
                  "choose",
                  "time",
                  "variable",
                  "callAnswered",
                  "callDeclined",
                  "callEnded",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t || "僅由連線觸發"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              事件目標
              <input
                list="story-targets"
                placeholder="選擇 App、內容或變量"
                value={n.target}
                onChange={(e) => update({ target: e.target.value })}
              />
            </label>
            <datalist id="story-targets">
              {work.apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
              {Object.entries(work.data).flatMap(([app, items]) =>
                items.map((i) => (
                  <option key={app + i.id} value={i.id}>
                    {i.title} · {app}
                  </option>
                )),
              )}
              {Object.keys(work.variables).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </datalist>
            <label className="inline-check">
              <input
                type="checkbox"
                checked={n.once}
                onChange={(e) => update({ once: e.target.checked })}
              />
              僅執行一次
            </label>
            <div className="inspector-divider" />
            <div className="section-label">
              <strong>執行條件</strong>
              <button
                onClick={() =>
                  update({
                    conditions: [
                      ...n.conditions,
                      { key: "found", op: "eq", value: true },
                    ],
                  })
                }
              >
                ＋
              </button>
            </div>
            <select
              value={n.logic}
              onChange={(e) =>
                update({ logic: e.target.value as StoryNode["logic"] })
              }
            >
              <option value="and">滿足全部 · AND</option>
              <option value="or">滿足任意 · OR</option>
              <option value="not">不滿足全部 · NOT</option>
            </select>
            {n.conditions.map((c, i) => (
              <div className="condition-editor" key={i}>
                <input
                  aria-label="條件變量"
                  value={c.key}
                  onChange={(e) =>
                    update({
                      conditions: n.conditions.map((x, j) =>
                        j === i ? { ...x, key: e.target.value } : x,
                      ),
                    })
                  }
                />
                <select
                  value={c.op}
                  onChange={(e) =>
                    update({
                      conditions: n.conditions.map((x, j) =>
                        j === i
                          ? { ...x, op: e.target.value as Condition["op"] }
                          : x,
                      ),
                    })
                  }
                >
                  {["eq", "neq", "gt", "lt", "includes"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <TypedValue
                  value={c.value}
                  set={(value) =>
                    update({
                      conditions: n.conditions.map((x, j) =>
                        j === i ? { ...x, value } : x,
                      ),
                    })
                  }
                />
                <button
                  aria-label="刪除條件"
                  onClick={() =>
                    update({
                      conditions: n.conditions.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <div className="section-label">
              <strong>執行動作</strong>
              <button
                onClick={() =>
                  update({
                    actions: [
                      ...n.actions,
                      {
                        type: "notification",
                        key: "",
                        value: "新的線索出現了",
                      },
                    ],
                  })
                }
              >
                ＋
              </button>
            </div>
            {n.actions.map((a, i) => (
              <div className="action-editor" key={i}>
                <select
                  value={a.type}
                  onChange={(e) =>
                    update({
                      actions: n.actions.map((x, j) =>
                        j === i
                          ? { ...x, type: e.target.value as Action["type"] }
                          : x,
                      ),
                    })
                  }
                >
                  {[
                    "variable",
                    "unlock",
                    "hide",
                    "notification",
                    "message",
                    "time",
                    "ending",
                    "choice",
                    "clue",
                    "call",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input
                  placeholder="目標 / 變量 / App ID"
                  value={a.key}
                  onChange={(e) =>
                    update({
                      actions: n.actions.map((x, j) =>
                        j === i ? { ...x, key: e.target.value } : x,
                      ),
                    })
                  }
                />
                <TypedValue
                  value={a.value}
                  set={(value) =>
                    update({
                      actions: n.actions.map((x, j) =>
                        j === i ? { ...x, value } : x,
                      ),
                    })
                  }
                />
                <button
                  className="danger text-button"
                  onClick={() =>
                    update({ actions: n.actions.filter((_, j) => j !== i) })
                  }
                >
                  移除動作
                </button>
              </div>
            ))}
            <button
              className="danger secondary"
              onClick={() => {
                onChange((w) => {
                  w.nodes = w.nodes
                    .filter((x) => x.id !== n.id)
                    .map((x) => ({
                      ...x,
                      next: x.next.filter((id) => id !== n.id),
                    }));
                });
                setSelected("");
              }}
            >
              刪除節點
            </button>
          </>
        ) : (
          <div className="inspector-empty">
            <p>點擊節點編輯事件、條件與動作。</p>
            <small>
              拖動節點連接點建立分支；選中連線後按 Delete
              刪除。選擇節點的後繼節點將作為玩家選項。
            </small>
          </div>
        )}
      </aside>
    </div>
  );
}
function TypedValue({
  value,
  set,
}: {
  value: string | number | boolean;
  set: (v: string | number | boolean) => void;
}) {
  return (
    <div className="typed-value">
      <select
        aria-label="值類型"
        value={typeof value}
        onChange={(e) =>
          set(
            e.target.value === "boolean"
              ? true
              : e.target.value === "number"
                ? 0
                : "",
          )
        }
      >
        <option value="string">文字</option>
        <option value="number">數值</option>
        <option value="boolean">布爾</option>
      </select>
      {typeof value === "boolean" ? (
        <select
          value={String(value)}
          onChange={(e) => set(e.target.value === "true")}
        >
          <option>true</option>
          <option>false</option>
        </select>
      ) : (
        <input
          value={value}
          type={typeof value === "number" ? "number" : "text"}
          onChange={(e) =>
            set(
              typeof value === "number"
                ? Number(e.target.value)
                : e.target.value,
            )
          }
        />
      )}
    </div>
  );
}
