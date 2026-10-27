import { useState } from "react";
import {
  ChevronLeft,
  Menu,
  Image,
  Camera,
  Mic,
  Smile,
  Plus,
  Check,
  Video,
} from "lucide-react";
import { NativeComposer } from "../DeviceSystem";
import { Avatar, Media, meta, type Props } from "./shared";
import "./qq-detail.css";
export function QQThread(p: Props) {
  const [panel, setPanel] = useState("");
  const messages = p.items.filter(
    (i) => i.title === p.thread && i.folder !== "空間" && i.kind !== "post",
  );
  const read = (i: (typeof messages)[number]) =>
    p.creator || i.password ? p.onItem(i) : p.onRead(i.id);
  return (
    <div className="qq-native-thread">
      <header className="qq-thread-nav">
        <button aria-label="返回QQ訊息" onClick={() => p.onThread("")}>
          <ChevronLeft size={26} />
        </button>
        <div>
          <strong>{p.thread}</strong>
          <small>{meta(messages.at(-1), "status", "聊天")}</small>
        </div>
        <button
          aria-label="QQ聊天資訊"
          onClick={() => setPanel(panel ? "" : "聊天資訊")}
        >
          <Menu size={24} />
        </button>
      </header>
      <div className="qq-thread-messages">
        {messages.map((i, n) => {
          const quoted = messages.find((x) => x.id === i.meta.replyTo),
            quote = i.meta.reply || quoted?.body;
          return (
            <div key={i.id}>
              {(n === 0 ||
                i.time.slice(-5) !== messages[n - 1].time.slice(-5)) && (
                <time className="qq-message-time">{i.time.slice(-5)}</time>
              )}
              <div
                className={
                  "qq-native-message " + (i.outgoing ? "outgoing" : "")
                }
              >
                <Avatar name={i.sender} src={i.avatar} />
                <div className="qq-message-stack">
                  {i.meta.badge && <small>{i.meta.badge}</small>}
                  <button
                    className={
                      "qq-native-bubble " +
                      (i.kind === "transfer" ? "qq-transfer-bubble" : "")
                    }
                    onClick={() => read(i)}
                  >
                    {i.kind === "transfer" ? (
                      <>
                        <div className="qq-transfer-top">
                          <span>
                            <Check size={25} />
                          </span>
                          <div>
                            <strong>
                              ¥
                              {meta(
                                i,
                                "amount",
                                /^\d+(\.\d+)?$/.test(i.body) ? i.body : "—",
                              )}
                            </strong>
                            <p>轉帳</p>
                          </div>
                        </div>
                        <footer>
                          {meta(i, "transferStatus", "轉帳記錄")}
                          <small>QQ支付</small>
                        </footer>
                      </>
                    ) : (
                      <>
                        {quote && (
                          <span className="qq-message-quote">
                            <b>
                              {i.meta.replySender || quoted?.sender || "引用"}
                            </b>
                            <span>{quote}</span>
                          </span>
                        )}
                        {["image", "video", "audio"].includes(i.kind) ? (
                          <Media item={i} />
                        ) : (
                          i.body
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {!messages.length && <p className="qq-thread-empty">暫無訊息</p>}
      </div>
      <div className="qq-native-composer">
        <NativeComposer creator={p.creator} onAdd={p.onAdd} />
        <div>
          {[
            [Mic, "語音"],
            [Image, "圖片"],
            [Camera, "相機"],
            [Video, "視訊"],
            [Smile, "表情"],
            [Plus, "更多"],
          ].map(([Icon, label]) => {
            const Glyph = Icon as typeof Mic;
            return (
              <button
                aria-label={"QQ" + label}
                key={String(label)}
                onClick={() => setPanel(panel === label ? "" : String(label))}
              >
                <Glyph size={26} />
              </button>
            );
          })}
        </div>
      </div>
      {panel && (
        <div className="qq-thread-sheet">
          <header>
            <button onClick={() => setPanel("")}>
              <ChevronLeft />
              返回
            </button>
            <strong>{panel}</strong>
          </header>
          {panel === "聊天資訊" ? (
            <div className="qq-member-list">
              {[...new Set(messages.map((i) => i.sender))].map((name) => (
                <div key={name}>
                  <Avatar name={name} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="qq-media-picker">
              {messages
                .filter((i) => ["image", "audio", "video"].includes(i.kind))
                .map((i) => (
                  <button key={i.id} onClick={() => read(i)}>
                    <Media item={i} />
                    <span>
                      {i.kind === "audio"
                        ? "語音"
                        : i.kind === "image"
                          ? "圖片"
                          : "視訊"}
                    </span>
                  </button>
                ))}
              {!messages.some((i) =>
                ["image", "audio", "video"].includes(i.kind),
              ) && <p>暫無內容</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
