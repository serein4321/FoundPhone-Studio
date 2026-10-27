import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List } from "lucide-react";
import type { Item } from "./schema";
import { parseRichText } from "./RichText";
export default function RichEditor({
  item,
  onChange,
}: {
  item: Item;
  onChange: (patch: Pick<Item, "body" | "richText">) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content:
      parseRichText(item.richText) ??
      `<p>${item.body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "</p><p>")}</p>`,
    onUpdate: ({ editor }) =>
      onChange({
        body: editor.getText({ blockSeparator: "\n" }),
        richText: JSON.stringify(editor.getJSON()),
      }),
  });
  return (
    <>
      <div className="rich-toolbar">
        <button
          type="button"
          title="粗體"
          aria-label="粗體"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          title="斜體"
          aria-label="斜體"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          title="清單"
          aria-label="清單"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </button>
        <small>支持粗體、斜體與清單</small>
      </div>
      <EditorContent editor={editor} />
    </>
  );
}
