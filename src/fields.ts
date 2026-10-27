export type Field = { key: string; label: string; type?: "number" | "text" };
const fields: Record<string, Field[]> = {
  phone: [
    { key: "number", label: "電話號碼" },
    { key: "status", label: "通話狀態" },
  ],
  contacts: [
    { key: "number", label: "電話" },
    { key: "email", label: "電子信箱" },
    { key: "company", label: "公司" },
  ],
  calendar: [
    { key: "location", label: "地點" },
    { key: "duration", label: "持續時間" },
  ],
  clock: [
    { key: "city", label: "城市" },
    { key: "clock", label: "顯示時間" },
  ],
  maps: [
    { key: "address", label: "地址" },
    { key: "x", label: "地圖橫坐標(0–100)", type: "number" },
    { key: "y", label: "地圖縱坐標(0–100)", type: "number" },
  ],
  weather: [
    { key: "temperature", label: "氣溫", type: "number" },
    { key: "condition", label: "天氣狀況" },
    { key: "high", label: "最高溫", type: "number" },
    { key: "low", label: "最低溫", type: "number" },
    { key: "humidity", label: "溼度" },
  ],
  wallet: [
    { key: "amount", label: "金額" },
    { key: "status", label: "交易狀態" },
    { key: "number", label: "卡片尾號" },
  ],
  health: [
    { key: "value", label: "數值", type: "number" },
    { key: "unit", label: "單位" },
    { key: "metric", label: "指標名稱" },
  ],
  find: [
    { key: "location", label: "位置" },
    { key: "status", label: "設備狀態" },
    { key: "x", label: "位置橫坐標", type: "number" },
    { key: "y", label: "位置縱坐標", type: "number" },
  ],
  safari: [{ key: "url", label: "虛構網址" }],
  files: [
    { key: "extension", label: "檔案擴展名" },
    { key: "size", label: "顯示檔案大小" },
  ],
  mail: [
    { key: "email", label: "發件地址" },
    { key: "recipient", label: "收件人" },
  ],
  discord: [
    { key: "server", label: "服務器名稱" },
    { key: "status", label: "成員狀態" },
  ],
  qq: [{ key: "number", label: "QQ號碼" }],
  telegram: [{ key: "handle", label: "用戶名" }],
  alipay: [
    { key: "amount", label: "金額" },
    { key: "status", label: "交易狀態" },
    { key: "merchant", label: "商家" },
    { key: "number", label: "交易單號" },
  ],
  taobao: [
    { key: "price", label: "價格" },
    { key: "status", label: "訂單狀態" },
    { key: "tracking", label: "物流進度" },
    { key: "number", label: "訂單號" },
  ],
  delivery: [
    { key: "price", label: "金額" },
    { key: "status", label: "配送狀態" },
    { key: "address", label: "配送地址" },
    { key: "duration", label: "配送時長" },
    { key: "rating", label: "評分" },
  ],
  reddit: [
    { key: "community", label: "社區名" },
    { key: "votes", label: "虛構投票數", type: "number" },
  ],
  forum: [
    { key: "views", label: "虛構瀏覽數", type: "number" },
    { key: "status", label: "帖子狀態" },
  ],
  twitter: [
    { key: "handle", label: "用戶名" },
    { key: "reposts", label: "虛構轉發數", type: "number" },
  ],
  weibo: [{ key: "reposts", label: "虛構轉發數", type: "number" }],
  netflix: [
    { key: "genre", label: "類型" },
    { key: "duration", label: "時長" },
    { key: "year", label: "年份" },
  ],
  spotify: [
    { key: "album", label: "專輯" },
    { key: "duration", label: "時長" },
  ],
  music: [
    { key: "album", label: "專輯" },
    { key: "duration", label: "時長" },
  ],
  netease: [
    { key: "album", label: "專輯" },
    { key: "duration", label: "時長" },
  ],
  youtube: [
    { key: "views", label: "虛構播放數" },
    { key: "duration", label: "時長" },
  ],
  bilibili: [
    { key: "views", label: "虛構播放數" },
    { key: "duration", label: "時長" },
  ],
  douyin: [{ key: "views", label: "虛構播放數" }],
  tiktok: [{ key: "views", label: "虛構播放數" }],
};
export const getFields = (app: string) => fields[app] ?? [];
