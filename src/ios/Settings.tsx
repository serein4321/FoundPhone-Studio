import { useState, type ComponentType } from "react";
import {
  Plane,
  Wifi,
  Bluetooth,
  Signal,
  Battery,
  Settings,
  Accessibility,
  Image,
  Bell,
  Volume2,
  Moon,
  Shield,
  ChevronRight,
  Search,
  Check,
  Link,
  Globe,
  Mic,
} from "lucide-react";
import type { Work, Item } from "../schema";
import { IOSToggle } from "../vendor/konsta/Toggle";
import { NavigationPage, useNavigation } from "./Navigation";
type Row = [ComponentType<{ size?: number }>, string, string];
const groups: Row[][] = [
  [
    [Plane, "飛行模式", "#ff9500"],
    [Wifi, "無線局域網", "#007aff"],
    [Bluetooth, "藍牙", "#007aff"],
    [Signal, "行動網路", "#34c759"],
    [Link, "個人熱點", "#65ce88"],
    [Battery, "電池", "#34c759"],
    [Globe, "VPN", "#007aff"],
  ],
  [
    [Settings, "通用", "#8e8e93"],
    [Accessibility, "輔助功能", "#007aff"],
    [Image, "牆紙", "#32ade6"],
  ],
  [
    [Bell, "通知", "#ff3b30"],
    [Volume2, "聲音與觸感", "#ff2d55"],
    [Moon, "專注模式", "#5856d6"],
    [Shield, "面容 ID 與密碼", "#34c759"],
  ],
];
export function NativeSettings({
  work,
  items,
  creator,
  onItem,
  onSettings,
}: {
  work: Work;
  items: Item[];
  creator: boolean;
  onItem: (i: Item) => void;
  onSettings?: () => void;
}) {
  const nav = useNavigation(),
    [query, setQuery] = useState(""),
    [airplane, setAirplane] = useState(false),
    [wifi, setWifi] = useState(true),
    [bluetooth, setBluetooth] = useState(true),
    [lowPower, setLowPower] = useState(false);
  const row = (label: string, value?: string, click?: () => void) => (
    <button key={label} className="settings-native-row" onClick={click}>
      <span>{label}</span>
      <span className="settings-detail-value">{value}</span>
      {click && <ChevronRight size={16} />}
    </button>
  );
  const toggle = (label: string, value: boolean, set: (v: boolean) => void) => (
    <div className="settings-native-row">
      <span>{label}</span>
      <IOSToggle label={label} checked={value} onChange={set} />
    </div>
  );
  const sub = () => {
    switch (nav.page) {
      case "通用":
        return (
          <div className="settings-group">
            {row("關於本機", "", () => nav.push("關於本機"))}
            {row("軟體更新", "iOS 18.0", () => nav.push("軟體更新"))}
            {row("iPhone 儲存空間", "", () => nav.push("iPhone 儲存空間"))}
            {row("日期與時間", "", () => nav.push("日期與時間"))}
            {row("語言與地區", "簡體中文", () => nav.push("語言與地區"))}
          </div>
        );
      case "關於本機":
        return (
          <div className="settings-group">
            {row("名稱", work.phone.owner + "的 iPhone")}
            {row("iOS 版本", "18.0")}
            {row("機型名稱", "iPhone 15 Pro")}
            {row("照片", String(work.data.photos?.length || 0))}
            {row(
              "應用程序",
              String(work.apps.filter((a) => a.installed).length),
            )}
          </div>
        );
      case "Wi-Fi":
      case "無線局域網":
        return (
          <>
            <div className="settings-group">
              {toggle("Wi-Fi", wifi, setWifi)}
            </div>
            {wifi && (
              <>
                <p className="settings-section-label">我的網路</p>
                <div className="settings-group">
                  <div className="settings-native-row">
                    <Check size={18} color="#007aff" />
                    <span>{work.phone.network}</span>
                    <Wifi size={18} />
                  </div>
                </div>
                <p className="settings-page-caption">
                  連接狀態僅用於作品中的虛擬手機。
                </p>
              </>
            )}
          </>
        );
      case "藍牙":
        return (
          <>
            <div className="settings-group">
              {toggle("藍牙", bluetooth, setBluetooth)}
            </div>
            <p className="settings-page-caption">
              {bluetooth ? "我的設備" : "藍牙已關閉"}
            </p>
          </>
        );
      case "電池":
        return (
          <>
            <div className="settings-group">
              {row("電池電量", work.phone.battery + "%")}
              {toggle("低電量模式", lowPower, setLowPower)}
            </div>
            <p className="settings-page-caption">
              低電量模式僅改變虛擬設備狀態。
            </p>
          </>
        );
      case "日期與時間":
        return (
          <div className="settings-group">
            {row("日期", work.phone.date || "2026-09-01")}
            {row("時間", work.phone.time)}
            {row("時區", "中國標準時間")}
          </div>
        );
      case "iPhone 儲存空間":
        return (
          <div className="settings-group">
            {work.apps
              .filter((a) => a.installed)
              .map((a) => row(a.name, `${work.data[a.id]?.length || 0} 項`))}
          </div>
        );
      case "軟體更新":
        return (
          <p className="settings-page-caption">
            iOS 18.0 · 此為作品中的虛擬系統，不下載系統更新。
          </p>
        );
      default:
        return (
          <>
            <div className="settings-group">
              {row(
                nav.page,
                nav.page === "面容 ID 與密碼"
                  ? work.phone.passcode
                    ? "已設定密碼"
                    : "未設定密碼"
                  : "",
              )}
            </div>
            {!items.some((i) => i.folder === nav.page) && (
              <p className="settings-page-caption">此作品沒有配置更多選項。</p>
            )}
          </>
        );
    }
  };
  return (
    <div className="native-settings" data-root={!nav.page}>
      <NavigationPage
        page={nav.page}
        back={nav.pop}
        title={nav.depth > 1 ? "通用" : "設定"}
      >
        {nav.page ? (
          sub()
        ) : (
          <>
            <h1>設定</h1>
            {!query && (
              <button
                className="settings-account"
                onClick={() => nav.push(work.phone.owner)}
              >
                <span>{work.phone.owner.slice(0, 1)}</span>
                <div>
                  <strong>{work.phone.owner}</strong>
                  <small>Apple 賬戶、iCloud 與更多</small>
                </div>
                <ChevronRight size={17} />
              </button>
            )}
            {groups.map((group, n) => (
              <div className="settings-group" key={n}>
                {group
                  .filter(([, name]) => name.includes(query))
                  .map(([Icon, name, color]) => (
                    <div
                      key={name}
                      className="settings-native-row"
                      role={name === "飛行模式" ? undefined : "button"}
                      tabIndex={name === "飛行模式" ? undefined : 0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") nav.push(name);
                      }}
                      onClick={() => {
                        if (name !== "飛行模式") nav.push(name);
                      }}
                    >
                      <span
                        className="settings-glyph"
                        style={{ background: color }}
                      >
                        <Icon size={21} />
                      </span>
                      <span>{name}</span>
                      {name === "飛行模式" ? (
                        <IOSToggle
                          label="飛行模式"
                          checked={airplane}
                          onChange={setAirplane}
                        />
                      ) : (
                        <>
                          <small>
                            {name === "無線局域網"
                              ? wifi
                                ? "未連接"
                                : "關閉"
                              : name === "藍牙"
                                ? bluetooth
                                  ? "開啟"
                                  : "關閉"
                                : name === "VPN"
                                  ? "未連接"
                                  : name === "行動網路" || name === "個人熱點"
                                    ? "關閉"
                                    : ""}
                          </small>
                          <ChevronRight size={16} />
                        </>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </>
        )}
        {items
          .filter(
            (i) =>
              !nav.page || i.folder === nav.page || i.title.includes(nav.page),
          )
          .map((i) => (
            <button className="record-row" key={i.id} onClick={() => onItem(i)}>
              {i.title}
              <ChevronRight size={16} />
            </button>
          ))}
        {creator && (
          <button className="phone-add" onClick={onSettings}>
            編輯系統配置
          </button>
        )}
      </NavigationPage>
      {!nav.page && (
        <label className="settings-search">
          <Search size={23} />
          <input
            aria-label="搜尋設定"
            placeholder="搜尋"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Mic size={22} aria-hidden="true" />
        </label>
      )}
    </div>
  );
}
