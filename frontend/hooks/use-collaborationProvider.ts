import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useMemo } from "react";

type EditorUser = {
  id: string;
  name: string;
};

const CURSOR_COLORS = ["#2563eb", "#d946ef", "#f97316", "#14b8a6", "#f43f5e", "#8b5cf6", "#22c55e"];

const pickCursorColor = (seed?: string | null) => {
  if (!seed) {
    return CURSOR_COLORS[0];
  }

  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
};

export default function useCollaborationProvider(documentId: string, currentUser: EditorUser) {
  const ydoc = useMemo(() => new Y.Doc(), []);

  const cursorColor = useMemo(() => pickCursorColor(currentUser.id), [currentUser.id]);

  const provider = useMemo(() => {
    const p = new HocuspocusProvider({
      url: `ws://localhost:3001/v1/collaboration?document=${documentId}`,
      name: documentId,
      document: ydoc,
    });

    return p;
  }, [documentId, ydoc]);

  useEffect(() => {
    if (!provider || !ydoc) {
      return;
    }

    provider.setAwarenessField("user", {
      id: currentUser.id,
      name: currentUser.name,
      color: cursorColor,
    });

    provider.connect();

    return () => {
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc, currentUser.id, currentUser.name, cursorColor]);

  return { ydoc, provider, cursorColor };
}
