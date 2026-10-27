import JSZip from "jszip";
import { validateWork, type Work, safeMedia } from "./schema";
const MAX = 100 * 1024 * 1024;
export function download(data: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(data);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}
export function jsonExport(w: Work) {
  download(
    new Blob([JSON.stringify(w, null, 2)], { type: "application/json" }),
    `${w.title}.foundphone.json`,
  );
}
export async function backup(w: Work) {
  const zip = new JSZip();
  zip.file("work.json", JSON.stringify(w, null, 2));
  zip.file(
    "README.txt",
    "FoundPhone Studio 完整作品備份。素材以 data URL 儲存在 work.json。可在創作器中直接導入 ZIP。用戶作品的版權由作者自行決定。",
  );
  download(
    await zip.generateAsync({ type: "blob" }),
    `${w.title}.foundphone.zip`,
  );
}
export async function importWork(file: File) {
  if (file.size > MAX) throw Error("檔案不能大於 100 MB");
  let source: string;
  if (file.name.toLowerCase().endsWith(".zip")) {
    const zip = await JSZip.loadAsync(file);
    let total = 0;
    for (const entry of Object.values(zip.files)) {
      if (
        entry.name.includes("..") ||
        entry.name.startsWith("/") ||
        entry.name.includes("\\") ||
        (entry.unsafeOriginalName && entry.unsafeOriginalName !== entry.name)
      )
        throw Error("ZIP 包含不安全路徑");
      const size =
        (entry as unknown as { _data?: { uncompressedSize: number } })._data
          ?.uncompressedSize ?? 0;
      total += size;
      if (total > MAX) throw Error("ZIP 解壓體積過大");
    }
    const entry = zip.file("work.json");
    if (!entry) throw Error("ZIP 中缺少 work.json");
    source = await entry.async("string");
  } else if (file.name.toLowerCase().endsWith(".json"))
    source = await file.text();
  else throw Error("請選擇 JSON 或 ZIP");
  if (source.length > MAX) throw Error("作品過大");
  const w = validateWork(JSON.parse(source));
  for (const items of Object.values(w.data))
    for (const item of items)
      if (item.media && !safeMedia(item.media))
        throw Error("作品含不支持的媒體地址");
  return w;
}
export async function staticExport(w: Work) {
  const zip = new JSZip();
  const manifest = await fetch("./player-runtime/manifest.json").then((r) => {
    if (!r.ok)
      throw Error(
        "請先運行 npm run build，再使用 npm run preview 導出獨立網頁",
      );
    return r.json() as Promise<string[]>;
  });
  for (const file of manifest) {
    if (file.includes("..")) throw Error("無效運行器資源");
    const r = await fetch(`./player-runtime/${file}`);
    if (!r.ok) throw Error("運行器資源缺失");
    zip.file(file === "player.html" ? "index.html" : file, await r.blob());
  }
  zip.file("work.json", JSON.stringify(w));
  zip.file(
    "DEPLOY.txt",
    "將此目錄上傳到 GitHub Pages、Cloudflare Pages、Vercel 或任意靜態服務器。不包含創作器。雙擊 index.html 會受瀏覽器模塊安全策略限制，請通過 HTTP(S) 訪問。本地預覽：npx serve .\n請保留 LICENSE、THIRD_PARTY_LICENSES.txt 和 BRAND_NOTICE.txt。",
  );
  download(await zip.generateAsync({ type: "blob" }), `${w.title}-player.zip`);
}
export async function mediaData(file: File) {
  if (file.size > 20 * 1024 * 1024) throw Error("單個素材上限 20 MB");
  if (
    !/^image\/(png|jpeg|webp|gif)$|^audio\/(mpeg|mp3|wav|ogg|webm|mp4)$|^video\/(mp4|webm)$/.test(
      file.type,
    )
  )
    throw Error("僅支持 PNG/JPEG/WebP/GIF、常用音頻、MP4/WebM");
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  if (!file.type.startsWith("image/") || file.type === "image/gif") return data;
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, 1600 / Math.max(img.width, img.height));
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas
        .getContext("2d")
        ?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", 0.85));
    };
    img.onerror = reject;
    img.src = data;
  });
}
