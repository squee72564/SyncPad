"use client";

import { useEffect, useMemo } from "react";
import { useEditor, EditorContent, EditorContext } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";

import type { DocumentRecord } from "@/lib/documents";
import useCollaborationProvider from "@/hooks/use-collaborationProvider";

type EditorUser = {
  id: string;
  name: string;
};

type DocumentEditorProps = {
  document: DocumentRecord;
  readOnly: boolean;
  currentUser: EditorUser;
};

export default function DocumentEditor({ document, readOnly, currentUser }: DocumentEditorProps) {
  const { ydoc, provider, cursorColor } = useCollaborationProvider(document.id, currentUser);

  const cursorName = currentUser.name;

  const collaborationExtension = useMemo(() => {
    return Collaboration.configure({
      document: ydoc,
      field: "content",
    }).extend({ priority: 200 });
  }, [ydoc]);

  const collaborationCursorExtension = useMemo(() => {
    return CollaborationCaret.configure({
      provider,
      user: {
        name: cursorName,
        color: cursorColor,
      },
    }).extend({ priority: 150 });
  }, [provider, cursorColor, cursorName]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          undoRedo: false,
        }),
        collaborationExtension,
        collaborationCursorExtension,
      ],
      editable: !readOnly,
      immediatelyRender: false,
    },
    [collaborationCursorExtension, collaborationExtension, readOnly]
  );

  useEffect(() => {
    if (!editor || !provider) {
      return;
    }

    editor.commands.updateUser({ name: cursorName, color: cursorColor });
  }, [cursorColor, cursorName, editor, provider]);

  const providerValue = useMemo(() => ({ editor }), [editor]);

  useEffect(() => {
    return () => {
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

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
