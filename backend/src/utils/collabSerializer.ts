import { applyUpdate, Doc } from "yjs";

const BLOCK_BREAK = "\n\n";

const decodeSnapshot = (snapshot: string | null | undefined): Doc | null => {
  if (!snapshot) {
    return null;
  }

  try {
    const bytes = Buffer.from(snapshot, "base64");
    const doc = new Doc();
    applyUpdate(doc, bytes);
    return doc;
  } catch (_error) {
    return null;
  }
};

const stripHtmlToPlainText = (html: string): string => {
  if (!html) {
    return "";
  }

  return (
    html
      // Normalize common block boundaries into paragraph breaks
      .replace(/<\/(p|div|h[1-6]|li|ul|ol|blockquote)>/gi, BLOCK_BREAK)
      .replace(/<br\s*\/?>/gi, "\n")
      // Remove the remaining tags
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      // Collapse repeated whitespace/newlines
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, BLOCK_BREAK)
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
};

/**
 * Convert a stored collaboration snapshot (base64 Yjs update) into a plain text string that
 * can be embedded or stored alongside the canonical document content.
 */
export const collabSnapshotToPlainText = (snapshot: string | null | undefined): string => {
  const doc = decodeSnapshot(snapshot);
  if (!doc) {
    return "";
  }

  const fragment = doc.getXmlFragment("content");
  if (!fragment) {
    return "";
  }

  const html = fragment.toString();
  return stripHtmlToPlainText(html);
};
