/* Adapted from chukjosh/IOS-and-Android-on-the-Web, MIT.
 * Copyright (c) 2025 Joshua Chukwurah. See licenses/ios-web/chukjosh-MIT.txt.
 * Upstream 914f7ef8f902821964b14b85a2b410b0606f2d0e:
 * components/control-center/modules/{connectivity,slider}-module.tsx.
 * Changes: semantic labels, controlled values, vertical sliders, isolated CSS.
 */
import { useState } from "react";
import {
  Wifi,
  Bluetooth,
  Plane,
  Signal,
  Sun,
  Volume2,
  Radio,
  Link,
  Globe,
} from "lucide-react";
export function ConnectivityModule() {
  const [airplaneMode, setAirplaneMode] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [cellularEnabled, setCellularEnabled] = useState(false);
  const [airdrop, setAirdrop] = useState(true),
    [hotspot, setHotspot] = useState(false);
  return (
    <div className="cc-connect">
      <button
        aria-label="飛行模式"
        aria-pressed={airplaneMode}
        className={airplaneMode ? "orange" : ""}
        onClick={() => setAirplaneMode(!airplaneMode)}
      >
        <Plane />
      </button>
      <button
        aria-label="隔空投送"
        aria-pressed={airdrop}
        className={airdrop ? "blue" : ""}
        onClick={() => setAirdrop(!airdrop)}
      >
        <Radio />
      </button>
      <button
        aria-label="Wi-Fi"
        aria-pressed={wifiEnabled}
        className={wifiEnabled ? "blue" : ""}
        onClick={() => setWifiEnabled(!wifiEnabled)}
      >
        <Wifi />
      </button>
      <span className="cc-small-connections">
        <button
          aria-label="蜂窩資料"
          aria-pressed={cellularEnabled}
          className={cellularEnabled ? "green" : ""}
          onClick={() => setCellularEnabled(!cellularEnabled)}
        >
          <Signal />
        </button>
        <button
          aria-label="藍牙"
          aria-pressed={bluetoothEnabled}
          className={bluetoothEnabled ? "blue" : ""}
          onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
        >
          <Bluetooth />
        </button>
        <button
          aria-label="個人熱點"
          aria-pressed={hotspot}
          onClick={() => setHotspot(!hotspot)}
          className={hotspot ? "green" : ""}
        >
          <Link />
        </button>
        <button
          aria-label="網路連接"
          onClick={() => setCellularEnabled(!cellularEnabled)}
        >
          <Globe />
        </button>
      </span>
    </div>
  );
}
export function SliderModule({
  type,
  value,
  onChange,
}: {
  type: "brightness" | "volume";
  value: number;
  onChange: (value: number) => void;
}) {
  const Icon = type === "brightness" ? Sun : Volume2;
  return (
    <label className="cc-slider">
      <input
        aria-label={type === "brightness" ? "螢幕亮度" : "音量"}
        type="range"
        min={type === "brightness" ? 20 : 0}
        max="100"
        value={value}
        onChange={(e) => {
          const value = Number.parseInt(e.target.value);
          onChange(value);
          if (type === "brightness")
            (
              e.currentTarget.closest(".phone-screen") as HTMLElement
            )?.style.setProperty("--screen-dim", String((100 - value) / 180));
        }}
      />
      <span style={{ height: value + "%" }} />
      <Icon />
    </label>
  );
}
