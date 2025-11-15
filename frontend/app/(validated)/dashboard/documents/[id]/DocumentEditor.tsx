"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useEditor, EditorContent, EditorContext } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useDebounce } from "@/hooks/use-debounce";
import type { DocumentCollabStateRecord, DocumentRecord } from "@/lib/documents";
import { saveDocumentCollabStateAction } from "../actions";
import { toast } from "sonner";

type DocumentEditorProps = {
  document: DocumentRecord;
  collabState: DocumentCollabStateRecord | null;
  readOnly: boolean;
};

const EMPTY_DOC = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};

export default function DocumentEditor({ document, collabState, readOnly }: DocumentEditorProps) {
  const [version, setVersion] = useState(collabState?.version ?? 0);
  const [isSaving, startTransition] = useTransition();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [pendingSnapshot, setPendingSnapshot] = useState<unknown | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: (collabState?.snapshot as object) ?? (document.content as object) ?? EMPTY_DOC,
    editable: !readOnly,
    immediatelyRender: false,
  });

  const providerValue = useMemo(() => ({ editor }), [editor]);

  const debouncedSnapshot = useDebounce(pendingSnapshot, 2000);

  useEffect(() => {
    if (!editor || readOnly) {
      return;
    }

    const updateListener = () => {
      setPendingSnapshot(editor.getJSON());
    };

    editor.on("update", updateListener);
    return () => {
      editor.off("update", updateListener);
    };
  }, [editor, readOnly]);

  useEffect(() => {
    if (!debouncedSnapshot || readOnly) {
      return;
    }

    startTransition(async () => {
      const result = await saveDocumentCollabStateAction({
        documentId: document.id,
        snapshot: debouncedSnapshot,
        version,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setVersion(result.version);
      setLastSavedAt(new Date());
      setPendingSnapshot(null);
    });
  }, [debouncedSnapshot, document.id, readOnly, version]);

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
          <span>
            {isSaving
              ? "Saving…"
              : lastSavedAt
                ? `Saved ${lastSavedAt.toLocaleTimeString()}`
                : "All changes saved"}
          </span>
        </div>
        <div className="prose max-w-none">
          <EditorContent editor={editor} className="min-h-[320px] px-4 py-6" />
        </div>
      </div>
    </EditorContext.Provider>
  );
}
