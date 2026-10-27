import { makeItem, type Item } from "./schema";
export function parseChat(text: string): { items: Item[]; errors: string[] } {
  const errors: string[] = [];
  const items: Item[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const match = line.match(/^\[([^\]]+)\]\s*([^：:]+)[：:]\s*(.+)$/);
    if (!match) {
      errors.push(`第 ${index + 1} 行：應為 [時間] 傳送者：訊息`);
      return;
    }
    const [, time, sender, body] = match;
    items.push(
      makeItem({
        title: sender.trim() === "我" ? "小林" : sender.trim(),
        sender: sender.trim(),
        body,
        time,
        outgoing: sender.trim() === "我",
      }),
    );
  });
  return { items, errors };
}
export function parseCsv(text: string): { items: Item[]; errors: string[] } {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if (c === "\n" && !quoted) {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  if (row.some(Boolean)) rows.push(row);
  if (quoted) return { items: [], errors: ["CSV 引號未閉合"] };
  const header = rows.shift()?.map((s) => s.trim()) ?? [];
  const indexes = ["time", "sender", "body"].map((k) => header.indexOf(k));
  if (indexes.includes(-1))
    return { items: [], errors: ["CSV 必須包含 time,sender,body 列"] };
  return {
    items: rows.map((r) =>
      makeItem({
        time: r[indexes[0]] ?? "",
        sender: r[indexes[1]] ?? "",
        title: r[indexes[1]] ?? "",
        body: r[indexes[2]] ?? "",
        outgoing: r[indexes[1]] === "我",
      }),
    ),
    errors: [],
  };
}
