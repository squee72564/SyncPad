"use client";

import { useEffect, useMemo } from "react";
import { useEditor, EditorContent, EditorContext } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

import type { DocumentCollabStateRecord, DocumentRecord } from "@/lib/documents";

type DocumentEditorProps = {
  document: DocumentRecord;
  collabState: DocumentCollabStateRecord | null;
  readOnly: boolean;
};

export default function DocumentEditor({ document, collabState, readOnly }: DocumentEditorProps) {
  const ydoc = useMemo(() => new Y.Doc(), [document.id]);

  const provider = useMemo(() => {
    const p = new HocuspocusProvider({
      url: `ws://localhost:3001/v1/collaboration?document=${document.id}`,
      name: `${document.title}-${document.id}`,
      document: ydoc,
    });
    p.connect();
    return p;
  }, [document.id, ydoc]);

  useEffect(() => {
    return () => {
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Collaboration.configure({
        document: ydoc,
        field: "content",
      }),
    ],
    editable: !readOnly,
    immediatelyRender: false,
  });

  const providerValue = useMemo(() => ({ editor }), [editor]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Initializing editor…
      </div>
    );
  }

  return (
    <EditorContext.Provider value={providerValue}>
      <div className="rounded-lg border bg-card shadow-sm w-full">
        <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
          <span>{readOnly ? "Read-only mode" : "Draft editor"}</span>
        </div>
        <div className="prose max-w-none">
          <EditorContent editor={editor} className="min-h-[320px] px-4 py-6" />
        </div>
      </div>
    </EditorContext.Provider>
  );
}
