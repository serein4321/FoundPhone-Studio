import { DetailedArtwork, detailedIcons } from "./ios/DetailedArtwork";
import { useId, useState, type ReactNode } from "react";
import { originalIconFiles } from "./ios/originalIconFiles";
import "./ios/original-icons.css";
import { getApp } from "./registry";
const native = new Set([
  "phone",
  "messages",
  "contacts",
  "photos",
  "camera",
  "safari",
  "notes",
  "calendar",
  "mail",
  "clock",
  "reminders",
  "files",
  "music",
  "maps",
  "weather",
  "wallet",
  "health",
  "find",
  "calculator",
  "settings",
  "wechat",
  "whatsapp",
  "instagram",
  "qq",
  "weibo",
  "redbook",
  "douyin",
  "bilibili",
  "alipay",
  "taobao",
  "netease",
  "delivery",
  "forum",
  "tiktok",
  "twitter",
  "telegram",
  "discord",
  "youtube",
  "line",
  "snapchat",
  "facebook",
  "messenger",
  "reddit",
  "spotify",
  "netflix",
  "pinterest",
  "threads",
]);
/** Code-drawn artwork; no extracted Apple bitmap, SF Symbol or font is embedded. */
function DrawnArtwork({ id, date }: { id: string; date?: string }) {
  const uid = useId().replaceAll(":", "");
  if (detailedIcons.has(id)) return <DetailedArtwork id={id} />;
  if (!native.has(id)) {
    const Icon = getApp(id).icon;
    return (
      <svg className="app-artwork" viewBox="0 0 64 64">
        <rect width="64" height="64" fill={getApp(id).color} />
        <Icon
          x="12"
          y="12"
          width="40"
          height="40"
          color={id === "kakao" ? "#3b1e1e" : "white"}
        />
      </svg>
    );
  }
  const gradient = `icon-${uid}`;
  let background = "#fff",
    art: ReactNode = null;
  const stroke = {
    fill: "none",
    stroke: "#fff",
    strokeWidth: 3.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "phone" || id === "messages") {
    background = "#23d553";
    art =
      id === "phone" ? (
        <path
          fill="#fff"
          d="M19 12c-2-1-6 2-7 5-2 8 4 19 12 27 7 7 18 12 25 9 3-1 5-5 4-7l-9-7c-2-1-4 0-6 4-2 3-8-1-12-5-5-5-8-11-5-13 4-2 5-4 3-6z"
        />
      ) : (
        <path
          fill="#fff"
          d="M32 12C18 12 8 21 8 32c0 7 5 13 11 17l-3 7 12-5h4c14 0 24-8 24-19S46 12 32 12z"
        />
      );
  } else if (id === "photos")
    art = (
      <g style={{ mixBlendMode: "multiply" }}>
        {[
          "#ffb300",
          "#ff692b",
          "#f55372",
          "#ce55a1",
          "#8060c4",
          "#409adb",
          "#62bb79",
          "#c5d849",
        ].map((c, i) => (
          <ellipse
            key={c}
            cx="32"
            cy="20"
            rx="9"
            ry="15"
            fill={c}
            opacity=".78"
            transform={`rotate(${i * 45} 32 32)`}
          />
        ))}
      </g>
    );
  else if (id === "safari")
    art = (
      <>
        <circle cx="32" cy="32" r="27" fill="#16a6ee" />
        <circle cx="32" cy="32" r="24" fill="#1587e7" />
        {Array.from({ length: 36 }, (_, i) => (
          <path
            key={i}
            d="M32 9v3"
            stroke="white"
            strokeWidth={i % 3 === 0 ? 1.4 : 0.6}
            transform={`rotate(${i * 10} 32 32)`}
          />
        ))}
        <path d="M19 45 29 29 45 19 35 35z" fill="#fff" />
        <path d="m29 29 16-10-10 16z" fill="#ff414b" />
      </>
    );
  else if (id === "notes")
    art = (
      <>
        <path fill="#ffd733" d="M0 0h64v21H0z" />
        <path
          d="M0 23h64M10 34h44M10 43h44M10 52h44"
          stroke="#ddd"
          strokeWidth="1"
        />
      </>
    );
  else if (id === "calendar")
    art = (
      <>
        <text x="32" y="18" fill="#ee404b" textAnchor="middle" fontSize="12">
          {date
            ? new Intl.DateTimeFormat("zh-TW", {
                weekday: "long",
                timeZone: "UTC",
              }).format(new Date(date + "T12:00:00Z"))
            : "星期二"}
        </text>
        <text
          x="32"
          y="53"
          fill="#080808"
          fontWeight="300"
          textAnchor="middle"
          fontSize="40"
        >
          {date ? Number(date.slice(8, 10)) : 1}
        </text>
      </>
    );
  else if (id === "clock") {
    background = "#080808";
    art = (
      <>
        <circle cx="32" cy="32" r="26" fill="#fff" />
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => (
          <text
            key={n}
            x={32 + 21 * Math.sin((i * Math.PI) / 6)}
            y={35 - 21 * Math.cos((i * Math.PI) / 6)}
            textAnchor="middle"
            fontSize="7"
            fill="#000"
          >
            {n}
          </text>
        ))}
        <path
          d="M32 32V18"
          transform="rotate(290.5 32 32)"
          fill="none"
          stroke="#111"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M32 32V10"
          transform="rotate(246 32 32)"
          stroke="#ff7d00"
          strokeWidth="1"
        />
        <circle cx="32" cy="32" r="2" fill="#ff7d00" />
      </>
    );
  } else if (id === "mail") {
    background = "#168cf3";
    art = (
      <>
        <rect x="9" y="16" width="46" height="33" rx="3" fill="#fff" />
        <path
          d="m10 18 22 18 22-18M10 48l17-16m27 16L37 32"
          stroke="#168cf3"
          strokeWidth="2"
          fill="none"
        />
      </>
    );
  } else if (id === "camera") {
    background = "#d9dadf";
    art = (
      <>
        <path
          d="M20 17l4-6h16l4 6h10c3 0 5 2 5 5v27c0 3-2 5-5 5H10c-3 0-5-2-5-5V22c0-3 2-5 5-5z"
          fill="#313238"
        />
        <circle cx="32" cy="35" r="15" fill="#0d0e14" />
        <circle cx="32" cy="35" r="11" fill="#1d2633" />
        <circle cx="32" cy="35" r="7" fill="#152d46" />
        <circle cx="28" cy="31" r="3" fill="#315970" />
        <circle cx="51" cy="24" r="3" fill="#e0d5b9" />
      </>
    );
  } else if (id === "reminders")
    art = (
      <>
        {[18, 32, 46].map((y, i) => (
          <g key={y}>
            <circle
              cx="13"
              cy={y}
              r="5"
              fill={["#008aff", "#ff9400", "#ff3b30"][i]}
            />
            <path
              d={`M25 ${y - 2}h29M25 ${y + 3}h23`}
              stroke="#c3c4ca"
              strokeWidth="1.5"
            />
          </g>
        ))}
      </>
    );
  else if (id === "files")
    art = (
      <>
        <path d="M7 18h21l5 6h24v30H7z" fill="#0561d9" />
        <path d="M7 25h50l-3 30H10z" fill="#1c94ff" />
        <path d="M10 29h44" stroke="#7acaff" />
      </>
    );
  else if (id === "music") {
    background = "#fb3457";
    art = (
      <>
        <path
          d="M29 18v27m0-27 21-4v27M29 25l21-4"
          {...stroke}
          strokeWidth="4"
        />
        <ellipse
          cx="23"
          cy="46"
          rx="8"
          ry="6"
          fill="white"
          transform="rotate(-20 23 46)"
        />
        <ellipse
          cx="44"
          cy="42"
          rx="8"
          ry="6"
          fill="white"
          transform="rotate(-20 44 42)"
        />
      </>
    );
  } else if (id === "weather") {
    background = "#158aea";
    art = (
      <>
        <circle cx="24" cy="24" r="13" fill="#ffcd32" />
        <path
          d="M17 49c-13-1-12-17 0-18 3-13 25-12 28 0 17-3 19 18 4 18z"
          fill="white"
          fillOpacity=".96"
        />
      </>
    );
  } else if (id === "health")
    art = (
      <path d="M34 50 17 34C2 17 24 7 34 22 44 7 65 17 51 34z" fill="#ff426b" />
    );
  else if (id === "find")
    art = (
      <>
        <circle cx="32" cy="32" r="26" fill="#e6f4e7" />
        <circle cx="32" cy="32" r="20" fill="#67d47e" />
        <circle cx="32" cy="32" r="13" fill="#32c961" />
        <path d="M32 6v26l18-18" fill="#fff" fillOpacity=".35" />
        <circle cx="32" cy="32" r="5" fill="#fff" />
        <circle cx="32" cy="32" r="3" fill="#3793f6" />
      </>
    );
  else if (id === "settings") {
    background = "#bec1c7";
    art = (
      <>
        <circle cx="32" cy="32" r="27" fill="#797e88" />
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d="M29 4h6v12h-6z"
            fill="#d7d9dc"
            transform={`rotate(${i * 30} 32 32)`}
          />
        ))}
        <circle cx="32" cy="32" r="18" fill="#d8dade" />
        <circle cx="32" cy="32" r="14" fill="#6a6f78" />
        <circle cx="32" cy="32" r="9" fill="#d1d3d6" />
        <circle cx="32" cy="32" r="5" fill="#848992" />
      </>
    );
  } else if (id === "calculator") {
    background = "#242528";
    art = (
      <>
        {[0, 1, 2, 3].map((n) => (
          <g key={n}>
            <circle
              cx={n % 2 ? 44 : 20}
              cy={n < 2 ? 20 : 44}
              r="10"
              fill={n === 3 ? "#ff9e0b" : "#6a6b6d"}
            />
            <text
              x={n % 2 ? 44 : 20}
              y={(n < 2 ? 20 : 44) + 5}
              fill="white"
              fontSize="18"
              textAnchor="middle"
            >
              {["+", "−", "×", "="][n]}
            </text>
          </g>
        ))}
      </>
    );
  } else if (id === "wallet") {
    background = "#1c1c1e";
    art = (
      <>
        {["#5abbed", "#f6b94a", "#63c99d", "#202126"].map((c, i) => (
          <rect
            key={c}
            x="9"
            y={12 + i * 8}
            width="46"
            height="22"
            rx="4"
            fill={c}
          />
        ))}
        <path d="M9 37h46v15H9z" fill="#55565b" />
        <circle cx="45" cy="45" r="2" fill="#aaa" />
      </>
    );
  } else if (id === "contacts") {
    background = "#c9c8c4";
    art = (
      <>
        <circle cx="29" cy="25" r="10" fill="#88898a" />
        <path d="M10 51c0-19 38-19 38 0" fill="#88898a" />
        {["#dfac66", "#999cb8", "#89b6b4"].map((c, i) => (
          <path key={c} d={`M56 ${12 + i * 14}h8v12h-8z`} fill={c} />
        ))}
      </>
    );
  } else if (id === "maps")
    art = (
      <>
        <path d="M0 0h64v64H0z" fill="#d8edba" />
        <path d="M0 46 64 16" stroke="#fff" strokeWidth="14" />
        <path d="m0 46 64-30" stroke="#ffd765" strokeWidth="7" />
        <path d="M21 0v64" stroke="#fff" strokeWidth="13" />
        <path d="M21 0v64" stroke="#61b7ee" strokeWidth="7" />
        <path
          d="m39 26 12 24-12-5-12 5z"
          fill="#2183ed"
          stroke="white"
          strokeWidth="2"
        />
      </>
    );

  if (id === "wechat") {
    background = "#07c160";
    art = (
      <>
        <path
          d="M26 12C14 12 5 20 5 29c0 5 3 10 8 13l-2 7 8-4 7 1c12 0 21-7 21-17S38 12 26 12z"
          fill="white"
        />
        <path
          d="M43 28c-10 0-18 6-18 14s8 14 18 14l6-1 6 3-2-6c4-3 6-6 6-10 0-8-7-14-16-14z"
          fill="white"
          stroke="#07c160"
          strokeWidth="1.5"
        />
        {[
          [18, 25],
          [32, 25],
          [37, 39],
          [49, 39],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="2" fill="#07a044" />
        ))}
      </>
    );
  } else if (id === "whatsapp") {
    background = "#27d366";
    art = (
      <>
        <path
          d="M13 53l3-12a22 22 0 1 1 9 10z"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
        />
        <path
          d="M23 19c-7 3-2 12 4 18 6 6 14 10 18 4l-7-5-4 3c-4-1-10-7-10-11l3-3z"
          fill="white"
        />
      </>
    );
  } else if (id === "instagram") {
    background = "#d72c7e";
    art = (
      <>
        <defs>
          <radialGradient id={gradient + "ig"} cx=".25" cy="1" r="1.3">
            <stop stopColor="#ffd66e" />
            <stop offset=".28" stopColor="#fc7044" />
            <stop offset=".6" stopColor="#e82c87" />
            <stop offset="1" stopColor="#6745c8" />
          </radialGradient>
        </defs>
        <path fill={"url(#" + gradient + "ig)"} d="M0 0h64v64H0z" />
        <rect
          x="12"
          y="12"
          width="40"
          height="40"
          rx="12"
          fill="none"
          stroke="white"
          strokeWidth="4"
        />
        <circle
          cx="32"
          cy="32"
          r="10"
          fill="none"
          stroke="white"
          strokeWidth="4"
        />
        <circle cx="45" cy="19" r="3" fill="white" />
      </>
    );
  } else if (id === "youtube") {
    background = "#fff";
    art = (
      <>
        <rect x="5" y="15" width="54" height="35" rx="11" fill="#f03" />
        <path d="m26 23 17 10-17 9z" fill="white" />
      </>
    );
  } else if (id === "douyin" || id === "tiktok") {
    background = "#050505";
    art = (
      <>
        <path
          d="M35 12v30c0 11-16 15-20 5-4-9 5-16 12-13v7c-4-2-8 1-6 5 3 5 9 0 9-4V12z"
          fill="#25f4ee"
          transform="translate(-2 -1)"
        />
        <path
          d="M37 12c0 9 6 12 12 12v8c-5 0-9-2-12-5v16c0 11-15 16-20 6-5-9 4-17 11-14v7c-4-2-8 1-6 5 3 5 9 0 9-4V12z"
          fill="#fe2c55"
          transform="translate(2 1)"
        />
        <path
          d="M35 12c0 9 6 12 12 12v6c-5 0-9-2-12-5v17c0 11-15 16-20 6-4-8 3-15 11-14v6c-5-1-8 2-6 6 3 5 9 0 9-4V12z"
          fill="white"
        />
      </>
    );
  } else if (id === "twitter") {
    background = "#000";
    art = (
      <>
        <path
          d="M13 12h10l28 40H41z"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
        />
        <path d="m49 12-35 40" stroke="white" strokeWidth="3" />
      </>
    );
  } else if (id === "telegram") {
    background = "#28a8ea";
    art = (
      <path d="m8 29 47-18-9 43-15-12-9 9 1-15 24-17-29 14z" fill="white" />
    );
  } else if (id === "facebook") {
    background = "#0866ff";
    art = (
      <path
        d="M36 61V36h9l2-11H36v-6c0-4 3-5 10-4V5C30 1 23 7 23 19v6h-8v11h8v25z"
        fill="white"
      />
    );
  } else if (id === "messenger") {
    background = "#0084ff";
    art = (
      <>
        <defs>
          <linearGradient id={gradient + "m"} x2="0" y2="1">
            <stop stopColor="#ff607e" />
            <stop offset=".55" stopColor="#a632ed" />
            <stop offset="1" stopColor="#0088ff" />
          </linearGradient>
        </defs>
        <path d="M0 0h64v64H0z" fill={"url(#" + gradient + "m)"} />
        <path
          d="M32 8C17 8 6 18 6 31c0 8 4 14 11 19v8l9-5h6c15 0 26-10 26-23S47 8 32 8z"
          fill="white"
        />
        <path d="m16 39 12-15 9 7 12-8-12 16-9-7z" fill="#d342db" />
      </>
    );
  } else if (id === "spotify") {
    background = "#000";
    art = (
      <>
        <circle cx="32" cy="32" r="24" fill="#1ed760" />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={"M17 " + (25 + i * 8) + "q17-7 32 2"}
            fill="none"
            stroke="black"
            strokeWidth={4 - i * 0.5}
            strokeLinecap="round"
          />
        ))}
      </>
    );
  } else if (id === "netflix") {
    background = "#000";
    art = (
      <>
        <path d="M17 11h9v43l-9 1zM38 11h9v44l-9-1z" fill="#b20710" />
        <path d="M17 11h10l20 44-10-1z" fill="#e50914" />
      </>
    );
  } else if (id === "pinterest") {
    background = "#e60023";
    art = (
      <>
        <circle cx="32" cy="31" r="23" fill="white" />
        <path
          d="M25 53l6-31m-1 14c9 8 18-1 15-12-4-14-25-10-25 4 0 5 2 7 4 8"
          fill="none"
          stroke="#e60023"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </>
    );
  } else if (id === "line") {
    background = "#06c755";
    art = (
      <>
        <path
          d="M32 10C17 10 6 19 6 30c0 10 9 18 22 20l-2 8c0 3 19-9 24-14 17-15 3-34-18-34z"
          fill="white"
        />
        <text
          x="32"
          y="35"
          textAnchor="middle"
          fontSize="16"
          fontWeight="800"
          fill="#06c755"
        >
          LINE
        </text>
      </>
    );
  } else if (id === "discord") {
    background = "#5865f2";
    art = (
      <>
        <path
          d="M18 16l8-3 2 4h8l2-4 8 3c7 11 10 23 9 29l-10 6-4-5 5-3c-9 5-19 5-28 0l5 3-4 5-10-6c-1-6 2-18 9-29z"
          fill="white"
        />
        <ellipse cx="25" cy="32" rx="4" ry="5" fill="#5865f2" />
        <ellipse cx="40" cy="32" rx="4" ry="5" fill="#5865f2" />
      </>
    );
  } else if (id === "reddit") {
    background = "#ff4500";
    art = (
      <>
        <ellipse cx="32" cy="36" rx="23" ry="17" fill="white" />
        <path d="m32 21 4-12 12 3" stroke="white" strokeWidth="3" fill="none" />
        <circle cx="49" cy="12" r="4" fill="white" />
        <circle cx="11" cy="29" r="6" fill="white" />
        <circle cx="53" cy="29" r="6" fill="white" />
        <circle cx="23" cy="35" r="4" fill="#ff4500" />
        <circle cx="41" cy="35" r="4" fill="#ff4500" />
        <path
          d="M23 45q9 6 18 0"
          fill="none"
          stroke="#ff4500"
          strokeWidth="2"
        />
      </>
    );
  } else if (id === "threads") {
    background = "#000";
    art = (
      <path
        d="M46 20C43 6 15 5 13 29c-2 28 32 32 38 13 5-16-22-24-26-11-4 12 18 16 17 1 0-13-11-15-17-9"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
    );
  } else if (id === "qq") {
    background = "#13b7f5";
    art = (
      <>
        <ellipse cx="32" cy="34" rx="17" ry="23" fill="#16171a" />
        <ellipse cx="32" cy="40" rx="14" ry="15" fill="white" />
        <ellipse cx="26" cy="22" rx="4" ry="6" fill="white" />
        <ellipse cx="38" cy="22" rx="4" ry="6" fill="white" />
        <circle cx="27" cy="23" r="1.7" />
        <circle cx="37" cy="23" r="1.7" />
        <ellipse cx="32" cy="30" rx="7" ry="3" fill="#ffcb28" />
        <path d="M17 33q15 7 30 0v6q-15 7-30 0z" fill="#f4343a" />
        <ellipse cx="22" cy="56" rx="8" ry="3" fill="#ffca2a" />
        <ellipse cx="42" cy="56" rx="8" ry="3" fill="#ffca2a" />
      </>
    );
  } else if (id === "bilibili") {
    background = "#fb7299";
    art = (
      <>
        <path
          d="m24 10 6 7m13-7-6 7"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect
          x="10"
          y="18"
          width="44"
          height="33"
          rx="7"
          fill="none"
          stroke="white"
          strokeWidth="4"
        />
        <path d="m21 31-5 3m27-3 5 3M24 42h16" stroke="white" strokeWidth="3" />
      </>
    );
  } else if (id === "alipay") {
    background = "#1677ff";
    art = (
      <text
        x="32"
        y="49"
        textAnchor="middle"
        fontSize="48"
        fontWeight="600"
        fill="white"
      >
        支
      </text>
    );
  } else if (id === "taobao") {
    background = "#ff5900";
    art = (
      <text
        x="32"
        y="49"
        textAnchor="middle"
        fontSize="48"
        fontWeight="600"
        fill="white"
      >
        淘
      </text>
    );
  } else if (id === "redbook") {
    background = "#ff2442";
    art = (
      <text
        x="32"
        y="39"
        textAnchor="middle"
        fontSize="20"
        fontWeight="800"
        fill="white"
      >
        小紅書
      </text>
    );
  } else if (id === "netease") {
    background = "#e60026";
    art = (
      <>
        <circle
          cx="32"
          cy="34"
          r="20"
          fill="none"
          stroke="white"
          strokeWidth="3"
        />
        <path
          d="M38 17C17 5 10 38 28 43c15 4 21-16 8-19-12-3-17 14-5 13 5 0 5-6 3-11l-3-17"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </>
    );
  } else if (id === "weibo") {
    background = "#fff";
    art = (
      <>
        <ellipse
          cx="29"
          cy="38"
          rx="23"
          ry="15"
          fill="#ed2234"
          transform="rotate(-12 29 38)"
        />
        <ellipse
          cx="28"
          cy="39"
          rx="17"
          ry="10"
          fill="white"
          transform="rotate(-12 28 39)"
        />
        <ellipse cx="28" cy="39" rx="8" ry="6" fill="#282828" />
        <circle cx="26" cy="37" r="2" fill="white" />
        <path
          d="M41 13q16-1 15 15M42 20q8-1 8 7"
          fill="none"
          stroke="#ffaf19"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </>
    );
  } else if (id === "snapchat") {
    background = "#fffc00";
    art = (
      <path
        d="M32 10c-9 0-12 7-12 17-4-3-7 2-3 5l4 2c0 7-6 10-11 12 1 4 6 3 8 6l7-1 7 3 7-3 7 1c2-3 7-2 8-6-5-2-11-5-11-12l4-2c4-3 1-8-3-5 0-10-3-17-12-17z"
        fill="white"
        stroke="#111"
        strokeWidth="1.5"
      />
    );
  } else if (id === "delivery") {
    background = "#ffd100";
    art = (
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fontSize="31"
        fontWeight="800"
        fill="#181818"
      >
        外賣
      </text>
    );
  } else if (id === "forum") {
    background = "#2d89e8";
    art = (
      <>
        <path d="M9 14h46v31H31L19 55V45H9z" fill="white" />
        <path d="M19 25h26M19 34h19" stroke="#2d89e8" strokeWidth="3" />
      </>
    );
  }
  const Icon = getApp(id).icon;
  return (
    <svg className="app-artwork" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x2="0" y2="1">
          <stop stopColor="white" stopOpacity=".16" />
          <stop offset=".55" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="black" stopOpacity=".06" />
        </linearGradient>
      </defs>
      <path fill={background} d="M0 0h64v64H0z" />
      {art ?? <Icon x="12" y="12" width="40" height="40" color="white" />}
      <path fill={`url(#${gradient})`} d="M0 0h64v64H0z" />
    </svg>
  );
}

const originalsEnabled = import.meta.env.VITE_ORIGINAL_ICONS === "true";
export function AppArtwork({
  id,
  date,
  time = "09:41",
}: {
  id: string;
  date?: string;
  time?: string;
}) {
  const [failed, setFailed] = useState(false);
  const file = originalIconFiles[id];
  if (!originalsEnabled || !file || failed)
    return <DrawnArtwork id={id} date={date} />;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date || "")
    ? new Date(date + "T12:00:00Z")
    : new Date("2026-10-25T12:00:00Z");
  const [hour, minute] = /^\d{2}:\d{2}$/.test(time)
    ? time.split(":").map(Number)
    : [9, 41];
  return (
    <span className="original-icon-wrap" data-original-icon={id}>
      <img
        className="app-artwork original-app-artwork"
        src={import.meta.env.BASE_URL + "icon-assets/" + file}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
      />
      {id === "calendar" && (
        <span className="original-calendar">
          <small>
            {new Intl.DateTimeFormat("zh-TW", {
              weekday: "short",
              timeZone: "UTC",
            }).format(d)}
          </small>
          <b>{d.getUTCDate()}</b>
        </span>
      )}
      {id === "clock" && (
        <svg
          className="original-clock-hands"
          viewBox="0 0 64 64"
          aria-hidden="true"
        >
          <path
            d="M32 34V18"
            stroke="#111"
            strokeWidth="2.3"
            strokeLinecap="round"
            transform={"rotate(" + ((hour % 12) * 30 + minute / 2) + " 32 32)"}
          />
          <path
            d="M32 35V9"
            stroke="#111"
            strokeWidth="1.8"
            strokeLinecap="round"
            transform={"rotate(" + minute * 6 + " 32 32)"}
          />
          <path d="M32 37V7" stroke="#ff8700" strokeWidth=".7" />
          <circle cx="32" cy="32" r="1.4" fill="#ff8700" />
        </svg>
      )}
    </span>
  );
}

export const hasNativeArtwork = (id: string) =>
  native.has(id) ||
  detailedIcons.has(id) ||
  (originalsEnabled && id in originalIconFiles);
