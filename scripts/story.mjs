import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createServer } from "vite";
const [
  mode = "validate",
  file = process.env.STORY_FILE || "stories/template/story.json",
] = process.argv.slice(2);
const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true },
  appType: "custom",
});
let source = "",
  json = "",
  lineOffset = 0;
// Map JSON paths to source positions without executing any author code.
function positions(text) {
  let i = 0;
  const out = new Map();
  const ws = () => {
    while (/\s/.test(text[i] || "") && i < text.length) i++;
  };
  const str = () => {
    const a = i++;
    while (i < text.length) {
      if (text[i++] === '"') break;
      if (text[i - 1] === "\\") i++;
    }
    return JSON.parse(text.slice(a, i));
  };
  function value(p) {
    ws();
    out.set(p, i);
    if (text[i] === "{") {
      i++;
      ws();
      while (text[i] !== "}") {
        const key = str();
        ws();
        i++;
        value(p ? p + "." + key : key);
        ws();
        if (text[i] !== ",") break;
        i++;
        ws();
      }
      i++;
    } else if (text[i] === "[") {
      i++;
      ws();
      let n = 0;
      while (text[i] !== "]") {
        value(p + "." + n++);
        ws();
        if (text[i] !== ",") break;
        i++;
        ws();
      }
      i++;
    } else if (text[i] === '"') str();
    else {
      while (i < text.length && !/[\s,}\]]/.test(text[i])) i++;
    }
  }
  value("");
  return out;
}
try {
  source = await readFile(file, "utf8");
  if (Buffer.byteLength(source) > 100 * 1024 * 1024)
    throw Error("脚本不能超过100MB");
  json = source;
  if (/\.md$/i.test(file)) {
    const match = /```json\s*\n([\s\S]*?)```/.exec(source);
    if (!match)
      throw Error(
        "Markdown 需要一个 ```json 剧情数据块；自然语言由创作 AI 转换，不在运行时调用 AI",
      );
    json = match[1];
    lineOffset =
      source.slice(0, match.index + match[0].indexOf(match[1])).split("\n")
        .length - 1;
  }
  const raw = JSON.parse(json);
  // Merge the small, versioned continuation patch into the large family story at build time.
  // This keeps the original photo-heavy story.json and all embedded media byte-for-byte intact.
  if (file.split("\\").join("/").replace("./", "") === "stories/template/story.json") {
    const continuation = JSON.parse(
      await readFile("stories/template/rose20-kkt.json", "utf8"),
    );
    const chats = new Map((raw.chats || []).map((chat) => [chat.id, chat]));
    for (const addition of continuation.chats || []) {
      const chat = chats.get(addition.id);
      if (!chat) throw Error("續篇引用了不存在的聊天：" + addition.id);
      const ids = new Set(chat.messages.map((message) => message.id));
      for (const message of addition.messages || []) {
        if (!ids.has(message.id)) {
          chat.messages.push(message);
          ids.add(message.id);
        }
      }
    }
    raw.revision = Math.max(raw.revision || 1, continuation.revision || 1);
  }
  // Attach original, unmodified JPEG files only for the authored family story.
  // This keeps the existing multi-megabyte story.json and all player data intact.
  if (file.replace(/\\/g, "/").replace(/^\.\//, "") === "stories/template/story.json") {
    const manifest = JSON.parse(await readFile("stories/template/album-photos.json", "utf8"));
    const existing = raw.content?.photos || [];
    const ids = new Set(existing.map((item) => item.id));
    const added = [];
    for (const photo of manifest.photos) {
      if (!/^[a-zA-Z0-9_.-]+\.jpe?g$/i.test(photo.file))
        throw Error("Invalid album photo filename");
      if (ids.has(photo.id)) continue;
      const originalJpeg = await readFile("stories/template/photos/" + photo.file);
      added.push({
        id: photo.id,
        title: photo.title,
        body: "",
        kind: "image",
        folder: photo.folder,
        media: "data:image/jpeg;base64," + originalJpeg.toString("base64"),
      });
    }
    raw.content = { ...raw.content, photos: [...added, ...existing] };
    raw.revision = (raw.revision || 1) + 1;
  }
  const { compileStory, storySchema } = await server.ssrLoadModule(
    "/src/story-engine/compiler.ts",
  );
  const { story, work } = compileStory(raw);
  if (mode === "test" || mode === "build") {
    const { testStory } = await server.ssrLoadModule(
      "/src/story-engine/testStory.ts",
    );
    const errors = testStory(story, work);
    if (errors.length) throw Error(errors.join("\n"));
  }
  if (mode === "schema") {
    const { z } = await import("zod");
    await mkdir("schemas", { recursive: true });
    await writeFile(
      "schemas/story.schema.json",
      JSON.stringify(z.toJSONSchema(storySchema), null, 2) + "\n",
    );
  } else if (mode === "build") {
    await mkdir("public", { recursive: true });
    await writeFile("public/work.json", JSON.stringify(work, null, 2) + "\n");
    const blank = compileStory(
      JSON.parse(await readFile("stories/blank/story.json", "utf8")),
    ).work;
    await writeFile(
      "public/blank-work.json",
      JSON.stringify(blank, null, 2) + "\n",
    );
    {
      const preview = compileStory(
        JSON.parse(await readFile("stories/test-preview/story.json", "utf8")),
      ).work;
      await writeFile(
        "public/test-work.json",
        JSON.stringify(preview, null, 2) + "\n",
      );
    }
  } else if (!["validate", "test"].includes(mode))
    throw Error("未知命令 " + mode);
  console.log(
    `${file}: ${mode} 通过 (${work.apps.filter((a) => a.installed).length} Apps, ${Object.values(work.data).flat().length} records, ${work.nodes.length} events, ${story.tests.length} paths)`,
  );
} catch (e) {
  let map = new Map();
  try {
    map = positions(json);
  } catch {}
  const issues = e.issues?.map((i) => ({
    field: i.path.join("."),
    message: i.message,
  })) || [{ field: e.field || "", message: e.message }];
  for (const issue of issues) {
    let field = issue.field;
    while (!map.has(field) && field.includes("."))
      field = field.slice(0, field.lastIndexOf("."));
    const syntaxPosition = /position (\d+)/.exec(issue.message);
    const pos = syntaxPosition
      ? Number(syntaxPosition[1])
      : map.get(field) || 0;
    const line = json.slice(0, pos).split("\n").length + lineOffset;
    console.error(`${file}:${line} [${issue.field || "$"}] ${issue.message}`);
  }
  process.exitCode = 1;
} finally {
  await server.close();
}
